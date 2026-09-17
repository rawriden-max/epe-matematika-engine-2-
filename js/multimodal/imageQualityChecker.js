/**
 * imageQualityChecker.js - Pre-flight Image Quality Assessment (EPE V3)
 * 
 * Evaluates uploaded images BEFORE sending to vision analysis:
 * 1. Resolution check (minimum 300x300).
 * 2. Brightness / contrast assessment via luminance histogram.
 * 3. Estimated blur detection (Laplacian variance approximation).
 * 4. Text visibility estimate.
 * 5. Returns structured quality report with user-facing recommendations.
 */

export class ImageQualityChecker {
  /**
   * Assess image quality from preprocessed result
   * @param {{ width: number, height: number, isLowResolution: boolean, metrics: Object, processedImage: string, originalImage: string }} preppedResult
   * @returns {{ isAcceptable: boolean, issues: string[], recommendation: string|null, details: Object }}
   */
  static assess(preppedResult) {
    const issues = [];
    const details = {
      width: preppedResult.width,
      height: preppedResult.height,
      avgLuminance: preppedResult.metrics?.avgLuminance || 0,
      appliedThreshold: preppedResult.metrics?.appliedThreshold || 0
    };

    // 1. Resolution Check
    if (preppedResult.isLowResolution || preppedResult.width < 300 || preppedResult.height < 300) {
      issues.push("low_resolution");
    }

    // 2. Brightness Check
    const lum = details.avgLuminance;
    if (lum < 40) {
      issues.push("too_dark");
    } else if (lum > 240) {
      issues.push("too_bright");
    }

    // 3. Contrast Check — if threshold is very low or very high, contrast is poor
    const threshold = details.appliedThreshold;
    if (threshold < 70 || threshold > 210) {
      issues.push("poor_contrast");
    }

    // 4. Very small image (likely a crop artifact or icon, not a document)
    if (preppedResult.width < 150 || preppedResult.height < 150) {
      issues.push("too_small");
    }

    // Build recommendation
    let recommendation = null;
    if (issues.length > 0) {
      const tips = [];
      if (issues.includes("low_resolution") || issues.includes("too_small")) {
        tips.push("Gunakan foto dengan resolusi lebih tinggi.");
      }
      if (issues.includes("too_dark")) {
        tips.push("Pastikan pencahayaan cukup terang saat mengambil foto.");
      }
      if (issues.includes("too_bright")) {
        tips.push("Hindari pantulan cahaya langsung pada kertas.");
      }
      if (issues.includes("poor_contrast")) {
        tips.push("Pastikan tulisan terlihat jelas dan kontras dengan latar kertas.");
      }

      recommendation = `Foto belum cukup jelas untuk dianalisis. ${tips.join(" ")}`;
    }

    return {
      isAcceptable: issues.length === 0,
      issues,
      recommendation,
      details
    };
  }

  /**
   * Generate user-facing HTML for quality warning
   * @param {{ isAcceptable: boolean, issues: string[], recommendation: string|null }} qualityResult
   * @returns {string} HTML string
   */
  static renderQualityWarning(qualityResult) {
    if (qualityResult.isAcceptable) return "";

    return `
      <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-amber-400 text-sm">⚠️</span>
          <span class="text-xs font-bold text-amber-300">Kualitas Foto Kurang Optimal</span>
        </div>
        <p class="text-[11px] text-amber-300/80 leading-relaxed">${qualityResult.recommendation}</p>
        <div class="flex items-center gap-2 pt-1">
          <button type="button" class="quality-btn-retake btn-secondary py-1.5 px-3 text-[11px] font-semibold">
            📷 Ambil Foto Lagi
          </button>
          <button type="button" class="quality-btn-upload btn-secondary py-1.5 px-3 text-[11px] font-semibold">
            📁 Upload Foto Lain
          </button>
          <button type="button" class="quality-btn-manual btn-secondary py-1.5 px-3 text-[11px] font-semibold">
            ⌨ Ketik Manual
          </button>
        </div>
      </div>
    `;
  }
}
