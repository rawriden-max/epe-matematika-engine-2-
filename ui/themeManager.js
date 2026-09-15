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
    this.currentPalette = localStorage.getItem("epe_color_palette") || "blue";
    this.isRadialOpen = false;

    // Draggable & Rotatable State
    this.currentPos = { x: 0, y: 0 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.initialPos = { x: 0, y: 0 };

    this.isRotating = false;
    this.currentAngle = 0;
    this.startAngle = 0;
    this.baseAngle = 0;

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
    // Re-apply palette to ensure tokens are strong
    this.applyPalette(this.currentPalette);
  }

  toggleMode() {
    this.applyMode(this.mode === "dark" ? "light" : "dark");
  }

  applyPalette(paletteId) {
    const pal = THEME_PALETTES[paletteId] || THEME_PALETTES.blue;
    this.currentPalette = pal.id;
    localStorage.setItem("epe_color_palette", pal.id);

    // Apply directly on root AND body so dark mode can never override it
    const targets = [document.documentElement, document.body].filter(Boolean);
    targets.forEach((target) => {
      target.style.setProperty("--accent", pal.accent);
      target.style.setProperty("--accent-hover", pal.accentHover);
      target.style.setProperty("--accent-subtle", pal.accentSubtle);
      target.style.setProperty("--accent-text", pal.accentText);
      target.style.setProperty("--accent-glow", pal.accentGlow);
      target.style.setProperty("--accent-border", pal.border);
    });

    // Update active ring on radial buttons
    document.querySelectorAll(".radial-color-dot").forEach((dot) => {
      if (dot.getAttribute("data-palette") === pal.id) {
        dot.classList.add("active-palette");
      } else {
        dot.classList.remove("active-palette");
      }
    });

    if (this.onThemeChange) {
      this.onThemeChange(pal);
    }
  }

  clampPosition(x, y) {
    // Safe margin so dots (radius 68px) and border never clip on mobile screens
    const margin = 86;
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
    const radius = 68; // px radius for radial layout
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
        <div class="radial-center-badge" id="radial-drag-handle" title="Sentuh & Geser posisi / Putar roda warna">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16M10 4l-2 4 2 4M14 12l2 4-2 4"></path>
          </svg>
          <span class="radial-drag-hint">MOVE</span>
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

    // 1. Color Selection Dots Click
    menu.querySelectorAll(".radial-color-dot").forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const palId = e.currentTarget.getAttribute("data-palette");
        this.applyPalette(palId);
      });
    });

    // 2. Backdrop click closes menu
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeRadialMenu());
    }

    // 3. Playful Dragging of Center Handle
    if (centerHandle && circleBox) {
      const onDragStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDragging = true;
        centerHandle.classList.add("dragging");

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.dragStart = { x: clientX, y: clientY };
        this.initialPos = { ...this.currentPos };

        document.addEventListener("mousemove", onDragMove);
        document.addEventListener("touchmove", onDragMove, { passive: false });
        document.addEventListener("mouseup", onDragEnd);
        document.addEventListener("touchend", onDragEnd);
      };

      const onDragMove = (e) => {
        if (!this.isDragging) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - this.dragStart.x;
        const deltaY = clientY - this.dragStart.y;

        const rawX = this.initialPos.x + deltaX;
        const rawY = this.initialPos.y + deltaY;

        const safe = this.clampPosition(rawX, rawY);
        this.currentPos = safe;
        circleBox.style.left = `${safe.x}px`;
        circleBox.style.top = `${safe.y}px`;
      };

      const onDragEnd = () => {
        this.isDragging = false;
        centerHandle.classList.remove("dragging");
        document.removeEventListener("mousemove", onDragMove);
        document.removeEventListener("touchmove", onDragMove);
        document.removeEventListener("mouseup", onDragEnd);
        document.removeEventListener("touchend", onDragEnd);
      };

      centerHandle.addEventListener("mousedown", onDragStart);
      centerHandle.addEventListener("touchstart", onDragStart, { passive: false });
    }

    // 4. Playful Wheel Rotation (Spin Dial)
    if (rotator && circleBox) {
      const onRotateStart = (e) => {
        // Only trigger if not clicking directly on center handle
        if (e.target.closest("#radial-drag-handle") || e.target.closest(".radial-color-dot")) return;
        e.preventDefault();
        this.isRotating = true;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = circleBox.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        this.startAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        this.baseAngle = this.currentAngle;

        document.addEventListener("mousemove", onRotateMove);
        document.addEventListener("touchmove", onRotateMove, { passive: false });
        document.addEventListener("mouseup", onRotateEnd);
        document.addEventListener("touchend", onRotateEnd);
      };

      const onRotateMove = (e) => {
        if (!this.isRotating) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = circleBox.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const moveAngle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        const delta = moveAngle - this.startAngle;
        this.currentAngle = this.baseAngle + delta;
        rotator.style.transform = `rotate(${this.currentAngle}deg)`;
      };

      const onRotateEnd = () => {
        this.isRotating = false;
        document.removeEventListener("mousemove", onRotateMove);
        document.removeEventListener("touchmove", onRotateMove);
        document.removeEventListener("mouseup", onRotateEnd);
        document.removeEventListener("touchend", onRotateEnd);
      };

      circleBox.addEventListener("mousedown", onRotateStart);
      circleBox.addEventListener("touchstart", onRotateStart, { passive: false });
    }
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

    // Auto-reposition on window resize to ensure it stays within bounds
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

