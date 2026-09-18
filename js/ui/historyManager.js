/**
 * historyManager.js - Manajemen Riwayat Diagnostik & Ekspor/Impor Data CSV/JSON
 * Error Pattern Engine (EPE V3)
 */

import { saveDiagnosisToSupabase } from "../data/supabaseClient.js";

export const PRIMARY_HISTORY_KEY = "epe_history_v2";
export const LEGACY_HISTORY_KEY = "epe_diagnosis_history";

export class HistoryManager {
  constructor(storageKey = PRIMARY_HISTORY_KEY) {
    this.storageKey = storageKey;
    this.history = this._loadHistory();
  }

  _loadHistory() {
    try {
      // Prioritaskan epe_history_v2, fallback ke epe_diagnosis_history jika kosong
      const savedPrimary = localStorage.getItem(PRIMARY_HISTORY_KEY);
      if (savedPrimary) {
        const parsed = JSON.parse(savedPrimary);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const savedLegacy = localStorage.getItem(LEGACY_HISTORY_KEY);
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrasi otomatis ke format v2
          localStorage.setItem(PRIMARY_HISTORY_KEY, JSON.stringify(parsed));
          return parsed;
        }
      }
      return [];
    } catch (e) {
      console.warn("Gagal memuat riwayat dari localStorage:", e);
      return [];
    }
  }

  _saveHistory() {
    try {
      const dataStr = JSON.stringify(this.history);
      localStorage.setItem(PRIMARY_HISTORY_KEY, dataStr);
      // Sinkronkan juga ke kunci legacy untuk menjaga kompatibilitas komponen lama
      localStorage.setItem(LEGACY_HISTORY_KEY, dataStr);
    } catch (e) {
      console.warn("Gagal menyimpan riwayat ke localStorage:", e);
    }
  }

  /**
   * Menambahkan entri diagnosis baru ke dalam riwayat
   */
  addEntry(resultPackage) {
    if (!resultPackage) return;
    const multi = resultPackage.multimodalEvidence?.multiSignal || resultPackage.media?.multiSignal || null;
    const inputModality = resultPackage.inputModality || resultPackage.media?.source || (resultPackage.media?.image ? "image" : (resultPackage.media?.audio ? "audio" : "typed"));

    const entry = {
      id: "diag_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleString("id-ID"),
      studentId: resultPackage.studentId || "Siswa",
      questionId: resultPackage.questionId,
      questionTitle: resultPackage.questionTitle || resultPackage.questionId,
      domain: resultPackage.domainCode || resultPackage.domain || "",
      primaryErrorCode: resultPackage.primaryErrorCode || "E1",
      primaryError: resultPackage.primaryErrorText || resultPackage.primaryError || "Konseptual",
      secondaryError: resultPackage.secondaryErrorText || resultPackage.secondaryError || "none",
      confidence: resultPackage.confidenceText || (resultPackage.confidence ? `${resultPackage.confidence}%` : "85%"),
      evidence: resultPackage.evidence || "-",
      remediation: resultPackage.remediation || "-",
      studentSteps: resultPackage.studentSteps || "",
      studentAnswer: resultPackage.studentAnswer || "",
      isCorrect: resultPackage.isCorrect || resultPackage.primaryErrorCode === "E0",
      hasImage: !!resultPackage.media?.image,
      hasAudio: !!resultPackage.media?.audio,
      inputModality,
      verificationStatus: multi?.status || (resultPackage.isCorrect ? "VERIFIED" : "UNVERIFIED"),
      recognitionConfidence: multi ? `${multi.recognition}%` : (inputModality === "typed" ? "100%" : "-"),
      structuralConfidence: multi ? `${multi.structural}%` : "100%",
      mathematicalConfidence: multi ? `${multi.mathematical}%` : (resultPackage.isCorrect ? "95%" : "80%"),
      stepsCount: resultPackage.multimodalEvidence?.stepCount || (resultPackage.studentSteps ? resultPackage.studentSteps.split("\n").filter(Boolean).length : 0),
      multimodalEvidence: resultPackage.multimodalEvidence || null
    };

    this.history.unshift(entry);
    // Batasi maksimum 250 entri terakhir
    if (this.history.length > 250) {
      this.history.pop();
    }
    this._saveHistory();

    // Simpan otomatis ke database cloud Supabase secara asinkron
    try {
      saveDiagnosisToSupabase(resultPackage);
    } catch (err) {
      console.warn("Supabase auto-save skipped:", err);
    }
    return entry;
  }

  /**
   * Menambahkan kumpulan entri sekaligus secara batch (misal dari impor CSV)
   */
  addBatchEntries(entries = [], replaceAll = false) {
    if (!Array.isArray(entries) || entries.length === 0) return 0;
    if (replaceAll) {
      this.history = [...entries];
    } else {
      // Sisipkan di depan tanpa duplikasi ID
      const existingIds = new Set(this.history.map(h => h.id));
      const toAdd = entries.filter(e => !existingIds.has(e.id));
      this.history = [...toAdd, ...this.history];
    }
    if (this.history.length > 300) {
      this.history = this.history.slice(0, 300);
    }
    this._saveHistory();
    return entries.length;
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
      let code = h.primaryErrorCode;
      if (!code && h.primaryError) {
        const m = h.primaryError.match(/\[?(E[0-4])\]?/);
        if (m) code = m[1];
      }
      code = code || "E1";
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
   * Parser CSV cerdas yang mendukung pemisah koma (,) dan titik koma (;),
   * UTF-8 BOM, serta tanda petik multi-line yang lazim diekspor dari Microsoft Excel.
   */
  parseCSVText(csvContent) {
    if (!csvContent || typeof csvContent !== "string") return [];

    // Bersihkan UTF-8 BOM dan direktif sep=
    let cleanText = csvContent.replace(/^\uFEFF/, "").trim();
    if (cleanText.startsWith("sep=")) {
      const nlIdx = cleanText.indexOf("\n");
      if (nlIdx !== -1) cleanText = cleanText.slice(nlIdx + 1).trim();
    }

    // Deteksi otomatis pemisah (koma vs titik-koma) berdasarkan baris pertama
    const firstLine = cleanText.split(/\r?\n/)[0] || "";
    const semiCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delimiter = semiCount >= commaCount ? ";" : ",";

    // State machine untuk parsing CSV dengan handling kutipan quote ganda
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Lewati quote kedua
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === "\r" || char === "\n") && !insideQuotes) {
        if (char === "\r" && nextChar === "\n") i++;
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
      } else {
        currentCell += char;
      }
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
    }

    if (rows.length < 2) return [];

    // Mapping header ke key
    const headerRow = rows[0].map(h => h.toLowerCase().replace(/["\s_\-\/]/g, ""));
    const findCol = (...aliases) => {
      for (const a of aliases) {
        const cleanA = a.toLowerCase().replace(/["\s_\-\/]/g, "");
        const idx = headerRow.findIndex(h => h.includes(cleanA));
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colTimestamp = findCol("waktusubmit", "waktudiagnosa", "timestamp", "waktu");
    const colStudent = findCol("namasiswa", "namaidsiswa", "studentid", "nama", "student");
    const colQid = findCol("kodesoal", "nomorsoal", "questionid", "soal", "qid");
    const colQTitle = findCol("judultopiksoal", "judultopik", "judulsoal", "topik", "questiontitle");
    const colDomain = findCol("domain");
    const colPrimErr = findCol("kesalahanutama", "primaryerror", "errorutama", "kesalahan");
    const colSecErr = findCol("kesalahankedua", "secondaryerror");
    const colConf = findCol("keyakinan", "skorkeyakinan", "confidence");
    const colEvidence = findCol("bukticoretansiswa", "buktianalisis", "bukti", "evidence");
    const colRemed = findCol("rekomendasiremediasi", "remediasi", "remediation", "learningneed");
    const colAnswer = findCol("jawabansiswa", "studentanswer", "jawaban");
    const colSteps = findCol("langkahpengerjaan", "studentsteps", "langkah");
    const colInputType = findCol("tipeinput", "inputtype", "modality");

    const entries = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const qid = (colQid !== -1 && row[colQid]) ? row[colQid].trim().toUpperCase() : `Q${r}`;
      const primErrRaw = (colPrimErr !== -1 && row[colPrimErr]) ? row[colPrimErr].trim() : "Akurat";

      let errCode = "E1";
      const codeMatch = primErrRaw.match(/\[?(E[0-4])\]?/i);
      if (codeMatch) {
        errCode = codeMatch[1].toUpperCase();
      } else if (primErrRaw.toLowerCase().includes("akurat")) {
        errCode = "E0";
      }

      const domainVal = (colDomain !== -1 && row[colDomain]) ? row[colDomain].trim() : (qid.startsWith("Q") ? `D${Math.ceil(parseInt(qid.slice(1), 10) / 4) || 1}` : "D1");

      const entry = {
        id: `csv_${Date.now()}_${r}`,
        timestamp: (colTimestamp !== -1 && row[colTimestamp]) ? row[colTimestamp].trim() : new Date().toLocaleString("id-ID"),
        studentId: (colStudent !== -1 && row[colStudent]) ? row[colStudent].trim() : `Siswa_${r.toString().padStart(2, "0")}`,
        questionId: qid,
        questionTitle: (colQTitle !== -1 && row[colQTitle]) ? row[colQTitle].trim() : `${qid} · Soal Instrumen`,
        domain: domainVal,
        primaryErrorCode: errCode,
        primaryError: primErrRaw,
        secondaryError: (colSecErr !== -1 && row[colSecErr]) ? row[colSecErr].trim() : "none",
        confidence: (colConf !== -1 && row[colConf]) ? row[colConf].trim() : "85%",
        evidence: (colEvidence !== -1 && row[colEvidence]) ? row[colEvidence].trim() : "-",
        remediation: (colRemed !== -1 && row[colRemed]) ? row[colRemed].trim() : "-",
        studentAnswer: (colAnswer !== -1 && row[colAnswer]) ? row[colAnswer].trim() : "-",
        studentSteps: (colSteps !== -1 && row[colSteps]) ? row[colSteps].trim() : "-",
        isCorrect: errCode === "E0",
        inputModality: (colInputType !== -1 && row[colInputType]) ? row[colInputType].trim() : "typed",
        verificationStatus: errCode === "E0" ? "VERIFIED" : "PARTIAL",
        stepsCount: 1
      };

      entries.push(entry);
    }

    return entries;
  }

  /**
   * Impor berkas CSV langsung ke riwayat
   */
  importFromCSV(csvContent, replaceAll = false) {
    const entries = this.parseCSVText(csvContent);
    if (entries.length === 0) {
      return { success: false, message: "Format CSV tidak valid atau tidak memiliki baris data." };
    }
    const count = this.addBatchEntries(entries, replaceAll);
    return { success: true, count, entries };
  }

  /**
   * Ekspor seluruh riwayat diagnosis ke format file CSV untuk analisis data riset
   * Dilengkapi 18 kolom komprehensif termasuk metadata multimodal.
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
      "Rekomendasi Remediasi",
      "Jawaban Siswa",
      "Langkah Pengerjaan",
      "Tipe Input",
      "Status Verifikasi",
      "Skor Pengenalan",
      "Skor Struktural",
      "Skor Matematika"
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = this.history.map((item, idx) => {
      const multi = item.multimodalEvidence?.multiSignal || null;
      const inputModality = item.inputModality || (item.hasImage ? "image" : (item.hasAudio ? "audio" : "typed"));
      const recog = multi ? `${multi.recognition}%` : (inputModality === "typed" ? "100%" : item.confidence || "85%");
      const struct = multi ? `${multi.structural}%` : "100%";
      const math = multi ? `${multi.mathematical}%` : (item.isCorrect ? "95%" : "80%");

      return [
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
        escapeCsv(item.remediation),
        escapeCsv(item.studentAnswer || "-"),
        escapeCsv(item.studentSteps || "-"),
        escapeCsv(inputModality),
        escapeCsv(item.verificationStatus || (item.isCorrect ? "VERIFIED" : "UNVERIFIED")),
        escapeCsv(recog),
        escapeCsv(struct),
        escapeCsv(math)
      ];
    });

    // Menambahkan BOM \uFEFF dan direktif sep=, agar Microsoft Excel otomatis membagi kolom dengan rapi
    const csvContent = "\uFEFFsep=,\r\n" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
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
