# EPE V3 — Comprehensive Capability & Architectural Audit

**Tanggal Audit:** 16 September 2026  
**Auditor:** Antigravity AI Senior Architect  
**Objektif:** Membedah realitas teknis basis kode *Error Pattern Engine* (EPE) saat ini untuk memisahkan secara tegas antara modul yang **sudah benar-benar nyata (IMPLEMENTED)**, **setengah jadi (PARTIAL)**, **sekadar purwarupa (PROTOTYPE)**, **belum ada (MISSING)**, atau **bermasalah (BROKEN)** sebelum implementasi multimodal EPE V3 dilanjutkan.

---

## 1. Ringkasan Eksekutif & Status Sistem Eksisting

Secara garis besar, EPE saat ini memiliki fondasi pedagogis, aturan diagnostik deterministik, dan UI gamifikasi yang sangat solid untuk persamaan kuadrat. Namun, **lapisan input multimodal saat ini 100% bergantung pada pengetikan teks manual**. Fitur pengunggahan gambar dan rekaman audio yang tampak di UI Bank Latihan saat ini hanyalah *wrapper* penyimpanan file lokal (Base64) tanpa pipeline OCR, tanpa pemroses gambar, tanpa parser ekspresi matematika, dan tanpa rekonstruksi langkah aljabar.

Berikut hasil inspeksi mendalam tiap subsistem utama:

### 1.1. Core Engine & Taksonomi E0–E4
- **Status:** `IMPLEMENTED` (Sangat Solid)
- **Basis Kode:** `js/engine/epeEngine.js`, `js/engine/diagnosticRules.js`, `js/engine/taxonomy.js`, `js/engine/stepAnalyzer.js`
- **Realitas Teknis:**
  - Taksonomi 5 tingkat (`E0` Akurat, `E1` Konseptual, `E2` Prosedural, `E3` Komputasi, `E4` Interpretasi) terdefinisi secara baku dan tidak boleh diubah.
  - `diagnosticRules.js` (1.193 baris kode) berisi pemetaan deterministik pakar yang sangat kaya untuk seluruh 24 butir soal diagnostik baku.
  - `_smartPracticeDiagnostic()` dalam `epeEngine.js` mampu mendeteksi pola kesalahan pada soal latihan bebas melalui heuristik teks.

### 1.2. Domain D1–D6 (24 Soal Diagnostik Baku)
- **Status:** `IMPLEMENTED`
- **Basis Kode:** `js/data/questions.js`, `js/engine/diagnosticRules.js`
- **Realitas Teknis:**
  - 24 butir soal diagnostik terbagi rapi ke dalam 6 domain:
    - `D1`: Konsep Dasar Persamaan Kuadrat (Q1–Q4) $\to$ dominan `E1`
    - `D2`: Faktorisasi Aljabar (Q5–Q8) $\to$ dominan `E2`
    - `D3`: Melengkapkan Kuadrat Sempurna & Rumus ABC (Q9–Q12) $\to$ dominan `E2`/`E3`
    - `D4`: Diskriminan & Sifat Akar (Q13–Q16) $\to$ dominan `E1`/`E3`
    - `D5`: Teorema Vieta & Operasi Simetri Akar (Q17–Q20) $\to$ dominan `E1`/`E2`
    - `D6`: Masalah Kontekstual & Geometri Nyata (Q21–Q24) $\to$ dominan `E4`
  - Seluruh butir soal ini bekerja 100% menggunakan teks string.

### 1.3. Bank Latihan & Soal Kustom
- **Status:** `PARTIAL`
- **Basis Kode:** `js/data/customQuestionStore.js`, `js/data/samplePresets.js`, `index.html` (lines 880–1110)
- **Realitas Teknis:**
  - Penyimpanan soal lokal di `localStorage` berjalan baik.
  - Di UI terdapat tombol unggah foto dan rekam suara, namun file yang diunggah hanya disimpan sebagai string Base64 di memori dan tidak dianalisis sama sekali oleh mesin matematika.

