# Error Pattern Engine (EPE) - Diagnostik Persamaan Kuadrat & Bank Latihan Ujian

Aplikasi web cerdas berbasis kecerdasan buatan untuk mendeteksi, mendiagnosis, dan merespons pola kesalahan kognitif siswa dalam pemecahan masalah matematika materi **Persamaan Kuadrat**, dilengkapi dengan **Bank Soal Multimedia (Gambar, File, Audio/Voice Note)** untuk persiapan ulangan & ujian.

Dikembangkan untuk mendukung penelitian:  
**"Pengembangan Error Pattern Engine Berbasis Kecerdasan Buatan untuk Adaptive Learning dalam Mendeteksi dan Merespons Pola Kesalahan Siswa pada Pemecahan Masalah Matematika"**

---

## 🌟 Fitur Utama

### 1. 🔬 Mode Diagnostik Baku (24 Soal Penelitian Q1 - Q24)
- **6 Domain Kompetensi ($D1$ s.d. $D6$)**:
  - **D1: Konsep Dasar (Q1 - Q4)** — Bentuk baku, identifikasi koefisien bertanda ($a, b, c$), konsep akar vs koefisien, uji diskriminan dasar.
  - **D2: Faktorisasi (Q5 - Q8)** — Pemfaktoran $a=1$, $a>1$, konstanta negatif, sifat perkalian nol.
  - **D3: Rumus ABC (Q9 - Q12)** — Penetapan parameter, operasi tanda $-4ac$, pembagi $2a$, dan verifikasi solusi.
  - **D4: Diskriminan (Q13 - Q16)** — Karakteristik $D=0$ (akar kembar), $D<0$ (akar imajiner), penentuan batasan parameter $k$.
  - **D5: Hubungan Akar (Q17 - Q20)** — Teorema Vieta ($x_1+x_2$ dan $x_1 \cdot x_2$), penyusunan persamaan baru, identitas aljabar $x_1^2+x_2^2$.
  - **D6: Penerapan (Q21 - Q24)** — Pemodelan geometri persegi panjang, gerak parabola $h(t)=0$, evaluasi reflektif miskonsepsi $D<0$.
- **4 Taksonomi Kesalahan Kognitif ($E0 - E4$)**:
  - **E0 (Akurat)**: Solusi dan langkah pengerjaan sepenuhnya tepat.
  - **E1 (Konseptual)**: Salah memahami definisi, teorema, atau prinsip dasar matematika.
  - **E2 (Prosedural)**: Konsep benar, namun urutan algoritma/langkah aljabar keliru (misal: tanda faktor terbalik).
  - **E3 (Komputasi)**: Konsep & prosedur tepat, namun salah operasi hitung aritmetika / tanda minus.
  - **E4 (Interpretasi)**: Perhitungan aljabar selesai, namun salah menafsirkan makna hasil pada konteks fisis/geometri nyata.
- Format teks baku penelitian siap disalin dengan 1 klik.

---

### 2. 📝 Mode Bank Soal & Latihan Persiapan Ujian (Multimedia)
- **Input Soal Mandiri oleh Siswa & Guru**:
  - **🖼️ Input Gambar**: Upload diagram, grafik fungsi, atau geometri soal (PNG, JPG, WebP) dengan thumbnail dan preview modal.
  - **📁 Input File Lampiran**: Lampirkan materi / lembar kerja dokumen pendukung (PDF, TXT, DOCX) dengan tombol unduh otomatis.
  - **🎙️ Input Audio / Voice Note**: Rekam suara penjelasan langsung menggunakan mikrofon browser (*Record / Stop / Play*) atau upload file audio MP3/WAV.
  - Penulisan rumus matematika interaktif berbasis **KaTeX** ($\LaTeX$).
