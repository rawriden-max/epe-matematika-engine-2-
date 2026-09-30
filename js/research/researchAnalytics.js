/**
 * researchAnalytics.js - Modul Analisis Statistik & Komparasi Riset EPE V2.2
 * 
 * Fitur:
 * 1. Analisis Komparatif Observasional: Pre-Test vs Post-Test
 * 2. Perubahan Skor, Akurasi, dan Jumlah Benar (Menggunakan bahasa deskriptif netral)
 * 3. Matriks Pergeseran Pola Kesalahan Kognitif (E1 - E4) Before vs After
 * 4. Performa Akurasi Domain (D1 - D6) Before vs After
 * 5. Matriks Pemetaan Tingkat Butir Soal (C01 - C12)
 * 6. Ringkasan Statistik Penelitian: N, Mean, Median, Deviasi, Distribusi Akurasi
 */

import { AssessmentStore } from "./assessmentStore.js";
import { PARALLEL_COMPETENCIES } from "./assessmentForms.js";

export class ResearchAnalytics {
  /**
   * Menghitung nilai mean (rata-rata) dari array angka
   */
  static calcMean(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return parseFloat((sum / arr.length).toFixed(2));
  }

  /**
   * Menghitung nilai median dari array angka
   */
  static calcMedian(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
    }
    return parseFloat(sorted[mid].toFixed(2));
  }

  /**
   * Menghasilkan laporan komparasi komprehensif Pre-Test vs Post-Test
   */
  static getComparisonReport() {
    const preAttempts = AssessmentStore.getAllAttempts("pretest");
    const postAttempts = AssessmentStore.getAllAttempts("posttest");

    const latestPre = preAttempts.length > 0 ? preAttempts[preAttempts.length - 1] : null;
    const latestPost = postAttempts.length > 0 ? postAttempts[postAttempts.length - 1] : null;

    const preScores = preAttempts.map((a) => a.score);
    const postScores = postAttempts.map((a) => a.score);

    const meanPre = this.calcMean(preScores);
    const meanPost = this.calcMean(postScores);
    const medianPre = this.calcMedian(preScores);
    const medianPost = this.calcMedian(postScores);

    // Perubahan Skor Deskriptif (Score Change)
    const scoreDiff = latestPre && latestPost ? parseFloat((latestPost.score - latestPre.score).toFixed(1)) : null;
    const accuracyDiff = latestPre && latestPost ? parseFloat(((latestPost.accuracy - latestPre.accuracy) * 100).toFixed(1)) : null;
    const correctDiff = latestPre && latestPost ? latestPost.correctCount - latestPre.correctCount : null;

    // Pergeseran Pola Kesalahan Kognitif E1 - E4 (Observasional)
    const errorShift = {
      E1: { pre: latestPre?.errorDistribution?.E1 ?? 0, post: latestPost?.errorDistribution?.E1 ?? 0 },
      E2: { pre: latestPre?.errorDistribution?.E2 ?? 0, post: latestPost?.errorDistribution?.E2 ?? 0 },
      E3: { pre: latestPre?.errorDistribution?.E3 ?? 0, post: latestPost?.errorDistribution?.E3 ?? 0 },
      E4: { pre: latestPre?.errorDistribution?.E4 ?? 0, post: latestPost?.errorDistribution?.E4 ?? 0 }
    };

    // Pergeseran Domain D1 - D6
    const domainShift = {};
    const domains = ["D1", "D2", "D3", "D4", "D5", "D6"];
    domains.forEach((d) => {
      domainShift[d] = {
        pre: latestPre?.domainAccuracy?.[d] ?? 0,
        post: latestPost?.domainAccuracy?.[d] ?? 0
      };
    });

    // Pemetaan Butir Berdasarkan Kompetensi (C01 - C12)
    const competencyMapping = [];
    Object.keys(PARALLEL_COMPETENCIES).forEach((cId) => {
      const comp = PARALLEL_COMPETENCIES[cId];
      const preResp = latestPre?.responses?.find((r) => r.competencyId === cId);
      const postResp = latestPost?.responses?.find((r) => r.competencyId === cId);

      competencyMapping.push({
        competencyId: cId,
        competencyName: comp.name,
        domain: comp.domain,
        preAnswer: preResp ? preResp.userAnswer : "-",
        preCorrect: preResp ? preResp.isCorrect : null,
        preError: preResp ? preResp.errorCode : "-",
        postAnswer: postResp ? postResp.userAnswer : "-",
        postCorrect: postResp ? postResp.isCorrect : null,
        postError: postResp ? postResp.errorCode : "-"
      });
    });

    return {
      hasData: Boolean(latestPre || latestPost),
      hasBoth: Boolean(latestPre && latestPost),
      preAttemptsCount: preAttempts.length,
      postAttemptsCount: postAttempts.length,
      latestPre,
      latestPost,
      metrics: {
        scoreDiff,
        accuracyDiff,
        correctDiff,
        meanPre,
        meanPost,
        medianPre,
        medianPost,
        meanDiff: postAttempts.length > 0 && preAttempts.length > 0 ? parseFloat((meanPost - meanPre).toFixed(2)) : null
      },
      errorShift,
      domainShift,
      competencyMapping
    };
  }

  /**
   * Render Panel Komparasi Pre-Test vs Post-Test di Mode Riset
   */
  static renderResearchModeComparison(container) {
    if (!container) return;

    const report = this.getComparisonReport();

    if (!report.hasData) {
      container.innerHTML = `
        <div class="card-clean p-8 text-center text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div class="text-3xl mb-2">📊</div>
          <p class="font-bold text-slate-900 dark:text-white mb-1">Belum Ada Data Pre-Test / Post-Test</p>
          <p class="max-w-md mx-auto text-slate-500 dark:text-slate-400">
            Siswa perlu menyelesaikan Pre-Test (Form A) dan Post-Test (Form B) untuk memunculkan analisis komparatif observasional sebelum dan sesudah intervensi.
          </p>
        </div>
      `;
      return;
    }

    const { latestPre, latestPost, metrics, errorShift, domainShift, competencyMapping } = report;

    const diffPrefix = (val) => {
      if (val === null || val === undefined) return "-";
      return val > 0 ? `+${val}` : `${val}`;
    };

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Kartu Skor Komparasi Utama (Before vs After) -->
        <div class="card-clean p-5 bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 rounded-2xl shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pre-Test vs Post-Test: Analisis Observasional</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">Research Layer</span>
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Pengukuran performa baseline siswa (Form A) dibandingkan dengan performa evaluasi akhir (Form B).
              </p>
            </div>
            
            <span class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              N Attempt: <strong class="text-blue-600 dark:text-blue-400 font-mono">${report.preAttemptsCount} Pre</strong> / <strong class="text-indigo-600 dark:text-indigo-400 font-mono">${report.postAttemptsCount} Post</strong>
            </span>
          </div>

          <!-- Metrik 3 Kolom: Pre -> Post -> Perubahan Skor -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            
            <!-- Box Pre-Test -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">Pre-Test (Baseline)</span>
              <div class="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                ${latestPre ? `${latestPre.score}%` : "Belum Ada"}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                ${latestPre ? `${latestPre.correctCount} dari ${latestPre.totalQuestions} Soal Benar` : "Menunggu pengerjaan"}
              </p>
            </div>

            <!-- Box Post-Test -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">Post-Test (Outcome)</span>
              <div class="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                ${latestPost ? `${latestPost.score}%` : "Belum Ada"}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                ${latestPost ? `${latestPost.correctCount} dari ${latestPost.totalQuestions} Soal Benar` : "Menunggu pengerjaan"}
              </p>
            </div>

            <!-- Box Perubahan Skor (Deskriptif) -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">Perubahan Skor</span>
              <div class="text-2xl font-extrabold font-mono ${
                metrics.scoreDiff !== null ? (metrics.scoreDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400") : "text-slate-400 dark:text-slate-500"
              }">
                ${metrics.scoreDiff !== null ? `${diffPrefix(metrics.scoreDiff)} poin` : "-"}
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                ${metrics.correctDiff !== null ? `Perubahan akurasi: ${diffPrefix(metrics.correctDiff)} butir benar` : "Perlu kedua data"}
              </p>
            </div>

          </div>

          <!-- Catatan Metodologis Netral -->
          <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-400 leading-relaxed">
            <strong class="text-slate-900 dark:text-slate-200">Catatan Integritas Riset:</strong> Nilai perubahan skor di atas disajikan secara deskriptif observasional. Penarikan kesimpulan efektivitas kausal wajib mempertimbangkan desain kelompok kontrol, ukuran sampel, dan uji signifikansi inferensial formal.
          </div>
        </div>

        <!-- Pergeseran Pola Kesalahan Kognitif E1 - E4 & Domain D1 - D6 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          <!-- Box Pola Kesalahan E1 - E4 -->
          <div class="card-clean p-5 space-y-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
              <span>Pergeseran Pola Kesalahan Kognitif (Observasional)</span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Pre → Post</span>
            </h4>

            <div class="space-y-2.5 text-xs">
              ${[
                { code: "E1", name: "Konseptual", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-500/20" },
                { code: "E2", name: "Prosedural", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
                { code: "E3", name: "Komputasi", color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-500/20" },
                { code: "E4", name: "Interpretasi", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20" }
              ]
                .map((err) => {
                  const preCount = errorShift[err.code].pre;
                  const postCount = errorShift[err.code].post;
                  const diff = postCount - preCount;

                  return `
                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono ${err.bg} ${err.color}">
                        ${err.code}
                      </span>
                      <span class="text-slate-800 dark:text-slate-300 font-medium">${err.name}</span>
                    </div>

                    <div class="flex items-center gap-4 text-xs font-mono">
                      <span class="text-slate-600 dark:text-slate-400">${preCount} butir</span>
                      <span class="text-slate-400 dark:text-slate-600">→</span>
                      <span class="text-slate-900 dark:text-white font-bold">${postCount} butir</span>
                      <span class="text-[11px] font-bold ${diff <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}">
                        (${diffPrefix(diff)})
                      </span>
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>

          <!-- Box Akurasi Domain D1 - D6 -->
          <div class="card-clean p-5 space-y-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center justify-between">
              <span>Akurasi Domain Kompetensi (D1 s.d. D6)</span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Pre → Post</span>
            </h4>

            <div class="space-y-2 text-xs">
              ${[
                { id: "D1", name: "Konsep Dasar" },
                { id: "D2", name: "Faktorisasi" },
                { id: "D3", name: "Rumus ABC" },
                { id: "D4", name: "Diskriminan" },
                { id: "D5", name: "Hubungan Akar" },
                { id: "D6", name: "Penerapan" }
              ]
                .map((dom) => {
                  const preRate = domainShift[dom.id].pre;
                  const postRate = domainShift[dom.id].post;
                  const diff = parseFloat((postRate - preRate).toFixed(1));

                  return `
                  <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-bold font-mono text-blue-600 dark:text-blue-400 text-[11px]">${dom.id}</span>
                      <span class="text-slate-800 dark:text-slate-300 text-[11px] font-medium">${dom.name}</span>
                    </div>

                    <div class="flex items-center gap-3 text-xs font-mono">
                      <span class="text-slate-600 dark:text-slate-400">${preRate}%</span>
                      <span class="text-slate-400 dark:text-slate-600">→</span>
                      <span class="text-slate-900 dark:text-white font-bold">${postRate}%</span>
                      <span class="text-[11px] font-bold ${diff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}">
                        (${diffPrefix(diff)}%)
                      </span>
                    </div>
                  </div>
                `;
                })
                .join("")}
            </div>
          </div>

        </div>

        <!-- Tabel Komparasi Tingkat Butir Soal (Competency Question-Level Mapping) -->
        <div class="card-clean p-5 space-y-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Pemetaan Butir Paralel Tingkat Kompetensi (C01 s.d. C12)
              </h4>
              <p class="text-[11px] text-slate-600 dark:text-slate-400">Perbandingan butir Form A (Pre) dan Form B (Post) yang mengukur kompetensi setara</p>
            </div>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table class="w-full text-left text-xs text-slate-800 dark:text-slate-200">
              <thead class="text-[10px] uppercase bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th class="px-3 py-2.5">Kode</th>
                  <th class="px-3 py-2.5">Domain</th>
                  <th class="px-3 py-2.5">Kompetensi yang Diukur</th>
                  <th class="px-3 py-2.5 text-center">Pre-Test (Form A)</th>
                  <th class="px-3 py-2.5 text-center">Post-Test (Form B)</th>
                  <th class="px-3 py-2.5 text-right">Observasi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                ${competencyMapping
                  .map((item) => {
                    const isPreOk = item.preCorrect === true;
                    const isPostOk = item.postCorrect === true;

                    let statusText = "-";
                    let statusClass = "text-slate-400 dark:text-slate-500";
                    if (item.preCorrect !== null && item.postCorrect !== null) {
                      if (!isPreOk && isPostOk) {
                        statusText = "Salah → Benar";
                        statusClass = "text-emerald-600 dark:text-emerald-400 font-bold";
                      } else if (isPreOk && isPostOk) {
                        statusText = "Tetap Benar";
                        statusClass = "text-blue-600 dark:text-blue-400 font-bold";
                      } else if (isPreOk && !isPostOk) {
                        statusText = "Benar → Salah";
                        statusClass = "text-rose-600 dark:text-rose-400 font-bold";
                      } else {
                        statusText = "Tetap Salah";
                        statusClass = "text-amber-600 dark:text-amber-400 font-semibold";
                      }
                    }

                    return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td class="px-3 py-2.5 font-bold text-blue-600 dark:text-blue-400">${item.competencyId}</td>
                      <td class="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-400">${item.domain}</td>
                      <td class="px-3 py-2.5 font-sans font-semibold text-slate-900 dark:text-slate-100">${item.competencyName}</td>
                      <td class="px-3 py-2.5 text-center">
                        ${
                          item.preCorrect !== null
                            ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold ${
                                isPreOk ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"
                              }">${item.preAnswer} (${item.preError})</span>`
                            : `<span class="text-slate-400 dark:text-slate-600 font-bold">-</span>`
                        }
                      </td>
                      <td class="px-3 py-2.5 text-center">
                        ${
                          item.postCorrect !== null
                            ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold ${
                                isPostOk ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"
                              }">${item.postAnswer} (${item.postError})</span>`
                            : `<span class="text-slate-400 dark:text-slate-600 font-bold">-</span>`
                        }
                      </td>
                      <td class="px-3 py-2.5 text-right ${statusClass}">
                        ${statusText}
                      </td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ringkasan Statistik Penelitian (N Siswa, Mean, Median) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="card-clean p-3 space-y-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span class="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Mean Pre-Test</span>
            <div class="text-lg font-extrabold text-slate-900 dark:text-white font-mono">${metrics.meanPre}%</div>
          </div>

          <div class="card-clean p-3 space-y-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span class="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">Mean Post-Test</span>
            <div class="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">${metrics.meanPost}%</div>
          </div>

          <div class="card-clean p-3 space-y-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span class="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Median Pre-Test</span>
            <div class="text-lg font-extrabold text-slate-900 dark:text-slate-200 font-mono">${metrics.medianPre}%</div>
          </div>

          <div class="card-clean p-3 space-y-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span class="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400">Median Post-Test</span>
            <div class="text-lg font-extrabold text-teal-600 dark:text-teal-400 font-mono">${metrics.medianPost}%</div>
          </div>
        </div>

      </div>
    `;
  }
}
