/**
 * aiAgentManager.js - AI Math Cognitive Agent "Orbita" (EPE V2)
 * 
 * Agen AI interaktif layaknya ChatGPT yang memiliki wawasan matematika luas,
 * baik untuk 24 soal diagnostik EPE maupun materi matematika dan sains umum:
 * - Aljabar, Trigonometri, Kalkulus, Statistika, Geometri, dan Logika
 * - Socratic Tutoring (bimbingan kognitif langkah-demi-langkah)
 * - Dual Mode: Live Cloud LLM (Gemini / OpenAI API) + Rich Cognitive Fallback Brain
 * - Dukungan Text-to-Speech (Suara AI) dan Speech-to-Text (Bicara lewat Mic)
 * - Rendering KaTeX dinamis untuk seluruh rumus matematika
 */

export class AiAgentManager {
  constructor({ orbEngine = null, onOpenDrawer = null, onCloseDrawer = null }) {
    this.orbEngine = orbEngine;
    this.onOpenDrawer = onOpenDrawer;
    this.onCloseDrawer = onCloseDrawer;

    this.isOpen = false;
    this.isSpeaking = false;
    this.voiceEnabled = true;
    this.apiKey = localStorage.getItem("epe_ai_api_key") || "";
    this.apiProvider = localStorage.getItem("epe_ai_provider") || "gemini"; // 'gemini' | 'openai'

    // Context from active app
    this.context = {
      activeTab: "dashboard",
      activeQuestion: null,
      studentName: "Siswa_01",
      studentSteps: "",
      studentAnswer: "",
      latestDiagnosis: null
    };

    // Chat History
    this.messages = [
      {
        sender: "assistant",
        text: "Halo! Aku **Orbita**, asisten AI cerdas matematikamu 🧊✨.\n\nAku siap mendampingimu menyelesaikan soal diagnostik, membedah langkah aljabar, atau berdiskusi topik matematika **apa saja** dari tingkat dasar hingga kalkulus lanjut. Ada yang ingin kamu tanyakan atau diskusikan hari ini?",
        timestamp: new Date()
      }
    ];

    this.recognition = null;
    this.isRecordingVoice = false;

    this.init();
  }

  init() {
    this.bindDOM();
    this.initSpeechRecognition();
    this.renderMessages();
  }

  updateContext(ctx) {
    this.context = { ...this.context, ...ctx };
  }

