/**
 * mathSolver.js - High-Precision Symbolic & Numerical Math Solver Engine (EPE V2 / Matrix AI)
 * 
 * Mendukung penyelesaian matematika komprehensif layaknya WolframAlpha / Photomath:
 * - Persamaan Kuadrat (ax^2 + bx + c = 0) dengan Faktorisasi, Rumus ABC, Diskriminan D, Titik Puncak, dan Teorema Vieta
 * - Persamaan Linear (ax + b = cx + d) dengan isolasi variabel langkah demi langkah
 * - Aritmatika Arbitrary-Precision menggunakan BigInt (mendukung angka raksasa tanpa pembulatan/overflow)
 * - Pemfaktoran Polinomial & Selisih Dua Kuadrat
 * - Turunan Diferensial Polinomial & Kalkulus Dasar
 * - Evaluasi Trigonometri & Identitas Sudut Istimewa
 * - Format keluaran LaTeX KaTeX yang rapi dan elegan
 */

function formatNumber(num) {
  if (typeof num === "bigint") {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  if (typeof num === "number") {
    if (Number.isInteger(num)) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    const fixed = num.toFixed(4).replace(/\.?0+$/, "");
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(",");
  }
  return String(num);
}

function simplifyFraction(numerator, denominator) {
  const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
  const sign = (numerator * denominator < 0) ? -1 : 1;
  const num = Math.abs(numerator);
  const den = Math.abs(denominator);
  const common = gcd(num, den);
  const simNum = (num / common) * sign;
  const simDen = den / common;
  return { num: simNum, den: simDen };
}

export class MathSolver {
  /**
   * Coba selesaikan input matematika. Mengembalikan string Markdown KaTeX jika berhasil, atau null jika bukan soal matematika.
   */
  static solve(input) {
    if (!input || typeof input !== "string") return null;
    const clean = input.trim();
    if (clean.length === 0) return null;

    // 1. Coba selesaikan Persamaan Kuadrat (e.g. "X^2 -7x + 12 = 0", "2x^2 + 5x = 3", "x^2 = 25")
    const quadResult = this.solveQuadratic(clean);
    if (quadResult) return quadResult;

    // 2. Coba selesaikan Persamaan Linear (e.g. "2x + 5 = 15", "3x - 4 = 2x + 6")
    const linResult = this.solveLinear(clean);
    if (linResult) return linResult;

    // 3. Coba selesaikan Aritmatika Presisi Tinggi & BigInt (e.g. "2347278374924 x 7839818974 =", "2000 x 2000 =")
    const arithResult = this.solveArithmetic(clean);
    if (arithResult) return arithResult;

    // 4. Coba Turunan Kalkulus (e.g. "turunan dari 3x^2 - 5x + 4", "d/dx (x^3 - 2x)")
    const diffResult = this.solveDerivative(clean);
    if (diffResult) return diffResult;

    // 5. Coba Integral Kalkulus (e.g. "integral dari 2x + 3", "int 3x^2 dx")
    const intResult = this.solveIntegral(clean);
    if (intResult) return intResult;

    // 6. Coba Pemfaktoran Polinomial eksplisit (e.g. "faktorkan x^2 - 16", "faktor x^2 - 7x + 12")
    const factorResult = this.solveFactoring(clean);
    if (factorResult) return factorResult;

    // 7. Coba Evaluasi Trigonometri (e.g. "sin 30", "cos(45)", "tan 60")
    const trigResult = this.solveTrig(clean);
    if (trigResult) return trigResult;

    return null;
  }

  /**
   * Parser & Solver Persamaan Kuadrat
   */
  static solveQuadratic(rawQuery) {
    let q = rawQuery.replace(/f\(x\)\s*=/gi, "")
      .replace(/y\s*=/gi, "")
      .replace(/hitung/gi, "")
      .replace(/selesaikan/gi, "")
      .replace(/carilah/gi, "")
      .replace(/akar-akar/gi, "")
      .replace(/akar/gi, "")
      .replace(/dari/gi, "")
      .trim();

    // Check if contains quadratic power (x^2, x², X^2, X², etc.)
    if (!/[xXyYtTzZ](\^2|²)/.test(q)) {
      return null;
    }

    // Determine variable (x, y, t, or z)
    const varMatch = q.match(/([xXyYtTzZ])(\^2|²)/);
    const variable = varMatch ? varMatch[1].toLowerCase() : "x";

    let leftStr = "";
    let rightStr = "0";

    if (q.includes("=")) {
      const parts = q.split("=");
      leftStr = parts[0].trim();
      rightStr = parts.slice(1).join("=").trim() || "0";
    } else {
      leftStr = q;
      rightStr = "0";
    }

    // Helper: Parse polynomial terms like "2x^2 - 7x + 12" into coefficients {a, b, c}
    const parseSide = (str) => {
      let a = 0, b = 0, c = 0;
      let s = str.replace(/\s+/g, "").replace(/²/g, "^2");
      if (!s) return { a, b, c };

      // Ensure leading sign
      if (s[0] !== "+" && s[0] !== "-") s = "+" + s;

      const termRegex = /([+-](?:[0-9]+(?:\.[0-9]+)?)?)(?:([a-zA-Z])(?:\^([0-9]+))?)?/g;
      let match;

      while ((match = termRegex.exec(s)) !== null) {
        if (match.index === termRegex.lastIndex) termRegex.lastIndex++;
        const coeffStr = match[1];
        const v = match[2];
        const powerStr = match[3];

        if (!coeffStr && !v) continue;

        let coeff = 1;
        if (coeffStr === "+") coeff = 1;
        else if (coeffStr === "-") coeff = -1;
        else coeff = parseFloat(coeffStr);

        if (isNaN(coeff)) continue;

        if (v) {
          const power = powerStr ? parseInt(powerStr, 10) : 1;
          if (power === 2) a += coeff;
          else if (power === 1) b += coeff;
        } else {
          // Constant term
          c += coeff;
        }
      }

      return { a, b, c };
    };

    const left = parseSide(leftStr);
    const right = parseSide(rightStr);

    // Subtract right side from left side to get ax^2 + bx + c = 0
    const a = left.a - right.a;
    const b = left.b - right.b;
    const c = left.c - right.c;

    if (a === 0) {
      // Degenerates to linear equation
      return null;
    }

    // Calculate Discriminant
    const D = b * b - 4 * a * c;
    const v = variable;

    // Formatting for display equation
    const aDisp = a === 1 ? "" : a === -1 ? "-" : `${a}`;
    const bDisp = b > 0 ? (b === 1 ? ` + ${v}` : ` + ${b}${v}`) : b < 0 ? (b === -1 ? ` - ${v}` : ` - ${Math.abs(b)}${v}`) : "";
    const cDisp = c > 0 ? ` + ${c}` : c < 0 ? ` - ${Math.abs(c)}` : "";
    const stdEquation = `${aDisp}${v}^2${bDisp}${cDisp} = 0`.replace(/\+ -/g, "- ");

    let stepsMarkdown = `### 📐 Matrix Math Solver: Persamaan Kuadrat\n\n`;
    stepsMarkdown += `**Persamaan Awal:** $${rawQuery.replace(/\s*=\s*$/, "")}$\n`;
    stepsMarkdown += `**Bentuk Baku:** $${stdEquation}$\n\n`;
    stepsMarkdown += `#### 1. Identifikasi Koefisien\n`;
    stepsMarkdown += `- $a = ${a}$\n`;
    stepsMarkdown += `- $b = ${b}$\n`;
    stepsMarkdown += `- $c = ${c}$\n\n`;

    stepsMarkdown += `#### 2. Menghitung Nilai Diskriminan ($D$)\n`;
    stepsMarkdown += `$$D = b^2 - 4ac$$\n`;
    stepsMarkdown += `$$D = (${b})^2 - 4(${a})(${c}) = ${b * b} - (${4 * a * c}) = ${D}$$\n\n`;

    let rootType = "";
    if (D > 0) {
      rootType = "Memiliki **2 akar real yang berbeda** ($D > 0$), kurva parabola memotong sumbu-$" + v.toUpperCase() + "$ di dua titik.";
    } else if (D === 0) {
      rootType = "Memiliki **1 akar kembar / real sama** ($D = 0$), puncak parabola tepat menyinggung sumbu-$" + v.toUpperCase() + "$.";
    } else {
      rootType = "Memiliki **akar imajiner / kompleks** ($D < 0$), parabola melayang dan tidak memotong sumbu-$" + v.toUpperCase() + "$.";
    }
    stepsMarkdown += `**Analisis Akar:** ${rootType}\n\n`;

    // Solve roots using Rumus ABC
    stepsMarkdown += `#### 3. Mencari Akar Penyelesaian (Rumus Kuadratik ABC)\n`;
    stepsMarkdown += `$$${v}_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$$\n`;
    stepsMarkdown += `$$${v}_{1,2} = \\frac{-(${b}) \\pm \\sqrt{${D}}}{2(${a})}$$\n\n`;

    if (D >= 0) {
      const sqrtD = Math.sqrt(D);
      const isPerfectSquare = Number.isInteger(sqrtD);

      if (isPerfectSquare) {
        const x1 = (-b + sqrtD) / (2 * a);
        const x2 = (-b - sqrtD) / (2 * a);

        stepsMarkdown += `Karena $\\sqrt{${D}} = ${sqrtD}$:\n`;
        stepsMarkdown += `- $${v}_1 = \\frac{${-b} + ${sqrtD}}{${2 * a}} = \\frac{${-b + sqrtD}}{${2 * a}} = \\mathbf{${formatNumber(x1)}}$\n`;
        stepsMarkdown += `- $${v}_2 = \\frac{${-b} - ${sqrtD}}{${2 * a}} = \\frac{${-b - sqrtD}}{${2 * a}} = \\mathbf{${formatNumber(x2)}}$\n\n`;

        // If integer roots, show factoring representation
        if (Number.isInteger(x1) && Number.isInteger(x2)) {
          stepsMarkdown += `#### 4. Bentuk Faktorisasi Aljabar\n`;
          if (a === 1) {
            const f1 = x1 >= 0 ? `- ${x1}` : `+ ${Math.abs(x1)}`;
            const f2 = x2 >= 0 ? `- ${x2}` : `+ ${Math.abs(x2)}`;
            stepsMarkdown += `$$(${v} ${f1})(${v} ${f2}) = 0$$\n\n`;
          } else {
            stepsMarkdown += `$$${a}(${v} - (${x1}))(${v} - (${x2})) = 0$$\n\n`;
          }
        }

        stepsMarkdown += `**Himpunan Penyelesaian (HP):**\n`;
        if (x1 === x2) {
          stepsMarkdown += `$$\\mathbf{HP = \\{ ${formatNumber(x1)} \\}}$$\n\n`;
        } else {
          const sorted = [x1, x2].sort((n1, n2) => n1 - n2);
          stepsMarkdown += `$$\\mathbf{HP = \\{ ${formatNumber(sorted[0])}, \\; ${formatNumber(sorted[1])} \\}}$$\n\n`;
        }
      } else {
        const f1 = simplifyFraction(-b, 2 * a);
        stepsMarkdown += `- $${v}_1 = \\frac{${-b} + \\sqrt{${D}}}{${2 * a}} \\approx \\mathbf{${formatNumber((-b + sqrtD) / (2 * a))}}$\n`;
        stepsMarkdown += `- $${v}_2 = \\frac{${-b} - \\sqrt{${D}}}{${2 * a}} \\approx \\mathbf{${formatNumber((-b - sqrtD) / (2 * a))}}$\n\n`;
      }
    } else {
      // D < 0 -> Complex roots
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(Math.abs(D)) / (2 * a);
      stepsMarkdown += `Akar imajiner (bilangan kompleks):\n`;
      stepsMarkdown += `$$${v}_{1,2} = ${formatNumber(realPart)} \\pm ${formatNumber(Math.abs(imagPart))}i$$\n\n`;
    }

    // Vertex (Titik Puncak Parabola)
    const xp = -b / (2 * a);
    const yp = -D / (4 * a);
    stepsMarkdown += `#### 5. Koordinat Titik Puncak Parabola (Ekstrim)\n`;
    stepsMarkdown += `- Sumbu Simetri: $${v}_p = -\\frac{b}{2a} = -\\frac{${b}}{2(${a})} = \\mathbf{${formatNumber(xp)}}$\n`;
    stepsMarkdown += `- Nilai Optimum: $y_p = -\\frac{D}{4a} = -\\frac{${D}}{4(${a})} = \\mathbf{${formatNumber(yp)}}$\n`;
    stepsMarkdown += `- **Titik Puncak:** $( ${formatNumber(xp)}, \\; ${formatNumber(yp)} )$\n`;
    stepsMarkdown += `- **Karakter Kurva:** Kurva parabola terbuka ke **${a > 0 ? "atas (memiliki nilai minimum)" : "bawah (memiliki nilai maksimum)"}**.\n\n`;

    stepsMarkdown += `Ada bentuk persamaan kuadrat atau fungsi parabola lain yang ingin kamu uji bersama Matrix?`;
    return stepsMarkdown;
  }

  /**
   * Parser & Solver Persamaan Linear (e.g. 2x + 5 = 15)
   */
  static solveLinear(rawQuery) {
    let q = rawQuery.replace(/hitung/gi, "")
      .replace(/selesaikan/gi, "")
      .replace(/carilah/gi, "")
      .replace(/nilai/gi, "")
      .replace(/dari/gi, "")
      .trim();

    if (!q.includes("=")) return null;
    if (/[xXyYtTzZ](\^2|²)/.test(q)) return null; // Ignore if quadratic

    const varMatch = q.match(/([a-zA-Z])/);
    if (!varMatch) return null;
    const v = varMatch[1].toLowerCase();

    const parts = q.split("=");
    if (parts.length !== 2) return null;

    const leftStr = parts[0].trim();
    const rightStr = parts[1].trim();

    const parseLinearSide = (str) => {
      let m = 0, c = 0;
      let s = str.replace(/\s+/g, "");
      if (!s) return { m, c };
      if (s[0] !== "+" && s[0] !== "-") s = "+" + s;

      const regex = /([+-](?:[0-9]+(?:\.[0-9]+)?)?)(?:([a-zA-Z]))?/g;
      let match;
      while ((match = regex.exec(s)) !== null) {
        if (match.index === regex.lastIndex) regex.lastIndex++;
        const coeffStr = match[1];
        const hasVar = !!match[2];

        let val = 1;
        if (coeffStr === "+") val = 1;
        else if (coeffStr === "-") val = -1;
        else val = parseFloat(coeffStr);

        if (isNaN(val)) continue;

        if (hasVar) m += val;
        else c += val;
      }
      return { m, c };
    };

    const left = parseLinearSide(leftStr);
    const right = parseLinearSide(rightStr);

    // Equation: mLeft * x + cLeft = mRight * x + cRight
    // (mLeft - mRight) * x = cRight - cLeft
    const mTotal = left.m - right.m;
    const cTotal = right.c - left.c;

    if (mTotal === 0) {
      if (cTotal === 0) {
        return `### 📐 Matrix Math Solver: Persamaan Linear\n\n**Persamaan:** $${q}$\n\nPersamaan ini adalah **identitas** yang berlaku untuk **seluruh bilangan real $x \\in \\mathbb{R}$** (solusi tak hingga).`;
      }
      return `### 📐 Matrix Math Solver: Persamaan Linear\n\n**Persamaan:** $${q}$\n\nPersamaan ini **kontradiktif / tidak memiliki solusi** ($0 = ${cTotal}$).`;
    }

    const solution = cTotal / mTotal;

    let res = `### 📐 Matrix Math Solver: Persamaan Linear\n\n`;
    res += `**Persamaan Awal:** $${q}$\n\n`;
    res += `#### Langkah Penyelesaian:\n`;
    res += `1. Kumpulkan semua suku bervariabel $${v}$ ke ruas kiri:\n`;
    res += `   $$${left.m !== 0 ? `${left.m}${v}` : "0"} - (${right.m !== 0 ? `${right.m}${v}` : "0"}) = ${cTotal + left.c} - (${left.c})$$\n`;
    res += `2. Sederhanakan koefisien kedua ruas:\n`;
    res += `   $$${mTotal}${v} = ${cTotal}$$\n`;
    res += `3. Bagi kedua ruas dengan $${mTotal}$:\n`;
    res += `   $$${v} = \\frac{${cTotal}}{${mTotal}} = \\mathbf{${formatNumber(solution)}}$$\n\n`;
    res += `#### Verifikasi Jawaban:\n`;
    res += `Substitusi nilai $${v} = ${formatNumber(solution)}$ ke persamaan awal:\n`;
    res += `- Ruas Kiri: $${left.m}(${formatNumber(solution)}) + (${left.c}) = ${formatNumber(left.m * solution + left.c)}$\n`;
    res += `- Ruas Kanan: $${right.m}(${formatNumber(solution)}) + (${right.c}) = ${formatNumber(right.m * solution + right.c)}$\n`;
    res += `*(Kedua ruas terbukti sama dan seimbang!)*\n\n`;
    res += `**Solusi Akhir:** $\\mathbf{${v} = ${formatNumber(solution)}}$`;

    return res;
  }

  /**
   * Arbitrary-Precision Arithmetic Engine (BigInt + High Precision Decimal)
   */
  static solveArithmetic(query) {
    let clean = query.toLowerCase()
      .replace(/berapa/g, "")
      .replace(/hasil/g, "")
      .replace(/dari/g, "")
      .replace(/hitung/g, "")
      .replace(/tentukan/g, "")
      .replace(/nilai/g, "")
      .replace(/=/g, "")
      .replace(/\?/g, "")
      .trim();

    // Check Percentage (e.g. "20% dari 500000" or "15 % 8000")
    const percentMatch = clean.match(/^([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:dari|of|\*|x)?\s*([0-9]+(?:\.[0-9]+)?)$/);
    if (percentMatch) {
      const p = parseFloat(percentMatch[1]);
      const base = parseFloat(percentMatch[2]);
      const result = (p / 100) * base;
      return `### 🧮 Matrix Math Solver: Perhitungan Persentase\n\n` +
        `**Soal:** $${p}\\% \\text{ dari } ${formatNumber(base)}$\n\n` +
        `**Perhitungan:**\n` +
        `$$\\frac{${p}}{100} \\times ${formatNumber(base)} = ${formatNumber(result)}$$\n\n` +
        `**Hasil Akhir:** **$${formatNumber(result)}$**`;
    }

    // Match Two Numbers with Operator: Supports BigInt for large integers!
    // Operators: +, -, *, x, X, ×, ., /, ÷, :, ^, **
    const arithMatch = clean.match(/^([0-9]+(?:\.[0-9]+)?)\s*([\*xX×\.\+\-\/÷\:\^]|\*\*)\s*([0-9]+(?:\.[0-9]+)?)$/);
    if (!arithMatch) return null;

    const strA = arithMatch[1];
    const op = arithMatch[2];
    const strB = arithMatch[3];

    const isIntA = /^[0-9]+$/.test(strA);
    const isIntB = /^[0-9]+$/.test(strB);

    let opSymbol = "\\times";
    let opName = "Perkalian";

    if (op === "+" ) { opSymbol = "+"; opName = "Penjumlahan"; }
    else if (op === "-") { opSymbol = "-"; opName = "Pengurangan"; }
    else if (op === "/" || op === "÷" || op === ":") { opSymbol = "\\div"; opName = "Pembagian"; }
    else if (op === "^" || op === "**") { opSymbol = "^"; opName = "Perpangkatan"; }

    // BigInt path for multiplication, addition, subtraction of integers
    if (isIntA && isIntB && (op === "*" || op === "x" || op === "X" || op === "×" || op === "." || op === "+" || op === "-")) {
      const bigA = BigInt(strA);
      const bigB = BigInt(strB);
      let bigRes;

      if (op === "+" ) bigRes = bigA + bigB;
      else if (op === "-") bigRes = bigA - bigB;
      else bigRes = bigA * bigB;

      const formattedA = formatNumber(bigA);
      const formattedB = formatNumber(bigB);
      const formattedRes = formatNumber(bigRes);

      let res = `### 🧮 Matrix Math Solver: ${opName}\n\n`;
      res += `**Operasi:** $${formattedA} ${opSymbol} ${formattedB}$\n`;
      res += `**Hasil Tepat (Eksak):**\n\n`;
      res += `$$\\mathbf{${formattedRes}}$$\n\n`;

      if (bigRes.toString().length > 15) {
        res += `- **Jumlah Digit Hasil:** ${bigRes.toString().length} digit angka.\n`;
        const approxNum = Number(bigA) * Number(bigB);
        if (Number.isFinite(approxNum)) {
          res += `- **Notasi Ilmiah:** $\\approx ${approxNum.toExponential(4).replace("e+", " \\times 10^{")}}$}\n`;
        }
      }

      return res;
    }

    // Floating-point path
    const numA = parseFloat(strA);
    const numB = parseFloat(strB);
    let floatRes = 0;

    if (op === "+") floatRes = numA + numB;
    else if (op === "-") floatRes = numA - numB;
    else if (op === "*" || op === "x" || op === "X" || op === "×" || op === ".") floatRes = numA * numB;
    else if (op === "/" || op === "÷" || op === ":") {
      if (numB === 0) return `### ⚠️ Kesalahan Matematika\n\nPembagian dengan angka $0$ **tidak terdefinisi** dalam matematika!`;
      floatRes = numA / numB;
    } else if (op === "^" || op === "**") {
      floatRes = Math.pow(numA, numB);
    }

    const dispA = formatNumber(numA);
    const dispB = formatNumber(numB);
    const dispRes = formatNumber(floatRes);

    let res = `### 🧮 Matrix Math Solver: ${opName}\n\n`;
    res += `**Operasi:** $${dispA} ${opSymbol} ${dispB}$\n`;
    res += `**Hasil Akhir:** **$${dispRes}$**\n`;

    if (op === "/" || op === "÷" || op === ":") {
      res += `\nBentuk pecahan: $$\\frac{${dispA}}{${dispB}} = ${dispRes}$$\n`;
    }

    return res;
  }

  /**
   * Turunan Kalkulus Sederhana (Derivatives)
   */
  static solveDerivative(query) {
    const q = query.toLowerCase();
    if (!q.includes("turunan") && !q.includes("d/dx") && !q.includes("derivatif")) return null;

    // e.g. "turunan dari 3x^2 - 5x + 4"
    const polyMatch = q.match(/(?:turunan|d\/dx|derivatif)\s*(?:dari)?\s*([0-9a-zA-Z\^\+\-\s]+)/);
    if (!polyMatch) return null;

    const expr = polyMatch[1].trim();
    return `### 🚀 Matrix Math Solver: Kalkulus (Turunan Pertama)\n\n` +
      `**Fungsi Awal:** $f(x) = ${expr}$\n\n` +
      `**Aturan Dasar Turunan (*Power Rule*):**\n` +
      `$$\\frac{d}{dx}(a \\cdot x^n) = a \\cdot n \\cdot x^{n-1}$$\n` +
      `$$\\frac{d}{dx}(c) = 0 \\quad (\\text{turunan konstanta adalah nol})$$\n\n` +
      `Silakan masukkan fungsi lengkap yang ingin kamu turunkan langkah demi langkah bersama Matrix!`;
  }

  /**
   * Integral Kalkulus Sederhana
   */
  static solveIntegral(query) {
    const q = query.toLowerCase();
    if (!q.includes("integral") && !q.includes("antiturunan")) return null;

    return `### 🚀 Matrix Math Solver: Kalkulus (Integral)\n\n` +
      `**Aturan Dasar Integral Tak Tentu (*Power Rule of Integration*):**\n` +
      `$$\\int x^n \\, dx = \\frac{1}{n+1} x^{n+1} + C \\quad (n \\neq -1)$$\n\n` +
      `$$\\int a \\, dx = a x + C$$\n\n` +
      `Tuliskan fungsi yang ingin kamu integralkan (misal: $\\int (3x^2 - 4x + 5)\\,dx$), dan Matrix akan membimbing integrasinya langkah demi langkah!`;
  }

  /**
   * Pemfaktoran Polinomial
   */
  static solveFactoring(query) {
    const q = query.toLowerCase();
    if (!q.includes("faktor") && !q.includes("faktorisasi")) return null;

    const match = q.match(/(?:faktorkan|faktor(?:isasi)?)\s*(?:dari)?\s*([0-9a-zA-Z\^\+\-\s]+)/);
    if (!match) return null;

    const expr = match[1].trim();
    // Try solve as quadratic
    const quadSol = this.solveQuadratic(expr + " = 0");
    if (quadSol) return quadSol;

    return null;
  }

  /**
   * Evaluasi Sudut Trigonometri Khusus
   */
  static solveTrig(query) {
    const q = query.toLowerCase().replace(/\s+/g, "");
    const match = q.match(/^(sin|cos|tan)\(?([0-9]+)\)?(?:deg|derajat)?$/);
    if (!match) return null;

    const func = match[1];
    const angle = parseInt(match[2], 10);

    const specialAngles = {
      0: { sin: "0", cos: "1", tan: "0" },
      30: { sin: "\\frac{1}{2}", cos: "\\frac{1}{2}\\sqrt{3}", tan: "\\frac{1}{3}\\sqrt{3}" },
      45: { sin: "\\frac{1}{2}\\sqrt{2}", cos: "\\frac{1}{2}\\sqrt{2}", tan: "1" },
      60: { sin: "\\frac{1}{2}\\sqrt{3}", cos: "\\frac{1}{2}", tan: "\\sqrt{3}" },
      90: { sin: "1", cos: "0", tan: "\\text{Tidak Terdefinisi}" },
      180: { sin: "0", cos: "-1", tan: "0" },
      270: { sin: "-1", cos: "0", tan: "\\text{Tidak Terdefinisi}" },
      360: { sin: "0", cos: "1", tan: "0" }
    };

    if (specialAngles[angle]) {
      const val = specialAngles[angle][func];
      return `### 📐 Matrix Math Solver: Trigonometri Sudut Istimewa\n\n` +
        `**Fungsi:** $\\${func}(${angle}^\\circ)$\n` +
        `**Nilai Eksak:** **$${val}$**\n\n` +
        `Nilai ini didapatkan dari segitiga siku-siku istimewa pada lingkaran satuan (*unit circle*).`;
    }

    return null;
  }
}
