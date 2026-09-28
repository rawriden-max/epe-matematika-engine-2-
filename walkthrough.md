# Walkthrough: EPE V3 — Multimodal Math Reasoning Overhaul & Research Portal Integration

## 📌 Ringkasan Pembaruan Terkini (Phase 1–9 Selesai)

Pembaruan komprehensif ini menyempurnakan seluruh arsitektur **Error Pattern Engine (EPE) V3**, menyelesaikan kendala sinkronisasi data riwayat penelitian, menyediakan pemuat data riset bawaan (26 data riil Q1–Q24), menyempurnakan kanvas visualisasi 3D Tornado, memperluas basis pengetahuan KaTeX AI Matrix, serta **menuntaskan perbaikan rendering rumus matematika pada Pre-Test & Post-Test (mengeliminasi seluruh tampilan script LaTeX mentah)**.

---

## 1. Arsitektur & Komponen Utama yang Telah Diperbaiki

| Modul | Lokasi Berkas | Pembaruan & Peran Utama |
| :--- | :--- | :--- |
| **History Manager** | [`js/ui/historyManager.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/ui/historyManager.js) | Penyatuan kunci penyimpanan ke `epe_history_v2` dengan sinkronisasi dua arah ke `epe_diagnosis_history`. Dilengkapi parser CSV otomatis (pemisah `;` atau `,`), pemuatan batch, dan ekspor 18 kolom multimodal. |
| **Research Portal** | [`index.html`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/index.html) & [`js/app.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/app.js) | Penambahan tombol **"⚡ Muat 24 Data Riset Bawaan"** dan **"📥 Impor CSV Riwayat"**. Data riwayat langsung terpropagasi ke `CubeStore`, `tornadoEngine`, dan `researchExport`. |
| **Assessment UI (Pre/Post-Test)** | [`js/research/assessmentUI.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/research/assessmentUI.js) | **Eliminasi script mentah**: Integrasi KaTeX `auto-render.min.js`, rendering formula langsung pada box soal dan opsi jawaban, penghapusan baris duplikat kode `$x^2...$`, dan fallback matematika rapi saat offline. |
| **Research Export** | [`js/research/researchExport.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/research/researchExport.js) | Dukungan *fallback storage key* (`epe_history_v2` \|\| `epe_diagnosis_history`) agar ekspor penelitian selalu membaca data terbaru tanpa kehilangan riwayat lama. |
| **Assessment Store** | [`js/research/assessmentStore.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/research/assessmentStore.js) | Dukungan pembacaan data diagnosis dari kedua storage key secara transparan. |
| **3D Tornado Engine** | [`js/ui/tornadoEngine.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/ui/tornadoEngine.js) | Pengikatan *event listener* langsung pada `#input-tornado-search` untuk filter instan soal, serta proteksi kanvas berdimensi nol saat perpindahan tab dengan `requestAnimationFrame`. |
| **Matrix AI Assistant** | [`js/ui/aiAgentManager.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/ui/aiAgentManager.js) | Penambahan 3 domain materi lengkap berformat KaTeX: Barisan & Deret (Aritmatika & Geometri), Logaritma (10 Sifat Pokok), dan Matriks (Determinan, Invers $2\times 2$, Perkalian), serta perbaikan sintaks template literal notasi logaritma. |
| **Dokumentasi MVP** | [`EPE_V3_MVP_RECOMMENDATION.md`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/EPE_V3_MVP_RECOMMENDATION.md) | Seluruh daftar periksa status implementasi Phase 1–5 diperbarui menjadi `[x]`. |

---

## 2. Rincian Fitur & Solusi Teknis

### A. Eliminasi Script Mentah & Perbaikan Rendering Rumus (Pre-Test & Post-Test)
Sebelumnya pada layar soal (misalnya Soal 10 Pre-Test):
- Kotak rumus soal menampilkan sintaks mentah: `$$x^2 - (x_1 + x_2)x + (x_1 \cdot x_2) = 0$$` karena library ekstensi `auto-render.min.js` belum dimuat di `index.html`.
- Opsi jawaban menampilkan dua baris ganda: teks biasa (contoh: `x² - x - 12 = 0`) dan di bawahnya muncul kode mentah berwarna biru: `$x^2 - x - 12 = 0$`.
- **Solusi yang Diterapkan**:
  1. Menambahkan `<script defer src=".../auto-render.min.js"></script>` pada [`index.html`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/index.html).
  2. Memperbarui modul [`assessmentUI.js`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/research/assessmentUI.js):
     - Menghapus sub-div duplikat yang mencetak `$${opt.latex}$` mentah di bawah teks opsi.
     - Menerapkan `this.formatFormulaHTML(q.latex, true)` langsung pada kotak rumus utama.
     - Menyediakan fungsi `cleanMathFallback()` untuk mengonversi simbol LaTeX (`\cdot` $\to$ $\cdot$, `\implies` $\to$ $\Rightarrow$, `\frac` $\to$ `/`, `^2` $\to$ ², `_1` $\to$ ₁) secara otomatis jika KaTeX belum siap atau pengguna sedang offline.

### B. Penyatuan Storage Key (`epe_history_v2` ⇄ `epe_diagnosis_history`)
- Ditetapkan konstanta `PRIMARY_HISTORY_KEY = "epe_history_v2"` dan `LEGACY_HISTORY_KEY = "epe_diagnosis_history"`.
- Sinkronisasi dua arah otomatis antara `historyManager`, `researchExport.js`, dan `assessmentStore.js`.

### C. Fitur Impor CSV & Pemuat 24 Data Riset Bawaan
- Tersedia berkas penelitian riil [`data_riwayat_epe_excel_rapi.csv`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/data_riwayat_epe_excel_rapi.csv) berisi 26 catatan diagnosis siswa (Budi Santoso, Siti Rahma, dkk.) untuk soal Q1 hingga Q24.
- Tombol **"⚡ Muat 24 Data Riset Bawaan"** di tab Portal Riset secara instan memuat seluruh data dan memperbarui kanvas **3D Tornado Engine** dan kubus diagnostik.

### D. Format Ekspor CSV Multimodal 18 Kolom
- Memperluas `exportToCSV()` di `historyManager.js` menjadi 18 kolom lengkap dengan header `\uFEFFsep=,\r\n` untuk kompatibilitas penuh dengan Microsoft Excel.

### E. Peningkatan Reaktivitas 3D Tornado Engine
- Filter pencarian langsung di `#input-tornado-search` untuk pencarian instan soal.
- Penanganan ukuran kanvas $0 \times 0$ saat perpindahan tab dengan `requestAnimationFrame` ganda.

### F. Basis Pengetahuan KaTeX Matrix AI & Penanganan Syntax
- Menambahkan modul KaTeX lengkap: Barisan & Deret, 10 Sifat Pokok Logaritma, dan Matriks Determinan/Invers.
- Memperbaiki parsing superskrip notasi logaritma template literal untuk mencegah `SyntaxError`.

---

## 3. Hasil Pengujian & Verifikasi

### A. Pengujian Unit Algoritma & Logika (16/16 PASS)
- Persamaan linear, akar kuadrat, matriks $2\times 2$ & $3\times 3$, turunan kalkulus, rekonstruksi tulisan tangan, dan parser suara: **16/16 PASS**.

### B. Verifikasi Math Rendering (Pre-Test & Post-Test)
- Formula kotak soal: **Tidak ada lagi `$$` atau `\cdot` mentah**, ter-render dalam tipografi KaTeX jernih.
- Opsi jawaban: **Tidak ada lagi kode mentah `$x^2...$` duplikat di bawah teks**, opsi tampil bersih, profesional, dan sejajar dengan nomor abjad A/B/C/D.
- Offline fallback: Teruji mengonversi simbol aljabar ke Unicode ramah mata saat KaTeX tidak tersedia.

### C. Verifikasi Dev Server Localhost:8080 (19/19 PASS)
Semua berkas inti, ekstensi `auto-render.min.js`, dan dataset CSV terverifikasi mengembalikan HTTP `200 OK`.

### D. Verifikasi Otomatis Universal Question Bank & Academic Integrity (50/50 PASS)
Pengujian komprehensif pada [`scratch/test_universal_and_integrity.ps1`](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/scratch/test_universal_and_integrity.ps1):
- Integritas 8 berkas modul baru & ekspor kode: **8/8 PASS**
- Konfigurasi 5 mata pelajaran STEM & model data universal: **6/6 PASS**
- Mesin analisis etis & bank soal terpadu (CRUD, duplikasi, JSON): **7/7 PASS**
- Detektor telemetri & dasbor integritas (tab switch, jeda inaktif, audit): **9/9 PASS**
- Kontainer DOM & integrasi subtab `app.js`: **9/9 PASS**
- Sinkronisasi Cloud Supabase untuk telemetri integritas: **9/9 PASS**
- Uji koneksi live REST API Supabase: **2/2 PASS**
- **TOTAL: 50 / 50 PASS (100% SUKSES)**.

---

## 5. Fitur Baru: Bank Soal Universal & Audit Integritas Akademik (Phase 10)

### A. Bank Soal Universal (Subject-Agnostic Question Bank)
- **Lokasi UI**: Mode Guru $\to$ Tab **"📚 Bank Soal Universal"**
- **Mata Pelajaran Didukung**: Matematika, Fisika, Kimia, Biologi, dan Informatika.
- **Fitur Utama**:
  - Filter cepat per mata pelajaran dengan pill badge dinamis.
  - Pencarian instan (ID, topik materi, teks soal).
  - Formulir Authoring: Buat soal baru, edit, duplikasi, atau hapus.
  - Pratinjau langsung formula KaTeX dan opsi jawaban.
  - Ekspor & Impor Bank Soal berformat JSON standar.
  - Penugasan butir soal langsung ke Pre-Test, Diagnostik Baku, atau Post-Test.

### B. Audit Integritas Akademik (Non-Invasive Telemetry Monitor)
- **Lokasi UI**: Mode Guru $\to$ Tab **"🛡️ Integritas Akademik"**
- **Prinsip Metodologis**:
  - 100% non-invasif: Tidak mengakses webcam, mikrofon, atau biometrik tersembunyi.
  - Merekam sinyal telemetri peramban: perpindahan tab (`visibilitychange`), durasi jendela inaktif, dan tempo pengerjaan kilat (< 3 detik).
  - Bahasa observasional etis: Memberikan status `Review Recommended` jika sinyal objektif terlampaui, bukan menuduh sepihak.
  - Keputusan mutlak di tangan pendidik melalui formulir verifikasi guru disertai catatan manual.
  - Linimasa peristiwa presisi detik (*Event Timeline Audit Modal*).
  - Sinkronisasi telemetri ke Cloud Supabase (`session_events` dan `integrity_signals`).

---

## 6. Panduan Verifikasi Pengguna di Browser

1. Buka peramban di: **`http://127.0.0.1:8080/index.html`**
2. Hard Refresh: **`Ctrl + F5`** (atau `Ctrl + Shift + R`).
3. Masuk ke **Mode Guru**:
   - Klik tombol **"Mode Guru"** di header navigasi.
   - Masukkan PIN Pendidik: **`1234`**.
4. Navigasikan Subtab Mode Guru:
   - **Tab 1 ("📊 Data Riset & Komparasi EPE")**: Melihat data diagnosis aljabar 24 soal, perbandingan Pre vs Post Test, dan ekspor dataset CSV riset.
   - **Tab 2 ("📚 Bank Soal Universal")**: Kelola butir soal untuk Matematika, Fisika, Kimia, Biologi, dan Informatika. Uji coba tombol *"+ Buat Soal Baru"* dan filter mata pelajaran.
   - **Tab 3 ("🛡️ Integritas Akademik")**: Periksa 4 kartu KPI telemetri, tabel aktivitas responden, dan klik **"🔍 Audit Linimasa"** untuk memeriksa riwayat detik pengerjaan siswa.

