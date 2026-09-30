/**
 * integrityDashboardUI.js - Academic Integrity Monitor & Audit Dashboard UI
 * 
 * Dasbor Pemantauan Integritas Akademik di Mode Guru:
 * - Menampilkan tabel telemetri sesi seluruh siswa/responden
 * - Ringkasan sinyal objektif (Tab Switches, Inactive Duration, Rapid Answering)
 * - Modal Linimasa Peristiwa (Event Timeline Audit) presisi detik
 * - Formulir verifikasi manual guru (Pemberian Catatan & Status Validasi)
 */

import { integrityService } from "../services/integrityDetector.js";

export class IntegrityDashboardUI {
  constructor(containerElement, options = {}) {
    if (typeof containerElement === "string") {
      this.containerId = containerElement;
      this.container = typeof document !== "undefined" ? document.getElementById(containerElement) : null;
      this.options = options;
    } else if (containerElement && containerElement.containerId) {
      this.containerId = containerElement.containerId;
      this.container = typeof document !== "undefined" ? document.getElementById(containerElement.containerId) : null;
      this.options = containerElement;
    } else {
      this.container = containerElement;
      this.options = options;
    }
    this.filterStatus = "all"; // 'all' | 'normal' | 'review_recommended'
    this.filterSubject = "all"; // 'all' | 'matematika' | 'fisika' | 'kimia' | 'biologi'
    this.searchQuery = "";
  }

  /**
   * Normalisasi kode/nama mapel
   */
  normalizeSubject(sub) {
    if (!sub) return "matematika";
    const s = String(sub).toLowerCase().trim();
    if (s === "math" || s === "mathematics" || s === "matematika") return "matematika";
    if (s === "physics" || s === "fisika") return "fisika";
    if (s === "chemistry" || s === "kimia") return "kimia";
    if (s === "biology" || s === "biologi") return "biologi";
    return s;
  }

