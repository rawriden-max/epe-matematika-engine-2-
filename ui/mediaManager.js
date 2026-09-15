/**
 * mediaManager.js - Pengelola Media Multimedia (Gambar, File, Audio/Voice Note)
 * Mendukung:
 * 1. Upload & Preview Gambar (Base64 data URL, Zoom Preview)
 * 2. Upload & Download File Lampiran (PDF, TXT, DOCX, dll.)
 * 3. Perekaman Suara Mikrofon Langsung di Browser (Web MediaStream Recording API) + Upload File Audio
 */

export class MediaManager {
  /**
   * Mengonversi file menjadi Base64 Data URL
   * @param {File} file 
   * @returns {Promise<string>}
   */
  static readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Mengonversi file teks atau data
   * @param {File} file 
   * @returns {Promise<{name: string, size: number, type: string, dataUrl: string}>}
   */
  static async processAttachmentFile(file) {
    const dataUrl = await this.readFileAsDataURL(file);
    return {
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      dataUrl: dataUrl
    };
  }

  /**
   * Format ukuran file menjadi teks yang mudah dibaca (KB / MB)
   * @param {number} bytes 
   * @returns {string}
   */
  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }
}

/**
 * VoiceRecorder - Modul Perekam Suara Langsung di Browser
 */
export class VoiceRecorder {
  constructor({ onStateChange, onAudioReady } = {}) {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.audioStream = null;
    this.audioUrl = null;
    this.audioBlob = null;
    this.recordingTime = 0;
    this.timerInterval = null;

    this.onStateChange = onStateChange || (() => {});
    this.onAudioReady = onAudioReady || (() => {});
  }

  /**
   * Memeriksa apakah browser mendukung perekaman suara
   * @returns {boolean}
   */
  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  /**
   * Memulai perekaman suara dari mikrofon
   */
  async startRecording() {
    if (!VoiceRecorder.isSupported()) {
      throw new Error("Browser Anda tidak mendukung perekaman audio langsung. Gunakan Chrome, Firefox, Edge, atau Safari terbaru.");
    }

    try {
      this.audioChunks = [];
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Pilih MIME type yang didukung browser
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType || "audio/webm" });
        this.audioUrl = URL.createObjectURL(this.audioBlob);
        
        // Konversi ke base64 untuk penyimpanan lokal
        const base64Data = await MediaManager.readFileAsDataURL(this.audioBlob);
        this.onAudioReady({
          blob: this.audioBlob,
          url: this.audioUrl,
          base64: base64Data,
          duration: this.recordingTime
        });
      };

      this.mediaRecorder.start(200); // chunk setiap 200ms
      this.isRecording = true;
      this.recordingTime = 0;
      
      this.timerInterval = setInterval(() => {
        this.recordingTime++;
        this.onStateChange({ isRecording: true, time: this.recordingTime });
      }, 1000);

      this.onStateChange({ isRecording: true, time: 0 });
    } catch (err) {
      this.stopRecordingTracks();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Izin akses mikrofon ditolak. Mohon izinkan akses mikrofon pada browser Anda.");
      }
      throw new Error("Gagal memulai perekaman audio: " + err.message);
    }
  }

  /**
   * Menghentikan perekaman suara
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      clearInterval(this.timerInterval);
      this.stopRecordingTracks();
      this.onStateChange({ isRecording: false, time: this.recordingTime });
    }
  }

  /**
   * Mematikan akses perangkat mikrofon
   */
  stopRecordingTracks() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
  }

  /**
   * Format detik menjadi teks waktu (MM:SS)
   * @param {number} seconds 
   * @returns {string}
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}
