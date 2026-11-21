import type { BaseContext } from 'tone';

export interface PianoRegisterProfile {
  band: 'bass-low' | 'bass-high' | 'tenor' | 'alto' | 'treble';
  harmonics: number[];
  decaySec: number;
  promptDropRatio: number;
  promptTimeSec: number;
  hammerGain: number;
  hammerCutoffMul: number;
  inharmonicityCents: number;
}

const PIANO_REGISTER_BANDS: Record<
  PianoRegisterProfile['band'],
  Omit<PianoRegisterProfile, 'band'>
> = {
  // Real copper-wound bass strings have dominant 2nd/3rd harmonics & long singing decay
  'bass-low': {
    harmonics: [0.58, 1.0, 0.84, 0.62, 0.44, 0.31, 0.21, 0.14, 0.09, 0.055, 0.032, 0.018],
    decaySec: 4.1,
    promptDropRatio: 0.66,
    promptTimeSec: 0.28,
    hammerGain: 0.19,
    hammerCutoffMul: 3.6,
    inharmonicityCents: 3.4,
  },
  'bass-high': {
    harmonics: [0.78, 1.0, 0.72, 0.49, 0.32, 0.2, 0.12, 0.075, 0.045, 0.024],
    decaySec: 3.3,
    promptDropRatio: 0.62,
    promptTimeSec: 0.24,
    hammerGain: 0.17,
    hammerCutoffMul: 3.4,
    inharmonicityCents: 2.6,
  },
  // Singing concert tenor/mid-range (C3–B4): warm fundamental + rich woody 2nd–5th partials
  tenor: {
    harmonics: [1.0, 0.68, 0.41, 0.24, 0.135, 0.075, 0.04, 0.02],
    decaySec: 2.55,
    promptDropRatio: 0.56,
    promptTimeSec: 0.21,
    hammerGain: 0.16,
    hammerCutoffMul: 3.1,
    inharmonicityCents: 2.0,
  },
  alto: {
    harmonics: [1.0, 0.52, 0.26, 0.12, 0.055, 0.025, 0.012],
    decaySec: 1.95,
    promptDropRatio: 0.52,
    promptTimeSec: 0.18,
    hammerGain: 0.15,
    hammerCutoffMul: 2.8,
    inharmonicityCents: 1.7,
  },
  // Upper treble (C5+): crystalline bell-like shimmer & tighter natural decay
  treble: {
    harmonics: [1.0, 0.34, 0.13, 0.048, 0.018],
    decaySec: 1.35,
    promptDropRatio: 0.48,
    promptTimeSec: 0.14,
    hammerGain: 0.13,
    hammerCutoffMul: 2.4,
    inharmonicityCents: 1.4,
  },
};

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getPianoRegisterProfile(midi: number): PianoRegisterProfile {
  const band: PianoRegisterProfile['band'] =
    midi < 43
      ? 'bass-low'
      : midi < 55
      ? 'bass-high'
      : midi < 67
      ? 'tenor'
      : midi < 77
      ? 'alto'
      : 'treble';
  return { band, ...PIANO_REGISTER_BANDS[band] };
}

/**
 * Stereo keyboard perspective: bass slightly left (-0.28), high treble slightly right (+0.28).
 */
export function computePianoStereoPan(midi: number): number {
  const clamped = Math.max(28, Math.min(96, midi));
  const normalized = (clamped - 60) / 36;
  return Math.max(-0.32, Math.min(0.32, Number((normalized * 0.28).toFixed(3))));
}

/**
 * Computes velocity-coupled lowpass filter opening & settling frequencies for an acoustic piano strike.
 */
export function computePianoFilterCurve(
  freqHz: number,
  velocity: number
): { startHz: number; settleHz: number; tailHz: number; decayTimeSec: number } {
  const vel = Math.max(0.08, Math.min(1, velocity));
  const brightMul = 3.8 + vel * 6.8;
  const startHz = Math.max(850, Math.min(9600, freqHz * brightMul));
  const settleHz = Math.max(380, Math.min(3400, freqHz * (1.7 + vel * 1.1)));
  const tailHz = Math.max(260, Math.min(1800, freqHz * 1.28));
  const decayTimeSec = 0.16 + (1 - Math.min(1, freqHz / 1200)) * 0.16;
  return { startHz, settleHz, tailHz, decayTimeSec };
}

