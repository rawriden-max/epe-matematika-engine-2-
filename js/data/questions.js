/**
 * questions.js - Basis Data 24 Soal Diagnostik Persamaan Kuadrat
 * Penelitian Error Pattern Engine (EPE) untuk Pembelajaran Adaptif
 */

export const DOMAINS = {
  D1: {
    id: "D1",
    name: "Konsep Dasar",
    code: "D1 - Konsep Dasar",
    description: "Pemahaman bentuk baku, koefisien a,b,c, definisi akar, dan konsep diskriminan dasar",
    color: "#3b82f6",
    badgeClass: "badge-d1",
    questions: ["Q1", "Q2", "Q3", "Q4"]
  },
  D2: {
    id: "D2",
    name: "Faktorisasi",
    code: "D2 - Faktorisasi",
    description: "Pemfaktoran aljabar bentuk a=1 dan a>1 serta sifat perkalian nol",
    color: "#10b981",
    badgeClass: "badge-d2",
    questions: ["Q5", "Q6", "Q7", "Q8"]
  },
  D3: {
    id: "D3",
    name: "Rumus ABC",
    code: "D3 - Rumus ABC",
    description: "Penerapan rumus kuadratik, substitusi koefisien bertanda, dan verifikasi solusi",
    color: "#8b5cf6",
    badgeClass: "badge-d3",
    questions: ["Q9", "Q10", "Q11", "Q12"]
  },
  D4: {
    id: "D4",
    name: "Diskriminan",
    code: "D4 - Diskriminan",
    description: "Karakteristik nilai D (D>0, D=0, D<0) dan penentuan nilai parameter k",
    color: "#f59e0b",
    badgeClass: "badge-d4",
    questions: ["Q13", "Q14", "Q15", "Q16"]
  },
  D5: {
    id: "D5",
    name: "Hubungan Akar",
    code: "D5 - Hubungan Akar",
    description: "Teorema Vieta (jumlah dan hasil kali akar) serta pembentukan persamaan kuadrat baru",
    color: "#ec4899",
    badgeClass: "badge-d5",
    questions: ["Q17", "Q18", "Q19", "Q20"]
  },
  D6: {
    id: "D6",
    name: "Penerapan",
    code: "D6 - Penerapan",
    description: "Pemodelan masalah kontekstual nyata, interpretasi fisis, dan evaluasi konsep reflektif",
    color: "#06b6d4",
    badgeClass: "badge-d6",
    questions: ["Q21", "Q22", "Q23", "Q24"]
  }
};

