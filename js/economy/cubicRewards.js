/**
 * cubicRewards.js - EPE V2.1 Process-Based Non-Punitive Reward System
 * 
 * Kebijakan Hadiah:
 * 1. Diagnostic Question Effort: +10 ◆ (Diberikan atas partisipasi pengerjaan soal diagnostik apapun klasifikasinya E0-E4).
 * 2. Remediation Breakthrough: +15 ◆ (Diberikan saat siswa menuntaskan langkah bimbingan miskonsepsi aljabar).
 * 3. Practice Mastery: +5 ◆ (Diberikan saat siswa mencoba latihan mandiri multimedia).
 * 
 * Perlindungan Anti-Eksploitasi:
 * Setiap aktivitas memiliki activityId unik (misal: 'diag_q1', 'remed_domain_D2').
 * Reward untuk soal diagnostik yang sama hanya diberikan 1 kali (klaim tersimpan di epe_claimed_rewards).
 */

import { CubicWallet } from "./cubicWallet.js";

const CLAIMED_KEY = "epe_claimed_rewards";

export class CubicRewards {
  /**
   * Mengambil daftar aktivitas yang sudah pernah diklaim reward-nya
   */
  static getClaimedMap() {
    try {
      const raw = localStorage.getItem(CLAIMED_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Gagal membaca klaim reward:", e);
    }
    return {};
  }

  /**
   * Menandai aktivitas telah diklaim
   */
  static markClaimed(activityId) {
    const map = this.getClaimedMap();
    map[activityId] = new Date().toISOString();
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(map));
  }

  /**
   * Cek apakah aktivitas sudah diklaim
   */
  static isClaimed(activityId) {
    const map = this.getClaimedMap();
    return Boolean(map[activityId]);
  }

  /**
   * Beri reward pengerjaan soal diagnostik (+10 ◆)
   * Non-punitive: Tetap diberikan pada E0 hingga E4 sebagai apresiasi proses berpikir.
   */
  static rewardDiagnostic(questionId) {
    const activityId = `diag_${questionId}`;
    if (this.isClaimed(activityId)) {
      return { awarded: false, reason: "Sudah pernah diklaim sebelumnya" };
    }

    const amount = 10;
    const desc = `Penyelesaian Soal Diagnostik ${questionId.toUpperCase()}`;
    CubicWallet.addCubic(amount, activityId, desc);
    this.markClaimed(activityId);

    this.showRewardToast(`+${amount} ◆ Cubic Diperoleh!`, desc);
    return { awarded: true, amount, activityId };
  }

  /**
   * Beri reward penuntasan modul remediasi (+15 ◆)
   */
  static rewardRemediation(domainId) {
    const activityId = `remed_${domainId}`;
    if (this.isClaimed(activityId)) {
      return { awarded: false, reason: "Sudah pernah diklaim sebelumnya" };
    }

    const amount = 15;
    const desc = `Penuntasan Refleksi Remediasi Domain ${domainId.toUpperCase()}`;
    CubicWallet.addCubic(amount, activityId, desc);
    this.markClaimed(activityId);

    this.showRewardToast(`+${amount} ◆ Cubic Diperoleh!`, desc);
    return { awarded: true, amount, activityId };
  }

  /**
   * Beri reward latihan mandiri (+5 ◆)
   */
  static rewardPractice(practiceId) {
    const activityId = `practice_${practiceId}`;
    if (this.isClaimed(activityId)) {
      return { awarded: false, reason: "Sudah pernah diklaim sebelumnya" };
    }

    const amount = 5;
    const desc = `Latihan Mandiri ${practiceId}`;
    CubicWallet.addCubic(amount, activityId, desc);
    this.markClaimed(activityId);

    this.showRewardToast(`+${amount} ◆ Cubic Diperoleh!`, desc);
    return { awarded: true, amount, activityId };
  }

  /**
   * Tampilkan floating micro-toast animasi perolehan Cubic
   */
  static showRewardToast(title, subtitle = "") {
    let container = document.getElementById("cubic-reward-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "cubic-reward-toast-container";
      container.className = "fixed bottom-6 right-6 z-50 pointer-events-none flex flex-col gap-2";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "cubic-reward-toast flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/50 shadow-2xl backdrop-blur-md text-white";
    toast.innerHTML = `
      <div class="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center font-bold text-lg flex-shrink-0 animate-pulse">
        ◆
      </div>
      <div>
        <h4 class="text-xs font-bold text-cyan-300 leading-tight">${title}</h4>
        <p class="text-[11px] text-slate-300 leading-tight mt-0.5">${subtitle}</p>
      </div>
    `;

    container.appendChild(toast);

    // Animasi masuk dan keluar
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }
}
