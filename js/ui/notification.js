/**
 * notification.js - Toast Notification Utility
 * Error Pattern Engine (EPE)
 */

export class NotificationToast {
  /**
   * Menampilkan pesan notifikasi mengambang (toast) yang bersih dan elegan langsung di depan muka
   * @param {string} message - Pesan notifikasi
   * @param {string} type - 'success' | 'info' | 'warning' | 'error'
   * @param {number} duration - Durasi tampil dalam milidetik (default: 3200ms)
   */
  static show(message, type = "success", duration = 3200) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "fixed top-5 right-5 z-[2147483647] flex flex-col items-end gap-2.5 pointer-events-none w-auto max-w-md px-3 sm:px-0";
      container.style.zIndex = "2147483647";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    const icons = {
      success: `<span class="w-6 h-6 rounded-xl bg-emerald-500/25 text-emerald-400 border border-emerald-500/50 flex items-center justify-center text-xs font-black shrink-0 shadow-sm">✓</span>`,
      info: `<span class="w-6 h-6 rounded-xl bg-cyan-500/25 text-cyan-400 border border-cyan-500/50 flex items-center justify-center text-xs font-black shrink-0 shadow-sm">ℹ</span>`,
      warning: `<span class="w-6 h-6 rounded-xl bg-amber-500/25 text-amber-400 border border-amber-500/50 flex items-center justify-center text-xs font-black shrink-0 shadow-sm">⚡</span>`,
      error: `<span class="w-6 h-6 rounded-xl bg-rose-500/25 text-rose-400 border border-rose-500/50 flex items-center justify-center text-xs font-black shrink-0 shadow-sm">✕</span>`
    };

    const icon = icons[type] || icons.info;

    toast.className = "flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_20px_rgba(245,158,11,0.35)] border-2 border-amber-500 bg-[#140c07] text-amber-100 text-xs sm:text-sm font-bold backdrop-blur-2xl transition-all duration-300 transform translate-y-0 scale-95 opacity-0 pointer-events-auto ring-1 ring-amber-400/40 max-w-md w-full justify-start";
    toast.style.backgroundColor = "#140c07";
    toast.style.zIndex = "2147483647";
    toast.innerHTML = `
      ${icon}
      <span class="leading-relaxed flex-1">${message}</span>
      <button type="button" class="text-amber-400/60 hover:text-amber-200 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors" onclick="this.closest('.flex').remove()">✕</button>
    `;

    container.appendChild(toast);

    // Animasi masuk (muncul langsung di depan muka)
    requestAnimationFrame(() => {
      toast.classList.remove("-translate-y-4", "scale-95", "opacity-0");
      toast.classList.add("translate-y-0", "scale-100", "opacity-100");
    });

    // Animasi keluar
    setTimeout(() => {
      toast.classList.remove("translate-y-0", "scale-100", "opacity-100");
      toast.classList.add("-translate-y-4", "scale-95", "opacity-0");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }
}

// Global window registration
if (typeof window !== "undefined") {
  window.NotificationToast = NotificationToast;
  window.NotificationManager = NotificationToast;
}