function buildPeriodicWaveForHarmonics(
  ctx: BaseContext,
  harmonics: number[]
): PeriodicWave {
  const len = harmonics.length + 1;
  const real = new Float32Array(len);
  const imag = new Float32Array(len);
  // Subtle mixed phase offsets avoid harsh saw-like constructive spikes at t=0
  harmonics.forEach((amp, idx) => {
    const partialNum = idx + 1;
    const phase = (partialNum * 0.6180339887) % (Math.PI * 2);
    real[partialNum] = amp * Math.sin(phase) * 0.25;
    imag[partialNum] = amp * Math.cos(phase);
  });
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function createHammerNoiseBuffer(ctx: BaseContext): AudioBuffer {
  const sr = ctx.sampleRate || 44100;
  const len = Math.max(256, Math.round(sr * 0.042));
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);
  // Deterministic soft-seeded pseudo-random impulse so offline renders are reproducible
  let seed = 0x51a7f;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    const env = Math.pow(1 - i / len, 2.8);
    data[i] = white * env;
  }
  return buffer;
}

function createConcertHallImpulseBuffer(ctx: BaseContext): AudioBuffer {
  const sr = ctx.sampleRate || 44100;
  const durationSec = 1.65;
  const len = Math.max(1024, Math.round(sr * durationSec));
  const buffer = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let seed = ch === 0 ? 0x13579bdf : 0x2468ace0;
    let lpState = 0;
    const preDelaySamples = Math.round(sr * 0.014);

    for (let i = 0; i < len; i++) {
      if (i < preDelaySamples) {
        data[i] = 0;
        continue;
      }
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = (seed / 0xffffffff) * 2 - 1;
      const t = (i - preDelaySamples) / sr;
      // Early reflection taps around 18ms, 31ms, 47ms + smooth warm hall decay
      const decay = Math.exp(-t * 3.15);
      lpState = lpState * 0.72 + white * 0.28;
      let early = 0;
      if (i === preDelaySamples + Math.round(sr * 0.008)) early += 0.35;
      if (i === preDelaySamples + Math.round(sr * 0.022)) early += ch === 0 ? 0.24 : -0.22;
      if (i === preDelaySamples + Math.round(sr * 0.039)) early += ch === 0 ? -0.18 : 0.2;
      data[i] = (lpState * decay * 0.55 + early) * 0.36;
    }
  }
  return buffer;
}

interface ActiveVoiceHandle {
  stopAt: (when: number) => void;
}

/**
 * Physical-modeled Concert Grand Piano Synthesizer using Tone's cross-context Web Audio factory
 * so both live playback and Tone.Offline WAV rendering produce identical acoustic Grand Piano audio.
 */
export class GrandPianoEngine {
  private readonly ctx: BaseContext;
  private readonly dryBus: GainNode;
  private readonly wetBus: GainNode;
  private readonly convolver: ConvolverNode;
  private readonly bodyLowShelf: BiquadFilterNode;
  private readonly bodyWarmPeak: BiquadFilterNode;
  private readonly harshCutPeak: BiquadFilterNode;
  private readonly airRollOff: BiquadFilterNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly outputGain: GainNode;

  private readonly waves: Map<PianoRegisterProfile['band'], PeriodicWave> = new Map();
  private readonly hammerBuffer: AudioBuffer;
  private readonly activeVoices: ActiveVoiceHandle[] = [];
  private readonly maxPolyphony = 34;

