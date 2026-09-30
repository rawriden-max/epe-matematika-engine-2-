/**
 * avatarLab.js - EPE V3 Avatar Customization Lab Modal & Controller
 * 
 * Antarmuka interaktif bagi siswa untuk memilih dan membeli kosmetik:
 * - Live real-time preview avatar (180px)
 * - 6 Kategori Kustomisasi: Wajah, Rambut, Pakaian, Aksesoris, Aura, Latar
 * - Filter & Grid Item dengan indikator kelangkaan (Common, Rare, Epic, Legendary)
 * - Pembelian item menggunakan Cubic (◆) & pengecekan syarat achievement
 * - Penyimpanan konfigurasi ke localStorage dan sinkronisasi instan ke seluruh antarmuka
 */

import { AVATAR_CATEGORIES, COSMETIC_CATALOG, DEFAULT_AVATAR_CONFIG } from "./avatarCatalog.js";
import { AvatarEngine } from "./avatarEngine.js";
import { CubicWallet } from "../economy/cubicWallet.js";
import { NotificationToast } from "../ui/notification.js";

export class AvatarLab {
  constructor() {
    this.activeCategory = "face";
    this.savedConfig = { ...AvatarEngine.getActiveConfig() };
    this.previewConfig = { ...this.savedConfig };
    this.modalEl = null;

    this.initListeners();
  }

  initListeners() {
    window.addEventListener("epe-open-avatar-lab", () => {
      this.openModal();
    });

    window.addEventListener("epe-cubic-balance-updated", () => {
      this.updateHeaderBalance();
    });

    window.addEventListener("epe-profile-updated", (e) => {
      this.updateLabStudentName(e.detail?.studentName);
    });
  }

  updateLabStudentName(name = null) {
    const labNameEl = document.getElementById("avatar-lab-student-name");
    if (labNameEl) {
      const activeName = name || 
        (typeof window !== "undefined" && window.ProfileManager ? window.ProfileManager.getStudentName() : null) || 
        (typeof localStorage !== "undefined" && localStorage.getItem("epe_student_name")) || 
        "Siswa_01";
      labNameEl.textContent = activeName;
    }
  }

  openModal() {
    this.savedConfig = { ...AvatarEngine.getActiveConfig() };
    this.previewConfig = { ...this.savedConfig };
    this.renderModalDOM();
    this.updatePreview();
    this.updateLabStudentName();
    this.renderCategoryTabs();
    this.renderItemGrid();
    this.updateHeaderBalance();

    if (this.modalEl) {
      this.modalEl.classList.remove("hidden");
    }
  }

  closeModal() {
    // Revert preview to saved config if there were unowned preview items
    this.previewConfig = { ...this.savedConfig };
    this.updatePreview();
    if (this.modalEl) {
      this.modalEl.classList.add("hidden");
    }
  }

