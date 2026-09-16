/**
 * assessmentStore.js - Penyimpanan Data Riset Imutabel Pre-Test & Post-Test EPE V2.2
 * 
 * PRINSIP INTEGRITAS PENELITIAN:
 * 1. Imutabilitas: Setiap pengerjaan siswa menghasilkan attemptId unik baru.
 * 2. Tidak pernah menimpa (overwrite) data pengerjaan sebelumnya.
 * 3. Menyimpan skor total, durasi, serta respon tingkat butir (question-level responses).
 * 4. Sinkronisasi otomatis ke Supabase Cloud (jika online/terkoneksi).
 */

import { savePreTestToSupabase, savePostTestToSupabase } from "../data/supabaseClient.js";

const PRETEST_STORAGE_KEY = "epe_pretest_attempts";
const POSTTEST_STORAGE_KEY = "epe_posttest_attempts";
const REMEDIATION_LOG_KEY = "epe_remediation_history";

export class AssessmentStore {
  /**
   * Mengambil nama/ID siswa aktif
   */
  static getActiveStudent() {
    const stored = localStorage.getItem("epe_student_name");
    const nameEl = document.getElementById("dash-student-name");
    const name = stored || nameEl?.textContent?.trim() || "Siswa_01";
    return {
      studentId: name.toLowerCase().replace(/\s+/g, "_"),
      studentName: name
    };
  }

