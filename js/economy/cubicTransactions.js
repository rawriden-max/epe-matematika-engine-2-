/**
 * cubicTransactions.js - EPE V3 Cubic Ledger & Transaction History
 * 
 * Mencatat setiap mutasi virtual currency (Cubic '◆'):
 * - Reward (perolehan dari diagnostic, remediation, latihan mandiri)
 * - Purchase (pembelian item cosmetic di Avatar Lab)
 * - Unlock (item diperoleh via achievement / milestone)
 */

const STORAGE_KEY = "epe_cubic_transactions";
const MAX_HISTORY_ITEMS = 100;

export class CubicTransactions {
  /**
   * Mengambil riwayat transaksi dari localStorage (terurut terbaru ke terlama)
   */
  static getTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Gagal membaca transaksi Cubic:", e);
    }
    return [];
  }

  /**
   * Mencatat transaksi baru ke dalam buku besar
   * @param {Object} txData { type: 'reward'|'purchase'|'achievement', amount: number, source: string, description: string, balanceAfter: number }
   */
  static record({ type = "reward", amount = 0, source = "system", description = "", balanceAfter = 0 }) {
    try {
      const history = this.getTransactions();
      const newTx = {
        id: "tx_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        type, // 'reward' | 'purchase' | 'achievement'
        amount: Number(amount),
        source, // 'diagnostic_q1', 'remediation_d2', 'shop_purchase', etc.
        description,
        balanceAfter: Number(balanceAfter)
      };

      history.unshift(newTx);
      if (history.length > MAX_HISTORY_ITEMS) {
        history.length = MAX_HISTORY_ITEMS;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      window.dispatchEvent(new CustomEvent("epe-cubic-transaction-added", { detail: newTx }));
      return newTx;
    } catch (e) {
      console.error("Gagal mencatat transaksi Cubic:", e);
      return null;
    }
  }

  /**
   * Format mata uang Cubic dengan simbol resmi
   */
  static formatCubic(amount) {
    const num = Number(amount) || 0;
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toLocaleString("id-ID")} ◆`;
  }
}
