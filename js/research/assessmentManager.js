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

    if (questions.length === 0 || !questions.some(q => q.id === "MATH_EXT_Q01")) {
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

    // 3b. Bank Soal Pengayaan Matematika EPE (Mendukung Asesmen 50+ Soal & Durasi 120 Menit Guru)
    const EXTENDED_MATH_QUESTIONS = [
      {
        id: "MATH_EXT_Q01",
        topic: "Persamaan Kuadrat",
        subtopic: "Akar Persamaan Kuadrat Murni",
        difficulty: "easy",
        question_text: "Tentukan himpunan penyelesaian dari persamaan kuadrat murni: 3x² - 12 = 0.",
        latex: "3x^2 - 12 = 0",
        options: [
          { key: "A", text: "x = 2 saja", latex: "x = 2", errorType: "E1" },
          { key: "B", text: "x = -2 atau x = 2", latex: "x = \\pm 2", errorType: "E0" },
          { key: "C", text: "x = 4 atau x = -4", latex: "x = \\pm 4", errorType: "E3" },
          { key: "D", text: "x = √6", latex: "x = \\sqrt{6}", errorType: "E2" }
        ],
        correct_answer: "B",
        explanation: "3x² = 12 <=> x² = 4 <=> x = ±2.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q02",
        topic: "Faktorisasi",
        subtopic: "Selisih Dua Kuadrat",
        difficulty: "easy",
        question_text: "Faktorkan persamaan aljabar berikut ke dalam bentuk perkalian faktor linear: 4x² - 49 = 0.",
        latex: "4x^2 - 49 = (2x - p)(2x + q)",
        options: [
          { key: "A", text: "(2x - 7)(2x + 7) = 0", latex: "(2x - 7)(2x + 7) = 0", errorType: "E0" },
          { key: "B", text: "(4x - 7)(x + 7) = 0", latex: "(4x - 7)(x + 7) = 0", errorType: "E2" },
          { key: "C", text: "(2x - 7)² = 0", latex: "(2x - 7)^2 = 0", errorType: "E1" },
          { key: "D", text: "(2x + 49)(2x - 1) = 0", latex: "(2x + 49)(2x - 1) = 0", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "Bentuk selisih dua kuadrat a² - b² = (a - b)(a + b). Di sini a = 2x dan b = 7.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q03",
        topic: "Faktorisasi",
        subtopic: "Trinomial Positif (a = 1)",
        difficulty: "easy",
        question_text: "Akar-akar dari persamaan kuadrat x² + 7x + 12 = 0 adalah...",
        latex: "x^2 + 7x + 12 = 0",
        options: [
          { key: "A", text: "x = 3 atau x = 4", latex: "x = 3 \\text{ atau } x = 4", errorType: "E2" },
          { key: "B", text: "x = -3 atau x = -4", latex: "x = -3 \\text{ atau } x = -4", errorType: "E0" },
          { key: "C", text: "x = -2 atau x = -6", latex: "x = -2 \\text{ atau } x = -6", errorType: "E3" },
          { key: "D", text: "x = 1 atau x = 12", latex: "x = 1 \\text{ atau } x = 12", errorType: "E1" }
        ],
        correct_answer: "B",
        explanation: "(x + 3)(x + 4) = 0, sehingga x = -3 atau x = -4.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q04",
        topic: "Diskriminan",
        subtopic: "Akar Real Kembar (D = 0)",
        difficulty: "medium",
        question_text: "Hitung nilai diskriminan D dari persamaan 2x² - 4x + 2 = 0 serta tentukan sifat akarnya.",
        latex: "D = b^2 - 4ac",
        options: [
          { key: "A", text: "D = 0, memiliki dua akar real kembar (sama)", latex: "D = 0", errorType: "E0" },
          { key: "B", text: "D = 16, memiliki dua akar berlainan", latex: "D = 16", errorType: "E3" },
          { key: "C", text: "D = -16, tidak memiliki akar real", latex: "D = -16", errorType: "E2" },
          { key: "D", text: "D = 8, memiliki akar irasional", latex: "D = 8", errorType: "E1" }
        ],
        correct_answer: "A",
        explanation: "D = (-4)² - 4(2)(2) = 16 - 16 = 0. Sifat: akar real kembar.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q05",
        topic: "Diskriminan",
        subtopic: "Parameter Konstanta K",
        difficulty: "hard",
        question_text: "Tentukan nilai konstanta k agar persamaan kuadrat x² + 6x + k = 0 mempunyai dua akar real kembar.",
        latex: "D = b^2 - 4ac = 0",
        options: [
          { key: "A", text: "k = 6", latex: "k = 6", errorType: "E1" },
          { key: "B", text: "k = 9", latex: "k = 9", errorType: "E0" },
          { key: "C", text: "k = 12", latex: "k = 12", errorType: "E3" },
          { key: "D", text: "k = 36", latex: "k = 36", errorType: "E2" }
        ],
        correct_answer: "B",
        explanation: "Syarat akar kembar D = 0 => 6² - 4(1)(k) = 0 => 36 - 4k = 0 => 4k = 36 => k = 9.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q06",
        topic: "Faktorisasi",
        subtopic: "Koefisien a > 1",
        difficulty: "medium",
        question_text: "Himpunan penyelesaian dari persamaan kuadrat 2x² + 5x - 3 = 0 adalah...",
        latex: "2x^2 + 5x - 3 = 0",
        options: [
          { key: "A", text: "x = 1/2 atau x = -3", latex: "x = \\frac{1}{2} \\text{ atau } x = -3", errorType: "E0" },
          { key: "B", text: "x = -1/2 atau x = 3", latex: "x = -\\frac{1}{2} \\text{ atau } x = 3", errorType: "E2" },
          { key: "C", text: "x = 1 atau x = -3/2", latex: "x = 1 \\text{ atau } x = -\\frac{3}{2}", errorType: "E3" },
          { key: "D", text: "x = 2 atau x = -3", latex: "x = 2 \\text{ atau } x = -3", errorType: "E1" }
        ],
        correct_answer: "A",
        explanation: "(2x - 1)(x + 3) = 0 => 2x = 1 => x = 1/2 atau x = -3.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q07",
        topic: "Hubungan Akar",
        subtopic: "Teorema Vieta (Jumlah Akar)",
        difficulty: "medium",
        question_text: "Jika x₁ dan x₂ adalah akar-akar dari 3x² - 12x + 7 = 0, hitunglah nilai dari (x₁ + x₂).",
        latex: "x_1 + x_2 = -\\frac{b}{a}",
        options: [
          { key: "A", text: "4", latex: "4", errorType: "E0" },
          { key: "B", text: "-4", latex: "-4", errorType: "E2" },
          { key: "C", text: "7/3", latex: "\\frac{7}{3}", errorType: "E1" },
          { key: "D", text: "12", latex: "12", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "x₁ + x₂ = -(-12)/3 = 12/3 = 4.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q08",
        topic: "Hubungan Akar",
        subtopic: "Teorema Vieta (Hasil Kali Akar)",
        difficulty: "medium",
        question_text: "Diberikan persamaan 5x² + 8x - 15 = 0. Berapakah hasil kali akar-akarnya (x₁ · x₂)?",
        latex: "x_1 \\cdot x_2 = \\frac{c}{a}",
        options: [
          { key: "A", text: "-3", latex: "-3", errorType: "E0" },
          { key: "B", text: "3", latex: "3", errorType: "E2" },
          { key: "C", text: "-8/5", latex: "-\\frac{8}{5}", errorType: "E1" },
          { key: "D", text: "-15", latex: "-15", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "x₁ · x₂ = c/a = -15/5 = -3.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q09",
        topic: "Hubungan Akar",
        subtopic: "Menyusun Persamaan Baru",
        difficulty: "medium",
        question_text: "Susunlah persamaan kuadrat baru yang memiliki akar-akar x₁ = 3 dan x₂ = -5.",
        latex: "x^2 - (x_1 + x_2)x + (x_1 x_2) = 0",
        options: [
          { key: "A", text: "x² + 2x - 15 = 0", latex: "x^2 + 2x - 15 = 0", errorType: "E0" },
          { key: "B", text: "x² - 2x - 15 = 0", latex: "x^2 - 2x - 15 = 0", errorType: "E2" },
          { key: "C", text: "x² + 8x + 15 = 0", latex: "x^2 + 8x + 15 = 0", errorType: "E1" },
          { key: "D", text: "x² - 15x + 2 = 0", latex: "x^2 - 15x + 2 = 0", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "x₁ + x₂ = 3 + (-5) = -2. x₁ · x₂ = 3 · (-5) = -15. Persamaan: x² - (-2)x + (-15) = x² + 2x - 15 = 0.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q10",
        topic: "Fungsi Kuadrat",
        subtopic: "Titik Potong Sumbu Y",
        difficulty: "easy",
        question_text: "Tentukan koordinat titik potong grafik fungsi kuadrat f(x) = 2x² - 5x - 7 dengan sumbu Y.",
        latex: "x = 0 \\implies f(0) = c",
        options: [
          { key: "A", text: "(0, -7)", latex: "(0, -7)", errorType: "E0" },
          { key: "B", text: "(0, 7)", latex: "(0, 7)", errorType: "E2" },
          { key: "C", text: "(-7, 0)", latex: "(-7, 0)", errorType: "E1" },
          { key: "D", text: "(2, -5)", latex: "(2, -5)", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "Titik potong sumbu Y diperoleh saat x = 0 => f(0) = 2(0)² - 5(0) - 7 = -7. Koordinat: (0, -7).",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q11",
        topic: "Fungsi Kuadrat",
        subtopic: "Persamaan Sumbu Simetri",
        difficulty: "medium",
        question_text: "Persamaan sumbu simetri dari grafik parabola f(x) = x² - 6x + 8 adalah...",
        latex: "x_s = -\\frac{b}{2a}",
        options: [
          { key: "A", text: "x = 3", latex: "x = 3", errorType: "E0" },
          { key: "B", text: "x = -3", latex: "x = -3", errorType: "E2" },
          { key: "C", text: "x = 6", latex: "x = 6", errorType: "E1" },
          { key: "D", text: "x = 4", latex: "x = 4", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "xs = -b / (2a) = -(-6) / (2 * 1) = 6 / 2 = 3.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q12",
        topic: "Fungsi Kuadrat",
        subtopic: "Nilai Optimum Minimum",
        difficulty: "medium",
        question_text: "Nilai optimum (minimum) dari fungsi kuadrat f(x) = x² - 4x + 7 adalah...",
        latex: "y_p = -\\frac{D}{4a} \\text{ atau } f(x_s)",
        options: [
          { key: "A", text: "3", latex: "y = 3", errorType: "E0" },
          { key: "B", text: "7", latex: "y = 7", errorType: "E1" },
          { key: "C", text: "-3", latex: "y = -3", errorType: "E2" },
          { key: "D", text: "2", latex: "y = 2", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "Sumbu simetri x = -(-4)/2 = 2. Nilai minimum f(2) = (2)² - 4(2) + 7 = 4 - 8 + 7 = 3.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q13",
        topic: "Fungsi Kuadrat",
        subtopic: "Titik Puncak Parabola",
        difficulty: "hard",
        question_text: "Koordinat titik puncak dari fungsi kuadrat f(x) = -x² + 4x - 1 adalah...",
        latex: "(x_p, y_p) = \\left(-\\frac{b}{2a}, -\\frac{b^2 - 4ac}{4a}\\right)",
        options: [
          { key: "A", text: "(2, 3)", latex: "(2, 3)", errorType: "E0" },
          { key: "B", text: "(-2, 3)", latex: "(-2, 3)", errorType: "E2" },
          { key: "C", text: "(2, -1)", latex: "(2, -1)", errorType: "E1" },
          { key: "D", text: "(4, 3)", latex: "(4, 3)", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "xp = -4 / (2*(-1)) = 2. yp = -(2)² + 4(2) - 1 = -4 + 8 - 1 = 3. Titik puncak: (2, 3).",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q14",
        topic: "Penerapan",
        subtopic: "Pemodelan Geometri Luas",
        difficulty: "hard",
        question_text: "Sebuah kebun berbentuk persegi panjang memiliki panjang 7 meter lebih dari lebarnya. Jika luas kebun adalah 60 m², berapakah keliling kebun tersebut?",
        latex: "L = p \\times l = (l + 7) \\times l = 60",
        options: [
          { key: "A", text: "34 meter", latex: "K = 34\\text{ m}", errorType: "E0" },
          { key: "B", text: "17 meter", latex: "K = 17\\text{ m}", errorType: "E1" },
          { key: "C", text: "40 meter", latex: "K = 40\\text{ m}", errorType: "E3" },
          { key: "D", text: "32 meter", latex: "K = 32\\text{ m}", errorType: "E2" }
        ],
        correct_answer: "A",
        explanation: "l(l + 7) = 60 => l² + 7l - 60 = 0 => (l + 12)(l - 5) = 0. Karena lebar positif, l = 5 m. Panjang p = 5 + 7 = 12 m. Keliling = 2(p + l) = 2(12 + 5) = 34 meter.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q15",
        topic: "Penerapan",
        subtopic: "Fisika Kinematika Vertikal",
        difficulty: "hard",
        question_text: "Ketinggian peluru yang ditembakkan ke atas setelah t detik memenuhi rumus h(t) = 40t - 5t² (meter). Berapakah tinggi maksimum yang dapat dicapai peluru?",
        latex: "h(t) = 40t - 5t^2",
        options: [
          { key: "A", text: "80 meter", latex: "80\\text{ meter}", errorType: "E0" },
          { key: "B", text: "40 meter", latex: "40\\text{ meter}", errorType: "E1" },
          { key: "C", text: "100 meter", latex: "100\\text{ meter}", errorType: "E3" },
          { key: "D", text: "60 meter", latex: "60\\text{ meter}", errorType: "E2" }
        ],
        correct_answer: "A",
        explanation: "Waktu mencapai tinggi maksimum t = -b/(2a) = -40 / (2*(-5)) = 4 detik. h(4) = 40(4) - 5(4)² = 160 - 80 = 80 meter.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q16",
        topic: "Pertidaksamaan",
        subtopic: "Pertidaksamaan Kuadrat Terbuka",
        difficulty: "medium",
        question_text: "Tentukan himpunan penyelesaian dari pertidaksamaan kuadrat: x² - 5x + 6 < 0.",
        latex: "x^2 - 5x + 6 < 0",
        options: [
          { key: "A", text: "2 < x < 3", latex: "2 < x < 3", errorType: "E0" },
          { key: "B", text: "x < 2 atau x > 3", latex: "x < 2 \\text{ atau } x > 3", errorType: "E2" },
          { key: "C", text: "-3 < x < -2", latex: "-3 < x < -2", errorType: "E1" },
          { key: "D", text: "x ≤ 2 atau x ≥ 3", latex: "x \\le 2 \\text{ atau } x \\ge 3", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "(x - 2)(x - 3) < 0. Pembuat nol x = 2 dan x = 3. Daerah bernilai negatif (< 0) berada di antara kedua akar: 2 < x < 3.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q17",
        topic: "Pertidaksamaan",
        subtopic: "Pertidaksamaan Selisih Kuadrat",
        difficulty: "medium",
        question_text: "Himpunan penyelesaian dari pertidaksamaan kuadrat x² - 9 ≥ 0 adalah...",
        latex: "x^2 - 9 \\ge 0",
        options: [
          { key: "A", text: "x ≤ -3 atau x ≥ 3", latex: "x \\le -3 \\text{ atau } x \\ge 3", errorType: "E0" },
          { key: "B", text: "-3 ≤ x ≤ 3", latex: "-3 \\le x \\le 3", errorType: "E2" },
          { key: "C", text: "x ≥ 3 saja", latex: "x \\ge 3", errorType: "E1" },
          { key: "D", text: "x ≥ 9", latex: "x \\ge 9", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "(x - 3)(x + 3) ≥ 0. Daerah bernilai positif berada di luar interval: x ≤ -3 atau x ≥ 3.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q18",
        topic: "Diskriminan",
        subtopic: "Akar Non-Real Imajiner",
        difficulty: "medium",
        question_text: "Bagaimanakah sifat akar-akar dari persamaan kuadrat x² + 2x + 5 = 0?",
        latex: "D = b^2 - 4ac = (2)^2 - 4(1)(5)",
        options: [
          { key: "A", text: "Tidak memiliki akar real (akar imajiner)", latex: "D < 0", errorType: "E0" },
          { key: "B", text: "Memiliki dua akar real berbeda", latex: "D > 0", errorType: "E1" },
          { key: "C", text: "Memiliki dua akar kembar", latex: "D = 0", errorType: "E2" },
          { key: "D", text: "Akarnya bernilai positif", latex: "x > 0", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "D = 2² - 4(1)(5) = 4 - 20 = -16. Karena D < 0, persamaan tidak memiliki akar real.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q19",
        topic: "Hubungan Akar",
        subtopic: "Jumlah Kuadrat Akar",
        difficulty: "hard",
        question_text: "Jika x₁ dan x₂ adalah akar-akar dari x² - 5x + 2 = 0, berapakah nilai dari (x₁² + x₂²)?",
        latex: "x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2",
        options: [
          { key: "A", text: "21", latex: "21", errorType: "E0" },
          { key: "B", text: "25", latex: "25", errorType: "E1" },
          { key: "C", text: "29", latex: "29", errorType: "E2" },
          { key: "D", text: "17", latex: "17", errorType: "E3" }
        ],
        correct_answer: "A",
        explanation: "x₁ + x₂ = 5, x₁ · x₂ = 2. x₁² + x₂² = (x₁ + x₂)² - 2(x₁ · x₂) = 5² - 2(2) = 25 - 4 = 21.",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      },
      {
        id: "MATH_EXT_Q20",
        topic: "Penerapan",
        subtopic: "Durasi Waktu Melayang (Akar Fisis)",
        difficulty: "hard",
        question_text: "Sebuah roket air meluncur dengan lintasan ketinggian h(t) = 30t - 5t² (meter). Berapa detik durasi roket tersebut mengudara hingga mendarat kembali di tanah?",
        latex: "h(t) = 0 \\implies 5t(6 - t) = 0",
        options: [
          { key: "A", text: "6 detik", latex: "t = 6\\text{ s}", errorType: "E0" },
          { key: "B", text: "3 detik", latex: "t = 3\\text{ s}", errorType: "E1" },
          { key: "C", text: "5 detik", latex: "t = 5\\text{ s}", errorType: "E3" },
          { key: "D", text: "10 detik", latex: "t = 10\\text{ s}", errorType: "E2" }
        ],
        correct_answer: "A",
        explanation: "Saat kembali ke tanah h(t) = 0 => 30t - 5t² = 0 => 5t(6 - t) = 0. t = 0 (saat peluncuran) dan t = 6 detik (saat mendarat kembali).",
        metadata: { assignedAssessments: ["PRE_TEST", "POST_TEST", "DIAGNOSTIC"] }
      }
    ];

    EXTENDED_MATH_QUESTIONS.forEach(item => {
      bank.push(new UniversalQuestion({
        id: item.id,
        subject: "mathematics",
        topic: item.topic,
        subtopic: item.subtopic,
        grade_level: "XI SMA/MA",
        difficulty: item.difficulty,
        question_type: "equation_based",
        question_text: item.question_text,
        latex: item.latex,
        options: item.options,
        correct_answer: item.correct_answer,
        explanation: item.explanation,
        metadata: item.metadata
      }));
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
