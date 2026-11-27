import type { GunType } from './prismTdEngine.ts';

export type PrismSfxKind =
  | GunType
  | 'place'
  | 'select'
  | 'upgrade'
  | 'variant'
  | 'sell'
  | 'overheat'
  | 'explosion'
  | 'kill'
  | 'interrupt'
  | 'wave'
  | 'overdrive'
  | 'hurt'
  | 'error'
  | 'victory'
  | 'defeat';

type MixCategory = 'fire' | 'hit' | 'skill' | 'ui';

interface FoleyBuffers {
  rifleCrack: AudioBuffer;
  heavyCannon: AudioBuffer;
  explosion: AudioBuffer;
  flame: AudioBuffer;
  ice: AudioBuffer;
  steel: AudioBuffer;
  pinkNoise: AudioBuffer;
  whiteNoise: AudioBuffer;
}

interface SoundBus {
  master: GainNode;
  compressor: DynamicsCompressorNode;
  buffers: FoleyBuffers;
  lastTriggerMs: Map<string, number>;
  recentVoiceTimes: number[];
  lastOverheatGlobalMs: number;
}

const audioBusCache = new WeakMap<AudioContext, SoundBus>();

const USER_GESTURE_UI_KINDS = new Set<PrismSfxKind>([
  'place',
  'select',
  'upgrade',
  'variant',
  'sell',
  'wave',
  'overdrive',
  'error',
  'victory',
  'defeat',
]);

function normalizeAndWindowBuffer(data: Float32Array, sampleRate: number, fadeInSec = 0.001, fadeOutSec = 0.014) {
  let maxAbs = 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const mean = sum / Math.max(1, data.length);
  for (let i = 0; i < data.length; i++) {
    data[i] -= mean;
    const a = Math.abs(data[i]);
    if (a > maxAbs) maxAbs = a;
  }
  const scale = maxAbs > 0.0001 ? 0.78 / maxAbs : 1;
  const fadeInSamples = Math.max(1, Math.floor(sampleRate * fadeInSec));
  const fadeOutSamples = Math.max(1, Math.floor(sampleRate * fadeOutSec));
  for (let i = 0; i < data.length; i++) {
    let env = 1;
    if (i < fadeInSamples) env *= i / fadeInSamples;
    if (i > data.length - fadeOutSamples) env *= (data.length - i) / fadeOutSamples;
    data[i] *= scale * env;
  }
}

function buildSingleFoleyBuffer(ctx: AudioContext, key: keyof FoleyBuffers): AudioBuffer {
  const sr = ctx.sampleRate || 44100;

  if (key === 'rifleCrack') {
    const rifleLen = Math.floor(sr * 0.16);
    const rifleCrack = ctx.createBuffer(1, rifleLen, sr);
    const rd = rifleCrack.getChannelData(0);
    let lpR = 0;
    for (let i = 0; i < rifleLen; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      lpR = lpR * 0.62 + white * 0.38;
      const snap = Math.exp(-t / 0.008) * white * 0.95;
      const powder = Math.exp(-t / 0.026) * lpR * 0.85;
      const thump = Math.exp(-t / 0.02) * Math.sin(2 * Math.PI * 76 * t) * 0.45;
      const slap = t > 0.022 ? Math.exp(-(t - 0.022) / 0.024) * lpR * 0.22 : 0;
      rd[i] = snap + powder + thump + slap;
    }
    normalizeAndWindowBuffer(rd, sr, 0.0008, 0.015);
    return rifleCrack;
  }

  if (key === 'heavyCannon') {
    const heavyLen = Math.floor(sr * 0.34);
    const heavyCannon = ctx.createBuffer(1, heavyLen, sr);
    const hd = heavyCannon.getChannelData(0);
    let lpH1 = 0;
    let lpH2 = 0;
    for (let i = 0; i < heavyLen; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      lpH1 = lpH1 * 0.78 + white * 0.22;
      lpH2 = lpH2 * 0.92 + lpH1 * 0.08;
      const crack = Math.exp(-t / 0.013) * white * 0.8;
      const boom = Math.exp(-t / 0.075) * lpH2 * 1.3;
      const chest =
        Math.exp(-t / 0.055) * Math.sin(2 * Math.PI * (54 + 24 * Math.exp(-t / 0.025)) * t) * 0.62;
      const tail = t > 0.03 ? Math.exp(-(t - 0.03) / 0.095) * lpH1 * 0.28 : 0;
      hd[i] = crack + boom + chest + tail;
    }
    normalizeAndWindowBuffer(hd, sr, 0.001, 0.035);
    return heavyCannon;
  }

  if (key === 'explosion') {
    const expLen = Math.floor(sr * 0.46);
    const explosion = ctx.createBuffer(1, expLen, sr);
    const ed = explosion.getChannelData(0);
    let lpE = 0;
    for (let i = 0; i < expLen; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      lpE = lpE * 0.88 + white * 0.12;
      const front = Math.exp(-t / 0.02) * white * 0.65;
      const rumble = Math.exp(-t / 0.14) * lpE * 1.45;
      const sub = Math.exp(-t / 0.09) * Math.sin(2 * Math.PI * 44 * t) * 0.65;
      ed[i] = front + rumble + sub;
    }
    normalizeAndWindowBuffer(ed, sr, 0.0012, 0.05);
    return explosion;
  }

  if (key === 'flame') {
    const flameLen = Math.floor(sr * 0.26);
    const flame = ctx.createBuffer(1, flameLen, sr);
    const fd = flame.getChannelData(0);
    let lpF1 = 0;
    let lpF2 = 0;
    for (let i = 0; i < flameLen; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      lpF1 = lpF1 * 0.84 + white * 0.16;
      lpF2 = lpF2 * 0.91 + lpF1 * 0.09;
      const rise = Math.min(1, t / 0.025);
      const body = Math.exp(-t / 0.11) * (lpF2 * 1.15 + lpF1 * 0.35);
      fd[i] = rise * body;
    }
    normalizeAndWindowBuffer(fd, sr, 0.006, 0.04);
    return flame;
  }

  if (key === 'ice') {
    const iceLen = Math.floor(sr * 0.22);
    const ice = ctx.createBuffer(1, iceLen, sr);
    const id = ice.getChannelData(0);
    let hpPrev = 0;
    for (let i = 0; i < iceLen; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      const hp = white - hpPrev * 0.72;
      hpPrev = white;
      const c1 = Math.exp(-t / 0.005) * hp * 0.9;
      const c2 = t > 0.019 ? Math.exp(-(t - 0.019) / 0.006) * hp * 0.75 : 0;
      const c3 = t > 0.041 ? Math.exp(-(t - 0.041) / 0.007) * hp * 0.55 : 0;
      const frostMist = Math.exp(-t / 0.075) * white * 0.28;
      id[i] = c1 + c2 + c3 + frostMist;
    }
    normalizeAndWindowBuffer(id, sr, 0.0008, 0.03);
    return ice;
  }

  if (key === 'steel') {
    const steelLen = Math.floor(sr * 0.15);
    const steel = ctx.createBuffer(1, steelLen, sr);
    const sd = steel.getChannelData(0);
    for (let i = 0; i < steelLen; i++) {
      const t = i / sr;
      const white = Math.random() * 2 - 1;
      const airWhip = Math.exp(-t / 0.038) * white * 0.55;
      const ring =
        Math.exp(-t / 0.055) *
        (Math.sin(2 * Math.PI * 2420 * t) * 0.28 + Math.sin(2 * Math.PI * 3690 * t) * 0.2);
      sd[i] = airWhip + ring;
    }
    normalizeAndWindowBuffer(sd, sr, 0.001, 0.025);
    return steel;
  }

  const genLen = Math.floor(sr * 0.45);
  const buf = ctx.createBuffer(1, genLen, sr);
  const dst = buf.getChannelData(0);
  if (key === 'pinkNoise') {
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < genLen; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      dst[i] = (b0 + b1 + b2 + w * 0.42) * 0.25;
    }
  } else {
    for (let i = 0; i < genLen; i++) {
      dst[i] = Math.random() * 2 - 1;
    }
  }
  normalizeAndWindowBuffer(dst, sr, 0.004, 0.02);
  return buf;
}

