import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2,
  Coins,
  Copy,
  Flame,
  Heart,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Trophy,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  canPlaceGearItem,
  createStarterBackpack,
  evaluateBackpackSynergies,
  GEAR_ARENA_MODES,
  GEAR_CATALOG,
  getArenaWaveStage,
  getGearArenaModeConfig,
  getGearCatalogEntry,
  getGearOccupiedCells,
  getGearSellRefund,
  getModeRoundReward,
  getOpponentGhostForRound,
  getRotatedDimensions,
  ghostGridToPlacedGears,
  GRID_SIZE,
  parseGhostBuildJson,
  rollShopOffers,
  saveGhostBuildForRound,
  serializeGhostBuild,
  STARTING_HEARTS,
  type BackpackEvaluation,
  type GearArenaModeId,
  type GearItemId,
  type GearRotation,
  type GhostBuildSnapshot,
  type PlacedGear,
} from '../utils/gearArenaEngine.ts';
import { renderGearArenaFrame, type RenderScorchDecal } from '../utils/gearArenaCanvasFx.ts';
import { GearItemGlyph } from './GearItemGlyph.tsx';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface GearArenaGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type GamePhase = 'TITLE' | 'SHOP' | 'BATTLE' | 'ROUND_RESULT' | 'VICTORY' | 'GAME_OVER';
type ShopCategoryFilter = 'all' | 'weapon' | 'accessory' | 'defense';

interface HoldingItem {
  uid: string;
  itemId: GearItemId;
  rotation: GearRotation;
  fromGrid?: { col: number; row: number; rotation: GearRotation };
}

interface RoundSummary {
  won: boolean;
  reason: string;
  damageDealt: number;
  enemiesKilled: number;
  goldEarned: number;
  ghostDefeated: boolean;
  playerHpLeft: number;
  ghostHpLeft: number;
}

const ARENA_W = 920;
const ARENA_H = 500;
const ENDLESS_RECORD_KEY = 'thuanle-gear-arena-endless-best-v1';

// ---------------------------------------------------------------------------
// Synthesized Audio FX (Web Audio API)
// ---------------------------------------------------------------------------
type ArenaSfx = 'buy' | 'place' | 'zap' | 'boom' | 'crit' | 'emp' | 'win' | 'lose';

function playArenaSfx(ctx: AudioContext | null, kind: ArenaSfx, muted: boolean) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;

  if (kind === 'buy' || kind === 'place') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kind === 'buy' ? 540 : 410, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'buy' ? 860 : 660, now + 0.06);
    g.gain.setValueAtTime(0.045, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    return;
  }

  if (kind === 'emp') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(780, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);
    return;
  }

  if (kind === 'zap' || kind === 'crit') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = kind === 'zap' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(kind === 'zap' ? 1120 : 760, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'zap' ? 360 : 280, now + 0.07);
    g.gain.setValueAtTime(0.022, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
    return;
  }

  if (kind === 'boom') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.14);
    g.gain.setValueAtTime(0.042, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
    return;
  }

  const notes = kind === 'win' ? [523.25, 659.25, 783.99, 1046.5] : [260, 210, 155];
  notes.forEach((f, idx) => {
    const t = now + idx * 0.08;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = kind === 'win' ? 'sine' : 'sawtooth';
    osc.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  });
}

// ---------------------------------------------------------------------------
// Battle Canvas Entities & Rich VFX Types
// ---------------------------------------------------------------------------
interface BattleEnemy {
  id: number;
  kind: 'chaser' | 'bruiser' | 'kiter' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  shootCd: number;
  hitFlash: number;
  slowTimer: number;
  slowAmount: number;
  stunTimer: number;
  burnTimer: number;
  burnDps: number;
}

interface BattleProjectile {
  fromPlayer: boolean;
  fromEnemy?: boolean;
  weaponId: GearItemId | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isCrit: boolean;
  aoeRadius: number;
  homing: boolean;
  pierce: number;
  chainLightning: boolean;
  knockback: number;
  slowFactor: number;
  burnDps: number;
  lifestealPct: number;
  color: string;
  radius: number;
  life: number;
}

interface LightningBoltFx {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: string;
}

interface LaserBeamFx {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
}

interface ParticleFx {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'ring';
}

interface FloatingDmgFx {
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit: boolean;
  life: number;
  maxLife: number;
}

interface ExplosionFx {
  x: number;
  y: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  doubleRing?: boolean;
}

