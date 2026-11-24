import type { BaseContext } from 'tone';

export interface PianoRegisterProfile {
  band: 'bass-low' | 'bass-high' | 'tenor' | 'alto' | 'treble';
  harmonics: number[];
  coreHarmonics: number[];
  strikeHarmonics: number[];
  decaySec: number;
  strikeDecaySec: number;
  promptDropRatio: number;
  promptTimeSec: number;
  hammerGain: number;
  hammerCutoffMul: number;
  inharmonicityCents: number;
}

export interface PianoSampleSpec {
  key: string;
  midi: number;
  url: string;
}

export interface NearestPianoSampleMatch {
  sample: PianoSampleSpec;
  playbackRate: number;
  semitoneOffset: number;
}

/**
 * Self-hosted Yamaha C5 Salamander Concert Grand Piano studio multi-samples (A0..C8 every minor third).
 */
export const PIANO_SAMPLE_MANIFEST: ReadonlyArray<PianoSampleSpec> = [
  { key: 'A0', midi: 21, url: '/audio/piano/A0.mp3' },
  { key: 'C1', midi: 24, url: '/audio/piano/C1.mp3' },
  { key: 'Ds1', midi: 27, url: '/audio/piano/Ds1.mp3' },
  { key: 'Fs1', midi: 30, url: '/audio/piano/Fs1.mp3' },
  { key: 'A1', midi: 33, url: '/audio/piano/A1.mp3' },
  { key: 'C2', midi: 36, url: '/audio/piano/C2.mp3' },
  { key: 'Ds2', midi: 39, url: '/audio/piano/Ds2.mp3' },
  { key: 'Fs2', midi: 42, url: '/audio/piano/Fs2.mp3' },
  { key: 'A2', midi: 45, url: '/audio/piano/A2.mp3' },
  { key: 'C3', midi: 48, url: '/audio/piano/C3.mp3' },
  { key: 'Ds3', midi: 51, url: '/audio/piano/Ds3.mp3' },
  { key: 'Fs3', midi: 54, url: '/audio/piano/Fs3.mp3' },
  { key: 'A3', midi: 57, url: '/audio/piano/A3.mp3' },
  { key: 'C4', midi: 60, url: '/audio/piano/C4.mp3' },
  { key: 'Ds4', midi: 63, url: '/audio/piano/Ds4.mp3' },
  { key: 'Fs4', midi: 66, url: '/audio/piano/Fs4.mp3' },
  { key: 'A4', midi: 69, url: '/audio/piano/A4.mp3' },
  { key: 'C5', midi: 72, url: '/audio/piano/C5.mp3' },
  { key: 'Ds5', midi: 75, url: '/audio/piano/Ds5.mp3' },
  { key: 'Fs5', midi: 78, url: '/audio/piano/Fs5.mp3' },
  { key: 'A5', midi: 81, url: '/audio/piano/A5.mp3' },
  { key: 'C6', midi: 84, url: '/audio/piano/C6.mp3' },
  { key: 'Ds6', midi: 87, url: '/audio/piano/Ds6.mp3' },
  { key: 'Fs6', midi: 90, url: '/audio/piano/Fs6.mp3' },
  { key: 'A6', midi: 93, url: '/audio/piano/A6.mp3' },
  { key: 'C7', midi: 96, url: '/audio/piano/C7.mp3' },
  { key: 'Ds7', midi: 99, url: '/audio/piano/Ds7.mp3' },
  { key: 'Fs7', midi: 102, url: '/audio/piano/Fs7.mp3' },
  { key: 'A7', midi: 105, url: '/audio/piano/A7.mp3' },
  { key: 'C8', midi: 108, url: '/audio/piano/C8.mp3' },
];

const PIANO_REGISTER_BANDS: Record<
  PianoRegisterProfile['band'],
  Omit<PianoRegisterProfile, 'band'>