export const QUESTIONS = [
  {
    id: "Q1",
    number: 1,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Identifikasi Bentuk Persamaan Kuadrat",
    promptText: "Manakah di antara persamaan berikut yang merupakan persamaan kuadrat? A. 2x+5=0 B. x²-4x+3=0 C. 3x³-x+1=0 D. 2/x+1=0",
    options: [
      { key: "A", text: "2x + 5 = 0", latex: "2x + 5 = 0" },
      { key: "B", text: "x² - 4x + 3 = 0", latex: "x^2 - 4x + 3 = 0" },
      { key: "C", text: "3x³ - x + 1 = 0", latex: "3x^3 - x + 1 = 0" },
      { key: "D", text: "2/x + 1 = 0", latex: "\\frac{2}{x} + 1 = 0" }
    ],
    latexEquation: "A.\\ 2x+5=0 \\quad B.\\ x^2-4x+3=0 \\quad C.\\ 3x^3-x+1=0 \\quad D.\\ \\frac{2}{x}+1=0",
    topic: "Bentuk Baku Persamaan Kuadrat (Derajat Dua)",
    standardAnswer: "B (x² - 4x + 3 = 0)",
    standardSteps: "Persamaan kuadrat adalah persamaan berderajat dua dengan bentuk umum ax² + bx + c = 0 (a ≠ 0).\n- Opsi A: Berderajat 1 (Persamaan Linier)\n- Opsi B: Pangkat tertinggi variabel x adalah 2 (Persamaan Kuadrat)\n- Opsi C: Pangkat tertinggi variabel x adalah 3 (Persamaan Kubik)\n- Opsi D: Bentuk pecahan aljabar (x⁻¹)\nJadi jawaban yang benar adalah B."
  },
  {
    id: "Q2",
    number: 2,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Penentuan Nilai Koefisien a, b, dan c",
    promptText: "Tentukan nilai a, b, dan c dari persamaan: 3x² - 7x - 6 = 0",
    latexEquation: "3x^2 - 7x - 6 = 0",
    topic: "Identifikasi Koefisien Bertanda ax² + bx + c = 0",
    standardAnswer: "a = 3, b = -7, c = -6",
    standardSteps: "Bentuk baku persamaan kuadrat adalah ax² + bx + c = 0.\nPersamaan yang diberikan: 3x² - 7x - 6 = 0 dapat ditulis sebagai 3x² + (-7)x + (-6) = 0.\nMaka diperoleh:\na = 3\nb = -7\nc = -6"
  },
  {
    id: "Q3",
    number: 3,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Evaluasi Konsep Akar vs Koefisien",
    promptText: "Diberikan persamaan: x² - 5x + 6 = 0. Seorang siswa mengatakan akarnya x = 5 dan x = 6. Benarkah? Jelaskan.",
    latexEquation: "x^2 - 5x + 6 = 0",
    topic: "Definisi Akar Persamaan Kuadrat vs Koefisien",
    standardAnswer: "Salah. Akarnya adalah x = 2 dan x = 3.",
    standardSteps: "Pernyataan siswa tersebut SALAH. Siswa keliru menganggap koefisien b = -5 dan konstanta c = 6 sebagai akar persamaan.\nPenyelesaian yang benar:\nx² - 5x + 6 = 0\n(x - 2)(x - 3) = 0\nx - 2 = 0 atau x - 3 = 0\nx = 2 atau x = 3.\nUji substitusi: untuk x = 5 -> 5² - 5(5) + 6 = 6 ≠ 0 (bukan akar)."
  },
  {
    id: "Q4",
    number: 4,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Penentuan Jenis Akar Tanpa Menyelesaikan Persamaan",
    promptText: "Tentukan jenis akar x² + 4x + 7 = 0 tanpa menyelesaikan persamaan.",
    latexEquation: "x^2 + 4x + 7 = 0",
    topic: "Uji Diskriminan untuk Penentuan Jenis Akar",
    standardAnswer: "Tidak memiliki akar real (akar imajiner / tidak real)",
    standardSteps: "Gunakan rumus diskriminan D = b² - 4ac.\nDari x² + 4x + 7 = 0 diperoleh a = 1, b = 4, c = 7.\nD = 4² - 4(1)(7)\nD = 16 - 28\nD = -12\nKarena D < 0, maka persamaan kuadrat tidak memiliki akar real (akarnya imajiner/kompleks)."
  },
  {
    id: "Q5",
    number: 5,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Persamaan Kuadrat Sederhana",
    promptText: "Tentukan akar-akar x² - 7x + 12 = 0 dengan faktorisasi.",
    latexEquation: "x^2 - 7x + 12 = 0",
    topic: "Faktorisasi Bentuk x² + bx + c = 0",
    standardAnswer: "x = 3 atau x = 4",
    standardSteps: "Cari dua bilangan p dan q sehingga p + q = -7 dan p × q = 12.\nPasangan faktor dari 12: (-3) × (-4) = 12 dan (-3) + (-4) = -7.\n(x - 3)(x - 4) = 0\nx - 3 = 0  atau  x - 4 = 0\nx = 3  atau  x = 4."
  },
  {
    id: "Q6",
    number: 6,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi dengan Konstanta Negatif",
    promptText: "Faktorkan x² + 2x - 15, lalu tentukan akar persamaannya.",
    latexEquation: "x^2 + 2x - 15 = 0",
    topic: "Faktorisasi Tanda Campuran (+b dan -c)",
    standardAnswer: "Faktorisasi: (x + 5)(x - 3) = 0; Akar: x = -5 atau x = 3",
    standardSteps: "Cari dua bilangan p dan q sehingga p + q = 2 dan p × q = -15.\nBilangan tersebut adalah 5 dan -3 (karena 5 + (-3) = 2 dan 5 × (-3) = -15).\nBentuk pemfaktoran: (x + 5)(x - 3) = 0\nx + 5 = 0  atau  x - 3 = 0\nx = -5  atau  x = 3."
  },
  {
    id: "Q7",
    number: 7,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Bentuk ax² + bx + c = 0 (a > 1)",
    promptText: "Selesaikan 2x² + 7x + 3 = 0 dengan faktorisasi.",
    latexEquation: "2x^2 + 7x + 3 = 0",
    topic: "Faktorisasi Koefisien a > 1",
    standardAnswer: "x = -1/2 atau x = -3",
    standardSteps: "Cari dua bilangan dengan jumlah = 7 dan hasil kali = a × c = 2 × 3 = 6.\nBilangan tersebut adalah 1 dan 6 (1 + 6 = 7 dan 1 × 6 = 6).\n2x² + 6x + x + 3 = 0\n2x(x + 3) + 1(x + 3) = 0\n(2x + 1)(x + 3) = 0\n2x + 1 = 0 -> 2x = -1 -> x = -1/2\nx + 3 = 0 -> x = -3."
  },
  {
    id: "Q8",
    number: 8,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Evaluasi Sifat Perkalian Nol",
    promptText: "Periksa penyelesaian (x - 4)(x - 5) = 0 -> x = 4 atau x = 5. Benarkah?",
    latexEquation: "(x - 4)(x - 5) = 0 \\implies x = 4 \\text{ atau } x = 5",
    topic: "Sifat Pembuat Nol (Zero Product Property)",
    standardAnswer: "Benar. Berdasarkan sifat perkalian nol, x = 4 atau x = 5.",
    standardSteps: "Penyelesaian tersebut BENAR.\nBerdasarkan sifat perkalian nol aljabar: jika A × B = 0, maka A = 0 atau B = 0.\nDalam persamaan (x - 4)(x - 5) = 0:\n1. x - 4 = 0  => x = 4\n2. x - 5 = 0  => x = 5\nKedua nilai x = 4 dan x = 5 adalah akar-akar yang tepat."
  },
  {
    id: "Q9",
    number: 9,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Identifikasi dan Penulisan Rumus Kuadratik",
    promptText: "Tentukan a, b, c dan tulis rumus untuk x² - 6x + 5 = 0.",
    latexEquation: "x^2 - 6x + 5 = 0",
    topic: "Penetapan Parameter dan Rumus ABC",
    standardAnswer: "a = 1, b = -6, c = 5; x = [-(-6) ± √((-6)² - 4(1)(5))] / (2(1))",
    standardSteps: "Dari persamaan x² - 6x + 5 = 0:\na = 1\nb = -6\nc = 5\nRumus kuadratik (Rumus ABC):\nx = [-b ± √(b² - 4ac)] / (2a)\nSubstitusi nilai koefisien:\nx = [-(-6) ± √((-6)² - 4(1)(5))] / (2(1))\nx = [6 ± √(36 - 20)] / 2\nx = [6 ± √16] / 2\nx = [6 ± 4] / 2 -> x₁ = 5, x₂ = 1."
  },
  {
    id: "Q10",
    number: 10,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Penyelesaian dengan Rumus Kuadratik (Konstanta Negatif)",
    promptText: "Selesaikan x² - 3x - 4 = 0 dengan rumus kuadrat.",
    latexEquation: "x^2 - 3x - 4 = 0",
    topic: "Rumus ABC dengan Perkalian Tanda -4ac",
    standardAnswer: "x = 4 atau x = -1",
    standardSteps: "Diketahui: a = 1, b = -3, c = -4.\nx = [-b ± √(b² - 4ac)] / (2a)\nx = [-(-3) ± √((-3)² - 4(1)(-4))] / (2(1))\nx = [3 ± √(9 - (-16))] / 2\nx = [3 ± √(9 + 16)] / 2\nx = [3 ± √25] / 2\nx = [3 ± 5] / 2\nx₁ = (3 + 5)/2 = 8/2 = 4\nx₂ = (3 - 5)/2 = -2/2 = -1."
  },
  {
    id: "Q11",
    number: 11,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Penyelesaian Rumus Kuadratik dengan a > 1",
    promptText: "Selesaikan 2x² + 3x - 2 = 0 dengan rumus kuadrat.",
    latexEquation: "2x^2 + 3x - 2 = 0",
    topic: "Rumus ABC dengan Pembagi 2a (a > 1)",
    standardAnswer: "x = 1/2 atau x = -2",
    standardSteps: "Diketahui: a = 2, b = 3, c = -2.\nx = [-b ± √(b² - 4ac)] / (2a)\nx = [-3 ± √(3² - 4(2)(-2))] / (2 × 2)\nx = [-3 ± √(9 + 16)] / 4\nx = [-3 ± √25] / 4\nx = [-3 ± 5] / 4\nx₁ = (-3 + 5)/4 = 2/4 = 1/2\nx₂ = (-3 - 5)/4 = -8/4 = -2."
  },
  {
    id: "Q12",
    number: 12,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Penyelesaian Rumus ABC dan Verifikasi Solusi",
    promptText: "Selesaikan 3x² - 2x - 1 = 0 dengan rumus kuadrat, lalu verifikasi.",
    latexEquation: "3x^2 - 2x - 1 = 0",
    topic: "Penyelesaian Rumus ABC & Langkah Verifikasi",
    standardAnswer: "x = 1 atau x = -1/3 (Terverifikasi benar)",
    standardSteps: "Diketahui: a = 3, b = -2, c = -1.\nx = [-(-2) ± √((-2)² - 4(3)(-1))] / (2 × 3)\nx = [2 ± √(4 + 12)] / 6\nx = [2 ± √16] / 6\nx = [2 ± 4] / 6\nx₁ = (2 + 4)/6 = 6/6 = 1\nx₂ = (2 - 4)/6 = -2/6 = -1/3\nVerifikasi:\nUntuk x = 1: 3(1)² - 2(1) - 1 = 3 - 2 - 1 = 0 (BENAR)\nUntuk x = -1/3: 3(-1/3)² - 2(-1/3) - 1 = 3(1/9) + 2/3 - 1 = 1/3 + 2/3 - 1 = 0 (BENAR)."
  },
  {
    id: "Q13",
    number: 13,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Perhitungan Diskriminan dan Karakteristik D = 0",
    promptText: "Tentukan diskriminan dan jenis akar x² - 8x + 16 = 0.",
    latexEquation: "x^2 - 8x + 16 = 0",
    topic: "Karakteristik Diskriminan D = 0 (Akar Kembar)",
    standardAnswer: "D = 0; Memiliki dua akar real kembar (satu akar real)",
    standardSteps: "Diketahui: a = 1, b = -8, c = 16.\nRumus diskriminan: D = b² - 4ac\nD = (-8)² - 4(1)(16)\nD = 64 - 64\nD = 0\nKarena D = 0, maka persamaan kuadrat memiliki 2 akar real yang kembar / sama (satu solusi real yaitu x = 4)."
  },
  {
    id: "Q14",
    number: 14,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Perhitungan Diskriminan dan Karakteristik D < 0",
    promptText: "Tentukan jenis akar 2x² + 4x + 5 = 0.",
    latexEquation: "2x^2 + 4x + 5 = 0",
    topic: "Karakteristik Diskriminan D < 0 (Akar Imajiner)",
    standardAnswer: "D = -24; Tidak memiliki akar real (akar imajiner)",
    standardSteps: "Diketahui: a = 2, b = 4, c = 5.\nD = b² - 4ac\nD = 4² - 4(2)(5)\nD = 16 - 40\nD = -24\nKarena D = -24 < 0, maka persamaan kuadrat tidak memiliki akar real (akarnya bersifat imajiner/kompleks)."
  },
  {
    id: "Q15",
    number: 15,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Penentuan Parameter k untuk Dua Akar Real Berbeda",
    promptText: "Tentukan k agar x² - 6x + k = 0 memiliki dua akar real berbeda.",
    latexEquation: "x^2 - 6x + k = 0",
    topic: "Syarat Parameter Diskriminan D > 0",
    standardAnswer: "k < 9",
    standardSteps: "Syarat agar memiliki dua akar real berbeda adalah D > 0.\nDari x² - 6x + k = 0 diperoleh a = 1, b = -6, c = k.\nD = b² - 4ac > 0\n(-6)² - 4(1)(k) > 0\n36 - 4k > 0\n-4k > -36\nBagi kedua ruas dengan -4 (tanda pertidaksamaan berbalik):\nk < 9."
  },
  {
    id: "Q16",
    number: 16,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Penentuan Parameter k untuk Satu Akar Kembar",
    promptText: "Tentukan k agar x² + (k - 2)x + 9 = 0 memiliki satu akar kembar.",
    latexEquation: "x^2 + (k - 2)x + 9 = 0",
    topic: "Syarat Parameter Diskriminan D = 0 (Solusi Ganda)",
    standardAnswer: "k = 8 atau k = -4",
    standardSteps: "Syarat agar memiliki akar kembar adalah D = 0.\nDari persamaan: a = 1, b = (k - 2), c = 9.\nD = b² - 4ac = 0\n(k - 2)² - 4(1)(9) = 0\n(k - 2)² - 36 = 0\n(k - 2)² = 36\nk - 2 = ±√36\nk - 2 = ±6\nKasus 1: k - 2 = 6  => k = 8\nKasus 2: k - 2 = -6 => k = -4\nJadi nilai k yang memenuhi adalah k = 8 atau k = -4."
  },
  {
    id: "Q17",
    number: 17,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Teorema Vieta Dasar (x₁ + x₂ dan x₁ · x₂)",
    promptText: "Untuk x² - 7x + 10 = 0, tentukan x₁ + x₂ dan x₁ · x₂ tanpa mencari akar.",
    latexEquation: "x^2 - 7x + 10 = 0",
    topic: "Teorema Vieta pada Persamaan Kuadrat (a = 1)",
    standardAnswer: "x₁ + x₂ = 7 dan x₁ · x₂ = 10",
    standardSteps: "Berdasarkan Teorema Vieta untuk ax² + bx + c = 0:\nx₁ + x₂ = -b/a\nx₁ · x₂ = c/a\nDari persamaan x² - 7x + 10 = 0 diperoleh a = 1, b = -7, c = 10.\nx₁ + x₂ = -(-7)/1 = 7\nx₁ · x₂ = 10/1 = 10."
  },
  {
    id: "Q18",
    number: 18,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Teorema Vieta dengan Koefisien a > 1",
    promptText: "Untuk 2x² - 8x + 6 = 0, tentukan x₁ + x₂ dan x₁ · x₂.",
    latexEquation: "2x^2 - 8x + 6 = 0",
    topic: "Teorema Vieta dengan Pembagi a ≠ 1",
    standardAnswer: "x₁ + x₂ = 4 dan x₁ · x₂ = 3",
    standardSteps: "Diketahui: a = 2, b = -8, c = 6.\n1. Jumlah akar-akar:\nx₁ + x₂ = -b/a = -(-8)/2 = 8/2 = 4\n2. Hasil kali akar-akar:\nx₁ · x₂ = c/a = 6/2 = 3."
  },
  {
    id: "Q19",
    number: 19,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Menyusun Persamaan Kuadrat Baru dari Akar Diketahui",
    promptText: "Jika akar-akarnya 3 dan -5, tentukan persamaan kuadratnya.",
    latexEquation: "x_1 = 3, \\quad x_2 = -5",
    topic: "Penyusunan Persamaan Kuadrat x² - (x₁+x₂)x + (x₁x₂) = 0",
    standardAnswer: "x² + 2x - 15 = 0",
    standardSteps: "Cara 1 (Faktorisasi perkalian faktor linear):\n(x - x₁)(x - x₂) = 0\n(x - 3)(x - (-5)) = 0\n(x - 3)(x + 5) = 0\nx² + 5x - 3x - 15 = 0\nx² + 2x - 15 = 0\n\nCara 2 (Rumus jumlah dan hasil kali akar):\nx₁ + x₂ = 3 + (-5) = -2\nx₁ · x₂ = 3 × (-5) = -15\nx² - (x₁ + x₂)x + (x₁ · x₂) = 0\nx² - (-2)x + (-15) = 0\nx² + 2x - 15 = 0."
  },
  {
    id: "Q20",
    number: 20,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Identitas Aljabar Jumlah Kuadrat Akar (x₁² + x₂²)",
    promptText: "Untuk x² - 4x + 1 = 0, tentukan x₁² + x₂² tanpa mencari akar.",
    latexEquation: "x^2 - 4x + 1 = 0",
    topic: "Identitas Aljabar x₁² + x₂² = (x₁+x₂)² - 2x₁x₂",
    standardAnswer: "x₁² + x₂² = 14",
    standardSteps: "Dari x² - 4x + 1 = 0 diperoleh a = 1, b = -4, c = 1.\nJumlah akar: x₁ + x₂ = -(-4)/1 = 4\nHasil kali akar: x₁ · x₂ = 1/1 = 1\nIdentitas aljabar kuadrat:\nx₁² + x₂² = (x₁ + x₂)² - 2(x₁ · x₂)\nx₁² + x₂² = (4)² - 2(1)\nx₁² + x₂² = 16 - 2 = 14."
  },
  {
    id: "Q21",
    number: 21,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Pemodelan Geometri Persegi Panjang dan Luas",
    promptText: "Persegi panjang panjang 3 cm > lebar, luas 40 cm². Tentukan panjang dan lebar.",
    latexEquation: "p = l + 3, \\quad \\text{Luas} = p \\times l = 40\\text{ cm}^2",
    topic: "Pemodelan Masalah Nyata Geometri & Eliminasi Nilai Negatif",
    standardAnswer: "Panjang = 8 cm, Lebar = 5 cm",
    standardSteps: "Misalkan lebar = l (dengan syarat l > 0 karena ukuran panjang).\nMaka panjang p = l + 3.\nLuas = panjang × lebar\n40 = (l + 3) × l\nl² + 3l = 40\nl² + 3l - 40 = 0\nFaktorkan:\n(l + 8)(l - 5) = 0\nl = -8  atau  l = 5.\nKarena ukuran lebar harus positif (l > 0), maka nilai l = -8 tidak memenuhi / diabaikan.\nLebar = 5 cm\nPanjang = 5 + 3 = 8 cm."
  },
  {
    id: "Q22",
    number: 22,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Pemodelan Fisika Gerak Parabola (Waktu Bola Menyentuh Tanah)",
    promptText: "Bola dilempar dengan h(t) = -5t² + 20t + 1. Kapan menyentuh tanah?",
    latexEquation: "h(t) = -5t^2 + 20t + 1, \\quad h(t) = 0",
    topic: "Pemodelan Fungsi Kuadrat Kinematika & Interpretasi Waktu Positif",
    standardAnswer: "t ≈ 4.05 detik",
    standardSteps: "Bola menyentuh tanah saat ketinggian h(t) = 0.\n-5t² + 20t + 1 = 0  atau  5t² - 20t - 1 = 0\nGunakan rumus kuadratik dengan a = 5, b = -20, c = -1:\nt = [-(-20) ± √((-20)² - 4(5)(-1))] / (2 × 5)\nt = [20 ± √(400 + 20)] / 10\nt = [20 ± √420] / 10\n√420 ≈ 20.494\nt₁ = (20 + 20.494)/10 = 40.494/10 ≈ 4.05 detik\nt₂ = (20 - 20.494)/10 = -0.494/10 ≈ -0.05 detik (tidak memenuhi karena waktu t ≥ 0)\nJadi bola menyentuh tanah setelah sekitar 4.05 detik."
  },
  {
    id: "Q23",
    number: 23,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Pemodelan Luas Taman Persegi Panjang",
    promptText: "Taman persegi panjang luas 96 m², panjang 4 m > lebar. Tentukan panjang dan lebar.",
    latexEquation: "p = l + 4, \\quad \\text{Luas} = p \\times l = 96\\text{ m}^2",
    topic: "Pemodelan Masalah Nyata Taman & Eliminasi Nilai Negatif",
    standardAnswer: "Panjang = 12 m, Lebar = 8 m",
    standardSteps: "Misal lebar = l (l > 0), maka panjang p = l + 4.\nLuas = p × l = 96\n(l + 4) × l = 96\nl² + 4l - 96 = 0\nFaktorkan:\n(l + 12)(l - 8) = 0\nl = -12  atau  l = 8.\nKarena ukuran fisik panjang taman tidak boleh bernilai negatif (l > 0), maka l = -12 diabaikan.\nLebar taman = 8 m\nPanjang taman = 8 + 4 = 12 m."
  },
  {
    id: "Q24",
    number: 24,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Analisis Kritis dan Reflektif Miskonsepsi D < 0",
    promptText: "Benarkah pernyataan \"D < 0 berarti nilai x negatif\"? Jelaskan dengan contoh.",
    latexEquation: "D < 0 \\implies x < 0 \\text{ (Miskonsepsi)}",
    topic: "Evaluasi Konseptual Diskriminan vs Nilai Akar Bilangan Real",
    standardAnswer: "Salah. D < 0 berarti persamaan kuadrat tidak memiliki akar bilangan real (akar imajiner), bukan akarnya bernilai negatif.",
    standardSteps: "Pernyataan tersebut SALAH.\n1. Nilai diskriminan D = b² - 4ac menentukan JUMLAH DAN SIFAT REAL/IMAJINER akar, BUKAN tanda positif/negatif dari akar x.\n2. Jika D < 0, maka persamaan kuadrat TIDAK MEMILIKI AKAR REAL (akarnya imajiner/kompleks karena berada di dalam tanda akar √D).\n3. Contoh penyangkal (Counter-example):\n- Persamaan dengan akar real negatif: (x + 2)(x + 3) = 0 -> x² + 5x + 6 = 0. Akarnya adalah x = -2 dan x = -3 (keduanya negatif), namun nilai D = 5² - 4(1)(6) = 25 - 24 = 1 > 0 (D positif!).\n- Persamaan dengan D < 0: x² + x + 1 = 0 memiliki D = 1² - 4(1)(1) = -3 < 0, tidak memiliki nilai x real sama sekali."
  }
];

export default QUESTIONS;