  renderModalDOM() {
    let modal = document.getElementById("avatar-lab-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "avatar-lab-modal";
      modal.className = "fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 modal-backdrop";
      document.body.appendChild(modal);
    }
    this.modalEl = modal;

    const activeStudentName = (typeof window !== "undefined" && window.ProfileManager ? window.ProfileManager.getStudentName() : null) || 
      (typeof localStorage !== "undefined" && localStorage.getItem("epe_student_name")) || 
      "Siswa_01";

    this.modalEl.innerHTML = `
      <div class="avatar-lab-card card-clean max-w-4xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/98 text-slate-900 dark:text-white backdrop-blur-2xl transition-all duration-300">
        <!-- Header -->
        <div class="avatar-lab-header p-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <div class="flex items-center gap-3">
            <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-cyan-500/15 to-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </span>
            <div>
              <h3 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Avatar Customization Lab
                <span class="px-2.5 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-amber-500/25 to-cyan-500/25 text-amber-600 dark:text-amber-300 font-mono font-black border border-amber-400/50 shadow-xs">EPE V3</span>
              </h3>
              <p class="text-[11px] font-medium text-slate-600 dark:text-slate-400">Sesuaikan identitas visual personal &amp; ekspresi kognitif pelajar matematika Anda</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Cubic Wallet Pill in Lab -->
            <button id="btn-lab-wallet" class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-amber-500/50 text-xs font-bold text-slate-900 dark:text-white transition-all cursor-pointer shadow-sm hover:scale-105" title="Buka Riwayat Mutasi Cubic">
              <span class="text-amber-500 dark:text-amber-400 font-extrabold text-sm">◆</span>
              <span id="lab-cubic-balance-text" class="font-mono font-black tracking-wide text-slate-900 dark:text-white">0</span>
            </button>

            <!-- Close Button -->
            <button id="btn-close-avatar-lab" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer" title="Tutup Lab Avatar">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Main Body (Grid Preview + Catalog) -->
        <div class="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800/80 custom-scrollbar">
          
          <!-- LEFT COLUMN: Live Preview & Equip Actions -->
          <div class="avatar-lab-preview-col md:col-span-4 p-5 sm:p-6 flex flex-col items-center justify-between space-y-4">
            <div class="w-full flex flex-col items-center">
              <span class="text-[10.5px] uppercase font-black tracking-widest text-amber-500 dark:text-amber-400 mb-4 drop-shadow-sm flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                LIVE HOLOGRAM PREVIEW
              </span>
              
              <!-- Large Avatar Holographic Preview Container (180px) -->
              <div class="relative group my-2">
                <div class="hologram-orbit-ring"></div>
                <div class="hologram-orbit-ring-secondary"></div>
                <div id="avatar-lab-preview" class="w-44 h-44 rounded-full overflow-hidden shadow-2xl border-2 border-cyan-400/90 relative bg-slate-950 ring-4 ring-cyan-500/30 transition-transform duration-300">
                  <!-- SVG will be rendered here -->
                </div>
                <div class="hologram-scanline"></div>

                <div class="absolute -bottom-3 inset-x-0 flex justify-center z-20">
                  <button id="btn-lab-edit-nickname" type="button" class="group/name relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-amber-500/80 hover:border-amber-400 text-xs text-amber-200 font-mono font-bold shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md" title="Klik untuk Mengubah Nama Siswa / Identitas Pelajar">
                    <span class="w-4 h-4 rounded-full bg-amber-500/25 border border-amber-500/50 flex items-center justify-center text-amber-300 group-hover/name:bg-amber-400 group-hover/name:text-slate-950 transition-colors shrink-0">
                      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </span>
                    <span id="avatar-lab-student-name" class="tracking-wide">${activeStudentName}</span>
                    <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 group-hover/name:bg-amber-500 group-hover/name:text-slate-950 transition-colors">
                      Ubah ID
                    </span>
                  </button>
                </div>
              </div>

              <!-- Equipped Summary Card -->
              <div class="avatar-lab-summary w-full mt-6 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs space-y-2 shadow-sm">
                <div class="flex justify-between items-center"><span class="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1"><span>👁</span> Wajah:</span> <span id="summary-face" class="summary-val font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">-</span></div>
                <div class="flex justify-between items-center"><span class="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1"><span>✂</span> Rambut:</span> <span id="summary-hair" class="summary-val font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">-</span></div>
                <div class="flex justify-between items-center"><span class="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1"><span>👔</span> Pakaian:</span> <span id="summary-outfit" class="summary-val font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">-</span></div>
                <div class="flex justify-between items-center"><span class="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1"><span>✨</span> Aura:</span> <span id="summary-aura" class="summary-val font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">-</span></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="w-full space-y-2 pt-2">
              <button id="btn-save-avatar-config" class="btn-primary w-full py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 rounded-xl">
                <svg class="w-3.5 h-3.5 text-slate-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>Simpan &amp; Terapkan Avatar</span>
              </button>
              <button id="btn-reset-avatar-config" class="btn-secondary w-full py-2 text-xs font-bold transition-all rounded-xl cursor-pointer">
                Reset ke Konfigurasi Awal
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN: Categories & Item Catalog -->
          <div class="md:col-span-8 p-5 sm:p-6 flex flex-col space-y-4">
            <!-- Category Tabs -->
            <div id="avatar-category-tabs" class="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar border-b border-slate-200 dark:border-slate-800/80">
              <!-- Rendered via JS -->
            </div>

            <!-- Items Grid -->
            <div id="avatar-items-grid" class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[52vh] pr-1.5 custom-scrollbar">
              <!-- Rendered via JS -->
            </div>
          </div>

        </div>

        <!-- Footer / Research Integrity Notice -->
        <div class="avatar-lab-footer p-3 px-6 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 flex-shrink-0 bg-slate-50/60 dark:bg-slate-950/40">
          <span class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Data diagnostik EPE V3 terlindungi murni &amp; independen dari kustomisasi visual.
          </span>
          <span>Koleksi Terbuka: <strong id="lab-owned-count" class="text-amber-500 dark:text-amber-400 font-black text-xs">0</strong> item</span>
        </div>
      </div>
    `;

    // Event Bindings
    this.modalEl.querySelector("#btn-close-avatar-lab").addEventListener("click", () => this.closeModal());
    this.modalEl.querySelector("#btn-lab-wallet").addEventListener("click", () => {
      CubicWallet.openWalletModal();
    });

    const labEditNameBtn = this.modalEl.querySelector("#btn-lab-edit-nickname");
    if (labEditNameBtn) {
      labEditNameBtn.addEventListener("click", () => {
        if (typeof window !== "undefined" && window.ProfileManager) {
          window.ProfileManager.promptEditNickname();
        }
      });
    }

    this.modalEl.querySelector("#btn-save-avatar-config").addEventListener("click", () => {
      const ownedIds = CubicWallet.getOwnedItemIds();
      const defaultIds = Object.values(DEFAULT_AVATAR_CONFIG);
      const unownedCategories = [];

      for (const [cat, itemId] of Object.entries(this.previewConfig)) {
        const isOwned = (ownedIds && ownedIds.includes(itemId)) || defaultIds.includes(itemId);
        if (!isOwned) {
          const itemObj = AvatarEngine.getItem(itemId);
          unownedCategories.push(itemObj ? itemObj.name : itemId);
          // Revert this category back to the last saved/owned configuration
          this.previewConfig[cat] = this.savedConfig[cat] || DEFAULT_AVATAR_CONFIG[cat];
        }
      }

      if (unownedCategories.length > 0) {
        NotificationToast.show(
          `Item yang belum dibeli (${unownedCategories.join(", ")}) tidak dapat disimpan dan dikembalikan ke model awal.`,
          "warning",
          4500
        );
        this.updatePreview();
        this.renderItemGrid();
      }

      // Save only owned configuration
      const finalSaved = AvatarEngine.saveConfig(this.previewConfig);
      this.savedConfig = { ...finalSaved };
      this.closeModal();
    });

    this.modalEl.querySelector("#btn-reset-avatar-config").addEventListener("click", () => {
      this.previewConfig = { ...DEFAULT_AVATAR_CONFIG };
      this.updatePreview();
      this.renderItemGrid();
    });
  }

