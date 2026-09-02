/**
 * samplePresets.js - Contoh Jawaban Pengujian Cepat (Preset Simulasi Siswa)
 * Menyediakan simulasi respon siswa untuk pengujian taksonomi E0, E1, E2, E3, E4.
 */

export const SAMPLE_PRESETS = [
  // =========================================================================
  // PRESET 1: E0 - Jawaban Akurat / Bebas Kesalahan (Q5 - D2 Faktorisasi)
  // =========================================================================
  {
    id: "preset-e0-q5",
    label: "[E0] Q5: Jawaban Benar & Langkah Lengkap",
    category: "E0",
    questionId: "Q5",
    studentId: "Siswa_Aisyah_01",
    description: "Siswa memfaktorkan (x - 3)(x - 4) = 0 dan menemukan x = 3 atau x = 4 secara runtut.",
    studentAnswer: "x = 3 atau x = 4",
    studentSteps: `x² - 7x + 12 = 0
Mencari dua angka:
p + q = -7
p × q = 12
Pasangan faktor yang tepat: -3 dan -4
Bentuk faktorisasi:
(x - 3)(x - 4) = 0
x - 3 = 0  atau  x - 4 = 0
x = 3  atau  x = 4`
  },

  // =========================================================================
  // PRESET 2: E1 - Kesalahan Konseptual (Q24 - D6 Miskonsepsi Diskriminan)
  // =========================================================================
  {
    id: "preset-e1-q24",
    label: "[E1] Q24: Miskonsepsi D < 0 Dianggap Nilai x Negatif",
    category: "E1",
    questionId: "Q24",
    studentId: "Siswa_Budi_02",
    description: "Siswa menganggap pernyataan benar karena nilai diskriminan negatif berarti akar x negatif.",
    studentAnswer: "Benar, pernyataan tersebut tepat.",
    studentSteps: `Benar, karena nilai D negatif berarti berada di bawah nol, sehingga otomatis akar-akar x yang dihasilkan juga bernilai negatif. Misalnya jika D = -12 maka x = -12.`
  },

  // =========================================================================
  // PRESET 3: E1 - Kesalahan Konseptual (Q3 - D1 Koefisien Dianggap Akar)
  // =========================================================================
  {
    id: "preset-e1-q3",
    label: "[E1] Q3: Koefisien Persamaan Langsung Dianggap Nilai Akar",
    category: "E1",
    questionId: "Q3",
    studentId: "Siswa_Cahyo_03",
    description: "Siswa membenarkan pernyataan karena melihat angka 5 dan 6 pada x² - 5x + 6 = 0.",
    studentAnswer: "Benar, akarnya x = 5 dan x = 6.",
    studentSteps: `Pernyataan siswa itu benar karena pada persamaan x² - 5x + 6 = 0 terdapat angka 5 di depan x dan konstanta 6, sehingga akarnya langsung x = 5 dan x = 6.`
  },

  // =========================================================================
  // PRESET 4: E1 - Kesalahan Konseptual (Q20 - D5 Identitas Aljabar)
  // =========================================================================
  {
    id: "preset-e1-q20",
    label: "[E1] Q20: Mengabaikan Pengurangan 2x₁x₂ pada x₁² + x₂²",
    category: "E1",
    questionId: "Q20",
    studentId: "Siswa_Dian_04",
    description: "Siswa menganggap x₁² + x₂² = (x₁ + x₂)² = 4² = 16.",
    studentAnswer: "x₁² + x₂² = 16",
    studentSteps: `x² - 4x + 1 = 0
x₁ + x₂ = -(-4)/1 = 4
Maka x₁² + x₂² = (x₁ + x₂)²
x₁² + x₂² = 4² = 16`
  },

  // =========================================================================
  // PRESET 5: E2 - Kesalahan Prosedural (Q5 - D2 Inversi Tanda Pembuat Nol)
  // =========================================================================
  {
    id: "preset-e2-q5",
    label: "[E2] Q5: Tanda Pembuat Nol Terbalik (x = -3 atau x = -4)",
    category: "E2",
    questionId: "Q5",
    studentId: "Siswa_Eko_05",
    description: "Faktorisasi benar (x - 3)(x - 4) = 0 namun akar disimpulkan x = -3 atau x = -4.",
    studentAnswer: "x = -3 atau x = -4",
    studentSteps: `x² - 7x + 12 = 0
(x - 3)(x - 4) = 0
Maka x = -3 atau x = -4`
  },

  // =========================================================================
  // PRESET 6: E2 - Kesalahan Prosedural (Q15 - D4 Lupa Membalik Pertidaksamaan)
  // =========================================================================
  {
    id: "preset-e2-q15",
    label: "[E2] Q15: Lupa Membalik Tanda Pertidaksamaan Saat Dibagi -4",
    category: "E2",
    questionId: "Q15",
    studentId: "Siswa_Fajar_06",
    description: "Siswa menuliskan -4k > -36 disederhanakan menjadi k > 9.",
    studentAnswer: "k > 9",
    studentSteps: `Syarat dua akar real berbeda: D > 0
b² - 4ac > 0
(-6)² - 4(1)(k) > 0
36 - 4k > 0
-4k > -36
Bagi dengan -4:
k > 9`
  },

  // =========================================================================
  // PRESET 7: E2 - Kesalahan Prosedural (Q2 - D1 Tanda Minus Koefisien Diabaikan)
  // =========================================================================
  {
    id: "preset-e2-q2",
    label: "[E2] Q2: Mengabaikan Tanda Minus pada Koefisien (b = 7, c = 6)",
    category: "E2",
    questionId: "Q2",
    studentId: "Siswa_Gita_07",
    description: "Koefisien dituliskan positif semua: a = 3, b = 7, c = 6.",
    studentAnswer: "a = 3, b = 7, c = 6",
    studentSteps: `Persamaan: 3x² - 7x - 6 = 0
Bentuk umum: ax² + bx + c = 0
Diperoleh:
a = 3
b = 7
c = 6`
  },

  // =========================================================================
  // PRESET 8: E3 - Kesalahan Komputasi (Q10 - D3 Salah Perkalian Tanda -4ac)
  // =========================================================================
  {
    id: "preset-e3-q10",
    label: "[E3] Q10: Salah Perkalian Tanda Negatif (-4ac = -16 -> D = -7)",
    category: "E3",
    questionId: "Q10",
    studentId: "Siswa_Hendra_08",
    description: "Siswa menghitung -4(1)(-4) = -16 sehingga D = 9 - 16 = -7.",
    studentAnswer: "Tidak ada penyelesaian real (D = -7)",
    studentSteps: `x² - 3x - 4 = 0
a = 1, b = -3, c = -4
x = [-(-3) ± √((-3)² - 4(1)(-4))] / (2(1))
x = [3 ± √(9 - 16)] / 2
x = [3 ± √(-7)] / 2
Karena di dalam akar negatif 9 - 16 = -7, maka tidak ada akar real.`
  },

  // =========================================================================
  // PRESET 9: E3 - Kesalahan Komputasi (Q11 - D3 Lupa Mengalikan Penyebut 2a)
  // =========================================================================
  {
    id: "preset-e3-q11",
    label: "[E3] Q11: Penyebut Rumus Kuadratik Hanya Dibagi 2 (Bukan 2a = 4)",
    category: "E3",
    questionId: "Q11",
    studentId: "Siswa_Indah_09",
    description: "Penyebut tidak dikalikan dengan a = 2 sehingga x = (-3 ± 5)/2.",
    studentAnswer: "x = 1 atau x = -4",
    studentSteps: `2x² + 3x - 2 = 0
a = 2, b = 3, c = -2
x = [-3 ± √(3² - 4(2)(-2))] / 2
x = [-3 ± √(9 + 16)] / 2
x = [-3 ± √25] / 2
x = [-3 ± 5] / 2
x₁ = (-3 + 5)/2 = 2/2 = 1
x₂ = (-3 - 5)/2 = -8/2 = -4`
  },

  // =========================================================================
  // PRESET 10: E4 - Kesalahan Interpretasi (Q21 - D6 Memilih Lebar Negatif)
  // =========================================================================
  {
    id: "preset-e4-q21",
    label: "[E4] Q21: Tidak Mengeliminasi Dimensi Negatif (Lebar = -8 cm)",
    category: "E4",
    questionId: "Q21",
    studentId: "Siswa_Joko_10",
    description: "Siswa menyatakan lebar persegi panjang bisa bernilai -8 cm.",
    studentAnswer: "Lebar = 5 cm atau lebar = -8 cm",
    studentSteps: `Misalkan lebar = l, panjang = l + 3
Luas = 40
l(l + 3) = 40
l² + 3l - 40 = 0
(l + 8)(l - 5) = 0
l = -8  atau  l = 5
Jadi ukuran lebar yang mungkin adalah 5 cm atau -8 cm.`
  },

  // =========================================================================
  // PRESET 11: E4 - Kesalahan Interpretasi (Q22 - D6 Waktu Puncak vs Tanah)
  // =========================================================================
  {
    id: "preset-e4-q22",
    label: "[E4] Q22: Mencari Waktu Titik Puncak Alih-alih Bola Menyentuh Tanah",
    category: "E4",
    questionId: "Q22",
    studentId: "Siswa_Kartika_11",
    description: "Siswa menghitung waktu puncak parabola t = -b/(2a) = 2 detik.",
    studentAnswer: "t = 2 detik",
    studentSteps: `Fungsi: h(t) = -5t² + 20t + 1
Waktu dicari dengan rumus titik puncak:
t = -b / (2a)
t = -20 / (2 × -5)
t = -20 / -10 = 2 detik
Jadi bola berada di tanah saat t = 2 detik.`
  }
];