### 1.4. Learning Cubes 3D Monument
- **Status:** `IMPLEMENTED`
- **Basis Kode:** `js/ui/cubeEngine.js`, `js/data/cubeStore.js`
- **Realitas Teknis:**
  - Menggunakan HTML5 Canvas 2D untuk memproyeksikan struktur isometrik monumen 24 kubus bertingkat (Tier 0–3).
  - Dilengkapi sistem fisika jatuh dari langit (*drop physics*), pantulan (*squash & stretch*), efek partikel, dan tooltip hover.
  - Status kubus (`locked`, `earned`, `remediated`) tersimpan stabil di `localStorage`.

### 1.5. Ekonomi Cubic & Avatar Lab
- **Status:** `IMPLEMENTED`
- **Basis Kode:** `js/avatar/avatarEngine.js`, `js/avatar/avatarCatalog.js`, `js/avatar/avatarLab.js`, `js/economy/cubicWallet.js`, `js/economy/cubicRewards.js`
- **Realitas Teknis:**
  - Avatar dirender dinamis dalam 8 layer SVG berlapis (Background, Aura, Back Hair, Outfit, Head, Face, Front Hair, Accessory).
  - Sistem dompet Cubic memiliki buku besar mutasi transaksi (*ledger*), validasi saldo sebelum pembelian item, dan verifikasi kepemilikan kosmetik (*sanitization check*).

### 1.6. Modul Riset Pre-Test & Post-Test (EPE V2.2)
- **Status:** `IMPLEMENTED`
- **Basis Kode:** `js/research/assessmentForms.js`, `js/research/assessmentStore.js`, `js/research/assessmentUI.js`, `js/research/researchAnalytics.js`, `js/research/researchExport.js`
- **Realitas Teknis:**
  - Form A (Pre-Test, 12 butir) dan Form B (Post-Test, 12 butir) terkalibrasi ke kompetensi C01–C12.
  - Data attempt bersifat imutabel (ID unik berbasis timestamp, tidak saling menimpa).
  - Menghitung pergeseran kesalahan (*error migration matrix*), akurasi per domain, dan ekspor 5 varian CSV UTF-8 BOM.

### 1.7. Integrasi Cloud Supabase
- **Status:** `PARTIAL`
- **Basis Kode:** `js/data/supabaseClient.js`, `supabase_research_schema.sql`
- **Realitas Teknis:**
  - Inisialisasi client Supabase via CDN berjalan.
  - Tabel `hasil_diagnosis`, `hasil_pretest`, dan `hasil_posttest` sudah didefinisikan dalam SQL DDL.
  - Namun: belum memiliki manajemen antrean offline (*offline queue*), belum ada mekanisme retry bertahap saat jaringan putus, dan penyimpanan artefak multimodal (file gambar/audio) belum diarahkan ke Supabase Storage Bucket melainkan masih disimpan lokal.

### 1.8. Asisten AI "Matrix" & Math Solver
- **Status:** `PARTIAL` (Sebagian solver eksak, sebagian teks generik)
- **Basis Kode:** `js/ui/aiAgentManager.js`, `js/engine/mathSolver.js`
- **Realitas Teknis:**
  - `MathSolver.js` memiliki algoritma deterministik eksak untuk: Persamaan Kuadrat lengkap (pemfaktoran, rumus ABC, diskriminan), Persamaan Linear satu variabel, aritmatika BigInt arbitrary precision, dan sudut istimewa trigonometri.
  - Untuk kalkulus (turunan & integral), `MathSolver.js` hanya mengembalikan **string penjelasan rumus statis**, BUKAN komputasi simbolik sejati.
  - Belum ada dukungan komputasi matriks (perkalian matriks, determinan $2\times 2$ / $3\times 3$, invers) sama sekali.
  - Input suara pada AI Matrix menggunakan Web Speech API generik untuk chatting, bukan pengenal tata bahasa matematika (*mathematical speech grammar*).

### 1.9. Dukungan KaTeX & MathJax
- **Status:** `IMPLEMENTED` (KaTeX)
- **Realitas Teknis:**
  - KaTeX v0.16.8 terpasang via CDN di `index.html`.
  - Berfungsi merender rumus matematika berbasis sintaks LaTeX di dalam kartu soal, preview rumus, dan chat bubble.

