/**
 * aiVisionService.js - Multi-Provider Vision AI Solver (EPE V3)
 * 
 * Mendukung Bring-Your-Own-Key (BYOK) untuk 3 Provider AI Ternama:
 * 1. Google Gemini (Gemini 1.5 Flash / Gemini 1.5 Pro / Gemini 2.0)
 * 2. OpenAI (GPT-4o / GPT-4o-mini)
 * 3. Anthropic Claude (Claude 3.5 Sonnet / Claude 3 Haiku)
 * 
 * Mampu memproses single problem maupun multi-problem sheet (1 lembar banyak soal)!
 */

export class AiVisionService {
  static STORAGE_KEY = "epe_ai_vision_config";

  static getStoredConfig() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    return {
      provider: "gemini", // "gemini" | "openai" | "claude"
      apiKey: "",
      model: "gemini-3-flash-preview",
      temperature: 0.2
    };
  }

  static saveConfig(cfg) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {}
  }

  static hasValidKey() {
    const cfg = this.getStoredConfig();
    return Boolean(cfg.apiKey && cfg.apiKey.trim().length > 8);
  }

  /**
   * Mengirim gambar atau file dokumen (PDF) ke Provider AI untuk ekstraksi dan penyelesaian matematika
   */
  static async analyzeMediaMath(mediaDataUrl, fileMeta = {}) {
    const config = this.getStoredConfig();
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new Error("API Key belum dikonfigurasi. Silakan masukkan API Key Gemini, OpenAI, atau Claude Anda.");
    }

    const { mimeType, base64Data } = this._parseDataUrl(mediaDataUrl);

    if (config.provider === "gemini") {
      return await this._callGemini(config, mimeType, base64Data, fileMeta);
    } else if (config.provider === "openai") {
      return await this._callOpenAI(config, mimeType, base64Data, fileMeta);
    } else if (config.provider === "claude") {
      return await this._callClaude(config, mimeType, base64Data, fileMeta);
    } else {
      throw new Error(`Provider tidak dikenali: ${config.provider}`);
    }
  }

  /**
   * Backward-compatible alias untuk analisis gambar
   */
  static async analyzeImageMath(imageDataUrl) {
    return await this.analyzeMediaMath(imageDataUrl);
  }

  /**
   * Mengirim file teks atau formula LaTeX (.txt, .tex, .md) ke AI untuk ekstraksi & penyelesaian
   */
  static async analyzeTextMath(textContent, fileMeta = {}) {
    const config = this.getStoredConfig();
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new Error("API Key belum dikonfigurasi. Silakan masukkan API Key Gemini, OpenAI, atau Claude Anda.");
    }

    if (config.provider === "gemini") {
      return await this._callGeminiText(config, textContent, fileMeta);
    } else if (config.provider === "openai") {
      return await this._callOpenAIText(config, textContent, fileMeta);
    } else if (config.provider === "claude") {
      return await this._callClaudeText(config, textContent, fileMeta);
    } else {
      throw new Error(`Provider tidak dikenali: ${config.provider}`);
    }
  }

  /**
   * Test ping koneksi API Key
   */
  static async testConnection(provider, apiKey, model = "") {
    if (!apiKey || apiKey.trim().length < 8) {
      throw new Error("API Key tidak valid atau terlalu pendek.");
    }

    if (provider === "gemini") {
      const modelsToTry = model ? [model, "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"] : [
        "gemini-3-flash-preview",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
        "gemini-3.1-pro-preview",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
      ];

      let lastError = null;
      for (const m of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey.trim()}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Ping test. Jawab hanya 'OK'." }] }]
            })
          });
          if (res.ok) {
            return { success: true, provider: "Gemini", model: m };
          }
          const err = await res.json().catch(() => ({}));
          lastError = new Error(err.error?.message || `HTTP ${res.status}: Gagal otentikasi Gemini (${m})`);
        } catch (e) {
          lastError = e;
        }
      }
      throw lastError || new Error("Gagal terhubung ke model Gemini.");
    } else if (provider === "openai") {
      const selectedModel = model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: "Ping test. Jawab hanya 'OK'." }],
          max_tokens: 10
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}: Gagal otentikasi OpenAI`);
      }
      return { success: true, provider: "OpenAI", model: selectedModel };
    } else if (provider === "claude") {
      const selectedModel = model || "claude-3-5-haiku-20241022";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 15,
          messages: [{ role: "user", content: "Ping test. Jawab hanya 'OK'." }]
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}: Gagal otentikasi Claude`);
      }
      return { success: true, provider: "Claude", model: selectedModel };
    }
  }

  // =========================================================================
  // IMPLEMENTASI SPESIFIK PROVIDER
  // =========================================================================

  static getSystemPrompt(fileMeta = {}) {
    const fileHint = fileMeta.name ? ` pada berkas "${fileMeta.name}"` : "";
    return `Anda adalah pakar matematika olimpiade dan OCR/Document AI pembelajaran cerdas.
Tugas Anda adalah memindai dan menyelesaikan SELURUH butir soal matematika yang ada pada gambar atau berkas dokumen${fileHint} yang dikirimkan (baik berupa file PDF, lembar kerja siswa, formula LaTeX, aljabar, kalkulus, limit fungsi trigonometri, geometri, maupun aritmetika).

ATURAN PENTING:
1. Jika pada berkas/gambar terdapat LEBIH DARI SATU SOAL:
   - Anda WAJIB mendeteksi dan menyelesaikan SETIAP SOAL secara berurutan di dalam array "problems".
   - Set "isMultiProblem": true.
2. Jika pada berkas/gambar HANYA ADA 1 SOAL (misal: soal limit trigonometri, persamaan kuadrat tunggal):
   - Masukkan soal tersebut sebagai SATU-SATUNYA elemen di dalam array "problems".
   - Set "isMultiProblem": false.
3. KELENGKAPAN WAJIB PADA SETIAP BUTIR SOAL:
   - "latex": Formula atau persamaan soal dalam notasi KaTeX LaTeX murni (tanpa pembungkus $$).
   - "solutionSteps": Array langkah demi langkah yang terinci, sistematis, dan jelas dalam Bahasa Indonesia. Tuliskan formula perantara dengan notasi KaTeX ($...$).
   - "finalAnswer": Nilai jawaban akhir yang paling ringkas dan tepat.
4. Jika berkas/gambar merupakan lembar pengerjaan siswa yang berisi coretan/jawaban, periksa kebenarannya dan berikan koreksi jika ada langkah siswa yang keliru.

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON MURNI (tanpa markdown backtick \`\`\`json di sekitarnya):
{
  "isMultiProblem": false,
  "sheetTitle": "Judul Lembar Soal (contoh: Limit Fungsi Trigonometri atau Operasi Pecahan)",
  "problems": [
    {
      "number": 1,
      "title": "Soal 1: Judul Singkat",
      "latex": "\\lim_{x \\to 0} \\frac{\\sin x}{\\sqrt{\\pi + \\tan x} - \\sqrt{\\pi - \\tan x}}",
      "questionText": "Teks soal lengkap",
      "solutionSteps": [
        "Langkah 1: Analisis bentuk limit dan substitusi...",
        "Langkah 2: Kalikan dengan sekawan...",
        "Langkah 3: Sederhanakan bentuk pecahan...",
        "Langkah 4: Hitung nilai akhir..."
      ],
      "finalAnswer": "\\sqrt{\\pi}",
      "idealAnswerKeywords": ["sqrt(pi)", "\\sqrt{\\pi}", "akar pi"],
      "domain": "Kalkulus & Trigonometri"
    }
  ]
}`;
  }

  static async _callGemini(config, mimeType, base64Data, fileMeta = {}) {
    const modelsToTry = config.model ? [config.model, "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"] : [
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.1-pro-preview"
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: this.getSystemPrompt(fileMeta) },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          return this._cleanAndParseJSON(rawText);
        }

        const err = await res.json().catch(() => ({}));
        lastError = new Error(err.error?.message || `HTTP ${res.status}: Gagal menganalisis via Gemini (${model})`);
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError || new Error("Gagal menganalisis via Gemini.");
  }

  static async _callOpenAI(config, mimeType, base64Data, fileMeta = {}) {
    if (mimeType === "application/pdf") {
      throw new Error("OpenAI saat ini belum mendukung pembacaan berkas PDF biner via API Chat Completions. Silakan pilih Google Gemini (Gratis) atau Claude di Pengaturan API Key untuk memindai dokumen PDF secara langsung.");
    }

    const model = config.model || "gpt-4o";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: this.getSystemPrompt(fileMeta) },
          {
            role: "user",
            content: [
              { type: "text", text: "Pindai dan selesaikan seluruh butir soal matematika dalam berkas/gambar ini secara lengkap!" },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: Gagal menganalisis via OpenAI`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";
    return this._cleanAndParseJSON(rawText);
  }

  static async _callClaude(config, mimeType, base64Data, fileMeta = {}) {
    const model = config.model || "claude-3-5-sonnet-20241022";
    const isPdf = mimeType === "application/pdf";
    const mediaBlock = isPdf
      ? {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64Data
          }
        }
      : {
          type: "image",
          source: {
            type: "base64",
            media_type: mimeType,
            data: base64Data
          }
        };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 3500,
        temperature: 0.1,
        system: this.getSystemPrompt(fileMeta),
        messages: [
          {
            role: "user",
            content: [
              mediaBlock,
              {
                type: "text",
                text: isPdf 
                  ? "Pindai dan selesaikan semua butir soal matematika pada dokumen PDF ini secara mendetail. Outputkan persis JSON."
                  : "Pindai dan selesaikan semua butir soal matematika pada gambar ini. Outputkan persis JSON."
              }
            ]
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: Gagal menganalisis via Claude`);
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text || "{}";
    return this._cleanAndParseJSON(rawText);
  }

  static async _callGeminiText(config, textContent, fileMeta = {}) {
    const modelsToTry = config.model ? [config.model, "gemini-3-flash-preview", "gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"] : [
      "gemini-3-flash-preview",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.1-pro-preview"
    ];

    const fileHint = fileMeta.name ? ` dari berkas "${fileMeta.name}"` : "";
    const prompt = `Pindai, ekstrak, dan selesaikan seluruh butir soal matematika${fileHint} berikut secara lengkap:\n\n${textContent}`;

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: this.getSystemPrompt(fileMeta) },
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          return this._cleanAndParseJSON(rawText);
        }

        const err = await res.json().catch(() => ({}));
        lastError = new Error(err.error?.message || `HTTP ${res.status}: Gagal menganalisis teks via Gemini (${model})`);
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError || new Error("Gagal menganalisis teks matematika via Gemini.");
  }

  static async _callOpenAIText(config, textContent, fileMeta = {}) {
    const model = config.model || "gpt-4o-mini";
    const fileHint = fileMeta.name ? ` dari berkas "${fileMeta.name}"` : "";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          { role: "system", content: this.getSystemPrompt(fileMeta) },
          {
            role: "user",
            content: `Pindai, ekstrak, dan selesaikan seluruh butir soal matematika${fileHint} berikut secara lengkap:\n\n${textContent}`
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: Gagal menganalisis teks via OpenAI`);
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";
    return this._cleanAndParseJSON(rawText);
  }

  static async _callClaudeText(config, textContent, fileMeta = {}) {
    const model = config.model || "claude-3-5-haiku-20241022";
    const fileHint = fileMeta.name ? ` dari berkas "${fileMeta.name}"` : "";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 3500,
        temperature: 0.1,
        system: this.getSystemPrompt(fileMeta),
        messages: [
          {
            role: "user",
            content: `Pindai, ekstrak, dan selesaikan seluruh butir soal matematika${fileHint} berikut secara lengkap:\n\n${textContent}`
          }
        ]
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}: Gagal menganalisis teks via Claude`);
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.text || "{}";
    return this._cleanAndParseJSON(rawText);
  }

  /**
   * Mendiagnosis jawaban dan coretan langkah siswa secara mendalam menggunakan AI Tutor.
   * Menerapkan toleransi nilai matematis ekuivalen (tidak kaku/terlalu tegas) dan mengklasifikasikan kesalahan kognitif.
   */
  static async diagnoseStudentAnswerWithAi({ question, studentAnswer, studentSteps }) {
    const config = this.getStoredConfig();
    if (!config.apiKey || !config.apiKey.trim()) {
      throw new Error("API Key belum dikonfigurasi.");
    }

    const promptText = `Kamu adalah Asisten Tutor Matematika Ahli Diagnostik Kognitif EPE (Error Pattern Engine) yang ramah, empatik, suportif, dan mendidik.
Tugasmu adalah menganalisis jawaban dan coretan langkah siswa untuk soal berikut:

SOAL:
- Ekspresi / Soal: ${question.latex || question.expression || question.title || "Soal Matematika"}
- Pertanyaan: ${question.questionText || "Selesaikan operasi matematika ini"}
- Kunci Jawaban Baku: ${question.finalAnswer || "-"}

JAWABAN SISWA:
- Jawaban Akhir Siswa: "${studentAnswer || "(Kosong)"}"
- Coretan Langkah / Cara Siswa: "${studentSteps || "(Tidak ada coretan langkah)"}"

ATURAN PENTING & TOLERANSI PEDAGOGIS:
1. JANGAN TERLALU TEGAS / KAKU terhadap jawaban siswa jika nilainya secara matematis bernilai sama/ekuivalen!
   - Contoh: jika kunci jawaban 3/7 dan siswa menjawab 15/35, itu adalah BENAR SECARA NILAI! Jangan disalahkan, melainkan benarkan dan beri tahu cara menyederhanakannya.
   - Contoh lain: desimal 0.5 vs pecahan 1/2, pecahan campuran 1 1/2 vs 3/2, urutan akar x=2 atau x=3, notasi sqrt(pi) vs 1.77.
2. Tentukan Klasifikasi Kesalahan Kognitif EPE:
   - "E0" -> Bebas Kesalahan & Bentuk Paling Sederhana (Jawaban akurat 100%)
   - "E3-S" -> Nilai Benar (Belum Disederhanakan) (Ekuivalen secara matematis, langkah perkalian/aljabar benar)
   - "E3-A" -> Kesalahan Komputasi / Aritmetika (Salah hitung perkalian/penjumlahan angka tertentu)
   - "E2-P" -> Kesalahan Prosedural / Algoritma (Salah langkah, misal perkalian silang tertukar atau pembuat nol terbalik)
   - "E1-K" -> Miskonsepsi Konseptual (Menjumlahkan penyebut pada perkalian pecahan, dsb)
   - "E3-T" -> Kesalahan Tanda Aljabar (+/- terbalik)
   - "E2-L" -> Penyelesaian Belum Lengkap (Misal baru menemukan 1 akar dari 2 akar persamaan kuadrat)
3. Jelaskan kepada murid SALAHNYA DI MANA secara jelas, manusiawi, dan tidak menghakimi.
4. Berikan SARAN PERBAIKAN, TRIK CEPAT EPE, dan TULISKAN KUNCI JAWABAN LENGKAPNYA.

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON BERIKUT (TANPA TEKS LAIN):
{
  "status": "correct",
  "classificationCode": "E0",
  "classificationLabel": "[E0] Akurat & Bentuk Paling Sederhana",
  "classificationCategory": "Bebas Kesalahan",
  "headerTitle": "Diagnosis: Jawaban Benar & Sempurna!",
  "headerSubtitle": "Pola pemikiran dan konsep aljabar kamu sudah tepat.",
  "cubicReward": 15,
  "isEquivalent": true,
  "whereIsTheError": "Penjelasan detail letak kesalahan atau kenapa bentuknya belum sederhana",
  "remediationAdvice": [
    "Saran konkret langkah 1",
    "Saran konkret langkah 2"
  ],
  "fastTrick": "Trik cepat atau cara mudah menyelesaikan",
  "simplifiedAnswer": "Bentuk paling sederhana yang baku",
  "canAutoSimplify": false
}
Catatan status dapat bernilai: "correct", "equivalent_unsimplified", "error", atau "partial".
Untuk equivalent_unsimplified, canAutoSimplify harus true, dan cubicReward bernilai 12.`;

    if (config.provider === "gemini") {
      const model = config.model || "gemini-3-flash-preview";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey.trim()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}: Gagal diagnosis AI Gemini`);
      }
      const data = await res.json();
      return this._cleanAndParseJSON(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
    } else if (config.provider === "openai") {
      const model = config.model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: model,
          response_format: { type: "json_object" },
          temperature: 0.1,
          messages: [{ role: "user", content: promptText }]
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}: Gagal diagnosis AI OpenAI`);
      }
      const data = await res.json();
      return this._cleanAndParseJSON(data.choices?.[0]?.message?.content || "{}");
    } else if (config.provider === "claude") {
      const model = config.model || "claude-3-5-sonnet-20241022";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 2000,
          temperature: 0.1,
          messages: [{ role: "user", content: promptText }]
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}: Gagal diagnosis AI Claude`);
      }
      const data = await res.json();
      return this._cleanAndParseJSON(data.content?.[0]?.text || "{}");
    } else {
      throw new Error(`Provider tidak dikenali: ${config.provider}`);
    }
  }

  static _parseDataUrl(dataUrl) {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mimeType: match[1], base64Data: match[2] };
    }
    return { mimeType: "image/jpeg", base64Data: dataUrl };
  }

  static _cleanAndParseJSON(text) {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
      }
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn("Gagal parse response JSON AI:", text);
      throw new Error("Format respons AI bukan JSON yang valid. Silakan coba pindai ulang.");
    }
  }
}
