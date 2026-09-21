/**
 * app.js - Controller Utama Error Pattern Engine (EPE) V2
 * Menghubungkan 3D Learning Cubes, Radial Theme Selector, Error Profile,
 * Mode Diagnostik Baku, Bank Latihan Multimedia, dan Mode Riset Pakar.
 */

import { QUESTIONS, DOMAINS } from "./data/questions.js";
import { SAMPLE_PRESETS } from "./data/samplePresets.js";
import { CustomQuestionStore } from "./data/customQuestionStore.js";
import { ErrorPatternEngine } from "./engine/epeEngine.js";
import { MathToolbar } from "./ui/mathToolbar.js";
import { HistoryManager } from "./ui/historyManager.js";
import { NotificationToast } from "./ui/notification.js";
import { MediaManager, VoiceRecorder } from "./ui/mediaManager.js";
import { syncAllHistoryToSupabase, exportCloudDataToCSV } from "./data/supabaseClient.js";

// Modul Baru EPE V2
import { CubeStore, CUBE_STATES } from "./data/cubeStore.js";
import { IsometricCubeEngine } from "./ui/cubeEngine.js";
import { ThemeManager } from "./ui/themeManager.js";
import { MotivationManager } from "./ui/motivationManager.js";
import { ErrorProfileManager } from "./ui/errorProfile.js";
import { AiOrbEngine } from "./ui/aiOrbEngine.js";
import { AiAgentManager } from "./ui/aiAgentManager.js";
import { TransitionManager } from "./ui/transitionManager.js";
import { UniverseBackground } from "./ui/universeBackground.js";
import { TornadoEngine } from "./ui/tornadoEngine.js";
import { AvatarEngine } from "./avatar/avatarEngine.js";
import { AvatarLab } from "./avatar/avatarLab.js";
import { CubicWallet } from "./economy/cubicWallet.js";
import { CubicRewards } from "./economy/cubicRewards.js";
import { AchievementEngine } from "./achievements/achievementEngine.js";

// EPE V2.2 Research Measurement Modules
import { AssessmentStore } from "./research/assessmentStore.js";
import { AssessmentUI } from "./research/assessmentUI.js";
import { ResearchAnalytics } from "./research/researchAnalytics.js";
import { ResearchExport } from "./research/researchExport.js";

// EPE V3 Multimodal & Profile Customization Modules
import { ProfileManager } from "./data/profileManager.js";
import { syncAllAssessmentsToSupabase } from "./data/supabaseClient.js";
import { MultimodalInputUI } from "./multimodal/multimodalInputUI.js";
import { HandwritingStepReconstructor } from "./multimodal/handwritingStepReconstructor.js";
import { VisionProvider } from "./multimodal/visionProvider.js";
import { QuestionDocument } from "./multimodal/questionDocument.js";


class EpeAppV2 {
  constructor() {
    this.questions = QUESTIONS;
    this.domains = DOMAINS;
    this.presets = SAMPLE_PRESETS;
    this.historyManager = new HistoryManager();
    this.customStore = new CustomQuestionStore();
    this.cubeStore = new CubeStore();
    this.assessmentUI = new AssessmentUI(this);

    // AI Companion, 3D Orb & Universe Background
    this.aiOrbEngine = null;
    this.aiAgentManager = null;
    this.universeBackground = null;

    // State Navigasi ('dashboard' | 'diagnostic' | 'practice' | 'error-profile' | 'research')
    this.activeTab = "dashboard";
    this.currentMode = "student"; // 'student' | 'research'

    // State Diagnostik Baku
    this.activeQuestionId = "Q1";
    this.activeDomainFilter = "ALL";
    this.latestResult = null;
    this.remediationTargetQuestionId = null;

    // State Latihan Mandiri
    this.activePracticeQuestionId = null;
    this.studentPhotoData = null;
    this.studentVoiceData = null;
    this.studentVoiceRecorder = null;

    // State Modal Tambah Soal
    this.newQImage = null;
    this.newQFile = null;
    this.newQAudio = null;
    this.newQVoiceRecorder = null;

    // Engines & Managers
    this.themeManager = null;
    this.cubeEngine = null;
    this.motivationManager = null;
    this.errorProfileManager = null;
    this.transitionManager = null;
    this.avatarLab = null;

    this.elements = {};
  }

  init() {
    this.cacheElements();

    // 0. Inisialisasi Universe Cosmic Background Interaktif
    try {
      this.universeBackground = new UniverseBackground({ canvasId: "universe-canvas" });
    } catch (e) {
      console.warn("Gagal inisialisasi UniverseBackground:", e);
    }

    // 0b. Inisialisasi Transition Manager (Efek Gelombang & Gelembung)
    this.transitionManager = new TransitionManager();

    // 1. Inisialisasi Theme Manager & Radial Color Menu
    this.themeManager = new ThemeManager({
      onThemeChange: (palette) => {
        if (this.cubeEngine) {
          this.cubeEngine.setThemeColors({
            accent: palette.accent,
            accentGlow: palette.accentGlow
          });
        }
        if (this.aiOrbEngine) {
          this.aiOrbEngine.setColor(palette.accent);
        }
      }
    });

    // 1b. Inisialisasi 3D AI Orb Engine & AI Agent Manager
    this.initAiOrbAndAgent();

    // 2. Inisialisasi 3D Isometric Cube Engine
    this.initCubeEngine();

    // 3. Inisialisasi Motivation Layer
    this.motivationManager = new MotivationManager({
      cubeStore: this.cubeStore,
      cubeEngine: this.cubeEngine,
      onNavigateQuestion: (qid) => {
        this.selectQuestion(qid);
        this.switchTab("diagnostic");
      },
      onStartRemediation: (errCode, domainId) => {
        this.startAdaptiveRemediation(errCode, domainId);
      }
    });

    // 4. Inisialisasi Error Profile Manager
    this.errorProfileManager = new ErrorProfileManager({
      historyManager: this.historyManager,
      cubeStore: this.cubeStore,
      onStartRemediation: (errCode, domainId) => {
        this.startAdaptiveRemediation(errCode, domainId);
      }
    });

    // 5. Inisialisasi Komponen Diagnostik Baku (3D Tornado Engine)
    try {
      this.initTornadoEngine();
      this.renderTornadoFilters();
      this.renderPresetSelector();
      this.renderMathToolbar();
      this.selectQuestion(this.activeQuestionId);
      this.renderRecentQuestions();
    } catch (err) {
      console.warn("Peringatan inisialisasi Tornado Engine:", err);
    }

    // 6. Inisialisasi Latihan Mandiri & Voice Recorders
    try {
      this.initPracticeMode();
      this.initVoiceRecorders();
    } catch (err) {
      console.warn("Peringatan inisialisasi Practice Mode:", err);
    }

    // 6b. Inisialisasi EPE V2.1 Avatar & Cubic Economy System
    try {
      this.initAvatarAndEconomy();
    } catch (err) {
      console.warn("Peringatan inisialisasi Avatar & Economy:", err);
    }

    // 6c. Inisialisasi EPE V3 Profil Siswa & Multimodal Inputs
    try {
      ProfileManager.init();
      this.initMultimodalInputs();
    } catch (err) {
      console.warn("Peringatan inisialisasi Profil & Multimodal:", err);
    }

    // 6d. Inisialisasi Kualitas Grafis & Mode Anti-Lag
    try {
      this.initPerformanceMode();
    } catch (err) {
      console.warn("Peringatan inisialisasi Performance Mode:", err);
    }

    // 7. Binding Event Handlers
    this.bindEvents();

    // 8. Update Statistik Awal & Status Guru
    this.updateStatsAndHistory();
    this.updateDashboardRecentSummary();
    this.updateEducatorStatusUI();

    console.log("EPE V2.1 (Error Pattern Engine, Avatar & Cubic Economy) Berhasil Diinisialisasi.");
  }

