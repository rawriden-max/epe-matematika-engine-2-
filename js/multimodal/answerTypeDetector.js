/**
 * answerTypeDetector.js - Student Answer Type Classification Engine (EPE V3)
 * 
 * Bertanggung jawab mengklasifikasikan format dan tipe input jawaban siswa secara otomatis:
 * 1. multiple_choice     : Pilihan ganda (e.g. "A", "Opsi B", "(C)", "D. x = 3")
 * 2. numeric             : Nilai numerik skalar (integer, desimal, pecahan sederhana)
 * 3. equation            : Persamaan aljabar (memuat tanda kesetaraan '=')
 * 4. expression          : Ekspresi matematika tunggal tanpa kesetaraan (e.g. "x^2 - 4x + 4")
 * 5. matrix              : Format matriks (kurung siku 2D, ordo 2x2, LaTeX pmatrix/bmatrix)
 * 6. multi_step_solution : Coretan multi-baris berurutan (deretan langkah pengerjaan)
 * 7. written_explanation : Penjelasan naratif/verbal dalam bahasa alami
 * 8. diagram             : Rujukan grafis, sketsa, atau plot fungsi
 * 9. unknown             : Input tidak terdefinisi / kosong
 */

export class AnswerTypeDetector {
  static ANSWER_TYPES = [
    "multiple_choice",
    "numeric",
    "equation",
    "expression",
    "matrix",
    "multi_step_solution",
    "written_explanation",
    "diagram",
    "unknown"
  ];

  /**
   * Helper ringkas untuk mengembalikan string tipe jawaban saja (kompatibilitas QuestionDocument)
   * @param {string} content
   * @returns {string}
   */
  static detectFromContent(content) {
    if (!content) return "unknown";
    return this.detect(content).type;
  }

  /**
   * Helper untuk mendeteksi tipe jawaban berdasarkan manifest region (kompatibilitas QuestionDocument)
   * @param {Object} region 
   * @returns {string}
   */
  static detectFromRegion(region) {
    if (!region) return "unknown";
    if (region.type === "student_answer") {
      return this.detectFromContent(region.content);
    }
    if (region.type === "explanation") {
      return "written_explanation";
    }
    if (region.type === "formula") {
      return "expression";
    }
    return this.detectFromContent(region.content);
  }

  /**
   * Mendeteksi dan mengklasifikasikan tipe jawaban siswa
   * @param {string} rawInput - Teks jawaban mentah
   * @param {Object} context - Konteks opsional { questionOptions: [], questionType: "" }
   * @returns {{ type: string, confidence: number, normalized: string, metadata: Object }}
   */
  static detect(rawInput, context = {}) {
    if (!rawInput || typeof rawInput !== "string") {
      return {
        type: "unknown",
        confidence: 1.0,
        normalized: "",
        metadata: { reason: "empty_input" }
      };
    }

    const trimmed = rawInput.trim();
    if (!trimmed) {
      return {
        type: "unknown",
        confidence: 1.0,
        normalized: "",
        metadata: { reason: "whitespace_only" }
      };
    }

    // 1. Cek Multiple Choice (Pilihan Ganda)
    const mcMatch = this.matchMultipleChoice(trimmed, context);
    if (mcMatch) return mcMatch;

    // 2. Cek Matriks (Matrix notation)
    const matrixMatch = this.matchMatrix(trimmed);
    if (matrixMatch) return matrixMatch;

    // 3. Cek Multi-Step Solution (Multi-baris atau terpisah panah implikasi)
    const multiStepMatch = this.matchMultiStep(trimmed);
    if (multiStepMatch) return multiStepMatch;

    // 4. Cek Numeric (Skalar Tunggal)
    const numericMatch = this.matchNumeric(trimmed);
    if (numericMatch) return numericMatch;

    // 5. Cek Equation (Persamaan)
    const equationMatch = this.matchEquation(trimmed);
    if (equationMatch) return equationMatch;

    // 6. Cek Written Explanation (Penjelasan Verbal / Kalimat Bahasa Indonesia)
    const writtenMatch = this.matchWrittenExplanation(trimmed);
    if (writtenMatch) return writtenMatch;

    // 7. Cek Mathematical Expression (Ekspresi simbolik aljabar tanpa '=')
    const exprMatch = this.matchExpression(trimmed);
    if (exprMatch) return exprMatch;

    // 8. Cek Diagram / Rujukan Grafis
    const diagramMatch = this.matchDiagram(trimmed);
    if (diagramMatch) return diagramMatch;

    return {
      type: "unknown",
      confidence: 0.5,
      normalized: trimmed,
      metadata: { rawLength: trimmed.length }
    };
  }

