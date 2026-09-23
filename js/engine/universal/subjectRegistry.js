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

export class SubjectRegistry {
  /**
   * Mengambil semua subjek terdaftar
   */
  static getAllSubjects() {
    return Object.values(SUBJECTS);
  }

  /**
   * Mengambil konfigurasi subjek berdasarkan ID
   */
  static getSubject(subjectId) {
    if (!subjectId) return SUBJECTS.mathematics;
    const cleanId = subjectId.toLowerCase().trim();
    return SUBJECTS[cleanId] || SUBJECTS.mathematics;
  }

  /**
   * Mengecek apakah subjek memiliki taksonomi diagnostik aktif
   */
  static hasActiveTaxonomy(subjectId) {
    const s = this.getSubject(subjectId);
    return s ? Boolean(s.hasDiagnosticTaxonomy) : false;
  }

  /**
   * Mengambil daftar topik standar berdasarkan subjek
   */
  static getTopicsForSubject(subjectId) {
    const s = this.getSubject(subjectId);
    return s && Array.isArray(s.defaultTopics) ? [...s.defaultTopics] : [];
  }

  /**
   * Mengambil ikon SVG futuristik minimalis untuk subjek
   */
  static getSubjectSvg(subjectId, customClass = "w-3.5 h-3.5") {
    const s = this.getSubject(subjectId);
    if (!s || !s.svgIcon) return "";
    if (customClass) {
      return s.svgIcon.replace(/class="[^"]*"/, `class="${customClass}"`);
    }
    return s.svgIcon;
  }
}
