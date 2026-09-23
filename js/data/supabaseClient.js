/**
 * supabaseClient.js - Koneksi Database Cloud Supabase
 * Menyimpan seluruh respon siswa & hasil diagnosis secara terpusat dan real-time
 */

export const SUPABASE_CONFIG = {
  url: "https://ihjehauwzxuvjvrykhwx.supabase.co",
  // Publishable Key dari Dashboard Supabase Anda
  publishableKey: "sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8",
  tableName: "hasil_diagnosis",
  pretestTable: "hasil_pre-test",
  posttestTable: "hasil_post-test",
  pretestCandidates: ["hasil_pre-test", "hasil_pretest", "pretest"],
  posttestCandidates: ["hasil_post-test", "hasil_posttest", "posttest"]
};

let _supabaseClient = null;

export function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  if (
    typeof window !== "undefined" &&
    window.supabase &&
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.publishableKey &&
    SUPABASE_CONFIG.publishableKey.startsWith("sb_publishable_")
  ) {
    try {
      _supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey);
    } catch (e) {
      console.warn("Gagal inisialisasi Supabase client:", e);
    }
  }
  return _supabaseClient;
}

// =========================================================================
// OFFLINE RESILIENCE & QUEUE MANAGEMENT
// =========================================================================
const OFFLINE_QUEUE_KEY = "epe_supabase_offline_queue_v1";

/**
 * Mengambil seluruh antrean offline dari localStorage
 */
export function getOfflineQueue() {
  try {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }
    }
  } catch (e) {
    console.warn("Gagal membaca antrean offline Supabase:", e);
  }
  return [];
}

/**
 * Menambahkan data transaksi ke antrean offline lokal
 */
