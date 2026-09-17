# EPE V3 — Mathematical Domain Capability Matrix

**Tanggal Evaluasi:** 16 September 2026  
**Standar Klasifikasi:**
- **`VERIFIED`**: Memiliki implementasi parser andal, representasi terstruktur, algoritma verifikasi deterministik eksak, analisis langkah otomatis, dan terintegrasi penuh ke dalam sistem EPE.
- **`PARTIALLY VERIFIED`**: Memiliki implementasi parsial (misal: verifikasi benar untuk subset kasus tertentu atau tabel lookup khusus), namun belum mencakup seluruh ragam masalah.
- **`AI-ASSISTED / NOT FULLY VERIFIED`**: Mengandalkan teks panduan statis atau inferensi LLM tanpa verifikasi matematika simbolik deterministik mandiri.
- **`UNSUPPORTED`**: Belum memiliki modul parser, representasi matematis, maupun verifikasi dalam basis kode saat ini.

---

## 1. Matriks Kapabilitas Domain Matematika (18 Domain Inti)

| Domain Matematika | Parsing | Representasi | Verifikasi | Analisis Langkah | Integrasi EPE | Status Kapabilitas |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Quadratic Equations**<br>*(Persamaan Kuadrat)* | Regex komprehensif (`ax^2+bx+c=0`, variasi variabel x, y, t, z) | Ekstraksi koefisien `a, b, c`, nilai diskriminan $D$, faktor linear | Deterministik eksak (Rumus ABC, diskriminan $b^2-4ac$, titik puncak, Vieta) | Ekstraksi akar, faktor, dan cek tanda kesalahan aljabar | Penuh (24 soal diagnostik baku, aturan D1–D6 terkalibrasi pakar) | **`VERIFIED`** |
| **Linear Equations**<br>*(Persamaan Linear)* | Regex seimbang (`ax + b = cx + d`) | Isolasi variabel $x$, koefisien sisi kiri dan sisi kanan | Deterministik eksak ($x = \frac{d - b}{a - c}$ dengan penanganan pembagian nol) | Isolasi aljabar bertahap | Parsial (Aktif di MathSolver & AI Matrix, belum ada soal baku di EPE Q1–Q24) | **`PARTIALLY VERIFIED`** |
| **Fractions & Rationals**<br>*(Pecahan & Bentuk Rasional)* | Regex `\frac{a}{b}` dan `a/b`, normalisasi Unicode | Objek pecahan `{ num, den }` dengan penyederhanaan FPB/GCD | Aritmatika pecahan eksak dan penyederhanaan faktor | Pengenalan penyebut sama/beda | Parsial (Terintegrasi pada penyelesaian akar pecahan di Q6 & Q8) | **`PARTIALLY VERIFIED`** |
| **Arithmetic & Exponents**<br>*(Aritmatika & Pangkat)* | String angka besar, notasi `^`, `**`, operasi dasar `+ - * /` | Tipe data `BigInt` (arbitrary precision) & IEEE-754 Float | Deterministik 100% tanpa batas digit integer | Deteksi kesalahan hitung tanda minus dan selisih angka | Parsial (Mendeteksi kesalahan komputasi `E3` di semua soal) | **`PARTIALLY VERIFIED`** |
| **Trigonometry**<br>*(Trigonometri Dasar)* | Ekstraksi fungsi `sin`, `cos`, `tan` dan sudut derajat | Sudut derajat numerik dan fungsi string | Deterministik via tabel lookup sudut istimewa ($0^\circ, 30^\circ, 45^\circ, 60^\circ, 90^\circ, \dots$) | Nihil (hanya evaluasi nilai tunggal) | Belum terhubung ke taksonomi EPE | **`PARTIALLY VERIFIED`** |
| **Geometry & Dimensions**<br>*(Geometri & Konteks Fisik)* | Deteksi besaran panjang, lebar, waktu, tanda negatif | Nilai numerik dan satuan dimensi ($cm, m, s$) | Verifikasi batas fisik: panjang $> 0$, waktu $> 0$ | Mendeteksi pemilihan akar bernilai negatif untuk ukuran fisik | Penuh (Domain D6, butir Q21–Q24 untuk kesalahan interpretasi `E4`) | **`PARTIALLY VERIFIED`** |
| **Systems of Equations**<br>*(Sistem Persamaan SPLDV)* | Belum ada parser SPLDV simultan | Belum ada representasi pasangan persamaan | Belum ada metode eliminasi/substitusi otomatis | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Matrices**<br>*(Matriks $2\times 2$ & $3\times 3$)* | Belum ada parser matriks (teks/LaTeX) | Belum ada struktur data baris-kolom matriks | Belum ada operasi penjumlahan, perkalian matriks | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Determinants**<br>*(Determinan Matriks)* | Belum ada parser `det(A)` atau $\|A\|$ | Belum ada representasi ordo matriks | Belum ada rumus $ad - bc$ atau ekspansi kofaktor | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Matrix Inverse**<br>*(Invers Matriks)* | Belum ada parser $A^{-1}$ | Belum ada representasi adjoin / invers | Belum ada verifikasi keterbalikan ($\det \neq 0$) | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Vectors**<br>*(Vektor Aljabar)* | Belum ada parser vektor $(\vec{u}, \mathbf{v})$ | Belum ada komponen vektor $(x, y, z)$ | Belum ada operasi dot/cross product | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Derivatives**<br>*(Kalkulus - Turunan)* | Regex kata kunci `"turunan dari ..."` | String fungsi mentah (belum diubah ke AST) | Belum deterministik (hanya teks statis aturan turunan rantai/pangkat) | Belum ada pelacakan baris | Belum ada | **`AI-ASSISTED / NOT FULLY VERIFIED`** |
| **Integrals**<br>*(Kalkulus - Integral)* | Regex kata kunci `"integral dari ..."` | String fungsi mentah (belum diubah ke AST) | Belum deterministik (hanya teks statis rumus dasar $\int x^n dx$) | Belum ada pelacakan konstanta $+C$ | Belum ada | **`AI-ASSISTED / NOT FULLY VERIFIED`** |
| **Limits**<br>*(Kalkulus - Limit)* | Belum ada parser $\lim_{x \to c}$ | Belum ada | Belum ada substitusi / faktorisasi L'Hopital | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Logarithms**<br>*(Logaritma)* | Belum ada parser logaritma basis $a$ | Belum ada | Belum ada sifat logaritma ($\log(ab) = \log a + \log b$) | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Sequences & Series**<br>*(Barisan & Deret)* | Belum ada parser deret aritmatika/geometri | Belum ada representasi suku $U_n, S_n$ | Belum ada verifikasi beda ($b$) atau rasio ($r$) | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Statistics**<br>*(Statistika Deskriptif)* | Deteksi kata kunci umum pada chat AI | Belum ada array kumpulan data terstruktur | Hanya rata-rata aritmatika sederhana via LLM | Belum ada | Belum ada | **`UNSUPPORTED`** |
| **Probability**<br>*(Peluang & Kombinatorika)* | Belum ada parser kombinasi/permutasi | Belum ada ruang sampel $n(S), n(A)$ | Belum ada | Belum ada | Belum ada | **`UNSUPPORTED`** |

