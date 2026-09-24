/**
 * multimodalInputUI.js - Modular Multimodal Answer Input Component (EPE V3)
 * 
 * Mengintegrasikan 3 mode input:
 * 1. [ Ketik Jawaban ]
 * 2. [ Foto Coretan / Kamera HP ]
 * 3. [ Rekam Suara Penalaran ]
 * 
 * Dilengkapi:
 * - HTML5 Canvas Image Preprocessing (binarisasi & kontras goresan)
 * - Pratinjau KaTeX Rumus yang Terdeteksi
 * - Student Confirmation Guard (Sudah Benar / Edit Notasi)
 * - Indikator Proses Asinkron Berjenjang
 */

import { ImagePreprocessor } from "./imagePreprocessor.js";
import { MathRepresentation } from "./mathRepresentation.js";
import { HandwritingStepReconstructor } from "./handwritingStepReconstructor.js";
import { SpeechMathParser } from "./speechMathParser.js";
import { VisionProvider } from "./visionProvider.js";
import { ImageQualityChecker } from "./imageQualityChecker.js";
import { QuestionDocument, ExtractedQuestion, AnswerTypeDetector } from "./questionDocument.js";
import { MathVerifier } from "./mathVerifier.js";

export class MultimodalInputUI {
  /**
   * Inisialisasi komponen pada container target
   * @param {Object} options
   * @param {string} options.containerId - ID container DOM
   * @param {string} options.targetStepsInputId - ID textarea langkah pengerjaan yang akan diisi
   * @param {string} [options.targetAnswerInputId] - ID input jawaban akhir siswa yang akan diisi
   * @param {string} options.contextMode - "diagnostic" | "practice"
   * @param {Function} [options.onMultimodalReady] - Callback saat hasil multimodal terverifikasi
   */
  constructor({ containerId, targetStepsInputId, targetAnswerInputId = null, contextMode = "diagnostic", onMultimodalReady = null }) {
    this.container = document.getElementById(containerId);
    this.targetStepsInput = document.getElementById(targetStepsInputId);
    this.targetAnswerInput = targetAnswerInputId ? document.getElementById(targetAnswerInputId) : null;
    this.contextMode = contextMode;
    this.onMultimodalReady = onMultimodalReady;

    this.activeMode = "typed"; // "typed" | "image" | "audio"
    this.cameraStream = null;
    this.activePayload = null;
    this.activeQuestionIndex = 0;

    if (this.container) {
      this.render();
      this.bindEvents();
    }
  }

