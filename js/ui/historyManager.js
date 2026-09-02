/**
 * historyManager.js - Manajemen Riwayat Diagnostik & Ekspor Data CSV/JSON
 * Error Pattern Engine (EPE)
 */

export class HistoryManager {
  constructor(storageKey = "epe_diagnosis_history") {
    this.storageKey = storageKey;
    this.history = this._loadHistory();
  }

  _loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Gagal memuat riwayat dari localStorage:", e);
      return [];
    }
  }

  _saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (e) {
      console.warn("Gagal menyimpan riwayat ke localStorage:", e);
    }
  }

  /**
   * Menambahkan entri diagnosis baru ke dalam riwayat
   */
  addEntry(resultPackage) {
    if (!resultPackage) return;
    const entry = {
      id: "diag_" + Date.now(),
      timestamp: new Date().toLocaleString("id-ID"),
      studentId: resultPackage.studentId,
      questionId: resultPackage.questionId,
      questionTitle: resultPackage.questionTitle || resultPackage.questionId,
      domain: resultPackage.domainCode,
      primaryErrorCode: resultPackage.primaryErrorCode || "E1",
      primaryError: resultPackage.primaryErrorText,
      secondaryError: resultPackage.secondaryErrorText,
      confidence: resultPackage.confidenceText,
      evidence: resultPackage.evidence,
      remediation: resultPackage.remediation,
      isCorrect: resultPackage.isCorrect || false,
      hasImage: !!resultPackage.media?.image,
      hasAudio: !!resultPackage.media?.audio
    };

    this.history.unshift(entry);
    // Batasi maksimum 150 entri terakhir
    if (this.history.length > 150) {
      this.history.pop();
    }
    this._saveHistory();
    return entry;
  }

  /**
   * Mengambil semua daftar riwayat diagnosis
   */
  getAll() {
    return this.history;
  }

  /**
   * Mengambil ringkasan statistik taksonomi kesalahan
   */
  getStats() {
    const total = this.history.length;
    const counts = { E0: 0, E1: 0, E2: 0, E3: 0, E4: 0 };
    
    this.history.forEach((h) => {
      const code = h.primaryErrorCode || "E1";
      if (counts[code] !== undefined) {
        counts[code]++;
      }
    });

    return {
      total,
      counts,
      percentages: {
        E0: total ? Math.round((counts.E0 / total) * 100) : 0,
        E1: total ? Math.round((counts.E1 / total) * 100) : 0,
        E2: total ? Math.round((counts.E2 / total) * 100) : 0,
        E3: total ? Math.round((counts.E3 / total) * 100) : 0,
        E4: total ? Math.round((counts.E4 / total) * 100) : 0
      }
    };
  }

  /**
   * Menghapus 1 entri berdasarkan ID
   */
  deleteEntry(id) {
    this.history = this.history.filter((item) => item.id !== id);
    this._saveHistory();
  }

  /**
   * Mengosongkan seluruh riwayat diagnosis
   */
  clear() {
    this.history = [];
    this._saveHistory();
  }

  /**
   * Ekspor seluruh riwayat diagnosis ke format file CSV untuk analisis data riset
   */
  exportToCSV() {
    if (this.history.length === 0) {
      return { success: false, message: "Belum ada riwayat diagnosa untuk diekspor." };
    }

    const headers = [
      "No",
      "Waktu Diagnosa",
      "Nama/ID Siswa",
      "Nomor Soal",
      "Judul/Topik Soal",
      "Domain",
      "Kesalahan Utama",
      "Kesalahan Kedua",
      "Skor Keyakinan",
      "Bukti Analisis",
      "Rekomendasi Remediasi"
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = this.history.map((item, idx) => [
      idx + 1,
      escapeCsv(item.timestamp),
      escapeCsv(item.studentId),
      escapeCsv(item.questionId),
      escapeCsv(item.questionTitle || "-"),
      escapeCsv(item.domain),
      escapeCsv(item.primaryError),
      escapeCsv(item.secondaryError),
      escapeCsv(item.confidence),
      escapeCsv(item.evidence),
      escapeCsv(item.remediation)
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `epe_riwayat_diagnosa_${new Date().toISOString().slice(0, 10)}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename, count: this.history.length };
  }
}
