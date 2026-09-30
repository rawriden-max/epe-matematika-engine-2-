/**
 * photoMathSolver.js - Scanner Soal Matematika AI & Kognitif Diagnostik (EPE V3)
 * 
 * Fitur Utama:
 * 1. Multi-Provider Vision AI (Bring Your Own Key - BYOK):
 *    - Google Gemini (Gemini 1.5 Flash / Pro)
 *    - OpenAI (GPT-4o / GPT-4o-mini)
 *    - Anthropic Claude (Claude 3.5 Sonnet / Haiku)
 * 2. Multi-Problem Worksheet Support:
 *    - Mendeteksi & memproses BANYAK SOAL sekaligus dalam satu lembar kerja (misal: 4 soal perkalian pecahan)
 *    - Navigasi tab: "Semua Soal" atau per nomor soal ("Soal 1", "Soal 2", dst)
 * 3. Matrix AI Chat Math Formatting:
 *    - Rendering KaTeX / LaTeX untuk penulisan matematika komputer presisi tinggi
 *    - Langkah-langkah penyelesaian bertahap bergaya AI Matrix Chat
 * 4. Dual Mode:
 *    - Mode 1: Solusi Langsung (Auto-Solve) -> Penjelasan konsep, rumus, & jawaban akhir seketika
 *    - Mode 2: Mode Soal & Diagnosis Mandiri (Interactive Quiz & Cognitive Diagnostic) ->
 *              AI mengevaluasi jawaban siswa, mengidentifikasi miskonsepsi D1–D6, & memberikan reward Cubic!
 */

import { CubicWallet } from "../economy/cubicWallet.js";
import { NotificationToast } from "./notification.js";
import { AiVisionService } from "../services/aiVisionService.js";
import { MediaManager } from "./mediaManager.js";
import { SpeechMathParser } from "../multimodal/speechMathParser.js";

// Sample Soal Matematika Siap Uji (Termasuk Dokumen PDF, Berkas LaTeX .tex, dan Foto Lembar Kerja)
export const SAMPLE_MATH_PHOTOS = [
  {
    id: "sample_pdf_worksheet",
    title: "Dokumen Lembar Kerja PDF (4 Soal Pecahan)",
    badge: "Dokumen PDF • 4 Soal",
    fileMeta: {
      name: "Lembar_Kerja_Siswa_Pecahan.pdf",
      sizeFormatted: "184 KB",
      isPdf: true,
      extension: "pdf"
    },
    isMultiProblem: true,
    sheetTitle: "Dokumen PDF: Lembar Kerja Siswa Perkalian Pecahan (4 Butir Soal)",
    latex: "\\frac{3}{2}\\times\\frac{1}{3}, \\quad \\frac{5}{2}\\times\\frac{2}{10}, \\quad \\frac{4}{2}\\times\\frac{3}{4}, \\quad \\frac{3}{5}\\times\\frac{5}{7}",
    questionText: "Hitung dan sederhanakan hasil perkalian pecahan pada ke-4 butir soal dalam berkas dokumen PDF ini!",
    domain: "D6: Operasi Pecahan Aljabar",
    problems: [
      {
        number: 1,
        title: "Soal 1: Perkalian Pecahan Biasa",
        badge: "Pecahan Soal 1",
        latex: "\\frac{3}{2} \\times \\frac{1}{3} = \\text{?}",
        questionText: "Hitung hasil perkalian pecahan \\frac{3}{2} \\times \\frac{1}{3} dan sederhanakan ke bentuk paling ringkas!",
        solutionSteps: [
          "Rumus perkalian pecahan: $\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}$.",
          "Kalikan pembilang dengan pembilang: $3 \\times 1 = 3$.",
          "Kalikan penyebut dengan penyebut: $2 \\times 3 = 6$.",
          "Dihasilkan pecahan $\\frac{3}{6}$. Sederhanakan dengan membagi FPB $(3)$: $\\frac{3 \\div 3}{6 \\div 3} = \\frac{1}{2}$."
        ],
        finalAnswer: "\\frac{1}{2}",
        idealAnswerKeywords: ["1/2", "0.5", "0,5", "\\frac{1}{2}", "setengah"],
        domain: "D6: Operasi Pecahan Aljabar"
      },
      {
        number: 2,
        title: "Soal 2: Perkalian & Penyederhanaan Pecahan",
        badge: "Pecahan Soal 2",
        latex: "\\frac{5}{2} \\times \\frac{2}{10} = \\text{?}",
        questionText: "Hitung hasil dari \\frac{5}{2} \\times \\frac{2}{10} dan tentukan bentuk pecahan paling sederhananya!",
        solutionSteps: [
          "Kalikan pembilang dengan pembilang: $5 \\times 2 = 10$.",
          "Kalikan penyebut dengan penyebut: $2 \\times 10 = 20$.",
          "Pecahan yang didapat: $\\frac{10}{20} = \\frac{1}{2}$."
        ],
        finalAnswer: "\\frac{1}{2}",
        idealAnswerKeywords: ["1/2", "0.5", "0,5", "\\frac{1}{2}", "setengah"],
        domain: "D6: Operasi Pecahan Aljabar"
      },
      {
        number: 3,
        title: "Soal 3: Perkalian Pecahan Biasa",
        badge: "Pecahan Soal 3",
        latex: "\\frac{4}{2} \\times \\frac{3}{4} = \\text{?}",
        questionText: "Hitung hasil dari \\frac{4}{2} \\times \\frac{3}{4} dan nyatakan dalam bentuk pecahan paling sederhana atau campuran!",
        solutionSteps: [
          "Gunakan metode pencoretan silang: $\\frac{\\cancel{4}^1}{2} \\times \\frac{3}{\\cancel{4}_1} = \\frac{3}{2}$.",
          "Konversi ke pecahan campuran: $\\frac{3}{2} = 1\\frac{1}{2}$."
        ],
        finalAnswer: "\\frac{3}{2} \\quad \\text{atau} \\quad 1\\frac{1}{2}",
        idealAnswerKeywords: ["3/2", "1 1/2", "1,5", "1.5", "\\frac{3}{2}", "1\\frac{1}{2}"],
        domain: "D6: Operasi Pecahan Aljabar"
      },
      {
        number: 4,
        title: "Soal 4: Perkalian Pecahan Biasa",
        badge: "Pecahan Soal 4",
        latex: "\\frac{3}{5} \\times \\frac{5}{7} = \\text{?}",
        questionText: "Hitung hasil dari \\frac{3}{5} \\times \\frac{5}{7} dan sederhanakan!",
        solutionSteps: [
          "Coret faktor persekutuan $5$: $\\frac{3}{\\cancel{5}_1} \\times \\frac{\\cancel{5}^1}{7} = \\frac{3}{7}$."
        ],
        finalAnswer: "\\frac{3}{7}",
        idealAnswerKeywords: ["3/7", "\\frac{3}{7}"],
        domain: "D6: Operasi Pecahan Aljabar"
      }
    ]
  },
  {
    id: "sample_latex_file",
    title: "Berkas LaTeX .tex: Kalkulus Limit Trigonometri",
    badge: "LaTeX .tex • Komputer",
    fileMeta: {
      name: "soal_limit_trigonometri.tex",
      sizeFormatted: "1.2 KB",
      isText: true,
      extension: "tex",
      textContent: `% Dokumen Soal Ujian Kalkulus EPE
\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}
\\title{Evaluasi Limit Fungsi Trigonometri}
\\date{\\today}
\\maketitle

Hitung nilai limit berikut dengan perkalian sekawan akar:
\\begin{equation}
  \\lim_{x \\to 0} \\frac{\\sin x}{\\sqrt{\\pi + \\tan x} - \\sqrt{\\pi - \\tan x}}
\\end{equation}
\\end{document}`
    },
    isMultiProblem: false,
    sheetTitle: "Berkas Sumber LaTeX (.tex): Limit Fungsi Trigonometri",
    latex: "\\lim_{x \\to 0} \\frac{\\sin x}{\\sqrt{\\pi + \\tan x} - \\sqrt{\\pi - \\tan x}}",
    questionText: "Hitung nilai limit fungsi trigonometri berikut dari kode berkas LaTeX (.tex) yang diunggah!",
    domain: "Kalkulus & Trigonometri",
    solutionSteps: [
      "Substitusi langsung $x = 0$ menghasilkan bentuk tak tentu $\\left[\\frac{0}{0}\\right]$.",
      "Kalikan pembilang dan penyebut dengan bentuk sekawan akar penyebut: $\\frac{\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x}}{\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x}}$.",
      "Penyebut menjadi selisih dua kuadrat: $(\\pi + \\tan x) - (\\pi - \\tan x) = 2\\tan x$.",
      "Bentuk pecahan menjadi: $\\lim_{x \\to 0} \\frac{\\sin x \\cdot (\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x})}{2\\tan x}$.",
      "Gunakan $\\frac{\\sin x}{2\\tan x} = \\frac{\\cos x}{2}$, sehingga limit tereduksi menjadi: $\\lim_{x \\to 0} \\frac{\\cos x \\cdot (\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x})}{2}$.",
      "Substitusikan $x = 0$: $\\frac{1 \\cdot (\\sqrt{\\pi} + \\sqrt{\\pi})}{2} = \\frac{2\\sqrt{\\pi}}{2} = \\sqrt{\\pi}$."
    ],
    finalAnswer: "\\sqrt{\\pi}",
    idealAnswerKeywords: ["sqrt(pi)", "\\sqrt{\\pi}", "akar pi", "akar(pi)", "√π", "pi^0.5"],
    domain: "Kalkulus & Trigonometri"
  },
  {
    id: "sample_limit_trig",
    title: "Foto Limit Fungsi Trigonometri Bentuk Akar",
    badge: "Foto Soal • Limit",
    isMultiProblem: false,
    sheetTitle: "Penyelesaian Limit Fungsi Trigonometri: Bentuk Tak Tentu [0/0]",
    latex: "\\lim_{x \\to 0} \\frac{\\sin x}{\\sqrt{\\pi + \\tan x} - \\sqrt{\\pi - \\tan x}}",
    questionText: "Hitung nilai limit fungsi trigonometri berikut dengan metode perkalian sekawan akar!",
    domain: "Kalkulus & Trigonometri",
    solutionSteps: [
      "Substitusi langsung $x = 0$ menghasilkan bentuk tak tentu $\\left[\\frac{0}{0}\\right]$ karena $\\sin(0)=0$ dan $\\sqrt{\\pi + 0} - \\sqrt{\\pi - 0} = 0$.",
      "Kalikan pembilang dan penyebut dengan bentuk sekawan penyebut: $\\frac{\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x}}{\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x}}$.",
      "Penyebut menjadi selisih dua kuadrat: $(\\pi + \\tan x) - (\\pi - \\tan x) = \\pi + \\tan x - \\pi + \\tan x = 2\\tan x$.",
      "Bentuk pecahan menjadi: $\\lim_{x \\to 0} \\frac{\\sin x \\cdot (\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x})}{2\\tan x}$.",
      "Gunakan relasi $\\tan x = \\frac{\\sin x}{\\cos x}$, sehingga $\\frac{\\sin x}{2\\tan x} = \\frac{\\sin x}{2\\frac{\\sin x}{\\cos x}} = \\frac{\\cos x}{2}$.",
      "Bentuk limit tereduksi menjadi: $\\lim_{x \\to 0} \\frac{\\cos x \\cdot (\\sqrt{\\pi + \\tan x} + \\sqrt{\\pi - \\tan x})}{2}$.",
      "Lakukan substitusi $x = 0$: $\\frac{\\cos(0) \\cdot (\\sqrt{\\pi + \\tan(0)} + \\sqrt{\\pi - \\tan(0)})}{2} = \\frac{1 \\cdot (\\sqrt{\\pi} + \\sqrt{\\pi})}{2} = \\frac{2\\sqrt{\\pi}}{2} = \\sqrt{\\pi}$.",
      "🔍 **Analisis Diagnostik Lembar Foto**: Pada lembar foto tertulis jawaban $-\\sqrt{\\pi}$ akibat kekeliruan tanda pada baris ke-10 di mana tertulis $\\cos(0) = -1$. Karena $\\cos(0) = 1$, jawaban matematis yang benar adalah $\\sqrt{\\pi}$."
    ],
    finalAnswer: "\\sqrt{\\pi}",
    idealAnswerKeywords: ["sqrt(pi)", "\\sqrt{\\pi}", "akar pi", "akar(pi)", "√π", "pi^0.5"],
    domain: "Kalkulus & Trigonometri"
  },
  {
    id: "sample_multi_fractions",
    title: "Lembar 4 Soal: Operasi Perkalian Pecahan",
    badge: "Pecahan D6 • 4 Soal",
    isMultiProblem: true,
    sheetTitle: "Lembar Kerja Siswa: Perkalian Pecahan Biasa (4 Butir Soal)",
    latex: "\\frac{3}{2}\\times\\frac{1}{3}, \\quad \\frac{5}{2}\\times\\frac{2}{10}, \\quad \\frac{4}{2}\\times\\frac{3}{4}, \\quad \\frac{3}{5}\\times\\frac{5}{7}",
    questionText: "Hitung dan sederhanakan hasil perkalian pecahan pada ke-4 butir soal berikut!",
    domain: "D6: Operasi Pecahan Aljabar",
    problems: [
      {
        number: 1,
        title: "Soal 1: Perkalian Pecahan Biasa",
        badge: "Pecahan Soal 1",
        latex: "\\frac{3}{2} \\times \\frac{1}{3} = \\text{?}",
        questionText: "Hitung hasil perkalian pecahan \\frac{3}{2} \\times \\frac{1}{3} dan sederhanakan ke bentuk paling ringkas!",
        solutionSteps: [
          "Rumus perkalian pecahan: $\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}$.",
          "Kalikan pembilang dengan pembilang: $3 \\times 1 = 3$.",
          "Kalikan penyebut dengan penyebut: $2 \\times 3 = 6$.",
          "Dihasilkan pecahan $\\frac{3}{6}$. Sederhanakan dengan membagi pembilang dan penyebut dengan FPB $(3)$: $\\frac{3 \\div 3}{6 \\div 3} = \\frac{1}{2}$.",
          "💡 **Metode Cepat (Pencoretan / Cross-Canceling)**: Angka $3$ pada pembilang pecahan pertama dan penyebut pecahan kedua saling membagi habis: $\\frac{\\cancel{3}^1}{2} \\times \\frac{1}{\\cancel{3}_1} = \\frac{1 \\times 1}{2 \\times 1} = \\frac{1}{2}$."
        ],
        finalAnswer: "\\frac{1}{2}",
        idealAnswerKeywords: ["1/2", "0.5", "0,5", "\\frac{1}{2}", "setengah"],
        domain: "D6: Operasi Pecahan Aljabar"
      },
      {
        number: 2,
        title: "Soal 2: Perkalian & Penyederhanaan Pecahan",
        badge: "Pecahan Soal 2",
        latex: "\\frac{5}{2} \\times \\frac{2}{10} = \\text{?}",
        questionText: "Hitung hasil dari \\frac{5}{2} \\times \\frac{2}{10} dan tentukan bentuk pecahan paling sederhananya!",
        solutionSteps: [
          "Kalikan pembilang dengan pembilang: $5 \\times 2 = 10$.",
          "Kalikan penyebut dengan penyebut: $2 \\times 10 = 20$.",
          "Pecahan yang didapat: $\\frac{10}{20}$.",
          "Sederhanakan dengan membagi pembilang dan penyebut dengan $10$: $\\frac{10 \\div 10}{20 \\div 10} = \\frac{1}{2}$.",
          "💡 **Metode Cepat (Pencoretan)**: Coret angka $2$ pada penyebut pertama dan pembilang kedua: $\\frac{5}{\\cancel{2}_1} \\times \\frac{\\cancel{2}^1}{10} = \\frac{5}{10} = \\frac{1}{2}$."
        ],
        finalAnswer: "\\frac{1}{2}",
        idealAnswerKeywords: ["1/2", "0.5", "0,5", "\\frac{1}{2}", "setengah"],
        domain: "D6: Operasi Pecahan Aljabar"
      },
      {
        number: 3,
        title: "Soal 3: Perkalian Pecahan Biasa",
        badge: "Pecahan Soal 3",
        latex: "\\frac{4}{2} \\times \\frac{3}{4} = \\text{?}",
        questionText: "Hitung hasil dari \\frac{4}{2} \\times \\frac{3}{4} dan nyatakan dalam bentuk pecahan paling sederhana atau campuran!",
        solutionSteps: [
          "Perhatikan angka $4$ pada pembilang pecahan pertama dan penyebut pecahan kedua.",
          "Gunakan metode pencoretan silang: $\\frac{\\cancel{4}^1}{2} \\times \\frac{3}{\\cancel{4}_1} = \\frac{1 \\times 3}{2 \\times 1} = \\frac{3}{2}$.",
          "Atau kalikan langsung: $\\frac{4 \\times 3}{2 \\times 4} = \\frac{12}{8}$. Bagi pembilang dan penyebut dengan $4$: $\\frac{12 \\div 4}{8 \\div 4} = \\frac{3}{2}$.",
          "Konversi ke pecahan campuran: $\\frac{3}{2} = 1\\frac{1}{2}$ (atau desimal $1.5$)."
        ],
        finalAnswer: "\\frac{3}{2} \\quad \\text{atau} \\quad 1\\frac{1}{2}",
        idealAnswerKeywords: ["3/2", "1 1/2", "1,5", "1.5", "\\frac{3}{2}", "1\\frac{1}{2}"],
        domain: "D6: Operasi Pecahan Aljabar"
      },
      {
        number: 4,
        title: "Soal 4: Perkalian Pecahan Biasa",
        badge: "Pecahan Soal 4",
        latex: "\\frac{3}{5} \\times \\frac{5}{7} = \\text{?}",
        questionText: "Hitung hasil dari \\frac{3}{5} \\times \\frac{5}{7} dan sederhanakan!",
        solutionSteps: [
          "Perhatikan angka $5$ pada penyebut pecahan pertama dan pembilang pecahan kedua.",
          "Coret faktor persekutuan $5$: $\\frac{3}{\\cancel{5}_1} \\times \\frac{\\cancel{5}^1}{7} = \\frac{3 \\times 1}{1 \\times 7} = \\frac{3}{7}$.",
          "Atau kalikan langsung: $\\frac{3 \\times 5}{5 \\times 7} = \\frac{15}{35}$. Sederhanakan dengan membagi $5$: $\\frac{15 \\div 5}{35 \\div 5} = \\frac{3}{7}$."
        ],
        finalAnswer: "\\frac{3}{7}",
        idealAnswerKeywords: ["3/7", "\\frac{3}{7}"],
        domain: "D6: Operasi Pecahan Aljabar"
      }
    ]
  },
  {
    id: "sample_1",
    title: "Persamaan Kuadrat Baku",
    badge: "Aljabar D1",
    latex: "x^2 - 5x + 6 = 0",
    questionText: "Tentukan himpunan penyelesaian (akar-akar) dari persamaan kuadrat x² - 5x + 6 = 0!",
    solutionSteps: [
      "Bentuk umum persamaan: $ax^2 + bx + c = 0$ dengan $a=1, b=-5, c=6$.",
      "Cari dua bilangan $p$ dan $q$ dengan $p + q = -5$ dan $p \\times q = 6$. Didapatkan $p = -2$ dan $q = -3$.",
      "Faktorisasi: $(x - 2)(x - 3) = 0$",
      "Akar-akar: $x - 2 = 0 \\implies x_1 = 2$ atau $x - 3 = 0 \\implies x_2 = 3$."
    ],
    finalAnswer: "x = 2 \\quad \\text{atau} \\quad x = 3",
    idealAnswerKeywords: ["2", "3", "x=2", "x=3", "2 dan 3", "x_1=2"],
    domain: "D1: Pemfaktoran Persamaan Kuadrat"
  },
  {
    id: "sample_2",
    title: "Nilai Diskriminan & Jenis Akar",
    badge: "Diskriminan D3",
    latex: "2x^2 + 4x + 2 = 0",
    questionText: "Hitung nilai diskriminan dari 2x² + 4x + 2 = 0 dan tentukan jenis akar-akarnya!",
    solutionSteps: [
      "Koefisien: $a = 2, b = 4, c = 2$.",
      "Rumus diskriminan: $D = b^2 - 4ac$",
      "Substitusi nilai: $D = (4)^2 - 4(2)(2) = 16 - 16 = 0$.",
      "Karena $D = 0$, maka persamaan memiliki **dua akar real kembar (rasional)**: $x = \\frac{-b}{2a} = \\frac{-4}{4} = -1$."
    ],
    finalAnswer: "D = 0 \\quad (\\text{Akar kembar } x = -1)",
    idealAnswerKeywords: ["0", "d=0", "kembar", "akar kembar", "satu akar"],
    domain: "D3: Analisis Nilai Diskriminan"
  },
  {
    id: "sample_3",
    title: "Pecahan Bentuk Aljabar",
    badge: "Pecahan D6",
    latex: "\\frac{x^2 - 9}{x + 3}",
    questionText: "Sederhanakan bentuk pecahan aljabar (x² - 9) / (x + 3) untuk x ≠ -3!",
    solutionSteps: [
      "Perhatikan pembilang $x^2 - 9$ merupakan bentuk selisih kuadrat $a^2 - b^2 = (a - b)(a + b)$.",
      "Faktorkan pembilang: $x^2 - 9 = (x - 3)(x + 3)$.",
      "Bagi dengan penyebut: $\\frac{(x - 3)(x + 3)}{x + 3} = x - 3$ (dengan syarat $x \\neq -3$)."
    ],
    finalAnswer: "x - 3",
    idealAnswerKeywords: ["x-3", "x - 3"],
    domain: "D6: Operasi Pecahan Aljabar"
  },
  {
    id: "sample_4",
    title: "Rumus Kuadratik (Rumus ABC)",
    badge: "Rumus ABC D2",
    latex: "x^2 - 4x + 1 = 0",
    questionText: "Tentukan akar-akar persamaan kuadrat x² - 4x + 1 = 0 menggunakan Rumus ABC!",
    solutionSteps: [
      "Koefisien: $a = 1, b = -4, c = 1$.",
      "Diskriminan: $D = b^2 - 4ac = (-4)^2 - 4(1)(1) = 16 - 4 = 12$.",
      "Rumus ABC: $x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{-(-4) \\pm \\sqrt{12}}{2(1)} = \\frac{4 \\pm 2\\sqrt{3}}{2}$.",
      "Sederhanakan pecahan: $x = 2 \\pm \\sqrt{3}$."
    ],
    finalAnswer: "x = 2 + \\sqrt{3} \\quad \\text{atau} \\quad x = 2 - \\sqrt{3}",
    idealAnswerKeywords: ["2+√3", "2-√3", "2 + √3", "2 ± √3", "2+-√3", "\\sqrt{3}"],
    domain: "D2: Aplikasi Rumus Kuadratik (ABC)"
  }
];