---

## 2. Tabel Audit & Klasifikasi Fitur Menyeluruh

| Fitur / Komponen | Status | Berkas Terkait | Perilaku Saat Ini | Komponen yang Kurang | Risiko Teknis & Riset |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Klasifikasi Pola Error E0–E4** | `IMPLEMENTED` | `js/engine/epeEngine.js`, `diagnosticRules.js` | Mendiagnosis jawaban teks ke E0–E4 berdasarkan kata kunci, opsi, dan nilai akar | Rekonstruksi baris langkah multimodal | Rendah. Logika inti sangat stabil |
| **Domain Diagnostik D1–D6** | `IMPLEMENTED` | `js/data/questions.js`, `diagnosticRules.js` | 24 butir soal diagnostik baku dengan kunci dan aturan miskonsepsi | Input selain pengetikan teks | Rendah. Struktur instrumen baku valid |
| **Personalisasi Profil Siswa** | `IMPLEMENTED` | `js/data/profileManager.js`, `index.html` | Mengelola nama/nickname siswa di localStorage dan DOM reaktif | Sinkronisasi profil antar-perangkat jika tanpa akun Supabase Auth | Rendah |
| **Monumen 3D Learning Cubes** | `IMPLEMENTED` | `js/ui/cubeEngine.js`, `cubeStore.js` | Canvas 2D isometrik dengan animasi drop, hover, tooltip, milestone | Rendering WebGL murni (Three.js ada di CDN tapi monumen memakai 2D Canvas) | Rendah |
| **Ekonomi Cubic & Avatar Lab** | `IMPLEMENTED` | `js/avatar/*`, `js/economy/*` | Pembelian kosmetik, ledger transaksi, render SVG 8 layer | Sinkronisasi cloud untuk item yang dibeli (baru tersimpan lokal) | Rendah |
| **Instrumen Pre-Test & Post-Test** | `IMPLEMENTED` | `js/research/assessment*.js` | Pengerjaan 12 butir Form A & B, timer, scoring, error shift analytics | Mode pengerjaan bertahap (pause & resume) | Rendah. Alur riset terstandar |
| **Ekspor Dataset Riset (5 CSV)** | `IMPLEMENTED` | `js/research/researchExport.js` | Ekspor CSV UTF-8 BOM untuk Pre, Diag, Rem, Post, Combined | Kolom metadata multimodal (`input_type`, `image_ref`, `latex_ast`) | Sedang. Perlu penambahan kolom bukti multimodal |
| **Unggah Gambar Coretan** | `PARTIAL` | `js/ui/mediaManager.js`, `index.html` | Hanya menerima file input di Practice Bank lalu diubah ke Base64 dataURL | Belum ada di Diagnostik Baku; belum ada pengenalan OCR matematika | Tinggi jika siswa mengira gambar langsung terbaca otomatis |
| **Input Kamera (Webcam/HP)** | `PROTOTYPE` | `index.html` (tag input file capture) | Mengandalkan `<input type="file" accept="image/*">` bawaan OS | Antarmuka viewfinder kamera langsung (*live video stream* via `getUserMedia`) | Sedang |
| **Prapemrosesan Citra** | `MISSING` | Tidak ada berkas | Gambar mentah diunggah apa adanya | Grayscale, kontras adaptif, binarisasi threshold, koreksi orientasi | Tinggi. Citra buram/redup akan gagal dikenali |
| **Pengenalan Matematika OCR** | `MISSING` | Tidak ada berkas | Tidak ada modul OCR matematika di klien | Model vision / OCR matematika (LaTeX extraction) | Kritis. Tanpa ini gambar coretan tidak menghasilkan data |
| **Pohon Sintaks Matematis (AST)** | `MISSING` | Tidak ada berkas | String teks dicocokkan dengan regex mentah | AST parser untuk ekspresi, persamaan, matriks, dan kalkulus | Tinggi. Rentan salah tafsir format penulisan aljabar |
| **Rekonstruksi Langkah Baris demi Baris** | `MISSING` | `js/engine/stepAnalyzer.js` (sebagian) | Hanya mengekstrak angka, akar, dan faktor dari 1 blok teks | Pemisah baris, urutan langkah aljabar, pelacak anomali perpindahan ruas | Kritis untuk mendeteksi lokasi titik kesalahan (*error site*) |
| **Input Suara Matematika** | `PARTIAL` | `js/ui/mediaManager.js`, `aiAgentManager.js` | Merekam audio blob via MediaRecorder; Web Speech API mengenali teks umum | Normalisasi bahasa lisan matematika Indonesia ke LaTeX/AST | Sedang. Suara sering salah mengenali simbol matematika |
| **Verifikasi Simbolik Deterministik** | `PARTIAL` | `js/engine/mathSolver.js` | Memverifikasi akar kuadrat dan persamaan linear secara eksak | Verifikasi kesetaraan ekspresi umum ($LHS - RHS = 0$) dan uji langkah | Sedang |
| **Komputasi Matriks Deterministik** | `MISSING` | `js/engine/mathSolver.js` | Tidak ada operasi matriks | Operasi matriks: perkalian, determinan $2\times 2$ / $3\times 3$, invers matriks | Sedang untuk domain matriks |
| **Verifikasi Kalkulus Deterministik** | `PROTOTYPE` | `js/engine/mathSolver.js` | Hanya mencetak rumus panduan turunan/integral statis | Diferensiasi simbolik dan integrasi polinomial eksak | Sedang untuk domain kalkulus |
| **Penyimpanan Cloud Supabase** | `PARTIAL` | `js/data/supabaseClient.js` | Menyimpan record teks ke tabel Supabase | Penyimpanan file gambar/audio ke Storage Bucket; antrean offline | Sedang. Payload Base64 besar bisa ditolak database |
| **Toleransi Kegagalan & Konfirmasi Siswa** | `PROTOTYPE` | `index.html` | Siswa mengetik manual jika ragu | Banner konfirmasi interaktif jika keyakinan pengenalan rendah | Tinggi. Jangan biarkan sistem menebak liar |