  /**
   * Mengambil seluruh rekaman attempt berdasarkan tipe tes ('pretest' | 'posttest')
   */
  static getAllAttempts(testType = "pretest") {
    const key = testType === "pretest" ? PRETEST_STORAGE_KEY : POSTTEST_STORAGE_KEY;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`Gagal membaca ${key}:`, e);
      return [];
    }
  }

  /**
   * Mengambil attempt terbaru untuk tipe tes tertentu
   */
  static getLatestAttempt(testType = "pretest") {
    const attempts = this.getAllAttempts(testType);
    if (attempts.length === 0) return null;
    return attempts[attempts.length - 1];
  }

  /**
   * Mencatat attempt baru secara imutabel
   * @param {Object} attemptData
   */
  static async recordAttempt(attemptData) {
    const testType = attemptData.testType || "pretest";
    const key = testType === "pretest" ? PRETEST_STORAGE_KEY : POSTTEST_STORAGE_KEY;

    // Generate Unique Attempt ID
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const timestampMs = Date.now();
    const attemptId = `att_${testType}_${timestampMs}_${randomSuffix}`;

    const studentInfo = this.getActiveStudent();

    // Hitung Distribusi Error Kognitif (E0 - E4)
    const errorDistribution = { E0: 0, E1: 0, E2: 0, E3: 0, E4: 0 };
    const domainAccuracy = { D1: { correct: 0, total: 0 }, D2: { correct: 0, total: 0 }, D3: { correct: 0, total: 0 }, D4: { correct: 0, total: 0 }, D5: { correct: 0, total: 0 }, D6: { correct: 0, total: 0 } };

    const processedResponses = (attemptData.responses || []).map((r) => {
      const isCorrect = r.userAnswer === r.correctAnswer;
      const code = isCorrect ? "E0" : (r.selectedErrorType || "E1");
      if (errorDistribution[code] !== undefined) {
        errorDistribution[code]++;
      } else {
        errorDistribution["E1"]++;
      }

      const d = r.domain || "D1";
      if (domainAccuracy[d]) {
        domainAccuracy[d].total++;
        if (isCorrect) domainAccuracy[d].correct++;
      }

      return {
        questionId: r.questionId,
        competencyId: r.competencyId,
        domain: r.domain,
        domainName: r.domainName,
        userAnswer: r.userAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: isCorrect,
        errorCode: code,
        timeSpentSeconds: r.timeSpentSeconds || 0
      };
    });

    const totalQ = processedResponses.length;
    const correctCount = processedResponses.filter((r) => r.isCorrect).length;
    const accuracy = totalQ > 0 ? parseFloat((correctCount / totalQ).toFixed(4)) : 0;
    const score = totalQ > 0 ? parseFloat(((correctCount / totalQ) * 100).toFixed(1)) : 0;

    // Domain percentages
    const domainRates = {};
    for (const [dom, stats] of Object.entries(domainAccuracy)) {
      domainRates[dom] = stats.total > 0 ? parseFloat(((stats.correct / stats.total) * 100).toFixed(1)) : 0;
    }

    const newRecord = {
      attemptId: attemptId,
      studentId: attemptData.studentId || studentInfo.studentId,
      studentName: attemptData.studentName || studentInfo.studentName,
      testType: testType,
      testForm: attemptData.testForm || (testType === "pretest" ? "Form A" : "Form B"),
      startedAt: attemptData.startedAt || new Date(timestampMs - (attemptData.durationSeconds || 60) * 1000).toISOString(),
      completedAt: new Date(timestampMs).toISOString(),
      timestamp: new Date(timestampMs).toLocaleString("id-ID"),
      durationSeconds: attemptData.durationSeconds || 0,
      totalQuestions: totalQ,
      correctCount: correctCount,
      accuracy: accuracy,
      score: score,
      errorDistribution: errorDistribution,
      domainAccuracy: domainRates,
      responses: processedResponses
    };

    // Simpan ke LocalStorage (Imutabel: array push)
    const existing = this.getAllAttempts(testType);
    existing.push(newRecord);
    try {
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.error(`Gagal menyimpan ke ${key}:`, e);
    }

    // Broadcast Event
    window.dispatchEvent(new CustomEvent("epe-assessment-recorded", { detail: newRecord }));

    // Kirim asinkron ke Supabase Cloud
    try {
      if (testType === "pretest") {
        await savePreTestToSupabase(newRecord);
      } else {
        await savePostTestToSupabase(newRecord);
      }
    } catch (cloudErr) {
      console.warn(`[Supabase Sync] ${testType} cloud backup pending:`, cloudErr);
    }

    return newRecord;
  }

  /**
   * Pengecekan Kriteria Akses Post-Test:
   * Post-Test HANYA dapat dibuka jika:
   * 1. Siswa telah menyelesaikan Pre-Test (minimal 1 attempt)
   * 2. Siswa telah menyelesaikan 24 Soal Diagnostik
   * 3. Siswa telah mengakses/menyelesaikan sesi Remediasi
   */
  static checkPostTestPrerequisites() {
    const pretestAttempts = this.getAllAttempts("pretest");
    const hasPretest = pretestAttempts.length > 0;

    // Cek progres 24 soal diagnostik (cube store / local storage)
    let diagCompletedCount = 0;
    try {
      const rawCubes = localStorage.getItem("epe_learning_cubes_v2");
      if (rawCubes) {
        const cubes = JSON.parse(rawCubes);
        diagCompletedCount = Object.keys(cubes).length;
      }
    } catch (e) {}

    // Fallback riwayat diagnostik
    if (diagCompletedCount === 0) {
      try {
        const rawHist = localStorage.getItem("epe_history_v2");
        if (rawHist) {
          const hist = JSON.parse(rawHist);
          const uniqueQ = new Set(hist.map((h) => h.questionId));
          diagCompletedCount = uniqueQ.size;
        }
      } catch (e) {}
    }

    const hasDiagnostic = diagCompletedCount >= 24;

    // Cek aktivitas remediasi / latihan
    let remediationAccessed = false;
    try {
      const rawRem = localStorage.getItem(REMEDIATION_LOG_KEY);
      if (rawRem) {
        const remList = JSON.parse(rawRem);
        remediationAccessed = Array.isArray(remList) && remList.length > 0;
      }
    } catch (e) {}

    // Fallback: Jika ada kristalisasi kubus / latihan di riwayat
    if (!remediationAccessed && diagCompletedCount > 0) {
      try {
        const rawCubes = localStorage.getItem("epe_learning_cubes_v2");
        if (rawCubes) {
          const cubes = JSON.parse(rawCubes);
          remediationAccessed = Object.values(cubes).some((c) => c.status === "remediated" || c.remediated);
        }
      } catch (e) {}
    }

    // Untuk fleksibilitas simulasi riset guru: jika diagnostik sudah diselesaikan maka prasyarat terpenuhi
    const isUnlocked = hasPretest && hasDiagnostic && remediationAccessed;

    return {
      isUnlocked,
      hasPretest,
      hasDiagnostic,
      diagCompletedCount,
      hasRemediation: remediationAccessed,
      reasons: [
        { label: "Pre-Test (Form A) telah diselesaikan", passed: hasPretest },
        { label: `24 Soal Diagnostik Baku telah selesai (${diagCompletedCount}/24)`, passed: hasDiagnostic },
        { label: "Sesi Remediasi / Bank Latihan telah diakses", passed: remediationAccessed }
      ]
    };
  }

  /**
   * Catat aktivitas sesi remediasi siswa
   */
  static logRemediationSession(remedyData) {
    try {
      const raw = localStorage.getItem(REMEDIATION_LOG_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push({
        id: `rem_${Date.now()}`,
        timestamp: new Date().toISOString(),
        studentId: this.getActiveStudent().studentId,
        ...remedyData
      });
      localStorage.setItem(REMEDIATION_LOG_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("epe-remediation-logged"));
    } catch (e) {
      console.warn("Gagal mencatat log remediasi:", e);
    }
  }

  /**
   * Mengambil status komprehensif alur penelitian (Research Flow Pipeline)
   */
  static getResearchFlowStatus() {
    const pretestAttempts = this.getAllAttempts("pretest");
    const posttestAttempts = this.getAllAttempts("posttest");
    const prereq = this.checkPostTestPrerequisites();

    let preStatus = "not_started";
    if (pretestAttempts.length > 0) preStatus = "completed";

    let diagStatus = "not_started";
    if (prereq.diagCompletedCount >= 24) {
      diagStatus = "completed";
    } else if (prereq.diagCompletedCount > 0) {
      diagStatus = "in_progress";
    }

    let remStatus = "not_started";
    if (prereq.hasRemediation) remStatus = "completed";

    let postStatus = "locked";
    if (posttestAttempts.length > 0) {
      postStatus = "completed";
    } else if (prereq.isUnlocked) {
      postStatus = "available";
    }

    return {
      pretest: {
        status: preStatus,
        attemptsCount: pretestAttempts.length,
        latestScore: pretestAttempts.length > 0 ? pretestAttempts[pretestAttempts.length - 1].score : null
      },
      diagnostic: {
        status: diagStatus,
        completedCount: prereq.diagCompletedCount,
        totalCount: 24
      },
      remediation: {
        status: remStatus,
        accessed: prereq.hasRemediation
      },
      posttest: {
        status: postStatus,
        attemptsCount: posttestAttempts.length,
        latestScore: posttestAttempts.length > 0 ? posttestAttempts[posttestAttempts.length - 1].score : null,
        prereqDetails: prereq
      }
    };
  }
}
