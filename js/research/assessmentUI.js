/**
 * assessmentUI.js - Antarmuka Pengujian Riset Pre-Test & Post-Test EPE V2.2
 * 
 * Karakteristik UI:
 * - Tenang, fokus, minimal distraksi (tanpa animasi koin, tanpa reward avatar/Cubic)
 * - Dukungan penuh rendering rumus matematika KaTeX
 * - Timer pengerjaan otomatis
 * - Palet navigasi butir soal 1 - 12 (terjawab, belum, ragu-ragu)
 * - Gatekeeper validasi prasyarat Post-Test
 * - Dialog konfirmasi dan ringkasan netral pasca-tes
 */

import { FORM_A_PRETEST, FORM_B_POSTTEST } from "./assessmentForms.js";
import { AssessmentStore } from "./assessmentStore.js";

export class AssessmentUI {
  constructor(appInstance) {
    this.app = appInstance;
    this.activeTestType = null; // 'pretest' | 'posttest'
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {}; // { questionId: { answer: 'A', selectedErrorType: 'E0', timeSpent: 30, flagged: false } }
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.isTestRunning = false;

    this.containerPretest = document.getElementById("section-pretest-mode");
    this.containerPosttest = document.getElementById("section-posttest-mode");
  }

  /**
   * Membuka Halaman Awal / Workstation Pre-Test
   */
  openPreTest() {
    this.activeTestType = "pretest";
    this.questions = [...FORM_A_PRETEST];
    this.renderPreTestView();
  }

  /**
   * Membuka Halaman Awal / Workstation Post-Test
   */
  openPostTest() {
    this.activeTestType = "posttest";
    this.questions = [...FORM_B_POSTTEST];
    this.renderPostTestView();
  }

