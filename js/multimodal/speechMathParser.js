/**
 * speechMathParser.js - Mathematical Spoken Language Normalizer (EPE V3)
 * 
 * Mengonversi ucapan lisan matematika (Bahasa Indonesia & istilah internasional)
 * menjadi notasi LaTeX dan ekspresi simbolik terstruktur.
 * 
 * Contoh konversi:
 * - "dua x tambah tiga sama dengan sebelas" -> "2x + 3 = 11"
 * - "x kuadrat minus lima x tambah enam sama dengan nol" -> "x^2 - 5x + 6 = 0"
 * - "matriks baris satu dua baris tiga empat" -> "\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}"
 * - "integral dari nol sampai satu x kuadrat dx" -> "\int_{0}^{1} x^2 \, dx"
 * - "turunan dari tiga x kuadrat" -> "\frac{d}{dx}(3x^2)"
 */

import { MathRepresentation } from "./mathRepresentation.js";

export class SpeechMathParser {
  /**
   * Normalisasi kalimat ucapan lisan menjadi ekspresi matematika
   * @param {string} spokenText 
   * @returns {{ rawSpeech: string, normalizedText: string, latex: string, representation: MathRepresentation }}
   */
  static parseSpokenMath(spokenText) {
    if (!spokenText || typeof spokenText !== "string") {
      return {
        rawSpeech: "",
        normalizedText: "",
        latex: "",
        representation: new MathRepresentation()
      };
    }

    let text = spokenText.toLowerCase().trim();

    // 1. Kamus Kata Angka Bahasa Indonesia
    const wordToNum = {
      "nol": "0", "satu": "1", "dua": "2", "tiga": "3", "empat": "4",
      "lima": "5", "enam": "6", "tujuh": "7", "delapan": "8", "sembilan": "9",
      "sepuluh": "10", "sebelas": "11", "dua belas": "12", "tiga belas": "13",
      "empat belas": "14", "lima belas": "15", "enam belas": "16", "tujuh belas": "17",
      "delapan belas": "18", "sembilan belas": "19", "dua puluh": "20",
      "setengah": "1/2", "sepertiga": "1/3", "seperempat": "1/4"
    };

    for (const [word, num] of Object.entries(wordToNum)) {
      const reg = new RegExp(`\\b${word}\\b`, "gi");
      text = text.replace(reg, num);
    }

    // 2. Normalisasi Simbol & Operasi
    text = text
      .replace(/\bsama dengan\b/gi, " = ")
      .replace(/\bequals?\b/gi, " = ")
      .replace(/\btambah\b|\bplus\b/gi, " + ")
      .replace(/\bkurang\b|\bminus\b/gi, " - ")
      .replace(/\bkali\b|\bdikali\b|\btimes\b/gi, " * ")
      .replace(/\bper\b|\bbagi\b|\bdibagi\b/gi, " / ")
      .replace(/\bkuadrat\b|\bpangkat dua\b|\bsquared\b/gi, "^2")
      .replace(/\bkubik\b|\bpangkat tiga\b|\bcubed\b/gi, "^3")
      .replace(/\bpangkat\s*([0-9]+)/gi, "^$1")
      .replace(/\bakar kuadrat dari\b|\bakar dari\b|\bakar\b/gi, "sqrt")
      .replace(/\bvariabel\s*x\b/gi, "x")
      .replace(/\bvariabel\s*y\b/gi, "y");

    // 3. Tangani Matriks Lisan
    // e.g. "matriks baris 1 2 baris 3 4" atau "matriks A 1 2 dan 3 4"
    if (text.includes("matriks") || text.includes("matrix")) {
      const matrixMatch = text.match(/matriks(?:\s+[a-zA-Z])?\s*(?:baris)?\s*([0-9\s\-]+)\s*(?:baris|dan)\s*([0-9\s\-]+)/i);
      if (matrixMatch) {
        const row1 = matrixMatch[1].trim().split(/\s+/).join(" ");
        const row2 = matrixMatch[2].trim().split(/\s+/).join(" ");
        const latex = `\\begin{pmatrix} ${row1.replace(/\s+/g, " & ")} \\\\ ${row2.replace(/\s+/g, " & ")} \\end{pmatrix}`;
        const rep = MathRepresentation.fromInput(latex, "audio", 0.90);
        return {
          rawSpeech: spokenText,
          normalizedText: `[${row1}; ${row2}]`,
          latex: latex,
          representation: rep
        };
      }
    }

    // 4. Tangani Kalkulus: Integral Lisan
    // e.g. "integral dari 0 sampai 1 x^2 dx"
    if (text.includes("integral")) {
      const definiteMatch = text.match(/integral\s*(?:dari)?\s*([0-9a-zA-Z\-]+)\s*(?:sampai|hingga)\s*([0-9a-zA-Z\-]+)\s*(.+)/i);
      if (definiteMatch) {
        const lower = definiteMatch[1].trim();
        const upper = definiteMatch[2].trim();
        let integrand = definiteMatch[3].replace(/d\s*x$/i, "").trim();
        integrand = integrand.replace(/\s+/g, "");
        const latex = `\\int_{${lower}}^{${upper}} ${integrand} \\, dx`;
        const rep = MathRepresentation.fromInput(latex, "audio", 0.90);
        return {
          rawSpeech: spokenText,
          normalizedText: `int_${lower}^${upper} ${integrand} dx`,
          latex,
          representation: rep
        };
      }
    }

    // 5. Bersihkan Spasi Antara Angka dan Variabel (misal: "2 x" -> "2x")
    let cleaned = text
      .replace(/([0-9]+)\s*([a-zA-Z])/g, "$1$2")
      .replace(/\s+/g, " ")
      .trim();

    const rep = MathRepresentation.fromInput(cleaned, "audio", 0.88);

    return {
      rawSpeech: spokenText,
      normalizedText: cleaned,
      latex: rep.latex,
      representation: rep
    };
  }