const CATEGORY_BADGE_MAP: Record<string, { label: string; bg: string }> = {
  weapon: { label: 'SÚNG', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  accessory: { label: 'PHỤ KIỆN', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  core: { label: 'LÕI', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  conductor: { label: 'DÂY DẪN', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  defense: { label: 'GIÁP', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
};

export function GearArenaGameSection(_props: GearArenaGameSectionProps) {
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1') {
      return 'SHOP';
    }
    return 'TITLE';
  });

  const [selectedMode, setSelectedMode] = useState<GearArenaModeId>('classic');
  const activeMode = useMemo(() => getGearArenaModeConfig(selectedMode), [selectedMode]);

  const [round, setRound] = useState<number>(1);
  const [hearts, setHearts] = useState<number>(STARTING_HEARTS);
  const [gold, setGold] = useState<number>(activeMode.startingGold);
  const [winStreak, setWinStreak] = useState<number>(0);
  const [winsTotal, setWinsTotal] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [bestEndlessRound, setBestEndlessRound] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const raw = Number(window.localStorage.getItem(ENDLESS_RECORD_KEY) || '1');
    return Number.isFinite(raw) && raw >= 1 ? raw : 1;
  });

  const [grid, setGrid] = useState<PlacedGear[]>(() => createStarterBackpack());
  const [shopFilter, setShopFilter] = useState<ShopCategoryFilter>('all');
  const [shopOffers, setShopOffers] = useState<GearItemId[]>(() =>
    rollShopOffers(1, Math.random, 6, 'all')
  );
  const [shopLocked, setShopLocked] = useState<boolean>(false);
  const [holding, setHolding] = useState<HoldingItem | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string>(
    'Mua súng / phụ kiện / lõi từ cửa hàng hoặc nhấp đồ trong ba lô để xoay [R] & kích hoạt cộng hưởng!'
  );

  const [customGhost, setCustomGhost] = useState<GhostBuildSnapshot | null>(null);
  const [showGhostModal, setShowGhostModal] = useState<boolean>(false);
  const [ghostImportText, setGhostImportText] = useState<string>('');
  const [ghostImportError, setGhostImportError] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(1);
  const battleSpeedRef = useRef<1 | 2>(1);
  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);

  const [battleHud, setBattleHud] = useState({
    playerHp: 220,
    playerMaxHp: 220,
    ghostHp: 220,
    ghostMaxHp: 220,
    timeLeft: activeMode.battleDurationSec,
    kills: 0,
    damageDealt: 0,
    waveStage: 1 as 1 | 2 | 3,
    skillBanner: '',
  });
  const [lastSummary, setLastSummary] = useState<RoundSummary | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const keysHeldRef = useRef<Set<string>>(new Set());

  const ensureAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        try {
          audioRef.current = new Ctor();
        } catch {
          // Ignore blocked audio context
        }
      }
    }
    return audioRef.current;
  }, []);

  const playerEval: BackpackEvaluation = useMemo(() => evaluateBackpackSynergies(grid), [grid]);

  const activeGhost: GhostBuildSnapshot = useMemo(() => {
    if (customGhost && customGhost.round === round) return customGhost;
    const baseGhost = getOpponentGhostForRound(round);
    if (round > 10) {
      return {
        ...baseGhost,
        round,
        name: `${baseGhost.name} (Vô Tận Lv.${round})`,
        title: `Vòng ${round} · Bóng Ma Cường Hóa`,
      };
    }
    return baseGhost;
  }, [customGhost, round]);

  const ghostPlaced = useMemo(() => ghostGridToPlacedGears(activeGhost), [activeGhost]);
  const ghostEval = useMemo(() => evaluateBackpackSynergies(ghostPlaced), [ghostPlaced]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (phase === 'TITLE') document.body.dataset.state = 'title';
    else if (phase === 'VICTORY' || phase === 'GAME_OVER') document.body.dataset.state = 'gameover';
    else document.body.dataset.state = 'playing';
  }, [phase]);

  // Start / Reset Run
  const startNewRun = useCallback(
    (modeOverride?: GearArenaModeId) => {
      const modeCfg = getGearArenaModeConfig(modeOverride ?? selectedMode);
      if (modeOverride) setSelectedMode(modeOverride);
      setRound(1);
      setHearts(modeCfg.startingHearts);
      setGold(modeCfg.startingGold);
      setWinStreak(0);
      setWinsTotal(0);
      setGrid(createStarterBackpack());
      setShopFilter('all');
      setShopOffers(rollShopOffers(1, Math.random, modeCfg.shopSlots, 'all'));
      setShopLocked(false);
      setHolding(null);
      setHoverCell(null);
      setCustomGhost(null);
      setLastSummary(null);
      setStatusNotice(
        `Chế độ ${modeCfg.name} · Vòng 1${modeCfg.maxRounds ? `/${modeCfg.maxRounds}` : ' (Vô Tận)'}: Lắp súng & phụ kiện vào ba lô 5×5 để kích hoạt cộng hưởng!`
      );
      setPhase('SHOP');
      playArenaSfx(ensureAudio(), 'place', muted);
    },
    [ensureAudio, muted, selectedMode]
  );

  // Title Screen Enter/Space & Shop Rotate [R] keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase === 'TITLE' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startNewRun();
        return;
      }
      if (phase === 'SHOP' && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        setHolding((prev) =>
          prev ? { ...prev, rotation: prev.rotation === 0 ? 90 : 0 } : prev
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, startNewRun]);

  // Shop Actions
  const handleBuyOffer = (itemId: GearItemId, slotIdx: number) => {
    if (phase !== 'SHOP') return;
    if (holding) {
      setStatusNotice('Hãy đặt hoặc bán món đồ đang cầm trên tay trước khi mua món mới!');
      return;
    }
    const entry = getGearCatalogEntry(itemId);
    if (gold < entry.cost) {
      setStatusNotice(`Không đủ Vàng! Cần ${entry.cost}G để mua ${entry.name}.`);
      return;
    }
    const uid = `gear-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setGold((g) => g - entry.cost);
    setShopOffers((prev) => prev.filter((_, idx) => idx !== slotIdx));
    setHolding({ uid, itemId, rotation: 0 });
    setStatusNotice(
      `Đã mua ${entry.name} (${entry.width}×${entry.height})! Nhấp ô trống trên ba lô để lắp (phím [R] để xoay).`
    );
    playArenaSfx(ensureAudio(), 'buy', muted);
  };

  const handleRefreshShop = (filterOverride?: ShopCategoryFilter) => {
    if (phase !== 'SHOP') return;
    const nextFilter = filterOverride ?? shopFilter;
    if (!filterOverride && gold < 2) {
      setStatusNotice('Cần 2G để làm mới cửa hàng!');
      return;
    }
    if (!filterOverride) {
      setGold((g) => g - 2);
    }
    setShopLocked(false);
    setShopOffers(rollShopOffers(round, Math.random, activeMode.shopSlots, nextFilter));
    setStatusNotice(
      filterOverride
        ? 'Đã lọc kệ hàng theo nhóm trang bị.'
        : 'Đã làm mới 6 món trang bị (-2G).'
    );
    playArenaSfx(ensureAudio(), 'place', muted);
  };

  const handleGridCellClick = (col: number, row: number) => {
    if (phase !== 'SHOP') return;

    if (holding) {
      if (!canPlaceGearItem(grid, holding.itemId, col, row, holding.rotation)) {
        setStatusNotice('Không đủ chỗ hoặc đè lên trang bị khác! Thử nhấn [R] xoay hoặc chọn ô khác.');
        return;
      }
      const nextItem: PlacedGear = {
        uid: holding.uid,
        itemId: holding.itemId,
        col,
        row,
        rotation: holding.rotation,
      };
      setGrid((prev) => [...prev, nextItem]);
      setHolding(null);
      const entry = getGearCatalogEntry(holding.itemId);
      setStatusNotice(`Đã lắp ${entry.name} vào tọa độ (${col + 1}, ${row + 1}).`);
      playArenaSfx(ensureAudio(), 'place', muted);
      return;
    }

    const clickedGear = grid.find((g) =>
      getGearOccupiedCells(g).some((c) => c.col === col && c.row === row)
    );
    if (clickedGear) {
      setGrid((prev) => prev.filter((g) => g.uid !== clickedGear.uid));
      setHolding({
        uid: clickedGear.uid,
        itemId: clickedGear.itemId,
        rotation: clickedGear.rotation,
        fromGrid: { col: clickedGear.col, row: clickedGear.row, rotation: clickedGear.rotation },
      });
      const entry = getGearCatalogEntry(clickedGear.itemId);
      setStatusNotice(`Đang cầm ${entry.name} — nhấp ô mới để di chuyển, bấm [R] xoay, hoặc nhấn Bán.`);
    }
  };

  const handleCancelOrRefundHolding = (action: 'cancel' | 'sell') => {
    if (!holding) return;
    const entry = getGearCatalogEntry(holding.itemId);
    if (action === 'cancel' && holding.fromGrid) {
      setGrid((prev) => [
        ...prev,
        {
          uid: holding.uid,
          itemId: holding.itemId,
          col: holding.fromGrid!.col,
          row: holding.fromGrid!.row,
          rotation: holding.fromGrid!.rotation,
        },
      ]);
      setHolding(null);
      setStatusNotice(`Đã trả ${entry.name} về vị trí cũ.`);
      return;
    }

    const refund = action === 'sell' ? getGearSellRefund(holding.itemId) : entry.cost;
    setGold((g) => g + refund);
    setHolding(null);
    setStatusNotice(
      action === 'sell'
        ? `Đã bán ${entry.name} thu về +${refund}G.`
        : `Đã hoàn trả ${entry.name} (+${refund}G).`
    );
    playArenaSfx(ensureAudio(), 'buy', muted);
  };

  // Start Combat Phase
  const startBattle = () => {
    if (phase !== 'SHOP') return;
    if (holding) {
      if (holding.fromGrid) {
        setGrid((prev) => [
          ...prev,
          {
            uid: holding.uid,
            itemId: holding.itemId,
            col: holding.fromGrid!.col,
            row: holding.fromGrid!.row,
            rotation: holding.fromGrid!.rotation,
          },
        ]);
        setHolding(null);
      } else {
        setStatusNotice('Bạn đang cầm món đồ chưa lắp! Hãy đặt vào ba lô hoặc hoàn trả trước khi chiến đấu.');
        return;
      }
    }
    if (playerEval.weapons.length === 0) {
      setStatusNotice('Ba lô cần ít nhất 1 vũ khí để ra trận!');
      return;
    }

    const snapshot = serializeGhostBuild('Thuận Lê Mech', round, grid);
    saveGhostBuildForRound(snapshot);

    const roundEndlessScale = round > 10 ? 1 + (round - 10) * 0.28 : 1;
    const scaledGhostStartHp = Math.round(ghostEval.maxHp * 2.15 * roundEndlessScale);

    setBattleHud({
      playerHp: playerEval.maxHp,
      playerMaxHp: playerEval.maxHp,
      ghostHp: scaledGhostStartHp,
      ghostMaxHp: scaledGhostStartHp,
      timeLeft: activeMode.battleDurationSec,
      kills: 0,
      damageDealt: 0,
      waveStage: 1,
      skillBanner:
        activeMode.hasBossEveryRound || round % 5 === 0
          ? '⚠️ SIÊU BOSS CƠ KHÍ XUẤT HIỆN!'
          : `⚔️ GIAO TRANH ${activeMode.battleDurationSec} GIÂY — 3 ĐỢT TĂNG VIỆN!`,
    });
    setPhase('BATTLE');
    playArenaSfx(ensureAudio(), 'zap', muted);
  };

  // -------------------------------------------------------------------------
  // 60FPS Neon Vector Auto-Battle Loop (High-Craft Weapon & Skill VFX)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'BATTLE') return;

    keysHeldRef.current.clear();
    const onKeyDown = (e: KeyboardEvent) => {
      keysHeldRef.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.key.toLowerCase());
    };
    const clearKeys = () => keysHeldRef.current.clear();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);

    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAccum = 0;
    let finished = false;

    const roundEndlessScale = round > 10 ? 1 + (round - 10) * 0.28 : 1;
    const ghostScaleHp = Math.round(ghostEval.maxHp * 2.15 * roundEndlessScale);

    const sim = {
      timeLeft: activeMode.battleDurationSec,
      waveStage: 1 as 1 | 2 | 3,
      spawnTimer: 0.35,
      empTimer: playerEval.empCount > 0 ? 1.8 : 999,
      reactiveCd: 0,
      shieldGlow: playerEval.reflectPct > 0 ? 0.5 : 0,
      skillBanner:
        activeMode.hasBossEveryRound || round % 5 === 0
          ? '⚠️ SIÊU BOSS CƠ KHÍ XUẤT HIỆN!'
          : `⚔️ ĐẠI CHIẾN ${activeMode.battleDurationSec}s · GIAI ĐOẠN 1`,
      skillBannerTimer: 2.6,
      shakeTrauma: 0,
      hitstop: 0,
      nextEnemyId: 1,
      totalDamage: 0,
      kills: 0,
      player: {
        x: 240,
        y: ARENA_H / 2,
        aimAngle: 0,
        hp: playerEval.maxHp,
        maxHp: playerEval.maxHp,
        armor: playerEval.armor,
        regen: playerEval.hpRegen,
        reflectPct: playerEval.reflectPct,
        hitFlash: 0,
        muzzleFlash: 0,
        muzzleColor: '#22D3EE',
        weaponTimers: playerEval.weapons.map(() => 0.1 + Math.random() * 0.15),
      },
      ghost: {
        x: ARENA_W - 210,
        y: ARENA_H / 2,
        aimAngle: Math.PI,
        hp: ghostScaleHp,
        maxHp: ghostScaleHp,
        armor: ghostEval.armor,
        regen: ghostEval.hpRegen,
        hitFlash: 0,
        muzzleFlash: 0,
        defeated: false,
        weaponTimers: ghostEval.weapons.map(() => 0.25 + Math.random() * 0.2),
      },
      enemies: [] as BattleEnemy[],
      projectiles: [] as BattleProjectile[],
      bolts: [] as LightningBoltFx[],
      beams: [] as LaserBeamFx[],
      particles: [] as ParticleFx[],
      explosions: [] as ExplosionFx[],
      scorchDecals: [] as RenderScorchDecal[],
      dmgFxs: [] as FloatingDmgFx[],
    };

    const spawnParticles = (
      x: number,
      y: number,
      count: number,
      color: string,
      speedMin: number,
      speedMax: number,
      size = 2.6,
      shape: ParticleFx['shape'] = 'circle',
      life = 0.38
    ) => {
      if (sim.particles.length > 260) return;
      for (let k = 0; k < count; k += 1) {
        const ang = Math.random() * Math.PI * 2;
        const spd = speedMin + Math.random() * (speedMax - speedMin);
        sim.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          size: size * (0.7 + Math.random() * 0.6),
          color,
          life: life * (0.75 + Math.random() * 0.5),
          maxLife: life,
          shape,
        });
      }
    };

    const spawnEnemy = (forceBoss = false) => {
      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = Math.random() * ARENA_W;
        y = 18;
      } else if (side === 1) {
        x = ARENA_W - 18;
        y = Math.random() * ARENA_H;
      } else if (side === 2) {
        x = Math.random() * ARENA_W;
        y = ARENA_H - 18;
      } else {
        x = 18;
        y = Math.random() * ARENA_H;
      }

      const roll = Math.random();
      const kind: BattleEnemy['kind'] = forceBoss
        ? 'boss'
        : roll < 0.58
          ? 'chaser'
          : roll < 0.84
            ? 'bruiser'
            : 'kiter';
      const roundScale = (1 + (round - 1) * 0.24) * activeMode.enemyHpMultiplier * roundEndlessScale;
      const baseHp = kind === 'boss' ? 820 : kind === 'bruiser' ? 92 : kind === 'kiter' ? 50 : 38;
      const hp = Math.round(baseHp * roundScale);

      sim.enemies.push({
        id: sim.nextEnemyId++,
        kind,
        x: forceBoss ? ARENA_W - 120 : x,
        y: forceBoss ? ARENA_H / 2 : y,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        radius: kind === 'boss' ? 28 : kind === 'bruiser' ? 15 : kind === 'kiter' ? 12 : 10,
        speed: kind === 'boss' ? 44 : kind === 'chaser' ? 90 + round * 2.5 : kind === 'kiter' ? 70 : 54,
        shootCd: kind === 'boss' ? 2.2 : 1.5 + Math.random(),
        hitFlash: 0,
        slowTimer: 0,
        slowAmount: 0,
        stunTimer: 0,
        burnTimer: 0,
        burnDps: 0,
      });
    };

    for (let i = 0; i < 5; i += 1) spawnEnemy(false);
    if (activeMode.hasBossEveryRound || round % 5 === 0) {
      spawnEnemy(true);
    }

    const finishCombat = (won: boolean, reason: string) => {
      if (finished) return;
      finished = true;
      const goldEarned = getModeRoundReward(round, selectedMode) + (won ? 3 + Math.min(4, winStreak) : 0);
      const nextSummary: RoundSummary = {
        won,
        reason,
        damageDealt: Math.round(sim.totalDamage),
        enemiesKilled: sim.kills,
        goldEarned,
        ghostDefeated: sim.ghost.defeated,
        playerHpLeft: Math.max(0, Math.round(sim.player.hp)),
        ghostHpLeft: Math.max(0, Math.round(sim.ghost.hp)),
      };
      setLastSummary(nextSummary);

      if (selectedMode === 'endless' && won && round > bestEndlessRound) {
        setBestEndlessRound(round);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ENDLESS_RECORD_KEY, String(round));
        }
      }

      if (won) {
        playArenaSfx(ensureAudio(), 'win', muted);
        setWinStreak((s) => s + 1);
        setWinsTotal((w) => w + 1);
        setGold((g) => g + goldEarned);
        if (activeMode.maxRounds !== null && round >= activeMode.maxRounds) {
          setPhase('VICTORY');
        } else {
          setPhase('ROUND_RESULT');
        }
      } else {
        playArenaSfx(ensureAudio(), 'lose', muted);
        setWinStreak(0);
        setGold((g) => g + goldEarned);
        const nextHearts = hearts - 1;
        setHearts(nextHearts);
        if (nextHearts <= 0) {
          setPhase('GAME_OVER');
        } else {
          setPhase('ROUND_RESULT');
        }
      }
    };

    const tick = (now: number) => {
      if (finished) return;
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000)) * battleSpeedRef.current;
      lastTs = now;

      if (sim.hitstop > 0) sim.hitstop = Math.max(0, sim.hitstop - rawDt);
      const dt = sim.hitstop > 0 ? rawDt * 0.2 : rawDt;

      sim.timeLeft = Math.max(0, sim.timeLeft - dt);
      sim.shakeTrauma = Math.max(0, sim.shakeTrauma - rawDt * 2.4);
      sim.reactiveCd = Math.max(0, sim.reactiveCd - rawDt);
      sim.shieldGlow = Math.max(playerEval.reflectPct > 0 ? 0.35 : 0, sim.shieldGlow - rawDt * 1.4);
      if (sim.skillBannerTimer > 0) {
        sim.skillBannerTimer = Math.max(0, sim.skillBannerTimer - rawDt);
        if (sim.skillBannerTimer <= 0) sim.skillBanner = '';
      }

      const elapsedSec = activeMode.battleDurationSec - sim.timeLeft;
      const stageInfo = getArenaWaveStage(elapsedSec, activeMode.battleDurationSec);
      if (stageInfo.stage !== sim.waveStage) {
        sim.waveStage = stageInfo.stage;
        sim.skillBanner = stageInfo.label;
        sim.skillBannerTimer = 2.8;
        if (stageInfo.stage === 2) {
          for (let r = 0; r < 3; r += 1) spawnEnemy(false);
          playArenaSfx(ensureAudio(), 'emp', muted);
        } else if (stageInfo.stage === 3) {
          if (activeMode.hasBossEveryRound || round >= 2) {
            spawnEnemy(true);
          } else {
            for (let r = 0; r < 4; r += 1) spawnEnemy(false);
          }
          playArenaSfx(ensureAudio(), 'boom', muted);
        }
      }

      // Active Skill: EMP Stun Capacitor pulse every 4.5s
      if (playerEval.empCount > 0) {
        sim.empTimer -= dt;
        if (sim.empTimer <= 0) {
          sim.empTimer = Math.max(2.6, 4.6 - (playerEval.empCount - 1) * 0.6);
          const empRadius = 215;
          sim.explosions.push({
            x: sim.player.x,
            y: sim.player.y,
            radius: empRadius,
            color: '#818CF8',
            life: 0.42,
            maxLife: 0.42,
            doubleRing: true,
          });
          spawnParticles(sim.player.x, sim.player.y, 18, '#A5B4FC', 90, 220, 3, 'spark', 0.45);
          playArenaSfx(ensureAudio(), 'emp', muted);
          sim.skillBanner = '🌀 TỤ XUNG CHOÁNG EMP!';
          sim.skillBannerTimer = 1.6;
          for (const en of sim.enemies) {
            const dx = en.x - sim.player.x;
            const dy = en.y - sim.player.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d <= empRadius) {
              const empDmg = 28 + round * 4;
              en.hp -= empDmg;
              en.stunTimer = Math.max(en.stunTimer, 1.35);
              en.hitFlash = 0.1;
              en.x += (dx / d) * 32;
              en.y += (dy / d) * 32;
              sim.totalDamage += empDmg;
              sim.dmgFxs.push({
                x: en.x,
                y: en.y - 14,
                text: `⚡CHOÁNG ${empDmg}`,
                color: '#A5B4FC',
                isCrit: false,
                life: 0.55,
                maxLife: 0.55,
              });
            }
          }
        }
      }

      // Spawn horde waves (3-stage pacing over 3x round duration)
      sim.spawnTimer -= dt;
      if (sim.spawnTimer <= 0 && sim.enemies.length < 44) {
        const baseSpawn = Math.max(0.32, 0.78 - round * 0.032) * stageInfo.spawnIntervalFactor;
        sim.spawnTimer = baseSpawn;
        spawnEnemy(false);
        if ((round >= 4 || stageInfo.stage === 3) && sim.enemies.length < 36) spawnEnemy(false);
      }

      // Player movement
      const keys = keysHeldRef.current;
      let moveX = 0;
      let moveY = 0;
      if (keys.has('w') || keys.has('arrowup')) moveY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveY += 1;
      if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveX += 1;

      if (moveX === 0 && moveY === 0) {
        const angle = now * 0.0011;
        const desiredX = ARENA_W * 0.44 + Math.cos(angle) * 165;
        const desiredY = ARENA_H * 0.5 + Math.sin(angle * 1.3) * 115;
        let steerX = desiredX - sim.player.x;
        let steerY = desiredY - sim.player.y;
        for (const en of sim.enemies) {
          const dx = sim.player.x - en.x;
          const dy = sim.player.y - en.y;
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < 105) {
            steerX += (dx / d) * (105 - d) * 3.6;
            steerY += (dy / d) * (105 - d) * 3.6;
          }
        }
        const mag = Math.hypot(steerX, steerY) || 1;
        moveX = steerX / mag;
        moveY = steerY / mag;
      } else {
        const mag = Math.hypot(moveX, moveY) || 1;
        moveX /= mag;
        moveY /= mag;
      }

      sim.player.x = Math.max(32, Math.min(ARENA_W - 32, sim.player.x + moveX * 162 * dt));
      sim.player.y = Math.max(32, Math.min(ARENA_H - 32, sim.player.y + moveY * 162 * dt));
      sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + sim.player.regen * dt);
      sim.player.hitFlash = Math.max(0, sim.player.hitFlash - rawDt);
      sim.player.muzzleFlash = Math.max(0, sim.player.muzzleFlash - rawDt);

      // Ghost Mech AI
      if (!sim.ghost.defeated) {
        const gAngle = -now * 0.00095 + 1.8;
        const gTargetX = ARENA_W * 0.64 + Math.cos(gAngle) * 145;
        const gTargetY = ARENA_H * 0.5 + Math.sin(gAngle * 1.2) * 125;
        const gx = gTargetX - sim.ghost.x;
        const gy = gTargetY - sim.ghost.y;
        const gm = Math.hypot(gx, gy) || 1;
        sim.ghost.x = Math.max(36, Math.min(ARENA_W - 36, sim.ghost.x + (gx / gm) * 126 * dt));
        sim.ghost.y = Math.max(36, Math.min(ARENA_H - 36, sim.ghost.y + (gy / gm) * 126 * dt));
        sim.ghost.hp = Math.min(sim.ghost.maxHp, sim.ghost.hp + sim.ghost.regen * dt);
        sim.ghost.hitFlash = Math.max(0, sim.ghost.hitFlash - rawDt);
      }

      const applyPlayerHitEffects = (
        x: number,
        y: number,
        baseDmg: number,
        isCrit: boolean,
        aoe: number,
        hasChain: boolean,
        lifestealPct: number,
        slowFactor: number,
        burnDps: number,
        color: string
      ) => {
        if (lifestealPct > 0) {
          const healAmt = Math.max(1, Math.round(baseDmg * lifestealPct));
          sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + healAmt);
          spawnParticles(sim.player.x, sim.player.y, 2, '#34D399', 20, 60, 2.5, 'circle', 0.3);
        }

        if (aoe > 0) {
          sim.explosions.push({
            x,
            y,
            radius: aoe,
            color,
            life: 0.28,
            maxLife: 0.28,
            doubleRing: aoe >= 65,
          });
          spawnParticles(x, y, aoe >= 65 ? 14 : 7, color, 50, 180, 2.8, 'spark', 0.35);
          if (aoe >= 40) {
            sim.shakeTrauma = Math.min(1, sim.shakeTrauma + 0.14);
            playArenaSfx(ensureAudio(), 'boom', muted);
          }
          for (const en of sim.enemies) {
            if (Math.hypot(en.x - x, en.y - y) <= aoe + en.radius) {
              en.hp -= baseDmg * 0.8;
              en.hitFlash = 0.07;
              if (slowFactor > 0) {
                en.slowTimer = Math.max(en.slowTimer, 2.2);
                en.slowAmount = Math.max(en.slowAmount, slowFactor);
              }
              if (burnDps > 0) {
                en.burnTimer = Math.max(en.burnTimer, 2.5);
                en.burnDps = Math.max(en.burnDps, burnDps);
              }
              sim.totalDamage += baseDmg * 0.8;
            }
          }
          if (!sim.ghost.defeated && Math.hypot(sim.ghost.x - x, sim.ghost.y - y) <= aoe + 18) {
            sim.ghost.hp -= baseDmg * 0.75;
            sim.ghost.hitFlash = 0.08;
            sim.totalDamage += baseDmg * 0.75;
          }
        }

        if (isCrit) {
          sim.shakeTrauma = Math.min(1, sim.shakeTrauma + 0.1);
          playArenaSfx(ensureAudio(), 'crit', muted);
        }

        if (hasChain) {
          const pts: { x: number; y: number }[] = [{ x, y }];
          let cx = x;
          let cy = y;
          const hitIds = new Set<number>();
          for (let hop = 0; hop < 4; hop += 1) {
            let bestEn: BattleEnemy | null = null;
            let bestD = 265;
            for (const en of sim.enemies) {
              if (en.hp <= 0 || hitIds.has(en.id)) continue;
              const d = Math.hypot(en.x - cx, en.y - cy);
              if (d < bestD) {
                bestD = d;
                bestEn = en;
              }
            }
            if (!bestEn) break;
            hitIds.add(bestEn.id);
            const zapDmg = Math.round(baseDmg * 0.65);
            bestEn.hp -= zapDmg;
            bestEn.hitFlash = 0.09;
            sim.totalDamage += zapDmg;
            pts.push({ x: bestEn.x, y: bestEn.y });
            spawnParticles(bestEn.x, bestEn.y, 4, '#38BDF8', 40, 120, 2, 'spark', 0.25);
            sim.dmgFxs.push({
              x: bestEn.x,
              y: bestEn.y - 12,
              text: `⚡${zapDmg}`,
              color: '#38BDF8',
              isCrit: false,
              life: 0.45,
              maxLife: 0.45,
            });
            cx = bestEn.x;
            cy = bestEn.y;
          }
          if (!sim.ghost.defeated && Math.hypot(sim.ghost.x - cx, sim.ghost.y - cy) < 280) {
            const ghostZap = Math.round(baseDmg * 0.7);
            sim.ghost.hp -= ghostZap;
            sim.ghost.hitFlash = 0.09;
            sim.totalDamage += ghostZap;
            pts.push({ x: sim.ghost.x, y: sim.ghost.y });
          }
          if (pts.length >= 2) {
            sim.bolts.push({ points: pts, life: 0.2, maxLife: 0.2, color: '#38BDF8' });
            playArenaSfx(ensureAudio(), 'zap', muted);
          }
        }
      };

      // Fire Weapons (supports instant Beams for Railgun, instant Arc for Tesla, Multi-Pellet Spread, Rockets, Nova Orbs!)
      const fireMechWeapons = (
        isPlayer: boolean,
        mechX: number,
        mechY: number,
        weapons: typeof playerEval.weapons,
        timers: number[]
      ) => {
        for (let i = 0; i < weapons.length; i += 1) {
          timers[i] -= dt;
          if (timers[i] > 0) continue;
          const w = weapons[i];
          const fireScale = isPlayer ? activeMode.fireRateScale : 1;
          timers[i] = 1 / Math.max(0.25, w.fireRate * fireScale);

          let tx = isPlayer ? sim.ghost.x : sim.player.x;
          let ty = isPlayer ? sim.ghost.y : sim.player.y;
          let targetEnemy: BattleEnemy | null = null;
          let bestDist = isPlayer && sim.ghost.defeated ? Infinity : Math.hypot(tx - mechX, ty - mechY) * 0.88;

          if (isPlayer) {
            for (const en of sim.enemies) {
              const d = Math.hypot(en.x - mechX, en.y - mechY);
              if (d < bestDist) {
                bestDist = d;
                tx = en.x;
                ty = en.y;
                targetEnemy = en;
              }
            }
          }

          if (!Number.isFinite(bestDist) && sim.enemies.length === 0) continue;
          const baseAng = Math.atan2(ty - mechY, tx - mechX);
          const isCrit = Math.random() < w.critChance;
          const rawDmg = Math.round(w.damage * (isCrit ? w.critMult : 1));
          const finalDmg = isPlayer ? rawDmg : Math.round(rawDmg * 0.48);

          if (isPlayer) {
            sim.player.aimAngle = baseAng;
            sim.player.muzzleFlash = 0.08;
            sim.player.muzzleColor = w.color;
          } else {
            sim.ghost.aimAngle = baseAng;
          }

          // Instant Railgun Electromagnetic Laser Beam!
          if (isPlayer && w.itemId === 'railgun') {
            const beamLen = 580;
            const x2 = mechX + Math.cos(baseAng) * beamLen;
            const y2 = mechY + Math.sin(baseAng) * beamLen;
            sim.beams.push({
              x1: mechX + Math.cos(baseAng) * 18,
              y1: mechY + Math.sin(baseAng) * 18,
              x2,
              y2,
              color: w.chainLightning ? '#38BDF8' : '#818CF8',
              width: isCrit ? 6 : 4,
              life: 0.16,
              maxLife: 0.16,
            });
            // Line-segment hit check for Railgun pierce
            const hitCheck = (hx: number, hy: number, rad: number) => {
              const vx = x2 - mechX;
              const vy = y2 - mechY;
              const l2 = vx * vx + vy * vy || 1;
              const t = Math.max(0, Math.min(1, ((hx - mechX) * vx + (hy - mechY) * vy) / l2));
              return Math.hypot(hx - (mechX + t * vx), hy - (mechY + t * vy)) <= rad + 12;
            };
            for (const en of sim.enemies) {
              if (hitCheck(en.x, en.y, en.radius)) {
                en.hp -= finalDmg;
                en.hitFlash = 0.1;
                sim.totalDamage += finalDmg;
                sim.dmgFxs.push({
                  x: en.x,
                  y: en.y - 16,
                  text: isCrit ? `⚡CRIT ${finalDmg}!` : `${finalDmg}`,
                  color: isCrit ? '#FACC15' : '#A5B4FC',
                  isCrit,
                  life: 0.55,
                  maxLife: 0.55,
                });
                applyPlayerHitEffects(
                  en.x,
                  en.y,
                  finalDmg,
                  isCrit,
                  w.aoeRadius,
                  w.chainLightning,
                  w.lifestealPct,
                  w.slowFactor,
                  w.burnDps,
                  w.color
                );
              }
            }
            if (!sim.ghost.defeated && hitCheck(sim.ghost.x, sim.ghost.y, 20)) {
              sim.ghost.hp -= finalDmg;
              sim.ghost.hitFlash = 0.1;
              sim.totalDamage += finalDmg;
              sim.dmgFxs.push({
                x: sim.ghost.x,
                y: sim.ghost.y - 22,
                text: isCrit ? `RAIL ${finalDmg}!` : `${finalDmg}`,
                color: '#A5B4FC',
                isCrit,
                life: 0.55,
                maxLife: 0.55,
              });
            }
            playArenaSfx(ensureAudio(), 'zap', muted);
            continue;
          }

          // Instant Tesla Coil Arc Strike!
          if (isPlayer && w.itemId === 'tesla_coil') {
            if (targetEnemy) {
              targetEnemy.hp -= finalDmg;
              targetEnemy.hitFlash = 0.1;
              sim.totalDamage += finalDmg;
              sim.bolts.push({
                points: [
                  { x: mechX, y: mechY },
                  { x: targetEnemy.x, y: targetEnemy.y },
                ],
                life: 0.18,
                maxLife: 0.18,
                color: '#38BDF8',
              });
              applyPlayerHitEffects(
                targetEnemy.x,
                targetEnemy.y,
                finalDmg,
                isCrit,
                0,
                true,
                w.lifestealPct,
                w.slowFactor,
                w.burnDps,
                w.color
              );
            } else if (!sim.ghost.defeated) {
              sim.ghost.hp -= finalDmg;
              sim.ghost.hitFlash = 0.1;
              sim.totalDamage += finalDmg;
              sim.bolts.push({
                points: [
                  { x: mechX, y: mechY },
                  { x: sim.ghost.x, y: sim.ghost.y },
                ],
                life: 0.18,
                maxLife: 0.18,
                color: '#38BDF8',
              });
            }
            continue;
          }

          // Multi-Pellet Projectile Firing
          const pellets = w.pelletCount;
          const totalSpread = pellets > 1 ? w.spreadRad : 0;
          for (let pIdx = 0; pIdx < pellets; pIdx += 1) {
            const offset =
              pellets === 1
                ? (Math.random() - 0.5) * w.spreadRad
                : ((pIdx / (pellets - 1)) - 0.5) * totalSpread;
            const shotAng = baseAng + offset;
            sim.projectiles.push({
              fromPlayer: isPlayer,
              weaponId: w.itemId,
              x: mechX + Math.cos(shotAng) * 16,
              y: mechY + Math.sin(shotAng) * 16,
              vx: Math.cos(shotAng) * w.projectileSpeed,
              vy: Math.sin(shotAng) * w.projectileSpeed,
              damage: finalDmg,
              isCrit,
              aoeRadius: w.aoeRadius,
              homing: w.itemId === 'homing_missile',
              pierce: w.itemId === 'chain_saw' || w.itemId === 'frost_rifle' ? 2 : 0,
              chainLightning: w.chainLightning,
              knockback: w.knockback,
              slowFactor: w.slowFactor,
              burnDps: w.burnDps,
              lifestealPct: w.lifestealPct,
              color: w.color,
              radius:
                w.itemId === 'nova_cannon'
                  ? 11
                  : w.itemId === 'chain_saw'
                    ? 9
                    : w.itemId === 'grenade_launcher'
                      ? 7
                      : w.itemId === 'flamethrower'
                        ? 6.5
                        : 4.5,
              life: w.itemId === 'flamethrower' ? 0.52 : 1.9,
            });
          }
        }
      };

      fireMechWeapons(true, sim.player.x, sim.player.y, playerEval.weapons, sim.player.weaponTimers);
      if (!sim.ghost.defeated) {
        fireMechWeapons(false, sim.ghost.x, sim.ghost.y, ghostEval.weapons, sim.ghost.weaponTimers);
      }

      // Enemy AI, Status Effects (Stun, Slow, Burn) & Boss Attacks
      for (const en of sim.enemies) {
        en.hitFlash = Math.max(0, en.hitFlash - rawDt);
        if (en.slowTimer > 0) en.slowTimer = Math.max(0, en.slowTimer - dt);
        if (en.stunTimer > 0) en.stunTimer = Math.max(0, en.stunTimer - dt);
        if (en.burnTimer > 0) {
          en.burnTimer = Math.max(0, en.burnTimer - dt);
          const burnTick = en.burnDps * dt;
          en.hp -= burnTick;
          sim.totalDamage += burnTick;
          if (Math.random() < 0.25) {
            spawnParticles(en.x, en.y, 1, '#F97316', 10, 45, 2.2, 'circle', 0.25);
          }
        }

        const dx = sim.player.x - en.x;
        const dy = sim.player.y - en.y;
        const dist = Math.hypot(dx, dy) || 1;
        const speedFactor = en.stunTimer > 0 ? 0 : en.slowTimer > 0 ? 1 - en.slowAmount : 1;

        if (en.kind === 'kiter' && dist < 175) {
          en.x += (-dy / dist) * en.speed * speedFactor * dt;
          en.y += (dx / dist) * en.speed * speedFactor * dt;
        } else {
          en.x += (dx / dist) * en.speed * speedFactor * dt;
          en.y += (dy / dist) * en.speed * speedFactor * dt;
        }

        if ((en.kind === 'kiter' || en.kind === 'boss') && en.stunTimer <= 0) {
          en.shootCd -= dt;
          if (en.shootCd <= 0) {
            if (en.kind === 'boss') {
              en.shootCd = 2.1;
              // 8-way radial Boss plasma barrage!
              for (let k = 0; k < 8; k += 1) {
                const a = (Math.PI * 2 * k) / 8 + now * 0.001;
                sim.projectiles.push({
                  fromPlayer: false,
                  fromEnemy: true,
                  weaponId: 'enemy',
                  x: en.x + Math.cos(a) * en.radius,
                  y: en.y + Math.sin(a) * en.radius,
                  vx: Math.cos(a) * 210,
                  vy: Math.sin(a) * 210,
                  damage: 10 + round * 1.1,
                  isCrit: false,
                  aoeRadius: 0,
                  homing: false,
                  pierce: 0,
                  chainLightning: false,
                  knockback: 0,
                  slowFactor: 0,
                  burnDps: 0,
                  lifestealPct: 0,
                  color: '#F43F5E',
                  radius: 5.5,
                  life: 2.5,
                });
              }
            } else {
              en.shootCd = 2.3;
              sim.projectiles.push({
                fromPlayer: false,
                fromEnemy: true,
                weaponId: 'enemy',
                x: en.x,
                y: en.y,
                vx: (dx / dist) * 240,
                vy: (dy / dist) * 240,
                damage: 8 + round * 0.85,
                isCrit: false,
                aoeRadius: 0,
                homing: false,
                pierce: 0,
                chainLightning: false,
                knockback: 0,
                slowFactor: 0,
                burnDps: 0,
                lifestealPct: 0,
                color: '#C084FC',
                radius: 4,
                life: 2.2,
              });
            }
          }
        }

        // Contact damage + Reflector Shield / Reactive Armor
        if (dist < en.radius + 17 && en.stunTimer <= 0) {
          const contactDmg = Math.max(3, 11 + round * 1.2 - sim.player.armor) * dt * 1.55;
          sim.player.hp -= contactDmg;
          sim.player.hitFlash = 0.08;
          if (sim.player.reflectPct > 0) {
            en.hp -= contactDmg * sim.player.reflectPct * 3.5;
            sim.shieldGlow = 0.85;
          }
          if (playerEval.reactiveArmorCount > 0 && sim.reactiveCd <= 0) {
            sim.reactiveCd = 1.6;
            sim.explosions.push({
              x: sim.player.x,
              y: sim.player.y,
              radius: 105,
              color: '#38BDF8',
              life: 0.28,
              maxLife: 0.28,
            });
            en.x -= (dx / dist) * 48;
            en.y -= (dy / dist) * 48;
            en.hp -= 24 + round * 3;
          }
        }
      }

      // Projectiles & Rich Trails
      const nextProjectiles: BattleProjectile[] = [];
      for (const p of sim.projectiles) {
        p.life -= dt;
        if (p.life <= 0) continue;

        if (p.weaponId === 'homing_missile' && Math.random() < 0.5) {
          spawnParticles(p.x, p.y, 1, '#FB923C', 8, 28, 2.2, 'circle', 0.22);
        } else if (p.weaponId === 'nova_cannon' && Math.random() < 0.65) {
          spawnParticles(p.x, p.y, 1, '#C084FC', 15, 45, 2.6, 'spark', 0.26);
        }

        if (p.homing && p.fromPlayer) {
          const target = !sim.ghost.defeated ? sim.ghost : sim.enemies[0];
          if (target) {
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            const speed = Math.hypot(p.vx, p.vy);
            p.vx = p.vx * 0.9 + (dx / d) * speed * 0.1;
            p.vy = p.vy * 0.9 + (dy / d) * speed * 0.1;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < 0 || p.x > ARENA_W || p.y < 0 || p.y > ARENA_H) continue;

        let consumed = false;

        if (p.fromPlayer) {
          if (!sim.ghost.defeated && Math.hypot(sim.ghost.x - p.x, sim.ghost.y - p.y) <= 20 + p.radius) {
            const net = Math.max(4, Math.round(p.damage - sim.ghost.armor * 0.6));
            sim.ghost.hp -= net;
            sim.ghost.hitFlash = 0.08;
            sim.totalDamage += net;
            spawnParticles(p.x, p.y, p.isCrit ? 8 : 4, p.color, 40, 140, 2.4, 'spark', 0.28);
            sim.dmgFxs.push({
              x: sim.ghost.x + (Math.random() - 0.5) * 14,
              y: sim.ghost.y - 22,
              text: p.isCrit ? `CRIT ${net}!` : `${net}`,
              color: p.isCrit ? '#FACC15' : '#F8FAFC',
              isCrit: p.isCrit,
              life: 0.55,
              maxLife: 0.55,
            });
            applyPlayerHitEffects(
              p.x,
              p.y,
              p.damage,
              p.isCrit,
              p.aoeRadius,
              p.chainLightning,
              p.lifestealPct,
              p.slowFactor,
              p.burnDps,
              p.color
            );
            if (p.pierce > 0) p.pierce -= 1;
            else consumed = true;
          }

          if (!consumed) {
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              if (Math.hypot(en.x - p.x, en.y - p.y) <= en.radius + p.radius) {
                en.hp -= p.damage;
                en.hitFlash = 0.08;
                if (p.knockback > 0) {
                  const spd = Math.hypot(p.vx, p.vy) || 1;
                  en.x += (p.vx / spd) * p.knockback;
                  en.y += (p.vy / spd) * p.knockback;
                }
                if (p.slowFactor > 0) {
                  en.slowTimer = Math.max(en.slowTimer, 2.2);
                  en.slowAmount = Math.max(en.slowAmount, p.slowFactor);
                }
                if (p.burnDps > 0) {
                  en.burnTimer = Math.max(en.burnTimer, 2.5);
                  en.burnDps = Math.max(en.burnDps, p.burnDps);
                }
                sim.totalDamage += p.damage;
                spawnParticles(p.x, p.y, p.isCrit ? 6 : 3, p.color, 35, 130, 2.2, 'spark', 0.25);
                sim.dmgFxs.push({
                  x: en.x + (Math.random() - 0.5) * 10,
                  y: en.y - 14,
                  text: p.isCrit ? `${p.damage}!` : `${p.damage}`,
                  color: p.isCrit ? '#FACC15' : '#E2E8F0',
                  isCrit: p.isCrit,
                  life: 0.45,
                  maxLife: 0.45,
                });
                applyPlayerHitEffects(
                  p.x,
                  p.y,
                  p.damage,
                  p.isCrit,
                  p.aoeRadius,
                  p.chainLightning,
                  p.lifestealPct,
                  p.slowFactor,
                  p.burnDps,
                  p.color
                );
                if (p.pierce > 0) p.pierce -= 1;
                else {
                  consumed = true;
                  break;
                }
              }
            }
          }
        } else {
          if (Math.hypot(sim.player.x - p.x, sim.player.y - p.y) <= 18 + p.radius) {
            const net = Math.max(3, Math.round(p.damage - sim.player.armor * 0.7));
            sim.player.hp -= net;
            sim.player.hitFlash = 0.08;
            if (sim.player.reflectPct > 0 && !sim.ghost.defeated) {
              sim.ghost.hp -= Math.round(net * sim.player.reflectPct);
              sim.shieldGlow = 0.9;
            }
            sim.dmgFxs.push({
              x: sim.player.x,
              y: sim.player.y - 20,
              text: `-${net}`,
              color: '#FB7185',
              isCrit: false,
              life: 0.5,
              maxLife: 0.5,
            });
            consumed = true;
          }
        }

        if (!consumed) nextProjectiles.push(p);
      }
      sim.projectiles = nextProjectiles;

      // Remove defeated enemies
      const aliveEnemies: BattleEnemy[] = [];
      for (const en of sim.enemies) {
        if (en.hp <= 0) {
          sim.kills += 1;
          sim.explosions.push({
            x: en.x,
            y: en.y,
            radius: en.radius * (en.kind === 'boss' ? 3.2 : 2.1),
            color: en.kind === 'boss' ? '#FACC15' : en.kind === 'bruiser' ? '#F59E0B' : '#FB7185',
            life: en.kind === 'boss' ? 0.5 : 0.22,
            maxLife: en.kind === 'boss' ? 0.5 : 0.22,
            doubleRing: en.kind === 'boss',
          });
          if (sim.scorchDecals.length < 24) {
            sim.scorchDecals.push({
              x: en.x,
              y: en.y,
              radius: en.radius * (en.kind === 'boss' ? 2.1 : 1.3),
              life: 6.5,
              maxLife: 6.5,
            });
          }
          if (en.kind === 'boss') {
            const healAmt = Math.round(sim.player.maxHp * 0.16);
            sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + healAmt);
            spawnParticles(sim.player.x, sim.player.y, 14, '#34D399', 35, 110, 3, 'circle', 0.45);
            sim.dmgFxs.push({
              x: sim.player.x,
              y: sim.player.y - 28,
              text: `💚 +${healAmt} HP`,
              color: '#34D399',
              isCrit: true,
              life: 0.75,
              maxLife: 0.75,
            });
          }
          spawnParticles(
            en.x,
            en.y,
            en.kind === 'boss' ? 28 : 6,
            en.kind === 'boss' ? '#FACC15' : '#FB7185',
            45,
            190,
            2.8,
            'spark',
            0.4
          );
        } else {
          aliveEnemies.push(en);
        }
      }
      sim.enemies = aliveEnemies;

      // Ghost KO + Nano Sustain Reward
      if (!sim.ghost.defeated && sim.ghost.hp <= 0) {
        sim.ghost.defeated = true;
        sim.ghost.hp = 0;
        sim.hitstop = 0.06;
        sim.shakeTrauma = 0.65;
        const koHeal = Math.round(sim.player.maxHp * 0.18);
        sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + koHeal);
        sim.skillBanner = `💥 ĐÃ HẠ BÓNG MA PvP! (+${koHeal} HP · GIỮ VỮNG TỚI HẾT GIỜ!)`;
        sim.skillBannerTimer = 2.6;
        sim.explosions.push({
          x: sim.ghost.x,
          y: sim.ghost.y,
          radius: 85,
          color: '#F43F5E',
          life: 0.45,
          maxLife: 0.45,
          doubleRing: true,
        });
        sim.scorchDecals.push({
          x: sim.ghost.x,
          y: sim.ghost.y,
          radius: 44,
          life: 7.5,
          maxLife: 7.5,
        });
        spawnParticles(sim.ghost.x, sim.ghost.y, 26, '#FDA4AF', 60, 240, 3.2, 'spark', 0.5);
        spawnParticles(sim.player.x, sim.player.y, 14, '#34D399', 35, 110, 3, 'circle', 0.45);
        playArenaSfx(ensureAudio(), 'boom', muted);
      }

      // Tick FX
      sim.bolts = sim.bolts.map((b) => ({ ...b, life: b.life - rawDt })).filter((b) => b.life > 0);
      sim.beams = sim.beams.map((b) => ({ ...b, life: b.life - rawDt })).filter((b) => b.life > 0);
      sim.explosions = sim.explosions.map((ex) => ({ ...ex, life: ex.life - rawDt })).filter((ex) => ex.life > 0);
      sim.scorchDecals = sim.scorchDecals.map((sc) => ({ ...sc, life: sc.life - rawDt })).filter((sc) => sc.life > 0);
      sim.particles = sim.particles
        .map((pt) => ({
          ...pt,
          x: pt.x + pt.vx * rawDt,
          y: pt.y + pt.vy * rawDt,
          vx: pt.vx * 0.94,
          vy: pt.vy * 0.94,
          life: pt.life - rawDt,
        }))
        .filter((pt) => pt.life > 0);
      sim.dmgFxs = sim.dmgFxs
        .map((fx) => ({ ...fx, y: fx.y - rawDt * 24, life: fx.life - rawDt }))
        .filter((fx) => fx.life > 0);

      // End conditions (full 3x round duration unless player explodes)
      if (sim.player.hp <= 0) {
        finishCombat(false, 'Cỗ máy Ba Lô đã quá tải và phát nổ trước hỏa lực địch!');
        return;
      }
      if (sim.timeLeft <= 0) {
        const playerPct = sim.player.hp / sim.player.maxHp;
        const ghostPct = sim.ghost.defeated ? 0 : sim.ghost.hp / sim.ghost.maxHp;
        if (sim.ghost.defeated || playerPct >= ghostPct) {
          finishCombat(
            true,
            sim.ghost.defeated
              ? `Hạ gục Bóng Ma "${activeGhost.name}" & sống sót hết trận!`
              : `Áp đảo chỉ số sinh tồn (${Math.round(playerPct * 100)}% vs ${Math.round(ghostPct * 100)}% HP)!`
          );
        } else {
          finishCombat(
            false,
            `Hết giờ: Bóng Ma "${activeGhost.name}" còn nhiều máu hơn (${Math.round(ghostPct * 100)}% vs ${Math.round(playerPct * 100)}%).`
          );
        }
        return;
      }

      // -------------------------------------------------------------------
      // Canvas 2D Render (Armored Mechs, Dreadnoughts & Multi-Layered VFX)
      // -------------------------------------------------------------------
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        renderGearArenaFrame({
          ctx,
          width: ARENA_W,
          height: ARENA_H,
          now,
          shakeTrauma: sim.shakeTrauma,
          scorchDecals: sim.scorchDecals,
          explosions: sim.explosions,
          beams: sim.beams,
          enemies: sim.enemies,
          particles: sim.particles,
          projectiles: sim.projectiles,
          bolts: sim.bolts,
          dmgFxs: sim.dmgFxs,
          player: {
            x: sim.player.x,
            y: sim.player.y,
            aimAngle: sim.player.aimAngle,
            hitFlash: sim.player.hitFlash,
            muzzleFlash: sim.player.muzzleFlash,
            muzzleColor: sim.player.muzzleColor,
            shieldGlow: sim.shieldGlow,
            chainLightningActive: playerEval.chainLightningActive,
            weapons: playerEval.weapons,
          },
          ghost: {
            x: sim.ghost.x,
            y: sim.ghost.y,
            aimAngle: sim.ghost.aimAngle,
            defeated: sim.ghost.defeated,
            hitFlash: sim.ghost.hitFlash,
            weapons: ghostEval.weapons,
          },
        });
      }

      hudSyncAccum += rawDt;
      if (hudSyncAccum >= 0.1) {
        hudSyncAccum = 0;
        setBattleHud({
          playerHp: Math.max(0, Math.round(sim.player.hp)),
          playerMaxHp: sim.player.maxHp,
          ghostHp: Math.max(0, Math.round(sim.ghost.hp)),
          ghostMaxHp: sim.ghost.maxHp,
          timeLeft: Math.ceil(sim.timeLeft),
          kills: sim.kills,
          damageDealt: Math.round(sim.totalDamage),
          waveStage: sim.waveStage,
          skillBanner: sim.skillBanner,
        });
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, [
    activeGhost.name,
    activeMode,
    bestEndlessRound,
    ensureAudio,
    ghostEval,
    hearts,
    muted,
    phase,
    playerEval,
    round,
    selectedMode,
    winStreak,
  ]);

  // -------------------------------------------------------------------------
  // Render: TITLE SCREEN (4 Game Modes + Expanded Arsenal Highlights)
  // -------------------------------------------------------------------------
  if (phase === 'TITLE') {
    return (
      <section
        id="gear-arena-section"
        aria-label="Đấu Trường Ba Lô Cơ Khí — Gear-Grid Auto Arena"
        className="rounded-2xl border border-[#1E2E4A] bg-[#070B14] text-[#F1F5F9] p-5 sm:p-7 mobile-ls:p-3 shadow-sm"
      >
        <div className="grid grid-cols-1 mobile-ls:grid-cols-12 lg:grid-cols-12 gap-6 mobile-ls:gap-3 items-center">
          <div className="mobile-ls:col-span-8 lg:col-span-7 space-y-4 mobile-ls:space-y-2">
            <p className="text-xs font-mono tracking-wider text-cyan-400 mobile-ls:text-[11px]">
              12 VŨ KHÍ · 14 PHỤ KIỆN &amp; LÕI · 4 CHẾ ĐỘ CHƠI · BÓNG MA PvP
            </p>
            <h1 className="text-2xl sm:text-4xl mobile-ls:text-xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              Đấu Trường Ba Lô Cơ Khí
            </h1>
            <p className="text-sm mobile-ls:text-xs text-slate-300 leading-relaxed max-w-2xl mobile-ls:line-clamp-2">
              Sắp xếp <strong>12 loại súng tối tân</strong> (Nova 2×2, Vulcan 6 Nòng, Sét Tesla, Railgun, Băng Cryo, Phun Lửa...) cùng <strong>14 phụ kiện chiến thuật</strong> (Hút Máu, Tụ EMP, Hồng Tâm, Băng Đạn+) vào ba lô <strong>5×5</strong> để kích hoạt cộng hưởng hủy diệt!
            </p>

            {/* 4 Selectable Game Modes */}
            <div className="space-y-2 mobile-ls:space-y-1">
              <p className="text-xs font-mono uppercase tracking-[0.08em] text-slate-400">
                Chọn chế độ đấu trường ({GEAR_ARENA_MODES.length} chế độ)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mobile-ls:gap-1.5 text-xs">
                {GEAR_ARENA_MODES.map((m) => {
                  const isSel = selectedMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`gear-mode-${m.id}`}
                      onClick={() => setSelectedMode(m.id)}
                      className={`p-3 mobile-ls:p-2 rounded-xl border text-left transition-all cursor-pointer space-y-1 mobile-ls:space-y-0.5 ${
                        isSel
                          ? 'bg-cyan-500/15 border-cyan-400 ring-1 ring-cyan-400/60'
                          : 'bg-[#0D1526] border-[#1E2E4A] hover:border-cyan-500/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className={isSel ? 'text-cyan-300 text-sm mobile-ls:text-xs' : 'text-white text-sm mobile-ls:text-xs'}>
                          {m.name}
                        </strong>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-amber-300">
                          {m.startingGold}G đầu
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-sky-300 mobile-ls:truncate">{m.tagline}</p>
                      <p className="text-[11px] text-slate-300 leading-snug mobile-ls:hidden">{m.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                data-testid="gear-start-btn"
                onClick={() => startNewRun()}
                className="min-h-[44px] mobile-ls:min-h-[40px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 mobile-ls:py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Vào Chế Độ: {activeMode.name}</span>
              </button>
              <span className="text-xs text-slate-400 mobile-ls:hidden">
                [Enter] bắt đầu · [R] xoay súng · [WASD] điều khiển né đạn · Kỷ lục Vô Tận: Vòng {bestEndlessRound}
              </span>
            </div>
          </div>

          {/* Bespoke SVG Emblem Centerpiece */}
          <div className="mobile-ls:col-span-4 lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] mobile-ls:max-w-[200px] aspect-square rounded-2xl border border-cyan-500/30 bg-[#0D1526] p-5 mobile-ls:p-2.5 flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden="true">
                <defs>
                  <linearGradient id="gearGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <rect x="20" y="20" width="200" height="200" rx="22" fill="#070B14" stroke="#1E2E4A" strokeWidth="3" />
                {[0, 1, 2, 3, 4].map((c) =>
                  [0, 1, 2, 3, 4].map((r) => (
                    <rect
                      key={`${c}-${r}`}
                      x={36 + c * 34}
                      y={36 + r * 34}
                      width="30"
                      height="30"
                      rx="6"
                      fill="#0F1A2E"
                      stroke="#1E2E4A"
                      strokeWidth="1.5"
                    />
                  ))
                )}
                {/* 2x2 Nova Cannon + Overclock + EMP + Tesla synergy preview */}
                <rect x="104" y="70" width="64" height="64" rx="8" fill="#9333EA" fillOpacity="0.32" stroke="#C084FC" strokeWidth="2.5" />
                <rect x="70" y="104" width="30" height="30" rx="6" fill="#EF4444" fillOpacity="0.32" stroke="#EF4444" strokeWidth="2.2" />
                <rect x="36" y="104" width="30" height="30" rx="6" fill="#10B981" fillOpacity="0.28" stroke="#10B981" strokeWidth="2.2" />
                <rect x="104" y="138" width="64" height="30" rx="6" fill="#D97706" fillOpacity="0.3" stroke="#FBBF24" strokeWidth="2.2" />
                <path d="M51 119 L85 119 L136 102 M136 102 L136 153" stroke="url(#gearGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="51" cy="119" r="5" fill="#6EE7B7" />
                <circle cx="136" cy="102" r="7" fill="#E9D5FF" />
                <text x="120" y="210" textAnchor="middle" fill="#67E8F9" fontSize="10.5" fontFamily="monospace" fontWeight="700">
                  26 TRANG BỊ · NOVA 2×2 · EMP ⚡
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------------------
  // Render: MAIN SHELL (SHOP + BATTLE + MODALS)
  // -------------------------------------------------------------------------
  const roundDisplayTotal = activeMode.maxRounds ? `${round}/${activeMode.maxRounds}` : `${round}/∞`;

  return (
    <section
      id="gear-arena-section"
      aria-label="Đấu Trường Ba Lô Cơ Khí"
      className="relative rounded-2xl border border-[#1E2E4A] bg-[#070B14] text-[#F1F5F9] p-3.5 sm:p-5 mobile-ls:p-2 shadow-sm"
    >
      {/* Top Unified HUD */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mobile-ls:flex-row mobile-ls:items-center mobile-ls:justify-between gap-2.5 mobile-ls:gap-1.5 pb-3 mobile-ls:pb-1.5 border-b border-[#1E2E4A]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mobile-ls:gap-x-2 mobile-ls:gap-y-1 text-xs tabular-nums">
          <button
            type="button"
            onClick={() => setPhase('TITLE')}
            className="min-h-[40px] mobile-ls:min-h-[34px] px-3 mobile-ls:px-2.5 py-1.5 mobile-ls:py-1 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 text-xs font-medium cursor-pointer"
          >
            Menu
          </button>

          <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/40 text-sky-300 font-mono text-[11px] font-semibold">
            {activeMode.name}
          </span>

          <div className="whitespace-nowrap">
            <span className="text-slate-400 text-[11px] mr-1">VÒNG</span>
            <strong className="font-mono text-cyan-300">{roundDisplayTotal}</strong>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap" aria-label={`Còn ${hearts} tim`}>
            {Array.from({ length: activeMode.startingHearts }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 ${idx < hearts ? 'text-rose-400 fill-rose-400' : 'text-slate-700'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Coins className="w-3.5 h-3.5 text-amber-300" />
            <strong className="font-mono text-amber-300" data-testid="gear-gold">{gold}G</strong>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400 text-[11px]">CHUỖI</span>
            <strong className="font-mono text-white">{winStreak}</strong>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Swords className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 text-[11px]">DPS</span>
            <strong className="font-mono text-emerald-300" data-testid="gear-dps">{playerEval.totalDps}</strong>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 text-[11px]">HP</span>
            <strong className="font-mono text-white">{playerEval.maxHp}</strong>
          </div>

          {playerEval.chainLightningActive && (
            <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 font-mono text-[11px] font-bold">
              ⚡ SÉT LAN
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="gear-ghost-json-btn"
            onClick={() => {
              setGhostImportError('');
              setCopiedNotice(false);
              setShowGhostModal(true);
            }}
            className="min-h-[40px] mobile-ls:min-h-[34px] inline-flex items-center gap-1.5 px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 text-xs font-mono text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="mobile-ls:hidden">Ghost JSON</span>
            <span className="hidden mobile-ls:inline">JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="min-w-[40px] min-h-[40px] mobile-ls:min-w-[34px] mobile-ls:min-h-[34px] p-2 mobile-ls:p-1.5 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            type="button"
            onClick={() => startNewRun()}
            aria-label="Chơi lại từ Vòng 1"
            className="min-w-[40px] min-h-[40px] mobile-ls:min-w-[34px] mobile-ls:min-h-[34px] p-2 mobile-ls:p-1.5 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PHASE 1: TACTICAL 5x5 BACKPACK & 6-SLOT FILTERABLE SHOP */}
      {phase === 'SHOP' && (
        <div className="mt-4 mobile-ls:mt-2 grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_295px] lg:grid-cols-12 gap-5 mobile-ls:gap-3 items-start">
          {/* Left 7 Cols: 5x5 Backpack Grid */}
          <div className="mobile-ls:min-w-0 lg:col-span-7 space-y-3 mobile-ls:space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg mobile-ls:text-sm font-bold text-white flex items-center gap-2">
                  <span>Ba Lô Cơ Khí (5×5)</span>
                  <span className="text-xs font-mono text-cyan-400">
                    {playerEval.weapons.length} súng · {grid.length - playerEval.weapons.length} phụ kiện
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mobile-ls:hidden">
                  Nhấp món đồ đang có để nhấc lên/xoay [R], hoặc nhấp ô trống để đặt trang bị vừa mua.
                </p>
              </div>
              {holding && (
                <div className="sticky top-1 z-20 lg:static bg-[#070B14]/95 py-1.5 px-2 rounded-xl border border-cyan-500/30 lg:border-0 lg:p-0 flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    data-testid="gear-rotate-btn"
                    onClick={() =>
                      setHolding((prev) =>
                        prev ? { ...prev, rotation: prev.rotation === 0 ? 90 : 0 } : prev
                      )
                    }
                    className="min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Xoay [R]</span>
                  </button>
                  <button
                    type="button"
                    data-testid="gear-sell-btn"
                    onClick={() => handleCancelOrRefundHolding(holding.fromGrid ? 'sell' : 'cancel')}
                    className="min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-400/50 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {holding.fromGrid
                        ? `Bán (+${getGearSellRefund(holding.itemId)}G)`
                        : `Hoàn Trả (+${getGearCatalogEntry(holding.itemId).cost}G)`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {holding && (
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-bold font-mono">
                    ĐANG CẦM
                  </span>
                  <strong className="text-white">{getGearCatalogEntry(holding.itemId).name}</strong>
                  <span className="font-mono text-cyan-300">
                    ({getRotatedDimensions(holding.itemId, holding.rotation).width}×
                    {getRotatedDimensions(holding.itemId, holding.rotation).height})
                  </span>
                </div>
                <span className="text-slate-300 hidden sm:inline">
                  Nhấp vào ô trên lưới 5×5 bên dưới để lắp!
                </span>
              </div>
            )}

            {/* 5x5 Armored Mech Hangar Grid Board */}
            <div className="relative mx-auto w-full max-w-[440px] mobile-ls:max-w-[min(100%,calc(100dvh-130px))] aspect-square p-3 mobile-ls:p-2 rounded-2xl border border-slate-700/80 bg-gradient-to-b from-[#111C31] to-[#080E1B] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_30px_rgba(0,0,0,0.45)]">
              <div
                className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full"
                onMouseLeave={() => setHoverCell(null)}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                  const col = idx % GRID_SIZE;
                  const row = Math.floor(idx / GRID_SIZE);

                  let previewState: 'none' | 'valid' | 'invalid' | 'synergy' = 'none';
                  if (holding && hoverCell) {
                    const dim = getRotatedDimensions(holding.itemId, holding.rotation);
                    const inFootprint =
                      col >= hoverCell.col &&
                      col < hoverCell.col + dim.width &&
                      row >= hoverCell.row &&
                      row < hoverCell.row + dim.height;
                    if (inFootprint) {
                      previewState = canPlaceGearItem(
                        grid,
                        holding.itemId,
                        hoverCell.col,
                        hoverCell.row,
                        holding.rotation
                      )
                        ? 'valid'
                        : 'invalid';
                    } else {
                      const entry = getGearCatalogEntry(holding.itemId);
                      if (
                        entry.category === 'core' ||
                        entry.category === 'conductor' ||
                        entry.category === 'accessory'
                      ) {
                        const nearFootprint =
                          Math.abs(col - Math.max(hoverCell.col, Math.min(col, hoverCell.col + dim.width - 1))) +
                            Math.abs(row - Math.max(hoverCell.row, Math.min(row, hoverCell.row + dim.height - 1))) ===
                          1;
                        if (nearFootprint) previewState = 'synergy';
                      }
                    }
                  }

                  return (
                    <button
                      key={`${col}-${row}`}
                      type="button"
                      data-testid={`gear-cell-${col}-${row}`}
                      aria-label={`Ô ba lô ${col + 1},${row + 1}`}
                      onMouseEnter={() => setHoverCell({ col, row })}
                      onClick={() => handleGridCellClick(col, row)}
                      className={`relative rounded-xl border transition-all cursor-pointer shadow-[inset_0_2px_6px_rgba(0,0,0,0.75)] ${
                        previewState === 'valid'
                          ? 'bg-emerald-500/30 border-emerald-400'
                          : previewState === 'invalid'
                            ? 'bg-rose-500/30 border-rose-400'
                            : previewState === 'synergy'
                              ? 'bg-amber-500/15 border-amber-400/70 border-dashed'
                              : 'bg-[#060B15] border-slate-800/90 hover:border-cyan-400/60'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-2 rounded-md border border-slate-800/40"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Placed Multi-Cell Armored Hardware Modules */}
              <div className="pointer-events-none absolute inset-3 mobile-ls:inset-2 grid grid-cols-5 grid-rows-5 gap-1.5">
                {grid.map((g) => {
                  const entry = getGearCatalogEntry(g.itemId);
                  const dim = getRotatedDimensions(g.itemId, g.rotation);
                  const isEnergized = playerEval.energizedUids.includes(g.uid);
                  const weaponSpec = playerEval.weapons.find((w) => w.uid === g.uid);
                  const borderCol = weaponSpec?.chainLightning
                    ? '#22D3EE'
                    : weaponSpec?.overclocked
                      ? '#EF4444'
                      : entry.color;
                  return (
                    <div
                      key={g.uid}
                      style={{
                        gridColumn: `${g.col + 1} / span ${dim.width}`,
                        gridRow: `${g.row + 1} / span ${dim.height}`,
                        borderColor: borderCol,
                      }}
                      className={`rounded-xl border-2 p-1.5 flex flex-col justify-between bg-gradient-to-br from-[#192640] via-[#0E172A] to-[#080E1B] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.5)] relative overflow-hidden ${
                        isEnergized && playerEval.chainLightningActive ? 'ring-2 ring-cyan-400/70' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 z-10">
                        <span
                          className="text-[10px] font-bold leading-tight truncate"
                          style={{ color: entry.accent }}
                        >
                          {entry.shortName}
                        </span>
                        {weaponSpec && weaponSpec.fireRateMult > 1 && (
                          <span className="px-1 rounded bg-rose-500 text-white font-mono text-[9px] font-extrabold shrink-0">
                            ×{weaponSpec.fireRateMult}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center my-auto z-10">
                        <GearItemGlyph
                          itemId={g.itemId}
                          color={entry.color}
                          accent={entry.accent}
                          className={dim.width >= 2 || dim.height >= 2 ? 'w-10 h-10' : 'w-6 h-6'}
                        />
                      </div>

                      <div className="flex items-end justify-between gap-1 text-[9px] font-mono z-10">
                        <span className="text-slate-200 font-semibold">
                          {weaponSpec
                            ? `${weaponSpec.dps}dps`
                            : entry.category === 'accessory'
                              ? 'MOD'
                              : entry.category === 'core'
                                ? 'CORE'
                                : entry.category === 'conductor'
                                  ? 'DÂY'
                                  : 'DEF'}
                        </span>
                        {weaponSpec?.chainLightning && (
                          <span className="text-cyan-300 font-bold">⚡SÉT</span>
                        )}
                        {weaponSpec && weaponSpec.lifestealPct > 0 && (
                          <span className="text-rose-300 font-bold">🩸</span>
                        )}
                        {weaponSpec && weaponSpec.slowFactor > 0 && (
                          <span className="text-sky-300 font-bold">❄</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Synergy Circuit Connector Overlay SVG */}
              {playerEval.synergyLinks.length > 0 && (
                <svg
                  viewBox="0 0 100 100"
                  className="pointer-events-none absolute inset-2.5 w-[calc(100%-20px)] h-[calc(100%-20px)]"
                >
                  {playerEval.synergyLinks.map((lnk, idx) => {
                    const a = grid.find((x) => x.uid === lnk.fromUid);
                    const b = grid.find((x) => x.uid === lnk.toUid);
                    if (!a || !b) return null;
                    const da = getRotatedDimensions(a.itemId, a.rotation);
                    const db = getRotatedDimensions(b.itemId, b.rotation);
                    const ax = ((a.col + da.width / 2) / GRID_SIZE) * 100;
                    const ay = ((a.row + da.height / 2) / GRID_SIZE) * 100;
                    const bx = ((b.col + db.width / 2) / GRID_SIZE) * 100;
                    const by = ((b.row + db.height / 2) / GRID_SIZE) * 100;
                    return (
                      <line
                        key={`${lnk.fromUid}-${lnk.toUid}-${idx}`}
                        x1={ax}
                        y1={ay}
                        x2={bx}
                        y2={by}
                        stroke={lnk.color}
                        strokeWidth="1.6"
                        strokeDasharray={lnk.kind === 'lightning' ? '3 2' : undefined}
                        strokeOpacity="0.88"
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="p-3 rounded-xl bg-[#0D1526] border border-[#1E2E4A] space-y-1.5 text-xs">
              <p className="text-slate-300">{statusNotice}</p>
              {playerEval.synergyLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {playerEval.synergyLabels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-cyan-200 text-[11px]"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Filterable 6-Slot Shop + Ghost PvP + FIGHT CTA */}
          <div className="lg:col-span-5 space-y-3.5 mobile-ls:max-h-[calc(100dvh-68px)] mobile-ls:overflow-y-auto mobile-ls:pr-1 mobile-ls:space-y-2">
            <div className="rounded-2xl border border-[#1E2E4A] bg-[#0D1526] p-3.5 mobile-ls:p-2.5 space-y-2.5 mobile-ls:space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">
                  Kho Trang Bị ({GEAR_CATALOG.length} Món)
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShopLocked((l) => !l)}
                    className={`min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                      shopLocked
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                        : 'bg-[#070B14] border-[#1E2E4A] text-slate-300'
                    }`}
                  >
                    {shopLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{shopLocked ? 'Đã Khóa' : 'Khóa'}</span>
                  </button>
                  <button
                    type="button"
                    data-testid="gear-refresh-shop-btn"
                    onClick={() => handleRefreshShop()}
                    className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#111C33] border border-[#1E2E4A] hover:border-cyan-400 text-[11px] font-semibold text-cyan-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm Mới (2G)</span>
                  </button>
                </div>
              </div>

              {/* Shop Category Filter Tabs */}
              <div role="group" aria-label="Lọc loại trang bị trong cửa hàng" className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Tất Cả' },
                  { id: 'weapon', label: 'Súng (12)' },
                  { id: 'accessory', label: 'Phụ Kiện & Lõi (10)' },
                  { id: 'defense', label: 'Giáp (4)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`gear-shop-filter-${tab.id}`}
                    onClick={() => {
                      const next = tab.id as ShopCategoryFilter;
                      setShopFilter(next);
                      handleRefreshShop(next);
                    }}
                    className={`min-h-[36px] px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                      shopFilter === tab.id
                        ? 'bg-cyan-400 text-slate-950 border-cyan-400'
                        : 'bg-[#070B14] text-slate-300 border-[#1E2E4A] hover:border-cyan-500/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {shopOffers.map((itemId, idx) => {
                  const entry = getGearCatalogEntry(itemId);
                  const canAfford = gold >= entry.cost;
                  const catBadge = CATEGORY_BADGE_MAP[entry.category];
                  return (
                    <button
                      key={`${itemId}-${idx}`}
                      type="button"
                      data-testid={`gear-shop-offer-${idx}`}
                      onClick={() => handleBuyOffer(itemId, idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${
                        canAfford
                          ? 'bg-gradient-to-b from-[#131E34] to-[#09101E] border-slate-700/80 hover:border-cyan-400'
                          : 'bg-[#080D18]/70 border-slate-800/80 opacity-55'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg border border-slate-700/70 bg-[#060A13] flex items-center justify-center shrink-0">
                          <GearItemGlyph
                            itemId={itemId}
                            color={entry.color}
                            accent={entry.accent}
                            className="w-7 h-7"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <strong className="text-xs truncate" style={{ color: entry.accent }}>
                              {entry.name}
                            </strong>
                            <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                              {entry.cost}G
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                            <span className="text-slate-400">
                              {entry.width}×{entry.height} · Tier {entry.tier}
                            </span>
                            <span className={`px-1 py-0.2 rounded border text-[9px] font-bold ${catBadge.bg}`}>
                              {catBadge.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                        {entry.description}
                      </p>
                    </button>
                  );
                })}
                {shopOffers.length === 0 && (
                  <p className="text-xs text-slate-400 col-span-2 py-4 text-center">
                    Đã mua hết kệ! Bấm &ldquo;Làm Mới (2G)&rdquo; để roll thêm trang bị.
                  </p>
                )}
              </div>
            </div>

            {/* Opponent Ghost PvP Preview */}
            <div className="rounded-2xl border border-rose-500/35 bg-[#120D1D] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-rose-400">ĐỐI THỦ BÓNG MA PvP</span>
                <span className="text-[11px] font-mono text-slate-300">
                  {activeGhost.grid.length} món · {ghostEval.totalDps} DPS
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{activeGhost.name}</p>
                  <p className="text-xs text-slate-300">{activeGhost.title}</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <span className="block text-rose-300">{ghostEval.maxHp} HP</span>
                  {ghostEval.chainLightningActive && (
                    <span className="text-[10px] text-cyan-300">⚡ CÓ SÉT LAN</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              data-testid="gear-fight-btn"
              onClick={startBattle}
              className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Swords className="w-5 h-5" />
              <span>CHIẾN ĐẤU! (Vòng {roundDisplayTotal})</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: LIVE NEON VECTOR AUTO-BATTLE CANVAS */}
      {phase === 'BATTLE' && (
        <div className="mt-3 mobile-ls:mt-1.5 space-y-2.5 mobile-ls:space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 mobile-ls:grid-cols-3 gap-2.5 mobile-ls:gap-1.5 items-center text-xs tabular-nums">
            <div className="p-2.5 mobile-ls:p-1.5 rounded-xl bg-gradient-to-b from-[#132036] to-[#0B1221] border border-cyan-500/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] space-y-1.5 mobile-ls:space-y-1">
              <div className="flex items-center justify-between gap-1">
                <strong className="text-cyan-300 tracking-wide truncate mobile-ls:text-[11px]">CHIẾN GIÁP</strong>
                <span className="font-mono text-white mobile-ls:text-[11px] shrink-0">
                  {battleHud.playerHp}/{battleHud.playerMaxHp} HP
                </span>
              </div>
              <div className="w-full h-2.5 mobile-ls:h-2 rounded bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-sm bg-gradient-to-r from-cyan-500 to-sky-300 transition-all duration-100"
                  style={{ width: `${Math.max(0, (battleHud.playerHp / Math.max(1, battleHud.playerMaxHp)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 mobile-ls:gap-2 py-1.5 px-3 mobile-ls:py-1 mobile-ls:px-2 rounded-xl bg-gradient-to-b from-[#132036] to-[#0B1221] border border-slate-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block text-center">THỜI GIAN</span>
                <strong className="text-base mobile-ls:text-xs text-amber-300" data-testid="gear-battle-time">
                  {battleHud.timeLeft}s
                </strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block text-center">ĐỢT QUÁI</span>
                <strong className="text-base mobile-ls:text-xs text-cyan-300">{battleHud.waveStage}/3</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block text-center">TIÊU DIỆT</span>
                <strong className="text-base mobile-ls:text-xs text-emerald-300">{battleHud.kills}</strong>
              </div>
              <div className="mobile-ls:hidden">
                <span className="text-slate-400 text-[10px] block text-center">SÁT THƯƠNG</span>
                <strong className="text-base text-white">{battleHud.damageDealt}</strong>
              </div>
              <button
                type="button"
                data-testid="gear-speed-btn"
                onClick={() => setBattleSpeed((s) => (s === 1 ? 2 : 1))}
                className={`min-h-[38px] min-w-[44px] mobile-ls:min-h-[32px] mobile-ls:min-w-[36px] px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  battleSpeed === 2
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400'
                }`}
                title="Chuyển tốc độ mô phỏng 1× hoặc 2×"
              >
                {battleSpeed}×
              </button>
            </div>

            <div className="p-2.5 mobile-ls:p-1.5 rounded-xl bg-gradient-to-b from-[#231224] to-[#110915] border border-rose-500/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] space-y-1.5 mobile-ls:space-y-1">
              <div className="flex items-center justify-between gap-1">
                <strong className="text-rose-300 truncate tracking-wide mobile-ls:text-[11px]">{activeGhost.name}</strong>
                <span className="font-mono text-white mobile-ls:text-[11px] shrink-0">
                  {battleHud.ghostHp}/{battleHud.ghostMaxHp} HP
                </span>
              </div>
              <div className="w-full h-2.5 mobile-ls:h-2 rounded bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-sm bg-gradient-to-r from-rose-600 to-amber-400 transition-all duration-100"
                  style={{ width: `${Math.max(0, (battleHud.ghostHp / Math.max(1, battleHud.ghostMaxHp)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {battleHud.skillBanner && (
            <div className="text-center">
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-200 font-mono text-xs font-bold">
                {battleHud.skillBanner}
              </span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={ARENA_W}
            height={ARENA_H}
            data-testid="gear-arena-canvas"
            className="w-full mobile-ls:max-w-[min(100%,calc((100dvh-130px)*1.84))] mobile-ls:mx-auto block aspect-[920/500] h-auto rounded-xl border border-[#1E2E4A]"
            aria-label="Đấu trường chiến đấu Ba Lô Cơ Khí"
          />
        </div>
      )}

      {/* ROUND RESULT / VICTORY / GAME OVER MODAL */}
      {(phase === 'ROUND_RESULT' || phase === 'VICTORY' || phase === 'GAME_OVER') && lastSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={phase === 'VICTORY' ? 'Chiến thắng' : phase === 'GAME_OVER' ? 'Thất bại' : 'Kết quả vòng đấu'}
          className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#1E2E4A] bg-[#0D1526] p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                  lastSummary.won
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300'
                }`}
              >
                {phase === 'VICTORY' ? <Trophy className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-xs font-mono text-cyan-400">
                  VÒNG {roundDisplayTotal} · {phase === 'VICTORY' ? 'VÔ ĐỊCH ĐẤU TRƯỜNG!' : lastSummary.won ? 'THẮNG TRẬN' : 'THẤT BẠI'}
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {phase === 'VICTORY'
                    ? `Hoàn thành xuất sắc chế độ ${activeMode.name}!`
                    : phase === 'GAME_OVER'
                      ? 'Hết sạch Tim sinh tồn!'
                      : lastSummary.won
                        ? 'Chiến thắng áp đảo!'
                        : 'Chưa vượt qua Bóng Ma vòng này'}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{lastSummary.reason}</p>

            <div className="grid grid-cols-3 gap-2.5 text-center text-xs tabular-nums">
              <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1E2E4A]">
                <span className="text-slate-400 block">Sát thương</span>
                <strong className="text-base font-mono text-white">{lastSummary.damageDealt}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1E2E4A]">
                <span className="text-slate-400 block">Quái hạ gục</span>
                <strong className="text-base font-mono text-emerald-300">{lastSummary.enemiesKilled}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070B14] border border-[#1E2E4A]">
                <span className="text-slate-400 block">Vàng thưởng</span>
                <strong className="text-base font-mono text-amber-300">+{lastSummary.goldEarned}G</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              {phase === 'VICTORY' || phase === 'GAME_OVER' ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startNewRun()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  Chơi Ván Mới ({winsTotal} Thắng)
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="gear-next-round-btn"
                  onClick={() => {
                    const nextRound = lastSummary.won
                      ? activeMode.maxRounds
                        ? Math.min(activeMode.maxRounds, round + 1)
                        : round + 1
                      : round;
                    setRound(nextRound);
                    if (!shopLocked) {
                      setShopOffers(
                        rollShopOffers(nextRound, Math.random, activeMode.shopSlots, shopFilter)
                      );
                    }
                    setStatusNotice(
                      `Vòng ${nextRound}${activeMode.maxRounds ? `/${activeMode.maxRounds}` : ''} · Đã nhận +${lastSummary.goldEarned}G! Nâng cấp ba lô để bứt phá.`
                    );
                    setPhase('SHOP');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  {lastSummary.won ? `Vào Shop Vòng ${round + 1} →` : 'Quay Lại Shop Thử Lại'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GHOST BUILD JSON INSPECTOR / IMPORT MODAL */}
      {showGhostModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quản lý Ghost Build JSON"
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#1E2E4A] bg-[#0D1526] p-4 sm:p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Ghost Build JSON (Sao Lưu &amp; Đấu PvP)</span>
              </h3>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setShowGhostModal(false)}
                className="min-w-[40px] min-h-[40px] p-2 rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">JSON đội hình ba lô của bạn:</span>
                <button
                  type="button"
                  onClick={() => {
                    const txt = JSON.stringify(serializeGhostBuild('Thuận Lê Mech', round, grid));
                    void navigator.clipboard?.writeText(txt);
                    setCopiedNotice(true);
                  }}
                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedNotice ? 'Đã Copy!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-[#070B14] border border-[#1E2E4A] text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-28">
                {JSON.stringify(serializeGhostBuild('Thuận Lê Mech', round, grid), null, 2)}
              </pre>
            </div>

            <div className="space-y-1.5 text-xs">
              <label htmlFor="ghost-json-input" className="text-slate-300 font-semibold block">
                Dán Ghost JSON của người chơi khác để đấu thử ở Vòng {round}:
              </label>
              <textarea
                id="ghost-json-input"
                rows={4}
                value={ghostImportText}
                onChange={(e) => {
                  setGhostImportText(e.target.value);
                  setGhostImportError('');
                }}
                placeholder='{"version":1,"name":"Cao Thủ","round":1,"grid":[{"itemId":"pulse_laser","col":1,"row":1,"rotation":0}]}'
                className="w-full p-2.5 rounded-xl bg-[#070B14] border border-[#1E2E4A] text-slate-200 font-mono text-base sm:text-xs"
              />
              {ghostImportError && <p className="text-rose-400">{ghostImportError}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGhostModal(false)}
                className="min-h-[42px] px-4 py-1.5 rounded-lg border border-[#1E2E4A] text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseGhostBuildJson(ghostImportText);
                  if (!parsed) {
                    setGhostImportError('JSON không hợp lệ hoặc tọa độ ba lô 5×5 bị chồng chéo!');
                    return;
                  }
                  setCustomGhost({ ...parsed, round });
                  setShowGhostModal(false);
                  setStatusNotice(`Đã nạp Bóng Ma PvP "${parsed.name}" cho Vòng ${round}!`);
                }}
                className="min-h-[42px] px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Nạp Đối Thủ Ghost
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
