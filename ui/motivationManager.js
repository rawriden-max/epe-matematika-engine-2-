/**
 * motivationManager.js - Motivation Layer & Micro-Reward System (EPE V2)
 * 
 * Prinsip Utama:
 * "Aku sedang membangun sesuatu, bukan sekadar ujian."
 * "Jawaban salah != kehilangan reward. Menemukan kesalahan -> memperbaiki -> cube berevolusi."
 */

import { MILESTONES } from "../data/cubeStore.js";
import { NotificationToast } from "./notification.js";

export class MotivationManager {
  constructor({ cubeStore, cubeEngine, onNavigateQuestion = null, onStartRemediation = null }) {
    this.cubeStore = cubeStore;
    this.cubeEngine = cubeEngine;
    this.onNavigateQuestion = onNavigateQuestion;
    this.onStartRemediation = onStartRemediation;

    this.elements = {
      cubeCounterText: document.getElementById("cube-counter-text"),
      cubeProgressBar: document.getElementById("cube-progress-bar"),
      cubeProgressPercent: document.getElementById("cube-progress-percent"),
      nextTargetTitle: document.getElementById("next-target-title"),
      nextTargetDesc: document.getElementById("next-target-desc"),
      btnContinueDiagnostic: document.getElementById("btn-continue-diagnostic"),
      milestoneBadgeContainer: document.getElementById("milestone-badge-container"),
      collectionModal: document.getElementById("collection-modal"),
      btnOpenCollection: document.getElementById("btn-open-collection"),
      btnCloseCollection: document.getElementById("btn-close-collection"),
      collectionCountLarge: document.getElementById("collection-count-large"),
      collectionStatsAccurate: document.getElementById("collection-stats-accurate"),
      collectionStatsNeedsPractice: document.getElementById("collection-stats-needspractice"),
      collectionStatsRemediated: document.getElementById("collection-stats-remediated"),
      collectionMilestoneList: document.getElementById("collection-milestone-list")
    };

    this.init();
  }

  init() {
    this.updateDashboardWidgets();
    this.bindEvents();
  }

  bindEvents() {
    if (this.elements.btnOpenCollection) {
      this.elements.btnOpenCollection.addEventListener("click", () => this.openCollectionView());
    }
    if (this.elements.btnCloseCollection) {
      this.elements.btnCloseCollection.addEventListener("click", () => this.closeCollectionView());
    }
    if (this.elements.btnContinueDiagnostic) {
      this.elements.btnContinueDiagnostic.addEventListener("click", () => {
        const stats = this.cubeStore.getProgressStats();
        if (stats.nextQuestion && this.onNavigateQuestion) {
          this.onNavigateQuestion(stats.nextQuestion.questionId);
        }
      });
    }
  }

  /**
   * Update widget progress, counter, dan next-target pada dashboard siswa
   */
  updateDashboardWidgets() {
    const stats = this.cubeStore.getProgressStats();

    if (this.elements.cubeCounterText) {
      this.elements.cubeCounterText.textContent = `${stats.unlocked} / ${stats.total}`;
    }
    if (this.elements.cubeProgressBar) {
      this.elements.cubeProgressBar.style.width = `${stats.percent}%`;
    }
    if (this.elements.cubeProgressPercent) {
      this.elements.cubeProgressPercent.textContent = `${stats.percent}%`;
    }

    // Next Target Banner (Pedagogical Completion Pull)
    if (stats.isCompleted) {
      if (this.elements.nextTargetTitle) this.elements.nextTargetTitle.textContent = "🏆 Monumen Diagnostik Lengkap!";
      if (this.elements.nextTargetDesc) this.elements.nextTargetDesc.textContent = "Seluruh 24 butir soal diagnostik berhasil Anda petakan dengan gemilang.";
      if (this.elements.btnContinueDiagnostic) {
        this.elements.btnContinueDiagnostic.innerHTML = `<span>Tinjau Monumen Koleksi</span>`;
      }
    } else if (stats.nextQuestion) {
      const q = stats.nextQuestion;
      if (this.elements.nextTargetTitle) {
        this.elements.nextTargetTitle.textContent = `Lanjutkan: ${q.questionId} (${q.domainId} - ${q.domainName})`;
      }
      if (this.elements.nextTargetDesc) {
        const remainingToMilestone = stats.nextMilestone ? `${stats.nextMilestone.remaining} kubus lagi menuju milestone "${stats.nextMilestone.title}".` : "";
        this.elements.nextTargetDesc.textContent = `${q.title}. ${remainingToMilestone}`;
      }
      if (this.elements.btnContinueDiagnostic) {
        this.elements.btnContinueDiagnostic.innerHTML = `
          <span>Kerjakan ${q.questionId} Sekarang</span>
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        `;
      }
    }

    // Render milestone badges
    this.renderMilestoneBadges(stats.unlocked);
  }

  renderMilestoneBadges(unlockedCount) {
    if (!this.elements.milestoneBadgeContainer) return;
    let html = "";
    MILESTONES.forEach((m) => {
      const isReached = unlockedCount >= m.count;
      html += `
        <div class="milestone-badge-pill ${isReached ? "milestone-active" : "milestone-locked"}" title="${m.title}: ${m.desc}">
          <span class="text-xs">${m.icon}</span>
          <span class="text-[11px] font-bold">${m.count}</span>
        </div>
      `;
    });
    this.elements.milestoneBadgeContainer.innerHTML = html;
  }