---

## 3. Analisis Kesenjangan Multimodal (Multimodal Gap Analysis)

Berikut status teknis riil untuk 14 kapabilitas multimodal yang dipersyaratkan:

```
[1] Image Upload                : PARTIAL      (Tersedia di Practice Bank via file input, nihil di Diagnostik)
[2] Camera Input                : PROTOTYPE    (Mengandalkan file dialog OS, bukan live stream canvas)
[3] Image Preprocessing         : MISSING      (Tidak ada filter kontras, grayscale, atau binarisasi)
[4] Standard OCR                : MISSING      (Tidak ada Tesseract atau engine OCR raster)
[5] Mathematical OCR            : MISSING      (Tidak ada parser ekspresi matematika dari citra)
[6] LaTeX Conversion            : PARTIAL      (KaTeX merender LaTeX, tetapi tidak ada pembuat LaTeX dari gambar)
[7] AST Generation              : MISSING      (Tidak ada struktur pohon sintaksis abstrak)
[8] Handwriting Recognition     : MISSING      (Coretan tangan belum dapat didekode menjadi teks/simbol)
[9] Step Reconstruction         : MISSING      (Belum ada pengurai multi-baris berurutan)
[10] Speech Recognition         : PARTIAL      (Web Speech API aktif di AI Chat, belum ada di lembar jawaban)
[11] Math Speech Normalization  : MISSING      ("x kuadrat" belum otomatis diubah menjadi "x^2")
[12] Symbolic Verification      : PARTIAL      (Persamaan kuadrat & linear eksak, selain itu teks statis)
[13] Matrix Verification        : MISSING      (Operasi matriks belum diimplementasikan)
[14] Calculus Verification      : MISSING      (Hanya teks petunjuk statis tanpa komputasi simbolik)
```

---

## 4. Audit Arsitektur Supabase Cloud

