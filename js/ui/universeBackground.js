/**
 * universeBackground.js - Futuristic Interactive Cosmic Universe Engine (EPE V2)
 * 
 * Fitur:
 * - 3 Layer Partikel Kosmik: Bintang latar jauh (mikro), bintang orbit menengah (berkedip lembut), dan bintang terang berhalo
 * - Interaktivitas Kursor Mouse:
 *   - Garis rasi bintang kosmik (Constellation Vectors) yang dinamis menghubungkan kursor ke bintang-bintang di dekatnya
 *   - Efek gravitasi mikro halus (stars subtly drift & pull towards cursor with spring easing)
 *   - Jejak stardust halus saat kursor bergerak
 * - Dual Mode Adaptif:
 *   - Dark Mode: Langit malam antariksa dalam dengan pendaran nebula biru safir dan bintang bercahaya
 *   - Light Mode: Celestial Star-Chart / Atlas Rasi Bintang modern dengan aksen biru elegan berlatar bersih
 * - Performa Tinggi 60 FPS: Menggunakan requestAnimationFrame, pointer-events none, spatial neighbor pruning, dan Page Visibility API
 */

export class UniverseBackground {
  constructor({ canvasId = "universe-canvas" } = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = canvasId;
      this.canvas.className = "universe-background-canvas";
      document.body.prepend(this.canvas);
    }

    this.ctx = this.canvas.getContext("2d", { alpha: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse / Cursor Tracking
    this.mouse = {
      x: this.width * 0.5,
      y: this.height * 0.35,
      targetX: this.width * 0.5,
      targetY: this.height * 0.35,
      radius: 160,
      active: false,
      lastMoveTime: 0
    };

    // Particles & Stars
    this.stars = [];
    this.dustParticles = [];
    this.nebulaOrbs = [];
    this.animId = null;
    this.isDark = document.body.classList.contains("theme-dark");

    this.init();
  }

  init() {
    this.resize();
    this.initStars();
    this.initNebula();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Re-adjust stars if screen changed dramatically
    if (this.stars.length === 0) {
      this.initStars();
    }
  }

  initStars() {
    this.stars = [];
    // Calculate star count according to screen area (lightweight, ~80 - 130 stars)
    const count = Math.floor(Math.min(130, Math.max(65, (this.width * this.height) / 14000)));

    for (let i = 0; i < count; i++) {
      const baseX = Math.random() * this.width;
      const baseY = Math.random() * this.height;
      const layer = Math.random(); // 0 to 1 for depth

      let size = 1.0;
      let speed = 0.15;
      let alpha = 0.4;

      if (layer < 0.55) {
        // Far background micro-stars
        size = 0.8 + Math.random() * 0.7;
        speed = 0.08 + Math.random() * 0.1;
        alpha = 0.25 + Math.random() * 0.35;
      } else if (layer < 0.88) {
        // Mid-field twinkling stars
        size = 1.4 + Math.random() * 1.1;
        speed = 0.18 + Math.random() * 0.18;
        alpha = 0.45 + Math.random() * 0.35;
      } else {
        // Foreground bright stars
        size = 2.2 + Math.random() * 1.4;
        speed = 0.28 + Math.random() * 0.25;
        alpha = 0.75 + Math.random() * 0.25;
      }

      this.stars.push({
        baseX,
        baseY,
        x: baseX,
        y: baseY,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size,
        baseSize: size,
        alpha,
        baseAlpha: alpha,
        layer,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinklePhase: Math.random() * Math.PI * 2,
        hasHalo: layer > 0.82
      });
    }
  }

  initNebula() {
    // Meminimalisir bola-bola kosmik agar pengguna tetap fokus belajar dan tidak terdistraksi
    this.nebulaOrbs = [];
  }

  bindEvents() {
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      this.mouse.targetX = clientX;
      this.mouse.targetY = clientY;
      this.mouse.active = true;
      this.mouse.lastMoveTime = performance.now();

      // Emit subtle stardust when cursor moves
      if (Math.random() < 0.28 && this.dustParticles.length < 24) {
        this.emitDust(clientX, clientY);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    window.addEventListener("mouseleave", () => {
      this.mouse.active = false;
    });

    window.addEventListener("resize", () => {
      this.resize();
    });

    // Pause animation when page tab is hidden to save battery & CPU
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (this.animId) cancelAnimationFrame(this.animId);
      } else {
        this.animate();
      }
    });

    // Observe theme class changes on body
    const observer = new MutationObserver(() => {
      this.isDark = document.body.classList.contains("theme-dark");
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  emitDust(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 1.2;
    this.dustParticles.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.2 + Math.random() * 1.8,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.025
    });
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());

    if (!this.ctx || !this.width || !this.height) return;

    const ctx = this.ctx;
    const now = performance.now();

    // Smooth cursor interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.12;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.12;

