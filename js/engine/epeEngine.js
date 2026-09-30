/**
 * epeEngine.js - Core Error Pattern Engine
 * Mendiagnosis jawaban dan langkah siswa, mengklasifikasi kesalahan kognitif (E1 - E4 atau E0),
 * dan menghasilkan output diagnostik terstandar baik untuk 24 Soal Penelitian Baku maupun Soal Latihan Mandiri.
 */

import { QUESTIONS, DOMAINS } from "../data/questions.js";
import { TAXONOMY, formatErrorLabel, generateRemediation } from "./taxonomy.js";
import { DIAGNOSTIC_RULES } from "./diagnosticRules.js";
import { StepAnalyzer } from "./stepAnalyzer.js";

export class ErrorPatternEngine {
  /**
   * Menjalankan analisis diagnostik lengkap
   * @param {Object} input
   * @param {string} input.studentId - ID atau Nama Siswa
   * @param {string|Object} input.question - ID Soal (Q1 - Q24, LAT-01, dll) atau Objek Soal Kustom
   * @param {string} input.studentAnswer - Jawaban akhir siswa
   * @param {string} input.studentSteps - Langkah pengerjaan siswa (prioritas utama)
   * @param {Object} [input.media] - Objek media lampiran pengerjaan siswa (foto/audio)
   * @returns {Object} Hasil analisis berstruktur dan format teks baku
   */
  static analyze({ studentId = "Siswa_01", questionId = "Q1", question = null, studentAnswer = "", studentSteps = "", media = null, stepReconstruction = null, inputModality = "typed", multimodalEvidence = null }) {
    let resolvedQuestion = question;
    if (!resolvedQuestion) {
      resolvedQuestion = QUESTIONS.find((q) => q.id === questionId) || QUESTIONS[0];
    }

    const domainId = resolvedQuestion.domainId || "LAT";
    const domainObj = DOMAINS[domainId] || { 
      code: resolvedQuestion.category || "Latihan Mandiri", 
      name: resolvedQuestion.topic || "Persiapan Ujian" 
    };
    const domainCode = domainObj.code || `${domainId} - ${domainObj.name}`;

    // Validasi input kosong
    const trimmedAnswer = (studentAnswer || "").trim();
    const trimmedSteps = (studentSteps || "").trim();

    if (!trimmedAnswer && !trimmedSteps && !media?.image && !media?.audio && !media?.latex) {
      const primaryError = "E1";
      const secondaryError = "none";
      const confidence = 90;
      const evidence = "Siswa tidak memberikan jawaban maupun coretan langkah pengerjaan untuk soal ini.";
      const remediation = generateRemediation(primaryError, resolvedQuestion.topic, "Mulailah dengan menuliskan langkah awal pemecahan masalah.");

      return this._buildResultPackage({
        studentId,
        questionId: resolvedQuestion.id,
        domainCode,
        primaryError,
        secondaryError,
        evidence,
        confidence,
        remediation,
        question: resolvedQuestion,
        media,
        studentSteps: trimmedSteps,
        studentAnswer: trimmedAnswer,
        stepReconstruction,
        inputModality,
        multimodalEvidence
      });
    }

    // Eksekusi aturan diagnostik spesifik jika ada
    const ruleFn = DIAGNOSTIC_RULES[resolvedQuestion.id];
    let diagnosticResult;

    if (typeof ruleFn === "function") {
      diagnosticResult = ruleFn(trimmedSteps, trimmedAnswer);
    } else {
      // Analisis diagnostik cerdas adaptif untuk soal kustom / latihan mandiri
      diagnosticResult = this._smartPracticeDiagnostic(trimmedSteps, trimmedAnswer, resolvedQuestion, media);
    }

    let { primaryError, secondaryError = "none", confidence = 85, evidence, customAdvice = "" } = diagnosticResult;

    // EPE V3: Perkaya bukti jika terdapat anomali transformasi langkah coretan tangan
    if (stepReconstruction && stepReconstruction.hasAnomalies && stepReconstruction.primaryAnomaly) {
      const anomaly = stepReconstruction.primaryAnomaly;
      evidence = `${evidence} [Bukti Langkah Coretan: Pada baris ${anomaly.toStep} (${anomaly.toExpr}), terdeteksi ${anomaly.evidence}]`;
      // Jika aturan baku sebelumnya menganggap E2/E3, sesuaikan confidence lebih tinggi
      if (primaryError === "E2" || primaryError === "E3") {
        confidence = Math.max(confidence, Math.round((stepReconstruction.overallConfidence || 0.93) * 100));
      }
    }

    // Generate remediasi adaptif
    const topicForRemediation = resolvedQuestion.topic || resolvedQuestion.subject || "materi ini";
    const remediation = generateRemediation(primaryError, topicForRemediation, customAdvice);

    return this._buildResultPackage({
      studentId: studentId.trim() || "Siswa_01",
      questionId: resolvedQuestion.id,
      domainCode,
      primaryError,
      secondaryError,
      evidence,
      confidence,
      remediation,
      question: resolvedQuestion,
      media,
      studentSteps: trimmedSteps,
      studentAnswer: trimmedAnswer,
      stepReconstruction,
      inputModality,
      multimodalEvidence
    });
  }

