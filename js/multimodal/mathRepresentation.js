/**
 * mathRepresentation.js - Universal Mathematical AST & Representation Layer (EPE V3)
 * 
 * Abstraksi terpusat representasi matematika multimodal:
 * - Mengonversi input teks / OCR / transkripsi suara menjadi struktur AST terstandarisasi.
 * - Mendukung domain: Persamaan Linear, Persamaan Kuadrat, Aritmatika Polinomial,
 *   Matriks (2x2 & 3x3), Kalkulus Polinomial (Turunan & Integral), dan Urutan Langkah Aljabar.
 * - Menjaga format LaTeX untuk rendering KaTeX serta AST untuk evaluasi deterministik.
 */

export class MathRepresentation {
  /**
   * Membuat objek representasi matematika baru
   */
  constructor({
    type = "expression",
    raw = "",
    latex = "",
    ast = null,
    dimensions = null,
    steps = [],
    confidence = 1.0,
    metadata = {}
  } = {}) {
    this.type = type; // "equation" | "matrix" | "calculus" | "steps" | "expression"
    this.raw = raw;
    this.latex = latex || raw;
    this.ast = ast;
    this.dimensions = dimensions; // [rows, cols] jika matriks
    this.steps = steps; // array of step objects jika multi-step
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.metadata = {
      source: "typed", // "typed" | "image" | "audio"
      ambiguityFlags: [],
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  /**
   * Factory: Parse string input atau hasil OCR menjadi MathRepresentation
   */
  static fromInput(inputString, source = "typed", baseConfidence = 0.95) {
    if (!inputString || typeof inputString !== "string") {
      return new MathRepresentation({ type: "expression", raw: "", latex: "", confidence: 0 });
    }

    const clean = inputString.trim();
    const ambiguityFlags = [];

    // Deteksi ambiguitas karakter umum coretan tangan
    if (/[oO]/.test(clean) && /[0-9]/.test(clean)) {
      ambiguityFlags.push("Huruf 'O' atau angka '0' terdeteksi.");
    }
    if (/[lI|]/.test(clean) && /[0-9]/.test(clean)) {
      ambiguityFlags.push("Garis vertikal '|' atau angka '1' terdeteksi.");
    }

    // 1. Cek Matriks (misal: [[1, 2], [3, 4]], [1 2; 3 4], atau \begin{pmatrix}...\end{pmatrix})
    const matrixParsed = this.tryParseMatrix(clean);
    if (matrixParsed) {
      return new MathRepresentation({
        type: "matrix",
        raw: clean,
        latex: matrixParsed.latex,
        ast: matrixParsed.ast,
        dimensions: matrixParsed.dimensions,
        confidence: baseConfidence,
        metadata: { source, ambiguityFlags }
      });
    }

    // 2. Cek Kalkulus: Turunan (d/dx, f'(x), turunan)
    const derivativeParsed = this.tryParseDerivative(clean);
    if (derivativeParsed) {
      return new MathRepresentation({
        type: "calculus",
        raw: clean,
        latex: derivativeParsed.latex,
        ast: derivativeParsed.ast,
        confidence: baseConfidence,
        metadata: { source, calculusSubtype: "derivative", ambiguityFlags }
      });
    }

    // 3. Cek Kalkulus: Integral (\int, integral)
    const integralParsed = this.tryParseIntegral(clean);
    if (integralParsed) {
      return new MathRepresentation({
        type: "calculus",
        raw: clean,
        latex: integralParsed.latex,
        ast: integralParsed.ast,
        confidence: baseConfidence,
        metadata: { source, calculusSubtype: "integral", ambiguityFlags }
      });
    }

    // 4. Cek Multi-Step Solution (Memiliki baris baru \n atau pemisah langkah => / ->)
    const stepsParsed = this.tryParseSteps(clean);
    if (stepsParsed && stepsParsed.length > 1) {
      const finalStep = stepsParsed[stepsParsed.length - 1];
      return new MathRepresentation({
        type: "steps",
        raw: clean,
        latex: stepsParsed.map(s => s.latex).join(" \\\\ "),
        ast: { type: "StepSequence", count: stepsParsed.length, steps: stepsParsed },
        steps: stepsParsed,
        confidence: baseConfidence,
        metadata: { source, finalAnswer: finalStep.latex, ambiguityFlags }
      });
    }

    // 5. Cek Persamaan (=)
    if (clean.includes("=")) {
      const parts = clean.split("=");
      const left = parts[0].trim();
      const right = parts.slice(1).join("=").trim();
      const normLeft = this.normalizeLatex(left);
      const normRight = this.normalizeLatex(right);

      return new MathRepresentation({
        type: "equation",
        raw: clean,
        latex: `${normLeft} = ${normRight}`,
        ast: {
          type: "Equation",
          operator: "=",
          left: this.parsePolynomialTokens(left),
          right: this.parsePolynomialTokens(right)
        },
        confidence: baseConfidence,
        metadata: { source, ambiguityFlags }
      });
    }

    // 6. Default: Ekspresi Matematika Biasa
    return new MathRepresentation({
      type: "expression",
      raw: clean,
      latex: this.normalizeLatex(clean),
      ast: { type: "Expression", tokens: this.parsePolynomialTokens(clean) },
      confidence: baseConfidence,
      metadata: { source, ambiguityFlags }
    });
  }

  /**
   * Parser Matriks: mendukung format teks [a b; c d], [[a, b], [c, d]], atau LaTeX pmatrix
   */
  static tryParseMatrix(text) {
    let clean = text.trim();
    let data = [];

    // Format LaTeX: \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}
    if (clean.includes("pmatrix") || clean.includes("bmatrix")) {
      const innerMatch = clean.match(/\\begin\{(?:p|b)matrix\}([\s\S]+?)\\end\{(?:p|b)matrix\}/);
      if (innerMatch) {
        const rows = innerMatch[1].trim().split(/\\\\/);
        data = rows.map(r => r.trim().split("&").map(c => parseFloat(c.trim()) || 0));
      }
    }
    // Format Array JSON: [[1, 2], [3, 4]]
    else if (clean.startsWith("[[") && clean.endsWith("]]")) {
      try {
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
          data = parsed;
        }
      } catch (e) {}
    }
    // Format Semicolon MATLAB / Python: [1 2; 3 4] atau [1, 2; 3, 4]
    else if (clean.startsWith("[") && clean.endsWith("]")) {
      const inner = clean.slice(1, -1).trim();
      const rows = inner.split(";");
      if (rows.length >= 2) {
        data = rows.map(r => {
          return r.trim().split(/[,\s]+/).map(c => parseFloat(c) || 0);
        });
      }
    }

    if (data.length > 0 && Array.isArray(data[0])) {
      const rows = data.length;
      const cols = data[0].length;
      // Generate LaTeX matrix
      const latexRows = data.map(r => r.join(" & ")).join(" \\\\ ");
      const latex = `\\begin{pmatrix} ${latexRows} \\end{pmatrix}`;

      return {
        dimensions: [rows, cols],
        latex,
        ast: {
          type: "Matrix",
          rows,
          cols,
          data
        }
      };
    }

    return null;
  }

  /**
   * Parser Kalkulus: Turunan (Derivatives)
   */
  static tryParseDerivative(text) {
    const q = text.toLowerCase().trim();
    if (!q.includes("d/dx") && !q.includes("turunan") && !q.includes("derivatif") && !q.includes("'")) {
      return null;
    }

    // e.g. "d/dx (x^3 + 2x)" atau "turunan dari 3x^2 - 5x"
    const match = text.match(/(?:d\/dx|turunan(?: dari)?|derivatif)\s*\(?([^\)]+)\)?/i);
    let inner = match ? match[1].trim() : text.replace(/d\/dx|turunan|derivatif/gi, "").trim();
    inner = inner.replace(/^\(|\)$/g, "").trim();

    const normInner = this.normalizeLatex(inner);
    const latex = `\\frac{d}{dx}\\left(${normInner}\\right)`;

    return {
      latex,
      ast: {
        type: "Derivative",
        variable: "x",
        target: inner,
        tokens: this.parsePolynomialTokens(inner)
      }
    };
  }

