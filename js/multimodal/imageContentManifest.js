/**
 * imageContentManifest.js - Structured Image Content Representation (EPE V3)
 * 
 * Represents everything detected in an uploaded image as a structured manifest.
 * This is the canonical output of VisionProvider and the input to downstream
 * processing (MathRepresentation, HandwritingStepReconstructor, EPE Engine).
 * 
 * NEVER contains fabricated content — only what is visually present in the image
 * or explicitly marked as "ambiguous"/"unrecognized".
 */

export class ImageContentManifest {
  /**
   * Create a new ImageContentManifest
   * @param {Object} params
   */
  constructor({
    imageId = "",
    provider = "unknown",
    documentType = "unknown",
    language = "id",
    regions = [],
    questions = [],
    overallConfidence = 0,
    ambiguityFlags = [],
    status = "unrecognized",
    errorMessage = null,
    timestamp = null
  } = {}) {
    this.imageId = imageId || `img_${Date.now()}`;
    this.provider = provider;
    this.documentType = documentType;
    this.language = language;
    this.regions = regions;
    this.questions = questions;
    this.overallConfidence = Math.max(0, Math.min(1, overallConfidence));
    this.ambiguityFlags = ambiguityFlags;
    this.status = status; // "analyzed" | "unrecognized" | "unavailable" | "error"
    this.errorMessage = errorMessage;
    this.timestamp = timestamp || new Date().toISOString();
  }

  /**
   * Create a manifest indicating vision analysis is unavailable
   * @param {string} reason
   * @returns {ImageContentManifest}
   */
  static createUnavailable(reason) {
    return new ImageContentManifest({
      status: "unavailable",
      errorMessage: reason,
      overallConfidence: 0,
      documentType: "unknown"
    });
  }

  /**
   * Create a manifest indicating an error occurred
   * @param {string} message
   * @param {Error} [error]
   * @returns {ImageContentManifest}
   */
  static createError(message, error = null) {
    return new ImageContentManifest({
      status: "error",
      errorMessage: message,
      overallConfidence: 0,
      documentType: "unknown"
    });
  }

  /**
   * Create a manifest from raw text when JSON parsing fails
   * @param {string} rawText
   * @param {string} provider
   * @returns {ImageContentManifest}
   */
  static createFromRawText(rawText, provider) {
    // Try to extract useful content from non-JSON response
    const cleanText = (rawText || "").trim();
    if (!cleanText) {
      return ImageContentManifest.createError("Vision model returned empty response.");
    }

    return new ImageContentManifest({
      imageId: `img_${Date.now()}`,
      provider,
      documentType: "unknown",
      regions: [{
        regionId: "r1",
        type: "student_work",
        content: cleanText,
        latex: null,
        confidence: 0.5
      }],
      questions: [],
      overallConfidence: 0.4,
      ambiguityFlags: ["Response was not in expected JSON format; raw text extracted."],
      status: "analyzed"
    });
  }

  /**
   * Check if this manifest has usable recognized content
   * @returns {boolean}
   */
  hasContent() {
    return this.status === "analyzed" && (this.regions.length > 0 || this.questions.length > 0);
  }

  /**
   * Check if vision analysis is not available or failed
   * @returns {boolean}
   */
  isUnavailableOrError() {
    return this.status === "unavailable" || this.status === "error";
  }

  /**
   * Get all text content from recognized regions
   * @returns {string}
   */
  getAllText() {
    return this.regions
      .map(r => r.content)
      .filter(c => c && c.trim())
      .join("\n");
  }

  /**
   * Get all LaTeX content from recognized regions
   * @returns {string}
   */
  getAllLatex() {
    return this.regions
      .filter(r => r.latex)
      .map(r => r.latex)
      .join(" \\\\ ");
  }

  /**
   * Get regions of a specific type
   * @param {string} type
   * @returns {Array}
   */
  getRegionsByType(type) {
    return this.regions.filter(r => r.type === type);
  }

  /**
   * Convert manifest to normalized text suitable for MathRepresentation / EPE
   * @returns {{ raw: string, latex: string, hasStudentAnswer: boolean, hasStudentWork: boolean, hasExplanation: boolean }}
   */
  toNormalizedText() {
    const studentAnswerRegions = this.getRegionsByType("student_answer");
    const studentWorkRegions = this.getRegionsByType("student_work");
    const explanationRegions = this.getRegionsByType("explanation");
    const formulaRegions = this.getRegionsByType("formula");

    // Compile raw text from all content-bearing regions
    const allContentRegions = [
      ...studentWorkRegions,
      ...studentAnswerRegions,
      ...formulaRegions,
      ...explanationRegions
    ];

    const raw = allContentRegions
      .map(r => r.content)
      .filter(c => c && c.trim())
      .join("\n");

    const latex = allContentRegions
      .filter(r => r.latex)
      .map(r => r.latex)
      .join(" \\\\ ") || raw;

    // Also check questions array for student responses
    let fromQuestions = "";
    if (this.questions.length > 0) {
      for (const q of this.questions) {
        if (q.studentResponse?.writtenAnswer) {
          fromQuestions += q.studentResponse.writtenAnswer + "\n";
        }
        if (q.studentWork?.content) {
          fromQuestions += q.studentWork.content + "\n";
        }
        if (q.studentExplanation) {
          fromQuestions += q.studentExplanation + "\n";
        }
      }
    }

    const combinedRaw = (raw + "\n" + fromQuestions).trim();

    return {
      raw: combinedRaw || this.getAllText(),
      latex: latex || combinedRaw || this.getAllText(),
      hasStudentAnswer: studentAnswerRegions.length > 0 || this.questions.some(q => q.studentResponse),
      hasStudentWork: studentWorkRegions.length > 0 || this.questions.some(q => q.studentWork),
      hasExplanation: explanationRegions.length > 0 || this.questions.some(q => q.studentExplanation)
    };
  }

  /**
   * Get overall confidence state
   * @returns {"VERIFIED"|"HIGH_CONFIDENCE"|"NEEDS_CONFIRMATION"|"AMBIGUOUS"|"UNSUPPORTED"|"UNAVAILABLE"}
   */
  getConfidenceState() {
    if (this.status === "unavailable" || this.status === "error") return "UNAVAILABLE";
    if (this.status === "unrecognized") return "UNSUPPORTED";
    if (this.overallConfidence >= 0.90 && this.ambiguityFlags.length === 0) return "HIGH_CONFIDENCE";
    if (this.overallConfidence >= 0.70) return "NEEDS_CONFIRMATION";
    return "AMBIGUOUS";
  }
}
