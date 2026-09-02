/**
 * supabaseClient.js - Koneksi Database Cloud Supabase
 * Menyimpan seluruh respon siswa & hasil diagnosis secara terpusat dan real-time
 */

export const SUPABASE_CONFIG = {
  url: "https://ihjehauwzxuvjvrykhwx.supabase.co",
  // Publishable Key dari Dashboard Supabase Anda
  publishableKey: "sb_publishable_iVlvzSYao3zq8GJeK3MSNw_jEiJQSJ8",
  tableName: "hasil_diagnosis"
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

/**
 * Menyimpan respon siswa ke tabel Supabase `hasil_diagnosis` secara asinkron
 */
export async function saveDiagnosisToSupabase(resultPackage) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const payload = {
      student_id: resultPackage.studentId || "Siswa",
      question_id: resultPackage.questionId || "",
      domain: resultPackage.domainCode || resultPackage.domain || "",
      primary_error_code: resultPackage.primaryErrorCode || "",
      student_steps: resultPackage.studentSteps || "",
      student_answer: resultPackage.studentAnswer || "",
      primary_error_text: resultPackage.primaryErrorText || resultPackage.primaryError || "",
      secondary_error_text: resultPackage.secondaryErrorText || resultPackage.secondaryError || "",
      confidence: resultPackage.confidenceText || resultPackage.confidence || "",
      evidence: resultPackage.evidence || "",
      remediation: resultPackage.remediation || "",
      is_correct: !!resultPackage.isCorrect
    };

    const { data, error } = await client
      .from(SUPABASE_CONFIG.tableName)
      .insert([payload]);

    if (error) {
      console.warn("[Supabase] Gagal menyimpan data:", error.message);
      return null;
    }
    console.log("[Supabase] Data diagnosis berhasil disimpan ke cloud!");
    return data;
  } catch (err) {
    console.warn("[Supabase] Koneksi gagal:", err);
    return null;
  }
}
