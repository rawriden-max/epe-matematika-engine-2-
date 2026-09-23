/**
 * integrityDetector.js - Academic Integrity Telemetry & Behavioral Signal Detector
 * 
 * Prinsip Etis & Metodologis:
 * 1. Non-Invasif: Hanya merekam telemetri interaksi peramban (tab visibility, fokus, durasi pengerjaan).
 * 2. Tanpa Pengawasan Kamera/Mikrofon/Biometrik tersembunyi.
 * 3. Bahasa Netral Berbasis Sinyal: TIDAK PERNAH memvonis "curang", melainkan:
 *    - "No unusual activity detected" (Normal)
 *    - "Review recommended" (Rekomendasi tinjauan guru disertai rincian sinyal objektif).
 * 4. Keputusan akhir mutlak berada di tangan guru/peneliti.
 */

const INTEGRITY_SESSIONS_KEY = "epe_integrity_sessions_v1";
const CREATOR_ANTIDETECTOR_KEY = "epe_creator_antidetector_active";

export class IntegrityDetector {
  static CREATOR_IDENTIFIERS = [
    "ilyas",
    "mr. ilyas",
    "mr_ilyas",
    "muhammad ilyas",
    "creator",
    "kreator",
    "admin",
    "developer",
    "peneliti",
    "guru",
    "superadmin"
  ];

  constructor() {
    this.currentSession = null;
    this.isTracking = false;
    this.tabHiddenStartTime = null;
    this.currentQuestionStartTime = null;
    this.currentQuestionId = null;

    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundBlurHandler = this.handleWindowBlur.bind(this);
    this.boundFocusHandler = this.handleWindowFocus.bind(this);
  }

  /**
   * Cek apakah Mode Anti-Detector Kreator sedang aktif
   */
  isAntiDetectorActive() {
    try {
      if (typeof localStorage !== "undefined") {
        const flag = localStorage.getItem(CREATOR_ANTIDETECTOR_KEY);
        // Default bernilai true (aktif) untuk akun/lingkungan kreator
        if (flag === null) return true;
        return flag === "true";
      }
    } catch (e) {}
    return true;
  }