Pemeriksaan terhadap `js/data/supabaseClient.js` dan `supabase_research_schema.sql` menghasilkan temuan berikut:

1. **Attempt Immutability (Penyimpanan Imutabel):**  
   ✅ **LULUS.** Setiap attempt Pre-Test dan Post-Test di-generate dengan ID unik berbasis timestamp (`att_pretest_17895...`). Tidak ada operasi `UPDATE` yang menimpa attempt sebelumnya.
2. **Response-Level Records:**  
   ✅ **LULUS.** Respon butir per butir (12 soal) disimpan dalam kolom berformat JSONB (`responses`), lengkap dengan jawaban siswa, kunci, status benar/salah, dan kode error.
3. **Pemisahan Identitas Siswa:**  
   ✅ **LULUS.** Kolom `student_id` dan `student_name` terpisah rapi dari `attempt_id`.
4. **Referensi Bukti Multimodal:**  
   ⚠️ **BELUM MEMADAI (PARTIAL).** Kolom yang ada saat ini (`student_steps`, `student_answer`) dirancang untuk teks. Jika file gambar diunggah sebagai string Base64 langsung ke tabel PostgreSQL, ukuran baris data akan membengkak drastis (> 1–5 MB per baris), membebani kuota API Supabase dan memicu error `payload too large`.  
   *Rekomendasi:* Harus menggunakan referensi URI atau penyimpanan metadata hash.
5. **Manajemen Antrean Offline (*Offline Queue*):**  
   ❌ **BELUM ADA (MISSING).** Jika siswa menyelesaikan tes saat koneksi internet terputus, data tersimpan di `localStorage`, namun tidak ada mekanisme pemicu sinkronisasi otomatis (*background sync listener*) saat koneksi internet pulih kembali (*online event*).
6. **Pencegahan Data Duplikat (*Deduplication*):**  
   ⚠️ **PARTIAL.** Fungsi sinkronisasi batch saat ini menggunakan metode `.insert([rows])`. Jika terjadi kegagalan jaringan di tengah jalan dan tombol sinkronisasi ditekan ulang, record yang sama dapat terduplikasi kecuali diterapkan klausa `upsert` berbasis `attempt_id` unik.
7. **Keamanan Kredensial Frontend:**  
   ⚠️ **PERLU PENGAWASAN.** Kode frontend memuat publishable key Supabase (`sb_publishable_...`). Meskipun wajar untuk client-side Supabase, **Row Level Security (RLS)** pada tabel harus dikunci ketat agar user anonim hanya dapat melakukan `INSERT` dan `SELECT` untuk data miliknya sendiri.

---

## 5. Sintesis Evaluasi Arsitektur

### A. Apa yang Sudah Bekerja Sempurna (Don't Touch)
- Engine diagnostik baku persamaan kuadrat (Q1–Q24) beserta taksonomi E0–E4 dan domain D1–D6.
- Alur penelitian Pre-Test dan Post-Test (Form A & B) dengan instrumen C01–C12, metrik pergeseran error, dan ekspor CSV UTF-8.
- Engine Monumen 3D Learning Cubes, status persistensi kubus, dan visualisasi koleksi.
- Engine Avatar Layered SVG 8-layer, sistem wardrobe, dan ekonomi dompet Cubic.
- Renderer KaTeX untuk rendering rumus matematis yang bersih di layar.

### B. Apa yang Perlu Dimodifikasi (Modify)
- **Komponen Input Jawaban Siswa** di Diagnostik Baku dan Bank Latihan: Perlu ditambahkan tab pemilih mode input: `[ ⌨ Ketik ]`, `[ 📷 Unggah / Foto Coretan ]`, dan `[ 🎙 Rekam Suara Penalaran ]`.
- **Ekspor CSV Penelitian (`researchExport.js`):** Tambahkan kolom metadata multimodal (`input_type`, `recognition_confidence`, `reconstructed_steps_count`, `evidence_trace`).
- **Sinkronisasi Supabase (`supabaseClient.js`):** Ubah operasi insert menjadi *upsert* berbasis `attempt_id` untuk mencegah duplikasi, dan pasang listener `window.addEventListener('online', ...)` untuk sinkronisasi otomatis saat internet pulih.