  updateHeaderBalance() {
    const bal = CubicWallet.getBalance();
    const balEl = document.getElementById("lab-cubic-balance-text");
    if (balEl) balEl.textContent = bal.toLocaleString("id-ID");

    // Also update main header pill if exists
    const mainHeaderBal = document.getElementById("header-cubic-balance");
    if (mainHeaderBal) mainHeaderBal.textContent = bal.toLocaleString("id-ID");
    const sidebarBal = document.getElementById("sidebar-cubic-balance");
    if (sidebarBal) sidebarBal.textContent = bal.toLocaleString("id-ID");

    const ownedCount = CubicWallet.getOwnedItemIds().length;
    const ownedCountEl = document.getElementById("lab-owned-count");
    if (ownedCountEl) ownedCountEl.textContent = ownedCount;
  }

  renderCategoryTabs() {
    const container = document.getElementById("avatar-category-tabs");
    if (!container) return;

    container.innerHTML = AVATAR_CATEGORIES.map((cat) => {
      const isActive = this.activeCategory === cat.id;
      const activeClass = isActive
        ? "active-cat-tab bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black border-amber-400 shadow-md shadow-amber-500/30 ring-2 ring-amber-400/50"
        : "avatar-cat-tab font-semibold border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800";

      return `
        <button data-category="${cat.id}" class="cat-tab-btn px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${activeClass}">
          <span class="text-sm">${cat.icon}</span>
          <span>${cat.name}</span>
        </button>
      `;
    }).join("");

    container.querySelectorAll(".cat-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const cat = btn.getAttribute("data-category");
        this.activeCategory = cat;
        this.renderCategoryTabs();
        this.renderItemGrid();
      });
    });
  }

  renderItemGrid() {
    const grid = document.getElementById("avatar-items-grid");
    if (!grid) return;

    const items = COSMETIC_CATALOG.filter((it) => it.category === this.activeCategory);
    const ownedIds = CubicWallet.getOwnedItemIds();
    const currentEquippedId = this.previewConfig[this.activeCategory];

    grid.innerHTML = items.map((item) => {
      const isOwned = ownedIds.includes(item.id);
      const isEquipped = currentEquippedId === item.id;
      const isLockedAchievement = item.unlockCondition === "achievement" && !isOwned;

      // Rarity Styling (High-Contrast Bold Tags)
      let rarityBadge = "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600 font-black";
      let cardBorder = "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/60";
      if (item.rarity === "rare") {
        rarityBadge = "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-400 font-black";
        cardBorder = "border-blue-300 dark:border-blue-600/70 bg-blue-50/40 dark:bg-slate-900/60";
      } else if (item.rarity === "epic") {
        rarityBadge = "bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-400 font-black";
        cardBorder = "border-purple-300 dark:border-purple-600/70 bg-purple-50/40 dark:bg-slate-900/60";
      } else if (item.rarity === "legendary") {
        rarityBadge = "bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-amber-400 font-black shadow-xs shadow-amber-500/30";
        cardBorder = "border-amber-400 dark:border-amber-500/80 bg-amber-50/40 dark:bg-slate-900/60";
      }

      if (isEquipped) {
        cardBorder = "border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-400/50 bg-cyan-50/70 dark:bg-cyan-950/40 shadow-lg shadow-cyan-950/10 dark:shadow-cyan-950/70";
      }

      return `
        <div data-item-id="${item.id}" data-rarity="${item.rarity}" class="avatar-item-card item-card p-3.5 rounded-2xl border ${cardBorder} flex flex-col justify-between transition-all cursor-pointer relative group shadow-sm">
          
          <!-- Top Tag & Rarity -->
          <div class="flex items-center justify-between mb-2">
            <span class="px-2 py-0.5 rounded-lg text-[9.5px] uppercase tracking-wider border ${rarityBadge}">
              ${item.rarity}
            </span>
            ${
              isEquipped
                ? `<span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-black bg-cyan-400 text-slate-950 shadow-sm flex items-center gap-1">✓ Dipakai</span>`
                : isOwned
                ? `<span class="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40">Dimiliki</span>`
                : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center gap-1">◆ ${item.price}</span>`
            }
          </div>

          <!-- Item Name & Description -->
          <div class="space-y-1.5 mb-3">
            <h5 class="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">${item.name}</h5>
            <p class="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">${item.description}</p>
          </div>

          <!-- Action Button / Status -->
          <div class="mt-auto">
            ${
              isEquipped
                ? `<button class="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5 cursor-default" disabled><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>Sedang Dipakai</span></button>`
                : isOwned
                ? `<button class="btn-equip w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-[11px] text-white font-extrabold transition-all shadow-sm cursor-pointer" data-action="equip" data-id="${item.id}">Pakai</button>`
                : isLockedAchievement
                ? `<button class="w-full py-1.5 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/50 text-[11px] text-amber-700 dark:text-amber-300 font-bold cursor-not-allowed flex items-center justify-center gap-1" title="Buka lewat Milestone &amp; Achievement EPE V3">🔒 Terkunci</button>`
                : `<button class="btn-buy w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-[11px] text-white font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-950/40 cursor-pointer" data-action="buy" data-id="${item.id}" data-price="${item.price}"><span>Beli</span> <span class="font-mono text-emerald-200">◆ ${item.price}</span></button>`
            }
          </div>
        </div>
      `;
    }).join("");

    // Bind item card click for immediate live preview
    grid.querySelectorAll(".item-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        // If clicking action button, let the button handler process it
        if (e.target.tagName === "BUTTON") return;
        const itemId = card.getAttribute("data-item-id");
        this.previewItem(itemId);
      });
    });

    // Bind Equip Buttons
    grid.querySelectorAll(".btn-equip").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute("data-id");
        this.equipItem(itemId);
      });
    });

    // Bind Buy Buttons
    grid.querySelectorAll(".btn-buy").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const itemId = btn.getAttribute("data-id");
        const price = parseInt(btn.getAttribute("data-price"), 10);
        this.buyAndEquipItem(itemId, price);
      });
    });
  }

  previewItem(itemId) {
    const item = COSMETIC_CATALOG.find((it) => it.id === itemId);
    if (!item) return;

    this.previewConfig[item.category] = itemId;
    this.updatePreview();
    this.renderItemGrid();
  }

  equipItem(itemId) {
    const item = COSMETIC_CATALOG.find((it) => it.id === itemId);
    if (!item) return;

    const ownedIds = CubicWallet.getOwnedItemIds();
    const defaultIds = Object.values(DEFAULT_AVATAR_CONFIG);
    const isOwned = (ownedIds && ownedIds.includes(itemId)) || defaultIds.includes(itemId);
    if (!isOwned) {
      NotificationToast.show(`Item "${item.name}" belum Anda miliki! Silakan beli terlebih dahulu.`, "warning");
      return;
    }

    this.previewConfig[item.category] = itemId;
    const saved = AvatarEngine.saveConfig(this.previewConfig);
    this.savedConfig = { ...saved };
    this.updatePreview();
    this.renderItemGrid();
    NotificationToast.show(`Kosmetik "${item.name}" berhasil dipakai!`, "success");
  }

  showConfirmModal({ title, message, price, onConfirm }) {
    if (!this.modalEl) return;
    let confirmBox = document.getElementById("avatar-lab-confirm-overlay");
    if (!confirmBox) {
      confirmBox = document.createElement("div");
      confirmBox.id = "avatar-lab-confirm-overlay";
      confirmBox.className = "absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md rounded-2xl";
      this.modalEl.querySelector(".card-clean")?.appendChild(confirmBox);
    }
    confirmBox.innerHTML = `
      <div class="card-clean max-w-sm w-full p-5 space-y-4 border border-cyan-500/40 bg-slate-900 shadow-2xl rounded-xl text-center">
        <div class="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </div>
        <div>
          <h4 class="text-sm font-bold text-white">${title}</h4>
          <p class="text-xs text-slate-300 mt-1">${message}</p>
        </div>
        <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-400 font-bold text-sm">
          Biaya: ◆ ${price} Cubic
        </div>
        <div class="flex items-center justify-center gap-2 pt-1">
          <button id="btn-cancel-lab-confirm" class="btn-secondary text-xs px-4 py-2 flex-1">Batal</button>
          <button id="btn-agree-lab-confirm" class="btn-primary text-xs px-4 py-2 flex-1 font-bold">Beli & Pasang</button>
        </div>
      </div>
    `;
    confirmBox.classList.remove("hidden");

    confirmBox.querySelector("#btn-cancel-lab-confirm")?.addEventListener("click", () => {
      confirmBox.classList.add("hidden");
    });

    confirmBox.querySelector("#btn-agree-lab-confirm")?.addEventListener("click", () => {
      confirmBox.classList.add("hidden");
      if (typeof onConfirm === "function") onConfirm();
    });
  }

  buyAndEquipItem(itemId, price) {
    const item = COSMETIC_CATALOG.find((it) => it.id === itemId);
    if (!item) return;

    const currentBal = CubicWallet.getBalance();
    if (currentBal < price) {
      NotificationToast.show(
        `Saldo Cubic (${currentBal} ◆) belum cukup untuk ${item.name} (${price} ◆). Selesaikan diagnostik atau remediasi!`,
        "warning",
        4000
      );
      return;
    }

    this.showConfirmModal({
      title: `Konfirmasi Pembelian Item`,
      message: `Beli kosmetik "${item.name}" seharga ◆ ${price}?`,
      price: price,
      onConfirm: () => {
        const res = CubicWallet.deductCubic(price, `purchase_${item.id}`, `Pembelian Kosmetik: ${item.name}`);
        if (res.success) {
          CubicWallet.ownItem(itemId);
          this.previewConfig[item.category] = itemId;
          const saved = AvatarEngine.saveConfig(this.previewConfig);
          this.savedConfig = { ...saved };
          this.updateHeaderBalance();
          this.updatePreview();
          this.renderItemGrid();
          NotificationToast.show(`Kosmetik "${item.name}" berhasil dibeli dan dipasang!`, "success");
        }
      }
    });
  }

  updatePreview() {
    const previewContainer = document.getElementById("avatar-lab-preview");
    if (previewContainer) {
      AvatarEngine.renderInto(previewContainer, this.previewConfig, 176);
    }

    // Update Summary labels
    const faceItem = AvatarEngine.getItem(this.previewConfig.face);
    const hairItem = AvatarEngine.getItem(this.previewConfig.hair);
    const outfitItem = AvatarEngine.getItem(this.previewConfig.outfit);
    const auraItem = AvatarEngine.getItem(this.previewConfig.aura);

    const faceEl = document.getElementById("summary-face");
    if (faceEl) faceEl.textContent = faceItem?.name || "-";

    const hairEl = document.getElementById("summary-hair");
    if (hairEl) hairEl.textContent = hairItem?.name || "-";

    const outfitEl = document.getElementById("summary-outfit");
    if (outfitEl) outfitEl.textContent = outfitItem?.name || "-";

    const auraEl = document.getElementById("summary-aura");
    if (auraEl) auraEl.textContent = auraItem?.name || "Tidak Aktif";
  }
}