    // Check if cursor has been idle for a while
    const isMouseIdle = now - this.mouse.lastMoveTime > 3500;
    if (isMouseIdle) {
      // Gentle idle autonomous breathing
      this.mouse.targetX = this.width * 0.5 + Math.sin(now * 0.0008) * (this.width * 0.2);
      this.mouse.targetY = this.height * 0.35 + Math.cos(now * 0.0006) * (this.height * 0.15);
    }

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // =========================================================================
    // 1. NEBULA COSMIC CLOUDS
    // =========================================================================
    this.nebulaOrbs.forEach((orb) => {
      orb.x += orb.vx;
      orb.y += orb.vy;

      // Bounce slowly off screen boundaries
      if (orb.x < -orb.radius * 0.5 || orb.x > this.width + orb.radius * 0.5) orb.vx *= -1;
      if (orb.y < -orb.radius * 0.5 || orb.y > this.height + orb.radius * 0.5) orb.vy *= -1;

      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      const color = this.isDark ? orb.colorDark : orb.colorLight;
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // =========================================================================
    // 2. STARS UPDATE & GRAVITY DRIFT
    // =========================================================================
    const activeStarsNearCursor = [];

    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];

      // Autonomous gentle celestial drift
      s.x += s.vx;
      s.y += s.vy;

      // Wrap around edges seamlessly
      if (s.x < 0) s.x = this.width;
      else if (s.x > this.width) s.x = 0;
      if (s.y < 0) s.y = this.height;
      else if (s.y > this.height) s.y = 0;

      // Interactive Cursor Gravity / Repulsion Field
      const dx = s.x - this.mouse.x;
      const dy = s.y - this.mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius) {
        const force = (1 - dist / this.mouse.radius);
        // Soft elastic push
        const pushX = (dx / (dist || 1)) * force * 1.8;
        const pushY = (dy / (dist || 1)) * force * 1.8;
        s.x += pushX;
        s.y += pushY;

        activeStarsNearCursor.push({ star: s, dist });
      }

      // Twinkle effect
      s.twinklePhase += s.twinkleSpeed;
      const twinkleFactor = 0.75 + Math.sin(s.twinklePhase) * 0.25;
      const currentAlpha = Math.max(0.1, Math.min(1, s.alpha * twinkleFactor));

      // Draw Star
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (dist < this.mouse.radius ? 1.3 : 1), 0, Math.PI * 2);

      if (this.isDark) {
        // Bright shining star yellow / luminous celestial gold
        ctx.fillStyle = `rgba(254, 240, 138, ${currentAlpha})`;
      } else {
        ctx.fillStyle = `rgba(217, 119, 6, ${currentAlpha * 0.75})`; // Warm amber star for light mode
      }
      ctx.fill();

      // Soft Halo for bright foreground stars (Golden Star Radiance)
      if (s.hasHalo) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 2.8, 0, Math.PI * 2);
        if (this.isDark) {
          ctx.fillStyle = `rgba(245, 158, 11, ${currentAlpha * 0.35})`;
        } else {
          ctx.fillStyle = `rgba(217, 119, 6, ${currentAlpha * 0.18})`;
        }
        ctx.fill();
      }
    }

    // =========================================================================
    // 3. INTERACTIVE CONSTELLATION VECTORS (LINES TO CURSOR & NEIGHBORS)
    // =========================================================================
    // Connect nearest stars to cursor
    activeStarsNearCursor.sort((a, b) => a.dist - b.dist);
    const maxLinks = Math.min(6, activeStarsNearCursor.length);

    for (let i = 0; i < maxLinks; i++) {
      const item = activeStarsNearCursor[i];
      const s = item.star;
      const alpha = Math.max(0, (1 - item.dist / this.mouse.radius) * (this.isDark ? 0.45 : 0.35));

      ctx.beginPath();
      ctx.moveTo(this.mouse.x, this.mouse.y);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = this.isDark
        ? `rgba(245, 158, 11, ${alpha * 0.75})`
        : `rgba(217, 119, 6, ${alpha * 0.6})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Micro-node pulse at the cursor star link
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size + 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = this.isDark
        ? `rgba(254, 240, 138, ${alpha * 1.2})`
        : `rgba(180, 83, 9, ${alpha * 1.2})`;
      ctx.stroke();
    }

    // Inter-star constellation links for stars close to each other near cursor
    for (let i = 0; i < maxLinks; i++) {
      for (let j = i + 1; j < maxLinks; j++) {
        const s1 = activeStarsNearCursor[i].star;
        const s2 = activeStarsNearCursor[j].star;
        const dX = s1.x - s2.x;
        const dY = s1.y - s2.y;
        const starDist = Math.sqrt(dX * dX + dY * dY);

        if (starDist < 110) {
          const lineAlpha = (1 - starDist / 110) * (this.isDark ? 0.3 : 0.2);
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = this.isDark
            ? `rgba(251, 191, 36, ${lineAlpha * 0.75})`
            : `rgba(217, 119, 6, ${lineAlpha * 0.6})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    // Cursor Celestial Core Glow (Warm Star Nebula Glow)
    const cursorGlow = ctx.createRadialGradient(
      this.mouse.x,
      this.mouse.y,
      0,
      this.mouse.x,
      this.mouse.y,
      35
    );
    if (this.isDark) {
      cursorGlow.addColorStop(0, "rgba(245, 158, 11, 0.25)");
      cursorGlow.addColorStop(1, "rgba(245, 158, 11, 0)");
    } else {
      cursorGlow.addColorStop(0, "rgba(217, 119, 6, 0.15)");
      cursorGlow.addColorStop(1, "rgba(217, 119, 6, 0)");
    }
    ctx.fillStyle = cursorGlow;
    ctx.beginPath();
    ctx.arc(this.mouse.x, this.mouse.y, 35, 0, Math.PI * 2);
    ctx.fill();

    // =========================================================================
    // 4. STARDUST TRAIL PARTICLES (GOLDEN TWINKLE)
    // =========================================================================
    for (let i = this.dustParticles.length - 1; i >= 0; i--) {
      const p = this.dustParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.dustParticles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      if (this.isDark) {
        ctx.fillStyle = `rgba(254, 240, 138, ${p.life * 0.75})`;
      } else {
        ctx.fillStyle = `rgba(217, 119, 6, ${p.life * 0.55})`;
      }
      ctx.fill();
    }
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
