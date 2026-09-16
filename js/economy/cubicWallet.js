/**
 * cubicWallet.js - EPE V2.1 Virtual Cubic Wallet & Ownership Manager
 * 
 * Mengelola saldo virtual currency '◆' (Cubic) siswa, status kepemilikan item kosmetik,
 * serta modal interaktif untuk melihat rincian saldo dan buku besar mutasi transaksi.
 */

import { CubicTransactions } from "./cubicTransactions.js";
import { COSMETIC_CATALOG } from "../avatar/avatarCatalog.js";

const WALLET_KEY = "epe_cubic_wallet";
const OWNED_KEY = "epe_owned_cosmetics";
const INITIAL_STARTER_BALANCE = 100; // Bonus modal awal siswa baru

export class CubicWallet {
  /**
   * Mengambil saldo Cubic saat ini
   */
  static getBalance() {
    try {
      const val = localStorage.getItem(WALLET_KEY);
      if (val !== null) {
        return parseInt(val, 10) || 0;
      }
      // Inisialisasi awal untuk siswa pertama kali buka
      localStorage.setItem(WALLET_KEY, String(INITIAL_STARTER_BALANCE));
      CubicTransactions.record({
        type: "reward",
        amount: INITIAL_STARTER_BALANCE,
        source: "starter_grant",
        description: "Modal Awal Peneliti Baru EPE V2.1",
        balanceAfter: INITIAL_STARTER_BALANCE
      });
      return INITIAL_STARTER_BALANCE;
    } catch (e) {
      console.warn("Gagal membaca saldo wallet:", e);
      return 0;
    }
  }

  /**
   * Menambahkan Cubic ke wallet
   */
  static addCubic(amount, source = "reward", description = "Perolehan Cubic") {
    const addVal = Math.max(0, parseInt(amount, 10) || 0);
    if (addVal === 0) return this.getBalance();

    const current = this.getBalance();
    const newBal = current + addVal;
    localStorage.setItem(WALLET_KEY, String(newBal));

    CubicTransactions.record({
      type: "reward",
      amount: addVal,
      source,
      description,
      balanceAfter: newBal
    });

    window.dispatchEvent(new CustomEvent("epe-cubic-balance-updated", { detail: { balance: newBal, delta: addVal } }));
    return newBal;
  }

  /**
   * Mengurangi Cubic untuk pembelian kosmetik di Avatar Lab
   */
  static deductCubic(amount, source = "shop_purchase", description = "Pembelian Kosmetik") {
    const cost = Math.max(0, parseInt(amount, 10) || 0);
    const current = this.getBalance();

    if (current < cost) {
      return { success: false, reason: "Saldo Cubic tidak mencukupi." };
    }

    const newBal = current - cost;
    localStorage.setItem(WALLET_KEY, String(newBal));

    CubicTransactions.record({
      type: "purchase",
      amount: -cost,
      source,
      description,
      balanceAfter: newBal
    });

    window.dispatchEvent(new CustomEvent("epe-cubic-balance-updated", { detail: { balance: newBal, delta: -cost } }));
    return { success: true, newBalance: newBal };
  }

  /**
   * Mengambil daftar ID item kosmetik yang sudah dimiliki siswa
   */
  static getOwnedItemIds() {
    try {
      const raw = localStorage.getItem(OWNED_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Gagal membaca daftar item kosmetik:", e);
    }

    // Default: Semua item berstatus unlockCondition: 'default'
    const defaultIds = COSMETIC_CATALOG.filter((it) => it.unlockCondition === "default").map((it) => it.id);
    localStorage.setItem(OWNED_KEY, JSON.stringify(defaultIds));
    return defaultIds;
  }

  /**
   * Cek apakah item sudah dimiliki
   */
  static isOwned(itemId) {
    const owned = this.getOwnedItemIds();
    return owned.includes(itemId);
  }

  /**
   * Menambahkan item ke daftar koleksi yang dimiliki
   */
  static ownItem(itemId) {
    const owned = this.getOwnedItemIds();
    if (!owned.includes(itemId)) {
      owned.push(itemId);
      localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
      window.dispatchEvent(new CustomEvent("epe-cosmetics-updated", { detail: { owned } }));
    }
    return true;
  }

  /**
   * Membuka modal riwayat mutasi dompet Cubic
   */
  static openWalletModal() {
    let modal = document.getElementById("cubic-wallet-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "cubic-wallet-modal";
      modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop";
      document.body.appendChild(modal);
    }

    const currentBal = this.getBalance();
    const transactions = CubicTransactions.getTransactions();

    modal.innerHTML = `
      <div class="card-clean max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-700 bg-slate-900/95 text-white backdrop-blur-xl">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-base border border-cyan-500/30">◆</span>
            <div>
              <h3 class="text-sm font-bold text-white">Dompet & Mutasi Cubic (◆)</h3>
              <p class="text-[11px] text-slate-400">Virtual Learning Currency EPE V2.1</p>
            </div>
          </div>
          <button id="btn-close-wallet-modal" class="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </div>

        <!-- Balance Card -->
        <div class="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-slate-900/60 to-cyan-950/60 border border-cyan-500/30 flex items-center justify-between shadow-inner">
          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block mb-0.5">Saldo Aktif Saat Ini</span>
            <div class="text-2xl font-black text-white flex items-center gap-2">
              <span class="text-cyan-400">◆</span> ${currentBal.toLocaleString("id-ID")}
            </div>
          </div>
          <div class="text-right text-[11px] text-slate-300">
            <p>Diperoleh dari:</p>
            <p class="text-emerald-400 font-semibold">• Soal Diagnostik (+10 ◆)</p>
            <p class="text-purple-400 font-semibold">• Modul Remediasi (+15 ◆)</p>
          </div>
        </div>

        <!-- Transaction History List -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-slate-300">Riwayat Mutasi Terkini</h4>
            <span class="text-[10px] text-slate-500">${transactions.length} transaksi</span>
          </div>

          <div class="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
            ${
              transactions.length === 0
                ? `<div class="p-6 text-center text-slate-500 text-xs italic">Belum ada mutasi Cubic tercatat.</div>`
                : transactions
                    .map((tx) => {
                      const isPlus = tx.amount > 0;
                      const dateStr = new Date(tx.timestamp).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      const badgeBg = isPlus ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30";

                      return `
                        <div class="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors">
                          <div class="space-y-0.5">
                            <p class="font-semibold text-white">${tx.description}</p>
                            <p class="text-[10px] text-slate-400">${dateStr} &bull; <span class="font-mono">${tx.source}</span></p>
                          </div>
                          <div class="text-right">
                            <span class="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono border ${badgeBg}">
                              ${isPlus ? "+" : ""}${tx.amount} ◆
                            </span>
                            <span class="block text-[10px] text-slate-400 font-mono mt-0.5">Saldo: ${tx.balanceAfter} ◆</span>
                          </div>
                        </div>
                      `;
                    })
                    .join("")
            }
          </div>
        </div>

        <!-- Footer Notice -->
        <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Proses belajar Anda bernilai dan dihargai.</span>
          <button id="btn-wallet-open-lab" class="btn-primary text-xs py-1.5 px-3">Buka Avatar Lab</button>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");

    modal.querySelector("#btn-close-wallet-modal").addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    const openLabBtn = modal.querySelector("#btn-wallet-open-lab");
    if (openLabBtn) {
      openLabBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        window.dispatchEvent(new CustomEvent("epe-open-avatar-lab"));
      });
    }
  }
}
