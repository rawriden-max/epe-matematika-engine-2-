/**
 * customQuestionStore.js - Bank Soal Latihan Mandiri & Persiapan Ujian
 * Menyimpan soal kustom siswa/guru dengan dukungan Gambar, File Dokumen, dan Audio Voice Note.
 */

const STORAGE_KEY = "epe_custom_questions";

// Kumpulan Soal Latihan & Tryout Bawaan untuk Persiapan Ulangan / Ujian
export const DEFAULT_PRACTICE_QUESTIONS = [
  {
    id: "LAT-01",
    title: "Latihan Ujian: Luas Kebun Persegi Panjang Berbentuk Kuadrat",
    topic: "Pemodelan Masalah Nyata & Interpretasi Geometris",
    category: "Geometri Terapan",
    promptText: "Sebuah kebun berbentuk persegi panjang memiliki panjang (x + 4) meter dan lebar (x - 2) meter. Jika luas kebun tersebut adalah 40 m², tentukan nilai x dan ukuran panjang serta lebar kebun tersebut!",
    latexEquation: "(x + 4)(x - 2) = 40",
    standardAnswer: "x = 6 (Panjang = 10 m, Lebar = 4 m)",
    explanation: "Persamaan: (x+4)(x-2) = 40 => x² + 2x - 8 = 40 => x² + 2x - 48 = 0. Faktorisasi: (x + 8)(x - 6) = 0. Akar: x = -8 atau x = 6. Karena ukuran panjang geometri bernilai positif, pilih x = 6. Maka panjang = 6+4 = 10 m, lebar = 6-2 = 4 m.",
    image: null,
    fileAttachment: null,
    audioNote: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    isBuiltIn: true
  },
  {
    id: "LAT-02",
    title: "Latihan Ujian: Titik Puncak & Ketinggian Maksimum Roket Air",
    topic: "Aplikasi Nilai Ekstrim Parabola (Titik Balik Maksimum)",
    category: "Fisika Matematika",
    promptText: "Ketinggian roket air setelah t detik dinyatakan dengan rumus h(t) = -5t² + 20t + 25 meter. Tentukan waktu t saat roket mencapai ketinggian maksimum dan berapa tinggi maksimum yang dicapai roket tersebut!",
    latexEquation: "h(t) = -5t^2 + 20t + 25",
    standardAnswer: "Waktu t = 2 detik, Ketinggian Maksimum = 45 meter",
    explanation: "Nilai t puncak = -b / (2a) = -20 / (2*(-5)) = 2 detik. Tinggi maksimum h(2) = -5(2)² + 20(2) + 25 = -20 + 40 + 25 = 45 meter.",
    image: null,
    fileAttachment: null,
    audioNote: null,
    createdAt: "2026-09-01T08:30:00.000Z",
    isBuiltIn: true
  },
  {
    id: "LAT-03",
    title: "Latihan Ujian: Persamaan Kuadrat dengan Koefisien Pecahan & Negatif",
    topic: "Penyelesaian Rumus Kuadratik ABC Bentuk Pecahan",
    category: "Aljabar Menengah",
    promptText: "Tentukan himpunan penyelesaian dari persamaan kuadrat: (1/2)x² - (3/2)x - 2 = 0 menggunakan metode pemfaktoran atau rumus ABC!",
    latexEquation: "\\frac{1}{2}x^2 - \\frac{3}{2}x - 2 = 0 \\implies x^2 - 3x - 4 = 0",
    standardAnswer: "x = 4 atau x = -1",
    explanation: "Kalikan kedua ruas dengan 2: x² - 3x - 4 = 0. Faktorisasi: (x - 4)(x + 1) = 0. Diperoleh akar x₁ = 4 atau x₂ = -1.",
    image: null,
    fileAttachment: null,
    audioNote: null,
    createdAt: "2026-09-01T09:00:00.000Z",
    isBuiltIn: true
  },
  {
    id: "LAT-04",
    title: "Latihan Ujian: Pembentukan Persamaan Kuadrat Baru Akar Simetris",
    topic: "Aplikasi Teorema Vieta (Jumlah dan Hasil Kali Akar)",
    category: "Teorema Vieta",
    promptText: "Akar-akar persamaan 2x² - 6x + 1 = 0 adalah α dan β. Susunlah persamaan kuadrat baru yang akar-akarnya adalah (2α + 1) dan (2β + 1)!",
    latexEquation: "2x^2 - 6x + 1 = 0 \\quad (\\alpha + \\beta = 3, \\quad \\alpha\\beta = \\frac{1}{2})",
    standardAnswer: "x² - 8x + 9 = 0",
    explanation: "α + β = 3, αβ = 1/2. Jumlah akar baru: (2α+1)+(2β+1) = 2(α+β)+2 = 2(3)+2 = 8. Hasil kali akar baru: (2α+1)(2β+1) = 4αβ + 2(α+β) + 1 = 4(1/2) + 2(3) + 1 = 2 + 6 + 1 = 9. Persamaan kuadrat baru: x² - (jumlah)x + (hasil kali) = 0 => x² - 8x + 9 = 0.",
    image: null,
    fileAttachment: null,
    audioNote: null,
    createdAt: "2026-09-01T09:30:00.000Z",
    isBuiltIn: true
  }
];