  /**
   * Render Dasbor Integritas Akademik
   */
  render() {
    if (!this.container && this.containerId && typeof document !== "undefined") {
      this.container = document.getElementById(this.containerId);
    }
    if (!this.container) return;

    let sessions = integrityService.getAllSessions();

    // Auto-seed sample sessions if empty or if multi-subject sample is missing
    const hasMultiSubjectSample = sessions.some(s => s.sessionId === "ses_post_sample_03");
    if (sessions.length === 0 || !hasMultiSubjectSample) {
      this.seedSampleSessions();
      sessions = integrityService.getAllSessions();
    }

    const allSessions = sessions;
    const mathCount = allSessions.filter(s => this.normalizeSubject(s.subject) === "matematika").length;
    const physCount = allSessions.filter(s => this.normalizeSubject(s.subject) === "fisika").length;
    const chemCount = allSessions.filter(s => this.normalizeSubject(s.subject) === "kimia").length;
    const bioCount = allSessions.filter(s => this.normalizeSubject(s.subject) === "biologi").length;

    // Filter by subject
    if (this.filterSubject && this.filterSubject !== "all") {
      sessions = sessions.filter(s => this.normalizeSubject(s.subject) === this.normalizeSubject(this.filterSubject));
    }

    const totalSessions = sessions.length;
    const normalCount = sessions.filter(s => !s.signals?.reviewRecommended).length;
    const reviewCount = sessions.filter(s => s.signals?.reviewRecommended).length;

    // Filter by review status
    if (this.filterStatus === "normal") {
      sessions = sessions.filter(s => !s.signals?.reviewRecommended);
    } else if (this.filterStatus === "review_recommended") {
      sessions = sessions.filter(s => s.signals?.reviewRecommended);
    }

    if (this.searchQuery.trim()) {
      const qLower = this.searchQuery.toLowerCase();
      sessions = sessions.filter(s => 
        (s.studentName || "").toLowerCase().includes(qLower) || 
        (s.testType || "").toLowerCase().includes(qLower) ||
        (s.sessionId || "").toLowerCase().includes(qLower) ||
        (s.studentClass || "").toLowerCase().includes(qLower) ||
        (s.subject || "").toLowerCase().includes(qLower)
      );
    }

    const isAntiActive = integrityService.isAntiDetectorActive();

    this.container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header Banner & KPI Cards -->
        <div class="card-clean p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 dark:border-amber-500/30 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z" stroke-linejoin="round"/>
                    <path d="M12 7V17M8 11.5L12 15.5L16 11.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Academic Integrity Telemetry Monitor</span>
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400 font-semibold">Non-Invasive Protocol</span>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Audit Integritas &amp; Pola Pengerjaan Asesmen
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
                Mendeteksi sinyal kebiasaan pengerjaan (fokus tab, jeda durasi inaktif, respon terlalu cepat). Sistem memberikan sinyal observasional etis, keputusan akhir berada di tangan pendidik.
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <!-- Creator Anti-Detector Mode Toggle -->
              <button id="btn-toggle-creator-antidetector" class="py-1.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${isAntiActive ? 'bg-purple-500/15 dark:bg-purple-950/40 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-sm shadow-purple-500/10 ring-1 ring-purple-500/30' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}" title="Klik untuk menghidupkan atau mematikan Creator Anti-Detector Bypass">
                <span class="relative flex items-center justify-center w-3.5 h-3.5 shrink-0 ${isAntiActive ? 'text-purple-500 dark:text-purple-400' : 'text-slate-400'}">
                  <svg class="w-3.5 h-3.5 ${isAntiActive ? 'animate-pulse' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 22,12 12,22 2,12" fill="${isAntiActive ? 'currentColor' : 'none'}" fill-opacity="${isAntiActive ? '0.28' : '0'}"/>
                    <polygon points="12,7 17,12 12,17 7,12" stroke-width="1.5"/>
                    <rect x="11" y="11" width="2" height="2" fill="currentColor"/>
                  </svg>
                </span>
                <svg class="w-3.5 h-3.5 ${isAntiActive ? 'text-purple-500 dark:text-purple-400' : 'text-slate-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z" stroke-linejoin="round"/>
                  <path d="M12 8V16M8 12H16" stroke-linecap="round"/>
                </svg>
                <span>Anti-Detector:</span>
                <span class="px-2 py-0.5 rounded text-[9.5px] uppercase font-extrabold ${isAntiActive ? 'bg-purple-500/25 text-purple-800 dark:text-purple-200 border border-purple-400/40' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'}">
                  ${isAntiActive ? 'AKTIF ⚡' : 'NONAKTIF (MATI)'}
                </span>
              </button>

              <button id="btn-export-integrity-log" class="btn-secondary py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer" title="Ekspor Log Telemetri ke JSON">
                <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M21 15V19C21 19.6 20.6 20 20 20H4C3.4 20 3 19.6 3 19V15" stroke-linecap="round"/>
                  <path d="M7 10L12 15L17 10M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Ekspor Log JSON</span>
              </button>
            </div>
          </div>

          <!-- KPI Summary Cards (4 Kolom) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
              <span class="text-[10.5px] font-bold uppercase text-slate-500 dark:text-slate-400">Total Sesi Uji</span>
              <div class="text-xl font-extrabold text-slate-900 dark:text-white">${totalSessions}</div>
              <span class="text-[10px] text-slate-500 dark:text-slate-400">Responden Asesmen</span>
            </div>

            <div class="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
              <span class="text-[10.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Pola Normal</span>
              <div class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">${normalCount}</div>
              <span class="text-[10px] text-emerald-600/80 dark:text-emerald-400/70">Aktivitas wajar</span>
            </div>

            <div class="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1">
              <span class="text-[10.5px] font-bold uppercase text-amber-600 dark:text-amber-400">Review Disarankan</span>
              <div class="text-xl font-extrabold text-amber-600 dark:text-amber-400">${reviewCount}</div>
              <span class="text-[10px] text-amber-600/80 dark:text-amber-400/70">Sinyal terdeteksi</span>
            </div>

            <div class="p-3 rounded-xl border space-y-1 transition-all ${isAntiActive ? 'bg-purple-50/70 dark:bg-purple-950/25 border-purple-200 dark:border-purple-800/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}">
              <span class="text-[10.5px] font-bold uppercase ${isAntiActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'}">Creator Anti-Detector</span>
              <div class="text-xl font-extrabold ${isAntiActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300'}">
                ${isAntiActive ? "Aktif ⚡" : "Nonaktif"}
              </div>
              <span class="text-[10px] ${isAntiActive ? 'text-purple-600/80 dark:text-purple-400/70' : 'text-slate-500 dark:text-slate-400'}">
                ${isAntiActive ? "Bypass Proteksi Nyala" : "Monitoring Siswa Penuh"}
              </span>
            </div>
          </div>
        </div>

        <!-- Filter Bar: Bidang Studi & Status Review -->
        <div class="space-y-3">
          <!-- Subject Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <svg class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Mapel:</span>
            </span>
            <button data-filter-subject="all" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${this.filterSubject === "all" ? "bg-indigo-600 text-white shadow-xs font-extrabold" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60"}">
              <span>Semua Mapel</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${this.filterSubject === "all" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700"}">${allSessions.length}</span>
            </button>
            <button data-filter-subject="matematika" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${this.filterSubject === "matematika" ? "bg-blue-600 text-white shadow-xs font-extrabold" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/60 dark:border-slate-700/60"}">
              <span>📐 Matematika</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${this.filterSubject === "matematika" ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}">${mathCount}</span>
            </button>
            <button data-filter-subject="fisika" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${this.filterSubject === "fisika" ? "bg-amber-600 text-white shadow-xs font-extrabold" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200/60 dark:border-slate-700/60"}">
              <span>⚡ Fisika</span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${this.filterSubject === "fisika" ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}">${physCount}</span>
            </button>
            <button data-filter-subject="kimia" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${this.filterSubject === "kimia" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-slate-700/60"}">
              <span>🧪 Kimia</span>
              ${chemCount > 0 ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${this.filterSubject === "kimia" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}">${chemCount}</span>` : ""}
            </button>
            <button data-filter-subject="biologi" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${this.filterSubject === "biologi" ? "bg-teal-600 text-white shadow-xs font-extrabold" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200/60 dark:border-slate-700/60"}">
              <span>🌱 Biologi</span>
              ${bioCount > 0 ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-mono ${this.filterSubject === "biologi" ? "bg-white/20 text-white" : "bg-teal-500/10 text-teal-600 dark:text-teal-400"}">${bioCount}</span>` : ""}
            </button>
          </div>

          <!-- Status Filter & Search Controls -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
              <button data-filter-integrity="all" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${this.filterStatus === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}">
                Semua Responden (${totalSessions})
              </button>
              <button data-filter-integrity="normal" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${this.filterStatus === "normal" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-emerald-600"}">
                <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Normal (${normalCount})</span>
              </button>
              <button data-filter-integrity="review_recommended" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${this.filterStatus === "review_recommended" ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-amber-600"}">
                <svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9V14M12 18H12.01M10.29 3.86L1.82 18.5C1.65 18.8 1.65 19.2 1.83 19.5C2 19.8 2.34 20 2.69 20H21.31C21.66 20 22 19.8 22.17 19.5C22.35 19.2 22.35 18.8 22.18 18.5L13.71 3.86C13.35 3.24 12.65 3.24 12.29 3.86Z" stroke-linejoin="round"/></svg>
                <span>Butuh Review (${reviewCount})</span>
              </button>
            </div>

            <div class="relative w-full sm:w-72">
              <input 
                type="text" 
                id="input-search-integrity" 
                value="${this.searchQuery}"
                placeholder="Cari siswa, kelas, mapel, sesi..." 
                class="w-full text-xs py-2 pl-8 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
              />
              <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>

        <!-- Tabel Telemetri Integritas Responden -->
        <div class="card-clean bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead class="text-[10.5px] uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-3.5 py-3 font-bold">Responden</th>
                  <th class="px-3.5 py-3 font-bold">Asesmen &amp; Waktu</th>
                  <th class="px-3.5 py-3 font-bold text-center">Pindah Tab</th>
                  <th class="px-3.5 py-3 font-bold text-center">Durasi Inaktif</th>
                  <th class="px-3.5 py-3 font-bold text-center">Akses AI &amp; Lens</th>
                  <th class="px-3.5 py-3 font-bold">Sinyal Integritas</th>
                  <th class="px-3.5 py-3 font-bold">Status Review</th>
                  <th class="px-3.5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                ${sessions.length === 0 ? `
                  <tr>
                    <td colspan="8" class="p-8 text-center text-xs text-slate-500">
                      Tidak ada rekaman sesi yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ` : sessions.map(s => {
                  const isCreatorBypass = Boolean((s.signals?.isCreatorBypass || s.isCreatorSession) && isAntiActive);
                  const isFlagged = !isCreatorBypass && s.signals?.reviewRecommended;
                  const timeFormatted = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateFormatted = new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const aiLensCount = (s.signals?.matrixAiOpenedCount || 0) + (s.signals?.googleLensAttempts || 0);

                  const normSub = this.normalizeSubject(s.subject);
                  let subjectBadge = '<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">📐 Matematika</span>';
                  if (normSub === "fisika") {
                    subjectBadge = '<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">⚡ Fisika</span>';
                  } else if (normSub === "kimia") {
                    subjectBadge = '<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">🧪 Kimia</span>';
                  } else if (normSub === "biologi") {
                    subjectBadge = '<span class="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">🌱 Biologi</span>';
                  }

                  let testTypeLabel = s.testType;
                  if (s.testType === "pretest") testTypeLabel = "Pre-Test / Tugas";
                  else if (s.testType === "posttest") testTypeLabel = "Post-Test / Remedial";
                  else if (s.testType === "diagnostic") testTypeLabel = "Diagnostik Baku";

                  let reviewBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">Belum Ditinjau</span>';
                  if (isCreatorBypass || s.reviewStatus === "reviewed_normal") {
                    reviewBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"><svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17L4 12"/></svg> Terverifikasi Normal</span>';
                  } else if (s.reviewStatus === "reviewed_flagged") {
                    reviewBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"><svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8V12M12 16H12.01"/></svg> Ditandai Guru</span>';
                  }

                  return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                        <div class="flex items-center gap-1.5">
                          <span>${s.studentName}</span>
                          ${isCreatorBypass ? `
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">CREATOR</span>
                          ` : ""}
                        </div>
                        <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span class="text-[10px] font-mono font-normal text-slate-500 dark:text-slate-400">${s.studentId}</span>
                          ${s.studentClass ? `
                            <span class="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30" title="Asal Kelas">
                              ${s.studentClass}
                            </span>
                          ` : `
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title="Kelas belum diatur">
                              Kelas –
                            </span>
                          `}
                        </div>
                      </td>
                      <td class="px-3.5 py-2.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span class="font-bold text-slate-800 dark:text-slate-200">${testTypeLabel}</span>
                          ${subjectBadge}
                        </div>
                        <div class="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">${dateFormatted} &bull; ${timeFormatted}</div>
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-bold ${(s.signals?.tabSwitches || 0) > 0 ? (isCreatorBypass ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400 font-extrabold") : "text-slate-400"}">
                        ${s.signals?.tabSwitches || 0}x
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-bold ${(s.signals?.totalInactiveSeconds || 0) > 0 ? (isCreatorBypass ? "text-purple-600 dark:text-purple-400" : "text-amber-600 dark:text-amber-400 font-extrabold") : "text-slate-400"}">
                        ${s.signals?.totalInactiveSeconds || 0}s
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-bold">
                        ${aiLensCount > 0 ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${isCreatorBypass ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'}">
                            <svg class="w-2.5 h-2.5 ${isCreatorBypass ? 'text-purple-500' : 'text-rose-500'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z"/></svg>
                            <span>${aiLensCount}x</span>
                          </span>
                        ` : `
                          <span class="text-slate-400 font-normal">–</span>
                        `}
                      </td>
                      <td class="px-3.5 py-2.5">
                        ${isCreatorBypass ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 shadow-xs">
                            <svg class="w-3 h-3 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z"/>
                              <path d="M12 8V16M8 12H16"/>
                            </svg>
                            <span>Creator Anti-Detector</span>
                          </span>
                        ` : isFlagged ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                            <svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8V12M12 16H12.01"/></svg>
                            <span>Perlu Ditinjau (${s.signals.reasons.length} Anomali)</span>
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Aktivitas Wajar</span>
                          </span>
                        `}
                      </td>
                      <td class="px-3.5 py-2.5">
                        ${reviewBadge}
                      </td>
                      <td class="px-3.5 py-2.5 text-right">
                        <button data-audit-id="${s.sessionId}" class="btn-secondary py-1.5 px-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-white flex items-center gap-1.5 ml-auto shadow-2xs cursor-pointer">
                          <svg class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65" stroke-linecap="round"/><circle cx="11" cy="11" r="3" stroke-dasharray="2 2"/></svg>
                          <span>Audit Linimasa</span>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Timeline Audit Container -->
        <div id="integrity-modal-container"></div>

      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Creator Anti-Detector Mode Toggle Button
    const toggleAntiBtn = this.container.querySelector("#btn-toggle-creator-antidetector");
    if (toggleAntiBtn) {
      toggleAntiBtn.addEventListener("click", () => {
        const nextState = !integrityService.isAntiDetectorActive();
        integrityService.setAntiDetector(nextState);
        if (typeof showToast === "function") {
          showToast(nextState ? "⚡ Creator Anti-Detector: AKTIF (Telemetry Bypass Enforced)" : "Creator Anti-Detector: DINONAKTIFKAN", "info");
        }
        this.render();
      });
    }

    // Filter subject buttons
    this.container.querySelectorAll("[data-filter-subject]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.filterSubject = e.currentTarget.getAttribute("data-filter-subject");
        this.render();
      });
    });

    // Filter status buttons
    this.container.querySelectorAll("[data-filter-integrity]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.filterStatus = e.currentTarget.getAttribute("data-filter-integrity");
        this.render();
      });
    });

    // Search input
    const searchInput = this.container.querySelector("#input-search-integrity");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const newSearch = this.container.querySelector("#input-search-integrity");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    // Export Log
    this.container.querySelector("#btn-export-integrity-log")?.addEventListener("click", () => {
      const sessions = integrityService.getAllSessions();
      const dataStr = JSON.stringify(sessions, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `academic_integrity_telemetry_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Audit Linimasa Buttons
    this.container.querySelectorAll("[data-audit-id]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-audit-id");
        this.openTimelineModal(id);
      });
    });
  }

  /**
   * Buka Modal Linimasa Peristiwa Telemetri Siswa
   * Menyediakan filter "Hanya Aktivitas Mencurigakan" agar guru tidak pusing menelusuri log per soal.
   */
  openTimelineModal(sessionId) {
    const s = integrityService.getSessionById(sessionId);
    if (!s) return;

    let modalContainer = this.container.querySelector("#integrity-modal-container");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "integrity-modal-container";
      document.body.appendChild(modalContainer);
    }

    const isAntiActive = integrityService.isAntiDetectorActive();
    const isCreatorBypass = Boolean((s.signals?.isCreatorBypass || s.isCreatorSession) && isAntiActive);

    const allEvents = Array.isArray(s.events) ? s.events : [];
    const normSub = this.normalizeSubject(s.subject);
    let subjectBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">📐 Matematika</span>';
    if (normSub === "fisika") {
      subjectBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">⚡ Fisika</span>';
    } else if (normSub === "kimia") {
      subjectBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">🧪 Kimia</span>';
    } else if (normSub === "biologi") {
      subjectBadge = '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">🌱 Biologi</span>';
    }

    let testTypeLabel = s.testType;
    if (s.testType === "pretest") testTypeLabel = "Pre-Test / Tugas";
    else if (s.testType === "posttest") testTypeLabel = "Post-Test / Remedial";
    else if (s.testType === "diagnostic") testTypeLabel = "Diagnostik Baku";

    // Filter aktivitas yang relevan / berpotensi mencurigakan saja
    const isSuspicious = (ev) => {
      if (ev.metadata?.isSuspicious) return true;
      if (["matrix_ai_opened", "google_lens_attempt", "screenshot_attempt", "clipboard_attempt", "devtools_attempt", "tab_hidden"].includes(ev.eventType)) return true;
      if (ev.eventType === "tab_visible" && (ev.metadata?.inactiveDurationSeconds || 0) >= 10) return true;
      return false;
    };

    const suspiciousEvents = allEvents.filter(isSuspicious);

    // KUNCI: Jika ada aktivitas mencurigakan (sesi "Butuh review"), fokuskan ke tab 'suspicious' agar guru tidak pusing.
    // Jika TIDAK ADA aktivitas mencurigakan (sesi "Normal" / selain "Butuh review"), LANGSUNG tampilkan seluruh linimasa aktivitasnya ('all')!
    let activeFilter = suspiciousEvents.length > 0 ? "suspicious" : "all";

    const renderEventItem = (ev) => {
      const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      let icon = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>`;
      let title = ev.eventType;
      let desc = ev.metadata?.summary || "";
      let tagBadge = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700";
      let cardBg = "bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800";

      if (ev.eventType === "matrix_ai_opened") {
        icon = `<svg class="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4m-4 5h8"/></svg>`;
        title = "Akses Chat Matrix AI Terdeteksi";
        desc = ev.metadata?.summary || "Siswa mengklik / membuka asisten Chat Matrix AI saat lembar pengerjaan asesmen sedang berlangsung.";
        tagBadge = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
        cardBg = "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40";
      } else if (ev.eventType === "google_lens_attempt") {
        icon = `<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2m-10 0H5a2 2 0 0 1-2-2v-2"/></svg>`;
        title = `Pencarian AI / Google Lens Terdeteksi (${ev.metadata?.detail || "Google Lens"})`;
        desc = ev.metadata?.summary || "Indikasi pencarian visual atau eksternal (Google Lens / Salin Soal & Keluar Tab / Klik Kanan Soal).";
        tagBadge = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
        cardBg = "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40";
      } else if (ev.eventType === "screenshot_attempt") {
        icon = `<svg class="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
        title = `Upaya Tangkapan Layar (Screenshot: ${ev.metadata?.method || "PrintScreen"})`;
        desc = ev.metadata?.summary || "Siswa menekan tombol PrintScreen atau shortcut tangkapan layar (Win/Ctrl+Shift+S).";
        tagBadge = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
        cardBg = "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40";
      } else if (ev.eventType === "devtools_attempt") {
        icon = `<svg class="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`;
        title = `Inspeksi Developer Tools (${ev.metadata?.detail || "F12"})`;
        desc = ev.metadata?.summary || "Siswa menekan tombol inspect element atau shortcut DevTools.";
        tagBadge = "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
        cardBg = "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40";
      } else if (ev.eventType === "clipboard_attempt") {
        icon = `<svg class="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        title = ev.metadata?.action === "copy" ? "Menyalin Teks Soal (Copy Clipboard)" : "Menempelkan Teks Eksternal (Paste)";
        desc = ev.metadata?.summary || "Aktivitas copy-paste teks di lembar pengerjaan.";
        tagBadge = "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
        cardBg = "bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/40";
      } else if (ev.eventType === "tab_hidden") {
        icon = `<svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,20 2,20"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.75" fill="currentColor"/></svg>`;
        title = `Pindah Tab / Keluar Jendela Ujian (#${ev.metadata?.switchNumber || 1})`;
        desc = ev.metadata?.summary || "Layar peramban ditinggalkan atau tab browser beralih ke halaman lain.";
        tagBadge = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
        cardBg = "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40";
      } else if (ev.eventType === "tab_visible") {
        icon = `<svg class="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/></svg>`;
        title = `Kembali ke Tab Ujian (${ev.metadata?.inactiveDurationSeconds || 0}s Tidak Aktif)`;
        desc = ev.metadata?.summary || `Siswa kembali fokus ke ujian setelah berada di luar jendela selama ${ev.metadata?.inactiveDurationSeconds || 0} detik.`;
        tagBadge = "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
        cardBg = "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40";
      } else if (ev.eventType === "rapid_guess") {
        icon = `<svg class="w-4 h-4 text-slate-500 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
        title = `Pengerjaan Cepat (Indikasi Tebak Acak / Ngasal: ~${ev.metadata?.durationSeconds || 0}s)`;
        desc = ev.metadata?.summary || "Siswa menjawab kilat, menandakan tebak cepat opsi secara acak (bukan indikasi AI).";
        tagBadge = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700";
        cardBg = "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60";
      } else if (ev.eventType === "assessment_started") {
        icon = `<svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6,4 20,12 6,20"/></svg>`;
        title = `Asesmen Dimulai (${ev.metadata?.testType || s.testType})`;
        desc = "Siswa memulai sesi pengerjaan asesmen.";
        tagBadge = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      } else if (ev.eventType === "question_opened") {
        icon = `<svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>`;
        title = `Membuka Soal #${ev.metadata?.questionIndex || ""} (${ev.metadata?.questionId || ""})`;
        desc = "Menampilkan butir soal di layar pengerjaan.";
        tagBadge = "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
      } else if (ev.eventType === "answer_changed") {
        icon = `<svg class="w-4 h-4 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
        title = `Memilih Opsi Jawaban: [${ev.metadata?.selectedValue || ""}]`;
        desc = `Jawaban butir ${ev.questionId || ""} dipilih/diubah.`;
        tagBadge = "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30";
      } else if (ev.eventType === "assessment_submitted") {
        icon = `<svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
        title = "Asesmen Selesai & Dikirimkan";
        desc = `Pengerjaan rampung dengan durasi total ${ev.metadata?.totalDurationSeconds || 0} detik.`;
        tagBadge = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      }

      return `
        <div class="p-3 rounded-xl border ${cardBg} transition-all space-y-1">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg flex items-center justify-center border ${tagBadge} shrink-0">
                ${icon}
              </span>
              <span class="font-bold text-slate-900 dark:text-white text-xs">${title}</span>
            </div>
            <span class="font-mono text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">${timeStr}</span>
          </div>
          ${desc ? `<p class="text-[11px] text-slate-600 dark:text-slate-300 pl-8 leading-relaxed">${desc}</p>` : ""}
        </div>
      `;
    };

    const renderModalContent = () => {
      const activeList = activeFilter === "suspicious" ? suspiciousEvents : allEvents;

      modalContainer.innerHTML = `
        <div class="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" id="timeline-modal-backdrop">
          <div class="card-clean max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl my-8 rounded-2xl" onclick="event.stopPropagation()">
            
            <!-- Header Modal -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Audit Linimasa Integritas Siswa</span>
                  </h3>
                  <span class="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">${s.studentName}</span>
                  ${s.studentClass ? `
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">${s.studentClass}</span>
                  ` : ""}
                  ${subjectBadge}
                  ${isCreatorBypass ? `
                    <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">CREATOR BYPASS</span>
                  ` : ""}
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ID Sesi: ${s.sessionId} &bull; Tipe: <span class="font-bold text-slate-700 dark:text-slate-300">${testTypeLabel}</span> &bull; Bidang: <span class="capitalize font-bold text-slate-700 dark:text-slate-300">${normSub}</span></p>
              </div>
              <button id="btn-close-timeline-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xl leading-none p-1.5 rounded-lg cursor-pointer">&times;</button>
            </div>

            <!-- Ringkasan Status Sinyal -->
            <div class="p-3.5 rounded-xl ${isCreatorBypass ? "bg-purple-500/10 border border-purple-500/25 text-purple-800 dark:text-purple-300" : s.signals?.reviewRecommended ? "bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300" : "bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300"} text-xs space-y-1.5 leading-relaxed">
              <div class="font-bold flex items-center gap-2 text-xs">
                ${isCreatorBypass ? `
                  <span class="w-5 h-5 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-500 border border-purple-500/30">✓</span>
                  <span>Creator Anti-Detector Bypass Aktif (Bebas dari Penandaan Telemetri)</span>
                ` : s.signals?.reviewRecommended ? `
                  <span class="w-5 h-5 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-500 border border-amber-500/30">⚠️</span>
                  <span>Sinyal Integritas: Terdeteksi Anomali Pengerjaan (Perlu Ditinjau)</span>
                ` : `
                  <span class="w-5 h-5 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">✓</span>
                  <span>Sinyal Integritas: Pengerjaan Tertib &amp; Wajar (Bebas Anomali)</span>
                `}
              </div>
              ${s.signals?.reasons && s.signals.reasons.length > 0 ? `
                <ul class="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                  ${s.signals.reasons.map(r => `<li>${r}</li>`).join("")}
                </ul>
              ` : `<p class="text-[11px] opacity-90">${isCreatorBypass ? "Sesi dijalankan dalam proteksi Creator Anti-Detector (telemetri aman dari penandaan)." : "Siswa fokus pada lembar asesmen tanpa membuka chat AI, screenshot, ataupun berpindah tab."}</p>`}
            </div>

            <!-- Tab Filter: Hanya Aktivitas Mencurigakan vs Semua Log (Agar Guru Tidak Pusing) -->
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 flex-wrap">
              <div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <button type="button" id="tab-filter-suspicious" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeFilter === "suspicious" ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs border border-rose-300/50 dark:border-rose-700/50" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}">
                  <span>🚨 Aktivitas Mencurigakan (${suspiciousEvents.length})</span>
                  ${suspiciousEvents.length > 0 ? '<span class="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold uppercase">Prioritas Guru</span>' : ''}
                </button>
                <button type="button" id="tab-filter-all" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeFilter === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-300 dark:border-slate-600" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}">
                  <span>📋 Seluruh Aktivitas Siswa (${allEvents.length})</span>
                  ${suspiciousEvents.length === 0 ? '<span class="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-extrabold uppercase">Sesi Tertib</span>' : ''}
                </button>
              </div>
              <span class="text-[10.5px] text-slate-500 dark:text-slate-400">
                ${activeFilter === "suspicious" ? "Menampilkan aktivitas anomali / AI saja" : "Menampilkan seluruh riwayat per butir soal"}
              </span>
            </div>

            <!-- Timeline Events List Container -->
            <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              ${activeFilter === "all" && suspiciousEvents.length === 0 ? `
                <div class="p-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span class="font-bold">Linimasa Runtut Aktivitas Siswa (Pengerjaan Tertib &amp; Normal)</span>
                  </div>
                  <span class="font-mono text-[10.5px] text-emerald-700 dark:text-emerald-400">${allEvents.length} Catatan Terekam</span>
                </div>
              ` : ""}

              ${activeList.length === 0 ? `
                <div class="p-6 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 space-y-2">
                  <div class="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold">✓</div>
                  <div class="font-extrabold text-sm text-slate-900 dark:text-white">Tidak Ada Aktivitas Mencurigakan!</div>
                  <p class="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Siswa fokus pada soal dan pengerjaan berjalan tertib. Tidak ditemukan pembukaan Chat Matrix AI, Google Lens, screenshot layar, ataupun manipulasi clipboard.
                  </p>
                </div>
              ` : activeList.map(renderEventItem).join("")}
            </div>

            <!-- Verifikasi Peneliti & Form Catatan Guru -->
            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <h4 class="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <span>Keputusan Evaluasi Manual Guru:</span>
              </h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-600 dark:text-slate-400 mb-1">Status Verifikasi:</label>
                  <select id="modal-review-status" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium">
                    <option value="unreviewed" ${s.reviewStatus === "unreviewed" ? "selected" : ""}>Belum Ditinjau</option>
                    <option value="reviewed_normal" ${s.reviewStatus === "reviewed_normal" ? "selected" : ""}>Terverifikasi Wajar (Disetujui Guru)</option>
                    <option value="reviewed_flagged" ${s.reviewStatus === "reviewed_flagged" ? "selected" : ""}>Ditandai Perlu Konfirmasi Tambahan</option>
                  </select>
                </div>

                <div>
                  <label class="block font-bold text-slate-600 dark:text-slate-400 mb-1">Catatan Pendidik:</label>
                  <input type="text" id="modal-review-notes" value="${s.researcherNotes || ""}" placeholder="Contoh: Siswa konfirmasi gangguan jaringan..." class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" />
                </div>
              </div>

              <div class="pt-2 flex justify-end gap-2">
                <button type="button" id="btn-cancel-timeline" class="btn-secondary text-xs px-3 py-2 font-semibold cursor-pointer">
                  Tutup
                </button>
                <button type="button" id="btn-save-review-decision" class="btn-primary text-xs px-4 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  <span>Simpan Catatan Guru</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      `;

      // Event handlers
      const doClose = () => { modalContainer.innerHTML = ""; };
      modalContainer.querySelector("#btn-close-timeline-modal")?.addEventListener("click", doClose);
      modalContainer.querySelector("#btn-cancel-timeline")?.addEventListener("click", doClose);
      modalContainer.querySelector("#timeline-modal-backdrop")?.addEventListener("click", (e) => {
        if (e.target.id === "timeline-modal-backdrop") doClose();
      });

      // Filter tabs switch
      modalContainer.querySelector("#tab-filter-suspicious")?.addEventListener("click", () => {
        activeFilter = "suspicious";
        renderModalContent();
      });
      modalContainer.querySelector("#tab-filter-all")?.addEventListener("click", () => {
        activeFilter = "all";
        renderModalContent();
      });

      // Save decision
      modalContainer.querySelector("#btn-save-review-decision")?.addEventListener("click", () => {
        const status = modalContainer.querySelector("#modal-review-status")?.value;
        const notes = modalContainer.querySelector("#modal-review-notes")?.value;
        integrityService.updateSessionReview(sessionId, status, notes);
        if (typeof showToast === "function") {
          showToast("Status tinjauan integritas berhasil disimpan!", "success");
        } else {
          alert("Status tinjauan integritas berhasil diperbarui!");
        }
        doClose();
        this.render();
      });
    };

    renderModalContent();
  }

  /**
   * Seeding sesi contoh untuk visualisasi instan peneliti dengan contoh aktivitas mencurigakan
   */
  seedSampleSessions() {
    const samples = [
      {
        sessionId: "ses_pre_sample_01",
        assessmentId: "asm_pre_math",
        testType: "pretest",
        subject: "matematika",
        studentClass: "XI MIPA 1",
        studentId: "xi_c_01",
        studentName: "Adysha Alfiana",
        startTime: Date.now() - 3600000 * 2,
        endTime: Date.now() - 3600000 * 2 + 1500000,
        events: [
          { eventType: "assessment_started", timestamp: Date.now() - 7200000, metadata: { testType: "pretest", isSuspicious: false } },
          { eventType: "question_opened", timestamp: Date.now() - 7180000, metadata: { questionIndex: 1, questionId: "PRE_Q01", isSuspicious: false } },
          { eventType: "answer_changed", timestamp: Date.now() - 7120000, metadata: { selectedValue: "B", isSuspicious: false } },
          { eventType: "question_opened", timestamp: Date.now() - 7115000, metadata: { questionIndex: 2, questionId: "PRE_Q02", isSuspicious: false } },
          { eventType: "rapid_guess", timestamp: Date.now() - 7113000, metadata: { questionId: "PRE_Q02", durationSeconds: 2, isSuspicious: false, summary: "Pengerjaan kilat (~2 detik - Siswa tebak cepat / ngasal)" } },
          { eventType: "answer_changed", timestamp: Date.now() - 7060000, metadata: { selectedValue: "A", isSuspicious: false } },
          { eventType: "assessment_submitted", timestamp: Date.now() - 5700000, metadata: { totalDurationSeconds: 1500, isSuspicious: false } }
        ],
        signals: {
          tabSwitches: 0,
          totalInactiveSeconds: 0,
          rapidAnswersCount: 1,
          answerChangesCount: 2,
          matrixAiOpenedCount: 0,
          googleLensAttempts: 0,
          screenshotAttempts: 0,
          clipboardAttempts: 0,
          devToolsAttempts: 0,
          reviewRecommended: false,
          reasons: []
        },
        reviewStatus: "reviewed_normal",
        researcherNotes: "Pengerjaan tertib dan normal. Menjawab cepat di butir #2 (indikasi tebak acak/ngasal)."
      },
      {
        sessionId: "ses_diag_sample_02",
        assessmentId: "asm_diag_math",
        testType: "diagnostic",
        subject: "matematika",
        studentClass: "XI MIPA 1",
        studentId: "xi_c_06",
        studentName: "Dzaky Irfanul Hakim",
        startTime: Date.now() - 3600000 * 4,
        endTime: Date.now() - 3600000 * 4 + 1800000,
        events: [
          { eventType: "assessment_started", timestamp: Date.now() - 14400000, metadata: { testType: "diagnostic", isSuspicious: false } },
          { eventType: "question_opened", timestamp: Date.now() - 14380000, metadata: { questionIndex: 1, questionId: "Q1", isSuspicious: false } },
          { eventType: "tab_hidden", timestamp: Date.now() - 14350000, metadata: { switchNumber: 1, isSuspicious: true, summary: "Meninggalkan tab asesmen (Pindah Tab #1)" } },
          { eventType: "tab_visible", timestamp: Date.now() - 14320000, metadata: { inactiveDurationSeconds: 30, isSuspicious: true, summary: "Kembali ke tab asesmen setelah inaktif selama 30 detik" } },
          { eventType: "matrix_ai_opened", timestamp: Date.now() - 14300000, metadata: { isSuspicious: true, summary: "Membuka asisten Chat Matrix AI saat asesmen sedang berjalan" } },
          { eventType: "google_lens_attempt", timestamp: Date.now() - 14280000, metadata: { method: "Klik Kanan Soal (Menu Konteks: Cari dengan Google Lens)", isSuspicious: true, summary: "Klik kanan pada konten soal (Menu Konteks: Cari dengan Google Lens)" } },
          { eventType: "screenshot_attempt", timestamp: Date.now() - 14250000, metadata: { method: "Win+Shift+S", isSuspicious: true, summary: "Upaya tangkapan layar terdeteksi (Shortcut Win+Shift+S)" } },
          { eventType: "answer_changed", timestamp: Date.now() - 14210000, metadata: { selectedValue: "C", isSuspicious: false } },
          { eventType: "assessment_submitted", timestamp: Date.now() - 12600000, metadata: { totalDurationSeconds: 1800, isSuspicious: false } }
        ],
        signals: {
          tabSwitches: 1,
          totalInactiveSeconds: 30,
          rapidAnswersCount: 0,
          answerChangesCount: 1,
          matrixAiOpenedCount: 1,
          googleLensAttempts: 1,
          screenshotAttempts: 1,
          clipboardAttempts: 0,
          devToolsAttempts: 0,
          reviewRecommended: true,
          reasons: [
            "1x membuka Chat Matrix AI saat asesmen berlangsung",
            "1x indikasi pencarian Google Lens / AI eksternal",
            "1x upaya tangkapan layar (Shortcut Win+Shift+S)",
            "Total durasi tab tidak aktif selama 30 detik"
          ]
        },
        reviewStatus: "unreviewed",
        researcherNotes: ""
      },
      {
        sessionId: "ses_post_sample_03",
        assessmentId: "asm_post_physics",
        testType: "posttest",
        subject: "fisika",
        studentClass: "XI MIPA 2",
        studentId: "xi_mipa2_14",
        studentName: "Muhammad Rayhan Pratama",
        startTime: Date.now() - 3600000 * 1,
        endTime: Date.now() - 3600000 * 1 + 1600000,
        events: [
          { eventType: "assessment_started", timestamp: Date.now() - 3600000, metadata: { testType: "posttest", isSuspicious: false } },
          { eventType: "question_opened", timestamp: Date.now() - 3550000, metadata: { questionIndex: 1, questionId: "PHYS_Q01", isSuspicious: false } },
          { eventType: "answer_changed", timestamp: Date.now() - 3400000, metadata: { selectedValue: "B", isSuspicious: false } },
          { eventType: "question_opened", timestamp: Date.now() - 3380000, metadata: { questionIndex: 2, questionId: "PHYS_Q02", isSuspicious: false } },
          { eventType: "answer_changed", timestamp: Date.now() - 3200000, metadata: { selectedValue: "D", isSuspicious: false } },
          { eventType: "assessment_submitted", timestamp: Date.now() - 2000000, metadata: { totalDurationSeconds: 1600, isSuspicious: false } }
        ],
        signals: {
          tabSwitches: 0,
          totalInactiveSeconds: 0,
          rapidAnswersCount: 0,
          answerChangesCount: 2,
          matrixAiOpenedCount: 0,
          googleLensAttempts: 0,
          screenshotAttempts: 0,
          clipboardAttempts: 0,
          devToolsAttempts: 0,
          reviewRecommended: false,
          reasons: []
        },
        reviewStatus: "reviewed_normal",
        researcherNotes: "Pengerjaan Post-Test Fisika tertib dan lancar. Fokus penuh."
      },
      {
        sessionId: "ses_pre_sample_04",
        assessmentId: "asm_pre_physics",
        testType: "pretest",
        subject: "fisika",
        studentClass: "XI MIPA 2",
        studentId: "xi_mipa2_22",
        studentName: "Siti Rahmawati",
        startTime: Date.now() - 3600000 * 3,
        endTime: Date.now() - 3600000 * 3 + 1200000,
        events: [
          { eventType: "assessment_started", timestamp: Date.now() - 10800000, metadata: { testType: "pretest", isSuspicious: false } },
          { eventType: "question_opened", timestamp: Date.now() - 10780000, metadata: { questionIndex: 1, questionId: "PHYS_PRE_01", isSuspicious: false } },
          { eventType: "tab_hidden", timestamp: Date.now() - 10750000, metadata: { switchNumber: 1, isSuspicious: true, summary: "Pindah tab saat pengerjaan Pre-Test Fisika" } },
          { eventType: "tab_visible", timestamp: Date.now() - 10700000, metadata: { inactiveDurationSeconds: 50, isSuspicious: true, summary: "Kembali ke lembar ujian setelah 50 detik di luar jendela" } },
          { eventType: "google_lens_attempt", timestamp: Date.now() - 10680000, metadata: { method: "Pencarian Gambar Eksternal", isSuspicious: true, summary: "Indikasi pencarian soal menggunakan Google Lens" } },
          { eventType: "answer_changed", timestamp: Date.now() - 10650000, metadata: { selectedValue: "A", isSuspicious: false } },
          { eventType: "assessment_submitted", timestamp: Date.now() - 9600000, metadata: { totalDurationSeconds: 1200, isSuspicious: false } }
        ],
        signals: {
          tabSwitches: 1,
          totalInactiveSeconds: 50,
          rapidAnswersCount: 0,
          answerChangesCount: 1,
          matrixAiOpenedCount: 0,
          googleLensAttempts: 1,
          screenshotAttempts: 0,
          clipboardAttempts: 0,
          devToolsAttempts: 0,
          reviewRecommended: true,
          reasons: [
            "1x indikasi pencarian Google Lens / AI eksternal",
            "Total durasi tab tidak aktif selama 50 detik"
          ]
        },
        reviewStatus: "unreviewed",
        researcherNotes: ""
      }
    ];

    samples.forEach(s => {
      const all = integrityService.getAllSessions();
      const existingIdx = all.findIndex(item => item.sessionId === s.sessionId);
      if (existingIdx >= 0) {
        all[existingIdx] = s;
        try {
          localStorage.setItem("epe_integrity_sessions_v1", JSON.stringify(all));
        } catch (e) {}
      } else {
        integrityService.saveSession(s);
      }
    });
    return samples;
  }
}