function createLazyFoleyBuffers(ctx: AudioContext): FoleyBuffers {
  const partial: Partial<FoleyBuffers> = {};
  const obj = {} as FoleyBuffers;
  const keys: (keyof FoleyBuffers)[] = [
    'rifleCrack',
    'heavyCannon',
    'explosion',
    'flame',
    'ice',
    'steel',
    'pinkNoise',
    'whiteNoise',
  ];
  for (const key of keys) {
    Object.defineProperty(obj, key, {
      enumerable: true,
      get() {
        if (!partial[key]) {
          partial[key] = buildSingleFoleyBuffer(ctx, key);
        }
        return partial[key]!;
      },
    });
  }
  return obj;
}

function getSoundBus(ctx: AudioContext): SoundBus {
  const cached = audioBusCache.get(ctx);
  if (cached) return cached;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, ctx.currentTime);
  compressor.knee.setValueAtTime(12, ctx.currentTime);
  compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
  compressor.attack.setValueAtTime(0.004, ctx.currentTime);
  compressor.release.setValueAtTime(0.16, ctx.currentTime);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.86, ctx.currentTime);

  // Warm soft-clipper saturator prevents digital peak clipping when multiple cannons fire
  if (typeof ctx.createWaveShaper === 'function') {
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 255 - 1;
      curve[i] = Math.tanh(x * 1.35) / Math.tanh(1.35);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';
    master.connect(shaper);
    shaper.connect(compressor);
  } else {
    master.connect(compressor);
  }
  compressor.connect(ctx.destination);

  const bus: SoundBus = {
    master,
    compressor,
    buffers: createLazyFoleyBuffers(ctx),
    lastTriggerMs: new Map<string, number>(),
    recentVoiceTimes: [],
    lastOverheatGlobalMs: -1e9,
  };
  audioBusCache.set(ctx, bus);
  return bus;
}

function ensureAudioContext(
  audioCtxRef: { current: AudioContext | null },
  allowCreate = true
): AudioContext | null {
  if (audioCtxRef.current) {
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      void ctx.resume();
    }
    return ctx;
  }
  if (!allowCreate || typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  audioCtxRef.current = new AudioCtx();
  const ctx = audioCtxRef.current;
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    void ctx.resume();
  }
  return ctx;
}

/**
 * Call synchronously inside user click / pointer / key handlers so Web Audio unlocks cleanly on mobile & desktop.
 */
export function unlockPrismAudio(audioCtxRef: { current: AudioContext | null }): void {
  try {
    ensureAudioContext(audioCtxRef, true);
  } catch {
    // Ignore autoplay restrictions
  }
}

export function syncPrismSoundMute(
  enabled: boolean,
  audioCtxRef: { current: AudioContext | null }
): void {
  try {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const bus = audioBusCache.get(ctx);
    if (!bus) return;
    if (typeof bus.master.gain.setTargetAtTime === 'function') {
      bus.master.gain.setTargetAtTime(enabled ? 0.86 : 0, ctx.currentTime, 0.02);
    } else {
      bus.master.gain.setValueAtTime(enabled ? 0.86 : 0, ctx.currentTime);
    }
  } catch {
    // Ignore
  }
}

function canTrigger(bus: SoundBus, key: string, minGapMs: number): boolean {
  if (minGapMs <= 0) return true;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const prev = bus.lastTriggerMs.get(key) ?? -1e9;
  if (nowMs - prev < minGapMs) return false;
  bus.lastTriggerMs.set(key, nowMs);
  return true;
}

/**
 * Global voice budget & dynamic gain scaling so 15+ guns + Overdrive NEVER turns into muddy clipping or compressor pumping.
 */
