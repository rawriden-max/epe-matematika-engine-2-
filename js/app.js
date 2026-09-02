/**
 * app.js - Controller Utama Aplikasi Error Pattern Engine (EPE) & Bank Soal Latihan
 * Menghubungkan Mode Diagnostik Baku, Mode Bank Soal Multimedia, dan Riwayat Statistik
 */

// Note: style.css is already loaded via <link> in index.html
import { QUESTIONS, DOMAINS } from "./data/questions.js";
import { SAMPLE_PRESETS } from "./data/samplePresets.js";
import { CustomQuestionStore } from "./data/customQuestionStore.js";
import { ErrorPatternEngine } from "./engine/epeEngine.js";
import { MathToolbar } from "./ui/mathToolbar.js";
import { HistoryManager } from "./ui/historyManager.js";
import { NotificationToast } from "./ui/notification.js";
import { MediaManager, VoiceRecorder } from "./ui/mediaManager.js";

class EpeApp {
  constructor() {
    this.questions = QUESTIONS;
    this.domains = DOMAINS;
    this.presets = SAMPLE_PRESETS;
    this.historyManager = new HistoryManager();
    this.customStore = new CustomQuestionStore();

    // State Diagnostik Baku
    this.activeQuestionId = "Q1";
    this.activeDomainFilter = "ALL";
    this.latestResult = null;
    this.theme = localStorage.getItem("epe_theme") || "light";

    // State Mode Navigasi Tab ('diagnostic' | 'practice' | 'history')
    this.activeTab = "diagnostic";

    // State Latihan Mandiri
    this.activePracticeQuestionId = null;
    this.studentPhotoData = null; // { name, dataUrl, size }
    this.studentVoiceData = null; // { blob, url, base64, duration }
    this.studentVoiceRecorder = null;

    // State Modal Tambah Soal
    this.newQImage = null;
    this.newQFile = null;
    this.newQAudio = null;
    this.newQVoiceRecorder = null;

    // DOM Elements Cache
    this.elements = {};
  }

  init() {
    this.cacheElements();
    this.applyTheme(this.theme);
    
    // Inisialisasi Mode Diagnostik Baku
    this.renderDomainFilters();
    this.renderQuestionGrid();
    this.renderPresetSelector();
    this.renderMathToolbar();
    this.selectQuestion(this.activeQuestionId);

    // Inisialisasi Mode Latihan Mandiri
    this.initPracticeMode();

    // Inisialisasi Perekam Suara (Voice Recorders)
    this.initVoiceRecorders();

    // Inisialisasi Event Handlers
    this.bindEvents();

    // Update Statistik Awal
    this.updateStatsAndHistory();

    console.log("Error Pattern Engine (EPE) & Practice Store Berhasil Diinisialisasi.");
  }

