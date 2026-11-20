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
  getGearCatalogEntry,
  getGearOccupiedCells,
  getGearSellRefund,
  getOpponentGhostForRound,
  getRotatedDimensions,
  getRoundGoldReward,
  ghostGridToPlacedGears,
  GRID_SIZE,
  MAX_ROUNDS,
  parseGhostBuildJson,
  rollShopOffers,
  saveGhostBuildForRound,
  serializeGhostBuild,
  STARTING_GOLD,
  STARTING_HEARTS,
  type BackpackEvaluation,
  type GearItemId,
  type GearRotation,
  type GhostBuildSnapshot,
  type PlacedGear,
} from '../utils/gearArenaEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface GearArenaGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type GamePhase = 'TITLE' | 'SHOP' | 'BATTLE' | 'ROUND_RESULT' | 'VICTORY' | 'GAME_OVER';

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
const BATTLE_DURATION_SEC = 16;

// ---------------------------------------------------------------------------
// Synthesized Audio FX (Web Audio API)
// ---------------------------------------------------------------------------
type ArenaSfx = 'buy' | 'place' | 'zap' | 'boom' | 'crit' | 'win' | 'lose';

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
    g.gain.setValueAtTime(0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    return;
  }

  if (kind === 'zap' || kind === 'crit') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = kind === 'zap' ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(kind === 'zap' ? 1120 : 760, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'zap' ? 360 : 280, now + 0.07);
    g.gain.setValueAtTime(0.025, now);
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
    g.gain.setValueAtTime(0.045, now);
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
    g.gain.setValueAtTime(0.055, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  });
}

// ---------------------------------------------------------------------------
// Battle Canvas Entities
// ---------------------------------------------------------------------------
interface BattleEnemy {
  id: number;
  kind: 'chaser' | 'bruiser' | 'kiter';
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
}

interface BattleProjectile {
  fromPlayer: boolean;
  fromEnemy?: boolean;
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
}

