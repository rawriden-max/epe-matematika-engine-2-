/**
 * assessmentForms.js - Bank Soal Paralel Pre-Test & Post-Test EPE V2.2
 * 
 * INSTRUMEN PENGUKURAN RISET:
 * - Form A = Pre-Test (Baseline Measurement)
 * - Form B = Post-Test (Post-Intervention Outcome Measurement)
 * 
 * Karakteristik Paralel:
 * - Jumlah butir soal: 12 butir pada masing-masing form
 * - Cakupan materi: Domain D1 s.d. D6 (2 butir per domain)
 * - Pemetaan kompetensi paralel: C01 s.d. C12 (1:1 equivalence)
 * - Opsi distractor terpetakan ke potensi kategori error kognitif (E1-E4, E0)
 * 
 * CATATAN RISET METODOLOGIS:
 * Form A dan Form B dirancang secara konten-paralel (content-parallel blueprint)
 * untuk meminimalkan recall bias tanpa memanipulasi klaim kausalitas otomatis.
 */

export const PARALLEL_COMPETENCIES = {
  C01: { id: "C01", domain: "D1", name: "Bentuk Baku Persamaan Kuadrat", desc: "Mengidentifikasi persamaan kuadrat derajat dua ax² + bx + c = 0 (a ≠ 0)" },
  C02: { id: "C02", domain: "D1", name: "Koefisien Bertanda", desc: "Menentukan nilai koefisien a, b, dan c dengan memperhatikan tanda negatif" },
  C03: { id: "C03", domain: "D2", name: "Faktorisasi Aljabar (a = 1)", desc: "Menentukan akar melalui faktorisasi (x - p)(x - q) = 0" },
  C04: { id: "C04", domain: "D2", name: "Faktorisasi Aljabar (a > 1)", desc: "Faktorisasi persamaan kuadrat dengan koefisien a lebih dari satu" },
  C05: { id: "C05", domain: "D3", name: "Rumus Kuadratik (Substitusi Minus)", desc: "Penerapan rumus ABC dengan kehati-hatian pada substitusi -b" },
  C06: { id: "C06", domain: "D3", name: "Rumus Kuadratik (Akar Rasional)", desc: "Menghitung nilai akar kuadratik dari diskriminan kuadrat sempurna" },
  C07: { id: "C07", domain: "D4", name: "Perhitungan Diskriminan", desc: "Menghitung D = b² - 4ac dengan koefisien bertanda" },
  C08: { id: "C08", domain: "D4", name: "Karakteristik Akar (Kriteria D)", desc: "Menentukan sifat akar real berlainan, kembar, atau tidak real berdasarkan D" },
  C09: { id: "C09", domain: "D5", name: "Teorema Vieta (Jumlah & Kali Akar)", desc: "Menghitung x₁ + x₂ = -b/a dan x₁ · x₂ = c/a" },
  C10: { id: "C10", domain: "D5", name: "Menyusun Persamaan Kuadrat Baru", desc: "Membentuk persamaan x² - (x₁ + x₂)x + (x₁ · x₂) = 0 dari akar-akar yang diketahui" },
  C11: { id: "C11", domain: "D6", name: "Pemodelan Masalah Nyata", desc: "Membuat model persamaan kuadrat dari situasi kontekstual geometri/luas" },
  C12: { id: "C12", domain: "D6", name: "Interpretasi Solusi Fisis", desc: "Menafsirkan akar secara fisis dan menolak solusi yang tidak bermakna matematis fisis" }
};

