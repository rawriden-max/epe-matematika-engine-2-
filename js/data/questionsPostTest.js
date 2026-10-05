/**
 * questionsPostTest.js - 24 Soal Post-Test Persamaan Kuadrat (EPE Parallel Form)
 * Domain D1-D6 sama dengan pre-test. Butir soal paralel berbeda dengan tingkat kesulitan setara.
 * Bloom Taksonomi: Level C3 (Aplikasi) & C4 (Analisis).
 */

export const POST_TEST_QUESTIONS = [
  // --- Domain D1: Konsep Dasar (Q1 - Q4) ---
  {
    id: "PT-Q1",
    number: 1,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Identifikasi Persamaan Kuadrat dari Konteks Nyata",
    promptText: "Empat pernyataan bentuk aljabar:\nA. x² = 25\nB. 2x - 3 = 7\nC. x(x + 1) = 56\nD. 1/x + 1/(x + 1) = 1/2\nManakah di antara bentuk di atas yang merupakan persamaan kuadrat setelah disederhanakan?",
    options: [
      { key: "A", text: "A saja" },
      { key: "B", text: "A dan C" },
      { key: "C", text: "A, C, dan D" },
      { key: "D", text: "Hanya B" }
    ],
    latexEquation: "A.\\ x^2 = 25 \\quad B.\\ 2x - 3 = 7 \\quad C.\\ x(x+1) = 56 \\quad D.\\ \\frac{1}{x} + \\frac{1}{x+1} = \\frac{1}{2}",
    topic: "Pengenalan Persamaan Kuadrat dari Berbagai Bentuk",
    standardAnswer: "C (A, C, dan D)",
    standardSteps: "- A: x² - 25 = 0 (Derajat 2, Persamaan Kuadrat)\n- B: 2x - 10 = 0 (Derajat 1, Persamaan Linier)\n- C: x² + x - 56 = 0 (Derajat 2, Persamaan Kuadrat)\n- D: Dikalikan 2x(x+1) menjadi 2(x+1) + 2x = x(x+1) => 4x + 2 = x² + x => x² - 3x - 2 = 0 (Derajat 2, Persamaan Kuadrat)\nJadi bentuk A, C, dan D semuanya menghasilkan persamaan kuadrat."
  },
  {
    id: "PT-Q2",
    number: 2,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Mengubah ke Bentuk Baku ax² + bx + c = 0",
    promptText: "Ubah persamaan (2x - 1)(x + 4) = x² + 3 ke dalam bentuk baku ax² + bx + c = 0, kemudian tentukan nilai a, b, dan c.",
    latexEquation: "(2x - 1)(x + 4) = x^2 + 3",
    topic: "Transformasi Aljabar ke Bentuk Baku",
    standardAnswer: "a = 1, b = 7, c = -7",
    standardSteps: "Jabarkan ruas kiri:\n(2x - 1)(x + 4) = 2x² + 8x - x - 4 = 2x² + 7x - 4\nBentuk persamaan:\n2x² + 7x - 4 = x² + 3\nPindahkan seluruh suku ke ruas kiri:\n2x² - x² + 7x - 4 - 3 = 0\nx² + 7x - 7 = 0\nMaka: a = 1, b = 7, c = -7."
  },
  {
    id: "PT-Q3",
    number: 3,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Verifikasi Akar dengan Substitusi",
    promptText: "Apakah x = -3 merupakan akar penyelesaian dari persamaan kuadrat 2x² + 5x - 3 = 0? Tunjukkan pembuktiannya.",
    latexEquation: "2x^2 + 5x - 3 = 0, \\quad x = -3",
    topic: "Konsep Definisi Akar Persamaan Kuadrat",
    standardAnswer: "Ya, x = -3 adalah akar penyelesaian.",
    standardSteps: "Substitusi nilai x = -3 ke ruas kiri:\n2(-3)² + 5(-3) - 3\n= 2(9) - 15 - 3\n= 18 - 15 - 3\n= 0\nKarena hasil ruas kiri sama dengan ruas kanan (0 = 0), maka x = -3 terbukti benar merupakan akar persamaan kuadrat tersebut."
  },
  {
    id: "PT-Q4",
    number: 4,
    domainId: "D1",
    domainName: "Konsep Dasar",
    title: "Analisis Komparatif Jenis Akar Dua Persamaan",
    promptText: "Diberikan dua persamaan kuadrat:\n(1) x² - 6x + 9 = 0\n(2) x² + 2x + 5 = 0\nTentukan jenis akar dari masing-masing persamaan tanpa menyelesaikan secara faktorisasi.",
    latexEquation: "(1)\\ x^2 - 6x + 9 = 0 \\quad (2)\\ x^2 + 2x + 5 = 0",
    topic: "Perbandingan Nilai Diskriminan Dasar",
    standardAnswer: "Persamaan (1) memiliki dua akar kembar real (D = 0). Persamaan (2) tidak memiliki akar real / imajiner (D < 0).",
    standardSteps: "Gunakan D = b² - 4ac:\n(1) a=1, b=-6, c=9:\nD = (-6)² - 4(1)(9) = 36 - 36 = 0 => Memiliki dua akar real yang sama (kembar), yaitu x = 3.\n(2) a=1, b=2, c=5:\nD = 2² - 4(1)(5) = 4 - 20 = -16 < 0 => Tidak memiliki akar real (akar kompleks/imajiner)."
  },

  // --- Domain D2: Faktorisasi (Q5 - Q8) ---
  {
    id: "PT-Q5",
    number: 5,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi GCF + Selisih Dua Kuadrat",
    promptText: "Tentukan himpunan penyelesaian dari 3x² - 12 = 0 menggunakan metode faktorisasi.",
    latexEquation: "3x^2 - 12 = 0",
    topic: "Faktorisasi FPB & Selisih Dua Kuadrat",
    standardAnswer: "x = 2 atau x = -2 (HP = {-2, 2})",
    standardSteps: "Keluarkan FPB = 3:\n3(x² - 4) = 0\nFaktorkan selisih dua kuadrat (x² - a² = (x - a)(x + a)):\n3(x - 2)(x + 2) = 0\nx - 2 = 0  atau  x + 2 = 0\nx = 2  atau  x = -2."
  },
  {
    id: "PT-Q6",
    number: 6,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi Bentuk Kuadrat Sempurna (Trinomial)",
    promptText: "Selesaikan persamaan x² - 10x + 25 = 0 dengan pemfaktoran. Mengapa persamaannya hanya menghasilkan satu nilai akar tunggal?",
    latexEquation: "x^2 - 10x + 25 = 0",
    topic: "Kuadrat Sempurna & Sifat Dua Akar Kembar",
    standardAnswer: "x = 5 (akar kembar); karena merupakan bentuk kuadrat sempurna (x - 5)² = 0.",
    standardSteps: "Cari dua bilangan dengan jumlah -10 dan hasil kali 25:\nBilangan tersebut adalah -5 dan -5.\n(x - 5)(x - 5) = 0  =>  (x - 5)² = 0\nx - 5 = 0  =>  x = 5.\nHanya ada satu nilai unik karena kedua faktornya identik (akar real kembar dengan D = 0)."
  },
  {
    id: "PT-Q7",
    number: 7,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Faktorisasi 6x² - x - 2 = 0 Metode Pengelompokan (AC)",
    promptText: "Tentukan akar-akar dari 6x² - x - 2 = 0 dengan metode faktorisasi AC (pengelompokan).",
    latexEquation: "6x^2 - x - 2 = 0",
    topic: "Faktorisasi a > 1 dengan Penguraian Suku Tengah",
    standardAnswer: "x = 2/3 atau x = -1/2",
    standardSteps: "Nilai a·c = 6 × (-2) = -12. Nilai b = -1.\nCari dua bilangan hasil kali -12 dan jumlah -1: yaitu -4 dan 3.\nUraikan suku tengah:\n6x² - 4x + 3x - 2 = 0\nKelompokkan suku-suku:\n2x(3x - 2) + 1(3x - 2) = 0\n(2x + 1)(3x - 2) = 0\n2x + 1 = 0  =>  x = -1/2\n3x - 2 = 0  =>  x = 2/3."
  },
  {
    id: "PT-Q8",
    number: 8,
    domainId: "D2",
    domainName: "Faktorisasi",
    title: "Analisis Kesalahan Faktorisasi Dua Siswa",
    promptText: "Pada persamaan x² - 9x + 18 = 0, Siswa A menjawab (x - 3)(x - 6) = 0 sehingga x = 3 atau x = 6. Siswa B menjawab (x - 9)(x - 2) = 0 sehingga x = 9 atau x = 2. Manakah siswa yang benar dan apa letak kekeliruan siswa lainnya?",
    latexEquation: "x^2 - 9x + 18 = 0",
    topic: "Evaluasi dan Refleksi Kesalahan Tanda Faktorisasi",
    standardAnswer: "Siswa A benar. Siswa B keliru pada syarat penjumlahan p + q.",
    standardSteps: "Syarat pemfaktoran x² + bx + c = (x + p)(x + q):\n1) p × q = c = 18\n2) p + q = b = -9\n- Uji Siswa A: (-3) × (-6) = 18 (Benar), (-3) + (-6) = -9 (Benar). Maka Siswa A BENAR (akar x = 3 atau 6).\n- Uji Siswa B: (-9) × (-2) = 18 (Benar), tetapi (-9) + (-2) = -11 ≠ -9 (Salah). Siswa B gagal memenuhi syarat jumlah koefisien x."
  },

  // --- Domain D3: Rumus ABC (Q9 - Q12) ---
  {
    id: "PT-Q9",
    number: 9,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Rumus ABC — Hasil Akar Irasional Bentuk Sederhana",
    promptText: "Selesaikan persamaan x² + 4x - 1 = 0 menggunakan rumus kuadratik (Rumus ABC). Tuliskan akar-akarnya dalam bentuk akar paling sederhana.",
    latexEquation: "x^2 + 4x - 1 = 0",
    topic: "Rumus ABC dengan Penyederhanaan Bentuk Akar",
    standardAnswer: "x = -2 + √5 atau x = -2 - √5",
    standardSteps: "a = 1, b = 4, c = -1\nx = [-b ± √(b² - 4ac)] / (2a)\nx = [-4 ± √(4² - 4(1)(-1))] / (2 × 1)\nx = [-4 ± √(16 + 4)] / 2\nx = [-4 ± √20] / 2\nSederhanakan √20 = √(4 × 5) = 2√5:\nx = [-4 ± 2√5] / 2 = -2 ± √5\nJadi x₁ = -2 + √5 dan x₂ = -2 - √5."
  },
  {
    id: "PT-Q10",
    number: 10,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Rumus ABC pada Koefisien Pecahan",
    promptText: "Tentukan akar-akar persamaan (1/2)x² - x - 3/2 = 0 menggunakan rumus ABC.",
    latexEquation: "\\frac{1}{2}x^2 - x - \\frac{3}{2} = 0",
    topic: "Penanganan Koefisien Pecahan Sebelum Rumus ABC",
    standardAnswer: "x = 3 atau x = -1",
    standardSteps: "Agar perhitungan lebih sederhana, kalikan kedua ruas dengan 2:\nx² - 2x - 3 = 0 (a = 1, b = -2, c = -3)\nGunakan rumus ABC:\nx = [-(-2) ± √((-2)² - 4(1)(-3))] / (2(1))\nx = [2 ± √(4 + 12)] / 2\nx = [2 ± √16] / 2\nx = [2 ± 4] / 2\nx₁ = (2 + 4)/2 = 3\nx₂ = (2 - 4)/2 = -1."
  },
  {
    id: "PT-Q11",
    number: 11,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Strategi Pemilihan Metode: 4x² - 12x + 9 = 0",
    promptText: "Diberikan persamaan 4x² - 12x + 9 = 0. Tentukan akarnya dan jelaskan metode mana yang paling efisien.",
    latexEquation: "4x^2 - 12x + 9 = 0",
    topic: "Pemilihan Metode Penyelesaian Optimal",
    standardAnswer: "x = 3/2 (kembar); Metode faktorisasi kuadrat sempurna paling efisien.",
    standardSteps: "1. Cek diskriminan: D = (-12)² - 4(4)(9) = 144 - 144 = 0 (Akar kembar).\n2. Karena suku pertama (2x)² dan suku terakhir 3² dengan suku tengah 2(2x)(3) = 12x, maka ini bentuk (2x - 3)² = 0.\n3. 2x - 3 = 0  =>  x = 3/2 (akar kembar).\nJika menggunakan rumus ABC: x = [12 ± 0] / 8 = 12/8 = 3/2. Hasil sama, namun faktorisasi kuadrat sempurna langsung didapat dalam 1 langkah."
  },
  {
    id: "PT-Q12",
    number: 12,
    domainId: "D3",
    domainName: "Rumus ABC",
    title: "Rumus ABC: Bentuk Eksak dan Nilai Desimal",
    promptText: "Selesaikan x² - 5x + 2 = 0 menggunakan rumus ABC. Tuliskan jawaban dalam bentuk eksak radikal dan nilai hampiran desimal hingga dua angka di belakang koma (√17 ≈ 4.12).",
    latexEquation: "x^2 - 5x + 2 = 0",
    topic: "Representasi Eksak vs Aproksimasi Desimal",
    standardAnswer: "Bentuk eksak: x = (5 ± √17)/2; Bentuk desimal: x₁ ≈ 4.56 dan x₂ ≈ 0.44",
    standardSteps: "a = 1, b = -5, c = 2\nx = [-(-5) ± √((-5)² - 4(1)(2))] / 2\nx = [5 ± √(25 - 8)] / 2\nx = [5 ± √17] / 2 (Bentuk eksak)\nSubstitusi √17 ≈ 4.12:\nx₁ ≈ (5 + 4.12) / 2 = 9.12 / 2 = 4.56\nx₂ ≈ (5 - 4.12) / 2 = 0.88 / 2 = 0.44."
  },

  // --- Domain D4: Diskriminan (Q13 - Q16) ---
  {
    id: "PT-Q13",
    number: 13,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "D > 0: Rasionalitas Akar Persamaan Kuadrat",
    promptText: "Hitung nilai diskriminan dari 3x² - 7x + 2 = 0, lalu simpulkan apakah akar-akarnya bilangan real rasional atau irasional.",
    latexEquation: "3x^2 - 7x + 2 = 0",
    topic: "Karakteristik Diskriminan dan Rasionalitas Akar",
    standardAnswer: "D = 25 > 0; Dua akar real berbeda dan RASIONAL.",
    standardSteps: "a = 3, b = -7, c = 2\nD = b² - 4ac = (-7)² - 4(3)(2) = 49 - 24 = 25.\nAnalisis:\n1) D > 0, maka ada dua akar real berlainan.\n2) D = 25 = 5² (bilangan kuadrat sempurna), maka √D = 5 adalah bilangan bulat/rasional.\nOleh karena itu, kedua akar bertipe real dan RASIONAL (yaitu x = (7 ± 5)/6 => x = 2 atau x = 1/3)."
  },
  {
    id: "PT-Q14",
    number: 14,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Analisis Tiga Kasus Nilai Parameter k pada x² + kx + 4 = 0",
    promptText: "Tentukan batasan nilai k pada persamaan x² + kx + 4 = 0 agar:\na) Memiliki dua akar real berbeda\nb) Memiliki akar kembar\nc) Tidak memiliki akar real",
    latexEquation: "x^2 + kx + 4 = 0",
    topic: "Analisis Komprehensif Nilai Diskriminan",
    standardAnswer: "a) k < -4 atau k > 4; b) k = 4 atau k = -4; c) -4 < k < 4",
    standardSteps: "D = b² - 4ac = k² - 4(1)(4) = k² - 16.\na) Dua akar real berbeda (D > 0):\nk² - 16 > 0  =>  (k - 4)(k + 4) > 0  =>  k < -4 atau k > 4.\nb) Akar kembar (D = 0):\nk² - 16 = 0  =>  k = ±4.\nc) Tidak memiliki akar real (D < 0):\nk² - 16 < 0  =>  -4 < k < 4."
  },
  {
    id: "PT-Q15",
    number: 15,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Penentuan Parameter mx² - 6x + 3 = 0 Agar Berakar Kembar",
    promptText: "Tentukan nilai konstanta m (m ≠ 0) agar persamaan kuadrat mx² - 6x + 3 = 0 memiliki dua akar kembar.",
    latexEquation: "mx^2 - 6x + 3 = 0, \\quad m \\neq 0",
    topic: "Penerapan Syarat D = 0 dengan Parameter pada Suku a",
    standardAnswer: "m = 3",
    standardSteps: "Syarat akar kembar: D = 0.\na = m, b = -6, c = 3\nD = (-6)² - 4(m)(3) = 0\n36 - 12m = 0\n12m = 36  =>  m = 3.\nVerifikasi: 3x² - 6x + 3 = 0 => 3(x² - 2x + 1) = 0 => 3(x - 1)² = 0 (terbukti akar kembar x = 1)."
  },
  {
    id: "PT-Q16",
    number: 16,
    domainId: "D4",
    domainName: "Diskriminan",
    title: "Syarat D ≥ 0 pada Persamaan Kuadrat Berparameter Kompleks",
    promptText: "Tentukan rentang nilai p agar persamaan (p + 1)x² - 2px + (p - 2) = 0 selalu memiliki akar real (p ≠ -1).",
    latexEquation: "(p + 1)x^2 - 2px + (p - 2) = 0, \\quad p \\neq -1",
    topic: "Pertidaksamaan Diskriminan Aljabar Kompleks",
    standardAnswer: "p ≥ -2 dan p ≠ -1",
    standardSteps: "Syarat memiliki akar real: D ≥ 0.\na = (p + 1), b = -2p, c = (p - 2)\nD = (-2p)² - 4(p + 1)(p - 2)\nD = 4p² - 4(p² - p - 2)\nD = 4p² - 4p² + 4p + 8\nD = 4p + 8\nSyarat D ≥ 0:\n4p + 8 ≥ 0  =>  4p ≥ -8  =>  p ≥ -2.\nDengan syarat koefisien derajat dua a ≠ 0, maka p ≠ -1.\nJadi batasannya adalah p ≥ -2 dengan p ≠ -1."
  },

  // --- Domain D5: Hubungan Akar (Q17 - Q20) ---
  {
    id: "PT-Q17",
    number: 17,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Teorema Vieta: Nilai x₁² + x₂² dari 2x² - 6x + 1 = 0",
    promptText: "Jika x₁ dan x₂ adalah akar-akar dari 2x² - 6x + 1 = 0, tentukan nilai dari x₁ + x₂, x₁·x₂, dan x₁² + x₂².",
    latexEquation: "2x^2 - 6x + 1 = 0",
    topic: "Teorema Vieta dan Identitas Aljabar Kuadrat",
    standardAnswer: "x₁ + x₂ = 3; x₁·x₂ = 1/2; x₁² + x₂² = 8",
    standardSteps: "Dari persamaan: a = 2, b = -6, c = 1.\n1) x₁ + x₂ = -b/a = -(-6)/2 = 3.\n2) x₁·x₂ = c/a = 1/2.\n3) Identitas kuadrat:\nx₁² + x₂² = (x₁ + x₂)² - 2x₁x₂\nx₁² + x₂² = (3)² - 2(1/2) = 9 - 1 = 8."
  },
  {
    id: "PT-Q18",
    number: 18,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Teorema Vieta: Jumlah Kebalikan Akar (1/x₁ + 1/x₂)",
    promptText: "Tanpa mencari masing-masing nilai akar persamaan x² - 5x + 3 = 0, tentukan nilai dari 1/x₁ + 1/x₂.",
    latexEquation: "x^2 - 5x + 3 = 0",
    topic: "Manipulasi Pecahan Aljabar Vieta",
    standardAnswer: "1/x₁ + 1/x₂ = 5/3",
    standardSteps: "a = 1, b = -5, c = 3\nx₁ + x₂ = -(-5)/1 = 5\nx₁·x₂ = 3/1 = 3\nSamakan penyebut:\n1/x₁ + 1/x₂ = (x₂ + x₁) / (x₁·x₂) = (x₁ + x₂) / (x₁·x₂)\nSubstitusi nilai Vieta:\n1/x₁ + 1/x₂ = 5 / 3."
  },
  {
    id: "PT-Q19",
    number: 19,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Menyusun Persamaan Baru dengan Akar (x₁ + 2) dan (x₂ + 2)",
    promptText: "Akar-akar persamaan x² - 3x + 2 = 0 adalah x₁ dan x₂. Susunlah persamaan kuadrat baru yang akar-akarnya y₁ = x₁ + 2 dan y₂ = x₂ + 2.",
    latexEquation: "x^2 - 3x + 2 = 0, \\quad y_1 = x_1 + 2, \\quad y_2 = x_2 + 2",
    topic: "Penyusunan Persamaan Kuadrat Baru (Transformasi Translasi)",
    standardAnswer: "x² - 7x + 12 = 0",
    standardSteps: "Dari persamaan lama: x₁ + x₂ = 3, x₁·x₂ = 2.\nUntuk akar baru:\nJumlah akar: y₁ + y₂ = (x₁ + 2) + (x₂ + 2) = (x₁ + x₂) + 4 = 3 + 4 = 7.\nHasil kali akar: y₁·y₂ = (x₁ + 2)(x₂ + 2) = x₁x₂ + 2(x₁ + x₂) + 4 = 2 + 2(3) + 4 = 2 + 6 + 4 = 12.\nRumus persamaan kuadrat baru: y² - (y₁ + y₂)y + (y₁·y₂) = 0\n=> x² - 7x + 12 = 0."
  },
  {
    id: "PT-Q20",
    number: 20,
    domainId: "D5",
    domainName: "Hubungan Akar",
    title: "Menghitung Nilai Kuadrat Selisih (x₁ - x₂)²",
    promptText: "Diketahui x₁ dan x₂ adalah akar-akar dari 2x² + 4x - 3 = 0. Hitunglah nilai dari (x₁ - x₂) tanpa mencari nilai akarnya satu per satu.",
    latexEquation: "2x^2 + 4x - 3 = 0",
    topic: "Identitas Selisih Akar dan Diskriminan",
    standardAnswer: "(x₁ - x₂)² = 10",
    standardSteps: "a = 2, b = 4, c = -3\nx₁ + x₂ = -4/2 = -2\nx₁·x₂ = -3/2\nIdentitas kuadrat selisih:\n(x₁ - x₂)² = (x₁ + x₂)² - 4x₁x₂\n(x₁ - x₂)² = (-2)² - 4(-3/2)\n(x₁ - x₂)² = 4 + 6 = 10.\n(Atau cara rumus: (x₁ - x₂)² = D / a² = [16 - 4(2)(-3)] / 4 = [16 + 24] / 4 = 40/4 = 10)."
  },

  // --- Domain D6: Penerapan (Q21 - Q24) ---
  {
    id: "PT-Q21",
    number: 21,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Fungsi Keuntungan Kuadratik Kontekstual",
    promptText: "Fungsi keuntungan suatu UMKM dinyatakan dengan K(x) = -x² + 8x - 7 (dalam juta rupiah), dengan x menyatakan jumlah produksi (dalam ratus unit).\na) Tentukan titik impas (K = 0).\nb) Pada interval produksi berapakah perusahaan memperoleh keuntungan (K > 0)?",
    latexEquation: "K(x) = -x^2 + 8x - 7, \\quad K(x) = 0",
    topic: "Analisis Titik Impas (Break-Even) & Interval Keuntungan",
    standardAnswer: "a) x = 1 (100 unit) atau x = 7 (700 unit); b) Perusahaan untung pada rentang 1 < x < 7 (antara 100 hingga 700 unit)",
    standardSteps: "a) Titik impas terjadi saat K(x) = 0:\n-x² + 8x - 7 = 0\nx² - 8x + 7 = 0\n(x - 1)(x - 7) = 0\nx = 1 atau x = 7.\nJadi titik impas pada produksi 100 unit dan 700 unit.\nb) Keuntungan K(x) > 0:\nKarena kurva membuka ke bawah (a = -1 < 0), maka nilai positif terletak di antara kedua akar titik potong sumbu x:\n1 < x < 7.\nJadi UMKM meraup keuntungan saat memproduksi antara 100 hingga 700 unit."
  },
  {
    id: "PT-Q22",
    number: 22,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Kinematika Roket Air: Waktu di Udara & Titik Tertinggi",
    promptText: "Sebuah roket air ditembakkan vertikal dengan persamaan ketinggian h(t) = -4t² + 16t + 5 (h dalam meter, t dalam detik).\na) Kapan roket menyentuh tanah?\nb) Berapa ketinggian maksimum yang dicapai?",
    latexEquation: "h(t) = -4t^2 + 16t + 5",
    topic: "Pemodelan Gerak Peluru & Interpretasi Fisika Nilai Positif",
    standardAnswer: "a) t ≈ 4.29 detik; b) Ketinggian maksimum = 21 meter (pada t = 2 detik)",
    standardSteps: "a) Roket menyentuh tanah saat h(t) = 0:\n-4t² + 16t + 5 = 0  =>  4t² - 16t - 5 = 0\nt = [16 ± √(16² - 4(4)(-5))] / 8\nt = [16 ± √(256 + 80)] / 8 = [16 ± √336] / 8\n√336 ≈ 18.33\nt₁ = (16 + 18.33)/8 = 34.33/8 ≈ 4.29 detik\nt₂ = (16 - 18.33)/8 = -2.33/8 ≈ -0.29 detik (diabaikan karena waktu t ≥ 0)\nJadi roket menyentuh tanah pada t ≈ 4.29 detik.\nb) Titik puncak pada t = -b/(2a) = -16 / (2 × -4) = 2 detik.\nh(2) = -4(2)² + 16(2) + 5 = -16 + 32 + 5 = 21 meter."
  },
  {
    id: "PT-Q23",
    number: 23,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Pemodelan Bilangan Bulat Berurutan: Eliminasi Negatif",
    promptText: "Jumlah kuadrat dari dua bilangan bulat positif berurutan adalah 113. Tentukan kedua bilangan tersebut.",
    latexEquation: "x^2 + (x + 1)^2 = 113, \\quad x \\in \\mathbb{Z}^+",
    topic: "Pemodelan Aljabar Bilangan & Eliminasi Solusi Tak Memenuhi Syarat",
    standardAnswer: "7 dan 8",
    standardSteps: "Misalkan kedua bilangan adalah x dan (x + 1) dengan x > 0:\nx² + (x + 1)² = 113\nx² + (x² + 2x + 1) = 113\n2x² + 2x + 1 - 113 = 0\n2x² + 2x - 112 = 0\nBagi kedua ruas dengan 2:\nx² + x - 56 = 0\nFaktorkan:\n(x + 8)(x - 7) = 0\nx = -8  atau  x = 7.\nKarena disyaratkan bilangan bulat POSITIF, maka x = -8 tidak memenuhi / diabaikan.\nBilangan pertama = 7\nBilangan kedua = 7 + 1 = 8.\nUji kebenaran: 7² + 8² = 49 + 64 = 113 (Tepat)."
  },
  {
    id: "PT-Q24",
    number: 24,
    domainId: "D6",
    domainName: "Penerapan",
    title: "Evaluasi Kritis Kasus D < 0 dalam Pemodelan Rekayasa",
    promptText: "Dalam perancangan lengkungan jembatan, seorang insinyur mendapatkan persamaan 2x² - 3x + 5 = 0 untuk menentukan titik tumpu jembatan dengan tanah. Insinyur menyimpulkan bahwa jembatan tersebut tidak akan pernah menyentuh tanah pada desain ini. Apakah kesimpulan insinyur tersebut benar? Jelaskan dasar matematikanya.",
    latexEquation: "2x^2 - 3x + 5 = 0",
    topic: "Interpretasi Fisik Diskriminan Negatif dalam Rekayasa",
    standardAnswer: "Benar. Nilai D = -31 < 0 menunjukkan tidak ada titik potong nyata (akar real) dengan permukaan tanah.",
    standardSteps: "1. Titik sentuh tanah merupakan akar-akar real persamaan kuadrat saat y = 0.\n2. Cek nilai diskriminan dari 2x² - 3x + 5 = 0:\na = 2, b = -3, c = 5\nD = b² - 4ac = (-3)² - 4(2)(5) = 9 - 40 = -31.\n3. Karena D = -31 < 0, persamaan kuadrat tidak memiliki akar bilangan real.\n4. Karena a = 2 > 0 dan D < 0, grafik fungsi kuadrat bersifat definit positif (seluruh lengkungan berada di atas sumbu x atau permukaan tanah).\n5. Kesimpulan: Insinyur BENAR secara matematis bahwa desain lengkungan tersebut melayang dan tidak menyentuh tanah."
  }
];

export default POST_TEST_QUESTIONS;
