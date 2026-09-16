/**
 * avatarEngine.js - EPE V2.1 Layered Vector Avatar Engine
 * 
 * Merender avatar visual siswa secara presisi dan artistik dalam bentuk SVG berkualitas tinggi.
 * Kompatibel untuk mini-pill (24px - 36px) maupun preview besar di Avatar Lab (176px - 220px).
 * 
 * Z-Order Rendering:
 * 1. Background Layer (Antariksa, Blueprint, Lab, Nebula, Monumen)
 * 2. Aura Layer (Cyan Pulse, Violet Orbit, Remed Crystal, Supernova Gold)
 * 3. Back Hair Layer (Rambut belakang panjang / kuncir / twin tails)
 * 4. Outfit Layer (Torso, Bahu, Kerah, Jas Lab, Exosuit, Jubah)
 * 5. Head & Face Base (Leher, Kepala, Telinga, Rona Pipi)
 * 6. Facial Features (Alis, Mata, Hidung, Mulut)
 * 7. Front Hair Layer (Bangs, Top Volume, Hijab, Tiara Mahkota)
 * 8. Accessory Layer (Kacamata, AR Visor, Headset, Monocle, Halo)
 */

import { COSMETIC_CATALOG, DEFAULT_AVATAR_CONFIG } from "./avatarCatalog.js";

const STORAGE_KEY = "epe_avatar_config";

