import type { BaseContext } from 'tone';
import { midiToFrequency } from './grandPianoEngine.ts';

export type GuitarArticulation = 'backing' | 'melody';

export interface GuitarSampleSpec {
  key: string;
  midi: number;
  url: string;
}

export interface NearestGuitarSampleMatch {
  sample: GuitarSampleSpec;
  playbackRate: number;
  semitoneOffset: number;
}

export interface GuitarStringSynthOptions {
  brightness?: number;
  lossFactor?: number;
  pickPosition?: number;
  warmthMix?: number;
  seed?: number;
}

/**
 * Self-hosted chromatic studio-recorded Acoustic Guitar multi-samples (D2..D5, every semitone).
 * Zero semitone pitch-stretching across the standard 6-string guitar range (38..74).
 */
export const GUITAR_SAMPLE_MANIFEST: ReadonlyArray<GuitarSampleSpec> = [
  { key: 'D2', midi: 38, url: '/audio/guitar/D2.mp3' },
  { key: 'Ds2', midi: 39, url: '/audio/guitar/Ds2.mp3' },
  { key: 'E2', midi: 40, url: '/audio/guitar/E2.mp3' },
  { key: 'F2', midi: 41, url: '/audio/guitar/F2.mp3' },
  { key: 'Fs2', midi: 42, url: '/audio/guitar/Fs2.mp3' },
  { key: 'G2', midi: 43, url: '/audio/guitar/G2.mp3' },
  { key: 'Gs2', midi: 44, url: '/audio/guitar/Gs2.mp3' },
  { key: 'A2', midi: 45, url: '/audio/guitar/A2.mp3' },
  { key: 'As2', midi: 46, url: '/audio/guitar/As2.mp3' },
  { key: 'B2', midi: 47, url: '/audio/guitar/B2.mp3' },
  { key: 'C3', midi: 48, url: '/audio/guitar/C3.mp3' },
  { key: 'Cs3', midi: 49, url: '/audio/guitar/Cs3.mp3' },
  { key: 'D3', midi: 50, url: '/audio/guitar/D3.mp3' },
  { key: 'Ds3', midi: 51, url: '/audio/guitar/Ds3.mp3' },
  { key: 'E3', midi: 52, url: '/audio/guitar/E3.mp3' },
  { key: 'F3', midi: 53, url: '/audio/guitar/F3.mp3' },
  { key: 'Fs3', midi: 54, url: '/audio/guitar/Fs3.mp3' },
  { key: 'G3', midi: 55, url: '/audio/guitar/G3.mp3' },
  { key: 'Gs3', midi: 56, url: '/audio/guitar/Gs3.mp3' },
  { key: 'A3', midi: 57, url: '/audio/guitar/A3.mp3' },
  { key: 'As3', midi: 58, url: '/audio/guitar/As3.mp3' },
  { key: 'B3', midi: 59, url: '/audio/guitar/B3.mp3' },
  { key: 'C4', midi: 60, url: '/audio/guitar/C4.mp3' },
  { key: 'Cs4', midi: 61, url: '/audio/guitar/Cs4.mp3' },
  { key: 'D4', midi: 62, url: '/audio/guitar/D4.mp3' },
  { key: 'Ds4', midi: 63, url: '/audio/guitar/Ds4.mp3' },
  { key: 'E4', midi: 64, url: '/audio/guitar/E4.mp3' },
  { key: 'F4', midi: 65, url: '/audio/guitar/F4.mp3' },
  { key: 'Fs4', midi: 66, url: '/audio/guitar/Fs4.mp3' },
  { key: 'G4', midi: 67, url: '/audio/guitar/G4.mp3' },
  { key: 'Gs4', midi: 68, url: '/audio/guitar/Gs4.mp3' },
  { key: 'A4', midi: 69, url: '/audio/guitar/A4.mp3' },
  { key: 'As4', midi: 70, url: '/audio/guitar/As4.mp3' },
  { key: 'B4', midi: 71, url: '/audio/guitar/B4.mp3' },
  { key: 'C5', midi: 72, url: '/audio/guitar/C5.mp3' },
  { key: 'Cs5', midi: 73, url: '/audio/guitar/Cs5.mp3' },
  { key: 'D5', midi: 74, url: '/audio/guitar/D5.mp3' },
];

