# EPE AI & MULTIMODAL AUDIT — Phase 0

**Tanggal Audit:** 17 September 2026
**Objektif:** Menginspeksi secara menyeluruh seluruh basis kode EPE yang ada untuk menentukan status riil setiap komponen sebelum implementasi overhaul multimodal AI.

---

## 0. CRITICAL BUG — IMAGE HALLUCINATION (ROOT CAUSE FOUND)

> [!CAUTION]
> **ROOT CAUSE IDENTIFIED:** `multimodalInputUI.js` line 392.

When a student uploads an image, the `handleImageSource()` method calls `ImagePreprocessor.preprocess()` for visual preprocessing (grayscale, binarization), but **there is NO OCR or vision model call anywhere in the pipeline.**

Instead, line 392 contains:
```javascript
const defaultText = this.targetStepsInput?.value?.trim() || "2x + 3 = 11\n2x = 8\nx = 4";
```

This means:
1. If the text input field is **empty** (which it usually is when a student uploads a photo), the system uses a **HARDCODED equation** `"2x + 3 = 11\n2x = 8\nx = 4"`.
2. This fabricated content is then passed to `HandwritingStepReconstructor.reconstruct()` and displayed as "detected mathematics".
3. The student sees the hardcoded equation presented as if the system "read" their image.

**This is not a model hallucination — it is a code-level fabrication.** The system presents pre-written content as recognized content, which is worse than hallucination because it happens deterministically and silently.

