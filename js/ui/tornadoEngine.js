/**
 * tornadoEngine.js - High Performance 3D Particle Cyclone & Interactive Question Vortex
 * Error Pattern Engine (EPE V2)
 *
 * Optimasi:
 * - Zero Layout Reflow: Menggunakan GPU transform3d untuk semua pergerakan kartu
 * - Tab Visibility Aware: Animasi otomatis jeda (0% CPU) saat tab diagnostik tidak aktif
 * - Anti-Recursion: Pemisahan tegas antara klik pengguna (notify=true) dan pemanggilan programatik (notify=false)
 * - Billboarding 3D: Semua kartu selalu menghadap depan, terbaca jelas di segala sudut
 */

export class TornadoEngine {
  constructor({
    sceneId = "tornado-scene",
    canvasId = "tornado-canvas",
    vortexId = "tornado-vortex",
    searchInputId = "tornado-search-input",
    onSelectQuestion = null,
    getCubeStatus = null
  } = {}) {
    this.scene = document.getElementById(sceneId);
    this.canvas = document.getElementById(canvasId);
    this.vortex = document.getElementById(vortexId);
    this.searchInput = document.getElementById(searchInputId);
    this.onSelectQuestion = onSelectQuestion;
    this.getCubeStatus = getCubeStatus;

    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

    // State
    this.questions = [];
    this.activeQuestionId = "Q1";
    this.activeDomainFilter = "ALL";
    this.rotation = 0; // derajat
    this.rotationVelocity = 0;
    this.baseSpeed = 0.35; // derajat per frame
    this.currentSpeed = this.baseSpeed;
    this.speedMode = "normal"; // normal, fast, paused
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerTime = 0;
    this.resumeTimer = null;
    this.animId = null;
    this.isRunning = false;
    this.hoveredQid = null;

    // Dimensi Scene
    this.width = 600;
    this.height = 520;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Domain Configurations (Top wide, bottom narrow = conical tornado)
    this.domainConfigs = {
      D1: { name: "Konsep Dasar", color: "#3b82f6", rgb: [59, 130, 246], radius: 215, y: -150 },
      D2: { name: "Faktorisasi", color: "#10b981", rgb: [16, 185, 129], radius: 185, y: -90 },
      D3: { name: "Rumus ABC", color: "#8b5cf6", rgb: [139, 92, 246], radius: 155, y: -30 },
      D4: { name: "Diskriminan", color: "#f59e0b", rgb: [245, 158, 11], radius: 125, y: 30 },
      D5: { name: "Hubungan Akar", color: "#ec4899", rgb: [236, 72, 153], radius: 95, y: 90 },
      D6: { name: "Penerapan", color: "#06b6d4", rgb: [6, 182, 212], radius: 68, y: 150 }
    };

    // Partikel Angin Siklon (dioptimalkan 200 partikel agar sangat ringan)
    this.particles = [];
    this.numParticles = 200;

    // Elemen DOM Kartu Soal
    this.cardElements = new Map();
  }

  init(questions, activeQuestionId = "Q1") {
    this.questions = questions || [];
    this.activeQuestionId = activeQuestionId;

    if (!this.scene || !this.canvas || !this.vortex) return;

    this.resize();
    this.initParticles();
    this.buildCards();
    this.bindEvents();

    // Hanya render satu frame awal (tunggu tab diagnostik dibuka sebelum loop penuh)
    this.render();
  }

  resize() {
    if (!this.scene || !this.canvas) return;
    const rect = this.scene.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50) {
      this.width = rect.width;
      this.height = rect.height;
    } else {
      if (this.isRunning) {
        requestAnimationFrame(() => {
          const r = this.scene?.getBoundingClientRect();
          if (r && r.width > 50 && r.height > 50 && (r.width !== this.width || r.height !== this.height)) {
            this.resize();
          }
        });
      }
      this.width = this.width || 600;
      this.height = this.height || 520;
    }

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  initParticles() {
    this.particles = [];
    const colors = [
      "rgba(56, 189, 248, ",   // sky blue
      "rgba(6, 182, 212, ",    // cyan
      "rgba(139, 92, 246, ",   // purple
      "rgba(255, 255, 255, ",  // white lightning
      "rgba(245, 158, 11, "    // gold spark
    ];

    for (let i = 0; i < this.numParticles; i++) {
      const y = -180 + Math.random() * 355;
      const progress = (y + 180) / 355;
      const baseRadius = 40 + Math.pow(1 - progress, 1.25) * 195;
      const radiusSpread = baseRadius * (0.65 + Math.random() * 0.7);

      this.particles.push({
        y,
        progress,
        radius: radiusSpread,
        angle: Math.random() * Math.PI * 2,
        speed: 0.018 + (1 - progress * 0.5) * 0.025 + Math.random() * 0.01,
        verticalSpeed: 0.5 + Math.random() * 0.8,
        size: 1 + Math.random() * 2.2,
        colorBase: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.25 + Math.random() * 0.65
      });
    }
  }

