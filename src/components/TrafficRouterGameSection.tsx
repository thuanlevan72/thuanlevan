import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  Cable,
  CheckCircle2,
  Cpu,
  Flame,
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
  ARCH_MODES,
  buildBlueprintGraph,
  canAddEdge,
  CANVAS_H,
  CANVAS_W,
  computeBlueprintCost,
  createInitialNodes,
  diagnoseArchitectureTelemetry,
  distToCubicBezier,
  evaluatePacketAtNode,
  evaluateSolutionOptimization,
  getArchMode,
  getEffectiveScenarioConfig,
  getNodeCapabilityDetails,
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
  type ArchModeId,
  type InfraEdge,
  type InfraNode,
  type InfraNodeType,
  type LiveTelemetryDiagnosis,
  type PacketKind,
  type PlaceableNodeType,
  type RackSlot,
  type SolutionEvaluation,
} from '../utils/trafficRouterEngine.ts';
import {
  renderArchitectureCanvas,
  type CanvasShockwave,
  type CanvasSpark,
} from '../utils/trafficRouterCanvasFx.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface TrafficRouterGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type ToolMode = PlaceableNodeType | 'wire' | 'cut';
type GamePhase = 'TITLE' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';
type SimStage = 'DESIGNING' | 'SIMULATING';
type ChapterFilter = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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
  waveDurationTotal: number;
  deliveredOk: number;
  cacheHits: number;
  blockedAttacks: number;
  breachedAttacks: number;
  hasValidRoute: boolean;
  selectedNode: InfraNode | null;
  notice: string;
  topologyRev: number;
  cpuHistory: number[];
  latencyHistory: number[];
  telemetry: LiveTelemetryDiagnosis;
}

type SavedGradesMap = Record<string, 'S' | 'A' | 'B' | 'C'>;

const SAVE_GRADES_KEY = 'thuanle-arch-grades-v3';

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

function gradeKey(levelId: number, modeId: ArchModeId): string {
  return `${levelId}:${modeId}`;
}

