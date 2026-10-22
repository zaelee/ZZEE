const VERSION = '0.10.32';
const BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export class HandCamera {
  constructor(video) {
    this.video = video; this.serial = 0; this.detector = null;
    this.mirrored = true; this.stream = null; this.lastTime = -1; this.lastInference = 0;
  }
  async start(onStatus, count = 1, facing = 'user') {
    this.stop(); const serial = this.serial;
    if (!globalThis.isSecureContext) throw Object.assign(new Error('카메라는 HTTPS 주소에서 사용할 수 있어요. 지금은 터치로 출격해주세요.'), { name: 'InsecureContextError' });
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('이 브라우저에서 카메라를 사용할 수 없어요. Chrome이나 Safari에서 로컬 주소를 열어주세요.');
    onStatus('카메라 사용을 허용해주세요');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    if (serial !== this.serial) { stream.getTracks().forEach(t => t.stop()); return false; }
    this.mirrored = (stream.getVideoTracks()[0]?.getSettings().facingMode || facing) !== 'environment';
    this.stream = stream; this.video.srcObject = stream;
    try {
      await this.video.play();
      if (serial !== this.serial) return false;
      onStatus('손 추적을 준비하고 있어요… 첫 실행은 조금 걸릴 수 있어요');
      const { HandLandmarker, FilesetResolver } = await import(`${BASE}/vision_bundle.mjs`);
      if (serial !== this.serial) return false;
      const vision = await FilesetResolver.forVisionTasks(`${BASE}/wasm`);
      if (serial !== this.serial) return false;
      const config = { baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numHands: Math.max(1, Math.min(4, count)),
        minHandDetectionConfidence: 0.55, minHandPresenceConfidence: 0.55, minTrackingConfidence: 0.5 };
      let detector;
      try { detector = await HandLandmarker.createFromOptions(vision, config); }
      catch { config.baseOptions.delegate = 'CPU'; detector = await HandLandmarker.createFromOptions(vision, config); }
      if (serial !== this.serial) { detector.close(); return false; }
      this.detector = detector; this.lastTime = -1; this.lastInference = 0;
      return true;
    } catch (error) { if (serial === this.serial) this.stop(); throw error; }
  }
  detect(now) {
    if (!this.detector || this.video.readyState < 2 || now - this.lastInference < 50 || this.video.currentTime === this.lastTime) return undefined;
    this.lastInference = now; this.lastTime = this.video.currentTime;
    return this.detector.detectForVideo(this.video, now).landmarks;
  }
  stop() {
    this.serial++; this.stream?.getTracks().forEach(t => t.stop()); this.stream = null;
    this.video.pause(); this.video.srcObject = null;
    this.detector?.close(); this.detector = null;
  }
}