> = {
  'bass-low': {
    harmonics: [0.58, 1.0, 0.82, 0.58, 0.4, 0.27, 0.17, 0.11, 0.065, 0.036, 0.02],
    coreHarmonics: [0.64, 0.0, 0.52, 0.16, 0.05],
    strikeHarmonics: [0.0, 0.42, 0.65, 0.56, 0.4, 0.27, 0.17, 0.1, 0.055, 0.028],
    decaySec: 5.2,
    strikeDecaySec: 0.42,
    promptDropRatio: 0.69,
    promptTimeSec: 0.28,
    hammerGain: 0.11,
    hammerCutoffMul: 2.5,
    inharmonicityCents: 3.4,
  },
  'bass-high': {
    harmonics: [0.78, 1.0, 0.7, 0.46, 0.29, 0.17, 0.1, 0.058, 0.032, 0.016],
    coreHarmonics: [0.92, 0.0, 0.34, 0.09],
    strikeHarmonics: [0.0, 0.4, 0.55, 0.42, 0.28, 0.17, 0.1, 0.055, 0.028],
    decaySec: 4.2,
    strikeDecaySec: 0.32,
    promptDropRatio: 0.64,
    promptTimeSec: 0.24,
    hammerGain: 0.095,
    hammerCutoffMul: 2.3,
    inharmonicityCents: 2.6,
  },
  tenor: {
    harmonics: [1.0, 0.64, 0.36, 0.2, 0.105, 0.055, 0.028, 0.014],
    coreHarmonics: [1.0, 0.0, 0.16, 0.04],
    strikeHarmonics: [0.0, 0.44, 0.36, 0.22, 0.13, 0.072, 0.036, 0.016],
    decaySec: 3.2,
    strikeDecaySec: 0.24,
    promptDropRatio: 0.58,
    promptTimeSec: 0.2,
    hammerGain: 0.08,
    hammerCutoffMul: 2.0,
    inharmonicityCents: 2.0,
  },
  alto: {
    harmonics: [1.0, 0.48, 0.22, 0.095, 0.042, 0.018, 0.008],
    coreHarmonics: [1.0, 0.0, 0.08, 0.02],
    strikeHarmonics: [0.0, 0.36, 0.24, 0.13, 0.065, 0.03, 0.012],
    decaySec: 2.4,
    strikeDecaySec: 0.17,
    promptDropRatio: 0.53,
    promptTimeSec: 0.17,
    hammerGain: 0.07,
    hammerCutoffMul: 1.85,
    inharmonicityCents: 1.7,
  },
  treble: {
    harmonics: [1.0, 0.3, 0.11, 0.038, 0.014],
    coreHarmonics: [1.0, 0.0, 0.04],
    strikeHarmonics: [0.0, 0.26, 0.13, 0.055, 0.02],
    decaySec: 1.65,
    strikeDecaySec: 0.12,
    promptDropRatio: 0.49,
    promptTimeSec: 0.14,
    hammerGain: 0.06,
    hammerCutoffMul: 1.65,
    inharmonicityCents: 1.4,
  },
};

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Picks the nearest studio-recorded Yamaha C5 sample (max ±2 semitones shift across 88 keys).
 */
export function findNearestPianoSample(midi: number): NearestPianoSampleMatch {
  const clampedMidi = Math.max(21, Math.min(108, Math.round(midi)));
  let best = PIANO_SAMPLE_MANIFEST[0];
  let bestDiff = Math.abs(clampedMidi - best.midi);

  for (let i = 1; i < PIANO_SAMPLE_MANIFEST.length; i++) {
    const candidate = PIANO_SAMPLE_MANIFEST[i];
    const diff = Math.abs(clampedMidi - candidate.midi);
    if (diff < bestDiff) {
      best = candidate;
      bestDiff = diff;
    }
  }

  const semitoneOffset = clampedMidi - best.midi;
  return {
    sample: best,
    semitoneOffset,
    playbackRate: Math.pow(2, semitoneOffset / 12),
  };
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
  const brightMul = 2.4 + Math.pow(vel, 1.45) * 5.2;
  const startHz = Math.max(580, Math.min(9200, freqHz * brightMul));
  const settleHz = Math.max(290, Math.min(4600, freqHz * (1.35 + vel * 0.85)));
  const tailHz = Math.max(210, Math.min(2400, freqHz * 1.18));
  const decayTimeSec = 0.14 + (1 - Math.min(1, freqHz / 1200)) * 0.16;
  return { startHz, settleHz, tailHz, decayTimeSec };
}

