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
  static analyze({ studentId = "Siswa_01", questionId = "Q1", question = null, studentAnswer = "", studentSteps = "", media = null }) {
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

    if (!trimmedAnswer && !trimmedSteps && !media?.image && !media?.audio) {
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
        media
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

    const { primaryError, secondaryError = "none", confidence = 85, evidence, customAdvice = "" } = diagnosticResult;

    // Generate remediasi adaptif
    const remediation = generateRemediation(primaryError, resolvedQuestion.topic || "Persamaan Kuadrat", customAdvice);

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
      media
    });
  }

  /**
   * Menyusun paket hasil analisis baik dalam format objek maupun teks baku
   */
  static _buildResultPackage({ studentId, questionId, domainCode, primaryError, secondaryError, evidence, confidence, remediation, question, media = null }) {
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
      media
    };
  }

  /**
   * Diagnostik cerdas adaptif untuk Soal Latihan Mandiri & Persiapan Ujian
   */
  static _smartPracticeDiagnostic(steps, answer, question, media = null) {
    const combined = `${steps} ${answer}`.toLowerCase().trim();
    const stdAns = (question.standardAnswer || "").toLowerCase().trim();
    const explanation = (question.explanation || "").toLowerCase();

    // 1. Cek Jawaban Benar / Akurat (E0)
    const isAnswerMatch = stdAns && (
      combined.includes(stdAns) || 
      StepAnalyzer.extractNumbers(answer).join(",") === StepAnalyzer.extractNumbers(stdAns).join(",")
    );

    if (isAnswerMatch) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 95,
        evidence: `Jawaban siswa tepat sesuai kunci penyelesaian (${question.standardAnswer}). Langkah pengerjaan tersusun secara logis dan valid.`,
        customAdvice: "Pertahankan ketelitian dan pemahaman konseptual yang sudah sangat baik ini."
      };
    }

    // 2. Deteksi Kesalahan E4 (Interpretasi Konteks Nyata / Geometri)
    // Contoh: memilih ukuran panjang/waktu bernilai negatif
    if (StepAnalyzer.contains(combined, "-") && (
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
        evidence: "Siswa berhasil menyelesaikan persamaan kuadrat, namun salah menginterpretasikan hasil fisis dengan memilih nilai negatif untuk besaran fisik (panjang/lebar/waktu).",
        customAdvice: "Dalam konteks nyata atau geometri, besaran panjang atau waktu selalu bernilai positif (> 0)."
      };
    }

    // 3. Deteksi Kesalahan E3 (Komputasi & Aritmatika Tanda)
    // Tanda minus salah hitung, perkalian tanda salah (-4ac, dll)
    if (
      StepAnalyzer.contains(combined, "+ 48") && question.id === "LAT-01" ||
      StepAnalyzer.contains(combined, "salah hitung") ||
      StepAnalyzer.contains(combined, "-20") && StepAnalyzer.contains(combined, "+ 25") && combined.includes("65")
    ) {
      return {
        primaryError: "E3",
        secondaryError: "none",
        confidence: 88,
        evidence: "Konsep pemodelan dan prosedur aljabar siswa sudah tepat, namun terjadi kekeliruan perhitungan numerik atau operasi tanda aljabar.",
        customAdvice: "Lakukan pemeriksaan kembali pada setiap operasi penjumlahan/pengurangan bertanda negatif."
      };
    }

    // 4. Deteksi Kesalahan E2 (Prosedural Aljabar)
    // Faktor terbalik tanda (misal: (x-8)(x+6) bukan (x+8)(x-6))
    if (
      StepAnalyzer.contains(combined, "(x - 8)(x + 6)") ||
      StepAnalyzer.contains(combined, "faktor terbalik") ||
      StepAnalyzer.contains(combined, "akar = 8") && question.id === "LAT-01" ||
      StepAnalyzer.contains(combined, "x = -4") && StepAnalyzer.contains(combined, "x = 1") && question.id === "LAT-03"
    ) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 90,
        evidence: "Siswa memahami bentuk kuadrat tetapi keliru dalam algoritma pemfaktoran atau tanda pembuat nol pada suku pemfaktoran aljabar.",
        customAdvice: "Periksa kembali sifat pemfaktoran: jika (x - p) = 0 maka x = +p."
      };
    }

    // 5. Deteksi Kesalahan E1 (Konseptual / Tidak Paham Rumus)
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
        evidence: "Siswa menunjukkan kesulitan dalam memahami prinsip dasar pembentukan model persamaan kuadrat untuk menyelesaikan soal ini.",
        customAdvice: `Pelajari konsep dasar topik: ${question.topic || "Persamaan Kuadrat"}.`
      };
    }

    // Default Fallback
    return {
      primaryError: "E2",
      secondaryError: "E3",
      confidence: 78,
      evidence: "Langkah pengerjaan siswa belum mencapai solusi akhir yang tepat. Perlu penajaman pada alur prosedur pemecahan masalah.",
      customAdvice: `Tinjau kembali kunci penyelesaian dan penjelasan pada materi ${question.topic}.`
    };
  }
}
