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

    this.init();
  }

  init() {
    if (!this.container) return;

    this.container.innerHTML = "";
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.display = "block";
    this.canvas.style.cursor = "grab";
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", "3D Holographic AI Orb Companion Orbita");
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d");
    this.resize();

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
  }

  resize() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Only update dimensions if container is visibly rendered with valid width/height
    if (rect.width > 20 && rect.height > 20) {
      this.width = rect.width;
      this.height = rect.height;
    } else if (!this.width || !this.height) {
      this.width = 260;
      this.height = 220;
    }

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    if (!this.ctx || !this.width || !this.height) return;

    // Auto-recover defensive check against any NaN corruption
    if (!Number.isFinite(this.rotX)) this.rotX = 0.22;
    if (!Number.isFinite(this.rotY)) this.rotY = 0;
    if (!Number.isFinite(this.targetRotX)) this.targetRotX = 0.22;
    if (!Number.isFinite(this.targetRotY)) this.targetRotY = 0;

    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    // Base radius sized so orbital rings (1.5x) fit comfortably with glowing margins
    const baseRadius = Math.min(this.width, this.height) * 0.24;

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
    // 0. CLICK BURST SHOCKWAVE EXPANSION
    // =========================================================================
    if (this.burstEnergy > 0.05) {
      const burstRadius = currentCoreRadius * (1.2 + (1.0 - this.burstEnergy) * 1.8);
      ctx.beginPath();
      ctx.arc(cx, cy, burstRadius, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(this.color, this.burstEnergy * 0.7);
      ctx.lineWidth = 2.5 * this.burstEnergy;
      ctx.stroke();
    }

    // =========================================================================
    // 1. GENERATE ORBITAL RINGS 3D POINTS
    // =========================================================================
    const generateRingSegments = (radiusMult, tiltX, tiltY, spinOffset, ringColor, nodeSpeed = 0) => {
      const segments = [];
      const count = 36;
      const pts = [];

      for (let i = 0; i <= count; i++) {
        const angle = (i / count) * Math.PI * 2 + spinOffset;
        const rx = radiusMult * Math.cos(angle);
        const rz = radiusMult * Math.sin(angle);
        const ry = rx * Math.sin(tiltX) + rz * Math.sin(tiltY);

        const p = this.project3D(rx, ry, rz, currentCoreRadius, cx, cy);
        pts.push(p);
      }

      // Satellite node location
      const satAngle = this.pulseTime * (nodeSpeed || 1.2);
      const satRx = radiusMult * Math.cos(satAngle);
      const satRz = radiusMult * Math.sin(satAngle);
      const satRy = satRx * Math.sin(tiltX) + satRz * Math.sin(tiltY);
      const satPoint = this.project3D(satRx, satRy, satRz, currentCoreRadius, cx, cy);

      for (let i = 0; i < count; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const avgZ = (p1.z + p2.z) * 0.5;
        segments.push({
          p1,
          p2,
          avgZ,
          ringColor
        });
      }

      return { segments, satPoint, ringColor };
    };

    // Ring 1: Primary Gyroscopic Ring (Tilted 45deg, spins forward)
    const ring1 = generateRingSegments(1.48, 0.75, 0.25, this.pulseTime * 0.85, this.color, 1.4);
    // Ring 2: Secondary Gyroscopic Ring (Tilted -60deg, icy white/silver, spins backward)
    const ring2 = generateRingSegments(1.68, -0.9, 0.45, -this.pulseTime * 1.05, "#ffffff", -1.8);
    // Ring 3: Equatorial Horizontal Gyro Ring (Tilted 15deg)
    const ring3 = generateRingSegments(1.35, 0.2, -0.7, this.pulseTime * 0.6, this.color, 0.9);

    const allSegments = [...ring1.segments, ...ring2.segments, ...ring3.segments];
    const satellites = [ring1.satPoint, ring2.satPoint, ring3.satPoint];

    // Helper to draw a ring segment
    const drawSegment = (seg, isFront) => {
      ctx.beginPath();
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);

      if (isFront) {
        ctx.strokeStyle = rgba(seg.ringColor, 0.95);
        ctx.lineWidth = 2.4 + this.burstEnergy * 1.5;
        ctx.shadowColor = seg.ringColor;
        ctx.shadowBlur = 8 + this.burstEnergy * 10;
      } else {
        ctx.strokeStyle = rgba(seg.ringColor, 0.25);
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // =========================================================================
    // 2. PHASE A: DRAW BACK-HALF OF RINGS (z < 0) BEHIND SPHERE
    // =========================================================================
    allSegments.filter((s) => s.avgZ < 0).forEach((seg) => drawSegment(seg, false));

    // Satellites in the back
    satellites.filter((s) => s.z < 0).forEach((sat) => {
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, 2.5 * sat.scale, 0, Math.PI * 2);
      ctx.fillStyle = rgba(this.color, 0.4);
      ctx.fill();
    });

    // Back particles (z < 0)
    this.particles.forEach((pt) => {
      // Rotate around Y
      const cosP = Math.cos(pt.speed);
      const sinP = Math.sin(pt.speed);
      const px = pt.x * cosP - pt.z * sinP;
      const pz = pt.x * sinP + pt.z * cosP;
      pt.x = px;
      pt.z = pz;

      const p = this.project3D(pt.x, pt.y, pt.z, currentCoreRadius, cx, cy);
      if (p.z < 0) {
        const twinkle = 0.3 + 0.3 * Math.sin(this.pulseTime * 2 + pt.twinkleOffset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pt.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = rgba(this.color, twinkle);
        ctx.fill();
      }
    });

    // =========================================================================
    // 3. PHASE B: DRAW CENTRAL 3D HOLOGRAPHIC ENERGY SPHERE
    // =========================================================================

    // Atmosphere Ambient Glow
    const haloRadius = currentCoreRadius * (1.7 + this.burstEnergy * 0.4);
    const glowGrad = ctx.createRadialGradient(cx, cy, currentCoreRadius * 0.2, cx, cy, haloRadius);
    glowGrad.addColorStop(0, rgba(this.color, 0.45 + this.burstEnergy * 0.35));
    glowGrad.addColorStop(0.45, rgba(this.color, 0.16));
    glowGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3D Specular Light Position (tracks pointer slightly)
    const specOffsetX = this.pointerNormalized.x * (currentCoreRadius * 0.25) - currentCoreRadius * 0.32;
    const specOffsetY = this.pointerNormalized.y * (currentCoreRadius * 0.25) - currentCoreRadius * 0.32;

    const coreGrad = ctx.createRadialGradient(
      cx + specOffsetX,
      cy + specOffsetY,
      currentCoreRadius * 0.06,
      cx,
      cy,
      currentCoreRadius
    );
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.2, rgba(this.color, 0.95));
    coreGrad.addColorStop(0.65, rgba(this.color, 0.35));
    coreGrad.addColorStop(0.92, "#0f172a");
    coreGrad.addColorStop(1, "#020617");

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, currentCoreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Spherical Fresnel Rim Glow
    ctx.strokeStyle = rgba(this.color, 0.85 + this.burstEnergy * 0.15);
    ctx.lineWidth = 2.0;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12 + this.burstEnergy * 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3D Geodesic Latitude Lines on the Sphere Surface
    const ringSegments = 16;
    [-0.55, 0, 0.55].forEach((lat) => {
      const rLat = Math.cos(lat * Math.PI * 0.5);
      const yLat = Math.sin(lat * Math.PI * 0.5);

      ctx.beginPath();
      let first = true;
      for (let i = 0; i <= ringSegments; i++) {
        const theta = (i / ringSegments) * Math.PI * 2;
        const x = rLat * Math.cos(theta);
        const z = rLat * Math.sin(theta);
        const p = this.project3D(x, yLat, z, currentCoreRadius * 0.98, cx, cy);

        // Only draw surface points facing camera (p.z >= -0.15)
        if (p.z >= -0.15) {
          if (first) {
            ctx.moveTo(p.x, p.y);
            first = false;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        } else {
          first = true;
        }
      }
      ctx.strokeStyle = rgba(this.color, 0.38 + this.burstEnergy * 0.3);
      ctx.lineWidth = 1.1;
      ctx.stroke();
    });

    // Center Core Iris Hologram
    ctx.beginPath();
    ctx.arc(cx, cy, currentCoreRadius * 0.38, 0, Math.PI * 2);
    ctx.strokeStyle = rgba("#ffffff", 0.5 + Math.sin(this.pulseTime * 3) * 0.25);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // =========================================================================
    // 4. PHASE C: DRAW FRONT-HALF OF RINGS (z >= 0) IN FRONT OF SPHERE
    // =========================================================================
    allSegments.filter((s) => s.avgZ >= 0).forEach((seg) => drawSegment(seg, true));

    // Satellites in the front (bright glowing energy beads)
    satellites.filter((s) => s.z >= 0).forEach((sat) => {
      // Glow halo around bead
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, 6.5 * sat.scale, 0, Math.PI * 2);
      ctx.fillStyle = rgba(this.color, 0.4);
      ctx.fill();

      // Sharp white-hot center bead
      ctx.beginPath();
      ctx.arc(sat.x, sat.y, 3.2 * sat.scale, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Front particles (z >= 0)
    this.particles.forEach((pt) => {
      const p = this.project3D(pt.x, pt.y, pt.z, currentCoreRadius, cx, cy);
      if (p.z >= 0) {
        const twinkle = 0.6 + 0.4 * Math.sin(this.pulseTime * 3 + pt.twinkleOffset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pt.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = rgba(this.color, twinkle);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