/**
 * Velocity-to-timbre curve specifically tuned for real acoustic grand samples:
 * preserves shimmering forte air (up to 16.5kHz) while gently cushioning pianissimo wool-felt warmth.
 */
export function computeSampledTimbreCurve(
  freqHz: number,
  velocity: number,
  isLead: boolean
): { attackCutoffHz: number; sustainCutoffHz: number; glideSec: number } {
  const vel = Math.max(0.08, Math.min(1, isLead ? Math.min(1, velocity * 1.06) : velocity));
  const feltOpenness = Math.pow(vel, 1.35);
  const attackCutoffHz = Math.max(
    1450,
    Math.min(17600, 1200 + freqHz * (2.6 + feltOpenness * 14.5) + feltOpenness * 9200)
  );
  const sustainCutoffHz = Math.max(
    780,
    Math.min(13800, 620 + freqHz * (1.8 + feltOpenness * 8.5) + feltOpenness * 4800)
  );
  const glideSec = 0.22 + (1 - vel) * 0.14;
  return { attackCutoffHz, sustainCutoffHz, glideSec };
}

// Module-level shared raw & decoded caches across live AudioContext + OfflineAudioContext WAV renders
const rawSampleBytesCache = new Map<string, ArrayBuffer>();
const decodedSampleCache = new Map<string, AudioBuffer>();
let rawFetchPromise: Promise<void> | null = null;
let decodePromise: Promise<void> | null = null;

/**
 * Starts downloading the 30 self-hosted Salamander Grand Piano MP3 files into memory cleanly
 * before user audio gesture is even triggered.
 */
export function preloadPianoSampleBytes(): Promise<void> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve();
  }
  if (rawSampleBytesCache.size >= PIANO_SAMPLE_MANIFEST.length) {
    return Promise.resolve();
  }
  if (rawFetchPromise) return rawFetchPromise;

  rawFetchPromise = (async () => {
    await Promise.all(
      PIANO_SAMPLE_MANIFEST.map(async (spec) => {
        if (rawSampleBytesCache.has(spec.key)) return;
        try {
          const res = await fetch(spec.url);
          if (!res.ok) return;
          const bytes = await res.arrayBuffer();
          if (bytes.byteLength > 256) {
            rawSampleBytesCache.set(spec.key, bytes);
          }
        } catch {
          // Graceful fallback if single fetch fails
        }
      })
    );
  })().finally(() => {
    rawFetchPromise = null;
  });

  return rawFetchPromise;
}

/**
 * Ensures all studio piano MP3 recordings are decoded into Web Audio AudioBuffers.
 */
export async function ensurePianoSamplesDecoded(ctx: BaseContext): Promise<number> {
  if (decodedSampleCache.size >= PIANO_SAMPLE_MANIFEST.length) {
    return decodedSampleCache.size;
  }
  if (decodePromise) {
    await decodePromise;
    return decodedSampleCache.size;
  }

  decodePromise = (async () => {
    await preloadPianoSampleBytes();
    const rawCtx =
      (ctx as unknown as { rawContext?: BaseAudioContext }).rawContext ??
      (ctx as unknown as BaseAudioContext);
    if (!rawCtx || typeof rawCtx.decodeAudioData !== 'function') return;

    await Promise.all(
      PIANO_SAMPLE_MANIFEST.map(async (spec) => {
        if (decodedSampleCache.has(spec.key)) return;
        const bytes = rawSampleBytesCache.get(spec.key);
        if (!bytes) return;
        try {
          const cloned = bytes.slice(0);
          const audioBuffer = await rawCtx.decodeAudioData(cloned);
          decodedSampleCache.set(spec.key, audioBuffer);
        } catch {
          // Ignore individual decode error cleanly
        }
      })
    );
  })().finally(() => {
    decodePromise = null;
  });

  await decodePromise;
  return decodedSampleCache.size;
}

