/**
 * questionBankUI.js - Researcher/Teacher Question Bank & Assessment Authoring UI
 * 
 * Antarmuka Authoring Terpadu di Mode Guru (Terproteksi PIN Pendidik):
 * - Membuat, mengedit, menduplikasi, dan menghapus butir soal
 * - Pratinjau langsung formula KaTeX & opsi jawaban (Portal Body Anti-Blank)
 * - Menugaskan soal ke Pre-Test, Diagnostik, atau Post-Test
 * - Fitur Tambah Bidang / Mata Pelajaran Baru Dinamis (+ Tambah Halaman Bidang)
 * - Fitur Tambah Sub-Halaman / Bab Materi Terpadu (contoh: Persamaan Kuadrat pada Matematika)
 * - Ekspor & Impor Bank Soal (JSON/CSV)
 */

import { AssessmentManager } from "../research/assessmentManager.js";
import { SubjectRegistry } from "../engine/universal/subjectRegistry.js";
import { UniversalQuestion, QUESTION_TYPES } from "../data/questionModel.js";
import { NotificationToast } from "./notification.js";

export class QuestionBankUI {
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
    // Default fokus langsung ke Matematika agar kumpulan bab & pengerjaan langsung terlihat
    this.currentFilterSubject = "mathematics";
    this.currentFilterTopic = null; // null = semua sub-halaman
    this.searchQuery = "";
    this.selectedQuestionForEdit = null;
    this.isEditing = false;
  }

  /**
   * Helper Portal Modal ke document.body
   * Menghindari perangkap CSS transform/scale pada parent container sehingga modal tidak pernah blank/terpotong.
   */
  getModalContainer() {
    let el = document.getElementById("qbank-portal-container");
    if (!el) {
      el = document.createElement("div");
      el.id = "qbank-portal-container";
      el.className = "qbank-portal-root";
      el.style.cssText = "position: fixed !important; inset: 0 !important; z-index: 2000050 !important; pointer-events: none !important;";
      document.body.appendChild(el);
    } else {
      el.style.cssText = "position: fixed !important; inset: 0 !important; z-index: 2000050 !important; pointer-events: none !important;";
    }
    return el;
  }

  /**
   * Render Tampilan Utama Bank Soal di Mode Guru
   */
  render() {
    if (!this.container && this.containerId && typeof document !== "undefined") {
      this.container = document.getElementById(this.containerId);
    }
    if (!this.container) return;

    const subjects = SubjectRegistry.getAllSubjects();
    const filterOptions = {
      subject: this.currentFilterSubject === "all" ? null : this.currentFilterSubject
    };
    let questions = AssessmentManager.getAllQuestions(filterOptions);

    // Filter berdasarkan sub-halaman / topik jika dipilih
    if (this.currentFilterTopic) {
      questions = questions.filter(q => q.topic === this.currentFilterTopic);
    }

    // Filter pencarian teks
    if (this.searchQuery.trim()) {
      const qLower = this.searchQuery.toLowerCase();
      questions = questions.filter(q => 
        (q.question_text && q.question_text.toLowerCase().includes(qLower)) || 
        (q.topic && q.topic.toLowerCase().includes(qLower)) || 
        (q.id && q.id.toLowerCase().includes(qLower))
      );
    }

    const currentSubj = this.currentFilterSubject !== "all" 
      ? SubjectRegistry.getSubject(this.currentFilterSubject) 
      : null;

    const allSubjectQuestions = currentSubj 
      ? AssessmentManager.getAllQuestions({ subject: currentSubj.id }) 
      : [];

    const currentTopics = currentSubj 
      ? SubjectRegistry.getTopicsForSubject(currentSubj.id) 
      : [];

    this.container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Action Controls -->
        <div class="card-clean p-5 sm:p-6 bg-[#18110b] text-slate-100 border-2 border-amber-500/40 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Authoring Suite &bull; Subject-Agnostic
              </span>
              <span class="text-xs text-amber-200/80 font-semibold">Total: ${questions.length} Butir Soal Terfilter</span>
            </div>
            <h3 class="text-lg sm:text-2xl font-black text-white tracking-tight">
              Bank Soal &amp; Pengelolaan Asesmen Terpadu
            </h3>
            <p class="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Kumpulan pengerjaan soal terstruktur berdasarkan bidang (Matematika, Fisika, Kimia, Biologi, Informatika) dan sub-halaman / bab (seperti Persamaan Kuadrat). Anda dapat menambah bidang atau bab baru dengan sekali klik.
            </p>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap">
            <button id="btn-create-new-question" class="btn-primary py-2.5 px-4 text-xs font-bold bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/30 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
              <span>+ Buat Soal Baru</span>
            </button>

            <button id="btn-add-subject-top" class="py-2.5 px-3.5 text-xs font-bold bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95">
              <svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
              <span>+ Tambah Bidang / Mapel</span>
            </button>

            <button id="btn-export-bank-json" class="btn-secondary py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer" title="Unduh cadangan Bank Soal dalam format JSON">
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Ekspor JSON</span>
            </button>

            <input type="file" id="input-import-bank-json" accept=".json" class="hidden" />
            <button id="btn-import-bank-json" class="btn-secondary py-2.5 px-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer" title="Unggah file JSON untuk menambahkan butir soal baru">
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Impor JSON</span>
            </button>
          </div>
        </div>

        <!-- Filter Subjek Tabs Row & Tambah Bidang -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Subject Pill Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-full">
            ${subjects.map(s => {
              const count = AssessmentManager.getAllQuestions({ subject: s.id }).length;
              const isActive = this.currentFilterSubject === s.id;
              return `
                <button data-filter-subject="${s.id}" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${isActive ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs" : "text-slate-400 hover:text-white"}">
                  <span class="shrink-0 flex items-center">${s.svgIcon || s.icon}</span>
                  <span>${s.name}</span>
                  <span class="text-[10px] font-mono opacity-80">(${count})</span>
                </button>
              `;
            }).join("")}

            <button data-filter-subject="all" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${this.currentFilterSubject === "all" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs" : "text-slate-400 hover:text-white"}">
              <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Semua Bidang (${AssessmentManager.getAllQuestions().length})</span>
            </button>

            <button id="btn-add-subject-tab" class="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer shrink-0">
              <svg class="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              <span>+ Bidang</span>
            </button>
          </div>

          <!-- Search Input -->
          <div class="relative w-full sm:w-64">
            <input 
              type="text" 
              id="input-search-qbank" 
              value="${this.searchQuery}"
              placeholder="Cari ID, teks, atau topik..." 
              class="w-full text-xs py-2 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
            />
            <svg class="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <!-- Section Kumpulan Pengerjaan & Sub-Halaman Bidang -->
        ${currentSubj ? `
          <div class="card-clean p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#18110b] to-slate-950 border border-amber-500/30 rounded-2xl space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                  ${currentSubj.svgIcon || currentSubj.icon}
                </span>
                <div>
                  <h4 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                    <span>Kumpulan Pengerjaan &amp; Sub-Halaman: <strong>${currentSubj.name}</strong></span>
                    ${this.currentFilterTopic ? `
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Bab: ${this.currentFilterTopic}
                      </span>
                    ` : ""}
                  </h4>
                  <p class="text-xs text-slate-300">
                    Satu bidang studi disatukan menjadi kumpulan bab pengerjaan terpadu. Klik bab untuk menyaring, atau buat butir soal langsung di bab tersebut.
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 flex-wrap">
                ${this.currentFilterTopic ? `
                  <button id="btn-clear-topic-filter" class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer">
                    <span>✕ Tampilkan Semua Bab</span>
                  </button>
                ` : ""}
                <button id="btn-add-subtopic-btn" class="btn-primary py-1.5 px-3.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                  <span>+ Tambah Sub-Halaman / Bab</span>
                </button>
              </div>
            </div>

            <!-- Sub-Halaman Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              ${currentTopics.length === 0 ? `
                <div class="col-span-full p-4 rounded-xl bg-slate-900/60 text-center text-xs text-slate-400 border border-slate-800">
                  Belum ada sub-halaman di bidang ${currentSubj.name}. Klik <strong>"+ Tambah Sub-Halaman / Bab"</strong> untuk membuatnya.
                </div>
              ` : currentTopics.map(top => {
                const count = allSubjectQuestions.filter(q => q.topic === top).length;
                const isSelected = this.currentFilterTopic === top;
                return `
                  <div class="p-3.5 rounded-xl border transition-all ${isSelected ? "bg-amber-950/40 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50" : "bg-slate-950/60 hover:bg-slate-900/80 border-slate-800 text-slate-300"} flex flex-col justify-between gap-2.5">
                    <div class="flex items-start justify-between gap-2">
                      <button type="button" class="btn-select-topic text-left font-bold text-xs hover:text-amber-300 transition-colors flex-1 cursor-pointer" data-topic="${top}">
                        <span class="block text-white font-extrabold text-[13px]">${top}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${count} Butir Soal</span>
                      </button>
                      ${isSelected ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[10px] font-mono font-bold shrink-0">Aktif</span>' : ""}
                    </div>
                    <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <button type="button" class="btn-select-topic text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer" data-topic="${top}">
                        <span>${isSelected ? "✓ Sedang Difilter" : "Buka Bab Ini →"}</span>
                      </button>
                      <button type="button" class="btn-create-in-topic text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer" data-topic="${top}">
                        <span>+ Buat Soal</span>
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : `
          <!-- Tampilan Ringkasan Kumpulan Pengerjaan Semua Bidang -->
          <div class="card-clean p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-[#18110b] to-slate-950 border border-amber-500/30 rounded-2xl space-y-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div>
                <h4 class="text-sm sm:text-base font-extrabold text-white">Kumpulan Pengerjaan Lintas Bidang Studi</h4>
                <p class="text-xs text-slate-300">Setiap bidang memiliki kumpulan sub-halaman / bab materi terstruktur. Klik sub-halaman untuk langsung menyaring.</p>
              </div>
              <button id="btn-add-subject-overview" class="btn-primary py-1.5 px-3 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                <span>+ Tambah Bidang Baru</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              ${subjects.map(s => {
                const topList = SubjectRegistry.getTopicsForSubject(s.id);
                const sCount = AssessmentManager.getAllQuestions({ subject: s.id }).length;
                return `
                  <div class="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">${s.svgIcon || s.icon}</span>
                        <span class="text-xs font-bold text-white">${s.name}</span>
                      </div>
                      <span class="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">${sCount} Soal</span>
                    </div>

                    <div class="flex flex-wrap gap-1">
                      ${topList.map(t => `
                        <button type="button" class="btn-select-topic-overview px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-colors cursor-pointer" data-subject="${s.id}" data-topic="${t}">
                          ${t}
                        </button>
                      `).join("")}
                    </div>

                    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <button type="button" class="btn-focus-subject text-cyan-400 font-bold hover:underline cursor-pointer" data-subject="${s.id}">Kelola Bidang Ini →</button>
                      <button type="button" class="btn-add-topic-quick text-amber-400 font-bold hover:underline cursor-pointer" data-subject="${s.id}">+ Bab Baru</button>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        `}

        <!-- Tabel Daftar Butir Soal -->
        <div class="card-clean bg-[#18110b] text-slate-100 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="text-[10.5px] uppercase bg-slate-950/80 text-amber-400/90 border-b border-slate-800 font-mono">
                <tr>
                  <th class="px-3.5 py-3 font-bold">ID Soal</th>
                  <th class="px-3.5 py-3 font-bold">Mata Pelajaran</th>
                  <th class="px-3.5 py-3 font-bold">Sub-Halaman / Topik</th>
                  <th class="px-3.5 py-3 font-bold">Tipe &amp; Kesulitan</th>
                  <th class="px-3.5 py-3 font-bold">Penugasan Asesmen</th>
                  <th class="px-3.5 py-3 font-bold text-center">Kunci</th>
                  <th class="px-3.5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80 font-medium">
                ${questions.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-8 text-center text-xs text-slate-400">
                      Tidak ada butir soal yang sesuai dengan kriteria filter saat ini.
                      <div class="mt-2">
                        <button type="button" class="btn-create-first-q px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer">
                          + Buat Soal Sekarang
                        </button>
                      </div>
                    </td>
                  </tr>
                ` : questions.map(q => {
                  const subj = SubjectRegistry.getSubject(q.subject);
                  const assigned = q.metadata?.assignedAssessments || [];
                  const diffColor = q.difficulty === "easy" ? "text-emerald-400" : q.difficulty === "hard" ? "text-rose-400" : "text-amber-400";

                  return `
                    <tr class="hover:bg-slate-900/60 transition-colors">
                      <td class="px-3.5 py-2.5 font-mono font-bold text-amber-400 text-[11px]">
                        ${q.id}
                      </td>
                      <td class="px-3.5 py-2.5">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-900 text-slate-200 border border-slate-800">
                          <span class="shrink-0 flex items-center">${subj.svgIcon || subj.icon}</span>
                          <span>${subj.name}</span>
                        </span>
                      </td>
                      <td class="px-3.5 py-2.5">
                        <div class="font-bold text-white line-clamp-1">${q.topic}</div>
                        <div class="text-[10px] text-slate-400 line-clamp-1">${q.question_text.slice(0, 55)}...</div>
                      </td>
                      <td class="px-3.5 py-2.5 text-[11px]">
                        <span class="font-mono text-slate-400 capitalize">${q.question_type.replace('_', ' ')}</span>
                        <span class="ml-1 font-bold ${diffColor}">(${q.difficulty})</span>
                      </td>
                      <td class="px-3.5 py-2.5">
                        <div class="flex items-center gap-1 flex-wrap">
                          ${assigned.length === 0 ? '<span class="text-[10px] text-slate-500">-</span>' : assigned.map(a => `
                            <span class="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              ${a}
                            </span>
                          `).join("")}
                        </div>
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-extrabold text-xs text-emerald-400">
                        ${q.correct_answer}
                      </td>
                      <td class="px-3.5 py-2.5 text-right">
                        <div class="inline-flex items-center gap-1">
                          <button data-action="preview" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:border-amber-400 transition-all shadow-xs cursor-pointer" title="Pratinjau Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button data-action="edit" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-amber-300 hover:border-amber-400 transition-all shadow-xs cursor-pointer" title="Edit Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button data-action="duplicate" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition-all shadow-xs cursor-pointer" title="Duplikasi Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                          <button data-action="delete" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-rose-400 hover:border-rose-400 transition-all shadow-xs cursor-pointer" title="Hapus Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
  }

  /**
   * Event Listeners untuk Interaksi UI
   */
  bindEvents() {
    // Filter Subject Tabs
    this.container.querySelectorAll("[data-filter-subject]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.currentFilterSubject = e.currentTarget.getAttribute("data-filter-subject");
        this.currentFilterTopic = null; // reset filter topik saat ganti subjek
        this.render();
      });
    });

    // Tombol Tambah Bidang / Mapel Baru
    this.container.querySelector("#btn-add-subject-top")?.addEventListener("click", () => {
      this.openAddSubjectModal();
    });
    this.container.querySelector("#btn-add-subject-tab")?.addEventListener("click", () => {
      this.openAddSubjectModal();
    });
    this.container.querySelector("#btn-add-subject-overview")?.addEventListener("click", () => {
      this.openAddSubjectModal();
    });

    // Tombol Fokus Bidang dari Tampilan Semua
    this.container.querySelectorAll(".btn-focus-subject").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const subjId = e.currentTarget.getAttribute("data-subject");
        this.currentFilterSubject = subjId;
        this.currentFilterTopic = null;
        this.render();
      });
    });

    // Tombol Cepat Tambah Bab dari Tampilan Semua
    this.container.querySelectorAll(".btn-add-topic-quick").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const subjId = e.currentTarget.getAttribute("data-subject");
        this.openAddTopicModal(subjId);
      });
    });

    // Tombol Pilih Topik dari Tampilan Semua
    this.container.querySelectorAll(".btn-select-topic-overview").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const subjId = e.currentTarget.getAttribute("data-subject");
        const topic = e.currentTarget.getAttribute("data-topic");
        this.currentFilterSubject = subjId;
        this.currentFilterTopic = topic;
        this.render();
      });
    });

    // Filter Topik / Sub-Halaman pada subjek aktif
    this.container.querySelectorAll(".btn-select-topic").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const topic = e.currentTarget.getAttribute("data-topic");
        this.currentFilterTopic = this.currentFilterTopic === topic ? null : topic;
        this.render();
      });
    });

    // Clear Topic Filter
    this.container.querySelector("#btn-clear-topic-filter")?.addEventListener("click", () => {
      this.currentFilterTopic = null;
      this.render();
    });

    // Tombol Tambah Sub-Halaman / Bab Baru
    this.container.querySelector("#btn-add-subtopic-btn")?.addEventListener("click", () => {
      if (this.currentFilterSubject === "all") {
        this.openAddTopicModal("mathematics");
      } else {
        this.openAddTopicModal(this.currentFilterSubject);
      }
    });

    // Tombol Buat Soal Langsung di Bab Ini
    this.container.querySelectorAll(".btn-create-in-topic").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const topic = e.currentTarget.getAttribute("data-topic");
        this.openAuthoringModal({
          subject: this.currentFilterSubject === "all" ? "mathematics" : this.currentFilterSubject,
          topic: topic
        });
      });
    });

    // Tombol Buat Soal Pertama jika tabel kosong
    this.container.querySelector(".btn-create-first-q")?.addEventListener("click", () => {
      this.openAuthoringModal(null);
    });

    // Search input
    const searchInput = this.container.querySelector("#input-search-qbank");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.render();
        const newSearch = this.container.querySelector("#input-search-qbank");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    // Tombol Buat Soal Baru Utama
    this.container.querySelector("#btn-create-new-question")?.addEventListener("click", () => {
      this.openAuthoringModal({
        subject: this.currentFilterSubject === "all" ? "mathematics" : this.currentFilterSubject,
        topic: this.currentFilterTopic || ""
      });
    });

    // Ekspor JSON
    this.container.querySelector("#btn-export-bank-json")?.addEventListener("click", () => {
      const dataStr = AssessmentManager.exportToJSON();
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bank_soal_epe_universal_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      NotificationToast.show("Bank Soal berhasil diekspor ke file JSON!", "success");
    });

    // Impor JSON
    const fileInput = this.container.querySelector("#input-import-bank-json");
    this.container.querySelector("#btn-import-bank-json")?.addEventListener("click", () => {
      fileInput?.click();
    });

    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target.result;
        const res = AssessmentManager.importFromJSON(content);
        if (res.success) {
          NotificationToast.show(`Berhasil mengimpor ${res.count} butir soal ke Bank Soal!`, "success");
          this.render();
        } else {
          NotificationToast.show(`Gagal impor: ${res.error}`, "error");
        }
      };
      reader.readAsText(file);
    });

    // Aksi Tabel Soal (Preview, Edit, Duplicate, Delete)
    this.container.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const action = e.currentTarget.getAttribute("data-action");
        const id = e.currentTarget.getAttribute("data-id");

        if (action === "preview") {
          this.openPreviewModal(id);
        } else if (action === "edit") {
          this.openAuthoringModal(id);
        } else if (action === "duplicate") {
          try {
            AssessmentManager.duplicateQuestion(id);
            NotificationToast.show(`Butir soal ${id} berhasil diduplikasi!`, "success");
            this.render();
          } catch (err) {
            NotificationToast.show(err.message, "error");
          }
        } else if (action === "delete") {
          if (confirm(`Yakin ingin menghapus butir soal ${id}?`)) {
            AssessmentManager.deleteQuestion(id);
            NotificationToast.show(`Butir soal ${id} berhasil dihapus!`, "info");
            this.render();
          }
        }
      });
    });
  }

  /**
   * Modal Tambah Bidang / Mata Pelajaran Baru Dinamis (+ Tambah Halaman)
   */
  openAddSubjectModal() {
    const modalContainer = this.getModalContainer();

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-[2000050] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="modal-add-subject-backdrop">
        <div class="relative w-full max-w-lg bg-[#18110b] text-slate-100 border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-white">Tambah Bidang / Mapel Baru</h3>
                <p class="text-xs text-slate-400">Buat halaman bidang studi baru yang terintegrasi penuh</p>
              </div>
            </div>
            <button id="btn-close-add-subj" class="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-base font-bold">&times;</button>
          </div>

          <form id="form-add-subject" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-amber-300 mb-1">Nama Bidang / Mata Pelajaran: *</label>
              <input type="text" id="new-subj-name" placeholder="Contoh: Astronomi, Ekonomi, Geografi, Sosiologi..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-medium focus:outline-none transition-colors" required />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-amber-300 mb-1">Kode Singkat (3-5 Huruf): *</label>
                <input type="text" id="new-subj-code" placeholder="Contoh: ASTRO, EKO" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-mono uppercase focus:outline-none transition-colors" required />
              </div>

              <div>
                <label class="block font-bold text-amber-300 mb-1">Warna Aksen:</label>
                <div class="flex items-center gap-2 pt-1">
                  <input type="color" id="new-subj-color" value="#06b6d4" class="w-9 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-700" />
                  <span class="text-slate-400 text-[11px]">Warna identitas bidang</span>
                </div>
              </div>
            </div>

            <div>
              <label class="block font-bold text-amber-300 mb-1">Deskripsi Singkat:</label>
              <input type="text" id="new-subj-desc" placeholder="Contoh: Tata Surya, Kosmologi, dan Gerak Planet" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-medium focus:outline-none transition-colors" />
            </div>

            <div>
              <label class="block font-bold text-amber-300 mb-1">Sub-Halaman / Bab Materi Awal (Pisahkan dengan koma):</label>
              <input type="text" id="new-subj-topics" placeholder="Contoh: Bab 1 Tata Surya, Bab 2 Bintang & Galaksi" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-white font-medium focus:outline-none transition-colors" />
              <p class="text-[10px] text-slate-400 mt-1">Anda dapat menambahkan sub-halaman tambahan kapan saja nanti.</p>
            </div>

            <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button type="button" id="btn-cancel-add-subj" class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 font-semibold cursor-pointer">
                Batal
              </button>
              <button type="submit" class="btn-primary px-5 py-2 rounded-xl text-white font-bold bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                <span>Simpan Bidang Baru</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const closeBtn = modalContainer.querySelector("#btn-close-add-subj");
    const cancelBtn = modalContainer.querySelector("#btn-cancel-add-subj");
    const backdrop = modalContainer.querySelector("#modal-add-subject-backdrop");
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    cancelBtn?.addEventListener("click", doClose);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) doClose();
    });

    const form = modalContainer.querySelector("#form-add-subject");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = modalContainer.querySelector("#new-subj-name")?.value.trim();
      const code = modalContainer.querySelector("#new-subj-code")?.value.trim();
      const accentColor = modalContainer.querySelector("#new-subj-color")?.value;
      const desc = modalContainer.querySelector("#new-subj-desc")?.value.trim();
      const topicsRaw = modalContainer.querySelector("#new-subj-topics")?.value.trim();

      const defaultTopics = topicsRaw 
        ? topicsRaw.split(",").map(t => t.trim()).filter(Boolean) 
        : [];

      try {
        const newSubj = SubjectRegistry.addSubject({
          code: code,
          name: name,
          accentColor: accentColor,
          description: desc,
          defaultTopics: defaultTopics
        });

        NotificationToast.show(`Bidang studi "${newSubj.name}" berhasil dibuat!`, "success");
        doClose();
        this.currentFilterSubject = newSubj.id;
        this.currentFilterTopic = null;
        this.render();
      } catch (err) {
        NotificationToast.show(err.message, "error");
      }
    });
  }

  /**
   * Modal Tambah Sub-Halaman / Bab Baru pada Bidang Aktif
   */
  openAddTopicModal(subjectId) {
    const subj = SubjectRegistry.getSubject(subjectId);
    if (!subj) return;

    const modalContainer = this.getModalContainer();

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-[2000050] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="modal-add-topic-backdrop">
        <div class="relative w-full max-w-md bg-[#18110b] text-slate-100 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-4 my-auto">
          
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0">
                ${subj.svgIcon || subj.icon}
              </div>
              <div>
                <h3 class="text-base font-extrabold text-white">Tambah Sub-Halaman / Bab</h3>
                <p class="text-xs text-slate-400">Bidang: <strong>${subj.name}</strong></p>
              </div>
            </div>
            <button id="btn-close-add-topic" class="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-base font-bold">&times;</button>
          </div>

          <form id="form-add-topic" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-bold text-amber-300 mb-1">Nama Sub-Halaman / Bab Materi Baru: *</label>
              <input type="text" id="new-topic-name" placeholder="Contoh: Persamaan Kuadrat, Limit Fungsi, Genetika..." class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors" required />
              <p class="text-[10.5px] text-slate-400 mt-1">
                Sub-halaman ini akan menjadi wadah pengelompokan pengerjaan soal di bidang <strong>${subj.name}</strong>.
              </p>
            </div>

            <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button type="button" id="btn-cancel-add-topic" class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 font-semibold cursor-pointer">
                Batal
              </button>
              <button type="submit" class="btn-primary px-5 py-2 rounded-xl text-white font-bold bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/30 cursor-pointer flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg>
                <span>Simpan Sub-Halaman</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    const closeBtn = modalContainer.querySelector("#btn-close-add-topic");
    const cancelBtn = modalContainer.querySelector("#btn-cancel-add-topic");
    const backdrop = modalContainer.querySelector("#modal-add-topic-backdrop");
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    cancelBtn?.addEventListener("click", doClose);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) doClose();
    });

    const form = modalContainer.querySelector("#form-add-topic");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const topicName = modalContainer.querySelector("#new-topic-name")?.value.trim();

      try {
        SubjectRegistry.addTopicToSubject(subj.id, topicName);
        NotificationToast.show(`Sub-halaman "${topicName}" berhasil ditambahkan ke ${subj.name}!`, "success");
        doClose();
        this.currentFilterSubject = subj.id;
        this.currentFilterTopic = topicName;
        this.render();
      } catch (err) {
        NotificationToast.show(err.message, "error");
      }
    });
  }

  /**
   * Membuka Modal Pratinjau Soal (Live Preview KaTeX)
   */
  openPreviewModal(questionId) {
    const q = AssessmentManager.getQuestionById(questionId);
    if (!q) return;

    const modalContainer = this.getModalContainer();
    const subj = SubjectRegistry.getSubject(q.subject);

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-[2000050] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="modal-preview-backdrop">
        <div class="relative w-full max-w-xl bg-[#18110b] text-slate-100 border-2 border-amber-500/50 rounded-3xl p-6 space-y-4 shadow-2xl my-auto">
          
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono font-bold text-amber-400">${q.id}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-slate-200 border border-slate-700 flex items-center gap-1.5">
                <span class="shrink-0 flex items-center">${subj.svgIcon || subj.icon}</span>
                <span>${subj.name} &bull; ${q.topic}</span>
              </span>
            </div>
            <button id="btn-close-qmodal" class="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-base font-bold">&times;</button>
          </div>

          <div class="space-y-2">
            <h4 class="text-sm sm:text-base font-bold text-white leading-relaxed">
              ${q.question_text}
            </h4>
            ${q.latex ? `
              <div class="p-3.5 rounded-xl bg-slate-950 font-serif text-center text-sm border border-slate-800 text-amber-300">
                $${q.latex}$
              </div>
            ` : ""}
          </div>

          <!-- Opsi Jawaban -->
          <div class="space-y-2 pt-1">
            ${q.options.map(opt => {
              const isCorrect = opt.key === q.correct_answer;
              return `
                <div class="p-2.5 rounded-xl border text-xs flex items-center gap-3 ${isCorrect ? "border-emerald-500/70 bg-emerald-950/30 text-emerald-300 font-bold" : "border-slate-800 bg-slate-950/60 text-slate-300"}">
                  <span class="w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold ${isCorrect ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}">
                    ${opt.key}
                  </span>
                  <div class="flex-1">${opt.text || opt.latex || ""}</div>
                  ${isCorrect ? '<span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Kunci Benar</span></span>' : ""}
                </div>
              `;
            }).join("")}
          </div>

          ${q.explanation ? `
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              <strong class="text-amber-400">Pembahasan / Penjelasan:</strong> ${q.explanation}
            </div>
          ` : ""}

          <div class="pt-2 flex justify-end">
            <button id="btn-close-qmodal-ok" class="btn-primary text-xs px-5 py-2 font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md cursor-pointer">
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modalContainer.querySelector("#btn-close-qmodal");
    const closeOk = modalContainer.querySelector("#btn-close-qmodal-ok");
    const backdrop = modalContainer.querySelector("#modal-preview-backdrop");
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    closeOk?.addEventListener("click", doClose);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) doClose();
    });

    // Render KaTeX jika tersedia
    if (typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(modalContainer, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX preview auto-render:", e);
      }
    }
  }

  /**
   * Membuka Modal Pembuat / Editor Soal (Authoring Modal)
   * Dilengkapi live preview KaTeX, pemilih topik terintegrasi, dan portal anti-blank
   */
  openAuthoringModal(questionIdOrDefaults = null) {
    let q = null;
    let isEditing = false;

    if (typeof questionIdOrDefaults === "string") {
      q = AssessmentManager.getQuestionById(questionIdOrDefaults);
      isEditing = true;
    } else if (questionIdOrDefaults && typeof questionIdOrDefaults === "object") {
      q = new UniversalQuestion({
        id: `q_${Date.now()}`,
        subject: questionIdOrDefaults.subject || (this.currentFilterSubject === "all" ? "mathematics" : this.currentFilterSubject),
        topic: questionIdOrDefaults.topic || "",
        options: [
          { key: "A", text: "", errorType: null },
          { key: "B", text: "", errorType: null },
          { key: "C", text: "", errorType: null },
          { key: "D", text: "", errorType: null }
        ]
      });
    } else {
      q = new UniversalQuestion({
        id: `q_${Date.now()}`,
        subject: this.currentFilterSubject === "all" ? "mathematics" : this.currentFilterSubject,
        topic: this.currentFilterTopic || "",
        options: [
          { key: "A", text: "", errorType: null },
          { key: "B", text: "", errorType: null },
          { key: "C", text: "", errorType: null },
          { key: "D", text: "", errorType: null }
        ]
      });
    }

    if (!q) return;

    const subjects = SubjectRegistry.getAllSubjects();
    const modalContainer = this.getModalContainer();
    const assigned = q.metadata?.assignedAssessments || [];
    const availableTopics = SubjectRegistry.getTopicsForSubject(q.subject);

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-[2000050] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="modal-author-backdrop">
        <div class="relative w-full max-w-2xl bg-[#18110b] text-slate-100 border-2 border-amber-500/50 rounded-3xl p-6 space-y-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
          
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 class="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  ${isEditing ? '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
                </svg>
              </span>
              <span>${isEditing ? "Edit Butir Soal" : "Buat Butir Soal Baru"}</span>
              <span class="font-mono text-xs text-amber-400 font-bold">(${q.id})</span>
            </h3>
            <button id="btn-close-author-modal" class="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-base font-bold">&times;</button>
          </div>

          <form id="form-author-question" class="space-y-4 text-xs">
            
            <!-- Row 1: Subjek & Tipe Soal -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-amber-300 mb-1">Mata Pelajaran / Bidang: *</label>
                <select id="author-q-subject" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors">
                  ${subjects.map(s => `
                    <option value="${s.id}" ${q.subject === s.id ? "selected" : ""}>${s.name}</option>
                  `).join("")}
                </select>
              </div>

              <div>
                <label class="block font-bold text-amber-300 mb-1">Tipe Butir Soal: *</label>
                <select id="author-q-type" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors">
                  ${QUESTION_TYPES.map(t => `
                    <option value="${t.id}" ${q.question_type === t.id ? "selected" : ""}>${t.name}</option>
                  `).join("")}
                </select>
              </div>
            </div>

            <!-- Row 2: Topik & Kesulitan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-amber-300 mb-1">Sub-Halaman / Topik Materi: *</label>
                <div class="flex items-center gap-2">
                  <input 
                    type="text" 
                    id="author-q-topic" 
                    list="author-topic-datalist"
                    value="${q.topic || ""}" 
                    placeholder="Pilih atau ketik sub-halaman baru..." 
                    class="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors" 
                    required 
                  />
                  <button type="button" id="btn-quick-new-topic-inline" class="px-3 py-2.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 font-bold text-xs shrink-0 cursor-pointer" title="Tambah Sub-Halaman Baru Cepat">
                    + Bab Baru
                  </button>
                </div>
                <datalist id="author-topic-datalist">
                  ${availableTopics.map(t => `<option value="${t}">`).join("")}
                </datalist>
                <p class="text-[10px] text-slate-400 mt-1">Pilih dari sub-halaman yang ada atau ketik topik baru untuk menambahkannya otomatis.</p>
              </div>

              <div>
                <label class="block font-bold text-amber-300 mb-1">Tingkat Kesulitan: *</label>
                <select id="author-q-diff" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors">
                  <option value="easy" ${q.difficulty === "easy" ? "selected" : ""}>Mudah (Easy)</option>
                  <option value="medium" ${q.difficulty === "medium" ? "selected" : ""}>Sedang (Medium)</option>
                  <option value="hard" ${q.difficulty === "hard" ? "selected" : ""}>Sukar (Hard)</option>
                </select>
              </div>
            </div>

            <!-- Pertanyaan / Teks Soal -->
            <div>
              <label class="block font-bold text-amber-300 mb-1">Pertanyaan / Pernyataan Soal: *</label>
              <textarea id="author-q-text" rows="3" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors" placeholder="Tuliskan pertanyaan secara lengkap di sini..." required>${q.question_text || ""}</textarea>
            </div>

            <!-- LaTeX Formula / Notasi (Opsional) & Live KaTeX Preview -->
            <div>
              <label class="block font-bold text-amber-300 mb-1">Rumus / Formula KaTeX (Opsional):</label>
              <input type="text" id="author-q-latex" value="${q.latex || ""}" placeholder="Contoh: 2x^2 - 5x + 3 = 0 atau \\frac{-b \\pm \\sqrt{D}}{2a}" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-amber-200 font-mono text-xs focus:outline-none transition-colors" />
              <!-- Live Preview KaTeX Formula -->
              <div id="author-latex-preview-box" class="mt-2 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-center font-serif text-sm text-cyan-300 min-h-[38px] flex items-center justify-center ${q.latex ? "" : "hidden"}">
                <span>$${q.latex || ""}$</span>
              </div>
            </div>

            <!-- Opsi Jawaban (A, B, C, D) -->
            <div class="space-y-2 pt-1 border-t border-slate-800">
              <label class="block font-bold text-amber-300">Opsi Jawaban Pilihan Ganda: *</label>
              ${["A", "B", "C", "D"].map(key => {
                const opt = q.options.find(o => o.key === key) || { text: "" };
                return `
                  <div class="flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                      ${key}
                    </span>
                    <input type="text" id="author-opt-${key}" value="${opt.text || ""}" placeholder="Teks opsi ${key}..." class="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors" required />
                  </div>
                `;
              }).join("")}
            </div>

            <!-- Kunci Jawaban & Penugasan Asesmen -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block font-bold text-amber-300 mb-1">Kunci Jawaban Benar: *</label>
                <select id="author-q-correct" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-emerald-400 font-mono font-bold focus:outline-none transition-colors">
                  <option value="A" ${q.correct_answer === "A" ? "selected" : ""}>Opsi A</option>
                  <option value="B" ${q.correct_answer === "B" ? "selected" : ""}>Opsi B</option>
                  <option value="C" ${q.correct_answer === "C" ? "selected" : ""}>Opsi C</option>
                  <option value="D" ${q.correct_answer === "D" ? "selected" : ""}>Opsi D</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-amber-300 mb-1">Tugaskan ke Asesmen:</label>
                <div class="flex items-center gap-3 pt-2 flex-wrap">
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" id="assign-pretest" ${assigned.includes("PRE_TEST") ? "checked" : ""} class="rounded text-amber-500 focus:ring-amber-400" />
                    <span>Pre-Test</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" id="assign-diag" ${assigned.includes("DIAGNOSTIC") ? "checked" : ""} class="rounded text-amber-500 focus:ring-amber-400" />
                    <span>Diagnostik</span>
                  </label>
                  <label class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" id="assign-posttest" ${assigned.includes("POST_TEST") ? "checked" : ""} class="rounded text-amber-500 focus:ring-amber-400" />
                    <span>Post-Test</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Penjelasan / Pembahasan -->
            <div>
              <label class="block font-bold text-amber-300 mb-1">Penjelasan / Remediasi Kunci:</label>
              <textarea id="author-q-exp" rows="2" class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 text-white font-medium focus:outline-none transition-colors" placeholder="Tuliskan alasan atau langkah pembuktian solusi benar...">${q.explanation || ""}</textarea>
            </div>

            <!-- Tombol Simpan & Batal -->
            <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button type="button" id="btn-cancel-author" class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 font-semibold cursor-pointer">
                Batal
              </button>
              <button type="submit" class="btn-primary py-2 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                <span>Simpan Butir Soal</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    const closeBtn = modalContainer.querySelector("#btn-close-author-modal");
    const cancelBtn = modalContainer.querySelector("#btn-cancel-author");
    const backdrop = modalContainer.querySelector("#modal-author-backdrop");
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    cancelBtn?.addEventListener("click", doClose);
    backdrop?.addEventListener("click", (e) => {
      if (e.target === backdrop) doClose();
    });

    // Dynamic topic list update on subject select change
    const subjSelect = modalContainer.querySelector("#author-q-subject");
    const topicDatalist = modalContainer.querySelector("#author-topic-datalist");
    subjSelect?.addEventListener("change", (e) => {
      const selectedSubj = e.target.value;
      const topics = SubjectRegistry.getTopicsForSubject(selectedSubj);
      if (topicDatalist) {
        topicDatalist.innerHTML = topics.map(t => `<option value="${t}">`).join("");
      }
    });

    // Quick new topic inline button
    modalContainer.querySelector("#btn-quick-new-topic-inline")?.addEventListener("click", () => {
      const currentSubj = subjSelect?.value || "mathematics";
      const sName = SubjectRegistry.getSubject(currentSubj)?.name || "Bidang Ini";
      const topicName = window.prompt(`Masukkan nama sub-halaman / bab materi baru untuk ${sName}: (contoh: Persamaan Kuadrat, Limit, dll.)`);
      if (topicName && topicName.trim()) {
        const cleanTopic = topicName.trim();
        SubjectRegistry.addTopicToSubject(currentSubj, cleanTopic);
        const topicInput = modalContainer.querySelector("#author-q-topic");
        if (topicInput) topicInput.value = cleanTopic;
        if (topicDatalist) {
          const opt = document.createElement("option");
          opt.value = cleanTopic;
          topicDatalist.appendChild(opt);
        }
        NotificationToast.show(`Sub-halaman "${cleanTopic}" siap digunakan!`, "success");
      }
    });

    // Live KaTeX preview on formula typing
    const latexInput = modalContainer.querySelector("#author-q-latex");
    const latexPreview = modalContainer.querySelector("#author-latex-preview-box");
    const updateLatexPreview = () => {
      const val = latexInput?.value?.trim();
      if (!latexPreview) return;
      if (val) {
        latexPreview.classList.remove("hidden");
        latexPreview.innerHTML = `<span>$${val}$</span>`;
        if (typeof window.renderMathInElement === "function") {
          try {
            window.renderMathInElement(latexPreview, {
              delimiters: [{ left: "$", right: "$", display: false }],
              throwOnError: false
            });
          } catch (err) {}
        }
      } else {
        latexPreview.classList.add("hidden");
      }
    };
    latexInput?.addEventListener("input", updateLatexPreview);
    if (q.latex) updateLatexPreview();

    // Form Submit
    const form = modalContainer.querySelector("#form-author-question");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();

      const assignedList = [];
      if (modalContainer.querySelector("#assign-pretest")?.checked) assignedList.push("PRE_TEST");
      if (modalContainer.querySelector("#assign-diag")?.checked) assignedList.push("DIAGNOSTIC");
      if (modalContainer.querySelector("#assign-posttest")?.checked) assignedList.push("POST_TEST");

      const options = ["A", "B", "C", "D"].map(key => ({
        key: key,
        text: modalContainer.querySelector(`#author-opt-${key}`)?.value.trim() || "",
        errorType: null
      }));

      const subject = modalContainer.querySelector("#author-q-subject")?.value;
      const topic = modalContainer.querySelector("#author-q-topic")?.value.trim();

      // Tambahkan topik ke registry jika belum ada
      if (subject && topic) {
        try {
          SubjectRegistry.addTopicToSubject(subject, topic);
        } catch (e) {
          // ignore duplicate
        }
      }

      const updatedQ = new UniversalQuestion({
        id: q.id,
        subject: subject,
        question_type: modalContainer.querySelector("#author-q-type")?.value,
        topic: topic,
        difficulty: modalContainer.querySelector("#author-q-diff")?.value,
        question_text: modalContainer.querySelector("#author-q-text")?.value.trim(),
        latex: modalContainer.querySelector("#author-q-latex")?.value.trim() || null,
        options: options,
        correct_answer: modalContainer.querySelector("#author-q-correct")?.value,
        explanation: modalContainer.querySelector("#author-q-exp")?.value.trim(),
        metadata: {
          ...q.metadata,
          assignedAssessments: assignedList
        }
      });

      try {
        AssessmentManager.saveQuestion(updatedQ);
        if (typeof this.options?.onQuestionSaved === "function") {
          try { this.options.onQuestionSaved(updatedQ); } catch (cbErr) { console.warn("onQuestionSaved error:", cbErr); }
        }
        NotificationToast.show(`Butir soal ${updatedQ.id} berhasil disimpan ke bab "${updatedQ.topic}"!`, "success");
        doClose();
        this.currentFilterSubject = subject;
        this.currentFilterTopic = topic;
        this.render();
      } catch (err) {
        NotificationToast.show(err.message, "error");
      }
    });
  }
}
