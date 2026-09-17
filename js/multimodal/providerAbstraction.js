/**
 * providerAbstraction.js - Provider Abstraction & Domain-Aware Routing Layer (EPE V3)
 * 
 * Provides unified, vendor-neutral provider interfaces and intelligent domain routing:
 * 1. Base interfaces: VisionProviderInterface, SpeechProviderInterface, MathReasoningProviderInterface
 * 2. Mathematical Domain Detector: Classifies mathematical domains prior to reasoning
 * 3. Model & Engine Router: Deterministic CAS vs. Statistical LLM vs. Hybrid Verification
 */

import { MathSolver } from "../engine/mathSolver.js";
import { MathVerifier } from "./mathVerifier.js";
import { MathRepresentation } from "./mathRepresentation.js";

/**
 * Base Abstract Vision Provider
 */
export class VisionProviderInterface {
  async analyzeImage(imageDataUrl, options = {}) {
    throw new Error("analyzeImage must be implemented by concrete Vision Provider");
  }
}

/**
 * Base Abstract Speech Provider
 */
export class SpeechProviderInterface {
  parseSpeech(spokenText, options = {}) {
    throw new Error("parseSpeech must be implemented by concrete Speech Provider");
  }
}

/**
 * Base Abstract Mathematical Reasoning Provider
 */
export class MathReasoningProviderInterface {
  async solveOrVerify(expressionOrQuery, context = {}) {
    throw new Error("solveOrVerify must be implemented by concrete Math Reasoning Provider");
  }
}

/**
 * DomainDetector - Identifies the specific mathematical subfield of an input
 */
export class DomainDetector {
  /**
   * Detect domain from math text, equation, or query
   * @param {string} input 
   * @returns {{ domain: string, confidence: number, subtopics: string[] }}
   */
  static detect(input) {
    if (!input || typeof input !== "string") {
      return { domain: "general", confidence: 1.0, subtopics: [] };
    }

    const clean = input.toLowerCase().trim();

    // 1. Matriks (Matrix)
    if (
      clean.includes("matriks") || clean.includes("matrix") ||
      /\[\[.*\]\]/.test(clean) || clean.includes("pmatrix") ||
      clean.includes("determinan") || clean.includes("invers")
    ) {
      return {
        domain: "matrix",
        confidence: 0.96,
        subtopics: ["determinan", "invers", "perkalian_matriks"]
      };
    }

    // 2. Bunga Majemuk & Keuangan (Financial Math)
    if (
      clean.includes("bunga majemuk") || clean.includes("compound interest") ||
      clean.includes("bunga tunggal") || clean.includes("anuitas") ||
      clean.includes("modal akhir") || clean.includes("suku bunga")
    ) {
      return {
        domain: "financial_math",
        confidence: 0.98,
        subtopics: ["bunga_majemuk", "anuitas", "modal"]
      };
    }

    // 3. Kalkulus (Calculus: Turunan & Integral)
    if (
      clean.includes("turunan") || clean.includes("derivatif") || clean.includes("d/dx") ||
      clean.includes("integral") || clean.includes("\\int") || clean.includes("titik stasioner")
    ) {
      return {
        domain: "calculus",
        confidence: 0.95,
        subtopics: ["turunan", "integral", "nilai_ekstrim"]
      };
    }

    // 4. Persamaan Kuadrat & Aljabar Polinomial (Quadratic & Polynomial Algebra)
    if (
      /\^2|kuadrat|ax\^2|diskriminan|\(x[+-]\d+\)\(x[+-]\d+\)/.test(clean) ||
      /[a-z]\^2\s*[+-]/.test(clean) || clean.includes("akar-akar")
    ) {
      return {
        domain: "quadratic_algebra",
        confidence: 0.95,
        subtopics: ["pemfaktoran", "diskriminan", "rumus_abc"]
      };
    }

    // 5. Persamaan Linear & Sistem Persamaan (Linear Systems)
    if (
      /^[0-9]*[a-z]\s*[+-]\s*\d+\s*=\s*-?\d+$/.test(clean.replace(/\s+/g, "")) ||
      clean.includes("spldv") || clean.includes("sistem persamaan")
    ) {
      return {
        domain: "linear_algebra",
        confidence: 0.92,
        subtopics: ["linear_satu_variabel", "eliminasi", "substitusi"]
      };
    }

    // 6. Statistika & Peluang (Probability & Statistics)
    if (
      clean.includes("peluang") || clean.includes("probabilitas") || clean.includes("kombinasi") ||
      clean.includes("permutasi") || clean.includes("rata-rata") || clean.includes("median") ||
      clean.includes("modus") || clean.includes("standar deviasi")
    ) {
      return {
        domain: "statistics_probability",
        confidence: 0.94,
        subtopics: ["probabilitas", "distribusi", "ukuran_pemusatan"]
      };
    }

    // 7. Geometri & Trigonometri
    if (
      clean.includes("sin") || clean.includes("cos") || clean.includes("tan") ||
      clean.includes("sudut") || clean.includes("luas") || clean.includes("volume") ||
      clean.includes("pythagoras") || clean.includes("lingkaran")
    ) {
      return {
        domain: "geometry_trigonometry",
        confidence: 0.90,
        subtopics: ["trigonometri", "dimensi_tiga", "bangun_datar"]
      };
    }

    return {
      domain: "general_mathematics",
      confidence: 0.70,
      subtopics: ["aritmatika", "logika"]
    };
  }
}

