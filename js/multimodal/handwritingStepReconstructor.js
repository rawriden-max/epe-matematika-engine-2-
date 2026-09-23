/**
 * handwritingStepReconstructor.js - Handwritten Step Reconstruction & Transformation Engine (EPE V3)
 * 
 * Bertanggung jawab:
 * 1. Mengurai baris-baris solusi matematika siswa (Baris 1 -> Baris 2 -> Baris 3).
 * 2. Mengidentifikasi transformasi aljabar antar baris menggunakan MathVerifier.
 * 3. Melacak lokasi titik kesalahan (error site) jika terjadi anomali perpindahan ruas atau tanda akar.
 * 4. Menyusun paket bukti terstruktur (Evidence) yang siap dikonsumsi oleh ErrorPatternEngine.
 */

import { MathRepresentation } from "./mathRepresentation.js";
import { MathVerifier } from "./mathVerifier.js";

export class HandwritingStepReconstructor {
  /**
   * Rekonstruksi urutan langkah aljabar dari teks multiline / coretan tangan
   * @param {string} rawStepsInput 
   * @param {Object} [options]
   * @returns {{ steps: Object[], hasAnomalies: boolean, primaryAnomaly: Object|null, overallConfidence: number, latexSummary: string }}
   */
  static reconstruct(rawStepsInput, options = {}) {
    if (!rawStepsInput || typeof rawStepsInput !== "string") {
      return {
        steps: [],
        hasAnomalies: false,
        primaryAnomaly: null,
        overallConfidence: 1.0,
        latexSummary: ""
      };
    }

    // 1. Ekstraksi baris langkah bersih & filter teks narasi Bahasa Indonesia
    const rawLines = rawStepsInput
      .split(/\r?\n|=>|->|\\\\/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("#") && !line.startsWith("//"));

    if (rawLines.length === 0) {
      return {
        steps: [],
        hasAnomalies: false,
        primaryAnomaly: null,
        overallConfidence: 1.0,
        latexSummary: ""
      };
    }

    const reconstructedSteps = [];
    let cumulativeConfidence = 0;
    let primaryAnomaly = null;

    // 2. Format setiap baris menjadi langkah terstruktur bersimbol matematika murni
    for (let i = 0; i < rawLines.length; i++) {
      let rawText = rawLines[i].replace(/^(?:langkah|step)\s*\d+[\.:\s]*/i, "").trim();
      
      // Bersihkan teks narasi / instruksi (misal "Syarat dua akar real berbeda: D > 0" -> "D > 0")
      const pureMath = HandwritingStepReconstructor.extractPureMathExpression(rawText);
      if (!pureMath) {
        // Lewatkan baris yang murni komentar narasi tanpa ekspresi matematika terukur
        continue;
      }
      rawText = pureMath;

      const normLatex = MathRepresentation.normalizeLatex(rawText);
      const isEq = rawText.includes("=") || rawText.includes(">") || rawText.includes("<");

      const stepObj = {
        stepIndex: reconstructedSteps.length + 1,
        rawText: rawText,
        latex: normLatex,
        isEquation: isEq,
        confidence: 0.94,
        isValid: true,
        anomalyPattern: null,
        evidence: "Langkah terdefinisi secara teratur."
      };

      // 3. Verifikasi transformasi terhadap baris sebelumnya yang valid
      if (reconstructedSteps.length > 0) {
        const prevStep = reconstructedSteps[reconstructedSteps.length - 1];
        const transResult = MathVerifier.verifyStepTransformation(prevStep.rawText, rawText);

        if (!transResult.isValid) {
          stepObj.isValid = false;
          stepObj.anomalyPattern = transResult.errorPattern || "E2";
          stepObj.evidence = transResult.evidence;

          // Rekam anomali pertama sebagai kandidat pola kesalahan utama EPE
          if (!primaryAnomaly) {
            primaryAnomaly = {
              fromStep: prevStep.stepIndex,
              toStep: stepObj.stepIndex,
              fromExpr: prevStep.latex,
              toExpr: stepObj.latex,
              errorPattern: stepObj.anomalyPattern,
              evidence: transResult.evidence,
              confidence: 0.93
            };
          }
        }
      }

      cumulativeConfidence += stepObj.confidence;
      reconstructedSteps.push(stepObj);
    }

    const avgConfidence = parseFloat((cumulativeConfidence / reconstructedSteps.length).toFixed(3));
    const latexSummary = reconstructedSteps.map(s => s.latex).join(" \\\\ ");

    return {
      steps: reconstructedSteps,
      hasAnomalies: primaryAnomaly !== null,
      primaryAnomaly: primaryAnomaly,
      overallConfidence: avgConfidence,
      latexSummary: latexSummary
    };
  }

