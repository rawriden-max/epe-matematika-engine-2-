/**
 * voiceCustomizerModal.js - Modal Studio Kustomisasi Karakter & Nada Suara AI
 * Error Pattern Engine (EPE) V2 / V3
 */

import { aiVoiceEngine, VOICE_PERSONAS } from "../ai/aiVoiceEngine.js";

export class VoiceCustomizerModal {
  constructor({ onVoiceSaved } = {}) {
    this.onVoiceSaved = onVoiceSaved;
    this.modalEl = null;
    this.selectedPersona = aiVoiceEngine.config.persona || "mentor";
    this.selectedVoiceURI = aiVoiceEngine.config.voiceURI || "";
    this.selectedPitch = Number(aiVoiceEngine.config.pitch) || 1.15;
    this.selectedRate = Number(aiVoiceEngine.config.rate) || 1.05;
    this.selectedVolume = Number(aiVoiceEngine.config.volume) || 1.0;

    this.render();
  }

  render() {
    let existing = document.getElementById("ai-voice-customizer-modal");
    if (existing) {
      this.modalEl = existing;
      return;
    }

    const modal = document.createElement("div");
    modal.id = "ai-voice-customizer-modal";
    modal.className = "fixed inset-0 z-[100005] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md hidden transition-all duration-300";
    modal.innerHTML = `
      <div class="card-clean max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-700/80 bg-slate-900/98 max-h-[92vh] overflow-y-auto rounded-2xl relative text-white">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                Karakter &amp; Studio Suara AI
              </h3>
              <p class="text-[11px] text-slate-400">Sesuaikan persona bicara, nada, dan tempo Matrix AI</p>
            </div>
          </div>
          <button id="btn-close-voice-customizer" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Tutup">
            ✕
          </button>
        </div>

        <!-- Section 1: 5 Preset Persona Suara -->
        <div class="space-y-2">
          <label class="block text-xs font-bold text-slate-200">
            1. Persona Karakter AI:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2" id="voice-persona-cards-container">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Section 2: Pilihan Mesin Suara Sistem Browser -->
        <div class="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-slate-200">
              2. Mesin Suara Sistem (TTS Engine):
            </label>
            <span class="text-[10px] text-slate-400" id="voice-engine-detected-count">Memuat suara...</span>
          </div>
          <select id="voice-engine-select" class="input-clean w-full p-2.5 text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg">
            <option value="">Otomatis (Rekomendasi Persona)</option>
          </select>
          <p class="text-[10.5px] text-slate-400 flex items-center gap-1">
            <svg class="w-3 h-3 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Daftar suara diambil dari paket bahasa yang terpasang di OS / Browser Anda.</span>
          </p>
        </div>

        <!-- Section 3: Fine-Tuning Slider (Pitch & Speed) -->
        <div class="space-y-3 pt-2 border-t border-slate-800/80">
          <label class="block text-xs font-bold text-slate-200">
            3. Pengaturan Nada &amp; Tempo Bicara:
          </label>
          
          <!-- Pitch Slider -->
          <div class="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300 font-semibold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                <span>Tinggi Nada (Pitch)</span>
              </span>
              <span id="label-voice-pitch" class="font-mono text-cyan-400 font-bold">1.15x</span>
            </div>
            <input type="range" id="slider-voice-pitch" min="0.6" max="1.8" step="0.05" value="1.15" class="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
            <div class="flex justify-between text-[9.5px] text-slate-400 px-0.5">
              <span>Berat (0.6x)</span>
              <span>Normal (1.0x)</span>
              <span>Ceria (1.8x)</span>
            </div>
          </div>

          <!-- Rate / Speed Slider -->
          <div class="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300 font-semibold flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>Kecepatan Bicara (Speed)</span>
              </span>
              <span id="label-voice-rate" class="font-mono text-indigo-400 font-bold">1.05x</span>
            </div>
            <input type="range" id="slider-voice-rate" min="0.7" max="1.6" step="0.05" value="1.05" class="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
            <div class="flex justify-between text-[9.5px] text-slate-400 px-0.5">
              <span>Santai (0.7x)</span>
              <span>Standar (1.0x)</span>
              <span>Cepat (1.6x)</span>
            </div>
          </div>
        </div>

        <!-- Sample preview box -->
        <div id="voice-preview-banner" class="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11.5px] text-cyan-200 flex items-start gap-2.5">
          <svg class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <p id="voice-preview-text" class="italic flex-1">"Halo! Aku Matrix AI, siap membantumu memahami matematika dengan seru dan mudah!"</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
          <button id="btn-test-current-voice" type="button" class="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 border border-cyan-800/60 hover:bg-cyan-950/40 font-semibold">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <span>Uji Coba Suara</span>
          </button>
          
          <div class="flex items-center gap-2">
            <button id="btn-cancel-voice-customizer" type="button" class="btn-secondary py-2 px-3 text-xs text-slate-300">
              Batal
            </button>
            <button id="btn-save-voice-customizer" type="button" class="btn-primary py-2 px-4 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20">
              Simpan Karakter Suara
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    this.bindEvents();
    this.populatePersonas();
    this.populateVoices();
  }

  populatePersonas() {
    const container = this.modalEl.querySelector("#voice-persona-cards-container");
    if (!container) return;

    container.innerHTML = Object.values(VOICE_PERSONAS).map((p) => {
      const isSelected = p.id === this.selectedPersona;
      return `
        <div 
          class="voice-persona-card p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
            isSelected
              ? "bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30 shadow-md"
              : "bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
          }"
          data-persona-id="${p.id}"
        >
          <div class="flex items-center gap-2.5 mb-1.5">
            <div class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
              ${p.svgIcon || ""}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-white truncate flex items-center justify-between">
                <span>${p.name}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isSelected ? "bg-cyan-950 text-cyan-400 border border-cyan-700" : "bg-slate-900 text-slate-400 border border-slate-800"
                }">${p.badge || "PRO"}</span>
              </div>
            </div>
          </div>
          <p class="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">${p.description}</p>
        </div>
      `;
    }).join("");
  }

  populateVoices() {
    const select = this.modalEl.querySelector("#voice-engine-select");
    const countEl = this.modalEl.querySelector("#voice-engine-detected-count");
    if (!select) return;

    const { indonesian, all } = aiVoiceEngine.getAvailableVoices();

    if (countEl) {
      countEl.textContent = `${all.length} suara terdeteksi (${indonesian.length} Bahasa Indonesia)`;
    }

    let html = `<option value="">Otomatis (Sesuai Persona)</option>`;

    if (indonesian.length > 0) {
      html += `<optgroup label="Bahasa Indonesia (Rekomendasi)">`;
      indonesian.forEach((v) => {
        const isSel = v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI;
        html += `<option value="${v.voiceURI || v.name}" ${isSel ? "selected" : ""}>${v.name} (${v.lang})</option>`;
      });
      html += `</optgroup>`;
    }

    const others = all.filter((v) => !v.lang.toLowerCase().includes("id"));
    if (others.length > 0) {
      html += `<optgroup label="Suara Sistem Internasional">`;
      others.slice(0, 20).forEach((v) => {
        const isSel = v.voiceURI === this.selectedVoiceURI || v.name === this.selectedVoiceURI;
        html += `<option value="${v.voiceURI || v.name}" ${isSel ? "selected" : ""}>${v.name} (${v.lang})</option>`;
      });
      html += `</optgroup>`;
    }

    select.innerHTML = html;
  }

  bindEvents() {
    const closeBtn = this.modalEl.querySelector("#btn-close-voice-customizer");
    const cancelBtn = this.modalEl.querySelector("#btn-cancel-voice-customizer");
    const saveBtn = this.modalEl.querySelector("#btn-save-voice-customizer");
    const testBtn = this.modalEl.querySelector("#btn-test-current-voice");
    const pitchSlider = this.modalEl.querySelector("#slider-voice-pitch");
    const rateSlider = this.modalEl.querySelector("#slider-voice-rate");
    const voiceSelect = this.modalEl.querySelector("#voice-engine-select");

    const closeHandler = () => this.closeModal();
    if (closeBtn) closeBtn.addEventListener("click", closeHandler);
    if (cancelBtn) cancelBtn.addEventListener("click", closeHandler);

    // Persona Selection
    const personaContainer = this.modalEl.querySelector("#voice-persona-cards-container");
    if (personaContainer) {
      personaContainer.addEventListener("click", (e) => {
        const card = e.target.closest(".voice-persona-card");
        if (card) {
          const pid = card.getAttribute("data-persona-id");
          this.applyPersona(pid);
        }
      });
    }

    // Voice select change
    if (voiceSelect) {
      voiceSelect.addEventListener("change", () => {
        this.selectedVoiceURI = voiceSelect.value;
      });
    }

    // Pitch Slider
    if (pitchSlider) {
      pitchSlider.addEventListener("input", (e) => {
        this.selectedPitch = parseFloat(e.target.value);
        const lbl = this.modalEl.querySelector("#label-voice-pitch");
        if (lbl) lbl.textContent = `${this.selectedPitch.toFixed(2)}x`;
      });
    }

    // Rate Slider
    if (rateSlider) {
      rateSlider.addEventListener("input", (e) => {
        this.selectedRate = parseFloat(e.target.value);
        const lbl = this.modalEl.querySelector("#label-voice-rate");
        if (lbl) lbl.textContent = `${this.selectedRate.toFixed(2)}x`;
      });
    }

    // Test Voice
    if (testBtn) {
      testBtn.addEventListener("click", () => {
        const persona = VOICE_PERSONAS[this.selectedPersona] || VOICE_PERSONAS.mentor;
        aiVoiceEngine.speak(persona.sampleText, {
          customConfig: {
            persona: this.selectedPersona,
            voiceURI: this.selectedVoiceURI,
            pitch: this.selectedPitch,
            rate: this.selectedRate,
            volume: this.selectedVolume
          }
        });
      });
    }

    // Save
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        aiVoiceEngine.saveConfig({
          persona: this.selectedPersona,
          voiceURI: this.selectedVoiceURI,
          pitch: this.selectedPitch,
          rate: this.selectedRate,
          volume: this.selectedVolume
        });

        if (this.onVoiceSaved) {
          this.onVoiceSaved(aiVoiceEngine.config);
        }

        if (window.NotificationToast) {
          window.NotificationToast.show("Karakter suara AI berhasil disimpan!", "success");
        }

        this.closeModal();
      });
    }

    // Backdrop click close
    this.modalEl.addEventListener("click", (e) => {
      if (e.target === this.modalEl) {
        this.closeModal();
      }
    });
  }

  applyPersona(personaId) {
    if (!VOICE_PERSONAS[personaId]) return;
    this.selectedPersona = personaId;
    const p = VOICE_PERSONAS[personaId];

    this.selectedPitch = p.pitch;
    this.selectedRate = p.rate;

    const pitchSlider = this.modalEl.querySelector("#slider-voice-pitch");
    const rateSlider = this.modalEl.querySelector("#slider-voice-rate");
    const pitchLbl = this.modalEl.querySelector("#label-voice-pitch");
    const rateLbl = this.modalEl.querySelector("#label-voice-rate");
    const previewText = this.modalEl.querySelector("#voice-preview-text");

    if (pitchSlider) pitchSlider.value = p.pitch;
    if (rateSlider) rateSlider.value = p.rate;
    if (pitchLbl) pitchLbl.textContent = `${p.pitch.toFixed(2)}x`;
    if (rateLbl) rateLbl.textContent = `${p.rate.toFixed(2)}x`;
    if (previewText) previewText.textContent = `"${p.sampleText}"`;

    this.populatePersonas();
  }

  openModal() {
    this.selectedPersona = aiVoiceEngine.config.persona || "mentor";
    this.selectedVoiceURI = aiVoiceEngine.config.voiceURI || "";
    this.selectedPitch = Number(aiVoiceEngine.config.pitch) || 1.15;
    this.selectedRate = Number(aiVoiceEngine.config.rate) || 1.05;

    this.populatePersonas();
    this.populateVoices();

    const pitchSlider = this.modalEl.querySelector("#slider-voice-pitch");
    const rateSlider = this.modalEl.querySelector("#slider-voice-rate");
    const pitchLbl = this.modalEl.querySelector("#label-voice-pitch");
    const rateLbl = this.modalEl.querySelector("#label-voice-rate");

    if (pitchSlider) pitchSlider.value = this.selectedPitch;
    if (rateSlider) rateSlider.value = this.selectedRate;
    if (pitchLbl) pitchLbl.textContent = `${this.selectedPitch.toFixed(2)}x`;
    if (rateLbl) rateLbl.textContent = `${this.selectedRate.toFixed(2)}x`;

    const persona = VOICE_PERSONAS[this.selectedPersona] || VOICE_PERSONAS.mentor;
    const previewText = this.modalEl.querySelector("#voice-preview-text");
    if (previewText) previewText.textContent = `"${persona.sampleText}"`;

    this.modalEl.classList.remove("hidden");
  }

  closeModal() {
    aiVoiceEngine.stopSpeaking();
    if (this.modalEl) {
      this.modalEl.classList.add("hidden");
    }
  }
}
