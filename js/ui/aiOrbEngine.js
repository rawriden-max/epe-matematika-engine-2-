/**
 * aiOrbEngine.js - Ultra-Reliable 3D Holographic AI Orb Engine (EPE V2)
 * 
 * Merender Objek 3D Bola AI Futuristik Interaktif (Canvas 3D Procedural Engine):
 * - 100% Self-Contained: Tanpa ketergantungan CDN eksternal, berjalan 100% offline & instan
 * - True 3D Occlusion: Cincin orbit gyroscopic melingkari bola dengan depth sorting nyata (belakang & depan)
 * - Orbit Selalu Tampak Nyata & Berkicau: Cincin orbit ganda selalu berputar dan berpendar
 * - Interaksi Klik & Sentuh: Memunculkan gelombang energi (Orbit Burst Flare) & rotasi dipercepat
 * - Satelit Energi Orbit: Manik-manik cahaya meluncur di sepanjang cincin orbital
 * - Responsif terhadap Tema Warna (Blue, Violet, Emerald, Amber, Rose, Cyan)
 * - Status Emosi: 'idle', 'thinking', 'speaking', 'celebrate'
 */

function hexToRgb(hex) {
  if (!hex) return { r: 59, g: 130, b: 246 };
  let c = hex.toString().replace("#", "").trim();
  if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 59, g: 130, b: 246 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export class AiOrbEngine {
  constructor({ containerId, initialColor = "#3b82f6", onClick = null }) {
    this.container = document.getElementById(containerId);
    this.color = initialColor;
    this.onClick = onClick;

    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // 3D Rotation angles & dynamics
    this.rotX = 0.22;
    this.rotY = 0;
    this.targetRotX = 0.22;
    this.targetRotY = 0;
    this.spinSpeed = 0.018;

    // Interactive Drag & Pointer Tracking
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.pointerNormalized = { x: 0.2, y: -0.3 };

    // State & Dynamics
    this.state = "idle"; // 'idle' | 'thinking' | 'speaking' | 'celebrate'
    this.pulseTime = 0;
    this.burstEnergy = 0.0; // 0 to 1, decays on click

    // 3D Particles
    this.particles = [];
    this.initParticles(36);

    // Floating 3D Math Formulas (Rumus MTK) - Orbiting around Saturn Planet & Rings
    this.mathFormulas = [
      { text: "Δ = b² - 4ac", angle: 0.2, tilt: 0.32, color: "#fbbf24", speed: 0.009, dist: 2.65 },
      { text: "x = (-b ± √D)/2a", angle: 1.6, tilt: -0.38, color: "#34d399", speed: 0.011, dist: 2.75 },
      { text: "f(x) = ax²+bx+c", angle: 2.9, tilt: 0.44, color: "#f59e0b", speed: 0.008, dist: 2.58 },
      { text: "[a  b | c  d]", angle: 4.1, tilt: -0.28, color: "#38bdf8", speed: 0.010, dist: 2.68 },
      { text: "Av = λv", angle: 5.2, tilt: 0.36, color: "#c084fc", speed: 0.012, dist: 2.60 },
      { text: "∫ f(x)dx", angle: 2.2, tilt: -0.45, color: "#f472b6", speed: 0.009, dist: 2.72 },
      { text: "D > 0 (Akar Real)", angle: 3.6, tilt: 0.22, color: "#fb923c", speed: 0.010, dist: 2.80 }
    ];

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.canvas.style.cursor = "grab";
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", "3D Holographic AI Orb Companion Orbita");
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");
    this.resize();

    if (typeof window !== "undefined" && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    }

    this.bindInteractions();
    this.animate();
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const dist = 1.3 + Math.random() * 0.7;
      this.particles.push({
        x: dist * Math.sqrt(1 - u * u) * Math.cos(theta),
        y: dist * u,
        z: dist * Math.sqrt(1 - u * u) * Math.sin(theta),
        size: 1.2 + Math.random() * 2.2,
        speed: 0.012 + Math.random() * 0.02,
        twinkleOffset: Math.random() * Math.PI * 2
      });
    }
  }

  setColor(hexColor) {
    if (hexColor) this.color = hexColor;
  }

  setState(state) {
    this.state = state;
    if (state === "celebrate" || state === "thinking") {
      this.triggerOrbitBurst();
    }
  }

  triggerOrbitBurst() {
    this.burstEnergy = 1.0;
  }

  onResize() {
    this.resize();
  }

  resumeAndResize() {
    if (!Number.isFinite(this.rotX)) this.rotX = 0.22;
    if (!Number.isFinite(this.rotY)) this.rotY = 0;
    this.resize();
    this.triggerOrbitBurst();
    if (!this.animId) {
      this.animate();
    }
  }

  resize() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Only update dimensions if container is visibly rendered with valid width/height
    if (rect.width > 30 && rect.height > 30) {
      this.width = rect.width;
      this.height = rect.height;
    } else {
      this.width = this.container.clientWidth || 300;
      this.height = this.container.clientHeight || 185;
      if (this.width < 50) this.width = 300;
      if (this.height < 50) this.height = 185;
    }

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  bindInteractions() {
    const canvas = this.canvas;
    if (!canvas) return;

    const onPointerMove = (e) => {
      // Guard: Do not process pointer when canvas container is hidden in another tab
      if (this.container && this.container.offsetParent === null) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect || rect.width < 20 || rect.height < 20) return;

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (this.isDragging) {
        const deltaX = clientX - this.lastPointer.x;
        const deltaY = clientY - this.lastPointer.y;
        if (Number.isFinite(deltaX) && Number.isFinite(deltaY)) {
          this.targetRotY += deltaX * 0.018;
          this.targetRotX += deltaY * 0.018;
          this.lastPointer = { x: clientX, y: clientY };
        }
      } else {
        const nx = Math.max(-1, Math.min(1, ((clientX - rect.left) / rect.width) * 2 - 1));
        const ny = Math.max(-1, Math.min(1, ((clientY - rect.top) / rect.height) * 2 - 1));
        if (Number.isFinite(nx) && Number.isFinite(ny)) {
          this.pointerNormalized = { x: nx, y: ny };
          this.targetRotY = nx * 0.65;
          this.targetRotX = -ny * 0.45;
        }
      }
    };

    const onPointerDown = (e) => {
      this.isDragging = true;
      canvas.style.cursor = "grabbing";
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.lastPointer = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        canvas.style.cursor = "grab";
      }
    };

    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    canvas.addEventListener("click", () => {
      this.triggerOrbitBurst();
      if (this.onClick) this.onClick();
    });

    window.addEventListener("resize", () => this.resize());
  }

  project3D(x, y, z, baseRadius, cx, cy) {
    // 3D Matrix Rotation Y then X
    const cosY = Math.cos(this.rotY);
    const sinY = Math.sin(this.rotY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    const cosX = Math.cos(this.rotX);
    const sinX = Math.sin(this.rotX);
    const y1 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    const fov = 3.6;
    const scale = fov / (fov + z2);
    return {
      x: cx + x1 * baseRadius * scale,
      y: cy + y1 * baseRadius * scale,
      z: z2,
      scale: scale
    };
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    if (!this.ctx) return;

    if (!this.width || this.width < 30 || !this.height || this.height < 30) {
      this.resize();
    }
    if (!this.width || !this.height) return;

    try {
      // Throttle rendering saat mode anti-lag aktif
      if (window.__EPE_LOW_PERF__) {
        this._perfFrame = (this._perfFrame || 0) + 1;
        if (this._perfFrame % 2 !== 0) return; // Skip tiap frame kedua (render di ~30fps)
      }

    // Auto-recover defensive check against any NaN corruption
    if (!Number.isFinite(this.rotX)) this.rotX = 0.22;
    if (!Number.isFinite(this.rotY)) this.rotY = 0;
    if (!Number.isFinite(this.targetRotX)) this.targetRotX = 0.22;
    if (!Number.isFinite(this.targetRotY)) this.targetRotY = 0;

    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    // Base radius sized so Saturn's planetary rings (~2.3x) & formulas (~2.7x) fit comfortably
    const baseRadius = Math.min(this.width, this.height) * 0.19;

    // Time & dynamics
    const speedBoost = 1.0 + this.burstEnergy * 2.5;
    this.pulseTime += 0.038 * speedBoost;

    // Decay burst energy smoothly
    if (this.burstEnergy > 0.005) {
      this.burstEnergy *= 0.94;
    } else {
      this.burstEnergy = 0;
    }

    // Continuous spin + smooth pointer head tracking
    if (!this.isDragging) {
      let speed = this.spinSpeed * speedBoost;
      if (this.state === "thinking") speed *= 2.2;
      this.rotY += speed;
      this.rotX += (this.targetRotX - this.rotX) * 0.08;
    } else {
      this.rotY += (this.targetRotY - this.rotY) * 0.18;
      this.rotX += (this.targetRotX - this.rotX) * 0.18;
    }

    // Dynamic Scale for Emotion Pulse
    let pulseScale = 1.0;
    if (this.state === "thinking") {
      pulseScale = 1.0 + Math.sin(this.pulseTime * 5) * 0.07;
    } else if (this.state === "speaking") {
      pulseScale = 1.0 + Math.sin(this.pulseTime * 7) * 0.06 * (0.8 + Math.random() * 0.4);
    } else if (this.state === "celebrate") {
      pulseScale = 1.08 + Math.abs(Math.sin(this.pulseTime * 4)) * 0.12;
    } else {
      pulseScale = 1.0 + Math.sin(this.pulseTime * 1.5) * 0.03 + this.burstEnergy * 0.12;
    }

    const currentCoreRadius = baseRadius * pulseScale;

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // =========================================================================
    // 0. FLOATING 3D MATH FORMULAS (RUMUS MTK) - CIRCLE AROUND SATURN
    // =========================================================================
    const projectedFormulas = [];
    if (this.mathFormulas && this.mathFormulas.length > 0) {
      this.mathFormulas.forEach((f) => {
        f.angle += f.speed * speedBoost;
        const rx = f.dist * Math.cos(f.angle);
        const rz = f.dist * Math.sin(f.angle);
        const ry = rx * Math.sin(f.tilt) + rz * Math.cos(f.tilt);
        const p = this.project3D(rx, ry, rz, currentCoreRadius, cx, cy);
        projectedFormulas.push({
          p,
          text: f.text,
          color: f.color,
          z: p.z
        });
      });
    }

    // Helper to draw a math formula badge
    const drawMathFormula = (f) => {
      ctx.save();
      ctx.translate(f.p.x, f.p.y);
      const s = Math.max(0.65, Math.min(1.25, f.p.scale));
      ctx.scale(s, s);

      ctx.font = "bold 9.5px 'JetBrains Mono', monospace";
      const metrics = ctx.measureText(f.text);
      const textWidth = metrics.width;
      const padX = 7;
      const pillW = textWidth + padX * 2;
      const pillH = 18;

      const isFront = f.z < 0;
      const alpha = isFront ? 0.95 : 0.45;

      if (isFront) {
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 8;
      }

      // Pill Background
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 9);
      } else {
        ctx.rect(-pillW / 2, -pillH / 2, pillW, pillH);
      }
      ctx.fillStyle = isFront ? "rgba(35, 22, 14, 0.94)" : "rgba(22, 14, 9, 0.65)";
      ctx.fill();

      // Pill Border
      ctx.strokeStyle = isFront ? f.color : rgba(f.color, 0.35);
      ctx.lineWidth = isFront ? 1.2 : 0.75;
      ctx.stroke();

      // Math Text
      ctx.fillStyle = isFront ? "#ffffff" : rgba(f.color, alpha);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.text, 0, 0);

      ctx.restore();
    };

    // =========================================================================
    // 1. DRAW BACK PARTICLES & BACK MATH FORMULAS (z >= 0)
    // =========================================================================
    this.particles.forEach((pt) => {
      const p = this.project3D(pt.x, pt.y, pt.z, currentCoreRadius, cx, cy);
      if (p.z >= 0) {
        const twinkle = 0.35 + 0.3 * Math.sin(this.pulseTime * 3 + pt.twinkleOffset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pt.size * p.scale * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = rgba("#fde68a", twinkle);
        ctx.fill();
      }
    });

    projectedFormulas.filter((f) => f.z >= 0).forEach(drawMathFormula);

    // =========================================================================
    // 2. SATURN PLANETARY RINGS - 3D GEOMETRY HELPER
    // =========================================================================
    // Ring tilt relative to planet equator (Saturn's natural ~26.7 deg tilt)
    const ringTilt = -0.46; // ~ -26.5 degrees
    const sinT = Math.sin(ringTilt);
    const cosT = Math.cos(ringTilt);

    // Helper to get projected 3D coordinates for a point on Saturn's ring
    const getRingPoint = (rMult, theta) => {
      // Point on tilted ring disk
      const rx = rMult * Math.cos(theta);
      const rz = rMult * Math.sin(theta) * cosT;
      const ry = rMult * Math.sin(theta) * sinT;
      return this.project3D(rx, ry, rz, currentCoreRadius, cx, cy);
    };

    // Function to render either the back half (isFront=false) or front half (isFront=true) of Saturn's rings
    const drawSaturnRings = (isFront) => {
      ctx.save();
      const numSteps = 84;
      const step = (Math.PI * 2) / numSteps;

      // Define Saturn Ring Zones: [InnerRadius, OuterRadius, BaseAlpha, ColorA, ColorB]
      const ringZones = [
        // Ring C (Faint crepe ring starting close to planet)
        { rIn: 1.15, rOut: 1.42, alpha: 0.35, color: "rgba(253, 230, 138, " },
        // Ring B (Bright dense main golden amber ring)
        { rIn: 1.45, rOut: 1.88, alpha: 0.86, color: "rgba(251, 191, 36, " },
        // Cassini Division (Dark gap between B and A) - skipped [1.88 - 1.94]
        // Ring A (Outer luminous amber ring)
        { rIn: 1.94, rOut: 2.32, alpha: 0.72, color: "rgba(245, 158, 11, " },
        // Encke/Outer Ribbon Faint Veil
        { rIn: 2.34, rOut: 2.45, alpha: 0.28, color: "rgba(217, 119, 6, " }
      ];

      ringZones.forEach((zone) => {
        // Build quadrilateral ring segments
        for (let i = 0; i < numSteps; i++) {
          const theta1 = i * step;
          const theta2 = (i + 1) * step;

          // In our projection, z < 0 is closer to camera (FRONT), z >= 0 is further away (BACK)
          const pMid = getRingPoint((zone.rIn + zone.rOut) * 0.5, (theta1 + theta2) * 0.5);
          const segmentIsFront = pMid.z < 0;

          if (segmentIsFront !== isFront) continue;

          const p1 = getRingPoint(zone.rIn, theta1);
          const p2 = getRingPoint(zone.rOut, theta1);
          const p3 = getRingPoint(zone.rOut, theta2);
          const p4 = getRingPoint(zone.rIn, theta2);

          const depthScale = Math.max(0.5, Math.min(1.2, pMid.scale));
          let effectiveAlpha = zone.alpha * (isFront ? 1.05 : 0.65) * (0.8 + 0.2 * depthScale);

          // Planetary shadow cast onto back rings
          if (!isFront) {
            const dxFromCenter = Math.abs(pMid.x - cx);
            if (dxFromCenter < currentCoreRadius * 0.85 && pMid.y < cy) {
              effectiveAlpha *= 0.25; // In shadow of planet body
            }
          }

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          ctx.fillStyle = `${zone.color}${Math.min(1, effectiveAlpha)})`;
          ctx.fill();

          // Subtle fine ringlet striation lines
          if (i % 2 === 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.6, effectiveAlpha * 0.4)})`;
            ctx.lineWidth = isFront ? 0.75 : 0.4;
            ctx.stroke();
          }
        }
      });

      // Luminous Satellite Beads gliding along the rings
      const beadSpeed = this.pulseTime * 0.8;
      const beadTracks = [
        { r: 1.65, count: 3, color: "#ffffff", size: 2.2 },
        { r: 2.12, count: 4, color: "#fef08a", size: 1.8 }
      ];

      beadTracks.forEach((track) => {
        for (let b = 0; b < track.count; b++) {
          const bAngle = beadSpeed + (b * Math.PI * 2) / track.count;
          const bp = getRingPoint(track.r, bAngle);
          if ((bp.z < 0) === isFront) {
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, track.size * bp.scale, 0, Math.PI * 2);
            ctx.fillStyle = track.color;
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = isFront ? 8 : 3;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      ctx.restore();
    };

    // =========================================================================
    // 3. DRAW BACK HALF OF SATURN'S RINGS (z >= 0)
    // =========================================================================
    drawSaturnRings(false);

    // =========================================================================
    // 4. DRAW CENTRAL SATURN PLANETARY SPHERE (HIGH-CONTRAST 3D SPHERE)
    // =========================================================================
    ctx.save();

    // 4a. Ambient Atmospheric Outer Corona Glow (Warm Golden Celestial Aurora)
    const glowRad = currentCoreRadius * (1.32 + this.burstEnergy * 0.45);
    const atmoGlow = ctx.createRadialGradient(cx, cy, currentCoreRadius * 0.6, cx, cy, glowRad);
    atmoGlow.addColorStop(0, "rgba(251, 191, 36, 0.38)");
    atmoGlow.addColorStop(0.5, "rgba(245, 158, 11, 0.18)");
    atmoGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = atmoGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRad, 0, Math.PI * 2);
    ctx.fill();

    // 4b. 3D Planet Sphere Body with Dynamic Pointer Light Angle (Warm Golden Saturnian Body)
    const lightX = cx - currentCoreRadius * 0.32 + (this.pointerNormalized?.x || 0.2) * 12;
    const lightY = cy - currentCoreRadius * 0.35 + (this.pointerNormalized?.y || -0.3) * 12;
    const sphereGrad = ctx.createRadialGradient(lightX, lightY, currentCoreRadius * 0.08, cx, cy, currentCoreRadius);
    sphereGrad.addColorStop(0, "#ffffff");
    sphereGrad.addColorStop(0.15, "#fef08a");
    sphereGrad.addColorStop(0.42, "#f59e0b");
    sphereGrad.addColorStop(0.75, "#d97706");
    sphereGrad.addColorStop(0.92, "#78350f");
    sphereGrad.addColorStop(1, "#451a03");

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, currentCoreRadius, 0, Math.PI * 2);
    ctx.fill();

    // 4c. Saturn Atmospheric Cloud Bands / Striations (Warm Caramel & Cream Latitudinal Bands)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, currentCoreRadius, 0, Math.PI * 2);
    ctx.clip();

    const numBands = 8;
    for (let i = 0; i < numBands; i++) {
      const bandY = cy + ((i - 3.5) / 4.0) * currentCoreRadius * 0.92;
      const bandH = currentCoreRadius * 0.16;
      const bandAlpha = 0.09 + Math.sin(i * 1.8 + this.pulseTime * 0.5) * 0.04;
      ctx.fillStyle = i % 2 === 0 ? `rgba(254, 240, 138, ${bandAlpha * 1.3})` : `rgba(120, 53, 15, ${bandAlpha * 1.5})`;
      ctx.fillRect(cx - currentCoreRadius, bandY - bandH / 2, currentCoreRadius * 2, bandH);
    }

    // 4d. Inner Rim Lighting (Golden Luminous Edge)
    const rimGrad = ctx.createRadialGradient(cx, cy, currentCoreRadius * 0.82, cx, cy, currentCoreRadius);
    rimGrad.addColorStop(0, "rgba(251, 191, 36, 0)");
    rimGrad.addColorStop(1, "rgba(254, 240, 138, 0.72)");
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, currentCoreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4e. Specular Highlight Pinpoint (High-contrast gloss)
    const specX = lightX - currentCoreRadius * 0.08;
    const specY = lightY - currentCoreRadius * 0.08;
    const specGrad = ctx.createRadialGradient(specX, specY, 0, specX, specY, currentCoreRadius * 0.32);
    specGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    specGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.3)");
    specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(specX, specY, currentCoreRadius * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // =========================================================================
    // 5. DRAW FRONT HALF OF SATURN'S RINGS (z < 0 - IN FRONT OF PLANET)
    // =========================================================================
    drawSaturnRings(true);

    // =========================================================================
    // 6. BURST SHOCKWAVE FLARE (ON CLICK)
    // =========================================================================
    if (this.burstEnergy > 0.05) {
      const burstRadius = currentCoreRadius * (1.2 + (1.0 - this.burstEnergy) * 2.2);
      ctx.beginPath();
      ctx.arc(cx, cy, burstRadius, 0, Math.PI * 2);
      ctx.strokeStyle = rgba("#f59e0b", this.burstEnergy * 0.85);
      ctx.lineWidth = 2.5 * this.burstEnergy;
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // =========================================================================
    // 7. DRAW FRONT MATH FORMULAS (z < 0)
    // =========================================================================
    projectedFormulas.filter((f) => f.z < 0).forEach(drawMathFormula);

    // Front Sparkling Star Particles (z < 0)
    this.particles.forEach((pt) => {
      const p = this.project3D(pt.x, pt.y, pt.z, currentCoreRadius, cx, cy);
      if (p.z < 0) {
        const twinkle = 0.6 + 0.4 * Math.sin(this.pulseTime * 3 + pt.twinkleOffset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pt.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = rgba("#fde68a", twinkle);
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    } catch (err) {
      console.warn("AiOrbEngine animate loop catch:", err);
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
