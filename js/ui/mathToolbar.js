/**
 * mathToolbar.js - Helper Interaktif Sisip Simbol Matematika
 * Error Pattern Engine (EPE)
 */

export class MathToolbar {
  /**
   * Menyisipkan teks/simbol ke dalam textarea pada posisi kursor saat ini
   * @param {HTMLTextAreaElement|HTMLInputElement} targetElement
   * @param {string} symbol - Simbol atau template string yang akan disisipkan
   */
  static insertSymbol(targetElement, symbol) {
    if (!targetElement) return;

    const startPos = targetElement.selectionStart || 0;
    const endPos = targetElement.selectionEnd || 0;
    const originalValue = targetElement.value || "";

    const newValue =
      originalValue.substring(0, startPos) +
      symbol +
      originalValue.substring(endPos, originalValue.length);

    targetElement.value = newValue;

    // Kembalikan fokus dan atur posisi kursor setelah simbol yang disisipkan
    targetElement.focus();
    const newCursorPos = startPos + symbol.length;
    targetElement.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger event input agar listener form reaktif
    targetElement.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /**
   * Daftar tombol simbol matematika standar yang disediakan di toolbar
   */
  static getSymbols() {
    return [
      { label: "x²", value: "x²", tooltip: "Variabel x kuadrat" },
      { label: "±", value: "±", tooltip: "Tanda plus-minus" },
      { label: "√", value: "√()", tooltip: "Bentuk akar kuadrat" },
      { label: "x₁", value: "x₁", tooltip: "Akar pertama x1" },
      { label: "x₂", value: "x₂", tooltip: "Akar kedua x2" },
      { label: "D", value: "D = b² - 4ac", tooltip: "Rumus Diskriminan" },
      { label: "ABC", value: "x = [-b ± √(b² - 4ac)] / (2a)", tooltip: "Rumus Kuadratik ABC" },
      { label: "≤", value: "≤", tooltip: "Kurang dari atau sama dengan" },
      { label: "≥", value: "≥", tooltip: "Lebih dari atau sama dengan" },
      { label: "≠", value: "≠", tooltip: "Tidak sama dengan" },
      { label: "a/b", value: "() / ()", tooltip: "Pecahan pembagian" }
    ];
  }
}
