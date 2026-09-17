/**
 * api/gemini.js - Serverless Proxy Endpoint for Google Gemini & Internet Access
 * Compatible with Vercel Serverless Functions & Node.js backend
 */

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
  const { prompt, image, mode, depthMode = "standard" } = req.body || {};

  if (!prompt && !image) {
    return res.status(400).json({ error: "Missing prompt or image in request body." });
  }

  // 1. If Server has GEMINI_API_KEY configured in Environment Variables
  if (apiKey && apiKey.trim()) {
    try {
      const depthInstructions = {
        quick: "Mode: RINGKAS. Berikan kesimpulan langsung, langkah inti, dan jawaban akhir secara padat.",
        detailed: "Mode: RINCI. Berikan penjelasan Sokratik langkah-demi-langkah, eksplorasi konsep dasar, dan telaah kemungkinan salah kaprah.",
        standard: "Mode: STANDAR. Jelaskan secara berimbang antara konsep dan aplikasi."
      };

      const systemPrompt = `Kamu adalah Matrix, Asisten AI Cerdas di platform Error Pattern Engine (EPE).
Gunakan bahasa Indonesia yang santun, ramah, edukatif, dan cerdas.
${depthInstructions[depthMode] || depthInstructions.standard}
Format seluruh rumus matematika dengan KaTeX LaTeX rapi (contoh: $x^2 - 5x + 6 = 0$).

==================================================
PRINSIP PERILAKU CONTEXT ROUTING:
AI Matrix memiliki dua konteks simultan:
1. CONVERSATIONAL CONTEXT: Percakapan bebas, sains umum, astronomi, transportasi publik (MRT), rumus umum, atau pertanyaan sehari-hari.
2. APPLICATION / LEARNING CONTEXT: Latihan soal aktif di aplikasi.

ATURAN WAJIB (CONTEXT AWARENESS != CONTEXT FORCING):
- JANGAN OTOMATIS MEMAKSAKAN atau mengarahkan siswa kembali ke soal aktif jika siswa sedang bertanya tentang topik umum, sains, astronomi, transportasi, atau rumus umum. Jawab topik tersebut secara tuntas dan informatif!
- Gunakan konteks Soal Aktif HANYA JIKA siswa menanyakan jawaban mereka ('kenapa jawaban saya salah?', 'kenapa B?'), meminta petunjuk soal aktif, atau berkata 'balik ke soal tadi'.

ATURAN SAPAAN (PERCAKAPAN BERJALAN):
Ini adalah obrolan chat yang SEDANG BERLANGSUNG. JANGAN mengulang kata sapaan ('Halo!', 'Halo Siswa!', 'Hai!') atau memperkenalkan diri ('Saya Matrix...') di awal setiap respon baru! Langsung jawab ke inti pertanyaan atau topik secara natural dan mengalir.
==================================================`;

      const contents = [];
      const parts = [];

      // If image is attached (Vision analysis)
      if (image && typeof image === "string") {
        const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2]
            }
          });
        }
      }

      parts.push({
        text: `${systemPrompt}\n\nPertanyaan/Tugas Pengguna:\n${prompt || "Analisis konten matematika dalam gambar ini secara mendalam."}`
      });

      contents.push({ role: "user", parts });

      // Call Google Gemini API (Gemini 3.6 Flash / 2.5 Flash Lite)
      const modelsToTry = ["gemini-3.6-flash", "gemini-2.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
      
      for (const modelName of modelsToTry) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        const payload = {
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 4096
          }
        };

        const geminiRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await geminiRes.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          const textResponse = data.candidates[0].content.parts.map(p => p.text || "").join("\n");
          return res.status(200).json({
            success: true,
            provider: `gemini-cloud-${modelName}`,
            text: textResponse
          });
        }
      }

    } catch (err) {
      console.error("Gemini Serverless error:", err);
    }
  }

  // 2. Free Web-Connected Online AI Fallback (Zero API Key needed)
  try {
    const encodedPrompt = encodeURIComponent(
      `Kamu adalah Matrix AI (EPE Matematika). Jawab dengan ramah, cerdas, edukatif, dan sertakan rumus LaTeX KaTeX jika relevan.\n\nPertanyaan: ${prompt}`
    );
    const freeAiRes = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);
    if (freeAiRes.ok) {
      const freeText = await freeAiRes.text();
      if (freeText && freeText.trim()) {
        return res.status(200).json({
          success: true,
          provider: "web-online-ai",
          text: freeText
        });
      }
    }
  } catch (e) {
    console.warn("Free web AI fallback failed:", e);
  }

  return res.status(200).json({
    success: false,
    message: "Layanan online sedang sibuk. Silakan konfigurasikan GEMINI_API_KEY di environment server atau masukkan API key personal."
  });
}
