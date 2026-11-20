import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import {
  FastForward,
  Flame,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  applyDamageToEnemy,
  BIOME_PALETTES,
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createEnemyForWave,
  DIR_VECTORS,
  FlameConeFx,
  FloatingCombatText,
  getOpticSellRefund,
  getOpticUpgradeCost,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  LaserSegment,
  LightningArc,
  OPTIC_CATALOG,
  OpticType,
  PlacedOptic,
  PRISM_MAPS,
  PrismMapDef,
  ProjectileItem,
  RailBeamFx,
  ShockwaveRing,
  stepEnemiesWithLasers,
  TdEnemy,
  TILE_SIZE,
  traceLaserNetwork,
  WaveSpawnItem,
} from '../utils/prismTdEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface PrismTdGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface MuzzleFlashFx {
  x: number;
  y: number;
  angle: number;
  radius: number;
  alpha: number;
  color: string;
}

interface HudSnapshot {
  energy: number;
  coreHp: number;
  maxCoreHp: number;
  wave: number;
  totalWaves: number;
  score: number;
  bestScore: number;
  kills: number;
  totalDamage: number;
  totalDps: number;
  waveActive: boolean;
  nextWaveCountdown: number;
  overdrivePct: number;
  overdriveActive: boolean;
  speedMult: 1 | 2;
  outcome: 'victory' | 'defeat' | null;
}

const SAVE_BEST_KEY = 'thuanle-prism-td-best-v1';
const PARTICLE_POOL_SIZE = 240;

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(SAVE_BEST_KEY);
    const num = raw ? Number(raw) : 0;
    return Number.isFinite(num) && num > 0 ? num : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_BEST_KEY, String(score));
  } catch {
    // Ignore storage error
  }
}

function createInitialOptics(map: PrismMapDef): PlacedOptic[] {
  return map.starterOptics.map((s, idx) => ({
    id: `starter-${map.id}-${idx}`,
    col: s.col,
    row: s.row,
    type: s.type,
    rot: s.rot,
    level: 1,
    chargeTimer: 0,
    hitCount: 0,
    aimAngle: 0,
    recoil: 0,
  }));
}

function playSynthFx(
  kind:
    | 'place'
    | 'rotate'
    | 'upgrade'
    | 'sell'
    | 'gatling'
    | 'tesla'
    | 'missile'
    | 'railgun'
    | 'flamer'
    | 'cryo'
    | 'mortar'
    | 'explosion'
    | 'kill'
    | 'wave'
    | 'overdrive'
    | 'hurt'
    | 'victory'
    | 'defeat',
  enabled: boolean,
  audioCtxRef: { current: AudioContext | null }
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    const tone = (
      f1: number,
      f2: number,
      dur: number,
      vol: number,
      type: OscillatorType = 'sine',
      delay = 0
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f1, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(36, f2), now + delay + dur);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    if (kind === 'place') {
      tone(380, 660, 0.09, 0.12, 'triangle');
    } else if (kind === 'rotate') {
      tone(520, 740, 0.05, 0.09, 'sine');
    } else if (kind === 'upgrade') {
      tone(440, 880, 0.13, 0.14, 'triangle', 0);
      tone(660, 1180, 0.14, 0.12, 'sine', 0.05);
    } else if (kind === 'sell') {
      tone(480, 260, 0.1, 0.11, 'triangle');
    } else if (kind === 'gatling') {
      tone(680 + Math.random() * 140, 220, 0.045, 0.045, 'square');
    } else if (kind === 'tesla') {
      tone(1100, 340, 0.09, 0.075, 'sawtooth');
    } else if (kind === 'missile') {
      tone(320, 640, 0.12, 0.08, 'triangle');
    } else if (kind === 'railgun') {
      tone(1250, 90, 0.22, 0.15, 'sawtooth', 0);
      tone(420, 140, 0.18, 0.11, 'square', 0.02);
    } else if (kind === 'flamer') {
      tone(240, 110, 0.12, 0.06, 'sawtooth');
    } else if (kind === 'cryo') {
      tone(980, 520, 0.16, 0.08, 'sine');
    } else if (kind === 'mortar') {
      tone(220, 75, 0.24, 0.13, 'triangle');
    } else if (kind === 'explosion') {
      tone(150, 42, 0.2, 0.14, 'sawtooth');
    } else if (kind === 'kill') {
      const jitter = 0.94 + Math.random() * 0.12;
      tone(540 * jitter, 180 * jitter, 0.09, 0.09, 'triangle');
    } else if (kind === 'wave') {
      tone(330, 540, 0.14, 0.14, 'triangle', 0);
      tone(540, 810, 0.18, 0.14, 'sine', 0.09);
    } else if (kind === 'overdrive') {
      tone(240, 960, 0.3, 0.2, 'sawtooth', 0);
      tone(480, 1280, 0.28, 0.15, 'triangle', 0.08);
    } else if (kind === 'hurt') {
      tone(190, 80, 0.2, 0.18, 'sawtooth');
    } else if (kind === 'victory') {
      tone(523.25, 523.25, 0.12, 0.15, 'triangle', 0);
      tone(659.25, 659.25, 0.12, 0.15, 'triangle', 0.12);
      tone(783.99, 1046.5, 0.28, 0.18, 'triangle', 0.24);
    } else if (kind === 'defeat') {
      tone(280, 140, 0.25, 0.18, 'sawtooth', 0);
      tone(180, 75, 0.35, 0.2, 'sawtooth', 0.18);
    }
  } catch {
    // Ignore blocked audio context
  }
}

