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
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createEnemyForWave,
  DIR_VECTORS,
  getOpticSellRefund,
  getOpticUpgradeCost,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  LaserSegment,
  OPTIC_CATALOG,
  OpticType,
  PlacedOptic,
  PRISM_MAPS,
  PrismMapDef,
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
  overdrivePct: number;
  overdriveActive: boolean;
  speedMult: 1 | 2;
  outcome: 'victory' | 'defeat' | null;
}

const SAVE_BEST_KEY = 'thuanle-prism-td-best-v1';
const PARTICLE_POOL_SIZE = 96;

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
  }));
}

function playSynthFx(
  kind: 'place' | 'rotate' | 'upgrade' | 'sell' | 'kill' | 'wave' | 'overdrive' | 'hurt' | 'victory' | 'defeat',
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
    const tone = (f1: number, f2: number, dur: number, vol: number, type: OscillatorType = 'sine', delay = 0) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f1, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), now + delay + dur);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    if (kind === 'place') {
      tone(380, 620, 0.09, 0.14, 'triangle');
    } else if (kind === 'rotate') {
      tone(520, 720, 0.06, 0.1, 'sine');
    } else if (kind === 'upgrade') {
      tone(440, 880, 0.14, 0.16, 'triangle', 0);
      tone(660, 1100, 0.14, 0.14, 'sine', 0.06);
    } else if (kind === 'sell') {
      tone(480, 260, 0.1, 0.12, 'triangle');
    } else if (kind === 'kill') {
      const jitter = 0.94 + Math.random() * 0.12;
      tone(640 * jitter, 240 * jitter, 0.09, 0.1, 'triangle');
    } else if (kind === 'wave') {
      tone(330, 520, 0.14, 0.14, 'triangle', 0);
      tone(520, 780, 0.18, 0.14, 'sine', 0.09);
    } else if (kind === 'overdrive') {
      tone(240, 960, 0.3, 0.22, 'sawtooth', 0);
      tone(480, 1280, 0.28, 0.16, 'triangle', 0.08);
    } else if (kind === 'hurt') {
      tone(190, 80, 0.2, 0.2, 'sawtooth');
    } else if (kind === 'victory') {
      tone(523.25, 523.25, 0.12, 0.15, 'triangle', 0);
      tone(659.25, 659.25, 0.12, 0.15, 'triangle', 0.12);
      tone(783.99, 1046.5, 0.28, 0.18, 'triangle', 0.24);
    } else if (kind === 'defeat') {
      tone(280, 140, 0.25, 0.18, 'sawtooth', 0);
      tone(180, 75, 0.35, 0.2, 'sawtooth', 0.18);
    }
  } catch {
    // Ignore audio context restriction
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

  const [selectedTool, setSelectedTool] = useState<OpticType>('mirror');
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
    outcome: null,
  }));

  // Isolated mutable 60Hz simulation state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const simRef = useRef<{
    map: PrismMapDef;
    optics: PlacedOptic[];
    segments: LaserSegment[];
    capacitorActiveIds: string[];
    totalDps: number;
    enemies: TdEnemy[];
    spawnQueue: WaveSpawnItem[];
    waveElapsed: number;
    nextEnemyId: number;
    energy: number;
    coreHp: number;
    wave: number;
    waveActive: boolean;
    score: number;
    bestScore: number;
    kills: number;
    totalDamage: number;
    overdriveCharge: number; // 0..100
    overdriveTimer: number; // seconds left
    speedMult: 1 | 2;
    shakeTrauma: number;
    hoverTile: { col: number; row: number } | null;
    selectedOpticId: string | null;
    shockwaves: ShockwaveRing[];
    particles: PooledParticle[];
    particleCursor: number;
    animTime: number;
    outcome: 'victory' | 'defeat' | null;
  }>({
    map: activeMap,
    optics: createInitialOptics(activeMap),
    segments: [],
    capacitorActiveIds: [],
    totalDps: 0,
    enemies: [],
    spawnQueue: [],
    waveElapsed: 0,
    nextEnemyId: 1,
    energy: activeMap.startEnergy,
    coreHp: activeMap.startCoreHp,
    wave: 0,
    waveActive: false,
    score: 0,
    bestScore: loadBestScore(),
    kills: 0,
    totalDamage: 0,
    overdriveCharge: 0,
    overdriveTimer: 0,
    speedMult: 1,
    shakeTrauma: 0,
    hoverTile: null,
    selectedOpticId: null,
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

  const recomputeLasers = useCallback(() => {
    const s = simRef.current;
    const res = traceLaserNetwork(s.map, s.optics, s.overdriveTimer > 0);
    s.segments = res.segments;
    s.capacitorActiveIds = res.capacitorActiveIds;
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
      overdrivePct: Math.min(100, Math.round(s.overdriveCharge)),
      overdriveActive: s.overdriveTimer > 0,
      speedMult: s.speedMult,
      outcome: s.outcome,
    });
  }, []);

  const emitParticles = useCallback((x: number, y: number, color: string, count: number, speed = 90) => {
    const s = simRef.current;
    for (let i = 0; i < count; i++) {
      const slot = s.particles[s.particleCursor];
      s.particleCursor = (s.particleCursor + 1) % PARTICLE_POOL_SIZE;
      const angle = Math.random() * Math.PI * 2;
      const mag = speed * (0.4 + Math.random() * 0.8);
      slot.active = true;
      slot.x = x;
      slot.y = y;
      slot.vx = Math.cos(angle) * mag;
      slot.vy = Math.sin(angle) * mag;
      slot.life = 0.28 + Math.random() * 0.22;
      slot.maxLife = slot.life;
      slot.size = 1.8 + Math.random() * 2.2;
      slot.color = color;
    }
  }, []);

  const startNewRun = useCallback(
    (mapIdx = selectedMapIndex) => {
      const targetMap = PRISM_MAPS[mapIdx] ?? PRISM_MAPS[0];
      const s = simRef.current;
      s.map = targetMap;
      s.optics = createInitialOptics(targetMap);
      s.enemies = [];
      s.spawnQueue = [];
      s.waveElapsed = 0;
      s.nextEnemyId = 1;
      s.energy = targetMap.startEnergy;
      s.coreHp = targetMap.startCoreHp;
      s.wave = 0;
      s.waveActive = false;
      s.score = 0;
      s.kills = 0;
      s.totalDamage = 0;
      s.overdriveCharge = 35; // Start with some charge so players reach overdrive quickly
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
      setStatusNotice('Hãy đặt thêm Gương / Lăng Kính rồi nhấn Gọi Đợt 1!');
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

  // Sync body dataset state
  useEffect(() => {
    document.body.dataset.state = gameState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [gameState]);

  // Initialize lasers on mount / autostart
  useEffect(() => {
    recomputeLasers();
    syncHudFromSim();
  }, [recomputeLasers, syncHudFromSim]);

  const launchNextWave = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.waveActive || s.outcome) return;
    if (s.wave >= s.map.totalWaves) return;

    const nextWave = s.wave + 1;
    s.wave = nextWave;
    s.waveActive = true;
    s.waveElapsed = 0;
    s.spawnQueue = buildWaveSpawns(nextWave);
    setStatusNotice(`Đợt ${nextWave}/${s.map.totalWaves} đang tiến công!`);
    playSynthFx('wave', soundEnabled, audioCtxRef);
    syncHudFromSim();
  }, [gameState, soundEnabled, syncHudFromSim]);

  const activateOverdrive = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.overdriveCharge < 100 || s.overdriveTimer > 0) return;
    s.overdriveCharge = 0;
    s.overdriveTimer = 4.5;
    s.shakeTrauma = 0.45;
    recomputeLasers();
    syncHudFromSim();
    setStatusNotice('QUÁ TẢI LASER ×2.2 ĐÃ KÍCH HOẠT (4.5s)!');
    playSynthFx('overdrive', soundEnabled, audioCtxRef);
  }, [gameState, recomputeLasers, syncHudFromSim, soundEnabled]);

  const rotateOpticById = useCallback(
    (opticId: string | null, delta: 1 | -1) => {
      if (!opticId || gameState !== 'playing') return;
      const s = simRef.current;
      const target = s.optics.find((o) => o.id === opticId);
      if (!target) return;
      if (target.type === 'amp' || target.type === 'capacitor') {
        setStatusNotice('Thiết bị này truyền thẳng đa hướng, không cần xoay!');
        return;
      }
      target.rot = (((target.rot + delta) % 8) + 8) % 8;
      recomputeLasers();
      syncHudFromSim();
      const pt = gridToWorldCenter(target.col, target.row);
      emitParticles(pt.x, pt.y, '#00E5FF', 5, 65);
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
      setStatusNotice('Thiết bị đã đạt Cấp Tối Đa (Lv3)!');
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
    emitParticles(pt.x, pt.y, '#FBBF24', 10, 95);
    playSynthFx('upgrade', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã nâng cấp lên Cấp ${target.level}!`);
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
    emitParticles(pt.x, pt.y, '#94A3B8', 8, 70);
    playSynthFx('sell', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã thu hồi thiết bị (+${refund}⚡).`);
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
      setStatusNotice('Không thể đặt thiết bị lên đường đi quái, nguồn phát hoặc vách đá!');
      return;
    }

    const spec = OPTIC_CATALOG.find((c) => c.type === selectedTool)!;
    if (s.energy < spec.cost) {
      setStatusNotice(`Không đủ Năng Lượng! Cần ${spec.cost}⚡ cho ${spec.name}.`);
      return;
    }

    const defaultRot = selectedTool === 'mirror' ? 6 : selectedTool === 'prism' ? 0 : 0;
    const created: PlacedOptic = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      col: tile.col,
      row: tile.row,
      type: selectedTool,
      rot: defaultRot,
      level: 1,
      chargeTimer: 0,
      hitCount: 0,
    };

    s.energy -= spec.cost;
    s.optics.push(created);
    s.selectedOpticId = created.id;
    setSelectedOpticId(created.id);
    recomputeLasers();
    syncHudFromSim();

    const pt = gridToWorldCenter(tile.col, tile.row);
    emitParticles(pt.x, pt.y, '#38BDF8', 8, 80);
    playSynthFx('place', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã lắp ${spec.name}! Nhấp lại để xoay góc tia.`);
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

  // Keyboard shortcuts
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
      else if (e.key === '4') setSelectedTool('capacitor');
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

  // Title Screen animated laser showcase canvas
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

          // Dark circuit surface
          ctx.fillStyle = '#070B14';
          ctx.fillRect(0, 0, w, h);

          // Subtle grid
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
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

          // Emitter -> Mirror -> Amplifier -> Prism 3-way fan!
          const em = { x: 46, y: 125 };
          const mir = { x: 165, y: 125 };
          const amp = { x: 165, y: 60 };
          const prism = { x: 280, y: 60 };
          const sway = Math.sin(t * 1.4) * 14;

          const drawBeam = (x1: number, y1: number, x2: number, y2: number, glow: string, core: string, width: number) => {
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

            // Traveling pulse dot
            const p = (t * 0.9) % 1;
            const px = x1 + (x2 - x1) * p;
            const py = y1 + (y2 - y1) * p;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px, py, width * 0.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          };

          // Primary cyan beam
          drawBeam(em.x, em.y, mir.x, mir.y, 'rgba(0, 229, 255, 0.25)', '#00E5FF', 3.5);
          // Reflected up to amplifier
          drawBeam(mir.x, mir.y, amp.x, amp.y, 'rgba(0, 229, 255, 0.25)', '#00E5FF', 3.5);
          // Amplified gold beam into prism
          drawBeam(amp.x, amp.y, prism.x, prism.y, 'rgba(251, 191, 36, 0.28)', '#FBBF24', 5);
          // 3-way prism fan!
          drawBeam(prism.x, prism.y, 404, 34 + sway * 0.4, 'rgba(251, 113, 133, 0.26)', '#FB7185', 3.2);
          drawBeam(prism.x, prism.y, 404, 108 + sway * 0.6, 'rgba(251, 191, 36, 0.26)', '#FBBF24', 3.2);
          drawBeam(prism.x, prism.y, 380, 224 + sway * 0.5, 'rgba(56, 189, 248, 0.26)', '#38BDF8', 3.2);

          // Nodes
          // Emitter
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = '#00E5FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(em.x, em.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Mirror bar
          ctx.save();
          ctx.translate(mir.x, mir.y);
          ctx.rotate(-Math.PI / 4);
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(-16, -3.5, 32, 7);
          ctx.fillStyle = '#00E5FF';
          ctx.fillRect(-16, -3.5, 32, 2.5);
          ctx.restore();

          // Amplifier coil
          ctx.fillStyle = '#1E293B';
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(amp.x, amp.y, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Prism triangle
          ctx.fillStyle = 'rgba(167, 139, 250, 0.35)';
          ctx.strokeStyle = '#C4B5FD';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(prism.x, prism.y - 16);
          ctx.lineTo(prism.x + 15, prism.y + 12);
          ctx.lineTo(prism.x - 15, prism.y + 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
      rafId = window.requestAnimationFrame(renderTitlePreview);
    };

    rafId = window.requestAnimationFrame(renderTitlePreview);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState]);

  // Main 60Hz Canvas Simulation + Renderer
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'paused') return;
    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAccum = 0;

    const tickAndDraw = (now: number) => {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);
      const s = simRef.current;

      if (gameState === 'playing') {
        const simDt = dt * s.speedMult;
        s.animTime += simDt;

        // Overdrive decay
        if (s.overdriveTimer > 0) {
          s.overdriveTimer = Math.max(0, s.overdriveTimer - simDt);
          if (s.overdriveTimer === 0) {
            recomputeLasers();
            syncHudFromSim();
          }
        }

        // Shake decay
        if (s.shakeTrauma > 0) {
          s.shakeTrauma = Math.max(0, s.shakeTrauma - dt * 1.4);
        }

        // Wave enemy spawning
        if (s.waveActive && s.spawnQueue.length > 0) {
          s.waveElapsed += simDt;
          while (s.spawnQueue.length > 0 && s.spawnQueue[0].delaySec <= s.waveElapsed) {
            const item = s.spawnQueue.shift()!;
            s.enemies.push(createEnemyForWave(s.nextEnemyId++, item.kind, s.wave, s.map));
          }
        }

        // Capacitor periodic pulse discharge
        for (const capId of s.capacitorActiveIds) {
          const cap = s.optics.find((o) => o.id === capId);
          if (!cap) continue;
          cap.chargeTimer += simDt;
          const interval = cap.level === 1 ? 1.8 : cap.level === 2 ? 1.45 : 1.15;
          if (cap.chargeTimer >= interval && s.enemies.length > 0) {
            cap.chargeTimer = 0;
            const center = gridToWorldCenter(cap.col, cap.row);
            const pulseRadius = (cap.level === 1 ? 1.75 : cap.level === 2 ? 2.05 : 2.35) * TILE_SIZE;
            const pulseDmg = 18 + cap.level * 12;
            let hitAny = false;
            for (const en of s.enemies) {
              if (en.hp <= 0 || en.koTimer > 0) continue;
              const d = Math.hypot(en.x - center.x, en.y - center.y);
              if (d <= pulseRadius + en.radius) {
                hitAny = true;
                en.slowTimer = Math.max(en.slowTimer, 2.2);
                en.hp -= pulseDmg;
                en.hitFlash = 0.12;
                s.totalDamage += pulseDmg;
                if (en.hp <= 0) {
                  en.hp = 0;
                  en.koTimer = 0.28;
                  s.kills += 1;
                  s.energy += en.reward;
                  s.score += en.scoreValue;
                }
              }
            }
            if (hitAny) {
              s.shockwaves.push({
                x: center.x,
                y: center.y,
                radius: 12,
                maxRadius: pulseRadius,
                alpha: 0.9,
                color: '#38BDF8',
              });
            }
          }
        }

        // Continuous beam damage + movement
        if (s.enemies.length > 0) {
          const beforeKills = s.kills;
          const { coreDamageTaken, outcome } = stepEnemiesWithLasers(s.enemies, s.segments, s.map, simDt);

          if (outcome.killedCount > 0 || outcome.totalDamageDealt > 0) {
            s.kills += outcome.killedCount;
            s.energy += outcome.energyGained;
            s.score += outcome.scoreGained;
            s.totalDamage += outcome.totalDamageDealt;
            if (s.overdriveTimer <= 0) {
              s.overdriveCharge = Math.min(100, s.overdriveCharge + outcome.totalDamageDealt * 0.085);
            }
          }

          if (s.kills > beforeKills) {
            for (const en of s.enemies) {
              if (en.koTimer >= 0.24) {
                emitParticles(en.x, en.y, en.kind === 'boss' ? '#FB7185' : '#FBBF24', en.kind === 'boss' ? 20 : 9, 120);
              }
            }
            playSynthFx('kill', soundEnabled, audioCtxRef);
          }

          if (coreDamageTaken > 0) {
            s.coreHp = Math.max(0, s.coreHp - coreDamageTaken);
            s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.55);
            const corePt = gridToWorldCenter(s.map.path[s.map.path.length - 1].col, s.map.path[s.map.path.length - 1].row);
            emitParticles(corePt.x, corePt.y, '#F43F5E', 14, 130);
            playSynthFx('hurt', soundEnabled, audioCtxRef);
          }

          // Prune finished KO / escaped enemies
          s.enemies = s.enemies.filter((e) => e.hp > 0 || e.koTimer > 0);
        }

        // Update pooled particles & shockwaves
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
          sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 8) + 40 * dt;
          sw.alpha -= dt * 2.2;
          return sw.alpha > 0.02;
        });

        // Check wave completion
        if (s.waveActive && s.spawnQueue.length === 0 && s.enemies.length === 0 && s.coreHp > 0) {
          s.waveActive = false;
          const waveBonus = 25 + s.wave * 6;
          s.energy += waveBonus;
          s.score += s.wave * 100;

          if (s.wave >= s.map.totalWaves) {
            s.outcome = 'victory';
            s.score += Math.round(s.coreHp * 50);
            if (s.score > s.bestScore) {
              s.bestScore = Math.round(s.score);
              saveBestScore(s.bestScore);
            }
            syncHudFromSim();
            setGameState('gameover');
            playSynthFx('victory', soundEnabled, audioCtxRef);
            return;
          } else {
            setStatusNotice(`Hoàn thành Đợt ${s.wave}! (+${waveBonus}⚡). Sẵn sàng gọi Đợt ${s.wave + 1}.`);
            syncHudFromSim();
          }
        }

        // Check defeat
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
        if (hudSyncAccum >= 0.12) {
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

          // Camera shake offset
          const shakeAmt = s.shakeTrauma * s.shakeTrauma * 9;
          const sx = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
          const sy = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
          ctx.translate(sx, sy);

          // 1. Background circuit board
          ctx.fillStyle = '#070C18';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // 2. Grid cells & tile roles
          for (let r = 0; r < s.map.rows; r++) {
            for (let c = 0; c < s.map.cols; c++) {
              const x = c * TILE_SIZE;
              const y = r * TILE_SIZE;
              const kind = getTileKind(s.map, c, r);

              if (kind === 'path' || kind === 'spawn' || kind === 'core') {
                ctx.fillStyle = '#111C33';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
              } else if (kind === 'wall') {
                ctx.fillStyle = '#1E293B';
                ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                // Diagonal block mark
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.32)';
                ctx.beginPath();
                ctx.moveTo(x + 12, y + 12);
                ctx.lineTo(x + TILE_SIZE - 12, y + TILE_SIZE - 12);
                ctx.moveTo(x + TILE_SIZE - 12, y + 12);
                ctx.lineTo(x + 12, y + TILE_SIZE - 12);
                ctx.stroke();
              } else {
                // Buildable optical pedestal socket
                ctx.strokeStyle = 'rgba(51, 65, 85, 0.45)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                ctx.fillStyle = 'rgba(30, 41, 59, 0.35)';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 4, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // 3. Track center glowing lane guide
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 8]);
          ctx.lineDashOffset = -s.animTime * 28;
          ctx.beginPath();
          s.map.path.forEach((wp, i) => {
            const pt = gridToWorldCenter(wp.col, wp.row);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.restore();

          // 4. Spawn & Core markers
          const spawnPt = gridToWorldCenter(s.map.path[0].col, s.map.path[0].row);
          const corePt = gridToWorldCenter(
            s.map.path[s.map.path.length - 1].col,
            s.map.path[s.map.path.length - 1].row
          );

          ctx.save();
          ctx.strokeStyle = '#FB7185';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(spawnPt.x, spawnPt.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FECDD3';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CỔNG', spawnPt.x, spawnPt.y);

          const corePulse = 1 + Math.sin(s.animTime * 4) * 0.08;
          ctx.strokeStyle = '#10B981';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          ctx.beginPath();
          ctx.arc(corePt.x, corePt.y, 21 * corePulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#A7F3D0';
          ctx.fillText('LÕI', corePt.x, corePt.y);
          ctx.restore();

          // 5. Hover preview socket
          if (s.hoverTile && gameState === 'playing') {
            const hx = s.hoverTile.col * TILE_SIZE;
            const hy = s.hoverTile.row * TILE_SIZE;
            const hKind = getTileKind(s.map, s.hoverTile.col, s.hoverTile.row);
            const hasOptic = s.optics.some(
              (o) => o.col === s.hoverTile!.col && o.row === s.hoverTile!.row
            );
            ctx.save();
            ctx.strokeStyle = hasOptic
              ? '#FBBF24'
              : hKind === 'empty'
                ? '#00E5FF'
                : '#F43F5E';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 3, hy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            ctx.restore();
          }

          // 6. Shockwave rings
          for (const sw of s.shockwaves) {
            ctx.save();
            ctx.globalAlpha = sw.alpha;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 7. Laser Beam Network (lineTo additive glow!)
          ctx.save();
          ctx.lineCap = 'round';
          for (const seg of s.segments) {
            const isOver = seg.overdriven;
            const glowColor =
              seg.tier === 3 || isOver
                ? 'rgba(244, 63, 94, 0.28)'
                : seg.tier === 2
                  ? 'rgba(251, 191, 36, 0.28)'
                  : 'rgba(0, 229, 255, 0.24)';
            const midColor =
              seg.tier === 3 || isOver
                ? '#FB7185'
                : seg.tier === 2
                  ? '#FBBF24'
                  : '#00E5FF';
            const baseWidth = Math.min(8, 2.6 + seg.power / 42);

            // Outer soft glow
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = baseWidth * 3.4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // Mid beam
            ctx.strokeStyle = midColor;
            ctx.lineWidth = baseWidth * 1.4;
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // Hot white core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = Math.max(1.2, baseWidth * 0.45);
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();

            // Traveling energy photon pulse
            const p = (s.animTime * 1.8 + seg.bounceDepth * 0.23) % 1;
            const px = seg.x1 + (seg.x2 - seg.x1) * p;
            const py = seg.y1 + (seg.y2 - seg.y1) * p;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(px, py, baseWidth * 0.72, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 8. Laser Emitters
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
            // Nozzle
            ctx.fillStyle = s.overdriveTimer > 0 ? '#FB7185' : '#00E5FF';
            ctx.fillRect(10, -7, 12, 14);
            // Crystal core
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(-2, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 9. Placed Optics (Mirror / Prism / Amp / Capacitor)
          for (const op of s.optics) {
            const pt = gridToWorldCenter(op.col, op.row);
            const isSelected = op.id === s.selectedOpticId;
            ctx.save();
            ctx.translate(pt.x, pt.y);

            // Selection halo
            if (isSelected) {
              ctx.strokeStyle = '#FBBF24';
              ctx.lineWidth = 2;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.arc(0, 0, 26, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Base pedestal
            ctx.fillStyle = op.hitCount > 0 ? '#162440' : '#0F172A';
            ctx.strokeStyle = op.hitCount > 0 ? '#38BDF8' : '#334155';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 21, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (op.type === 'mirror') {
              // rot (0..7) corresponds to normal angle rot * 22.5° -> blade perpendicular = rot * 22.5° + 90°
              const normalAngle = (op.rot * Math.PI) / 8;
              ctx.save();
              ctx.rotate(normalAngle + Math.PI / 2);
              ctx.fillStyle = '#94A3B8';
              ctx.fillRect(-20, -4, 40, 8);
              ctx.fillStyle = op.hitCount > 0 ? '#00E5FF' : '#E2E8F0';
              ctx.fillRect(-20, -4, 40, 3);
              ctx.restore();
            } else if (op.type === 'prism') {
              const aimAngle = (op.rot * Math.PI) / 4;
              ctx.save();
              ctx.rotate(aimAngle);
              ctx.fillStyle = op.hitCount > 0 ? 'rgba(192, 132, 252, 0.55)' : 'rgba(139, 92, 246, 0.3)';
              ctx.strokeStyle = '#C4B5FD';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.moveTo(16, 0);
              ctx.lineTo(-12, -14);
              ctx.lineTo(-12, 14);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              // 3 tiny output notches
              ctx.fillStyle = '#FDE047';
              ctx.fillRect(13, -2, 5, 4);
              ctx.restore();
            } else if (op.type === 'amp') {
              ctx.strokeStyle = '#FBBF24';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(0, 0, 12, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fillStyle = op.hitCount > 0 ? '#FBBF24' : '#78350F';
              ctx.beginPath();
              ctx.arc(0, 0, 6, 0, Math.PI * 2);
              ctx.fill();
            } else if (op.type === 'capacitor') {
              ctx.strokeStyle = '#38BDF8';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.rect(-10, -10, 20, 20);
              ctx.stroke();
              ctx.fillStyle = op.hitCount > 0 ? '#38BDF8' : '#1E293B';
              ctx.fillRect(-5, -5, 10, 10);
            }

            // Level pips (1..3)
            for (let lv = 0; lv < op.level; lv++) {
              ctx.fillStyle = '#FBBF24';
              ctx.beginPath();
              ctx.arc(-8 + lv * 8, 17, 2.2, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 10. Enemies
          for (const en of s.enemies) {
            ctx.save();
            const isKo = en.koTimer > 0;
            const koAlpha = isKo ? Math.max(0, en.koTimer / 0.28) : 1;
            const koScale = isKo ? 1 + (1 - koAlpha) * 0.45 : 1;
            ctx.globalAlpha = koAlpha;
            ctx.translate(en.x, en.y);
            ctx.scale(koScale, koScale);

            const bodyColor =
              en.hitFlash > 0
                ? '#FFFFFF'
                : en.kind === 'boss'
                  ? '#E11D48'
                  : en.kind === 'armored'
                    ? '#F59E0B'
                    : en.kind === 'splitter'
                      ? '#A855F7'
                      : '#38BDF8';

            const strokeColor = en.slowTimer > 0 ? '#38BDF8' : '#0F172A';

            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = en.slowTimer > 0 ? 3 : 2;

            if (en.kind === 'armored' || en.kind === 'boss') {
              // Hexagon / Octagon heavy chassis
              const sides = en.kind === 'boss' ? 8 : 6;
              ctx.beginPath();
              for (let i = 0; i < sides; i++) {
                const a = (i * Math.PI * 2) / sides;
                const vx = Math.cos(a) * en.radius;
                const vy = Math.sin(a) * en.radius;
                if (i === 0) ctx.moveTo(vx, vy);
                else ctx.lineTo(vx, vy);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Diamond / circle nimble chassis
              ctx.beginPath();
              ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // Crossfire ring cue when hit by 2+ beams!
            if (en.beamsTouching >= 2 && !isKo) {
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, en.radius + 5, 0, Math.PI * 2);
              ctx.stroke();
            }

            // HP Bar
            if (!isKo && en.hp < en.maxHp) {
              const bw = en.radius * 2 + 6;
              const bh = 4;
              const ratio = Math.max(0, en.hp / en.maxHp);
              ctx.fillStyle = '#0F172A';
              ctx.fillRect(-bw / 2, -en.radius - 10, bw, bh);
              ctx.fillStyle = ratio > 0.5 ? '#10B981' : ratio > 0.25 ? '#F59E0B' : '#F43F5E';
              ctx.fillRect(-bw / 2, -en.radius - 10, bw * ratio, bh);
            }
            ctx.restore();
          }

          // 11. Pooled Particles
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
        }
      }

      rafId = window.requestAnimationFrame(tickAndDraw);
    };

    rafId = window.requestAnimationFrame(tickAndDraw);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState, recomputeLasers, syncHudFromSim, emitParticles, soundEnabled]);

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
            <div className="lg:col-span-7 space-y-5">
              {/* Custom Inline SVG Emblem + Lockup */}
              <div className="flex items-center gap-3.5">
                <svg
                  viewBox="0 0 48 48"
                  className="w-11 h-11 shrink-0"
                  aria-hidden="true"
                >
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
                    Prism &amp; Mirror Circuit Tower Defense
                    {hud.bestScore > 0 ? ` · Kỷ lục: ${hud.bestScore}đ` : ''}
                  </p>
                </div>
              </div>

              <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
                Thay vì xây 20 trụ bắn đạn, bản đồ chỉ có 1–2 nguồn phát tia năng lượng gốc. Hãy đặt và xoay{' '}
                <strong className="text-cyan-300">Gương Phản Xạ</strong>,{' '}
                <strong className="text-violet-300">Lăng Kính 1→3</strong>,{' '}
                <strong className="text-amber-300">Bộ Khuếch Đại</strong> và{' '}
                <strong className="text-sky-300">Tụ Xung</strong> để bẻ cong lưới laser quét sạch cả đội hình địch.
              </p>

              {/* Map Selection */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Bản Đồ Mạch Quang Học
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PRISM_MAPS.map((m, idx) => {
                    const active = idx === selectedMapIndex;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMapIndex(idx)}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-cyan-400 bg-cyan-950/40 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="text-[11px] font-mono text-cyan-300 font-semibold">
                          {m.difficultyLabel}
                        </div>
                        <div className="text-xs font-bold mt-0.5 truncate">{m.name}</div>
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

            {/* Live Optical Raytracing Showcase */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-700/80 bg-[#0B1222] p-3 space-y-2.5">
                <canvas
                  ref={titleCanvasRef}
                  aria-label="Mô phỏng tia laser phản xạ qua gương và lăng kính"
                  className="w-full h-auto rounded-lg block border border-slate-800"
                />
                <p className="text-xs text-slate-400 text-center">
                  Giao điểm hai chùm tia tạo hiệu ứng <strong className="text-amber-300">Cộng Hưởng ×1.25 sát thương</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3 text-center">
            Phím 1-4 chọn thiết bị · Nhấp ô trống để đặt · Nhấp gương để xoay · Q/E xoay · Space Quá tải · P Tạm dừng · M Âm thanh
          </p>
        </div>
      )}

      {/* PLAYING / PAUSED SHELL */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="relative">
          {/* Top Unified Optical HUD Strip */}
          <div className="border-b border-slate-800 bg-[#0B1222] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
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
                <div className="text-[10px] font-mono text-slate-400 leading-none">CÔNG SUẤT MẠNG</div>
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

            {/* Right Utility Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={activateOverdrive}
                disabled={hud.overdrivePct < 100 || hud.overdriveActive}
                title="Kích hoạt Quá Tải Laser ×2.2 (Space)"
                className={`h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
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
                className={`h-9 px-2.5 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer ${
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
                className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
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
                className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
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
                className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Arena Canvas Container */}
          <div className="p-2 sm:p-3 bg-[#060913]">
            <div className="max-w-[740px] mx-auto">
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

          {/* Unified Perimeter Optical Build & Wave Dock */}
          <div className="border-t border-slate-800 bg-[#0B1222] px-3 sm:px-5 py-3 space-y-2.5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
              {/* 4 Buildable Optical Devices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                {OPTIC_CATALOG.map((item) => {
                  const isActive = selectedTool === item.type;
                  const canAfford = hud.energy >= item.cost;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedTool(item.type)}
                      className={`px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/60 border-cyan-400 text-white'
                          : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs font-bold">
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
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.roleClue}</p>
                    </button>
                  );
                })}
              </div>

              {/* Contextual Selected Optic Controls + Launch Wave CTA */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedOptic && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-700 bg-slate-900">
                    {(selectedOptic.type === 'mirror' || selectedOptic.type === 'prism') && (
                      <>
                        <button
                          type="button"
                          onClick={() => rotateOpticById(selectedOptic.id, -1)}
                          aria-label="Xoay trái"
                          title="Xoay trái [Q]"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-center cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotateOpticById(selectedOptic.id, 1)}
                          aria-label="Xoay phải"
                          title="Xoay phải [E]"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-center cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={upgradeSelectedOptic}
                      disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                      className={`h-8 px-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                        selectedUpgradeCost !== null && hud.energy >= selectedUpgradeCost
                          ? 'bg-amber-400 text-[#070B14] hover:bg-amber-300'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {selectedUpgradeCost === null ? 'Max Lv3' : `Nâng ${selectedUpgradeCost}⚡`}
                    </button>
                    <button
                      type="button"
                      onClick={sellSelectedOptic}
                      aria-label="Bán thiết bị"
                      title={`Thu hồi +${selectedSellRefund}⚡`}
                      className="h-8 px-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>+{selectedSellRefund}⚡</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={launchNextWave}
                  disabled={hud.waveActive || hud.wave >= hud.totalWaves}
                  className={`min-h-[44px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    hud.waveActive
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-[#070B14]'
                  }`}
                >
                  <Play className="w-4 h-4 shrink-0" />
                  <span>
                    {hud.waveActive
                      ? `Đang giao tranh Đợt ${hud.wave}...`
                      : `Gọi Đợt ${hud.wave + 1}/${hud.totalWaves}`}
                  </span>
                </button>
              </div>
            </div>

            {statusNotice && (
              <p className="text-[11px] font-mono text-slate-400 truncate">
                {statusNotice}
              </p>
            )}
          </div>

          {/* PAUSED MODAL (No backdrop-blur over live canvas) */}
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
