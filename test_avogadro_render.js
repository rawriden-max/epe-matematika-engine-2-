const rawText = `Mari kita bahas kedua topik menarik ini secara mendalam, yaitu Hukum Avogadro dalam stoikiometri gas dan konsep-konsep dasar dalam Termokimia.

---

### 1. Hukum Avogadro dan Rumusnya

**Hukum Avogadro** menyatakan bahwa pada suhu ($T$) dan tekanan ($P$) yang sama, gas-gas yang memiliki volume ($V$) yang sama akan mengandung jumlah molekul atau mol ($n$) yang sama pula. Dengan kata lain, volume suatu gas berbanding lurus dengan jumlah molnya.

#### Rumus Hukum Avogadro:
$$\\frac{V_1}{n_1} = \\frac{V_2}{n_2}$$

Keterangan:
*   $V_1$ dan $V_2$ = Volume gas 1 dan gas 2 (L atau $m^3$)
*   $n_1$ dan $n_2$ = Jumlah mol gas 1 dan gas 2 (mol)

#### Bilangan Avogadro ($N_A$ atau $L$):
Konsep Avogadro juga mendasari definisi satuan "mol". Satu mol zat apa pun mengandung jumlah partikel yang sama dengan **Bilangan Avogadro**, yaitu:
$$N_A \\approx 6,022 \\times 10^{23} \\text{ partikel/mol}$$

Hubungan antara jumlah partikel ($X$), jumlah mol ($n$), dan Bilangan Avogadro ($N_A$) dirumuskan sebagai:
$$X = n \\times N_A$$

---

### 2. Materi Termokimia

**Termokimia** adalah cabang ilmu kimia yang mempelajari perubahan kalor (panas) yang menyertai suatu reaksi kimia atau perubahan fisika.

#### A. Sistem dan Lingkungan
*   **Sistem**: Bagian dari alam semesta yang menjadi pusat perhatian kita untuk diamati (misalnya, zat-zat yang bereaksi di dalam gelas kimia).
*   **Lingkungan**: Segala sesuatu di luar sistem yang membatasi sistem dan dapat memengaruhi sistem (misalnya, gelas kimia, udara sekitar, termometer).

#### B. Reaksi Eksoterm dan Endoterm
Berdasarkan arah perpindahan kalor antara sistem dan lingkungan, reaksi termokimia dibagi menjadi dua:

1.  **Reaksi Eksoterm**: 
    *   Sistem melepas kalor ke lingkungan.
    *   Suhu lingkungan mengalami kenaikan.
    *   Perubahan entalpi bernilai negatif: $\\Delta H < 0$.
    *   *Contoh*: Pembakaran kayu, reaksi logam natrium dengan air.

2.  **Reaksi Endoterm**:
    *   Sistem menyerap kalor dari lingkungan.
    *   Suhu lingkungan mengalami penurunan.
    *   Perubahan entalpi bernilai positif: $\\Delta H > 0$.
    *   *Contoh*: Fotosintesis, es mencair, pelarutan urea dalam air.

#### C. Rumus-Rumus Penting dalam Termokimia

1.  **Kapasitas Kalor dan Kalor Jenis (Kalorimetri)**:
    Untuk menghitung jumlah kalor ($q$) yang diserap atau dilepas oleh air/larutan di dalam kalorimeter:
    $$q = m \\cdot c \\cdot \\Delta T$$
    Atau jika kapasitas kalor wadah ($C$) diperhitungkan:
    $$q = C \\cdot \\Delta T$$
    
    Keterangan:
    *   $q$ = Kalor (Joule)
    *   $m$ = Massa zat (gram)
    *   $c$ = Kalor jenis zat ($\\text{J g}^{-1} \\text{K}^{-1}$ atau $\\text{J g}^{-1} \\ ^\\circ\\text{C}^{-1}$)
    *   $C$ = Kapasitas kalor ($\\text{J K}^{-1}$ atau $\\text{J } ^\\circ\\text{C}^{-1}$)
    *   $\\Delta T$ = Perubahan suhu ($T_{\\text{akhir}} - T_{\\text{awal}}$)

2.  **Hukum Hess**:
    Hukum ini menyatakan bahwa perubahan entalpi suatu reaksi hanya bergantung pada keadaan awal (reaktan) dan keadaan akhir (produk), serta tidak bergantung pada jalannya atau tahapan reaksi.
    $$\\Delta H_{\\text{total}} = \\Delta H_1 + \\Delta H_2 + \\Delta H_3 + \\dots$$

3.  **Penentuan $\\Delta H$ Berdasarkan Entalpi Pembentukan Standar ($\\Delta H_f^\\circ$)**:
    $$\\Delta H_{\\text{reaksi}} = \\sum \\Delta H_f^\\circ \\text{ (produk)} - \\sum \\Delta H_f^\\circ \\text{ (reaktan)}$$

4.  **Penentuan $\\Delta H$ Berdasarkan Energi Ikatan**:
    $$\\Delta H_{\\text{reaksi}} = \\sum E_{\\text{ikatan putus (reaktan)}} - \\sum E_{\\text{ikatan terbentuk (produk)}}$$`;