export class AvatarEngine {
  static sanitizeConfig(config) {
    const sanitized = { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) };
    try {
      const ownedRaw = localStorage.getItem("epe_owned_cosmetics");
      const ownedIds = ownedRaw ? JSON.parse(ownedRaw) : [];
      const defaultIds = COSMETIC_CATALOG.filter((it) => it.unlockCondition === "default" || it.price === 0).map((it) => it.id);

      const categories = ["face", "hair", "outfit", "accessory", "aura", "background"];
      for (const cat of categories) {
        const id = sanitized[cat];
        const isOwned = (ownedIds && ownedIds.includes(id)) || defaultIds.includes(id);
        if (!isOwned) {
          sanitized[cat] = DEFAULT_AVATAR_CONFIG[cat];
        }
      }
    } catch (e) {
      console.warn("Gagal validasi kepemilikan avatar config:", e);
    }
    return sanitized;
  }

  static getActiveConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return this.sanitizeConfig(parsed);
      }
    } catch (e) {
      console.warn("Gagal membaca config avatar:", e);
    }
    return { ...DEFAULT_AVATAR_CONFIG };
  }

  static saveConfig(config) {
    try {
      const current = this.getActiveConfig();
      const merged = { ...current, ...config };
      const sanitized = this.sanitizeConfig(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent("epe-avatar-updated", { detail: sanitized }));
      return sanitized;
    } catch (e) {
      console.error("Gagal menyimpan avatar config:", e);
      return config;
    }
  }

  static getItem(itemId) {
    return COSMETIC_CATALOG.find((item) => item.id === itemId) || null;
  }

  static renderToSvgString(customConfig = null, size = 100) {
    const config = { ...this.getActiveConfig(), ...(customConfig || {}) };

    const bgItem = this.getItem(config.background) || this.getItem("bg_deep_space");
    const auraItem = this.getItem(config.aura) || this.getItem("aura_none");
    const faceItem = this.getItem(config.face) || this.getItem("face_default");
    const hairItem = this.getItem(config.hair) || this.getItem("hair_short_black");
    const outfitItem = this.getItem(config.outfit) || this.getItem("outfit_cadet");
    const accItem = this.getItem(config.accessory) || this.getItem("acc_none");

    const skinColor = faceItem?.skinColor || "#fcd34d";
    const blushColor = faceItem?.blushColor || "rgba(244, 63, 94, 0.25)";
    const hairColor = hairItem?.hairColor || "#1e293b";

    return `
      <svg class="epe-avatar-svg" viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="border-radius: inherit; display: block;">
        <defs>
          <clipPath id="avatar-clip-${size}">
            <circle cx="50" cy="50" r="48" />
          </clipPath>
          
          <filter id="avatar-glow-${size}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="avatar-shadow-${size}" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.8" stdDeviation="1.5" flood-opacity="0.3"/>
          </filter>
        </defs>

        <g clip-path="url(#avatar-clip-${size})">
          <!-- 1. BACKGROUND LAYER -->
          ${this._renderBackgroundLayer(bgItem)}

          <!-- 2. AURA LAYER -->
          ${this._renderAuraLayer(auraItem, size)}

          <!-- 3. BACK HAIR LAYER (Behind Body) -->
          ${this._renderBackHairLayer(hairItem, hairColor)}

          <!-- 4. OUTFIT LAYER -->
          ${this._renderOutfitLayer(outfitItem, size)}

          <!-- 5. HEAD & FACE BASE (If Hijab, Head is wrapped) -->
          ${this._renderHeadAndFace(skinColor, blushColor, faceItem, hairItem, size)}

          <!-- 6. FRONT HAIR LAYER (Bangs, Locks, Cap, Tiara) -->
          ${this._renderFrontHairLayer(hairItem, hairColor, size)}

          <!-- 7. ACCESSORY LAYER -->
          ${this._renderAccessoryLayer(accItem, size)}
        </g>

        <!-- Glass Ring Outer Border -->
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
      </svg>
    `.trim();
  }

  static renderInto(containerEl, customConfig = null, size = 100) {
    if (!containerEl) return;
    containerEl.innerHTML = this.renderToSvgString(customConfig, size);
  }

  // =========================================================================
  // 1. BACKGROUND RENDERER
  // =========================================================================
  static _renderBackgroundLayer(item) {
    const id = item?.id || "bg_deep_space";

    if (id === "bg_blueprint_grid") {
      return `
        <rect width="100" height="100" fill="#0f172a" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#3b82f6" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.5" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#3b82f6" stroke-width="0.6" opacity="0.35" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#3b82f6" stroke-width="0.6" opacity="0.35" />
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="#60a5fa" stroke-width="0.5" opacity="0.25" />
      `;
    }

    if (id === "bg_high_lab") {
      return `
        <rect width="100" height="100" fill="#1e293b" />
        <polygon points="50,6 92,30 92,70 50,94 8,70 8,30" fill="none" stroke="#64748b" stroke-width="0.9" opacity="0.35" />
        <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="none" stroke="#0ea5e9" stroke-width="0.9" opacity="0.45" />
        <line x1="50" y1="18" x2="50" y2="82" stroke="#38bdf8" stroke-width="0.6" opacity="0.3" />
      `;
    }

    if (id === "bg_cosmic_nebula") {
      return `
        <rect width="100" height="100" fill="#0d041e" />
        <circle cx="32" cy="38" r="35" fill="#7c3aed" opacity="0.45" />
        <circle cx="72" cy="62" r="32" fill="#db2777" opacity="0.35" />
        <circle cx="18" cy="22" r="1.2" fill="#ffffff" opacity="0.85" />
        <circle cx="82" cy="24" r="1.4" fill="#ffffff" opacity="0.9" />
        <circle cx="78" cy="80" r="1.2" fill="#ffffff" opacity="0.75" />
        <circle cx="22" cy="78" r="1" fill="#ffffff" opacity="0.65" />
      `;
    }

    if (id === "bg_monument_champions") {
      return `
        <rect width="100" height="100" fill="#180b03" />
        <circle cx="50" cy="36" r="40" fill="#d97706" opacity="0.4" />
        <polygon points="50,12 80,50 50,88 20,50" fill="none" stroke="#f59e0b" stroke-width="1.2" opacity="0.6" />
        <line x1="50" y1="0" x2="50" y2="100" stroke="#fbbf24" stroke-width="0.9" opacity="0.4" />
      `;
    }

    // Default: Antariksa Kosmik
    return `
      <rect width="100" height="100" fill="#090d16" />
      <circle cx="50" cy="42" r="38" fill="#1e3a8a" opacity="0.4" />
      <circle cx="14" cy="24" r="1.2" fill="#93c5fd" opacity="0.85" />
      <circle cx="84" cy="28" r="1.3" fill="#ffffff" opacity="0.95" />
      <circle cx="28" cy="82" r="0.9" fill="#93c5fd" opacity="0.65" />
      <circle cx="76" cy="74" r="1.1" fill="#ffffff" opacity="0.75" />
    `;
  }

  // =========================================================================
  // 2. AURA RENDERER
  // =========================================================================
  static _renderAuraLayer(item, size) {
    if (!item || item.id === "aura_none") return "";
    const id = item.id;

    if (id === "aura_cyan_pulse") {
      return `
        <circle cx="50" cy="50" r="40" fill="none" stroke="#06b6d4" stroke-width="4" opacity="0.5" filter="url(#avatar-glow-${size})" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="#22d3ee" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.8" />
      `;
    }

    if (id === "aura_violet_intelligence") {
      return `
        <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" stroke-width="4" opacity="0.5" filter="url(#avatar-glow-${size})" />
        <ellipse cx="50" cy="50" rx="44" ry="24" transform="rotate(-28 50 50)" fill="none" stroke="#c084fc" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.8" />
      `;
    }

    if (id === "aura_remed_crystal") {
      return `
        <circle cx="50" cy="50" r="41" fill="none" stroke="#10b981" stroke-width="3.5" opacity="0.55" filter="url(#avatar-glow-${size})" />
        <!-- Floating Crystals -->
        <polygon points="16,30 20,24 24,30 20,36" fill="#34d399" opacity="0.9" />
        <polygon points="78,32 82,26 86,32 82,38" fill="#34d399" opacity="0.9" />
        <polygon points="50,6 54,2 58,6 54,10" fill="#6ee7b7" opacity="0.95" />
      `;
    }

    if (id === "aura_supernova_gold") {
      return `
        <circle cx="50" cy="50" r="43" fill="none" stroke="#f59e0b" stroke-width="4.5" opacity="0.65" filter="url(#avatar-glow-${size})" />
        <g stroke="#fbbf24" stroke-width="1.4" opacity="0.85">
          <line x1="50" y1="2" x2="50" y2="10" />
          <line x1="50" y1="90" x2="50" y2="98" />
          <line x1="2" y1="50" x2="10" y2="50" />
          <line x1="90" y1="50" x2="98" y2="50" />
          <line x1="16" y1="16" x2="22" y2="22" />
          <line x1="78" y1="78" x2="84" y2="84" />
          <line x1="16" y1="84" x2="22" y2="78" />
          <line x1="78" y1="22" x2="84" y2="16" />
        </g>
        <circle cx="50" cy="50" r="47" fill="none" stroke="#fde68a" stroke-width="1" stroke-dasharray="4 6" opacity="0.8" />
      `;
    }

    return "";
  }

  // =========================================================================
  // 3. BACK HAIR LAYER (Flowing behind shoulders & body)
  // =========================================================================
  static _renderBackHairLayer(hairItem, hairColor) {
    const id = hairItem?.id || "hair_short_black";

    if (id === "hair_female_long_black") {
      return `
        <!-- Full Long Black Hair Flowing Down Behind Back -->
        <path d="M 22 36 C 14 60, 12 85, 18 100 L 82 100 C 88 85, 86 60, 78 36 C 72 20, 28 20, 22 36 Z" fill="${hairColor}" />
      `;
    }

    if (id === "hair_female_curly_amber") {
      return `
        <!-- Voluminous Bouncy Amber Waves behind Back -->
        <path d="M 18 38 Q 8 60, 12 85 Q 16 100, 28 100 L 72 100 Q 84 100, 88 85 Q 92 60, 82 38 Z" fill="${hairColor}" />
      `;
    }

    if (id === "hair_female_ponytail") {
      return `
        <!-- High Ponytail Spilling Behind to Right Side -->
        <path d="M 60 18 Q 78 12, 86 25 Q 92 42, 85 64 Q 78 68, 75 56 Q 74 38, 64 26 Z" fill="${hairColor}" />
      `;
    }

    if (id === "hair_female_twintail_neon") {
      return `
        <!-- Fluffy Twin Tails Behind Shoulders Left & Right -->
        <path d="M 24 32 Q 8 40, 6 60 Q 6 80, 16 88 Q 22 84, 18 70 Q 16 50, 28 40 Z" fill="${hairColor}" />
        <path d="M 76 32 Q 92 40, 94 60 Q 94 80, 84 88 Q 78 84, 82 70 Q 84 50, 72 40 Z" fill="${hairColor}" />
      `;
    }

    if (id === "hair_female_celestial_crown") {
      return `
        <!-- Majestic Floating Silver Hair Cascading Wide Behind Body -->
        <path d="M 16 32 C 6 58, 4 85, 12 100 L 88 100 C 96 85, 94 58, 84 32 C 78 14, 22 14, 16 32 Z" fill="${hairColor}" />
        <!-- Soft Inner Silver Glow -->
        <path d="M 24 40 C 16 62, 16 85, 22 100 L 78 100 C 84 85, 84 62, 76 40 Z" fill="#e2e8f0" opacity="0.6" />
      `;
    }

    if (id === "hair_quantum_cyan") {
      return `
        <!-- Quantum Energy Streams Behind -->
        <path d="M 22 36 Q 14 65, 18 95 L 82 95 Q 86 65, 78 36 Z" fill="#083344" />
      `;
    }

    // Default & Short Hair (Male/Female Short): Clean shaded neck silhouette
    return `
      <!-- Neck Back Hair Silhouette -->
      <path d="M 34 50 C 30 62, 70 62, 66 50 Z" fill="${hairColor}" opacity="0.85" />
    `;
  }

  // =========================================================================
  // 4. OUTFIT RENDERER
  // =========================================================================
  static _renderOutfitLayer(item, size) {
    const id = item?.id || "outfit_cadet";

    if (id === "outfit_hoodie_cyber") {
      return `
        <!-- Matrix Cyber Hoodie with Cyan Strings -->
        <path d="M 20 100 L 20 81 Q 20 70 32 68 L 50 76 L 68 68 Q 80 70 80 81 L 80 100 Z" fill="#1e293b" />
        <path d="M 36 71 L 50 82 L 64 71" fill="none" stroke="#0ea5e9" stroke-width="2.2" stroke-linecap="round" />
        <line x1="46" y1="82" x2="46" y2="95" stroke="#38bdf8" stroke-width="1.3" stroke-linecap="round" />
        <line x1="54" y1="82" x2="54" y2="95" stroke="#38bdf8" stroke-width="1.3" stroke-linecap="round" />
        <path d="M 20 83 Q 26 72 36 70" fill="none" stroke="#334155" stroke-width="2" />
        <path d="M 80 83 Q 74 72 64 70" fill="none" stroke="#334155" stroke-width="2" />
      `;
    }

    if (id === "outfit_research_coat") {
      return `
        <!-- White Research Lab Coat with Badge & Navy Inner Shirt -->
        <path d="M 18 100 L 18 79 Q 18 68 32 67 L 50 74 L 68 67 Q 82 68 82 79 L 82 100 Z" fill="#f8fafc" />
        <polygon points="40,70 50,82 60,70" fill="#1e3a8a" />
        <path d="M 32 67 L 46 88 L 46 100 L 28 100 Z" fill="#e2e8f0" />
        <path d="M 68 67 L 54 88 L 54 100 L 72 100 Z" fill="#cbd5e1" />
        <!-- ID Badge -->
        <rect x="25" y="80" width="8" height="11" rx="1.5" fill="#3b82f6" />
        <line x1="27" y1="83" x2="31" y2="83" stroke="#ffffff" stroke-width="1" />
        <line x1="27" y1="86" x2="31" y2="86" stroke="#ffffff" stroke-width="0.8" />
      `;
    }

    if (id === "outfit_quantum_suit") {
      return `
        <!-- Quantum Pilot Exosuit with Glowing Core -->
        <path d="M 18 100 L 18 78 Q 18 66 30 64 L 50 72 L 70 64 Q 82 66 82 78 L 82 100 Z" fill="#090d16" />
        <polygon points="50,78 58,85 50,92 42,85" fill="#06b6d4" filter="url(#avatar-glow-${size})" />
        <polygon points="50,80 55,85 50,90 45,85" fill="#ffffff" />
        <path d="M 18 82 L 32 66 L 36 74 L 20 90 Z" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.2" />
        <path d="M 82 82 L 68 66 L 64 74 L 80 90 Z" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.2" />
        <line x1="42" y1="85" x2="33" y2="85" stroke="#06b6d4" stroke-width="1" />
        <line x1="58" y1="85" x2="67" y2="85" stroke="#06b6d4" stroke-width="1" />
      `;
    }

    if (id === "outfit_grandmaster") {
      return `
        <!-- Grandmaster Celestial Violet & Gold Robe -->
        <path d="M 18 100 L 18 78 Q 18 66 30 64 L 50 72 L 70 64 Q 82 66 82 78 L 82 100 Z" fill="#3b0764" />
        <path d="M 30 64 L 50 75 L 70 64" fill="none" stroke="#f59e0b" stroke-width="2.8" stroke-linecap="round" />
        <circle cx="50" cy="86" r="4.5" fill="#fbbf24" filter="url(#avatar-glow-${size})" />
        <polygon points="50,80 51.5,84.5 56,86 51.5,87.5 50,92 48.5,87.5 44,86 48.5,84.5" fill="#ffffff" />
      `;
    }

    // Default: Seragam Kadet EPE
    return `
      <path d="M 20 100 L 20 81 Q 20 70 32 68 L 50 76 L 68 68 Q 80 70 80 81 L 80 100 Z" fill="#1e3a8a" />
      <polygon points="35,68 50,78 44,79 32,69" fill="#ffffff" />
      <polygon points="65,68 50,78 56,79 68,69" fill="#e2e8f0" />
      <polygon points="48,78 52,78 53,93 50,97 47,93" fill="#2563eb" />
      <circle cx="50" cy="82" r="1.5" fill="#f59e0b" />
    `;
  }

  // =========================================================================
  // 5. HEAD & FACE BASE
  // =========================================================================
  static _renderHeadAndFace(skinColor, blushColor, faceItem, hairItem, size) {
    const eyeType = faceItem?.eyeType || "focused";
    const mouthType = faceItem?.mouthType || "smile";
    const isHijab = hairItem?.id === "hair_female_hijab";

    // If Hijab is active, the hijab drape wraps the neck and head
    if (isHijab) {
      return `
        <!-- Hijab Shoulder Drape -->
        <path d="M 28 65 Q 18 80 22 100 L 78 100 Q 82 80 72 65 Z" fill="#1e3a8a" />
        <path d="M 32 68 Q 50 82 68 68 L 64 78 Q 50 90 36 78 Z" fill="#1d4ed8" />

        <!-- Head Base inside Hijab -->
        <ellipse cx="50" cy="46" rx="20" ry="23" fill="${skinColor}" />

        <!-- Hijab Inner Cap (Ciput) -->
        <path d="M 32 38 Q 50 31 68 38 Q 66 33 50 28 Q 34 33 32 38 Z" fill="#3b82f6" />

        <!-- Hijab Face Frame Wrap -->
        <path d="M 30 42 C 28 58, 36 68, 50 69 C 64 68, 72 58, 70 42 C 68 28, 32 28, 30 42 Z" fill="none" stroke="#1e3a8a" stroke-width="4.5" />

        <!-- Cheeks Blush -->
        <ellipse cx="38" cy="52" rx="3.5" ry="1.8" fill="${blushColor}" />
        <ellipse cx="62" cy="52" rx="3.5" ry="1.8" fill="${blushColor}" />

        <!-- Eyebrows -->
        <path d="M 37 40 Q 42 38 45 40" fill="none" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round" />
        <path d="M 63 40 Q 58 38 55 40" fill="none" stroke="#1e293b" stroke-width="1.6" stroke-linecap="round" />

        <!-- EYES -->
        ${this._renderEyes(eyeType, size)}

        <!-- NOSE -->
        <circle cx="50" cy="50" r="1.1" fill="rgba(0,0,0,0.25)" />

        <!-- MOUTH -->
        ${this._renderMouth(mouthType)}
      `;
    }

    return `
      <!-- Neck -->
      <rect x="44" y="60" width="12" height="15" fill="${skinColor}" />
      <path d="M 44 60 Q 50 66 56 60 L 56 64 Q 50 70 44 64 Z" fill="rgba(0,0,0,0.14)" />

      <!-- Head Base -->
      <ellipse cx="50" cy="46" rx="21" ry="24" fill="${skinColor}" filter="url(#avatar-shadow-${size})" />

      <!-- Ears -->
      <ellipse cx="28" cy="47" rx="3.5" ry="6" fill="${skinColor}" />
      <ellipse cx="72" cy="47" rx="3.5" ry="6" fill="${skinColor}" />
      <ellipse cx="28.5" cy="47" rx="2" ry="3.5" fill="rgba(0,0,0,0.08)" />
      <ellipse cx="71.5" cy="47" rx="2" ry="3.5" fill="rgba(0,0,0,0.08)" />

      <!-- Cheeks Blush -->
      <ellipse cx="37" cy="52" rx="4" ry="2" fill="${blushColor}" />
      <ellipse cx="63" cy="52" rx="4" ry="2" fill="${blushColor}" />

      <!-- Eyebrows -->
      <path d="M 36 38 Q 42 36 45 38" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" />
      <path d="M 64 38 Q 58 36 55 38" fill="none" stroke="#1e293b" stroke-width="1.8" stroke-linecap="round" />

      <!-- EYES -->
      ${this._renderEyes(eyeType, size)}

      <!-- NOSE -->
      <circle cx="50" cy="50" r="1.2" fill="rgba(0,0,0,0.25)" />

      <!-- MOUTH -->
      ${this._renderMouth(mouthType)}
    `;
  }

  static _renderEyes(eyeType, size) {
    if (eyeType === "sparkle") {
      return `
        <ellipse cx="40" cy="45" rx="4.2" ry="5.2" fill="#0f172a" />
        <circle cx="41.5" cy="43" r="1.8" fill="#ffffff" />
        <circle cx="39" cy="47" r="0.9" fill="#38bdf8" />
        <ellipse cx="60" cy="45" rx="4.2" ry="5.2" fill="#0f172a" />
        <circle cx="61.5" cy="43" r="1.8" fill="#ffffff" />
        <circle cx="59" cy="47" r="0.9" fill="#38bdf8" />
      `;
    }

    if (eyeType === "calculating") {
      return `
        <path d="M 35 44 Q 40 41 46 44" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" />
        <ellipse cx="41" cy="45.5" rx="3.5" ry="3.8" fill="#1e293b" />
        <circle cx="42" cy="44.5" r="1.2" fill="#ffffff" />
        <path d="M 65 44 Q 60 41 54 44" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" />
        <ellipse cx="59" cy="45.5" rx="3.5" ry="3.8" fill="#1e293b" />
        <circle cx="60" cy="44.5" r="1.2" fill="#ffffff" />
      `;
    }

    if (eyeType === "cyber_lens") {
      return `
        <ellipse cx="40" cy="45" rx="3.8" ry="4.5" fill="#0f172a" />
        <circle cx="41.2" cy="43.8" r="1.3" fill="#ffffff" />
        <!-- Glowing Cybernetic Lens in Right Eye -->
        <circle cx="60" cy="45" r="6" fill="#082f49" stroke="#0ea5e9" stroke-width="1.5" filter="url(#avatar-glow-${size})" />
        <circle cx="60" cy="45" r="3.4" fill="#38bdf8" />
        <circle cx="60" cy="45" r="1.2" fill="#ffffff" />
        <line x1="53" y1="45" x2="67" y2="45" stroke="#06b6d4" stroke-width="0.8" />
        <line x1="60" y1="38" x2="60" y2="52" stroke="#06b6d4" stroke-width="0.8" />
      `;
    }

    // Default: Focused Eyes
    return `
      <ellipse cx="40" cy="45" rx="3.8" ry="4.5" fill="#0f172a" />
      <circle cx="41.2" cy="43.8" r="1.4" fill="#ffffff" />
      <ellipse cx="60" cy="45" rx="3.8" ry="4.5" fill="#0f172a" />
      <circle cx="61.2" cy="43.8" r="1.4" fill="#ffffff" />
    `;
  }

  static _renderMouth(mouthType) {
    if (mouthType === "open_smile") {
      return `
        <path d="M 45 55 Q 50 62 55 55 Z" fill="#e11d48" stroke="#be123c" stroke-width="1" />
        <path d="M 46.5 55.5 Q 50 57.5 53.5 55.5" fill="#ffffff" />
      `;
    }

    if (mouthType === "confident") {
      return `
        <path d="M 46 55 Q 51 58 56 54" fill="none" stroke="#991b1b" stroke-width="1.8" stroke-linecap="round" />
      `;
    }

    if (mouthType === "calm") {
      return `
        <line x1="46" y1="55" x2="54" y2="55" stroke="#991b1b" stroke-width="1.6" stroke-linecap="round" />
      `;
    }

    // Default: Gentle Smile
    return `
      <path d="M 46 54 Q 50 59 54 54" fill="none" stroke="#991b1b" stroke-width="1.8" stroke-linecap="round" />
    `;
  }

  // =========================================================================
  // 6. FRONT HAIR RENDERER (Full Volume, Fringe, Locks, Hijab, Tiara)
  // =========================================================================
  static _renderFrontHairLayer(hairItem, hairColor, size) {
    const id = hairItem?.id || "hair_short_black";

    // 1. Hijab Pelajar Modern (Perempuan)
    if (id === "hair_female_hijab") {
      return `
        <!-- Full Hijab Head Wrap (Completely covers entire skull from y=12) -->
        <path d="M 24 42 C 20 20, 24 12, 50 12 C 76 12, 80 20, 76 42 C 74 28, 26 28, 24 42 Z" fill="#1e3a8a" />
        <!-- Front Drape Shading & Folds -->
        <path d="M 27 36 C 23 16, 77 16, 73 36" fill="none" stroke="#1d4ed8" stroke-width="2.5" />
        <path d="M 30 40 Q 50 25 70 40" fill="none" stroke="#60a5fa" stroke-width="1.3" opacity="0.7" />
      `;
    }

    // 2. Bob Sebahu Pelajar (Perempuan)
    if (id === "hair_female_bob") {
      return `
        <!-- Full Solid Bob Cut Framing Entire Skull Down to Chin (Crown at y=13) -->
        <path d="M 25 44 C 20 22, 25 13, 50 13 C 75 13, 80 22, 75 44 C 77 56, 75 66, 71 67 Q 68 64 69 52 Q 68 38 60 36 Q 50 39 40 36 Q 32 38 31 52 Q 32 64 29 67 C 25 66, 23 56, 25 44 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Full Neat Horizontal Fringe -->
        <path d="M 31 36 Q 41 40 50 36 Q 59 40 69 36" fill="none" stroke="${hairColor}" stroke-width="5" stroke-linecap="round" />
        <!-- Glossy Highlight Strand Arc -->
        <path d="M 34 22 Q 50 16 66 22" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.8" stroke-linecap="round" />
      `;
    }

    // 3. Belah Samping Klasik (Pria / Scholar Sidepart)
    if (id === "hair_male_sidepart" || id === "hair_scholar_sidepart") {
      return `
        <!-- Full Solid Classic Side Part with Thick Volume (Crown at y=13) -->
        <path d="M 25 46 C 22 24, 25 13, 46 13 C 68 13.5, 78 25, 75 46 L 72 41 Q 62 33 50 34 Q 40 35 29 42 L 25 46 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Sleek Side-Part Groove on Left -->
        <line x1="36" y1="15" x2="38" y2="33" stroke="rgba(255,255,255,0.25)" stroke-width="1.3" stroke-linecap="round" />
        <!-- Swept Hair Volume Lines -->
        <path d="M 39 20 Q 54 18 68 25" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.6" stroke-linecap="round" />
        <path d="M 40 26 Q 54 24 67 31" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.3" stroke-linecap="round" />
        <!-- Sideburns -->
        <polygon points="25,41 27,48 29,43" fill="${hairColor}" />
        <polygon points="75,41 73,48 71,43" fill="${hairColor}" />
      `;
    }

    // 4. Undercut Modern (Pria)
    if (id === "hair_male_undercut") {
      return `
        <!-- Undercut Tapered Sides (Dark Fade) -->
        <path d="M 25 46 L 27 33 L 32 30 L 32 46 Z" fill="#0f172a" opacity="0.65" />
        <path d="M 75 46 L 73 33 L 68 30 L 68 46 Z" fill="#0f172a" opacity="0.65" />
        <!-- High Voluminous Quiff / Pompadour Top (Crown at y=11) -->
        <path d="M 27 34 C 25 18, 30 11.5, 50 11 C 70 11.5, 75 18, 73 34 Q 63 29 50 28 Q 37 29 27 34 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Layered Textured Quiff Strands Swept Up -->
        <path d="M 33 28 Q 42 16 50 13 Q 58 16 67 28" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-linecap="round" />
        <path d="M 38 31 Q 45 22 50 20 Q 55 22 62 31" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.5" stroke-linecap="round" />
      `;
    }

    // 5. Spiky Anime Energik (Pria)
    if (id === "hair_male_spiky") {
      return `
        <!-- Full Solid Spiky Anime Hair Cap with Dynamic Multi-Peaks (Peaks at y=10) -->
        <path d="M 25 46 L 23 35 L 20 25 L 29 24 L 32 14 L 40 19 L 50 10 L 60 19 L 68 14 L 71 24 L 80 25 L 77 35 L 75 46 L 72 40 Q 64 34 58 38 Q 50 33 42 37 Q 36 34 28 41 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Internal Spike Ridges -->
        <line x1="50" y1="10" x2="50" y2="28" stroke="rgba(255,255,255,0.25)" stroke-width="1.6" stroke-linecap="round" />
        <line x1="40" y1="19" x2="43" y2="30" stroke="rgba(255,255,255,0.2)" stroke-width="1.3" stroke-linecap="round" />
        <line x1="60" y1="19" x2="57" y2="30" stroke="rgba(255,255,255,0.2)" stroke-width="1.3" stroke-linecap="round" />
      `;
    }

    // 6. Ikal Pendek Karismatik (Pria)
    if (id === "hair_male_curly") {
      return `
        <!-- Thick Cloud of Short Male Waves & Curls (Crown at y=12) -->
        <path d="M 25 46 Q 21 34 24 24 Q 28 14 40 13 Q 50 11.5 60 13 Q 72 14 76 24 Q 79 34 75 46 L 72 41 Q 67 36 62 39 Q 57 34 50 37 Q 43 34 38 39 Q 33 36 28 41 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Curly Ringlet Forehead Accents -->
        <circle cx="34" cy="22" r="4" fill="none" stroke="#b45309" stroke-width="1.5" />
        <circle cx="50" cy="18" r="4.5" fill="none" stroke="#b45309" stroke-width="1.6" />
        <circle cx="66" cy="22" r="4" fill="none" stroke="#b45309" stroke-width="1.5" />
        <path d="M 40 37 Q 44 41 48 37" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
        <path d="M 52 37 Q 56 41 60 37" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
      `;
    }

    // 7. Electric Blue Waves (Pria)
    if (id === "hair_messy_blue") {
      return `
        <!-- Full Electric Blue Wave Silhouette (Crown at y=12) -->
        <path d="M 25 46 C 21 26, 25 12.5, 50 12 C 75 12.5, 79 26, 75 46 L 72 40 Q 64 34 57 39 Q 50 33 43 37 Q 36 34 28 41 Z" fill="#1e3a8a" filter="url(#avatar-shadow-${size})" />
        <!-- Electric Blue Swept Wave Mass -->
        <path d="M 25 42 Q 22 20 40 14 Q 58 13 74 24 Q 75 38 72 40 Q 64 34 57 39 Q 50 33 43 37 Q 36 34 28 41 Z" fill="${hairColor}" />
        <!-- Glowing Cyan Neon Streaks -->
        <path d="M 32 24 Q 48 16 66 22" fill="none" stroke="#67e8f9" stroke-width="2.5" stroke-linecap="round" filter="url(#avatar-glow-${size})" />
        <path d="M 36 31 Q 50 24 64 30" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" />
      `;
    }

    // 8. Rambut Panjang Anggun (Perempuan)
    if (id === "hair_female_long_black") {
      return `
        <!-- Full Long Straight Hair Cap & Framing Front Strands to Shoulders (Crown at y=13) -->
        <path d="M 25 40 C 21 22, 25 13.5, 50 13.5 C 75 13.5, 79 22, 75 40 C 77 58, 78 75, 76 90 C 72 90, 71 70, 68 55 Q 66 38 58 36 Q 50 39 42 36 Q 34 38 32 55 C 29 70, 28 90, 24 90 C 22 75, 23 58, 25 40 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Front Fringe Strands -->
        <path d="M 32 36 Q 43 40 50 36 Q 57 40 68 36" fill="none" stroke="${hairColor}" stroke-width="4.5" stroke-linecap="round" />
        <!-- Silky Gloss Sheen -->
        <path d="M 34 22 Q 50 16 66 22" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1.8" stroke-linecap="round" />
      `;
    }

    // 9. Ikal Caramel Ceria (Perempuan)
    if (id === "hair_female_curly_amber") {
      return `
        <!-- Full Voluminous Bouncy Curly Amber Mane (Crown at y=12) -->
        <path d="M 25 44 C 18 22, 25 12.5, 50 12.5 C 75 12.5, 82 22, 75 44 C 79 55, 77 66, 72 69 C 69 63, 69 50, 66 40 Q 58 35 50 38 Q 42 35 34 40 C 31 50, 31 63, 28 69 C 23 66, 21 55, 25 44 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Curly Bangs -->
        <path d="M 33 37 Q 41 43 47 38 Q 53 43 61 37 Q 67 41 68 36" fill="none" stroke="${hairColor}" stroke-width="4.5" stroke-linecap="round" />
        <!-- Warm Highlights -->
        <circle cx="34" cy="22" r="3.5" fill="#f59e0b" opacity="0.6" />
        <circle cx="66" cy="22" r="3.5" fill="#f59e0b" opacity="0.6" />
      `;
    }

    // 10. Kuncir Kuda Dinamis (Perempuan)
    if (id === "hair_female_ponytail") {
      return `
        <!-- High Ponytail Head Cap (Full Volume over Skull from y=13) -->
        <path d="M 25 42 C 21 22, 25 13.5, 50 13.5 C 75 13.5, 79 22, 75 42 L 72 40 Q 64 36 58 40 Q 50 35 42 39 Q 36 36 28 41 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- High Hair Scrunchie at Top Right -->
        <ellipse cx="63" cy="20" rx="4.5" ry="3" transform="rotate(-20 63 20)" fill="#a855f7" stroke="#c084fc" stroke-width="1.3" />
        <!-- Cute Bangs -->
        <path d="M 32 37 Q 42 41 50 36 Q 58 41 66 37" fill="none" stroke="${hairColor}" stroke-width="5" stroke-linecap="round" />
        <polygon points="26,39 28,47 31,41" fill="${hairColor}" />
        <polygon points="74,39 72,47 69,41" fill="${hairColor}" />
      `;
    }

    // 11. Quantum Flow Glow (Unisex)
    if (id === "hair_quantum_cyan") {
      return `
        <!-- Futuristic Full Cyber Hair Cap (Crown at y=12) -->
        <path d="M 25 46 C 21 25, 25 12.5, 50 12 C 75 12.5, 79 25, 75 46 L 72 40 Q 64 35 57 39 Q 50 33 43 37 Q 36 35 28 41 Z" fill="#083344" filter="url(#avatar-shadow-${size})" />
        <path d="M 26 38 Q 36 17 64 18 Q 74 22 72 38 Q 58 28 38 32 Z" fill="${hairColor}" />
        <!-- Glowing Cyan Energy Filaments -->
        <path d="M 33 22 Q 50 14 67 22" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" filter="url(#avatar-glow-${size})" />
        <circle cx="36" cy="24" r="1.5" fill="#ffffff" filter="url(#avatar-glow-${size})" />
        <circle cx="62" cy="22" r="1.8" fill="#ffffff" filter="url(#avatar-glow-${size})" />
      `;
    }

    // 12. Twin Tails Siber Harajuku (Perempuan)
    if (id === "hair_female_twintail_neon") {
      return `
        <!-- Twin Tails Full Skull Cap (Crown at y=13) -->
        <path d="M 25 42 C 21 22, 25 13.5, 50 13.5 C 75 13.5, 79 22, 75 42 L 72 40 Q 64 36 57 40 Q 50 35 43 39 Q 36 36 28 41 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Dual Cyber Hair Ties -->
        <circle cx="21" cy="34" r="3.5" fill="#06b6d4" stroke="#22d3ee" stroke-width="1" />
        <circle cx="79" cy="34" r="3.5" fill="#06b6d4" stroke="#22d3ee" stroke-width="1" />
        <!-- Anime Fringe & Side Wisps -->
        <path d="M 32 37 Q 44 42 50 36 Q 56 42 68 37" fill="none" stroke="${hairColor}" stroke-width="5" stroke-linecap="round" />
        <path d="M 28 41 Q 25 56 26 65" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
        <path d="M 72 41 Q 75 56 74 65" fill="none" stroke="${hairColor}" stroke-width="3" stroke-linecap="round" />
      `;
    }

    // 13. Mahkota Bintang Surgawi (Perempuan)
    if (id === "hair_female_celestial_crown") {
      return `
        <!-- Floating Astral Silver Mane (Full Skull Coverage from y=12) -->
        <path d="M 25 40 C 19 22, 25 12.5, 50 12 C 75 12.5, 81 22, 75 40 L 72 38 Q 63 35 50 34 Q 37 35 28 38 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
        <!-- Flowing Forehead Strands -->
        <path d="M 30 36 Q 42 40 50 35 Q 58 40 70 36" fill="none" stroke="${hairColor}" stroke-width="4.5" stroke-linecap="round" />
        <path d="M 27 41 Q 21 60 24 78" fill="none" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" />
        <path d="M 73 41 Q 79 60 76 78" fill="none" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" />
        <!-- Golden Star Tiara / Crown across Forehead -->
        <path d="M 28 34 Q 50 39 72 34" fill="none" stroke="#fbbf24" stroke-width="2.2" filter="url(#avatar-glow-${size})" />
        <polygon points="50,25 52,31 58,32 53,35 55,41 50,38 45,41 47,35 42,32 48,31" fill="#fef08a" stroke="#d97706" stroke-width="0.8" />
        <circle cx="35" cy="34" r="1.6" fill="#fbbf24" />
        <circle cx="65" cy="34" r="1.6" fill="#fbbf24" />
      `;
    }

    // Default: Rambut Pendek Pelajar (Pria - hair_short_black)
    return `
      <!-- Solid Full Hair Cap Covering Entire Skull Crown & Forehead (Crown at y=13.5) -->
      <path d="M 25 46 C 22 26, 25 13.5, 50 13.5 C 75 13.5, 78 26, 75 46 L 72 41 Q 65 37 58 40 Q 51 34 43 38 Q 36 35 28 41 L 25 46 Z" fill="${hairColor}" filter="url(#avatar-shadow-${size})" />
      <!-- Hair Texture & Parting Strands -->
      <path d="M 38 18 Q 42 27 44 36" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="1.3" stroke-linecap="round" />
      <path d="M 52 17 Q 56 25 58 35" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.2" stroke-linecap="round" />
      <!-- Natural Healthy Sheen Arc -->
      <path d="M 33 21 Q 50 16 67 21" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-linecap="round" />
      <!-- Sideburns -->
      <polygon points="25,41 27,48 29,43" fill="${hairColor}" />
      <polygon points="75,41 73,48 71,43" fill="${hairColor}" />
    `;
  }

  // =========================================================================
  // 7. ACCESSORY RENDERER
  // =========================================================================
  static _renderAccessoryLayer(item, size) {
    if (!item || item.id === "acc_none") return "";
    const id = item.id;

    if (id === "acc_wire_glasses") {
      return `
        <!-- Circular Scholarly Glasses -->
        <circle cx="40" cy="45" r="7.5" fill="rgba(59, 130, 246, 0.12)" stroke="#38bdf8" stroke-width="1.5" />
        <circle cx="40" cy="45" r="6" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.6" />
        <circle cx="60" cy="45" r="7.5" fill="rgba(59, 130, 246, 0.12)" stroke="#38bdf8" stroke-width="1.5" />
        <circle cx="60" cy="45" r="6" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.6" />
        <path d="M 47.5 45 Q 50 43 52.5 45" fill="none" stroke="#38bdf8" stroke-width="1.5" />
        <line x1="32.5" y1="45" x2="28" y2="44" stroke="#38bdf8" stroke-width="1.2" />
        <line x1="67.5" y1="45" x2="72" y2="44" stroke="#38bdf8" stroke-width="1.2" />
      `;
    }

    if (id === "acc_ar_visor") {
      return `
        <!-- Transparent Glowing AR HUD Visor -->
        <path d="M 30 42 L 70 42 L 67 50 L 50 52 L 33 50 Z" fill="rgba(6, 182, 212, 0.45)" stroke="#22d3ee" stroke-width="1.5" filter="url(#avatar-glow-${size})" />
        <line x1="35" y1="45" x2="65" y2="45" stroke="#ffffff" stroke-width="0.9" opacity="0.9" stroke-dasharray="3 2" />
        <circle cx="62" cy="47" r="1.2" fill="#22d3ee" />
      `;
    }

    if (id === "acc_tactical_headset") {
      return `
        <!-- Cyber Neural Audio Headset -->
        <path d="M 26 44 C 24 16, 76 16, 74 44" fill="none" stroke="#1e293b" stroke-width="3.2" stroke-linecap="round" />
        <path d="M 28 42 C 28 20, 72 20, 72 42" fill="none" stroke="#0ea5e9" stroke-width="1.2" />
        <rect x="23" y="40" width="5" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2" />
        <rect x="72" y="40" width="5" height="12" rx="2" fill="#0284c7" stroke="#38bdf8" stroke-width="1.2" />
        <path d="M 26 49 Q 32 60 44 57" fill="none" stroke="#64748b" stroke-width="1.4" stroke-linecap="round" />
        <circle cx="44" cy="57" r="2" fill="#38bdf8" filter="url(#avatar-glow-${size})" />
      `;
    }

    if (id === "acc_golden_monocle") {
      return `
        <!-- Gauss Golden Monocle over Right Eye -->
        <circle cx="60" cy="45" r="7.5" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" stroke-width="1.6" filter="url(#avatar-glow-${size})" />
        <path d="M 67.5 45 Q 70 55 66 65" fill="none" stroke="#f59e0b" stroke-width="0.9" stroke-dasharray="2 2" />
      `;
    }

    if (id === "acc_halo_golden") {
      return `
        <!-- Golden Scholar Halo Orbiting Above Head -->
        <ellipse cx="50" cy="18" rx="25" ry="6.5" fill="none" stroke="#fbbf24" stroke-width="2.8" filter="url(#avatar-glow-${size})" />
        <ellipse cx="50" cy="18" rx="25" ry="6.5" fill="none" stroke="#ffffff" stroke-width="0.9" opacity="0.85" />
        <polygon points="26,18 28,16 30,18 28,20" fill="#fef08a" />
        <polygon points="70,18 72,16 74,18 72,20" fill="#fef08a" />
      `;
    }

    return "";
  }
}
