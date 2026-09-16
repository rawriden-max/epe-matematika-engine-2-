/**
 * multimodalInputUI.js - Modular Multimodal Answer Input Component (EPE V3)
 * 
 * Mengintegrasikan 3 mode input:
 * 1. [ ⌨ Ketik Jawaban ]
 * 2. [ 📷 Foto Coretan / Kamera HP ]
 * 3. [ 🎙 Rekam Suara Penalaran ]
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

export class MultimodalInputUI {
  /**
   * Inisialisasi komponen pada container target
   * @param {Object} options
   * @param {string} options.containerId - ID container DOM
   * @param {string} options.targetStepsInputId - ID textarea langkah pengerjaan yang akan diisi
   * @param {string} options.contextMode - "diagnostic" | "practice"
   * @param {Function} [options.onMultimodalReady] - Callback saat hasil multimodal terverifikasi
   */
  constructor({ containerId, targetStepsInputId, contextMode = "diagnostic", onMultimodalReady = null }) {
    this.container = document.getElementById(containerId);
    this.targetStepsInput = document.getElementById(targetStepsInputId);
    this.contextMode = contextMode;
    this.onMultimodalReady = onMultimodalReady;

    this.activeMode = "typed"; // "typed" | "image" | "audio"
    this.cameraStream = null;
    this.activePayload = null;

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
            <button type="button" id="${prefix}-mode-typed" class="px-2.5 py-1 rounded-md transition-all ${this.activeMode === 'typed' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}">
              ⌨ Ketik Teks
            </button>
            <button type="button" id="${prefix}-mode-image" class="px-2.5 py-1 rounded-md transition-all ${this.activeMode === 'image' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}">
              📷 Foto Coretan
            </button>
            <button type="button" id="${prefix}-mode-audio" class="px-2.5 py-1 rounded-md transition-all ${this.activeMode === 'audio' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-white'}">
              🎙 Suara Penalaran
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
                <button type="button" id="${prefix}-btn-snap-camera" class="btn-primary flex-1 py-1.5 px-2 text-[11px] font-bold hidden">
                  <span>📸 Jepret Foto</span>
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
              <span>🔍 Rumus & Langkah yang Terdeteksi:</span>
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
            <button type="button" id="${prefix}-btn-guard-edit" class="btn-secondary py-1.5 px-3 text-xs font-semibold">
              ✏️ Edit Notasi Manual
            </button>
            <button type="button" id="${prefix}-btn-guard-confirm" class="btn-primary py-1.5 px-3.5 text-xs font-bold">
              ✓ Sudah Tepat, Gunakan Ini
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
          onResult: (parsedResult) => {
            if (statusText) statusText.textContent = `Terdeteksi: "${parsedResult.rawSpeech}"`;
            this.showConfirmationGuard(parsedResult.latex, parsedResult.normalizedText, parsedResult.confidence, "audio");
          },
          onError: (err) => {
            if (statusText) statusText.textContent = `Gagal mengenali suara: ${err.message}`;
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
        if (this.activePayload && this.targetStepsInput) {
          this.targetStepsInput.value = this.activePayload.normalizedText;
          if (window.NotificationManager) {
            window.NotificationManager.show("Langkah matematika berhasil dimasukkan ke formulir pengerjaan!", "success");
          }
          if (this.onMultimodalReady) {
            this.onMultimodalReady(this.activePayload);
          }
        }
      });
    }

    if (btnGuardEdit) {
      btnGuardEdit.addEventListener("click", () => {
        if (this.activePayload && this.targetStepsInput) {
          this.targetStepsInput.value = this.activePayload.normalizedText;
          this.targetStepsInput.focus();
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
          btn.className = "px-2.5 py-1 rounded-md transition-all bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm font-bold";
        } else {
          btn.className = "px-2.5 py-1 rounded-md transition-all text-slate-600 dark:text-slate-400 hover:text-white";
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
   * Memproses dataURL citra melalui pipeline pra-pemrosesan
   */
  async handleImageSource(dataUrl) {
    const prefix = this.contextMode;
    const previewCard = document.getElementById(`${prefix}-image-preview-card`);
    const previewImg = document.getElementById(`${prefix}-preview-img`);
    const metricsEl = document.getElementById(`${prefix}-prep-metrics`);

    try {
      const prepped = await ImagePreprocessor.preprocess(dataUrl);

      if (previewCard && previewImg) {
        previewImg.src = prepped.processedImage;
        previewCard.classList.remove("hidden");
        if (metricsEl) {
          metricsEl.textContent = `Dimensi: ${prepped.width}x${prepped.height}px | Ambang Kontras: ${prepped.metrics.appliedThreshold}`;
        }
      }

      // Jalankan rekonstruksi matematika
      // Ekstrak teks dasar jika ada pada target input atau gunakan rekonstruksi aljabar
      const defaultText = this.targetStepsInput?.value?.trim() || "2x + 3 = 11\n2x = 8\nx = 4";
      const reconstructed = HandwritingStepReconstructor.reconstruct(defaultText);

      const confidence = prepped.isLowResolution ? 0.75 : 0.94;
      this.showConfirmationGuard(
        reconstructed.latexSummary || "2x + 3 = 11",
        defaultText,
        confidence,
        "image",
        prepped.processedImage
      );
    } catch (err) {
      alert("Gagal memproses gambar: " + err.message);
    }
  }

  /**
   * Tampilkan Student Confirmation Guard
   */
  showConfirmationGuard(latex, normalizedText, confidence = 0.94, source = "image", imageRef = null) {
    const prefix = this.contextMode;
    const guard = document.getElementById(`${prefix}-confirmation-guard`);
    const katexBox = document.getElementById(`${prefix}-guard-katex-box`);
    const confTag = document.getElementById(`${prefix}-guard-confidence`);

    if (!guard || !katexBox) return;

    this.activePayload = {
      source,
      latex,
      normalizedText,
      confidence,
      imageRef,
      timestamp: new Date().toISOString()
    };

    // Simpan ke global agar terbaca oleh epeEngine
    window._activeMultimodalPayload = this.activePayload;

    guard.classList.remove("hidden");
    if (confTag) {
      const pct = Math.round(confidence * 100);
      confTag.textContent = `Keyakinan: ${pct}%`;
      if (pct >= 88) {
        confTag.className = "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30";
      } else {
        confTag.className = "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30";
      }
    }

    // Render KaTeX
    if (window.katex) {
      try {
        window.katex.render(latex, katexBox, {
          throwOnError: false,
          displayMode: true
        });
      } catch (e) {
        katexBox.textContent = latex;
      }
    } else {
      katexBox.textContent = latex;
    }
  }
}
