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
    this.searchQuery = "";
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

    // Auto-seed sample sessions if empty (agar ada data demonstrasi riil untuk peneliti)
    if (sessions.length === 0) {
      sessions = this.seedSampleSessions();
    }

    const totalSessions = sessions.length;
    const normalCount = sessions.filter(s => !s.signals.reviewRecommended).length;
    const reviewCount = sessions.filter(s => s.signals.reviewRecommended).length;

    // Filter
    if (this.filterStatus === "normal") {
      sessions = sessions.filter(s => !s.signals.reviewRecommended);
    } else if (this.filterStatus === "review_recommended") {
      sessions = sessions.filter(s => s.signals.reviewRecommended);
    }

    if (this.searchQuery.trim()) {
      const qLower = this.searchQuery.toLowerCase();
      sessions = sessions.filter(s => 
        s.studentName.toLowerCase().includes(qLower) || 
        s.testType.toLowerCase().includes(qLower) ||
        s.sessionId.toLowerCase().includes(qLower)
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
              <button id="btn-toggle-creator-antidetector" class="py-1.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 ${isAntiActive ? 'bg-purple-500/15 dark:bg-purple-950/40 border-purple-500/40 text-purple-600 dark:text-purple-300 shadow-sm shadow-purple-500/10 ring-1 ring-purple-500/30' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}" title="Klik untuk mengaktifkan/menonaktifkan Creator Anti-Detector Bypass">
                <span class="relative flex items-center justify-center w-3.5 h-3.5 shrink-0 ${isAntiActive ? 'text-purple-400' : 'text-slate-400'}">
                  <svg class="w-3.5 h-3.5 ${isAntiActive ? 'animate-pulse' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 22,12 12,22 2,12" fill="${isAntiActive ? 'currentColor' : 'none'}" fill-opacity="${isAntiActive ? '0.28' : '0'}"/>
                    <polygon points="12,7 17,12 12,17 7,12" stroke-width="1.5"/>
                    <rect x="11" y="11" width="2" height="2" fill="currentColor"/>
                  </svg>
                </span>
                <svg class="w-3.5 h-3.5 ${isAntiActive ? 'text-purple-400' : 'text-slate-400'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z" stroke-linejoin="round"/>
                  <path d="M12 8V16M8 12H16" stroke-linecap="round"/>
                </svg>
                <span>Anti-Detector:</span>
                <span class="px-1.5 py-0.2 rounded text-[9.5px] uppercase ${isAntiActive ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 font-extrabold' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}">
                  ${isAntiActive ? 'ACTIVE ⚡' : 'BYPASS OFF'}
                </span>
              </button>

              <button id="btn-export-integrity-log" class="btn-secondary py-1.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5" title="Ekspor Log Telemetri ke JSON">
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
              <span class="text-[10px] text-slate-500">Responden Asesmen</span>
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

            <div class="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-1">
              <span class="text-[10.5px] font-bold uppercase text-purple-600 dark:text-purple-400">Creator Anti-Detector</span>
              <div class="text-xl font-extrabold text-purple-600 dark:text-purple-400">${isAntiActive ? "Aktif ⚡" : "Siap"}</div>
              <span class="text-[10px] text-purple-600/80 dark:text-purple-400/70">100% Non-Invasif</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Controls -->
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

          <div class="relative w-full sm:w-64">
            <input 
              type="text" 
              id="input-search-integrity" 
              value="${this.searchQuery}"
              placeholder="Cari nama siswa atau ID sesi..." 
              class="w-full text-xs py-2 pl-8 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-amber-500"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
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
                  <th class="px-3.5 py-3 font-bold text-center">Jawaban Kilat (&lt;3s)</th>
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
                  const isCreatorBypass = Boolean(s.signals.isCreatorBypass || s.isCreatorSession);
                  const isFlagged = !isCreatorBypass && s.signals.reviewRecommended;
                  const timeFormatted = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateFormatted = new Date(s.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' });

                  let reviewBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700">Belum Ditinjau</span>';
                  if (isCreatorBypass || s.reviewStatus === "reviewed_normal") {
                    reviewBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"><svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17L4 12"/></svg> Terverifikasi Normal</span>';
                  } else if (s.reviewStatus === "reviewed_flagged") {
                    reviewBadge = '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"><svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8V12M12 16H12.01"/></svg> Ditandai Guru</span>';
                  }

                  return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-3.5 py-2.5 font-bold text-slate-900 dark:text-white">
                        <div class="flex items-center gap-1.5">
                          <span>${s.studentName}</span>
                          ${isCreatorBypass ? `
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">CREATOR</span>
                          ` : ""}
                        </div>
                        <div class="text-[10px] font-mono font-normal text-slate-500">${s.studentId}</div>
                      </td>
                      <td class="px-3.5 py-2.5">
                        <span class="capitalize font-bold text-slate-800 dark:text-slate-200">${s.testType}</span>
                        <div class="text-[10px] text-slate-500 font-mono">${dateFormatted} &bull; ${timeFormatted}</div>
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-bold ${s.signals.tabSwitches > 0 ? (isCreatorBypass ? "text-purple-400" : "text-amber-500") : "text-slate-400"}">
                        ${s.signals.tabSwitches}x
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-bold ${s.signals.totalInactiveSeconds > 0 ? (isCreatorBypass ? "text-purple-400" : "text-amber-500") : "text-slate-400"}">
                        ${s.signals.totalInactiveSeconds}s
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-bold ${s.signals.rapidAnswersCount > 0 ? (isCreatorBypass ? "text-purple-400" : "text-amber-500") : "text-slate-400"}">
                        ${s.signals.rapidAnswersCount}
                      </td>
                      <td class="px-3.5 py-2.5">
                        ${isCreatorBypass ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 shadow-xs">
                            <svg class="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z"/>
                              <path d="M12 8V16M8 12H16"/>
                            </svg>
                            <span>Creator Anti-Detector</span>
                          </span>
                        ` : isFlagged ? `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            <svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8V12M12 16H12.01"/></svg>
                            <span>Review Recommended</span>
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <span>Normal Activity</span>
                          </span>
                        `}
                      </td>
                      <td class="px-3.5 py-2.5">
                        ${reviewBadge}
                      </td>
                      <td class="px-3.5 py-2.5 text-right">
                        <button data-audit-id="${s.sessionId}" class="btn-secondary py-1.5 px-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-white flex items-center gap-1.5 ml-auto shadow-2xs">
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

    // Filter buttons
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
   */
  openTimelineModal(sessionId) {
    const s = integrityService.getSessionById(sessionId);
    if (!s) return;

    const modalContainer = this.container.querySelector("#integrity-modal-container");
    if (!modalContainer) return;

    const isCreatorBypass = Boolean(s.signals.isCreatorBypass || s.isCreatorSession);

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="card-clean max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl my-8">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg class="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Linimasa Telemetri Pengerjaan</span>
                </h3>
                <span class="font-mono text-xs text-indigo-500 font-bold">${s.studentName}</span>
                ${isCreatorBypass ? `
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">CREATOR</span>
                ` : ""}
              </div>
              <p class="text-xs text-slate-500">ID Sesi: ${s.sessionId} &bull; Tipe: ${s.testType}</p>
            </div>
            <button id="btn-close-timeline-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg leading-none p-1">&times;</button>
          </div>

          <!-- Ringkasan Sinyal Objektif -->
          <div class="p-3.5 rounded-xl ${isCreatorBypass ? "bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300" : s.signals.reviewRecommended ? "bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300"} text-xs space-y-1.5 leading-relaxed">
            <div class="font-bold flex items-center gap-2">
              ${isCreatorBypass ? `
                <span class="w-5 h-5 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L3 6.5V11.5C3 16.5 6.8 21.2 12 22.5C17.2 21.2 21 16.5 21 11.5V6.5L12 2Z"/>
                    <path d="M12 8V16M8 12H16"/>
                  </svg>
                </span>
                <span>Creator Anti-Detector Bypass (Status: Verified Safe)</span>
              ` : s.signals.reviewRecommended ? `
                <span class="w-5 h-5 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 22,20 2,20"/>
                    <line x1="12" y1="8" x2="12" y2="13"/>
                    <circle cx="12" cy="16.5" r="0.75" fill="currentColor"/>
                  </svg>
                </span>
                <span>Sinyal Integritas: Review Recommended</span>
              ` : `
                <span class="w-5 h-5 rounded-lg flex items-center justify-center bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span>Sinyal Integritas: Normal Activity</span>
              `}
            </div>
            ${s.signals.reasons.length > 0 ? `
              <ul class="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                ${s.signals.reasons.map(r => `<li>${r}</li>`).join("")}
              </ul>
            ` : `<p class="text-[11px] opacity-90">${isCreatorBypass ? "Sesi dijalankan dalam proteksi Creator Anti-Detector (telemetri aman dari penandaan)." : "Tidak ditemukan anomali perpindahan jendela atau pola waktu yang mencurigakan."}</p>`}
          </div>

          <!-- Timeline List -->
          <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
              <span>Rekam Jejak Urutan Peristiwa:</span>
            </h4>
            
            <div class="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-4 space-y-3 font-mono text-[11px]">
              ${s.events.map(ev => {
                const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                
                let iconSvg = `<svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>`;
                let textDesc = ev.eventType;
                let colorClass = "text-slate-700 dark:text-slate-300";
                let badgeBg = "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700";

                if (ev.eventType === "assessment_started") {
                  iconSvg = `<svg class="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6,4 20,12 6,20"/></svg>`;
                  textDesc = `Asesmen dimulai (${ev.metadata.testType})`;
                  colorClass = "text-emerald-500 font-bold";
                  badgeBg = "bg-emerald-500/10 border-emerald-500/30";
                } else if (ev.eventType === "question_opened") {
                  iconSvg = `<svg class="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>`;
                  textDesc = `Membuka butir soal ${ev.metadata.questionIndex} (${ev.metadata.questionId})`;
                  badgeBg = "bg-indigo-500/10 border-indigo-500/30";
                } else if (ev.eventType === "answer_changed") {
                  iconSvg = `<svg class="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
                  textDesc = `Memilih/mengubah opsi jawaban menjadi [${ev.metadata.selectedValue}]`;
                  badgeBg = "bg-cyan-500/10 border-cyan-500/30";
                } else if (ev.eventType === "tab_hidden") {
                  iconSvg = `<svg class="w-3 h-3 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,20 2,20"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.75" fill="currentColor"/></svg>`;
                  textDesc = `Tab peramban beralih / jendela disembunyikan (Kejadian #${ev.metadata.switchNumber})`;
                  colorClass = isCreatorBypass ? "text-purple-400 font-bold" : "text-amber-500 font-bold";
                  badgeBg = isCreatorBypass ? "bg-purple-500/15 border-purple-500/30" : "bg-amber-500/15 border-amber-500/40";
                } else if (ev.eventType === "tab_visible") {
                  iconSvg = `<svg class="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/></svg>`;
                  textDesc = `Kembali ke tab asesmen (Durasi jeda: ${ev.metadata.inactiveDurationSeconds} detik)`;
                  colorClass = "text-blue-400";
                  badgeBg = "bg-blue-500/10 border-blue-500/30";
                } else if (ev.eventType === "assessment_submitted") {
                  iconSvg = `<svg class="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
                  textDesc = `Asesmen selesai & dikirimkan (Total durasi: ${ev.metadata.totalDurationSeconds} detik)`;
                  colorClass = "text-emerald-500 font-bold";
                  badgeBg = "bg-emerald-500/10 border-emerald-500/30";
                }

                return `
                  <div class="relative group pl-2">
                    <span class="absolute -left-[27px] top-0.5 w-5 h-5 rounded-md flex items-center justify-center border ${badgeBg} shadow-2xs">
                      ${iconSvg}
                    </span>
                    <div class="flex items-center gap-2">
                      <span class="text-slate-400 text-[10px]">${timeStr}</span>
                      <span class="${colorClass}">${textDesc}</span>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Verifikasi Peneliti Form -->
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
              <button type="button" id="btn-cancel-timeline" class="btn-secondary text-xs px-3 py-2 font-semibold">
                Tutup
              </button>
              <button type="button" id="btn-save-review-decision" class="btn-primary text-xs px-4 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5">
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

    const closeBtn = modalContainer.querySelector("#btn-close-timeline-modal");
    const cancelBtn = modalContainer.querySelector("#btn-cancel-timeline");
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    cancelBtn?.addEventListener("click", doClose);

    // Save decision
    modalContainer.querySelector("#btn-save-review-decision")?.addEventListener("click", () => {
      const status = modalContainer.querySelector("#modal-review-status")?.value;
      const notes = modalContainer.querySelector("#modal-review-notes")?.value;
      integrityService.updateSessionReview(sessionId, status, notes);
      alert("Status tinjauan integritas berhasil diperbarui!");
      doClose();
      this.render();
    });
  }

  /**
   * Seeding sesi contoh untuk visualisasi instan peneliti
   */
  seedSampleSessions() {
    const samples = [
      {
        sessionId: "ses_pre_sample_01",
        assessmentId: "asm_pre_math",
        testType: "pretest",
        studentId: "xi_c_01",
        studentName: "Adysha Alfiana",
        startTime: Date.now() - 3600000 * 2,
        endTime: Date.now() - 3600000 * 2 + 1500000,
        events: [
          { eventType: "assessment_started", timestamp: Date.now() - 7200000, metadata: { testType: "pretest" } },
          { eventType: "question_opened", timestamp: Date.now() - 7180000, metadata: { questionIndex: 1, questionId: "PRE_Q01" } },
          { eventType: "answer_changed", timestamp: Date.now() - 7120000, metadata: { selectedValue: "B" } },
          { eventType: "question_opened", timestamp: Date.now() - 7115000, metadata: { questionIndex: 2, questionId: "PRE_Q02" } },
          { eventType: "answer_changed", timestamp: Date.now() - 7060000, metadata: { selectedValue: "A" } },
          { eventType: "assessment_submitted", timestamp: Date.now() - 5700000, metadata: { totalDurationSeconds: 1500 } }
        ],
        signals: {
          tabSwitches: 0,
          totalInactiveSeconds: 0,
          rapidAnswersCount: 0,
          answerChangesCount: 2,
          reviewRecommended: false,
          reasons: []
        },
        reviewStatus: "reviewed_normal",
        researcherNotes: "Pengerjaan stabil dan konsisten."
      },
      {
        sessionId: "ses_diag_sample_02",
        assessmentId: "asm_diag_math",
        testType: "diagnostic",
        studentId: "xi_c_06",
        studentName: "Dzaky Irfanul Hakim",
        startTime: Date.now() - 3600000 * 4,
        endTime: Date.now() - 3600000 * 4 + 1800000,
        events: [
          { eventType: "assessment_started", timestamp: Date.now() - 14400000, metadata: { testType: "diagnostic" } },
          { eventType: "question_opened", timestamp: Date.now() - 14380000, metadata: { questionIndex: 1, questionId: "Q1" } },
          { eventType: "tab_hidden", timestamp: Date.now() - 14350000, metadata: { switchNumber: 1 } },
          { eventType: "tab_visible", timestamp: Date.now() - 14320000, metadata: { inactiveDurationSeconds: 30 } },
          { eventType: "answer_changed", timestamp: Date.now() - 14310000, metadata: { selectedValue: "C" } },
          { eventType: "tab_hidden", timestamp: Date.now() - 14280000, metadata: { switchNumber: 2 } },
          { eventType: "tab_visible", timestamp: Date.now() - 14255000, metadata: { inactiveDurationSeconds: 25 } },
          { eventType: "tab_hidden", timestamp: Date.now() - 14200000, metadata: { switchNumber: 3 } },
          { eventType: "tab_visible", timestamp: Date.now() - 14180000, metadata: { inactiveDurationSeconds: 20 } },
          { eventType: "assessment_submitted", timestamp: Date.now() - 12600000, metadata: { totalDurationSeconds: 1800 } }
        ],
        signals: {
          tabSwitches: 3,
          totalInactiveSeconds: 75,
          rapidAnswersCount: 0,
          answerChangesCount: 1,
          reviewRecommended: true,
          reasons: [
            "3 kali berpindah tab selama pengerjaan",
            "Total durasi tab tidak aktif selama 75 detik"
          ]
        },
        reviewStatus: "unreviewed",
        researcherNotes: ""
      }
    ];

    samples.forEach(s => integrityService.saveSession(s));
    return samples;
  }
}
