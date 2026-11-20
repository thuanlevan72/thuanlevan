import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  Cable,
  CheckCircle2,
  Cpu,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Shield,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  analyzeArchitectureDesign,
  buildBlueprintGraph,
  canAddEdge,
  CANVAS_H,
  CANVAS_W,
  computeBlueprintCost,
  createInitialNodes,
  evaluatePacketAtNode,
  evaluateSolutionOptimization,
  getNodeCatalogEntry,
  getSellRefund,
  hasPathToDatabase,
  INFRA_NODE_CATALOG,
  PACKET_META,
  pickWeightedPacketKind,
  RACK_SLOTS,
  selectOutgoingEdge,
  TRAFFIC_LEVELS,
  type ArchitectureApproach,
  type InfraEdge,
  type InfraNode,
  type InfraNodeType,
  type PacketKind,
  type PlaceableNodeType,
  type RackSlot,
  type SolutionEvaluation,
} from '../utils/trafficRouterEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface TrafficRouterGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type ToolMode = PlaceableNodeType | 'wire' | 'cut';
type GamePhase = 'TITLE' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';
type SimStage = 'DESIGNING' | 'SIMULATING';
type ChapterFilter = 0 | 1 | 2 | 3 | 4;

interface ActivePacket {
  id: number;
  kind: PacketKind;
  edgeId: string;
  fromId: string;
  toId: string;
  t: number; // 0..1 along edge
  speed: number;
  latencyMs: number;
  writeDamping: number;
}

interface FloatingFx {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface HudSnapshot {
  budget: number;
  earnedBudgetTotal: number;
  dbCpu: number;
  peakDbCpu: number;
  systemHealth: number;
  avgLatencyMs: number;
  waveIndex: number;
  waveActive: boolean;
  simStage: SimStage;
  waveTimeLeft: number;
  deliveredOk: number;
  cacheHits: number;
  blockedAttacks: number;
  breachedAttacks: number;
  hasValidRoute: boolean;
  selectedNode: InfraNode | null;
  notice: string;
  topologyRev: number;
}

type SavedGradesMap = Record<string, 'S' | 'A' | 'B' | 'C'>;

const SAVE_GRADES_KEY = 'thuanle-arch-grades-v2';

function loadSavedGrades(): SavedGradesMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SAVE_GRADES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as SavedGradesMap;
  } catch {
    return {};
  }
}

function saveGrade(levelId: number, grade: 'S' | 'A' | 'B' | 'C', prev: SavedGradesMap): SavedGradesMap {
  const rank: Record<'S' | 'A' | 'B' | 'C', number> = { S: 4, A: 3, B: 2, C: 1 };
  const key = String(levelId);
  const existing = prev[key];
  const nextGrade = existing && rank[existing] >= rank[grade] ? existing : grade;
  const next = { ...prev, [key]: nextGrade };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SAVE_GRADES_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }
  return next;
}

// ---------------------------------------------------------------------------
// Synthesized Audio FX (Web Audio API)
// ---------------------------------------------------------------------------
type RouterSfx = 'wire' | 'build' | 'cache' | 'block' | 'breach' | 'wave' | 'win' | 'down';

