/**
 * voiceCustomizerModal.js - Modal Studio Kustomisasi Karakter, Gender & Nada Suara AI
 * Error Pattern Engine (EPE) V2 / V3
 * 
 * Pembaruan:
 * - Dukungan Pemilihan Gender (Wanita, Pria, Sesuai Persona)
 * - Penyesuaian Tempo Santai yang Alami (0.92x, bukan lambat kura-kura)
 * - Kontras Tinggi Tajam (Fix teks tidak terlihat di mode terang/gelap)
 */

import { aiVoiceEngine, VOICE_PERSONAS } from "../ai/aiVoiceEngine.js";

export class VoiceCustomizerModal {
  constructor({ onVoiceSaved } = {}) {
    this.onVoiceSaved = onVoiceSaved;
    this.modalEl = null;
    this.selectedPersona = aiVoiceEngine.config.persona || "mentor";
    this.selectedGender = aiVoiceEngine.config.gender || "auto"; // "auto" | "female" | "male"
    this.selectedVoiceURI = aiVoiceEngine.config.voiceURI || "";
    this.selectedPitch = Number(aiVoiceEngine.config.pitch) || 1.15;
    this.selectedRate = Number(aiVoiceEngine.config.rate) || 1.02;
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
    modal.className = "fixed inset-0 z-[100005] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md hidden transition-all duration-300";
    modal.innerHTML = `
      <div class="max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border-2 border-slate-700/90 bg-[#0f172a] max-h-[92vh] overflow-y-auto rounded-2xl relative text-white" style="background-color: #0f172a !important; color: #ffffff !important;">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/10 shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            </div>
            <div>
              <h3 class="text-base font-extrabold text-white flex items-center gap-2">
                Karakter &amp; Studio Suara AI
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">PRO TTS</span>
              </h3>
              <p class="text-xs text-slate-300 font-medium">Sesuaikan persona bicara, gender, nada, dan tempo Matrix AI</p>
            </div>
          </div>
          <button id="btn-close-voice-customizer" class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer" title="Tutup">
            ✕
          </button>
        </div>

        <!-- Section 1: Pilihan Gender Suara (NEW USER REQUEST) -->
        <div class="space-y-2 bg-slate-900/90 p-3.5 rounded-xl border border-slate-700/80">
          <div class="flex items-center justify-between">
            <label class="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
              1. Pilihan Gender Suara:
            </label>
            <span id="voice-gender-active-badge" class="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Otomatis</span>
          </div>
          <div class="grid grid-cols-3 gap-2" id="voice-gender-buttons-group">
            <button type="button" class="voice-gender-btn py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-slate-950 border-slate-700 text-slate-300 hover:border-pink-500 hover:text-white" data-gender="female">
              <span>🌸</span>
              <span>Wanita</span>
            </button>
            <button type="button" class="voice-gender-btn py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-slate-950 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white" data-gender="male">
              <span>👔</span>
              <span>Pria</span>
            </button>
            <button type="button" class="voice-gender-btn py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-slate-950 border-slate-700 text-slate-300 hover:border-amber-500 hover:text-white active" data-gender="auto">
              <span>⚡</span>
              <span>Sesuai Persona</span>
            </button>
          </div>
        </div>

        <!-- Section 2: 5 Preset Persona Suara -->
        <div class="space-y-2">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
            2. Persona Karakter AI:
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="voice-persona-cards-container">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Section 3: Pilihan Mesin Suara Sistem Browser -->
        <div class="space-y-1.5 pt-2 border-t border-slate-700">
          <div class="flex items-center justify-between">
            <label class="text-xs font-extrabold uppercase tracking-wider text-amber-300">
              3. Mesin Suara Sistem (TTS Engine):
            </label>
            <span class="text-[11px] text-cyan-300 font-semibold" id="voice-engine-detected-count">Memuat suara...</span>
          </div>
          <select id="voice-engine-select" class="w-full p-2.5 text-xs bg-slate-950 border-2 border-slate-600 text-white rounded-xl focus:border-amber-400 focus:outline-none font-medium cursor-pointer">
            <option value="">Otomatis (Sesuai Persona)</option>
          </select>
          <p class="text-[11px] text-slate-300 flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Daftar suara diambil dari paket bahasa sistem operasi dan browser Anda.</span>
          </p>
        </div>

        <!-- Section 4: Fine-Tuning Slider (Pitch & Speed) -->
        <div class="space-y-3 pt-2 border-t border-slate-700">
          <label class="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
            4. Pengaturan Nada &amp; Tempo Bicara:
          </label>
          
          <!-- Pitch Slider -->
          <div class="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-700">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-white flex items-center gap-1.5">
                <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                <span>Tinggi Nada (Pitch)</span>
              </span>
              <span id="label-voice-pitch" class="font-mono text-cyan-300 text-sm font-extrabold">1.15x</span>
            </div>
            <input type="range" id="slider-voice-pitch" min="0.75" max="1.45" step="0.02" value="1.15" class="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg" />
            <div class="flex justify-between text-[10px] text-slate-300 font-semibold px-0.5">
              <span>Maskulin / Berat (0.75x)</span>
              <span>Netral (1.00x)</span>
              <span>Feminim / Ceria (1.45x)</span>
            </div>
          </div>

          <!-- Rate / Speed Slider (Calibrated for Natural Human Cadence) -->
          <div class="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-700">
            <div class="flex items-center justify-between text-xs font-bold">
              <span class="text-white flex items-center gap-1.5">
                <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span>Kecepatan Bicara (Speed)</span>
              </span>
              <span id="label-voice-rate" class="font-mono text-amber-300 text-sm font-extrabold">1.02x</span>
            </div>
            <!-- Min 0.88x (Santai Alami, bukan 0.6x kura-kura!), Max 1.25x (Cepat Berwibawa) -->
            <input type="range" id="slider-voice-rate" min="0.88" max="1.25" step="0.02" value="1.02" class="w-full accent-amber-400 cursor-pointer h-2 bg-slate-800 rounded-lg" />
            <div class="flex justify-between text-[10px] text-slate-300 font-semibold px-0.5">
              <span class="text-emerald-400">Santai Tenang (0.92x)</span>
              <span class="text-amber-300">Standar Alami (1.02x)</span>
              <span class="text-cyan-400">Cepat Dinamis (1.20x)</span>
            </div>
          </div>
        </div>

        <!-- Sample preview box -->
        <div id="voice-preview-banner" class="p-3 rounded-xl bg-slate-900 border-2 border-cyan-500/40 text-xs text-cyan-200 flex items-start gap-2.5 shadow-inner">
          <svg class="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          <p id="voice-preview-text" class="italic flex-1 text-slate-200 font-medium">"Halo! Aku Matrix AI, siap membantumu memahami matematika dengan seru dan mudah!"</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between gap-3 pt-3 border-t border-slate-700">
          <button id="btn-test-current-voice" type="button" class="py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-2 text-cyan-300 bg-slate-800 hover:bg-slate-700 border border-cyan-500/50 font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer">
            <svg class="w-3.5 h-3.5 fill-current text-cyan-400" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <span>Uji Coba Suara</span>
          </button>
          
          <div class="flex items-center gap-2">
            <button id="btn-cancel-voice-customizer" type="button" class="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer">
              Batal
            </button>
            <button id="btn-save-voice-customizer" type="button" class="py-2.5 px-5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white shadow-lg shadow-amber-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer">
              Simpan Karakter Suara
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modalEl = modal;

    this.bindEvents();
    this.populateGenderButtons();
    this.populatePersonas();
    this.populateVoices();
  }

  populateGenderButtons() {
    const btns = this.modalEl.querySelectorAll(".voice-gender-btn");
    const badge = this.modalEl.querySelector("#voice-gender-active-badge");

    btns.forEach((btn) => {
      const g = btn.getAttribute("data-gender");
      const isSelected = g === this.selectedGender;
      btn.className = `voice-gender-btn py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
        isSelected
          ? "bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-sm"
          : "bg-slate-950 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
      }`;
    });

    if (badge) {
      if (this.selectedGender === "female") badge.textContent = "🌸 Wanita";
      else if (this.selectedGender === "male") badge.textContent = "👔 Pria";
      else badge.textContent = "⚡ Sesuai Persona";
    }
  }

  populatePersonas() {
    const container = this.modalEl.querySelector("#voice-persona-cards-container");
    if (!container) return;

    container.innerHTML = Object.values(VOICE_PERSONAS).map((p) => {
      const isSelected = p.id === this.selectedPersona;
      const genderTag = p.gender === "female" ? "🌸 Wanita" : p.gender === "male" ? "👔 Pria" : "⚡ Universal";

      return `
        <div 
          class="voice-persona-card p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            isSelected
              ? "bg-slate-800/95 border-amber-400 ring-2 ring-amber-400/30 shadow-lg"
              : "bg-slate-950 border-slate-700/80 hover:border-slate-500 hover:bg-slate-900"
          }"
          data-persona-id="${p.id}"
        >
          <div class="flex items-center gap-2.5 mb-1.5">
            <div class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              ${p.svgIcon || ""}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-extrabold text-white truncate flex items-center justify-between">
                <span>${p.name}</span>
                <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  isSelected ? "bg-amber-950 text-amber-300 border border-amber-600" : "bg-slate-900 text-slate-300 border border-slate-700"
                }">${p.badge || "PRO"}</span>
              </div>
              <span class="text-[10px] text-amber-400/90 font-medium">${genderTag}</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-300 font-medium line-clamp-2 leading-relaxed">${p.description}</p>
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

    let html = `<option value="">Otomatis (Sesuai Persona & Gender)</option>`;

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
      html += `<optgroup label="Suara Sistem Lainnya">`;
      others.slice(0, 25).forEach((v) => {
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

    // Gender Selection buttons
    const genderContainer = this.modalEl.querySelector("#voice-gender-buttons-group");
    if (genderContainer) {
      genderContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".voice-gender-btn");
        if (btn) {
          const g = btn.getAttribute("data-gender");
          this.applyGender(g);
        }
      });
    }

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
            gender: this.selectedGender,
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
          gender: this.selectedGender,
          voiceURI: this.selectedVoiceURI,
          pitch: this.selectedPitch,
          rate: this.selectedRate,
          volume: this.selectedVolume
        });

        if (this.onVoiceSaved) {
          this.onVoiceSaved(aiVoiceEngine.config);
        }

        if (window.NotificationToast) {
          window.NotificationToast.show("Pengaturan karakter & gender suara AI berhasil disimpan!", "success");
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

  applyGender(gender) {
    this.selectedGender = gender;
    this.populateGenderButtons();

    // Adjust pitch dynamically according to selected gender
    if (gender === "female") {
      this.selectedPitch = 1.20;
      // Auto recommend mentor or cyber
      if (this.selectedPersona === "professor") {
        this.selectedPersona = "mentor";
      }
    } else if (gender === "male") {
      this.selectedPitch = 0.86;
      if (this.selectedPersona === "mentor") {
        this.selectedPersona = "professor";
      }
    } else {
      // Auto / persona default
      const p = VOICE_PERSONAS[this.selectedPersona] || VOICE_PERSONAS.mentor;
      this.selectedPitch = p.pitch;
    }

    const pitchSlider = this.modalEl.querySelector("#slider-voice-pitch");
    const pitchLbl = this.modalEl.querySelector("#label-voice-pitch");
    if (pitchSlider) pitchSlider.value = this.selectedPitch;
    if (pitchLbl) pitchLbl.textContent = `${this.selectedPitch.toFixed(2)}x`;

    this.populatePersonas();
  }

  applyPersona(personaId) {
    if (!VOICE_PERSONAS[personaId]) return;
    this.selectedPersona = personaId;
    const p = VOICE_PERSONAS[personaId];

    // Maintain gender override if user explicitly picked female or male
    if (this.selectedGender === "female") {
      this.selectedPitch = 1.20;
    } else if (this.selectedGender === "male") {
      this.selectedPitch = 0.86;
    } else {
      this.selectedPitch = p.pitch;
    }

    this.selectedRate = p.rate;

    const pitchSlider = this.modalEl.querySelector("#slider-voice-pitch");
    const rateSlider = this.modalEl.querySelector("#slider-voice-rate");
    const pitchLbl = this.modalEl.querySelector("#label-voice-pitch");
    const rateLbl = this.modalEl.querySelector("#label-voice-rate");
    const previewText = this.modalEl.querySelector("#voice-preview-text");

    if (pitchSlider) pitchSlider.value = this.selectedPitch;
    if (rateSlider) rateSlider.value = p.rate;
    if (pitchLbl) pitchLbl.textContent = `${this.selectedPitch.toFixed(2)}x`;
    if (rateLbl) rateLbl.textContent = `${this.selectedRate.toFixed(2)}x`;
    if (previewText) previewText.textContent = `"${p.sampleText}"`;

    this.populatePersonas();
  }

  openModal() {
    this.selectedPersona = aiVoiceEngine.config.persona || "mentor";
    this.selectedGender = aiVoiceEngine.config.gender || "auto";
    this.selectedVoiceURI = aiVoiceEngine.config.voiceURI || "";
    this.selectedPitch = Number(aiVoiceEngine.config.pitch) || 1.15;
    this.selectedRate = Number(aiVoiceEngine.config.rate) || 1.02;

    this.populateGenderButtons();
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
