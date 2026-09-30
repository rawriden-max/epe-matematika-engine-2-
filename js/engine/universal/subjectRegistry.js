/**
 * subjectRegistry.js - Universal Subject Configuration Layer (EPE Universal Engine)
 * 
 * Memisahkan konfigurasi MATA PELAJARAN dari logika asesmen dan bank soal.
 * Menjamin bahwa sistem tidak terkunci pada matematika (Subject-Agnostic).
 */

export const SUBJECTS = {
  mathematics: {
    id: "mathematics",
    code: "MATH",
    name: "Matematika",
    icon: "📐",
    svgIcon: `<svg class="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="3,21 21,21 3,3"/><path d="M7 21v-4"/><path d="M11 21v-2"/><path d="M15 21v-4"/><path d="M3 17h4"/><path d="M3 13h2"/><path d="M3 9h4"/></svg>`,
    accentColor: "#3b82f6",
    badgeClass: "badge-math",
    description: "Aljabar, Persamaan Kuadrat, Kalkulus, Matriks, Trigonometri, dan Geometri",
    supportedQuestionTypes: [
      "multiple_choice",
      "numerical",
      "equation_based",
      "image_based",
      "structured_response"
    ],
    defaultTopics: [
      "Persamaan Kuadrat",
      "Faktorisasi Aljabar",
      "Rumus Kuadratik (ABC)",
      "Karakteristik Diskriminan",
      "Teorema Vieta",
      "Pemodelan Masalah Nyata",
      "Matriks & Determinan",
      "Barisan & Deret",
      "Logaritma"
    ],
    hasDiagnosticTaxonomy: true,
    taxonomyName: "EPE (E0–E4) Cognitive Error Taxonomy",
    engineKey: "MathematicsAnalysisEngine"
  },

  physics: {
    id: "physics",
    code: "PHYS",
    name: "Fisika",
    icon: "⚡",
    svgIcon: `<svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    accentColor: "#f59e0b",
    badgeClass: "badge-phys",
    description: "Kinematika Gerak, Hukum Newton, Usaha & Energi, Termodinamika, Listrik & Magnet",
    supportedQuestionTypes: [
      "multiple_choice",
      "numerical",
      "equation_based",
      "image_based",
      "structured_response"
    ],
    defaultTopics: [
      "Gerak Lurus & Parabola",
      "Dinamika Partikel & Hukum Newton",
      "Usaha, Energi & Daya",
      "Impuls & Momentum",
      "Termodinamika & Kalor",
      "Rangkaian Listrik Arus Searah"
    ],
    hasDiagnosticTaxonomy: false,
    taxonomyName: null,
    engineKey: "PhysicsAnalysisEngine"
  },

  chemistry: {
    id: "chemistry",
    code: "CHEM",
    name: "Kimia",
    icon: "🧪",
    svgIcon: `<svg class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2v7.31L4.1 19.33A2 2 0 0 0 5.8 22h12.4a2 2 0 0 0 1.7-2.67L14 9.31V2"/><line x1="8.5" y1="2" x2="15.5" y2="2"/><line x1="7" y1="16" x2="17" y2="16"/></svg>`,
    accentColor: "#10b981",
    badgeClass: "badge-chem",
    description: "Stoikiometri, Struktur Atom, Ikatan Kimia, Termokimia, Kesetimbangan, dan Asam-Basa",
    supportedQuestionTypes: [
      "multiple_choice",
      "numerical",
      "equation_based",
      "image_based",
      "structured_response"
    ],
    defaultTopics: [
      "Struktur Atom & Sistem Periodik",
      "Ikatan Kimia & Bentuk Molekul",
      "Stoikiometri & Hukum Dasar Kimia",
      "Termokimia & Entalpi Reaksi",
      "Laju Reaksi & Kesetimbangan Kimia",
      "Larutan Asam Basa & Titrasi"
    ],
    hasDiagnosticTaxonomy: false,
    taxonomyName: null,
    engineKey: "ChemistryAnalysisEngine"
  },

  biology: {
    id: "biology",
    code: "BIO",
    name: "Biologi",
    icon: "🧬",
    svgIcon: `<svg class="w-3.5 h-3.5 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9l2 2m8-4l2 2m-10 6l2 2"/></svg>`,
    accentColor: "#ec4899",
    badgeClass: "badge-bio",
    description: "Biologi Sel, Genetika, Metabolisme, Sistem Organ Manusia, dan Ekologi",
    supportedQuestionTypes: [
      "multiple_choice",
      "true_false",
      "image_based",
      "structured_response",
      "essay"
    ],
    defaultTopics: [
      "Struktur & Fungsi Sel",
      "Enzim & Metabolisme Seluler",
      "Genetika & Hereditas Mendel",
      "Sistem Sirkulasi & Respirasi",
      "Ekosistem & Keanekaragaman Hayati"
    ],
    hasDiagnosticTaxonomy: false,
    taxonomyName: null,
    engineKey: "BiologyAnalysisEngine"
  },

  computer_science: {
    id: "computer_science",
    code: "CS",
    name: "Informatika / Ilmu Komputer",
    icon: "💻",
    svgIcon: `<svg class="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="6" y1="8" x2="10" y2="12"/><line x1="6" y1="12" x2="10" y2="8"/><line x1="13" y1="12" x2="17" y2="12"/></svg>`,
    accentColor: "#8b5cf6",
    badgeClass: "badge-cs",
    description: "Berpikir Komputasional, Algoritma Pemrograman, Analisis Data, dan Logika Biner",
    supportedQuestionTypes: [
      "multiple_choice",
      "structured_response",
      "short_answer",
      "numerical"
    ],
    defaultTopics: [
      "Berpikir Komputasional (Decomposisi & Abstraksi)",
      "Logika Proposisi & Aljabar Boolean",
      "Struktur Kontrol (Percabangan & Perulangan)",
      "Array & Struktur Data Linear",
      "Kompleksitas Algoritma Dasar"
    ],
    hasDiagnosticTaxonomy: false,
    taxonomyName: null,
    engineKey: "ComputerScienceAnalysisEngine"
  }
};