/**
 * Picks the nearest studio-recorded Acoustic Guitar sample (exact 1:1 chromatic match D2..D5).
 */
export function findNearestGuitarSample(midi: number): NearestGuitarSampleMatch {
  const clampedMidi = Math.max(36, Math.min(84, Math.round(midi)));
  let best = GUITAR_SAMPLE_MANIFEST[0];
  let bestDiff = Math.abs(clampedMidi - best.midi);

  for (let i = 1; i < GUITAR_SAMPLE_MANIFEST.length; i++) {
    const candidate = GUITAR_SAMPLE_MANIFEST[i];
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

/**
 * Velocity-to-timbre curve tailored for studio Acoustic Guitar recordings:
 * warm nylon/fingerstyle bloom on soft plucks, bright bronze string air on strums & leads.
 */
export function computeGuitarSampledTimbreCurve(
  freqHz: number,
  velocity: number,
  articulation: GuitarArticulation
): { attackCutoffHz: number; sustainCutoffHz: number; glideSec: number } {
  const isMelody = articulation === 'melody';
  const vel = Math.max(
    0.08,
    Math.min(1, isMelody ? Math.min(1, velocity * 1.08) : velocity)
  );
  const pickAir = Math.pow(vel, 1.15);
  const attackCutoffHz = Math.max(
    2600,
    Math.min(16800, 2400 + freqHz * (3.2 + pickAir * 11.5) + pickAir * 7800)
  );
  const sustainCutoffHz = Math.max(
    1450,
    Math.min(13200, 1250 + freqHz * (2.2 + pickAir * 7.2) + pickAir * 4200)
  );
  const glideSec = 0.24 + (1 - vel) * 0.14;
  return { attackCutoffHz, sustainCutoffHz, glideSec };
}

/**
 * Shapes guitar chord voicings into an authentic open 6-string layout:
 * solid low bass string (E2..D3), warm mid strings (G3..B3), and clear top strings (C4..E5),
 * removing tight piano-cluster semitone clashes on adjacent lower strings.
 */
export function buildGuitarChordVoicing(
  bassMidis: number[],
  rightMidis: number[],
  fallbackRootMidi = 48
): number[] {
  let bass = bassMidis[0] ?? fallbackRootMidi;
  while (bass > 52) bass -= 12;
  while (bass < 38) bass += 12;

  const picked: number[] = [bass];
  const seenPitchClasses = new Set<number>([((bass % 12) + 12) % 12]);

  const sortedUpper = [...rightMidis].sort((a, b) => a - b);
  for (let i = 0; i < sortedUpper.length; i++) {
    let m = sortedUpper[i];
    // Lift close lower thirds away from the bass string so guitar chords ring open & clean
    while (m < bass + 7 && m + 12 <= 76) {
      m += 12;
    }
    while (m > 76 && m - 12 >= bass + 5) {
      m -= 12;
    }
    const prev = picked[picked.length - 1];
    // Avoid muddy minor/major-2nd rubs on adjacent middle guitar strings
    if (m - prev <= 2 && m + 12 <= 76) {
      m += 12;
    }
    const pc = ((m % 12) + 12) % 12;
    if (!picked.includes(m) && (!seenPitchClasses.has(pc) || picked.length < 4)) {
      picked.push(m);
      seenPitchClasses.add(pc);
    }
  }

  return picked.sort((a, b) => a - b).slice(0, 5);
}

/**
 * Deterministic PRNG (Mulberry32) so fallback plucked-string excitation is reproducible.
 */
function createSeededNoise(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
}

/**
 * Physical string parameters for fallback waveguide synthesis & guitar decay modeling.
 */
export function getGuitarStringPhysics(
  midi: number,
  articulation: GuitarArticulation = 'backing'
): {
  lossFactor: number;
  brightness: number;
  pickPosition: number;
  warmthMix: number;
  bodyDurationSec: number;
} {
  const clamped = Math.max(36, Math.min(84, midi));
  const norm = (clamped - 36) / (84 - 36);
  const isMelody = articulation === 'melody';

  return {
    lossFactor: 0.9974 - norm * 0.0028,
    brightness: isMelody ? 0.54 - norm * 0.14 : 0.44 - norm * 0.12,
    pickPosition: isMelody ? 0.16 : 0.22,
    warmthMix: isMelody ? 0.34 : 0.44,
    bodyDurationSec: Math.max(1.35, 2.75 - norm * 1.15),
  };
}

/**
 * Synthesizes a mono fallback physical-modeled plucked string waveform.
 */
export function synthesizePluckedStringSamples(
  freqHz: number,
  sampleRate: number,
  durationSec: number,
  options?: GuitarStringSynthOptions
): Float32Array {
  const safeFreq = Math.max(55, Math.min(2200, freqHz));
  const totalSamples = Math.max(256, Math.round(sampleRate * durationSec));
  const out = new Float32Array(totalSamples);

  const period = sampleRate / safeFreq;
  const intDelay = Math.max(2, Math.floor(period));
  const frac = period - intDelay;

  const lossFactor = Math.max(0.96, Math.min(0.9992, options?.lossFactor ?? 0.9962));
  const brightness = Math.max(0.1, Math.min(0.9, options?.brightness ?? 0.46));
  const pickPos = Math.max(0.08, Math.min(0.42, options?.pickPosition ?? 0.2));
  const warmthMix = Math.max(0.1, Math.min(0.7, options?.warmthMix ?? 0.4));
  const nextRand = createSeededNoise(options?.seed ?? Math.round(safeFreq * 100));

  const ringLen = intDelay + 3;
  const ring = new Float32Array(ringLen);
  const rawExcitation = new Float32Array(ringLen);

  let smoothNoise = 0;
  for (let i = 0; i < ringLen; i++) {
    const white = nextRand();
    smoothNoise = smoothNoise * 0.56 + white * 0.44;
    const phase = (i / Math.max(2, period)) * Math.PI * 2;
    const fundamentalWarmth = Math.sin(phase) * 0.72 + Math.sin(phase * 2) * 0.24;
    rawExcitation[i] = smoothNoise * (1 - warmthMix) + fundamentalWarmth * warmthMix;
  }

  const pickOffset = Math.max(1, Math.min(ringLen - 1, Math.round(period * pickPos)));
  for (let i = 0; i < ringLen; i++) {
    const delayedPick = i >= pickOffset ? rawExcitation[i - pickOffset] : rawExcitation[0];
    ring[i] = rawExcitation[i] - 0.78 * delayedPick;
  }

  for (let i = 0; i < Math.min(totalSamples, ringLen); i++) {
    out[i] = ring[i];
  }

  let writeIdx = 0;
  let prevSample = out[Math.min(totalSamples - 1, ringLen - 1)] || 0;
  let dcPrevX = 0;
  let dcPrevY = 0;

  for (let i = ringLen; i < totalSamples; i++) {
    const readA = (writeIdx + ringLen - intDelay) % ringLen;
    const readB = (writeIdx + ringLen - intDelay - 1) % ringLen;
    const delayed = ring[readA] + frac * (ring[readB] - ring[readA]);

    const damped =
      lossFactor *
      ((1 - brightness) * delayed + brightness * 0.5 * (delayed + prevSample));
    prevSample = delayed;

    ring[writeIdx] = damped;
    writeIdx = (writeIdx + 1) % ringLen;

    const dcOut = damped - dcPrevX + 0.996 * dcPrevY;
    dcPrevX = damped;
    dcPrevY = dcOut;
    out[i] = dcOut;
  }

  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const a = Math.abs(out[i]);
    if (a > peak) peak = a;
  }
  const normGain = peak > 1e-5 ? 0.62 / peak : 1;
  const fadeTail = Math.min(Math.round(sampleRate * 0.025), totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    let s = out[i] * normGain;
    if (i > totalSamples - fadeTail) {
      s *= (totalSamples - i) / fadeTail;
    }
    out[i] = s;
  }

  return out;
}

// Module-level shared raw & decoded caches across live AudioContext + OfflineAudioContext WAV renders
const rawGuitarSampleBytesCache = new Map<string, ArrayBuffer>();
const decodedGuitarSampleCache = new Map<string, AudioBuffer>();
let rawGuitarFetchPromise: Promise<void> | null = null;
let decodeGuitarPromise: Promise<void> | null = null;

/**
 * Starts downloading all 37 chromatic Acoustic Guitar MP3 files cleanly in background.
 */
export function preloadGuitarSampleBytes(): Promise<void> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve();
  }
  if (rawGuitarSampleBytesCache.size >= GUITAR_SAMPLE_MANIFEST.length) {
    return Promise.resolve();
  }
  if (rawGuitarFetchPromise) return rawGuitarFetchPromise;

  rawGuitarFetchPromise = (async () => {
    await Promise.all(
      GUITAR_SAMPLE_MANIFEST.map(async (spec) => {
        if (rawGuitarSampleBytesCache.has(spec.key)) return;
        try {
          const res = await fetch(spec.url);
          if (!res.ok) return;
          const bytes = await res.arrayBuffer();
          if (bytes.byteLength > 256) {
            rawGuitarSampleBytesCache.set(spec.key, bytes);
          }
        } catch {
          // Graceful fallback if single fetch fails
        }
      })
    );
  })().finally(() => {
    rawGuitarFetchPromise = null;
  });

  return rawGuitarFetchPromise;
}

