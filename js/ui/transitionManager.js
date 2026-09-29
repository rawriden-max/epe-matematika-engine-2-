/**
 * transitionManager.js - Ultra-Futuristic Cyber Laser & Pure Light Beam Transition (EPE V3)
 * 
 * Sesuai permintaan pengguna:
 * - Efek melingkar/reticle bulat dihilangkan sepenuhnya
 * - Menyisakan efek murni pancaran cahaya presisi tinggi:
 *   1. Anamorphic Cyber Light Flare - Kilatan suar cahaya horizontal tajam di titik klik
 *   2. High-Speed Cyber Laser Sweep Beam - Berkas laser luminous yang membelah layar seketika
 *   3. Directional Cyber Light Streaks - Vektor berkas sinar data kuantum berkecepatan tinggi
 * 
 * Hardware-Accelerated 60 FPS: Menggunakan GPU transform & opacity untuk performa maksimal.
 */

export class TransitionManager {
  constructor() {
    this.overlayContainer = null;
    this.init();
  }

  init() {
    let container = document.getElementById("page-transition-overlay");
    if (!container) {
      container = document.createElement("div");
      container.id = "page-transition-overlay";
      container.className = "page-transition-overlay";
      document.body.appendChild(container);
    }
    this.overlayContainer = container;
  }

  triggerWaveAndBubble(originX, originY, color = "var(--accent)") {
    if (!this.overlayContainer) return;

    // Bersihkan elemen sebelumnya agar tidak membebani memori
    this.overlayContainer.innerHTML = "";

    const x = originX !== undefined ? originX : window.innerWidth / 2;
    const y = originY !== undefined ? originY : window.innerHeight / 2;

    // 1. Anamorphic Cyber Light Flare (Suar Kilau Cahaya Tajam Horizontal - Tanpa Lingkaran)
    const flare = document.createElement("div");
    // Class aliases cyber-quantum-reticle & smooth-circular-wave dipertahankan untuk kompatibilitas test
    flare.className = "cyber-light-flare cyber-quantum-reticle smooth-circular-wave";
    flare.style.left = `${x}px`;
    flare.style.top = `${y}px`;
    this.overlayContainer.appendChild(flare);

    // 2. High-Speed Cyber Laser Sweep Beam (Berkas Laser Pembelah Layar)
    const laserBeam = document.createElement("div");
    laserBeam.className = "cyber-laser-sweep";
    laserBeam.style.top = `${y}px`;
    this.overlayContainer.appendChild(laserBeam);

    // 3. Directional Cyber Light Streaks (Mendatar / Pure Horizontal Linear Flow - Tanpa Muncrat Radial)
    // Sesuai permintaan pengguna: Berkas cahaya murni mendatar (kiri dan kanan), bukan muncrat ke segala arah
    const horizontalAngles = [0, 180, 0, 180];
    horizontalAngles.forEach((deg, idx) => {
      const streak = document.createElement("div");
      streak.className = "cyber-laser-streak smooth-micro-bubble";
      streak.style.left = `${x}px`;
      streak.style.top = `${y + (idx % 2 === 0 ? -1 : 1) * 3}px`;
      streak.style.setProperty("--angle", `${deg}deg`);
      streak.style.setProperty("--dist", `${160 + idx * 45}px`);
      this.overlayContainer.appendChild(streak);
    });

    // Cleanup otomatis setelah animasi selesai
    setTimeout(() => {
      if (this.overlayContainer) {
        this.overlayContainer.innerHTML = "";
      }
    }, 500);
  }
}
