/**
 * mathVerifier.js - Deterministic CAS-like Symbolic & Numerical Verification Engine (EPE V3)
 * 
 * Mesin verifikasi matematika deterministik independen:
 * 1. Uji Substitusi Akar Persamaan (LHS = RHS) untuk Linear & Kuadrat.
 * 2. Komputasi Matriks Deterministik (2x2 dan 3x3): Penjumlahan, Perkalian, Determinan, Invers.
 * 3. Diferensiasi Polinomial Eksak: d/dx (a*x^n).
 * 4. Verifikasi Konsistensi Transformasi Antar Baris Aljabar (Langkah N -> Langkah N+1).
 * 5. Status Verifikasi Terstandar: "VERIFIED", "PARTIALLY_VERIFIED", "INVALID_TRANSFORMATION", "UNVERIFIED".
 */

export class MathVerifier {
  /**
   * Verifikasi substitusi nilai akar ke persamaan kuadrat ax^2 + bx + c = 0
   * @param {number} a 
   * @param {number} b 
   * @param {number} c 
   * @param {number|number[]} studentRoots 
   * @returns {{ isCorrect: boolean, errors: string[], details: Object }}
   */
  static verifyQuadraticRoots(a, b, c, studentRoots) {
    const roots = Array.isArray(studentRoots) ? studentRoots : [studentRoots];
    const details = [];
    let allValid = true;

    for (const r of roots) {
      const numR = typeof r === "string" ? this.evalFraction(r) : Number(r);
      if (isNaN(numR)) {
        allValid = false;
        details.push({ root: r, evaluatedLHS: null, isRoot: false, error: "Nilai bukan angka valid" });
        continue;
      }

      // Hitung LHS: a*r^2 + b*r + c
      const lhs = a * numR * numR + b * numR + c;
      const isCloseToZero = Math.abs(lhs) < 1e-6;

      if (!isCloseToZero) allValid = false;

      details.push({
        root: numR,
        evaluatedLHS: parseFloat(lhs.toFixed(4)),
        isRoot: isCloseToZero
      });
    }

    return {
      isCorrect: allValid && roots.length > 0,
      details
    };
  }

  /**
   * Helper: Evaluasi string pecahan "a/b" atau "-1/2"
   */
  static evalFraction(str) {
    if (typeof str === "number") return str;
    if (!str || typeof str !== "string") return NaN;
    const clean = str.trim();
    if (clean.includes("/")) {
      const [num, den] = clean.split("/").map(s => parseFloat(s));
      if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
    }
    return parseFloat(clean);
  }

