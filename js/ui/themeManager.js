/**
 * themeManager.js - Theme & Radial Circular Color Selector (EPE V2)
 * 
 * 6 Palet Warna Kurasi:
 * 1. Electric Blue (AI Research Default)
 * 2. Violet (Deep Modern Intelligence)
 * 3. Emerald (Bio-Tech Mathematical Growth)
 * 4. Amber (Warm Cognitive Focus)
 * 5. Rose (Vibrant Minimalist)
 * 6. Cyan (Futuristic Quantum Glow)
 */

export const THEME_PALETTES = {
  blue: {
    id: "blue",
    name: "Electric Blue",
    accent: "#3b82f6",
    accentHover: "#2563eb",
    accentSubtle: "rgba(59, 130, 246, 0.15)",
    accentText: "#60a5fa",
    accentGlow: "rgba(59, 130, 246, 0.5)",
    border: "rgba(59, 130, 246, 0.3)"
  },
  violet: {
    id: "violet",
    name: "Violet",
    accent: "#8b5cf6",
    accentHover: "#7c3aed",
    accentSubtle: "rgba(139, 92, 246, 0.15)",
    accentText: "#a78bfa",
    accentGlow: "rgba(139, 92, 246, 0.5)",
    border: "rgba(139, 92, 246, 0.3)"
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    accent: "#10b981",
    accentHover: "#059669",
    accentSubtle: "rgba(16, 185, 129, 0.15)",
    accentText: "#34d399",
    accentGlow: "rgba(16, 185, 129, 0.5)",
    border: "rgba(16, 185, 129, 0.3)"
  },
  amber: {
    id: "amber",
    name: "Amber",
    accent: "#f59e0b",
    accentHover: "#d97706",
    accentSubtle: "rgba(245, 158, 11, 0.15)",
    accentText: "#fbbf24",
    accentGlow: "rgba(245, 158, 11, 0.5)",
    border: "rgba(245, 158, 11, 0.3)"
  },
  rose: {
    id: "rose",
    name: "Rose",
    accent: "#f43f5e",
    accentHover: "#e11d48",
    accentSubtle: "rgba(244, 63, 94, 0.15)",
    accentText: "#fb7185",
    accentGlow: "rgba(244, 63, 94, 0.5)",
    border: "rgba(244, 63, 94, 0.3)"
  },
  cyan: {
    id: "cyan",
    name: "Cyan",
    accent: "#06b6d4",
    accentHover: "#0891b2",
    accentSubtle: "rgba(6, 182, 212, 0.15)",
    accentText: "#22d3ee",
    accentGlow: "rgba(6, 182, 212, 0.5)",
    border: "rgba(6, 182, 212, 0.3)"
  }
};

export class ThemeManager {
  constructor({ onThemeChange = null }) {
    this.onThemeChange = onThemeChange;
    this.mode = localStorage.getItem("epe_theme_mode") || "dark";
    let savedPal = localStorage.getItem("epe_color_palette");
    if (!savedPal || savedPal === "blue") savedPal = "amber";
    this.currentPalette = savedPal;
    this.isRadialOpen = false;

    // Draggable & Rotatable State
    this.currentPos = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.initialPos = { x: 0, y: 0 };

    this.currentAngle = 0;
    this.isRotating = false;

    this.init();
  }

  init() {
    this.applyMode(this.mode);
    this.applyPalette(this.currentPalette);
    this.renderRadialMenu();
    this.bindEvents();
  }

