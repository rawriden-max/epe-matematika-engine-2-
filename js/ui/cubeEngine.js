/**
 * cubeEngine.js - High-Performance Isometric 3D Learning Cubes Engine (EPE V2)
 * 
 * Renders an interactive, single cohesive stacked isometric monument of 24 Collectible Cubes.
 * Features:
 * - 24 mapped coordinates forming a tiered monument (Bottom: 12, Mid: 7, Upper: 4, Apex: 1 = 24)
 * - Completion Pull: locked cubes appear as elegant translucent wireframe silhouettes
 * - States: LOCKED, DIAGNOSED_E0, DIAGNOSED_ERROR, REMEDIATED, VERIFIED
 * - Lego-style glowing top stud/peg (inspired by reference image)
 * - Soft depth lighting, translucent glass sides, hover elevation & glow
 * - Canvas 2D high-performance rendering (60 FPS on desktop & mobile)
 * - Interactive hover tooltip and click events
 * - Micro-reward entry animations and 24/24 completion wave
 */

import { CUBE_STATES } from "../data/cubeStore.js";

// Fixed 24 coordinate positions for the tiered monument
// (u = column, v = row, w = vertical tier level)
const MONUMENT_COORDINATES = [
  // Tier 0: Foundation (12 blocks) - Q1 to Q12
  { qId: "Q1",  u: 0, v: 0, w: 0 },
  { qId: "Q2",  u: 1, v: 0, w: 0 },
  { qId: "Q3",  u: 2, v: 0, w: 0 },
  { qId: "Q4",  u: 3, v: 0, w: 0 },
  { qId: "Q5",  u: 0, v: 1, w: 0 },
  { qId: "Q6",  u: 1, v: 1, w: 0 },
  { qId: "Q7",  u: 2, v: 1, w: 0 },
  { qId: "Q8",  u: 3, v: 1, w: 0 },
  { qId: "Q9",  u: 0, v: 2, w: 0 },
  { qId: "Q10", u: 1, v: 2, w: 0 },
  { qId: "Q11", u: 2, v: 2, w: 0 },
  { qId: "Q12", u: 3, v: 2, w: 0 },

  // Tier 1: Mid-Structure (7 blocks) - Q13 to Q19
  { qId: "Q13", u: 0.5, v: 0.5, w: 1 },
  { qId: "Q14", u: 1.5, v: 0.5, w: 1 },
  { qId: "Q15", u: 2.5, v: 0.5, w: 1 },
  { qId: "Q16", u: 0.5, v: 1.5, w: 1 },
  { qId: "Q17", u: 1.5, v: 1.5, w: 1 },
  { qId: "Q18", u: 2.5, v: 1.5, w: 1 },
  { qId: "Q19", u: 1.5, v: 1.0, w: 1 },

  // Tier 2: Upper Structure (4 blocks) - Q20 to Q23
  { qId: "Q20", u: 1.0, v: 1.0, w: 2 },
  { qId: "Q21", u: 2.0, v: 1.0, w: 2 },
  { qId: "Q22", u: 1.0, v: 1.5, w: 2 },
  { qId: "Q23", u: 2.0, v: 1.5, w: 2 },

  // Tier 3: Apex / Crown Block (1 block) - Q24 (Capstone!)
  { qId: "Q24", u: 1.5, v: 1.25, w: 3 }
];

export class IsometricCubeEngine {
  constructor({ canvasId, cubeStore, onCubeClick = null, onCubeHover = null }) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext("2d");
    this.cubeStore = cubeStore;
    this.onCubeClick = onCubeClick;
    this.onCubeHover = onCubeHover;

    this.hoveredCubeId = null;
    this.animatingCubeId = null;
    this.animationProgress = 0;
    this.completionWave = 0;

    // Theme color palette (defaults to Electric Blue)
    this.themeColors = {
      accent: "#3b82f6",
      accentGlow: "rgba(59, 130, 246, 0.5)",
      studGlow: "rgba(255, 255, 255, 0.9)"
    };