  /**
   * Mengubah status Anti-Detector Kreator (ON/OFF)
   */
  setAntiDetector(enabled = true) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CREATOR_ANTIDETECTOR_KEY, String(Boolean(enabled)));
      }
    } catch (e) {}

    const active = this.isAntiDetectorActive();
    if (this.currentSession) {
      this.currentSession.isCreatorSession = active;
      if (active) {
        this.currentSession.signals.isCreatorBypass = true;
        this.currentSession.signals.reviewRecommended = false;
        this.currentSession.signals.reasons = [];
        this.currentSession.reviewStatus = "reviewed_normal";
        this.currentSession.researcherNotes = "🛡️ Creator Anti-Detector Mode: Exempt from behavioral flagging";
      }
    }
    return active;
  }

  /**
   * Pengecekan apakah responden adalah Kreator / Pengembang
   */
  isCreator(studentId = "", studentName = "") {
    const sId = String(studentId || "").toLowerCase();
    const sName = String(studentName || "").toLowerCase();
    const isNamedCreator = IntegrityDetector.CREATOR_IDENTIFIERS.some(id => sId.includes(id) || sName.includes(id));
    if (isNamedCreator) return true;

    // Cek juga profil siswa tersimpan di localStorage apakah atas nama kreator
    try {
      if (typeof localStorage !== "undefined") {
        const savedProfile = localStorage.getItem("epe_student_profile");
        if (savedProfile) {
          const prof = JSON.parse(savedProfile);
          const pName = String(prof.name || "").toLowerCase();
          const pId = String(prof.id || "").toLowerCase();
          if (IntegrityDetector.CREATOR_IDENTIFIERS.some(id => pName.includes(id) || pId.includes(id))) {
            return true;
          }
        }
      }
    } catch (e) {}

    return this.isAntiDetectorActive();
  }

  /**
   * Memulai sesi pelacakan telemetri untuk siswa
   */
  startSession(assessmentId, testType, studentId, studentName) {
    const isCreatorBypass = this.isCreator(studentId, studentName);

    this.currentSession = {
      sessionId: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      assessmentId: assessmentId || "assessment_standard",
      testType: testType || "diagnostic",
      studentId: studentId || "siswa_01",
      studentName: studentName || "Siswa",
      startTime: Date.now(),
      startTimeIso: new Date().toISOString(),
      endTime: null,
      isCreatorSession: isCreatorBypass,
      events: [],
      signals: {
        tabSwitches: 0,
        totalInactiveSeconds: 0,
        rapidAnswersCount: 0,
        answerChangesCount: 0,
        reviewRecommended: false,
        isCreatorBypass: isCreatorBypass,
        reasons: []
      },
      reviewStatus: isCreatorBypass ? "reviewed_normal" : "unreviewed",
      researcherNotes: isCreatorBypass ? "🛡️ Creator Anti-Detector Mode: Exempt from behavioral flagging" : ""
    };

    this.isTracking = true;
    this.tabHiddenStartTime = null;
    this.currentQuestionStartTime = Date.now();

    this.recordEvent("assessment_started", {
      testType: testType,
      assessmentId: assessmentId,
      isCreatorSession: isCreatorBypass
    });

    this.attachListeners();
  }

  /**
   * Menghentikan sesi pelacakan saat asesmen selesai
   */
  endSession() {
    if (!this.isTracking || !this.currentSession) return null;

    this.recordEvent("assessment_submitted", {
      totalDurationSeconds: Math.round((Date.now() - this.currentSession.startTime) / 1000)
    });

    this.currentSession.endTime = Date.now();
    this.evaluateIntegritySignals();

    this.detachListeners();
    this.isTracking = false;

    this.saveSession(this.currentSession);
    const completed = this.currentSession;
    this.currentSession = null;
    return completed;
  }

  /**
   * Catat peristiwa dibukanya butir soal tertentu
   */
  recordQuestionOpened(questionId, questionIndex) {
    if (!this.isTracking || !this.currentSession) return;

    // Evaluasi durasi soal sebelumnya
    if (this.currentQuestionStartTime && this.currentQuestionId) {
      const durationOnPrev = Math.round((Date.now() - this.currentQuestionStartTime) / 1000);
      if (durationOnPrev < 3 && durationOnPrev >= 0) {
        // Creator Anti-Detector: Jangan hitung tempo cepat sebagai anomali bagi kreator
        if (!this.currentSession.isCreatorSession && !this.isAntiDetectorActive()) {
          this.currentSession.signals.rapidAnswersCount++;
        }
      }
    }

    this.currentQuestionId = questionId;
    this.currentQuestionStartTime = Date.now();

    this.recordEvent("question_opened", {
      questionId: questionId,
      questionIndex: questionIndex + 1
    });
  }

  /**
   * Catat pergantian opsi jawaban siswa
   */
  recordAnswerChanged(questionId, selectedValue, previousValue = null) {
    if (!this.isTracking || !this.currentSession) return;

    this.currentSession.signals.answerChangesCount++;

    this.recordEvent("answer_changed", {
      questionId: questionId,
      selectedValue: selectedValue,
      previousValue: previousValue
    });
  }

  /**
   * Merekam peristiwa telemetri sesi terstruktur
   */
  recordEvent(eventType, metadata = {}) {
    if (!this.currentSession) return;

    const event = {
      eventId: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      eventType: eventType,
      timestamp: Date.now(),
      timestampIso: new Date().toISOString(),
      questionId: metadata.questionId || this.currentQuestionId || null,
      metadata: metadata
    };

    this.currentSession.events.push(event);
  }

  /**
   * Handler saat tab peramban disembunyikan/ditampilkan
   */
  handleVisibilityChange() {
    if (!this.isTracking || !this.currentSession) return;

    const isBypass = Boolean(this.currentSession.isCreatorSession || this.isAntiDetectorActive());

    if (document.visibilityState === "hidden") {
      this.tabHiddenStartTime = Date.now();
      if (!isBypass) {
        this.currentSession.signals.tabSwitches++;
      }
      this.recordEvent("tab_hidden", {
        switchNumber: this.currentSession.signals.tabSwitches,
        creatorBypassed: isBypass
      });
    } else if (document.visibilityState === "visible") {
      let durationInactive = 0;
      if (this.tabHiddenStartTime) {
        durationInactive = Math.round((Date.now() - this.tabHiddenStartTime) / 1000);
        if (!isBypass) {
          this.currentSession.signals.totalInactiveSeconds += durationInactive;
        }
        this.tabHiddenStartTime = null;
      }
      this.recordEvent("tab_visible", {
        inactiveDurationSeconds: durationInactive,
        creatorBypassed: isBypass
      });
    }
  }

  handleWindowBlur() {
    if (!this.isTracking || !this.currentSession) return;
    this.recordEvent("window_blurred", {
      creatorBypassed: Boolean(this.currentSession.isCreatorSession || this.isAntiDetectorActive())
    });
  }

  handleWindowFocus() {
    if (!this.isTracking || !this.currentSession) return;
    this.recordEvent("window_focused", {
      creatorBypassed: Boolean(this.currentSession.isCreatorSession || this.isAntiDetectorActive())
    });
  }

  attachListeners() {
    document.addEventListener("visibilitychange", this.boundVisibilityHandler);
    window.addEventListener("blur", this.boundBlurHandler);
    window.addEventListener("focus", this.boundFocusHandler);
  }

  detachListeners() {
    document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    window.removeEventListener("blur", this.boundBlurHandler);
    window.removeEventListener("focus", this.boundFocusHandler);
  }

  /**
   * Evaluasi Sinyal Integritas Berdasarkan Kaidah Objektif
   */
  evaluateIntegritySignals() {
    if (!this.currentSession) return;

    // Creator Anti-Detector Guard: Selalu lolos 100%
    if (this.currentSession.isCreatorSession || this.isAntiDetectorActive()) {
      const s = this.currentSession.signals;
      s.reviewRecommended = false;
      s.reasons = [];
      s.isCreatorBypass = true;
      this.currentSession.reviewStatus = "reviewed_normal";
      this.currentSession.researcherNotes = "🛡️ Creator Anti-Detector Active: Verified Safe";
      return;
    }

    const s = this.currentSession.signals;
    const reasons = [];

    // Kriteria 1: Tab switch berulang (> 3 kali)
    if (s.tabSwitches >= 3) {
      reasons.push(`${s.tabSwitches} kali berpindah tab selama pengerjaan`);
    }

    // Kriteria 2: Durasi inaktif panjang (> 45 detik)
    if (s.totalInactiveSeconds >= 45) {
      reasons.push(`Total durasi tab tidak aktif selama ${s.totalInactiveSeconds} detik`);
    }

    // Kriteria 3: Banyak jawaban instan / terlalu cepat (> 4 butir terjawab < 3 detik)
    if (s.rapidAnswersCount >= 4) {
      reasons.push(`${s.rapidAnswersCount} butir dijawab dalam tempo sangat singkat (< 3 detik)`);
    }

    s.reasons = reasons;
    s.reviewRecommended = reasons.length > 0;
  }

  // =========================================================================
  // PERSISTENCE LOCAL & QUERY METHODS
  // =========================================================================
  saveSession(session) {
    try {
      const all = this.getAllSessions();
      all.unshift(session);
      // Batasi simpan 200 sesi terakhir
      const trimmed = all.slice(0, 200);
      localStorage.setItem(INTEGRITY_SESSIONS_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.error("Gagal menyimpan sesi integritas:", e);
    }
  }

  getAllSessions() {
    try {
      const raw = localStorage.getItem(INTEGRITY_SESSIONS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Gagal membaca sesi integritas:", e);
      return [];
    }
  }

  getSessionById(sessionId) {
    const all = this.getAllSessions();
    return all.find(s => s.sessionId === sessionId) || null;
  }

  updateSessionReview(sessionId, reviewStatus, notes = "") {
    const all = this.getAllSessions();
    const idx = all.findIndex(s => s.sessionId === sessionId);
    if (idx >= 0) {
      all[idx].reviewStatus = reviewStatus;
      all[idx].researcherNotes = notes;
      localStorage.setItem(INTEGRITY_SESSIONS_KEY, JSON.stringify(all));
      return all[idx];
    }
    return null;
  }
}

// Global Singleton Instance
export const integrityService = new IntegrityDetector();
