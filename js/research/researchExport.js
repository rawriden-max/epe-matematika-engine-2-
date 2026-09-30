/**
 * researchExport.js - Generator Ekspor CSV Dataset Penelitian EPE V2.2
 * 
 * Varian Ekspor:
 * 1. Export Pre-Test CSV
 * 2. Export Diagnostic CSV
 * 3. Export Remediation CSV
 * 4. Export Post-Test CSV
 * 5. Export Combined Research Dataset (Pre-Test -> Diagnostic -> Remediation -> Post-Test)
 */

import { AssessmentStore } from "./assessmentStore.js";
import { AssessmentManager } from "./assessmentManager.js";
import { SubjectRegistry } from "../engine/universal/subjectRegistry.js";

export class ResearchExport {
  /**
   * Helper untuk mengunduh Blob CSV dengan UTF-8 BOM agar rapi di Microsoft Excel
   */
  static triggerDownload(csvContent, filename) {
    // Murni UTF-8 BOM tanpa "sep=," yang merusak baris pertama di Microsoft Excel
    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper untuk mengunduh Spreadsheet Excel (.xls) berstandar XML/HTML
   * Kolom otomatis terpisah rapi tanpa kendala koma/titik-koma lokal
   */
  static triggerDownloadExcel(htmlContent, filename) {
    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Helper normalisasi kode subjek untuk pencocokan dwibahasa (ID/EN)
   */
  static normalizeSubjectKey(sub) {
    if (!sub) return "mathematics";
    const s = String(sub).toLowerCase().trim();
    if (s === "matematika" || s === "math" || s === "mathematics") return "mathematics";
    if (s === "fisika" || s === "physics") return "physics";
    if (s === "kimia" || s === "chemistry") return "chemistry";
    if (s === "biologi" || s === "biology") return "biology";
    if (s === "informatika" || s === "informatics" || s === "computer_science") return "informatics";
    return s;
  }

  /**
   * 1. Export Pre-Test / Tugas CSV
   */
  static exportPreTestCSV(targetSubject = "all") {
    let attempts = AssessmentStore.getAllAttempts("pretest");
    if (targetSubject && targetSubject !== "all") {
      const normTarget = this.normalizeSubjectKey(targetSubject);
      attempts = attempts.filter(a => this.normalizeSubjectKey(a.subject) === normTarget);
    }

    if (attempts.length === 0) {
      alert(`Belum ada data Pre-Test / Tugas yang terekam${targetSubject !== "all" ? ` untuk bidang ${targetSubject}` : ""}.`);
      return { success: false };
    }

    const headers = [
      "attempt_id",
      "student_id",
      "student_name",
      "student_class",
      "subject",
      "test_type",
      "test_form",
      "timestamp",
      "duration_seconds",
      "score",
      "accuracy",
      "correct_count",
      "total_questions",
      "errors_E0",
      "errors_E1",
      "errors_E2",
      "errors_E3",
      "errors_E4",
      "domain_D1",
      "domain_D2",
      "domain_D3",
      "domain_D4",
      "domain_D5",
      "domain_D6"
    ];

    const rows = attempts.map((a) => [
      this.escapeCsv(a.attemptId),
      this.escapeCsv(a.studentId),
      this.escapeCsv(a.studentName),
      this.escapeCsv(a.studentClass || localStorage.getItem("epe_student_class") || "-"),
      this.escapeCsv(a.subject || "mathematics"),
      this.escapeCsv(a.testType),
      this.escapeCsv(a.testForm),
      this.escapeCsv(a.completedAt || a.timestamp),
      this.escapeCsv(a.durationSeconds),
      this.escapeCsv(a.score),
      this.escapeCsv(a.accuracy),
      this.escapeCsv(a.correctCount),
      this.escapeCsv(a.totalQuestions),
      this.escapeCsv(a.errorDistribution?.E0 ?? 0),
      this.escapeCsv(a.errorDistribution?.E1 ?? 0),
      this.escapeCsv(a.errorDistribution?.E2 ?? 0),
      this.escapeCsv(a.errorDistribution?.E3 ?? 0),
      this.escapeCsv(a.errorDistribution?.E4 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D1 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D2 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D3 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D4 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D5 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D6 ?? 0)
    ]);

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
    const filename = `epe_pretest_tugas_${targetSubject}_${new Date().toISOString().slice(0, 10)}.csv`;
    this.triggerDownload(csvContent, filename);
    return { success: true, count: attempts.length, filename };
  }

  /**
   * 2. Export Diagnostic CSV
   */
  static exportDiagnosticCSV() {
    try {
      const rawHist = localStorage.getItem("epe_history_v2") || localStorage.getItem("epe_diagnosis_history");
      const history = rawHist ? JSON.parse(rawHist) : [];
      if (!Array.isArray(history) || history.length === 0) {
        alert("Belum ada data diagnostik baku yang tersimpan.");
        return { success: false };
      }

      const headers = [
        "id",
        "timestamp",
        "student_id",
        "question_id",
        "question_title",
        "domain",
        "primary_error",
        "secondary_error",
        "confidence",
        "evidence",
        "remediation",
        "input_type",
        "recognition_confidence",
        "structural_confidence",
        "mathematical_confidence",
        "verification_status",
        "evidence_trace",
        "steps_count"
      ];

      const rows = history.map((h) => {
        const multi = h.multimodalEvidence?.multiSignal || h.media?.multiSignal || null;
        const inputModality = h.inputModality || h.media?.source || (h.media?.image ? "image" : (h.media?.audio ? "audio" : "typed"));
        const recogConf = multi ? `${multi.recognition}%` : (inputModality === "typed" ? "100%" : "-");
        const structConf = multi ? `${multi.structural}%` : "100%";
        const mathConf = multi ? `${multi.mathematical}%` : "100%";
        const verifStatus = multi ? multi.status : (h.stepReconstruction?.hasAnomalies ? "INVALID_TRANSFORMATION" : "VERIFIED");
        const evidenceTrace = h.stepReconstruction?.primaryAnomaly?.evidence || h.evidence || "-";

        return [
          this.escapeCsv(h.id),
          this.escapeCsv(h.timestamp),
          this.escapeCsv(h.studentId),
          this.escapeCsv(h.questionId),
          this.escapeCsv(h.questionTitle || "-"),
          this.escapeCsv(h.domain),
          this.escapeCsv(h.primaryError),
          this.escapeCsv(h.secondaryError || "-"),
          this.escapeCsv(h.confidence),
          this.escapeCsv(h.evidence),
          this.escapeCsv(h.remediation),
          this.escapeCsv(inputModality),
          this.escapeCsv(recogConf),
          this.escapeCsv(structConf),
          this.escapeCsv(mathConf),
          this.escapeCsv(verifStatus),
          this.escapeCsv(evidenceTrace),
          this.escapeCsv(h.stepReconstruction?.steps?.length || 1)
        ];
      });

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const filename = `epe_research_diagnostic_${new Date().toISOString().slice(0, 10)}.csv`;
      this.triggerDownload(csvContent, filename);
      return { success: true, count: history.length, filename };
    } catch (e) {
      console.error("Gagal export diagnostik:", e);
      return { success: false };
    }
  }

  /**
   * 3. Export Remediation CSV
   */
  static exportRemediationCSV() {
    try {
      const rawRem = localStorage.getItem("epe_remediation_history");
      const remList = rawRem ? JSON.parse(rawRem) : [];
      
      // Jika list kosong, kumpulkan dari kubus berstatus remediated
      let rowsData = [...remList];
      if (rowsData.length === 0) {
        const rawCubes = localStorage.getItem("epe_learning_cubes_v2");
        if (rawCubes) {
          const cubes = JSON.parse(rawCubes);
          Object.values(cubes).forEach((c) => {
            if (c.status === "remediated" || c.remediated) {
              rowsData.push({
                id: `rem_cube_${c.id}`,
                timestamp: c.remediatedAt || new Date().toISOString(),
                studentId: AssessmentStore.getActiveStudent().studentId,
                questionId: c.questionId || c.id,
                domain: c.domain || "-",
                notes: "Sesi Remediasi Pembelajaran Kubus"
              });
            }
          });
        }
      }

      if (rowsData.length === 0) {
        alert("Belum ada data sesi remediasi/latihan yang terekam.");
        return { success: false };
      }

      const headers = ["remediation_id", "timestamp", "student_id", "question_id", "domain", "notes"];
      const rows = rowsData.map((r) => [
        this.escapeCsv(r.id),
        this.escapeCsv(r.timestamp),
        this.escapeCsv(r.studentId),
        this.escapeCsv(r.questionId || "-"),
        this.escapeCsv(r.domain || "-"),
        this.escapeCsv(r.notes || "Sesi Remediasi Terjadwal")
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const filename = `epe_research_remediation_${new Date().toISOString().slice(0, 10)}.csv`;
      this.triggerDownload(csvContent, filename);
      return { success: true, count: rowsData.length, filename };
    } catch (e) {
      console.error("Gagal export remediasi:", e);
      return { success: false };
    }
  }

  /**
   * 4. Export Post-Test / Remedial CSV
   */
  static exportPostTestCSV(targetSubject = "all") {
    let attempts = AssessmentStore.getAllAttempts("posttest");
    if (targetSubject && targetSubject !== "all") {
      const normTarget = this.normalizeSubjectKey(targetSubject);
      attempts = attempts.filter(a => this.normalizeSubjectKey(a.subject) === normTarget);
    }

    if (attempts.length === 0) {
      alert(`Belum ada data Post-Test / Remedial yang terekam${targetSubject !== "all" ? ` untuk bidang ${targetSubject}` : ""}.`);
      return { success: false };
    }

    const headers = [
      "attempt_id",
      "student_id",
      "student_name",
      "student_class",
      "subject",
      "test_type",
      "test_form",
      "timestamp",
      "duration_seconds",
      "score",
      "accuracy",
      "correct_count",
      "total_questions",
      "errors_E0",
      "errors_E1",
      "errors_E2",
      "errors_E3",
      "errors_E4",
      "domain_D1",
      "domain_D2",
      "domain_D3",
      "domain_D4",
      "domain_D5",
      "domain_D6"
    ];

    const rows = attempts.map((a) => [
      this.escapeCsv(a.attemptId),
      this.escapeCsv(a.studentId),
      this.escapeCsv(a.studentName),
      this.escapeCsv(a.studentClass || localStorage.getItem("epe_student_class") || "-"),
      this.escapeCsv(a.subject || "mathematics"),
      this.escapeCsv(a.testType),
      this.escapeCsv(a.testForm),
      this.escapeCsv(a.completedAt || a.timestamp),
      this.escapeCsv(a.durationSeconds),
      this.escapeCsv(a.score),
      this.escapeCsv(a.accuracy),
      this.escapeCsv(a.correctCount),
      this.escapeCsv(a.totalQuestions),
      this.escapeCsv(a.errorDistribution?.E0 ?? 0),
      this.escapeCsv(a.errorDistribution?.E1 ?? 0),
      this.escapeCsv(a.errorDistribution?.E2 ?? 0),
      this.escapeCsv(a.errorDistribution?.E3 ?? 0),
      this.escapeCsv(a.errorDistribution?.E4 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D1 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D2 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D3 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D4 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D5 ?? 0),
      this.escapeCsv(a.domainAccuracy?.D6 ?? 0)
    ]);

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
    const filename = `epe_posttest_remedial_${targetSubject}_${new Date().toISOString().slice(0, 10)}.csv`;
    this.triggerDownload(csvContent, filename);
    return { success: true, count: attempts.length, filename };
  }

  /**
   * 5. Export Combined Research Dataset
   * Menghubungkan: studentId -> pretest -> diagnostic -> remediation -> posttest
   */
  static exportCombinedResearchDataset() {
    const preAttempts = AssessmentStore.getAllAttempts("pretest");
    const postAttempts = AssessmentStore.getAllAttempts("posttest");

    let diagCount = 0;
    let dominantError = "-";
    try {
      const rawHist = localStorage.getItem("epe_history_v2") || localStorage.getItem("epe_diagnosis_history");
      if (rawHist) {
        const hist = JSON.parse(rawHist);
        const uniqueQ = new Set(hist.map((h) => h.questionId));
        diagCount = uniqueQ.size;

        const errCounts = { E1: 0, E2: 0, E3: 0, E4: 0 };
        hist.forEach((h) => {
          if (errCounts[h.primaryErrorCode] !== undefined) errCounts[h.primaryErrorCode]++;
        });
        const dominant = Object.entries(errCounts).sort((a, b) => b[1] - a[1])[0];
        if (dominant && dominant[1] > 0) dominantError = dominant[0];
      }
    } catch (e) {}

    let remCount = 0;
    try {
      const rawRem = localStorage.getItem("epe_remediation_history");
      if (rawRem) remCount = JSON.parse(rawRem).length;
    } catch (e) {}

    if (preAttempts.length === 0 && postAttempts.length === 0 && diagCount === 0) {
      alert("Belum ada data penelitian yang mencukupi untuk digabungkan.");
      return { success: false };
    }

    const headers = [
      "student_id",
      "student_name",
      "pretest_attempt_id",
      "pretest_score",
      "pretest_accuracy",
      "pretest_duration_seconds",
      "pretest_E1",
      "pretest_E2",
      "pretest_E3",
      "pretest_E4",
      "diagnostic_completed_count",
      "diagnostic_dominant_error",
      "remediation_sessions_count",
      "posttest_attempt_id",
      "posttest_score",
      "posttest_accuracy",
      "posttest_duration_seconds",
      "posttest_E1",
      "posttest_E2",
      "posttest_E3",
      "posttest_E4",
      "score_change_points",
      "accuracy_change_points",
      "export_timestamp"
    ];

    const studentInfo = AssessmentStore.getActiveStudent();
    const latestPre = preAttempts.length > 0 ? preAttempts[preAttempts.length - 1] : null;
    const latestPost = postAttempts.length > 0 ? postAttempts[postAttempts.length - 1] : null;

    const scoreChange = latestPre && latestPost ? parseFloat((latestPost.score - latestPre.score).toFixed(1)) : "-";
    const accChange = latestPre && latestPost ? parseFloat(((latestPost.accuracy - latestPre.accuracy) * 100).toFixed(1)) : "-";

    const row = [
      this.escapeCsv(studentInfo.studentId),
      this.escapeCsv(studentInfo.studentName),
      this.escapeCsv(latestPre?.attemptId || "-"),
      this.escapeCsv(latestPre?.score ?? "-"),
      this.escapeCsv(latestPre?.accuracy ?? "-"),
      this.escapeCsv(latestPre?.durationSeconds ?? "-"),
      this.escapeCsv(latestPre?.errorDistribution?.E1 ?? 0),
      this.escapeCsv(latestPre?.errorDistribution?.E2 ?? 0),
      this.escapeCsv(latestPre?.errorDistribution?.E3 ?? 0),
      this.escapeCsv(latestPre?.errorDistribution?.E4 ?? 0),
      this.escapeCsv(diagCount),
      this.escapeCsv(dominantError),
      this.escapeCsv(remCount),
      this.escapeCsv(latestPost?.attemptId || "-"),
      this.escapeCsv(latestPost?.score ?? "-"),
      this.escapeCsv(latestPost?.accuracy ?? "-"),
      this.escapeCsv(latestPost?.durationSeconds ?? "-"),
      this.escapeCsv(latestPost?.errorDistribution?.E1 ?? 0),
      this.escapeCsv(latestPost?.errorDistribution?.E2 ?? 0),
      this.escapeCsv(latestPost?.errorDistribution?.E3 ?? 0),
      this.escapeCsv(latestPost?.errorDistribution?.E4 ?? 0),
      this.escapeCsv(scoreChange),
      this.escapeCsv(accChange),
      this.escapeCsv(new Date().toISOString())
    ];

    const csvContent = [headers.join(","), row.join(",")].join("\r\n");
    const filename = `epe_combined_research_dataset_${new Date().toISOString().slice(0, 10)}.csv`;
    this.triggerDownload(csvContent, filename);
    return { success: true, filename };
  }

  /**
   * 6A. Export Rekap Nilai Siswa ke Format Microsoft Excel (.xls)
   * Kolom otomatis terpisah di Excel tanpa masalah koma/titik-koma, dengan header rapi & warna status
   */
  static exportSubjectGradebookExcel({ subject = "all", testType = "all" } = {}) {
    let preAttempts = AssessmentStore.getAllAttempts("pretest");
    let postAttempts = AssessmentStore.getAllAttempts("posttest");
    let combined = [];

    if (testType === "all" || testType === "pretest") {
      combined.push(...preAttempts.map(a => ({ ...a, typeLabel: "Pre-Test / Tugas" })));
    }
    if (testType === "all" || testType === "posttest") {
      combined.push(...postAttempts.map(a => ({ ...a, typeLabel: "Post-Test / Remedial" })));
    }

    if (subject && subject !== "all") {
      const normTarget = this.normalizeSubjectKey(subject);
      combined = combined.filter(a => this.normalizeSubjectKey(a.subject) === normTarget);
    }

    if (combined.length === 0) {
      alert(`Belum ada data pengerjaan siswa yang tersimpan untuk filter bidang: ${subject}.`);
      return { success: false };
    }

    const normKey = this.normalizeSubjectKey(subject);
    const subjObj = SubjectRegistry.getSubject(normKey);
    const subjName = subjObj ? subjObj.name : (subject === "all" ? "Semua Bidang Studi" : subject);
    const downloadDate = new Date().toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" });

    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Rekap Nilai Siswa</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; }
      table { border-collapse: collapse; width: 100%; }
      .title-row { font-size: 15pt; font-weight: bold; color: #0f172a; text-align: left; }
      .meta-row { font-size: 10pt; color: #475569; }
      th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #475569; padding: 10px 14px; text-align: center; }
      td { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: middle; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .text-left { text-align: left; }
      .badge-normal { background-color: #d1fae5; color: #065f46; font-weight: bold; }
      .badge-review { background-color: #fef3c7; color: #92400e; font-weight: bold; }
      .badge-pre { background-color: #e0e7ff; color: #3730a3; font-weight: bold; }
      .badge-post { background-color: #ccfbf1; color: #115e59; font-weight: bold; }
      .score-bold { font-weight: bold; font-size: 12pt; color: #0f172a; }
    </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="13" class="title-row" style="border: none; padding-bottom: 4px;">
            REKAPITULASI NILAI ASESMEN &amp; TUGAS SISWA - EPE PLATFORM
          </td>
        </tr>
        <tr>
          <td colspan="13" class="meta-row" style="border: none; padding-bottom: 12px;">
            Bidang Studi: <strong>${subjName}</strong> &bull; Total Data: <strong>${combined.length} Responden</strong> &bull; Waktu Unduh: <strong>${downloadDate}</strong>
          </td>
        </tr>
        <thead>
          <tr>
            <th style="width: 45px;">No</th>
            <th style="width: 220px;">ID Pengerjaan</th>
            <th style="width: 200px;">Nama Siswa</th>
            <th style="width: 120px;">Kelas</th>
            <th style="width: 140px;">Bidang Studi</th>
            <th style="width: 160px;">Tipe Asesmen</th>
            <th style="width: 90px;">Skor Nilai</th>
            <th style="width: 80px;">Benar</th>
            <th style="width: 80px;">Total Soal</th>
            <th style="width: 90px;">Akurasi</th>
            <th style="width: 110px;">Durasi</th>
            <th style="width: 160px;">Waktu Selesai</th>
            <th style="width: 160px;">Status Integritas</th>
          </tr>
        </thead>
        <tbody>
    `;

    combined.forEach((a, idx) => {
      const mins = Math.floor((a.durationSeconds || 0) / 60);
      const secs = (a.durationSeconds || 0) % 60;
      const durStr = `${mins}m ${secs}s`;
      const isReview = a.integritySignals?.reviewRecommended;
      const integrityFlag = isReview ? "Review Disarankan" : "Terverifikasi Normal";
      const integrityClass = isReview ? "badge-review" : "badge-normal";
      const studentClass = a.studentClass || localStorage.getItem("epe_student_class") || "Kelas -";
      const subjDisplay = a.subject ? (a.subject.charAt(0).toUpperCase() + a.subject.slice(1)) : "Matematika";
      const dateStr = a.completedAt || a.timestamp ? new Date(a.completedAt || a.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";
      const typeClass = (a.typeLabel || a.testType).toLowerCase().includes("post") ? "badge-post" : "badge-pre";

      html += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-left" style="font-family: Consolas, monospace; font-size: 10pt;">${a.attemptId}</td>
          <td class="text-left" style="font-weight: bold;">${a.studentName || "Siswa"}</td>
          <td class="text-center" style="font-weight: 600;">${studentClass}</td>
          <td class="text-left">${subjDisplay}</td>
          <td class="text-center ${typeClass}">${a.typeLabel || a.testType}</td>
          <td class="text-center score-bold">${a.score ?? 0}</td>
          <td class="text-center">${a.correctCount ?? 0}</td>
          <td class="text-center">${a.totalQuestions ?? 0}</td>
          <td class="text-center" style="font-weight: bold;">${Math.round((a.accuracy || 0) * 100)}%</td>
          <td class="text-center">${durStr}</td>
          <td class="text-center">${dateStr}</td>
          <td class="text-center ${integrityClass}">${integrityFlag}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    </body>
    </html>
    `;

    const filename = `rekap_nilai_guru_${subject}_${new Date().toISOString().slice(0, 10)}.xls`;
    this.triggerDownloadExcel(html, filename);
    return { success: true, count: combined.length, filename };
  }

  /**
   * 6B. Export Rekap Nilai Siswa untuk Guru (CSV dengan Delimiter Semicolon Sesuai Excel Indonesia)
   * Menyediakan database nilai siswa lengkap dengan pemisah semicolon (;) agar otomatis terpisah per kolom
   */
  static exportSubjectGradebookCSV({ subject = "all", testType = "all" } = {}) {
    let preAttempts = AssessmentStore.getAllAttempts("pretest");
    let postAttempts = AssessmentStore.getAllAttempts("posttest");
    let combined = [];

    if (testType === "all" || testType === "pretest") {
      combined.push(...preAttempts.map(a => ({ ...a, typeLabel: "Pre-Test / Tugas" })));
    }
    if (testType === "all" || testType === "posttest") {
      combined.push(...postAttempts.map(a => ({ ...a, typeLabel: "Post-Test / Remedial" })));
    }

    if (subject && subject !== "all") {
      const normTarget = this.normalizeSubjectKey(subject);
      combined = combined.filter(a => this.normalizeSubjectKey(a.subject) === normTarget);
    }

    if (combined.length === 0) {
      alert(`Belum ada data pengerjaan siswa yang tersimpan untuk filter bidang: ${subject}.`);
      return { success: false };
    }

    // Menggunakan pemisah semicolon (;) agar Excel Windows Indonesia otomatis membagi ke kolom terpisah
    const sep = ";";
    const headers = [
      "No",
      "ID Attempt",
      "Nama Siswa",
      "Kelas",
      "Bidang Studi",
      "Tipe Asesmen",
      "Skor Nilai",
      "Jumlah Benar",
      "Total Soal",
      "Persentase Akurasi",
      "Durasi Pengerjaan",
      "Waktu Selesai",
      "Status Integritas"
    ];

    const rows = combined.map((a, idx) => {
      const mins = Math.floor((a.durationSeconds || 0) / 60);
      const secs = (a.durationSeconds || 0) % 60;
      const durStr = `${mins}m ${secs}s`;
      const integrityFlag = a.integritySignals?.reviewRecommended ? "Review Disarankan" : "Normal";
      const studentClass = a.studentClass || localStorage.getItem("epe_student_class") || "-";
      const subjName = a.subject || "Matematika";
      const dateStr = a.completedAt || a.timestamp ? new Date(a.completedAt || a.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-";

      return [
        idx + 1,
        this.escapeCsv(a.attemptId),
        this.escapeCsv(a.studentName || "Siswa"),
        this.escapeCsv(studentClass),
        this.escapeCsv(subjName),
        this.escapeCsv(a.typeLabel || a.testType),
        this.escapeCsv(a.score),
        this.escapeCsv(a.correctCount),
        this.escapeCsv(a.totalQuestions),
        this.escapeCsv(`${Math.round((a.accuracy || 0) * 100)}%`),
        this.escapeCsv(durStr),
        this.escapeCsv(dateStr),
        this.escapeCsv(integrityFlag)
      ];
    });

    const csvContent = [headers.join(sep), ...rows.map((r) => r.join(sep))].join("\r\n");
    const filename = `rekap_nilai_guru_${subject}_${new Date().toISOString().slice(0, 10)}.csv`;
    this.triggerDownload(csvContent, filename);
    return { success: true, count: combined.length, filename };
  }

  /**
   * 7. Unduh Naskah Soal & Kunci Jawaban (Format Dokumen / Teks untuk Guru)
   * Guru tidak perlu mencari-cari lagi saat input nilai atau memeriksa tugas!
   */
  static exportQuestionPaper({ subject = "all", testType = "all" } = {}) {
    const normKey = this.normalizeSubjectKey(subject);
    let questions = AssessmentManager.getAllQuestions();
    if (subject && subject !== "all") {
      questions = questions.filter(q => this.normalizeSubjectKey(q.subject) === normKey);
    }
    if (!questions || questions.length === 0) {
      alert(`Tidak ada butir soal yang ditemukan untuk bidang: ${subject}.`);
      return { success: false };
    }

    const subjObj = SubjectRegistry.getSubject(normKey);
    const subjName = subjObj ? subjObj.name : (subject === "all" ? "Semua Bidang Studi" : subject);

    let doc = `================================================================================\r\n`;
    doc += `        NASKAH SOAL, TUGAS & KUNCI JAWABAN GURU - EPE V3\r\n`;
    doc += `================================================================================\r\n`;
    doc += `Mata Pelajaran / Bidang : ${subjName}\r\n`;
    doc += `Jumlah Butir Soal       : ${questions.length} Butir Soal\r\n`;
    doc += `Waktu Cetak / Unduh     : ${new Date().toLocaleString("id-ID")}\r\n`;
    doc += `Peruntukan Asesmen      : Pre-Test / Tugas Mandiri & Post-Test / Remedial\r\n`;
    doc += `================================================================================\r\n\r\n`;

    questions.forEach((q, idx) => {
      const num = idx + 1;
      const topic = q.topic || q.metadata?.topic || "Materi Umum";
      const qText = q.questionText || q.prompt || "";
      const mathExp = q.mathematicalExpressions?.[0] ? `\r\n   [Formula LaTeX]: ${q.mathematicalExpressions.join(" | ")}` : "";
      const options = q.options || [];
      const correctAns = q.correctAnswer || q.answerKey || "-";
      const explanation = q.explanation || q.rubric?.criteria || "Gunakan analisis langkah bertahap untuk penyelesaian.";

      doc += `--------------------------------------------------------------------------------\r\n`;
      doc += `[SOAL NO. ${num}] (Topik / Bab: ${topic})\r\n`;
      doc += `--------------------------------------------------------------------------------\r\n`;
      doc += `${qText}${mathExp}\r\n\r\n`;

      if (options.length > 0) {
        doc += `Pilihan Jawaban:\r\n`;
        options.forEach(opt => {
          doc += `   ${opt.id || opt.key}. ${opt.text || opt.content || ""}\r\n`;
        });
        doc += `\r\n`;
      }

      doc += `>>> KUNCI JAWABAN BENAR: ${correctAns}\r\n`;
      doc += `>>> PEMBAHASAN / RUBRIK : ${explanation}\r\n\r\n`;
    });

    doc += `================================================================================\r\n`;
    doc += `Dokumen ini digenerate secara otomatis oleh EPE Platform untuk mempermudah guru\r\n`;
    doc += `dalam memeriksa jawaban dan menginput nilai siswa tanpa repot mencari-cari naskah.\r\n`;
    doc += `================================================================================\r\n`;

    const blob = new Blob([doc], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `naskah_soal_kunci_${subject}_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, count: questions.length };
  }
}