  cacheElements() {
    this.elements = {
      // Navigation Tabs
      tabBtnDashboard: document.getElementById("tab-btn-dashboard"),
      tabBtnPretest: document.getElementById("tab-btn-pretest"),
      tabBtnDiagnostic: document.getElementById("tab-btn-diagnostic"),
      tabBtnPractice: document.getElementById("tab-btn-practice"),
      tabBtnPosttest: document.getElementById("tab-btn-posttest"),
      tabBtnErrorProfile: document.getElementById("tab-btn-error-profile"),
      tabBtnResearch: document.getElementById("tab-btn-research"),
      navLockBadge: document.getElementById("nav-lock-badge"),
      btnLockResearch: document.getElementById("btn-lock-research"),
      btnChangeEducatorPin: document.getElementById("btn-change-educator-pin"),
      educatorAuthModal: document.getElementById("educator-auth-modal"),
      btnCloseEducatorAuth: document.getElementById("btn-close-educator-auth"),
      btnCancelEducatorAuth: document.getElementById("btn-cancel-educator-auth"),
      btnSubmitEducatorAuth: document.getElementById("btn-submit-educator-auth"),
      educatorPinInput: document.getElementById("educator-pin-input"),
      btnTogglePinVisibility: document.getElementById("btn-toggle-pin-visibility"),
      educatorPinError: document.getElementById("educator-pin-error"),
      changePinModal: document.getElementById("change-pin-modal"),
      btnCloseChangePin: document.getElementById("btn-close-change-pin"),
      btnCancelChangePin: document.getElementById("btn-cancel-change-pin"),
      btnSaveNewPin: document.getElementById("btn-save-new-pin"),
      inputCurrentPin: document.getElementById("input-current-pin"),
      inputNewPin: document.getElementById("input-new-pin"),
      inputConfirmPin: document.getElementById("input-confirm-pin"),
      changePinError: document.getElementById("change-pin-error"),

      // Section Containers
      sectionDashboard: document.getElementById("section-dashboard-mode"),
      sectionPretest: document.getElementById("section-pretest-mode"),
      sectionDiagnostic: document.getElementById("section-diagnostic-mode"),
      sectionPractice: document.getElementById("section-practice-mode"),
      sectionPosttest: document.getElementById("section-posttest-mode"),
      sectionErrorProfile: document.getElementById("section-error-profile"),
      sectionResearch: document.getElementById("section-research-mode"),

      // Pipeline Buttons
      btnPipelinePretest: document.getElementById("btn-pipeline-pretest"),
      btnPipelineDiagnostic: document.getElementById("btn-pipeline-diagnostic"),
      btnPipelineRemediation: document.getElementById("btn-pipeline-remediation"),
      btnPipelinePosttest: document.getElementById("btn-pipeline-posttest"),

      // Research CSV Export Suite & Comparison
      btnExportPretestCsv: document.getElementById("btn-export-pretest-csv"),
      btnExportDiagCsv: document.getElementById("btn-export-diag-csv"),
      btnExportRemCsv: document.getElementById("btn-export-rem-csv"),
      btnExportPosttestCsv: document.getElementById("btn-export-posttest-csv"),
      btnExportCombinedCsv: document.getElementById("btn-export-combined-csv"),
      researchComparisonContainer: document.getElementById("research-comparison-container"),

      // Mode Switcher & Tools
      btnModeStudent: document.getElementById("btn-mode-student"),
      btnModeResearch: document.getElementById("btn-mode-research"),
      btnModeStudentM: document.getElementById("btn-mode-student-m"),
      btnModeResearchM: document.getElementById("btn-mode-research-m"),

      // Graphics Quality & Performance Engine Control
      btnToggleGraphics: document.getElementById("btn-toggle-graphics"),
      graphicsIconSvg: document.getElementById("graphics-icon-svg"),
      graphicsLabel: document.getElementById("graphics-label"),
      graphicsBadge: document.getElementById("graphics-badge"),

      // Guide Modal
      btnOpenGuide: document.getElementById("btn-open-guide"),
      btnCloseGuide: document.getElementById("btn-close-guide"),
      btnCloseGuide2: document.getElementById("btn-close-guide-2"),
      guideModal: document.getElementById("guide-modal"),

      // Dashboard Elements
      dashStudentName: document.getElementById("dash-student-name"),
      dashRecentEvidence: document.getElementById("dash-recent-evidence"),
      dashRecentQBadge: document.getElementById("dash-recent-q-badge"),
      dashRecentRemedyBox: document.getElementById("dash-recent-remedy-box"),
      dashRecentRemedyText: document.getElementById("dash-recent-remedy-text"),
      dashBtnOpenDiagnostic: document.getElementById("dash-btn-open-diagnostic"),
      dashBtnOpenPractice: document.getElementById("dash-btn-open-practice"),
      dashBtnContinueDiag: document.getElementById("btn-continue-diagnostic"),
      btnOpenCollection: document.getElementById("btn-open-collection"),
      cubeTooltip: document.getElementById("cube-tooltip"),

      // Tab 1: Diagnostik Baku
      domainFilterContainer: document.getElementById("domain-filter-container"),
      questionGridContainer: document.getElementById("question-grid-container"),
      tornadoFilterContainer: document.getElementById("tornado-filter-container"),
      tornadoScene: document.getElementById("tornado-scene"),
      tornadoVortex: document.getElementById("tornado-vortex"),
      tornadoSearchInput: document.getElementById("tornado-search-input"),
      tornadoRecentContainer: document.getElementById("tornado-recent-container"),
      tornadoViewAllBtn: document.getElementById("tornado-view-all-btn"),
      tornadoBackBtn: document.getElementById("tornado-back-btn"),
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
      confidenceBar: document.getElementById("confidence-bar"),
      confidenceScoreText: document.getElementById("confidence-score-text"),
      primaryTaxonomyBadge: document.getElementById("primary-taxonomy-badge"),
      secondaryTaxonomyBadge: document.getElementById("secondary-taxonomy-badge"),
      evidenceText: document.getElementById("evidence-text"),
      remediationText: document.getElementById("remediation-text"),
      btnStartRemediationFromDiag: document.getElementById("btn-start-remediation-from-diag"),
      btnViewCubeOnDash: document.getElementById("btn-view-cube-on-dash"),
      stepReconstructionCardContainer: document.getElementById("step-reconstruction-card-container"),

      // Tab 2: Bank Latihan & Ujian
      practiceQuestionList: document.getElementById("practice-question-list"),
      practiceQuestionCountBadge: document.getElementById("practice-question-count-badge"),
      btnOpenCreateModal: document.getElementById("btn-open-create-question-modal"),
      btnExportBankJson: document.getElementById("btn-export-bank-json"),
      inputImportBankJson: document.getElementById("input-import-bank-json"),
      inputImportWorksheetImage: document.getElementById("input-import-worksheet-image"),
      worksheetImportModal: document.getElementById("worksheet-import-modal"),
      btnCloseWorksheetModal: document.getElementById("btn-close-worksheet-modal"),
      worksheetImportLoading: document.getElementById("worksheet-import-loading"),
      worksheetImportContent: document.getElementById("worksheet-import-content"),
      worksheetQuestionsContainer: document.getElementById("worksheet-questions-container"),
      worksheetDetectedCount: document.getElementById("worksheet-detected-count"),
      btnPublishWorksheetQuestions: document.getElementById("btn-publish-worksheet-questions"),
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

      // Tab 4: Riset & Statistik Pakar
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
      outputPlainText: document.getElementById("output-plain-text"),
      btnCopyResearchText: document.getElementById("btn-copy-research-text"),
      historyTableBody: document.getElementById("history-table-body"),
      historyEmptyState: document.getElementById("history-empty-state"),
      btnSyncSupabase: document.getElementById("btn-sync-supabase"),
      btnSyncAssessmentsSupabase: document.getElementById("btn-sync-assessments-supabase"),
      btnExportCloudCsv: document.getElementById("btn-export-cloud-csv"),
      btnExportCsvTab: document.getElementById("btn-export-csv-tab"),
      btnImportHistoryCsv: document.getElementById("btn-import-history-csv"),
      inputImportHistoryCsv: document.getElementById("input-import-history-csv"),
      btnPreloadResearchSample: document.getElementById("btn-preload-research-sample"),
      btnClearHistory: document.getElementById("btn-clear-history"),

      // Modal Tambah Soal
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

      // Lightbox
      imageLightboxModal: document.getElementById("image-lightbox-modal"),
      lightboxImg: document.getElementById("lightbox-img"),
      btnCloseLightbox: document.getElementById("btn-close-lightbox")
    };
  }

  // =========================================================================
  // 3D ISOMETRIC CUBES ENGINE INITIALIZATION
  // =========================================================================
  initCubeEngine() {
    this.cubeEngine = new IsometricCubeEngine({
      canvasId: "cube-monument-canvas",
      cubeStore: this.cubeStore,
      onCubeClick: (cubeData) => {
        if (!cubeData) return;
        this.selectQuestion(cubeData.questionId);
        this.switchTab("diagnostic");
        NotificationToast.show(`Membuka soal ${cubeData.questionId} (${cubeData.domainId})`, "info");
      },
      onCubeHover: (cubeData, pos) => {
        const tooltip = this.elements.cubeTooltip;
        if (!tooltip) return;

        if (!cubeData) {
          tooltip.classList.add("opacity-0");
          setTimeout(() => tooltip.classList.add("hidden"), 150);
          return;
        }

        const stateLabels = {
          LOCKED: "🔒 Belum Dikerjakan",
          DIAGNOSED_E0: "✨ Akurat (E0)",
          DIAGNOSED_ERROR: `⚠️ Pola: ${cubeData.errorCode || "Perlu Perhatian"}`,
          REMEDIATED: "💎 Kristal (Telah Diremediasi)",
          VERIFIED: "👑 Terverifikasi"
        };

        tooltip.innerHTML = `
          <div class="font-mono font-bold text-blue-400 mb-0.5">${cubeData.questionId} · ${cubeData.domainId}</div>
          <div class="font-bold text-white text-xs line-clamp-1">${cubeData.title}</div>
          <div class="text-[11px] text-slate-300 mt-1">${stateLabels[cubeData.state] || cubeData.state}</div>
        `;

        tooltip.style.left = `${pos.clientX + 14}px`;
        tooltip.style.top = `${pos.clientY - 10}px`;
        tooltip.classList.remove("hidden");
        requestAnimationFrame(() => tooltip.classList.remove("opacity-0"));
      }
    });
  }

  // =========================================================================
  // TAB & MODE NAVIGATION
  // =========================================================================
  switchTab(tabName, event = null) {
    if (tabName === "research" && !this.isEducatorUnlocked()) {
      this.openEducatorAuthModal("research");
      return;
    }

    this.activeTab = tabName;

    // Trigger Efek Gelombang Energi (Wave) & Gelembung Melayang (Bubbles)
    if (this.transitionManager) {
      let originX = undefined;
      let originY = undefined;
      if (event) {
        if (typeof event.clientX === "number" && typeof event.clientY === "number" && (event.clientX !== 0 || event.clientY !== 0)) {
          originX = event.clientX;
          originY = event.clientY;
        } else if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === "function") {
          const rect = event.currentTarget.getBoundingClientRect();
          originX = rect.left + rect.width / 2;
          originY = rect.top + rect.height / 2;
        }
      }
      const accentColor = this.themeManager?.currentPalette
        ? (this.themeManager.THEME_PALETTES?.[this.themeManager.currentPalette]?.accent || "#3b82f6")
        : "#3b82f6";
      this.transitionManager.triggerWaveAndBubble(originX, originY, accentColor);
    }

    // Reset button states
    const navButtons = [
      this.elements.tabBtnDashboard,
      this.elements.tabBtnPretest,
      this.elements.tabBtnDiagnostic,
      this.elements.tabBtnPractice,
      this.elements.tabBtnPosttest,
      this.elements.tabBtnErrorProfile,
      this.elements.tabBtnResearch
    ];
    navButtons.forEach((btn) => btn?.classList.remove("active"));
    if (tabName !== "diagnostic") this.tornadoEngine?.pause();

    // Hide all sections
    const sections = [
      this.elements.sectionDashboard,
      this.elements.sectionPretest,
      this.elements.sectionDiagnostic,
      this.elements.sectionPractice,
      this.elements.sectionPosttest,
      this.elements.sectionErrorProfile,
      this.elements.sectionResearch
    ];
    sections.forEach((sec) => sec?.classList.add("hidden"));

