/**
 * aiOrbEngine.js - Interactive 3D Holographic AI Orb Engine (EPE V2)
 * 
 * Merender bola 3D interaktif futuristik dengan Three.js:
 * - Inti bola holografik dengan efek Fresnel & wireframe
 * - Cincin gyroscopic bercahaya ganda yang berputar independen
 * - Awan partikel orbit energi yang berkedip
 * - Pelacakan kursor / sentuhan interaktif (interactive head-tracking)
 * - Emosi visual: Idle, Thinking, Speaking, Celebrate
 * - Sinkronisasi dinamis dengan tema warna yang dipilih pengguna
 */

export class AiOrbEngine {
  constructor({ containerId, initialColor = "#3b82f6", onClick = null }) {
    this.container = document.getElementById(containerId);
    this.initialColor = initialColor;
    this.onClick = onClick;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrameId = null;

    // 3D Meshes & Groups
    this.orbGroup = null;
    this.coreSphere = null;
    this.wireSphere = null;
    this.innerGlowSphere = null;
    this.ring1 = null;
    this.ring2 = null;
    this.particles = null;
    this.pointLight = null;

    // State & Animation
    this.state = "idle"; // 'idle' | 'thinking' | 'speaking' | 'celebrate'
    this.clock = null;
    this.targetRotation = { x: 0, y: 0 };
    this.currentRotation = { x: 0, y: 0 };
    this.pointer = { x: 0, y: 0, active: false };

    this.init();
  }

  init() {
    if (!this.container) return;
    if (typeof window.THREE === "undefined") {
      console.warn("Three.js belum tersedia. Menunggu pemuatan...");
      setTimeout(() => this.init(), 300);
      return;
    }

    const THREE = window.THREE;
    this.clock = new THREE.Clock();

    const width = this.container.clientWidth || 240;
    const height = this.container.clientHeight || 220;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 4.8;

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.container.innerHTML = "";
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    this.pointLight = new THREE.PointLight(this.initialColor, 3.5, 12);
    this.pointLight.position.set(2, 2, 3);
    this.scene.add(this.pointLight);

    const backLight = new THREE.PointLight(0x6366f1, 2.0, 10);
    backLight.position.set(-2, -2, -2);
    this.scene.add(backLight);

    // 5. Build 3D Orb Structure
    this.buildOrb();

    // 6. Event Listeners
    this.bindEvents();

    // 7. Start Loop
    this.animate();
  }

  buildOrb() {
    const THREE = window.THREE;
    this.orbGroup = new THREE.Group();
    this.scene.add(this.orbGroup);

    const col = new THREE.Color(this.initialColor);

    // A. Inner Glow Core
    const innerGeom = new THREE.SphereGeometry(0.85, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.35
    });
    this.innerGlowSphere = new THREE.Mesh(innerGeom, innerMat);
    this.orbGroup.add(this.innerGlowSphere);