  /**
   * Sequence Micro-Reward setelah siswa submit jawaban soal diagnostik
   * Durasi: 1.5 - 2.0 detik, mulus tanpa blocking
   */
  handleQuestionSubmitted(questionId, diagnosisResult) {
    const primaryCode = diagnosisResult.primaryErrorCode;
    const isAccurate = primaryCode === "E0";

    // 1. Simpan ke CubeStore (jawaban salah tetap mendapat reward kubus!)
    const { cube, isNewUnlock, stats } = this.cubeStore.recordDiagnosis(questionId, {
      primaryErrorCode: primaryCode,
      primaryErrorText: diagnosisResult.primaryErrorText
    });

    // 2. Trigger animasi kubus pada visual 3D
    if (this.cubeEngine) {
      this.cubeEngine.triggerUnlockAnimation(questionId);
    }

    // 3. Pesan Micro-Reward yang memotivasi
    if (isNewUnlock) {
      if (isAccurate) {
        NotificationToast.show(`✨ Kubus ${questionId} Terbuka! Koleksi bertambah (${stats.unlocked}/24).`, "success");
      } else {
        // Reframing: Bukan "Salah!", tetapi "Pola Terdeteksi, Kubus Didapat"
        NotificationToast.show(`💡 Kubus ${questionId} Diperoleh! Pola ${primaryCode} terdeteksi, siap untuk remediasi.`, "info");
      }
    } else {
      NotificationToast.show(`Pembaruan status kubus ${questionId} berhasil tercatat!`, "info");
    }

    // 4. Periksa Milestone Terbuka
    const hitMilestone = MILESTONES.find((m) => m.count === stats.unlocked);
    if (hitMilestone && isNewUnlock) {
      setTimeout(() => {
        NotificationToast.show(`🎉 Milestone Terbuka: "${hitMilestone.title}" (${hitMilestone.icon})!`, "success");
      }, 900);
    }

    // 5. Cek jika seluruh 24/24 selesai
    if (stats.isCompleted && isNewUnlock) {
      setTimeout(() => {
        if (this.cubeEngine) this.cubeEngine.triggerMasteryCelebration();
        NotificationToast.show(`👑 LUAR BIASA! Seluruh 24 Kubus Monumen Diagnostik Lengkap Terpetakan!`, "success");
      }, 1200);
    }

    // 6. Refresh Widget
    this.updateDashboardWidgets();

    return { cube, stats };
  }

  /**
   * Sequence saat siswa menyelesaikan latihan remediasi adaptif
   * Kubus berevolusi menjadi Crystal Cube!
   */
  handleRemediationCompleted(questionId) {
    const { cube, stats } = this.cubeStore.recordRemediation(questionId);

    if (this.cubeEngine) {
      this.cubeEngine.triggerUnlockAnimation(questionId);
    }

    NotificationToast.show(`💎 Kubus ${questionId} Berevolusi menjadi Crystal Cube! Remediasi tuntas.`, "success");
    this.updateDashboardWidgets();

    return { cube, stats };
  }

  /**
   * Modal "View Collection"
   */
  openCollectionView() {
    const stats = this.cubeStore.getProgressStats();
    const modal = this.elements.collectionModal;
    if (!modal) return;

    if (this.elements.collectionCountLarge) {
      this.elements.collectionCountLarge.textContent = `${stats.unlocked} / ${stats.total}`;
    }
    if (this.elements.collectionStatsAccurate) {
      this.elements.collectionStatsAccurate.textContent = `${stats.accurate} Akurat`;
    }
    if (this.elements.collectionStatsNeedsPractice) {
      this.elements.collectionStatsNeedsPractice.textContent = `${stats.needsPractice} Perlu Remedi`;
    }
    if (this.elements.collectionStatsRemediated) {
      this.elements.collectionStatsRemediated.textContent = `${stats.remediated + stats.verified} Kristal/Verified`;
    }

    // Render Milestone list in collection view
    if (this.elements.collectionMilestoneList) {
      let html = "";
      MILESTONES.forEach((m) => {
        const achieved = stats.unlocked >= m.count;
        html += `
          <div class="p-3 rounded-xl border ${achieved ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-slate-800 bg-slate-900/50 text-slate-500"} flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">${m.icon}</span>
              <div>
                <h5 class="text-xs font-bold text-white">${m.title} (${m.count} Kubus)</h5>
                <p class="text-[11px] text-slate-400">${m.desc}</p>
              </div>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded ${achieved ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"}">
              ${achieved ? "Tercapai ✓" : `Tersisa ${m.count - stats.unlocked}`}
            </span>
          </div>
        `;
      });
      this.elements.collectionMilestoneList.innerHTML = html;
    }

    modal.classList.remove("hidden");
  }

  closeCollectionView() {
    if (this.elements.collectionModal) {
      this.elements.collectionModal.classList.add("hidden");
    }
  }
}