    this.initCanvas();
    this.bindEvents();
    this.startRenderLoop();
  }

  setThemeColors({ accent, accentGlow }) {
    if (accent) this.themeColors.accent = accent;
    if (accentGlow) this.themeColors.accentGlow = accentGlow;
  }

  initCanvas() {
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 480;
    this.height = rect.height || 360;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  bindEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const hit = this.hitTest(mouseX, mouseY);

      if (hit !== this.hoveredCubeId) {
        this.hoveredCubeId = hit;
        this.canvas.style.cursor = hit ? "pointer" : "default";
        if (this.onCubeHover) {
          const cubeData = hit ? this.cubeStore.getCube(hit) : null;
          this.onCubeHover(cubeData, { mouseX, mouseY, clientX: e.clientX, clientY: e.clientY });
        }
      }
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.hoveredCubeId = null;
      if (this.onCubeHover) this.onCubeHover(null);
    });

    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const hit = this.hitTest(mouseX, mouseY);
      if (hit && this.onCubeClick) {
        const cubeData = this.cubeStore.getCube(hit);
        this.onCubeClick(cubeData);
      }
    });
  }

  /**
   * Proyeksi isometrik (u, v, w) -> (x, y) pada canvas
   */
  project(u, v, w, cubeSize = 36, cubeHeight = 28) {
    const angle = Math.PI / 6; // 30 derajat
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Center of monument on canvas
    const originX = this.width * 0.5;
    const originY = this.height * 0.68;

    // Offset u, v relatif terhadap titik pusat tatanan
    const cu = u - 1.5;
    const cv = v - 1.0;

    const isoX = (cu - cv) * (cubeSize * cosA) + originX;
    const isoY = (cu + cv) * (cubeSize * sinA) - (w * cubeHeight) + originY;

    return { x: isoX, y: isoY };
  }

  startRenderLoop() {
    const loop = () => {
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Main Render Method
   */
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Responsive scaling based on canvas size
    const baseScale = Math.min(this.width / 460, this.height / 340);
    const cubeSize = Math.max(26, Math.min(38, 34 * baseScale));
    const cubeHeight = cubeSize * 0.78;

    // Hitung posisi seluruh 24 kubus & urutkan dari belakang ke depan (painter's algorithm)
    const renderList = MONUMENT_COORDINATES.map((coord, index) => {
      const cubeData = this.cubeStore.getCube(coord.qId) || { state: CUBE_STATES.LOCKED, questionId: coord.qId };
      const isHovered = this.hoveredCubeId === coord.qId;
      const isAnimating = this.animatingCubeId === coord.qId;

      // Vertical hover lift
      let lift = isHovered ? 6 : 0;
      let scale = 1;

      if (isAnimating) {
        scale = 0.5 + 0.5 * Math.sin(this.animationProgress * Math.PI * 0.5);
        lift += Math.sin(this.animationProgress * Math.PI) * 12;
      }

      const proj = this.project(coord.u, coord.v, coord.w, cubeSize, cubeHeight);
      proj.y -= lift;

      // Depth sorting metric: larger depth rendered later (in front)
      const depth = (coord.u + coord.v) * 10 + coord.w * 20;

      return {
        ...coord,
        proj,
        cubeData,
        depth,
        isHovered,
        scale,
        index
      };
    });

    renderList.sort((a, b) => a.depth - b.depth);

    // Simpan polygon paths untuk hit-testing
    this.renderedPolygons = [];

    // Render soft shadow base platform
    this.renderMonumentShadow(cubeSize);

    // Render each cube
    renderList.forEach((item) => {
      this.drawIsometricCube(item, cubeSize, cubeHeight);
    });

    // Advance animations
    if (this.animatingCubeId) {
      this.animationProgress += 0.05;
      if (this.animationProgress >= 1) {
        this.animatingCubeId = null;
        this.animationProgress = 0;
      }
    }
  }

  renderMonumentShadow(cubeSize) {
    const ctx = this.ctx;
    const originX = this.width * 0.5;
    const originY = this.height * 0.72;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(originX, originY, cubeSize * 4.2, cubeSize * 2.1, 0, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(originX, originY, 10, originX, originY, cubeSize * 4.2);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.35)");
    grad.addColorStop(0.6, "rgba(0, 0, 0, 0.15)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  /**
   * Menggambar 1 Isometric Cube dengan 3 Faces (Top, Left, Right) + Top Stud
   */
  drawIsometricCube(item, cubeSize, cubeHeight) {
    const ctx = this.ctx;
    const { proj, cubeData, isHovered, scale } = item;
    const { x, y } = proj;

    const angle = Math.PI / 6;
    const dx = cubeSize * Math.cos(angle) * scale;
    const dy = cubeSize * Math.sin(angle) * scale;
    const h = cubeHeight * scale;

    // Titik-titik penting kubus
    const topCenter = { x, y: y - dy };
    const topRight = { x: x + dx, y };
    const topBottom = { x, y: y + dy };
    const topLeft = { x: x - dx, y };

    const bottomCenter = { x, y: y + dy + h };
    const bottomRight = { x: x + dx, y: y + h };
    const bottomLeft = { x: x - dx, y: y + h };

    const state = cubeData.state;
    const isLocked = state === CUBE_STATES.LOCKED;

    // Color theme & style tokens
    const styles = this.getCubeFaceStyles(state, isHovered);

    ctx.save();

    // 1. LEFT FACE
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topBottom.x, topBottom.y);
    ctx.lineTo(bottomCenter.x, bottomCenter.y);
    ctx.lineTo(bottomLeft.x, bottomLeft.y);
    ctx.closePath();
    ctx.fillStyle = styles.leftFill;
    ctx.fill();
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = styles.strokeWidth;
    ctx.stroke();

    // 2. RIGHT FACE
    ctx.beginPath();
    ctx.moveTo(topBottom.x, topBottom.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(bottomRight.x, bottomRight.y);
    ctx.lineTo(bottomCenter.x, bottomCenter.y);
    ctx.closePath();
    ctx.fillStyle = styles.rightFill;
    ctx.fill();
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = styles.strokeWidth;
    ctx.stroke();

    // 3. TOP FACE
    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(topBottom.x, topBottom.y);
    ctx.lineTo(topLeft.x, topLeft.y);
    ctx.closePath();
    ctx.fillStyle = styles.topFill;
    ctx.fill();
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = styles.strokeWidth;
    ctx.stroke();

    // 4. TOP STUD / PEG (Signature collectible block element)
    this.drawTopStud(ctx, x, y, dx, dy, styles, isLocked);

    // 5. INNER GLOW / HIGHLIGHT EMBOSS
    if (!isLocked) {
      this.drawCubeGlow(ctx, x, y, dx, dy, h, styles);
    }

    // 6. QUESTION NUMBER LABEL ON TOP FACE (Subtle & clean)
    this.drawCubeLabel(ctx, x, y, item.qId, isLocked, isHovered);

    ctx.restore();

    // Record entire cube bounding polygon for click/hover hit-testing
    this.renderedPolygons.push({
      qId: item.qId,
      cubeData,
      poly: [
        topCenter,
        topRight,
        bottomRight,
        bottomCenter,
        bottomLeft,
        topLeft
      ]
    });
  }

  /**
   * Menggambar Stud / Peg berbentuk silinder isometrik di bagian atas kubus
   */
  drawTopStud(ctx, cx, cy, dx, dy, styles, isLocked) {
    const studRadiusX = dx * 0.36;
    const studRadiusY = dy * 0.36;
    const studHeight = dy * 0.45;
    const studCenterY = cy - studHeight * 0.5;

    ctx.save();

    // Stud Cylinder Base/Wall
    ctx.beginPath();
    ctx.ellipse(cx, studCenterY, studRadiusX, studRadiusY, 0, 0, Math.PI);
    ctx.lineTo(cx + studRadiusX, studCenterY - studHeight);
    ctx.ellipse(cx, studCenterY - studHeight, studRadiusX, studRadiusY, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = styles.studSideFill;
    ctx.fill();
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = isLocked ? 0.7 : 1;
    ctx.stroke();

    // Stud Cap (Top ellipse)
    ctx.beginPath();
    ctx.ellipse(cx, studCenterY - studHeight, studRadiusX, studRadiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = styles.studTopFill;
    ctx.fill();
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = isLocked ? 0.7 : 1;
    ctx.stroke();

    // Neon Stud Glow Reflection
    if (!isLocked) {
      ctx.beginPath();
      ctx.ellipse(cx, studCenterY - studHeight, studRadiusX * 0.5, studRadiusY * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fill();
    }

    ctx.restore();
  }

  drawCubeGlow(ctx, x, y, dx, dy, h, styles) {
    if (!styles.glowColor) return;
    ctx.save();
    ctx.shadowColor = styles.glowColor;
    ctx.shadowBlur = styles.glowBlur || 12;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - dy);
    ctx.lineTo(x + dx, y);
    ctx.lineTo(x, y + dy);
    ctx.lineTo(x - dx, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  drawCubeLabel(ctx, x, y, qId, isLocked, isHovered) {
    ctx.save();
    ctx.font = isHovered ? "bold 10px JetBrains Mono, monospace" : "9px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isLocked) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
    } else {
      ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.85)";
    }

    // Number text placed just above bottom corner of top face
    ctx.fillText(qId, x, y + 1);
    ctx.restore();
  }

  /**
   * Menentukan palet warna dan efek visual berdasarkan status kubus
   */
  getCubeFaceStyles(state, isHovered) {
    const accent = this.themeColors.accent;
    const glow = this.themeColors.accentGlow;

    switch (state) {
      case CUBE_STATES.LOCKED:
        // Silhouette Wireframe Transparan (Completion Pull!)
        return {
          topFill: isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
          leftFill: isHovered ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.25)",
          rightFill: isHovered ? "rgba(15, 23, 42, 0.5)" : "rgba(15, 23, 42, 0.35)",
          stroke: isHovered ? "rgba(148, 163, 184, 0.4)" : "rgba(148, 163, 184, 0.18)",
          strokeWidth: isHovered ? 1.2 : 0.8,
          studTopFill: "rgba(148, 163, 184, 0.08)",
          studSideFill: "rgba(15, 23, 42, 0.3)"
        };

      case CUBE_STATES.DIAGNOSED_E0:
        // Akurat / Bebas Kesalahan: Glowing Electric Translucent Glass (Sesuai Referensi Gambar)
        return {
          topFill: isHovered ? "rgba(255, 255, 255, 0.95)" : "rgba(240, 246, 255, 0.88)",
          leftFill: "rgba(30, 58, 138, 0.75)",
          rightFill: "rgba(15, 23, 42, 0.85)",
          stroke: "rgba(255, 255, 255, 0.8)",
          strokeWidth: 1.5,
          studTopFill: "#ffffff",
          studSideFill: "rgba(255, 255, 255, 0.75)",
          glowColor: glow,
          glowBlur: isHovered ? 20 : 12
        };

      case CUBE_STATES.DIAGNOSED_ERROR:
        // Terdeteksi Error: Tetap collectible! Aksen Amber hangat bernuansa bimbingan belajar
        return {
          topFill: isHovered ? "rgba(254, 243, 199, 0.92)" : "rgba(253, 230, 138, 0.82)",
          leftFill: "rgba(180, 83, 9, 0.75)",
          rightFill: "rgba(120, 53, 15, 0.85)",
          stroke: "rgba(252, 211, 77, 0.8)",
          strokeWidth: 1.5,
          studTopFill: "#fef3c7",
          studSideFill: "#f59e0b",
          glowColor: "rgba(245, 158, 11, 0.6)",
          glowBlur: isHovered ? 18 : 10
        };

      case CUBE_STATES.REMEDIATED:
        // Selesai Remediasi: Crystal Teal Shimmer
        return {
          topFill: isHovered ? "rgba(204, 251, 241, 0.95)" : "rgba(153, 246, 228, 0.85)",
          leftFill: "rgba(13, 148, 136, 0.75)",
          rightFill: "rgba(17, 94, 89, 0.85)",
          stroke: "rgba(45, 212, 191, 0.85)",
          strokeWidth: 1.5,
          studTopFill: "#ffffff",
          studSideFill: "#14b8a6",
          glowColor: "rgba(20, 184, 166, 0.6)",
          glowBlur: isHovered ? 22 : 14
        };

      case CUBE_STATES.VERIFIED:
        // Mahkota / Sempurna: Diamond Crystal Radian
        return {
          topFill: "#ffffff",
          leftFill: "rgba(79, 70, 229, 0.8)",
          rightFill: "rgba(49, 46, 129, 0.9)",
          stroke: "#ffffff",
          strokeWidth: 1.8,
          studTopFill: "#ffffff",
          studSideFill: "#818cf8",
          glowColor: "rgba(129, 140, 248, 0.8)",
          glowBlur: isHovered ? 26 : 18
        };

      default:
        return this.getCubeFaceStyles(CUBE_STATES.LOCKED, isHovered);
    }
  }

  /**
   * Hit testing: memeriksa apakah koordinat pointer berada di dalam salah satu kubus
   */
  hitTest(x, y) {
    if (!this.renderedPolygons) return null;
    // Cek dari kubus paling depan ke belakang
    for (let i = this.renderedPolygons.length - 1; i >= 0; i--) {
      const item = this.renderedPolygons[i];
      if (this.pointInPolygon(x, y, item.poly)) {
        return item.qId;
      }
    }
    return null;
  }

  pointInPolygon(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Memicu animasi singkat saat kubus baru diperoleh (Micro-Reward Animation)
   */
  triggerUnlockAnimation(questionId) {
    this.animatingCubeId = questionId;
    this.animationProgress = 0;
  }

  /**
   * Memicu animasi wave saat 24/24 kubus lengkap
   */
  triggerMasteryCelebration() {
    this.completionWave = 1;
    let step = 0;
    const interval = setInterval(() => {
      if (step < MONUMENT_COORDINATES.length) {
        this.triggerUnlockAnimation(MONUMENT_COORDINATES[step].qId);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 80);
  }
}
