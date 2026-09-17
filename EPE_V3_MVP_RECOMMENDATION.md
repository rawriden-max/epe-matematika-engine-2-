# EPE V3 — Real MVP Recommendation & Architecture Roadmap

**Tanggal Dokumen:** 16 September 2026  
**Status:** Rekomendasi Arsitektur Sebelum Eksekusi  
**Tujuan:** Merumuskan Minimum Viable Product (MVP) EPE V3 yang paling aman, teruji secara ilmiah (*research-grade*), dan tidak terjebak dalam perangkap janji AI palsu (*overclaiming*).

---

## 1. Definisi & Filosofi Real MVP EPE V3

Tujuan utama EPE V3 bukanlah "membuat demo AI yang bisa membaca foto apa saja", melainkan:
> **Membuka jalan bagi siswa agar dapat menuangkan jalan pikiran matematikanya secara alami (tulisan tangan / coretan kertas), mengonversinya menjadi representasi simbolik terstruktur, memverifikasi keabsahan langkah aljabar secara deterministik, dan menyuplai bukti kesalahan transformasi (*transformation error evidence*) ke dalam mesin taksonomi EPE (E0–E4).**

### Batasan Keras (Hard Boundaries):
1. **Dilarang Mengubah Taksonomi Inti:** Definisi `E0`, `E1`, `E2`, `E3`, `E4` dan domain `D1`–`D6` tidak boleh diubah sedikit pun. Multimodal layer hanya bertindak sebagai pemasok bukti (*evidence feeder*).
2. **Tidak Boleh Mengarang Simbol:** Jika sistem ragu membaca tulisan tangan siswa, sistem **wajib bertanya** (*request student confirmation*), bukan mengarang ekspresi matematika secara sepihak.
3. **Pemisahan Pengenalan vs Verifikasi:** Pengenalan ekspresi (*Recognition*) dan kebenaran matematika (*Correctness*) adalah dua tahapan yang terpisah secara independen.

---

## 2. Sembilan (9) Prioritas Utama MVP EPE V3

Berikut adalah 9 pilar MVP yang wajib dibangun secara terukur dan bertahap:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [1] Image Upload & Camera Input (Canvas Preprocessor)                  │
│     ↓                                                                  │
│ [2] Mathematical Normalization Layer (LaTeX, AST, Matrix Tokens)       │
│     ↓                                                                  │
│ [3] Multi-Factor Confidence & Ambiguity Detection                      │
│     ↓                                                                  │
│ [4] Student Confirmation Guard (KaTeX Rendered Preview & Edit)         │
│     ↓                                                                  │
│ [5] Deterministic Math Verification Engine (LHS = RHS, Matrix, Vieta)   │
│     ↓                                                                  │
│ [6] Handwritten Step Reconstruction (Line 1 -> Line 2 -> Line 3)       │
│     ↓                                                                  │
│ [7] Step-Level Error Evidence Generator (Mapped to E0-E4)              │
│     ↓                                                                  │
│ [8] Seamless Diagnostic Baku Integration (Step 2 Workspace)            │
│     ↓                                                                  │
│ [9] Practice Bank & Research Dataset Schema Extension                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Rincian Tiap Pilar MVP:

#### 1. Image Upload & Preprocessing Canvas Pipeline
- Mendukung berkas PNG, JPG/JPEG, WEBP, dan jepretan kamera langsung (`Take Photo` via `getUserMedia`).
- Menggunakan HTML5 Canvas untuk memproses citra dokumen coretan siswa:
  - Pengecekan resolusi minimum (menolak citra di bawah $300 \times 300$ px sebagai *blurry/low-res*).
  - Konversi Grayscale dan Normalisasi Kontras Adaptif (*Adaptive Histogram Equalization* sederhana).
  - Ambang binarisasi (*Otsu/Adaptive Thresholding*) untuk mempertajam goresan pulpen/pensil terhadap latar kertas.
  - Mempertahankan berkas asli `originalImage` dan memproduksi `processedImage`.

#### 2. Normalisasi Matematika & Struktur AST
- Mengabstraksi input matematika menjadi objek data `MathRepresentation`:
  ```javascript
  {
    type: "equation" | "matrix" | "solution_steps" | "calculus",
    rawText: "...",
    latex: "2x + 3 = 11",
    ast: { type: "Equation", left: {...}, right: {...} },
    dimensions: [2, 2], // jika matriks
    steps: [ ... ],
    confidence: 0.94
  }
  ```
