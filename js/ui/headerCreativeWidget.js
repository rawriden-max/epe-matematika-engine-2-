/**
 * headerCreativeWidget.js - Dynamic Creative Workspace Header Widget
 * Menghidupkan ruang kosong di header saat navigasi berada di atas/bawah/samping:
 * 1. Jam Digital Real-Time & Kalender Interaktif (WIB, WITA, WIT, Tanggal)
 * 2. Stopwatch Waktu Belajar Sesi Aktif (Study Session Timer)
 * 3. Mini Live Progress Counter Learning Cubes (Tersinkronisasi 0/24 Cubes)
 * 4. Micro-Rotator Status Belajar & Motivasi Adaptif AI
 * 5. Sinkronisasi penuh dengan Sidebar Clock di Tampilan Pojok
 */

import { NotificationToast } from "./notification.js";

export class HeaderCreativeWidget {
  constructor(options = {}) {
    this.cubeStore = options.cubeStore || null;
    const validModes = ["time", "date", "wita", "wit"];
    let savedMode = "time";
    try {
      const stored = localStorage.getItem("epe_clock_mode");
      if (validModes.includes(stored)) savedMode = stored;
    } catch (e) {}
    this.clockMode = savedMode; // 'time' (WIB) | 'date' | 'wita' | 'wit'
    this.sessionStartTime = Date.now();
    this.timerInterval = null;
    this.quotes = [
      {
        quote: "Jika kamu tak tahan akan penatnya belajar, maka kamu akan menanggung perihnya kebodohan.",
        author: "Imam Syafi'i"
      },
      {
        quote: "Pendidikan adalah paspor ke masa depan, karena hari esok adalah milik mereka yang mempersiapkannya hari ini.",
        author: "Malcolm X"
      },
      {
        quote: "Ilmu itu bukan apa yang dihafal, melainkan apa yang memberi manfaat nyata bagi kehidupan.",
        author: "Imam Syafi'i"
      },
      {
        quote: "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.",
        author: "Nelson Mandela"
      },
      {
        quote: "Hiduplah seolah kamu mati besok. Belajarlah seolah kamu hidup selamanya.",
        author: "Mahatma Gandhi"
      },
      {
        quote: "Akar dari pendidikan itu memang pahit, namun buah yang dihasilkannya sangat manis.",
        author: "Aristoteles"
      },
      {
        quote: "Bukan karena sulit kita tidak berani, tapi karena kita tidak berani maka semuanya menjadi sulit.",
        author: "Seneca"
      },
      {
        quote: "Orang yang berhenti belajar jadi pemilik masa lalu; yang terus belajar jadi pemilik masa depan.",
        author: "Eric Hoffer"
      },
      {
        quote: "Tuntutlah ilmu; di saat kamu miskin ia jadi hartamu, di saat kamu kaya ia jadi perhiasanmu.",
        author: "Luqman Al-Hakim"
      },
      {
        quote: "Bermimpilah setinggi langit; jika engkau jatuh, engkau akan jatuh di antara bintang-bintang.",
        author: "Ir. Soekarno"
      },
      {
        quote: "Setiap kesalahan dalam berpikir adalah anak tangga emas menuju pemahaman yang sejati.",
        author: "Filosofi EPE"
      }
    ];
    this.currentQuoteIdx = 0;
    this.quoteInterval = null;
  }

  init() {
    this.bindDOM();
    this.startClockAndTimer();
    this.startQuoteRotator();
    this.updateCubeStats();
    this.bindEvents();
  }

  bindDOM() {
    // Header Clock Elements
    this.clockDisplay = document.getElementById("widget-clock-display");
    this.clockSuffix = document.getElementById("widget-clock-suffix");
    this.sessionTimer = document.getElementById("widget-session-timer");
    this.clockCard = document.getElementById("widget-live-clock-card");

    // Sidebar Clock Elements (Tampilan Pojok / Sidebar)
    this.sidebarClockDisplay = document.getElementById("sidebar-clock-display");
    this.sidebarClockSuffix = document.getElementById("sidebar-clock-suffix");
    this.sidebarSessionTimer = document.getElementById("sidebar-session-timer");
    this.sidebarClockCard = document.getElementById("sidebar-live-clock-card");

    // Stats & Quotes Elements
    this.statsCard = document.getElementById("widget-learning-stats-card");
    this.cubesCount = document.getElementById("widget-cubes-count");
    this.quoteEl = document.getElementById("widget-motivation-quote");
    this.quoteBanner = document.getElementById("header-quote-banner");

    // Unified Settings Hub Elements
    this.settingsClockDisplay = document.getElementById("settings-clock-display");
    this.settingsClockSuffix = document.getElementById("settings-clock-suffix");
    this.settingsSessionTimer = document.getElementById("settings-session-timer");
    this.btnResetSessionTimer = document.getElementById("btn-reset-session-timer");
  }

