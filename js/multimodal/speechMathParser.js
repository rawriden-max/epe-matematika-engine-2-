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
   * Jalankan perekaman pengenal suara via Web Speech API
   * @param {Object} callbacks
   * @param {Function} callbacks.onResult - Dipanggil saat hasil pengenalan ucapan tersedia
   * @param {Function} callbacks.onError - Dipanggil saat terjadi kesalahan
   * @param {Function} callbacks.onEnd - Dipanggil saat perekaman selesai
   * @returns {Object} Kontrol { stop: Function }
   */
  static startSpeechRecognition({ onResult, onError, onEnd } = {}) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError(new Error("Browser ini belum mendukung Web Speech Recognition API."));
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence || 0.85;
        const parsed = SpeechMathParser.parseSpokenMath(transcript);
        if (onResult) onResult({ ...parsed, confidence });
      }
    };

    recognition.onerror = (err) => {
      if (onError) onError(err);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      recognition.start();
    } catch (e) {
      if (onError) onError(e);
    }

    return {
      stop: () => {
        try {
          recognition.stop();
        } catch (e) {}
      }
    };
  }
}
