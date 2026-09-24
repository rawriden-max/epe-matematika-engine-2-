/**
 * liveVoiceUI.js - Mode Bicara Langsung dengan Matrix AI (Hands-Free Voice Mode)
 * Error Pattern Engine (EPE) V2 / V3
 * 
 * Interaksi suara dua arah real-time dengan visualisasi gelombang holografis 60fps,
 * subtitle dinamis, barge-in (interupsi bicara), dan integrasi otomatis ke riwayat sesi chat.
 */

import { aiVoiceEngine, VOICE_PERSONAS } from "../ai/aiVoiceEngine.js";

export class LiveVoiceUI {
  constructor({ aiAgentManager, voiceCustomizerModal } = {}) {
    this.aiAgentManager = aiAgentManager;
    this.voiceCustomizerModal = voiceCustomizerModal;

    this.modalEl = null;
    this.canvasEl = null;
    this.ctx = null;
    this.animFrameId = null;

    // States: 'idle' | 'listening' | 'thinking' | 'speaking'
    this.state = "idle";
    this.isHandsFreeLoop = true;
    this.activeSpeechSession = null;
    this.currentAudioVolume = 0;
    this.visualizerPhase = 0;
    this.isOpen = false;

    // Variabel Dinamika Gelombang Suara & Vibrasi Organis (Tanpa Kaku)
    this.smoothVolume = 0;
    this.speechEnergy = 0;
    this.lastRippleTime = 0;
    this.outwardRipples = [];
    this.particles = [];

    // Partikel luminous akustik yang mengorbit bola
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        angle: (i / 20) * Math.PI * 2,
        speed: 0.006 + (i % 4) * 0.0035,
        radiusOffset: (i % 5) * 8 - 16,
        size: 1.2 + (i % 3) * 0.9,
        alpha: 0.35 + (i % 4) * 0.15,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    this.render();
  }