  /**
   * Menyusun paket hasil analisis baik dalam format objek maupun teks baku
   */
  static _buildResultPackage({ studentId, questionId, domainCode, primaryError, secondaryError, evidence, confidence, remediation, question, media = null, studentSteps = "", studentAnswer = "", stepReconstruction = null, inputModality = "typed", multimodalEvidence = null }) {
    const primaryErrorFormatted = formatErrorLabel(primaryError);
    const secondaryErrorFormatted = formatErrorLabel(secondaryError);
    const confidenceFormatted = `${confidence}%`;

    // Format teks baku sesuai spesifikasi penelitian
    const rawPlainText = [
      `Nama pengguna/pribadi = ${studentId}`,
      `Nomor soal = ${questionId}`,
      `Bagian = ${domainCode}`,
      `Kesalahan satu = ${primaryErrorFormatted}`,
      `Kesalahan kedua = ${secondaryErrorFormatted}`,
      `Bukti = ${evidence}`,
      `Kepercayaan diri = ${confidenceFormatted}`,
      `Remediasi = ${remediation}`
    ].join("\n");

    const primaryTaxonomy = TAXONOMY[primaryError] || TAXONOMY.E0;
    const secondaryTaxonomy = secondaryError && secondaryError !== "none" ? TAXONOMY[secondaryError] : null;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      studentId,
      questionId,
      questionTitle: question.title || "Soal Latihan",
      domainId: question.domainId || "LAT",
      domainCode,
      primaryErrorCode: primaryError,
      secondaryErrorCode: secondaryError,
      primaryErrorText: primaryErrorFormatted,
      secondaryErrorText: secondaryErrorFormatted,
      evidence,
      confidenceScore: confidence,
      confidenceText: confidenceFormatted,
      remediation,
      rawPlainText,
      primaryTaxonomy,
      secondaryTaxonomy,
      isCorrect: primaryError === "E0",
      media,
      studentSteps,
      studentAnswer,
      stepReconstruction,
      inputModality,
      multimodalEvidence
    };
  }

  /**
   * Diagnostik cerdas adaptif untuk Soal Latihan Mandiri & Persiapan Ujian
   * Sepenuhnya subject-agnostic: menggunakan question.topic/subject secara dinamis,
   * TIDAK mengarang label "Persamaan Kuadrat" untuk mata pelajaran non-Matematika.
   */
  static _smartPracticeDiagnostic(steps, answer, question, media = null) {
    const combined = `${steps} ${answer}`.toLowerCase().trim();
    const stdAns = (question.standardAnswer || question.correctAnswer || question.correct_answer || "").toLowerCase().trim();
    const topicLabel = question.topic || question.subject || "materi ini";
    const subjectId = (question.subject || "mathematics").toLowerCase();

    // ── Deteksi ketidakpastian / jawaban spekulatif ──────────────────────
    // Kata-kata ini menunjukkan siswa TIDAK yakin dengan jawabannya.
    // Harus segera di-intercept sebelum logika E0 berjalan.
    const UNCERTAINTY_WORDS = [
      "sepertinya", "mungkin", "kayaknya", "kira-kira", "seperti",
      "kelihatannya", "rasanya", "tampaknya", "kurasa", "kurang tahu",
      "maybe", "perhaps", "i think", "probably", "i guess", "not sure"
    ];
    const hasUncertainty = UNCERTAINTY_WORDS.some(w => combined.includes(w));

    if (hasUncertainty) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 88,
        evidence: `Siswa memberikan jawaban spekulatif atau tidak yakin ("${answer.trim().slice(0, 60)}") tanpa menunjukkan pemahaman konsep yang solid pada materi ${topicLabel}.`,
        customAdvice: `Pelajari dan pahami konsep dasar ${topicLabel} hingga kamu yakin dengan jawaban dan langkah pengerjaanmu.`
      };
    }

    // ── Pencocokan Jawaban (E0) ───────────────────────────────────────────
    // Untuk soal Pilihan Ganda (MCQ): stdAns berupa huruf tunggal A–E.
    // Gunakan word-boundary agar "B" tidak cocok dengan kata seperti "sebelum",
    // "sebab", atau kalimat lain yang kebetulan mengandung huruf tersebut.
    const isMCQAnswer = /^[a-e]$/.test(stdAns);
    let isAnswerMatch = false;

    if (isMCQAnswer && stdAns) {
      // Cocokkan: huruf sendirian, atau diawali (mis. "A.", "A)", "Jawab: A", "pilihan A")
      const mcqRegex = new RegExp(`(?:^|\\s|pilihan\\s+|jawab(?:an)?[:\\s]+|option\\s*)${stdAns}(?:\\s|\\.|\\)|,|$)`, "i");
      const trimmedAnswer = answer.trim();
      // Juga izinkan jawaban tepat 1 karakter (pengguna hanya ketik "B")
      isAnswerMatch = mcqRegex.test(trimmedAnswer) || trimmedAnswer.toLowerCase() === stdAns;
    } else if (stdAns) {
      // Untuk jawaban numerik / esai: pencocokan angka eksak
      const numMatch = StepAnalyzer.extractNumbers(answer).join(",") === StepAnalyzer.extractNumbers(stdAns).join(",");
      const exactInclude = answer.trim().toLowerCase() === stdAns;
      isAnswerMatch = numMatch || exactInclude;
    }

    if (isAnswerMatch) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 95,
        evidence: `Jawaban siswa tepat sesuai kunci penyelesaian (${question.standardAnswer || question.correctAnswer || stdAns.toUpperCase()}). Langkah pengerjaan tersusun secara logis dan valid.`,
        customAdvice: "Pertahankan ketelitian dan pemahaman konseptual yang sudah sangat baik ini."
      };
    }

    // 2. Deteksi Kesalahan E4 (Interpretasi Konteks Nyata)
    // Khusus Matematika: besaran panjang/waktu negatif
    if (subjectId === "mathematics" && StepAnalyzer.contains(combined, "-") && (
      StepAnalyzer.contains(combined, "panjang = -") ||
      StepAnalyzer.contains(combined, "lebar = -") ||
      StepAnalyzer.contains(combined, "waktu = -") ||
      StepAnalyzer.contains(combined, "t = -") ||
      StepAnalyzer.contains(combined, "x = -8") && question.id === "LAT-01"
    )) {
      return {
        primaryError: "E4",
        secondaryError: "E0",
        confidence: 92,
        evidence: `Siswa berhasil menyelesaikan soal, namun salah menginterpretasikan hasil fisis dengan memilih nilai negatif untuk besaran yang harus positif (panjang/lebar/waktu).`,
        customAdvice: `Dalam konteks ${topicLabel}, besaran seperti panjang atau waktu selalu bernilai positif (> 0).`
      };
    }

    // Deteksi E4 Fisika: salah satuan atau konteks fisis
    if (subjectId === "physics" && (
      StepAnalyzer.contains(combined, "negatif") ||
      StepAnalyzer.contains(combined, "salah satuan") ||
      StepAnalyzer.contains(combined, "konteks")
    )) {
      return {
        primaryError: "E4",
        secondaryError: "none",
        confidence: 88,
        evidence: `Siswa kurang tepat dalam menginterpretasikan konteks fisis atau satuan pada soal ${topicLabel}.`,
        customAdvice: `Perhatikan satuan besaran dan arah vektor pada materi ${topicLabel}.`
      };
    }

    // 3. Deteksi Kesalahan E3 (Komputasi)
    if (
      StepAnalyzer.contains(combined, "salah hitung") ||
      StepAnalyzer.contains(combined, "calculation error") ||
      (subjectId === "mathematics" && StepAnalyzer.contains(combined, "-20") && StepAnalyzer.contains(combined, "+ 25") && combined.includes("65")) ||
      (subjectId === "mathematics" && StepAnalyzer.contains(combined, "+ 48") && question.id === "LAT-01")
    ) {
      return {
        primaryError: "E3",
        secondaryError: "none",
        confidence: 88,
        evidence: `Konsep pemodelan dan prosedur siswa sudah tepat pada materi ${topicLabel}, namun terjadi kekeliruan perhitungan numerik atau operasi tanda aljabar.`,
        customAdvice: `Lakukan pemeriksaan kembali setiap langkah hitung pada soal ${topicLabel}.`
      };
    }

    // 4. Deteksi Kesalahan E2 (Prosedural)
    if (
      StepAnalyzer.contains(combined, "faktor terbalik") ||
      StepAnalyzer.contains(combined, "prosedur salah") ||
      (subjectId === "mathematics" && StepAnalyzer.contains(combined, "(x - 8)(x + 6)")) ||
      (subjectId === "mathematics" && StepAnalyzer.contains(combined, "akar = 8") && question.id === "LAT-01") ||
      (subjectId === "mathematics" && StepAnalyzer.contains(combined, "x = -4") && StepAnalyzer.contains(combined, "x = 1") && question.id === "LAT-03")
    ) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 90,
        evidence: `Siswa memahami konsep dasar ${topicLabel} tetapi keliru dalam algoritma prosedural atau urutan langkah penyelesaian.`,
        customAdvice: `Tinjau ulang prosedur baku penyelesaian untuk materi ${topicLabel}.`
      };
    }

    // 5. Deteksi Kesalahan E1 (Konseptual)
    if (
      StepAnalyzer.contains(combined, "tidak tahu") ||
      StepAnalyzer.contains(combined, "bingung") ||
      !StepAnalyzer.contains(combined, "x") && !StepAnalyzer.contains(combined, "=") ||
      steps.length < 5 && answer.length < 3
    ) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 85,
        evidence: `Siswa menunjukkan kesulitan dalam memahami prinsip dasar ${topicLabel} untuk menyelesaikan soal ini.`,
        customAdvice: `Pelajari konsep dasar topik: ${topicLabel}.`
      };
    }

    // Default Fallback — subject-agnostic
    return {
      primaryError: "E2",
      secondaryError: "E3",
      confidence: 78,
      evidence: `Langkah pengerjaan siswa belum mencapai solusi akhir yang tepat pada materi ${topicLabel}. Perlu penajaman pada alur prosedur pemecahan masalah.`,
      customAdvice: `Tinjau kembali kunci penyelesaian dan penjelasan pada materi ${topicLabel}.`
    };
  }
}