- Menstandarkan variasi penulisan aljabar: $x^2$, $x²$, `x^2`, tanda perkalian $\cdot$, $\times$, $*$, serta pecahan $\frac{a}{b}$ dan $a/b$.

#### 3. Arsitektur Keyakinan Multi-Faktor (Bukan Sekadar Ambang Batas Angka)
Sistem tidak boleh hanya menggunakan aturan kaku `confidence < 85%`. Arsitektur keyakinan dibangun dari gabungan 4 indikator independen:
$$\text{Score Total} = w_1 \cdot C_{\text{recog}} + w_2 \cdot V_{\text{struct}} + w_3 \cdot M_{\text{verif}} - A_{\text{ambig}}$$
- $C_{\text{recog}}$ (*Recognition Confidence*): Tingkat kepastian deteksi karakter dari model/ekstraktor.
- $V_{\text{struct}}$ (*Structural Validation*): Kerapian sintaks (misal: kurung seimbang `( )`, ada tanda sama dengan `=`, tidak ada simbol ganda tanpa arti `++--`).
- $M_{\text{verif}}$ (*Mathematical Verification*): Apakah langkah tersebut secara matematis masuk akal atau dapat diuji substitusinya.
- $A_{\text{ambig}}$ (*Ambiguity Detection*): Adanya karakter ambigu tinggi (misal: angka `0` vs huruf `O`, angka `1` vs huruf `l` atau `|`, tanda minus `-` vs garis coret).

#### 4. Student Confirmation Guard (Pratinjau KaTeX & Koreksi Mandiri)
- Jika Score Keyakinan berada dalam kategori sedang/rendah, sistem menampilkan kartu pratinjau:
  > *"Kami mendeteksi coretan matematikamu sebagai berikut:"*  
  > **[ Rendered Rumus KaTeX ]**  
  > `[ Sudah Tepat / Lanjutkan Analisis ]` &nbsp; `[ Edit Notasi Rumus ]`
- Memberikan siswa rasa memegang kendali (*agency*) dan menjamin data yang masuk ke EPE benar-benar merepresentasikan pikiran siswa, bukan kesalahan baca komputer.

#### 5. Mesin Verifikasi Deterministik CAS-Like
Mengembangkan `js/multimodal/mathVerifier.js`:
- **Uji Substitusi Akar:** Menguji apakah nilai akar yang ditemukan siswa ($x = p$) benar-benar menghasilkan $LHS = RHS$ jika disubstitusikan kembali ke persamaan awal.
- **Komputasi Matriks $2\times 2$ & $3\times 3$:**
  - Perkalian matriks deterministik: $\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} e & f \\ g & h \end{pmatrix}$.
  - Determinan eksak: $\det(A) = ad - bc$.
  - Invers matriks deterministik: $A^{-1} = \frac{1}{\det(A)} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.
- **Diferensiasi Polinomial Simbolik:** Menghitung turunan $\frac{d}{dx}(a \cdot x^n) = a \cdot n \cdot x^{n-1}$ secara eksak.

#### 6. Rekonstruksi Langkah Coretan Tangan (Step Reconstruction)
- Mengurai coretan bertingkat menjadi array terurut:
  - *Langkah 1:* $2x + 3 = 11$
  - *Langkah 2:* $2x = 14$
  - *Langkah 3:* $x = 7$
- Menjalankan **Transformation Diffing**:
  - Langkah 1 $\to$ Langkah 2: Perpindahan suku $+3$ ke ruas kanan seharusnya menjadi $11 - 3 = 8$, tetapi siswa menulis $2x = 14$ ($11 + 3$).
  - Terdeteksi anomali transformasi tanda pindah ruas!

#### 7. Penghasil Bukti Kesalahan EPE (Step-Level Error Evidence)
- Menerjemahkan anomali transformasi di atas menjadi bukti terstruktur untuk `ErrorPatternEngine`:
  - **Pola Terdeteksi:** `E2` (Prosedural Aljabar)
  - **Lokasi Error:** Langkah 2
  - **Transformasi yang Diharapkan:** $2x = 11 - 3 \implies 2x = 8$
  - **Transformasi yang Terjadi:** $2x = 11 + 3 \implies 2x = 14$
  - **Keyakinan Bukti:** 94%