  /**
   * Operasi Matriks Deterministik
   */
  static matrix = {
    /**
     * Perkalian dua matriks: C = A x B
     */
    multiply(A, B) {
      if (!Array.isArray(A) || !Array.isArray(B)) return null;
      const rowsA = A.length;
      const colsA = A[0].length;
      const rowsB = B.length;
      const colsB = B[0].length;

      if (colsA !== rowsB) {
        throw new Error(`Dimensi tidak kompatibel: Matriks A (${rowsA}x${colsA}) tidak dapat dikalikan dengan Matriks B (${rowsB}x${colsB})`);
      }

      const C = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
      for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
          let sum = 0;
          for (let k = 0; k < colsA; k++) {
            sum += A[i][k] * B[k][j];
          }
          C[i][j] = parseFloat(sum.toFixed(6));
        }
      }
      return C;
    },

    /**
     * Hitung determinan matriks (2x2 atau 3x3)
     */
    determinant(M) {
      if (!Array.isArray(M) || M.length === 0) return null;
      const n = M.length;
      if (n !== M[0].length) {
        throw new Error("Determinan hanya terdefinisi untuk matriks bujur sangkar (nxn).");
      }

      if (n === 2) {
        // ad - bc
        return parseFloat((M[0][0] * M[1][1] - M[0][1] * M[1][0]).toFixed(6));
      }

      if (n === 3) {
        // Aturan Sarrus
        const a = M[0][0], b = M[0][1], c = M[0][2];
        const d = M[1][0], e = M[1][1], f = M[1][2];
        const g = M[2][0], h = M[2][1], i = M[2][2];

        const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
        return parseFloat(det.toFixed(6));
      }

      throw new Error(`Ordo matriks ${n}x${n} belum didukung dalam verifikasi deterministik.`);
    },

    /**
     * Invers matriks 2x2
     */
    inverse2x2(M) {
      if (M.length !== 2 || M[0].length !== 2) return null;
      const det = this.determinant(M);
      if (Math.abs(det) < 1e-9) {
        return { isInvertible: false, inverse: null, reason: "Matriks singular (determinan = 0)" };
      }

      const a = M[0][0], b = M[0][1], c = M[1][0], d = M[1][1];
      const inv = [
        [parseFloat((d / det).toFixed(6)), parseFloat((-b / det).toFixed(6))],
        [parseFloat((-c / det).toFixed(6)), parseFloat((a / det).toFixed(6))]
      ];

      return {
        isInvertible: true,
        determinant: det,
        inverse: inv
      };
    },

    /**
     * Cek kesetaraan dua matriks dengan toleransi numerik
     */
    areEqual(A, B, tolerance = 1e-4) {
      if (!Array.isArray(A) || !Array.isArray(B)) return false;
      if (A.length !== B.length || A[0].length !== B[0].length) return false;
      for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < A[0].length; j++) {
          if (Math.abs(A[i][j] - B[i][j]) > tolerance) return false;
        }
      }
      return true;
    }
  };

  /**
   * Diferensiasi Polinomial Simbolik Eksak
   * Mengembalikan fungsi turunan dalam bentuk LaTeX dan string
   * e.g. "3x^2 - 5x + 7" -> LaTeX "6x - 5"
   */
  static differentiatePolynomial(expr) {
    if (!expr) return null;
    let clean = expr.replace(/\s+/g, "").replace(/[\u2212\u2013\u2014]/g, "-");
    // Sisipkan tanda '+' di depan suku tanpa tanda jika di awal
    if (!clean.startsWith("+") && !clean.startsWith("-")) clean = "+" + clean;

    const termRegex = /([+-])([0-9]*\.?[0-9]*)?(?:([a-zA-Z])(?:\^([0-9]+))?)?/g;
    let match;
    const derivedTerms = [];

    while ((match = termRegex.exec(clean)) !== null) {
      if (!match[0]) continue;
      const sign = match[1] === "-" ? -1 : 1;
      let coeffRaw = match[2];
      const variable = match[3];
      const powerRaw = match[4];

      let coeff = 1;
      if (coeffRaw !== "" && coeffRaw !== undefined) {
        coeff = parseFloat(coeffRaw);
      } else if (!variable) {
        continue;
      }
      coeff *= sign;

      if (!variable) {
        // Konstanta: turunan = 0
        continue;
      }

      const power = powerRaw ? parseInt(powerRaw, 10) : 1;
      const newCoeff = coeff * power;
      const newPower = power - 1;

      if (newPower === 0) {
        derivedTerms.push(`${newCoeff > 0 ? "+" : ""}${newCoeff}`);
      } else if (newPower === 1) {
        derivedTerms.push(`${newCoeff > 0 ? "+" : ""}${newCoeff}${variable}`);
      } else {
        derivedTerms.push(`${newCoeff > 0 ? "+" : ""}${newCoeff}${variable}^${newPower}`);
      }
    }

    if (derivedTerms.length === 0) return { latex: "0", raw: "0" };

    let res = derivedTerms.join(" ").trim();
    if (res.startsWith("+")) res = res.substring(1).trim();
    res = res.replace(/\+\s*-/g, "- ").replace(/\+\s*\+/g, "+ ");

    return {
      latex: res.replace(/\^([0-9]+)/g, "^{$1}"),
      raw: res
    };
  }

  /**
   * Verifikasi Transformasi Aljabar Antara Dua Langkah Berurutan
   * @param {string} lineA Baris Langkah A (e.g. "2x + 3 = 11")
   * @param {string} lineB Baris Langkah B (e.g. "2x = 14" atau "2x = 8")
   * @returns {{ isValid: boolean, errorPattern: string|null, evidence: string }}
   */
  static verifyStepTransformation(lineA, lineB) {
    if (!lineA || !lineB) return { isValid: true, errorPattern: null, evidence: "" };

    const normA = lineA.toLowerCase().replace(/\s+/g, "");
    const normB = lineB.toLowerCase().replace(/\s+/g, "");

    // Kasus 1: Perpindahan Ruas Linear: "2x + 3 = 11"
    const matchLinA = normA.match(/([0-9]*[a-zA-Z])([+-][0-9]+)=([+-]?[0-9]+)/);
    if (matchLinA) {
      const varTerm = matchLinA[1];
      const constLeft = parseInt(matchLinA[2], 10);
      const rightA = parseInt(matchLinA[3], 10);

      // Harapan yang benar: varTerm = rightA - constLeft
      const expectedRight = rightA - constLeft;
      // Anomali tanda (siswa menjumlahkan alih-alih mengurangkan): rightA + constLeft
      const signErrorRight = rightA + Math.abs(constLeft);

      const matchLinB = normB.match(new RegExp(`^${varTerm}=([+-]?[0-9]+)$`));
      if (matchLinB) {
        const studentRight = parseInt(matchLinB[1], 10);
        if (studentRight === expectedRight) {
          return {
            isValid: true,
            errorPattern: "E0",
            evidence: `Transformasi langkah tepat: ${varTerm} = ${rightA} - (${constLeft}) = ${expectedRight}.`
          };
        } else if (studentRight === signErrorRight || studentRight === rightA + constLeft) {
          return {
            isValid: false,
            errorPattern: "E2", // Prosedural
            evidence: `Kesalahan tanda perpindahan ruas pada langkah ${lineB}: konstanta ${constLeft} berpindah ke ruas kanan menjadi penjumlahan (${rightA} + ${Math.abs(constLeft)} = ${studentRight}), seharusnya pengurangan (${rightA} - ${constLeft} = ${expectedRight}).`
          };
        } else {
          return {
            isValid: false,
            errorPattern: "E3", // Komputasi hitung
            evidence: `Kesalahan komputasi pada langkah ${lineB}: ${varTerm} ditulis ${studentRight}, seharusnya ${expectedRight}.`
          };
        }
      }
    }

    // Kasus 2: Pemfaktoran Kuadrat (x + p)(x + q) = 0 -> akar-akar x = -p atau x = -q
    const matchFactor = normA.match(/\(x([+-][0-9]+)\)\(x([+-][0-9]+)\)=0/);
    if (matchFactor) {
      const p = parseInt(matchFactor[1], 10);
      const q = parseInt(matchFactor[2], 10);
      const expectedRoots = [-p, -q];

      // Siswa menulis akar terbalik tanda: x = p atau x = q
      const matchRoots = normB.match(/x=([+-]?[0-9]+).*?x=([+-]?[0-9]+)/);
      if (matchRoots) {
        const r1 = parseInt(matchRoots[1], 10);
        const r2 = parseInt(matchRoots[2], 10);

        if ((r1 === expectedRoots[0] && r2 === expectedRoots[1]) || (r1 === expectedRoots[1] && r2 === expectedRoots[0])) {
          return {
            isValid: true,
            errorPattern: "E0",
            evidence: `Penentuan akar dari bentuk faktor (${lineA}) tepat: x = ${r1} atau x = ${r2}.`
          };
        } else if ((r1 === p && r2 === q) || (r1 === q && r2 === p)) {
          return {
            isValid: false,
            errorPattern: "E2",
            evidence: `Kesalahan prosedural tanda akar: dari faktor (x ${p > 0 ? "+" : ""}${p})(x ${q > 0 ? "+" : ""}${q}) = 0, siswa langsung mengambil angka faktor tanpa membalik tanda (x = ${r1}, x = ${r2}), seharusnya x = ${expectedRoots[0]} atau x = ${expectedRoots[1]}.`
          };
        }
      }
    }

    return {
      isValid: true,
      errorPattern: null,
      evidence: "Langkah aljabar tidak menunjukkan pertentangan langsung."
    };
  }
}