  /**
   * Render Tampilan Pre-Test (Briefing atau Workstation)
   */
  renderPreTestView() {
    if (!this.containerPretest) return;

    if (this.isTestRunning && this.activeTestType === "pretest") {
      this.renderActiveTestScreen(this.containerPretest);
      return;
    }

    const attempts = AssessmentStore.getAllAttempts("pretest");
    const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    this.containerPretest.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 py-4">
        
        <!-- Header Banner Riset -->
        <div class="card-clean p-6 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Instrumen Riset EPE V2.2 &bull; Form A
            </span>
            <span class="text-xs text-slate-400">Baseline Measurement Layer</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Pre-Test Persamaan Kuadrat
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            "Ukur kemampuan awalmu sebelum memulai perjalanan belajar."
          </p>
        </div>

        <!-- Kartu Panduan & Aturan Pengerjaan -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card-clean p-4 space-y-1.5 border border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jumlah Soal</span>
            <div class="text-xl font-extrabold text-white">12 Butir</div>
            <p class="text-[11px] text-slate-500">Mencakup 6 domain kompetensi D1 s.d. D6 secara seimbang.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 border border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimasi Waktu</span>
            <div class="text-xl font-extrabold text-blue-400">20 - 30 Menit</div>
            <p class="text-[11px] text-slate-500">Dilengkapi timer observasional untuk analisis durasi penelitian.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 border border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Integritas Penilaian</span>
            <div class="text-xl font-extrabold text-emerald-400">Non-Reward</div>
            <p class="text-[11px] text-slate-500">Bebas dari tekanan Cubic/Avatar untuk menjaga kemurnian data.</p>
          </div>
        </div>

        <!-- Pedoman Pengerjaan Riset -->
        <div class="card-clean p-5 space-y-3 text-xs leading-relaxed text-slate-300 border border-slate-800">
          <h4 class="font-bold text-white text-sm flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Protokol &amp; Aturan Pengerjaan:</span>
          </h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
            <li>Kerjakan secara mandiri di atas kertas buram tanpa bantuan kalkulator atau sumber eksternal.</li>
            <li>Pilihlah salah satu opsi (A, B, C, atau D) yang paling sesuai dengan hasil hitungan aljabar Anda.</li>
            <li>Anda dapat menandai ragu-ragu dan berpindah antar butir soal kapan saja sebelum mengirim jawaban akhir.</li>
            <li>Data respon disimpan secara permanen untuk analisis komparatif baseline penelitian.</li>
          </ul>
        </div>

        <!-- Riwayat Pengerjaan Terakhir (Jika ada) -->
        ${
          latest
            ? `
          <div class="card-clean p-4 bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-slate-400">Status Baseline Anda:</span>
              <div class="text-xs font-semibold text-white">
                Attempt Terakhir: <strong class="text-blue-400">${latest.score}%</strong> (${latest.correctCount}/${latest.totalQuestions} Benar) &bull; ${latest.timestamp}
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              ✓ Telah Selesai
            </span>
          </div>
        `
            : ""
        }

        <!-- Tombol Aksi Mulai -->
        <div class="pt-2 flex items-center justify-between">
          <button id="btn-back-to-dash-pre" class="btn-secondary text-xs px-4 py-2.5">
            ← Kembali ke Dashboard
          </button>
          <button id="btn-start-pretest" class="btn-primary text-xs px-6 py-2.5 font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2">
            <span>${latest ? "Ulangi Pre-Test (Attempt Baru)" : "Mulai Pre-Test Sekarang"}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>

      </div>
    `;

    // Event Bindings
    this.containerPretest.querySelector("#btn-back-to-dash-pre")?.addEventListener("click", () => {
      this.app?.switchTab("dashboard");
    });

    this.containerPretest.querySelector("#btn-start-pretest")?.addEventListener("click", () => {
      this.startTest("pretest");
    });
  }

  /**
   * Render Tampilan Post-Test (Briefing, Gating Lock, atau Workstation)
   */
  renderPostTestView() {
    if (!this.containerPosttest) return;

    if (this.isTestRunning && this.activeTestType === "posttest") {
      this.renderActiveTestScreen(this.containerPosttest);
      return;
    }

    const prereq = AssessmentStore.checkPostTestPrerequisites();
    const attempts = AssessmentStore.getAllAttempts("posttest");
    const latest = attempts.length > 0 ? attempts[attempts.length - 1] : null;

    // KONDISI 1: Post-Test Terkunci karena prasyarat penelitian belum terpenuhi
    if (!prereq.isUnlocked) {
      this.containerPosttest.innerHTML = `
        <div class="max-w-3xl mx-auto space-y-6 py-6">
          <div class="card-clean p-8 bg-slate-900/90 border border-slate-800 text-center space-y-4">
            
            <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🔒
            </div>

            <div class="space-y-1">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Akses Terkunci Sementara
              </span>
              <h3 class="text-xl font-bold text-white">Post-Test Belum Dapat Dibuka</h3>
              <p class="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Untuk menjaga validitas instrumen penelitian komparatif (Before vs After), Anda harus menyelesaikan rangkaian tahapan pembelajaran sebelum evaluasi akhir.
              </p>
            </div>

            <!-- Daftar Kriteria Prasyarat -->
            <div class="max-w-md mx-auto bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-left space-y-2.5 text-xs">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kriteria Prasyarat Penelitian:</span>
              ${prereq.reasons
                .map(
                  (r) => `
                <div class="flex items-center gap-2 text-[11px] ${r.passed ? "text-emerald-400 font-medium" : "text-slate-400"}">
                  <span>${r.passed ? "✓" : "○"}</span>
                  <span>${r.label}</span>
                </div>
              `
                )
                .join("")}
            </div>

            <!-- Tombol Aksi Navigasi -->
            <div class="pt-2 flex items-center justify-center gap-3">
              <button id="btn-post-go-pre" class="btn-secondary text-xs px-4 py-2">
                ${prereq.hasPretest ? "Buka Diagnostik Baku" : "Kerjakan Pre-Test Dulu"}
              </button>
              <button id="btn-post-go-dash" class="btn-primary text-xs px-4 py-2 font-bold">
                Kembali ke Dashboard
              </button>
            </div>

          </div>
        </div>
      `;

      this.containerPosttest.querySelector("#btn-post-go-dash")?.addEventListener("click", () => {
        this.app?.switchTab("dashboard");
      });

      this.containerPosttest.querySelector("#btn-post-go-pre")?.addEventListener("click", () => {
        if (!prereq.hasPretest) {
          this.app?.switchTab("pretest");
        } else {
          this.app?.switchTab("diagnostic");
        }
      });
      return;
    }

    // KONDISI 2: Prasyarat Terpenuhi - Tampilkan Layar Briefing Post-Test
    this.containerPosttest.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 py-4">
        
        <!-- Header Banner Riset -->
        <div class="card-clean p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Instrumen Riset EPE V2.2 &bull; Form B (Paralel)
            </span>
            <span class="text-xs text-slate-400">Post-Intervention Outcome Measurement</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Post-Test Persamaan Kuadrat
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            "Uji kembali pemahamanmu setelah menyelesaikan proses pembelajaran."
          </p>
        </div>

        <!-- Kartu Panduan & Struktur Paralel -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card-clean p-4 space-y-1.5 border border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Struktur Pengukuran</span>
            <div class="text-xl font-extrabold text-white">12 Butir Paralel</div>
            <p class="text-[11px] text-slate-500">Struktur kompetensi setara dengan Form A tanpa duplikasi soal.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 border border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimasi Waktu</span>
            <div class="text-xl font-extrabold text-indigo-400">20 - 30 Menit</div>
            <p class="text-[11px] text-slate-500">Kondisi pengukuran terstandar dan bebas adaptivitas butir.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 border border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Integritas Pengukuran</span>
            <div class="text-xl font-extrabold text-teal-400">Comparable</div>
            <p class="text-[11px] text-slate-500">Siap dibandingkan langsung dengan skor baseline Pre-Test.</p>
          </div>
        </div>

        <!-- Pedoman Pengerjaan -->
        <div class="card-clean p-5 space-y-3 text-xs leading-relaxed text-slate-300 border border-slate-800">
          <h4 class="font-bold text-white text-sm flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Protokol Post-Test:</span>
          </h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
            <li>Tidak ada petunjuk jawaban atau pembimbingan langkah selama tes berlangsung.</li>
            <li>Kerjakan secara mandiri dengan teliti untuk mengukur retensi konsep aljabar Anda.</li>
            <li>Hasil Post-Test akan otomatis dipetakan ke profil Before vs After di Mode Riset.</li>
          </ul>
        </div>

        <!-- Riwayat Pengerjaan Post-Test Terakhir (Jika ada) -->
        ${
          latest
            ? `
          <div class="card-clean p-4 bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-slate-400">Skor Evaluasi Terakhir:</span>
              <div class="text-xs font-semibold text-white">
                Attempt: <strong class="text-indigo-400">${latest.score}%</strong> (${latest.correctCount}/${latest.totalQuestions} Benar) &bull; ${latest.timestamp}
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold">
              ✓ Selesai
            </span>
          </div>
        `
            : ""
        }

        <!-- Tombol Aksi Mulai -->
        <div class="pt-2 flex items-center justify-between">
          <button id="btn-back-to-dash-post" class="btn-secondary text-xs px-4 py-2.5">
            ← Kembali ke Dashboard
          </button>
          <button id="btn-start-posttest" class="btn-primary text-xs px-6 py-2.5 font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2">
            <span>${latest ? "Ulangi Post-Test (Attempt Baru)" : "Mulai Post-Test Sekarang"}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>

      </div>
    `;

    // Event Bindings
    this.containerPosttest.querySelector("#btn-back-to-dash-post")?.addEventListener("click", () => {
      this.app?.switchTab("dashboard");
    });

    this.containerPosttest.querySelector("#btn-start-posttest")?.addEventListener("click", () => {
      this.startTest("posttest");
    });
  }

