/**
 * transitionManager.js - Ultra-Smooth Lightweight Circular Wave Transition (EPE V2)
 * 
 * Menghadirkan transisi gelombang lingkaran halus (smooth water ripple) yang ringan & 60 FPS:
 * - 1 Gelombang Lingkaran Tunggal yang Mengembang Halus (Single Ultra-Smooth Wave)
 * - Hardware Accelerated: Hanya menggunakan transform: scale() dan opacity (bebas lag/ringan)
 * - 5 Gelembung Halus yang Mengapung Lembut (Lightweight Floating Bubbles)
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

    // Bersihkan elemen sebelumnya jika ada yang masih tersisa agar tidak membebani memori
    this.overlayContainer.innerHTML = "";

    const x = originX !== undefined ? originX : window.innerWidth / 2;
    const y = originY !== undefined ? originY : window.innerHeight / 2;

    // 1. Single Ultra-Smooth Circular Wave Ring (Ringan, Halus, 60 FPS)
    const wave = document.createElement("div");
    wave.className = "smooth-circular-wave";
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    this.overlayContainer.appendChild(wave);

    // 2. Hanya 5 Gelembung Halus Ringan (Tidak membebani browser)
    const bubbleCount = 5;
    for (let i = 0; i < bubbleCount; i++) {
      const bubble = document.createElement("div");
      bubble.className = "smooth-micro-bubble";

      const size = 12 + Math.random() * 16; // 12px - 28px
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 35;
      const startX = x + Math.cos(angle) * dist;
      const startY = y + Math.sin(angle) * dist;
      const driftX = (Math.random() - 0.5) * 60;
      const floatY = -(50 + Math.random() * 80);

      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${startX}px`;
      bubble.style.top = `${startY}px`;
      bubble.style.setProperty("--drift-x", `${driftX}px`);
      bubble.style.setProperty("--float-y", `${floatY}px`);

      this.overlayContainer.appendChild(bubble);
    }

    setTimeout(() => {
      if (this.overlayContainer) {
        this.overlayContainer.innerHTML = "";
      }
    }, 650);
  }
}
