import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  FastForward,
  Flame,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import {
  applyDamageToEnemy,
  BIOME_PALETTES,
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CarrierDrone,
  ChronoField,
  ChronoSlashFx,
  clampEnemyToTrackCorridor,
  computeChronoFieldRecord,
  computeElectricWetSynergy,
  computeOverdriveChargeGain,
  computeSingularitySwallowGrowth,
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
  getChronosMaxFields,
  getEffectiveMapSetup,
  getGunCatalogItem,
  getGunCombatProfile,
  getGunSellRefund,
  getGunUpgradeCost,
  getMothershipMaxDrones,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  GUN_CATALOG,
  GunType,
  GunVariant,
  interruptEnemyWindup,
  isElectricGunType,
  isSupportGunType,
  isWetZoneTile,
  LightningArc,
  MAX_GUN_LEVEL,
  OrbitalBeamFx,
  OrbitalRadiationZone,
  OVERDRIVE_CONFIG,
  PlacedGun,
  PRISM_MAPS,
  ProjectileItem,
  pullEnemyAlongTrack,
  RailBeamFx,
  ShockwaveRing,
  shouldDroneEvadeBossPulse,
  SingularityHole,
  stepEnemies,
  TargetPriority,
  TdEnemy,
  TdMapDef,
  TILE_SIZE,
  WaveSpawnItem,
} from '../utils/prismTdEngine.ts';
import {
  computeCombatVisualDamping,
  filterArsenalGuns,
  GunArsenalFilter,
} from '../utils/prismTdMobileHelpers.ts';
import {
  drawCarrierDrones,
  drawChronoFieldsAndSlashes,
  drawEnemySprite,
  drawGroundCraters,
  drawGunTurretSprite,
  drawLightningArcEnhanced,
  drawOrbitalBeamsAndZones,
  drawOverheatSpecialFx,
  drawProjectileEnhanced,
  drawRailBeamEnhanced,
  drawShellCasings,
  drawSingularityHoles,
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
import { PwaInstallButton } from './PwaInstallControls.tsx';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface PrismTdGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
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

export function PrismTdGameSection({
  theme,
  isFullscreen = false,
  onToggleFullscreen,
  onExitFullscreen,
}: PrismTdGameSectionProps) {
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
  const effectiveSetup = useMemo(
    () => getEffectiveMapSetup(activeMap, difficulty, gameMode),
    [activeMap, difficulty, gameMode]
  );

  const [selectedTool, setSelectedTool] = useState<GunType>('gatling');
  const [selectedVariant, setSelectedVariant] = useState<GunVariant>('alpha');
  const [selectedGunId, setSelectedGunId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<string>('');
  const [arsenalFilter, setArsenalFilter] = useState<GunArsenalFilter>('all');
  const [sidebarTab, setSidebarTab] = useState<'arsenal' | 'inspector'>('arsenal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [portraitHintDismissed, setPortraitHintDismissed] = useState<boolean>(false);
  const [isCompactTheater, setIsCompactTheater] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(orientation: landscape) and (max-height: 540px)').matches;
  });
  const [isPortraitMobile, setIsPortraitMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(orientation: portrait) and (max-width: 640px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mqLs = window.matchMedia('(orientation: landscape) and (max-height: 540px)');
    const mqPt = window.matchMedia('(orientation: portrait) and (max-width: 640px)');
    const sync = () => {
      setIsCompactTheater(mqLs.matches);
      setIsPortraitMobile(mqPt.matches);
    };
    sync();
    mqLs.addEventListener('change', sync);
    mqPt.addEventListener('change', sync);
    return () => {
      mqLs.removeEventListener('change', sync);
      mqPt.removeEventListener('change', sync);
    };
  }, []);

  const isCompactViewportRef = useRef<boolean>(false);
  useEffect(() => {
    isCompactViewportRef.current = isCompactTheater || isPortraitMobile;
  }, [isCompactTheater, isPortraitMobile]);

  const filteredArsenalGuns = useMemo(
    () => filterArsenalGuns(availableGuns, arsenalFilter),
    [availableGuns, arsenalFilter]
  );

  const useSidebarTheater = isFullscreen || isCompactTheater;
  const sidebarScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedGunId) {
      setSidebarTab('inspector');
      if (isCompactTheater) {
        setSidebarCollapsed(false);
      }
      if (useSidebarTheater && sidebarScrollRef.current) {
        sidebarScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setSidebarTab('arsenal');
    }
  }, [selectedGunId, useSidebarTheater, isCompactTheater]);

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
      overdrivePct: OVERDRIVE_CONFIG.initialCharge,
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
    healBeams: { fromX: number; fromY: number; toX: number; toY: number; alpha: number }[];
    muzzleFlashes: MuzzleFlashFx[];
    impactFlashes: ImpactFlashFx[];
    frostShards: FrostShardFx[];
    harmonicRays: HarmonicRayFx[];
    shellCasings: ShellCasingFx[];
    groundCraters: GroundCraterFx[];
    overheatEffects: OverheatFx[];
    orbitalBeams: OrbitalBeamFx[];
    orbitalZones: OrbitalRadiationZone[];
    blackHoles: SingularityHole[];
    carrierDrones: CarrierDrone[];
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
    healBeams: [],
    muzzleFlashes: [],
    impactFlashes: [],
    frostShards: [],
    harmonicRays: [],
    shellCasings: [],
    groundCraters: [],
    overheatEffects: [],
    orbitalBeams: [],
    orbitalZones: [],
    blackHoles: [],
    carrierDrones: [],
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
    const overdriveMult = s.overdriveTimer > 0 ? OVERDRIVE_CONFIG.hudDpsMult : 1;
    let total = 0;
    for (const g of s.guns) {
      if (isSupportGunType(g.type)) continue;
      const buff = computeTeamSupportBuffAtTile(s.guns, g.col, g.row);
      const critAvgMult =
        buff.critChance > 0 ? 1 - buff.critChance + buff.critChance * buff.critMult : 1;
      total +=
        getGunCombatProfile(g.type, g.level, g.variant ?? 'alpha').dpsEstimate *
        buff.damageMult *
        critAvgMult *
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
      const damp = computeCombatVisualDamping({
        activeBeams: s.railBeams.length + s.lightningArcs.length,
        activeProjectiles: s.projectiles.length,
        activeFlashes: s.muzzleFlashes.length + s.impactFlashes.length,
        speedMult: s.speedMult,
        isCompactViewport: isCompactViewportRef.current,
      });
      const scaledCount = Math.max(
        count >= 4 ? 1 : 0,
        Math.round(count * damp.particleSpawnScale)
      );
      for (let i = 0; i < scaledCount; i++) {
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
      const damp = computeCombatVisualDamping({
        activeBeams: s.railBeams.length + s.lightningArcs.length,
        activeProjectiles: s.projectiles.length,
        activeFlashes: s.muzzleFlashes.length + s.impactFlashes.length,
        speedMult: s.speedMult,
        isCompactViewport: isCompactViewportRef.current,
      });
      const isMinorPopup = scale <= 1.02 && (text.startsWith('+') || text.startsWith('-'));
      if (!damp.allowMinorPopups && isMinorPopup) {
        return;
      }
      while (s.floatingTexts.length >= damp.maxFloatingTexts) {
        s.floatingTexts.shift();
      }
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
      s.healBeams = [];
      s.muzzleFlashes = [];
      s.impactFlashes = [];
      s.frostShards = [];
      s.harmonicRays = [];
      s.shellCasings = [];
      s.groundCraters = [];
      s.overheatEffects = [];
      s.orbitalBeams = [];
      s.orbitalZones = [];
      s.blackHoles = [];
      s.carrierDrones = [];
      s.chronoFields = [];
      s.chronoSlashes = [];
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
      s.overdriveCharge = OVERDRIVE_CONFIG.initialCharge;
      s.overdriveTimer = 0;
      s.overdriveSecondWaveFired = false;
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
      if (!mapGuns.some((g) => g.type === s.selectedTool)) {
        const fallback: GunType = 'gatling';
        s.selectedTool = fallback;
        setSelectedTool(fallback);
      }
      setStatusNotice(
        `${modeCfg.label} · ${diffCfg.label} (${mode === 'endless' ? '∞' : effective.totalWaves} Đợt) · ${mapGuns.length} Súng Chuyên Biệt!`
      );
      recomputeFirepower();
      syncHudFromSim();
      setGameState('playing');
      unlockPrismAudio(audioCtxRef);
      playSynthFx('wave', soundEnabled, audioCtxRef);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      requestAnimationFrame(() => {
        const el = document.getElementById('prism-td-section');
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 64 || rect.top > window.innerHeight * 0.6) {
            window.scrollTo({ top: Math.max(0, rect.top + window.scrollY - 72), behavior: 'auto' });
          }
        }
      });
    },
    [selectedMapIndex, difficulty, gameMode, recomputeFirepower, syncHudFromSim, soundEnabled]
  );

  useEffect(() => {
    if (!availableGuns.some((g) => g.type === selectedTool)) {
      const nextTool: GunType = 'gatling';
      setSelectedTool(nextTool);
      simRef.current.selectedTool = nextTool;
    }
  }, [availableGuns, selectedTool]);

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
    s.overdriveTimer = OVERDRIVE_CONFIG.durationSec;
    s.overdriveSecondWaveFired = false;
    if (s.speedMult < 2) {
      s.shakeTrauma = 0.85;
    }

    const coreTile = s.map.path[s.map.path.length - 1];
    const corePt = gridToWorldCenter(coreTile.col, coreTile.row);
    s.overheatEffects.push({
      kind: 'overdrive_apex',
      x: corePt.x,
      y: corePt.y,
      radius: 340,
      angle: 0,
      life: 1.0,
      maxLife: 1.0,
      color: '#FDE047',
    });
    s.shockwaves.push({
      x: corePt.x,
      y: corePt.y,
      radius: 20,
      maxRadius: 420,
      alpha: 1,
      color: '#FDE047',
      lineWidth: 4,
    });

    for (const g of s.guns) {
      g.heat = 100; // Immediately unleashes Wave 1 of every gun's unique Overheat skill!
      const pt = gridToWorldCenter(g.col, g.row);
      s.overheatEffects.push({
        kind: 'overdrive_apex',
        x: pt.x,
        y: pt.y,
        radius: 130,
        angle: g.aimAngle,
        life: 0.78,
        maxLife: 0.78,
        color: '#FB7185',
      });
      s.shockwaves.push({
        x: pt.x,
        y: pt.y,
        radius: 12,
        maxRadius: 125,
        alpha: 0.95,
        color: '#FB7185',
        lineWidth: 3.5,
      });
      emitParticles(pt.x, pt.y, '#FDE047', 16, 175, 1.3);
    }

    const liveTargets = s.enemies
      .filter((en) => en.hp > 0 && en.koTimer <= 0)
      .sort((a, b) => b.hp + b.shield - (a.hp + a.shield));

    for (const tEn of liveTargets.slice(0, 6)) {
      s.railBeams.push({
        x1: corePt.x,
        y1: corePt.y,
        x2: tEn.x,
        y2: tEn.y,
        alpha: 1.25,
        color: '#FDE047',
        visualTier: 4,
        variant: 'supernova',
      });
      s.impactFlashes.push({
        x: tEn.x,
        y: tEn.y,
        radius: 44,
        alpha: 1,
        color: '#FDE047',
        spikes: 8,
        rot: s.animTime,
      });
    }

    const judgmentDmg =
      OVERDRIVE_CONFIG.globalJudgmentBase + s.wave * OVERDRIVE_CONFIG.globalJudgmentPerWave;
    for (const en of liveTargets) {
      interruptEnemyWindup(en);
      if (en.kind !== 'boss' && en.kind !== 'super_boss' && en.kind !== 'juggernaut') {
        en.stunTimer = Math.max(en.stunTimer, 1.8);
      }
      en.slowTimer = Math.max(en.slowTimer, 3.5);
      en.slowFactor = Math.min(en.slowFactor || 1, 0.48);
      en.armorShred = Math.max(en.armorShred, 0.28);

      const res = applyDamageToEnemy(en, judgmentDmg, {
        armorPierce: 1,
        shieldMult: 2.0,
      });
      s.totalDamage += res.actualDamage;
      if (res.killed) {
        s.kills += 1;
        s.energy += en.reward;
        s.score += en.scoreValue;
        emitParticles(en.x, en.y, '#FBBF24', 20, 170, 1.25);
      }
    }
    pushCombatText(corePt.x, corePt.y - 34, '⚡ HỘI TỤ HỎA LỰC ×2.71!', '#FDE047', 1.25);
    s.selectedGunVersion += 1;
    recomputeFirepower();
    syncHudFromSim();
    setStatusNotice(
      '⚡ HỘI TỤ HỎA LỰC ×2.71 BÙNG NỔ! Thiên Phạt toàn bản đồ + 2 Đợt Quá Nhiệt toàn đội hình!'
    );
    playSynthFx('overdrive', soundEnabled, audioCtxRef);
  }, [gameState, recomputeFirepower, syncHudFromSim, soundEnabled, emitParticles, pushCombatText]);

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
    s.carrierDrones = s.carrierDrones.filter((d) => d.sourceGunId !== target.id);
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
        selectedTool === 'railgun' ||
        selectedTool === 'missile' ||
        selectedTool === 'mortar' ||
        selectedTool === 'orbital'
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
          ctx.moveTo(30, 86);
          ctx.lineTo(350, 86);
          ctx.lineTo(350, 212);
          ctx.stroke();

          // Mock Showcase Enemies moving smoothly along lane (Super Boss + Shieldbearer)
          const bossX = 210 + Math.sin(t * 0.9) * 75;
          const bossEnemy: TdEnemy = {
            id: 901,
            kind: 'super_boss',
            x: bossX,
            y: 86,
            heading: 0,
            waypointIndex: 1,
            hp: 1820,
            maxHp: 2200,
            shield: 420,
            maxShield: 650,
            speed: 36,
            radius: 28,
            reward: 120,
            scoreValue: 500,
            armorRatio: 0.45,
            slowTimer: 0.8,
            slowFactor: 0.7,
            brittleBonus: 0.25,
            wetTimer: 1.5,
            shockTimer: 0.4,
            markedTimer: 1.2,
            markedBonus: 0.3,
            burnTimer: 0.5,
            burnDps: 0,
            armorShred: 0,
            stunTimer: 0,
            abilityCooldown: 2,
            windupKind: 'shield_surge',
            windupTimer: (t * 0.45) % 1.4,
            windupMax: 1.4,
            fortifyTimer: 0,
            hitFlash: Math.sin(t * 14) > 0.85 ? 0.1 : 0,
            koTimer: 0,
            isElite: true,
          };
          const escortTank: TdEnemy = {
            ...bossEnemy,
            id: 902,
            kind: 'shieldbearer',
            x: 350,
            y: 156 + Math.cos(t * 1.4) * 28,
            heading: Math.PI / 2,
            radius: 18,
            burnTimer: 0,
            slowTimer: 1,
            brittleBonus: 0.3,
            windupKind: null,
            windupTimer: 0,
            isElite: false,
          };

          drawEnemySprite(ctx, bossEnemy, t);
          drawEnemySprite(ctx, escortTank, t);

          // Showcase Lv10 Mythic Turrets: Vulcan + Railgun + Tesla Chain Lightning on Wet Boss
          const vulcanAngle = Math.atan2(bossEnemy.y - 186, bossEnemy.x - 88);
          const railAngle = Math.atan2(bossEnemy.y - 186, bossEnemy.x - 185);
          const teslaPt = { x: 268, y: 186 };

          const pulseA = Math.max(0.25, Math.sin(t * 4) * 0.5 + 0.5);
          drawRailBeamEnhanced(
            ctx,
            {
              x1: 185,
              y1: 186,
              x2: bossEnemy.x,
              y2: bossEnemy.y,
              alpha: pulseA,
              color: '#C084FC',
              visualTier: 4,
              variant: 'railgun',
            },
            t
          );

          drawLightningArcEnhanced(
            ctx,
            {
              points: [
                { x: teslaPt.x, y: teslaPt.y },
                { x: (teslaPt.x + bossEnemy.x) * 0.5 + Math.sin(t * 18) * 10, y: (teslaPt.y + bossEnemy.y) * 0.5 - 8 },
                { x: bossEnemy.x, y: bossEnemy.y },
                { x: escortTank.x, y: escortTank.y },
              ],
              alpha: 0.9,
              color: '#38BDF8',
              width: 3.4,
              isWetOverdrive: true,
              branches: [
                {
                  x1: bossEnemy.x,
                  y1: bossEnemy.y,
                  x2: bossEnemy.x + Math.cos(t * 8) * 24,
                  y2: bossEnemy.y + Math.sin(t * 8) * 24,
                },
              ],
            },
            t
          );

          for (let b = 0; b < 3; b++) {
            const frac = (t * 2.4 + b * 0.33) % 1;
            const bx = 88 + (bossEnemy.x - 88) * frac;
            const by = 186 + (bossEnemy.y - 186) * frac;
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.save();
          ctx.translate(88, 186);
          drawGunTurretSprite(ctx, 'gatling', 10, vulcanAngle, 0.25, t, 'alpha', 72, false);
          ctx.restore();

          ctx.save();
          ctx.translate(185, 186);
          drawGunTurretSprite(ctx, 'railgun', 10, railAngle, 0.3, t, 'omega', 100, true);
          ctx.restore();

          ctx.save();
          ctx.translate(teslaPt.x, teslaPt.y);
          drawGunTurretSprite(
            ctx,
            'tesla',
            10,
            Math.atan2(bossEnemy.y - teslaPt.y, bossEnemy.x - teslaPt.x),
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
    let cachedStaticBg: HTMLCanvasElement | null = null;
    let cachedStaticKey = '';

    const recordKill = (en: TdEnemy, killerGunId?: string) => {
      const s = simRef.current;
      s.kills += 1;
      s.energy += en.reward;
      s.score += en.scoreValue;
      if (killerGunId) {
        const gun = s.guns.find((g) => g.id === killerGunId);
        if (gun) gun.kills += 1;
      }

      const isBossTier = en.kind === 'boss' || en.kind === 'super_boss';
      const blastColor =
        en.kind === 'super_boss'
          ? '#FDE047'
          : en.kind === 'boss'
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
        en.kind === 'super_boss' ? 56 : en.kind === 'boss' ? 42 : 16,
        en.kind === 'super_boss' ? 230 : en.kind === 'boss' ? 200 : 135,
        en.kind === 'super_boss' ? 1.7 : en.kind === 'boss' ? 1.5 : 1.05
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
            windupKind: null,
            windupTimer: 0,
            isElite: false,
          };
          clampEnemyToTrackCorridor(child, s.map);
          s.enemies.push(child);
        }
        emitParticles(en.x, en.y, '#E879F9', 14, 110, 0.9);
      }

      // Supernova Brand Chain Detonation (Stellar Echo): branded kills erupt in a golden cascade!
      if (en.supernovaBrandDmg && en.supernovaBrandDmg > 0) {
        const echoBase = en.supernovaBrandDmg;
        en.supernovaBrandDmg = 0; // guard: zero BEFORE loop so each enemy detonates at most once
        const brandGun = killerGunId ? s.guns.find((g) => g.id === killerGunId) : undefined;
        const echoRadius = brandGun && brandGun.level >= 10 ? 140 : 115;
        s.impactFlashes.push({
          x: en.x,
          y: en.y,
          radius: echoRadius * 0.62,
          alpha: 0.96,
          color: '#FDE047',
          spikes: 8,
          rot: s.animTime * 2,
        });
        s.shockwaves.push({
          x: en.x,
          y: en.y,
          radius: 14,
          maxRadius: echoRadius,
          alpha: 0.85,
          color: '#FDE047',
          lineWidth: 2.2,
        });
        emitParticles(en.x, en.y, '#FDE047', 16, 175, 1.25);
        for (const other of s.enemies) {
          if (other.id === en.id || other.hp <= 0 || other.koTimer > 0) continue;
          const dist = Math.hypot(other.x - en.x, other.y - en.y);
          if (dist <= echoRadius + other.radius) {
            const pctHpBonus = Math.min(Math.round(echoBase * 0.95), Math.round(other.maxHp * 0.1));
            const cascadeDmg = Math.round(echoBase + pctHpBonus);
            if (!other.supernovaBrandDmg) {
              other.markedTimer = Math.max(other.markedTimer, 3.2);
              other.markedBonus = Math.max(other.markedBonus, 0.25);
              other.supernovaBrandDmg = Math.round(echoBase * 0.72);
            }
            const cRes = applyDamageToEnemy(other, cascadeDmg, {
              armorPierce: 0.95,
              shieldMult: 1.85,
            });
            s.totalDamage += cRes.actualDamage;
            if (brandGun) brandGun.totalDamageDealt += cRes.actualDamage;
            if (cRes.killed) {
              recordKill(other, killerGunId);
            }
          }
        }
      }

      pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', isBossTier ? 1.3 : 1);
      if (isBossTier) {
        if (s.speedMult < 2) {
          s.shakeTrauma = Math.min(1, s.shakeTrauma + (en.kind === 'super_boss' ? 0.85 : 0.65));
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
          if (
            !s.overdriveSecondWaveFired &&
            s.overdriveTimer > 0 &&
            s.overdriveTimer <= OVERDRIVE_CONFIG.secondWaveTriggerSec
          ) {
            s.overdriveSecondWaveFired = true;
            for (const g of s.guns) {
              g.heat = 100;
              const pt = gridToWorldCenter(g.col, g.row);
              s.overheatEffects.push({
                kind: 'overdrive_apex',
                x: pt.x,
                y: pt.y,
                radius: 115,
                angle: s.animTime,
                life: 0.68,
                maxLife: 0.68,
                color: '#38BDF8',
              });
            }
            pushCombatText(
              CANVAS_WIDTH / 2,
              64,
              '⚡ HỎA LỰC ĐỢT 2 — QUÁ NHIỆT KÉP!',
              '#FDE047',
              1.2
            );
            playSynthFx('overdrive', soundEnabled, audioCtxRef);
          }
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

        // 2. Pure Gun Turrets Combat Simulation (Lv1 -> Lv10, α/ω Variants, 17 Unique Overheat Ultimates)
        const liveEnemies = s.enemies.filter((e) => e.hp > 0 && e.koTimer <= 0);
        const overdriveSpeedMult = s.overdriveTimer > 0 ? OVERDRIVE_CONFIG.speedMult : 1;
        const overdriveDmgMult = s.overdriveTimer > 0 ? OVERDRIVE_CONFIG.damageMult : 1;

        const recordChronoEchoAt = (ex: number, ey: number, dmg: number, echoScale = 1) => {
          if (dmg <= 0 || echoScale <= 0 || s.chronoFields.length === 0) return;
          for (const cf of s.chronoFields) {
            if (Math.hypot(ex - cf.x, ey - cf.y) <= cf.radius + 20) {
              cf.recordedDamage = computeChronoFieldRecord(
                cf.recordedDamage,
                dmg,
                cf.echoRatio * echoScale,
                32000 + cf.level * 9000
              );
            }
          }
        };

        const recordDamageTelemetry = (
          en: TdEnemy,
          actualDamage: number,
          gunId: string | undefined,
          chargeBaseRate = 0.045,
          echoScale = 1
        ) => {
          if (actualDamage <= 0) return;
          s.totalDamage += actualDamage;
          if (gunId) {
            const src = s.guns.find((g) => g.id === gunId);
            if (src) src.totalDamageDealt += actualDamage;
          }
          if (s.overdriveTimer <= 0 && chargeBaseRate > 0) {
            s.overdriveCharge = Math.min(
              100,
              s.overdriveCharge + computeOverdriveChargeGain(actualDamage, chargeBaseRate)
            );
          }
          if (s.chronoFields.length > 0 && echoScale > 0) {
            recordChronoEchoAt(en.x, en.y, actualDamage, echoScale);
          }
        };

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
                en.slowTimer = Math.max(en.slowTimer, 3.6);
                en.slowFactor = Math.min(en.slowFactor || 1, 0.56);
                en.brittleBonus = Math.max(en.brittleBonus, Math.min(0.42, profile.brittleBonus + 0.14));
                en.wetTimer = Math.max(en.wetTimer, 4.0);
                emitParticles(en.x, en.y, '#67E8F9', 5, 70, 0.85);
              }
            }
            pushCombatText(origin.x, origin.y - 26, 'BÃO TUYẾT · ẨM ƯỚT!', '#67E8F9', 1.0);
          } else if (gun.type === 'tesla') {
            const webRange = profile.rangePx * 1.38;
            const picked = liveEnemies
              .filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= webRange)
              .slice(0, 7);
            let wetStrikeCount = 0;
            for (const en of picked) {
              const syn = computeElectricWetSynergy(en, gun.level);
              if (syn.isWetSynergy) wetStrikeCount++;
              const midX = (origin.x + en.x) * 0.5 + (Math.random() * 26 - 13);
              const midY = (origin.y + en.y) * 0.5 + (Math.random() * 26 - 13);
              s.lightningArcs.push({
                points: [{ x: origin.x, y: origin.y }, { x: midX, y: midY }, { x: en.x, y: en.y }],
                alpha: 1,
                color: syn.isWetSynergy ? '#22D3EE' : '#FDE047',
                width: syn.isWetSynergy ? 4.8 : 4.0,
                isWetOverdrive: syn.isWetSynergy,
                branches: [
                  {
                    x1: midX,
                    y1: midY,
                    x2: midX + (Math.random() * 34 - 17),
                    y2: midY + (Math.random() * 34 - 17),
                  },
                ],
              });
              en.stunTimer = Math.max(en.stunTimer, syn.isWetSynergy ? 0.55 : 0.3);
              en.shockTimer = Math.max(en.shockTimer, Math.max(0.8, syn.shockSec));
              en.slowTimer = Math.max(en.slowTimer, 2.1);
              en.slowFactor = Math.min(en.slowFactor || 1, 0.65);
              if (interruptEnemyWindup(en)) {
                pushCombatText(en.x, en.y - 16, '⚡ NGẮT CHIÊU!', '#38BDF8', 1.08);
                playSynthFx('interrupt', soundEnabled, audioCtxRef);
              }
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.38 * syn.damageMult), {
                armorPierce: 0.72,
                shieldMult: profile.shieldMult * 1.5 + syn.shieldMultBonus,
              });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (res.killed) recordKill(en, gun.id);
            }
            s.overheatEffects.push({
              kind: 'emp_ring',
              x: origin.x,
              y: origin.y,
              radius: webRange * 0.7,
              angle: 0,
              life: 0.72,
              maxLife: 0.72,
              color: wetStrikeCount > 0 ? '#22D3EE' : '#FDE047',
            });
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
                trail: [],
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
                  const res = applyDamageToEnemy(en, Math.round(shotDmg * 0.85), { armorPierce: 1, shieldMult: 2.0 });
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
                if (en.kind !== 'boss' && en.kind !== 'super_boss') {
                  pullEnemyAlongTrack(en, s.map, cx, cy, 24);
                }
                const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.45), { armorPierce: 0.75, shieldMult: 1.4 });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
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
                trail: [],
              });
            }
          } else if (gun.type === 'tempest') {
            const tx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 120;
            const ty = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 120;
            s.overheatEffects.push({ kind: 'emp_ring', x: tx, y: ty, radius: 96, angle: 0, life: 0.9, maxLife: 0.9, color: '#818CF8' });
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
                isElectricStorm: true,
                trail: [],
              });
            }
          } else if (gun.type === 'beacon') {
            s.overheatEffects.push({ kind: 'solar_flare', x: origin.x, y: origin.y, radius: profile.rangePx * 1.1, angle: 0, life: 0.78, maxLife: 0.78, color: '#FDE047' });
            s.energy += 12;
            pushCombatText(origin.x, origin.y - 28, '+12⚡ · CHÍ MẠNG +35%!', '#FDE047', 1.04);
            emitParticles(origin.x, origin.y, '#FDE047', 16, 130, 1.1);
          } else if (gun.type === 'radar') {
            const scanR = profile.rangePx * 1.35;
            s.overheatEffects.push({ kind: 'radar_sweep', x: origin.x, y: origin.y, radius: scanR, angle: gun.aimAngle, life: 0.85, maxLife: 0.85, color: '#22D3EE' });
            const targets = liveEnemies
              .filter((e) => Math.hypot(e.x - origin.x, e.y - origin.y) <= scanR)
              .sort((a, b) => b.hp + b.shield - (a.hp + a.shield));
            targets.slice(0, 4).forEach((tEn) => {
              s.overheatEffects.push({ kind: 'target_lock', x: tEn.x, y: tEn.y, radius: tEn.radius + 14, angle: 0, life: 0.9, maxLife: 0.9, color: '#22D3EE' });
            });
            let interruptedAny = false;
            for (const en of targets) {
              en.markedTimer = Math.max(en.markedTimer, 4.5);
              en.markedBonus = Math.max(en.markedBonus, 0.42);
              en.armorShred = Math.max(en.armorShred, 0.35);
              if (interruptEnemyWindup(en)) {
                interruptedAny = true;
                pushCombatText(en.x, en.y - 16, '⚡ RADAR TẮT CHIÊU!', '#22D3EE', 1.1);
              }
            }
            if (interruptedAny) {
              playSynthFx('interrupt', soundEnabled, audioCtxRef);
            }
            pushCombatText(origin.x, origin.y - 28, `RADAR KHÓA ${targets.length} MỤC TIÊU!`, '#22D3EE', 1.04);
          } else if (gun.type === 'orbital') {
            const topTargets = [...liveEnemies]
              .sort((a, b) => b.hp + b.shield - (a.hp + a.shield))
              .slice(0, 3);
            const fallbackPts =
              topTargets.length > 0
                ? topTargets.map((tEn) => ({ x: tEn.x, y: tEn.y }))
                : [
                    target
                      ? { x: target.x, y: target.y }
                      : gridToWorldCenter(s.map.path[Math.floor(s.map.path.length / 2)].col, s.map.path[Math.floor(s.map.path.length / 2)].row),
                  ];
            for (const ptStrike of fallbackPts) {
              const strikeR = Math.max(62, profile.splashRadius * 1.18);
              s.orbitalBeams.push({
                x: ptStrike.x,
                y: ptStrike.y,
                alpha: 1.25,
                radius: strikeR,
                color: '#FDE047',
                visualTier: 4,
              });
              s.impactFlashes.push({
                x: ptStrike.x,
                y: ptStrike.y,
                radius: strikeR * 0.72,
                alpha: 1,
                color: '#F97316',
                spikes: 8,
                rot: s.animTime,
              });
              spawnCrater(ptStrike.x, ptStrike.y, Math.min(54, strikeR * 0.8), 'plasma');
              emitParticles(ptStrike.x, ptStrike.y, '#FDBA74', 20, 175, 1.3);
              if (s.orbitalZones.length >= 16) s.orbitalZones.shift();
              s.orbitalZones.push({
                id: s.nextProjId++,
                sourceGunId: gun.id,
                x: ptStrike.x,
                y: ptStrike.y,
                radius: strikeR,
                dps: Math.max(48, Math.round(profile.burnDps * 1.65)),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                armorShred: 0.35,
                slowPct: 0.24,
                life: 5.0,
                maxLife: 5.0,
              });
              for (const en of liveEnemies) {
                const dist = Math.hypot(en.x - ptStrike.x, en.y - ptStrike.y);
                if (dist <= strikeR + en.radius) {
                  const bossBonus = gun.level >= 7 && (en.kind === 'boss' || en.kind === 'super_boss') ? 1.4 : 1;
                  const hpShredBonus = Math.min(
                    Math.round(shotDmg * 1.35),
                    Math.round(en.maxHp * (dist < 30 ? 0.06 : 0.03))
                  );
                  const strikeDmg = Math.round(shotDmg * (dist < 28 ? 1.45 : 0.82) * bossBonus) + hpShredBonus;
                  en.armorShred = Math.max(en.armorShred, 0.32);
                  en.burnTimer = Math.max(en.burnTimer, 3.2);
                  en.burnDps = Math.max(en.burnDps, profile.burnDps);
                  const res = applyDamageToEnemy(en, strikeDmg, {
                    armorPierce: Math.min(1, profile.armorPierce + 0.12),
                    shieldMult: profile.shieldMult * 1.25,
                  });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
          } else if (gun.type === 'singularity') {
            const holePos = target
              ? { x: target.x, y: target.y }
              : gridToWorldCenter(s.map.path[Math.floor(s.map.path.length / 2)].col, s.map.path[Math.floor(s.map.path.length / 2)].row);
            const superRadius = Math.round(profile.splashRadius * 1.28);
            if (s.blackHoles.length >= 10) s.blackHoles.shift();
            s.blackHoles.push({
              id: s.nextProjId++,
              sourceGunId: gun.id,
              x: holePos.x,
              y: holePos.y,
              baseRadius: superRadius,
              currentRadius: superRadius,
              pullStrength: profile.pullForce * 1.45,
              trueDps: Math.round(Math.max(shotDmg, profile.damage) * 1.6),
              accumulatedDamage: Math.round(Math.max(shotDmg, profile.damage) * 3.0),
              killsAbsorbed: 0,
              life: 5.5,
              maxLife: 5.5,
              maxScale: 1.9,
              level: gun.level,
              variant: gun.variant ?? 'alpha',
              isCrit: true,
            });
            s.overheatEffects.push({
              kind: 'vortex',
              x: holePos.x,
              y: holePos.y,
              radius: superRadius,
              angle: 0,
              life: 1.0,
              maxLife: 1.0,
              color: '#C084FC',
            });
            emitParticles(holePos.x, holePos.y, '#C084FC', 22, 165, 1.3);
          } else if (gun.type === 'mothership') {
            const teamBuffOh = computeTeamSupportBuffAtTile(s.guns, gun.col, gun.row);
            const droneDmg = Math.round(profile.damage * overdriveDmgMult * teamBuffOh.damageMult * 1.65);
            for (const d of s.carrierDrones) {
              if (d.sourceGunId === gun.id) {
                d.life = d.maxLife;
                d.fireCooldown = 0;
                d.damage = Math.max(d.damage, droneDmg);
              }
            }
            for (let bIdx = 0; bIdx < 2; bIdx++) {
              const launchA = gun.aimAngle + (bIdx === 0 ? -0.55 : 0.55);
              s.carrierDrones.push({
                id: s.nextProjId++,
                sourceGunId: gun.id,
                x: origin.x + Math.cos(launchA) * 16,
                y: origin.y + Math.sin(launchA) * 16,
                vx: Math.cos(launchA) * 290,
                vy: Math.sin(launchA) * 290,
                heading: launchA,
                fireCooldown: 0.08,
                shotCount: 2,
                life: 14,
                maxLife: 14,
                damage: droneDmg,
                armorPierce: Math.min(1, profile.armorPierce + 0.16),
                shieldMult: profile.shieldMult * 1.25,
                bossMult: gun.level >= 7 ? 1.45 : 1.25,
                speed: 295 + gun.level * 10,
                variant: gun.variant ?? 'alpha',
                visualTier: 4,
                evadeTimer: 0,
                trail: [],
              });
            }
            s.overheatEffects.push({
              kind: 'solar_flare',
              x: origin.x,
              y: origin.y,
              radius: 72,
              angle: 0,
              life: 0.72,
              maxLife: 0.72,
              color: '#38BDF8',
            });
          } else if (gun.type === 'supernova') {
            const cx = target?.x ?? origin.x + Math.cos(gun.aimAngle) * 140;
            const cy = target?.y ?? origin.y + Math.sin(gun.aimAngle) * 140;
            const novaRadius = 260;
            s.overheatEffects.push({
              kind: 'supernova_nova',
              x: cx,
              y: cy,
              radius: novaRadius,
              angle: 0,
              life: 1.0,
              maxLife: 1.0,
              color: '#FDE047',
            });
            spawnCrater(cx, cy, 62, 'plasma');
            emitParticles(cx, cy, '#FEF08A', 28, 220, 1.45);
            for (let rb = -1; rb <= 1; rb++) {
              const ba = gun.aimAngle + rb * 0.22;
              s.railBeams.push({
                x1: origin.x + Math.cos(ba) * 24,
                y1: origin.y + Math.sin(ba) * 24,
                x2: origin.x + Math.cos(ba) * 760,
                y2: origin.y + Math.sin(ba) * 760,
                alpha: 1.25,
                color: '#FDE047',
                visualTier: 4,
                variant: 'supernova',
              });
            }
            for (const en of liveEnemies) {
              const dist = Math.hypot(en.x - cx, en.y - cy);
              if (dist <= novaRadius + en.radius) {
                en.markedTimer = Math.max(en.markedTimer, 5.0);
                en.markedBonus = Math.max(en.markedBonus, 0.45);
                en.supernovaBrandDmg = Math.max(en.supernovaBrandDmg ?? 0, Math.round(shotDmg * 0.75));
                en.slowTimer = Math.max(en.slowTimer, 2.2);
                en.slowFactor = Math.min(en.slowFactor || 1, 0.62);
                if (interruptEnemyWindup(en)) {
                  pushCombatText(en.x, en.y - 18, '✦ KHỞI NGUYÊN NGẮT CHIÊU!', '#FDE047', 1.15);
                  playSynthFx('interrupt', soundEnabled, audioCtxRef);
                }
                const burstDmg = Math.round(shotDmg * (dist < 90 ? 1.5 : 1.05));
                const res = applyDamageToEnemy(en, burstDmg, {
                  armorPierce: 1,
                  shieldMult: 2.2,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            pushCombatText(cx, cy - 28, '✦ ĐẠI VỤ NỔ KHỞI NGUYÊN!', '#FEF08A', 1.18);
          } else if (gun.type === 'chronos') {
            const centerPt = target
              ? { x: target.x, y: target.y }
              : gridToWorldCenter(
                  s.map.path[Math.floor(s.map.path.length / 2)].col,
                  s.map.path[Math.floor(s.map.path.length / 2)].row
                );
            s.overheatEffects.push({
              kind: 'chrono_collapse',
              x: centerPt.x,
              y: centerPt.y,
              radius: 280,
              angle: 0,
              life: 1.05,
              maxLife: 1.05,
              color: '#67E8F9',
            });
            emitParticles(centerPt.x, centerPt.y, '#67E8F9', 26, 200, 1.35);

            const sortedAll = [...liveEnemies].sort(
              (a, b) => b.hp + b.shield - (a.hp + a.shield)
            );
            for (const slEn of sortedAll.slice(0, 8)) {
              s.chronoSlashes.push({
                x: slEn.x,
                y: slEn.y,
                angle: Math.atan2(slEn.y - origin.y, slEn.x - origin.x),
                length: 62,
                alpha: 1,
                color: '#67E8F9',
                isCrit: true,
              });
            }

            const maxFields = Math.max(2, getChronosMaxFields(gun.level, gun.variant ?? 'alpha'));
            const fieldSeeds =
              sortedAll.length >= 2
                ? [sortedAll[0], sortedAll[1]]
                : [
                    centerPt,
                    gridToWorldCenter(
                      s.map.path[Math.max(1, Math.floor(s.map.path.length * 0.68))].col,
                      s.map.path[Math.max(1, Math.floor(s.map.path.length * 0.68))].row
                    ),
                  ];
            for (const fPt of fieldSeeds) {
              if (s.chronoFields.filter((cf) => cf.sourceGunId === gun.id).length >= maxFields) {
                const oldestIdx = s.chronoFields.findIndex((cf) => cf.sourceGunId === gun.id);
                if (oldestIdx >= 0) s.chronoFields.splice(oldestIdx, 1);
              }
              s.chronoFields.push({
                id: s.nextProjId++,
                sourceGunId: gun.id,
                x: fPt.x,
                y: fPt.y,
                radius: profile.splashRadius,
                recordedDamage: Math.round(shotDmg * 0.9),
                dps: Math.round(shotDmg * 0.56),
                echoRatio: profile.brittleBonus,
                slowPct: profile.slowPct,
                pullForce: profile.pullForce * 1.2,
                armorPierce: 1,
                shieldMult: profile.shieldMult * 1.15,
                life: 4.8,
                maxLife: 4.8,
                level: gun.level,
                variant: gun.variant ?? 'alpha',
                isCrit: true,
              });
            }

            let interruptedAny = false;
            for (const en of liveEnemies) {
              const isHeavy =
                en.kind === 'boss' || en.kind === 'super_boss' || en.kind === 'juggernaut';
              en.stunTimer = Math.max(en.stunTimer, isHeavy ? 0.9 : 2.4);
              en.slowTimer = Math.max(en.slowTimer, 4.0);
              en.slowFactor = Math.min(en.slowFactor || 1, 0.52);
              en.armorShred = Math.max(en.armorShred, 0.35);
              if (interruptEnemyWindup(en)) {
                interruptedAny = true;
                pushCombatText(en.x, en.y - 18, '⏳ NGƯNG ĐỌNG NGẮT CHIÊU!', '#67E8F9', 1.14);
              }
              const res = applyDamageToEnemy(en, Math.round(shotDmg * 1.4), {
                armorPierce: 1,
                shieldMult: 2.3,
              });
              recordDamageTelemetry(en, res.actualDamage, gun.id, 0, 0.5);
              if (res.killed) recordKill(en, gun.id);
            }
            if (interruptedAny) {
              playSynthFx('interrupt', soundEnabled, audioCtxRef);
            }
            pushCombatText(centerPt.x, centerPt.y - 26, '⏳ NGƯNG ĐỌNG VĨNH HẰNG!', '#67E8F9', 1.18);
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
          const teamDamageBuff = computeTeamSupportBuffAtTile(s.guns, gun.col, gun.row);

          // Mothership Hangar: continuously maintains 3-4 (+1 Alpha) autonomous fighter drones
          if (gun.type === 'mothership' && (s.waveActive || liveEnemies.length > 0)) {
            const droneCap = getMothershipMaxDrones(gun.level, gun.variant ?? 'alpha');
            const padDrones = s.carrierDrones.filter((d) => d.sourceGunId === gun.id);
            const liveDroneDmg = Math.round(profile.damage * overdriveDmgMult * teamDamageBuff.damageMult);
            const droneSpeed = (gun.variant === 'alpha' ? 285 : 242) + gun.level * 10;
            for (const d of padDrones) {
              d.damage = (gun.overheatTimer ?? 0) > 0 ? Math.round(liveDroneDmg * 1.65) : liveDroneDmg;
              d.armorPierce = profile.armorPierce;
              d.shieldMult = profile.shieldMult;
              d.bossMult = gun.level >= 7 ? 1.45 : 1.2;
              d.speed = droneSpeed;
              d.variant = gun.variant ?? 'alpha';
              d.visualTier = profile.visualTier;
            }
            if (padDrones.length < droneCap && (padDrones.length === 0 || gun.chargeTimer >= 0.34)) {
              const slotAngle = gun.aimAngle + (padDrones.length - 1.5) * 0.55;
              const droneLife = 18 + gun.level * 0.9;
              s.carrierDrones.push({
                id: s.nextProjId++,
                sourceGunId: gun.id,
                x: origin.x + Math.cos(slotAngle) * 14,
                y: origin.y + Math.sin(slotAngle) * 14,
                vx: Math.cos(slotAngle) * droneSpeed,
                vy: Math.sin(slotAngle) * droneSpeed,
                heading: slotAngle,
                fireCooldown: 0.12,
                shotCount: 0,
                life: droneLife,
                maxLife: droneLife,
                damage: liveDroneDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                bossMult: gun.level >= 7 ? 1.45 : 1.2,
                speed: droneSpeed,
                variant: gun.variant ?? 'alpha',
                visualTier: profile.visualTier,
                evadeTimer: 0,
                trail: [],
              });
              emitParticles(origin.x, origin.y, '#38BDF8', 8, 95, 0.9);
              if (padDrones.length > 0) {
                gun.chargeTimer = 0;
              }
            }
          }

          // Target selection honoring TargetPriority (Orbital has unlimited global range)
          let target: TdEnemy | null = null;
          let bestScore = -Infinity;
          for (const en of liveEnemies) {
            const dx = en.x - origin.x;
            const dy = en.y - origin.y;
            const distSq = dx * dx + dy * dy;
            const inRange = gun.type === 'orbital' || gun.type === 'mothership' ? true : distSq <= rangeSq;
            if (inRange) {
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
          } else if ((gun.heat ?? 0) > 0 && (gun.overheatTimer ?? 0) <= 0) {
            gun.heat = Math.max(0, (gun.heat ?? 0) - simDt * 12);
          }

          gun.chargeTimer += simDt * overdriveSpeedMult;

          // Allow Overheat skill to unleash immediately when heat >= 100
          if ((gun.heat ?? 0) >= 100 && (gun.overheatTimer ?? 0) <= 0 && target) {
            gun.heat = 0;
            gun.overheatTimer = 3.5;
            const ohDmg = isSupportGunType(gun.type)
              ? 0
              : Math.round(profile.damage * overdriveDmgMult * teamBuff.damageMult);
            triggerGunOverheatSkill(gun, origin, profile, ohDmg, target);
          }

          if (!target || gun.chargeTimer < profile.cooldownSec) continue;

          gun.chargeTimer = 0;
          gun.recoil = 1;
          const isSupportGun = isSupportGunType(gun.type);
          const didCrit =
            !isSupportGun && teamBuff.critChance > 0 && Math.random() < teamBuff.critChance;
          const critMultApplied = didCrit ? teamBuff.critMult : 1;
          const shotDmg = isSupportGun
            ? 0
            : Math.round(profile.damage * overdriveDmgMult * teamBuff.damageMult * critMultApplied);

          if ((gun.overheatTimer ?? 0) <= 0) {
            const heatGain = profile.overheatSkill.heatPerShot * (GAME_MODE_CONFIGS[s.gameMode].heatMult ?? 1);
            gun.heat = Math.min(100, (gun.heat ?? 0) + heatGain);
            if ((gun.heat ?? 0) >= 100) {
              gun.heat = 0;
              gun.overheatTimer = 3.5;
              triggerGunOverheatSkill(gun, origin, profile, shotDmg, target);
            }
          }

          if (gun.type === 'gatling' || gun.type === 'shotgun') {
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
                isCrit: didCrit,
                trail: [],
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
                isCrit: didCrit,
                trail: [],
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
                  recordDamageTelemetry(en, res.actualDamage, gun.id, 0.05);
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
            emitParticles(origin.x, origin.y, '#BAE6FD', 10 + profile.visualTier * 2, 135, 0.95);

            // Pure Support Cryo: 0 damage — applies slow + brittle + conductive wet mist + stealth reveal
            const wetDur = (gun.variant === 'alpha' ? 3.6 : 2.6) + (gun.level >= 10 ? 0.8 : 0);
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                en.slowTimer = Math.max(en.slowTimer, 2.5 + gun.level * 0.15);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                en.brittleBonus = Math.max(en.brittleBonus, profile.brittleBonus);
                en.wetTimer = Math.max(en.wetTimer, wetDur);
                emitParticles(en.x, en.y, '#E0F2FE', 4, 65, 0.8);
              }
            }
            playSynthFx('cryo', soundEnabled, audioCtxRef);
          } else if (gun.type === 'tesla') {
            const targetSyn = computeElectricWetSynergy(target, gun.level);
            const maxJumps = profile.chainCount + targetSyn.extraChains;
            const hitIds = new Set<number>([target.id]);
            const chainPts: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            const chainPtsAlt: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            const branches: { x1: number; y1: number; x2: number; y2: number }[] = [];
            let anyWetOverdrive = targetSyn.isWetSynergy;
            let cur: TdEnemy | null = target;

            for (let j = 0; j < maxJumps && cur; j++) {
              const syn = computeElectricWetSynergy(cur, gun.level);
              if (syn.isWetSynergy) anyWetOverdrive = true;

              const prevPt = chainPts[chainPts.length - 1];
              const dx = cur.x - prevPt.x;
              const dy = cur.y - prevPt.y;
              const seg1X = prevPt.x + dx * 0.33 + (Math.random() * 20 - 10);
              const seg1Y = prevPt.y + dy * 0.33 + (Math.random() * 20 - 10);
              const seg2X = prevPt.x + dx * 0.66 + (Math.random() * 20 - 10);
              const seg2Y = prevPt.y + dy * 0.66 + (Math.random() * 20 - 10);
              chainPts.push({ x: seg1X, y: seg1Y }, { x: seg2X, y: seg2Y }, { x: cur.x, y: cur.y });
              chainPtsAlt.push(
                { x: prevPt.x + dx * 0.5 + (Math.random() * 24 - 12), y: prevPt.y + dy * 0.5 + (Math.random() * 24 - 12) },
                { x: cur.x, y: cur.y }
              );
              if (syn.isWetSynergy || profile.visualTier >= 3) {
                branches.push({
                  x1: seg1X,
                  y1: seg1Y,
                  x2: seg1X + (Math.random() * 30 - 15),
                  y2: seg1Y + (Math.random() * 30 - 15),
                });
              }

              const falloff = Math.max(0.54, 1 - j * 0.075);
              const zapDmg = Math.round(shotDmg * falloff * syn.damageMult);
              cur.slowTimer = Math.max(cur.slowTimer, 1.4 + gun.level * 0.1);
              cur.slowFactor = Math.min(cur.slowFactor || 1, 1 - profile.slowPct);
              cur.shockTimer = Math.max(cur.shockTimer, Math.max(0.45, syn.shockSec));
              if (gun.level >= 7 || syn.isWetSynergy) {
                cur.stunTimer = Math.max(cur.stunTimer, syn.isWetSynergy ? 0.38 : 0.25);
              }
              if ((gun.level >= 5 || syn.isWetSynergy) && interruptEnemyWindup(cur)) {
                pushCombatText(cur.x, cur.y - 16, '⚡ NGẮT CHIÊU!', '#38BDF8', 1.08);
                playSynthFx('interrupt', soundEnabled, audioCtxRef);
              }
              emitParticles(cur.x, cur.y, syn.isWetSynergy ? '#22D3EE' : profile.visualTier >= 3 ? '#FDE047' : '#7DD3FC', 8, 120, 1);

              const res = applyDamageToEnemy(cur, zapDmg, {
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult + syn.shieldMultBonus,
              });
              recordDamageTelemetry(cur, res.actualDamage, gun.id, 0.05);
              if (didCrit && j === 0 && res.actualDamage > 0) {
                pushCombatText(cur.x, cur.y - 10, `CHÍ MẠNG! -${Math.round(res.actualDamage)}`, '#FDE047', 1.04);
              }
              if (res.killed) recordKill(cur, gun.id);

              // AoE thunderbolt splash (Lv10 or wet overdrive splash)
              const thunderSplash = profile.splashRadius > 0 ? profile.splashRadius + syn.splashBonusPx : 0;
              if (j === 0 && thunderSplash > 0) {
                s.impactFlashes.push({
                  x: cur.x,
                  y: cur.y,
                  radius: thunderSplash * 0.72,
                  alpha: 0.95,
                  color: syn.isWetSynergy ? '#22D3EE' : '#FDE047',
                  spikes: 6,
                  rot: Math.random() * Math.PI,
                });
                const thunderDmg = Math.round(shotDmg * 0.45 * syn.damageMult);
                for (const aoeEn of liveEnemies) {
                  if (aoeEn.id === cur.id || aoeEn.hp <= 0 || aoeEn.koTimer > 0) continue;
                  if (Math.hypot(aoeEn.x - cur.x, aoeEn.y - cur.y) <= thunderSplash + aoeEn.radius) {
                    const aRes = applyDamageToEnemy(aoeEn, thunderDmg, {
                      armorPierce: profile.armorPierce,
                      shieldMult: profile.shieldMult + syn.shieldMultBonus,
                    });
                    s.totalDamage += aRes.actualDamage;
                    gun.totalDamageDealt += aRes.actualDamage;
                    if (aRes.killed) recordKill(aoeEn, gun.id);
                  }
                }
              }

              let nextTarget: TdEnemy | null = null;
              let minD = (148 + gun.level * 10 + (syn.isWetSynergy ? 32 : 0)) ** 2;
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
              color: anyWetOverdrive ? '#22D3EE' : profile.visualTier === 4 ? '#FDE047' : '#38BDF8',
              width: (2.8 + profile.visualTier * 0.7) * (anyWetOverdrive ? 1.18 : 1),
              isWetOverdrive: anyWetOverdrive,
              branches,
            });
            s.lightningArcs.push({
              points: chainPtsAlt,
              alpha: 0.85,
              color: anyWetOverdrive ? '#BAE6FD' : profile.visualTier >= 3 ? '#38BDF8' : '#BAE6FD',
              width: 1.8 + profile.visualTier * 0.35,
              isWetOverdrive: anyWetOverdrive,
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
                isCrit: didCrit,
                trail: [],
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
                  const bossCrit = gun.level === MAX_GUN_LEVEL && (en.kind === 'boss' || en.kind === 'super_boss');
                  const beamHitDmg = bossCrit ? Math.round(perBeamDmg * 1.25) : perBeamDmg;
                  emitParticles(en.x, en.y, profile.visualTier >= 3 ? '#FDE047' : '#E879F9', 14, 175, 1.2);
                  const res = applyDamageToEnemy(en, beamHitDmg, {
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                  });
                  recordDamageTelemetry(en, res.actualDamage, gun.id, 0.04);
                  if ((bossCrit || didCrit) && res.actualDamage > 0) {
                    pushCombatText(
                      en.x,
                      en.y - 10,
                      `${bossCrit ? 'ORBITAL' : 'CHÍ MẠNG'}! -${Math.round(res.actualDamage)}`,
                      '#FDE047',
                      1.12
                    );
                  }
                  if (res.killed) recordKill(en, gun.id);

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
                isCrit: didCrit,
                trail: [],
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: launchAngle, radius: 22 + profile.visualTier * 3, alpha: 0.95, color: '#C084FC' });
            }
            playSynthFx('mortar', soundEnabled, audioCtxRef);
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
                isCrit: didCrit,
                trail: [],
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
            // Pure Support Beacon: 0 damage — radiates Damage + Critical Strike aura
            const rayCount = 6 + profile.visualTier * 2;
            const rayColor = profile.visualTier === 4 ? '#FEF08A' : '#FACC15';
            for (let r = 0; r < rayCount; r++) {
              const ra = (r * Math.PI * 2) / rayCount + s.animTime * 0.8;
              s.harmonicRays.push({
                x: origin.x,
                y: origin.y,
                angle: ra,
                length: profile.rangePx * 0.72,
                alpha: 0.58,
                color: rayColor,
              });
            }
            emitParticles(origin.x, origin.y, '#FDE047', 10 + profile.visualTier * 2, 120, 0.95);
            playSynthFx('beacon', soundEnabled, audioCtxRef);
          } else if (gun.type === 'radar') {
            // Pure Support Radar: 0 damage — marks targets, shreds armor, applies slow/brittle, grants ally Range/Pierce
            const rayCount = 4 + profile.visualTier;
            for (let r = 0; r < rayCount; r++) {
              const ra = gun.aimAngle + (r - (rayCount - 1) / 2) * 0.16;
              s.harmonicRays.push({
                x: origin.x,
                y: origin.y,
                angle: ra,
                length: profile.rangePx * 0.86,
                alpha: 0.62,
                color: '#22D3EE',
              });
            }
            emitParticles(origin.x, origin.y, '#22D3EE', 8 + profile.visualTier * 2, 115, 0.9);
            const shredAmt = gun.level >= 7 ? 0.24 : 0.14;
            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                en.slowTimer = Math.max(en.slowTimer, 2.2);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                en.brittleBonus = Math.max(en.brittleBonus, profile.brittleBonus);
                en.markedTimer = Math.max(en.markedTimer, 3.2);
                en.markedBonus = Math.max(en.markedBonus, profile.brittleBonus);
                en.armorShred = Math.max(en.armorShred, shredAmt);
                emitParticles(en.x, en.y, '#67E8F9', 3, 60, 0.72);
              }
            }
            playSynthFx('radar', soundEnabled, audioCtxRef);
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
                isElectricStorm: true,
                isCrit: didCrit,
                trail: [],
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
          } else if (gun.type === 'orbital') {
            // Global-range Sky Pillar Laser + % Max HP Thermal Shred + Magma/Radiation burn & armor-melt zone
            const pillarTargets = [...liveEnemies]
              .sort((a, b) => {
                if (gun.priority === 'weakest') return a.hp + a.shield - (b.hp + b.shield);
                if (gun.priority === 'first') return b.waypointIndex - a.waypointIndex;
                return b.hp + b.shield - (a.hp + a.shield);
              })
              .slice(0, profile.projectilesPerShot);
            const isOmega = (gun.variant ?? 'alpha') === 'omega';
            const zoneRadius = Math.round(profile.splashRadius * (isOmega ? 1.24 : 1.0));
            const zoneLife = isOmega ? 5.4 : 4.1;
            const shredPct = gun.level >= 7 ? 0.35 : 0.24;

            for (const oTarget of pillarTargets) {
              s.orbitalBeams.push({
                x: oTarget.x,
                y: oTarget.y,
                alpha: 1.12,
                radius: profile.splashRadius,
                color: profile.visualTier === 4 ? '#FDE047' : '#F97316',
                visualTier: profile.visualTier,
              });
              s.impactFlashes.push({
                x: oTarget.x,
                y: oTarget.y,
                radius: Math.min(58, profile.splashRadius * 0.78),
                alpha: 1,
                color: '#FB923C',
                spikes: 7,
                rot: s.animTime,
              });
              spawnCrater(oTarget.x, oTarget.y, Math.min(48, zoneRadius * 0.75), 'scorch');
              emitParticles(oTarget.x, oTarget.y, '#FDBA74', 18, 165, 1.25);

              if (s.orbitalZones.length >= 16) s.orbitalZones.shift();
              s.orbitalZones.push({
                id: s.nextProjId++,
                sourceGunId: gun.id,
                x: oTarget.x,
                y: oTarget.y,
                radius: zoneRadius,
                dps: Math.max(32, Math.round(profile.burnDps * overdriveDmgMult * teamBuff.damageMult)),
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                armorShred: shredPct,
                slowPct: profile.slowPct,
                life: zoneLife,
                maxLife: zoneLife,
              });

              for (const en of liveEnemies) {
                const dist = Math.hypot(en.x - oTarget.x, en.y - oTarget.y);
                if (dist <= profile.splashRadius + en.radius) {
                  const isBoss = en.kind === 'boss' || en.kind === 'super_boss';
                  const bossMult = gun.level >= 7 && isBoss ? 1.38 : 1;
                  const centerRatio = en.id === oTarget.id || dist < 26 ? 1 : 0.68;
                  const maxHpBurn =
                    en.id === oTarget.id
                      ? Math.min(
                          Math.round(shotDmg * 1.15),
                          Math.round(en.maxHp * (gun.level >= 7 ? 0.06 : 0.035))
                        )
                      : 0;
                  const pillarDmg = Math.round(shotDmg * centerRatio * bossMult) + maxHpBurn;
                  en.armorShred = Math.max(en.armorShred, shredPct);
                  en.burnTimer = Math.max(en.burnTimer, 2.8);
                  en.burnDps = Math.max(en.burnDps, profile.burnDps);
                  const res = applyDamageToEnemy(en, pillarDmg, {
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                  });
                  recordDamageTelemetry(en, res.actualDamage, gun.id, 0.045);
                  if (en.id === oTarget.id && res.actualDamage > 0 && (didCrit || isBoss)) {
                    pushCombatText(
                      en.x,
                      en.y - 12,
                      `${didCrit ? 'CHÍ MẠNG' : 'THIÊN PHẠT'} -${Math.round(res.actualDamage)}`,
                      '#FDBA74',
                      1.06
                    );
                  }
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
            playSynthFx('orbital', soundEnabled, audioCtxRef);
          } else if (gun.type === 'singularity') {
            // Persistent Black Hole hovering directly on the enemy track with strong vortex trap & swallow growth
            if (s.blackHoles.length >= 10) s.blackHoles.shift();
            const isOmega = (gun.variant ?? 'alpha') === 'omega';
            const holeLife = 4.6 + (gun.level >= 10 ? 0.7 : 0);
            s.blackHoles.push({
              id: s.nextProjId++,
              sourceGunId: gun.id,
              x: target.x,
              y: target.y,
              baseRadius: profile.splashRadius,
              currentRadius: profile.splashRadius,
              pullStrength: profile.pullForce * (gun.variant === 'alpha' ? 1.32 : 1),
              trueDps: Math.round(shotDmg * (isOmega ? 1.2 : 1.0)),
              accumulatedDamage: Math.round(shotDmg * (isOmega ? 2.6 : 2.1)),
              killsAbsorbed: 0,
              life: holeLife,
              maxLife: holeLife,
              maxScale: 1.85,
              level: gun.level,
              variant: gun.variant ?? 'alpha',
              isCrit: didCrit,
            });
            s.shockwaves.push({
              x: target.x,
              y: target.y,
              radius: 8,
              maxRadius: profile.splashRadius * 0.9,
              alpha: 0.85,
              color: '#C084FC',
              lineWidth: 2.4,
            });
            emitParticles(target.x, target.y, '#C084FC', 16, 120, 1.15);
            playSynthFx('singularity', soundEnabled, audioCtxRef);
          } else if (gun.type === 'mothership') {
            // Fleet Hangar synchronization pulse & immediate target volley boost
            s.harmonicRays.push({
              x: origin.x,
              y: origin.y,
              angle: gun.aimAngle,
              length: 44,
              alpha: 0.55,
              color: '#38BDF8',
            });
            playSynthFx('mothership', soundEnabled, audioCtxRef);
          } else if (gun.type === 'supernova') {
            gun.shotsFired = (gun.shotsFired ?? 0) + 1;
            const isOmega = (gun.variant ?? 'alpha') === 'omega';
            const beamEvery = isOmega || gun.level >= MAX_GUN_LEVEL ? 3 : 4;
            const triggerHyperBeam = gun.shotsFired % beamEvery === 0;
            const muzzleX = origin.x + Math.cos(gun.aimAngle) * 24;
            const muzzleY = origin.y + Math.sin(gun.aimAngle) * 24;
            const orbSpeed = 470 + gun.level * 10;

            s.projectiles.push({
              id: s.nextProjId++,
              kind: 'supernova_orb',
              sourceGunId: gun.id,
              x: muzzleX,
              y: muzzleY,
              vx: Math.cos(gun.aimAngle) * orbSpeed,
              vy: Math.sin(gun.aimAngle) * orbSpeed,
              targetId: target.id,
              damage: shotDmg,
              armorPierce: profile.armorPierce,
              shieldMult: profile.shieldMult,
              splashRadius: profile.splashRadius,
              pullForce: 0,
              burnDps: 0,
              burnDuration: 0,
              slowAmount: profile.slowPct,
              pierceLeft: profile.chainCount,
              hitIds: [],
              life: 2.1,
              maxLife: 2.1,
              age: 0,
              speed: orbSpeed,
              color: isOmega ? '#F59E0B' : '#FDE047',
              visualTier: profile.visualTier,
              supernovaBrandAmp: profile.brittleBonus,
              supernovaEchoDmg: Math.round(shotDmg * 0.65),
              isCrit: didCrit,
              trail: [],
            });
            s.muzzleFlashes.push({
              x: muzzleX,
              y: muzzleY,
              angle: gun.aimAngle,
              radius: 26 + profile.visualTier * 3,
              alpha: 1,
              color: '#FDE047',
            });

            if (triggerHyperBeam) {
              const beamLength = Math.max(profile.rangePx + 220, 720);
              const endX = origin.x + Math.cos(gun.aimAngle) * beamLength;
              const endY = origin.y + Math.sin(gun.aimAngle) * beamLength;
              s.railBeams.push({
                x1: muzzleX,
                y1: muzzleY,
                x2: endX,
                y2: endY,
                alpha: 1.18,
                color: isOmega ? '#F59E0B' : '#FDE047',
                visualTier: 4,
                variant: 'supernova',
              });
              const segLenSq = (endX - origin.x) ** 2 + (endY - origin.y) ** 2;
              const beamDmg = Math.round(shotDmg * (isOmega ? 1.12 : 0.92));
              for (const en of liveEnemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const tProj = Math.max(
                  0,
                  Math.min(1, ((en.x - origin.x) * (endX - origin.x) + (en.y - origin.y) * (endY - origin.y)) / segLenSq)
                );
                const px = origin.x + tProj * (endX - origin.x);
                const py = origin.y + tProj * (endY - origin.y);
                if ((en.x - px) ** 2 + (en.y - py) ** 2 <= (en.radius + 22) ** 2) {
                  en.markedTimer = Math.max(en.markedTimer, 4.2);
                  en.markedBonus = Math.max(en.markedBonus, profile.brittleBonus);
                  en.supernovaBrandDmg = Math.max(en.supernovaBrandDmg ?? 0, Math.round(shotDmg * 0.65));
                  if (gun.level >= 5 && interruptEnemyWindup(en)) {
                    pushCombatText(en.x, en.y - 16, '✦ PHÁN QUYẾT NGẮT CHIÊU!', '#FDE047', 1.1);
                    playSynthFx('interrupt', soundEnabled, audioCtxRef);
                  }
                  const res = applyDamageToEnemy(en, beamDmg, {
                    armorPierce: Math.min(1, profile.armorPierce + 0.08),
                    shieldMult: profile.shieldMult * 1.15,
                  });
                  recordDamageTelemetry(en, res.actualDamage, gun.id, 0.045);
                  if (res.killed) recordKill(en, gun.id);
                }
              }

              // Lv5+ spawns 2 homing Golden Star-Shards on Hyper-Beam volley
              if (gun.level >= 5 && liveEnemies.length > 0) {
                const topLocks = [...liveEnemies].sort((a, b) => b.hp + b.shield - (a.hp + a.shield));
                for (let sh = 0; sh < 2; sh++) {
                  const lock = topLocks[sh % topLocks.length];
                  const sa = gun.aimAngle + (sh === 0 ? -0.45 : 0.45);
                  s.projectiles.push({
                    id: s.nextProjId++,
                    kind: 'missile',
                    sourceGunId: gun.id,
                    x: muzzleX,
                    y: muzzleY,
                    vx: Math.cos(sa) * 360,
                    vy: Math.sin(sa) * 360,
                    targetId: lock.id,
                    damage: Math.round(shotDmg * 0.48),
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                    splashRadius: 56,
                    pullForce: 0,
                    burnDps: 0,
                    burnDuration: 0,
                    slowAmount: 0,
                    pierceLeft: 0,
                    life: 2.2,
                    maxLife: 2.2,
                    age: 0,
                    speed: 360,
                    color: '#FEF08A',
                    visualTier: 4,
                    isCrit: didCrit,
                    trail: [],
                  });
                }
              }
            }
            playSynthFx('supernova', soundEnabled, audioCtxRef);
          } else if (gun.type === 'chronos') {
            const isOmega = (gun.variant ?? 'alpha') === 'omega';
            const inRange = liveEnemies
              .filter((e) => (e.x - origin.x) ** 2 + (e.y - origin.y) ** 2 <= rangeSq)
              .sort((a, b) => b.hp + b.shield - (a.hp + a.shield));
            const slashList: TdEnemy[] = inRange.slice(0, profile.chainCount);
            if (gun.level >= 7) {
              const globalTop = [...liveEnemies]
                .filter((e) => !slashList.some((x) => x.id === e.id))
                .sort((a, b) => b.hp + b.shield - (a.hp + a.shield))[0];
              if (globalTop) slashList.push(globalTop);
            }

            const slashColor = isOmega ? '#C084FC' : '#22D3EE';
            slashList.forEach((sEn, idx) => {
              const slAngle = Math.atan2(sEn.y - origin.y, sEn.x - origin.x);
              s.chronoSlashes.push({
                x: sEn.x,
                y: sEn.y,
                angle: slAngle,
                length: isOmega ? 56 : 48,
                alpha: 1,
                color: slashColor,
                isCrit: didCrit || idx === 0,
              });
              sEn.armorShred = Math.max(sEn.armorShred, 0.08 + gun.level * 0.015);
              if (sEn.kind !== 'boss' && sEn.kind !== 'super_boss' && sEn.kind !== 'juggernaut') {
                sEn.stunTimer = Math.max(sEn.stunTimer, 0.22);
              }
              sEn.slowTimer = Math.max(sEn.slowTimer, 2.4);
              sEn.slowFactor = Math.min(sEn.slowFactor || 1, 1 - profile.slowPct);

              const slashHit = Math.round(shotDmg * (idx === 0 ? 1 : 0.78));
              const res = applyDamageToEnemy(sEn, slashHit, {
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
              });
              recordDamageTelemetry(sEn, res.actualDamage, gun.id, 0.045, 0.5);
              if ((didCrit || idx === 0) && res.actualDamage > 0 && (didCrit || sEn.kind === 'boss' || sEn.kind === 'super_boss')) {
                pushCombatText(
                  sEn.x,
                  sEn.y - 12,
                  `${didCrit ? 'CHÍ MẠNG' : 'TRẢM'} -${Math.round(res.actualDamage)}`,
                  slashColor,
                  1.06
                );
              }
              emitParticles(sEn.x, sEn.y, slashColor, 8, 120, 1.05);
              if (res.killed) recordKill(sEn, gun.id);
            });

            // Spawn / Maintain Chronosphere Field centered on primary target
            const maxFields = getChronosMaxFields(gun.level, gun.variant ?? 'alpha');
            const gunFields = s.chronoFields.filter((cf) => cf.sourceGunId === gun.id);
            const nearbyExisting = gunFields.find(
              (cf) => Math.hypot(cf.x - target.x, cf.y - target.y) <= cf.radius * 0.55
            );
            if (nearbyExisting) {
              nearbyExisting.life = Math.max(nearbyExisting.life, 3.6);
              nearbyExisting.dps = Math.max(nearbyExisting.dps, Math.round(shotDmg * 0.48));
            } else {
              if (gunFields.length >= maxFields) {
                const oldestIdx = s.chronoFields.findIndex((cf) => cf.sourceGunId === gun.id);
                if (oldestIdx >= 0) s.chronoFields.splice(oldestIdx, 1);
              }
              s.chronoFields.push({
                id: s.nextProjId++,
                sourceGunId: gun.id,
                x: target.x,
                y: target.y,
                radius: profile.splashRadius,
                recordedDamage: Math.round(shotDmg * 0.55),
                dps: Math.round(shotDmg * 0.48),
                echoRatio: profile.brittleBonus,
                slowPct: profile.slowPct,
                pullForce: profile.pullForce,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                life: 4.4,
                maxLife: 4.4,
                level: gun.level,
                variant: gun.variant ?? 'alpha',
                isCrit: didCrit,
              });
            }

            s.muzzleFlashes.push({
              x: origin.x + Math.cos(gun.aimAngle) * 22,
              y: origin.y + Math.sin(gun.aimAngle) * 22,
              angle: gun.aimAngle,
              radius: 26 + profile.visualTier * 3,
              alpha: 0.96,
              color: slashColor,
            });
            playSynthFx('chronos', soundEnabled, audioCtxRef);
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
            pr.kind === 'tempest_orb';
          if (isHoming) {
            let tgt = s.enemies.find((e) => e.id === pr.targetId && e.hp > 0 && e.koTimer <= 0);
            if (!tgt) {
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
            const steerDelay = pr.kind === 'missile' ? 0.07 : 0;
            if (tgt && pr.age >= steerDelay) {
              const targetAngle = Math.atan2(tgt.y - pr.y, tgt.x - pr.x);
              const curAngle = Math.atan2(pr.vy, pr.vx);
              const diff = Math.atan2(Math.sin(targetAngle - curAngle), Math.cos(targetAngle - curAngle));
              const maxTurn = 9.5 * simDt;
              const nextAngle = Math.abs(diff) <= maxTurn ? targetAngle : curAngle + Math.sign(diff) * maxTurn;
              pr.vx = Math.cos(nextAngle) * pr.speed;
              pr.vy = Math.sin(nextAngle) * pr.speed;
            }
          }

          if ((pr.kind === 'missile' || pr.kind === 'mortar' || pr.kind === 'supernova_orb') && Math.random() < 0.65) {
            emitParticles(pr.x, pr.y, pr.color, 1, 36, pr.visualTier >= 3 ? 0.95 : 0.75);
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
                  if (dist > 6 && en.kind !== 'boss' && en.kind !== 'super_boss') {
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
                  recordDamageTelemetry(en, res.actualDamage, pr.sourceGunId, 0.045);
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
                  recordDamageTelemetry(en, res.actualDamage, pr.sourceGunId, 0.045);
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
                    trail: [],
                  });
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
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
              recordDamageTelemetry(hitEnemy, res.actualDamage, pr.sourceGunId, 0.045);
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
            } else if (pr.kind === 'tempest_orb') {
              const sourceLevel = sourceGun?.level ?? (pr.visualTier >= 4 ? 10 : pr.visualTier >= 3 ? 7 : 4);
              const hitSyn = computeElectricWetSynergy(hitEnemy, sourceLevel);
              const effSplash = pr.splashRadius + hitSyn.splashBonusPx;
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(60, Math.max(28, effSplash * 0.56)),
                alpha: 0.95,
                color: hitSyn.isWetSynergy ? '#22D3EE' : '#818CF8',
                spikes: 7,
                rot: s.animTime * 3,
              });
              emitParticles(pr.x, pr.y, hitSyn.isWetSynergy ? '#22D3EE' : '#A5B4FC', 14, 140, 1.15);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= effSplash + en.radius) {
                  const enSyn = computeElectricWetSynergy(en, sourceLevel);
                  en.slowTimer = Math.max(en.slowTimer, 1.6);
                  en.slowFactor = Math.min(en.slowFactor || 1, 1 - Math.min(0.38, pr.slowAmount));
                  en.shockTimer = Math.max(en.shockTimer, Math.max(0.55, enSyn.shockSec));
                  if ((pr.visualTier >= 3 || enSyn.isWetSynergy) && dist < 44) {
                    en.stunTimer = Math.max(en.stunTimer, enSyn.isWetSynergy ? 0.35 : 0.22);
                  }
                  if ((sourceLevel >= 5 || enSyn.isWetSynergy) && interruptEnemyWindup(en)) {
                    pushCombatText(en.x, en.y - 16, '⚡ NGẮT CHIÊU!', '#38BDF8', 1.06);
                    playSynthFx('interrupt', soundEnabled, audioCtxRef);
                  }
                  const orbHitDmg = Math.round(pr.damage * (dist < 28 ? 1 : 0.72) * enSyn.damageMult);
                  const res = applyDamageToEnemy(en, orbHitDmg, {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult + enSyn.shieldMultBonus,
                  });
                  recordDamageTelemetry(en, res.actualDamage, pr.sourceGunId, 0.045);
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              // Arc secondary EMP bolts (Lv7+ or wet overdrive)
              if (pr.visualTier >= 3 || hitSyn.isWetSynergy) {
                const arcTarget = s.enemies.find(
                  (e) =>
                    e.id !== hitEnemy.id &&
                    e.hp > 0 &&
                    e.koTimer <= 0 &&
                    Math.hypot(e.x - pr.x, e.y - pr.y) <= (hitSyn.isWetSynergy ? 165 : 135)
                );
                if (arcTarget) {
                  const midX = (pr.x + arcTarget.x) / 2 + (Math.random() * 18 - 9);
                  const midY = (pr.y + arcTarget.y) / 2 + (Math.random() * 18 - 9);
                  s.lightningArcs.push({
                    points: [{ x: pr.x, y: pr.y }, { x: midX, y: midY }, { x: arcTarget.x, y: arcTarget.y }],
                    alpha: 0.94,
                    color: hitSyn.isWetSynergy ? '#22D3EE' : '#38BDF8',
                    width: hitSyn.isWetSynergy ? 3.5 : 2.8,
                    isWetOverdrive: hitSyn.isWetSynergy,
                    branches: hitSyn.isWetSynergy
                      ? [{ x1: midX, y1: midY, x2: midX + (Math.random() * 26 - 13), y2: midY + (Math.random() * 26 - 13) }]
                      : undefined,
                  });
                  const arcRes = applyDamageToEnemy(arcTarget, Math.round(pr.damage * 0.58 * hitSyn.damageMult), {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult + hitSyn.shieldMultBonus,
                  });
                  s.totalDamage += arcRes.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += arcRes.actualDamage;
                  if (arcRes.killed) recordKill(arcTarget, pr.sourceGunId);
                }
              }
              playSynthFx('tesla', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'supernova_orb') {
              s.impactFlashes.push({
                x: pr.x,
                y: pr.y,
                radius: Math.min(68, Math.max(36, pr.splashRadius * 0.56)),
                alpha: 0.98,
                color: '#FDE047',
                spikes: 8,
                rot: s.animTime * 2.5,
              });
              emitParticles(pr.x, pr.y, '#FEF08A', 16, 165, 1.25);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  en.slowTimer = Math.max(en.slowTimer, 1.8);
                  en.slowFactor = Math.min(en.slowFactor || 1, 1 - Math.min(0.4, pr.slowAmount));
                  en.markedTimer = Math.max(en.markedTimer, 4.0);
                  en.markedBonus = Math.max(en.markedBonus, pr.supernovaBrandAmp ?? 0.28);
                  en.supernovaBrandDmg = Math.max(en.supernovaBrandDmg ?? 0, pr.supernovaEchoDmg ?? Math.round(pr.damage * 0.62));
                  const novaHitDmg = Math.round(pr.damage * (en.id === hitEnemy.id || dist < 34 ? 1 : 0.74));
                  const res = applyDamageToEnemy(en, novaHitDmg, {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  recordDamageTelemetry(en, res.actualDamage, pr.sourceGunId, 0.045);
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              if (pr.pierceLeft > 0) {
                pr.pierceLeft -= 1;
                if (!pr.hitIds) pr.hitIds = [];
                pr.hitIds.push(hitEnemy.id);
              } else {
                continue;
              }
            } else {
              // Bullet / Pellet / Bomblet (AoE, Burn, Slow, Pierce)
              if (pr.burnDps > 0) {
                hitEnemy.burnTimer = Math.max(hitEnemy.burnTimer, pr.burnDuration);
                hitEnemy.burnDps = Math.max(hitEnemy.burnDps, pr.burnDps);
                hitEnemy.armorShred = Math.max(hitEnemy.armorShred, 0.18);
              }
              if (pr.slowAmount > 0) {
                hitEnemy.slowTimer = Math.max(hitEnemy.slowTimer, 1.4);
                hitEnemy.slowFactor = Math.min(hitEnemy.slowFactor || 1, 1 - Math.min(0.32, pr.slowAmount));
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
                    recordDamageTelemetry(en, res.actualDamage, pr.sourceGunId, 0.045);
                    if (res.killed) recordKill(en, pr.sourceGunId);
                  }
                }
              } else {
                const res = applyDamageToEnemy(hitEnemy, pr.damage, {
                  armorPierce: pr.armorPierce,
                  shieldMult: pr.shieldMult,
                });
                recordDamageTelemetry(hitEnemy, res.actualDamage, pr.sourceGunId, 0.05);
                if (pr.isCrit && res.actualDamage > 0 && Math.random() < 0.25) {
                  pushCombatText(hitEnemy.x, hitEnemy.y - 8, `CHÍ MẠNG -${Math.round(res.actualDamage)}`, '#FDE047', 0.94);
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

          if (pr.kind === 'sawblade' && (pr.bounceLeft ?? 0) > 0) {
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
          for (const wu of outcome.windupEvents) {
            s.shockwaves.push({
              x: wu.x,
              y: wu.y,
              radius: 16,
              maxRadius: 46,
              alpha: 0.9,
              color: '#F43F5E',
              lineWidth: 2.6,
            });
            const label =
              wu.kind === 'shield_surge'
                ? '⚠ TỤ KHIÊN!'
                : wu.kind === 'armor_bastion'
                  ? '⚠ PHÁO ĐÀI!'
                  : '⚠ GỌI QUÂN!';
            pushCombatText(wu.x, wu.y - 18, label, '#FDA4AF', 1.05);
          }
          for (const ft of outcome.fortifyEvents) {
            s.shockwaves.push({
              x: ft.x,
              y: ft.y,
              radius: 14,
              maxRadius: 38,
              alpha: 0.85,
              color: '#F59E0B',
              lineWidth: 2.4,
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

        // 4b. Step Orbital Radiation Zones (continuous magma/radiation burn + armor melt + thermal slow)
        if (s.orbitalZones.length > 0) {
          const survivingZones: OrbitalRadiationZone[] = [];
          for (const z of s.orbitalZones) {
            z.life -= simDt;
            if (z.life <= 0) continue;
            survivingZones.push(z);
            const zGun = s.guns.find((g) => g.id === z.sourceGunId);
            const zoneTickDmg = z.dps * simDt;
            for (const en of s.enemies) {
              if (en.hp <= 0 || en.koTimer > 0) continue;
              if (Math.hypot(en.x - z.x, en.y - z.y) <= z.radius + en.radius) {
                if ((z.armorShred ?? 0) > 0) {
                  en.armorShred = Math.max(en.armorShred, z.armorShred ?? 0);
                }
                if ((z.slowPct ?? 0) > 0) {
                  en.slowTimer = Math.max(en.slowTimer, 0.45);
                  en.slowFactor = Math.min(en.slowFactor || 1, 1 - (z.slowPct ?? 0));
                }
                const res = applyDamageToEnemy(en, zoneTickDmg, {
                  armorPierce: z.armorPierce,
                  shieldMult: z.shieldMult,
                });
                recordDamageTelemetry(en, res.actualDamage, z.sourceGunId, 0.04);
                if (Math.random() < 0.14) {
                  emitParticles(en.x, en.y, '#F97316', 1, 38, 0.85);
                }
                if (res.killed) recordKill(en, z.sourceGunId);
              }
            }
          }
          s.orbitalZones = survivingZones;
        }

        // 4c. Step Singularity Black Holes (track-confined vortex pull + 100% True DPS + core crush + swallow growth & life extension + collapse blast)
        if (s.blackHoles.length > 0) {
          const survivingHoles: SingularityHole[] = [];
          for (const hole of s.blackHoles) {
            hole.life -= simDt;
            const hGun = s.guns.find((g) => g.id === hole.sourceGunId);
            const holeSlowFactor = hole.level >= 7 ? 0.58 : hole.level >= 3 ? 0.66 : 0.72;
            for (const en of s.enemies) {
              if (en.hp <= 0 || en.koTimer > 0) continue;
              const dist = Math.hypot(en.x - hole.x, en.y - hole.y);
              if (dist <= hole.currentRadius + en.radius) {
                if (dist > 6 && en.kind !== 'boss' && en.kind !== 'super_boss' && en.kind !== 'juggernaut') {
                  pullEnemyAlongTrack(en, s.map, hole.x, hole.y, hole.pullStrength * simDt);
                }
                en.slowTimer = Math.max(en.slowTimer, 0.45);
                en.slowFactor = Math.min(en.slowFactor || 1, holeSlowFactor);
                const coreCrushMult = dist <= hole.currentRadius * 0.45 ? 1.5 : 1.0;
                const tickTrueDmg = hole.trueDps * coreCrushMult * simDt;
                const res = applyDamageToEnemy(en, tickTrueDmg, {
                  armorPierce: 1,
                  shieldMult: 1.4,
                });
                recordDamageTelemetry(en, res.actualDamage, hole.sourceGunId, 0.04);
                if (res.killed) {
                  const grown = computeSingularitySwallowGrowth(
                    hole,
                    en.maxHp,
                    hole.level,
                    hole.variant
                  );
                  hole.killsAbsorbed = grown.killsAbsorbed;
                  hole.currentRadius = grown.currentRadius;
                  hole.accumulatedDamage = grown.accumulatedDamage;
                  hole.life = Math.min(hole.maxLife + 1.8, hole.life + 0.16);
                  emitParticles(hole.x, hole.y, '#FDE047', 6, 75, 1.05);
                  recordKill(en, hole.sourceGunId);
                }
              }
            }

            if (hole.life <= 0) {
              // Gravitational Collapse Detonation releasing all swallowed damage
              const blastR = Math.round(hole.currentRadius * 1.4);
              s.impactFlashes.push({
                x: hole.x,
                y: hole.y,
                radius: Math.min(76, blastR * 0.68),
                alpha: 1,
                color: '#E879F9',
                spikes: 9,
                rot: s.animTime,
              });
              s.shockwaves.push({
                x: hole.x,
                y: hole.y,
                radius: 14,
                maxRadius: blastR,
                alpha: 0.95,
                color: '#C084FC',
                lineWidth: 3.2,
              });
              spawnCrater(hole.x, hole.y, Math.min(58, blastR * 0.55), 'plasma');
              emitParticles(hole.x, hole.y, '#E879F9', 26, 205, 1.35);
              pushCombatText(
                hole.x,
                hole.y - 16,
                `NỔ HỐ ĐEN! -${Math.round(hole.accumulatedDamage)}`,
                '#E879F9',
                1.14
              );
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const d = Math.hypot(en.x - hole.x, en.y - hole.y);
                if (d <= blastR + en.radius) {
                  const res = applyDamageToEnemy(en, Math.round(hole.accumulatedDamage * (d < 48 ? 1 : 0.78)), {
                    armorPierce: 1,
                    shieldMult: 1.5,
                  });
                  s.totalDamage += res.actualDamage;
                  if (hGun) hGun.totalDamageDealt += res.actualDamage;
                  if (res.killed) recordKill(en, hole.sourceGunId);
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
            } else {
              survivingHoles.push(hole);
            }
          }
          s.blackHoles = survivingHoles;
        }

        // 4d. Step Mothership Autonomous Carrier Drones (hunt leaked enemies, evade Boss skills + counter-salvo, scaled ROF + micro-missile)
        if (s.carrierDrones.length > 0) {
          const bossHazards: { x: number; y: number; r: number }[] = [];
          for (const en of s.enemies) {
            if (en.hp > 0 && en.koTimer <= 0 && (en.kind === 'boss' || en.kind === 'super_boss') && en.windupTimer > 0) {
              bossHazards.push({ x: en.x, y: en.y, r: 85 });
            }
          }
          const coreFallbackPt = gridToWorldCenter(
            s.map.path[s.map.path.length - 1].col,
            s.map.path[s.map.path.length - 1].row
          );
          const survivingDrones: CarrierDrone[] = [];
          for (const drone of s.carrierDrones) {
            drone.life -= simDt;
            if (drone.life <= 0) continue;
            drone.evadeTimer = Math.max(0, drone.evadeTimer - simDt);
            drone.fireCooldown = Math.max(0, drone.fireCooldown - simDt);

            drone.trail.push({ x: drone.x, y: drone.y });
            if (drone.trail.length > 8) drone.trail.shift();

            // Evade Boss/Super Boss windup pulses automatically + trigger immediate counter-salvo
            if (drone.evadeTimer <= 0) {
              for (const hz of bossHazards) {
                if (shouldDroneEvadeBossPulse(drone.x, drone.y, hz.x, hz.y, hz.r)) {
                  drone.evadeTimer = 0.65;
                  drone.fireCooldown = 0;
                  const evadeAngle = Math.atan2(drone.y - hz.y, drone.x - hz.x) + Math.PI * 0.4;
                  drone.x = Math.max(16, Math.min(CANVAS_WIDTH - 16, drone.x + Math.cos(evadeAngle) * 36));
                  drone.y = Math.max(16, Math.min(CANVAS_HEIGHT - 16, drone.y + Math.sin(evadeAngle) * 36));
                  emitParticles(drone.x, drone.y, '#FDE047', 6, 120, 0.9);
                  break;
                }
              }
            }

            // Hunt leaked enemies closest to the Core across the entire map
            let huntTarget: TdEnemy | null = null;
            let bestLeakScore = -Infinity;
            for (const en of s.enemies) {
              if (en.hp <= 0 || en.koTimer > 0) continue;
              const distToDrone = Math.hypot(en.x - drone.x, en.y - drone.y);
              const leakScore = en.waypointIndex * 540 - distToDrone * 0.35 + (en.kind === 'boss' || en.kind === 'super_boss' ? 200 : 0);
              if (leakScore > bestLeakScore) {
                bestLeakScore = leakScore;
                huntTarget = en;
              }
            }

            const goalX = huntTarget ? huntTarget.x : coreFallbackPt.x - 42;
            const goalY = huntTarget ? huntTarget.y : coreFallbackPt.y - 24;
            const dx = goalX - drone.x;
            const dy = goalY - drone.y;
            const distToGoal = Math.hypot(dx, dy);

            let desiredAngle = Math.atan2(dy, dx);
            if (huntTarget && distToGoal < 84) {
              // Orbit smoothly around target while sniping
              desiredAngle += Math.PI * 0.46;
            }
            const steerRate = 7.4 * simDt;
            const angleDiff = Math.atan2(Math.sin(desiredAngle - drone.heading), Math.cos(desiredAngle - drone.heading));
            drone.heading += Math.max(-steerRate, Math.min(steerRate, angleDiff));
            drone.vx = Math.cos(drone.heading) * drone.speed;
            drone.vy = Math.sin(drone.heading) * drone.speed;
            drone.x = Math.max(14, Math.min(CANVAS_WIDTH - 14, drone.x + drone.vx * simDt));
            drone.y = Math.max(14, Math.min(CANVAS_HEIGHT - 14, drone.y + drone.vy * simDt));

            if (huntTarget && distToGoal <= 215 && drone.fireCooldown <= 0) {
              const parentGun = s.guns.find((g) => g.id === drone.sourceGunId);
              const parentProfile = parentGun
                ? getGunCombatProfile(parentGun.type, parentGun.level, parentGun.variant ?? 'alpha')
                : null;
              const shotA = Math.atan2(huntTarget.y - drone.y, huntTarget.x - drone.x);
              const isBoss = huntTarget.kind === 'boss' || huntTarget.kind === 'super_boss';
              const nextShotCount = (drone.shotCount ?? 0) + 1;
              drone.shotCount = nextShotCount;
              const launchMissileSalvo = nextShotCount % 3 === 0;
              const baseHitDmg = Math.round(drone.damage * (isBoss ? drone.bossMult : 1));
              const salvoDmg = launchMissileSalvo ? Math.round(baseHitDmg * 1.45) : baseHitDmg;

              s.projectiles.push({
                id: s.nextProjId++,
                kind: launchMissileSalvo ? 'missile' : 'bullet',
                sourceGunId: drone.sourceGunId,
                x: drone.x + Math.cos(shotA) * 10,
                y: drone.y + Math.sin(shotA) * 10,
                vx: Math.cos(shotA) * (launchMissileSalvo ? 440 : 720),
                vy: Math.sin(shotA) * (launchMissileSalvo ? 440 : 720),
                targetId: huntTarget.id,
                damage: salvoDmg,
                armorPierce: drone.armorPierce,
                shieldMult: drone.shieldMult,
                splashRadius: launchMissileSalvo ? (parentProfile?.splashRadius ?? 34) : 0,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 0.65,
                maxLife: 0.65,
                age: 0,
                speed: launchMissileSalvo ? 440 : 720,
                color: launchMissileSalvo ? '#FDE047' : drone.variant === 'omega' ? '#FACC15' : '#38BDF8',
                visualTier: drone.visualTier,
                isCrit: launchMissileSalvo,
                trail: [],
              });
              const baseCd = parentProfile
                ? parentProfile.cooldownSec * (drone.variant === 'alpha' ? 0.85 : 0.94)
                : drone.variant === 'alpha'
                  ? 0.4
                  : 0.45;
              drone.fireCooldown = Math.max(
                0.16,
                baseCd / (s.overdriveTimer > 0 ? OVERDRIVE_CONFIG.droneRateMult : 1)
              );
            }
            survivingDrones.push(drone);
          }
          s.carrierDrones = survivingDrones;
        }

        // 4e. Step Chronos Time-Dilation Spheres (time slow + true tick + damage echo collapse + track-safe rewind)
        if (s.chronoFields.length > 0) {
          const survivingFields: ChronoField[] = [];
          for (const field of s.chronoFields) {
            field.life -= simDt;
            const tickDmg = field.dps * simDt;
            for (const en of s.enemies) {
              if (en.hp <= 0 || en.koTimer > 0) continue;
              if (Math.hypot(en.x - field.x, en.y - field.y) <= field.radius + en.radius) {
                en.slowTimer = Math.max(en.slowTimer, 0.55);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - Math.min(0.45, field.slowPct));
                const res = applyDamageToEnemy(en, tickDmg, {
                  armorPierce: 1,
                  shieldMult: field.shieldMult,
                });
                recordDamageTelemetry(en, res.actualDamage, field.sourceGunId, 0.04, 0);
                if (res.killed) recordKill(en, field.sourceGunId);
              }
            }

            if (field.life <= 0) {
              const blastDmg = Math.max(Math.round(field.dps * 1.5), Math.round(field.recordedDamage));
              s.overheatEffects.push({
                kind: 'chrono_collapse',
                x: field.x,
                y: field.y,
                radius: field.radius * 1.15,
                angle: 0,
                life: 0.72,
                maxLife: 0.72,
                color: field.variant === 'omega' ? '#C084FC' : '#22D3EE',
              });
              emitParticles(field.x, field.y, '#67E8F9', 22, 180, 1.25);
              pushCombatText(
                field.x,
                field.y - 16,
                `⏳ SỤP ĐỔ! -${blastDmg}`,
                '#67E8F9',
                1.14
              );
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const d = Math.hypot(en.x - field.x, en.y - field.y);
                if (d <= field.radius * 1.15 + en.radius) {
                  if (field.level >= 5 && interruptEnemyWindup(en)) {
                    pushCombatText(en.x, en.y - 14, '⏳ TUA NGƯỢC NGẮT CHIÊU!', '#67E8F9', 1.06);
                  }
                  if (en.kind !== 'boss' && en.kind !== 'super_boss' && en.kind !== 'juggernaut') {
                    const backWp = s.map.path[Math.max(0, en.waypointIndex - 2)] ?? s.map.path[0];
                    const backPt = gridToWorldCenter(backWp.col, backWp.row);
                    pullEnemyAlongTrack(en, s.map, backPt.x, backPt.y, field.pullForce);
                  }
                  const res = applyDamageToEnemy(en, blastDmg, {
                    armorPierce: 1,
                    shieldMult: field.shieldMult,
                  });
                  recordDamageTelemetry(en, res.actualDamage, field.sourceGunId, 0.04, 0);
                  if (res.killed) recordKill(en, field.sourceGunId);
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
            } else {
              survivingFields.push(field);
            }
          }
          s.chronoFields = survivingFields;
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
          rb.alpha -= fxDt * 3.8;
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
        s.orbitalBeams = s.orbitalBeams.filter((bm) => {
          bm.alpha -= fxDt * 2.1;
          return bm.alpha > 0.04;
        });
        s.chronoSlashes = s.chronoSlashes.filter((cs) => {
          cs.alpha -= fxDt * 4.4;
          return cs.alpha > 0.04;
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
          const staticKey = `${s.map.id}:${dpr}`;
          if (!cachedStaticBg || cachedStaticKey !== staticKey) {
            const off = document.createElement('canvas');
            off.width = CANVAS_WIDTH * dpr;
            off.height = CANVAS_HEIGHT * dpr;
            const octx = off.getContext('2d');
            if (octx) {
              octx.setTransform(dpr, 0, 0, dpr, 0, 0);
              octx.fillStyle = palette.bg;
              octx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              for (let r = 0; r < s.map.rows; r++) {
                for (let c = 0; c < s.map.cols; c++) {
                  const x = c * TILE_SIZE;
                  const y = r * TILE_SIZE;
                  const kind = getTileKind(s.map, c, r);
                  if (kind === 'path' || kind === 'spawn' || kind === 'core') {
                    octx.fillStyle = palette.pathFill;
                    octx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                    octx.strokeStyle = palette.pathBorder;
                    octx.lineWidth = 1;
                    octx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                  } else if (kind === 'wall') {
                    octx.fillStyle = palette.wallFill;
                    octx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                    octx.strokeStyle = palette.wallStroke;
                    octx.lineWidth = 2;
                    octx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                    octx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
                    octx.beginPath();
                    octx.moveTo(x + 12, y + 12);
                    octx.lineTo(x + TILE_SIZE - 12, y + TILE_SIZE - 12);
                    octx.moveTo(x + TILE_SIZE - 12, y + 12);
                    octx.lineTo(x + 12, y + TILE_SIZE - 12);
                    octx.stroke();
                  } else {
                    octx.strokeStyle = palette.gridLine;
                    octx.lineWidth = 1;
                    octx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                    if (s.map.biome === 'prismatic_nexus' || s.map.biome === 'chrono_sanctum') {
                      // Championship / Chrono Sanctum geometric inlay markers on buildable high-ground tiles
                      octx.fillStyle =
                        s.map.biome === 'chrono_sanctum'
                          ? 'rgba(34, 211, 238, 0.22)'
                          : 'rgba(250, 204, 21, 0.22)';
                      octx.beginPath();
                      octx.moveTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2 - 4);
                      octx.lineTo(x + TILE_SIZE / 2 + 4, y + TILE_SIZE / 2);
                      octx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 4);
                      octx.lineTo(x + TILE_SIZE / 2 - 4, y + TILE_SIZE / 2);
                      octx.closePath();
                      octx.fill();
                    } else {
                      octx.fillStyle = palette.gridLine;
                      octx.beginPath();
                      octx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                      octx.fill();
                    }
                  }
                }
              }
              if (s.map.biome === 'prismatic_nexus' || s.map.biome === 'chrono_sanctum') {
                // Subtle golden/cyan sanctuary border frame
                octx.strokeStyle =
                  s.map.biome === 'chrono_sanctum'
                    ? 'rgba(34, 211, 238, 0.34)'
                    : 'rgba(250, 204, 21, 0.28)';
                octx.lineWidth = 3;
                octx.strokeRect(2, 2, CANVAS_WIDTH - 4, CANVAS_HEIGHT - 4);
              }
            }
            cachedStaticBg = off;
            cachedStaticKey = staticKey;
          }

          // 1-2. Blit Cached Tactical Floor, Grid, Walls & Track Tiles in 1 drawImage call
          if (cachedStaticBg) {
            ctx.drawImage(cachedStaticBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          }

          // 3. Animated Path Track Glow + Conductive Wet Zones
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

          // 3b. Environmental Conductive Water Puddles (boosts Tesla & Tempest electric arcs)
          for (const wz of s.map.wetZones) {
            const wPt = gridToWorldCenter(wz.col, wz.row);
            ctx.save();
            const poolGrad = ctx.createRadialGradient(wPt.x, wPt.y, 4, wPt.x, wPt.y, TILE_SIZE * 0.44);
            poolGrad.addColorStop(0, 'rgba(56, 189, 248, 0.42)');
            poolGrad.addColorStop(0.65, 'rgba(6, 182, 212, 0.24)');
            poolGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
            ctx.fillStyle = poolGrad;
            ctx.beginPath();
            ctx.arc(wPt.x, wPt.y, TILE_SIZE * 0.44, 0, Math.PI * 2);
            ctx.fill();

            const ripple = ((s.visualTime * 0.65 + (wz.col + wz.row) * 0.23) % 1);
            ctx.globalAlpha = (1 - ripple) * 0.45;
            ctx.strokeStyle = '#67E8F9';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(wPt.x, wPt.y, 6 + ripple * (TILE_SIZE * 0.34), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

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

          // 5c. Ground Scorch / Frost / Plasma Craters & Overheat Signature Effects (adaptive combat glare damping)
          const vfxDamp = computeCombatVisualDamping({
            activeBeams: s.railBeams.length + s.lightningArcs.length,
            activeProjectiles: s.projectiles.length,
            activeFlashes: s.muzzleFlashes.length + s.impactFlashes.length,
            speedMult: s.speedMult,
            isCompactViewport: isCompactViewportRef.current,
          });
          drawGroundCraters(ctx, s.groundCraters);
          drawOrbitalBeamsAndZones(ctx, s.orbitalZones, [], s.animTime, vfxDamp.effectAlphaScale);
          drawSingularityHoles(ctx, s.blackHoles, s.animTime, vfxDamp.effectAlphaScale);
          drawChronoFieldsAndSlashes(
            ctx,
            s.chronoFields,
            s.chronoSlashes,
            s.animTime,
            vfxDamp.effectAlphaScale
          );
          drawOverheatSpecialFx(ctx, s.overheatEffects, s.animTime, vfxDamp.effectAlphaScale);

          // 6. Shockwaves (ultra-faint hairline pulse for non-combat UI/status cues only)
          for (const sw of s.shockwaves) {
            ctx.save();
            ctx.globalAlpha = sw.alpha * 0.16 * vfxDamp.effectAlphaScale;
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
            ctx.globalAlpha = hr.alpha * 0.55 * vfxDamp.effectAlphaScale;
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
            ctx.globalAlpha = fade * 0.86 * vfxDamp.effectAlphaScale;
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
            drawRailBeamEnhanced(ctx, rb, s.animTime, vfxDamp.beamAlphaScale);
          }

          for (const fc of s.flameCones) {
            const fTier = fc.visualTier;
            ctx.save();
            ctx.translate(fc.x, fc.y);
            if (fc.isNova360) {
              // Lv10 360° Swirling Blue-White Plasma Nova Petals
              ctx.globalAlpha = fc.alpha * 0.44 * vfxDamp.effectAlphaScale;
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
            ctx.globalAlpha = fc.alpha * 0.52 * vfxDamp.effectAlphaScale;
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

            ctx.globalAlpha = fc.alpha * 0.78 * vfxDamp.effectAlphaScale;
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
            ctx.globalAlpha = hb.alpha * vfxDamp.beamAlphaScale;
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
            ctx.globalAlpha = sup.id === s.selectedGunId ? 0.36 : 0.11;
            ctx.lineWidth = sup.id === s.selectedGunId ? 1.8 : 1;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(sPt.x, sPt.y, sProfile.rangePx, 0, Math.PI * 2);
            ctx.stroke();
            for (const ally of s.guns) {
              if (ally.id === sup.id) continue;
              const aPt = gridToWorldCenter(ally.col, ally.row);
              if (Math.hypot(aPt.x - sPt.x, aPt.y - sPt.y) <= sProfile.rangePx + 4) {
                ctx.globalAlpha = sup.id === s.selectedGunId ? 0.52 : 0.24;
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
              const effectiveRangePx =
                profile.rangePx + Math.round(teamBuff.rangeBonusTiles * TILE_SIZE);
              const halfTile = TILE_SIZE / 2;
              const pad = 2;
              const cornerLen = 11;

              // Clear translucent firing range coverage + crisp perimeter ring
              ctx.fillStyle = 'rgba(251, 191, 36, 0.08)';
              ctx.beginPath();
              ctx.arc(0, 0, effectiveRangePx, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = 'rgba(251, 191, 36, 0.68)';
              ctx.lineWidth = 2;
              ctx.setLineDash([7, 5]);
              ctx.beginPath();
              ctx.arc(0, 0, effectiveRangePx, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              // Bright selected-tile highlight plate & glowing tactical corner brackets
              ctx.fillStyle = 'rgba(251, 191, 36, 0.16)';
              ctx.strokeStyle = 'rgba(253, 224, 71, 0.78)';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.roundRect(-halfTile + pad, -halfTile + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2, 7);
              ctx.fill();
              ctx.stroke();

              ctx.strokeStyle = '#FEF08A';
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              const bx = halfTile - 1;
              ctx.beginPath();
              // Top-left
              ctx.moveTo(-bx, -bx + cornerLen);
              ctx.lineTo(-bx, -bx);
              ctx.lineTo(-bx + cornerLen, -bx);
              // Top-right
              ctx.moveTo(bx - cornerLen, -bx);
              ctx.lineTo(bx, -bx);
              ctx.lineTo(bx, -bx + cornerLen);
              // Bottom-right
              ctx.moveTo(bx, bx - cornerLen);
              ctx.lineTo(bx, bx);
              ctx.lineTo(bx - cornerLen, bx);
              // Bottom-left
              ctx.moveTo(-bx + cornerLen, bx);
              ctx.lineTo(-bx, bx);
              ctx.lineTo(-bx, bx - cornerLen);
              ctx.stroke();

              // Inner rotating selection reticle
              ctx.save();
              ctx.rotate(s.visualTime * 1.4);
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 4]);
              ctx.beginPath();
              ctx.arc(0, 0, 29, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
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
          drawCarrierDrones(ctx, s.carrierDrones, s.animTime);
          drawOrbitalBeamsAndZones(ctx, [], s.orbitalBeams, s.animTime, vfxDamp.beamAlphaScale);

          // 11. Muzzle Flashes & Starburst Impact Blooms (damped during dense barrages to keep grid sharp)
          for (const mf of s.muzzleFlashes) {
            ctx.save();
            ctx.globalAlpha = mf.alpha * vfxDamp.flashAlphaScale;
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
            ctx.globalAlpha = im.alpha * 0.8 * vfxDamp.flashAlphaScale;
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

          // 12. Chain Lightning (enhanced multi-segment electric arcs & forked wet-synergy branches)
          for (const arc of s.lightningArcs) {
            drawLightningArcEnhanced(ctx, arc, s.animTime, vfxDamp.beamAlphaScale);
          }

          // 13. Particles
          for (const p of s.particles) {
            if (!p.active) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * Math.max(0.48, vfxDamp.effectAlphaScale);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 14. Floating Combat Text (capped density for crystal-clear combat readability)
          for (const ft of s.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha * Math.max(0.72, vfxDamp.beamAlphaScale);
            ctx.font = `bold ${Math.round(11 * ft.scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#070B14';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }

          // 15. Overdrive ("Hội Tụ Hỏa Lực") Epic Screen Perimeter Aura
          if (s.overdriveTimer > 0) {
            const pulse = 0.55 + Math.sin(s.animTime * 9) * 0.25;
            ctx.save();
            ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
            ctx.lineWidth = 4;
            ctx.strokeRect(3, 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - 6);
            ctx.strokeStyle = `rgba(244, 63, 94, ${pulse * 0.85})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(7, 7, CANVAS_WIDTH - 14, CANVAS_HEIGHT - 14);
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
            ? 'overflow-hidden rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] shadow-[0_20px_50px_-24px_rgba(56,189,248,0.22)] mobile-ls:h-[calc(100dvh-56px)] mobile-ls:flex mobile-ls:flex-col'
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
                    4 Cấp · 8 Chế Độ · {PRISM_MAPS.length} Màn 16×10 · {GUN_CATALOG.length} Súng (12 Công · 2 Điện · 3 Thuần Hỗ Trợ)
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

              {/* Map Selection (16 Biome Maps 16x10 + Conductive Water Zones & Tactical Hint) */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Chiến Trường 16×10 ({PRISM_MAPS.length} Màn · Đường Đi Liền Mạch & Vùng Nước Dẫn Điện)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PRISM_MAPS.map((m, idx) => {
                    const active = idx === selectedMapIndex;
                    const isMap18 = m.id === 'sector-18';
                    const isSpecialMap = m.id === 'sector-17' || isMap18;
                    const accent = BIOME_PALETTES[m.biome].accent;
                    const mapDiffCfg = DIFFICULTY_CONFIGS[m.recommendedDifficulty];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        data-testid={`td-map-${m.id}`}
                        onClick={() => setSelectedMapIndex(idx)}
                        className={`min-h-[54px] p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          isSpecialMap ? 'col-span-2 sm:col-span-2 px-3 py-2.5' : ''
                        } ${
                          active
                            ? isMap18
                              ? 'border-cyan-300 bg-cyan-950/50 text-white'
                              : 'border-amber-400 bg-amber-950/40 text-white'
                            : isMap18
                              ? 'border-cyan-400/60 bg-gradient-to-r from-cyan-950/40 via-[#081524] to-violet-950/35 text-cyan-50 hover:border-cyan-300'
                              : isSpecialMap
                                ? 'border-amber-400/60 bg-gradient-to-r from-amber-950/35 via-[#171209] to-cyan-950/25 text-amber-50 hover:border-amber-300'
                                : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {isSpecialMap ? (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                    isMap18
                                      ? 'bg-cyan-400/20 border-cyan-400/40'
                                      : 'bg-amber-400/20 border-amber-400/40'
                                  }`}
                                  style={{ color: mapDiffCfg.badgeColor }}
                                >
                                  {m.difficultyLabel}
                                </span>
                                <span
                                  className={`text-xs sm:text-[13px] font-extrabold ${
                                    isMap18 ? 'text-cyan-200' : 'text-amber-200'
                                  }`}
                                >
                                  {m.name}
                                </span>
                              </div>
                              <p className="text-[10px] font-mono text-cyan-300/90 mt-1">
                                {isMap18
                                  ? `≈ ${m.wetZones.length} mạch nước · Khởi đầu ${m.startEnergy}⚡ (đặt Pháo Thời Không 800⚡)`
                                  : `≈ ${m.wetZones.length} vùng nước · Khởi đầu ${m.startEnergy}⚡ (đặt Siêu Tân Tinh 500⚡)`}
                              </p>
                            </div>
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: accent }}
                              aria-hidden="true"
                            />
                          </div>
                        ) : (
                          <>
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
                            <div className="text-[9px] font-mono text-cyan-300/90 truncate mt-0.5">
                              ≈ {m.wetZones.length} vùng nước dẫn điện
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-lg border border-cyan-400/25 bg-[#0B1222] px-2.5 py-1.5 space-y-0.5">
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-white">{activeMap.name}:</strong> {activeMap.subtitle}
                  </p>
                  <p className="text-[11px] font-mono text-cyan-300 leading-snug">
                    ⚡ {activeMap.tacticalHint}
                  </p>
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
                  Kho <strong className="text-amber-300">{GUN_CATALOG.length} súng tinh gọn</strong> (12 Tấn Công · 2 Hệ Điện · 3 Thuần Hỗ Trợ) · Biến thể <strong className="text-cyan-300">α / ω</strong> · <strong className="text-rose-300">Siêu Boss</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3 mobile-ls:pt-2 mobile-ls:text-[10px] text-center">
            1-7, Z, X, C, V, B Súng Công · 8-9 Hệ Điện · 0, Q, E Thuần Hỗ Trợ · U nâng cấp · R α/ω · T mục tiêu · Space Hỏa Lực
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
          {/* Portrait Mobile Rotate / Fullscreen / PWA Guidance Banner */}
          {isPortraitMobile && !portraitHintDismissed && (
            <div
              data-testid="td-portrait-guide"
              className="shrink-0 border-b border-sky-500/35 bg-sky-950/60 px-3 py-2 flex flex-col gap-2 safe-area-x"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <Smartphone className="w-4 h-4 text-sky-300 rotate-90 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-sky-100 leading-snug">
                    <strong className="text-white">Xoay ngang điện thoại</strong> để bản đồ rộng ~75% và thao tác chọn/nâng tháp thoải mái hơn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPortraitHintDismissed(true)}
                  aria-label="Ẩn gợi ý xoay ngang"
                  className="min-w-[36px] min-h-[36px] rounded-lg border border-slate-700 bg-slate-900/90 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {onToggleFullscreen && !isFullscreen && (
                  <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className="flex-1 min-h-[40px] px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-[#070B14] font-mono font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Chơi Toàn Màn</span>
                  </button>
                )}
                <PwaInstallButton compact className="flex-1 min-h-[40px] px-3 text-xs" />
              </div>
            </div>
          )}

          {/* Top Unified 1-Row HUD Strip: Compact Tabular Metrics Left · Separated 40-44px Action Controls Right */}
          <div className="shrink-0 border-b border-slate-800 bg-[#0B1222] px-2.5 sm:px-4 mobile-ls:px-2 py-1.5 mobile-ls:py-1 flex flex-wrap mobile-ls:flex-nowrap items-center justify-between gap-2 mobile-ls:gap-1.5 safe-area-x">
            {/* Compact 1-Row Core Stats (Wave · Energy · DPS · Core) with crisp tabular-nums */}
            <div className="flex items-center gap-2.5 sm:gap-4 mobile-ls:gap-2.5 tabular-nums min-w-0 overflow-x-auto no-scrollbar">
              <span
                data-testid="td-hud-difficulty"
                className="hidden xl:inline-block text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap shrink-0"
                style={{ color: DIFFICULTY_CONFIGS[hud.difficulty].badgeColor }}
              >
                {DIFFICULTY_CONFIGS[hud.difficulty].shortLabel} · {GAME_MODE_CONFIGS[hud.gameMode].shortLabel}
              </span>

              <div className="flex items-center gap-1 shrink-0" data-testid="td-stat-wave">
                <span className="text-[10px] font-mono uppercase text-slate-400">Đợt</span>
                <span className="text-sm sm:text-base mobile-ls:text-sm font-bold text-cyan-300 leading-none">
                  {hud.wave}/{hud.gameMode === 'endless' ? '∞' : hud.totalWaves}
                </span>
              </div>

              <span className="text-slate-700 select-none" aria-hidden="true">·</span>

              <div className="flex items-center gap-1 shrink-0" data-testid="td-stat-energy">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base mobile-ls:text-sm font-bold text-amber-300 leading-none">
                  {hud.energy}
                </span>
              </div>

              <span className="text-slate-700 select-none" aria-hidden="true">·</span>

              <div className="flex items-center gap-1 shrink-0" data-testid="td-stat-dps">
                <span className="text-[10px] font-mono uppercase text-slate-400">DPS</span>
                <span className="text-sm sm:text-base mobile-ls:text-sm font-bold text-sky-300 leading-none">
                  {hud.totalDps}
                </span>
              </div>

              <span className="text-slate-700 select-none" aria-hidden="true">·</span>

              <div className="flex items-center gap-1 shrink-0" data-testid="td-stat-core">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base mobile-ls:text-sm font-bold text-white leading-none">
                  {hud.coreHp}/{hud.maxCoreHp}
                </span>
              </div>

              <div className="hidden xl:flex items-center gap-1 shrink-0">
                <span className="text-slate-700 select-none" aria-hidden="true">·</span>
                <span className="text-[10px] font-mono uppercase text-slate-400">Điểm</span>
                <span className="text-sm font-bold text-white leading-none">{hud.score}</span>
              </div>
            </div>

            {/* Dedicated Separated Action Controls Cluster (min 40px-44px touch targets) */}
            <div className="flex flex-wrap mobile-ls:flex-nowrap items-center gap-1 sm:gap-1.5 max-w-full shrink-0">
              <button
                type="button"
                data-testid="td-overdrive-btn"
                onClick={activateOverdrive}
                disabled={hud.overdrivePct < 100 || hud.overdriveActive}
                title="Hội Tụ Hỏa Lực ×2.71 (tích chậm ×5 · bùng nổ Quá Nhiệt 2 đợt + Thiên Phạt toàn bản đồ) (Space)"
                className={`min-h-[40px] px-2 sm:px-3 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  hud.overdriveActive
                    ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 border-amber-300 text-white shadow-[0_0_16px_rgba(251,191,36,0.55)]'
                    : hud.overdrivePct >= 100
                      ? 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-[#070B14] shadow-[0_0_12px_rgba(251,191,36,0.45)]'
                      : 'bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {hud.overdriveActive ? 'HỎA LỰC ×2.7!' : `Hỏa Lực ${hud.overdrivePct}%`}
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
                className={`min-h-[40px] min-w-[44px] px-2 sm:px-2.5 rounded-lg border text-xs font-mono font-bold inline-flex items-center justify-center gap-1 cursor-pointer touch-manipulation select-none whitespace-nowrap shrink-0 tabular-nums ${
                  hud.speedMult === 3
                    ? 'bg-amber-400 text-[#070B14] border-amber-300'
                    : hud.speedMult === 2
                      ? 'bg-cyan-500 text-[#070B14] border-cyan-400'
                      : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <FastForward className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
                className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer shrink-0"
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
                aria-label={gameState === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer shrink-0"
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
                className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {isFullscreen && onExitFullscreen ? (
                <button
                  type="button"
                  data-testid="hub-exit-fullscreen-btn"
                  onClick={onExitFullscreen}
                  aria-label="Thoát toàn màn hình (Esc)"
                  className="min-h-[40px] px-2.5 rounded-lg border border-sky-400/60 bg-sky-950/80 hover:bg-sky-900 text-sky-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Thoát</span>
                </button>
              ) : onToggleFullscreen ? (
                <button
                  type="button"
                  data-testid="td-fullscreen-btn"
                  onClick={onToggleFullscreen}
                  aria-label="Chơi toàn màn hình"
                  title="Chơi toàn màn hình (F11)"
                  className="min-w-[40px] min-h-[40px] px-2 rounded-lg border border-sky-500/45 bg-sky-950/60 hover:border-sky-400 text-sky-300 flex items-center justify-center cursor-pointer shrink-0"
                >
                  <Maximize2 className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          {/* Main Theater Area: Mobile Landscape gives 73%-75% width to Map & 25%-27% to Tabbed Collapsible Dock */}
          <div
            data-testid="td-theater-grid"
            className={
              useSidebarTheater
                ? sidebarCollapsed
                  ? 'flex-1 min-h-0 flex flex-col mobile-ls:grid mobile-ls:grid-cols-[minmax(0,1fr)_52px] lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_396px]'
                  : 'flex-1 min-h-0 flex flex-col mobile-ls:grid mobile-ls:grid-cols-[minmax(0,1fr)_clamp(212px,27vw,252px)] lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_396px]'
                : ''
            }
          >
            {/* Arena Canvas (Responsive 16:10, maximized area) */}
            <div
              data-testid="td-map-pane"
              className={`p-1 sm:p-1.5 bg-[#050811] ${
                useSidebarTheater ? 'min-w-0 min-h-0 flex-1 flex items-center justify-center lg:p-2 mobile-ls:p-1' : ''
              }`}
            >
              <div
                className={
                  useSidebarTheater
                    ? isFullscreen
                      ? 'w-full mx-auto max-w-[min(100%,calc((100dvh-260px)*1.6))] mobile-ls:max-w-[min(100%,calc((100dvh-60px)*1.6))] lg:max-w-[min(100%,calc((100dvh-76px)*1.6))]'
                      : 'w-full mx-auto max-w-[940px] mobile-ls:max-w-[min(100%,calc((100dvh-116px)*1.6))]'
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

            {/* Collapsible Narrow Rail (Mobile Landscape Only when Collapsed -> gives Map ~94% Width) */}
            {useSidebarTheater && sidebarCollapsed && isCompactTheater ? (
              <div
                data-testid="td-sidebar-collapsed"
                className="hidden mobile-ls:flex flex-col items-center justify-between py-1.5 px-1 border-l border-slate-800 bg-[#0B1222] gap-2"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="td-expand-sidebar-btn"
                    onClick={() => setSidebarCollapsed(false)}
                    aria-label="Mở kho súng và chi tiết tháp"
                    title="Mở bảng điều khiển"
                    className="min-w-[42px] min-h-[42px] rounded-xl border border-sky-400/50 bg-sky-950/70 text-sky-200 flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarTab('arsenal');
                      setSidebarCollapsed(false);
                    }}
                    className="min-w-[42px] min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 text-[10px] font-mono font-bold text-amber-300 flex items-center justify-center cursor-pointer"
                  >
                    Kho
                  </button>
                  {selectedGun && (
                    <button
                      type="button"
                      onClick={() => {
                        setSidebarTab('inspector');
                        setSidebarCollapsed(false);
                      }}
                      className="min-w-[42px] min-h-[40px] rounded-lg border border-amber-400/70 bg-amber-950/60 text-[10px] font-mono font-bold text-amber-200 flex items-center justify-center cursor-pointer"
                    >
                      Lv{selectedGun.level}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  data-testid="prism-wave-btn"
                  onClick={launchNextWave}
                  disabled={hud.waveActive || (hud.gameMode !== 'endless' && hud.wave >= hud.totalWaves)}
                  aria-label="Gọi đợt quái sớm"
                  className={`min-w-[42px] min-h-[44px] rounded-xl font-bold flex items-center justify-center cursor-pointer ${
                    hud.waveActive
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-[#070B14]'
                  }`}
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* 24-Gun Arsenal Dock & Tactical Command Sidebar (Tabbed on Sidebar Theater: Kho | Chi tiết) */
              <div
                data-testid="td-control-pane"
                className={`border-t border-slate-800 bg-[#0B1222] safe-area-bottom ${
                  useSidebarTheater
                    ? 'mobile-ls:border-t-0 mobile-ls:border-l lg:border-t-0 lg:border-l flex flex-col min-h-0 mobile-ls:max-h-full'
                    : 'px-2.5 sm:px-4 py-2.5 space-y-2.5'
                }`}
              >
                {/* Dock Header: Mode Tabs (Kho / Chi tiết) + Collapse Toggle in Sidebar Theater */}
                {useSidebarTheater ? (
                  <div className="shrink-0 px-2 py-1.5 border-b border-slate-800/90 flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 flex-1 min-w-0" role="tablist" aria-label="Chuyển bảng Kho súng và Chi tiết tháp">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={sidebarTab === 'arsenal'}
                        data-testid="td-tab-arsenal"
                        onClick={() => setSidebarTab('arsenal')}
                        className={`flex-1 min-h-[40px] px-2 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          sidebarTab === 'arsenal'
                            ? 'bg-amber-400/15 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
                        }`}
                      >
                        Kho ({availableGuns.length})
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={sidebarTab === 'inspector'}
                        data-testid="td-tab-inspector"
                        onClick={() => setSidebarTab('inspector')}
                        className={`flex-1 min-h-[40px] px-2 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          sidebarTab === 'inspector'
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                            : selectedGun
                              ? 'bg-slate-900 border-amber-400/50 text-amber-200 hover:border-amber-300'
                              : 'bg-slate-900 border-slate-700/80 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {selectedGun ? `Tháp Lv${selectedGun.level}` : 'Chi tiết'}
                      </button>
                    </div>
                    {isCompactTheater && (
                      <button
                        type="button"
                        data-testid="td-collapse-sidebar-btn"
                        onClick={() => setSidebarCollapsed(true)}
                        aria-label="Thu gọn bảng điều khiển để mở rộng bản đồ"
                        title="Thu gọn bảng điều khiển"
                        className="min-w-[40px] min-h-[40px] rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono uppercase tracking-[0.08em] text-slate-400">
                      Kho {availableGuns.length} Súng (12 Công · 2 Điện · 3 Thuần Hỗ Trợ)
                    </span>
                    <div className="flex items-center gap-1.5" role="group" aria-label="Biến thể mặc định khi đặt súng">
                      <button
                        type="button"
                        onClick={() => setSelectedVariant('alpha')}
                        className={`min-h-[40px] px-3 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          selectedVariant === 'alpha'
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        α Alpha · Tốc/Đa Tia
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedVariant('omega')}
                        className={`min-h-[40px] px-3 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          selectedVariant === 'omega'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        ω Omega · Sát Thương
                      </button>
                    </div>
                  </div>
                )}

                {/* Scrollable Middle: Tabbed Content in Sidebar Theater, Stacked in Standard Mode */}
                <div
                  ref={sidebarScrollRef}
                  className={useSidebarTheater ? 'flex-1 min-h-0 overflow-y-auto p-2 mobile-ls:p-1.5 space-y-2' : 'space-y-2.5'}
                >
                  {/* SELECTED GUN INSPECTOR (Dedicated Tab in Sidebar Theater) */}
                  {useSidebarTheater && sidebarTab === 'inspector' && (
                    selectedGun && selectedProfile && selectedSpec ? (
                      <div
                        data-testid="td-gun-inspector"
                        className="rounded-xl border bg-gradient-to-br from-slate-900/95 via-[#0E1729] to-slate-950 p-2.5 space-y-2.5 mobile-ls:p-2 mobile-ls:space-y-1.5 transition-all"
                        style={{ borderColor: `${selectedProfile.accentColor}88` }}
                      >
                        {/* Clear Selected Tower Title + Level */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="min-w-0">
                            <h3 className="text-sm mobile-ls:text-xs font-bold text-white leading-tight truncate">
                              {selectedSpec.name}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate mobile-ls:hidden">
                              {selectedProfile.tierLabel} · {selectedProfile.variantSpec.shortTag}
                            </p>
                          </div>
                          <span
                            data-testid="td-gun-level-badge"
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 tabular-nums ${
                              selectedGun.level === MAX_GUN_LEVEL
                                ? 'bg-amber-400 text-[#070B14]'
                                : selectedGun.level >= 7
                                  ? 'bg-rose-500/25 border border-rose-400/50 text-rose-200'
                                  : selectedGun.level >= 4
                                    ? 'bg-sky-500/25 border border-sky-400/50 text-sky-200'
                                    : 'bg-slate-800 text-slate-200'
                            }`}
                          >
                            Lv.{selectedGun.level}/{MAX_GUN_LEVEL}
                          </span>
                        </div>

                        {/* Structured 4-Cell Core Stat Strip (DMG · DPS · Tầm · Buff) */}
                        <div className="grid grid-cols-2 gap-1.5 mobile-ls:gap-1 font-mono tabular-nums">
                          <div className="rounded-lg bg-[#080E1C] border border-slate-800/90 px-2 py-1 mobile-ls:px-1.5 mobile-ls:py-0.5 mobile-ls:flex mobile-ls:items-baseline mobile-ls:justify-between mobile-ls:gap-1">
                            <div className="text-[9px] text-slate-400 uppercase shrink-0">DMG</div>
                            <div className="text-xs font-bold text-white leading-tight truncate">
                              {isSupportGunType(selectedGun.type) ? (
                                <span className="text-emerald-300">0 (Hỗ Trợ)</span>
                              ) : (
                                <>
                                  {selectedProfile.damage}
                                  {selectedNextProfile && selectedNextProfile.damage > selectedProfile.damage && (
                                    <span className="text-[10px] text-emerald-400 ml-0.5">
                                      +{selectedNextProfile.damage - selectedProfile.damage}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="rounded-lg bg-[#080E1C] border border-slate-800/90 px-2 py-1 mobile-ls:px-1.5 mobile-ls:py-0.5 mobile-ls:flex mobile-ls:items-baseline mobile-ls:justify-between mobile-ls:gap-1">
                            <div className="text-[9px] text-slate-400 uppercase shrink-0">
                              {isSupportGunType(selectedGun.type) ? 'Hiệu Ứng' : 'DPS'}
                            </div>
                            <div className="text-xs font-bold text-sky-300 leading-tight truncate">
                              {isSupportGunType(selectedGun.type) ? (
                                selectedGun.type === 'cryo'
                                  ? `Chậm ${Math.round(selectedProfile.slowPct * 100)}%`
                                  : selectedGun.type === 'radar'
                                    ? `Yếu +${Math.round(selectedProfile.brittleBonus * 100)}%`
                                    : 'Chí Mạng'
                              ) : (
                                <>
                                  {selectedProfile.dpsEstimate}
                                  {selectedNextProfile && selectedNextProfile.dpsEstimate > selectedProfile.dpsEstimate && (
                                    <span className="text-[10px] text-emerald-400 ml-0.5">
                                      +{selectedNextProfile.dpsEstimate - selectedProfile.dpsEstimate}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="rounded-lg bg-[#080E1C] border border-slate-800/90 px-2 py-1 mobile-ls:px-1.5 mobile-ls:py-0.5 mobile-ls:flex mobile-ls:items-baseline mobile-ls:justify-between mobile-ls:gap-1">
                            <div className="text-[9px] text-slate-400 uppercase shrink-0">Tầm</div>
                            <div className="text-xs font-bold text-cyan-300 leading-tight">
                              {Number((selectedProfile.rangeTiles + (selectedTeamBuff?.rangeBonusTiles ?? 0)).toFixed(1))}ô
                            </div>
                          </div>
                          <div className="rounded-lg bg-[#080E1C] border border-slate-800/90 px-2 py-1 mobile-ls:px-1.5 mobile-ls:py-0.5 mobile-ls:flex mobile-ls:items-baseline mobile-ls:justify-between mobile-ls:gap-1">
                            <div className="text-[9px] text-slate-400 uppercase shrink-0">
                              {isSupportGunType(selectedGun.type) ? 'Vai Trò' : 'Buff'}
                            </div>
                            <div className="text-xs font-bold leading-tight truncate">
                              {isSupportGunType(selectedGun.type) ? (
                                <span className="text-emerald-300">
                                  {selectedTeamBuff && selectedTeamBuff.rangeBonusTiles > 0
                                    ? `+${selectedTeamBuff.rangeBonusTiles}ô Tầm`
                                    : 'Thuần Hỗ Trợ'}
                                </span>
                              ) : selectedTeamBuff?.hasSupportLink ? (
                                <span className="text-emerald-300">
                                  {selectedTeamBuff.critChance > 0
                                    ? `${Math.round(selectedTeamBuff.critChance * 100)}% Crit`
                                    : selectedTeamBuff.damageMult > 1
                                      ? `+${Math.round((selectedTeamBuff.damageMult - 1) * 100)}% DMG`
                                      : `+${selectedTeamBuff.rangeBonusTiles}ô Tầm`}
                                </span>
                              ) : (
                                <span className="text-amber-300">{selectedGun.kills} hạ</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Large Primary Touch Action Buttons (immediately visible above fold on 390px landscape, min-h 44px) */}
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            data-testid="td-upgrade-btn"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              upgradeSelectedGun();
                            }}
                            disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                            className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors tabular-nums ${
                              selectedUpgradeCost === null
                                ? 'bg-amber-400/20 border border-amber-400 text-amber-300 cursor-default'
                                : hud.energy >= selectedUpgradeCost
                                  ? 'bg-amber-400 text-[#070B14] hover:bg-amber-300'
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {selectedUpgradeCost === null
                              ? 'ĐÃ ĐẠT MAX LV.10'
                              : `Nâng Cấp Lv.${selectedGun.level + 1} (${selectedUpgradeCost}⚡)`}
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                cycleSelectedPriority();
                              }}
                              className="min-h-[42px] px-2 rounded-xl border border-slate-700 bg-slate-800 hover:border-cyan-400 text-cyan-200 text-xs font-mono cursor-pointer truncate"
                            >
                              {PRIORITY_LABELS[selectedGun.priority]}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.currentTarget.blur();
                                sellSelectedGun();
                              }}
                              aria-label="Thu hồi trụ súng"
                              className="min-h-[42px] px-2 rounded-xl border border-rose-500/35 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 text-xs font-mono font-bold inline-flex items-center justify-center gap-1 cursor-pointer tabular-nums"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Bán +{selectedSellRefund}⚡</span>
                            </button>
                          </div>
                        </div>

                        {selectedTeamBuff?.hasSupportLink &&
                          (!isSupportGunType(selectedGun.type) || selectedTeamBuff.rangeBonusTiles > 0) && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-2 py-1.5">
                              <span className="font-bold">BUFF:</span>
                              {isSupportGunType(selectedGun.type) ? (
                                <span>+{selectedTeamBuff.rangeBonusTiles}ô Tầm Aura</span>
                              ) : (
                                <>
                                  {selectedTeamBuff.damageMult > 1 && <span>+{Math.round((selectedTeamBuff.damageMult - 1) * 100)}% DMG</span>}
                                  {selectedTeamBuff.critChance > 0 && (
                                    <span>
                                      +{Math.round(selectedTeamBuff.critChance * 100)}% Chí Mạng (×{selectedTeamBuff.critMult})
                                    </span>
                                  )}
                                  {selectedTeamBuff.rangeBonusTiles > 0 && <span>+{selectedTeamBuff.rangeBonusTiles}ô Tầm</span>}
                                  {selectedTeamBuff.armorPierceBonus > 0 && <span>+{Math.round(selectedTeamBuff.armorPierceBonus * 100)}% Giáp</span>}
                                  {selectedTeamBuff.shieldMultBonus > 0 && <span>+{Math.round(selectedTeamBuff.shieldMultBonus * 100)}% Khiên</span>}
                                </>
                              )}
                            </div>
                          )}

                        {/* 10-Step Level Progress + Overheat Gauge */}
                        <div className="space-y-1.5">
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

                          <div className="rounded-lg border border-slate-800 bg-[#080E1C] px-2 py-1.5 space-y-1">
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
                        </div>

                        {/* α / ω Variant Switcher (min-h 42px) */}
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
                                className={`min-h-[42px] px-2 py-1.5 rounded-lg border text-left transition-colors cursor-pointer ${
                                  active ? 'bg-slate-800/95 text-white' : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-600'
                                }`}
                                style={active ? { borderColor: vSpec.accentColor } : undefined}
                              >
                                <div className="text-[11px] font-bold truncate" style={{ color: active ? vSpec.accentColor : undefined }}>
                                  {vSpec.shortTag}
                                </div>
                                <p className="text-[9px] text-slate-400 leading-tight line-clamp-2">{vSpec.summary}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-700/80 bg-[#080E1C] p-4 text-center space-y-2">
                        <p className="text-xs font-semibold text-slate-200">Chưa chọn tháp trên bản đồ</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Chạm vào một tháp đã đặt trên lưới để xem DMG, DPS, Tầm bắn và nâng cấp Lv1→Lv10.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSidebarTab('arsenal')}
                          className="min-h-[42px] px-4 rounded-xl bg-amber-400 text-[#070B14] font-bold text-xs cursor-pointer"
                        >
                          Mở Kho Súng
                        </button>
                      </div>
                    )
                  )}

                  {/* ARSENAL TAB (Visible on Sidebar Theater when 'arsenal' active, or always in Standard Mode) */}
                  {(!useSidebarTheater || sidebarTab === 'arsenal') && (
                    <>
                      {useSidebarTheater && (
                        <div className="space-y-1.5">
                          {/* Quick Category Filter + α/ω Selector */}
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            {(
                              [
                                { id: 'all', label: 'Tất cả' },
                                { id: 'attack', label: 'Tấn công' },
                                { id: 'electric', label: 'Hệ Điện' },
                                { id: 'support', label: 'Hỗ trợ' },
                              ] as const
                            ).map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setArsenalFilter(f.id)}
                                className={`min-h-[36px] px-2.5 rounded-lg border text-[11px] font-mono font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                                  arsenalFilter === f.id
                                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                                    : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Biến thể mặc định khi đặt súng">
                            <button
                              type="button"
                              onClick={() => setSelectedVariant('alpha')}
                              className={`min-h-[38px] px-2 rounded-lg border text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                selectedVariant === 'alpha'
                                  ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              α Alpha
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedVariant('omega')}
                              className={`min-h-[38px] px-2 rounded-lg border text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                selectedVariant === 'omega'
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              ω Omega
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 16-Gun Arsenal Grid (4 symmetrical rows of 4 on desktop) */}
                      <div
                        className={
                          useSidebarTheater
                            ? 'flex flex-nowrap overflow-x-auto gap-1.5 pb-1 mobile-ls:grid mobile-ls:grid-cols-2 mobile-ls:overflow-visible mobile-ls:pb-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0'
                            : 'flex flex-nowrap overflow-x-auto gap-1.5 pb-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0'
                        }
                      >
                        {(useSidebarTheater ? filteredArsenalGuns : availableGuns).map((item) => {
                          const isActive = selectedTool === item.type;
                          const canAfford = hud.energy >= item.cost;
                          const isElectric = isElectricGunType(item.type);
                          const isSupport = isSupportGunType(item.type);
                          const isTranscendent = item.cost >= 800;
                          const isSupreme = item.cost >= 500 && item.cost < 800;
                          const spanClass = isTranscendent
                            ? useSidebarTheater
                              ? 'mobile-ls:col-span-2 lg:col-span-3'
                              : 'md:col-span-4'
                            : '';
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
                                useSidebarTheater ? 'mobile-ls:min-w-0 lg:min-w-0 min-h-[46px]' : 'md:min-w-0 min-h-[48px]'
                              } ${spanClass} shrink-0 px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-amber-950/65 border-amber-400 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.45)]'
                                  : isTranscendent
                                    ? 'bg-gradient-to-r from-cyan-950/45 via-[#0B172B] to-violet-950/40 border-cyan-400/70 text-cyan-50 hover:border-cyan-300'
                                    : isSupreme
                                      ? 'bg-amber-950/30 border-amber-400/65 text-amber-50 hover:border-amber-300'
                                      : isElectric
                                        ? 'bg-sky-950/30 border-sky-500/50 text-sky-100 hover:border-sky-400'
                                        : isSupport
                                          ? 'bg-emerald-950/25 border-emerald-500/45 text-emerald-100 hover:border-emerald-400'
                                          : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                                <span className="truncate">
                                  <span className="hidden lg:inline">[{item.hotkey.toUpperCase()}] </span>
                                  {isTranscendent ? item.name : item.shortName}
                                </span>
                                <span
                                  className={`font-mono shrink-0 tabular-nums ${
                                    canAfford
                                      ? isTranscendent
                                        ? 'text-cyan-300'
                                        : 'text-amber-300'
                                      : 'text-rose-400'
                                  }`}
                                >
                                  {item.cost}⚡
                                </span>
                              </div>
                              <p
                                className={`text-[9px] truncate mt-0.5 ${
                                  isTranscendent
                                    ? 'text-cyan-200/90 font-semibold'
                                    : isElectric
                                      ? 'text-sky-300/90 font-semibold'
                                      : isSupport
                                        ? 'text-emerald-300/90'
                                        : 'text-slate-400'
                                }`}
                              >
                                {isElectric
                                  ? '⚡ Hệ Điện'
                                  : isSupport
                                    ? '✦ Thuần Hỗ Trợ'
                                    : isTranscendent
                                      ? `✦ Siêu Phẩm 800⚡ · ${item.roleClue}`
                                      : item.roleClue}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Embedded (non-sidebar / Portrait & Standard Desktop) Selected Gun Inspector */}
                  {!useSidebarTheater && selectedGun && selectedProfile && selectedSpec && (
                    <div
                      data-testid="td-gun-inspector"
                      className="rounded-xl border bg-gradient-to-br from-slate-900/95 via-[#0E1729] to-slate-950 p-3 space-y-3 transition-all"
                      style={{ borderColor: `${selectedProfile.accentColor}77` }}
                    >
                      {/* Header + Core Stats */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm sm:text-base font-bold text-white">{selectedSpec.name}</span>
                            <span
                              data-testid="td-gun-level-badge"
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md tabular-nums ${
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
                              aria-label="Đóng bảng súng"
                              className="ml-auto min-h-[40px] px-3 rounded-lg border border-slate-700 bg-slate-800 hover:border-cyan-400 text-slate-200 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Đóng</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums">
                            <div className="rounded-lg bg-[#080E1C] border border-slate-800 px-2.5 py-1.5">
                              <span className="text-[10px] text-slate-400 block">DMG</span>
                              {isSupportGunType(selectedGun.type) ? (
                                <strong className="text-emerald-300 text-sm">0 (Hỗ Trợ)</strong>
                              ) : (
                                <>
                                  <strong className="text-white text-sm">{selectedProfile.damage}</strong>
                                  {selectedNextProfile && selectedNextProfile.damage > selectedProfile.damage && (
                                    <span className="text-emerald-400 text-[10px] ml-1">
                                      +{selectedNextProfile.damage - selectedProfile.damage}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="rounded-lg bg-[#080E1C] border border-slate-800 px-2.5 py-1.5">
                              <span className="text-[10px] text-slate-400 block">
                                {isSupportGunType(selectedGun.type) ? 'Hiệu Ứng' : 'DPS'}
                              </span>
                              {isSupportGunType(selectedGun.type) ? (
                                <strong className="text-sky-300 text-xs">
                                  {selectedGun.type === 'cryo'
                                    ? `Chậm ${Math.round(selectedProfile.slowPct * 100)}%`
                                    : selectedGun.type === 'radar'
                                      ? `Khóa +${Math.round(selectedProfile.brittleBonus * 100)}%`
                                      : 'Buff Chí Mạng'}
                                </strong>
                              ) : (
                                <>
                                  <strong className="text-sky-300 text-sm">{selectedProfile.dpsEstimate}</strong>
                                  {selectedNextProfile && selectedNextProfile.dpsEstimate > selectedProfile.dpsEstimate && (
                                    <span className="text-emerald-400 text-[10px] ml-1">
                                      +{selectedNextProfile.dpsEstimate - selectedProfile.dpsEstimate}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="rounded-lg bg-[#080E1C] border border-slate-800 px-2.5 py-1.5">
                              <span className="text-[10px] text-slate-400 block">Tầm</span>
                              <strong className="text-cyan-300 text-sm">
                                {Number((selectedProfile.rangeTiles + (selectedTeamBuff?.rangeBonusTiles ?? 0)).toFixed(1))}ô
                              </strong>
                            </div>
                            <div className="rounded-lg bg-[#080E1C] border border-slate-800 px-2.5 py-1.5">
                              <span className="text-[10px] text-slate-400 block">
                                {isSupportGunType(selectedGun.type) ? 'Vai Trò' : 'Buff / Hạ'}
                              </span>
                              {isSupportGunType(selectedGun.type) ? (
                                <strong className="text-emerald-300 text-xs">
                                  {selectedTeamBuff && selectedTeamBuff.rangeBonusTiles > 0
                                    ? `+${selectedTeamBuff.rangeBonusTiles}ô Tầm Aura`
                                    : 'Thuần Hỗ Trợ'}
                                </strong>
                              ) : selectedTeamBuff?.hasSupportLink ? (
                                <strong className="text-emerald-300 text-xs">
                                  {selectedTeamBuff.critChance > 0
                                    ? `+${Math.round(selectedTeamBuff.critChance * 100)}% Crit`
                                    : selectedTeamBuff.damageMult > 1
                                      ? `+${Math.round((selectedTeamBuff.damageMult - 1) * 100)}% DMG`
                                      : `+${selectedTeamBuff.rangeBonusTiles}ô Tầm`}
                                </strong>
                              ) : (
                                <strong className="text-amber-300 text-sm">{selectedGun.kills} hạ</strong>
                              )}
                            </div>
                          </div>
                          {selectedTeamBuff?.hasSupportLink &&
                            (!isSupportGunType(selectedGun.type) || selectedTeamBuff.rangeBonusTiles > 0) && (
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/35 border border-emerald-500/30 rounded-lg px-2.5 py-1">
                                <span className="font-bold">BUFF ĐỘI:</span>
                                {isSupportGunType(selectedGun.type) ? (
                                  <span>+{selectedTeamBuff.rangeBonusTiles}ô Tầm Aura (Radar)</span>
                                ) : (
                                  <>
                                    {selectedTeamBuff.damageMult > 1 && <span>+{Math.round((selectedTeamBuff.damageMult - 1) * 100)}% DMG</span>}
                                    {selectedTeamBuff.critChance > 0 && (
                                      <span>
                                        +{Math.round(selectedTeamBuff.critChance * 100)}% Chí Mạng (×{selectedTeamBuff.critMult})
                                      </span>
                                    )}
                                    {selectedTeamBuff.rangeBonusTiles > 0 && <span>+{selectedTeamBuff.rangeBonusTiles}ô Tầm</span>}
                                    {selectedTeamBuff.armorPierceBonus > 0 && <span>+{Math.round(selectedTeamBuff.armorPierceBonus * 100)}% Giáp</span>}
                                    {selectedTeamBuff.shieldMultBonus > 0 && <span>+{Math.round(selectedTeamBuff.shieldMultBonus * 100)}% Khiên</span>}
                                  </>
                                )}
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
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            data-testid="td-upgrade-btn"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              upgradeSelectedGun();
                            }}
                            disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                            className={`col-span-2 sm:col-span-1 min-h-[44px] px-4 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors tabular-nums ${
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
                              cycleSelectedPriority();
                            }}
                            title="Đổi ưu tiên mục tiêu [T]"
                            className="min-h-[44px] px-3 rounded-xl border border-slate-700 bg-slate-800 hover:border-cyan-400 text-cyan-200 text-xs font-mono cursor-pointer"
                          >
                            [T] {PRIORITY_LABELS[selectedGun.priority]}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.currentTarget.blur();
                              sellSelectedGun();
                            }}
                            aria-label="Thu hồi trụ súng"
                            className="min-h-[44px] px-3 rounded-xl border border-rose-500/35 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 text-xs font-mono font-bold inline-flex items-center justify-center gap-1 cursor-pointer tabular-nums"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Bán +{selectedSellRefund}⚡</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Heat / Overheat Skill + α/ω Variant Switcher Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-800/90">
                        <div className="lg:col-span-6 rounded-lg border border-slate-800 bg-[#080E1C] p-2.5 space-y-1">
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

                        <div className="lg:col-span-6 grid grid-cols-2 gap-2">
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
                                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2 mt-0.5">{vSpec.summary}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinned Bottom Action Bar (min-h 44px Early Wave CTA) */}
                <div
                  className={
                    useSidebarTheater
                      ? 'shrink-0 border-t border-slate-800 bg-[#080E1C] p-2 space-y-1.5'
                      : 'flex flex-wrap items-center justify-between gap-2 pt-1'
                  }
                >
                  {!isCompactTheater && (
                    <p
                      className={`text-[11px] font-mono text-slate-400 ${
                        useSidebarTheater ? 'line-clamp-1' : 'line-clamp-2 sm:truncate max-w-lg'
                      }`}
                    >
                      {statusNotice || `${activeMap.name} · Chạm ô trống đặt súng hoặc chạm súng để nâng Lv1→Lv10.`}
                    </p>
                  )}

                  <button
                    type="button"
                    data-testid="prism-wave-btn"
                    onClick={launchNextWave}
                    disabled={hud.waveActive || (hud.gameMode !== 'endless' && hud.wave >= hud.totalWaves)}
                    className={`min-h-[44px] ${
                      useSidebarTheater ? 'w-full' : 'w-full sm:w-auto'
                    } px-4 py-2 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer tabular-nums ${
                      hud.waveActive
                        ? 'bg-slate-800 text-slate-300 border border-slate-700 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-[#070B14]'
                    }`}
                  >
                    <Play className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {hud.waveActive
                        ? `Đợt ${hud.wave}/${hud.gameMode === 'endless' ? '∞' : hud.totalWaves} · Còn ${hud.remainingEnemies} quái`
                        : `Gọi Đợt ${hud.wave + 1}/${hud.gameMode === 'endless' ? '∞' : hud.totalWaves} (${hud.nextWaveCountdown}s)`}
                    </span>
                  </button>
                </div>
              </div>
            )}
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
