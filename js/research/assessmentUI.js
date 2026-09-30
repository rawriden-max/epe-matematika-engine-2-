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
import { QUESTIONS as LEGACY_DIAG_QUESTIONS } from "../data/questions.js";
import { AssessmentStore } from "./assessmentStore.js";
import { integrityService } from "../services/integrityDetector.js";
import { SubjectRegistry } from "../engine/universal/subjectRegistry.js";
import { AssessmentManager } from "./assessmentManager.js";

export class AssessmentUI {
  constructor(appInstance) {
    this.app = appInstance;
    this.activeTestType = null; // 'pretest' | 'posttest'
    this.selectedSubject = "mathematics";
    this.selectedTopic = "all";
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {}; // { questionId: { answer: 'A', selectedErrorType: 'E0', timeSpent: 30, flagged: false } }
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.isTestRunning = false;

    // Konfigurasi Parameter Ujian Guru (Durasi Waktu & Target Jumlah Soal)
    this.customDurationMinutes = parseInt(localStorage.getItem("epe_test_duration_minutes") || "120", 10);
    const rawTarget = localStorage.getItem("epe_test_question_count");
    this.targetQuestionCount = rawTarget === "all" ? "all" : parseInt(rawTarget || "50", 10);
    this.totalDurationSeconds = (this.customDurationMinutes || 120) * 60;

    this.containerPretest = document.getElementById("section-pretest-mode");
    this.containerPosttest = document.getElementById("section-posttest-mode");
  }

  /**
   * Muat butir soal berdasarkan Halaman (Mata Pelajaran), Sub-Halaman (Bab), dan Target Jumlah Soal (Hingga 50+)
   */
  loadAssessmentQuestions(type = "pretest", requestedCount = null) {
    const subjId = this.selectedSubject || "mathematics";
    const topic = this.selectedTopic || "all";
    const target = requestedCount !== null ? requestedCount : this.targetQuestionCount;

    let pool = [];

    if (subjId === "mathematics" && topic === "all") {
      const primaryForm = type === "pretest" ? [...FORM_A_PRETEST] : [...FORM_B_POSTTEST];
      const secondaryForm = type === "pretest" ? [...FORM_B_POSTTEST] : [...FORM_A_PRETEST];

      // Konversi 24 soal diagnostik baku
      const diagList = typeof LEGACY_DIAG_QUESTIONS !== "undefined"
        ? Object.keys(LEGACY_DIAG_QUESTIONS).map((k, idx) => {
            const q = LEGACY_DIAG_QUESTIONS[k];
            return {
              id: `DIAG_${q.id}`,
              number: idx + 13,
              competencyId: q.domain || `C0${(idx % 12) + 1}`,
              domain: q.domain ? q.domain.substring(0, 2) : `D${(idx % 6) + 1}`,
              domainName: q.domain || "Persamaan Kuadrat",
              title: `Diagnostik ${q.id} - ${q.domain || "Persamaan Kuadrat"}`,
              prompt: q.questionText || q.title || `Soal Diagnostik ${q.id}`,
              latex: q.equation || null,
              options: q.options || [],
              correctAnswer: q.correctAnswer || "A",
              explanation: q.remediation || ""
            };
          })
        : [];

      // Ambil bank soal pengayaan matematika dari AssessmentManager
      const extQuestions = AssessmentManager.getAllQuestions({ subject: "mathematics" })
        .filter(q => !q.id.startsWith("PRE_") && !q.id.startsWith("POST_") && !q.id.startsWith("DIAG_"))
        .map((uq, idx) => ({
          id: uq.id,
          number: idx + 37,
          competencyId: uq.subtopic || `C0${(idx % 12) + 1}`,
          domain: `D${(idx % 6) + 1}`,
          domainName: uq.topic || "Matematika",
          title: `${uq.topic || "Matematika"} - Soal ${idx + 1}`,
          prompt: uq.question_text,
          latex: uq.latex || null,
          options: (uq.options && uq.options.length >= 2) ? uq.options : [
            { key: "A", text: "Opsi A", errorType: "E0" },
            { key: "B", text: "Opsi B", errorType: "E1" }
          ],
          correctAnswer: uq.correct_answer || "A",
          explanation: uq.explanation || ""
        }));

      // Gabungkan seluruh bank: primaryForm (12) + diagList (24) + secondaryForm (12) + extQuestions (20) = 68 soal!
      const combined = [
        ...primaryForm,
        ...diagList,
        ...secondaryForm.filter(sf => !primaryForm.some(pf => pf.id === sf.id)),
        ...extQuestions
      ];

      const seen = new Set();
      pool = combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } else {
      let questions = AssessmentManager.getAllQuestions({ subject: subjId });
      if (topic !== "all") {
        questions = questions.filter(q => q.topic === topic);
      }
      if (questions.length === 0) {
        questions = AssessmentManager.getAllQuestions({ subject: subjId });
      }
      pool = questions.map((uq, idx) => ({
        id: uq.id,
        number: idx + 1,
        competencyId: uq.subtopic || `C0${(idx % 12) + 1}`,
        domain: `D${(idx % 6) + 1}`,
        domainName: uq.topic || uq.subject || "Kompetensi",
        title: `${uq.topic || uq.subject} - Soal ${idx + 1}`,
        prompt: uq.question_text,
        latex: uq.latex || null,
        options: (uq.options && uq.options.length >= 2) ? uq.options : [
          { key: "A", text: "Opsi A", errorType: "E0" },
          { key: "B", text: "Opsi B", errorType: "E1" }
        ],
        correctAnswer: uq.correct_answer || "A",
        explanation: uq.explanation || ""
      }));
    }

    // Terapkan batas jumlah soal sesuai pilihan guru
    let finalQuestions = pool;
    if (target && target !== "all") {
      const numTarget = parseInt(target, 10);
      if (!isNaN(numTarget) && numTarget > 0 && numTarget < pool.length) {
        finalQuestions = pool.slice(0, numTarget);
      }
    }

    return finalQuestions.map((q, idx) => ({
      ...q,
      number: idx + 1
    }));
  }

  /**
   * Membuka Halaman Awal / Workstation Pre-Test
   */
  openPreTest() {
    this.activeTestType = "pretest";
    this.questions = this.loadAssessmentQuestions("pretest");
    this.renderPreTestView();
  }