export function addToOfflineQueue(type, payload) {
  try {
    if (typeof localStorage !== "undefined") {
      const queue = getOfflineQueue();
      const idKey = payload.attempt_id || payload.session_id || `${payload.student_id || ""}_${payload.question_id || ""}`;
      
      const existingIdx = queue.findIndex(item => {
        const itemKey = item.payload?.attempt_id || item.payload?.session_id || `${item.payload?.student_id || ""}_${item.payload?.question_id || ""}`;
        return item.type === type && itemKey === idKey && idKey !== "_";
      });

      const queueItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type,
        payload,
        queuedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        queue[existingIdx] = queueItem;
      } else {
        queue.push(queueItem);
      }

      if (queue.length > 200) queue.shift();
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[Supabase Offline Queue] Item '${type}' disimpan ke antrean offline (${queue.length} tertunda).`);
      return queueItem;
    }
  } catch (e) {
    console.warn("Gagal mencatat antrean offline:", e);
  }
  return null;
}

/**
 * Memproses dan mengosongkan antrean offline saat jaringan pulih
 */
export async function processOfflineQueue() {
  const client = getSupabaseClient();
  if (!client) return { processed: 0, remaining: 0 };
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, remaining: 0 };

  console.log(`[Supabase Offline Queue] Memproses ${queue.length} antrean offline...`);
  const remaining = [];
  let processed = 0;

  for (const item of queue) {
    try {
      let success = false;
      if (item.type === "diagnosis") {
        const { error } = await client.from(SUPABASE_CONFIG.tableName).insert([item.payload]);
        if (!error) success = true;
      } else if (item.type === "integrity_signals") {
        let res = await client.from("integrity_signals").upsert([item.payload], { onConflict: "session_id" });
        if (res.error) res = await client.from("integrity_signals").insert([item.payload]);
        if (!res.error) success = true;
      } else if (item.type === "session_events") {
        const { error } = await client.from("session_events").insert(item.payload);
        if (!error) success = true;
      }

      if (success) {
        processed++;
      } else {
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    }
  } catch (e) {}

  console.log(`[Supabase Offline Queue] Berhasil menyinkronkan ${processed} item offline, tersisa: ${remaining.length}.`);
  return { processed, remaining: remaining.length };
}

/**
 * Inisialisasi pendengar event 'online' peramban untuk background auto-sync
 */
export function initOnlineSyncListener() {
  if (typeof window !== "undefined" && !window._epeOnlineSyncListenerInitialized) {
    window._epeOnlineSyncListenerInitialized = true;
    window.addEventListener("online", () => {
      console.log("[Supabase] Sinyal internet pulih (online event terdeteksi), memulai sinkronisasi antrean...");
      setTimeout(() => processOfflineQueue(), 1200);
    });
  }
}

// Jalankan listener segera
initOnlineSyncListener();

/**
 * Menyimpan respon siswa ke tabel Supabase `hasil_diagnosis` secara asinkron
 */
export async function saveDiagnosisToSupabase(resultPackage) {
  const codePrefix = resultPackage.primaryErrorCode ? `[${resultPackage.primaryErrorCode}] ` : "";
  const primaryErrorText = resultPackage.primaryErrorText || resultPackage.primaryError || "Akurat";

  let confInt = 85;
  if (typeof resultPackage.confidence === "number") {
    confInt = Math.round(resultPackage.confidence);
  } else if (typeof resultPackage.confidenceText === "string") {
    const match = resultPackage.confidenceText.match(/(\d+)%/);
    if (match) {
      confInt = parseInt(match[1], 10);
    } else {
      const numMatch = resultPackage.confidenceText.match(/\d+/);
      if (numMatch) confInt = parseInt(numMatch[0], 10);
    }
  }

  const payload = {
    student_id: resultPackage.studentId || "Siswa",
    question_id: resultPackage.questionId || "",
    domain: resultPackage.domainCode || resultPackage.domain || "",
    primary_error: `${codePrefix}${primaryErrorText}`.trim(),
    secondary_error: resultPackage.secondaryErrorText || resultPackage.secondaryError || "-",
    evidence: resultPackage.evidence || "-",
    confidence: confInt,
    learning_need: resultPackage.remediation || "-",
    student_steps: resultPackage.studentSteps || "-",
    student_answer: resultPackage.studentAnswer || "-"
  };

  const client = getSupabaseClient();
  if (!client) {
    addToOfflineQueue("diagnosis", payload);
    return null;
  }

  try {
    const { data, error } = await client
      .from(SUPABASE_CONFIG.tableName)
      .insert([payload]);

    if (error) {
      console.warn("[Supabase] Gagal menyimpan data, dialihkan ke antrean offline:", error.message);
      addToOfflineQueue("diagnosis", payload);
      return null;
    }
    console.log("[Supabase] Data diagnosis berhasil disimpan ke cloud!");
    return data;
  } catch (err) {
    console.warn("[Supabase] Koneksi gagal, dialihkan ke antrean offline:", err);
    addToOfflineQueue("diagnosis", payload);
    return null;
  }
}

/**
 * Menyinkronkan seluruh riwayat lokal yang ada di browser ke Cloud Supabase secara batch
 */
export async function syncAllHistoryToSupabase(historyList) {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: "Koneksi Supabase belum siap." };
  if (!Array.isArray(historyList) || historyList.length === 0) {
    return { success: false, message: "Tidak ada riwayat lokal untuk disinkronkan." };
  }

  const rows = historyList.map((item) => {
    let confInt = 85;
    if (typeof item.confidence === "number") {
      confInt = Math.round(item.confidence);
    } else if (typeof item.confidence === "string") {
      const match = item.confidence.match(/\d+/);
      if (match) confInt = parseInt(match[0], 10);
    }

    const codePrefix = item.primaryErrorCode ? `[${item.primaryErrorCode}] ` : "";
    const primaryErrorText = item.primaryError || "Akurat";

    return {
      student_id: item.studentId || "Siswa",
      question_id: item.questionId || "",
      domain: item.domain || "",
      primary_error: `${codePrefix}${primaryErrorText}`.trim(),
      secondary_error: item.secondaryError || "-",
      evidence: item.evidence || "-",
      confidence: confInt,
      learning_need: item.remediation || "-",
      student_steps: item.studentSteps || "-",
      student_answer: item.studentAnswer || "-"
    };
  });

  try {
    const { data, error } = await client
      .from(SUPABASE_CONFIG.tableName)
      .insert(rows);

    if (error) {
      console.warn("[Supabase] Gagal menyinkronkan batch:", error.message);
      return { success: false, message: error.message };
    }
    return { success: true, count: rows.length };
  } catch (err) {
    console.warn("[Supabase] Gagal mengirim data batch:", err);
    return { success: false, message: err.message };
  }
}

/**
 * Mengambil seluruh data diagnosis dari Cloud Supabase
 */
export async function fetchAllDiagnosisFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: "Koneksi Supabase belum siap.", data: [] };

  try {
    const { data, error } = await client
      .from(SUPABASE_CONFIG.tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message, data: [] };
    }
    return { success: true, data: data || [] };
  } catch (err) {
    return { success: false, message: err.message, data: [] };
  }
}

/**
 * Mengunduh seluruh data Cloud Supabase ke format Excel Asli (.xls)
 * Langsung terbuka di Excel tanpa Text to Columns, dengan kolom lebar dan teks bungkus (Wrap Text)
 */
export async function exportCloudDataToExcel() {
  const res = await fetchAllDiagnosisFromSupabase();
  if (!res.success || !res.data || res.data.length === 0) {
    return { success: false, message: "Tidak ada data di cloud Supabase untuk diekspor." };
  }

  // Filter baris kosong/null (seperti id: 1)
  const validData = res.data.filter((d) => d.student_id || d.question_id);

  const escapeXml = (str) => {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  let rowsXml = "";
  validData.forEach((d, idx) => {
    const waktu = d.created_at ? new Date(d.created_at).toLocaleString("id-ID") : "-";
    rowsXml += `
   <Row>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(waktu)}</Data></Cell>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">${escapeXml(d.student_id || "Siswa")}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(d.question_id || "-")}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(d.domain || "-")}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(d.primary_error || "-")}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${escapeXml(d.secondary_error || "-")}</Data></Cell>
    <Cell ss:StyleID="CenterCell"><Data ss:Type="String">${d.confidence || 85}%</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(d.evidence || "-")}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(d.learning_need || "-")}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(d.student_answer || "-")}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(d.student_steps || "-")}</Data></Cell>
   </Row>`;
  });

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Top"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1D4ED8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1D4ED8"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="CenterCell">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
  <Style ss:ID="BoldCell">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#0F172A"/>
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Riwayat Siswa EPE">
  <Table>
   <Column ss:Width="40"/>
   <Column ss:Width="130"/>
   <Column ss:Width="160"/>
   <Column ss:Width="80"/>
   <Column ss:Width="140"/>
   <Column ss:Width="180"/>
   <Column ss:Width="110"/>
   <Column ss:Width="80"/>
   <Column ss:Width="300"/>
   <Column ss:Width="300"/>
   <Column ss:Width="180"/>
   <Column ss:Width="260"/>
   <Row ss:Height="28">
    <Cell ss:StyleID="Header"><Data ss:Type="String">No</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Waktu Submit</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Siswa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kode Soal</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Domain Kompetensi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kesalahan Utama</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kesalahan Kedua</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Keyakinan</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Bukti Coretan Siswa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Rekomendasi Remediasi</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Jawaban Siswa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Langkah Pengerjaan</Data></Cell>
   </Row>${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel;charset=utf-8" });
  const filename = `epe_data_siswa_excel_${new Date().toISOString().slice(0, 10)}.xls`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, count: validData.length, filename };
}

// Alias fungsi untuk kompatibilitas
export const exportCloudDataToCSV = exportCloudDataToExcel;

/**
 * Menyimpan data hasil Pre-Test ke Supabase Cloud
 */
export async function savePreTestToSupabase(attemptRecord) {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    attempt_id: attemptRecord.attemptId,
    student_id: attemptRecord.studentId || "siswa_01",
    student_name: attemptRecord.studentName || "Siswa",
    test_type: "pretest",
    test_form: attemptRecord.testForm || "Form A",
    score: attemptRecord.score,
    accuracy: attemptRecord.accuracy,
    correct_count: attemptRecord.correctCount,
    total_questions: attemptRecord.totalQuestions,
    duration_seconds: attemptRecord.durationSeconds,
    error_distribution: attemptRecord.errorDistribution,
    domain_accuracy: attemptRecord.domainAccuracy,
    responses: attemptRecord.responses
  };

  try {
    const candidates = SUPABASE_CONFIG.pretestCandidates || ["hasil_pre-test", "hasil_pretest", "pretest"];
    let lastError = null;

    for (const tbl of candidates) {
      try {
        const { data, error } = await client.from(tbl).insert([payload]);
        if (!error) {
          console.log(`[Supabase] Pre-test attempt berhasil disinkronkan ke tabel ${tbl}!`);
          return data;
        }
        lastError = error;
      } catch (e) {
        lastError = e;
      }
    }

    console.warn("[Supabase] Gagal mengirim Pre-test ke semua kandidat:", lastError?.message || lastError);
    return null;
  } catch (err) {
    console.warn("[Supabase] Gagal mengirim Pre-test:", err);
    return null;
  }
}

/**
 * Menyimpan data hasil Post-Test ke Supabase Cloud
 */
export async function savePostTestToSupabase(attemptRecord) {
  const client = getSupabaseClient();
  if (!client) return null;

  const payload = {
    attempt_id: attemptRecord.attemptId,
    student_id: attemptRecord.studentId || "siswa_01",
    student_name: attemptRecord.studentName || "Siswa",
    test_type: "posttest",
    test_form: attemptRecord.testForm || "Form B",
    score: attemptRecord.score,
    accuracy: attemptRecord.accuracy,
    correct_count: attemptRecord.correctCount,
    total_questions: attemptRecord.totalQuestions,
    duration_seconds: attemptRecord.durationSeconds,
    error_distribution: attemptRecord.errorDistribution,
    domain_accuracy: attemptRecord.domainAccuracy,
    responses: attemptRecord.responses
  };

  try {
    const candidates = SUPABASE_CONFIG.posttestCandidates || ["hasil_post-test", "hasil_posttest", "posttest"];
    let lastError = null;

    for (const tbl of candidates) {
      try {
        const { data, error } = await client.from(tbl).insert([payload]);
        if (!error) {
          console.log(`[Supabase] Post-test attempt berhasil disinkronkan ke tabel ${tbl}!`);
          return data;
        }
        lastError = error;
      } catch (e) {
        lastError = e;
      }
    }

    console.warn("[Supabase] Gagal mengirim Post-test ke semua kandidat:", lastError?.message || lastError);
    return null;
  } catch (err) {
    console.warn("[Supabase] Gagal mengirim Post-test:", err);
    return null;
  }
}

/**
 * Mengambil seluruh data Pre-Test dari Supabase
 */
export async function fetchAllPreTestsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return { success: false, data: [] };

  const candidates = SUPABASE_CONFIG.pretestCandidates || ["hasil_pre-test", "hasil_pretest", "pretest"];
  for (const tbl of candidates) {
    try {
      let res = await client.from(tbl).select("*").order("created_at", { ascending: false });
      if (!res.error && res.data) {
        return { success: true, table: tbl, data: res.data };
      }
    } catch (err) {}
  }
  return { success: false, data: [] };
}

/**
 * Mengambil seluruh data Post-Test dari Supabase
 */
export async function fetchAllPostTestsFromSupabase() {
  const client = getSupabaseClient();
  if (!client) return { success: false, data: [] };

  const candidates = SUPABASE_CONFIG.posttestCandidates || ["hasil_post-test", "hasil_posttest", "posttest"];
  for (const tbl of candidates) {
    try {
      let res = await client.from(tbl).select("*").order("created_at", { ascending: false });
      if (!res.error && res.data) {
        return { success: true, table: tbl, data: res.data };
      }
    } catch (err) {}
  }
  return { success: false, data: [] };
}

/**
 * Sinkronisasi seluruh attempt Pre-Test dan Post-Test lokal ke Cloud Supabase secara batch
 */
export async function syncAllAssessmentsToSupabase(pretestList = [], posttestList = []) {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: "Koneksi Supabase belum siap atau sedang offline." };

  let preSynced = 0;
  let postSynced = 0;
  const errors = [];

  const preCandidates = SUPABASE_CONFIG.pretestCandidates || ["hasil_pre-test", "hasil_pretest", "pretest"];
  const postCandidates = SUPABASE_CONFIG.posttestCandidates || ["hasil_post-test", "hasil_posttest", "posttest"];

  // 1. Sync Pre-Test Attempts
  if (Array.isArray(pretestList) && pretestList.length > 0) {
    for (const item of pretestList) {
      const payload = {
        attempt_id: item.attemptId,
        student_id: item.studentId || "siswa_01",
        student_name: item.studentName || "Siswa",
        test_type: "pretest",
        test_form: item.testForm || "Form A",
        score: item.score,
        accuracy: item.accuracy,
        correct_count: item.correctCount,
        total_questions: item.totalQuestions,
        duration_seconds: item.durationSeconds,
        error_distribution: item.errorDistribution,
        domain_accuracy: item.domainAccuracy,
        responses: item.responses
      };

      let synced = false;
      let lastErr = null;
      for (const tbl of preCandidates) {
        try {
          let res = await client.from(tbl).upsert([payload], { onConflict: "attempt_id" });
          if (res.error) {
            res = await client.from(tbl).insert([payload]);
          }
          if (!res.error) {
            synced = true;
            preSynced++;
            break;
          }
          lastErr = res.error;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!synced) {
        errors.push(`Pre-Test ${item.attemptId}: ${lastErr?.message || "Gagal sinkron"}`);
      }
    }
  }

  // 2. Sync Post-Test Attempts
  if (Array.isArray(posttestList) && posttestList.length > 0) {
    for (const item of posttestList) {
      const payload = {
        attempt_id: item.attemptId,
        student_id: item.studentId || "siswa_01",
        student_name: item.studentName || "Siswa",
        test_type: "posttest",
        test_form: item.testForm || "Form B",
        score: item.score,
        accuracy: item.accuracy,
        correct_count: item.correctCount,
        total_questions: item.totalQuestions,
        duration_seconds: item.durationSeconds,
        error_distribution: item.errorDistribution,
        domain_accuracy: item.domainAccuracy,
        responses: item.responses
      };

      let synced = false;
      let lastErr = null;
      for (const tbl of postCandidates) {
        try {
          let res = await client.from(tbl).upsert([payload], { onConflict: "attempt_id" });
          if (res.error) {
            res = await client.from(tbl).insert([payload]);
          }
          if (!res.error) {
            synced = true;
            postSynced++;
            break;
          }
          lastErr = res.error;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!synced) {
        errors.push(`Post-Test ${item.attemptId}: ${lastErr?.message || "Gagal sinkron"}`);
      }
    }
  }

  const totalSynced = preSynced + postSynced;
  if (totalSynced > 0) {
    return {
      success: true,
      preCount: preSynced,
      postCount: postSynced,
      totalCount: totalSynced,
      message: `Berhasil menyinkronkan ${preSynced} Pre-Test dan ${postSynced} Post-Test ke Cloud Supabase.`
    };
  }

  if (pretestList.length === 0 && posttestList.length === 0) {
    return { success: false, message: "Belum ada rekaman Pre-Test atau Post-Test di browser untuk disinkronkan." };
  }

  return {
    success: false,
    message: errors.length > 0 ? errors.join("; ") : "Gagal menyinkronkan data ke Supabase."
  };
}

/**
 * Menyimpan sesi telemetri integritas akademik ke Supabase
 * @param {Object} session - Objek sesi dari IntegrityDetector
 */
export async function saveIntegritySessionToSupabase(session) {
  if (!session) return null;

  const s = session.signals || {};
  const signalsPayload = {
    session_id: session.sessionId,
    respondent_id: session.studentId || "siswa_01",
    tab_switch_count: s.tabSwitches || 0,
    total_inactive_duration: s.totalInactiveSeconds || 0,
    rapid_answer_count: s.rapidAnswersCount || 0,
    similarity_flag_count: 0,
    overall_status: s.reviewRecommended ? "review_recommended" : "normal",
    review_recommended: Boolean(s.reviewRecommended),
    signals: s.reasons || []
  };

  const eventsPayload = (Array.isArray(session.events) && session.events.length > 0)
    ? session.events.map(ev => ({
        session_id: session.sessionId,
        respondent_id: session.studentId || "siswa_01",
        question_id: ev.questionId || null,
        event_type: ev.eventType,
        timestamp: ev.timestamp || Date.now(),
        duration: ev.metadata?.inactiveDurationSeconds || ev.metadata?.totalDurationSeconds || 0,
        metadata: ev.metadata || {}
      }))
    : [];

  const client = getSupabaseClient();
  if (!client) {
    addToOfflineQueue("integrity_signals", signalsPayload);
    if (eventsPayload.length > 0) addToOfflineQueue("session_events", eventsPayload);
    return null;
  }

  try {
    let { data: sigData, error: sigError } = await client
      .from("integrity_signals")
      .upsert([signalsPayload], { onConflict: "session_id" });

    if (sigError) {
      // Fallback insert biasa jika upsert onConflict belum didukung constraint
      const insRes = await client.from("integrity_signals").insert([signalsPayload]);
      if (insRes.error) {
        console.warn("[Supabase] Simpan sinyal integritas ke antrean offline:", insRes.error.message);
        addToOfflineQueue("integrity_signals", signalsPayload);
      } else {
        sigData = insRes.data;
      }
    }

    // Simpan event telemetri jika ada
    if (eventsPayload.length > 0) {
      const { error: evError } = await client.from("session_events").insert(eventsPayload);
      if (evError) {
        addToOfflineQueue("session_events", eventsPayload);
      }
    }

    return sigData;
  } catch (err) {
    console.warn("[Supabase] Gagal menyimpan sesi integritas, dialihkan ke antrean offline:", err);
    addToOfflineQueue("integrity_signals", signalsPayload);
    if (eventsPayload.length > 0) addToOfflineQueue("session_events", eventsPayload);
    return null;
  }
}

/**
 * Sinkronisasi batch seluruh sesi integritas yang tersimpan di browser ke Cloud Supabase
 */
export async function syncAllIntegritySessionsToSupabase(sessions = []) {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: "Koneksi Supabase belum siap atau offline." };
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return { success: false, message: "Tidak ada sesi telemetri untuk disinkronkan." };
  }

  let count = 0;
  for (const s of sessions) {
    try {
      await saveIntegritySessionToSupabase(s);
      count++;
    } catch (e) {
      console.warn("Gagal sync sesi:", s.sessionId, e);
    }
  }

  return {
    success: true,
    count: count,
    message: `Berhasil menyinkronkan ${count} sesi telemetri integritas ke Cloud Supabase.`
  };
}