export class CustomQuestionStore {
  constructor() {
    this.questions = [];
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.questions = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn("Gagal memuat bank soal kustom dari localStorage:", e);
    }
    
    // Inisialisasi dengan soal latihan bawaan
    this.questions = [...DEFAULT_PRACTICE_QUESTIONS];
    this.saveToStorage();
  }

  getAll() {
    return this.questions;
  }

  getById(id) {
    return this.questions.find((q) => q.id === id) || null;
  }

  addQuestion(questionData) {
    const newId = questionData.id || `SOAL-${Date.now().toString().slice(-5)}`;
    const newQuestion = {
      id: newId,
      title: questionData.title || "Soal Latihan Baru",
      topic: questionData.topic || "Latihan Mandiri Persiapan Ujian",
      category: questionData.category || "Umum",
      promptText: questionData.promptText || "",
      latexEquation: questionData.latexEquation || "",
      standardAnswer: questionData.standardAnswer || "",
      explanation: questionData.explanation || "",
      image: questionData.image || null, // { name, dataUrl, size }
      fileAttachment: questionData.fileAttachment || null, // { name, dataUrl, size, type }
      audioNote: questionData.audioNote || null, // { dataUrl, duration, name }
      createdAt: new Date().toISOString(),
      isBuiltIn: false
    };

    this.questions.unshift(newQuestion);
    this.saveToStorage();
    return newQuestion;
  }

  updateQuestion(id, updatedData) {
    const index = this.questions.findIndex((q) => q.id === id);
    if (index !== -1) {
      this.questions[index] = {
        ...this.questions[index],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage();
      return this.questions[index];
    }
    return null;
  }

  deleteQuestion(id) {
    this.questions = this.questions.filter((q) => q.id !== id);
    this.saveToStorage();
  }

  resetToDefault() {
    this.questions = [...DEFAULT_PRACTICE_QUESTIONS];
    this.saveToStorage();
    return this.questions;
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.questions));
    } catch (e) {
      console.error("Gagal menyimpan bank soal ke localStorage:", e);
    }
  }

  exportToJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.questions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bank_soal_epe_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        // Validasi dasar
        const validQuestions = parsed.filter((q) => q.title && q.promptText);
        if (validQuestions.length > 0) {
          this.questions = validQuestions;
          this.saveToStorage();
          return { success: true, count: validQuestions.length };
        }
      }
      return { success: false, message: "Format file JSON tidak sesuai struktur bank soal." };
    } catch (err) {
      return { success: false, message: "Gagal mem-parsing file JSON: " + err.message };
    }
  }
}
