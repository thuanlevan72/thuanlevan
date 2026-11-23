export type AntiqueSfxKind = 'paper' | 'cover_open' | 'pickup' | 'wrong' | 'hint' | 'ending';

class AntiqueShopAudioEngine {
  private ctx: AudioContext | null = null;
  private musicTimer: number | null = null;
  private stepIdx = 0;
  private musicActive = false;
  private paperBuffer: AudioBuffer | null = null;
  private paperBufferRate = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.ensureContext();
  }

  public playSfx(kind: AntiqueSfxKind, muted: boolean) {
    if (muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (kind === 'paper') {
      // Lazily build and cache filtered white-noise paper rustle once per sampleRate
      if (!this.paperBuffer || this.paperBufferRate !== ctx.sampleRate) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.14);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.42));
        }
        this.paperBuffer = buffer;
        this.paperBufferRate = ctx.sampleRate;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = this.paperBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1600, now);
      bandpass.frequency.exponentialRampToValueAtTime(2400, now + 0.12);
      bandpass.Q.value = 1.4;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(bandpass).connect(gain).connect(ctx.destination);
      noise.start(now);
      return;
    }

    if (kind === 'cover_open') {
      // Warm wooden latch click + soft slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(135, now + 0.08);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
      this.playSfx('paper', false);
      return;
    }

    if (kind === 'pickup') {
      // Gentle crystal + music-box chime (D5 -> A5)
      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((freq, idx) => {
        const t = now + idx * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.07 : 0.05, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.42);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
      return;
    }

    if (kind === 'wrong') {
      // Muted wooden tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.06);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
      return;
    }

    if (kind === 'hint') {
      // Warm lantern bell (E5 -> B5)
      [659.25, 987.77].forEach((freq, idx) => {
        const t = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.055, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.58);
      });
      return;
    }

    if (kind === 'ending') {
      // Cozy nocturnal cadence chord (Fmaj9)
      const chord = [174.61, 261.63, 329.63, 392.0, 440.0];
      chord.forEach((freq, idx) => {
        const t = now + idx * 0.08;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.048, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 1.4);
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1.45);
      });
    }
  }

  public startLofiLoop() {
    if (this.musicActive) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.musicActive = true;

    // Gentle midnight upright felt-piano progression: Fmaj7 -> Em7 -> Dm9 -> Cmaj7
    const chords: Array<{ bass: number; notes: number[]; melody: number }> = [
      { bass: 174.61, notes: [261.63, 329.63, 440.0], melody: 659.25 },
      { bass: 164.81, notes: [246.94, 293.66, 392.0], melody: 587.33 },
      { bass: 146.83, notes: [220.0, 261.63, 329.63], melody: 523.25 },
      { bass: 130.81, notes: [246.94, 293.66, 392.0], melody: 493.88 },
    ];

    const playBeat = () => {
      if (!this.musicActive || !this.ctx) return;
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => {});
      }
      const now = this.ctx.currentTime;
      const bar = chords[this.stepIdx % chords.length];
      this.stepIdx += 1;

      const playFeltNote = (freq: number, startOffset: number, dur: number, peak: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + startOffset);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(980, now + startOffset);
        filter.frequency.exponentialRampToValueAtTime(420, now + startOffset + dur);
        gain.gain.setValueAtTime(0.0005, now + startOffset);
        gain.gain.linearRampToValueAtTime(peak, now + startOffset + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + startOffset + dur);
        osc.connect(filter).connect(gain).connect(this.ctx.destination);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + dur + 0.05);
      };

      playFeltNote(bar.bass, 0, 2.3, 0.026);
      bar.notes.forEach((n, idx) => {
        playFeltNote(n, 0.08 + idx * 0.14, 1.9, 0.015);
      });
      playFeltNote(bar.melody, 0.95, 1.25, 0.012);
    };

    playBeat();
    this.musicTimer = window.setInterval(playBeat, 2600);
  }

  public stopLofiLoop() {
    this.musicActive = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const antiqueShopAudio = new AntiqueShopAudioEngine();
