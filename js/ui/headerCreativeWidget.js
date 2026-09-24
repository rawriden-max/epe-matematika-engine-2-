/**
 * headerCreativeWidget.js - Dynamic Creative Workspace Header Widget
 * Menghidupkan ruang kosong di header saat navigasi berada di atas/bawah/samping:
 * 1. Jam Digital Real-Time & Kalender Interaktif (WIB)
 * 2. Stopwatch Waktu Belajar Sesi Aktif (Study Session Timer)
 * 3. Mini Live Progress Counter Learning Cubes (Tersinkronisasi 0/24 Cubes)
 * 4. Micro-Rotator Status Belajar & Motivasi Adaptif AI
 */

export class HeaderCreativeWidget {
  constructor(options = {}) {
    this.cubeStore = options.cubeStore || null;
    this.clockMode = "time"; // 'time' | 'date'
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
    this.clockDisplay = document.getElementById("widget-clock-display");
    this.clockSuffix = document.getElementById("widget-clock-suffix");
    this.sessionTimer = document.getElementById("widget-session-timer");
    this.clockCard = document.getElementById("widget-live-clock-card");
    this.statsCard = document.getElementById("widget-learning-stats-card");
    this.cubesCount = document.getElementById("widget-cubes-count");
    this.quoteEl = document.getElementById("widget-motivation-quote");
    this.quoteBanner = document.getElementById("header-quote-banner");
  }

  startClockAndTimer() {
    this.tick();
    this.timerInterval = setInterval(() => this.tick(), 1000);
  }

  tick() {
    const now = new Date();

    // 1. Clock Display
    if (this.clockDisplay) {
      if (this.clockMode === "time") {
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        this.clockDisplay.textContent = `${hh}:${mm}:${ss}`;
        if (this.clockSuffix) this.clockSuffix.textContent = "WIB";
      } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
        const day = now.getDate();
        const month = months[now.getMonth()];
        this.clockDisplay.textContent = `${day} ${month}`;
        if (this.clockSuffix) this.clockSuffix.textContent = String(now.getFullYear());
      }
    }

    // 2. Session Duration
    if (this.sessionTimer) {
      const elapsedSec = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const m = Math.floor(elapsedSec / 60);
      const s = elapsedSec % 60;
      if (m >= 60) {
        const h = Math.floor(m / 60);
        const remM = m % 60;
        this.sessionTimer.textContent = `${String(h).padStart(2, "0")}:${String(remM).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      } else {
        this.sessionTimer.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      }
    }
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
        this.quoteEl.style.opacity = "0";
        this.quoteEl.style.transform = "translateY(-3px)";
        setTimeout(() => {
          this.renderQuote();
          this.quoteEl.style.opacity = "1";
          this.quoteEl.style.transform = "translateY(0)";
        }, 300);
      }
    }, 8500);
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
    // Klik kartu jam untuk beralih mode Jam <-> Tanggal
    if (this.clockCard) {
      this.clockCard.addEventListener("click", () => {
        this.clockMode = this.clockMode === "time" ? "date" : "time";
        this.tick();
      });
    }

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

    // Dengarkan event pembaruan kubus
    window.addEventListener("epe-cube-unlocked", () => this.updateCubeStats());
    window.addEventListener("epe-cube-updated", () => this.updateCubeStats());
  }

  destroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.quoteInterval) clearInterval(this.quoteInterval);
  }
}
