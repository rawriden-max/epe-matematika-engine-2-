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
  }

  toggleMode() {
    this.applyMode(this.mode === "dark" ? "light" : "dark");
  }

  applyPalette(paletteId) {
    const pal = THEME_PALETTES[paletteId] || THEME_PALETTES.blue;
    this.currentPalette = pal.id;
    localStorage.setItem("epe_color_palette", pal.id);

    const root = document.documentElement;
    root.style.setProperty("--accent", pal.accent);
    root.style.setProperty("--accent-hover", pal.accentHover);
    root.style.setProperty("--accent-subtle", pal.accentSubtle);
    root.style.setProperty("--accent-text", pal.accentText);
    root.style.setProperty("--accent-glow", pal.accentGlow);
    root.style.setProperty("--accent-border", pal.border);

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

  renderRadialMenu() {
    // Inject radial menu container if not exists
    let menu = document.getElementById("radial-theme-menu");
    if (!menu) {
      menu = document.createElement("div");
      menu.id = "radial-theme-menu";
      menu.className = "radial-theme-menu-container hidden";
      document.body.appendChild(menu);
    }

    const palettes = Object.values(THEME_PALETTES);
    const radius = 64; // px radius for radial layout
    const total = palettes.length;

    let dotsHtml = "";
    palettes.forEach((p, idx) => {
      // Angle for 6 items evenly distributed around circle
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
        <div class="radial-center-badge">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
        </div>
        ${dotsHtml}
      </div>
    `;

    // Bind dots click
    menu.querySelectorAll(".radial-color-dot").forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.stopPropagation();
        const palId = e.currentTarget.getAttribute("data-palette");
        this.applyPalette(palId);
        this.closeRadialMenu();
      });
    });

    const backdrop = menu.querySelector("#radial-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeRadialMenu());
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
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.bottom + 70;
      circleBox.style.left = `${centerX}px`;
      circleBox.style.top = `${centerY}px`;
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
  }
}