/**
 * Ensures all 37 studio Acoustic Guitar MP3 recordings are decoded into AudioBuffers.
 */
export async function ensureGuitarSamplesDecoded(ctx: BaseContext): Promise<number> {
  if (decodedGuitarSampleCache.size >= GUITAR_SAMPLE_MANIFEST.length) {
    return decodedGuitarSampleCache.size;
  }
  if (decodeGuitarPromise) {
    await decodeGuitarPromise;
    return decodedGuitarSampleCache.size;
  }

  decodeGuitarPromise = (async () => {
    await preloadGuitarSampleBytes();
    const rawCtx =
      (ctx as unknown as { rawContext?: BaseAudioContext }).rawContext ??
      (ctx as unknown as BaseAudioContext);
    if (!rawCtx || typeof rawCtx.decodeAudioData !== 'function') return;

    await Promise.all(
      GUITAR_SAMPLE_MANIFEST.map(async (spec) => {
        if (decodedGuitarSampleCache.has(spec.key)) return;
        const bytes = rawGuitarSampleBytesCache.get(spec.key);
        if (!bytes) return;
        try {
          const cloned = bytes.slice(0);
          const audioBuffer = await rawCtx.decodeAudioData(cloned);
          decodedGuitarSampleCache.set(spec.key, audioBuffer);
        } catch {
          // Ignore individual decode failure
        }
      })
    );
  })().finally(() => {
    decodeGuitarPromise = null;
  });

  await decodeGuitarPromise;
  return decodedGuitarSampleCache.size;
}