export function getDecodedPianoSampleCount(): number {
  return decodedSampleCache.size;
}

export function getDecodedPianoSampleSnapshot(): Map<string, AudioBuffer> {
  return new Map(decodedSampleCache);
}

function buildPeriodicWaveForHarmonics(
  ctx: BaseContext,
  harmonics: number[]
): PeriodicWave {
  const len = harmonics.length + 1;
  const real = new Float32Array(len);
  const imag = new Float32Array(len);
  harmonics.forEach((amp, idx) => {
    const partialNum = idx + 1;
    const phase = (partialNum * 1.04719755) % (Math.PI * 2);
    real[partialNum] = amp * Math.sin(phase) * 0.16;
    imag[partialNum] = amp * Math.cos(phase);
  });
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

function createSoftFeltImpulseBuffer(ctx: BaseContext): AudioBuffer {
  const sr = ctx.sampleRate || 44100;
  const len = Math.max(128, Math.round(sr * 0.014));
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);
  let seed = 0x51a7f;
  let lp = 0;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const white = (seed / 0xffffffff) * 2 - 1;
    lp = lp * 0.92 + white * 0.08;
    const win = Math.sin((i / len) * Math.PI);
    data[i] = lp * win * 0.45;
  }
  return buffer;
}

/**
 * Generates a subtle, warm wooden concert hall studio impulse response
 * tuned to complement the natural room ambience already inside Salamander recordings.
 */
function createConcertHallImpulseBuffer(ctx: BaseContext): AudioBuffer {
  const sr = ctx.sampleRate || 44100;
  const durationSec = 1.55;
  const len = Math.max(1024, Math.round(sr * durationSec));
  const buffer = ctx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let seed = ch === 0 ? 0x13579bdf : 0x2468ace0;
    let lp1 = 0;
    let lp2 = 0;
    const preDelaySamples = Math.round(sr * 0.015);

    for (let i = 0; i < len; i++) {
      if (i < preDelaySamples) {
        data[i] = 0;
        continue;
      }
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = (seed / 0xffffffff) * 2 - 1;
      const t = (i - preDelaySamples) / sr;
      const lpCoeff = Math.min(0.94, 0.78 + t * 0.12);
      lp1 = lp1 * lpCoeff + white * (1 - lpCoeff);
      lp2 = lp2 * 0.72 + lp1 * 0.28;

      const earlyBloom =
        0.18 * Math.exp(-Math.pow((t - 0.022) / 0.014, 2)) +
        0.11 * Math.exp(-Math.pow((t - 0.044) / 0.018, 2));
      const tailDecay = Math.exp(-t * 3.1);
      const fadeOut = i > len - 512 ? (len - i) / 512 : 1;
      data[i] = lp2 * (tailDecay * 0.4 + earlyBloom) * 0.3 * fadeOut;
    }
  }
  return buffer;
}

interface ActiveVoiceHandle {
  isLead: boolean;
  stopAt: (when: number) => void;
}

/**
 * Authentic Concert Grand Piano Engine backed by 30 real Yamaha C5 Salamander studio recordings,
 * velocity-coupled dynamic hammer-felt filtering, realistic damper release & stereo imaging,
 * plus seamless acoustic physical-modeled synthesis fallback before buffer decode completes.
 */
export class GrandPianoEngine {
  private readonly ctx: BaseContext;
  private readonly dryBus: GainNode;
  private readonly wetBus: GainNode;
  private readonly convolver: ConvolverNode;
  private readonly bodyLowShelf: BiquadFilterNode;
  private readonly airShelf: BiquadFilterNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly outputGain: GainNode;

  private readonly sampleBuffers: Map<string, AudioBuffer>;
  private readonly coreWaves: Map<PianoRegisterProfile['band'], PeriodicWave> = new Map();
  private readonly strikeWaves: Map<PianoRegisterProfile['band'], PeriodicWave> = new Map();
  private readonly feltBrushBuffer: AudioBuffer;
  private readonly activeVoices: ActiveVoiceHandle[] = [];
  private readonly maxPolyphony = 80;

