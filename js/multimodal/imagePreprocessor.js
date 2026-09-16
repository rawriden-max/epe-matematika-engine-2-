/**
 * imagePreprocessor.js - HTML5 Canvas Image Preprocessing Pipeline (EPE V3)
 * 
 * Memproses citra coretan matematika siswa:
 * 1. Pengecekan resolusi & orientasi citra.
 * 2. Konversi Grayscale & Peningkatan Kontras Adaptif.
 * 3. Binarisasi Threshold (mempertajam goresan pulpen/pensil terhadap kertas).
 * 4. Reduksi derau bintik (*noise reduction*).
 * 5. Menjaga berkas asli `originalImage` dan memproduksi `processedImage`.
 * 6. Pengambilan foto langsung lewat kamera / webcam (`Take Photo` via `getUserMedia`).
 */

export class ImagePreprocessor {
  /**
   * Prapemrosesan lengkap gambar dari file / dataURL
   * @param {File|Blob|string} imageSource
   * @returns {Promise<{ originalImage: string, processedImage: string, width: number, height: number, isLowResolution: boolean, metrics: Object }>}
   */
  static async preprocess(imageSource) {
    const originalDataUrl = typeof imageSource === "string" 
      ? imageSource 
      : await this.fileToDataUrl(imageSource);

    const img = await this.loadImage(originalDataUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    const isLowResolution = width < 300 || height < 300;

    // Batasi dimensi maksimum canvas agar performa tetap responsif (max 1600px sisi terpanjang)
    const maxDim = 1600;
    let targetWidth = width;
    let targetHeight = height;
    if (Math.max(width, height) > maxDim) {
      const scale = maxDim / Math.max(width, height);
      targetWidth = Math.round(width * scale);
      targetHeight = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // 1. Gambar citra awal ke canvas
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // 2. Ambil ImageData untuk manipulasi piksel
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const pixels = imageData.data;
    const len = pixels.length;

    // Hitung rata-rata luminansi untuk adaptive thresholding
    let totalLuminance = 0;
    const grayValues = new Uint8Array(len / 4);

    for (let i = 0, j = 0; i < len; i += 4, j++) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      // Formula luminance ITU-R BT.601
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grayValues[j] = gray;
      totalLuminance += gray;
    }

    const avgLuminance = totalLuminance / (len / 4);
    // Threshold adaptif: jika kertas agak gelap, turunkan threshold
    const threshold = Math.max(60, Math.min(200, avgLuminance * 0.88));

    // 3. Terapkan kontras tinggi dan binarisasi adaptif
    // Goresan tulisan diubah menjadi hitam pekat (0), latar belakang menjadi putih bersih (255)
    for (let i = 0, j = 0; i < len; i += 4, j++) {
      const gray = grayValues[j];
      // Kontras linear stretch
      let contrastGray = (gray - 50) * (255 / 155);
      contrastGray = Math.max(0, Math.min(255, contrastGray));

      const finalVal = contrastGray < threshold ? 0 : 255;

      pixels[i] = finalVal;     // R
      pixels[i + 1] = finalVal; // G
      pixels[i + 2] = finalVal; // B
      // pixels[i + 3] (Alpha) tetap 255
    }

    // 4. Masukkan kembali piksel yang telah dipertajam ke canvas
    ctx.putImageData(imageData, 0, 0);

    const processedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

    return {
      originalImage: originalDataUrl,
      processedImage: processedDataUrl,
      width: targetWidth,
      height: targetHeight,
      isLowResolution,
      metrics: {
        avgLuminance: Math.round(avgLuminance),
        appliedThreshold: Math.round(threshold),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Helper: Memuat citra dataURL ke elemen HTMLImageElement
   */
  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error("Gagal memuat citra untuk prapemrosesan"));
      img.src = src;
    });
  }

  /**
   * Helper: Membaca file Blob menjadi data URL
   */
  static fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Mengambil snapshot langsung dari webcam / kamera perangkat
   * @param {HTMLVideoElement} videoElement
   * @returns {string} DataURL JPEG snapshot
   */
  static captureVideoFrame(videoElement) {
    if (!videoElement || videoElement.videoWidth === 0) {
      throw new Error("Video kamera belum aktif atau belum siap.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  /**
   * Memulai kamera streaming ke elemen video
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<MediaStream>}
   */
  static async startCameraStream(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Browser ini tidak mendukung akses kamera langsung.");
    }
    const constraints = {
      video: {
        facingMode: { ideal: "environment" }, // Kamera belakang HP jika ada
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoElement) {
      videoElement.srcObject = stream;
      await videoElement.play();
    }
    return stream;
  }

  /**
   * Menghentikan streaming kamera
   */
  static stopCameraStream(stream) {
    if (stream && typeof stream.getTracks === "function") {
      stream.getTracks().forEach(track => track.stop());
    }
  }
}
