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
  | 'wave'
  | 'overdrive'
  | 'hurt'
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

function buildFoleyBuffers(ctx: AudioContext): FoleyBuffers {
  const sr = ctx.sampleRate || 44100;

  // 1. Dry supersonic rifle / SMG crack (160ms) with subtle concrete slapback at 22ms
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

  // 2. Heavy shotgun / artillery cannon blast (340ms)
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
    const chest = Math.exp(-t / 0.055) * Math.sin(2 * Math.PI * (54 + 24 * Math.exp(-t / 0.025)) * t) * 0.62;
    const tail = t > 0.03 ? Math.exp(-(t - 0.03) / 0.095) * lpH1 * 0.28 : 0;
    hd[i] = crack + boom + chest + tail;
  }
  normalizeAndWindowBuffer(hd, sr, 0.001, 0.035);

  // 3. Deep concussive explosion (460ms)
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

  // 4. Pressurized propane / thermal flame whoosh (260ms)
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

  // 5. Brittle crystalline ice fracture (220ms) — discrete micro-cracks + cold air
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

  // 6. Cold steel katana / saw slice (150ms)
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

  // 7. Generic normalized pink & white textures for secondary layers
  const genLen = Math.floor(sr * 0.8);
  const pinkNoise = ctx.createBuffer(1, genLen, sr);
  const whiteNoise = ctx.createBuffer(1, genLen, sr);
  const pd = pinkNoise.getChannelData(0);
  const wd = whiteNoise.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < genLen; i++) {
    const w = Math.random() * 2 - 1;
    wd[i] = w;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    pd[i] = (b0 + b1 + b2 + w * 0.42) * 0.25;
  }
  normalizeAndWindowBuffer(pd, sr, 0.004, 0.02);
  normalizeAndWindowBuffer(wd, sr, 0.004, 0.02);

  return {
    rifleCrack,
    heavyCannon,
    explosion,
    flame,
    ice,
    steel,
    pinkNoise,
    whiteNoise,
  };
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
    buffers: buildFoleyBuffers(ctx),
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
  map01_cyber_smg: 78,
  map07_cyclone_rotary: 80,
  map05_dune_needler: 90,
  hunter: 95,
  shotgun: 115,
  sniper: 125,
  cannon: 135,
  mortar: 135,
  cluster: 130,
  railgun: 130,
  map03_forge_magma: 135,
  map08_titan_flak: 130,
  map10_meteor_rail: 130,
  map16_void_sovereign: 145,
  flamer: 150,
  cryo: 150,
  map11_cryo_shatter: 145,
  acid: 145,
  map09_venom_hydra: 145,
  prism_laser: 150,
  map02_matrix_spire: 145,
  map06_aurora_beam: 150,
  beacon: 220,
  amp_spire: 200,
  radar: 190,
  aegis_field: 210,
  tesla: 110,
  saw: 115,
  map04_void_katana: 105,
  map15_emerald_reaper: 115,
  plasma: 120,
  map14_omega_disruptor: 125,
  tempest: 125,
  sonic: 125,
  gravity_lance: 130,
  missile: 120,
  map12_hellfire_organ: 120,
  map13_shadow_hive: 115,
  explosion: 95,
  kill: 95,
  hurt: 160,
  overheat: 240,
};