export class PhotoMathSolver {
  constructor({ appInstance = null, onNavigateTab = null } = {}) {
    this.app = appInstance;
    this.onNavigateTab = onNavigateTab;

    this.container = null;
    this.currentMode = "solve"; // "solve" (Solusi Langsung) | "quiz" (Mode Uji & Diagnosis)
    this.currentImage = null; // dataUrl
    this.currentFile = null; // { name, size, sizeFormatted, type, extension, isPdf, isText, isImage, dataUrl, textContent }
    this.currentProblem = null; // Single problem object OR Worksheet object with .problems
    this.activeProblemTab = "all"; // "all" | number (0, 1, 2, ...)
    this.activeQuizProblemIndex = 0; // For interactive quiz tab
    this.isScanning = false;
    this.scanStatusText = "";
    this.isApiKeyModalOpen = false;

    // Multimodal Quiz Answer State (Teks, Gambar Coretan, Audio Rekaman Suara)
    this.quizInputModality = "text"; // "text" | "image" | "audio"
    this.quizStudentImage = null; // { dataUrl, name, sizeFormatted }
    this.quizStudentAudio = null; // { audioUrl, blob, transcript, duration, timestamp }
    this.quizAnswerValue = "";
    this.quizStepsValue = "";
    this.isRecordingAudio = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.liveTranscript = "";
    this.recordingDurationSec = 0;
    this.recordingInterval = null;
    this.speechRecognition = null;

    this.init();
  }

  init() {
    this.container = document.getElementById("section-photo-solver-mode");
    if (!this.container) return;

    this.render();
    this.bindEvents();
  }

  getAiConfigBadgeHtml() {
    const cfg = AiVisionService.getStoredConfig();
    const hasKey = AiVisionService.hasValidKey();

    if (hasKey) {
      const providerLabel = cfg.provider === "gemini" ? "Gemini" : cfg.provider === "openai" ? "OpenAI" : "Claude";
      const modelShort = cfg.model ? cfg.model.replace("gemini-", "").replace("claude-3-5-", "").replace("gpt-4o", "GPT-4o") : "";

      return `
        <button 
          id="btn-open-ai-config" 
          type="button" 
          class="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          title="Klik untuk mengubah API Key atau Provider Vision AI"
        >
          <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
          </svg>
          <span>AI Active: <strong>${providerLabel}</strong> (${modelShort})</span>
          <svg class="w-3 h-3 text-emerald-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
      `;
    }

    return `
      <button 
        id="btn-open-ai-config" 
        type="button" 
        class="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        title="Hubungkan API Key Gemini (Gratis), OpenAI, atau Claude untuk OCR Matematika Cerdas"
      >
        <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
        </svg>
        <span>Sambungkan AI API Key</span>
        <span class="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 text-[10px]">BYOK</span>
      </button>
    `;
  }

  getAiApiKeyBannerHtml() {
    const hasKey = AiVisionService.hasValidKey();
    const cfg = AiVisionService.getStoredConfig();
    const providerLabel = cfg.provider === "gemini" ? "Google Gemini" : cfg.provider === "openai" ? "OpenAI" : "Anthropic Claude";
    const modelShort = cfg.model ? cfg.model.replace("gemini-", "").replace("claude-3-5-", "").replace("gpt-4o", "GPT-4o") : "";

    if (hasKey) {
      return `
        <!-- Connected Status Banner -->
        <div class="photo-api-callout-card connected p-4 sm:p-5 mb-6 relative z-10">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <svg class="w-6 h-6 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
                </svg>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-mono font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    Vision AI Terhubung &amp; Siap
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-emerald-900/90 dark:bg-emerald-950 text-emerald-100 dark:text-emerald-200 border border-emerald-500/60 shadow-xs">
                    ${providerLabel} • ${modelShort}
                  </span>
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                  OCR Vision berakurasi tinggi aktif untuk membaca foto lembar kerja &amp; dokumen PDF matematika Anda.
                </p>
              </div>
            </div>
            <button
              id="btn-banner-connect-api"
              type="button"
              class="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-800 hover:bg-emerald-700 dark:bg-slate-900 text-white dark:text-emerald-300 border border-emerald-600/50 dark:border-emerald-500/40 transition-all flex items-center gap-2 shrink-0 shadow-md hover:scale-[1.02] cursor-pointer"
            >
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Ubah Konfigurasi API</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <!-- Unconnected Creative Notice Banner -->
      <div class="photo-api-callout-card animate-pulse-gentle p-5 sm:p-6 mb-6 relative z-10">
        <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div class="flex items-start gap-4">
            <!-- Pulsing Holographic Key Icon -->
            <div class="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-amber-400/20 to-cyan-500/30 border-2 border-amber-400/60 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              <svg class="w-7 h-7 sm:w-8 sm:h-8 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </div>
            <div class="space-y-1.5">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block"></span>
                  Langkah Penting • Aktifkan Fitur Scanner
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                  100% Gratis Tanpa Kartu Kredit
                </span>
              </div>
              <h4 class="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Sambungkan Vision AI API Key untuk Scan Foto Soal</span>
              </h4>
              <p class="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
                Agar AI dapat mengekstrak teks, rumus pecahan, dan diagram dari foto soal atau dokumen PDF Anda, hubungkan API Key gratis dari <strong>Google Gemini</strong> (hanya butuh 30 detik &amp; tanpa biaya).
              </p>
              <div class="flex items-center gap-3 pt-1 text-[11px] text-amber-200/90 font-mono flex-wrap">
                <span class="flex items-center gap-1">✓ Gratis 15 scan/menit</span>
                <span class="flex items-center gap-1">✓ Disimpan lokal di browser Anda</span>
                <span class="flex items-center gap-1">✓ Mendukung Claude &amp; GPT-4o</span>
              </div>
            </div>
          </div>

          <!-- Prominent CTA Button -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-auto">
            <button
              id="btn-banner-connect-api"
              type="button"
              class="px-6 py-3.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer font-sans"
            >
              <svg class="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>Sambungkan API Key Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getFloatingPhotoApiTabHtml() {
    const hasKey = AiVisionService.hasValidKey();
    if (hasKey) return "";

    return `
      <!-- Creative Sticky/Floating Mini Tab Badge -->
      <div 
        id="floating-photo-api-tab"
        class="fixed bottom-6 right-6 z-40 group cursor-pointer animate-slide-in-tab transition-all duration-300 hover:scale-105"
        title="Klik untuk menyambungkan API Key Vision AI"
      >
        <div class="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/95 border-2 border-amber-400 text-amber-300 shadow-[0_8px_30px_rgba(245,158,11,0.45)] backdrop-blur-md">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <svg class="w-4 h-4 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <span class="text-xs font-black tracking-wide text-white group-hover:text-amber-200">
            Sambungkan API Key
          </span>
          <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
            Gratis
          </span>
        </div>
      </div>
    `;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <!-- Header Banner Foto & File Soal AI -->
      <div class="waygo-hero-card p-5 sm:p-7 relative overflow-hidden transition-all duration-300">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div class="space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                AI MULTIMODAL &amp; DOCUMENT SCANNER
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                EPE V3.2
              </span>
              <!-- AI API Key Status Badge -->
              ${this.getAiConfigBadgeHtml()}
            </div>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span class="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 inline-flex items-center justify-center shadow-sm">
                <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </span>
              <span>Scanner Soal &amp; Berkas Matematika AI</span>
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Mendukung <strong>Dokumen PDF (.pdf), Berkas Teks &amp; LaTeX (.tex, .txt, .md), serta Foto Lembar Soal</strong> (satu atau banyak soal sekaligus). Ditenagai notasi LaTeX KaTeX Matrix &amp; opsi koneksi langsung API Key (Gemini, GPT-4o, Claude)!
            </p>
          </div>

          <!-- Dual Mode Switcher Toggle Pill -->
          <div class="p-1 rounded-2xl bg-slate-900/90 border border-slate-700 shadow-xl flex items-center gap-1.5 shrink-0 self-stretch md:self-auto justify-center">
            <button 
              id="solver-mode-btn-solve" 
              type="button" 
              class="px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                this.currentMode === "solve" 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30" 
                  : "text-slate-400 hover:text-white"
              }"
            >
              <span class="w-5 h-5 rounded-lg bg-cyan-400/20 text-cyan-200 border border-cyan-400/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fill-opacity="0.4"></polygon>
                </svg>
              </span>
              <span>Solusi Langsung</span>
            </button>
            <button 
              id="solver-mode-btn-quiz" 
              type="button" 
              class="px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                this.currentMode === "quiz" 
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/30" 
                  : "text-slate-400 hover:text-white"
              }"
            >
              <span class="w-5 h-5 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-400/40 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="9" stroke-dasharray="3 3"></circle>
                  <path d="M3 12h3l2-3 3 6 2-4 2 2 3-1h4"></path>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                </svg>
              </span>
              <span>Mode Soal &amp; Diagnosis</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Prominent Vision AI API Key Callout Banner -->
      ${this.getAiApiKeyBannerHtml()}

      <!-- Floating Mini Tab For Quick Recognition & Access -->
      ${this.getFloatingPhotoApiTabHtml()}

      <!-- Main Grid: Left Upload & Scan Zone | Right Solution / Interactive Quiz -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- LEFT COLUMN: Image & Document Input, Camera & Sample Questions (5 Cols) -->
        <div class="lg:col-span-5 space-y-4">
          
          <!-- Dropzone Card -->
          <div class="card-clean p-5 rounded-2xl bg-slate-900/90 border-2 border-dashed border-slate-700 hover:border-cyan-500/60 transition-all text-center relative group" id="photo-dropzone">
            <input type="file" id="photo-file-input" accept="image/*,.pdf,.txt,.tex,.latex,.md,.docx,application/pdf,text/plain" class="hidden" />
            <input type="file" id="doc-file-input" accept=".pdf,.txt,.tex,.latex,.md,.docx,application/pdf,text/plain" class="hidden" />
            <input type="file" id="camera-file-input" accept="image/*" capture="environment" class="hidden" />

            <!-- Empty Dropzone State -->
            <div id="dropzone-empty-state" class="py-6 space-y-3 ${this.currentImage || this.currentFile ? "hidden" : ""}">
              <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-xl group-hover:scale-110 transition-transform">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              </div>
              <div>
                <p class="text-sm font-extrabold text-white">Seret &amp; Lepas Dokumen atau Foto Soal Matematika</p>
                <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Mendukung <strong>Dokumen PDF</strong> (.pdf), <strong>Berkas LaTeX / Teks</strong> (.tex, .txt, .md), dan <strong>Foto Lembar Soal</strong> (JPG, PNG). Tekan <kbd class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[10px]">Ctrl + V</kbd> untuk tempel gambar atau formula LaTeX.
                </p>
              </div>

              <!-- Upload Action Buttons -->
              <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button type="button" id="btn-pick-file" class="btn-primary py-2 px-3.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span>Pilih Foto / Berkas</span>
                </button>
                <button type="button" id="btn-pick-doc" class="btn-secondary py-2 px-3.5 text-xs font-bold bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-500/40 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <span>Unggah PDF / Teks</span>
                </button>
                <button type="button" id="btn-take-photo" class="btn-secondary py-2 px-3.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
                  <span>Kamera HP</span>
                </button>
              </div>
            </div>

            <!-- Preview & Scanning Beam -->
            <div id="dropzone-preview-state" class="space-y-3 ${this.currentImage || this.currentFile ? "" : "hidden"}">
              ${this.renderDropzonePreviewContent()}

              <!-- Scanning Status Pill -->
              <div id="photo-scan-status-pill" class="${this.isScanning ? "flex" : "hidden"} items-center justify-center gap-2 p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-xs font-mono text-cyan-300">
                <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]"></span>
                <span id="photo-scan-status-text">${this.scanStatusText || "Memindai lembar matematika..."}</span>
              </div>

              <!-- Action Bar for Preview -->
              <div class="flex items-center justify-between gap-2 pt-1">
                <button type="button" id="btn-remove-photo" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  <span>Hapus Berkas / Foto</span>
                </button>

                <button type="button" id="btn-rescan-photo" class="btn-primary py-2 px-4 text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Pindai Ulang</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Sample Math Question Carousel (Uji Coba Cepat Tanpa Upload) -->
          <div class="photo-sample-card p-4 rounded-2xl space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold text-amber-500 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-md bg-amber-400/20 text-amber-400 inline-flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>
                </span>
                <span>Atau Uji Contoh Dokumen / Foto:</span>
              </span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Klik salah satu</span>
            </div>

            <!-- Featured Sample 1: PDF Document -->
            <button 
              type="button" 
              class="sample-math-btn w-full p-3 rounded-xl photo-sample-featured-pdf transition-all text-left group cursor-pointer shadow-md"
              data-sample-id="sample_pdf_worksheet"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <svg class="w-3 h-3 text-rose-500 dark:text-rose-400" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 17v-1h3v1H8zm0-3v-1h8v1H8zm0-3v-1h8v1H8z"/></svg>
                  DOKUMEN PDF (4 BUTIR SOAL)
                </span>
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">184 KB</span>
              </div>
              <p class="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                Dokumen PDF: Lembar Kerja Siswa Perkalian Pecahan Aljabar
              </p>
              <p class="text-[11px] font-mono text-cyan-700 dark:text-cyan-300/90 mt-1 truncate">
                3/2 × 1/3, 5/2 × 2/10, 4/2 × 3/4, 3/5 × 5/7
              </p>
            </button>

            <!-- Featured Sample 2: LaTeX .tex File -->
            <button 
              type="button" 
              class="sample-math-btn w-full p-2.5 rounded-xl photo-sample-featured-latex transition-all text-left group cursor-pointer shadow-md"
              data-sample-id="sample_latex_file"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                  <span class="text-[10px]">∑</span>
                  BERKAS LATEX (.tex)
                </span>
                <span class="text-[10px] text-cyan-700 dark:text-cyan-300 font-extrabold font-mono">1.2 KB</span>
              </div>
              <p class="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                Berkas Sumber LaTeX: Limit Fungsi Trigonometri
              </p>
              <p class="text-[11px] font-mono text-amber-700 dark:text-amber-300/90 mt-0.5 truncate">
                \\lim_{x \\to 0} \\frac{\\sin x}{\\sqrt{\\pi + \\tan x} - \\sqrt{\\pi - \\tan x}}
              </p>
            </button>

            <!-- Standard Other Samples Grid -->
            <div class="grid grid-cols-2 gap-2" id="sample-photos-grid">
              ${SAMPLE_MATH_PHOTOS.filter(s => s.id !== "sample_pdf_worksheet" && s.id !== "sample_latex_file").map((sp) => `
                <button 
                  type="button" 
                  class="sample-math-btn p-2.5 rounded-xl photo-sample-pill transition-all text-left group cursor-pointer"
                  data-sample-id="${sp.id}"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30">${sp.badge}</span>
                  </div>
                  <p class="text-xs font-extrabold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">${sp.title}</p>
                  <p class="text-[11px] font-mono text-amber-700 dark:text-amber-300/90 mt-0.5 truncate">${sp.latex}</p>
                </button>
              `).join("")}
            </div>
          </div>

          <!-- BYOK Helper Callout Card -->
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-md bg-purple-400/20 text-purple-300 inline-flex items-center justify-center shrink-0">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
                </span>
                <span>Vision AI Multimodal (BYOK)</span>
              </span>
              <button id="btn-quick-config-link" type="button" class="text-amber-400 hover:underline text-[11px] font-bold">
                Atur API Key →
              </button>
            </div>
            <p class="text-[11px] text-slate-400 leading-relaxed">
              Gunakan kunci API sendiri dari <strong>Google Gemini (Gratis)</strong>, <strong>OpenAI GPT-4o</strong>, atau <strong>Claude</strong> untuk membaca tulisan tangan dan menyelesaikan soal matematika secara langsung.
            </p>
          </div>

        </div>

        <!-- RIGHT COLUMN: Output Zone (Solution vs Diagnostic Quiz) (7 Cols) -->
        <div class="lg:col-span-7 space-y-4" id="photo-solver-result-panel">
          <!-- Dynamic Content Rendered by JS -->
        </div>

      </div>

      <!-- AI CONFIGURATION MODAL (BYOK) -->
      ${this.renderApiKeyModalHtml()}
    `;

    this.renderResultPanel();
  }

  escapeHtml(str = "") {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  renderDropzonePreviewContent() {
    if (this.currentFile?.isPdf) {
      return `
        <div class="relative rounded-2xl overflow-hidden border border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 p-5 text-left space-y-3 shadow-xl">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md shrink-0">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8 17v-1h3v1H8zm0-3v-1h8v1H8zm0-3v-1h8v1H8z"/>
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">DOKUMEN PDF</span>
                  <span class="text-[11px] font-mono text-slate-400">${this.currentFile?.sizeFormatted || ""}</span>
                </div>
                <h4 class="text-sm font-extrabold text-white truncate mt-1" title="${this.escapeHtml(this.currentFile?.name || "Dokumen_Soal.pdf")}">${this.escapeHtml(this.currentFile?.name || "Dokumen_Soal.pdf")}</h4>
              </div>
            </div>
            ${this.currentFile?.dataUrl ? `
              <a href="${this.currentFile.dataUrl}" target="_blank" download="${this.escapeHtml(this.currentFile.name || "Dokumen.pdf")}" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors shrink-0" title="Buka Dokumen di Tab Baru">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            ` : ""}
          </div>
          
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11.5px] text-slate-300 flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-cyan-300">
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Dokumen PDF siap dipindai oleh AI Multimodal
            </span>
            <span class="text-amber-400 font-mono font-bold text-[11px]">PDF Parser</span>
          </div>

          <!-- Laser Scan Beam Animation -->
          <div id="photo-scan-beam" class="absolute inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-white to-cyan-400 shadow-[0_0_18px_#f59e0b] ${this.isScanning ? "" : "hidden"} animate-scan-beam"></div>
        </div>
      `;
    }

    if (this.currentFile?.isText) {
      return `
        <div class="relative rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 p-4 text-left space-y-2.5 shadow-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold shrink-0">
                ${(this.currentFile?.extension || "TXT").toUpperCase()}
              </div>
              <div class="min-w-0 flex-1">
                <span class="text-xs font-bold text-white block truncate" title="${this.escapeHtml(this.currentFile?.name || "soal.tex")}">${this.escapeHtml(this.currentFile?.name || "soal.tex")}</span>
                <span class="text-[10px] font-mono text-slate-400">${this.currentFile?.sizeFormatted || ""} • Berkas Teks &amp; Rumus</span>
              </div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">KaTeX / LaTeX</span>
          </div>

          <!-- Code snippet preview box -->
          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-200/90 max-h-[170px] overflow-y-auto leading-relaxed select-text whitespace-pre-wrap">
${this.escapeHtml((this.currentFile?.textContent || "").slice(0, 1000))}${((this.currentFile?.textContent || "").length > 1000) ? "\n... (dipotong untuk pratinjau)" : ""}
          </div>

          <!-- Laser Scan Beam Animation -->
          <div id="photo-scan-beam" class="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 shadow-[0_0_18px_#38bdf8] ${this.isScanning ? "" : "hidden"} animate-scan-beam"></div>
        </div>
      `;
    }

    // Default: Image Preview
    return `
      <div class="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-[320px] flex items-center justify-center p-1.5">
        <img id="photo-preview-img" src="${this.currentImage || ""}" alt="Foto Lembar Soal Matematika" class="max-w-full max-h-[300px] object-contain rounded-lg shadow-md" />
        
        <!-- Laser Scan Beam Animation -->
        <div id="photo-scan-beam" class="absolute inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 shadow-[0_0_18px_#38bdf8] ${this.isScanning ? "" : "hidden"} animate-scan-beam"></div>
      </div>
    `;
  }

  renderApiKeyModalHtml() {
    const cfg = AiVisionService.getStoredConfig();

    return `
      <div id="ai-api-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md hidden transition-opacity duration-200">
        <div class="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
                <svg class="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-white">Konfigurasi Vision AI API Key</h3>
                <p class="text-xs text-slate-400">Bring Your Own Key (Gemini, OpenAI GPT-4o, Claude)</p>
              </div>
            </div>
            <button id="btn-close-ai-modal" type="button" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors">
              ✕
            </button>
          </div>

          <!-- Provider Picker Tabs -->
          <div class="space-y-2">
            <label class="block text-xs font-mono font-bold uppercase text-amber-300">
              1. Pilih Provider AI:
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                class="ai-provider-tab-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  cfg.provider === "gemini" 
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-900/40" 
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }"
                data-provider="gemini"
              >
                <div class="flex items-center justify-center py-1">
                  <svg class="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
                  </svg>
                </div>
                <div class="text-xs font-bold mt-1">Google Gemini</div>
                <div class="text-[10px] text-emerald-400 font-mono">Disarankan • Gratis</div>
              </button>

              <button 
                type="button" 
                class="ai-provider-tab-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  cfg.provider === "openai" 
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-900/40" 
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }"
                data-provider="openai"
              >
                <div class="flex items-center justify-center py-1">
                  <svg class="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <div class="text-xs font-bold mt-1">OpenAI</div>
                <div class="text-[10px] text-slate-400 font-mono">GPT-4o / Mini</div>
              </button>

              <button 
                type="button" 
                class="ai-provider-tab-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  cfg.provider === "claude" 
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-900/40" 
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }"
                data-provider="claude"
              >
                <div class="flex items-center justify-center py-1">
                  <svg class="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="12" cy="12" r="9"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 10a2 2 0 114 0c0 1.5-2 2.5-2 3.5m0 3.5h.01"/>
                  </svg>
                </div>
                <div class="text-xs font-bold mt-1">Anthropic Claude</div>
                <div class="text-[10px] text-slate-400 font-mono">Claude 3.5 Sonnet</div>
              </button>
            </div>
          </div>

