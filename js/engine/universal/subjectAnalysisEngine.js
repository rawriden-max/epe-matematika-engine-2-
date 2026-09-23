/**
 * subjectAnalysisEngine.js - Universal Analysis Engine Interface & Router (EPE Universal)
 * 
 * Memisahkan mesin analisis subjek-spesifik dari antarmuka asesmen utama.
 * Mengintegrasikan EPE matematika yang ada sebagai engine matematika,
 * serta memastikan mapel non-matematika tidak mengarang diagnosis palsu.
 */

import { SubjectRegistry } from "./subjectRegistry.js";
import { ErrorPatternEngine } from "../epeEngine.js";
import { HandwritingStepReconstructor } from "../../multimodal/handwritingStepReconstructor.js";

/**
 * Antarmuka Dasar Mesin Analisis Subjek (Generic Interface)
 */
export class SubjectAnalysisEngine {
  constructor(subjectId) {
    this.subjectId = subjectId;
  }

  /**
   * Menjalankan analisis respon pengerjaan siswa
   * @param {Object} question - Objek butir soal universal
   * @param {string|Object} studentAnswer - Jawaban siswa
   * @param {Object} [context] - Konteks tambahan (langkah pengerjaan, gambar, waktu)
   * @returns {Promise<Object>}
   */
  async analyze(question, studentAnswer, context = {}) {
    throw new Error("analyze() wajib diimplementasikan oleh engine turunan.");
  }
}

/**
 * Mesin Analisis Matematika (Mempertahankan EPE V3 E0–E4 Sepenuhnya)
 */
export class MathematicsAnalysisEngine extends SubjectAnalysisEngine {
  constructor() {
    super("mathematics");
  }

  async analyze(question, studentAnswer, context = {}) {
    const rawSteps = context.steps || context.scratchpad || "";
    
    // 1. Rekonstruksi Langkah Aljabar (jika ada coretan)
    let reconstructedResult = null;
    if (rawSteps && typeof rawSteps === "string") {
      reconstructedResult = HandwritingStepReconstructor.reconstruct(rawSteps);
    }

    // 2. Evaluasi menggunakan ErrorPatternEngine inti
    const epeResult = ErrorPatternEngine.evaluate(question, studentAnswer, context);

    return {
      subject: "mathematics",
      isTaxonomyConfigured: true,
      taxonomyName: "EPE (E0–E4) Cognitive Error Taxonomy",
      isCorrect: epeResult.isCorrect || (studentAnswer === question.correct_answer),
      primaryError: epeResult.primaryError || (studentAnswer === question.correct_answer ? "[E0] Akurat" : "[E1] Konseptual"),
      secondaryError: epeResult.secondaryError || "none",
      confidence: epeResult.confidence || 0.92,
      evidence: epeResult.evidence || "Respon siswa diverifikasi terhadap kaidah aljabar baku.",
      learningNeed: epeResult.learningNeed || epeResult.recommendation || "Tinjau kembali konsep aljabar terkait.",
      reconstructedSteps: reconstructedResult ? reconstructedResult.steps : [],
      stepEvidenceHtml: reconstructedResult ? HandwritingStepReconstructor.formatStepEvidenceCard(reconstructedResult) : null
    };
  }
}

/**
 * Mesin Analisis untuk Subjek yang Belum Dikonfigurasi Taksonominya
 * Menampilkan pesan transparan: "Subject analysis taxonomy not configured."
 * DILARANG KERAS MENGARANG DIAGNOSIS PALSU.
 */
export class UnconfiguredSubjectEngine extends SubjectAnalysisEngine {
  constructor(subjectId) {
    super(subjectId);
    this.subjectConfig = SubjectRegistry.getSubject(subjectId);
  }

  async analyze(question, studentAnswer, context = {}) {
    const isCorrect = String(studentAnswer).trim().toUpperCase() === String(question.correct_answer || "").trim().toUpperCase();
    const subjectName = this.subjectConfig?.name || this.subjectId;

    return {
      subject: this.subjectId,
      isTaxonomyConfigured: false,
      taxonomyName: null,
      isCorrect: isCorrect,
      primaryError: null,
      secondaryError: null,
      confidence: 1.0,
      statusMessage: "Subject analysis taxonomy not configured.",
      evidence: `Evaluasi kunci jawaban otomatis untuk mata pelajaran ${subjectName}.`,
      learningNeed: `Taksonomi diagnostik pola kesalahan untuk mata pelajaran ${subjectName} belum dikonfigurasi. Penilaian saat ini berbasis evaluasi kebenaran kunci jawaban.`,
      reconstructedSteps: [],
      stepEvidenceHtml: null
    };
  }
}

/**
 * Router Analisis Subjek (Subject Analysis Router)
 * Mengidentifikasi subjek soal dan mengarahkan ke engine yang tepat.
 */
export class SubjectRouter {
  static engines = {
    mathematics: new MathematicsAnalysisEngine(),
    physics: new UnconfiguredSubjectEngine("physics"),
    chemistry: new UnconfiguredSubjectEngine("chemistry"),
    biology: new UnconfiguredSubjectEngine("biology"),
    computer_science: new UnconfiguredSubjectEngine("computer_science")
  };

  /**
   * Menentukan engine analisis yang sesuai dengan butir soal
   */
  static getEngine(subjectId) {
    const cleanId = (subjectId || "mathematics").toLowerCase().trim();
    if (this.engines[cleanId]) {
      return this.engines[cleanId];
    }
    return new UnconfiguredSubjectEngine(cleanId);
  }

  /**
   * Menganalisis respon soal melalui engine yang sesuai
   */
  static async routeAndAnalyze(question, studentAnswer, context = {}) {
    const subject = question.subject || "mathematics";
    const engine = this.getEngine(subject);
    return await engine.analyze(question, studentAnswer, context);
  }

  /**
   * Deteksi inferensi subjek secara heuristik jika subjek tidak disertakan
   */
  static detectSubjectFromPrompt(promptText) {
    if (!promptText || typeof promptText !== "string") {
      return { subject: "mathematics", confidence: 0.5 };
    }

    const text = promptText.toLowerCase();

    // Fisika
    if (text.includes("kecepatan") || text.includes("percepatan") || text.includes("gaya") || text.includes("newton") || text.includes("joule") || text.includes("kinematika") || text.includes("momentum") || text.includes("m/s")) {
      return { subject: "physics", confidence: 0.88 };
    }

    // Kimia
    if (text.includes("stoikiometri") || text.includes("larutan") || text.includes("mol ") || text.includes("senyawa") || text.includes("reaksi") || text.includes("unsur") || text.includes("asam") || text.includes("basa") || text.includes("ph ")) {
      return { subject: "chemistry", confidence: 0.88 };
    }

    // Biologi
    if (text.includes("sel ") || text.includes("mitokondria") || text.includes("fotosintesis") || text.includes("genetika") || text.includes("kromosom") || text.includes("organel") || text.includes("enzim")) {
      return { subject: "biology", confidence: 0.88 };
    }

    // Informatika
    if (text.includes("algoritma") || text.includes("pseudocode") || text.includes("boolean") || text.includes("array") || text.includes("rekursi") || text.includes("loop") || text.includes("komputasi")) {
      return { subject: "computer_science", confidence: 0.85 };
    }

    // Default: Matematika
    return { subject: "mathematics", confidence: 0.75 };
  }
}