  constructor(
    ctx: BaseContext,
    destinationNode: AudioNode,
    predecodedBuffers?: Map<string, AudioBuffer>
  ) {
    this.ctx = ctx;
    this.sampleBuffers = predecodedBuffers
      ? new Map(predecodedBuffers)
      : getDecodedPianoSampleSnapshot();

    this.outputGain = ctx.createGain();
    this.outputGain.gain.value = 0.98;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -11;
    this.compressor.knee.value = 16;
    this.compressor.ratio.value = 1.85;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.24;

    // Gentle studio mastering polish (transparent for real recorded Yamaha C5 samples)
    this.bodyLowShelf = ctx.createBiquadFilter();
    this.bodyLowShelf.type = 'lowshelf';
    this.bodyLowShelf.frequency.value = 115;
    this.bodyLowShelf.gain.value = 1.4;

    this.airShelf = ctx.createBiquadFilter();
    this.airShelf.type = 'lowpass';
    this.airShelf.frequency.value = 16000;
    this.airShelf.Q.value = 0.5;

    this.dryBus = ctx.createGain();
    this.dryBus.gain.value = 0.95;

    this.wetBus = ctx.createGain();
    this.wetBus.gain.value = 0.17;

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = createConcertHallImpulseBuffer(ctx);

    this.dryBus.connect(this.bodyLowShelf);
    this.wetBus.connect(this.convolver);
    this.convolver.connect(this.bodyLowShelf);

    this.bodyLowShelf.connect(this.airShelf);
    this.airShelf.connect(this.compressor);
    this.compressor.connect(this.outputGain);
    this.outputGain.connect(destinationNode);

    this.feltBrushBuffer = createSoftFeltImpulseBuffer(ctx);

    (Object.keys(PIANO_REGISTER_BANDS) as PianoRegisterProfile['band'][]).forEach((band) => {
      const cfg = PIANO_REGISTER_BANDS[band];
      this.coreWaves.set(band, buildPeriodicWaveForHarmonics(ctx, cfg.coreHarmonics));
      this.strikeWaves.set(band, buildPeriodicWaveForHarmonics(ctx, cfg.strikeHarmonics));
    });

    // Kick off non-blocking background warm-up if cache is empty in live context
    if (this.sampleBuffers.size < PIANO_SAMPLE_MANIFEST.length) {
      void ensurePianoSamplesDecoded(ctx).then(() => {
        decodedSampleCache.forEach((buf, k) => {
          this.sampleBuffers.set(k, buf);
        });
      });
    }
  }

  hasDecodedSamples(): boolean {
    if (this.sampleBuffers.size > 0) return true;
    if (decodedSampleCache.size > 0) {
      decodedSampleCache.forEach((buf, k) => this.sampleBuffers.set(k, buf));
      return true;
    }
    return false;
  }

  async ensureLoaded(): Promise<number> {
    const count = await ensurePianoSamplesDecoded(this.ctx);
    decodedSampleCache.forEach((buf, k) => {
      this.sampleBuffers.set(k, buf);
    });
    return count;
  }

  private getSampleBufferForKey(key: string): AudioBuffer | undefined {
    const local = this.sampleBuffers.get(key);
    if (local) return local;
    const shared = decodedSampleCache.get(key);
    if (shared) {
      this.sampleBuffers.set(key, shared);
      return shared;
    }
    return undefined;
  }