export function getDecodedGuitarSampleCount(): number {
  return decodedGuitarSampleCache.size;
}

export function getDecodedGuitarSampleSnapshot(): Map<string, AudioBuffer> {
  return new Map(decodedGuitarSampleCache);
}

/**
 * Generates an intimate wooden studio acoustic room impulse response
 * so real guitar multi-samples sit naturally in a warm living-room / studio mic space.
 */
function createAcousticRoomImpulseBuffer(
  rawCtx: AudioContext | OfflineAudioContext
): AudioBuffer {
  const sr = rawCtx.sampleRate || 44100;
  const durationSec = 0.95;
  const len = Math.max(1024, Math.round(sr * durationSec));
  const buffer = rawCtx.createBuffer(2, len, sr);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let seed = ch === 0 ? 0x42a19d3 : 0x71b3e89;
    let lp1 = 0;
    let lp2 = 0;
    const preDelaySamples = Math.round(sr * 0.009);

    for (let i = 0; i < len; i++) {
      if (i < preDelaySamples) {
        data[i] = 0;
        continue;
      }
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const white = (seed / 0xffffffff) * 2 - 1;
      const t = (i - preDelaySamples) / sr;
      const lpCoeff = Math.min(0.92, 0.72 + t * 0.16);
      lp1 = lp1 * lpCoeff + white * (1 - lpCoeff);
      lp2 = lp2 * 0.68 + lp1 * 0.32;

      const earlyBloom =
        0.2 * Math.exp(-Math.pow((t - 0.014) / 0.009, 2)) +
        0.12 * Math.exp(-Math.pow((t - 0.031) / 0.014, 2));
      const tailDecay = Math.exp(-t * 4.4);
      const fadeOut = i > len - 384 ? (len - i) / 384 : 1;
      data[i] = lp2 * (tailDecay * 0.34 + earlyBloom) * 0.26 * fadeOut;
    }
  }
  return buffer;
}

