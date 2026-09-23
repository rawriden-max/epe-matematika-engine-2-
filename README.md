# Error Pattern Engine (EPE) V2 - Diagnostik Persamaan Kuadrat & Learning Cubes

Aplikasi web penelitian modern berbasis kecerdasan buatan (*Educational Technology & AI Research Platform*) untuk mendeteksi, mendiagnosis, dan merespons pola kesalahan kognitif siswa dalam pemecahan masalah matematika materi **Persamaan Kuadrat**, terintegrasi dengan **Sistem Gamifikasi 3D Learning Cubes**, **Radial Color Theme Selector**, **Dedicated Error Profile**, serta **Bank Soal Multimedia (Foto Coretan, File, Audio/Voice Note)** untuk persiapan ulangan & ujian.

Dikembangkan untuk mendukung penelitian:  
**"Pengembangan Error Pattern Engine Berbasis Kecerdasan Buatan untuk Adaptive Learning dalam Mendeteksi dan Merespons Pola Kesalahan Siswa pada Pemecahan Masalah Matematika"**

---

## Fitur Utama EPE V2

### 1. Sistem Gamifikasi 3D Learning Cubes (24 Collectible Blocks)
- **Monumen Isometrik Koleksi 24 Kubus**:
  - Menampilkan struktur 3D bertingkat (*Tier 0: 12 fondasi, Tier 1: 7 tengah, Tier 2: 4 atas, Tier 3: 1 mahkota capstone*).
  - Terinspirasi estetika balok kristal transparan dengan *neon top stud* dan pencahayaan lembut.
  - Ringan dan berkinerja tinggi (Canvas 2D, 60 FPS pada laptop maupun smartphone tanpa WebGL berat).
- **Completion Pull**:
  - Kubus yang belum dikerjakan (`LOCKED`) tetap terlihat sebagai siluet wireframe transparan pada posisinya, memicu dorongan motivasi: *"Aku sudah mulai membangun sesuatu. Tinggal sedikit lagi sampai lengkap."*
- **Reward untuk Proses (Bukan Hanya Jawaban Benar)**:
  - Jawaban salah **tetap memberikan kubus** dengan status `DIAGNOSED_ERROR` (warna amber hangat, bukan tanda gagal).
  - Setelah menyelesaikan latihan remediasi adaptif, kubus berevolusi menjadi `REMEDIATED` (*Crystal Teal Shimmer*) hingga `VERIFIED`.
- **Interaktivitas Ringan**:
  - Hover balok untuk efek elevasi dan *floating tooltip* detail soal.
  - Klik balok untuk langsung membuka lembar soal di workspace.
  - Modal **"Buka Koleksi (View Collection)"** untuk melihat rincian progres dan milestone.

---

### 2. Radial Circular Color Theme Selector
- Menu pemilih warna melingkar di navbar dengan animasi *spring scale-rotate-fade*.
- 6 pilihan tema warna kurasi:
  1. **Electric Blue** (Default AI Research)
  2. **Violet** (Deep Modern Intelligence)
  3. **Emerald** (Bio-Tech Growth)
  4. **Amber** (Warm Cognitive Focus)
  5. **Rose** (Vibrant Minimalist)
  6. **Cyan** (Futuristic Quantum Glow)
- Mengubah design tokens CSS (`--accent`, `--accent-glow`, `--accent-subtle`, dan rona monumen kubus 3D) secara instan dan tersimpan di `localStorage`.

---

### 3. Mode Diagnostik Baku (Alur 3-Langkah Minimalis)
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

### 4. Dedicated Error Profile Page
- Halaman visual khusus yang memetakan pola kelemahan siswa secara objektif.
- Grafik sebaran taksonomi $E1 - E4$.
- Indikator **Pola Dominan** (*e.g., E2 Prosedural*) & **Domain Paling Menantang** (*e.g., D3 Rumus ABC*).
- **Before vs After Remediation Tracker**: Rekaman kuantitatif pemulihan pola kesalahan setelah intervensi belajar adaptif.

---

### 5. Mode Bank Soal & Latihan Ujian (Multimedia)
- **Input Soal Mandiri Guru & Siswa**:
  - Lampiran Gambar Diagram (PNG, JPG, WebP) dengan Lightbox Zoom.
  - Lampiran Dokumen Lembar Kerja (PDF, TXT, DOCX).
  - Rekaman Suara Penjelasan Soal via Mikrofon Browser (WebM/WAV).
  - Penulisan rumus matematika interaktif berbasis **KaTeX** ($\LaTeX$).
- **Lembar Pengerjaan Siswa**:
  - Upload Foto Coretan Kertas langsung dari HP/kamera.
  - Rekam Suara Penalaran Lisan saat memecahkan masalah.
  - Analisis diagnostik otomatis & toggle kunci jawaban/pembahasan.
  - Ekspor & Impor Bank Soal (JSON).

---

### 6. Mode Riset & Guru (Research Mode Terpisah)
- Memisahkan dashboard siswa dengan tampilan analitik penelitian saintifik.
- Matriks distribusi $D1-D6 \times E1-E4$, tingkat keyakinan sistem, dan bukti analisis.
- Sinkronisasi Cloud Database Supabase & Ekspor CSV Lokal.

---

## Panduan Menjalankan Aplikasi

### Cara 1: Menjalankan secara Lokal
- Jalankan file server ringan via PowerShell:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\server.ps1
  ```
  Lalu buka **`http://127.0.0.1:8080/`** di browser Anda.

### Cara 2: Deploy ke Vercel / GitHub Pages
1. Push repositori ke GitHub.
2. Hubungkan ke [vercel.com](https://vercel.com).
3. Biarkan framework preset default (**Other** / static), website langsung online tanpa proses compile!

---

## Struktur Berkas EPE V2

```
epe-matematika/
├── index.html                  # Antarmuka utama EPE V2 (Progressive Disclosure)
├── README.md                   # Dokumentasi lengkap V2
├── server.ps1                  # Server lokal PowerShell siap pakai (port 8080)
├── css/
│   └── style.css               # Design system tokens, radial color menu, 3D styling
└── js/
    ├── app.js                  # Master Controller EPE V2
    ├── data/
    │   ├── cubeStore.js        # Data store & state machine 24 Learning Cubes
    │   ├── questions.js        # Basis data 24 butir soal diagnostik baku (Q1-Q24)
    │   ├── samplePresets.js    # Preset simulasi pengerjaan siswa (E0-E4)
    │   ├── customQuestionStore.js # Bank Soal latihan mandiri & storage
    │   └── supabaseClient.js   # Sinkronisasi Cloud Database Supabase
    ├── engine/
    │   ├── diagnosticRules.js  # 24 Aturan pakar diagnostik (Research Core - Untouched)
    │   ├── epeEngine.js        # Core Error Pattern Engine (Untouched)
    │   ├── stepAnalyzer.js     # Parser analisis langkah matematika
    │   └── taxonomy.js         # Definisi taksonomi E0-E4 & generator remediasi
    └── ui/
        ├── cubeEngine.js       # 3D Isometric Monument Engine (24 blocks canvas)
        ├── themeManager.js     # Radial circular color selector (6 palettes)
        ├── motivationManager.js# Micro-rewards, milestones, continue learning
        ├── errorProfile.js     # Visualisasi profil pola kesalahan & evolusi remediasi
        ├── historyManager.js   # Manajemen riwayat & ekspor CSV
        ├── mathToolbar.js      # Toolbar simbol matematika
        ├── mediaManager.js     # Audio recorder & upload foto/dokumen
        └── notification.js     # Toast notifikasi
```