function acquireMixSlot(bus: SoundBus, category: MixCategory): number {
  if (category === 'ui') return 1;
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  while (bus.recentVoiceTimes.length > 0 && nowMs - bus.recentVoiceTimes[0] > 110) {
    bus.recentVoiceTimes.shift();
  }
  if (category === 'skill') {
    if (nowMs - bus.lastOverheatGlobalMs < 240) return 0;
    bus.lastOverheatGlobalMs = nowMs;
    bus.recentVoiceTimes.push(nowMs);
    return 0.92;
  }
  if (bus.recentVoiceTimes.length >= 7) {
    return 0;
  }
  const activeCount = bus.recentVoiceTimes.length;
  bus.recentVoiceTimes.push(nowMs);
  return 1 / Math.sqrt(1 + activeCount * 0.42);
}

function jitter(base: number, pct = 0.055): number {
  return base * (1 + (Math.random() * 2 - 1) * pct);
}

/**
 * Plays a pre-baked realistic Foley waveform from start (offset=0, zero click!) through a static tone-shaping filter.
 * Never sweeps a resonant bandpass filter so it NEVER sounds like a cartoon pew/laser.
 */
function playFoleyBuffer(
  ctx: AudioContext,
  bus: SoundBus,
  buffer: AudioBuffer,
  opts: {
    filterType: BiquadFilterType;
    cutoffHz: number;
    q?: number;
    rate?: number;
    dur: number;
    vol: number;
    delay?: number;
    attack?: number;
  }
) {
  const t0 = ctx.currentTime + (opts.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.setValueAtTime(opts.rate ?? 1, t0);

  const filter = ctx.createBiquadFilter();
  filter.type = opts.filterType;
  filter.frequency.setValueAtTime(Math.max(40, opts.cutoffHz), t0);
  filter.Q.setValueAtTime(opts.q ?? 0.65, t0);

  const gain = ctx.createGain();
  const attack = Math.min(opts.attack ?? 0.0015, opts.dur * 0.3);
  gain.gain.setValueAtTime(0.0005, t0);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, opts.vol), t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(bus.master);

  src.start(t0, 0, opts.dur + 0.01);
  src.stop(t0 + opts.dur + 0.015);
}

/**
 * Pure low-end chest recoil punch strictly capped <= 105Hz (felt as physical weight, zero 8-bit bloop).
 */
function playSubKick(
  ctx: AudioContext,
  bus: SoundBus,
  fStart: number,
  fEnd: number,
  dur: number,
  vol: number,
  delay = 0
) {
  const t0 = ctx.currentTime + delay;
  const clampedStart = Math.min(108, Math.max(32, fStart));
  const clampedEnd = Math.min(clampedStart, Math.max(24, fEnd));
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(clampedStart, t0);
  osc.frequency.exponentialRampToValueAtTime(clampedEnd, t0 + dur);
  gain.gain.setValueAtTime(0.0008, t0);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, vol), t0 + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(bus.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.015);
}

/**
 * Subtle metallic breech / bolt-action click using crisp highpassed transient (never sweeping).
 */
function playBoltClick(
  ctx: AudioContext,
  bus: SoundBus,
  freqHz: number,
  vol: number,
  delay: number
) {
  playFoleyBuffer(ctx, bus, bus.buffers.whiteNoise, {
    filterType: 'bandpass',
    cutoffHz: jitter(freqHz, 0.06),
    q: 2.2,
    rate: 1.0,
    dur: 0.018,
    vol,
    delay,
    attack: 0.001,
  });
}

/**
 * Clean steady harmonic tone (used ONLY for tactical UI confirms, victory, radar beacon, upgrade chimes).
 */