interface ActiveGuitarVoiceHandle {
  isMelody: boolean;
  stopAt: (when: number) => void;
}

/**
 * Studio-sampled Acoustic Guitar Engine backed by 37 chromatic studio guitar recordings (D2..D5),
 * velocity-coupled string brilliance, intimate wooden studio room ambience, and seamless
 * Karplus-Strong physical-modeled fallback prior to buffer decode.
 */
export class AcousticGuitarEngine {
  private readonly toneCtx: BaseContext;
  private readonly rawCtx: AudioContext | OfflineAudioContext;
  private readonly dryBus: GainNode;
  private readonly wetBus: GainNode;
  private readonly convolver: ConvolverNode;
  private readonly bodyLowShelf: BiquadFilterNode;
  private readonly topWarmth: BiquadFilterNode;
  private readonly airLp: BiquadFilterNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly masterGain: GainNode;

  private readonly sampleBuffers: Map<string, AudioBuffer>;
  private readonly synthFallbackCache = new Map<string, AudioBuffer>();
  private readonly activeVoices: ActiveGuitarVoiceHandle[] = [];
  private readonly maxPolyphony = 64;

  constructor(
    toneContext: BaseContext,
    destination: AudioNode,
    predecodedBuffers?: Map<string, AudioBuffer>
  ) {
    this.toneCtx = toneContext;
    this.rawCtx = toneContext.rawContext as AudioContext | OfflineAudioContext;
    this.sampleBuffers = predecodedBuffers
      ? new Map(predecodedBuffers)
      : getDecodedGuitarSampleSnapshot();

    this.masterGain = this.rawCtx.createGain();
    this.masterGain.gain.value = 1.02;

    this.compressor = this.rawCtx.createDynamicsCompressor();
    this.compressor.threshold.value = -13;
    this.compressor.knee.value = 14;
    this.compressor.ratio.value = 2.0;
    this.compressor.attack.value = 0.012;
    this.compressor.release.value = 0.22;

    // Gentle acoustic guitar mastering EQ preserving natural recorded transients & air
    this.bodyLowShelf = this.rawCtx.createBiquadFilter();
    this.bodyLowShelf.type = 'lowshelf';
    this.bodyLowShelf.frequency.value = 110;
    this.bodyLowShelf.gain.value = 1.8;

    this.topWarmth = this.rawCtx.createBiquadFilter();
    this.topWarmth.type = 'peaking';
    this.topWarmth.frequency.value = 210;
    this.topWarmth.Q.value = 1.1;
    this.topWarmth.gain.value = 1.1;

    this.airLp = this.rawCtx.createBiquadFilter();
    this.airLp.type = 'lowpass';
    this.airLp.frequency.value = 15200;
    this.airLp.Q.value = 0.55;

    this.dryBus = this.rawCtx.createGain();
    this.dryBus.gain.value = 0.96;

    this.wetBus = this.rawCtx.createGain();
    this.wetBus.gain.value = 0.16;

    this.convolver = this.rawCtx.createConvolver();
    this.convolver.buffer = createAcousticRoomImpulseBuffer(this.rawCtx);

    this.dryBus.connect(this.bodyLowShelf);
    this.wetBus.connect(this.convolver);
    this.convolver.connect(this.bodyLowShelf);

    this.bodyLowShelf.connect(this.topWarmth);
    this.topWarmth.connect(this.airLp);
    this.airLp.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(destination);

    // Kick off non-blocking background warm-up if cache is empty in live AudioContext
    if (this.sampleBuffers.size < GUITAR_SAMPLE_MANIFEST.length) {
      void ensureGuitarSamplesDecoded(this.toneCtx).then(() => {
        decodedGuitarSampleCache.forEach((buf, k) => {
          this.sampleBuffers.set(k, buf);
        });
      });
    }
  }