  /**
   * Jalankan perekaman pengenal suara matematika via Web Speech API
   * @param {Object} callbacks
   * @param {Function} callbacks.onResult - Dipanggil saat hasil pengenalan ucapan final tersedia
   * @param {Function} callbacks.onInterim - Dipanggil saat ada transkrip sementara secara live
   * @param {Function} callbacks.onError - Dipanggil saat terjadi kesalahan
   * @param {Function} callbacks.onEnd - Dipanggil saat perekaman selesai
   * @returns {Object} Kontrol { stop: Function }
   */
  static startSpeechRecognition({ onResult, onInterim, onError, onEnd } = {}) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError(new Error("Browser ini belum mendukung Web Speech Recognition API."));
      return null;
    }

    let fullTranscript = "";
    let silenceTimer = null;
    let intentionalStop = false;

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interim = "";
      let finalSegment = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          finalSegment += res[0].transcript + " ";
        } else {
          interim += res[0].transcript;
        }
      }

      if (finalSegment) {
        fullTranscript += finalSegment;
      }

      const currentLive = (fullTranscript + interim).trim();

      if (onInterim && currentLive) {
        onInterim(currentLive);
      }

      // Deteksi jeda hening 2.2 detik untuk auto-finalize
      if (silenceTimer) clearTimeout(silenceTimer);
      if (currentLive.length > 0) {
        silenceTimer = setTimeout(() => {
          if (!intentionalStop && currentLive.trim().length > 0) {
            const parsed = SpeechMathParser.parseSpokenMath(currentLive.trim());
            if (onResult) onResult({ ...parsed, confidence: 0.90 });
            try { recognition.stop(); } catch (e) {}
          }
        }, 2200);
      }
    };

    recognition.onerror = (err) => {
      const errCode = err.error || "unknown";
      if (errCode === "no-speech") {
        // Jangan matikan sesi saat jeda hening awal
        return;
      }

      let errorMsg = "Gagal merekam suara.";
      if (errCode === "not-allowed" || errCode === "service-not-allowed") {
        errorMsg = "Izin akses mikrofon ditolak oleh browser. Silakan izinkan mikrofon di pengaturan browser.";
      } else if (errCode === "audio-capture") {
        errorMsg = "Mikrofon tidak terdeteksi. Pastikan perangkat input terpasang.";
      } else if (errCode === "network") {
        errorMsg = "Kendala jaringan saat menghubungi server pengenal suara.";
      }

      const errorObj = new Error(errorMsg);
      errorObj.code = errCode;
      if (onError) onError(errorObj);
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (!intentionalStop && fullTranscript.trim().length > 0) {
        const parsed = SpeechMathParser.parseSpokenMath(fullTranscript.trim());
        if (onResult) onResult({ ...parsed, confidence: 0.88 });
      }
      if (onEnd) onEnd();
    };

    try {
      recognition.start();
    } catch (e) {
      if (onError) onError(e);
    }

    return {
      stop: () => {
        intentionalStop = true;
        if (silenceTimer) clearTimeout(silenceTimer);
        try {
          recognition.stop();
        } catch (e) {}
        if (fullTranscript.trim().length > 0) {
          const parsed = SpeechMathParser.parseSpokenMath(fullTranscript.trim());
          if (onResult) onResult({ ...parsed, confidence: 0.88 });
        }
      }
    };
  }
}