  startClockAndTimer() {
    this.tick();
    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  toggleClockMode() {
    const modes = ["time", "date", "wita", "wit"];
    const currentIdx = modes.indexOf(this.clockMode);
    const nextIdx = (currentIdx + 1) % modes.length;
    this.clockMode = modes[nextIdx];

    try {
      localStorage.setItem("epe_clock_mode", this.clockMode);
    } catch (e) {}

    // Tactile animation feedback on both clock cards
    const cards = [this.clockCard, this.sidebarClockCard].filter(Boolean);
    cards.forEach((card) => {
      card.classList.add("scale-95");
      setTimeout(() => card.classList.remove("scale-95"), 150);
    });

    // Update time immediately
    this.tick();

    // Friendly Toast Notification
    const modeLabels = {
      time: "Waktu Indonesia Barat (WIB)",
      date: "Kalender Tanggal Hari Ini",
      wita: "Waktu Indonesia Tengah (WITA)",
      wit: "Waktu Indonesia Timur (WIT)"
    };
    try {
      if (typeof NotificationToast !== "undefined" && typeof NotificationToast.show === "function") {
        NotificationToast.show(`Tampilan Waktu: ${modeLabels[this.clockMode] || "WIB"}`, "info", 1800);
      }
    } catch (e) {}
  }

  tick() {
    const now = new Date();

    let displayStr = "00:00:00";
    let suffixStr = "WIB";
    let tooltipStr = "Waktu Indonesia Barat (WIB) • Klik untuk ganti tampilan Jam/Tanggal/Zona";
    let suffixClass = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";

    if (this.clockMode === "time") {
      // WIB: Asia/Jakarta (UTC+7)
      try {
        const parts = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(now);
        displayStr = parts.replace(/\./g, ":");
      } catch (e) {
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        displayStr = `${hh}:${mm}:${ss}`;
      }
      suffixStr = "WIB";
      tooltipStr = "Jam Real-Time (WIB / Jakarta) • Klik untuk beralih ke Tanggal / WITA / WIT";
      suffixClass = "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
    } else if (this.clockMode === "date") {
      // Tanggal & Bulan & Tahun
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const day = now.getDate();
      const month = months[now.getMonth()];
      displayStr = `${day} ${month}`;
      suffixStr = String(now.getFullYear());
      tooltipStr = `Tanggal Hari Ini: ${day} ${month} ${now.getFullYear()} • Klik untuk beralih ke WITA`;
      suffixClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    } else if (this.clockMode === "wita") {
      // WITA: Asia/Makassar (UTC+8)
      try {
        const parts = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Makassar",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(now);
        displayStr = parts.replace(/\./g, ":");
      } catch (e) {
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const wita = new Date(utc + 3600000 * 8);
        const hh = String(wita.getHours()).padStart(2, "0");
        const mm = String(wita.getMinutes()).padStart(2, "0");
        const ss = String(wita.getSeconds()).padStart(2, "0");
        displayStr = `${hh}:${mm}:${ss}`;
      }
      suffixStr = "WITA";
      tooltipStr = "Jam Real-Time (WITA / Bali-Makassar) • Klik untuk beralih ke WIT";
      suffixClass = "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
    } else if (this.clockMode === "wit") {
      // WIT: Asia/Jayapura (UTC+9)
      try {
        const parts = new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jayapura",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        }).format(now);
        displayStr = parts.replace(/\./g, ":");
      } catch (e) {
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const wit = new Date(utc + 3600000 * 9);
        const hh = String(wit.getHours()).padStart(2, "0");
        const mm = String(wit.getMinutes()).padStart(2, "0");
        const ss = String(wit.getSeconds()).padStart(2, "0");
        displayStr = `${hh}:${mm}:${ss}`;
      }
      suffixStr = "WIT";
      tooltipStr = "Jam Real-Time (WIT / Maluku-Papua) • Klik untuk beralih ke WIB";
      suffixClass = "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }

    // 1. Update Header Clock
    if (this.clockDisplay) this.clockDisplay.textContent = displayStr;
    if (this.clockSuffix) {
      this.clockSuffix.textContent = suffixStr;
      this.clockSuffix.className = `text-[9px] font-sans px-1 py-0.2 rounded font-bold border transition-colors ${suffixClass}`;
    }
    if (this.clockCard) this.clockCard.title = tooltipStr;

    // 2. Update Sidebar Clock (Tampilan Pojok)
    if (this.sidebarClockDisplay) this.sidebarClockDisplay.textContent = displayStr;
    if (this.sidebarClockSuffix) {
      this.sidebarClockSuffix.textContent = suffixStr;
      this.sidebarClockSuffix.className = `text-[9px] font-sans px-1 py-0.2 rounded font-bold border transition-colors ${suffixClass}`;
    }
    if (this.sidebarClockCard) this.sidebarClockCard.title = tooltipStr;

    // 3. Update Session Stopwatch Timer
    const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    let sessionText = "";
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      sessionText = `${String(h).padStart(2, "0")}:${String(remM).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    } else {
      sessionText = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    if (this.sessionTimer) this.sessionTimer.textContent = sessionText;
    if (this.sidebarSessionTimer) this.sidebarSessionTimer.textContent = sessionText;

    // 4. Update Unified Settings Hub Clock & Timer
    if (this.settingsClockDisplay) this.settingsClockDisplay.textContent = displayStr;
    if (this.settingsClockSuffix) this.settingsClockSuffix.textContent = suffixStr;
    if (this.settingsSessionTimer) this.settingsSessionTimer.textContent = sessionText;
  }

  renderQuote() {
    if (!this.quoteEl) return;
    const item = this.quotes[this.currentQuoteIdx];
    if (!item) return;
    const formatted = `“${item.quote}” — ${item.author}`;
    this.quoteEl.textContent = formatted;
    if (this.quoteBanner) {
      this.quoteBanner.title = `${formatted} (Kutipan Filosofis Motivasi Belajar)`;
    }
    if (this.statsCard) {
      this.statsCard.title = `${formatted}\n(Klik untuk melihat Monumen Learning Cubes di Dashboard)`;
    }
  }

  startQuoteRotator() {
    this.renderQuote();
    this.quoteInterval = setInterval(() => {
      this.currentQuoteIdx = (this.currentQuoteIdx + 1) % this.quotes.length;
      if (this.quoteEl) {
        this.quoteEl.style.transition = "opacity 0.45s ease, transform 0.45s ease";
        this.quoteEl.style.opacity = "0";
        this.quoteEl.style.transform = "translateY(-4px)";
        setTimeout(() => {
          this.renderQuote();
          this.quoteEl.style.opacity = "1";
          this.quoteEl.style.transform = "translateY(0)";
        }, 450);
      }
    }, 22000);
  }

  updateCubeStats() {
    let count = 0;
    try {
      if (this.cubeStore && typeof this.cubeStore.getCubes === "function") {
        const cubes = this.cubeStore.getCubes();
        count = Array.isArray(cubes) ? cubes.filter(c => c.unlocked || c.status === "unlocked" || c.remediated).length : 0;
      } else {
        const raw = localStorage.getItem("epe_cubes_v2");
        if (raw) {
          const parsed = JSON.parse(raw);
          count = Array.isArray(parsed) ? parsed.filter(c => c.unlocked || c.status === "unlocked" || c.remediated).length : 0;
        }
      }
    } catch (e) {
      count = 0;
    }

    if (this.cubesCount) {
      this.cubesCount.textContent = String(count);
    }
  }

  bindEvents() {
    // Helper untuk binding kartu jam (baik di header maupun di tampilan pojok / sidebar)
    const bindClockCard = (card) => {
      if (!card) return;
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "Ganti format waktu dan kalender");

      // Klik mouse & sentuhan mobile
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleClockMode();
      });

      // Aksesibilitas keyboard (Enter / Spasi)
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.toggleClockMode();
        }
      });
    };

    // Pasang listener pada kartu jam header dan kartu jam sidebar (tampilan pojok)
    bindClockCard(this.clockCard);
    bindClockCard(this.sidebarClockCard);

    // Klik kartu statistik untuk langsung scroll / menuju Monumen di Dashboard
    if (this.statsCard) {
      this.statsCard.addEventListener("click", () => {
        if (window.EPEAppInstance && typeof window.EPEAppInstance.switchTab === "function") {
          window.EPEAppInstance.switchTab("dashboard");
        }
        const monumenCard = document.getElementById("monumen-cube-container") || document.getElementById("learning-cube-canvas");
        if (monumenCard) {
          monumenCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }

    // Reset Timer Sesi Belajar dari Unified Settings Hub
    if (this.btnResetSessionTimer) {
      this.btnResetSessionTimer.addEventListener("click", () => {
        this.sessionStartTime = Date.now();
        this.tick();
        if (typeof NotificationToast !== "undefined" && typeof NotificationToast.show === "function") {
          NotificationToast.show("Timer sesi belajar di-reset ke 00:00", "success", 2000);
        }
      });
    }

    // Dismiss & Expand Motivation Notification Strip (Menjadi Tab Kristal Kecil Melayang)
    const topStrip = document.getElementById("top-notification-strip");
    const crystal = document.getElementById("floating-motivation-crystal");
    const closeBtn = document.getElementById("btn-close-motivation");

    const expandNotification = (e) => {
      if (e) {
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        if (typeof e.preventDefault === "function") e.preventDefault();
      }
      if (crystal) {
        crystal.classList.add("hidden");
        crystal.style.display = "none";
      }
      if (topStrip) {
        topStrip.classList.remove("dismissed", "hidden");
        topStrip.style.display = "";
      }
      try {
        localStorage.setItem("epe_motivation_minimized", "false");
      } catch (err) {}
    };

    const dismissNotification = (e) => {
      if (e) {
        if (typeof e.stopPropagation === "function") e.stopPropagation();
        if (typeof e.preventDefault === "function") e.preventDefault();
      }
      if (topStrip) {
        topStrip.classList.add("dismissed", "hidden");
        topStrip.style.display = "none";
      }
      if (crystal) {
        crystal.classList.remove("hidden");
        crystal.style.display = "flex";
        setTimeout(() => {
          if (typeof clampCrystalPosition === "function") {
            const rect = crystal.getBoundingClientRect();
            const initialReqLeft = rect.left > 0 ? rect.left : (window.innerWidth - (crystal.offsetWidth || 170) - 28);
            const initialReqTop = rect.top > 0 ? rect.top : 76;
            const clamped = clampCrystalPosition(initialReqLeft, initialReqTop);
            crystal.style.left = `${clamped.left}px`;
            crystal.style.top = `${clamped.top}px`;
            crystal.style.right = "auto";
          }
        }, 10);
      }
      try {
        localStorage.setItem("epe_motivation_minimized", "true");
      } catch (err) {}
    };

    // Sinkronisasi status tersimpan
    try {
      const isMin = localStorage.getItem("epe_motivation_minimized") === "true";
      if (isMin) {
        if (topStrip) {
          topStrip.classList.add("dismissed", "hidden");
          topStrip.style.display = "none";
        }
        if (crystal) {
          crystal.classList.remove("hidden");
          crystal.style.display = "flex";
        }
      } else {
        if (crystal) {
          crystal.classList.add("hidden");
          crystal.style.display = "none";
        }
        if (topStrip) {
          topStrip.classList.remove("dismissed", "hidden");
          topStrip.style.display = "";
        }
      }
    } catch (e) {}

    if (closeBtn) {
      closeBtn.addEventListener("click", dismissNotification);
    }

    // Inisialisasi Draggable & Playable Physics pada Floating Motivation Crystal
    let clampCrystalPosition = null;
    if (crystal) {
      let isDragging = false;
      let hasMoved = false;
      let startX = 0, startY = 0;
      let initialLeft = 0, initialTop = 0;

      // Helper Safe Boundary Clamping: Mencegah elemen keluar batas layar kiri/kanan/atas/bawah
      clampCrystalPosition = (reqLeft, reqTop) => {
        const crystalW = crystal.offsetWidth || 170;
        const crystalH = crystal.offsetHeight || 44;
        const minLeft = 28; // Batas aman kiri agar lingkaran kristal dan efek glow tidak terpotong
        const maxLeft = Math.max(minLeft, window.innerWidth - crystalW - 28); // Batas aman kanan
        const minTop = 76; // Batas aman atas di bawah top navbar
        const maxTop = Math.max(minTop, window.innerHeight - crystalH - 96); // Batas aman bawah di atas floating dock
        
        const finalLeft = Math.min(Math.max(minLeft, reqLeft), maxLeft);
        const finalTop = Math.min(Math.max(minTop, reqTop), maxTop);
        return { left: finalLeft, top: finalTop, minLeft, maxLeft, minTop, maxTop };
      };

      // Restore saved crystal position
      try {
        const savedPos = localStorage.getItem("epe_crystal_pos");
        if (savedPos) {
          const { left, top } = JSON.parse(savedPos);
          if (typeof left === "number" && typeof top === "number") {
            const clamped = clampCrystalPosition(left, top);
            crystal.style.left = `${clamped.left}px`;
            crystal.style.top = `${clamped.top}px`;
            crystal.style.right = "auto";
          }
        } else {
          // Posisi default aman di kanan atas
          const defaultClamped = clampCrystalPosition(window.innerWidth - 198, 76);
          crystal.style.left = `${defaultClamped.left}px`;
          crystal.style.top = `${defaultClamped.top}px`;
          crystal.style.right = "auto";
        }
      } catch (err) {}

      const onPointerDown = (e) => {
        isDragging = true;
        hasMoved = false;
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        startX = clientX;
        startY = clientY;

        const rect = crystal.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        crystal.style.transition = "none";
        crystal.classList.add("is-dragging");
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        const dx = clientX - startX;
        const dy = clientY - startY;

        if (Math.hypot(dx, dy) > 5) {
          hasMoved = true;
        }

        if (hasMoved) {
          if (e.cancelable && e.type === "touchmove") e.preventDefault();
          const reqLeft = initialLeft + dx;
          const reqTop = initialTop + dy;
          const clamped = clampCrystalPosition(reqLeft, reqTop);

          crystal.style.left = `${clamped.left}px`;
          crystal.style.top = `${clamped.top}px`;
          crystal.style.right = "auto";
        }
      };

      const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        crystal.classList.remove("is-dragging");
        crystal.style.transition = "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)";

        if (!hasMoved) {
          // Klik / Tap murni -> Buka kembali kapsul motivasi
          expandNotification(e);
        } else {
          // Snap rapi ke tepi kiri atau kanan dengan jarak batas aman 28px agar tidak keluar layar
          const crystalW = crystal.offsetWidth || 170;
          const rect = crystal.getBoundingClientRect();
          const isCloserToLeft = (rect.left + crystalW / 2) < (window.innerWidth / 2);
          const snapLeft = isCloserToLeft ? 28 : Math.max(28, window.innerWidth - crystalW - 28);
          const clamped = clampCrystalPosition(snapLeft, rect.top);

          crystal.style.left = `${clamped.left}px`;
          crystal.style.top = `${clamped.top}px`;
          crystal.style.right = "auto";

          // Simpan koordinat posisi terakhir yang aman
          try {
            localStorage.setItem("epe_crystal_pos", JSON.stringify({ left: clamped.left, top: clamped.top }));
          } catch (err) {}
        }
      };

      crystal.addEventListener("mousedown", onPointerDown);
      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);

      crystal.addEventListener("touchstart", onPointerDown, { passive: true });
      window.addEventListener("touchmove", onPointerMove, { passive: false });
      window.addEventListener("touchend", onPointerUp);

      // Auto re-clamp jika ukuran layar browser berubah / rotasi HP
      window.addEventListener("resize", () => {
        if (!crystal.classList.contains("hidden") && crystal.style.display !== "none") {
          const rect = crystal.getBoundingClientRect();
          if (rect.width > 0) {
            const clamped = clampCrystalPosition(rect.left, rect.top);
            crystal.style.left = `${clamped.left}px`;
            crystal.style.top = `${clamped.top}px`;
            crystal.style.right = "auto";
          }
        }
      });

      crystal.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          expandNotification(e);
        }
      });
    }

    // Dengarkan event pembaruan kubus
    window.addEventListener("epe-cube-unlocked", () => this.updateCubeStats());
    window.addEventListener("epe-cube-updated", () => this.updateCubeStats());
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.quoteInterval) clearInterval(this.quoteInterval);
  }
}