function playRouterSfx(ctx: AudioContext | null, kind: RouterSfx, muted: boolean) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;

  if (kind === 'wire' || kind === 'build') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(kind === 'wire' ? 520 : 380, now);
    osc.frequency.exponentialRampToValueAtTime(kind === 'wire' ? 780 : 620, now + 0.06);
    g.gain.setValueAtTime(0.055, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    return;
  }

  if (kind === 'cache') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(940, now);
    osc.frequency.exponentialRampToValueAtTime(1260, now + 0.045);
    g.gain.setValueAtTime(0.028, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
    return;
  }

  if (kind === 'block') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
    g.gain.setValueAtTime(0.025, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
    return;
  }

  if (kind === 'breach' || kind === 'down') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(kind === 'down' ? 140 : 190, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + (kind === 'down' ? 0.35 : 0.12));
    g.gain.setValueAtTime(kind === 'down' ? 0.09 : 0.045, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (kind === 'down' ? 0.38 : 0.14));
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (kind === 'down' ? 0.4 : 0.15));
    return;
  }

  if (kind === 'wave' || kind === 'win') {
    const notes = kind === 'win' ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
    notes.forEach((f, idx) => {
      const t = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.055, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }
}

function getNodeVisualMeta(type: InfraNodeType): { label: string; color: string } {
  if (type === 'ingress') return { label: 'USERS', color: '#38BDF8' };
  if (type === 'database') return { label: 'DB CLUSTER', color: '#F59E0B' };
  const entry = getNodeCatalogEntry(type);
  return { label: entry.shortName, color: entry.color };
}

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function gradeBadgeStyle(grade: 'S' | 'A' | 'B' | 'C'): string {
  if (grade === 'S') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60';
  if (grade === 'A') return 'bg-sky-500/20 text-sky-300 border-sky-400/60';
  if (grade === 'B') return 'bg-amber-500/20 text-amber-300 border-amber-400/60';
  return 'bg-rose-500/20 text-rose-300 border-rose-400/60';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function TrafficRouterGameSection({ theme }: TrafficRouterGameSectionProps) {
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1') {
      return 'PLAYING';
    }
    return 'TITLE';
  });
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>(0);
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [tool, setTool] = useState<ToolMode>('redis');
  const [speedMult, setSpeedMult] = useState<1 | 2 | 3>(2);
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [savedGrades, setSavedGrades] = useState<SavedGradesMap>(() => loadSavedGrades());
  const [sideTab, setSideTab] = useState<'diagnosis' | 'approaches'>('diagnosis');
  const [endEvaluation, setEndEvaluation] = useState<SolutionEvaluation | null>(null);

  const currentLevel = TRAFFIC_LEVELS[levelIdx];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

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

  // Mutable simulation ref driven at 60fps
  const simRef = useRef({
    level: TRAFFIC_LEVELS[0],
    nodes: createInitialNodes(TRAFFIC_LEVELS[0]),
    edges: [...TRAFFIC_LEVELS[0].initialEdges],
    packets: [] as ActivePacket[],
    fxs: [] as FloatingFx[],
    budget: TRAFFIC_LEVELS[0].startingBudget,
    earnedBudgetTotal: TRAFFIC_LEVELS[0].startingBudget,
    dbCpu: 10,
    peakDbCpu: 10,
    systemHealth: 100,
    latencySum: 0,
    latencySamples: 0,
    waveIndex: 0,
    waveActive: false,
    simStage: 'DESIGNING' as SimStage,
    waveTimer: 0,
    spawnTimer: 0,
    deliveredOk: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    selectedNodeId: null as string | null,
    wireSourceId: null as string | null,
    hoverPos: null as { x: number; y: number } | null,
    nextPacketId: 1,
    nextNodeId: 1,
    dashOffset: 0,
    topologyRev: 1,
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    outcome: null as 'victory' | 'gameover' | null,
  });

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    budget: TRAFFIC_LEVELS[0].startingBudget,
    earnedBudgetTotal: TRAFFIC_LEVELS[0].startingBudget,
    dbCpu: 10,
    peakDbCpu: 10,
    systemHealth: 100,
    avgLatencyMs: 24,
    waveIndex: 0,
    waveActive: false,
    simStage: 'DESIGNING',
    waveTimeLeft: 0,
    deliveredOk: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    hasValidRoute: true,
    selectedNode: null,
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    topologyRev: 1,
  }));

  const syncHud = useCallback(() => {
    const s = simRef.current;
    const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
    const sel = s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null;
    setHud({
      budget: Math.round(s.budget),
      earnedBudgetTotal: Math.round(s.earnedBudgetTotal),
      dbCpu: Math.round(s.dbCpu),
      peakDbCpu: Math.round(s.peakDbCpu),
      systemHealth: Math.max(0, Math.round(s.systemHealth)),
      avgLatencyMs: avgLat,
      waveIndex: s.waveIndex,
      waveActive: s.waveActive,
      simStage: s.simStage,
      waveTimeLeft: Math.max(0, Math.ceil(s.waveTimer)),
      deliveredOk: s.deliveredOk,
      cacheHits: s.cacheHits,
      blockedAttacks: s.blockedAttacks,
      breachedAttacks: s.breachedAttacks,
      hasValidRoute: hasPathToDatabase(s.nodes, s.edges),
      selectedNode: sel ? { ...sel } : null,
      notice: s.notice,
      topologyRev: s.topologyRev,
    });
  }, []);

  const liveAnalysis = useMemo(() => {
    const s = simRef.current;
    return analyzeArchitectureDesign(currentLevel, s.nodes, s.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLevel, hud.topologyRev]);

  const computeCurrentEvaluation = useCallback((): SolutionEvaluation => {
    const s = simRef.current;
    const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 28;
    return evaluateSolutionOptimization({
      level: s.level,
      nodes: s.nodes,
      edges: s.edges,
      avgLatencyMs: avgLat,
      peakDbCpu: s.peakDbCpu,
      breachedAttacks: s.breachedAttacks,
      remainingBudget: s.budget,
    });
  }, []);

  const startScenario = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(TRAFFIC_LEVELS.length - 1, idx));
      const lvl = TRAFFIC_LEVELS[clamped];
      setLevelIdx(clamped);
      setEndEvaluation(null);
      simRef.current = {
        level: lvl,
        nodes: createInitialNodes(lvl),
        edges: [...lvl.initialEdges],
        packets: [],
        fxs: [],
        budget: lvl.startingBudget,
        earnedBudgetTotal: lvl.startingBudget,
        dbCpu: 10,
        peakDbCpu: 10,
        systemHealth: 100,
        latencySum: 0,
        latencySamples: 0,
        waveIndex: 0,
        waveActive: false,
        simStage: 'DESIGNING',
        waveTimer: 0,
        spawnTimer: 0,
        deliveredOk: 0,
        cacheHits: 0,
        blockedAttacks: 0,
        breachedAttacks: 0,
        selectedNodeId: null,
        wireSourceId: null,
        hoverPos: null,
        nextPacketId: 1,
        nextNodeId: 1,
        dashOffset: 0,
        topologyRev: 1,
        notice: lvl.tacticalTip,
        outcome: null,
      };
      setPaused(false);
      setPhase('PLAYING');
      syncHud();
    },
    [syncHud]
  );

  const applyArchitectureBlueprint = useCallback(
    (approach: ArchitectureApproach) => {
      const s = simRef.current;
      if (s.simStage === 'SIMULATING') {
        s.notice = 'Đang chạy giả lập! Dừng giả lập để sửa hoặc đổi mẫu kiến trúc.';
        syncHud();
        return;
      }
      const lvl = s.level;
      const fullCost = computeBlueprintCost(lvl, approach);

      let effectiveApproach = approach;
      let effectiveCost = fullCost;
      let downgradedToLv1 = false;

      if (fullCost > lvl.startingBudget) {
        const lv1Approach: ArchitectureApproach = {
          ...approach,
          blueprintNodes: approach.blueprintNodes.map((bn) => ({ ...bn, level: 1 })),
        };
        effectiveCost = computeBlueprintCost(lvl, lv1Approach);
        if (effectiveCost > lvl.startingBudget) {
          s.notice = `Cần $${effectiveCost} để dựng mẫu "${approach.name}" (ngân sách $${lvl.startingBudget}).`;
          syncHud();
          return;
        }
        effectiveApproach = lv1Approach;
        downgradedToLv1 = true;
      }

      const bp = buildBlueprintGraph(lvl, effectiveApproach);
      s.nodes = bp.nodes;
      s.edges = bp.edges;
      s.packets = [];
      s.selectedNodeId = null;
      s.wireSourceId = null;
      s.budget = Math.max(0, lvl.startingBudget - effectiveCost);
      s.earnedBudgetTotal = lvl.startingBudget;
      s.topologyRev += 1;
      s.notice = downgradedToLv1
        ? `Đã áp dụng "${approach.name}" (Lv1, -$${effectiveCost}). Nhấn "Sẵn Sàng — Chạy Giả Lập" để kiểm chứng!`
        : `Đã dựng mẫu "${approach.name}" (-$${effectiveCost})! Nhấn "Sẵn Sàng — Chạy Giả Lập" để chạy test tải.`;
      playRouterSfx(ensureAudio(), 'build', muted);
      syncHud();
    },
    [ensureAudio, muted, syncHud]
  );

  const startSimulationRun = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING' || s.outcome) return;
    if (!hasPathToDatabase(s.nodes, s.edges)) {
      s.notice = 'Chưa có đường dây nối từ Users → Database! Dùng [W] Nối Dây hoàn tất kiến trúc trước.';
      syncHud();
      return;
    }

    // Reset runtime telemetry while locking current player architecture
    for (const node of s.nodes) {
      node.processedCount = 0;
      node.blockedCount = 0;
      node.cacheHitCount = 0;
      node.heat = 0;
    }
    const waveDef = s.level.waves[0];
    s.simStage = 'SIMULATING';
    s.waveIndex = 0;
    s.waveActive = true;
    s.waveTimer = waveDef.durationSec;
    s.spawnTimer = 0.15;
    s.packets = [];
    s.fxs = [];
    s.dbCpu = 10;
    s.peakDbCpu = 10;
    s.systemHealth = 100;
    s.latencySum = 0;
    s.latencySamples = 0;
    s.deliveredOk = 0;
    s.cacheHits = 0;
    s.blockedAttacks = 0;
    s.breachedAttacks = 0;
    s.wireSourceId = null;
    s.outcome = null;
    s.notice = `Đang giả lập Đợt 1/${s.level.waves.length}: ${waveDef.label}`;
    setPaused(false);
    playRouterSfx(ensureAudio(), 'wave', muted);
    syncHud();
  }, [ensureAudio, muted, syncHud]);

  const stopAndEditDesign = useCallback(() => {
    const s = simRef.current;
    for (const node of s.nodes) {
      node.processedCount = 0;
      node.blockedCount = 0;
      node.cacheHitCount = 0;
      node.heat = 0;
    }
    // Recompute remaining budget purely from placed nodes vs startingBudget so mid-sim packet coins don't inflate design budget
    const spentCost = s.nodes.reduce((sum, n) => {
      if (n.fixed || n.type === 'ingress' || n.type === 'database') return sum;
      const entry = getNodeCatalogEntry(n.type);
      return sum + entry.cost + (n.level >= 2 ? entry.upgradeCost : 0);
    }, 0);
    s.budget = Math.max(0, s.level.startingBudget - spentCost);
    s.earnedBudgetTotal = s.level.startingBudget;
    s.simStage = 'DESIGNING';
    s.waveIndex = 0;
    s.waveActive = false;
    s.waveTimer = 0;
    s.packets = [];
    s.fxs = [];
    s.dbCpu = 10;
    s.peakDbCpu = 10;
    s.systemHealth = 100;
    s.latencySum = 0;
    s.latencySamples = 0;
    s.deliveredOk = 0;
    s.cacheHits = 0;
    s.blockedAttacks = 0;
    s.breachedAttacks = 0;
    s.outcome = null;
    s.notice = 'Đã quay lại bước Thiết Kế — hãy tinh chỉnh sơ đồ rồi bấm "Sẵn Sàng — Chạy Giả Lập"!';
    setEndEvaluation(null);
    setPaused(false);
    setPhase('PLAYING');
    syncHud();
  }, [syncHud]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const matchTool = INFRA_NODE_CATALOG.find((item) => item.hotkey === e.key);
      if (matchTool) {
        setTool(matchTool.type);
        simRef.current.wireSourceId = null;
      } else if (e.key === 'w' || e.key === 'W') {
        setTool('wire');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'x' || e.key === 'X') {
        setTool('cut');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'p' || e.key === 'P') {
        setPaused((v) => !v);
      } else if (e.key === ' ') {
        e.preventDefault();
        startSimulationRun();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, startSimulationRun]);

  // Actions on selected node (locked during simulation)
  const upgradeSelectedNode = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') {
      s.notice = 'Khóa chỉnh sửa khi đang giả lập! Nhấn "Dừng & Sửa Thiết Kế" để nâng cấp.';
      syncHud();
      return;
    }
    if (!s.selectedNodeId) return;
    const node = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (!node || node.fixed || node.type === 'ingress' || node.type === 'database' || node.level >= 2) {
      return;
    }
    const entry = getNodeCatalogEntry(node.type);
    if (s.budget < entry.upgradeCost) {
      s.notice = `Cần $${entry.upgradeCost} để nâng cấp ${entry.shortName} lên Lv2!`;
      syncHud();
      return;
    }
    s.budget -= entry.upgradeCost;
    node.level = 2;
    s.topologyRev += 1;
    s.fxs.push({
      x: node.x,
      y: node.y - 28,
      text: `${entry.shortName} LV2!`,
      color: '#34D399',
      life: 0.9,
      maxLife: 0.9,
    });
    s.notice = `Đã nâng cấp ${entry.name} lên Lv2!`;
    playRouterSfx(ensureAudio(), 'wire', muted);
    syncHud();
  }, [ensureAudio, muted, syncHud]);

  const sellSelectedNode = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') {
      s.notice = 'Khóa chỉnh sửa khi đang giả lập! Nhấn "Dừng & Sửa Thiết Kế" để tháo node.';
      syncHud();
      return;
    }
    if (!s.selectedNodeId) return;
    const node = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (!node || node.fixed) return;
    const refund = getSellRefund(node);
    s.budget += refund;
    s.nodes = s.nodes.filter((n) => n.id !== node.id);
    s.edges = s.edges.filter((e) => e.fromId !== node.id && e.toId !== node.id);
    s.packets = s.packets.filter((p) => p.fromId !== node.id && p.toId !== node.id);
    s.selectedNodeId = null;
    s.topologyRev += 1;
    s.notice = `Đã tháo node và hoàn lại +$${refund}.`;
    playRouterSfx(ensureAudio(), 'block', muted);
    syncHud();
  }, [ensureAudio, muted, syncHud]);

  // Canvas pointer helpers
  const canvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * CANVAS_W,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * CANVAS_H,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'PLAYING') return;
    simRef.current.hoverPos = canvasCoords(e);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'PLAYING') return;
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') {
      s.notice = 'Đang chạy giả lập! Nhấn "Dừng & Sửa Thiết Kế" nếu muốn thay đổi sơ đồ.';
      syncHud();
      return;
    }
    const pt = canvasCoords(e);

    const clickedNode = s.nodes.find((n) => Math.hypot(pt.x - n.x, pt.y - n.y) <= 30);

    if (tool === 'wire') {
      if (!clickedNode) {
        s.wireSourceId = null;
        s.notice = 'Đã hủy chọn đầu dây.';
        syncHud();
        return;
      }
      if (!s.wireSourceId) {
        if (clickedNode.type === 'database') {
          s.notice = 'Database là điểm đích, hãy chọn node nguồn trước.';
          syncHud();
          return;
        }
        s.wireSourceId = clickedNode.id;
        s.selectedNodeId = clickedNode.id;
        s.notice = `Đang kéo dây từ ${getNodeVisualMeta(clickedNode.type).label} — nhấp vào node đích!`;
        syncHud();
        return;
      }
      const check = canAddEdge(s.nodes, s.edges, s.wireSourceId, clickedNode.id);
      if (!check.valid) {
        s.notice = check.reason ?? 'Không thể nối dây này.';
        s.wireSourceId = null;
        syncHud();
        return;
      }
      s.edges.push({
        id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fromId: s.wireSourceId,
        toId: clickedNode.id,
      });
      s.wireSourceId = null;
      s.selectedNodeId = clickedNode.id;
      s.topologyRev += 1;
      s.notice = 'Đã nối dây mạng mới thành công!';
      playRouterSfx(ensureAudio(), 'wire', muted);
      syncHud();
      return;
    }

    if (tool === 'cut') {
      let hitEdge: InfraEdge | null = null;
      let bestDist = 14;
      for (const edge of s.edges) {
        const a = s.nodes.find((n) => n.id === edge.fromId);
        const b = s.nodes.find((n) => n.id === edge.toId);
        if (!a || !b) continue;
        const d = distToSegment(pt.x, pt.y, a.x, a.y, b.x, b.y);
        if (d < bestDist) {
          bestDist = d;
          hitEdge = edge;
        }
      }
      if (hitEdge) {
        s.edges = s.edges.filter((ed) => ed.id !== hitEdge!.id);
        s.packets = s.packets.filter((p) => p.edgeId !== hitEdge!.id);
        s.topologyRev += 1;
        s.notice = 'Đã cắt đứt đường dây.';
        playRouterSfx(ensureAudio(), 'block', muted);
        syncHud();
      }
      return;
    }

    if (clickedNode) {
      s.selectedNodeId = clickedNode.id;
      s.wireSourceId = null;
      syncHud();
      return;
    }

    const clickedSlot: RackSlot | undefined = RACK_SLOTS.find(
      (sl) => Math.hypot(pt.x - sl.x, pt.y - sl.y) <= 34
    );

    if (!clickedSlot) {
      s.selectedNodeId = null;
      syncHud();
      return;
    }

    const occupied = s.nodes.some((n) => n.slotId === clickedSlot.id);
    if (occupied) return;

    const entry = getNodeCatalogEntry(tool);
    if (s.budget < entry.cost) {
      s.notice = `Không đủ ngân sách ($${entry.cost}) để đặt ${entry.name}!`;
      syncHud();
      return;
    }

    s.budget -= entry.cost;
    const newNode: InfraNode = {
      id: `${tool}-${s.nextNodeId++}`,
      type: tool,
      x: clickedSlot.x,
      y: clickedSlot.y,
      slotId: clickedSlot.id,
      level: 1,
      rrCursor: 0,
      processedCount: 0,
      blockedCount: 0,
      cacheHitCount: 0,
      heat: 0,
    };
    s.nodes.push(newNode);
    s.selectedNodeId = newNode.id;

    // Smart Auto-Splice if an existing edge runs right across this slot
    let spliced = false;
    for (let i = 0; i < s.edges.length; i++) {
      const ed = s.edges[i];
      const a = s.nodes.find((n) => n.id === ed.fromId);
      const b = s.nodes.find((n) => n.id === ed.toId);
      if (!a || !b) continue;
      if (
        newNode.x > Math.min(a.x, b.x) + 20 &&
        newNode.x < Math.max(a.x, b.x) - 20 &&
        distToSegment(newNode.x, newNode.y, a.x, a.y, b.x, b.y) <= 24
      ) {
        s.edges.splice(
          i,
          1,
          { id: `e-${Date.now()}-a`, fromId: ed.fromId, toId: newNode.id },
          { id: `e-${Date.now()}-b`, fromId: newNode.id, toId: ed.toId }
        );
        spliced = true;
        break;
      }
    }

    s.topologyRev += 1;
    s.fxs.push({
      x: newNode.x,
      y: newNode.y - 28,
      text: spliced ? `Nối tự động ${entry.shortName}` : `Đặt ${entry.shortName}`,
      color: entry.color,
      life: 0.9,
      maxLife: 0.9,
    });
    s.notice = spliced
      ? `Đã gắn ${entry.name} trực tiếp vào đường dây! Có thể dùng [W] để nối thêm nhánh.`
      : `Đã đặt ${entry.name}! Dùng [W] Nối Dây để kết nối vào mạng.`;
    playRouterSfx(ensureAudio(), 'build', muted);
    syncHud();
  };

  // Main Simulation & Render Loop
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    let rafId = 0;
    let lastTs = performance.now();
    let hudAccum = 0;

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const s = simRef.current;
      const isRunningSim = s.simStage === 'SIMULATING' && !paused && !s.outcome;
      const dt = isRunningSim ? rawDt * speedMult : 0;

      // Subtle slow dash animation during DESIGNING when route is valid
      if (s.simStage === 'DESIGNING') {
        s.dashOffset = (s.dashOffset - rawDt * 12) % 24;
      }

      // Advance simulation ONLY after player presses "Sẵn Sàng — Chạy Giả Lập"
      if (dt > 0) {
        s.dashOffset = (s.dashOffset - dt * 28) % 24;

        for (const node of s.nodes) {
          node.heat = Math.max(0, node.heat - dt * 0.45);
        }

        s.dbCpu = Math.max(6, s.dbCpu - s.level.dbCoolingPerSec * dt);

        if (s.waveActive) {
          const waveDef = s.level.waves[s.waveIndex];
          s.waveTimer = Math.max(0, s.waveTimer - dt);
          s.spawnTimer -= dt;

          if (s.waveTimer > 0 && s.spawnTimer <= 0) {
            s.spawnTimer = waveDef.spawnIntervalSec * (0.82 + Math.random() * 0.36);
            const ingress = s.nodes.find((n) => n.id === 'ingress');
            if (ingress) {
              const { edge, nextCursor } = selectOutgoingEdge(ingress, s.edges);
              ingress.rrCursor = nextCursor;
              if (edge) {
                const kind = pickWeightedPacketKind(waveDef.weights, Math.random());
                s.packets.push({
                  id: s.nextPacketId++,
                  kind,
                  edgeId: edge.id,
                  fromId: edge.fromId,
                  toId: edge.toId,
                  t: 0,
                  speed: kind === 'ddos' ? 1.18 : 0.88,
                  latencyMs: 6,
                  writeDamping: 1,
                });
              }
            }
          }

          if (s.waveTimer <= 0 && s.packets.length === 0) {
            s.waveIndex += 1;
            if (s.waveIndex >= s.level.waves.length) {
              s.waveActive = false;
              s.outcome = 'victory';
              playRouterSfx(ensureAudio(), 'win', muted);
              const evalResult = computeCurrentEvaluation();
              setEndEvaluation(evalResult);
              setSavedGrades((prev) => saveGrade(s.level.id, evalResult.grade, prev));
              setPhase('VICTORY');
              syncHud();
            } else {
              const nextWave = s.level.waves[s.waveIndex];
              s.waveActive = true;
              s.waveTimer = nextWave.durationSec;
              s.spawnTimer = 0.15;
              s.notice = `Đang giả lập Đợt ${nextWave.waveNumber}/${s.level.waves.length}: ${nextWave.label}`;
              playRouterSfx(ensureAudio(), 'wave', muted);
            }
          }
        }

        const nextPackets: ActivePacket[] = [];
        for (const p of s.packets) {
          p.t += p.speed * dt;
          if (p.t < 1) {
            nextPackets.push(p);
            continue;
          }

          const target = s.nodes.find((n) => n.id === p.toId);
          if (!target) continue;

          target.heat = Math.min(1, target.heat + (p.kind === 'ddos' ? 0.18 : 0.12));
          const outgoing = s.edges.filter((e) => e.fromId === target.id);
          const decision = evaluatePacketAtNode(
            target,
            p.kind,
            Math.random(),
            outgoing.length,
            p.writeDamping
          );
          const totalLatency = p.latencyMs + decision.addedLatencyMs;
          const nextDamping = decision.writeDampingFactor
            ? p.writeDamping * decision.writeDampingFactor
            : p.writeDamping;

          if (decision.outcome === 'blocked') {
            target.blockedCount += 1;
            s.blockedAttacks += 1;
            s.budget += p.kind === 'sqli' ? 4 : 2;
            s.earnedBudgetTotal += p.kind === 'sqli' ? 4 : 2;
            s.fxs.push({
              x: target.x,
              y: target.y - 26,
              text: p.kind === 'sqli' ? 'CHẶN SQLi' : 'CHẶN DDoS',
              color: '#FB7185',
              life: 0.65,
              maxLife: 0.65,
            });
            playRouterSfx(ensureAudio(), 'block', muted);
          } else if (decision.outcome === 'cache_hit') {
            target.cacheHitCount += 1;
            s.cacheHits += 1;
            s.deliveredOk += 1;
            s.latencySum += totalLatency;
            s.latencySamples += 1;
            s.budget += 2;
            s.earnedBudgetTotal += 2;
            s.fxs.push({
              x: target.x,
              y: target.y - 26,
              text: `HIT ${totalLatency}ms`,
              color: '#22D3EE',
              life: 0.65,
              maxLife: 0.65,
            });
            playRouterSfx(ensureAudio(), 'cache', muted);
          } else if (decision.outcome === 'delivered') {
            target.processedCount += 1;
            s.dbCpu = Math.min(100, s.dbCpu + decision.dbCpuDelta);
            s.peakDbCpu = Math.max(s.peakDbCpu, s.dbCpu);
            if (decision.integrityDelta < 0) {
              s.breachedAttacks += 1;
              s.systemHealth = Math.max(0, s.systemHealth + decision.integrityDelta);
              s.fxs.push({
                x: target.x,
                y: target.y - 30,
                text: p.kind === 'sqli' ? 'SQLi XÂM NHẬP!' : 'DDoS TRÀN DB!',
                color: '#EF4444',
                life: 0.9,
                maxLife: 0.9,
              });
              playRouterSfx(ensureAudio(), 'breach', muted);
            } else {
              s.deliveredOk += 1;
              s.latencySum += totalLatency;
              s.latencySamples += 1;
              const earn = p.kind === 'write' ? 3 : 2;
              s.budget += earn;
              s.earnedBudgetTotal += earn;
            }
          } else if (decision.outcome === 'forward') {
            target.processedCount += 1;
            const { edge, nextCursor } = selectOutgoingEdge(target, s.edges);
            target.rrCursor = nextCursor;
            if (edge) {
              nextPackets.push({
                id: p.id,
                kind: p.kind,
                edgeId: edge.id,
                fromId: edge.fromId,
                toId: edge.toId,
                t: 0,
                speed: p.speed,
                latencyMs: totalLatency,
                writeDamping: nextDamping,
              });
            }
          }
        }
        s.packets = nextPackets;

        if (s.dbCpu >= 96) {
          s.systemHealth = Math.max(0, s.systemHealth - dt * 16);
        } else if (s.dbCpu < 75 && s.systemHealth < 100 && s.waveActive) {
          s.systemHealth = Math.min(100, s.systemHealth + dt * 1.4);
        }

        if (s.systemHealth <= 0) {
          s.outcome = 'gameover';
          playRouterSfx(ensureAudio(), 'down', muted);
          setEndEvaluation(computeCurrentEvaluation());
          setPhase('GAME_OVER');
        }

        s.fxs = s.fxs
          .map((fx) => ({ ...fx, y: fx.y - dt * 18, life: fx.life - dt }))
          .filter((fx) => fx.life > 0);
      }

      // 3. Draw Canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        ctx.fillStyle = '#0B1320';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Subtle architectural grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
        ctx.lineWidth = 1;
        for (let gx = 40; gx < CANVAS_W; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, CANVAS_H);
          ctx.stroke();
        }
        for (let gy = 40; gy < CANVAS_H; gy += 40) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(CANVAS_W, gy);
          ctx.stroke();
        }

        // 6 architectural zone columns
        const layers = [
          { x: 76, label: 'USERS' },
          { x: 225, label: 'EDGE / BẢO VỆ' },
          { x: 385, label: 'CACHE / LB' },
          { x: 545, label: 'COMPUTE / MQ' },
          { x: 705, label: 'REPLICA / S3' },
          { x: 844, label: 'DATABASE' },
        ];
        ctx.font = '600 10px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
        for (const l of layers) {
          ctx.fillText(l.label, l.x, 24);
        }

        // Empty Rack Slots (4 cols x 3 rows = 12 slots)
        for (const slot of RACK_SLOTS) {
          const isOccupied = s.nodes.some((n) => n.slotId === slot.id);
          if (isOccupied) continue;
          const isHover = s.hoverPos && Math.hypot(s.hoverPos.x - slot.x, s.hoverPos.y - slot.y) <= 34;
          ctx.save();
          ctx.strokeStyle = isHover ? '#38BDF8' : 'rgba(100, 116, 139, 0.35)';
          ctx.fillStyle = isHover ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.55)';
          ctx.lineWidth = isHover ? 1.8 : 1.2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.roundRect(slot.x - 28, slot.y - 24, 56, 48, 10);
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = isHover ? '#38BDF8' : 'rgba(148, 163, 184, 0.45)';
          ctx.font = '500 15px sans-serif';
          ctx.textBaseline = 'middle';
          ctx.fillText('+', slot.x, slot.y);
          ctx.restore();
        }

        // Edges (Wires)
        for (const edge of s.edges) {
          const a = s.nodes.find((n) => n.id === edge.fromId);
          const b = s.nodes.find((n) => n.id === edge.toId);
          if (!a || !b) continue;

          ctx.save();
          ctx.strokeStyle = tool === 'cut' ? 'rgba(251, 113, 133, 0.65)' : 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 12]);
          ctx.lineDashOffset = s.dashOffset;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);

          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          ctx.translate(mx, my);
          ctx.rotate(ang);
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(-4, -4);
          ctx.lineTo(-4, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Live Wire Preview
        if (tool === 'wire' && s.wireSourceId && s.hoverPos) {
          const src = s.nodes.find((n) => n.id === s.wireSourceId);
          if (src) {
            ctx.save();
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = 2.2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.lineTo(s.hoverPos.x, s.hoverPos.y);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Moving Packets (all 5 kinds)
        for (const p of s.packets) {
          const a = s.nodes.find((n) => n.id === p.fromId);
          const b = s.nodes.find((n) => n.id === p.toId);
          if (!a || !b) continue;
          const px = a.x + (b.x - a.x) * p.t;
          const py = a.y + (b.y - a.y) * p.t;
          const meta = PACKET_META[p.kind];

          ctx.save();
          ctx.translate(px, py);
          ctx.fillStyle = meta.color;
          ctx.globalAlpha = 0.28;
          ctx.beginPath();
          ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          if (p.kind === 'read') {
            ctx.beginPath();
            ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.kind === 'write') {
            ctx.fillRect(-5.5, -5.5, 11, 11);
          } else if (p.kind === 'media') {
            // Hexagon media packet
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const ang = (Math.PI / 3) * k;
              const rx = Math.cos(ang) * 6.5;
              const ry = Math.sin(ang) * 6.5;
              if (k === 0) ctx.moveTo(rx, ry);
              else ctx.lineTo(rx, ry);
            }
            ctx.closePath();
            ctx.fill();
          } else if (p.kind === 'ddos') {
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(6.5, 5);
            ctx.lineTo(-6.5, 5);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(7, 0);
            ctx.lineTo(0, 7);
            ctx.lineTo(-7, 0);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

        // Nodes
        for (const node of s.nodes) {
          const meta = getNodeVisualMeta(node.type);
          const isSelected = s.selectedNodeId === node.id;
          const isWireSrc = s.wireSourceId === node.id;

          ctx.save();
          if (node.heat > 0.05) {
            ctx.fillStyle =
              node.type === 'database' && s.dbCpu > 85
                ? `rgba(239, 68, 68, ${node.heat * 0.38})`
                : `rgba(56, 189, 248, ${node.heat * 0.22})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 38, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#0F1A2E';
          ctx.strokeStyle = isWireSrc ? '#38BDF8' : isSelected ? '#FACC15' : meta.color;
          ctx.lineWidth = isSelected || isWireSrc ? 2.6 : 1.8;
          ctx.beginPath();
          ctx.roundRect(node.x - 32, node.y - 26, 64, 52, 11);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = meta.color;
          ctx.beginPath();
          ctx.roundRect(node.x - 32, node.y - 26, 64, 6, [11, 11, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#F8FAFC';
          ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(meta.label, node.x, node.y + 1);

          ctx.font = '600 9px ui-monospace, SFMono-Regular, monospace';
          if (node.type === 'database') {
            ctx.fillStyle = s.dbCpu >= 85 ? '#FCA5A5' : '#FDE68A';
            ctx.fillText(`CPU ${Math.round(s.dbCpu)}%`, node.x, node.y + 16);
          } else if (!node.fixed) {
            ctx.fillStyle = node.level === 2 ? '#34D399' : '#94A3B8';
            ctx.fillText(`LV.${node.level}`, node.x, node.y + 16);
          } else {
            ctx.fillStyle = '#7DD3FC';
            ctx.fillText('INGRESS', node.x, node.y + 16);
          }
          ctx.restore();
        }

        for (const fx of s.fxs) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, fx.life / Math.max(0.1, fx.maxLife * 0.5));
          ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = fx.color;
          ctx.fillText(fx.text, fx.x, fx.y);
          ctx.restore();
        }
      }

      if (!paused && s.simStage === 'SIMULATING') {
        hudAccum += rawDt;
        if (hudAccum >= 0.12) {
          hudAccum = 0;
          syncHud();
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [computeCurrentEvaluation, ensureAudio, muted, paused, phase, speedMult, syncHud, tool]);

  // -------------------------------------------------------------------------
  // Title Screen: 16 Scenarios across 4 Chapters + Multiple Approaches Preview
  // -------------------------------------------------------------------------
  const filteredLevels = useMemo(
    () =>
      chapterFilter === 0
        ? TRAFFIC_LEVELS
        : TRAFFIC_LEVELS.filter((lvl) => lvl.chapter === chapterFilter),
    [chapterFilter]
  );

  const clearedCount = Object.keys(savedGrades).length;

  if (phase === 'TITLE') {
    const firstWaveWeights = currentLevel.waves[0].weights;
    return (
      <section
        id="traffic-router-section"
        aria-label="Thiết Kế Kiến Trúc Hệ Thống — 16 Hoàn Cảnh & Đánh Giá Tối Ưu"
        className="rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-5 sm:p-7 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Chapter tabs & 16-level catalog */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-mono tracking-wide text-sky-400">
                System Architecture Designer · 16 Hoàn Cảnh Thực Tế · Đa Giải Pháp &amp; Đánh Giá Tối Ưu
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight [text-wrap:balance]">
                Thiết Kế Kiến Trúc Hệ Thống
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Phân tích từng hoàn cảnh thực tế (Tin tức, Media, Flash Sale, Ngân hàng, Bệnh viện HIS, GPS, IoT, AI API...), tự do thiết kế bằng nhiều cách khác nhau và nhận chấm điểm <strong>S / A / B / C</strong> kèm phân tích <em>vì sao giải pháp chưa tối ưu</em>.
              </p>
            </div>

            {/* Chapter Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc theo chương">
              {[
                { id: 0 as ChapterFilter, label: `Tất cả (${TRAFFIC_LEVELS.length})` },
                { id: 1 as ChapterFilter, label: 'Ch.1 Web & Cache' },
                { id: 2 as ChapterFilter, label: 'Ch.2 Queue & Async' },
                { id: 3 as ChapterFilter, label: 'Ch.3 Hệ Thống Đặc Thù' },
                { id: 4 as ChapterFilter, label: 'Ch.4 Quy Mô Lớn' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={chapterFilter === tab.id}
                  onClick={() => setChapterFilter(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    chapterFilter === tab.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-[#111C33] text-slate-300 border border-[#1E2E4A] hover:border-sky-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <span className="ml-auto text-xs font-mono text-slate-400 tabular-nums">
                Hoàn thành: {clearedCount}/{TRAFFIC_LEVELS.length}
              </span>
            </div>

            {/* Scenario Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredLevels.map((lvl) => {
                const idx = TRAFFIC_LEVELS.findIndex((x) => x.id === lvl.id);
                const isSelected = idx === levelIdx;
                const savedGrade = savedGrades[String(lvl.id)];
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    data-testid={`arch-level-${lvl.id}`}
                    onClick={() => setLevelIdx(idx)}
                    className={`text-left px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-500/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="font-mono">
                        {lvl.code} · {lvl.difficulty} · {lvl.approaches.length} Cách
                      </span>
                      {savedGrade && (
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${gradeBadgeStyle(savedGrade)}`}
                        >
                          Hạng {savedGrade}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold mt-0.5 truncate">{lvl.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{lvl.domain}</p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                data-testid="traffic-start-btn"
                onClick={() => startScenario(levelIdx)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Triển Khai {currentLevel.code} (Màn {levelIdx + 1}/16)</span>
              </button>
              <span className="text-xs text-slate-400">
                Bước 1: Thiết kế kiến trúc &amp; nối dây · Bước 2: Bấm Sẵn Sàng giả lập · Bước 3: Chấm điểm tối ưu
              </span>
            </div>
          </div>

          {/* Right 5 cols: Scenario Context, Approaches & Lesson Briefing */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-sky-400">
                <span>{currentLevel.chapterTitle}</span>
                <span>SLA ≤ {currentLevel.targetSlaMs}ms</span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{currentLevel.title}</h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {currentLevel.contextDescription}
                </p>
              </div>

              {/* Traffic Profile Mix */}
              <div className="grid grid-cols-5 gap-1.5 text-center text-[11px] font-mono tabular-nums">
                <div className="p-1.5 rounded-lg bg-[#132138] border border-[#1E2E4A]">
                  <span className="block text-sky-300">GET</span>
                  <strong>{Math.round(firstWaveWeights.read * 100)}%</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-[#132138] border border-[#1E2E4A]">
                  <span className="block text-amber-300">POST</span>
                  <strong>{Math.round(firstWaveWeights.write * 100)}%</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-[#132138] border border-[#1E2E4A]">
                  <span className="block text-pink-300">MEDIA</span>
                  <strong>{Math.round(firstWaveWeights.media * 100)}%</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-[#132138] border border-[#1E2E4A]">
                  <span className="block text-rose-400">DDoS</span>
                  <strong>{Math.round(firstWaveWeights.ddos * 100)}%</strong>
                </div>
                <div className="p-1.5 rounded-lg bg-[#132138] border border-[#1E2E4A]">
                  <span className="block text-purple-300">SQLi</span>
                  <strong>{Math.round(firstWaveWeights.sqli * 100)}%</strong>
                </div>
              </div>

              {/* Multiple Design Approaches Preview */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Các cách thiết kế khả thi ({currentLevel.approaches.length} phương án):</span>
                </p>
                <div className="space-y-1.5">
                  {currentLevel.approaches.map((ap) => (
                    <div
                      key={ap.id}
                      className="p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A] text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-white truncate">{ap.name}</strong>
                        <span className="text-[10px] font-mono text-sky-300 shrink-0">{ap.tag}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{ap.summary}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architectural Learning Lesson */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs space-y-1">
                <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Bài học kiến trúc rút ra:</span>
                </p>
                <p className="text-slate-200 leading-relaxed">{currentLevel.learningLesson}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------------------
  // Active Gameplay View
  // -------------------------------------------------------------------------
  const selectedEntry =
    hud.selectedNode &&
    !hud.selectedNode.fixed &&
    hud.selectedNode.type !== 'ingress' &&
    hud.selectedNode.type !== 'database'
      ? getNodeCatalogEntry(hud.selectedNode.type)
      : null;

  const showReportModal = (phase === 'VICTORY' || phase === 'GAME_OVER') && endEvaluation !== null;

  return (
    <section
      id="traffic-router-section"
      aria-label={`Thiết Kế Kiến Trúc — ${currentLevel.title}`}
      className="relative rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-3.5 sm:p-5 shadow-sm"
    >
      {/* Top Telemetry HUD */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2.5 pb-3 border-b border-[#1E2E4A]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs tabular-nums min-w-0">
          <button
            type="button"
            onClick={() => {
              setEndEvaluation(null);
              setPhase('TITLE');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            Menu ({levelIdx + 1}/{TRAFFIC_LEVELS.length})
          </button>

          <span
            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border whitespace-nowrap ${
              hud.simStage === 'DESIGNING'
                ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/50'
            }`}
          >
            {hud.simStage === 'DESIGNING' ? 'BƯỚC 1: THIẾT KẾ' : 'BƯỚC 2: GIẢ LẬP TẢI'}
          </span>

          <span
            className="text-xs font-semibold text-sky-300 truncate max-w-[170px] 2xl:max-w-[230px]"
            title={`${currentLevel.code} · ${currentLevel.title}`}
          >
            {currentLevel.code} · {currentLevel.title}
          </span>

          <div className="whitespace-nowrap">
            <span className="text-slate-400 text-[11px] mr-1">NGÂN SÁCH</span>
            <strong className="font-mono text-amber-300">${hud.budget}</strong>
            <span className="text-[10px] text-slate-400 font-mono">/${currentLevel.startingBudget}</span>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Cpu className={`w-3.5 h-3.5 ${hud.dbCpu >= 85 ? 'text-rose-400' : 'text-sky-400'}`} />
            <span className="text-slate-400 text-[11px]">CPU</span>
            <strong
              className={`font-mono ${
                hud.dbCpu >= 85 ? 'text-rose-400' : hud.dbCpu >= 60 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {hud.dbCpu}%
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">(Đỉnh {hud.peakDbCpu}%)</span>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Shield className={`w-3.5 h-3.5 ${hud.systemHealth < 40 ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400 text-[11px]">UPTIME</span>
            <strong className="font-mono text-emerald-300">{hud.systemHealth}%</strong>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 text-[11px]">TRỄ</span>
            <strong
              className={`font-mono ${
                hud.avgLatencyMs <= currentLevel.targetSlaMs ? 'text-cyan-300' : 'text-amber-300'
              }`}
            >
              {hud.avgLatencyMs}ms
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">/{currentLevel.targetSlaMs}ms</span>
          </div>

          <div className="whitespace-nowrap">
            <span className="text-slate-400 text-[11px] mr-1">ĐỢT</span>
            <strong className="font-mono text-white">
              {hud.simStage === 'DESIGNING'
                ? `0/${currentLevel.waves.length}`
                : `${Math.min(hud.waveIndex + 1, currentLevel.waves.length)}/${currentLevel.waves.length}`}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSpeedMult((s) => (s === 1 ? 2 : s === 2 ? 3 : 1))}
            className="px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 font-mono text-xs font-semibold cursor-pointer whitespace-nowrap"
            title="Tốc độ chạy giả lập (1× / 2× / 3×)"
          >
            {speedMult}×
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={hud.simStage !== 'SIMULATING'}
            aria-label={paused ? 'Tiếp tục giả lập' : 'Tạm dừng giả lập'}
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 disabled:opacity-40 cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => startScenario(levelIdx)}
            aria-label="Làm lại từ đầu"
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Split Workspace: Canvas + Right Inspector */}
      <div className="mt-3 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Left/Center 8 Cols: Canvas + Tool Palette */}
        <div className="xl:col-span-8 space-y-3">
          <div className="relative flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerMove={handleCanvasPointerMove}
              onPointerDown={handleCanvasPointerDown}
              data-testid="architecture-canvas"
              className="w-full aspect-[920/500] h-auto rounded-xl border border-[#1E2E4A] cursor-crosshair touch-none"
              aria-label="Sơ đồ thiết kế kiến trúc hệ thống"
            />
          </div>

          {/* 10 Architecture Components + Wire / Cut Tools */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {INFRA_NODE_CATALOG.map((item) => {
              const active = tool === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setTool(item.type);
                    simRef.current.wireSourceId = null;
                  }}
                  title={`${item.name}: ${item.roleSummary}`}
                  className={`px-2 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-sky-500/20 border-sky-400 text-white'
                      : 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-500/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                    <span className="truncate">[{item.hotkey}] {item.shortName}</span>
                    <span className="font-mono text-amber-300 shrink-0">${item.cost}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.roleSummary}</p>
                </button>
              );
            })}

            <button
              type="button"
              data-testid="traffic-wire-tool-btn"
              onClick={() => {
                setTool('wire');
                simRef.current.wireSourceId = null;
              }}
              className={`px-2 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                tool === 'wire'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white'
                  : 'bg-[#111C33] border-[#1E2E4A] hover:border-cyan-400 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Cable className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>[W] Nối Dây</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Nhấp Nguồn → Đích</p>
            </button>

            <button
              type="button"
              data-testid="traffic-cut-tool-btn"
              onClick={() => {
                setTool('cut');
                simRef.current.wireSourceId = null;
              }}
              className={`px-2 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                tool === 'cut'
                  ? 'bg-rose-500/20 border-rose-400 text-white'
                  : 'bg-[#111C33] border-[#1E2E4A] hover:border-rose-400 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>[X] Tháo Dây</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Nhấp vào đường nối</p>
            </button>
          </div>

          {/* Selected Node Inspector + Ready / Simulate Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-[#1E2E4A]">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {hud.selectedNode && selectedEntry && hud.simStage === 'DESIGNING' && (
                <>
                  <button
                    type="button"
                    data-testid="traffic-upgrade-btn"
                    disabled={hud.selectedNode.level >= 2 || hud.budget < selectedEntry.upgradeCost}
                    onClick={upgradeSelectedNode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-slate-950 font-semibold text-xs cursor-pointer whitespace-nowrap"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>
                      {hud.selectedNode.level >= 2
                        ? 'Max Lv2'
                        : `Nâng Lv2 ($${selectedEntry.upgradeCost})`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={sellSelectedNode}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-rose-400 text-rose-300 text-xs font-medium cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tháo (+${getSellRefund(hud.selectedNode)})</span>
                  </button>
                </>
              )}
              <p className="text-xs text-slate-300 truncate">{hud.notice}</p>
            </div>

            {hud.simStage === 'DESIGNING' ? (
              <button
                type="button"
                data-testid="traffic-ready-sim-btn"
                onClick={startSimulationRun}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
              >
                <Zap className="w-4 h-4" />
                <span>Sẵn Sàng — Chạy Giả Lập ({currentLevel.waves.length} Đợt)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-2 rounded-xl bg-[#111C33] border border-amber-400/50 text-amber-300 font-mono text-xs font-semibold whitespace-nowrap">
                  Đang test Đợt {Math.min(hud.waveIndex + 1, currentLevel.waves.length)}/{currentLevel.waves.length} ({hud.waveTimeLeft}s)
                </span>
                <button
                  type="button"
                  data-testid="traffic-stop-edit-btn"
                  onClick={stopAndEditDesign}
                  className="px-3 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-sky-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Dừng &amp; Sửa Thiết Kế
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Live Architecture Diagnosis & Multiple Approaches Guide */}
        <aside className="xl:col-span-4 rounded-xl border border-[#1E2E4A] bg-[#0F192B] p-3.5 space-y-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0B1320] border border-[#1E2E4A]">
            <button
              type="button"
              data-testid="arch-side-diagnosis"
              onClick={() => setSideTab('diagnosis')}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                sideTab === 'diagnosis'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Sơ Bộ ({liveAnalysis.diagnostics.length === 0 ? 'Sẵn sàng' : `${liveAnalysis.diagnostics.length} lưu ý`})</span>
            </button>
            <button
              type="button"
              data-testid="arch-side-approaches"
              onClick={() => setSideTab('approaches')}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                sideTab === 'approaches'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Các Cách ({currentLevel.approaches.length})</span>
            </button>
          </div>

          {sideTab === 'diagnosis' ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#132138] border border-[#1E2E4A] space-y-1">
                <span className="text-[11px] font-mono text-sky-400">ĐỀ BÀI &amp; HOÀN CẢNH</span>
                <p className="font-semibold text-white">{currentLevel.domain}</p>
                <p className="text-slate-300 leading-relaxed">{currentLevel.contextDescription}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#132138] border border-[#1E2E4A] space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-emerald-400">HƯỚNG KIẾN TRÚC ĐANG LẮP</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {hud.simStage === 'DESIGNING' ? 'Chưa chấm (Chờ giả lập)' : 'Đang kiểm chứng...'}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{liveAnalysis.detectedPatternLabel}</p>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-slate-200">
                  {liveAnalysis.diagnostics.length === 0
                    ? 'Kiểm tra sơ bộ trước giả lập: Đã hợp lệ!'
                    : `Rủi ro sơ bộ phát hiện (${liveAnalysis.diagnostics.length}):`}
                </p>
                {liveAnalysis.diagnostics.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 leading-relaxed">
                    Cấu trúc mạng đã nối thông. Nhấn <strong>Sẵn Sàng — Chạy Giả Lập</strong> để chạy thử tải thực tế và nhận đánh giá tối ưu S/A/B/C!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[210px] overflow-y-auto pr-1">
                    {liveAnalysis.diagnostics.map((diag, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-100 leading-relaxed"
                      >
                        {diag}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-400/25 text-slate-200 leading-relaxed">
                <strong className="text-sky-300">Bài học:</strong> {currentLevel.learningLesson}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Một bài toán có thể giải bằng nhiều hướng khác nhau. So sánh ưu/nhược điểm và thử áp dụng từng mẫu lên sơ đồ:
              </p>
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {currentLevel.approaches.map((ap) => {
                  const isMatched = liveAnalysis.matchedApproaches.some((m) => m.id === ap.id);
                  const bpCost = computeBlueprintCost(currentLevel, ap);
                  return (
                    <div
                      key={ap.id}
                      className={`p-3 rounded-xl border space-y-2 ${
                        isMatched
                          ? 'bg-emerald-500/10 border-emerald-400/50'
                          : 'bg-[#132138] border-[#1E2E4A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-white">{ap.name}</p>
                          <p className="text-[11px] font-mono text-sky-300">{ap.tag}</p>
                        </div>
                        {isMatched && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã khớp
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed">{ap.summary}</p>
                      <div className="space-y-0.5 text-[11px]">
                        <p className="text-emerald-300">+ Ưu điểm: {ap.pros}</p>
                        <p className="text-amber-300">- Đánh đổi: {ap.cons}</p>
                      </div>
                      <button
                        type="button"
                        data-testid={`apply-approach-${ap.id}`}
                        disabled={hud.simStage === 'SIMULATING'}
                        onClick={() => applyArchitectureBlueprint(ap)}
                        className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 disabled:opacity-45 border border-sky-400/50 text-sky-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        {hud.simStage === 'SIMULATING'
                          ? 'Đang giả lập (dừng để đổi mẫu)'
                          : `Áp dụng mẫu này lên sơ đồ ($${bpCost})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Post-Simulation Optimization Report / Victory / 502 Bad Gateway Modal */}
      {showReportModal && endEvaluation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={endEvaluation.verdictTitle}
          className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#1E2E4A]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-mono text-2xl font-bold shrink-0 ${
                    phase === 'GAME_OVER'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/60'
                      : gradeBadgeStyle(endEvaluation.grade)
                  }`}
                >
                  {phase === 'GAME_OVER' ? '502' : endEvaluation.grade}
                </div>
                <div>
                  <p
                    className={`text-xs font-mono ${
                      phase === 'GAME_OVER'
                        ? 'text-rose-400'
                        : endEvaluation.isOptimal
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                    }`}
                  >
                    {phase === 'GAME_OVER'
                      ? '502 BAD GATEWAY · DATABASE QUÁ TẢI 100% CPU'
                      : `${currentLevel.code} · KẾT QUẢ GIẢ LẬP ${endEvaluation.totalScore}/100 · HẠNG ${endEvaluation.grade}`}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {phase === 'GAME_OVER'
                      ? 'Hệ thống sập khi chạy giả lập!'
                      : endEvaluation.verdictTitle}
                  </h3>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300 tabular-nums">
                Độ trễ TB: <strong className="text-cyan-300">{hud.avgLatencyMs}ms</strong> · Đỉnh CPU:{' '}
                <strong className="text-amber-300">{hud.peakDbCpu}%</strong>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {endEvaluation.verdictSummary}
            </p>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs tabular-nums">
              {[
                { label: 'Hiệu năng & SLA', val: endEvaluation.pillars.performance, color: 'bg-cyan-400' },
                { label: 'An toàn & Tin cậy', val: endEvaluation.pillars.reliability, color: 'bg-emerald-400' },
                { label: 'Tối ưu Chi phí', val: endEvaluation.pillars.costEfficiency, color: 'bg-amber-400' },
                { label: 'Khớp Hoàn Cảnh', val: endEvaluation.pillars.architectureFit, color: 'bg-sky-400' },
              ].map((pillar) => (
                <div key={pillar.label} className="p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A] space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] text-slate-400 truncate">{pillar.label}</span>
                    <strong className="font-mono text-white">{pillar.val}%</strong>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full ${pillar.color}`} style={{ width: `${pillar.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths & Why Not Optimal Critique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs max-h-[240px] overflow-y-auto pr-1">
              <div className="space-y-2">
                <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Điểm đạt được trong giả lập</span>
                </p>
                {endEvaluation.strengths.length > 0 ? (
                  endEvaluation.strengths.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-100 leading-relaxed"
                    >
                      {st}
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A] text-slate-400">
                    Chưa đạt mốc chuẩn nào nổi bật — hãy quay lại sửa sơ đồ bên dưới.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    {endEvaluation.whyNotOptimal.length > 0
                      ? `Tại sao chưa tối ưu & Cần làm gì? (${endEvaluation.whyNotOptimal.length})`
                      : 'Thiết kế đã Tối Ưu Toàn Diện!'}
                  </span>
                </p>
                {endEvaluation.whyNotOptimal.length > 0 ? (
                  endEvaluation.whyNotOptimal.map((crit, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border space-y-1 leading-relaxed ${
                        crit.severity === 'critical'
                          ? 'bg-rose-500/10 border-rose-400/40 text-rose-100'
                          : 'bg-amber-500/10 border-amber-400/35 text-amber-100'
                      }`}
                    >
                      <p className="font-bold">{crit.title}</p>
                      <p className="opacity-90">{crit.reason}</p>
                      <p className="text-sky-300 font-medium">Cần làm gì: {crit.suggestion}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 leading-relaxed">
                    Không phát hiện điểm nghẽn nào! Kiến trúc của bạn đạt điểm S tối ưu cho bối cảnh {currentLevel.domain}.
                  </div>
                )}
              </div>
            </div>

            {/* Scenario Lesson */}
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-slate-200 leading-relaxed">
              <strong className="text-sky-300">Bài học kiến trúc ({currentLevel.code}):</strong>{' '}
              {currentLevel.learningLesson}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPhase('TITLE')}
                className="px-3.5 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer"
              >
                Danh Sách 16 Màn
              </button>
              <button
                type="button"
                data-testid="arch-back-to-design-btn"
                onClick={stopAndEditDesign}
                className="px-4 py-2 rounded-xl border border-sky-400/60 bg-sky-500/20 hover:bg-sky-500/30 text-xs sm:text-sm font-bold text-sky-200 cursor-pointer"
              >
                Quay Lại Sửa Thiết Kế
              </button>
              <button
                type="button"
                onClick={() => startScenario(levelIdx)}
                className="px-4 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs sm:text-sm font-semibold text-white cursor-pointer"
              >
                Làm Lại Từ Đầu
              </button>
              {phase === 'VICTORY' && levelIdx + 1 < TRAFFIC_LEVELS.length && (
                <button
                  type="button"
                  data-testid="arch-next-level-btn"
                  onClick={() => startScenario(levelIdx + 1)}
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Sang Màn {levelIdx + 2}/{TRAFFIC_LEVELS.length} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
