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

export class ResearchExport {
  /**
   * Helper untuk mengunduh Blob CSV dengan UTF-8 BOM agar rapi di Microsoft Excel
   */
  static triggerDownload(csvContent, filename) {
    const bom = "\uFEFFsep=,\r\n";
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

  static escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * 1. Export Pre-Test CSV
   */
  static exportPreTestCSV() {
    const attempts = AssessmentStore.getAllAttempts("pretest");
    if (attempts.length === 0) {
      alert("Belum ada data Pre-Test yang terekam.");
      return { success: false };
    }

    const headers = [
      "attempt_id",
      "student_id",
      "student_name",
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

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const filename = `epe_research_pretest_${new Date().toISOString().slice(0, 10)}.csv`;
    this.triggerDownload(csvContent, filename);
    return { success: true, count: attempts.length, filename };
  }

  /**
   * 2. Export Diagnostic CSV
   */
  static exportDiagnosticCSV() {
    try {
      const rawHist = localStorage.getItem("epe_history_v2");
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
        "steps_count"
      ];

      const rows = history.map((h) => [
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
        this.escapeCsv(h.media?.source || (h.media?.image ? "image" : (h.media?.audio ? "audio" : "typed"))),
        this.escapeCsv(h.stepReconstruction?.steps?.length || 1)
      ]);

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
   * 4. Export Post-Test CSV
   */
  static exportPostTestCSV() {
    const attempts = AssessmentStore.getAllAttempts("posttest");
    if (attempts.length === 0) {
      alert("Belum ada data Post-Test yang terekam.");
      return { success: false };
    }

    const headers = [
      "attempt_id",
      "student_id",
      "student_name",
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

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const filename = `epe_research_posttest_${new Date().toISOString().slice(0, 10)}.csv`;
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
      const rawHist = localStorage.getItem("epe_history_v2");
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
}