export function GearArenaGameSection(_props: GearArenaGameSectionProps) {
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1') {
      return 'SHOP';
    }
    return 'TITLE';
  });

  const [round, setRound] = useState<number>(1);
  const [hearts, setHearts] = useState<number>(STARTING_HEARTS);
  const [gold, setGold] = useState<number>(STARTING_GOLD);
  const [winStreak, setWinStreak] = useState<number>(0);
  const [winsTotal, setWinsTotal] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);

  const [grid, setGrid] = useState<PlacedGear[]>(() => createStarterBackpack());
  const [shopOffers, setShopOffers] = useState<GearItemId[]>(() => rollShopOffers(1));
  const [shopLocked, setShopLocked] = useState<boolean>(false);
  const [holding, setHolding] = useState<HoldingItem | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const [statusNotice, setStatusNotice] = useState<string>(
    'Mua vũ khí / lõi năng lượng từ cửa hàng hoặc nhấp đồ trong ba lô để xoay [R] & tối ưu cộng hưởng!'
  );

  const [customGhost, setCustomGhost] = useState<GhostBuildSnapshot | null>(null);
  const [showGhostModal, setShowGhostModal] = useState<boolean>(false);
  const [ghostImportText, setGhostImportText] = useState<string>('');
  const [ghostImportError, setGhostImportError] = useState<string>('');
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  const [battleHud, setBattleHud] = useState({
    playerHp: 220,
    playerMaxHp: 220,
    ghostHp: 220,
    ghostMaxHp: 220,
    timeLeft: BATTLE_DURATION_SEC,
    kills: 0,
    damageDealt: 0,
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
    return getOpponentGhostForRound(round);
  }, [customGhost, round]);

  const ghostPlaced = useMemo(() => ghostGridToPlacedGears(activeGhost), [activeGhost]);
  const ghostEval = useMemo(() => evaluateBackpackSynergies(ghostPlaced), [ghostPlaced]);

  // Sync body state attribute for testability
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (phase === 'TITLE') document.body.dataset.state = 'title';
    else if (phase === 'VICTORY' || phase === 'GAME_OVER') document.body.dataset.state = 'gameover';
    else document.body.dataset.state = 'playing';
  }, [phase]);

  // Start / Reset Run
  const startNewRun = useCallback(() => {
    setRound(1);
    setHearts(STARTING_HEARTS);
    setGold(STARTING_GOLD);
    setWinStreak(0);
    setWinsTotal(0);
    setGrid(createStarterBackpack());
    setShopOffers(rollShopOffers(1));
    setShopLocked(false);
    setHolding(null);
    setHoverCell(null);
    setCustomGhost(null);
    setLastSummary(null);
    setStatusNotice(
      'Vòng 1/10 · Mua trang bị & sắp xếp vào ba lô 5×5. Đặt Lõi Quá Tải cạnh vũ khí để ×2 tốc độ bắn!'
    );
    setPhase('SHOP');
    playArenaSfx(ensureAudio(), 'place', muted);
  }, [ensureAudio, muted]);

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
    setStatusNotice(`Đã mua ${entry.name} (${entry.width}×${entry.height})! Nhấp ô trống trên ba lô để lắp (phím [R] để xoay).`);
    playArenaSfx(ensureAudio(), 'buy', muted);
  };

  const handleRefreshShop = () => {
    if (phase !== 'SHOP') return;
    if (gold < 2) {
      setStatusNotice('Cần 2G để làm mới cửa hàng!');
      return;
    }
    setGold((g) => g - 2);
    setShopLocked(false);
    setShopOffers(rollShopOffers(round));
    setStatusNotice('Đã làm mới kệ trang bị (-2G).');
    playArenaSfx(ensureAudio(), 'place', muted);
  };

  const handleGridCellClick = (col: number, row: number) => {
    if (phase !== 'SHOP') return;

    // 1. If currently holding an item, try placing it at (col, row)
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

    // 2. Otherwise pick up an existing item occupying (col, row)
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
      // Auto-return or alert
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

    // Save current build as a real Ghost Build JSON in localStorage
    const snapshot = serializeGhostBuild('Thuận Lê Mech', round, grid);
    saveGhostBuildForRound(snapshot);

    setBattleHud({
      playerHp: playerEval.maxHp,
      playerMaxHp: playerEval.maxHp,
      ghostHp: ghostEval.maxHp,
      ghostMaxHp: ghostEval.maxHp,
      timeLeft: BATTLE_DURATION_SEC,
      kills: 0,
      damageDealt: 0,
    });
    setPhase('BATTLE');
    playArenaSfx(ensureAudio(), 'zap', muted);
  };

  // -------------------------------------------------------------------------
  // 60FPS Neon Vector Auto-Battle Loop (Phase 2: Horde + Ghost PvP Duel)
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

    const sim = {
      timeLeft: BATTLE_DURATION_SEC,
      spawnTimer: 0.25,
      shakeTrauma: 0,
      hitstop: 0,
      nextEnemyId: 1,
      totalDamage: 0,
      kills: 0,
      player: {
        x: 240,
        y: ARENA_H / 2,
        vx: 0,
        vy: 0,
        hp: playerEval.maxHp,
        maxHp: playerEval.maxHp,
        armor: playerEval.armor,
        regen: playerEval.hpRegen,
        hitFlash: 0,
        weaponTimers: playerEval.weapons.map(() => 0.1 + Math.random() * 0.15),
      },
      ghost: {
        x: ARENA_W - 220,
        y: ARENA_H / 2,
        vx: 0,
        vy: 0,
        hp: ghostEval.maxHp,
        maxHp: ghostEval.maxHp,
        armor: ghostEval.armor,
        regen: ghostEval.hpRegen,
        hitFlash: 0,
        defeated: false,
        weaponTimers: ghostEval.weapons.map(() => 0.25 + Math.random() * 0.2),
      },
      enemies: [] as BattleEnemy[],
      projectiles: [] as BattleProjectile[],
      bolts: [] as LightningBoltFx[],
      explosions: [] as ExplosionFx[],
      dmgFxs: [] as FloatingDmgFx[],
    };

    const spawnEnemy = () => {
      const side = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = Math.random() * ARENA_W;
        y = 16;
      } else if (side === 1) {
        x = ARENA_W - 16;
        y = Math.random() * ARENA_H;
      } else if (side === 2) {
        x = Math.random() * ARENA_W;
        y = ARENA_H - 16;
      } else {
        x = 16;
        y = Math.random() * ARENA_H;
      }

      const roll = Math.random();
      const kind: BattleEnemy['kind'] =
        roll < 0.6 ? 'chaser' : roll < 0.85 ? 'bruiser' : 'kiter';
      const roundScale = 1 + (round - 1) * 0.22;
      const baseHp = kind === 'bruiser' ? 75 : kind === 'kiter' ? 42 : 34;
      const hp = Math.round(baseHp * roundScale);
      sim.enemies.push({
        id: sim.nextEnemyId++,
        kind,
        x,
        y,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        radius: kind === 'bruiser' ? 15 : kind === 'kiter' ? 12 : 10,
        speed: kind === 'chaser' ? 88 + round * 3 : kind === 'kiter' ? 68 : 54,
        shootCd: 1.5 + Math.random(),
        hitFlash: 0,
      });
    };

    // Pre-seed 5 enemies so the arena is lively immediately
    for (let i = 0; i < 5; i += 1) spawnEnemy();

    const finishCombat = (won: boolean, reason: string) => {
      if (finished) return;
      finished = true;
      const goldEarned = getRoundGoldReward(round) + (won ? 3 + Math.min(3, winStreak) : 0);
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

      if (won) {
        playArenaSfx(ensureAudio(), 'win', muted);
        setWinStreak((s) => s + 1);
        setWinsTotal((w) => w + 1);
        setGold((g) => g + goldEarned);
        if (round >= MAX_ROUNDS) {
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
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      if (sim.hitstop > 0) {
        sim.hitstop = Math.max(0, sim.hitstop - rawDt);
      }
      const dt = sim.hitstop > 0 ? rawDt * 0.2 : rawDt;

      sim.timeLeft = Math.max(0, sim.timeLeft - dt);
      sim.shakeTrauma = Math.max(0, sim.shakeTrauma - rawDt * 2.2);

      // Spawn horde waves (capped at 42 enemies for crisp readability)
      sim.spawnTimer -= dt;
      if (sim.spawnTimer <= 0 && sim.enemies.length < 42) {
        sim.spawnTimer = Math.max(0.28, 0.72 - round * 0.04);
        spawnEnemy();
        if (round >= 4 && sim.enemies.length < 36) spawnEnemy();
      }

      // Player movement (WASD/Arrows override or intelligent kiting auto-pilot)
      const keys = keysHeldRef.current;
      let moveX = 0;
      let moveY = 0;
      if (keys.has('w') || keys.has('arrowup')) moveY -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveY += 1;
      if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveX += 1;

      if (moveX === 0 && moveY === 0) {
        // Auto-pilot orbit around arena center while avoiding closest threats
        const angle = now * 0.0011;
        const desiredX = ARENA_W * 0.45 + Math.cos(angle) * 160;
        const desiredY = ARENA_H * 0.5 + Math.sin(angle * 1.3) * 115;
        let steerX = desiredX - sim.player.x;
        let steerY = desiredY - sim.player.y;

        for (const en of sim.enemies) {
          const dx = sim.player.x - en.x;
          const dy = sim.player.y - en.y;
          const d = Math.hypot(dx, dy);
          if (d > 1 && d < 95) {
            steerX += (dx / d) * (95 - d) * 3.5;
            steerY += (dy / d) * (95 - d) * 3.5;
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

      sim.player.x = Math.max(32, Math.min(ARENA_W - 32, sim.player.x + moveX * 155 * dt));
      sim.player.y = Math.max(32, Math.min(ARENA_H - 32, sim.player.y + moveY * 155 * dt));
      sim.player.hp = Math.min(sim.player.maxHp, sim.player.hp + sim.player.regen * dt);
      sim.player.hitFlash = Math.max(0, sim.player.hitFlash - rawDt);

      // Ghost Mech AI Movement & Regen
      if (!sim.ghost.defeated) {
        const gAngle = -now * 0.00095 + 1.8;
        const gTargetX = ARENA_W * 0.62 + Math.cos(gAngle) * 150;
        const gTargetY = ARENA_H * 0.5 + Math.sin(gAngle * 1.2) * 125;
        const gx = gTargetX - sim.ghost.x;
        const gy = gTargetY - sim.ghost.y;
        const gm = Math.hypot(gx, gy) || 1;
        sim.ghost.x = Math.max(36, Math.min(ARENA_W - 36, sim.ghost.x + (gx / gm) * 125 * dt));
        sim.ghost.y = Math.max(36, Math.min(ARENA_H - 36, sim.ghost.y + (gy / gm) * 125 * dt));
        sim.ghost.hp = Math.min(sim.ghost.maxHp, sim.ghost.hp + sim.ghost.regen * dt);
        sim.ghost.hitFlash = Math.max(0, sim.ghost.hitFlash - rawDt);
      }

      // Helper: fire weapons from a mech
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
          timers[i] = 1 / Math.max(0.2, w.fireRate);

          // Target selection
          let tx = isPlayer ? sim.ghost.x : sim.player.x;
          let ty = isPlayer ? sim.ghost.y : sim.player.y;
          let bestDist = isPlayer && sim.ghost.defeated ? Infinity : Math.hypot(tx - mechX, ty - mechY) * 0.85;

          if (isPlayer) {
            for (const en of sim.enemies) {
              const d = Math.hypot(en.x - mechX, en.y - mechY);
              if (d < bestDist) {
                bestDist = d;
                tx = en.x;
                ty = en.y;
              }
            }
          }

          if (!Number.isFinite(bestDist) && sim.enemies.length === 0) continue;
          const dx = tx - mechX;
          const dy = ty - mechY;
          const dist = Math.hypot(dx, dy) || 1;
          const isCrit = Math.random() < w.critChance;
          const dmg = Math.round(w.damage * (isCrit ? w.critMult : 1));

          sim.projectiles.push({
            fromPlayer: isPlayer,
            x: mechX + (dx / dist) * 16,
            y: mechY + (dy / dist) * 16,
            vx: (dx / dist) * w.projectileSpeed,
            vy: (dy / dist) * w.projectileSpeed,
            damage: isPlayer ? dmg : Math.round(dmg * 0.68), // Balanced Ghost duel pacing
            isCrit,
            aoeRadius: w.aoeRadius,
            homing: w.itemId === 'homing_missile',
            pierce: w.itemId === 'railgun' || w.itemId === 'chain_saw' ? 2 : 0,
            chainLightning: w.chainLightning,
            color: w.itemId === 'chain_saw' ? '#FBBF24' : w.color,
            radius: w.itemId === 'grenade_launcher' ? 7 : w.itemId === 'railgun' ? 6 : w.itemId === 'chain_saw' ? 9 : 4.5,
            life: 1.9,
          });
        }
      };

      fireMechWeapons(true, sim.player.x, sim.player.y, playerEval.weapons, sim.player.weaponTimers);
      if (!sim.ghost.defeated) {
        fireMechWeapons(false, sim.ghost.x, sim.ghost.y, ghostEval.weapons, sim.ghost.weaponTimers);
      }

      // Enemy Movement & Attacks
      for (const en of sim.enemies) {
        en.hitFlash = Math.max(0, en.hitFlash - rawDt);
        const dx = sim.player.x - en.x;
        const dy = sim.player.y - en.y;
        const dist = Math.hypot(dx, dy) || 1;

        if (en.kind === 'kiter' && dist < 175) {
          // Strafe perpendicular
          en.x += (-dy / dist) * en.speed * dt;
          en.y += (dx / dist) * en.speed * dt;
        } else {
          en.x += (dx / dist) * en.speed * dt;
          en.y += (dy / dist) * en.speed * dt;
        }

        if (en.kind === 'kiter') {
          en.shootCd -= dt;
          if (en.shootCd <= 0) {
            en.shootCd = 2.1;
            sim.projectiles.push({
              fromPlayer: false,
              fromEnemy: true,
              x: en.x,
              y: en.y,
              vx: (dx / dist) * 240,
              vy: (dy / dist) * 240,
              damage: 10 + round,
              isCrit: false,
              aoeRadius: 0,
              homing: false,
              pierce: 0,
              chainLightning: false,
              color: '#C084FC',
              radius: 4,
              life: 2.2,
            });
          }
        }

        // Contact damage with Player Mech
        if (dist < en.radius + 17) {
          const contactDmg = Math.max(4, 14 + round * 1.5 - sim.player.armor) * dt * 2.2;
          sim.player.hp -= contactDmg;
          sim.player.hitFlash = 0.08;
        }
      }

      // Update Projectiles & Collisions
      const applyPlayerHit = (
        x: number,
        y: number,
        baseDmg: number,
        isCrit: boolean,
        aoe: number,
        hasChain: boolean,
        color: string
      ) => {
        if (aoe > 0) {
          sim.explosions.push({ x, y, radius: aoe, color, life: 0.24, maxLife: 0.24 });
          if (aoe >= 40) {
            sim.shakeTrauma = Math.min(1, sim.shakeTrauma + 0.16);
            playArenaSfx(ensureAudio(), 'boom', muted);
          }
          for (const en of sim.enemies) {
            if (Math.hypot(en.x - x, en.y - y) <= aoe + en.radius) {
              en.hp -= baseDmg;
              en.hitFlash = 0.07;
              sim.totalDamage += baseDmg;
            }
          }
          if (!sim.ghost.defeated && Math.hypot(sim.ghost.x - x, sim.ghost.y - y) <= aoe + 18) {
            sim.ghost.hp -= baseDmg;
            sim.ghost.hitFlash = 0.08;
            sim.totalDamage += baseDmg;
          }
        }

        if (isCrit) {
          sim.shakeTrauma = Math.min(1, sim.shakeTrauma + 0.12);
          playArenaSfx(ensureAudio(), 'crit', muted);
        }

        // Chain Lightning Jumps Across up to 4 Nearby Targets!
        if (hasChain) {
          const pts: { x: number; y: number }[] = [{ x, y }];
          let cx = x;
          let cy = y;
          const hitIds = new Set<number>();
          for (let hop = 0; hop < 4; hop += 1) {
            let bestEn: BattleEnemy | null = null;
            let bestD = 260;
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
            sim.dmgFxs.push({
              x: bestEn.x,
              y: bestEn.y - 12,
              text: `⚡${zapDmg}`,
              color: '#38BDF8',
              isCrit: false,
              life: 0.48,
              maxLife: 0.48,
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
            sim.bolts.push({ points: pts, life: 0.18, maxLife: 0.18, color: '#38BDF8' });
            playArenaSfx(ensureAudio(), 'zap', muted);
          }
        }
      };

      const nextProjectiles: BattleProjectile[] = [];
      for (const p of sim.projectiles) {
        p.life -= dt;
        if (p.life <= 0) continue;

        if (p.homing && p.fromPlayer) {
          const target = !sim.ghost.defeated
            ? sim.ghost
            : sim.enemies[0];
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
          // Hit Ghost Mech
          if (!sim.ghost.defeated && Math.hypot(sim.ghost.x - p.x, sim.ghost.y - p.y) <= 20 + p.radius) {
            const net = Math.max(4, Math.round(p.damage - sim.ghost.armor * 0.6));
            sim.ghost.hp -= net;
            sim.ghost.hitFlash = 0.08;
            sim.totalDamage += net;
            sim.dmgFxs.push({
              x: sim.ghost.x + (Math.random() - 0.5) * 14,
              y: sim.ghost.y - 22,
              text: p.isCrit ? `CRIT ${net}!` : `${net}`,
              color: p.isCrit ? '#FACC15' : '#F8FAFC',
              isCrit: p.isCrit,
              life: 0.55,
              maxLife: 0.55,
            });
            applyPlayerHit(p.x, p.y, p.damage, p.isCrit, p.aoeRadius, p.chainLightning, p.color);
            if (p.pierce > 0) p.pierce -= 1;
            else consumed = true;
          }

          // Hit Swarm Enemies
          if (!consumed) {
            for (const en of sim.enemies) {
              if (en.hp <= 0) continue;
              if (Math.hypot(en.x - p.x, en.y - p.y) <= en.radius + p.radius) {
                en.hp -= p.damage;
                en.hitFlash = 0.08;
                sim.totalDamage += p.damage;
                sim.dmgFxs.push({
                  x: en.x + (Math.random() - 0.5) * 10,
                  y: en.y - 14,
                  text: p.isCrit ? `${p.damage}!` : `${p.damage}`,
                  color: p.isCrit ? '#FACC15' : '#E2E8F0',
                  isCrit: p.isCrit,
                  life: 0.45,
                  maxLife: 0.45,
                });
                applyPlayerHit(p.x, p.y, p.damage, p.isCrit, p.aoeRadius, p.chainLightning, p.color);
                if (p.pierce > 0) p.pierce -= 1;
                else {
                  consumed = true;
                  break;
                }
              }
            }
          }
        } else {
          // Ghost / Enemy projectile hitting Player
          if (Math.hypot(sim.player.x - p.x, sim.player.y - p.y) <= 18 + p.radius) {
            const net = Math.max(3, Math.round(p.damage - sim.player.armor * 0.7));
            sim.player.hp -= net;
            sim.player.hitFlash = 0.08;
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
            radius: en.radius * 2.1,
            color: en.kind === 'bruiser' ? '#F59E0B' : '#FB7185',
            life: 0.2,
            maxLife: 0.2,
          });
        } else {
          aliveEnemies.push(en);
        }
      }
      sim.enemies = aliveEnemies;

      // Check Ghost KO
      if (!sim.ghost.defeated && sim.ghost.hp <= 0) {
        sim.ghost.defeated = true;
        sim.ghost.hp = 0;
        sim.hitstop = 0.06;
        sim.shakeTrauma = 0.65;
        sim.explosions.push({
          x: sim.ghost.x,
          y: sim.ghost.y,
          radius: 75,
          color: '#F43F5E',
          life: 0.45,
          maxLife: 0.45,
        });
        playArenaSfx(ensureAudio(), 'boom', muted);
      }

      // Tick visual FX
      sim.bolts = sim.bolts
        .map((b) => ({ ...b, life: b.life - rawDt }))
        .filter((b) => b.life > 0);
      sim.explosions = sim.explosions
        .map((ex) => ({ ...ex, life: ex.life - rawDt }))
        .filter((ex) => ex.life > 0);
      sim.dmgFxs = sim.dmgFxs
        .map((fx) => ({ ...fx, y: fx.y - rawDt * 24, life: fx.life - rawDt }))
        .filter((fx) => fx.life > 0);

      // Check End Conditions
      if (sim.player.hp <= 0) {
        finishCombat(false, 'Cỗ máy Ba Lô đã quá tải và phát nổ trước hỏa lực địch!');
        return;
      }
      if (sim.ghost.defeated && sim.timeLeft <= 6) {
        finishCombat(true, `Đã hạ gục hoàn toàn Bóng Ma "${activeGhost.name}" & làm chủ đấu trường!`);
        return;
      }
      if (sim.timeLeft <= 0) {
        const playerPct = sim.player.hp / sim.player.maxHp;
        const ghostPct = sim.ghost.defeated ? 0 : sim.ghost.hp / sim.ghost.maxHp;
        if (sim.ghost.defeated || playerPct >= ghostPct) {
          finishCombat(
            true,
            sim.ghost.defeated
              ? `Hạ gục Bóng Ma "${activeGhost.name}" & sống sót hết 16s!`
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
      // Canvas 2D Render (Neon Vector Geometric Arena)
      // -------------------------------------------------------------------
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.save();
        const shakePx = sim.shakeTrauma * sim.shakeTrauma * 9;
        if (shakePx > 0.3) {
          ctx.translate((Math.random() - 0.5) * shakePx, (Math.random() - 0.5) * shakePx);
        }

        ctx.fillStyle = '#060A13';
        ctx.fillRect(0, 0, ARENA_W, ARENA_H);

        // Tactical cyber grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
        ctx.lineWidth = 1;
        for (let gx = 40; gx < ARENA_W; gx += 46) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, ARENA_H);
          ctx.stroke();
        }
        for (let gy = 40; gy < ARENA_H; gy += 46) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(ARENA_W, gy);
          ctx.stroke();
        }

        // Center radar ring
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.12)';
        ctx.beginPath();
        ctx.arc(ARENA_W / 2, ARENA_H / 2, 130, 0, Math.PI * 2);
        ctx.stroke();

        // Explosions
        for (const ex of sim.explosions) {
          const p = 1 - ex.life / ex.maxLife;
          ctx.save();
          ctx.strokeStyle = ex.color;
          ctx.globalAlpha = 1 - p;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ex.x, ex.y, Math.max(4, ex.radius * (0.35 + p * 0.75)), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Enemies (3 distinct geometric silhouettes)
        for (const en of sim.enemies) {
          ctx.save();
          ctx.translate(en.x, en.y);
          ctx.fillStyle =
            en.hitFlash > 0
              ? '#FFFFFF'
              : en.kind === 'bruiser'
                ? '#F59E0B'
                : en.kind === 'kiter'
                  ? '#A855F7'
                  : '#FB7185';
          if (en.kind === 'bruiser') {
            ctx.beginPath();
            for (let k = 0; k < 6; k += 1) {
              const a = (Math.PI / 3) * k;
              const rx = Math.cos(a) * en.radius;
              const ry = Math.sin(a) * en.radius;
              if (k === 0) ctx.moveTo(rx, ry);
              else ctx.lineTo(rx, ry);
            }
            ctx.closePath();
            ctx.fill();
          } else if (en.kind === 'kiter') {
            ctx.beginPath();
            ctx.moveTo(0, -en.radius);
            ctx.lineTo(en.radius, en.radius);
            ctx.lineTo(-en.radius, en.radius);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.rotate(now * 0.004);
            ctx.fillRect(-en.radius * 0.75, -en.radius * 0.75, en.radius * 1.5, en.radius * 1.5);
          }
          ctx.restore();
        }

        // Projectiles with distinct weapon trails & sawblade rings
        for (const p of sim.projectiles) {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.strokeStyle = p.color;
          if (p.radius >= 8.5) {
            // Spinning Sawblade
            ctx.translate(p.x, p.y);
            ctx.rotate(now * 0.02);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillRect(-p.radius, -2, p.radius * 2, 4);
            ctx.fillRect(-2, -p.radius, 4, p.radius * 2);
          } else {
            // Laser / Missile / Grenade motion trail
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = Math.max(2, p.radius * 0.9);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - p.vx * 0.032, p.y - p.vy * 0.032);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Chain Lightning Arcs
        for (const b of sim.bolts) {
          ctx.save();
          ctx.strokeStyle = b.color;
          ctx.lineWidth = 4.5;
          ctx.globalAlpha = (b.life / b.maxLife) * 0.35;
          ctx.beginPath();
          for (let idx = 0; idx < b.points.length; idx += 1) {
            const pt = b.points[idx];
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else {
              const prev = b.points[idx - 1];
              const mx = (prev.x + pt.x) / 2 + (Math.random() - 0.5) * 18;
              const my = (prev.y + pt.y) / 2 + (Math.random() - 0.5) * 18;
              ctx.lineTo(mx, my);
              ctx.lineTo(pt.x, pt.y);
            }
          }
          ctx.stroke();
          ctx.lineWidth = 2;
          ctx.globalAlpha = b.life / b.maxLife;
          ctx.stroke();
          ctx.restore();
        }

        // Draw Player Mech + Orbiting Weapon Pods
        ctx.save();
        ctx.translate(sim.player.x, sim.player.y);
        for (let wi = 0; wi < playerEval.weapons.length; wi += 1) {
          const ang = now * 0.002 + (wi * Math.PI * 2) / Math.max(1, playerEval.weapons.length);
          const px = Math.cos(ang) * 26;
          const py = Math.sin(ang) * 26;
          ctx.fillStyle = playerEval.weapons[wi].color;
          ctx.beginPath();
          ctx.arc(px, py, 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = playerEval.chainLightningActive ? '#38BDF8' : '#22D3EE';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = sim.player.hitFlash > 0 ? '#FFFFFF' : '#0E7490';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#E0F2FE';
        ctx.font = '700 9px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('BẠN', 0, -24);
        ctx.restore();

        // Draw Ghost Rival Mech + Orbiting Weapon Pods
        if (!sim.ghost.defeated) {
          ctx.save();
          ctx.translate(sim.ghost.x, sim.ghost.y);
          for (let wi = 0; wi < ghostEval.weapons.length; wi += 1) {
            const ang = -now * 0.002 + (wi * Math.PI * 2) / Math.max(1, ghostEval.weapons.length);
            const px = Math.cos(ang) * 26;
            const py = Math.sin(ang) * 26;
            ctx.fillStyle = '#FDA4AF';
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = '#F43F5E';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = sim.ghost.hitFlash > 0 ? '#FFFFFF' : '#881337';
          ctx.beginPath();
          ctx.moveTo(0, -20);
          ctx.lineTo(19, 0);
          ctx.lineTo(0, 20);
          ctx.lineTo(-19, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FDA4AF';
          ctx.font = '700 9px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('BÓNG MA PvP', 0, -25);
          ctx.restore();
        }

        // Floating Damage Numbers
        for (const fx of sim.dmgFxs) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, fx.life / (fx.maxLife * 0.6));
          ctx.font = fx.isCrit ? '800 13px ui-monospace, monospace' : '700 10px ui-monospace, monospace';
          ctx.fillStyle = fx.color;
          ctx.textAlign = 'center';
          ctx.fillText(fx.text, fx.x, fx.y);
          ctx.restore();
        }

        ctx.restore();
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
  }, [activeGhost.name, ensureAudio, ghostEval, hearts, muted, phase, playerEval, round, winStreak]);

  // -------------------------------------------------------------------------
  // Render: TITLE SCREEN
  // -------------------------------------------------------------------------
  if (phase === 'TITLE') {
    return (
      <section
        id="gear-arena-section"
        aria-label="Đấu Trường Ba Lô Cơ Khí — Gear-Grid Auto Arena"
        className="rounded-2xl border border-[#1E2E4A] bg-[#070B14] text-[#F1F5F9] p-5 sm:p-7 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-mono tracking-wider text-cyan-400">
              TACTICAL 5×5 BACKPACK + HORDE AUTO-ARENA + GHOST PvP
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              Đấu Trường Ba Lô Cơ Khí
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Sắp xếp vũ khí, Lõi Quá Tải &amp; mạch Pin Hạt Nhân trong ba lô <strong>5×5</strong> để kích hoạt cộng hưởng phá game — rồi lao vào đấu trường càn quét hàng trăm quái vật và nghiền nát <strong>Bóng Ma PvP</strong> của người chơi khác!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#0D1526] border border-[#1E2E4A] space-y-1">
                <p className="font-bold text-rose-400">🔥 Lõi Quá Tải ×2</p>
                <p className="text-slate-300 leading-snug">Đặt cạnh Súng Phóng Lựu hoặc Railgun để nhân đôi tốc độ bắn.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1526] border border-[#1E2E4A] space-y-1">
                <p className="font-bold text-cyan-400">⚡ Mạch Sét Lan ×3</p>
                <p className="text-slate-300 leading-snug">Nối Pin Hạt Nhân qua Dây Dẫn chạm ≥3 vũ khí sẽ phóng Sét Toàn Màn.</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1526] border border-[#1E2E4A] space-y-1">
                <p className="font-bold text-amber-300">👻 Đấu Bóng Ma JSON</p>
                <p className="text-slate-300 leading-snug">Đấu 10 vòng sinh tồn với Ghost Build lưu gọn qua JSON.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                data-testid="gear-start-btn"
                onClick={startNewRun}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Lắp Ba Lô &amp; Ra Trận (10 Vòng)</span>
              </button>
              <span className="text-xs text-slate-400">
                Nhấn [Enter] / [Space] để bắt đầu · [R] xoay vũ khí · [WASD] né tự chọn
              </span>
            </div>
          </div>

          {/* Bespoke SVG Emblem Centerpiece */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] aspect-square rounded-2xl border border-cyan-500/30 bg-[#0D1526] p-5 flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden="true">
                <defs>
                  <linearGradient id="gearGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <rect x="20" y="20" width="200" height="200" rx="22" fill="#070B14" stroke="#1E2E4A" strokeWidth="3" />
                {/* 5x5 subtle cells */}
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
                {/* Highlighted synergy circuit */}
                <rect x="36" y="104" width="30" height="30" rx="6" fill="#10B981" fillOpacity="0.28" stroke="#10B981" strokeWidth="2.2" />
                <rect x="70" y="104" width="30" height="30" rx="6" fill="#38BDF8" fillOpacity="0.28" stroke="#38BDF8" strokeWidth="2.2" />
                <rect x="104" y="70" width="64" height="30" rx="6" fill="#EC4899" fillOpacity="0.28" stroke="#EC4899" strokeWidth="2.2" />
                <rect x="104" y="104" width="30" height="30" rx="6" fill="#EF4444" fillOpacity="0.32" stroke="#EF4444" strokeWidth="2.5" />
                <rect x="138" y="104" width="30" height="64" rx="6" fill="#F97316" fillOpacity="0.3" stroke="#F97316" strokeWidth="2.5" />
                {/* Glowing electric conduit lines */}
                <path d="M51 119 L85 119 L119 119 L153 119 M119 119 L119 85" stroke="url(#gearGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
                <circle cx="51" cy="119" r="5" fill="#6EE7B7" />
                <circle cx="119" cy="119" r="6" fill="#FCA5A5" />
                <text x="120" y="210" textAnchor="middle" fill="#67E8F9" fontSize="11" fontFamily="monospace" fontWeight="700">
                  OVERCLOCK ×2 · CHAIN LIGHTNING ⚡
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
  return (
    <section
      id="gear-arena-section"
      aria-label="Đấu Trường Ba Lô Cơ Khí"
      className="relative rounded-2xl border border-[#1E2E4A] bg-[#070B14] text-[#F1F5F9] p-3.5 sm:p-5 shadow-sm"
    >
      {/* Top Unified HUD */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 pb-3 border-b border-[#1E2E4A]">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs tabular-nums">
          <button
            type="button"
            onClick={() => setPhase('TITLE')}
            className="px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 text-xs font-medium cursor-pointer"
          >
            Menu
          </button>

          <div className="whitespace-nowrap">
            <span className="text-slate-400 text-[11px] mr-1">VÒNG</span>
            <strong className="font-mono text-cyan-300">{round}/{MAX_ROUNDS}</strong>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap" aria-label={`Còn ${hearts} tim`}>
            {Array.from({ length: STARTING_HEARTS }).map((_, idx) => (
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
              ⚡ SÉT LAN TOÀN MÀN
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 text-xs font-mono text-slate-200 cursor-pointer whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Ghost JSON</span>
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            type="button"
            onClick={startNewRun}
            aria-label="Chơi lại từ Vòng 1"
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#0D1526] hover:border-cyan-400 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PHASE 1: TACTICAL 5x5 BACKPACK & SHOP */}
      {phase === 'SHOP' && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 Cols: 5x5 Backpack Grid + Holding Bar + Live Synergies */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Ba Lô Cơ Khí (5×5)</span>
                  <span className="text-xs font-mono text-cyan-400">
                    {playerEval.weapons.length} vũ khí · {playerEval.overclockedCount} quá tải
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Nhấp món đồ đang có để nhấc lên/xoay [R], hoặc nhấp ô trống để đặt trang bị vừa mua.
                </p>
              </div>
              {holding && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    data-testid="gear-rotate-btn"
                    onClick={() =>
                      setHolding((prev) =>
                        prev ? { ...prev, rotation: prev.rotation === 0 ? 90 : 0 } : prev
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-200 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Xoay [R]</span>
                  </button>
                  <button
                    type="button"
                    data-testid="gear-sell-btn"
                    onClick={() => handleCancelOrRefundHolding(holding.fromGrid ? 'sell' : 'cancel')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-400/50 text-rose-300 text-xs font-semibold cursor-pointer"
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

            {/* Interactive Holding Preview Strip */}
            {holding && (
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-bold font-mono">
                    ĐANG CẦM
                  </span>
                  <strong className="text-white">
                    {getGearCatalogEntry(holding.itemId).name}
                  </strong>
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

            {/* 5x5 Grid Board */}
            <div className="relative mx-auto w-full max-w-[440px] aspect-square p-2.5 rounded-2xl border border-[#1E2E4A] bg-[#0D1526]">
              {/* Base 25 clickable cells */}
              <div
                className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full"
                onMouseLeave={() => setHoverCell(null)}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
                  const col = idx % GRID_SIZE;
                  const row = Math.floor(idx / GRID_SIZE);

                  // Check placement hover preview & orthogonal synergy aura
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
                      if (entry.category === 'core' || entry.category === 'conductor') {
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
                      className={`rounded-xl border transition-colors cursor-pointer ${
                        previewState === 'valid'
                          ? 'bg-emerald-500/30 border-emerald-400'
                          : previewState === 'invalid'
                            ? 'bg-rose-500/30 border-rose-400'
                            : previewState === 'synergy'
                              ? 'bg-amber-500/15 border-amber-400/70 border-dashed'
                              : 'bg-[#070B14] border-[#1E2E4A] hover:border-cyan-500/60'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Placed Multi-Cell Polyominoes Layer */}
              <div className="pointer-events-none absolute inset-2.5 grid grid-cols-5 grid-rows-5 gap-1.5">
                {grid.map((g) => {
                  const entry = getGearCatalogEntry(g.itemId);
                  const dim = getRotatedDimensions(g.itemId, g.rotation);
                  const isEnergized = playerEval.energizedUids.includes(g.uid);
                  const weaponSpec = playerEval.weapons.find((w) => w.uid === g.uid);
                  return (
                    <div
                      key={g.uid}
                      style={{
                        gridColumn: `${g.col + 1} / span ${dim.width}`,
                        gridRow: `${g.row + 1} / span ${dim.height}`,
                        borderColor: weaponSpec?.chainLightning
                          ? '#22D3EE'
                          : weaponSpec?.overclocked
                            ? '#EF4444'
                            : entry.color,
                      }}
                      className={`rounded-xl border-2 p-1.5 flex flex-col justify-between bg-[#111C33]/95 shadow-sm relative overflow-hidden ${
                        isEnergized && playerEval.chainLightningActive ? 'ring-2 ring-cyan-400/60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
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

                      <div className="flex items-end justify-between gap-1 text-[9px] font-mono">
                        <span className="text-slate-300">
                          {weaponSpec ? `${weaponSpec.dps}dps` : entry.category === 'core' ? 'CORE' : entry.category === 'conductor' ? 'DÂY' : 'DEF'}
                        </span>
                        {weaponSpec?.chainLightning && (
                          <span className="text-cyan-300 font-bold">⚡SÉT</span>
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
                        strokeOpacity="0.85"
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Active Synergies Readout */}
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

          {/* Right 5 Cols: Shop + Opponent Ghost PvP + FIGHT CTA */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Shop Shelf */}
            <div className="rounded-2xl border border-[#1E2E4A] bg-[#0D1526] p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">Cửa Hàng Cơ Khí</h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShopLocked((l) => !l)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
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
                    onClick={handleRefreshShop}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111C33] border border-[#1E2E4A] hover:border-cyan-400 text-[11px] font-semibold text-cyan-300 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Làm Mới (2G)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {shopOffers.map((itemId, idx) => {
                  const entry = getGearCatalogEntry(itemId);
                  const canAfford = gold >= entry.cost;
                  return (
                    <button
                      key={`${itemId}-${idx}`}
                      type="button"
                      data-testid={`gear-shop-offer-${idx}`}
                      onClick={() => handleBuyOffer(itemId, idx)}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer space-y-1 ${
                        canAfford
                          ? 'bg-[#070B14] border-[#1E2E4A] hover:border-cyan-400'
                          : 'bg-[#070B14]/60 border-[#1E2E4A] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs truncate" style={{ color: entry.accent }}>
                          {entry.name}
                        </strong>
                        <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                          {entry.cost}G
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">
                        Kích thước {entry.width}×{entry.height} · Tier {entry.tier}
                      </p>
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

            {/* Primary FIGHT Button */}
            <button
              type="button"
              data-testid="gear-fight-btn"
              onClick={startBattle}
              className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Swords className="w-5 h-5" />
              <span>CHIẾN ĐẤU! (Vòng {round}/{MAX_ROUNDS})</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: LIVE NEON VECTOR AUTO-BATTLE CANVAS */}
      {phase === 'BATTLE' && (
        <div className="mt-3 space-y-2.5">
          {/* Player vs Ghost PvP Health Bars (Zero backdrop-blur) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center text-xs tabular-nums">
            <div className="p-2.5 rounded-xl bg-[#0D1526] border border-cyan-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-cyan-300">Cỗ Máy Của Bạn</strong>
                <span className="font-mono text-white">
                  {battleHud.playerHp}/{battleHud.playerMaxHp} HP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${Math.max(0, (battleHud.playerHp / Math.max(1, battleHud.playerMaxHp)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 py-1.5 px-3 rounded-xl bg-[#0D1526] border border-[#1E2E4A] font-mono">
              <div>
                <span className="text-slate-400 text-[10px] block text-center">THỜI GIAN</span>
                <strong className="text-base text-amber-300">{battleHud.timeLeft}s</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block text-center">TIÊU DIỆT</span>
                <strong className="text-base text-emerald-300">{battleHud.kills}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block text-center">SÁT THƯƠNG</span>
                <strong className="text-base text-white">{battleHud.damageDealt}</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#120D1D] border border-rose-500/40 space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-rose-300 truncate">{activeGhost.name}</strong>
                <span className="font-mono text-white">
                  {battleHud.ghostHp}/{battleHud.ghostMaxHp} HP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-rose-500 transition-all duration-100"
                  style={{ width: `${Math.max(0, (battleHud.ghostHp / Math.max(1, battleHud.ghostMaxHp)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={ARENA_W}
            height={ARENA_H}
            data-testid="gear-arena-canvas"
            className="w-full aspect-[920/500] h-auto rounded-xl border border-[#1E2E4A]"
            aria-label="Đấu trường chiến đấu Ba Lô Cơ Khí"
          />
        </div>
      )}

      {/* ROUND RESULT / VICTORY / GAME OVER MODAL */}
      {(phase === 'ROUND_RESULT' || phase === 'VICTORY' || phase === 'GAME_OVER') && lastSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={phase === 'VICTORY' ? 'Chiến thắng Vòng 10' : phase === 'GAME_OVER' ? 'Thất bại' : 'Kết quả vòng đấu'}
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
                  VÒNG {round}/{MAX_ROUNDS} · {phase === 'VICTORY' ? 'VÔ ĐỊCH ĐẤU TRƯỜNG!' : lastSummary.won ? 'THẮNG TRẬN' : 'THẤT BẠI'}
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {phase === 'VICTORY'
                    ? 'Hoàn thành xuất sắc 10 vòng Đấu Trường Ba Lô!'
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
              {(phase === 'VICTORY' || phase === 'GAME_OVER') ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={startNewRun}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  Chơi Ván Mới ({winsTotal}/{MAX_ROUNDS} Thắng)
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="gear-next-round-btn"
                  onClick={() => {
                    const nextRound = lastSummary.won ? Math.min(MAX_ROUNDS, round + 1) : round;
                    setRound(nextRound);
                    if (!shopLocked) {
                      setShopOffers(rollShopOffers(nextRound));
                    }
                    setStatusNotice(`Vòng ${nextRound}/${MAX_ROUNDS} · Đã nhận +${lastSummary.goldEarned}G! Nâng cấp ba lô để bứt phá.`);
                    setPhase('SHOP');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm cursor-pointer"
                >
                  {lastSummary.won ? `Vào Shop Vòng ${round + 1} →` : `Quay Lại Shop Thử Lại`}
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
          <div className="w-full max-w-lg rounded-2xl border border-[#1E2E4A] bg-[#0D1526] p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Ghost Build JSON (Sao Lưu &amp; Đấu PvP)</span>
              </h3>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setShowGhostModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
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
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 cursor-pointer"
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
                className="w-full p-2.5 rounded-xl bg-[#070B14] border border-[#1E2E4A] text-slate-200 font-mono text-[11px]"
              />
              {ghostImportError && <p className="text-rose-400">{ghostImportError}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGhostModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#1E2E4A] text-slate-300 text-xs font-semibold cursor-pointer"
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
                className="px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold cursor-pointer"
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