  cacheElements() {
    this.elements = {
      // Theme & Guide
      themeToggleBtn: document.getElementById("theme-toggle-btn"),
      themeIcon: document.getElementById("theme-icon"),
      btnOpenGuide: document.getElementById("btn-open-guide"),
      btnCloseGuide: document.getElementById("btn-close-guide"),
      btnCloseGuide2: document.getElementById("btn-close-guide-2"),
      guideModal: document.getElementById("guide-modal"),

      // Navigation Tabs
      tabBtnDiagnostic: document.getElementById("tab-btn-diagnostic"),
      tabBtnPractice: document.getElementById("tab-btn-practice"),
      tabBtnHistory: document.getElementById("tab-btn-history"),
      sectionDiagnostic: document.getElementById("section-diagnostic-mode"),
      sectionPractice: document.getElementById("section-practice-mode"),
      sectionHistory: document.getElementById("section-history-mode"),

      // Tab 1: Diagnostik Baku
      domainFilterContainer: document.getElementById("domain-filter-container"),
      questionGridContainer: document.getElementById("question-grid-container"),
      qDomainBadge: document.getElementById("q-domain-badge"),
      qNumberBadge: document.getElementById("q-number-badge"),
      qTitle: document.getElementById("q-title"),
      qPromptText: document.getElementById("q-prompt-text"),
      qMathDisplay: document.getElementById("q-math-display"),
      qTopicText: document.getElementById("q-topic-text"),
      presetSelect: document.getElementById("preset-select"),
      presetApplyBtn: document.getElementById("preset-apply-btn"),
      studentIdInput: document.getElementById("student-id-input"),
      studentStepsInput: document.getElementById("student-steps-input"),
      studentAnswerInput: document.getElementById("student-answer-input"),
      mathToolbarContainer: document.getElementById("math-toolbar-container"),
      btnAnalyze: document.getElementById("btn-analyze"),
      btnReset: document.getElementById("btn-reset"),
      btnCopyOutput: document.getElementById("btn-copy-output"),
      outputSection: document.getElementById("output-section"),
      outputPlainText: document.getElementById("output-plain-text"),
      confidenceBar: document.getElementById("confidence-bar"),
      confidenceScoreText: document.getElementById("confidence-score-text"),
      primaryTaxonomyBadge: document.getElementById("primary-taxonomy-badge"),
      secondaryTaxonomyBadge: document.getElementById("secondary-taxonomy-badge"),
      evidenceText: document.getElementById("evidence-text"),
      remediationText: document.getElementById("remediation-text"),

      // Tab 2: Bank Latihan & Ujian Siswa
      practiceQuestionList: document.getElementById("practice-question-list"),
      practiceQuestionCountBadge: document.getElementById("practice-question-count-badge"),
      btnOpenCreateModal: document.getElementById("btn-open-create-question-modal"),
      btnExportBankJson: document.getElementById("btn-export-bank-json"),
      inputImportBankJson: document.getElementById("input-import-bank-json"),
      practiceActiveIdBadge: document.getElementById("practice-active-id-badge"),
      practiceActiveCategoryBadge: document.getElementById("practice-active-category-badge"),
      practiceActiveTopicText: document.getElementById("practice-active-topic-text"),
      practiceActiveTitle: document.getElementById("practice-active-title"),
      practiceActivePrompt: document.getElementById("practice-active-prompt"),
      practiceActiveMathDisplay: document.getElementById("practice-active-math-display"),
      practiceMediaImageBox: document.getElementById("practice-media-image-box"),
      practiceMediaImgTag: document.getElementById("practice-media-img-tag"),
      practiceMediaAudioBox: document.getElementById("practice-media-audio-box"),
      practiceMediaAudioPlayer: document.getElementById("practice-media-audio-player"),
      practiceMediaFileBox: document.getElementById("practice-media-file-box"),
      practiceMediaFileLink: document.getElementById("practice-media-file-link"),
      practiceMediaFileName: document.getElementById("practice-media-file-name"),

      // Lembar Jawaban Siswa Latihan
      practiceStudentName: document.getElementById("practice-student-name"),
      practiceStepsInput: document.getElementById("practice-steps-input"),
      practiceAnswerInput: document.getElementById("practice-answer-input"),
      studentPhotoDropzone: document.getElementById("student-photo-dropzone"),
      inputStudentPhoto: document.getElementById("input-student-photo"),
      studentPhotoPreviewBox: document.getElementById("student-photo-preview-box"),
      studentPhotoImg: document.getElementById("student-photo-img"),
      btnRemoveStudentPhoto: document.getElementById("btn-remove-student-photo"),
      btnStartRecordVoice: document.getElementById("btn-start-record-voice"),
      btnStopRecordVoice: document.getElementById("btn-stop-record-voice"),
      voiceRecordTimer: document.getElementById("voice-record-timer"),
      studentVoicePlayerBox: document.getElementById("student-voice-player-box"),
      studentVoicePlayer: document.getElementById("student-voice-player"),
      btnDeleteVoice: document.getElementById("btn-delete-voice"),
      btnAnalyzePractice: document.getElementById("btn-analyze-practice"),
      btnTogglePracticeSolution: document.getElementById("btn-toggle-practice-solution"),
      practiceSolutionBox: document.getElementById("practice-solution-box"),
      practiceStandardAnswerText: document.getElementById("practice-standard-answer-text"),
      practiceExplanationText: document.getElementById("practice-explanation-text"),
      practiceOutputCard: document.getElementById("practice-output-card"),
      practiceConfidenceBadge: document.getElementById("practice-confidence-badge"),
      practiceResultPrimaryError: document.getElementById("practice-result-primary-error"),
      practiceResultStatus: document.getElementById("practice-result-status"),
      practiceResultEvidence: document.getElementById("practice-result-evidence"),
      practiceResultRemediation: document.getElementById("practice-result-remediation"),

      // Tab 3: Riwayat & Statistik
      statTotalCount: document.getElementById("stat-total-count"),
      statE0Count: document.getElementById("stat-e0-count"),
      statE0Sub: document.getElementById("stat-e0-sub"),
      statE1Count: document.getElementById("stat-e1-count"),
      statE1Sub: document.getElementById("stat-e1-sub"),
      statE2Count: document.getElementById("stat-e2-count"),
      statE2Sub: document.getElementById("stat-e2-sub"),
      statE3Count: document.getElementById("stat-e3-count"),
      statE3Sub: document.getElementById("stat-e3-sub"),
      statE4Count: document.getElementById("stat-e4-count"),
      statE4Sub: document.getElementById("stat-e4-sub"),
      historyTableBody: document.getElementById("history-table-body"),
      historyEmptyState: document.getElementById("history-empty-state"),
      btnExportCsvTab: document.getElementById("btn-export-csv-tab"),
      btnClearHistory: document.getElementById("btn-clear-history"),

      // Modal Tambah Soal Baru
      createQuestionModal: document.getElementById("create-question-modal"),
      createQuestionForm: document.getElementById("create-question-form"),
      btnCloseCreateModal: document.getElementById("btn-close-create-modal"),
      btnCancelCreateQ: document.getElementById("btn-cancel-create-q"),
      newQTitle: document.getElementById("new-q-title"),
      newQTopic: document.getElementById("new-q-topic"),
      newQPrompt: document.getElementById("new-q-prompt"),
      newQLatex: document.getElementById("new-q-latex"),
      newQLatexPreview: document.getElementById("new-q-latex-preview"),
      newQAnswer: document.getElementById("new-q-answer"),
      newQExplanation: document.getElementById("new-q-explanation"),
      newQImageDropzone: document.getElementById("new-q-image-dropzone"),
      newQImageInput: document.getElementById("new-q-image-input"),
      newQImagePreviewBox: document.getElementById("new-q-image-preview-box"),
      newQImageTag: document.getElementById("new-q-image-tag"),
      btnRemoveNewQImage: document.getElementById("btn-remove-new-q-image"),
      newQFileDropzone: document.getElementById("new-q-file-dropzone"),
      newQFileInput: document.getElementById("new-q-file-input"),
      newQFileNameLabel: document.getElementById("new-q-file-name-label"),
      btnRemoveNewQFile: document.getElementById("btn-remove-new-q-file"),
      btnNewQRecordStart: document.getElementById("btn-new-q-record-start"),
      btnNewQRecordStop: document.getElementById("btn-new-q-record-stop"),
      newQRecordTimer: document.getElementById("new-q-record-timer"),
      newQAudioUpload: document.getElementById("new-q-audio-upload"),
      newQAudioPreviewBox: document.getElementById("new-q-audio-preview-box"),
      newQAudioPlayer: document.getElementById("new-q-audio-player"),
      btnNewQRemoveAudio: document.getElementById("btn-new-q-remove-audio"),

      // Lightbox Zoom Gambar
      imageLightboxModal: document.getElementById("image-lightbox-modal"),
      lightboxImg: document.getElementById("lightbox-img"),
      btnCloseLightbox: document.getElementById("btn-close-lightbox")
    };
  }

  // =========================================================================
  // THEME MANAGEMENT
  // =========================================================================
  applyTheme(theme) {
    this.theme = theme;
    localStorage.setItem("epe_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("theme-dark");
      if (this.elements.themeIcon) {
        this.elements.themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
      }
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("theme-dark");
      if (this.elements.themeIcon) {
        this.elements.themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;
      }
    }
  }

  toggleTheme() {
    this.applyTheme(this.theme === "dark" ? "light" : "dark");
  }

