// Realistic Layered Horror Foley & Atmospheric Web Audio Synthesizer for:
// THANH MINH: HỌC VIỆN CÔ SƠN (清明)
// Features: Dual-band rain & water droplet impulses, muffled breath-hold filter ducking,
// wooden creaks, howling corridor wind, wet/wood footsteps, Peking Opera horn vibrato,
// waterphone horror stings & monster kill animation sound design.

import { type RealmMode } from './thanhMinhEngine.ts';

export class ThanhMinhAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private breathMuffleFilter: BiquadFilterNode | null = null;
  private rainHighGain: GainNode | null = null;
  private rainLowGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private operaTimer = 0.8;
  private operaStep = 0;
  private heartbeatTimer = 0;
  private pantTimer = 0;
  private thunderTimer = 6.5;
  private creakTimer = 4.2;
  private dropletTimer = 0.12;
  private muted = false;
  private started = false;

  private readonly operaScale = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 440.0, 392.0];

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.78, this.ctx.currentTime, 0.08);
    }
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

        // Global lowpass muffle filter: muffles ambient world to 460Hz while Lâm Tĩnh holds her breath
        this.breathMuffleFilter = this.ctx.createBiquadFilter();
        this.breathMuffleFilter.type = 'lowpass';
        this.breathMuffleFilter.frequency.value = 18000;
        this.breathMuffleFilter.Q.value = 0.7;

        this.breathMuffleFilter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.noiseBuffer = this.buildPinkNoiseBuffer(this.ctx);
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      if (!this.started) {
        this.startAmbientBeds();
        this.started = true;
      }
    } catch {
      // Ignore Web Audio unavailable
    }
  }

  private buildPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Voss-McCartney style smooth pink noise filter for natural rain & wind timbre
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
      data[i] = Math.max(-1, Math.min(1, pink));
    }
    return buf;
  }

  private startAmbientBeds(): void {
    if (!this.ctx || !this.breathMuffleFilter || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // 1. Crisp Exterior Rain Sheet
    const rHighSrc = this.ctx.createBufferSource();
    rHighSrc.buffer = this.noiseBuffer;
    rHighSrc.loop = true;
    const rHighHp = this.ctx.createBiquadFilter();
    rHighHp.type = 'bandpass';
    rHighHp.frequency.setValueAtTime(2200, now);
    rHighHp.Q.setValueAtTime(0.65, now);
    const rHighGain = this.ctx.createGain();
    rHighGain.gain.setValueAtTime(0, now);
    rHighSrc.connect(rHighHp);
    rHighHp.connect(rHighGain);
    rHighGain.connect(this.breathMuffleFilter);
    rHighSrc.start(now);
    this.rainHighGain = rHighGain;

    // 2. Heavy Roof Rain Rumble
    const rLowSrc = this.ctx.createBufferSource();
    rLowSrc.buffer = this.noiseBuffer;
    rLowSrc.loop = true;
    const rLowLp = this.ctx.createBiquadFilter();
    rLowLp.type = 'lowpass';
    rLowLp.frequency.setValueAtTime(340, now);
    const rLowGain = this.ctx.createGain();
    rLowGain.gain.setValueAtTime(0, now);
    rLowSrc.connect(rLowLp);
    rLowLp.connect(rLowGain);
    rLowGain.connect(this.breathMuffleFilter);
    rLowSrc.start(now);
    this.rainLowGain = rLowGain;

    // 3. Eerie Corridor Draft / Howling Wind
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = this.noiseBuffer;
    windSrc.loop = true;
    const windBp = this.ctx.createBiquadFilter();
    windBp.type = 'bandpass';
    windBp.frequency.setValueAtTime(420, now);
    windBp.Q.setValueAtTime(6.5, now);
    const wGain = this.ctx.createGain();
    wGain.gain.setValueAtTime(0, now);
    windSrc.connect(windBp);
    windBp.connect(wGain);
    wGain.connect(this.breathMuffleFilter);
    windSrc.start(now);
    this.windFilter = windBp;
    this.windGain = wGain;

    // 4. Sub-bass Haunting School Room Tone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(44, now);
    const dGain = this.ctx.createGain();
    dGain.gain.setValueAtTime(0, now);
    osc.connect(dGain);
    dGain.connect(this.masterGain!);
    osc.start(now);
    this.droneOsc = osc;
    this.droneGain = dGain;
  }

  public update(
    active: boolean,
    realm: RealmMode,
    holdingBreath: boolean,
    gazeExposure: number,
    radioTuned: boolean,
    dt: number,
    isOutdoor = false,
    exhausted = false
  ): void {
    if (
      !this.ctx ||
      !this.rainHighGain ||
      !this.rainLowGain ||
      !this.windFilter ||
      !this.windGain ||
      !this.droneGain ||
      !this.droneOsc ||
      !this.breathMuffleFilter
    ) {
      return;
    }

    const now = this.ctx.currentTime;

    if (!active) {
      this.rainHighGain.gain.setTargetAtTime(0, now, 0.15);
      this.rainLowGain.gain.setTargetAtTime(0, now, 0.15);
      this.windGain.gain.setTargetAtTime(0, now, 0.15);
      this.droneGain.gain.setTargetAtTime(0, now, 0.15);
      return;
    }

    // Sensory immersion: holding breath muffles world ambience & raises heartbeat prominence
    this.breathMuffleFilter.frequency.setTargetAtTime(holdingBreath ? 480 : 16000, now, 0.12);

    const rainPresence = realm === 'yin' ? 0.35 : isOutdoor ? 1.35 : 0.72;
    this.rainHighGain.gain.setTargetAtTime(0.08 * rainPresence, now, 0.25);
    this.rainLowGain.gain.setTargetAtTime(0.14 * rainPresence, now, 0.25);

    // Sweeping haunting wind resonance
    const windFreq = 320 + Math.sin(now * 0.45) * 140 + (realm === 'yin' ? -80 : 0);
    this.windFilter.frequency.setTargetAtTime(Math.max(180, windFreq), now, 0.2);
    this.windGain.gain.setTargetAtTime(realm === 'yin' ? 0.095 : 0.045, now, 0.3);

    this.droneGain.gain.setTargetAtTime(
      realm === 'yin' ? 0.11 : 0.04 + (gazeExposure / 100) * 0.08,
      now,
      0.22
    );
    this.droneOsc.frequency.setTargetAtTime(realm === 'yin' ? 37 : 44, now, 0.35);

    // Individual rain droplet plinks on eaves / courtyard puddles
    this.dropletTimer -= dt;
    if (this.dropletTimer <= 0 && realm !== 'yin') {
      this.playRainDroplet(isOutdoor);
      this.dropletTimer = isOutdoor ? 0.09 + Math.random() * 0.14 : 0.25 + Math.random() * 0.45;
    }

    // Old wood rafter creaks inside building
    if (!isOutdoor) {
      this.creakTimer -= dt;
      if (this.creakTimer <= 0) {
        this.playWoodCreak();
        this.creakTimer = 5.5 + Math.random() * 8;
      }
    }

    // Distant Peking Opera loudspeaker (with authentic horn megaphone filter)
    this.operaTimer -= dt;
    if (this.operaTimer <= 0) {
      if (radioTuned || Math.random() < 0.68) {
        this.playDistantOperaNote(realm === 'yin');
      }
      this.operaTimer = realm === 'yin' ? 0.78 : 1.45;
    }

    // Rolling storm thunder
    this.thunderTimer -= dt;
    if (this.thunderTimer <= 0) {
      this.playRealisticThunder();
      this.thunderTimer = 10 + Math.random() * 10;
    }

    // Heavy organic heartbeat under breath-hold, exhaustion, or ghost terror
    if (holdingBreath || gazeExposure > 28 || exhausted) {
      this.heartbeatTimer -= dt;
      if (this.heartbeatTimer <= 0) {
        const strength = Math.max(exhausted ? 0.55 : 0, 0.45 + (gazeExposure / 100) * 0.55);
        this.playHeartbeat(strength);
        this.heartbeatTimer = Math.max(0.4, 0.85 - (gazeExposure / 100) * 0.35 - (exhausted ? 0.12 : 0));
      }
    }

    // Heavy fatigued breathing when exhausted
    if (exhausted && !holdingBreath) {
      this.pantTimer -= dt;
      if (this.pantTimer <= 0) {
        this.playExhaustedPant(0.45);
        this.pantTimer = 0.72;
      }
    } else {
      this.pantTimer = 0.15;
    }
  }

  public playExhaustedPant(strength = 0.7): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(680, now);
    bp.frequency.exponentialRampToValueAtTime(420, now + 0.24);
    bp.Q.setValueAtTime(2.6, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.11 * strength, now + 0.045);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.26);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.28);
  }

  private playRainDroplet(isOutdoor: boolean): void {
    if (this.muted || !this.ctx || !this.breathMuffleFilter) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const base = 1100 + Math.random() * 1600;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.035);
    g.gain.setValueAtTime(isOutdoor ? 0.022 : 0.011, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + 0.045);
    osc.connect(g);
    g.connect(this.breathMuffleFilter);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playWoodCreak(): void {
    if (this.muted || !this.ctx || !this.breathMuffleFilter) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const bp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    const startF = 115 + Math.random() * 55;
    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.linearRampToValueAtTime(startF * 0.78, now + 0.42);

    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(620, now);
    bp.Q.setValueAtTime(4.5, now);

    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.038, now + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.45);

    osc.connect(bp);
    bp.connect(g);
    g.connect(this.breathMuffleFilter);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  private playDistantOperaNote(yinMode: boolean): void {
    if (this.muted || !this.ctx || !this.breathMuffleFilter) return;
    const now = this.ctx.currentTime;
    const note = this.operaScale[this.operaStep % this.operaScale.length];
    this.operaStep += 1;

    // Vibrato LFO emulating erhu / Chinese opera falsetto over tinny megaphone speaker
    const osc = this.ctx.createOscillator();
    const vib = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(note * (yinMode ? 0.92 : 1.0), now);
    vib.frequency.setValueAtTime(5.6, now);
    vibGain.gain.setValueAtTime(note * 0.025, now);
    vib.connect(vibGain);
    vibGain.connect(osc.frequency);

    const hornBp = this.ctx.createBiquadFilter();
    hornBp.type = 'bandpass';
    hornBp.frequency.setValueAtTime(1050, now);
    hornBp.Q.setValueAtTime(4.2, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(yinMode ? 0.05 : 0.022, now + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.95);

    osc.connect(hornBp);
    hornBp.connect(g);
    g.connect(this.breathMuffleFilter);
    osc.start(now);
    vib.start(now);
    osc.stop(now + 1.0);
    vib.stop(now + 1.0);

    // Authentic wooden clapper (bản tử) every 4th beat using short filtered noise burst
    if (this.operaStep % 4 === 0 && this.noiseBuffer) {
      const nSrc = this.ctx.createBufferSource();
      nSrc.buffer = this.noiseBuffer;
      const clackBp = this.ctx.createBiquadFilter();
      clackBp.type = 'bandpass';
      clackBp.frequency.setValueAtTime(1650, now);
      clackBp.Q.setValueAtTime(6.0, now);
      const cg = this.ctx.createGain();
      cg.gain.setValueAtTime(yinMode ? 0.1 : 0.045, now);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      nSrc.connect(clackBp);
      clackBp.connect(cg);
      cg.connect(this.breathMuffleFilter);
      nSrc.start(now);
      nSrc.stop(now + 0.055);
    }
  }

  private playRealisticThunder(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // Initial sharp lightning crack
    const crack = this.ctx.createBufferSource();
    crack.buffer = this.noiseBuffer;
    const crackBp = this.ctx.createBiquadFilter();
    crackBp.type = 'bandpass';
    crackBp.frequency.setValueAtTime(750, now);
    const cg = this.ctx.createGain();
    cg.gain.setValueAtTime(0.28, now);
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    crack.connect(crackBp);
    crackBp.connect(cg);
    cg.connect(this.masterGain);
    crack.start(now);
    crack.stop(now + 0.38);

    // Rolling sub-bass thunder echo
    const rumble = this.ctx.createBufferSource();
    rumble.buffer = this.noiseBuffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(140, now);
    lp.frequency.exponentialRampToValueAtTime(52, now + 3.1);
    const rg = this.ctx.createGain();
    rg.gain.setValueAtTime(0.01, now + 0.08);
    rg.gain.linearRampToValueAtTime(0.32, now + 0.35);
    rg.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
    rumble.connect(lp);
    lp.connect(rg);
    rg.connect(this.masterGain);
    rumble.start(now);
    rumble.stop(now + 3.3);
  }

  private playHeartbeat(strength: number): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i += 1) {
      const t = now + i * 0.17;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 64 : 50, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.14);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.28 * strength, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.19);
    }
  }

  public playFootstep(quiet: boolean, isWater = false): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isWater ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(
      isWater ? (quiet ? 950 : 1550) : (quiet ? 220 : 420),
      now
    );

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(quiet ? 0.05 : isWater ? 0.16 : 0.13, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (isWater ? 0.18 : 0.11));

    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.2);

    // Subtle wooden board heel thud when indoors
    if (!isWater) {
      const thud = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      thud.type = 'sine';
      thud.frequency.setValueAtTime(quiet ? 78 : 96, now);
      thud.frequency.exponentialRampToValueAtTime(38, now + 0.07);
      tg.gain.setValueAtTime(quiet ? 0.035 : 0.09, now);
      tg.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      thud.connect(tg);
      tg.connect(this.masterGain);
      thud.start(now);
      thud.stop(now + 0.09);
    }
  }

  public playGasp(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1100, now);
    bp.frequency.linearRampToValueAtTime(1850, now + 0.22);
    bp.Q.setValueAtTime(2.4, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.32, now + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.5);
  }

  public playKillAnimationAudio(killerKind: 'paper_hat' | 'tongue_warden'): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    // 1. Cinematic Sub-Bass Terror Impact Boom
    const boom = this.ctx.createOscillator();
    const bg = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(98, now);
    boom.frequency.exponentialRampToValueAtTime(24, now + 1.2);
    bg.gain.setValueAtTime(0.55, now);
    bg.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
    boom.connect(bg);
    bg.connect(this.masterGain);
    boom.start(now);
    boom.stop(now + 1.35);

    // 2. Discordant Waterphone Metallic Bow Shriek
    for (const freq of [415, 442, 622, 880]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.05);
      osc.frequency.linearRampToValueAtTime(freq * 1.14, now + 1.4);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.085, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.95);
    }

    // 3. Killer Signature Sound (Metallic Iron Shear Snap vs Paper Rustle + Lantern Glass Shatter)
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = killerKind === 'tongue_warden' ? 'bandpass' : 'highpass';
    hp.frequency.setValueAtTime(killerKind === 'tongue_warden' ? 2400 : 3200, now + 0.55);
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.001, now + 0.5);
    sg.gain.linearRampToValueAtTime(0.38, now + 0.58);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    src.connect(hp);
    hp.connect(sg);
    sg.connect(this.masterGain);
    src.start(now + 0.5);
    src.stop(now + 1.0);
  }

  public playRealmShift(toRealm: RealmMode): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(toRealm === 'yin' ? 2400 : 1000, now);
    bp.frequency.linearRampToValueAtTime(toRealm === 'yin' ? 380 : 1950, now + 0.5);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.55);
  }

  public playAltarChime(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.45);
  }

  public playMirrorCrack(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2800, now);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    src.connect(hp);
    hp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.3);
  }

  public playDawnChord(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    for (const freq of [293.66, 369.99, 440.0, 587.33]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.09, now + 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 4.1);
    }
  }

  public playSiren(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(860, now + 0.55);
    osc.frequency.linearRampToValueAtTime(480, now + 1.15);

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(900, now);

    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.18, now + 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

    osc.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.4);
  }

  public playFireCrackle(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1600, now);
    bp.Q.setValueAtTime(1.4, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.02, now);
    g.gain.linearRampToValueAtTime(0.22, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 1.25);
  }

  public playRadioStaticStep(closeness: number): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1600 + closeness * 1200, now);
    bp.Q.setValueAtTime(2.5 + closeness * 4, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.09 * (1 - closeness * 0.55), now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.09);

    if (closeness > 0.72) {
      const tone = this.ctx.createOscillator();
      const tg = this.ctx.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(880, now);
      tg.gain.setValueAtTime(0.05 * closeness, now);
      tg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      tone.connect(tg);
      tg.connect(this.masterGain);
      tone.start(now);
      tone.stop(now + 0.15);
    }
  }

  public playGhostWhisper(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2100, now);
    bp.frequency.exponentialRampToValueAtTime(750, now + 0.55);
    bp.Q.setValueAtTime(4.2, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.005, now);
    g.gain.linearRampToValueAtTime(0.13, now + 0.14);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

    src.connect(bp);
    bp.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.65);
  }

  public playDistantKnock(): void {
    if (this.muted || !this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i += 1) {
      const t = now + i * 0.24;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145 - i * 8, t);
      osc.frequency.exponentialRampToValueAtTime(62, t + 0.08);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.11);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  public playSubtleTensionSting(): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    for (const [freq, detune] of [
      [311.13, 0],
      [329.63, 7],
    ] as const) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(840, now);
      bp.Q.setValueAtTime(3.2, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.055, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0008, now + 1.35);
      osc.connect(bp);
      bp.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 1.4);
    }
  }

  public playBellToll(ringCount = 1): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const base = 196.0;
    for (const [ratio, amp, dur] of [
      [1.0, 0.24, 3.6],
      [1.503, 0.14, 2.8],
      [2.012, 0.09, 2.2],
      [2.756, 0.05, 1.4],
    ] as const) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * ratio * (1 - ringCount * 0.015), now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(amp, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + dur + 0.1);
    }
  }

  public playClockTick(isChime = false): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = isChime ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isChime ? 523.25 : 1320, now);
    osc.frequency.exponentialRampToValueAtTime(isChime ? 520 : 420, now + (isChime ? 0.9 : 0.04));
    g.gain.setValueAtTime(isChime ? 0.18 : 0.1, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + (isChime ? 1.1 : 0.055));
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + (isChime ? 1.15 : 0.06));
  }

  public playPianoNote(freq: number): void {
    if (this.muted || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    // Slightly detuned 1960s haunted upright piano partials
    for (const [detuneCents, gainLevel, decay] of [
      [0, 0.16, 1.5],
      [7, 0.08, 1.25],
      [-5, 0.05, 0.9],
    ] as const) {
      const osc = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200, now);
      lp.frequency.exponentialRampToValueAtTime(520, now + decay);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(gainLevel, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, now + decay);

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    }
  }

  public dispose(): void {
    try {
      this.droneOsc?.stop();
      if (this.ctx && this.ctx.state !== 'closed') {
        void this.ctx.close().catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
    this.ctx = null;
  }
}
