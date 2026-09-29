/**
 * profileManager.js - Pengelola Profil & Nickname Siswa EPE V3
 * Memungkinkan siswa mengubah nama / nickname mereka sendiri dan
 * menyinkronkannya ke seluruh modul (Dashboard, Header, Diagnostik, Practice, Pre/Post-Test, Supabase)
 */

import { NotificationToast } from "../ui/notification.js";

const STORAGE_KEY = "epe_student_name";
const DEFAULT_NAME = "Ilyas";

export class ProfileManager {
  /**
   * Mengambil nama siswa saat ini
   * @returns {string}
   */
  static getStudentName() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        const cleaned = stored.trim().replace(/\s+/g, " ");
        // Jika masih placeholder bawaan lama, kembalikan nama bersih
        if (cleaned === "Siswa  Berbakat" || cleaned === "Siswa Berbakat" || cleaned === "Siswa_01") {
          return DEFAULT_NAME;
        }
        return cleaned;
      }
    } catch (e) {
      console.warn("Gagal membaca profile name dari localStorage:", e);
    }
    return DEFAULT_NAME;
  }

  /**
   * Mengambil objek profil lengkap siswa
   * @returns {{ name: string, grade: string }}
   */
  static getProfile() {
    return {
      name: this.getStudentName(),
      grade: localStorage.getItem("epe_student_grade") || "Kelas 7 / SMP"
    };
  }

  /**
   * Menyimpan nama siswa baru dan memperbarui UI di seluruh aplikasi
   * @param {string} newName
   * @returns {string}
   */
  static setStudentName(newName) {
    const cleanName = (newName || "").trim().replace(/\s+/g, " ") || DEFAULT_NAME;
    try {
      localStorage.setItem(STORAGE_KEY, cleanName);
    } catch (e) {
      console.warn("Gagal menyimpan profile name ke localStorage:", e);
    }

    // Perbarui semua elemen DOM terkait
    this.updateAllDOMElements(cleanName);

    // Broadcast event agar modul lain dapat merespons
    window.dispatchEvent(new CustomEvent("epe-profile-updated", {
      detail: { studentName: cleanName }
    }));

    return cleanName;
  }

  /**
   * Memperbarui seluruh elemen DOM yang menampilkan nama siswa
   * @param {string} name
   */
  static updateAllDOMElements(name = null) {
    const studentName = name || this.getStudentName();

    // 1. Dashboard Hero Name
    const dashEl = document.getElementById("dash-student-name");
    if (dashEl) dashEl.textContent = studentName;

    // 2. Header Avatar Tag Name
    const headerNameEl = document.getElementById("header-student-name");
    if (headerNameEl) headerNameEl.textContent = studentName;

    // 3. Diagnostic Student ID Input
    const diagInput = document.getElementById("student-id-input");
    if (diagInput) diagInput.value = studentName;

    // 4. Practice Bank Student Name Input
    const practiceInput = document.getElementById("practice-student-name");
    if (practiceInput) practiceInput.value = studentName;

    // 5. Avatar Lab Student Name Tag
    const avatarLabName = document.getElementById("avatar-lab-student-name");
    if (avatarLabName) avatarLabName.textContent = studentName;

    // 6. Avatar Modal Profile Name Tag
    const avatarNameEl = document.getElementById("avatar-profile-name-tag");
    if (avatarNameEl) avatarNameEl.textContent = studentName;

    // 7. Plain Text Research Output preview
    const outputPlain = document.getElementById("output-plain-text");
    if (outputPlain && outputPlain.textContent.includes("Nama pengguna/pribadi =")) {
      outputPlain.textContent = outputPlain.textContent.replace(
        /Nama pengguna\/pribadi = [^\n]+/,
        `Nama pengguna/pribadi = ${studentName}`
      );
    }

    // 8. Sidebar Student Name Tag
    const sidebarName = document.getElementById("sidebar-student-name");
    if (sidebarName) sidebarName.textContent = studentName;

    // 9. Floating Student Avatar Name Tag (Pojok Kanan Atas Melayang)
    const floatingName = document.getElementById("floating-student-name");
    if (floatingName) floatingName.textContent = studentName;

    // 10. Settings Hub Student Name Tag
    const settingsName = document.getElementById("settings-student-name");
    if (settingsName) settingsName.textContent = studentName;
  }

  /**
   * Tampilkan dialog/modal pengubahan nama yang interaktif
   */
  static promptEditNickname() {
    const currentName = this.getStudentName();
    const modal = document.getElementById("edit-nickname-modal");
    const input = document.getElementById("edit-nickname-input");
    
    if (modal && input) {
      input.value = currentName;
      modal.classList.remove("hidden");
      modal.style.zIndex = "2147483600";
      setTimeout(() => input.focus(), 50);
    } else {
      // Fallback native prompt jika modal belum terpasang
      const res = window.prompt("Masukkan nama atau nickname kamu:", currentName);
      if (res !== null && res.trim()) {
        this.setStudentName(res.trim());
      }
    }
  }

  /**
   * Inisialisasi awal saat aplikasi dimuat
   */
  static init() {
    if (typeof window !== "undefined") {
      window.ProfileManager = ProfileManager;
    }
    const currentName = this.getStudentName();
    this.updateAllDOMElements(currentName);

    // Event listener untuk tombol edit nickname
    const editBtn = document.getElementById("btn-edit-student-name");
    if (editBtn) {
      editBtn.addEventListener("click", () => this.promptEditNickname());
    }

    const settingsEditBtn = document.getElementById("settings-btn-edit-name");
    if (settingsEditBtn) {
      settingsEditBtn.addEventListener("click", () => this.promptEditNickname());
    }

    const headerAvatarBtn = document.getElementById("btn-header-avatar");
    // Tombol nama di header juga bisa trigger edit jika diklik ganda atau tombol edit khusus
    const headerEditBtn = document.getElementById("btn-edit-header-name");
    if (headerEditBtn) {
      headerEditBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.promptEditNickname();
      });
    }

    const sidebarStudentName = document.getElementById("sidebar-student-name");
    if (sidebarStudentName) {
      sidebarStudentName.style.cursor = "pointer";
      sidebarStudentName.title = "Klik untuk Ubah Nama Siswa";
      sidebarStudentName.addEventListener("click", () => this.promptEditNickname());
    }

    // Modal save / cancel buttons
    const modal = document.getElementById("edit-nickname-modal");
    const saveBtn = document.getElementById("btn-save-nickname");
    const cancelBtn = document.getElementById("btn-cancel-nickname");
    const input = document.getElementById("edit-nickname-input");

    if (saveBtn && input) {
      saveBtn.addEventListener("click", () => {
        const val = input.value.trim();
        if (val) {
          this.setStudentName(val);
          if (modal) modal.classList.add("hidden");
          
          // Tampilkan notifikasi toast langsung di depan muka pengguna (Z-index 2000000)
          NotificationToast.show(`✓ Nama identitas berhasil diperbarui: "${val}"`, "success", 3600);

          // Sinkronisasi teks nama di lab avatar dan header badge secara real-time
          const labName = document.getElementById("avatar-lab-student-name");
          if (labName) {
            labName.textContent = val;
            labName.classList.add("text-emerald-400");
            setTimeout(() => labName.classList.remove("text-emerald-400"), 1500);
          }
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveBtn.click();
        } else if (e.key === "Escape") {
          if (modal) modal.classList.add("hidden");
        }
      });
    }

    if (cancelBtn && modal) {
      cancelBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }
  }
}
