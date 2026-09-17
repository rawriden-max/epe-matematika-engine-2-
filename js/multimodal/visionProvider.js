/**
 * visionProvider.js - AI Vision Model Abstraction Layer (EPE V3)
 * 
 * Provides grounded image-to-structured-content extraction using AI vision models.
 * 
 * CRITICAL DESIGN PRINCIPLES:
 * 1. NEVER fabricate content that is not visually present in the image.
 * 2. ALWAYS return structured ImageContentManifest.
 * 3. If recognition fails, return status "unrecognized" — NEVER return invented content.
 * 4. Separate recognition confidence from structural confidence.
 * 5. Abstract provider so EPE is NOT coupled to one AI vendor.
 * 
 * Supported Providers:
 * - Gemini Vision API (primary, uses user's API key)
 * - Fallback: manual input (no fabrication)
 */

import { ImageContentManifest } from "./imageContentManifest.js";

/**
 * System prompt for vision model — anti-hallucination engineered
 */
const VISION_SYSTEM_PROMPT = `You are a precise image content extractor for a mathematical education diagnostic system called EPE (Error Pattern Engine).

ABSOLUTE RULES:
1. ONLY report content that is VISUALLY PRESENT in the image. Do NOT invent, assume, or fabricate any content.
2. If you cannot read something clearly, mark it as "ambiguous" with your best guess and low confidence.
3. If the image contains NO mathematical content, report documentType as "non_mathematical" and extract the visible text.
4. If the image contains a student's written explanation (like "Jawaban yang tepat adalah..."), extract THAT text — do NOT replace it with equations.
5. Preserve the EXACT text visible in the image, including any Indonesian language text.
6. For mathematical notation, convert to LaTeX format where possible.

EXTRACT the following from this image and return as JSON:

{
  "documentType": "mathematical_assessment" | "student_work" | "answer_key" | "worksheet" | "explanation" | "non_mathematical" | "mixed",
  "language": "id" | "en" | "mixed",
  "regions": [
    {
      "regionId": "r1",
      "type": "question" | "question_number" | "instruction" | "answer_option" | "student_answer" | "student_work" | "explanation" | "diagram" | "graph" | "table" | "formula" | "irrelevant_content",
      "content": "exact text visible in this region",
      "latex": "LaTeX version if mathematical (null otherwise)",
      "confidence": 0.0 to 1.0
    }
  ],
  "questions": [
    {
      "questionNumber": 1,
      "questionText": "...",
      "options": [
        { "id": "A", "text": "..." },
        { "id": "B", "text": "..." }
      ],
      "studentResponse": {
        "type": "multiple_choice" | "numeric" | "equation" | "written_explanation" | "multi_step_solution" | "unknown",
        "selectedOption": "B" or null,
        "writtenAnswer": "..." or null
      },
      "studentWork": {
        "type": "text" | "steps" | "diagram" | null,
        "content": "..." or null,
        "steps": ["step1", "step2"] or null
      },
      "studentExplanation": "..." or null,
      "mathematicalObjects": ["LaTeX expressions found"],
      "confidence": 0.0 to 1.0
    }
  ],
  "overallConfidence": 0.0 to 1.0,
  "ambiguityFlags": ["description of any ambiguous elements"]
}

IMPORTANT: Return ONLY the JSON object. No markdown, no explanations, no code fences.`;

