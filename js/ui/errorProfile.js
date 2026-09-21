/**
 * errorProfile.js - Visualisasi Profil Kesalahan Siswa & Evolusi Remediasi (EPE V2)
 * 
 * Menampilkan:
 * 1. Distribusi Taksonomi Kesalahan: E1 (Konseptual), E2 (Prosedural), E3 (Komputasi), E4 (Interpretasi)
 * 2. Pola Dominan Siswa & Domain Paling Menantang (D1 - D6)
 * 3. Analisis Before vs After Remediation (penurunan frekuensi error setelah intervensi belajar)
 * 4. Rekomendasi tindakan belajar adaptif yang konkret
 */

import { TAXONOMY } from "../engine/taxonomy.js";
import { DOMAINS } from "../data/questions.js";

export class ErrorProfileManager {
  constructor({ historyManager, cubeStore, onStartRemediation = null }) {
    this.historyManager = historyManager;
    this.cubeStore = cubeStore;
    this.onStartRemediation = onStartRemediation;

    this.container = document.getElementById("section-error-profile");
  }

  render() {
    if (!this.container) return;

    const history = this.historyManager.getAll();
    const cubes = this.cubeStore.getAllCubes();

    // Hitung frekuensi error E1 - E4
    const errorCounts = { E1: 0, E2: 0, E3: 0, E4: 0, E0: 0 };
    const domainErrors = { D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0 };
    let totalDiagnosed = 0;

    cubes.forEach((c) => {
      if (c.errorCode) {
        totalDiagnosed++;
        if (errorCounts[c.errorCode] !== undefined) {
          errorCounts[c.errorCode]++;
        }
        if (c.errorCode !== "E0" && c.domainId && domainErrors[c.domainId] !== undefined) {
          domainErrors[c.domainId]++;
        }
      }
    });

    // Cari pola dominan
    let dominantError = null;
    let maxErrorCount = 0;
    ["E1", "E2", "E3", "E4"].forEach((code) => {
      if (errorCounts[code] > maxErrorCount) {
        maxErrorCount = errorCounts[code];
        dominantError = code;
      }
    });

    // Cari domain paling menantang
    let problematicDomain = null;
    let maxDomainErrors = 0;
    Object.keys(domainErrors).forEach((dId) => {
      if (domainErrors[dId] > maxDomainErrors) {
        maxDomainErrors = domainErrors[dId];
        problematicDomain = dId;
      }
    });

    // Hitung Before vs After Remediation
    // Before: jumlah kubus yang awalnya terdeteksi error
    // After: jumlah kubus yang telah diremediasi
    let beforeRemediationErrors = 0;
    let remediatedCount = 0;
    cubes.forEach((c) => {
      if (c.errorCode && c.errorCode !== "E0") {
        beforeRemediationErrors++;
        if (c.remediated) remediatedCount++;
      }
    });
    const currentActiveErrors = Math.max(0, beforeRemediationErrors - remediatedCount);

    const totalErrors = errorCounts.E1 + errorCounts.E2 + errorCounts.E3 + errorCounts.E4;
    const calcPercent = (count) => totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;

    this.container.innerHTML = `
      <div class="max-w-5xl mx-auto space-y-6">
        
        <!-- Header Halaman Hasil Diagnostik -->
        <div class="card-clean p-5 sm:p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/40 border border-slate-200 dark:border-slate-800">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-500/30">
                  Ringkasan Diagnostik Siswa
                </span>
                <span class="text-xs text-slate-500 dark:text-slate-400">Total Diuji: ${totalDiagnosed} dari 24 Soal</span>
              </div>
              <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">Hasil Diagnostik &amp; Profil Belajar Siswa</h2>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Hasil evaluasi diagnostik untuk memetakan pemahaman aljabar Anda. Sistem mengidentifikasi materi yang telah dikuasai serta bagian yang perlu diperkuat agar proses perbaikan belajar lebih tepat sasaran.
              </p>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="text-center p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 min-w-[100px] shadow-sm">
                <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Tingkat Akurasi</span>
                <span class="text-lg font-extrabold text-emerald-500 dark:text-emerald-400">${errorCounts.E0}</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 block">Selesai Akurat (E0)</span>
              </div>
              <div class="text-center p-3 rounded-xl bg-white/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 min-w-[100px] shadow-sm">
                <span class="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Fokus Perbaikan</span>
                <span class="text-lg font-extrabold text-amber-500 dark:text-amber-400">${totalErrors}</span>
                <span class="text-[10px] text-slate-500 dark:text-slate-400 block">Perlu Remediasi</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ringkasan Area Utama & Materi Penguatan -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Dominant Pattern -->
          <div class="card-clean p-5 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Area Utama Perlu Ditingkatkan</span>
              <span class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">${dominantError || "Belum Terdeteksi"}</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                ${dominantError ? TAXONOMY[dominantError]?.label : "Belum Ada Data Diagnosis Cukup"}
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                ${dominantError ? TAXONOMY[dominantError]?.description : "Selesaikan beberapa soal pada tab Diagnostik Baku untuk memetakan pemahaman konsep Anda."}
              </p>
            </div>
          </div>

          <!-- Problematic Domain -->
          <div class="card-clean p-5 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Materi yang Perlu Diperkuat</span>
              <span class="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">${problematicDomain || "Belum Terpetakan"}</span>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                ${problematicDomain ? `${problematicDomain} · ${DOMAINS[problematicDomain]?.name}` : "Semua Domain Terkendali"}
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                ${problematicDomain ? DOMAINS[problematicDomain]?.description : "Lanjutkan diagnostik untuk melihat domain kompetensi mana yang memerlukan pendalaman materi."}
              </p>
            </div>
          </div>
        </div>

        <!-- Visual Bar Meter Distribusi E1 - E4 -->
        <div class="card-clean p-6 space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Analisis Kebutuhan Belajar Siswa</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Proporsi jenis pemahaman konsep yang perlu pendampingan belajar</p>
            </div>
            <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">${totalErrors} Catatan Remediasi</span>
          </div>

          <div class="space-y-4">
            <!-- E1: Konseptual -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
                  E1 · Pemahaman Konsep Dasar
                </span>
                <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">${errorCounts.E1} kali (${calcPercent(errorCounts.E1)}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                <div class="bg-rose-500 h-full rounded-full transition-all duration-500" style="width: ${calcPercent(errorCounts.E1)}%"></div>
              </div>
            </div>

            <!-- E2: Prosedural -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                  E2 · Langkah Prosedur Penyelesaian
                </span>
                <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">${errorCounts.E2} kali (${calcPercent(errorCounts.E2)}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                <div class="bg-amber-500 h-full rounded-full transition-all duration-500" style="width: ${calcPercent(errorCounts.E2)}%"></div>
              </div>
            </div>

            <!-- E3: Komputasi -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-yellow-500"></span>
                  E3 · Ketelitian Perhitungan (Komputasi)
                </span>
                <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">${errorCounts.E3} kali (${calcPercent(errorCounts.E3)}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                <div class="bg-yellow-500 h-full rounded-full transition-all duration-500" style="width: ${calcPercent(errorCounts.E3)}%"></div>
              </div>
            </div>

            <!-- E4: Interpretasi -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-purple-500"></span>
                  E4 · Interpretasi Soal Cerita / Simbol
                </span>
                <span class="font-mono text-slate-600 dark:text-slate-300 font-bold">${errorCounts.E4} kali (${calcPercent(errorCounts.E4)}%)</span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800/80 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60">
                <div class="bg-purple-500 h-full rounded-full transition-all duration-500" style="width: ${calcPercent(errorCounts.E4)}%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Before vs After Remediation Progression (Evolution Tracker) -->
        <div class="card-clean p-6 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Perkembangan Peningkatan Pemahaman</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Penyelesaian materi yang telah berhasil dipulihkan melalui latihan terarah</p>
            </div>
            <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              ${remediatedCount} Materi Berhasil Dipulihkan
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <!-- Before -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-600 dark:text-slate-400">Sebelum Remediasi (Awal):</span>
                <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">${beforeRemediationErrors} Masalah Terdeteksi</span>
              </div>
              <div class="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">${beforeRemediationErrors}</div>
              <p class="text-[11px] text-slate-500">Total soal yang memerlukan penguatan konsep saat tes diagnostik awal.</p>
            </div>

            <!-- After -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">Setelah Remediasi (Sisa):</span>
                <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">${currentActiveErrors} Belum Tuntas</span>
              </div>
              <div class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">${currentActiveErrors}</div>
              <p class="text-[11px] text-slate-500">Materi yang masih menunggu sesi latihan perbaikan.</p>
            </div>
          </div>

          ${beforeRemediationErrors > 0 && currentActiveErrors > 0 ? `
            <div class="pt-2">
              <button id="btn-goto-remediation" class="btn-primary w-full py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all">
                Mulai Latihan Remediasi Adaptif untuk ${dominantError || "Materi Terdeteksi"}
              </button>
            </div>
          ` : `
            <div class="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-600 dark:text-emerald-300 font-semibold">
              ✨ Luar biasa! Seluruh materi telah dikuasai dengan baik atau tidak ada catatan remediasi.
            </div>
          `}
        </div>

      </div>
    `;

    const remBtn = this.container.querySelector("#btn-goto-remediation");
    if (remBtn && this.onStartRemediation) {
      remBtn.addEventListener("click", () => this.onStartRemediation(dominantError, problematicDomain));
    }
  }
}
