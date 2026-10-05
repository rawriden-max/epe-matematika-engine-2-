# DESIGN.md — Error Pattern Engine (EPE) Matematika

> Dokumen Arah Desain & Identitas Visual Resmi untuk Platform Riset & Asesmen Diagnostik EPE Matematika.  
> Digunakan oleh asisten dan pengembang bersama dengan aturan filter `antislop.md`.

---

## 1. Identitas & Tujuan Platform
- **Produk**: Error Pattern Engine (EPE) Matematika
- **Fungsi Utama**: Platform asesmen diagnostik dan remediasi adaptif berbantuan AI untuk mengidentifikasi 4 pola kesalahan berpikir aljabar siswa (E1: Fakta/Konsep, E2: Keterampilan Berhitung, E3: Prinsip/Aturan, E4: Persepsi/Sintaks) pada 6 domain aljabar (D1–D6).
- **Target Pengguna**: Siswa SMP/MTs & SMA/MA, Guru Matematika, dan Peneliti Pendidikan.
- **Nilai Inti**: Presisi ilmiah, kejujuran akademis, kejelasan langkah berpikir, dan lingkungan belajar yang tenang tanpa distraksi kosmetik.

---

## 2. Karakter & Kepribadian Brand
- **Serius & Berwibawa**: Nuansa akademik yang rapi, bukan platform game kasual atau demo teknologi sci-fi yang berisik.
- **Hangat & Mendukung**: Membantu siswa mengenali letak kesalahan tanpa rasa takut dihakimi.
- **Fokus & Keterbacaan Tinggi**: Konten matematika (rumus KaTeX, grafik, langkah pengerjaan) adalah pemeran utama di layar.

---

## 3. Palet Warna (Color System)
Maksimal 3 warna inti + 1 aksen utama dengan kontras tinggi (memenuhi standar WCAG AA 4.5:1 untuk teks normal dan 3:1 untuk elemen UI).

### Mode Terang (Light Mode):
- **Latar Belakang (Base)**: `#f8fafc` (Slate 50)
- **Permukaan Kartu (Surface)**: `#ffffff` (Solid White, bersih dan tajam)
- **Garis Batas (Border)**: `#e2e8f0` (Slate 200)
- **Teks Primer**: `#0f172a` (Slate 900)
- **Teks Sekunder**: `#475569` (Slate 600)

### Mode Gelap (Dark Mode):
- **Latar Belakang (Base)**: `#090d16` (Deep Midnight Slate)
- **Permukaan Kartu (Surface)**: `#131b2e` (Slate 850, solid kontras)
- **Garis Batas (Border)**: `#24324f` (Slate 750)
- **Teks Primer**: `#f8fafc` (Slate 50)
- **Teks Sekunder**: `#94a3b8` (Slate 400)

### Aksen & Warna Semantik:
- **Aksen Utama**: Amber/Ochre (`#d97706` / `#b45309`) — melambangkan ketelitian, pencerahan kognitif, dan kehangatan belajar.
- **Pre-Test / Berjalan**: Royal Blue (`#2563eb`)
- **Diagnostik**: Deep Indigo (`#4f46e5`)
- **Remediasi**: Warm Amber (`#d97706`)
- **Tuntas / Benar**: Emerald (`#059669`)
- **Pola Salah / Perlu Perhatian**: Crimson/Rose (`#e11d48`)

---

## 4. Tipografi
- **Antarmuka Umum**: `Plus Jakarta Sans`, `Inter`, atau sans-serif sistem modern untuk keterbacaan instruksi soal dan analisis.
- **Notasi Matematika**: `KaTeX` (Computer Modern / TeX Math fonts) untuk ekspresi aljabar presisi.
- **Kode & Taksonomi**: `JetBrains Mono` / `font-mono` khusus untuk kode matriks (D1–D6, E1–E4) dan ID butir soal.

---

## 5. Dosis Visual & Komponen (Anti-Slop Boundaries)
- **Glassmorphism**: Dibatasi maksimal pada navbar saat melayang (*sticky header*). Seluruh kartu konten, formulir, dan modal menggunakan latar solid berbatas kontras.
- **Glow & Shadow**: Bayangan tipis berbasis elevasi nyata (`box-shadow: 0 1px 3px rgba(0,0,0,0.08)`). Dilarang menyematkan efek glow berpendar tanpa fungsi hierarki.
- **Radius Sudut**: Berjenjang teratur:
  - Tombol aksi & input: `8px` (`rounded-lg`)
  - Kartu kontainer: `12px` – `16px` (`rounded-xl`)
  - Badge tag: `6px` (`rounded-md`)
- **Tombol**: Ukuran sentuh minimum pada mobile adalah `44 × 44px`.

---

## 6. Pengaturan Dial Antislop (Liveliness Dials)
- **ENERGY: 2** (Fokus, tenang, dan terstruktur; tidak ada ornamen liar atau animasi bergerak yang membingungkan siswa saat membaca soal).
- **RHYTHM: 2** (Hierarki jelas sesuai 4 pilar asesmen: Pre-Test -> Diagnostik -> Remediasi -> Post-Test).
- **MOTION: 1** (Mikro-interaksi halus pada hover/focus tombol, feedback transisi halaman responsif, tanpa floating/spinning berlebihan).
