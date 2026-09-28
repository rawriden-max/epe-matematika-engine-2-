const sample = `Selamat datang, “Matrix AI (EPE Matematika)” beraksi!
Anda bertanya: “Apa nama planet tempat kita hidup?”
Jawabannya sederhana dan bersinar: Bumi (Earth).

---

Mengapa Bumi? 🌍


| Ciri | Rincian | Hukum/Formula |
|------|---------|---------------|
| Nama | Bumi | |
| Susunan Tata Surya | Bumi berada di planet ketiga se‑tengah Kuiper Belt | |
| Jarak ke Matahari | Sekitar 149,6 juta km (1 AU) | |
| Periode Orbit | 365,25 hari | \\[
P^2 = a^3
\\] (Kepler‑3) – di mana \\(P\\) dalam tahun dan \\(a\\) dalam AU |
| Gravitasi Permukaan | \\(\\approx 9,81 \\ \\text{m/s}^2\\) | |
| Atmosfer | Sebut satu‑dua komponen: 78 % N₂, 21 % O₂ | |

Kecepatan Orbital: Bumi menempuh ~30 km/s mengelilingi Matahari.

Sumbu Rotasi (aksial tilt): 23,5° → musim-musim.


---

Menghitung “Velocitas Orbit”


Jika Anda ingin, pakai rumus Kepler‑3:

\\[
P = \\sqrt{a^3}
\\]

Untuk \\(a = 1\\) AU,
\\[
P = \\sqrt{1^3} = 1\\ \\text{tahun}
\\]
Maka, 1 tahun kalender 365,25 hari – tempo sempurna!

---

Catatan Ringan


Gaya Gravitasi: Pada permukaan, \\(g = \\frac{GM}{R^2}\\).

Di Bumi, \\(M \\approx 5,97\\times10^{24}\\) kg, \\(R \\approx 6,371\\times10^6\\) m, menghasilkan \\(g \\approx 9,81\\ \\text{m/s}^2\\).

Velocitas Laju Orbit \\(v = \\sqrt{\\frac{GM}{r}}\\).

Memakai \\(r = 1\\) AU ≈ \\(1,496\\times10^{11}\\) m, kita dapat:
\\[
v \\approx 29,78\\ \\text{km/s}
\\]

---

Ringkasan


Kita hidup di planet Bumi.`;

function formatMarkdown(raw) {
  if (!raw) return "";
  let html = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/(?:^|\n)((?:\|[^\n]+\|\r?\n?)+)/g, (match, tableBlock) => {
    const rows = tableBlock.trim().split(/\r?\n/).map(r => r.trim()).filter(r => r.startsWith("|") && r.endsWith("|"));
    if (rows.length < 2) return match;
    let tableHtml = '<div class="overflow-x-auto my-2.5 rounded-lg border border-slate-700/60 shadow-sm"><table class="w-full text-xs text-left border-collapse">';
    let isHeader = true;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(row)) {
        isHeader = false;
        continue;
      }
      const cells = row.slice(1, -1).split("|").map(c => c.trim());
      if (isHeader) {
        tableHtml += '<thead class="bg-slate-800/90 text-cyan-300 font-bold border-b border-slate-700"><tr>';
        cells.forEach(c => tableHtml += `<th class="p-2 border-r border-slate-700/50 last:border-0">${c}</th>`);
        tableHtml += '</tr></thead><tbody class="divide-y divide-slate-800 bg-slate-900/50">';
        isHeader = false;
      } else {
        tableHtml += '<tr class="hover:bg-slate-800/40 transition-colors">';
        cells.forEach(c => tableHtml += `<td class="p-2 text-slate-200 border-r border-slate-800/60 last:border-0">${c}</td>`);
        tableHtml += '</tr>';
      }
    }
    tableHtml += '</tbody></table></div>';
    return "\n" + tableHtml + "\n";
  });
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/\n/g, "<br/>");
  return html;
}

function renderSafeMarkdownAndMath(rawText) {
  if (!rawText) return "";
  const mathPlaceholders = [];
  const stashMath = (expr, isDisplay) => {
    const placeholder = `@@@EPEMATHTOKEN${mathPlaceholders.length}@@@`;
    mathPlaceholders.push(`[KATEX_${isDisplay ? "BLOCK" : "INLINE"}: ${expr}]`);
    return placeholder;
  };
  let text = rawText.replace(/(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g, (match, expr1, expr2) => {
    const expr = expr1 !== undefined ? expr1 : expr2;
    if (!expr || !expr.trim()) return "";
    return stashMath(expr, true);
  });
  text = text.replace(/(?:\$([^\$\r\n<]+?)\$|\\\(([^\(\)\r\n<]+?)\\\))/g, (match, expr1, expr2) => {
    const expr = expr1 !== undefined ? expr1 : expr2;
    if (!expr) return match;
    const trimmed = expr.trim();
    if (!trimmed) return match;
    return stashMath(trimmed, false);
  });
  let html = formatMarkdown(text);
  html = html.replace(/(?:<[a-zA-Z0-9]+[^>]*>)*(?:@@@|___|%%)?EPEMATHTOKEN(\d+)(?:@@@|___|%%)?(?:<\/[a-zA-Z0-9]+>)*/g, (match, idx) => {
    const index = parseInt(idx, 10);
    return mathPlaceholders[index] !== undefined ? mathPlaceholders[index] : match;
  });
  return html;
}

console.log("=== RENDER RESULT ===");
const out = renderSafeMarkdownAndMath(sample);
console.log(out.slice(0, 800));
console.log("\n...\n");
console.log(out.slice(-400));