  public hasDecodedSamples(): boolean {
    if (this.sampleBuffers.size > 0) return true;
    if (decodedGuitarSampleCache.size > 0) {
      decodedGuitarSampleCache.forEach((buf, k) => this.sampleBuffers.set(k, buf));
      return true;
    }
    return false;
  }

  public async ensureLoaded(): Promise<number> {
    const count = await ensureGuitarSamplesDecoded(this.toneCtx);
    decodedGuitarSampleCache.forEach((buf, k) => {
      this.sampleBuffers.set(k, buf);
    });
    return count;
  }

  private getSampleBufferForKey(key: string): AudioBuffer | undefined {
    const local = this.sampleBuffers.get(key);
    if (local) return local;
    const shared = decodedGuitarSampleCache.get(key);
    if (shared) {
      this.sampleBuffers.set(key, shared);
      return shared;
    }
    return undefined;
  }

  private getOrCreateFallbackStringBuffer(
    midi: number,
    articulation: GuitarArticulation
  ): AudioBuffer {
    const clampedMidi = Math.max(36, Math.min(84, Math.round(midi)));
    const key = `${clampedMidi}:${articulation}`;
    const existing = this.synthFallbackCache.get(key);
    if (existing) return existing;

    const sr = this.rawCtx.sampleRate || 44100;
    const physics = getGuitarStringPhysics(clampedMidi, articulation);
    const samples = synthesizePluckedStringSamples(
      midiToFrequency(clampedMidi),
      sr,
      physics.bodyDurationSec,
      {
        lossFactor: physics.lossFactor,
        brightness: physics.brightness,
        pickPosition: physics.pickPosition,
        warmthMix: physics.warmthMix,
        seed: clampedMidi * 131 + (articulation === 'melody' ? 17 : 3),
      }
    );

    const buf = this.rawCtx.createBuffer(1, samples.length, sr);
    buf.getChannelData(0).set(samples);
    this.synthFallbackCache.set(key, buf);
    return buf;
  }