- **Lembar Pengerjaan Siswa**:
  - Coretan langkah aljabar teks & simbol matematika.
  - **Upload Foto Coretan Siswa**: Foto kertas pengerjaan siswa langsung diunggah ke sistem.
  - **Rekam Suara Penalaran Siswa**: Siswa dapat merekam penalaran lisannya saat memecahkan soal matematika.
  - **Analisis Diagnostik Otomatis**: Sistem otomatis mengklasifikasikan pola kesalahan pengerjaan siswa pada soal latihan dan memberikan remediasi adaptif.
  - Tombol toggle untuk melihat kunci jawaban & pembahasan detail.
  - Ekspor & Impor Bank Soal dalam format file JSON.

---

### 3. 📊 Mode Riwayat & Statistik
- Ringkasan statistik performa: Total Uji, % Akurat (E0), % Konseptual (E1), % Prosedural (E2), % Komputasi (E3), dan % Interpretasi (E4).
- Tabel riwayat diagnosis interaktif dengan waktu, nama siswa, butir soal, kategori kesalahan, dan bukti analisis.
- Tombol **Ekspor CSV / Excel** untuk pengolahan data penelitian lebih lanjut.
- Fitur penghapusan entri individual atau pengosongan seluruh riwayat.

---

## 🚀 Panduan Deployment ke Vercel (Lengkap & Mudah)

Proyek ini telah dikonfigurasi 100% kompatibel dengan hosting Vercel.

### Cara 1: Deploy via GitHub & Vercel (Rekomendasi 100% Berhasil)
1. Push semua berkas terbaru ke repositori GitHub Anda (misal: `rawriden-max/epe-matematika-engine`).
2. Buka dashboard proyek di [vercel.com](https://vercel.com).
3. Pada menu **Settings** -> **Build & Development Settings**:
   - **Framework Preset**: Pilih **`Other`** (atau biarkan default)
   - **Build Command**: Kosongkan / Override (Tidak butuh build command karena aplikasi berjalan murni vanilla ES Modules)
   - **Output Directory**: Kosongkan / default `.` (Root)
4. Klik **Deploy** / **Redeploy**. Website akan online dalam 2 detik tanpa hambatan build/esbuild!

### Cara 2: Menjalankan secara Lokal
- Buka file `index.html` langsung di browser Anda (Google Chrome, Microsoft Edge, Mozilla Firefox) atau jalankan ekstensi *Live Server* di VS Code.
- Atau jika ingin menggunakan Vite dev server:
  ```bash
  npm install
  npm run dev
  ```

---

## 📁 Struktur Berkas

```
epe-matematika/
├── index.html                  # Halaman utama aplikasi (3 Tab: Diagnostik, Latihan, Riwayat)
├── README.md                   # Dokumentasi lengkap & panduan deployment
├── package.json                # Skrip build Vite & dependensi
├── vite.config.ts              # Konfigurasi bundler Vite
├── vercel.json                 # Konfigurasi rilis Vercel hosting
├── dist/                       # Direktori siap rilis untuk hosting web
├── css/
│   └── style.css               # Desain modern, responsive, dark/light mode, media recording styling
└── js/
    ├── app.js                  # Controller utama aplikasi web
    ├── data/
    │   ├── questions.js        # Basis data 24 butir soal diagnostik (Q1-Q24)
    │   ├── samplePresets.js    # Preset simulasi jawaban siswa (E0-E4)
    │   └── customQuestionStore.js # Pengelola Bank Soal Latihan Mandiri & Storage
    ├── engine/
    │   ├── taxonomy.js         # Definisi taksonomi kesalahan & generator remediasi
    │   ├── stepAnalyzer.js     # Parser analisis langkah matematika
    │   ├── diagnosticRules.js  # Basis 24 aturan pakar diagnostik
    │   └── epeEngine.js        # Core Error Pattern Engine (Diagnostik 24 Soal & Soal Latihan)
    └── ui/
        ├── mediaManager.js     # Perekam suara browser (Audio Recorder) & upload gambar/file
        ├── mathToolbar.js      # Toolbar simbol matematika
        ├── historyManager.js   # Manajemen riwayat & ekspor CSV
        └── notification.js     # Toast notifikasi
```