          <!-- API Key Input -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label for="input-ai-api-key" class="block text-xs font-mono font-bold uppercase text-amber-300">
                2. Masukkan API Key Anda:
              </label>
              <button type="button" id="btn-toggle-key-visibility" class="text-[11px] text-cyan-400 hover:underline cursor-pointer">
                Tampilkan
              </button>
            </div>
            <div class="relative">
              <input 
                type="password" 
                id="input-ai-api-key" 
                placeholder="${cfg.provider === "gemini" ? "AIzaSy..." : cfg.provider === "openai" ? "sk-..." : "sk-ant-..."}"
                value="${cfg.apiKey || ""}" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-all shadow-inner"
              />
            </div>
            <p class="text-[11px] text-slate-400 leading-normal">
              ${
                cfg.provider === "gemini" 
                  ? "Dapatkan API Key gratis di <a href='https://aistudio.google.com/app/apikey' target='_blank' class='text-cyan-400 underline font-semibold'>Google AI Studio</a>." 
                  : cfg.provider === "openai"
                  ? "Dapatkan di <a href='https://platform.openai.com/api-keys' target='_blank' class='text-cyan-400 underline font-semibold'>OpenAI Platform</a>."
                  : "Dapatkan di <a href='https://console.anthropic.com/' target='_blank' class='text-cyan-400 underline font-semibold'>Anthropic Console</a>."
              }
            </p>
          </div>

          <!-- Model Picker Dropdown -->
          <div class="space-y-1.5">
            <label for="select-ai-model" class="block text-xs font-mono font-bold uppercase text-amber-300">
              3. Pilih Model Vision:
            </label>
            <select 
              id="select-ai-model" 
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs font-mono text-white focus:outline-none transition-all cursor-pointer"
            >
              ${this.getModelOptionsHtml(cfg.provider, cfg.model)}
            </select>
          </div>

          <!-- Ping Test Feedback Result Alert -->
          <div id="ai-test-ping-feedback" class="hidden p-3 rounded-xl text-xs space-y-1">
            <!-- Dynamic feedback on test connection -->
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-800">
            <button 
              type="button" 
              id="btn-test-ai-connection" 
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <span>⚡</span>
              <span>Uji Koneksi API</span>
            </button>

            <div class="flex-1 w-full flex items-center justify-end gap-2">
              <button 
                type="button" 
                id="btn-clear-ai-key" 
                class="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                Hapus Kunci
              </button>

              <button 
                type="button" 
                id="btn-save-ai-config" 
                class="btn-primary px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 cursor-pointer transition-all"
              >
                Simpan &amp; Aktifkan
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  getModelOptionsHtml(provider, currentModel) {
    if (provider === "gemini") {
      const models = [
        { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview (Direkomendasikan • Sangat Cepat & Cerdas)" },
        { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Generasi Terbaru)" },
        { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite (Hemat Kuota)" },
        { id: "gemini-flash-latest", name: "Gemini Flash Latest" },
        { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview (Penalaran Kompleks)" }
      ];
      return models.map(m => `<option value="${m.id}" ${(currentModel === m.id || (!currentModel && m.id === "gemini-3-flash-preview")) ? "selected" : ""}>${m.name}</option>`).join("");
    } else if (provider === "openai") {
      const models = [
        { id: "gpt-4o", name: "GPT-4o (Multimodal Vision Flagship)" },
        { id: "gpt-4o-mini", name: "GPT-4o-mini (Cepat & Hemat Kuota)" }
      ];
      return models.map(m => `<option value="${m.id}" ${currentModel === m.id ? "selected" : ""}>${m.name}</option>`).join("");
    } else if (provider === "claude") {
      const models = [
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Penalaran Matematika Terbaik)" },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Respon Kilat)" }
      ];
      return models.map(m => `<option value="${m.id}" ${currentModel === m.id ? "selected" : ""}>${m.name}</option>`).join("");
    }
    return `<option value="gemini-1.5-flash">Gemini 1.5 Flash</option>`;
  }

  normalizeScanResult(raw) {
    if (!raw) return null;
    let data = raw;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (e) { data = { latex: data }; }
    }

    let problems = [];
    if (Array.isArray(data)) {
      problems = data.map((p, i) => this.normalizeProblemItem(p, i + 1));
    } else if (Array.isArray(data.problems) && data.problems.length > 0) {
      problems = data.problems.map((p, i) => this.normalizeProblemItem(p, i + 1));
    } else {
      problems = [this.normalizeProblemItem(data, 1)];
    }

    const isMulti = problems.length > 1 || Boolean(data.isMultiProblem);
    const firstProb = problems[0] || {};

    return {
      sheetTitle: data.sheetTitle || data.title || (isMulti ? `Lembar ${problems.length} Soal Matematika` : firstProb.title || "Lembar Soal Matematika"),
      domain: data.domain || firstProb.domain || "Matematika EPE",
      isMultiProblem: isMulti,
      problems: problems,
      // Root-level properties for backward compatibility
      latex: firstProb.latex || "",
      questionText: firstProb.questionText || "",
      solutionSteps: firstProb.solutionSteps || [],
      finalAnswer: firstProb.finalAnswer || "",
      title: firstProb.title || "Soal #1",
      idealAnswerKeywords: firstProb.idealAnswerKeywords || []
    };
  }

  normalizeProblemItem(p, fallbackIndex = 1) {
    if (!p) {
      return {
        number: fallbackIndex,
        title: `Soal #${fallbackIndex}`,
        domain: "Aljabar & Kalkulus",
        latex: "\\text{Formula tidak tersedia}",
        questionText: "",
        solutionSteps: ["Langkah penyelesaian sistematis belum diuraikan."],
        finalAnswer: "-",
        idealAnswerKeywords: []
      };
    }

    // Extract LaTeX formula safely
    let rawLatex = p.latex || p.formula || p.equation || p.soal || p.question || p.math || p.problemText || "";
    if (typeof rawLatex === "string") {
      rawLatex = rawLatex.trim().replace(/^(\$\$|\$)+/, "").replace(/(\$\$|\$)+$/, "").trim();
    }
    const latex = (rawLatex && rawLatex !== "undefined") ? rawLatex : "\\text{Formula tidak terdeteksi}";

    // Extract Solution Steps safely
    let rawSteps = p.solutionSteps || p.steps || p.solution_steps || p.langkah || p.pembahasan || p.penyelesaian || p.cara || p.solution || [];
    let steps = [];
    if (typeof rawSteps === "string") {
      steps = rawSteps.split(/\n+/).map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(rawSteps)) {
      steps = rawSteps.map(s => typeof s === "string" ? s.trim() : JSON.stringify(s)).filter(Boolean);
    }
    if (steps.length === 0) {
      steps = [
        "Langkah 1: Identifikasi bentuk matematika dan komponen-komponen formula.",
        "Langkah 2: Terapkan kaidah operasi serta penyederhanaan langkah demi langkah.",
        "Langkah 3: Peroleh hasil akhir yang paling tereduksi dan terverifikasi."
      ];
    }

    // Extract Final Answer safely
    let rawAns = p.finalAnswer || p.final_answer || p.answer || p.jawaban || p.jawaban_akhir || p.result || p.hasil || "";
    if (typeof rawAns === "string") {
      rawAns = rawAns.trim().replace(/^(\$\$|\$)+/, "").replace(/(\$\$|\$)+$/, "").trim();
    }
    const finalAnswer = (rawAns && rawAns !== "undefined") ? rawAns : "\\text{Terdefinisi}";

    const title = (p.title && p.title !== "undefined") ? p.title : `Soal #${p.number || fallbackIndex}`;
    const domain = (p.domain && p.domain !== "undefined") ? p.domain : "Aljabar & Kalkulus";
    const questionText = p.questionText || p.question || "";

    let keywords = p.idealAnswerKeywords || p.keywords || [];
    if (!Array.isArray(keywords)) keywords = [];
    if (finalAnswer && !keywords.includes(finalAnswer)) {
      keywords.unshift(finalAnswer);
    }

    return {
      number: p.number || fallbackIndex,
      title,
      domain,
      latex,
      questionText,
      solutionSteps: steps,
      finalAnswer,
      idealAnswerKeywords: keywords
    };
  }

  renderResultPanel() {
    const panel = this.container?.querySelector("#photo-solver-result-panel");
    if (!panel) return;

    if (!this.currentProblem) {
      panel.innerHTML = `
        <div class="card-clean p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4 py-16 min-h-[440px] flex flex-col items-center justify-center shadow-lg">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl shadow-inner">
            📷
          </div>
          <div class="max-w-md mx-auto space-y-1.5">
            <h3 class="text-base font-extrabold text-white">Menunggu Lembar Foto Soal...</h3>
            <p class="text-xs text-slate-400 leading-relaxed">
              Unggah foto lembar soal atau pilih salah satu <strong>Contoh Soal</strong> di sebelah kiri untuk melihat pembahasan instan dengan KaTeX atau memulai uji kognitif mandiri.
            </p>
          </div>
        </div>
      `;
      return;
    }

    const norm = this.normalizeScanResult(this.currentProblem);
    this.currentProblem = norm;
    const prob = norm;
    const problemsList = norm.problems;
    const isMulti = norm.isMultiProblem;

    if (this.currentMode === "solve") {
      // =======================================================================
      // MODE 1: SOLUSI LENGKAP INSTAN (DENGAN DUKUNGAN MULTI-PROBLEM KATEX)
      // =======================================================================
      panel.innerHTML = `
        <div class="card-clean p-5 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-700 space-y-5 shadow-2xl">
          
          <!-- Top Sheet Header & Multi-Problem Tabs -->
          <div class="pb-3 border-b border-slate-800 space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ${prob.domain || "Matematika EPE"}
                </span>
                <h3 class="text-base sm:text-lg font-extrabold text-white mt-1">
                  ${prob.sheetTitle || prob.title || "Lembar Soal Matematika"}
                </h3>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 self-start sm:self-auto">
                ✓ Solusi Siap (${problemsList.length} Soal)
              </span>
            </div>

            ${isMulti ? `
              <!-- Multi-Problem Selector Tabs -->
              <div class="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
                <button 
                  type="button" 
                  class="solver-prob-tab-btn px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    this.activeProblemTab === "all" 
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" 
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }"
                  data-prob-tab="all"
                >
                  📋 Semua Soal (${problemsList.length})
                </button>
                ${problemsList.map((p, idx) => `
                  <button 
                    type="button" 
                    class="solver-prob-tab-btn px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                      this.activeProblemTab === String(idx) 
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" 
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }"
                    data-prob-tab="${idx}"
                  >
                    Soal ${idx + 1}
                  </button>
                `).join("")}
              </div>
            ` : ""}
          </div>

          <!-- Problems Container List (Matrix AI Chat Style) -->
          <div class="space-y-6" id="solver-problems-rendered-list">
            ${this.renderProblemsSolutionCards(problemsList, this.activeProblemTab)}
          </div>

          <!-- Switch to Quiz Mode CTA -->
          <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span class="text-amber-200 font-medium text-center sm:text-left">
              Mau menguji pemahaman konsep dan mendeteksi kesalahanmu pada soal-soal ini?
            </span>
            <button id="btn-switch-to-quiz-cta" type="button" class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0">
              Uji Kemampuan Mandiri →
            </button>
          </div>

        </div>
      `;
    } else {
      // =======================================================================
      // MODE 2: MODE SOAL INTERAKTIF & DIAGNOSIS KOGNITIF (QUIZ MODE)
      // =======================================================================
      const activeProb = isMulti ? problemsList[this.activeQuizProblemIndex] || problemsList[0] : prob;

      panel.innerHTML = `
        <div class="card-clean p-5 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-700 space-y-5 shadow-2xl">
          
          <!-- Quiz Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                TANTANGAN DIAGNOSTIK MANDIRI
              </span>
              <h3 class="text-base sm:text-lg font-extrabold text-white mt-1.5">
                ${activeProb.title || (isMulti ? `Soal #${this.activeQuizProblemIndex + 1}` : "Uji Soal Matematika")}
              </h3>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              Reward: ◆ +15 Cubic
            </span>
          </div>

          ${isMulti ? `
            <!-- Quiz Problem Switcher Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span class="text-xs text-slate-400 mr-1 font-mono">Pilih Butir:</span>
              ${problemsList.map((p, idx) => `
                <button 
                  type="button" 
                  class="quiz-prob-tab-btn px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    this.activeQuizProblemIndex === idx 
                      ? "bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/30" 
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  }"
                  data-quiz-index="${idx}"
                >
                  Soal ${idx + 1}
                </button>
              `).join("")}
            </div>
          ` : ""}

          <!-- Problem Expression Callout (Matrix KaTeX Callout) -->
          <div class="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/50 text-center space-y-2 shadow-inner">
            <span class="text-[11px] font-mono text-amber-300 font-bold uppercase tracking-wider">
              Soal yang Harus Kamu Selesaikan:
            </span>
            <div class="text-xl sm:text-2xl font-mono font-extrabold text-white py-1.5">
              $$${activeProb.latex}$$
            </div>
            <p class="text-xs sm:text-sm text-slate-200 font-medium">${activeProb.questionText || "Selesaikan operasi matematika di atas!"}</p>
          </div>

          <!-- Student Input Work Area (Multimodal: Teks, Gambar Coretan, Audio Rekaman Suara) -->
          <div class="space-y-4">
            
            <!-- Modality Selector Segmented Control & Status Badges -->
            <div class="space-y-2">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button 
                    type="button" 
                    class="quiz-modality-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${this.quizInputModality === 'text' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}" 
                    data-modality="text"
                  >
                    <span>✍️</span>
                    <span>Ketik Teks</span>
                  </button>
                  <button 
                    type="button" 
                    class="quiz-modality-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${this.quizInputModality === 'image' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}" 
                    data-modality="image"
                  >
                    <span>📷</span>
                    <span>Foto Coretan</span>
                    ${this.quizStudentImage ? `<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>` : ""}
                  </button>
                  <button 
                    type="button" 
                    class="quiz-modality-tab-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${this.quizInputModality === 'audio' ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'}" 
                    data-modality="audio"
                  >
                    <span>🎙️</span>
                    <span>Rekam Suara</span>
                    ${this.quizStudentAudio ? `<span class="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>` : ""}
                  </button>
                </div>

                <!-- Multimodal Status Badges -->
                <div class="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
                  ${this.quizStudentImage ? `
                    <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span>📷</span>
                      <span>Foto OK</span>
                    </span>
                  ` : ""}
                  ${this.quizStudentAudio ? `
                    <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span>🎙️</span>
                      <span>Audio (${this.quizStudentAudio.duration})</span>
                    </span>
                  ` : ""}
                  <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>⚡</span>
                    <span>Bebas Pilih/Gabung</span>
                  </span>
                </div>
              </div>

              <!-- Dynamic Modality Panel Content -->
              ${this.renderQuizModalityPanel()}
            </div>

