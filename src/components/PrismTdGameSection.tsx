import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import {
  Crosshair,
  FastForward,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  AcidPoolFx,
  applyDamageToEnemy,
  BIOME_PALETTES,
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clampEnemyToTrackCorridor,
  computeTeamSupportBuffAtTile,
  createEnemyForWave,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  DifficultyId,
  FlameConeFx,
  FloatingCombatText,
  GAME_MODE_CONFIGS,
  GAME_MODE_ORDER,
  GameModeId,
  getAvailableGunsForMap,
  getEffectiveMapSetup,
  getExclusiveGunForMap,
  getGunCatalogItem,
  getGunCombatProfile,
  getGunSellRefund,
  getGunUpgradeCost,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  GUN_CATALOG,
  GunType,
  GunVariant,
  isSupportGunType,
  LightningArc,
  MAX_GUN_LEVEL,
  PlacedGun,
  PRISM_MAPS,
  ProjectileItem,
  pullEnemyAlongTrack,
  RailBeamFx,
  ShockwaveRing,
  stepEnemies,
  TargetPriority,
  TdEnemy,
  TdMapDef,
  TILE_SIZE,
  WaveSpawnItem,
} from '../utils/prismTdEngine.ts';
import {
  drawEnemySprite,
  drawGroundCraters,
  drawGunTurretSprite,
  drawOverheatSpecialFx,
  drawProjectileEnhanced,
  drawRailBeamEnhanced,
  drawShellCasings,
  GroundCraterFx,
  OverheatFx,
  ShellCasingFx,
} from '../utils/prismTdRenderer.ts';
import {
  playOverheatSkillSfx,
  playPrismSfx,
  syncPrismSoundMute,
  unlockPrismAudio,
} from '../utils/prismTdSound.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface PrismTdGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
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

interface ImpactFlashFx {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
  spikes: number;
  rot: number;
}

interface FrostShardFx {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rot: number;
  color: string;
}

interface HarmonicRayFx {
  x: number;
  y: number;
  angle: number;
  length: number;
  alpha: number;
  color: string;
}

interface HudSnapshot {
  difficulty: DifficultyId;
  gameMode: GameModeId;
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
  remainingEnemies: number;
  overdrivePct: number;
  overdriveActive: boolean;
  speedMult: 1 | 2 | 3;
  outcome: 'victory' | 'defeat' | null;
  selectedGunVersion: number;
}

const SAVE_BEST_KEY = 'thuanle-gun-td-best-v2';
const PARTICLE_POOL_SIZE = 720;

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

const playSynthFx = playPrismSfx;

const PRIORITY_LABELS: Record<TargetPriority, string> = {
  first: 'Gần Lõi',
  strongest: 'Máu Cao',
  weakest: 'Máu Thấp',
};

function nextPriority(cur: TargetPriority): TargetPriority {
  if (cur === 'first') return 'strongest';
  if (cur === 'strongest') return 'weakest';
  return 'first';
}