#### 8. Integrasi Mulus ke Diagnostik Baku (Step 2 Workspace)
- Memasang tab pemilih mode yang ringkas di samping formulir langkah pengerjaan siswa:
  `[ ⌨ Ketik ]` | `[ 📷 Foto Coretan ]` | `[ 🎙 Suara ]`
- Ketika foto diunggah, langkah-langkah yang terekonstruksi otomatis mengisi kolom langkah dengan format rapi dan menampilkan kartu verifikasi langkah (✓ / ⚠️).

#### 9. Ekstensi Skema Riset & Supabase
- Menambahkan kolom ke ekspor CSV Riset dan payload Supabase:
  - `input_type`: `'typed' | 'image' | 'audio'`
  - `confidence_score`: float
  - `verification_status`: `'VERIFIED' | 'PARTIAL' | 'UNVERIFIED'`
  - `step_count`: integer
  - `transformation_anomaly_step`: integer / null

---

## 3. Rekomendasi Terhadap Fitur Input Suara (Audio Input)

Berdasarkan audit teknis:
- **Status Saat Ini:** Web Speech API di peramban hanya mampu mengenali kata-kata percakapan umum bahasa Indonesia. Jika siswa mengucapkan kalimat matematika seperti:
  > *"x kuadrat ditambah dua x sama dengan nol"*
  Web Speech API sering kali menghasilkan transkripsi teks mentah:
  > *"x kuadrat ditambah 2 x = 0"* atau *"x kuadrat + 2x = 0"*
- **Rekomendasi MVP:**
  1. Input suara **tidak boleh dipaksakan** menjadi verifier utama pada fase awal MVP.
  2. Input suara harus ditempatkan sebagai **penjelas penalaran (*verbal reasoning explanation*)** yang didampingi oleh normalizer leksikal Indonesia (`speechMathParser.js`).
  3. Siswa **wajib mengonfirmasi** teks matematika hasil ucapan suara sebelum dianalisis oleh EPE.

---

## 4. Rencana Implementasi Bertahap (Phased Execution Plan)

### Fase 1: Fondasi Personalisasi & Sinkronisasi Riset Cloud (Selesai ✓)
- [x] Manajemen Profil & Nickname Siswa (`profileManager.js`).
- [x] Tombol batch sync Pre-Test & Post-Test ke Supabase di Mode Riset (`btn-sync-assessments-supabase`).
- [x] Ekspor CSV dengan metadata multimodal (`historyManager.js` & `researchExport.js`).
- [x] Integrasi impor CSV dataset riset 24 butir soal (`data_riwayat_epe_excel_rapi.csv`).

### Fase 2: Prapemrosesan Citra & Normalisasi Matematika Universal (Selesai ✓)
- [x] Modul HTML5 Canvas Preprocessor (`imagePreprocessor.js`) dengan contrast enhancement & binarization.
- [x] Modul Abstraksi Matematika (`mathRepresentation.js`) dengan dukungan persamaan linear, kuadrat, matriks, dan kalkulus dasar.
- [x] Pengecekan kualitas gambar pra-pemrosesan (`imageQualityChecker.js`).

### Fase 3: Rekonstruksi Langkah & Verifikasi Deterministik (Selesai ✓)
- [x] Rekonstruksi langkah aljabar multi-baris (`handwritingStepReconstructor.js`).
- [x] Mesin verifikasi simbolik deterministik untuk substitusi akar & aljabar matriks (`mathVerifier.js`).

### Fase 4: Antarmuka Multimodal & Integrasi EPE (Selesai ✓)
- [x] Komponen UI Multimodal (`multimodalInputUI.js`) di Diagnostik Baku dan Bank Latihan.
- [x] Banner pratinjau KaTeX dan konfirmasi siswa sebelum analisis (*Student Confirmation Guard*).
- [x] Penyaluran bukti langkah ke kartu diagnosis EPE dan 3D Tornado Engine.

### Fase 5: Normalisasi Suara Lisan Matematika (Selesai ✓)
- [x] Parser ucapan matematika bahasa Indonesia (`speechMathParser.js`).

---

## 5. Status Realisasi Terkini (17 September 2026)
Seluruh 5 fase utama MVP telah diimplementasikan penuh dan divalidasi. Sistem telah dilengkapi dengan integrasi dataset riset 24 soal, perataan penyimpanan riwayat (`epe_history_v2`), dukungan ekspor-impor CSV cerdas, dan sinkronisasi reaktif 3D Tornado Engine.