export const FORM_A_PRETEST = [
  {
    id: "PRE_Q01",
    number: 1,
    competencyId: "C01",
    domain: "D1",
    domainName: "Konsep Dasar",
    title: "Bentuk Baku Persamaan Kuadrat (Pre-Test)",
    prompt: "Manakah di antara persamaan berikut yang merupakan persamaan kuadrat satu variabel berderajat dua?",
    latex: "2x^2 - 5x + 3 = 0",
    options: [
      { key: "A", text: "3x + 7 = 0", latex: "3x + 7 = 0", errorType: "E1" },
      { key: "B", text: "2x² - 5x + 3 = 0", latex: "2x^2 - 5x + 3 = 0", errorType: "E0" },
      { key: "C", text: "x³ - 2x² + x = 0", latex: "x^3 - 2x^2 + x = 0", errorType: "E1" },
      { key: "D", text: "3/x² + 2x = 1", latex: "\\frac{3}{x^2} + 2x = 1", errorType: "E2" }
    ],
    correctAnswer: "B"
  },
  {
    id: "PRE_Q02",
    number: 2,
    competencyId: "C02",
    domain: "D1",
    domainName: "Konsep Dasar",
    title: "Identifikasi Koefisien Bertanda (Pre-Test)",
    prompt: "Tentukan nilai koefisien a, b, dan c dari persamaan kuadrat: 4x² - 9x - 5 = 0",
    latex: "4x^2 - 9x - 5 = 0",
    options: [
      { key: "A", text: "a = 4, b = 9, c = 5", latex: "a = 4,\\ b = 9,\\ c = 5", errorType: "E1" },
      { key: "B", text: "a = 4, b = -9, c = -5", latex: "a = 4,\\ b = -9,\\ c = -5", errorType: "E0" },
      { key: "C", text: "a = 4, b = -9, c = 5", latex: "a = 4,\\ b = -9,\\ c = 5", errorType: "E3" },
      { key: "D", text: "a = -4, b = 9, c = -5", latex: "a = -4,\\ b = 9,\\ c = -5", errorType: "E2" }
    ],
    correctAnswer: "B"
  },
  {
    id: "PRE_Q03",
    number: 3,
    competencyId: "C03",
    domain: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Persamaan Kuadrat a = 1 (Pre-Test)",
    prompt: "Himpunan penyelesaian dari persamaan kuadrat x² - 7x + 10 = 0 adalah...",
    latex: "x^2 - 7x + 10 = 0",
    options: [
      { key: "A", text: "x = 2 atau x = 5", latex: "x = 2 \\text{ atau } x = 5", errorType: "E0" },
      { key: "B", text: "x = -2 atau x = -5", latex: "x = -2 \\text{ atau } x = -5", errorType: "E2" },
      { key: "C", text: "x = 1 atau x = 10", latex: "x = 1 \\text{ atau } x = 10", errorType: "E1" },
      { key: "D", text: "x = -1 atau x = -10", latex: "x = -1 \\text{ atau } x = -10", errorType: "E3" }
    ],
    correctAnswer: "A"
  },
  {
    id: "PRE_Q04",
    number: 4,
    competencyId: "C04",
    domain: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Persamaan Kuadrat a > 1 (Pre-Test)",
    prompt: "Akar-akar dari persamaan kuadrat 2x² + 5x - 3 = 0 adalah...",
    latex: "2x^2 + 5x - 3 = 0",
    options: [
      { key: "A", text: "x = -1/2 atau x = 3", latex: "x = -\\frac{1}{2} \\text{ atau } x = 3", errorType: "E2" },
      { key: "B", text: "x = 1 atau x = -3", latex: "x = 1 \\text{ atau } x = -3", errorType: "E3" },
      { key: "C", text: "x = 1/2 atau x = -3", latex: "x = \\frac{1}{2} \\text{ atau } x = -3", errorType: "E0" },
      { key: "D", text: "x = 2 atau x = -3/2", latex: "x = 2 \\text{ atau } x = -\\frac{3}{2}", errorType: "E1" }
    ],
    correctAnswer: "C"
  },
  {
    id: "PRE_Q05",
    number: 5,
    competencyId: "C05",
    domain: "D3",
    domainName: "Rumus ABC",
    title: "Penerapan Rumus Kuadratik (Pre-Test)",
    prompt: "Dengan rumus kuadratik (ABC), penyelesaian dari persamaan x² - 4x + 1 = 0 adalah...",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    options: [
      { key: "A", text: "x = 2 ± √3", latex: "x = 2 \\pm \\sqrt{3}", errorType: "E0" },
      { key: "B", text: "x = -2 ± √3", latex: "x = -2 \\pm \\sqrt{3}", errorType: "E2" },
      { key: "C", text: "x = 4 ± √12", latex: "x = 4 \\pm \\sqrt{12}", errorType: "E1" },
      { key: "D", text: "x = 2 ± √5", latex: "x = 2 \\pm \\sqrt{5}", errorType: "E3" }
    ],
    correctAnswer: "A"
  },
  {
    id: "PRE_Q06",
    number: 6,
    competencyId: "C06",
    domain: "D3",
    domainName: "Rumus ABC",
    title: "Penyelesaian Akar Rasional Rumus Kuadratik (Pre-Test)",
    prompt: "Nilai akar-akar dari x² - 6x + 8 = 0 menggunakan rumus kuadratik adalah...",
    latex: "x^2 - 6x + 8 = 0",
    options: [
      { key: "A", text: "x = -2 atau x = -4", latex: "x = -2 \\text{ atau } x = -4", errorType: "E2" },
      { key: "B", text: "x = 2 atau x = 4", latex: "x = 2 \\text{ atau } x = 4", errorType: "E0" },
      { key: "C", text: "x = 1 atau x = 8", latex: "x = 1 \\text{ atau } x = 8", errorType: "E1" },
      { key: "D", text: "x = 3 atau x = 4", latex: "x = 3 \\text{ atau } x = 4", errorType: "E3" }
    ],
    correctAnswer: "B"
  },
  {
    id: "PRE_Q07",
    number: 7,
    competencyId: "C07",
    domain: "D4",
    domainName: "Diskriminan",
    title: "Perhitungan Nilai Diskriminan (Pre-Test)",
    prompt: "Nilai diskriminan (D = b² - 4ac) dari persamaan 2x² - 4x + 5 = 0 adalah...",
    latex: "D = b^2 - 4ac",
    options: [
      { key: "A", text: "D = 56", latex: "D = 56", errorType: "E3" },
      { key: "B", text: "D = 24", latex: "D = 24", errorType: "E2" },
      { key: "C", text: "D = -24", latex: "D = -24", errorType: "E0" },
      { key: "D", text: "D = -56", latex: "D = -56", errorType: "E1" }
    ],
    correctAnswer: "C"
  },
  {
    id: "PRE_Q08",
    number: 8,
    competencyId: "C08",
    domain: "D4",
    domainName: "Diskriminan",
    title: "Karakteristik Jenis Akar (Pre-Test)",
    prompt: "Persamaan kuadrat x² - 6x + 9 = 0 memiliki jenis akar...",
    latex: "x^2 - 6x + 9 = 0",
    options: [
      { key: "A", text: "Dua akar real berbeda (D > 0)", latex: "D > 0", errorType: "E1" },
      { key: "B", text: "Dua akar real kembar (D = 0)", latex: "D = 0", errorType: "E0" },
      { key: "C", text: "Akar imajiner / tidak real (D < 0)", latex: "D < 0", errorType: "E2" },
      { key: "D", text: "Hanya memiliki satu nilai x bernilai nol", latex: "x = 0", errorType: "E3" }
    ],
    correctAnswer: "B"
  },
  {
    id: "PRE_Q09",
    number: 9,
    competencyId: "C09",
    domain: "D5",
    domainName: "Hubungan Akar",
    title: "Teorema Vieta (Pre-Test)",
    prompt: "Jika x₁ dan x₂ adalah akar-akar dari 2x² - 6x + 4 = 0, maka nilai dari x₁ + x₂ dan x₁ · x₂ berturut-turut adalah...",
    latex: "x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}",
    options: [
      { key: "A", text: "3 dan 2", latex: "x_1 + x_2 = 3,\\ x_1 \\cdot x_2 = 2", errorType: "E0" },
      { key: "B", text: "-3 dan 2", latex: "x_1 + x_2 = -3,\\ x_1 \\cdot x_2 = 2", errorType: "E2" },
      { key: "C", text: "6 dan 4", latex: "x_1 + x_2 = 6,\\ x_1 \\cdot x_2 = 4", errorType: "E1" },
      { key: "D", text: "-6 dan -4", latex: "x_1 + x_2 = -6,\\ x_1 \\cdot x_2 = -4", errorType: "E3" }
    ],
    correctAnswer: "A"
  },
  {
    id: "PRE_Q10",
    number: 10,
    competencyId: "C10",
    domain: "D5",
    domainName: "Hubungan Akar",
    title: "Menyusun Persamaan Kuadrat Baru (Pre-Test)",
    prompt: "Persamaan kuadrat yang memiliki akar-akar x₁ = 3 dan x₂ = -4 adalah...",
    latex: "x^2 - (x_1 + x_2)x + (x_1 \\cdot x_2) = 0",
    options: [
      { key: "A", text: "x² - x - 12 = 0", latex: "x^2 - x - 12 = 0", errorType: "E2" },
      { key: "B", text: "x² + x - 12 = 0", latex: "x^2 + x - 12 = 0", errorType: "E0" },
      { key: "C", text: "x² - 7x + 12 = 0", latex: "x^2 - 7x + 12 = 0", errorType: "E3" },
      { key: "D", text: "x² + x + 12 = 0", latex: "x^2 + x + 12 = 0", errorType: "E1" }
    ],
    correctAnswer: "B"
  },
  {
    id: "PRE_Q11",
    number: 11,
    competencyId: "C11",
    domain: "D6",
    domainName: "Penerapan",
    title: "Pemodelan Geometri Luas Persegi Panjang (Pre-Test)",
    prompt: "Sebidang tanah pekarangan berbentuk persegi panjang memiliki keliling 28 meter dan luas 48 meter persegi. Model persamaan kuadrat untuk mencari panjang x adalah...",
    latex: "x(14 - x) = 48 \\implies x^2 - 14x + 48 = 0",
    options: [
      { key: "A", text: "x² - 28x + 48 = 0", latex: "x^2 - 28x + 48 = 0", errorType: "E1" },
      { key: "B", text: "x² - 14x + 48 = 0", latex: "x^2 - 14x + 48 = 0", errorType: "E0" },
      { key: "C", text: "x² + 14x - 48 = 0", latex: "x^2 + 14x - 48 = 0", errorType: "E2" },
      { key: "D", text: "2x² - 28x + 48 = 0", latex: "2x^2 - 28x + 48 = 0", errorType: "E3" }
    ],
    correctAnswer: "B"
  },
  {
    id: "PRE_Q12",
    number: 12,
    competencyId: "C12",
    domain: "D6",
    domainName: "Penerapan",
    title: "Interpretasi Solusi Kontekstual Fisik (Pre-Test)",
    prompt: "Ketinggian bola yang dilempar ke atas dimodelkan oleh h(t) = 20t - 5t² (dalam meter). Kapan bola tersebut menyentuh tanah kembali (h = 0) selain saat awal t = 0?",
    latex: "20t - 5t^2 = 0",
    options: [
      { key: "A", text: "t = 2 detik", latex: "t = 2 \\text{ detik}", errorType: "E3" },
      { key: "B", text: "t = 4 detik", latex: "t = 4 \\text{ detik}", errorType: "E0" },
      { key: "C", text: "t = -4 detik", latex: "t = -4 \\text{ detik}", errorType: "E4" },
      { key: "D", text: "t = 5 detik", latex: "t = 5 \\text{ detik}", errorType: "E1" }
    ],
    correctAnswer: "B"
  }
];