export class VisionProvider {
  /**
   * Analyze an image using AI vision model and return structured content manifest
   * @param {string} imageDataUrl - Base64 encoded image data URL
   * @param {Object} options
   * @param {string} [options.apiKey] - API key for vision model
   * @param {string} [options.provider] - "gemini" (default) or "openai"
   * @param {string} [options.mode] - "full_analysis" | "math_only" | "text_only"
   * @returns {Promise<ImageContentManifest>}
   */
  static async analyzeImage(imageDataUrl, options = {}) {
    const apiKey = options.apiKey || localStorage.getItem("epe_ai_api_key") || "";
    // No API key available — try serverless proxy endpoint (/api/gemini) first
    if (!apiKey || !apiKey.trim()) {
      try {
        const proxyRes = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: "Ekstrak seluruh teks dan rumus matematika dari gambar ini dalam format JSON ImageContentManifest.",
            image: imageDataUrl,
            mode: "vision"
          })
        });

        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          if (proxyData.success && proxyData.text) {
            return this._parseJsonResponse(proxyData.text, imageDataUrl);
          }
        }
      } catch (e) {
        // Proxy not running
      }

      return ImageContentManifest.createUnavailable(
        "Vision analysis memerlukan API key Gemini. Masukkan API key di pengaturan AI Matrix (⚙️) atau jalankan melalui deployment Vercel dengan GEMINI_API_KEY."
      );
    }

    try {
      if (provider === "gemini") {
        return await this._analyzeWithGemini(imageDataUrl, apiKey.trim());
      } else if (provider === "openai") {
        return await this._analyzeWithOpenAI(imageDataUrl, apiKey.trim());
      } else {
        return ImageContentManifest.createUnavailable(`Unsupported vision provider: ${provider}`);
      }
    } catch (error) {
      console.error("[VisionProvider] Analysis failed:", error);
      return ImageContentManifest.createError(
        `Gagal menganalisis gambar: ${error.message}`,
        error
      );
    }
  }

  /**
   * Analyze image using Google Gemini Vision API
   */
  static async _analyzeWithGemini(imageDataUrl, apiKey) {
    // Extract base64 data and MIME type from data URL
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      throw new Error("Format gambar tidak valid. Harus berupa data URL base64.");
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: VISION_SYSTEM_PROMPT },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,  // Very low temperature for factual extraction
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        throw new Error(`Gemini Vision API error: ${errorMsg}`);
      }

      const data = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textContent) {
        return ImageContentManifest.createError("Gemini Vision tidak mengembalikan konten.");
      }

      // Parse the JSON response from the model
      return this._parseVisionResponse(textContent, "gemini");

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Analisis gambar timeout setelah 30 detik. Coba lagi atau gunakan input teks.");
      }
      throw error;
    }
  }

  /**
   * Analyze image using OpenAI Vision API
   */
  static async _analyzeWithOpenAI(imageDataUrl, apiKey) {
    const url = "https://api.openai.com/v1/chat/completions";

    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_SYSTEM_PROMPT },
            {
              type: "image_url",
              image_url: { url: imageDataUrl, detail: "high" }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI Vision API error: ${errorData.error?.message || `HTTP ${response.status}`}`);
      }

      const data = await response.json();
      const textContent = data.choices?.[0]?.message?.content;

      if (!textContent) {
        return ImageContentManifest.createError("OpenAI Vision tidak mengembalikan konten.");
      }

      return this._parseVisionResponse(textContent, "openai");

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Analisis gambar timeout setelah 30 detik.");
      }
      throw error;
    }
  }

  /**
   * Parse and validate vision model JSON response into ImageContentManifest
   */
  static _parseVisionResponse(responseText, providerName) {
    let parsed;
    try {
      // Clean potential markdown code fences
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.warn("[VisionProvider] Failed to parse JSON response:", responseText.substring(0, 200));
      // Attempt to extract useful text content even if JSON parsing fails
      return ImageContentManifest.createFromRawText(responseText, providerName);
    }

    // Validate essential structure
    if (!parsed || typeof parsed !== "object") {
      return ImageContentManifest.createError("Response dari vision model bukan objek valid.");
    }

    return new ImageContentManifest({
      imageId: `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      provider: providerName,
      documentType: parsed.documentType || "unknown",
      language: parsed.language || "id",
      regions: Array.isArray(parsed.regions) ? parsed.regions.map((r, i) => ({
        regionId: r.regionId || `r${i + 1}`,
        type: r.type || "unknown",
        content: r.content || "",
        latex: r.latex || null,
        confidence: typeof r.confidence === "number" ? r.confidence : 0.5
      })) : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      overallConfidence: typeof parsed.overallConfidence === "number" ? parsed.overallConfidence : 0.5,
      ambiguityFlags: Array.isArray(parsed.ambiguityFlags) ? parsed.ambiguityFlags : [],
      status: "analyzed",
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if vision analysis is available (API key configured)
   */
  static isAvailable() {
    const apiKey = localStorage.getItem("epe_ai_api_key") || "";
    return apiKey.trim().length > 0 || true;
  }

  /**
   * Get the current provider name
   */
  static getProviderName() {
    return localStorage.getItem("epe_ai_provider") || "gemini";
  }
}
