// Procedural 3D Binaural Web Audio Engine for Lưỡng Cước Dương (757 AD Cellar Horror)
// Zero external audio files required — synthesizes all ambience, tactile desk SFX, and spatial horror cues.

export class CellarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private flameGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted = false;
  private started = false;

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.06);
    }
  }

  public isMuted(): boolean {
    return this.muted;
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
        this.masterGain.gain.value = this.muted ? 0 : 0.72;
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
      // Ignore environments without Web Audio API
    }
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 2.8;
    }
    return buffer;
  }

  private startAmbientBeds(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Deep damp cellar drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(48, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);

    this.droneOsc = osc;
    this.droneFilter = filter;
    this.droneGain = gain;

    // Subtle oil lamp air/flame hiss
    if (this.noiseBuffer) {
      const flameSrc = this.ctx.createBufferSource();
      flameSrc.buffer = this.noiseBuffer;
      flameSrc.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(900, now);
      bp.Q.setValueAtTime(1.4, now);

      const fGain = this.ctx.createGain();
      fGain.gain.setValueAtTime(0.025, now);

      flameSrc.connect(bp);
      bp.connect(fGain);
      fGain.connect(this.masterGain);
      flameSrc.start(now);
      this.flameGain = fGain;
    }
  }

  public updateAtmosphere(
    phase: 1 | 2 | 3,
    lampLit: boolean,
    sanity: number,
    active: boolean
  ): void {
    if (!this.ctx || !this.droneGain || !this.droneOsc || !this.droneFilter || !this.flameGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (!active) {
      this.droneGain.gain.setTargetAtTime(0, now, 0.15);
      this.flameGain.gain.setTargetAtTime(0, now, 0.15);
      return;
    }
    const baseDrone = phase === 1 ? 0.04 : phase === 2 ? 0.075 : 0.11;
    const sanityBoost = sanity < 45 ? 0.05 : 0;
    this.droneGain.gain.setTargetAtTime(baseDrone + sanityBoost, now, 0.25);
    this.droneOsc.frequency.setTargetAtTime(phase === 3 ? 41 : phase === 2 ? 45 : 49, now, 0.4);
    this.droneFilter.frequency.setTargetAtTime(lampLit ? 120 : 185, now, 0.3);
    this.flameGain.gain.setTargetAtTime(lampLit ? 0.028 : 0.002, now, 0.2);
  }

  private createPanner(pan: number): AudioNode | null {
    if (!this.ctx || !this.masterGain) return null;
    if (typeof this.ctx.createStereoPanner === 'function') {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      p.connect(this.masterGain);
      return p;
    }
    return this.masterGain;
  }

  public playAbacusClack(pitchScale = 1): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.createPanner(0.28);
    if (!dest) return;

    osc.type = 'triangle';
    const baseFreq = (720 + Math.random() * 140) * pitchScale;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playScaleClink(heavy = false): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.createPanner(-0.22);
    if (!dest) return;

    osc.type = 'sine';
    overtone.type = 'sine';
    const freq = heavy ? 520 : 980 + Math.random() * 180;
    osc.frequency.setValueAtTime(freq, now);
    overtone.frequency.setValueAtTime(freq * 2.41, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    overtone.connect(gain);
    gain.connect(dest);
    osc.start(now);
    overtone.start(now);
    osc.stop(now + 0.24);
    overtone.stop(now + 0.24);
  }

  public playPulleyCreak(): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.createPanner(-0.45);
    if (!dest) return;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.linearRampToValueAtTime(215, now + 0.16);
    osc.frequency.linearRampToValueAtTime(122, now + 0.38);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.44);
  }

  public playInkDip(): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const dest = this.createPanner(0.35);
    if (!dest) return;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playSealSlam(isBloodPhase: boolean): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const dest = this.createPanner(0.08);
    if (!dest) return;

    // Low wooden desk thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(isBloodPhase ? 125 : 155, now);
    thud.frequency.exponentialRampToValueAtTime(34, now + 0.18);

    thudGain.gain.setValueAtTime(0.45, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    thud.connect(thudGain);
    thudGain.connect(dest);
    thud.start(now);
    thud.stop(now + 0.24);

    // Crisp transient click
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 600;
      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.22, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      noise.connect(hp);
      hp.connect(nGain);
      nGain.connect(dest);
      noise.start(now);
      noise.stop(now + 0.07);
    }
  }

  public playLampLight(): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const dest = this.createPanner(-0.35);
    if (!dest) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(520, now);
    bp.frequency.exponentialRampToValueAtTime(1600, now + 0.14);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + 0.3);
  }

  public playRattleSound(): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    for (let i = 0; i < 4; i += 1) {
      const t = now + i * 0.075;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const dest = this.createPanner(i % 2 === 0 ? -0.15 : 0.15);
      if (!dest) return;
      osc.type = 'square';
      osc.frequency.setValueAtTime(860 + (i % 2) * 210, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.045);
    }
  }

  // 3D Binaural Horror Cues
  public playDoorPound(intensity: number): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const bangs = Math.max(1, Math.min(3, Math.round(intensity)));
    for (let i = 0; i < bangs; i += 1) {
      const t = now + i * 0.22;
      const dest = this.createPanner(-0.82); // Heavy iron door on the left wall
      if (!dest) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(92, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.19);
      gain.gain.setValueAtTime(0.32 + intensity * 0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  public playNailScratch(pan = -0.78): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const dest = this.createPanner(pan);
    if (!dest) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2100, now);
    bp.frequency.linearRampToValueAtTime(3400, now + 0.35);
    bp.Q.value = 6.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + 0.5);
  }

  public playBreathingBehindNeck(): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const pan = (Math.random() > 0.5 ? 1 : -1) * 0.22;
    const dest = this.createPanner(pan);
    if (!dest) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'bandpass';
    lp.frequency.setValueAtTime(420, now);
    lp.Q.value = 2.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.19, now + 0.22);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.52);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.72);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + 1.08);
  }

  public playWhisperAtVent(): void {
    if (this.muted || !this.ctx || !this.noiseBuffer) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const dest = this.createPanner(0.75); // Air vent is high on the right wall
    if (!dest) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1450, now);
    bp.frequency.linearRampToValueAtTime(980, now + 0.45);
    bp.Q.value = 5.2;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + 0.56);
  }

  public playEndingChime(liberation: boolean): void {
    if (this.muted || !this.ctx) return;
    this.unlock();
    const now = this.ctx.currentTime;
    const dest = this.masterGain;
    if (!dest) return;

    const freqs = liberation ? [220, 330, 440] : [110, 104, 73];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = liberation ? 'sine' : 'sawtooth';
      const t = now + idx * 0.14;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(liberation ? 0.14 : 0.11, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t);
      osc.stop(t + 1.45);
    });
  }

  public dispose(): void {
    try {
      this.droneOsc?.stop();
    } catch {
      // ignore
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.started = false;
  }
}