  /**
   * Parser Kalkulus: Integral
   */
  static tryParseIntegral(text) {
    const q = text.toLowerCase().trim();
    if (!q.includes("\\int") && !q.includes("integral") && !q.includes("int ")) {
      return null;
    }

    // e.g. "\int_0^1 x^2 dx" atau "integral dari 0 sampai 1 x^2 dx"
    let lower = null;
    let upper = null;
    let integrand = text;

    // Deteksi batas tertentu \int_{a}^{b} atau \int_a^b
    const limitMatch = text.match(/\\int_\{?([0-9a-zA-Z\-]+)\}?\^\{?([0-9a-zA-Z\-]+)\}?/);
    if (limitMatch) {
      lower = limitMatch[1];
      upper = limitMatch[2];
      integrand = text.replace(limitMatch[0], "").trim();
    }

    integrand = integrand.replace(/^integral\s*(?:dari)?/i, "")
      .replace(/\\int/g, "")
      .replace(/dx$/i, "")
      .trim();

    const normIntegrand = this.normalizeLatex(integrand);
    let latex = "";
    if (lower !== null && upper !== null) {
      latex = `\\int_{${lower}}^{${upper}} ${normIntegrand} \\, dx`;
    } else {
      latex = `\\int ${normIntegrand} \\, dx`;
    }

    return {
      latex,
      ast: {
        type: "Integral",
        isDefinite: lower !== null && upper !== null,
        lowerLimit: lower,
        upperLimit: upper,
        integrand: integrand,
        tokens: this.parsePolynomialTokens(integrand)
      }
    };
  }

