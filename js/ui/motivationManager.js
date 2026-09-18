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

  static getMilestoneSvgIcon(id, sizeClass = "w-3.5 h-3.5") {
    switch (id) {
      case "foundation": // Tunas / Sprout
        return `<svg class="${sizeClass} text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-9"/><path d="M12 13c0-4.5 4.5-5 8-5-1 4.5-3.5 9-8 9Z"/><path d="M12 17c-3-2-5-5-5-8 3.5 0 6 2 6 5Z"/></svg>`;
      case "momentum": // Rocket
        return `<svg class="${sizeClass} text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 9V4s3.03.55 4 2c1.08 1.62 0 5 0 5"/></svg>`;
      case "halfway": // Star
        return `<svg class="${sizeClass} text-amber-400" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      case "advanced": // Diamond / Crystal
        return `<svg class="${sizeClass} text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>`;
      case "mastery": // Crown
        return `<svg class="${sizeClass} text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`;
      default:
        return `<svg class="${sizeClass} text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
    }
  }

  renderMilestoneBadges(unlockedCount) {
    if (!this.elements.milestoneBadgeContainer) return;
    let html = "";
    MILESTONES.forEach((m) => {
      const isReached = unlockedCount >= m.count;
      const iconSvg = MotivationManager.getMilestoneSvgIcon(m.id, "w-3.5 h-3.5");
      html += `
        <div class="milestone-badge-pill ${isReached ? "milestone-active" : "milestone-locked"}" title="${m.title}: ${m.desc}">
          <span class="flex items-center justify-center shrink-0">${iconSvg}</span>
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
        const iconSvg = MotivationManager.getMilestoneSvgIcon(m.id, "w-5 h-5");
        html += `
          <div class="p-3 rounded-xl border ${achieved ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-slate-800 bg-slate-900/50 text-slate-500"} flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg ${achieved ? "bg-emerald-950/60 border border-emerald-500/40" : "bg-slate-950 border border-slate-800"} flex items-center justify-center shrink-0 shadow-sm">
                ${iconSvg}
              </div>
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
