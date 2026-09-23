/**
 * questionModel.js - Universal Question & Assessment Data Models (EPE Universal)
 * 
 * Standarisasi model data butir soal dan asesmen lintas mata pelajaran.
 * Memisahkan model soal dari asumsi persamaan matematika belaka.
 */

export const QUESTION_TYPES = [
  { id: "multiple_choice", name: "Pilihan Ganda (Single Choice)", description: "Pilihan satu dari beberapa opsi (A, B, C, D)" },
  { id: "multiple_select", name: "Pilihan Ganda Kompleks (Multi Select)", description: "Memilih lebih dari satu jawaban benar" },
  { id: "true_false", name: "Benar / Salah", description: "Pernyataan Benar atau Salah" },
  { id: "numerical", name: "Jawaban Numerik", description: "Input angka atau nilai pasti" },
  { id: "short_answer", name: "Isian Singkat", description: "Input teks atau kata kunci pendek" },
  { id: "equation_based", name: "Persamaan / Rumus Simbolik", description: "Notasi matematika atau reaksi kimia" },
  { id: "image_based", name: "Berbasis Gambar / Diagram", description: "Diagram, anatomi, atau grafik dengan pertanyaan" },
  { id: "structured_response", name: "Respon Terstruktur (Langkah Coretan)", description: "Langkah pengerjaan multi-baris" },
  { id: "essay", name: "Uraian / Esai Bebas", description: "Jawaban analitis panjang" }
];

export const ASSESSMENT_TYPES = {
  PRE_TEST: { id: "PRE_TEST", name: "Pre-Test (Asesmen Awal)", desc: "Pengukuran kemampuan baseline sebelum proses belajar" },
  DIAGNOSTIC: { id: "DIAGNOSTIC", name: "Diagnostik Baku", desc: "Pemetaan pola kesalahan dan kebutuhan belajar siswa" },
  PRACTICE: { id: "PRACTICE", name: "Latihan Adaptif / Intervensi", desc: "Latihan berdiferensiasi dan penguatan konsep" },
  POST_TEST: { id: "POST_TEST", name: "Post-Test (Asesmen Akhir)", desc: "Evaluasi capaian hasil belajar pasca-pembelajaran" }
};

export class UniversalQuestion {
  constructor(data = {}) {
    this.id = data.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.assessment_id = data.assessment_id || null;
    this.subject = data.subject || "mathematics";
    this.topic = data.topic || "Umum";
    this.subtopic = data.subtopic || "";
    this.grade_level = data.grade_level || "XI SMA/MA";
    this.difficulty = data.difficulty || "medium"; // 'easy' | 'medium' | 'hard'
    this.question_type = data.question_type || "multiple_choice";
    this.question_text = data.question_text || data.prompt || "";
    this.question_image = data.question_image || null;
    this.latex = data.latex || null;
    
    // Opsi jawaban terstandarisasi: [{ key: 'A', text: '...', latex: '...', errorType: 'E1' }]
    this.options = Array.isArray(data.options) ? data.options : [];
    this.correct_answer = data.correct_answer || data.correctAnswer || "A";
    this.explanation = data.explanation || "";
    this.scoring_rule = data.scoring_rule || { max_score: 10, partial: false };
    this.time_limit = data.time_limit || null; // dalam detik (opsional)
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.metadata = typeof data.metadata === "object" && data.metadata !== null ? data.metadata : {};
    this.created_at = data.created_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
  }

  /**
   * Adapter: Konversi dari butir soal EPE warisan (Legacy Form A / Form B / Q1-Q24)
   */
  static fromLegacyEPE(legacyQ, subject = "mathematics", assessmentType = "DIAGNOSTIC") {
    return new UniversalQuestion({
      id: legacyQ.id || `Q_${legacyQ.number || "0"}`,
      subject: subject,
      topic: legacyQ.domainName || legacyQ.domain || "Persamaan Kuadrat",
      subtopic: legacyQ.competencyId || "",
      grade_level: "XI SMA/MA",
      difficulty: "medium",
      question_type: legacyQ.latex ? "equation_based" : "multiple_choice",
      question_text: legacyQ.prompt || legacyQ.title || "",
      latex: legacyQ.latex || null,
      options: legacyQ.options || [],
      correct_answer: legacyQ.correctAnswer || legacyQ.correct || "A",
      explanation: legacyQ.explanation || legacyQ.remediation || "",
      tags: [legacyQ.domain, legacyQ.competencyId].filter(Boolean),
      metadata: {
        legacyDomain: legacyQ.domain,
        legacyCompetency: legacyQ.competencyId,
        title: legacyQ.title
      }
    });
  }

  /**
   * Validasi kelayakan butir soal
   */
  validate() {
    const errors = [];
    if (!this.id) errors.push("ID soal wajib diisi.");
    if (!this.subject) errors.push("Mata pelajaran wajib dipilih.");
    if (!this.question_text && !this.latex) errors.push("Teks soal atau formula tidak boleh kosong.");
    if (this.question_type === "multiple_choice" && (!this.options || this.options.length < 2)) {
      errors.push("Soal pilihan ganda minimal memiliki 2 opsi jawaban.");
    }
    if (!this.correct_answer) errors.push("Kunci jawaban benar wajib ditentukan.");
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  toJSON() {
    return {
      id: this.id,
      assessment_id: this.assessment_id,
      subject: this.subject,
      topic: this.topic,
      subtopic: this.subtopic,
      grade_level: this.grade_level,
      difficulty: this.difficulty,
      question_type: this.question_type,
      question_text: this.question_text,
      question_image: this.question_image,
      latex: this.latex,
      options: this.options,
      correct_answer: this.correct_answer,
      explanation: this.explanation,
      scoring_rule: this.scoring_rule,
      time_limit: this.time_limit,
      tags: this.tags,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export class UniversalAssessment {
  constructor(data = {}) {
    this.assessment_id = data.assessment_id || `asm_${Date.now()}`;
    this.assessment_type = data.assessment_type || "DIAGNOSTIC"; // PRE_TEST | DIAGNOSTIC | PRACTICE | POST_TEST
    this.subject = data.subject || "mathematics";
    this.title = data.title || "Asesmen Standar";
    this.description = data.description || "";
    this.question_ids = Array.isArray(data.question_ids) ? data.question_ids : [];
    this.duration = data.duration || 30; // menit
    this.randomization_settings = data.randomization_settings || { shuffle_questions: false, shuffle_options: false };
    this.scoring_settings = data.scoring_settings || { passing_score: 75, max_score: 100 };
    this.availability = data.availability || "published"; // 'draft' | 'published' | 'archived'
    this.status = data.status || "active";
    this.research_mode = data.research_mode !== undefined ? Boolean(data.research_mode) : true;
    this.created_at = data.created_at || new Date().toISOString();
  }

  toJSON() {
    return {
      assessment_id: this.assessment_id,
      assessment_type: this.assessment_type,
      subject: this.subject,
      title: this.title,
      description: this.description,
      question_ids: this.question_ids,
      duration: this.duration,
      randomization_settings: this.randomization_settings,
      scoring_settings: this.scoring_settings,
      availability: this.availability,
      status: this.status,
      research_mode: this.research_mode,
      created_at: this.created_at
    };
  }
}