  /**
   * Parser Langkah Berurutan (Multi-Step Working)
   */
  static tryParseSteps(text) {
    if (!text) return [];
    // Split by newlines, "=>", "\n", or multiple delimiters
    const lines = text
      .split(/\r?\n|=>|->|\\\\/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith("#") && !l.startsWith("//"));

    if (lines.length <= 1) return null;

    return lines.map((line, idx) => {
      const cleanLine = line.replace(/^(?:langkah|step)\s*\d+[\.:\s]*/i, "").trim();
      const normLatex = MathRepresentation.normalizeLatex(cleanLine);
      return {
        stepIndex: idx + 1,
        raw: cleanLine,
        latex: normLatex,
        isEquation: cleanLine.includes("="),
        confidence: 0.92
      };
    });
  }

  /**
   * Normalisasi sintaks teks ke LaTeX yang aman untuk KaTeX
   */
  static normalizeLatex(text) {
    if (!text) return "";
    return text
      .replace(/[\u2212\u2013\u2014]/g, "-") // Minus unicode
      .replace(/\s+/g, " ")
      .replace(/x\^2|x\u00B2/g, "x^2")
      .replace(/x\^3|x\u00B3/g, "x^3")
      .replace(/\\cdot|\*|\u00D7/g, " \\cdot ")
      .replace(/\\pm|\+\/-/g, "\\pm ")
      .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
      .replace(/\(([0-9a-zA-Z\^\+\-\s]+)\)\s*\/\s*\(([0-9a-zA-Z\^\+\-\s]+)\)/g, "\\frac{$1}{$2}")
      .trim();
  }

  /**
   * Tokenizer polinomial sederhana untuk AST aljabar
   */
  static parsePolynomialTokens(expr) {
    if (!expr) return [];
    const clean = expr.replace(/\s+/g, "");
    // Tokenize terms: e.g. "2x^2", "-5x", "+7"
    const termRegex = /([+-]?[0-9a-zA-Z\^\.]+)/g;
    const matches = clean.match(termRegex) || [];
    return matches.map(t => ({
      raw: t,
      isVariable: /[a-zA-Z]/.test(t),
      degree: t.includes("^2") || t.includes("²") ? 2 : (t.includes("^3") ? 3 : (/[a-zA-Z]/.test(t) ? 1 : 0))
    }));
  }
}