function saveGrade(
  levelId: number,
  modeId: ArchModeId,
  grade: 'S' | 'A' | 'B' | 'C',
  prev: SavedGradesMap
): SavedGradesMap {
  const rank: Record<'S' | 'A' | 'B' | 'C', number> = { S: 4, A: 3, B: 2, C: 1 };
  const key = gradeKey(levelId, modeId);
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

function gradeBadgeStyle(grade: 'S' | 'A' | 'B' | 'C'): string {
  if (grade === 'S') return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60';
  if (grade === 'A') return 'bg-sky-500/20 text-sky-300 border-sky-400/60';
  if (grade === 'B') return 'bg-amber-500/20 text-amber-300 border-amber-400/60';
  return 'bg-rose-500/20 text-rose-300 border-rose-400/60';
}

function TelemetrySparkline({
  values,
  maxVal,
  stroke,
  thresholdVal,
  label,
  currentDisplay,
}: {
  values: readonly number[];
  maxVal: number;
  stroke: string;
  thresholdVal?: number;
  label: string;
  currentDisplay: string;
}) {
  const w = 160;
  const h = 36;
  const pts = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const safeMax = Math.max(1, maxVal);
  const path = pts
    .map((v, i) => {
      const x = (i / Math.max(1, pts.length - 1)) * w;
      const y = h - 3 - Math.min(1, Math.max(0, v / safeMax)) * (h - 6);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const thresholdY =
    thresholdVal !== undefined
      ? h - 3 - Math.min(1, Math.max(0, thresholdVal / safeMax)) * (h - 6)
      : null;

  return (
    <div className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#0B1320] border border-[#1E2E4A]">
      <div className="min-w-0">
        <span className="block text-[10px] font-mono text-slate-400">{label}</span>
        <strong className="font-mono text-xs tabular-nums" style={{ color: stroke }}>
          {currentDisplay}
        </strong>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-28 sm:w-36 h-9 shrink-0 overflow-visible"
        aria-hidden="true"
      >
        {thresholdY !== null && (
          <line
            x1={0}
            y1={thresholdY}
            x2={w}
            y2={thresholdY}
            stroke="rgba(248, 113, 113, 0.45)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        <path d={path} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
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
  const [modeId, setModeId] = useState<ArchModeId>('standard');
  const [tool, setTool] = useState<ToolMode>('redis');
  const [speedMult, setSpeedMult] = useState<1 | 2 | 3>(2);
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [savedGrades, setSavedGrades] = useState<SavedGradesMap>(() => loadSavedGrades());
  const [sideTab, setSideTab] = useState<'diagnosis' | 'approaches'>('diagnosis');
  const [endEvaluation, setEndEvaluation] = useState<SolutionEvaluation | null>(null);

  const currentLevel = TRAFFIC_LEVELS[levelIdx];
  const effectiveConfig = useMemo(
    () => getEffectiveScenarioConfig(currentLevel, modeId),
    [currentLevel, modeId]
  );
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

  const initialNodes = createInitialNodes(TRAFFIC_LEVELS[0]);
  const initialEdges = [...TRAFFIC_LEVELS[0].initialEdges];
  const initialTelemetry = diagnoseArchitectureTelemetry(initialNodes, initialEdges, {
    deliveredOk: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    dbCpu: 10,
  });

  // Mutable simulation ref driven at 60fps
  const initialCfg = getEffectiveScenarioConfig(TRAFFIC_LEVELS[0], 'standard');
  const simRef = useRef({
    baseLevel: TRAFFIC_LEVELS[0],
    level: initialCfg.effectiveLevel,
    modeId: 'standard' as ArchModeId,
    cpuLoadMult: initialCfg.cpuLoadMult,
    heatPenaltyMult: initialCfg.heatPenaltyMult,
    strictSecurity: initialCfg.mode.strictSecurity,
    modeName: initialCfg.mode.name,
    nodes: initialNodes,
    edges: initialEdges,
    packets: [] as ActivePacket[],
    fxs: [] as FloatingFx[],
    shockwaves: [] as CanvasShockwave[],
    sparks: [] as CanvasSpark[],
    budget: initialCfg.startingBudget,
    earnedBudgetTotal: initialCfg.startingBudget,
    dbCpu: 10,
    peakDbCpu: 10,
    systemHealth: 100,
    latencySum: 0,
    latencySamples: 0,
    waveIndex: 0,
    waveActive: false,
    simStage: 'DESIGNING' as SimStage,
    waveTimer: 0,
    waveDurationTotal: initialCfg.effectiveLevel.waves[0]?.durationSec ?? 8,
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
    timeSec: 0,
    sampleAccum: 0,
    cpuHistory: [10] as number[],
    latencyHistory: [24] as number[],
    topologyRev: 1,
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    outcome: null as 'victory' | 'gameover' | null,
  });

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    budget: initialCfg.startingBudget,
    earnedBudgetTotal: initialCfg.startingBudget,
    dbCpu: 10,
    peakDbCpu: 10,
    systemHealth: 100,
    avgLatencyMs: 24,
    waveIndex: 0,
    waveActive: false,
    simStage: 'DESIGNING',
    waveTimeLeft: 0,
    waveDurationTotal: initialCfg.effectiveLevel.waves[0]?.durationSec ?? 8,
    deliveredOk: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    hasValidRoute: true,
    selectedNode: null,
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    topologyRev: 1,
    cpuHistory: [10],
    latencyHistory: [24],
    telemetry: initialTelemetry,
  }));

  const syncHud = useCallback(() => {
    const s = simRef.current;
    const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
    const sel = s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null;
    const telemetry = diagnoseArchitectureTelemetry(s.nodes, s.edges, {
      deliveredOk: s.deliveredOk,
      cacheHits: s.cacheHits,
      blockedAttacks: s.blockedAttacks,
      breachedAttacks: s.breachedAttacks,
      dbCpu: s.dbCpu,
    });
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
      waveDurationTotal: s.waveDurationTotal,
      deliveredOk: s.deliveredOk,
      cacheHits: s.cacheHits,
      blockedAttacks: s.blockedAttacks,
      breachedAttacks: s.breachedAttacks,
      hasValidRoute: hasPathToDatabase(s.nodes, s.edges),
      selectedNode: sel ? { ...sel } : null,
      notice: s.notice,
      topologyRev: s.topologyRev,
      cpuHistory: [...s.cpuHistory],
      latencyHistory: [...s.latencyHistory],
      telemetry,
    });
  }, []);

  const liveAnalysis = useMemo(() => {
    const s = simRef.current;
    return analyzeArchitectureDesign(effectiveConfig.effectiveLevel, s.nodes, s.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveConfig, hud.topologyRev]);

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
      strictSecurity: s.strictSecurity,
      modeName: s.modeName,
    });
  }, []);

  const startScenario = useCallback(
    (idx: number, overrideModeId?: ArchModeId) => {
      const clamped = Math.max(0, Math.min(TRAFFIC_LEVELS.length - 1, idx));
      const lvl = TRAFFIC_LEVELS[clamped];
      const nextModeId = overrideModeId ?? modeId;
      const cfg = getEffectiveScenarioConfig(lvl, nextModeId);
      setLevelIdx(clamped);
      if (overrideModeId) setModeId(overrideModeId);
      setEndEvaluation(null);
      simRef.current = {
        baseLevel: lvl,
        level: cfg.effectiveLevel,
        modeId: nextModeId,
        cpuLoadMult: cfg.cpuLoadMult,
        heatPenaltyMult: cfg.heatPenaltyMult,
        strictSecurity: cfg.mode.strictSecurity,
        modeName: cfg.mode.name,
        nodes: createInitialNodes(lvl),
        edges: [...lvl.initialEdges],
        packets: [],
        fxs: [],
        shockwaves: [],
        sparks: [],
        budget: cfg.startingBudget,
        earnedBudgetTotal: cfg.startingBudget,
        dbCpu: 10,
        peakDbCpu: 10,
        systemHealth: 100,
        latencySum: 0,
        latencySamples: 0,
        waveIndex: 0,
        waveActive: false,
        simStage: 'DESIGNING',
        waveTimer: 0,
        waveDurationTotal: cfg.effectiveLevel.waves[0]?.durationSec ?? 8,
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
        timeSec: 0,
        sampleAccum: 0,
        cpuHistory: [10],
        latencyHistory: [24],
        topologyRev: 1,
        notice: `${cfg.mode.name}: ${lvl.tacticalTip}`,
        outcome: null,
      };
      setPaused(false);
      setPhase('PLAYING');
      syncHud();
    },
    [modeId, syncHud]
  );

  const switchDesignMode = useCallback(
    (nextModeId: ArchModeId) => {
      const s = simRef.current;
      if (s.simStage === 'SIMULATING') return;
      const cfg = getEffectiveScenarioConfig(s.baseLevel, nextModeId);
      setModeId(nextModeId);
      s.modeId = nextModeId;
      s.level = cfg.effectiveLevel;
      s.cpuLoadMult = cfg.cpuLoadMult;
      s.heatPenaltyMult = cfg.heatPenaltyMult;
      s.strictSecurity = cfg.mode.strictSecurity;
      s.modeName = cfg.mode.name;

      const spentCost = s.nodes.reduce((sum, n) => {
        if (n.fixed || n.type === 'ingress' || n.type === 'database') return sum;
        const entry = getNodeCatalogEntry(n.type);
        const isStarterFree = n.id === 'app-init' && n.level === 1;
        if (isStarterFree) return sum;
        const starterUpgradeOnly = n.id === 'app-init' && n.level >= 2;
        return sum + (starterUpgradeOnly ? entry.upgradeCost : entry.cost + (n.level >= 2 ? entry.upgradeCost : 0));
      }, 0);

      if (spentCost > cfg.startingBudget) {
        s.nodes = createInitialNodes(s.baseLevel);
        s.edges = [...s.baseLevel.initialEdges];
        s.selectedNodeId = null;
        s.budget = cfg.startingBudget;
        s.notice = `Đổi sang ${cfg.mode.name} ($${cfg.startingBudget}) — đã làm mới sơ đồ cho khớp ngân sách!`;
      } else {
        s.budget = cfg.startingBudget - spentCost;
        s.notice = `Đã chuyển chế độ: ${cfg.mode.name} (${cfg.mode.ruleSummary})`;
      }
      s.earnedBudgetTotal = cfg.startingBudget;
      s.topologyRev += 1;
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
    s.waveDurationTotal = waveDef.durationSec;
    s.spawnTimer = 0.15;
    s.packets = [];
    s.fxs = [];
    s.shockwaves = [];
    s.sparks = [];
    s.dbCpu = 10;
    s.peakDbCpu = 10;
    s.systemHealth = 100;
    s.latencySum = 0;
    s.latencySamples = 0;
    s.sampleAccum = 0;
    s.cpuHistory = [10];
    s.latencyHistory = [24];
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

  const resetDesignToStarter = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') return;
    s.nodes = createInitialNodes(s.baseLevel);
    s.edges = [...s.baseLevel.initialEdges];
    s.packets = [];
    s.fxs = [];
    s.shockwaves = [];
    s.sparks = [];
    s.selectedNodeId = null;
    s.wireSourceId = null;
    s.budget = s.level.startingBudget;
    s.earnedBudgetTotal = s.level.startingBudget;
    s.topologyRev += 1;
    s.notice = 'Đã làm sạch sơ đồ về cấu trúc khởi đầu!';
    playRouterSfx(ensureAudio(), 'block', muted);
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
      if (n.id === 'app-init' && n.level === 1) return sum;
      const entry = getNodeCatalogEntry(n.type);
      if (n.id === 'app-init' && n.level >= 2) return sum + entry.upgradeCost;
      return sum + entry.cost + (n.level >= 2 ? entry.upgradeCost : 0);
    }, 0);
    s.budget = Math.max(0, s.level.startingBudget - spentCost);
    s.earnedBudgetTotal = s.level.startingBudget;
    s.simStage = 'DESIGNING';
    s.waveIndex = 0;
    s.waveActive = false;
    s.waveTimer = 0;
    s.waveDurationTotal = s.level.waves[0]?.durationSec ?? 8;
    s.packets = [];
    s.fxs = [];
    s.shockwaves = [];
    s.sparks = [];
    s.dbCpu = 10;
    s.peakDbCpu = 10;
    s.systemHealth = 100;
    s.latencySum = 0;
    s.latencySamples = 0;
    s.sampleAccum = 0;
    s.cpuHistory = [10];
    s.latencyHistory = [24];
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
    s.shockwaves.push({
      x: node.x,
      y: node.y,
      color: '#34D399',
      radius: 12,
      maxRadius: 56,
      life: 0.45,
      maxLife: 0.45,
    });
    s.fxs.push({
      x: node.x,
      y: node.y - 32,
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
    const refund = getSellRefund(node, true);
    s.budget += refund;
    s.nodes = s.nodes.filter((n) => n.id !== node.id);
    s.edges = s.edges.filter((e) => e.fromId !== node.id && e.toId !== node.id);
    s.packets = s.packets.filter((p) => p.fromId !== node.id && p.toId !== node.id);
    s.selectedNodeId = null;
    s.topologyRev += 1;
    s.notice = `Đã tháo node và hoàn lại 100% chi phí (+$${refund}).`;
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
    const pt = canvasCoords(e);
    const isTouch = e.pointerType === 'touch';
    const nodeHitRadius = isTouch ? 46 : 32;
    const edgeHitRadius = isTouch ? 26 : 14;
    const slotHitRadius = isTouch ? 46 : 34;
    const clickedNode = s.nodes.find((n) => Math.hypot(pt.x - n.x, pt.y - n.y) <= nodeHitRadius);

    if (s.simStage === 'SIMULATING') {
      if (clickedNode) {
        s.selectedNodeId = clickedNode.id;
        s.notice = `Đang theo dõi ${getNodeVisualMeta(clickedNode.type).label} (chế độ đọc khi giả lập).`;
      } else {
        s.notice = 'Đang chạy giả lập! Nhấn "Dừng & Sửa Thiết Kế" nếu muốn thay đổi sơ đồ.';
      }
      syncHud();
      return;
    }

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
        s.notice = `Đang kéo dây từ ${getNodeVisualMeta(clickedNode.type).label} — nhấp vào node đích (viền xanh lá)!`;
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
      let bestDist = edgeHitRadius;
      for (const edge of s.edges) {
        const a = s.nodes.find((n) => n.id === edge.fromId);
        const b = s.nodes.find((n) => n.id === edge.toId);
        if (!a || !b) continue;
        const d = distToCubicBezier(pt.x, pt.y, a.x, a.y, b.x, b.y);
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
      (sl) => Math.hypot(pt.x - sl.x, pt.y - sl.y) <= slotHitRadius
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
        distToCubicBezier(newNode.x, newNode.y, a.x, a.y, b.x, b.y) <= 26
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
    s.shockwaves.push({
      x: newNode.x,
      y: newNode.y,
      color: entry.color,
      radius: 10,
      maxRadius: 48,
      life: 0.4,
      maxLife: 0.4,
    });
    s.fxs.push({
      x: newNode.x,
      y: newNode.y - 32,
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

    const spawnBurstSparks = (x: number, y: number, color: string, count: number) => {
      const s = simRef.current;
      if (s.sparks.length > 72) return;
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const spd = 28 + Math.random() * 44;
        s.sparks.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color,
          size: 1.8 + Math.random() * 1.4,
          life: 0.35 + Math.random() * 0.2,
          maxLife: 0.55,
        });
      }
    };

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const s = simRef.current;
      s.timeSec += rawDt;
      const isRunningSim = s.simStage === 'SIMULATING' && !paused && !s.outcome;
      const dt = isRunningSim ? rawDt * speedMult : 0;

      // Subtle slow dash animation during DESIGNING when route is valid
      if (s.simStage === 'DESIGNING') {
        s.dashOffset = (s.dashOffset - rawDt * 12) % 24;
      }

      // Advance shockwaves & sparks even cleanly during idle/designing
      if (!paused) {
        s.shockwaves = s.shockwaves
          .map((sw) => ({ ...sw, life: sw.life - rawDt }))
          .filter((sw) => sw.life > 0);
        s.sparks = s.sparks
          .map((sp) => ({
            ...sp,
            x: sp.x + sp.vx * rawDt,
            y: sp.y + sp.vy * rawDt,
            vx: sp.vx * 0.94,
            vy: sp.vy * 0.94,
            life: sp.life - rawDt,
          }))
          .filter((sp) => sp.life > 0);
      }

      // Advance simulation ONLY after player presses "Sẵn Sàng — Chạy Giả Lập"
      if (dt > 0) {
        s.dashOffset = (s.dashOffset - dt * 28) % 24;

        for (const node of s.nodes) {
          node.heat = Math.max(0, node.heat - dt * 0.45);
        }

        s.dbCpu = Math.max(6, s.dbCpu - s.level.dbCoolingPerSec * dt);

        // Rolling sparkline sampling every 0.4s
        s.sampleAccum += dt;
        if (s.sampleAccum >= 0.4) {
          s.sampleAccum = 0;
          const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
          s.cpuHistory = [...s.cpuHistory.slice(-35), Math.round(s.dbCpu)];
          s.latencyHistory = [...s.latencyHistory.slice(-35), avgLat];
        }

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
              setSavedGrades((prev) => saveGrade(s.level.id, s.modeId, evalResult.grade, prev));
              setPhase('VICTORY');
              syncHud();
            } else {
              const nextWave = s.level.waves[s.waveIndex];
              s.waveActive = true;
              s.waveTimer = nextWave.durationSec;
              s.waveDurationTotal = nextWave.durationSec;
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
            p.writeDamping,
            s.heatPenaltyMult
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
            if (s.shockwaves.length < 18) {
              s.shockwaves.push({
                x: target.x,
                y: target.y,
                color: '#FB7185',
                radius: 10,
                maxRadius: 38,
                life: 0.34,
                maxLife: 0.34,
              });
            }
            spawnBurstSparks(target.x, target.y, '#FB7185', 4);
            s.fxs.push({
              x: target.x,
              y: target.y - 30,
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
            if (s.shockwaves.length < 18) {
              s.shockwaves.push({
                x: target.x,
                y: target.y,
                color: '#22D3EE',
                radius: 10,
                maxRadius: 36,
                life: 0.34,
                maxLife: 0.34,
              });
            }
            spawnBurstSparks(target.x, target.y, '#22D3EE', 3);
            s.fxs.push({
              x: target.x,
              y: target.y - 30,
              text: `HIT ${totalLatency}ms`,
              color: '#22D3EE',
              life: 0.65,
              maxLife: 0.65,
            });
            playRouterSfx(ensureAudio(), 'cache', muted);
          } else if (decision.outcome === 'delivered') {
            target.processedCount += 1;
            s.dbCpu = Math.min(100, s.dbCpu + decision.dbCpuDelta * s.cpuLoadMult);
            s.peakDbCpu = Math.max(s.peakDbCpu, s.dbCpu);
            if (decision.integrityDelta < 0) {
              s.breachedAttacks += 1;
              s.systemHealth = Math.max(0, s.systemHealth + decision.integrityDelta);
              if (s.shockwaves.length < 18) {
                s.shockwaves.push({
                  x: target.x,
                  y: target.y,
                  color: '#EF4444',
                  radius: 12,
                  maxRadius: 50,
                  life: 0.45,
                  maxLife: 0.45,
                });
              }
              spawnBurstSparks(target.x, target.y, '#EF4444', 6);
              s.fxs.push({
                x: target.x,
                y: target.y - 34,
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
          s.systemHealth = Math.max(0, s.systemHealth - dt * 9);
        } else if (s.dbCpu < 82 && s.systemHealth < 100 && s.waveActive) {
          s.systemHealth = Math.min(100, s.systemHealth + dt * 2.5);
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

      // 3. HiDPI Canvas Render via trafficRouterCanvasFx
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
        const targetW = Math.round(CANVAS_W * dpr);
        const targetH = Math.round(CANVAS_H * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const liveDiag = diagnoseArchitectureTelemetry(s.nodes, s.edges, {
          deliveredOk: s.deliveredOk,
          cacheHits: s.cacheHits,
          blockedAttacks: s.blockedAttacks,
          breachedAttacks: s.breachedAttacks,
          dbCpu: s.dbCpu,
        });

        renderArchitectureCanvas(ctx, {
          nodes: s.nodes,
          edges: s.edges,
          packets: s.packets,
          fxs: s.fxs,
          shockwaves: s.shockwaves,
          sparks: s.sparks,
          simStage: s.simStage,
          tool,
          selectedNodeId: s.selectedNodeId,
          wireSourceId: s.wireSourceId,
          hoverPos: s.hoverPos,
          dashOffset: s.dashOffset,
          dbCpu: s.dbCpu,
          unusedNodeIds: new Set(liveDiag.unusedNodeIds),
          timeSec: s.timeSec,
        });
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

  const clearedStagesCount = useMemo(() => {
    const ids = new Set<string>();
    for (const k of Object.keys(savedGrades)) {
      const stageId = k.split(':')[0];
      if (stageId) ids.add(stageId);
    }
    return ids.size;
  }, [savedGrades]);
  const clearedModesCount = Object.keys(savedGrades).length;

  if (phase === 'TITLE') {
    const firstWaveWeights = effectiveConfig.waves[0].weights;
    const activeMode = effectiveConfig.mode;
    return (
      <section
        id="traffic-router-section"
        aria-label={`Thiết Kế Kiến Trúc Hệ Thống — ${TRAFFIC_LEVELS.length} Hoàn Cảnh & ${ARCH_MODES.length} Chế Độ Chơi`}
        className="rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-5 sm:p-7 mobile-ls:p-3 shadow-sm"
      >
        <div className="grid grid-cols-1 mobile-ls:grid-cols-12 lg:grid-cols-12 gap-6 mobile-ls:gap-3 items-start">
          {/* Left 7 cols: Chapter tabs & 24-level catalog */}
          <div className="mobile-ls:col-span-7 lg:col-span-7 space-y-4 mobile-ls:space-y-2">
            <div className="space-y-1.5 mobile-ls:space-y-1">
              <p className="text-xs font-mono tracking-wide text-sky-400 mobile-ls:text-[11px]">
                System Architecture Designer · {TRAFFIC_LEVELS.length} Hoàn Cảnh Thực Tế · {ARCH_MODES.length} Chế Độ Chơi / Màn · Chấm Điểm Tối Ưu
              </p>
              <h1 className="text-2xl sm:text-3xl mobile-ls:text-lg font-bold tracking-tight [text-wrap:balance]">
                Thiết Kế Kiến Trúc Hệ Thống
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mobile-ls:line-clamp-2">
                Chinh phục <strong>{TRAFFIC_LEVELS.length} tình huống thực tế</strong> (Tin tức, Flash Sale, Chứng khoán, AI RAG, Multi-Tenant ERP, Active-Active...) qua <strong>{ARCH_MODES.length} chế độ chơi</strong> mỗi màn và nhận phân tích <em>tại sao giải pháp chưa tối ưu</em>.
              </p>
            </div>

            {/* Chapter Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc theo chương">
              {[
                { id: 0 as ChapterFilter, label: `Tất cả (${TRAFFIC_LEVELS.length})` },
                { id: 1 as ChapterFilter, label: 'Ch.1 Web & Cache' },
                { id: 2 as ChapterFilter, label: 'Ch.2 Queue & Async' },
                { id: 3 as ChapterFilter, label: 'Ch.3 Đặc Thù' },
                { id: 4 as ChapterFilter, label: 'Ch.4 Quy Mô Lớn' },
                { id: 5 as ChapterFilter, label: 'Ch.5 Thời Gian Thực' },
                { id: 6 as ChapterFilter, label: 'Ch.6 AI & Toàn Cầu' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={chapterFilter === tab.id}
                  onClick={() => setChapterFilter(tab.id)}
                  className={`px-2.5 py-1.5 mobile-ls:px-2 mobile-ls:py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    chapterFilter === tab.id
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-[#111C33] text-slate-300 border border-[#1E2E4A] hover:border-sky-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <span className="ml-auto text-xs font-mono text-slate-400 tabular-nums">
                Màn: {clearedStagesCount}/{TRAFFIC_LEVELS.length} · Huy hiệu: {clearedModesCount}/{TRAFFIC_LEVELS.length * ARCH_MODES.length}
              </span>
            </div>

            {/* Scenario Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mobile-ls:gap-1.5 max-h-[410px] mobile-ls:max-h-[195px] overflow-y-auto pr-1">
              {filteredLevels.map((lvl) => {
                const idx = TRAFFIC_LEVELS.findIndex((x) => x.id === lvl.id);
                const isSelected = idx === levelIdx;
                const savedGrade = savedGrades[gradeKey(lvl.id, modeId)];
                const clearedModesForLvl = ARCH_MODES.filter(
                  (m) => Boolean(savedGrades[gradeKey(lvl.id, m.id)])
                ).length;
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
                        {lvl.code} · {lvl.difficulty} · {clearedModesForLvl}/{ARCH_MODES.length} Chế độ
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
                <span>
                  Triển Khai {currentLevel.code} · {activeMode.shortName} (Màn {levelIdx + 1}/{TRAFFIC_LEVELS.length})
                </span>
              </button>
              <span className="text-xs text-slate-400">
                Bước 1: Chọn chế độ &amp; thiết kế · Bước 2: Sẵn Sàng giả lập · Bước 3: Chấm điểm tối ưu
              </span>
            </div>
          </div>

          {/* Right 5 cols: Game Mode Selector + Scenario Context & Approaches */}
          <div className="mobile-ls:col-span-5 lg:col-span-5 space-y-3 mobile-ls:max-h-[calc(100dvh-76px)] mobile-ls:overflow-y-auto mobile-ls:pr-1">
            <div className="rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-4 sm:p-5 mobile-ls:p-2.5 space-y-3.5 mobile-ls:space-y-2">
              {/* Per-Stage Game Mode Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Chọn Chế Độ Chơi Cho {currentLevel.code} ({ARCH_MODES.length} chế độ):</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    ${effectiveConfig.startingBudget} · {effectiveConfig.waves.length} Đợt
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {ARCH_MODES.map((m) => {
                    const active = m.id === modeId;
                    const modeGrade = savedGrades[gradeKey(currentLevel.id, m.id)];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        data-testid={`arch-mode-${m.id}`}
                        onClick={() => setModeId(m.id)}
                        className={`px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-sky-500/20 border-sky-400 text-white'
                            : 'bg-[#132138] border-[#1E2E4A] hover:border-sky-500/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                          <span className="truncate" style={{ color: active ? '#FFFFFF' : m.color }}>
                            {m.shortName}
                          </span>
                          {modeGrade && (
                            <span className={`px-1 rounded text-[9px] font-mono border ${gradeBadgeStyle(modeGrade)}`}>
                              {modeGrade}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{m.badge}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-300 bg-[#132138] border border-[#1E2E4A] rounded-lg px-2.5 py-1.5 leading-snug">
                  <strong style={{ color: activeMode.color }}>{activeMode.name}:</strong>{' '}
                  {activeMode.description}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 text-xs font-mono text-sky-400 pt-1 border-t border-[#1E2E4A]">
                <span>{currentLevel.chapterTitle}</span>
                <span>SLA ≤ {effectiveConfig.targetSlaMs}ms · DB Cool {effectiveConfig.dbCoolingPerSec}/s</span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{currentLevel.title}</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentLevel.contextDescription}
                </p>
              </div>

              {/* Traffic Profile Mix (Visual Stacked Bar + Breakdown) */}
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full overflow-hidden flex bg-[#132138] border border-[#1E2E4A]">
                  <div className="bg-sky-400" style={{ width: `${firstWaveWeights.read * 100}%` }} title="GET" />
                  <div className="bg-amber-400" style={{ width: `${firstWaveWeights.write * 100}%` }} title="POST" />
                  <div className="bg-pink-400" style={{ width: `${firstWaveWeights.media * 100}%` }} title="MEDIA" />
                  <div className="bg-rose-500" style={{ width: `${firstWaveWeights.ddos * 100}%` }} title="DDoS" />
                  <div className="bg-purple-400" style={{ width: `${firstWaveWeights.sqli * 100}%` }} title="SQLi" />
                </div>
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
              </div>

              {/* Multiple Design Approaches Preview */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Các cách thiết kế khả thi ({currentLevel.approaches.length} phương án):</span>
                </p>
                <div className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
                  {currentLevel.approaches.map((ap) => (
                    <div
                      key={ap.id}
                      className="p-2 rounded-xl bg-[#132138] border border-[#1E2E4A] text-xs space-y-0.5"
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
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs space-y-0.5">
                <p className="font-semibold text-sky-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Bài học kiến trúc:</span>
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

  const activeMode = getArchMode(modeId);
  const showReportModal = (phase === 'VICTORY' || phase === 'GAME_OVER') && endEvaluation !== null;

  return (
    <section
      id="traffic-router-section"
      aria-label={`Thiết Kế Kiến Trúc — ${currentLevel.title} (${activeMode.name})`}
      className="relative rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-3.5 sm:p-5 mobile-ls:p-2 shadow-sm"
    >
      {/* Top Telemetry HUD */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mobile-ls:flex-row mobile-ls:items-center mobile-ls:justify-between gap-2.5 mobile-ls:gap-1.5 pb-3 mobile-ls:pb-1.5 border-b border-[#1E2E4A]">
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
            className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border whitespace-nowrap bg-[#132138]"
            style={{ color: activeMode.color, borderColor: `${activeMode.color}66` }}
          >
            {activeMode.shortName}
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
            <span className="text-[10px] text-slate-400 font-mono">/${effectiveConfig.startingBudget}</span>
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
                hud.avgLatencyMs <= effectiveConfig.targetSlaMs ? 'text-cyan-300' : 'text-amber-300'
              }`}
            >
              {hud.avgLatencyMs}ms
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">/{effectiveConfig.targetSlaMs}ms</span>
          </div>

          <div className="whitespace-nowrap">
            <span className="text-slate-400 text-[11px] mr-1">ĐỢT</span>
            <strong className="font-mono text-white">
              {hud.simStage === 'DESIGNING'
                ? `0/${effectiveConfig.waves.length}`
                : `${Math.min(hud.waveIndex + 1, effectiveConfig.waves.length)}/${effectiveConfig.waves.length}`}
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
            className="min-w-[40px] min-h-[40px] sm:p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 disabled:opacity-40 flex items-center justify-center cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => startScenario(levelIdx)}
            aria-label="Làm lại từ đầu"
            className="min-w-[40px] min-h-[40px] sm:p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar (Active during Designing Phase) */}
      <div className="mt-2.5 flex flex-nowrap overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 items-center gap-1.5 text-xs">
        <span className="text-[11px] font-mono text-slate-400 mr-1 shrink-0">CHẾ ĐỘ:</span>
        {ARCH_MODES.map((m) => {
          const active = m.id === modeId;
          return (
            <button
              key={m.id}
              type="button"
              disabled={hud.simStage === 'SIMULATING'}
              onClick={() => switchDesignMode(m.id)}
              title={m.ruleSummary}
              className={`min-h-[38px] shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                active
                  ? 'bg-sky-500/25 border-sky-400 text-white'
                  : 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-400/60 text-slate-300'
              }`}
            >
              <span style={{ color: active ? '#FFFFFF' : m.color }}>{m.shortName}</span>
            </button>
          );
        })}
        <span className="ml-auto text-[11px] text-slate-400 font-mono hidden md:inline">
          {activeMode.ruleSummary}
        </span>
      </div>

      {/* Main Split Workspace: Canvas + Right Inspector */}
      <div className="mt-3 mobile-ls:mt-1.5 grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_265px] xl:grid-cols-12 gap-4 mobile-ls:gap-2.5 items-start">
        {/* Left/Center 8 Cols: Canvas + Tool Palette */}
        <div className="mobile-ls:min-w-0 xl:col-span-8 space-y-3 mobile-ls:space-y-2">
          <div className="relative flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerMove={handleCanvasPointerMove}
              onPointerDown={handleCanvasPointerDown}
              data-testid="architecture-canvas"
              className="w-full mobile-ls:max-w-[min(100%,calc((100dvh-145px)*1.84))] mobile-ls:mx-auto block aspect-[920/500] h-auto rounded-xl border border-[#1E2E4A] cursor-crosshair touch-none"
              aria-label="Sơ đồ thiết kế kiến trúc hệ thống"
            />
          </div>

          {/* Packet Legend & Live Wave Progress / Telemetry Sparkline Strip */}
          <div className="rounded-xl border border-[#1E2E4A] bg-[#0F192B] p-2.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
                  GET (Đọc)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                  POST (Ghi)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 bg-pink-400 inline-block" />
                  MEDIA
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/40 inline-block" />
                  DDoS
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rotate-45 bg-purple-400 inline-block" />
                  SQLi
                </span>
              </div>
              {hud.telemetry.hottestNode && hud.simStage === 'SIMULATING' && (
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    Điểm nóng: {hud.telemetry.hottestNode.label} ({hud.telemetry.hottestNode.heatPct}%)
                  </span>
                </span>
              )}
            </div>

            {hud.simStage === 'SIMULATING' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
                  <span>
                    Đợt {Math.min(hud.waveIndex + 1, effectiveConfig.waves.length)}/{effectiveConfig.waves.length}:{' '}
                    <strong className="text-white">
                      {effectiveConfig.waves[Math.min(hud.waveIndex, effectiveConfig.waves.length - 1)]?.label}
                    </strong>
                  </span>
                  <span className="tabular-nums text-amber-300">Còn {hud.waveTimeLeft}s</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0B1320] overflow-hidden">
                  <div
                    className="h-full bg-sky-400 transition-all duration-150"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((hud.waveDurationTotal - hud.waveTimeLeft) / Math.max(1, hud.waveDurationTotal)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <TelemetrySparkline
                    values={hud.cpuHistory}
                    maxVal={100}
                    thresholdVal={85}
                    stroke={hud.dbCpu >= 85 ? '#FB7185' : '#FBBF24'}
                    label="BIỂU ĐỒ CPU DATABASE"
                    currentDisplay={`${hud.dbCpu}% (Đỉnh ${hud.peakDbCpu}%)`}
                  />
                  <TelemetrySparkline
                    values={hud.latencyHistory}
                    maxVal={Math.max(120, effectiveConfig.targetSlaMs * 1.8)}
                    thresholdVal={effectiveConfig.targetSlaMs}
                    stroke={hud.avgLatencyMs <= effectiveConfig.targetSlaMs ? '#22D3EE' : '#F59E0B'}
                    label={`BIỂU ĐỒ ĐỘ TRỄ (SLA ≤ ${effectiveConfig.targetSlaMs}ms)`}
                    currentDisplay={`${hud.avgLatencyMs}ms`}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                    <span className="text-slate-400">ĐÃ PHỤC VỤ</span>
                    <strong className="text-white">{hud.deliveredOk}</strong>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                    <span className="text-slate-400">CACHE HIT</span>
                    <strong className="text-cyan-300">
                      {hud.cacheHits} ({hud.telemetry.cacheHitRatePct}%)
                    </strong>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                    <span className="text-slate-400">CHẶN TẤN CÔNG</span>
                    <strong className="text-emerald-300">
                      {hud.blockedAttacks} ({hud.telemetry.threatBlockRatePct}%)
                    </strong>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                    <span className="text-slate-400">LỌT DB</span>
                    <strong className={hud.breachedAttacks > 0 ? 'text-rose-400' : 'text-emerald-300'}>
                      {hud.breachedAttacks}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 10 Architecture Components + Wire / Cut Tools */}
          <div className="flex flex-nowrap overflow-x-auto pb-1.5 sm:grid sm:grid-cols-4 lg:grid-cols-6 sm:overflow-visible sm:pb-0 gap-1.5">
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
                  className={`shrink-0 min-w-[126px] sm:min-w-0 min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
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
              className={`shrink-0 min-w-[120px] sm:min-w-0 min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                tool === 'wire'
                  ? 'bg-cyan-500/20 border-cyan-400 text-white'
                  : 'bg-[#111C33] border-[#1E2E4A] hover:border-cyan-400 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Cable className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>[W] Nối Dây</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Chạm Nguồn → Đích</p>
            </button>

            <button
              type="button"
              data-testid="traffic-cut-tool-btn"
              onClick={() => {
                setTool('cut');
                simRef.current.wireSourceId = null;
              }}
              className={`shrink-0 min-w-[120px] sm:min-w-0 min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                tool === 'cut'
                  ? 'bg-rose-500/20 border-rose-400 text-white'
                  : 'bg-[#111C33] border-[#1E2E4A] hover:border-rose-400 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>[X] Tháo Dây</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">Chạm vào đường nối</p>
            </button>
          </div>

          {/* Selected Node Inspector (Lv1/Lv2 Spec + Live Runtime Stats) */}
          {hud.selectedNode && (
            <div className="rounded-xl border border-[#1E2E4A] bg-[#0F192B] p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 text-xs">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-white">
                    {selectedEntry
                      ? `${selectedEntry.name} (Lv.${hud.selectedNode.level})`
                      : hud.selectedNode.type === 'ingress'
                        ? 'Cổng Người Dùng (Users Ingress)'
                        : 'Cụm Cơ Sở Dữ Liệu (Database Cluster)'}
                  </strong>
                  {selectedEntry && (() => {
                    const spec = getNodeCapabilityDetails(selectedEntry.type);
                    return (
                      <span className="font-mono text-[11px] text-sky-300">
                        {spec.primaryMetricLabel}:{' '}
                        {hud.selectedNode!.level >= 2 ? spec.lv2Value : `${spec.lv1Value} → Lv2: ${spec.lv2Value}`}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-300 tabular-nums">
                  <span>Đã qua: <strong className="text-white">{hud.selectedNode.processedCount}</strong></span>
                  <span>Cache Hit: <strong className="text-cyan-300">{hud.selectedNode.cacheHitCount}</strong></span>
                  <span>Đã chặn: <strong className="text-rose-300">{hud.selectedNode.blockedCount}</strong></span>
                  <span>
                    Nhiệt:{' '}
                    <strong className={hud.selectedNode.heat >= 0.7 ? 'text-rose-400' : 'text-emerald-300'}>
                      {hud.selectedNode.type === 'database' ? `${hud.dbCpu}%` : `${Math.round(hud.selectedNode.heat * 100)}%`}
                    </strong>
                  </span>
                </div>
              </div>

              {selectedEntry && hud.simStage === 'DESIGNING' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="traffic-upgrade-btn"
                    disabled={hud.selectedNode.level >= 2 || hud.budget < selectedEntry.upgradeCost}
                    onClick={upgradeSelectedNode}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-45 text-slate-950 font-semibold text-xs cursor-pointer whitespace-nowrap"
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
                    className="min-h-[42px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-rose-400 text-rose-300 text-xs font-medium cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Tháo (+${getSellRefund(hud.selectedNode, true)})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notice Bar + Action Triggers */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-[#1E2E4A]">
            <p className="text-xs text-slate-300 line-clamp-2 sm:truncate min-w-0">{hud.notice}</p>

            {hud.simStage === 'DESIGNING' ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetDesignToStarter}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm Sạch</span>
                </button>
                <button
                  type="button"
                  data-testid="traffic-ready-sim-btn"
                  onClick={startSimulationRun}
                  className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Sẵn Sàng — Chạy Giả Lập ({effectiveConfig.waves.length} Đợt)</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="px-3 py-2 rounded-xl bg-[#111C33] border border-amber-400/50 text-amber-300 font-mono text-xs font-semibold whitespace-nowrap">
                  Đang test Đợt {Math.min(hud.waveIndex + 1, effectiveConfig.waves.length)}/{effectiveConfig.waves.length} ({hud.waveTimeLeft}s)
                </span>
                <button
                  type="button"
                  data-testid="traffic-stop-edit-btn"
                  onClick={stopAndEditDesign}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-sky-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Dừng &amp; Sửa Thiết Kế
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Live Architecture Diagnosis & Multiple Approaches Guide */}
        <aside className="mobile-ls:max-h-[calc(100dvh-75px)] mobile-ls:overflow-y-auto xl:col-span-4 rounded-xl border border-[#1E2E4A] bg-[#0F192B] p-3.5 mobile-ls:p-2.5 space-y-3 mobile-ls:space-y-2">
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

            {/* Simulation Telemetry Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
              <div className="px-3 py-2 rounded-xl bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                <span className="text-slate-400">Đã phục vụ</span>
                <strong className="text-white">{hud.deliveredOk}</strong>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                <span className="text-slate-400">Cache Hit</span>
                <strong className="text-cyan-300">{hud.cacheHits} ({hud.telemetry.cacheHitRatePct}%)</strong>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                <span className="text-slate-400">Đã chặn</span>
                <strong className="text-emerald-300">{hud.blockedAttacks} ({hud.telemetry.threatBlockRatePct}%)</strong>
              </div>
              <div className="px-3 py-2 rounded-xl bg-[#0B1320] border border-[#1E2E4A] flex items-center justify-between">
                <span className="text-slate-400">Lọt DB</span>
                <strong className={hud.breachedAttacks > 0 ? 'text-rose-400' : 'text-emerald-300'}>{hud.breachedAttacks}</strong>
              </div>
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
                Danh Sách {TRAFFIC_LEVELS.length} Màn
              </button>
              <button
                type="button"
                data-testid="arch-back-to-design-btn"
                onClick={stopAndEditDesign}
                className="px-4 py-2 rounded-xl border border-sky-400/60 bg-sky-500/20 hover:bg-sky-500/30 text-xs sm:text-sm font-bold text-sky-200 cursor-pointer"
              >
                Quay Lại Sửa Thiết Kế
              </button>
              {modeId !== 'chaos_hell' && (
                <button
                  type="button"
                  onClick={() => {
                    const nextOrder: ArchModeId[] = ['standard', 'flash_surge', 'cyber_siege', 'tight_budget', 'chaos_hell'];
                    const curIdx = nextOrder.indexOf(modeId);
                    const nextMode = nextOrder[Math.min(nextOrder.length - 1, curIdx + 1)];
                    startScenario(levelIdx, nextMode);
                  }}
                  className="px-4 py-2 rounded-xl border border-purple-400/60 bg-purple-500/20 hover:bg-purple-500/30 text-xs sm:text-sm font-bold text-purple-200 cursor-pointer"
                >
                  Thử Chế Độ Khó Hơn →
                </button>
              )}
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