  /**
   * Memulai Tes Baru
   */
  startTest(testType = "pretest") {
    this.activeTestType = testType;
    this.questions = testType === "pretest" ? [...FORM_A_PRETEST] : [...FORM_B_POSTTEST];
    this.currentIndex = 0;
    this.userAnswers = {};
    this.questions.forEach((q) => {
      this.userAnswers[q.id] = {
        answer: null,
        selectedErrorType: null,
        timeSpent: 0,
        flagged: false
      };
    });
    this.elapsedSeconds = 0;
    this.startTime = Date.now();
    this.isTestRunning = true;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateTimerDisplay();
    }, 1000);

    const targetContainer = testType === "pretest" ? this.containerPretest : this.containerPosttest;
    this.renderActiveTestScreen(targetContainer);
  }

  /**
   * Memperbarui Tampilan Timer Pengerjaan
   */
  updateTimerDisplay() {
    const timerEl = document.getElementById("assessment-timer-display");
    if (!timerEl) return;
    const mins = Math.floor(this.elapsedSeconds / 60);
    const secs = this.elapsedSeconds % 60;
    timerEl.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Render Layar Workstation Soal Aktif
   */
  renderActiveTestScreen(container) {
    if (!container || !this.isTestRunning) return;

    const q = this.questions[this.currentIndex];
    const userAns = this.userAnswers[q.id] || { answer: null, flagged: false };
    const testTitle = this.activeTestType === "pretest" ? "Pre-Test (Form A)" : "Post-Test (Form B)";
    const totalQ = this.questions.length;
    const answeredCount = Object.values(this.userAnswers).filter((u) => u.answer !== null).length;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4 py-2 select-none">
        
        <!-- Header Assessment Bar -->
        <div class="card-clean p-4 bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              ${testTitle}
            </span>
            <span class="text-xs text-slate-300 font-semibold">
              Soal ${this.currentIndex + 1} dari ${totalQ}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span class="text-blue-400">⏱️</span>
              <span id="assessment-timer-display">00:00</span>
            </div>

            <button id="btn-cancel-test" class="text-xs text-slate-400 hover:text-rose-400 transition-colors">
              Batal
            </button>
          </div>
        </div>

        <!-- Main Question & Options Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- Question Content Card (9 Kolom) -->
          <div class="lg:col-span-9 space-y-4">
            <div class="card-clean p-6 bg-slate-900 border border-slate-800 space-y-5">
              
              <!-- Badges & Domain -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-600/20 text-blue-300 border border-blue-500/30">
                    ${q.domain} &bull; ${q.domainName}
                  </span>
                  <span class="text-[10px] font-mono text-slate-400 font-bold">${q.competencyId}</span>
                </div>

                <label class="flex items-center gap-1.5 text-xs text-amber-400 cursor-pointer">
                  <input type="checkbox" id="chk-flag-question" ${userAns.flagged ? "checked" : ""} class="rounded border-slate-700 bg-slate-800 text-amber-500" />
                  <span>Tandai Ragu-ragu</span>
                </label>
              </div>

              <!-- Question Title & Prompt -->
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-white">${q.title}</h4>
                <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">${q.prompt}</p>
              </div>

              <!-- LaTeX Formula Display (If available) -->
              ${
                q.latex
                  ? `
                <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-serif text-blue-300 text-sm overflow-x-auto assessment-latex-box" data-latex="${q.latex}">
                  $$${q.latex}$$
                </div>
              `
                  : ""
              }

              <!-- Multiple Choice Options (A, B, C, D) -->
              <div class="space-y-2.5 pt-2">
                ${q.options
                  .map((opt) => {
                    const isSelected = userAns.answer === opt.key;
                    const activeBorder = isSelected
                      ? "border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50"
                      : "border-slate-800 hover:border-slate-700 bg-slate-900/60";

                    return `
                    <label class="opt-label flex items-start gap-3 p-3.5 rounded-xl border ${activeBorder} transition-all cursor-pointer group">
                      <input 
                        type="radio" 
                        name="opt-q-${q.id}" 
                        value="${opt.key}" 
                        data-errortype="${opt.errorType}"
                        ${isSelected ? "checked" : ""} 
                        class="mt-0.5 text-blue-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer" 
                      />
                      <div class="flex-1 text-xs space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="w-5 h-5 rounded-md ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
                          } flex items-center justify-center font-bold text-[11px] font-mono flex-shrink-0">
                            ${opt.key}
                          </span>
                          <span class="text-slate-200 group-hover:text-white font-medium">${opt.text}</span>
                        </div>
                        ${
                          opt.latex && opt.latex !== opt.text
                            ? `
                          <div class="text-[11px] text-blue-300 pl-7 font-serif assessment-latex-box" data-latex="${opt.latex}">
                            $${opt.latex}$
                          </div>
                        `
                            : ""
                        }
                      </div>
                    </label>
                  `;
                  })
                  .join("")}
              </div>

            </div>

            <!-- Bottom Navigation Actions -->
            <div class="flex items-center justify-between gap-3 pt-1">
              <button id="btn-q-prev" class="btn-secondary text-xs px-4 py-2 ${this.currentIndex === 0 ? "opacity-50 cursor-not-allowed" : ""}" ${
      this.currentIndex === 0 ? "disabled" : ""
    }>
                ← Sebelumnya
              </button>

              <div class="text-[11px] text-slate-400">
                Terjawab: <strong class="text-white">${answeredCount}</strong> / ${totalQ}
              </div>

              ${
                this.currentIndex === totalQ - 1
                  ? `
                <button id="btn-submit-assessment" class="btn-primary text-xs px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20">
                  Selesai &amp; Kirim Jawaban ✓
                </button>
              `
                  : `
                <button id="btn-q-next" class="btn-primary text-xs px-5 py-2 font-bold">
                  Selanjutnya →
                </button>
              `
              }
            </div>
          </div>

          <!-- Question Palette Navigator (3 Kolom) -->
          <div class="lg:col-span-3 space-y-4">
            <div class="card-clean p-4 bg-slate-900 border border-slate-800 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <span class="text-xs font-bold text-white">Navigasi Butir</span>
                <span class="text-[10px] text-slate-400 font-mono">${answeredCount}/${totalQ}</span>
              </div>

              <!-- Question Grid (1 - 12) -->
              <div class="grid grid-cols-4 gap-2">
                ${this.questions
                  .map((item, idx) => {
                    const ans = this.userAnswers[item.id];
                    const isAnswered = ans && ans.answer !== null;
                    const isFlagged = ans && ans.flagged;
                    const isCurrent = idx === this.currentIndex;

                    let btnClass = "bg-slate-950 text-slate-400 border-slate-800";
                    if (isAnswered) btnClass = "bg-blue-600 text-white border-blue-500 font-bold";
                    if (isFlagged) btnClass = "bg-amber-500 text-slate-950 border-amber-400 font-bold";
                    if (isCurrent) btnClass += " ring-2 ring-cyan-400";

                    return `
                    <button data-jump-idx="${idx}" class="py-2 rounded-lg text-xs font-mono border transition-all hover:scale-105 ${btnClass}">
                      ${idx + 1}
                    </button>
                  `;
                  })
                  .join("")}
              </div>

              <!-- Legend Navigator -->
              <div class="space-y-1.5 pt-2 text-[10px] text-slate-400 border-t border-slate-800/80">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded bg-blue-600"></span>
                  <span>Sudah Terjawab</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>Ragu-ragu</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded bg-slate-950 border border-slate-800"></span>
                  <span>Belum Dijawab</span>
                </div>
              </div>

              <!-- Quick Submit Shortcut -->
              <div class="pt-2">
                <button id="btn-quick-submit" class="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-semibold border border-slate-700 transition-colors">
                  Akhiri Tes &amp; Kumpulkan
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    this.updateTimerDisplay();
    this.renderMathEquations(container);
    this.bindWorkstationEvents(container);
  }

  /**
   * Rendering Rumus KaTeX
   */
  renderMathEquations(container) {
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("Gagal render KaTeX auto:", e);
      }
    }
  }

  /**
   * Event Listeners untuk Workstation Pengerjaan
   */
  bindWorkstationEvents(container) {
    const q = this.questions[this.currentIndex];

    // Radio option click
    container.querySelectorAll(`input[name="opt-q-${q.id}"]`).forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const val = e.target.value;
        const errType = e.target.getAttribute("data-errortype");
        this.userAnswers[q.id].answer = val;
        this.userAnswers[q.id].selectedErrorType = errType;
        this.renderActiveTestScreen(container);
      });
    });

    // Flag checkbox
    container.querySelector("#chk-flag-question")?.addEventListener("change", (e) => {
      this.userAnswers[q.id].flagged = e.target.checked;
      this.renderActiveTestScreen(container);
    });

    // Navigation buttons
    container.querySelector("#btn-q-prev")?.addEventListener("click", () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderActiveTestScreen(container);
      }
    });

    container.querySelector("#btn-q-next")?.addEventListener("click", () => {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        this.renderActiveTestScreen(container);
      }
    });

    // Jump palette buttons
    container.querySelectorAll("[data-jump-idx]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.getAttribute("data-jump-idx"), 10);
        if (!isNaN(idx) && idx >= 0 && idx < this.questions.length) {
          this.currentIndex = idx;
          this.renderActiveTestScreen(container);
        }
      });
    });

    // Submit buttons
    container.querySelector("#btn-submit-assessment")?.addEventListener("click", () => {
      this.confirmSubmission();
    });

    container.querySelector("#btn-quick-submit")?.addEventListener("click", () => {
      this.confirmSubmission();
    });

    // Cancel button
    container.querySelector("#btn-cancel-test")?.addEventListener("click", () => {
      const confirmCancel = confirm("Yakin ingin membatalkan tes? Seluruh progres saat ini tidak akan disimpan.");
      if (confirmCancel) {
        this.endTestSession();
        if (this.activeTestType === "pretest") {
          this.renderPreTestView();
        } else {
          this.renderPostTestView();
        }
      }
    });
  }

  /**
   * Konfirmasi Pengiriman Jawaban
   */
  confirmSubmission() {
    const totalQ = this.questions.length;
    const answeredCount = Object.values(this.userAnswers).filter((u) => u.answer !== null).length;
    const unansweredCount = totalQ - answeredCount;

    let msg = `Kirim dan selesaikan ${this.activeTestType === "pretest" ? "Pre-Test" : "Post-Test"}?`;
    if (unansweredCount > 0) {
      msg = `Perhatian: Masih ada ${unansweredCount} butir soal yang belum dijawab.\n\nApakah Anda yakin ingin menyelesaikan tes sekarang?`;
    }

    const confirmSend = confirm(msg);
    if (!confirmSend) return;

    this.submitAssessment();
  }

  /**
   * Mengirim dan Menyimpan Hasil Tes secara Imutabel
   */
  async submitAssessment() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const responses = this.questions.map((q) => {
      const u = this.userAnswers[q.id] || {};
      return {
        questionId: q.id,
        competencyId: q.competencyId,
        domain: q.domain,
        domainName: q.domainName,
        userAnswer: u.answer || "-",
        correctAnswer: q.correctAnswer,
        selectedErrorType: u.selectedErrorType || "E1",
        timeSpentSeconds: Math.round(this.elapsedSeconds / this.questions.length)
      };
    });

    const student = AssessmentStore.getActiveStudent();
    const payload = {
      testType: this.activeTestType,
      testForm: this.activeTestType === "pretest" ? "Form A" : "Form B",
      studentId: student.studentId,
      studentName: student.studentName,
      durationSeconds: this.elapsedSeconds,
      responses: responses
    };

    const savedRecord = await AssessmentStore.recordAttempt(payload);
    this.endTestSession();

    // Tampilkan Modal Ringkasan Hasil Netral (Non-Gamified)
    this.showCompletionModal(savedRecord);
  }

  /**
   * Mengakhiri Sesi Tes
   */
  endTestSession() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.isTestRunning = false;
    this.elapsedSeconds = 0;
  }

  /**
   * Modal Ringkasan Hasil Bersih & Netral
   */
  showCompletionModal(record) {
    let modal = document.getElementById("assessment-completion-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "assessment-completion-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm";
      document.body.appendChild(modal);
    }

    const mins = Math.floor(record.durationSeconds / 60);
    const secs = record.durationSeconds % 60;
    const isPre = record.testType === "pretest";

    modal.innerHTML = `
      <div class="card-clean max-w-lg w-full p-6 space-y-5 bg-slate-900 border border-slate-800 shadow-2xl animate-fade-in">
        
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mx-auto">
            ✓
          </div>
          <h3 class="text-lg font-bold text-white">
            ${isPre ? "Pre-Test Berhasil Diselesaikan" : "Post-Test Berhasil Diselesaikan"}
          </h3>
          <p class="text-xs text-slate-400">
            Data evaluasi pengerjaan Anda telah direkam secara aman dalam basis data riset EPE V2.2.
          </p>
        </div>

        <!-- Ringkasan Hasil Observasional -->
        <div class="grid grid-cols-3 gap-3 text-center bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Skor Tes</span>
            <span class="text-xl font-extrabold text-blue-400 font-mono">${record.score}%</span>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Akurasi</span>
            <span class="text-xl font-extrabold text-white font-mono">${record.correctCount}/${record.totalQuestions}</span>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 block">Durasi</span>
            <span class="text-xl font-extrabold text-slate-300 font-mono">${mins}m ${secs}s</span>
          </div>
        </div>

        <!-- Catatan Metodologis Riset -->
        <div class="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <strong>Catatan Penelitian:</strong> Penilaian ini murni sebagai instrumen pengukuran ilmiah dan tidak memengaruhi saldo koin Cubic maupun koleksi Learning Cubes Anda.
        </div>

        <!-- Tombol Kembali -->
        <div class="pt-2 flex items-center justify-end gap-3">
          <button id="btn-close-completion-modal" class="btn-primary w-full py-2.5 text-xs font-bold">
            Kembali ke Dashboard Siswa
          </button>
        </div>

      </div>
    `;

    modal.classList.remove("hidden");

    modal.querySelector("#btn-close-completion-modal")?.addEventListener("click", () => {
      modal.classList.add("hidden");
      if (isPre) {
        this.renderPreTestView();
      } else {
        this.renderPostTestView();
      }
      this.app?.switchTab("dashboard");
      this.app?.updateDashboardRecentSummary();
    });
  }
}
