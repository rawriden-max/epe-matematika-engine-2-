/**
 * avatarCatalog.js - EPE V2.1 Cosmetic Item Catalog
 * 
 * 6 Kategori Kustomisasi:
 * - face: Bentuk wajah dan ekspresi
 * - hair: Gaya rambut futuristik & pelajar (Pria & Wanita lengkap dari Gratis s.d. Legendary)
 * - outfit: Pakaian riset & pelajar sci-fi
 * - accessory: Kacamata AR, headset data, ornamen matematika, halo
 * - aura: Pendaran energi kognitif (Cyan, Violet, Crystal, Supernova Gold)
 * - background: Latar belakang kartu avatar (Lab, Cosmic, Geometric, Blueprint)
 */

export const AVATAR_CATEGORIES = [
  { id: "face", name: "Wajah", icon: "👤" },
  { id: "hair", name: "Rambut", icon: "💇" },
  { id: "outfit", name: "Pakaian", icon: "🥋" },
  { id: "accessory", name: "Aksesoris", icon: "👓" },
  { id: "aura", name: "Aura", icon: "✨" },
  { id: "background", name: "Latar", icon: "🌌" }
];

export const DEFAULT_AVATAR_CONFIG = {
  face: "face_default",
  hair: "hair_short_black",
  outfit: "outfit_cadet",
  accessory: "acc_none",
  aura: "aura_none",
  background: "bg_deep_space"
};

