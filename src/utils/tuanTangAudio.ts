// 3D HRTF Binaural Web Audio & Real-Time Microphone Breath-Hold Engine
// for TUẪN TÁNG: ĐỊA CUNG LY SƠN (殉葬)

export type MicStatus = 'uninitialized' | 'requesting' | 'active' | 'denied' | 'unsupported';

export class TuanTangAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Ambient beds
  private tombDroneOsc: OscillatorNode | null = null;
  private tombDroneGain: GainNode | null = null;
  private mercuryFlowGain: GainNode | null = null;
  private flameHissGain: GainNode | null = null;
  private heartbeatTimer = 0;

  // Real-time Microphone Breath Analyzer
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micTimeData: Float32Array<ArrayBuffer> | null = null;
  private micStatus: MicStatus = 'uninitialized';
  private micError: string | null = null;
  private smoothedMicLevel = 0;

  // Listener pose (world space)
  private lx = 0;
  private ly = 1.6;
  private lz = 3;
  private lyaw = 0;

  private muted = false;
  private started = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.78, this.ctx.currentTime, 0.06);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public getMicStatus(): MicStatus {
    return this.micStatus;
  }

  public getMicError(): string | null {
    return this.micError;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.muted ? 0 : 0.78;
        this.masterGain.connect(this.ctx.destination);
        this.noiseBuffer = this.buildNoiseBuffer(this.ctx);
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      if (!this.started) {
        this.startAmbientBeds();
        this.started = true;
      }
    } catch {
      // Ignore environments without Web Audio
    }
  }

  public async requestMicrophone(): Promise<MicStatus> {
    this.unlock();
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      this.micStatus = 'unsupported';
      this.micError = 'Trình duyệt không hỗ trợ API Microphone.';
      return this.micStatus;
    }

    if (this.micStatus === 'active' && this.micAnalyser) {
      return 'active';
    }

    this.micStatus = 'requesting';
    this.micError = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      this.micStream = stream;
      if (!this.ctx) this.unlock();
      if (!this.ctx) {
        this.micStatus = 'unsupported';
        return this.micStatus;
      }

      const source = this.ctx.createMediaStreamSource(stream);
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.35;
      // Connect ONLY to analyser (never to destination -> zero speaker feedback!)
      source.connect(analyser);

      this.micSource = source;
      this.micAnalyser = analyser;
      this.micTimeData = new Float32Array(new ArrayBuffer(analyser.fftSize * 4));
      this.micStatus = 'active';
      return 'active';
    } catch (err) {
      this.micStatus = 'denied';
      this.micError =
        err instanceof Error
          ? err.message
          : 'Không thể truy cập Microphone. Dùng chế độ nín thở thay thế.';
      return 'denied';
    }
  }

  public sampleMicLevel(gainMultiplier = 1.0): number {
    if (this.micStatus !== 'active' || !this.micAnalyser || !this.micTimeData) {
      this.smoothedMicLevel *= 0.85;
      return this.smoothedMicLevel;
    }

    this.micAnalyser.getFloatTimeDomainData(this.micTimeData);
    let sumSq = 0;
    let peak = 0;
    const arr = this.micTimeData;
    for (let i = 0; i < arr.length; i += 1) {
      const v = Math.abs(arr[i]);
      sumSq += v * v;
      if (v > peak) peak = v;
    }
    const rms = Math.sqrt(sumSq / arr.length);
    // Map sensitive breath / swallow / gasp energy to 0..100
    const rawScore = Math.min(100, (rms * 580 + peak * 115) * gainMultiplier);
    this.smoothedMicLevel = this.smoothedMicLevel * 0.45 + rawScore * 0.55;
    return this.smoothedMicLevel;
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.035 * white) / 1.035;
      data[i] = last * 3.0;
    }
    return buffer;
  }

  private startAmbientBeds(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Subterranean mausoleum sub-drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(38, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(92, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);

    this.tombDroneOsc = osc;
    this.tombDroneGain = gain;

    // Flowing underground liquid mercury hiss
    if (this.noiseBuffer) {
      const mercSrc = this.ctx.createBufferSource();
      mercSrc.buffer = this.noiseBuffer;
      mercSrc.loop = true;

      const mercFilter = this.ctx.createBiquadFilter();
      mercFilter.type = 'bandpass';
      mercFilter.frequency.setValueAtTime(360, now);
      mercFilter.Q.setValueAtTime(1.8, now);

      const mercGain = this.ctx.createGain();
      mercGain.gain.setValueAtTime(0, now);

      mercSrc.connect(mercFilter);
      mercFilter.connect(mercGain);
      mercGain.connect(this.masterGain);
      mercSrc.start(now);
      this.mercuryFlowGain = mercGain;

      // Matchstick crackle hiss
      const flameSrc = this.ctx.createBufferSource();
      flameSrc.buffer = this.noiseBuffer;
      flameSrc.loop = true;

      const flameFilter = this.ctx.createBiquadFilter();
      flameFilter.type = 'highpass';
      flameFilter.frequency.setValueAtTime(1400, now);

      const flameGain = this.ctx.createGain();
      flameGain.gain.setValueAtTime(0, now);

      flameSrc.connect(flameFilter);
      flameFilter.connect(flameGain);
      flameGain.connect(this.masterGain);
      flameSrc.start(now);
      this.flameHissGain = flameGain;
    }
  }

  public setListenerPose(x: number, y: number, z: number, yaw: number, pitch: number): void {
    this.lx = x;
    this.ly = y;
    this.lz = z;
    this.lyaw = yaw;
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    const now = this.ctx.currentTime;

    // Forward vector matching Three.js camera
    const cosPitch = Math.cos(pitch);
    const fx = -Math.sin(yaw) * cosPitch;
    const fy = Math.sin(pitch);
    const fz = -Math.cos(yaw) * cosPitch;

    if ('positionX' in listener && listener.positionX) {
      listener.positionX.setValueAtTime(x, now);
      listener.positionY.setValueAtTime(y, now);
      listener.positionZ.setValueAtTime(z, now);
      listener.forwardX.setValueAtTime(fx, now);
      listener.forwardY.setValueAtTime(fy, now);
      listener.forwardZ.setValueAtTime(fz, now);
      listener.upX.setValueAtTime(0, now);
      listener.upY.setValueAtTime(1, now);
      listener.upZ.setValueAtTime(0, now);
    }
  }

  public updateAtmosphere(
    active: boolean,
    matchLit: boolean,
    mercuryToxicity: number,
    sniffDanger: number,
    nearMercury: boolean,
    dt: number
  ): void {
    if (!this.ctx || !this.tombDroneGain || !this.mercuryFlowGain || !this.flameHissGain) return;
    const now = this.ctx.currentTime;

    if (!active) {
      this.tombDroneGain.gain.setTargetAtTime(0, now, 0.15);
      this.mercuryFlowGain.gain.setTargetAtTime(0, now, 0.15);
      this.flameHissGain.gain.setTargetAtTime(0, now, 0.15);
      return;
    }

    const baseDrone = 0.05 + (mercuryToxicity / 100) * 0.06 + (sniffDanger / 100) * 0.06;
    this.tombDroneGain.gain.setTargetAtTime(baseDrone, now, 0.25);
    this.mercuryFlowGain.gain.setTargetAtTime(nearMercury ? 0.065 : 0.014, now, 0.3);
    this.flameHissGain.gain.setTargetAtTime(matchLit ? 0.036 : 0, now, 0.08);

    // Subdued tense heartbeat when danger or toxicity spikes
    if (sniffDanger > 10 || mercuryToxicity > 55) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        this.playHeartbeat(0.25 + (sniffDanger / 100) * 0.45);
        this.heartbeatTimer = Math.max(0.42, 0.95 - (sniffDanger / 100) * 0.45);
      }
    }
  }

  private createHRTFPanner(wx: number, wy: number, wz: number, refDist = 2.5, maxDist = 45): AudioNode | null {
    if (!this.ctx || !this.masterGain) return null;
    if (typeof this.ctx.createPanner === 'function') {
      const panner = this.ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = refDist;
      panner.maxDistance = maxDist;
      panner.rolloffFactor = 1.45;
      panner.positionX.setValueAtTime(wx, this.ctx.currentTime);
      panner.positionY.setValueAtTime(wy, this.ctx.currentTime);
      panner.positionZ.setValueAtTime(wz, this.ctx.currentTime);
      panner.connect(this.masterGain);
      return panner;
    }
    return this.masterGain;
  }

  private playHeartbeat(strength: number): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    for (let beat = 0; beat < 2; beat += 1) {
      const t = now + beat * 0.16;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(beat === 0 ? 58 : 48, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.14);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.24 * strength, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  public playMatchStrike(outcome: 'lit' | 'damp_fail' | 'extinguished'): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    this.unlock();
    const now = this.ctx.currentTime;

    // Sharp phosphorus box scrape
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(outcome === 'extinguished' ? 950 : 2800, now);
    bp.Q.setValueAtTime(2.2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (outcome === 'lit' ? 0.24 : 0.14));

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.26);

    if (outcome === 'lit') {
      // Ignition warm whoosh
      const whoosh = this.ctx.createBufferSource();
      whoosh.buffer = this.noiseBuffer;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(900, now + 0.08);
      const wg = this.ctx.createGain();
      wg.gain.setValueAtTime(0.01, now + 0.07);
      wg.gain.linearRampToValueAtTime(0.26, now + 0.14);
      wg.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      whoosh.connect(lp);
      lp.connect(wg);
      wg.connect(this.masterGain);
      whoosh.start(now + 0.07);
      whoosh.stop(now + 0.48);
    }
  }

  public playFootstep(crouching: boolean, sprinting: boolean): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(crouching ? 240 : sprinting ? 720 : 440, now);

    const gain = this.ctx.createGain();
    const vol = crouching ? 0.045 : sprinting ? 0.22 : 0.11;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.16);
  }

  public playCrawlerScuttle3D(wx: number, wy: number, wz: number, intensity = 0.7): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const dest = this.createHRTFPanner(wx, wy, wz, 2.2, 48);
    if (!dest) return;
    const now = this.ctx.currentTime;

    // Rapid double claw-slap on damp stone / ceiling
    for (let k = 0; k < 2; k += 1) {
      const t = now + k * 0.075;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(850 + k * 340, t);
      bp.Q.setValueAtTime(3.2, t);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.18 * intensity, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      src.connect(bp);
      bp.connect(g);
      g.connect(dest);
      src.start(t);
      src.stop(t + 0.08);
    }
  }

  public playSniffSlit3D(wx: number, wy: number, wz: number): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const dest = this.createHRTFPanner(wx, wy, wz, 1.0, 20);
    if (!dest) return;
    const now = this.ctx.currentTime;

    // Wet raspy inhale + exhale right outside the stone gap
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1150, now);
    bp.frequency.linearRampToValueAtTime(1650, now + 0.22);
    bp.Q.setValueAtTime(4.0, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.28, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(now);
    src.stop(now + 0.44);
  }

  public playClayScrapeBehind(wx: number, wz: number): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const dest = this.createHRTFPanner(wx, 1.4, wz, 1.6, 30);
    if (!dest) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(98, now + 0.38);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.setValueAtTime(5.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playCough(suppressed: boolean): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    for (let i = 0; i < 2; i += 1) {
      const t = now + i * 0.22;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = suppressed ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(suppressed ? 210 : 780, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(suppressed ? 0.08 : 0.34, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start(t);
      src.stop(t + 0.2);
    }
  }

  // BINAURAL TRICK: Places hyper-realistic wooden door knocks DIRECTLY BEHIND the player's real chair
  public playBinauralRoomKnock(): void {
    if (this.muted || !this.ctx) return;
    // Compute position 1.1m directly behind the listener's current facing direction
    const behindX = this.lx + Math.sin(this.lyaw) * 1.1;
    const behindZ = this.lz + Math.cos(this.lyaw) * 1.1;
    const dest = this.createHRTFPanner(behindX, this.ly, behindZ, 0.8, 12);
    if (!dest) return;
    const now = this.ctx.currentTime;

    for (let k = 0; k < 3; k += 1) {
      const t = now + k * 0.21;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(165 - k * 8, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.075);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  // BINAURAL TRICK: Eerie whisper behind left/right ear
  public playBinauralWhisper(): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    const side = Math.random() > 0.5 ? 1 : -1;
    const bx = this.lx + Math.sin(this.lyaw) * 0.75 + Math.cos(this.lyaw) * 0.55 * side;
    const bz = this.lz + Math.cos(this.lyaw) * 0.75 - Math.sin(this.lyaw) * 0.55 * side;
    const dest = this.createHRTFPanner(bx, this.ly + 0.08, bz, 0.6, 10);
    if (!dest) return;
    const now = this.ctx.currentTime;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1850, now);
    bp.frequency.linearRampToValueAtTime(1120, now + 0.9);
    bp.Q.setValueAtTime(6.0, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.24, now + 0.22);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(now);
    src.stop(now + 1.2);
  }

  public playCrossbowSnap(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
    g.gain.setValueAtTime(0.45, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playUncutDeathFoley(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // 1. Violent screech & bone snap
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = 'square';
    snap.frequency.setValueAtTime(290, now + 0.18);
    snap.frequency.exponentialRampToValueAtTime(44, now + 0.34);
    snapGain.gain.setValueAtTime(0.48, now + 0.18);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    snap.connect(snapGain);
    snapGain.connect(this.masterGain);
    snap.start(now + 0.18);
    snap.stop(now + 0.4);

    // 2. Dragging body scrape on rough stone
    const drag = this.ctx.createBufferSource();
    drag.buffer = this.noiseBuffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(520, now + 0.4);
    const dragGain = this.ctx.createGain();
    dragGain.gain.setValueAtTime(0.32, now + 0.4);
    dragGain.gain.exponentialRampToValueAtTime(0.001, now + 2.9);
    drag.connect(lp);
    lp.connect(dragGain);
    dragGain.connect(this.masterGain);
    drag.start(now + 0.35);
    drag.stop(now + 3.0);

    // 3. Muffled choked scream fading into pitch black
    const cry = this.ctx.createOscillator();
    const cryFilter = this.ctx.createBiquadFilter();
    const cryGain = this.ctx.createGain();
    cry.type = 'sawtooth';
    cry.frequency.setValueAtTime(520, now + 0.6);
    cry.frequency.exponentialRampToValueAtTime(160, now + 2.4);
    cryFilter.type = 'lowpass';
    cryFilter.frequency.setValueAtTime(1100, now + 0.6);
    cryFilter.frequency.exponentialRampToValueAtTime(190, now + 2.4);
    cryGain.gain.setValueAtTime(0.24, now + 0.6);
    cryGain.gain.exponentialRampToValueAtTime(0.001, now + 2.55);
    cry.connect(cryFilter);
    cryFilter.connect(cryGain);
    cryGain.connect(this.masterGain);
    cry.start(now + 0.6);
    cry.stop(now + 2.6);
  }

  public playDesperateEndingSwarm(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Howling surface wind through narrow slit + rising chorus of rasping breaths below
    const wind = this.ctx.createBufferSource();
    wind.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(620, now);
    bp.frequency.linearRampToValueAtTime(340, now + 4.5);
    bp.Q.setValueAtTime(2.6, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.32, now + 1.2);
    g.gain.linearRampToValueAtTime(0.42, now + 4.2);
    g.gain.exponentialRampToValueAtTime(0.001, now + 5.8);

    wind.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    wind.start(now);
    wind.stop(now + 5.9);
  }

  public dispose(): void {
    try {
      if (this.micStream) {
        for (const track of this.micStream.getTracks()) {
          track.stop();
        }
      }
      this.micSource?.disconnect();
      this.micAnalyser?.disconnect();
      this.tombDroneOsc?.stop();
      if (this.ctx && this.ctx.state !== 'closed') {
        void this.ctx.close().catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
    this.ctx = null;
    this.micStream = null;
    this.micSource = null;
    this.micAnalyser = null;
  }
}
