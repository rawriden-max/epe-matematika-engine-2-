/**
 * webSearchService.js - Real-Time Web Search & Online Knowledge Retrieval (EPE V3)
 * 
 * Memberikan AI Matrix akses langsung ke internet:
 * 1. Wikipedia Knowledge Search (Bahasa Indonesia & Global) via Wikipedia REST API
 * 2. DuckDuckGo Instant Answer & Abstract Search via Open Web API
 * 3. Menggabungkan hasil pencarian internet sebagai konteks grounding untuk jawaban AI
 */

export class WebSearchService {
  /**
   * Cari informasi secara langsung di internet
   * @param {string} query 
   * @returns {Promise<{ hasResults: boolean, summary: string, sourceUrl: string, title: string, fullContext: string }>}
   */
  static async searchInternet(query) {
    if (!query || typeof query !== "string") {
      return { hasResults: false, summary: "", sourceUrl: "", title: "", fullContext: "" };
    }

    // 1. Normalize Indonesian math typos & colloquialisms
    const normalized = this.normalizeQuery(query);

    // 2. Generate list of candidate search terms (from most specific to core entity)
    const searchCandidates = this.extractSearchCandidates(normalized);

    try {
      for (const term of searchCandidates) {
        if (!term || term.length < 2) continue;

        // Step A: Wikipedia Bahasa Indonesia
        const wikiResult = await this._searchWikipedia(term, "id");
        if (wikiResult && wikiResult.summary && wikiResult.summary.length > 20) {
          return {
            hasResults: true,
            title: wikiResult.title,
            summary: wikiResult.summary,
            sourceUrl: wikiResult.url,
            fullContext: `[Informasi Terkini dari Internet - Wikipedia (${wikiResult.title})]:\n${wikiResult.summary}\nSumber: ${wikiResult.url}`
          };
        }

        // Step B: DuckDuckGo Instant Answer
        const ddgResult = await this._searchDuckDuckGo(term);
        if (ddgResult && ddgResult.summary && ddgResult.summary.length > 20) {
          return {
            hasResults: true,
            title: ddgResult.title || term,
            summary: ddgResult.summary,
            sourceUrl: ddgResult.url || "https://duckduckgo.com/?q=" + encodeURIComponent(term),
            fullContext: `[Informasi Terkini dari Internet - DuckDuckGo (${ddgResult.title})]:\n${ddgResult.summary}`
          };
        }
      }

      // Step C: Fallback to Wikipedia English for primary candidate
      const primaryTerm = searchCandidates[searchCandidates.length - 1] || normalized;
      const wikiEnResult = await this._searchWikipedia(primaryTerm, "en");
      if (wikiEnResult && wikiEnResult.summary && wikiEnResult.summary.length > 20) {
        return {
          hasResults: true,
          title: wikiEnResult.title,
          summary: wikiEnResult.summary,
          sourceUrl: wikiEnResult.url,
          fullContext: `[Informasi Terkini dari Internet - Wikipedia Global (${wikiEnResult.title})]:\n${wikiEnResult.summary}\nSumber: ${wikiEnResult.url}`
        };
      }
    } catch (err) {
      console.warn("[WebSearchService] Internet search notice:", err.message);
    }

    return { hasResults: false, summary: "", sourceUrl: "", title: "", fullContext: "" };
  }

  /**
   * Normalisasi ejaan dan singkatan matematika umum siswa Indonesia
   */
  static normalizeQuery(text) {
    let q = text.trim();
    const replacements = [
      [/\bdeskriminan\b/gi, "diskriminan"],
      [/\brumur\b/gi, "rumus"],
      [/\bpitagoras\b/gi, "pythagoras"],
      [/\bphytagoras\b/gi, "pythagoras"],
      [/\blinier\b/gi, "linear"],
      [/\bdifferensial\b/gi, "diferensial"],
      [/\bdifrensial\b/gi, "diferensial"],
      [/\bpers\s*kuadrat\b/gi, "persamaan kuadrat"],
      [/\bpers\s*garis\b/gi, "persamaan garis"],
      [/\bpk\b/gi, "persamaan kuadrat"],
      [/\btrigo\b/gi, "trigonometri"],
      [/\bvolum\b/gi, "volume"],
      [/\bpersegipanjang\b/gi, "persegi panjang"]
    ];

    for (const [pattern, repl] of replacements) {
      q = q.replace(pattern, repl);
    }
    return q;
  }

  /**
   * Ekstraksi kandidat kata kunci pencarian web bertingkat
   */
  static extractSearchCandidates(text) {
    const cleaned = text
      .replace(/^(?:apa\s+itu|jelaskan|apakah|bagaimana\s+cara|cara\s+mengerjakan|cara\s+hitung|bagaimana|siapakah|rumus|tolong\s+jelaskan)\s+/i, "")
      .replace(/\?+$/, "")
      .trim();

    const candidates = [];
    if (cleaned) candidates.push(cleaned);

    // Ekstraksi entitas kunci matematika
    const entityPatterns = [
      /\b(?:diskriminan)\b/i,
      /\b(?:persegi\s+panjang)\b/i,
      /\b(?:persamaan\s+kuadrat)\b/i,
      /\b(?:teorema\s+pythagoras|pythagoras)\b/i,
      /\b(?:bunga\s+majemuk|bunga\s+tunggal)\b/i,
      /\b(?:kalkulus|turunan|integral)\b/i,
      /\b(?:trigonometri|sinus|kosinus|tangen)\b/i,
      /\b(?:matriks|aljabar\s+linear)\b/i,
      /\b(?:lingkaran|segitiga|trapesium|jajar\s+genjang)\b/i,
      /\b(?:kubus|balok|tabung|kerucut|bola)\b/i,
      /\b(?:probabilitas|peluang|statistika)\b/i,
      /\b(?:avogadro|hukum\s+newton)\b/i
    ];

    for (const pat of entityPatterns) {
      const m = text.match(pat);
      if (m && m[0] && !candidates.includes(m[0])) {
        candidates.push(m[0]);
      }
    }

    return candidates;
  }

  /**
   * Search Wikipedia REST API with CORS support
   */
  static async _searchWikipedia(term, lang = "id") {
    try {
      // Step A: Search for closest page title
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=1&namespace=0&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) return null;

      const searchData = await searchRes.json();
      const titles = searchData[1];
      const urls = searchData[3];

      if (titles && titles.length > 0) {
        const matchedTitle = titles[0];
        const pageUrl = urls[0] || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(matchedTitle)}`;

        // Step B: Get page summary
        const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(matchedTitle)}`;
        const summaryRes = await fetch(summaryUrl);
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          if (summaryData.extract) {
            return {
              title: summaryData.title || matchedTitle,
              summary: summaryData.extract,
              url: pageUrl
            };
          }
        }

        // Fallback to description from opensearch
        if (searchData[2] && searchData[2][0]) {
          return {
            title: matchedTitle,
            summary: searchData[2][0],
            url: pageUrl
          };
        }
      }
    } catch (e) {
      // Silently continue
    }
    return null;
  }

  /**
   * Search DuckDuckGo Instant Answer API
   */
  static async _searchDuckDuckGo(term) {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(term)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url);
      if (!res.ok) return null;

      const data = await res.json();
      if (data.AbstractText) {
        return {
          title: data.Heading || term,
          summary: data.AbstractText,
          url: data.AbstractURL
        };
      }
    } catch (e) {
      // Silently continue
    }
    return null;
  }
}