  /**
   * Format bukti langkah rekaman untuk ditampilkan ke UI kartu diagnosis atau Research Mode
   */
  static formatStepEvidenceCard(reconstructedResult) {
    if (!reconstructedResult || reconstructedResult.steps.length === 0) {
      return null;
    }

    const { steps, hasAnomalies, primaryAnomaly } = reconstructedResult;

    let html = `<div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">`;
    html += `<div class="flex items-center justify-between pb-1.5 border-b border-slate-800">`;
    html += `<span class="font-bold text-slate-300 flex items-center gap-1.5">`;
    html += `<span>🔍 Rekonstruksi Langkah Coretan (${steps.length} Baris):</span>`;
    html += `</span>`;

    if (hasAnomalies) {
      html += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Anomali Terdeteksi</span>`;
    } else {
      html += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Alur Konsisten</span>`;
    }
    html += `</div>`;

    html += `<div class="space-y-1.5 font-mono">`;
    for (const s of steps) {
      const icon = s.isValid ? `<span class="text-emerald-400 font-bold">✓</span>` : `<span class="text-rose-400 font-bold">⚠</span>`;
      const bgClass = s.isValid ? "bg-slate-950/60" : "bg-rose-950/30 border border-rose-800/40";

      html += `<div class="p-2 rounded-lg ${bgClass} flex items-center justify-between gap-2">`;
      html += `<div class="flex items-center gap-2 overflow-x-auto">`;
      html += `<span class="text-slate-500 text-[11px]">#${s.stepIndex}</span>`;
      html += `<span class="text-slate-200 font-semibold">$${s.latex}$</span>`;
      html += `</div>`;
      html += `<div class="flex items-center gap-1.5 flex-shrink-0">`;
      html += icon;
      html += `</div>`;
      html += `</div>`;
    }
    html += `</div>`;

    if (primaryAnomaly) {
      html += `<div class="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90 leading-relaxed">`;
      html += `<strong class="text-amber-300">Bukti Pola [${primaryAnomaly.errorPattern}]:</strong> ${primaryAnomaly.evidence}`;
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Ekstraksi dan pembersihan ekspresi matematika murni dari baris teks siswa/remediasi
   * Menghilangkan kata-kata instruksi Bahasa Indonesia agar KaTeX tidak me-render teks bersambung.
   */
  static extractPureMathExpression(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    let text = rawText.trim();

    // 1. Jika mengandung titik dua (misal "Syarat dua akar real berbeda: D > 0" atau "Maka: x = 5")
    if (text.includes(":")) {
      const parts = text.split(":");
      const afterColon = parts.slice(1).join(":").trim();
      if (afterColon && /[0-9a-zA-Z\+\-\*\/\^<>=]/.test(afterColon)) {
        text = afterColon;
      } else {
        const beforeColon = parts[0].trim();
        if (/[0-9a-zA-Z\+\-\*\/\^<>=]/.test(beforeColon)) {
          text = beforeColon;
        }
      }
    }

    // 2. Daftar kata-kata instruksi / narasi umum Bahasa Indonesia yang sering ada di coretan
    const idKeywords = [
      "syarat", "dua", "akar", "real", "berbeda", "kembar", "tidak", "nyata",
      "bagi", "dengan", "kedua", "ruas", "kali", "tambah", "kurang",
      "karena", "maka", "sehingga", "diperoleh", "mencari", "hitung",
      "substitusi", "substitusikan", "masukkan", "nilai", "rumus", "faktorkan", "faktor",
      "bentuk", "baku", "persamaan", "kuadrat", "panjang", "lebar", "luas",
      "keliling", "langkah", "step", "cara", "jawab", "solusi", "adalah"
    ];

    // Pisahkan token
    const words = text.split(/\s+/);
    const mathTokens = words.filter(w => {
      const cleanW = w.toLowerCase().replace(/[^a-z]/g, "");
      return !idKeywords.includes(cleanW);
    });

    let result = mathTokens.join(" ").trim();

    // 3. Bersihkan tanda baca tepi (titik dua, titik koma, kurung tak berpasangan di tepi)
    result = result.replace(/^[:;,\s]+|[:;,\s]+$/g, "");

    // 4. Validasi apakah hasil memuat simbol matematika valid
    // Harus mengandung ekspresi aljabar bermakna (bukan angka telanjang tunggal dari sisa instruksi naratif)
    if (result && /[a-zA-Z0-9\+\-\*\/\^<>=]/.test(result)) {
      // Jika hanya angka tunggal bertanda (+/-) tanpa variabel atau relasi (misal "-4" dari "Bagi dengan -4:"), lewati
      const isSingleNumber = /^[+-]?\d+(\.\d+)?$/.test(result);
      if (isSingleNumber) {
        return "";
      }
      return result;
    }

    return "";
  }
}