  public triggerNote(
    midi: number,
    durationSec: number,
    time: number,
    velocity = 0.65,
    sustainPedal = true,
    articulation: GuitarArticulation = 'backing'
  ): void {
    const clampedMidi = Math.max(36, Math.min(84, Math.round(midi)));
    const safeVel = Math.max(0.08, Math.min(1, velocity));
    const now = this.rawCtx.currentTime;
    const startTime = Math.max(now, time);
    const isMelody = articulation === 'melody';

    // Clean voice stealing for fast acoustic strums & sustained arpeggios
    while (this.activeVoices.length >= this.maxPolyphony) {
      const nonLeadIdx = this.activeVoices.findIndex((v) => !v.isMelody);
      const stealIdx = nonLeadIdx >= 0 ? nonLeadIdx : 0;
      const [stolen] = this.activeVoices.splice(stealIdx, 1);
      stolen?.stopAt(startTime + 0.015);
    }

    const match = findNearestGuitarSample(clampedMidi);
    const sampleBuf = this.getSampleBufferForKey(match.sample.key);

    if (sampleBuf) {
      this.triggerSampledGuitarVoice(
        clampedMidi,
        durationSec,
        startTime,
        safeVel,
        sustainPedal,
        articulation,
        sampleBuf,
        match.playbackRate
      );
      return;
    }

    this.triggerFallbackSynthVoice(
      clampedMidi,
      durationSec,
      startTime,
      safeVel,
      sustainPedal,
      articulation,
      isMelody
    );
  }