function playStableTone(
  ctx: AudioContext,
  bus: SoundBus,
  freq: number,
  dur: number,
  vol: number,
  type: OscillatorType = 'triangle',
  delay = 0,
  attack = 0.008
) {
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(30, freq), t0);
  gain.gain.setValueAtTime(0.0008, t0);
  gain.gain.linearRampToValueAtTime(Math.max(0.001, vol), t0 + Math.min(attack, dur * 0.4));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(bus.master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/**
 * Gritty electrical discharge crackle + 60Hz/120Hz mains transformer buzz (no laser sweep).
 */
function playElectricArc(
  ctx: AudioContext,
  bus: SoundBus,
  vol: number,
  dur = 0.1,
  delay = 0
) {
  playFoleyBuffer(ctx, bus, bus.buffers.ice, {
    filterType: 'bandpass',
    cutoffHz: jitter(3400, 0.1),
    q: 1.2,
    rate: jitter(1.15, 0.1),
    dur: dur * 0.72,
    vol: vol * 0.85,
    delay,
    attack: 0.001,
  });
  playSubKick(ctx, bus, 98, 56, dur * 0.9, vol * 0.65, delay);
}

const SFX_MIN_GAP_MS: Partial<Record<PrismSfxKind, number>> = {
  gatling: 82,
  shotgun: 115,
  flamer: 150,
  saw: 115,
  mortar: 135,
  missile: 120,
  railgun: 130,
  prism_refract: 145,
  orbital: 240,
  hyperion: 195,
  singularity: 220,
  mothership: 150,
  supernova: 170,
  chronos: 185,
  astral_ark: 195,
  aurelia_cannon: 165,
  paradox_scythe: 170,
  nebula_core: 205,
  tesla: 110,
  tempest: 125,
  aurora_spire: 185,
  thunder_loom: 195,
  beacon: 220,
  cryo: 150,
  radar: 190,
  quantum_prism: 190,
  explosion: 95,
  kill: 95,
  interrupt: 140,
  hurt: 160,
  overheat: 240,
};

function getSfxCategory(kind: PrismSfxKind): MixCategory {
  if (USER_GESTURE_UI_KINDS.has(kind)) return 'ui';
  if (kind === 'overheat') return 'skill';
  if (kind === 'kill' || kind === 'explosion' || kind === 'hurt' || kind === 'interrupt') return 'hit';
  return 'fire';
}

export function playPrismSfx(
  kind: PrismSfxKind,
  enabled: boolean,
  audioCtxRef: { current: AudioContext | null }
): void {
  if (!enabled) return;
  try {
    const isUi = USER_GESTURE_UI_KINDS.has(kind);
    const ctx = ensureAudioContext(audioCtxRef, isUi);
    if (!ctx) return;
    // Never buffer/pile up combat ticks while AudioContext is still suspended before user gesture
    if (!isUi && ctx.state === 'suspended') return;

    const bus = getSoundBus(ctx);
    const minGap = SFX_MIN_GAP_MS[kind] ?? 36;
    if (!canTrigger(bus, `sfx:${kind}`, minGap)) return;

    const mix = acquireMixSlot(bus, getSfxCategory(kind));
    if (mix <= 0) return;

    switch (kind) {
      // ---- UI / TACTICAL CUES ----
      case 'place':
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'lowpass',
          cutoffHz: 1600,
          rate: 0.78,
          dur: 0.055,
          vol: 0.24 * mix,
        });
        playStableTone(ctx, bus, 523.25, 0.07, 0.085, 'sine', 0.014, 0.004);
        break;
      case 'select':
        playBoltClick(ctx, bus, 2800, 0.12, 0);
        playStableTone(ctx, bus, 659.25, 0.045, 0.06, 'sine', 0, 0.003);
        break;
      case 'upgrade':
        playBoltClick(ctx, bus, 3400, 0.12, 0);
        playStableTone(ctx, bus, 440, 0.09, 0.1, 'triangle', 0);
        playStableTone(ctx, bus, 554.37, 0.09, 0.1, 'triangle', 0.045);
        playStableTone(ctx, bus, 659.25, 0.14, 0.12, 'sine', 0.09);
        break;
      case 'variant':
        playBoltClick(ctx, bus, 3800, 0.11, 0);
        playStableTone(ctx, bus, 587.33, 0.075, 0.09, 'triangle', 0);
        playStableTone(ctx, bus, 880, 0.11, 0.095, 'sine', 0.04);
        break;
      case 'sell':
        playFoleyBuffer(ctx, bus, bus.buffers.pinkNoise, {
          filterType: 'bandpass',
          cutoffHz: 1100,
          q: 0.9,
          dur: 0.05,
          vol: 0.15,
        });
        playStableTone(ctx, bus, 783.99, 0.06, 0.08, 'sine', 0);
        playStableTone(ctx, bus, 523.25, 0.1, 0.09, 'triangle', 0.045);
        break;
      case 'error':
        playBoltClick(ctx, bus, 1400, 0.12, 0);
        playStableTone(ctx, bus, 220, 0.055, 0.08, 'triangle', 0, 0.002);
        playStableTone(ctx, bus, 164.81, 0.075, 0.085, 'triangle', 0.05, 0.002);
        break;
      case 'wave':
        playSubKick(ctx, bus, 94, 46, 0.28, 0.22);
        playStableTone(ctx, bus, 220, 0.16, 0.12, 'triangle', 0);
        playStableTone(ctx, bus, 329.63, 0.24, 0.14, 'triangle', 0.11);
        break;
      case 'overdrive':
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1800,
          rate: 0.95,
          dur: 0.3,
          vol: 0.32,
        });
        playSubKick(ctx, bus, 102, 34, 0.34, 0.28);
        playStableTone(ctx, bus, 293.66, 0.16, 0.12, 'triangle', 0.03);
        playStableTone(ctx, bus, 440, 0.24, 0.14, 'sine', 0.1);
        break;
      case 'explosion':
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: jitter(1350, 0.1),
          rate: jitter(0.94, 0.08),
          dur: 0.28,
          vol: 0.34 * mix,
        });
        playSubKick(ctx, bus, 82, 28, 0.22, 0.22 * mix);
        break;
      case 'kill':
        // Tactile suppressed hit-marker tick
        playBoltClick(ctx, bus, 2400, 0.12 * mix, 0);
        playSubKick(ctx, bus, 95, 48, 0.04, 0.07 * mix);
        break;
      case 'interrupt':
        // Distinct EMP skill-break crunch + downward clamp tone
        playElectricArc(ctx, bus, 0.28 * mix, 0.12, 0);
        playBoltClick(ctx, bus, 3600, 0.14 * mix, 0.01);
        playStableTone(ctx, bus, 660, 0.07, 0.08 * mix, 'triangle', 0);
        playStableTone(ctx, bus, 330, 0.14, 0.09 * mix, 'triangle', 0.04);
        break;
      case 'hurt':
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 680,
          rate: 0.72,
          dur: 0.24,
          vol: 0.34,
        });
        playSubKick(ctx, bus, 92, 30, 0.26, 0.28);
        break;
      case 'victory':
        playStableTone(ctx, bus, 523.25, 0.13, 0.14, 'triangle', 0);
        playStableTone(ctx, bus, 659.25, 0.13, 0.14, 'triangle', 0.11);
        playStableTone(ctx, bus, 783.99, 0.14, 0.15, 'triangle', 0.22);
        playStableTone(ctx, bus, 1046.5, 0.4, 0.18, 'sine', 0.33);
        break;
      case 'defeat':
        playSubKick(ctx, bus, 98, 36, 0.36, 0.24);
        playStableTone(ctx, bus, 220, 0.24, 0.14, 'triangle', 0);
        playStableTone(ctx, bus, 164.81, 0.4, 0.16, 'triangle', 0.16);
        break;

      // ---- REALISTIC ATTACK WEAPONS (7) ----
      case 'gatling':
        // Crisp 5.56mm SAW rifle burst + chamber punch + brass bolt tick
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'lowpass',
          cutoffHz: jitter(4200, 0.08),
          rate: jitter(1.04, 0.06),
          dur: 0.09,
          vol: 0.28 * mix,
        });
        playSubKick(ctx, bus, 96, 44, 0.042, 0.13 * mix);
        playBoltClick(ctx, bus, 4600, 0.08 * mix, 0.015);
        break;

      case 'shotgun':
        // Wide 12-gauge Remington pump blast + pump-action clack
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: jitter(3400, 0.07),
          rate: jitter(1.06, 0.05),
          dur: 0.22,
          vol: 0.36 * mix,
        });
        playSubKick(ctx, bus, 95, 34, 0.1, 0.24 * mix);
        playBoltClick(ctx, bus, 3100, 0.1 * mix, 0.065);
        break;

      case 'flamer':
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'lowpass',
          cutoffHz: jitter(1500, 0.08),
          rate: jitter(0.98, 0.07),
          dur: 0.22,
          vol: 0.28 * mix,
          attack: 0.012,
        });
        break;

      case 'saw':
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: jitter(2500, 0.08),
          q: 0.85,
          rate: jitter(0.95, 0.06),
          dur: 0.13,
          vol: 0.24 * mix,
        });
        playSubKick(ctx, bus, 94, 48, 0.06, 0.1 * mix);
        break;

      case 'mortar':
        // Hollow mortar barrel "THOOM"
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 780,
          rate: jitter(0.76, 0.05),
          dur: 0.22,
          vol: 0.34 * mix,
        });
        playSubKick(ctx, bus, 92, 34, 0.16, 0.26 * mix);
        break;

      case 'missile':
        // Rocket propellant whoosh + tube ignition thud
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'bandpass',
          cutoffHz: jitter(1450, 0.08),
          q: 0.65,
          rate: jitter(1.15, 0.06),
          dur: 0.2,
          vol: 0.28 * mix,
          attack: 0.008,
        });
        playSubKick(ctx, bus, 86, 40, 0.12, 0.18 * mix);
        break;

      case 'railgun':
        // Hypersonic magnetic railgun: capacitor crack + sonic boom
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'highpass',
          cutoffHz: 900,
          rate: jitter(1.12, 0.04),
          dur: 0.12,
          vol: 0.32 * mix,
        });
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 2600,
          rate: 0.92,
          dur: 0.26,
          vol: 0.34 * mix,
        });
        playSubKick(ctx, bus, 94, 28, 0.18, 0.28 * mix);
        break;

      case 'orbital':
        // Deep orbital sky-beam discharge + atmospheric thunder crack
        playStableTone(ctx, bus, 880, 0.06, 0.08 * mix, 'sine', 0, 0.002);
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 2900,
          rate: 0.88,
          dur: 0.34,
          vol: 0.34 * mix,
          delay: 0.03,
        });
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'bandpass',
          cutoffHz: 1100,
          q: 0.7,
          rate: 0.85,
          dur: 0.28,
          vol: 0.22 * mix,
          delay: 0.04,
        });
        playSubKick(ctx, bus, 88, 24, 0.32, 0.3 * mix, 0.02);
        break;

      case 'singularity':
        // Deep gravitational sub-warp + dark plasma implosion hum
        playSubKick(ctx, bus, 76, 24, 0.42, 0.32 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 620,
          rate: 0.72,
          dur: 0.38,
          vol: 0.28 * mix,
        });
        playStableTone(ctx, bus, 146.83, 0.28, 0.08 * mix, 'triangle', 0.02, 0.02);
        break;

      case 'mothership':
        // Twin aerospace fighter laser + hangar catapult pulse
        playBoltClick(ctx, bus, 3400, 0.1 * mix, 0);
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'bandpass',
          cutoffHz: 2800,
          q: 0.85,
          rate: 1.18,
          dur: 0.08,
          vol: 0.22 * mix,
        });
        playSubKick(ctx, bus, 92, 46, 0.07, 0.12 * mix);
        break;

      case 'supernova':
        // Resonant stellar plasma pulse + cosmic bell chime + deep recoil punch
        playStableTone(ctx, bus, 587.33, 0.14, 0.09 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 880, 0.18, 0.075 * mix, 'triangle', 0.02, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 2600,
          rate: jitter(0.92, 0.05),
          dur: 0.28,
          vol: 0.32 * mix,
        });
        playSubKick(ctx, bus, 92, 26, 0.28, 0.28 * mix);
        break;

      case 'chronos':
        // Crystalline astral clockwork chime + deep temporal phase drop
        playStableTone(ctx, bus, 740, 0.16, 0.09 * mix, 'sine', 0, 0.003);
        playStableTone(ctx, bus, 1108.73, 0.2, 0.08 * mix, 'triangle', 0.025, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: 2900,
          q: 1.1,
          rate: 1.08,
          dur: 0.14,
          vol: 0.22 * mix,
        });
        playSubKick(ctx, bus, 86, 22, 0.34, 0.3 * mix);
        break;

      case 'aegis_bastion':
        playStableTone(ctx, bus, 493.88, 0.16, 0.08 * mix, 'triangle', 0, 0.004);
        playStableTone(ctx, bus, 739.99, 0.19, 0.075 * mix, 'sine', 0.025, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: 2600,
          q: 0.95,
          rate: jitter(1.06, 0.06),
          dur: 0.14,
          vol: 0.26 * mix,
        });
        playSubKick(ctx, bus, 94, 30, 0.2, 0.24 * mix);
        break;

      case 'astral_ark':
        // 1000-energy apex void prism cannon: crystal harmonic + hypersonic capacitor crack + sub impact
        playStableTone(ctx, bus, 523.25, 0.16, 0.085 * mix, 'sine', 0, 0.003);
        playStableTone(ctx, bus, 1046.5, 0.18, 0.075 * mix, 'triangle', 0.02, 0.003);
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 3100,
          rate: jitter(0.88, 0.04),
          dur: 0.32,
          vol: 0.34 * mix,
        });
        playSubKick(ctx, bus, 94, 22, 0.38, 0.32 * mix);
        break;

      case 'prism_refract':
        playStableTone(ctx, bus, 740, 0.12, 0.08 * mix, 'sine', 0, 0.003);
        playStableTone(ctx, bus, 1108.73, 0.14, 0.065 * mix, 'triangle', 0.02, 0.003);
        playFoleyBuffer(ctx, bus, bus.buffers.ice, {
          filterType: 'highpass',
          cutoffHz: 1800,
          rate: jitter(1.12, 0.06),
          dur: 0.11,
          vol: 0.2 * mix,
        });
        break;

      case 'hyperion':
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 2200,
          rate: jitter(0.82, 0.04),
          dur: 0.32,
          vol: 0.36 * mix,
        });
        playSubKick(ctx, bus, 92, 24, 0.34, 0.32 * mix);
        playBoltClick(ctx, bus, 2600, 0.12 * mix, 0.04);
        break;

      case 'aurelia_cannon':
        playStableTone(ctx, bus, 659.25, 0.13, 0.085 * mix, 'triangle', 0, 0.003);
        playStableTone(ctx, bus, 987.77, 0.16, 0.07 * mix, 'sine', 0.025, 0.003);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: 2700,
          q: 0.9,
          rate: 1.06,
          dur: 0.13,
          vol: 0.24 * mix,
        });
        playSubKick(ctx, bus, 92, 30, 0.22, 0.22 * mix);
        break;

      case 'paradox_scythe':
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: 2200,
          q: 1.1,
          rate: jitter(1.1, 0.07),
          dur: 0.15,
          vol: 0.28 * mix,
        });
        playStableTone(ctx, bus, 554.37, 0.12, 0.07 * mix, 'sine', 0, 0.004);
        playSubKick(ctx, bus, 88, 32, 0.18, 0.18 * mix);
        break;

      case 'nebula_core':
        playStableTone(ctx, bus, 440, 0.18, 0.08 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 880, 0.22, 0.07 * mix, 'triangle', 0.03, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1750,
          rate: 0.88,
          dur: 0.34,
          vol: 0.34 * mix,
        });
        playSubKick(ctx, bus, 90, 22, 0.4, 0.32 * mix);
        break;

      // ---- ELECTRIC / LIGHTNING WEAPONS (4) ----
      case 'tesla':
        playElectricArc(ctx, bus, 0.24 * mix, 0.095, 0);
        break;

      case 'tempest':
        playElectricArc(ctx, bus, 0.22 * mix, 0.1, 0);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 950,
          rate: 1.0,
          dur: 0.2,
          vol: 0.22 * mix,
          delay: 0.012,
        });
        break;

      case 'aurora_spire':
        playElectricArc(ctx, bus, 0.26 * mix, 0.12, 0);
        playStableTone(ctx, bus, 587.33, 0.15, 0.075 * mix, 'sine', 0.01, 0.004);
        playSubKick(ctx, bus, 94, 34, 0.18, 0.18 * mix);
        break;

      case 'thunder_loom':
        // High-voltage 1000⚡ Thiên Lôi Faraday discharge + harmonic polarity hum + deep magnetic snap kick
        playElectricArc(ctx, bus, 0.28 * mix, 0.12, 0);
        playElectricArc(ctx, bus, 0.22 * mix, 0.11, 0.045);
        playStableTone(ctx, bus, 493.88, 0.18, 0.08 * mix, 'triangle', 0.01, 0.004);
        playStableTone(ctx, bus, 739.99, 0.2, 0.07 * mix, 'sine', 0.035, 0.004);
        playSubKick(ctx, bus, 96, 26, 0.26, 0.26 * mix);
        break;

      // ---- PURE SUPPORT TOWERS (3) ----
      case 'beacon':
        playStableTone(ctx, bus, 587.33, 0.13, 0.06 * mix, 'sine', 0, 0.006);
        playStableTone(ctx, bus, 880, 0.13, 0.05 * mix, 'triangle', 0.03, 0.006);
        break;

      case 'cryo':
        playFoleyBuffer(ctx, bus, bus.buffers.ice, {
          filterType: 'highpass',
          cutoffHz: 1100,
          rate: jitter(1.0, 0.08),
          dur: 0.18,
          vol: 0.28 * mix,
        });
        playSubKick(ctx, bus, 88, 42, 0.07, 0.11 * mix);
        break;

      case 'radar':
        playBoltClick(ctx, bus, 3600, 0.065 * mix, 0);
        playStableTone(ctx, bus, 784, 0.1, 0.065 * mix, 'sine', 0, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'bandpass',
          cutoffHz: 2200,
          q: 1.4,
          rate: 1.2,
          dur: 0.08,
          vol: 0.11 * mix,
        });
        break;

      case 'quantum_prism':
        playStableTone(ctx, bus, 659.25, 0.14, 0.065 * mix, 'sine', 0, 0.005);
        playStableTone(ctx, bus, 987.77, 0.16, 0.055 * mix, 'triangle', 0.025, 0.005);
        playBoltClick(ctx, bus, 3200, 0.06 * mix, 0);
        break;

      case 'overheat':
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1600,
          rate: 0.95,
          dur: 0.24,
          vol: 0.3 * mix,
        });
        playSubKick(ctx, bus, 96, 32, 0.22, 0.24 * mix);
        break;
    }
  } catch {
    // Ignore blocked audio context
  }
}

