/**
 * aiVoiceEngine.js - Advanced Voice Engine for Error Pattern Engine (EPE)
 * 
 * Fitur Utama:
 * 1. Audio Metering & Visualizer (AudioContext + AnalyserNode) untuk verifikasi mic aktif fisik.
 * 2. Robust Speech-to-Text (Web Speech API) dengan streaming interim results,
 *    auto-recovery jeda hening, dan penanganan error komprehensif.
 * 3. MediaRecorder Audio Fallback untuk perekaman suara langsung.
 * 4. Voice Studio & TTS Persona (5 Karakter Suara AI, Pitch, Speed, Math Normalizer,
 *    serta penanganan bug Chrome utterance timeout).
 */

export const VOICE_PERSONAS = {
  mentor: {
    id: "mentor",
    name: "Kakak Mentor Ceria",
    description: "Ramah, bersahabat, penuh semangat & memotivasi belajar",
    gender: "female",
    pitch: 1.18,
    rate: 1.02,
    badge: "Mentor",
    svgIcon: '<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
    accentColor: "from-amber-400 to-pink-500",
    sampleText: "Halo! Aku Matrix AI, siap membantumu memahami matematika dengan seru dan mudah!"
  },
  professor: {
    id: "professor",
    name: "Profesor Sains Bijak",
    description: "Tenang, berwibawa, analitis dengan tempo tertata",
    gender: "male",
    pitch: 0.86,
    rate: 0.94,
    badge: "Pakar",
    svgIcon: '<svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"/></svg>',
    accentColor: "from-blue-500 to-indigo-700",
    sampleText: "Salam. Mari kita telaah struktur logika dan rumus matematika ini secara runtut dan mendalam."
  },
  cyber: {
    id: "cyber",
    name: "Cyber Matrix AI",
    description: "Futuristik, presisi digital, tajam & berteknologi tinggi",
    gender: "neutral",
    pitch: 1.25,
    rate: 1.06,
    badge: "Matrix",
    svgIcon: '<svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>',
    accentColor: "from-cyan-400 to-blue-600",
    sampleText: "Sistem kognitif Matrix aktif. Seluruh kalkulasi persamaan matematika siap dianalisis seketika."
  },
  buddy: {
    id: "buddy",
    name: "Sahabat Belajar Santai",
    description: "Gaya santai, asik seperti teman belajar sebangku",
    gender: "casual",
    pitch: 1.0,
    rate: 0.96,
    badge: "Rekan",
    svgIcon: '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/></svg>',
    accentColor: "from-emerald-400 to-teal-600",
    sampleText: "Hai teman! Santai aja, kita bedah soal ini bareng-bareng sampai kamu paham 100 persen ya!"
  },
  turbo: {
    id: "turbo",
    name: "Turbo Mode (Cepat & Ringkas)",
    description: "Tempo dinamis, to-the-point bagi yang suka penjelasan cepat",
    gender: "fast",
    pitch: 1.05,
    rate: 1.18,
    badge: "Turbo",
    svgIcon: '<svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
    accentColor: "from-yellow-400 to-amber-600",
    sampleText: "Poin utamanya: faktorkan koefisien, hitung nilai diskriminan, dan tentukan akar solusinya sekarang!"
  }
};

const STORAGE_KEY = "epe_ai_voice_config";

export class AiVoiceEngine {
  constructor() {
    this.recognition = null;
    this.isListening = null;
    this.audioContext = null;
    this.analyser = null;
    this.microphoneStream = null;
    this.volumeCallback = null;
    this.animFrameId = null;

    // TTS & Voice Config
    this.config = this.loadConfig();
    this.voices = [];
    this.currentUtterances = [];
    this.isSpeaking = false;
    this.keepAliveInterval = null;

    this.initVoices();
  }