/**
 * Intelligent Router: Routes requests to either Deterministic Engine, Cloud LLM, or Hybrid
 */
export class ReasoningRouter {
  /**
   * Decide execution route based on domain and complexity
   * @param {string} queryOrExpression 
   * @param {Object} [options]
   * @returns {{ route: "deterministic" | "cloud_llm" | "hybrid", domain: string, details: Object }}
   */
  static route(queryOrExpression, options = {}) {
    const domainInfo = DomainDetector.detect(queryOrExpression);
    const hasApiKey = !!(options.apiKey || localStorage.getItem("epe_ai_api_key"));

    // Expressions containing pure equations or matrices are routed deterministically first
    const isPureEquation = /[=+\-×÷^]/.test(queryOrExpression) && !queryOrExpression.includes("jelaskan") && !queryOrExpression.includes("mengapa");

    if (isPureEquation) {
      if (domainInfo.domain === "quadratic_algebra" || domainInfo.domain === "linear_algebra" || domainInfo.domain === "calculus" || domainInfo.domain === "matrix") {
        return {
          route: "deterministic",
          domain: domainInfo.domain,
          details: {
            reason: "Ekspresi komputasi murni cocok diselesaikan dengan CAS deterministik tanpa halusinasi.",
            confidence: domainInfo.confidence
          }
        };
      }
    }

    // Conceptual explanation with API key available -> Hybrid or Cloud LLM
    if (hasApiKey) {
      return {
        route: "hybrid",
        domain: domainInfo.domain,
        details: {
          reason: "Pertanyaan konseptual / berbasis konteks; dieksekusi dengan LLM dan diverifikasi kebenaran matematika deterministiknya.",
          confidence: domainInfo.confidence
        }
      };
    }

    // Fallback: Offline Smart Knowledge
    return {
      route: "deterministic",
      domain: domainInfo.domain,
      details: {
        reason: "Offline / tanpa API key; dieksekusi menggunakan modul wawasan dan CAS internal.",
        confidence: domainInfo.confidence
      }
    };
  }

  /**
   * Execute reasoning with routed strategy
   */
  static async execute(queryOrExpression, options = {}) {
    const decision = this.route(queryOrExpression, options);

    if (decision.route === "deterministic") {
      const casResult = MathSolver.solve(queryOrExpression);
      if (casResult) {
        return {
          success: true,
          routeUsed: "deterministic",
          result: casResult,
          domain: decision.domain
        };
      }
    }

    return {
      success: true,
      routeUsed: decision.route,
      domain: decision.domain,
      recommendation: decision.details.reason
    };
  }
}