/**
 * Distinct multi-stage Overheat Ultimate SFX matched 1-to-1 with ALL 12 `overheatSkill.key` values in `prismTdEngine.ts`.
 */
export function playOverheatSkillSfx(
  skillKey: string,
  gunType: GunType,
  enabled: boolean,
  audioCtxRef: { current: AudioContext | null }
): void {
  if (!enabled) return;
  try {
    const ctx = ensureAudioContext(audioCtxRef, false);
    if (!ctx || ctx.state === 'suspended') return;

    const bus = getSoundBus(ctx);
    if (!canTrigger(bus, `overheat:${skillKey}`, 240)) return;
    const mix = acquireMixSlot(bus, 'skill');
    if (mix <= 0) return;

    switch (skillKey) {
      case 'gatling_hyper_barrage':
        for (let i = 0; i < 4; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
            filterType: 'lowpass',
            cutoffHz: 3600 + i * 250,
            rate: 0.96 + i * 0.04,
            dur: 0.085,
            vol: 0.24 * mix,
            delay: i * 0.055,
          });
          playSubKick(ctx, bus, 94, 42, 0.045, 0.14 * mix, i * 0.055);
        }
        break;

      case 'shotgun_nova_blast':
      case 'flamer_phoenix_ring':
        playSubKick(ctx, bus, 92, 28, 0.36, 0.26 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1500,
          rate: 0.88,
          dur: 0.32,
          vol: 0.32 * mix,
        });
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'lowpass',
          cutoffHz: 1900,
          rate: 0.92,
          dur: 0.26,
          vol: 0.26 * mix,
          delay: 0.05,
        });
        break;

      case 'saw_cyclone_wheel':
        for (let i = 0; i < 3; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.steel, {
            filterType: 'highpass',
            cutoffHz: 1100,
            rate: 1.05 + i * 0.08,
            dur: 0.12,
            vol: 0.24 * mix,
            delay: i * 0.06,
          });
          playSubKick(ctx, bus, 96, 42, 0.07, 0.13 * mix, i * 0.06);
        }
        break;

      case 'mortar_vortex_singularity':
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'lowpass',
          cutoffHz: 900,
          rate: 0.7,
          dur: 0.16,
          vol: 0.2 * mix,
        });
        playSubKick(ctx, bus, 92, 24, 0.42, 0.3 * mix, 0.1);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1100,
          rate: 0.78,
          dur: 0.36,
          vol: 0.34 * mix,
          delay: 0.1,
        });
        break;

      case 'missile_swarm_carpet':
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 1900,
          rate: 0.84,
          dur: 0.32,
          vol: 0.36 * mix,
        });
        playSubKick(ctx, bus, 88, 26, 0.26, 0.28 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1400,
          rate: 0.9,
          dur: 0.32,
          vol: 0.32 * mix,
          delay: 0.14,
        });
        break;

      case 'railgun_orbital_beam':
        playStableTone(ctx, bus, 1046.5, 0.045, 0.075 * mix, 'sine', 0, 0.002);
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 3800,
          rate: 1.08,
          dur: 0.26,
          vol: 0.36 * mix,
          delay: 0.045,
        });
        playSubKick(ctx, bus, 94, 28, 0.22, 0.28 * mix, 0.045);
        playBoltClick(ctx, bus, 5100, 0.1 * mix, 0.09);
        break;

      case 'tesla_chain_overcharge':
      case 'tempest_emp_storm':
        playElectricArc(ctx, bus, 0.26 * mix, 0.11, 0);
        playElectricArc(ctx, bus, 0.22 * mix, 0.09, 0.065);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 940,
          rate: 0.82,
          dur: 0.34,
          vol: 0.3 * mix,
          delay: 0.02,
        });
        playSubKick(ctx, bus, 90, 26, 0.36, 0.26 * mix, 0.02);
        break;

      case 'cryo_absolute_zero':
        playSubKick(ctx, bus, 96, 36, 0.2, 0.2 * mix);
        for (let i = 0; i < 3; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.ice, {
            filterType: 'highpass',
            cutoffHz: 1200 + i * 350,
            rate: 1.12 - i * 0.08,
            dur: 0.16,
            vol: 0.22 * mix,
            delay: i * 0.05,
          });
        }
        break;

      case 'beacon_solar_flare':
      case 'radar_target_lock':
        playBoltClick(ctx, bus, 3400, 0.1 * mix, 0);
        playStableTone(ctx, bus, 440, 0.2, 0.09 * mix, 'triangle', 0);
        playStableTone(ctx, bus, 554.37, 0.2, 0.09 * mix, 'triangle', 0.04);
        playStableTone(ctx, bus, 659.25, 0.25, 0.11 * mix, 'sine', 0.08);
        playSubKick(ctx, bus, 90, 44, 0.18, 0.15 * mix);
        break;

      case 'orbital_solar_judgment':
        for (let i = 0; i < 3; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
            filterType: 'lowpass',
            cutoffHz: 2800 - i * 300,
            rate: 0.9 - i * 0.04,
            dur: 0.3,
            vol: 0.3 * mix,
            delay: i * 0.09,
          });
          playSubKick(ctx, bus, 90, 24, 0.28, 0.24 * mix, i * 0.09);
        }
        break;

      case 'singularity_big_crunch':
        playSubKick(ctx, bus, 84, 22, 0.52, 0.34 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 780,
          rate: 0.68,
          dur: 0.45,
          vol: 0.34 * mix,
          delay: 0.06,
        });
        break;

      case 'mothership_fleet_scramble':
        for (let i = 0; i < 3; i++) {
          playBoltClick(ctx, bus, 3800, 0.12 * mix, i * 0.05);
          playStableTone(ctx, bus, 440 + i * 110, 0.14, 0.085 * mix, 'triangle', i * 0.05);
        }
        playSubKick(ctx, bus, 96, 40, 0.18, 0.2 * mix);
        break;

      case 'supernova_genesis_collapse':
        playStableTone(ctx, bus, 523.25, 0.24, 0.11 * mix, 'triangle', 0, 0.004);
        playStableTone(ctx, bus, 783.99, 0.28, 0.11 * mix, 'sine', 0.04, 0.004);
        playStableTone(ctx, bus, 1046.5, 0.34, 0.12 * mix, 'sine', 0.08, 0.005);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1850,
          rate: 0.85,
          dur: 0.42,
          vol: 0.36 * mix,
          delay: 0.03,
        });
        playSubKick(ctx, bus, 96, 22, 0.48, 0.34 * mix, 0.02);
        break;

      case 'chronos_time_collapse':
        playStableTone(ctx, bus, 987.77, 0.24, 0.11 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 739.99, 0.28, 0.11 * mix, 'triangle', 0.05, 0.004);
        playStableTone(ctx, bus, 493.88, 0.38, 0.12 * mix, 'sine', 0.1, 0.005);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1450,
          rate: 0.78,
          dur: 0.46,
          vol: 0.34 * mix,
          delay: 0.04,
        });
        playSubKick(ctx, bus, 90, 20, 0.54, 0.36 * mix, 0.02);
        break;

      case 'aegis_citadel_overcharge':
        playStableTone(ctx, bus, 392.0, 0.22, 0.1 * mix, 'triangle', 0, 0.004);
        playStableTone(ctx, bus, 587.33, 0.26, 0.105 * mix, 'sine', 0.04, 0.004);
        playStableTone(ctx, bus, 783.99, 0.34, 0.11 * mix, 'sine', 0.08, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: 2800,
          q: 1.0,
          rate: 0.96,
          dur: 0.22,
          vol: 0.3 * mix,
          delay: 0.02,
        });
        playSubKick(ctx, bus, 96, 24, 0.42, 0.32 * mix, 0.02);
        break;

      case 'void_cataclysm':
        playStableTone(ctx, bus, 659.25, 0.22, 0.1 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 987.77, 0.28, 0.1 * mix, 'triangle', 0.04, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1950,
          rate: 0.78,
          dur: 0.45,
          vol: 0.36 * mix,
          delay: 0.03,
        });
        playSubKick(ctx, bus, 96, 20, 0.52, 0.36 * mix, 0.02);
        break;

      case 'quantum_singularity_protocol':
        playBoltClick(ctx, bus, 3800, 0.1 * mix, 0);
        playStableTone(ctx, bus, 523.25, 0.2, 0.09 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 783.99, 0.24, 0.095 * mix, 'triangle', 0.05, 0.004);
        playStableTone(ctx, bus, 1174.66, 0.28, 0.1 * mix, 'sine', 0.1, 0.004);
        playSubKick(ctx, bus, 92, 40, 0.22, 0.18 * mix);
        break;

      case 'prism_nova_spectrum':
        playStableTone(ctx, bus, 659.25, 0.18, 0.09 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 987.77, 0.22, 0.095 * mix, 'triangle', 0.04, 0.004);
        playStableTone(ctx, bus, 1318.51, 0.26, 0.09 * mix, 'sine', 0.08, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.ice, {
          filterType: 'highpass',
          cutoffHz: 1500,
          rate: 1.1,
          dur: 0.18,
          vol: 0.24 * mix,
        });
        break;

      case 'hyperion_doomsday_salvo':
        for (let i = 0; i < 3; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
            filterType: 'lowpass',
            cutoffHz: 2400,
            rate: 0.84 - i * 0.04,
            dur: 0.3,
            vol: 0.34 * mix,
            delay: i * 0.08,
          });
          playSubKick(ctx, bus, 94, 22, 0.32, 0.3 * mix, i * 0.08);
        }
        break;

      case 'aurora_magnetic_collapse':
        playElectricArc(ctx, bus, 0.28 * mix, 0.14, 0);
        playElectricArc(ctx, bus, 0.24 * mix, 0.12, 0.07);
        playStableTone(ctx, bus, 587.33, 0.24, 0.1 * mix, 'sine', 0.02, 0.004);
        playSubKick(ctx, bus, 92, 26, 0.32, 0.24 * mix, 0.02);
        break;

      case 'aurelia_solar_judgement':
        playStableTone(ctx, bus, 587.33, 0.2, 0.1 * mix, 'triangle', 0, 0.004);
        playStableTone(ctx, bus, 880, 0.24, 0.1 * mix, 'sine', 0.04, 0.004);
        playStableTone(ctx, bus, 1174.66, 0.28, 0.11 * mix, 'sine', 0.08, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'bandpass',
          cutoffHz: 2900,
          q: 0.9,
          rate: 1.08,
          dur: 0.18,
          vol: 0.26 * mix,
        });
        break;

      case 'paradox_chrono_reap':
        for (let i = 0; i < 3; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.steel, {
            filterType: 'bandpass',
            cutoffHz: 2400 + i * 250,
            q: 1.1,
            rate: 1.05 + i * 0.07,
            dur: 0.14,
            vol: 0.26 * mix,
            delay: i * 0.06,
          });
        }
        playStableTone(ctx, bus, 739.99, 0.24, 0.1 * mix, 'sine', 0.02, 0.004);
        playSubKick(ctx, bus, 90, 24, 0.34, 0.26 * mix);
        break;

      case 'nebula_cosmic_collapse':
        playStableTone(ctx, bus, 440, 0.24, 0.1 * mix, 'sine', 0, 0.004);
        playStableTone(ctx, bus, 659.25, 0.28, 0.1 * mix, 'triangle', 0.04, 0.004);
        playStableTone(ctx, bus, 987.77, 0.34, 0.11 * mix, 'sine', 0.08, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1850,
          rate: 0.8,
          dur: 0.44,
          vol: 0.36 * mix,
          delay: 0.03,
        });
        playSubKick(ctx, bus, 96, 20, 0.5, 0.35 * mix, 0.02);
        break;

      case 'thunder_loom_heaven_judgement':
        playElectricArc(ctx, bus, 0.3 * mix, 0.14, 0);
        playElectricArc(ctx, bus, 0.28 * mix, 0.13, 0.055);
        playElectricArc(ctx, bus, 0.24 * mix, 0.12, 0.11);
        playStableTone(ctx, bus, 587.33, 0.24, 0.095 * mix, 'triangle', 0.02, 0.004);
        playStableTone(ctx, bus, 880, 0.28, 0.095 * mix, 'sine', 0.07, 0.004);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1750,
          rate: 0.84,
          dur: 0.38,
          vol: 0.32 * mix,
          delay: 0.04,
        });
        playSubKick(ctx, bus, 96, 22, 0.44, 0.34 * mix, 0.02);
        break;

      default:
        playPrismSfx(gunType, enabled, audioCtxRef);
        playSubKick(ctx, bus, 92, 34, 0.2, 0.2 * mix, 0.03);
        break;
    }
  } catch {
    // Ignore blocked audio context
  }
}
