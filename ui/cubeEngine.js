/**
 * cubeEngine.js - High-Performance Isometric 3D Learning Cubes Engine (EPE V2)
 * 
 * Renders an interactive, single cohesive stacked isometric monument of 24 Collectible Cubes.
 * 
 * Fitur & Penyempurnaan:
 * - Anti-Drift: Resize stabil & transform isolation (tidak pernah bergeser ke bawah saat ganti tab)
 * - Drop-from-Sky Physics Animation: Kubus baru jatuh dari langit, memantul dengan squash & stretch,
 *   dan memicu gelombang ripple saat mengisi slot kosong!
 * - Organic Idle Floating: Rona bernapas & micro-floating halus agar kubus tidak kaku
 * - Signature Lego-like glowing top stud
 * - Hover elevation halus dengan floating tooltip & click handling
 */

import { CUBE_STATES } from "../data/cubeStore.js";

// 24 Koordinat Monumen Isometrik Bertingkat
// (u = kolom, v = baris, w = tingkat ketinggian vertikal)
const MONUMENT_COORDINATES = [
  // Tier 0: Fondasi Utama (12 balok) - Q1 s.d. Q12
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

  // Tier 1: Struktur Menengah (7 balok) - Q13 s.d. Q19
  { qId: "Q13", u: 0.5, v: 0.5, w: 1 },
  { qId: "Q14", u: 1.5, v: 0.5, w: 1 },
  { qId: "Q15", u: 2.5, v: 0.5, w: 1 },
  { qId: "Q16", u: 0.5, v: 1.5, w: 1 },
  { qId: "Q17", u: 1.5, v: 1.5, w: 1 },
  { qId: "Q18", u: 2.5, v: 1.5, w: 1 },
  { qId: "Q19", u: 1.5, v: 1.0, w: 1 },

  // Tier 2: Struktur Atas (4 balok) - Q20 s.d. Q23
  { qId: "Q20", u: 1.0, v: 1.0, w: 2 },
  { qId: "Q21", u: 2.0, v: 1.0, w: 2 },
  { qId: "Q22", u: 1.0, v: 1.5, w: 2 },
  { qId: "Q23", u: 2.0, v: 1.5, w: 2 },

  // Tier 3: Mahkota / Capstone Apex (1 balok) - Q24
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

    this.width = 480;
    this.height = 360;
    this.hoveredCubeId = null;

    // Time counter for organic floating animation
    this.time = 0;

    // Active Drop Animations map: { qId: { yOffset, vy, bouncesLeft, squash, flash } }
    this.dropAnimations = {};

    // Impact shockwaves on landing: [ { x, y, radius, maxRadius, alpha, color } ]
    this.impactRipples = [];

    // Hover lifts for smooth spring transition
    this.hoverLifts = {};

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

  /**
   * Resize Anti-Drift:
   * Mengukur dimensi parent container secara stabil dan selalu mereset matriks transformasi.
   */
  resize() {
    if (!this.canvas) return;
    const box = this.canvas.parentElement;
    const rect = box ? box.getBoundingClientRect() : this.canvas.getBoundingClientRect();

    const w = (box && box.clientWidth > 0) ? box.clientWidth : (rect.width > 0 ? rect.width : (this.width || 480));
    const h = (box && box.clientHeight > 0) ? box.clientHeight : (rect.height > 0 ? rect.height : (this.height || 360));

    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.round(w);
    this.height = Math.round(h);

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);

    // Explicitly reset & set transform, preventing scale accumulation
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
   * Proyeksi isometrik terpusat (u, v, w) -> (x, y)
   */
  project(u, v, w, cubeSize = 34, cubeHeight = 27) {
    const angle = Math.PI / 6; // 30 derajat
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Titik pusat monumen di canvas (selalu stabil dan terpusat)
    const originX = this.width * 0.5;
    const originY = this.height * 0.56;

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
   * Animasi Jatuh dari Atas (Drop from Sky) saat soal selesai diisi
   */
  triggerDropAnimation(questionId) {
    this.dropAnimations[questionId] = {
      yOffset: -260,          // Mulai 260px di atas slot
      vy: 0,                  // Kecepatan awal
      gravity: 1.15,          // Gravitasi akselerasi
      bouncesLeft: 2,         // Jumlah pantulan
      bounceDamping: -0.38,   // Elastisitas pantulan
      squash: 1,              // Deformasi saat mendarat
      flash: 1.5              // Kilatan neon
    };
  }

  // Alias kompatibilitas
  triggerUnlockAnimation(questionId) {
    this.triggerDropAnimation(questionId);
  }

  /**
   * Main Render Method
   */
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Pastikan DPR transform selalu terisolasi
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    this.time += 0.035;

    // Skala responsif kubus
    const baseScale = Math.min(this.width / 480, this.height / 360);
    const cubeSize = Math.max(26, Math.min(36, 32 * baseScale));
    const cubeHeight = cubeSize * 0.8;

    // Update & gambar gelombang ripple di dasar monumen
    this.updateAndDrawRipples(ctx, cubeSize);

    // Gambar bayangan dasar monumen
    this.renderMonumentShadow(cubeSize);

    // Hitung posisi dan status untuk seluruh 24 kubus
    const renderList = MONUMENT_COORDINATES.map((coord, index) => {
      const cubeData = this.cubeStore.getCube(coord.qId) || { state: CUBE_STATES.LOCKED, questionId: coord.qId };
      const isLocked = cubeData.state === CUBE_STATES.LOCKED;
      const isHovered = this.hoveredCubeId === coord.qId;

      // 1. Smooth Spring Hover Lift
      if (this.hoverLifts[coord.qId] === undefined) this.hoverLifts[coord.qId] = 0;
      const targetHoverLift = isHovered ? 7 : 0;
      this.hoverLifts[coord.qId] += (targetHoverLift - this.hoverLifts[coord.qId]) * 0.22;

      // 2. Organic Idle Floating (agar kubus tidak kaku!)
      // Kubus yang sudah terbuka mengapung halus dengan fase gelombang alami
      const idleFloat = isLocked ? 0 : Math.sin(this.time * 1.8 + coord.u * 1.1 + coord.v * 0.9) * 1.8;

      // 3. Drop from Sky Physics Animation
      let dropY = 0;
      let scaleX = 1;
      let scaleY = 1;
      let flashStud = 0;

      const drop = this.dropAnimations[coord.qId];
      if (drop) {
        drop.vy += drop.gravity;
        drop.yOffset += drop.vy;

        // Trail partikel halus saat jatuh
        if (drop.yOffset < 0) {
          dropY = drop.yOffset;
          scaleY = Math.min(1.25, 1 + Math.abs(drop.vy) * 0.015);
          scaleX = 1 / scaleY;
        } else {
          // Benturan dengan slot kosong
          drop.yOffset = 0;
          dropY = 0;

          if (drop.bouncesLeft > 0) {
            drop.vy = drop.vy * drop.bounceDamping;
            drop.bouncesLeft--;
            drop.squash = 0.82; // Efek squash saat benturan

            // Buat gelombang ripple benturan
            const basePos = this.project(coord.u, coord.v, coord.w, cubeSize, cubeHeight);
            this.createImpactRipple(basePos.x, basePos.y + cubeHeight * 0.5, cubeSize);
          } else {
            // Selesai mendarat
            drop.squash += (1 - drop.squash) * 0.25;
            drop.flash = Math.max(0, drop.flash - 0.04);
            flashStud = drop.flash;

            if (Math.abs(1 - drop.squash) < 0.02 && drop.flash <= 0.05) {
              delete this.dropAnimations[coord.qId];
            }
          }

          scaleY = drop.squash;
          scaleX = 2 - drop.squash;
        }
      }

      const proj = this.project(coord.u, coord.v, coord.w, cubeSize, cubeHeight);
      proj.y -= (this.hoverLifts[coord.qId] + idleFloat - dropY);

      // Depth sorting metric (Painter's Algorithm)
      const depth = (coord.u + coord.v) * 10 + coord.w * 25 + (drop ? dropY * 0.01 : 0);

      return {
        ...coord,
        proj,
        cubeData,
        depth,
        isHovered,
        scaleX,
        scaleY,
        flashStud,
        index
      };
    });

    renderList.sort((a, b) => a.depth - b.depth);

    // Simpan polygon paths untuk hit-testing mouse
    this.renderedPolygons = [];

    // Gambar seluruh kubus dari belakang ke depan
    renderList.forEach((item) => {
      this.drawIsometricCube(item, cubeSize, cubeHeight);
    });
  }

  createImpactRipple(x, y, cubeSize) {
    this.impactRipples.push({
      x,
      y,
      radius: cubeSize * 0.4,
      maxRadius: cubeSize * 1.8,
      alpha: 0.8,
      color: this.themeColors.accent
    });
  }

  updateAndDrawRipples(ctx, cubeSize) {
    for (let i = this.impactRipples.length - 1; i >= 0; i--) {
      const r = this.impactRipples[i];
      r.radius += 2.2;
      r.alpha -= 0.035;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        this.impactRipples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0, r.alpha);
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderMonumentShadow(cubeSize) {
    const ctx = this.ctx;
    const originX = this.width * 0.5;
    const originY = this.height * 0.56 + cubeSize * 1.45;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(originX, originY, cubeSize * 4.4, cubeSize * 2.1, 0, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(originX, originY, 10, originX, originY, cubeSize * 4.4);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.4)");
    grad.addColorStop(0.65, "rgba(0, 0, 0, 0.12)");
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
    const { proj, cubeData, isHovered, scaleX, scaleY, flashStud } = item;
    const { x, y } = proj;

    const angle = Math.PI / 6;
    const dx = cubeSize * Math.cos(angle) * scaleX;
    const dy = cubeSize * Math.sin(angle) * scaleY;
    const h = cubeHeight * scaleY;

    // Titik-titik sudut kubus
    const topCenter = { x, y: y - dy };
    const topRight = { x: x + dx, y };
    const topBottom = { x, y: y + dy };
    const topLeft = { x: x - dx, y };

    const bottomCenter = { x, y: y + dy + h };
    const bottomRight = { x: x + dx, y: y + h };
    const bottomLeft = { x: x - dx, y: y + h };

    const state = cubeData.state;
    const isLocked = state === CUBE_STATES.LOCKED;

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

    // 4. TOP STUD / PEG (Ciri Khas Balok Koleksi)
    this.drawTopStud(ctx, x, y, dx, dy, styles, isLocked, flashStud);

    // 5. INNER GLOW / HIGHLIGHT
    if (!isLocked) {
      this.drawCubeGlow(ctx, x, y, dx, dy, styles, isHovered);
    }

    // 6. QUESTION NUMBER LABEL ON TOP FACE
    this.drawCubeLabel(ctx, x, y, item.qId, isLocked, isHovered);

    ctx.restore();

    // Simpan polygon boundaries untuk hit-testing mouse
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
   * Menggambar Stud Silinder Isometrik di Atas Kubus
   */
  drawTopStud(ctx, cx, cy, dx, dy, styles, isLocked, flashStud = 0) {
    const studRadiusX = dx * 0.36;
    const studRadiusY = dy * 0.36;
    const studHeight = dy * 0.45;
    const studCenterY = cy - studHeight * 0.5;

    ctx.save();

    // Stud Cylinder Wall
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

    // Stud Cap Top
    ctx.beginPath();
    ctx.ellipse(cx, studCenterY - studHeight, studRadiusX, studRadiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = styles.studTopFill;
    ctx.fill();
    ctx.strokeStyle = styles.stroke;
    ctx.lineWidth = isLocked ? 0.7 : 1;
    ctx.stroke();

    // Neon Stud Core Glow
    if (!isLocked) {
      ctx.beginPath();
      ctx.ellipse(cx, studCenterY - studHeight, studRadiusX * 0.5, studRadiusY * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    // Flash burst saat mendarat
    if (flashStud > 0) {
      ctx.beginPath();
      ctx.ellipse(cx, studCenterY - studHeight, studRadiusX * (1 + flashStud), studRadiusY * (1 + flashStud), 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, flashStud * 0.8)})`;
      ctx.shadowColor = styles.glowColor || "#ffffff";
      ctx.shadowBlur = 24 * flashStud;
      ctx.fill();
    }

    ctx.restore();
  }

  drawCubeGlow(ctx, x, y, dx, dy, styles, isHovered) {
    if (!styles.glowColor) return;
    ctx.save();
    ctx.shadowColor = styles.glowColor;
    ctx.shadowBlur = isHovered ? 24 : (styles.glowBlur || 14);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
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
      ctx.fillStyle = isHovered ? "#ffffff" : "rgba(255, 255, 255, 0.88)";
    }

    ctx.fillText(qId, x, y + 1);
    ctx.restore();
  }

  /**
   * Palet Warna & Visual Token Setiap Status Kubus
   */
  getCubeFaceStyles(state, isHovered) {
    const accent = this.themeColors.accent;
    const glow = this.themeColors.accentGlow;

    switch (state) {
      case CUBE_STATES.LOCKED:
        // Siluet Wireframe Transparan (Completion Pull!)
        return {
          topFill: isHovered ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.03)",
          leftFill: isHovered ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.25)",
          rightFill: isHovered ? "rgba(15, 23, 42, 0.5)" : "rgba(15, 23, 42, 0.35)",
          stroke: isHovered ? "rgba(148, 163, 184, 0.45)" : "rgba(148, 163, 184, 0.18)",
          strokeWidth: isHovered ? 1.2 : 0.8,
          studTopFill: "rgba(148, 163, 184, 0.08)",
          studSideFill: "rgba(15, 23, 42, 0.3)"
        };

      case CUBE_STATES.DIAGNOSED_E0:
        // Akurat (E0): Kaca Transparan Neon Biru/Putih
        return {
          topFill: isHovered ? "rgba(255, 255, 255, 0.98)" : "rgba(240, 246, 255, 0.9)",
          leftFill: "rgba(30, 58, 138, 0.78)",
          rightFill: "rgba(15, 23, 42, 0.88)",
          stroke: "rgba(255, 255, 255, 0.85)",
          strokeWidth: 1.5,
          studTopFill: "#ffffff",
          studSideFill: "rgba(255, 255, 255, 0.75)",
          glowColor: glow,
          glowBlur: isHovered ? 22 : 14
        };

      case CUBE_STATES.DIAGNOSED_ERROR:
        // Terdeteksi Error: Tetap Didapat! Amber Hangat (Bukan Hukuman)
        return {
          topFill: isHovered ? "rgba(254, 243, 199, 0.95)" : "rgba(253, 230, 138, 0.85)",
          leftFill: "rgba(180, 83, 9, 0.78)",
          rightFill: "rgba(120, 53, 15, 0.88)",
          stroke: "rgba(252, 211, 77, 0.85)",
          strokeWidth: 1.5,
          studTopFill: "#fef3c7",
          studSideFill: "#f59e0b",
          glowColor: "rgba(245, 158, 11, 0.65)",
          glowBlur: isHovered ? 20 : 12
        };

      case CUBE_STATES.REMEDIATED:
        // Selesai Remediasi: Crystal Teal Shimmer
        return {
          topFill: isHovered ? "rgba(204, 251, 241, 0.98)" : "rgba(153, 246, 228, 0.88)",
          leftFill: "rgba(13, 148, 136, 0.78)",
          rightFill: "rgba(17, 94, 89, 0.88)",
          stroke: "rgba(45, 212, 191, 0.85)",
          strokeWidth: 1.5,
          studTopFill: "#ffffff",
          studSideFill: "#14b8a6",
          glowColor: "rgba(20, 184, 166, 0.65)",
          glowBlur: isHovered ? 24 : 14
        };

      case CUBE_STATES.VERIFIED:
        // Sempurna: Diamond Crystal Radian
        return {
          topFill: "#ffffff",
          leftFill: "rgba(79, 70, 229, 0.82)",
          rightFill: "rgba(49, 46, 129, 0.92)",
          stroke: "#ffffff",
          strokeWidth: 1.8,
          studTopFill: "#ffffff",
          studSideFill: "#818cf8",
          glowColor: "rgba(129, 140, 248, 0.85)",
          glowBlur: isHovered ? 28 : 18
        };

      default:
        return this.getCubeFaceStyles(CUBE_STATES.LOCKED, isHovered);
    }
  }

  hitTest(x, y) {
    if (!this.renderedPolygons) return null;
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

  triggerMasteryCelebration() {
    let step = 0;
    const interval = setInterval(() => {
      if (step < MONUMENT_COORDINATES.length) {
        this.triggerDropAnimation(MONUMENT_COORDINATES[step].qId);
        step++;
      } else {
        clearInterval(interval);
      }
    }, 90);
  }
}