  buildCards() {
    if (!this.vortex) return;
    this.vortex.innerHTML = "";
    this.cardElements.clear();

    const domainList = ["D1", "D2", "D3", "D4", "D5", "D6"];

    domainList.forEach((domId, dIdx) => {
      const domQuestions = this.questions.filter(q => q.domainId === domId);
      const angleStep = 360 / Math.max(domQuestions.length, 1);

      domQuestions.forEach((q, qIdx) => {
        const item = document.createElement("button");
        item.className = "tornado-item";
        item.setAttribute("data-qid", q.id);
        item.setAttribute("data-domain", q.domainId);
        item.title = `${q.id} · ${q.title}`;

        // Pasang di titik 0,0 dengan GPU transform3d
        item.style.left = "0px";
        item.style.top = "0px";

        item.innerHTML = `
          <span class="t-domain">${q.domainId}</span>
          <span class="t-qid">${q.id}</span>
          <span class="t-status q-status-unsolved"></span>
        `;

        // Klik Pengguna: panggil selectQuestion dengan notify = true
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          this.selectQuestion(q.id, true);
        });

        item.addEventListener("mouseenter", () => {
          this.hoveredQid = q.id;
        });

        item.addEventListener("mouseleave", () => {
          if (this.hoveredQid === q.id) this.hoveredQid = null;
        });

        this.vortex.appendChild(item);

        const baseAngle = qIdx * angleStep + dIdx * 25;
        this.cardElements.set(q.id, {
          element: item,
          question: q,
          domainId: domId,
          domIdx: dIdx,
          baseAngle,
          lastNormZ: -999
        });
      });
    });

    this.updateCardStatuses();
  }

  updateCardStatuses() {
    this.cardElements.forEach(({ element, question }) => {
      const qid = question.id;
      const statusSpan = element.querySelector(".t-status");

      if (qid === this.activeQuestionId) {
        element.classList.add("active");
      } else {
        element.classList.remove("active");
      }

      let statusClass = "q-status-unsolved";
      if (this.getCubeStatus) {
        const status = this.getCubeStatus(qid);
        if (status === "e0") statusClass = "q-status-e0";
        else if (status === "error") statusClass = "q-status-error";
        else if (status === "remediated" || status === "verified") statusClass = "q-status-remediated";
      }

      if (statusSpan) {
        statusSpan.className = `t-status ${statusClass}`;
      }
    });
  }

  /**
   * Pemilihan soal.
   * notify = true HANYA saat dipicu oleh klik pengguna langsung di dalam tornado.
   * Saat dipanggil dari app.js (programmatic), notify = false untuk memutus siklus rekursi!
   */
  selectQuestion(qid, notify = false) {
    if (this.activeQuestionId === qid && !notify) return;
    this.activeQuestionId = qid;
    this.updateCardStatuses();

    if (notify && this.onSelectQuestion) {
      this.onSelectQuestion(qid);
    }
  }

  setDomainFilter(domainId) {
    this.activeDomainFilter = domainId;
    this.updateFilterVisibility();
  }

  setSearchTerm(term) {
    this.searchTerm = (term || "").toLowerCase().trim();
    this.updateFilterVisibility();
  }

  updateFilterVisibility() {
    this.cardElements.forEach(({ element, question }) => {
      let isVisible = true;
      let isMatch = false;

      if (this.activeDomainFilter !== "ALL" && question.domainId !== this.activeDomainFilter) {
        isVisible = false;
      }

      if (this.searchTerm) {
        const fullText = `${question.id} ${question.title} ${question.domainName} ${question.topic} ${question.promptText}`.toLowerCase();
        if (fullText.includes(this.searchTerm)) {
          isMatch = true;
        } else {
          isVisible = false;
        }
      }

      element.classList.toggle("filtered-out", !isVisible);
      element.classList.toggle("search-match", isMatch);
    });
  }

  bindEvents() {
    if (!this.scene) return;

    window.addEventListener("resize", () => {
      if (this.isRunning) this.resize();
    });

    // Mouse Drag
    this.scene.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.lastPointerX = e.clientX;
      this.lastPointerTime = performance.now();
      this.rotationVelocity = 0;
      clearTimeout(this.resumeTimer);
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const now = performance.now();
      const dx = e.clientX - this.lastPointerX;
      const dt = Math.max(now - this.lastPointerTime, 1);

      this.rotation += dx * 0.45;
      this.rotationVelocity = (dx / dt) * 12;

      this.lastPointerX = e.clientX;
      this.lastPointerTime = now;
    });

    window.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.planAutoResume();
      }
    });

    // Touch Drag
    this.scene.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastPointerX = e.touches[0].clientX;
        this.lastPointerTime = performance.now();
        this.rotationVelocity = 0;
        clearTimeout(this.resumeTimer);
      }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const now = performance.now();
      const dx = e.touches[0].clientX - this.lastPointerX;
      const dt = Math.max(now - this.lastPointerTime, 1);

      this.rotation += dx * 0.45;
      this.rotationVelocity = (dx / dt) * 12;

      this.lastPointerX = e.touches[0].clientX;
      this.lastPointerTime = now;
    }, { passive: true });

    window.addEventListener("touchend", () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.planAutoResume();
      }
    });

    // HUD Speed & Reset Controls
    const speedBtn = document.getElementById("tornado-speed-btn");
    if (speedBtn) {
      speedBtn.addEventListener("click", () => {
        if (this.speedMode === "normal") {
          this.speedMode = "fast";
          this.currentSpeed = this.baseSpeed * 2.5;
          speedBtn.textContent = "⚡ Cepat";
          speedBtn.classList.add("text-amber-400");
        } else if (this.speedMode === "fast") {
          this.speedMode = "paused";
          this.currentSpeed = 0;
          this.rotationVelocity = 0;
          speedBtn.textContent = "⏸️ Jeda";
          speedBtn.classList.remove("text-amber-400");
          speedBtn.classList.add("text-rose-400");
        } else {
          this.speedMode = "normal";
          this.currentSpeed = this.baseSpeed;
          speedBtn.textContent = "▶ Normal";
          speedBtn.classList.remove("text-rose-400");
        }
      });
    }

    const resetBtn = document.getElementById("tornado-reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.rotation = 0;
        this.rotationVelocity = 0;
        this.currentSpeed = this.baseSpeed;
        this.speedMode = "normal";
        if (speedBtn) speedBtn.textContent = "▶ Normal";
      });
    }

    // Search Input Listener langsung di engine
    if (this.searchInput) {
      this.searchInput.addEventListener("input", (e) => {
        this.setSearchTerm(e.target.value);
      });
    }
  }

  planAutoResume() {
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      if (this.speedMode !== "paused") {
        this.currentSpeed = this.baseSpeed;
      }
    }, 2800);
  }

  resume() {
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(() => {
        this.resize();
        this.updateCardStatuses();
      });
      this.startLoop();
    }
  }

  pause() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  startLoop() {
    if (this.animId) return;
    this.isRunning = true;

    const loop = (timestamp) => {
      if (!this.isRunning) return;
      this.update(timestamp);
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stopLoop() {
    this.pause();
  }

  update(timestamp) {
    if (!this.isDragging) {
      if (Math.abs(this.rotationVelocity) > 0.05) {
        this.rotation += this.rotationVelocity;
        this.rotationVelocity *= 0.92;
      } else {
        this.rotation += this.currentSpeed;
      }
    }

    this.rotation = (this.rotation % 360 + 360) % 360;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.angle += p.speed;
      p.y += p.verticalSpeed;

      if (p.y > 185) {
        p.y = -185;
        p.angle = Math.random() * Math.PI * 2;
      }

      p.progress = (p.y + 185) / 370;
      const baseR = 40 + Math.pow(1 - p.progress, 1.25) * 195;
      p.radius = baseR * (0.7 + Math.sin(p.angle * 2) * 0.2);
    }
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const cx = this.width * 0.5;
    const cy = this.height * 0.5;

    ctx.clearRect(0, 0, this.width, this.height);
    this.drawTornadoCanvas(ctx, cx, cy);
    this.positionCards(cx, cy);
  }

  drawTornadoCanvas(ctx, cx, cy) {
    const rotRad = (this.rotation * Math.PI) / 180;
    const tilt = 15 * (Math.PI / 180);
    const sinTilt = Math.sin(tilt);

    // A. Center Vortex Atmospheric Glow Column
    const grad = ctx.createLinearGradient(cx, cy - 190, cx, cy + 180);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.12)");
    grad.addColorStop(0.5, "rgba(6, 182, 212, 0.08)");
    grad.addColorStop(1, "rgba(139, 92, 246, 0.18)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy - 180);
    ctx.lineTo(cx + 160, cy - 180);
    ctx.lineTo(cx + 35, cy + 175);
    ctx.lineTo(cx - 35, cy + 175);
    ctx.closePath();
    ctx.fill();

    // B. Draw 6 Glowing Orbital Guide Rings (Tiers of the Tornado)
    const domainKeys = ["D1", "D2", "D3", "D4", "D5", "D6"];
    domainKeys.forEach((domId) => {
      const cfg = this.domainConfigs[domId];
      const isFiltered = this.activeDomainFilter !== "ALL" && this.activeDomainFilter !== domId;
      const baseAlpha = isFiltered ? 0.08 : (this.activeDomainFilter === domId ? 0.85 : 0.32);

      const ry = cfg.radius * sinTilt;
      const rx = cfg.radius;
      const ringCenterY = cy + cfg.y;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, ringCenterY, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cfg.rgb[0]}, ${cfg.rgb[1]}, ${cfg.rgb[2]}, ${baseAlpha})`;
      ctx.lineWidth = this.activeDomainFilter === domId ? 2.5 : 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      if (!isFiltered) {
        ctx.fillStyle = `rgba(${cfg.rgb[0]}, ${cfg.rgb[1]}, ${cfg.rgb[2]}, ${baseAlpha + 0.3})`;
        ctx.font = "bold 9px ui-sans-serif, system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`${domId} · ${cfg.name}`, cx - rx - 8, ringCenterY + 3);
      }
      ctx.restore();
    });

    // C. Draw 4 Twisting Spiral Wind Bands
    for (let band = 0; band < 4; band++) {
      const bandOffset = (band * Math.PI) / 2;
      ctx.save();
      ctx.beginPath();
      let started = false;

      for (let yStep = -170; yStep <= 170; yStep += 10) {
        const prog = (yStep + 170) / 340;
        const r = 35 + Math.pow(1 - prog, 1.2) * 190;
        const ang = rotRad * 1.5 + bandOffset + prog * Math.PI * 3.5;

        const px = cx + Math.cos(ang) * r;
        const py = cy + yStep + Math.sin(ang) * r * sinTilt;

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }

      ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 + Math.sin(rotRad * 2 + band) * 0.05})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([12, 14]);
      ctx.stroke();
      ctx.restore();
    }

    // D. Draw Glowing Cyclonic Wind Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const ang = p.angle + rotRad;
      const px = cx + Math.cos(ang) * p.radius;
      const py = cy + p.y + Math.sin(ang) * p.radius * sinTilt;
      const depth = Math.sin(ang);

      const depthAlpha = p.alpha * (0.35 + (depth + 1) * 0.35);
      const size = p.size * (0.75 + (depth + 1) * 0.3);

      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.colorBase}${depthAlpha})`;
      ctx.fill();
    }
  }

  positionCards(cx, cy) {
    const tilt = 14 * (Math.PI / 180);
    const sinTilt = Math.sin(tilt);

    this.cardElements.forEach((cardData) => {
      const { element, domainId, baseAngle } = cardData;
      const cfg = this.domainConfigs[domainId];
      if (!cfg) return;

      const currentDeg = (baseAngle + this.rotation) % 360;
      const rad = (currentDeg * Math.PI) / 180;

      const x = Math.cos(rad) * cfg.radius;
      const z = Math.sin(rad) * cfg.radius;
      const y = cfg.y;

      const screenX = Math.round(cx + x);
      const screenY = Math.round(cy + y + z * sinTilt);

      const normZ = z / cfg.radius;

      // Hanya update transform dan zIndex via GPU compositing
      let scale = 0.82 + (normZ + 1) * 0.18;
      let zIndex = Math.round(50 + (normZ + 1) * 50);

      const isActive = cardData.question.id === this.activeQuestionId;
      const isHovered = cardData.question.id === this.hoveredQid;

      if (isActive) {
        scale *= 1.25;
        zIndex = 998;
      } else if (isHovered) {
        scale *= 1.15;
        zIndex = 999;
      }

      if (element.classList.contains("filtered-out")) {
        scale *= 0.65;
      }

      element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%) scale(${scale.toFixed(2)})`;
      element.style.zIndex = String(zIndex);

      // Update opacity hanya bila perubahan depth cukup signifikan (mencegah reflow berlebihan)
      if (Math.abs(normZ - cardData.lastNormZ) > 0.08) {
        cardData.lastNormZ = normZ;
        if (!element.classList.contains("filtered-out")) {
          const baseOpacity = (0.45 + (normZ + 1) * 0.275).toFixed(2);
          element.style.opacity = String(baseOpacity);
        } else {
          element.style.opacity = "0.12";
        }
      }
    });
  }

  destroy() {
    this.stopLoop();
    clearTimeout(this.resumeTimer);
  }
}