  render() {
    let existing = document.getElementById("ai-live-voice-modal");
    if (existing) {
      this.modalEl = existing;
      this.canvasEl = this.modalEl.querySelector("#live-voice-canvas");
      if (this.canvasEl) this.ctx = this.canvasEl.getContext("2d");
      return;
    }

    const modal = document.createElement("div");
    modal.id = "ai-live-voice-modal";
    modal.className = "fixed inset-0 z-[100003] flex flex-col justify-between p-4 sm:p-6 bg-slate-950/95 backdrop-blur-2xl text-white hidden select-none transition-all duration-300";
    modal.innerHTML = `
      <!-- Top Navigation & Controls Bar -->
      <div class="flex items-center justify-between z-10 w-full max-w-4xl mx-auto">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-black tracking-wide text-white">Mode Bicara Langsung</h2>
              <span id="live-voice-status-badge" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-700/60 animate-pulse">
                Siap Bicara
              </span>
            </div>
            <p class="text-xs text-slate-400 flex items-center gap-1.5" id="live-voice-active-persona-text">
              <span>Persona:</span>
              <strong class="text-cyan-300 font-bold" id="live-voice-persona-name">Kakak Mentor Ceria</strong>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Tombol Ubah Karakter Suara -->
          <button id="btn-live-voice-change-persona" class="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm" title="Ubah Karakter & Nada Suara AI">
            <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            <span class="hidden sm:inline">Ubah Suara</span>
          </button>

          <!-- Toggle Hands-Free Loop -->
          <button id="btn-live-voice-toggle-loop" class="py-1.5 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 text-xs font-bold flex items-center gap-1.5 transition-all" title="Mode Percakapan Berkelanjutan Otomatis">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span class="hidden sm:inline">Auto-Loop:</span>
            <span id="label-loop-state">Aktif</span>
          </button>

          <!-- Buka di Chat Drawer -->
          <button id="btn-live-voice-switch-drawer" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors" title="Buka Riwayat di Chat Teks">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          </button>

          <!-- Tutup Modal -->
          <button id="btn-close-live-voice" class="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-800 transition-colors" title="Keluar dari Mode Suara">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

        <!-- Insecure origin notice (bila dibuka via 127.0.0.1) -->
        <div id="live-voice-origin-alert" class="w-full max-w-xl mx-auto mb-2 p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/70 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg hidden">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span class="truncate">Akses via <b>127.0.0.1</b> ditandai "Not Secure" oleh Chrome. Buka via <b>localhost:8080</b> agar mikrofon optimal.</span>
          </div>
          <a id="btn-switch-to-localhost" href="http://localhost:8080/" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shrink-0 transition-colors">Buka Localhost</a>
        </div>

        <!-- Center: Holographic Voice Orb & Particle Waveform Canvas -->
        <div class="relative flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto my-auto min-h-[280px]">
          <!-- Holographic Canvas for Sound Wave Visualizer -->
          <canvas id="live-voice-canvas" width="600" height="360" class="w-full max-w-[480px] h-[260px] sm:h-[300px]"></canvas>

          <!-- Dynamic State Indicator Tag below Orb -->
          <div id="live-voice-indicator-text" class="text-sm sm:text-base font-extrabold tracking-wide mt-2 text-center text-slate-300">
            Tekan tombol mikrofon atau mulai berbicara...
          </div>

          <!-- Live Subtitles & Transcript Stream -->
          <div id="live-voice-subtitles-card" class="mt-4 w-full max-w-lg p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-2xl backdrop-blur-xl transition-all duration-300 min-h-[80px] flex flex-col justify-center">
            <div class="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
              <span id="live-voice-subtitle-speaker">Matrix AI</span>
              <div id="live-voice-mic-level-box" class="flex items-center gap-1.5 text-[9px] text-cyan-400 font-mono font-semibold hidden">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span id="live-voice-mic-status-text">Mic Siap</span>
              </div>
            </div>
            <p id="live-voice-subtitle-content" class="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium line-clamp-4">
              "Halo! Aku Matrix AI. Tanyakan soal matematika, konsep aljabar, atau rumus yang ingin kamu diskusikan langsung!"
            </p>
          </div>
        </div>

        <!-- Bottom: Quick Action Prompts & Direct Interaction Bar -->
        <div class="w-full max-w-2xl mx-auto space-y-3 z-10">
          <!-- Quick Prompt Chips -->
          <div class="flex items-center justify-center gap-2 flex-wrap text-xs">
            <button class="live-voice-quick-chip px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer" data-prompt="Jelaskan apa itu diskriminan dan mengapa rumusnya b kuadrat kurang 4ac?">
              Rumus Diskriminan
            </button>
            <button class="live-voice-quick-chip px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer" data-prompt="Bahas soal matematika aktif yang sedang kubuka di layar.">
              Bahas Soal Aktif
            </button>
            <button class="live-voice-quick-chip px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer" data-prompt="Beri aku satu kuis teka-teki logika matematika untuk melatih otak!">
              Kuis Logika
            </button>
            <button class="live-voice-quick-chip px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer" data-prompt="Bagaimana cara mudah memfaktorkan persamaan kuadrat jika koefisien x kuadrat lebih dari 1?">
              Trik Faktorisasi
            </button>
          </div>

          <!-- Direct Input Fallback Bar (jika mikrofon bermasalah / lingkungan bising) -->
          <div class="flex items-center gap-2 max-w-md mx-auto px-2">
            <input
              type="text"
              id="input-live-voice-text"
              placeholder="Ketik soal/pertanyaan langsung di sini jika mic terkendala..."
              class="flex-1 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
            <button
              type="button"
              id="btn-live-voice-send-text"
              class="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30"
            >
              Kirim
            </button>
          </div>

          <!-- Main Interaction Button Container -->
          <div class="flex items-center justify-center gap-4">
            <!-- Interrupt / Jeda Button (muncul saat AI speaking) -->
            <button id="btn-live-voice-interrupt" class="hidden py-3 px-4 rounded-2xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-600/60 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-950/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Jeda AI (Bicara Sekarang)</span>
            </button>

            <!-- Primary Mic Button -->
            <button id="btn-live-voice-main-mic" class="relative group p-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-2xl shadow-cyan-500/40 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center">
              <div id="live-voice-mic-halo" class="absolute -inset-2 rounded-full bg-cyan-400 opacity-30 group-hover:opacity-60 blur-md transition-opacity"></div>
              <svg id="live-voice-mic-icon" class="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
            </button>

            <!-- Manual Send / Done Button (muncul saat user listening) -->
            <button id="btn-live-voice-done-speaking" class="hidden py-3 px-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-600/60 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/30">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Selesai Bicara</span>
            </button>
          </div>

          <div class="text-center text-[11px] text-slate-500">
          Tip: Anda dapat berbicara langsung tanpa menekan tombol jika mode Auto-Loop aktif.
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;
    this.canvasEl = this.modalEl.querySelector("#live-voice-canvas");
    if (this.canvasEl) this.ctx = this.canvasEl.getContext("2d");

    this.bindEvents();
    this.initCanvasLoop();
  }

  bindEvents() {
    const closeBtn = this.modalEl.querySelector("#btn-close-live-voice");
    const switchDrawerBtn = this.modalEl.querySelector("#btn-live-voice-switch-drawer");
    const personaBtn = this.modalEl.querySelector("#btn-live-voice-change-persona");
    const loopBtn = this.modalEl.querySelector("#btn-live-voice-toggle-loop");
    const mainMicBtn = this.modalEl.querySelector("#btn-live-voice-main-mic");
    const interruptBtn = this.modalEl.querySelector("#btn-live-voice-interrupt");
    const doneSpeakingBtn = this.modalEl.querySelector("#btn-live-voice-done-speaking");

    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    if (switchDrawerBtn) {
      switchDrawerBtn.addEventListener("click", () => {
        this.close();
        if (this.aiAgentManager) this.aiAgentManager.openDrawer();
      });
    }

    if (personaBtn) {
      personaBtn.addEventListener("click", () => {
        if (this.voiceCustomizerModal) {
          this.voiceCustomizerModal.openModal();
        }
      });
    }

    if (loopBtn) {
      loopBtn.addEventListener("click", () => {
        this.isHandsFreeLoop = !this.isHandsFreeLoop;
        const lbl = this.modalEl.querySelector("#label-loop-state");
        if (lbl) lbl.textContent = this.isHandsFreeLoop ? "Aktif" : "Manual";
        loopBtn.classList.toggle("bg-cyan-950", this.isHandsFreeLoop);
        loopBtn.classList.toggle("bg-slate-900", !this.isHandsFreeLoop);
      });
    }

    if (mainMicBtn) {
      mainMicBtn.addEventListener("click", () => {
        if (this.state === "listening") {
          this.finishUserSpeech();
        } else if (this.state === "speaking") {
          this.interruptAi();
        } else {
          this.startListeningTurn();
        }
      });
    }

    if (interruptBtn) {
      interruptBtn.addEventListener("click", () => this.interruptAi());
    }

    if (doneSpeakingBtn) {
      doneSpeakingBtn.addEventListener("click", () => this.finishUserSpeech());
    }

    // Quick chips
    const chips = this.modalEl.querySelectorAll(".live-voice-quick-chip");
    chips.forEach((c) => {
      c.addEventListener("click", () => {
        const prompt = c.getAttribute("data-prompt");
        if (prompt) {
          this.handleDirectPrompt(prompt);
        }
      });
    });

    // Fallback direct text input
    const textInput = this.modalEl.querySelector("#input-live-voice-text");
    const sendTextBtn = this.modalEl.querySelector("#btn-live-voice-send-text");
    const submitText = () => {
      if (textInput && textInput.value.trim()) {
        const val = textInput.value.trim();
        textInput.value = "";
        this.handleDirectPrompt(val);
      }
    };
    if (sendTextBtn) sendTextBtn.addEventListener("click", submitText);
    if (textInput) {
      textInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitText();
        }
      });
    }

    // Keyboard ESC to close
    window.addEventListener("keydown", (e) => {
      if (this.isOpen && e.key === "Escape") {
        this.close();
      }
    });
  }

  // =========================================================================
  // STATE MANAGEMENT & UI TRANSITIONS
  // =========================================================================
  setState(newState, detailText = "") {
    this.state = newState;
    const badge = this.modalEl.querySelector("#live-voice-status-badge");
    const indicator = this.modalEl.querySelector("#live-voice-indicator-text");
    const speakerLabel = this.modalEl.querySelector("#live-voice-subtitle-speaker");
    const interruptBtn = this.modalEl.querySelector("#btn-live-voice-interrupt");
    const doneBtn = this.modalEl.querySelector("#btn-live-voice-done-speaking");
    const halo = this.modalEl.querySelector("#live-voice-mic-halo");

    if (newState === "listening") {
      if (badge) {
        badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/80 animate-pulse";
        badge.textContent = "Mendengarkan Anda...";
      }
      if (indicator) {
        indicator.textContent = detailText || "Silakan berbicara... Matrix sedang mendengarkan.";
        indicator.className = "text-sm sm:text-base font-extrabold tracking-wide mt-2 text-center text-emerald-400";
      }
      if (speakerLabel) speakerLabel.textContent = "Anda Berbicara";
      if (doneBtn) doneBtn.classList.remove("hidden");
      if (interruptBtn) interruptBtn.classList.add("hidden");
      if (halo) halo.className = "absolute -inset-3 rounded-full bg-emerald-400 opacity-60 blur-lg animate-pulse";
    } else if (newState === "thinking") {
      if (badge) {
        badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-500/80 animate-pulse";
        badge.textContent = "Matrix Berpikir...";
      }
      if (indicator) {
        indicator.textContent = "Merumuskan solusi matematika...";
        indicator.className = "text-sm sm:text-base font-extrabold tracking-wide mt-2 text-center text-purple-400 animate-pulse";
      }
      if (speakerLabel) speakerLabel.textContent = "Matrix AI";
      if (doneBtn) doneBtn.classList.add("hidden");
      if (interruptBtn) interruptBtn.classList.add("hidden");
      if (halo) halo.className = "absolute -inset-2 rounded-full bg-purple-500 opacity-40 blur-md";
    } else if (newState === "speaking") {
      if (badge) {
        badge.className = "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/80";
        badge.textContent = "Menjelaskan...";
      }
      if (indicator) {
        indicator.textContent = "Matrix sedang menjelaskan jawaban...";
        indicator.className = "text-sm sm:text-base font-extrabold tracking-wide mt-2 text-center text-cyan-300";
      }
      if (speakerLabel) speakerLabel.textContent = "Matrix AI";
      if (doneBtn) doneBtn.classList.add("hidden");
      if (interruptBtn) interruptBtn.classList.remove("hidden");
      if (halo) halo.className = "absolute -inset-3 rounded-full bg-cyan-400 opacity-60 blur-lg animate-pulse";
    } else {
      // idle
      if (badge) {
        badge.className = "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-700";
        badge.textContent = "Siap";
      }
      if (indicator) {
        indicator.textContent = "Tekan mikrofon untuk mulai berbicara";
        indicator.className = "text-sm sm:text-base font-extrabold tracking-wide mt-2 text-center text-slate-400";
      }
      if (doneBtn) doneBtn.classList.add("hidden");
      if (interruptBtn) interruptBtn.classList.add("hidden");
      if (halo) halo.className = "absolute -inset-2 rounded-full bg-cyan-400 opacity-30 group-hover:opacity-60 blur-md";
    }
  }

  setSubtitle(text, speaker = null) {
    const content = this.modalEl.querySelector("#live-voice-subtitle-content");
    const sp = this.modalEl.querySelector("#live-voice-subtitle-speaker");
    if (content) content.textContent = text ? `"${text}"` : "...";
    if (speaker && sp) sp.textContent = speaker;
  }

  // =========================================================================
  // CONVERSATIONAL TURNS (STT -> AI RESPONSE -> TTS -> NEXT TURN)
  // =========================================================================
  startListeningTurn() {
    aiVoiceEngine.stopSpeaking();
    this.setState("listening");
    this.setSubtitle("Mendengarkan ucapan Anda...", "Anda Berbicara");

    this.activeSpeechSession = aiVoiceEngine.startListening({
      onInterimResult: ({ currentText, statusHint }) => {
        if (currentText) {
          this.setSubtitle(currentText, "Anda Berbicara");
          // Dorongan energi akustik seketika saat kata sedang diucapkan
          this.speechEnergy = Math.min(1.0, this.speechEnergy + 0.45);
        } else if (statusHint) {
          const indicator = this.modalEl.querySelector("#live-voice-indicator-text");
          if (indicator) indicator.textContent = statusHint;
        }
      },
      onFinalResult: (finalText) => {
        if (!finalText || !finalText.trim()) {
          this.setState("idle");
          return;
        }
        this.processUserSpeech(finalText.trim());
      },
      onError: (err) => {
        console.warn("LiveVoice STT Error:", err);
        this.setState("idle");
        this.setSubtitle(`Pemberitahuan: ${err.message}`, "Sistem");
      },
      onEnd: ({ fullTranscript } = {}) => {
        if (this.isOpen && this.state === "listening") {
          if (fullTranscript && fullTranscript.trim()) {
            this.processUserSpeech(fullTranscript.trim());
          } else if (this.isHandsFreeLoop) {
            setTimeout(() => {
              if (this.isOpen && this.state === "listening") {
                this.startListeningTurn();
              }
            }, 300);
          } else {
            this.setState("idle");
          }
        }
      },
      onStateChange: ({ isListening, volume }) => {
        this.currentAudioVolume = volume || 0;
        const micBox = this.modalEl.querySelector("#live-voice-mic-level-box");
        const micStatusText = this.modalEl.querySelector("#live-voice-mic-status-text");
        if (micBox) {
          if (isListening) {
            micBox.classList.remove("hidden");
            if (volume > 0.05) {
              if (micStatusText) micStatusText.textContent = "Suara Masuk";
              micBox.className = "flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono font-semibold";
            } else {
              if (micStatusText) micStatusText.textContent = "Mic Siap";
              micBox.className = "flex items-center gap-1.5 text-[9px] text-cyan-400 font-mono font-semibold";
            }
          } else {
            micBox.classList.add("hidden");
          }
        }
      }
    });
  }

  finishUserSpeech() {
    if (this.activeSpeechSession) {
      const recordedText = this.activeSpeechSession.stop();
      if (recordedText) {
        this.processUserSpeech(recordedText);
      } else {
        this.setState("idle");
      }
    } else {
      this.setState("idle");
    }
  }

  interruptAi() {
    aiVoiceEngine.stopSpeaking();
    this.startListeningTurn();
  }

  async handleDirectPrompt(promptText) {
    aiVoiceEngine.stopSpeaking();
    this.setSubtitle(promptText, "Anda");
    await this.processUserSpeech(promptText);
  }

  async processUserSpeech(userSpeech) {
    if (!userSpeech) return;

    aiVoiceEngine.stopListening();
    this.setState("thinking");

    // Catat pesan pengguna ke dalam chat history AiAgentManager
    const userMsg = {
      sender: "user",
      text: userSpeech,
      timestamp: new Date()
    };
    if (this.aiAgentManager) {
      this.aiAgentManager.messages.push(userMsg);
      if (this.aiAgentManager.activeSession) {
        this.aiAgentManager.activeSession.messages = this.aiAgentManager.messages;
        this.aiAgentManager.activeSession.updatedAt = Date.now();
      }
      this.aiAgentManager.saveHistory();
      this.aiAgentManager.appendMessageBubble(userMsg);
    }

    try {
      let aiResponseText = "";
      if (this.aiAgentManager) {
        aiResponseText = await this.aiAgentManager.generateResponse(userSpeech);
        aiResponseText = this.aiAgentManager.cleanLeadingGreeting(aiResponseText);
      } else {
        aiResponseText = "Saya menerima ucapan Anda: " + userSpeech;
      }

      // Catat respon AI ke chat history
      const aiMsg = {
        sender: "assistant",
        text: aiResponseText,
        timestamp: new Date()
      };
      if (this.aiAgentManager) {
        this.aiAgentManager.messages.push(aiMsg);
        if (this.aiAgentManager.activeSession) {
          this.aiAgentManager.activeSession.messages = this.aiAgentManager.messages;
          this.aiAgentManager.activeSession.updatedAt = Date.now();
        }
        this.aiAgentManager.saveHistory();
        this.aiAgentManager.appendMessageBubble(aiMsg);
      }

      this.speakAiResponse(aiResponseText);
    } catch (err) {
      console.error("Gagal mendapatkan respons AI di Live Voice:", err);
      this.setState("idle");
      this.setSubtitle("Maaf, terjadi kendala saat memproses jawaban. Silakan coba lagi.", "Matrix AI");
    }
  }

  speakAiResponse(aiText) {
    this.setState("speaking");
    this.setSubtitle(aiText, "Matrix AI");

    aiVoiceEngine.speak(aiText, {
      onStart: () => {
        this.setState("speaking");
      },
      onEnd: () => {
        if (!this.isOpen) return;

        // Jika mode auto-loop aktif, tunggu 1.2 detik lalu otomatis mendengarkan lagi!
        if (this.isHandsFreeLoop) {
          this.setState("idle", "Menyiapkan giliran bicara Anda...");
          setTimeout(() => {
            if (this.isOpen && this.state !== "listening") {
              this.startListeningTurn();
            }
          }, 1200);
        } else {
          this.setState("idle");
        }
      },
      onError: () => {
        this.setState("idle");
      }
    });
  }

  // =========================================================================
  // HOLOGRAPHIC 60FPS CANVAS VISUALIZER
  // =========================================================================
  initCanvasLoop() {
    if (!this.canvasEl || !this.ctx) return;

    const render = () => {
      this.drawCanvasFrame();
      this.animFrameId = requestAnimationFrame(render);
    };

    render();
  }

  drawCanvasFrame() {
    if (!this.ctx || !this.canvasEl || !this.isOpen) return;

    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);
    this.visualizerPhase += 0.038;

    // 1. Ambil sinyal audio fisik langsung & aktivitas vokal
    const metrics = aiVoiceEngine.getLiveAudioMetrics();
    let instantVol = metrics.volume || this.currentAudioVolume || 0;

    if (this.state === "listening") {
      if (this.speechEnergy > 0) {
        instantVol = Math.max(instantVol, this.speechEnergy);
        this.speechEnergy *= 0.95; // peluruhan halus setelah kata diucapkan
      }
    } else if (this.state === "speaking") {
      // AI sedang berbicara lisan: irama nafas & modulasi frekuensi suara Matrix AI
      const cadence = Math.sin(this.visualizerPhase * 3.8) * 0.35 +
                      Math.cos(this.visualizerPhase * 7.5) * 0.22;
      instantVol = 0.36 + Math.max(0, cadence) * 0.42;
    } else if (this.state === "thinking") {
      instantVol = 0.18 + Math.sin(this.visualizerPhase * 4) * 0.12;
    } else {
      instantVol = 0.07 + Math.sin(this.visualizerPhase * 1.5) * 0.04;
    }

    // Envelope follower (cepat tanggap merespons vokal masuk, luruh halus)
    const attack = 0.35;
    const release = 0.085;
    if (instantVol > this.smoothVolume) {
      this.smoothVolume += (instantVol - this.smoothVolume) * attack;
    } else {
      this.smoothVolume += (instantVol - this.smoothVolume) * release;
    }

    // 2. Parameter Geometris & Palet Warna Kosmik
    const baseRadius = 56 + this.smoothVolume * 22;
    const waveAmplitude = 12 + this.smoothVolume * 38;

    let primaryColor = "#38bdf8"; // Electric cyan
    let secondaryColor = "#2dd4bf"; // Neon turquoise
    let auraGlowColor = `rgba(56, 189, 248, ${0.4 + this.smoothVolume * 0.35})`;
    let coreGradStart = "#e0f2fe";
    let coreGradMid = "#38bdf8";
    let coreGradOuter = "#0284c7";

    if (this.state === "listening") {
      primaryColor = "#38bdf8";
      secondaryColor = "#2dd4bf";
      auraGlowColor = `rgba(56, 189, 248, ${0.45 + this.smoothVolume * 0.4})`;
      coreGradStart = "#f0fdfa";
      coreGradMid = "#38bdf8";
      coreGradOuter = "#0369a1";
    } else if (this.state === "thinking") {
      primaryColor = "#c084fc";
      secondaryColor = "#a855f7";
      auraGlowColor = "rgba(192, 132, 252, 0.55)";
      coreGradStart = "#faf5ff";
      coreGradMid = "#c084fc";
      coreGradOuter = "#7e22ce";
    } else if (this.state === "speaking") {
      primaryColor = "#60a5fa";
      secondaryColor = "#38bdf8";
      auraGlowColor = `rgba(96, 165, 250, ${0.45 + this.smoothVolume * 0.35})`;
      coreGradStart = "#eff6ff";
      coreGradMid = "#60a5fa";
      coreGradOuter = "#1d4ed8";
    }

    // 3. Shockwave Riak Suara Melebar Keluar saat Suara Berbicara (Echo Ripples)
    const now = performance.now();
    if (this.state === "listening" && this.smoothVolume > 0.18 && (now - this.lastRippleTime > 180)) {
      this.outwardRipples.push({
        radius: baseRadius + 6,
        maxRadius: baseRadius + 115 + this.smoothVolume * 65,
        alpha: 0.68 * this.smoothVolume,
        speed: 2.4 + this.smoothVolume * 3.4,
        lineWidth: 1.8,
        phase: this.visualizerPhase
      });
      this.lastRippleTime = now;
    }

    // Gambar riak gelombang yang merambat keluar
    for (let rIdx = this.outwardRipples.length - 1; rIdx >= 0; rIdx--) {
      const rip = this.outwardRipples[rIdx];
      rip.radius += rip.speed;
      rip.alpha *= 0.948;

      if (rip.alpha <= 0.02 || rip.radius >= rip.maxRadius) {
        this.outwardRipples.splice(rIdx, 1);
        continue;
      }

      const ripPtsCount = 56;
      const ripPts = [];
      for (let p = 0; p < ripPtsCount; p++) {
        const theta = (p / ripPtsCount) * Math.PI * 2;
        const wave = Math.sin(theta * 5 + rip.phase) * (4 + this.smoothVolume * 7) +
                     Math.cos(theta * 3 - rip.phase * 1.5) * 3;
        const rDist = rip.radius + wave;
        ripPts.push({
          x: cx + Math.cos(theta) * rDist,
          y: cy + Math.sin(theta) * rDist
        });
      }

      this.ctx.beginPath();
      const firstMid = {
        x: (ripPts[ripPtsCount - 1].x + ripPts[0].x) / 2,
        y: (ripPts[ripPtsCount - 1].y + ripPts[0].y) / 2
      };
      this.ctx.moveTo(firstMid.x, firstMid.y);

      for (let p = 0; p < ripPtsCount; p++) {
        const next = ripPts[(p + 1) % ripPtsCount];
        const mid = {
          x: (ripPts[p].x + next.x) / 2,
          y: (ripPts[p].y + next.y) / 2
        };
        this.ctx.quadraticCurveTo(ripPts[p].x, ripPts[p].y, mid.x, mid.y);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = secondaryColor;
      this.ctx.lineWidth = rip.lineWidth;
      this.ctx.globalAlpha = Math.min(1.0, rip.alpha);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
    }

    // 4. Outer Cosmic Aura Glow
    const auraRad = baseRadius + 80 + this.smoothVolume * 45;
    const auraGrad = this.ctx.createRadialGradient(cx, cy, baseRadius * 0.35, cx, cy, auraRad);
    auraGrad.addColorStop(0, auraGlowColor);
    auraGrad.addColorStop(0.55, "rgba(15, 23, 42, 0.22)");
    auraGrad.addColorStop(1, "rgba(2, 6, 23, 0)");

    this.ctx.fillStyle = auraGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, auraRad, 0, Math.PI * 2);
    this.ctx.fill();

    // 5. Cincin Gelombang Akustik Organis Cair (Fluid Organic Wave Loops - Bezier Splines)
    // 4 layer cincin bergetar dinamis merefleksikan vokal & konsonan
    const ringCount = 4;
    const pointsPerRing = 96; // Resolusi tinggi kurva cairan tanpa kaku

    for (let r = 0; r < ringCount; r++) {
      const ringOffset = 10 + r * 14 + (this.smoothVolume * r * 7);
      const currentRingRadius = baseRadius + ringOffset;
      const ringPts = [];

      // Kecepatan dan arah putaran berbeda antar layer
      const ringPhase = this.visualizerPhase * (1.2 + r * 0.32) * (r % 2 === 0 ? 1 : -1);

      for (let i = 0; i < pointsPerRing; i++) {
        const theta = (i / pointsPerRing) * Math.PI * 2;

        // Multi-harmonic fluid wave deformer
        const h1 = Math.sin(theta * 3 + ringPhase + r * 1.1) * 0.44;
        const h2 = Math.cos(theta * 5 - ringPhase * 1.4 - r * 0.7) * 0.32;
        const h3 = Math.sin(theta * 7 + ringPhase * 2.1 + r) * 0.24;

        // VIBRASI SUARA NYATA (Acoustic Tremor & Voice Jitter):
        // Merefleksikan frekuensi getaran suara kita saat masuk
        const voiceTremor = (this.smoothVolume > 0.03)
          ? (Math.sin(theta * 11 + this.visualizerPhase * 18) * 0.6 +
             Math.cos(theta * 16 - this.visualizerPhase * 26) * 0.4) * (this.smoothVolume * 11)
          : 0;

        const fluidDistortion = (h1 + h2 + h3) * waveAmplitude + voiceTremor;
        const dist = currentRingRadius + fluidDistortion;

        ringPts.push({
          x: cx + Math.cos(theta) * dist,
          y: cy + Math.sin(theta) * dist
        });
      }

      // Gambar kurva menggunakan Quadratic Bezier Spline antar titik tengah (mulus cairan!)
      this.ctx.beginPath();
      const initialMid = {
        x: (ringPts[pointsPerRing - 1].x + ringPts[0].x) / 2,
        y: (ringPts[pointsPerRing - 1].y + ringPts[0].y) / 2
      };
      this.ctx.moveTo(initialMid.x, initialMid.y);

      for (let i = 0; i < pointsPerRing; i++) {
        const next = ringPts[(i + 1) % pointsPerRing];
        const mid = {
          x: (ringPts[i].x + next.x) / 2,
          y: (ringPts[i].y + next.y) / 2
        };
        this.ctx.quadraticCurveTo(ringPts[i].x, ringPts[i].y, mid.x, mid.y);
      }
      this.ctx.closePath();

      // Gradasi & kilau neon per cincin
      const ringAlpha = Math.max(0.2, (0.85 - r * 0.18) * (0.7 + this.smoothVolume * 0.45));
      this.ctx.globalAlpha = Math.min(1.0, ringAlpha);
      this.ctx.strokeStyle = r % 2 === 0 ? primaryColor : secondaryColor;
      this.ctx.lineWidth = Math.max(1.2, 2.4 - r * 0.35 + this.smoothVolume * 1.2);

      // Neon glow pada gelombang utama
      if (r < 2) {
        this.ctx.shadowBlur = 8 + this.smoothVolume * 16;
        this.ctx.shadowColor = primaryColor;
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1.0;
    }

    // 6. Luminous Orbit Sound Particles (Partikel nada suara beredar aktif)
    this.particles.forEach((pt) => {
      pt.angle += pt.speed * (1 + this.smoothVolume * 2.8);
      const radWobble = Math.sin(pt.angle * 4 + this.visualizerPhase * 2 + pt.wobblePhase) * (6 + this.smoothVolume * 14);
      const pDist = baseRadius + 16 + pt.radiusOffset + radWobble;
      const px = cx + Math.cos(pt.angle) * pDist;
      const py = cy + Math.sin(pt.angle) * pDist;

      this.ctx.fillStyle = pt.angle % 2 === 0 ? primaryColor : secondaryColor;
      this.ctx.shadowBlur = 6 + this.smoothVolume * 10;
      this.ctx.shadowColor = primaryColor;
      this.ctx.globalAlpha = Math.min(1.0, pt.alpha + this.smoothVolume * 0.45);

      this.ctx.beginPath();
      this.ctx.arc(px, py, pt.size * (1 + this.smoothVolume * 0.7), 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1.0;
    });

    // 7. Bola Inti 3D (Living Core Sphere with Bass Vibration)
    // Bola berdenyut fisik mengikuti ketukan dan intonasi suara
    const bassTremor = (this.smoothVolume > 0.04)
      ? Math.sin(this.visualizerPhase * 14) * (this.smoothVolume * 3.4)
      : 0;
    const orbRadius = Math.max(32, baseRadius - 6 + bassTremor);

    // Gradasi 3D Bola
    const lightOffsetX = -orbRadius * 0.34;
    const lightOffsetY = -orbRadius * 0.34;
    const coreGrad = this.ctx.createRadialGradient(
      cx + lightOffsetX, cy + lightOffsetY, 3,
      cx, cy, orbRadius
    );
    coreGrad.addColorStop(0, coreGradStart);
    coreGrad.addColorStop(0.24, coreGradMid);
    coreGrad.addColorStop(0.68, coreGradOuter);
    coreGrad.addColorStop(0.9, "#0b192c");
    coreGrad.addColorStop(1, "#020617");

    this.ctx.fillStyle = coreGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // 8. Pantulan Cahaya Spekular (*Specular Highlight*)
    const specGrad = this.ctx.createRadialGradient(
      cx + lightOffsetX, cy + lightOffsetY, 1,
      cx + lightOffsetX, cy + lightOffsetY, orbRadius * 0.36
    );
    specGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    specGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.75)");
    specGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.18)");
    specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

    this.ctx.fillStyle = specGrad;
    this.ctx.beginPath();
    this.ctx.arc(cx + lightOffsetX, cy + lightOffsetY, orbRadius * 0.36, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // =========================================================================
  // OPEN & CLOSE CONTROLS
  // =========================================================================
  open() {
    this.isOpen = true;
    if (this.modalEl) {
      this.modalEl.classList.remove("hidden");

      // Periksa apakah pengguna membuka melalui IP numerik 127.0.0.1
      const originAlert = this.modalEl.querySelector("#live-voice-origin-alert");
      if (originAlert) {
        if (window.location.hostname === "127.0.0.1") {
          originAlert.classList.remove("hidden");
        } else {
          originAlert.classList.add("hidden");
        }
      }
    }

    // Sync active persona name
    const persona = aiVoiceEngine.getPersona();
    const personaLabel = this.modalEl.querySelector("#live-voice-persona-name");
    if (personaLabel) {
      personaLabel.textContent = `${persona.name} (${persona.badge || "Aktif"})`;
    }

    // Mulai siklus bicara pertama setelah pembukaan
    setTimeout(() => {
      this.startListeningTurn();
    }, 400);
  }

  close() {
    this.isOpen = false;
    aiVoiceEngine.stopListening();
    aiVoiceEngine.stopSpeaking();
    aiVoiceEngine.releaseMicrophone();
    this.setState("idle");

    if (this.modalEl) {
      this.modalEl.classList.add("hidden");
    }
  }
}
