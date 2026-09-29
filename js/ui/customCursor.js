/**
 * customCursor.js - Dynamic Adaptive Inverted Circle Cursor (EPE V3)
 * Menampilkan kursor bulatan interaktif adaptif berbasis difference blending:
 * - Medan Gelap / Hitam -> Kursor Otomatis Memutih Luminous (#ffffff)
 * - Medan Terang / Putih -> Kursor Otomatis Menghitam Solid (#000000)
 * - Medan Warna-Warni -> Inversi kontras matematis presisi tinggi
 * - Ultra Z-Index (2147483647) & Top-of-DOM Mutation Tracking: Tetap terlihat di atas semua modal (preview soal, authoring editor, dsb.)
 * - Mode I-Beam adaptif saat mengedit butir soal (input / textarea)
 * - Efek Fluid Trailing / Spring Lerp physics & magnetic hover expansion pada tombol interaktif
 */

export class CustomCursor {
  constructor() {
    this.dot = null;
    this.ring = null;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.ringX = this.mouseX;
    this.ringY = this.mouseY;
    this.isHovering = false;
    this.isTextInput = false;
    this.isClicking = false;
    this.isVisible = false;
    this.animId = null;
    this.observer = null;

    this.init();
  }

  init() {
    // Abaikan perangkat layar sentuh murni tanpa mouse
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    // Buat elemen DOM kursor jika belum ada
    let container = document.getElementById("epe-custom-cursor-wrapper");
    if (!container) {
      container = document.createElement("div");
      container.id = "epe-custom-cursor-wrapper";
      container.className = "epe-custom-cursor-wrapper";
      container.style.cssText = "position: fixed !important; top: 0px !important; left: 0px !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 2147483647 !important; overflow: visible !important;";
      container.innerHTML = `
        <div id="epe-cursor-dot" class="epe-cursor-dot"></div>
        <div id="epe-cursor-ring" class="epe-cursor-ring"></div>
      `;
      document.body.appendChild(container);
    } else {
      container.style.cssText = "position: fixed !important; top: 0px !important; left: 0px !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 2147483647 !important; overflow: visible !important;";
    }

    this.dot = document.getElementById("epe-cursor-dot");
    this.ring = document.getElementById("epe-cursor-ring");

    // MutationObserver untuk menjamin kursor selalu berada di ujung teratas DOM body (di atas semua modal)
    try {
      this.observer = new MutationObserver(() => {
        const c = document.getElementById("epe-custom-cursor-wrapper");
        if (c && c.parentElement === document.body && document.body.lastElementChild !== c) {
          document.body.appendChild(c);
        }
      });
      this.observer.observe(document.body, { childList: true });
    } catch (e) {
      console.warn("Cursor MutationObserver note:", e);
    }

    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    window.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      if (!this.isVisible) {
        this.isVisible = true;
        this.dot?.classList.add("is-active");
        this.ring?.classList.add("is-active");
      }

      // Pastikan wrapper selalu di posisi puncak tumpukan DOM jika ada modal baru dibuka
      const container = document.getElementById("epe-custom-cursor-wrapper");
      if (container && container.parentElement === document.body && document.body.lastElementChild !== container) {
        document.body.appendChild(container);
      }

      // Deteksi elemen input teks / textarea agar kursor berubah menjadi I-Beam presisi
      const target = e.target;
      const isTextInput = Boolean(
        target && (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("input:not([type='button']):not([type='submit']):not([type='checkbox']):not([type='radio'])") ||
          target.closest("textarea")
        )
      );

      // Deteksi elemen interaktif umum (tombol, link, dropdown)
      const isInteractive = Boolean(
        target && (
          isTextInput ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest("select") ||
          target.closest('[role="button"]') ||
          target.closest(".cursor-pointer") ||
          target.closest(".epe-nav-item") ||
          target.closest(".practice-card") ||
          target.closest("#ai-orb-container")
        )
      );

      if (isTextInput !== this.isTextInput) {
        this.isTextInput = isTextInput;
        if (this.ring) this.ring.classList.toggle("is-text-field", this.isTextInput);
        if (this.dot) this.dot.classList.toggle("is-text-field", this.isTextInput);
      }

      if (isInteractive !== this.isHovering) {
        this.isHovering = isInteractive;
        if (this.ring) this.ring.classList.toggle("is-hovering", this.isHovering);
        if (this.dot) this.dot.classList.toggle("is-hovering", this.isHovering);
      }
    }, { passive: true });

    window.addEventListener("mousedown", () => {
      this.isClicking = true;
      if (this.ring) this.ring.classList.add("is-clicking");
    });

    window.addEventListener("mouseup", () => {
      this.isClicking = false;
      if (this.ring) this.ring.classList.remove("is-clicking");
    });

    document.addEventListener("mouseleave", () => {
      this.isVisible = false;
      this.dot?.classList.remove("is-active");
      this.ring?.classList.remove("is-active");
    });

    document.addEventListener("mouseenter", () => {
      this.isVisible = true;
      this.dot?.classList.add("is-active");
      this.ring?.classList.add("is-active");
    });
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());

    if (!this.isVisible || !this.dot || !this.ring) return;

    // Posisi Dot instan di titik kursor
    this.dot.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0)`;

    // Posisi Ring dengan lerp smooth trailing physics (0.24)
    this.ringX += (this.mouseX - this.ringX) * 0.24;
    this.ringY += (this.mouseY - this.ringY) * 0.24;
    this.ring.style.transform = `translate3d(${this.ringX}px, ${this.ringY}px, 0)`;
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.observer) this.observer.disconnect();
  }
}