const STORAGE_KEY_CUSTOM_SUBJECTS = "epe_custom_subjects";
const STORAGE_KEY_CUSTOM_TOPICS = "epe_custom_topics";
const STORAGE_KEY_DELETED_SUBJECTS = "epe_deleted_subjects";
const STORAGE_KEY_DELETED_TOPICS = "epe_deleted_topics";

export class SubjectRegistry {
  /**
   * Mengambil semua subjek terdaftar (Bawaan + Kustom Guru, dikurangi yang dihapus)
   */
  static getAllSubjects() {
    let list = Object.values(SUBJECTS);
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_SUBJECTS);
      if (stored) {
        const custom = JSON.parse(stored);
        if (Array.isArray(custom)) {
          custom.forEach(cs => {
            if (cs && cs.id && !list.find(item => item.id === cs.id)) {
              list.push(cs);
            }
          });
        }
      }

      // Filter subjek yang dihapus
      const delStored = localStorage.getItem(STORAGE_KEY_DELETED_SUBJECTS);
      if (delStored) {
        const delSubjs = JSON.parse(delStored) || [];
        if (Array.isArray(delSubjs) && delSubjs.length > 0) {
          list = list.filter(item => !delSubjs.includes(item.id));
        }
      }
    } catch (e) {
      console.warn("Gagal membaca subjek kustom:", e);
    }
    return list;
  }

  /**
   * Mengambil konfigurasi subjek berdasarkan ID
   */
  static getSubject(subjectId) {
    if (!subjectId) return SUBJECTS.mathematics;
    const cleanId = subjectId.toLowerCase().trim();
    const aliasMap = {
      matematika: "mathematics",
      math: "mathematics",
      fisika: "physics",
      kimia: "chemistry",
      biologi: "biology",
      informatika: "informatics"
    };
    const targetId = aliasMap[cleanId] || cleanId;
    const all = this.getAllSubjects();
    return all.find(s => s.id === targetId || s.id === cleanId || s.name?.toLowerCase() === cleanId) || SUBJECTS[targetId] || SUBJECTS[cleanId] || SUBJECTS.mathematics;
  }

  /**
   * Menambahkan Bidang / Mata Pelajaran Baru Secara Dinamis
   */
  static addSubject({ id, name, code, icon = "📚", accentColor = "#6366f1", description = "", defaultTopics = [] }) {
    if (!name || !name.trim()) throw new Error("Nama mata pelajaran/bidang wajib diisi.");
    const cleanId = (id || name.toLowerCase().replace(/[^a-z0-9]/g, "_")).trim();
    const cleanCode = (code || name.slice(0, 4).toUpperCase()).trim();

    // Hapus dari daftar deleted jika sebelumnya pernah dihapus
    try {
      const delStored = localStorage.getItem(STORAGE_KEY_DELETED_SUBJECTS);
      if (delStored) {
        let delSubjs = JSON.parse(delStored) || [];
        delSubjs = delSubjs.filter(x => x !== cleanId);
        localStorage.setItem(STORAGE_KEY_DELETED_SUBJECTS, JSON.stringify(delSubjs));
      }
    } catch (e) {}

    const newSubject = {
      id: cleanId,
      code: cleanCode,
      name: name.trim(),
      icon: icon || "📚",
      svgIcon: `<svg class="w-3.5 h-3.5" style="color: ${accentColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
      accentColor: accentColor || "#6366f1",
      badgeClass: `badge-${cleanId}`,
      description: description || `Bidang studi ${name.trim()}`,
      supportedQuestionTypes: ["multiple_choice", "numerical", "structured_response"],
      defaultTopics: Array.isArray(defaultTopics) ? defaultTopics : [],
      hasDiagnosticTaxonomy: false,
      taxonomyName: null,
      isCustom: true
    };

    try {
      let customList = [];
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_SUBJECTS);
      if (stored) customList = JSON.parse(stored) || [];
      const existIdx = customList.findIndex(c => c.id === cleanId);
      if (existIdx >= 0) {
        customList[existIdx] = newSubject;
      } else {
        customList.push(newSubject);
      }
      localStorage.setItem(STORAGE_KEY_CUSTOM_SUBJECTS, JSON.stringify(customList));
    } catch (e) {
      console.warn("Gagal menyimpan subjek kustom ke storage:", e);
    }

    return newSubject;
  }

  /**
   * Menghapus Halaman / Bidang Studi (Mata Pelajaran)
   */
  static deleteSubject(subjectId) {
    if (!subjectId) return false;
    const cleanId = subjectId.toLowerCase().trim();

    try {
      // 1. Catat ke daftar subjek terhapus
      let delSubjs = [];
      const delStored = localStorage.getItem(STORAGE_KEY_DELETED_SUBJECTS);
      if (delStored) delSubjs = JSON.parse(delStored) || [];
      if (!delSubjs.includes(cleanId)) {
        delSubjs.push(cleanId);
        localStorage.setItem(STORAGE_KEY_DELETED_SUBJECTS, JSON.stringify(delSubjs));
      }

      // 2. Hapus dari custom subjects jika ada
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_SUBJECTS);
      if (stored) {
        let customList = JSON.parse(stored) || [];
        customList = customList.filter(c => c.id !== cleanId);
        localStorage.setItem(STORAGE_KEY_CUSTOM_SUBJECTS, JSON.stringify(customList));
      }

      // 3. Bersihkan custom topics terkait
      const storedTopics = localStorage.getItem(STORAGE_KEY_CUSTOM_TOPICS);
      if (storedTopics) {
        const customMap = JSON.parse(storedTopics) || {};
        delete customMap[cleanId];
        localStorage.setItem(STORAGE_KEY_CUSTOM_TOPICS, JSON.stringify(customMap));
      }

      return true;
    } catch (e) {
      console.warn("Gagal menghapus subjek:", e);
      return false;
    }
  }

  /**
   * Mengecek apakah subjek memiliki taksonomi diagnostik aktif
   */
  static hasActiveTaxonomy(subjectId) {
    const s = this.getSubject(subjectId);
    return s ? Boolean(s.hasDiagnosticTaxonomy) : false;
  }

  /**
   * Mengambil daftar topik / sub-halaman berdasarkan subjek (bawaan + kustom, dikurangi yang dihapus)
   */
  static getTopicsForSubject(subjectId) {
    const s = this.getSubject(subjectId);
    let topics = s && Array.isArray(s.defaultTopics) ? [...s.defaultTopics] : [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_TOPICS);
      if (stored) {
        const customMap = JSON.parse(stored) || {};
        const subjectCustom = customMap[s.id];
        if (Array.isArray(subjectCustom)) {
          subjectCustom.forEach(top => {
            if (top && !topics.includes(top)) {
              topics.push(top);
            }
          });
        }
      }

      // Filter topik yang telah dihapus
      const delStored = localStorage.getItem(STORAGE_KEY_DELETED_TOPICS);
      if (delStored) {
        const delMap = JSON.parse(delStored) || {};
        const deletedForSubj = delMap[s.id] || [];
        if (Array.isArray(deletedForSubj) && deletedForSubj.length > 0) {
          topics = topics.filter(t => !deletedForSubj.includes(t));
        }
      }
    } catch (e) {
      console.warn("Gagal membaca topik kustom:", e);
    }

    return topics;
  }

  /**
   * Menambahkan Sub-Halaman / Topik Baru ke Dalam Suatu Bidang (Misal: Persamaan Kuadrat)
   */
  static addTopicToSubject(subjectId, topicName) {
    if (!topicName || !topicName.trim()) throw new Error("Nama sub-halaman / topik materi wajib diisi.");
    const cleanTopic = topicName.trim();
    const s = this.getSubject(subjectId);

    try {
      // Hapus dari deleted topics jika pernah dihapus
      const delStored = localStorage.getItem(STORAGE_KEY_DELETED_TOPICS);
      if (delStored) {
        let delMap = JSON.parse(delStored) || {};
        if (Array.isArray(delMap[s.id])) {
          delMap[s.id] = delMap[s.id].filter(t => t !== cleanTopic);
          localStorage.setItem(STORAGE_KEY_DELETED_TOPICS, JSON.stringify(delMap));
        }
      }

      let customMap = {};
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_TOPICS);
      if (stored) customMap = JSON.parse(stored) || {};
      if (!Array.isArray(customMap[s.id])) {
        customMap[s.id] = [];
      }
      if (!customMap[s.id].includes(cleanTopic)) {
        customMap[s.id].push(cleanTopic);
        localStorage.setItem(STORAGE_KEY_CUSTOM_TOPICS, JSON.stringify(customMap));
      }
    } catch (e) {
      console.warn("Gagal menyimpan topik kustom:", e);
    }

    return cleanTopic;
  }

  /**
   * Menghapus Sub-Halaman / Topik dari Suatu Bidang
   */
  static deleteTopicFromSubject(subjectId, topicName) {
    if (!subjectId || !topicName) return false;
    const cleanTopic = topicName.trim();
    const s = this.getSubject(subjectId);
    if (!s) return false;

    try {
      // 1. Catat ke daftar topik terhapus
      let delMap = {};
      const delStored = localStorage.getItem(STORAGE_KEY_DELETED_TOPICS);
      if (delStored) delMap = JSON.parse(delStored) || {};
      if (!Array.isArray(delMap[s.id])) delMap[s.id] = [];
      if (!delMap[s.id].includes(cleanTopic)) {
        delMap[s.id].push(cleanTopic);
        localStorage.setItem(STORAGE_KEY_DELETED_TOPICS, JSON.stringify(delMap));
      }

      // 2. Hapus dari custom topics jika ada
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_TOPICS);
      if (stored) {
        const customMap = JSON.parse(stored) || {};
        if (Array.isArray(customMap[s.id])) {
          customMap[s.id] = customMap[s.id].filter(t => t !== cleanTopic);
          localStorage.setItem(STORAGE_KEY_CUSTOM_TOPICS, JSON.stringify(customMap));
        }
      }
      return true;
    } catch (e) {
      console.warn("Gagal menghapus topik kustom:", e);
      return false;
    }
  }

  /**
   * Mengambil ikon SVG futuristik minimalis untuk subjek
   */
  static getSubjectSvg(subjectId, customClass = "w-3.5 h-3.5") {
    const s = this.getSubject(subjectId);
    if (!s || !s.svgIcon) {
      return `<svg class="${customClass}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`;
    }
    if (customClass) {
      return s.svgIcon.replace(/class="[^"]*"/, `class="${customClass}"`);
    }
    return s.svgIcon;
  }
}