export function PrismTdGameSection({ theme, isFullscreen = false }: PrismTdGameSectionProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<DifficultyId>('normal');
  const [gameMode, setGameMode] = useState<GameModeId>('campaign');
  const activeMap = PRISM_MAPS[selectedMapIndex] ?? PRISM_MAPS[0];
  const availableGuns = useMemo(() => getAvailableGunsForMap(activeMap.id), [activeMap.id]);
  const exclusiveGun = useMemo(() => getExclusiveGunForMap(activeMap.id), [activeMap.id]);
  const effectiveSetup = useMemo(
    () => getEffectiveMapSetup(activeMap, difficulty, gameMode),
    [activeMap, difficulty, gameMode]
  );

  const [selectedTool, setSelectedTool] = useState<GunType>('gatling');
  const [selectedVariant, setSelectedVariant] = useState<GunVariant>('alpha');
  const [selectedGunId, setSelectedGunId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [isCompactTheater, setIsCompactTheater] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(orientation: landscape) and (max-height: 540px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 540px)');
    const sync = () => setIsCompactTheater(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const useSidebarTheater = isFullscreen || isCompactTheater;
  const sidebarScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedGunId && useSidebarTheater && sidebarScrollRef.current) {
      sidebarScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedGunId, useSidebarTheater]);

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const initSetup = getEffectiveMapSetup(activeMap, 'normal', 'campaign');
    return {
      difficulty: 'normal',
      gameMode: 'campaign',
      energy: initSetup.startEnergy,
      coreHp: initSetup.startCoreHp,
      maxCoreHp: initSetup.startCoreHp,
      wave: 0,
      totalWaves: initSetup.totalWaves,
      score: 0,
      bestScore: loadBestScore(),
      kills: 0,
      totalDamage: 0,
      totalDps: 0,
      waveActive: false,
      overdrivePct: 0,
      overdriveActive: false,
      speedMult: 1,
      nextWaveCountdown: 8,
      remainingEnemies: 0,
      outcome: null,
      selectedGunVersion: 0,
    };
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPointerTypeRef = useRef<string>('mouse');

  const simRef = useRef<{
    map: TdMapDef;
    difficulty: DifficultyId;
    gameMode: GameModeId;
    totalWaves: number;
    maxCoreHp: number;
    guns: PlacedGun[];
    totalDps: number;
    enemies: TdEnemy[];
    projectiles: ProjectileItem[];
    lightningArcs: LightningArc[];
    railBeams: RailBeamFx[];
    flameCones: FlameConeFx[];
    acidPools: AcidPoolFx[];
    healBeams: { fromX: number; fromY: number; toX: number; toY: number; alpha: number }[];
    muzzleFlashes: MuzzleFlashFx[];
    impactFlashes: ImpactFlashFx[];
    frostShards: FrostShardFx[];
    harmonicRays: HarmonicRayFx[];
    shellCasings: ShellCasingFx[];
    groundCraters: GroundCraterFx[];
    overheatEffects: OverheatFx[];
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
    speedMult: 1 | 2 | 3;
    shakeTrauma: number;
    hoverTile: { col: number; row: number } | null;
    selectedGunId: string | null;
    selectedTool: GunType;
    selectedVariant: GunVariant;
    selectedGunVersion: number;
    shockwaves: ShockwaveRing[];
    particles: PooledParticle[];
    particleCursor: number;
    animTime: number;
    visualTime: number;
    outcome: 'victory' | 'defeat' | null;
  }>({
    map: activeMap,
    difficulty: 'normal',
    gameMode: 'campaign',
    totalWaves: effectiveSetup.totalWaves,
    maxCoreHp: effectiveSetup.startCoreHp,
    guns: [],
    totalDps: 0,
    enemies: [],
    projectiles: [],
    lightningArcs: [],
    railBeams: [],
    flameCones: [],
    acidPools: [],
    healBeams: [],
    muzzleFlashes: [],
    impactFlashes: [],
    frostShards: [],
    harmonicRays: [],
    shellCasings: [],
    groundCraters: [],
    overheatEffects: [],
    floatingTexts: [],
    spawnQueue: [],
    waveElapsed: 0,
    nextWaveTimer: 8,
    nextEnemyId: 1,
    nextProjId: 1,
    energy: effectiveSetup.startEnergy,
    coreHp: effectiveSetup.startCoreHp,
    wave: 0,
    waveActive: false,
    score: 0,
    bestScore: loadBestScore(),
    kills: 0,
    totalDamage: 0,
    overdriveCharge: 45,
    overdriveTimer: 0,
    speedMult: 1,
    shakeTrauma: 0,
    hoverTile: null,
    selectedGunId: null,
    selectedTool: 'gatling',
    selectedVariant: 'alpha',
    selectedGunVersion: 0,
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
      color: '#38BDF8',
    })),
    particleCursor: 0,
    animTime: 0,
    visualTime: 0,
    outcome: null,
  });

  useEffect(() => {
    simRef.current.selectedTool = selectedTool;
  }, [selectedTool]);

  useEffect(() => {
    simRef.current.selectedVariant = selectedVariant;
  }, [selectedVariant]);

  const recomputeFirepower = useCallback(() => {
    const s = simRef.current;
    const overdriveMult = s.overdriveTimer > 0 ? 2.0 : 1;
    let total = 0;
    for (const g of s.guns) {
      const buff = computeTeamSupportBuffAtTile(s.guns, g.col, g.row);
      total +=
        getGunCombatProfile(g.type, g.level, g.variant ?? 'alpha').dpsEstimate *
        buff.speedMult *
        buff.damageMult *
        overdriveMult;
    }
    s.totalDps = Math.round(total);
  }, []);

  const syncHudFromSim = useCallback(() => {
    const s = simRef.current;
    setHud({
      difficulty: s.difficulty,
      gameMode: s.gameMode,
      energy: Math.round(s.energy),
      coreHp: Math.max(0, Math.round(s.coreHp)),
      maxCoreHp: s.maxCoreHp,
      wave: s.wave,
      totalWaves: s.totalWaves,
      score: Math.round(s.score),
      bestScore: Math.round(s.bestScore),
      kills: s.kills,
      totalDamage: Math.round(s.totalDamage),
      totalDps: Math.round(s.totalDps),
      waveActive: s.waveActive,
      nextWaveCountdown: Math.max(0, Math.ceil(s.nextWaveTimer)),
      remainingEnemies: s.spawnQueue.length + s.enemies.filter((e) => e.hp > 0 && e.koTimer <= 0).length,
      overdrivePct: Math.min(100, Math.round(s.overdriveCharge)),
      overdriveActive: s.overdriveTimer > 0,
      speedMult: s.speedMult,
      outcome: s.outcome,
      selectedGunVersion: s.selectedGunVersion,
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
      if (s.floatingTexts.length > 28) s.floatingTexts.shift();
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
    (mapIdx = selectedMapIndex, diff = difficulty, mode = gameMode) => {
      const targetMap = PRISM_MAPS[mapIdx] ?? PRISM_MAPS[0];
      const effective = getEffectiveMapSetup(targetMap, diff, mode);
      const diffCfg = DIFFICULTY_CONFIGS[diff];
      const modeCfg = GAME_MODE_CONFIGS[mode];
      const s = simRef.current;
      s.map = targetMap;
      s.difficulty = diff;
      s.gameMode = mode;
      s.totalWaves = effective.totalWaves;
      s.maxCoreHp = effective.startCoreHp;
      s.guns = [];
      s.enemies = [];
      s.projectiles = [];
      s.lightningArcs = [];
      s.railBeams = [];
      s.flameCones = [];
      s.acidPools = [];
      s.healBeams = [];
      s.muzzleFlashes = [];
      s.impactFlashes = [];
      s.frostShards = [];
      s.harmonicRays = [];
      s.shellCasings = [];
      s.groundCraters = [];
      s.overheatEffects = [];
      s.floatingTexts = [];
      s.spawnQueue = [];
      s.waveElapsed = 0;
      s.nextWaveTimer = modeCfg.waveDelaySec;
      s.nextEnemyId = 1;
      s.nextProjId = 1;
      s.energy = effective.startEnergy;
      s.coreHp = effective.startCoreHp;
      s.wave = 0;
      s.waveActive = false;
      s.score = 0;
      s.kills = 0;
      s.totalDamage = 0;
      s.overdriveCharge = 45;
      s.overdriveTimer = 0;
      s.speedMult = 1;
      s.shakeTrauma = 0;
      s.visualTime = 0;
      s.hoverTile = null;
      s.selectedGunId = null;
      s.selectedGunVersion = 0;
      s.shockwaves = [];
      s.outcome = null;
      for (const p of s.particles) p.active = false;

      setSelectedMapIndex(mapIdx);
      setDifficulty(diff);
      setGameMode(mode);
      setSelectedGunId(null);
      const mapGuns = getAvailableGunsForMap(targetMap.id);
      const mapEx = getExclusiveGunForMap(targetMap.id);
      if (!mapGuns.some((g) => g.type === s.selectedTool)) {
        const fallback = mapEx?.type ?? 'gatling';
        s.selectedTool = fallback;
        setSelectedTool(fallback);
      }
      setStatusNotice(
        `${modeCfg.label} · ${diffCfg.label} (${mode === 'endless' ? '∞' : effective.totalWaves} Đợt) · ${mapGuns.length} Súng (★ ${mapEx?.shortName ?? ''})!`
      );
      recomputeFirepower();
      syncHudFromSim();
      setGameState('playing');
      unlockPrismAudio(audioCtxRef);
      playSynthFx('wave', soundEnabled, audioCtxRef);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [selectedMapIndex, difficulty, gameMode, recomputeFirepower, syncHudFromSim, soundEnabled]
  );

  useEffect(() => {
    if (!availableGuns.some((g) => g.type === selectedTool)) {
      const nextTool = exclusiveGun?.type ?? 'gatling';
      setSelectedTool(nextTool);
      simRef.current.selectedTool = nextTool;
    }
  }, [availableGuns, exclusiveGun, selectedTool]);

  useEffect(() => {
    document.body.dataset.state = gameState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [gameState]);

  useEffect(() => {
    syncPrismSoundMute(soundEnabled, audioCtxRef);
  }, [soundEnabled]);

  useEffect(() => {
    recomputeFirepower();
    syncHudFromSim();
  }, [recomputeFirepower, syncHudFromSim]);

  const launchNextWave = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.waveActive || s.outcome) return;
    if (s.gameMode !== 'endless' && s.wave >= s.totalWaves) return;

    unlockPrismAudio(audioCtxRef);
    const earlyBonus = s.nextWaveTimer > 0.5 ? (s.wave > 0 ? 12 : 8) : 0;
    s.energy += earlyBonus;
    const nextWave = s.wave + 1;
    s.wave = nextWave;
    s.waveActive = true;
    s.waveElapsed = 0;
    s.nextWaveTimer = 0;
    s.spawnQueue = buildWaveSpawns(nextWave, s.totalWaves, s.difficulty, s.gameMode);
    const waveLabel = s.gameMode === 'endless' ? `${nextWave}/∞` : `${nextWave}/${s.totalWaves}`;
    setStatusNotice(
      earlyBonus > 0
        ? `Gọi sớm Đợt ${waveLabel} (+${earlyBonus}⚡)! Nâng súng lên Lv5 / Lv7 / Lv10 để đột phá kỹ năng!`
        : `Đợt ${waveLabel} (${GAME_MODE_CONFIGS[s.gameMode].label} · ${DIFFICULTY_CONFIGS[s.difficulty].label}) tiến công!`
    );
    playSynthFx('wave', soundEnabled, audioCtxRef);
    syncHudFromSim();
  }, [gameState, soundEnabled, syncHudFromSim]);

  const activateOverdrive = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.overdriveCharge < 100 || s.overdriveTimer > 0) return;
    unlockPrismAudio(audioCtxRef);
    s.overdriveCharge = 0;
    s.overdriveTimer = 5.0;
    if (s.speedMult < 2) {
      s.shakeTrauma = 0.65;
    }

    for (const g of s.guns) {
      g.heat = 100; // Immediately unleashes every gun's unique Overheat skill on next combat step!
      const pt = gridToWorldCenter(g.col, g.row);
      s.shockwaves.push({
        x: pt.x,
        y: pt.y,
        radius: 12,
        maxRadius: 110,
        alpha: 0.9,
        color: '#FB7185',
        lineWidth: 3.5,
      });
      emitParticles(pt.x, pt.y, '#FDE047', 14, 155, 1.25);
    }

    for (const en of s.enemies) {
      if (en.hp <= 0 || en.koTimer > 0) continue;
      const res = applyDamageToEnemy(en, 65 + s.wave * 14, { armorPierce: 1 });
      en.slowTimer = Math.max(en.slowTimer, 1.8);
      en.slowFactor = Math.min(en.slowFactor || 1, 0.62);
      if (res.killed) {
        s.kills += 1;
        s.energy += en.reward;
        s.score += en.scoreValue;
        emitParticles(en.x, en.y, '#FBBF24', 18, 150, 1.2);
      }
    }
    s.selectedGunVersion += 1;
    recomputeFirepower();
    syncHudFromSim();
    setStatusNotice('HỘI TỤ HỎA LỰC ×1.75 ĐÃ KÍCH HOẠT! Toàn bộ ụ súng kích nổ kỹ năng Quá Nhiệt!');
    playSynthFx('overdrive', soundEnabled, audioCtxRef);
  }, [gameState, recomputeFirepower, syncHudFromSim, soundEnabled, emitParticles]);

  const cycleSelectedPriority = useCallback(() => {
    if (!selectedGunId || gameState !== 'playing') return;
    const s = simRef.current;
    const target = s.guns.find((g) => g.id === selectedGunId);
    if (!target) return;
    target.priority = nextPriority(target.priority);
    s.selectedGunVersion += 1;
    syncHudFromSim();
    playSynthFx('select', soundEnabled, audioCtxRef);
    setStatusNotice(`Chế độ khóa mục tiêu: ${PRIORITY_LABELS[target.priority]}`);
  }, [selectedGunId, gameState, syncHudFromSim, soundEnabled]);

  const switchSelectedGunVariant = useCallback(
    (nextVar?: GunVariant) => {
      if (!selectedGunId || gameState !== 'playing') return;
      const s = simRef.current;
      const target = s.guns.find((g) => g.id === selectedGunId);
      if (!target) return;
      const cur = target.variant ?? 'alpha';
      const chosen = nextVar ?? (cur === 'alpha' ? 'omega' : 'alpha');
      if (chosen === cur) return;
      target.variant = chosen;
      s.selectedGunVersion += 1;
      recomputeFirepower();
      syncHudFromSim();
      const pt = gridToWorldCenter(target.col, target.row);
      const spec = getGunCatalogItem(target.type);
      const vSpec = spec.variants[chosen];
      emitParticles(pt.x, pt.y, vSpec.accentColor, 14, 110, 1.1);
      pushCombatText(pt.x, pt.y - 8, vSpec.shortTag, vSpec.accentColor, 1.05);
      playPrismSfx('variant', soundEnabled, audioCtxRef);
      setStatusNotice(`Đã chuyển biến thể sang ${vSpec.name}: ${vSpec.summary}`);
    },
    [selectedGunId, gameState, recomputeFirepower, syncHudFromSim, emitParticles, pushCombatText, soundEnabled]
  );

  const upgradeSelectedGun = useCallback(() => {
    if (!selectedGunId || gameState !== 'playing') return;
    const s = simRef.current;
    const target = s.guns.find((g) => g.id === selectedGunId);
    if (!target) return;
    const cost = getGunUpgradeCost(target.type, target.level);
    if (cost === null) {
      setStatusNotice('Khẩu súng này đã đạt cấp Tối Thượng MAX LV10!');
      return;
    }
    if (s.energy < cost) {
      setStatusNotice(`Cần thêm ${cost - Math.round(s.energy)}⚡ để nâng lên Lv${target.level + 1}!`);
      return;
    }
    s.energy -= cost;
    target.level += 1;
    s.selectedGunVersion += 1;
    recomputeFirepower();
    syncHudFromSim();

    const pt = gridToWorldCenter(target.col, target.row);
    const isMilestone = target.level === 3 || target.level === 5 || target.level === 7 || target.level === 10;
    s.shockwaves.push({
      x: pt.x,
      y: pt.y,
      radius: 10,
      maxRadius: isMilestone ? 92 : 62,
      alpha: 0.95,
      color: target.level === 10 ? '#FDE047' : isMilestone ? '#38BDF8' : '#FBBF24',
      lineWidth: isMilestone ? 3.8 : 2.6,
    });
    emitParticles(pt.x, pt.y, target.level === 10 ? '#FDE047' : '#FBBF24', isMilestone ? 26 : 16, 135, 1.25);
    playSynthFx('upgrade', soundEnabled, audioCtxRef);

    const spec = getGunCatalogItem(target.type);
    const unlocked = spec.milestones.find((m) => m.level === target.level);
    if (unlocked) {
      pushCombatText(pt.x, pt.y - 10, `★ ${unlocked.name}!`, '#FDE047', 1.15);
      setStatusNotice(`ĐỘT PHÁ LV${target.level}: Mở khóa "${unlocked.name}" — ${unlocked.summary}!`);
    } else {
      setStatusNotice(`Đã nâng ${spec.shortName} lên Lv${target.level}/${MAX_GUN_LEVEL}!`);
    }
  }, [selectedGunId, gameState, recomputeFirepower, syncHudFromSim, emitParticles, pushCombatText, soundEnabled]);

  const sellSelectedGun = useCallback(() => {
    if (!selectedGunId || gameState !== 'playing') return;
    const s = simRef.current;
    const idx = s.guns.findIndex((g) => g.id === selectedGunId);
    if (idx === -1) return;
    const target = s.guns[idx];
    const refund = getGunSellRefund(target);
    s.guns.splice(idx, 1);
    s.energy += refund;
    s.selectedGunId = null;
    s.selectedGunVersion += 1;
    setSelectedGunId(null);
    recomputeFirepower();
    syncHudFromSim();
    const pt = gridToWorldCenter(target.col, target.row);
    emitParticles(pt.x, pt.y, '#94A3B8', 12, 85);
    playSynthFx('sell', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã thu hồi trụ súng (+${refund}⚡).`);
  }, [selectedGunId, gameState, recomputeFirepower, syncHudFromSim, emitParticles, soundEnabled]);

  const screenToWorld = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  }, []);

  const screenToGrid = useCallback((clientX: number, clientY: number): { col: number; row: number } | null => {
    const world = screenToWorld(clientX, clientY);
    if (!world) return null;
    const col = Math.floor(world.x / TILE_SIZE);
    const row = Math.floor(world.y / TILE_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }, [screenToWorld]);

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    lastPointerTypeRef.current = e.pointerType || 'mouse';
    if (gameState !== 'playing') return;
    simRef.current.hoverTile = screenToGrid(e.clientX, e.clientY);
  };

  const handleCanvasPointerLeave = () => {
    simRef.current.hoverTile = null;
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    unlockPrismAudio(audioCtxRef);
    const world = screenToWorld(e.clientX, e.clientY);
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile || !world) return;

    const s = simRef.current;
    let existing = s.guns.find((g) => g.col === tile.col && g.row === tile.row);
    if (!existing && lastPointerTypeRef.current === 'touch') {
      let nearestDist = TILE_SIZE * 0.6;
      for (const g of s.guns) {
        const pt = gridToWorldCenter(g.col, g.row);
        const d = Math.hypot(world.x - pt.x, world.y - pt.y);
        if (d <= nearestDist) {
          nearestDist = d;
          existing = g;
        }
      }
    }

    if (existing) {
      s.selectedGunId = existing.id;
      s.selectedGunVersion += 1;
      setSelectedGunId(existing.id);
      syncHudFromSim();
      playSynthFx('select', soundEnabled, audioCtxRef);
      const spec = getGunCatalogItem(existing.type);
      setStatusNotice(`Đang chọn ${spec.name} Lv${existing.level}/${MAX_GUN_LEVEL} · Bấm [U] để nâng cấp!`);
      return;
    }

    const tileKind = getTileKind(s.map, tile.col, tile.row);
    if (tileKind !== 'empty') {
      setStatusNotice('Không thể đặt súng lên đường hành quân hoặc vách đá!');
      return;
    }

    const spec = getGunCatalogItem(selectedTool);
    if (s.energy < spec.cost) {
      setStatusNotice(`Không đủ Năng Lượng! Cần ${spec.cost}⚡ cho ${spec.name}.`);
      return;
    }

    const created: PlacedGun = {
      id: `gun-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      col: tile.col,
      row: tile.row,
      type: selectedTool,
      level: 1,
      variant: selectedVariant,
      priority:
        selectedTool === 'railgun' || selectedTool === 'missile' || selectedTool === 'sniper'
          ? 'strongest'
          : 'first',
      chargeTimer: 0,
      heat: 0,
      overheatTimer: 0,
      aimAngle: -Math.PI / 2,
      recoil: 0,
      totalDamageDealt: 0,
      kills: 0,
    };

    s.energy -= spec.cost;
    s.guns.push(created);
    s.selectedGunId = created.id;
    s.selectedGunVersion += 1;
    setSelectedGunId(created.id);
    recomputeFirepower();
    syncHudFromSim();

    const pt = gridToWorldCenter(tile.col, tile.row);
    s.shockwaves.push({
      x: pt.x,
      y: pt.y,
      radius: 8,
      maxRadius: 48,
      alpha: 0.78,
      color: spec.accentColor,
      lineWidth: 2.2,
    });
    emitParticles(pt.x, pt.y, spec.accentColor, 14, 95);
    playSynthFx('place', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã triển khai ${spec.name} Lv1! Bấm [U] để nâng cấp tới Lv10.`);
  };

  const handleCanvasContextMenu = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile) return;
    const existing = simRef.current.guns.find((g) => g.col === tile.col && g.row === tile.row);
    if (existing) {
      simRef.current.selectedGunId = existing.id;
      setSelectedGunId(existing.id);
      simRef.current.selectedGunVersion += 1;
      syncHudFromSim();
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
        if (e.key === 'p' || e.key === 'P' || (e.key === 'Escape' && !isFullscreen)) {
          e.preventDefault();
          setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
          return;
        }
      }

      if (gameState !== 'playing') return;

      const gunByKey = availableGuns.find(
        (g) => g.hotkey.toLowerCase() === e.key.toLowerCase()
      );
      if (gunByKey) {
        setSelectedTool(gunByKey.type);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        upgradeSelectedGun();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (selectedGunId) {
          switchSelectedGunVariant();
        } else {
          setSelectedVariant((v) => (v === 'alpha' ? 'omega' : 'alpha'));
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        cycleSelectedPriority();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        sellSelectedGun();
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
    isFullscreen,
    availableGuns,
    selectedMapIndex,
    selectedGunId,
    startNewRun,
    upgradeSelectedGun,
    switchSelectedGunVariant,
    cycleSelectedPriority,
    sellSelectedGun,
    activateOverdrive,
    launchNextWave,
  ]);

  // Title Screen Animated Pure-Gun Showcase (Lv10 Mythic Turrets vs Upgraded Armada)
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

          // Tactical grid
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

          // Road track at top/right
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.lineWidth = 28;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(30, 56);
          ctx.lineTo(350, 56);
          ctx.lineTo(350, 195);
          ctx.stroke();

          // Mock Showcase Enemies moving smoothly along lane
          const bossX = 210 + Math.sin(t * 0.9) * 75;
          const bossEnemy: TdEnemy = {
            id: 901,
            kind: 'boss',
            x: bossX,
            y: 56,
            heading: 0,
            waypointIndex: 1,
            hp: 820,
            maxHp: 1000,
            shield: 300,
            maxShield: 350,
            speed: 40,
            radius: 25,
            reward: 80,
            scoreValue: 200,
            armorRatio: 0.4,
            slowTimer: 0,
            slowFactor: 1,
            brittleBonus: 0,
            burnTimer: 0.5,
            burnDps: 0,
            armorShred: 0,
            stunTimer: 0,
            abilityCooldown: 2,
            hitFlash: Math.sin(t * 14) > 0.85 ? 0.1 : 0,
            koTimer: 0,
            isElite: true,
          };
          const escortTank: TdEnemy = {
            ...bossEnemy,
            id: 902,
            kind: 'shieldbearer',
            x: 350,
            y: 132 + Math.cos(t * 1.4) * 34,
            heading: Math.PI / 2,
            radius: 18,
            burnTimer: 0,
            slowTimer: 1,
            brittleBonus: 0.3,
            isElite: false,
          };

          drawEnemySprite(ctx, bossEnemy, t);
          drawEnemySprite(ctx, escortTank, t);

          // Showcase 4 Evolved Lv10 Mythic Turrets (incl. Prism Laser rainbow refraction!)
          const vulcanAngle = Math.atan2(bossEnemy.y - 165, bossEnemy.x - 88);
          const railAngle = Math.atan2(bossEnemy.y - 165, bossEnemy.x - 185);
          const prismPt = { x: 268, y: 165 };

          // Railgun cinematic beam pulsing
          const pulseA = Math.max(0.25, Math.sin(t * 4) * 0.5 + 0.5);
          drawRailBeamEnhanced(
            ctx,
            {
              x1: 185,
              y1: 165,
              x2: bossEnemy.x,
              y2: bossEnemy.y,
              alpha: pulseA,
              color: '#C084FC',
              visualTier: 4,
              variant: 'railgun',
            },
            t
          );

          // Prism Laser Rainbow Refraction Beam
          drawRailBeamEnhanced(
            ctx,
            {
              x1: prismPt.x,
              y1: prismPt.y,
              x2: escortTank.x,
              y2: escortTank.y,
              alpha: 0.85,
              color: '#E879F9',
              visualTier: 4,
              variant: 'prism_laser',
            },
            t
          );

          // Vulcan tracers
          for (let b = 0; b < 3; b++) {
            const frac = (t * 2.4 + b * 0.33) % 1;
            const bx = 88 + (bossEnemy.x - 88) * frac;
            const by = 165 + (bossEnemy.y - 165) * frac;
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.save();
          ctx.translate(88, 165);
          drawGunTurretSprite(ctx, 'gatling', 10, vulcanAngle, 0.25, t, 'alpha', 72, false);
          ctx.restore();

          ctx.save();
          ctx.translate(185, 165);
          drawGunTurretSprite(ctx, 'railgun', 10, railAngle, 0.3, t, 'omega', 100, true);
          ctx.restore();

          ctx.save();
          ctx.translate(prismPt.x, prismPt.y);
          drawGunTurretSprite(
            ctx,
            'prism_laser',
            10,
            Math.atan2(escortTank.y - prismPt.y, escortTank.x - prismPt.x),
            0.1,
            t,
            'alpha',
            54,
            false
          );
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

    const recordKill = (en: TdEnemy, killerGunId?: string) => {
      const s = simRef.current;
      s.kills += 1;
      s.energy += en.reward;
      s.score += en.scoreValue;
      if (killerGunId) {
        const gun = s.guns.find((g) => g.id === killerGunId);
        if (gun) gun.kills += 1;
      }

      const blastColor =
        en.kind === 'boss'
          ? '#FB7185'
          : en.kind === 'armored' || en.kind === 'shieldbearer' || en.kind === 'juggernaut'
            ? '#FBBF24'
            : en.kind === 'healer'
              ? '#4ADE80'
              : en.kind === 'teleporter' || en.kind === 'summoner'
                ? '#C084FC'
                : en.kind === 'berserker'
                  ? '#F97316'
                  : en.kind === 'leech'
                    ? '#22D3EE'
                    : en.kind === 'stealth'
                      ? '#34D399'
                      : '#38BDF8';
      emitParticles(
        en.x,
        en.y,
        blastColor,
        en.kind === 'boss' ? 42 : 16,
        en.kind === 'boss' ? 200 : 135,
        en.kind === 'boss' ? 1.5 : 1.05
      );

      // Splitter splits into 2-3 fast mini cyber-drones strictly inside corridor bounds!
      if (en.kind === 'splitter' && en.radius >= 14) {
        const offsets = s.wave >= 5 ? [-5, 0, 5] : [-4, 4];
        for (const offset of offsets) {
          const child: TdEnemy = {
            ...en,
            id: s.nextEnemyId++,
            x: en.x + Math.cos(en.heading + Math.PI / 2) * offset,
            y: en.y + Math.sin(en.heading + Math.PI / 2) * offset,
            hp: Math.max(28, Math.round(en.maxHp * 0.36)),
            maxHp: Math.max(28, Math.round(en.maxHp * 0.36)),
            shield: 0,
            maxShield: 0,
            speed: en.speed * 1.24,
            radius: 9,
            reward: Math.max(6, Math.round(5 * 1.1)),
            scoreValue: 16,
            koTimer: 0,
            hitFlash: 0.12,
            burnTimer: 0,
            slowTimer: 0,
            stunTimer: 0,
            isElite: false,
          };
          clampEnemyToTrackCorridor(child, s.map);
          s.enemies.push(child);
        }
        emitParticles(en.x, en.y, '#E879F9', 14, 110, 0.9);
      }

      pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', en.kind === 'boss' ? 1.3 : 1);
      if (en.kind === 'boss') {
        if (s.speedMult < 2) {
          s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.65);
        }
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
        s.visualTime += dt;

        if (s.overdriveTimer > 0) {
          s.overdriveTimer = Math.max(0, s.overdriveTimer - simDt);
          if (s.overdriveTimer === 0) {
            recomputeFirepower();
            syncHudFromSim();
          }
        }

        if (s.speedMult >= 2) {
          s.shakeTrauma = 0;
        } else if (s.shakeTrauma > 0) {
          s.shakeTrauma = Math.max(0, s.shakeTrauma - dt * 2.2);
        }

        // 0. Auto-Wave Countdown (honoring Game Mode speed & Endless mode)
        if (!s.waveActive && !s.outcome && (s.gameMode === 'endless' || s.wave < s.totalWaves)) {
          s.nextWaveTimer = Math.max(0, s.nextWaveTimer - dt);
          if (s.nextWaveTimer <= 0) {
            const autoWave = s.wave + 1;
            s.wave = autoWave;
            s.waveActive = true;
            s.waveElapsed = 0;
            s.spawnQueue = buildWaveSpawns(autoWave, s.totalWaves, s.difficulty, s.gameMode);
            setStatusNotice(
              `Tự động gọi Đợt ${autoWave}/${s.gameMode === 'endless' ? '∞' : s.totalWaves}! Nâng cấp súng để bùng nổ hỏa lực!`
            );
            playSynthFx('wave', soundEnabled, audioCtxRef);
            syncHudFromSim();
          }
        }

        // 1. Spawn queue
        if (s.waveActive && s.spawnQueue.length > 0) {
          s.waveElapsed += simDt;
          while (s.spawnQueue.length > 0 && s.spawnQueue[0].delaySec <= s.waveElapsed) {
            const item = s.spawnQueue.shift()!;
            s.enemies.push(
              createEnemyForWave(s.nextEnemyId++, item.kind, s.wave, s.map, item.isElite, s.difficulty, s.gameMode)
            );
          }
        }

        // 2. Pure Gun Turrets Combat Simulation (Lv1 -> Lv10, α/ω Variants, 18 Unique Overheat Ultimates)
        const liveEnemies = s.enemies.filter((e) => e.hp > 0 && e.koTimer <= 0);
        const overdriveSpeedMult = s.overdriveTimer > 0 ? 1.45 : 1;
        const overdriveDmgMult = s.overdriveTimer > 0 ? 1.22 : 1;

        const spawnCasing = (ox: number, oy: number, angle: number, color = '#FBBF24') => {
          if (s.shellCasings.length >= 64) s.shellCasings.shift();
          const ejectA = angle + Math.PI * 0.58 + (Math.random() - 0.5) * 0.45;
          const spd = 48 + Math.random() * 45;
          s.shellCasings.push({
            x: ox + Math.cos(ejectA) * 8,
            y: oy + Math.sin(ejectA) * 8,
            vx: Math.cos(ejectA) * spd,
            vy: Math.sin(ejectA) * spd - 14,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 10),
            life: 0.48,
            maxLife: 0.48,
            color,
          });
        };

        const spawnCrater = (x: number, y: number, radius: number, kind: GroundCraterFx['kind']) => {
          if (s.groundCraters.length >= 24) s.groundCraters.shift();
          s.groundCraters.push({ x, y, radius, life: 2.6, maxLife: 2.6, kind });
        };

        const triggerGunOverheatSkill = (
          gun: PlacedGun,
          origin: { x: number; y: number },
          profile: ReturnType<typeof getGunCombatProfile>,
          shotDmg: number,
          target: TdEnemy | null
        ) => {
          const oh = profile.overheatSkill;
          pushCombatText(origin.x, origin.y - 18, `⚡ ${oh.name}!`, oh.color, 1.06);
          playOverheatSkillSfx(oh.key, gun.type, soundEnabled, audioCtxRef);

          if (gun.type === 'gatling') {
            for (let k = 0; k < 7; k++) {
              const a = gun.aimAngle + (k - 3) * 0.09;
              const mx = origin.x + Math.cos(a) * 22;
              const my = origin.y + Math.sin(a) * 22;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'bullet',
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(a) * 720,
                vy: Math.sin(a) * 720,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.95),
                armorPierce: Math.min(1, profile.armorPierce + 0.25),
                shieldMult: profile.shieldMult,
                splashRadius: 24,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 1,
                life: 0.95,
                maxLife: 0.95,
                age: 0,
                speed: 720,
                color: '#FDE047',
                visualTier: 4,
              });
              spawnCasing(origin.x, origin.y, a, '#FDE047');
            }
            s.muzzleFlashes.push({ x: origin.x + Math.cos(gun.aimAngle) * 24, y: origin.y + Math.sin(gun.aimAngle) * 24, angle: gun.aimAngle, radius: 28, alpha: 1, color: '#FDE047' });
          } else if (gun.type === 'shotgun') {
            for (let k = 0; k < 16; k++) {
              const a = (k * Math.PI * 2) / 16;
              const mx = origin.x + Math.cos(a) * 18;
              const my = origin.y + Math.sin(a) * 18;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'pellet',
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(a) * 510,
                vy: Math.sin(a) * 510,
                targetId: -1,
                damage: Math.round(shotDmg * 0.72),
                armorPierce: Math.min(1, profile.armorPierce + 0.2),
                shieldMult: profile.shieldMult,
                splashRadius: 0,
                pullForce: 0,
                burnDps: Math.max(14, profile.burnDps * 1.4),
                burnDuration: 2.4,
                slowAmount: 0,
                pierceLeft: 1,
                hitIds: [],
                life: 0.55,
                maxLife: 0.55,
                age: 0,
                speed: 510,
                color: '#FB7185',
                visualTier: 4,
              });
            }
            s.impactFlashes.push({ x: origin.x, y: origin.y, radius: 46, alpha: 0.95, color: '#FB7185', spikes: 8, rot: s.animTime });
          } else if (gun.type === 'flamer') {
            const fxRange = profile.rangePx * 1.32;
            s.overheatEffects.push({ kind: 'phoenix', x: origin.x, y: origin.y, radius: fxRange, angle: gun.aimAngle, life: 0.85, maxLife: 0.85, color: '#F97316' });
            s.flameCones.push({ x: origin.x, y: origin.y, angle: gun.aimAngle, range: fxRange, halfArc: Math.PI, alpha: 1, visualTier: 4, isNova360: true });
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - origin.x, en.y - origin.y) <= fxRange + en.radius) {
                en.burnTimer = Math.max(en.burnTimer, 3.6);
                en.burnDps = Math.max(en.burnDps, Math.round(profile.burnDps * 1.8));
                en.armorShred = Math.max(en.armorShred, 0.35);
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.45), { armorPierce: 0.8, shieldMult: 1.25 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'cryo') {
            const cryoR = profile.rangePx * 1.28;
            s.overheatEffects.push({ kind: 'hex_lattice', x: origin.x, y: origin.y, radius: cryoR, angle: 0, life: 0.9, maxLife: 0.9, color: '#BAE6FD' });
            spawnCrater(origin.x, origin.y, Math.min(82, cryoR * 0.6), 'frost');
            for (let sh = 0; sh < 16; sh++) {
              const sa = (sh * Math.PI * 2) / 16;
              s.frostShards.push({ x: origin.x, y: origin.y, vx: Math.cos(sa) * 320, vy: Math.sin(sa) * 320, life: 0.45, maxLife: 0.45, size: 9, rot: sa, color: '#FFFFFF' });
            }
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - origin.x, en.y - origin.y) <= cryoR + en.radius) {
                en.slowTimer = Math.max(en.slowTimer, 3.2);
                en.slowFactor = Math.min(en.slowFactor || 1, 0.6);
                en.brittleBonus = Math.max(en.brittleBonus, Math.min(0.4, profile.brittleBonus + 0.16));
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.6), { armorPierce: 0.5, shieldMult: 1.3 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'tesla') {
            const webRange = profile.rangePx * 1.35;
            const picked = liveEnemies
              .filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= webRange)
              .slice(0, 6);
            for (const en of picked) {
              const midX = (origin.x + en.x) * 0.5 + (Math.random() * 26 - 13);
              const midY = (origin.y + en.y) * 0.5 + (Math.random() * 26 - 13);
              s.lightningArcs.push({
                points: [{ x: origin.x, y: origin.y }, { x: midX, y: midY }, { x: en.x, y: en.y }],
                alpha: 1,
                color: '#FDE047',
                width: 4.5,
              });
              en.stunTimer = Math.max(en.stunTimer, 0.25);
              en.slowTimer = Math.max(en.slowTimer, 2.0);
              en.slowFactor = Math.min(en.slowFactor || 1, 0.68);
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.35), { armorPierce: 0.6, shieldMult: profile.shieldMult * 1.5 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            }
            s.overheatEffects.push({ kind: 'cyclone', x: origin.x, y: origin.y, radius: 56, angle: 0, life: 0.65, maxLife: 0.65, color: '#38BDF8' });
          } else if (gun.type === 'missile') {
            const cands = liveEnemies.length > 0 ? liveEnemies : [];
            for (let m = 0; m < 6; m++) {
              const lock = cands[m % Math.max(1, cands.length)] ?? target;
              const a = gun.aimAngle + (m - 2.5) * 0.24;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'missile',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 340,
                vy: Math.sin(a) * 340,
                targetId: lock?.id ?? -1,
                damage: Math.round(shotDmg * 0.72),
                armorPierce: Math.min(1, profile.armorPierce + 0.15),
                shieldMult: profile.shieldMult,
                splashRadius: Math.max(76, profile.splashRadius),
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 2.8,
                maxLife: 2.8,
                age: 0,
                speed: 340,
                color: '#FDE047',
                visualTier: 4,
                spawnCluster: true,
              });
            }
          } else if (gun.type === 'railgun') {
            for (let b = -1; b <= 1; b++) {
              const ba = gun.aimAngle + b * 0.085;
              const mx = origin.x + Math.cos(ba) * 24;
              const my = origin.y + Math.sin(ba) * 24;
              const ex = origin.x + Math.cos(ba) * 680;
              const ey = origin.y + Math.sin(ba) * 680;
              s.railBeams.push({ x1: mx, y1: my, x2: ex, y2: ey, alpha: 1.15, color: '#E879F9', visualTier: 4, variant: 'railgun' });
              const segLenSq = (ex - origin.x) ** 2 + (ey - origin.y) ** 2;
              for (const en of liveEnemies) {
                const tProj = Math.max(0, Math.min(1, ((en.x - origin.x) * (ex - origin.x) + (en.y - origin.y) * (ey - origin.y)) / segLenSq));
                const px = origin.x + tProj * (ex - origin.x);
                const py = origin.y + tProj * (ey - origin.y);
                if ((en.x - px) ** 2 + (en.y - py) ** 2 <= (en.radius + 22) ** 2) {
                  spawnCrater(en.x, en.y, 28, 'scorch');
                  const res = applyDamageToEnemy(en, Math.round(shotDmg * 0.82), { armorPierce: 1, shieldMult: 2.0 });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
          } else if (gun.type === 'mortar') {
            const cx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 140;
            const cy = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 140;
            s.overheatEffects.push({ kind: 'vortex', x: cx, y: cy, radius: 96, angle: 0, life: 1.1, maxLife: 1.1, color: '#A855F7' });
            spawnCrater(cx, cy, 52, 'plasma');
            for (const en of liveEnemies) {
              const dist = Math.hypot(en.x - cx, en.y - cy);
              if (dist <= 115 + en.radius) {
                if (en.kind !== 'boss') pullEnemyAlongTrack(en, s.map, cx, cy, 24);
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.45), { armorPierce: 0.75, shieldMult: 1.4 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'sniper') {
            const highTargets = liveEnemies
              .filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.25)
              .sort((a, b) => b.hp + b.shield - (a.hp + a.shield))
              .slice(0, 3);
            for (const ht of highTargets) {
              s.overheatEffects.push({ kind: 'target_lock', x: origin.x, y: origin.y, tx: ht.x, ty: ht.y, radius: 18, angle: 0, life: 0.75, maxLife: 0.75, color: '#F43F5E' });
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: ht.x, y2: ht.y, alpha: 1, color: '#F43F5E', visualTier: 4, variant: 'sniper' });
              const critDmg = Math.round(shotDmg * 2.1);
              const res = applyDamageToEnemy(ht, critDmg, { armorPierce: 1, shieldMult: 1.8 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.actualDamage > 0) pushCombatText(ht.x, ht.y - 12, `EXEC! -${res.actualDamage}`, '#F43F5E', 1.18);
              if (res.killed) recordKill(ht, gun.id);
            }
          } else if (gun.type === 'acid') {
            const inR = liveEnemies.filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.15).slice(0, 3);
            for (const en of inR) {
              if (s.acidPools.length >= 16) s.acidPools.shift();
              s.acidPools.push({
                x: en.x,
                y: en.y,
                radius: Math.max(66, profile.splashRadius * 1.25),
                life: 4.5,
                maxLife: 4.5,
                dps: Math.max(22, profile.burnDps * 1.6),
                shred: 0.55,
                slowPct: Math.min(0.36, profile.slowPct + 0.08),
                tickAccum: 0.25,
                sourceGunId: gun.id,
                visualTier: 4,
              });
              emitParticles(en.x, en.y, '#BEF264', 14, 130, 1.2);
            }
          } else if (gun.type === 'saw') {
            for (let sw = 0; sw < 4; sw++) {
              const a = gun.aimAngle + (sw - 1.5) * 0.42;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'sawblade',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 520,
                vy: Math.sin(a) * 520,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.9),
                armorPierce: 0.7,
                shieldMult: profile.shieldMult,
                splashRadius: 0,
                pullForce: 0,
                burnDps: Math.max(12, profile.burnDps),
                burnDuration: 2,
                slowAmount: 0,
                pierceLeft: 0,
                bounceLeft: 8,
                hitIds: [],
                life: 3.1,
                maxLife: 3.1,
                age: 0,
                speed: 520,
                color: '#FDE047',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'beacon') {
            s.overheatEffects.push({ kind: 'solar_flare', x: origin.x, y: origin.y, radius: profile.rangePx * 1.1, angle: 0, life: 0.75, maxLife: 0.75, color: '#FDE047' });
            s.energy += 8;
            pushCombatText(origin.x, origin.y - 28, '+8⚡ Tản Nhiệt Đồng Minh!', '#FDE047', 1);
            for (const ally of s.guns) {
              if (ally.id === gun.id) continue;
              const apt = gridToWorldCenter(ally.col, ally.row);
              if (Math.hypot(apt.x - origin.x, apt.y - origin.y) <= profile.rangePx * 1.25) {
                ally.heat = Math.max(0, (ally.heat ?? 0) - 25);
              }
            }
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - origin.x, en.y - origin.y) <= profile.rangePx * 1.15) {
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.8), { armorPierce: 0.85, shieldMult: 1.6 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'amp_spire') {
            s.overheatEffects.push({ kind: 'supply_pulse', x: origin.x, y: origin.y, radius: profile.rangePx * 1.22, angle: 0, life: 0.85, maxLife: 0.85, color: '#34D399' });
            s.energy += 18;
            let healedCore = false;
            if (gun.level >= 7 && s.coreHp < s.maxCoreHp) {
              s.coreHp = Math.min(s.maxCoreHp, s.coreHp + 1);
              healedCore = true;
            }
            pushCombatText(origin.x, origin.y - 28, healedCore ? '+18⚡ · +1 Lõi · Tản Nhiệt Team!' : '+18⚡ · Tiếp Năng Đồng Minh!', '#34D399', 1.05);
            for (const ally of s.guns) {
              if (ally.id === gun.id) continue;
              const apt = gridToWorldCenter(ally.col, ally.row);
              if (Math.hypot(apt.x - origin.x, apt.y - origin.y) <= profile.rangePx * 1.25) {
                ally.heat = Math.max(0, (ally.heat ?? 0) - 40);
                ally.chargeTimer += 0.3;
              }
            }
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - origin.x, en.y - origin.y) <= profile.rangePx * 1.15) {
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.5), { armorPierce: 0.8, shieldMult: 1.4 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'radar') {
            const scanR = profile.rangePx * 1.4;
            s.overheatEffects.push({ kind: 'radar_sweep', x: origin.x, y: origin.y, radius: scanR, angle: gun.aimAngle, life: 0.85, maxLife: 0.85, color: '#22D3EE' });
            const targets = liveEnemies
              .filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= scanR)
              .sort((a, b) => b.hp + b.shield - (a.hp + a.shield));
            targets.slice(0, 4).forEach((tEn) => {
              s.overheatEffects.push({ kind: 'target_lock', x: tEn.x, y: tEn.y, radius: tEn.radius + 14, angle: 0, life: 0.9, maxLife: 0.9, color: '#22D3EE' });
            });
            for (const en of targets) {
              en.slowTimer = Math.max(en.slowTimer, 3.2);
              en.slowFactor = Math.min(en.slowFactor || 1, 0.72);
              en.armorShred = Math.max(en.armorShred, 0.35);
              en.brittleBonus = Math.max(en.brittleBonus, 0.35);
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.6), { armorPierce: 0.95, shieldMult: 1.65 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            }
            pushCombatText(origin.x, origin.y - 28, `RADAR KHÓA ${targets.length} MỤC TIÊU!`, '#22D3EE', 1.04);
          } else if (gun.type === 'aegis_field') {
            const domeR = profile.rangePx * 1.25;
            s.overheatEffects.push({ kind: 'aegis_dome', x: origin.x, y: origin.y, radius: domeR, angle: 0, life: 0.95, maxLife: 0.95, color: '#60A5FA' });
            let shieldCore = false;
            if (s.coreHp < s.maxCoreHp) {
              s.coreHp = Math.min(s.maxCoreHp, s.coreHp + 1);
              shieldCore = true;
            }
            for (const ally of s.guns) {
              if (ally.id === gun.id) continue;
              const apt = gridToWorldCenter(ally.col, ally.row);
              if (Math.hypot(apt.x - origin.x, apt.y - origin.y) <= domeR) {
                ally.chargeTimer += 0.5;
              }
            }
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - origin.x, en.y - origin.y) <= domeR + en.radius) {
                en.stunTimer = Math.max(en.stunTimer, 0.65);
                en.slowTimer = Math.max(en.slowTimer, 2.5);
                en.slowFactor = Math.min(en.slowFactor || 1, 0.65);
                const prevWp = s.map.path[Math.max(0, en.waypointIndex - 1)];
                if (prevWp) {
                  const prevPt = gridToWorldCenter(prevWp.col, prevWp.row);
                  pullEnemyAlongTrack(en, s.map, prevPt.x, prevPt.y, 16);
                }
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.7), { armorPierce: 0.75, shieldMult: 2.3 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            pushCombatText(origin.x, origin.y - 28, shieldCore ? 'AEGIS ĐẨY LÙI & +1 LÕI!' : 'AEGIS ĐẨY LÙI ĐỊCH!', '#60A5FA', 1.05);
          } else if (gun.type === 'cannon') {
            for (let c = 0; c < 4; c++) {
              const a = gun.aimAngle + (c - 1.5) * 0.14;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'cannon',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 24,
                y: origin.y + Math.sin(a) * 24,
                vx: Math.cos(a) * 490,
                vy: Math.sin(a) * 490,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.78),
                armorPierce: Math.min(1, profile.armorPierce + 0.18),
                shieldMult: profile.shieldMult,
                splashRadius: Math.max(76, profile.splashRadius),
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0.45,
                pierceLeft: 0,
                life: 1.35,
                maxLife: 1.35,
                age: 0,
                speed: 490,
                color: '#FDE047',
                visualTier: 4,
              });
              spawnCasing(origin.x, origin.y, a, '#F59E0B');
            }
          } else if (gun.type === 'plasma') {
            s.overheatEffects.push({ kind: 'vortex', x: origin.x, y: origin.y, radius: 52, angle: 0, life: 0.65, maxLife: 0.65, color: '#F472B6' });
            for (let p = 0; p < 2; p++) {
              const a = gun.aimAngle + (p === 0 ? -0.18 : 0.18);
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'plasma',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 20,
                y: origin.y + Math.sin(a) * 20,
                vx: Math.cos(a) * 410,
                vy: Math.sin(a) * 410,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 1.45),
                armorPierce: 0.7,
                shieldMult: profile.shieldMult * 1.45,
                splashRadius: Math.max(78, profile.splashRadius),
                pullForce: 22,
                burnDps: Math.max(18, profile.burnDps * 1.4),
                burnDuration: 2.5,
                slowAmount: 0,
                pierceLeft: 0,
                life: 1.5,
                maxLife: 1.5,
                age: 0,
                speed: 410,
                color: '#F9A8D4',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'cluster') {
            const cands = liveEnemies.filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.15);
            for (let b = 0; b < 10; b++) {
              const tgt = cands[b % Math.max(1, cands.length)];
              const tx = (tgt?.x ?? (target?.x ?? origin.x + 80)) + (Math.random() * 54 - 27);
              const ty = (tgt?.y ?? (target?.y ?? origin.y)) + (Math.random() * 54 - 27);
              const ang = Math.atan2(ty - origin.y, tx - origin.x);
              const dist = Math.hypot(tx - origin.x, ty - origin.y);
              const spd = Math.max(210, Math.min(360, dist * 2.1));
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'bomblet',
                sourceGunId: gun.id,
                x: origin.x,
                y: origin.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                targetId: -1,
                damage: Math.round(shotDmg * 0.54),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: 52,
                pullForce: 0,
                burnDps: Math.max(12, profile.burnDps),
                burnDuration: 2.0,
                slowAmount: 0,
                pierceLeft: 0,
                life: Math.min(0.65, dist / spd + 0.05),
                maxLife: 0.65,
                age: 0,
                speed: spd,
                color: '#34D399',
                visualTier: 4,
                isClusterBomblet: true,
              });
            }
          } else if (gun.type === 'hunter') {
            const targets = [...liveEnemies].sort((a, b) => {
              const pa = a.kind === 'stealth' || a.kind === 'teleporter' || a.kind === 'healer' || a.kind === 'boss' ? 1 : 0;
              const pb = b.kind === 'stealth' || b.kind === 'teleporter' || b.kind === 'healer' || b.kind === 'boss' ? 1 : 0;
              return pb - pa || b.waypointIndex - a.waypointIndex;
            });
            for (let h = 0; h < 6; h++) {
              const lock = targets[h % Math.max(1, targets.length)] ?? target;
              const a = gun.aimAngle + (h - 2.5) * 0.3;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'hunter',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 470,
                vy: Math.sin(a) * 470,
                targetId: lock?.id ?? -1,
                damage: Math.round(shotDmg * 0.85),
                armorPierce: Math.min(1, profile.armorPierce + 0.2),
                shieldMult: profile.shieldMult * 1.25,
                splashRadius: 28,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 1.35,
                pierceLeft: 0,
                life: 2.4,
                maxLife: 2.4,
                age: 0,
                speed: 470,
                color: '#22D3EE',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'prism_laser') {
            s.overheatEffects.push({ kind: 'rainbow_star', x: origin.x, y: origin.y, radius: 64, angle: 0, life: 0.72, maxLife: 0.72, color: '#E879F9' });
            const spectrum = ['#FB7185', '#FB923C', '#FACC15', '#4ADE80', '#38BDF8', '#818CF8', '#E879F9', '#F472B6'];
            const targets = liveEnemies.filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.25).slice(0, 8);
            targets.forEach((en, idx) => {
              const c = spectrum[idx % spectrum.length];
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: en.x, y2: en.y, alpha: 1.05, color: c, visualTier: 4, variant: 'prism_laser' });
              en.burnTimer = Math.max(en.burnTimer, 2.2);
              en.burnDps = Math.max(en.burnDps, Math.round(profile.burnDps * 1.3));
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.25), { armorPierce: 0.9, shieldMult: 1.75 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            });
          } else if (gun.type === 'tempest') {
            const tx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 120;
            const ty = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 120;
            s.overheatEffects.push({ kind: 'cyclone', x: tx, y: ty, radius: 92, angle: 0, life: 0.95, maxLife: 0.95, color: '#818CF8' });
            for (let q = 0; q < 4; q++) {
              const a = gun.aimAngle + (q - 1.5) * 0.28;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'tempest_orb',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 20,
                y: origin.y + Math.sin(a) * 20,
                vx: Math.cos(a) * 380,
                vy: Math.sin(a) * 380,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 1.05),
                armorPierce: Math.min(1, profile.armorPierce + 0.15),
                shieldMult: profile.shieldMult * 1.35,
                splashRadius: Math.max(76, profile.splashRadius),
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0.34,
                pierceLeft: 0,
                life: 1.8,
                maxLife: 1.8,
                age: 0,
                speed: 380,
                color: '#A5B4FC',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'sonic') {
            const ohR = profile.rangePx * 1.45;
            s.overheatEffects.push({ kind: 'sonic_nova', x: origin.x, y: origin.y, radius: ohR, angle: 0, life: 0.72, maxLife: 0.72, color: '#2DD4BF' });
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - origin.x, en.y - origin.y) <= ohR + en.radius) {
                en.armorShred = Math.max(en.armorShred, 0.5);
                en.slowTimer = Math.max(en.slowTimer, 2.2);
                en.slowFactor = Math.min(en.slowFactor || 1, 0.72);
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.75), { armorPierce: 0.85, shieldMult: profile.shieldMult * 1.35 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'gravity_lance') {
            const tx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 160;
            const ty = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 160;
            s.overheatEffects.push({ kind: 'vortex', x: tx, y: ty, radius: 95, angle: 0, life: 0.95, maxLife: 0.95, color: '#A855F7' });
            const ex = origin.x + Math.cos(gun.aimAngle) * 620;
            const ey = origin.y + Math.sin(gun.aimAngle) * 620;
            s.railBeams.push({ x1: origin.x, y1: origin.y, x2: ex, y2: ey, alpha: 1.1, color: '#A855F7', visualTier: 4, variant: 'gravity_lance' });
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - tx, en.y - ty) <= 110 + en.radius) {
                pullEnemyAlongTrack(en, s.map, tx, ty, 20);
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.85), { armorPierce: 1, shieldMult: 1.75 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'map01_cyber_smg') {
            s.overheatEffects.push({ kind: 'cyclone', x: origin.x, y: origin.y, radius: 52, angle: 0, life: 0.55, maxLife: 0.55, color: '#00E5FF' });
            for (let k = 0; k < 10; k++) {
              const a = gun.aimAngle + (k - 4.5) * 0.08;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'cyber_bolt',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 20,
                y: origin.y + Math.sin(a) * 20,
                vx: Math.cos(a) * 680,
                vy: Math.sin(a) * 680,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.9),
                armorPierce: Math.min(1, profile.armorPierce + 0.25),
                shieldMult: profile.shieldMult * 1.3,
                splashRadius: 18,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0.18,
                pierceLeft: 1,
                hitIds: [],
                life: 0.9,
                maxLife: 0.9,
                age: 0,
                speed: 680,
                color: '#00E5FF',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map02_matrix_spire') {
            s.overheatEffects.push({ kind: 'rainbow_star', x: origin.x, y: origin.y, radius: 66, angle: 0, life: 0.72, maxLife: 0.72, color: '#34D399' });
            const picked = liveEnemies.filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.3).slice(0, 7);
            for (const en of picked) {
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: en.x, y2: en.y, alpha: 1.0, color: '#34D399', visualTier: 4, variant: 'aurora_beam' });
              en.armorShred = Math.max(en.armorShred, 0.28);
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.4), { armorPierce: 0.9, shieldMult: 1.7 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            }
          } else if (gun.type === 'map03_forge_magma') {
            const cx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 120;
            const cy = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 120;
            s.overheatEffects.push({ kind: 'meteor_shower', x: cx, y: cy, radius: 96, angle: gun.aimAngle, life: 0.85, maxLife: 0.85, color: '#F97316' });
            spawnCrater(cx, cy, 56, 'scorch');
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - cx, en.y - cy) <= 105 + en.radius) {
                en.burnTimer = Math.max(en.burnTimer, 3.8);
                en.burnDps = Math.max(en.burnDps, Math.max(24, Math.round(profile.burnDps * 1.7)));
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.6), { armorPierce: 0.82, shieldMult: 1.25 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'map04_void_katana') {
            s.overheatEffects.push({ kind: 'void_slash', x: origin.x, y: origin.y, radius: 64, angle: gun.aimAngle, life: 0.65, maxLife: 0.65, color: '#F43F5E' });
            for (let k = 0; k < 5; k++) {
              const a = gun.aimAngle + (k - 2) * 0.22;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'katana_blade',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 560,
                vy: Math.sin(a) * 560,
                targetId: -1,
                damage: Math.round(shotDmg * 1.15),
                armorPierce: 0.95,
                shieldMult: 1.45,
                splashRadius: 22,
                pullForce: 0,
                burnDps: Math.max(12, profile.burnDps),
                burnDuration: 2.0,
                slowAmount: 0,
                pierceLeft: 4,
                hitIds: [],
                life: 1.0,
                maxLife: 1.0,
                age: 0,
                speed: 560,
                color: '#FB7185',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map05_dune_needler') {
            s.overheatEffects.push({ kind: 'solar_flare', x: origin.x, y: origin.y, radius: 58, angle: 0, life: 0.65, maxLife: 0.65, color: '#FACC15' });
            for (let k = 0; k < 12; k++) {
              const a = (k * Math.PI * 2) / 12;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'dune_needle',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 580,
                vy: Math.sin(a) * 580,
                targetId: -1,
                damage: Math.round(shotDmg * 0.85),
                armorPierce: 0.85,
                shieldMult: 1.25,
                splashRadius: 34,
                pullForce: 0,
                burnDps: Math.max(10, profile.burnDps),
                burnDuration: 2.0,
                slowAmount: 0.22,
                pierceLeft: 1,
                hitIds: [],
                life: 0.85,
                maxLife: 0.85,
                age: 0,
                speed: 580,
                color: '#FACC15',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map06_aurora_beam') {
            s.overheatEffects.push({ kind: 'hex_lattice', x: origin.x, y: origin.y, radius: profile.rangePx * 1.2, angle: 0, life: 0.85, maxLife: 0.85, color: '#7DD3FC' });
            const picked = liveEnemies.filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.25).slice(0, 8);
            for (const en of picked) {
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: en.x, y2: en.y, alpha: 1.0, color: '#7DD3FC', visualTier: 4, variant: 'aurora_beam' });
              en.slowTimer = Math.max(en.slowTimer, 2.8);
              en.slowFactor = Math.min(en.slowFactor || 1, 0.65);
              en.brittleBonus = Math.max(en.brittleBonus, 0.25);
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.35), { armorPierce: 0.88, shieldMult: 1.65 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            }
          } else if (gun.type === 'map07_cyclone_rotary') {
            s.overheatEffects.push({ kind: 'cyclone', x: origin.x, y: origin.y, radius: 58, angle: 0, life: 0.65, maxLife: 0.65, color: '#38BDF8' });
            for (let k = 0; k < 10; k++) {
              const a = gun.aimAngle + (k - 4.5) * 0.085;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'bullet',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 22,
                y: origin.y + Math.sin(a) * 22,
                vx: Math.cos(a) * 700,
                vy: Math.sin(a) * 700,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.88),
                armorPierce: 0.85,
                shieldMult: 1.2,
                splashRadius: 30,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 1,
                hitIds: [],
                life: 0.9,
                maxLife: 0.9,
                age: 0,
                speed: 700,
                color: '#38BDF8',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map08_titan_flak') {
            s.overheatEffects.push({ kind: 'meteor_shower', x: origin.x, y: origin.y, radius: 54, angle: gun.aimAngle, life: 0.65, maxLife: 0.65, color: '#F59E0B' });
            for (let f = 0; f < 5; f++) {
              const a = gun.aimAngle + (f - 2) * 0.16;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'flak_shell',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 22,
                y: origin.y + Math.sin(a) * 22,
                vx: Math.cos(a) * 440,
                vy: Math.sin(a) * 440,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.92),
                armorPierce: 0.88,
                shieldMult: 1.3,
                splashRadius: Math.max(88, profile.splashRadius),
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0.35,
                pierceLeft: 0,
                life: 1.3,
                maxLife: 1.3,
                age: 0,
                speed: 440,
                color: '#F59E0B',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map09_venom_hydra') {
            const cx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 110;
            const cy = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 110;
            s.overheatEffects.push({ kind: 'hydra_burst', x: cx, y: cy, radius: 86, angle: 0, life: 0.85, maxLife: 0.85, color: '#84CC16' });
            if (s.acidPools.length < 18) {
              s.acidPools.push({ x: cx, y: cy, radius: 74, life: 4.5, maxLife: 4.5, dps: Math.max(24, profile.burnDps * 1.5), shred: 0.5, slowPct: 0.28, tickAccum: 0.2, sourceGunId: gun.id, visualTier: 4 });
            }
            for (let h = 0; h < 5; h++) {
              const a = gun.aimAngle + (h - 2) * 0.25;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'hydra_fang',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 390,
                vy: Math.sin(a) * 390,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.95),
                armorPierce: 0.85,
                shieldMult: 1.2,
                splashRadius: Math.max(66, profile.splashRadius),
                pullForce: 0,
                burnDps: Math.max(18, profile.burnDps),
                burnDuration: 2.6,
                slowAmount: 0.26,
                pierceLeft: 0,
                life: 1.8,
                maxLife: 1.8,
                age: 0,
                speed: 390,
                color: '#A3E635',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map10_meteor_rail') {
            for (let b = -1; b <= 1; b++) {
              if (b === 0) continue;
              const ba = gun.aimAngle + b * 0.06;
              const ex = origin.x + Math.cos(ba) * 680;
              const ey = origin.y + Math.sin(ba) * 680;
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: ex, y2: ey, alpha: 1.15, color: '#FB923C', visualTier: 4, variant: 'railgun' });
            }
            const cx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 150;
            const cy = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 150;
            s.overheatEffects.push({ kind: 'meteor_shower', x: cx, y: cy, radius: 102, angle: gun.aimAngle, life: 0.95, maxLife: 0.95, color: '#FB923C' });
            spawnCrater(cx, cy, 56, 'scorch');
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - cx, en.y - cy) <= 105 + en.radius) {
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.9), { armorPierce: 1, shieldMult: 1.8 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          } else if (gun.type === 'map11_cryo_shatter') {
            s.overheatEffects.push({ kind: 'hex_lattice', x: origin.x, y: origin.y, radius: 74, angle: 0, life: 0.8, maxLife: 0.8, color: '#BAE6FD' });
            for (let k = 0; k < 8; k++) {
              const a = gun.aimAngle + (k - 3.5) * 0.2;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'cryo_spike',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 480,
                vy: Math.sin(a) * 480,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.9),
                armorPierce: 0.9,
                shieldMult: 1.35,
                splashRadius: 58,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0.32,
                pierceLeft: 1,
                hitIds: [],
                life: 1.2,
                maxLife: 1.2,
                age: 0,
                speed: 480,
                color: '#BAE6FD',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map12_hellfire_organ') {
            s.overheatEffects.push({ kind: 'phoenix', x: origin.x, y: origin.y, radius: 66, angle: gun.aimAngle, life: 0.78, maxLife: 0.78, color: '#FB7185' });
            const cands = liveEnemies.length > 0 ? liveEnemies : [];
            for (let r = 0; r < 8; r++) {
              const lock = cands[r % Math.max(1, cands.length)] ?? target;
              const a = gun.aimAngle + (r - 3.5) * 0.22;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'hell_rocket',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 355,
                vy: Math.sin(a) * 355,
                targetId: lock?.id ?? -1,
                damage: Math.round(shotDmg * 0.72),
                armorPierce: 0.72,
                shieldMult: 1.3,
                splashRadius: Math.max(82, profile.splashRadius),
                pullForce: 0,
                burnDps: Math.max(18, profile.burnDps * 1.4),
                burnDuration: 2.6,
                slowAmount: 0,
                pierceLeft: 0,
                life: 2.4,
                maxLife: 2.4,
                age: 0,
                speed: 355,
                color: '#FB7185',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map13_shadow_hive') {
            s.overheatEffects.push({ kind: 'vortex', x: origin.x, y: origin.y, radius: 52, angle: 0, life: 0.68, maxLife: 0.68, color: '#C084FC' });
            const targets = [...liveEnemies].sort((a, b) => b.hp + b.shield - (a.hp + a.shield));
            for (let d = 0; d < 6; d++) {
              const lock = targets[d % Math.max(1, targets.length)] ?? target;
              const a = gun.aimAngle + (d - 2.5) * 0.34;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'shadow_drone',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 440,
                vy: Math.sin(a) * 440,
                targetId: lock?.id ?? -1,
                damage: Math.round(shotDmg * 0.95),
                armorPierce: 0.85,
                shieldMult: 1.55,
                splashRadius: 36,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0.2,
                pierceLeft: 0,
                life: 2.4,
                maxLife: 2.4,
                age: 0,
                speed: 440,
                color: '#C084FC',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map14_omega_disruptor') {
            s.overheatEffects.push({ kind: 'cyclone', x: origin.x, y: origin.y, radius: profile.rangePx * 1.15, angle: 0, life: 0.78, maxLife: 0.78, color: '#60A5FA' });
            const picked = liveEnemies.filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= profile.rangePx * 1.3).slice(0, 7);
            for (const en of picked) {
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: en.x, y2: en.y, alpha: 1.0, color: '#60A5FA', visualTier: 4, variant: 'omega_beam' });
              en.stunTimer = Math.max(en.stunTimer, 0.28);
              en.slowTimer = Math.max(en.slowTimer, 2.0);
              en.slowFactor = Math.min(en.slowFactor || 1, 0.7);
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.5), { armorPierce: 0.9, shieldMult: 2.4 });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            }
          } else if (gun.type === 'map15_emerald_reaper') {
            s.overheatEffects.push({ kind: 'emerald_storm', x: origin.x, y: origin.y, radius: 66, angle: 0, life: 0.75, maxLife: 0.75, color: '#34D399' });
            for (let gIdx = 0; gIdx < 4; gIdx++) {
              const a = gun.aimAngle + (gIdx - 1.5) * 0.4;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'reaper_disc',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 530,
                vy: Math.sin(a) * 530,
                targetId: target?.id ?? -1,
                damage: Math.round(shotDmg * 0.95),
                armorPierce: 0.88,
                shieldMult: 1.35,
                splashRadius: 0,
                pullForce: 0,
                burnDps: Math.max(18, profile.burnDps),
                burnDuration: 2.2,
                slowAmount: 0,
                pierceLeft: 0,
                bounceLeft: Math.max(7, profile.chainCount),
                hitIds: [],
                life: 3.1,
                maxLife: 3.1,
                age: 0,
                speed: 530,
                color: '#34D399',
                visualTier: 4,
              });
            }
          } else if (gun.type === 'map16_void_sovereign') {
            const cx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 140;
            const cy = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 140;
            s.overheatEffects.push({ kind: 'sovereign_eclipse', x: cx, y: cy, radius: 108, angle: 0, life: 1.05, maxLife: 1.05, color: '#E879F9' });
            s.railBeams.push({ x1: origin.x, y1: origin.y, x2: cx, y2: cy, alpha: 1.1, color: '#FDE047', visualTier: 4, variant: 'sovereign_beam' });
            for (const en of liveEnemies) {
              if (Math.hypot(en.x - cx, en.y - cy) <= 116 + en.radius) {
                pullEnemyAlongTrack(en, s.map, cx, cy, 18);
                en.burnTimer = Math.max(en.burnTimer, 2.8);
                en.burnDps = Math.max(en.burnDps, Math.max(22, profile.burnDps));
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.85), { armorPierce: 1, shieldMult: 1.8 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
          }
        };

        for (const gun of s.guns) {
          if (gun.recoil > 0) gun.recoil = Math.max(0, gun.recoil - simDt * 5);
          if ((gun.overheatTimer ?? 0) > 0) {
            gun.overheatTimer = Math.max(0, (gun.overheatTimer ?? 0) - simDt);
          }
          const rawProfile = getGunCombatProfile(gun.type, gun.level, gun.variant ?? 'alpha');
          const teamBuff = computeTeamSupportBuffAtTile(s.guns, gun.col, gun.row);
          const profile = teamBuff.hasSupportLink
            ? {
                ...rawProfile,
                rangePx: rawProfile.rangePx + Math.round(teamBuff.rangeBonusTiles * TILE_SIZE),
                armorPierce: Math.min(1, rawProfile.armorPierce + teamBuff.armorPierceBonus),
                shieldMult: Number((rawProfile.shieldMult + teamBuff.shieldMultBonus).toFixed(2)),
              }
            : rawProfile;
          const origin = gridToWorldCenter(gun.col, gun.row);
          const rangeSq = profile.rangePx * profile.rangePx;

          // Target selection honoring TargetPriority
          let target: TdEnemy | null = null;
          let bestScore = -Infinity;
          for (const en of liveEnemies) {
            const dx = en.x - origin.x;
            const dy = en.y - origin.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= rangeSq) {
              let priorityVal = 0;
              if (gun.priority === 'strongest') {
                priorityVal = en.hp + en.shield + en.waypointIndex * 25;
              } else if (gun.priority === 'weakest') {
                priorityVal = -(en.hp + en.shield) + en.waypointIndex * 50;
              } else {
                priorityVal = en.waypointIndex * 250 - Math.hypot(dx, dy);
              }
              if (priorityVal > bestScore) {
                bestScore = priorityVal;
                target = en;
              }
            }
          }

          if (target) {
            gun.aimAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
            if (teamBuff.heatCoolMult > 1 && (gun.heat ?? 0) > 0 && (gun.overheatTimer ?? 0) <= 0) {
              gun.heat = Math.max(0, (gun.heat ?? 0) - simDt * 4 * (teamBuff.heatCoolMult - 1));
            }
          } else if ((gun.heat ?? 0) > 0 && (gun.overheatTimer ?? 0) <= 0) {
            gun.heat = Math.max(0, (gun.heat ?? 0) - simDt * 12 * teamBuff.heatCoolMult);
          }

          gun.chargeTimer += simDt * overdriveSpeedMult * teamBuff.speedMult;

          // Allow manual/overdrive triggered Overheat skill to unleash immediately when heat >= 100
          if ((gun.heat ?? 0) >= 100 && (gun.overheatTimer ?? 0) <= 0 && target) {
            gun.heat = 0;
            gun.overheatTimer = 3.5;
            const ohDmg = Math.round(profile.damage * overdriveDmgMult * teamBuff.damageMult);
            triggerGunOverheatSkill(gun, origin, profile, ohDmg, target);
          }

          if (!target || gun.chargeTimer < profile.cooldownSec) continue;

          gun.chargeTimer = 0;
          gun.recoil = 1;
          const shotDmg = Math.round(profile.damage * overdriveDmgMult * teamBuff.damageMult);

          if ((gun.overheatTimer ?? 0) <= 0) {
            const heatGain = profile.overheatSkill.heatPerShot * (GAME_MODE_CONFIGS[s.gameMode].heatMult ?? 1);
            gun.heat = Math.min(100, (gun.heat ?? 0) + heatGain);
            if ((gun.heat ?? 0) >= 100) {
              gun.heat = 0;
              gun.overheatTimer = 3.5;
              triggerGunOverheatSkill(gun, origin, profile, shotDmg, target);
            }
          }

          if (gun.type === 'gatling' || gun.type === 'cannon' || gun.type === 'sniper' || gun.type === 'shotgun') {
            spawnCasing(origin.x, origin.y, gun.aimAngle);
          }

          if (gun.type === 'gatling') {
            const count = profile.projectilesPerShot;
            const bColor = profile.visualTier === 4 ? '#FDE047' : profile.visualTier === 3 ? '#FB923C' : '#38BDF8';
            const perBulletDmg = Math.round(
              shotDmg * (count === 4 ? 0.44 : count === 3 ? 0.54 : count === 2 ? 0.7 : 1)
            );
            for (let b = 0; b < count; b++) {
              const offsetAngle = count === 1 ? 0 : (b - (count - 1) / 2) * 0.075;
              const shotAngle = gun.aimAngle + offsetAngle;
              const muzzleX = origin.x + Math.cos(shotAngle) * 22;
              const muzzleY = origin.y + Math.sin(shotAngle) * 22;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'bullet',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 600,
                vy: Math.sin(shotAngle) * 600,
                targetId: target.id,
                damage: perBulletDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 0.95,
                maxLife: 0.95,
                age: 0,
                speed: 600,
                color: bColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: shotAngle, radius: 13 + profile.visualTier * 2.2, alpha: 0.95, color: bColor });
            }
            playSynthFx('gatling', soundEnabled, audioCtxRef);
          } else if (gun.type === 'shotgun') {
            const count = profile.projectilesPerShot;
            const spreadCone = 0.52;
            const pColor = profile.visualTier === 4 ? '#FDE047' : profile.visualTier >= 3 ? '#FBBF24' : '#FB923C';
            const pelletLife = Math.max(0.58, (profile.rangePx + 45) / 480);
            const pelletFactor = gun.level >= 10 ? 0.52 : gun.level >= 7 ? 0.55 : 0.58;
            const perPelletDmg = Math.round(shotDmg * pelletFactor);
            for (let b = 0; b < count; b++) {
              const frac = count > 1 ? b / (count - 1) - 0.5 : 0;
              const shotAngle = gun.aimAngle + frac * spreadCone;
              const muzzleX = origin.x + Math.cos(shotAngle) * 20;
              const muzzleY = origin.y + Math.sin(shotAngle) * 20;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'pellet',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 480,
                vy: Math.sin(shotAngle) * 480,
                targetId: target.id,
                damage: perPelletDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: 0,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.0 : 0,
                slowAmount: 0,
                pierceLeft: gun.level >= 7 ? 1 : 0,
                hitIds: [],
                life: pelletLife,
                maxLife: pelletLife,
                age: 0,
                speed: 480,
                color: pColor,
                visualTier: profile.visualTier,
              });
            }
            const mx = origin.x + Math.cos(gun.aimAngle) * 21;
            const my = origin.y + Math.sin(gun.aimAngle) * 21;
            s.muzzleFlashes.push({ x: mx, y: my, angle: gun.aimAngle, radius: 22 + profile.visualTier * 2.5, alpha: 1, color: pColor });
            emitParticles(mx, my, pColor, 8 + profile.visualTier * 2, 130, 1.05);
            playSynthFx('shotgun', soundEnabled, audioCtxRef);
          } else if (gun.type === 'flamer') {
            const isNova360 = gun.level === MAX_GUN_LEVEL;
            const coneRange = profile.rangePx * (1.04 + (gun.level - 1) * 0.025);
            const halfArc = 0.48 + (gun.level >= 7 ? 0.14 : 0);
            const muzzleX = isNova360 ? origin.x : origin.x + Math.cos(gun.aimAngle) * 18;
            const muzzleY = isNova360 ? origin.y : origin.y + Math.sin(gun.aimAngle) * 18;
            s.flameCones.push({
              x: muzzleX,
              y: muzzleY,
              angle: gun.aimAngle,
              range: coneRange,
              halfArc,
              alpha: 0.94,
              visualTier: profile.visualTier,
              isNova360,
            });
            const emberCount = isNova360 ? 14 : 5 + profile.visualTier * 2;
            for (let k = 0; k < emberCount; k++) {
              const spreadAngle = isNova360
                ? (k * Math.PI * 2) / emberCount + (Math.random() - 0.5) * 0.35
                : gun.aimAngle + (Math.random() - 0.5) * halfArc * 2;
              const slot = s.particles[s.particleCursor];
              s.particleCursor = (s.particleCursor + 1) % PARTICLE_POOL_SIZE;
              slot.active = true;
              slot.x = muzzleX;
              slot.y = muzzleY;
              slot.vx = Math.cos(spreadAngle) * (165 + Math.random() * 115);
              slot.vy = Math.sin(spreadAngle) * (165 + Math.random() * 115);
              slot.life = 0.36;
              slot.maxLife = 0.36;
              slot.size = profile.visualTier >= 3 ? 3.8 : 3.2;
              slot.color =
                profile.visualTier >= 3
                  ? Math.random() < 0.5
                    ? '#38BDF8'
                    : '#E0F2FE'
                  : Math.random() < 0.5
                    ? '#F97316'
                    : '#FACC15';
            }

            const pulseDmg = isNova360 ? Math.round(shotDmg * 0.72) : shotDmg;
            for (const en of liveEnemies) {
              const dx = en.x - origin.x;
              const dy = en.y - origin.y;
              const dist = Math.hypot(dx, dy);
              if (dist <= coneRange + en.radius) {
                const diff = Math.abs(
                  Math.atan2(Math.sin(Math.atan2(dy, dx) - gun.aimAngle), Math.cos(Math.atan2(dy, dx) - gun.aimAngle))
                );
                if (diff <= halfArc || isNova360) {
                  en.burnTimer = Math.max(en.burnTimer, 2.4 + gun.level * 0.2);
                  en.burnDps = Math.max(en.burnDps, Math.round(profile.burnDps * overdriveDmgMult));
                  if (gun.level >= 5) {
                    en.armorShred = Math.max(en.armorShred, 0.25);
                  }
                  if (profile.slowPct > 0) {
                    en.slowTimer = Math.max(en.slowTimer, 0.9);
                    en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                  }
                  const res = applyDamageToEnemy(en, pulseDmg, {
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
                  }
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
            playSynthFx('flamer', soundEnabled, audioCtxRef);
          } else if (gun.type === 'cryo') {
            const shardCount = profile.visualTier === 4 ? 14 : profile.visualTier === 3 ? 10 : profile.visualTier === 2 ? 8 : 6;
            const shardLife = 0.36;
            const shardSpeed = (profile.rangePx * 0.88) / shardLife;
            for (let sh = 0; sh < shardCount; sh++) {
              const sa = (sh * Math.PI * 2) / shardCount + s.animTime * 0.7;
              s.frostShards.push({
                x: origin.x + Math.cos(sa) * 14,
                y: origin.y + Math.sin(sa) * 14,
                vx: Math.cos(sa) * shardSpeed,
                vy: Math.sin(sa) * shardSpeed,
                life: shardLife,
                maxLife: shardLife,
                size: 5 + profile.visualTier * 1.4,
                rot: sa,
                color: profile.visualTier === 4 ? '#FFFFFF' : profile.visualTier >= 3 ? '#E0F2FE' : '#67E8F9',
              });
            }
            emitParticles(origin.x, origin.y, '#BAE6FD', 12 + profile.visualTier * 3, 145, 1.05);

            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                const wasChilled = en.slowTimer > 0;
                const totalFrost = wasChilled && profile.visualTier >= 3 ? Math.round(shotDmg * 1.15) : shotDmg;
                en.slowTimer = Math.max(en.slowTimer, 2.4 + gun.level * 0.15);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                en.brittleBonus = Math.max(en.brittleBonus, profile.brittleBonus);
                emitParticles(en.x, en.y, '#E0F2FE', 5, 70, 0.85);
                const res = applyDamageToEnemy(en, totalFrost, {
                  armorPierce: profile.armorPierce,
                  shieldMult: profile.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            playSynthFx('cryo', soundEnabled, audioCtxRef);
          } else if (gun.type === 'tesla') {
            const maxJumps = profile.chainCount;
            const hitIds = new Set<number>([target.id]);
            const chainPts: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            const chainPtsAlt: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            let cur: TdEnemy | null = target;

            for (let j = 0; j < maxJumps && cur; j++) {
              const prevPt = chainPts[chainPts.length - 1];
              const dx = cur.x - prevPt.x;
              const dy = cur.y - prevPt.y;
              const seg1X = prevPt.x + dx * 0.33 + (Math.random() * 22 - 11);
              const seg1Y = prevPt.y + dy * 0.33 + (Math.random() * 22 - 11);
              const seg2X = prevPt.x + dx * 0.66 + (Math.random() * 22 - 11);
              const seg2Y = prevPt.y + dy * 0.66 + (Math.random() * 22 - 11);
              chainPts.push({ x: seg1X, y: seg1Y }, { x: seg2X, y: seg2Y }, { x: cur.x, y: cur.y });
              chainPtsAlt.push(
                { x: prevPt.x + dx * 0.5 + (Math.random() * 28 - 14), y: prevPt.y + dy * 0.5 + (Math.random() * 28 - 14) },
                { x: cur.x, y: cur.y }
              );

              const falloff = Math.max(0.5, 1 - j * 0.08);
              const zapDmg = Math.round(shotDmg * falloff);
              cur.slowTimer = Math.max(cur.slowTimer, 1.4 + gun.level * 0.1);
              cur.slowFactor = Math.min(cur.slowFactor || 1, 1 - profile.slowPct);
              if (gun.level >= 7) {
                cur.stunTimer = Math.max(cur.stunTimer, 0.25);
              }
              emitParticles(cur.x, cur.y, profile.visualTier >= 3 ? '#FDE047' : '#7DD3FC', 8, 120, 1);

              const res = applyDamageToEnemy(cur, zapDmg, {
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
              });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (s.overdriveTimer <= 0) {
                s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
              }
              if (res.killed) recordKill(cur, gun.id);

              // Lv10 Thiên Lôi: AoE thunderbolt splash at primary target
              if (j === 0 && profile.splashRadius > 0) {
                s.impactFlashes.push({
                  x: cur.x,
                  y: cur.y,
                  radius: profile.splashRadius * 0.72,
                  alpha: 0.95,
                  color: '#FDE047',
                  spikes: 6,
                  rot: Math.random() * Math.PI,
                });
                const thunderDmg = Math.round(shotDmg * 0.45);
                for (const aoeEn of liveEnemies) {
                  if (aoeEn.id === cur.id || aoeEn.hp <= 0 || aoeEn.koTimer > 0) continue;
                  if (Math.hypot(aoeEn.x - cur.x, aoeEn.y - cur.y) <= profile.splashRadius + aoeEn.radius) {
                    const aRes = applyDamageToEnemy(aoeEn, thunderDmg, {
                      armorPierce: profile.armorPierce,
                      shieldMult: profile.shieldMult,
                    });
                    s.totalDamage += aRes.actualDamage;
                    gun.totalDamageDealt += aRes.actualDamage;
                    if (aRes.killed) recordKill(aoeEn, gun.id);
                  }
                }
              }

              let nextTarget: TdEnemy | null = null;
              let minD = (140 + gun.level * 10) ** 2;
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
              color: profile.visualTier === 4 ? '#FDE047' : '#38BDF8',
              width: 2.8 + profile.visualTier * 0.7,
            });
            s.lightningArcs.push({
              points: chainPtsAlt,
              alpha: 0.85,
              color: profile.visualTier >= 3 ? '#38BDF8' : '#BAE6FD',
              width: 1.8 + profile.visualTier * 0.35,
            });
            playSynthFx('tesla', soundEnabled, audioCtxRef);
          } else if (gun.type === 'missile') {
            const salvoCount = profile.projectilesPerShot;
            const inRangeSorted = liveEnemies
              .filter((e) => (e.x - origin.x) ** 2 + (e.y - origin.y) ** 2 <= rangeSq)
              .sort((a, b) => (a.x - origin.x) ** 2 + (a.y - origin.y) ** 2 - ((b.x - origin.x) ** 2 + (b.y - origin.y) ** 2));
            for (let mIdx = 0; mIdx < salvoCount; mIdx++) {
              const lock = inRangeSorted[mIdx % Math.max(1, inRangeSorted.length)] ?? target;
              const spreadOffset = salvoCount === 1 ? 0 : (mIdx - (salvoCount - 1) / 2) * 0.28;
              const launchAngle = gun.aimAngle + spreadOffset;
              const muzzleX = origin.x + Math.cos(launchAngle) * 19;
              const muzzleY = origin.y + Math.sin(launchAngle) * 19;
              const mSpeed = 295 + gun.level * 10;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'missile',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(launchAngle) * mSpeed,
                vy: Math.sin(launchAngle) * mSpeed,
                targetId: lock.id,
                damage: salvoCount === 3 ? Math.round(shotDmg * 0.56) : salvoCount === 2 ? Math.round(shotDmg * 0.68) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 2.5,
                maxLife: 2.5,
                age: 0,
                speed: mSpeed,
                color: profile.visualTier >= 3 ? '#FDE047' : '#FB7185',
                visualTier: profile.visualTier,
                spawnCluster: gun.level >= 7,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: launchAngle, radius: 20, alpha: 0.95, color: '#FB923C' });
            }
            playSynthFx('missile', soundEnabled, audioCtxRef);
          } else if (gun.type === 'railgun') {
            const beamCount = profile.projectilesPerShot;
            const railColor = profile.visualTier === 4 ? '#FDE047' : profile.visualTier >= 3 ? '#F43F5E' : '#A78BFA';
            const beamLength = Math.max(profile.rangePx + 140, 560);

            for (let b = 0; b < beamCount; b++) {
              const offsetAngle = beamCount === 1 ? 0 : (b - (beamCount - 1) / 2) * 0.065;
              const bAngle = gun.aimAngle + offsetAngle;
              const muzzleX = origin.x + Math.cos(bAngle) * 24;
              const muzzleY = origin.y + Math.sin(bAngle) * 24;
              const endX = origin.x + Math.cos(bAngle) * beamLength;
              const endY = origin.y + Math.sin(bAngle) * beamLength;

              s.railBeams.push({
                x1: muzzleX,
                y1: muzzleY,
                x2: endX,
                y2: endY,
                alpha: 1,
                color: railColor,
                visualTier: profile.visualTier,
                variant: 'railgun',
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: bAngle, radius: 26 + profile.visualTier * 4, alpha: 1, color: railColor });

              const segLenSq = (endX - origin.x) ** 2 + (endY - origin.y) ** 2;
              const perBeamDmg = beamCount === 3 ? Math.round(shotDmg * 0.45) : beamCount === 2 ? Math.round(shotDmg * 0.62) : shotDmg;
              for (const en of liveEnemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const tProj = Math.max(
                  0,
                  Math.min(1, ((en.x - origin.x) * (endX - origin.x) + (en.y - origin.y) * (endY - origin.y)) / segLenSq)
                );
                const px = origin.x + tProj * (endX - origin.x);
                const py = origin.y + tProj * (endY - origin.y);
                const distSq = (en.x - px) ** 2 + (en.y - py) ** 2;
                if (distSq <= (en.radius + 14 + profile.visualTier * 2) ** 2) {
                  const bossCrit = gun.level === MAX_GUN_LEVEL && en.kind === 'boss';
                  const beamHitDmg = bossCrit ? Math.round(perBeamDmg * 1.25) : perBeamDmg;
                  emitParticles(en.x, en.y, profile.visualTier >= 3 ? '#FDE047' : '#E879F9', 14, 175, 1.2);
                  const res = applyDamageToEnemy(en, beamHitDmg, {
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (bossCrit && res.actualDamage > 0) {
                    pushCombatText(en.x, en.y - 10, `ORBITAL CRIT! -${res.actualDamage}`, '#FDE047', 1.15);
                  }
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.04);
                  }
                  if (res.killed) recordKill(en, gun.id);

                  // Lv7+ Kích Nổ Quỹ Đạo: orbital shock detonation around pierced enemy
                  if (profile.splashRadius > 0) {
                    s.impactFlashes.push({
                      x: en.x,
                      y: en.y,
                      radius: profile.splashRadius * 0.65,
                      alpha: 0.9,
                      color: railColor,
                      spikes: 5,
                      rot: Math.random() * Math.PI,
                    });
                    const orbitalDmg = Math.round(perBeamDmg * 0.32);
                    for (const near of liveEnemies) {
                      if (near.id === en.id || near.hp <= 0 || near.koTimer > 0) continue;
                      if (Math.hypot(near.x - en.x, near.y - en.y) <= profile.splashRadius + near.radius) {
                        const oRes = applyDamageToEnemy(near, orbitalDmg, {
                          armorPierce: profile.armorPierce,
                          shieldMult: profile.shieldMult,
                        });
                        s.totalDamage += oRes.actualDamage;
                        gun.totalDamageDealt += oRes.actualDamage;
                        if (oRes.killed) recordKill(near, gun.id);
                      }
                    }
                  }
                }
              }
            }
            playSynthFx('railgun', soundEnabled, audioCtxRef);
          } else if (gun.type === 'mortar') {
            const shellCount = profile.projectilesPerShot;
            for (let m = 0; m < shellCount; m++) {
              const offset = shellCount === 1 ? 0 : (m === 0 ? -0.18 : 0.18);
              const launchAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(launchAngle) * 16;
              const muzzleY = origin.y + Math.sin(launchAngle) * 16;
              const mSpeed = 205 + gun.level * 8;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'mortar',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(launchAngle) * mSpeed,
                vy: Math.sin(launchAngle) * mSpeed,
                targetId: target.id,
                destX: target.x,
                destY: target.y,
                damage: shellCount === 2 ? Math.round(shotDmg * 0.62) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: profile.pullForce,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.2 : 0,
                slowAmount: profile.slowPct,
                pierceLeft: 0,
                life: 2.3,
                maxLife: 2.3,
                age: 0,
                speed: mSpeed,
                color: profile.visualTier === 4 ? '#FDE047' : '#C084FC',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: launchAngle, radius: 22 + profile.visualTier * 3, alpha: 0.95, color: '#C084FC' });
            }
            playSynthFx('mortar', soundEnabled, audioCtxRef);
          } else if (gun.type === 'sniper') {
            const shots = profile.projectilesPerShot;
            const critChance = gun.level >= 10 ? 0.5 : gun.level >= 5 ? 0.35 : 0.2;
            const critMult = gun.level >= 10 ? 2.0 : gun.level >= 5 ? 1.75 : 1.45;
            const inRangeSorted = liveEnemies
              .filter((e) => (e.x - origin.x) ** 2 + (e.y - origin.y) ** 2 <= rangeSq)
              .sort((a, b) => b.hp + b.shield - (a.hp + a.shield));

            for (let sIdx = 0; sIdx < shots; sIdx++) {
              const hitTarget = inRangeSorted[sIdx] ?? target;
              if (!hitTarget || hitTarget.hp <= 0) continue;
              const shotAngle = Math.atan2(hitTarget.y - origin.y, hitTarget.x - origin.x);
              const muzzleX = origin.x + Math.cos(shotAngle) * 26;
              const muzzleY = origin.y + Math.sin(shotAngle) * 26;
              const isCrit = Math.random() < critChance;
              const bossBonus =
                gun.level >= 7 &&
                (hitTarget.kind === 'boss' || hitTarget.kind === 'healer' || hitTarget.isElite)
                  ? 1.25
                  : 1;
              const finalDmg = Math.round(
                (shots === 2 ? shotDmg * 0.65 : shotDmg) * (isCrit ? critMult : 1) * bossBonus
              );

              s.railBeams.push({
                x1: muzzleX,
                y1: muzzleY,
                x2: hitTarget.x,
                y2: hitTarget.y,
                alpha: 0.96,
                color: isCrit ? '#FDE047' : '#34D399',
                visualTier: profile.visualTier,
                variant: 'sniper',
              });
              s.muzzleFlashes.push({
                x: muzzleX,
                y: muzzleY,
                angle: shotAngle,
                radius: 20 + profile.visualTier * 2,
                alpha: 1,
                color: isCrit ? '#FDE047' : '#34D399',
              });
              s.impactFlashes.push({
                x: hitTarget.x,
                y: hitTarget.y,
                radius: isCrit ? 22 : 13,
                alpha: 1,
                color: isCrit ? '#FDE047' : '#6EE7B7',
                spikes: 4,
                rot: Math.PI / 4,
              });
              emitParticles(hitTarget.x, hitTarget.y, isCrit ? '#FDE047' : '#34D399', isCrit ? 14 : 7, 150, 1.1);
              const res = applyDamageToEnemy(hitTarget, finalDmg, {
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
              });
              if (isCrit && res.actualDamage > 0) {
                pushCombatText(hitTarget.x, hitTarget.y - 6, `CRIT! -${res.actualDamage}`, '#FDE047', 1.12);
              }
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (s.overdriveTimer <= 0) {
                s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
              }
              if (res.killed) recordKill(hitTarget, gun.id);
            }
            playSynthFx('sniper', soundEnabled, audioCtxRef);
          } else if (gun.type === 'acid') {
            const count = profile.projectilesPerShot;
            const inRange = liveEnemies.filter(
              (e) => (e.x - origin.x) ** 2 + (e.y - origin.y) ** 2 <= rangeSq
            );
            for (let aIdx = 0; aIdx < count; aIdx++) {
              const lock = inRange[(aIdx * 2) % Math.max(1, inRange.length)] ?? target;
              const angle = Math.atan2(lock.y - origin.y, lock.x - origin.x);
              const muzzleX = origin.x + Math.cos(angle) * 20;
              const muzzleY = origin.y + Math.sin(angle) * 20;
              const aSpeed = 315 + gun.level * 12;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'acid',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(angle) * aSpeed,
                vy: Math.sin(angle) * aSpeed,
                targetId: lock.id,
                destX: lock.x,
                destY: lock.y,
                damage: count === 2 ? Math.round(shotDmg * 0.65) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: 0,
                slowAmount: profile.slowPct,
                pierceLeft: 0,
                acidShred: gun.level >= 10 ? 0.5 : gun.level >= 3 ? 0.32 : 0.22,
                life: 1.5,
                maxLife: 1.5,
                age: 0,
                speed: aSpeed,
                color: '#A3E635',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({
                x: muzzleX,
                y: muzzleY,
                angle,
                radius: 16,
                alpha: 0.9,
                color: '#A3E635',
              });
            }
            playSynthFx('acid', soundEnabled, audioCtxRef);
          } else if (gun.type === 'saw') {
            const count = profile.projectilesPerShot;
            for (let sw = 0; sw < count; sw++) {
              const offsetAngle = count === 1 ? 0 : (sw - (count - 1) / 2) * 0.22;
              const launchAngle = gun.aimAngle + offsetAngle;
              const muzzleX = origin.x + Math.cos(launchAngle) * 20;
              const muzzleY = origin.y + Math.sin(launchAngle) * 20;
              const speed = 415 + gun.level * 14;
              const sawColor = profile.visualTier === 4 ? '#FB7185' : '#F43F5E';
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'sawblade',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(launchAngle) * speed,
                vy: Math.sin(launchAngle) * speed,
                targetId: target.id,
                damage: count === 3 ? Math.round(shotDmg * 0.5) : count === 2 ? Math.round(shotDmg * 0.68) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: 0,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 1.8 : 0,
                slowAmount: 0,
                pierceLeft: 0,
                bounceLeft: profile.chainCount,
                hitIds: [],
                life: 2.8,
                maxLife: 2.8,
                age: 0,
                speed,
                color: sawColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({
                x: muzzleX,
                y: muzzleY,
                angle: launchAngle,
                radius: 15 + profile.visualTier * 2,
                alpha: 0.92,
                color: profile.visualTier === 4 ? '#FDE047' : '#FB7185',
              });
            }
            playSynthFx('saw', soundEnabled, audioCtxRef);
          } else if (gun.type === 'beacon') {
            const rayCount = 6 + profile.visualTier * 2;
            const rayColor = profile.visualTier === 4 ? '#FEF08A' : '#FACC15';
            for (let r = 0; r < rayCount; r++) {
              const ra = (r * Math.PI * 2) / rayCount + s.animTime * 0.8;
              s.harmonicRays.push({
                x: origin.x,
                y: origin.y,
                angle: ra,
                length: profile.rangePx * 0.78,
                alpha: 0.65,
                color: rayColor,
              });
            }
            emitParticles(origin.x, origin.y, '#FDE047', 12 + profile.visualTier * 3, 130, 1.05);
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                if (gun.level >= 5) {
                  en.slowTimer = Math.max(en.slowTimer, 1.4);
                  en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                }
                emitParticles(en.x, en.y, '#FDE047', 4, 70, 0.8);
                const res = applyDamageToEnemy(en, shotDmg, {
                  armorPierce: profile.armorPierce,
                  shieldMult: profile.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (s.overdriveTimer <= 0) {
                  s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.04);
                }
                if (res.killed) recordKill(en, gun.id);
              }
            }
            playSynthFx('beacon', soundEnabled, audioCtxRef);
          } else if (gun.type === 'amp_spire') {
            const gain = gun.level >= 10 ? 5 : gun.level >= 7 ? 4 : gun.level >= 3 ? 3 : 2;
            s.energy += gain;
            pushCombatText(origin.x, origin.y - 14, `+${gain}⚡`, '#34D399', 0.92);
            if (gun.level >= 7) {
              for (const ally of s.guns) {
                if (ally.id === gun.id) continue;
                const apt = gridToWorldCenter(ally.col, ally.row);
                if (Math.hypot(apt.x - origin.x, apt.y - origin.y) <= profile.rangePx + 4) {
                  ally.chargeTimer += 0.25;
                  ally.heat = Math.max(0, (ally.heat ?? 0) - 6);
                }
              }
            }
            const rayCount = 4 + profile.visualTier;
            for (let r = 0; r < rayCount; r++) {
              const ra = (r * Math.PI * 2) / rayCount - s.animTime * 0.65;
              s.harmonicRays.push({
                x: origin.x,
                y: origin.y,
                angle: ra,
                length: profile.rangePx * 0.72,
                alpha: 0.55,
                color: '#34D399',
              });
            }
            emitParticles(origin.x, origin.y, '#34D399', 10 + profile.visualTier * 2, 115, 0.95);
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                const res = applyDamageToEnemy(en, shotDmg, {
                  armorPierce: profile.armorPierce,
                  shieldMult: profile.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            playSynthFx('amp_spire', soundEnabled, audioCtxRef);
          } else if (gun.type === 'radar') {
            const rayCount = 4 + profile.visualTier;
            for (let r = 0; r < rayCount; r++) {
              const ra = gun.aimAngle + (r - (rayCount - 1) / 2) * 0.16;
              s.harmonicRays.push({
                x: origin.x,
                y: origin.y,
                angle: ra,
                length: profile.rangePx * 0.88,
                alpha: 0.62,
                color: '#22D3EE',
              });
            }
            emitParticles(origin.x, origin.y, '#22D3EE', 9 + profile.visualTier * 2, 120, 0.95);
            const shredAmt = gun.level >= 7 ? 0.22 : 0.12;
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                en.slowTimer = Math.max(en.slowTimer, 2.2);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                en.brittleBonus = Math.max(en.brittleBonus, profile.brittleBonus);
                en.armorShred = Math.max(en.armorShred, shredAmt);
                emitParticles(en.x, en.y, '#67E8F9', 3, 65, 0.75);
                const res = applyDamageToEnemy(en, shotDmg, {
                  armorPierce: profile.armorPierce,
                  shieldMult: profile.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            playSynthFx('radar', soundEnabled, audioCtxRef);
          } else if (gun.type === 'aegis_field') {
            s.shockwaves.push({
              x: origin.x,
              y: origin.y,
              radius: 16,
              maxRadius: profile.rangePx,
              alpha: 0.68,
              color: '#60A5FA',
              lineWidth: 2.2 + profile.visualTier * 0.35,
            });
            emitParticles(origin.x, origin.y, '#60A5FA', 12 + profile.visualTier * 2, 130, 1);
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                en.slowTimer = Math.max(en.slowTimer, 1.8);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                if (gun.level >= 10) {
                  en.stunTimer = Math.max(en.stunTimer, 0.3);
                }
                if (profile.pullForce > 0) {
                  const prevWp = s.map.path[Math.max(0, en.waypointIndex - 1)];
                  if (prevWp) {
                    const prevPt = gridToWorldCenter(prevWp.col, prevWp.row);
                    pullEnemyAlongTrack(en, s.map, prevPt.x, prevPt.y, profile.pullForce);
                  }
                }
                emitParticles(en.x, en.y, '#93C5FD', 4, 70, 0.8);
                const res = applyDamageToEnemy(en, shotDmg, {
                  armorPierce: profile.armorPierce,
                  shieldMult: profile.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            playSynthFx('aegis_field', soundEnabled, audioCtxRef);
          } else if (gun.type === 'cannon') {
            const count = profile.projectilesPerShot;
            for (let c = 0; c < count; c++) {
              const offset = count === 1 ? 0 : (c - (count - 1) / 2) * 0.1;
              const shotAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(shotAngle) * 24;
              const muzzleY = origin.y + Math.sin(shotAngle) * 24;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'cannon',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 430,
                vy: Math.sin(shotAngle) * 430,
                targetId: target.id,
                damage: count === 3 ? Math.round(shotDmg * 0.48) : count === 2 ? Math.round(shotDmg * 0.64) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: gun.level >= 5 ? (gun.level === 10 ? 0.45 : 0.35) : 0, // stagger interrupt duration
                pierceLeft: 0,
                life: 1.25,
                maxLife: 1.25,
                age: 0,
                speed: 430,
                color: profile.visualTier === 4 ? '#FDE047' : '#F59E0B',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: shotAngle, radius: 22 + profile.visualTier * 2.5, alpha: 1, color: '#F59E0B' });
            }
            playSynthFx('cannon', soundEnabled, audioCtxRef);
          } else if (gun.type === 'plasma') {
            const count = profile.projectilesPerShot;
            for (let p = 0; p < count; p++) {
              const offset = count === 1 ? 0 : (p - (count - 1) / 2) * 0.16;
              const shotAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(shotAngle) * 20;
              const muzzleY = origin.y + Math.sin(shotAngle) * 20;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'plasma',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 365,
                vy: Math.sin(shotAngle) * 365,
                targetId: target.id,
                damage: count === 3 ? Math.round(shotDmg * 0.5) : count === 2 ? Math.round(shotDmg * 0.66) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: profile.pullForce,
                burnDps: profile.burnDps,
                burnDuration: 2.0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 1.4,
                maxLife: 1.4,
                age: 0,
                speed: 365,
                color: profile.visualTier === 4 ? '#F9A8D4' : '#EC4899',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: shotAngle, radius: 18 + profile.visualTier * 2, alpha: 0.95, color: '#EC4899' });
            }
            playSynthFx('plasma', soundEnabled, audioCtxRef);
          } else if (gun.type === 'cluster') {
            const count = profile.projectilesPerShot;
            for (let m = 0; m < count; m++) {
              const offset = count === 1 ? 0 : (m - (count - 1) / 2) * 0.2;
              const shotAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(shotAngle) * 18;
              const muzzleY = origin.y + Math.sin(shotAngle) * 18;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'cluster',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 255,
                vy: Math.sin(shotAngle) * 255,
                targetId: target.id,
                destX: target.x,
                destY: target.y,
                damage: count === 3 ? Math.round(shotDmg * 0.48) : count === 2 ? Math.round(shotDmg * 0.64) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.2 : 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 2.1,
                maxLife: 2.1,
                age: 0,
                speed: 255,
                color: '#10B981',
                visualTier: profile.visualTier,
                spawnCluster: gun.level >= 3,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: shotAngle, radius: 19 + profile.visualTier * 2, alpha: 0.9, color: '#10B981' });
            }
            playSynthFx('cluster', soundEnabled, audioCtxRef);
          } else if (gun.type === 'hunter') {
            const count = profile.projectilesPerShot;
            const inRangeHunter = liveEnemies.filter(
              (e) => (e.x - origin.x) ** 2 + (e.y - origin.y) ** 2 <= rangeSq
            );
            const sortedHunter = (inRangeHunter.length > 0 ? inRangeHunter : liveEnemies).sort((a, b) => {
              const pa = a.kind === 'stealth' || a.kind === 'teleporter' || a.kind === 'summoner' ? 1 : 0;
              const pb = b.kind === 'stealth' || b.kind === 'teleporter' || b.kind === 'summoner' ? 1 : 0;
              return pb - pa || b.waypointIndex - a.waypointIndex;
            });
            for (let h = 0; h < count; h++) {
              const lock = sortedHunter[h % sortedHunter.length] ?? target;
              const offset = count === 1 ? 0 : (h - (count - 1) / 2) * 0.24;
              const shotAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(shotAngle) * 20;
              const muzzleY = origin.y + Math.sin(shotAngle) * 20;
              const hSpeed = 420 + gun.level * 10;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'hunter',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * hSpeed,
                vy: Math.sin(shotAngle) * hSpeed,
                targetId: lock.id,
                damage: count >= 4 ? Math.round(shotDmg * 0.46) : count >= 3 ? Math.round(shotDmg * 0.56) : count === 2 ? Math.round(shotDmg * 0.72) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: gun.level >= 5 ? 1.22 : 1,
                pierceLeft: 0,
                life: 2.2,
                maxLife: 2.2,
                age: 0,
                speed: hSpeed,
                color: profile.visualTier === 4 ? '#FDE047' : '#22D3EE',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({
                x: muzzleX,
                y: muzzleY,
                angle: shotAngle,
                radius: 15 + profile.visualTier * 2,
                alpha: 0.9,
                color: '#22D3EE',
              });
            }
            playSynthFx('hunter', soundEnabled, audioCtxRef);
          } else if (gun.type === 'prism_laser') {
            const chainTotal = Math.max(1, profile.chainCount);
            const hitIds = new Set<number>([target.id]);
            let prevX = origin.x + Math.cos(gun.aimAngle) * 20;
            let prevY = origin.y + Math.sin(gun.aimAngle) * 20;
            let cur: TdEnemy | null = target;

            s.muzzleFlashes.push({
              x: prevX,
              y: prevY,
              angle: gun.aimAngle,
              radius: 20 + profile.visualTier * 2,
              alpha: 0.95,
              color: '#E879F9',
            });

            for (let b = 0; b < chainTotal && cur; b++) {
              s.railBeams.push({
                x1: prevX,
                y1: prevY,
                x2: cur.x,
                y2: cur.y,
                alpha: 0.95,
                color: profile.visualTier === 4 ? '#FDE047' : '#E879F9',
                visualTier: profile.visualTier,
                variant: 'prism_laser',
              });
              const falloff = Math.max(0.55, 1 - b * 0.11);
              if (profile.burnDps > 0) {
                cur.burnTimer = Math.max(cur.burnTimer, 1.8);
                cur.burnDps = Math.max(cur.burnDps, profile.burnDps);
              }
              const res = applyDamageToEnemy(cur, Math.round(shotDmg * falloff), {
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
              });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              emitParticles(cur.x, cur.y, '#F472B6', 7, 110, 0.95);
              if (s.overdriveTimer <= 0) {
                s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
              }
              if (res.killed) recordKill(cur, gun.id);

              prevX = cur.x;
              prevY = cur.y;
              let nextHop: TdEnemy | null = null;
              let bestHopSq = (155 + gun.level * 8) ** 2;
              for (const cand of liveEnemies) {
                if (hitIds.has(cand.id) || cand.hp <= 0) continue;
                const dSq = (cand.x - prevX) ** 2 + (cand.y - prevY) ** 2;
                if (dSq <= bestHopSq) {
                  bestHopSq = dSq;
                  nextHop = cand;
                }
              }
              if (nextHop) hitIds.add(nextHop.id);
              cur = nextHop;
            }
            playSynthFx('prism_laser', soundEnabled, audioCtxRef);
          } else if (gun.type === 'tempest') {
            const orbCount = profile.projectilesPerShot;
            for (let tIdx = 0; tIdx < orbCount; tIdx++) {
              const offset = orbCount === 1 ? 0 : (tIdx - (orbCount - 1) / 2) * 0.22;
              const shotAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(shotAngle) * 20;
              const muzzleY = origin.y + Math.sin(shotAngle) * 20;
              const spd = 335 + gun.level * 9;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'tempest_orb',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * spd,
                vy: Math.sin(shotAngle) * spd,
                targetId: target.id,
                damage: orbCount >= 3 ? Math.round(shotDmg * 0.5) : orbCount === 2 ? Math.round(shotDmg * 0.68) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: profile.slowPct,
                pierceLeft: 0,
                life: 1.65,
                maxLife: 1.65,
                age: 0,
                speed: spd,
                color: profile.visualTier === 4 ? '#38BDF8' : '#818CF8',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({
                x: muzzleX,
                y: muzzleY,
                angle: shotAngle,
                radius: 17 + profile.visualTier * 2,
                alpha: 0.92,
                color: '#818CF8',
              });
            }
            playSynthFx('tempest', soundEnabled, audioCtxRef);
          } else if (gun.type === 'sonic') {
            const waveCount = profile.projectilesPerShot;
            s.shockwaves.push({
              x: origin.x,
              y: origin.y,
              radius: 16,
              maxRadius: profile.rangePx,
              alpha: 0.72,
              color: '#2DD4BF',
              lineWidth: 2.8,
            });
            for (let w = 0; w < waveCount; w++) {
              const offset = waveCount === 1 ? 0 : (w - (waveCount - 1) / 2) * 0.24;
              const a = gun.aimAngle + offset;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'sonic_wave',
                sourceGunId: gun.id,
                x: origin.x + Math.cos(a) * 18,
                y: origin.y + Math.sin(a) * 18,
                vx: Math.cos(a) * 430,
                vy: Math.sin(a) * 430,
                targetId: target.id,
                damage: waveCount >= 3 ? Math.round(shotDmg * 0.56) : waveCount === 2 ? Math.round(shotDmg * 0.72) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: Math.max(48, Math.round(profile.splashRadius * 0.48)),
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: profile.slowPct,
                acidShred: gun.level >= 10 ? 0.42 : gun.level >= 3 ? 0.22 : 0.1,
                pierceLeft: 3 + profile.visualTier,
                hitIds: [],
                life: 0.85,
                maxLife: 0.85,
                age: 0,
                speed: 430,
                color: '#2DD4BF',
                visualTier: profile.visualTier,
              });
            }
            playSynthFx('sonic', soundEnabled, audioCtxRef);
          } else if (gun.type === 'gravity_lance') {
            const beams = profile.projectilesPerShot;
            for (let b = 0; b < beams; b++) {
              const offset = beams === 1 ? 0 : (b - (beams - 1) / 2) * 0.08;
              const a = gun.aimAngle + offset;
              const mx = origin.x + Math.cos(a) * 24;
              const my = origin.y + Math.sin(a) * 24;
              const ex = origin.x + Math.cos(a) * (profile.rangePx + 95);
              const ey = origin.y + Math.sin(a) * (profile.rangePx + 95);
              s.railBeams.push({ x1: mx, y1: my, x2: ex, y2: ey, alpha: 0.98, color: '#A855F7', visualTier: profile.visualTier, variant: 'gravity_lance' });
              const segLenSq = (ex - origin.x) ** 2 + (ey - origin.y) ** 2;
              const perBeamDmg = Math.round(shotDmg * (beams >= 3 ? 0.52 : beams === 2 ? 0.68 : 1));
              for (const en of liveEnemies) {
                const tProj = Math.max(0, Math.min(1, ((en.x - origin.x) * (ex - origin.x) + (en.y - origin.y) * (ey - origin.y)) / segLenSq));
                const px = origin.x + tProj * (ex - origin.x);
                const py = origin.y + tProj * (ey - origin.y);
                if ((en.x - px) ** 2 + (en.y - py) ** 2 <= (en.radius + 17) ** 2) {
                  if (profile.pullForce > 0) {
                    pullEnemyAlongTrack(en, s.map, origin.x, origin.y, profile.pullForce * 0.65);
                  }
                  const res = applyDamageToEnemy(en, perBeamDmg, { armorPierce: profile.armorPierce, shieldMult: profile.shieldMult });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
            playPrismSfx('gravity_lance', soundEnabled, audioCtxRef);
          } else if (gun.type === 'map01_cyber_smg' || gun.type === 'map07_cyclone_rotary' || gun.type === 'map05_dune_needler') {
            const count = profile.projectilesPerShot;
            const kind: ProjectileItem['kind'] =
              gun.type === 'map01_cyber_smg'
                ? 'cyber_bolt'
                : gun.type === 'map05_dune_needler'
                  ? 'dune_needle'
                  : 'bullet';
            const factor = count >= 5 ? 0.4 : count === 4 ? 0.45 : count === 3 ? 0.56 : count === 2 ? 0.72 : 1;
            for (let b = 0; b < count; b++) {
              const offsetAngle = count === 1 ? 0 : (b - (count - 1) / 2) * (gun.type === 'map05_dune_needler' ? 0.14 : 0.08);
              const shotAngle = gun.aimAngle + offsetAngle;
              const mx = origin.x + Math.cos(shotAngle) * 20;
              const my = origin.y + Math.sin(shotAngle) * 20;
              const spd = gun.type === 'map05_dune_needler' ? 540 : 620;
              s.projectiles.push({
                id: s.nextProjId++,
                kind,
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(shotAngle) * spd,
                vy: Math.sin(shotAngle) * spd,
                targetId: target.id,
                damage: Math.round(shotDmg * factor),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 1.8 : 0,
                slowAmount: profile.slowPct,
                pierceLeft: gun.level >= 5 ? 1 : 0,
                hitIds: [],
                life: 0.95,
                maxLife: 0.95,
                age: 0,
                speed: spd,
                color: profile.accentColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: mx, y: my, angle: shotAngle, radius: 14 + profile.visualTier * 2, alpha: 0.92, color: profile.accentColor });
            }
            playPrismSfx(gun.type, soundEnabled, audioCtxRef);
          } else if (gun.type === 'map02_matrix_spire' || gun.type === 'map06_aurora_beam') {
            const chainTotal = Math.max(1, profile.chainCount);
            const hitIds = new Set<number>([target.id]);
            let prevX = origin.x + Math.cos(gun.aimAngle) * 20;
            let prevY = origin.y + Math.sin(gun.aimAngle) * 20;
            let cur: TdEnemy | null = target;
            for (let b = 0; b < chainTotal && cur; b++) {
              s.railBeams.push({ x1: prevX, y1: prevY, x2: cur.x, y2: cur.y, alpha: 0.96, color: profile.accentColor, visualTier: profile.visualTier, variant: 'aurora_beam' });
              const falloff = Math.max(0.55, 1 - b * 0.1);
              if (profile.slowPct > 0) {
                cur.slowTimer = Math.max(cur.slowTimer, 1.8);
                cur.slowFactor = Math.min(cur.slowFactor || 1, 1 - profile.slowPct);
                cur.brittleBonus = Math.max(cur.brittleBonus, profile.brittleBonus);
              }
              if (profile.burnDps > 0) {
                cur.burnTimer = Math.max(cur.burnTimer, 1.8);
                cur.burnDps = Math.max(cur.burnDps, profile.burnDps);
              }
              const res = applyDamageToEnemy(cur, Math.round(shotDmg * falloff), { armorPierce: profile.armorPierce, shieldMult: profile.shieldMult });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (s.overdriveTimer <= 0) s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
              if (res.killed) recordKill(cur, gun.id);
              prevX = cur.x;
              prevY = cur.y;
              let nextHop: TdEnemy | null = null;
              let bestHopSq = (165 + gun.level * 8) ** 2;
              for (const cand of liveEnemies) {
                if (hitIds.has(cand.id) || cand.hp <= 0) continue;
                const dSq = (cand.x - prevX) ** 2 + (cand.y - prevY) ** 2;
                if (dSq <= bestHopSq) {
                  bestHopSq = dSq;
                  nextHop = cand;
                }
              }
              if (nextHop) hitIds.add(nextHop.id);
              cur = nextHop;
            }
            playPrismSfx(gun.type, soundEnabled, audioCtxRef);
          } else if (gun.type === 'map03_forge_magma' || gun.type === 'map08_titan_flak' || gun.type === 'map11_cryo_shatter' || gun.type === 'map14_omega_disruptor') {
            const count = profile.projectilesPerShot;
            const kind: ProjectileItem['kind'] =
              gun.type === 'map03_forge_magma'
                ? 'magma_glob'
                : gun.type === 'map08_titan_flak'
                  ? 'flak_shell'
                  : gun.type === 'map11_cryo_shatter'
                    ? 'cryo_spike'
                    : 'omega_pulse';
            const spd = kind === 'magma_glob' ? 275 : kind === 'omega_pulse' ? 390 : 440;
            const factor = count >= 4 ? 0.46 : count === 3 ? 0.55 : count === 2 ? 0.72 : 1;
            for (let k = 0; k < count; k++) {
              const offset = count === 1 ? 0 : (k - (count - 1) / 2) * 0.16;
              const a = gun.aimAngle + offset;
              const mx = origin.x + Math.cos(a) * 20;
              const my = origin.y + Math.sin(a) * 20;
              s.projectiles.push({
                id: s.nextProjId++,
                kind,
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                targetId: target.id,
                damage: Math.round(shotDmg * factor),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.2 : 0,
                slowAmount: profile.slowPct,
                pierceLeft: kind === 'cryo_spike' && gun.level >= 7 ? 1 : 0,
                hitIds: [],
                life: 1.5,
                maxLife: 1.5,
                age: 0,
                speed: spd,
                color: profile.accentColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: mx, y: my, angle: a, radius: 18 + profile.visualTier * 2, alpha: 0.94, color: profile.accentColor });
            }
            playPrismSfx(gun.type, soundEnabled, audioCtxRef);
          } else if (gun.type === 'map04_void_katana') {
            const count = profile.projectilesPerShot;
            for (let k = 0; k < count; k++) {
              const a = gun.aimAngle + (count === 1 ? 0 : (k - (count - 1) / 2) * 0.22);
              const mx = origin.x + Math.cos(a) * 18;
              const my = origin.y + Math.sin(a) * 18;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'katana_blade',
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(a) * 510,
                vy: Math.sin(a) * 510,
                targetId: target.id,
                damage: Math.round(shotDmg * (count === 3 ? 0.5 : count === 2 ? 0.68 : 1)),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: 20,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 1.8 : 0,
                slowAmount: 0,
                pierceLeft: 2 + profile.visualTier,
                hitIds: [],
                life: 0.95,
                maxLife: 0.95,
                age: 0,
                speed: 510,
                color: '#FB7185',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: mx, y: my, angle: a, radius: 18, alpha: 0.95, color: '#FB7185' });
            }
            playPrismSfx('map04_void_katana', soundEnabled, audioCtxRef);
          } else if (gun.type === 'map09_venom_hydra' || gun.type === 'map12_hellfire_organ' || gun.type === 'map13_shadow_hive' || gun.type === 'map16_void_sovereign') {
            const count = profile.projectilesPerShot;
            const kind: ProjectileItem['kind'] =
              gun.type === 'map09_venom_hydra'
                ? 'hydra_fang'
                : gun.type === 'map12_hellfire_organ'
                  ? 'hell_rocket'
                  : gun.type === 'map13_shadow_hive'
                    ? 'shadow_drone'
                    : 'sovereign_orb';
            const spd = kind === 'sovereign_orb' ? 320 : kind === 'shadow_drone' ? 430 : 350;
            const factor = count >= 5 ? 0.36 : count === 4 ? 0.44 : count === 3 ? 0.56 : count === 2 ? 0.7 : 1;
            for (let k = 0; k < count; k++) {
              const a = gun.aimAngle + (count === 1 ? 0 : (k - (count - 1) / 2) * 0.22);
              const mx = origin.x + Math.cos(a) * 20;
              const my = origin.y + Math.sin(a) * 20;
              s.projectiles.push({
                id: s.nextProjId++,
                kind,
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                targetId: target.id,
                damage: Math.round(shotDmg * factor),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: profile.pullForce,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.2 : 0,
                slowAmount: profile.slowPct,
                acidShred: gun.type === 'map09_venom_hydra' ? 0.34 : 0,
                pierceLeft: 0,
                life: 2.2,
                maxLife: 2.2,
                age: 0,
                speed: spd,
                color: profile.accentColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: mx, y: my, angle: a, radius: 18 + profile.visualTier * 2, alpha: 0.94, color: profile.accentColor });
            }
            if (gun.type === 'map16_void_sovereign') {
              s.railBeams.push({ x1: origin.x, y1: origin.y, x2: target.x, y2: target.y, alpha: 0.85, color: '#FDE047', visualTier: profile.visualTier, variant: 'sovereign_beam' });
            }
            playPrismSfx(gun.type, soundEnabled, audioCtxRef);
          } else if (gun.type === 'map10_meteor_rail') {
            const beams = profile.projectilesPerShot;
            for (let b = 0; b < beams; b++) {
              const a = gun.aimAngle + (beams === 1 ? 0 : (b - (beams - 1) / 2) * 0.08);
              const mx = origin.x + Math.cos(a) * 24;
              const my = origin.y + Math.sin(a) * 24;
              const ex = origin.x + Math.cos(a) * (profile.rangePx + 140);
              const ey = origin.y + Math.sin(a) * (profile.rangePx + 140);
              s.railBeams.push({ x1: mx, y1: my, x2: ex, y2: ey, alpha: 1.0, color: '#FB923C', visualTier: profile.visualTier, variant: 'railgun' });
              const segLenSq = (ex - origin.x) ** 2 + (ey - origin.y) ** 2;
              const perBeamDmg = Math.round(shotDmg * (beams >= 3 ? 0.5 : beams === 2 ? 0.66 : 1));
              for (const en of liveEnemies) {
                const tProj = Math.max(0, Math.min(1, ((en.x - origin.x) * (ex - origin.x) + (en.y - origin.y) * (ey - origin.y)) / segLenSq));
                const px = origin.x + tProj * (ex - origin.x);
                const py = origin.y + tProj * (ey - origin.y);
                if ((en.x - px) ** 2 + (en.y - py) ** 2 <= (en.radius + 17) ** 2) {
                  if (profile.splashRadius > 0) spawnCrater(en.x, en.y, 26, 'scorch');
                  const res = applyDamageToEnemy(en, perBeamDmg, { armorPierce: profile.armorPierce, shieldMult: profile.shieldMult });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
            playPrismSfx('map10_meteor_rail', soundEnabled, audioCtxRef);
          } else if (gun.type === 'map15_emerald_reaper') {
            const count = profile.projectilesPerShot;
            for (let sw = 0; sw < count; sw++) {
              const a = gun.aimAngle + (count === 1 ? 0 : (sw - (count - 1) / 2) * 0.22);
              const mx = origin.x + Math.cos(a) * 20;
              const my = origin.y + Math.sin(a) * 20;
              const spd = 445 + gun.level * 12;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'reaper_disc',
                sourceGunId: gun.id,
                x: mx,
                y: my,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                targetId: target.id,
                damage: Math.round(shotDmg * (count >= 3 ? 0.5 : count === 2 ? 0.68 : 1)),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: 0,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 1.8 : 0,
                slowAmount: 0,
                pierceLeft: 0,
                bounceLeft: profile.chainCount,
                hitIds: [],
                life: 2.9,
                maxLife: 2.9,
                age: 0,
                speed: spd,
                color: '#34D399',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: mx, y: my, angle: a, radius: 16 + profile.visualTier * 2, alpha: 0.94, color: '#34D399' });
            }
            playPrismSfx('map15_emerald_reaper', soundEnabled, audioCtxRef);
          }
        }

        // 3. Step Projectiles
        const survivingProjectiles: ProjectileItem[] = [];
        for (const pr of s.projectiles) {
          pr.life -= simDt;
          pr.age = (pr.age ?? 0) + simDt;
          if (pr.life <= 0) continue;

          if (!pr.trail) pr.trail = [];
          pr.trail.push({ x: pr.x, y: pr.y });
          if (pr.trail.length > 6) pr.trail.shift();

          const isHoming =
            pr.kind === 'missile' ||
            pr.kind === 'mortar' ||
            pr.kind === 'cluster' ||
            pr.kind === 'hunter' ||
            pr.kind === 'tempest_orb' ||
            pr.kind === 'hydra_fang' ||
            pr.kind === 'hell_rocket' ||
            pr.kind === 'shadow_drone' ||
            pr.kind === 'sovereign_orb';
          if (isHoming) {
            let tgt = s.enemies.find((e) => e.id === pr.targetId && e.hp > 0 && e.koTimer <= 0);
            if (!tgt) {
              // Re-acquire nearest enemy to avoid whiffing when original target dies mid-flight
              let bestD = 180 * 180;
              for (const cand of s.enemies) {
                if (cand.hp <= 0 || cand.koTimer > 0) continue;
                const dSq = (cand.x - pr.x) ** 2 + (cand.y - pr.y) ** 2;
                if (dSq <= bestD) {
                  bestD = dSq;
                  tgt = cand;
                }
              }
              if (tgt) pr.targetId = tgt.id;
            }
            // Brief 0.08s spread fan-out before smooth steering lock for missile/hunter salvos
            const steerDelay = pr.kind === 'missile' || pr.kind === 'hunter' ? 0.07 : 0;
            if (tgt && pr.age >= steerDelay) {
              const targetAngle = Math.atan2(tgt.y - pr.y, tgt.x - pr.x);
              const curAngle = Math.atan2(pr.vy, pr.vx);
              const diff = Math.atan2(Math.sin(targetAngle - curAngle), Math.cos(targetAngle - curAngle));
              const maxTurn = (pr.kind === 'hunter' ? 12 : 9.5) * simDt;
              const nextAngle = Math.abs(diff) <= maxTurn ? targetAngle : curAngle + Math.sign(diff) * maxTurn;
              pr.vx = Math.cos(nextAngle) * pr.speed;
              pr.vy = Math.sin(nextAngle) * pr.speed;
            }
          }

          if (
            (pr.kind === 'missile' ||
              pr.kind === 'mortar' ||
              pr.kind === 'cluster' ||
              pr.kind === 'hunter' ||
              pr.kind === 'cannon' ||
              pr.kind === 'plasma') &&
            Math.random() < 0.65
          ) {
            emitParticles(pr.x, pr.y, pr.color, 1, 32, pr.visualTier >= 3 ? 0.9 : 0.72);
          } else if (pr.kind === 'sawblade' && pr.visualTier >= 3 && Math.random() < 0.45) {
            emitParticles(pr.x, pr.y, '#FDE047', 1, 45, 0.75);
          }

          pr.x += pr.vx * simDt;
          pr.y += pr.vy * simDt;

          let hitEnemy: TdEnemy | null = null;
          for (const en of s.enemies) {
            if (en.hp <= 0 || en.koTimer > 0) continue;
            if (pr.hitIds && pr.hitIds.includes(en.id)) continue;
            const dSq = (en.x - pr.x) ** 2 + (en.y - pr.y) ** 2;
            if (dSq <= (en.radius + 9) ** 2) {
              hitEnemy = en;
              break;
            }
          }

          if (hitEnemy) {
            const sourceGun = s.guns.find((g) => g.id === pr.sourceGunId);
            if (pr.kind === 'mortar') {
              spawnCrater(pr.x, pr.y, Math.min(48, pr.splashRadius * 0.6), 'scorch');
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(62, pr.splashRadius * 0.52),
                alpha: 1,
                color: '#C084FC',
                spikes: 8,
                rot: s.animTime,
              });
              emitParticles(pr.x, pr.y, '#C084FC', 22 + pr.visualTier * 5, 185, 1.35);

              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dx = pr.x - en.x;
                const dy = pr.y - en.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= pr.splashRadius + en.radius) {
                  if (dist > 6 && en.kind !== 'boss') {
                    pullEnemyAlongTrack(en, s.map, pr.x, pr.y, pr.pullForce);
                  }
                  if (pr.slowAmount > 0) {
                    en.slowTimer = Math.max(en.slowTimer, 1.5);
                    en.slowFactor = Math.min(en.slowFactor || 1, 1 - pr.slowAmount);
                  }
                  if (pr.burnDps > 0) {
                    en.burnTimer = Math.max(en.burnTimer, pr.burnDuration);
                    en.burnDps = Math.max(en.burnDps, pr.burnDps);
                  }
                  const falloffDmg = Math.round(pr.damage * (dist < 42 ? 1 : 0.72));
                  const res = applyDamageToEnemy(en, falloffDmg, {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'missile' || pr.kind === 'bomblet') {
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: pr.kind === 'bomblet' ? 22 : Math.min(48, pr.splashRadius * 0.55),
                alpha: 0.96,
                color: pr.isClusterBomblet ? '#34D399' : '#FB923C',
                spikes: 6,
                rot: Math.random() * Math.PI,
              });
              emitParticles(pr.x, pr.y, pr.isClusterBomblet ? '#34D399' : '#FB923C', pr.kind === 'bomblet' ? 8 : 16, 145, 1.15);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  const dmg = Math.round(pr.damage * (dist < 28 ? 1 : 0.7));
                  const res = applyDamageToEnemy(en, dmg, {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              if (pr.kind === 'missile' && pr.spawnCluster) {
                for (let c = 0; c < 2; c++) {
                  const ca = c * Math.PI + Math.random() * 0.6;
                  s.projectiles.push({
                    id: s.nextProjId++,
                    kind: 'bomblet',
                    sourceGunId: pr.sourceGunId,
                    x: pr.x,
                    y: pr.y,
                    vx: Math.cos(ca) * 210,
                    vy: Math.sin(ca) * 210,
                    targetId: -1,
                    damage: Math.round(pr.damage * 0.32),
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                    splashRadius: 40,
                    pullForce: 0,
                    burnDps: 0,
                    burnDuration: 0,
                    slowAmount: 0,
                    pierceLeft: 0,
                    life: 0.24,
                    maxLife: 0.24,
                    age: 0,
                    speed: 210,
                    color: '#FDE047',
                    visualTier: pr.visualTier,
                  });
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'acid') {
              emitParticles(pr.x, pr.y, '#BEF264', 14, 130, 1.1);
              const res = applyDamageToEnemy(hitEnemy, pr.damage, {
                armorPierce: pr.armorPierce,
                shieldMult: pr.shieldMult,
              });
              s.totalDamage += res.actualDamage;
              if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(hitEnemy, pr.sourceGunId);

              const poolLife = pr.visualTier >= 3 ? 4.0 : pr.visualTier === 2 ? 3.8 : 3.2;
              if (s.acidPools.length >= 16) s.acidPools.shift();
              s.acidPools.push({
                x: pr.x,
                y: pr.y,
                radius: pr.splashRadius,
                life: poolLife,
                maxLife: poolLife,
                dps: Math.max(10, pr.burnDps),
                shred: pr.acidShred ?? 0.25,
                slowPct: pr.slowAmount,
                tickAccum: 0.25,
                sourceGunId: pr.sourceGunId,
                visualTier: pr.visualTier,
              });
              continue;
            } else if (pr.kind === 'sawblade') {
              const res = applyDamageToEnemy(hitEnemy, pr.damage, {
                armorPierce: pr.armorPierce,
                shieldMult: pr.shieldMult,
              });
              if (pr.burnDps > 0) {
                hitEnemy.burnTimer = Math.max(hitEnemy.burnTimer, pr.burnDuration);
                hitEnemy.burnDps = Math.max(hitEnemy.burnDps, pr.burnDps);
              }
              s.totalDamage += res.actualDamage;
              if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
              if (s.overdriveTimer <= 0) {
                s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
              }
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: 14,
                alpha: 0.85,
                color: pr.visualTier === 4 ? '#FDE047' : '#FB7185',
                spikes: 4,
                rot: s.animTime * 4,
              });
              emitParticles(pr.x, pr.y, '#F43F5E', 8, 120, 0.95);
              if (res.killed) recordKill(hitEnemy, pr.sourceGunId);

              pr.bounceLeft = (pr.bounceLeft ?? 1) - 1;
              if (!pr.hitIds) pr.hitIds = [];
              pr.hitIds.push(hitEnemy.id);
              if (pr.bounceLeft <= 0) continue;

              let nextRicochet: TdEnemy | null = null;
              let bestDistSq = 210 * 210;
              for (const cand of s.enemies) {
                if (cand.hp <= 0 || cand.koTimer > 0) continue;
                if (pr.hitIds.includes(cand.id)) continue;
                const dSq = (cand.x - pr.x) ** 2 + (cand.y - pr.y) ** 2;
                if (dSq <= bestDistSq) {
                  bestDistSq = dSq;
                  nextRicochet = cand;
                }
              }
              if (nextRicochet) {
                const a = Math.atan2(nextRicochet.y - pr.y, nextRicochet.x - pr.x);
                pr.vx = Math.cos(a) * pr.speed;
                pr.vy = Math.sin(a) * pr.speed;
              } else {
                const curAngle = Math.atan2(pr.vy, pr.vx) + Math.PI * 0.72;
                pr.vx = Math.cos(curAngle) * pr.speed;
                pr.vy = Math.sin(curAngle) * pr.speed;
              }
            } else if (pr.kind === 'cannon') {
              spawnCrater(pr.x, pr.y, Math.min(34, pr.splashRadius * 0.45), 'scorch');
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(48, pr.splashRadius * 0.56),
                alpha: 0.95,
                color: '#F59E0B',
                spikes: 6,
                rot: Math.random() * Math.PI,
              });
              emitParticles(pr.x, pr.y, '#FDE047', 14, 145, 1.15);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  if (pr.slowAmount > 0 && en.id === hitEnemy.id) {
                    en.stunTimer = Math.max(en.stunTimer, pr.slowAmount);
                  }
                  const res = applyDamageToEnemy(en, Math.round(pr.damage * (en.id === hitEnemy.id ? 1 : 0.6)), {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'plasma') {
              spawnCrater(pr.x, pr.y, Math.min(32, pr.splashRadius * 0.45), 'plasma');
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(42, pr.splashRadius * 0.54),
                alpha: 0.95,
                color: '#EC4899',
                spikes: 6,
                rot: s.animTime * 2,
              });
              emitParticles(pr.x, pr.y, '#F472B6', 12, 130, 1.1);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dx = pr.x - en.x;
                const dy = pr.y - en.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= pr.splashRadius + en.radius) {
                  if (pr.pullForce > 0 && dist > 6 && en.kind !== 'boss' && en.kind !== 'juggernaut') {
                    pullEnemyAlongTrack(en, s.map, pr.x, pr.y, pr.pullForce);
                  }
                  if (pr.burnDps > 0) {
                    en.burnTimer = Math.max(en.burnTimer, pr.burnDuration);
                    en.burnDps = Math.max(en.burnDps, pr.burnDps);
                  }
                  const res = applyDamageToEnemy(en, Math.round(pr.damage * (dist < 28 ? 1 : 0.68)), {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              continue;
            } else if (pr.kind === 'cluster') {
              spawnCrater(pr.x, pr.y, Math.min(42, pr.splashRadius * 0.5), 'scorch');
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(54, pr.splashRadius * 0.52),
                alpha: 0.95,
                color: '#10B981',
                spikes: 6,
                rot: Math.random() * Math.PI,
              });
              emitParticles(pr.x, pr.y, '#34D399', 16, 155, 1.2);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  if (pr.burnDps > 0) {
                    en.burnTimer = Math.max(en.burnTimer, pr.burnDuration);
                    en.burnDps = Math.max(en.burnDps, pr.burnDps);
                  }
                  if (pr.visualTier === 4) {
                    en.armorShred = Math.max(en.armorShred, 0.3);
                  }
                  const res = applyDamageToEnemy(en, Math.round(pr.damage * (dist < 32 ? 1 : 0.7)), {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              if (pr.spawnCluster) {
                const subCount = 4;
                for (let c = 0; c < subCount; c++) {
                  const ca = (c * Math.PI * 2) / subCount + Math.random() * 0.35;
                  s.projectiles.push({
                    id: s.nextProjId++,
                    kind: 'bomblet',
                    sourceGunId: pr.sourceGunId,
                    x: pr.x,
                    y: pr.y,
                    vx: Math.cos(ca) * 195,
                    vy: Math.sin(ca) * 195,
                    targetId: -1,
                    damage: Math.round(pr.damage * 0.3),
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                    splashRadius: 42,
                    pullForce: 0,
                    burnDps: pr.burnDps,
                    burnDuration: pr.burnDuration,
                    slowAmount: 0,
                    pierceLeft: 0,
                    life: 0.24,
                    maxLife: 0.24,
                    age: 0,
                    speed: 195,
                    color: '#34D399',
                    visualTier: pr.visualTier,
                    isClusterBomblet: true,
                  });
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'hunter') {
              const priorityBonus =
                pr.slowAmount > 1 &&
                (hitEnemy.kind === 'stealth' ||
                  hitEnemy.kind === 'teleporter' ||
                  hitEnemy.kind === 'healer' ||
                  hitEnemy.kind === 'summoner' ||
                  hitEnemy.kind === 'boss')
                  ? pr.slowAmount
                  : 1;
              const hitDmg = Math.round(pr.damage * priorityBonus);
              hitEnemy.slowTimer = Math.max(hitEnemy.slowTimer, 0.7);
              hitEnemy.slowFactor = Math.min(hitEnemy.slowFactor || 1, 0.86);
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: 15,
                alpha: 0.9,
                color: '#22D3EE',
                spikes: 4,
                rot: Math.PI / 4,
              });
              emitParticles(pr.x, pr.y, '#22D3EE', 7, 100, 0.9);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const isMain = en.id === hitEnemy.id;
                if (!isMain && (pr.splashRadius <= 0 || Math.hypot(en.x - pr.x, en.y - pr.y) > pr.splashRadius + en.radius)) {
                  continue;
                }
                const res = applyDamageToEnemy(en, isMain ? hitDmg : Math.round(hitDmg * 0.4), {
                  armorPierce: pr.armorPierce,
                  shieldMult: pr.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                if (s.overdriveTimer <= 0) {
                  s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
                }
                if (res.killed) recordKill(en, pr.sourceGunId);
              }
              continue;
            } else if (pr.kind === 'tempest_orb') {
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(54, Math.max(26, pr.splashRadius * 0.56)),
                alpha: 0.95,
                color: '#818CF8',
                spikes: 7,
                rot: s.animTime * 3,
              });
              emitParticles(pr.x, pr.y, '#A5B4FC', 14, 140, 1.15);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  en.slowTimer = Math.max(en.slowTimer, 1.6);
                  en.slowFactor = Math.min(en.slowFactor || 1, 1 - Math.min(0.34, pr.slowAmount));
                  if (pr.visualTier >= 3 && dist < 34) {
                    en.stunTimer = Math.max(en.stunTimer, 0.2);
                  }
                  const res = applyDamageToEnemy(en, Math.round(pr.damage * (dist < 28 ? 1 : 0.72)), {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              // Arc secondary EMP bolt at Lv7+
              if (pr.visualTier >= 3) {
                const arcTarget = s.enemies.find(
                  (e) => e.id !== hitEnemy.id && e.hp > 0 && e.koTimer <= 0 && Math.hypot(e.x - pr.x, e.y - pr.y) <= 135
                );
                if (arcTarget) {
                  s.lightningArcs.push({
                    points: [{ x: pr.x, y: pr.y }, { x: (pr.x + arcTarget.x) / 2 + (Math.random() * 16 - 8), y: (pr.y + arcTarget.y) / 2 + (Math.random() * 16 - 8) }, { x: arcTarget.x, y: arcTarget.y }],
                    alpha: 0.9,
                    color: '#38BDF8',
                    width: 2.8,
                  });
                  const arcRes = applyDamageToEnemy(arcTarget, Math.round(pr.damage * 0.55), {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += arcRes.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += arcRes.actualDamage;
                  if (arcRes.killed) recordKill(arcTarget, pr.sourceGunId);
                }
              }
              playSynthFx('tesla', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'reaper_disc') {
              const res = applyDamageToEnemy(hitEnemy, pr.damage, {
                armorPierce: pr.armorPierce,
                shieldMult: pr.shieldMult,
              });
              if (pr.burnDps > 0) {
                hitEnemy.burnTimer = Math.max(hitEnemy.burnTimer, pr.burnDuration);
                hitEnemy.burnDps = Math.max(hitEnemy.burnDps, pr.burnDps);
              }
              s.totalDamage += res.actualDamage;
              if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
              if (s.overdriveTimer <= 0) {
                s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
              }
              emitParticles(pr.x, pr.y, '#34D399', 8, 120, 0.95);
              if (res.killed) recordKill(hitEnemy, pr.sourceGunId);

              pr.bounceLeft = (pr.bounceLeft ?? 1) - 1;
              if (!pr.hitIds) pr.hitIds = [];
              pr.hitIds.push(hitEnemy.id);
              if (pr.bounceLeft <= 0) continue;

              let nextRicochet: TdEnemy | null = null;
              let bestDistSq = 225 * 225;
              for (const cand of s.enemies) {
                if (cand.hp <= 0 || cand.koTimer > 0) continue;
                if (pr.hitIds.includes(cand.id)) continue;
                const dSq = (cand.x - pr.x) ** 2 + (cand.y - pr.y) ** 2;
                if (dSq <= bestDistSq) {
                  bestDistSq = dSq;
                  nextRicochet = cand;
                }
              }
              if (nextRicochet) {
                const a = Math.atan2(nextRicochet.y - pr.y, nextRicochet.x - pr.x);
                pr.vx = Math.cos(a) * pr.speed;
                pr.vy = Math.sin(a) * pr.speed;
              } else {
                const curAngle = Math.atan2(pr.vy, pr.vx) + Math.PI * 0.72;
                pr.vx = Math.cos(curAngle) * pr.speed;
                pr.vy = Math.sin(curAngle) * pr.speed;
              }
            } else {
              // Bullet / Pellet / New Gun Projectiles (AoE, Slow, Burn, Pull, Acid Pool, Pierce)
              if (pr.burnDps > 0) {
                hitEnemy.burnTimer = Math.max(hitEnemy.burnTimer, pr.burnDuration);
                hitEnemy.burnDps = Math.max(hitEnemy.burnDps, pr.burnDps);
                hitEnemy.armorShred = Math.max(hitEnemy.armorShred, 0.18);
              }
              if ((pr.acidShred ?? 0) > 0) {
                hitEnemy.armorShred = Math.max(hitEnemy.armorShred, pr.acidShred ?? 0);
              }
              if (pr.slowAmount > 0) {
                hitEnemy.slowTimer = Math.max(hitEnemy.slowTimer, 1.4);
                hitEnemy.slowFactor = Math.min(hitEnemy.slowFactor || 1, 1 - Math.min(0.32, pr.slowAmount));
              }
              if (pr.kind === 'hydra_fang' && s.acidPools.length < 18) {
                s.acidPools.push({
                  x: pr.x,
                  y: pr.y,
                  radius: Math.max(42, pr.splashRadius * 0.78),
                  life: 2.8,
                  maxLife: 2.8,
                  dps: Math.max(12, pr.burnDps),
                  shred: pr.acidShred ?? 0.3,
                  slowPct: pr.slowAmount,
                  tickAccum: 0.25,
                  sourceGunId: pr.sourceGunId,
                  visualTier: pr.visualTier,
                });
              }
              if (pr.splashRadius > 0) {
                s.impactFlashes.push({
                  x: pr.x,
                  y: pr.y,
                  radius: Math.min(46, Math.max(16, pr.splashRadius * 0.45)),
                  alpha: 0.85,
                  color: pr.color || '#FDE047',
                  spikes: 5,
                  rot: Math.random() * Math.PI,
                });
                emitParticles(pr.x, pr.y, pr.color || '#FDE047', 7, 105, 0.9);
                for (const en of s.enemies) {
                  if (en.hp <= 0 || en.koTimer > 0) continue;
                  const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                  if (dist <= pr.splashRadius + en.radius) {
                    if (pr.pullForce > 0 && dist > 6) {
                      pullEnemyAlongTrack(en, s.map, pr.x, pr.y, pr.pullForce);
                    }
                    const res = applyDamageToEnemy(en, Math.round(pr.damage * (en.id === hitEnemy.id ? 1 : 0.48)), {
                      armorPierce: pr.armorPierce,
                      shieldMult: pr.shieldMult,
                    });
                    s.totalDamage += res.actualDamage;
                    if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                    if (s.overdriveTimer <= 0) {
                      s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                    }
                    if (res.killed) recordKill(en, pr.sourceGunId);
                  }
                }
              } else {
                const res = applyDamageToEnemy(hitEnemy, pr.damage, {
                  armorPierce: pr.armorPierce,
                  shieldMult: pr.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                if (s.overdriveTimer <= 0) {
                  s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
                }
                emitParticles(pr.x, pr.y, pr.color, 5, 85, 0.8);
                if (res.killed) recordKill(hitEnemy, pr.sourceGunId);
              }

              if (pr.pierceLeft > 0) {
                pr.pierceLeft -= 1;
                if (!pr.hitIds) pr.hitIds = [];
                pr.hitIds.push(hitEnemy.id);
              } else {
                continue;
              }
            }
          }

          if ((pr.kind === 'sawblade' || pr.kind === 'reaper_disc') && (pr.bounceLeft ?? 0) > 0) {
            if (pr.x < 10 || pr.x > CANVAS_WIDTH - 10) {
              pr.vx = -pr.vx;
              pr.x = Math.max(10, Math.min(CANVAS_WIDTH - 10, pr.x));
              pr.hitIds = [];
            }
            if (pr.y < 10 || pr.y > CANVAS_HEIGHT - 10) {
              pr.vy = -pr.vy;
              pr.y = Math.max(10, Math.min(CANVAS_HEIGHT - 10, pr.y));
              pr.hitIds = [];
            }
          }

          if (pr.x >= -20 && pr.x <= CANVAS_WIDTH + 20 && pr.y >= -20 && pr.y <= CANVAS_HEIGHT + 20) {
            survivingProjectiles.push(pr);
          }
        }
        s.projectiles = survivingProjectiles;

        // 3b. Step Acid Hazard Pools
        const activePools: AcidPoolFx[] = [];
        for (const pool of s.acidPools) {
          pool.life -= simDt;
          if (pool.life <= 0) continue;
          pool.tickAccum += simDt;
          if (pool.tickAccum >= 0.25) {
            pool.tickAccum -= 0.25;
            const sourceGun = s.guns.find((g) => g.id === pool.sourceGunId);
            const tickDmg = Math.max(3, Math.round(pool.dps * 0.25));
            for (const en of s.enemies) {
              if (en.hp <= 0 || en.koTimer > 0) continue;
              const dist = Math.hypot(en.x - pool.x, en.y - pool.y);
              if (dist <= pool.radius + en.radius) {
                en.armorShred = Math.max(en.armorShred, pool.shred);
                en.slowTimer = Math.max(en.slowTimer, 0.55);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - pool.slowPct);
                const res = applyDamageToEnemy(en, tickDmg, { armorPierce: 0.9, shieldMult: 1.05 });
                s.totalDamage += res.actualDamage;
                if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, pool.sourceGunId);
              }
            }
          }
          activePools.push(pool);
        }
        s.acidPools = activePools;

        // 4. Enemy Movement, Fire Burn DoT & Archetype Abilities
        if (s.enemies.length > 0) {
          const beforeIds = new Set(s.enemies.filter((e) => e.hp > 0).map((e) => e.id));
          const { coreDamageTaken, outcome } = stepEnemies(s.enemies, s.map, simDt);

          if (outcome.totalDamageDealt > 0 || outcome.killedCount > 0) {
            s.kills += outcome.killedCount;
            s.energy += outcome.energyGained;
            s.score += outcome.scoreGained;
            s.totalDamage += outcome.totalDamageDealt;
          }

          for (const hEv of outcome.healedEvents) {
            s.healBeams.push({ ...hEv, alpha: 0.95 });
            pushCombatText(hEv.toX, hEv.toY, `+${hEv.amount}`, '#4ADE80', 0.88);
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
          for (const sr of outcome.shieldRegenEvents) {
            s.shockwaves.push({
              x: sr.x,
              y: sr.y,
              radius: 10,
              maxRadius: 32,
              alpha: 0.78,
              color: '#38BDF8',
              lineWidth: 2,
            });
          }
          if (outcome.spawnRequests.length > 0 && s.enemies.length < 85) {
            for (const req of outcome.spawnRequests) {
              if (s.enemies.length >= 85) break;
              const summoned = createEnemyForWave(
                s.nextEnemyId++,
                req.kind,
                s.wave,
                s.map,
                false,
                s.difficulty,
                s.gameMode
              );
              summoned.x = req.x;
              summoned.y = req.y;
              summoned.heading = req.heading;
              summoned.waypointIndex = req.waypointIndex;
              summoned.hp = req.baseHp;
              summoned.maxHp = req.baseHp;
              summoned.speed = req.speed;
              summoned.radius = 11;
              summoned.reward = Math.max(5, Math.round(4 * 1.1));
              clampEnemyToTrackCorridor(summoned, s.map);
              s.enemies.push(summoned);
              emitParticles(summoned.x, summoned.y, '#C084FC', 6, 80, 0.85);
            }
          }
          for (const le of outcome.leechEvents) {
            s.shockwaves.push({
              x: le.x,
              y: le.y,
              radius: 12,
              maxRadius: le.radius,
              alpha: 0.72,
              color: '#A855F7',
              lineWidth: 2.2,
            });
            for (const g of s.guns) {
              const gPt = gridToWorldCenter(g.col, g.row);
              if (Math.hypot(gPt.x - le.x, gPt.y - le.y) <= le.radius) {
                g.chargeTimer = Math.max(-0.25, g.chargeTimer - 0.22);
              }
            }
          }

          for (const en of s.enemies) {
            if (en.koTimer >= 0.24 && beforeIds.has(en.id)) {
              emitParticles(en.x, en.y, '#FBBF24', 14, 130, 1.05);
              pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', 1);
            } else if (en.burnTimer > 0 && Math.random() < 0.4) {
              emitParticles(en.x, en.y, '#F97316', 1, 40, 0.85);
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

        // 5. Update transient FX (speed-scaled so 1x/2x/3x weapon FX stay crisp without stacking)
        const fxDt = dt * Math.min(2.0, s.speedMult);
        for (const p of s.particles) {
          if (!p.active) continue;
          p.life -= fxDt;
          if (p.life <= 0) {
            p.active = false;
            continue;
          }
          p.x += p.vx * fxDt;
          p.y += p.vy * fxDt;
          p.vx *= 0.92;
          p.vy *= 0.92;
        }
        s.shockwaves = s.shockwaves.filter((sw) => {
          sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, fxDt * 11) + (sw.maxRadius > sw.radius ? 55 : -55) * fxDt;
          sw.alpha -= fxDt * 4.5;
          return sw.alpha > 0.02;
        });
        s.lightningArcs = s.lightningArcs.filter((arc) => {
          arc.alpha -= fxDt * 5.2;
          return arc.alpha > 0.05;
        });
        s.railBeams = s.railBeams.filter((rb) => {
          rb.alpha -= fxDt * (rb.variant === 'sniper' ? 5.6 : 3.8);
          return rb.alpha > 0.04;
        });
        s.flameCones = s.flameCones.filter((fc) => {
          fc.alpha -= fxDt * 4.8;
          return fc.alpha > 0.04;
        });
        s.healBeams = s.healBeams.filter((hb) => {
          hb.alpha -= fxDt * 2.2;
          return hb.alpha > 0.04;
        });
        s.muzzleFlashes = s.muzzleFlashes.filter((mf) => {
          mf.alpha -= fxDt * 8.8;
          return mf.alpha > 0.04;
        });
        s.impactFlashes = s.impactFlashes.filter((im) => {
          im.alpha -= fxDt * 6.8;
          return im.alpha > 0.04;
        });
        s.frostShards = s.frostShards.filter((fs) => {
          fs.life -= fxDt;
          fs.x += fs.vx * fxDt;
          fs.y += fs.vy * fxDt;
          return fs.life > 0;
        });
        s.harmonicRays = s.harmonicRays.filter((hr) => {
          hr.alpha -= fxDt * 4.2;
          return hr.alpha > 0.04;
        });
        s.floatingTexts = s.floatingTexts.filter((ft) => {
          ft.y += ft.vy * fxDt;
          ft.alpha -= fxDt * 1.45;
          return ft.alpha > 0.04;
        });
        s.shellCasings = s.shellCasings.filter((sh) => {
          sh.life -= fxDt;
          sh.x += sh.vx * fxDt;
          sh.y += sh.vy * fxDt;
          sh.vy += 120 * fxDt;
          sh.vx *= 0.94;
          sh.rot += sh.vrot * fxDt;
          return sh.life > 0;
        });
        s.groundCraters = s.groundCraters.filter((cr) => {
          cr.life -= fxDt;
          return cr.life > 0;
        });
        s.overheatEffects = s.overheatEffects.filter((oh) => {
          oh.life -= fxDt;
          return oh.life > 0;
        });

        // 6. Wave Clear / Victory / Defeat Check
        if (s.waveActive && s.spawnQueue.length === 0 && s.enemies.length === 0 && s.coreHp > 0) {
          s.waveActive = false;
          const diffCfg = DIFFICULTY_CONFIGS[s.difficulty];
          const modeCfg = GAME_MODE_CONFIGS[s.gameMode];
          const waveBonus = Math.round((50 + s.wave * 18) * diffCfg.rewardMult * modeCfg.rewardMult);
          s.energy += waveBonus;
          s.score += Math.round(s.wave * 240 * diffCfg.scoreMult * modeCfg.scoreMult);

          if (s.gameMode !== 'endless' && s.wave >= s.totalWaves) {
            s.outcome = 'victory';
            s.score += Math.round(s.coreHp * 90 * diffCfg.scoreMult * modeCfg.scoreMult);
            if (s.score > s.bestScore) {
              s.bestScore = Math.round(s.score);
              saveBestScore(s.bestScore);
            }
            syncHudFromSim();
            setGameState('gameover');
            playSynthFx('victory', soundEnabled, audioCtxRef);
            return;
          } else {
            s.nextWaveTimer = modeCfg.waveDelaySec;
            const waveBadge = s.gameMode === 'endless' ? `${s.wave}/∞` : `${s.wave}/${s.totalWaves}`;
            setStatusNotice(
              `Hoàn thành Đợt ${waveBadge}! (+${waveBonus}⚡) · Tự gọi Đợt ${s.wave + 1} sau ${modeCfg.waveDelaySec}s.`
            );
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

          if (s.speedMult === 1 && s.shakeTrauma > 0.02) {
            const shakeAmt = s.shakeTrauma * s.shakeTrauma * 4;
            const sx = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
            const sy = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
            ctx.translate(sx, sy);
          }

          const palette = BIOME_PALETTES[s.map.biome];

          // 1. Tactical Biome Arena Floor
          ctx.fillStyle = palette.bg;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // 2. Grid + Walls + Track Tiles
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
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // 3. Animated Path Track Glow
          ctx.save();
          ctx.strokeStyle = palette.trackGlow;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 8]);
          ctx.lineDashOffset = -s.visualTime * 34;
          ctx.beginPath();
          s.map.path.forEach((wp, i) => {
            const pt = gridToWorldCenter(wp.col, wp.row);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.restore();

          // 4. Spawn Portal & Armored Core Reactor
          const spawnPt = gridToWorldCenter(s.map.path[0].col, s.map.path[0].row);
          const corePt = gridToWorldCenter(
            s.map.path[s.map.path.length - 1].col,
            s.map.path[s.map.path.length - 1].row
          );

          ctx.save();
          ctx.translate(spawnPt.x, spawnPt.y);
          ctx.rotate(s.visualTime * 2);
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

          const corePulse = s.speedMult > 1 ? 1 : 1 + Math.sin(s.visualTime * 4) * 0.05;
          ctx.save();
          ctx.translate(corePt.x, corePt.y);
          ctx.rotate(-s.visualTime * 1.4);
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
            const hasGun = s.guns.some(
              (g) => g.col === s.hoverTile!.col && g.row === s.hoverTile!.row
            );
            const hoverProfile = getGunCombatProfile(s.selectedTool, 1);
            ctx.save();
            ctx.strokeStyle = hasGun ? '#FBBF24' : hKind === 'empty' ? '#38BDF8' : '#F43F5E';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 3, hy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            if (!hasGun && hKind === 'empty') {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.arc(hx + TILE_SIZE / 2, hy + TILE_SIZE / 2, hoverProfile.rangePx, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 5b. Lingering Acid Hazard Pools (subtle bubbling floor puddle without noisy border ring)
          for (const pool of s.acidPools) {
            const fade = Math.min(1, pool.life / 0.8);
            ctx.save();
            ctx.globalAlpha = 0.22 * fade;
            ctx.fillStyle = pool.visualTier >= 3 ? '#84CC16' : '#65A30D';
            ctx.beginPath();
            ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 0.45 * fade;
            ctx.fillStyle = '#ECFCCB';
            for (let b = 0; b < 4; b++) {
              const ba = b * 1.57 + s.animTime * 2.2;
              const br = pool.radius * (0.28 + ((b * 0.21 + s.animTime * 0.35) % 0.45));
              ctx.beginPath();
              ctx.arc(pool.x + Math.cos(ba) * br, pool.y + Math.sin(ba) * br, 2 + (b % 2), 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          // 5c. Ground Scorch / Frost / Plasma Craters & Overheat Signature Effects
          drawGroundCraters(ctx, s.groundCraters);
          drawOverheatSpecialFx(ctx, s.overheatEffects, s.animTime);

          // 6. Shockwaves (ultra-faint hairline pulse for non-combat UI/status cues only)
          for (const sw of s.shockwaves) {
            ctx.save();
            ctx.globalAlpha = sw.alpha * 0.16;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = Math.min(1.2, sw.lineWidth * 0.4);
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 6b. Beacon Harmonic Star-Rays & Cryo Flying Ice Shards
          for (const hr of s.harmonicRays) {
            ctx.save();
            ctx.globalAlpha = hr.alpha * 0.55;
            ctx.strokeStyle = hr.color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hr.x + Math.cos(hr.angle) * 14, hr.y + Math.sin(hr.angle) * 14);
            ctx.lineTo(hr.x + Math.cos(hr.angle) * hr.length, hr.y + Math.sin(hr.angle) * hr.length);
            ctx.stroke();
            ctx.restore();
          }

          for (const fs of s.frostShards) {
            const fade = Math.max(0, fs.life / fs.maxLife);
            ctx.save();
            ctx.globalAlpha = fade * 0.92;
            ctx.translate(fs.x, fs.y);
            ctx.rotate(fs.rot);
            ctx.fillStyle = fs.color;
            ctx.beginPath();
            ctx.moveTo(fs.size, 0);
            ctx.lineTo(0, -fs.size * 0.34);
            ctx.lineTo(-fs.size * 0.65, 0);
            ctx.lineTo(0, fs.size * 0.34);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // 7. Railgun Mach-Ring Hyper-Beams, Prism Rainbow Beams & Sniper Razor Tracers
          for (const rb of s.railBeams) {
            drawRailBeamEnhanced(ctx, rb, s.animTime);
          }

          for (const fc of s.flameCones) {
            const fTier = fc.visualTier;
            ctx.save();
            ctx.translate(fc.x, fc.y);
            if (fc.isNova360) {
              // Lv10 360° Swirling Blue-White Plasma Nova Petals
              ctx.globalAlpha = fc.alpha * 0.48;
              const novaGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, fc.range);
              novaGrad.addColorStop(0, '#FFFFFF');
              novaGrad.addColorStop(0.35, '#38BDF8');
              novaGrad.addColorStop(0.7, 'rgba(56, 189, 248, 0.35)');
              novaGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
              ctx.fillStyle = novaGrad;
              for (let p = 0; p < 6; p++) {
                const pa = fc.angle + (p * Math.PI) / 3 + s.animTime * 2.5;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, fc.range, pa - 0.38, pa + 0.38);
                ctx.closePath();
                ctx.fill();
              }
              ctx.restore();
              continue;
            }
            ctx.rotate(fc.angle);
            ctx.globalAlpha = fc.alpha * 0.56;
            const outerGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, fc.range);
            if (fTier >= 3) {
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
            ctx.arc(0, 0, fc.range, -fc.halfArc, fc.halfArc);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = fc.alpha * 0.85;
            const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, fc.range * 0.68);
            innerGrad.addColorStop(0, '#FFFFFF');
            innerGrad.addColorStop(0.45, fTier >= 3 ? '#7DD3FC' : '#FEF08A');
            innerGrad.addColorStop(1, fTier >= 3 ? 'rgba(56, 189, 248, 0)' : 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, fc.range * 0.68, -fc.halfArc * 0.5, fc.halfArc * 0.5);
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

          // 8. Placed Guns (Lv1 .. Lv10 Evolving Sprites + All Support Gun Ally Buff Tethers)
          for (const sup of s.guns) {
            if (!isSupportGunType(sup.type)) continue;
            const sPt = gridToWorldCenter(sup.col, sup.row);
            const sProfile = getGunCombatProfile(sup.type, sup.level, sup.variant ?? 'alpha');
            const colorHex = sProfile.accentColor;
            ctx.save();
            ctx.strokeStyle = colorHex;
            ctx.globalAlpha = sup.id === s.selectedGunId ? 0.28 : 0.11;
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(sPt.x, sPt.y, sProfile.rangePx, 0, Math.PI * 2);
            ctx.stroke();
            for (const ally of s.guns) {
              if (ally.id === sup.id) continue;
              const aPt = gridToWorldCenter(ally.col, ally.row);
              if (Math.hypot(aPt.x - sPt.x, aPt.y - sPt.y) <= sProfile.rangePx + 4) {
                ctx.globalAlpha = 0.28;
                ctx.setLineDash([3, 4]);
                ctx.beginPath();
                ctx.moveTo(sPt.x, sPt.y);
                ctx.lineTo(aPt.x, aPt.y);
                ctx.stroke();
              }
            }
            ctx.restore();
          }

          for (const gun of s.guns) {
            const pt = gridToWorldCenter(gun.col, gun.row);
            const isSelected = gun.id === s.selectedGunId;
            const variant = gun.variant ?? 'alpha';
            const profile = getGunCombatProfile(gun.type, gun.level, variant);
            const teamBuff = computeTeamSupportBuffAtTile(s.guns, gun.col, gun.row);

            ctx.save();
            ctx.translate(pt.x, pt.y);
            if (teamBuff.hasSupportLink) {
              ctx.strokeStyle = teamBuff.linkColors[0] ?? 'rgba(250, 204, 21, 0.72)';
              ctx.globalAlpha = 0.72;
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(0, 0, 26, 0, Math.PI * 2);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
            if (isSelected) {
              ctx.strokeStyle = '#FBBF24';
              ctx.lineWidth = 2.2;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.arc(0, 0, 29, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(0, 0, profile.rangePx + Math.round(teamBuff.rangeBonusTiles * TILE_SIZE), 0, Math.PI * 2);
              ctx.stroke();
            }

            if (s.overdriveTimer > 0) {
              ctx.strokeStyle = 'rgba(251, 113, 133, 0.78)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 25 + Math.sin(s.animTime * 10) * 1.6, 0, Math.PI * 2);
              ctx.stroke();
            }

            drawGunTurretSprite(
              ctx,
              gun.type,
              gun.level,
              gun.aimAngle,
              gun.recoil,
              s.animTime,
              variant,
              gun.heat ?? 0,
              (gun.overheatTimer ?? 0) > 0
            );
            ctx.restore();
          }

          drawShellCasings(ctx, s.shellCasings);

          // 9. Upgraded High-Detail Enemies (Dreadnought Boss, Armored Units)
          for (const en of s.enemies) {
            drawEnemySprite(ctx, en, s.animTime);
          }

          // 10. Enhanced Projectiles with Motion Trails & Layered Cores
          for (const pr of s.projectiles) {
            drawProjectileEnhanced(ctx, pr, s.animTime);
          }

          // 11. Muzzle Flashes & Starburst Impact Blooms (zero hard concentric ring clutter)
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

          for (const im of s.impactFlashes) {
            ctx.save();
            ctx.globalAlpha = im.alpha * 0.85;
            ctx.translate(im.x, im.y);
            ctx.rotate(im.rot);
            const bloom = ctx.createRadialGradient(0, 0, 1, 0, 0, im.radius);
            bloom.addColorStop(0, '#FFFFFF');
            bloom.addColorStop(0.35, im.color);
            bloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = bloom;
            ctx.beginPath();
            ctx.arc(0, 0, im.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            const pts = im.spikes * 2;
            for (let k = 0; k < pts; k++) {
              const ka = (k * Math.PI * 2) / pts;
              const kr = k % 2 === 0 ? im.radius * 0.92 : im.radius * 0.22;
              const px = Math.cos(ka) * kr;
              const py = Math.sin(ka) * kr;
              if (k === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // 12. Chain Lightning
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

          // 13. Particles
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

          // 14. Floating Combat Text
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

      if (gameState === 'playing') {
        rafId = window.requestAnimationFrame(tickAndDraw);
      }
    };

    rafId = window.requestAnimationFrame(tickAndDraw);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState, recomputeFirepower, syncHudFromSim, emitParticles, pushCombatText, soundEnabled]);

  const selectedGun = useMemo(() => {
    if (!selectedGunId) return null;
    return simRef.current.guns.find((g) => g.id === selectedGunId) ?? null;
  }, [selectedGunId, hud.selectedGunVersion, hud.energy, hud.wave]);

  const inspectedVariant: GunVariant = selectedGun?.variant ?? 'alpha';
  const selectedProfile = selectedGun
    ? getGunCombatProfile(selectedGun.type, selectedGun.level, inspectedVariant)
    : null;
  const selectedNextProfile =
    selectedGun && selectedGun.level < MAX_GUN_LEVEL
      ? getGunCombatProfile(selectedGun.type, selectedGun.level + 1, inspectedVariant)
      : null;
  const selectedSpec = selectedGun ? getGunCatalogItem(selectedGun.type) : null;
  const selectedUpgradeCost = selectedGun ? getGunUpgradeCost(selectedGun.type, selectedGun.level) : null;
  const selectedSellRefund = selectedGun ? getGunSellRefund(selectedGun) : 0;
  const selectedTeamBuff = selectedGun
    ? computeTeamSupportBuffAtTile(simRef.current.guns, selectedGun.col, selectedGun.row)
    : null;

  return (
    <section
      id="prism-td-section"
      aria-label="Thủ Thành Pháo Đài — Thuần Súng Nâng Cấp Lv10"
      data-theme={theme}
      className={`relative bg-[#070B14] text-[#F1F5F9] ${
        isFullscreen
          ? gameState === 'playing' || gameState === 'paused'
            ? 'rounded-xl border border-slate-800/80 min-h-full lg:h-full lg:max-h-full mobile-ls:h-full mobile-ls:max-h-full mobile-ls:overflow-hidden lg:overflow-hidden flex flex-col'
            : 'rounded-xl border border-slate-800/80 min-h-full flex flex-col justify-between'
          : gameState === 'playing' || gameState === 'paused'
            ? 'overflow-hidden rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] shadow-[0_20px_50px_-24px_rgba(56,189,248,0.22)] mobile-ls:h-[calc(100dvh-46px)] mobile-ls:flex mobile-ls:flex-col'
            : 'overflow-hidden rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] shadow-[0_20px_50px_-24px_rgba(56,189,248,0.22)]'
      }`}
    >
      {/* TITLE SCREEN */}
      {gameState === 'title' && (
        <div className={`p-3 sm:p-4 lg:p-5 mobile-ls:p-2.5 space-y-3 mobile-ls:space-y-2 ${isFullscreen ? 'pt-12 sm:pt-5 mobile-ls:pt-10' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 mobile-ls:grid-cols-12 gap-5 lg:gap-7 mobile-ls:gap-3 items-start lg:items-center">
            <div className="lg:col-span-7 mobile-ls:col-span-7 space-y-4 mobile-ls:space-y-2">
              <div className="flex items-center gap-3.5 mobile-ls:gap-2.5">
                <div className="w-11 h-11 mobile-ls:w-9 mobile-ls:h-9 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shrink-0">
                  <Crosshair className="w-6 h-6 mobile-ls:w-5 mobile-ls:h-5 text-amber-300" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.15rem] mobile-ls:text-lg font-bold tracking-tight text-white leading-tight">
                    Thủ Thành Pháo Đài Lv10
                  </h1>
                  <p className="text-xs sm:text-sm mobile-ls:text-[10px] text-sky-300/90 font-mono">
                    4 Cấp · 8 Chế Độ · 16 Màn 16×10 (x2 Thời Lượng) · 39 Súng (23 Chung + 16 Đặc Quyền)
                    {hud.bestScore > 0 ? ` · Kỷ lục: ${hud.bestScore}đ` : ''}
                  </p>
                </div>
              </div>

              {/* 4 Difficulty Tiers Selector */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Cấp Độ Thử Thách (Cân Bằng Dễ → Địa Ngục)
                </p>
                <div
                  role="radiogroup"
                  aria-label="Chọn cấp độ thử thách"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {DIFFICULTY_ORDER.map((diffId) => {
                    const cfg = DIFFICULTY_CONFIGS[diffId];
                    const selected = difficulty === diffId;
                    return (
                      <button
                        key={diffId}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-testid={`td-diff-${diffId}`}
                        onClick={() => setDifficulty(diffId)}
                        className={`min-h-[48px] p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                        style={
                          selected
                            ? { borderColor: cfg.badgeColor, boxShadow: `0 0 0 1px ${cfg.badgeColor}` }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-xs font-bold tracking-wide"
                            style={{ color: cfg.badgeColor }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ×{cfg.hpMult} HP
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                          +{cfg.extraWaves} Đợt · ×{cfg.scoreMult} Điểm
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-mono text-slate-300 bg-[#0B1222] border border-slate-800 rounded-lg px-2.5 py-1.5 tabular-nums">
                  <span style={{ color: DIFFICULTY_CONFIGS[difficulty].badgeColor }} className="font-bold">
                    {DIFFICULTY_CONFIGS[difficulty].label}:
                  </span>{' '}
                  {DIFFICULTY_CONFIGS[difficulty].description} · Thông số trận:{' '}
                  <strong className="text-cyan-300">
                    {gameMode === 'endless' ? '∞ Đợt' : `${effectiveSetup.totalWaves} Đợt`}
                  </strong>{' '}
                  · <strong className="text-emerald-300">{effectiveSetup.startCoreHp} HP Lõi</strong> ·{' '}
                  <strong className="text-amber-300">{effectiveSetup.startEnergy}⚡</strong>
                </p>
              </div>

              {/* 8 Game Modes Selector */}
              <div className="space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Chế Độ Chơi (8 Chế Độ Chiến Thuật)
                </p>
                <div
                  role="radiogroup"
                  aria-label="Chọn chế độ chơi"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {GAME_MODE_ORDER.map((mId) => {
                    const mCfg = GAME_MODE_CONFIGS[mId];
                    const selected = gameMode === mId;
                    return (
                      <button
                        key={mId}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-testid={`td-mode-${mId}`}
                        onClick={() => setGameMode(mId)}
                        className={`min-h-[46px] p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                        style={
                          selected
                            ? { borderColor: mCfg.badgeColor, boxShadow: `0 0 0 1px ${mCfg.badgeColor}` }
                            : undefined
                        }
                      >
                        <div className="text-xs font-bold" style={{ color: mCfg.badgeColor }}>
                          {mCfg.label}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                          {mCfg.shortLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-mono text-slate-400 px-1">
                  {GAME_MODE_CONFIGS[gameMode].description}
                </p>
              </div>

              {/* Map Selection (16 Biome Maps 16x10 + Bespoke Map-Exclusive Gun Preview) */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Chiến Trường 16×10 ({PRISM_MAPS.length} Màn · Mỗi Màn 1 Súng Đặc Quyền Riêng)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PRISM_MAPS.map((m, idx) => {
                    const active = idx === selectedMapIndex;
                    const accent = BIOME_PALETTES[m.biome].accent;
                    const mapDiffCfg = DIFFICULTY_CONFIGS[m.recommendedDifficulty];
                    const mapExGun = getExclusiveGunForMap(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        data-testid={`td-map-${m.id}`}
                        onClick={() => setSelectedMapIndex(idx)}
                        className={`min-h-[54px] p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-amber-400 bg-amber-950/35 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-[10px] font-mono font-semibold truncate"
                            style={{ color: mapDiffCfg.badgeColor }}
                          >
                            {m.difficultyLabel}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: accent }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-[11px] font-bold mt-0.5 truncate">{m.name}</div>
                        {mapExGun && (
                          <div className="text-[9px] font-mono text-amber-300/90 truncate mt-0.5">
                            ★ {mapExGun.shortName}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-lg border border-amber-400/25 bg-[#0B1222] px-2.5 py-1.5 space-y-0.5">
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-white">{activeMap.name}:</strong> {activeMap.subtitle}
                  </p>
                  {exclusiveGun && (
                    <p className="text-[11px] font-mono text-amber-300 leading-snug">
                      ★ Súng Đặc Quyền Màn Này: <strong>{exclusiveGun.name}</strong> ({exclusiveGun.cost}⚡) — {exclusiveGun.roleClue}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startNewRun(selectedMapIndex, difficulty, gameMode)}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm sm:text-base transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    Vào Trận · {GAME_MODE_CONFIGS[gameMode].label} · {DIFFICULTY_CONFIGS[difficulty].label}
                  </span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 mobile-ls:col-span-5">
              <div className="rounded-xl border border-slate-700/80 bg-[#0B1222] p-3 mobile-ls:p-2 space-y-2.5 mobile-ls:space-y-1.5">
                <canvas
                  ref={titleCanvasRef}
                  aria-label="Mô phỏng pháo đài súng Lv10 giao tranh Boss"
                  className="w-full h-auto rounded-lg block border border-slate-800"
                />
                <p className="text-xs mobile-ls:text-[10px] text-slate-400 text-center">
                  Kho <strong className="text-amber-300">{GUN_CATALOG.length} loại súng</strong> (23 Chung + 16 Súng Đặc Quyền riêng theo từng màn) · Biến thể <strong className="text-cyan-300">α / ω</strong> · Kỹ năng <strong className="text-rose-300">Quá Nhiệt</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3 mobile-ls:pt-2 mobile-ls:text-[10px] text-center">
            Phím Y chọn Súng Đặc Quyền · 1-9, 0, Q, E, Z, X, C, V, B, N, F, G, K, L, H chọn Súng Chung · U nâng cấp · R α/ω · T mục tiêu · Space Quá Tải
          </p>
        </div>
      )}

      {/* PLAYING / PAUSED SHELL */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div
          className={`relative ${
            useSidebarTheater ? 'flex-1 min-h-0 flex flex-col' : ''
          }`}
        >
          {/* Top Unified HUD Strip (reserves top-right gap in Fullscreen so Exit Button never overlaps) */}
          <div
            className={`shrink-0 border-b border-slate-800 bg-[#0B1222] px-2.5 sm:px-4 mobile-ls:px-2 py-1.5 mobile-ls:py-1 flex flex-wrap items-center justify-between gap-2 mobile-ls:gap-1 ${
              isFullscreen ? 'pr-24 sm:pr-52 mobile-ls:pr-24' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 tabular-nums">
              <div
                data-testid="td-hud-difficulty"
                className="px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold tracking-wider uppercase"
                style={{
                  color: DIFFICULTY_CONFIGS[hud.difficulty].badgeColor,
                  borderColor: DIFFICULTY_CONFIGS[hud.difficulty].badgeColor,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                }}
              >
                {DIFFICULTY_CONFIGS[hud.difficulty].shortLabel} · {GAME_MODE_CONFIGS[hud.gameMode].shortLabel}
              </div>

              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 leading-none">LÕI</div>
                  <div className="text-xs sm:text-base font-bold text-white leading-tight">
                    {hud.coreHp}/{hud.maxCoreHp}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 leading-none">NĂNG LƯỢNG</div>
                  <div className="text-xs sm:text-base font-bold text-amber-300 leading-tight">
                    {hud.energy}⚡
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 leading-none">ĐỢT</div>
                <div className="text-xs sm:text-base font-bold text-cyan-300 leading-tight">
                  {hud.wave}/{hud.gameMode === 'endless' ? '∞' : hud.totalWaves}
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="text-[10px] font-mono text-slate-400 leading-none">HỎA LỰC</div>
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

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="td-overdrive-btn"
                onClick={activateOverdrive}
                disabled={hud.overdrivePct < 100 || hud.overdriveActive}
                title="Kích hoạt Hội Tụ Hỏa Lực & bùng nổ Quá Nhiệt toàn đội hình (Space)"
                className={`min-h-[38px] sm:h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  hud.overdriveActive
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : hud.overdrivePct >= 100
                      ? 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-[#070B14]'
                      : 'bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {hud.overdriveActive ? 'QUÁ TẢI!' : `Hỏa Lực ${hud.overdrivePct}%`}
                </span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                data-testid="td-speed-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  simRef.current.speedMult =
                    simRef.current.speedMult === 1 ? 2 : simRef.current.speedMult === 2 ? 3 : 1;
                  syncHudFromSim();
                }}
                aria-label="Đổi tốc độ mô phỏng (1x, 2x, 3x)"
                className={`min-h-[38px] sm:h-9 px-2.5 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer touch-manipulation select-none ${
                  hud.speedMult === 3
                    ? 'bg-amber-400 text-[#070B14] border-amber-300'
                    : hud.speedMult === 2
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
                  unlockPrismAudio(audioCtxRef);
                  setSoundEnabled((p) => !p);
                }}
                aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="min-w-[40px] min-h-[40px] sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
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
                className="min-w-[40px] min-h-[40px] sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  startNewRun(selectedMapIndex, difficulty, gameMode);
                }}
                aria-label="Chơi lại ván này"
                className="min-w-[40px] min-h-[40px] sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Theater Area: Widescreen 2-Col in Fullscreen or iPhone Mobile Landscape so Map + Support Guns + Start Wave stay side-by-side */}
          <div
            className={
              useSidebarTheater
                ? 'flex-1 min-h-0 flex flex-col mobile-ls:grid mobile-ls:grid-cols-[minmax(0,1fr)_268px] lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]'
                : ''
            }
          >
            {/* Arena Canvas (Responsive 16:10) */}
            <div
              className={`p-1 sm:p-1.5 bg-[#050811] ${
                useSidebarTheater ? 'min-w-0 min-h-0 flex-1 flex items-center justify-center lg:p-2 mobile-ls:p-1' : ''
              }`}
            >
              <div
                className={
                  useSidebarTheater
                    ? isFullscreen
                      ? 'w-full mx-auto max-w-[min(100%,calc((100dvh-280px)*1.6))] mobile-ls:max-w-[min(100%,calc((100dvh-58px)*1.6))] lg:max-w-[min(100%,calc((100dvh-82px)*1.6))]'
                      : 'w-full mx-auto max-w-[940px] mobile-ls:max-w-[min(100%,calc((100dvh-96px)*1.6))]'
                    : 'max-w-[940px] mx-auto'
                }
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  data-testid="prism-td-canvas"
                  aria-label="Bản đồ Thủ Thành Pháo Đài 16x10"
                  onPointerDown={(e) => {
                    lastPointerTypeRef.current = e.pointerType || 'touch';
                  }}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerLeave={handleCanvasPointerLeave}
                  onClick={handleCanvasClick}
                  onContextMenu={handleCanvasContextMenu}
                  className="w-full h-auto aspect-[16/10] rounded-xl border border-slate-800 block cursor-crosshair select-none touch-manipulation"
                />
              </div>
            </div>

            {/* 24-Gun Arsenal Dock & Tactical Command Sidebar */}
            <div
              className={`border-t border-slate-800 bg-[#0B1222] ${
                useSidebarTheater
                  ? 'mobile-ls:border-t-0 mobile-ls:border-l lg:border-t-0 lg:border-l flex flex-col min-h-0 mobile-ls:max-h-full'
                  : 'px-2.5 sm:px-4 py-2 space-y-2'
              }`}
            >
              {/* Dock Header */}
              <div
                className={`flex flex-wrap items-center justify-between gap-2 mobile-ls:gap-1 ${
                  useSidebarTheater ? 'shrink-0 px-2.5 py-2 mobile-ls:px-2 mobile-ls:py-1 border-b border-slate-800/80' : ''
                }`}
              >
                <span className="text-[11px] mobile-ls:text-[10px] font-mono uppercase tracking-[0.08em] text-slate-400">
                  Kho {availableGuns.length} Súng (★ {exclusiveGun?.shortName ?? ''} + 23 Chung)
                </span>
                <div className="flex items-center gap-1.5" role="group" aria-label="Biến thể mặc định khi đặt súng">
                  <button
                    type="button"
                    onClick={() => setSelectedVariant('alpha')}
                    className={`min-h-[32px] mobile-ls:min-h-[28px] px-2 rounded-lg border text-[11px] mobile-ls:text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      selectedVariant === 'alpha'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    α Alpha{!useSidebarTheater && ' · Tốc/Đa Tia'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVariant('omega')}
                    className={`min-h-[32px] mobile-ls:min-h-[28px] px-2 rounded-lg border text-[11px] mobile-ls:text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      selectedVariant === 'omega'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    ω Omega{!useSidebarTheater && ' · Sát Thương'}
                  </button>
                </div>
              </div>

              {/* Scrollable Middle in Sidebar Theater: Inspector (on top when selected) + All 24 Guns */}
              <div
                ref={sidebarScrollRef}
                className={useSidebarTheater ? 'flex-1 min-h-0 overflow-y-auto p-2 mobile-ls:p-1.5 space-y-2 mobile-ls:space-y-1.5' : 'space-y-2'}
              >
                {/* Selected Gun Inspector (placed first in sidebar so clicking/tapping a gun reveals upgrades immediately) */}
                {useSidebarTheater && selectedGun && selectedProfile && selectedSpec && (
                  <div
                    data-testid="td-gun-inspector"
                    className="rounded-xl border bg-gradient-to-br from-slate-900/95 via-[#0E1729] to-slate-950 p-2.5 mobile-ls:p-2 space-y-2 mobile-ls:space-y-1.5 transition-all"
                    style={{ borderColor: `${selectedProfile.accentColor}66` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-white truncate">{selectedSpec.name}</span>
                      <div className="flex items-center gap-1">
                        <span
                          data-testid="td-gun-level-badge"
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            selectedGun.level === MAX_GUN_LEVEL
                              ? 'bg-amber-400 text-[#070B14]'
                              : selectedGun.level >= 7
                                ? 'bg-rose-500/20 border border-rose-400/50 text-rose-200'
                                : selectedGun.level >= 4
                                  ? 'bg-sky-500/20 border border-sky-400/50 text-sky-200'
                                  : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          Lv.{selectedGun.level}/{MAX_GUN_LEVEL} · {selectedProfile.tierLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            simRef.current.selectedGunId = null;
                            setSelectedGunId(null);
                          }}
                          aria-label="Đóng bảng súng và quay lại kho súng"
                          className="min-h-[24px] px-1.5 rounded border border-slate-700 bg-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white text-[10px] font-mono inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Kho</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300 tabular-nums">
                      <span>
                        DMG <strong className="text-white">{selectedProfile.damage}</strong>
                        {selectedNextProfile && selectedNextProfile.damage > selectedProfile.damage && (
                          <span className="text-emerald-400 ml-0.5">(+{selectedNextProfile.damage - selectedProfile.damage})</span>
                        )}
                      </span>
                      <span>·</span>
                      <span>
                        DPS <strong className="text-sky-300">{selectedProfile.dpsEstimate}</strong>
                        {selectedNextProfile && selectedNextProfile.dpsEstimate > selectedProfile.dpsEstimate && (
                          <span className="text-emerald-400 ml-0.5">(+{selectedNextProfile.dpsEstimate - selectedProfile.dpsEstimate})</span>
                        )}
                      </span>
                      <span>·</span>
                      <span>Tầm <strong className="text-cyan-300">{selectedProfile.rangeTiles}ô</strong></span>
                      <span>·</span>
                      <span>Hạ <strong className="text-amber-300">{selectedGun.kills}</strong></span>
                    </div>

                    {selectedTeamBuff?.hasSupportLink && (
                      <div className="flex flex-wrap items-center gap-1 text-[9px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-md px-1.5 py-1">
                        <span className="font-bold">BUFF TEAM:</span>
                        {selectedTeamBuff.speedMult > 1 && <span>+{Math.round((selectedTeamBuff.speedMult - 1) * 100)}% Tốc</span>}
                        {selectedTeamBuff.damageMult > 1 && <span>+{Math.round((selectedTeamBuff.damageMult - 1) * 100)}% DMG</span>}
                        {selectedTeamBuff.rangeBonusTiles > 0 && <span>+{selectedTeamBuff.rangeBonusTiles}ô Tầm</span>}
                        {selectedTeamBuff.armorPierceBonus > 0 && <span>+{Math.round(selectedTeamBuff.armorPierceBonus * 100)}% Giáp</span>}
                        {selectedTeamBuff.shieldMultBonus > 0 && <span>+{Math.round(selectedTeamBuff.shieldMultBonus * 100)}% Khiên</span>}
                        {selectedTeamBuff.heatCoolMult > 1 && <span>+{Math.round((selectedTeamBuff.heatCoolMult - 1) * 100)}% Tản Nhiệt</span>}
                      </div>
                    )}

                    <div className="flex items-center gap-1" aria-label="Tiến trình nâng cấp Lv1 đến Lv10">
                      {Array.from({ length: MAX_GUN_LEVEL }, (_, i) => {
                        const lv = i + 1;
                        const active = selectedGun.level >= lv;
                        const isBreakthrough = lv === 3 || lv === 5 || lv === 7 || lv === 10;
                        return (
                          <div
                            key={lv}
                            className={`h-1.5 flex-1 rounded-full ${
                              active
                                ? lv === 10
                                  ? 'bg-amber-400'
                                  : isBreakthrough
                                    ? 'bg-cyan-400'
                                    : 'bg-emerald-400'
                                : isBreakthrough
                                  ? 'bg-slate-700 ring-1 ring-amber-400/40'
                                  : 'bg-slate-800'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          cycleSelectedPriority();
                        }}
                        className="min-h-[38px] mobile-ls:min-h-[34px] px-2 rounded-lg border border-slate-700 bg-slate-800 hover:border-cyan-400 text-cyan-200 text-[11px] font-mono cursor-pointer truncate"
                      >
                        [T] {PRIORITY_LABELS[selectedGun.priority]}
                      </button>
                      <button
                        type="button"
                        data-testid="td-upgrade-btn"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          upgradeSelectedGun();
                        }}
                        disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                        className={`min-h-[38px] mobile-ls:min-h-[34px] px-2 rounded-lg text-[11px] font-mono font-bold cursor-pointer truncate ${
                          selectedUpgradeCost === null
                            ? 'bg-amber-400/20 border border-amber-400 text-amber-300 cursor-default'
                            : hud.energy >= selectedUpgradeCost
                              ? 'bg-amber-400 text-[#070B14] hover:bg-amber-300'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {selectedUpgradeCost === null ? 'MAX LV10' : `[U] Lv${selectedGun.level + 1} (${selectedUpgradeCost}⚡)`}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.currentTarget.blur();
                          sellSelectedGun();
                        }}
                        aria-label="Thu hồi trụ súng"
                        className="min-h-[38px] mobile-ls:min-h-[34px] px-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-[11px] font-mono inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>+{selectedSellRefund}⚡</span>
                      </button>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-[#080E1C] p-2 space-y-1">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                        <span className="font-bold flex items-center gap-1 truncate" style={{ color: selectedProfile.overheatSkill.color }}>
                          <Flame className="w-3 h-3 shrink-0" />
                          {selectedProfile.overheatSkill.name}
                        </span>
                        <span className="tabular-nums text-slate-300 shrink-0">
                          {(selectedGun.overheatTimer ?? 0) > 0 ? 'BÙNG NỔ!' : `${Math.round(selectedGun.heat ?? 0)}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full transition-all duration-150"
                          style={{
                            width: `${(selectedGun.overheatTimer ?? 0) > 0 ? 100 : Math.min(100, selectedGun.heat ?? 0)}%`,
                            backgroundColor: (selectedGun.overheatTimer ?? 0) > 0 ? '#FB7185' : selectedProfile.overheatSkill.color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {(['alpha', 'omega'] as const).map((vId) => {
                        const vSpec = selectedSpec.variants[vId];
                        const active = inspectedVariant === vId;
                        return (
                          <button
                            key={vId}
                            type="button"
                            data-testid={`td-variant-${vId}`}
                            onClick={(e) => {
                              e.currentTarget.blur();
                              switchSelectedGunVariant(vId);
                            }}
                            className={`min-h-[38px] mobile-ls:min-h-[34px] px-2 py-1 rounded-lg border text-left transition-colors cursor-pointer ${
                              active ? 'bg-slate-800/95 text-white' : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600'
                            }`}
                            style={active ? { borderColor: vSpec.accentColor } : undefined}
                          >
                            <div className="text-[10px] font-bold truncate" style={{ color: active ? vSpec.accentColor : undefined }}>
                              {vSpec.shortTag}
                            </div>
                            <p className="text-[9px] text-slate-400 truncate">{vSpec.summary}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 24-Gun Arsenal Grid */}
                <div
                  className={
                    useSidebarTheater
                      ? 'flex flex-nowrap overflow-x-auto gap-1.5 pb-1 mobile-ls:grid mobile-ls:grid-cols-2 mobile-ls:overflow-visible mobile-ls:pb-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0'
                      : 'flex flex-nowrap overflow-x-auto gap-1.5 pb-1 md:grid md:grid-cols-8 md:overflow-visible md:pb-0'
                  }
                >
                  {availableGuns.map((item) => {
                    const isActive = selectedTool === item.type;
                    const canAfford = hud.energy >= item.cost;
                    const isExclusive = Boolean(item.exclusiveMapId);
                    const isSupport = isSupportGunType(item.type);
                    return (
                      <button
                        key={item.type}
                        type="button"
                        data-testid={`td-gun-${item.type}`}
                        onClick={(e) => {
                          e.currentTarget.blur();
                          unlockPrismAudio(audioCtxRef);
                          setSelectedTool(item.type);
                        }}
                        className={`min-w-[116px] ${
                          useSidebarTheater ? 'mobile-ls:min-w-0 mobile-ls:min-h-[38px] lg:min-w-0 min-h-[42px]' : 'md:min-w-0 min-h-[46px]'
                        } shrink-0 px-2 py-1 rounded-xl border text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-950/65 border-amber-400 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.45)]'
                            : isExclusive
                              ? 'bg-amber-950/25 border-amber-500/50 text-amber-100 hover:border-amber-400'
                              : isSupport
                                ? 'bg-emerald-950/25 border-emerald-500/45 text-emerald-100 hover:border-emerald-400'
                                : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] mobile-ls:text-[10px] font-bold">
                          <span className="truncate">
                            <span className="hidden lg:inline">[{item.hotkey.toUpperCase()}] </span>
                            {item.shortName}
                          </span>
                          <span className={`font-mono shrink-0 ${canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
                            {item.cost}⚡
                          </span>
                        </div>
                        <p className={`text-[9px] truncate mt-0.5 ${isExclusive ? 'text-amber-300/90 font-semibold' : isSupport ? 'text-emerald-300/90' : 'text-slate-400'}`}>
                          {isExclusive ? '★ Đặc Quyền' : isSupport ? '✦ Hỗ Trợ Team' : item.roleClue}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Embedded (non-sidebar) Selected Gun Inspector */}
                {!useSidebarTheater && selectedGun && selectedProfile && selectedSpec && (
                  <div
                    data-testid="td-gun-inspector"
                    className="rounded-xl border bg-gradient-to-br from-slate-900/95 via-[#0E1729] to-slate-950 p-3 space-y-2.5 transition-all"
                    style={{ borderColor: `${selectedProfile.accentColor}66` }}
                  >
                    {/* Header + Live Stats + Next-Level Deltas */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{selectedSpec.name}</span>
                          <span
                            data-testid="td-gun-level-badge"
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              selectedGun.level === MAX_GUN_LEVEL
                                ? 'bg-amber-400 text-[#070B14]'
                                : selectedGun.level >= 7
                                  ? 'bg-rose-500/20 border border-rose-400/50 text-rose-200'
                                  : selectedGun.level >= 4
                                    ? 'bg-sky-500/20 border border-sky-400/50 text-sky-200'
                                    : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            Lv.{selectedGun.level}/{MAX_GUN_LEVEL} · {selectedProfile.tierLabel}
                          </span>
                          <span
                            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border"
                            style={{
                              color: selectedProfile.variantSpec.accentColor,
                              borderColor: `${selectedProfile.variantSpec.accentColor}66`,
                              backgroundColor: 'rgba(15, 23, 42, 0.85)',
                            }}
                          >
                            {selectedProfile.variantSpec.shortTag}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              simRef.current.selectedGunId = null;
                              setSelectedGunId(null);
                            }}
                            aria-label="Đóng bảng súng"
                            className="ml-auto min-h-[26px] px-2 rounded-md border border-slate-700 bg-slate-800 hover:border-cyan-400 text-slate-300 hover:text-white text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Kho Súng</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300 tabular-nums">
                          <span>
                            DMG <strong className="text-white">{selectedProfile.damage}</strong>
                            {selectedNextProfile && selectedNextProfile.damage > selectedProfile.damage && (
                              <span className="text-emerald-400 ml-0.5">
                                (+{selectedNextProfile.damage - selectedProfile.damage})
                              </span>
                            )}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span>
                            DPS <strong className="text-sky-300">{selectedProfile.dpsEstimate}</strong>
                            {selectedNextProfile && selectedNextProfile.dpsEstimate > selectedProfile.dpsEstimate && (
                              <span className="text-emerald-400 ml-0.5">
                                (+{selectedNextProfile.dpsEstimate - selectedProfile.dpsEstimate})
                              </span>
                            )}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span>
                            Tầm <strong className="text-cyan-300">{selectedProfile.rangeTiles}ô</strong>
                            {selectedNextProfile && selectedNextProfile.rangeTiles > selectedProfile.rangeTiles && (
                              <span className="text-emerald-400 ml-0.5">
                                (+{Number((selectedNextProfile.rangeTiles - selectedProfile.rangeTiles).toFixed(2))})
                              </span>
                            )}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span>Hạ <strong className="text-amber-300">{selectedGun.kills}</strong></span>
                        </div>

                        {selectedTeamBuff?.hasSupportLink && (
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-md px-2 py-1">
                            <span className="font-bold">BUFF ĐỘI HÌNH:</span>
                            {selectedTeamBuff.speedMult > 1 && <span>+{Math.round((selectedTeamBuff.speedMult - 1) * 100)}% Tốc</span>}
                            {selectedTeamBuff.damageMult > 1 && <span>+{Math.round((selectedTeamBuff.damageMult - 1) * 100)}% DMG</span>}
                            {selectedTeamBuff.rangeBonusTiles > 0 && <span>+{selectedTeamBuff.rangeBonusTiles}ô Tầm</span>}
                            {selectedTeamBuff.armorPierceBonus > 0 && <span>+{Math.round(selectedTeamBuff.armorPierceBonus * 100)}% Xuyên Giáp</span>}
                            {selectedTeamBuff.shieldMultBonus > 0 && <span>+{Math.round(selectedTeamBuff.shieldMultBonus * 100)}% Phá Khiên</span>}
                            {selectedTeamBuff.heatCoolMult > 1 && <span>+{Math.round((selectedTeamBuff.heatCoolMult - 1) * 100)}% Tản Nhiệt</span>}
                          </div>
                        )}

                        {/* 10-Step Level Progression Bar */}
                        <div className="flex items-center gap-1 pt-0.5" aria-label="Tiến trình nâng cấp Lv1 đến Lv10">
                          {Array.from({ length: MAX_GUN_LEVEL }, (_, i) => {
                            const lv = i + 1;
                            const active = selectedGun.level >= lv;
                            const isBreakthrough = lv === 3 || lv === 5 || lv === 7 || lv === 10;
                            return (
                              <div
                                key={lv}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                  active
                                    ? lv === 10
                                      ? 'bg-amber-400'
                                      : isBreakthrough
                                        ? 'bg-cyan-400'
                                        : 'bg-emerald-400'
                                    : isBreakthrough
                                      ? 'bg-slate-700 ring-1 ring-amber-400/40'
                                      : 'bg-slate-800'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Primary Action Buttons (Touch >= 44px) */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            cycleSelectedPriority();
                          }}
                          title="Đổi ưu tiên mục tiêu [T]"
                          className="min-h-[44px] px-3 rounded-xl border border-slate-700 bg-slate-800 hover:border-cyan-400 text-cyan-200 text-xs font-mono cursor-pointer"
                        >
                          [T] {PRIORITY_LABELS[selectedGun.priority]}
                        </button>
                        <button
                          type="button"
                          data-testid="td-upgrade-btn"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            upgradeSelectedGun();
                          }}
                          disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                          className={`min-h-[44px] px-3.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                            selectedUpgradeCost === null
                              ? 'bg-amber-400/20 border border-amber-400 text-amber-300 cursor-default'
                              : hud.energy >= selectedUpgradeCost
                                ? 'bg-amber-400 text-[#070B14] hover:bg-amber-300'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {selectedUpgradeCost === null
                            ? 'MAX LV 10'
                            : `[U] Nâng Lv${selectedGun.level + 1} (${selectedUpgradeCost}⚡)`}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            sellSelectedGun();
                          }}
                          aria-label="Thu hồi trụ súng"
                          className="min-h-[44px] px-3 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>+{selectedSellRefund}⚡</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Heat / Overheat Skill + α/ω Variant Switcher Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-1 border-t border-slate-800/90">
                      <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#080E1C] p-2 space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="font-bold flex items-center gap-1" style={{ color: selectedProfile.overheatSkill.color }}>
                            <Flame className="w-3.5 h-3.5 shrink-0" />
                            Quá Nhiệt: {selectedProfile.overheatSkill.name}
                          </span>
                          <span className="tabular-nums text-slate-300">
                            {(selectedGun.overheatTimer ?? 0) > 0
                              ? 'ĐANG BÙNG NỔ!'
                              : `${Math.round(selectedGun.heat ?? 0)}%`}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full transition-all duration-150"
                            style={{
                              width: `${(selectedGun.overheatTimer ?? 0) > 0 ? 100 : Math.min(100, selectedGun.heat ?? 0)}%`,
                              backgroundColor: (selectedGun.overheatTimer ?? 0) > 0 ? '#FB7185' : selectedProfile.overheatSkill.color,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {selectedProfile.overheatSkill.summary}
                        </p>
                      </div>

                      <div className="lg:col-span-6 grid grid-cols-2 gap-1.5">
                        {(['alpha', 'omega'] as const).map((vId) => {
                          const vSpec = selectedSpec.variants[vId];
                          const active = inspectedVariant === vId;
                          return (
                            <button
                              key={vId}
                              type="button"
                              data-testid={`td-variant-${vId}`}
                              onClick={(e) => {
                                e.currentTarget.blur();
                                switchSelectedGunVariant(vId);
                              }}
                              className={`min-h-[44px] px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                                active
                                  ? 'bg-slate-800/95 text-white'
                                  : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600'
                              }`}
                              style={
                                active
                                  ? { borderColor: vSpec.accentColor, boxShadow: `0 0 0 1px ${vSpec.accentColor}55` }
                                  : undefined
                              }
                            >
                              <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                                <span style={{ color: active ? vSpec.accentColor : undefined }}>{vSpec.shortTag}</span>
                                {active && <span className="text-[9px] font-mono text-emerald-400">ĐANG DÙNG</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{vSpec.summary}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      {selectedSpec.milestones.map((ms) => {
                        const unlocked = selectedGun.level >= ms.level;
                        return (
                          <span
                            key={ms.level}
                            title={ms.summary}
                            className={`px-2 py-0.5 rounded-md border font-mono ${
                              unlocked
                                ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                                : 'border-slate-700 bg-slate-950/60 text-slate-500'
                            }`}
                          >
                            {unlocked ? '✓ ' : ''}Lv{ms.level}: {ms.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Pinned Bottom Action Bar (ALWAYS visible in Sidebar Theater & Normal mode) */}
              <div
                className={
                  useSidebarTheater
                    ? 'shrink-0 border-t border-slate-800 bg-[#080E1C] p-2 mobile-ls:p-1.5 space-y-1.5 mobile-ls:space-y-1'
                    : 'flex flex-wrap items-center justify-between gap-2'
                }
              >
                <p
                  className={`text-[11px] mobile-ls:text-[10px] font-mono text-slate-400 ${
                    useSidebarTheater ? 'line-clamp-2 mobile-ls:line-clamp-1' : 'line-clamp-2 sm:truncate max-w-lg'
                  }`}
                >
                  {statusNotice || `${activeMap.name} · Chạm ô trống đặt súng hoặc chạm súng để nâng Lv1→Lv10 & đổi α/ω.`}
                </p>

                <button
                  type="button"
                  data-testid="prism-wave-btn"
                  onClick={launchNextWave}
                  disabled={hud.waveActive || (hud.gameMode !== 'endless' && hud.wave >= hud.totalWaves)}
                  className={`min-h-[44px] mobile-ls:min-h-[38px] ${
                    useSidebarTheater ? 'w-full' : 'w-full sm:w-auto'
                  } px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm mobile-ls:text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                    hud.waveActive
                      ? 'bg-slate-800 text-slate-300 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-[#070B14]'
                  }`}
                >
                  <Play className="w-4 h-4 shrink-0" />
                  <span>
                    {hud.waveActive
                      ? `Đợt ${hud.wave}/${hud.gameMode === 'endless' ? '∞' : hud.totalWaves} · Còn ${hud.remainingEnemies} quái`
                      : `Gọi Đợt ${hud.wave + 1}/${hud.gameMode === 'endless' ? '∞' : hud.totalWaves} (Tự gọi: ${hud.nextWaveCountdown}s)`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* PAUSED MODAL */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#070B14]/90 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border border-amber-500/50 bg-[#0F172A] p-6 text-center space-y-4">
                <h2 className="font-serif text-xl font-bold text-white">Tạm Dừng Pháo Đài</h2>
                <p className="text-xs font-mono text-slate-300 tabular-nums">
                  {activeMap.name} · {DIFFICULTY_CONFIGS[hud.difficulty].label} · Đợt {hud.wave}/{hud.totalWaves} · Điểm {hud.score}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setGameState('playing')}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm cursor-pointer"
                  >
                    Tiếp Tục Chiến Đấu
                  </button>
                  <button
                    type="button"
                    onClick={() => startNewRun(selectedMapIndex, difficulty, gameMode)}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium hover:border-amber-400 cursor-pointer"
                  >
                    Chơi Lại Màn Này
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameState('title')}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:text-white cursor-pointer"
                  >
                    Chọn Màn Chơi Khác
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
            {hud.outcome === 'victory' ? <Trophy className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {hud.outcome === 'victory' ? 'BẢO VỆ LÕI THÀNH CÔNG' : 'LÕI PHÁO ĐÀI THẤT THỦ'} ·{' '}
                {DIFFICULTY_CONFIGS[hud.difficulty].shortLabel}
              </span>
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {hud.outcome === 'victory'
                ? `Chiến Thắng ${activeMap.name}!`
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
              onClick={() => startNewRun(selectedMapIndex, difficulty, gameMode)}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>
            <button
              type="button"
              onClick={() => setGameState('title')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-700 bg-[#0F172A] text-sm font-medium text-slate-200 hover:border-amber-400 cursor-pointer"
            >
              Chọn Màn Khác
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