  constructor(ctx: BaseContext, destinationNode: AudioNode) {
    this.ctx = ctx;

    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = 0.92;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -13;
    this.compressor.knee.value = 14;
    this.compressor.ratio.value = 3.2;
    this.compressor.attack.value = 0.004;
    this.compressor.release.value = 0.18;

    // Spruce soundboard EQ contour
    this.bodyLowShelf = ctx.createBiquadFilter();
    this.bodyLowShelf.type = 'lowshelf';
    this.bodyLowShelf.frequency.value = 155;
    this.bodyLowShelf.gain.value = 2.4;

    this.bodyWarmPeak = ctx.createBiquadFilter();
    this.bodyWarmPeak.type = 'peaking';
    this.bodyWarmPeak.frequency.value = 340;
    this.bodyWarmPeak.Q.value = 0.85;
    this.bodyWarmPeak.gain.value = 1.9;

    this.harshCutPeak = ctx.createBiquadFilter();
    this.harshCutPeak.type = 'peaking';
    this.harshCutPeak.frequency.value = 2350;
    this.harshCutPeak.Q.value = 1.2;
    this.harshCutPeak.gain.value = -2.4;

    this.airRollOff = ctx.createBiquadFilter();
    this.airRollOff.type = 'lowpass';
    this.airRollOff.frequency.value = 8800;
    this.airRollOff.Q.value = 0.55;

    this.dryBus = ctx.createGain();
    this.dryBus.gain.value = 0.88;

    this.wetBus = ctx.createGain();
    this.wetBus.gain.value = 0.24;

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = createConcertHallImpulseBuffer(ctx);

    this.dryBus.connect(this.bodyLowShelf);
    this.wetBus.connect(this.convolver);
    this.convolver.connect(this.bodyLowShelf);

    this.bodyLowShelf.connect(this.bodyWarmPeak);
    this.bodyWarmPeak.connect(this.harshCutPeak);
    this.harshCutPeak.connect(this.airRollOff);
    this.airRollOff.connect(this.compressor);
    this.compressor.connect(this.outputGain);
    this.outputGain.connect(destinationNode);

    this.hammerBuffer = createHammerNoiseBuffer(ctx);

    (Object.keys(PIANO_REGISTER_BANDS) as PianoRegisterProfile['band'][]).forEach((band) => {
      this.waves.set(
        band,
        buildPeriodicWaveForHarmonics(ctx, PIANO_REGISTER_BANDS[band].harmonics)
      );
    });
  }