  /**
   * Deteksi Jawaban Pilihan Ganda (A, B, C, D, Opsi A, dsb.)
   */
  static matchMultipleChoice(text, context = {}) {
    const clean = text.trim().replace(/^opsi\s+/i, "").replace(/^pilihan\s+/i, "");

    // Pola huruf tunggal atau berformat "A.", "(A)", "[A]", "A: Jawaban..."
    const letterMatch = clean.match(/^[\(\[\{]?([A-Ea-e])[\)\]\}]?(?:[\.:\s]+(.*))?$/);
    if (letterMatch) {
      const optionLetter = letterMatch[1].toUpperCase();
      const optionRest = (letterMatch[2] || "").trim();

      // Jika ada rest text yang sangat panjang (> 60 karakter dan banyak kata), mungkin itu narasi
      const words = optionRest.split(/\s+/).filter(Boolean);
      if (words.length > 10) {
        return null; // Lebih condong ke eksplanasi
      }

      return {
        type: "multiple_choice",
        confidence: 0.96,
        normalized: optionLetter,
        metadata: {
          selectedOption: optionLetter,
          optionText: optionRest,
          hasLeadingPrefix: clean !== text.trim()
        }
      };
    }

    // Jika ada daftar opsi yang diketahui dari konteks soal
    if (Array.isArray(context.questionOptions) && context.questionOptions.length > 0) {
      const matchedOpt = context.questionOptions.find(opt => {
        const optText = String(opt.text || opt.label || "").trim().toLowerCase();
        return optText && optText === text.toLowerCase();
      });
      if (matchedOpt) {
        return {
          type: "multiple_choice",
          confidence: 0.94,
          normalized: matchedOpt.id || matchedOpt.letter || text,
          metadata: {
            selectedOption: matchedOpt.id || matchedOpt.letter || null,
            matchedOptionText: matchedOpt.text || null
          }
        };
      }
    }

    return null;
  }