  private triggerSampledGuitarVoice(
    clampedMidi: number,
    durationSec: number,
    startTime: number,
    safeVel: number,
    sustainPedal: boolean,
    articulation: GuitarArticulation,
    sampleBuf: AudioBuffer,
    playbackRate: number
  ): void {
    const isMelody = articulation === 'melody';
    const freq = midiToFrequency(clampedMidi);
    const holdDur = Math.max(0.1, durationSec);
    const sampleDurationSec = sampleBuf.duration / Math.max(0.25, playbackRate);

    // Let acoustic strings bloom organically when sustain is enabled; smooth finger damp when off
    const normReg = (clampedMidi - 36) / 48;
    const releaseTau = sustainPedal
      ? Math.max(0.32, 0.72 - normReg * 0.28)
      : Math.max(0.075, 0.14 - normReg * 0.04);

    const releaseStart = startTime + holdDur;
    const stopAt = Math.min(
      startTime + sampleDurationSec,
      releaseStart + releaseTau * 4.8 + 0.05
    );

    const src = this.rawCtx.createBufferSource();
    src.buffer = sampleBuf;
    src.playbackRate.setValueAtTime(playbackRate, startTime);

    const timbreFilter = this.rawCtx.createBiquadFilter();
    timbreFilter.type = 'lowpass';
    timbreFilter.Q.value = 0.52;
    const curve = computeGuitarSampledTimbreCurve(freq, safeVel, articulation);
    timbreFilter.frequency.setValueAtTime(curve.attackCutoffHz, startTime);
    timbreFilter.frequency.exponentialRampToValueAtTime(
      curve.sustainCutoffHz,
      startTime + curve.glideSec
    );

    const envGain = this.rawCtx.createGain();
    const peakGain = Math.pow(safeVel, 1.08) * (isMelody ? 0.98 : 0.76);
    const attackSec = safeVel >= 0.7 ? 0.0014 : 0.0024 + (1 - safeVel) * 0.0035;

    envGain.gain.setValueAtTime(0.0001, startTime);
    envGain.gain.linearRampToValueAtTime(peakGain, startTime + attackSec);
    envGain.gain.setValueAtTime(peakGain, releaseStart);
    envGain.gain.setTargetAtTime(0.0001, releaseStart, releaseTau);

    const panNorm = ((clampedMidi - 38) / 38) * 2 - 1;
    const panVal = Math.max(-0.2, Math.min(0.2, panNorm * 0.16));

    src.connect(timbreFilter);
    timbreFilter.connect(envGain);

    let panner: StereoPannerNode | null = null;
    if (typeof this.rawCtx.createStereoPanner === 'function') {
      panner = this.rawCtx.createStereoPanner();
      panner.pan.setValueAtTime(panVal, startTime);
      envGain.connect(panner);
      panner.connect(this.dryBus);
      panner.connect(this.wetBus);
    } else {
      envGain.connect(this.dryBus);
      envGain.connect(this.wetBus);
    }

    src.start(startTime);
    src.stop(stopAt);

    const handle: ActiveGuitarVoiceHandle = {
      isMelody,
      stopAt: (when: number) => {
        try {
          envGain.gain.cancelScheduledValues(when);
          envGain.gain.setTargetAtTime(0.0001, when, 0.02);
          src.stop(when + 0.08);
        } catch {
          // Ignore already stopped nodes
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
        envGain.disconnect();
        panner?.disconnect();
      } catch {
        // Ignore cleanup errors
      }
    };
  }

  private triggerFallbackSynthVoice(
    clampedMidi: number,
    durationSec: number,
    startTime: number,
    safeVel: number,
    sustainPedal: boolean,
    articulation: GuitarArticulation,
    isMelody: boolean
  ): void {
    const buf = this.getOrCreateFallbackStringBuffer(clampedMidi, articulation);
    const src = this.rawCtx.createBufferSource();
    src.buffer = buf;

    const timbreFilter = this.rawCtx.createBiquadFilter();
    timbreFilter.type = 'lowpass';
    timbreFilter.Q.value = 0.65;
    const curve = computeGuitarSampledTimbreCurve(
      midiToFrequency(clampedMidi),
      safeVel,
      articulation
    );
    timbreFilter.frequency.setValueAtTime(curve.attackCutoffHz * 0.72, startTime);
    timbreFilter.frequency.exponentialRampToValueAtTime(
      curve.sustainCutoffHz * 0.72,
      startTime + 0.24
    );

    const envGain = this.rawCtx.createGain();
    const peakGain = Math.pow(safeVel, 1.05) * (isMelody ? 0.84 : 0.68);
    const holdDur = Math.max(0.08, durationSec);
    const releaseTail = sustainPedal ? 0.58 : 0.2;
    const releaseStart = startTime + holdDur;
    const stopAt = Math.min(
      startTime + buf.duration,
      releaseStart + releaseTail + 0.04
    );

    envGain.gain.setValueAtTime(0.0001, startTime);
    envGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.003);
    envGain.gain.setValueAtTime(
      peakGain * 0.92,
      Math.min(releaseStart, startTime + holdDur * 0.85)
    );
    envGain.gain.exponentialRampToValueAtTime(
      0.0001,
      Math.max(startTime + 0.06, stopAt - 0.01)
    );

    const panNorm = ((clampedMidi - 36) / 48) * 2 - 1;
    const panVal = Math.max(-0.2, Math.min(0.2, panNorm * 0.16));

    src.connect(timbreFilter);
    timbreFilter.connect(envGain);

    let panner: StereoPannerNode | null = null;
    if (typeof this.rawCtx.createStereoPanner === 'function') {
      panner = this.rawCtx.createStereoPanner();
      panner.pan.setValueAtTime(panVal, startTime);
      envGain.connect(panner);
      panner.connect(this.dryBus);
      panner.connect(this.wetBus);
    } else {
      envGain.connect(this.dryBus);
      envGain.connect(this.wetBus);
    }

    src.start(startTime);
    src.stop(stopAt);
    src.onended = () => {
      try {
        src.disconnect();
        timbreFilter.disconnect();
        envGain.disconnect();
        panner?.disconnect();
      } catch {
        // Ignore cleanup
      }
    };
  }

  public dispose(): void {
    const now = this.rawCtx.currentTime;
    while (this.activeVoices.length > 0) {
      const v = this.activeVoices.pop();
      v?.stopAt(now);
    }
    this.synthFallbackCache.clear();
    try {
      this.dryBus.disconnect();
      this.wetBus.disconnect();
      this.convolver.disconnect();
      this.bodyLowShelf.disconnect();
      this.topWarmth.disconnect();
      this.airLp.disconnect();
      this.compressor.disconnect();
      this.masterGain.disconnect();
    } catch {
      // Ignore disconnect errors on dispose
    }
  }
}