  triggerNote(
    midi: number,
    durationSec: number,
    time: number,
    velocity = 0.78,
    sustainPedal = false,
    isLead = false
  ): void {
    const clampedMidi = Math.max(21, Math.min(108, Math.round(midi)));
    const vel = Math.max(0.08, Math.min(1, velocity));
    const startTime = Math.max(this.ctx.currentTime, time);

    // Voice stealing for ultra-clean dense sustain pedal passages
    while (this.activeVoices.length >= this.maxPolyphony) {
      const nonLeadIdx = this.activeVoices.findIndex((v) => !v.isLead);
      const stealIdx = nonLeadIdx >= 0 ? nonLeadIdx : 0;
      const [stolen] = this.activeVoices.splice(stealIdx, 1);
      stolen?.stopAt(startTime + 0.015);
    }

    const match = findNearestPianoSample(clampedMidi);
    const sampleBuf = this.getSampleBufferForKey(match.sample.key);

    if (sampleBuf) {
      this.triggerSampledGrandVoice(
        clampedMidi,
        durationSec,
        startTime,
        vel,
        sustainPedal,
        isLead,
        sampleBuf,
        match.playbackRate
      );
      return;
    }

    this.triggerSynthesizedFallbackVoice(
      clampedMidi,
      durationSec,
      startTime,
      vel,
      sustainPedal,
      isLead
    );
  }

  private triggerSampledGrandVoice(
    clampedMidi: number,
    durationSec: number,
    startTime: number,
    vel: number,
    sustainPedal: boolean,
    isLead: boolean,
    sampleBuf: AudioBuffer,
    playbackRate: number
  ): void {
    const freq = midiToFrequency(clampedMidi);
    const profile = getPianoRegisterProfile(clampedMidi);
    const holdDur = Math.max(0.08, durationSec);

    // Preserve real studio sample attack transient on forte hits; gently feather pianissimo touches
    const attackSec = vel >= 0.72 ? 0.0012 : 0.0018 + (1 - vel) * 0.0038;
    const peakGain = Math.pow(vel, 1.18) * (isLead ? 0.74 : 0.58);

    const sampleDurationSec = sampleBuf.duration / Math.max(0.25, playbackRate);
    const damperTau = sustainPedal
      ? Math.min(1.45, Math.max(0.45, profile.decaySec * 0.34))
      : Math.max(0.068, Math.min(0.155, 0.145 - (clampedMidi - 36) * 0.0013));
    const releaseStart = startTime + holdDur;
    const naturalStop = Math.min(
      startTime + sampleDurationSec,
      releaseStart + damperTau * 5.2 + 0.04
    );

    const src = this.ctx.createBufferSource();
    src.buffer = sampleBuf;
    src.playbackRate.setValueAtTime(playbackRate, startTime);

    // Velocity-to-timbre dynamic wool-felt filter
    const timbreFilter = this.ctx.createBiquadFilter();
    timbreFilter.type = 'lowpass';
    timbreFilter.Q.value = 0.52;
    const tCurve = computeSampledTimbreCurve(freq, vel, isLead);
    timbreFilter.frequency.setValueAtTime(tCurve.attackCutoffHz, startTime);
    timbreFilter.frequency.exponentialRampToValueAtTime(
      tCurve.sustainCutoffHz,
      startTime + tCurve.glideSec
    );

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + attackSec);
    noteGain.gain.setValueAtTime(peakGain, releaseStart);
    noteGain.gain.setTargetAtTime(0.0001, releaseStart, damperTau);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(computePianoStereoPan(clampedMidi) * 0.65, startTime);

    src.connect(timbreFilter);
    timbreFilter.connect(noteGain);
    noteGain.connect(panner);
    panner.connect(this.dryBus);
    panner.connect(this.wetBus);

    // Subtle mechanical felt damper thump when releasing dry non-sustained loud key
    let damperFeltSrc: AudioBufferSourceNode | null = null;
    let damperLp: BiquadFilterNode | null = null;
    let damperGain: GainNode | null = null;
    if (!sustainPedal && vel >= 0.46 && holdDur >= 0.12 && releaseStart < naturalStop - 0.05) {
      damperFeltSrc = this.ctx.createBufferSource();
      damperFeltSrc.buffer = this.feltBrushBuffer;
      damperLp = this.ctx.createBiquadFilter();
      damperLp.type = 'lowpass';
      damperLp.frequency.setValueAtTime(240, releaseStart);
      damperGain = this.ctx.createGain();
      damperGain.gain.setValueAtTime(Math.pow(vel, 1.5) * 0.022, releaseStart);
      damperFeltSrc.connect(damperLp);
      damperLp.connect(damperGain);
      damperGain.connect(panner);
      damperFeltSrc.start(releaseStart);
      damperFeltSrc.stop(releaseStart + 0.016);
    }