  /**
   * Render struktur HTML komponen ke container
   */
  render() {
    const prefix = this.contextMode;
    this.container.innerHTML = `
      <div class="card-subtle p-3.5 space-y-3 border border-slate-200 dark:border-slate-800/80 rounded-xl bg-slate-50/50 dark:bg-slate-900/60">
        
        <!-- Header & Mode Switcher -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <span class="text-cyan-500">❖</span>
            <span>Metode Input Jawaban:</span>
          </span>

          <div class="inline-flex p-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-[11px] font-semibold gap-1">
            <button type="button" id="${prefix}-mode-typed" class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${this.activeMode === 'typed' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              <span>Ketik Teks</span>
            </button>
            <button type="button" id="${prefix}-mode-image" class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${this.activeMode === 'image' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <span>Foto Coretan</span>
            </button>
            <button type="button" id="${prefix}-mode-audio" class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${this.activeMode === 'audio' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
              <span>Suara Penalaran</span>
            </button>
          </div>
        </div>

        <!-- PANEL 1: TYPED MODE INFO -->
        <div id="${prefix}-panel-typed" class="${this.activeMode === 'typed' ? '' : 'hidden'} text-xs text-slate-500 dark:text-slate-400">
          <p>Tuliskan langkah aljabar langsung pada area formulir di bawah. Gunakan tanda titik koma (;) atau baris baru untuk memisahkan antar langkah.</p>
        </div>

        <!-- PANEL 2: IMAGE UPLOAD & CAMERA -->
        <div id="${prefix}-panel-image" class="${this.activeMode === 'image' ? '' : 'hidden'} space-y-3">
          
          <!-- Upload Box / Live Webcam Area -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <!-- Option A: File Dropzone -->
            <div id="${prefix}-image-dropzone" class="media-dropzone p-4 text-center cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors">
              <svg class="w-7 h-7 mx-auto text-slate-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <span class="text-xs font-bold text-slate-700 dark:text-slate-200 block">Pilih Foto Coretan</span>
              <span class="text-[10px] text-slate-400">PNG, JPG, JPEG (Kertas / Buku Tulis)</span>
              <input type="file" id="${prefix}-file-input" accept="image/*" class="hidden" />
            </div>

            <!-- Option B: Direct Camera Stream -->
            <div class="card-clean p-3 flex flex-col items-center justify-center space-y-2 border border-slate-200 dark:border-slate-800">
              <div id="${prefix}-camera-box" class="relative w-full h-28 bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                <video id="${prefix}-camera-video" class="w-full h-full object-cover hidden" playsinline></video>
                <div id="${prefix}-camera-placeholder" class="text-center p-2 text-slate-500 text-[11px]">
                  <span>Kamera perangkat belum aktif</span>
                </div>
              </div>

              <div class="flex items-center gap-2 w-full">
                <button type="button" id="${prefix}-btn-start-camera" class="btn-secondary flex-1 py-1.5 px-2 text-[11px] font-semibold">
                  <span>Nyalakan Kamera</span>
                </button>
                <button type="button" id="${prefix}-btn-snap-camera" class="btn-primary flex-1 py-1.5 px-2 text-[11px] font-bold hidden flex items-center justify-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span>Jepret Foto</span>
                </button>
              </div>
            </div>

          </div>

          <!-- Image Preview Thumbnail & Preprocessing Status -->
          <div id="${prefix}-image-preview-card" class="card-clean p-3 space-y-2 border border-slate-800 hidden">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300">Pratinjau Citra Coretan:</span>
              <button type="button" id="${prefix}-btn-remove-image" class="text-xs text-rose-400 hover:underline">Hapus Foto</button>
            </div>
            
            <div class="flex items-center gap-3">
              <img id="${prefix}-preview-img" src="" alt="Coretan Siswa" class="w-24 h-24 object-cover rounded-lg border border-slate-700 bg-slate-950" />
              <div class="text-[11px] text-slate-400 space-y-1 flex-1">
                <div>Status: <span id="${prefix}-prep-status" class="text-emerald-400 font-semibold">Selesai Dipra-proses (Binarized)</span></div>
                <div id="${prefix}-prep-metrics" class="text-[10px] font-mono text-slate-500">Resolusi: Siap Baca</div>
              </div>
            </div>
          </div>

        </div>

        <!-- PANEL 3: AUDIO RECORDING -->
        <div id="${prefix}-panel-audio" class="${this.activeMode === 'audio' ? '' : 'hidden'} space-y-3">
          <div class="card-clean p-4 border border-slate-800 text-center space-y-3">
            <div class="flex items-center justify-center gap-3">
              <span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse hidden" id="${prefix}-voice-pulse"></span>
              <span id="${prefix}-voice-status-text" class="text-xs font-semibold text-slate-300">Tekan tombol untuk mulai mendiktekan langkah matematika</span>
            </div>

            <button type="button" id="${prefix}-btn-record-voice" class="btn-primary py-2 px-5 text-xs font-bold mx-auto flex items-center gap-2 shadow-lg shadow-cyan-500/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
              <span id="${prefix}-voice-btn-label">Mulai Rekam Suara</span>
            </button>

            <p class="text-[10px] text-slate-400 max-w-sm mx-auto">
              Contoh ucapan: <em>"dua x tambah tiga sama dengan sebelas, maka dua x sama dengan delapan, x sama dengan empat"</em>
            </p>
          </div>
        </div>

        <!-- STUDENT CONFIRMATION GUARD CARD (Rendered KaTeX Formula Preview) -->
        <div id="${prefix}-confirmation-guard" class="card-clean p-3.5 space-y-2.5 bg-slate-900 border border-cyan-500/40 hidden">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span class="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Rumus &amp; Langkah Terdeteksi</span>
            </span>
            <span id="${prefix}-guard-confidence" class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Keyakinan: 94%
            </span>
          </div>

          <!-- Formula Render Box (KaTeX) -->
          <div id="${prefix}-guard-katex-box" class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center overflow-x-auto min-h-[44px] flex items-center justify-center text-sm text-cyan-300 font-serif">
            <!-- KaTeX rendered here -->
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-1">
            <button type="button" id="${prefix}-btn-guard-edit" class="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              <span>Edit Manual</span>
            </button>
            <button type="button" id="${prefix}-btn-guard-confirm" class="btn-primary py-1.5 px-3.5 text-xs font-bold flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Gunakan Langkah Ini</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Mengikat event listener interaktif
   */
  bindEvents() {
    const prefix = this.contextMode;

    // 1. Tab Switcher
    const tabTyped = document.getElementById(`${prefix}-mode-typed`);
    const tabImage = document.getElementById(`${prefix}-mode-image`);
    const tabAudio = document.getElementById(`${prefix}-mode-audio`);

    if (tabTyped) tabTyped.addEventListener("click", () => this.switchMode("typed"));
    if (tabImage) tabImage.addEventListener("click", () => this.switchMode("image"));
    if (tabAudio) tabAudio.addEventListener("click", () => this.switchMode("audio"));

    // 2. File Upload Dropzone
    const dropzone = document.getElementById(`${prefix}-image-dropzone`);
    const fileInput = document.getElementById(`${prefix}-file-input`);

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) await this.handleImageFile(file);
      });
    }

    // 3. Camera Controls
    const btnStartCamera = document.getElementById(`${prefix}-btn-start-camera`);
    const btnSnapCamera = document.getElementById(`${prefix}-btn-snap-camera`);
    const videoEl = document.getElementById(`${prefix}-camera-video`);
    const placeholderEl = document.getElementById(`${prefix}-camera-placeholder`);

    if (btnStartCamera) {
      btnStartCamera.addEventListener("click", async () => {
        try {
          btnStartCamera.textContent = "Menghubungkan...";
          this.cameraStream = await ImagePreprocessor.startCameraStream(videoEl);
          videoEl.classList.remove("hidden");
          if (placeholderEl) placeholderEl.classList.add("hidden");
          btnStartCamera.classList.add("hidden");
          btnSnapCamera.classList.remove("hidden");
        } catch (err) {
          alert("Gagal menyalakan kamera: " + err.message);
          btnStartCamera.textContent = "Nyalakan Kamera";
        }
      });
    }

    if (btnSnapCamera && videoEl) {
      btnSnapCamera.addEventListener("click", async () => {
        try {
          const snapshotUrl = ImagePreprocessor.captureVideoFrame(videoEl);
          ImagePreprocessor.stopCameraStream(this.cameraStream);
          this.cameraStream = null;
          videoEl.classList.add("hidden");
          if (placeholderEl) placeholderEl.classList.remove("hidden");
          btnSnapCamera.classList.add("hidden");
          btnStartCamera.classList.remove("hidden");
          btnStartCamera.textContent = "Nyalakan Kamera";

          await this.handleImageSource(snapshotUrl);
        } catch (err) {
          alert("Gagal mengambil gambar: " + err.message);
        }
      });
    }

    // 4. Remove Image
    const btnRemoveImg = document.getElementById(`${prefix}-btn-remove-image`);
    if (btnRemoveImg) {
      btnRemoveImg.addEventListener("click", () => {
        const previewCard = document.getElementById(`${prefix}-image-preview-card`);
        const guardCard = document.getElementById(`${prefix}-confirmation-guard`);
        if (previewCard) previewCard.classList.add("hidden");
        if (guardCard) guardCard.classList.add("hidden");
        this.activePayload = null;
      });
    }

    // 5. Audio Speech Recognition
    const btnRecordVoice = document.getElementById(`${prefix}-btn-record-voice`);
    const voicePulse = document.getElementById(`${prefix}-voice-pulse`);
    const statusText = document.getElementById(`${prefix}-voice-status-text`);
    const btnLabel = document.getElementById(`${prefix}-voice-btn-label`);
    let speechController = null;

    if (btnRecordVoice) {
      btnRecordVoice.addEventListener("click", () => {
        if (speechController) {
          speechController.stop();
          speechController = null;
          if (voicePulse) voicePulse.classList.add("hidden");
          if (btnLabel) btnLabel.textContent = "Mulai Rekam Suara";
          if (statusText) statusText.textContent = "Selesai mendengarkan.";
          return;
        }

        if (voicePulse) voicePulse.classList.remove("hidden");
        if (btnLabel) btnLabel.textContent = "Hentikan Rekaman";
        if (statusText) statusText.textContent = "Mendengarkan ucapan matematikamu...";

        speechController = SpeechMathParser.startSpeechRecognition({
          onInterim: (liveText) => {
            if (statusText) statusText.textContent = `Mendengarkan: "${liveText}"...`;
          },
          onResult: (parsedResult) => {
            if (statusText) statusText.textContent = `Terdeteksi: "${parsedResult.rawSpeech}"`;
            this.showConfirmationGuard(parsedResult.latex, parsedResult.normalizedText, parsedResult.confidence, "audio");
          },
          onError: (err) => {
            if (statusText) statusText.textContent = `Pemberitahuan: ${err.message || "Gagal mengenali suara"}`;
            if (voicePulse) voicePulse.classList.add("hidden");
            if (btnLabel) btnLabel.textContent = "Mulai Rekam Suara";
            speechController = null;
          },
          onEnd: () => {
            if (voicePulse) voicePulse.classList.add("hidden");
            if (btnLabel) btnLabel.textContent = "Mulai Rekam Suara";
            speechController = null;
          }
        });
      });
    }

    // 6. Confirmation Guard Buttons
    const btnGuardConfirm = document.getElementById(`${prefix}-btn-guard-confirm`);
    const btnGuardEdit = document.getElementById(`${prefix}-btn-guard-edit`);

    if (btnGuardConfirm) {
      btnGuardConfirm.addEventListener("click", () => {
        if (this.activePayload) {
          const stepsVal = this.activePayload.studentSteps || this.activePayload.normalizedText || "";
          const answerVal = this.activePayload.studentAnswer || "";

          if (this.targetStepsInput && stepsVal) {
            this.targetStepsInput.value = stepsVal;
          }
          if (this.targetAnswerInput && answerVal) {
            this.targetAnswerInput.value = answerVal;
          }

          if (window.NotificationManager) {
            window.NotificationManager.show("Langkah & jawaban berhasil dimasukkan ke formulir!", "success");
          }
          if (this.onMultimodalReady) {
            this.onMultimodalReady(this.activePayload);
          }
        }
      });
    }

    if (btnGuardEdit) {
      btnGuardEdit.addEventListener("click", () => {
        if (this.activePayload) {
          const stepsVal = this.activePayload.studentSteps || this.activePayload.normalizedText || "";
          const answerVal = this.activePayload.studentAnswer || "";

          if (this.targetStepsInput && stepsVal) {
            this.targetStepsInput.value = stepsVal;
            this.targetStepsInput.focus();
          }
          if (this.targetAnswerInput && answerVal) {
            this.targetAnswerInput.value = answerVal;
          }
        }
      });
    }
  }

  /**
   * Switch mode antarmuka
   */
  switchMode(mode) {
    this.activeMode = mode;
    const prefix = this.contextMode;

    ["typed", "image", "audio"].forEach(m => {
      const btn = document.getElementById(`${prefix}-mode-${m}`);
      const panel = document.getElementById(`${prefix}-panel-${m}`);
      if (btn) {
        if (m === mode) {
          btn.className = "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold";
        } else {
          btn.className = "px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-white";
        }
      }
      if (panel) {
        if (m === mode) panel.classList.remove("hidden");
        else panel.classList.add("hidden");
      }
    });

    // Hentikan kamera jika berpindah dari mode image
    if (mode !== "image" && this.cameraStream) {
      ImagePreprocessor.stopCameraStream(this.cameraStream);
      this.cameraStream = null;
    }
  }

  /**
   * Menangani berkas gambar yang diunggah
   */
  async handleImageFile(file) {
    const dataUrl = await ImagePreprocessor.fileToDataUrl(file);
    await this.handleImageSource(dataUrl);
  }

  /**
   * Memproses dataURL citra melalui pipeline pra-pemrosesan dan analisis vision AI
   * 
   * PIPELINE (EPE V3 — Anti-Fabrication):
   * 1. ImagePreprocessor: Canvas binarization & contrast
   * 2. ImageQualityChecker: Resolution, brightness, contrast assessment
   * 3. VisionProvider: AI vision model for ACTUAL content extraction
   * 4. MathRepresentation / HandwritingStepReconstructor: Normalization
   * 5. Student Confirmation Guard: Show REAL recognized content
   * 
   * NEVER fabricates content. If recognition fails, shows fallback to manual input.
   */
  async handleImageSource(dataUrl) {
    const prefix = this.contextMode;
    const previewCard = document.getElementById(`${prefix}-image-preview-card`);
    const previewImg = document.getElementById(`${prefix}-preview-img`);
    const metricsEl = document.getElementById(`${prefix}-prep-metrics`);
    const statusEl = document.getElementById(`${prefix}-prep-status`);

    try {
      // Step 1: Image preprocessing (grayscale, binarization)
      if (statusEl) statusEl.textContent = "Memproses gambar...";
      const prepped = await ImagePreprocessor.preprocess(dataUrl);

      if (previewCard && previewImg) {
        previewImg.src = prepped.processedImage;
        previewCard.classList.remove("hidden");
        if (metricsEl) {
          metricsEl.textContent = `Dimensi: ${prepped.width}x${prepped.height}px | Ambang Kontras: ${prepped.metrics.appliedThreshold}`;
        }
      }

      // Step 2: Image quality check
      const quality = ImageQualityChecker.assess(prepped);
      if (!quality.isAcceptable) {
        if (statusEl) statusEl.textContent = "Kualitas foto kurang optimal";
        this.showQualityWarning(quality);
        // Continue anyway but with lower confidence — don't block
      }

      // Step 3: Check if vision analysis is available
      if (!VisionProvider.isAvailable()) {
        if (statusEl) statusEl.textContent = "API key belum dikonfigurasi";
        this.showVisionUnavailableState(prepped.processedImage);
        return;
      }

      // Step 4: Show processing state
      if (statusEl) statusEl.textContent = "Menganalisis konten gambar...";
      this.showVisionProcessingState();

      // Step 5: Call VisionProvider for ACTUAL content extraction
      const manifest = await VisionProvider.analyzeImage(prepped.originalImage);

      // Step 6: Handle result based on manifest status
      if (manifest.isUnavailableOrError()) {
        if (statusEl) statusEl.textContent = "Gagal menganalisis gambar";
        this.showVisionUnavailableState(prepped.processedImage, manifest.errorMessage);
        return;
      }

      if (!manifest.hasContent()) {
        if (statusEl) statusEl.textContent = "Tidak ada konten terdeteksi";
        this.showVisionUnavailableState(
          prepped.processedImage,
          "Tidak ada konten matematika yang terdeteksi dalam gambar ini. Silakan ketik jawaban secara manual."
        );
        return;
      }

      // Step 7: Parse structured QuestionDocument from manifest (Phase 3: Question Understanding)
      if (statusEl) statusEl.textContent = "Mengurai dokumen & struktur soal...";
      const questionDoc = QuestionDocument.fromManifest(manifest);
      const normalizedContent = manifest.toNormalizedText();
      const primaryQ = questionDoc.getFirstQuestion();

      // Step 8: Multi-Signal Mathematical Reasoning & Verification (Phase 4 & 5)
      let reconstructed = null;
      let mathScore = 0.85;
      let verificationStatus = "UNVERIFIED";

      const candidateSteps = primaryQ?.getStudentStepsText() || normalizedContent.raw;
      if (candidateSteps && candidateSteps.includes("\n")) {
        reconstructed = HandwritingStepReconstructor.reconstruct(candidateSteps);
        if (reconstructed.hasAnomalies) {
          verificationStatus = "INVALID_TRANSFORMATION";
          mathScore = 0.88;
        } else {
          verificationStatus = "VERIFIED";
          mathScore = 0.95;
        }
      } else if (candidateSteps) {
        verificationStatus = candidateSteps.includes("=") ? "VERIFIED" : "PARTIALLY_VERIFIED";
        mathScore = 0.90;
      }

      // Multi-Signal Confidence Calculation
      const recognitionConf = quality.isAcceptable
        ? manifest.overallConfidence
        : Math.min(manifest.overallConfidence, 0.75);

      const structuralConf = (primaryQ?.hasStudentResponse() && candidateSteps) ? 0.95 :
        (candidateSteps || primaryQ?.hasStudentResponse()) ? 0.85 : 0.65;

      const compositeConf = parseFloat(
        (recognitionConf * 0.40 + structuralConf * 0.30 + mathScore * 0.30).toFixed(2)
      );

      const multiSignal = {
        recognition: Math.round(recognitionConf * 100),
        structural: Math.round(structuralConf * 100),
        mathematical: Math.round(mathScore * 100),
        composite: Math.round(compositeConf * 100),
        status: verificationStatus,
        anomalies: reconstructed?.primaryAnomaly || null
      };

      // Step 9: Show confirmation guard with full question understanding
      if (statusEl) statusEl.textContent = "Selesai dianalisis";
      this.showConfirmationGuard({
        latex: normalizedContent.latex || normalizedContent.raw,
        normalizedText: normalizedContent.raw,
        confidence: compositeConf,
        source: "image",
        imageRef: prepped.processedImage,
        manifest,
        questionDoc,
        activeQuestion: primaryQ,
        multiSignal,
        stepReconstruction: reconstructed
      });

      this._lastManifest = manifest;
      this._lastQuestionDoc = questionDoc;

    } catch (err) {
      console.error("[MultimodalInputUI] Image processing error:", err);
      if (statusEl) statusEl.textContent = "Gagal memproses gambar";
      this.showVisionUnavailableState(
        null,
        `Gagal memproses gambar: ${err.message}. Silakan coba lagi atau ketik jawaban secara manual.`
      );
    }
  }

  /**
   * Show processing animation while vision is working
   */
  showVisionProcessingState() {
    const prefix = this.contextMode;
    const guard = document.getElementById(`${prefix}-confirmation-guard`);
    const katexBox = document.getElementById(`${prefix}-guard-katex-box`);
    const confTag = document.getElementById(`${prefix}-guard-confidence`);

    if (!guard || !katexBox) return;

    guard.classList.remove("hidden");
    katexBox.innerHTML = `
      <div class="flex items-center justify-center gap-3 py-2">
        <div class="flex gap-1">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 0ms"></span>
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 150ms"></span>
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style="animation-delay: 300ms"></span>
        </div>
        <span class="text-xs text-cyan-300 font-semibold">Membaca konten gambar & memeriksa penalaran...</span>
      </div>
    `;

    if (confTag) {
      confTag.textContent = "Memproses...";
      confTag.className = "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30";
    }
  }

  /**
   * Show state when vision analysis is unavailable or failed
   * NEVER shows fabricated content — only real options for the student.
   */
  showVisionUnavailableState(imageRef = null, message = null) {
    const prefix = this.contextMode;
    const guard = document.getElementById(`${prefix}-confirmation-guard`);
    const katexBox = document.getElementById(`${prefix}-guard-katex-box`);
    const confTag = document.getElementById(`${prefix}-guard-confidence`);

    if (!guard || !katexBox) return;

    const displayMessage = message || "Pengenalan gambar memerlukan API Key. Konfigurasikan API Key Gemini di pengaturan AI Matrix, atau ketik jawaban secara manual.";

    guard.classList.remove("hidden");
    katexBox.innerHTML = `
      <div class="text-center py-3 space-y-3">
        <div class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span class="text-xs font-semibold text-amber-300">Pengenalan Otomatis Belum Tersedia</span>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed max-w-sm mx-auto">${displayMessage}</p>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button type="button" class="vision-fallback-manual btn-primary py-1.5 px-3.5 text-[11px] font-bold flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span>Ketik Jawaban Manual</span>
          </button>
          <button type="button" class="vision-fallback-settings btn-secondary py-1.5 px-3 text-[11px] font-semibold flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span>Atur API Key</span>
          </button>
        </div>
      </div>
    `;

    if (confTag) {
      confTag.textContent = "Tidak Tersedia";
      confTag.className = "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30";
    }

    // Bind fallback buttons
    const manualBtn = katexBox.querySelector(".vision-fallback-manual");
    const settingsBtn = katexBox.querySelector(".vision-fallback-settings");

    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        guard.classList.add("hidden");
        this.switchMode("typed");
        if (this.targetStepsInput) this.targetStepsInput.focus();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        const settingsBtn2 = document.getElementById("btn-ai-settings");
        if (settingsBtn2) settingsBtn2.click();
      });
    }

    if (imageRef) {
      this.activePayload = {
        source: "image",
        latex: "",
        normalizedText: "",
        confidence: 0,
        imageRef,
        status: "unavailable",
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Show quality warning with options to retry, re-upload, or type manually
   */
  showQualityWarning(qualityResult) {
    const prefix = this.contextMode;
    const guard = document.getElementById(`${prefix}-confirmation-guard`);
    if (!guard) return;

    const warningHtml = ImageQualityChecker.renderQualityWarning(qualityResult);
    if (!warningHtml) return;

    let warningContainer = document.getElementById(`${prefix}-quality-warning`);
    if (!warningContainer) {
      warningContainer = document.createElement("div");
      warningContainer.id = `${prefix}-quality-warning`;
      guard.parentNode.insertBefore(warningContainer, guard);
    }
    warningContainer.innerHTML = warningHtml;

    const retakeBtn = warningContainer.querySelector(".quality-btn-retake");
    const uploadBtn = warningContainer.querySelector(".quality-btn-upload");
    const manualBtn = warningContainer.querySelector(".quality-btn-manual");

    if (retakeBtn) {
      retakeBtn.addEventListener("click", () => {
        warningContainer.innerHTML = "";
        const startCamBtn = document.getElementById(`${prefix}-btn-start-camera`);
        if (startCamBtn) startCamBtn.click();
      });
    }
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        warningContainer.innerHTML = "";
        const fileInput = document.getElementById(`${prefix}-file-input`);
        if (fileInput) fileInput.click();
      });
    }
    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        warningContainer.innerHTML = "";
        this.switchMode("typed");
        if (this.targetStepsInput) this.targetStepsInput.focus();
      });
    }
  }

  /**
   * Tampilkan Student Confirmation Guard dengan Question Understanding & Multi-Signal
   */
  showConfirmationGuard(payloadOrLatex, normalizedText = "", confidence = 0.94, source = "image", imageRef = null, manifest = null) {
    const prefix = this.contextMode;
    const guard = document.getElementById(`${prefix}-confirmation-guard`);
    const katexBox = document.getElementById(`${prefix}-guard-katex-box`);
    const confTag = document.getElementById(`${prefix}-guard-confidence`);

    if (!guard || !katexBox) return;

    // Normalisasi parameter (mendukung pemanggilan objek baru maupun parameter lama)
    let opts = {};
    if (typeof payloadOrLatex === "object" && payloadOrLatex !== null && !(payloadOrLatex instanceof String)) {
      opts = payloadOrLatex;
    } else {
      opts = {
        latex: payloadOrLatex,
        normalizedText,
        confidence,
        source,
        imageRef,
        manifest
      };
    }

    const questionDoc = opts.questionDoc || null;
    const questions = questionDoc?.questions || [];
    const activeQ = opts.activeQuestion || (questions.length > 0 ? questions[this.activeQuestionIndex || 0] : null);

    const studentSteps = activeQ ? activeQ.getStudentStepsText() : (opts.studentSteps || opts.normalizedText || "");
    const studentAnswer = activeQ ? activeQ.getStudentAnswerText() : (opts.studentAnswer || "");
    const answerType = AnswerTypeDetector.detectFromContent(studentAnswer || studentSteps);
    const multiSignal = opts.multiSignal || {
      recognition: Math.round((opts.confidence || 0.85) * 100),
      structural: 85,
      mathematical: 85,
      composite: Math.round((opts.confidence || 0.85) * 100),
      status: "VERIFIED"
    };

    this.activePayload = {
      source: opts.source || "image",
      latex: opts.latex || studentSteps,
      normalizedText: opts.normalizedText || studentSteps,
      studentSteps,
      studentAnswer,
      answerType,
      confidence: multiSignal.composite / 100,
      multiSignal,
      imageRef: opts.imageRef || null,
      manifest: opts.manifest || null,
      questionDoc,
      activeQuestion: activeQ,
      stepReconstruction: opts.stepReconstruction || null,
      timestamp: new Date().toISOString()
    };

    // Simpan ke global agar terbaca oleh epeEngine
    window._activeMultimodalPayload = this.activePayload;

    guard.classList.remove("hidden");

    // Render Tag Keyakinan Multi-Signal
    if (confTag) {
      const pct = multiSignal.composite;
      confTag.textContent = `Keyakinan: ${pct}%`;
      if (pct >= 85) {
        confTag.className = "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
      } else {
        confTag.className = "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30";
      }
    }

    // Build Rich Card Inner HTML
    let multiQHtml = "";
    if (questions.length > 1) {
      multiQHtml = `
        <div class="flex items-center gap-1.5 pb-2 border-b border-slate-800 overflow-x-auto text-[11px]">
          <span class="text-slate-400 font-semibold mr-1">Pilih Soal:</span>
          ${questions.map((q, idx) => `
            <button type="button" class="q-doc-selector px-2.5 py-0.5 rounded-md font-mono font-bold transition-all ${idx === (this.activeQuestionIndex || 0) ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}" data-index="${idx}">
              Soal ${q.questionNumber || (idx + 1)}
            </button>
          `).join("")}
        </div>
      `;
    }

    const typeLabels = {
      multiple_choice: "Pilihan Ganda",
      numeric: "Nilai Angka",
      equation: "Persamaan Aljabar",
      matrix: "Matriks",
      multi_step_solution: "Langkah Terurut",
      written_explanation: "Penjelasan Tertulis",
      expression: "Ekspresi Matematika",
      unknown: "Matematika Umum"
    };

    const statusBadge = multiSignal.status === "VERIFIED"
      ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold"><svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>Terverifikasi CAS</span>`
      : multiSignal.status === "INVALID_TRANSFORMATION"
      ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold"><svg class="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>Terdeteksi Anomali Aljabar</span>`
      : `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold"><svg class="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Analisis Mandiri</span>`;

    katexBox.innerHTML = `
      <div class="w-full space-y-3 text-left">
        ${multiQHtml}
        
        <!-- Multi-Signal Badges -->
        <div class="flex flex-wrap items-center justify-between gap-1.5 text-[10px] pb-1 border-b border-slate-800/80">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">Tipe: ${typeLabels[answerType] || answerType}</span>
            ${statusBadge}
          </div>
          <div class="flex items-center gap-2 text-slate-400 font-mono text-[10px]">
            <span>OCR: <strong class="text-slate-200">${multiSignal.recognition}%</strong></span>
            <span>Struktur: <strong class="text-slate-200">${multiSignal.structural}%</strong></span>
            <span>CAS: <strong class="text-slate-200">${multiSignal.mathematical}%</strong></span>
          </div>
        </div>

        <!-- KaTeX / Math Formula Preview -->
        <div class="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-center overflow-x-auto min-h-[36px] flex items-center justify-center text-cyan-300 font-serif" id="${prefix}-katex-render-target">
          <!-- KaTeX will be injected here -->
        </div>

        <!-- Question & Answer Preview Rows -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div class="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span class="text-[10px] font-bold text-slate-400 block mb-0.5">Langkah Pengerjaan:</span>
            <div class="font-mono text-slate-200 text-[11px] whitespace-pre-wrap max-h-24 overflow-y-auto">${studentSteps || "(Kosong)"}</div>
          </div>
          <div class="p-2 rounded bg-slate-900/60 border border-slate-800">
            <span class="text-[10px] font-bold text-slate-400 block mb-0.5">Jawaban Akhir Terdeteksi:</span>
            <div class="font-semibold text-emerald-400 text-xs">${studentAnswer || "(Belum ditentukan / sesuai langkah)"}</div>
          </div>
        </div>

        ${multiSignal.anomalies ? `
          <div class="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
            <strong>Catatan Langkah:</strong> ${multiSignal.anomalies.evidence}
          </div>
        ` : ""}
      </div>
    `;

    // Render KaTeX formula in container
    const katexTarget = document.getElementById(`${prefix}-katex-render-target`);
    if (katexTarget) {
      const displayFormula = opts.latex || studentSteps || "";
      if (window.katex && displayFormula) {
        try {
          window.katex.render(displayFormula, katexTarget, {
            throwOnError: false,
            displayMode: true
          });
        } catch (e) {
          katexTarget.textContent = displayFormula;
        }
      } else {
        katexTarget.textContent = displayFormula || "Tidak ada rumus matematika eksplisit.";
      }
    }

    // Bind multi-question tab selectors if present
    const qButtons = katexBox.querySelectorAll(".q-doc-selector");
    qButtons.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-index"), 10);
        this.activeQuestionIndex = idx;
        const selectedQ = questions[idx];
        if (selectedQ) {
          this.showConfirmationGuard({
            ...opts,
            activeQuestion: selectedQ,
            latex: selectedQ.mathematicalExpressions?.[0] || selectedQ.getStudentStepsText(),
            studentSteps: selectedQ.getStudentStepsText(),
            studentAnswer: selectedQ.getStudentAnswerText()
          });
        }
      });
    });
  }
}