---

## 2. Analisis Batas Verifikasi Deterministik vs AI

Salah satu temuan paling krusial dalam audit ini adalah: **Mengapa domain kalkulus dan matriks saat ini belum terverifikasi secara deterministik?**

### 2.1. Akar Masalah di Basis Kode Eksisting
Di dalam `js/engine/mathSolver.js`:
- Fungsi `solveDerivative(query)` hanya melakukan pencocokan regex kata:
  ```javascript
  const polyMatch = q.match(/(?:turunan|d\/dx|derivatif)\s*(?:dari)?\s*([0-9a-zA-Z\^\+\-\s]+)/);
  // ... lalu HANYA mengembalikan teks panduan rumus statis LaTeX:
  return `### 🚀 Matrix Math Solver: Kalkulus (Turunan Pertama)\n\n` +
         `**Aturan Dasar Turunan (*Power Rule*):**\n` +
         `$$\\frac{d}{dx}(a \\cdot x^n) = a \\cdot n \\cdot x^{n-1}$$\n...`;
  ```
- Fungsi `solveIntegral(query)` juga serupa: tidak ada komputasi integrasi polinomial riil yang mengalikan koefisien dan menaikkan derajat pangkat.
- Matriks bahkan belum memiliki parser kurung siku `[1 2; 3 4]` atau `\begin{pmatrix}` sama sekali.

### 2.2. Dampak Pedagogis & Validitas Riset
Jika siswa mengunggah foto penyelesaian matriks atau turunan ke dalam sistem saat ini:
1. Sistem **tidak mampu memverifikasi** apakah baris perkalian matriks siswa benar atau salah secara deterministik.
2. Jika sistem mengandalkan inferensi LLM mentah, terdapat risiko tinggi terjadinya kesalahan hitung aritmatika matriks (terkenal rawan halusinasi pada model generatif).
3. Akibatnya, diagnosis pola kesalahan (`E1`–`E4`) akan menjadi spekulatif dan mencederai validitas data penelitian.

---

## 3. Peta Jalan Peningkatan Menuju EPE V3

Untuk mencapai kapabilitas multimodal yang dapat dipertanggungjawabkan, domain matematika harus ditingkatkan secara bertahap melalui modul baru `js/multimodal/mathVerifier.js`:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TIER 1 (MVP EPE V3 - Siap Diverifikasi Penuh):                           │
│ - Quadratic Equations (Lengkap: Faktorisasi, ABC, Diskriminan)           │
│ - Linear Equations (Satu Variabel)                                      │
│ - Polynomial Arithmetic & Fractions (Pecahan, Pangkat, Tanda)           │
│ - Transformation Step Reconstruction (Perpindahan Ruas: 2x+3=11 -> 2x=8)│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ TIER 2 (Fase 2 - Peningkatan Deterministik Determinan & Kalkulus):      │
│ - Matrices (Operasi Matriks 2x2 & 3x3, Perkalian, Determinan ad - bc)   │
│ - Polynomial Derivatives (Diferensiasi Polinomial Eksak: d/dx(ax^n))    │
│ - Polynomial Integrals (Integrasi Polinomial Eksak: ∫(ax^n) dx)         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│ TIER 3 (Fase 3 - Domain Lanjutan Penelitian):                           │
│ - Systems of Linear Equations (SPLDV 2 Variabel)                        │
│ - Trigonometric Equations & Identities                                  │
│ - Limits & Rational Functions                                           │
└─────────────────────────────────────────────────────────────────────────┘
```
