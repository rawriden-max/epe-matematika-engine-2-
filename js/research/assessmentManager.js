/**
 * assessmentManager.js - Universal Question Bank & Assessment Manager (EPE Universal)
 * 
 * Mengelola Bank Soal Terpadu dan Asesmen Lintas Subjek:
 * - Menyimpan butir soal di memori lokal & cloud
 * - Mengintegrasikan Bank Soal Matematika EPE (Form A, Form B, Q1–Q24)
 * - Menyediakan bank soal contoh untuk Fisika, Kimia, Biologi, dan Informatika
 * - Mendukung Authoring (Buat, Edit, Duplikasi, Hapus, Penugasan ke Asesmen)
 */

import { UniversalQuestion, UniversalAssessment } from "../data/questionModel.js";
import { FORM_A_PRETEST, FORM_B_POSTTEST } from "./assessmentForms.js";
import { QUESTIONS as LEGACY_DIAG_QUESTIONS } from "../data/questions.js";
import { SubjectRegistry } from "../engine/universal/subjectRegistry.js";

const QUESTION_BANK_KEY = "epe_universal_question_bank_v1";
const ASSESSMENTS_KEY = "epe_universal_assessments_v1";

export class AssessmentManager {
  /**
   * Mengambil semua butir soal dari bank soal (dengan auto-seeding jika kosong)
   * @param {Object} [filters]
   * @returns {UniversalQuestion[]}
   */
  static getAllQuestions(filters = {}) {
    let questions = this.loadStoredQuestions();

    if (questions.length === 0) {
      questions = this.seedDefaultQuestionBank();
      this.saveStoredQuestions(questions);
    }

    if (filters.subject) {
      questions = questions.filter(q => q.subject === filters.subject);
    }
    if (filters.topic) {
      questions = questions.filter(q => q.topic.toLowerCase().includes(filters.topic.toLowerCase()));
    }
    if (filters.question_type) {
      questions = questions.filter(q => q.question_type === filters.question_type);
    }
    if (filters.difficulty) {
      questions = questions.filter(q => q.difficulty === filters.difficulty);
    }
    if (filters.assessment_type) {
      questions = questions.filter(q => q.metadata?.assignedAssessments?.includes(filters.assessment_type));
    }

    return questions;
  }

  /**
   * Mengambil butir soal berdasarkan ID
   */
  static getQuestionById(id) {
    const all = this.getAllQuestions();
    return all.find(q => q.id === id) || null;
  }

  /**
   * Menyimpan butir soal baru atau memperbarui soal yang ada
   */
  static saveQuestion(questionData) {
    const question = questionData instanceof UniversalQuestion ? questionData : new UniversalQuestion(questionData);
    const validation = question.validate();
    if (!validation.isValid) {
      throw new Error(`Validasi gagal: ${validation.errors.join(", ")}`);
    }

    question.updated_at = new Date().toISOString();
    const all = this.getAllQuestions();
    const existingIndex = all.findIndex(q => q.id === question.id);

    if (existingIndex >= 0) {
      all[existingIndex] = question;
    } else {
      all.unshift(question);
    }

    this.saveStoredQuestions(all);
    return question;
  }

