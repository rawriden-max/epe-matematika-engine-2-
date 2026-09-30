/**
 * achievementEngine.js - EPE V3 Achievement & Milestone Unlock Engine
 * 
 * Melacak capaian belajar siswa tanpa mencemari data diagnostik penelitian murni:
 * - Langkah Pertama (1 Soal Selesai)
 * - Penjelajah Diagnostik (6 Soal)
 * - Separuh Perjalanan (12 Soal)
 * - Penakluk 24 Soal EPE (24 Soal Lengkap)
 * - Refleksi Kognitif (1 Remediasi Selesai)
 * - Akurasi Konseptual E0 (Mencapai E0 Bebas Kesalahan)
 * 
 * Membuka item kosmetik eksklusif dan memberikan bonus Cubic secara otomatis.
 */

import { CubicWallet } from "../economy/cubicWallet.js";
import { CubicRewards } from "../economy/cubicRewards.js";
import { COSMETIC_CATALOG } from "../avatar/avatarCatalog.js";

const ACHIEVEMENTS_KEY = "epe_unlocked_achievements";

export const ACHIEVEMENTS = [
  {
    id: "ach_diag_starter",
    title: "Langkah Pertama",
    description: "Selesaikan 1 soal diagnostik pertama di workspace.",
    icon: "🌱",
    cubicReward: 20,
    unlockItem: null,
    condition: (stats) => (stats.completedQuestionsCount || 0) >= 1
  },
  {
    id: "ach_diag_explorer",
    title: "Penjelajah Diagnostik",
    description: "Tuntaskan minimal 6 soal diagnostik penelitian.",
    icon: "🧭",
    cubicReward: 40,
    unlockItem: "acc_glasses_round",
    condition: (stats) => (stats.completedQuestionsCount || 0) >= 6
  },
  {
    id: "ach_diag_half",
    title: "Separuh Perjalanan",
    description: "Tuntaskan 12 soal diagnostik aljabar (50% materi).",
    icon: "⚡",
    cubicReward: 60,
    unlockItem: "outfit_hoodie_cosmic",
    condition: (stats) => (stats.completedQuestionsCount || 0) >= 12
  },
  {
    id: "ach_remed_first",
    title: "Refleksi Kognitif",
    description: "Tuntaskan 1 modul remediasi untuk memperbaiki miskonsepsi.",
    icon: "💎",
    cubicReward: 35,
    unlockItem: "aura_remed_crystal",
    condition: (stats) => (stats.completedRemediationsCount || 0) >= 1
  },
  {
    id: "ach_master_zero_error",
    title: "Akurasi Sempurna E0",
    description: "Raih klasifikasi E0 (Bebas Kesalahan Konseptual) pada soal pengerjaan.",
    icon: "👑",
    cubicReward: 50,
    unlockItem: "acc_halo_golden",
    condition: (stats) => stats.hasE0Achievement === true
  },
  {
    id: "ach_diag_complete",
    title: "Grandmaster 24 Soal EPE",
    description: "Tuntaskan seluruh 24 soal diagnostik instrumen penelitian.",
    icon: "🌌",
    cubicReward: 100,
    unlockItem: "aura_supernova_gold",
    condition: (stats) => (stats.completedQuestionsCount || 0) >= 24
  }
];

export class AchievementEngine {
  /**
   * Mengambil daftar ID achievement yang sudah diraih
   */
  static getUnlockedIds() {
    try {
      const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn("Gagal membaca achievement:", e);
    }
    return [];
  }

  /**
   * Mengecek milestone berdasarkan status belajar saat ini
   * @param {Object} stats { completedQuestionsCount, completedRemediationsCount, hasE0Achievement }
   */
  static checkMilestones(stats) {
    const unlockedIds = this.getUnlockedIds();
    const newlyUnlocked = [];

    for (const ach of ACHIEVEMENTS) {
      if (!unlockedIds.includes(ach.id)) {
        if (ach.condition(stats)) {
          unlockedIds.push(ach.id);
          newlyUnlocked.push(ach);

          // 1. Berikan bonus Cubic jika ada
          if (ach.cubicReward > 0) {
            CubicWallet.addCubic(ach.cubicReward, `ach_${ach.id}`, `Pencapaian: ${ach.title}`);
          }

          // 2. Buka item kosmetik hadiah jika ada
          if (ach.unlockItem) {
            CubicWallet.ownItem(ach.unlockItem);
          }

          // 3. Tampilkan Micro-Toast Selebrasi
          const itemMeta = ach.unlockItem ? COSMETIC_CATALOG.find((it) => it.id === ach.unlockItem) : null;
          const rewardLabel = itemMeta
            ? `+${ach.cubicReward} ◆ & Item: ${itemMeta.name}`
            : `+${ach.cubicReward} ◆ Cubic`;

          CubicRewards.showRewardToast(`🏆 Achievement Diraih: ${ach.title}!`, rewardLabel);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlockedIds));
      window.dispatchEvent(new CustomEvent("epe-achievements-updated", { detail: { newlyUnlocked, all: unlockedIds } }));
    }

    return newlyUnlocked;
  }
}
