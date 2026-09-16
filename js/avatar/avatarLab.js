/**
 * avatarLab.js - EPE V2.1 Avatar Customization Lab Modal & Controller
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

export class AvatarLab {
  constructor() {
    this.activeCategory = "face";
    this.previewConfig = { ...AvatarEngine.getActiveConfig() };
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
  }

  openModal() {
    this.previewConfig = { ...AvatarEngine.getActiveConfig() };
    this.renderModalDOM();
    this.updatePreview();
    this.renderCategoryTabs();
    this.renderItemGrid();
    this.updateHeaderBalance();

    if (this.modalEl) {
      this.modalEl.classList.remove("hidden");
    }
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.classList.add("hidden");
    }
  }

  renderModalDOM() {
    let modal = document.getElementById("avatar-lab-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "avatar-lab-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 modal-backdrop";
      document.body.appendChild(modal);
    }
    this.modalEl = modal;

    this.modalEl.innerHTML = `
      <div class="card-clean max-w-4xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-slate-700 bg-slate-900/95 text-white backdrop-blur-xl">
        <!-- Header -->
        <div class="p-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-slate-950/50">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-base">🧬</span>
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                Avatar Customization Lab
                <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">EPE V2.1</span>
              </h3>
              <p class="text-[11px] text-slate-400">Sesuaikan identitas visual personal pelajar matematika Anda</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Cubic Wallet Pill in Lab -->
            <button id="btn-lab-wallet" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/40 text-xs font-bold transition-all" title="Buka Riwayat Mutasi Cubic">
              <span class="text-cyan-400 font-bold">◆</span>
              <span id="lab-cubic-balance-text" class="text-white font-mono">0</span>
            </button>

            <!-- Close Button -->
            <button id="btn-close-avatar-lab" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              ✕
            </button>
          </div>
        </div>

        <!-- Main Body (Grid Preview + Catalog) -->
        <div class="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-800 custom-scrollbar">
          
          <!-- LEFT COLUMN: Live Preview & Equip Actions -->
          <div class="md:col-span-4 p-5 flex flex-col items-center justify-between bg-slate-950/30 space-y-4">
            <div class="w-full flex flex-col items-center">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-3">Live Hologram Preview</span>
              
              <!-- Large Avatar Preview (180px) -->
              <div class="relative group">
                <div id="avatar-lab-preview" class="w-44 h-44 rounded-full overflow-hidden shadow-2xl border-2 border-cyan-500/50 relative bg-slate-950 ring-4 ring-cyan-500/20 transition-transform duration-300">
                  <!-- SVG will be rendered here -->
                </div>
                <div class="absolute -bottom-2 inset-x-0 flex justify-center">
                  <span class="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 font-mono shadow-md">
                    Siswa_01
                  </span>
                </div>
              </div>

              <!-- Equipped Summary -->
              <div class="w-full mt-6 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] space-y-1 text-slate-300">
                <div class="flex justify-between"><span class="text-slate-500">Wajah:</span> <span id="summary-face" class="font-medium text-white truncate max-w-[140px]">-</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Rambut:</span> <span id="summary-hair" class="font-medium text-white truncate max-w-[140px]">-</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Pakaian:</span> <span id="summary-outfit" class="font-medium text-white truncate max-w-[140px]">-</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Aura:</span> <span id="summary-aura" class="font-medium text-white truncate max-w-[140px]">-</span></div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="w-full space-y-2 pt-2">
              <button id="btn-save-avatar-config" class="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                <span>💾</span> Simpan & Terapkan Avatar
              </button>
              <button id="btn-reset-avatar-config" class="btn-secondary w-full py-1.5 text-xs text-slate-400 hover:text-white">
                Reset ke Konfigurasi Awal
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN: Categories & Item Catalog -->
          <div class="md:col-span-8 p-5 flex flex-col space-y-4">
            <!-- Category Tabs -->
            <div id="avatar-category-tabs" class="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-slate-800">
              <!-- Rendered via JS -->
            </div>

            <!-- Items Grid -->
            <div id="avatar-items-grid" class="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[52vh] pr-1 custom-scrollbar">
              <!-- Rendered via JS -->
            </div>
          </div>

        </div>

        <!-- Footer / Research Integrity Notice -->
        <div class="p-3 px-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 flex-shrink-0">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Data diagnostik EPE V2 terlindungi murni & independen dari kustomisasi visual.
          </span>
          <span class="text-slate-500">Koleksi Terbuka: <strong id="lab-owned-count" class="text-white">0</strong> item</span>
        </div>
      </div>
    `;

    // Event Bindings
    this.modalEl.querySelector("#btn-close-avatar-lab").addEventListener("click", () => this.closeModal());
    this.modalEl.querySelector("#btn-lab-wallet").addEventListener("click", () => {
      CubicWallet.openWalletModal();
    });

    this.modalEl.querySelector("#btn-save-avatar-config").addEventListener("click", () => {
      AvatarEngine.saveConfig(this.previewConfig);
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
        ? "bg-blue-600/30 text-blue-300 border-blue-500/60 shadow-sm"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent";

      return `
        <button data-category="${cat.id}" class="cat-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all whitespace-nowrap ${activeClass}">
          <span>${cat.icon}</span>
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

      // Rarity Styling
      let rarityBadge = "bg-slate-800 text-slate-300 border-slate-700";
      let cardBorder = "border-slate-800";
      if (item.rarity === "rare") {
        rarityBadge = "bg-blue-950 text-blue-400 border-blue-700/50";
        cardBorder = "border-blue-900/40";
      } else if (item.rarity === "epic") {
        rarityBadge = "bg-purple-950 text-purple-400 border-purple-700/50";
        cardBorder = "border-purple-900/40";
      } else if (item.rarity === "legendary") {
        rarityBadge = "bg-amber-950 text-amber-400 border-amber-700/50";
        cardBorder = "border-amber-700/40";
      }

      if (isEquipped) {
        cardBorder = "border-cyan-500 ring-2 ring-cyan-500/30 bg-cyan-950/20";
      }

      return `
        <div data-item-id="${item.id}" class="item-card p-3 rounded-xl bg-slate-900/80 border ${cardBorder} flex flex-col justify-between hover:bg-slate-800/80 transition-all cursor-pointer relative group">
          
          <!-- Top Tag & Rarity -->
          <div class="flex items-center justify-between mb-2">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${rarityBadge}">
              ${item.rarity}
            </span>
            ${
              isEquipped
                ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500 text-slate-950">Dipakai</span>`
                : isOwned
                ? `<span class="text-[10px] text-emerald-400 font-medium">Dimiliki</span>`
                : `<span class="text-[10px] text-cyan-400 font-bold font-mono">◆ ${item.price}</span>`
            }
          </div>

          <!-- Item Name & Description -->
          <div class="space-y-1 mb-3">
            <h5 class="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">${item.name}</h5>
            <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">${item.description}</p>
          </div>

          <!-- Action Button / Status -->
          <div class="mt-auto">
            ${
              isEquipped
                ? `<button class="w-full py-1 rounded-lg bg-slate-800/50 text-[10px] text-slate-400 font-bold cursor-default" disabled>Sedang Dipakai</button>`
                : isOwned
                ? `<button class="btn-equip w-full py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] text-white font-bold transition-colors" data-action="equip" data-id="${item.id}">Pakai</button>`
                : isLockedAchievement
                ? `<button class="w-full py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[10px] text-amber-400 font-bold cursor-not-allowed" title="Buka lewat Achievement EPE">🔒 Terkunci</button>`
                : `<button class="btn-buy w-full py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-bold transition-colors flex items-center justify-center gap-1" data-action="buy" data-id="${item.id}" data-price="${item.price}">Beli ◆ ${item.price}</button>`
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

    this.previewConfig[item.category] = itemId;
    AvatarEngine.saveConfig(this.previewConfig);
    this.updatePreview();
    this.renderItemGrid();
  }

  buyAndEquipItem(itemId, price) {
    const item = COSMETIC_CATALOG.find((it) => it.id === itemId);
    if (!item) return;

    const currentBal = CubicWallet.getBalance();
    if (currentBal < price) {
      alert(`Saldo Cubic Anda (${currentBal} ◆) belum cukup untuk membeli ${item.name} (${price} ◆).\n\nSelesaikan soal diagnostik (+10 ◆) atau modul remediasi (+15 ◆) untuk mengumpulkan lebih banyak Cubic!`);
      return;
    }

    const confirmBuy = confirm(`Beli "${item.name}" seharga ${price} ◆?`);
    if (!confirmBuy) return;

    const res = CubicWallet.deductCubic(price, `purchase_${item.id}`, `Pembelian Kosmetik: ${item.name}`);
    if (res.success) {
      CubicWallet.ownItem(itemId);
      this.previewConfig[item.category] = itemId;
      AvatarEngine.saveConfig(this.previewConfig);
      this.updateHeaderBalance();
      this.updatePreview();
      this.renderItemGrid();
    }
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