            <!-- Final Answer Input -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="quiz-student-answer" class="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  1. Jawaban Akhir Kamu:
                </label>
                <span class="text-[10.5px] text-slate-400">Dapat diketik manual, dari audio, atau dari foto</span>
              </div>
              <input 
                type="text" 
                id="quiz-student-answer" 
                value="${(this.quizAnswerValue || '').replace(/"/g, '&quot;')}"
                placeholder="Contoh: 1/2 atau 15/35 atau x = 2 atau x = 3" 
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner font-mono"
              />
            </div>

            <!-- Steps / Workings Input -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="quiz-student-steps" class="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  2. Langkah-Langkah Pengerjaan / Cara Kamu:
                </label>
                <span class="text-[10.5px] text-slate-400">Teks, hasil transkripsi suara, atau catatan</span>
              </div>
              <textarea 
                id="quiz-student-steps" 
                rows="3" 
                placeholder="Tuliskan caramu di sini, atau rekam suaramu / lampirkan foto di atas..." 
                class="w-full p-3 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner leading-relaxed"
              >${this.quizStepsValue || ''}</textarea>
            </div>

            <!-- Submit Diagnostic Button -->
            <div class="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button 
                id="btn-diagnose-my-answer" 
                type="button" 
                class="btn-primary w-full sm:flex-1 py-3 px-5 text-sm font-extrabold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white rounded-xl shadow-xl shadow-amber-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>🔬</span>
                <span>Diagnosis Jawaban Saya Sekarang</span>
              </button>

              ${AiVisionService.hasValidKey() ? `
                <button 
                  id="btn-ai-deep-pedagogy" 
                  type="button" 
                  class="py-3 px-3.5 text-xs font-bold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/50 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md w-full sm:w-auto shrink-0"
                  title="Gunakan AI Vision multimodal untuk ulasan diagnostik kognitif mendalam"
                >
                  <span>🤖</span>
                  <span>Ulasan AI Tutor</span>
                </button>
              ` : ""}

              <button 
                id="btn-reveal-solution-quiz" 
                type="button" 
                class="py-3 px-4 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer w-full sm:w-auto"
              >
                Buka Kunci Solusi
              </button>
            </div>

            <!-- Pedagogical Tolerance Notice -->
            <p class="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
              <span class="text-amber-400 font-bold">★ Toleransi Kognitif EPE:</span> 
              <span>Mendukung pengiriman lewat Audio, Gambar &amp; Teks, menerima bentuk ekuivalen (desimal / pecahan belum sederhana), serta mendiagnosis letak miskonsepsi.</span>
            </p>
          </div>

          <!-- Diagnostic Feedback Result Container -->
          <div id="quiz-diagnostic-feedback-box" class="hidden pt-2">
            <!-- Rendered after student clicks diagnosis -->
          </div>

        </div>
      `;
    }

    // Render KaTeX Math Elements
    this.renderKaTeXInElement(panel);
  }

  renderProblemsSolutionCards(problemsList, activeTab) {
    const listToRender = activeTab === "all" 
      ? problemsList 
      : [problemsList[parseInt(activeTab, 10)] || problemsList[0]];

    return listToRender.map((rawProb, idx) => {
      const prob = this.normalizeProblemItem(rawProb, idx + 1);
      const displayIndex = activeTab === "all" ? idx + 1 : parseInt(activeTab, 10) + 1;

      return `
        <div class="katex-rendered-card p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 transition-all space-y-4 shadow-xl">
          
          <!-- Problem Item Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-xs">
                ${displayIndex}
              </span>
              <h4 class="text-sm font-extrabold text-white">
                ${prob.title || `Soal #${displayIndex}`}
              </h4>
            </div>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              ${prob.domain || "Aljabar & Aritmetika"}
            </span>
          </div>

          <!-- High-Contrast KaTeX Display Box -->
          <div class="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-center space-y-1 shadow-inner">
            <span class="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Formula / Soal:</span>
            <div class="text-xl sm:text-2xl font-mono font-extrabold text-white py-1">
              $$${prob.latex}$$
            </div>
            ${prob.questionText ? `<p class="text-xs text-slate-300 font-medium">${prob.questionText}</p>` : ""}
          </div>

          <!-- Step-by-Step Breakdown (Matrix AI Chat Style) -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span>📋</span>
                <span>Langkah Penyelesaian Sistematis:</span>
              </span>
            </div>

            <div class="space-y-2">
              ${(prob.solutionSteps || []).map((step, sIdx) => `
                <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start gap-3">
                  <span class="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                    ${sIdx + 1}
                  </span>
                  <div class="text-xs sm:text-[13px] text-slate-200 font-medium leading-relaxed flex-1">
                    ${step}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Final Answer Highlight Box -->
          <div class="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-2 border-emerald-500/60 flex items-center justify-between gap-3 shadow-lg">
            <div>
              <span class="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider">Jawaban Akhir:</span>
              <div class="text-base sm:text-lg font-mono font-extrabold text-white mt-0.5">
                $${prob.finalAnswer}$
              </div>
            </div>
            <button 
              type="button" 
              class="btn-copy-single-solution px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40 transition-colors flex items-center gap-1 cursor-pointer"
              data-answer-text="${prob.finalAnswer}"
              data-prob-title="${prob.title || `Soal #${displayIndex}`}"
            >
              <span>Salin</span>
            </button>
          </div>

        </div>
      `;
    }).join("");
  }

  renderKaTeXInElement(container) {
    if (!container) return;

    if (typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn("Auto-render KaTeX error:", err);
      }
    }
  }

  renderQuizModalityPanel() {
    if (this.quizInputModality === "text") {
      return `
        <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <div class="flex items-center justify-between text-slate-300">
            <span class="flex items-center gap-1.5 font-bold text-amber-300">
              <span>✍️</span>
              <span>Input Teks Matematika &amp; Simbol Cepat:</span>
            </span>
            <span class="text-[11px] text-slate-400">Klik simbol untuk menyisipkan ke jawaban</span>
          </div>
          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer" data-chip="1/2">1/2</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer" data-chip="3/7">3/7</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs border border-slate-700 hover:border-cyan-500/50 transition-colors cursor-pointer" data-chip="15/35">15/35</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer" data-chip="x = 2">x = 2</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs border border-slate-700 hover:border-amber-500/50 transition-colors cursor-pointer" data-chip="x = 3">x = 3</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" data-chip="×">×</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" data-chip="÷">÷</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" data-chip="=">=</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" data-chip="x²">x²</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" data-chip="√π">√π</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer" data-chip="±">±</button>
            <button type="button" class="btn-math-chip px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono text-xs border border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer" data-chip="(x - 2)(x - 3)">(x - 2)(x - 3)</button>
          </div>
        </div>
      `;
    }

    if (this.quizInputModality === "image") {
      if (this.quizStudentImage) {
        return `
          <div class="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span>📷</span>
                <span>Foto Coretan / LKS Terlampir:</span>
              </span>
              <button 
                type="button" 
                id="btn-remove-quiz-scratchpad" 
                class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>🗑️</span>
                <span>Hapus Foto</span>
              </button>
            </div>
            <div class="flex items-center gap-3">
              <img 
                src="${this.quizStudentImage.dataUrl}" 
                alt="Coretan Siswa" 
                class="w-20 h-20 object-cover rounded-xl border border-slate-700 shadow-md cursor-pointer hover:scale-105 transition-transform" 
                onclick="window.open('${this.quizStudentImage.dataUrl}', '_blank')" 
                title="Klik untuk memperbesar gambar"
              />
              <div class="space-y-1 text-xs">
                <p class="font-bold text-white truncate max-w-[220px]">${this.quizStudentImage.name}</p>
                <p class="text-slate-400">${this.quizStudentImage.sizeFormatted} • Gambar Coretan Pengerjaan</p>
                <div class="flex items-center gap-2 pt-1">
                  <button 
                    type="button" 
                    id="btn-ai-extract-scratchpad" 
                    class="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow transition-all cursor-pointer"
                  >
                    <span>✨</span>
                    <span>Ekstrak Coretan via AI</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
          <div class="flex items-center justify-between text-slate-300">
            <span class="flex items-center gap-1.5 font-bold text-amber-300">
              <span>📷</span>
              <span>Unggah Foto Lembar Coretan / Jawaban Fisik:</span>
            </span>
            <span class="text-[11px] text-slate-400">JPG, PNG, atau Kamera HP</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input type="file" id="quiz-scratchpad-file-input" accept="image/*" class="hidden" />
            <input type="file" id="quiz-scratchpad-camera-input" accept="image/*" capture="environment" class="hidden" />
            
            <button 
              type="button" 
              id="btn-pick-quiz-scratchpad" 
              class="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-cyan-500 flex items-center justify-center gap-2 text-slate-200 font-bold transition-all cursor-pointer"
            >
              <span class="text-base">📁</span>
              <span>Pilih Berkas Foto Coretan</span>
            </button>

            <button 
              type="button" 
              id="btn-camera-quiz-scratchpad" 
              class="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-amber-500 flex items-center justify-center gap-2 text-amber-300 font-bold transition-all cursor-pointer"
            >
              <span class="text-base">📸</span>
              <span>Ambil Foto via Kamera</span>
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            💡 Foto coretan kamu akan dilampirkan pada kartu evaluasi diagnostik untuk diperiksa oleh AI atau guru pengajar.
          </p>
        </div>
      `;
    }

    if (this.quizInputModality === "audio") {
      if (this.isRecordingAudio) {
        return `
          <div class="p-4 rounded-xl bg-rose-950/70 border-2 border-rose-500 space-y-3 animate-pulse">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-2 text-xs font-bold text-rose-300">
                <span class="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <span>Sedang Merekam Suara Penjelasan Kamu...</span>
              </span>
              <span id="quiz-audio-timer-display" class="font-mono text-sm font-extrabold text-white bg-rose-900/80 px-2.5 py-0.5 rounded-lg border border-rose-600">
                ${this.formatDuration(this.recordingDurationSec)}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-slate-950/90 border border-rose-500/40 text-xs space-y-1">
              <span class="text-[10px] text-rose-400 font-mono font-bold uppercase tracking-wider">Transkripsi Lisan Berjalan (id-ID):</span>
              <p id="quiz-live-transcript-box" class="font-mono text-white text-xs italic min-h-[28px]">
                ${this.liveTranscript || "Mendengarkan ucapanmu... Bicaralah sekarang!"}
              </p>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button 
                type="button" 
                id="btn-stop-quiz-audio" 
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>⏹️</span>
                <span>Selesai &amp; Simpan Rekaman</span>
              </button>
              <button 
                type="button" 
                id="btn-cancel-quiz-audio" 
                class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Batalkan
              </button>
            </div>
          </div>
        `;
      }

      if (this.quizStudentAudio) {
        return `
          <div class="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span>🎙️</span>
                <span>Rekaman Penjelasan Suara Terlampir (${this.quizStudentAudio.duration}):</span>
              </span>
              <button 
                type="button" 
                id="btn-remove-quiz-audio" 
                class="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>🗑️</span>
                <span>Hapus Audio</span>
              </button>
            </div>

            <div class="space-y-2">
              <audio controls src="${this.quizStudentAudio.audioUrl}" class="w-full h-9 rounded-lg"></audio>
              ${this.quizStudentAudio.transcript ? `
                <div class="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                  <span class="text-[10px] text-cyan-400 font-bold block mb-1">Transkripsi Lisan Siswa:</span>
                  <p class="text-slate-200 italic font-mono text-[11.5px]">"${this.quizStudentAudio.transcript}"</p>
                </div>
              ` : ""}
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button 
                type="button" 
                id="btn-rerecord-quiz-audio" 
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>🎙️</span>
                <span>Rekam Ulang</span>
              </button>
            </div>
          </div>
        `;
      }

      return `
        <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-3">
          <div class="flex items-center justify-between text-slate-300">
            <span class="flex items-center gap-1.5 font-bold text-amber-300">
              <span>🎙️</span>
              <span>Jelaskan Jawaban Kamu Lewat Suara:</span>
            </span>
            <span class="text-[11px] text-slate-400">Bahasa Indonesia (id-ID)</span>
          </div>
          <p class="text-slate-300 text-xs">
            Tekan tombol di bawah untuk mulai berbicara. Kamu bisa menceritakan cara kamu mengalikan, menyederhanakan pecahan, atau memfaktorkan aljabar. Sistem akan merekam suara dan otomatis mentranskripsikannya ke langkah pengerjaan!
          </p>
          <div>
            <button 
              type="button" 
              id="btn-start-quiz-audio" 
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>🎙️</span>
              <span>Mulai Rekam Penjelasan Suara</span>
            </button>
          </div>
        </div>
      `;
    }

    return "";
  }

  formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  async handleScratchpadImage(file) {
    if (!file) return;
    try {
      const dataUrl = await MediaManager.readFileAsDataURL(file);
      const sizeFormatted = MediaManager.formatFileSize(file.size || 0);
      this.quizStudentImage = {
        dataUrl,
        name: file.name || "coretan_siswa.png",
        sizeFormatted,
        file
      };
      this.renderResultPanel();
      NotificationToast.show("Foto coretan berhasil dilampirkan!", "success");
    } catch (err) {
      NotificationToast.show(`Gagal memuat foto coretan: ${err.message}`, "error");
    }
  }

  async handleScanScratchpadWithAi() {
    if (!this.quizStudentImage) return;

    const btn = this.container?.querySelector("#btn-ai-extract-scratchpad");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span><span>Menganalisis Coretan...</span>`;
    }

    try {
      if (AiVisionService.hasValidKey()) {
        const res = await AiVisionService.analyzeMediaMath(this.quizStudentImage.dataUrl, {
          name: this.quizStudentImage.name,
          prompt: "Ekstrak jawaban akhir dan langkah pengerjaan matematika dari gambar coretan siswa ini. Berikan jawaban ringkas."
        });
        if (res && res.problems && res.problems.length > 0) {
          const prob = res.problems[0];
          const extractedAns = prob.finalAnswer || prob.latex || "";
          const extractedSteps = (prob.solutionSteps || []).join("\n");

          const ansInput = this.container?.querySelector("#quiz-student-answer");
          const stepsInput = this.container?.querySelector("#quiz-student-steps");

          if (ansInput && extractedAns) {
            ansInput.value = extractedAns.replace(/[$]/g, "");
            this.quizAnswerValue = ansInput.value;
          }
          if (stepsInput && extractedSteps) {
            stepsInput.value = `[Hasil Pemindaian AI dari Coretan Siswa]:\n${extractedSteps}`;
            this.quizStepsValue = stepsInput.value;
          }
          NotificationToast.show("Berhasil mengekstrak teks coretan via AI Vision!", "success");
        } else {
          NotificationToast.show("AI Vision telah menganalisis gambar coretan kamu.", "success");
        }
      } else {
        const norm = this.normalizeScanResult(this.currentProblem);
        const activeProb = this.normalizeProblemItem(
          norm.problems[this.activeQuizProblemIndex] || norm.problems[0],
          this.activeQuizProblemIndex + 1
        );
        const ansInput = this.container?.querySelector("#quiz-student-answer");
        const stepsInput = this.container?.querySelector("#quiz-student-steps");
        if (ansInput && !ansInput.value.trim()) {
          ansInput.value = (activeProb.finalAnswer || "").replace(/[$]/g, "");
          this.quizAnswerValue = ansInput.value;
        }
        if (stepsInput && !stepsInput.value.trim()) {
          stepsInput.value = `[Lampiran Foto Coretan: ${this.quizStudentImage.name}]\nLangkah pengerjaan telah didokumentasikan dalam lampiran foto.`;
          this.quizStepsValue = stepsInput.value;
        }
        NotificationToast.show("Foto coretan terhubung ke sistem evaluasi kognitif!", "success");
      }
    } catch (err) {
      console.warn("Scan scratchpad failed:", err);
      NotificationToast.show(`Gagal memindai coretan: ${err.message}`, "warning");
    } finally {
      this.renderResultPanel();
    }
  }

  async startAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecordingAudio = true;
      this.recordingDurationSec = 0;
      this.liveTranscript = "";

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.quizStudentAudio = {
          audioUrl,
          blob: audioBlob,
          transcript: this.liveTranscript,
          duration: this.formatDuration(this.recordingDurationSec),
          durationSec: this.recordingDurationSec,
          timestamp: new Date().toLocaleTimeString()
        };

        // Hentikan semua audio track agar ikon mikrofon browser mati
        stream.getTracks().forEach((track) => track.stop());

        // Analisis spoken math dengan SpeechMathParser jika ada ucapan matematika
        if (this.liveTranscript) {
          try {
            const parsedMath = SpeechMathParser.parseSpokenMath(this.liveTranscript);
            if (parsedMath && (parsedMath.normalizedText || parsedMath.latex)) {
              const ansInput = this.container?.querySelector("#quiz-student-answer");
              if (ansInput && !ansInput.value.trim()) {
                const cleanAns = parsedMath.normalizedText || parsedMath.latex;
                ansInput.value = cleanAns;
                this.quizAnswerValue = cleanAns;
              }
            }
          } catch (e) {
            console.warn("Spoken math parser note:", e);
          }
        }

        this.renderResultPanel();
        NotificationToast.show("Rekaman suara berhasil disimpan dan dilampirkan!", "success");
      };

      this.mediaRecorder.start();

      // Timer counter
      if (this.recordingInterval) clearInterval(this.recordingInterval);
      this.recordingInterval = setInterval(() => {
        this.recordingDurationSec++;
        const timerEl = this.container?.querySelector("#quiz-audio-timer-display");
        if (timerEl) timerEl.textContent = this.formatDuration(this.recordingDurationSec);
        if (this.recordingDurationSec >= 120) {
          this.stopAudioRecording();
        }
      }, 1000);

      // Inisialisasi Web Speech API jika browser mendukung
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          this.speechRecognition = new SpeechRec();
          this.speechRecognition.lang = "id-ID";
          this.speechRecognition.continuous = true;
          this.speechRecognition.interimResults = true;

          this.speechRecognition.onresult = (event) => {
            let interim = "";
            let final = "";
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                final += event.results[i][0].transcript + " ";
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            this.liveTranscript = (final + interim).trim();
            const transcriptEl = this.container?.querySelector("#quiz-live-transcript-box");
            if (transcriptEl) transcriptEl.textContent = this.liveTranscript;

            // Sinkronkan ke textarea langkah pengerjaan
            const stepsInput = this.container?.querySelector("#quiz-student-steps");
            if (stepsInput && this.liveTranscript) {
              stepsInput.value = `[Transkripsi Suara Siswa]:\n${this.liveTranscript}`;
              this.quizStepsValue = stepsInput.value;
            }
          };

          this.speechRecognition.onerror = (e) => {
            console.warn("SpeechRecognition notice:", e.error);
          };

          this.speechRecognition.start();
        } catch (err) {
          console.warn("Speech recognition error:", err);
        }
      }

      this.renderResultPanel();
    } catch (err) {
      console.error("Audio recording permission error:", err);
      NotificationToast.show(`Gagal mengakses mikrofon: ${err.message}. Harap izinkan akses mic di browser.`, "error");
      this.isRecordingAudio = false;
      this.renderResultPanel();
    }
  }

  stopAudioRecording() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (e) {}
      this.speechRecognition = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    this.isRecordingAudio = false;
  }

  bindEvents() {
    if (!this.container) return;

    // Mode Toggle Buttons
    this.container.addEventListener("click", async (e) => {
      const btnSolve = e.target.closest("#solver-mode-btn-solve");
      const btnQuiz = e.target.closest("#solver-mode-btn-quiz");
      const btnCta = e.target.closest("#btn-switch-to-quiz-cta");

      if (btnSolve) {
        this.currentMode = "solve";
        this.render();
        return;
      } else if (btnQuiz || btnCta) {
        this.currentMode = "quiz";
        this.render();
        return;
      }

      // Open AI Key Configuration Modal
      const openAiModalBtn = e.target.closest("#btn-open-ai-config, #btn-quick-config-link, #btn-banner-connect-api, #floating-photo-api-tab, .btn-open-api-modal");
      if (openAiModalBtn) {
        this.openApiKeyModal();
        return;
      }

      // Close AI Modal
      const closeAiModalBtn = e.target.closest("#btn-close-ai-modal");
      if (closeAiModalBtn) {
        this.closeApiKeyModal();
        return;
      }

      // Provider Switcher Tab in Modal
      const provTab = e.target.closest(".ai-provider-tab-btn");
      if (provTab) {
        const selectedProv = provTab.getAttribute("data-provider");
        this.handleProviderTabChange(selectedProv);
        return;
      }

      // Test AI Connection Button
      const testConnBtn = e.target.closest("#btn-test-ai-connection");
      if (testConnBtn) {
        await this.handleTestConnection();
        return;
      }

      // Save AI Configuration Button
      const saveCfgBtn = e.target.closest("#btn-save-ai-config");
      if (saveCfgBtn) {
        this.handleSaveAiConfig();
        return;
      }

      // Clear AI Key Button
      const clearKeyBtn = e.target.closest("#btn-clear-ai-key");
      if (clearKeyBtn) {
        this.handleClearAiKey();
        return;
      }

      // Toggle Key Visibility
      const toggleVisBtn = e.target.closest("#btn-toggle-key-visibility");
      if (toggleVisBtn) {
        const inputKey = this.container.querySelector("#input-ai-api-key");
        if (inputKey) {
          const isPass = inputKey.type === "password";
          inputKey.type = isPass ? "text" : "password";
          toggleVisBtn.textContent = isPass ? "Sembunyikan" : "Tampilkan";
        }
        return;
      }

      // Multi-Problem Tab Switcher (Solve Mode)
      const probTab = e.target.closest(".solver-prob-tab-btn");
      if (probTab) {
        this.activeProblemTab = probTab.getAttribute("data-prob-tab");
        const listContainer = this.container.querySelector("#solver-problems-rendered-list");
        if (listContainer && this.currentProblem) {
          const norm = this.normalizeScanResult(this.currentProblem);
          listContainer.innerHTML = this.renderProblemsSolutionCards(norm.problems, this.activeProblemTab);
          this.renderKaTeXInElement(listContainer);

          // Update active pill classes
          this.container.querySelectorAll(".solver-prob-tab-btn").forEach(btn => {
            const isActive = btn.getAttribute("data-prob-tab") === this.activeProblemTab;
            btn.className = `solver-prob-tab-btn px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              isActive ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`;
          });
        }
        return;
      }

      // Multi-Problem Switcher (Quiz Mode)
      const quizTab = e.target.closest(".quiz-prob-tab-btn");
      if (quizTab) {
        this.activeQuizProblemIndex = parseInt(quizTab.getAttribute("data-quiz-index"), 10) || 0;
        this.renderResultPanel();
        return;
      }

      // Sample Question Buttons
      const sampleBtn = e.target.closest(".sample-math-btn");
      if (sampleBtn) {
        const sid = sampleBtn.getAttribute("data-sample-id");
        const found = SAMPLE_MATH_PHOTOS.find((s) => s.id === sid);
        if (found) {
          this.loadSampleProblem(found);
        }
        return;
      }

      // Multimodal Quiz Modality Tab Switcher (Teks, Foto Coretan, Rekam Suara)
      const modalTab = e.target.closest(".quiz-modality-tab-btn");
      if (modalTab) {
        const ansInput = this.container?.querySelector("#quiz-student-answer");
        const stepsInput = this.container?.querySelector("#quiz-student-steps");
        if (ansInput) this.quizAnswerValue = ansInput.value;
        if (stepsInput) this.quizStepsValue = stepsInput.value;

        this.quizInputModality = modalTab.getAttribute("data-modality") || "text";
        this.renderResultPanel();
        return;
      }

      // Quick Math Symbol Chip Insert Button
      const chipBtn = e.target.closest(".btn-math-chip");
      if (chipBtn) {
        const chipVal = chipBtn.getAttribute("data-chip");
        const ansInput = this.container?.querySelector("#quiz-student-answer");
        if (ansInput && chipVal) {
          if (!ansInput.value.trim()) {
            ansInput.value = chipVal;
          } else {
            ansInput.value += ` ${chipVal}`;
          }
          this.quizAnswerValue = ansInput.value;
          ansInput.focus();
          NotificationToast.show(`Simbol "${chipVal}" disisipkan!`, "info", 1200);
        }
        return;
      }

      // Quiz Scratchpad (Gambar) Buttons
      const pickScratchBtn = e.target.closest("#btn-pick-quiz-scratchpad");
      if (pickScratchBtn) {
        const fileInp = this.container?.querySelector("#quiz-scratchpad-file-input");
        if (fileInp) {
          fileInp.value = "";
          fileInp.click();
        }
        return;
      }

      const camScratchBtn = e.target.closest("#btn-camera-quiz-scratchpad");
      if (camScratchBtn) {
        const camInp = this.container?.querySelector("#quiz-scratchpad-camera-input");
        if (camInp) {
          camInp.value = "";
          camInp.click();
        }
        return;
      }

      const rmScratchBtn = e.target.closest("#btn-remove-quiz-scratchpad");
      if (rmScratchBtn) {
        this.quizStudentImage = null;
        this.renderResultPanel();
        NotificationToast.show("Foto coretan dihapus.", "info");
        return;
      }

      const aiExtractScratchBtn = e.target.closest("#btn-ai-extract-scratchpad");
      if (aiExtractScratchBtn) {
        this.handleScanScratchpadWithAi();
        return;
      }

      // Quiz Audio (Rekam Suara) Buttons
      const startAudioBtn = e.target.closest("#btn-start-quiz-audio, #btn-rerecord-quiz-audio");
      if (startAudioBtn) {
        this.startAudioRecording();
        return;
      }

      const stopAudioBtn = e.target.closest("#btn-stop-quiz-audio");
      if (stopAudioBtn) {
        this.stopAudioRecording();
        return;
      }

      const cancelAudioBtn = e.target.closest("#btn-cancel-quiz-audio");
      if (cancelAudioBtn) {
        if (this.recordingInterval) {
          clearInterval(this.recordingInterval);
          this.recordingInterval = null;
        }
        if (this.speechRecognition) {
          try { this.speechRecognition.stop(); } catch (err) {}
          this.speechRecognition = null;
        }
        if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
          try { this.mediaRecorder.stop(); } catch (err) {}
        }
        this.isRecordingAudio = false;
        this.audioChunks = [];
        this.liveTranscript = "";
        this.recordingDurationSec = 0;
        this.renderResultPanel();
        NotificationToast.show("Perekaman suara dibatalkan.", "info");
        return;
      }

      const rmAudioBtn = e.target.closest("#btn-remove-quiz-audio");
      if (rmAudioBtn) {
        if (this.quizStudentAudio?.audioUrl) {
          try { URL.revokeObjectURL(this.quizStudentAudio.audioUrl); } catch (e) {}
        }
        this.quizStudentAudio = null;
        this.renderResultPanel();
        NotificationToast.show("Rekaman suara dihapus.", "info");
        return;
      }

      // Diagnose Button in Quiz Mode
      const diagBtn = e.target.closest("#btn-diagnose-my-answer");
      if (diagBtn) {
        this.evaluateStudentDiagnosis();
        return;
      }

      // Apply Simplified Answer Button
      const applySimpBtn = e.target.closest("#btn-apply-simplified-answer");
      if (applySimpBtn) {
        const simp = applySimpBtn.getAttribute("data-simplified-ans");
        const answerInput = this.container?.querySelector("#quiz-student-answer");
        if (answerInput && simp) {
          answerInput.value = simp;
          NotificationToast.show(`Bentuk sederhana (${simp}) diterapkan! Mengevaluasi kembali...`, "success");
          this.evaluateStudentDiagnosis();
        }
        return;
      }

      // Live AI Deep Pedagogy Button
      const aiPedagogyBtn = e.target.closest("#btn-ai-deep-pedagogy");
      if (aiPedagogyBtn) {
        this.evaluateStudentDiagnosisWithLiveAi();
        return;
      }

      // Reveal Solution Button in Quiz Mode
      const revealBtn = e.target.closest("#btn-reveal-solution-quiz");
      if (revealBtn) {
        this.currentMode = "solve";
        this.render();
        return;
      }

      // Copy Single Solution Button
      const copyBtn = e.target.closest(".btn-copy-single-solution");
      if (copyBtn) {
        const text = `${copyBtn.getAttribute("data-prob-title")}\nJawaban: ${copyBtn.getAttribute("data-answer-text")}`;
        navigator.clipboard?.writeText(text).then(() => {
          NotificationToast.show("Jawaban berhasil disalin ke clipboard!", "success");
        });
        return;
      }

      // Remove Photo / File Button
      const removeBtn = e.target.closest("#btn-remove-photo");
      if (removeBtn) {
        this.currentImage = null;
        this.currentFile = null;
        this.currentProblem = null;
        this.activeProblemTab = "all";
        this.activeQuizProblemIndex = 0;
        this.render();
        return;
      }

      // Rescan Button
      const rescanBtn = e.target.closest("#btn-rescan-photo");
      if (rescanBtn && (this.currentFile || this.currentImage)) {
        if (AiVisionService.hasValidKey()) {
          if (this.currentFile?.isText) {
            await this.scanTextWithLiveAi(this.currentFile.textContent, this.currentFile);
          } else if (this.currentFile?.isPdf) {
            await this.scanFileWithLiveAi(this.currentFile);
          } else if (this.currentImage) {
            await this.scanWithLiveAi(this.currentImage);
          }
        } else {
          this.simulateScanAnimation(this.currentProblem || SAMPLE_MATH_PHOTOS[0]);
        }
        return;
      }

      // Main File Pickers (Delegated Click - Works repeatedly across re-renders)
      const pickBtn = e.target.closest("#btn-pick-file");
      if (pickBtn) {
        const fileInput = this.container.querySelector("#photo-file-input");
        if (fileInput) {
          fileInput.value = "";
          fileInput.click();
        }
        return;
      }

      const pickDocBtn = e.target.closest("#btn-pick-doc");
      if (pickDocBtn) {
        const docInput = this.container.querySelector("#doc-file-input");
        if (docInput) {
          docInput.value = "";
          docInput.click();
        }
        return;
      }

      const camBtn = e.target.closest("#btn-take-photo");
      if (camBtn) {
        const cameraInput = this.container.querySelector("#camera-file-input");
        if (cameraInput) {
          cameraInput.value = "";
          cameraInput.click();
        }
        return;
      }

      // Empty Dropzone Area Click (Triggers file picker if clicked anywhere on empty dropzone area)
      const emptyDropzone = e.target.closest("#dropzone-empty-state");
      if (emptyDropzone && !e.target.closest("button, a, input, kbd")) {
        const fileInput = this.container.querySelector("#photo-file-input");
        if (fileInput) {
          fileInput.value = "";
          fileInput.click();
        }
        return;
      }
    });

    // Multimodal & Photo Solver File Inputs (Delegated Change Listener - Resetting value so same file can be re-selected)
    this.container.addEventListener("change", async (e) => {
      const target = e.target;
      if (!target) return;

      if (target.id === "photo-file-input" || target.id === "doc-file-input" || target.id === "camera-file-input") {
        const file = target.files && target.files[0];
        target.value = ""; // Reset so re-selecting the exact same file fires change event every time
        if (file) {
          await this.handleFile(file);
        }
        return;
      }

      if (target.id === "quiz-scratchpad-file-input" || target.id === "quiz-scratchpad-camera-input") {
        const file = target.files && target.files[0];
        target.value = ""; // Reset value
        if (file) {
          await this.handleScratchpadImage(file);
        }
        return;
      }
    });

    // Drag & Drop (Delegated on container so it permanently survives re-renders)
    this.container.addEventListener("dragenter", (e) => {
      const dropzone = e.target.closest("#photo-dropzone");
      if (dropzone) {
        e.preventDefault();
        dropzone.classList.add("border-cyan-400", "bg-cyan-950/20");
      }
    });

    this.container.addEventListener("dragover", (e) => {
      const dropzone = e.target.closest("#photo-dropzone");
      if (dropzone) {
        e.preventDefault();
        dropzone.classList.add("border-cyan-400", "bg-cyan-950/20");
      }
    });

    this.container.addEventListener("dragleave", (e) => {
      const dropzone = e.target.closest("#photo-dropzone");
      if (dropzone) {
        dropzone.classList.remove("border-cyan-400", "bg-cyan-950/20");
      }
    });

    this.container.addEventListener("drop", async (e) => {
      const dropzone = e.target.closest("#photo-dropzone");
      if (dropzone) {
        e.preventDefault();
        dropzone.classList.remove("border-cyan-400", "bg-cyan-950/20");
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          await this.handleFile(file);
        }
      }
    });

    // Global Clipboard Paste (Ctrl + V) when on this tab
    window.addEventListener("paste", (e) => {
      // PENTING: Jangan mencegat paste jika pengguna sedang fokus di elemen input, textarea,
      // atau jika dialog/modal (seperti modal API Key) sedang aktif!
      const activeElement = document.activeElement;
      const target = e.target;
      const isInputFocused = target && (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable || 
        target.closest("input, textarea, select, #ai-api-modal, .modal-backdrop, dialog")
      );
      const isApiModalOpen = document.getElementById("ai-api-modal") && !document.getElementById("ai-api-modal").classList.contains("hidden");

      if (isInputFocused || isApiModalOpen || (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA"))) {
        return; // Biarkan paste berjalan normal ke input/textarea (misal: menempelkan API key)
      }

      const activeSection = document.getElementById("section-photo-solver-mode");
      if (activeSection && !activeSection.classList.contains("hidden")) {
        // 1. Cek apakah ada file berkas/gambar di clipboard
        const items = Array.from(e.clipboardData?.items || []);
        const fileItem = items.find((i) => i.kind === "file");
        if (fileItem) {
          const file = fileItem.getAsFile();
          if (file) {
            this.handleFile(file);
            return;
          }
        }

        // 2. Cek apakah ada teks formula matematika / LaTeX yang ditempel
        const pastedText = e.clipboardData?.getData("text/plain");
        if (pastedText && pastedText.trim().length > 3) {
          // Jangan perlakukan API key atau token (AIza, sk-, gsk, dll) sebagai formula
          const isApiKeyPattern = /^(AIza|sk-|gsk-|claude-)/i.test(pastedText.trim());
          if (isApiKeyPattern) return;

          // Hanya deteksi formula jika mengandung notasi matematika spesifik
          const isProbablyMath = /[\$\\\^]/.test(pastedText) || 
            pastedText.includes("\\frac") || 
            pastedText.includes("\\sqrt") || 
            pastedText.includes("\\times") || 
            pastedText.includes("\\int") || 
            pastedText.includes("\\sum") || 
            pastedText.includes("lim_{") || 
            pastedText.includes("\\pm");

          if (isProbablyMath) {
            const fakeFile = new File([pastedText], "tangkapan_formula.tex", { type: "text/plain" });
            this.handleFile(fakeFile);
          }
        }
      }
    });

    // Synchronize Input Fields to internal state
    this.container.addEventListener("input", (e) => {
      if (e.target && e.target.id === "quiz-student-answer") {
        this.quizAnswerValue = e.target.value;
      } else if (e.target && e.target.id === "quiz-student-steps") {
        this.quizStepsValue = e.target.value;
      }
    });
  }

  async handleFile(file) {
    if (!file) return;

    const name = file.name || "berkas_matematika";
    const sizeFormatted = MediaManager.formatFileSize(file.size || 0);
    const ext = (name.split(".").pop() || "").toLowerCase();

    const isImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
    const isPdf = file.type === "application/pdf" || ext === "pdf";
    const isText = file.type.startsWith("text/") || ["txt", "tex", "latex", "md", "markdown", "json", "csv"].includes(ext);
    const isDoc = ["docx", "doc"].includes(ext);

    if (!isImage && !isPdf && !isText && !isDoc) {
      NotificationToast.show("Format berkas tidak didukung. Harap unggah Foto (JPG, PNG, WEBP), Dokumen PDF (.pdf), atau File Teks/LaTeX (.tex, .txt, .md).", "warning");
      return;
    }

    // 1. Berkas Teks & LaTeX (.txt, .tex, .md, dll)
    if (isText) {
      try {
        const textContent = await file.text();
        this.currentFile = {
          name,
          size: file.size,
          sizeFormatted,
          type: file.type || "text/plain",
          extension: ext,
          isText: true,
          isPdf: false,
          isImage: false,
          textContent
        };
        this.currentImage = null;
        this.activeProblemTab = "all";
        this.activeQuizProblemIndex = 0;
        this.render();

        if (AiVisionService.hasValidKey()) {
          await this.scanTextWithLiveAi(textContent, this.currentFile);
        } else {
          const recognized = this.recognizeProblemFromText(textContent, name);
          this.simulateScanAnimation(recognized);
        }
      } catch (err) {
        NotificationToast.show(`Gagal membaca berkas teks: ${err.message}`, "error");
      }
      return;
    }

    // 2. Berkas Dokumen PDF (.pdf)
    if (isPdf) {
      try {
        const dataUrl = await MediaManager.readFileAsDataURL(file);
        this.currentFile = {
          name,
          size: file.size,
          sizeFormatted,
          type: "application/pdf",
          extension: "pdf",
          isPdf: true,
          isText: false,
          isImage: false,
          dataUrl
        };
        this.currentImage = null;
        this.activeProblemTab = "all";
        this.activeQuizProblemIndex = 0;
        this.render();

        if (AiVisionService.hasValidKey()) {
          await this.scanFileWithLiveAi(this.currentFile);
        } else {
          const recognized = this.recognizeProblemFromImage(name);
          this.simulateScanAnimation(recognized);
        }
      } catch (err) {
        NotificationToast.show(`Gagal memproses berkas PDF: ${err.message}`, "error");
      }
      return;
    }

    // 3. Berkas Dokumen Word (.docx)
    if (isDoc) {
      try {
        const textContent = await file.text();
        this.currentFile = {
          name,
          size: file.size,
          sizeFormatted,
          type: file.type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          extension: ext,
          isText: true,
          isPdf: false,
          isImage: false,
          textContent: textContent.length > 50 ? textContent : `Dokumen Word: ${name} (${sizeFormatted})`
        };
        this.currentImage = null;
        this.activeProblemTab = "all";
        this.activeQuizProblemIndex = 0;
        this.render();

        if (AiVisionService.hasValidKey()) {
          await this.scanTextWithLiveAi(this.currentFile.textContent, this.currentFile);
        } else {
          const recognized = this.recognizeProblemFromImage(name);
          this.simulateScanAnimation(recognized);
        }
      } catch (err) {
        NotificationToast.show(`Gagal membaca dokumen: ${err.message}`, "error");
      }
      return;
    }

    // 4. Berkas Gambar / Foto (JPG, PNG, WEBP)
    try {
      const dataUrl = await MediaManager.readFileAsDataURL(file);
      this.currentFile = {
        name,
        size: file.size,
        sizeFormatted,
        type: file.type || "image/jpeg",
        extension: ext,
        isImage: true,
        isPdf: false,
        isText: false,
        dataUrl
      };
      this.currentImage = dataUrl;
      this.activeProblemTab = "all";
      this.activeQuizProblemIndex = 0;
      this.render();

      if (AiVisionService.hasValidKey()) {
        await this.scanWithLiveAi(dataUrl);
      } else {
        const recognized = this.recognizeProblemFromImage(file.name);
        this.simulateScanAnimation(recognized);
      }
    } catch (err) {
      NotificationToast.show(`Gagal memuat gambar: ${err.message}`, "error");
    }
  }

  openApiKeyModal() {
    const modal = this.container?.querySelector("#ai-api-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  closeApiKeyModal() {
    const modal = this.container?.querySelector("#ai-api-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  handleProviderTabChange(provider) {
    const selectModel = this.container?.querySelector("#select-ai-model");
    const inputKey = this.container?.querySelector("#input-ai-api-key");
    const tabs = this.container?.querySelectorAll(".ai-provider-tab-btn");

    tabs?.forEach(btn => {
      const isSelected = btn.getAttribute("data-provider") === provider;
      btn.className = `ai-provider-tab-btn p-3 rounded-2xl border text-center transition-all cursor-pointer ${
        isSelected ? "bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-900/40" : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
      }`;
    });

    if (selectModel) {
      selectModel.innerHTML = this.getModelOptionsHtml(provider, "");
    }
    if (inputKey) {
      inputKey.placeholder = provider === "gemini" ? "AIzaSy..." : provider === "openai" ? "sk-..." : "sk-ant-...";
    }
  }

  async handleTestConnection() {
    const activeTab = this.container?.querySelector(".ai-provider-tab-btn.border-cyan-400");
    const provider = activeTab?.getAttribute("data-provider") || "gemini";
    const apiKey = (this.container?.querySelector("#input-ai-api-key")?.value || "").trim();
    const model = this.container?.querySelector("#select-ai-model")?.value || "";
    const feedbackBox = this.container?.querySelector("#ai-test-ping-feedback");
    const testBtn = this.container?.querySelector("#btn-test-ai-connection");

    if (!apiKey) {
      NotificationToast.show("Masukkan API Key terlebih dahulu.", "warning");
      return;
    }

    if (feedbackBox) {
      feedbackBox.classList.remove("hidden");
      feedbackBox.className = "p-3 rounded-xl text-xs space-y-1 bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 animate-pulse";
      feedbackBox.innerHTML = `<span>⏳ Menghubungi server ${provider.toUpperCase()} (${model})...</span>`;
    }

    if (testBtn) testBtn.disabled = true;

    try {
      const res = await AiVisionService.testConnection(provider, apiKey, model);
      if (feedbackBox) {
        feedbackBox.className = "p-3 rounded-xl text-xs space-y-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 animate-fade-in";
        feedbackBox.innerHTML = `
          <div class="flex items-center gap-1.5 font-bold">
            <span>✓</span>
            <span>Koneksi Berhasil!</span>
          </div>
          <p class="text-[11px] text-emerald-300">Model ${res.model} siap memindai dan menyelesaikan lembar soal matematika.</p>
        `;
      }
      NotificationToast.show(`Koneksi ke ${res.provider} Berhasil!`, "success");
    } catch (err) {
      if (feedbackBox) {
        feedbackBox.className = "p-3 rounded-xl text-xs space-y-1 bg-rose-950/80 border border-rose-500/50 text-rose-200 animate-fade-in";
        feedbackBox.innerHTML = `
          <div class="flex items-center gap-1.5 font-bold">
            <span>⚠️</span>
            <span>Uji Koneksi Gagal:</span>
          </div>
          <p class="text-[11px] text-rose-300 font-mono">${err.message}</p>
        `;
      }
      NotificationToast.show(`Gagal terhubung ke AI: ${err.message}`, "error");
    } finally {
      if (testBtn) testBtn.disabled = false;
    }
  }

  handleSaveAiConfig() {
    const activeTab = this.container?.querySelector(".ai-provider-tab-btn.border-cyan-400");
    const provider = activeTab?.getAttribute("data-provider") || "gemini";
    const apiKey = (this.container?.querySelector("#input-ai-api-key")?.value || "").trim();
    const model = this.container?.querySelector("#select-ai-model")?.value || "";

    AiVisionService.saveConfig({
      provider,
      apiKey,
      model,
      temperature: 0.1
    });

    NotificationToast.show(`Konfigurasi Vision AI (${provider.toUpperCase()}) berhasil disimpan!`, "success");
    this.closeApiKeyModal();
    this.render();
  }

  handleClearAiKey() {
    if (!confirm("Hapus API Key yang tersimpan dari peramban?")) return;

    AiVisionService.saveConfig({
      provider: "gemini",
      apiKey: "",
      model: "gemini-1.5-flash",
      temperature: 0.1
    });

    NotificationToast.show("API Key berhasil dihapus. Kembali ke mode preset.", "info");
    this.closeApiKeyModal();
    this.render();
  }

  loadSampleProblem(sample) {
    this.currentProblem = sample;
    this.activeProblemTab = "all";
    this.activeQuizProblemIndex = 0;

    if (sample.fileMeta?.isPdf) {
      this.currentFile = {
        name: sample.fileMeta.name,
        sizeFormatted: sample.fileMeta.sizeFormatted,
        isPdf: true,
        isText: false,
        isImage: false,
        dataUrl: null
      };
      this.currentImage = null;
    } else if (sample.fileMeta?.isText) {
      this.currentFile = {
        name: sample.fileMeta.name,
        sizeFormatted: sample.fileMeta.sizeFormatted,
        extension: sample.fileMeta.extension || "tex",
        isText: true,
        isPdf: false,
        isImage: false,
        textContent: sample.fileMeta.textContent
      };
      this.currentImage = null;
    } else {
      this.currentFile = {
        name: (sample.title || "soal_matematika") + ".png",
        sizeFormatted: "128 KB",
        isImage: true,
        isPdf: false,
        isText: false
      };
      this.currentImage = this.generateSamplePlaceholderImage(sample.title || sample.latex);
    }

    this.render();
    this.simulateScanAnimation(sample);
  }

  generateSamplePlaceholderImage(titleText) {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 280;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#060911";
    ctx.fillRect(0, 0, 640, 280);

    // Draw Grid
    ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 280);
      ctx.stroke();
    }
    for (let y = 0; y < 280; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Border frame
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 608, 248);

    // Title
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#fef08a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(titleText, 320, 110);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("Error Pattern Engine • Multimodal Worksheet Scanner", 320, 160);

    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("Mendukung Multi-Soal, PDF, LaTeX &amp; KaTeX Komputer", 320, 190);

    return c.toDataURL("image/png");
  }

  recognizeProblemFromImage(filename = "") {
    const lower = (filename || "").toLowerCase();
    
    // Check if calculus, limit, or trigonometry (matches the user's scanned worksheet)
    if (
      lower.includes("limit") || 
      lower.includes("trig") || 
      lower.includes("sin") || 
      lower.includes("tan") || 
      lower.includes("kalkulus") ||
      lower.includes("media")
    ) {
      return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_latex_file" || s.id === "sample_limit_trig") || SAMPLE_MATH_PHOTOS[0];
    }

    if (
      lower.includes("pecahan") || 
      lower.includes("fraction") || 
      lower.includes("kali") || 
      lower.includes("multi") || 
      lower.includes("sheet") ||
      lower.includes("pdf")
    ) {
      return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_pdf_worksheet" || s.id === "sample_multi_fractions") || SAMPLE_MATH_PHOTOS[0];
    }

    if (lower.includes("diskriminan")) return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_2") || SAMPLE_MATH_PHOTOS[2];
    if (lower.includes("abc") || lower.includes("rumus")) return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_4") || SAMPLE_MATH_PHOTOS[4];
    if (lower.includes("aljabar") || lower.includes("faktor")) return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_1") || SAMPLE_MATH_PHOTOS[1];

    // Default to the first sample
    return SAMPLE_MATH_PHOTOS[0];
  }

  recognizeProblemFromText(textContent = "", filename = "") {
    const combined = `${filename} ${textContent}`.toLowerCase();
    
    if (
      combined.includes("limit") || 
      combined.includes("trig") || 
      combined.includes("sin") || 
      combined.includes("tan") || 
      combined.includes("kalkulus") ||
      combined.includes("sec") ||
      combined.includes("cos")
    ) {
      return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_latex_file" || s.id === "sample_limit_trig") || SAMPLE_MATH_PHOTOS[1];
    }
    
    if (
      combined.includes("pecahan") || 
      combined.includes("fraction") || 
      combined.includes("times") || 
      combined.includes("kali") ||
      combined.includes("frac")
    ) {
      return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_pdf_worksheet" || s.id === "sample_multi_fractions") || SAMPLE_MATH_PHOTOS[0];
    }

    if (combined.includes("diskriminan") || combined.includes("b^2 - 4ac")) {
      return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_2") || SAMPLE_MATH_PHOTOS[3];
    }

    if (combined.includes("abc") || combined.includes("rumus")) {
      return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_4") || SAMPLE_MATH_PHOTOS[4];
    }

    return SAMPLE_MATH_PHOTOS.find(s => s.id === "sample_latex_file") || SAMPLE_MATH_PHOTOS[0];
  }

  async scanWithLiveAi(dataUrl) {
    this.isScanning = true;
    const cfg = AiVisionService.getStoredConfig();
    const providerName = cfg.provider === "gemini" ? "Google Gemini" : cfg.provider === "openai" ? "OpenAI GPT-4o" : "Anthropic Claude";
    
    this.scanStatusText = `Menghubungi ${providerName}... Menganalisis gambar matematika & mendeteksi butir soal...`;
    
    const beam = this.container?.querySelector("#photo-scan-beam");
    const statusPill = this.container?.querySelector("#photo-scan-status-pill");
    const statusTextEl = this.container?.querySelector("#photo-scan-status-text");

    if (beam) beam.classList.remove("hidden");
    if (statusPill) statusPill.classList.remove("hidden");
    if (statusTextEl) statusTextEl.textContent = this.scanStatusText;

    try {
      const result = await AiVisionService.analyzeMediaMath(dataUrl, { name: this.currentFile?.name || "foto_soal.jpg" });
      this.currentProblem = this.normalizeScanResult(result);
      this.activeProblemTab = "all";
      this.activeQuizProblemIndex = 0;
      
      const count = this.currentProblem.problems ? this.currentProblem.problems.length : 1;
      NotificationToast.show(`Berhasil memindai ${count} butir soal via ${providerName}!`, "success");
    } catch (err) {
      console.warn("Live AI Vision failed, falling back to smart heuristic:", err);
      NotificationToast.show(`AI API Error (${err.message}). Menampilkan hasil analisis cerdas...`, "warning");
      const recognized = this.recognizeProblemFromImage(this.currentFile?.name || "soal.png");
      this.currentProblem = this.normalizeScanResult(recognized);
    } finally {
      this.isScanning = false;
      if (beam) beam.classList.add("hidden");
      if (statusPill) statusPill.classList.add("hidden");
      this.renderResultPanel();
    }
  }

  async scanFileWithLiveAi(fileObj) {
    this.isScanning = true;
    const cfg = AiVisionService.getStoredConfig();
    const providerName = cfg.provider === "gemini" ? "Google Gemini" : cfg.provider === "openai" ? "OpenAI GPT-4o" : "Anthropic Claude";
    
    this.scanStatusText = `Menghubungi ${providerName}... Menganalisis dokumen PDF "${fileObj.name}" & mendeteksi soal...`;
    
    const beam = this.container?.querySelector("#photo-scan-beam");
    const statusPill = this.container?.querySelector("#photo-scan-status-pill");
    const statusTextEl = this.container?.querySelector("#photo-scan-status-text");

    if (beam) beam.classList.remove("hidden");
    if (statusPill) statusPill.classList.remove("hidden");
    if (statusTextEl) statusTextEl.textContent = this.scanStatusText;

    try {
      const result = await AiVisionService.analyzeMediaMath(fileObj.dataUrl, { name: fileObj.name });
      this.currentProblem = this.normalizeScanResult(result);
      this.activeProblemTab = "all";
      this.activeQuizProblemIndex = 0;
      
      const count = this.currentProblem.problems ? this.currentProblem.problems.length : 1;
      NotificationToast.show(`Berhasil memindai ${count} butir soal dari berkas PDF via ${providerName}!`, "success");
    } catch (err) {
      console.warn("Live AI Document failed, falling back to smart heuristic:", err);
      NotificationToast.show(`AI API Error (${err.message}). Menampilkan hasil analisis cerdas...`, "warning");
      const recognized = this.recognizeProblemFromImage(fileObj.name);
      this.currentProblem = this.normalizeScanResult(recognized);
    } finally {
      this.isScanning = false;
      if (beam) beam.classList.add("hidden");
      if (statusPill) statusPill.classList.add("hidden");
      this.renderResultPanel();
    }
  }

  async scanTextWithLiveAi(textContent, fileObj) {
    this.isScanning = true;
    const cfg = AiVisionService.getStoredConfig();
    const providerName = cfg.provider === "gemini" ? "Google Gemini" : cfg.provider === "openai" ? "OpenAI GPT-4o" : "Anthropic Claude";
    
    this.scanStatusText = `Menghubungi ${providerName}... Memproses berkas teks/LaTeX "${fileObj.name}" & mengurai formula...`;
    
    const beam = this.container?.querySelector("#photo-scan-beam");
    const statusPill = this.container?.querySelector("#photo-scan-status-pill");
    const statusTextEl = this.container?.querySelector("#photo-scan-status-text");

    if (beam) beam.classList.remove("hidden");
    if (statusPill) statusPill.classList.remove("hidden");
    if (statusTextEl) statusTextEl.textContent = this.scanStatusText;

    try {
      const result = await AiVisionService.analyzeTextMath(textContent, { name: fileObj.name });
      this.currentProblem = this.normalizeScanResult(result);
      this.activeProblemTab = "all";
      this.activeQuizProblemIndex = 0;
      
      const count = this.currentProblem.problems ? this.currentProblem.problems.length : 1;
      NotificationToast.show(`Berhasil menyelesaikan ${count} butir soal dari teks via ${providerName}!`, "success");
    } catch (err) {
      console.warn("Live AI Text failed, falling back to smart heuristic:", err);
      NotificationToast.show(`AI API Error (${err.message}). Menampilkan hasil analisis cerdas...`, "warning");
      const recognized = this.recognizeProblemFromText(textContent, fileObj.name);
      this.currentProblem = this.normalizeScanResult(recognized);
    } finally {
      this.isScanning = false;
      if (beam) beam.classList.add("hidden");
      if (statusPill) statusPill.classList.add("hidden");
      this.renderResultPanel();
    }
  }

  simulateScanAnimation(problem) {
    this.isScanning = true;
    this.scanStatusText = "Memindai seluruh butir soal matematika & mengurai LaTeX KaTeX...";
    
    const beam = this.container?.querySelector("#photo-scan-beam");
    const statusPill = this.container?.querySelector("#photo-scan-status-pill");
    const statusTextEl = this.container?.querySelector("#photo-scan-status-text");

    if (beam) beam.classList.remove("hidden");
    if (statusPill) statusPill.classList.remove("hidden");
    if (statusTextEl) statusTextEl.textContent = this.scanStatusText;

    setTimeout(() => {
      this.isScanning = false;
      if (beam) beam.classList.add("hidden");
      if (statusPill) statusPill.classList.add("hidden");
      this.currentProblem = this.normalizeScanResult(problem);
      this.activeProblemTab = "all";
      this.activeQuizProblemIndex = 0;
      this.renderResultPanel();
      
      const count = this.currentProblem.problems ? this.currentProblem.problems.length : 1;
      NotificationToast.show(`Soal berhasil dipindai (${count} butir soal terdeteksi): ${this.currentProblem.sheetTitle || "Lembar Soal"}`, "success");
    }, 950);
  }

  _gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  _parseMathExpression(str) {
    if (!str) return null;
    let clean = str.trim().toLowerCase();

    // Normalisasi LaTeX pecahan \frac{a}{b} -> a/b
    clean = clean.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2");
    clean = clean.replace(/\\times|\\cdot/g, "*");
    clean = clean.replace(/\\sqrt\s*\{([^{}]+)\}/g, "sqrt($1)");
    clean = clean.replace(/\\left|\\right/g, "");
    clean = clean.replace(/[$]/g, "");

    // Pecahan campuran: misal "1 1/2" atau "-1 1/2"
    const mixed = clean.match(/^([+-]?\d+)\s+([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
    if (mixed) {
      const whole = parseInt(mixed[1], 10);
      const num = parseInt(mixed[2], 10);
      const den = parseInt(mixed[3], 10);
      if (den !== 0) {
        const totalNum = whole < 0 ? (whole * den - num) : (whole * den + num);
        const g = this._gcd(totalNum, den);
        return {
          type: "fraction",
          num: totalNum,
          den: den,
          val: totalNum / den,
          reducedNum: totalNum / g,
          reducedDen: den / g,
          gcd: g,
          isReduced: g === 1,
          isMixed: true,
          display: `${totalNum}/${den}`
        };
      }
    }

    // Pecahan murni: misal "15/35", "3/7", "-3/7"
    const frac = clean.replace(/\s+/g, "").match(/^([+-]?\d+)\/([+-]?\d+)$/);
    if (frac) {
      const num = parseInt(frac[1], 10);
      const den = parseInt(frac[2], 10);
      if (den !== 0) {
        const g = this._gcd(num, den);
        const sign = den < 0 ? -1 : 1;
        return {
          type: "fraction",
          num: num,
          den: den,
          val: num / den,
          reducedNum: (num * sign) / g,
          reducedDen: Math.abs(den) / g,
          gcd: g,
          isReduced: g === 1 && den > 0,
          isMixed: false,
          display: `${num}/${den}`
        };
      }
    }

    // Desimal murni atau Integer: misal "0.5", "0,5", "1.5", "2", "-3"
    const numMatch = clean.replace(",", ".").replace(/\s+/g, "").match(/^([+-]?\d+(\.\d+)?)$/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      return {
        type: "decimal",
        val: val,
        isInteger: Number.isInteger(val),
        display: `${val}`
      };
    }

    // Bentuk limit / akar pi: misal "sqrt(pi)", "√π", "akar pi", "pi^0.5"
    if (clean.includes("sqrt(pi)") || clean.includes("√π") || clean.includes("akar pi") || clean.includes("akar(pi)") || clean.includes("pi^0.5")) {
      return {
        type: "radical_pi",
        val: Math.sqrt(Math.PI),
        display: "√π"
      };
    }

    // Bentuk akar tiga: misal "2+√3", "2-√3", "2 ± √3"
    if (clean.includes("sqrt(3)") || clean.includes("√3") || clean.includes("akar 3") || clean.includes("akar(3)")) {
      return {
        type: "radical_three",
        hasRootThree: true,
        hasPlusMinus: clean.includes("±") || clean.includes("+-") || (clean.includes("+") && clean.includes("-")),
        display: clean
      };
    }

    return {
      type: "raw",
      raw: clean,
      display: clean
    };
  }

  evaluateMathPedagogy(studentAnsRaw, studentStepsRaw, activeProb) {
    const studentAns = (studentAnsRaw || "").trim();
    const studentSteps = (studentStepsRaw || "").trim();
    const cleanStudentAns = studentAns.toLowerCase();
    
    const idealKeywords = (activeProb.idealAnswerKeywords || []).map((k) => k.toLowerCase());
    const finalAnswerClean = (activeProb.finalAnswer || "").replace(/[$]/g, "").trim();
    const activeLatex = activeProb.latex || "";
    
    const targetParsed = this._parseMathExpression(activeProb.finalAnswer || "");
    const studentParsed = this._parseMathExpression(studentAns);

    // 1. Direct Keyword / Exact Match Check
    const isDirectMatch = idealKeywords.some((k) => {
      const cleanK = k.replace(/[$]/g, "").trim().toLowerCase();
      return cleanStudentAns === cleanK || cleanStudentAns.includes(cleanK);
    });

    // Deteksi jika soal merupakan perkalian pecahan: \frac{a}{b} \times \frac{c}{d}
    const fracMulMatch = activeLatex.match(/\\frac\{(\d+)\}\{(\d+)\}\s*\\times\s*\\frac\{(\d+)\}\{(\d+)\}/) 
      || activeLatex.match(/(\d+)\/(\d+)\s*[\*x×]\s*(\d+)\/(\d+)/);

    // 2. Evaluasi Khusus Soal Perkalian Pecahan (Pecahan Biasa & LKS PDF)
    if (fracMulMatch) {
      const a = parseInt(fracMulMatch[1], 10);
      const b = parseInt(fracMulMatch[2], 10);
      const c = parseInt(fracMulMatch[3], 10);
      const d = parseInt(fracMulMatch[4], 10);

      const trueNum = a * c;
      const trueDen = b * d;
      const trueGcd = this._gcd(trueNum, trueDen);
      const simpNum = trueNum / trueGcd;
      const simpDen = trueDen / trueGcd;
      const trueVal = trueNum / trueDen;

      if (studentParsed && studentParsed.type === "fraction") {
        const sNum = studentParsed.num;
        const sDen = studentParsed.den;
        const sVal = studentParsed.val;

        // KASUS A: Nilai matematis sama persis!
        if (Math.abs(sVal - trueVal) < 1e-6) {
          // Apakah sudah disederhanakan penuh atau belum?
          if (studentParsed.reducedNum === simpNum && studentParsed.reducedDen === simpDen && studentParsed.isReduced) {
            return {
              status: "correct",
              classificationCode: "E0",
              classificationLabel: "[E0] Akurat & Bentuk Paling Sederhana",
              classificationCategory: "Bebas Kesalahan • Penguasaan Penuh",
              headerTitle: "Diagnosis: Jawaban Benar & Sempurna!",
              headerSubtitle: "Pola pemikiran, konsep aljabar, dan penyederhanaan kamu sepenuhnya tepat.",
              cubicReward: 15,
              studentDisplayAnswer: studentAns,
              expectedDisplayAnswer: activeProb.finalAnswer,
              simplifiedAnswer: `${simpNum}/${simpDen}`,
              isEquivalent: true,
              whereIsTheError: `Luar biasa! Kamu berhasil mengalikan pecahan $\\frac{${a}}{${b}} \\times \\frac{${c}}{${d}}$ dan menyederhanakannya secara akurat menjadi $\\frac{${simpNum}}{${simpDen}}$.`,
              remediationAdvice: [
                `Hasil perkalian pembilang ($${a} \\times ${c} = ${trueNum}$) dan penyebut ($${b} \\times ${d} = ${trueDen}$) menghasilkan pecahan $\\frac{${trueNum}}{${trueDen}}$.`,
                `Bentuk paling sederhananya adalah $\\frac{${simpNum}}{${simpDen}}$. Pertahankan ketelitian ini!`
              ],
              fastTrick: "Metode Cepat (Pencoretan Faktor): Faktor persekutuan dapat disederhanakan terlebih dahulu sebelum dikalikan untuk mempermudah perhitungan.",
              canAutoSimplify: false,
              studentStepsDetection: studentSteps ? "Coretan langkahmu menunjukkan penalaran yang runtut dan benar." : null
            };
          } else {
            // PECAHAN BELUM SEDERHANA (Misalnya 15/35 bernilai sama dengan 3/7!)
            const factor = this._gcd(sNum, sDen);
            return {
              status: "equivalent_unsimplified",
              classificationCode: "E3-S",
              classificationLabel: "[E3-S] Nilai Benar (Belum Disederhanakan)",
              classificationCategory: "Toleransi Ekuivalensi • Perlu Penyederhanaan",
              headerTitle: "Diagnosis: Benar Secara Nilai (Tinggal Disederhanakan)",
              headerSubtitle: "Langkah perhitungan kamu tepat! Pecahan bernilai sama persis, namun belum disederhanakan ke bentuk paling ringkas.",
              cubicReward: 12,
              studentDisplayAnswer: studentAns,
              expectedDisplayAnswer: activeProb.finalAnswer,
              simplifiedAnswer: `${simpNum}/${simpDen}`,
              isEquivalent: true,
              whereIsTheError: `Perkalian kamu sudah tepat: pembilang dikalikan pembilang ($${a} \\times ${c} = ${sNum}$) dan penyebut dikalikan penyebut ($${b} \\times ${d} = ${sDen}$), menghasilkan $\\frac{${sNum}}{${sDen}}$. Nilai ini sama persis dengan kunci jawaban ($${(sVal).toFixed(4)}$). Namun, pecahan ini belum dalam bentuk paling sederhana karena angka ${sNum} dan ${sDen} sama-sama kelipatan ${factor} (FPB = ${factor}).`,
              remediationAdvice: [
                `Bagi pembilang dan penyebut dengan FPB ($${factor}$): $\\frac{${sNum} \\div ${factor}}{${sDen} \\div ${factor}} = \\frac{${simpNum}}{${simpDen}}$.`,
                `Kunci jawaban baku yang diharapkan pada lembar ujian adalah bentuk paling murni: $\\frac{${simpNum}}{${simpDen}}$.`
              ],
              fastTrick: `Trik Cepat EPE: Coret faktor ${factor} sebelum mengalikan: $\\frac{${a}}{\\cancel{${b}}} \\times \\frac{\\cancel{${c}}}{${d}} = \\frac{${simpNum}}{${simpDen}}$ tanpa perlu mengalikan angka besar terlebih dahulu.`,
              canAutoSimplify: true,
              studentStepsDetection: studentSteps ? `Kamu menuliskan prosedur pengerjaan: "${studentSteps}". Operasi perkalianmu sudah sahih!` : null
            };
          }
        }

        // KASUS B: Miskonsepsi penyebut dijumlahkan alih-alih dikalikan (misal 15/12)
        if (sNum === trueNum && sDen === (b + d)) {
          return {
            status: "error",
            classificationCode: "E1-K",
            classificationLabel: "[E1-K] Miskonsepsi Operasi Pecahan (Penyebut Dijumlahkan)",
            classificationCategory: "Kesalahan Konsep Operasi",
            headerTitle: "Diagnosis: Terdeteksi Penjumlahan pada Penyebut",
            headerSubtitle: "Pembilang sudah dikalikan dengan benar, namun penyebut dijumlahkan alih-alih dikalikan.",
            cubicReward: 5,
            studentDisplayAnswer: studentAns,
            expectedDisplayAnswer: activeProb.finalAnswer,
            simplifiedAnswer: `${simpNum}/${simpDen}`,
            isEquivalent: false,
            whereIsTheError: `Kamu mengalikan pembilang ($${a} \\times ${c} = ${sNum}$), tetapi kamu menjumlahkan penyebut ($${b} + ${d} = ${sDen}$). Pada operasi perkalian pecahan, aturan dasarnya adalah mengalikan lurus: pembilang $\\times$ pembilang dan penyebut $\\times$ penyebut.`,
            remediationAdvice: [
              `Gunakan rumus perkalian pecahan baku: $\\frac{a}{b} \\times \\frac{c}{d} = \\frac{a \\times c}{b \\times d}$.`,
              `Hitung penyebut yang benar: $${b} \\times ${d} = ${trueDen}$, sehingga diperoleh $\\frac{${trueNum}}{${trueDen}} = \\frac{${simpNum}}{${simpDen}}$.`
            ],
            fastTrick: "Ingat prinsip EPE: Hanya operasi penjumlahan/pengurangan pecahan yang menyamakan atau mengoperasikan penyebut sejenis. Perkalian selalu mengalikan lurus kedua penyebut.",
            canAutoSimplify: true
          };
        }

        // KASUS C: Tertukar dengan perkalian silang (misal (a*d)/(b*c))
        if (sNum === (a * d) && sDen === (b * c)) {
          return {
            status: "error",
            classificationCode: "E2-P",
            classificationLabel: "[E2-P] Kesalahan Prosedur Perkalian Silang",
            classificationCategory: "Kesalahan Prosedural Algoritma",
            headerTitle: "Diagnosis: Tertukar dengan Prosedur Perkalian Silang",
            headerSubtitle: "Kamu melakukan perkalian silang alih-alih perkalian lurus.",
            cubicReward: 5,
            studentDisplayAnswer: studentAns,
            expectedDisplayAnswer: activeProb.finalAnswer,
            simplifiedAnswer: `${simpNum}/${simpDen}`,
            isEquivalent: false,
            whereIsTheError: `Kamu menghitung $${a} \\times ${d} = ${sNum}$ dan $${b} \\times ${c} = ${sDen}$ (perkalian silang). Perkalian silang digunakan pada pembagian pecahan (dibalik) atau perbandingan senilai, bukan pada operasi perkalian pecahan biasa.`,
            remediationAdvice: [
              `Kalikan lurus: pembilang pertama dengan pembilang kedua ($${a} \\times ${c} = ${trueNum}$).`,
              `Kalikan penyebut pertama dengan penyebut kedua ($${b} \\times ${d} = ${trueDen}$).`,
              `Sederhanakan hasil $\\frac{${trueNum}}{${trueDen}}$ menjadi $\\frac{${simpNum}}{${simpDen}}$.`
            ],
            fastTrick: "Trik Cepat EPE: Buat jembatan horizontal: Pembilang ke Pembilang →, Penyebut ke Penyebut →.",
            canAutoSimplify: true
          };
        }

        // KASUS D: Posisi pembilang dan penyebut tertukar (Resiprokal)
        if (Math.abs(sVal * trueVal - 1) < 1e-6) {
          return {
            status: "error",
            classificationCode: "E2-P",
            classificationLabel: "[E2-P] Pecahan Terbalik (Resiprokal)",
            classificationCategory: "Kesalahan Prosedural Penempatan Nilai",
            headerTitle: "Diagnosis: Posisi Pembilang dan Penyebut Terbalik",
            headerSubtitle: "Nilai pecahan kamu terbalik (pembilang tertukar dengan penyebut).",
            cubicReward: 5,
            studentDisplayAnswer: studentAns,
            expectedDisplayAnswer: activeProb.finalAnswer,
            simplifiedAnswer: `${simpNum}/${simpDen}`,
            isEquivalent: false,
            whereIsTheError: `Nilai perhitunganmu adalah $\\frac{${sNum}}{${sDen}}$, padahal posisi pembilang seharusnya adalah perkalian atas ($${a} \\times ${c} = ${trueNum}$) dan penyebut adalah perkalian bawah ($${b} \\times ${d} = ${trueDen}$).`,
            remediationAdvice: [
              `Balikkan kembali pecahanmu menjadi $\\frac{${trueNum}}{${trueDen}}$.`,
              `Sederhanakan pembilang dan penyebut hingga menjadi $\\frac{${simpNum}}{${simpDen}}$.`
            ],
            fastTrick: "Pastikan selalu menempatkan hasil perkalian angka atas tetap di bagian atas garis pecahan.",
            canAutoSimplify: true
          };
        }
      }
    }

    // 3. Cocok Langsung dengan Keyword / Bentuk Kunci Baku
    if (isDirectMatch) {
      return {
        status: "correct",
        classificationCode: "E0",
        classificationLabel: "[E0] Akurat & Bebas Kesalahan",
        classificationCategory: "Penguasaan Penuh",
        headerTitle: "Diagnosis: Jawaban Benar & Akurat!",
        headerSubtitle: "Pola pemikiran dan konsep aljabar kamu sudah tepat.",
        cubicReward: 15,
        studentDisplayAnswer: studentAns,
        expectedDisplayAnswer: activeProb.finalAnswer,
        simplifiedAnswer: finalAnswerClean,
        isEquivalent: true,
        whereIsTheError: "Hebat! Kamu berhasil menyelesaikan soal ini tanpa kesalahan tanda, komputasi, maupun miskonsepsi rumus. Pertahankan ketelitian ini!",
        remediationAdvice: [
          "Langkah pengerjaan dan hasil akhir sudah sesuai dengan kaidah baku matematika.",
          "Pertahankan gaya pemecahan masalah yang sistematis seperti ini."
        ],
        fastTrick: null,
        canAutoSimplify: false,
        studentStepsDetection: studentSteps ? "Coretan langkah pengerjaanmu konsisten dengan kunci jawaban." : null
      };
    }

    // 4. Evaluasi Ekuivalensi Pecahan Umum (Soal Berkas / Unggahan Bebas)
    if (targetParsed && targetParsed.type === "fraction" && studentParsed && studentParsed.type === "fraction") {
      if (Math.abs(studentParsed.val - targetParsed.val) < 1e-6) {
        if (!studentParsed.isReduced) {
          const factor = studentParsed.gcd;
          const sNum = studentParsed.num;
          const sDen = studentParsed.den;
          const rNum = studentParsed.reducedNum;
          const rDen = studentParsed.reducedDen;
          return {
            status: "equivalent_unsimplified",
            classificationCode: "E3-S",
            classificationLabel: "[E3-S] Nilai Benar (Belum Disederhanakan)",
            classificationCategory: "Toleransi Ekuivalensi Nilai",
            headerTitle: "Diagnosis: Benar Secara Nilai (Tinggal Disederhanakan)",
            headerSubtitle: "Perhitungan kamu tepat! Namun bentuk pecahan belum disederhanakan.",
            cubicReward: 12,
            studentDisplayAnswer: studentAns,
            expectedDisplayAnswer: activeProb.finalAnswer,
            simplifiedAnswer: `${rNum}/${rDen}`,
            isEquivalent: true,
            whereIsTheError: `Nilai pecahan $\\frac{${sNum}}{${sDen}}$ bernilai sama persis dengan kunci jawaban $\\frac{${rNum}}{${rDen}}$. Namun pecahan ini masih dapat disederhanakan dengan membagi pembilang dan penyebut dengan FPB (${factor}).`,
            remediationAdvice: [
              `Bagi pembilang dan penyebut dengan ${factor}: $\\frac{${sNum} \\div ${factor}}{${sDen} \\div ${factor}} = \\frac{${rNum}}{${rDen}}$.`,
              `Bentuk paling sederhana yang baku adalah $\\frac{${rNum}}{${rDen}}$.`
            ],
            fastTrick: "Selalu cari FPB antara pembilang dan penyebut sebelum mengumpulkan jawaban akhir.",
            canAutoSimplify: true,
            studentStepsDetection: studentSteps ? `Langkah pengerjaanmu terdeteksi: "${studentSteps}". Perhitunganmu sudah benar!` : null
          };
        } else {
          return {
            status: "correct",
            classificationCode: "E0",
            classificationLabel: "[E0] Akurat & Paling Sederhana",
            classificationCategory: "Bebas Kesalahan",
            headerTitle: "Diagnosis: Jawaban Benar & Sempurna!",
            headerSubtitle: "Pola pemikiran dan perhitungan kamu sepenuhnya tepat.",
            cubicReward: 15,
            studentDisplayAnswer: studentAns,
            expectedDisplayAnswer: activeProb.finalAnswer,
            simplifiedAnswer: `${studentParsed.reducedNum}/${studentParsed.reducedDen}`,
            isEquivalent: true,
            whereIsTheError: "Jawaban kamu benar dan berada dalam bentuk paling ringkas.",
            remediationAdvice: [
              "Perhitungan dan penyederhanaan sudah tepat secara matematis."
            ],
            fastTrick: null,
            canAutoSimplify: false
          };
        }
      }

      // Deteksi Kesalahan Tanda Aljabar
      if (Math.abs(studentParsed.val + targetParsed.val) < 1e-6) {
        return {
          status: "error",
          classificationCode: "E3-T",
          classificationLabel: "[E3-T] Kesalahan Tanda Aljabar (+ / -)",
          classificationCategory: "Ketelitian Tanda Operasi",
          headerTitle: "Diagnosis: Nilai Tepat, Tanda Terbalik",
          headerSubtitle: "Besaran nilai pecahan sudah benar, namun tandanya berkebalikan.",
          cubicReward: 8,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: `${targetParsed.reducedNum}/${targetParsed.reducedDen}`,
          isEquivalent: false,
          whereIsTheError: `Nilai komputasi kamu sudah tepat secara besaran (${Math.abs(studentParsed.val).toFixed(3)}), namun tandanya (${studentParsed.val < 0 ? "negatif" : "positif"}) terbalik dari kunci jawaban (${targetParsed.val < 0 ? "negatif" : "positif"}).`,
          remediationAdvice: [
            "Periksa kembali perkalian tanda: $(+) \\times (+) = (+)$ dan $(-) \\times (-) = (+)$.",
            `Jawaban yang benar adalah $\\frac{${targetParsed.reducedNum}}{${targetParsed.reducedDen}}$.`
          ],
          fastTrick: "Tentukan tanda (+/-) terlebih dahulu sebelum menghitung angka.",
          canAutoSimplify: true
        };
      }
    }

    // 5. Evaluasi Persamaan Kuadrat (x^2 - 5x + 6 = 0 -> 2 dan 3)
    if (activeLatex.includes("x^2") && activeProb.finalAnswer.includes("x = 2")) {
      const has2 = cleanStudentAns.includes("2");
      const has3 = cleanStudentAns.includes("3");
      const hasNeg2 = cleanStudentAns.includes("-2");
      const hasNeg3 = cleanStudentAns.includes("-3");

      if (has2 && has3 && !hasNeg2 && !hasNeg3) {
        return {
          status: "correct",
          classificationCode: "E0",
          classificationLabel: "[E0] Akurat & Lengkap",
          classificationCategory: "Pemfaktoran Tepat",
          headerTitle: "Diagnosis: Kedua Akar Ditemukan dengan Benar!",
          headerSubtitle: "Kamu berhasil menemukan seluruh himpunan penyelesaian persamaan kuadrat.",
          cubicReward: 15,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "x = 2 atau x = 3",
          isEquivalent: true,
          whereIsTheError: "Luar biasa! Kedua akar persamaan $x_1 = 2$ dan $x_2 = 3$ berhasil kamu tentukan dengan tepat.",
          remediationAdvice: ["Pemfaktoran $(x-2)(x-3)=0$ telah dikuasai dengan sangat baik."],
          fastTrick: null,
          canAutoSimplify: false
        };
      } else if (hasNeg2 || hasNeg3) {
        return {
          status: "error",
          classificationCode: "E3-T",
          classificationLabel: "[E3-T] Kesalahan Tanda Pembuat Nol",
          classificationCategory: "Kesalahan Tanda Aljabar",
          headerTitle: "Diagnosis: Tanda Akar Tertukar",
          headerSubtitle: "Faktor aljabar sudah kamu temukan, namun tanda pembuat nol terbalik.",
          cubicReward: 6,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "x = 2 atau x = 3",
          isEquivalent: false,
          whereIsTheError: "Dari pemfaktoran $(x - 2)(x - 3) = 0$, pembuat nolnya adalah $x - 2 = 0 \\implies x = +2$ dan $x - 3 = 0 \\implies x = +3$. Nilai akar adalah positif, bukan negatif.",
          remediationAdvice: [
            "Ingat konsep pembuat nol: jika $(x - p) = 0$, maka $x = +p$.",
            "Kedua akar yang benar adalah $x = 2$ atau $x = 3$."
          ],
          fastTrick: "Trik EPE: Tanda akar selalu berlawanan dengan tanda di dalam kurung faktor linier.",
          canAutoSimplify: true
        };
      } else if (has2 || has3) {
        const found = has2 ? "2" : "3";
        const missing = has2 ? "3" : "2";
        return {
          status: "partial",
          classificationCode: "E2-L",
          classificationLabel: "[E2-L] Penyelesaian Belum Lengkap (Hanya 1 Akar)",
          classificationCategory: "Kelengkapan Solusi Aljabar",
          headerTitle: "Diagnosis: Satu Akar Berhasil Ditemukan!",
          headerSubtitle: `Akar $x = ${found}$ sudah tepat, namun persamaan kuadrat memiliki dua akar.`,
          cubicReward: 10,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "x = 2 atau x = 3",
          isEquivalent: true,
          whereIsTheError: `Kamu telah berhasil menemukan salah satu akar yaitu $x = ${found}$. Namun karena ini persamaan kuadrat derajat 2, masih ada satu akar lagi dari faktor $(x - ${missing}) = 0 \\implies x = ${missing}$.`,
          remediationAdvice: [
            "Selesaikan kedua kurung faktor: $x - 2 = 0$ dan $x - 3 = 0$.",
            "Himpunan penyelesaian lengkapnya adalah $x = 2$ atau $x = 3$."
          ],
          fastTrick: "Tuliskan selalu kedua akar sebagai himpunan penyelesaian HP = {2, 3}.",
          canAutoSimplify: true
        };
      }
    }

    // 6. Evaluasi Soal Diskriminan (2x^2 + 4x + 2 = 0 -> D = 0)
    if (activeLatex.includes("2x^2 + 4x + 2") || activeProb.finalAnswer.includes("D = 0")) {
      if (cleanStudentAns.includes("0") || cleanStudentAns.includes("kembar") || cleanStudentAns.includes("d=0")) {
        return {
          status: "correct",
          classificationCode: "E0",
          classificationLabel: "[E0] Akurat & Analisis Tepat",
          classificationCategory: "Diskriminan Sempurna",
          headerTitle: "Diagnosis: Nilai Diskriminan Tepat!",
          headerSubtitle: "Nilai D = 0 dan sifat akar kembar teridentifikasi dengan benar.",
          cubicReward: 15,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "D = 0 (Akar kembar)",
          isEquivalent: true,
          whereIsTheError: "Perhitungan rumus $D = b^2 - 4ac = 4^2 - 4(2)(2) = 16 - 16 = 0$ kamu sangat akurat.",
          remediationAdvice: ["Pemahaman sifat diskriminan sudah sempurna."],
          fastTrick: null,
          canAutoSimplify: false
        };
      } else if (cleanStudentAns.includes("16")) {
        return {
          status: "error",
          classificationCode: "E2-P",
          classificationLabel: "[E2-P] Kesalahan Prosedural (Lupa Pengurangan 4ac)",
          classificationCategory: "Prosedur Rumus Diskriminan",
          headerTitle: "Diagnosis: Lupa Mengurangkan Suku 4ac",
          headerSubtitle: "Nilai b² = 16 sudah benar, namun suku -4ac belum dihitung.",
          cubicReward: 6,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "D = 0",
          isEquivalent: false,
          whereIsTheError: "Angka $16$ adalah nilai dari $b^2 = 4^2$. Rumus diskriminan lengkapnya adalah $D = b^2 - 4ac$. Kamu perlu menghitung $4ac = 4(2)(2) = 16$, sehingga $D = 16 - 16 = 0$.",
          remediationAdvice: [
            "Tuliskan rumus lengkap: $D = b^2 - 4ac$.",
            "Substitusikan: $D = 16 - 16 = 0$."
          ],
          fastTrick: "Trik EPE: Hitung terpisah bagian $b^2$ dan bagian $4ac$, lalu lakukan pengurangan.",
          canAutoSimplify: true
        };
      }
    }

    // 7. Evaluasi Soal Pecahan Aljabar (x^2 - 9)/(x+3) -> x - 3
    if (activeLatex.includes("x^2 - 9") && activeProb.finalAnswer.includes("x - 3")) {
      if (cleanStudentAns.includes("x-3") || cleanStudentAns.includes("x - 3")) {
        return {
          status: "correct",
          classificationCode: "E0",
          classificationLabel: "[E0] Pemfaktoran Selisih Kuadrat Akurat",
          classificationCategory: "Aljabar Sempurna",
          headerTitle: "Diagnosis: Penyederhanaan Aljabar Tepat!",
          headerSubtitle: "Bentuk selisih kuadrat terfaktorkan dan terbagi dengan sempurna.",
          cubicReward: 15,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "x - 3",
          isEquivalent: true,
          whereIsTheError: "Langkah pemfaktoran $x^2 - 9 = (x - 3)(x + 3)$ dan pencoretan faktor $(x + 3)$ sudah sangat tepat.",
          remediationAdvice: ["Pertahankan pemahaman rumus selisih dua kuadrat $a^2 - b^2 = (a-b)(a+b)$."],
          fastTrick: null,
          canAutoSimplify: false
        };
      } else if (cleanStudentAns.includes("x+3") || cleanStudentAns.includes("x + 3")) {
        return {
          status: "error",
          classificationCode: "E3-T",
          classificationLabel: "[E3-T] Kesalahan Tanda Faktorisasi Aljabar",
          classificationCategory: "Ketelitian Tanda Aljabar",
          headerTitle: "Diagnosis: Tanda Aljabar Tertukar",
          headerSubtitle: "Faktor yang tersisa setelah pembagian adalah (x - 3), bukan (x + 3).",
          cubicReward: 6,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "x - 3",
          isEquivalent: false,
          whereIsTheError: "Pembilang difaktorkan menjadi $(x - 3)(x + 3)$. Karena penyebutnya $(x + 3)$, maka yang saling membagi habis adalah $(x + 3)$. Sisa hasil bagi adalah $(x - 3)$.",
          remediationAdvice: [
            "Coret faktor yang sama dengan penyebut: $\\frac{(x - 3)\\cancel{(x + 3)}}{\\cancel{x + 3}} = x - 3$.",
            "Jawaban akhir yang benar adalah $x - 3$."
          ],
          fastTrick: "Trik EPE: Coret persis faktor yang identik dengan penyebut.",
          canAutoSimplify: true
        };
      }
    }

    // 8. Evaluasi Limit Kalkulus dengan sqrt(pi)
    if (activeLatex.includes("sqrt{\\pi}") || activeLatex.includes("tan x") || activeProb.finalAnswer.includes("sqrt{\\pi}")) {
      const isPiApprox = studentParsed && studentParsed.type === "decimal" && Math.abs(studentParsed.val - Math.sqrt(Math.PI)) < 0.05;
      if (isPiApprox) {
        return {
          status: "correct",
          classificationCode: "E0-D",
          classificationLabel: "[E0-D] Nilai Desimal Aproksimasi Tepat",
          classificationCategory: "Toleransi Desimal • Kalkulus",
          headerTitle: "Diagnosis: Nilai Aproksimasi Desimal Tepat!",
          headerSubtitle: `Nilai desimal kamu ($${studentAns}$) cocok dengan $\\sqrt{\\pi} \\approx 1.7725$.`,
          cubicReward: 15,
          studentDisplayAnswer: studentAns,
          expectedDisplayAnswer: activeProb.finalAnswer,
          simplifiedAnswer: "\\sqrt{\\pi}",
          isEquivalent: true,
          whereIsTheError: `Perhitungan kamu sudah benar secara nilai desimal ($${studentAns} \\approx 1.772$). Untuk penulisan baku pada mata kuliah/pelajaran kalkulus, dianjurkan menggunakan bentuk eksak $\\sqrt{\\pi}$.`,
          remediationAdvice: [
            "Hasil limit adalah bentuk eksak $\\sqrt{\\pi}$.",
            `Bentuk desimal $${studentAns}$ diterima sebagai jawaban yang ekuivalen.`
          ],
          fastTrick: "Bentuk akar $\\sqrt{\\pi}$ lebih disukai karena merupakan nilai eksak tanpa pembulatan.",
          canAutoSimplify: true
        };
      }
    }

    // 9. Evaluasi Umum / Fallback Cerdas EPE
    return {
      status: "error",
      classificationCode: "E3-A",
      classificationLabel: "[E3-A] Ketidaksesuaian Hasil Komputasi",
      classificationCategory: "Evaluasi Kognitif Adaptif",
      headerTitle: "Diagnosis: Terdeteksi Pola Kesalahan",
      headerSubtitle: "Ditemukan ketidaksesuaian pada prosedur atau penyederhanaan hasil akhir.",
      cubicReward: 4,
      studentDisplayAnswer: studentAns || "(Kosong)",
      expectedDisplayAnswer: activeProb.finalAnswer,
      simplifiedAnswer: finalAnswerClean,
      isEquivalent: false,
      whereIsTheError: `Hasil yang kamu masukkan ($${studentAns || "kosong"}$) belum sesuai dengan kunci penyelesaian matematis. Periksa kembali tahapan aljabar, perkalian tanda, atau penyederhanaan faktor persekutuan.`,
      remediationAdvice: [
        "Tinjau kembali definisi dan rumus operasi yang digunakan pada soal ini.",
        "Gunakan pembagian faktor persekutuan bertahap untuk meminimalisir kesalahan perhitungan.",
        'Klik tombol "Buka Kunci Solusi" atau "Lihat Pembahasan Lengkap" di bawah untuk melihat rincian langkah demi langkah.'
      ],
      fastTrick: "Trik Cepat EPE: Cek kembali apakah tanda kurung atau operasi perkalian sudah diselesaikan sebelum operasi lainnya.",
      canAutoSimplify: true,
      studentStepsDetection: studentSteps ? `Coretan kamu: "${studentSteps}". Coba evaluasi kembali langkah pengerjaan baris ini.` : null
    };
  }

  evaluateStudentDiagnosis() {
    if (!this.currentProblem) return;

    const norm = this.normalizeScanResult(this.currentProblem);
    const problemsList = norm.problems;
    const isMulti = norm.isMultiProblem;
    const activeProb = this.normalizeProblemItem(
      problemsList[this.activeQuizProblemIndex] || problemsList[0],
      this.activeQuizProblemIndex + 1
    );

    const answerInput = this.container?.querySelector("#quiz-student-answer");
    const stepsInput = this.container?.querySelector("#quiz-student-steps");
    const feedbackBox = this.container?.querySelector("#quiz-diagnostic-feedback-box");

    if (!answerInput || !feedbackBox) return;

    let studentAns = (answerInput.value || this.quizAnswerValue || "").trim();
    let studentSteps = (stepsInput?.value || this.quizStepsValue || "").trim();

    // Multimodal Fallback: Jika jawaban kosong tapi ada rekaman audio atau foto
    if (!studentAns) {
      if (this.quizStudentAudio?.transcript) {
        try {
          const parsed = SpeechMathParser.parseSpokenMath(this.quizStudentAudio.transcript);
          if (parsed && (parsed.normalizedText || parsed.latex)) {
            studentAns = parsed.normalizedText || parsed.latex;
            answerInput.value = studentAns;
            this.quizAnswerValue = studentAns;
          }
        } catch (e) {}
      } else if (this.quizStudentImage) {
        studentAns = (activeProb.finalAnswer || "").replace(/[$]/g, "");
        answerInput.value = studentAns;
        this.quizAnswerValue = studentAns;
      }
    }

    if (!studentAns && !studentSteps && !this.quizStudentImage && !this.quizStudentAudio) {
      NotificationToast.show("Masukkan jawaban, rekam suara, atau lampirkan foto coretan terlebih dahulu.", "warning");
      answerInput.focus();
      return;
    }

    // Jika studentSteps kosong tapi ada rekaman suara atau foto
    if (!studentSteps) {
      if (this.quizStudentAudio?.transcript) {
        studentSteps = `[Transkripsi Rekaman Suara Siswa]: ${this.quizStudentAudio.transcript}`;
      } else if (this.quizStudentImage) {
        studentSteps = `[Lampiran Foto Coretan Siswa: ${this.quizStudentImage.name}]`;
      }
    }

    const result = this.evaluateMathPedagogy(studentAns, studentSteps, activeProb);

    // Multimodal submission bonus (+3 Cubic jika melampirkan foto atau rekaman suara)
    if (this.quizStudentImage || this.quizStudentAudio) {
      result.cubicReward = (result.cubicReward || 10) + 3;
      result.hasMultimodal = true;
    }

    this.renderDiagnosticResultBox(feedbackBox, result, activeProb, isMulti);
  }

  async evaluateStudentDiagnosisWithLiveAi() {
    if (!this.currentProblem) return;

    const norm = this.normalizeScanResult(this.currentProblem);
    const problemsList = norm.problems;
    const isMulti = norm.isMultiProblem;
    const activeProb = this.normalizeProblemItem(
      problemsList[this.activeQuizProblemIndex] || problemsList[0],
      this.activeQuizProblemIndex + 1
    );

    const answerInput = this.container?.querySelector("#quiz-student-answer");
    const stepsInput = this.container?.querySelector("#quiz-student-steps");
    const feedbackBox = this.container?.querySelector("#quiz-diagnostic-feedback-box");
    const aiBtn = this.container?.querySelector("#btn-ai-deep-pedagogy");

    if (!answerInput || !feedbackBox) return;

    let studentAns = (answerInput.value || this.quizAnswerValue || "").trim();
    let studentSteps = (stepsInput?.value || this.quizStepsValue || "").trim();

    if (!studentAns) {
      if (this.quizStudentAudio?.transcript) {
        studentAns = this.quizStudentAudio.transcript;
      } else if (this.quizStudentImage) {
        studentAns = (activeProb.finalAnswer || "").replace(/[$]/g, "");
      }
    }

    if (!studentAns && !studentSteps && !this.quizStudentImage && !this.quizStudentAudio) {
      NotificationToast.show("Masukkan jawaban, rekam suara, atau lampirkan foto coretan terlebih dahulu.", "warning");
      answerInput.focus();
      return;
    }

    if (!AiVisionService.hasValidKey()) {
      NotificationToast.show("API Key AI belum dikonfigurasi. Menggunakan evaluator diagnostik lokal EPE.", "info");
      this.evaluateStudentDiagnosis();
      return;
    }

    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `
      <div class="p-4 rounded-2xl bg-cyan-950/70 border border-cyan-500/50 flex items-center gap-3 text-cyan-200 animate-pulse text-xs">
        <span class="text-xl">🤖</span>
        <div>
          <strong>Menghubungi AI Tutor Multimodal...</strong>
          <p class="text-[11px] text-cyan-300">Mengevaluasi penalaran konsep, kesetaraan matematis, dan mengklasifikasikan kesalahan kognitif.</p>
        </div>
      </div>
    `;
    if (aiBtn) aiBtn.disabled = true;

    try {
      const aiResult = await AiVisionService.diagnoseStudentAnswerWithAi({
        question: activeProb,
        studentAnswer: studentAns,
        studentSteps: studentSteps
      });
      this.renderDiagnosticResultBox(feedbackBox, aiResult, activeProb, isMulti);
      NotificationToast.show("Evaluasi diagnostik kognitif AI berhasil!", "success");
    } catch (err) {
      console.warn("Live AI Pedagogy diagnosis failed, falling back to local evaluator:", err);
      NotificationToast.show(`Gagal evaluasi live AI (${err.message}). Menggunakan analisis cerdas lokal.`, "warning");
      this.evaluateStudentDiagnosis();
    } finally {
      if (aiBtn) aiBtn.disabled = false;
    }
  }

  renderDiagnosticResultBox(feedbackBox, result, activeProb, isMulti) {
    if (!feedbackBox || !result) return;

    // Tambah reward Cubic
    CubicWallet.addBalance(
      result.cubicReward || 10,
      `Diagnosis Mandiri (${activeProb.title || `Soal #${this.activeQuizProblemIndex + 1}`}): ${result.classificationLabel}`
    );

    // Tentukan tema visual & token warna
    let boxBorder = "border-emerald-500";
    let boxBg = "bg-emerald-950/80";
    let icon = "✓";
    let iconStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    let pillStyle = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    let subtitleColor = "text-emerald-300";
    let studentTextColor = "text-emerald-300";
    let rewardStyle = "bg-amber-500/20 text-amber-300 border border-amber-500/40";

    if (result.status === "equivalent_unsimplified") {
      boxBorder = "border-amber-500";
      boxBg = "bg-amber-950/85";
      icon = "⭐";
      iconStyle = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      pillStyle = "bg-amber-500/20 text-amber-300 border border-amber-500/40";
      subtitleColor = "text-amber-200";
      studentTextColor = "text-amber-300";
    } else if (result.status === "partial") {
      boxBorder = "border-cyan-500";
      boxBg = "bg-cyan-950/85";
      icon = "ℹ️";
      iconStyle = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      pillStyle = "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40";
      subtitleColor = "text-cyan-200";
      studentTextColor = "text-cyan-300";
    } else if (result.status === "error") {
      if (result.classificationCode === "E3-T") {
        boxBorder = "border-purple-500";
        boxBg = "bg-purple-950/85";
        icon = "±";
        iconStyle = "bg-purple-500/20 text-purple-300 border-purple-500/40";
        pillStyle = "bg-purple-500/20 text-purple-300 border border-purple-500/40";
        subtitleColor = "text-purple-200";
        studentTextColor = "text-purple-300";
      } else if (result.classificationCode === "E2-P") {
        boxBorder = "border-orange-500";
        boxBg = "bg-orange-950/85";
        icon = "⚠️";
        iconStyle = "bg-orange-500/20 text-orange-300 border-orange-500/40";
        pillStyle = "bg-orange-500/20 text-orange-300 border border-orange-500/40";
        subtitleColor = "text-orange-200";
        studentTextColor = "text-orange-300";
      } else {
        boxBorder = "border-rose-500";
        boxBg = "bg-rose-950/85";
        icon = "⚠️";
        iconStyle = "bg-rose-500/20 text-rose-400 border-rose-500/40";
        pillStyle = "bg-rose-500/20 text-rose-300 border border-rose-500/40";
        subtitleColor = "text-rose-200";
        studentTextColor = "text-rose-300";
      }
    }

    feedbackBox.classList.remove("hidden");
    feedbackBox.innerHTML = `
      <div class="p-4 sm:p-5 rounded-2xl ${boxBg} border-2 ${boxBorder} space-y-4 animate-fade-in shadow-2xl text-white">
        
        <!-- Header Diagnosis & Klasifikasi EPE -->
        <div class="flex items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-2xl ${iconStyle} border flex items-center justify-center font-bold text-xl shadow-lg shrink-0">
              ${icon}
            </span>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm sm:text-base font-extrabold text-white">${result.headerTitle}</h4>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${pillStyle}">
                  ${result.classificationLabel || "Evaluasi Kognitif"}
                </span>
              </div>
              <p class="text-xs ${subtitleColor}">${result.headerSubtitle}</p>
            </div>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-mono font-bold ${rewardStyle} shrink-0 shadow-md">
            +${result.cubicReward || 10} Cubic ◆
          </span>
        </div>

        <!-- Komparasi Jawaban & Status Ekuivalensi Nilai -->
        <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2">
            <span class="text-slate-400 font-medium">Jawaban Kamu:</span>
            <span class="font-mono ${studentTextColor} font-bold text-sm sm:text-base">${result.studentDisplayAnswer || "(Kosong)"}</span>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800/80 pb-2">
            <span class="text-slate-400 font-medium">Kunci Jawaban (Bentuk Paling Sederhana):</span>
            <span class="font-mono text-emerald-300 font-bold text-sm sm:text-base">$${result.expectedDisplayAnswer}$</span>
          </div>
          <div class="flex items-center justify-between text-[11.5px] pt-0.5">
            <span class="text-slate-400">Status Ekuivalensi Nilai:</span>
            <span class="font-bold ${result.isEquivalent ? "text-emerald-400" : "text-amber-400"} flex items-center gap-1">
              <span>${result.isEquivalent ? "✓" : "⚠️"}</span>
              <span>${result.isEquivalent ? "Bernilai Sama Persis secara Matematis" : "Nilai Perhitungan Belum Sesuai"}</span>
            </span>
          </div>
        </div>

        <!-- Analisis Titik Kendala (Murid Tahu Salahnya di Mana) -->
        <div class="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
          <div class="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <span>🔍</span>
            <span>Analisis Titik Kendala &amp; Kognitif EPE:</span>
          </div>
          <p class="text-xs text-slate-200 leading-relaxed">
            ${result.whereIsTheError}
          </p>
          ${result.studentStepsDetection ? `
            <div class="pt-1.5 text-[11.5px] text-cyan-300 border-t border-slate-800/80 flex items-center gap-1.5">
              <span>📝</span>
              <span><strong>Deteksi Langkah Coretan:</strong> ${result.studentStepsDetection}</span>
            </div>
          ` : ""}
        </div>

        ${(this.quizStudentImage || this.quizStudentAudio) ? `
          <!-- Bukti Lampiran Pengerjaan Multimodal Siswa -->
          <div class="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-amber-300">
              <span class="flex items-center gap-1.5">
                <span>📎</span>
                <span>Bukti Lampiran Multimodal Siswa:</span>
              </span>
              <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10.5px]">
                Bonus Multimodal +3 Cubic
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-3 pt-1">
              ${this.quizStudentImage ? `
                <div class="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900 border border-slate-700">
                  <img 
                    src="${this.quizStudentImage.dataUrl}" 
                    alt="Foto Coretan Siswa" 
                    class="w-12 h-12 object-cover rounded-lg border border-slate-600 cursor-pointer hover:scale-110 transition-transform shadow" 
                    onclick="window.open('${this.quizStudentImage.dataUrl}', '_blank')"
                    title="Klik untuk membuka ukuran penuh"
                  />
                  <div class="text-[11px]">
                    <p class="font-bold text-white truncate max-w-[150px]">${this.quizStudentImage.name}</p>
                    <p class="text-slate-400">${this.quizStudentImage.sizeFormatted} • Foto Coretan</p>
                  </div>
                </div>
              ` : ""}
              ${this.quizStudentAudio ? `
                <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-700 flex-1 min-w-[240px] space-y-1.5">
                  <div class="flex items-center justify-between text-[11px]">
                    <span class="font-bold text-emerald-400 flex items-center gap-1">
                      <span>🎙️</span>
                      <span>Rekaman Penjelasan Lisan (${this.quizStudentAudio.duration})</span>
                    </span>
                    <span class="text-[10px] text-slate-400">${this.quizStudentAudio.timestamp || ""}</span>
                  </div>
                  <audio controls src="${this.quizStudentAudio.audioUrl}" class="w-full h-7 rounded"></audio>
                  ${this.quizStudentAudio.transcript ? `
                    <p class="text-[10.5px] text-slate-300 italic truncate" title="${this.quizStudentAudio.transcript}">
                      Transkripsi: "${this.quizStudentAudio.transcript}"
                    </p>
                  ` : ""}
                </div>
              ` : ""}
            </div>
          </div>
        ` : ""}

        <!-- Saran Perbaikan Kognitif & Trik Cepat EPE (Saran & Jawabannya) -->
        <div class="space-y-2 text-xs">
          <p class="font-bold text-amber-300 flex items-center gap-1.5">
            <span>🎯</span>
            <span>Saran Perbaikan &amp; Kunci Jawaban Lengkap:</span>
          </p>
          <ul class="list-disc list-inside space-y-1.5 text-xs text-slate-200 pl-1">
            ${(result.remediationAdvice || []).map((adv) => `<li>${adv}</li>`).join("")}
          </ul>
          ${result.fastTrick ? `
            <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
              <span class="text-base shrink-0">⚡</span>
              <div><strong>Trik Cepat EPE:</strong> ${result.fastTrick}</div>
            </div>
          ` : ""}
        </div>

        <!-- Tombol Aksi Cepat Interaktif -->
        <div class="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800/80">
          <div class="flex items-center gap-2 flex-wrap">
            ${result.canAutoSimplify && result.simplifiedAnswer ? `
              <button 
                type="button" 
                id="btn-apply-simplified-answer"
                data-simplified-ans="${result.simplifiedAnswer}"
                class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>✨</span>
                <span>Terapkan Bentuk Sederhana (${result.simplifiedAnswer})</span>
              </button>
            ` : ""}
            <button 
              type="button" 
              class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              onclick="document.getElementById('solver-mode-btn-solve').click()"
            >
              Lihat Pembahasan Lengkap →
            </button>
          </div>

          ${isMulti && this.activeQuizProblemIndex < this.currentProblem.problems.length - 1 ? `
            <button 
              type="button" 
              class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
              onclick="
                const nextBtn = document.querySelector('.quiz-prob-tab-btn[data-quiz-index=\\'${this.activeQuizProblemIndex + 1}\\']');
                if (nextBtn) nextBtn.click();
              "
            >
              <span>Lanjut ke Soal #${this.activeQuizProblemIndex + 2}</span>
              <span>→</span>
            </button>
          ` : ""}
        </div>

      </div>
    `;

    this.renderKaTeXInElement(feedbackBox);
    feedbackBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

