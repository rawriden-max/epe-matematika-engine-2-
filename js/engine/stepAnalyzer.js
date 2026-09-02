/**
 * stepAnalyzer.js - Parser & Ekstraktor Langkah Pengerjaan Matematika Siswa
 * Error Pattern Engine (EPE)
 */

export class StepAnalyzer {
  /**
   * Membersihkan dan menormalisasi string langkah pengerjaan / jawaban
   */
  static normalize(text) {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/[\u2212\u2013\u2014]/g, "-") // Normalisasi tanda minus unicode
      .replace(/\s+/g, " ")                  // Normalisasi spasi berlebih
      .replace(/x\^2|x\u00B2/g, "x^2")      // Normalisasi x pangkat 2
      .replace(/t\^2|t\u00B2/g, "t^2")      // Normalisasi t pangkat 2
      .replace(/l\^2|l\u00B2/g, "l^2")      // Normalisasi l pangkat 2
      .replace(/x_1|x1/g, "x1")             // Normalisasi indeks x1
      .replace(/x_2|x2/g, "x2")             // Normalisasi indeks x2
      .replace(/\\cdot|\*|\u00D7/g, "*")     // Perkalian
      .replace(/\\pm|\+\/-/g, "+-")          // Plus-minus
      .replace(/\\sqrt\{([^}]+)\}/g, "sqrt($1)") // KaTeX sqrt
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)") // KaTeX frac
      .trim();
  }

  /**
   * Cek apakah teks mengandung pola tertentu (string atau regex)
   */
  static contains(text, pattern) {
    const norm = this.normalize(text);
    if (pattern instanceof RegExp) {
      return pattern.test(norm);
    }
    return norm.includes(this.normalize(pattern));
  }

  /**
   * Mencari semua kecocokan regex pada teks yang dinormalisasi
   */
  static matchAll(text, regex) {
    const norm = this.normalize(text);
    return [...norm.matchAll(regex)];
  }

  /**
   * Ekstraksi koefisien a, b, c dari input siswa
   */
  static extractCoefficients(text) {
    const norm = this.normalize(text);
    const result = { a: null, b: null, c: null };

    const aMatch = norm.match(/\ba\s*=\s*(-?\d+(\.\d+)?)/);
    if (aMatch) result.a = parseFloat(aMatch[1]);

    const bMatch = norm.match(/\bb\s*=\s*(-?\d+(\.\d+)?)/);
    if (bMatch) result.b = parseFloat(bMatch[1]);

    const cMatch = norm.match(/\bc\s*=\s*(-?\d+(\.\d+)?)/);
    if (cMatch) result.c = parseFloat(cMatch[1]);

    // Format sebaris: "3, -7, -6" atau "a=3 b=-7 c=-6"
    if (result.a === null && result.b === null && result.c === null) {
      const listMatch = norm.match(/(-?\d+)\s*[,;\s]+\s*(-?\d+)\s*[,;\s]+\s*(-?\d+)/);
      if (listMatch) {
        result.a = parseFloat(listMatch[1]);
        result.b = parseFloat(listMatch[2]);
        result.c = parseFloat(listMatch[3]);
      }
    }

    return result;
  }

  /**
   * Ekstraksi nilai akar x = p atau x = q
   */
  static extractRoots(text) {
    const norm = this.normalize(text);
    const roots = [];

    // Pola: x = 3 atau x = 4, x1 = 3, x2 = 4
    const regex1 = /(?:x(?:1|2)?\s*=\s*)(-?\d+(?:\/\d+|\.\d+)?)/g;
    let match;
    while ((match = regex1.exec(norm)) !== null) {
      roots.push(match[1]);
    }

    // Pola angka langsung: "3 dan 4", "3 atau 4", "3, 4", "-1/2 atau -3"
    if (roots.length === 0) {
      const regex2 = /(-?\d+(?:\/\d+)?)\s*(?:atau|dan|,|\/|;)\s*(-?\d+(?:\/\d+)?)/;
      const m2 = norm.match(regex2);
      if (m2) {
        roots.push(m2[1], m2[2]);
      }
    }

    return roots;
  }

  /**
   * Ekstraksi bentuk faktor linear (x + p)(x + q)
   */
  static extractFactors(text) {
    const norm = this.normalize(text);
    const factors = [];
    const factorRegex = /\(\s*(?:2x|3x|x|l|t)\s*([+-]\s*\d+)\s*\)/g;
    let match;
    while ((match = factorRegex.exec(norm)) !== null) {
      factors.push(match[0].replace(/\s+/g, ""));
    }
    return factors;
  }

  /**
   * Ekstraksi nilai diskriminan D
   */
  static extractDiscriminant(text) {
    const norm = this.normalize(text);
    const dMatch = norm.match(/\bd\s*=\s*(-?\d+)/);
    if (dMatch) {
      return parseInt(dMatch[1], 10);
    }
    return null;
  }

  /**
   * Deteksi apakah siswa menuliskan dimensi panjang atau waktu bertanda negatif
   */
  static hasNegativePhysicalDimension(text) {
    const norm = this.normalize(text);
    // Mencari panjang/lebar = negatif, atau waktu = negatif
    return (
      /(?:lebar|panjang|l|p|t|waktu)\s*=\s*-\d+/.test(norm) ||
      /(?:lebar|panjang)\s*-\d+\s*cm/.test(norm) ||
      /(?:lebar|panjang)\s*-\d+\s*m/.test(norm) ||
      /t\s*=\s*-0\.05/.test(norm) ||
      /t\s*=\s*-\d+/.test(norm) ||
      /-\s*8\s*cm/.test(norm) ||
      /-\s*12\s*m/.test(norm)
    );
  }
}