export const FORM_B_POSTTEST = [
  {
    id: "POST_Q01",
    number: 1,
    competencyId: "C01",
    domain: "D1",
    domainName: "Konsep Dasar",
    title: "Bentuk Baku Persamaan Kuadrat (Post-Test)",
    prompt: "Manakah di antara persamaan berikut yang merupakan persamaan kuadrat satu variabel berderajat dua?",
    latex: "3x^2 + 4x - 7 = 0",
    options: [
      { key: "A", text: "4x - 9 = 0", latex: "4x - 9 = 0", errorType: "E1" },
      { key: "B", text: "2x³ + 3x² - 1 = 0", latex: "2x^3 + 3x^2 - 1 = 0", errorType: "E1" },
      { key: "C", text: "3x² + 4x - 7 = 0", latex: "3x^2 + 4x - 7 = 0", errorType: "E0" },
      { key: "D", text: "5/x² + 3x = 2", latex: "\\frac{5}{x^2} + 3x = 2", errorType: "E2" }
    ],
    correctAnswer: "C"
  },
  {
    id: "POST_Q02",
    number: 2,
    competencyId: "C02",
    domain: "D1",
    domainName: "Konsep Dasar",
    title: "Identifikasi Koefisien Bertanda (Post-Test)",
    prompt: "Tentukan nilai koefisien a, b, dan c dari persamaan kuadrat: 5x² - 8x - 12 = 0",
    latex: "5x^2 - 8x - 12 = 0",
    options: [
      { key: "A", text: "a = 5, b = -8, c = -12", latex: "a = 5,\\ b = -8,\\ c = -12", errorType: "E0" },
      { key: "B", text: "a = 5, b = 8, c = 12", latex: "a = 5,\\ b = 8,\\ c = 12", errorType: "E1" },
      { key: "C", text: "a = 5, b = -8, c = 12", latex: "a = 5,\\ b = -8,\\ c = 12", errorType: "E3" },
      { key: "D", text: "a = -5, b = 8, c = -12", latex: "a = -5,\\ b = 8,\\ c = -12", errorType: "E2" }
    ],
    correctAnswer: "A"
  },
  {
    id: "POST_Q03",
    number: 3,
    competencyId: "C03",
    domain: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Persamaan Kuadrat a = 1 (Post-Test)",
    prompt: "Himpunan penyelesaian dari persamaan kuadrat x² - 8x + 12 = 0 adalah...",
    latex: "x^2 - 8x + 12 = 0",
    options: [
      { key: "A", text: "x = -2 atau x = -6", latex: "x = -2 \\text{ atau } x = -6", errorType: "E2" },
      { key: "B", text: "x = 2 atau x = 6", latex: "x = 2 \\text{ atau } x = 6", errorType: "E0" },
      { key: "C", text: "x = 1 atau x = 12", latex: "x = 1 \\text{ atau } x = 12", errorType: "E1" },
      { key: "D", text: "x = 3 atau x = 4", latex: "x = 3 \\text{ atau } x = 4", errorType: "E3" }
    ],
    correctAnswer: "B"
  },
  {
    id: "POST_Q04",
    number: 4,
    competencyId: "C04",
    domain: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Persamaan Kuadrat a > 1 (Post-Test)",
    prompt: "Akar-akar dari persamaan kuadrat 2x² + 7x - 4 = 0 adalah...",
    latex: "2x^2 + 7x - 4 = 0",
    options: [
      { key: "A", text: "x = 1/2 atau x = -4", latex: "x = \\frac{1}{2} \\text{ atau } x = -4", errorType: "E0" },
      { key: "B", text: "x = -1/2 atau x = 4", latex: "x = -\\frac{1}{2} \\text{ atau } x = 4", errorType: "E2" },
      { key: "C", text: "x = 1 atau x = -4", latex: "x = 1 \\text{ atau } x = -4", errorType: "E3" },
      { key: "D", text: "x = 2 atau x = -2", latex: "x = 2 \\text{ atau } x = -2", errorType: "E1" }
    ],
    correctAnswer: "A"
  },
  {
    id: "POST_Q05",
    number: 5,
    competencyId: "C05",
    domain: "D3",
    domainName: "Rumus ABC",
    title: "Penerapan Rumus Kuadratik (Post-Test)",
    prompt: "Dengan rumus kuadratik (ABC), penyelesaian dari persamaan x² - 6x + 7 = 0 adalah...",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    options: [
      { key: "A", text: "x = -3 ± √2", latex: "x = -3 \\pm \\sqrt{2}", errorType: "E2" },
      { key: "B", text: "x = 6 ± √8", latex: "x = 6 \\pm \\sqrt{8}", errorType: "E1" },
      { key: "C", text: "x = 3 ± √2", latex: "x = 3 \\pm \\sqrt{2}", errorType: "E0" },
      { key: "D", text: "x = 3 ± 2", latex: "x = 3 \\pm 2", errorType: "E3" }
    ],
    correctAnswer: "C"
  },
  {
    id: "POST_Q06",
    number: 6,
    competencyId: "C06",
    domain: "D3",
    domainName: "Rumus ABC",
    title: "Penyelesaian Akar Rasional Rumus Kuadratik (Post-Test)",
    prompt: "Nilai akar-akar dari x² - 8x + 15 = 0 menggunakan rumus kuadratik adalah...",
    latex: "x^2 - 8x + 15 = 0",
    options: [
      { key: "A", text: "x = 3 atau x = 5", latex: "x = 3 \\text{ atau } x = 5", errorType: "E0" },
      { key: "B", text: "x = -3 atau x = -5", latex: "x = -3 \\text{ atau } x = -5", errorType: "E2" },
      { key: "C", text: "x = 1 atau x = 15", latex: "x = 1 \\text{ atau } x = 15", errorType: "E1" },
      { key: "D", text: "x = 2 atau x = 6", latex: "x = 2 \\text{ atau } x = 6", errorType: "E3" }
    ],
    correctAnswer: "A"
  },
  {
    id: "POST_Q07",
    number: 7,
    competencyId: "C07",
    domain: "D4",
    domainName: "Diskriminan",
    title: "Perhitungan Nilai Diskriminan (Post-Test)",
    prompt: "Nilai diskriminan (D = b² - 4ac) dari persamaan 3x² - 6x + 4 = 0 adalah...",
    latex: "D = b^2 - 4ac",
    options: [
      { key: "A", text: "D = 84", latex: "D = 84", errorType: "E3" },
      { key: "B", text: "D = -12", latex: "D = -12", errorType: "E0" },
      { key: "C", text: "D = 12", latex: "D = 12", errorType: "E2" },
      { key: "D", text: "D = -84", latex: "D = -84", errorType: "E1" }
    ],
    correctAnswer: "B"
  },
  {
    id: "POST_Q08",
    number: 8,
    competencyId: "C08",
    domain: "D4",
    domainName: "Diskriminan",
    title: "Karakteristik Jenis Akar (Post-Test)",
    prompt: "Persamaan kuadrat x² - 10x + 25 = 0 memiliki karakteristik jenis akar...",
    latex: "x^2 - 10x + 25 = 0",
    options: [
      { key: "A", text: "Dua akar real berbeda (D > 0)", latex: "D > 0", errorType: "E1" },
      { key: "B", text: "Akar imajiner / tidak real (D < 0)", latex: "D < 0", errorType: "E2" },
      { key: "C", text: "Dua akar real kembar (D = 0)", latex: "D = 0", errorType: "E0" },
      { key: "D", text: "Hanya satu akar positif x = 25", latex: "x = 25", errorType: "E3" }
    ],
    correctAnswer: "C"
  },
  {
    id: "POST_Q09",
    number: 9,
    competencyId: "C09",
    domain: "D5",
    domainName: "Hubungan Akar",
    title: "Teorema Vieta (Post-Test)",
    prompt: "Jika x₁ dan x₂ adalah akar-akar dari 3x² - 9x + 6 = 0, maka nilai dari x₁ + x₂ dan x₁ · x₂ berturut-turut adalah...",
    latex: "x_1 + x_2 = -\\frac{b}{a}, \\quad x_1 \\cdot x_2 = \\frac{c}{a}",
    options: [
      { key: "A", text: "-3 dan 2", latex: "x_1 + x_2 = -3,\\ x_1 \\cdot x_2 = 2", errorType: "E2" },
      { key: "B", text: "3 dan 2", latex: "x_1 + x_2 = 3,\\ x_1 \\cdot x_2 = 2", errorType: "E0" },
      { key: "C", text: "9 dan 6", latex: "x_1 + x_2 = 9,\\ x_1 \\cdot x_2 = 6", errorType: "E1" },
      { key: "D", text: "-9 dan -6", latex: "x_1 + x_2 = -9,\\ x_1 \\cdot x_2 = -6", errorType: "E3" }
    ],
    correctAnswer: "B"
  },
  {
    id: "POST_Q10",
    number: 10,
    competencyId: "C10",
    domain: "D5",
    domainName: "Hubungan Akar",
    title: "Menyusun Persamaan Kuadrat Baru (Post-Test)",
    prompt: "Persamaan kuadrat yang memiliki akar-akar x₁ = 4 dan x₂ = -5 adalah...",
    latex: "x^2 - (x_1 + x_2)x + (x_1 \\cdot x_2) = 0",
    options: [
      { key: "A", text: "x² + x - 20 = 0", latex: "x^2 + x - 20 = 0", errorType: "E0" },
      { key: "B", text: "x² - x - 20 = 0", latex: "x^2 - x - 20 = 0", errorType: "E2" },
      { key: "C", text: "x² - 9x + 20 = 0", latex: "x^2 - 9x + 20 = 0", errorType: "E3" },
      { key: "D", text: "x² + x + 20 = 0", latex: "x^2 + x + 20 = 0", errorType: "E1" }
    ],
    correctAnswer: "A"
  },
  {
    id: "POST_Q11",
    number: 11,
    competencyId: "C11",
    domain: "D6",
    domainName: "Penerapan",
    title: "Pemodelan Geometri Luas Persegi Panjang (Post-Test)",
    prompt: "Sebidang taman berbentuk persegi panjang memiliki keliling 32 meter dan luas 60 meter persegi. Model persamaan kuadrat untuk menentukan panjang sisi x adalah...",
    latex: "x(16 - x) = 60 \\implies x^2 - 16x + 60 = 0",
    options: [
      { key: "A", text: "x² - 32x + 60 = 0", latex: "x^2 - 32x + 60 = 0", errorType: "E1" },
      { key: "B", text: "x² + 16x - 60 = 0", latex: "x^2 + 16x - 60 = 0", errorType: "E2" },
      { key: "C", text: "x² - 16x + 60 = 0", latex: "x^2 - 16x + 60 = 0", errorType: "E0" },
      { key: "D", text: "2x² - 32x + 60 = 0", latex: "2x^2 - 32x + 60 = 0", errorType: "E3" }
    ],
    correctAnswer: "C"
  },
  {
    id: "POST_Q12",
    number: 12,
    competencyId: "C12",
    domain: "D6",
    domainName: "Penerapan",
    title: "Interpretasi Solusi Kontekstual Fisik (Post-Test)",
    prompt: "Ketinggian roket air mainan dimodelkan dengan fungsi h(t) = 30t - 5t² (dalam meter). Waktu yang dibutuhkan roket untuk kembali menyentuh tanah (h = 0) setelah peluncuran awal adalah...",
    latex: "30t - 5t^2 = 0",
    options: [
      { key: "A", text: "t = 6 detik", latex: "t = 6 \\text{ detik}", errorType: "E0" },
      { key: "B", text: "t = 3 detik", latex: "t = 3 \\text{ detik}", errorType: "E3" },
      { key: "C", text: "t = -6 detik", latex: "t = -6 \\text{ detik}", errorType: "E4" },
      { key: "D", text: "t = 5 detik", latex: "t = 5 \\text{ detik}", errorType: "E1" }
    ],
    correctAnswer: "A"
  }
];

export function getFormQuestions(testType) {
  if (testType === "pretest") {
    return FORM_A_PRETEST;
  } else if (testType === "posttest") {
    return FORM_B_POSTTEST;
  }
  return [];
}