  /**
   * Deteksi Format Matriks (e.g. [[1, 2], [3, 4]] atau \begin{pmatrix} ...)
   */
  static matchMatrix(text) {
    // Pola LaTeX matriks
    if (/\\begin\{(pmatrix|bmatrix|vmatrix|matrix)\}/i.test(text)) {
      return {
        type: "matrix",
        confidence: 0.98,
        normalized: text,
        metadata: {
          isLatex: true,
          latexEnv: text.match(/\\begin\{([a-z]+)\}/i)?.[1] || "matrix"
        }
      };
    }

    // Pola array kurung siku bersarang [[a, b], [c, d]]
    const nestedBracketMatch = text.match(/^\s*\[\s*(\[[^\]]+\]\s*,?\s*)+\]\s*$/);
    if (nestedBracketMatch) {
      try {
        const rows = text.match(/\[[^\]]+\]/g);
        const rowCount = rows ? rows.length : 0;
        return {
          type: "matrix",
          confidence: 0.95,
          normalized: text.replace(/\s+/g, ""),
          metadata: {
            isLatex: false,
            rowCount: rowCount,
            bracketNotation: true
          }
        };
      } catch (e) {}
    }

    return null;
  }

  /**
   * Deteksi Multi-Step Solution (Deretan Langkah Pengerjaan Multi-Baris)
   */
  static matchMultiStep(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length >= 2) {
      // Periksa apakah setidaknya 2 baris memuat simbol matematika
      const mathLineCount = lines.filter(l => /[0-9a-zA-Z\+\-\*\/\^<>=]/.test(l)).length;
      if (mathLineCount >= 2) {
        return {
          type: "multi_step_solution",
          confidence: 0.94,
          normalized: lines.join("\n"),
          metadata: {
            stepCount: lines.length,
            mathLines: mathLineCount,
            firstLine: lines[0],
            lastLine: lines[lines.length - 1]
          }
        };
      }
    }

    // Terpisah oleh tanda panah implikasi beruntun (-> atau =>)
    if (text.includes("=>") || text.includes("->") || text.includes("\\implies")) {
      const parts = text.split(/=>|->|\\implies/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return {
          type: "multi_step_solution",
          confidence: 0.91,
          normalized: parts.join("\n"),
          metadata: {
            stepCount: parts.length,
            arrowDelimited: true
          }
        };
      }
    }

    return null;
  }

  /**
   * Deteksi Nilai Numerik Tunggal (Integer, Desimal, Pecahan Sederhana)
   */
  static matchNumeric(text) {
    const clean = text.replace(/\s+/g, "");

    // Format pecahan: -?a/b (e.g. "3/4", "-7/2")
    const fractionMatch = clean.match(/^([+-]?\d+)\/(\d+)$/);
    if (fractionMatch) {
      const num = parseInt(fractionMatch[1], 10);
      const den = parseInt(fractionMatch[2], 10);
      if (den !== 0) {
        return {
          type: "numeric",
          confidence: 0.95,
          normalized: `${num}/${den}`,
          metadata: {
            isFraction: true,
            numerator: num,
            denominator: den,
            decimalValue: num / den
          }
        };
      }
    }

    // Format desimal / integer standar: e.g. "12", "-4.5", "+0.25", "1,5"
    const standardNum = clean.replace(",", ".");
    if (/^[+-]?\d+(\.\d+)?$/.test(standardNum)) {
      const val = parseFloat(standardNum);
      return {
        type: "numeric",
        confidence: 0.97,
        normalized: String(val),
        metadata: {
          numericValue: val,
          isInteger: Number.isInteger(val)
        }
      };
    }

    // Format akar numerik murni: e.g. "sqrt(25)", "\\sqrt{9}"
    const sqrtMatch = clean.match(/^(?:\\sqrt\{|\bsqrt\(?)(\d+)(?:\}|\))?$/i);
    if (sqrtMatch) {
      const radicand = parseInt(sqrtMatch[1], 10);
      return {
        type: "numeric",
        confidence: 0.93,
        normalized: `sqrt(${radicand})`,
        metadata: {
          isSquareRoot: true,
          radicand: radicand,
          approxValue: Math.sqrt(radicand)
        }
      };
    }

    return null;
  }

  /**
   * Deteksi Persamaan Matematika (Linear, Kuadrat, atau Relasi Pertidaksamaan)
   */
  static matchEquation(text) {
    const clean = text.trim();

    // Harus memuat tanda kesetaraan '=' atau pertidaksamaan '<', '>', '<=', '>='
    const hasRelation = /[=><]|<=|>=/.test(clean);
    if (!hasRelation) return null;

    // Pastikan memuat variabel (huruf a-z atau simbol Yunani umum)
    const hasVariable = /[a-zA-Z]/.test(clean);
    if (!hasVariable) return null;

    // Pastikan bukan teks eksplanasi kalimat biasa yang kebetulan memuat tanda '='
    const words = clean.split(/\s+/);
    const idWordCount = words.filter(w => {
      const lower = w.toLowerCase();
      return ["adalah", "karena", "maka", "sehingga", "jawabannya", "langkah", "soal"].includes(lower);
    }).length;

    if (idWordCount >= 3) {
      return null; // Lebih condong ke eksplanasi
    }

    const isInequality = /[><]|<=|>=/.test(clean) && !clean.includes("=");
    return {
      type: "equation",
      confidence: 0.94,
      normalized: clean,
      metadata: {
        isInequality: isInequality,
        hasQuadraticTerm: /\^2|²/.test(clean),
        rawRelation: clean.match(/[=><]|<=|>=/)?.[0] || "="
      }
    };
  }

  /**
   * Deteksi Eksplanasi Tertulis Verbal (Bahasa Alami Indonesia)
   */
  static matchWrittenExplanation(text) {
    const clean = text.trim();
    const words = clean.split(/\s+/).filter(Boolean);

    // Kriteria eksplanasi: memuat beberapa kata leksikal bahasa Indonesia
    const idKeywords = [
      "karena", "sebab", "oleh", "karena", "maka", "sehingga", "jadi", "dapat",
      "disimpulkan", "hasil", "akar", "persamaan", "tidak", "memiliki", "nilai",
      "berada", "antara", "kuadrat", "diskriminan", "grafik", "memotong", "sumbu",
      "titik", "puncak", "garis", "arah", "langkah", "pertama", "kemudian", "lalu"
    ];

    const matchCount = words.filter(w => idKeywords.includes(w.toLowerCase())).length;

    // Jika teks terdiri dari minimal 4 kata dan terdapat setidaknya 2 kata kunci penalaran
    if (words.length >= 4 && matchCount >= 2) {
      return {
        type: "written_explanation",
        confidence: 0.90,
        normalized: clean,
        metadata: {
          wordCount: words.length,
          matchedKeywordsCount: matchCount
        }
      };
    }

    return null;
  }

  /**
   * Deteksi Ekspresi Simbolik Tanpa '=' (e.g. "x^2 - 4x + 4", "3x + 2y")
   */
  static matchExpression(text) {
    const clean = text.trim();

    // Memuat variabel dan operator aljabar (+, -, *, /, ^) tetapi tanpa '='
    if (!clean.includes("=") && /[a-zA-Z]/.test(clean) && /[\+\-\*\/\^²³]/.test(clean)) {
      const words = clean.split(/\s+/);
      if (words.length <= 5) {
        return {
          type: "expression",
          confidence: 0.88,
          normalized: clean,
          metadata: {
            hasVariable: true,
            hasOperators: true
          }
        };
      }
    }

    return null;
  }

  /**
   * Deteksi Rujukan Diagram / Grafis
   */
  static matchDiagram(text) {
    const lower = text.toLowerCase().trim();
    const diagramWords = ["grafik", "kurva", "parabola", "diagram", "gambar", "titik potong", "plot"];
    if (diagramWords.some(w => lower.includes(w))) {
      return {
        type: "diagram",
        confidence: 0.82,
        normalized: text.trim(),
        metadata: {
          isVisualReference: true
        }
      };
    }
    return null;
  }
}
