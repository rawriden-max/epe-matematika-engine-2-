/**
 * diagnosticRules.js - Basis Aturan Diagnostik Pakar untuk 24 Soal Persamaan Kuadrat
 * Error Pattern Engine (EPE)
 */

import { StepAnalyzer } from "./stepAnalyzer.js";

export const DIAGNOSTIC_RULES = {
  // =========================================================================
  // DOMAIN D1: KONSEP DASAR (Q1 - Q4) -> Fokus Utama: E1 (Konseptual)
  // =========================================================================

  Q1: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const ansNorm = StepAnalyzer.normalize(answer);
    
    // Jawaban Benar: B (x^2 - 4x + 3 = 0)
    if (ansNorm === "b" || StepAnalyzer.contains(combined, "b.") || StepAnalyzer.contains(combined, "x^2 - 4x + 3") || StepAnalyzer.contains(combined, "opsi b")) {
      // Verifikasi alasan
      if (StepAnalyzer.contains(combined, "derajat 2") || StepAnalyzer.contains(combined, "pangkat 2") || StepAnalyzer.contains(combined, "pangkat tertinggi 2") || StepAnalyzer.contains(combined, "x^2")) {
        return {
          primaryError: "E0",
          secondaryError: "none",
          confidence: 98,
          evidence: "Siswa tepat memilih Opsi B (x² - 4x + 3 = 0) dengan mengidentifikasi variabel berpangkat tertinggi 2 sebagai ciri persamaan kuadrat.",
          customAdvice: ""
        };
      }
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 92,
        evidence: "Siswa memilih opsi yang benar B (x² - 4x + 3 = 0).",
        customAdvice: ""
      };
    }

    // Kesalahan E1: Memilih C (3x^3 - x + 1 = 0)
    if (ansNorm === "c" || StepAnalyzer.contains(combined, "c.") || StepAnalyzer.contains(combined, "3x^3") || StepAnalyzer.contains(combined, "opsi c")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 95,
        evidence: "Siswa memilih Opsi C (3x³ - x + 1 = 0), menunjukkan miskonsepsi bahwa persamaan berpangkat 3 (kubik) disalahartikan sebagai persamaan kuadrat.",
        customAdvice: "Persamaan kuadrat mensyaratkan pangkat tertinggi variabel adalah tepat 2 (kuadrat), bukan 3 (kubik)."
      };
    }

    // Kesalahan E1: Memilih A (2x + 5 = 0)
    if (ansNorm === "a" || StepAnalyzer.contains(combined, "a.") || StepAnalyzer.contains(combined, "2x + 5") || StepAnalyzer.contains(combined, "opsi a")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 95,
        evidence: "Siswa memilih Opsi A (2x + 5 = 0), yaitu persamaan linier berderajat satu, bukan persamaan kuadrat.",
        customAdvice: "Persamaan kuadrat harus memuat suku berpangkat dua (x²)."
      };
    }

    // Kesalahan E1: Memilih D (2/x + 1 = 0)
    if (ansNorm === "d" || StepAnalyzer.contains(combined, "d.") || StepAnalyzer.contains(combined, "2/x")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 90,
        evidence: "Siswa memilih Opsi D (2/x + 1 = 0) yang merupakan persamaan pecahan aljabar.",
        customAdvice: "Bentuk baku persamaan kuadrat memiliki variabel polinomial berderajat 2."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "E2",
      confidence: 85,
      evidence: "Siswa belum mampu mengidentifikasi bentuk baku persamaan kuadrat berderajat dua.",
      customAdvice: "Perhatikan bentuk umum ax² + bx + c = 0 dengan a ≠ 0."
    };
  },

  Q2: (steps, answer) => {
    const combined = `${steps} ${answer}`;
    const coef = StepAnalyzer.extractCoefficients(combined);

    // Kunci: a = 3, b = -7, c = -6
    if (coef.a === 3 && coef.b === -7 && coef.c === -6) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 99,
        evidence: "Siswa berhasil mengidentifikasi seluruh koefisien bertanda dengan tepat: a = 3, b = -7, c = -6.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural): Mengabaikan tanda negatif (b = 7, c = 6)
    if (coef.b === 7 || coef.c === 6 || (coef.b === 7 && coef.c === -6) || (coef.b === -7 && coef.c === 6)) {
      return {
        primaryError: "E2",
        secondaryError: "E1",
        confidence: 96,
        evidence: `Siswa menuliskan koefisien tanda positif (b = ${coef.b ?? 7}, c = ${coef.c ?? 6}), mengabaikan tanda operasi minus di depan koefisien pada bentuk 3x² - 7x - 6 = 0.`,
        customAdvice: "Tanda minus pada suku -7x dan -6 melekat pada nilai koefisien b = -7 dan c = -6."
      };
    }

    // Kesalahan E1 (Konseptual): Menukar posisi a, b, c
    if ((coef.a === -7 || coef.a === -6) && coef.b === 3) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 92,
        evidence: "Siswa menukar posisi koefisien a, b, dan c terhadap suku persamaan kuadrat.",
        customAdvice: "Nilai 'a' adalah koefisien x², 'b' adalah koefisien x, dan 'c' adalah konstanta bebas."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "none",
      confidence: 80,
      evidence: "Siswa belum menuliskan nilai a = 3, b = -7, c = -6 secara lengkap dan tepat.",
      customAdvice: "Tuliskan dengan jelas nilai koefisien a, b, dan c beserta tanda aljabarnya."
    };
  },

  Q3: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const isFalse = StepAnalyzer.contains(combined, "salah") || StepAnalyzer.contains(combined, "tidak benar") || StepAnalyzer.contains(combined, "bukan") || StepAnalyzer.contains(combined, "keliru");
    const isTrue = StepAnalyzer.contains(combined, "benar") && !isFalse;

    // Kesalahan E1: Menganggap siswa benar karena 5 dan 6 adalah koefisien
    if (isTrue || StepAnalyzer.contains(combined, "benar karena ada angka 5 dan 6") || StepAnalyzer.contains(combined, "akarnya memang 5 dan 6")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menyetujui pernyataan keliru tersebut, mencerminkan miskonsepsi konseptual bahwa koefisien persamaan x² - 5x + 6 = 0 langsung dianggap sebagai akar persamaan.",
        customAdvice: "Akar persamaan adalah nilai x pembuat nol setelah difaktorkan (x - 2)(x - 3) = 0 -> x = 2 atau x = 3, bukan membaca langsung koefisiennya."
      };
    }

    // Jawaban Benar
    if (isFalse && (StepAnalyzer.contains(combined, "2") && StepAnalyzer.contains(combined, "3") || StepAnalyzer.contains(combined, "faktor") || StepAnalyzer.contains(combined, "substitusi"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa menyatakan pernyataan tersebut salah dan menjelaskan akar yang sebenarnya adalah x = 2 dan x = 3 melalui faktorisasi (x - 2)(x - 3) = 0.",
        customAdvice: ""
      };
    }

    if (isFalse) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 88,
        evidence: "Siswa tepat menyatakan bahwa pernyataan tersebut salah.",
        customAdvice: ""
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "E2",
      confidence: 82,
      evidence: "Siswa belum membedakan antara nilai koefisien persamaan kuadrat dengan akar-akar penyelesaiannya.",
      customAdvice: "Jelaskan dengan membuktikan nilai akar sebenarnya melalui faktorisasi atau substitusi."
    };
  },

  Q4: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const dVal = StepAnalyzer.extractDiscriminant(combined);

    // Kunci: D = 16 - 28 = -12 < 0 -> Tidak memiliki akar real (akar imajiner)
    const hasCorrectConclusion = StepAnalyzer.contains(combined, "tidak memiliki akar real") || StepAnalyzer.contains(combined, "tidak real") || StepAnalyzer.contains(combined, "imajiner") || StepAnalyzer.contains(combined, "kompleks") || StepAnalyzer.contains(combined, "tidak ada akar real");

    if (hasCorrectConclusion && (dVal === -12 || StepAnalyzer.contains(combined, "-12") || StepAnalyzer.contains(combined, "d < 0") || StepAnalyzer.contains(combined, "d<0"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat menghitung D = 4² - 4(1)(7) = -12 < 0 dan menyimpulkan persamaan tidak memiliki akar real (akar imajiner).",
        customAdvice: ""
      };
    }

    // Kesalahan E1 (Konseptual): Mengatakan akarnya bernilai negatif (-12)
    if (StepAnalyzer.contains(combined, "akarnya negatif") || StepAnalyzer.contains(combined, "akar-akarnya bernilai negatif") || StepAnalyzer.contains(combined, "akarnya -12")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menyimpulkan 'akarnya bernilai negatif' karena nilai D = -12. Ini merupakan miskonsepsi antara tanda nilai D dengan sifat realitas akar.",
        customAdvice: "Nilai D < 0 menandakan tidak ada solusi bilangan real (akar imajiner), bukan berarti nilai akarnya bertanda negatif."
      };
    }

    // Kesalahan E3 (Komputasi): Salah hitung 16 - 28
    if (StepAnalyzer.contains(combined, "16 - 28") && (dVal !== -12 && dVal !== null)) {
      return {
        primaryError: "E3",
        secondaryError: "E1",
        confidence: 90,
        evidence: `Siswa melakukan kesalahan aritmetika dalam menghitung nilai D = 16 - 28 (dihasilkan D = ${dVal}).`,
        customAdvice: "Periksa kembali pengurangan bilangan bertanda pada 16 - 28 = -12."
      };
    }

    if (hasCorrectConclusion) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 90,
        evidence: "Siswa menarik kesimpulan jenis akar yang tepat: tidak memiliki akar real.",
        customAdvice: ""
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "none",
      confidence: 84,
      evidence: "Siswa belum menggunakan konsep uji diskriminan D = b² - 4ac untuk menentukan jenis akar tanpa menyelesaikan persamaan.",
      customAdvice: "Gunakan rumus diskriminan D = b² - 4ac dan periksa apakah D > 0, D = 0, atau D < 0."
    };
  },

  // =========================================================================
  // DOMAIN D2: FAKTORISASI (Q5 - Q8) -> Fokus: E2 (Prosedural) + E3 (Komputasi)
  // =========================================================================

  Q5: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const roots = StepAnalyzer.extractRoots(combined);

    // Kunci: x = 3 atau x = 4, (x - 3)(x - 4) = 0
    const hasRoots3And4 = roots.includes("3") && roots.includes("4");
    const hasFactor3And4 = StepAnalyzer.contains(combined, "(x-3)(x-4)") || StepAnalyzer.contains(combined, "(x - 3)(x - 4)") || (StepAnalyzer.contains(combined, "x-3") && StepAnalyzer.contains(combined, "x-4"));

    if (hasRoots3And4 || (hasFactor3And4 && StepAnalyzer.contains(combined, "3") && StepAnalyzer.contains(combined, "4"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa berhasil memfaktorkan menjadi (x - 3)(x - 4) = 0 dan menentukan akar x = 3 atau x = 4 secara tepat.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural): Tanda pembuat nol terbalik (x = -3 atau x = -4)
    if (roots.includes("-3") && roots.includes("-4")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 95,
        evidence: "Siswa melakukan kesalahan inversi tanda pada langkah pembuat nol: dari (x - 3)(x - 4) = 0 dihasilkan x = -3 atau x = -4.",
        customAdvice: "Ingat sifat pembuat nol: x - 3 = 0 menghasilkan x = +3, dan x - 4 = 0 menghasilkan x = +4."
      };
    }

    // Kesalahan E2 (Prosedural): Salah memilih pasangan faktor 12 (misal 2 dan 6)
    if ((roots.includes("2") && roots.includes("6")) || StepAnalyzer.contains(combined, "(x-2)(x-6)") || StepAnalyzer.contains(combined, "(x - 2)(x - 6)")) {
      return {
        primaryError: "E2",
        secondaryError: "E3",
        confidence: 94,
        evidence: "Siswa keliru memilih pasangan faktor 12 yaitu 2 dan 6, padahal (-2) + (-6) = -8 (bukan -7).",
        customAdvice: "Cari dua bilangan yang hasil kalinya +12 dan jika dijumlahkan bernilai -7, yaitu -3 dan -4."
      };
    }

    // Kesalahan E2 (Prosedural): Salah tanda faktor (x + 3)(x + 4)
    if (StepAnalyzer.contains(combined, "(x+3)(x+4)") || StepAnalyzer.contains(combined, "(x + 3)(x + 4)")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 93,
        evidence: "Siswa menuliskan faktor (x + 3)(x + 4) = 0 sehingga menghasilkan jumlah suku tengah +7x bukan -7x.",
        customAdvice: "Perhatikan tanda koefisien b = -7, sehingga kedua faktor harus bernilai negatif (-3 dan -4)."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "none",
      confidence: 82,
      evidence: "Langkah faktorisasi untuk x² - 7x + 12 = 0 belum tepat.",
      customAdvice: "Faktorkan menjadi (x - 3)(x - 4) = 0 lalu cari nilai x pembuat nol."
    };
  },

  Q6: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const roots = StepAnalyzer.extractRoots(combined);

    // Kunci: (x + 5)(x - 3) = 0 -> x = -5 atau x = 3
    const hasRootsNeg5And3 = (roots.includes("-5") && roots.includes("3")) || (roots.includes("3") && roots.includes("-5"));
    const hasFactorPos5Neg3 = StepAnalyzer.contains(combined, "(x+5)(x-3)") || StepAnalyzer.contains(combined, "(x + 5)(x - 3)");

    if (hasRootsNeg5And3 || (hasFactorPos5Neg3 && (StepAnalyzer.contains(combined, "-5") && StepAnalyzer.contains(combined, "3")))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat memfaktorkan menjadi (x + 5)(x - 3) = 0 dan menentukan akar x = -5 atau x = 3.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural): Tanda faktor tertukar (x - 5)(x + 3) -> x = 5 atau x = -3
    if ((roots.includes("5") && roots.includes("-3")) || StepAnalyzer.contains(combined, "(x-5)(x+3)") || StepAnalyzer.contains(combined, "(x - 5)(x + 3)")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menukar tanda pasangan faktor menjadi (x - 5)(x + 3) = 0 sehingga menghasilkan x = 5 atau x = -3 (jumlah suku tengah menjadi -2x, bukan +2x).",
        customAdvice: "Karena suku tengah positif (+2x) dan konstanta negatif (-15), faktor dengan nilai mutlak lebih besar harus bertanda positif (+5 dan -3)."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "E3",
      confidence: 82,
      evidence: "Siswa belum memfaktorkan bentuk x² + 2x - 15 dengan benar.",
      customAdvice: "Cari dua bilangan yang hasil kalinya -15 dan jumlahnya +2."
    };
  },

  Q7: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const roots = StepAnalyzer.extractRoots(combined);

    // Kunci: (2x + 1)(x + 3) = 0 -> x = -1/2 atau x = -3
    const hasCorrectRoots = (roots.includes("-1/2") || roots.includes("-0.5") || StepAnalyzer.contains(combined, "-1/2") || StepAnalyzer.contains(combined, "-0.5")) && (roots.includes("-3") || StepAnalyzer.contains(combined, "-3"));
    const hasFactor = StepAnalyzer.contains(combined, "(2x+1)(x+3)") || StepAnalyzer.contains(combined, "(2x + 1)(x + 3)");

    if (hasCorrectRoots || (hasFactor && StepAnalyzer.contains(combined, "-1/2"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 97,
        evidence: "Siswa tepat memfaktorkan 2x² + 7x + 3 menjadi (2x + 1)(x + 3) = 0 dan mendapatkan akar x = -1/2 atau x = -3.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural): Salah pasangan faktor untuk a > 1, misal (2x + 3)(x + 1)
    if (StepAnalyzer.contains(combined, "(2x+3)(x+1)") || StepAnalyzer.contains(combined, "(2x + 3)(x + 1)") || (roots.includes("-3/2") && roots.includes("-1"))) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 94,
        evidence: "Siswa salah menyusun faktor koefisien a > 1 menjadi (2x + 3)(x + 1) yang jika diekspansi menghasilkan 2x² + 5x + 3 = 0 (bukan +7x).",
        customAdvice: "Gunakan perkalian a × c = 2 × 3 = 6. Cari faktor dari 6 yang jumlahnya 7 yaitu 6 dan 1, lalu pecah suku tengah menjadi 6x + x."
      };
    }

    // Kesalahan E2: Tanda positif pada akar (x = 1/2 atau x = 3)
    if ((roots.includes("1/2") || roots.includes("0.5")) && roots.includes("3")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 92,
        evidence: "Siswa melakukan kesalahan inversi tanda saat menyelesaikan 2x + 1 = 0 dan x + 3 = 0.",
        customAdvice: "2x + 1 = 0 menghasilkan 2x = -1 -> x = -1/2."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "none",
      confidence: 80,
      evidence: "Siswa mengalami kesulitan memfaktorkan persamaan kuadrat dengan koefisien a = 2.",
      customAdvice: "Pecah 7x menjadi 6x + x lalu faktorkan secara bertahap dengan metode pengelompokan."
    };
  },

  Q8: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const isTrue = StepAnalyzer.contains(combined, "benar") && !StepAnalyzer.contains(combined, "tidak benar") && !StepAnalyzer.contains(combined, "bukan");
    const isFalse = StepAnalyzer.contains(combined, "salah") || StepAnalyzer.contains(combined, "tidak benar");

    // Kunci: Benar.
    if (isTrue && (StepAnalyzer.contains(combined, "perkalian nol") || StepAnalyzer.contains(combined, "x-4=0") || StepAnalyzer.contains(combined, "x - 4 = 0") || StepAnalyzer.contains(combined, "x=4") || StepAnalyzer.contains(combined, "x=5"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat memvalidasi bahwa langkah penyelesaian tersebut BENAR berdasarkan sifat perkalian nol (x - 4 = 0 -> x = 4 atau x - 5 = 0 -> x = 5).",
        customAdvice: ""
      };
    }

    if (isTrue) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 90,
        evidence: "Siswa menyatakan penyelesaian tersebut benar.",
        customAdvice: ""
      };
    }

    // Kesalahan E1/E2: Menyatakan salah karena mengira akarnya harus negatif (-4 atau -5)
    if (isFalse || StepAnalyzer.contains(combined, "seharusnya x = -4") || StepAnalyzer.contains(combined, "seharusnya minus") || StepAnalyzer.contains(combined, "-4") && StepAnalyzer.contains(combined, "-5")) {
      return {
        primaryError: "E1",
        secondaryError: "E2",
        confidence: 95,
        evidence: "Siswa menyalahkan penyelesaian yang benar karena miskonsepsi bahwa akar harus bertanda sama dengan konstanta dalam kurung faktor (mengira x = -4 atau x = -5).",
        customAdvice: "Sifat perkalian nol menyatakan x - a = 0 -> x = +a. Tanda pada faktor berkebalikan dengan tanda nilai akar."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "none",
      confidence: 82,
      evidence: "Siswa belum memahami penerapan sifat perkalian nol pada bentuk terfaktorkan.",
      customAdvice: "Tinjau kembali teorema faktor dan sifat pembuat nol aljabar."
    };
  },

  // =========================================================================
  // DOMAIN D3: RUMUS ABC (Q9 - Q12) -> Fokus: E2 (Prosedural) + E3 (Komputasi)
  // =========================================================================

  Q9: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const coef = StepAnalyzer.extractCoefficients(combined);

    // Kunci: a = 1, b = -6, c = 5, rumus x = [-(-6) ± √((-6)² - 4(1)(5))] / (2(1))
    const hasCorrectParams = (coef.a === 1 && coef.b === -6 && coef.c === 5) || (StepAnalyzer.contains(combined, "a = 1") && StepAnalyzer.contains(combined, "b = -6") && StepAnalyzer.contains(combined, "c = 5"));
    const hasFormula = StepAnalyzer.contains(combined, "-b") || StepAnalyzer.contains(combined, "sqrt") || StepAnalyzer.contains(combined, "√") || StepAnalyzer.contains(combined, "b^2 - 4ac") || StepAnalyzer.contains(combined, "2a");

    if (hasCorrectParams && hasFormula) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat mengidentifikasi nilai a = 1, b = -6, c = 5 dan menuliskan rumus kuadratik x = [-b ± √(b² - 4ac)] / (2a) beserta substitusinya.",
        customAdvice: ""
      };
    }

    // Kesalahan E1 (Konseptual): Salah struktur rumus (misal lupa tanda minus pada b: x = [b ± ...])
    if (StepAnalyzer.contains(combined, "x = (b +") || StepAnalyzer.contains(combined, "x = b ±") || StepAnalyzer.contains(combined, "x = (b ±")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 94,
        evidence: "Siswa menuliskan rumus kuadratik tanpa tanda negatif pada suku awal (-b ditulis sebagai +b).",
        customAdvice: "Rumus ABC diawali dengan -b, sehingga jika b = -6 maka -b = -(-6) = +6."
      };
    }

    // Kesalahan E2 (Prosedural): Lupa tanda negatif koefisien b = 6
    if (coef.b === 6) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 95,
        evidence: "Siswa mengidentifikasi b = 6 (seharusnya b = -6), mengabaikan tanda operasi negatif pada -6x.",
        customAdvice: "Perhatikan koefisien b pada x² - 6x + 5 = 0 adalah -6."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "E1",
      confidence: 82,
      evidence: "Identifikasi parameter a, b, c atau penulisan rumus ABC belum lengkap.",
      customAdvice: "Tuliskan nilai a = 1, b = -6, c = 5 dan masukkan ke rumus x = [-b ± √(b² - 4ac)] / (2a)."
    };
  },

  Q10: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const roots = StepAnalyzer.extractRoots(combined);

    // Kunci: a = 1, b = -3, c = -4 -> x = 4 atau x = -1
    const hasRoots4AndNeg1 = (roots.includes("4") && roots.includes("-1")) || (roots.includes("-1") && roots.includes("4"));

    if (hasRoots4AndNeg1 || (StepAnalyzer.contains(combined, "4") && StepAnalyzer.contains(combined, "-1") && (StepAnalyzer.contains(combined, "25") || StepAnalyzer.contains(combined, "sqrt")))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa menyelesaikan x² - 3x - 4 = 0 dengan rumus ABC secara tepat: x = [3 ± √25]/2 -> x = 4 atau x = -1.",
        customAdvice: ""
      };
    }

    // Kesalahan E3 (Komputasi): Salah tanda perkalian -4ac = -4(1)(-4) dihitung -16 sehingga D = 9 - 16 = -7
    if (StepAnalyzer.contains(combined, "9 - 16") || StepAnalyzer.contains(combined, "9-16") || StepAnalyzer.contains(combined, "sqrt(-7)") || StepAnalyzer.contains(combined, "√-7") || StepAnalyzer.contains(combined, "-7")) {
      return {
        primaryError: "E3",
        secondaryError: "E2",
        confidence: 96,
        evidence: "Siswa salah dalam perkalian tanda negatif pada suku -4ac: menghitung -4(1)(-4) sebagai -16 alih-alih +16, sehingga menghasilkan D = 9 - 16 = -7.",
        customAdvice: "Perkalian dua bilangan negatif menghasilkan bilangan positif: (-4) × 1 × (-4) = +16, sehingga 9 + 16 = 25."
      };
    }

    // Kesalahan E2 (Prosedural): Salah substitusi -b saat b = -3 (menulis -3 alih-alih +3)
    if (StepAnalyzer.contains(combined, "-3 ± 5") || (roots.includes("1") && roots.includes("-4"))) {
      return {
        primaryError: "E2",
        secondaryError: "E3",
        confidence: 93,
        evidence: "Siswa keliru mensubstitusikan -b menjadi -3 (seharusnya -(-3) = +3), sehingga menghasilkan akar x = 1 atau x = -4.",
        customAdvice: "Karena b = -3, maka suku awal rumus -b menjadi -(-3) = +3."
      };
    }

    return {
      primaryError: "E3",
      secondaryError: "E2",
      confidence: 82,
      evidence: "Langkah perhitungan rumus kuadratik untuk x² - 3x - 4 = 0 belum tepat.",
      customAdvice: "Perhatikan hitungan diskriminan b² - 4ac = (-3)² - 4(1)(-4) = 9 + 16 = 25."
    };
  },

  Q11: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const roots = StepAnalyzer.extractRoots(combined);

    // Kunci: 2x² + 3x - 2 = 0 -> a = 2, b = 3, c = -2 -> x = 1/2 atau x = -2 (pembagi 2a = 4)
    const hasCorrectRoots = (roots.includes("1/2") || roots.includes("0.5") || StepAnalyzer.contains(combined, "1/2")) && (roots.includes("-2") || StepAnalyzer.contains(combined, "-2"));

    if (hasCorrectRoots && (StepAnalyzer.contains(combined, "/4") || StepAnalyzer.contains(combined, "per 4") || StepAnalyzer.contains(combined, "4"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat menerapkan rumus ABC dengan pembagi 2a = 2(2) = 4, menghasilkan x = (-3 ± 5)/4 -> x = 1/2 atau x = -2.",
        customAdvice: ""
      };
    }

    // Kesalahan E3 (Komputasi) / E2 (Prosedural): Lupa mengalikan pembagi dengan a = 2 (pembagi tetap 2) -> x = 1 atau x = -4
    if ((roots.includes("1") && roots.includes("-4")) || StepAnalyzer.contains(combined, "(-3 + 5)/2") || StepAnalyzer.contains(combined, "(-3 - 5)/2") || StepAnalyzer.contains(combined, "/2")) {
      return {
        primaryError: "E3",
        secondaryError: "E2",
        confidence: 95,
        evidence: "Siswa lupa mengalikan koefisien a = 2 pada penyebut rumus (2a): hanya membagi dengan 2 bukan 2(2) = 4, sehingga menghasilkan akar x = 1 atau x = -4.",
        customAdvice: "Penyebut rumus kuadratik adalah 2a. Karena a = 2, penyebutnya haruslah 2 × 2 = 4."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "E3",
      confidence: 82,
      evidence: "Siswa belum menyelesaikan rumus kuadratik untuk koefisien a = 2 dengan benar.",
      customAdvice: "Gunakan a = 2, b = 3, c = -2 dan pastikan penyebut adalah 2a = 4."
    };
  },

  Q12: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const roots = StepAnalyzer.extractRoots(combined);

    // Kunci: 3x² - 2x - 1 = 0 -> x = 1 atau x = -1/3 dan ada langkah verifikasi
    const hasRoots = (roots.includes("1") || StepAnalyzer.contains(combined, "x = 1") || StepAnalyzer.contains(combined, "x1 = 1")) && (roots.includes("-1/3") || StepAnalyzer.contains(combined, "-1/3") || StepAnalyzer.contains(combined, "-0.33"));
    const hasVerification = StepAnalyzer.contains(combined, "verifikasi") || StepAnalyzer.contains(combined, "substitusi") || StepAnalyzer.contains(combined, "3(1)^2") || StepAnalyzer.contains(combined, "3(1)²") || StepAnalyzer.contains(combined, "= 0") || StepAnalyzer.contains(combined, "terbukti");

    if (hasRoots && hasVerification) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 99,
        evidence: "Siswa menyelesaikan rumus kuadratik dengan tepat (x = 1 atau x = -1/3) dan menyertakan langkah verifikasi substitusi ke persamaan awal.",
        customAdvice: ""
      };
    }

    if (hasRoots && !hasVerification) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 90,
        evidence: "Akar-akar yang ditemukan sudah tepat (x = 1 atau x = -1/3), namun siswa melewatkan instruksi prosedural untuk melakukan verifikasi hasil.",
        customAdvice: "Selalu sertakan langkah verifikasi dengan mensubstitusikan nilai x yang diperoleh ke dalam persamaan 3x² - 2x - 1 = 0."
      };
    }

    // Kesalahan E3 (Komputasi): Pembagi 2a = 6 salah
    if (StepAnalyzer.contains(combined, "/3") || StepAnalyzer.contains(combined, "/2")) {
      return {
        primaryError: "E3",
        secondaryError: "E2",
        confidence: 92,
        evidence: "Siswa melakukan kesalahan perhitungan pada penyebut rumus ABC (2a = 2(3) = 6).",
        customAdvice: "Penyebut rumus kuadratik adalah 2a = 2 × 3 = 6."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "E3",
      confidence: 82,
      evidence: "Penyelesaian persamaan 3x² - 2x - 1 = 0 belum lengkap atau belum diverifikasi.",
      customAdvice: "Selesaikan dengan rumus kuadrat lalu uji substitusi nilai x = 1 dan x = -1/3."
    };
  },

  // =========================================================================
  // DOMAIN D4: DISKRIMINAN (Q13 - Q16) -> Fokus: E1 (Konseptual) + E4 (Interpretasi)
  // =========================================================================

  Q13: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const dVal = StepAnalyzer.extractDiscriminant(combined);

    // Kunci: D = (-8)^2 - 4(1)(16) = 64 - 64 = 0 -> Memiliki dua akar real kembar (satu solusi real)
    const hasDZero = dVal === 0 || StepAnalyzer.contains(combined, "d = 0") || StepAnalyzer.contains(combined, "d=0") || StepAnalyzer.contains(combined, "64 - 64 = 0");
    const hasTwinRoots = StepAnalyzer.contains(combined, "akar kembar") || StepAnalyzer.contains(combined, "dua akar kembar") || StepAnalyzer.contains(combined, "satu akar real") || StepAnalyzer.contains(combined, "akar sama") || StepAnalyzer.contains(combined, "real kembar");

    if (hasDZero && hasTwinRoots) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 99,
        evidence: "Siswa tepat menghitung D = (-8)² - 4(1)(16) = 0 dan menginterpretasikan jenis akar sebagai dua akar real kembar (satu penyelesaian real).",
        customAdvice: ""
      };
    }

    // Kesalahan E1 (Konseptual) / E4 (Interpretasi): Menganggap D = 0 berarti "tidak ada akar" atau "akarnya nol"
    if (StepAnalyzer.contains(combined, "tidak ada akar") || StepAnalyzer.contains(combined, "akarnya 0") || StepAnalyzer.contains(combined, "akarnya nol") || StepAnalyzer.contains(combined, "tidak memiliki akar")) {
      return {
        primaryError: "E1",
        secondaryError: "E4",
        confidence: 96,
        evidence: "Siswa menginterpretasikan D = 0 sebagai 'tidak ada akar' atau 'nilai akarnya nol'. Ini merupakan kesalahan konseptual makna diskriminan.",
        customAdvice: "Nilai D = 0 berarti persamaan memiliki dua akar real yang bernilai sama/kembar (x₁ = x₂ = 4), bukan tidak ada akar."
      };
    }

    // Kesalahan E3 (Komputasi): (-8)^2 = -64
    if (StepAnalyzer.contains(combined, "-64 - 64") || StepAnalyzer.contains(combined, "d = -128") || StepAnalyzer.contains(combined, "d = -64")) {
      return {
        primaryError: "E3",
        secondaryError: "none",
        confidence: 94,
        evidence: "Siswa salah menghitung kuadrat bilangan negatif: (-8)² dihitung -64 bukan +64.",
        customAdvice: "Kuadrat bilangan negatif selalu menghasilkan nilai positif: (-8)² = (-8) × (-8) = +64."
      };
    }

    if (hasDZero) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 90,
        evidence: "Siswa berhasil menghitung diskriminan D = 0.",
        customAdvice: ""
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "none",
      confidence: 82,
      evidence: "Siswa belum menentukan diskriminan dan jenis akar dengan benar.",
      customAdvice: "Hitung D = b² - 4ac = (-8)² - 4(1)(16) = 0."
    };
  },

  Q14: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const dVal = StepAnalyzer.extractDiscriminant(combined);

    // Kunci: 2x² + 4x + 5 = 0 -> D = 16 - 40 = -24 < 0 -> Tidak memiliki akar real
    const hasDNeg24 = dVal === -24 || StepAnalyzer.contains(combined, "-24") || StepAnalyzer.contains(combined, "16 - 40");
    const hasNoRealRoots = StepAnalyzer.contains(combined, "tidak memiliki akar real") || StepAnalyzer.contains(combined, "tidak real") || StepAnalyzer.contains(combined, "imajiner") || StepAnalyzer.contains(combined, "kompleks");

    if ((hasDNeg24 || StepAnalyzer.contains(combined, "d < 0") || StepAnalyzer.contains(combined, "d<0")) && hasNoRealRoots) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat menghitung D = 4² - 4(2)(5) = 16 - 40 = -24 < 0 dan menyimpulkan persamaan tidak memiliki akar real (akar imajiner).",
        customAdvice: ""
      };
    }

    // Kesalahan E1 (Konseptual): Mengatakan akarnya adalah bilangan negatif -24
    if (StepAnalyzer.contains(combined, "akarnya negatif") || StepAnalyzer.contains(combined, "akarnya -24") || StepAnalyzer.contains(combined, "akar bernilai negatif")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menyimpulkan 'akarnya bernilai negatif (-24)', mencerminkan kekeliruan konseptual antara tanda nilai diskriminan dan sifat akar.",
        customAdvice: "Diskriminan negatif (D < 0) berarti grafiknya tidak memotong sumbu X, sehingga tidak ada penyelesaian bilangan real."
      };
    }

    // Kesalahan E3 (Komputasi): 16 - 40 = 24 (positif)
    if (StepAnalyzer.contains(combined, "d = 24") || dVal === 24) {
      return {
        primaryError: "E3",
        secondaryError: "E1",
        confidence: 93,
        evidence: "Siswa keliru mengurangkan 16 - 40 menjadi +24 sehingga menarik kesimpulan yang salah.",
        customAdvice: "16 - 40 = -24 (negatif)."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "E3",
      confidence: 82,
      evidence: "Siswa belum menghitung D = -24 dan menentukan sifat akarnya dengan tepat.",
      customAdvice: "Hitung D = b² - 4ac = 4² - 4(2)(5) = -24."
    };
  },

  Q15: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: x² - 6x + k = 0 -> D > 0 -> 36 - 4k > 0 -> k < 9
    const hasKLessThan9 = StepAnalyzer.contains(combined, "k < 9") || StepAnalyzer.contains(combined, "k<9") || StepAnalyzer.contains(combined, "k < 9.0");

    if (hasKLessThan9) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat menerapkan syarat dua akar real berbeda (D > 0): 36 - 4k > 0 -> -4k > -36 -> k < 9 dengan membalik tanda pertidaksamaan secara benar.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural): Lupa membalik tanda pertidaksamaan (k > 9)
    if (StepAnalyzer.contains(combined, "k > 9") || StepAnalyzer.contains(combined, "k>9")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa lupa membalik arah tanda pertidaksamaan saat membagi kedua ruas dengan bilangan negatif (-4): -4k > -36 disederhanakan menjadi k > 9 alih-alih k < 9.",
        customAdvice: "Ketika membagi atau mengalikan pertidaksamaan dengan bilangan negatif (-4), arah tanda ketidaksamaan WAJIB dibalik dari '>' menjadi '<'."
      };
    }

    // Kesalahan E1 (Konseptual): Menggunakan syarat D = 0 sehingga k = 9
    if (StepAnalyzer.contains(combined, "k = 9") || StepAnalyzer.contains(combined, "k=9")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 93,
        evidence: "Siswa menggunakan syarat D = 0 (akar kembar) dan menghasilkan k = 9, padahal soal mensyaratkan dua akar real berbeda (D > 0).",
        customAdvice: "Syarat 'dua akar real berbeda' adalah D > 0 (pertidaksamaan), sedangkan D = 0 adalah syarat untuk 'satu akar kembar'."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "E2",
      confidence: 82,
      evidence: "Siswa belum menerapkan syarat diskriminan D > 0 untuk mencari batasan nilai k.",
      customAdvice: "Gunakan D = b² - 4ac > 0 -> (-6)² - 4(1)(k) > 0."
    };
  },

  Q16: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: x² + (k-2)x + 9 = 0 -> D = 0 -> (k-2)² - 36 = 0 -> k-2 = ±6 -> k = 8 atau k = -4
    const hasBothK = (StepAnalyzer.contains(combined, "8") || StepAnalyzer.contains(combined, "k = 8")) && (StepAnalyzer.contains(combined, "-4") || StepAnalyzer.contains(combined, "k = -4"));

    if (hasBothK) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat menerapkan D = 0: (k - 2)² = 36 -> k - 2 = ±6 sehingga menemukan kedua nilai k = 8 atau k = -4.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural) / E4: Hanya menemukan satu solusi positif (k = 8) dan mengabaikan k = -4
    if ((StepAnalyzer.contains(combined, "k = 8") || StepAnalyzer.contains(combined, "8")) && !StepAnalyzer.contains(combined, "-4")) {
      return {
        primaryError: "E2",
        secondaryError: "E4",
        confidence: 95,
        evidence: "Siswa hanya mengambil nilai akar positif dari (k - 2)² = 36 yaitu k - 2 = 6 -> k = 8, dan melupakan kemungkinan akar negatif k - 2 = -6 -> k = -4.",
        customAdvice: "Persamaan kuadrat (k - 2)² = 36 memiliki dua solusi: k - 2 = +6 atau k - 2 = -6, sehingga menghasilkan k = 8 atau k = -4."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "E1",
      confidence: 82,
      evidence: "Siswa belum menemukan solusi lengkap nilai parameter k pada kondisi D = 0.",
      customAdvice: "Gunakan D = (k - 2)² - 4(1)(9) = 0 -> (k - 2)² = 36."
    };
  },

  // =========================================================================
  // DOMAIN D5: HUBUNGAN AKAR (Q17 - Q20) -> Fokus: E1 (Konseptual) + E3 (Komputasi)
  // =========================================================================

  Q17: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: x² - 7x + 10 = 0 -> x₁ + x₂ = -(-7)/1 = 7 dan x₁ · x₂ = 10/1 = 10
    const hasSum7 = StepAnalyzer.contains(combined, "x1 + x2 = 7") || StepAnalyzer.contains(combined, "x1+x2=7") || StepAnalyzer.contains(combined, "jumlah = 7") || StepAnalyzer.contains(combined, "7");
    const hasProd10 = StepAnalyzer.contains(combined, "x1 * x2 = 10") || StepAnalyzer.contains(combined, "x1.x2 = 10") || StepAnalyzer.contains(combined, "x1x2 = 10") || StepAnalyzer.contains(combined, "kali = 10") || StepAnalyzer.contains(combined, "10");

    // Deteksi jika siswa mencari akar manual x = 2 dan x = 5 padahal diminta "tanpa mencari akar"
    const didManualRoots = StepAnalyzer.contains(combined, "(x-2)(x-5)") || (StepAnalyzer.contains(combined, "x = 2") && StepAnalyzer.contains(combined, "x = 5"));

    if (hasSum7 && hasProd10 && !didManualRoots) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 99,
        evidence: "Siswa tepat menggunakan Teorema Vieta: x₁ + x₂ = -b/a = -(-7)/1 = 7 dan x₁ · x₂ = c/a = 10 tanpa mencari akar persamaan.",
        customAdvice: ""
      };
    }

    if (hasSum7 && hasProd10 && didManualRoots) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 88,
        evidence: "Hasil akhir siswa benar (7 dan 10), namun siswa mencari akar persamaan terlebih dahulu (x = 2 dan x = 5) alih-alih langsung menerapkan rumus Teorema Vieta (-b/a dan c/a).",
        customAdvice: "Gunakan rumus langsung x₁ + x₂ = -b/a dan x₁ · x₂ = c/a untuk efisiensi aljabar."
      };
    }

    // Kesalahan E1 (Konseptual): Rumus Vieta salah tanda: x₁ + x₂ = b/a = -7
    if (StepAnalyzer.contains(combined, "-7") && (StepAnalyzer.contains(combined, "x1 + x2") || StepAnalyzer.contains(combined, "jumlah"))) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 95,
        evidence: "Siswa menggunakan rumus x₁ + x₂ = b/a sehingga menghasilkan -7 (lupa tanda minus pada rumus Vieta -b/a).",
        customAdvice: "Rumus jumlah akar adalah x₁ + x₂ = -b/a. Karena b = -7, maka x₁ + x₂ = -(-7)/1 = +7."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "E3",
      confidence: 82,
      evidence: "Penerapan Teorema Vieta pada x² - 7x + 10 = 0 belum tepat.",
      customAdvice: "Gunakan x₁ + x₂ = -b/a dan x₁ · x₂ = c/a."
    };
  },

  Q18: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: 2x² - 8x + 6 = 0 -> a = 2, b = -8, c = 6 -> x₁ + x₂ = -(-8)/2 = 4, x₁ · x₂ = 6/2 = 3
    const hasSum4 = StepAnalyzer.contains(combined, "x1 + x2 = 4") || StepAnalyzer.contains(combined, "x1+x2=4") || StepAnalyzer.contains(combined, "4");
    const hasProd3 = StepAnalyzer.contains(combined, "x1 * x2 = 3") || StepAnalyzer.contains(combined, "x1.x2 = 3") || StepAnalyzer.contains(combined, "x1x2 = 3") || StepAnalyzer.contains(combined, "3");

    if (hasSum4 && hasProd3 && (StepAnalyzer.contains(combined, "8/2") || StepAnalyzer.contains(combined, "6/2") || StepAnalyzer.contains(combined, "4") && StepAnalyzer.contains(combined, "3"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat menerapkan rumus Vieta dengan membagi koefisien a = 2: x₁ + x₂ = 8/2 = 4 dan x₁ · x₂ = 6/2 = 3.",
        customAdvice: ""
      };
    }

    // Kesalahan E1/E2: Mengabaikan koefisien a = 2 (hanya menulis 8 dan 6)
    if (StepAnalyzer.contains(combined, "x1 + x2 = 8") || (StepAnalyzer.contains(combined, "8") && StepAnalyzer.contains(combined, "6") && !StepAnalyzer.contains(combined, "4") && !StepAnalyzer.contains(combined, "3"))) {
      return {
        primaryError: "E1",
        secondaryError: "E2",
        confidence: 95,
        evidence: "Siswa mengabaikan pembagi koefisien a = 2 dalam rumus Vieta, sehingga menjawab x₁ + x₂ = 8 dan x₁ · x₂ = 6.",
        customAdvice: "Rumus Vieta melibatkan pembagian dengan a: x₁ + x₂ = -b/a = -(-8)/2 = 4 dan x₁ · x₂ = c/a = 6/2 = 3."
      };
    }

    return {
      primaryError: "E3",
      secondaryError: "E1",
      confidence: 82,
      evidence: "Siswa belum menentukan jumlah dan hasil kali akar dengan benar untuk 2x² - 8x + 6 = 0.",
      customAdvice: "Bagi nilai -b dan c dengan koefisien a = 2."
    };
  },

  Q19: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: Akar 3 dan -5 -> x² + 2x - 15 = 0
    const hasCorrectEq = StepAnalyzer.contains(combined, "x^2 + 2x - 15 = 0") || StepAnalyzer.contains(combined, "x^2+2x-15=0") || StepAnalyzer.contains(combined, "x^2 + 2x - 15") || StepAnalyzer.contains(combined, "x^2+2x-15");

    if (hasCorrectEq) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa berhasil menyusun persamaan kuadrat baru x² + 2x - 15 = 0 dari akar-akar 3 dan -5 secara tepat.",
        customAdvice: ""
      };
    }

    // Kesalahan E2 (Prosedural): Tanda terbalik (x + 3)(x - 5) -> x² - 2x - 15 = 0
    if (StepAnalyzer.contains(combined, "x^2 - 2x - 15") || StepAnalyzer.contains(combined, "x^2-2x-15") || StepAnalyzer.contains(combined, "(x + 3)(x - 5)") || StepAnalyzer.contains(combined, "(x+3)(x-5)")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 95,
        evidence: "Siswa membalik tanda faktor linear menjadi (x + 3)(x - 5) = 0 sehingga menghasilkan x² - 2x - 15 = 0 alih-alih (x - 3)(x + 5) = 0.",
        customAdvice: "Jika x₁ = 3 dan x₂ = -5, bentuk perkalian faktornya adalah (x - 3)(x - (-5)) = (x - 3)(x + 5) = x² + 2x - 15 = 0."
      };
    }

    // Kesalahan E3 (Komputasi): Salah hitung 3 × (-5) atau 3 + (-5)
    if (StepAnalyzer.contains(combined, "x^2 + 2x + 15") || StepAnalyzer.contains(combined, "x^2 - 8x")) {
      return {
        primaryError: "E3",
        secondaryError: "E2",
        confidence: 90,
        evidence: "Siswa melakukan kesalahan perhitungan pada hasil kali atau jumlah akar.",
        customAdvice: "x₁ + x₂ = 3 + (-5) = -2 dan x₁ · x₂ = 3 × (-5) = -15."
      };
    }

    return {
      primaryError: "E2",
      secondaryError: "none",
      confidence: 82,
      evidence: "Siswa belum menyusun persamaan kuadrat dengan benar.",
      customAdvice: "Gunakan rumus x² - (x₁ + x₂)x + (x₁ · x₂) = 0."
    };
  },

  Q20: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: x² - 4x + 1 = 0 -> x₁ + x₂ = 4, x₁ · x₂ = 1 -> x₁² + x₂² = (x₁+x₂)² - 2x₁x₂ = 4² - 2(1) = 16 - 2 = 14
    if (StepAnalyzer.contains(combined, "14") || StepAnalyzer.contains(combined, "x1^2 + x2^2 = 14") || StepAnalyzer.contains(combined, "16 - 2 = 14")) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 99,
        evidence: "Siswa tepat menerapkan identitas aljabar: x₁² + x₂² = (x₁ + x₂)² - 2(x₁ · x₂) = 4² - 2(1) = 16 - 2 = 14.",
        customAdvice: ""
      };
    }

    // Kesalahan E1 (Konseptual): Menganggap x₁² + x₂² = (x₁ + x₂)² = 4² = 16 (lupa -2x₁x₂)
    if (StepAnalyzer.contains(combined, "16") || StepAnalyzer.contains(combined, "x1^2 + x2^2 = 16") || StepAnalyzer.contains(combined, "(4)^2 = 16")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menganggap x₁² + x₂² sama dengan (x₁ + x₂)² = 4² = 16, melupakan suku pengurangan aljabar -2(x₁ · x₂).",
        customAdvice: "Identitas aljabar kuadrat yang benar adalah x₁² + x₂² = (x₁ + x₂)² - 2(x₁ · x₂)."
      };
    }

    // Kesalahan E3 (Komputasi): Salah hitung 16 - 2 (misal dihitung 18 atau 12)
    if (StepAnalyzer.contains(combined, "18") || StepAnalyzer.contains(combined, "12")) {
      return {
        primaryError: "E3",
        secondaryError: "none",
        confidence: 91,
        evidence: "Siswa keliru dalam operasi pengurangan 16 - 2.",
        customAdvice: "16 - 2(1) = 14."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "E3",
      confidence: 82,
      evidence: "Siswa belum menggunakan identitas aljabar kuadrat untuk menghitung x₁² + x₂².",
      customAdvice: "Gunakan identitas x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂."
    };
  },

  // =========================================================================
  // DOMAIN D6: PENERAPAN MASALAH NYATA (Q21 - Q24) -> Fokus: E4 (Interpretasi) + E1 (Konseptual)
  // =========================================================================

  Q21: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: p = l + 3, l(l+3) = 40 -> l² + 3l - 40 = 0 -> (l+8)(l-5) = 0 -> l = 5 cm, p = 8 cm (mengabaikan l = -8)
    const hasPanjang8 = StepAnalyzer.contains(combined, "panjang = 8") || StepAnalyzer.contains(combined, "panjang 8") || StepAnalyzer.contains(combined, "p = 8");
    const hasLebar5 = StepAnalyzer.contains(combined, "lebar = 5") || StepAnalyzer.contains(combined, "lebar 5") || StepAnalyzer.contains(combined, "l = 5");

    const hasNeg8AsValid = StepAnalyzer.contains(combined, "lebar = -8") || StepAnalyzer.contains(combined, "lebar -8") || StepAnalyzer.contains(combined, "l = -8 cm") || StepAnalyzer.contains(combined, "panjang = -5");

    if (hasPanjang8 && hasLebar5 && !hasNeg8AsValid) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa memodelkan geometri l² + 3l - 40 = 0, mengabaikan nilai negatif l = -8 karena dimensi panjang harus positif (l > 0), dan menyimpulkan Lebar = 5 cm, Panjang = 8 cm secara tepat.",
        customAdvice: ""
      };
    }

    // Kesalahan E4 (Interpretasi Konteks): Memasukkan lebar = -8 cm atau tidak mengeliminasi solusi negatif
    if (hasNeg8AsValid || (StepAnalyzer.contains(combined, "-8") && !StepAnalyzer.contains(combined, "diabaikan") && !StepAnalyzer.contains(combined, "tidak memenuhi") && !StepAnalyzer.contains(combined, "> 0"))) {
      return {
        primaryError: "E4",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menyertakan nilai negatif (l = -8 cm) sebagai ukuran fisik nyata, gagal menginterpretasikan bahwa besaran geometri panjang/lebar wajib bernilai positif (l > 0).",
        customAdvice: "Dalam masalah kontekstual geometri, besaran panjang dan lebar tidak mungkin negatif, sehingga akar negatif l = -8 harus dieliminasi (tidak memenuhi syarat konteks)."
      };
    }

    // Kesalahan E2 (Prosedural): Salah memodelkan persamaan kuadrat
    if (StepAnalyzer.contains(combined, "l^2 + 3l + 40") || StepAnalyzer.contains(combined, "l^2 - 3l - 40")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 91,
        evidence: "Siswa keliru menyusun persamaan aljabar dari kalimat 'panjang 3 cm lebih dari lebar dan luas 40 cm²'.",
        customAdvice: "Jika lebar = l, maka panjang = l + 3. Persamaan luas: l(l + 3) = 40 -> l² + 3l - 40 = 0."
      };
    }

    return {
      primaryError: "E4",
      secondaryError: "E2",
      confidence: 82,
      evidence: "Siswa belum menyelesaikan pemodelan geometri persegi panjang dengan tepat.",
      customAdvice: "Selesaikan l² + 3l - 40 = 0 -> (l + 8)(l - 5) = 0, ambil l = 5 cm."
    };
  },

  Q22: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: h(t) = -5t² + 20t + 1 = 0 -> 5t² - 20t - 1 = 0 -> t ≈ 4.05 detik (mengabaikan t ≈ -0.05 detik)
    const hasTime4 = StepAnalyzer.contains(combined, "4.05") || StepAnalyzer.contains(combined, "4,05") || StepAnalyzer.contains(combined, "4.0") || StepAnalyzer.contains(combined, "4 detik") || StepAnalyzer.contains(combined, "t = 4");

    const hasNegTimeAsAnswer = StepAnalyzer.contains(combined, "t = -0.05") || StepAnalyzer.contains(combined, "-0.05 detik") || (StepAnalyzer.contains(combined, "-0.05") && !StepAnalyzer.contains(combined, "tidak memenuhi"));

    // Deteksi jika siswa mencari titik puncak/tinggi maksimum t = -b/(2a) = 2 detik
    const answeredVertexT2 = StepAnalyzer.contains(combined, "t = 2") || StepAnalyzer.contains(combined, "2 detik") || StepAnalyzer.contains(combined, "tinggi maksimum");

    if (hasTime4 && !hasNegTimeAsAnswer && !answeredVertexT2) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat memodelkan kondisi saat menyentuh tanah h(t) = 0, menyelesaikan persamaan kuadrat, dan memilih waktu positif t ≈ 4.05 detik.",
        customAdvice: ""
      };
    }

    // Kesalahan E4 (Interpretasi): Menghitung waktu tinggi maksimum (t = 2 detik) alih-alih saat menyentuh tanah h(t) = 0
    if (answeredVertexT2 && !hasTime4) {
      return {
        primaryError: "E4",
        secondaryError: "E1",
        confidence: 95,
        evidence: "Siswa menghitung waktu saat mencapai titik puncak / tinggi maksimum (t = -b/(2a) = 2 detik), padahal soal menanyakan kapan bola menyentuh tanah (h(t) = 0).",
        customAdvice: "Menyentuh tanah berarti ketinggian h(t) = 0, bukan mencari titik puncak parabola."
      };
    }

    // Kesalahan E4: Memilih waktu negatif
    if (hasNegTimeAsAnswer) {
      return {
        primaryError: "E4",
        secondaryError: "none",
        confidence: 94,
        evidence: "Siswa tidak mengeliminasi nilai waktu negatif t ≈ -0.05 detik dalam konteks fisis gerak.",
        customAdvice: "Waktu pelemparan bola selalu bernilai t ≥ 0, sehingga solusi waktu negatif diabaikan."
      };
    }

    return {
      primaryError: "E4",
      secondaryError: "E2",
      confidence: 82,
      evidence: "Siswa belum memodelkan kondisi h(t) = 0 dengan benar.",
      customAdvice: "Gunakan h(t) = 0 -> -5t² + 20t + 1 = 0 dan hitung nilai t positif dengan rumus ABC."
    };
  },

  Q23: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();

    // Kunci: Luas 96 m², p = l + 4 -> l(l+4) = 96 -> l² + 4l - 96 = 0 -> (l+12)(l-8) = 0 -> Lebar = 8 m, Panjang = 12 m
    const hasPanjang12 = StepAnalyzer.contains(combined, "panjang = 12") || StepAnalyzer.contains(combined, "panjang 12") || StepAnalyzer.contains(combined, "p = 12");
    const hasLebar8 = StepAnalyzer.contains(combined, "lebar = 8") || StepAnalyzer.contains(combined, "lebar 8") || StepAnalyzer.contains(combined, "l = 8");

    const hasNeg12AsValid = StepAnalyzer.contains(combined, "lebar = -12") || StepAnalyzer.contains(combined, "lebar -12") || StepAnalyzer.contains(combined, "l = -12 m");

    if (hasPanjang12 && hasLebar8 && !hasNeg12AsValid) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa tepat memodelkan l² + 4l - 96 = 0, memfaktorkan menjadi (l + 12)(l - 8) = 0, mengeliminasi l = -12, dan mendapatkan Lebar = 8 m serta Panjang = 12 m.",
        customAdvice: ""
      };
    }

    // Kesalahan E4 (Interpretasi): Menyertakan ukuran negatif lebar = -12 m
    if (hasNeg12AsValid || (StepAnalyzer.contains(combined, "-12") && !StepAnalyzer.contains(combined, "diabaikan") && !StepAnalyzer.contains(combined, "tidak memenuhi"))) {
      return {
        primaryError: "E4",
        secondaryError: "none",
        confidence: 96,
        evidence: "Siswa menyertakan nilai negatif (l = -12 m) sebagai dimensi nyata taman tanpa eliminasi konteks fisis.",
        customAdvice: "Ukuran dimensi nyata tidak boleh bernilai negatif; selalu ambil akar positif l = 8 m."
      };
    }

    // Kesalahan E2 (Prosedural): Salah faktorisasi 96
    if (StepAnalyzer.contains(combined, "(l+16)(l-6)") || StepAnalyzer.contains(combined, "(l-12)(l+8)")) {
      return {
        primaryError: "E2",
        secondaryError: "none",
        confidence: 92,
        evidence: "Siswa keliru memfaktorkan l² + 4l - 96 = 0.",
        customAdvice: "Pasangan faktor dari -96 yang jumlahnya +4 adalah +12 dan -8."
      };
    }

    return {
      primaryError: "E4",
      secondaryError: "E2",
      confidence: 82,
      evidence: "Siswa belum menentukan dimensi panjang dan lebar taman dengan benar.",
      customAdvice: "Faktorkan l² + 4l - 96 = 0 -> (l + 12)(l - 8) = 0."
    };
  },

  Q24: (steps, answer) => {
    const combined = `${steps} ${answer}`.toLowerCase();
    const isFalse = StepAnalyzer.contains(combined, "salah") || StepAnalyzer.contains(combined, "tidak benar") || StepAnalyzer.contains(combined, "keliru") || StepAnalyzer.contains(combined, "bukan");
    const isTrue = StepAnalyzer.contains(combined, "benar") && !isFalse;

    // Kunci: SALAH. D < 0 berarti tidak memiliki akar real (bukan akarnya bernilai negatif).
    if (isFalse && (StepAnalyzer.contains(combined, "tidak memiliki akar real") || StepAnalyzer.contains(combined, "imajiner") || StepAnalyzer.contains(combined, "contoh") || StepAnalyzer.contains(combined, "tidak real") || StepAnalyzer.contains(combined, "bukan akar negatif"))) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 99,
        evidence: "Siswa tepat menyanggah pernyataan tersebut (SALAH) dan menjelaskan bahwa D < 0 menandakan tidak adanya akar real (akar imajiner), bukan akarnya bernilai negatif.",
        customAdvice: ""
      };
    }

    if (isFalse) {
      return {
        primaryError: "E0",
        secondaryError: "none",
        confidence: 90,
        evidence: "Siswa menyatakan pernyataan tersebut salah.",
        customAdvice: ""
      };
    }

    // Kesalahan E1 (Konseptual): Mengiyakan pernyataan (mengatakan BENAR karena D negatif maka akar negatif)
    if (isTrue || StepAnalyzer.contains(combined, "benar karena d negatif maka x negatif") || StepAnalyzer.contains(combined, "benar karena nilai d di bawah nol")) {
      return {
        primaryError: "E1",
        secondaryError: "none",
        confidence: 98,
        evidence: "Siswa membenarkan pernyataan keliru tersebut. Ini adalah miskonsepsi konseptual berat yang menyamakan tanda negatif pada diskriminan dengan tanda nilai penyelesaian x.",
        customAdvice: "Tanda nilai D menentukan jenis realitas akar (ada atau tidaknya penyelesaian bilangan real), bukan tanda positif/negatif dari nilai x. Persamaan dengan akar negatif seperti (x+2)(x+3)=0 justru memiliki D = 1 > 0."
      };
    }

    return {
      primaryError: "E1",
      secondaryError: "none",
      confidence: 85,
      evidence: "Siswa belum mampu mengevaluasi miskonsepsi hubungan nilai diskriminan negatif dengan nilai akar persamaan.",
      customAdvice: "Pahami bahwa D < 0 berarti akarnya imajiner / tidak ada bilangan real yang memenuhi."
    };
  }
};