  // =========================================================================
  // TAB NAVIGATION
  // =========================================================================
  switchTab(tabName) {
    this.activeTab = tabName;

    // Reset tab button styles
    [this.elements.tabBtnDiagnostic, this.elements.tabBtnPractice, this.elements.tabBtnHistory].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });

    // Hide all sections
    if (this.elements.sectionDiagnostic) this.elements.sectionDiagnostic.classList.add("hidden");
    if (this.elements.sectionPractice) this.elements.sectionPractice.classList.add("hidden");
    if (this.elements.sectionHistory) this.elements.sectionHistory.classList.add("hidden");

    if (tabName === "diagnostic") {
      this.elements.tabBtnDiagnostic?.classList.add("active");
      this.elements.sectionDiagnostic?.classList.remove("hidden");
    } else if (tabName === "practice") {
      this.elements.tabBtnPractice?.classList.add("active");
      this.elements.sectionPractice?.classList.remove("hidden");
      this.renderPracticeQuestionList();
    } else if (tabName === "history") {
      this.elements.tabBtnHistory?.classList.add("active");
      this.elements.sectionHistory?.classList.remove("hidden");
      this.updateStatsAndHistory();
    }
  }

  // =========================================================================
  // TAB 1: DIAGNOSTIK BAKU (24 SOAL)
  // =========================================================================
  renderDomainFilters() {
    if (!this.elements.domainFilterContainer) return;
    let html = `<button data-filter="ALL" class="filter-tab-btn ${this.activeDomainFilter === "ALL" ? "active" : ""}">Semua Domain (24)</button>`;
    Object.values(this.domains).forEach((dom) => {
      const isActive = this.activeDomainFilter === dom.id;
      html += `<button data-filter="${dom.id}" class="filter-tab-btn ${isActive ? "active" : ""}">${dom.id} (${dom.name})</button>`;
    });
    this.elements.domainFilterContainer.innerHTML = html;
    this.elements.domainFilterContainer.querySelectorAll(".filter-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.activeDomainFilter = e.currentTarget.getAttribute("data-filter");
        this.renderDomainFilters();
        this.renderQuestionGrid();
      });
    });
  }

  renderQuestionGrid() {
    if (!this.elements.questionGridContainer) return;
    const filtered = this.questions.filter((q) => this.activeDomainFilter === "ALL" || q.domainId === this.activeDomainFilter);
    let html = "";
    filtered.forEach((q) => {
      const isActive = q.id === this.activeQuestionId;
      html += `
        <button data-qid="${q.id}" class="q-btn ${isActive ? "active" : ""}" title="Soal ${q.id} (${q.domainId})">
          <span class="q-badge">${q.domainId}</span>
          <span>${q.id}</span>
        </button>
      `;
    });
    this.elements.questionGridContainer.innerHTML = html;
    this.elements.questionGridContainer.querySelectorAll(".q-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.selectQuestion(e.currentTarget.getAttribute("data-qid"));
      });
    });
  }

  renderPresetSelector() {
    if (!this.elements.presetSelect) return;
    let html = '<option value="">-- Pilih Contoh Jawaban Simulasi Siswa --</option>';
    const categories = [
      { code: "E0", label: "Jawaban Benar / Akurat (E0)" },
      { code: "E1", label: "Kesalahan Konseptual (E1)" },
      { code: "E2", label: "Kesalahan Prosedural (E2)" },
      { code: "E3", label: "Kesalahan Komputasi (E3)" },
      { code: "E4", label: "Kesalahan Interpretasi (E4)" }
    ];
    categories.forEach((cat) => {
      const catPresets = this.presets.filter((p) => p.category === cat.code);
      if (catPresets.length > 0) {
        html += `<optgroup label="${cat.label}">`;
        catPresets.forEach((p) => {
          html += `<option value="${p.id}">${p.label}</option>`;
        });
        html += `</optgroup>`;
      }
    });
    this.elements.presetSelect.innerHTML = html;
  }

  renderMathToolbar() {
    if (!this.elements.mathToolbarContainer) return;
    const symbols = MathToolbar.getSymbols();
    let html = "";
    symbols.forEach((sym) => {
      html += `<button type="button" data-symbol="${sym.value}" title="${sym.tooltip}" class="math-sym-btn">${sym.label}</button>`;
    });
    this.elements.mathToolbarContainer.innerHTML = html;
    this.elements.mathToolbarContainer.querySelectorAll(".math-sym-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        MathToolbar.insertSymbol(this.elements.studentStepsInput, e.currentTarget.getAttribute("data-symbol"));
      });
    });
  }

  selectQuestion(questionId) {
    this.activeQuestionId = questionId;
    const q = this.questions.find((item) => item.id === questionId) || this.questions[0];
    const domain = this.domains[q.domainId];

    if (this.elements.qNumberBadge) this.elements.qNumberBadge.textContent = q.id;
    if (this.elements.qDomainBadge) {
      this.elements.qDomainBadge.textContent = `${q.domainId} - ${domain?.name || q.domainName}`;
      this.elements.qDomainBadge.className = `px-2 py-0.5 rounded-md text-xs font-semibold ${domain?.badgeClass || "badge-d1"}`;
    }
    if (this.elements.qTitle) this.elements.qTitle.textContent = q.title;
    if (this.elements.qPromptText) this.elements.qPromptText.textContent = q.promptText;
    if (this.elements.qTopicText) this.elements.qTopicText.textContent = q.topic;

    if (this.elements.qMathDisplay) {
      if (q.latexEquation) {
        this.renderKaTeX(q.latexEquation, this.elements.qMathDisplay, true);
        this.elements.qMathDisplay.classList.remove("hidden");
      } else {
        this.elements.qMathDisplay.classList.add("hidden");
      }
    }

    this.renderQuestionGrid();
  }

  loadPreset(presetId) {
    if (!presetId) return;
    const preset = this.presets.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.questionId && preset.questionId !== this.activeQuestionId) {
      this.selectQuestion(preset.questionId);
    }

    if (this.elements.studentIdInput) this.elements.studentIdInput.value = preset.studentId;
    if (this.elements.studentAnswerInput) this.elements.studentAnswerInput.value = preset.studentAnswer;
    if (this.elements.studentStepsInput) this.elements.studentStepsInput.value = preset.studentSteps;

    NotificationToast.show(`Contoh "${preset.label}" dimuat. Menganalisis...`, "info");
    setTimeout(() => this.handleAnalysis(), 150);
  }

  handleAnalysis() {
    const studentId = this.elements.studentIdInput?.value || "Siswa_01";
    const studentAnswer = this.elements.studentAnswerInput?.value || "";
    const studentSteps = this.elements.studentStepsInput?.value || "";

    if (!studentAnswer.trim() && !studentSteps.trim()) {
      NotificationToast.show("Masukkan langkah pengerjaan atau jawaban siswa terlebih dahulu.", "warning");
      this.elements.studentStepsInput?.focus();
      return;
    }

    const result = ErrorPatternEngine.analyze({
      studentId,
      questionId: this.activeQuestionId,
      studentAnswer,
      studentSteps
    });

    this.latestResult = result;
    this.historyManager.addEntry(result);
    this.renderDiagnosticOutput(result);
    this.updateStatsAndHistory();

    NotificationToast.show("Diagnosis EPE berhasil dijalankan!", "success");
    if (window.innerWidth < 1024 && this.elements.outputSection) {
      this.elements.outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  renderDiagnosticOutput(result) {
    if (!result) return;
    if (this.elements.outputPlainText) {
      this.elements.outputPlainText.textContent = result.rawPlainText;
    }
    if (this.elements.confidenceScoreText) {
      this.elements.confidenceScoreText.textContent = `${result.confidenceScore}%`;
    }
    if (this.elements.confidenceBar) {
      this.elements.confidenceBar.style.width = `${result.confidenceScore}%`;
    }
    if (this.elements.primaryTaxonomyBadge) {
      const isCorrect = result.primaryErrorCode === "E0";
      this.elements.primaryTaxonomyBadge.textContent = result.primaryErrorText;
      this.elements.primaryTaxonomyBadge.className = isCorrect ? "text-xs font-bold text-emerald-600 dark:text-emerald-400" : "text-xs font-bold text-rose-600 dark:text-rose-400";
    }
    if (this.elements.secondaryTaxonomyBadge) {
      this.elements.secondaryTaxonomyBadge.textContent = result.secondaryErrorText || "Tidak ada";
    }
    if (this.elements.evidenceText) {
      this.elements.evidenceText.textContent = result.evidence;
    }
    if (this.elements.remediationText) {
      this.elements.remediationText.textContent = result.remediation;
    }
  }

  handleCopyOutput() {
    if (!this.latestResult || !this.latestResult.rawPlainText) {
      NotificationToast.show("Belum ada hasil analisis untuk disalin.", "warning");
      return;
    }
    navigator.clipboard.writeText(this.latestResult.rawPlainText).then(() => {
      NotificationToast.show("Teks diagnosis berhasil disalin ke clipboard!", "success");
    }).catch(() => {
      NotificationToast.show("Gagal menyalin teks.", "error");
    });
  }

  handleResetForm() {
    if (this.elements.studentStepsInput) this.elements.studentStepsInput.value = "";
    if (this.elements.studentAnswerInput) this.elements.studentAnswerInput.value = "";
    if (this.elements.presetSelect) this.elements.presetSelect.value = "";
    NotificationToast.show("Formulir pengerjaan siswa telah dikosongkan.", "info");
  }

  // =========================================================================
  // TAB 2: BANK SOAL & LATIHAN SISWA (MULTIMEDIA)
  // =========================================================================
  initPracticeMode() {
    const practiceQuestions = this.customStore.getAll();
    if (practiceQuestions.length > 0) {
      this.selectPracticeQuestion(practiceQuestions[0].id);
    }
  }

  renderPracticeQuestionList() {
    if (!this.elements.practiceQuestionList) return;
    const questions = this.customStore.getAll();

    if (this.elements.practiceQuestionCountBadge) {
      this.elements.practiceQuestionCountBadge.textContent = `${questions.length} Soal`;
    }

    let html = "";
    questions.forEach((q) => {
      const isActive = q.id === this.activePracticeQuestionId;
      const hasImage = !!q.image;
      const hasAudio = !!q.audioNote;
      const hasFile = !!q.fileAttachment;

      html += `
        <div data-pid="${q.id}" class="practice-card card-clean p-3 cursor-pointer transition-all ${
        isActive ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500" : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      }">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">${q.id}</span>
            <div class="flex items-center gap-1">
              ${hasImage ? `<span title="Memiliki Gambar Soal" class="text-[10px] px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">🖼️</span>` : ""}
              ${hasAudio ? `<span title="Memiliki Voice Note" class="text-[10px] px-1 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">🎙️</span>` : ""}
              ${hasFile ? `<span title="Memiliki File Lampiran" class="text-[10px] px-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">📁</span>` : ""}
              ${!q.isBuiltIn ? `<button data-delete-pid="${q.id}" title="Hapus Soal Ini" class="text-slate-400 hover:text-rose-500 p-0.5"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>` : ""}
            </div>
          </div>
          <h4 class="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">${q.title}</h4>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">${q.promptText}</p>
        </div>
      `;
    });

    this.elements.practiceQuestionList.innerHTML = html;

    // Bind item click
    this.elements.practiceQuestionList.querySelectorAll(".practice-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest("[data-delete-pid]");
        if (deleteBtn) {
          e.stopPropagation();
          const pid = deleteBtn.getAttribute("data-delete-pid");
          if (confirm("Apakah Anda yakin ingin menghapus soal latihan ini dari bank soal?")) {
            this.customStore.deleteQuestion(pid);
            NotificationToast.show("Soal berhasil dihapus.", "info");
            this.renderPracticeQuestionList();
            const remaining = this.customStore.getAll();
            if (remaining.length > 0) this.selectPracticeQuestion(remaining[0].id);
          }
          return;
        }

        const pid = card.getAttribute("data-pid");
        this.selectPracticeQuestion(pid);
      });
    });
  }

  selectPracticeQuestion(questionId) {
    this.activePracticeQuestionId = questionId;
    const q = this.customStore.getById(questionId);
    if (!q) return;

    if (this.elements.practiceActiveIdBadge) this.elements.practiceActiveIdBadge.textContent = q.id;
    if (this.elements.practiceActiveCategoryBadge) this.elements.practiceActiveCategoryBadge.textContent = q.category || "Latihan Mandiri";
    if (this.elements.practiceActiveTopicText) this.elements.practiceActiveTopicText.textContent = q.topic || "Persiapan Ujian";
    if (this.elements.practiceActiveTitle) this.elements.practiceActiveTitle.textContent = q.title;
    if (this.elements.practiceActivePrompt) this.elements.practiceActivePrompt.textContent = q.promptText;

    // KaTeX Formula
    if (this.elements.practiceActiveMathDisplay) {
      if (q.latexEquation) {
        this.renderKaTeX(q.latexEquation, this.elements.practiceActiveMathDisplay, true);
        this.elements.practiceActiveMathDisplay.classList.remove("hidden");
      } else {
        this.elements.practiceActiveMathDisplay.classList.add("hidden");
      }
    }

    // Multimedia: Image
    if (this.elements.practiceMediaImageBox && this.elements.practiceMediaImgTag) {
      if (q.image && q.image.dataUrl) {
        this.elements.practiceMediaImgTag.src = q.image.dataUrl;
        this.elements.practiceMediaImageBox.classList.remove("hidden");
      } else {
        this.elements.practiceMediaImageBox.classList.add("hidden");
      }
    }

    // Multimedia: Audio
    if (this.elements.practiceMediaAudioBox && this.elements.practiceMediaAudioPlayer) {
      if (q.audioNote && (q.audioNote.dataUrl || q.audioNote.url)) {
        this.elements.practiceMediaAudioPlayer.src = q.audioNote.dataUrl || q.audioNote.url;
        this.elements.practiceMediaAudioBox.classList.remove("hidden");
      } else {
        this.elements.practiceMediaAudioPlayer.src = "";
        this.elements.practiceMediaAudioBox.classList.add("hidden");
      }
    }

    // Multimedia: File
    if (this.elements.practiceMediaFileBox && this.elements.practiceMediaFileLink) {
      if (q.fileAttachment && q.fileAttachment.dataUrl) {
        this.elements.practiceMediaFileLink.href = q.fileAttachment.dataUrl;
        this.elements.practiceMediaFileLink.download = q.fileAttachment.name || "lampiran_soal";
        if (this.elements.practiceMediaFileName) this.elements.practiceMediaFileName.textContent = q.fileAttachment.name || "Unduh Dokumen";
        this.elements.practiceMediaFileBox.classList.remove("hidden");
      } else {
        this.elements.practiceMediaFileBox.classList.add("hidden");
      }
    }

    // Update Kunci & Pembahasan
    if (this.elements.practiceStandardAnswerText) {
      this.elements.practiceStandardAnswerText.textContent = `Kunci: ${q.standardAnswer || "-"}`;
    }
    if (this.elements.practiceExplanationText) {
      this.elements.practiceExplanationText.textContent = q.explanation || "Tidak ada pembahasan tambahan.";
    }
    if (this.elements.practiceSolutionBox) {
      this.elements.practiceSolutionBox.classList.add("hidden");
    }
    if (this.elements.practiceOutputCard) {
      this.elements.practiceOutputCard.classList.add("hidden");
    }

    this.renderPracticeQuestionList();
  }

  handleAnalyzePractice() {
    const q = this.customStore.getById(this.activePracticeQuestionId);
    if (!q) {
      NotificationToast.show("Pilih soal latihan terlebih dahulu.", "warning");
      return;
    }

    const studentName = this.elements.practiceStudentName?.value || "Siswa_01";
    const studentSteps = this.elements.practiceStepsInput?.value || "";
    const studentAnswer = this.elements.practiceAnswerInput?.value || "";

    if (!studentSteps.trim() && !studentAnswer.trim() && !this.studentPhotoData && !this.studentVoiceData) {
      NotificationToast.show("Masukkan coretan pengerjaan, jawaban, foto, atau rekaman suara Anda.", "warning");
      return;
    }

    const result = ErrorPatternEngine.analyze({
      studentId: studentName,
      question: q,
      studentAnswer,
      studentSteps,
      media: {
        image: this.studentPhotoData,
        audio: this.studentVoiceData
      }
    });

    this.historyManager.addEntry(result);
    this.updateStatsAndHistory();

    // Render Output Latihan
    if (this.elements.practiceOutputCard) {
      this.elements.practiceOutputCard.classList.remove("hidden");
      if (this.elements.practiceConfidenceBadge) {
        this.elements.practiceConfidenceBadge.textContent = `Keyakinan: ${result.confidenceScore}%`;
      }
      if (this.elements.practiceResultPrimaryError) {
        this.elements.practiceResultPrimaryError.textContent = result.primaryErrorText;
      }
      if (this.elements.practiceResultStatus) {
        const isCorrect = result.primaryErrorCode === "E0";
        this.elements.practiceResultStatus.textContent = isCorrect ? "Sangat Baik (Akurat)" : "Perlu Remediasi";
        this.elements.practiceResultStatus.className = isCorrect ? "text-xs font-bold text-emerald-600 dark:text-emerald-400" : "text-xs font-bold text-amber-600 dark:text-amber-400";
      }
      if (this.elements.practiceResultEvidence) {
        this.elements.practiceResultEvidence.textContent = result.evidence;
      }
      if (this.elements.practiceResultRemediation) {
        this.elements.practiceResultRemediation.textContent = result.remediation;
      }

      this.elements.practiceOutputCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    NotificationToast.show("Analisis pengerjaan latihan selesai!", "success");
  }

  // =========================================================================
  // VOICE RECORDERS & MEDIA UPLOAD
  // =========================================================================
  initVoiceRecorders() {
    // 1. Perekam Suara Siswa pada Pengerjaan Soal
    this.studentVoiceRecorder = new VoiceRecorder({
      onStateChange: ({ isRecording, time }) => {
        if (this.elements.voiceRecordTimer) {
          this.elements.voiceRecordTimer.textContent = VoiceRecorder.formatTime(time);
        }
        if (isRecording) {
          this.elements.btnStartRecordVoice?.classList.add("hidden");
          this.elements.btnStopRecordVoice?.classList.remove("hidden");
          this.elements.btnStopRecordVoice?.classList.add("mic-recording-pulse");
        } else {
          this.elements.btnStartRecordVoice?.classList.remove("hidden");
          this.elements.btnStopRecordVoice?.classList.add("hidden");
          this.elements.btnStopRecordVoice?.classList.remove("mic-recording-pulse");
        }
      },
      onAudioReady: (audioData) => {
        this.studentVoiceData = audioData;
        if (this.elements.studentVoicePlayer && this.elements.studentVoicePlayerBox) {
          this.elements.studentVoicePlayer.src = audioData.url;
          this.elements.studentVoicePlayerBox.classList.remove("hidden");
        }
        NotificationToast.show("Rekaman suara penalaran siswa berhasil disimpan!", "success");
      }
    });

    // 2. Perekam Suara Guru / Pembuat Soal Baru
    this.newQVoiceRecorder = new VoiceRecorder({
      onStateChange: ({ isRecording, time }) => {
        if (this.elements.newQRecordTimer) {
          this.elements.newQRecordTimer.textContent = VoiceRecorder.formatTime(time);
        }
        if (isRecording) {
          this.elements.btnNewQRecordStart?.classList.add("hidden");
          this.elements.btnNewQRecordStop?.classList.remove("hidden");
          this.elements.btnNewQRecordStop?.classList.add("mic-recording-pulse");
        } else {
          this.elements.btnNewQRecordStart?.classList.remove("hidden");
          this.elements.btnNewQRecordStop?.classList.add("hidden");
          this.elements.btnNewQRecordStop?.classList.remove("mic-recording-pulse");
        }
      },
      onAudioReady: (audioData) => {
        this.newQAudio = {
          dataUrl: audioData.base64,
          url: audioData.url,
          duration: audioData.duration,
          name: "Voice_Note_Soal.webm"
        };
        if (this.elements.newQAudioPlayer && this.elements.newQAudioPreviewBox) {
          this.elements.newQAudioPlayer.src = audioData.url;
          this.elements.newQAudioPreviewBox.classList.remove("hidden");
          this.elements.btnNewQRemoveAudio?.classList.remove("hidden");
        }
        NotificationToast.show("Rekaman audio soal berhasil dibuat!", "success");
      }
    });
  }

  // =========================================================================
  // TAB 3: RIWAYAT & STATISTIK
  // =========================================================================
  updateStatsAndHistory() {
    const stats = this.historyManager.getStats();
    const history = this.historyManager.getAll();

    // Update Counter Badges
    if (this.elements.statTotalCount) this.elements.statTotalCount.textContent = stats.total;
    if (this.elements.statE0Count) this.elements.statE0Count.textContent = `${stats.percentages.E0}%`;
    if (this.elements.statE0Sub) this.elements.statE0Sub.textContent = `${stats.counts.E0} data`;
    if (this.elements.statE1Count) this.elements.statE1Count.textContent = `${stats.percentages.E1}%`;
    if (this.elements.statE1Sub) this.elements.statE1Sub.textContent = `${stats.counts.E1} data`;
    if (this.elements.statE2Count) this.elements.statE2Count.textContent = `${stats.percentages.E2}%`;
    if (this.elements.statE2Sub) this.elements.statE2Sub.textContent = `${stats.counts.E2} data`;
    if (this.elements.statE3Count) this.elements.statE3Count.textContent = `${stats.percentages.E3}%`;
    if (this.elements.statE3Sub) this.elements.statE3Sub.textContent = `${stats.counts.E3} data`;
    if (this.elements.statE4Count) this.elements.statE4Count.textContent = `${stats.percentages.E4}%`;
    if (this.elements.statE4Sub) this.elements.statE4Sub.textContent = `${stats.counts.E4} data`;

    // Render Table Body
    if (!this.elements.historyTableBody) return;

    if (history.length === 0) {
      this.elements.historyTableBody.innerHTML = "";
      if (this.elements.historyEmptyState) this.elements.historyEmptyState.classList.remove("hidden");
      return;
    }

    if (this.elements.historyEmptyState) this.elements.historyEmptyState.classList.add("hidden");

    let html = "";
    history.forEach((item) => {
      const isCorrect = item.primaryErrorCode === "E0";
      html += `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <td class="px-3 py-2.5 text-[11px] whitespace-nowrap text-slate-500">${item.timestamp}</td>
          <td class="px-3 py-2.5 font-bold text-slate-900 dark:text-white">${item.studentId}</td>
          <td class="px-3 py-2.5">
            <span class="font-mono font-bold text-blue-600 dark:text-blue-400">${item.questionId}</span>
            <div class="text-[10px] text-slate-400 truncate max-w-[120px]">${item.questionTitle || item.domain}</div>
          </td>
          <td class="px-3 py-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${
              isCorrect ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
            }">
              ${item.primaryError}
            </span>
          </td>
          <td class="px-3 py-2.5 font-mono font-bold">${item.confidence}</td>
          <td class="px-3 py-2.5 text-[11px] max-w-xs">
            <p class="line-clamp-1 text-slate-700 dark:text-slate-300 font-normal">${item.evidence}</p>
          </td>
          <td class="px-3 py-2.5 text-right whitespace-nowrap">
            <button data-del-history="${item.id}" class="text-slate-400 hover:text-rose-500 p-1" title="Hapus Entri Ini">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </td>
        </tr>
      `;
    });

    this.elements.historyTableBody.innerHTML = html;

    this.elements.historyTableBody.querySelectorAll("[data-del-history]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-del-history");
        this.historyManager.deleteEntry(id);
        this.updateStatsAndHistory();
        NotificationToast.show("Entri riwayat dihapus.", "info");
      });
    });
  }

  // =========================================================================
  // KATEX RENDERING HELPER
  // =========================================================================
  renderKaTeX(texString, targetElement, isDisplayMode = false) {
    if (!targetElement) return;
    try {
      if (window.katex && typeof window.katex.render === "function") {
        window.katex.render(texString, targetElement, {
          displayMode: isDisplayMode,
          throwOnError: false
        });
      } else {
        targetElement.textContent = texString;
        setTimeout(() => {
          if (window.katex && typeof window.katex.render === "function") {
            window.katex.render(texString, targetElement, {
              displayMode: isDisplayMode,
              throwOnError: false
            });
          }
        }, 300);
      }
    } catch (e) {
      console.warn("KaTeX rendering error:", e);
      targetElement.textContent = texString;
    }
  }

  // =========================================================================
  // LIGHTBOX MODAL
  // =========================================================================
  openLightbox(imageSrc) {
    if (!this.elements.imageLightboxModal || !this.elements.lightboxImg) return;
    this.elements.lightboxImg.src = imageSrc;
    this.elements.imageLightboxModal.classList.remove("hidden");
  }

  closeLightbox() {
    if (this.elements.imageLightboxModal) {
      this.elements.imageLightboxModal.classList.add("hidden");
    }
  }

  // =========================================================================
  // EVENT LISTENERS BINDING
  // =========================================================================
  bindEvents() {
    // Theme & Tabs
    if (this.elements.themeToggleBtn) this.elements.themeToggleBtn.addEventListener("click", () => this.toggleTheme());
    if (this.elements.tabBtnDiagnostic) this.elements.tabBtnDiagnostic.addEventListener("click", () => this.switchTab("diagnostic"));
    if (this.elements.tabBtnPractice) this.elements.tabBtnPractice.addEventListener("click", () => this.switchTab("practice"));
    if (this.elements.tabBtnHistory) this.elements.tabBtnHistory.addEventListener("click", () => this.switchTab("history"));

    // Guide Modal
    const openGuide = () => this.elements.guideModal?.classList.remove("hidden");
    const closeGuide = () => this.elements.guideModal?.classList.add("hidden");
    if (this.elements.btnOpenGuide) this.elements.btnOpenGuide.addEventListener("click", openGuide);
    if (this.elements.btnCloseGuide) this.elements.btnCloseGuide.addEventListener("click", closeGuide);
    if (this.elements.btnCloseGuide2) this.elements.btnCloseGuide2.addEventListener("click", closeGuide);

    // Tab 1 Events
    if (this.elements.presetApplyBtn) {
      this.elements.presetApplyBtn.addEventListener("click", () => {
        const val = this.elements.presetSelect?.value;
        if (val) this.loadPreset(val);
        else NotificationToast.show("Silakan pilih salah satu contoh simulasi.", "warning");
      });
    }
    if (this.elements.presetSelect) {
      this.elements.presetSelect.addEventListener("change", (e) => {
        if (e.target.value) this.loadPreset(e.target.value);
      });
    }
    if (this.elements.btnAnalyze) this.elements.btnAnalyze.addEventListener("click", () => this.handleAnalysis());
    if (this.elements.btnReset) this.elements.btnReset.addEventListener("click", () => this.handleResetForm());
    if (this.elements.btnCopyOutput) this.elements.btnCopyOutput.addEventListener("click", () => this.handleCopyOutput());

    // Tab 2: Pengerjaan Latihan & Foto / Audio
    if (this.elements.studentPhotoDropzone && this.elements.inputStudentPhoto) {
      this.elements.studentPhotoDropzone.addEventListener("click", () => this.elements.inputStudentPhoto.click());
      this.elements.inputStudentPhoto.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          const dataUrl = await MediaManager.readFileAsDataURL(file);
          this.studentPhotoData = { name: file.name, dataUrl, size: file.size };
          if (this.elements.studentPhotoImg && this.elements.studentPhotoPreviewBox) {
            this.elements.studentPhotoImg.src = dataUrl;
            this.elements.studentPhotoPreviewBox.classList.remove("hidden");
            this.elements.studentPhotoDropzone.classList.add("hidden");
            this.elements.btnRemoveStudentPhoto?.classList.remove("hidden");
          }
          NotificationToast.show("Foto coretan siswa berhasil diunggah!", "success");
        }
      });
    }

    if (this.elements.btnRemoveStudentPhoto) {
      this.elements.btnRemoveStudentPhoto.addEventListener("click", () => {
        this.studentPhotoData = null;
        if (this.elements.inputStudentPhoto) this.elements.inputStudentPhoto.value = "";
        this.elements.studentPhotoPreviewBox?.classList.add("hidden");
        this.elements.studentPhotoDropzone?.classList.remove("hidden");
        this.elements.btnRemoveStudentPhoto.classList.add("hidden");
      });
    }

    // Voice Recorder Pengerjaan Siswa
    if (this.elements.btnStartRecordVoice) {
      this.elements.btnStartRecordVoice.addEventListener("click", async () => {
        try {
          await this.studentVoiceRecorder.startRecording();
          NotificationToast.show("Merekam suara penalaran siswa...", "info");
        } catch (err) {
          NotificationToast.show(err.message, "error");
        }
      });
    }

    if (this.elements.btnStopRecordVoice) {
      this.elements.btnStopRecordVoice.addEventListener("click", () => {
        this.studentVoiceRecorder.stopRecording();
      });
    }

    if (this.elements.btnDeleteVoice) {
      this.elements.btnDeleteVoice.addEventListener("click", () => {
        this.studentVoiceData = null;
        if (this.elements.studentVoicePlayer) this.elements.studentVoicePlayer.src = "";
        this.elements.studentVoicePlayerBox?.classList.add("hidden");
        if (this.elements.voiceRecordTimer) this.elements.voiceRecordTimer.textContent = "00:00";
        NotificationToast.show("Rekaman suara dihapus.", "info");
      });
    }

    if (this.elements.btnAnalyzePractice) {
      this.elements.btnAnalyzePractice.addEventListener("click", () => this.handleAnalyzePractice());
    }

    if (this.elements.btnTogglePracticeSolution) {
      this.elements.btnTogglePracticeSolution.addEventListener("click", () => {
        if (this.elements.practiceSolutionBox) {
          this.elements.practiceSolutionBox.classList.toggle("hidden");
        }
      });
    }

    // Practice Media Image Zoom Click
    if (this.elements.practiceMediaImagePreview) {
      this.elements.practiceMediaImagePreview.addEventListener("click", () => {
        if (this.elements.practiceMediaImgTag?.src) {
          this.openLightbox(this.elements.practiceMediaImgTag.src);
        }
      });
    }
    if (this.elements.studentPhotoPreviewBox) {
      this.elements.studentPhotoPreviewBox.addEventListener("click", () => {
        if (this.elements.studentPhotoImg?.src) {
          this.openLightbox(this.elements.studentPhotoImg.src);
        }
      });
    }
    if (this.elements.btnCloseLightbox) {
      this.elements.btnCloseLightbox.addEventListener("click", () => this.closeLightbox());
    }

    // Bank Soal Export & Import
    if (this.elements.btnExportBankJson) {
      this.elements.btnExportBankJson.addEventListener("click", () => {
        this.customStore.exportToJSON();
        NotificationToast.show("Bank Soal berhasil diekspor ke file JSON!", "success");
      });
    }

    if (this.elements.inputImportBankJson) {
      this.elements.inputImportBankJson.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const res = this.customStore.importFromJSON(event.target.result);
            if (res.success) {
              NotificationToast.show(`Berhasil mengimpor ${res.count} soal ke Bank Soal!`, "success");
              this.renderPracticeQuestionList();
              const allQ = this.customStore.getAll();
              if (allQ.length > 0) this.selectPracticeQuestion(allQ[0].id);
            } else {
              NotificationToast.show(res.message, "error");
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Modal Tambah Soal
    if (this.elements.btnOpenCreateModal) {
      this.elements.btnOpenCreateModal.addEventListener("click", () => {
        this.elements.createQuestionModal?.classList.remove("hidden");
      });
    }

    const closeCreateModal = () => {
      this.elements.createQuestionModal?.classList.add("hidden");
    };
    if (this.elements.btnCloseCreateModal) this.elements.btnCloseCreateModal.addEventListener("click", closeCreateModal);
    if (this.elements.btnCancelCreateQ) this.elements.btnCancelCreateQ.addEventListener("click", closeCreateModal);

    // Live KaTeX Preview in Create Modal
    if (this.elements.newQLatex) {
      this.elements.newQLatex.addEventListener("input", (e) => {
        const val = e.target.value.trim();
        if (val && this.elements.newQLatexPreview) {
          this.renderKaTeX(val, this.elements.newQLatexPreview, true);
          this.elements.newQLatexPreview.classList.remove("hidden");
        } else {
          this.elements.newQLatexPreview?.classList.add("hidden");
        }
      });
    }

    // Modal Image Upload
    if (this.elements.newQImageDropzone && this.elements.newQImageInput) {
      this.elements.newQImageDropzone.addEventListener("click", () => this.elements.newQImageInput.click());
      this.elements.newQImageInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          const dataUrl = await MediaManager.readFileAsDataURL(file);
          this.newQImage = { name: file.name, dataUrl, size: file.size };
          if (this.elements.newQImageTag && this.elements.newQImagePreviewBox) {
            this.elements.newQImageTag.src = dataUrl;
            this.elements.newQImagePreviewBox.classList.remove("hidden");
            this.elements.newQImageDropzone.classList.add("hidden");
            this.elements.btnRemoveNewQImage?.classList.remove("hidden");
          }
        }
      });
    }
    if (this.elements.btnRemoveNewQImage) {
      this.elements.btnRemoveNewQImage.addEventListener("click", () => {
        this.newQImage = null;
        if (this.elements.newQImageInput) this.elements.newQImageInput.value = "";
        this.elements.newQImagePreviewBox?.classList.add("hidden");
        this.elements.newQImageDropzone?.classList.remove("hidden");
        this.elements.btnRemoveNewQImage.classList.add("hidden");
      });
    }

    // Modal File Upload
    if (this.elements.newQFileDropzone && this.elements.newQFileInput) {
      this.elements.newQFileDropzone.addEventListener("click", () => this.elements.newQFileInput.click());
      this.elements.newQFileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          const processed = await MediaManager.processAttachmentFile(file);
          this.newQFile = processed;
          if (this.elements.newQFileNameLabel) {
            this.elements.newQFileNameLabel.textContent = `File Terpilih: ${file.name} (${MediaManager.formatFileSize(file.size)})`;
          }
          this.elements.btnRemoveNewQFile?.classList.remove("hidden");
        }
      });
    }
    if (this.elements.btnRemoveNewQFile) {
      this.elements.btnRemoveNewQFile.addEventListener("click", () => {
        this.newQFile = null;
        if (this.elements.newQFileInput) this.elements.newQFileInput.value = "";
        if (this.elements.newQFileNameLabel) this.elements.newQFileNameLabel.textContent = "Pilih File Dokumen Pendukung";
        this.elements.btnRemoveNewQFile.classList.add("hidden");
      });
    }

    // Modal Voice Recorder
    if (this.elements.btnNewQRecordStart) {
      this.elements.btnNewQRecordStart.addEventListener("click", async () => {
        try {
          await this.newQVoiceRecorder.startRecording();
        } catch (err) {
          NotificationToast.show(err.message, "error");
        }
      });
    }
    if (this.elements.btnNewQRecordStop) {
      this.elements.btnNewQRecordStop.addEventListener("click", () => {
        this.newQVoiceRecorder.stopRecording();
      });
    }
    if (this.elements.newQAudioUpload) {
      this.elements.newQAudioUpload.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (file) {
          const dataUrl = await MediaManager.readFileAsDataURL(file);
          this.newQAudio = { dataUrl, url: dataUrl, name: file.name, duration: 0 };
          if (this.elements.newQAudioPlayer && this.elements.newQAudioPreviewBox) {
            this.elements.newQAudioPlayer.src = dataUrl;
            this.elements.newQAudioPreviewBox.classList.remove("hidden");
            this.elements.btnNewQRemoveAudio?.classList.remove("hidden");
          }
        }
      });
    }
    if (this.elements.btnNewQRemoveAudio) {
      this.elements.btnNewQRemoveAudio.addEventListener("click", () => {
        this.newQAudio = null;
        if (this.elements.newQAudioPlayer) this.elements.newQAudioPlayer.src = "";
        this.elements.newQAudioPreviewBox?.classList.add("hidden");
        this.elements.btnNewQRemoveAudio.classList.add("hidden");
        if (this.elements.newQRecordTimer) this.elements.newQRecordTimer.textContent = "00:00";
      });
    }

    // Form Submit Create Question
    if (this.elements.createQuestionForm) {
      this.elements.createQuestionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = this.elements.newQTitle?.value.trim();
        const topic = this.elements.newQTopic?.value.trim();
        const promptText = this.elements.newQPrompt?.value.trim();
        const latexEquation = this.elements.newQLatex?.value.trim();
        const standardAnswer = this.elements.newQAnswer?.value.trim();
        const explanation = this.elements.newQExplanation?.value.trim();

        if (!title || !promptText || !standardAnswer) {
          NotificationToast.show("Mohon isi judul, deskripsi soal, dan kunci jawaban.", "warning");
          return;
        }

        const newQ = this.customStore.addQuestion({
          title,
          topic,
          category: topic,
          promptText,
          latexEquation,
          standardAnswer,
          explanation,
          image: this.newQImage,
          fileAttachment: this.newQFile,
          audioNote: this.newQAudio
        });

        NotificationToast.show("Soal latihan baru berhasil ditambahkan ke Bank Soal!", "success");
        this.elements.createQuestionForm.reset();
        this.newQImage = null;
        this.newQFile = null;
        this.newQAudio = null;
        this.elements.newQImagePreviewBox?.classList.add("hidden");
        this.elements.newQImageDropzone?.classList.remove("hidden");
        this.elements.newQAudioPreviewBox?.classList.add("hidden");
        closeCreateModal();

        this.renderPracticeQuestionList();
        this.selectPracticeQuestion(newQ.id);
      });
    }

    // Tab 3 CSV & Clear
    if (this.elements.btnExportCsvTab) {
      this.elements.btnExportCsvTab.addEventListener("click", () => {
        const res = this.historyManager.exportToCSV();
        if (res.success) NotificationToast.show(`Riwayat (${res.count} data) berhasil diekspor ke CSV!`, "success");
        else NotificationToast.show(res.message, "warning");
      });
    }

    if (this.elements.btnClearHistory) {
      this.elements.btnClearHistory.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin mengosongkan seluruh riwayat diagnosis?")) {
          this.historyManager.clear();
          this.updateStatsAndHistory();
          NotificationToast.show("Riwayat diagnostik berhasil dikosongkan.", "info");
        }
      });
    }
  }
}

// Inisialisasi otomatis saat dokumen siap
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.epeApp = new EpeApp();
    window.epeApp.init();
  });
} else {
  window.epeApp = new EpeApp();
  window.epeApp.init();
}
