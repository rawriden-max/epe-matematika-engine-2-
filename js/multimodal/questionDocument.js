/**
 * questionDocument.js - Multi-Question Document Extraction (EPE V3)
 * 
 * Represents a structured extraction from an image containing one or more
 * mathematical questions. Produced by VisionProvider from worksheet images.
 * 
 * Supports:
 * - Single question images (student work)
 * - Multi-question worksheets (teacher uploads)
 * - Answer key extraction
 * - Student response association (multiple choice, written, step-by-step)
 */

import { AnswerTypeDetector } from "./answerTypeDetector.js";
export { AnswerTypeDetector };

export class QuestionDocument {
  /**
   * Create a new QuestionDocument
   * @param {Object} params
   */
  constructor({
    documentId = "",
    sourceImageId = "",
    documentType = "student_work",
    questions = [],
    answerKey = null,
    extractionConfidence = {},
    metadata = {}
  } = {}) {
    this.documentId = documentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.sourceImageId = sourceImageId;
    this.documentType = documentType; // "student_work" | "worksheet" | "answer_key" | "mixed"
    this.questions = questions.map(q => q instanceof ExtractedQuestion ? q : new ExtractedQuestion(q));
    this.answerKey = answerKey;
    this.extractionConfidence = {
      overall: extractionConfidence.overall || 0,
      structural: extractionConfidence.structural || 0,
      mathematical: extractionConfidence.mathematical || 0
    };
    this.metadata = {
      extractedAt: new Date().toISOString(),
      questionCount: this.questions.length,
      ...metadata
    };
  }

  /**
   * Factory: Create from ImageContentManifest
   * @param {import('./imageContentManifest.js').ImageContentManifest} manifest
   * @returns {QuestionDocument}
   */
  static fromManifest(manifest) {
    if (!manifest || !manifest.hasContent()) {
      return new QuestionDocument({
        sourceImageId: manifest?.imageId || "",
        documentType: "unknown",
        questions: [],
        extractionConfidence: { overall: 0 }
      });
    }

    const questions = (manifest.questions || []).map((q, idx) => new ExtractedQuestion({
      questionNumber: q.questionNumber || (idx + 1),
      questionText: q.questionText || "",
      mathematicalExpressions: q.mathematicalObjects || [],
      answerOptions: (q.options || []).map(o => ({
        id: o.id || String.fromCharCode(65 + idx),
        text: o.text || ""
      })),
      studentResponse: q.studentResponse ? {
        type: q.studentResponse.type || "unknown",
        selectedOption: q.studentResponse.selectedOption || null,
        writtenAnswer: q.studentResponse.writtenAnswer || null
      } : null,
      studentWork: q.studentWork ? {
        type: q.studentWork.type || "text",
        content: q.studentWork.content || null,
        steps: q.studentWork.steps || null
      } : null,
      studentExplanation: q.studentExplanation || null,
      sourceRegions: [],
      confidence: {
        overall: q.confidence || manifest.overallConfidence || 0.5
      }
    }));

    // If no explicit questions found in manifest but there are content regions,
    // create a single question from content regions
    if (questions.length === 0 && manifest.regions.length > 0) {
      const studentWorkRegions = manifest.getRegionsByType("student_work");
      const studentAnswerRegions = manifest.getRegionsByType("student_answer");
      const explanationRegions = manifest.getRegionsByType("explanation");
      const formulaRegions = manifest.getRegionsByType("formula");

      const allContent = [
        ...studentWorkRegions,
        ...studentAnswerRegions,
        ...formulaRegions,
        ...explanationRegions
      ];

      if (allContent.length > 0) {
        questions.push(new ExtractedQuestion({
          questionNumber: 1,
          questionText: manifest.getRegionsByType("question").map(r => r.content).join(" "),
          mathematicalExpressions: allContent.filter(r => r.latex).map(r => r.latex),
          studentResponse: {
            type: AnswerTypeDetector.detectFromContent(allContent.map(r => r.content).join("\n")),
            selectedOption: null,
            writtenAnswer: allContent.map(r => r.content).join("\n")
          },
          studentWork: {
            type: "text",
            content: allContent.map(r => r.content).join("\n"),
            steps: null
          },
          confidence: { overall: manifest.overallConfidence }
        }));
      }
    }

    return new QuestionDocument({
      sourceImageId: manifest.imageId,
      documentType: manifest.documentType || "student_work",
      questions,
      extractionConfidence: {
        overall: manifest.overallConfidence,
        structural: manifest.overallConfidence,
        mathematical: manifest.overallConfidence
      }
    });
  }

  /**
   * Get the first (or only) question
   * @returns {ExtractedQuestion|null}
   */
  getFirstQuestion() {
    return this.questions.length > 0 ? this.questions[0] : null;
  }

  /**
   * Get all student responses as flat text for EPE Engine
   * @returns {string}
   */
  getAllStudentText() {
    return this.questions
      .map(q => {
        const parts = [];
        if (q.studentResponse?.selectedOption) parts.push(q.studentResponse.selectedOption);
        if (q.studentResponse?.writtenAnswer) parts.push(q.studentResponse.writtenAnswer);
        if (q.studentWork?.content) parts.push(q.studentWork.content);
        if (q.studentExplanation) parts.push(q.studentExplanation);
        return parts.join("\n");
      })
      .filter(t => t.trim())
      .join("\n\n");
  }

  /**
   * Check if this document contains multiple questions
   * @returns {boolean}
   */
  isMultiQuestion() {
    return this.questions.length > 1;
  }
}


/**
 * Represents a single extracted question from an image
 */
export class ExtractedQuestion {
  constructor({
    questionNumber = 0,
    questionText = "",
    mathematicalExpressions = [],
    answerOptions = [],
    studentResponse = null,
    studentWork = null,
    studentExplanation = null,
    sourceRegions = [],
    confidence = {}
  } = {}) {
    this.questionNumber = questionNumber;
    this.questionText = questionText;
    this.mathematicalExpressions = mathematicalExpressions;
    this.answerOptions = answerOptions; // [{ id: "A", text: "..." }]
    this.studentResponse = studentResponse; // { type, selectedOption, writtenAnswer }
    this.studentWork = studentWork; // { type, content, steps }
    this.studentExplanation = studentExplanation;
    this.sourceRegions = sourceRegions;
    this.confidence = {
      overall: confidence.overall || 0.5,
      textExtraction: confidence.textExtraction || confidence.overall || 0.5,
      mathParsing: confidence.mathParsing || confidence.overall || 0.5
    };
  }

  /**
   * Get the student's answer as text (for EPE Engine input)
   * @returns {string}
   */
  getStudentAnswerText() {
    if (this.studentResponse?.selectedOption) {
      return this.studentResponse.selectedOption;
    }
    if (this.studentResponse?.writtenAnswer) {
      return this.studentResponse.writtenAnswer;
    }
    return "";
  }

  /**
   * Get the student's work/steps as text (for EPE Engine input)
   * @returns {string}
   */
  getStudentStepsText() {
    if (this.studentWork?.steps && Array.isArray(this.studentWork.steps)) {
      return this.studentWork.steps.join("\n");
    }
    if (this.studentWork?.content) {
      return this.studentWork.content;
    }
    if (this.studentExplanation) {
      return this.studentExplanation;
    }
    return "";
  }

  /**
   * Check if this question has a student response
   * @returns {boolean}
   */
  hasStudentResponse() {
    return !!(
      this.studentResponse?.selectedOption ||
      this.studentResponse?.writtenAnswer ||
      this.studentWork?.content
    );
  }
}