### Files Involved:
| File | Line | Issue |
|:---|:---:|:---|
| [multimodalInputUI.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/multimodalInputUI.js#L392) | 392 | Hardcoded fallback `"2x + 3 = 11\n2x = 8\nx = 4"` |
| [multimodalInputUI.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/multimodalInputUI.js#L397) | 397 | Displays hardcoded LaTeX as "detected" content |

### Consequence:
If a student uploads an image containing "Jawaban yang tepat adalah Opsi B karena x memiliki pangkat 2...", the system **ignores the entire image** and presents `2x + 3 = 11` as the recognized content.

---

## 1. COMPONENT-BY-COMPONENT AUDIT

### 1.1 Core EPE Engine (`js/engine/`)

| Component | Status | Files | Assessment |
|:---|:---:|:---|:---|
| E0–E4 Taxonomy | `IMPLEMENTED` | [taxonomy.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/engine/taxonomy.js) (80 lines) | Solid. 5-tier error classification with remediation generators. DO NOT MODIFY. |
| EPE Diagnostic Engine | `IMPLEMENTED` | [epeEngine.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/engine/epeEngine.js) (257 lines) | Accepts `studentAnswer`, `studentSteps`, `media`, `stepReconstruction`. Already has hooks for multimodal input but receives no real multimodal data. |
| Diagnostic Rules (Q1-Q24) | `IMPLEMENTED` | [diagnosticRules.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/engine/diagnosticRules.js) (1193 lines) | Comprehensive rule-based diagnostics for all 24 questions. Text-pattern matching. DO NOT MODIFY. |
| Step Analyzer | `IMPLEMENTED` | [stepAnalyzer.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/engine/stepAnalyzer.js) (145 lines) | Extracts coefficients, roots, factors, discriminant from text strings. Works but limited to regex extraction from flat text. |
| Math Solver (AI Matrix) | `PARTIAL` | [mathSolver.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/engine/mathSolver.js) (542 lines) | Quadratic/Linear deterministic solvers work. Calculus = static text. Matrix = MISSING. |

### 1.2 Multimodal Layer (`js/multimodal/`)

| Component | Status | Files | Assessment |
|:---|:---:|:---|:---|
| Image Preprocessor | `IMPLEMENTED` | [imagePreprocessor.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/imagePreprocessor.js) (182 lines) | Canvas-based grayscale, adaptive thresholding, binarization. Camera stream support via `getUserMedia`. **Works for preprocessing but produces no text output.** |
| Math Representation (AST) | `IMPLEMENTED` | [mathRepresentation.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/mathRepresentation.js) (340 lines) | Supports equation, matrix (2x2, 3x3), derivative, integral, multi-step parsing. LaTeX normalization and tokenization. Factory `fromInput()` works on TEXT input. **Not connected to any image recognition pipeline.** |
| Math Verifier | `IMPLEMENTED` | [mathVerifier.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/mathVerifier.js) (309 lines) | Deterministic verification: quadratic root substitution, matrix multiply/determinant/inverse (2x2, 3x3), polynomial differentiation, step transformation verification. **Solid implementation, but never receives real data from images.** |
| Handwriting Step Reconstructor | `IMPLEMENTED` | [handwritingStepReconstructor.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/handwritingStepReconstructor.js) (160 lines) | Parses multi-line steps, verifies algebraic transformations between consecutive lines, identifies anomalies. **Works on text input only. Name is misleading — it does NOT process handwriting images.** |
| Speech Math Parser | `IMPLEMENTED` | [speechMathParser.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/speechMathParser.js) (171 lines) | Indonesian word-to-number conversion, operator normalization, matrix/integral spoken pattern detection. Uses Web Speech API. |
| Multimodal Input UI | `BROKEN` | [multimodalInputUI.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/multimodal/multimodalInputUI.js) (457 lines) | UI for mode switching (Type/Image/Audio) with camera support. **BROKEN: Image upload pipeline produces FABRICATED content instead of actual recognition results.** |

### 1.3 AI Matrix Assistant (`js/ui/`)

| Component | Status | Files | Assessment |
|:---|:---:|:---|:---|
| AI Agent Manager | `PARTIAL` | [aiAgentManager.js](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/js/ui/aiAgentManager.js) (1783 lines) | Chat drawer, voice toggle, API key settings. Response pipeline: MathSolver → tryEvaluateMath → Cloud LLM (Gemini/OpenAI) → Knowledge Base → Pollinations → Smart Synthesizer. |
| Cloud LLM Integration | `IMPLEMENTED` | Same file, lines 450-508 | Supports Gemini 1.5 Flash and OpenAI GPT-4o-mini with user-provided API key stored in localStorage. |
| Knowledge Base (Offline) | `IMPLEMENTED` | Same file, lines 634-1323 | ~30 hardcoded encyclopedia entries in rich KaTeX Markdown. |
| Smart Synthesizer (Fallback) | `PARTIAL` | Same file, lines 1325-1618 | Pattern-matched responses for greetings, frustration, slang, hypotheticals, etc. **DEFAULT FALLBACK (line 1609-1618) produces generic response that does NOT answer the user's actual question.** This is the exact response shown in the user's complaint about "bunga majemuk". |
| Image Upload in AI Matrix | `MISSING` | — | No image upload button or handler in AI chat. |
| Audio Input in AI Matrix | `PARTIAL` | Same file, lines 156-211 | Web Speech API transcribes spoken text, sends as text message. **No mathematical speech normalization.** |
| Response Diversity | `BROKEN` | Same file | Default synthesizer always returns the same template response for unknown topics. |

### 1.4 Research & Assessment

| Component | Status | Assessment |
|:---|:---:|:---|
| Pre-Test / Post-Test | `IMPLEMENTED` | Forms A & B, 12 items each, timer, scoring, error migration analysis. |
| Research Analytics | `IMPLEMENTED` | Statistics, error shift matrices, domain accuracy. |
| Research Export | `IMPLEMENTED` | 5 CSV variants, UTF-8 BOM. Missing multimodal metadata columns. |

### 1.5 UI & Gamification — ALL `IMPLEMENTED`, DO NOT MODIFY

- Learning Cubes 3D, Avatar System, Cubic Economy, AI Orb, Theme Manager, Universe Background

### 1.6 Data & Storage

| Component | Status | Assessment |
|:---|:---:|:---|
| Questions Database (24 items) | `IMPLEMENTED` | 24 questions across D1-D6. |
| Custom Question Store | `IMPLEMENTED` | localStorage-based. |
| Supabase Integration | `PARTIAL` | Cloud save works but no offline queue, no upsert dedup, no Storage Bucket. |

---

## 2. CRITICAL CAPABILITY GAP ANALYSIS

Mapping the 48-section overhaul requirements against actual implementation:

| Requirement (Section) | Status | Gap |
|:---|:---:|:---|
| §0 Fix image hallucination | `BROKEN` | Hardcoded fallback text at line 392 |
| §3 Image grounding | `MISSING` | No vision model, no OCR |
| §4 Image content manifest | `MISSING` | No region detection |
| §5 Multi-question detection | `MISSING` | No question boundary detection |
| §6 Question-answer association | `MISSING` | No semantic structure linking |
| §7 Multimodal extraction schema | `MISSING` | No QuestionDocument structure |
| §8 Handwritten math recognition | `MISSING` | Image preprocessing exists but produces no text |
| §9 Step reconstruction from images | `PARTIAL` | Works on text; not connected to images |
| §10 Mathematical representation | `IMPLEMENTED` | MathRepresentation supports equation, matrix, calculus, steps |
| §11 Matrix support | `IMPLEMENTED` | MathVerifier has 2x2/3x3 ops |
| §12 Calculus support | `PARTIAL` | Polynomial differentiation; integration static |
| §13 Mathematical verification | `PARTIAL` | Works but never receives real multimodal data |
| §14 No hallucination policy | `BROKEN` | System fabricates content from hardcoded string |
| §15 Confidence system | `PROTOTYPE` | Single confidence number |
| §16-17 Region recognition & full image | `MISSING` | No image segmentation |
| §18 Answer type detection | `MISSING` | All forced to equation format |
| §19 Student explanation analysis | `MISSING` | No semantic analysis |
| §20 EPE diagnostic integration | `PARTIAL` | Hooks exist, no multimodal data flows in |
| §21 Diagnostic mode image input | `MISSING` | Multimodal UI only in Practice Bank |
| §22-25 Practice Bank multi-question | `MISSING` | No extraction/preview/review workflow |
| §26 AI Matrix image upload | `MISSING` | No image input in chat |
| §27 AI response diversity | `BROKEN` | Same generic template for unknown queries |
| §28-29 Reasoning style & depth | `PARTIAL/MISSING` | Socratic in LLM prompt; no depth modes |
| §30-32 Domain/Model/Provider | `MISSING` | No routing, no abstraction |
| §33-34 Error evidence & research | `PARTIAL` | Text evidence; no multimodal layer |
| §35 Image quality check | `MISSING` | Only low-res flag |
| §36 Audio input | `PARTIAL` | Exists but not connected |
| §37-38 Security & Privacy | `PARTIAL` | No file validation, no size limits |
| §39-40 Performance & Validity | `MISSING` | No progress indicators, no AI/verified separation |
| §41-42 Test dataset & regression | `MISSING` | None |
| §43-44 Review gate & Observability | `MISSING` | None |
| §45 Fallback | `BROKEN` | Fabricates instead of showing "unknown" |

---

## 3. SECURITY FINDINGS

| Finding | Severity | Location |
|:---|:---:|:---|
| No file upload validation (size/type) | HIGH | multimodalInputUI.js line 90 |
| API key sent directly from browser | MEDIUM | aiAgentManager.js lines 467-508 |
| User API keys in localStorage | MEDIUM | aiAgentManager.js line 24 |
| Supabase publishable key in frontend | LOW | supabaseClient.js line 9 (designed for frontend use) |

---

## 4. SUMMARY VERDICT

The EPE codebase has a **strong pedagogical core** (engine, taxonomy, diagnostic rules, gamification) but its **multimodal layer is fundamentally broken**. The most critical issue is the system actively **fabricating mathematical content** from a hardcoded string and presenting it as recognized from student images.

The multimodal modules (`mathRepresentation.js`, `mathVerifier.js`, `handwritingStepReconstructor.js`, `speechMathParser.js`) are well-architected and functional as individual components. However, they form a **disconnected pipeline** — there is no vision/OCR component to bridge between image input and these processing modules.

**Priority Order:**
1. **IMMEDIATE:** Fix the fabrication bug (remove hardcoded fallback, show "unrecognized" state)
2. **HIGH:** Implement vision-grounded image analysis pipeline (using AI vision model)
3. **HIGH:** Connect vision output → MathRepresentation → MathVerifier → EPE Engine
4. **MEDIUM:** Add image upload to AI Matrix, improve response diversity
5. **MEDIUM:** Multi-question document extraction and researcher review gate
6. **LOWER:** Audio improvements, provider abstraction, observability
