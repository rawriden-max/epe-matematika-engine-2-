# EPE MULTIMODAL ARCHITECTURE — Target Design

**Tanggal:** 17 September 2026
**Status:** Proposed Architecture (Post-Audit)
**Prerequisite:** [EPE_AI_AUDIT.md](file:///c:/Users/Mr.%20Ilyas/.gemini/antigravity-ide/scratch/epe-matematika/EPE_AI_AUDIT.md)

---

## 1. CURRENT vs TARGET ARCHITECTURE

### Current State (BROKEN)

```
Student uploads image
        ↓
ImagePreprocessor.preprocess()  ← Canvas binarization (works)
        ↓
HARDCODED STRING "2x + 3 = 11"  ← BUG: fabricated content
        ↓
HandwritingStepReconstructor    ← processes fabricated text
        ↓
Show "detected" formula         ← presents fabrication as recognition
```

### Target State (Proposed)

```
                    STUDENT / RESEARCHER
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
            TEXT          IMAGE          AUDIO
              │             │             │
              │    ImagePreprocessor      │
              │    (quality check)        │
              │             ↓        SpeechMathParser
              │    VisionProvider         │
              │    (AI vision model)      │
              │             ↓             │
              │    ImageContentManifest   │
              │    (regions, types)       │
              │             ↓             │
              └─────────────┼─────────────┘
                            ↓
              MULTIMODAL UNDERSTANDING LAYER
              (text normalization, extraction)
                            ↓
                  QuestionDocument
                  (structured extraction)
                            ↓
                  MathRepresentation → AST
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
        AI REASONING              DETERMINISTIC
        (LLM for semantics)         VERIFIER
              │                   (MathVerifier)
              └─────────────┬─────────────┘
                            ↓
                   STEP ANALYSIS
                   (HandwritingStepReconstructor)
                            ↓
                   ERROR EVIDENCE
                   (with source regions)
                            ↓
                   EPE ENGINE
                   (ErrorPatternEngine)
                            ↓
                      E0 – E4
                            ↓
                   REMEDIATION
```

---

## 2. NEW MODULES REQUIRED

### 2.1 VisionProvider (`js/multimodal/visionProvider.js`) [NEW]

**Purpose:** Abstract interface for image-to-text extraction using AI vision models.

**Design:**
```javascript
export class VisionProvider {
  /**
   * Extract structured content from an image
   * @param {string} imageDataUrl - Base64 image
   * @param {Object} options - { mode: 'full_analysis' | 'math_only' | 'text_only' }
   * @returns {Promise<ImageContentManifest>}
   */
  static async analyzeImage(imageDataUrl, options = {}) { ... }
}
```

**Implementation Strategy:**
- Primary: Use Gemini Vision API (user-provided API key, already in system)
- Fallback: Show raw image + manual text input
- The prompt must instruct the model to:
  1. Describe what is visually present
  2. Extract ALL text verbatim
  3. Identify mathematical notation
  4. Identify question boundaries
  5. Identify answer regions
  6. Return structured JSON

**Anti-Hallucination Prompt Design:**
```
You are an image content extractor for a mathematical education system.

RULES:
1. ONLY report content that is VISUALLY PRESENT in the image.
2. NEVER invent, assume, or fabricate mathematical content.
3. If text is unclear or ambiguous, report it as "ambiguous" with your best guess.
4. If no mathematical content is found, report type as "non_mathematical".
5. Return ONLY the structured JSON response.

EXTRACT the following from this image:
- All visible text (verbatim)
- Mathematical expressions (in LaTeX)
- Question numbers and boundaries
- Answer options (A, B, C, D)
- Student's selected answer
- Student's written explanation or work
- Diagrams or graphs (describe)

Response format: { regions: [...], documentType: "...", questions: [...] }
```

### 2.2 ImageContentManifest (`js/multimodal/imageContentManifest.js`) [NEW]

**Purpose:** Structured representation of everything detected in an image.

```javascript
export class ImageContentManifest {
  constructor({
    imageId,
    dimensions,
    qualityAssessment,
    regions = [],
    documentType = 'unknown',
    questions = [],
    confidence = {}
  }) { ... }
}
```

**Region types:**
- `question` / `question_number` / `instruction`
- `answer_option` / `student_answer` / `student_work`
- `explanation` / `diagram` / `graph` / `table`
- `formula` / `irrelevant_content`

### 2.3 QuestionDocument (`js/multimodal/questionDocument.js`) [NEW]

**Purpose:** Multi-question extraction from a single image.

```javascript
export class QuestionDocument {
  constructor({
    documentId,
    sourceImageId,
    questions = [], // Array of ExtractedQuestion
    answerKey = null,
    extractionConfidence = {}
  }) { ... }
}

export class ExtractedQuestion {
  constructor({
    questionNumber,
    questionText,
    mathematicalExpressions = [],
    answerOptions = [],
    studentResponse = null, // { type, selectedOption, writtenAnswer }
    studentWork = null,     // { type, content, steps }
    studentExplanation = null,
    sourceRegions = [],
    confidence = {}
  }) { ... }
}
```

### 2.4 AnswerTypeDetector (`js/multimodal/answerTypeDetector.js`) [NEW]

**Purpose:** Classify the type of student answer.

**Detected types:**
- `multiple_choice` — student selected A/B/C/D
- `numeric` — single number answer
- `equation` — algebraic equation
- `expression` — mathematical expression
- `matrix` — matrix answer
- `multi_step_solution` — step-by-step work
- `written_explanation` — text explanation
- `diagram` / `graph`
- `unknown`

### 2.5 ImageQualityChecker (`js/multimodal/imageQualityChecker.js`) [NEW]

**Purpose:** Pre-flight quality assessment before vision analysis.

**Checks:**
- Resolution (minimum 300×300)
- Estimated blur (Laplacian variance)
- Brightness / contrast ratio
- Rotation detection (orientation metadata)
- Text visibility estimate

**Output:**
```javascript
{
  isAcceptable: true/false,
  issues: ["low_resolution", "too_dark", "too_blurry"],
  recommendation: "Foto belum cukup jelas. Coba ambil foto lagi dengan pencahayaan lebih baik."
}
```

---

## 3. MODIFIED MODULES

### 3.1 MultimodalInputUI — MAJOR FIX

**Current bug:** Line 392 hardcodes `"2x + 3 = 11\n2x = 8\nx = 4"`.

**Fix:**
```javascript
// BEFORE (BROKEN):
const defaultText = this.targetStepsInput?.value?.trim() || "2x + 3 = 11\n2x = 8\nx = 4";

// AFTER (CORRECT):
// 1. Check image quality
const quality = ImageQualityChecker.assess(prepped);
if (!quality.isAcceptable) {
  this.showQualityWarning(quality);
  return;
}

// 2. Call vision provider for ACTUAL content extraction
const manifest = await VisionProvider.analyzeImage(prepped.processedImage);

// 3. If extraction failed or nothing detected
if (!manifest || manifest.regions.length === 0) {
  this.showUnrecognizedState();  // "Tidak ada konten matematika terdeteksi"
  return;
}

// 4. Build normalized text from ACTUAL recognized content
const recognizedText = manifest.toNormalizedText();

// 5. Show confirmation guard with ACTUAL content
this.showConfirmationGuard(recognizedText.latex, recognizedText.raw, manifest.confidence.overall, "image");
```

### 3.2 AiAgentManager — ADD IMAGE UPLOAD + FIX RESPONSE DIVERSITY

**Image upload in chat:**
- Add `📷 Upload Image` button next to text input
- When image sent: VisionProvider.analyzeImage() → include recognized content in AI prompt context
- AI responds based on ACTUAL image content

**Response diversity fix:**
- Replace generic default fallback (line 1609-1618) with intelligent topic extraction
- Route to Cloud LLM first (if API key present)
- For offline: extract key nouns from query, generate more specific response
- Add "bunga majemuk" (compound interest) to knowledge base with formula

### 3.3 EPE Engine — ENRICH WITH MULTIMODAL EVIDENCE

**Add to result package:**
```javascript
{
  // ... existing fields ...
  inputModality: "text" | "image" | "audio",
  multimodalEvidence: {
    sourceImageRef: "...",
    recognizedContent: "...",
    recognitionConfidence: 0.94,
    verificationStatus: "VERIFIED" | "UNVERIFIED" | "AMBIGUOUS",
    sourceRegions: [...]
  }
}
```

---

## 4. PROVIDER ABSTRACTION LAYER

```
┌─────────────────────────────────────────────┐
│              PROVIDER INTERFACES             │
├─────────────┬──────────────┬────────────────┤
│ VisionProvider │ SpeechProvider │ MathReasoningProvider │
├─────────────┼──────────────┼────────────────┤
│ GeminiVision │ WebSpeechAPI │ GeminiReasoning │
│ (future:    │ (future:     │ (future:       │
│  OpenAI     │  Whisper     │  OpenAI        │
│  Claude)    │  Deepgram)   │  Claude)       │
└─────────────┴──────────────┴────────────────┘
```

Each provider interface defines:
- `async analyze(input)` → structured output
- `getProviderName()` → string
- `isAvailable()` → boolean
- `getCapabilities()` → { supportsHandwriting, supportsMultiQuestion, ... }

EPE depends ONLY on the interfaces, never on specific vendor implementations.

---

## 5. CONFIDENCE MODEL

Replace single-number confidence with multi-signal assessment:

```javascript
{
  recognitionConfidence: 0.92,   // How well was text/math recognized
  structuralConfidence: 0.88,    // How well was document structure understood
  mathematicalConfidence: 0.95,  // How well was math notation parsed
  verificationStatus: "VERIFIED", // Deterministic verification result
  ambiguityFlags: [
    "Symbol 'x' vs '×' distinction uncertain in region r3"
  ],
  overallState: "HIGH_CONFIDENCE" // VERIFIED | HIGH_CONFIDENCE | NEEDS_CONFIRMATION | AMBIGUOUS | UNSUPPORTED
}
```

**Decision logic:**
- `VERIFIED` → confidence ≥ 0.95 AND deterministic verifier confirms
- `HIGH_CONFIDENCE` → confidence ≥ 0.85, no ambiguity flags
- `NEEDS_CONFIRMATION` → confidence < 0.85 OR ambiguity flags present → show student confirmation UI
- `AMBIGUOUS` → confidence < 0.60 → show recognized content + "Is this correct?" with Edit button
- `UNSUPPORTED` → content type not supported → fallback to manual input

---

## 6. RESEARCH VALIDITY SEPARATION

Every diagnostic result must clearly separate three layers:

```javascript
{
  // Layer 1: What the AI interpreted from the image/audio
  aiInterpretation: {
    provider: "gemini-2.0-flash",
    rawRecognizedContent: "Jawaban yang tepat adalah Opsi B...",
    structuredExtraction: { ... },
    confidence: 0.94
  },

  // Layer 2: What was mathematically verified
  mathematicalVerification: {
    status: "VERIFIED",
    verifier: "MathVerifier.deterministic",
    details: { ... }
  },

  // Layer 3: EPE diagnostic classification
  epeClassification: {
    primaryError: "E0",
    secondaryError: "none",
    evidence: "...",
    confidence: 98
  }
}
```

An AI hallucination in Layer 1 CANNOT silently become research data in Layer 3.

---

## 7. IMPLEMENTATION PHASES (from audit findings)

### Phase 0 ✅ — Audit (COMPLETE)
- EPE_AI_AUDIT.md created
- EPE_MULTIMODAL_ARCHITECTURE.md created

### Phase 1 — Fix Fabrication Bug (IMMEDIATE)
- Remove hardcoded `"2x + 3 = 11"` fallback
- Show "unrecognized" state when no OCR available
- Add image quality check before processing

### Phase 2 — Vision Provider + Image Grounding
- Implement VisionProvider with Gemini Vision API
- Create ImageContentManifest schema
- Anti-hallucination prompt engineering
- Connect to existing ImagePreprocessor

### Phase 3 — Structured Question Extraction
- Implement QuestionDocument and ExtractedQuestion
- Multi-question detection in single image
- Question-answer-explanation association
- AnswerTypeDetector

### Phase 4 — Connect Pipeline
- VisionProvider → MathRepresentation → MathVerifier → EPE Engine
- Student Confirmation Guard with real data
- Multi-signal confidence system

### Phase 5 — Handwritten Step Reconstruction
- Connect vision-extracted steps to HandwritingStepReconstructor
- Step transformation verification with real image data
- Error evidence with source region references

### Phase 6 — AI Matrix Upgrade
- Add image upload to AI Matrix chat
- Fix response diversity (kill generic default)
- Add compound interest and other common math topics to knowledge base
- Connect SpeechMathParser to AI Matrix audio input

### Phase 7 — Practice Bank Multi-Question Import
- Teacher uploads worksheet image
- System extracts all questions
- Preview + researcher correction
- Confirm → publish workflow

### Phase 8 — Research Mode Evidence Layer
- Separate AI interpretation / verified fact / EPE classification
- Add multimodal metadata to CSV exports
- Observability logging

### Phase 9 — Provider Abstraction + Domain Routing
- Abstract VisionProvider / SpeechProvider / MathReasoningProvider
- Domain detection → appropriate verification logic
- Model routing (simple → deterministic, complex → LLM)

---

## 8. FILES THAT MUST NOT BE MODIFIED

| File | Reason |
|:---|:---|
| `js/engine/taxonomy.js` | Research-validated E0-E4 classification |
| `js/engine/diagnosticRules.js` | 1,193 lines of expert-authored diagnostic rules |
| `js/data/questions.js` | 24 research instrument questions |
| `js/ui/cubeEngine.js` | Learning Cubes 3D monument |
| `js/avatar/*` | Avatar system (3 files) |
| `js/economy/*` | Cubic economy (3 files) |
| `js/achievements/*` | Achievement engine |
| `js/research/assessmentForms.js` | Research assessment forms |

---

## 9. FILES THAT WILL BE MODIFIED

| File | Modification Scope |
|:---|:---|
| `js/multimodal/multimodalInputUI.js` | **MAJOR:** Remove fabrication bug, integrate VisionProvider, image quality check |
| `js/ui/aiAgentManager.js` | **MAJOR:** Add image upload, fix response diversity, connect SpeechMathParser |
| `js/engine/epeEngine.js` | **MINOR:** Add inputModality and multimodalEvidence to result package |
| `js/research/researchExport.js` | **MINOR:** Add multimodal metadata columns to CSV |
| `js/data/supabaseClient.js` | **MINOR:** Add upsert dedup and online sync listener |

---

## 10. FILES THAT WILL BE CREATED

| File | Purpose |
|:---|:---|
| `js/multimodal/visionProvider.js` | AI vision model abstraction layer |
| `js/multimodal/imageContentManifest.js` | Structured image content representation |
| `js/multimodal/questionDocument.js` | Multi-question document extraction |
| `js/multimodal/answerTypeDetector.js` | Student answer type classification |
| `js/multimodal/imageQualityChecker.js` | Pre-flight image quality assessment |
| `js/multimodal/providerAbstraction.js` | Provider interface definitions |