function getSfxCategory(kind: PrismSfxKind): MixCategory {
  if (USER_GESTURE_UI_KINDS.has(kind)) return 'ui';
  if (kind === 'overheat') return 'skill';
  if (kind === 'kill' || kind === 'explosion' || kind === 'hurt') return 'hit';
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

      // ---- REALISTIC FIREARMS & BALLISTICS ----
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

      case 'map01_cyber_smg':
        // Tight crisp suppressed PDW / MP7 rapid pop
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'lowpass',
          cutoffHz: jitter(3400, 0.07),
          rate: jitter(1.16, 0.05),
          dur: 0.07,
          vol: 0.25 * mix,
        });
        playSubKick(ctx, bus, 102, 48, 0.036, 0.11 * mix);
        playBoltClick(ctx, bus, 5200, 0.075 * mix, 0.011);
        break;

      case 'map07_cyclone_rotary':
        // Deep 20mm rotary Vulcan autocannon bark
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'lowpass',
          cutoffHz: jitter(2800, 0.08),
          rate: jitter(0.84, 0.05),
          dur: 0.12,
          vol: 0.31 * mix,
        });
        playSubKick(ctx, bus, 88, 38, 0.055, 0.18 * mix);
        playBoltClick(ctx, bus, 3600, 0.085 * mix, 0.016);
        break;

      case 'hunter':
        // Tactical carbine snap
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'lowpass',
          cutoffHz: jitter(3100, 0.07),
          rate: jitter(1.08, 0.06),
          dur: 0.08,
          vol: 0.23 * mix,
        });
        playSubKick(ctx, bus, 94, 46, 0.04, 0.11 * mix);
        break;

      case 'map05_dune_needler':
        // High-pressure pneumatic flechette rifle crack
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'bandpass',
          cutoffHz: jitter(3600, 0.07),
          q: 0.7,
          rate: jitter(1.25, 0.05),
          dur: 0.07,
          vol: 0.24 * mix,
        });
        playSubKick(ctx, bus, 98, 50, 0.038, 0.1 * mix);
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

      case 'sniper':
        // Sharp .50 BMG supersonic crack + echoing tail + bolt action
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 5200,
          rate: jitter(1.18, 0.04),
          dur: 0.24,
          vol: 0.36 * mix,
        });
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'highpass',
          cutoffHz: 1100,
          rate: 1.05,
          dur: 0.08,
          vol: 0.24 * mix,
        });
        playSubKick(ctx, bus, 98, 36, 0.09, 0.24 * mix);
        playBoltClick(ctx, bus, 4800, 0.09 * mix, 0.055);
        break;

      case 'cannon':
        // Heavy 105mm siege artillery blast
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: jitter(1650, 0.08),
          rate: jitter(0.8, 0.05),
          dur: 0.32,
          vol: 0.4 * mix,
        });
        playSubKick(ctx, bus, 82, 26, 0.2, 0.3 * mix);
        break;

      case 'map08_titan_flak':
        // 88mm anti-air flak cannon punch
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: jitter(2200, 0.08),
          rate: jitter(0.88, 0.05),
          dur: 0.28,
          vol: 0.38 * mix,
        });
        playSubKick(ctx, bus, 88, 30, 0.16, 0.26 * mix);
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

      case 'cluster':
        // Grenade launcher "THUMP-CLANK"
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 1150,
          rate: 0.92,
          dur: 0.18,
          vol: 0.3 * mix,
        });
        playSubKick(ctx, bus, 96, 38, 0.12, 0.2 * mix);
        playBoltClick(ctx, bus, 3100, 0.09 * mix, 0.022);
        break;

      case 'railgun':
      case 'map10_meteor_rail':
        // Hypersonic magnetic railgun: capacitor crack + sonic boom (ZERO laser chirp!)
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

      // ---- THERMAL, ROCKET, ACID, CRYO, BLADE ----
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

      case 'missile':
      case 'map12_hellfire_organ':
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

      case 'map03_forge_magma':
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 980,
          rate: 0.78,
          dur: 0.25,
          vol: 0.34 * mix,
        });
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'lowpass',
          cutoffHz: 1800,
          rate: 0.92,
          dur: 0.18,
          vol: 0.18 * mix,
          delay: 0.02,
        });
        break;

      case 'cryo':
      case 'map11_cryo_shatter':
        playFoleyBuffer(ctx, bus, bus.buffers.ice, {
          filterType: 'highpass',
          cutoffHz: 1100,
          rate: jitter(1.0, 0.08),
          dur: 0.18,
          vol: 0.28 * mix,
        });
        playSubKick(ctx, bus, 88, 42, 0.07, 0.11 * mix);
        break;

      case 'acid':
      case 'map09_venom_hydra':
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'bandpass',
          cutoffHz: jitter(2100, 0.08),
          q: 0.9,
          rate: jitter(1.22, 0.06),
          dur: 0.16,
          vol: 0.24 * mix,
        });
        playSubKick(ctx, bus, 90, 44, 0.07, 0.11 * mix);
        break;

      case 'saw':
      case 'map15_emerald_reaper':
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

      case 'map04_void_katana':
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'highpass',
          cutoffHz: 1200,
          rate: jitter(1.12, 0.05),
          dur: 0.12,
          vol: 0.27 * mix,
        });
        playSubKick(ctx, bus, 98, 44, 0.05, 0.12 * mix);
        break;

      // ---- ELECTROMAGNETIC, PLASMA, SONIC, GRAVITY, LASER ----
      case 'tesla':
        playElectricArc(ctx, bus, 0.24 * mix, 0.095, 0);
        break;

      case 'plasma':
      case 'map14_omega_disruptor':
        // Grounded ion cannon punch + plasma crack
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 1850,
          rate: jitter(1.02, 0.06),
          dur: 0.18,
          vol: 0.28 * mix,
        });
        playSubKick(ctx, bus, 96, 36, 0.14, 0.22 * mix);
        break;

      case 'tempest':
        playElectricArc(ctx, bus, 0.2 * mix, 0.1, 0);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 950,
          rate: 1.0,
          dur: 0.2,
          vol: 0.22 * mix,
          delay: 0.012,
        });
        break;

      case 'sonic':
        // Seismic sub-bass shockwave thump + air slap
        playFoleyBuffer(ctx, bus, bus.buffers.heavyCannon, {
          filterType: 'lowpass',
          cutoffHz: 720,
          rate: 0.72,
          dur: 0.24,
          vol: 0.34 * mix,
        });
        playSubKick(ctx, bus, 92, 26, 0.22, 0.28 * mix);
        break;

      case 'gravity_lance':
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 680,
          rate: 0.75,
          dur: 0.24,
          vol: 0.28 * mix,
        });
        playSubKick(ctx, bus, 84, 26, 0.24, 0.26 * mix);
        break;

      case 'beacon':
        playStableTone(ctx, bus, 587.33, 0.13, 0.06 * mix, 'sine', 0, 0.006);
        playStableTone(ctx, bus, 880, 0.13, 0.05 * mix, 'triangle', 0.03, 0.006);
        break;

      case 'amp_spire':
        playBoltClick(ctx, bus, 2800, 0.06 * mix, 0);
        playStableTone(ctx, bus, 392, 0.14, 0.075 * mix, 'triangle', 0, 0.006);
        playStableTone(ctx, bus, 587.33, 0.15, 0.06 * mix, 'sine', 0.035, 0.006);
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

      case 'aegis_field':
        playSubKick(ctx, bus, 94, 38, 0.16, 0.2 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'lowpass',
          cutoffHz: 1850,
          rate: 0.92,
          dur: 0.12,
          vol: 0.18 * mix,
        });
        playStableTone(ctx, bus, 293.66, 0.16, 0.07 * mix, 'triangle', 0.015, 0.006);
        break;

      case 'prism_laser':
      case 'map02_matrix_spire':
      case 'map06_aurora_beam':
        // Focused optical beam hum + emitter click (NO chirp slide)
        playBoltClick(ctx, bus, 3400, 0.08 * mix, 0);
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'bandpass',
          cutoffHz: 1650,
          q: 0.9,
          rate: 1.25,
          dur: 0.11,
          vol: 0.17 * mix,
        });
        playSubKick(ctx, bus, 98, 62, 0.08, 0.1 * mix);
        break;

      case 'map13_shadow_hive':
        playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
          filterType: 'lowpass',
          cutoffHz: 2600,
          rate: jitter(1.18, 0.06),
          dur: 0.075,
          vol: 0.22 * mix,
        });
        playSubKick(ctx, bus, 94, 48, 0.05, 0.1 * mix);
        break;

      case 'map16_void_sovereign':
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 1450,
          rate: 0.82,
          dur: 0.3,
          vol: 0.36 * mix,
        });
        playSubKick(ctx, bus, 90, 26, 0.26, 0.28 * mix);
        playStableTone(ctx, bus, 146.83, 0.18, 0.07 * mix, 'triangle', 0.01, 0.01);
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
 * Distinct multi-stage Overheat Ultimate SFX matched 1-to-1 with ALL 36 `overheatSkill.key` values in `prismTdEngine.ts`.
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
      // 1. Rapid Autocannon / SMG / Rotary Fan Bursts
      case 'supersonic_fan':
      case 'cyber_smg_hyper_barrage':
      case 'cyclone_360_bullet_ring':
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

      // 2. Pyro / Dragon's Breath / Magma / Hellfire Inferno
      case 'thermal_buckshot_ring':
      case 'phoenix_cyclone':
      case 'forge_volcanic_eruption':
      case 'hellfire_organ_crescendo':
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

      // 3. Cryo / Glacial Avalanche Shatter
      case 'hex_frost_nova':
      case 'aurora_borealis_sweep':
      case 'cryo_shatter_nova':
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

      // 4. Thunderclap / Lightning Grid / EMP Blackout
      case 'sky_thunder_web':
      case 'electromagnetic_cyclone':
      case 'omega_emp_blackout':
        playElectricArc(ctx, bus, 0.26 * mix, 0.11, 0);
        playElectricArc(ctx, bus, 0.2 * mix, 0.09, 0.07);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 920,
          rate: 0.8,
          dur: 0.36,
          vol: 0.32 * mix,
          delay: 0.02,
        });
        playSubKick(ctx, bus, 90, 26, 0.38, 0.28 * mix, 0.02);
        break;

      // 5. Heavy Artillery / Carpet Bomb / Titan Flak / Meteor Orbital Strike
      case 'titan_artillery_salvo':
      case 'tactical_carpet_bomb':
      case 'titan_flak_skyburst':
      case 'meteor_orbital_rain':
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

      // 6. Railgun Hyperbeam / Sniper Execution / Plasma Supernova
      case 'quantum_hyperbeam':
      case 'crimson_execution':
      case 'plasma_supernova':
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

      // 7. Chemical Tank Rupture / Acid Rain / Hydra Pandemic
      case 'boiling_acid_rain':
      case 'hydra_toxic_deluge':
        playSubKick(ctx, bus, 92, 34, 0.2, 0.2 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.flame, {
          filterType: 'bandpass',
          cutoffHz: 1950,
          q: 0.95,
          rate: 1.12,
          dur: 0.26,
          vol: 0.28 * mix,
        });
        playFoleyBuffer(ctx, bus, bus.buffers.ice, {
          filterType: 'highpass',
          cutoffHz: 2200,
          rate: 0.9,
          dur: 0.18,
          vol: 0.16 * mix,
          delay: 0.04,
        });
        break;

      // 8. Triple Steel Slashes / Sawstorm / Void Katana / Emerald Reaper
      case 'ricochet_sawstorm':
      case 'void_crescent_tempest':
      case 'emerald_reaper_maelstrom':
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

      // 9. Tactical Sync / Prism Nova / Matrix Code Overload / Team Support Ultimates
      case 'solar_flare_pulse':
      case 'rainbow_refraction':
      case 'matrix_code_overload':
      case 'supply_drop_surge':
      case 'orbital_target_lock':
        playBoltClick(ctx, bus, 3400, 0.1 * mix, 0);
        playStableTone(ctx, bus, 440, 0.2, 0.09 * mix, 'triangle', 0);
        playStableTone(ctx, bus, 554.37, 0.2, 0.09 * mix, 'triangle', 0.04);
        playStableTone(ctx, bus, 659.25, 0.25, 0.11 * mix, 'sine', 0.08);
        playSubKick(ctx, bus, 90, 44, 0.18, 0.15 * mix);
        break;

      case 'aegis_fortress_pulse':
        playSubKick(ctx, bus, 94, 28, 0.34, 0.28 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.steel, {
          filterType: 'lowpass',
          cutoffHz: 2100,
          rate: 0.85,
          dur: 0.22,
          vol: 0.26 * mix,
        });
        playStableTone(ctx, bus, 329.63, 0.26, 0.1 * mix, 'triangle', 0.03, 0.008);
        break;

      // 10. Sonic Mega Resonance
      case 'sonic_resonance_nova':
        playSubKick(ctx, bus, 94, 24, 0.42, 0.3 * mix);
        playFoleyBuffer(ctx, bus, bus.buffers.explosion, {
          filterType: 'lowpass',
          cutoffHz: 680,
          rate: 0.72,
          dur: 0.34,
          vol: 0.34 * mix,
        });
        break;

      // 11. Singularity / Void Sovereign Eclipse
      case 'reverse_singularity':
      case 'gravity_singularity_lance':
      case 'sovereign_void_eclipse':
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

      // 12. Swarm Micro-Missiles / Drones / Dune Crystal Storm
      case 'swarm_barrage':
      case 'interceptor_drone_pack':
      case 'dune_crystal_storm':
      case 'shadow_hive_swarm':
        for (let i = 0; i < 4; i++) {
          playFoleyBuffer(ctx, bus, bus.buffers.rifleCrack, {
            filterType: 'bandpass',
            cutoffHz: 2600 + i * 240,
            q: 0.75,
            rate: 1.15 + i * 0.05,
            dur: 0.075,
            vol: 0.2 * mix,
            delay: i * 0.045,
          });
          playSubKick(ctx, bus, 92, 46, 0.05, 0.11 * mix, i * 0.045);
        }
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