    // B. Glossy Core Sphere
    const coreGeom = new THREE.SphereGeometry(1.0, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0a101f,
      emissive: col,
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.85,
      transparent: true,
      opacity: 0.9
    });
    this.coreSphere = new THREE.Mesh(coreGeom, coreMat);
    this.orbGroup.add(this.coreSphere);

    // C. Sci-Fi Wireframe Overlay
    const wireGeom = new THREE.IcosahedronGeometry(1.15, 2);
    const wireMat = new THREE.MeshBasicMaterial({
      color: col,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    this.wireSphere = new THREE.Mesh(wireGeom, wireMat);
    this.orbGroup.add(this.wireSphere);

    // D. Gyroscopic Orbital Ring 1
    const ring1Geom = new THREE.TorusGeometry(1.5, 0.035, 16, 80);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.8
    });
    this.ring1 = new THREE.Mesh(ring1Geom, ring1Mat);
    this.ring1.rotation.x = Math.PI / 3;
    this.ring1.rotation.y = Math.PI / 6;
    this.orbGroup.add(this.ring1);

    // E. Gyroscopic Orbital Ring 2
    const ring2Geom = new THREE.TorusGeometry(1.7, 0.025, 16, 80);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: col,
      emissiveIntensity: 0.6,
      roughness: 0.4,
      metalness: 0.9
    });
    this.ring2 = new THREE.Mesh(ring2Geom, ring2Mat);
    this.ring2.rotation.x = -Math.PI / 4;
    this.ring2.rotation.z = Math.PI / 5;
    this.orbGroup.add(this.ring2);

    // F. Orbiting Sparkle Energy Halo Particles
    const particleCount = 75;
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 1.35 + Math.random() * 0.9;

      positions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = dist * Math.cos(phi);
    }

    particleGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: col,
      size: 0.065,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeom, particleMat);
    this.orbGroup.add(this.particles);
  }

  setColor(accentHex) {
    if (!window.THREE || !this.coreSphere) return;
    const THREE = window.THREE;
    const col = new THREE.Color(accentHex);

    if (this.pointLight) this.pointLight.color.set(col);
    if (this.innerGlowSphere) this.innerGlowSphere.material.color.set(col);
    if (this.coreSphere) this.coreSphere.material.emissive.set(col);
    if (this.wireSphere) this.wireSphere.material.color.set(col);
    if (this.ring1) {
      this.ring1.material.color.set(col);
      this.ring1.material.emissive.set(col);
    }
    if (this.ring2) this.ring2.material.emissive.set(col);
    if (this.particles) this.particles.material.color.set(col);
  }

  setState(state) {
    this.state = state;
  }

  bindEvents() {
    const el = this.container;

    const onPointerMove = (e) => {
      const rect = el.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      // Normalize pointer [-1, 1]
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);

      this.pointer.x = nx;
      this.pointer.y = ny;
      this.pointer.active = true;

      this.targetRotation.y = nx * 0.9;
      this.targetRotation.x = -ny * 0.6;
    };

    const onPointerLeave = () => {
      this.pointer.active = false;
      this.targetRotation.x = 0;
      this.targetRotation.y = 0;
    };

    el.addEventListener("mousemove", onPointerMove);
    el.addEventListener("touchmove", onPointerMove, { passive: true });
    el.addEventListener("mouseleave", onPointerLeave);
    el.addEventListener("touchend", onPointerLeave);

    el.addEventListener("click", () => {
      // Squash & stretch pulse
      if (this.orbGroup) {
        this.orbGroup.scale.set(1.15, 1.15, 1.15);
        setTimeout(() => {
          if (this.orbGroup) this.orbGroup.scale.set(1, 1, 1);
        }, 220);
      }
      if (this.onClick) this.onClick();
    });

    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    if (!this.clock || !this.orbGroup) return;
    const elapsed = this.clock.getElapsedTime();

    // Smooth head-tracking rotation
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.orbGroup.rotation.x = this.currentRotation.x;
    this.orbGroup.rotation.y = this.currentRotation.y + elapsed * 0.25;

    // Multi-speed sub-object rotations
    if (this.wireSphere) {
      this.wireSphere.rotation.y = -elapsed * 0.35;
      this.wireSphere.rotation.x = elapsed * 0.15;
    }

    if (this.ring1) {
      this.ring1.rotation.z = elapsed * 0.9;
    }

    if (this.ring2) {
      this.ring2.rotation.y = -elapsed * 1.2;
    }

    if (this.particles) {
      this.particles.rotation.y = elapsed * 0.15;
    }

    // Dynamic state animations
    if (this.state === "thinking") {
      const pulse = 1 + Math.sin(elapsed * 10) * 0.06;
      this.coreSphere.scale.set(pulse, pulse, pulse);
      if (this.ring1) this.ring1.rotation.z = elapsed * 2.5;
      if (this.ring2) this.ring2.rotation.y = -elapsed * 3.0;
    } else if (this.state === "speaking") {
      const voiceWave = 1 + Math.sin(elapsed * 14) * 0.08 * (0.8 + Math.random() * 0.4);
      this.coreSphere.scale.set(voiceWave, voiceWave, voiceWave);
      if (this.wireSphere) this.wireSphere.scale.set(voiceWave * 1.05, voiceWave * 1.05, voiceWave * 1.05);
    } else if (this.state === "celebrate") {
      const jump = 1 + Math.abs(Math.sin(elapsed * 8)) * 0.18;
      this.orbGroup.scale.set(jump, jump, jump);
    } else {
      // Idle breathing
      const breath = 1 + Math.sin(elapsed * 2.2) * 0.035;
      this.coreSphere.scale.set(breath, breath, breath);
      this.orbGroup.scale.set(1, 1, 1);
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