  /**
   * Menduplikasi butir soal
   */
  static duplicateQuestion(id) {
    const original = this.getQuestionById(id);
    if (!original) throw new Error("Soal tidak ditemukan.");

    const duplicatedData = {
      ...original.toJSON(),
      id: `q_${Date.now()}_copy`,
      question_text: `[Salinan] ${original.question_text}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newQ = new UniversalQuestion(duplicatedData);
    return this.saveQuestion(newQ);
  }

  /**
   * Menghapus butir soal dari bank soal
   */
  static deleteQuestion(id) {
    const all = this.getAllQuestions();
    const filtered = all.filter(q => q.id !== id);
    this.saveStoredQuestions(filtered);
    return true;
  }

  /**
   * Menugaskan butir soal ke tipe asesmen tertentu (Pre-Test, Diagnostik, Post-Test)
   */
  static assignToAssessment(questionId, assessmentType) {
    const q = this.getQuestionById(questionId);
    if (!q) throw new Error("Soal tidak ditemukan.");

    if (!q.metadata) q.metadata = {};
    if (!Array.isArray(q.metadata.assignedAssessments)) {
      q.metadata.assignedAssessments = [];
    }

    if (!q.metadata.assignedAssessments.includes(assessmentType)) {
      q.metadata.assignedAssessments.push(assessmentType);
      this.saveQuestion(q);
    }
    return q;
  }

  /**
   * Membuka butir-butir soal untuk Asesmen Tertentu
   */
  static getQuestionsForAssessment(subject = "mathematics", assessmentType = "PRE_TEST") {
    const all = this.getAllQuestions({ subject: subject });
    
    // Cari yang ditugaskan secara eksplisit
    const assigned = all.filter(q => q.metadata?.assignedAssessments?.includes(assessmentType));
    if (assigned.length > 0) return assigned;

    // Fallback cerdas berdasarkan tipe asesmen
    if (subject === "mathematics") {
      if (assessmentType === "PRE_TEST") {
        return all.filter(q => q.id.startsWith("PRE_"));
      } else if (assessmentType === "POST_TEST") {
        return all.filter(q => q.id.startsWith("POST_"));
      } else if (assessmentType === "DIAGNOSTIC") {
        return all.filter(q => q.id.startsWith("DIAG_") || q.id.startsWith("Q"));
      }
    }

    return all.slice(0, 10);
  }

  // =========================================================================
  // SEEDING DEFAULT QUESTION BANK (MATEMATIKA EPE + CONTOH FISIKA, KIMIA, BIO, CS)
  // =========================================================================
  static seedDefaultQuestionBank() {
    const bank = [];

    // 1. Integrasi Form A Pre-Test EPE (12 Butir)
    FORM_A_PRETEST.forEach(q => {
      const uq = UniversalQuestion.fromLegacyEPE(q, "mathematics", "PRE_TEST");
      uq.metadata.assignedAssessments = ["PRE_TEST"];
      bank.push(uq);
    });

    // 2. Integrasi Form B Post-Test EPE (12 Butir)
    FORM_B_POSTTEST.forEach(q => {
      const uq = UniversalQuestion.fromLegacyEPE(q, "mathematics", "POST_TEST");
      uq.metadata.assignedAssessments = ["POST_TEST"];
      bank.push(uq);
    });

    // 3. Integrasi Bank Diagnostik EPE (Q1 - Q24)
    Object.keys(LEGACY_DIAG_QUESTIONS).forEach(k => {
      const q = LEGACY_DIAG_QUESTIONS[k];
      const uq = new UniversalQuestion({
        id: `DIAG_${q.id}`,
        subject: "mathematics",
        topic: q.domain || "Persamaan Kuadrat",
        subtopic: q.concept || "",
        grade_level: "XI SMA/MA",
        difficulty: "medium",
        question_type: "equation_based",
        question_text: q.questionText || q.title || `Soal Diagnostik ${q.id}`,
        latex: q.equation || null,
        options: q.options || [],
        correct_answer: q.correctAnswer || "A",
        explanation: q.remediation || "",
        metadata: {
          assignedAssessments: ["DIAGNOSTIC"],
          expectedError: q.expectedError
        }
      });
      bank.push(uq);
    });

    // 4. Contoh Bank Soal Fisika (Physics)
    bank.push(new UniversalQuestion({
      id: "PHYS_Q01",
      subject: "physics",
      topic: "Kinematika Gerak",
      subtopic: "Gerak Lurus Beraturan (GLB)",
      grade_level: "XI SMA/MA",
      difficulty: "easy",
      question_type: "multiple_choice",
      question_text: "Sebuah mobil bergerak dengan kecepatan konstan 72 km/jam di jalan tol. Berapakah jarak tempuh mobil tersebut dalam selang waktu 15 detik?",
      latex: "v = 72\\text{ km/jam} = 20\\text{ m/s}, \\quad t = 15\\text{ s}",
      options: [
        { key: "A", text: "150 meter", latex: "150\\text{ m}", errorType: null },
        { key: "B", text: "300 meter", latex: "300\\text{ m}", errorType: null },
        { key: "C", text: "450 meter", latex: "450\\text{ m}", errorType: null },
        { key: "D", text: "1.080 meter", latex: "1080\\text{ m}", errorType: null }
      ],
      correct_answer: "B",
      explanation: "v = 72 km/jam = 72 * (1000 m / 3600 s) = 20 m/s. Jarak s = v * t = 20 m/s * 15 s = 300 meter.",
      metadata: { assignedAssessments: ["PRE_TEST", "DIAGNOSTIC"] }
    }));

    bank.push(new UniversalQuestion({
      id: "PHYS_Q02",
      subject: "physics",
      topic: "Dinamika Partikel",
      subtopic: "Hukum II Newton",
      grade_level: "XI SMA/MA",
      difficulty: "medium",
      question_type: "equation_based",
      question_text: "Sebuah balok bermassa 5 kg ditarik dengan gaya mendatar F = 25 N di atas lantai kasar dengan koefisien gesek kinetik 0,2 (g = 10 m/s²). Percepatan balok adalah...",
      latex: "\\Sigma F = m \\cdot a, \\quad f_k = \\mu_k \\cdot N",
      options: [
        { key: "A", text: "1 m/s²", latex: "a = 1\\text{ m/s}^2", errorType: null },
        { key: "B", text: "3 m/s²", latex: "a = 3\\text{ m/s}^2", errorType: null },
        { key: "C", text: "5 m/s²", latex: "a = 5\\text{ m/s}^2", errorType: null },
        { key: "D", text: "7 m/s²", latex: "a = 7\\text{ m/s}^2", errorType: null }
      ],
      correct_answer: "B",
      explanation: "Gaya normal N = m*g = 5*10 = 50 N. Gaya gesek fk = 0.2 * 50 = 10 N. Gaya total = 25 - 10 = 15 N. Maka a = 15/5 = 3 m/s².",
      metadata: { assignedAssessments: ["DIAGNOSTIC", "POST_TEST"] }
    }));

    // 5. Contoh Bank Soal Kimia (Chemistry)
    bank.push(new UniversalQuestion({
      id: "CHEM_Q01",
      subject: "chemistry",
      topic: "Stoikiometri",
      subtopic: "Konsep Mol & Massa Molar",
      grade_level: "XI SMA/MA",
      difficulty: "medium",
      question_type: "multiple_choice",
      question_text: "Berapa gram massa dari 0,5 mol gas karbon dioksida (CO₂)? (Diketahui Ar C = 12, Ar O = 16)",
      latex: "M_r(\\text{CO}_2) = 12 + 2(16) = 44\\text{ g/mol}",
      options: [
        { key: "A", text: "14 gram", latex: "14\\text{ g}", errorType: null },
        { key: "B", text: "22 gram", latex: "22\\text{ g}", errorType: null },
        { key: "C", text: "44 gram", latex: "44\\text{ g}", errorType: null },
        { key: "D", text: "88 gram", latex: "88\\text{ g}", errorType: null }
      ],
      correct_answer: "B",
      explanation: "Mr CO2 = 12 + 32 = 44 g/mol. Massa = mol * Mr = 0.5 * 44 = 22 gram.",
      metadata: { assignedAssessments: ["PRE_TEST", "DIAGNOSTIC"] }
    }));

    bank.push(new UniversalQuestion({
      id: "CHEM_Q02",
      subject: "chemistry",
      topic: "Larutan Asam Basa",
      subtopic: "Perhitungan pH Asam Kuat",
      grade_level: "XI SMA/MA",
      difficulty: "easy",
      question_type: "multiple_choice",
      question_text: "Tentukan pH dari larutan HCl dengan konsentrasi 0,001 M.",
      latex: "\\text{pH} = -\\log[\\text{H}^+], \\quad [\\text{H}^+] = 10^{-3}\\text{ M}",
      options: [
        { key: "A", text: "1", latex: "\\text{pH} = 1", errorType: null },
        { key: "B", text: "2", latex: "\\text{pH} = 2", errorType: null },
        { key: "C", text: "3", latex: "\\text{pH} = 3", errorType: null },
        { key: "D", text: "11", latex: "\\text{pH} = 11", errorType: null }
      ],
      correct_answer: "C",
      explanation: "[H+] = 0.001 M = 10^-3 M. pH = -log(10^-3) = 3.",
      metadata: { assignedAssessments: ["DIAGNOSTIC", "POST_TEST"] }
    }));

    // 6. Contoh Bank Soal Biologi (Biology)
    bank.push(new UniversalQuestion({
      id: "BIO_Q01",
      subject: "biology",
      topic: "Struktur & Fungsi Sel",
      subtopic: "Organel Sel Eukariotik",
      grade_level: "XI SMA/MA",
      difficulty: "easy",
      question_type: "multiple_choice",
      question_text: "Organel sel yang berfungsi sebagai tempat utama pembentukan energi seluler dalam bentuk adenosin trifosfat (ATP) melalui respirasi aerob adalah...",
      options: [
        { key: "A", text: "Ribosom", errorType: null },
        { key: "B", text: "Mitokondria", errorType: null },
        { key: "C", text: "Badan Golgi", errorType: null },
        { key: "D", text: "Retikulum Endoplasma", errorType: null }
      ],
      correct_answer: "B",
      explanation: "Mitokondria dijuluki sebagai 'the powerhouse of the cell' karena memproduksi sebagian besar pasokan ATP seluler melalui respirasi sel.",
      metadata: { assignedAssessments: ["PRE_TEST", "DIAGNOSTIC", "POST_TEST"] }
    }));

    // 7. Contoh Bank Soal Ilmu Komputer (Computer Science)
    bank.push(new UniversalQuestion({
      id: "CS_Q01",
      subject: "computer_science",
      topic: "Berpikir Komputasional",
      subtopic: "Struktur Kontrol & Kompleksitas",
      grade_level: "XI SMA/MA",
      difficulty: "medium",
      question_type: "multiple_choice",
      question_text: "Algoritma pencarian biner (Binary Search) mengharuskan sekumpulan data dalam kondisi terurut. Berapakah kompleksitas waktu terbaik (best case) dan terburuk (worst case) algoritma ini?",
      latex: "O(1) \\quad \\text{dan} \\quad O(\\log n)",
      options: [
        { key: "A", text: "O(1) dan O(n)", latex: "O(1) \\text{ dan } O(n)", errorType: null },
        { key: "B", text: "O(1) dan O(log n)", latex: "O(1) \\text{ dan } O(\\log n)", errorType: null },
        { key: "C", text: "O(n) dan O(n²)", latex: "O(n) \\text{ dan } O(n^2)", errorType: null },
        { key: "D", text: "O(log n) dan O(n log n)", latex: "O(\\log n) \\text{ dan } O(n \\log n)", errorType: null }
      ],
      correct_answer: "B",
      explanation: "Best case Binary Search adalah O(1) saat elemen tengah langsung cocok, dan worst case adalah O(log n) saat membagi ruang pencarian menjadi setengah berulang kali.",
      metadata: { assignedAssessments: ["PRE_TEST", "DIAGNOSTIC", "POST_TEST"] }
    }));

    return bank;
  }

  // =========================================================================
  // LOCAL STORAGE PERSISTENCE
  // =========================================================================
  static loadStoredQuestions() {
    try {
      const raw = localStorage.getItem(QUESTION_BANK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(item => new UniversalQuestion(item));
      }
      return [];
    } catch (e) {
      console.error("Gagal membaca bank soal lokal:", e);
      return [];
    }
  }

  static saveStoredQuestions(questions) {
    try {
      const serialized = questions.map(q => q.toJSON());
      localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(serialized));
    } catch (e) {
      console.error("Gagal menyimpan bank soal lokal:", e);
    }
  }

  /**
   * Ekspor seluruh bank soal ke format JSON
   */
  static exportToJSON() {
    const all = this.getAllQuestions();
    return JSON.stringify(all.map(q => q.toJSON()), null, 2);
  }

  /**
   * Impor bank soal dari string JSON
   */
  static importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) throw new Error("Format JSON harus berupa array objek soal.");
      
      let importedCount = 0;
      parsed.forEach(item => {
        const uq = new UniversalQuestion(item);
        if (uq.validate().isValid) {
          this.saveQuestion(uq);
          importedCount++;
        }
      });
      return { success: true, count: importedCount };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
