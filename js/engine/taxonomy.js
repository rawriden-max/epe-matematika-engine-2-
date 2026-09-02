/**
 * taxonomy.js - Taksonomi Kesalahan Kognitif & Generator Remediasi Adaptif
 * Error Pattern Engine (EPE)
 */

export const TAXONOMY = {
  E0: {
    code: "E0",
    label: "Akurat / Bebas Kesalahan",
    shortName: "Tidak Ada Kesalahan",
    description: "Pemahaman konsep, urutan prosedur, komputasi numerik, dan interpretasi hasil sepenuhnya benar dan akurat.",
    badgeClass: "badge-e0",
    color: "#10b981",
    getRemediation: (topic) => "Penyelesaian benar. Pertahankan pemahaman dan ketelitian Anda!"
  },
  E1: {
    code: "E1",
    label: "E1 - Kesalahan Konseptual",
    shortName: "Konseptual",
    description: "Pemahaman dasar keliru terhadap definisi, teorema, atau prinsip fundamental matematika (contoh: D < 0 dianggap nilai akar negatif, koefisien dianggap akar, salah rumus).",
    badgeClass: "badge-e1",
    color: "#ef4444",
    getRemediation: (topic) => `Pelajari ulang konsep dasar ${topic}. Pahami kembali definisi, teorema, dan prinsip fundamental yang mendasari materi ini.`
  },
  E2: {
    code: "E2",
    label: "E2 - Kesalahan Prosedural",
    shortName: "Prosedural",
    description: "Konsep yang dipilih sudah tepat, namun langkah pengerjaan atau algoritma aljabar salah/terbalik (contoh: salah pasangan faktor, pembuat nol terbalik, salah substitusi rumus).",
    badgeClass: "badge-e2",
    color: "#f97316",
    getRemediation: (topic) => `Latihan langkah prosedural ${topic}. Terapkan tahapan aljabar secara sistematis dan cermati setiap langkah pemfaktoran atau substitusi rumus.`
  },
  E3: {
    code: "E3",
    label: "E3 - Kesalahan Komputasi",
    shortName: "Komputasi",
    description: "Konsep dan prosedur sudah benar, namun terjadi kesalahan dalam operasi hitung aritmetika, perkalian tanda bilangan bulat, pemangkatan, atau penyederhanaan bentuk akar/pecahan.",
    badgeClass: "badge-e3",
    color: "#eab308",
    getRemediation: (topic) => `Periksa operasi hitung ${topic}. Tingkatkan ketelitian dalam operasi perkalian tanda positif/negatif, kuadrat, dan penyederhanaan pembagian.`
  },
  E4: {
    code: "E4",
    label: "E4 - Kesalahan Interpretasi",
    shortName: "Interpretasi",
    description: "Perhitungan aljabar selesai, namun penafsiran makna hasil pada konteks masalah salah (contoh: memilih nilai negatif untuk ukuran panjang/waktu fisik, mengabaikan syarat konteks nyata).",
    badgeClass: "badge-e4",
    color: "#8b5cf6",
    getRemediation: (topic) => `Latihan interpretasi konteks ${topic}. Selalu evaluasi apakah hasil matematika masuk akal terhadap konteks fisis/geometris nyata.`
  }
};

/**
 * Format string output untuk field 'Kesalahan satu' atau 'Kesalahan kedua'
 */
export function formatErrorLabel(errorCode, specificDetail = "") {
  if (!errorCode || errorCode === "E0" || errorCode === "none") {
    return "Tidak ada";
  }
  const tax = TAXONOMY[errorCode];
  if (!tax) return errorCode;
  return specificDetail ? `${tax.label} (${specificDetail})` : tax.label;
}

/**
 * Generate teks remediasi adaptif berdasarkan kode kesalahan dan topik soal
 */
export function generateRemediation(primaryCode, topic, customAdvice = "") {
  if (!primaryCode || primaryCode === "E0") {
    return TAXONOMY.E0.getRemediation(topic);
  }
  const tax = TAXONOMY[primaryCode];
  const baseRemediation = tax ? tax.getRemediation(topic) : `Pelajari kembali materi ${topic}.`;
  if (customAdvice) {
    return `${baseRemediation} Catatan khusus: ${customAdvice}`;
  }
  return baseRemediation;
}
