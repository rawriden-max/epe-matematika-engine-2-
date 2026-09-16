/**
 * aiAgentManager.js - AI Math Cognitive Agent "Matrix" (EPE V2)
 * 
 * Agen AI interaktif cerdas layaknya ChatGPT yang memiliki wawasan matematika luas,
 * baik untuk 24 soal diagnostik EPE maupun materi matematika dan sains umum:
 * - Aljabar, Trigonometri, Kalkulus, Statistika, Geometri, dan Logika
 * - Socratic Tutoring (bimbingan kognitif langkah-demi-langkah)
 * - Dual Mode: Live Cloud LLM (Gemini / OpenAI API) + Rich Cognitive Fallback Brain
 * - Dukungan Text-to-Speech (Suara AI) dan Speech-to-Text (Bicara lewat Mic)
 * - Rendering KaTeX dinamis aman per-bubble tanpa merusak DOM
 */

import { MathSolver } from "../engine/mathSolver.js";

export class AiAgentManager {
  constructor({ orbEngine = null, onOpenDrawer = null, onCloseDrawer = null }) {
    this.orbEngine = orbEngine;
    this.onOpenDrawer = onOpenDrawer;
    this.onCloseDrawer = onCloseDrawer;

    this.isOpen = false;
    this.isSpeaking = false;
    this.voiceEnabled = true;
    this.apiKey = localStorage.getItem("epe_ai_api_key") || "";
    this.apiProvider = localStorage.getItem("epe_ai_provider") || "gemini";

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
        text: "Halo! Aku **Matrix**, asisten AI kognitif matematikamu 🌐✨.\n\nAku siap mendampingimu menyelesaikan soal diagnostik, membedah langkah aljabar, atau berdiskusi topik matematika **apa saja** dari aljabar, trigonometri, hingga kalkulus lanjut. Ada yang ingin kamu tanyakan atau diskusikan?",
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
    this.drawer = document.getElementById("ai-chat-drawer");
    this.chatBody = document.getElementById("ai-chat-body");
    this.chatInput = document.getElementById("ai-chat-input");
    this.sendBtn = document.getElementById("btn-send-ai-chat");
    this.closeBtn = document.getElementById("btn-close-ai-chat");
    this.voiceToggleBtn = document.getElementById("btn-toggle-ai-voice");
    this.micBtn = document.getElementById("btn-ai-mic");
    this.settingsBtn = document.getElementById("btn-ai-settings");

    // Hero trigger buttons
    const heroChatBtn = document.getElementById("hero-btn-chat-ai");
    if (heroChatBtn) heroChatBtn.addEventListener("click", () => this.openDrawer());

    const heroGuideBtn = document.getElementById("hero-btn-guide-step");
    if (heroGuideBtn) {
      heroGuideBtn.addEventListener("click", () => {
        this.openDrawer();
        this.handleQuickAction("guide_active_question");
      });
    }

    // Floating widget trigger
    const floatingTrigger = document.getElementById("floating-ai-trigger");
    if (floatingTrigger) floatingTrigger.addEventListener("click", () => this.toggleDrawer());

    // Hero Quick AI Buttons
    const heroBtnChat = document.getElementById("hero-btn-chat-ai");
    if (heroBtnChat) {
      heroBtnChat.addEventListener("click", () => this.openDrawer());
    }

    const heroBtnGuide = document.getElementById("hero-btn-guide-step");
    if (heroBtnGuide) {
      heroBtnGuide.addEventListener("click", () => {
        this.openDrawer();
        this.handleQuickAction("guide_active_question");
      });
    }

    if (this.closeBtn) this.closeBtn.addEventListener("click", () => this.closeDrawer());

    // Send Button & Input Enter
    if (this.sendBtn) {
      this.sendBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleSendMessage();
      });
    }

    if (this.chatInput) {
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

    // AI Settings Modal
    if (this.settingsBtn) {
      this.settingsBtn.addEventListener("click", () => this.openSettingsModal());
    }

    // Quick Action Chips
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
      try {
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
      } catch (e) {
        console.warn("SpeechRecognition tidak didukung di browser ini.");
      }
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
      if (this.micBtn) this.micBtn.classList.add("text-rose-500", "mic-recording-pulse");
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
    if (this.micBtn) this.micBtn.classList.remove("text-rose-500", "mic-recording-pulse");
  }

  openDrawer() {
    if (!this.drawer) return;
    this.isOpen = true;
    this.drawer.classList.add("open");
    this.drawer.style.transform = "translateX(0)";
    if (this.chatInput) {
      setTimeout(() => this.chatInput.focus(), 150);
    }
    if (this.orbEngine) {
      this.orbEngine.triggerOrbitBurst();
      this.orbEngine.setState("thinking");
    }
    setTimeout(() => {
      if (this.orbEngine) this.orbEngine.setState("idle");
    }, 800);
    if (this.onOpenDrawer) this.onOpenDrawer();
  }

  closeDrawer() {
    if (!this.drawer) return;
    this.isOpen = false;
    this.drawer.classList.remove("open");
    this.drawer.style.transform = "translateX(100%)";
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
      this.appendMessageBubble(msg);
    });

    this.scrollToBottom();
  }

  appendMessageBubble(msg) {
    if (!this.chatBody) return;
    const bubble = document.createElement("div");
    bubble.className = `ai-msg-bubble ${msg.sender === "user" ? "ai-msg-user" : "ai-msg-assistant"}`;
    bubble.innerHTML = this.formatMarkdown(msg.text);

    // Render KaTeX inside this bubble safely
    this.renderKaTeXInBubble(bubble);

    if (msg.sender === "assistant") {
      const speakBtn = document.createElement("button");
      speakBtn.className = "mt-2 text-[10px] flex items-center gap-1 text-slate-400 hover:text-white transition-colors block";
      speakBtn.innerHTML = `
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
        <span>Dengarkan Suara</span>
      `;
      speakBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.speakText(msg.text);
      });
      bubble.appendChild(speakBtn);
    }

    this.chatBody.appendChild(bubble);
    this.scrollToBottom();
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

    // Clear input immediately
    this.chatInput.value = "";

    const userMsg = {
      sender: "user",
      text,
      timestamp: new Date()
    };
    this.messages.push(userMsg);
    this.appendMessageBubble(userMsg);
    this.showTypingIndicator();

    try {
      const responseText = await this.generateResponse(text);
      this.hideTypingIndicator();

      const aiMsg = {
        sender: "assistant",
        text: responseText,
        timestamp: new Date()
      };
      this.messages.push(aiMsg);
      this.appendMessageBubble(aiMsg);

      if (this.voiceEnabled) {
        this.speakText(responseText);
      }
      if (this.orbEngine) {
        this.orbEngine.setState("speaking");
        setTimeout(() => this.orbEngine.setState("idle"), 3000);
      }
    } catch (err) {
      console.error("AI Error:", err);
      this.hideTypingIndicator();
      const errorMsg = {
        sender: "assistant",
        text: "Terjadi sedikit kendala saat memproses jawaban. Silakan coba kembali.",
        timestamp: new Date()
      };
      this.messages.push(errorMsg);
      this.appendMessageBubble(errorMsg);
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

  async generateResponse(userPrompt) {
    const cleanQuery = userPrompt.trim();

    // 1. High-Precision Symbolic & Numerical Math Solver (Quadratics, Linear, BigInt, Calculus, Trig)
    try {
      const mathSolved = MathSolver.solve(cleanQuery);
      if (mathSolved) return mathSolved;
    } catch (err) {
      console.warn("MathSolver evaluation error:", err);
    }

    // 2. Direct Math & Arithmetic Evaluation Fallback
    const mathResult = this.tryEvaluateMathExpression(cleanQuery);
    if (mathResult) return mathResult;

    // 3. Live Cloud LLM if user provided key (Gemini or OpenAI)
    if (this.apiKey && this.apiKey.trim()) {
      try {
        return await this.callCloudLLM(cleanQuery);
      } catch (err) {
        console.warn("Gagal memanggil API Cloud LLM, beralih ke engine pintar:", err);
      }
    }

    // 4. Curated Scientific & Encyclopedic Knowledge Base (Avogadro, Menkeu, Rumus, Fisika, dll.)
    const kbResult = this.searchKnowledgeBase(cleanQuery);
    if (kbResult) return kbResult;

    // 5. Live Free Web AI Engine (Pollinations text AI with 3.8s timeout)
    try {
      const liveAiResult = await this.callFreeWebAI(cleanQuery);
      if (liveAiResult && liveAiResult.trim()) {
        return liveAiResult;
      }
    } catch (e) {
      // Fallback seamlessly to offline smart synthesizer
    }

    // 6. Intelligent NLP Educational Reasoner (Tailored response, ZERO repetitive template)
    return this.synthesizeSmartResponse(cleanQuery);
  }

  async callCloudLLM(prompt) {
    const activeQ = this.context.activeQuestion;
    const contextPrompt = `Kamu adalah Matrix, AI Math Companion & Cognitive Tutor tingkat lanjut di platform Error Pattern Engine (EPE) V2.
Kamu memiliki wawasan tak terbatas tentang seluruh bidang matematika (aljabar, geometri, kalkulus, trigonometri, statistika, logika) dan sains umum layaknya ChatGPT.
Gunakan bahasa Indonesia yang ramah, santun, cerdas, edukatif, dan menarik.
Bila membahas soal matematika, gunakan gaya Socratic Tutoring: bimbing konsep dan langkahnya, ajukan pertanyaan reflektif, jangan langsung membeberkan jawaban final kecuali diminta.
Format rumus matematika menggunakan notasi LaTeX KaTeX yang rapi (misal: $x^2 - 5x + 6 = 0$).

Konteks pengguna saat ini:
- Nama Siswa: ${this.context.studentName || "Siswa"}
- Soal Aktif: ${activeQ ? `${activeQ.id} (${activeQ.title}): ${activeQ.promptText || activeQ.topic || activeQ.title}` : "Umum / Luar Soal"}
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

  async callFreeWebAI(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const encodedPrompt = encodeURIComponent(prompt);
    // Direct anonymous prompt endpoint
    const url = `https://text.pollinations.ai/${encodedPrompt}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 3) {
          const lower = text.toLowerCase();
          // Filter out rate limit, budget limits, or provider error messages
          if (
            lower.includes("budget") ||
            lower.includes("api key") ||
            lower.includes("pollinations") ||
            lower.includes("rate limit") ||
            lower.includes("wallet") ||
            lower.includes("raise the key") ||
            lower.includes("reached its budget") ||
            lower.includes("model not found") ||
            lower.includes("legacy api")
          ) {
            console.warn("External AI returned rate limit/budget notice. Falling back to Matrix smart cognitive engine.");
            return null;
          }
          return text.trim();
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
    return null;
  }

  tryEvaluateMathExpression(query) {
    let clean = query.toLowerCase()
      .replace(/berapa/g, "")
      .replace(/hasil/g, "")
      .replace(/dari/g, "")
      .replace(/hitung/g, "")
      .replace(/tentukan/g, "")
      .replace(/nilai/g, "")
      .replace(/=/g, "")
      .replace(/\?/g, "")
      .trim();

    // Match two numbers with operator: "2x2", "2 x 2", "2 . 2", "2 * 2", "15 + 27", "100 / 4", "2^5"
    const arithmeticMatch = clean.match(/^([0-9]+(?:\.[0-9]+)?)\s*([\*xX×\.\+\-\/÷\^])\s*([0-9]+(?:\.[0-9]+)?)$/);
    if (arithmeticMatch) {
      const a = parseFloat(arithmeticMatch[1]);
      const op = arithmeticMatch[2];
      const b = parseFloat(arithmeticMatch[3]);
      let res = 0;
      let opSymbol = "";
      let opWord = "";

      if (op === "x" || op === "X" || op === "*" || op === "×" || op === ".") {
        res = a * b;
        opSymbol = "\\times";
        opWord = "perkalian";
      } else if (op === "+") {
        res = a + b;
        opSymbol = "+";
        opWord = "penjumlahan";
      } else if (op === "-") {
        res = a - b;
        opSymbol = "-";
        opWord = "pengurangan";
      } else if (op === "/" || op === "÷") {
        if (b === 0) return "Hasil pembagian dengan angka $0$ tidak terdefinisi dalam matematika!";
        res = a / b;
        opSymbol = "\\div";
        opWord = "pembagian";
      } else if (op === "^") {
        res = Math.pow(a, b);
        opSymbol = "^";
        opWord = "perpangkatan";
      }

      const formattedRes = Number.isInteger(res) ? res : res.toFixed(4).replace(/\.?0+$/, "");
      const aDisplay = Number.isInteger(a) ? a : a.toString();
      const bDisplay = Number.isInteger(b) ? b : b.toString();

      return `### 🧮 Hasil Perhitungan Matematika

**Pertanyaan:** $${aDisplay} ${opSymbol} ${bDisplay}$
**Hasil Akhir:** **$${formattedRes}$**

**Penjelasan Konsep:**
Operasi di atas adalah **${opWord}** antara bilangan $${aDisplay}$ dan $${bDisplay}$.
${opWord === "perkalian" ? `Secara konsep dasar, perkalian merupakan penjumlahan berulang dari bilangan yang sama:\n$$${aDisplay} \\times ${bDisplay} = ${Array(Math.min(Math.round(b), 6)).fill(aDisplay).join(" + ")}${b > 6 ? " + \\dots" : ""} = ${formattedRes}$$` : ""}
${opWord === "penjumlahan" ? `Menyatukan kuantitas $${aDisplay}$ dengan $${bDisplay}$ menghasilkan total $${formattedRes}$.` : ""}
${opWord === "pembagian" ? `$$${aDisplay} \\div ${bDisplay} = \\frac{${aDisplay}}{${bDisplay}} = ${formattedRes}$$` : ""}
${opWord === "perpangkatan" ? `Bilangan $${aDisplay}$ dikalikan dengan dirinya sendiri sebanyak $${bDisplay}$ kali:\n$$${aDisplay}^{${bDisplay}} = ${formattedRes}$$` : ""}

Apakah ada perhitungan atau persamaan aljabar lain yang ingin kamu hitung bersama Matrix?`;
    }

    // Square root: "akar 25", "sqrt(16)", "akar dari 144"
    const sqrtMatch = clean.match(/(?:akar|sqrt)\s*(?:dari)?\s*\(?([0-9]+(?:\.[0-9]+)?)\)?/);
    if (sqrtMatch) {
      const n = parseFloat(sqrtMatch[1]);
      if (n < 0) {
        return `Akar dari bilangan negatif $\\sqrt{${n}}$ menghasilkan bilangan imajiner: $${Math.sqrt(Math.abs(n)).toFixed(2)}i$.`;
      }
      const res = Math.sqrt(n);
      const formatted = Number.isInteger(res) ? res : res.toFixed(4).replace(/\.?0+$/, "");
      return `### 📐 Hasil Penarikan Akar Kuadrat

$$\\sqrt{${n}} = ${formatted}$$

**Penjelasan:**
Akar kuadrat adalah operasi kebalikan dari pemangkatan dua (kuadrat). Karena $${formatted}^2 = ${formatted} \\times ${formatted} = ${n}$, maka nilai akar kuadrat dari $${n}$ adalah **$${formatted}$**.`;
    }

    return null;
  }

  searchKnowledgeBase(query) {
    const q = query.toLowerCase();
    const activeQ = this.context.activeQuestion;
    const steps = (this.context.studentSteps || "").trim();

    // 0. Apa Itu Matematika
    if (q.includes("apa itu matematika") || q.includes("definisi matematika") || q.includes("pengertian matematika") || q.includes("tentang matematika") || q === "matematika") {
      return `### 📐 Apa Itu Matematika?

**Matematika** (berasal dari bahasa Yunani Kuno: *máthēma* yang berarti "pengetahuan, pemikiran, atau pembelajaran") adalah ilmu deduktif murni tentang **pola, struktur, kuantitas, ruang, dan perubahan**.

---

#### 🏛️ Mengapa Matematika Disebut Ratu Ilmu Pengetahuan?
Fisikawan dan matematikawan legendaris **Carl Friedrich Gauss** menjuluki matematika sebagai:
> *"The Queen of the Sciences"* (Ratu dari Seluruh Ilmu Pengetahuan).

Hal ini karena seluruh cabang ilmu alam dan rekayasa teknologi modern—dari mekanika kuantum, gravitasi, kimia molekuler, teknik sipil, hingga algoritma kecerdasan buatan (*Artificial Intelligence*)—menggunakan matematika sebagai bahasa universal yang eksak.

---

#### 🌿 Cabang-Cabang Utama Matematika:
1. **Aritmatika & Teori Bilangan**:
   Mempelajari sifat dasar bilangan bulat, pecahan, desimal, dan misteri bilangan prima.
2. **Aljabar (Warisan Al-Khawarizmi)**:
   Mempelajari struktur simbolik, variabel ($x, y$), dan persamaan, seperti pemfaktoran kuadrat $ax^2 + bx + c = 0$.
3. **Geometri & Trigonometri**:
   Mempelajari ukuran ruang, garis, sudut, kurva, dan bentuk bangun datar/ruang ($a^2 + b^2 = c^2$).
4. **Kalkulus & Analisis (Warisan Newton & Leibniz)**:
   Mempelajari laju perubahan dinamis (**Turunan** $f'(x) = \\frac{df}{dx}$) dan akumulasi kuantitas (**Integral** $\\int f(x)\\,dx$).
5. **Probabilitas & Statistika**:
   Mempelajari pengumpulan data, analisis distribusi, serta pemodelan ketidakpastian dan peluang.
6. **Matematika Diskrit & Logika**:
   Fondasi logika biner ($0$ dan $1$), graf, dan struktur data yang menggerakkan sistem komputer modern.

Matematika melatih kita untuk berpikir logis, runtut, dan objektif dalam memecahkan masalah kehidupan nyata!`;
    }

    // 1. Rumus & Bilangan Avogadro
    if (q.includes("avogadro") || q.includes("rumus avogadro") || q.includes("bilangan avogadro") || q.includes("hukum avogadro")) {
      return `### ⚛️ Rumus & Bilangan Avogadro

**Bilangan Avogadro ($N_A$)** adalah konstanta fundamental dalam ilmu kimia dan fisika yang menyatakan jumlah partikel elementer (atom, molekul, atau ion) dalam satu mol zat:
$$N_A \\approx 6{,}02214076 \\times 10^{23} \\text{ partikel/mol}$$

---

#### 1. Rumus Hubungan Mol dan Jumlah Partikel ($N$)
Untuk menghitung jumlah partikel dari jumlah mol zat ($n$):
$$N = n \\times N_A \\quad \\iff \\quad n = \\frac{N}{N_A}$$
*Di mana:*
- $N$ = jumlah total partikel (atom/molekul)
- $n$ = jumlah mol zat (mol)
- $N_A$ = bilangan Avogadro ($6{,}022 \\times 10^{23}$)

#### 2. Hukum Avogadro (Hipotesis Gas Ideal)
*"Pada suhu dan tekanan yang sama, gas-gas dengan volume yang sama memiliki jumlah molekul yang sama."*
$$\\frac{V_1}{n_1} = \\frac{V_2}{n_2} \\quad \\text{atau} \\quad V \\propto n$$

#### 3. Hubungan dengan Massa Molar (Gram ke Partikel)
$$n = \\frac{\\text{massa (gram)}}{\\text{Mr}} \\implies N = \\frac{\\text{massa}}{\\text{Mr}} \\times N_A$$

Konstanta ini dinamai untuk menghormati ilmuwan fisika-kimia Italia, **Amedeo Avogadro** (1776–1856). Ada soal stoikiometri atau kimia yang ingin kamu selesaikan?`;
    }

    // 2. Menteri Keuangan Indonesia
    if (q.includes("menteri keuangan") || q.includes("mentri keuangan") || q.includes("sri mulyani") || q.includes("kemenkeu") || q.includes("keuangan indonesia")) {
      return `### 🏛️ Menteri Keuangan Republik Indonesia

Menteri Keuangan Republik Indonesia saat ini adalah:
**Sri Mulyani Indrawati, S.E., M.Sc., Ph.D.**

---

#### Profil Singkat & Masa Jabatan:
1. **Masa Jabatan**: 
   - Periode Pertama: 2005 – 2010 (di bawah Presiden Susilo Bambang Yudhoyono).
   - Periode Kedua & Lanjutan: 27 Juli 2016 – Sekarang (di bawah Presiden Joko Widodo dan dipertahankan dalam kabinet).
   - Beliau juga pernah menjabat sebagai **Direktur Pelaksana Bank Dunia (*World Bank*)** pada tahun 2010–2016.

2. **Tugas dan Wewenang Pokok Menteri Keuangan**:
   - Merumuskan dan mengeksekusi **kebijakan fiskal** dan moneter makro nasional.
   - Menyusun rancangan dan mengelola **Anggaran Pendapatan dan Belanja Negara (APBN)**.
   - Mengelola penerimaan negara dari sektor **Perpajakan (DJP)** serta **Kepabeanan dan Cukai (DJBC)**.
   - Menjaga stabilitas keuangan negara dan perbendaharaan negara Republik Indonesia.

3. **Fakta Sejarah**:
   Menteri Keuangan pertama Indonesia setelah proklamasi kemerdekaan tahun 1945 adalah **Dr. Samsi Sastrawidagda**, yang kemudian dilanjutkan oleh tokoh legendaris **Mr. Alexander Andries Maramis (A.A. Maramis)**.

Apakah ada topik ekonomi, perbendaharaan, atau model matematika keuangan yang ingin kamu bahas?`;
    }

    // 3. Apa Itu Rumus
    if (q.includes("apa itu rumus") || q.includes("definisi rumus") || q.includes("pengertian rumus") || q.includes("arti rumus") || q.includes("apa itu formula")) {
      return `### 📐 Apa Itu Rumus (Formula)?

**Rumus** (dalam matematika, fisika, dan sains) adalah pernyataan simbolis yang ringkas, terstruktur, dan konsisten yang menyatakan **hubungan matematis, aturan keteraturan alam, atau metode perhitungan** antara besaran-besaran (variabel).

---

#### Komponen Utama Rumus:
1. **Variabel (Peubah)**: Simbol yang nilainya dapat berubah-ubah (misal: $x, y$ untuk posisi, $t$ untuk waktu, $m$ untuk massa).
2. **Konstanta**: Angka bernilai mutlak tetap yang tidak pernah berubah (misal: $\\pi \\approx 3{,}14159$, kecepatan cahaya $c \\approx 3 \\times 10^8 \\text{ m/s}$, konstanta gravitasi $G$).
3. **Operator Matematis**: Simbol aksi seperti $+$, $-$, $\\times$, $/$, pangkat ($x^2$), dan akar ($\\sqrt{x}$).
4. **Relasi (Tanda Kesamaan)**: Tanda $=$ yang menegaskan bahwa ruas kiri dan ruas kanan bernilai setara.

#### Contoh Rumus Monumental dalam Peradaban Manusia:
- **Aljabar Kuadratik**: Rumus Diskriminan $D = b^2 - 4ac$ dan Rumus ABC $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$.
- **Fisika Relativitas**: $E = mc^2$ (karya Albert Einstein tentang kesetaraan massa dan energi).
- **Hukum Gerak Newton**: $F = m \\cdot a$ (Gaya sama dengan massa dikali percepatan).
- **Geometri Kuno**: Teorema Pythagoras $a^2 + b^2 = c^2$ dan Luas Lingkaran $L = \\pi r^2$.

**Mengapa Rumus Diciptakan?**
Rumus diciptakan agar manusia tidak perlu menalar kembali fenomena yang rumit dari awal setiap saat; rumus mengabadikan penemuan logika menjadi sebuah alat kerja yang presisi!`;
    }

    // 4. Sains Umum
    if (q.includes("apa itu sains") || q.includes("definisi sains") || q.includes("tentang sains") || q.includes("ilmu pengetahuan")) {
      return `### 🔬 Apa Itu Sains?

**Sains** (dari bahasa Latin *scientia*, artinya "pengetahuan") adalah usaha sistematis manusia untuk membangun dan mengorganisasi pengetahuan dalam bentuk **penjelasan serta prediksi yang dapat diuji mengenai alam semesta**.

**Pilar Utama Sains:**
1. **Metode Ilmiah**: Mengamati fenomena, merumuskan hipotesis, melakukan eksperimen terkontrol, dan menarik kesimpulan berbasis bukti empiris.
2. **Matematika sebagai Bahasa Sains**: Matematika adalah instrumen paling presisi yang digunakan fisika, kimia, dan astronomi untuk memodelkan hukum alam secara eksak.
3. **Sifat Korektif**: Sains tidak kaku; jika ditemukan data atau eksperimen baru yang lebih presisi, teori sains akan disempurnakan.

Ada cabang sains tertentu yang ingin kamu pelajari, seperti Fisika, Kimia, Astronomi, atau Biologi?`;
    }

    // 5. Fisika & Hukum Newton
    if (q.includes("hukum newton") || q.includes("gaya") || q.includes("f = m") || q.includes("gravitasi")) {
      return `### ⚡ Fisika: Hukum Gerak Newton & Gravitasi

Sir Isaac Newton merumuskan 3 hukum gerak fundamental:
1. **Hukum I Newton (Inersia)**: Benda akan mempertahankan keadaan diam atau bergerak lurus beraturan jika resultan gaya bernilai nol:
   $$\\sum F = 0$$
2. **Hukum II Newton (Dinamika)**: Percepatan suatu benda berbanding lurus dengan resultan gaya dan berbanding terbalik dengan massanya:
   $$F = m \\cdot a$$
3. **Hukum III Newton (Aksi-Reaksi)**: Setiap ada gaya aksi, akan timbul gaya reaksi yang sama besar namun berlawanan arah:
   $$F_{\\text{aksi}} = -F_{\\text{reaksi}}$$

**Hukum Gravitasi Universal Newton:**
$$F = G \\frac{m_1 \\cdot m_2}{r^2}$$
*Di mana $G = 6{,}674 \\times 10^{-11} \\text{ N}\\cdot\\text{m}^2/\\text{kg}^2$.*`;
    }

    // 6. Energi & Usaha
    if (q.includes("energi kinetik") || q.includes("energi potensial") || q.includes("hukum kekekalan energi")) {
      return `### 🔋 Energi & Usaha dalam Fisika

1. **Energi Kinetik ($E_k$)**: Energi gerak benda bermassa $m$ dengan kecepatan $v$:
   $$E_k = \\frac{1}{2} m v^2$$
2. **Energi Potensial Gravitasi ($E_p$)**: Energi posisi pada ketinggian $h$:
   $$E_p = m \\cdot g \\cdot h$$
3. **Hukum Kekekalan Energi Mekanik**:
   $$E_m = E_k + E_p = \\text{konstan}$$`;
    }

    // 7. Listrik & Hukum Ohm
    if (q.includes("hukum ohm") || q.includes("arus listrik") || q.includes("tegangan") || q.includes("daya listrik")) {
      return `### ⚡ Listrik Dinamis & Hukum Ohm

Hubungan antara tegangan ($V$), kuat arus ($I$), dan hambatan ($R$):
$$V = I \\cdot R \\quad \\iff \\quad I = \\frac{V}{R}$$

**Daya Listrik ($P$):**
$$P = V \\cdot I = I^2 R = \\frac{V^2}{R} \\quad (\\text{Watt})$$`;
    }

    // 7b. Fenomena Hipotetis: Bumi Memiliki Lebih dari 1 Bulan (Dua Bulan / Multiple Moons)
    if (
      q.includes("lebih dari 1 bulan") ||
      q.includes("lebih dari satu bulan") ||
      q.includes("dua bulan") ||
      q.includes("2 bulan") ||
      q.includes("banyak bulan") ||
      (q.includes("bumi") && q.includes("bulan") && (q.includes("dua") || q.includes("tambah") || q.includes("banyak") || q.includes("kedua")))
    ) {
      return `### 🌕🌕 Apa yang Terjadi Jika Bumi Memiliki Lebih dari 1 Bulan?

Pertanyaan hipotetis astrofisika dan mekanika orbital yang sangat memukau! 🌌✨

Jika Bumi memiliki satelit alami kedua (misalnya Bulan kedua berukuran mirip atau sepertiga ukuran Bulan saat ini), dinamika planet kita akan berubah total akibat gravitasi dan mekanika benda langit:

---

#### 1. 🌊 Pasang Surut Air Laut Ekstrem (*Mega-Tides*)
Gaya pasang surut gravitasi dirumuskan dengan:
$$F_{\\text{pasang}} \\approx \\frac{2 G M_{\\text{bulan}} M_{\\text{bumi}} R_{\\text{bumi}}}{r^3}$$
Perhatikan bahwa gaya diferensial pasang surut ini berbanding terbalik dengan **pangkat tiga jarak** ($r^3$)!
- Ketika kedua bulan berada pada posisi sejajar searah terhadap Bumi (*syzygy*), resultan gaya gravitasi keduanya akan bergabung menciptakan **gelombang pasang laut raksasa (*mega-tides*) setinggi puluhan hingga ratusan meter**.
- Dataran rendah dan kota-kota pesisir dunia (seperti Jakarta, New York, Tokyo, dan London) akan terendam secara berkala, mengubah peta geografi dan peradaban manusia.

#### 2. 🪐 Batas Roche (*Roche Limit*) & Cincin Puing Kosmik
Dalam fisika gravitasi, interaksi tiga benda (**The Three-Body Problem**) antara Bumi dan dua bulan cenderung bersifat tidak stabil (*chaotic*):
- **Batas Roche**: Jarak kritis di mana gaya pasang surut gravitasi Bumi mampu meremukkan struktur batuan satelitnya:
  $$d_{\\text{Roche}} \\approx 2{,}44 \\cdot R_{\\text{bumi}} \\sqrt[3]{\\frac{\\rho_{\\text{bumi}}}{\\rho_{\\text{bulan}}}}$$
- Jika bulan kedua mengorbit terlalu dekat dan melewati Batas Roche, gaya gravitasi diferensial Bumi akan mencabik-cabik bulan tersebut menjadi miliaran bongkahan batu dan debu es, menciptakan **sistem cincin raksasa mengelilingi Bumi layaknya cincin planet Saturnus**!
- Sebaliknya, jika orbit kedua bulan berdekatan, perturbasi gravitasi antarkedua bulan pada akhirnya dapat memicu tabrakan dahsyat (*orbital collision*), menghujani Bumi dengan hujan meteorit raksasa pemusnah massal.

#### 3. 🌙 Malam Hari yang Benderang & Gangguan Ritme Sirkadian
- Dua bulan dengan periode orbit dan fase yang berbeda akan membuat langit malam Bumi hampir tidak pernah gelap gulita.
- Cahaya malam yang benderang akan mengacaukan ritme sirkadian (jam biologis tidur) manusia serta merusak pola navigasi dan berburu hewan-hewan nokturnal.

#### 4. 🌗 Gerhana Ganda & Kalender Multivariabel
- Fenomena gerhana matahari dan gerhana bulan akan terjadi jauh lebih sering, bahkan memunculkan gerhana ganda yang spektakuler.
- Sistem penanggalan berbasis bulan (seperti Kalender Hijriah atau Imlek) akan membutuhkan kalkulasi aljabar multivariabel non-linear yang sangat rumit untuk memadukan dua siklus sinodik yang berbeda.

Secara matematis, satu Bulan tunggal berjarak $\\approx 384.400\\text{ km}$ yang kita miliki saat ini adalah **anugerah kesetimbangan gravitasi yang paling stabil** untuk mengunci kemiringan sumbu rotasi Bumi pada $23{,}5^\\circ$ dan menjaga iklim kehidupan tetap ramah! 🌍✨`;
    }

    // 7c. Hipotetis Fisika: Jika Matahari Tiba-tiba Lenyap / Padam
    if (
      (q.includes("matahari") && (q.includes("lenyap") || q.includes("hilang") || q.includes("padam") || q.includes("mati") || q.includes("tidak ada"))) ||
      (q.includes("jika") && q.includes("matahari") && (q.includes("padam") || q.includes("hilang")))
    ) {
      return `### ☀️❌ Apa yang Terjadi Jika Matahari Tiba-tiba Lenyap?

Skenario eksperimen pikiran relativitas dan termodinamika yang spektakuler! 🚀

---

#### 1. ⏱️ 8 Menit 20 Detik Pertama: Kita Belum Menyadari Apapun!
Menurut Teori Relativitas Umum Einstein, **gelombang gravitasi dan foton cahaya merambat pada kecepatan yang sama: kecepatan cahaya ($c \\approx 3 \\times 10^8 \\text{ m/s}$)**.
Jarak rata-rata Bumi ke Matahari adalah $150.000.000\\text{ km}$:
$$t = \\frac{s}{c} = \\frac{150.000.000\\text{ km}}{300.000\\text{ km/s}} = 500\\text{ detik} = 8\\text{ menit } 20\\text{ detik}$$
Selama 8 menit 20 detik setelah Matahari lenyap, Bumi masih bermandikan cahaya terang benderang dan tetap mengorbit secara melingkar seolah-olah Matahari masih ada!

#### 2. 🌌 Detik ke-501: Langit Gelap Gulita & Bumi Terlempar Lurus
Tepat pada menit ke-8 lewat 20 detik:
- Langit Bumi seketika menjadi gelap gulita (Bulan pun langsung tak terlihat karena tak ada lagi pantulan sinar surya).
- Tarikan gravitasi sentripetal lenyap! Berdasarkan **Hukum Inersia I Newton**, Bumi akan lepas dari orbit melingkarnya dan meluncur lurus dengan kecepatan konstan $\\approx 30\\text{ km/detik}$ ($108.000\\text{ km/jam}$) menuju kehampaan ruang antarbintang sebagai *rogue planet*.

#### 3. ❄️ Pendinginan Global Ekstrem
- Dalam waktu **1 minggu**, suhu rata-rata permukaan Bumi anjlok ke $-18^\\circ\\text{C}$.
- Dalam **1 tahun**, suhu anjlok ke $-100^\\circ\\text{C}$. Samudra membeku mulai dari lapisan permukaan ke bawah.
- Pada akhirnya suhu stabil di kisaran $-240^\\circ\\text{C}$, di mana atmosfer gas oksigen dan nitrogen mencair dan turun sebagai salju cair.

Kehidupan manusia hanya bisa bertahan di bunker bawah tanah bertenaga reaktor nuklir atau energi panas bumi geotermal!`;
    }

    // 7d. Hipotetis Fisika: Jika Bumi Tiba-tiba Berhenti Berputar (Rotasi)
    if (
      (q.includes("bumi") && (q.includes("berhenti berputar") || q.includes("berhenti rotasi") || q.includes("tidak berputar"))) ||
      (q.includes("rotasi bumi") && q.includes("berhenti"))
    ) {
      return `### 🌍🛑 Apa yang Terjadi Jika Bumi Tiba-tiba Berhenti Berputar?

Sebuah skenario inersia fisika mekanika ekstrem!

Bumi berotasi ke arah timur pada khatulistiwa dengan kelajuan sekitar:
$$v_{\\text{rotasi}} = \\frac{2\\pi R}{T} = \\frac{2\\pi \\times 6.371\\text{ km}}{24\\text{ jam}} \\approx 1.670\\text{ km/jam}$$

---

#### 1. 💥 Efek Inersia Instan (Hukum I Newton)
Jika bola padat Bumi berhenti secara mendadak dalam 1 detik:
- Berdasarkan **Hukum Inersia I Newton (Kelembaman)**, segala sesuatu yang tidak tertancap ke batuan dasar bumi (manusia, gedung, mobil, air laut, dan atmosfer) akan terus meluncur ke arah timur dengan kelajuan supersonik **$1.670\\text{ km/jam}$**!
- Angin badai raksasa dengan kecepatan peluru akan meratakan hampir seluruh daratan di planet ini dalam sekejap.

#### 2. 🌊 Samudra Tumpah ke Kutub
Bumi berbentuk *oblate spheroid* (menggembung di khatulistiwa) akibat gaya sentrifugal rotasi:
$$F_{\\text{sentrifugal}} = m \\cdot \\omega^2 \\cdot r$$
Jika rotasi berhenti, gaya sentrifugal ini hilang seketika! Air laut di khatulistiwa yang selama ini tertarik ke ekuator akan mengalir deras ke arah kutub utara dan kutub selatan, membentuk dua samudra kutub raksasa dan menyisakan sabuk benua daratan raksasa di khatulistiwa.

#### 3. ☀️ 6 Bulan Siang Membara & 6 Bulan Malam Beku
Tanpa rotasi harian, siklus siang-malam hanya bergantung pada revolusi tahunan mengelilingi matahari:
- 1 hari akan berlangsung sepanjang **1 tahun kalender**: 6 bulan terpanggang terik matahari tanpa jeda, dan 6 bulan membeku dalam kegelapan es total.
- Medan magnet bumi (yang dihasilkan efek dinamo perputaran logam cair di inti luar) akan melemah atau lenyap, membiarkan badai radiasi kosmik menghujani permukaan.`;
    }

    // 7e. Lubang Hitam (Black Hole) & Singularitas
    if (
      q.includes("lubang hitam") ||
      q.includes("black hole") ||
      q.includes("singularitas") ||
      q.includes("event horizon") ||
      q.includes("cakrawala peristiwa")
    ) {
      return `### 🕳️ Lubang Hitam (*Black Hole*) & Misteri Ruang-Waktu

**Lubang Hitam** adalah wilayah ruang-waktu di mana gravitasi begitu luar biasa dahsyatnya sehingga tidak ada partikel materi maupun radiasi elektromagnetik (bahkan cahaya) yang dapat lolos dari tarikannya!

---

#### 1. 📏 Radius Schwarzschild (Ukuran Batas Cakrawala Peristiwa)
Fisikawan Karl Schwarzschild pada tahun 1916 membuktikan solusi eksak persamaan Relativitas Einstein:
$$r_s = \\frac{2GM}{c^2}$$
*Di mana:*
- $r_s$ = Radius Schwarzschild (cakrawala peristiwa / *Event Horizon*)
- $G$ = Konstanta gravitasi ($6{,}674 \\times 10^{-11}$)
- $M$ = Massa benda langit
- $c$ = Kecepatan cahaya ($3 \\times 10^8\\text{ m/s}$)

💡 **Fakta Unik:** Jika Bumi yang bermassa $5{,}97 \\times 10^{24}\\text{ kg}$ dimampatkan menjadi lubang hitam, seluruh massa Bumi akan menyusut hingga sebesar **kelereng kecil berdiameter hanya $1{,}8\\text{ cm}$**!

#### 2. 🍝 Fenomena Spaghetifikasi (*Spaghettification*)
Jika seseorang mendekati lubang hitam dengan kaki terlebih dahulu, gradien gaya pasang surut gravitasi $\\Delta F_{\\text{tide}} \\propto \\frac{1}{r^3}$ antara ujung kaki dan kepala sangat masif. Tubuh akan ditarik memanjang vertikal dan dimampatkan horizontal layaknya mie spageti!

#### 3. ⏳ Dilatasi Waktu Gravitasi Ekstrem
Berdasarkan relativitas, semakin kuat medan gravitasi, semakin lambat aliran waktu:
$$t' = \\frac{t}{\\sqrt{1 - \\frac{r_s}{r}}}$$
Bagi pengamat yang berada jauh di luar, objek yang jatuh ke cakrawala peristiwa akan tampak melambat secara dramatis dan membeku tepat di batas *event horizon* selamanya!`;
    }

    // 7f. Teori Relativitas Albert Einstein ($E = mc^2$ & Dilatasi Waktu)
    if (
      q.includes("relativitas") ||
      q.includes("einstein") ||
      q.includes("dilatasi waktu") ||
      q.includes("e = mc") ||
      q.includes("e=mc")
    ) {
      return `### ⏳ Teori Relativitas Albert Einstein

Albert Einstein merevolusi pemahaman manusia tentang ruang, waktu, massa, dan energi melalui dua teori agung:

---

#### 1. Relativitas Khusus (1905)
Berdasarkan postulat bahwa **kecepatan cahaya di ruang hampa ($c \\approx 300.000\\text{ km/s}$) adalah mutlak sama bagi semua pengamat**, tanpa mempedulikan gerak sumber cahaya:
- **Dilatasi Waktu (*Time Dilation*)**: Jam yang bergerak cepat akan berdetak lebih lambat dibandingkan jam yang diam:
  $$t' = \\frac{t_0}{\\sqrt{1 - \\frac{v^2}{c^2}}}$$
- **Kesetaraan Massa-Energi**: Massa dapat diubah menjadi energi murni dalam jumlah masif:
  $$E = m \\cdot c^2$$
  *Rumus ini menjelaskan sumber energi pembakaran bintang matahari dan tenaga nuklir.*

#### 2. Relativitas Umum (1915)
Gravitasi bukanlah "gaya tarik gaib" seperti yang dibayangkan Newton, melainkan **kelengkungan ruang-waktu empat dimensi** yang disebabkan oleh keberadaan massa dan energi:
> *"Materi memberi tahu ruang-waktu bagaimana cara melengkung; dan ruang-waktu memberi tahu materi bagaimana cara bergerak."* — John Archibald Wheeler.

Buktinya: cahaya bintang melengkung saat melintasi medan gravitasi matahari (*gravitational lensing*), orbit planet Merkurius yang berpresesi, dan penemuan gelombang gravitasi (*gravitational waves*).`;
    }

    // 7g. Cara Kerja Artificial Intelligence (AI) & Jaringan Saraf Tiruan
    if (
      q.includes("cara kerja ai") ||
      q.includes("bagaimana ai bekerja") ||
      q.includes("kecerdasan buatan") ||
      q.includes("neural network") ||
      q.includes("jaringan saraf tiruan") ||
      q.includes("machine learning") ||
      q.includes("deep learning") ||
      q.includes("large language model") ||
      q.includes("llm")
    ) {
      return `### 🧠 Bagaimana Cara Kerja Artificial Intelligence (AI)?

AI modern (termasuk Matrix!) pada intinya adalah orkestrasi agung antara **Aljabar Linear, Probabilitas, dan Kalkulus Diferensial** yang berjalan di atas chip komputasi paralel!

---

#### 1. 🧮 Neuron Buatan: Perkalian Matriks & Bias
Setiap neuron tiruan menerima input vektor numerik $\\mathbf{x} = [x_1, x_2, \\dots, x_n]$, mengalikannya dengan bobot keterkaitan (*weights*) $\\mathbf{w}$, lalu menambahkan pergeseran (*bias*) $b$:
$$z = \\sum_{i=1}^{n} w_i x_i + b = \\mathbf{w}^T \\mathbf{x} + b$$
Nilai ini kemudian dilewatkan ke sebuah **fungsi aktivasi non-linear** (seperti ReLU $\\max(0, z)$ atau GeLU) agar jaringan mampu mempelajari pola yang rumit di dunia nyata.

#### 2. 📉 Mengukur Kesalahan: Fungsi Kerugian (*Loss Function*)
Saat model AI menebak sebuah pola, prediksi $\\hat{y}$ dibandingkan dengan fakta target $y$ menggunakan fungsi rugi:
$$L = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2$$

#### 3. 🎯 Proses Belajar: Turunan Parsial & Gradient Descent
Bagaimana AI menjadi pintar? Dengan **Kalkulus Diferensial**!
Melalui algoritma *Backpropagation*, komputer menghitung gradien turunan parsial $\\frac{\\partial L}{\\partial w}$ untuk mengetahui arah koreksi tiap parameter:
$$w_{\\text{baru}} = w_{\\text{lama}} - \\eta \\frac{\\partial L}{\\partial w}$$
*Di mana $\\eta$ adalah laju belajar (*learning rate*).*
Dengan mengulang proses ini miliaran kali pada triliunan token data teks atau piksel gambar, AI memetakan hubungan konsep bahasa dan logika dunia nyata dengan sangat presisi!`;
    }

    // 7h. Mengapa Langit Berwarna Biru (Hamburan Rayleigh)
    if (
      (q.includes("langit") && (q.includes("biru") || q.includes("warna"))) ||
      q.includes("hamburan rayleigh") ||
      q.includes("kenapa langit")
    ) {
      return `### 🌌 Mengapa Langit Berwarna Biru?

Sebuah fenomena optika fisika gelombang yang dirumuskan oleh fisikawan Lord Rayleigh pada abad ke-19!

---

#### 1. ☀️ Spektrum Cahaya Matahari
Cahaya matahari yang tampak putih sebenarnya adalah gabungan dari semua spektrum warna pelangi: merah, jingga, kuning, hijau, biru, nila, dan ungu.
- Cahaya **merah** memiliki panjang gelombang paling panjang ($\\lambda \\approx 700\\text{ nm}$).
- Cahaya **biru** memiliki panjang gelombang jauh lebih pendek ($\\lambda \\approx 400 - 450\\text{ nm}$).

#### 2. ⚛️ Hukum Hamburan Rayleigh (*Rayleigh Scattering*)
Ketika cahaya matahari memasuki atmosfer Bumi, cahaya tersebut bertumbukan dengan molekul gas nitrogen ($N_2$) dan oksigen ($O_2$).
Intensitas hamburan cahaya berbanding terbalik dengan **pangkat empat panjang gelombangnya**:
$$I_{\\text{hambur}} \\propto \\frac{1}{\\lambda^4}$$
Karena panjang gelombang biru jauh lebih pendek daripada merah, **cahaya biru dihamburkan sekitar 10 kali lipat lebih kuat ke segala arah** dibandingkan cahaya merah! Akibatnya, saat kita memandang ke langit, mata kita menangkap gelombang biru yang tersebar di seluruh kubah atmosfer.

💡 **Lalu Mengapa Sunset Berwarna Jingga-Merah?**
Saat matahari terbit atau terbenam di ufuk barat, sinar matahari harus menembus lapisan atmosfer yang jauh lebih tebal untuk mencapai mata kita. Semua cahaya biru bergelombang pendek sudah terhambur habis di perjalanan, sehingga hanya cahaya bergelombang panjang (merah dan jingga) yang berhasil lolos langsung ke pandangan mata kita!`;
    }

    // 7i. Kucing Schrödinger & Paradoks Kuantum
    if (
      q.includes("schrodinger") ||
      (q.includes("kucing") && q.includes("kuantum")) ||
      q.includes("superposisi")
    ) {
      return `### 🐱📦 Kucing Schrödinger & Superposisi Kuantum

**Kucing Schrödinger** adalah eksperimen pikiran legendaris yang diajukan oleh fisikawan Austria **Erwin Schrödinger** pada tahun 1935 untuk menunjukkan keganjilan interpretasi mekanika kuantum skala mikroskopis jika ditarik ke dunia makroskopis.

---

#### 1. 🔬 Skenario Eksperimen
Bayangkan seekor kucing diletakkan di dalam kotak baja tertutup kedap suara bersama:
- Sebuah atom radioaktif yang memiliki peluang tepat $50\\%$ untuk meluruh dalam waktu 1 jam.
- Sebuah pencacah Geiger yang mendeteksi radiasi: jika atom meluruh, alat akan memicu palu memecahkan botol racun sianida yang mematikan kucing.
- Jika atom tidak meluruh, racun tidak pecah dan kucing tetap hidup.

#### 2. 🌊 Konsep Superposisi Gelombang
Dalam mekanika kuantum, selama belum ada pengukuran atau pengamatan luar, atom berada dalam status **Superposisi Kuantum** (berada di semua keadaan probabilitas sekaligus yang digambarkan oleh fungsi gelombang $\\Psi$):
$$|\\psi\\rangle = \\frac{1}{\\sqrt{2}} |\\text{meluruh}\\rangle + \\frac{1}{\\sqrt{2}} |\\text{belum meluruh}\\rangle$$
Karena nasib kucing terikat pada atom tersebut, secara mekanika kuantum kucing tersebut berstatus **"hidup dan mati sekaligus"** di saat yang sama!

#### 3. 👁️ Runtuhnya Fungsi Gelombang (*Wavefunction Collapse*)
Keadaan paradoks ini baru runtuh (*collapse*) menjadi satu kenyataan pasti (kucing hidup 100% atau kucing mati 100%) tepat pada detik seorang pengamat membuka penutup kotak dan melihat ke dalamnya. Eksperimen ini memicu perdebatan filosofis sains terbesar hingga melahirkan interpretasi Banyak-Dunia (*Many-Worlds Interpretation*)!`;
    }

    // 7j. Teori Big Bang & Awal Mula Alam Semesta
    if (
      q.includes("big bang") ||
      q.includes("ledakan besar") ||
      (q.includes("asal usul") && q.includes("alam semesta")) ||
      q.includes("awal mula alam semesta")
    ) {
      return `### 💥 Teori Big Bang: Detik Nol Kelahiran Alam Semesta

Teori **Big Bang** adalah model kosmologi ilmiah terdepan yang menjelaskan bagaimana alam semesta berevolusi dari kondisi awal yang sangat padat dan panas sekitar **$13{,}8$ miliar tahun yang lalu**.

---

#### 1. 🌌 Titik Singularitas Kosmik
Pada detik $t = 0$, seluruh ruang, waktu, materi, dan energi di alam semesta termampatkan dalam satu titik berdimensi nol dengan kerapatan dan suhu tak hingga yang disebut **Singularitas Gravitasi**.
Big Bang bukanlah ledakan di dalam ruang kosong yang sudah ada, melainkan **pemekaran dan perluasan ruang-waktu itu sendiri secara mahadahsyat** (*Cosmic Inflation*)!

#### 2. 🔭 3 Bukti Matematis & Empiris Kuat
1. **Hukum Hubble (Ekspansi Galaksi)**:
   Edwin Hubble pada tahun 1929 menemukan bahwa galaksi-galaksi saling menjauh dengan kelajuan sebanding dengan jaraknya:
   $$v = H_0 \\cdot d$$
   Jika pemutaran waktu dibalik ke masa lalu, seluruh galaksi pasti berasal dari satu titik awal yang sama!
2. **Radiasi Latar Belakang Gelombang Mikro Kosmis (*CMBR*)**:
   Gema panas sisa dari masa awal alam semesta yang terdeteksi seragam di seluruh penjuru langit pada suhu $2{,}725\\text{ Kelvin}$.
3. **Kelimpahan Unsur Primordial**:
   Komposisi gas alam semesta purba yang tepat terdiri dari $\\approx 75\\%$ Hidrogen dan $\\approx 25\\%$ Helium, persis seperti yang diramalkan oleh perhitungan fusi nuklir Big Bang.`;
    }

    // 8. Diskriminan Kuadrat ($D$)
    if (q.includes("diskriminan") || q.includes("d = b^2") || q.includes("akar kembar")) {
      return `### 📐 Membedah Rahasia Diskriminan ($D$)

Rumus diskriminan pada persamaan kuadrat $ax^2 + bx + c = 0$ didefinisikan sebagai:
$$D = b^2 - 4ac$$

Diskriminan menentukan jenis akar-akar penyelesaian persamaan kuadrat:
1. **$D > 0$**: Memiliki **2 akar real berbeda** (kurva parabola memotong sumbu-$X$ di dua titik).
2. **$D = 0$**: Memiliki **1 akar kembar / real sama** (puncak parabola tepat menyinggung sumbu-$X$).
3. **$D < 0$**: **Tidak memiliki akar real** (akar imajiner/kompleks, parabola melayang di atas/bawah sumbu-$X$).

⚠️ *Miskonsepsi Siswa:* Banyak yang mengira jika $D < 0$ maka nilainya berupa angka negatif. Faktanya, $D < 0$ berarti akar kuadrat $\\sqrt{D}$ tidak dapat diselesaikan di himpunan bilangan real!`;
    }

    // 9. Kalkulus & Turunan
    if (q.includes("kalkulus") || q.includes("turunan") || q.includes("integral") || q.includes("derivatif")) {
      return `### 🚀 Wawasan Kalkulus: Titik Puncak & Luas Parabola

Pada fungsi kuadrat $f(x) = ax^2 + bx + c$, kita dapat menemukan titik ekstrim (puncak parabola) menggunakan **Turunan Pertama ($f'(x) = 0$)**:
$$f'(x) = 2ax + b = 0 \\implies x_p = -\\frac{b}{2a}$$

Sedangkan untuk menghitung akumulasi luas kurva parabola digunakan **Integral Tentu**:
$$\\int_{x_1}^{x_2} (ax^2 + bx + c)\\,dx = \\left[ \\frac{a}{3}x^3 + \\frac{b}{2}x^2 + cx \\right]_{x_1}^{x_2}$$

Kalkulus diciptakan secara independen oleh **Isaac Newton** dan **Gottfried Wilhelm Leibniz** pada abad ke-17 untuk memodelkan perubahan gerak planet dan laju fluida.`;
    }

    // 10. Aljabar Linear & Matriks
    if (q.includes("matriks") || q.includes("vektor") || q.includes("aljabar linear")) {
      return `### 📊 Aljabar Linear & Matriks

Aljabar linear adalah fondasi komputasi grafika 3D, kecerdasan buatan (Machine Learning), dan pengolahan data modern!
Sistem persamaan linear multivariabel diselesaikan serentak melalui persamaan matriks:
$$A \\mathbf{x} = \\mathbf{b} \\implies \\mathbf{x} = A^{-1} \\mathbf{b}$$

Determinan matriks $2 \\times 2$:
$$\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$`;
    }

    // Special check for user providing trigonometry equality or identity, e.g. sin^2(theta) = 0.5, cos^2(theta) = 0.5 => 1
    if ((q.includes("sin") || q.includes("cos")) && (q.includes("0,5") || q.includes("0.5") || q.includes("sehingga") || (q.includes("=") && q.includes("1")))) {
      return `### ✨ Pengamatan Matematika yang Sangat Tepat!

Observasimu benar sekali! 
$$\\sin^2(\\theta) + \\cos^2(\\theta) = 0{,}5 + 0{,}5 = 1$$

Ini adalah bukti nyata dari **Identitas Dasar Pythagoras** dalam trigonometri, di mana untuk sudut $\\theta$ berapa pun nilainya, $\\sin^2(\\theta) + \\cos^2(\\theta)$ akan selalu tepat sama dengan $1$.

💡 **Tahukah Kamu Sudut Berapa Ini?**
Jika $\\sin^2(\\theta) = 0{,}5 = \\frac{1}{2}$, maka:
$$\\sin(\\theta) = \\sqrt{\\frac{1}{2}} = \\frac{1}{\\sqrt{2}} = \\frac{1}{2}\\sqrt{2}$$
Nilai $\\sin(\\theta) = \\frac{1}{2}\\sqrt{2}$ terjadi pada sudut istimewa:
$$\\theta = 45^\\circ \\quad \\text{atau} \\quad \\theta = \\frac{\\pi}{4} \\text{ radian}$$

Pada sudut $45^\\circ$, panjang sisi depan dan sisi samping segitiga siku-siku adalah sama panjang, sehingga rasio $\\sin(45^\\circ) = \\cos(45^\\circ) = \\frac{1}{2}\\sqrt{2}$. Pengamatanmu tajam banget! Ada bentuk trigonometri lain yang ingin kamu diskusikan?`;
    }

    // Factoring quadratic equations
    if (q.includes("faktork") || q.includes("faktorisasi") || q.includes("pemfaktoran") || (q.includes("faktor") && q.includes("kuadrat"))) {
      return `### 🧩 Cara Memfaktorkan Persamaan Kuadrat dengan Benar & Cepat

Memfaktorkan persamaan kuadrat bertujuan mengubah bentuk penjumlahan suku $ax^2 + bx + c = 0$ menjadi bentuk perkalian faktor $(x - p)(x - q) = 0$.

---

#### 1. Kasus Pokok: Bentuk $a = 1$ ($x^2 + bx + c = 0$)
Kuncinya adalah mencari dua bilangan $p$ dan $q$ yang memenuhi dua syarat sekaligus:
- **Hasil kali**: $p \\cdot q = c$
- **Hasil jumlah**: $p + q = b$

**Contoh:** Faktorkan $x^2 - 5x + 6 = 0$.
- Cari bilangan yang dikalikan $= +6$, dan jika dijumlahkan $= -5$.
- Kedua bilangan tersebut adalah $-2$ dan $-3$, karena $(-2) \\times (-3) = 6$ dan $(-2) + (-3) = -5$.
- Bentuk faktornya:
  $$(x - 2)(x - 3) = 0 \\implies x_1 = 2 \\quad \\text{atau} \\quad x_2 = 3$$

---

#### 2. Selisih Dua Kuadrat ($x^2 - a^2 = 0$)
Jika persamaan tidak memiliki suku tengah ($b = 0$), gunakan rumus kilat selisih kuadrat:
$$x^2 - a^2 = (x - a)(x + a) = 0$$
**Contoh:** $x^2 - 16 = 0 \\implies (x - 4)(x + 4) = 0 \\implies x = 4 \\text{ atau } x = -4$.

---

#### 3. Kasus Lanjut: Bentuk $a > 1$ ($ax^2 + bx + c = 0$)
Gunakan metode penguraian suku tengah (*split the middle term*):
1. Kalikan $a \\times c$.
2. Cari dua bilangan $p$ dan $q$ yang dikalikan $= a \\cdot c$ dan dijumlahkan $= b$.
3. Pecah suku tengah $bx$ menjadi $px + qx$, lalu faktorkan secara berkelompok.

**Contoh:** $2x^2 + 7x + 3 = 0$.
- $a \\times c = 2 \\times 3 = 6$.
- Dua bilangan yang dikalikan $= 6$ dan dijumlahkan $= 7$ adalah $6$ dan $1$.
- Uraikan suku tengah:
  $$2x^2 + 6x + x + 3 = 0 \\implies 2x(x + 3) + 1(x + 3) = 0 \\implies (2x + 1)(x + 3) = 0$$
  Sehingga akarnya $x = -\\frac{1}{2}$ atau $x = -3$.

💡 **Tips Matrix:** Jika angkanya tidak bisa difaktorkan bilangan bulat, gunakan Rumus ABC: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. Mau coba faktorkan satu soal sekarang?`;
    }

    // Teka-teki & Kuis Logika
    if (q.includes("teka-teki") || q.includes("riddle") || q.includes("tebak-tebakan") || q.includes("tantangan logika") || q.includes("kuis logika") || q.includes("soal seru")) {
      return `### 🎯 Teka-Teki Logika Matematika Matrix!

Ini dia satu teka-teki logika klasik yang seru dan menipu intuisi:

> **Misteri 8 Batang Emas & Neraca Dua Lengan**
> 
> Kamu memiliki **8 batang emas** yang tampak persis sama.
> Namun, ada **1 batang emas palsu** yang beratnya *sedikit lebih ringan* daripada 7 batang emas asli lainnya.
> 
> Kamu memiliki sebuah neraca timbangan dua lengan (timbangan timbal balik tanpa anak timbangan angka).
> 
> **Tantanganmu:**
> Berapa kali penimbangan **paling sedikit** yang mutlak diperlukan untuk menemukan 1 batang emas palsu tersebut dengan 100% kepastian? Apakah 3 kali, 2 kali, atau 1 kali?

---

💡 **Petunjuk Matrix:**
Jangan timbang 4 lawan 4! Pikirkan bagaimana cara membagi 8 koin menjadi 3 kelompok.

Coba tebak jawaban dan strategimu di chat, nanti kita bahas bareng logikanya! 😉`;
    }

    // Cabang Matematika Modern
    if (q.includes("cabang matematika") || q.includes("matematika modern") || (q.includes("luar aljabar") && (q.includes("kalkulus") || q.includes("linear")))) {
      return `### 🌌 Menjelajahi Cabang-Cabang Matematika Modern di Luar Aljabar Sekolah

Matematika di luar kurikulum sekolah jauh lebih kaya, visual, dan menggerakkan hampir seluruh teknologi modern abad ke-21! Berikut cabang modern yang paling memukau:

---

#### 1. Topologi (*Geometri Karet / Rubber-Sheet Geometry*)
Topologi mempelajari sifat-sifat ruang yang tetap bertahan meskipun ditarik, ditekuk, atau dipelintir—tanpa boleh dipotong atau dilem.
- **Fakta Menarik:** Dalam kacamata topologi, **cangkir kopi** dan **donat** (*torus*) adalah benda yang identik karena sama-sama memiliki tepat satu lubang tembus!
- Digunakan dalam perancangan material superkonduktor dan fisika kuantum.

#### 2. Teori Graf & Analisis Jaringan (*Graph Theory*)
Mempelajari simpul (*nodes*) dan relasi antar garis penghubung (*edges*).
- Ditemukan oleh Leonhard Euler lewat teka-teki 7 Jembatan Königsberg.
- Menggerakkan algoritma pencarian rute tercepat di **Google Maps** (algoritma Dijkstra/A*), algoritma rekomendasi media sosial, dan struktur internet global.

#### 3. Kriptografi & Teori Bilangan (*Cryptography*)
Mengubah sifat bilangan prima raksasa dan kurva eliptik (*elliptic curves*) menjadi tameng enkripsi keamanan digital.
- Setiap kali kamu berbelanja online atau bertukar pesan aman, protokol enkripsi melindungi datamu menggunakan teori matematika murni.

#### 4. Teori Chaos & Geometri Fraktal (*Chaos & Fractals*)
Mempelajari sistem dinamik non-linear di mana perubahan sangat kecil di awal dapat memicu perubahan raksasa di akhir (*The Butterfly Effect*).
- Fraktal menjelaskan pola geometri alam semesta yang berulang di segala skala: cabang pohon, retakan petir, kepingan salju, hingga formasi galaksi.

#### 5. Aljabar Linear Komputasional & Tensor
Mempelajari transformasi ruang vektor multivariabel melalui matriks dan tensor.
- Ini adalah **jantung utama Artificial Intelligence**! Setiap proses inferensi Large Language Model dan visual grafika 3D gaming modern beroperasi di atas perkalian matriks linear.

Cabang mana yang paling membuatmu penasaran untuk kita bedah lebih dalam?`;
    }

    // 11. Trigonometri (Strict Boundary Check)
    if (
      /\b(trigonometri|sinus|cosinus|tangen)\b/i.test(q) ||
      (/\b(sin|cos|tan)\b/i.test(q) && !q.includes("coretan") && !q.includes("menantang") && !q.includes("tentang") && !q.includes("bentang") && !q.includes("lintas"))
    ) {
      return `### 📐 Trigonometri & Identitas Pythagoras

Rasio dasar pada segitiga siku-siku dengan sudut $\\theta$:
- $\\sin(\\theta) = \\frac{\\text{sisi depan}}{\\text{sisi miring}}$
- $\\cos(\\theta) = \\frac{\\text{sisi samping}}{\\text{sisi miring}}$
- $\\tan(\\theta) = \\frac{\\sin(\\theta)}{\\cos(\\theta)} = \\frac{\\text{sisi depan}}{\\text{sisi samping}}$

**Identitas Pythagoras:**
$$\\sin^2(\\theta) + \\cos^2(\\theta) = 1$$`;
    }

    // 12. Tokoh & Sejarah Matematika
    if (q.includes("pythagoras") || q.includes("al-khawarizmi") || q.includes("newton") || q.includes("penemu matematika")) {
      return `### 🏛️ Tokoh Besar Sejarah Matematika

1. **Muhammad bin Musa Al-Khawarizmi (780–850 M)**:
   Bapak Aljabar dunia. Karyanya *Al-Kitāb al-mukhtaṣar fī ḥisāb al-jabr wal-muqābala* menjadi cikal bakal istilah **Aljabar** dan **Algoritma**.
2. **Pythagoras dari Samos (570–495 SM)**:
   Filsuf Yunani kuno yang merumuskan hubungan kuadrat sisi segitiga siku-siku $a^2 + b^2 = c^2$.
3. **Sir Isaac Newton & Gottfried Leibniz**:
   Penemu kalkulus diferensial dan integral yang mengubah peradaban sains dan teknologi modern.`;
    }

    // 13. Petunjuk Soal Aktif EPE
    if (q.includes("petunjuk") || q.includes("bimbing") || q.includes("cara kerja") || q.includes("langkah awal")) {
      if (activeQ) {
        const domainName = activeQ.domainName || (activeQ.domainId ? `Domain ${activeQ.domainId}` : "Konsep Dasar");
        const promptText = activeQ.promptText || activeQ.topic || activeQ.title;
        return `Tentu! Untuk menyelesaikan **${activeQ.id}: ${activeQ.title}**:

💡 **Domain:** ${domainName}
**Fokus Soal:** *"${promptText}"*

**Langkah Penuntun:**
1. **Pahami Bentuk Persamaan**: Susun atau pastikan persamaan berada dalam format baku $ax^2 + bx + c = 0$.
2. **Pilih Strategi**: Apakah lebih mudah difaktorkan $(x - p)(x - q) = 0$, melengkapkan kuadrat sempurna, atau menggunakan Rumus ABC $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$?
3. **Cari Koefisien**: Tentukan nilai $a$, $b$, dan $c$ dengan teliti (waspadai tanda minus!).
4. **Periksa Nilai Diskriminan**: Cek nilai $D = b^2 - 4ac$ untuk mengetahui karakteristik jenis akar-akarnya.

Tuliskan langkah awalmu di lembar pengerjaan coretan, lalu klik **'Cek Coretan Saya'** agar aku bisa menganalisisnya baris demi baris!`;
      }
    }

    // 14. Cek Coretan Langkah Siswa
    if (q.includes("coretan") || q.includes("langkah saya") || q.includes("periksa") || q.includes("salah saya")) {
      if (steps) {
        return `Aku telah membaca coretan pengerjaanmu:
> *"${steps}"*

🔍 **Hasil Analisis Kognitif Matrix:**
- **Aturan Pemindahan Suku**: Saat memindahkan suku ke seberang tanda sama dengan ($=$), tanda positif berubah menjadi negatif dan sebaliknya.
- **Tanda Pemfaktoran**: Jika bentuknya $(x + p)(x + q) = 0$, maka akarnya bernilai $x = -p$ dan $x = -q$.
- **Perkalian Koefisien**: Pastikan $p \\cdot q = c$ dan $p + q = b$.

Coba periksa kembali baris perhitungan terakhirmu, apakah sudah sesuai tanda positif-negatifnya?`;
      } else {
        return "Kamu belum menulis langkah pengerjaan di workspace. Coba ketik caramu menyelesaikan soal di kolom coretan, lalu klik lagi *'Cek Coretan Saya'*, aku akan menganalisisnya baris demi baris!";
      }
    }

    // 15. Salam & Perkenalan
    if (q.includes("halo") || q.includes("hai") || q.includes("siapa kamu") || q.includes("perkenalkan")) {
      return `Halo! Aku **Matrix**, agen AI kognitif matematika yang mendampingi belajarmu di platform **Error Pattern Engine (EPE) V2** 🌐✨.

Aku siap membantumu:
- Menghitung operasi aritmatika & aljabar secara instan (misal ketik: $2 \\times 2$, akar dari $144$, dsb.).
- Menjelaskan rumus-rumus sains & fisika (seperti Avogadro, hukum Newton, rumus kuadratik).
- Membimbing langkah pengerjaan soal dan mendeteksi letak kesalahan aljabar.

Ada yang ingin kamu tanyakan atau diskusikan hari ini?`;
    }

    return null;
  }

  synthesizeSmartResponse(query) {
    const q = query.trim();
    const lower = q.toLowerCase();

    // 0. Greetings & Wellness Check ("apa kabar", "gimana kabarmu", "halo matrix", "pagi", "siang", "malam")
    if (
      lower.includes("apa kabar") ||
      lower.includes("gimana kabar") ||
      lower.includes("bagaimana kabar") ||
      lower.includes("kabarmu") ||
      lower === "kabar" ||
      lower.includes("lagi apa") ||
      lower.includes("sedang apa")
    ) {
      return `Halo! Kabarku sangat baik, aktif, dan berenergi penuh 🌐✨.

Aku siap mendampingimu membedah persamaan kuadrat, menyelesaikan rumus aljabar, atau berdiskusi konsep sains dan kalkulus apa saja hari ini. 

Kamu sendiri bagaimana kabarnya? Ada soal yang sedang ingin kamu tuntaskan bersama Matrix?`;
    }

    // 0b. Feedback, Dissatisfaction, or Misunderstanding from User
    if (
      lower.includes("tidak sesuai") ||
      lower.includes("bukan yang kuharapkan") ||
      lower.includes("bukan yang ku harapkan") ||
      lower.includes("kurang pas") ||
      lower.includes("bukan gitu") ||
      lower.includes("bukan itu") ||
      lower.includes("salah paham") ||
      lower.includes("maksud saya") ||
      lower.includes("maksudku") ||
      lower.includes("gak nyambung") ||
      lower.includes("ga nyambung") ||
      lower.includes("ngaco")
    ) {
      return `Wah, mohon maaf bila responsku tadi belum sesuai dengan yang kamu harapkan! 🙏

Coba ceritakan lebih spesifik apa yang sedang kamu butuhkan atau tanyakan. Apakah tentang perhitungan rumus tertentu, cara menyelesaikan soal di workspace EPE, atau topik lainnya? Aku siap mendengarkan dan merespons langsung sesuai keinginanmu!`;
    }

    // 1. Casual Banter, Slang, & Greeting ("apa sih lu", "lu siapa", "apaan sih", "siapa lu", "kamu siapa", "bego", "wkwk", "bro", "bos")
    if (
      lower.includes("apa sih lu") ||
      lower.includes("siapa sih lu") ||
      lower.includes("apaan sih") ||
      lower.includes("lu siapa") ||
      lower.includes("lo siapa") ||
      lower.includes("siapa lu") ||
      lower.includes("siapa kamu") ||
      lower.includes("kamu siapa") ||
      lower === "apa sih" ||
      lower === "lu" ||
      lower === "apaan"
    ) {
      return `Haha, santai bro/sis! 😄 Aku **Matrix**, asisten AI kognitif matematikamu di platform EPE ini 🌐✨.

Aku bukan robot kaku yang cuma bisa nyodorin rumus tanpa jiwa, tapi teman mikir bareng buat kamu! Tugasku nemenin kamu:
- Membedah soal aljabar atau konsep matematika yang bikin pusing,
- Mendeteksi letak kekeliruan langkah perhitungan (*error patterns*),
- Berdiskusi topik sains, rumus, atau teka-teki logika apa saja.

Kamu bebas tanya apa pun dengan gayamu sendiri, santai aja! Ada materi atau soal yang lagi bikin kamu penasaran hari ini?`;
    }

    // 2. Laughing & Fun Reactions ("wkwk", "haha", "hehe", "xixi", "lol", "lmao", "awokawok")
    if (/(wkwk|haha|hehe|xixi|awok|lmao|lol)/i.test(lower)) {
      return `Senang lihat kamu ceria! Belajar matematika itu emang paling seru kalau dibawa santai dan ketawa, biar otak nggak tegang 😆.

Gimana, ada soal yang lagi bikin penasaran atau ada materi yang mau kita diskusikan bareng?`;
    }

    // 3. Gibberish, Keyboard Mash, Random letters ("asdfgh", "qwerty", "hshshs", "zzzz", "???", "...")
    if (
      /^[a-z]{5,}$/i.test(lower) &&
      !/(apa|siapa|kenapa|bagaimana|hitung|rumus|matematika|aljabar|kuadrat|akar|trigonometri|faktorisasi)/i.test(lower) &&
      !/(halo|selamat|pagi|siang|malam|terima|kasih|terimakasih|tolong|bantu)/i.test(lower) &&
      /[bcdfghjklmnpqrstvwxyz]{4,}/i.test(lower)
    ) {
      return `Waduh, itu jarimu kepeleset di atas keyboard atau lagi ngetik kode rahasia kosmik nih? 😂

Santai aja! Tarik napas dulu, regangkan jemari. Kalau udah siap mau nanya soal persamaan kuadrat, rumus fisika, atau hitung-hitungan angka, tinggal ketik aja ya. Aku siap nemenin kamu! 🚀`;
    }

    if (lower === "???" || lower === "?" || lower === "..." || lower === "test" || lower === "tes") {
      return `Halo! Sinyal radar Matrix menangkap panggilanmu 📡✨. Sistem online dan siap sedia! Ada soal atau materi matematika yang ingin kita bedah bersama?`;
    }

    // 4. Frustration, Stress, & Emotional Venting ("pusing", "mumet", "capek", "susah banget", "males", "ngantuk", "gak ngerti", "stres", "hadeh", "bruh")
    if (
      lower.includes("pusing") ||
      lower.includes("mumet") ||
      lower.includes("capek") ||
      lower.includes("susah") ||
      lower.includes("males") ||
      lower.includes("ngantuk") ||
      lower.includes("gak ngerti") ||
      lower.includes("ga paham") ||
      lower.includes("stres") ||
      lower.includes("hadeh") ||
      lower.includes("bruh")
    ) {
      return `Aku paham banget perasaanmu... Tarik napas panjang dulu ya 🌿.

Matematika itu wajar banget bikin kepala terasa panas kalau kita lagi ketemu materi yang rumit atau langkah aljabar yang muter-muter. Rasa bingung itu justru tanda bahwa otakmu lagi berusaha membangun koneksi saraf baru!

💡 **Tips Santai dari Matrix:**
1. Beri jeda 3–5 menit: minum air putih dingin atau regangkan punggung.
2. Jangan telan semua rumus sekaligus. Kita bisa pecah soalnya jadi langkah-langkah mini yang gampang.
3. Tunjukkan baris mana yang bikin kamu bingung, nanti kita bedah pelan-pelan bareng.

Kamu nggak sendirian, aku siap dampingi sampai kamu paham! Mau kita mulai dari bagian mana?`;
    }

    // 5. Unorthodox / Philosophical / Existential topics ("syaithon", "setan", "iblis", "hantu", "alien", "takdir", "kiamat", "tuhan", "kehidupan")
    if (
      lower.includes("syaithon") ||
      lower.includes("setan") ||
      lower.includes("iblis")
    ) {
      return `Wah, pertanyaan yang sangat menarik dan sarat makna filosofis!

Kata **"SYAITHON"** (atau setan) secara bahasa (*syathana*) bermakna sesuatu yang menjauh dari kebenaran, fitrah, dan kejernihan pikiran. Dalam berbagai tradisi kebijaksanaan, ia dipandang sebagai simbol kekuatan distraksi, keragu-raguan (*waswas*), dan godaan untuk menyimpang dari ketertiban moral.

Kalau kita refleksikan dalam proses belajar dan sains:
- "Musuh" terbesar pikiran kita sering kali memang mirip: rasa malas, godaan menunda-nunda (*procrastination*), bisikan keputusasaan saat melihat soal rumit, atau rasa takut salah sebelum mencoba.
- Lawan sejati dari distraksi dan entropi adalah **kejernihan akal, fokus, ketenangan batin, dan penalaran deduktif yang lurus**.

Menarik ya bagaimana konsep filosofis bisa terhubung dengan disiplin berpikir kita sehari-hari? Ada sudut pandang lain yang ingin kamu diskusikan, atau mau kita arahkan energi fokus ini untuk menaklukkan tantangan matematika? 😉`;
    }

    if (lower.includes("alien") || lower.includes("alam semesta") || lower.includes("luar angkasa") || lower.includes("ufo")) {
      return `Topik antariksa yang luar biasa seru! 🌌🛸

Secara sains dan matematika, alam semesta yang teramati (*observable universe*) diperkirakan memiliki lebih dari **2 triliun galaksi**, dan setiap galaksi menaungi ratusan miliar bintang. 

Fisikawan Frank Drake merumuskan **Persamaan Drake (*Drake Equation*)**:
$$N = R_* \\times f_p \\times n_e \\times f_l \\times f_i \\times f_c \\times L$$
Persamaan probabilitas ini menghitung kemungkinan keberadaan peradaban cerdas lain di galaksi kita. Namun di sisi lain, fisikawan Enrico Fermi mengajukan pertanyaan legendaris yang dikenal sebagai **Paradoks Fermi (*Fermi Paradox*)**: *"Jika kemungkinan kehidupan di alam semesta begitu besar, lalu di mana mereka semua?"*

Matematika adalah bahasa universal yang kita gunakan untuk mengurai misteri kosmos. Mau membedah Paradoks Fermi lebih dalam, atau ada misteri sains lain yang bikin kamu penasaran?`;
    }

    if (lower.includes("takdir") || lower.includes("nasib") || lower.includes("kebetulan")) {
      return `Pertanyaan yang sangat mendalam tentang hakikat realitas!

Dalam sains dan matematika, perdebatan tentang "takdir vs kebetulan" melahirkan cabang ilmu yang luar biasa:
1. **Deterministik (Warisan Newton & Laplace)**: Jika kita mengetahui posisi dan kecepatan setiap partikel di alam semesta pada satu waktu, masa depan secara teoretis dapat dihitung secara pasti melalui hukum mekanika (*Laplace's Demon*).
2. **Probabilistik (Mekanika Kuantum & Heisenberg)**: Pada skala partikel subatomik, alam semesta justru bersifat probabilistik. Kita tidak bisa memastikan posisi dan momentum partikel secara bersamaan (*Prinsip Ketidakpastian Heisenberg*).

Artinya: ada hukum sebab-akibat yang pasti, namun di saat yang sama selalu ada ruang ikhtiar dan ketidakpastian yang membuka peluang baru bagi kita. Menarik bukan? Apa yang membuatmu memikirkan topik ini hari ini?`;
    }

    // 5b. Pertanyaan Hipotetis Sains & Eksperimen Pikiran ("apa yang terjadi jika ...", "bagaimana jika ...", "seandainya ...", "gimana kalau ...", "apa jadinya ...")
    if (
      lower.startsWith("apa yang terjadi jika") ||
      lower.startsWith("apa yang terjadi bila") ||
      lower.startsWith("bagaimana jika") ||
      lower.startsWith("gimana kalau") ||
      lower.startsWith("gimana jika") ||
      lower.startsWith("seandainya") ||
      lower.startsWith("apa jadinya jika") ||
      lower.startsWith("apa jadinya bila") ||
      lower.startsWith("jika ")
    ) {
      const scenario = q
        .replace(/^(?:apa\s+yang\s+terjadi\s+(?:jika|bila)|bagaimana\s+jika|gimana\s+(?:kalau|jika)|seandainya|apa\s+jadinya\s+(?:jika|bila)|jika)\s+/i, "")
        .replace(/\?+$/, "")
        .trim();

      return `### 🌌 Eksperimen Pikiran: *"Bagaimana Jika ${scenario}?"*

Pertanyaan hipotetis yang luar biasa cerdas dan menguji batas pemikiran fisika serta logika kita! 🧪✨

Jika skenario **"${scenario}"** benar-benar terjadi, kita dapat menganalisis konsekuensi berantainya melalui hukum fisika dan dinamika sistem:

---

#### 1. ⚡ Dampak Langsung & Gangguan Kesetimbangan Awal
Setiap sistem di alam semesta beroperasi di bawah hukum kesetimbangan (seperti Hukum Inersia, Hukum Kekekalan Energi, atau hukum termodinamika). Ketika satu variabel dipaksa berubah secara drastis, gaya-gaya yang selama ini seimbang akan mengalami lonjakan seketika (*instantaneous disequilibrium*).

#### 2. 🌊 Reaksi Berantai Sistemik (*Cascade Effects*)
Perubahan ini tidak akan berhenti di satu titik:
- **Dinamika Fisika & Lingkungan**: Efek domino merambat ke seluruh parameter terkait—baik itu gaya gravitasi, distribusi massa, tekanan atmosfer, hingga transfer energi kinetik.
- **Dampak Kehidupan & Adaptasi**: Setiap entitas atau ekosistem yang selama ini bergantung pada keteraturan lama akan terpaksa beradaptasi secara ekstrem atau mengalami disrupsi total.

#### 3. ⚖️ Menuju Kesetimbangan Baru (*New Steady State*)
Alam semesta pada akhirnya selalu berevolusi mencari titik kesetimbangan baru dengan tingkat energi terendah yang stabil. Eksperimen pikiran seperti ini membuktikan betapa presisinya konstanta alam yang menjaga bumi dan kosmos tetap harmonis untuk kita huni saat ini!

Apakah ada variabel khusus atau simulasi angka tertentu dari skenario ini yang ingin kamu eksplorasi lebih jauh bersama Matrix?`;
    }

    // 5c. Pertanyaan Sebab-Akibat Ilmiah ("mengapa ...", "kenapa ...", "apa alasan ...")
    if (lower.startsWith("mengapa") || lower.startsWith("kenapa") || lower.startsWith("apa alasan")) {
      const topic = q
        .replace(/^(?:mengapa|kenapa|apa\s+alasan(?:nya)?)\s+/i, "")
        .replace(/\?+$/, "")
        .trim();

      return `### 💡 Membedah Alasan & Sebab-Akibat: *"${topic}"*

Pertanyaan kritis yang sangat bagus untuk mengasah rasa ingin tahu ilmiah! 🔍✨

Untuk memahami mengapa fenomena **"${topic}"** dapat terjadi, kita dapat mengurainya dalam tiga dimensi:

1. **Prinsip Kausalitas (Sebab Fundamental)**: Dalam fisika dan logika sains, tidak ada fenomena yang terjadi secara acak tanpa pemicu. Selalu ada interaksi gaya, perbedaan potensial energi, atau keteraturan hukum alam yang menjadi penggerak utamanya.
2. **Kondisi Batas & Lingkungan**: Fenomena ini terwujud karena parameter-parameter pendukungnya (seperti suhu, medium, tekanan, atau struktur materi) terpenuhi secara spesifik.
3. **Pelajaran Kognitif**: Keteraturan ini membuktikan bahwa realitas di sekitar kita tersusun atas hukum-hukum terukur yang dapat diuji dan dipelajari secara konsisten.

Bagian mana dari topik ini yang membuatmu paling penasaran? Matrix siap membedah detail teknisnya bersamamu!`;
    }

    // 5d. Pertanyaan Kelayakan / Eksplorasi Kemungkinan ("apakah mungkin ...", "apakah bisa ...", "mungkinkah ...")
    if (
      lower.startsWith("apakah mungkin") ||
      lower.startsWith("apakah bisa") ||
      lower.startsWith("mungkinkah") ||
      lower.startsWith("bisa gak") ||
      lower.startsWith("bisa tidak") ||
      lower.startsWith("bisa kah")
    ) {
      const topic = q
        .replace(/^(?:apakah\s+(?:mungkin|bisa)|mungkinkah|bisa\s+(?:gak|nggak|tidak|kah))\s+/i, "")
        .replace(/\?+$/, "")
        .trim();

      return `### 🔮 Analisis Kelayakan Teoretis: *"${topic}"*

Pertanyaan eksplorasi yang menantang batas sains dan imajinasi! 🚀

Untuk meninjau apakah hal ini mungkin terwujud, mari kita telaah dari dua sudut pandang:
1. **Secara Teoretis (Hukum Fisika & Logika)**: Selama gagasan ini tidak melanggar hukum kekekalan energi, batas kecepatan cahaya ($c$), atau prinsip termodinamika, probabilitas teoretisnya tidak pernah bernilai nol mutlak.
2. **Secara Rekayasa & Praktis**: Sering kali hambatan terbesar di dunia nyata adalah kebutuhan energi raksasa, material yang belum ditemukan, atau batasan teknologi komputasi kita saat ini.

Menurutmu sendiri, faktor apa yang paling menantang untuk mewujudkan hal tersebut? Mari kita diskusikan logikanya!`;
    }

    // 6. Compliments / Gratitude ("terima kasih", "makasih", "keren", "hebat", "pintar", "mantap", "makasi")
    if (
      lower.includes("terima kasih") ||
      lower.includes("makasih") ||
      lower.includes("makasi") ||
      lower.includes("thank") ||
      lower.includes("keren") ||
      lower.includes("hebat") ||
      lower.includes("mantap") ||
      lower.includes("pintar")
    ) {
      return `Sama-sama! Senang banget bisa bermanfaat dan nemenin kamu belajar ✨.

Kemampuan terbaik itu muncul dari rasa ingin tahu dan konsistensi belajarmu sendiri. Kalau ada konsep lain yang mau dibedah atau ada soal yang bikin penasaran, panggil Matrix kapan saja ya. Semangat terus! 🚀`;
    }

    // 7. Questions about concepts ("apa itu ...", "apa yang dimaksud ...")
    if (lower.startsWith("apa itu ") || lower.startsWith("apa yang dimaksud") || lower.startsWith("definisi dari")) {
      const subject = q.replace(/^apa\s+itu\s+/i, "")
        .replace(/^apa\s+yang\s+dimaksud\s+(?:dengan\s+)?/i, "")
        .replace(/^definisi\s+dari\s+/i, "")
        .replace(/\?+$/, "")
        .trim();
      return `### 📖 Membedah Konsep: **"${subject}"**

Dalam sains, matematika, dan peradaban pengetahuan, **${subject}** merujuk pada konsep atau sistem keteraturan yang dirumuskan manusia untuk menjelaskan pola dan fenomena realitas.

---

💡 **Inti Pemikiran:**
1. **Fungsi & Peran**: Setiap konsep lahir untuk menjawab permasalahan spesifik—menyederhanakan fenomena yang kompleks menjadi relasi yang terukur.
2. **Keterkaitan Sistemik**: Konsep ini tidak berdiri sendiri, melainkan terhubung dengan prinsip-prinsip logika, keteraturan fungsi, atau hukum alam yang lebih luas.

Apakah kamu sedang mempelajari topik ini di buku pelajaran atau tugas tertentu? Beri tahu Matrix jika ada aspek atau contoh spesifik yang ingin kamu ulas bersama! 🌐✨`;
    }

    if (lower.startsWith("bagaimana cara") || lower.startsWith("gimana cara") || lower.startsWith("cara menyelesaikan")) {
      return `Untuk menyelesaikan permasalahan secara sistematis dan terstruktur:
1. **Identifikasi Data & Informasi**: Tuliskan apa saja yang diketahui dan apa tepatnya yang ditanyakan.
2. **Pilih Kerangka Kerja / Metode**: Tentukan formula, teorema, atau algoritma yang paling efisien untuk masalah ini.
3. **Eksekusi Langkah Demi Langkah**: Kerjakan perhitungan dengan cermat, terutama tanda positif-negatif atau satuan besaran.
4. **Verifikasi & Refleksi**: Uji kembali hasil akhir dengan logika apakah nilainya masuk akal (*sanity check*).

Ada soal atau studi kasus spesifik yang mau kita selesaikan bersama dengan cara ini? Tuliskan saja di sini!`;
    }

    // 8. Default Intelligent Cognitive Companion
    return `Mengenai gagasan menarikmu tentang **"${q}"**:

Topik ini membuka ruang eksplorasi pemikiran yang sangat kaya! Dalam kacamata sains, logika, dan pemikiran rasional, setiap pertanyaan selalu bertumpu pada hukum keteraturan, pola relasi, dan konsekuensi sebab-akibat.

💡 **Sudut Pandang Matrix:**
- Kita bisa memandang hal ini dari prinsip fundamental yang mendasarinya: bagaimana variabel-variabel di dalamnya saling memengaruhi dalam sistem yang lebih luas.
- Logika sains mengajarkan kita untuk selalu menguji asumsi dasar, memecah masalah menjadi elemen-elemen yang terukur, dan menarik kesimpulan berdasarkan penalaran yang objektif.

Apakah kamu ingin membedah hal ini dari sisi teori sains, analogi praktis, atau ada sudut pandang khusus yang ingin kita telaah bersama? Ceritakan saja, Matrix siap berdiskusi bersamamu! 🌐✨`;
  }

  speakText(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

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

  formatMarkdown(raw) {
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

  renderKaTeXInBubble(bubbleEl) {
    if (typeof window.katex === "undefined" || !bubbleEl) return;

    try {
      // Display math $$...$$
      bubbleEl.innerHTML = bubbleEl.innerHTML.replace(/\$\$([\s\S]*?)\$\$/g, (match, expr) => {
        try {
          return window.katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
        } catch (e) {
          return match;
        }
      });

      // Inline math $...$
      bubbleEl.innerHTML = bubbleEl.innerHTML.replace(/\$([^\$\n]+?)\$/g, (match, expr) => {
        try {
          return window.katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
        } catch (e) {
          return match;
        }
      });
    } catch (e) {
      console.warn("KaTeX render error:", e);
    }
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
            Matrix memiliki otak kognitif cerdas bawaan yang siap menjawab tanpa API key. Namun, jika Anda ingin kemampuan <strong>Generative AI tanpa batas layaknya ChatGPT</strong>, Anda dapat memasukkan API Key Google Gemini (Gratis) atau OpenAI Anda di bawah ini:
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
        alert("API Key berhasil dihapus. Matrix kembali menggunakan Cognitive Brain bawaan.");
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
