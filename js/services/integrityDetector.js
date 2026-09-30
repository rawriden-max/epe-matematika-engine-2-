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
    this.lastCopyTime = null;

    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundBlurHandler = this.handleWindowBlur.bind(this);
    this.boundFocusHandler = this.handleWindowFocus.bind(this);
    this.boundKeyHandler = this.handleKeyDown.bind(this);
    this.boundCopyHandler = this.handleCopy.bind(this);
    this.boundPasteHandler = this.handlePaste.bind(this);
    this.boundContextMenuHandler = this.handleContextMenu.bind(this);
    this.boundDragStartHandler = this.handleDragStart.bind(this);
  }

  /**
   * Cek apakah Mode Anti-Detector Kreator sedang aktif
   */
  isAntiDetectorActive() {
    try {
      if (typeof localStorage !== "undefined") {
        const flag = localStorage.getItem(CREATOR_ANTIDETECTOR_KEY);
        // Default bernilai true (aktif) untuk akun/lingkungan kreator jika belum pernah diatur
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
    const nextState = Boolean(enabled);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CREATOR_ANTIDETECTOR_KEY, String(nextState));
      }
    } catch (e) {}

    if (this.currentSession) {
      const isCreatorIdentity = this.isCreatorUser(this.currentSession.studentId, this.currentSession.studentName);
      const isBypass = isCreatorIdentity && nextState;
      this.currentSession.isCreatorSession = isBypass;
      this.currentSession.signals.isCreatorBypass = isBypass;
      if (isBypass) {
        this.currentSession.signals.reviewRecommended = false;
        this.currentSession.signals.reasons = [];
        this.currentSession.reviewStatus = "reviewed_normal";
        this.currentSession.researcherNotes = "🛡️ Creator Anti-Detector Mode: Exempt from behavioral flagging";
      } else {
        // Jika dimatikan, evaluasi ulang sinyal secara nyata
        this.evaluateIntegritySignals();
      }
    }
    return nextState;
  }

  /**
   * Pengecekan identitas apakah responden adalah Kreator / Pengembang (tanpa memandang status toggle)
   */
  isCreatorUser(studentId = "", studentName = "") {
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

    return false;
  }

  /**
   * Pengecekan apakah responden adalah Kreator DAN fitur Anti-Detector sedang aktif
   */
  isCreator(studentId = "", studentName = "") {
    // KUNCI: Jika pengguna mematikan Anti-Detector, matikan seluruh bypass proteksi!
    if (!this.isAntiDetectorActive()) {
      return false;
    }
    return this.isCreatorUser(studentId, studentName);
  }

  /**
   * Memulai sesi pelacakan telemetri untuk siswa
   */
  startSession(assessmentId, testType, studentId, studentName, subject = "matematika", studentClass = "") {
    const isCreatorBypass = this.isCreator(studentId, studentName);
    const resolvedClass = studentClass || (typeof localStorage !== "undefined" ? localStorage.getItem("epe_student_class") : "") || "";

    this.currentSession = {
      sessionId: `ses_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      assessmentId: assessmentId || "assessment_standard",
      testType: testType || "diagnostic",
      subject: subject || "matematika",
      studentClass: resolvedClass,
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
        matrixAiOpenedCount: 0,
        googleLensAttempts: 0,
        screenshotAttempts: 0,
        clipboardAttempts: 0,
        devToolsAttempts: 0,
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
    this.lastCopyTime = null;

    this.recordEvent("assessment_started", {
      testType: testType,
      assessmentId: assessmentId,
      isCreatorSession: isCreatorBypass,
      isSuspicious: false
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
        this.currentSession.signals.rapidAnswersCount = (this.currentSession.signals.rapidAnswersCount || 0) + 1;
        // Catat sebagai tebak cepat / ngasal (BUKAN anomali kecurangan)
        this.recordEvent("rapid_guess", {
          questionId: this.currentQuestionId,
          durationSeconds: durationOnPrev,
          isSuspicious: false,
          summary: `Pengerjaan kilat (~${durationOnPrev} detik - Siswa tebak cepat / ngasal)`
        });
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

    const isBypass = Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive());

    if (document.visibilityState === "hidden") {
      this.tabHiddenStartTime = Date.now();
      if (!isBypass) {
        this.currentSession.signals.tabSwitches++;
      }
      this.recordEvent("tab_hidden", {
        switchNumber: this.currentSession.signals.tabSwitches,
        creatorBypassed: isBypass,
        isSuspicious: true,
        summary: `Meninggalkan tab asesmen (Pindah Tab #${this.currentSession.signals.tabSwitches})`
      });

      // KORELASI PENCARIAN AI / GOOGLE LENS: Siswa menyalin soal lalu keluar tab dalam 10 detik
      if (this.lastCopyTime && (Date.now() - this.lastCopyTime < 10000)) {
        this.recordGoogleLensAttempt("Salin Teks Soal & Keluar Tab (Indikasi Pencarian AI / Google Lens / ChatGPT)", "Copy + Switch Tab");
      }
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
        creatorBypassed: isBypass,
        isSuspicious: durationInactive >= 10,
        summary: `Kembali ke tab asesmen setelah inaktif selama ${durationInactive} detik`
      });
    }
  }

  handleWindowBlur() {
    if (!this.isTracking || !this.currentSession) return;
    this.recordEvent("window_blurred", {
      creatorBypassed: Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive()),
      isSuspicious: false
    });
  }

  handleWindowFocus() {
    if (!this.isTracking || !this.currentSession) return;
    this.recordEvent("window_focused", {
      creatorBypassed: Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive()),
      isSuspicious: false
    });
  }

  /**
   * Deteksi penekanan tombol berbahaya (Screenshot, DevTools, dsb)
   */
  handleKeyDown(e) {
    if (!this.isTracking || !this.currentSession) return;

    // 1. Tangkapan Layar: PrintScreen
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      this.recordScreenshotAttempt("Tombol PrintScreen");
    }
    // 2. Shortcut Screenshot OS / Snipping / Google Lens: Win/Cmd+Shift+S atau Ctrl+Shift+S
    else if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s")) {
      this.recordScreenshotAttempt("Shortcut Snipping / Tangkapan Layar (Win/Ctrl+Shift+S)");
      this.recordGoogleLensAttempt("Shortcut Snipping / Pencarian Layar (Win+Shift+S)", "Screen Capture");
    }
    // 3. Shortcut Cetak Layar: Ctrl/Cmd+P
    else if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
      this.recordScreenshotAttempt("Shortcut Print Dokumen (Ctrl+P)");
    }
    // 4. Developer Tools / Inspect Element: F12
    else if (e.key === "F12") {
      this.recordDevToolsAttempt("Tombol F12 Inspect Element");
    }
    // 5. Developer Tools Shortcut: Ctrl/Cmd+Shift+I / J / C
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
      this.recordDevToolsAttempt("Shortcut DevTools (Ctrl+Shift+" + e.key.toUpperCase() + ")");
    }
    // 6. View Source: Ctrl/Cmd+U
    else if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
      this.recordDevToolsAttempt("Shortcut View Source (Ctrl+U)");
    }
  }

  handleCopy(e) {
    if (!this.isTracking || !this.currentSession) return;
    this.lastCopyTime = Date.now();
    this.recordClipboardAttempt("copy");
  }

  handlePaste(e) {
    if (!this.isTracking || !this.currentSession) return;
    this.recordClipboardAttempt("paste");
  }

  /**
   * Deteksi klik kanan pada area soal (Menu konteks: Telusuri dengan Google Lens / Cari di Web)
   */
  handleContextMenu(e) {
    if (!this.isTracking || !this.currentSession) return;
    const isExamArea = Boolean(e.target.closest("#diagnostic-question-container, #pretest-container, #posttest-container, #practice-workstation, .epe-question-card, .katex, img, svg, canvas"));
    if (isExamArea) {
      this.recordGoogleLensAttempt("Klik Kanan Soal / Gambar (Menu Konteks: Cari dengan Google Lens)", "Context Menu / Google Lens");
    }
  }

  /**
   * Deteksi drag gambar atau formula soal ke luar jendela
   */
  handleDragStart(e) {
    if (!this.isTracking || !this.currentSession) return;
    const isExamMedia = Boolean(e.target.closest("img, svg, .katex, canvas"));
    if (isExamMedia) {
      this.recordGoogleLensAttempt("Drag & Drop Gambar / Formula Soal (Potensi Unggah ke Google Lens)", "Drag Media");
    }
  }

  /**
   * Catat interaksi membuka Chat / Drawer Matrix AI saat asesmen berlangsung
   */
  recordMatrixAiAccess() {
    if (!this.isTracking || !this.currentSession) return;
    const isBypass = Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive());
    if (!isBypass) {
      this.currentSession.signals.matrixAiOpenedCount = (this.currentSession.signals.matrixAiOpenedCount || 0) + 1;
    }
    this.recordEvent("matrix_ai_opened", {
      isSuspicious: true,
      creatorBypassed: isBypass,
      summary: "Membuka Asisten Chat Matrix AI saat asesmen berlangsung"
    });
  }

  /**
   * Catat indikasi penggunaan Google Lens atau Pencarian Eksternal AI
   */
  recordGoogleLensAttempt(method = "Pencarian Gambar / Google Lens", detail = "") {
    if (!this.isTracking || !this.currentSession) return;
    const isBypass = Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive());
    if (!isBypass) {
      this.currentSession.signals.googleLensAttempts = (this.currentSession.signals.googleLensAttempts || 0) + 1;
    }
    this.recordEvent("google_lens_attempt", {
      isSuspicious: true,
      creatorBypassed: isBypass,
      method: method,
      detail: detail,
      summary: method
    });
  }

  /**
   * Catat upaya tangkapan layar (screenshot)
   */
  recordScreenshotAttempt(method = "Shortcut Layar") {
    if (!this.isTracking || !this.currentSession) return;
    const isBypass = Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive());
    if (!isBypass) {
      this.currentSession.signals.screenshotAttempts = (this.currentSession.signals.screenshotAttempts || 0) + 1;
    }
    this.recordEvent("screenshot_attempt", {
      isSuspicious: true,
      creatorBypassed: isBypass,
      method: method,
      summary: `Upaya tangkapan layar terdeteksi (${method})`
    });
  }

  /**
   * Catat aktivitas copy-paste soal
   */
  recordClipboardAttempt(action = "copy") {
    if (!this.isTracking || !this.currentSession) return;
    const isBypass = Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive());
    if (!isBypass) {
      this.currentSession.signals.clipboardAttempts = (this.currentSession.signals.clipboardAttempts || 0) + 1;
    }
    this.recordEvent("clipboard_attempt", {
      isSuspicious: true,
      creatorBypassed: isBypass,
      action: action,
      summary: action === "copy" ? "Menyalin teks butir soal ke clipboard (Copy)" : "Menempelkan teks dari luar ke lembar kerja (Paste)"
    });
  }

  /**
   * Catat upaya membuka developer tools / inspect element
   */
  recordDevToolsAttempt(detail = "F12 Inspect") {
    if (!this.isTracking || !this.currentSession) return;
    const isBypass = Boolean(this.currentSession.isCreatorSession && this.isAntiDetectorActive());
    if (!isBypass) {
      this.currentSession.signals.devToolsAttempts = (this.currentSession.signals.devToolsAttempts || 0) + 1;
    }
    this.recordEvent("devtools_attempt", {
      isSuspicious: true,
      creatorBypassed: isBypass,
      detail: detail,
      summary: `Mencoba membuka inspect element / devtools (${detail})`
    });
  }

  attachListeners() {
    document.addEventListener("visibilitychange", this.boundVisibilityHandler);
    window.addEventListener("blur", this.boundBlurHandler);
    window.addEventListener("focus", this.boundFocusHandler);
    window.addEventListener("keydown", this.boundKeyHandler, true);
    document.addEventListener("copy", this.boundCopyHandler, true);
    document.addEventListener("paste", this.boundPasteHandler, true);
    document.addEventListener("contextmenu", this.boundContextMenuHandler, true);
    document.addEventListener("dragstart", this.boundDragStartHandler, true);
  }

  detachListeners() {
    document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    window.removeEventListener("blur", this.boundBlurHandler);
    window.removeEventListener("focus", this.boundFocusHandler);
    window.removeEventListener("keydown", this.boundKeyHandler, true);
    document.removeEventListener("copy", this.boundCopyHandler, true);
    document.removeEventListener("paste", this.boundPasteHandler, true);
    document.removeEventListener("contextmenu", this.boundContextMenuHandler, true);
    document.removeEventListener("dragstart", this.boundDragStartHandler, true);
  }

  /**
   * Evaluasi Sinyal Integritas Berdasarkan Kaidah Objektif
   */
  evaluateIntegritySignals() {
    if (!this.currentSession) return;

    // Creator Anti-Detector Guard: Hanya lolos jika sesi ini adalah sesi kreator DAN mode anti-detector aktif
    if (this.currentSession.isCreatorSession && this.isAntiDetectorActive()) {
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

    // Kriteria 1: Membuka Chat Matrix AI saat ujian
    if (s.matrixAiOpenedCount > 0) {
      reasons.push(`${s.matrixAiOpenedCount}x membuka Chat Matrix AI saat asesmen berlangsung`);
    }

    // Kriteria 2: Indikasi Google Lens / Pencarian Eksternal AI
    if (s.googleLensAttempts > 0) {
      reasons.push(`${s.googleLensAttempts}x indikasi pencarian Google Lens / AI eksternal`);
    }

    // Kriteria 3: Upaya tangkapan layar (screenshot)
    if (s.screenshotAttempts > 0) {
      reasons.push(`${s.screenshotAttempts}x upaya tangkapan layar (PrintScreen / Shortcut Screenshot)`);
    }

    // Kriteria 4: Copy-Paste teks
    if (s.clipboardAttempts > 0) {
      reasons.push(`${s.clipboardAttempts}x aktivitas copy / paste teks butir soal`);
    }

    // Kriteria 5: DevTools / Inspect
    if (s.devToolsAttempts > 0) {
      reasons.push(`${s.devToolsAttempts}x upaya inspeksi DevTools / F12`);
    }

    // Kriteria 6: Tab switch berulang (>= 2 kali)
    if (s.tabSwitches >= 2) {
      reasons.push(`${s.tabSwitches} kali berpindah tab peramban selama pengerjaan`);
    }

    // Kriteria 7: Durasi inaktif panjang (>= 30 detik)
    if (s.totalInactiveSeconds >= 30) {
      reasons.push(`Total durasi tab tidak aktif selama ${s.totalInactiveSeconds} detik`);
    }

    // CATATAN: Pengerjaan cepat / jawaban kilat TIDAK dimasukkan ke alasan kecurangan
    // karena bisa merupakan indikasi siswa tebak acak / ngasal, bukan kecurangan AI.

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
