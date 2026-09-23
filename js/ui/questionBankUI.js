/**
 * questionBankUI.js - Researcher/Teacher Question Bank & Assessment Authoring UI
 * 
 * Antarmuka Authoring Terpadu di Mode Guru (Terproteksi PIN Pendidik):
 * - Membuat, mengedit, menduplikasi, dan menghapus butir soal
 * - Pratinjau langsung formula KaTeX & opsi jawaban
 * - Menugaskan soal ke Pre-Test, Diagnostik, atau Post-Test
 * - Filter lintas mata pelajaran (Matematika, Fisika, Kimia, Biologi, Informatika)
 * - Ekspor & Impor Bank Soal (JSON/CSV)
 */

import { AssessmentManager } from "../research/assessmentManager.js";
import { SubjectRegistry } from "../engine/universal/subjectRegistry.js";
import { UniversalQuestion, QUESTION_TYPES } from "../data/questionModel.js";

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
    this.currentFilterSubject = "all";
    this.searchQuery = "";
    this.selectedQuestionForEdit = null;
    this.isEditing = false;
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

    if (this.searchQuery.trim()) {
      const qLower = this.searchQuery.toLowerCase();
      questions = questions.filter(q => 
        q.question_text.toLowerCase().includes(qLower) || 
        q.topic.toLowerCase().includes(qLower) || 
        q.id.toLowerCase().includes(qLower)
      );
    }

    this.container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header & Action Controls -->
        <div class="card-clean p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-purple-500/30">
                Authoring Suite &bull; Subject-Agnostic
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total: ${questions.length} Butir Soal</span>
            </div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Bank Soal &amp; Pengelolaan Asesmen Terpadu
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Kelola butir soal untuk Matematika, Fisika, Kimia, Biologi, dan Informatika tanpa mengubah kode aplikasi.
            </p>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button id="btn-create-new-question" class="btn-primary py-2 px-3.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              <span>+ Buat Soal Baru</span>
            </button>

            <button id="btn-export-bank-json" class="btn-secondary py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5" title="Unduh cadangan Bank Soal dalam format JSON">
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Ekspor JSON</span>
            </button>

            <input type="file" id="input-import-bank-json" accept=".json" class="hidden" />
            <button id="btn-import-bank-json" class="btn-secondary py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5" title="Unggah file JSON untuk menambahkan butir soal baru">
              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Impor JSON</span>
            </button>
          </div>
        </div>

        <!-- Filter Subjek & Kolom Pencarian -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <!-- Subject Pill Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 max-w-full">
            <button data-filter-subject="all" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${this.currentFilterSubject === "all" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}">
              <svg class="w-3.5 h-3.5 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Semua (${AssessmentManager.getAllQuestions().length})</span>
            </button>
            ${subjects.map(s => {
              const count = AssessmentManager.getAllQuestions({ subject: s.id }).length;
              const isActive = this.currentFilterSubject === s.id;
              return `
                <button data-filter-subject="${s.id}" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${isActive ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}">
                  <span class="shrink-0 flex items-center">${s.svgIcon || s.icon}</span>
                  <span>${s.name}</span>
                  <span class="text-[10px] font-mono opacity-70">(${count})</span>
                </button>
              `;
            }).join("")}
          </div>

          <!-- Search Input -->
          <div class="relative w-full sm:w-64">
            <input 
              type="text" 
              id="input-search-qbank" 
              value="${this.searchQuery}"
              placeholder="Cari ID, teks, atau topik..." 
              class="w-full text-xs py-2 pl-8 pr-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-indigo-500"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        <!-- Tabel Daftar Butir Soal -->
        <div class="card-clean bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead class="text-[10.5px] uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th class="px-3.5 py-3 font-bold">ID Soal</th>
                  <th class="px-3.5 py-3 font-bold">Mata Pelajaran</th>
                  <th class="px-3.5 py-3 font-bold">Topik / Subtopik</th>
                  <th class="px-3.5 py-3 font-bold">Tipe &amp; Kesulitan</th>
                  <th class="px-3.5 py-3 font-bold">Penugasan Asesmen</th>
                  <th class="px-3.5 py-3 font-bold text-center">Kunci</th>
                  <th class="px-3.5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                ${questions.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-8 text-center text-xs text-slate-500">
                      Tidak ada butir soal yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ` : questions.map(q => {
                  const subj = SubjectRegistry.getSubject(q.subject);
                  const assigned = q.metadata?.assignedAssessments || [];
                  const diffColor = q.difficulty === "easy" ? "text-emerald-500" : q.difficulty === "hard" ? "text-rose-500" : "text-amber-500";

                  return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-3.5 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                        ${q.id}
                      </td>
                      <td class="px-3.5 py-2.5">
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                          <span class="shrink-0 flex items-center">${subj.svgIcon || subj.icon}</span>
                          <span>${subj.name}</span>
                        </span>
                      </td>
                      <td class="px-3.5 py-2.5">
                        <div class="font-bold text-slate-900 dark:text-white line-clamp-1">${q.topic}</div>
                        <div class="text-[10px] text-slate-500 line-clamp-1">${q.question_text.slice(0, 55)}...</div>
                      </td>
                      <td class="px-3.5 py-2.5 text-[11px]">
                        <span class="font-mono text-slate-600 dark:text-slate-400 capitalize">${q.question_type.replace('_', ' ')}</span>
                        <span class="ml-1 font-bold ${diffColor}">(${q.difficulty})</span>
                      </td>
                      <td class="px-3.5 py-2.5">
                        <div class="flex items-center gap-1 flex-wrap">
                          ${assigned.length === 0 ? '<span class="text-[10px] text-slate-400">-</span>' : assigned.map(a => `
                            <span class="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              ${a}
                            </span>
                          `).join("")}
                        </div>
                      </td>
                      <td class="px-3.5 py-2.5 text-center font-mono font-extrabold text-xs text-emerald-600 dark:text-emerald-400">
                        ${q.correct_answer}
                      </td>
                      <td class="px-3.5 py-2.5 text-right">
                        <div class="inline-flex items-center gap-1">
                          <button data-action="preview" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-slate-400 dark:hover:border-slate-500 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs" title="Pratinjau Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button data-action="edit" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-2xs" title="Edit Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button data-action="duplicate" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-500 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-2xs" title="Duplikasi Soal">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                          </button>
                          <button data-action="delete" data-id="${q.id}" class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 hover:border-rose-400 dark:hover:border-rose-500 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-2xs" title="Hapus Soal">
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

        <!-- Container Modal Authoring & Preview (Hidden by default) -->
        <div id="qbank-modal-container"></div>

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
        this.render();
      });
    });

    // Search input
    const searchInput = this.container.querySelector("#input-search-qbank");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.render();
        // Pertahankan fokus di search input
        const newSearch = this.container.querySelector("#input-search-qbank");
        if (newSearch) {
          newSearch.focus();
          newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    // Tombol Buat Soal Baru
    this.container.querySelector("#btn-create-new-question")?.addEventListener("click", () => {
      this.openAuthoringModal(null);
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
          alert(`Berhasil mengimpor ${res.count} butir soal ke Bank Soal!`);
          this.render();
        } else {
          alert(`Gagal impor: ${res.error}`);
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
            this.render();
          } catch (err) {
            alert(err.message);
          }
        } else if (action === "delete") {
          if (confirm(`Yakin ingin menghapus butir soal ${id}?`)) {
            AssessmentManager.deleteQuestion(id);
            this.render();
          }
        }
      });
    });
  }

  /**
   * Membuka Modal Pratinjau Soal (Live Preview)
   */
  openPreviewModal(questionId) {
    const q = AssessmentManager.getQuestionById(questionId);
    if (!q) return;

    const modalContainer = this.container.querySelector("#qbank-modal-container");
    if (!modalContainer) return;

    const subj = SubjectRegistry.getSubject(q.subject);

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div class="card-clean max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-fade-in">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">${q.id}</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span class="shrink-0 flex items-center">${subj.svgIcon || subj.icon}</span>
                <span>${subj.name} &bull; ${q.topic}</span>
              </span>
            </div>
            <button id="btn-close-qmodal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">&times;</button>
          </div>

          <div class="space-y-2">
            <h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              ${q.question_text}
            </h4>
            ${q.latex ? `
              <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 font-serif text-center text-sm border border-slate-200 dark:border-slate-800">
                $${q.latex}$
              </div>
            ` : ""}
          </div>

          <!-- Opsi Jawaban -->
          <div class="space-y-2 pt-1">
            ${q.options.map(opt => {
              const isCorrect = opt.key === q.correct_answer;
              return `
                <div class="p-2.5 rounded-lg border text-xs flex items-center gap-3 ${isCorrect ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300"}">
                  <span class="w-5 h-5 rounded flex items-center justify-center font-mono font-bold ${isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}">
                    ${opt.key}
                  </span>
                  <div class="flex-1">${opt.text || opt.latex || ""}</div>
                  ${isCorrect ? '<span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><svg class="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Kunci Jawaban</span></span>' : ""}
                </div>
              `;
            }).join("")}
          </div>

          ${q.explanation ? `
            <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong class="text-slate-900 dark:text-white">Pembahasan / Penjelasan:</strong> ${q.explanation}
            </div>
          ` : ""}

          <div class="pt-2 flex justify-end">
            <button id="btn-close-qmodal-ok" class="btn-primary text-xs px-4 py-2 font-bold">
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    `;

    const closeBtn = modalContainer.querySelector("#btn-close-qmodal");
    const closeOk = modalContainer.querySelector("#btn-close-qmodal-ok");
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    closeOk?.addEventListener("click", doClose);

    // Render KaTeX pada modal pratinjau jika ada
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(modalContainer, {
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
   */
  openAuthoringModal(questionId = null) {
    const q = questionId ? AssessmentManager.getQuestionById(questionId) : new UniversalQuestion({
      id: `q_${Date.now()}`,
      subject: this.currentFilterSubject === "all" ? "mathematics" : this.currentFilterSubject,
      options: [
        { key: "A", text: "", errorType: null },
        { key: "B", text: "", errorType: null },
        { key: "C", text: "", errorType: null },
        { key: "D", text: "", errorType: null }
      ]
    });

    const isEditing = Boolean(questionId);
    const subjects = SubjectRegistry.getAllSubjects();
    const modalContainer = this.container.querySelector("#qbank-modal-container");
    if (!modalContainer) return;

    const assigned = q.metadata?.assignedAssessments || [];

    modalContainer.innerHTML = `
      <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div class="card-clean max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl my-8">
          
          <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="w-5 h-5 rounded-md flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  ${isEditing ? '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'}
                </svg>
              </span>
              <span>${isEditing ? "Edit Butir Soal" : "Buat Butir Soal Baru"}</span>
              <span class="font-mono text-xs text-indigo-500 font-bold">(${q.id})</span>
            </h3>
            <button id="btn-close-author-modal" class="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg">&times;</button>
          </div>

          <form id="form-author-question" class="space-y-4 text-xs">
            
            <!-- Row 1: Subjek & Tipe Soal -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran:</label>
                <select id="author-q-subject" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium">
                  ${subjects.map(s => `
                    <option value="${s.id}" ${q.subject === s.id ? "selected" : ""}>${s.icon} ${s.name}</option>
                  `).join("")}
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Butir Soal:</label>
                <select id="author-q-type" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium">
                  ${QUESTION_TYPES.map(t => `
                    <option value="${t.id}" ${q.question_type === t.id ? "selected" : ""}>${t.name}</option>
                  `).join("")}
                </select>
              </div>
            </div>

            <!-- Row 2: Topik & Kesulitan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topik Materi:</label>
                <input type="text" id="author-q-topic" value="${q.topic}" placeholder="Contoh: Stoikiometri / Kinematika" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium" required />
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tingkat Kesulitan:</label>
                <select id="author-q-diff" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium">
                  <option value="easy" ${q.difficulty === "easy" ? "selected" : ""}>Mudah (Easy)</option>
                  <option value="medium" ${q.difficulty === "medium" ? "selected" : ""}>Sedang (Medium)</option>
                  <option value="hard" ${q.difficulty === "hard" ? "selected" : ""}>Sukar (Hard)</option>
                </select>
              </div>
            </div>

            <!-- Pertanyaan / Teks Soal -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pertanyaan / Pernyataan Soal:</label>
              <textarea id="author-q-text" rows="3" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium" placeholder="Tuliskan pertanyaan secara lengkap di sini..." required>${q.question_text}</textarea>
            </div>

            <!-- LaTeX Formula / Notasi (Opsional) -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rumus / Formula Simbolik (Opsional - KaTeX):</label>
              <input type="text" id="author-q-latex" value="${q.latex || ""}" placeholder="Contoh: 2x^2 - 5x + 3 = 0 atau v = s/t" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs" />
            </div>

            <!-- Opsi Jawaban (A, B, C, D) -->
            <div class="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <label class="block font-bold text-slate-700 dark:text-slate-300">Opsi Jawaban Pilihan Ganda:</label>
              ${["A", "B", "C", "D"].map(key => {
                const opt = q.options.find(o => o.key === key) || { text: "" };
                return `
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                      ${key}
                    </span>
                    <input type="text" id="author-opt-${key}" value="${opt.text || ""}" placeholder="Teks opsi ${key}..." class="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium" required />
                  </div>
                `;
              }).join("")}
            </div>

            <!-- Kunci Jawaban & Penugasan Asesmen -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kunci Jawaban Benar:</label>
                <select id="author-q-correct" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold">
                  <option value="A" ${q.correct_answer === "A" ? "selected" : ""}>Opsi A</option>
                  <option value="B" ${q.correct_answer === "B" ? "selected" : ""}>Opsi B</option>
                  <option value="C" ${q.correct_answer === "C" ? "selected" : ""}>Opsi C</option>
                  <option value="D" ${q.correct_answer === "D" ? "selected" : ""}>Opsi D</option>
                </select>
              </div>

              <div>
                <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tugaskan ke Asesmen:</label>
                <div class="flex items-center gap-3 pt-1.5 flex-wrap">
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" id="assign-pretest" ${assigned.includes("PRE_TEST") ? "checked" : ""} class="rounded text-indigo-600" />
                    <span>Pre-Test</span>
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" id="assign-diag" ${assigned.includes("DIAGNOSTIC") ? "checked" : ""} class="rounded text-indigo-600" />
                    <span>Diagnostik</span>
                  </label>
                  <label class="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" id="assign-posttest" ${assigned.includes("POST_TEST") ? "checked" : ""} class="rounded text-indigo-600" />
                    <span>Post-Test</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Penjelasan / Pembahasan -->
            <div>
              <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Penjelasan / Remediasi Kunci:</label>
              <textarea id="author-q-exp" rows="2" class="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium" placeholder="Tuliskan alasan atau langkah pembuktian solusi benar...">${q.explanation}</textarea>
            </div>

            <!-- Tombol Simpan & Batal -->
            <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
              <button type="button" id="btn-cancel-author" class="btn-secondary py-2 px-4 text-xs font-semibold">
                Batal
              </button>
              <button type="submit" class="btn-primary py-2 px-5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
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
    const doClose = () => { modalContainer.innerHTML = ""; };
    closeBtn?.addEventListener("click", doClose);
    cancelBtn?.addEventListener("click", doClose);

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

      const updatedQ = new UniversalQuestion({
        id: q.id,
        subject: modalContainer.querySelector("#author-q-subject")?.value,
        question_type: modalContainer.querySelector("#author-q-type")?.value,
        topic: modalContainer.querySelector("#author-q-topic")?.value.trim(),
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
        alert(`Berhasil menyimpan butir soal ${updatedQ.id}!`);
        doClose();
        this.render();
      } catch (err) {
        alert(err.message);
      }
    });
  }
}