### C. Apa yang Harus Dibuat Baru (Newly Implemented)
- `js/multimodal/imagePreprocessor.js`: Modul canvas HTML5 untuk normalisasi kontras adaptif, konversi grayscale, binarisasi threshold, dan penanganan webcam live capture.
- `js/multimodal/mathRepresentation.js`: Modul abstraksi ekspresi matematika universal (menyimpan bentuk teks, LaTeX terstandar, representasi token/AST, dan metadata keyakinan).
- `js/multimodal/handwritingStepReconstructor.js`: Pengurai multi-baris yang memecah coretan bertingkat (Baris 1 $\to$ Baris 2 $\to$ Baris 3), memeriksa konsistensi transformasi aljabar, dan menandai baris yang mengalami anomali (misal: kesalahan tanda pindah ruas $\implies$ Bukti Pola `E2`).
- `js/multimodal/mathVerifier.js`: Mesin verifikasi deterministik CAS-like untuk menguji keabsahan aljabar secara independen (bukan sekadar bergantung pada LLM), mencakup uji substitusi akar, operasi matriks $2\times 2$ dan $3\times 3$, serta aturan diferensiasi polinomial.
- `js/multimodal/multimodalInputUI.js`: Komponen UI modular dengan KaTeX live preview, indikator tahapan asinkron (*Reading image $\to$ Understanding math $\to$ Verifying steps $\to$ Analyzing error*), serta dialog konfirmasi siswa jika keyakinan pengenalan berada di bawah ambang batas aman.

### D. Apa yang Harus Ditunda (Postponed ke Fase Lanjut)
- **OCR Teks Tangan Penuh Tanpa Konfirmasi Siswa:** Pengenalan tulisan tangan liar di browser tanpa campur tangan konfirmasi pengguna memiliki tingkat kesalahan tinggi (*false positives*). Siswa **wajib** diberikan pratinjau rumus yang terdeteksi untuk disetujui sebelum dianalisis oleh EPE.
- **Penyimpanan Berkas Gambar/Audio Mentah ke Supabase Cloud:** Tunda pengiriman binary blob mentah ke database PostgreSQL utama sampai bucket Supabase Storage terkonfigurasi resmi. Untuk saat ini, simpan referensi lokal atau teks LaTeX terkonversi yang sangat ringan.
- **Dukungan Domain Lanjut Tingkat Tinggi (Geometri Non-Euclidean, Persamaan Diferensial Parsial, Statistik Multivariat):** Fokuskan kekuatan verifikasi deterministik pada domain inti: Aljabar (Linear & Kuadrat), Matriks dasar, dan Kalkulus polinomial dasar.

### E. Risiko Teknis yang Dapat Mengancam Validitas Penelitian
1. **Halusinasi Pengenalan Simbol Matematika:** Jika OCR/AI salah mengenali tanda minus ($-$) menjadi plus ($+$) pada coretan siswa, sistem akan salah mendiagnosis siswa sebagai penderita kesalahan prosedural `E2` padahal siswa menulis dengan benar.  
   *Mitigasi:* Terapkan protokol **Student Verification Guard** (konfirmasi siswa sebelum vonis diagnostik).
2. **Ketergantungan Tunggal pada LLM:** Mengandalkan model bahasa generatif untuk menentukan apakah jawaban matematika benar atau salah terbukti menghasilkan inkonsistensi (*non-deterministic output*).  
   *Mitigasi:* Gunakan aturan deterministik numerik & aljabar simbolik (`MathVerifier`) sebagai hakim verifikasi utama; LLM hanya digunakan sebagai asisten interpretasi penalaran semantik.
3. **Data Loss Akibat Payload Database Terlalu Besar:** Mengunggah citra resolusi tinggi langsung ke baris tabel dapat memicu timeout HTTP 413.  
   *Mitigasi:* Simpan hasil interpretasi terstruktur (LaTeX & AST) di database, simpan gambar di cache lokal atau storage terkompresi.