export const COSMETIC_CATALOG = [
  // =========================================================================
  // 1. FACE (Bentuk Wajah & Ekspresi)
  // =========================================================================
  {
    id: "face_default",
    name: "Wajah Netral Fokus",
    category: "face",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    skinColor: "#fcd34d",
    blushColor: "rgba(244, 63, 94, 0.2)",
    eyeType: "focused",
    mouthType: "smile",
    description: "Ekspresi tenang seorang pelajar matematika analitis."
  },
  {
    id: "face_curious",
    name: "Wajah Antusias Ceria",
    category: "face",
    price: 30,
    rarity: "common",
    unlockCondition: "shop",
    skinColor: "#fed7aa",
    blushColor: "rgba(244, 63, 94, 0.35)",
    eyeType: "sparkle",
    mouthType: "open_smile",
    description: "Mata berbinar penuh rasa ingin tahu terhadap pola aljabar."
  },
  {
    id: "face_scholar",
    name: "Wajah Peneliti Kritis",
    category: "face",
    price: 60,
    rarity: "rare",
    unlockCondition: "shop",
    skinColor: "#fde68a",
    blushColor: "rgba(244, 63, 94, 0.15)",
    eyeType: "calculating",
    mouthType: "confident",
    description: "Sorot mata tajam yang mampu mendeteksi kekeliruan aljabar terkecil."
  },
  {
    id: "face_cyborg",
    name: "Cybernetic Pupil",
    category: "face",
    price: 150,
    rarity: "epic",
    unlockCondition: "shop",
    skinColor: "#e2e8f0",
    blushColor: "rgba(37, 99, 235, 0.2)",
    eyeType: "cyber_lens",
    mouthType: "calm",
    description: "Lensa augmentasi optik terintegrasi dengan Matrix Neural Network."
  },

  // =========================================================================
  // 2. HAIR (Gaya Rambut Pria & Wanita - Gratis s.d. Legendary)
  // =========================================================================
  // 2. HAIR (Gaya Rambut Pria & Wanita)
  // =========================================================================
  // --- Gratis / Default ---
  {
    id: "hair_short_black",
    name: "Rambut Pendek Pelajar (Pria)",
    category: "hair",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    hairColor: "#1e293b",
    hairStyle: "neat_crop",
    gender: "male",
    description: "Potongan rambut pendek rapi bervolume penuh khas siswa berprestasi."
  },
  {
    id: "hair_female_bob",
    name: "Bob Sebahu Pelajar (Perempuan)",
    category: "hair",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    hairColor: "#1e293b",
    hairStyle: "bob_cut",
    gender: "female",
    description: "Gaya rambut bob rapi sebahu berponi depan manis yang membingkai wajah."
  },
  {
    id: "hair_female_hijab",
    name: "Hijab Pelajar Modern (Perempuan)",
    category: "hair",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    hairColor: "#1e3a8a",
    hairStyle: "hijab_modern",
    gender: "female",
    description: "Jilbab anggun rapi bernuansa navy dengan inner cap ciput tertata rapi."
  },

  // --- Common Shop ---
  {
    id: "hair_male_sidepart",
    name: "Belah Samping Klasik (Pria)",
    category: "hair",
    price: 35,
    rarity: "common",
    unlockCondition: "shop",
    hairColor: "#334155",
    hairStyle: "side_part_sleek",
    gender: "male",
    description: "Potongan formal belah samping rapi nan karismatik dengan volume tebal."
  },
  {
    id: "hair_female_long_black",
    name: "Rambut Panjang Anggun (Perempuan)",
    category: "hair",
    price: 45,
    rarity: "common",
    unlockCondition: "shop",
    hairColor: "#0f172a",
    hairStyle: "long_straight",
    gender: "female",
    description: "Rambut hitam lurus panjang tebal berkilau yang terurai anggun melewati bahu."
  },
  {
    id: "hair_male_undercut",
    name: "Undercut Modern (Pria)",
    category: "hair",
    price: 50,
    rarity: "common",
    unlockCondition: "shop",
    hairColor: "#1e293b",
    hairStyle: "undercut_fade",
    gender: "male",
    description: "Gaya undercut trendi bervolume jambul tegas dengan gradasi sisi samping rapi."
  },

  // --- Rare Shop ---
  {
    id: "hair_male_spiky",
    name: "Spiky Anime Energik (Pria)",
    category: "hair",
    price: 75,
    rarity: "rare",
    unlockCondition: "shop",
    hairColor: "#475569",
    hairStyle: "spiky_anime",
    gender: "male",
    description: "Rambut jabrik bertekstur runcing penuh energi layaknya karakter protagonis anime."
  },
  {
    id: "hair_female_curly_amber",
    name: "Ikal Caramel Ceria (Perempuan)",
    category: "hair",
    price: 85,
    rarity: "rare",
    unlockCondition: "shop",
    hairColor: "#d97706",
    hairStyle: "curly_bouncy",
    gender: "female",
    description: "Rambut ikal mengembang warna amber karamel yang hangat, tebal, dan ceria."
  },
  {
    id: "hair_male_curly",
    name: "Ikal Pendek Karismatik (Pria)",
    category: "hair",
    price: 85,
    rarity: "rare",
    unlockCondition: "shop",
    hairColor: "#78350f",
    hairStyle: "curly_short_male",
    gender: "male",
    description: "Rambut ikal pendek bergelombang tebal bervolume yang membingkai dahi dengan keren."
  },
  {
    id: "hair_female_ponytail",
    name: "Kuncir Kuda Dinamis (Perempuan)",
    category: "hair",
    price: 95,
    rarity: "rare",
    unlockCondition: "shop",
    hairColor: "#7c3aed",
    hairStyle: "high_ponytail",
    gender: "female",
    description: "High ponytail sporty dengan pita futuristik ungu lavender dan poni tertata rapi."
  },

  // --- Epic Shop / Achievement ---
  {
    id: "hair_messy_blue",
    name: "Electric Blue Waves (Pria)",
    category: "hair",
    price: 120,
    rarity: "epic",
    unlockCondition: "shop",
    hairColor: "#2563eb",
    hairStyle: "wavy_spikes",
    gender: "male",
    description: "Gaya rambut bergelombang energik dengan highlight biru neon bercahaya."
  },
  {
    id: "hair_female_twintail_neon",
    name: "Twin Tails Siber Harajuku (Perempuan)",
    category: "hair",
    price: 190,
    rarity: "epic",
    unlockCondition: "shop",
    hairColor: "#ec4899",
    hairStyle: "twin_tails_anime",
    gender: "female",
    description: "Kuncir dua tinggi mengembang dengan aksen magenta elektrik bergaya anime siber."
  },
  {
    id: "hair_quantum_cyan",
    name: "Quantum Flow Glow (Unisex)",
    category: "hair",
    price: 200,
    rarity: "epic",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_diag_half",
    hairColor: "#06b6d4",
    hairStyle: "flowing_luminescence",
    gender: "unisex",
    description: "Rambut holografik yang dialiri partikel kuantum pendaran cyan bersinar."
  },

  // --- Legendary Achievement ---
  {
    id: "hair_female_celestial_crown",
    name: "Mahkota Bintang Surgawi (Perempuan)",
    category: "hair",
    price: 350,
    rarity: "legendary",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_diag_complete",
    hairColor: "#f1f5f9",
    hairStyle: "celestial_goddess",
    gender: "female",
    description: "Rambut perak panjang melayang terurai dengan tiara mahkota bintang emas bercahaya."
  },

  // =========================================================================
  // 3. OUTFIT (Pakaian Pelajar & Riset)
  // =========================================================================
  {
    id: "outfit_cadet",
    name: "Seragam Kadet EPE",
    category: "outfit",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    primaryColor: "#1e3a8a",
    accentColor: "#38bdf8",
    description: "Jaket pelajar modern berkerah putih standar laboratorium EPE."
  },
  {
    id: "outfit_hoodie_cyber",
    name: "Matrix Neon Hoodie",
    category: "outfit",
    price: 65,
    rarity: "common",
    unlockCondition: "shop",
    primaryColor: "#1e293b",
    accentColor: "#0ea5e9",
    description: "Hoodie santai gelap beraksen tali cyan Matrix yang nyaman untuk belajar malam."
  },
  {
    id: "outfit_research_coat",
    name: "Jas Laboratorium Pakar",
    category: "outfit",
    price: 120,
    rarity: "rare",
    unlockCondition: "shop",
    primaryColor: "#f8fafc",
    accentColor: "#3b82f6",
    description: "Jas riset putih bersih dengan lencana identifikasi peneliti EPE V2."
  },
  {
    id: "outfit_quantum_suit",
    name: "Quantum Pilot Exosuit",
    category: "outfit",
    price: 280,
    rarity: "epic",
    unlockCondition: "shop",
    primaryColor: "#090d16",
    accentColor: "#06b6d4",
    description: "Baju zirah ringan berlapis graphene penahan fluktuasi medan matematika."
  },
  {
    id: "outfit_grandmaster",
    name: "Jubah Grandmaster Aljabar",
    category: "outfit",
    price: 500,
    rarity: "legendary",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_diag_complete",
    primaryColor: "#3b0764",
    accentColor: "#f59e0b",
    description: "Jubah kehormatan ungu keemasan bagi siswa penakluk seluruh 24 soal diagnostik!"
  },

  // =========================================================================
  // 4. ACCESSORY (Kacamata, Headset, Visor, Monocle, Halo)
  // =========================================================================
  {
    id: "acc_none",
    name: "Tanpa Aksesoris",
    category: "accessory",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    description: "Tampilan bersih tanpa aksesoris wajah tambahan."
  },
  {
    id: "acc_wire_glasses",
    name: "Kacamata Frame Lingkaran",
    category: "accessory",
    price: 40,
    rarity: "common",
    unlockCondition: "shop",
    glassColor: "#38bdf8",
    description: "Kacamata bulat geometris bergaya cendekiawan muda."
  },
  {
    id: "acc_ar_visor",
    name: "Visor Analisis Data AR",
    category: "accessory",
    price: 95,
    rarity: "rare",
    unlockCondition: "shop",
    glassColor: "#22d3ee",
    description: "Kacamata HUD transparan yang memproyeksikan data rumus langsung ke mata."
  },
  {
    id: "acc_tactical_headset",
    name: "Neural Audio Headset",
    category: "accessory",
    price: 110,
    rarity: "rare",
    unlockCondition: "shop",
    glassColor: "#0284c7",
    description: "Headphone monitor data audio saat berkonsentrasi belajar mandiri."
  },
  {
    id: "acc_golden_monocle",
    name: "Monocle Emas Gauss",
    category: "accessory",
    price: 220,
    rarity: "epic",
    unlockCondition: "shop",
    glassColor: "#fbbf24",
    description: "Lensa emas tunggal penghormatan bagi ketelitian pangeran matematika."
  },
  {
    id: "acc_halo_golden",
    name: "Halo Cendekiawan Emas",
    category: "accessory",
    price: 320,
    rarity: "legendary",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_master_zero_error",
    glassColor: "#f59e0b",
    description: "Lingkaran cahaya emas murni yang melayang anggun di atas kepala."
  },

  // =========================================================================
  // 5. AURA (Pendaran Energi Kognitif)
  // =========================================================================
  {
    id: "aura_none",
    name: "Tanpa Aura",
    category: "aura",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    description: "Tanpa efek pancaran energi di sekeliling avatar."
  },
  {
    id: "aura_cyan_pulse",
    name: "Pulsasi Cyan Kuadran",
    category: "aura",
    price: 60,
    rarity: "common",
    unlockCondition: "shop",
    glowColor: "#06b6d4",
    ringColor: "#22d3ee",
    description: "Gelombang energi kosmik cyan terang yang berdenyut lembut."
  },
  {
    id: "aura_violet_intelligence",
    name: "Pendar Ungu Intelektual",
    category: "aura",
    price: 100,
    rarity: "rare",
    unlockCondition: "shop",
    glowColor: "#a855f7",
    ringColor: "#c084fc",
    description: "Cincin energi orbital ungu plasma yang berputar santai."
  },
  {
    id: "aura_remed_crystal",
    name: "Kristal Remediasi Berlian",
    category: "aura",
    price: 180,
    rarity: "epic",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_remed_first",
    glowColor: "#10b981",
    ringColor: "#34d399",
    description: "Kristal hijau zamrud yang melayang sebagai bukti keuletan belajar."
  },
  {
    id: "aura_supernova_gold",
    name: "Supernova Kejayaan",
    category: "aura",
    price: 350,
    rarity: "legendary",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_diag_complete",
    glowColor: "#f59e0b",
    ringColor: "#fbbf24",
    description: "Pancaran halo mahkota emas bagi siswa penakluk seluruh materi EPE."
  },

  // =========================================================================
  // 6. BACKGROUND (Latar Belakang Kartu Avatar)
  // =========================================================================
  {
    id: "bg_deep_space",
    name: "Antariksa Kosmik",
    category: "background",
    price: 0,
    rarity: "common",
    unlockCondition: "default",
    description: "Latar langit malam kosmik selaras dengan tema alam semesta EPE V2."
  },
  {
    id: "bg_blueprint_grid",
    name: "Matriks Blueprint Geometri",
    category: "background",
    price: 45,
    rarity: "common",
    unlockCondition: "shop",
    description: "Kisi-kisi koordinat kartesius presisi biru arsitektur."
  },
  {
    id: "bg_high_lab",
    name: "Clean Room Laboratorium",
    category: "background",
    price: 85,
    rarity: "rare",
    unlockCondition: "shop",
    description: "Dinding heksagonal futuristik ruang kontrol diagnostik."
  },
  {
    id: "bg_cosmic_nebula",
    name: "Nebula Violet Galaktik",
    category: "background",
    price: 160,
    rarity: "epic",
    unlockCondition: "shop",
    description: "Pusaran debu bintang kosmik misterius di tepi galaksi."
  },
  {
    id: "bg_monument_champions",
    name: "Pantheon Monumen Kristal",
    category: "background",
    price: 300,
    rarity: "legendary",
    unlockCondition: "achievement",
    unlockAchievementId: "ach_diag_complete",
    description: "Monumen kristal kubus keemasan bagi sang penakluk aljabar sejati."
  }
];