    if (tabName === "dashboard") {
      this.elements.tabBtnDashboard?.classList.add("active");
      this.elements.sectionDashboard?.classList.remove("hidden");
      this.motivationManager?.updateDashboardWidgets();
      this.updateDashboardRecentSummary();
      this.updateResearchFlowPipeline();
      setTimeout(() => {
        if (this.aiOrbEngine) this.aiOrbEngine.resumeAndResize();
      }, 50);
      if (this.cubeEngine) {
        this.cubeEngine.resize();
        if (this.pendingDropCubeId) {
          const qToDrop = this.pendingDropCubeId;
          this.pendingDropCubeId = null;
          setTimeout(() => {
            if (this.cubeEngine) this.cubeEngine.triggerDropAnimation(qToDrop);
          }, 180);
        }
      }
    } else if (tabName === "pretest") {
      this.elements.tabBtnPretest?.classList.add("active");
      this.elements.sectionPretest?.classList.remove("hidden");
      this.assessmentUI?.openPreTest();
    } else if (tabName === "diagnostic") {
      this.elements.tabBtnDiagnostic?.classList.add("active");
      this.elements.sectionDiagnostic?.classList.remove("hidden");
      this.tornadoEngine?.resume();
      setTimeout(() => {
        this.tornadoEngine?.resize();
        this.tornadoEngine?.updateCardStatuses();
      }, 50);
      this.renderRecentQuestions();
    } else if (tabName === "practice") {
      this.elements.tabBtnPractice?.classList.add("active");
      this.elements.sectionPractice?.classList.remove("hidden");
      this.renderPracticeQuestionList();
    } else if (tabName === "posttest") {
      this.elements.tabBtnPosttest?.classList.add("active");
      this.elements.sectionPosttest?.classList.remove("hidden");
      this.assessmentUI?.openPostTest();
    } else if (tabName === "error-profile") {
      this.elements.tabBtnErrorProfile?.classList.add("active");
      this.elements.sectionErrorProfile?.classList.remove("hidden");
      this.errorProfileManager?.render();
    } else if (tabName === "research") {
      this.elements.tabBtnResearch?.classList.add("active");
      this.elements.sectionResearch?.classList.remove("hidden");
      this.updateStatsAndHistory();
      if (this.elements.researchComparisonContainer) {
        ResearchAnalytics.renderResearchModeComparison(this.elements.researchComparisonContainer);
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    this.syncAiContext();
  }

  setMode(mode) {
    if (mode === "research" && !this.isEducatorUnlocked()) {
      this.openEducatorAuthModal("research");
      return;
    }

    this.currentMode = mode;
    [this.elements.btnModeStudent, this.elements.btnModeStudentM].forEach((b) => {
      if (b) b.classList.toggle("active", mode === "student");
    });
    [this.elements.btnModeResearch, this.elements.btnModeResearchM].forEach((b) => {
      if (b) b.classList.toggle("active", mode === "research");
    });

    if (mode === "research") {
      this.switchTab("research");
      NotificationToast.show("Mode Guru Aktif.", "info");
    } else {
      this.switchTab("dashboard");
      NotificationToast.show("Mode Siswa Aktif.", "info");
    }
  }

  // =========================================================================
  // KUALITAS GRAFIS & MODE ANTI-LAG (PERFORMANCE ENGINE)
  // =========================================================================
  initPerformanceMode() {
    const saved = localStorage.getItem("epe_perf_mode") || "normal";
    this.applyPerformanceMode(saved, false);
    if (this.elements.btnToggleGraphics) {
      this.elements.btnToggleGraphics.addEventListener("click", () => {
        const current = localStorage.getItem("epe_perf_mode") || "normal";
        const next = current === "low" ? "normal" : "low";
        this.applyPerformanceMode(next, true);
      });
    }
  }

  applyPerformanceMode(mode, showNotification = false) {
    localStorage.setItem("epe_perf_mode", mode);
    window.__EPE_LOW_PERF__ = (mode === "low");

    if (mode === "low") {
      document.body.classList.add("perf-mode-low");
      if (this.elements.btnToggleGraphics) {
        this.elements.btnToggleGraphics.classList.add("active-low");
        this.elements.btnToggleGraphics.setAttribute("title", "Kualitas Grafis: Mode Ringan / Hemat Daya (Klik untuk Mode Standar)");
        this.elements.btnToggleGraphics.setAttribute("data-perf", "low");
      }
      if (this.elements.graphicsBadge) {
        this.elements.graphicsBadge.textContent = "Ringan";
        this.elements.graphicsBadge.className = "px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 transition-colors";
      }
      if (this.elements.graphicsIconSvg) {
        this.elements.graphicsIconSvg.classList.add("text-amber-500");
      }
      if (showNotification) {
        NotificationToast.show("Mode Efisiensi Grafis Aktif: Animasi & beban render diringankan untuk performa lancar.", "info");
      }
    } else {
      document.body.classList.remove("perf-mode-low");
      if (this.elements.btnToggleGraphics) {
        this.elements.btnToggleGraphics.classList.remove("active-low");
        this.elements.btnToggleGraphics.setAttribute("title", "Kualitas Grafis: Mode Standar (Klik untuk Mode Ringan / Hemat Daya)");
        this.elements.btnToggleGraphics.setAttribute("data-perf", "normal");
      }
      if (this.elements.graphicsBadge) {
        this.elements.graphicsBadge.textContent = "Standar";
        this.elements.graphicsBadge.className = "px-1.5 py-0.2 text-[9px] font-bold rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 transition-colors";
      }
      if (this.elements.graphicsIconSvg) {
        this.elements.graphicsIconSvg.classList.remove("text-amber-500");
      }
      if (showNotification) {
        NotificationToast.show("Mode Grafis Standar Aktif: Seluruh simulasi 3D & efek visual beroperasi optimal.", "info");
      }
    }
  }

  // =========================================================================
  // GURU / EDUCATOR PRIVACY & SECURITY GATE
  // =========================================================================

  isEducatorUnlocked() {
    return sessionStorage.getItem("epe_educator_unlocked") === "true";
  }

  getEducatorPin() {
    const customPin = localStorage.getItem("epe_educator_pin");
    if (!customPin || customPin === "epe2026") {
      return "@EPEMath!";
    }
    return customPin;
  }

  updateEducatorStatusUI() {
    const isUnlocked = this.isEducatorUnlocked();
    if (this.elements.navLockBadge) {
      this.elements.navLockBadge.textContent = isUnlocked ? "🔓" : "🔒";
      this.elements.navLockBadge.title = isUnlocked ? "Sesi Guru Aktif (Terbuka)" : "Memerlukan PIN Pendidik";
    }
  }

  openEducatorAuthModal(targetTab = "research") {
    this.pendingEducatorTab = targetTab;
    if (this.elements.educatorAuthModal) {
      this.elements.educatorAuthModal.classList.remove("hidden");
      if (this.elements.educatorPinInput) {
        this.elements.educatorPinInput.value = "";
        setTimeout(() => this.elements.educatorPinInput?.focus(), 100);
      }
      if (this.elements.educatorPinError) {
        this.elements.educatorPinError.classList.add("hidden");
      }
    }
  }

  closeEducatorAuthModal() {
    if (this.elements.educatorAuthModal) {
      this.elements.educatorAuthModal.classList.add("hidden");
    }
    this.pendingEducatorTab = null;
    this.pendingEducatorAction = null;
  }

  verifyAndUnlockEducator() {
    const enteredPin = (this.elements.educatorPinInput?.value || "").trim();
    const correctPin = this.getEducatorPin();

    if (enteredPin === correctPin) {
      sessionStorage.setItem("epe_educator_unlocked", "true");
      this.updateEducatorStatusUI();
      this.closeEducatorAuthModal();
      NotificationToast.show("Akses Pendidik Terverifikasi! Privasi data siswa terjaga.", "success");
      
      [this.elements.btnModeStudent, this.elements.btnModeStudentM].forEach((b) => b?.classList.remove("active"));
      [this.elements.btnModeResearch, this.elements.btnModeResearchM].forEach((b) => b?.classList.add("active"));
      this.currentMode = "research";

      if (this.pendingEducatorAction) {
        const action = this.pendingEducatorAction;
        this.pendingEducatorAction = null;
        action();
      } else {
        const target = this.pendingEducatorTab || "research";
        this.switchTab(target);
      }
    } else {
      if (this.elements.educatorPinError) {
        this.elements.educatorPinError.textContent = "PIN tidak sesuai. Silakan periksa kembali kata sandi Guru.";
        this.elements.educatorPinError.classList.remove("hidden");
      }
      if (this.elements.educatorPinInput) {
        this.elements.educatorPinInput.classList.add("border-rose-500");
        this.elements.educatorPinInput.focus();
        setTimeout(() => this.elements.educatorPinInput?.classList.remove("border-rose-500"), 1500);
      }
    }
  }

  lockEducatorMode() {
    sessionStorage.removeItem("epe_educator_unlocked");
    this.updateEducatorStatusUI();
    [this.elements.btnModeStudent, this.elements.btnModeStudentM].forEach((b) => b?.classList.add("active"));
    [this.elements.btnModeResearch, this.elements.btnModeResearchM].forEach((b) => b?.classList.remove("active"));
    this.currentMode = "student";
    this.switchTab("dashboard");
    NotificationToast.show("Mode Guru telah dikunci. Privasi data seluruh siswa kini aman.", "info");
  }

  openChangePinModal() {
    if (this.elements.changePinModal) {
      this.elements.changePinModal.classList.remove("hidden");
      if (this.elements.inputCurrentPin) this.elements.inputCurrentPin.value = "";
      if (this.elements.inputNewPin) this.elements.inputNewPin.value = "";
      if (this.elements.inputConfirmPin) this.elements.inputConfirmPin.value = "";
      if (this.elements.changePinError) this.elements.changePinError.classList.add("hidden");
      setTimeout(() => this.elements.inputCurrentPin?.focus(), 100);
    }
  }

  closeChangePinModal() {
    if (this.elements.changePinModal) {
      this.elements.changePinModal.classList.add("hidden");
    }
  }

  saveNewEducatorPin() {
    const currentPin = (this.elements.inputCurrentPin?.value || "").trim();
    const newPin = (this.elements.inputNewPin?.value || "").trim();
    const confirmPin = (this.elements.inputConfirmPin?.value || "").trim();
    const storedPin = this.getEducatorPin();

    const showError = (msg) => {
      if (this.elements.changePinError) {
        this.elements.changePinError.textContent = msg;
        this.elements.changePinError.classList.remove("hidden");
      }
    };

    if (currentPin !== storedPin) {
      showError("PIN saat ini tidak sesuai!");
      return;
    }
    if (newPin.length < 4) {
      showError("PIN baru minimal 4 karakter!");
      return;
    }
    if (newPin !== confirmPin) {
      showError("Konfirmasi PIN baru tidak cocok!");
      return;
    }

    localStorage.setItem("epe_educator_pin", newPin);
    this.closeChangePinModal();
    NotificationToast.show("PIN Akses Guru berhasil diperbarui!", "success");
  }

  requireEducatorAuth(actionCallback) {
    if (this.isEducatorUnlocked()) {
      actionCallback();
    } else {
      this.pendingEducatorAction = actionCallback;
      this.openEducatorAuthModal("research");
    }
  }

  // =========================================================================
  // TAB 1: DIAGNOSTIK BAKU — ORBIT DIAGNOSTIK 3D (24 SOAL PENELITIAN)
  // =========================================================================

  /** Domain icon map */
  _domainIcons = {
    D1: 'π', D2: '∫', D3: 'ƒ', D4: 'Δ', D5: '∑', D6: '⊿'
  };

  initTornadoEngine() {
    this.tornadoEngine = new TornadoEngine({
      sceneId: "tornado-scene",
      canvasId: "tornado-canvas",
      vortexId: "tornado-vortex",
      searchInputId: "tornado-search-input",
      onSelectQuestion: (qid) => {
        this.selectQuestion(qid);
        this._addRecentQuestion(qid);
        this.renderRecentQuestions();
      },
      getCubeStatus: (qid) => {
        const cube = this.cubeStore?.getCube(qid);
        if (!cube) return "unsolved";
        if (cube.state === CUBE_STATES.DIAGNOSED_E0) return "e0";
        if (cube.state === CUBE_STATES.DIAGNOSED_ERROR) return "error";
        if (cube.state === CUBE_STATES.REMEDIATED || cube.state === CUBE_STATES.VERIFIED) return "remediated";
        return "unsolved";
      }
    });

    this.tornadoEngine.init(this.questions, this.activeQuestionId);

    // Search input listener
    this.elements.tornadoSearchInput?.addEventListener("input", (e) => {
      this.tornadoEngine?.setSearchTerm(e.target.value);
    });

    // View all button
    this.elements.tornadoViewAllBtn?.addEventListener("click", () => {
      this.activeDomainFilter = "ALL";
      this.renderTornadoFilters();
      this.tornadoEngine?.setDomainFilter("ALL");
    });

    // Back button (scroll to tornado on mobile)
    this.elements.tornadoBackBtn?.addEventListener("click", () => {
      this.elements.tornadoScene?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  renderTornadoFilters() {
    const container = this.elements.tornadoFilterContainer;
    if (!container) return;

    let html = `<button data-domain="ALL" class="tornado-filter-chip ${this.activeDomainFilter === 'ALL' ? 'active' : ''}">
      <span class="chip-dot" data-domain="ALL" style="background: linear-gradient(135deg, #2563eb, #06b6d4);"></span>
      Semua (24)
    </button>`;

    Object.values(this.domains).forEach((dom) => {
      const isActive = this.activeDomainFilter === dom.id;
      const count = dom.questions.length;
      html += `<button data-domain="${dom.id}" class="tornado-filter-chip ${isActive ? 'active' : ''}">
        <span class="chip-dot" data-domain="${dom.id}"></span>
        ${dom.name}
        <span class="text-[10px] opacity-60">${count}</span>
      </button>`;
    });

    container.innerHTML = html;
    container.querySelectorAll('.tornado-filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        this.activeDomainFilter = e.currentTarget.getAttribute('data-domain');
        this.renderTornadoFilters();
        this.tornadoEngine?.setDomainFilter(this.activeDomainFilter);
      });
    });
  }

  renderTornado() {
    this.tornadoEngine?.updateCardStatuses();
  }

  /** Recent questions tracking */
  _recentQuestions = [];

  _addRecentQuestion(qid) {
    this._recentQuestions = this._recentQuestions.filter(id => id !== qid);
    this._recentQuestions.unshift(qid);
    if (this._recentQuestions.length > 8) this._recentQuestions.pop();
  }

  renderRecentQuestions() {
    const container = this.elements.tornadoRecentContainer;
    if (!container) return;

    const domainColors = {
      D1: '#3b82f6', D2: '#10b981', D3: '#8b5cf6',
      D4: '#f59e0b', D5: '#ec4899', D6: '#06b6d4'
    };

    if (this._recentQuestions.length === 0) {
      // Show default recent (first 5 questions)
      const defaults = this.questions.slice(0, 5).map(q => q.id);
      this._recentQuestions = defaults;
    }

    let html = '';
    this._recentQuestions.forEach((qid) => {
      const q = this.questions.find(item => item.id === qid);
      if (!q) return;
      const color = domainColors[q.domainId] || '#64748b';
      html += `
        <button class="tornado-recent-item" data-qid="${q.id}">
          <span class="recent-icon" style="background: ${color};">${this._domainIcons[q.domainId] || '?'}</span>
          <span>${q.id} - ${q.title.substring(0, 22)}${q.title.length > 22 ? '…' : ''}</span>
          <span class="text-[9px] opacity-50">${q.domainId} · ${q.domainName}</span>
        </button>
      `;
    });

    container.innerHTML = html;
    container.querySelectorAll('[data-qid]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const qid = e.currentTarget.getAttribute('data-qid');
        this.selectQuestion(qid);
        this._addRecentQuestion(qid);
        this.renderTornado();
        this.renderRecentQuestions();
      });
    });
  }

  // Legacy compat wrappers
  renderDomainFilters() { this.renderTornadoFilters(); }
  renderQuestionGrid() { this.renderTornado(); }

  renderPresetSelector() {
    if (!this.elements.presetSelect) return;
    let html = '<option value="">-- Pilih Contoh Simulasi Respon Siswa --</option>';
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

    if (this.elements.qNumberBadge) {
      this.elements.qNumberBadge.textContent = q.id;
      this.elements.qNumberBadge.style.backgroundColor = domain?.color || "#3b82f6";
      this.elements.qNumberBadge.style.color = "#ffffff";
      this.elements.qNumberBadge.style.boxShadow = `0 2px 8px ${domain?.color || "#3b82f6"}55`;
    }
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

    this.tornadoEngine?.selectQuestion(questionId);
    this._addRecentQuestion(questionId);
    this.renderRecentQuestions();
    this.syncAiContext();
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
    const studentId = this.elements.studentIdInput?.value || ProfileManager.getStudentName();
    const studentAnswer = this.elements.studentAnswerInput?.value || "";
    const studentSteps = this.elements.studentStepsInput?.value || "";
    const multimodal = window._activeMultimodalPayload || null;

    if (!studentAnswer.trim() && !studentSteps.trim() && !multimodal) {
      NotificationToast.show("Masukkan langkah pengerjaan atau jawaban siswa terlebih dahulu.", "warning");
      this.elements.studentStepsInput?.focus();
      return;
    }

    // Rekonstruksi multi-langkah coretan jika ada
    let stepRecon = null;
    if (studentSteps.trim()) {
      stepRecon = HandwritingStepReconstructor.reconstruct(studentSteps);
    }

    // Eksekusi core Error Pattern Engine (preserve research logic 100%)
    const result = ErrorPatternEngine.analyze({
      studentId,
      questionId: this.activeQuestionId,
      studentAnswer,
      studentSteps,
      media: multimodal,
      stepReconstruction: stepRecon,
      inputModality: multimodal?.source || "typed",
      multimodalEvidence: multimodal ? {
        multiSignal: multimodal.multiSignal || null,
        confidence: multimodal.confidence || null,
        manifest: multimodal.manifest || null,
        questionDoc: multimodal.questionDoc || null
      } : null
    });

    if (stepRecon) {
      result.stepReconstruction = stepRecon;
    }

    this.latestResult = result;
    this.historyManager.addEntry(result);

    // Render output
    this.renderDiagnosticOutput(result);
    this.updateStatsAndHistory();
    this.updateDashboardRecentSummary(result);

    // Micro-reward sequence: perbarui Learning Cubes
    this.motivationManager?.handleQuestionSubmitted(this.activeQuestionId, result);
    this.pendingDropCubeId = this.activeQuestionId;

    // Refresh visual navigator grid
    this.renderQuestionGrid();

    // EPE V2.1 Process-Based Non-Punitive Reward (+10 ◆) & Milestone Verification
    CubicRewards.rewardDiagnostic(this.activeQuestionId);
    const completedCount = this.cubeStore.getCompletedCount();
    const hasE0 = result.classification?.code === "E0" || result.primaryErrorCode === "E0";
    AchievementEngine.checkMilestones({
      completedQuestionsCount: completedCount,
      completedRemediationsCount: 0,
      hasE0Achievement: hasE0
    });

    // Update AI Context and trigger reactive visual emotion
    this.syncAiContext();
    if (this.aiOrbEngine) {
      if (result.isCorrect) {
        this.aiOrbEngine.setState("celebrate");
        setTimeout(() => this.aiOrbEngine.setState("idle"), 3500);
      } else {
        this.aiOrbEngine.setState("speaking");
        setTimeout(() => this.aiOrbEngine.setState("idle"), 3000);
      }
    }

    // Scroll to output on smaller screens
    if (window.innerWidth < 1024 && this.elements.outputSection) {
      this.elements.outputSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  initAiOrbAndAgent() {
    try {
      this.aiOrbEngine = new AiOrbEngine({
        containerId: "ai-orb-container",
        initialColor: this.themeManager?.currentPalette ? (this.themeManager.THEME_PALETTES?.[this.themeManager.currentPalette]?.accent || "#3b82f6") : "#3b82f6",
        onClick: () => {
          if (this.aiAgentManager) this.aiAgentManager.openDrawer();
        }
      });

      this.aiAgentManager = new AiAgentManager({
        orbEngine: this.aiOrbEngine
      });

      this.syncAiContext();
    } catch (e) {
      console.warn("Gagal inisialisasi AI Orb & Agent:", e);
    }
  }

  initMultimodalInputs() {
    try {
      this.diagnosticMultimodal = new MultimodalInputUI({
        containerId: "diagnostic-multimodal-container",
        targetStepsInputId: "student-steps-input",
        targetAnswerInputId: "student-answer-input",
        contextMode: "diagnostic"
      });

      this.practiceMultimodal = new MultimodalInputUI({
        containerId: "practice-multimodal-container",
        targetStepsInputId: "practice-steps-input",
        targetAnswerInputId: "practice-answer-input",
        contextMode: "practice"
      });
    } catch (e) {
      console.warn("Gagal inisialisasi Multimodal Inputs:", e);
    }
  }

  initAvatarAndEconomy() {
    try {
      this.avatarLab = new AvatarLab();

      // Render Header Mini Avatar
      const headerAvatarBox = document.getElementById("header-avatar-container");
      if (headerAvatarBox) {
        AvatarEngine.renderInto(headerAvatarBox, null, 24);
      }

      // Update Header Balance
      const balanceEl = document.getElementById("header-cubic-balance");
      if (balanceEl) {
        balanceEl.textContent = CubicWallet.getBalance().toLocaleString("id-ID");
      }

      // Bind Header Avatar Click -> Open Avatar Lab
      const btnHeaderAvatar = document.getElementById("btn-header-avatar");
      if (btnHeaderAvatar) {
        btnHeaderAvatar.addEventListener("click", () => {
          this.avatarLab.openModal();
        });
      }

      // Bind Header Cubic Click -> Open Wallet Modal
      const btnHeaderCubic = document.getElementById("btn-header-cubic");
      if (btnHeaderCubic) {
        btnHeaderCubic.addEventListener("click", () => {
          CubicWallet.openWalletModal();
        });
      }

      // React to Avatar Update
      window.addEventListener("epe-avatar-updated", () => {
        if (headerAvatarBox) {
          AvatarEngine.renderInto(headerAvatarBox, null, 24);
        }
      });

      // React to Cubic Balance Update
      window.addEventListener("epe-cubic-balance-updated", (e) => {
        if (balanceEl && e.detail) {
          balanceEl.textContent = Number(e.detail.balance).toLocaleString("id-ID");
        }
      });

      // Initial check for achievements based on existing data
      const completedCount = this.cubeStore?.getCompletedCount ? this.cubeStore.getCompletedCount() : (this.cubeStore?.getProgressStats ? this.cubeStore.getProgressStats().unlocked : 0);
      const history = this.historyManager?.getAll ? this.historyManager.getAll() : [];
      const hasE0 = history.some((r) => r.primaryErrorCode === "E0");
      AchievementEngine.checkMilestones({
        completedQuestionsCount: completedCount,
        completedRemediationsCount: 0,
        hasE0Achievement: hasE0
      });
    } catch (err) {
      console.warn("Gagal inisialisasi Avatar & Cubic Economy:", err);
    }
  }

  syncAiContext() {
    if (!this.aiAgentManager) return;
    const activeQ = this.questions.find((q) => q.id === this.activeQuestionId);
    this.aiAgentManager.updateContext({
      activeTab: this.activeTab,
      activeQuestion: activeQ,
      studentName: this.elements.studentIdInput ? this.elements.studentIdInput.value : ProfileManager.getStudentName(),
      studentSteps: this.elements.studentStepsInput ? this.elements.studentStepsInput.value : "",
      studentAnswer: this.elements.studentAnswerInput ? this.elements.studentAnswerInput.value : "",
      latestDiagnosis: this.latestResult
    });
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
      this.elements.primaryTaxonomyBadge.className = isCorrect ? "text-xs font-bold text-emerald-400" : "text-xs font-bold text-amber-400";
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

    // EPE V3: Render Step Reconstruction Card jika tersedia
    if (this.elements.stepReconstructionCardContainer) {
      if (result.stepReconstruction && result.stepReconstruction.steps && result.stepReconstruction.steps.length > 1) {
        const cardHtml = HandwritingStepReconstructor.formatStepEvidenceCard(result.stepReconstruction);
        this.elements.stepReconstructionCardContainer.innerHTML = cardHtml || "";
        this.elements.stepReconstructionCardContainer.classList.remove("hidden");
        // Render math in element
        if (window.renderMathInElement) {
          try {
            window.renderMathInElement(this.elements.stepReconstructionCardContainer, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false }
              ],
              throwOnError: false
            });
          } catch (e) {}
        }
      } else {
        this.elements.stepReconstructionCardContainer.innerHTML = "";
        this.elements.stepReconstructionCardContainer.classList.add("hidden");
      }
    }

    // Toggle tombol mulai remediasi jika bukan E0
    if (this.elements.btnStartRemediationFromDiag) {
      if (result.primaryErrorCode !== "E0") {
        this.elements.btnStartRemediationFromDiag.classList.remove("hidden");
        this.elements.btnStartRemediationFromDiag.textContent = `Mulai Latihan Remediasi untuk ${result.primaryErrorCode}`;
      } else {
        this.elements.btnStartRemediationFromDiag.classList.add("hidden");
      }
    }

    if (this.elements.btnViewCubeOnDash) {
      this.elements.btnViewCubeOnDash.classList.remove("hidden");
    }
  }

  startAdaptiveRemediation(errorCode, domainId) {
    this.remediationTargetQuestionId = this.activeQuestionId;
    this.switchTab("practice");
    NotificationToast.show(`Memulai remediasi untuk pola ${errorCode || "perbaikan"}...`, "info");
  }

  updateResearchFlowPipeline() {
    const flow = AssessmentStore.getResearchFlowStatus();

    // 1. Pre-Test
    const badgePre = document.getElementById("pipeline-badge-pretest");
    const btnPre = document.getElementById("btn-pipeline-pretest");
    if (badgePre) {
      if (flow.pretest.status === "completed") {
        badgePre.textContent = `✓ Selesai (${flow.pretest.latestScore}%)`;
        badgePre.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400";
        if (btnPre) btnPre.textContent = "Lihat / Ulangi";
      } else {
        badgePre.textContent = "○ Belum";
        badgePre.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
        if (btnPre) btnPre.textContent = "Mulai Pre-Test";
      }
    }

    // 2. Diagnostic
    const badgeDiag = document.getElementById("pipeline-badge-diagnostic");
    const btnDiag = document.getElementById("btn-pipeline-diagnostic");
    if (badgeDiag) {
      if (flow.diagnostic.status === "completed") {
        badgeDiag.textContent = "✓ Selesai (24/24)";
        badgeDiag.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400";
        if (btnDiag) btnDiag.textContent = "Buka Diagnostik";
      } else if (flow.diagnostic.status === "in_progress") {
        badgeDiag.textContent = `◐ ${flow.diagnostic.completedCount}/24 Soal`;
        badgeDiag.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-400";
        if (btnDiag) btnDiag.textContent = "Lanjutkan Diagnostik";
      } else {
        badgeDiag.textContent = "○ 0/24";
        badgeDiag.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
        if (btnDiag) btnDiag.textContent = "Mulai Diagnostik";
      }
    }

    // 3. Remediation
    const badgeRem = document.getElementById("pipeline-badge-remediation");
    const btnRem = document.getElementById("btn-pipeline-remediation");
    if (badgeRem) {
      if (flow.remediation.status === "completed") {
        badgeRem.textContent = "✓ Selesai";
        badgeRem.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400";
        if (btnRem) btnRem.textContent = "Buka Bank Latihan";
      } else {
        badgeRem.textContent = "○ Belum";
        badgeRem.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400";
        if (btnRem) btnRem.textContent = "Buka Remediasi";
      }
    }

    // 4. Post-Test
    const badgePost = document.getElementById("pipeline-badge-posttest");
    const btnPost = document.getElementById("btn-pipeline-posttest");
    if (badgePost && btnPost) {
      if (flow.posttest.status === "completed") {
        badgePost.textContent = `✓ Selesai (${flow.posttest.latestScore}%)`;
        badgePost.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-teal-500/20 text-teal-400";
        btnPost.textContent = "Lihat / Ulangi";
        btnPost.className = "btn-secondary w-full py-1.5 text-[11px] font-bold";
        btnPost.disabled = false;
      } else if (flow.posttest.status === "available") {
        badgePost.textContent = "→ Siap Dikerjakan";
        badgePost.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-teal-500/20 text-teal-400 animate-pulse";
        btnPost.textContent = "Mulai Post-Test";
        btnPost.className = "btn-primary w-full py-1.5 text-[11px] font-bold bg-teal-600 hover:bg-teal-500 shadow-md";
        btnPost.disabled = false;
      } else {
        badgePost.textContent = "🔒 Terkunci";
        badgePost.className = "text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-500";
        btnPost.textContent = "🔒 Terkunci";
        btnPost.className = "btn-secondary w-full py-1.5 text-[11px] font-bold opacity-60 cursor-not-allowed";
        btnPost.disabled = true;
      }
    }

    // Overall label
    const overallLabel = document.getElementById("pipeline-overall-status");
    if (overallLabel) {
      if (flow.posttest.status === "completed") {
        overallLabel.textContent = "Tahapan Riset Selesai ✓";
        overallLabel.className = "text-[10px] font-mono text-emerald-400 font-bold";
      } else if (flow.posttest.status === "available") {
        overallLabel.textContent = "Siap untuk Post-Test →";
        overallLabel.className = "text-[10px] font-mono text-teal-400 font-bold";
      } else {
        overallLabel.textContent = "Proses Berjalan...";
        overallLabel.className = "text-[10px] font-mono text-blue-400 font-bold";
      }
    }
  }

  updateDashboardRecentSummary(result = null) {
    this.updateResearchFlowPipeline();
    const r = result || this.latestResult || (this.historyManager.getAll()[0] || null);
    if (!r) return;

    if (this.elements.dashRecentQBadge) {
      this.elements.dashRecentQBadge.textContent = r.questionId;
    }
    if (this.elements.dashRecentEvidence) {
      this.elements.dashRecentEvidence.textContent = r.evidence || "Analisis diagnostik selesai.";
      this.elements.dashRecentEvidence.classList.remove("italic");
    }
    if (this.elements.dashRecentRemedyBox && this.elements.dashRecentRemedyText) {
      this.elements.dashRecentRemedyText.textContent = r.remediation || "-";
      this.elements.dashRecentRemedyBox.classList.remove("hidden");
    }
  }

  handleCopyOutput() {
    const text = this.latestResult ? this.latestResult.rawPlainText : this.elements.outputPlainText?.textContent;
    if (!text) {
      NotificationToast.show("Belum ada hasil analisis untuk disalin.", "warning");
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      NotificationToast.show("Format baku penelitian berhasil disalin ke clipboard!", "success");
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

    // Media Image
    if (this.elements.practiceMediaImageBox && this.elements.practiceMediaImgTag) {
      if (q.image && q.image.dataUrl) {
        this.elements.practiceMediaImgTag.src = q.image.dataUrl;
        this.elements.practiceMediaImageBox.classList.remove("hidden");
      } else {
        this.elements.practiceMediaImageBox.classList.add("hidden");
      }
    }

    // Media Audio
    if (this.elements.practiceMediaAudioBox && this.elements.practiceMediaAudioPlayer) {
      if (q.audioNote && (q.audioNote.dataUrl || q.audioNote.url)) {
        this.elements.practiceMediaAudioPlayer.src = q.audioNote.dataUrl || q.audioNote.url;
        this.elements.practiceMediaAudioBox.classList.remove("hidden");
      } else {
        this.elements.practiceMediaAudioPlayer.src = "";
        this.elements.practiceMediaAudioBox.classList.add("hidden");
      }
    }

    // Media File
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

    // Kunci Jawaban
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

    const studentName = this.elements.practiceStudentName?.value || ProfileManager.getStudentName();
    const studentSteps = this.elements.practiceStepsInput?.value || "";
    const studentAnswer = this.elements.practiceAnswerInput?.value || "";
    const multimodal = window._activeMultimodalPayload || null;

    if (!studentSteps.trim() && !studentAnswer.trim() && !this.studentPhotoData && !this.studentVoiceData && !multimodal) {
      NotificationToast.show("Masukkan coretan pengerjaan, jawaban, foto, atau rekaman suara Anda.", "warning");
      return;
    }

    const result = ErrorPatternEngine.analyze({
      studentId: studentName,
      question: q,
      studentAnswer,
      studentSteps,
      media: multimodal || {
        image: this.studentPhotoData,
        audio: this.studentVoiceData
      },
      inputModality: multimodal?.source || (this.studentPhotoData ? "image" : this.studentVoiceData ? "audio" : "typed"),
      multimodalEvidence: multimodal ? {
        multiSignal: multimodal.multiSignal || null,
        confidence: multimodal.confidence || null,
        manifest: multimodal.manifest || null,
        questionDoc: multimodal.questionDoc || null
      } : null
    });

    this.historyManager.addEntry(result);
    this.updateStatsAndHistory();

    // Jika ini adalah sesi latihan remediasi untuk kubus tertentu
    if (this.remediationTargetQuestionId && result.isCorrect) {
      this.motivationManager?.handleRemediationCompleted(this.remediationTargetQuestionId);
      CubicRewards.rewardRemediation(q.domainId || "remed");
      this.remediationTargetQuestionId = null;
    } else {
      CubicRewards.rewardPractice(this.activePracticeQuestionId);
    }

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
        this.elements.practiceResultStatus.className = isCorrect ? "text-xs font-bold text-emerald-400" : "text-xs font-bold text-amber-400";
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
  // VOICE RECORDERS
  // =========================================================================
  initVoiceRecorders() {
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
        NotificationToast.show("Rekaman suara penalaran berhasil disimpan!", "success");
      }
    });

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
  // TAB 4: RESEARCH & STATISTICS
  // =========================================================================
  updateStatsAndHistory() {
    const stats = this.historyManager.getStats();
    const history = this.historyManager.getAll();

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
            <span class="font-mono font-bold text-blue-500">${item.questionId}</span>
            <div class="text-[10px] text-slate-400 truncate max-w-[120px]">${item.questionTitle || item.domain}</div>
          </td>
          <td class="px-3 py-2.5">
            <span class="px-2 py-0.5 rounded text-[11px] font-bold ${
              isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
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
  // LIGHTBOX
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
  // BIND ALL EVENTS
  // =========================================================================
  bindEvents() {
    // Navigation Tabs
    if (this.elements.tabBtnDashboard) this.elements.tabBtnDashboard.addEventListener("click", (e) => this.switchTab("dashboard", e));
    if (this.elements.tabBtnPretest) this.elements.tabBtnPretest.addEventListener("click", (e) => this.switchTab("pretest", e));
    if (this.elements.tabBtnDiagnostic) this.elements.tabBtnDiagnostic.addEventListener("click", (e) => this.switchTab("diagnostic", e));
    if (this.elements.tabBtnPractice) this.elements.tabBtnPractice.addEventListener("click", (e) => this.switchTab("practice", e));
    if (this.elements.tabBtnPosttest) this.elements.tabBtnPosttest.addEventListener("click", (e) => this.switchTab("posttest", e));
    if (this.elements.tabBtnErrorProfile) this.elements.tabBtnErrorProfile.addEventListener("click", (e) => this.switchTab("error-profile", e));
    if (this.elements.tabBtnResearch) this.elements.tabBtnResearch.addEventListener("click", (e) => this.switchTab("research", e));

    // Pipeline Buttons on Dashboard
    if (this.elements.btnPipelinePretest) {
      this.elements.btnPipelinePretest.addEventListener("click", (e) => this.switchTab("pretest", e));
    }
    if (this.elements.btnPipelineDiagnostic) {
      this.elements.btnPipelineDiagnostic.addEventListener("click", (e) => this.switchTab("diagnostic", e));
    }
    if (this.elements.btnPipelineRemediation) {
      this.elements.btnPipelineRemediation.addEventListener("click", (e) => this.switchTab("practice", e));
    }
    if (this.elements.btnPipelinePosttest) {
      this.elements.btnPipelinePosttest.addEventListener("click", (e) => this.switchTab("posttest", e));
    }

    // Mode Switchers
    if (this.elements.btnModeStudent) this.elements.btnModeStudent.addEventListener("click", () => this.setMode("student"));
    if (this.elements.btnModeResearch) this.elements.btnModeResearch.addEventListener("click", () => this.setMode("research"));
    if (this.elements.btnModeStudentM) this.elements.btnModeStudentM.addEventListener("click", () => this.setMode("student"));
    if (this.elements.btnModeResearchM) this.elements.btnModeResearchM.addEventListener("click", () => this.setMode("research"));

    // Educator Mode Lock & Security Controls
    if (this.elements.btnLockResearch) {
      this.elements.btnLockResearch.addEventListener("click", () => this.lockEducatorMode());
    }
    if (this.elements.btnChangeEducatorPin) {
      this.elements.btnChangeEducatorPin.addEventListener("click", () => this.openChangePinModal());
    }

    // Educator Auth Modal Controls
    if (this.elements.btnCloseEducatorAuth) {
      this.elements.btnCloseEducatorAuth.addEventListener("click", () => this.closeEducatorAuthModal());
    }
    if (this.elements.btnCancelEducatorAuth) {
      this.elements.btnCancelEducatorAuth.addEventListener("click", () => this.closeEducatorAuthModal());
    }
    if (this.elements.btnSubmitEducatorAuth) {
      this.elements.btnSubmitEducatorAuth.addEventListener("click", () => this.verifyAndUnlockEducator());
    }
    if (this.elements.educatorPinInput) {
      this.elements.educatorPinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") this.verifyAndUnlockEducator();
      });
    }
    if (this.elements.btnTogglePinVisibility) {
      this.elements.btnTogglePinVisibility.addEventListener("click", () => {
        const inp = this.elements.educatorPinInput;
        if (!inp) return;
        inp.type = inp.type === "password" ? "text" : "password";
      });
    }

    // Change PIN Modal Controls
    if (this.elements.btnCloseChangePin) {
      this.elements.btnCloseChangePin.addEventListener("click", () => this.closeChangePinModal());
    }
    if (this.elements.btnCancelChangePin) {
      this.elements.btnCancelChangePin.addEventListener("click", () => this.closeChangePinModal());
    }
    if (this.elements.btnSaveNewPin) {
      this.elements.btnSaveNewPin.addEventListener("click", () => this.saveNewEducatorPin());
    }

    // Dashboard Quick Buttons
    if (this.elements.dashBtnOpenDiagnostic) {
      this.elements.dashBtnOpenDiagnostic.addEventListener("click", (e) => this.switchTab("diagnostic", e));
    }
    if (this.elements.dashBtnOpenPractice) {
      this.elements.dashBtnOpenPractice.addEventListener("click", (e) => this.switchTab("practice", e));
    }
    if (this.elements.dashBtnContinueDiag) {
      this.elements.dashBtnContinueDiag.addEventListener("click", (e) => this.switchTab("diagnostic", e));
    }
    if (this.elements.btnOpenCollection) {
      this.elements.btnOpenCollection.addEventListener("click", (e) => this.switchTab("diagnostic", e));
    }

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
    if (this.elements.btnCopyResearchText) this.elements.btnCopyResearchText.addEventListener("click", () => this.handleCopyOutput());

    if (this.elements.btnStartRemediationFromDiag) {
      this.elements.btnStartRemediationFromDiag.addEventListener("click", () => {
        if (this.latestResult) {
          this.startAdaptiveRemediation(this.latestResult.primaryErrorCode, this.latestResult.domainId);
        }
      });
    }

    if (this.elements.btnViewCubeOnDash) {
      this.elements.btnViewCubeOnDash.addEventListener("click", (e) => {
        this.switchTab("dashboard", e);
      });
    }

    // Tab 2 Events (Foto, Audio, Latihan)
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
          NotificationToast.show("Foto coretan berhasil diunggah!", "success");
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
          NotificationToast.show("Mohon lengkapi data judul, deskripsi soal, dan kunci jawaban.", "warning");
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

        NotificationToast.show("Soal latihan baru berhasil ditambahkan!", "success");
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

    // Worksheet Multi-Question Import (Phase 7)
    this.initWorksheetImport();

    // Tab 4 Events (Supabase, CSV, Clear)
    if (this.elements.btnSyncSupabase) {
      this.elements.btnSyncSupabase.addEventListener("click", async () => {
        this.requireEducatorAuth(async () => {
          const allEntries = this.historyManager.getAll();
          if (allEntries.length === 0) {
            NotificationToast.show("Belum ada data riwayat di browser untuk diunggah.", "warning");
            return;
          }
          NotificationToast.show(`Menyinkronkan ${allEntries.length} data riwayat ke Supabase...`, "info");
          const res = await syncAllHistoryToSupabase(allEntries);
          if (res.success) {
            NotificationToast.show(`Berhasil mengunggah ${res.count} data riwayat ke database Supabase!`, "success");
          } else {
            NotificationToast.show(`Sinkronisasi gagal: ${res.message}`, "error");
          }
        });
      });
    }

    if (this.elements.btnSyncAssessmentsSupabase) {
      this.elements.btnSyncAssessmentsSupabase.addEventListener("click", async () => {
        this.requireEducatorAuth(async () => {
          const preList = AssessmentStore.getAllAttempts("pretest");
          const postList = AssessmentStore.getAllAttempts("posttest");
          if (preList.length === 0 && postList.length === 0) {
            NotificationToast.show("Belum ada rekaman Pre-Test atau Post-Test di browser untuk disinkronkan.", "warning");
            return;
          }
          NotificationToast.show(`Menyinkronkan ${preList.length} Pre-Test dan ${postList.length} Post-Test ke Cloud Supabase...`, "info");
          const res = await syncAllAssessmentsToSupabase(preList, postList);
          if (res.success) {
            NotificationToast.show(res.message, "success");
          } else {
            NotificationToast.show(`Sinkronisasi gagal: ${res.message}`, "error");
          }
        });
      });
    }

    if (this.elements.btnExportCloudCsv) {
      this.elements.btnExportCloudCsv.addEventListener("click", async () => {
        this.requireEducatorAuth(async () => {
          NotificationToast.show("Mengunduh data lengkap dari Cloud Supabase...", "info");
          const res = await exportCloudDataToCSV();
          if (res.success) {
            NotificationToast.show(`Berhasil mengunduh ${res.count} rekaman Supabase ke CSV!`, "success");
          } else {
            NotificationToast.show(res.message, "warning");
          }
        });
      });
    }

    if (this.elements.btnExportCsvTab) {
      this.elements.btnExportCsvTab.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          const res = this.historyManager.exportToCSV();
          if (res.success) NotificationToast.show(`Riwayat (${res.count} data) berhasil diekspor ke CSV!`, "success");
          else NotificationToast.show(res.message, "warning");
        });
      });
    }

    // Impor CSV Riwayat Diagnostik (Excel / Standard CSV)
    if (this.elements.btnImportHistoryCsv && this.elements.inputImportHistoryCsv) {
      this.elements.btnImportHistoryCsv.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          this.elements.inputImportHistoryCsv.value = "";
          this.elements.inputImportHistoryCsv.click();
        });
      });

      this.elements.inputImportHistoryCsv.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const res = this.historyManager.importFromCSV(text, false);
          if (res.success) {
            // Update status kubus di CubeStore untuk tiap soal yang diimpor
            res.entries.forEach((entry) => {
              if (entry.questionId && this.cubeStore) {
                this.cubeStore.recordDiagnosis(entry.questionId, {
                  primaryErrorCode: entry.primaryErrorCode,
                  primaryErrorText: entry.primaryError
                });
              }
            });
            this.updateStatsAndHistory();
            this.tornadoEngine?.updateCardStatuses();
            this.cubeEngine?.render();
            NotificationToast.show(`Berhasil mengimpor ${res.count} rekaman riwayat diagnostik!`, "success");
          } else {
            NotificationToast.show(res.message, "error");
          }
        } catch (err) {
          NotificationToast.show(`Gagal membaca berkas CSV: ${err.message}`, "error");
        }
      });
    }

    // Muat 24 Data Riset Bawaan (Q1-Q24)
    if (this.elements.btnPreloadResearchSample) {
      this.elements.btnPreloadResearchSample.addEventListener("click", async () => {
        this.requireEducatorAuth(async () => {
          try {
            NotificationToast.show("Memuat 24 dataset instrumen penelitian baku (Q1–Q24)...", "info");
            let csvText = "";
            try {
              const resp = await fetch("/data_riwayat_epe_excel_rapi.csv");
              if (resp.ok) {
                csvText = await resp.text();
              }
            } catch (e) {
              console.warn("Fetch CSV file failed, fallback to builtin string:", e);
            }

            if (!csvText) {
              csvText = this._getRawDefaultResearchCSV();
            }

            const res = this.historyManager.importFromCSV(csvText, false);
            if (res.success) {
              res.entries.forEach((entry) => {
                if (entry.questionId && this.cubeStore) {
                  this.cubeStore.recordDiagnosis(entry.questionId, {
                    primaryErrorCode: entry.primaryErrorCode,
                    primaryErrorText: entry.primaryError
                  });
                }
              });
              this.updateStatsAndHistory();
              this.tornadoEngine?.updateCardStatuses();
              this.cubeEngine?.render();
              NotificationToast.show(`Berhasil memuat ${res.count} data instrumen riset Q1–Q24! Monumen kubus & Orbit Diagnostik 3D telah diperbarui.`, "success");
            } else {
              NotificationToast.show(res.message, "warning");
            }
          } catch (err) {
            NotificationToast.show(`Gagal memuat dataset riset: ${err.message}`, "error");
          }
        });
      });
    }

    // Research Export Suite (5 Varian CSV)
    if (this.elements.btnExportPretestCsv) {
      this.elements.btnExportPretestCsv.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          const res = ResearchExport.exportPreTestCSV();
          if (res.success) NotificationToast.show(`Pre-Test (${res.count} data) berhasil diekspor ke CSV!`, "success");
        });
      });
    }

    if (this.elements.btnExportDiagCsv) {
      this.elements.btnExportDiagCsv.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          const res = ResearchExport.exportDiagnosticCSV();
          if (res.success) NotificationToast.show(`Diagnostik (${res.count} data) berhasil diekspor ke CSV!`, "success");
        });
      });
    }

    if (this.elements.btnExportRemCsv) {
      this.elements.btnExportRemCsv.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          const res = ResearchExport.exportRemediationCSV();
          if (res.success) NotificationToast.show(`Remediasi (${res.count} data) berhasil diekspor ke CSV!`, "success");
        });
      });
    }

    if (this.elements.btnExportPosttestCsv) {
      this.elements.btnExportPosttestCsv.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          const res = ResearchExport.exportPostTestCSV();
          if (res.success) NotificationToast.show(`Post-Test (${res.count} data) berhasil diekspor ke CSV!`, "success");
        });
      });
    }

    if (this.elements.btnExportCombinedCsv) {
      this.elements.btnExportCombinedCsv.addEventListener("click", () => {
        this.requireEducatorAuth(() => {
          const res = ResearchExport.exportCombinedResearchDataset();
          if (res.success) NotificationToast.show("Combined Research Dataset berhasil diekspor ke CSV!", "success");
        });
      });
    }

    // Refresh Pipeline & Research Dashboard on Assessment Updates
    window.addEventListener("epe-assessment-recorded", () => {
      this.updateResearchFlowPipeline();
      if (this.activeTab === "research" && this.elements.researchComparisonContainer) {
        ResearchAnalytics.renderResearchModeComparison(this.elements.researchComparisonContainer);
      }
    });

    window.addEventListener("epe-remediation-logged", () => {
      this.updateResearchFlowPipeline();
    });

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

  initWorksheetImport() {
    if (!this.elements.inputImportWorksheetImage) return;

    this.elements.btnCloseWorksheetModal?.addEventListener("click", () => {
      this.elements.worksheetImportModal?.classList.add("hidden");
    });

    this.elements.inputImportWorksheetImage.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      this.elements.worksheetImportModal?.classList.remove("hidden");
      this.elements.worksheetImportLoading?.classList.remove("hidden");
      this.elements.worksheetImportContent?.classList.add("hidden");

      try {
        const dataUrl = await MediaManager.readFileAsDataURL(file);
        const manifest = await VisionProvider.analyzeImage(dataUrl);

        this.elements.worksheetImportLoading?.classList.add("hidden");
        this.elements.worksheetImportContent?.classList.remove("hidden");

        const questionDoc = QuestionDocument.fromManifest(manifest);
        const questions = questionDoc.questions;

        this._pendingWorksheetQuestions = questions;

        if (this.elements.worksheetDetectedCount) {
          this.elements.worksheetDetectedCount.textContent = `${questions.length} Butir Soal Terdeteksi dari Worksheet`;
        }

        if (this.elements.worksheetQuestionsContainer) {
          if (questions.length === 0) {
            this.elements.worksheetQuestionsContainer.innerHTML = `
              <div class="p-6 text-center text-slate-400 text-xs">
                Tidak ada butir soal terpisah yang terdeteksi dalam gambar ini. Pastikan teks soal dan angka terlihat jelas dan tidak terlalu buram.
              </div>
            `;
            return;
          }

          this.elements.worksheetQuestionsContainer.innerHTML = questions.map((q, idx) => `
            <div class="card-subtle p-3.5 space-y-2 border border-slate-800 rounded-lg bg-slate-950/60 worksheet-q-item" data-idx="${idx}">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
                <div class="flex items-center gap-2">
                  <input type="checkbox" class="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 worksheet-q-check" checked data-idx="${idx}" />
                  <span class="font-bold text-white">Soal ${q.questionNumber || (idx + 1)}</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Keyakinan: ${Math.round((q.confidence?.overall || 0.85) * 100)}%
                </span>
              </div>
              <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Teks Soal:</label>
                <textarea class="input-clean w-full p-2 text-xs font-medium worksheet-q-text" rows="2" data-idx="${idx}">${q.questionText || ""}</textarea>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label class="block text-[10px] text-slate-400 mb-0.5">Persamaan / Formula (LaTeX):</label>
                  <input type="text" class="input-clean w-full px-2.5 py-1.5 text-xs font-mono text-cyan-300 worksheet-q-latex" value="${q.mathematicalExpressions?.[0] || ""}" data-idx="${idx}" />
                </div>
                <div>
                  <label class="block text-[10px] text-slate-400 mb-0.5">Kunci Jawaban Standar (Jika Ada):</label>
                  <input type="text" class="input-clean w-full px-2.5 py-1.5 text-xs font-medium text-emerald-400 worksheet-q-ans" value="${q.studentResponse?.selectedOption ? 'Opsi ' + q.studentResponse.selectedOption : (q.studentResponse?.writtenAnswer || '')}" data-idx="${idx}" />
                </div>
              </div>
            </div>
          `).join("");
        }

      } catch (err) {
        console.error("Worksheet import error:", err);
        this.elements.worksheetImportLoading?.classList.add("hidden");
        this.elements.worksheetImportContent?.classList.remove("hidden");
        if (this.elements.worksheetQuestionsContainer) {
          this.elements.worksheetQuestionsContainer.innerHTML = `
            <div class="p-6 text-center text-rose-400 text-xs">
              Gagal memproses gambar lembar kerja: ${err.message}. Pastikan API key terpasang di pengaturan AI Matrix.
            </div>
          `;
        }
      } finally {
        this.elements.inputImportWorksheetImage.value = "";
      }
    });

    if (this.elements.btnPublishWorksheetQuestions) {
      this.elements.btnPublishWorksheetQuestions.addEventListener("click", () => {
        const items = this.elements.worksheetQuestionsContainer?.querySelectorAll(".worksheet-q-item");
        if (!items || items.length === 0) return;

        let publishedCount = 0;
        items.forEach(item => {
          const check = item.querySelector(".worksheet-q-check");
          if (check && check.checked) {
            const idx = parseInt(check.getAttribute("data-idx"), 10);
            const promptText = item.querySelector(".worksheet-q-text")?.value || "";
            const latexEquation = item.querySelector(".worksheet-q-latex")?.value || "";
            const standardAnswer = item.querySelector(".worksheet-q-ans")?.value || "";

            this.customStore.addQuestion({
              title: `Soal Lembar Kerja ${idx + 1}`,
              topic: "Latihan Lembar Kerja (Worksheet)",
              category: "Worksheet AI",
              promptText,
              latexEquation,
              standardAnswer,
              explanation: "Soal diekstrak secara otomatis dari foto lembar kerja menggunakan AI Vision EPE."
            });
            publishedCount++;
          }
        });

        if (publishedCount > 0) {
          NotificationToast.show(`Berhasil menerbitkan ${publishedCount} butir soal baru ke Bank Soal!`, "success");
          this.renderPracticeQuestionList();
          this.elements.worksheetImportModal?.classList.add("hidden");
        } else {
          NotificationToast.show("Pilih minimal satu butir soal untuk diterbitkan.", "warning");
        }
      });
    }
  }

  _getRawDefaultResearchCSV() {
    return `No;Waktu Submit;Nama Siswa;Kode Soal;Domain;Kesalahan Utama;Kesalahan Kedua;Keyakinan;Bukti Coretan Siswa;Rekomendasi Remediasi;Jawaban Siswa;Langkah Pengerjaan
1;2026-09-14 11:27:47;Budi Santoso;Q1;D1;[E1] Miskonsepsi Bentuk Baku;Tidak ada;85%;Koefisien b tertukar dengan c;Pelajari kembali bentuk umum ax^2 + bx + c = 0;b = 6, c = -5;Persamaan: x^2 - 5x + 6 = 0
2;2026-09-14 11:33:45;Ahmad Siswa;Q1;D1 - Bentuk Baku;[E1] Miskonsepsi Identifikasi Koefisien;none;90%;Siswa menulis koefisien b = 6 padahal persamaan x^2 - 5x + 6 = 0;Tinjau kembali bentuk baku ax^2 + bx + c = 0 dan perhatikan tanda minus pada koefisien b.;b = 6, c = -5;Persamaan: x^2 - 5x + 6 = 0 | b = 6, c = -5
3;2026-09-14 14:10:15;Aisyah Putri (Siswa_01);Q1;D1 - Konsep Dasar;[E0] Akurat / Solusi Tepat;none;95%;Siswa mengubah persamaan ke bentuk baku 2x^2 - 5x - 7 = 0 dan menentukan a=2, b=-5, c=-7 secara benar.;Pemahaman bentuk baku sudah sangat baik. Pertahankan ketelitian aljabar.;a = 2, b = -5, c = -7;2x^2 - 5x = 7 | 2x^2 - 5x - 7 = 0 | Bentuk baku: ax^2 + bx + c = 0 | Maka a = 2, b = -5, c = -7
4;2026-09-14 14:10:16;Budi Santoso (Siswa_02);Q2;D1 - Konsep Dasar;[E1] Konseptual: Miskonsepsi Tanda Koefisien;none;88%;Siswa mengabaikan tanda negatif pada koefisien b dan konstanta c.;Tinjau kembali bahwa tanda negatif di depan angka merupakan bagian integral dari koefisien.;a = 3, b = 4, c = 8;3x^2 - 4x - 8 = 0 | a = 3, b = 4, c = 8
5;2026-09-14 14:10:16;Cahyo Wibowo (Siswa_03);Q3;D1 - Konsep Dasar;[E1] Konseptual: Koefisien Dianggap Akar Persamaan;none;90%;Siswa langsung menyimpulkan akar persamaan adalah angka koefisien b dan c.;Akar persamaan kuadrat adalah nilai pengganti variabel x yang membuat persamaan bernilai nol, bukan koefisiennya.;x1 = 5 dan x2 = 6;x^2 - 5x + 6 = 0 | Karena ada angka 5 dan 6 maka akar-akarnya x = 5 dan x = 6.
6;2026-09-14 14:10:17;Dewi Sartika (Siswa_04);Q4;D1 - Konsep Dasar;[E3] Komputasi: Kekeliruan Operasi Kuadrat Negatif;none;82%;Siswa menghitung (-3)^2 = -9 saat menguji diskriminan dasar.;Bilangan negatif berpangkat genap selalu menghasilkan bilangan positif: (-a)^2 = +a^2.;D = -25;D = b^2 - 4ac = (-3)^2 - 4(1)(4) = -9 - 16 = -25
7;2026-09-14 14:10:17;Eko Prasetyo (Siswa_05);Q5;D2 - Faktorisasi;[E0] Akurat / Solusi Tepat;none;96%;Siswa memfaktorkan (x - 3)(x - 4) = 0 dan mencari pembuat nol secara benar.;Langkah pemfaktoran sempurna. Lanjutkan ke pemfaktoran a > 1.;x = 3 atau x = 4;x^2 - 7x + 12 = 0 | Cari p+q=-7 dan p*q=12 -> p=-3, q=-4 | (x - 3)(x - 4) = 0 | x = 3 atau x = 4
8;2026-09-14 14:10:17;Fajar Ramadhan (Siswa_06);Q6;D2 - Faktorisasi;[E2] Prosedural: Tanda Faktor Terbalik;none;85%;Siswa menuliskan (x + 3)(x - 4) padahal seharusnya (x - 3)(x + 4).;Uji kembali hasil perkalian suku tengah: (x+p)(x+q) = x^2 + (p+q)x + pq.;x = -3 atau x = 4;x^2 + x - 12 = 0 | (x + 3)(x - 4) = 0 | x = -3 atau x = 4
9;2026-09-14 14:10:18;Gita Gutawa (Siswa_07);Q7;D2 - Faktorisasi;[E2] Prosedural: Salah Pemfaktoran Koefisien a > 1;[E3] Komputasi;80%;Siswa tidak membagi hasil penguraian dengan koefisien a pada metode pemfaktoran silang.;Gunakan metode pengelompokan suku tengah untuk pemfaktoran ax^2 + bx + c dengan a > 1.;x = 2 atau x = 5;2x^2 + 7x + 3 = 0 | (2x + 1)(x + 3) = 0 | x = 2 atau x = 5
10;2026-09-14 14:10:18;Hadi Firmansyah (Siswa_08);Q8;D2 - Faktorisasi;[E1] Konseptual: Pelanggaran Sifat Perkalian Nol;none;89%;Siswa mencoret variabel x pada kedua ruas sehingga menghilangkan salah satu akar x = 0.;Jangan membagi kedua ruas dengan variabel x karena x bisa bernilai nol. Gunakan pemfaktoran x(ax + b) = 0.;x = 5 (hanya 1 akar);x^2 - 5x = 0 | x^2 = 5x | Bagi x kedua ruas -> x = 5
11;2026-09-14 14:10:19;Intan Permata (Siswa_09);Q9;D3 - Rumus ABC;[E0] Akurat / Solusi Tepat;none;94%;Substitusi rumus ABC tepat, evaluasi diskriminan dan pembagian 2a runtut.;Penguasaan rumus ABC sangat baik.;x = 1 atau x = -5;x = (-b +- sqrt(b^2 - 4ac)) / (2a) | x = (-4 +- sqrt(16 - 4(1)(-5))) / 2 | x = (-4 +- sqrt(36)) / 2 | x1 = 1, x2 = -5
12;2026-09-14 14:10:19;Joko Widodo (Siswa_10);Q10;D3 - Rumus ABC;[E3] Komputasi: Kesalahan Tanda pada Operasi -4ac;none;87%;Siswa menghitung -4(2)(-3) = -24 padahal seharusnya +24.;Perkalian dua bilangan bertanda negatif menghasilkan bilangan positif: (-4) * (-c) = +4c.;x = (5 +- sqrt(-23)) / 4;D = b^2 - 4ac = 25 - 4(2)(-3) = 25 - 24 = 1 tapi siswa menulis 25 - 48 = -23
13;2026-09-14 14:10:19;Kartika Sari (Siswa_11);Q11;D3 - Rumus ABC;[E2] Prosedural: Lupa Membagi dengan 2a;none;84%;Siswa hanya membagi bagian akar kuadrat atau lupa membagi seluruh pembilang dengan 2a.;Garis pembagi rumus kuadratik membentang sepanjang seluruh pembilang: (-b +- sqrt(D)) / (2a).;x = 6 +- 4;x = -b +- sqrt(D) = 6 +- 4 = 10 atau 2 (lupa bagi 2a)
14;2026-09-14 14:10:20;Lukman Hakim (Siswa_12);Q12;D3 - Rumus ABC;[E1] Konseptual: Substitusi Nilai -b Keliru;none;86%;Siswa mensubstitusikan -b menjadi negatif padahal b sudah negatif (-(-b) = +b).;Jika koefisien b bernilai negatif (-6), maka suku pertama rumus ABC menjadi -(-6) = +6.;x = (-6 +- 8) / 2;b = -6 -> rumus -b ditulis -6 bukannya +6
15;2026-09-14 14:10:20;Maya Indah (Siswa_13);Q13;D4 - Diskriminan;[E0] Akurat / Solusi Tepat;none;95%;Menghitung D = 0 secara tepat dan menyimpulkan persamaan memiliki dua akar real kembar.;Analisis karakteristik diskriminan sangat baik.;D = 0, mempunyai dua akar real kembar (sama);x^2 - 6x + 9 = 0 | D = (-6)^2 - 4(1)(9) = 36 - 36 = 0 | Karena D = 0 maka akar kembar real.
16;2026-09-14 14:10:20;Naufal Rizky (Siswa_14);Q14;D4 - Diskriminan;[E1] Konseptual: Miskonsepsi Makna D < 0;none;91%;Siswa menganggap D < 0 berarti akar-akarnya bernilai negatif real.;D < 0 mengindikasikan akar tidak real / imajiner (grafik tidak memotong sumbu X), bukan akar bernilai negatif.;Akar-akarnya bernilai negatif;D = -16 < 0 maka nilai x yang dihasilkan negatif semua.
17;2026-09-14 14:10:20;Olivia Zalianty (Siswa_15);Q15;D4 - Diskriminan;[E2] Prosedural: Keliru Menentukan Syarat Parameter k;[E3] Komputasi;79%;Siswa salah dalam membalik tanda pertidaksamaan saat membagi dengan koefisien negatif.;Ketika kedua ruas pertidaksamaan dibagi bilangan negatif, arah tanda pertidaksamaan harus dibalik.;k > 4 (seharusnya k < 4);D > 0 -> 16 - 4k > 0 -> -4k > -16 -> k > 4
18;2026-09-14 14:10:21;Putri Ayu (Siswa_16);Q16;D4 - Diskriminan;[E3] Komputasi: Salah Hitung Kuadrat Variabel Parameter;none;83%;Siswa menghitung (2k)^2 menjadi 2k^2 bukan 4k^2.;Pangkat dua berlaku untuk koefisien dan variabel: (ck)^2 = c^2 * k^2.;k = +- 6;b = 2k -> b^2 ditulis 2k^2 bukannya 4k^2
19;2026-09-14 14:10:21;Qori Salsabila (Siswa_17);Q17;D5 - Hubungan Akar;[E0] Akurat / Solusi Tepat;none;97%;Siswa menerapkan Teorema Vieta x1 + x2 = -b/a dan x1 * x2 = c/a secara sempurna.;Penguasaan Teorema Vieta sangat komprehensif.;x1 + x2 = 5, x1 * x2 = 6;x^2 - 5x + 6 = 0 | x1 + x2 = -(-5)/1 = 5 | x1 * x2 = 6/1 = 6
20;2026-09-14 14:10:21;Rizky Pratama (Siswa_18);Q18;D5 - Hubungan Akar;[E1] Konseptual: Tertukar Rumus Vieta Jumlah dan Kali;none;88%;Siswa menggunakan c/a untuk jumlah akar dan -b/a untuk perkalian akar.;Ingat jembatan keledai Vieta: Jumlah bertanda minus (-b/a), Hasil kali positif (c/a).;Jumlah = 6, Kali = 5;x1 + x2 = c/a = 6, x1 * x2 = -b/a = 5
21;2026-09-14 14:10:21;Siti Rahma (Siswa_19);Q19;D5 - Hubungan Akar;[E2] Prosedural: Keliru Menyusun Persamaan Kuadrat Baru;none;85%;Siswa menulis rumus persamaan baru dengan tanda positif pada suku tengah: x^2 + (alfa + beta)x + alfa*beta = 0.;Rumus baku penyusunan persamaan kuadrat baru adalah x^2 - (x1 + x2)x + (x1 * x2) = 0.;x^2 + 8x + 15 = 0;Rumus persamaan baru: x^2 + (alfa+beta)x + alfa*beta = 0
22;2026-09-14 14:10:22;Taufik Hidayat (Siswa_20);Q20;D5 - Hubungan Akar;[E1] Konseptual: Miskonsepsi Identitas Aljabar x1^2 + x2^2;none;92%;Siswa menganggap x1^2 + x2^2 sama persis dengan (x1 + x2)^2 tanpa dikurangi 2*x1*x2.;Gunakan identitas aljabar kuadrat binomial: x1^2 + x2^2 = (x1 + x2)^2 - 2(x1 * x2).;x1^2 + x2^2 = 25;x1 + x2 = 5 | x1^2 + x2^2 = (5)^2 = 25 (tidak dikurangi 2x1x2)
23;2026-09-14 14:10:22;Utami Ningsih (Siswa_21);Q21;D6 - Penerapan;[E0] Akurat / Solusi Tepat;none;94%;Pemodelan persegi panjang p*(p-3)=40, faktorisasi, dan seleksi nilai positif p=8 tepat.;Penalaran pemecahan masalah kontekstual sangat baik.;Panjang = 8 cm, Lebar = 5 cm;Lebar l = p - 3 | Luas = p * (p - 3) = 40 | p^2 - 3p - 40 = 0 | (p - 8)(p + 5) = 0 | Karena panjang besaran fisis positif, p = 8 cm, l = 5 cm
24;2026-09-14 14:10:23;Vina Panduwinata (Siswa_22);Q22;D6 - Penerapan;[E4] Interpretasi: Tidak Membuang Solusi Negatif pada Konteks Nyata;none;87%;Siswa menyertakan panjang sisi = -5 cm sebagai jawaban akhir.;Ukuran panjang, waktu, dan jarak dalam konteks fisika/geometri tidak boleh negatif, abaikan nilai negatif.;Panjang = 8 cm atau -5 cm;p1 = 8, p2 = -5 | Keduanya ditulis sebagai ukuran panjang persegi panjang.
25;2026-09-14 14:10:24;Wahyu Setiawan (Siswa_23);Q23;D6 - Penerapan;[E4] Interpretasi: Menentukan Waktu Sentuh Tanah Parabola;[E2] Prosedural;83%;Siswa memilih t = 0 sebagai waktu peluru menyentuh tanah kembali bukannya t = 4.;Nilai t = 0 adalah saat peluru ditembakkan, sedangkan saat menyentuh tanah kembali adalah akar t positif kedua.;t = 0 detik;h(t) = 40t - 5t^2 = 0 | 5t(8 - t) = 0 | t = 0 atau t = 8 | Siswa memilih t = 0
26;2026-09-14 14:10:24;Yusuf Mansur (Siswa_24);Q24;D6 - Penerapan;[E1] Konseptual: Reflektif Karakteristik Parabola D < 0;none;89%;Siswa setuju dengan miskonsepsi bahwa roket tidak meluncur jika diskriminan negatif.;D < 0 pada fungsi ketinggian parabola berarti lintasan roket tidak pernah memotong sumbu waktu h=0.;Pernyataan benar;Jika D < 0 maka roket tidak dapat terbang ke atas.`;
  }
}

// Inisialisasi Otomatis
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.epeApp = new EpeAppV2();
    window.epeApp.init();
  });
} else {
  window.epeApp = new EpeAppV2();
  window.epeApp.init();
}