export function PrismTdGameSection({ theme }: PrismTdGameSectionProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const activeMap = PRISM_MAPS[selectedMapIndex] ?? PRISM_MAPS[0];

  const [selectedTool, setSelectedTool] = useState<OpticType>('gatling');
  const [selectedOpticId, setSelectedOpticId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<string>('');

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    energy: activeMap.startEnergy,
    coreHp: activeMap.startCoreHp,
    maxCoreHp: activeMap.startCoreHp,
    wave: 0,
    totalWaves: activeMap.totalWaves,
    score: 0,
    bestScore: loadBestScore(),
    kills: 0,
    totalDamage: 0,
    totalDps: 0,
    waveActive: false,
    overdrivePct: 0,
    overdriveActive: false,
    speedMult: 1,
    nextWaveCountdown: 10,
    outcome: null,
  }));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const simRef = useRef<{
    map: PrismMapDef;
    optics: PlacedOptic[];
    segments: LaserSegment[];
    energizedGunIds: string[];
    totalDps: number;
    enemies: TdEnemy[];
    projectiles: ProjectileItem[];
    lightningArcs: LightningArc[];
    railBeams: RailBeamFx[];
    flameCones: FlameConeFx[];
    healBeams: { fromX: number; fromY: number; toX: number; toY: number; alpha: number }[];
    muzzleFlashes: MuzzleFlashFx[];
    floatingTexts: FloatingCombatText[];
    spawnQueue: WaveSpawnItem[];
    waveElapsed: number;
    nextWaveTimer: number;
    nextEnemyId: number;
    nextProjId: number;
    energy: number;
    coreHp: number;
    wave: number;
    waveActive: boolean;
    score: number;
    bestScore: number;
    kills: number;
    totalDamage: number;
    overdriveCharge: number;
    overdriveTimer: number;
    speedMult: 1 | 2;
    shakeTrauma: number;
    hoverTile: { col: number; row: number } | null;
    selectedOpticId: string | null;
    selectedTool: OpticType;
    shockwaves: ShockwaveRing[];
    particles: PooledParticle[];
    particleCursor: number;
    animTime: number;
    outcome: 'victory' | 'defeat' | null;
  }>({
    map: activeMap,
    optics: createInitialOptics(activeMap),
    segments: [],
    energizedGunIds: [],
    totalDps: 0,
    enemies: [],
    projectiles: [],
    lightningArcs: [],
    railBeams: [],
    flameCones: [],
    healBeams: [],
    muzzleFlashes: [],
    floatingTexts: [],
    spawnQueue: [],
    waveElapsed: 0,
    nextWaveTimer: 10,
    nextEnemyId: 1,
    nextProjId: 1,
    energy: activeMap.startEnergy,
    coreHp: activeMap.startCoreHp,
    wave: 0,
    waveActive: false,
    score: 0,
    bestScore: loadBestScore(),
    kills: 0,
    totalDamage: 0,
    overdriveCharge: 40,
    overdriveTimer: 0,
    speedMult: 1,
    shakeTrauma: 0,
    hoverTile: null,
    selectedOpticId: null,
    selectedTool: 'gatling',
    shockwaves: [],
    particles: Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 2,
      color: '#00E5FF',
    })),
    particleCursor: 0,
    animTime: 0,
    outcome: null,
  });

  useEffect(() => {
    simRef.current.selectedTool = selectedTool;
  }, [selectedTool]);

  const recomputeLasers = useCallback(() => {
    const s = simRef.current;
    const res = traceLaserNetwork(s.map, s.optics, s.overdriveTimer > 0);
    s.segments = res.segments;
    s.energizedGunIds = res.energizedGunIds;
    s.totalDps = res.totalNetworkDps;
    for (const op of s.optics) {
      op.hitCount = res.hitCountsByOpticId[op.id] ?? 0;
    }
  }, []);

  const syncHudFromSim = useCallback(() => {
    const s = simRef.current;
    setHud({
      energy: Math.round(s.energy),
      coreHp: Math.max(0, Math.round(s.coreHp)),
      maxCoreHp: s.map.startCoreHp,
      wave: s.wave,
      totalWaves: s.map.totalWaves,
      score: Math.round(s.score),
      bestScore: Math.round(s.bestScore),
      kills: s.kills,
      totalDamage: Math.round(s.totalDamage),
      totalDps: Math.round(s.totalDps),
      waveActive: s.waveActive,
      nextWaveCountdown: Math.max(0, Math.ceil(s.nextWaveTimer)),
      overdrivePct: Math.min(100, Math.round(s.overdriveCharge)),
      overdriveActive: s.overdriveTimer > 0,
      speedMult: s.speedMult,
      outcome: s.outcome,
    });
  }, []);

  const emitParticles = useCallback(
    (x: number, y: number, color: string, count: number, speed = 110, sizeScale = 1) => {
      const s = simRef.current;
      for (let i = 0; i < count; i++) {
        const slot = s.particles[s.particleCursor];
        s.particleCursor = (s.particleCursor + 1) % PARTICLE_POOL_SIZE;
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.85);
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.vx = Math.cos(angle) * mag;
        slot.vy = Math.sin(angle) * mag;
        slot.life = 0.25 + Math.random() * 0.28;
        slot.maxLife = slot.life;
        slot.size = (1.6 + Math.random() * 2.4) * sizeScale;
        slot.color = color;
      }
    },
    []
  );

  const pushCombatText = useCallback(
    (x: number, y: number, text: string, color: string, scale = 1) => {
      const s = simRef.current;
      if (s.floatingTexts.length > 26) s.floatingTexts.shift();
      s.floatingTexts.push({
        x: x + (Math.random() * 14 - 7),
        y: y - 10,
        vy: -32,
        text,
        color,
        alpha: 1,
        scale,
      });
    },
    []
  );

  const startNewRun = useCallback(
    (mapIdx = selectedMapIndex) => {
      const targetMap = PRISM_MAPS[mapIdx] ?? PRISM_MAPS[0];
      const s = simRef.current;
      s.map = targetMap;
      s.optics = createInitialOptics(targetMap);
      s.enemies = [];
      s.projectiles = [];
      s.lightningArcs = [];
      s.railBeams = [];
      s.flameCones = [];
      s.healBeams = [];
      s.muzzleFlashes = [];
      s.floatingTexts = [];
      s.spawnQueue = [];
      s.waveElapsed = 0;
      s.nextWaveTimer = 10;
      s.nextEnemyId = 1;
      s.nextProjId = 1;
      s.energy = targetMap.startEnergy;
      s.coreHp = targetMap.startCoreHp;
      s.wave = 0;
      s.waveActive = false;
      s.score = 0;
      s.kills = 0;
      s.totalDamage = 0;
      s.overdriveCharge = 45;
      s.overdriveTimer = 0;
      s.speedMult = 1;
      s.shakeTrauma = 0;
      s.hoverTile = null;
      s.selectedOpticId = s.optics[0]?.id ?? null;
      s.shockwaves = [];
      s.outcome = null;
      for (const p of s.particles) p.active = false;

      setSelectedMapIndex(mapIdx);
      setSelectedOpticId(s.selectedOpticId);
      setStatusNotice('Tự động gọi Đợt 1 sau 10s! Đặt Súng [4-0] hoặc bấm Gọi Ngay (+5⚡).');
      recomputeLasers();
      syncHudFromSim();
      setGameState('playing');
      playSynthFx('wave', soundEnabled, audioCtxRef);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [selectedMapIndex, recomputeLasers, syncHudFromSim, soundEnabled]
  );

  useEffect(() => {
    document.body.dataset.state = gameState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [gameState]);

  useEffect(() => {
    recomputeLasers();
    syncHudFromSim();
  }, [recomputeLasers, syncHudFromSim]);

  const launchNextWave = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.waveActive || s.outcome) return;
    if (s.wave >= s.map.totalWaves) return;

    const earlyBonus = s.nextWaveTimer > 0.5 ? (s.wave > 0 ? 10 : 5) : 0;
    s.energy += earlyBonus;
    const nextWave = s.wave + 1;
    s.wave = nextWave;
    s.waveActive = true;
    s.waveElapsed = 0;
    s.nextWaveTimer = 0;
    s.spawnQueue = buildWaveSpawns(nextWave);
    setStatusNotice(
      earlyBonus > 0
        ? `Gọi sớm Đợt ${nextWave}/${s.map.totalWaves} (+${earlyBonus}⚡)! Nâng cấp súng để bùng nổ kỹ năng!`
        : `Đợt ${nextWave}/${s.map.totalWaves} tiến công! Đặt thêm súng hoặc dẫn tia tăng áp!`
    );
    playSynthFx('wave', soundEnabled, audioCtxRef);
    syncHudFromSim();
  }, [gameState, soundEnabled, syncHudFromSim]);

  const activateOverdrive = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.overdriveCharge < 100 || s.overdriveTimer > 0) return;
    s.overdriveCharge = 0;
    s.overdriveTimer = 5.0;
    s.shakeTrauma = 0.65;
    // Also trigger dramatic shockwave blast from all emitters & damage nearby enemies
    for (const em of s.map.emitters) {
      const pt = gridToWorldCenter(em.col, em.row);
      s.shockwaves.push({
        x: pt.x,
        y: pt.y,
        radius: 16,
        maxRadius: 220,
        alpha: 0.95,
        color: '#FB7185',
        lineWidth: 4,
      });
      emitParticles(pt.x, pt.y, '#FB7185', 22, 170, 1.3);
    }
    for (const en of s.enemies) {
      if (en.hp <= 0 || en.koTimer > 0) continue;
      const killed = applyDamageToEnemy(en, 65);
      en.slowTimer = Math.max(en.slowTimer, 2.5);
      if (killed) {
        s.kills += 1;
        s.energy += en.reward;
        s.score += en.scoreValue;
        emitParticles(en.x, en.y, '#FBBF24', 18, 150, 1.2);
      }
    }
    recomputeLasers();
    syncHudFromSim();
    setStatusNotice('SIÊU QUÁ TẢI ×2.2 ĐÃ KÍCH HOẠT (5s)! Toàn bộ súng & tia laser bùng nổ!');
    playSynthFx('overdrive', soundEnabled, audioCtxRef);
  }, [gameState, recomputeLasers, syncHudFromSim, soundEnabled, emitParticles]);

  const rotateOpticById = useCallback(
    (opticId: string | null, delta: 1 | -1) => {
      if (!opticId || gameState !== 'playing') return;
      const s = simRef.current;
      const target = s.optics.find((o) => o.id === opticId);
      if (!target) return;
      if (target.type !== 'mirror' && target.type !== 'prism') {
        setStatusNotice('Khẩu súng này tự động xoay nòng 360° khóa mục tiêu!');
        return;
      }
      target.rot = (((target.rot + delta) % 8) + 8) % 8;
      recomputeLasers();
      syncHudFromSim();
      const pt = gridToWorldCenter(target.col, target.row);
      emitParticles(pt.x, pt.y, '#00E5FF', 7, 75);
      playSynthFx('rotate', soundEnabled, audioCtxRef);
    },
    [gameState, recomputeLasers, syncHudFromSim, emitParticles, soundEnabled]
  );

  const upgradeSelectedOptic = useCallback(() => {
    if (!selectedOpticId || gameState !== 'playing') return;
    const s = simRef.current;
    const target = s.optics.find((o) => o.id === selectedOpticId);
    if (!target) return;
    const cost = getOpticUpgradeCost(target.type, target.level);
    if (cost === null) {
      setStatusNotice('Vũ khí / thiết bị đã đạt Cấp Tối Đa (Lv3)!');
      return;
    }
    if (s.energy < cost) {
      setStatusNotice(`Cần thêm ${cost - Math.round(s.energy)}⚡ để nâng cấp!`);
      return;
    }
    s.energy -= cost;
    target.level = (target.level + 1) as 2 | 3;
    recomputeLasers();
    syncHudFromSim();
    const pt = gridToWorldCenter(target.col, target.row);
    s.shockwaves.push({
      x: pt.x,
      y: pt.y,
      radius: 10,
      maxRadius: 68,
      alpha: 0.9,
      color: '#FBBF24',
      lineWidth: 3,
    });
    emitParticles(pt.x, pt.y, '#FBBF24', 18, 125, 1.2);
    playSynthFx('upgrade', soundEnabled, audioCtxRef);
    const skillUnlockHint =
      target.level === 2
        ? 'Mở rộng hình dáng + Tăng tốc độ & hỏa lực Lv2!'
        : 'Đạt Hình Thái Tối Thượng Lv3 + Siêu Kỹ Năng Đặc Biệt!';
    setStatusNotice(`Đã nâng cấp lên Cấp ${target.level}! ${skillUnlockHint}`);
  }, [selectedOpticId, gameState, recomputeLasers, syncHudFromSim, emitParticles, soundEnabled]);

  const sellSelectedOptic = useCallback(() => {
    if (!selectedOpticId || gameState !== 'playing') return;
    const s = simRef.current;
    const idx = s.optics.findIndex((o) => o.id === selectedOpticId);
    if (idx === -1) return;
    const target = s.optics[idx];
    const refund = getOpticSellRefund(target);
    s.optics.splice(idx, 1);
    s.energy += refund;
    s.selectedOpticId = null;
    setSelectedOpticId(null);
    recomputeLasers();
    syncHudFromSim();
    const pt = gridToWorldCenter(target.col, target.row);
    emitParticles(pt.x, pt.y, '#94A3B8', 10, 80);
    playSynthFx('sell', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã thu hồi vũ khí (+${refund}⚡).`);
  }, [selectedOpticId, gameState, recomputeLasers, syncHudFromSim, emitParticles, soundEnabled]);

  const screenToGrid = useCallback((clientX: number, clientY: number): { col: number; row: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }, []);

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    simRef.current.hoverTile = screenToGrid(e.clientX, e.clientY);
  };

  const handleCanvasPointerLeave = () => {
    simRef.current.hoverTile = null;
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile) return;

    const s = simRef.current;
    const existing = s.optics.find((o) => o.col === tile.col && o.row === tile.row);

    if (existing) {
      s.selectedOpticId = existing.id;
      setSelectedOpticId(existing.id);
      if (existing.type === 'mirror' || existing.type === 'prism') {
        rotateOpticById(existing.id, 1);
      } else {
        playSynthFx('rotate', soundEnabled, audioCtxRef);
      }
      return;
    }

    const tileKind = getTileKind(s.map, tile.col, tile.row);
    if (tileKind !== 'empty') {
      setStatusNotice('Không thể đặt lên đường đi quái, nguồn phát hoặc vách đá!');
      return;
    }

    const spec = OPTIC_CATALOG.find((c) => c.type === selectedTool)!;
    if (s.energy < spec.cost) {
      setStatusNotice(`Không đủ Năng Lượng! Cần ${spec.cost}⚡ cho ${spec.name}.`);
      return;
    }

    const defaultRot = selectedTool === 'mirror' ? 6 : 0;
    const created: PlacedOptic = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      col: tile.col,
      row: tile.row,
      type: selectedTool,
      rot: defaultRot,
      level: 1,
      chargeTimer: 0,
      hitCount: 0,
      aimAngle: -Math.PI / 2,
      recoil: 0,
    };

    s.energy -= spec.cost;
    s.optics.push(created);
    s.selectedOpticId = created.id;
    setSelectedOpticId(created.id);
    recomputeLasers();
    syncHudFromSim();

    const pt = gridToWorldCenter(tile.col, tile.row);
    s.shockwaves.push({
      x: pt.x,
      y: pt.y,
      radius: 8,
      maxRadius: 48,
      alpha: 0.75,
      color: spec.category === 'gun' ? '#FBBF24' : '#00E5FF',
      lineWidth: 2,
    });
    emitParticles(pt.x, pt.y, spec.category === 'gun' ? '#FBBF24' : '#38BDF8', 12, 95);
    playSynthFx('place', soundEnabled, audioCtxRef);
    setStatusNotice(
      spec.category === 'gun'
        ? `Đã triển khai ${spec.name}! Chiếu tia laser qua trụ để tăng +35% tốc bắn!`
        : `Đã lắp ${spec.name}! Nhấp lại để xoay góc tia.`
    );
  };

  const handleCanvasContextMenu = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile) return;
    const existing = simRef.current.optics.find((o) => o.col === tile.col && o.row === tile.row);
    if (existing) {
      simRef.current.selectedOpticId = existing.id;
      setSelectedOpticId(existing.id);
      rotateOpticById(existing.id, 1);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
        return;
      }

      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewRun(selectedMapIndex);
        }
        return;
      }

      if (gameState === 'playing' || gameState === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
          return;
        }
      }

      if (gameState !== 'playing') return;

      if (e.key === '1') setSelectedTool('mirror');
      else if (e.key === '2') setSelectedTool('prism');
      else if (e.key === '3') setSelectedTool('amp');
      else if (e.key === '4') setSelectedTool('gatling');
      else if (e.key === '5') setSelectedTool('tesla');
      else if (e.key === '6') setSelectedTool('missile');
      else if (e.key === '7') setSelectedTool('railgun');
      else if (e.key === '8') setSelectedTool('flamer');
      else if (e.key === '9') setSelectedTool('cryo');
      else if (e.key === '0') setSelectedTool('mortar');
      else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        rotateOpticById(simRef.current.selectedOpticId, -1);
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        rotateOpticById(simRef.current.selectedOpticId, 1);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        upgradeSelectedOptic();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        sellSelectedOptic();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (simRef.current.overdriveCharge >= 100 && simRef.current.overdriveTimer <= 0) {
          activateOverdrive();
        } else if (!simRef.current.waveActive) {
          launchNextWave();
        }
      } else if (e.key === 'Enter' && !simRef.current.waveActive) {
        e.preventDefault();
        launchNextWave();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    selectedMapIndex,
    startNewRun,
    rotateOpticById,
    upgradeSelectedOptic,
    sellSelectedOptic,
    activateOverdrive,
    launchNextWave,
  ]);

  // Title Screen animated laser + turret showcase
  useEffect(() => {
    if (gameState !== 'title') return;
    let rafId = 0;
    let lastTs = performance.now();
    let t = 0;

    const renderTitlePreview = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      t += dt;

      const canvas = titleCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = 420;
          const h = 250;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          ctx.fillStyle = '#060A15';
          ctx.fillRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
          ctx.lineWidth = 1;
          for (let gx = 24; gx < w; gx += 32) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
          }
          for (let gy = 24; gy < h; gy += 32) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
          }

          const em = { x: 46, y: 125 };
          const mir = { x: 160, y: 125 };
          const amp = { x: 160, y: 58 };
          const prism = { x: 278, y: 58 };
          const sway = Math.sin(t * 1.4) * 14;

          const drawBeam = (
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            glow: string,
            core: string,
            width: number
          ) => {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.strokeStyle = glow;
            ctx.lineWidth = width * 3.2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.strokeStyle = core;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            const p = (t * 0.95) % 1;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, width * 0.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          };

          drawBeam(em.x, em.y, mir.x, mir.y, 'rgba(0, 229, 255, 0.28)', '#00E5FF', 3.5);
          drawBeam(mir.x, mir.y, amp.x, amp.y, 'rgba(0, 229, 255, 0.28)', '#00E5FF', 3.5);
          drawBeam(amp.x, amp.y, prism.x, prism.y, 'rgba(251, 191, 36, 0.3)', '#FBBF24', 5);
          drawBeam(prism.x, prism.y, 404, 34 + sway * 0.4, 'rgba(251, 113, 133, 0.28)', '#FB7185', 3.4);
          drawBeam(prism.x, prism.y, 404, 108 + sway * 0.6, 'rgba(251, 191, 36, 0.28)', '#FBBF24', 3.4);
          drawBeam(prism.x, prism.y, 378, 220 + sway * 0.5, 'rgba(56, 189, 248, 0.28)', '#38BDF8', 3.4);

          // Sample firing turret + chain lightning preview on bottom-right!
          const turret = { x: 245, y: 185 };
          const targetShip = { x: 356, y: 185 + Math.sin(t * 2.2) * 14 };
          // Lightning arc from turret to ship
          ctx.save();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(turret.x, turret.y);
          ctx.lineTo(285, 178 + Math.sin(t * 18) * 6);
          ctx.lineTo(320, 192 + Math.cos(t * 21) * 6);
          ctx.lineTo(targetShip.x, targetShip.y);
          ctx.stroke();
          ctx.restore();

          // Emitter
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(em.x, em.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Mirror
          ctx.save();
          ctx.translate(mir.x, mir.y);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(-16, -3.5, 32, 7);
          ctx.fillStyle = '#00E5FF';
          ctx.fillRect(-16, -3.5, 32, 2.5);
          ctx.restore();

          // Amp
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(amp.x, amp.y, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Prism
          ctx.fillStyle = 'rgba(167, 139, 250, 0.4)';
          ctx.strokeStyle = '#C4B5FD';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(prism.x, prism.y - 15);
          ctx.lineTo(prism.x + 14, prism.y + 11);
          ctx.lineTo(prism.x - 14, prism.y + 11);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Tesla Turret
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(turret.x, turret.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(turret.x, turret.y, 5, 0, Math.PI * 2);
          ctx.fill();

          // Enemy Interceptor Ship
          ctx.save();
          ctx.translate(targetShip.x, targetShip.y);
          ctx.fillStyle = '#FB7185';
          ctx.strokeStyle = '#FFE4E6';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-14, 0);
          ctx.lineTo(10, -10);
          ctx.lineTo(4, 0);
          ctx.lineTo(10, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      rafId = window.requestAnimationFrame(renderTitlePreview);
    };

    rafId = window.requestAnimationFrame(renderTitlePreview);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState]);

  // Main 60Hz Canvas Simulation & Renderer
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'paused') return;
    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAccum = 0;

    const recordKill = (en: TdEnemy) => {
      const s = simRef.current;
      s.kills += 1;
      s.energy += en.reward;
      s.score += en.scoreValue;
      const blastColor =
        en.kind === 'boss'
          ? '#FB7185'
          : en.kind === 'armored' || en.kind === 'shieldbearer'
            ? '#FBBF24'
            : en.kind === 'healer'
              ? '#4ADE80'
              : en.kind === 'teleporter'
                ? '#C084FC'
                : en.kind === 'stealth'
                  ? '#34D399'
                  : '#38BDF8';
      emitParticles(
        en.x,
        en.y,
        blastColor,
        en.kind === 'boss' ? 42 : 18,
        en.kind === 'boss' ? 200 : 140,
        en.kind === 'boss' ? 1.5 : 1.05
      );
      s.shockwaves.push({
        x: en.x,
        y: en.y,
        radius: 6,
        maxRadius: en.kind === 'boss' ? 96 : 44,
        alpha: 0.88,
        color: blastColor,
        lineWidth: en.kind === 'boss' ? 4.5 : 2.5,
      });
      if (en.kind === 'boss') {
        s.shockwaves.push({
          x: en.x,
          y: en.y,
          radius: 14,
          maxRadius: 138,
          alpha: 0.72,
          color: '#FBBF24',
          lineWidth: 3,
        });
      }
      // Splitter splits into 2 fast mini cyber-drones on death!
      if (en.kind === 'splitter' && en.radius >= 14) {
        for (const offset of [-10, 10]) {
          s.enemies.push({
            ...en,
            id: s.nextEnemyId++,
            x: en.x + Math.cos(en.heading + Math.PI / 2) * offset,
            y: en.y + Math.sin(en.heading + Math.PI / 2) * offset,
            hp: Math.max(22, Math.round(en.maxHp * 0.36)),
            maxHp: Math.max(22, Math.round(en.maxHp * 0.36)),
            shield: 0,
            maxShield: 0,
            speed: en.speed * 1.24,
            radius: 9,
            reward: 5,
            scoreValue: 14,
            koTimer: 0,
            hitFlash: 0.12,
            burnTimer: 0,
            slowTimer: 0,
          });
        }
        emitParticles(en.x, en.y, '#E879F9', 14, 110, 0.9);
      }
      pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', en.kind === 'boss' ? 1.3 : 1);
      if (en.kind === 'boss') {
        s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.65);
        playSynthFx('explosion', soundEnabled, audioCtxRef);
      } else {
        playSynthFx('kill', soundEnabled, audioCtxRef);
      }
    };

    const tickAndDraw = (now: number) => {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);
      const s = simRef.current;

      if (gameState === 'playing') {
        const simDt = dt * s.speedMult;
        s.animTime += simDt;

        if (s.overdriveTimer > 0) {
          s.overdriveTimer = Math.max(0, s.overdriveTimer - simDt);
          if (s.overdriveTimer === 0) {
            recomputeLasers();
            syncHudFromSim();
          }
        }

        if (s.shakeTrauma > 0) {
          s.shakeTrauma = Math.max(0, s.shakeTrauma - dt * 1.6);
        }

        // 0. 10-second Auto-Wave Countdown between waves
        if (!s.waveActive && !s.outcome && s.wave < s.map.totalWaves) {
          s.nextWaveTimer = Math.max(0, s.nextWaveTimer - dt);
          if (s.nextWaveTimer <= 0) {
            const autoWave = s.wave + 1;
            s.wave = autoWave;
            s.waveActive = true;
            s.waveElapsed = 0;
            s.spawnQueue = buildWaveSpawns(autoWave);
            setStatusNotice(`Tự động gọi Đợt ${autoWave}/${s.map.totalWaves}! Đặt thêm súng hoặc nâng cấp Lv2/Lv3!`);
            playSynthFx('wave', soundEnabled, audioCtxRef);
            syncHudFromSim();
          }
        }

        // 1. Spawn queue
        if (s.waveActive && s.spawnQueue.length > 0) {
          s.waveElapsed += simDt;
          while (s.spawnQueue.length > 0 && s.spawnQueue[0].delaySec <= s.waveElapsed) {
            const item = s.spawnQueue.shift()!;
            s.enemies.push(createEnemyForWave(s.nextEnemyId++, item.kind, s.wave, s.map));
          }
        }

        // 2. Active Turret Gunfire (Evolving Lv1 -> Lv2 -> Lv3 Skills & Cinematic FX)
        const energizedSet = new Set(s.energizedGunIds);
        const liveEnemies = s.enemies.filter((e) => e.hp > 0 && e.koTimer <= 0);

        for (const op of s.optics) {
          if (op.recoil > 0) op.recoil = Math.max(0, op.recoil - simDt * 5);
          const spec = OPTIC_CATALOG.find((c) => c.type === op.type);
          if (!spec || spec.category !== 'gun') continue;

          const origin = gridToWorldCenter(op.col, op.row);
          const rangePx = spec.rangeTiles * TILE_SIZE * (1 + (op.level - 1) * 0.14);
          const rangeSq = rangePx * rangePx;
          const isLaserBoosted = energizedSet.has(op.id);
          const overdriveMult = s.overdriveTimer > 0 ? 1.6 : 1;
          const speedMult = (isLaserBoosted ? 1.35 : 1) * overdriveMult;
          const dmgScale = (1 + (op.level - 1) * 0.45) * (isLaserBoosted ? 1.25 : 1) * overdriveMult;

          // Find best target in range
          let target: TdEnemy | null = null;
          let bestScore = -1;
          for (const en of liveEnemies) {
            const dx = en.x - origin.x;
            const dy = en.y - origin.y;
            if (dx * dx + dy * dy <= rangeSq) {
              const priority =
                op.type === 'railgun' || op.type === 'missile'
                  ? en.hp + en.waypointIndex * 60
                  : en.waypointIndex * 200 - Math.hypot(dx, dy);
              if (priority > bestScore) {
                bestScore = priority;
                target = en;
              }
            }
          }

          if (target) {
            op.aimAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
          }

          op.chargeTimer += simDt * speedMult;

          const gatlingCooldown = op.level === 1 ? 0.2 : op.level === 2 ? 0.16 : 0.14;
          const teslaCooldown = op.level === 1 ? 0.95 : op.level === 2 ? 0.85 : 0.76;
          const missileCooldown = op.level === 1 ? 1.35 : op.level === 2 ? 1.2 : 1.08;
          const railCooldown = op.level === 1 ? 1.95 : op.level === 2 ? 1.78 : 1.6;
          const flamerCooldown = op.level === 1 ? 0.34 : op.level === 2 ? 0.3 : 0.26;
          const cryoCooldown = op.level === 1 ? 1.25 : op.level === 2 ? 1.12 : 0.98;
          const mortarCooldown = op.level === 1 ? 2.1 : op.level === 2 ? 1.9 : 1.72;

          if (op.type === 'gatling' && target && op.chargeTimer >= gatlingCooldown) {
            op.chargeTimer = 0;
            op.recoil = 1;
            const angle = op.aimAngle;
            const bColor = op.level === 3 ? '#FDE047' : isLaserBoosted ? '#FBBF24' : '#00E5FF';
            if (op.level === 1) {
              const perpSide = s.nextProjId % 2 === 0 ? 4.5 : -4.5;
              const muzzleX = origin.x + Math.cos(angle) * 21 - Math.sin(angle) * perpSide;
              const muzzleY = origin.y + Math.sin(angle) * 21 + Math.cos(angle) * perpSide;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'bullet',
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(angle) * 520,
                vy: Math.sin(angle) * 520,
                targetId: target.id,
                damage: Math.round(14 * dmgScale),
                splashRadius: 0,
                life: 0.9,
                maxLife: 0.9,
                speed: 520,
                color: bColor,
                tier: 1,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle, radius: 13, alpha: 0.95, color: bColor });
              emitParticles(muzzleX, muzzleY, '#FDE047', 5, 90, 0.9);
            } else if (op.level === 2) {
              // Lv2: Twin Parallel Rotary Stream
              for (const side of [-5.5, 5.5]) {
                const muzzleX = origin.x + Math.cos(angle) * 22 - Math.sin(angle) * side;
                const muzzleY = origin.y + Math.sin(angle) * 22 + Math.cos(angle) * side;
                s.projectiles.push({
                  id: s.nextProjId++,
                  kind: 'bullet',
                  x: muzzleX,
                  y: muzzleY,
                  vx: Math.cos(angle) * 560,
                  vy: Math.sin(angle) * 560,
                  targetId: target.id,
                  damage: Math.round(9.5 * dmgScale),
                  splashRadius: 0,
                  life: 0.9,
                  maxLife: 0.9,
                  speed: 560,
                  color: bColor,
                  tier: 2,
                });
                s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle, radius: 14, alpha: 0.95, color: bColor });
              }
              emitParticles(origin.x + Math.cos(angle) * 22, origin.y + Math.sin(angle) * 22, '#FBBF24', 7, 110, 1);
            } else {
              // Lv3: 3-Way Hyper-Plasma Gatling Burst!
              for (const spread of [-0.13, 0, 0.13]) {
                const shotAngle = angle + spread;
                const muzzleX = origin.x + Math.cos(shotAngle) * 23;
                const muzzleY = origin.y + Math.sin(shotAngle) * 23;
                s.projectiles.push({
                  id: s.nextProjId++,
                  kind: 'bullet',
                  x: muzzleX,
                  y: muzzleY,
                  vx: Math.cos(shotAngle) * 600,
                  vy: Math.sin(shotAngle) * 600,
                  targetId: target.id,
                  damage: Math.round((spread === 0 ? 11.5 : 8.5) * dmgScale),
                  splashRadius: 0,
                  life: 0.95,
                  maxLife: 0.95,
                  speed: 600,
                  color: spread === 0 ? '#FDE047' : '#38BDF8',
                  tier: 3,
                });
              }
              const mx = origin.x + Math.cos(angle) * 23;
              const my = origin.y + Math.sin(angle) * 23;
              s.muzzleFlashes.push({ x: mx, y: my, angle, radius: 20, alpha: 1, color: '#FDE047' });
              emitParticles(mx, my, '#FDE047', 10, 130, 1.1);
            }
            playSynthFx('gatling', soundEnabled, audioCtxRef);
          } else if (op.type === 'tesla' && target && op.chargeTimer >= teslaCooldown) {
            op.chargeTimer = 0;
            op.recoil = 1;
            const maxJumps = 2 + op.level + (isLaserBoosted ? 1 : 0);
            const hitIds = new Set<number>([target.id]);
            const chainPts: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            const chainPtsAlt: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            let cur: TdEnemy | null = target;

            for (let j = 0; j < maxJumps && cur; j++) {
              const prevPt = chainPts[chainPts.length - 1];
              const midX = (prevPt.x + cur.x) / 2 + (Math.random() * 22 - 11);
              const midY = (prevPt.y + cur.y) / 2 + (Math.random() * 22 - 11);
              chainPts.push({ x: midX, y: midY }, { x: cur.x, y: cur.y });
              chainPtsAlt.push(
                { x: (prevPt.x + cur.x) / 2 + (Math.random() * 28 - 14), y: (prevPt.y + cur.y) / 2 + (Math.random() * 28 - 14) },
                { x: cur.x, y: cur.y }
              );

              const zapDmg = Math.round((27 - j * 2.5) * dmgScale);
              s.totalDamage += zapDmg;
              cur.slowTimer = Math.max(cur.slowTimer, 1.7 + op.level * 0.45);
              s.shockwaves.push({
                x: cur.x,
                y: cur.y,
                radius: 4,
                maxRadius: op.level === 3 ? 42 : 24,
                alpha: op.level === 3 ? 0.9 : 0.75,
                color: op.level === 3 ? '#FDE047' : '#7DD3FC',
                lineWidth: op.level === 3 ? 2.8 : 2,
              });
              emitParticles(cur.x, cur.y, op.level === 3 ? '#FDE047' : '#7DD3FC', 8 + op.level * 2, 125, 1);
              if (applyDamageToEnemy(cur, zapDmg)) {
                recordKill(cur);
              }

              let nextTarget: TdEnemy | null = null;
              let minD = (145 + op.level * 18) ** 2;
              for (const cand of liveEnemies) {
                if (hitIds.has(cand.id) || cand.hp <= 0) continue;
                const dSq = (cand.x - cur.x) ** 2 + (cand.y - cur.y) ** 2;
                if (dSq <= minD) {
                  minD = dSq;
                  nextTarget = cand;
                }
              }
              if (nextTarget) hitIds.add(nextTarget.id);
              cur = nextTarget;
            }

            s.lightningArcs.push({
              points: chainPts,
              alpha: 1,
              color: op.level === 3 ? '#FBBF24' : isLaserBoosted ? '#FBBF24' : '#38BDF8',
              width: (isLaserBoosted ? 3.6 : 2.8) + (op.level - 1) * 0.65,
            });
            s.lightningArcs.push({
              points: chainPtsAlt,
              alpha: 0.85,
              color: op.level === 3 ? '#38BDF8' : '#BAE6FD',
              width: 1.8 + (op.level - 1) * 0.3,
            });
            playSynthFx('tesla', soundEnabled, audioCtxRef);
          } else if (op.type === 'missile' && target && op.chargeTimer >= missileCooldown) {
            op.chargeTimer = 0;
            op.recoil = 1;
            const angle = op.aimAngle;
            if (op.level < 3) {
              const muzzleX = origin.x + Math.cos(angle) * 18;
              const muzzleY = origin.y + Math.sin(angle) * 18;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'missile',
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(angle) * 255,
                vy: Math.sin(angle) * 255,
                targetId: target.id,
                damage: Math.round(54 * dmgScale),
                splashRadius: 72 + op.level * 14,
                life: 2.2,
                maxLife: 2.2,
                speed: 270 + op.level * 15,
                color: op.level === 2 ? '#FBBF24' : '#FB7185',
                tier: op.level,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle, radius: 18 + op.level * 3, alpha: 0.95, color: '#FB923C' });
              emitParticles(muzzleX, muzzleY, '#F97316', 10, 100, 1.15);
            } else {
              // Lv3: Twin-Pod Homing Salvo locking onto 2 targets or double-striking boss!
              const secondaryTarget = liveEnemies.find((e) => e.id !== target!.id) ?? target;
              const salvoTargets = [target, secondaryTarget];
              const salvoOffsets = [-0.22, 0.22];
              for (let mIdx = 0; mIdx < 2; mIdx++) {
                const launchAngle = angle + salvoOffsets[mIdx];
                const muzzleX = origin.x + Math.cos(launchAngle) * 19;
                const muzzleY = origin.y + Math.sin(launchAngle) * 19;
                s.projectiles.push({
                  id: s.nextProjId++,
                  kind: 'missile',
                  x: muzzleX,
                  y: muzzleY,
                  vx: Math.cos(launchAngle) * 290,
                  vy: Math.sin(launchAngle) * 290,
                  targetId: salvoTargets[mIdx].id,
                  damage: Math.round(44 * dmgScale),
                  splashRadius: 108,
                  life: 2.4,
                  maxLife: 2.4,
                  speed: 315,
                  color: '#FDE047',
                  tier: 3,
                });
                s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: launchAngle, radius: 22, alpha: 1, color: '#FDE047' });
              }
              emitParticles(origin.x + Math.cos(angle) * 18, origin.y + Math.sin(angle) * 18, '#FB7185', 16, 125, 1.3);
            }
            playSynthFx('missile', soundEnabled, audioCtxRef);
          } else if (op.type === 'railgun' && target && op.chargeTimer >= railCooldown) {
            op.chargeTimer = 0;
            op.recoil = 1;
            const angle = op.aimAngle;
            const muzzleX = origin.x + Math.cos(angle) * 24;
            const muzzleY = origin.y + Math.sin(angle) * 24;
            const endX = origin.x + Math.cos(angle) * 680;
            const endY = origin.y + Math.sin(angle) * 680;
            const railColor = op.level === 3 ? '#F43F5E' : isLaserBoosted ? '#FB7185' : '#A78BFA';

            s.railBeams.push({
              x1: muzzleX,
              y1: muzzleY,
              x2: endX,
              y2: endY,
              alpha: 1,
              color: railColor,
              tier: op.level,
            });
            s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle, radius: 26 + op.level * 5, alpha: 1, color: railColor });
            s.shockwaves.push({
              x: muzzleX,
              y: muzzleY,
              radius: 5,
              maxRadius: 34 + op.level * 10,
              alpha: 0.9,
              color: '#FDE047',
              lineWidth: 2.8 + op.level * 0.5,
            });
            s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.34 + (op.level - 1) * 0.1);

            const railDmg = Math.round((94 + op.level * 12) * dmgScale);
            const segLenSq = (endX - origin.x) ** 2 + (endY - origin.y) ** 2;
            for (const en of liveEnemies) {
              const tProj = Math.max(
                0,
                Math.min(1, ((en.x - origin.x) * (endX - origin.x) + (en.y - origin.y) * (endY - origin.y)) / segLenSq)
              );
              const px = origin.x + tProj * (endX - origin.x);
              const py = origin.y + tProj * (endY - origin.y);
              const distSq = (en.x - px) ** 2 + (en.y - py) ** 2;
              if (distSq <= (en.radius + 14 + op.level * 3) ** 2) {
                s.totalDamage += railDmg;
                emitParticles(en.x, en.y, op.level === 3 ? '#FDE047' : '#E879F9', 15 + op.level * 4, 175, 1.25);
                if (op.level === 3) {
                  // Lv3 Skill: Orbital Impact Detonation around every pierced enemy!
                  s.shockwaves.push({
                    x: en.x,
                    y: en.y,
                    radius: 6,
                    maxRadius: 50,
                    alpha: 0.85,
                    color: '#FB7185',
                    lineWidth: 3,
                  });
                }
                if (applyDamageToEnemy(en, railDmg)) {
                  recordKill(en);
                }
              }
            }
            playSynthFx('railgun', soundEnabled, audioCtxRef);
          } else if (op.type === 'flamer' && target && op.chargeTimer >= flamerCooldown) {
            op.chargeTimer = 0;
            op.recoil = 0.55;
            const coneRange = rangePx * (1.04 + (op.level - 1) * 0.12);
            const muzzleX = origin.x + Math.cos(op.aimAngle) * 18;
            const muzzleY = origin.y + Math.sin(op.aimAngle) * 18;
            s.flameCones.push({
              x: muzzleX,
              y: muzzleY,
              angle: op.aimAngle,
              range: coneRange,
              alpha: 0.94,
              tier: op.level,
            });
            for (let k = 0; k < 5 + op.level * 2; k++) {
              const spreadAngle = op.aimAngle + (Math.random() - 0.5) * (0.65 + op.level * 0.1);
              const slot = s.particles[s.particleCursor];
              s.particleCursor = (s.particleCursor + 1) % PARTICLE_POOL_SIZE;
              slot.active = true;
              slot.x = muzzleX;
              slot.y = muzzleY;
              slot.vx = Math.cos(spreadAngle) * (155 + Math.random() * 100);
              slot.vy = Math.sin(spreadAngle) * (155 + Math.random() * 100);
              slot.life = 0.36;
              slot.maxLife = 0.36;
              slot.size = op.level === 3 ? 3.8 : 3.2;
              slot.color = op.level === 3 ? (Math.random() < 0.5 ? '#38BDF8' : '#E0F2FE') : Math.random() < 0.5 ? '#F97316' : '#FACC15';
            }
            const coneDmg = Math.round(16 * dmgScale);
            const halfArc = op.level === 1 ? 0.52 : op.level === 2 ? 0.6 : 0.68;
            for (const en of liveEnemies) {
              const dx = en.x - origin.x;
              const dy = en.y - origin.y;
              const dist = Math.hypot(dx, dy);
              if (dist <= coneRange + en.radius) {
                const diff = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - op.aimAngle), Math.cos(Math.atan2(dy, dx) - op.aimAngle)));
                if (diff <= halfArc) {
                  s.totalDamage += coneDmg;
                  en.burnTimer = 2.6 + op.level * 0.5;
                  en.burnDps = Math.max(en.burnDps, Math.round((14 + op.level * 4) * dmgScale));
                  if (op.level === 3) {
                    en.slowTimer = Math.max(en.slowTimer, 0.9);
                  }
                  if (applyDamageToEnemy(en, coneDmg)) {
                    recordKill(en);
                  }
                }
              }
            }
            playSynthFx('flamer', soundEnabled, audioCtxRef);
          } else if (op.type === 'cryo' && target && op.chargeTimer >= cryoCooldown) {
            op.chargeTimer = 0;
            op.recoil = 0.7;
            s.shockwaves.push({
              x: origin.x,
              y: origin.y,
              radius: 14,
              maxRadius: rangePx,
              alpha: 0.92,
              color: op.level === 3 ? '#38BDF8' : '#67E8F9',
              lineWidth: 3.5 + op.level * 0.7,
            });
            if (op.level === 3) {
              // Lv3 Skill: Double Absolute-Zero Shatter Wave!
              s.shockwaves.push({
                x: origin.x,
                y: origin.y,
                radius: 28,
                maxRadius: rangePx * 0.78,
                alpha: 0.95,
                color: '#FFFFFF',
                lineWidth: 2.5,
              });
            }
            emitParticles(origin.x, origin.y, '#BAE6FD', 16 + op.level * 4, 140, 1.15);
            const baseFrostDmg = Math.round((18 + op.level * 5) * dmgScale);
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                const shatterBonus = op.level === 3 && en.slowTimer > 0 ? Math.round(baseFrostDmg * 0.55) : 0;
                const totalFrost = baseFrostDmg + shatterBonus;
                en.slowTimer = Math.max(en.slowTimer, 3.0 + op.level * 0.5);
                s.totalDamage += totalFrost;
                emitParticles(en.x, en.y, '#67E8F9', 6, 75, 0.9);
                if (applyDamageToEnemy(en, totalFrost)) {
                  recordKill(en);
                }
              }
            }
            playSynthFx('cryo', soundEnabled, audioCtxRef);
          } else if (op.type === 'mortar' && target && op.chargeTimer >= mortarCooldown) {
            op.chargeTimer = 0;
            op.recoil = 1;
            const angle = op.aimAngle;
            const muzzleX = origin.x + Math.cos(angle) * 16;
            const muzzleY = origin.y + Math.sin(angle) * 16;
            s.projectiles.push({
              id: s.nextProjId++,
              kind: 'mortar',
              x: muzzleX,
              y: muzzleY,
              vx: Math.cos(angle) * 195,
              vy: Math.sin(angle) * 195,
              targetId: target.id,
              targetX: target.x,
              targetY: target.y,
              damage: Math.round((88 + op.level * 14) * dmgScale),
              splashRadius: 92 + op.level * 18,
              life: 2.2,
              maxLife: 2.2,
              speed: 195 + op.level * 12,
              color: op.level === 3 ? '#FDE047' : '#C084FC',
              tier: op.level,
            });
            s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle, radius: 22 + op.level * 4, alpha: 0.95, color: '#C084FC' });
            emitParticles(muzzleX, muzzleY, '#C084FC', 12 + op.level * 3, 115, 1.25);
            playSynthFx('mortar', soundEnabled, audioCtxRef);
          }
        }

        // 3. Step projectiles (Bullets & Homing Missiles & Black-Hole Mortars)
        const survivingProjectiles: ProjectileItem[] = [];
        for (const pr of s.projectiles) {
          pr.life -= simDt;
          if (pr.life <= 0) continue;

          // Homing steer for missiles & mortars
          const tgt = s.enemies.find((e) => e.id === pr.targetId && e.hp > 0);
          if ((pr.kind === 'missile' || pr.kind === 'mortar') && tgt) {
            const angle = Math.atan2(tgt.y - pr.y, tgt.x - pr.x);
            pr.vx = Math.cos(angle) * pr.speed;
            pr.vy = Math.sin(angle) * pr.speed;
            if (Math.random() < 0.65) {
              emitParticles(pr.x, pr.y, pr.kind === 'mortar' ? '#C084FC' : '#FDBA74', 1, 30, 0.75);
            }
          }

          pr.x += pr.vx * simDt;
          pr.y += pr.vy * simDt;

          // Check hit
          let hitEnemy: TdEnemy | null = null;
          for (const en of s.enemies) {
            if (en.hp <= 0 || en.koTimer > 0) continue;
            const dSq = (en.x - pr.x) ** 2 + (en.y - pr.y) ** 2;
            if (dSq <= (en.radius + 9) ** 2) {
              hitEnemy = en;
              break;
            }
          }

          if (hitEnemy) {
            const tier = pr.tier ?? 1;
            if (pr.kind === 'mortar') {
              // Black Hole Implosion + Evolving Gravity Pull!
              s.shockwaves.push({
                x: pr.x,
                y: pr.y,
                radius: pr.splashRadius,
                maxRadius: 12,
                alpha: 0.95,
                color: '#C084FC',
                lineWidth: 4.5 + tier,
              });
              s.shockwaves.push({
                x: pr.x,
                y: pr.y,
                radius: 8,
                maxRadius: pr.splashRadius,
                alpha: 0.85,
                color: '#FDE047',
                lineWidth: 2.5 + tier * 0.5,
              });
              if (tier === 3) {
                s.shockwaves.push({
                  x: pr.x,
                  y: pr.y,
                  radius: 16,
                  maxRadius: pr.splashRadius * 1.15,
                  alpha: 0.8,
                  color: '#38BDF8',
                  lineWidth: 2.2,
                });
              }
              s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.32 + tier * 0.08);
              emitParticles(pr.x, pr.y, '#C084FC', 24 + tier * 6, 185, 1.35);
              const pullAmount = 12 + tier * 6;
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dx = pr.x - en.x;
                const dy = pr.y - en.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= pr.splashRadius + en.radius) {
                  if (dist > 6 && en.kind !== 'boss') {
                    en.x += (dx / dist) * pullAmount;
                    en.y += (dy / dist) * pullAmount;
                  }
                  if (tier >= 2) {
                    en.slowTimer = Math.max(en.slowTimer, 1.4);
                  }
                  const dmg = Math.round(pr.damage * (dist < 40 ? 1 : 0.78));
                  s.totalDamage += dmg;
                  if (applyDamageToEnemy(en, dmg)) {
                    recordKill(en);
                  }
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
            } else if (pr.kind === 'missile') {
              s.shockwaves.push({
                x: pr.x,
                y: pr.y,
                radius: 8,
                maxRadius: pr.splashRadius,
                alpha: 0.9,
                color: tier === 3 ? '#FDE047' : '#FB7185',
                lineWidth: 3.5 + tier * 0.6,
              });
              emitParticles(pr.x, pr.y, '#FB923C', 16 + tier * 4, 145, 1.2);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  const falloff = dist < 26 ? 1 : 0.72;
                  const dmg = Math.round(pr.damage * falloff);
                  s.totalDamage += dmg;
                  if (applyDamageToEnemy(en, dmg)) {
                    recordKill(en);
                  }
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
            } else {
              s.totalDamage += pr.damage;
              emitParticles(pr.x, pr.y, pr.color, tier === 3 ? 7 : 4, 80, tier === 3 ? 0.95 : 0.75);
              if (applyDamageToEnemy(hitEnemy, pr.damage)) {
                recordKill(hitEnemy);
              }
            }
            continue;
          }

          if (pr.x >= -20 && pr.x <= CANVAS_WIDTH + 20 && pr.y >= -20 && pr.y <= CANVAS_HEIGHT + 20) {
            survivingProjectiles.push(pr);
          }
        }
        s.projectiles = survivingProjectiles;

        // 4. Laser Network Continuous Burn + Enemy Movement + Special Abilities
        if (s.enemies.length > 0) {
          const beforeIds = new Set(s.enemies.filter((e) => e.hp > 0).map((e) => e.id));
          const { coreDamageTaken, outcome } = stepEnemiesWithLasers(s.enemies, s.segments, s.map, simDt);

          if (outcome.totalDamageDealt > 0 || outcome.killedCount > 0) {
            s.kills += outcome.killedCount;
            s.energy += outcome.energyGained;
            s.score += outcome.scoreGained;
            s.totalDamage += outcome.totalDamageDealt;
            if (s.overdriveTimer <= 0) {
              s.overdriveCharge = Math.min(100, s.overdriveCharge + outcome.totalDamageDealt * 0.08);
            }
          }

          for (const hEv of outcome.healedEvents) {
            s.healBeams.push({ ...hEv, alpha: 0.95 });
            pushCombatText(hEv.toX, hEv.toY, `+${hEv.amount}`, '#4ADE80', 0.9);
          }
          for (const bEv of outcome.blinkEvents) {
            s.shockwaves.push({
              x: bEv.fromX,
              y: bEv.fromY,
              radius: 4,
              maxRadius: 34,
              alpha: 0.85,
              color: '#C084FC',
              lineWidth: 2.5,
            });
            s.shockwaves.push({
              x: bEv.toX,
              y: bEv.toY,
              radius: 24,
              maxRadius: 6,
              alpha: 0.9,
              color: '#E879F9',
              lineWidth: 2.5,
            });
            emitParticles(bEv.toX, bEv.toY, '#C084FC', 12, 110, 1);
          }

          for (const en of s.enemies) {
            if (en.koTimer >= 0.25 && beforeIds.has(en.id)) {
              const blastColor = en.kind === 'boss' ? '#FB7185' : '#FBBF24';
              emitParticles(en.x, en.y, blastColor, 16, 130, 1.1);
              pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', 1);
            } else if (en.burnTimer > 0 && Math.random() < 0.45) {
              emitParticles(en.x, en.y, '#F97316', 1, 40, 0.85);
            } else if (en.beamsTouching > 0 && Math.random() < 0.35) {
              emitParticles(en.x, en.y, en.beamsTouching >= 2 ? '#FDE047' : '#00E5FF', 1, 55, 0.75);
            }
          }

          if (outcome.killedCount > 0) {
            playSynthFx('kill', soundEnabled, audioCtxRef);
          }

          if (coreDamageTaken > 0) {
            s.coreHp = Math.max(0, s.coreHp - coreDamageTaken);
            s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.55);
            const corePt = gridToWorldCenter(
              s.map.path[s.map.path.length - 1].col,
              s.map.path[s.map.path.length - 1].row
            );
            emitParticles(corePt.x, corePt.y, '#F43F5E', 18, 145, 1.2);
            playSynthFx('hurt', soundEnabled, audioCtxRef);
          }

          s.enemies = s.enemies.filter((e) => e.hp > 0 || e.koTimer > 0);
        }

        // 5. Update transient FX
        for (const p of s.particles) {
          if (!p.active) continue;
          p.life -= dt;
          if (p.life <= 0) {
            p.active = false;
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
        }
        s.shockwaves = s.shockwaves.filter((sw) => {
          sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 8.5) + (sw.maxRadius > sw.radius ? 45 : -45) * dt;
          sw.alpha -= dt * 2.4;
          return sw.alpha > 0.02;
        });
        s.lightningArcs = s.lightningArcs.filter((arc) => {
          arc.alpha -= dt * 5.2;
          return arc.alpha > 0.05;
        });
        s.railBeams = s.railBeams.filter((rb) => {
          rb.alpha -= dt * 3.8;
          return rb.alpha > 0.04;
        });
        s.flameCones = s.flameCones.filter((fc) => {
          fc.alpha -= dt * 4.5;
          return fc.alpha > 0.04;
        });
        s.healBeams = s.healBeams.filter((hb) => {
          hb.alpha -= dt * 2.2;
          return hb.alpha > 0.04;
        });
        s.muzzleFlashes = s.muzzleFlashes.filter((mf) => {
          mf.alpha -= dt * 8.5;
          return mf.alpha > 0.04;
        });
        s.floatingTexts = s.floatingTexts.filter((ft) => {
          ft.y += ft.vy * dt;
          ft.alpha -= dt * 1.45;
          return ft.alpha > 0.04;
        });

        // 6. Wave Clear / Victory / Defeat Check
        if (s.waveActive && s.spawnQueue.length === 0 && s.enemies.length === 0 && s.coreHp > 0) {
          s.waveActive = false;
          const waveBonus = 28 + s.wave * 7;
          s.energy += waveBonus;
          s.score += s.wave * 110;

          if (s.wave >= s.map.totalWaves) {
            s.outcome = 'victory';
            s.score += Math.round(s.coreHp * 60);
            if (s.score > s.bestScore) {
              s.bestScore = Math.round(s.score);
              saveBestScore(s.bestScore);
            }
            syncHudFromSim();
            setGameState('gameover');
            playSynthFx('victory', soundEnabled, audioCtxRef);
            return;
          } else {
            s.nextWaveTimer = 10;
            setStatusNotice(`Hoàn thành Đợt ${s.wave}! (+${waveBonus}⚡) · Tự gọi Đợt ${s.wave + 1} sau 10s.`);
            syncHudFromSim();
          }
        }

        if (s.coreHp <= 0 && !s.outcome) {
          s.outcome = 'defeat';
          if (s.score > s.bestScore) {
            s.bestScore = Math.round(s.score);
            saveBestScore(s.bestScore);
          }
          syncHudFromSim();
          setGameState('gameover');
          playSynthFx('defeat', soundEnabled, audioCtxRef);
          return;
        }

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.1) {
          hudSyncAccum = 0;
          syncHudFromSim();
        }
      }

      // === RENDER CANVAS ===
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
            canvas.width = CANVAS_WIDTH * dpr;
            canvas.height = CANVAS_HEIGHT * dpr;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const shakeAmt = s.shakeTrauma * s.shakeTrauma * 10;
          const sx = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
          const sy = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
          ctx.translate(sx, sy);

          const palette = BIOME_PALETTES[s.map.biome];

          // 1. Biome-Themed Optical Circuit Deck
          ctx.fillStyle = palette.bg;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // 2. Circuit Grid + Nodes
          for (let r = 0; r < s.map.rows; r++) {
            for (let c = 0; c < s.map.cols; c++) {
              const x = c * TILE_SIZE;
              const y = r * TILE_SIZE;
              const kind = getTileKind(s.map, c, r);

              if (kind === 'path' || kind === 'spawn' || kind === 'core') {
                ctx.fillStyle = palette.pathFill;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = palette.pathBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
              } else if (kind === 'wall') {
                ctx.fillStyle = palette.wallFill;
                ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                ctx.strokeStyle = palette.wallStroke;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
                ctx.beginPath();
                ctx.moveTo(x + 12, y + 12);
                ctx.lineTo(x + TILE_SIZE - 12, y + TILE_SIZE - 12);
                ctx.moveTo(x + TILE_SIZE - 12, y + 12);
                ctx.lineTo(x + 12, y + TILE_SIZE - 12);
                ctx.stroke();
              } else {
                ctx.strokeStyle = palette.gridLine;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                ctx.fillStyle = palette.gridLine;
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3.2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // 3. Animated Conveyor Track Glow
          ctx.save();
          ctx.strokeStyle = palette.trackGlow;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 8]);
          ctx.lineDashOffset = -s.animTime * 34;
          ctx.beginPath();
          s.map.path.forEach((wp, i) => {
            const pt = gridToWorldCenter(wp.col, wp.row);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.restore();

          // 4. Spinning Portal Spawn & Armored Core Reactor
          const spawnPt = gridToWorldCenter(s.map.path[0].col, s.map.path[0].row);
          const corePt = gridToWorldCenter(
            s.map.path[s.map.path.length - 1].col,
            s.map.path[s.map.path.length - 1].row
          );

          ctx.save();
          ctx.translate(spawnPt.x, spawnPt.y);
          ctx.rotate(s.animTime * 2);
          ctx.strokeStyle = '#FB7185';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.24)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 5]);
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = '#FECDD3';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CỔNG', spawnPt.x, spawnPt.y);

          const corePulse = 1 + Math.sin(s.animTime * 4) * 0.08;
          ctx.save();
          ctx.translate(corePt.x, corePt.y);
          ctx.rotate(-s.animTime * 1.4);
          ctx.strokeStyle = '#10B981';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * 22 * corePulse;
            const py = Math.sin(a) * 22 * corePulse;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = '#A7F3D0';
          ctx.fillText('LÕI', corePt.x, corePt.y);

          // 5. Hover Range Ring & Placement Preview
          if (s.hoverTile && gameState === 'playing') {
            const hx = s.hoverTile.col * TILE_SIZE;
            const hy = s.hoverTile.row * TILE_SIZE;
            const hKind = getTileKind(s.map, s.hoverTile.col, s.hoverTile.row);
            const hasOptic = s.optics.some(
              (o) => o.col === s.hoverTile!.col && o.row === s.hoverTile!.row
            );
            const hoverSpec = OPTIC_CATALOG.find((c) => c.type === s.selectedTool);
            ctx.save();
            ctx.strokeStyle = hasOptic
              ? '#FBBF24'
              : hKind === 'empty'
                ? '#00E5FF'
                : '#F43F5E';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 3, hy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            if (!hasOptic && hKind === 'empty' && hoverSpec && hoverSpec.rangeTiles > 0) {
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.arc(hx + TILE_SIZE / 2, hy + TILE_SIZE / 2, hoverSpec.rangeTiles * TILE_SIZE, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 6. Shockwaves
          for (const sw of s.shockwaves) {
            ctx.save();
            ctx.globalAlpha = sw.alpha;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.lineWidth;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 7. Laser Beam Network (Multi-layer glow + pulse photons)
          ctx.save();
          ctx.lineCap = 'round';
          for (const seg of s.segments) {
            const isOver = seg.overdriven;
            const glowColor =
              seg.tier === 3 || isOver
                ? 'rgba(244, 63, 94, 0.34)'
                : seg.tier === 2
                  ? 'rgba(251, 191, 36, 0.32)'
                  : 'rgba(0, 229, 255, 0.28)';
            const midColor =
              seg.tier === 3 || isOver
                ? '#FB7185'
                : seg.tier === 2
                  ? '#FBBF24'
                  : '#00E5FF';
            const baseWidth = Math.min(8.5, 2.8 + seg.power / 40);

            ctx.strokeStyle = glowColor;
            ctx.lineWidth = baseWidth * 3.6;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            ctx.strokeStyle = midColor;
            ctx.lineWidth = baseWidth * 1.45;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = Math.max(1.3, baseWidth * 0.45);
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            const p = (s.animTime * 2 + seg.bounceDepth * 0.21) % 1;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(seg.x1 + (seg.x2 - seg.x1) * p, seg.y1 + (seg.y2 - seg.y1) * p, baseWidth * 0.78, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 8. Cinematic Railgun Mach-Ring Hyper-Beams + Volumetric Flame Cones + Healer Tethers
          for (const rb of s.railBeams) {
            ctx.save();
            const rTier = rb.tier ?? 1;
            ctx.globalAlpha = rb.alpha;
            ctx.lineCap = 'round';

            // Wide chromatic outer plasma bloom
            ctx.strokeStyle = rb.color;
            ctx.lineWidth = (18 + rTier * 4) * rb.alpha;
            ctx.beginPath();
            ctx.moveTo(rb.x1, rb.y1);
            ctx.lineTo(rb.x2, rb.y2);
            ctx.stroke();

            // Mid cyan/magenta energy sheath
            ctx.strokeStyle = rTier === 3 ? '#FDE047' : '#E879F9';
            ctx.lineWidth = (7.5 + rTier * 2) * rb.alpha;
            ctx.beginPath();
            ctx.moveTo(rb.x1, rb.y1);
            ctx.lineTo(rb.x2, rb.y2);
            ctx.stroke();

            // Pure white laser core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = (3 + rTier * 0.9) * rb.alpha;
            ctx.beginPath();
            ctx.moveTo(rb.x1, rb.y1);
            ctx.lineTo(rb.x2, rb.y2);
            ctx.stroke();

            // Sonic Mach shock-rings perpendicular to beam path
            const beamAngle = Math.atan2(rb.y2 - rb.y1, rb.x2 - rb.x1);
            const ringCount = 3 + rTier;
            for (let m = 1; m <= ringCount; m++) {
              const frac = 0.07 + m * 0.12;
              const rx = rb.x1 + (rb.x2 - rb.x1) * frac;
              const ry = rb.y1 + (rb.y2 - rb.y1) * frac;
              ctx.save();
              ctx.translate(rx, ry);
              ctx.rotate(beamAngle);
              ctx.strokeStyle = rTier === 3 ? '#38BDF8' : '#FEF08A';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 5, (16 + rTier * 3 - m * 2) * (1.25 - rb.alpha * 0.4), 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
            ctx.restore();
          }

          for (const fc of s.flameCones) {
            const fTier = fc.tier ?? 1;
            const halfCone = fTier === 1 ? 0.48 : fTier === 2 ? 0.56 : 0.64;
            ctx.save();
            ctx.translate(fc.x, fc.y);
            ctx.rotate(fc.angle);

            // Outer volumetric fire/plasma jet
            ctx.globalAlpha = fc.alpha * 0.58;
            const outerGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, fc.range);
            if (fTier === 3) {
              outerGrad.addColorStop(0, '#E0F2FE');
              outerGrad.addColorStop(0.45, '#38BDF8');
              outerGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
            } else {
              outerGrad.addColorStop(0, '#FDBA74');
              outerGrad.addColorStop(0.5, '#EA580C');
              outerGrad.addColorStop(1, 'rgba(190, 18, 60, 0)');
            }
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, fc.range, -halfCone, halfCone);
            ctx.closePath();
            ctx.fill();

            // Hot inner pressure lance
            ctx.globalAlpha = fc.alpha * 0.88;
            const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, fc.range * 0.68);
            innerGrad.addColorStop(0, '#FFFFFF');
            innerGrad.addColorStop(0.45, fTier === 3 ? '#7DD3FC' : '#FEF08A');
            innerGrad.addColorStop(1, fTier === 3 ? 'rgba(56, 189, 248, 0)' : 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, fc.range * 0.68, -halfCone * 0.5, halfCone * 0.5);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
          }

          for (const hb of s.healBeams) {
            ctx.save();
            ctx.globalAlpha = hb.alpha;
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(hb.fromX, hb.fromY);
            ctx.lineTo(hb.toX, hb.toY);
            ctx.stroke();
            ctx.restore();
          }

          // 9. Emitters
          for (const em of s.map.emitters) {
            const pt = gridToWorldCenter(em.col, em.row);
            const vec = DIR_VECTORS[em.dir];
            const angle = Math.atan2(vec.dy, vec.dx);
            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(angle);
            ctx.fillStyle = '#0F172A';
            ctx.strokeStyle = s.overdriveTimer > 0 ? '#FB7185' : '#00E5FF';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(-20, -16, 36, 32, 8);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = s.overdriveTimer > 0 ? '#FB7185' : '#00E5FF';
            ctx.fillRect(10, -7, 12, 14);
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-2, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 10. Placed Optics & Evolving Lv1 -> Lv2 -> Lv3 Active Turret Sprites
          const energizedSet = new Set(s.energizedGunIds);
          for (const op of s.optics) {
            const pt = gridToWorldCenter(op.col, op.row);
            const isSelected = op.id === s.selectedOpticId;
            const isEnergized = energizedSet.has(op.id);
            const spec = OPTIC_CATALOG.find((c) => c.type === op.type);

            ctx.save();
            ctx.translate(pt.x, pt.y);

            if (isSelected) {
              ctx.strokeStyle = '#FBBF24';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.arc(0, 0, 27, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              if (spec && spec.rangeTiles > 0) {
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.24)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, spec.rangeTiles * TILE_SIZE * (1 + (op.level - 1) * 0.14), 0, Math.PI * 2);
                ctx.stroke();
              }
            }

            // Laser-Energized Aura for Guns
            if (isEnergized && spec?.category === 'gun') {
              ctx.strokeStyle = 'rgba(0, 229, 255, 0.72)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 24 + Math.sin(s.animTime * 8) * 1.5, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Lv3 Apex Spinning Halo Ring
            if (op.level === 3) {
              ctx.save();
              ctx.rotate(s.animTime * 2.2);
              ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
              ctx.lineWidth = 1.8;
              ctx.setLineDash([6, 4]);
              ctx.beginPath();
              ctx.arc(0, 0, 25, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }

            // Evolved Pedestal Base (Lv1 steel, Lv2 gold collar, Lv3 armored hex mount)
            ctx.fillStyle = op.level === 3 ? '#172554' : op.hitCount > 0 ? '#162544' : '#0F172A';
            ctx.strokeStyle = op.level >= 2 ? '#FBBF24' : isEnergized ? '#00E5FF' : op.hitCount > 0 ? '#38BDF8' : '#334155';
            ctx.lineWidth = op.level === 3 ? 2.6 : 2;
            ctx.beginPath();
            ctx.arc(0, 0, 20 + (op.level - 1) * 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (op.level >= 2) {
              // Armored side stabilizers
              ctx.fillStyle = op.level === 3 ? '#FDE047' : '#94A3B8';
              ctx.fillRect(-23, -4, 4, 8);
              ctx.fillRect(19, -4, 4, 8);
            }

            if (op.type === 'mirror') {
              const normalAngle = (op.rot * Math.PI) / 8;
              ctx.save();
              ctx.rotate(normalAngle + Math.PI / 2);
              const w = 38 + (op.level - 1) * 4;
              ctx.fillStyle = op.level >= 2 ? '#F59E0B' : '#94A3B8';
              ctx.fillRect(-w / 2, -4.5, w, 9);
              ctx.fillStyle = op.hitCount > 0 ? '#00E5FF' : '#E2E8F0';
              ctx.fillRect(-w / 2, -4.5, w, 3.5);
              if (op.level === 3) {
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
                ctx.fill();
              }
              ctx.restore();
            } else if (op.type === 'prism') {
              const aimAngle = (op.rot * Math.PI) / 4;
              ctx.save();
              ctx.rotate(aimAngle);
              const sc = 1 + (op.level - 1) * 0.1;
              ctx.scale(sc, sc);
              ctx.fillStyle = op.hitCount > 0 ? 'rgba(192, 132, 252, 0.65)' : 'rgba(139, 92, 246, 0.38)';
              ctx.strokeStyle = op.level >= 2 ? '#FDE047' : '#C4B5FD';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(16, 0);
              ctx.lineTo(-12, -14);
              ctx.lineTo(-12, 14);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              if (op.level === 3) {
                ctx.strokeStyle = '#38BDF8';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(9, 0);
                ctx.lineTo(-7, -7);
                ctx.lineTo(-7, 7);
                ctx.closePath();
                ctx.stroke();
              }
              ctx.fillStyle = '#FDE047';
              ctx.fillRect(13, -2, 5, 4);
              ctx.restore();
            } else if (op.type === 'amp') {
              ctx.strokeStyle = op.level === 3 ? '#38BDF8' : '#FBBF24';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(0, 0, 12 + op.level, 0, Math.PI * 2);
              ctx.stroke();
              if (op.level >= 2) {
                ctx.strokeStyle = '#FBBF24';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(0, 0, 9, 0, Math.PI * 2);
                ctx.stroke();
              }
              ctx.fillStyle = op.hitCount > 0 ? '#FDE047' : '#78350F';
              ctx.beginPath();
              ctx.arc(0, 0, 5.5 + op.level * 0.8, 0, Math.PI * 2);
              ctx.fill();
            } else if (op.type === 'gatling') {
              // Evolving Gatling: Lv1 twin -> Lv2 armored drum -> Lv3 Triple Hyper-Array!
              ctx.save();
              ctx.rotate(op.aimAngle);
              const kick = op.recoil * 4;
              if (op.level >= 2) {
                ctx.fillStyle = '#F59E0B';
                ctx.fillRect(-13 - kick, -9, 10, 18);
              }
              ctx.fillStyle = op.level === 3 ? '#FDE047' : '#38BDF8';
              ctx.fillRect(4 - kick, -8, 19 + op.level * 1.5, 4);
              ctx.fillRect(4 - kick, 4, 19 + op.level * 1.5, 4);
              if (op.level === 3) {
                ctx.fillStyle = '#00E5FF';
                ctx.fillRect(5 - kick, -2, 23, 4);
              }
              ctx.fillStyle = '#1E293B';
              ctx.strokeStyle = op.level >= 2 ? '#FBBF24' : '#38BDF8';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(0, 0, 12 + (op.level - 1), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } else if (op.type === 'tesla') {
              // Evolving Tesla: Lv1 orb -> Lv2 dual coil -> Lv3 Tri-Pylon Storm Spire
              if (op.level === 3) {
                for (let k = 0; k < 3; k++) {
                  const ka = (k * Math.PI * 2) / 3 + s.animTime * 2.4;
                  ctx.strokeStyle = '#FDE047';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(0, 0);
                  ctx.lineTo(Math.cos(ka) * 18, Math.sin(ka) * 18);
                  ctx.stroke();
                  ctx.fillStyle = '#38BDF8';
                  ctx.beginPath();
                  ctx.arc(Math.cos(ka) * 18, Math.sin(ka) * 18, 3.2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              ctx.strokeStyle = op.level >= 2 ? '#FBBF24' : '#38BDF8';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(0, 0, 14 + (op.level - 1), 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = op.level === 3 ? '#FEF08A' : '#BAE6FD';
              ctx.beginPath();
              ctx.arc(0, 0, 6.5 + op.level + Math.sin(s.animTime * 9) * 1.2, 0, Math.PI * 2);
              ctx.fill();
            } else if (op.type === 'missile') {
              // Evolving Missile: Lv1 2-pod -> Lv2 armored rack -> Lv3 Twin-Salvo 6-Cell Pod with wings
              ctx.save();
              ctx.rotate(op.aimAngle);
              const kick = op.recoil * 3;
              if (op.level === 3) {
                ctx.fillStyle = '#F59E0B';
                ctx.beginPath();
                ctx.moveTo(-4 - kick, -18);
                ctx.lineTo(6 - kick, -11);
                ctx.lineTo(6 - kick, 11);
                ctx.lineTo(-4 - kick, 18);
                ctx.closePath();
                ctx.fill();
              }
              ctx.fillStyle = op.level === 3 ? '#BE123C' : '#E11D48';
              ctx.strokeStyle = op.level >= 2 ? '#FDE047' : '#FDA4AF';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.roundRect(-12 - kick, -12 - (op.level - 1), 24 + op.level * 2, 24 + (op.level - 1) * 2, 5);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#FDE047';
              ctx.fillRect(10 - kick, -8, 5, 4.5);
              ctx.fillRect(10 - kick, 3.5, 5, 4.5);
              if (op.level >= 2) {
                ctx.fillStyle = '#38BDF8';
                ctx.fillRect(10 - kick, -2, 6, 4);
              }
              ctx.restore();
            } else if (op.type === 'railgun') {
              // Evolving Railgun: Lv1 twin rail -> Lv2 golden coils -> Lv3 Hyper-Rail Brake Cannon
              ctx.save();
              ctx.rotate(op.aimAngle);
              const kick = op.recoil * 5;
              const len = 24 + (op.level - 1) * 4;
              ctx.fillStyle = op.level >= 2 ? '#FBBF24' : '#A78BFA';
              ctx.fillRect(2 - kick, -6, len, 3.2);
              ctx.fillRect(2 - kick, 2.8, len, 3.2);
              ctx.fillStyle = op.level === 3 ? '#38BDF8' : '#F43F5E';
              ctx.fillRect(4 - kick, -1.8, len - 3, 3.6);
              if (op.level === 3) {
                ctx.fillStyle = '#F43F5E';
                ctx.fillRect(len - 3 - kick, -8, 4, 16);
              }
              ctx.fillStyle = '#1E1B4B';
              ctx.strokeStyle = op.level >= 2 ? '#FDE047' : '#C4B5FD';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(0, 0, 13 + (op.level - 1), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } else if (op.type === 'flamer') {
              // Evolving Flamer: Lv1 orange nozzle -> Lv2 twin brass nozzles -> Lv3 Blue Plasma Hellfire
              ctx.save();
              ctx.rotate(op.aimAngle);
              const kick = op.recoil * 3;
              ctx.fillStyle = op.level === 3 ? '#0284C7' : '#EA580C';
              ctx.fillRect(4 - kick, -5 - (op.level - 1), 16 + op.level * 2, 10 + (op.level - 1) * 2);
              ctx.fillStyle = op.level === 3 ? '#38BDF8' : '#FACC15';
              ctx.fillRect(18 + op.level - kick, -4.5, 5, 9);
              ctx.fillStyle = op.level === 3 ? '#0C4A6E' : '#431407';
              ctx.strokeStyle = op.level === 3 ? '#7DD3FC' : op.level === 2 ? '#FBBF24' : '#FB923C';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(-2, 0, 11 + (op.level - 1), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            } else if (op.type === 'cryo') {
              // Evolving Cryo: Lv1 hex -> Lv2 gold hex -> Lv3 Absolute-Zero 6-Point Star
              ctx.save();
              ctx.rotate(s.animTime * (1.4 + op.level * 0.5));
              ctx.strokeStyle = op.level === 3 ? '#FFFFFF' : '#67E8F9';
              ctx.fillStyle = op.level === 3 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(6, 182, 212, 0.35)';
              ctx.lineWidth = 2.2;
              const sides = op.level === 3 ? 8 : 6;
              ctx.beginPath();
              for (let i = 0; i < sides; i++) {
                const a = (i * Math.PI * 2) / sides;
                const rad = op.level === 3 && i % 2 === 1 ? 18 : 14 + op.level;
                const px = Math.cos(a) * rad;
                const py = Math.sin(a) * rad;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();
              ctx.fillStyle = op.level >= 2 ? '#FDE047' : '#ECFEFF';
              ctx.beginPath();
              ctx.arc(0, 0, 5 + (op.level - 1), 0, Math.PI * 2);
              ctx.fill();
            } else if (op.type === 'mortar') {
              // Evolving Black-Hole Mortar: Lv1 purple sphere -> Lv2 twin prongs -> Lv3 Quasar Accretion Cannon
              ctx.save();
              ctx.rotate(op.aimAngle);
              const kick = op.recoil * 4;
              if (op.level === 3) {
                ctx.save();
                ctx.rotate(s.animTime * 6);
                ctx.strokeStyle = '#FDE047';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.ellipse(0, 0, 19, 8, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }
              ctx.fillStyle = op.level === 3 ? '#3B0764' : '#581C87';
              ctx.strokeStyle = op.level >= 2 ? '#FDE047' : '#E879F9';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(-kick, 0, 14 + (op.level - 1), 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = op.level === 3 ? '#38BDF8' : '#FDE047';
              ctx.beginPath();
              ctx.arc(7 - kick, 0, 5 + (op.level - 1), 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // Level pips (1..3)
            for (let lv = 0; lv < op.level; lv++) {
              ctx.fillStyle = '#FBBF24';
              ctx.beginPath();
              ctx.arc(-8 + lv * 8, 17, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 11. Hyper-Detailed Mechanical & Cybernetic Enemies (Articulated Multi-Layer Chassis)
          for (const en of s.enemies) {
            ctx.save();
            const isKo = en.koTimer > 0;
            const koAlpha = isKo ? Math.max(0, en.koTimer / 0.3) : 1;
            const koScale = isKo ? 1 + (1 - koAlpha) * 0.55 : 1;
            const stealthFade = en.kind === 'stealth' ? 0.55 + Math.sin(s.animTime * 9 + en.id) * 0.25 : 1;
            ctx.globalAlpha = koAlpha * stealthFade;
            ctx.translate(en.x, en.y);

            // Ground ambient contact shadow
            if (!isKo) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.46)';
              ctx.beginPath();
              ctx.ellipse(0, 7, en.radius * 0.95, en.radius * 0.48, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            // Crossfire Golden Resonance Ring
            if (en.beamsTouching >= 2 && !isKo) {
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(0, 0, en.radius + 7, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Cryo Ice Crystal Encasing
            if (en.slowTimer > 0 && !isKo) {
              ctx.strokeStyle = '#67E8F9';
              ctx.lineWidth = 2;
              for (let ic = 0; ic < 6; ic++) {
                const ia = (ic * Math.PI) / 3 + s.animTime * 1.1;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ia) * (en.radius - 1), Math.sin(ia) * (en.radius - 1));
                ctx.lineTo(Math.cos(ia) * (en.radius + 7), Math.sin(ia) * (en.radius + 7));
                ctx.stroke();
              }
            }

            // Shield Ring when shield > 0
            if (en.shield > 0 && !isKo) {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
              ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.arc(0, 0, en.radius + 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            ctx.save();
            ctx.rotate(en.heading);
            ctx.scale(koScale, koScale);
            const flash = en.hitFlash > 0;
            const pulse = 0.85 + Math.sin(s.animTime * 18 + en.id) * 0.2;

            if (en.kind === 'scout') {
              // Twin Supersonic Plasma Thruster Cones
              ctx.fillStyle = '#38BDF8';
              ctx.beginPath();
              ctx.moveTo(-10, -6);
              ctx.lineTo(-19 * pulse, -4);
              ctx.lineTo(-10, -2);
              ctx.moveTo(-10, 2);
              ctx.lineTo(-19 * pulse, 4);
              ctx.lineTo(-10, 6);
              ctx.fill();

              // Swept Composite Stealth Wings
              ctx.fillStyle = flash ? '#FFFFFF' : '#0F172A';
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(16, 0);
              ctx.lineTo(-3, -6);
              ctx.lineTo(-11, -14);
              ctx.lineTo(-8, -3);
              ctx.lineTo(-12, 0);
              ctx.lineTo(-8, 3);
              ctx.lineTo(-11, 14);
              ctx.lineTo(-3, 6);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Central Spine + Armored Canopy
              ctx.fillStyle = flash ? '#FFFFFF' : '#0284C7';
              ctx.beginPath();
              ctx.moveTo(15, 0);
              ctx.lineTo(-7, -4.5);
              ctx.lineTo(-7, 4.5);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#FEF08A';
              ctx.beginPath();
              ctx.ellipse(3, 0, 5, 2.1, 0, 0, Math.PI * 2);
              ctx.fill();
            } else if (en.kind === 'armored') {
              // Heavy Siege Tank: Articulated Tracks + Reactive Plates + Twin Turret
              const treadShift = (s.animTime * 22) % 6;
              ctx.fillStyle = '#1E293B';
              ctx.fillRect(-16, -16, 32, 6);
              ctx.fillRect(-16, 10, 32, 6);
              ctx.fillStyle = '#64748B';
              for (let tx = -14 + treadShift; tx < 14; tx += 6) {
                ctx.fillRect(tx, -16, 2.5, 6);
                ctx.fillRect(tx, 10, 2.5, 6);
              }

              // Main Chamfered Hull
              ctx.fillStyle = flash ? '#FFFFFF' : '#78350F';
              ctx.strokeStyle = '#F59E0B';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(15, -9);
              ctx.lineTo(18, 0);
              ctx.lineTo(15, 9);
              ctx.lineTo(-14, 11);
              ctx.lineTo(-16, -11);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Reactive Front Slats & Dual Heavy Barrels
              ctx.fillStyle = flash ? '#FFFFFF' : '#FBBF24';
              ctx.fillRect(5, -5.5, 15, 3);
              ctx.fillRect(5, 2.5, 15, 3);
              ctx.fillStyle = '#451A03';
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(-1, 0, 7.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (en.kind === 'splitter') {
              const sScale = en.radius < 12 ? 0.72 : 1;
              ctx.scale(sScale, sScale);
              // Cyber-Arachnid Mechanical Swarmer with 4 Articulated Blades
              ctx.rotate(s.animTime * 8);
              ctx.strokeStyle = '#E879F9';
              ctx.fillStyle = flash ? '#FFFFFF' : '#581C87';
              ctx.lineWidth = 1.6;
              for (let b = 0; b < 4; b++) {
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(3, -2);
                ctx.lineTo(11, -7);
                ctx.lineTo(16, 0);
                ctx.lineTo(8, 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              }
              ctx.fillStyle = '#FDE047';
              ctx.beginPath();
              ctx.arc(0, 0, 5, 0, Math.PI * 2);
              ctx.fill();
            } else if (en.kind === 'stealth') {
              // Faceted Ghost Bomber with Holographic Scan Ribbons
              ctx.fillStyle = flash ? '#FFFFFF' : '#064E3B';
              ctx.strokeStyle = '#34D399';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(18, 0);
              ctx.lineTo(-2, -14);
              ctx.lineTo(-14, -7);
              ctx.lineTo(-7, 0);
              ctx.lineTo(-14, 7);
              ctx.lineTo(-2, 14);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              ctx.strokeStyle = '#A7F3D0';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(12, 0);
              ctx.lineTo(-7, 0);
              ctx.moveTo(2, -7);
              ctx.lineTo(-8, -3);
              ctx.moveTo(2, 7);
              ctx.lineTo(-8, 3);
              ctx.stroke();
            } else if (en.kind === 'healer') {
              // Nanobot Med-Frigate + 3 Orbiting Repair Satellites
              ctx.fillStyle = flash ? '#FFFFFF' : '#065F46';
              ctx.strokeStyle = '#4ADE80';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(-12, -11, 24, 22, 8);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ECFDF5';
              ctx.fillRect(-5, -1.8, 10, 3.6);
              ctx.fillRect(-1.8, -5, 3.6, 10);

              for (let o = 0; o < 3; o++) {
                const oa = s.animTime * 4 + (o * Math.PI * 2) / 3;
                ctx.fillStyle = '#86EFAC';
                ctx.beginPath();
                ctx.arc(Math.cos(oa) * 16, Math.sin(oa) * 16, 2.8, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (en.kind === 'teleporter') {
              // Chrono-Warp Strider with Detached Floating Resonance Wings
              const wingSpread = 2 + Math.sin(s.animTime * 10) * 1.8;
              ctx.fillStyle = flash ? '#FFFFFF' : '#4C1D95';
              ctx.strokeStyle = '#E879F9';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.moveTo(15, 0);
              ctx.lineTo(0, -6);
              ctx.lineTo(-14, 0);
              ctx.lineTo(0, 6);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Floating Wing Fins
              ctx.fillStyle = '#C084FC';
              ctx.beginPath();
              ctx.moveTo(6, -8 - wingSpread);
              ctx.lineTo(-9, -14 - wingSpread);
              ctx.lineTo(-5, -7 - wingSpread);
              ctx.closePath();
              ctx.moveTo(6, 8 + wingSpread);
              ctx.lineTo(-9, 14 + wingSpread);
              ctx.lineTo(-5, 7 + wingSpread);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
              ctx.fill();
            } else if (en.kind === 'shieldbearer') {
              // Heavy Aegis Walker with Shoulder Pauldrons & Hex Energy Barrier
              ctx.fillStyle = flash ? '#FFFFFF' : '#1E3A8A';
              ctx.strokeStyle = '#93C5FD';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(-13, -14, 22, 28, 5);
              ctx.fill();
              ctx.stroke();

              // Shoulder Pauldron Armor Plates
              ctx.fillStyle = '#3B82F6';
              ctx.fillRect(-10, -16, 12, 5);
              ctx.fillRect(-10, 11, 12, 5);

              // Curved Hex Shield Barrier
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(4, 0, 19, -Math.PI * 0.45, Math.PI * 0.45);
              ctx.stroke();
              ctx.strokeStyle = '#E0F2FE';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(4, 0, 19, -Math.PI * 0.35, Math.PI * 0.35);
              ctx.stroke();
            } else if (en.kind === 'boss') {
              // OMEGA DREADNOUGHT TITAN: Multi-Deck Battleship Hull + Thrusters + Reactor + Sponsons
              // Dual Huge Plasma Thruster Plumes
              ctx.fillStyle = '#FB7185';
              ctx.beginPath();
              ctx.moveTo(-22, -11);
              ctx.lineTo(-34 * pulse, -8);
              ctx.lineTo(-22, -5);
              ctx.moveTo(-22, 5);
              ctx.lineTo(-34 * pulse, 8);
              ctx.lineTo(-22, 11);
              ctx.fill();

              // Outer Heavy Wing Bulkheads
              ctx.fillStyle = flash ? '#FFFFFF' : '#4C0519';
              ctx.strokeStyle = '#FDA4AF';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.moveTo(29, 0);
              ctx.lineTo(13, -15);
              ctx.lineTo(-6, -24);
              ctx.lineTo(-23, -19);
              ctx.lineTo(-19, -7);
              ctx.lineTo(-24, 0);
              ctx.lineTo(-19, 7);
              ctx.lineTo(-23, 19);
              ctx.lineTo(-6, 24);
              ctx.lineTo(13, 15);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Upper Armored Bridge Deck
              ctx.fillStyle = flash ? '#FFFFFF' : '#9F1239';
              ctx.beginPath();
              ctx.moveTo(20, 0);
              ctx.lineTo(4, -10);
              ctx.lineTo(-14, -9);
              ctx.lineTo(-14, 9);
              ctx.lineTo(4, 10);
              ctx.closePath();
              ctx.fill();

              // Spinning Omega Core Reactor
              ctx.save();
              ctx.rotate(s.animTime * 4);
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 2.6;
              ctx.setLineDash([7, 4]);
              ctx.beginPath();
              ctx.arc(0, 0, 11, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();

              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(2, 0, 5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();

            // Burn status glow ring
            if (en.burnTimer > 0 && !isKo) {
              ctx.strokeStyle = 'rgba(249, 115, 22, 0.85)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, en.radius + 1, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Dual Segmented HP + Shield Bar
            if (!isKo && (en.hp < en.maxHp || en.shield < en.maxShield)) {
              const bw = en.radius * 2 + 10;
              const bh = 5;
              const hpRatio = Math.max(0, en.hp / en.maxHp);
              ctx.fillStyle = '#090D16';
              ctx.fillRect(-bw / 2 - 1, -en.radius - 14, bw + 2, bh + 2);
              ctx.fillStyle = hpRatio > 0.5 ? '#10B981' : hpRatio > 0.25 ? '#F59E0B' : '#F43F5E';
              ctx.fillRect(-bw / 2, -en.radius - 13, bw * hpRatio, bh);

              if (en.maxShield > 0 && en.shield > 0) {
                const shRatio = Math.max(0, en.shield / en.maxShield);
                ctx.fillStyle = '#38BDF8';
                ctx.fillRect(-bw / 2, -en.radius - 17, bw * shRatio, 2.5);
              }
            }
            ctx.restore();
          }

          // 12. Cinematic Projectiles (Glowing Tracer Bolts, Thrusting Missiles & Black-Hole Orbs)
          for (const pr of s.projectiles) {
            ctx.save();
            ctx.translate(pr.x, pr.y);
            ctx.rotate(Math.atan2(pr.vy, pr.vx));
            if (pr.kind === 'mortar') {
              // Event Horizon Singularity Orb with Spinning Accretion Ring
              ctx.save();
              ctx.rotate(s.animTime * 12);
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 12, 5.5, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
              ctx.fillStyle = '#070312';
              ctx.strokeStyle = '#C084FC';
              ctx.lineWidth = 2.6;
              ctx.beginPath();
              ctx.arc(0, 0, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (pr.kind === 'missile') {
              // Flame jet + sleek missile body
              ctx.fillStyle = '#F97316';
              ctx.beginPath();
              ctx.moveTo(-6, -3);
              ctx.lineTo(-17 - Math.random() * 6, 0);
              ctx.lineTo(-6, 3);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#FB7185';
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(10, 0);
              ctx.lineTo(-7, -4.5);
              ctx.lineTo(-4, 0);
              ctx.lineTo(-7, 4.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Glowing supersonic tracer bolt + tail fade
              ctx.fillStyle = pr.color;
              ctx.globalAlpha = 0.45;
              ctx.fillRect(-16, -2.5, 16, 5);
              ctx.globalAlpha = 1;
              ctx.fillRect(-6, -2, 13, 4);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(-1, -1, 8, 2);
            }
            ctx.restore();
          }

          // 12b. Directional Muzzle Flash Starbursts
          for (const mf of s.muzzleFlashes) {
            ctx.save();
            ctx.globalAlpha = mf.alpha;
            ctx.translate(mf.x, mf.y);
            ctx.rotate(mf.angle);
            ctx.fillStyle = mf.color;
            ctx.beginPath();
            ctx.moveTo(mf.radius * 1.4, 0);
            ctx.lineTo(2, -mf.radius * 0.45);
            ctx.lineTo(0, -mf.radius * 0.9);
            ctx.lineTo(-3, 0);
            ctx.lineTo(0, mf.radius * 0.9);
            ctx.lineTo(2, mf.radius * 0.45);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(2, 0, mf.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 13. Jagged Chain Lightning Arcs
          for (const arc of s.lightningArcs) {
            if (arc.points.length < 2) continue;
            ctx.save();
            ctx.globalAlpha = arc.alpha;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = arc.color;
            ctx.lineWidth = arc.width * 2.4;
            ctx.beginPath();
            ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) {
              ctx.lineTo(arc.points[i].x, arc.points[i].y);
            }
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = arc.width * 0.7;
            ctx.beginPath();
            ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) {
              ctx.lineTo(arc.points[i].x, arc.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
          }

          // 14. Pooled Particles
          for (const p of s.particles) {
            if (!p.active) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 15. Floating Combat Text
          for (const ft of s.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `bold ${Math.round(11 * ft.scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#070B14';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }
        }
      }

      rafId = window.requestAnimationFrame(tickAndDraw);
    };

    rafId = window.requestAnimationFrame(tickAndDraw);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState, recomputeLasers, syncHudFromSim, emitParticles, pushCombatText, soundEnabled]);

  const selectedOptic = useMemo(() => {
    if (!selectedOpticId) return null;
    return simRef.current.optics.find((o) => o.id === selectedOpticId) ?? null;
  }, [selectedOpticId, hud.energy, hud.totalDps, hud.wave]);

  const selectedUpgradeCost = selectedOptic
    ? getOpticUpgradeCost(selectedOptic.type, selectedOptic.level)
    : null;
  const selectedSellRefund = selectedOptic ? getOpticSellRefund(selectedOptic) : 0;

  return (
    <section
      id="prism-td-section"
      aria-label="Thủ Thành Gương Phản Xạ & Mạch Laser"
      data-theme={theme}
      className="relative rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#070B14] text-[#F1F5F9] shadow-[0_20px_50px_-24px_rgba(0,229,255,0.22)] overflow-hidden"
    >
      {/* TITLE SCREEN */}
      {gameState === 'title' && (
        <div className="p-4 sm:p-7 lg:p-8 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3.5">
                <svg viewBox="0 0 48 48" className="w-11 h-11 shrink-0" aria-hidden="true">
                  <rect x="2" y="2" width="44" height="44" rx="11" fill="#0F172A" stroke="#00E5FF" strokeWidth="2" />
                  <line x1="6" y1="24" x2="22" y2="24" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" />
                  <polygon points="22,12 36,24 22,36" fill="rgba(167,139,250,0.35)" stroke="#C4B5FD" strokeWidth="2" />
                  <line x1="33" y1="21" x2="43" y2="12" stroke="#FB7185" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="35" y1="24" x2="44" y2="24" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="33" y1="27" x2="43" y2="36" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.2rem] font-bold tracking-tight text-white leading-tight">
                    Thủ Thành Mạch Laser
                  </h1>
                  <p className="text-xs sm:text-sm text-sky-300/90 font-mono">
                    10 Vũ Khí &amp; Quang Học · 8 Chủng Quái · 10 Bản Đồ Chủ Đề
                    {hud.bestScore > 0 ? ` · Kỷ lục: ${hud.bestScore}đ` : ''}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
                Kết hợp <strong className="text-cyan-300">Gương · Lăng Kính 1→3 · Khuếch Đại</strong> cùng 7 khẩu pháo điện ảnh{' '}
                <strong className="text-amber-300">Súng Máy, Tesla, Tên Lửa, Railgun, Phun Lửa, Tháp Băng Cryo &amp; Pháo Lỗ Đen</strong>!
              </p>

              {/* Map Selection (10 Biome Maps) */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Bản Đồ Chiến Trường (10 Khu Vực Chủ Đề)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {PRISM_MAPS.map((m, idx) => {
                    const active = idx === selectedMapIndex;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMapIndex(idx)}
                        className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-cyan-400 bg-cyan-950/45 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-[10px] font-mono text-cyan-300 font-semibold truncate">
                          {m.difficultyLabel.split('·')[0].trim()}
                        </div>
                        <div className="text-[11px] font-bold mt-0.5 truncate">{m.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startNewRun(selectedMapIndex)}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070B14] font-bold text-sm sm:text-base transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Bắt Đầu Thủ Thành</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-700/80 bg-[#0B1222] p-3 space-y-2.5">
                <canvas
                  ref={titleCanvasRef}
                  aria-label="Mô phỏng tia laser, tháp sét và tàu địch"
                  className="w-full h-auto rounded-lg block border border-slate-800"
                />
                <p className="text-xs text-slate-400 text-center">
                  Chiếu tia laser đi qua trụ súng kích hoạt <strong className="text-cyan-300">Tăng Áp +35% tốc bắn</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3 text-center">
            Phím 1-0 chọn 10 vũ khí/gương · Nhấp ô trống để đặt · Nhấp gương để xoay · Q/E xoay · Space Quá tải · P Tạm dừng
          </p>
        </div>
      )}

      {/* PLAYING / PAUSED SHELL */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="relative">
          {/* Top Unified Optical HUD Strip */}
          <div className="border-b border-slate-800 bg-[#0B1222] px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 tabular-nums">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 leading-none">LÕI</div>
                  <div className="text-sm sm:text-base font-bold text-white leading-tight">
                    {hud.coreHp}/{hud.maxCoreHp}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 leading-none">NĂNG LƯỢNG</div>
                  <div className="text-sm sm:text-base font-bold text-amber-300 leading-tight">
                    {hud.energy}⚡
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 leading-none">ĐỢT</div>
                <div className="text-sm sm:text-base font-bold text-cyan-300 leading-tight">
                  {hud.wave}/{hud.totalWaves}
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="text-[10px] font-mono text-slate-400 leading-none">MẠNG LASER</div>
                <div className="text-sm sm:text-base font-bold text-sky-300 leading-tight">
                  {hud.totalDps} DPS
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-[10px] font-mono text-slate-400 leading-none">ĐIỂM</div>
                <div className="text-sm sm:text-base font-bold text-white leading-tight">
                  {hud.score}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={activateOverdrive}
                disabled={hud.overdrivePct < 100 || hud.overdriveActive}
                title="Kích hoạt Siêu Quá Tải Laser ×2.2 (Space)"
                className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  hud.overdriveActive
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : hud.overdrivePct >= 100
                      ? 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-[#070B14]'
                      : 'bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {hud.overdriveActive ? 'ĐANG QUÁ TẢI!' : `Quá Tải ${hud.overdrivePct}%`}
                </span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  simRef.current.speedMult = simRef.current.speedMult === 1 ? 2 : 1;
                  syncHudFromSim();
                }}
                aria-label="Đổi tốc độ mô phỏng"
                className={`h-8 sm:h-9 px-2.5 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer ${
                  hud.speedMult === 2
                    ? 'bg-cyan-500 text-[#070B14] border-cyan-400'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{hud.speedMult}×</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSoundEnabled((p) => !p);
                }}
                aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
                }}
                aria-label={gameState === 'paused' ? 'Đóng tạm dừng' : 'Tạm dừng'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  startNewRun(selectedMapIndex);
                }}
                aria-label="Chơi lại ván này"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Arena Canvas */}
          <div className="p-2 sm:p-2.5 bg-[#050811]">
            <div className="max-w-[700px] mx-auto">
              <canvas
                ref={canvasRef}
                data-testid="prism-td-canvas"
                aria-label="Bản đồ Thủ Thành Mạch Laser 12x8"
                onPointerMove={handleCanvasPointerMove}
                onPointerLeave={handleCanvasPointerLeave}
                onClick={handleCanvasClick}
                onContextMenu={handleCanvasContextMenu}
                className="w-full h-auto aspect-[3/2] rounded-xl border border-slate-800 block cursor-crosshair select-none touch-manipulation"
              />
            </div>
          </div>

          {/* Unified 10-Weapon & Optic Arsenal Dock */}
          <div className="border-t border-slate-800 bg-[#0B1222] px-3 sm:px-4 py-2 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {OPTIC_CATALOG.map((item) => {
                const isActive = selectedTool === item.type;
                const canAfford = hud.energy >= item.cost;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedTool(item.type)}
                    className={`px-2 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isActive
                        ? item.category === 'gun'
                          ? 'bg-amber-950/50 border-amber-400 text-white'
                          : 'bg-cyan-950/60 border-cyan-400 text-white'
                        : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                      <span className="truncate">
                        [{item.hotkey}] {item.name}
                      </span>
                      <span
                        className={`font-mono shrink-0 ${
                          canAfford ? 'text-amber-300' : 'text-rose-400'
                        }`}
                      >
                        {item.cost}⚡
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{item.roleClue}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {selectedOptic && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-700 bg-slate-900">
                    {(selectedOptic.type === 'mirror' || selectedOptic.type === 'prism') && (
                      <>
                        <button
                          type="button"
                          onClick={() => rotateOpticById(selectedOptic.id, -1)}
                          aria-label="Xoay trái"
                          title="Xoay trái [Q]"
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-center cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotateOpticById(selectedOptic.id, 1)}
                          aria-label="Xoay phải"
                          title="Xoay phải [E]"
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-center cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={upgradeSelectedOptic}
                      disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                      className={`h-7 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                        selectedUpgradeCost !== null && hud.energy >= selectedUpgradeCost
                          ? 'bg-amber-400 text-[#070B14] hover:bg-amber-300'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {selectedUpgradeCost === null
                        ? 'Max Lv3'
                        : `Nâng Lv${(selectedOptic.level + 1) as 2 | 3} (${selectedUpgradeCost}⚡)`}
                    </button>
                    <button
                      type="button"
                      onClick={sellSelectedOptic}
                      aria-label="Bán thiết bị"
                      className="h-7 px-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>+{selectedSellRefund}⚡</span>
                    </button>
                  </div>
                )}
                {statusNotice && (
                  <p className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                    {statusNotice}
                  </p>
                )}
              </div>

              <button
                type="button"
                data-testid="prism-wave-btn"
                onClick={launchNextWave}
                disabled={hud.waveActive || hud.wave >= hud.totalWaves}
                className={`min-h-[40px] px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  hud.waveActive
                    ? 'bg-slate-800 text-slate-300 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-[#070B14]'
                }`}
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>
                  {hud.waveActive
                    ? `Đang giao tranh Đợt ${hud.wave}/${hud.totalWaves}...`
                    : `Gọi Đợt ${hud.wave + 1}/${hud.totalWaves} (Tự gọi: ${hud.nextWaveCountdown}s)`}
                </span>
              </button>
            </div>
          </div>

          {/* PAUSED MODAL */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#070B14]/90 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border border-cyan-500/50 bg-[#0F172A] p-6 text-center space-y-4">
                <h2 className="font-serif text-xl font-bold text-white">
                  Tạm Dừng Mạch Laser
                </h2>
                <p className="text-xs font-mono text-slate-300 tabular-nums">
                  {activeMap.name} · Đợt {hud.wave}/{hud.totalWaves} · Điểm {hud.score}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setGameState('playing')}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070B14] font-bold text-sm cursor-pointer"
                  >
                    Tiếp Tục Trò Chơi
                  </button>
                  <button
                    type="button"
                    onClick={() => startNewRun(selectedMapIndex)}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium hover:border-cyan-400 cursor-pointer"
                  >
                    Chơi Lại Mạch Này
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameState('title')}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:text-white cursor-pointer"
                  >
                    Về Màn Hình Chọn Bản Đồ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAMEOVER / VICTORY MODAL */}
      {gameState === 'gameover' && (
        <div className="p-6 sm:p-10 text-center max-w-xl mx-auto space-y-5">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              hud.outcome === 'victory'
                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
            }`}
          >
            {hud.outcome === 'victory' ? (
              <Trophy className="w-8 h-8" />
            ) : (
              <Shield className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-cyan-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hud.outcome === 'victory' ? 'BẢO VỆ LÕI THÀNH CÔNG' : 'LÕI QUANG HỌC QUÁ TẢI'}</span>
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {hud.outcome === 'victory'
                ? `Hoàn Thành ${activeMap.name}!`
                : `Thất Thủ Tại Đợt ${hud.wave}/${hud.totalWaves}`}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-slate-800 bg-[#0F172A] p-4 font-mono tabular-nums">
            <div>
              <p className="text-[11px] text-slate-400">Đợt</p>
              <p className="text-base font-bold text-cyan-300">
                {hud.wave}/{hud.totalWaves}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Quái Hạ</p>
              <p className="text-base font-bold text-amber-300">{hud.kills}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Điểm</p>
              <p className="text-base font-bold text-white">{hud.score}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Kỷ Lục</p>
              <p className="text-base font-bold text-emerald-400">{hud.bestScore}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={() => startNewRun(selectedMapIndex)}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070B14] font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>
            <button
              type="button"
              onClick={() => setGameState('title')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-700 bg-[#0F172A] text-sm font-medium text-slate-200 hover:border-cyan-400 cursor-pointer"
            >
              Chọn Bản Đồ Khác
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
