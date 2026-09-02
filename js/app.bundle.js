/**
 * app.bundle.js - Standalone Bundle untuk Error Pattern Engine (EPE)
 * Desain Elegan, Bersih, dan Mudah Digunakan untuk Orang Awam (Tanpa Server/XAMPP)
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. DATA: DOMAINS & 24 SOAL DIAGNOSTIK
  // =========================================================================
  const DOMAINS = {
    D1: {
      id: "D1",
      name: "Konsep Dasar",
      code: "D1 - Konsep Dasar",
      description: "Pemahaman bentuk baku, koefisien a,b,c, definisi akar, dan konsep diskriminan dasar",
      badgeClass: "badge-d1",
      questions: ["Q1", "Q2", "Q3", "Q4"]
    },
    D2: {
      id: "D2",
      name: "Faktorisasi",
      code: "D2 - Faktorisasi",
      description: "Pemfaktoran aljabar bentuk a=1 dan a>1 serta sifat perkalian nol",
      badgeClass: "badge-d2",
      questions: ["Q5", "Q6", "Q7", "Q8"]
    },
    D3: {
      id: "D3",
      name: "Rumus ABC",
      code: "D3 - Rumus ABC",
      description: "Penerapan rumus kuadratik, substitusi koefisien bertanda, dan verifikasi solusi",
      badgeClass: "badge-d3",
      questions: ["Q9", "Q10", "Q11", "Q12"]
    },
    D4: {
      id: "D4",
      name: "Diskriminan",
      code: "D4 - Diskriminan",
      description: "Karakteristik nilai D (D>0, D=0, D<0) dan penentuan nilai parameter k",
      badgeClass: "badge-d4",
      questions: ["Q13", "Q14", "Q15", "Q16"]
    },
    D5: {
      id: "D5",
      name: "Hubungan Akar",
      code: "D5 - Hubungan Akar",
      description: "Teorema Vieta (jumlah dan hasil kali akar) serta pembentukan persamaan kuadrat baru",
      badgeClass: "badge-d5",
      questions: ["Q17", "Q18", "Q19", "Q20"]
    },
    D6: {
      id: "D6",
      name: "Penerapan",
      code: "D6 - Penerapan",
      description: "Pemodelan masalah kontekstual nyata, interpretasi fisis, dan evaluasi konsep reflektif",
      badgeClass: "badge-d6",
      questions: ["Q21", "Q22", "Q23", "Q24"]
    }
  };

  const QUESTIONS = [
    {
      id: "Q1",
      number: 1,
      domainId: "D1",
      domainName: "Konsep Dasar",
      title: "Identifikasi Bentuk Persamaan Kuadrat",
      promptText: "Manakah di antara persamaan berikut yang merupakan persamaan kuadrat? A. 2x+5=0 B. x²-4x+3=0 C. 3x³-x+1=0 D. 2/x+1=0",
      latexEquation: "A.\\ 2x+5=0 \\quad B.\\ x^2-4x+3=0 \\quad C.\\ 3x^3-x+1=0 \\quad D.\\ \\frac{2}{x}+1=0",
      topic: "Bentuk Baku Persamaan Kuadrat (Derajat Dua)",
      standardAnswer: "B (x² - 4x + 3 = 0)"
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
      standardAnswer: "a = 3, b = -7, c = -6"
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
      standardAnswer: "Salah. Akarnya adalah x = 2 dan x = 3."
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
      standardAnswer: "Tidak memiliki akar real (akar imajiner / tidak real)"
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
      standardAnswer: "x = 3 atau x = 4"
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
      standardAnswer: "Faktorisasi: (x + 5)(x - 3) = 0; Akar: x = -5 atau x = 3"
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
      standardAnswer: "x = -1/2 atau x = -3"
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
      standardAnswer: "Benar. Berdasarkan sifat perkalian nol, x = 4 atau x = 5."
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
      standardAnswer: "a = 1, b = -6, c = 5; x = [-(-6) ± √((-6)² - 4(1)(5))] / (2(1))"
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
      standardAnswer: "x = 4 atau x = -1"
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
      standardAnswer: "x = 1/2 atau x = -2"
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
      standardAnswer: "x = 1 atau x = -1/3 (Terverifikasi benar)"
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
      standardAnswer: "D = 0; Memiliki dua akar real kembar (satu akar real)"
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
      standardAnswer: "D = -24; Tidak memiliki akar real (akar imajiner)"
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
      standardAnswer: "k < 9"
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
      standardAnswer: "k = 8 atau k = -4"
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
      standardAnswer: "x₁ + x₂ = 7 dan x₁ · x₂ = 10"
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
      standardAnswer: "x₁ + x₂ = 4 dan x₁ · x₂ = 3"
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
      standardAnswer: "x² + 2x - 15 = 0"
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
      standardAnswer: "x₁² + x₂² = 14"
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
      standardAnswer: "Panjang = 8 cm, Lebar = 5 cm"
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
      standardAnswer: "t ≈ 4.05 detik"
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
      standardAnswer: "Panjang = 12 m, Lebar = 8 m"
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
      standardAnswer: "Salah. D < 0 berarti persamaan kuadrat tidak memiliki akar bilangan real (akar imajiner), bukan akarnya bernilai negatif."
    }
  ];

  // =========================================================================
  // 2. DATA: 11 CONTOH PRESET PENGUJIAN CEPAT
  // =========================================================================
  const SAMPLE_PRESETS = [
    {
      id: "preset-e0-q5",
      label: "Jawaban Benar (Q5: Faktorisasi Akurat)",
      category: "E0",
      questionId: "Q5",
      studentId: "Siswa_Aisyah_01",
      studentAnswer: "x = 3 atau x = 4",
      studentSteps: "x² - 7x + 12 = 0\n(x - 3)(x - 4) = 0\nx - 3 = 0  atau  x - 4 = 0\nx = 3  atau  x = 4"
    },
    {
      id: "preset-e1-q24",
      label: "Kesalahan Konseptual E1 (Q24: Miskonsepsi D < 0)",
      category: "E1",
      questionId: "Q24",
      studentId: "Siswa_Budi_02",
      studentAnswer: "Benar, pernyataan tersebut tepat.",
      studentSteps: "Benar, karena nilai D negatif berarti berada di bawah nol, sehingga otomatis akar-akar x yang dihasilkan juga bernilai negatif. Misalnya jika D = -12 maka x = -12."
    },
    {
      id: "preset-e1-q3",
      label: "Kesalahan Konseptual E1 (Q3: Koefisien Dianggap Akar)",
      category: "E1",
      questionId: "Q3",
      studentId: "Siswa_Cahyo_03",
      studentAnswer: "Benar, akarnya x = 5 dan x = 6.",
      studentSteps: "Pernyataan siswa itu benar karena pada persamaan x² - 5x + 6 = 0 terdapat angka 5 di depan x dan konstanta 6, sehingga akarnya langsung x = 5 dan x = 6."
    },
    {
      id: "preset-e1-q20",
      label: "Kesalahan Konseptual E1 (Q20: Lupa -2x₁x₂)",
      category: "E1",
      questionId: "Q20",
      studentId: "Siswa_Dian_04",
      studentAnswer: "x₁² + x₂² = 16",
      studentSteps: "x² - 4x + 1 = 0\nx₁ + x₂ = 4\nMaka x₁² + x₂² = (x₁ + x₂)² = 4² = 16"
    },
    {
      id: "preset-e2-q5",
      label: "Kesalahan Prosedural E2 (Q5: Tanda Pembuat Nol Terbalik)",
      category: "E2",
      questionId: "Q5",
      studentId: "Siswa_Eko_05",
      studentAnswer: "x = -3 atau x = -4",
      studentSteps: "x² - 7x + 12 = 0\n(x - 3)(x - 4) = 0\nMaka x = -3 atau x = -4"
    },
    {
      id: "preset-e2-q15",
      label: "Kesalahan Prosedural E2 (Q15: Lupa Balik Tanda Pertidaksamaan)",
      category: "E2",
      questionId: "Q15",
      studentId: "Siswa_Fajar_06",
      studentAnswer: "k > 9",
      studentSteps: "D > 0\n36 - 4k > 0\n-4k > -36\nBagi dengan -4:\nk > 9"
    },
    {
      id: "preset-e2-q2",
      label: "Kesalahan Prosedural E2 (Q2: Abaikan Tanda Minus Koefisien)",
      category: "E2",
      questionId: "Q2",
      studentId: "Siswa_Gita_07",
      studentAnswer: "a = 3, b = 7, c = 6",
      studentSteps: "3x² - 7x - 6 = 0\na = 3, b = 7, c = 6"
    },
    {
      id: "preset-e3-q10",
      label: "Kesalahan Komputasi E3 (Q10: Salah Tanda Perkalian -4ac)",
      category: "E3",
      questionId: "Q10",
      studentId: "Siswa_Hendra_08",
      studentAnswer: "Tidak ada penyelesaian real (D = -7)",
      studentSteps: "x² - 3x - 4 = 0\nx = [3 ± √(9 - 16)] / 2\nx = [3 ± √(-7)] / 2\nKarena di dalam akar 9 - 16 = -7, maka tidak ada akar real."
    },
    {
      id: "preset-e3-q11",
      label: "Kesalahan Komputasi E3 (Q11: Lupa Pembagi 2a = 4)",
      category: "E3",
      questionId: "Q11",
      studentId: "Siswa_Indah_09",
      studentAnswer: "x = 1 atau x = -4",
      studentSteps: "2x² + 3x - 2 = 0\nx = [-3 ± √(9 + 16)] / 2\nx = [-3 ± 5] / 2\nx₁ = 2/2 = 1\nx₂ = -8/2 = -4"
    },
    {
      id: "preset-e4-q21",
      label: "Kesalahan Interpretasi E4 (Q21: Memilih Lebar Negatif -8 cm)",
      category: "E4",
      questionId: "Q21",
      studentId: "Siswa_Joko_10",
      studentAnswer: "Lebar = 5 cm atau lebar = -8 cm",
      studentSteps: "Luas: l(l + 3) = 40\nl² + 3l - 40 = 0\n(l + 8)(l - 5) = 0\nl = -8 atau l = 5\nJadi lebar bisa 5 cm atau -8 cm."
    },
    {
      id: "preset-e4-q22",
      label: "Kesalahan Interpretasi E4 (Q22: Waktu Titik Puncak)",
      category: "E4",
      questionId: "Q22",
      studentId: "Siswa_Kartika_11",
      studentAnswer: "t = 2 detik",
      studentSteps: "h(t) = -5t² + 20t + 1\nt = -b / (2a) = -20 / (2 × -5) = 2 detik\nJadi bola menyentuh tanah saat t = 2 detik."
    }
  ];

  // =========================================================================
  // 3. TAXONOMY
  // =========================================================================
  const TAXONOMY = {
    E0: { code: "E0", label: "Akurat / Bebas Kesalahan", badgeClass: "badge-e0", getRemediation: (topic) => "Penyelesaian benar. Pertahankan pemahaman dan ketelitian Anda!" },
    E1: { code: "E1", label: "E1 - Kesalahan Konseptual", badgeClass: "badge-e1", getRemediation: (topic) => `Pelajari ulang konsep dasar ${topic}. Pahami kembali definisi, teorema, dan prinsip fundamental yang mendasari materi ini.` },
    E2: { code: "E2", label: "E2 - Kesalahan Prosedural", badgeClass: "badge-e2", getRemediation: (topic) => `Latihan langkah prosedural ${topic}. Terapkan tahapan aljabar secara sistematis dan cermati setiap langkah pemfaktoran atau substitusi rumus.` },
    E3: { code: "E3", label: "E3 - Kesalahan Komputasi", badgeClass: "badge-e3", getRemediation: (topic) => `Periksa operasi hitung ${topic}. Tingkatkan ketelitian dalam operasi perkalian tanda positif/negatif, kuadrat, dan penyederhanaan pembagian.` },
    E4: { code: "E4", label: "E4 - Kesalahan Interpretasi", badgeClass: "badge-e4", getRemediation: (topic) => `Latihan interpretasi konteks ${topic}. Selalu evaluasi apakah hasil matematika masuk akal terhadap konteks fisis/geometris nyata.` }
  };

  function formatErrorLabel(errorCode) {
    if (!errorCode || errorCode === "E0" || errorCode === "none") return "Tidak ada";
    const tax = TAXONOMY[errorCode];
    return tax ? tax.label : errorCode;
  }

  function generateRemediation(primaryCode, topic, customAdvice) {
    if (!primaryCode || primaryCode === "E0") return TAXONOMY.E0.getRemediation(topic);
    const tax = TAXONOMY[primaryCode];
    const base = tax ? tax.getRemediation(topic) : `Pelajari kembali materi ${topic}.`;
    return customAdvice ? `${base} Catatan khusus: ${customAdvice}` : base;
  }

  // =========================================================================
  // 4. STEP ANALYZER
  // =========================================================================
  class StepAnalyzer {
    static normalize(text) {
      if (!text) return "";
      return text
        .toLowerCase()
        .replace(/[\u2212\u2013\u2014]/g, "-")
        .replace(/\s+/g, " ")
        .replace(/x\^2|x\u00B2/g, "x^2")
        .replace(/t\^2|t\u00B2/g, "t^2")
        .replace(/l\^2|l\u00B2/g, "l^2")
        .replace(/x_1|x1/g, "x1")
        .replace(/x_2|x2/g, "x2")
        .replace(/\\cdot|\*|\u00D7/g, "*")
        .replace(/\\pm|\+\/-/g, "+-")
        .trim();
    }

    static contains(text, pattern) {
      const norm = this.normalize(text);
      if (pattern instanceof RegExp) return pattern.test(norm);
      return norm.includes(this.normalize(pattern));
    }

    static extractCoefficients(text) {
      const norm = this.normalize(text);
      const result = { a: null, b: null, c: null };
      const aMatch = norm.match(/\ba\s*=\s*(-?\d+(\.\d+)?)/);
      if (aMatch) result.a = parseFloat(aMatch[1]);
      const bMatch = norm.match(/\bb\s*=\s*(-?\d+(\.\d+)?)/);
      if (bMatch) result.b = parseFloat(bMatch[1]);
      const cMatch = norm.match(/\bc\s*=\s*(-?\d+(\.\d+)?)/);
      if (cMatch) result.c = parseFloat(cMatch[1]);

      if (result.a === null && result.b === null && result.c === null) {
        const listMatch = norm.match(/(-?\d+)\s*[,;\s]+\s*(-?\d+)\s*[,;\s]+\s*(-?\d+)/);
        if (listMatch) {
          result.a = parseFloat(listMatch[1]);
          result.b = parseFloat(listMatch[2]);
          result.c = parseFloat(listMatch[3]);
        }
      }
      return result;
    }

    static extractRoots(text) {
      const norm = this.normalize(text);
      const roots = [];
      const regex1 = /(?:x(?:1|2)?\s*=\s*)(-?\d+(?:\/\d+|\.\d+)?)/g;
      let match;
      while ((match = regex1.exec(norm)) !== null) roots.push(match[1]);
      if (roots.length === 0) {
        const regex2 = /(-?\d+(?:\/\d+)?)\s*(?:atau|dan|,|\/|;)\s*(-?\d+(?:\/\d+)?)/;
        const m2 = norm.match(regex2);
        if (m2) roots.push(m2[1], m2[2]);
      }
      return roots;
    }

    static extractDiscriminant(text) {
      const norm = this.normalize(text);
      const dMatch = norm.match(/\bd\s*=\s*(-?\d+)/);
      return dMatch ? parseInt(dMatch[1], 10) : null;
    }
  }

  // =========================================================================
  // 5. DIAGNOSTIC RULES (Q1 - Q24)
  // =========================================================================
  const DIAGNOSTIC_RULES = {
    Q1: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const ansNorm = StepAnalyzer.normalize(answer);
      if (ansNorm === "b" || StepAnalyzer.contains(combined, "b.") || StepAnalyzer.contains(combined, "x^2 - 4x + 3") || StepAnalyzer.contains(combined, "opsi b")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat memilih Opsi B (x² - 4x + 3 = 0) dengan mengidentifikasi variabel berpangkat tertinggi 2 sebagai ciri persamaan kuadrat." };
      }
      if (ansNorm === "c" || StepAnalyzer.contains(combined, "c.") || StepAnalyzer.contains(combined, "3x^3") || StepAnalyzer.contains(combined, "opsi c")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 95, evidence: "Siswa memilih Opsi C (3x³ - x + 1 = 0), menunjukkan miskonsepsi bahwa persamaan berpangkat 3 (kubik) disalahartikan sebagai persamaan kuadrat.", customAdvice: "Persamaan kuadrat mensyaratkan pangkat tertinggi variabel adalah tepat 2." };
      }
      if (ansNorm === "a" || StepAnalyzer.contains(combined, "a.") || StepAnalyzer.contains(combined, "2x + 5") || StepAnalyzer.contains(combined, "opsi a")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 95, evidence: "Siswa memilih Opsi A (2x + 5 = 0) yang merupakan persamaan linier berderajat satu.", customAdvice: "Persamaan kuadrat harus memuat variabel x²." };
      }
      return { primaryError: "E1", secondaryError: "E2", confidence: 85, evidence: "Siswa belum mampu mengidentifikasi bentuk baku persamaan kuadrat berderajat dua." };
    },

    Q2: (steps, answer) => {
      const combined = `${steps} ${answer}`;
      const coef = StepAnalyzer.extractCoefficients(combined);
      if (coef.a === 3 && coef.b === -7 && coef.c === -6) {
        return { primaryError: "E0", secondaryError: "none", confidence: 99, evidence: "Siswa berhasil mengidentifikasi seluruh koefisien bertanda dengan tepat: a = 3, b = -7, c = -6." };
      }
      if (coef.b === 7 || coef.c === 6 || (coef.b === 7 && coef.c === -6) || (coef.b === -7 && coef.c === 6)) {
        return { primaryError: "E2", secondaryError: "E1", confidence: 96, evidence: `Siswa menuliskan koefisien tanda positif (b = ${coef.b ?? 7}, c = ${coef.c ?? 6}), mengabaikan tanda minus di depan koefisien pada bentuk 3x² - 7x - 6 = 0.`, customAdvice: "Tanda minus pada suku -7x dan -6 melekat pada nilai koefisien b = -7 dan c = -6." };
      }
      return { primaryError: "E2", secondaryError: "none", confidence: 80, evidence: "Siswa belum menuliskan nilai a = 3, b = -7, c = -6 secara lengkap dan tepat." };
    },

    Q3: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const isFalse = StepAnalyzer.contains(combined, "salah") || StepAnalyzer.contains(combined, "tidak benar") || StepAnalyzer.contains(combined, "bukan") || StepAnalyzer.contains(combined, "keliru");
      const isTrue = StepAnalyzer.contains(combined, "benar") && !isFalse;
      if (isTrue || StepAnalyzer.contains(combined, "benar karena ada angka 5 dan 6") || StepAnalyzer.contains(combined, "akarnya memang 5 dan 6")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 96, evidence: "Siswa menyetujui pernyataan keliru tersebut, mencerminkan miskonsepsi konseptual bahwa koefisien persamaan x² - 5x + 6 = 0 langsung dianggap sebagai akar persamaan.", customAdvice: "Akar persamaan adalah nilai pembuat nol setelah difaktorkan (x - 2)(x - 3) = 0 -> x = 2 atau x = 3, bukan koefisien langsung." };
      }
      if (isFalse) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa menyatakan pernyataan tersebut salah dan menjelaskan akar yang sebenarnya adalah x = 2 dan x = 3 melalui faktorisasi (x - 2)(x - 3) = 0." };
      }
      return { primaryError: "E1", secondaryError: "E2", confidence: 82, evidence: "Siswa belum membedakan antara nilai koefisien persamaan kuadrat dengan akar-akar penyelesaiannya." };
    },

    Q4: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const dVal = StepAnalyzer.extractDiscriminant(combined);
      const hasCorrectConclusion = StepAnalyzer.contains(combined, "tidak memiliki akar real") || StepAnalyzer.contains(combined, "tidak real") || StepAnalyzer.contains(combined, "imajiner") || StepAnalyzer.contains(combined, "kompleks");
      if (hasCorrectConclusion || (dVal === -12 && StepAnalyzer.contains(combined, "d < 0"))) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat menghitung D = 4² - 4(1)(7) = -12 < 0 dan menyimpulkan persamaan tidak memiliki akar real (akar imajiner)." };
      }
      if (StepAnalyzer.contains(combined, "akarnya negatif") || StepAnalyzer.contains(combined, "akar bernilai negatif") || StepAnalyzer.contains(combined, "-12")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 96, evidence: "Siswa menyimpulkan 'akarnya bernilai negatif' karena nilai D = -12. Ini merupakan miskonsepsi antara tanda nilai D dengan sifat realitas akar.", customAdvice: "Nilai D < 0 menandakan tidak ada solusi bilangan real (akar imajiner), bukan nilai akar negatif." };
      }
      return { primaryError: "E1", secondaryError: "none", confidence: 84, evidence: "Siswa belum menggunakan konsep uji diskriminan D = b² - 4ac untuk menentukan jenis akar tanpa menyelesaikan persamaan." };
    },

    Q5: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const roots = StepAnalyzer.extractRoots(combined);
      if (roots.includes("3") && roots.includes("4")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa berhasil memfaktorkan menjadi (x - 3)(x - 4) = 0 dan menentukan akar x = 3 atau x = 4 secara tepat." };
      }
      if (roots.includes("-3") && roots.includes("-4")) {
        return { primaryError: "E2", secondaryError: "none", confidence: 95, evidence: "Siswa melakukan kesalahan inversi tanda pada langkah pembuat nol: dari (x - 3)(x - 4) = 0 dihasilkan x = -3 atau x = -4.", customAdvice: "Sifat pembuat nol: x - 3 = 0 -> x = +3, dan x - 4 = 0 -> x = +4." };
      }
      if (roots.includes("2") && roots.includes("6")) {
        return { primaryError: "E2", secondaryError: "E3", confidence: 94, evidence: "Siswa keliru memilih pasangan faktor 12 yaitu 2 dan 6, padahal (-2) + (-6) = -8 (bukan -7).", customAdvice: "Cari dua bilangan yang hasil kalinya +12 dan jumlahnya -7, yaitu -3 dan -4." };
      }
      return { primaryError: "E2", secondaryError: "none", confidence: 82, evidence: "Langkah faktorisasi untuk x² - 7x + 12 = 0 belum tepat." };
    },

    Q6: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const roots = StepAnalyzer.extractRoots(combined);
      if ((roots.includes("-5") && roots.includes("3")) || (roots.includes("3") && roots.includes("-5"))) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat memfaktorkan menjadi (x + 5)(x - 3) = 0 dan menentukan akar x = -5 atau x = 3." };
      }
      if ((roots.includes("5") && roots.includes("-3")) || StepAnalyzer.contains(combined, "(x-5)(x+3)")) {
        return { primaryError: "E2", secondaryError: "none", confidence: 96, evidence: "Siswa menukar tanda pasangan faktor menjadi (x - 5)(x + 3) = 0 sehingga menghasilkan x = 5 atau x = -3.", customAdvice: "Karena suku tengah positif (+2x) dan konstanta -15, faktor bernilai mutlak lebih besar harus bertanda positif (+5 dan -3)." };
      }
      return { primaryError: "E2", secondaryError: "E3", confidence: 82, evidence: "Siswa belum memfaktorkan bentuk x² + 2x - 15 dengan benar." };
    },

    Q7: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const roots = StepAnalyzer.extractRoots(combined);
      if (roots.includes("-1/2") || roots.includes("-0.5") || StepAnalyzer.contains(combined, "-1/2") || (roots.includes("-3") && StepAnalyzer.contains(combined, "2x+1"))) {
        return { primaryError: "E0", secondaryError: "none", confidence: 97, evidence: "Siswa tepat memfaktorkan 2x² + 7x + 3 menjadi (2x + 1)(x + 3) = 0 dan mendapatkan akar x = -1/2 atau x = -3." };
      }
      if (StepAnalyzer.contains(combined, "(2x+3)(x+1)")) {
        return { primaryError: "E2", secondaryError: "none", confidence: 94, evidence: "Siswa salah menyusun faktor koefisien a > 1 menjadi (2x + 3)(x + 1) yang jika diekspansi menghasilkan 2x² + 5x + 3 = 0 (bukan +7x)." };
      }
      return { primaryError: "E2", secondaryError: "none", confidence: 80, evidence: "Siswa mengalami kesulitan memfaktorkan persamaan kuadrat dengan koefisien a = 2." };
    },

    Q8: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const isTrue = StepAnalyzer.contains(combined, "benar") && !StepAnalyzer.contains(combined, "tidak benar") && !StepAnalyzer.contains(combined, "bukan");
      const isFalse = StepAnalyzer.contains(combined, "salah") || StepAnalyzer.contains(combined, "tidak benar");
      if (isTrue) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat memvalidasi bahwa langkah penyelesaian tersebut BENAR berdasarkan sifat perkalian nol (x - 4 = 0 -> x = 4 atau x - 5 = 0 -> x = 5)." };
      }
      if (isFalse || StepAnalyzer.contains(combined, "-4") && StepAnalyzer.contains(combined, "-5")) {
        return { primaryError: "E1", secondaryError: "E2", confidence: 95, evidence: "Siswa menyalahkan penyelesaian yang benar karena miskonsepsi bahwa akar harus bertanda negatif (mengira x = -4 atau x = -5).", customAdvice: "Sifat perkalian nol: x - a = 0 -> x = +a." };
      }
      return { primaryError: "E1", secondaryError: "none", confidence: 82, evidence: "Siswa belum memahami penerapan sifat perkalian nol pada bentuk terfaktorkan." };
    },

    Q9: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const coef = StepAnalyzer.extractCoefficients(combined);
      if (coef.b === -6 && (StepAnalyzer.contains(combined, "-b") || StepAnalyzer.contains(combined, "sqrt") || StepAnalyzer.contains(combined, "6 ±"))) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat mengidentifikasi nilai a = 1, b = -6, c = 5 dan menuliskan rumus kuadratik x = [-b ± √(b² - 4ac)] / (2a) beserta substitusinya." };
      }
      if (coef.b === 6) {
        return { primaryError: "E2", secondaryError: "none", confidence: 95, evidence: "Siswa mengidentifikasi b = 6 (seharusnya b = -6), mengabaikan tanda operasi negatif pada -6x." };
      }
      return { primaryError: "E2", secondaryError: "E1", confidence: 82, evidence: "Identifikasi parameter a, b, c atau penulisan rumus ABC belum lengkap." };
    },

    Q10: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const roots = StepAnalyzer.extractRoots(combined);
      if (roots.includes("4") && roots.includes("-1")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa menyelesaikan x² - 3x - 4 = 0 dengan rumus ABC secara tepat: x = [3 ± √25]/2 -> x = 4 atau x = -1." };
      }
      if (StepAnalyzer.contains(combined, "9 - 16") || StepAnalyzer.contains(combined, "sqrt(-7)") || StepAnalyzer.contains(combined, "-7")) {
        return { primaryError: "E3", secondaryError: "E2", confidence: 96, evidence: "Siswa salah dalam perkalian tanda negatif pada suku -4ac: menghitung -4(1)(-4) sebagai -16 alih-alih +16, sehingga menghasilkan D = 9 - 16 = -7.", customAdvice: "(-4) × 1 × (-4) = +16, sehingga 9 + 16 = 25." };
      }
      return { primaryError: "E3", secondaryError: "E2", confidence: 82, evidence: "Langkah perhitungan rumus kuadratik untuk x² - 3x - 4 = 0 belum tepat." };
    },

    Q11: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const roots = StepAnalyzer.extractRoots(combined);
      if ((roots.includes("1/2") || roots.includes("0.5")) && roots.includes("-2")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat menerapkan rumus ABC dengan pembagi 2a = 2(2) = 4, menghasilkan x = (-3 ± 5)/4 -> x = 1/2 atau x = -2." };
      }
      if ((roots.includes("1") && roots.includes("-4")) || StepAnalyzer.contains(combined, "(-3 + 5)/2")) {
        return { primaryError: "E3", secondaryError: "E2", confidence: 95, evidence: "Siswa lupa mengalikan koefisien a = 2 pada penyebut rumus (2a): hanya membagi dengan 2 bukan 2(2) = 4, sehingga menghasilkan akar x = 1 atau x = -4.", customAdvice: "Penyebut rumus adalah 2a = 2 × 2 = 4." };
      }
      return { primaryError: "E2", secondaryError: "E3", confidence: 82, evidence: "Siswa belum menyelesaikan rumus kuadratik untuk koefisien a = 2 dengan benar." };
    },

    Q12: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const roots = StepAnalyzer.extractRoots(combined);
      const hasRoots = roots.includes("1") && (roots.includes("-1/3") || StepAnalyzer.contains(combined, "-1/3"));
      if (hasRoots) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa menyelesaikan rumus kuadratik dengan tepat (x = 1 atau x = -1/3) dan menyertakan verifikasi solusi." };
      }
      return { primaryError: "E2", secondaryError: "E3", confidence: 82, evidence: "Penyelesaian persamaan 3x² - 2x - 1 = 0 belum lengkap atau belum diverifikasi." };
    },

    Q13: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const dVal = StepAnalyzer.extractDiscriminant(combined);
      if (dVal === 0 || StepAnalyzer.contains(combined, "d = 0") || StepAnalyzer.contains(combined, "akar kembar")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 99, evidence: "Siswa tepat menghitung D = (-8)² - 4(1)(16) = 0 dan menginterpretasikan jenis akar sebagai dua akar real kembar (satu penyelesaian real)." };
      }
      if (StepAnalyzer.contains(combined, "tidak ada akar") || StepAnalyzer.contains(combined, "akarnya 0") || StepAnalyzer.contains(combined, "akarnya nol")) {
        return { primaryError: "E1", secondaryError: "E4", confidence: 96, evidence: "Siswa menginterpretasikan D = 0 sebagai 'tidak ada akar' atau 'nilai akarnya nol'. Ini merupakan kesalahan konseptual makna diskriminan.", customAdvice: "D = 0 berarti memiliki dua akar real bernilai kembar (x = 4)." };
      }
      return { primaryError: "E1", secondaryError: "none", confidence: 82, evidence: "Siswa belum menentukan diskriminan dan jenis akar dengan benar." };
    },

    Q14: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "tidak memiliki akar real") || StepAnalyzer.contains(combined, "imajiner") || StepAnalyzer.contains(combined, "-24")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat menghitung D = 4² - 4(2)(5) = 16 - 40 = -24 < 0 dan menyimpulkan persamaan tidak memiliki akar real (akar imajiner)." };
      }
      if (StepAnalyzer.contains(combined, "akarnya negatif") || StepAnalyzer.contains(combined, "akarnya -24")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 96, evidence: "Siswa menyimpulkan 'akarnya bernilai negatif (-24)', mencerminkan kekeliruan konseptual antara tanda nilai diskriminan dan sifat akar.", customAdvice: "D < 0 berarti tidak ada akar real di sumbu X." };
      }
      return { primaryError: "E1", secondaryError: "E3", confidence: 82, evidence: "Siswa belum menghitung D = -24 dan menentukan sifat akarnya dengan tepat." };
    },

    Q15: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "k < 9") || StepAnalyzer.contains(combined, "k<9")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat menerapkan syarat dua akar real berbeda (D > 0): 36 - 4k > 0 -> -4k > -36 -> k < 9 dengan membalik tanda pertidaksamaan secara benar." };
      }
      if (StepAnalyzer.contains(combined, "k > 9") || StepAnalyzer.contains(combined, "k>9")) {
        return { primaryError: "E2", secondaryError: "none", confidence: 96, evidence: "Siswa lupa membalik arah tanda pertidaksamaan saat membagi kedua ruas dengan bilangan negatif (-4): -4k > -36 disederhanakan menjadi k > 9 alih-alih k < 9.", customAdvice: "Ketika membagi pertidaksamaan dengan bilangan negatif (-4), arah tanda WAJIB dibalik dari '>' menjadi '<'." };
      }
      return { primaryError: "E1", secondaryError: "E2", confidence: 82, evidence: "Siswa belum menerapkan syarat diskriminan D > 0 untuk mencari batasan nilai k." };
    },

    Q16: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "8") && StepAnalyzer.contains(combined, "-4")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat menerapkan D = 0: (k - 2)² = 36 -> k - 2 = ±6 sehingga menemukan kedua nilai k = 8 atau k = -4." };
      }
      if (StepAnalyzer.contains(combined, "8") && !StepAnalyzer.contains(combined, "-4")) {
        return { primaryError: "E2", secondaryError: "E4", confidence: 95, evidence: "Siswa hanya mengambil nilai akar positif dari (k - 2)² = 36 yaitu k - 2 = 6 -> k = 8, dan melupakan kemungkinan akar negatif k - 2 = -6 -> k = -4.", customAdvice: "(k - 2)² = 36 menghasilkan k - 2 = +6 atau k - 2 = -6." };
      }
      return { primaryError: "E2", secondaryError: "E1", confidence: 82, evidence: "Siswa belum menemukan solusi lengkap nilai parameter k pada kondisi D = 0." };
    },

    Q17: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "7") && StepAnalyzer.contains(combined, "10") && !StepAnalyzer.contains(combined, "-7")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 99, evidence: "Siswa tepat menggunakan Teorema Vieta: x₁ + x₂ = -b/a = -(-7)/1 = 7 dan x₁ · x₂ = c/a = 10 tanpa mencari akar persamaan." };
      }
      if (StepAnalyzer.contains(combined, "-7")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 95, evidence: "Siswa menggunakan rumus x₁ + x₂ = b/a sehingga menghasilkan -7 (lupa tanda minus pada rumus Vieta -b/a).", customAdvice: "Rumus jumlah akar: x₁ + x₂ = -b/a = -(-7)/1 = +7." };
      }
      return { primaryError: "E1", secondaryError: "E3", confidence: 82, evidence: "Penerapan Teorema Vieta pada x² - 7x + 10 = 0 belum tepat." };
    },

    Q18: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "4") && StepAnalyzer.contains(combined, "3")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat menerapkan rumus Vieta dengan membagi koefisien a = 2: x₁ + x₂ = 8/2 = 4 dan x₁ · x₂ = 6/2 = 3." };
      }
      if (StepAnalyzer.contains(combined, "8") && StepAnalyzer.contains(combined, "6")) {
        return { primaryError: "E1", secondaryError: "E2", confidence: 95, evidence: "Siswa mengabaikan pembagi koefisien a = 2 dalam rumus Vieta, sehingga menjawab x₁ + x₂ = 8 dan x₁ · x₂ = 6.", customAdvice: "Bagi nilai -b dan c dengan koefisien a = 2." };
      }
      return { primaryError: "E3", secondaryError: "E1", confidence: 82, evidence: "Siswa belum menentukan jumlah dan hasil kali akar dengan benar untuk 2x² - 8x + 6 = 0." };
    },

    Q19: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "x^2 + 2x - 15") || StepAnalyzer.contains(combined, "x^2+2x-15")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa berhasil menyusun persamaan kuadrat baru x² + 2x - 15 = 0 dari akar-akar 3 dan -5 secara tepat." };
      }
      if (StepAnalyzer.contains(combined, "x^2 - 2x - 15") || StepAnalyzer.contains(combined, "x^2-2x-15")) {
        return { primaryError: "E2", secondaryError: "none", confidence: 95, evidence: "Siswa membalik tanda faktor linear menjadi (x + 3)(x - 5) = 0 sehingga menghasilkan x² - 2x - 15 = 0 alih-alih (x - 3)(x + 5) = 0." };
      }
      return { primaryError: "E2", secondaryError: "none", confidence: 82, evidence: "Siswa belum menyusun persamaan kuadrat dengan benar." };
    },

    Q20: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      if (StepAnalyzer.contains(combined, "14") || StepAnalyzer.contains(combined, "16 - 2")) {
        return { primaryError: "E0", secondaryError: "none", confidence: 99, evidence: "Siswa tepat menerapkan identitas aljabar: x₁² + x₂² = (x₁ + x₂)² - 2(x₁ · x₂) = 4² - 2(1) = 16 - 2 = 14." };
      }
      if (StepAnalyzer.contains(combined, "16")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 96, evidence: "Siswa menganggap x₁² + x₂² sama dengan (x₁ + x₂)² = 4² = 16, melupakan suku pengurangan aljabar -2(x₁ · x₂).", customAdvice: "Identitas aljabar kuadrat: x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂." };
      }
      return { primaryError: "E1", secondaryError: "E3", confidence: 82, evidence: "Siswa belum menggunakan identitas aljabar kuadrat untuk menghitung x₁² + x₂²." };
    },

    Q21: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const hasPanjang8 = StepAnalyzer.contains(combined, "8");
      const hasLebar5 = StepAnalyzer.contains(combined, "5");
      const hasNeg8 = StepAnalyzer.contains(combined, "lebar = -8") || StepAnalyzer.contains(combined, "l = -8 cm") || StepAnalyzer.contains(combined, "lebar -8");
      if (hasPanjang8 && hasLebar5 && !hasNeg8) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa memodelkan geometri l² + 3l - 40 = 0, mengabaikan nilai negatif l = -8 karena dimensi panjang harus positif (l > 0), dan menyimpulkan Lebar = 5 cm, Panjang = 8 cm secara tepat." };
      }
      if (hasNeg8 || (StepAnalyzer.contains(combined, "-8") && !StepAnalyzer.contains(combined, "diabaikan") && !StepAnalyzer.contains(combined, "tidak memenuhi"))) {
        return { primaryError: "E4", secondaryError: "none", confidence: 96, evidence: "Siswa menyertakan nilai negatif (l = -8 cm) sebagai ukuran fisik nyata, gagal menginterpretasikan bahwa besaran geometri panjang/lebar wajib bernilai positif (l > 0).", customAdvice: "Dalam geometri fisis nyata, ukuran panjang tidak boleh negatif; akar negatif diabaikan." };
      }
      return { primaryError: "E4", secondaryError: "E2", confidence: 82, evidence: "Siswa belum menyelesaikan pemodelan geometri persegi panjang dengan tepat." };
    },

    Q22: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const hasTime4 = StepAnalyzer.contains(combined, "4.05") || StepAnalyzer.contains(combined, "4,05") || StepAnalyzer.contains(combined, "4 detik") || StepAnalyzer.contains(combined, "t = 4");
      const answeredVertexT2 = StepAnalyzer.contains(combined, "t = 2") || StepAnalyzer.contains(combined, "2 detik") || StepAnalyzer.contains(combined, "tinggi maksimum");
      if (hasTime4 && !answeredVertexT2) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat memodelkan kondisi saat menyentuh tanah h(t) = 0, menyelesaikan persamaan kuadrat, dan memilih waktu positif t ≈ 4.05 detik." };
      }
      if (answeredVertexT2 && !hasTime4) {
        return { primaryError: "E4", secondaryError: "E1", confidence: 95, evidence: "Siswa menghitung waktu saat mencapai titik puncak / tinggi maksimum (t = -b/(2a) = 2 detik), padahal soal menanyakan kapan bola menyentuh tanah (h(t) = 0).", customAdvice: "Menyentuh tanah berarti h(t) = 0, bukan titik puncak parabola." };
      }
      return { primaryError: "E4", secondaryError: "E2", confidence: 82, evidence: "Siswa belum memodelkan kondisi h(t) = 0 dengan benar." };
    },

    Q23: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const hasPanjang12 = StepAnalyzer.contains(combined, "12");
      const hasLebar8 = StepAnalyzer.contains(combined, "8");
      const hasNeg12 = StepAnalyzer.contains(combined, "lebar = -12") || StepAnalyzer.contains(combined, "l = -12 m");
      if (hasPanjang12 && hasLebar8 && !hasNeg12) {
        return { primaryError: "E0", secondaryError: "none", confidence: 98, evidence: "Siswa tepat memodelkan l² + 4l - 96 = 0, memfaktorkan menjadi (l + 12)(l - 8) = 0, mengeliminasi l = -12, dan mendapatkan Lebar = 8 m serta Panjang = 12 m." };
      }
      if (hasNeg12 || (StepAnalyzer.contains(combined, "-12") && !StepAnalyzer.contains(combined, "diabaikan"))) {
        return { primaryError: "E4", secondaryError: "none", confidence: 96, evidence: "Siswa menyertakan nilai negatif (l = -12 m) sebagai dimensi nyata taman tanpa eliminasi konteks fisis.", customAdvice: "Ukuran dimensi nyata tidak boleh bernilai negatif; selalu ambil akar positif l = 8 m." };
      }
      return { primaryError: "E4", secondaryError: "E2", confidence: 82, evidence: "Siswa belum menentukan dimensi panjang dan lebar taman dengan benar." };
    },

    Q24: (steps, answer) => {
      const combined = `${steps} ${answer}`.toLowerCase();
      const isFalse = StepAnalyzer.contains(combined, "salah") || StepAnalyzer.contains(combined, "tidak benar") || StepAnalyzer.contains(combined, "keliru") || StepAnalyzer.contains(combined, "bukan");
      const isTrue = StepAnalyzer.contains(combined, "benar") && !isFalse;
      if (isFalse) {
        return { primaryError: "E0", secondaryError: "none", confidence: 99, evidence: "Siswa tepat menyanggah pernyataan tersebut (SALAH) dan menjelaskan bahwa D < 0 menandakan tidak adanya akar real (akar imajiner), bukan akarnya bernilai negatif." };
      }
      if (isTrue || StepAnalyzer.contains(combined, "benar karena d negatif maka x negatif")) {
        return { primaryError: "E1", secondaryError: "none", confidence: 98, evidence: "Siswa membenarkan pernyataan keliru tersebut. Ini adalah miskonsepsi konseptual berat yang menyamakan tanda negatif pada diskriminan dengan tanda nilai penyelesaian x.", customAdvice: "Tanda nilai D menentukan ada/tidaknya penyelesaian bilangan real, bukan tanda positif/negatif dari nilai x." };
      }
      return { primaryError: "E1", secondaryError: "none", confidence: 85, evidence: "Siswa belum mampu mengevaluasi miskonsepsi hubungan nilai diskriminan negatif dengan nilai akar persamaan." };
    }
  };

  // =========================================================================
  // 6. CORE ENGINE
  // =========================================================================
  class ErrorPatternEngine {
    static analyze({ studentId = "Siswa_01", questionId = "Q1", studentAnswer = "", studentSteps = "" }) {
      const question = QUESTIONS.find((q) => q.id === questionId) || QUESTIONS[0];
      const domainObj = DOMAINS[question.domainId] || { code: question.domainId, name: question.domainName };
      const domainCode = domainObj.code || `${question.domainId} - ${question.domainName}`;

      const trimmedAnswer = (studentAnswer || "").trim();
      const trimmedSteps = (studentSteps || "").trim();

      if (!trimmedAnswer && !trimmedSteps) {
        const primaryError = "E1";
        const secondaryError = "none";
        const confidence = 90;
        const evidence = "Siswa tidak memberikan jawaban maupun langkah pengerjaan untuk soal ini.";
        const remediation = generateRemediation(primaryError, question.topic, "Mulailah dengan menuliskan langkah awal pemecahan masalah.");

        return this._buildResultPackage({
          studentId,
          questionId: question.id,
          domainCode,
          primaryError,
          secondaryError,
          evidence,
          confidence,
          remediation,
          question
        });
      }

      const ruleFn = DIAGNOSTIC_RULES[question.id];
      const diagnosticResult = typeof ruleFn === "function" ? ruleFn(trimmedSteps, trimmedAnswer) : { primaryError: "E2", secondaryError: "none", confidence: 75, evidence: "Langkah pengerjaan belum memenuhi prosedur standar persamaan kuadrat." };

      const { primaryError, secondaryError = "none", confidence = 85, evidence, customAdvice = "" } = diagnosticResult;
      const remediation = generateRemediation(primaryError, question.topic, customAdvice);

      return this._buildResultPackage({
        studentId: studentId.trim() || "Siswa_01",
        questionId: question.id,
        domainCode,
        primaryError,
        secondaryError,
        evidence,
        confidence,
        remediation,
        question
      });
    }

    static _buildResultPackage({ studentId, questionId, domainCode, primaryError, secondaryError, evidence, confidence, remediation, question }) {
      const primaryErrorFormatted = formatErrorLabel(primaryError);
      const secondaryErrorFormatted = formatErrorLabel(secondaryError);
      const confidenceFormatted = `${confidence}%`;

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
        questionTitle: question.title,
        domainId: question.domainId,
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
        isCorrect: primaryError === "E0"
      };
    }
  }

  // =========================================================================
  // 7. UTILITIES
  // =========================================================================
  class MathToolbar {
    static insertSymbol(targetElement, symbol) {
      if (!targetElement) return;
      const startPos = targetElement.selectionStart || 0;
      const endPos = targetElement.selectionEnd || 0;
      const originalValue = targetElement.value || "";

      targetElement.value = originalValue.substring(0, startPos) + symbol + originalValue.substring(endPos, originalValue.length);
      targetElement.focus();
      const newCursorPos = startPos + symbol.length;
      targetElement.setSelectionRange(newCursorPos, newCursorPos);
      targetElement.dispatchEvent(new Event("input", { bubbles: true }));
    }

    static getSymbols() {
      return [
        { label: "x²", value: "x²", tooltip: "Variabel x kuadrat" },
        { label: "±", value: "±", tooltip: "Tanda plus-minus" },
        { label: "√()", value: "√()", tooltip: "Bentuk akar kuadrat" },
        { label: "x₁", value: "x₁", tooltip: "Akar pertama x1" },
        { label: "x₂", value: "x₂", tooltip: "Akar kedua x2" },
        { label: "D = b²-4ac", value: "D = b² - 4ac", tooltip: "Rumus Diskriminan" },
        { label: "Rumus ABC", value: "x = [-b ± √(b² - 4ac)] / (2a)", tooltip: "Rumus Kuadratik ABC" },
        { label: "≤", value: "≤", tooltip: "Kurang dari sama dengan" },
        { label: "≥", value: "≥", tooltip: "Lebih dari sama dengan" },
        { label: "≠", value: "≠", tooltip: "Tidak sama dengan" }
      ];
    }
  }

  class HistoryManager {
    constructor(storageKey = "epe_diagnosis_history") {
      this.storageKey = storageKey;
      this.history = this._loadHistory();
    }

    _loadHistory() {
      try {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }

    _saveHistory() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.history));
      } catch (e) {}
    }

    addEntry(resultPackage) {
      if (!resultPackage) return;
      const entry = {
        id: "diag_" + Date.now(),
        timestamp: new Date().toLocaleString("id-ID"),
        studentId: resultPackage.studentId,
        questionId: resultPackage.questionId,
        domain: resultPackage.domainCode,
        primaryError: resultPackage.primaryErrorText,
        secondaryError: resultPackage.secondaryErrorText,
        confidence: resultPackage.confidenceText,
        evidence: resultPackage.evidence,
        remediation: resultPackage.remediation
      };
      this.history.unshift(entry);
      if (this.history.length > 100) this.history.pop();
      this._saveHistory();
      return entry;
    }

    getAll() {
      return this.history;
    }

    clear() {
      this.history = [];
      this._saveHistory();
    }

    exportToCSV() {
      if (this.history.length === 0) {
        return { success: false, message: "Belum ada riwayat diagnosa untuk diekspor." };
      }
      const headers = ["No", "Waktu Diagnosa", "Nama/ID Siswa", "Nomor Soal", "Domain", "Kesalahan Utama", "Kesalahan Kedua", "Skor Keyakinan", "Bukti Analisis", "Rekomendasi Remediasi"];
      const escapeCsv = (str) => `"${String(str ?? "").replace(/"/g, '""')}"`;

      const rows = this.history.map((item, idx) => [
        idx + 1,
        escapeCsv(item.timestamp),
        escapeCsv(item.studentId),
        escapeCsv(item.questionId),
        escapeCsv(item.domain),
        escapeCsv(item.primaryError),
        escapeCsv(item.secondaryError),
        escapeCsv(item.confidence),
        escapeCsv(item.evidence),
        escapeCsv(item.remediation)
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filename = `Riwayat_EPE_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, count: this.history.length, filename };
    }
  }

  class NotificationToast {
    static show(message, type = "success", duration = 3000) {
      let container = document.getElementById("toast-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none";
        document.body.appendChild(container);
      }

      const toast = document.createElement("div");
      const icons = {
        success: `<svg class="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`,
        info: `<svg class="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
        warning: `<svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
        error: `<svg class="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`
      };

      toast.className = "flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 bg-slate-900 text-slate-100 text-xs font-semibold transition-all duration-300 transform translate-y-3 opacity-0 pointer-events-auto";
      toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
      container.appendChild(toast);

      requestAnimationFrame(() => {
        toast.classList.remove("translate-y-3", "opacity-0");
        toast.classList.add("translate-y-0", "opacity-100");
      });

      setTimeout(() => {
        toast.classList.remove("translate-y-0", "opacity-100");
        toast.classList.add("translate-y-3", "opacity-0");
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
      }, duration);
    }
  }

  // =========================================================================
  // 8. APP CONTROLLER
  // =========================================================================
  class EpeApp {
    constructor() {
      this.questions = QUESTIONS;
      this.domains = DOMAINS;
      this.presets = SAMPLE_PRESETS;
      this.historyManager = new HistoryManager();
      this.activeQuestionId = "Q1";
      this.activeDomainFilter = "ALL";
      this.latestResult = null;
      this.theme = localStorage.getItem("epe_theme") || "light";
      this.elements = {};
    }

    init() {
      this.cacheElements();
      this.applyTheme(this.theme);
      this.renderDomainFilters();
      this.renderQuestionGrid();
      this.renderPresetSelector();
      this.renderMathToolbar();
      this.bindEvents();
      this.selectQuestion(this.activeQuestionId);
    }

    cacheElements() {
      this.elements = {
        themeToggleBtn: document.getElementById("theme-toggle-btn"),
        themeIcon: document.getElementById("theme-icon"),
        domainFilterContainer: document.getElementById("domain-filter-container"),
        questionGridContainer: document.getElementById("question-grid-container"),
        presetSelect: document.getElementById("preset-select"),
        presetApplyBtn: document.getElementById("preset-apply-btn"),

        // Guide Modal
        btnOpenGuide: document.getElementById("btn-open-guide"),
        btnCloseGuide: document.getElementById("btn-close-guide"),
        btnCloseGuide2: document.getElementById("btn-close-guide-2"),
        guideModal: document.getElementById("guide-modal"),

        // Question display
        qDomainBadge: document.getElementById("q-domain-badge"),
        qNumberBadge: document.getElementById("q-number-badge"),
        qTitle: document.getElementById("q-title"),
        qPromptText: document.getElementById("q-prompt-text"),
        qMathDisplay: document.getElementById("q-math-display"),
        qTopicText: document.getElementById("q-topic-text"),

        // Form inputs
        studentIdInput: document.getElementById("student-id-input"),
        studentStepsInput: document.getElementById("student-steps-input"),
        studentAnswerInput: document.getElementById("student-answer-input"),
        mathToolbarContainer: document.getElementById("math-toolbar-container"),

        // Actions
        btnAnalyze: document.getElementById("btn-analyze"),
        btnReset: document.getElementById("btn-reset"),
        btnCopyOutput: document.getElementById("btn-copy-output"),
        btnExportCsv: document.getElementById("btn-export-csv"),

        // Outputs
        outputSection: document.getElementById("output-section"),
        outputPlainText: document.getElementById("output-plain-text"),
        confidenceBar: document.getElementById("confidence-bar"),
        confidenceScoreText: document.getElementById("confidence-score-text"),
        primaryTaxonomyBadge: document.getElementById("primary-taxonomy-badge"),
        secondaryTaxonomyBadge: document.getElementById("secondary-taxonomy-badge"),
        evidenceText: document.getElementById("evidence-text"),
        remediationText: document.getElementById("remediation-text"),
        historyCountBadge: document.getElementById("history-count-badge")
      };
    }

    applyTheme(theme) {
      this.theme = theme;
      localStorage.setItem("epe_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("theme-dark");
        if (this.elements.themeIcon) {
          this.elements.themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
        }
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("theme-dark");
        if (this.elements.themeIcon) {
          this.elements.themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
        }
      }
    }

    toggleTheme() {
      this.applyTheme(this.theme === "dark" ? "light" : "dark");
    }

    renderDomainFilters() {
      if (!this.elements.domainFilterContainer) return;
      let html = `<button data-filter="ALL" class="filter-tab-btn ${this.activeDomainFilter === "ALL" ? "active" : ""}">Semua Domain (24)</button>`;
      Object.values(this.domains).forEach((dom) => {
        const isActive = this.activeDomainFilter === dom.id;
        html += `<button data-filter="${dom.id}" class="filter-tab-btn ${isActive ? "active" : ""}">${dom.id} (${dom.name})</button>`;
      });
      this.elements.domainFilterContainer.innerHTML = html;
      this.elements.domainFilterContainer.querySelectorAll(".filter-tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.activeDomainFilter = e.currentTarget.getAttribute("data-filter");
          this.renderDomainFilters();
          this.renderQuestionGrid();
        });
      });
    }

    renderQuestionGrid() {
      if (!this.elements.questionGridContainer) return;
      const filtered = this.questions.filter((q) => this.activeDomainFilter === "ALL" || q.domainId === this.activeDomainFilter);
      let html = "";
      filtered.forEach((q) => {
        const isActive = q.id === this.activeQuestionId;
        html += `
          <button data-qid="${q.id}" class="q-btn ${isActive ? "active" : ""}" title="Soal ${q.id} (${q.domainId})">
            <span class="q-badge">${q.domainId}</span>
            <span>${q.id}</span>
          </button>
        `;
      });
      this.elements.questionGridContainer.innerHTML = html;
      this.elements.questionGridContainer.querySelectorAll(".q-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          this.selectQuestion(e.currentTarget.getAttribute("data-qid"));
        });
      });
    }

    renderPresetSelector() {
      if (!this.elements.presetSelect) return;
      let html = '<option value="">-- Pilih Contoh Jawaban Simulasi Siswa --</option>';
      const categories = [
        { code: "E0", label: "Jawaban Benar / Akurat (E0)" },
        { code: "E1", label: "Kesalahan Konseptual (E1)" },
        { code: "E2", label: "Kesalahan Prosedural (E2)" },
        { code: "E3", label: "Kesalahan Komputasi (E3)" },
        { code: "E4", label: "Kesalahan Interpretasi (E4)" }
      ];
      categories.forEach((cat) => {
        const catPresets = this.presets.filter((p) => p.category === cat.code);
        if (catPresets.length > 0) {
          html += `<optgroup label="${cat.label}">`;
          catPresets.forEach((p) => {
            html += `<option value="${p.id}">${p.label}</option>`;
          });
          html += `</optgroup>`;
        }
      });
      this.elements.presetSelect.innerHTML = html;
    }

    renderMathToolbar() {
      if (!this.elements.mathToolbarContainer) return;
      const symbols = MathToolbar.getSymbols();
      let html = "";
      symbols.forEach((sym) => {
        html += `<button type="button" data-symbol="${sym.value}" title="${sym.tooltip}" class="math-sym-btn">${sym.label}</button>`;
      });
      this.elements.mathToolbarContainer.innerHTML = html;
      this.elements.mathToolbarContainer.querySelectorAll(".math-sym-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          MathToolbar.insertSymbol(this.elements.studentStepsInput, e.currentTarget.getAttribute("data-symbol"));
        });
      });
    }

    selectQuestion(questionId) {
      this.activeQuestionId = questionId;
      const q = this.questions.find((item) => item.id === questionId) || this.questions[0];
      const domain = this.domains[q.domainId];

      if (this.elements.qNumberBadge) this.elements.qNumberBadge.textContent = q.id;
      if (this.elements.qDomainBadge) {
        this.elements.qDomainBadge.textContent = `${q.domainId} - ${domain?.name || q.domainName}`;
        this.elements.qDomainBadge.className = `px-2 py-0.5 rounded-md text-xs font-semibold ${domain?.badgeClass || "badge-d1"}`;
      }
      if (this.elements.qTitle) this.elements.qTitle.textContent = q.title;
      if (this.elements.qPromptText) this.elements.qPromptText.textContent = q.promptText;
      if (this.elements.qTopicText) this.elements.qTopicText.textContent = q.topic;

      if (this.elements.qMathDisplay) {
        if (q.latexEquation) {
          this.renderKaTeX(q.latexEquation, this.elements.qMathDisplay, true);
          this.elements.qMathDisplay.classList.remove("hidden");
        } else {
          this.elements.qMathDisplay.classList.add("hidden");
        }
      }

      this.renderQuestionGrid();
    }

    renderKaTeX(texString, targetElement, isDisplayMode = false) {
      if (!targetElement) return;
      try {
        if (window.katex && typeof window.katex.render === "function") {
          window.katex.render(texString, targetElement, {
            displayMode: isDisplayMode,
            throwOnError: false
          });
        } else {
          targetElement.textContent = texString;
          setTimeout(() => {
            if (window.katex && typeof window.katex.render === "function") {
              window.katex.render(texString, targetElement, {
                displayMode: isDisplayMode,
                throwOnError: false
              });
            }
          }, 300);
        }
      } catch (e) {
        targetElement.textContent = texString;
      }
    }

    loadPreset(presetId) {
      if (!presetId) return;
      const preset = this.presets.find((p) => p.id === presetId);
      if (!preset) return;

      if (preset.questionId && preset.questionId !== this.activeQuestionId) {
        this.selectQuestion(preset.questionId);
      }

      if (this.elements.studentIdInput) this.elements.studentIdInput.value = preset.studentId;
      if (this.elements.studentAnswerInput) this.elements.studentAnswerInput.value = preset.studentAnswer;
      if (this.elements.studentStepsInput) this.elements.studentStepsInput.value = preset.studentSteps;

      NotificationToast.show(`Contoh "${preset.label}" dimuat. Menganalisis...`, "info");
      setTimeout(() => this.handleAnalysis(), 150);
    }

    handleAnalysis() {
      const studentId = this.elements.studentIdInput?.value || "Siswa_01";
      const studentAnswer = this.elements.studentAnswerInput?.value || "";
      const studentSteps = this.elements.studentStepsInput?.value || "";

      if (!studentAnswer.trim() && !studentSteps.trim()) {
        NotificationToast.show("Masukkan langkah pengerjaan atau jawaban siswa terlebih dahulu.", "warning");
        this.elements.studentStepsInput?.focus();
        return;
      }

      const result = ErrorPatternEngine.analyze({
        studentId,
        questionId: this.activeQuestionId,
        studentAnswer,
        studentSteps
      });

      this.latestResult = result;
      this.historyManager.addEntry(result);
      this.updateHistoryCount();
      this.renderDiagnosticOutput(result);

      NotificationToast.show("Diagnosis EPE berhasil dijalankan!", "success");
      if (window.innerWidth < 1024 && this.elements.outputSection) {
        this.elements.outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    renderDiagnosticOutput(result) {
      if (!result) return;
      if (this.elements.outputPlainText) {
        this.elements.outputPlainText.textContent = result.rawPlainText;
      }
      if (this.elements.confidenceScoreText) {
        this.elements.confidenceScoreText.textContent = `${result.confidenceScore}%`;
      }
      if (this.elements.confidenceBar) {
        this.elements.confidenceBar.style.width = `${result.confidenceScore}%`;
      }

      if (this.elements.primaryTaxonomyBadge) {
        this.elements.primaryTaxonomyBadge.textContent = result.primaryErrorText;
        if (result.isCorrect) {
          this.elements.primaryTaxonomyBadge.className = "badge-clean badge-e0 text-xs font-bold";
        } else {
          this.elements.primaryTaxonomyBadge.className = "badge-clean badge-accent text-xs font-bold";
        }
      }

      if (this.elements.secondaryTaxonomyBadge) {
        if (result.secondaryErrorCode && result.secondaryErrorCode !== "none") {
          this.elements.secondaryTaxonomyBadge.textContent = result.secondaryErrorText;
          this.elements.secondaryTaxonomyBadge.className = "badge-clean text-xs font-medium";
        } else {
          this.elements.secondaryTaxonomyBadge.textContent = "Tidak ada";
          this.elements.secondaryTaxonomyBadge.className = "badge-clean text-xs font-medium text-slate-400 dark:text-slate-500";
        }
      }

      if (this.elements.evidenceText) this.elements.evidenceText.textContent = result.evidence;
      if (this.elements.remediationText) this.elements.remediationText.textContent = result.remediation;
    }

    handleCopyOutput() {
      if (!this.latestResult || !this.latestResult.rawPlainText) {
        NotificationToast.show("Belum ada hasil analisis untuk disalin.", "warning");
        return;
      }
      navigator.clipboard.writeText(this.latestResult.rawPlainText).then(() => {
        NotificationToast.show("Teks diagnosis berhasil disalin ke clipboard!", "success");
      }).catch(() => {
        NotificationToast.show("Gagal menyalin teks.", "error");
      });
    }

    handleExportCSV() {
      const result = this.historyManager.exportToCSV();
      if (result.success) {
        NotificationToast.show(`Riwayat (${result.count} data) berhasil diekspor ke ${result.filename}!`, "success");
      } else {
        NotificationToast.show(result.message, "warning");
      }
    }

    updateHistoryCount() {
      if (this.elements.historyCountBadge) {
        this.elements.historyCountBadge.textContent = `${this.historyManager.getAll().length} Riwayat`;
      }
    }

    handleResetForm() {
      if (this.elements.studentStepsInput) this.elements.studentStepsInput.value = "";
      if (this.elements.studentAnswerInput) this.elements.studentAnswerInput.value = "";
      if (this.elements.presetSelect) this.elements.presetSelect.value = "";
      NotificationToast.show("Formulir pengerjaan siswa telah dikosongkan.", "info");
    }

    bindEvents() {
      if (this.elements.themeToggleBtn) this.elements.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

      // Guide Modal
      if (this.elements.btnOpenGuide) {
        this.elements.btnOpenGuide.addEventListener("click", () => {
          if (this.elements.guideModal) this.elements.guideModal.classList.remove("hidden");
        });
      }
      const closeGuide = () => {
        if (this.elements.guideModal) this.elements.guideModal.classList.add("hidden");
      };
      if (this.elements.btnCloseGuide) this.elements.btnCloseGuide.addEventListener("click", closeGuide);
      if (this.elements.btnCloseGuide2) this.elements.btnCloseGuide2.addEventListener("click", closeGuide);
      if (this.elements.guideModal) {
        this.elements.guideModal.addEventListener("click", (e) => {
          if (e.target === this.elements.guideModal) closeGuide();
        });
      }

      if (this.elements.presetApplyBtn) {
        this.elements.presetApplyBtn.addEventListener("click", () => {
          const val = this.elements.presetSelect?.value;
          if (val) this.loadPreset(val);
          else NotificationToast.show("Silakan pilih salah satu contoh simulasi.", "warning");
        });
      }
      if (this.elements.presetSelect) {
        this.elements.presetSelect.addEventListener("change", (e) => {
          if (e.target.value) this.loadPreset(e.target.value);
        });
      }
      if (this.elements.studentStepsInput) {
        this.elements.studentStepsInput.addEventListener("keydown", (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            this.handleAnalysis();
          }
        });
      }
      if (this.elements.studentAnswerInput) {
        this.elements.studentAnswerInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.handleAnalysis();
          }
        });
      }
      if (this.elements.btnAnalyze) this.elements.btnAnalyze.addEventListener("click", () => this.handleAnalysis());
      if (this.elements.btnReset) this.elements.btnReset.addEventListener("click", () => this.handleResetForm());
      if (this.elements.btnCopyOutput) this.elements.btnCopyOutput.addEventListener("click", () => this.handleCopyOutput());
      if (this.elements.btnExportCsv) this.elements.btnExportCsv.addEventListener("click", () => this.handleExportCSV());
      this.updateHistoryCount();
    }
  }

  // Inisialisasi otomatis saat DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.epeApp = new EpeApp();
      window.epeApp.init();
    });
  } else {
    window.epeApp = new EpeApp();
    window.epeApp.init();
  }
})();