function formatMarkdown(raw) {
  if (!raw) return "";

  let html = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 1. Code blocks (```lang ... ```)
  html = html.replace(/```([a-zA-Z0-9_\-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="p-3 my-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto"><code>${code.trim()}</code></pre>`;
  });

  // 2. Parse Markdown Tables (| Col 1 | Col 2 |\n|---|---|\n| Val 1 | Val 2 |)
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

  // 3. Horizontal Rules (---, ***, ___, etc.)
  html = html.replace(/^[ \t]*(?:---|\*\*\*|___|- - -|\* \* \*|_ _ _|-{3,}|\*{3,}|_{3,})[ \t]*$/gim, '<hr class="my-3.5 border-t border-slate-700/70" />');

  // 4. Headers (h6 down to h1)
  html = html.replace(/^[ \t]*######[ \t]+(.*$)/gim, '<h6 class="font-bold text-xs text-slate-400 mt-2.5 mb-1 tracking-wider uppercase">$1</h6>');
  html = html.replace(/^[ \t]*#####[ \t]+(.*$)/gim, '<h6 class="font-bold text-xs text-cyan-300 mt-2.5 mb-1 tracking-wide uppercase">$1</h6>');
  html = html.replace(/^[ \t]*####[ \t]+(.*$)/gim, '<h5 class="font-bold text-xs sm:text-sm text-blue-300 mt-3 mb-1">$1</h5>');
  html = html.replace(/^[ \t]*###[ \t]+(.*$)/gim, '<h4 class="font-bold text-sm sm:text-base text-white mt-3.5 mb-1.5">$1</h4>');
  html = html.replace(/^[ \t]*##[ \t]+(.*$)/gim, '<h3 class="font-bold text-base sm:text-lg text-white mt-4 mb-2 border-b border-slate-700/50 pb-1">$1</h3>');
  html = html.replace(/^[ \t]*#[ \t]+(.*$)/gim, '<h2 class="font-extrabold text-lg sm:text-xl text-white mt-4 mb-2">$1</h2>');

  // 5. Blockquotes (handling both escaped &gt; and raw >)
  html = html.replace(/^[ \t]*(?:&gt;|>)[ \t]?(.*$)/gim, '<blockquote class="p-2.5 border-l-2 border-blue-500 bg-slate-800/40 rounded-r text-xs italic my-2 text-slate-300">$1</blockquote>');

  // 6. Lists
  // Numbered lists: 1. 2. etc with hanging indent
  html = html.replace(/^([ \t]*)(\d+)\.[ \t]+(.*$)/gim, (match, indent, num, content) => {
    const isNested = indent && indent.length >= 2;
    const mlClass = isNested ? "ml-6" : "ml-2";
    return `<div class="${mlClass} flex items-start gap-2 my-1 text-slate-300"><span class="font-bold text-cyan-400 select-none flex-shrink-0">${num}.</span><div class="flex-1">${content}</div></div>`;
  });

  // Bullet points: - or * or + with hanging indent
  html = html.replace(/^([ \t]*)[-\*\+][ \t]+(.*$)/gim, (match, indent, content) => {
    const isNested = indent && indent.length >= 2;
    const mlClass = isNested ? "ml-6" : "ml-2";
    const bulletSymbol = isNested ? "◦" : "•";
    const bulletColor = isNested ? "text-cyan-400" : "text-blue-400";
    return `<div class="${mlClass} flex items-start gap-2 my-0.5 text-slate-300"><span class="${bulletColor} select-none flex-shrink-0 text-sm leading-tight">${bulletSymbol}</span><div class="flex-1">${content}</div></div>`;
  });

  // 7. Bold & Italic & Strikethrough
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-white">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-200">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic text-slate-200">$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-slate-400">$1</del>');

  // 8. Inline code: `code`
  html = html.replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/70 text-cyan-300 font-mono text-[11px]">$1</code>');

  // 9. Convert line breaks
  html = html.replace(/\n/g, "<br/>");

  // 10. Clean up redundant <br/> tags around block elements
  html = html.replace(/(<\/(?:h[1-6]|pre|table|thead|tbody|tr|th|td|div|blockquote)>|<hr[^>]*\/?>)\s*<br\s*\/?>/gi, "$1");
  html = html.replace(/<br\s*\/?>\s*(<(?:h[1-6]|pre|table|div|blockquote|hr)[^>]*>)/gi, "$1");
  html = html.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br/><br/>");

  return html;
}

function renderSafeMarkdownAndMath(text) {
  if (!text) return "";

  const mathPlaceholders = [];

  const stashMath = (expr, isDisplay) => {
    const placeholder = `@@@EPEMATHTOKEN${mathPlaceholders.length}@@@`;
    // Simulate KaTeX representation
    const rendered = `[KATEX_${isDisplay ? "DISPLAY" : "INLINE"}: ${expr}]`;
    mathPlaceholders.push(rendered);
    return placeholder;
  };

  // 1. Extract Display Math: $$...$$ OR \[...\]
  let str = text.replace(/(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g, (match, expr1, expr2) => {
    const expr = expr1 !== undefined ? expr1 : expr2;
    if (!expr || !expr.trim()) return "";
    return stashMath(expr, true);
  });

  // 2. Extract Inline Math: $...$ OR \(...\)
  str = str.replace(/(?:\$([^\s\$\r\n](?:[^\$\r\n]*?[^\s\$\r\n])?)\$|\\\(([^\r\n]+?)\\\))/g, (match, expr1, expr2) => {
    const expr = expr1 !== undefined ? expr1 : expr2;
    if (!expr) return match;
    const trimmed = expr.trim();
    if (!trimmed) return match;
    return stashMath(trimmed, false);
  });

  // 3. Format standard markdown
  let html = formatMarkdown(str);

  // 4. Re-inject safely pre-rendered KaTeX HTML back into placeholders
  html = html.replace(/(?:<[a-zA-Z0-9]+[^>]*>)*(?:@@@|___|%%)?EPEMATHTOKEN(\d+)(?:@@@|___|%%)?(?:<\/[a-zA-Z0-9]+>)*/g, (match, idx) => {
    const index = parseInt(idx, 10);
    return mathPlaceholders[index] !== undefined ? mathPlaceholders[index] : match;
  });

  return { html, mathCount: mathPlaceholders.length, placeholders: mathPlaceholders };
}

const result = renderSafeMarkdownAndMath(rawText);
console.log("TOTAL MATH PLACEHOLDERS STASHED:", result.mathCount);

// Check if any raw '####' or '---' remained
const hasRawH4 = result.html.includes("####");
const hasRawHR = /(?:^|<br\s*\/?>)---(?:<br\s*\/?>|$)/.test(result.html);
const hasRawDeltaH = result.html.includes("&lt; 0") && !result.html.includes("KATEX_INLINE: \\Delta H < 0");

console.log("Has raw ####:", hasRawH4);
console.log("Has raw ---:", hasRawHR);
console.log("Delta H < 0 stashed:", result.placeholders.some(p => p.includes("\\Delta H < 0")));
console.log("Delta H > 0 stashed:", result.placeholders.some(p => p.includes("\\Delta H > 0")));
console.log("\nSAMPLE OUTPUT FIRST 1200 CHARS:\n");
console.log(result.html.slice(0, 1200));
