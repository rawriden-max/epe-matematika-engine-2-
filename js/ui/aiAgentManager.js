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
import { VisionProvider } from "../multimodal/visionProvider.js";
import { SpeechMathParser } from "../multimodal/speechMathParser.js";
import { WebSearchService } from "../services/webSearchService.js";

const CHAT_HISTORY_STORAGE_KEY = "epe_matrix_chat_history_v1";
const SESSIONS_STORAGE_KEY = "epe_matrix_chat_sessions_v2";
const ACTIVE_SESSION_STORAGE_KEY = "epe_matrix_active_session_id_v2";

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

    // Chat History & Persistence (Multi-Session Architecture)
    this.responseDepth = "standard"; // "quick" | "standard" | "detailed"
    this.pendingImageAttachment = null;
    this.sessions = this.loadSessions();
    this.activeSessionId = this.loadActiveSessionId();
    this.activeSession = this.sessions.find(s => s.id === this.activeSessionId) || this.sessions[0];
    this.messages = this.activeSession ? this.activeSession.messages : [];

    this.recognition = null;
    this.isRecordingVoice = false;

    this.init();
  }

  loadSessions() {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(s => ({
            ...s,
            messages: (s.messages || []).map(m => ({
              ...m,
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
            }))
          }));
        }
      }

      // Fallback migration from legacy single-session history
      const legacy = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const firstUserMsg = parsedLegacy.find(m => m.sender === "user");
          const legacyTitle = firstUserMsg ? this.generateSessionTitle(firstUserMsg.text) : "Percakapan Sebelumnya";
          return [
            {
              id: "session_legacy_" + Date.now(),
              title: legacyTitle,
              createdAt: Date.now() - 3600000,
              updatedAt: Date.now(),
              messages: parsedLegacy.map(m => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date()
              }))
            }
          ];
        }
      }
    } catch (e) {
      console.warn("Gagal memuat sessions dari localStorage:", e);
    }

    return [this.createDefaultSession()];
  }

  createDefaultSession() {
    return {
      id: "session_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      title: "Obrolan Baru",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          sender: "assistant",
          text: "Halo! Aku **Matrix**, asisten AI kognitif matematikamu 🌐✨.\n\nAku siap mendampingimu menyelesaikan soal diagnostik, membedah langkah aljabar, atau berdiskusi topik sains dan matematika apa saja. Ada yang ingin kamu tanyakan atau diskusikan?",
          timestamp: new Date()
        }
      ]
    };
  }

  loadActiveSessionId() {
    const saved = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (saved && this.sessions.some(s => s.id === saved)) {
      return saved;
    }
    return this.sessions[0]?.id || "";
  }

  saveSessions() {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(this.sessions));
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, this.activeSessionId);
      if (this.messages) {
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(this.messages.slice(-60)));
      }
    } catch (e) {
      console.warn("Gagal menyimpan sessions ke localStorage:", e);
    }
  }

  saveHistory() {
    this.saveSessions();
  }

  generateSessionTitle(promptText) {
    if (!promptText) return "Sesi Diskusi";
    let clean = promptText.replace(/[*#_`$]/g, "").replace(/\s+/g, " ").trim();
    if (clean.length > 32) {
      clean = clean.slice(0, 32).trim() + "...";
    }
    return clean || "Sesi Diskusi";
  }

  createNewSession() {
    const newSession = this.createDefaultSession();
    this.sessions.unshift(newSession);
    this.activeSessionId = newSession.id;
    this.activeSession = newSession;
    this.messages = newSession.messages;
    this.saveSessions();
    this.renderMessages();
    this.closeHistoryPanel();
    this.renderHistoryPanel();
    if (this.chatInput) {
      this.chatInput.value = "";
      setTimeout(() => this.chatInput.focus(), 150);
    }
  }

  switchSession(sessionId) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return;
    this.activeSessionId = sessionId;
    this.activeSession = session;
    this.messages = session.messages;
    this.saveSessions();
    this.renderMessages();
    this.closeHistoryPanel();
    this.renderHistoryPanel();
  }

  deleteSession(sessionId, event) {
    if (event) event.stopPropagation();
    if (!confirm("Hapus sesi percakapan ini secara permanen?")) return;

    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    if (this.sessions.length === 0) {
      const fresh = this.createDefaultSession();
      this.sessions.push(fresh);
      this.activeSessionId = fresh.id;
      this.activeSession = fresh;
      this.messages = fresh.messages;
    } else if (this.activeSessionId === sessionId) {
      this.activeSessionId = this.sessions[0].id;
      this.activeSession = this.sessions[0];
      this.messages = this.activeSession.messages;
    }
    this.saveSessions();
    this.renderMessages();
    this.renderHistoryPanel();
  }

  clearAllSessions() {
    if (!confirm("Apakah kamu yakin ingin menghapus SEMUA riwayat percakapan?")) return;
    this.sessions = [this.createDefaultSession()];
    this.activeSessionId = this.sessions[0].id;
    this.activeSession = this.sessions[0];
    this.messages = this.activeSession.messages;
    this.saveSessions();
    this.renderMessages();
    this.renderHistoryPanel();
  }

  clearHistory() {
    if (!this.activeSession) return;
    this.activeSession.messages = [
      {
        sender: "assistant",
        text: "Sesi percakapan ini telah dibersihkan 🔄✨. Ada topik atau soal baru apa yang ingin kita bahas bersama?",
        timestamp: new Date()
      }
    ];
    this.activeSession.updatedAt = Date.now();
    this.messages = this.activeSession.messages;
    this.saveSessions();
    this.renderMessages();
    this.renderHistoryPanel();
  }

  toggleHistoryPanel() {
    if (!this.historyPanel) return;
    if (this.historyPanel.classList.contains("open")) {
      this.closeHistoryPanel();
    } else {
      this.openHistoryPanel();
    }
  }

  openHistoryPanel() {
    if (!this.historyPanel) return;
    this.renderHistoryPanel();
    this.historyPanel.classList.add("open");
    this.historyPanel.classList.remove("translate-x-full", "pointer-events-none", "invisible", "opacity-0");
    this.historyPanel.style.transform = "translateX(0)";
    this.historyPanel.style.visibility = "visible";
    this.historyPanel.style.pointerEvents = "auto";
    this.historyPanel.style.opacity = "1";
  }

  closeHistoryPanel() {
    if (!this.historyPanel) return;
    this.historyPanel.classList.remove("open");
    this.historyPanel.classList.add("translate-x-full", "pointer-events-none", "invisible", "opacity-0");
    this.historyPanel.style.transform = "translateX(100%)";
    this.historyPanel.style.visibility = "hidden";
    this.historyPanel.style.pointerEvents = "none";
    this.historyPanel.style.opacity = "0";
  }

  renderHistoryPanel() {
    if (!this.sessionsListEl) return;
    if (this.sessionsCountEl) {
      this.sessionsCountEl.textContent = `${this.sessions.length} sesi tersimpan`;
    }

    if (!this.sessions || this.sessions.length === 0) {
      this.sessionsListEl.innerHTML = `
        <div class="p-6 text-center text-slate-500 text-xs">
          <p>Belum ada riwayat percakapan.</p>
        </div>
      `;
      return;
    }

    let html = "";
    this.sessions.forEach((sess) => {
      const isActive = sess.id === this.activeSessionId;
      const msgCount = sess.messages ? sess.messages.length : 0;
      const lastMsg = sess.messages && sess.messages.length > 0 ? sess.messages[sess.messages.length - 1] : null;
      const timeDate = sess.updatedAt ? new Date(sess.updatedAt) : (lastMsg?.timestamp ? new Date(lastMsg.timestamp) : new Date());
      
      const isToday = new Date().toDateString() === timeDate.toDateString();
      const timeFormatted = isToday 
        ? `Hari ini, ${timeDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}`
        : timeDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="ai-session-item p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
          isActive
            ? "border-cyan-500/60 bg-gradient-to-r from-cyan-950/40 to-slate-900 shadow-md shadow-cyan-950/30"
            : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/60 hover:border-slate-700"
        }" data-session-id="${sess.id}">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <svg class="w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"} shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
              <h4 class="text-xs font-bold ${isActive ? "text-cyan-200" : "text-white"} truncate">${sess.title || "Obrolan"}</h4>
              ${isActive ? '<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">Aktif</span>' : ''}
            </div>
            <div class="flex items-center gap-2 text-[10px] text-slate-400">
              <span>${timeFormatted}</span>
              <span>&bull;</span>
              <span>${msgCount} pesan</span>
            </div>
          </div>

          <button type="button" class="btn-delete-session p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0" data-session-id="${sess.id}" title="Hapus Sesi Ini">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `;
    });

    this.sessionsListEl.innerHTML = html;

    // Attach click handlers
    this.sessionsListEl.querySelectorAll(".ai-session-item").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-session-id");
        if (id) this.switchSession(id);
      });
    });

    this.sessionsListEl.querySelectorAll(".btn-delete-session").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = btn.getAttribute("data-session-id");
        if (id) this.deleteSession(id, e);
      });
    });
  }

  exportHistoryAsMarkdown() {
    if (!this.messages || this.messages.length === 0) return;
    const sessionTitle = this.activeSession?.title || "Sesi Matrix AI";
    let md = `# Riwayat Percakapan Matrix AI - EPE Matematika\n\n`;
    md += `### Sesi: ${sessionTitle}\n`;
    md += `*Tanggal Ekspor: ${new Date().toLocaleString("id-ID")}*\n\n---\n\n`;
    this.messages.forEach((m, idx) => {
      const senderName = m.sender === "user" ? "👤 Siswa" : "🤖 Matrix AI";
      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString("id-ID") : "";
      md += `#### ${idx + 1}. ${senderName} (${timeStr})\n\n${m.text}\n\n`;
      if (m.image) {
        md += `*(Terlampir 1 berkas gambar visual)*\n\n`;
      }
      md += `---\n\n`;
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riwayat_chat_matrix_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getRecentHistory(maxTurns = 8) {
    if (!this.messages || this.messages.length <= 1) return [];
    return this.messages.slice(1, -1).slice(-maxTurns).map(m => ({
      role: m.sender === "user" ? "user" : "model",
      text: m.text || ""
    })).filter(t => t.text.trim().length > 0);
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
    this.clearBtn = document.getElementById("btn-clear-ai-chat");
    this.exportBtn = document.getElementById("btn-export-ai-chat");

    // History Panel Elements
    this.historyToggleBtn = document.getElementById("btn-toggle-ai-history");
    this.newChatTopBtn = document.getElementById("btn-new-chat-top");
    this.historyPanel = document.getElementById("ai-history-panel");
    this.closeHistoryBtn = document.getElementById("btn-close-ai-history");
    this.newChatFromHistoryBtn = document.getElementById("btn-new-chat-from-history");
    this.clearAllSessionsBtn = document.getElementById("btn-clear-all-sessions");
    this.sessionsListEl = document.getElementById("ai-sessions-list");
    this.sessionsCountEl = document.getElementById("ai-sessions-count");

    if (this.historyToggleBtn) {
      this.historyToggleBtn.addEventListener("click", () => this.toggleHistoryPanel());
    }
    if (this.newChatTopBtn) {
      this.newChatTopBtn.addEventListener("click", () => this.createNewSession());
    }
    if (this.closeHistoryBtn) {
      this.closeHistoryBtn.addEventListener("click", () => this.closeHistoryPanel());
    }
    if (this.newChatFromHistoryBtn) {
      this.newChatFromHistoryBtn.addEventListener("click", () => this.createNewSession());
    }
    if (this.clearAllSessionsBtn) {
      this.clearAllSessionsBtn.addEventListener("click", () => this.clearAllSessions());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () => {
        if (confirm("Apakah kamu ingin membersihkan percakapan sesi ini?")) {
          this.clearHistory();
        }
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener("click", () => {
        this.exportHistoryAsMarkdown();
      });
    }

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
    this.imageBtn = document.getElementById("btn-ai-image");
    this.imageFileInput = document.getElementById("ai-image-file-input");
    this.imagePreviewContainer = document.getElementById("ai-chat-image-preview-container");
    this.imagePreviewThumb = document.getElementById("ai-chat-image-preview-thumb");
    this.imageNameEl = document.getElementById("ai-chat-image-name");
    this.removeImageBtn = document.getElementById("btn-remove-ai-chat-image");

    // Depth Mode Switcher
    const depthBtns = document.querySelectorAll(".ai-depth-btn");
    depthBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const depth = btn.getAttribute("data-depth");
        this.responseDepth = depth;
        depthBtns.forEach(b => {
          b.className = "ai-depth-btn px-1.5 py-0.5 rounded transition-all text-slate-400 hover:text-white";
        });
        btn.className = "ai-depth-btn px-1.5 py-0.5 rounded transition-all bg-cyan-500 text-slate-950 font-bold";
      });
    });

    // Multimodal Image Attachment
    if (this.imageBtn && this.imageFileInput) {
      this.imageBtn.addEventListener("click", () => this.imageFileInput.click());
      this.imageFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.pendingImageAttachment = {
              name: file.name,
              dataUrl: ev.target.result,
              size: file.size
            };
            if (this.imagePreviewThumb) this.imagePreviewThumb.src = ev.target.result;
            if (this.imageNameEl) this.imageNameEl.textContent = file.name;
            if (this.imagePreviewContainer) this.imagePreviewContainer.classList.remove("hidden");
            this.imageFileInput.value = "";
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (this.removeImageBtn) {
      this.removeImageBtn.addEventListener("click", () => {
        this.pendingImageAttachment = null;
        if (this.imagePreviewContainer) this.imagePreviewContainer.classList.add("hidden");
      });
    }

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
          const rawTranscript = event.results[0][0].transcript;
          const parsed = SpeechMathParser.parseSpokenMath(rawTranscript);
          const finalPrompt = parsed.normalizedText || rawTranscript;
          if (this.chatInput) {
            this.chatInput.value = finalPrompt;
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

    if (msg.image) {
      const imgEl = document.createElement("img");
      imgEl.src = msg.image;
      imgEl.alt = "Foto Terlampir";
      imgEl.className = "max-w-full max-h-48 rounded-lg mb-2 border border-slate-700 object-contain shadow-sm";
      bubble.appendChild(imgEl);
    }

    const textEl = document.createElement("div");
    try {
      textEl.innerHTML = this.renderSafeMarkdownAndMath(msg.text);
    } catch (renderErr) {
      console.warn("Gagal merender format markdown/math secara aman:", renderErr);
      textEl.textContent = msg.text || "";
    }
    bubble.appendChild(textEl);

    if (msg.sender === "assistant") {
      const actionsContainer = document.createElement("div");
      actionsContainer.className = "mt-2 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400";

      // 1. Dengarkan Suara (TTS)
      const speakBtn = document.createElement("button");
      speakBtn.className = "flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors font-medium";
      speakBtn.innerHTML = `
        <svg class="w-3 h-3 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
        <span>Dengarkan Suara</span>
      `;
      speakBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.speakText(msg.text);
      });
      actionsContainer.appendChild(speakBtn);

      // 2. Salin Teks (Clipboard)
      const copyBtn = document.createElement("button");
      copyBtn.className = "flex items-center gap-1 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors font-medium";
      copyBtn.innerHTML = `
        <svg class="w-3 h-3 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
        <span>Salin Teks</span>
      `;
      copyBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          // Clean math brackets if any for raw clipboard copy
          const textToCopy = msg.text || "";
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
          } else {
            const ta = document.createElement("textarea");
            ta.value = textToCopy;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
          }
          copyBtn.innerHTML = `
            <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            <span class="text-emerald-400 font-semibold">Tersalin!</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
              <span>Salin Teks</span>
            `;
          }, 2000);
        } catch (err) {
          console.warn("Copy to clipboard failed:", err);
        }
      });
      actionsContainer.appendChild(copyBtn);

      bubble.appendChild(actionsContainer);
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
    const attachedImage = this.pendingImageAttachment;

    if (!text && !attachedImage) return;

    // Clear input immediately & reset image preview
    this.chatInput.value = "";
    if (this.imagePreviewContainer) this.imagePreviewContainer.classList.add("hidden");
    this.pendingImageAttachment = null;

    const userMsg = {
      sender: "user",
      text: text || (attachedImage ? "Tolong analisis foto matematika terlampir ini." : ""),
      image: attachedImage ? attachedImage.dataUrl : null,
      timestamp: new Date()
    };
    this.messages.push(userMsg);

    // Auto-update session title from first prompt if default
    if (this.activeSession) {
      this.activeSession.messages = this.messages;
      if (this.activeSession.title === "Obrolan Baru" || this.activeSession.title === "Sesi Baru" || !this.activeSession.title) {
        this.activeSession.title = this.generateSessionTitle(userMsg.text);
      }
      this.activeSession.updatedAt = Date.now();
    }

    this.saveHistory();
    this.appendMessageBubble(userMsg);
    this.showTypingIndicator();

    try {
      const responseText = await this.generateResponse(userMsg.text, attachedImage);
      this.hideTypingIndicator();

      const finalResponse = this.cleanLeadingGreeting(responseText);

      const aiMsg = {
        sender: "assistant",
        text: finalResponse,
        timestamp: new Date()
      };
      this.messages.push(aiMsg);
      if (this.activeSession) {
        this.activeSession.messages = this.messages;
        this.activeSession.updatedAt = Date.now();
      }
      this.saveHistory();
      this.appendMessageBubble(aiMsg);

      if (this.voiceEnabled) {
        this.speakText(finalResponse);
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
      this.saveHistory();
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
        prompt = "Tolong jelaskan secara mendalam tentang rumus diskriminan $D = b^2 - 4ac$ dan maknanya untuk jenis-jenis akar persamaan kuadrat serta aplikasinya pada fisika lintasan gerak.";
        break;

      case "matrix_operations":
        prompt = "Tolong berikan rangkuman lengkap rumus operasi matriks: perkalian matriks, determinan matriks ordo $2 \\times 2$ dan $3 \\times 3$, serta rumus invers matriks $A^{-1} = \\frac{1}{\\det(A)}\\text{adj}(A)$ dengan KaTeX rapi dan contohnya.";
        break;

      case "matrix_rotation_3d":
        prompt = "Tolong jelaskan secara mendalam konsep Matriks Rotasi dalam 3-Dimensi: rumus matriks rotasi sumbu $X, Y, Z$, representasi sudut Euler ($R_x, R_y, R_z$), kendala Gimbal Lock, serta pengenalan Quaternions dalam game engine 3D dan robotika.";
        break;

      case "matrix_svd":
        prompt = "Jelaskan konsep Dekomposisi Nilai Singular (Singular Value Decomposition / SVD) pada matriks, rumus $A = U \\Sigma V^T$, serta perannya yang sangat penting pada Machine Learning, kompresi gambar digital, dan sistem rekomendasi.";
        break;

      case "general_math_discussion":
        prompt = "Bisa ceritakan apa saja cabang matematika modern di luar aljabar sekolah, seperti kalkulus multivariabel, aljabar linear terapan, dan teori graf?";
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
   * Deteksi dan tangani pertanyaan lanjutan (multi-turn follow-up)
   */
  resolveFollowUp(query, rawInput) {
    const lower = (query || "").toLowerCase();
    
    // Pola pertanyaan metode alternatif
    const isMethodInquiry = 
      lower.includes("cara lain") ||
      lower.includes("metode lain") ||
      lower.includes("rumus lain") ||
      lower.includes("alternatif") ||
      lower.includes("jalan lain") ||
      lower.includes("selain cara itu") ||
      lower.includes("selain itu ada apa lagi") ||
      lower.includes("ada cara berbeda") ||
      lower.includes("cara lainnya") ||
      lower.includes("bisa pakai cara lain") ||
      lower.includes("ada opsi lain") ||
      lower.includes("cara berbeda");

    // Pola pertanyaan alasan kognitif
    const isWhyInquiry =
      lower.startsWith("kenapa") ||
      lower.startsWith("mengapa") ||
      lower.includes("kenapa begitu") ||
      lower.includes("mengapa demikian") ||
      lower.includes("alasannya apa") ||
      lower.includes("kok bisa begitu") ||
      lower.includes("dari mana asalnya");

    // Pola permintaan contoh
    const isExampleInquiry =
      lower.startsWith("contoh") ||
      lower.includes("beri contoh") ||
      lower.includes("kasih contoh") ||
      lower.includes("contoh soal") ||
      lower.includes("contohnya gimana") ||
      lower.includes("contoh penerapannya") ||
      lower.includes("berikan contoh");

    // Pola pendalaman penjelasan
    const isDetailInquiry =
      lower.includes("jelaskan lebih lanjut") ||
      lower.includes("terangkan lebih detail") ||
      lower.includes("kurang paham") ||
      lower.includes("belum paham") ||
      lower.includes("maksudnya gimana") ||
      lower.includes("lebih rinci");

    if (!isMethodInquiry && !isWhyInquiry && !isExampleInquiry && !isDetailInquiry) {
      return null;
    }

    // Cari konteks topik dari riwayat percakapan
    const context = this.detectContextFromHistory();
    if (!context || !context.topic) {
      return null;
    }

    if (isMethodInquiry) {
      return this.generateAlternativeMethods(context);
    }
    if (isWhyInquiry) {
      return this.generateWhyExplanation(context);
    }
    if (isExampleInquiry) {
      return this.generateConcreteExamples(context);
    }
    if (isDetailInquiry) {
      return this.generateDetailedExplanation(context);
    }

    return null;
  }

  /**
   * Ekstraksi topik kontekstual dari pesan-pesan sebelumnya
   */
  detectContextFromHistory() {
    if (!this.messages || this.messages.length < 2) {
      if (this.context.activeQuestion) {
        return {
          topic: this.context.activeQuestion.title || this.context.activeQuestion.topic || "Persamaan Kuadrat",
          category: "quadratic_factoring",
          text: this.context.activeQuestion.promptText || ""
        };
      }
      return null;
    }

    // Ambil pesan-pesan sebelum giliran pesan pengguna saat ini
    const msgs = [...this.messages];
    // Pesan terakhir di array biasanya adalah pertanyaan user yang baru masuk
    const lastAssistantMsg = [...msgs].reverse().find(m => m.sender === "assistant");
    const prevUserMsg = [...msgs].reverse().find((m, idx) => m.sender === "user" && idx > 0);

    const combinedText = ((lastAssistantMsg?.text || "") + " " + (prevUserMsg?.text || "")).toLowerCase();

    // 1. Luas Persegi Panjang
    if (
      combinedText.includes("persegi panjang") || 
      (combinedText.includes("panjang") && combinedText.includes("lebar") && combinedText.includes("luas"))
    ) {
      return { topic: "Luas Persegi Panjang", category: "rectangle_area", text: combinedText };
    }

    // 2. Diskriminan Kuadrat
    if (
      combinedText.includes("diskriminan") || 
      combinedText.includes("akar kembar") || 
      combinedText.includes("b^2 - 4ac") || 
      combinedText.includes("b² - 4ac") ||
      combinedText.includes("jenis akar")
    ) {
      return { topic: "Diskriminan Persamaan Kuadrat", category: "discriminant", text: combinedText };
    }

    // 3. Persamaan Kuadrat & Pemfaktoran
    if (
      combinedText.includes("faktork") || 
      combinedText.includes("persamaan kuadrat") || 
      combinedText.includes("rumus abc") ||
      combinedText.includes("akar-akar")
    ) {
      return { topic: "Persamaan Kuadrat & Pemfaktoran", category: "quadratic_factoring", text: combinedText };
    }

    // 4. Bunga Majemuk & Keuangan
    if (
      combinedText.includes("bunga majemuk") || 
      combinedText.includes("bunga tunggal") || 
      combinedText.includes("investasi")
    ) {
      return { topic: "Bunga Majemuk", category: "compound_interest", text: combinedText };
    }

    // 5. Teorema Pythagoras
    if (
      combinedText.includes("pythagoras") || 
      combinedText.includes("pitagoras") || 
      combinedText.includes("segitiga siku-siku")
    ) {
      return { topic: "Teorema Pythagoras", category: "pythagoras", text: combinedText };
    }

    // 6. Sistem Persamaan Linear (SPLDV)
    if (
      combinedText.includes("spldv") || 
      combinedText.includes("persamaan linear") || 
      combinedText.includes("eliminasi") ||
      combinedText.includes("substitusi")
    ) {
      return { topic: "Sistem Persamaan Linear (SPLDV)", category: "spldv", text: combinedText };
    }

    // 7. Trigonometri
    if (
      combinedText.includes("trigonometri") || 
      combinedText.includes("sin") || 
      combinedText.includes("cos") || 
      combinedText.includes("tan")
    ) {
      return { topic: "Trigonometri", category: "trigonometry", text: combinedText };
    }

    // 8. Kalkulus (Turunan & Integral)
    if (
      combinedText.includes("kalkulus") || 
      combinedText.includes("turunan") || 
      combinedText.includes("integral")
    ) {
      return { topic: "Kalkulus", category: "calculus", text: combinedText };
    }

    // Fallback: Ekstraksi baris judul dari pesan asisten terakhir
    const lines = (lastAssistantMsg?.text || "").split("\n");
    for (const line of lines) {
      const cleanLine = line.replace(/^[#*>\s\-–—:]+/g, "").trim();
      if (cleanLine.length > 3 && cleanLine.length < 50) {
        return { topic: cleanLine, category: "general_math", text: combinedText };
      }
    }

    return null;
  }

  /**
   * Menghasilkan berbagai metode dan cara alternatif
   */
  generateAlternativeMethods(context) {
    if (context.category === "rectangle_area") {
      return `### 📐 Beragam Cara Lain Menghitung & Memahami Luas Persegi Panjang

Selain rumus standar dasar **$L = p \\times l$**, terdapat beberapa cara dan perspektif matematis lain untuk mencari luas persegi panjang tergantung komponen data yang diketahui:

---

#### 1. Metode Panjang Diagonal ($d$) dan Salah Satu Sisi ($p$ atau $l$)
Jika kamu mengetahui panjang salah satu sisi ($p$) dan panjang garis diagonal ($d$):
Berdasarkan **Teorema Pythagoras**, hubungan sisi dan diagonal adalah $d^2 = p^2 + l^2 \\implies l = \\sqrt{d^2 - p^2}$.
Maka rumus luasnya menjadi:
$$L = p \\times \\sqrt{d^2 - p^2}$$
*Contoh:* Jika diagonal $d = 10\\text{ cm}$ dan panjang $p = 8\\text{ cm}$:
$$l = \\sqrt{10^2 - 8^2} = \\sqrt{100 - 64} = \\sqrt{36} = 6\\text{ cm}$$
$$L = 8 \\times 6 = 48\\text{ cm}^2$$

---

#### 2. Metode Menggunakan Keliling ($K$) dan Panjang Sisi ($p$)
Jika yang diketahui adalah keliling ($K$) dan panjang ($p$), tanpa tahu lebarnya secara langsung:
Keliling persegi panjang adalah $K = 2(p + l) \\implies l = \\frac{K}{2} - p$.
Maka rumus luasnya:
$$L = p \\left(\\frac{K}{2} - p\\right)$$
*Contoh:* Jika keliling $K = 26\\text{ cm}$ dan panjang $p = 8\\text{ cm}$:
$$L = 8 \\times \\left(\\frac{26}{2} - 8\\right) = 8 \\times (13 - 8) = 8 \\times 5 = 40\\text{ cm}^2$$

---

#### 3. Metode Cacah Petak Satuan (Tesselation / Grid Method)
Metode visual dasar yang sangat kuat untuk intuisi geometri:
Membagi bidang persegi panjang menjadi petak-petak satuan $1 \\times 1$.
Jumlah total petak dihitung dengan menjumlahkan baris sebanyak kolom:
$$L = \\underbrace{l + l + \\dots + l}_{p\\text{ kali}} = p \\times l$$

---

#### 4. Metode Dekomposisi 2 Segitiga Siku-Siku Kongruen
Garis diagonal membelah persegi panjang menjadi dua segitiga siku-siku yang sama persis (kongruen), masing-masing dengan alas $p$ dan tinggi $l$:
$$L_{\\text{segitiga}} = \\frac{1}{2} \\times p \\times l$$
$$L_{\\text{total}} = 2 \\times L_{\\text{segitiga}} = 2 \\times \\left(\\frac{1}{2} p \\times l\\right) = p \\times l$$

---

#### 5. Pendekatan Kalkulus (Integral Tentu)
Dalam kalkulus, luas daerah persegi panjang dari $x = 0$ sampai $x = p$ di bawah fungsi konstan $f(x) = l$ adalah:
$$L = \\int_{0}^{p} l \\, dx = \\left[ l \\cdot x \\right]_{0}^{p} = l(p) - l(0) = p \\times l$$

---

#### 6. Pendekatan Aljabar Vektor (Cross Product)
Jika dua sisi persegi panjang dinyatakan sebagai vektor 2D $\\vec{u} = (p, 0)$ dan $\\vec{v} = (0, l)$ pada bidang Cartesius, luasnya adalah magnitudo perkalian silang (*cross product*):
$$L = \\|\\vec{u} \\times \\vec{v}\\| = |p \\cdot l - 0 \\cdot 0| = p \\times l$$

Apakah salah satu metode di atas berkaitan dengan soal atau variasi kasus yang sedang kamu pelajari?`;
    }

    if (context.category === "discriminant" || context.category === "quadratic_factoring") {
      return `### 🧩 5 Cara & Metode Berbeda Menyelesaikan Persamaan Kuadrat $ax^2 + bx + c = 0$

Selain melalui analisis diskriminan $D = b^2 - 4ac$, ada 5 metode standar yang dapat digunakan untuk menentukan akar-akar dan karakteristik persamaan kuadrat:

---

#### 1. Metode Pemfaktoran Aljabar $(x - p)(x - q) = 0$
- **Kapan Digunakan**: Paling efisien jika nilai diskriminan $D$ merupakan bilangan kuadrat sempurna ($0, 1, 4, 9, 16, 25, 36, 49, \\dots$).
- **Prinsip**: Cari dua angka yang jika dikalikan $= a \\cdot c$ dan jika dijumlahkan $= b$.
- *Contoh:* $x^2 - 5x + 6 = 0 \\implies (x - 2)(x - 3) = 0 \\implies x_1 = 2, x_2 = 3$.

---

#### 2. Metode Melengkapkan Kuadrat Sempurna
- **Prinsip**: Mengubah bentuk $ax^2 + bx + c = 0$ menjadi bentuk kuadrat murni $(x + p)^2 = q$.
- **Langkah**: Pindahkan konstanta ke kanan, bagi dengan $a$, lalu tambahkan kedua ruas dengan $\\left(\\frac{b}{2a}\\right)^2$:
  $$\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2} = \\frac{D}{4a^2}$$
  *(Perhatikan bahwa rumus ini adalah asal mula lahirnya rumus diskriminan $D$!)*

---

#### 3. Metode Rumus ABC (Rumus Kuadratik)
- **Kapan Digunakan**: Metode pamungkas yang selalu berhasil untuk angka berapa pun (termasuk pecahan atau akar irasional).
- **Rumus**:
  $$x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} = \\frac{-b \\pm \\sqrt{D}}{2a}$$

---

#### 4. Metode Grafik Fungsi Parabola
- **Prinsip**: Gambarkan grafik $y = ax^2 + bx + c$ pada koordinat Cartesius.
- Akar-akar persamaan adalah titik potong kurva parabola dengan sumbu-$X$ ($y = 0$).
- Jika parabola memotong di 2 titik $\\implies D > 0$.
- Jika puncak parabola menyinggung sumbu-$X$ di 1 titik $\\implies D = 0$.
- Jika parabola melayang tidak menyentuh sumbu-$X$ $\\implies D < 0$.

---

#### 5. Metode Teorema Vieta (Relasi Akar & Koefisien)
Jika yang dicari adalah operasi antar-akar (seperti $x_1 + x_2$ atau $x_1 \\cdot x_2$), kita tidak perlu mencari masing-masing akar:
$$x_1 + x_2 = -\\frac{b}{a}$$
$$x_1 \\cdot x_2 = \\frac{c}{a}$$
$$x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2$$

Mau mencoba menerapkan salah satu metode ini pada soal kuadrat yang sedang kamu kerjakan?`;
    }

    if (context.category === "compound_interest") {
      return `### 💰 Beragam Metode Menghitung Pertumbuhan Nilai Bunga Majemuk

Tergantung pada periode pemajemukan dan kebutuhan analisis keuangan, terdapat beberapa cara menghitung bunga majemuk:

1. **Metode Diskrit Standar (Periode Tahunan / Bulanan)**:
   $$M_n = M_0 \\left(1 + \\frac{i}{m}\\right)^{m \\cdot n}$$
   Di mana $m$ adalah frekuensi pemajemukan dalam setahun (misal $m = 12$ untuk bulanan).

2. **Metode Pemajemukan Kontinu (Kalkulus & Eksponensial)**:
   Jika bunga dimajemukkan secara kontinu tanpa henti setiap detik ($m \\to \\infty$), rumusnya menggunakan bilangan Euler $e \\approx 2{,}718$:
   $$M(t) = M_0 \\cdot e^{r \\cdot t}$$

3. **Aturan 72 (Rule of 72 - Estimasi Kilat)**:
   Untuk mengetahui berapa tahun uangmu akan berlipat ganda menjadi $2\\times$ lipat:
   $$T_{\\text{lipat ganda}} \\approx \\frac{72}{\\text{Suku Bunga (\\%)}}$$
   *Contoh:* Jika bunga majemuk $6\\%$ per tahun, modalmu akan berlipat ganda dalam $\\frac{72}{6} = 12\\text{ tahun}$.

4. **Tabel Amortisasi / Iterasi Periode per Periode**:
   Menghitung bunga di setiap akhir periode dan menjumlahkannya ke pokok untuk menjadi dasar perhitungan periode berikutnya.`;
    }

    if (context.category === "pythagoras") {
      return `### 📐 Beragam Cara Membuktikan & Menghitung Teorema Pythagoras ($a^2 + b^2 = c^2$)

Teorema Pythagoras adalah salah satu teorema dengan pembuktian terbanyak dalam sejarah matematika (lebih dari 370 pembuktian!). Berikut cara-cara terbaiknya:

1. **Pembuktian Visual Geometris Persegi Bhaskara**:
   Menyusun 4 segitiga siku-siku berukuran $(a, b, c)$ di dalam sebuah persegi besar bersisi $(a + b)$. Luas persegi besar sama dengan luas 4 segitiga ditambah luas persegi dalam bersisi $c$:
   $$(a + b)^2 = 4 \\left(\\frac{1}{2} ab\\right) + c^2 \\implies a^2 + 2ab + b^2 = 2ab + c^2 \\implies a^2 + b^2 = c^2$$

2. **Pembuktian Kesebangunan Segitiga Siku-Siku (Einstein)**:
   Menarik garis tinggi dari sudut siku-siku ke sisi miring membagi segitiga asal menjadi dua segitiga kecil yang sebangun dengan segitiga awal.

3. **Pendekatan Trigonometri**:
   Berdasarkan definisi perbandingan trigonometri: $\\sin(\\theta) = \\frac{a}{c}$ dan $\\cos(\\theta) = \\frac{b}{c}$.
   Menggunakan identitas dasar Pythagoras:
   $$\\sin^2(\\theta) + \\cos^2(\\theta) = 1 \\implies \\left(\\frac{a}{c}\\right)^2 + \\left(\\frac{b}{c}\\right)^2 = 1 \\implies \\frac{a^2 + b^2}{c^2} = 1 \\implies a^2 + b^2 = c^2$$

4. **Rumus Jarak Euclidean dalam Bidang Cartesius**:
   Menghitung jarak antara dua koordinat $(x_1, y_1)$ dan $(x_2, y_2)$ sebagai sisi miring:
   $$d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$`;
    }

    // Default alternative response for general topics
    return `### 💡 Alternatif Pendekatan untuk: **"${context.topic}"**

Dalam matematika dan pemecahan masalah ilmiah, selalu ada lebih dari satu sudut pandang untuk mendekati suatu persoalan:

1. **Pendekatan Aljabar & Analitis**: Menggunakan manipulasi simbolik, substitusi persamaan, atau formulasi baku.
2. **Pendekatan Geometris & Visual**: Menggambarkan model dalam bentuk grafik, diagram bidang, atau koordinat ruang.
3. **Pendekatan Numerik & Algoritmik**: Menguji dengan nilai-nilai sampel, iterasi teratur, atau aproksimasi komputasi.
4. **Pendekatan Sederhana (*Heuristik*)**: Menyederhanakan angka menjadi bilangan bulat kecil terlebih dahulu untuk menangkap polanya.

Apakah kamu ingin kita bedah topik **"${context.topic}"** menggunakan pendekatan visual, aljabar, atau ada soal konkret yang mau dipecahkan bersama?`;
  }

  /**
   * Menghasilkan penjelasan mengapa konsep tersebut berlaku (Why Explanation)
   */
  generateWhyExplanation(context) {
    if (context.category === "rectangle_area") {
      return `### 💡 Mengapa Rumus Luas Persegi Panjang adalah $L = p \\times l$?

Pertanyaan kritis yang sangat bagus! Mengapa kita mengalikan panjang dan lebar?

---

#### 1. Hakikat Dasar Konsep "Luas"
Dalam geometri, **luas** didefinisikan sebagai **jumlah bidang bujur sangkar berukuran $1 \\times 1$ satuan (satuan luas)** yang tepat menutupi seluruh permukaan bangun datar tersebut tanpa celah dan tanpa tumpang-tindih.

#### 2. Logika Pengelompokan Baris dan Kolom
Bayangkan kamu menyusun lantai keramik berbentuk persegi panjang:
- Di sepanjang alas, terdapat baris keramik sebanyak **$p$ kotak**.
- Di sepanjang tinggi, terdapat susunan baris sebanyak **$l$ tingkat**.

Karena setiap tingkat memiliki tepat $p$ kotak, maka total kotak yang menutupi seluruh lantai adalah:
$$p + p + p + \\dots + p \\quad (\\text{sebanyak } l \\text{ kali})$$
Secara definisi aritmatika dasar, penjumlahan berulang ini adalah **perkalian**:
$$L = p \\times l$$

Itulah sebabnya perkalian panjang dan lebar adalah ukuran alami dari ruang dua dimensi!`;
    }

    if (context.category === "discriminant") {
      return `### 💡 Mengapa Rumus Diskriminan $D = b^2 - 4ac$ Menentukan Jenis Akar?

Diskriminan dinamakan dari kata bahasa Latin *"discriminare"* yang berarti **membedakan**. Mengapa rumusnya $b^2 - 4ac$?

---

#### 1. Berasal dari Dalam Tanda Akar Rumus ABC
Perhatikan kembali rumus kuadratik (Rumus ABC):
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
Perhatikan bagian di dalam tanda akar: **$\\sqrt{b^2 - 4ac}$**.
Nilai di bawah akar inilah yang kita beri simbol **$D = b^2 - 4ac$**.

#### 2. Konsekuensi Hukum Bilangan Real:
1. **Jika $D > 0$ (Positif)**:
   Akar $\\sqrt{D}$ menghasilkan bilangan real nyata positif, sehingga $\\pm \\sqrt{D}$ menghasilkan dua nilai berbeda (satu ditambah, satu dikurang). Akibatnya ada **2 akar real berbeda**.
2. **Jika $D = 0$ (Nol)**:
   Maka $\\sqrt{0} = 0$. Operasi $\\pm 0$ tidak mengubah nilai: $x = \\frac{-b \\pm 0}{2a} = -\\frac{b}{2a}$. Akibatnya hanya ada **1 akar tunggal (akar kembar)**.
3. **Jika $D < 0$ (Negatif)**:
   Dalam himpunan bilangan real, kita **tidak dapat menarik akar dari bilangan negatif** (misal $\\sqrt{-9}$ tidak ada di bilangan real). Oleh karena itu, persamaan **tidak memiliki akar real** (akarnya imajiner).

Itulah mengapa hanya dengan melihat nilai $b^2 - 4ac$, kita langsung tahu sifat akarnya tanpa perlu repot menghitung nilai $x$!`;
    }

    return `### 💡 Menelusuri Logika Fundamental: **"${context.topic}"**

Konsep ini bekerja berdasarkan prinsip keteraturan dan sebab-akibat matematis:
1. Setiap formula yang kita gunakan lahir dari proses deduktif—bermula dari aksioma dasar yang dibuktikan secara logis langkah demi langkah.
2. Aturan ini memastikan bahwa relasi antar variabel selalu konsisten di mana pun dan kapan pun diterapkan.

Ada bagian dari langkah penurunan logisnya yang ingin kamu bedah lebih dalam?`;
  }

  /**
   * Menghasilkan contoh konkret
   */
  generateConcreteExamples(context) {
    if (context.category === "rectangle_area") {
      return `### 📝 Contoh Soal & Penerapan Nyata: Luas Persegi Panjang

Mari kita telaah dua variasi contoh soal berikut:

---

#### Contoh 1: Kasus Standar (Panjang & Lebar)
Sebuah lapangan futsal memiliki panjang $25\\text{ m}$ dan lebar $15\\text{ m}$. Berapa luas lapangan tersebut?
- **Diketahui**: $p = 25\\text{ m}$, $l = 15\\text{ m}$
- **Rumus**: $L = p \\times l$
- **Penyelesaian**:
  $$L = 25 \\times 15 = 375\\text{ m}^2$$
- Jadi, luas lapangan futsal adalah **$375\\text{ m}^2$**.

---

#### Contoh 2: Kasus Balikan (Mencari Sisi dari Luas & Keliling)
Sebuah taman persegi panjang memiliki luas $60\\text{ m}^2$ dan panjang $12\\text{ m}$. Berapa lebar dan keliling taman tersebut?
1. **Mencari Lebar ($l$)**:
   $$l = \\frac{L}{p} = \\frac{60}{12} = 5\\text{ m}$$
2. **Mencari Keliling ($K$)**:
   $$K = 2(p + l) = 2(12 + 5) = 2(17) = 34\\text{ m}$$

Mau mencoba menyelesaikan satu soal latihan dengan angka lain?`;
    }

    if (context.category === "discriminant") {
      return `### 📝 Contoh Soal Menghitung & Menginterpretasikan Nilai Diskriminan

Mari kita selesaikan dua contoh soal yang sering muncul di ujian:

---

#### Contoh 1: Menentukan Jenis Akar
Tentukan nilai diskriminan dan sifat akar dari persamaan $x^2 - 6x + 9 = 0$!
- **Koefisien**: $a = 1, b = -6, c = 9$
- **Perhitungan**:
  $$D = b^2 - 4ac = (-6)^2 - 4(1)(9) = 36 - 36 = 0$$
- **Kesimpulan**: Karena $D = 0$, persamaan ini memiliki **1 akar kembar / real sama** ($x = 3$).

---

#### Contoh 2: Menemukan Batasan Nilai Parameter
Tentukan nilai $k$ agar persamaan $x^2 + kx + 16 = 0$ memiliki akar kembar!
- **Syarat Akar Kembar**: $D = 0$
  $$b^2 - 4ac = 0 \\implies k^2 - 4(1)(16) = 0 \\implies k^2 - 64 = 0$$
  $$k^2 = 64 \\implies k = \\pm 8$$
- Jadi, nilai $k$ yang memenuhi adalah **$k = 8$** atau **$k = -8$**.`;
    }

    return `### 📝 Contoh Penerapan: **"${context.topic}"**

Mari kita lihat bagaimana konsep ini diterapkan dalam skenario nyata:
- Menghitung parameter input yang diketahui.
- Menggunakan formula atau aturan keteraturan untuk menentukan hasil akhir.
- Memeriksa konsistensi satuan dan nilai hasil.

Ketikkan angka atau soal spesifik jika kamu ingin kita kerjakan bersama!`;
  }

  /**
   * Menghasilkan penjelasan lebih mendalam
   */
  generateDetailedExplanation(context) {
    if (context.category === "rectangle_area") {
      return this.generateAlternativeMethods(context);
    }
    return `### 🔍 Penjelasan Lebih Mendalam: **"${context.topic}"**

Mari kita telaah konsep ini secara lebih terstruktur dan komprehensif:

1. **Definisi & Batasan Masalah**:
   Konsep ini digunakan untuk mendeskripsikan hubungan fungsional antara komponen-komponen penyusunnya.
2. **Kaitan dengan Konsep Lain**:
   Konsep ini menjadi jembatan menuju topik yang lebih lanjut, seperti aljabar, geometri analitik, maupun pemodelan matematika nyata.
3. **Tips Menghindari Kesalahan Umum**:
   - Selalu perhatikan tanda positif/negatif pada perhitungan aljabar.
   - Pastikan satuan dimensi yang digunakan seragam (misal meter dengan meter).
   - Lakukan uji akal sehat (*sanity check*) terhadap hasil akhir.

Ada bagian tertentu yang ingin kamu tanyakan lebih spesifik?`;
  }

  async generateResponse(userPrompt, attachedImage = null) {
    const rawInput = userPrompt || "";
    // Normalisasi ejaan dan typo umum matematika siswa Indonesia (e.g. deskriminan -> diskriminan)
    const normalizedInput = WebSearchService.normalizeQuery(rawInput);
    const cleanQuery = normalizedInput.trim();

    // 0a. Conversational Context & Multi-turn Follow-up Resolution
    // Menjawab pertanyaan lanjutan seperti "apa ada cara lain?", "kenapa begitu?", "beri contoh", dll.
    const followUpResult = this.resolveFollowUp(cleanQuery, rawInput);
    if (followUpResult) {
      return followUpResult;
    }

    // 0b. Cek Serverless Proxy (/api/gemini) terlebih dahulu (Online Terpusat)
    try {
      const serverlessResult = await this.callServerlessProxy(cleanQuery, attachedImage);
      if (serverlessResult) return serverlessResult;
    } catch (e) {
      // Lanjut ke pipeline klien
    }

    // Multimodal Image Analysis Flow (Phase 6)
    if (attachedImage) {
      try {
        // If Cloud LLM is available, invoke multimodal Gemini Vision
        if (this.apiKey && this.apiKey.trim() && this.apiProvider === "gemini") {
          return await this.callCloudLLMMultimodal(cleanQuery, attachedImage);
        }

        // Offline / Manifest Vision Extraction
        const manifest = await VisionProvider.analyzeImage(attachedImage.dataUrl);
        if (manifest && manifest.hasContent()) {
          const norm = manifest.toNormalizedText();
          const firstQ = manifest.questions?.[0];
          const detectedLatex = norm.latex || firstQ?.mathematicalObjects?.[0] || "";

          let analysis = `### 📷 Analisis Konten Gambar oleh Matrix AI 🔍✨\n\n`;
          analysis += `Saya berhasil memindai visual gambar matematika yang kamu lampirkan:\n\n`;

          if (detectedLatex) {
            analysis += `- **Notasi / Persamaan Terdeteksi**: $${detectedLatex}$\n`;
          }
          if (firstQ?.questionText) {
            analysis += `- **Teks Soal**: "${firstQ.questionText}"\n`;
          }
          if (firstQ?.studentResponse?.selectedOption) {
            analysis += `- **Pilihan / Jawaban Terdeteksi**: Opsi **${firstQ.studentResponse.selectedOption}**\n`;
          }

          if (detectedLatex) {
            const solved = MathSolver.solve(detectedLatex);
            if (solved) {
              analysis += `\n---\n#### 📐 Penyelesaian Komputasi Deterministik:\n${solved}\n`;
            }
          }

          if (this.responseDepth === "quick") {
            analysis += `\n**Ringkasan Cepat**: Tinjau persamaan utama di atas dan pastikan tanda aljabar tidak tertukar.`;
          } else if (this.responseDepth === "detailed") {
            analysis += `\n**Bimbingan Sokratik Rinci**: \n1. Tentukan apa yang diketahui dan ditanyakan pada visual.\n2. Perhatikan apakah ini melibatkan pemfaktoran, perpindahan ruas, atau rumus kuadratik.\n3. Coba tuliskan langkah pertamamu, dan tanyakan bagian mana yang masih membingungkan!`;
          }

          return analysis;
        }
      } catch (err) {
        console.warn("Multimodal image analysis error:", err);
      }
    }

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

    // 3. Live Cloud LLM if user provided key (Gemini with Google Search Grounding or OpenAI)
    if (this.apiKey && this.apiKey.trim()) {
      try {
        return await this.callCloudLLM(cleanQuery);
      } catch (err) {
        console.warn("Gagal memanggil API Cloud LLM, beralih ke pencarian internet langsung:", err);
      }
    }

    // 4. Live Internet Knowledge Search (Wikipedia & DuckDuckGo Real-Time Web API)
    try {
      const webResult = await WebSearchService.searchInternet(cleanQuery);
      if (webResult && webResult.hasResults) {
        const searchPrompt = `${cleanQuery}\n\nKonteks Web Terbaru:\n${webResult.fullContext}`;
        try {
          const liveAiResult = await this.callFreeWebAI(searchPrompt);
          if (liveAiResult && liveAiResult.trim()) {
            return `${liveAiResult}\n\n---\n🌐 *Sumber Referensi Web: [${webResult.title}](${webResult.sourceUrl})*`;
          }
        } catch (e) {}

        return `### 🌐 Informasi Terkini dari Web: **${webResult.title}**\n\n${webResult.summary}\n\n---\n🔗 *Baca selengkapnya di: [${webResult.title}](${webResult.sourceUrl})*`;
      }
    } catch (err) {
      console.warn("Web search lookup notice:", err);
    }

    // 5. Curated Scientific & Encyclopedic Knowledge Base (Avogadro, Menkeu, Rumus, Fisika, dll.)
    const kbResult = this.searchKnowledgeBase(cleanQuery);
    if (kbResult) return kbResult;

    // 6. Live Free Web AI Engine (Pollinations text AI with 3.8s timeout)
    try {
      const liveAiResult = await this.callFreeWebAI(cleanQuery);
      if (liveAiResult && liveAiResult.trim()) {
        return liveAiResult;
      }
    } catch (e) {
      // Fallback seamlessly to offline smart synthesizer
    }

    // 7. Intelligent NLP Educational Reasoner (Tailored response, ZERO repetitive template)
    return this.synthesizeSmartResponse(cleanQuery);
  }

  async callServerlessProxy(prompt, attachedImage = null) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const activeQ = this.context.activeQuestion;
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image: attachedImage?.dataUrl || null,
          history: this.getRecentHistory(8),
          depthMode: this.responseDepth || "standard",
          studentName: this.context.studentName || "Siswa",
          activeQuestion: activeQ ? {
            id: activeQ.id,
            title: activeQ.title,
            promptText: activeQ.promptText || activeQ.topic || activeQ.title,
            options: activeQ.options || null
          } : null,
          studentAnswer: this.context.studentAnswer || null,
          studentSteps: this.context.studentSteps || null,
          apiKey: this.apiKey || localStorage.getItem("epe_ai_api_key") || ""
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.text) {
          let output = data.text;
          if (data.grounding?.webSearchQueries) {
            output += `\n\n---\n🔍 *Pencarian Google: ${data.grounding.webSearchQueries.join(", ")}*`;
          }
          return output;
        }
      }
    } catch (e) {
      // Serverless proxy not active in local static file mode, continue silently
    }
    return null;
  }

  async callCloudLLMMultimodal(prompt, attachedImage) {
    const depthInstructions = {
      quick: "Berikan jawaban sangat ringkas, to-the-point, fokus pada nilai akhir dan rumus kunci.",
      detailed: "Gunakan pendekatan Sokratik mendalam: jelaskan pemahaman konsep, bedah setiap langkah pengerjaan secara komprehensif, dan ajukan pertanyaan pemancing refleksi.",
      standard: "Jelaskan konsep dan langkah penyelesaian secara ramah, seimbang, dan jelas."
    };

    const contextPrompt = `Kamu adalah Matrix, AI Multimodal Cerdas di platform Error Pattern Engine (EPE).
Tugasmu: Menganalisis gambar yang dilampirkan oleh pengguna secara cerdas, akurat, dan mendalam. Gambar bisa berupa screenshot video game (seperti Hogwarts Legacy, Minecraft, dll.), foto alam/makhluk/hewan, objek kehidupan nyata, maupun soal dan grafik matematika.
Instruksi: Jawab pertanyaan pengguna dengan fokus penuh pada isi visual gambar yang dilampirkan. Jika gambar adalah screenshot video game atau objek umum, kenali elemennya (misalnya nama game, karakter, hewan/makhluk, lokasi) secara spesifik, menarik, dan ramah. JANGAN mengasumsikan pertanyaan merujuk ke soal latihan matematika aktif jika gambar bukan soal matematika!
Instruksi Gaya: ${depthInstructions[this.responseDepth] || depthInstructions.standard}
Gunakan format LaTeX KaTeX (misal $x^2 - 5x + 6 = 0$) hanya jika memuat rumus matematika. Bahasa Indonesia edukatif, cerdas, dan bersahabat.`;

    const match = attachedImage.dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) throw new Error("Format gambar base64 tidak valid.");

    const mimeType = match[1];
    const base64Data = match[2];

    const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError = null;

    const contents = [];
    const pastTurns = this.getRecentHistory(6);
    if (pastTurns.length > 0) {
      let first = true;
      let lastRole = "";
      for (const turn of pastTurns) {
        if (turn.role === lastRole) continue;
        let text = turn.text;
        if (!text || !text.trim()) continue;
        if (first) {
          text = `${contextPrompt}\n\n[Pesan Siswa Sebelumnya]:\n${text}`;
          first = false;
        }
        contents.push({
          role: turn.role,
          parts: [{ text }]
        });
        lastRole = turn.role;
      }
    }

    const curParts = [
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      {
        text: contents.length === 0
          ? `${contextPrompt}\n\nPertanyaan / Permintaan Siswa Terhadap Gambar: ${prompt || "Analisis dan jelaskan apa yang terlihat pada gambar ini."}`
          : `Pertanyaan / Permintaan Siswa Terhadap Gambar: ${prompt || "Analisis dan jelaskan apa yang terlihat pada gambar ini."}`
      }
    ];

    contents.push({
      role: "user",
      parts: curParts
    });

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey.trim()}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
          })
        });

        const data = await res.json();
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
        if (data.error) lastError = data.error.message;
      } catch (e) {
        lastError = e.message;
      }
    }
    throw new Error(lastError || "Gagal memproses multimodal Gemini.");
  }

  async callCloudLLM(prompt) {
    const activeQ = this.context.activeQuestion;
    const depthInstructions = {
      quick: "Mode Kedalaman: RINGKAS. Berikan kesimpulan langsung, langkah inti, dan jawaban akhir secara padat.",
      detailed: "Mode Kedalaman: RINCI. Berikan penjelasan Sokratik langkah-demi-langkah, eksplorasi konsep dasar, dan telaah kemungkinan salah kaprah.",
      standard: "Mode Kedalaman: STANDAR. Jelaskan secara berimbang antara konsep dan aplikasi."
    };

    const contextPrompt = `Kamu adalah Matrix, AI Math Companion & Cognitive Tutor tingkat lanjut di platform Error Pattern Engine (EPE) V2.
Kamu memiliki wawasan tak terbatas tentang seluruh bidang matematika (aljabar, geometri, kalkulus, trigonometri, statistika, logika) dan sains umum layaknya ChatGPT.
Gunakan bahasa Indonesia yang ramah, santun, cerdas, edukatif, dan menarik.
${depthInstructions[this.responseDepth] || depthInstructions.standard}
Format seluruh rumus matematika menggunakan notasi LaTeX KaTeX yang rapi (misal: $x^2 - 5x + 6 = 0$).

==================================================
PRINSIP PERILAKU AI MATRIX (CONTEXT ROUTING):
Matrix memiliki DUA KONTEKS SIMULTAN:
1. CONVERSATIONAL CONTEXT: Percakapan bebas, sains umum, astronomi, transportasi publik (MRT dll.), rumus umum, atau pertanyaan sehari-hari.
2. APPLICATION / LEARNING CONTEXT: Latihan soal aktif di aplikasi (${activeQ ? `${activeQ.id} - ${activeQ.title}` : "Tidak ada soal aktif"}).

ATURAN CONTEXT ROUTING (CONTEXT AWARENESS != CONTEXT FORCING):
- Tentukan konteks yang relevan dengan pesan terbaru siswa:
- JANGAN OTOMATIS MEMAKSAKAN atau MENGHUBUNGKAN soal aktif matematika ke setiap respon!
  Contoh Nyata:
  * Siswa: "sekarang kita hidup di planet apa?" -> Jawab pertanyaan astronomi tentang Bumi dengan jelas dan ramah. JANGAN menambahkan ajakan "Sekarang mari kembali ke Soal Q1...".
  * Siswa: "jelasin black hole dong" atau "MRT rutenya darimana ke mana" -> Jawab topik tersebut secara tuntas dan informatif tanpa memaksa kembali ke soal matematika.
  * Siswa: "rumus avogadro" atau "rumus luas lingkaran dan keliling lingkaran" -> Jelaskan rumus tersebut secara lengkap dan edukatif dengan notasi LaTeX KaTeX tanpa menyuruh kembali ke soal aktif.
- GUNAKAN konteks Soal Aktif HANYA JIKA siswa:
  1. Menanyakan status jawaban atau pilihannya ("kenapa jawaban saya salah?", "kenapa B?", "kenapa opsi A salah?").
  2. Meminta petunjuk atau bimbingan soal aktif ("bagaimana cara mengerjakan soal ini?", "beri petunjuk").
  3. Menyatakan eksplisit ingin kembali ke soal ("oke balik ke soal tadi", "lanjut ke soal aktif").
- Bila siswa memang membahas soal aktif matematika, gunakan gaya Socratic Tutoring: bimbing konsep dan langkahnya, ajukan pertanyaan reflektif, jangan langsung membeberkan jawaban final kecuali diminta.

ATURAN SAPAAN (PERCAKAPAN BERKELANJUTAN):
Chat ini adalah obrolan yang SEDANG BERJALAN. JANGAN mengulang sapaan pembuka (seperti "Halo!", "Halo Siswa!", "Hai!") atau memperkenalkan diri ("Saya Matrix...", "Senang sekali...") di awal setiap respon baru! Langsung jawab ke inti pertanyaan atau topik secara akrab, cerdas, dan mengalir alami layaknya percakapan chat.
==================================================
ATURAN FORMAT RUMUS & TAUTAN (HYPERLINK) INTERAKTIF:
- Format seluruh rumus matematika menggunakan notasi LaTeX KaTeX rapi ($...$ inline, $$...$$ untuk baris display).
- Kamu SANGAT DIANJURKAN menyertakan tautan referensi belajar Markdown interaktif menggunakan format [Nama Referensi/Materi](https://url-valid) (misalnya 3Blue1Brown, Khan Academy, Brilliant, MIT OpenCourseWare, atau Wikipedia).
- DILARANG KERAS membuat disclaimer seperti 'Sebagai AI saya tidak dapat menulis tautan dengan href dalam mode plaintext' atau meminta siswa menyalin-tempel URL secara manual! Antarmuka web EPE telah dilengkapi parser link interaktif penuh yang otomatis merender tautan menjadi link aktif.

PENGEMBANGAN CATATAN EDUKATIF ("Catatan dari AI"):
- Di akhir penjelasan konsep penting (seperti aljabar, matriks, transformasi geometri, kalkulus, statistika), sertakan bagian pendalaman materi '> [!NOTE] Catatan Pendalaman Konsep' yang kaya, edukatif, dan aplikatif!
- Jika materi menyangkut matriks atau aljabar linear, perluas ke topik tingkat lanjut:
  * Rotasi 3-Dimensi: Matriks rotasi Euler R_x(\\theta), R_y(\\theta), R_z(\\theta), masalah Gimbal Lock, serta pengenalan Quaternions pada game engine 3D dan robotika.
  * Dekomposisi SVD (Singular Value Decomposition): Formulasi $A = U \\Sigma V^T$ dan kegunaannya pada Machine Learning, kompresi gambar tanpa kehilangan fitur, dan Principal Component Analysis (PCA).
  * Nilai Eigen & Vektor Eigen ($Av = \\lambda v$): Aplikasinya pada algoritma Google PageRank dan kestabilan resonansi struktur.
  * Diskriminan & Optimasi Kuadratik: Makna fisik nilai $D = b^2 - 4ac$ pada trajektori gerak parabola dan titik optimum.
==================================================

Konteks Pembelajaran di Aplikasi (HANYA rujuk jika ditanya oleh siswa terkait latihan soal):
- Nama Siswa: ${this.context.studentName || "Siswa"}
- Soal Aktif: ${activeQ ? `${activeQ.id} (${activeQ.title}): ${activeQ.promptText || activeQ.topic || activeQ.title}` : "Tidak ada"}
- Pilihan Jawaban Soal: ${activeQ?.options ? JSON.stringify(activeQ.options) : "Tidak ada"}
- Jawaban Akhir Siswa: ${this.context.studentAnswer || "Belum ada"}
- Langkah Coretan Siswa: ${this.context.studentSteps || "Belum ada"}
- Hasil Diagnostik Terakhir: ${this.context.latestDiagnosis ? JSON.stringify(this.context.latestDiagnosis) : "Belum diuji"}
`;

    if (this.apiProvider === "gemini") {
      const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
      let lastError = null;

      const contents = [];
      const pastTurns = this.getRecentHistory(8);
      if (pastTurns.length > 0) {
        let first = true;
        let lastRole = "";
        for (const turn of pastTurns) {
          if (turn.role === lastRole) continue;
          let text = turn.text;
          if (!text || !text.trim()) continue;
          if (first) {
            text = `${contextPrompt}\n\n[Pesan Siswa Sebelumnya]:\n${text}`;
            first = false;
          }
          contents.push({
            role: turn.role,
            parts: [{ text }]
          });
          lastRole = turn.role;
        }
      }

      const curText = contents.length === 0
        ? `${contextPrompt}\n\nPertanyaan Pengguna: ${prompt}`
        : `Pertanyaan Pengguna: ${prompt}`;

      contents.push({
        role: "user",
        parts: [{ text: curText }]
      });

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey.trim()}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
            })
          });

          const data = await res.json();
          if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
          }
          if (data.error) lastError = data.error.message;
        } catch (e) {
          lastError = e.message;
        }
      }
      throw new Error(lastError || "Gagal memproses respons Gemini.");
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
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    let enrichedPrompt = prompt;
    if (this.messages && this.messages.length > 2) {
      const recentContext = this.messages.slice(1, -1).slice(-4)
        .map(m => `${m.sender === "user" ? "User" : "Matrix"}: ${m.text.slice(0, 180)}`)
        .join("\n");
      enrichedPrompt = `[Percakapan Sebelumnya]:\n${recentContext}\n\n[Pertanyaan Terbaru]:\n${prompt}\n\nJawab sebagai Matrix AI ramah dan cerdas dalam Bahasa Indonesia.`;
    }

    const encodedPrompt = encodeURIComponent(enrichedPrompt);
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

    // 8. Diskriminan Kuadrat ($D$) & Cara Mengerjakannya
    if (q.includes("diskriminan") || q.includes("d = b^2") || q.includes("akar kembar")) {
      if (q.includes("cara") || q.includes("bagaimana") || q.includes("mengerjakan") || q.includes("hitung") || q.includes("langkah") || q.includes("rumus")) {
        return `### 📐 Panduan Lengkap: Cara Mengerjakan & Menghitung Diskriminan ($D$)

Diskriminan adalah pembeda utama dalam persamaan kuadrat $ax^2 + bx + c = 0$ untuk mengetahui jumlah dan karakteristik akar tanpa perlu memfaktorkan atau menyelesaikan persamaannya.

**Rumus Pokok Diskriminan:**
$$D = b^2 - 4ac$$

---

#### 4 Langkah Praktis Mengerjakan Soal Diskriminan:

1. **Langkah 1: Susun Persamaan ke Bentuk Standar ($ax^2 + bx + c = 0$)**
   Pastikan seluruh suku berkumpul di ruas kiri dan ruas kanan bernilai nol.
   *Contoh:* Jika soalnya $2x^2 = 5x + 3$, pindahkan suku ke ruas kiri menjadi $2x^2 - 5x - 3 = 0$.

2. **Langkah 2: Tentukan Koefisien $a$, $b$, dan $c$ dengan Tanda yang Tepat**
   Sangat penting untuk menyertakan tanda minus $(-)$ pada setiap angka:
   - $a = 2$ (koefisien di depan $x^2$)
   - $b = -5$ (koefisien di depan $x$)
   - $c = -3$ (angka konstanta)

3. **Langkah 3: Masukkan ke Rumus $D = b^2 - 4ac$**
   ⚠️ *Tips Kritis:* Pengkuadratan bilangan negatif $(-b)^2$ selalu menghasilkan nilai **positif**!
   $$D = (-5)^2 - 4(2)(-3)$$
   $$D = 25 - (-24) = 25 + 24 = 49$$

4. **Langkah 4: Tafsirkan Karakteristik Akarnya Berdasarkan Nilai $D$**
   - **Jika $D > 0$**: Memiliki **2 akar real berbeda** (kurva parabola memotong sumbu-$X$ di dua titik). Karena $D = 49 = 7^2$ (kuadrat sempurna), kedua akarnya rasional nyata.
   - **Jika $D = 0$**: Memiliki **1 akar kembar / real sama** (puncak parabola menyinggung sumbu-$X$).
   - **Jika $D < 0$**: **Tidak memiliki akar real** (akar imajiner / bilangan kompleks, kurva parabola melayang tidak menyentuh sumbu-$X$).

---

#### Contoh Soal Kasus $D < 0$ (Akar Imajiner):
Tentukan diskriminan dari $2x^2 - 4x + 5 = 0$:
- $a = 2, b = -4, c = 5$
- $D = (-4)^2 - 4(2)(5) = 16 - 40 = -24$
- **Kesimpulan**: Karena $D = -24 < 0$, persamaan ini tidak memiliki penyelesaian di himpunan bilangan real.

Ada persamaan kuadrat tertentu yang ingin kamu hitung nilai diskriminannya sekarang? Ketikkan saja persamaannya di sini!`;
      }

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

    // 16. Bunga Majemuk (Compound Interest)
    if (q.includes("bunga majemuk") || q.includes("compound interest") || q.includes("bunga berbunga") || q.includes("bunga bertingkat")) {
      return `### 💰 Bunga Majemuk (Compound Interest)

**Bunga Majemuk** adalah sistem perhitungan bunga di mana bunga yang terkumpul pada setiap periode **ditambahkan ke pokok**, sehingga pada periode berikutnya bunga dihitung dari **pokok + bunga sebelumnya**. Inilah yang membedakannya dari bunga tunggal (*simple interest*) di mana bunga hanya dihitung dari pokok awal.

---

#### 📊 Rumus Bunga Majemuk:
$$A = P \\left(1 + \\frac{r}{n}\\right)^{n \\cdot t}$$

*Di mana:*
- $A$ = Nilai akhir setelah $t$ tahun (jumlah pokok + bunga)
- $P$ = Modal pokok awal (*Principal*)
- $r$ = Suku bunga tahunan (dalam desimal, misal 5% = 0,05)
- $n$ = Frekuensi penggandaan bunga per tahun (1 = tahunan, 4 = kuartalan, 12 = bulanan, 365 = harian)
- $t$ = Lama waktu investasi (dalam tahun)

---

#### 🔢 Contoh Perhitungan:
Modal awal $P = \\text{Rp}10.000.000$, suku bunga $r = 6\\%$ per tahun, digandakan bulanan ($n = 12$), selama $t = 5$ tahun:

$$A = 10.000.000 \\left(1 + \\frac{0{,}06}{12}\\right)^{12 \\times 5}$$
$$= 10.000.000 \\left(1 + 0{,}005\\right)^{60}$$
$$= 10.000.000 \\times 1{,}005^{60}$$
$$= 10.000.000 \\times 1{,}34885$$
$$\\approx \\text{Rp}13.488.502$$

**Bunga yang diperoleh:** $A - P = \\text{Rp}13.488.502 - \\text{Rp}10.000.000 = \\text{Rp}3.488.502$

---

#### 🆚 Perbandingan dengan Bunga Tunggal:
| | Bunga Tunggal | Bunga Majemuk |
|:---|:---|:---|
| Rumus | $A = P(1 + r \\cdot t)$ | $A = P(1 + r/n)^{nt}$ |
| Contoh (5 tahun) | Rp 13.000.000 | Rp 13.488.502 |
| Bunga dihitung dari | Pokok awal saja | Pokok + bunga sebelumnya |

---

#### 💡 Mengapa Bunga Majemuk Disebut *"Keajaiban Kedelapan Dunia"*?
Albert Einstein konon berkata: *"Bunga majemuk adalah keajaiban kedelapan dunia. Mereka yang memahaminya, akan mendapatkannya; mereka yang tidak, akan membayarnya."*

Efek **eksponensial** dari bunga berbunga membuat pertumbuhan semakin cepat seiring waktu, terutama untuk investasi jangka panjang!`;
    }

    // 17. Probabilitas & Peluang
    if (q.includes("probabilitas") || q.includes("peluang") || q.includes("probability") || q.includes("rumus peluang")) {
      return `### 🎲 Probabilitas (Peluang)

**Probabilitas** adalah ukuran kemungkinan terjadinya suatu kejadian, bernilai antara $0$ (mustahil) dan $1$ (pasti terjadi).

$$P(A) = \\frac{\\text{Jumlah kejadian yang diinginkan (}n(A)\\text{)}}{\\text{Jumlah seluruh kejadian mungkin (}n(S)\\text{)}}$$

---

#### Rumus-Rumus Kunci:
1. **Kejadian Komplemen:** $P(A') = 1 - P(A)$
2. **Gabungan Dua Kejadian:** $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$
3. **Kejadian Independen:** $P(A \\cap B) = P(A) \\times P(B)$
4. **Peluang Bersyarat:** $P(A | B) = \\frac{P(A \\cap B)}{P(B)}$
5. **Permutasi (urutan penting):** $P(n, r) = \\frac{n!}{(n-r)!}$
6. **Kombinasi (urutan tidak penting):** $C(n, r) = \\frac{n!}{r!(n-r)!}$

Ada soal probabilitas yang ingin kita selesaikan bersama?`;
    }

    // 18. Statistika Dasar
    if (q.includes("statistik") || q.includes("rata-rata") || q.includes("mean") || q.includes("median") || q.includes("modus") || q.includes("standar deviasi")) {
      return `### 📊 Statistika Dasar

Statistika mempelajari pengumpulan, penyajian, pengolahan, dan analisis data untuk menarik kesimpulan.

#### Ukuran Pemusatan Data:
1. **Rata-rata (Mean):** $\\bar{x} = \\frac{\\sum_{i=1}^{n} x_i}{n}$
2. **Median:** Nilai tengah data setelah diurutkan.
3. **Modus:** Nilai yang paling sering muncul.

#### Ukuran Penyebaran Data:
1. **Jangkauan (Range):** $R = x_{\\text{max}} - x_{\\text{min}}$
2. **Varians:** $s^2 = \\frac{\\sum (x_i - \\bar{x})^2}{n - 1}$
3. **Standar Deviasi:** $s = \\sqrt{s^2}$
4. **Kuartil:** $Q_1, Q_2, Q_3$ membagi data menjadi 4 bagian sama besar.

Apakah ada data yang ingin kamu analisis bersama Matrix?`;
    }

    // 19. Geometri Bangun Datar & Ruang
    if (q.includes("luas lingkaran") || q.includes("keliling lingkaran") || q.includes("volume bola") || q.includes("volume tabung") || q.includes("volume kerucut") || q.includes("volume kubus") || q.includes("volume balok") || q.includes("rumus geometri") || q.includes("rumus bangun")) {
      return `### 📐 Rumus Geometri Bangun Datar & Ruang

#### Bangun Datar:
| Bangun | Luas | Keliling |
|:---|:---|:---|
| Persegi | $s^2$ | $4s$ |
| Persegi Panjang | $p \\times l$ | $2(p + l)$ |
| Segitiga | $\\frac{1}{2} \\times a \\times t$ | $a + b + c$ |
| Lingkaran | $\\pi r^2$ | $2\\pi r$ |
| Trapesium | $\\frac{1}{2}(a + b) \\times t$ | Jumlah sisi |

#### Bangun Ruang:
| Bangun | Volume | Luas Permukaan |
|:---|:---|:---|
| Kubus | $s^3$ | $6s^2$ |
| Balok | $p \\times l \\times t$ | $2(pl + pt + lt)$ |
| Tabung | $\\pi r^2 t$ | $2\\pi r(r + t)$ |
| Kerucut | $\\frac{1}{3}\\pi r^2 t$ | $\\pi r(r + s)$ |
| Bola | $\\frac{4}{3}\\pi r^3$ | $4\\pi r^2$ |

Ada soal geometri yang ingin kita hitung bersama?`;
    }

    // 20. Barisan & Deret (Aritmatika & Geometri)
    if (
      q.includes("barisan") ||
      q.includes("deret") ||
      q.includes("aritmatika") ||
      q.includes("aritmetika") ||
      q.includes("geometri tak hingga") ||
      q.includes("suku ke-n") ||
      q.includes("deret geometri")
    ) {
      return `### 📈 Barisan & Deret (Aritmatika & Geometri)

Barisan adalah urutan bilangan dengan pola tertentu, sedangkan deret adalah jumlah dari suku-suku barisan tersebut.

---

#### 1. ➕ Barisan & Deret Aritmatika (Pola Selisih Tetap $b$)
- **Suku ke-$n$ ($U_n$):**
  $$U_n = a + (n - 1)b$$
  *Di mana $a = U_1$ (suku pertama) dan $b = U_n - U_{n-1}$ (beda antar suku).*

- **Jumlah $n$ Suku Pertama ($S_n$):**
  $$S_n = \\frac{n}{2} (a + U_n) = \\frac{n}{2} \\Big(2a + (n - 1)b\\Big)$$

- **Suku Tengah ($U_t$) jika $n$ ganjil:**
  $$U_t = \\frac{a + U_n}{2}$$

---

#### 2. ✖️ Barisan & Deret Geometri (Pola Rasio Tetap $r$)
- **Suku ke-$n$ ($U_n$):**
  $$U_n = a \\cdot r^{n - 1}$$
  *Di mana $r = \\frac{U_n}{U_{n-1}}$ (rasio pengali).*

- **Jumlah $n$ Suku Pertama ($S_n$):**
  $$S_n = \\frac{a(1 - r^n)}{1 - r} \\quad (r < 1) \\qquad \\text{atau} \\qquad S_n = \\frac{a(r^n - 1)}{r - 1} \\quad (r > 1)$$

- **Deret Geometri Tak Hingga Konvergen ($-1 < r < 1$):**
  $$S_\\infty = \\frac{a}{1 - r}$$
  *Contoh:* Bola dijatuhkan dari ketinggian $h$ memantul dengan rasio $r$:
  $$\\text{Total Jarak} = h \\left(\\frac{1 + r}{1 - r}\\right)$$

Ada soal barisan/deret yang ingin kamu selesaikan bersama Matrix?`;
    }

    // 21. Logaritma & Sifat Operasi Logaritma
    if (
      q.includes("logaritma") ||
      q.includes("sifat logaritma") ||
      q.includes("rumus logaritma") ||
      q.includes("persamaan logaritma") ||
      q.includes("ln ") ||
      q.includes("log ")
    ) {
      return `### 🪵 Logaritma & Sifat-Sifat Fundamentalnya

**Logaritma** adalah operasi invers (kebalikan) dari eksponensial (pangkat):
$$a^c = b \\iff \\,^a\\log b = c$$
*(Dengan syarat basis $a > 0, a \\neq 1$, dan numerus $b > 0$)*

---

#### 📚 10 Sifat Pokok Logaritma:
1. **$\\,^a\\log a = 1$** dan **$\\,^a\\log 1 = 0$**
2. **Penjumlahan (Perkalian Numerus):**
   $$\\,^a\\log(b \\cdot c) = \\,^a\\log b + \\,^a\\log c$$
3. **Pengurangan (Pembagian Numerus):**
   $$\\,^a\\log\\left(\\frac{b}{c}\\right) = \\,^a\\log b - \\,^a\\log c$$
4. **Pangkat Numerus:**
   $$\\,^a\\log(b^m) = m \\cdot \\,^a\\log b$$
5. **Pangkat Basis & Numerus:**
   $$\\,^{a^n}\\log(b^m) = \\frac{m}{n} \\cdot \\,^a\\log b$$
6. **Pergantian Basis:**
   $$\\,^a\\log b = \\frac{\\,^p\\log b}{\\,^p\\log a} = \\frac{1}{\\,^b\\log a}$$
7. **Sifat Berantai (Perkalian Logaritma):**
   $$\\,^a\\log b \\cdot \\,^b\\log c = \\,^a\\log c$$
8. **Eksponensial Berpangkat Logaritma:**
   $$a^{\\,^a\\log b} = b$$
9. **Logaritma Natural (Basis $e \\approx 2{,}718$):**
   $$\\ln x = \\,^e\\log x$$
10. **Logaritma Umum (Basis 10):**
    $$\\log x = \\,^{10}\\log x$$

Ada persamaan atau soal logaritma yang ingin kamu diskusikan bersama Matrix?`;
    }

    // 22a. Rotasi dalam 3-Dimensi & Matriks Transformasi
    if (
      q.includes("rotasi 3d") ||
      q.includes("rotasi 3-dimensi") ||
      q.includes("rotasi dalam 3") ||
      q.includes("matriks rotasi") ||
      q.includes("euler") ||
      q.includes("quaternion") ||
      q.includes("gimbal lock") ||
      q.includes("rodrigues")
    ) {
      return `### 🔄 Transformasi Geometri: Rotasi dalam 3-Dimensi (3D Rotation)

Dalam ruang tiga dimensi (vektor $\\mathbf{v} = \\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}$), rotasi objek direpresentasikan melalui perkalian matriks ortogonal $3 \\times 3$ yang mempertahankan panjang vektor dan orientasi ($\\,\\det(R) = +1\\,$).

---

#### 1. Matriks Rotasi Dasar terhadap Sumbu Utama:

1. **Rotasi terhadap Sumbu-$X$ sebesar sudut $\\theta$ ($R_x$ - Roll):**
   $$R_x(\\theta) = \\begin{pmatrix} 1 & 0 & 0 \\\\ 0 & \\cos\\theta & -\\sin\\theta \\\\ 0 & \\sin\\theta & \\cos\\theta \\end{pmatrix}$$

2. **Rotasi terhadap Sumbu-$Y$ sebesar sudut $\\theta$ ($R_y$ - Pitch):**
   $$R_y(\\theta) = \\begin{pmatrix} \\cos\\theta & 0 & \\sin\\theta \\\\ 0 & 1 & 0 \\\\ -\\sin\\theta & 0 & \\cos\\theta \\end{pmatrix}$$

3. **Rotasi terhadap Sumbu-$Z$ sebesar sudut $\\theta$ ($R_z$ - Yaw):**
   $$R_z(\\theta) = \\begin{pmatrix} \\cos\\theta & -\\sin\\theta & 0 \\\\ \\sin\\theta & \\cos\\theta & 0 \\\\ 0 & 0 & 1 \\end{pmatrix}$$

Rotasi umum sembarang dalam ruang diperoleh melalui perkalian berurutan (sudut Euler):
$$R = R_z(\\gamma) R_y(\\beta) R_x(\\alpha)$$

---

#### 2. Keterbatasan Euler Angles & Solusi Quaternions:
- **Gimbal Lock**: Kelemahan representasi sudut Euler ketika dua sumbu rotasi saling sejajar, menyebabkan hilangnya satu derajat kebebasan gerak (degree of freedom).
- **Quaternions ($q = w + xi + yj + zk$):** Solusi standar industri modern (Unity, Unreal Engine, animasi 3D, dan navigasi pesawat terbang) yang memodelkan rotasi mulus tanpa mengalami Gimbal Lock.

> [!NOTE]
> **Catatan Pendalaman Konsep dari Matrix AI:**
> Matriks rotasi merupakan kelompok grup Lie khusus $SO(3)$ (*Special Orthogonal Group*). Sifat krusialnya: transpos matriks sama dengan inversnya: $R^T = R^{-1}$. Untuk mendalami visualisasi interaktif transformasi ruang linear, kamu dapat menjelajahi materi berikut:
> - [Visualisasi Esensi Aljabar Linear - 3Blue1Brown](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab)
> - [Panduan Quaternions & Rotasi 3D Interaktif](https://eater.net/quaternions)`;
    }

    // 22b. Dekomposisi SVD (Singular Value Decomposition)
    if (
      q.includes("svd") ||
      q.includes("singular value") ||
      q.includes("dekomposisi") ||
      q.includes("pca") ||
      q.includes("reduksi dimensi")
    ) {
      return `### ✨ Dekomposisi Matriks: Singular Value Decomposition (SVD)

**Singular Value Decomposition (SVD)** adalah salah satu teorema paling fundamental dan ampuh dalam aljabar linear modern, berlaku untuk sembarang matriks persegi maupun non-persegi berukuran $m \\times n$.

---

#### 1. Formulasi Matematis SVD:
Sembarang matriks riil $A$ berukuran $m \\times n$ dapat didekomposisi menjadi perkalian tiga matriks:
$$A = U \\Sigma V^T$$

Keterangan komponen:
1. **$U$ (Matriks Ortogonal $m \\times m$):** Kolom-kolomnya merupakan *left singular vectors* (vektor eigen dari $AA^T$).
2. **$\\Sigma$ (Matriks Diagonal $m \\times n$):** Elemen diagonalnya adalah nilai singular $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge \\sigma_r > 0$ (akar kuadrat dari nilai eigen $A^T A$).
3. **$V^T$ (Transpos Matriks Ortogonal $n \\times n$):** Kolom-kolom $V$ merupakan *right singular vectors* (vektor eigen dari $A^T A$).

---

#### 2. Aplikasi Riil SVD di Industri Teknologi:
1. **Kompresi Gambar Digital (Low-Rank Matrix Approximation):**
   Dengan Teorema Eckart-Young, kita dapat menyimpan citra dengan hanya mengambil $k$ nilai singular teratas ($k \\ll r$):
   $$A_k = \\sum_{i=1}^{k} \\sigma_i u_i v_i^T$$
   Ini mereduksi ukuran file secara drastis dengan tetap mempertahankan 95%+ kejernihan visual.
2. **Machine Learning & Reduksi Dimensi (PCA):** Membuang fitur yang redundan dan memvisualisasikan data dimensi tinggi (1000D $\\to$ 2D).
3. **Sistem Rekomendasi (Recommender Systems):** Menemukan *latent factors* tersembunyi antara preferensi pengguna dan film/lagu (seperti algoritma Netflix Prize & Spotify).

> [!NOTE]
> **Catatan Pendalaman Konsep dari Matrix AI:**
> SVD membedah aksi setiap transformasi matriks linear menjadi tiga tahap geometri berurutan: **Rotasi ($V^T$) $\\to$ Penskalaan ($\\Sigma$) $\\to$ Rotasi kedua ($U$)**.
> Referensi belajar interaktif terpercaya:
> - [Dekomposisi SVD & Aljabar Linear - MIT OpenCourseWare Gilbert Strang](https://ocw.mit.edu)
> - [Singular Value Decomposition (SVD) - Wikipedia](https://en.wikipedia.org/wiki/Singular_value_decomposition)`;
    }

    // 22c. Nilai Eigen & Vektor Eigen (Eigenvalues & Eigenvectors)
    if (
      q.includes("eigen") ||
      q.includes("nilai eigen") ||
      q.includes("vektor eigen") ||
      q.includes("eigenvalue") ||
      q.includes("eigenvector")
    ) {
      return `### 📐 Nilai Eigen & Vektor Eigen ($Av = \\lambda v$)

Dalam aljabar linier, vektor eigen adalah vektor tak-nol yang arahnya tidak berubah ketika mengalami transformasi matriks linear $A$, melainkan hanya diskalakan sebesar faktor $\\lambda$ (nilai eigen).

---

#### 1. Persamaan Karakteristik:
$$Av = \\lambda v \\iff (A - \\lambda I)v = 0$$

Karena $v \\neq 0$, maka determinan matriks transformasinya harus nol:
$$\\det(A - \\lambda I) = 0$$

#### 2. Contoh Perhitungan Matriks $2 \\times 2$:
Misalkan $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$:
$$\\det\\begin{pmatrix} 4-\\lambda & 1 \\\\ 2 & 3-\\lambda \\end{pmatrix} = (4-\\lambda)(3-\\lambda) - 2 = \\lambda^2 - 7\\lambda + 10 = 0$$
Faktorisasi kuadrat: $(\\lambda - 5)(\\lambda - 2) = 0$, sehingga nilai eigen:
$$\\lambda_1 = 5, \\quad \\lambda_2 = 2$$

---

#### 3. Aplikasi di Dunia Nyata:
1. **Algoritma Google PageRank:** Menentukan ranking miliaran halaman web di internet menggunakan vektor eigen dominan matriks transisi probabilitas tautan web.
2. **Kestabilan Struktur & Jembatan:** Mencegah keruntuhan gedung dan jembatan akibat resonansi frekuensi getaran alami (seperti tragedi Jembatan Tacoma Narrows).
3. **Mekanika Kuantum:** Keadaan energi terkuantisasi elektron dihitung sebagai nilai eigen operator Hamiltonian $\\hat{H}\\psi = E\\psi$.

> [!NOTE]
> **Catatan Pendalaman Konsep dari Matrix AI:**
> Nilai eigen menghubungkan langsung aljabar linear dengan pemfaktoran persamaan kuadrat yang sedang kita pelajari di EPE.
> Tautan pengayaan visual:
> - [Visualisasi Vektor Eigen - 3Blue1Brown Chapter 14](https://www.youtube.com/watch?v=PFDu9oVAE-g)
> - [Eigenvalues and Eigenvectors - Khan Academy](https://www.khanacademy.org/math/linear-algebra)`;
    }

    // 22d. Matriks & Operasi Aljabar Linier
    if (
      q.includes("matriks") ||
      q.includes("determinan matriks") ||
      q.includes("invers matriks") ||
      q.includes("perkalian matriks") ||
      q.includes("transpose") ||
      q.includes("matrix")
    ) {
      return `### 🔲 Aljabar Linier: Matriks, Determinan, & Invers

Matriks adalah susunan skalar dalam baris dan kolom yang merepresentasikan transformasi linear di dalam ruang vektor.

---

#### 1. Operasi Matriks Ordo $2 \\times 2$:
Misalkan matriks $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$:

- **Determinan:**
  $$\\det(A) = |A| = ad - bc$$

- **Invers Matriks (Syarat $\\det(A) \\neq 0$):**
  $$A^{-1} = \\frac{1}{\\det(A)} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix} = \\frac{1}{ad - bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}$$

- **Transpose ($A^T$):**
  $$A^T = \\begin{pmatrix} a & c \\\\ b & d \\end{pmatrix}$$

---

#### 2. Perkalian Dua Matriks ($2 \\times 2$):
$$\\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix} \\begin{pmatrix} b_{11} & b_{12} \\\\ b_{21} & b_{22} \\end{pmatrix} = \\begin{pmatrix} a_{11}b_{11} + a_{12}b_{21} & a_{11}b_{12} + a_{12}b_{22} \\\\ a_{21}b_{11} + a_{22}b_{21} & a_{21}b_{12} + a_{22}b_{22} \\end{pmatrix}$$
*(Kaidah: Baris matriks pertama dikalikan kolom matriks kedua; perkalian matriks tidak bersifat komutatif $AB \\neq BA$).*

---

#### 3. Determinan Matriks $3 \\times 3$ (Metode Sarrus):
Untuk matriks $M = \\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}$:
$$\\det(M) = (aei + bfg + cdh) - (ceg + afh + bdi)$$

> [!NOTE]
> **Catatan Edukatif Matrix AI:**
> Invers matriks digunakan untuk menyelesaikan sistem persamaan linear multivariabel secara serentak $A\\mathbf{x} = \\mathbf{b} \\implies \\mathbf{x} = A^{-1}\\mathbf{b}$.
> - [Eksplorasi Matriks & Vektor - Khan Academy](https://www.khanacademy.org/math/linear-algebra)
> - [Visualisasi Esensi Matriks - 3Blue1Brown](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab)

Ada operasi atau soal matriks tertentu yang ingin kamu bahas bersama?`;
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

    // 7b. Questions about Gemini API Key, Online status, & Internet access
    if (
      lower.includes("gemini") ||
      lower.includes("api key") ||
      lower.includes("apikey") ||
      lower.includes("online") ||
      lower.includes("on-line") ||
      lower.includes("internet") ||
      lower.includes("siapa pembuatmu") ||
      lower.includes("siapa yang membuat")
    ) {
      return `Benar sekali! Pertanyaan yang sangat bagus 🌐✨.

Agar Matrix dapat mengakses pengetahuan luas di internet dan berdiskusi interaktif secara **online**, kamu bisa menyambungkannya dengan **Gemini API Key**:

1. **Gratis & Cepat**: Kamu bisa membuat API Key gratis langsung di [Google AI Studio](https://aistudio.google.com/app/apikey) tanpa kartu kredit.
2. **Cara Pasang**: Klik tombol ⚙️ **Pengaturan** di pojok kanan atas chat ini, lalu tempelkan (*paste*) API Key kamu di kolom yang tersedia.
3. **Dua Mode Kerja Matrix**:
   - **Mode Online (dengan API Key)**: Matrix terhubung langsung ke model mutakhir Google Gemini 3.6 Flash untuk menjawab segala macam pertanyaan sains, fakta dunia, dan diskusi matematika bebas.
   - **Mode Offline (tanpa API Key)**: Matrix tetap dapat menyelesaikan soal latihan, perhitungan aljabar, kalkulator simbolik, dan diagnostik EPE secara lokal.

Ada yang ingin kamu tanyakan lagi seputar cara memasangnya?`;
    }

    // 8. Natural Conversational Fallback (Non-robotic, clean, and helpful)
    return `Aku memahami pertanyaanmu mengenai hal ini 💡.

Untuk memberikan bimbingan yang paling tepat:
- Jika pertanyaan ini berkaitan dengan perhitungan angka atau rumus (misal: aljabar, geometri, atau persamaan kuadrat), kamu bisa langsung menuliskan persamaan atau variabelnya di sini.
- Jika kamu ingin berdiskusi topik sains atau pengetahuan umum secara mendalam dan terhubung ke internet, pastikan **Live Cloud AI (Gemini)** sudah aktif melalui menu ⚙️ Pengaturan di kanan atas.

Ada bagian tertentu dari topik ini yang ingin kita telaah terlebih dahulu?`;
  }

  speakText(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/^[ \t]*(?:---|___|\*\*\*)[ \t]*$/gm, " ")
      .replace(/[-*_]{3,}/g, " ")
      .replace(/\$\$[\s\S]*?\$\$/g, "rumus matematika")
      .replace(/\$([^\$]+)\$/g, "$1")
      .replace(/\\Delta\s*H/g, "delta H")
      .replace(/\\approx/g, "kira-kira sama dengan")
      .replace(/\\sum/g, "jumlah")
      .replace(/\\cdot/g, " kali ")
      .replace(/\\times/g, " kali ")
      .replace(/</g, " kurang dari ")
      .replace(/>/g, " lebih dari ")
      .replace(/[#*_`~]/g, "")
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

  cleanLeadingGreeting(text) {
    if (!text) return "";
    // Only strip greeting if conversation has already started (user sent at least 1 message before)
    if (this.messages.length <= 1) return text;

    let res = text.trim();

    // 1. Remove greeting salutations at the very beginning:
    // e.g. "Halo!", "Halo Siswa!", "Halo Siswa_01!", "Hai!", "Hello!", "Halo [Nama],"
    res = res.replace(/^(?:Halo|Hai|Hello)(?:\s+[A-Za-z0-9_]+)?\s*[\!,\.]\s*/i, "");

    // 2. Remove repetitive self-introductions:
    // e.g. "Saya Matrix.", "Saya adalah Matrix, asisten AI...", "Aku Matrix...", "Saya **Matrix**..."
    res = res.replace(/^(?:(?:Saya|Aku)\s+(?:adalah\s+)?(?:\*\*)?Matrix(?:\*\*)?[^.\n]*[\.\!\?]\s*)/i, "");

    // 3. Remove repetitive canned pleasantries:
    // e.g. "Senang sekali bisa membahas...", "Senang melihat kamu...", "Senang bisa membantu..."
    res = res.replace(/^(?:Senang(?:\s+sekali)?\s+(?:bisa|melihat|dapat)\s+[^.\n]*[\.\!\?]\s*)/i, "");

    // Capitalize first letter of remainder
    if (res && res.length > 0) {
      res = res.charAt(0).toUpperCase() + res.slice(1);
    }
    return res.trim() || text;
  }

  renderSafeMarkdownAndMath(rawText) {
    if (!rawText) return "";

    const rawMathExpressions = {};
    const mathPlaceholders = [];

    const stashMath = (expr, isDisplay) => {
      if (!expr || !expr.trim()) return "";

      // 1. Defensively unpack any nested EPEMATHTOKEN back to raw LaTeX strings
      // This guarantees KaTeX NEVER receives placeholder tokens, completely preventing token leak into rendered spans!
      let fullExpr = expr.trim();
      let loopCount = 0;
      while (/(?:@@@|___|%%)?EPEMATHTOKEN(\d+)(?:@@@|___|%%)?/.test(fullExpr) && loopCount < 10) {
        fullExpr = fullExpr.replace(/(?:@@@|___|%%)?EPEMATHTOKEN(\d+)(?:@@@|___|%%)?/g, (match, idx) => {
          const id = parseInt(idx, 10);
          return rawMathExpressions[id] !== undefined ? rawMathExpressions[id] : "";
        });
        loopCount++;
      }

      const tokenIndex = mathPlaceholders.length;
      rawMathExpressions[tokenIndex] = fullExpr;
      const placeholder = `@@@EPEMATHTOKEN${tokenIndex}@@@`;

      let rendered = "";
      if (typeof window !== "undefined" && window.katex) {
        try {
          rendered = window.katex.renderToString(fullExpr, {
            displayMode: isDisplay,
            throwOnError: false
          });
        } catch (e) {
          const safeExpr = fullExpr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          rendered = `<span class="${isDisplay ? "block my-2 text-center" : "inline"} font-mono text-cyan-300 font-semibold">${isDisplay ? "$$" : "$"}${safeExpr}${isDisplay ? "$$" : "$"}</span>`;
        }
      } else {
        const safeExpr = fullExpr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        rendered = `<span class="${isDisplay ? "block my-2 text-center" : "inline"} font-mono text-cyan-300 font-semibold">${isDisplay ? "$$" : "$"}${safeExpr}${isDisplay ? "$$" : "$"}</span>`;
      }
      mathPlaceholders.push(rendered);
      return placeholder;
    };

    let text = rawText;

    // 0. Autocomplete potential unclosed math if response was truncated (e.g. at end of stream/table)
    if (/\\\(?[^\n)]+$/.test(text) && !text.endsWith("\\)") && !text.endsWith("$")) {
      const openParenCount = (text.match(/\\\(/g) || []).length;
      const closeParenCount = (text.match(/\\\)/g) || []).length;
      if (openParenCount > closeParenCount) {
        text += "\\)";
      }
    }

    // 1. Display Math: $$...$$ OR \[...\] OR \\\[...\\\]
    text = text.replace(/(?:\$\$([\s\S]*?)\$\$|(?:\\\[|\\\\\[)([\s\S]*?)(?:\\\]|\\\\\]))/g, (match, expr1, expr2) => {
      const expr = expr1 !== undefined ? expr1 : expr2;
      if (!expr || !expr.trim()) return "";
      return stashMath(expr, true);
    });

    // 2. Math Environments: \begin{aligned}...\end{aligned}, \begin{matrix}...\end{matrix}, etc.
    // Captured with full environment syntax
    text = text.replace(/\\begin\{([a-zA-Z*]+)\}([\s\S]*?)\\end\{\1\}/g, (match, env, content) => {
      return stashMath(`\\begin{${env}}${content}\\end{${env}}`, true);
    });

    // 3. Inline Math: $...$ OR \(...\) OR \\( ... \\)
    // Supports formulas with multiline matrices or inequalities, as long as it does not cross double newlines
    text = text.replace(/(?:\$([^\$\r\n]*(?:\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\}[^\$\r\n]*|[^\$\r\n]+))\$|(?:\\\(|\\\\\()([\s\S]*?)(?:\\\)|\\\\\)))/g, (match, expr1, expr2) => {
      const expr = expr1 !== undefined ? expr1 : expr2;
      if (!expr) return match;
      const trimmed = expr.trim();
      if (!trimmed) return match;
      if (expr1 && expr1.includes("\n\n")) return match;
      return stashMath(trimmed, false);
    });

    // 4. Format standard markdown (including our robust line-by-line table parser and interactive links)
    let html = this.formatMarkdown(text);

    // 5. Re-inject safely pre-rendered KaTeX HTML back into placeholders (multi-pass while loop)
    let pass = 0;
    while (html.includes("EPEMATHTOKEN") && pass < 5) {
      html = html.replace(/(?:<[a-zA-Z0-9]+[^>]*>)*(?:@@@|___|%%)?EPEMATHTOKEN(\d+)(?:@@@|___|%%)?(?:<\/[a-zA-Z0-9]+>)*/g, (match, idx) => {
        const index = parseInt(idx, 10);
        return mathPlaceholders[index] !== undefined ? mathPlaceholders[index] : "";
      });
      pass++;
    }

    // Defensive final scrub: never leak raw placeholder token text to user screen
    html = html.replace(/(?:@@@|___|%%)?EPEMATHTOKEN\d+(?:@@@|___|%%)?/g, "");

    return html;
  }

  parseMarkdownTables(rawHtml) {
    const lines = rawHtml.split(/\r?\n/);
    const resultLines = [];
    let inTable = false;
    let tableLines = [];

    const isTableRow = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return trimmed.includes("|");
    };

    const isSeparatorRow = (line) => {
      const trimmed = line.trim();
      return /^\|?[\s:\-]+\|[\s:\-|]+$/.test(trimmed) && trimmed.includes("-");
    };

    const flushTable = () => {
      if (tableLines.length < 2) {
        resultLines.push(...tableLines);
        tableLines = [];
        inTable = false;
        return;
      }

      let sepIdx = -1;
      for (let i = 1; i < Math.min(tableLines.length, 3); i++) {
        if (isSeparatorRow(tableLines[i])) {
          sepIdx = i;
          break;
        }
      }

      if (sepIdx === -1) {
        resultLines.push(...tableLines);
        tableLines = [];
        inTable = false;
        return;
      }

      const headerRows = tableLines.slice(0, sepIdx);
      const dataRows = tableLines.slice(sepIdx + 1);

      const parseRow = (line) => {
        let trimmed = line.trim();
        if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
        if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
        return trimmed.split("|").map(cell => {
          let c = cell.trim();
          // Unescape <br> inside cells so multi-formula items break lines beautifully
          c = c.replace(/&lt;br\s*\/?&gt;/gi, "<br/>").replace(/<br\s*\/?>/gi, "<br/>");
          return c;
        });
      };

      let tableHtml = '<div class="overflow-x-auto my-3 rounded-xl border border-slate-700/70 bg-slate-900/60 shadow-md"><table class="w-full text-xs text-left border-collapse">';

      tableHtml += '<thead class="bg-slate-800/90 text-cyan-300 font-bold border-b border-slate-700">';
      for (const hRow of headerRows) {
        const cells = parseRow(hRow);
        tableHtml += '<tr>';
        cells.forEach(c => {
          tableHtml += `<th class="p-2.5 border-r border-slate-700/60 last:border-0 font-bold">${c}</th>`;
        });
        tableHtml += '</tr>';
      }
      tableHtml += '</thead>';

      tableHtml += '<tbody class="divide-y divide-slate-800/80 bg-slate-900/40">';
      for (const dRow of dataRows) {
        if (!dRow.trim()) continue;
        const cells = parseRow(dRow);
        tableHtml += '<tr class="hover:bg-slate-800/40 transition-colors">';
        cells.forEach(c => {
          tableHtml += `<td class="p-2.5 text-slate-200 border-r border-slate-800/60 last:border-0 align-top">${c}</td>`;
        });
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table></div>';

      resultLines.push(tableHtml);
      tableLines = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (isTableRow(line)) {
        inTable = true;
        tableLines.push(line);
      } else {
        if (inTable) {
          flushTable();
        }
        resultLines.push(line);
      }
    }

    if (inTable) {
      flushTable();
    }

    return resultLines.join("\n");
  }

  parseMarkdownQuotes(rawHtml) {
    const lines = rawHtml.split(/\r?\n/);
    const result = [];
    let quoteLines = [];
    let inQuote = false;

    const flushQuote = () => {
      if (quoteLines.length === 0) return;

      // Check if first line is an alert callout tag: [!NOTE], [!CATATAN], [!TIP], [!PETUNJUK], [!IMPORTANT], [!PENTING], [!WARNING]
      const firstLine = quoteLines[0].trim();
      const calloutMatch = firstLine.match(/^\[!(NOTE|CATATAN|TIP|PETUNJUK|IMPORTANT|PENTING|WARNING|PERINGATAN)\][ \t]*(.*)$/i);

      if (calloutMatch) {
        const type = calloutMatch[1].toUpperCase();
        const firstLineRest = calloutMatch[2].trim();
        const contentLines = [];
        if (firstLineRest) contentLines.push(firstLineRest);
        for (let i = 1; i < quoteLines.length; i++) {
          contentLines.push(quoteLines[i]);
        }
        const innerContent = contentLines.join("\n").trim();

        let iconSvg = "";
        let title = "";
        let alertClass = "";

        if (type === "NOTE" || type === "CATATAN") {
          alertClass = "ai-callout-note";
          title = "Catatan Edukatif Matrix AI:";
          iconSvg = '<svg class="w-4 h-4 shrink-0 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
        } else if (type === "TIP" || type === "PETUNJUK") {
          alertClass = "ai-callout-tip";
          title = "Tips Pemahaman:";
          iconSvg = '<svg class="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>';
        } else {
          alertClass = "ai-callout-important";
          title = "Poin Kritis:";
          iconSvg = '<svg class="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
        }

        result.push(`<div class="${alertClass} my-3 p-3.5 rounded-xl border text-xs shadow-sm"><div class="ai-callout-header font-bold flex items-center gap-1.5 mb-1.5">${iconSvg}<span>${title}</span></div><div class="ai-callout-content space-y-1.5 leading-relaxed">${innerContent}</div></div>`);
      } else {
        // Standard blockquote - combine all consecutive lines into ONE single quote box
        const innerContent = quoteLines.join("\n").trim();
        result.push(`<blockquote class="ai-markdown-quote my-2.5 p-3 rounded-r-xl border-l-4 text-xs italic leading-relaxed">${innerContent}</blockquote>`);
      }

      quoteLines = [];
      inQuote = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const quoteMatch = line.match(/^[ \t]*(?:&gt;|>)[ \t]?(.*)$/);
      if (quoteMatch) {
        inQuote = true;
        quoteLines.push(quoteMatch[1]);
      } else {
        if (inQuote) {
          flushQuote();
        }
        result.push(line);
      }
    }

    if (inQuote) {
      flushQuote();
    }

    return result.join("\n");
  }

  formatMarkdown(raw) {
    if (!raw) return "";

    let html = raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 1. Code blocks (```lang ... ```)
    html = html.replace(/```([a-zA-Z0-9_\-]*)\r?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="ai-markdown-pre p-3 my-2.5 rounded-lg border text-xs font-mono overflow-x-auto"><code>${code.trim()}</code></pre>`;
    });

    // 2. Parse Markdown Tables with our robust line-by-line block parser
    html = this.parseMarkdownTables(html);

    // 3. Multi-line Blockquotes & Alert Callouts (> [!NOTE], > [!TIP], etc.)
    html = this.parseMarkdownQuotes(html);

    // 4. Horizontal Rules (---, ***, ___, etc.)
    html = html.replace(/^[ \t]*(?:---|\*\*\*|___|- - -|\* \* \*|_ _ _|-{3,}|\*{3,}|_{3,})[ \t]*$/gim, '<hr class="my-3.5 border-t ai-markdown-hr" />');

    // 5. Headers (h6 down to h1)
    html = html.replace(/^[ \t]*######[ \t]+(.*$)/gim, '<h6 class="font-bold text-xs ai-markdown-h6 mt-2.5 mb-1 tracking-wider uppercase">$1</h6>');
    html = html.replace(/^[ \t]*#####[ \t]+(.*$)/gim, '<h6 class="font-bold text-xs ai-markdown-h5 mt-2.5 mb-1 tracking-wide uppercase">$1</h6>');
    html = html.replace(/^[ \t]*####[ \t]+(.*$)/gim, '<h5 class="font-bold text-xs sm:text-sm ai-markdown-h4 mt-3 mb-1">$1</h5>');
    html = html.replace(/^[ \t]*###[ \t]+(.*$)/gim, '<h4 class="font-bold text-sm sm:text-base ai-markdown-h3 mt-3.5 mb-1.5">$1</h4>');
    html = html.replace(/^[ \t]*##[ \t]+(.*$)/gim, '<h3 class="font-bold text-base sm:text-lg ai-markdown-h2 mt-4 mb-2 border-b pb-1">$1</h3>');
    html = html.replace(/^[ \t]*#[ \t]+(.*$)/gim, '<h2 class="font-extrabold text-lg sm:text-xl ai-markdown-h1 mt-4 mb-2">$1</h2>');

    // 6. Lists
    // Numbered lists: 1. 2. etc with hanging indent
    html = html.replace(/^([ \t]*)(\d+)\.[ \t]+(.*$)/gim, (match, indent, num, content) => {
      const isNested = indent && indent.length >= 2;
      const mlClass = isNested ? "ml-6" : "ml-2";
      return `<div class="${mlClass} ai-markdown-list-item flex items-start gap-2 my-1"><span class="font-bold ai-markdown-list-num select-none flex-shrink-0">${num}.</span><div class="flex-1">${content}</div></div>`;
    });

    // Bullet points: - or * or + with hanging indent
    html = html.replace(/^([ \t]*)[-\*\+][ \t]+(.*$)/gim, (match, indent, content) => {
      const isNested = indent && indent.length >= 2;
      const mlClass = isNested ? "ml-6" : "ml-2";
      const bulletSymbol = isNested ? "◦" : "•";
      return `<div class="${mlClass} ai-markdown-list-item flex items-start gap-2 my-0.5"><span class="ai-markdown-bullet select-none flex-shrink-0 text-sm leading-tight">${bulletSymbol}</span><div class="flex-1">${content}</div></div>`;
    });

    // 7. Interactive Markdown Hyperlinks [Anchor Text](https://url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)\<\>]+)\)/g, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ai-chat-link font-semibold inline-flex items-center gap-1 transition-colors group"><span>${text}</span><svg class="w-3 h-3 inline shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
    });

    // Autolink bare URLs (not already preceded by href=" or src=" or inside a tag)
    html = html.replace(/(^|[\s>\(])(https?:\/\/[^\s<>\)]+)/g, (match, prefix, url) => {
      return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="ai-chat-link font-semibold inline-flex items-center gap-1 transition-colors"><span>${url}</span><svg class="w-3 h-3 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>`;
    });

    // 8. Bold & Italic & Strikethrough (semantic classes for theme adaptability)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold ai-markdown-bold">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold ai-markdown-bold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic ai-markdown-italic">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="italic ai-markdown-italic">$1</em>');
    html = html.replace(/~~(.*?)~~/g, '<del class="line-through ai-markdown-del">$1</del>');

    // 9. Inline code: `code`
    html = html.replace(/`([^`\n]+)`/g, '<code class="ai-markdown-code px-1.5 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // 10. Convert line breaks
    html = html.replace(/\n/g, "<br/>");

    // 11. Clean up redundant <br/> tags around block elements
    html = html.replace(/(<\/(?:h[1-6]|pre|table|thead|tbody|tr|th|td|div|blockquote)>|<hr[^>]*\/?>)\s*<br\s*\/?>/gi, "$1");
    html = html.replace(/<br\s*\/?>\s*(<(?:h[1-6]|pre|table|div|blockquote|hr)[^>]*>)/gi, "$1");
    html = html.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br/><br/>");

    return html;
  }

  renderKaTeXInBubble(bubbleEl) {
    // Retained for backward-compatibility; math is now safely pre-rendered during renderSafeMarkdownAndMath
  }

  openSettingsModal() {
    let modal = document.getElementById("ai-settings-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ai-settings-modal";
      modal.className = "fixed inset-0 z-[100001] flex items-center justify-center p-4 modal-backdrop";
      modal.innerHTML = `
        <div class="card-clean max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-700 bg-slate-900/95 max-h-[92vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-2 border-b border-slate-700">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <span>⚙️</span> Konfigurasi Live Cloud AI (Gemini / OpenAI)
            </h3>
            <button id="btn-close-ai-settings" class="text-slate-400 hover:text-white p-1">✕</button>
          </div>

          <div class="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200 space-y-1.5">
            <div class="font-bold flex items-center gap-1.5 text-cyan-300">
              <span>✨</span> Dapatkan Gemini API Key Gratis:
            </div>
            <p class="text-[11px] text-slate-300">
              Google menyediakan kuota gratis hingga 1.500 request/hari tanpa perlu kartu kredit.
            </p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-cyan-400 font-bold underline hover:text-cyan-300 mt-1">
              <span>👉 Buat API Key di Google AI Studio (30 Detik)</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>

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

            <div id="ai-key-test-status" class="hidden p-2 rounded text-xs font-mono"></div>
          </div>

          <div class="flex items-center justify-between gap-2 pt-3 border-t border-slate-700">
            <button id="btn-test-ai-key" class="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
              <span>⚡</span> Uji Koneksi
            </button>
            <div class="flex items-center gap-2">
              <button id="btn-clear-ai-key" class="btn-secondary text-xs py-1.5 px-3">Hapus</button>
              <button id="btn-save-ai-settings" class="btn-primary text-xs py-1.5 px-4 font-bold">Simpan</button>
            </div>
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
        const statusEl = modal.querySelector("#ai-key-test-status");
        statusEl.className = "hidden";
        alert("API Key berhasil dihapus. Matrix kembali menggunakan Cognitive Brain bawaan.");
      });

      // Uji Koneksi API Key secara live
      modal.querySelector("#btn-test-ai-key").addEventListener("click", async () => {
        const testKey = modal.querySelector("#ai-api-key-input").value.trim();
        const testProv = modal.querySelector("#ai-provider-select").value;
        const statusEl = modal.querySelector("#ai-key-test-status");
        statusEl.classList.remove("hidden");
        statusEl.className = "p-2 rounded text-xs font-sans bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-2";
        statusEl.innerHTML = `<span>⏳</span> Menguji koneksi ke server ${testProv === "gemini" ? "Google Gemini" : "OpenAI"}...`;

        if (!testKey) {
          statusEl.className = "p-2 rounded text-xs font-sans bg-amber-950/40 text-amber-300 border border-amber-700";
          statusEl.textContent = "⚠️ Masukkan API Key terlebih dahulu.";
          return;
        }

        try {
          if (testProv === "gemini") {
            const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
            let connected = false;
            let connectedModel = "";
            let errMsg = "";

            for (const m of modelsToTry) {
              try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${testKey.trim()}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: "Ketik 'OK' jika kamu terhubung." }] }]
                  })
                });
                const data = await res.json();
                if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                  connected = true;
                  connectedModel = m;
                  break;
                } else if (data.error) {
                  errMsg = data.error.message;
                }
              } catch (err) {
                errMsg = err.message;
              }
            }

            if (connected) {
              statusEl.className = "p-2 rounded text-xs font-sans bg-emerald-950/50 text-emerald-300 border border-emerald-700";
              statusEl.innerHTML = `✅ <strong>Koneksi Sukses!</strong> Google Gemini (${connectedModel}) aktif dan siap digunakan secara online.`;
            } else {
              statusEl.className = "p-2 rounded text-xs font-sans bg-rose-950/50 text-rose-300 border border-rose-700";
              statusEl.textContent = `❌ Gagal: ${errMsg || "Kunci API tidak valid."}`;
            }
          } else {
            statusEl.className = "p-2 rounded text-xs font-sans bg-blue-950/50 text-blue-300 border border-blue-700";
            statusEl.textContent = "ℹ️ Provider OpenAI siap dikonfigurasi.";
          }
        } catch (e) {
          statusEl.className = "p-2 rounded text-xs font-sans bg-rose-950/50 text-rose-300 border border-rose-700";
          statusEl.textContent = `❌ Kendala jaringan: ${e.message}`;
        }
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