  triggerNote(
    midi: number,
    durationSec: number,
    time: number,
    velocity = 0.78,
    sustainPedal = false
  ): void {
    const clampedMidi = Math.max(24, Math.min(108, Math.round(midi)));
    const vel = Math.max(0.1, Math.min(1, velocity));
    const freq = midiToFrequency(clampedMidi);
    const profile = getPianoRegisterProfile(clampedMidi);
    const wave = this.waves.get(profile.band);
    if (!wave) return;

    const startTime = Math.max(this.ctx.currentTime, time);
    const holdDur = Math.max(0.09, durationSec);
    const damperRelease = sustainPedal ? Math.min(2.1, profile.decaySec * 0.55) : 0.34;
    const stopTime = startTime + holdDur + damperRelease + 0.04;

    // Polyphony management (steal oldest voice gently if saturated)
    while (this.activeVoices.length >= this.maxPolyphony) {
      const oldest = this.activeVoices.shift();
      oldest?.stopAt(startTime + 0.02);
    }

    // Stereo panner & per-note dynamic lowpass filter
    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(computePianoStereoPan(clampedMidi), startTime);

    const noteFilter = this.ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.Q.value = 0.7;
    const fCurve = computePianoFilterCurve(freq, vel);
    noteFilter.frequency.setValueAtTime(fCurve.startHz, startTime);
    noteFilter.frequency.exponentialRampToValueAtTime(
      fCurve.settleHz,
      startTime + fCurve.decayTimeSec
    );
    noteFilter.frequency.exponentialRampToValueAtTime(
      fCurve.tailHz,
      startTime + Math.min(holdDur + damperRelease, profile.decaySec)
    );

    // Master note amplitude envelope: crisp hammer attack -> prompt drop -> natural decay (never flat organ sustain!)
    const noteGain = this.ctx.createGain();
    const peakGain = Math.pow(vel, 1.28) * (clampedMidi < 50 ? 0.34 : 0.28);
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.003);
    noteGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, peakGain * profile.promptDropRatio),
      startTime + profile.promptTimeSec
    );
    const endHoldGain = Math.max(
      0.002,
      peakGain * profile.promptDropRatio * Math.exp(-holdDur / profile.decaySec)
    );
    noteGain.gain.exponentialRampToValueAtTime(endHoldGain, startTime + holdDur);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + holdDur + damperRelease);

    // 3 Acoustic Strings per key: unison pair + stretched inharmonic overtone partial
    const osc1 = this.ctx.createOscillator();
    osc1.setPeriodicWave(wave);
    osc1.frequency.setValueAtTime(freq, startTime);
    osc1.detune.setValueAtTime(-1.5, startTime);

    const osc2 = this.ctx.createOscillator();
    osc2.setPeriodicWave(wave);
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(1.7, startTime);

    // Stretched 2nd-partial shimmer (real piano string stiffness creates slight sharp 2nd partial!)
    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(
      freq * 2 * Math.pow(2, profile.inharmonicityCents / 1200),
      startTime
    );
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, startTime);
    shimmerGain.gain.linearRampToValueAtTime(peakGain * (0.14 + vel * 0.14), startTime + 0.003);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.min(0.75, holdDur + 0.25));

    // Felt hammer strike thud/click transient
    const hammerSrc = this.ctx.createBufferSource();
    hammerSrc.buffer = this.hammerBuffer;
    const hammerBp = this.ctx.createBiquadFilter();
    hammerBp.type = 'bandpass';
    hammerBp.frequency.setValueAtTime(
      Math.max(380, Math.min(3600, freq * profile.hammerCutoffMul)),
      startTime
    );
    hammerBp.Q.value = 1.4;
    const hammerGain = this.ctx.createGain();
    hammerGain.gain.setValueAtTime(
      Math.pow(vel, 1.45) * profile.hammerGain,
      startTime
    );

    osc1.connect(noteFilter);
    osc2.connect(noteFilter);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(noteFilter);

    noteFilter.connect(noteGain);
    hammerSrc.connect(hammerBp);
    hammerBp.connect(hammerGain);
    hammerGain.connect(panner);

    noteGain.connect(panner);
    panner.connect(this.dryBus);
    panner.connect(this.wetBus);

    osc1.start(startTime);
    osc2.start(startTime);
    shimmerOsc.start(startTime);
    hammerSrc.start(startTime);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    shimmerOsc.stop(stopTime);
    hammerSrc.stop(startTime + 0.045);

    const handle: ActiveVoiceHandle = {
      stopAt: (when: number) => {
        try {
          noteGain.gain.cancelScheduledValues(when);
          noteGain.gain.setTargetAtTime(0.0001, when, 0.025);
          osc1.stop(when + 0.08);
          osc2.stop(when + 0.08);
          shimmerOsc.stop(when + 0.08);
        } catch {
          // Ignore already-stopped nodes
        }
      },
    };
    this.activeVoices.push(handle);

    osc1.onended = () => {
      const idx = this.activeVoices.indexOf(handle);
      if (idx >= 0) this.activeVoices.splice(idx, 1);
      try {
        osc1.disconnect();
        osc2.disconnect();
        shimmerOsc.disconnect();
        shimmerGain.disconnect();
        hammerSrc.disconnect();
        hammerBp.disconnect();
        hammerGain.disconnect();
        noteFilter.disconnect();
        noteGain.disconnect();
        panner.disconnect();
      } catch {
        // Ignore cleanup
      }
    };
  }

  dispose(): void {
    const now = this.ctx.currentTime;
    while (this.activeVoices.length > 0) {
      const v = this.activeVoices.pop();
      v?.stopAt(now);
    }
    try {
      this.dryBus.disconnect();
      this.wetBus.disconnect();
      this.convolver.disconnect();
      this.bodyLowShelf.disconnect();
      this.bodyWarmPeak.disconnect();
      this.harshCutPeak.disconnect();
      this.airRollOff.disconnect();
      this.compressor.disconnect();
      this.outputGain.disconnect();
    } catch {
      // Ignore cleanup
    }
  }
}