    src.start(startTime);
    src.stop(naturalStop);

    const handle: ActiveVoiceHandle = {
      isLead,
      stopAt: (when: number) => {
        try {
          noteGain.gain.cancelScheduledValues(when);
          noteGain.gain.setTargetAtTime(0.0001, when, 0.022);
          src.stop(when + 0.09);
        } catch {
          // Ignore already-stopped nodes
        }
      },
    };
    this.activeVoices.push(handle);

    src.onended = () => {
      const idx = this.activeVoices.indexOf(handle);
      if (idx >= 0) this.activeVoices.splice(idx, 1);
      try {
        src.disconnect();
        timbreFilter.disconnect();
        noteGain.disconnect();
        panner.disconnect();
        damperFeltSrc?.disconnect();
        damperLp?.disconnect();
        damperGain?.disconnect();
      } catch {
        // Ignore cleanup
      }
    };
  }

  private triggerSynthesizedFallbackVoice(
    clampedMidi: number,
    durationSec: number,
    startTime: number,
    vel: number,
    sustainPedal: boolean,
    isLead: boolean
  ): void {
    const freq = midiToFrequency(clampedMidi);
    const profile = getPianoRegisterProfile(clampedMidi);
    const coreWave = this.coreWaves.get(profile.band);
    const strikeWave = this.strikeWaves.get(profile.band);
    if (!coreWave || !strikeWave) return;

    const holdDur = Math.max(0.1, durationSec);
    const damperRelease = sustainPedal
      ? Math.min(isLead ? 2.25 : 2.55, profile.decaySec * 0.65)
      : isLead
      ? 0.36
      : 0.28;
    const stopTime = startTime + holdDur + damperRelease + 0.05;

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(computePianoStereoPan(clampedMidi), startTime);

    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.Q.value = 0.62;
    const fCurve = computePianoFilterCurve(freq, isLead ? Math.min(1, vel * 1.04) : vel);
    bodyFilter.frequency.setValueAtTime(
      Math.max(240, Math.min(fCurve.startHz, freq * 4.4)),
      startTime
    );
    bodyFilter.frequency.exponentialRampToValueAtTime(
      fCurve.settleHz,
      startTime + fCurve.decayTimeSec
    );
    bodyFilter.frequency.exponentialRampToValueAtTime(
      fCurve.tailHz,
      startTime + Math.min(holdDur + damperRelease, profile.decaySec)
    );

    const attackSec = 0.0025 + (1 - vel) * 0.0032;
    const registerBoost = clampedMidi < 46 ? 0.36 : clampedMidi < 56 ? 0.33 : isLead ? 0.36 : 0.28;
    const peakGain = Math.pow(vel, 1.32) * registerBoost;

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(peakGain, startTime + attackSec);
    noteGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, peakGain * profile.promptDropRatio),
      startTime + profile.promptTimeSec
    );
    const endHoldGain = Math.max(
      0.0018,
      peakGain * profile.promptDropRatio * Math.exp(-holdDur / profile.decaySec)
    );
    noteGain.gain.exponentialRampToValueAtTime(endHoldGain, startTime + holdDur);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + holdDur + damperRelease);

    const snapCents = vel * 6.5;
    const osc1 = this.ctx.createOscillator();
    osc1.setPeriodicWave(coreWave);
    osc1.frequency.setValueAtTime(freq, startTime);
    osc1.detune.setValueAtTime(-0.8 + snapCents, startTime);
    osc1.detune.linearRampToValueAtTime(-0.8, startTime + 0.022);

    const osc2 = this.ctx.createOscillator();
    osc2.setPeriodicWave(coreWave);
    osc2.frequency.setValueAtTime(freq, startTime);
    osc2.detune.setValueAtTime(0.9 + snapCents, startTime);
    osc2.detune.linearRampToValueAtTime(0.9, startTime + 0.022);

    const strikeOsc = this.ctx.createOscillator();
    strikeOsc.setPeriodicWave(strikeWave);
    strikeOsc.frequency.setValueAtTime(freq, startTime);
    strikeOsc.detune.setValueAtTime(0.3 + snapCents * 1.1, startTime);
    strikeOsc.detune.linearRampToValueAtTime(0.3, startTime + 0.024);

    const strikeFilter = this.ctx.createBiquadFilter();
    strikeFilter.type = 'lowpass';
    strikeFilter.Q.value = 0.72;
    strikeFilter.frequency.setValueAtTime(fCurve.startHz, startTime);
    strikeFilter.frequency.exponentialRampToValueAtTime(
      Math.max(320, freq * 1.7),
      startTime + profile.strikeDecaySec
    );

    const strikeGain = this.ctx.createGain();
    const strikePeak = peakGain * (0.24 + Math.pow(vel, 1.55) * 0.44);
    strikeGain.gain.setValueAtTime(0.0001, startTime);
    strikeGain.gain.linearRampToValueAtTime(strikePeak, startTime + attackSec * 0.85);
    strikeGain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + Math.min(holdDur + 0.14, profile.strikeDecaySec * (0.85 + vel * 0.45))
    );

    const stretchedP2 = freq * 2 * Math.pow(2, profile.inharmonicityCents / 1200);
    const p2Osc = this.ctx.createOscillator();
    p2Osc.type = 'sine';
    p2Osc.frequency.setValueAtTime(stretchedP2, startTime);

    const p2AmpRatio = profile.band === 'bass-low' ? 0.42 : profile.band === 'bass-high' ? 0.34 : 0.24;
    const p2Gain = this.ctx.createGain();
    p2Gain.gain.setValueAtTime(0.0001, startTime);
    p2Gain.gain.linearRampToValueAtTime(
      peakGain * (p2AmpRatio + vel * 0.12),
      startTime + attackSec
    );
    p2Gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + Math.min(holdDur + damperRelease * 0.78, profile.decaySec * 0.65)
    );

    osc1.connect(bodyFilter);
    osc2.connect(bodyFilter);
    bodyFilter.connect(noteGain);

    strikeOsc.connect(strikeFilter);
    strikeFilter.connect(strikeGain);
    strikeGain.connect(panner);

    p2Osc.connect(p2Gain);
    p2Gain.connect(panner);

    noteGain.connect(panner);
    panner.connect(this.dryBus);
    panner.connect(this.wetBus);

    osc1.start(startTime);
    osc2.start(startTime);
    strikeOsc.start(startTime);
    p2Osc.start(startTime);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    strikeOsc.stop(startTime + profile.strikeDecaySec * 1.4 + 0.05);
    p2Osc.stop(stopTime);

    const handle: ActiveVoiceHandle = {
      isLead,
      stopAt: (when: number) => {
        try {
          noteGain.gain.cancelScheduledValues(when);
          noteGain.gain.setTargetAtTime(0.0001, when, 0.025);
          strikeGain.gain.cancelScheduledValues(when);
          strikeGain.gain.setTargetAtTime(0.0001, when, 0.015);
          p2Gain.gain.cancelScheduledValues(when);
          p2Gain.gain.setTargetAtTime(0.0001, when, 0.02);
          osc1.stop(when + 0.08);
          osc2.stop(when + 0.08);
          strikeOsc.stop(when + 0.06);
          p2Osc.stop(when + 0.08);
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
        strikeOsc.disconnect();
        strikeFilter.disconnect();
        strikeGain.disconnect();
        p2Osc.disconnect();
        p2Gain.disconnect();
        bodyFilter.disconnect();
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
      this.airShelf.disconnect();
      this.compressor.disconnect();
      this.outputGain.disconnect();
    } catch {
      // Ignore cleanup
    }
  }
}