  applyMode(mode) {
    this.mode = mode;
    localStorage.setItem("epe_theme_mode", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("theme-dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("theme-dark");
    }
    // Re-enforce palette so it stays vivid
    this.applyPalette(this.currentPalette);
  }

  toggleMode() {
    this.applyMode(this.mode === "dark" ? "light" : "dark");
  }

  applyPalette(paletteId) {
    const pal = THEME_PALETTES[paletteId] || THEME_PALETTES.amber;
    this.currentPalette = pal.id;
    localStorage.setItem("epe_color_palette", pal.id);

    // 1. Direct style property assignment
    const targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach((target) => {
      target.style.setProperty("--accent", pal.accent);
      target.style.setProperty("--accent-hover", pal.accentHover);
      target.style.setProperty("--accent-subtle", pal.accentSubtle);
      target.style.setProperty("--accent-text", pal.accentText);
      target.style.setProperty("--accent-glow", pal.accentGlow);
      target.style.setProperty("--accent-border", pal.border);
    });

    // 2. High-priority dynamic <style> injection with !important
    // This GUARANTEES colors work in Dark Mode even if external style.css is cached!
    let styleEl = document.getElementById("dynamic-theme-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-theme-style";
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      :root, html, body, .dark, body.theme-dark, [class*="theme-"] {
        --accent: ${pal.accent} !important;
        --accent-hover: ${pal.accentHover} !important;
        --accent-subtle: ${pal.accentSubtle} !important;
        --accent-text: ${pal.accentText} !important;
        --accent-glow: ${pal.accentGlow} !important;
        --accent-border: ${pal.border} !important;
      }
      .btn-primary, button.btn-primary {
        background-color: ${pal.accent} !important;
        border-color: ${pal.accent} !important;
        color: #ffffff !important;
      }
      .btn-primary:hover, button.btn-primary:hover {
        background-color: ${pal.accentHover} !important;
        border-color: ${pal.accentHover} !important;
      }
      .step-number, .mode-switch-btn.active, .nav-tab-btn.active {
        background-color: ${pal.accentSubtle} !important;
        color: ${pal.accent} !important;
        border-color: ${pal.border} !important;
      }
      .q-nav-item.active {
        border-color: ${pal.accent} !important;
        background-color: ${pal.accentSubtle} !important;
        color: ${pal.accent} !important;
        box-shadow: 0 0 0 1px ${pal.accent} !important;
      }
      .radial-center-badge {
        border-color: ${pal.accent} !important;
        box-shadow: 0 4px 18px rgba(0,0,0,0.4), 0 0 12px ${pal.accentGlow} !important;
      }
      .floating-ai-trigger {
        border-color: ${pal.accent} !important;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4), 0 0 15px ${pal.accentGlow} !important;
      }
    `;

    // 3. Update active dot in radial menu
    document.querySelectorAll(".radial-color-dot").forEach((dot) => {
      if (dot.getAttribute("data-palette") === pal.id) {
        dot.classList.add("active-palette");
      } else {
        dot.classList.remove("active-palette");
      }
    });

    // 4. Update trigger button indicator
    const triggerDot = document.querySelector("#radial-theme-trigger-btn span");
    if (triggerDot) {
      triggerDot.style.backgroundColor = pal.accent;
    }

    if (this.onThemeChange) {
      this.onThemeChange(pal);
    }
  }

  clampPosition(x, y) {
    const margin = 88;
    const maxX = Math.max(margin, window.innerWidth - margin);
    const maxY = Math.max(margin, window.innerHeight - margin);
    const clampedX = Math.min(maxX, Math.max(margin, x));
    const clampedY = Math.min(maxY, Math.max(margin, y));
    return { x: clampedX, y: clampedY };
  }

  renderRadialMenu() {
    let menu = document.getElementById("radial-theme-menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "radial-theme-menu";
      menu.className = "radial-theme-menu-container hidden";
      document.body.appendChild(menu);
    }

    const palettes = Object.values(THEME_PALETTES);
    const radius = 68;
    const total = palettes.length;

    let dotsHtml = "";
    palettes.forEach((p, idx) => {
      const angle = (idx / total) * Math.PI * 2 - Math.PI / 2;
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius);
      const isActive = p.id === this.currentPalette;

      dotsHtml += `
        <button
          type="button"
          class="radial-color-dot ${isActive ? "active-palette" : ""}"
          data-palette="${p.id}"
          title="${p.name}"
          style="--tx: ${x}px; --ty: ${y}px; background-color: ${p.accent};"
        ></button>
      `;
    });

    menu.innerHTML = `
      <div class="radial-theme-backdrop" id="radial-backdrop"></div>
      <div class="radial-theme-circle" id="radial-circle-box">
        <div class="radial-orbit-ring" id="radial-orbit-guide"></div>
        <div class="radial-wheel-rotator" id="radial-wheel-rotator">
          ${dotsHtml}
        </div>
        
        <!-- Center Drag & Spin Handle -->
        <div class="radial-center-badge" id="radial-drag-handle" title="Tahan & Geser untuk memindahkan posisi | Klik untuk Putar Roda!">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16M10 4l-2 4 2 4M14 12l2 4-2 4"></path>
          </svg>
          <span class="radial-drag-hint">DRAG</span>
        </div>
      </div>
    `;

    this.bindRadialInteractions(menu);
  }

  bindRadialInteractions(menu) {
    const circleBox = menu.querySelector("#radial-circle-box");
    const centerHandle = menu.querySelector("#radial-drag-handle");
    const rotator = menu.querySelector("#radial-wheel-rotator");
    const backdrop = menu.querySelector("#radial-backdrop");

    // 1. Color Dots Selection
    menu.querySelectorAll(".radial-color-dot").forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const palId = e.currentTarget.getAttribute("data-palette");
        this.applyPalette(palId);
      });
    });

    // 2. Backdrop closes menu
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeRadialMenu());
    }

    // 3. Playful Dragging
    let startPointerX = 0;
    let startPointerY = 0;
    let hasMoved = false;

    const onPointerDown = (e) => {
      if (e.target.closest(".radial-color-dot")) return;
      e.preventDefault();
      this.isDragging = true;
      hasMoved = false;
      centerHandle?.classList.add("dragging");

      startPointerX = e.touches ? e.touches[0].clientX : e.clientX;
      startPointerY = e.touches ? e.touches[0].clientY : e.clientY;
      this.initialPos = { ...this.currentPos };

      document.addEventListener("mousemove", onPointerMove);
      document.addEventListener("touchmove", onPointerMove, { passive: false });
      document.addEventListener("mouseup", onPointerUp);
      document.addEventListener("touchend", onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startPointerX;
      const deltaY = clientY - startPointerY;

      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMoved = true;
      }

      const rawX = this.initialPos.x + deltaX;
      const rawY = this.initialPos.y + deltaY;

      const safe = this.clampPosition(rawX, rawY);
      this.currentPos = safe;
      circleBox.style.left = `${safe.x}px`;
      circleBox.style.top = `${safe.y}px`;
    };

    const onPointerUp = () => {
      this.isDragging = false;
      centerHandle?.classList.remove("dragging");
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("touchmove", onPointerMove);
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchend", onPointerUp);

      // If clicked without dragging, perform a playful spin!
      if (!hasMoved) {
        this.spinWheel();
      }
    };

    if (circleBox) {
      circleBox.addEventListener("mousedown", onPointerDown);
      circleBox.addEventListener("touchstart", onPointerDown, { passive: false });
    }
  }

  spinWheel() {
    const rotator = document.getElementById("radial-wheel-rotator");
    if (!rotator) return;

    // Spin by 60 or 120 degrees smoothly
    this.currentAngle += 120;
    rotator.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
    rotator.style.transform = `rotate(${this.currentAngle}deg)`;

    setTimeout(() => {
      rotator.style.transition = "transform 0.1s ease";
    }, 520);
  }

  toggleRadialMenu(anchorElement) {
    if (this.isRadialOpen) {
      this.closeRadialMenu();
    } else {
      this.openRadialMenu(anchorElement);
    }
  }

  openRadialMenu(anchorElement) {
    const menu = document.getElementById("radial-theme-menu");
    const circleBox = document.getElementById("radial-circle-box");
    if (!menu || !circleBox) return;

    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      const rawX = rect.left + rect.width / 2;
      const rawY = rect.bottom + 95;
      const safe = this.clampPosition(rawX, rawY);
      this.currentPos = safe;
      circleBox.style.left = `${safe.x}px`;
      circleBox.style.top = `${safe.y}px`;
    }

    menu.classList.remove("hidden");
    requestAnimationFrame(() => {
      menu.classList.add("radial-active");
    });
    this.isRadialOpen = true;
  }

  closeRadialMenu() {
    const menu = document.getElementById("radial-theme-menu");
    if (!menu) return;

    menu.classList.remove("radial-active");
    setTimeout(() => {
      menu.classList.add("hidden");
      this.isRadialOpen = false;
    }, 220);
  }

  bindEvents() {
    const triggerBtn = document.getElementById("radial-theme-trigger-btn");
    if (triggerBtn) {
      triggerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleRadialMenu(triggerBtn);
      });
    }

    const modeBtn = document.getElementById("theme-toggle-btn");
    if (modeBtn) {
      modeBtn.addEventListener("click", () => this.toggleMode());
    }

    window.addEventListener("resize", () => {
      if (this.isRadialOpen) {
        const circleBox = document.getElementById("radial-circle-box");
        if (circleBox) {
          const safe = this.clampPosition(this.currentPos.x, this.currentPos.y);
          this.currentPos = safe;
          circleBox.style.left = `${safe.x}px`;
          circleBox.style.top = `${safe.y}px`;
        }
      }
    });
  }
}