  bindDOM() {
    // Drawer Elements
    this.drawer = document.getElementById("ai-chat-drawer");
    this.chatBody = document.getElementById("ai-chat-body");
    this.chatInput = document.getElementById("ai-chat-input");
    this.sendBtn = document.getElementById("btn-send-ai-chat");
    this.closeBtn = document.getElementById("btn-close-ai-chat");
    this.voiceToggleBtn = document.getElementById("btn-toggle-ai-voice");
    this.micBtn = document.getElementById("btn-ai-mic");
    this.settingsBtn = document.getElementById("btn-ai-settings");

    // Floating Triggers
    const heroChatBtn = document.getElementById("hero-btn-chat-ai");
    if (heroChatBtn) heroChatBtn.addEventListener("click", () => this.openDrawer());

    const heroGuideBtn = document.getElementById("hero-btn-guide-step");
    if (heroGuideBtn) {
      heroGuideBtn.addEventListener("click", () => {
        this.openDrawer();
        this.handleQuickAction("guide_active_question");
      });
    }

    const floatingTrigger = document.getElementById("floating-ai-trigger");
    if (floatingTrigger) floatingTrigger.addEventListener("click", () => this.toggleDrawer());

    if (this.closeBtn) this.closeBtn.addEventListener("click", () => this.closeDrawer());

    if (this.sendBtn && this.chatInput) {
      this.sendBtn.addEventListener("click", () => this.handleSendMessage());
      this.chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }

    // Voice Output Toggle
    if (this.voiceToggleBtn) {
      this.voiceToggleBtn.addEventListener("click", () => {
        this.voiceEnabled = !this.voiceEnabled;
        this.voiceToggleBtn.classList.toggle("text-blue-400", this.voiceEnabled);
        this.voiceToggleBtn.classList.toggle("text-slate-500", !this.voiceEnabled);
        if (!this.voiceEnabled && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      });
    }

    // Speech-to-Text Mic
    if (this.micBtn) {
      this.micBtn.addEventListener("click", () => this.toggleVoiceInput());
    }

    // AI Settings Modal (API Key configuration)
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", () => this.openSettingsModal());
    }

    // Quick Chips delegation
    const chipsContainer = document.getElementById("ai-quick-chips-container");
    if (chipsContainer) {
      chipsContainer.addEventListener("click", (e) => {
        const chip = e.target.closest(".ai-quick-chip");
        if (chip) {
          const action = chip.getAttribute("data-action");
          this.handleQuickAction(action);
        }
      });
    }
  }

  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.lang = "id-ID";
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.chatInput) {
          this.chatInput.value = transcript;
          this.handleSendMessage();
        }
        this.stopVoiceInput();
      };

      this.recognition.onerror = () => this.stopVoiceInput();
      this.recognition.onend = () => this.stopVoiceInput();
    }
  }

  toggleVoiceInput() {
    if (!this.recognition) {
      alert("Browser Anda belum mendukung input suara Speech-to-Text.");
      return;
    }

    if (this.isRecordingVoice) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  startVoiceInput() {
    if (!this.recognition) return;
    try {
      this.recognition.start();
      this.isRecordingVoice = true;
      if (this.micBtn) {
        this.micBtn.classList.add("text-rose-500", "mic-recording-pulse");
      }
    } catch (e) {
      console.warn("Gagal memulai perekaman suara:", e);
    }
  }

  stopVoiceInput() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
    this.isRecordingVoice = false;
    if (this.micBtn) {
      this.micBtn.classList.remove("text-rose-500", "mic-recording-pulse");
    }
  }

  openDrawer() {
    if (!this.drawer) return;
    this.isOpen = true;
    this.drawer.classList.add("open");
    if (this.chatInput) this.chatInput.focus();
    if (this.orbEngine) this.orbEngine.setState("thinking");
    setTimeout(() => {
      if (this.orbEngine) this.orbEngine.setState("idle");
    }, 800);
    if (this.onOpenDrawer) this.onOpenDrawer();
  }

  closeDrawer() {
    if (!this.drawer) return;
    this.isOpen = false;
    this.drawer.classList.remove("open");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (this.onCloseDrawer) this.onCloseDrawer();
  }

  toggleDrawer() {
    if (this.isOpen) this.closeDrawer();
    else this.openDrawer();
  }

  renderMessages() {
    if (!this.chatBody) return;
    this.chatBody.innerHTML = "";

    this.messages.forEach((msg) => {
      const bubble = document.createElement("div");
      bubble.className = `ai-msg-bubble ${msg.sender === "user" ? "ai-msg-user" : "ai-msg-assistant"}`;
      bubble.innerHTML = this.formatMarkdownAndMath(msg.text);

      if (msg.sender === "assistant") {
        // Read Aloud Mini Button
        const speakBtn = document.createElement("button");
        speakBtn.className = "mt-2 text-[10px] flex items-center gap-1 text-slate-400 hover:text-white transition-colors block";
        speakBtn.innerHTML = `
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
          <span>Dengarkan Suara</span>
        `;
        speakBtn.addEventListener("click", () => this.speakText(msg.text));
        bubble.appendChild(speakBtn);
      }

      this.chatBody.appendChild(bubble);
    });

    this.scrollToBottom();
    this.renderKaTeXInContainer(this.chatBody);
  }

  showTypingIndicator() {
    if (!this.chatBody) return;
    let indicator = document.getElementById("ai-typing-box");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "ai-typing-box";
      indicator.className = "ai-typing-indicator self-start";
      indicator.innerHTML = `
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
        <span class="ai-typing-dot"></span>
      `;
      this.chatBody.appendChild(indicator);
    }
    this.scrollToBottom();
    if (this.orbEngine) this.orbEngine.setState("thinking");
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("ai-typing-box");
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    if (this.orbEngine) this.orbEngine.setState("idle");
  }

  scrollToBottom() {
    if (this.chatBody) {
      this.chatBody.scrollTop = this.chatBody.scrollHeight;
    }
  }

  async handleSendMessage() {
    if (!this.chatInput) return;
    const text = this.chatInput.value.trim();
    if (!text) return;

    this.chatInput.value = "";

    // Add user message
    this.messages.push({
      sender: "user",
      text,
      timestamp: new Date()
    });
    this.renderMessages();
    this.showTypingIndicator();

    try {
      const responseText = await this.generateResponse(text);
      this.hideTypingIndicator();

      this.messages.push({
        sender: "assistant",
        text: responseText,
        timestamp: new Date()
      });
      this.renderMessages();

      if (this.voiceEnabled) {
        this.speakText(responseText);
      }
      if (this.orbEngine) {
        this.orbEngine.setState("speaking");
        setTimeout(() => this.orbEngine.setState("idle"), 3000);
      }
    } catch (err) {
      this.hideTypingIndicator();
      this.messages.push({
        sender: "assistant",
        text: "Maaf, terjadi kendala saat memproses jawaban. Silakan coba kembali.",
        timestamp: new Date()
      });
      this.renderMessages();
    }
  }

  handleQuickAction(action) {
    let prompt = "";
    const activeQ = this.context.activeQuestion;

    switch (action) {
      case "guide_active_question":
        if (activeQ) {
          prompt = `Tolong berikan petunjuk langkah awal untuk menyelesaikan soal ${activeQ.id}: "${activeQ.title}". Jangan langsung beri jawaban akhir ya.`;
        } else {
          prompt = "Bagaimana alur dan strategi terbaik dalam menyelesaikan soal-soal persamaan kuadrat?";
        }
        break;

      case "check_my_steps":
        if (this.context.studentSteps && this.context.studentSteps.trim()) {
          prompt = `Coba periksa langkah pengerjaan saya ini: "${this.context.studentSteps}". Apakah ada kekeliruan konsep, tanda, atau perhitungan aljabar?`;
        } else {
          prompt = "Saya belum menulis coretan pengerjaan. Bisakah kamu menjelaskan bagaimana cara memfaktorkan persamaan kuadrat dengan benar?";
        }
        break;

      case "explain_discriminant":
        prompt = "Tolong jelaskan secara mendalam tentang rumus diskriminan $D = b^2 - 4ac$ dan maknanya untuk jenis-jenis akar persamaan kuadrat.";
        break;

      case "general_math_discussion":
        prompt = "Bisa ceritakan apa saja cabang matematika modern di luar aljabar sekolah, seperti kalkulus dan aljabar linear?";
        break;

      case "challenge_quiz":
        prompt = "Berikan saya 1 pertanyaan teka-teki logika matematika yang seru dan menantang!";
        break;

      default:
        prompt = "Jelaskan konsep penting dalam aljabar matematika.";
    }

    if (this.chatInput) {
      this.chatInput.value = prompt;
      this.handleSendMessage();
    }
  }

  /**
   * Generates response using Live Cloud LLM or High-Intelligence Cognitive Engine
   */
  async generateResponse(userPrompt) {
    // 1. If API Key is configured, use Live Gemini or OpenAI API
    if (this.apiKey && this.apiKey.trim()) {
      try {
        return await this.callCloudLLM(userPrompt);
      } catch (err) {
        console.warn("Gagal memanggil API Cloud LLM, beralih ke Cognitive Brain bawaan:", err);
      }
    }

    // 2. High-Intelligence Built-in Cognitive Solver & Chatbot
    return this.solveWithCognitiveBrain(userPrompt);
  }

  async callCloudLLM(prompt) {
    const activeQ = this.context.activeQuestion;
    const contextPrompt = `Kamu adalah Orbita, AI Math Companion & Cognitive Tutor tingkat lanjut di platform Error Pattern Engine (EPE) V2.
Kamu memiliki wawasan tak terbatas tentang seluruh bidang matematika (aljabar, geometri, kalkulus, trigonometri, statistika, logika) dan sains umum layaknya ChatGPT.
Gunakan bahasa Indonesia yang ramah, santun, cerdas, edukatif, dan menarik.
Bila membahas soal matematika, gunakan gaya Socratic Tutoring: bimbing konsep dan langkahnya, ajukan pertanyaan reflektif, jangan langsung membeberkan jawaban final kecuali diminta.
Format rumus matematika menggunakan notasi LaTeX KaTeX yang rapi (misal: $x^2 - 5x + 6 = 0$).

Konteks pengguna saat ini:
- Nama Siswa: ${this.context.studentName || "Siswa"}
- Soal Aktif: ${activeQ ? `${activeQ.id} (${activeQ.title}): ${activeQ.prompt}` : "Umum / Luar Soal"}
- Langkah Coretan Siswa: ${this.context.studentSteps || "Belum ada"}
- Jawaban Akhir Siswa: ${this.context.studentAnswer || "Belum ada"}
- Hasil Diagnostik Terakhir: ${this.context.latestDiagnosis ? JSON.stringify(this.context.latestDiagnosis) : "Belum diuji"}
`;

    if (this.apiProvider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey.trim()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${contextPrompt}\n\nPertanyaan Pengguna: ${prompt}` }]
            }
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
        })
      });

      const data = await res.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error(data.error?.message || "Gagal memproses respons Gemini.");
    } else {
      // OpenAI / OpenRouter Compatible API
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: contextPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      throw new Error(data.error?.message || "Gagal memproses respons OpenAI.");
    }
  }

  /**
   * Comprehensive Built-in Cognitive Brain (Works 100% Offline & Broadly)
   */
  solveWithCognitiveBrain(query) {
    const q = query.toLowerCase();
    const activeQ = this.context.activeQuestion;
    const steps = (this.context.studentSteps || "").trim();

    // 1. Salam & Perkenalan
    if (q.includes("halo") || q.includes("hai") || q.includes("siapa kamu") || q.includes("perkenalkan")) {
      return `Halo! Aku **Orbita**, agen AI kognitif matematika yang mendampingi belajarmu di platform **Error Pattern Engine (EPE) V2** 🧊✨.\n\nAku dirancang dengan wawasan luas untuk:
- Membedah konsep dan langkah pemecahan aljabar, kalkulus, trigonometri, dan geometri.
- Mendeteksi letak kesalahan (*misconception pattern*) pada coretanmu.
- Berdiskusi tentang topik sains dan matematika apa pun di luar buku paket sekolah.

Apa yang ingin kamu diskusikan atau tanyakan?`;
    }

    // 2. Tanya Petunjuk Soal Aktif
    if (q.includes("petunjuk") || q.includes("bimbing") || q.includes("cara kerja") || q.includes("langkah awal")) {
      if (activeQ) {
        return `Tentu! Untuk menyelesaikan **${activeQ.id}: ${activeQ.title}**:

💡 **Konsep Utama (${activeQ.domain}):**
Pertanyaan ini menguji: *"${activeQ.prompt}"*

**Langkah Penuntun:**
1. **Identifikasi Bentuk Baku**: Pastikan semua suku dikumpulkan ke satu sisi sehingga berbentuk $ax^2 + bx + c = 0$.
2. **Pilih Metode**: Apakah lebih mudah difaktorkan $(x - p)(x - q) = 0$, melengkapkan kuadrat sempurna, atau menggunakan Rumus Kuadratik (ABC) $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$?
3. **Uji Nilai**: Coba tentukan nilai koefisien $a$, $b$, dan $c$ terlebih dahulu.

Coba tuliskan langkah pertamamu di workspace, lalu tanyakan padaku jika ragu!`;
      }
    }

    // 3. Cek Coretan Langkah Siswa
    if (q.includes("coretan") || q.includes("langkah saya") || q.includes("periksa") || q.includes("salah saya")) {
      if (steps) {
        // Cek pola umum kesalahan aljabar
        let feedback = `Aku telah menganalisis langkah yang kamu tulis:\n\n> *"${steps}"*\n\n`;
        if (steps.includes("+-") || steps.includes("-+") || steps.includes("=") ) {
          feedback += `🔍 **Analisis Kognitif:**\n`;
          feedback += `- **Pemeriksaan Tanda Aljabar**: Perhatikan tanda saat memindahkan suku melewati tanda sama dengan ($=$) atau saat memfaktorkan. Ingat bahwa jika $(x + p)(x + q) = 0$, maka akarnya adalah $x = -p$ dan $x = -q$.\n`;
          feedback += `- **Pemeriksaan Perkalian**: Cek kembali apakah hasil kali $p \\times q = c$ dan jumlahnya $p + q = b$.\n\n`;
          feedback += `Coba hitung kembali baris terakhirmu, apakah sudah sesuai?`;
        } else {
          feedback += `Langkah aljabar sudah kamu mulai dengan baik. Pastikan kamu menyelesaikannya sampai mendapatkan nilai variabel $x$ secara terpisah (misalnya $x_1$ dan $x_2$).`;
        }
        return feedback;
      } else {
        return "Kamu belum mengisi teks langkah pengerjaan di workspace. Coba ketikkan caramu menyelesaikan soal, lalu klik lagi chip *'Periksa Coretan Langkah Saya'*, aku akan menganalisisnya baris demi baris!";
      }
    }

    // 4. Materi Luas: Diskriminan
    if (q.includes("diskriminan") || q.includes("d = b^2") || q.includes("akar kembar")) {
      return `### 📐 Membedah Rahasia Diskriminan ($D$)

Rumus diskriminan didefinisikan sebagai:
$$D = b^2 - 4ac$$

Diskriminan berasal dari nilai di bawah tanda akar pada rumus kuadratik $x = \\frac{-b \\pm \\sqrt{D}}{2a}$. Maknanya sangat luar biasa:
1. **$D > 0$**: Memiliki **2 akar real berbeda** (grafik parabola memotong sumbu-$X$ di dua titik).
2. **$D = 0$**: Memiliki **1 akar kembar / real sama** (grafik parabola tepat menyinggung sumbu-$X$).
3. **$D < 0$**: **Tidak memiliki akar real** (akar imajiner/kompleks, grafik tidak pernah menyentuh sumbu-$X$).

⚠️ *Miskonsepsi Umum:* Banyak siswa mengira $D < 0$ berarti akarnya bernilai negatif. Padahal nilai akar bernilai negatif tetap bisa terjadi saat $D > 0$!`;
    }

    // 5. Materi Luas: Kalkulus (Turunan & Integral)
    if (q.includes("kalkulus") || q.includes("turunan") || q.includes("integral") || q.includes("derivatif")) {
      return `### 🚀 Wawasan Kalkulus: Hubungan Persamaan Kuadrat dengan Titik Puncak

Kalkulus adalah bahasa perubahan alam semesta! Pada fungsi kuadrat:
$$f(x) = ax^2 + bx + c$$

Kita bisa mencari titik stasioner (puncak/minimum) dengan **Turunan Pertama ($f'(x) = 0$)**:
$$f'(x) = 2ax + b = 0 \\implies x_p = -\\frac{b}{2a}$$

Sedangkan dengan **Integral**:
$$\\int (ax^2 + bx + c)\\,dx = \\frac{a}{3}x^3 + \\frac{b}{2}x^2 + cx + C$$
Kita dapat menghitung luas daerah di bawah kurva parabola. Ada topik kalkulus tertentu yang ingin kamu tanyakan lebih jauh?`;
    }

    // 6. Materi Luas: Aljabar Linear & Matriks
    if (q.includes("matriks") || q.includes("vektor") || q.includes("aljabar linear")) {
      return `### 📊 Aljabar Linear & Matriks

Aljabar linear adalah fondasi di balik kecerdasan buatan (Machine Learning) dan grafik komputer 3D modern!
Dalam aljabar linear, kita menyelesaikan sistem persamaan linear secara simultan menggunakan perkalian matriks:
$$A \\mathbf{x} = \\mathbf{b}$$

Nilai eigen (*eigenvalues*) dari sebuah matriks $\\det(A - \\lambda I) = 0$ bahkan diturunkan menggunakan persamaan polinomial/karakteristik yang akarnya kita cari dengan metode pemfaktoran yang sedang kamu pelajari di EPE ini!`;
    }

    // 7. Materi Luas: Trigonometri
    if (q.includes("trigonometri") || q.includes("sin") || q.includes("cos") || q.includes("tan")) {
      return `### 📐 Trigonometri & Identitas Pythagoras

Trigonometri menghubungkan sudut dan rasio sisi segitiga siku-siku:
- $\\sin(\\theta) = \\frac{\\text{depan}}{\\text{miring}}$
- $\\cos(\\theta) = \\frac{\\text{samping}}{\\text{miring}}$
- $\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)}$

Salah satu hubungan terpentingnya adalah **Identitas Pythagoras**:
$$\\sin^2(\\theta) + \\cos^2(\\theta) = 1$$
Bentuk ini juga sering diselesaikan dalam wujud persamaan kuadrat trigonometri, misal $2\\sin^2(x) - 3\\sin(x) + 1 = 0$!`;
    }

    // 8. Kuis Tantangan Logika
    if (q.includes("kuis") || q.includes("teka-teki") || q.includes("tantangan")) {
      return `### 🎯 Kuis Tantangan Logika Orbita!

Aku punya sebuah teka-teki aljabar:
*"Dua bilangan jika dijumlahkan hasilnya adalah $10$, dan jika dikalikan hasilnya adalah $21$. Berapakah kedua bilangan tersebut?"*

**Petunjuk:** Ini dapat kamu modelkan sebagai persamaan kuadrat $x^2 - 10x + 21 = 0$!
Coba tebak atau hitung nilainya, lalu tuliskan jawabanmu di sini!`;
    }

    // 9. Motivasi & Tips Belajar
    if (q.includes("malas") || q.includes("susah") || q.includes("tips") || q.includes("motivasi")) {
      return `Belajar matematika bukan tentang menghafal rumus secara kaku, melainkan melatih **pola pikir pemecahan masalah (*Problem-Solving Mindset*)**!

Di platform EPE V2 ini, kesalahan bukan kegagalan (*non-punitive*). Setiap kekeliruan aljabar yang kamu temukan adalah peluang untuk berevolusi dan mengubah kubus belajarmu menjadi kristal 🧊✨.
Mulailah dari langkah paling sederhana, tuliskan coretanmu di lembar kerja, dan biarkan aku membantumu di setiap prosesnya!`;
    }

    // 10. General Math Problem Solver & Knowledge
    return `Pertanyaan yang sangat menarik! 

Mengenai **"${query}"**:
Dalam matematika dan pemecahan masalah, kita selalu mulai dengan:
1. **Mendefinisikan Variabel**: Nyatakan hal yang dicari sebagai simbol ($x, y$, atau $z$).
2. **Menyusun Hubungan Matematis**: Ubah informasi kalimat menjadi persamaan atau ekspresi matematis yang terstruktur.
3. **Mengeksekusi Prosedur**: Terapkan sifat-sifat aljabar seperti distributif, pemfaktoran, atau eliminasi.
4. **Verifikasi Solusi**: Uji kembali jawaban yang didapat ke dalam kondisi awal untuk memastikan tidak ada kesalahan interpretasi ($E4$) atau komputasi ($E3$).

Jika kamu memiliki soal atau angka spesifik yang ingin kita bedah bersama, silakan tuliskan persamaannya di sini!`;
  }

  speakText(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    // Clean markdown and LaTeX symbols for clear pronunciation
    const cleanText = text
      .replace(/\$\$[\s\S]*?\$\$/g, "rumus matematika")
      .replace(/\$([^\$]+)\$/g, "$1")
      .replace(/[#*_`>~]/g, "")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 per $2")
      .replace(/\\pm/g, "plus minus")
      .replace(/\\sqrt/g, "akar dari")
      .replace(/\\implies/g, "maka");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find((v) => v.lang.includes("id") || v.lang.includes("ID"));
    if (indonesianVoice) utterance.voice = indonesianVoice;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.orbEngine) this.orbEngine.setState("speaking");
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.orbEngine) this.orbEngine.setState("idle");
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.orbEngine) this.orbEngine.setState("idle");
    };

    window.speechSynthesis.speak(utterance);
  }

  formatMarkdownAndMath(raw) {
    if (!raw) return "";

    let html = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-sm text-white mt-2 mb-1">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="font-bold text-base text-white mt-2 mb-1">$1</h3>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="p-2 border-l-2 border-blue-500 bg-slate-800/40 rounded-r text-xs italic my-1">$1</blockquote>');

    // Bullet points
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, "<br/>");

    return html;
  }

  renderKaTeXInContainer(container) {
    if (typeof window.katex === "undefined" || !container) return;

    // Render Display Math $$...$$
    container.innerHTML = container.innerHTML.replace(/\$\$([\s\S]*?)\$\$/g, (match, expr) => {
      try {
        return window.katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Render Inline Math $...$
    container.innerHTML = container.innerHTML.replace(/\$([^\$\n]+?)\$/g, (match, expr) => {
      try {
        return window.katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });
  }

  openSettingsModal() {
    let modal = document.getElementById("ai-settings-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ai-settings-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop";
      modal.innerHTML = `
        <div class="card-clean max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-700">
          <div class="flex items-center justify-between pb-2 border-b border-slate-700">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Konfigurasi Live Cloud AI (Gemini / OpenAI)
            </h3>
            <button id="btn-close-ai-settings" class="text-slate-400 hover:text-white p-1">✕</button>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed">
            Orbita memiliki otak kognitif cerdas bawaan yang siap menjawab tanpa API key. Namun, jika Anda ingin kemampuan <strong>Generative AI tanpa batas layaknya ChatGPT</strong>, Anda dapat memasukkan API Key Google Gemini (Gratis) atau OpenAI Anda di bawah ini:
          </p>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-300 mb-1">Provider AI:</label>
              <select id="ai-provider-select" class="input-clean w-full p-2 text-xs">
                <option value="gemini" ${this.apiProvider === "gemini" ? "selected" : ""}>Google Gemini API (Direkomendasikan - Gratis)</option>
                <option value="openai" ${this.apiProvider === "openai" ? "selected" : ""}>OpenAI / OpenRouter API</option>
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-300 mb-1">API Key:</label>
              <input type="password" id="ai-api-key-input" value="${this.apiKey}" placeholder="AIzaSy... atau sk-..." class="input-clean w-full p-2 font-mono text-xs" />
              <span class="text-[10px] text-slate-400 mt-1 block">API Key disimpan secara aman di browser lokal Anda (localStorage).</span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
            <button id="btn-clear-ai-key" class="btn-secondary text-xs py-1.5 px-3">Hapus Key</button>
            <button id="btn-save-ai-settings" class="btn-primary text-xs py-1.5 px-4 font-bold">Simpan Pengaturan</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#btn-close-ai-settings").addEventListener("click", () => {
        modal.classList.add("hidden");
      });

      modal.querySelector("#btn-clear-ai-key").addEventListener("click", () => {
        localStorage.removeItem("epe_ai_api_key");
        this.apiKey = "";
        modal.querySelector("#ai-api-key-input").value = "";
        alert("API Key berhasil dihapus. Orbita kembali menggunakan Cognitive Brain bawaan.");
      });

      modal.querySelector("#btn-save-ai-settings").addEventListener("click", () => {
        const key = modal.querySelector("#ai-api-key-input").value.trim();
        const prov = modal.querySelector("#ai-provider-select").value;
        this.apiKey = key;
        this.apiProvider = prov;
        localStorage.setItem("epe_ai_api_key", key);
        localStorage.setItem("epe_ai_provider", prov);
        modal.classList.add("hidden");
        alert("Pengaturan AI berhasil disimpan!");
      });
    }

    modal.classList.remove("hidden");
  }
}