  /**
   * Membuka Halaman Awal / Workstation Post-Test
   */
  openPostTest() {
    this.activeTestType = "posttest";
    this.questions = this.loadAssessmentQuestions("posttest");
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

    const subj = SubjectRegistry.getSubject(this.selectedSubject || "mathematics");
    const activeSubjectName = subj ? subj.name : "Matematika";
    const activeTopicName = this.selectedTopic && this.selectedTopic !== "all" ? this.selectedTopic : "Semua Sub-Halaman";
    const subjectsList = SubjectRegistry.getAllSubjects();
    const topicsList = SubjectRegistry.getTopicsForSubject(this.selectedSubject || "mathematics");
    const totalQuestionsCount = this.questions.length;

    this.containerPretest.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 py-4">
        
        <!-- Header Banner Asesmen & Tugas -->
        <div class="card-clean p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
              Asesmen &amp; Tugas Mandiri &bull; Pre-Test / Tugas Form
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Baseline &amp; Assignment Layer</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pre-Test / Tugas: ${activeSubjectName} &bull; ${activeTopicName}
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            "Ukur kemampuan awalmu atau selesaikan tugas pengerjaan mandiri pada bidang ${activeSubjectName}."
          </p>
        </div>

        <!-- Halaman (Mata Pelajaran) & Sub-Halaman (Bab) Selector -->
        <div class="card-clean p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/30 shadow-xs">
              ${subj?.icon || "📚"}
            </span>
            <div>
              <span class="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Halaman &amp; Sub-Halaman Soal:</span>
              <div class="text-sm font-extrabold text-slate-900 dark:text-white" id="pretest-selected-info">
                ${activeSubjectName} &bull; ${activeTopicName}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Pilih mata pelajaran dan bab untuk memuat soal yang disediakan guru.</p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
            <div class="space-y-1 w-full sm:w-auto min-w-[160px]">
              <label for="pretest-subject-select" class="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Halaman (Mapel):</label>
              <select id="pretest-subject-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 shadow-sm">
                ${subjectsList.map(s => `<option value="${s.id}" ${s.id === (this.selectedSubject || "mathematics") ? "selected" : ""}>${s.icon || "📚"} ${s.name}</option>`).join("")}
              </select>
            </div>

            <div class="space-y-1 w-full sm:w-auto min-w-[180px]">
              <label for="pretest-topic-select" class="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Sub-Halaman (Bab):</label>
              <select id="pretest-topic-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus:border-blue-500 shadow-sm">
                <option value="all" ${(this.selectedTopic === "all" || !this.selectedTopic) ? "selected" : ""}>🌟 Semua Sub-Halaman</option>
                ${topicsList.map(t => `<option value="${t}" ${t === this.selectedTopic ? "selected" : ""}>📖 ${t}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>

        <!-- PENGATURAN PARAMETER UJIAN GURU: JUMLAH SOAL (S.D 50+) & DURASI WAKTU (120 MENIT / 2 JAM) -->
        <div class="card-clean p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-indigo-100 dark:border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/30">
                ⚙️
              </span>
              <div>
                <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Konfigurasi Ujian Guru (Durasi &amp; Butir Soal)</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Tentukan jumlah soal (hingga 50+ butir) dan alokasi waktu ujian (misal 50 soal = 120 menit / 2 jam)</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Pengaturan Guru &bull; Otonom
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Pilihan Jumlah Soal -->
            <div class="space-y-1.5">
              <label for="pretest-question-count-select" class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>📝 Target Jumlah Soal:</span>
                <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">${totalQuestionsCount} Butir Aktif</span>
              </label>
              <select id="pretest-question-count-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm">
                <option value="10" ${this.targetQuestionCount === 10 ? "selected" : ""}>10 Butir (Kuis Ringkas)</option>
                <option value="12" ${this.targetQuestionCount === 12 ? "selected" : ""}>12 Butir (Baku Standar Form A)</option>
                <option value="20" ${this.targetQuestionCount === 20 ? "selected" : ""}>20 Butir (Ulangan Harian)</option>
                <option value="25" ${this.targetQuestionCount === 25 ? "selected" : ""}>25 Butir (Asesmen Bab)</option>
                <option value="30" ${this.targetQuestionCount === 30 ? "selected" : ""}>30 Butir (Asesmen Menengah)</option>
                <option value="40" ${this.targetQuestionCount === 40 ? "selected" : ""}>40 Butir (Try Out)</option>
                <option value="50" ${this.targetQuestionCount === 50 ? "selected" : ""}>50 Butir (Ujian Penuh 2 Jam / 120 Menit)</option>
                <option value="all" ${this.targetQuestionCount === "all" ? "selected" : ""}>🌟 Semua Soal Tersedia (50+ Butir Lengkap)</option>
              </select>
            </div>

            <!-- Pilihan Durasi Waktu Ujian -->
            <div class="space-y-1.5">
              <label for="pretest-duration-select" class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>⏱️ Durasi Waktu Ujian (Ditentukan Guru):</span>
                <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">${this.customDurationMinutes} Menit (${(this.customDurationMinutes / 60).toFixed(1)} Jam)</span>
              </label>
              <select id="pretest-duration-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-emerald-500 shadow-sm">
                <option value="15" ${this.customDurationMinutes === 15 ? "selected" : ""}>15 Menit (Kuis Kilat)</option>
                <option value="30" ${this.customDurationMinutes === 30 ? "selected" : ""}>30 Menit (Latihan Cepat)</option>
                <option value="45" ${this.customDurationMinutes === 45 ? "selected" : ""}>45 Menit (1 Jam Pelajaran)</option>
                <option value="60" ${this.customDurationMinutes === 60 ? "selected" : ""}>60 Menit (1 Jam Standar)</option>
                <option value="90" ${this.customDurationMinutes === 90 ? "selected" : ""}>90 Menit (1,5 Jam Asesmen)</option>
                <option value="120" ${this.customDurationMinutes === 120 ? "selected" : ""}>120 Menit (2 Jam Penuh / Standar 50 Soal)</option>
                <option value="custom" ${![15, 30, 45, 60, 90, 120].includes(this.customDurationMinutes) ? "selected" : ""}>✍️ Masukkan Durasi Kustom...</option>
              </select>
            </div>
          </div>

          <!-- Input Kustom Menit (Muncul jika pilih custom) -->
          <div id="container-pretest-custom-minutes" class="${[15, 30, 45, 60, 90, 120].includes(this.customDurationMinutes) ? "hidden" : ""} flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">Durasi Menit Kustom:</span>
            <input type="number" id="input-pretest-custom-minutes" min="5" max="360" step="5" value="${this.customDurationMinutes}" class="w-24 px-3 py-1.5 rounded-lg border border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs" />
            <span class="text-xs text-slate-500">Menit (Contoh: 120 = 2 jam, 150 = 2,5 jam)</span>
          </div>
        </div>

        <!-- Kartu Panduan & Aturan Pengerjaan -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card-clean p-4 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Jumlah Soal</span>
            <div class="text-xl font-extrabold text-slate-900 dark:text-white">${totalQuestionsCount} Butir</div>
            <p class="text-[11px] text-slate-500">Mencakup materi ${activeTopicName} pada bidang ${activeSubjectName}.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alokasi Waktu Ujian</span>
            <div class="text-xl font-extrabold text-blue-600 dark:text-blue-400">${this.customDurationMinutes} Menit (${(this.customDurationMinutes / 60).toFixed(1)} Jam)</div>
            <p class="text-[11px] text-slate-500">Dilengkapi hitung mundur otomatis dan peringatan waktu.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Integritas Penilaian</span>
            <div class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">Non-Reward</div>
            <p class="text-[11px] text-slate-500">Bebas dari tekanan Cubic/Avatar untuk menjaga kemurnian data.</p>
          </div>
        </div>

        <!-- Pedoman Pengerjaan -->
        <div class="card-clean p-5 space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h4 class="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Protokol &amp; Aturan Pengerjaan:</span>
          </h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
            <li>Kerjakan secara mandiri di atas kertas buram tanpa bantuan kalkulator atau sumber eksternal.</li>
            <li>Pilihlah salah satu opsi (A, B, C, atau D) yang paling sesuai dengan pemahaman Anda.</li>
            <li>Anda dapat menandai ragu-ragu dan berpindah antar butir soal kapan saja sebelum mengirim jawaban akhir.</li>
            <li>Data respon disimpan secara rapi untuk rekap nilai guru dan baseline belajar.</li>
          </ul>
        </div>

        <!-- Konfirmasi Keterangan Kelas Siswa (Wajib diisi sebelum pengerjaan) -->
        <div class="card-clean p-4 rounded-xl bg-blue-50/50 dark:bg-slate-900/90 border border-blue-200 dark:border-blue-900/40 space-y-2">
          <div class="flex items-center justify-between">
            <label for="input-assessment-class-pre" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 5m-4 0h4"></path></svg>
              <span>Keterangan Asal Kelas Siswa <span class="text-rose-500">*</span></span>
            </label>
            <span class="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold">Wajib diisi agar guru mudah merekap nilai Anda</span>
          </div>
          <input 
            type="text" 
            id="input-assessment-class-pre" 
            placeholder="Ketik kelas Anda (Contoh: X MIPA 1, XI IPA 2, 9A, dsb.)" 
            value="${localStorage.getItem("epe_student_class") || localStorage.getItem("epe_student_grade") || ""}" 
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <!-- Riwayat Pengerjaan Terakhir (Jika ada) -->
        ${
          latest
            ? `
          <div class="card-clean p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Status Pengerjaan Terakhir:</span>
              <div class="text-xs font-semibold text-slate-900 dark:text-white">
                Attempt Terakhir: <strong class="text-blue-600 dark:text-blue-400 font-bold">${latest.score}%</strong> (${latest.correctCount}/${latest.totalQuestions} Benar) &bull; ${latest.timestamp}
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
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
            <span>${latest ? "Ulangi Pre-Test / Tugas (Attempt Baru)" : "Mulai Pre-Test / Tugas Sekarang"}</span>
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
      const classInput = this.containerPretest.querySelector("#input-assessment-class-pre");
      const enteredClass = classInput ? classInput.value.trim() : "";
      if (!enteredClass) {
        alert("Mohon masukkan keterangan kelas Anda terlebih dahulu agar guru dapat mengenali dan merekap nilai Anda.");
        classInput?.focus();
        return;
      }
      localStorage.setItem("epe_student_class", enteredClass);
      this.startTest("pretest");
    });

    // Subject & Topic selector change events
    const subjSelect = this.containerPretest.querySelector("#pretest-subject-select");
    const topicSelect = this.containerPretest.querySelector("#pretest-topic-select");
    const countSelect = this.containerPretest.querySelector("#pretest-question-count-select");
    const durSelect = this.containerPretest.querySelector("#pretest-duration-select");
    const customMinutesContainer = this.containerPretest.querySelector("#container-pretest-custom-minutes");
    const customMinutesInput = this.containerPretest.querySelector("#input-pretest-custom-minutes");

    subjSelect?.addEventListener("change", (e) => {
      this.selectedSubject = e.target.value;
      this.selectedTopic = "all";
      this.questions = this.loadAssessmentQuestions("pretest");
      this.renderPreTestView();
    });

    topicSelect?.addEventListener("change", (e) => {
      this.selectedTopic = e.target.value;
      this.questions = this.loadAssessmentQuestions("pretest");
      this.renderPreTestView();
    });

    countSelect?.addEventListener("change", (e) => {
      const val = e.target.value;
      this.targetQuestionCount = val === "all" ? "all" : parseInt(val, 10);
      localStorage.setItem("epe_test_question_count", val);

      // Jika guru memilih 50 soal, otomatis sarankan 120 menit (2 jam)
      if ((val === "50" || val === "all") && this.customDurationMinutes < 90) {
        this.customDurationMinutes = 120;
        localStorage.setItem("epe_test_duration_minutes", "120");
      }

      this.questions = this.loadAssessmentQuestions("pretest");
      this.renderPreTestView();
    });

    durSelect?.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "custom") {
        if (customMinutesContainer) customMinutesContainer.classList.remove("hidden");
        customMinutesInput?.focus();
      } else {
        if (customMinutesContainer) customMinutesContainer.classList.add("hidden");
        this.customDurationMinutes = parseInt(val, 10);
        localStorage.setItem("epe_test_duration_minutes", val);
        this.renderPreTestView();
      }
    });

    customMinutesInput?.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10) || 60;
      this.customDurationMinutes = val;
      localStorage.setItem("epe_test_duration_minutes", val.toString());
      this.renderPreTestView();
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

    // Tampilkan Layar Briefing Post-Test / Remedial (Bebas diakses untuk mode tugas & kompetisi)
    const subj = SubjectRegistry.getSubject(this.selectedSubject || "mathematics");
    const activeSubjectName = subj ? subj.name : "Matematika";
    const activeTopicName = this.selectedTopic && this.selectedTopic !== "all" ? this.selectedTopic : "Semua Sub-Halaman";
    const subjectsList = SubjectRegistry.getAllSubjects();
    const topicsList = SubjectRegistry.getTopicsForSubject(this.selectedSubject || "mathematics");
    const totalQuestionsCount = this.questions.length;

    this.containerPosttest.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-6 py-4">
        
        <!-- Header Banner Evaluasi & Remedial -->
        <div class="card-clean p-6 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30">
              Evaluasi Akhir &amp; Remedial &bull; Post-Test / Remedial Form
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400">Post-Intervention &amp; Mastery Layer</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Post-Test / Remedial: ${activeSubjectName} &bull; ${activeTopicName}
          </h2>
          <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            "Uji kembali pemahamanmu setelah proses belajar atau selesaikan evaluasi remedial pada bidang ${activeSubjectName}."
          </p>
        </div>

        <!-- Halaman (Mata Pelajaran) & Sub-Halaman (Bab) Selector -->
        <div class="card-clean p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/30 shadow-xs">
              ${subj?.icon || "📚"}
            </span>
            <div>
              <span class="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">Halaman &amp; Sub-Halaman Soal:</span>
              <div class="text-sm font-extrabold text-slate-900 dark:text-white" id="posttest-selected-info">
                ${activeSubjectName} &bull; ${activeTopicName}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">Pilih mata pelajaran dan bab untuk memuat soal evaluasi akhir.</p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full md:w-auto">
            <div class="space-y-1 w-full sm:w-auto min-w-[160px]">
              <label for="posttest-subject-select" class="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Halaman (Mapel):</label>
              <select id="posttest-subject-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus:border-indigo-500 shadow-sm">
                ${subjectsList.map(s => `<option value="${s.id}" ${s.id === (this.selectedSubject || "mathematics") ? "selected" : ""}>${s.icon || "📚"} ${s.name}</option>`).join("")}
              </select>
            </div>

            <div class="space-y-1 w-full sm:w-auto min-w-[180px]">
              <label for="posttest-topic-select" class="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Sub-Halaman (Bab):</label>
              <select id="posttest-topic-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus:border-indigo-500 shadow-sm">
                <option value="all" ${(this.selectedTopic === "all" || !this.selectedTopic) ? "selected" : ""}>🌟 Semua Sub-Halaman</option>
                ${topicsList.map(t => `<option value="${t}" ${t === this.selectedTopic ? "selected" : ""}>📖 ${t}</option>`).join("")}
              </select>
            </div>
          </div>
        </div>

        <!-- PENGATURAN PARAMETER UJIAN GURU: JUMLAH SOAL (S.D 50+) & DURASI WAKTU (120 MENIT / 2 JAM) -->
        <div class="card-clean p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 border-2 border-indigo-200 dark:border-indigo-900/60 shadow-lg space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-indigo-100 dark:border-slate-800">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-600/30">
                ⚙️
              </span>
              <div>
                <h3 class="text-sm font-extrabold text-slate-900 dark:text-white">Konfigurasi Ujian Guru (Durasi &amp; Butir Soal)</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">Tentukan jumlah soal (hingga 50+ butir) dan alokasi waktu ujian (misal 50 soal = 120 menit / 2 jam)</p>
              </div>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Pengaturan Guru &bull; Otonom
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Pilihan Jumlah Soal -->
            <div class="space-y-1.5">
              <label for="posttest-question-count-select" class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>📝 Target Jumlah Soal:</span>
                <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">${totalQuestionsCount} Butir Aktif</span>
              </label>
              <select id="posttest-question-count-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm">
                <option value="10" ${this.targetQuestionCount === 10 ? "selected" : ""}>10 Butir (Kuis Ringkas)</option>
                <option value="12" ${this.targetQuestionCount === 12 ? "selected" : ""}>12 Butir (Baku Standar Form B)</option>
                <option value="20" ${this.targetQuestionCount === 20 ? "selected" : ""}>20 Butir (Ulangan Harian)</option>
                <option value="25" ${this.targetQuestionCount === 25 ? "selected" : ""}>25 Butir (Asesmen Bab)</option>
                <option value="30" ${this.targetQuestionCount === 30 ? "selected" : ""}>30 Butir (Asesmen Menengah)</option>
                <option value="40" ${this.targetQuestionCount === 40 ? "selected" : ""}>40 Butir (Try Out)</option>
                <option value="50" ${this.targetQuestionCount === 50 ? "selected" : ""}>50 Butir (Ujian Penuh 2 Jam / 120 Menit)</option>
                <option value="all" ${this.targetQuestionCount === "all" ? "selected" : ""}>🌟 Semua Soal Tersedia (50+ Butir Lengkap)</option>
              </select>
            </div>

            <!-- Pilihan Durasi Waktu Ujian -->
            <div class="space-y-1.5">
              <label for="posttest-duration-select" class="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>⏱️ Durasi Waktu Ujian (Ditentukan Guru):</span>
                <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">${this.customDurationMinutes} Menit (${(this.customDurationMinutes / 60).toFixed(1)} Jam)</span>
              </label>
              <select id="posttest-duration-select" class="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-emerald-500 shadow-sm">
                <option value="15" ${this.customDurationMinutes === 15 ? "selected" : ""}>15 Menit (Kuis Kilat)</option>
                <option value="30" ${this.customDurationMinutes === 30 ? "selected" : ""}>30 Menit (Latihan Cepat)</option>
                <option value="45" ${this.customDurationMinutes === 45 ? "selected" : ""}>45 Menit (1 Jam Pelajaran)</option>
                <option value="60" ${this.customDurationMinutes === 60 ? "selected" : ""}>60 Menit (1 Jam Standar)</option>
                <option value="90" ${this.customDurationMinutes === 90 ? "selected" : ""}>90 Menit (1,5 Jam Asesmen)</option>
                <option value="120" ${this.customDurationMinutes === 120 ? "selected" : ""}>120 Menit (2 Jam Penuh / Standar 50 Soal)</option>
                <option value="custom" ${![15, 30, 45, 60, 90, 120].includes(this.customDurationMinutes) ? "selected" : ""}>✍️ Masukkan Durasi Kustom...</option>
              </select>
            </div>
          </div>

          <!-- Input Kustom Menit (Muncul jika pilih custom) -->
          <div id="container-posttest-custom-minutes" class="${[15, 30, 45, 60, 90, 120].includes(this.customDurationMinutes) ? "hidden" : ""} flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300">Durasi Menit Kustom:</span>
            <input type="number" id="input-posttest-custom-minutes" min="5" max="360" step="5" value="${this.customDurationMinutes}" class="w-24 px-3 py-1.5 rounded-lg border border-emerald-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs" />
            <span class="text-xs text-slate-500">Menit (Contoh: 120 = 2 jam, 150 = 2,5 jam)</span>
          </div>
        </div>

        <!-- Kartu Panduan & Struktur Paralel -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card-clean p-4 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Struktur Pengukuran</span>
            <div class="text-xl font-extrabold text-slate-900 dark:text-white">${totalQuestionsCount} Butir Soal</div>
            <p class="text-[11px] text-slate-500">Mencakup materi ${activeTopicName} pada bidang ${activeSubjectName}.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alokasi Waktu Ujian</span>
            <div class="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">${this.customDurationMinutes} Menit (${(this.customDurationMinutes / 60).toFixed(1)} Jam)</div>
            <p class="text-[11px] text-slate-500">Dilengkapi hitung mundur otomatis dan peringatan waktu.</p>
          </div>

          <div class="card-clean p-4 space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Integritas Pengukuran</span>
            <div class="text-xl font-extrabold text-teal-600 dark:text-teal-400">Comparable</div>
            <p class="text-[11px] text-slate-500">Siap dibandingkan langsung dengan skor awal Pre-Test / Tugas.</p>
          </div>
        </div>

        <!-- Pedoman Pengerjaan -->
        <div class="card-clean p-5 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h4 class="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Protokol Post-Test / Remedial:</span>
          </h4>
          <ul class="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
            <li>Tidak ada petunjuk jawaban atau pembimbingan langkah selama tes berlangsung.</li>
            <li>Kerjakan secara mandiri dengan teliti untuk mengukur penguasaan konsep Anda.</li>
            <li>Hasil Post-Test / Remedial otomatis terekam ke database nilai guru.</li>
          </ul>
        </div>

        <!-- Konfirmasi Keterangan Kelas Siswa (Wajib diisi sebelum pengerjaan) -->
        <div class="card-clean p-4 rounded-xl bg-indigo-50/50 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-900/40 space-y-2">
          <div class="flex items-center justify-between">
            <label for="input-assessment-class-post" class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 5m-4 0h4"></path></svg>
              <span>Keterangan Asal Kelas Siswa <span class="text-rose-500">*</span></span>
            </label>
            <span class="text-[10.5px] text-indigo-600 dark:text-indigo-400 font-semibold">Wajib diisi agar guru mudah merekap nilai Anda</span>
          </div>
          <input 
            type="text" 
            id="input-assessment-class-post" 
            placeholder="Ketik kelas Anda (Contoh: X MIPA 1, XI IPA 2, 9A, dsb.)" 
            value="${localStorage.getItem("epe_student_class") || localStorage.getItem("epe_student_grade") || ""}" 
            class="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <!-- Riwayat Pengerjaan Post-Test Terakhir (Jika ada) -->
        ${
          latest
            ? `
          <div class="card-clean p-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="space-y-0.5">
              <span class="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Skor Evaluasi Terakhir:</span>
              <div class="text-xs font-semibold text-slate-900 dark:text-white">
                Attempt Terakhir: <strong class="text-indigo-600 dark:text-indigo-400 font-bold">${latest.score}%</strong> (${latest.correctCount}/${latest.totalQuestions} Benar) &bull; ${latest.timestamp}
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-bold">
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
            <span>${latest ? "Ulangi Post-Test / Remedial (Attempt Baru)" : "Mulai Post-Test / Remedial Sekarang"}</span>
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
      const classInput = this.containerPosttest.querySelector("#input-assessment-class-post");
      const enteredClass = classInput ? classInput.value.trim() : "";
      if (!enteredClass) {
        alert("Mohon masukkan keterangan kelas Anda terlebih dahulu agar guru dapat mengenali dan merekap nilai Anda.");
        classInput?.focus();
        return;
      }
      localStorage.setItem("epe_student_class", enteredClass);
      this.startTest("posttest");
    });

    // Subject & Topic selector change events
    const subjSelect = this.containerPosttest.querySelector("#posttest-subject-select");
    const topicSelect = this.containerPosttest.querySelector("#posttest-topic-select");
    const countSelect = this.containerPosttest.querySelector("#posttest-question-count-select");
    const durSelect = this.containerPosttest.querySelector("#posttest-duration-select");
    const customMinutesContainer = this.containerPosttest.querySelector("#container-posttest-custom-minutes");
    const customMinutesInput = this.containerPosttest.querySelector("#input-posttest-custom-minutes");

    subjSelect?.addEventListener("change", (e) => {
      this.selectedSubject = e.target.value;
      this.selectedTopic = "all";
      this.questions = this.loadAssessmentQuestions("posttest");
      this.renderPostTestView();
    });

    topicSelect?.addEventListener("change", (e) => {
      this.selectedTopic = e.target.value;
      this.questions = this.loadAssessmentQuestions("posttest");
      this.renderPostTestView();
    });

    countSelect?.addEventListener("change", (e) => {
      const val = e.target.value;
      this.targetQuestionCount = val === "all" ? "all" : parseInt(val, 10);
      localStorage.setItem("epe_test_question_count", val);

      // Jika guru memilih 50 soal, otomatis sarankan 120 menit (2 jam)
      if ((val === "50" || val === "all") && this.customDurationMinutes < 90) {
        this.customDurationMinutes = 120;
        localStorage.setItem("epe_test_duration_minutes", "120");
      }

      this.questions = this.loadAssessmentQuestions("posttest");
      this.renderPostTestView();
    });

    durSelect?.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "custom") {
        if (customMinutesContainer) customMinutesContainer.classList.remove("hidden");
        customMinutesInput?.focus();
      } else {
        if (customMinutesContainer) customMinutesContainer.classList.add("hidden");
        this.customDurationMinutes = parseInt(val, 10);
        localStorage.setItem("epe_test_duration_minutes", val);
        this.renderPostTestView();
      }
    });

    customMinutesInput?.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10) || 60;
      this.customDurationMinutes = val;
      localStorage.setItem("epe_test_duration_minutes", val.toString());
      this.renderPostTestView();
    });
  }

  /**
   * Memulai Tes Baru
   */
  startTest(testType = "pretest") {
    this.activeTestType = testType;
    this.questions = this.loadAssessmentQuestions(testType);
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
    this.totalDurationSeconds = (this.customDurationMinutes || 120) * 60;
    this.isTestRunning = true;

    // Inisialisasi telemetri integritas akademik non-invasif
    const activeStudent = AssessmentStore.getActiveStudent();
    const studentClass = localStorage.getItem("epe_student_class") || activeStudent.studentClass || "";
    integrityService.startSession(
      `asm_${testType}_${Date.now()}`,
      testType,
      activeStudent.studentId,
      activeStudent.studentName,
      this.selectedSubject || "matematika",
      studentClass
    );

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      const remaining = Math.max(0, this.totalDurationSeconds - this.elapsedSeconds);
      this.updateTimerDisplay(remaining);

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeUpAutoSubmit();
      }
    }, 1000);

    const targetContainer = testType === "pretest" ? this.containerPretest : this.containerPosttest;
    this.renderActiveTestScreen(targetContainer);
  }

  /**
   * Memperbarui Tampilan Timer Pengerjaan (Hitung Mundur Sesuai Waktu Guru)
   */
  updateTimerDisplay(remainingSeconds = null) {
    const timerEl = document.getElementById("assessment-timer-display");
    const timerContainer = document.getElementById("assessment-timer-container");
    if (!timerEl) return;

    const remaining = remainingSeconds !== null
      ? remainingSeconds
      : Math.max(0, (this.totalDurationSeconds || 7200) - this.elapsedSeconds);

    const hours = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;

    let timeStr = "";
    if (hours > 0) {
      timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    timerEl.textContent = timeStr;

    if (timerContainer) {
      if (remaining <= 180) { // < 3 mins
        timerContainer.className = "flex items-center gap-1.5 text-xs font-mono font-bold bg-rose-500/15 text-rose-500 border border-rose-500 px-3 py-1.5 rounded-lg animate-pulse shadow-sm";
      } else if (remaining <= 600) { // < 10 mins
        timerContainer.className = "flex items-center gap-1.5 text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-400 px-3 py-1.5 rounded-lg shadow-sm";
      } else {
        timerContainer.className = "flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800";
      }
    }
  }

  /**
   * Tangani Waktu Ujian Habis Secara Otomatis
   */
  handleTimeUpAutoSubmit() {
    alert("⏰ Waktu ujian yang ditentukan guru telah berakhir! Sistem secara otomatis mengirim seluruh jawaban yang telah Anda kerjakan.");
    this.submitAssessment();
  }

  /**
   * Render Layar Workstation Soal Aktif
   */
  renderActiveTestScreen(container) {
    if (!container || !this.isTestRunning) return;

    const q = this.questions[this.currentIndex];
    
    // Rekam peristiwa butir soal dibuka ke audit telemetri
    integrityService.recordQuestionOpened(q.id, this.currentIndex);

    const userAns = this.userAnswers[q.id] || { answer: null, flagged: false };
    const testTitle = this.activeTestType === "pretest" ? "Pre-Test (Form A)" : "Post-Test (Form B)";
    const totalQ = this.questions.length;
    const answeredCount = Object.values(this.userAnswers).filter((u) => u.answer !== null).length;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4 py-2 select-none">
        
        <!-- Header Assessment Bar -->
        <div class="card-clean p-4 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
              ${testTitle}
            </span>
            <span class="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Soal ${this.currentIndex + 1} dari ${totalQ}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <div id="assessment-timer-container" class="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all">
              <span class="text-blue-500 dark:text-blue-400">⏱️</span>
              <span class="text-[10px] uppercase font-bold text-slate-400 hidden sm:inline">Sisa:</span>
              <span id="assessment-timer-display">02:00:00</span>
            </div>

            <button id="btn-cancel-test" class="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors">
              Batal
            </button>
          </div>
        </div>

        <!-- Main Question & Options Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          <!-- Question Content Card (9 Kolom) -->
          <div class="lg:col-span-9 space-y-4">
            <div class="card-clean p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
              
              <!-- Badges & Domain -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30">
                    ${q.domain} &bull; ${q.domainName}
                  </span>
                  <span class="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">${q.competencyId}</span>
                </div>

                <button type="button" id="btn-toggle-flag" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold cursor-pointer select-none shadow-xs ${
                  userAns.flagged
                    ? "bg-amber-400 dark:bg-amber-500 text-slate-950 border-amber-300 dark:border-amber-400 ring-2 ring-amber-400/40"
                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }">
                  <input type="checkbox" id="chk-flag-question" ${userAns.flagged ? "checked" : ""} class="pointer-events-none rounded text-amber-500 bg-white dark:bg-slate-800 border-amber-400 w-3.5 h-3.5" tabindex="-1" />
                  <span>Tandai Ragu-ragu</span>
                </button>
              </div>

              <!-- Question Title & Prompt (High Contrast on Both Light & Dark) -->
              <div class="space-y-2">
                <h4 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">${q.title}</h4>
                <p class="text-sm sm:text-[15px] text-slate-800 dark:text-slate-200 font-medium leading-relaxed">${q.prompt}</p>
              </div>

              <!-- LaTeX Formula Display (If available) -->
              ${
                q.latex
                  ? `
                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center font-serif text-slate-900 dark:text-blue-300 text-sm sm:text-base overflow-x-auto assessment-latex-box shadow-xs" data-latex="${q.latex}" data-display="true">
                  ${this.formatFormulaHTML(q.latex, true)}
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
                      ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/30 ring-2 ring-blue-500/50 shadow-xs"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900/90";

                    return `
                    <label class="opt-label flex items-start gap-3 p-3.5 rounded-xl border ${activeBorder} transition-all cursor-pointer group">
                      <input 
                        type="radio" 
                        name="opt-q-${q.id}" 
                        value="${opt.key}" 
                        data-errortype="${opt.errorType}"
                        ${isSelected ? "checked" : ""} 
                        class="mt-0.5 text-blue-600 dark:text-blue-500 focus:ring-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer" 
                      />
                      <div class="flex-1 text-xs sm:text-sm">
                        <div class="flex items-center gap-2.5">
                          <span class="w-6 h-6 rounded-md ${
                            isSelected ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                          } flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                            ${opt.key}
                          </span>
                          <div class="text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-white font-medium assessment-opt-display" data-latex="${opt.latex || ""}" data-text="${opt.text}">
                            ${this.renderOptionContent(opt)}
                          </div>
                        </div>
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

              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Terjawab: <strong class="text-slate-900 dark:text-white font-bold">${answeredCount}</strong> / ${totalQ}
              </div>

              ${
                this.currentIndex === totalQ - 1
                  ? `
                <button id="btn-submit-assessment" class="btn-primary text-xs px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20">
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
            <div class="card-clean p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-xs font-bold text-slate-900 dark:text-white">Navigasi Butir</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold">${answeredCount}/${totalQ}</span>
              </div>

              <!-- Question Grid (Mendukung 50+ butir dengan navigasi rapi) -->
              <div class="grid grid-cols-5 gap-1.5 max-h-72 sm:max-h-96 overflow-y-auto pr-1">
                ${this.questions
                  .map((item, idx) => {
                    const ans = this.userAnswers[item.id];
                    const isAnswered = ans && ans.answer !== null;
                    const isFlagged = ans && Boolean(ans.flagged);
                    const isCurrent = idx === this.currentIndex;

                    let btnClass = "";
                    if (isFlagged) {
                      // Prioritas Ragu-ragu: Warna Kuning Menyala (Amber/Yellow) berbobot tebal
                      btnClass = "bg-amber-400 dark:bg-amber-500 text-slate-950 dark:text-slate-950 border-amber-300 dark:border-amber-400 font-extrabold shadow-md";
                    } else if (isAnswered) {
                      // Biru: Sudah Terjawab
                      btnClass = "bg-blue-600 text-white border-blue-500 font-bold shadow-xs";
                    } else {
                      // Abu-abu: Belum Terjawab
                      btnClass = "bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold";
                    }

                    if (isCurrent) {
                      btnClass += isFlagged
                        ? " ring-2 ring-amber-300 dark:ring-yellow-300 scale-105"
                        : " ring-2 ring-blue-500 dark:ring-cyan-400 scale-105";
                    }

                    return `
                    <button data-jump-idx="${idx}" class="py-2 rounded-lg text-xs font-mono border transition-all ${btnClass}">
                      ${idx + 1}
                    </button>
                  `;
                  })
                  .join("")}
              </div>

              <!-- Legend Navigator -->
              <div class="space-y-1.5 pt-2 text-[10px] text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded bg-blue-600"></span>
                  <span>Sudah Terjawab</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded bg-amber-500"></span>
                  <span>Ragu-ragu</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"></span>
                  <span>Belum Dijawab</span>
                </div>
              </div>

              <!-- Quick Submit Shortcut -->
              <div class="pt-2">
                <button id="btn-quick-submit" class="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-white font-bold border border-slate-700 transition-colors shadow-xs">
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
   * Helper pengecekan apakah opsi butir soal murni berupa persamaan matematika
   */
  shouldRenderDirectFormula(text, latex) {
    if (!latex) return false;
    if (!text) return true;
    const lower = text.toLowerCase();
    // Jika mengandung kata-kata penjelas deskriptif Bahasa Indonesia, gunakan penanganan terpadu
    if (lower.includes("akar") || lower.includes("memiliki") || lower.includes("tidak") || lower.includes("hanya")) {
      return false;
    }
    return true;
  }

  /**
   * Render konten opsi jawaban secara rapi (KaTeX terpadu tanpa duplikasi script mentah)
   */
  renderOptionContent(opt) {
    if (!opt) return "";
    const text = opt.text || "";
    const latex = opt.latex || "";

    if (latex && this.shouldRenderDirectFormula(text, latex)) {
      return this.formatFormulaHTML(latex, false, text);
    }

    // Jika teks deskriptif memiliki rumus matematika seperti (D > 0)
    if (text.includes("(D > 0)") || text.includes("(D = 0)") || text.includes("(D < 0)") || text.includes("(h = 0)")) {
      return text.replace(/\((D\s*[>=<]\s*0)\)/g, (match, formula) => {
        return `(${this.formatFormulaHTML(formula, false, formula)})`;
      });
    }

    return text;
  }

  /**
   * Format Formula LaTeX ke KaTeX HTML atau Fallback Human-Readable Bersih
   */
  formatFormulaHTML(latexString, isDisplay = false, fallbackText = "") {
    if (!latexString && !fallbackText) return "";
    const raw = latexString || fallbackText;

    // 1. Jika window.katex telah siap, render langsung secara sinkron
    if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
      try {
        let clean = raw.trim();
        if (clean.startsWith("$$") && clean.endsWith("$$")) clean = clean.slice(2, -2).trim();
        if (clean.startsWith("$") && clean.endsWith("$")) clean = clean.slice(1, -1).trim();

        return window.katex.renderToString(clean, {
          displayMode: isDisplay,
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX renderToString error:", e);
      }
    }

    // 2. Fallback Elegan: Tampilkan notasi matematika manusiawi tanpa syntax LaTeX mentah
    return this.cleanMathFallback(fallbackText || latexString);
  }

  /**
   * Menghilangkan sintaks mentah LaTeX jika KaTeX offline/belum termuat
   */
  cleanMathFallback(str) {
    if (!str) return "";
    let s = str.trim();
    if (s.startsWith("$$") && s.endsWith("$$")) s = s.slice(2, -2).trim();
    if (s.startsWith("$") && s.endsWith("$")) s = s.slice(1, -1).trim();

    return s
      .replace(/\\cdot/g, " · ")
      .replace(/\\times/g, " × ")
      .replace(/\\pm/g, " ± ")
      .replace(/\\implies/g, " ⇒ ")
      .replace(/\\iff/g, " ⇔ ")
      .replace(/\\quad/g, "  ")
      .replace(/\\,/g, " ")
      .replace(/\\;/g, " ")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/_1/g, "₁")
      .replace(/_2/g, "₂")
      .replace(/_3/g, "₃")
      .replace(/_n/g, "ₙ")
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^t/g, "ᵗ")
      .replace(/\^/g, "");
  }

  /**
   * Rendering Rumus KaTeX Otomatis & Reaktif
   */
  renderMathEquations(container) {
    if (!container) return;

    const doRender = () => {
      // 1. Ekstensi Auto-Render (untuk teks umum yang memuat delimiter $ atau $$)
      if (typeof renderMathInElement === "function") {
        try {
          renderMathInElement(container, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
              { left: "\\[", right: "\\]", display: true },
              { left: "\\(", right: "\\)", display: false }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn("Gagal render KaTeX auto:", e);
        }
      }

      // 2. Direct Render untuk elemen formula spesifik jika belum ter-render
      if (typeof window !== "undefined" && window.katex && typeof window.katex.render === "function") {
        container.querySelectorAll(".assessment-latex-box").forEach((box) => {
          if (!box.querySelector(".katex")) {
            const latex = box.getAttribute("data-latex");
            if (latex) {
              const isDisplay = box.getAttribute("data-display") === "true";
              try {
                window.katex.render(latex, box, {
                  displayMode: isDisplay,
                  throwOnError: false
                });
              } catch (err) {
                box.textContent = this.cleanMathFallback(latex);
              }
            }
          }
        });

        container.querySelectorAll(".assessment-opt-display").forEach((box) => {
          if (!box.querySelector(".katex")) {
            const latex = box.getAttribute("data-latex");
            const text = box.getAttribute("data-text");
            if (latex && this.shouldRenderDirectFormula(text, latex)) {
              try {
                window.katex.render(latex, box, {
                  displayMode: false,
                  throwOnError: false
                });
              } catch (err) {
                // Biarkan teks fallback yang sudah ada
              }
            }
          }
        });
      }
    };

    doRender();

    // Jika KaTeX script CDN masih dalam proses loading async/defer
    if (typeof window === "undefined" || !window.katex) {
      setTimeout(doRender, 150);
      setTimeout(doRender, 500);
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
        const prevVal = this.userAnswers[q.id]?.answer || null;
        this.userAnswers[q.id].answer = val;
        this.userAnswers[q.id].selectedErrorType = errType;
        integrityService.recordAnswerChanged(q.id, val, prevVal);
        this.renderActiveTestScreen(container);
      });
    });

    // Flag toggle button (Ragu-ragu)
    const toggleFlagBtn = container.querySelector("#btn-toggle-flag");
    if (toggleFlagBtn) {
      toggleFlagBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.userAnswers[q.id]) {
          this.userAnswers[q.id] = { answer: null, selectedErrorType: null, timeSpent: 0, flagged: false };
        }
        this.userAnswers[q.id].flagged = !this.userAnswers[q.id].flagged;
        this.renderActiveTestScreen(container);
      });
    }

    container.querySelector("#chk-flag-question")?.addEventListener("change", (e) => {
      if (!this.userAnswers[q.id]) {
        this.userAnswers[q.id] = { answer: null, selectedErrorType: null, timeSpent: 0, flagged: false };
      }
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
        integrityService.endSession();
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
    const testLabel = this.activeTestType === "pretest" ? "Pre-Test / Tugas" : "Post-Test / Remedial";

    let msg = `Kirim dan selesaikan ${testLabel}?`;
    if (unansweredCount > 0) {
      msg = `Perhatian: Masih ada ${unansweredCount} butir soal yang belum dijawab.\n\nApakah Anda yakin ingin menyelesaikan ${testLabel} sekarang?`;
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
    const integritySession = integrityService.endSession();

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
      studentClass: localStorage.getItem("epe_student_class") || student.studentClass || "",
      subject: this.selectedSubject || "mathematics",
      durationSeconds: this.elapsedSeconds,
      responses: responses,
      integritySessionId: integritySession?.sessionId || null,
      integritySignals: integritySession?.signals || null,
      integritySession: integritySession
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
      <div class="card-clean max-w-lg w-full p-6 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in">
        
        <div class="text-center space-y-2">
          <div class="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto">
            ✓
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">
            ${isPre ? "Pre-Test Berhasil Diselesaikan" : "Post-Test Berhasil Diselesaikan"}
          </h3>
          <p class="text-xs text-slate-600 dark:text-slate-400">
            Data evaluasi pengerjaan Anda telah direkam secara aman dalam basis data riset EPE V2.2.
          </p>
        </div>

        <!-- Ringkasan Hasil Observasional -->
        <div class="grid grid-cols-3 gap-3 text-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Skor Tes</span>
            <span class="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">${record.score}%</span>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Akurasi</span>
            <span class="text-xl font-extrabold text-slate-900 dark:text-white font-mono">${record.correctCount}/${record.totalQuestions}</span>
          </div>

          <div>
            <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Durasi</span>
            <span class="text-xl font-extrabold text-slate-700 dark:text-slate-300 font-mono">${mins}m ${secs}s</span>
          </div>
        </div>

        <!-- Catatan Metodologis Riset -->
        <div class="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong class="text-slate-800 dark:text-slate-200">Catatan Penelitian:</strong> Penilaian ini murni sebagai instrumen pengukuran ilmiah dan tidak memengaruhi saldo koin Cubic maupun koleksi Learning Cubes Anda.
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
