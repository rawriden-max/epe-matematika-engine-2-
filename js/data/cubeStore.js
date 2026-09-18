/**
 * cubeStore.js - Arsitektur Data & State Machine Learning Cubes (EPE V2)
 * 
 * Menghubungkan 24 Soal Diagnostik (Q1 s.d. Q24) secara deterministik ke 24 Collectible Cubes.
 * State Machine:
 * - LOCKED: Soal belum diuji (terlihat sebagai wireframe siluet transparan)
 * - DIAGNOSED_E0: Soal selesai, dianalisis, akurat (menyala biru/putih neon)
 * - DIAGNOSED_ERROR: Soal selesai, dianalisis, terdeteksi pola kesalahan (tetap didapat! warna amber/rose hangat)
 * - REMEDIATED: Siswa telah menyelesaikan latihan remediasi adaptif (berubah menjadi crystal/glowing)
 * - VERIFIED: Telah diverifikasi / dikuasai penuh
 */

import { QUESTIONS, DOMAINS } from "./questions.js";

export const CUBE_STATES = {
  LOCKED: "LOCKED",
  DIAGNOSED_E0: "DIAGNOSED_E0",
  DIAGNOSED_ERROR: "DIAGNOSED_ERROR",
  REMEDIATED: "REMEDIATED",
  VERIFIED: "VERIFIED"
};

export const MILESTONES = [
  { count: 4, id: "foundation", title: "Pondasi Pertama", desc: "Menyelesaikan 4 butir diagnostik pertama (Domain D1)", icon: "🌱" },
  { count: 8, id: "momentum", title: "Langkah Awal", desc: "Menyelesaikan 8 butir diagnostik (D1 & D2)", icon: "🚀" },
  { count: 12, id: "halfway", title: "Setengah Perjalanan", desc: "Menyelesaikan 12 butir diagnostik (50% dari 24 soal)", icon: "⭐" },
  { count: 18, id: "advanced", title: "Hampir Lengkap", desc: "Menyelesaikan 18 butir diagnostik (D1 s.d. D4)", icon: "💎" },
  { count: 24, id: "mastery", title: "Monumen Diagnostik Selesai", desc: "Seluruh 24 butir soal diagnostik lengkap terpetakan!", icon: "👑" }
];

const STORAGE_KEY = "epe_v2_cube_progress";

export class CubeStore {
  constructor() {
    this.cubes = this._loadInitialState();
  }

  _loadInitialState() {
    let saved = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw);
    } catch (e) {
      console.warn("Gagal membaca cube progress dari localStorage:", e);
    }

    const cubeMap = {};
    QUESTIONS.forEach((q, idx) => {
      const savedCube = saved && saved[q.id];
      cubeMap[q.id] = {
        questionId: q.id,
        index: idx + 1,
        title: q.title,
        domainId: q.domainId,
        domainName: DOMAINS[q.domainId]?.name || q.domainName,
        state: savedCube ? savedCube.state : CUBE_STATES.LOCKED,
        errorCode: savedCube ? savedCube.errorCode : null,
        errorName: savedCube ? savedCube.errorName : null,
        remediated: savedCube ? !!savedCube.remediated : false,
        diagnosedAt: savedCube ? savedCube.diagnosedAt : null,
        remediatedAt: savedCube ? savedCube.remediatedAt : null
      };
    });

    return cubeMap;
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cubes));
    } catch (e) {
      console.warn("Gagal menyimpan cube progress ke localStorage:", e);
    }
  }

  /**
   * Mengambil data kubus berdasarkan ID soal (Q1 - Q24)
   */
  getCube(questionId) {
    return this.cubes[questionId] || null;
  }

  /**
   * Mengambil semua 24 data kubus dalam urutan Q1 - Q24
   */
  getAllCubes() {
    return QUESTIONS.map((q) => this.cubes[q.id]);
  }

  /**
   * Update status kubus setelah diagnosis dijalankan
   * JAWABAN SALAH TETAP MENDAPAT REWARD KUBUS!
   * (DIAGNOSED_ERROR vs DIAGNOSED_E0)
   */
  recordDiagnosis(questionId, { primaryErrorCode, primaryErrorText }) {
    if (!this.cubes[questionId]) return null;

    const cube = this.cubes[questionId];
    const isPreviousLocked = cube.state === CUBE_STATES.LOCKED;
    const isAccurate = primaryErrorCode === "E0";

    cube.errorCode = primaryErrorCode;
    cube.errorName = primaryErrorText;
    cube.diagnosedAt = new Date().toISOString();

    if (isAccurate) {
      cube.state = cube.remediated ? CUBE_STATES.VERIFIED : CUBE_STATES.DIAGNOSED_E0;
    } else {
      // Jika sebelumnya sudah pernah diremediasi, tetap remeditated/verified
      if (!cube.remediated) {
        cube.state = CUBE_STATES.DIAGNOSED_ERROR;
      }
    }

    this._save();

    return {
      cube,
      isNewUnlock: isPreviousLocked,
      isEvolution: !isPreviousLocked,
      stats: this.getProgressStats()
    };
  }

  /**
   * Update status kubus setelah latihan remediasi adaptif diselesaikan
   * Kubus berevolusi menjadi REMEDIATED / VERIFIED (Crystal Glow)
   */
  recordRemediation(questionId) {
    if (!this.cubes[questionId]) return null;

    const cube = this.cubes[questionId];
    cube.remediated = true;
    cube.remediatedAt = new Date().toISOString();
    cube.state = cube.errorCode === "E0" ? CUBE_STATES.VERIFIED : CUBE_STATES.REMEDIATED;

    this._save();

    return {
      cube,
      stats: this.getProgressStats()
    };
  }

  /**
   * Menghitung statistik progres koleksi kubus
   */
  getProgressStats() {
    const list = this.getAllCubes();
    const total = 24;
    let unlocked = 0;
    let accurate = 0;
    let needsPractice = 0;
    let remediated = 0;
    let verified = 0;

    list.forEach((c) => {
      if (c.state !== CUBE_STATES.LOCKED) unlocked++;
      if (c.state === CUBE_STATES.DIAGNOSED_E0) accurate++;
      if (c.state === CUBE_STATES.DIAGNOSED_ERROR) needsPractice++;
      if (c.state === CUBE_STATES.REMEDIATED) remediated++;
      if (c.state === CUBE_STATES.VERIFIED) verified++;
    });

    const percent = Math.round((unlocked / total) * 100);

    // Hitung milestone berikutnya
    let nextMilestone = null;
    for (const m of MILESTONES) {
      if (unlocked < m.count) {
        nextMilestone = {
          ...m,
          remaining: m.count - unlocked
        };
        break;
      }
    }

    // Tentukan soal berikutnya yang belum dikerjakan (Next Target)
    const nextQuestion = list.find((c) => c.state === CUBE_STATES.LOCKED) || null;

    return {
      total,
      unlocked,
      locked: total - unlocked,
      accurate,
      needsPractice,
      remediated,
      verified,
      percent,
      nextMilestone,
      nextQuestion,
      isCompleted: unlocked === total
    };
  }

  /**
   * Mengambil jumlah kubus yang sudah selesai/unlocked
   */
  getCompletedCount() {
    return this.getProgressStats().unlocked;
  }

  /**
   * Reset seluruh kubus (misal saat reset data penelitian)
   */
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.cubes = this._loadInitialState();
  }
}