  // =========================================================================
  // CONFIG & PERSISTENCE
  // =========================================================================
  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Gagal memuat konfigurasi suara dari localStorage:", e);
    }

    return {
      persona: "mentor",
      gender: "auto",
      voiceURI: "",
      pitch: 1.18,
      rate: 1.02,
      volume: 1.0,
      autoListenAfterSpeak: true
    };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn("Gagal menyimpan konfigurasi suara:", e);
    }
  }

  setPersona(personaId) {
    if (VOICE_PERSONAS[personaId]) {
      const p = VOICE_PERSONAS[personaId];
      this.saveConfig({
        persona: personaId,
        pitch: p.pitch,
        rate: p.rate
      });
    }
  }

  getPersona() {
    return VOICE_PERSONAS[this.config.persona] || VOICE_PERSONAS.mentor;
  }

  // =========================================================================
  // SYSTEM VOICES MANAGEMENT (TTS)
  // =========================================================================
  initVoices() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const updateVoices = () => {
      this.voices = window.speechSynthesis.getVoices() || [];
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }

  getAvailableVoices() {
    if (!this.voices || this.voices.length === 0) {
      if (window.speechSynthesis) {
        this.voices = window.speechSynthesis.getVoices() || [];
      }
    }

    const indonesian = [];
    const others = [];

    this.voices.forEach((v) => {
      const langLower = (v.lang || "").toLowerCase();
      const nameLower = (v.name || "").toLowerCase();
      const isId = langLower.startsWith("id") || 
                   langLower.includes("id-") || 
                   langLower.includes("id_") || 
                   nameLower.includes("indonesia") ||
                   nameLower.includes("gadis") ||
                   nameLower.includes("andika") ||
                   nameLower.includes("siti");
      if (isId) {
        indonesian.push(v);
      } else {
        others.push(v);
      }
    });

    return {
      indonesian,
      all: [...indonesian, ...others]
    };
  }

  resolveActiveVoice(customConfig = null) {
    const { indonesian, all } = this.getAvailableVoices();
    const cfg = customConfig || this.config;

    // 1. Cek voiceURI spesifik jika user memilih manual
    if (cfg.voiceURI) {
      const custom = all.find((v) => v.voiceURI === cfg.voiceURI || v.name === cfg.voiceURI);
      if (custom) return custom;
    }

    // 2. Selalu prioritaskan suara asli Bahasa Indonesia agar tidak berlogat asing / bule
    if (indonesian.length > 0) {
      const targetGender = cfg.gender && cfg.gender !== "auto" ? cfg.gender : (this.getPersona().gender || "auto");

      if (targetGender === "female") {
        const femaleId = indonesian.find((v) => 
          v.name.toLowerCase().includes("gadis") || 
          v.name.toLowerCase().includes("siti") ||
          v.name.toLowerCase().includes("indira") ||
          v.name.toLowerCase().includes("female") || 
          v.name.toLowerCase().includes("wanita")
        );
        if (femaleId) return femaleId;
      } else if (targetGender === "male") {
        const maleId = indonesian.find((v) => 
          v.name.toLowerCase().includes("andika") || 
          v.name.toLowerCase().includes("ardi") || 
          v.name.toLowerCase().includes("budi") ||
          v.name.toLowerCase().includes("male") || 
          v.name.toLowerCase().includes("pria")
        );
        if (maleId) return maleId;
      }

      // Prioritas Utama: Suara Natural Online Microsoft Gadis / Andika
      const naturalId = indonesian.find(v => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("online"));
      if (naturalId) return naturalId;

      // Prioritas Kedua: Google Bahasa Indonesia
      const googleId = indonesian.find(v => v.name.toLowerCase().includes("google"));
      if (googleId) return googleId;

      // Fallback: Suara Indonesia pertama yang tersedia
      return indonesian[0];
    }

    // 3. Fallback sistem hanya jika perangkat tidak memiliki suara Indonesia sama sekali
    return all.find((v) => v.default) || all[0] || null;
  }

  // =========================================================================
  // PHYSICAL AUDIO METERING & LIVE VOLUME (AudioContext)
  // =========================================================================
  async startAudioMeter(onVolumeChange) {
    this.volumeCallback = onVolumeChange;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      // Gunakan microphoneStream yang sudah ada jika track hardware masih aktif (hindari thrashing driver)
      const hasLiveTrack = this.microphoneStream && this.microphoneStream.getTracks().some((t) => t.readyState === "live");
      if (!hasLiveTrack) {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;

      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      if (!this.analyser && this.microphoneStream) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.3; // Lebih responsif terhadap getaran vokal

        const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
        source.connect(this.analyser);
      }

      if (!this.analyser) return false;

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.frequencyData = dataArray;

      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / (bufferLength || 1);
        const rawGain = average / 35;
        const normalized = Math.min(1.0, Math.max(0.0, Math.pow(rawGain, 0.75)));
        this.currentAudioVolume = normalized;

        if (this.volumeCallback) {
          this.volumeCallback(normalized, average);
        }

        this.animFrameId = requestAnimationFrame(tick);
      };

      tick();
      return true;
    } catch (err) {
      console.warn("Audio Meter (Visualizer) tidak aktif (Speech Recognition tetap berjalan normal):", err);
      return false;
    }
  }

  getLiveAudioMetrics() {
    if (this.analyser && this.frequencyData) {
      try {
        this.analyser.getByteFrequencyData(this.frequencyData);
        let sum = 0;
        const len = this.frequencyData.length;
        for (let i = 0; i < len; i++) sum += this.frequencyData[i];
        const avg = sum / (len || 1);
        const norm = Math.min(1.0, Math.max(0.0, Math.pow(avg / 35, 0.75)));
        return {
          volume: norm,
          rawAverage: avg,
          frequencyData: this.frequencyData,
          isListening: this.isListening,
          isSpeaking: this.isSpeaking
        };
      } catch (e) {}
    }
    return {
      volume: this.currentAudioVolume || 0,
      rawAverage: 0,
      frequencyData: null,
      isListening: this.isListening,
      isSpeaking: this.isSpeaking
    };
  }

  stopAudioMeter(preserveHardware = false) {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (!preserveHardware) {
      if (this.analyser) {
        try { this.analyser.disconnect(); } catch (e) {}
        this.analyser = null;
      }
      if (this.audioContext && this.audioContext.state !== "closed") {
        try { this.audioContext.close(); } catch (e) {}
        this.audioContext = null;
      }
      if (this.microphoneStream) {
        try {
          this.microphoneStream.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        this.microphoneStream = null;
      }
    }

    this.frequencyData = null;
    this.currentAudioVolume = 0;
    if (this.volumeCallback) {
      this.volumeCallback(0, 0);
    }
  }

  releaseMicrophone() {
    this.stopAudioMeter(false);
  }

  // =========================================================================
  // ROBUST SPEECH-TO-TEXT (STT) ENGINE
  // =========================================================================
  static isSpeechSupported() {
    return !!(typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition));
  }

  startListening({
    onInterimResult,
    onFinalResult,
    onError,
    onEnd,
    onStateChange
  } = {}) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRec) {
      if (onError) onError({ code: "not_supported", message: "Browser ini belum mendukung Web Speech Recognition. Gunakan Chrome, Edge, atau Opera terbaru." });
      return null;
    }

    // Stop sesi sebelumnya jika masih aktif
    this.stopListening();

    let fullTranscript = "";
    let intentionalStop = false;
    let silenceTimer = null;

    try {
      this.recognition = new SpeechRec();
      this.recognition.lang = "id-ID";
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStateChange) onStateChange({ isListening: true, volume: 0 });
      };

      this.recognition.onresult = (event) => {
        let interim = "";
        let finalSegment = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalSegment += res[0].transcript + " ";
          } else {
            interim += res[0].transcript;
          }
        }

        if (finalSegment) {
          fullTranscript += finalSegment;
        }

        const currentLiveText = (fullTranscript + interim).trim();

        if (onInterimResult) {
          onInterimResult({
            fullTranscript: fullTranscript.trim(),
            interimText: interim.trim(),
            currentText: currentLiveText
          });
        }

        // Reset timer jeda hening: Jika pengguna berhenti bicara selama 2.2 detik,
        // kita picu final submission jika ada transkrip
        if (silenceTimer) clearTimeout(silenceTimer);
        if (currentLiveText.length > 0) {
          silenceTimer = setTimeout(() => {
            if (this.isListening && currentLiveText.trim().length > 0) {
              if (onFinalResult) onFinalResult(currentLiveText.trim());
            }
          }, 2200);
        }
      };

      this.recognition.onerror = (event) => {
        const errType = event.error;
        console.warn("SpeechRecognition Event Error:", errType);

        if (errType === "no-speech") {
          // 'no-speech' menandakan jeda hening sejenak saat berpikir.
          // Pertahankan sesi agar pengguna tidak terputus di tengah kalimat.
          if (onInterimResult) {
            onInterimResult({
              fullTranscript: fullTranscript.trim(),
              interimText: "",
              currentText: fullTranscript.trim(),
              statusHint: "Mendengarkan... Silakan berbicara"
            });
          }
          return;
        }

        let userMsg = "Kendala pada perekaman mikrofon.";
        if (errType === "not-allowed" || errType === "service-not-allowed") {
          userMsg = "Izin mikrofon belum aktif atau dibatasi. Klik ikon mikrofon / gembok di address bar browser dan pilih 'Allow / Izinkan'.";
        } else if (errType === "audio-capture") {
          userMsg = "Mikrofon fisik tidak terdeteksi atau sedang dikunci aplikasi lain. Pastikan mic default terpasang.";
        } else if (errType === "network") {
          userMsg = "Koneksi ke server pengenal suara Google terhambat. Jika membuka via 127.0.0.1, gunakan http://localhost:8080 agar browser tidak membatasi Web Speech.";
        }

        if (onError) onError({ code: errType, message: userMsg });
      };

      this.recognition.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer);

        // Auto-reconnect jika Chrome menutup koneksi saat pengguna masih dalam sesi mendengarkan
        if (!intentionalStop && this.isListening) {
          setTimeout(() => {
            if (!intentionalStop && this.isListening && this.recognition) {
              try {
                this.recognition.start();
              } catch (reErr) {
                console.warn("Auto-reconnect speech recognition retry notice:", reErr);
              }
            }
          }, 90);
          return; // Sangat penting: Return di sini agar sesi mendengarkan tidak mati prematur!
        }

        this.isListening = false;

        // Jika berakhir tanpa perintah stop sengaja dan sudah ada transkrip
        if (!intentionalStop && fullTranscript.trim().length > 0) {
          if (onFinalResult) onFinalResult(fullTranscript.trim());
        }

        this.stopAudioMeter(true); // Jaga hardware mic agar tidak restart-loop
        if (onEnd) onEnd({ fullTranscript: fullTranscript.trim() });
        if (onStateChange) onStateChange({ isListening: false, volume: 0 });
      };

      // 1. Jalankan Speech Recognition terlebih dahulu
      this.recognition.start();

      // 2. Mulai audio metering visualizer secara asinkron tanpa memblokir recognition
      setTimeout(() => {
        if (this.isListening) {
          this.startAudioMeter((volume) => {
            if (onStateChange && this.isListening) onStateChange({ isListening: true, volume });
          });
        }
      }, 50);

      return {
        stop: () => {
          intentionalStop = true;
          this.isListening = false;
          if (silenceTimer) clearTimeout(silenceTimer);
          this.stopListening();
          return fullTranscript.trim();
        }
      };
    } catch (e) {
      console.error("Gagal menjalankan SpeechRecognition:", e);
      if (onError) onError({ code: "start_exception", message: e.message });
      return null;
    }
  }

  stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    this.stopAudioMeter();
  }

  // =========================================================================
  // ADVANCED TEXT-TO-SPEECH (TTS) & MATH PRONUNCIATION
  // =========================================================================
  cleanMathAndMarkdownForSpeech(text) {
    if (!text) return "";

    let clean = String(text);

    // 1. Hapus tag HTML (<span...>, <div...>, <br>, dsb)
    clean = clean.replace(/<[^>]+>/g, " ");

    // 2. Hapus format code block markdown & inline code
    clean = clean.replace(/```[\s\S]*?```/g, " ");
    clean = clean.replace(/`([^`]+)`/g, "$1");

    // 3. Hapus horizontal rule / divider (---, ***, ___) di mana pun berada
    clean = clean.replace(/(?:^|\s)[-*_]{3,}(?:\s|$)/g, " ");

    // 4. Hapus markdown headings (#, ##, ###, ####, #####, ######) di awal baris/frasa
    clean = clean.replace(/#{1,6}\s+/g, "");
    clean = clean.replace(/#{1,6}/g, "");

    // 5. Hapus blockquote (> ), bold, italic, strikethrough (***, **, *, __, _, ~~)
    clean = clean.replace(/^>\s+/gm, "");
    clean = clean.replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1");
    clean = clean.replace(/_{1,3}([^_]+)_{1,3}/g, "$1");
    clean = clean.replace(/~~([^~]+)~~/g, "$1");
    clean = clean.replace(/[*_~]/g, ""); // Bersihkan sisa bintang atau garis bawah

    // 6. Hapus link markdown [Teks](url) -> jadi Teks
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // 7. Hapus tabel markdown (| Kolom 1 | Kolom 2 |) dan garis pembatas (|---|---|)
    clean = clean.replace(/\|[-:\s|]+\|/g, " ");
    clean = clean.replace(/\|/g, " ");

    // 8. Bersihkan simbol emoji & ikon dekoratif agar tidak dieja aneh oleh TTS
    clean = clean.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu, "");
    clean = clean.replace(/[•◆★⭐💡📋🔬⚡⚙️✓✕▶→⠿🔑✨📸]/g, "");

    // 9. Penanganan ekspresi Matematika LaTeX ($$...$$ dan $...$)
    clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, (m, p1) => this.pronounceLatex(p1));
    clean = clean.replace(/\$([^\$]+)\$/g, (m, p1) => this.pronounceLatex(p1));

    // 10. Jika ada sisa rumus LaTeX mentah di luar tanda dollar
    clean = this.pronounceLatex(clean);

    // 11. Konversi pecahan numerik umum (1/2 -> setengah, 1/4 -> seperempat, 3/4 -> tiga perempat, A/B -> A per B)
    clean = clean.replace(/\b1\/2\b/g, " setengah ");
    clean = clean.replace(/\b1\/4\b/g, " seperempat ");
    clean = clean.replace(/\b3\/4\b/g, " tiga perempat ");
    clean = clean.replace(/(\d+)\s*\/\s*(\d+)/g, "$1 per $2");

    // 12. Konversi persamaan umum & operasi
    clean = clean.replace(/=/g, " sama dengan ");
    clean = clean.replace(/\+/g, " tambah ");
    clean = clean.replace(/(\d+)\s*-\s*(\d+)/g, "$1 dikurang $2");
    clean = clean.replace(/[()\[\]{}]/g, " ");

    // 13. Normalisasi spasi dan tanda baca
    clean = clean
      .replace(/\\/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([.,!?])/g, "$1")
      .trim();

    return clean;
  }

  pronounceLatex(latex) {
    if (!latex) return "";
    let clean = latex
      .replace(/^\$\$|\$\$$/g, "")
      .replace(/^\$|\$$/g, "")
      // Strip macro pembungkus seperti \cancel{x}, \text{x}, \mathbf{x}, \mathrm{x}
      .replace(/\\cancel\{([^}]+)\}/g, "$1")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/\\mathbf\{([^}]+)\}/g, "$1")
      .replace(/\\mathrm\{([^}]+)\}/g, "$1")
      .replace(/\\color\{[^}]+\}\{([^}]+)\}/g, "$1")
      .replace(/\\left|\\right/g, "")
      .replace(/\\displaystyle/g, "")
      .replace(/\\quad|\\qquad/g, " ")
      .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, " ")
      // Pecahan dan akar
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 per $2")
      .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "akar pangkat $1 dari $2")
      .replace(/\\sqrt\{([^}]+)\}/g, "akar dari $1")
      .replace(/\\sqrt/g, "akar kuadrat")
      // Operasi aljabar
      .replace(/\\pm/g, " plus minus ")
      .replace(/\\mp/g, " minus plus ")
      .replace(/\\cdot|\\times/g, " kali ")
      .replace(/\\div/g, " bagi ")
      .replace(/\\neq/g, " tidak sama dengan ")
      .replace(/\\le|\\leq/g, " kurang dari atau sama dengan ")
      .replace(/\\ge|\\geq/g, " lebih dari atau sama dengan ")
      .replace(/\\approx/g, " kira-kira ")
      .replace(/\\implies|\\Rightarrow/g, " maka didapatkan ")
      .replace(/\\sum/g, " jumlah total ")
      .replace(/\\infty/g, " tak hingga ")
      .replace(/\\Delta\s*H/g, "delta H")
      .replace(/\\Delta/g, " delta ")
      .replace(/\\pi/g, " pi ")
      .replace(/\\alpha/g, " alfa ")
      .replace(/\\beta/g, " beta ")
      .replace(/\\theta/g, " teta ")
      // Pangkat & Indeks
      .replace(/\^2\b/g, " kuadrat ")
      .replace(/\^3\b/g, " kubik ")
      .replace(/\^\{([^}]+)\}/g, " pangkat $1 ")
      .replace(/\^([0-9a-zA-Z]+)/g, " pangkat $1 ")
      .replace(/_\{([^}]+)\}/g, " $1 ")
      .replace(/_([0-9a-zA-Z]+)/g, " $1 ")
      // Bersihkan backslash tersisa
      .replace(/\\[a-zA-Z]+/g, " ")
      .replace(/\\/g, " ");

    return clean;
  }

  splitIntoSentences(text) {
    if (!text) return [];
    // Pisahkan teks berdasarkan tanda baca kalimat agar tidak melebihi 15 detik batas Chrome TTS
    const rawParts = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
    const chunks = [];

    for (let part of rawParts) {
      let p = part.trim();
      if (!p) continue;
      // Jika kalimat sangat panjang (> 160 huruf), pecah berdasarkan koma
      if (p.length > 160) {
        const subParts = p.split(/,\s+/);
        subParts.forEach((sp) => {
          if (sp.trim()) chunks.push(sp.trim() + ".");
        });
      } else {
        chunks.push(p);
      }
    }

    return chunks;
  }

  speak(text, { onStart, onEnd, onError, onBoundary, customConfig = null } = {}) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (onError) onError(new Error("SpeechSynthesis tidak didukung di browser ini."));
      return;
    }

    this.stopSpeaking();

    const clean = this.cleanMathAndMarkdownForSpeech(text);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    const sentences = this.splitIntoSentences(clean);
    if (sentences.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    const cfg = customConfig || this.config;
    const voiceToUse = this.resolveActiveVoice(cfg);
    let currentIndex = 0;
    this.isSpeaking = true;

    // Chrome TTS Bug Workaround: panggil resume tiap 4 detik saat speaking aktif
    this.keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 4000);

    const speakNextSentence = () => {
      if (currentIndex >= sentences.length) {
        this.stopSpeaking();
        if (onEnd) onEnd();
        return;
      }

      const sentenceText = sentences[currentIndex];
      const utterance = new SpeechSynthesisUtterance(sentenceText);

      utterance.lang = "id-ID";
      utterance.pitch = Math.min(2.0, Math.max(0.5, Number(cfg.pitch) || 1.0));
      utterance.rate = Math.min(2.0, Math.max(0.6, Number(cfg.rate) || 1.0));
      utterance.volume = Math.min(1.0, Math.max(0.1, Number(cfg.volume) || 1.0));

      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onstart = () => {
        if (currentIndex === 0 && onStart) onStart();
      };

      utterance.onboundary = (e) => {
        if (onBoundary) onBoundary(e, sentenceText);
      };

      utterance.onend = () => {
        currentIndex++;
        speakNextSentence();
      };

      utterance.onerror = (err) => {
        console.warn("TTS Utterance Error:", err);
        currentIndex++;
        if (currentIndex >= sentences.length) {
          this.stopSpeaking();
          if (onEnd) onEnd();
        } else {
          speakNextSentence();
        }
      };

      this.currentUtterances.push(utterance);
      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  }

  stopSpeaking() {
    this.isSpeaking = false;
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.currentUtterances = [];
  }

  testVoice(personaId = null, customParams = null) {
    const p = personaId && VOICE_PERSONAS[personaId] ? VOICE_PERSONAS[personaId] : this.getPersona();
    const testText = p.sampleText || "Halo! Aku Matrix AI, siap membantumu belajar matematika.";

    const tempConfig = {
      ...this.config,
      ...(personaId ? { persona: personaId, pitch: p.pitch, rate: p.rate } : {}),
      ...(customParams || {})
    };

    this.speak(testText, { customConfig: tempConfig });
  }
}

// Global Singleton Instance
export const aiVoiceEngine = new AiVoiceEngine();
