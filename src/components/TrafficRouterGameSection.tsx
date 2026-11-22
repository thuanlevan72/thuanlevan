import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  BookOpen,
  Cable,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  Flame,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Route,
  Scissors,
  Shield,
  Sparkles,
  Terminal,
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
  createInitialNodes,
  cycleEdgeRouteRule,
  detectArchitectureCombos,
  diagnoseArchitectureTelemetry,
  diagnoseWavePerformance,
  distToCubicBezier,
  evaluatePacketAtNode,
  evaluateSolutionOptimization,
  getArchMode,
  getDatabaseSinkNodes,
  getEdgeRouteMeta,
  getEffectiveScenarioConfig,
  getNodeCapabilityDetails,
  getNodeCatalogEntry,
  getPreSimChecklist,
  getQueueDrainIntervalSec,
  getQueueMaxBuffer,
  getWaveIncidentEvent,
  hasPathToDatabase,
  INFRA_NODE_CATALOG,
  isDatabaseSinkType,
  PACKET_META,
  pickWeightedPacketKind,
  RACK_SLOTS,
  selectOutgoingEdgeForPacket,
  SRE_ACTIONS,
  TRAFFIC_LEVELS,
  type ArchitectureApproach,
  type ArchitectureCombo,
  type ArchModeId,
  type CacheTtlMode,
  type DbPoolMode,
  type EdgeRouteRule,
  type InfraEdge,
  type InfraNode,
  type InfraNodeCategory,
  type InfraNodeType,
  type LimiterTuneMode,
  type LiveTelemetryDiagnosis,
  type PacketKind,
  type PlaceableNodeType,
  type QueueCapacityMode,
  type RackSlot,
  type SolutionEvaluation,
  type SreActionId,
  type WaveIncidentEvent,
  type WaveSummarySnapshot,
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

type ToolMode = PlaceableNodeType | 'wire' | 'cut' | 'route';
type GamePhase = 'TITLE' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';
type SimStage = 'DESIGNING' | 'SIMULATING' | 'WAVE_BREAK';
type ChapterFilter = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type DockCategoryFilter = 'all' | InfraNodeCategory;

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

interface SystemLogEntry {
  id: number;
  timeTag: string;
  level: 'info' | 'ok' | 'warn' | 'crit';
  text: string;
}

interface HudSnapshot {
  avgDbCpu: number;
  dbCpu: number;
  peakDbCpu: number;
  activeDbCount: number;
  systemHealth: number;
  avgLatencyMs: number;
  peakLatencyMs: number;
  waveIndex: number;
  waveActive: boolean;
  simStage: SimStage;
  waveTimeLeft: number;
  waveDurationTotal: number;
  deliveredOk: number;
  droppedPackets: number;
  dropRatePct: number;
  cacheHits: number;
  blockedAttacks: number;
  breachedAttacks: number;
  hasValidRoute: boolean;
  selectedNode: InfraNode | null;
  selectedOutgoingEdges: InfraEdge[];
  notice: string;
  topologyRev: number;
  cpuHistory: number[];
  latencyHistory: number[];
  telemetry: LiveTelemetryDiagnosis;
  sreCooldowns: Record<SreActionId, number>;
  sreActiveTimers: Record<SreActionId, number>;
  activeIncident: WaveIncidentEvent | null;
  incidentTimeLeft: number;
  queuedTotal: number;
  activeCombos: ArchitectureCombo[];
  logs: SystemLogEntry[];
  waveSummary: WaveSummarySnapshot | null;
  showWaveSummaryModal: boolean;
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

function formatSimTimeTag(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `[${mm}:${ss}]`;
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
export function TrafficRouterGameSection({
  theme,
  isFullscreen = false,
  onToggleFullscreen,
}: TrafficRouterGameSectionProps) {
  const isDark = theme === 'dark';
  void isDark;
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1') {
      return 'PLAYING';
    }
    return 'TITLE';
  });
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>(0);
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [modeId, setModeId] = useState<ArchModeId>('standard');
  const [dockCategory, setDockCategory] = useState<DockCategoryFilter>('all');
  const [tool, setTool] = useState<ToolMode>('redis');
  const [hoveredCatalogType, setHoveredCatalogType] = useState<PlaceableNodeType | null>(null);
  const [showGhostPath, setShowGhostPath] = useState<boolean>(true);
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
  const logContainerRef = useRef<HTMLDivElement | null>(null);
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
    dbCpu: 10,
    avgDbCpu: 10,
    peakDbCpu: 10,
    systemHealth: 100,
    latencySum: 0,
    latencySamples: 0,
    peakLatencyMs: 24,
    waveIndex: 0,
    waveActive: false,
    simStage: 'DESIGNING' as SimStage,
    waveTimer: 0,
    waveDurationTotal: initialCfg.effectiveLevel.waves[0]?.durationSec ?? 8,
    spawnTimer: 0,
    deliveredOk: 0,
    droppedPackets: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    waveStartDelivered: 0,
    waveStartDropped: 0,
    waveStartBreached: 0,
    wavePeakLatencyMs: 24,
    wavePeakDbCpu: 10,
    selectedNodeId: null as string | null,
    wireSourceId: null as string | null,
    hoverPos: null as { x: number; y: number } | null,
    nextPacketId: 1,
    nextNodeId: 1,
    nextLogId: 1,
    dashOffset: 0,
    timeSec: 0,
    simElapsedSec: 0,
    sampleAccum: 0,
    lastWarnLogSec: -10,
    lastDropLogSec: -10,
    lastDdosLogSec: -10,
    cpuHistory: [10] as number[],
    latencyHistory: [24] as number[],
    topologyRev: 1,
    highlightNodeIds: [] as string[],
    queueBuffers: {} as Record<string, { packets: ActivePacket[]; drainAccum: number }>,
    sreCooldowns: { autoscale: 0, lockdown: 0, cache_warm: 0 } as Record<SreActionId, number>,
    sreActiveTimers: { autoscale: 0, lockdown: 0, cache_warm: 0 } as Record<SreActionId, number>,
    activeIncident: null as WaveIncidentEvent | null,
    incidentTimer: 0,
    incidentTriggeredWave: 0,
    waveSummary: null as WaveSummarySnapshot | null,
    showWaveSummaryModal: false,
    logs: [
      {
        id: 1,
        timeTag: '[00:00]',
        level: 'info' as const,
        text: 'Hệ thống sẵn sàng thiết kế. Chọn service bên dưới hoặc nạp mẫu để giả lập.',
      },
    ] as SystemLogEntry[],
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    outcome: null as 'victory' | 'gameover' | null,
  });

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    avgDbCpu: 10,
    dbCpu: 10,
    peakDbCpu: 10,
    activeDbCount: 1,
    systemHealth: 100,
    avgLatencyMs: 24,
    peakLatencyMs: 24,
    waveIndex: 0,
    waveActive: false,
    simStage: 'DESIGNING',
    waveTimeLeft: 0,
    waveDurationTotal: initialCfg.effectiveLevel.waves[0]?.durationSec ?? 8,
    deliveredOk: 0,
    droppedPackets: 0,
    dropRatePct: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    hasValidRoute: true,
    selectedNode: null,
    selectedOutgoingEdges: [],
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    topologyRev: 1,
    cpuHistory: [10],
    latencyHistory: [24],
    telemetry: initialTelemetry,
    sreCooldowns: { autoscale: 0, lockdown: 0, cache_warm: 0 },
    sreActiveTimers: { autoscale: 0, lockdown: 0, cache_warm: 0 },
    activeIncident: null,
    incidentTimeLeft: 0,
    queuedTotal: 0,
    activeCombos: detectArchitectureCombos(initialNodes, initialEdges),
    logs: [...simRef.current.logs],
    waveSummary: null,
    showWaveSummaryModal: false,
  }));

  const pushSystemLog = useCallback((level: SystemLogEntry['level'], text: string) => {
    const s = simRef.current;
    const entry: SystemLogEntry = {
      id: ++s.nextLogId,
      timeTag: formatSimTimeTag(s.simElapsedSec),
      level,
      text,
    };
    s.logs = [...s.logs.slice(-34), entry];
  }, []);

  const syncHud = useCallback(() => {
    const s = simRef.current;
    const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
    const sel = s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null;
    const selectedOutgoingEdges = sel ? s.edges.filter((e) => e.fromId === sel.id).map((e) => ({ ...e })) : [];
    const queuedTotal = Object.values(s.queueBuffers).reduce((sum, qb) => sum + qb.packets.length, 0);
    const dbNodes = getDatabaseSinkNodes(s.nodes);
    const connectedDbs = dbNodes.filter((db) => s.edges.some((e) => e.toId === db.id));
    const measuredDbs = connectedDbs.length > 0 ? connectedDbs : dbNodes;
    const activeDbCount = Math.max(1, measuredDbs.length);
    const avgDb =
      measuredDbs.reduce((sum, d) => sum + (d.localDbCpu ?? s.dbCpu), 0) / activeDbCount;
    const maxDb = measuredDbs.reduce(
      (mx, d) => Math.max(mx, d.localDbCpu ?? s.dbCpu),
      0
    );
    s.avgDbCpu = avgDb;
    s.dbCpu = maxDb;

    const totalHandled = s.deliveredOk + s.droppedPackets + s.breachedAttacks;
    const dropRatePct =
      totalHandled > 0 ? Number(((s.droppedPackets / totalHandled) * 100).toFixed(1)) : 0;

    const telemetry = diagnoseArchitectureTelemetry(s.nodes, s.edges, {
      deliveredOk: s.deliveredOk,
      cacheHits: s.cacheHits,
      blockedAttacks: s.blockedAttacks,
      breachedAttacks: s.breachedAttacks,
      dbCpu: s.dbCpu,
    });
    const activeCombos = detectArchitectureCombos(s.nodes, s.edges);

    setHud({
      avgDbCpu: Math.round(avgDb),
      dbCpu: Math.round(maxDb),
      peakDbCpu: Math.round(s.peakDbCpu),
      activeDbCount,
      systemHealth: Math.max(0, Math.round(s.systemHealth)),
      avgLatencyMs: avgLat,
      peakLatencyMs: Math.round(s.peakLatencyMs),
      waveIndex: s.waveIndex,
      waveActive: s.waveActive,
      simStage: s.simStage,
      waveTimeLeft: Math.max(0, Math.ceil(s.waveTimer)),
      waveDurationTotal: s.waveDurationTotal,
      deliveredOk: s.deliveredOk,
      droppedPackets: s.droppedPackets,
      dropRatePct,
      cacheHits: s.cacheHits,
      blockedAttacks: s.blockedAttacks,
      breachedAttacks: s.breachedAttacks,
      hasValidRoute: hasPathToDatabase(s.nodes, s.edges),
      selectedNode: sel ? { ...sel } : null,
      selectedOutgoingEdges,
      notice: s.notice,
      topologyRev: s.topologyRev,
      cpuHistory: [...s.cpuHistory],
      latencyHistory: [...s.latencyHistory],
      telemetry,
      sreCooldowns: { ...s.sreCooldowns },
      sreActiveTimers: { ...s.sreActiveTimers },
      activeIncident: s.activeIncident,
      incidentTimeLeft: Math.ceil(s.incidentTimer),
      queuedTotal,
      activeCombos,
      logs: [...s.logs],
      waveSummary: s.waveSummary,
      showWaveSummaryModal: s.showWaveSummaryModal,
    });
  }, []);

  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [hud.logs.length]);

  const liveAnalysis = useMemo(() => {
    const s = simRef.current;
    return analyzeArchitectureDesign(effectiveConfig.effectiveLevel, s.nodes, s.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveConfig, hud.topologyRev]);

  const checklistItems = useMemo(() => {
    const s = simRef.current;
    return getPreSimChecklist(effectiveConfig.effectiveLevel, s.nodes, s.edges);
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
      remainingBudget: 0,
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
        dbCpu: 10,
        avgDbCpu: 10,
        peakDbCpu: 10,
        systemHealth: 100,
        latencySum: 0,
        latencySamples: 0,
        peakLatencyMs: 24,
        waveIndex: 0,
        waveActive: false,
        simStage: 'DESIGNING',
        waveTimer: 0,
        waveDurationTotal: cfg.effectiveLevel.waves[0]?.durationSec ?? 8,
        spawnTimer: 0,
        deliveredOk: 0,
        droppedPackets: 0,
        cacheHits: 0,
        blockedAttacks: 0,
        breachedAttacks: 0,
        waveStartDelivered: 0,
        waveStartDropped: 0,
        waveStartBreached: 0,
        wavePeakLatencyMs: 24,
        wavePeakDbCpu: 10,
        selectedNodeId: null,
        wireSourceId: null,
        hoverPos: null,
        nextPacketId: 1,
        nextNodeId: 1,
        nextLogId: 1,
        dashOffset: 0,
        timeSec: 0,
        simElapsedSec: 0,
        sampleAccum: 0,
        lastWarnLogSec: -10,
        lastDropLogSec: -10,
        lastDdosLogSec: -10,
        cpuHistory: [10],
        latencyHistory: [24],
        topologyRev: 1,
        highlightNodeIds: [],
        queueBuffers: {},
        sreCooldowns: { autoscale: 0, lockdown: 0, cache_warm: 0 },
        sreActiveTimers: { autoscale: 0, lockdown: 0, cache_warm: 0 },
        activeIncident: null,
        incidentTimer: 0,
        incidentTriggeredWave: 0,
        waveSummary: null,
        showWaveSummaryModal: false,
        logs: [
          {
            id: 1,
            timeTag: '[00:00]',
            level: 'info',
            text: `Khởi tạo ${lvl.code} (${cfg.mode.shortName}) — SLA ≤ ${cfg.targetSlaMs}ms · DB Cool ${cfg.dbCoolingPerSec}/s.`,
          },
        ],
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
      s.notice = `Đã chuyển chế độ: ${cfg.mode.name} (${cfg.mode.ruleSummary})`;
      pushSystemLog('info', `Chuyển chế độ ${cfg.mode.shortName}: ${cfg.mode.ruleSummary}`);
      s.topologyRev += 1;
      syncHud();
    },
    [pushSystemLog, syncHud]
  );

  const applyArchitectureBlueprint = useCallback(
    (approach: ArchitectureApproach) => {
      const s = simRef.current;
      if (s.simStage === 'SIMULATING') {
        s.notice = 'Đang chạy giả lập! Dừng hoặc đợi nghỉ giữa đợt để đổi mẫu kiến trúc.';
        syncHud();
        return;
      }
      const bp = buildBlueprintGraph(s.level, approach);
      s.nodes = bp.nodes;
      s.edges = bp.edges;
      s.packets = [];
      s.selectedNodeId = null;
      s.wireSourceId = null;
      s.highlightNodeIds = [];
      s.topologyRev += 1;
      s.notice = `Đã nạp mẫu "${approach.name}" lên sơ đồ! Bạn có thể nối thêm DB Shard, Scale Lv.1–3 hoặc bấm Chạy Giả Lập.`;
      pushSystemLog('ok', `Nạp kiến trúc mẫu: ${approach.name}`);
      playRouterSfx(ensureAudio(), 'build', muted);
      syncHud();
    },
    [ensureAudio, muted, pushSystemLog, syncHud]
  );

  const startSimulationRun = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING' || s.outcome) return;
    if (!hasPathToDatabase(s.nodes, s.edges)) {
      s.notice = 'Chưa có đường dây nối từ Users → Cụm Database! Dùng [W] Nối Dây hoàn tất kiến trúc trước.';
      syncHud();
      return;
    }

    // If resuming from WAVE_BREAK -> launch next wave cleanly preserving nodes/wires/tuning!
    if (s.simStage === 'WAVE_BREAK') {
      const nextWave = s.level.waves[s.waveIndex];
      if (!nextWave) return;
      s.simStage = 'SIMULATING';
      s.waveActive = true;
      s.waveTimer = nextWave.durationSec;
      s.waveDurationTotal = nextWave.durationSec;
      s.spawnTimer = 0.15;
      s.waveStartDelivered = s.deliveredOk;
      s.waveStartDropped = s.droppedPackets;
      s.waveStartBreached = s.breachedAttacks;
      s.wavePeakLatencyMs = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
      s.wavePeakDbCpu = s.dbCpu;
      s.waveSummary = null;
      s.showWaveSummaryModal = false;
      s.wireSourceId = null;
      s.notice = `Đang giả lập Đợt ${nextWave.waveNumber}/${s.level.waves.length}: ${nextWave.label}`;
      pushSystemLog('info', `Tiếp tục Đợt ${nextWave.waveNumber}/${s.level.waves.length}: ${nextWave.label}`);
      setPaused(false);
      playRouterSfx(ensureAudio(), 'wave', muted);
      syncHud();
      return;
    }

    for (const node of s.nodes) {
      node.processedCount = 0;
      node.blockedCount = 0;
      node.cacheHitCount = 0;
      node.droppedCount = 0;
      node.heat = 0;
      node.queueBuffer = 0;
      node.localDbCpu = isDatabaseSinkType(node.type) ? 10 : undefined;
      node.avgNodeLatencyMs = isDatabaseSinkType(node.type) ? 15 : 0;
    }
    const waveDef = s.level.waves[0];
    s.simStage = 'SIMULATING';
    s.waveIndex = 0;
    s.waveActive = true;
    s.waveTimer = waveDef.durationSec;
    s.waveDurationTotal = waveDef.durationSec;
    s.spawnTimer = 0.15;
    s.packets = [];
    s.queueBuffers = {};
    s.sreCooldowns = { autoscale: 0, lockdown: 0, cache_warm: 0 };
    s.sreActiveTimers = { autoscale: 0, lockdown: 0, cache_warm: 0 };
    s.activeIncident = null;
    s.incidentTimer = 0;
    s.incidentTriggeredWave = 0;
    s.waveSummary = null;
    s.showWaveSummaryModal = false;
    s.highlightNodeIds = [];
    s.fxs = [];
    s.shockwaves = [];
    s.sparks = [];
    s.dbCpu = 10;
    s.avgDbCpu = 10;
    s.peakDbCpu = 10;
    s.systemHealth = 100;
    s.latencySum = 0;
    s.latencySamples = 0;
    s.peakLatencyMs = 24;
    s.simElapsedSec = 0;
    s.sampleAccum = 0;
    s.lastWarnLogSec = -10;
    s.lastDropLogSec = -10;
    s.lastDdosLogSec = -10;
    s.cpuHistory = [10];
    s.latencyHistory = [24];
    s.deliveredOk = 0;
    s.droppedPackets = 0;
    s.cacheHits = 0;
    s.blockedAttacks = 0;
    s.breachedAttacks = 0;
    s.waveStartDelivered = 0;
    s.waveStartDropped = 0;
    s.waveStartBreached = 0;
    s.wavePeakLatencyMs = 24;
    s.wavePeakDbCpu = 10;
    s.wireSourceId = null;
    s.outcome = null;
    s.notice = `Đang giả lập Đợt 1/${s.level.waves.length}: ${waveDef.label}`;
    pushSystemLog('info', `Bắt đầu Đợt 1/${s.level.waves.length}: ${waveDef.label} (SLA ≤ ${s.level.targetSlaMs}ms)`);
    setPaused(false);
    playRouterSfx(ensureAudio(), 'wave', muted);
    syncHud();
  }, [ensureAudio, muted, pushSystemLog, syncHud]);

  const resetDesignToStarter = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') return;
    s.nodes = createInitialNodes(s.baseLevel);
    s.edges = [...s.baseLevel.initialEdges];
    s.packets = [];
    s.queueBuffers = {};
    s.fxs = [];
    s.shockwaves = [];
    s.sparks = [];
    s.selectedNodeId = null;
    s.wireSourceId = null;
    s.highlightNodeIds = [];
    s.simStage = 'DESIGNING';
    s.waveIndex = 0;
    s.waveSummary = null;
    s.showWaveSummaryModal = false;
    s.topologyRev += 1;
    s.notice = 'Đã làm sạch sơ đồ về cấu trúc khởi đầu!';
    pushSystemLog('info', 'Reset sơ đồ về cấu trúc khởi đầu (Users → App API → DB Cluster).');
    playRouterSfx(ensureAudio(), 'block', muted);
    syncHud();
  }, [ensureAudio, muted, pushSystemLog, syncHud]);

  const stopAndEditDesign = useCallback(
    (highlightIds?: string[]) => {
      const s = simRef.current;
      for (const node of s.nodes) {
        node.processedCount = 0;
        node.blockedCount = 0;
        node.cacheHitCount = 0;
        node.droppedCount = 0;
        node.heat = 0;
        node.queueBuffer = 0;
        node.localDbCpu = isDatabaseSinkType(node.type) ? 10 : undefined;
        node.avgNodeLatencyMs = isDatabaseSinkType(node.type) ? 15 : 0;
      }
      s.simStage = 'DESIGNING';
      s.waveIndex = 0;
      s.waveActive = false;
      s.waveTimer = 0;
      s.waveDurationTotal = s.level.waves[0]?.durationSec ?? 8;
      s.packets = [];
      s.queueBuffers = {};
      s.sreCooldowns = { autoscale: 0, lockdown: 0, cache_warm: 0 };
      s.sreActiveTimers = { autoscale: 0, lockdown: 0, cache_warm: 0 };
      s.activeIncident = null;
      s.incidentTimer = 0;
      s.incidentTriggeredWave = 0;
      s.waveSummary = null;
      s.showWaveSummaryModal = false;
      s.highlightNodeIds = highlightIds ? [...highlightIds] : [];
      if (highlightIds && highlightIds.length > 0) {
        s.selectedNodeId = highlightIds[0];
      }
      s.fxs = [];
      s.shockwaves = [];
      s.sparks = [];
      s.dbCpu = 10;
      s.avgDbCpu = 10;
      s.peakDbCpu = 10;
      s.systemHealth = 100;
      s.latencySum = 0;
      s.latencySamples = 0;
      s.peakLatencyMs = 24;
      s.simElapsedSec = 0;
      s.sampleAccum = 0;
      s.cpuHistory = [10];
      s.latencyHistory = [24];
      s.deliveredOk = 0;
      s.droppedPackets = 0;
      s.cacheHits = 0;
      s.blockedAttacks = 0;
      s.breachedAttacks = 0;
      s.outcome = null;
      s.notice =
        highlightIds && highlightIds.length > 0
          ? 'Đã đánh dấu điểm nghẽn màu vàng trên sơ đồ — hãy nối thêm dây, tách DB Shard hoặc nâng cấp node!'
          : 'Đã quay lại bước Thiết Kế — hãy tinh chỉnh sơ đồ rồi bấm "Sẵn Sàng — Chạy Giả Lập"!';
      pushSystemLog('info', 'Quay lại chế độ Thiết Kế (Standby).');
      setEndEvaluation(null);
      setPaused(false);
      setPhase('PLAYING');
      syncHud();
    },
    [pushSystemLog, syncHud]
  );

  const triggerSreAction = useCallback(
    (actionId: SreActionId) => {
      const s = simRef.current;
      if (s.simStage !== 'SIMULATING' || paused || s.outcome) return;
      if (s.sreCooldowns[actionId] > 0) return;

      const def = SRE_ACTIONS.find((a) => a.id === actionId);
      if (!def) return;

      s.sreCooldowns[actionId] = def.cooldownSec;
      s.sreActiveTimers[actionId] = def.durationSec;

      if (actionId === 'autoscale') {
        for (const node of s.nodes) {
          if (node.type === 'app' || node.type === 'worker' || node.type === 'microservice_auth') {
            node.heat = Math.max(0, node.heat - 0.45);
            s.shockwaves.push({
              x: node.x,
              y: node.y,
              color: def.color,
              radius: 12,
              maxRadius: 52,
              life: 0.45,
              maxLife: 0.45,
            });
          }
        }
        s.notice = 'SRE Auto-Scale Burst kích hoạt (5s): Hạ nhiệt App/Worker & giảm 35% độ trễ!';
        pushSystemLog('ok', 'SRE Auto-Scale Burst (5s) — giảm nhiệt tầng Compute & -35% độ trễ.');
      } else if (actionId === 'lockdown') {
        for (const node of s.nodes) {
          if (node.type === 'waf' || node.type === 'rate_limiter' || node.type === 'ddos_scrubber' || node.type === 'cdn') {
            s.shockwaves.push({
              x: node.x,
              y: node.y,
              color: def.color,
              radius: 12,
              maxRadius: 52,
              life: 0.45,
              maxLife: 0.45,
            });
          }
        }
        s.notice = 'SRE Edge Lockdown kích hoạt (5s): Tăng +28% chặn DDoS tại tầng biên!';
        pushSystemLog('ok', 'SRE Edge Lockdown (5s) — tăng +28% lực lọc DDoS ở biên.');
      } else if (actionId === 'cache_warm') {
        for (const db of getDatabaseSinkNodes(s.nodes)) {
          db.localDbCpu = Math.max(8, (db.localDbCpu ?? s.dbCpu) - 16);
          s.shockwaves.push({
            x: db.x,
            y: db.y,
            color: def.color,
            radius: 14,
            maxRadius: 62,
            life: 0.5,
            maxLife: 0.5,
          });
          s.fxs.push({
            x: db.x,
            y: db.y - 34,
            text: '-16% DB CPU',
            color: def.color,
            life: 0.9,
            maxLife: 0.9,
          });
        }
        s.notice = 'SRE Cache Warm & DB Cool (5s): Làm ấm Cache (+14% Hit) & xả tải -16% CPU cụm DB!';
        pushSystemLog('ok', 'SRE Cache Warm (5s) — làm ấm Redis/CDN & xả -16% CPU cụm DB.');
      }

      playRouterSfx(ensureAudio(), 'wave', muted);
      syncHud();
    },
    [ensureAudio, muted, paused, pushSystemLog, syncHud]
  );

  const cycleEdgeRuleById = useCallback(
    (edgeId: string, explicitRule?: EdgeRouteRule) => {
      const s = simRef.current;
      if (s.simStage === 'SIMULATING') return;
      const edge = s.edges.find((e) => e.id === edgeId);
      if (!edge) return;
      edge.routeRule = explicitRule ?? cycleEdgeRouteRule(edge.routeRule);
      const meta = getEdgeRouteMeta(edge.routeRule);
      s.topologyRev += 1;
      s.notice = `Đã đặt luật tuyến dây: ${meta.label}.`;
      pushSystemLog('info', `Đặt luật dây nối → ${meta.label}`);
      playRouterSfx(ensureAudio(), 'wire', muted);
      syncHud();
    },
    [ensureAudio, muted, pushSystemLog, syncHud]
  );

  // Sync document.body.dataset.state for accessibility & inspection
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (phase === 'TITLE') document.body.dataset.state = 'title';
    else if (phase === 'VICTORY' || phase === 'GAME_OVER') document.body.dataset.state = 'gameover';
    else if (paused) document.body.dataset.state = 'paused';
    else document.body.dataset.state = 'playing';

    return () => {
      delete document.body.dataset.state;
    };
  }, [paused, phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (phase === 'TITLE') {
        if ((e.key === 'Enter' || e.key === ' ') && !(e.target instanceof HTMLButtonElement)) {
          e.preventDefault();
          startScenario(levelIdx);
        }
        return;
      }
      if (phase !== 'PLAYING') return;
      const keyUpper = e.key.toUpperCase();
      if (e.key === 'w' || e.key === 'W') {
        setTool('wire');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'x' || e.key === 'X') {
        setTool('cut');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'r' || e.key === 'R') {
        setTool('route');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'a' || e.key === 'A') {
        triggerSreAction('autoscale');
      } else if (e.key === 's' || e.key === 'S') {
        triggerSreAction('lockdown');
      } else if (e.key === 'd' || e.key === 'D') {
        triggerSreAction('cache_warm');
      } else if (e.key === 'p' || e.key === 'P') {
        setPaused((v) => !v);
      } else if (e.key === ' ') {
        e.preventDefault();
        startSimulationRun();
      } else {
        const matchTool = INFRA_NODE_CATALOG.find(
          (item) => item.hotkey.toUpperCase() === keyUpper
        );
        if (matchTool) {
          setTool(matchTool.type);
          simRef.current.wireSourceId = null;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [levelIdx, phase, startScenario, startSimulationRun, triggerSreAction]);

  // Scale-up Selected Node Lv.1 -> Lv.2 -> Lv.3 (zero budget lockout)
  const upgradeSelectedNode = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') {
      s.notice = 'Khóa chỉnh sửa khi đang chạy đợt! Đợi nghỉ giữa đợt hoặc bấm Dừng & Sửa.';
      syncHud();
      return;
    }
    if (!s.selectedNodeId) return;
    const node = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (!node || node.type === 'ingress' || node.level >= 3) {
      return;
    }
    node.level = (node.level + 1) as 1 | 2 | 3;
    const label = getNodeVisualMeta(node.type).label;
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
      y: node.y - 34,
      text: `${label} v.${node.level}!`,
      color: '#34D399',
      life: 0.9,
      maxLife: 0.9,
    });
    s.notice = `Đã scale ${label} lên v.${node.level} (giảm trễ & tăng công suất xử lý)!`;
    pushSystemLog('ok', `Scale ${label} lên phiên bản v.${node.level}`);
    playRouterSfx(ensureAudio(), 'wire', muted);
    syncHud();
  }, [ensureAudio, muted, pushSystemLog, syncHud]);

  const updateSelectedNodeTune = useCallback(
    (patch: {
      limiterMode?: LimiterTuneMode;
      cacheTtl?: CacheTtlMode;
      queueCapacityMode?: QueueCapacityMode;
      dbPoolMode?: DbPoolMode;
    }) => {
      const s = simRef.current;
      if (s.simStage === 'SIMULATING' || !s.selectedNodeId) return;
      const node = s.nodes.find((n) => n.id === s.selectedNodeId);
      if (!node) return;
      Object.assign(node, patch);
      s.topologyRev += 1;
      const label = getNodeVisualMeta(node.type).label;
      const paramText =
        patch.limiterMode ?? patch.cacheTtl ?? patch.queueCapacityMode ?? patch.dbPoolMode ?? '';
      s.notice = `Đã tinh chỉnh cấu hình ${label} → ${paramText}.`;
      pushSystemLog('info', `Tinh chỉnh ${label}: ${paramText}`);
      playRouterSfx(ensureAudio(), 'wire', muted);
      syncHud();
    },
    [ensureAudio, muted, pushSystemLog, syncHud]
  );

  const sellSelectedNode = useCallback(() => {
    const s = simRef.current;
    if (s.simStage === 'SIMULATING') {
      s.notice = 'Khóa chỉnh sửa khi đang chạy đợt! Đợi nghỉ giữa đợt hoặc bấm Dừng & Sửa.';
      syncHud();
      return;
    }
    if (!s.selectedNodeId) return;
    const node = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (!node || node.fixed) return;
    const label = getNodeVisualMeta(node.type).label;
    delete s.queueBuffers[node.id];
    s.nodes = s.nodes.filter((n) => n.id !== node.id);
    s.edges = s.edges.filter((e) => e.fromId !== node.id && e.toId !== node.id);
    s.packets = s.packets.filter((p) => p.fromId !== node.id && p.toId !== node.id);
    s.selectedNodeId = null;
    s.topologyRev += 1;
    s.notice = `Đã tháo ${label} khỏi sơ đồ.`;
    pushSystemLog('info', `Tháo node ${label} khỏi topology.`);
    playRouterSfx(ensureAudio(), 'block', muted);
    syncHud();
  }, [ensureAudio, muted, pushSystemLog, syncHud]);

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
    const nodeHitRadius = isTouch ? 52 : 44;
    const edgeHitRadius = isTouch ? 26 : 16;
    const slotHitRadius = isTouch ? 50 : 42;
    const clickedNode = s.nodes.find((n) => Math.hypot(pt.x - n.x, pt.y - n.y) <= nodeHitRadius);

    if (s.simStage === 'SIMULATING') {
      if (clickedNode) {
        s.selectedNodeId = clickedNode.id;
        s.notice = `Đang theo dõi telemetry của ${getNodeVisualMeta(clickedNode.type).label}.`;
      } else {
        s.notice = 'Đang chạy giả lập! Chỉnh sửa mở lại ở kỳ nghỉ giữa đợt hoặc khi bấm Dừng & Sửa.';
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
        if (isDatabaseSinkType(clickedNode.type)) {
          s.notice = 'Database là đích lưu trữ cuối, hãy chọn node nguồn trước.';
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
      const srcNode = s.nodes.find((n) => n.id === s.wireSourceId);
      const srcLabel = srcNode ? getNodeVisualMeta(srcNode.type).label : s.wireSourceId;
      const dstLabel = getNodeVisualMeta(clickedNode.type).label;
      s.wireSourceId = null;
      s.selectedNodeId = clickedNode.id;
      s.topologyRev += 1;
      s.notice = `Đã nối dây: ${srcLabel} → ${dstLabel}!`;
      pushSystemLog('ok', `Nối dây mới: ${srcLabel} → ${dstLabel}`);
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
        pushSystemLog('info', 'Tháo bỏ 1 đường nối dây mạng.');
        playRouterSfx(ensureAudio(), 'block', muted);
        syncHud();
      }
      return;
    }

    if (tool === 'route') {
      let hitEdge: InfraEdge | null = null;
      let bestDist = edgeHitRadius + 4;
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
        cycleEdgeRuleById(hitEdge.id);
      } else {
        s.notice = 'Chạm trực tiếp vào đường dây nối giữa 2 node để đổi luật lọc GET / POST / MEDIA.';
        syncHud();
      }
      return;
    }

    if (clickedNode) {
      s.selectedNodeId = clickedNode.id;
      s.highlightNodeIds = s.highlightNodeIds.filter((id) => id !== clickedNode.id);
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
    const isRecommendedSlot = entry.recommendedCols.includes(clickedSlot.col);
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
      droppedCount: 0,
      heat: 0,
      localDbCpu: entry.isDbSink ? 10 : undefined,
      avgNodeLatencyMs: entry.isDbSink ? 15 : 0,
    };
    s.nodes.push(newNode);
    s.selectedNodeId = newNode.id;

    // Smart Auto-Splice if an existing edge runs right across this slot (non-sink nodes only)
    let spliced = false;
    if (!entry.isDbSink) {
      for (let i = 0; i < s.edges.length; i++) {
        const ed = s.edges[i];
        const a = s.nodes.find((n) => n.id === ed.fromId);
        const b = s.nodes.find((n) => n.id === ed.toId);
        if (!a || !b) continue;
        if (
          newNode.x > Math.min(a.x, b.x) + 20 &&
          newNode.x < Math.max(a.x, b.x) - 20 &&
          distToCubicBezier(newNode.x, newNode.y, a.x, a.y, b.x, b.y) <= 28
        ) {
          s.edges.splice(
            i,
            1,
            { id: `e-${Date.now()}-a`, fromId: ed.fromId, toId: newNode.id, routeRule: ed.routeRule },
            { id: `e-${Date.now()}-b`, fromId: newNode.id, toId: ed.toId, routeRule: ed.routeRule }
          );
          spliced = true;
          break;
        }
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

    if (!isRecommendedSlot) {
      s.notice = `Đã đặt ${entry.name} ngoài tầng khuyến nghị (+4ms độ trễ giao tiếp). Dùng [W] để nối dây!`;
      pushSystemLog('warn', `Đặt ${entry.shortName} ngoài tầng chuẩn (+4ms hop overhead).`);
    } else if (entry.isDbSink) {
      s.notice = `Đã thêm ${entry.name} vào cụm Database! Dùng [W] Nối Dây từ LB/App/Worker sang DB này để chia tải.`;
      pushSystemLog('ok', `Mở rộng cụm DB: thêm ${entry.name} tại cột Database.`);
    } else {
      s.notice = spliced
        ? `Đã gắn ${entry.name} trực tiếp vào đường dây! Có thể dùng [W] để nối thêm nhánh.`
        : `Đã đặt ${entry.name}! Dùng [W] Nối Dây để kết nối vào mạng.`;
      pushSystemLog('ok', `Đặt ${entry.shortName} (${spliced ? 'nối tự động' : 'chờ nối dây'}).`);
    }

    playRouterSfx(ensureAudio(), 'build', muted);
    syncHud();
  };

  // Main Simulation & Render Loop
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    let rafId = 0;
    let lastTs = performance.now();
    let lastRenderTs = 0;
    let lastFrozenKey = '';
    let hudAccum = 0;
    let cachedTopoRev = -1;
    let cachedCombos = detectArchitectureCombos(simRef.current.nodes, simRef.current.edges);
    let cachedUnusedSet = new Set<string>();

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
      if (s.topologyRev !== cachedTopoRev) {
        cachedTopoRev = s.topologyRev;
        cachedCombos = detectArchitectureCombos(s.nodes, s.edges);
        const liveDiag = diagnoseArchitectureTelemetry(s.nodes, s.edges, {
          deliveredOk: s.deliveredOk,
          cacheHits: s.cacheHits,
          blockedAttacks: s.blockedAttacks,
          breachedAttacks: s.breachedAttacks,
          dbCpu: s.dbCpu,
        });
        cachedUnusedSet = new Set(liveDiag.unusedNodeIds);
      }

      s.timeSec += rawDt;
      const isRunningSim = s.simStage === 'SIMULATING' && !paused && !s.outcome;
      const dt = isRunningSim ? rawDt * speedMult : 0;

      if (s.simStage === 'DESIGNING' && !paused) {
        s.dashOffset = (s.dashOffset - rawDt * 12) % 24;
      }

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

      if (dt > 0) {
        s.simElapsedSec += dt;
        s.dashOffset = (s.dashOffset - dt * 28) % 24;

        for (const k of ['autoscale', 'lockdown', 'cache_warm'] as const) {
          if (s.sreCooldowns[k] > 0) s.sreCooldowns[k] = Math.max(0, s.sreCooldowns[k] - dt);
          if (s.sreActiveTimers[k] > 0) s.sreActiveTimers[k] = Math.max(0, s.sreActiveTimers[k] - dt);
        }

        const autoscaleActive = s.sreActiveTimers.autoscale > 0;
        const lockdownActive = s.sreActiveTimers.lockdown > 0;
        const cacheWarmActive = s.sreActiveTimers.cache_warm > 0;
        const combos = cachedCombos;
        const comboCdnS3 = combos.some((c) => c.id === 'cdn_s3' && c.active);
        const comboCacheCompute = combos.some((c) => c.id === 'cache_compute' && c.active);
        const comboKafkaWorker = combos.some((c) => c.id === 'kafka_worker' && c.active);
        const comboMultiDb = combos.some((c) => c.id === 'multi_db_cluster' && c.active);

        for (const node of s.nodes) {
          const coolRate =
            autoscaleActive && (node.type === 'app' || node.type === 'worker' || node.type === 'microservice_auth')
              ? 1.15
              : 0.45;
          node.heat = Math.max(0, node.heat - dt * coolRate);
        }

        const incidentPenalty =
          s.incidentTimer > 0 && s.activeIncident && !cacheWarmActive
            ? s.activeIncident.extraCpuDrainPenalty
            : 0;

        // Per-Database cooling across ALL DB Sinks
        const dbSinks = getDatabaseSinkNodes(s.nodes);
        const multiDbCoolBonus = comboMultiDb ? 1.18 : 1;
        for (const db of dbSinks) {
          const poolMult = db.dbPoolMode === 'high_pool' ? 1.2 : 1;
          const lvCoolMult = 1 + (db.level - 1) * 0.14;
          const effectiveCooling = Math.max(
            2,
            (s.level.dbCoolingPerSec * multiDbCoolBonus * poolMult * lvCoolMult) +
              (cacheWarmActive ? 3.5 : 0) -
              incidentPenalty
          );
          db.localDbCpu = Math.max(6, (db.localDbCpu ?? 10) - effectiveCooling * dt);
        }

        const connectedDbs = dbSinks.filter((d) => s.edges.some((e) => e.toId === d.id));
        const measuredDbs = connectedDbs.length > 0 ? connectedDbs : dbSinks;
        const peakNow = measuredDbs.reduce((m, d) => Math.max(m, d.localDbCpu ?? 10), 10);
        const avgNow =
          measuredDbs.reduce((sum, d) => sum + (d.localDbCpu ?? 10), 0) /
          Math.max(1, measuredDbs.length);
        s.dbCpu = peakNow;
        s.avgDbCpu = avgNow;
        s.peakDbCpu = Math.max(s.peakDbCpu, peakNow);
        s.wavePeakDbCpu = Math.max(s.wavePeakDbCpu, peakNow);

        // Drain Queue & Stream Processor buffers cleanly
        for (const node of s.nodes) {
          if (node.type !== 'queue' && node.type !== 'stream_processor') continue;
          const qBuf = s.queueBuffers[node.id];
          if (!qBuf || qBuf.packets.length === 0) {
            node.queueBuffer = 0;
            continue;
          }
          qBuf.drainAccum += dt;
          const baseDrain = getQueueDrainIntervalSec(node.level);
          const drainInt = comboKafkaWorker ? baseDrain * 0.8 : baseDrain;
          while (qBuf.drainAccum >= drainInt && qBuf.packets.length > 0) {
            qBuf.drainAccum -= drainInt;
            const released = qBuf.packets.shift()!;
            const { edge, nextCursor } = selectOutgoingEdgeForPacket(node, s.edges, released.kind);
            node.rrCursor = nextCursor;
            if (edge) {
              s.packets.push({
                ...released,
                edgeId: edge.id,
                fromId: edge.fromId,
                toId: edge.toId,
                t: 0,
              });
            }
          }
          node.queueBuffer = qBuf.packets.length;
        }

        // Rolling sparkline sampling every 0.4s
        s.sampleAccum += dt;
        if (s.sampleAccum >= 0.4) {
          s.sampleAccum = 0;
          const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
          s.cpuHistory = [...s.cpuHistory.slice(-35), Math.round(s.dbCpu)];
          s.latencyHistory = [...s.latencyHistory.slice(-35), avgLat];

          if (s.dbCpu >= 84 && s.simElapsedSec - s.lastWarnLogSec >= 4.5) {
            s.lastWarnLogSec = s.simElapsedSec;
            pushSystemLog(
              'warn',
              `Cảnh báo: Cụm DB đạt CPU ${Math.round(s.dbCpu)}% · trễ TB ${avgLat}ms (mục tiêu ≤ ${s.level.targetSlaMs}ms)`
            );
          }
        }

        if (s.incidentTimer > 0) {
          s.incidentTimer = Math.max(0, s.incidentTimer - dt);
          if (s.incidentTimer === 0) {
            s.activeIncident = null;
          }
        }

        if (s.waveActive) {
          const waveDef = s.level.waves[s.waveIndex];
          s.waveTimer = Math.max(0, s.waveTimer - dt);
          s.spawnTimer -= dt;

          // Trigger Wave Production Incident mid-wave (Wave 2+)
          if (
            s.waveIndex > s.incidentTriggeredWave &&
            s.waveTimer <= s.waveDurationTotal * 0.6 &&
            s.waveTimer > 2
          ) {
            s.incidentTriggeredWave = s.waveIndex;
            const inc = getWaveIncidentEvent(s.level, s.waveIndex, s.modeId);
            if (inc) {
              s.activeIncident = inc;
              s.incidentTimer = 4.5;
              s.notice = `SỰ CỐ: ${inc.title} — ${inc.detail}`;
              pushSystemLog('crit', `SỰ CỐ ĐỢT ${waveDef.waveNumber}: ${inc.title}`);
              playRouterSfx(ensureAudio(), 'breach', muted);
            }
          }

          if (s.waveTimer > 0 && s.spawnTimer <= 0) {
            const incMult = s.incidentTimer > 0 && s.activeIncident ? s.activeIncident.spawnRateMult : 1;
            const lockMult = lockdownActive ? 0.78 : 1;
            s.spawnTimer =
              (waveDef.spawnIntervalSec / incMult / lockMult) * (0.82 + Math.random() * 0.36);
            const ingress = s.nodes.find((n) => n.id === 'ingress');
            if (ingress) {
              const kind = pickWeightedPacketKind(waveDef.weights, Math.random());
              const { edge, nextCursor } = selectOutgoingEdgeForPacket(ingress, s.edges, kind);
              ingress.rrCursor = nextCursor;
              if (edge) {
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

          const totalBuffered = Object.values(s.queueBuffers).reduce((sum, qb) => sum + qb.packets.length, 0);
          if (s.waveTimer <= 0 && s.packets.length === 0 && totalBuffered === 0) {
            const finishedWave = s.level.waves[s.waveIndex];
            const nextIdx = s.waveIndex + 1;
            if (nextIdx >= s.level.waves.length) {
              s.waveIndex = nextIdx;
              s.waveActive = false;
              s.activeIncident = null;
              s.incidentTimer = 0;
              s.outcome = 'victory';
              pushSystemLog('ok', `Hoàn tất toàn bộ ${s.level.waves.length} đợt! Chấm điểm kiến trúc.`);
              playRouterSfx(ensureAudio(), 'win', muted);
              const evalResult = computeCurrentEvaluation();
              setEndEvaluation(evalResult);
              setSavedGrades((prev) => saveGrade(s.level.id, s.modeId, evalResult.grade, prev));
              setPhase('VICTORY');
              syncHud();
            } else {
              // Pause cleanly between waves (WAVE_BREAK) with Wave Summary Card & editing!
              const summary = diagnoseWavePerformance({
                waveNumber: finishedWave.waveNumber,
                waveLabel: finishedWave.label,
                deliveredOk: s.deliveredOk - s.waveStartDelivered,
                droppedPackets: s.droppedPackets - s.waveStartDropped,
                breachedAttacks: s.breachedAttacks - s.waveStartBreached,
                uptimePct: s.systemHealth,
                peakLatencyMs: s.wavePeakLatencyMs,
                targetSlaMs: s.level.targetSlaMs,
                peakDbCpu: s.wavePeakDbCpu,
                nodes: s.nodes,
                edges: s.edges,
              });
              s.waveIndex = nextIdx;
              s.waveActive = false;
              s.simStage = 'WAVE_BREAK';
              s.activeIncident = null;
              s.incidentTimer = 0;
              s.waveSummary = summary;
              s.showWaveSummaryModal = true;
              s.notice = `Xong Đợt ${finishedWave.waveNumber}! Đang mở kỳ nghỉ tinh chỉnh — có thể nâng cấp hoặc thêm DB Shard trước Đợt ${nextIdx + 1}.`;
              pushSystemLog('ok', `Hoàn tất Đợt ${finishedWave.waveNumber}: Phục vụ ${summary.successRatePct}% · Đỉnh DB ${summary.peakDbCpu}%`);
              playRouterSfx(ensureAudio(), 'wave', muted);
              syncHud();
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

          target.heat = Math.min(1, target.heat + (p.kind === 'ddos' ? 0.16 : 0.11));
          const outgoing = s.edges.filter((e) => e.fromId === target.id);
          let effectiveRoll = Math.random();
          if (lockdownActive && p.kind === 'ddos' && (target.type === 'waf' || target.type === 'rate_limiter' || target.type === 'ddos_scrubber' || target.type === 'cdn')) {
            effectiveRoll = Math.max(0, effectiveRoll - 0.28);
          } else if (cacheWarmActive && (p.kind === 'read' || p.kind === 'media') && (target.type === 'redis' || target.type === 'varnish' || target.type === 'cdn' || target.type === 'read_replica')) {
            effectiveRoll = Math.max(0, effectiveRoll - 0.14);
          } else if (comboCdnS3 && p.kind === 'media' && (target.type === 'cdn' || target.type === 'object_storage')) {
            effectiveRoll = Math.max(0, effectiveRoll - 0.06);
          }

          const decision = evaluatePacketAtNode(
            target,
            p.kind,
            effectiveRoll,
            outgoing.length,
            p.writeDamping,
            s.heatPenaltyMult
          );
          let effectiveAddedLat =
            autoscaleActive && (target.type === 'app' || target.type === 'worker' || target.type === 'microservice_auth')
              ? Math.round(decision.addedLatencyMs * 0.65)
              : decision.addedLatencyMs;
          if (comboCacheCompute && (target.type === 'app' || target.type === 'microservice_auth' || target.type === 'search_engine')) {
            effectiveAddedLat = Math.max(2, effectiveAddedLat - 4);
          }

          target.avgNodeLatencyMs = target.avgNodeLatencyMs
            ? Math.round(target.avgNodeLatencyMs * 0.8 + effectiveAddedLat * 0.2)
            : effectiveAddedLat;

          const totalLatency = p.latencyMs + effectiveAddedLat;
          const nextDamping = decision.writeDampingFactor
            ? p.writeDamping * decision.writeDampingFactor
            : p.writeDamping;

          if (decision.outcome === 'blocked') {
            target.blockedCount += 1;
            s.blockedAttacks += 1;
            if (p.kind === 'ddos' && s.simElapsedSec - s.lastDdosLogSec >= 5.5) {
              s.lastDdosLogSec = s.simElapsedSec;
              pushSystemLog(
                'ok',
                `Spike DDoS phát hiện tại Edge — ${getNodeVisualMeta(target.type).label} đang chặn burst bất thường`
              );
            }
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
              y: target.y - 34,
              text: p.kind === 'sqli' ? 'CHẶN SQLi' : 'CHẶN DDoS',
              color: '#FB7185',
              life: 0.65,
              maxLife: 0.65,
            });
            playRouterSfx(ensureAudio(), 'block', muted);
          } else if (decision.outcome === 'dropped_overload' || decision.outcome === 'dropped_no_route') {
            target.droppedCount = (target.droppedCount ?? 0) + 1;
            s.droppedPackets += 1;
            if (s.simElapsedSec - s.lastDropLogSec >= 4.5) {
              s.lastDropLogSec = s.simElapsedSec;
              pushSystemLog(
                'crit',
                `QUÁ TẢI: ${getNodeVisualMeta(target.type).label} v.${target.level} đang drop request!`
              );
            }
            spawnBurstSparks(target.x, target.y, '#EF4444', 4);
            s.fxs.push({
              x: target.x,
              y: target.y - 34,
              text: 'DROP!',
              color: '#EF4444',
              life: 0.65,
              maxLife: 0.65,
            });
          } else if (decision.outcome === 'cache_hit') {
            target.cacheHitCount += 1;
            s.cacheHits += 1;
            s.deliveredOk += 1;
            s.latencySum += totalLatency;
            s.latencySamples += 1;
            s.peakLatencyMs = Math.max(s.peakLatencyMs, totalLatency);
            s.wavePeakLatencyMs = Math.max(s.wavePeakLatencyMs, totalLatency);
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
              y: target.y - 34,
              text: `HIT ${totalLatency}ms`,
              color: '#22D3EE',
              life: 0.65,
              maxLife: 0.65,
            });
            playRouterSfx(ensureAudio(), 'cache', muted);
          } else if (decision.outcome === 'delivered') {
            target.processedCount += 1;
            const curLocal = target.localDbCpu ?? 10;
            const nextLocal = Math.min(100, curLocal + decision.dbCpuDelta * s.cpuLoadMult);
            target.localDbCpu = nextLocal;
            s.peakDbCpu = Math.max(s.peakDbCpu, nextLocal);
            s.wavePeakDbCpu = Math.max(s.wavePeakDbCpu, nextLocal);
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
                y: target.y - 36,
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
              s.peakLatencyMs = Math.max(s.peakLatencyMs, totalLatency);
              s.wavePeakLatencyMs = Math.max(s.wavePeakLatencyMs, totalLatency);
            }
          } else if (decision.outcome === 'forward') {
            target.processedCount += 1;
            if ((target.type === 'queue' || target.type === 'stream_processor') && p.kind === 'write' && outgoing.length > 0) {
              if (!s.queueBuffers[target.id]) {
                s.queueBuffers[target.id] = { packets: [], drainAccum: 0 };
              }
              const qBuf = s.queueBuffers[target.id];
              const qMax = getQueueMaxBuffer(target.level, target.queueCapacityMode);
              if (qBuf.packets.length < qMax) {
                qBuf.packets.push({
                  id: p.id,
                  kind: p.kind,
                  edgeId: p.edgeId,
                  fromId: target.id,
                  toId: target.id,
                  t: 0,
                  speed: p.speed,
                  latencyMs: totalLatency,
                  writeDamping: nextDamping,
                });
                target.queueBuffer = qBuf.packets.length;
                continue;
              }
            }

            const { edge, nextCursor } = selectOutgoingEdgeForPacket(target, s.edges, p.kind);
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

        // System health only degrades critically when DB Cluster avg/peak saturates >= 95%
        const activeDbCount = Math.max(1, getDatabaseSinkNodes(s.nodes).length);
        const healthDrainFactor = activeDbCount >= 2 ? 0.55 : 1;
        if (s.dbCpu >= 96) {
          s.systemHealth = Math.max(0, s.systemHealth - dt * 8.5 * healthDrainFactor);
        } else if (s.dbCpu < 82 && s.systemHealth < 100 && s.waveActive) {
          s.systemHealth = Math.min(100, s.systemHealth + dt * 2.5);
        }

        if (s.systemHealth <= 0) {
          s.outcome = 'gameover';
          s.activeIncident = null;
          s.incidentTimer = 0;
          pushSystemLog('crit', '502 BAD GATEWAY — Cụm Database sập vì quá tải kéo dài!');
          playRouterSfx(ensureAudio(), 'down', muted);
          setEndEvaluation(computeCurrentEvaluation());
          setPhase('GAME_OVER');
        }

        s.fxs = s.fxs
          .map((fx) => ({ ...fx, y: fx.y - dt * 18, life: fx.life - dt }))
          .filter((fx) => fx.life > 0);
      }

      // 3. HiDPI Canvas Render via trafficRouterCanvasFx (~30fps active, ~12fps designing, 0fps when frozen/modal)
      const isActiveSimFrame = !paused && s.simStage === 'SIMULATING';
      const isStaticCanvas = paused || s.simStage === 'WAVE_BREAK';
      const frozenKey = isStaticCanvas
        ? `${s.topologyRev}|${s.selectedNodeId ?? ''}|${s.wireSourceId ?? ''}|${tool}|${s.hoverPos ? `${Math.round(s.hoverPos.x)},${Math.round(s.hoverPos.y)}` : ''}|${paused ? 1 : 0}|${s.simStage}`
        : '';
      const minFrameMs = isActiveSimFrame ? 32 : s.hoverPos !== null ? 45 : 85;
      const shouldDraw = isStaticCanvas
        ? lastRenderTs === 0 || frozenKey !== lastFrozenKey
        : now - lastRenderTs >= minFrameMs;
      if (shouldDraw) {
        lastRenderTs = now;
        lastFrozenKey = frozenKey;
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

          renderArchitectureCanvas(ctx, {
            nodes: s.nodes,
            edges: s.edges,
            packets: s.packets,
            fxs: s.fxs,
            shockwaves: s.shockwaves,
            sparks: s.sparks,
            simStage: s.simStage === 'WAVE_BREAK' ? 'DESIGNING' : s.simStage,
            tool,
            selectedNodeId: s.selectedNodeId,
            wireSourceId: s.wireSourceId,
            hoverPos: s.hoverPos,
            dashOffset: s.dashOffset,
            dbCpu: s.dbCpu,
            unusedNodeIds: cachedUnusedSet,
            highlightNodeIds: new Set(s.highlightNodeIds),
            activeSreEffects: s.sreActiveTimers,
            activeIncident: s.activeIncident,
            showGhostPath,
            elapsedSimSec: Math.max(1, s.simElapsedSec),
            timeSec: s.timeSec,
          });
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
  }, [computeCurrentEvaluation, ensureAudio, muted, paused, phase, pushSystemLog, showGhostPath, speedMult, syncHud, tool]);

  // -------------------------------------------------------------------------
  // Title Screen: 24 Scenarios across 6 Chapters + 5 Modes
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

  const filteredCatalog = useMemo(
    () =>
      dockCategory === 'all'
        ? INFRA_NODE_CATALOG
        : INFRA_NODE_CATALOG.filter((item) => item.category === dockCategory),
    [dockCategory]
  );

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
                Pure System Architecture Designer · 20 Service Nodes · Đa Database Sharding · 0 Giới Hạn Tiền
              </p>
              <h1 className="text-2xl sm:text-3xl mobile-ls:text-lg font-bold tracking-tight [text-wrap:balance]">
                Thiết Kế Kiến Trúc Hệ Thống
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mobile-ls:line-clamp-2">
                Tự do thiết kế kiến trúc từ <strong>20 dịch vụ hạ tầng</strong> &amp; <strong>Đa Database</strong> qua{' '}
                <strong>{TRAFFIC_LEVELS.length} tình huống thực tế</strong> — giải quyết bài toán Độ trễ (SLA), Thông lượng, Sharding, Cache &amp; An ninh mà không bị rào cản tiền tệ.
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
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>
                  Triển Khai {currentLevel.code} · {activeMode.shortName} (Màn {levelIdx + 1}/{TRAFFIC_LEVELS.length})
                </span>
              </button>
              <span className="text-xs text-slate-400">
                Thiết kế tự do 20 node + Đa DB · Giả lập &amp; tinh chỉnh giữa mỗi đợt
              </span>
            </div>
          </div>

          {/* Right 5 cols: Game Mode Selector + Scenario Context & Approaches */}
          <div className="mobile-ls:col-span-5 lg:col-span-5 space-y-3 mobile-ls:max-h-[calc(100dvh-76px)] mobile-ls:overflow-y-auto mobile-ls:pr-1">
            <div className="rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-4 sm:p-5 mobile-ls:p-2.5 space-y-3.5 mobile-ls:space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Chọn Chế Độ Cho {currentLevel.code} ({ARCH_MODES.length} chế độ):</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    SLA ≤ {effectiveConfig.targetSlaMs}ms · {effectiveConfig.waves.length} Đợt
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
                <span>DB Cool {effectiveConfig.dbCoolingPerSec}/s · Đa DB Shard</span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{currentLevel.title}</h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {currentLevel.contextDescription}
                </p>
              </div>

              {/* Traffic Profile Mix */}
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
                  <span>Các hướng thiết kế tham khảo ({currentLevel.approaches.length} mẫu):</span>
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
  const selectedNode = hud.selectedNode;
  const selectedEntry =
    selectedNode &&
    selectedNode.type !== 'ingress' &&
    selectedNode.type !== 'database'
      ? getNodeCatalogEntry(selectedNode.type)
      : null;

  const focusedCatalogEntry =
    hoveredCatalogType !== null
      ? getNodeCatalogEntry(hoveredCatalogType)
      : tool !== 'wire' && tool !== 'cut' && tool !== 'route'
        ? getNodeCatalogEntry(tool)
        : null;

  const activeMode = getArchMode(modeId);
  const showReportModal = (phase === 'VICTORY' || phase === 'GAME_OVER') && endEvaluation !== null;
  const activeCombosEarned = hud.activeCombos.filter((c) => c.active).length;
  const canEditTopology = hud.simStage !== 'SIMULATING';

  return (
    <section
      id="traffic-router-section"
      aria-label={`Thiết Kế Kiến Trúc — ${currentLevel.title} (${activeMode.name})`}
      className="relative rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-3.5 sm:p-5 mobile-ls:p-2 shadow-sm"
    >
      {/* Top SRE Telemetry Dashboard */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between mobile-ls:flex-row mobile-ls:items-center mobile-ls:justify-between gap-2.5 mobile-ls:gap-1.5 pb-3 mobile-ls:pb-1.5 border-b border-[#1E2E4A]">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs tabular-nums min-w-0">
          <button
            type="button"
            onClick={() => {
              setEndEvaluation(null);
              setPhase('TITLE');
            }}
            className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            Menu ({levelIdx + 1}/{TRAFFIC_LEVELS.length})
          </button>

          <span
            className={`px-2 py-1 rounded-md font-mono text-[11px] font-semibold border whitespace-nowrap ${
              hud.simStage === 'DESIGNING'
                ? 'bg-sky-500/15 text-sky-300 border-sky-400/40'
                : hud.simStage === 'WAVE_BREAK'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/50'
            }`}
          >
            {hud.simStage === 'DESIGNING'
              ? 'BƯỚC 1: THIẾT KẾ'
              : hud.simStage === 'WAVE_BREAK'
                ? 'NGHỈ GIỮA ĐỢT · TINH CHỈNH'
                : 'BƯỚC 2: GIẢ LẬP TẢI'}
          </span>

          <span
            className="px-2 py-1 rounded-md font-mono text-[11px] font-bold border whitespace-nowrap bg-[#132138]"
            style={{ color: activeMode.color, borderColor: `${activeMode.color}66` }}
          >
            {activeMode.shortName}
          </span>

          {/* DB Cluster CPU + Count + Mini Progress Bar */}
          <div className="flex flex-col gap-0.5 min-w-[128px]">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Database className={`w-3.5 h-3.5 ${hud.dbCpu >= 85 ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="text-slate-400 text-[10px] font-mono">CỤM DB ({hud.activeDbCount})</span>
              <strong
                className={`font-mono ${
                  hud.dbCpu >= 85 ? 'text-rose-400' : hud.dbCpu >= 60 ? 'text-amber-300' : 'text-emerald-400'
                }`}
              >
                {hud.avgDbCpu}%
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">Đỉnh {hud.peakDbCpu}%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-[#132138] overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hud.dbCpu >= 85 ? 'bg-rose-500' : hud.dbCpu >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, hud.dbCpu)}%` }}
              />
            </div>
          </div>

          {/* Uptime SLA + Mini Progress Bar */}
          <div className="flex flex-col gap-0.5 min-w-[116px]">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Shield className={`w-3.5 h-3.5 ${hud.systemHealth < 60 ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span className="text-slate-400 text-[10px] font-mono">UPTIME</span>
              <strong className="font-mono text-emerald-300">{hud.systemHealth}%</strong>
              <span className="text-[10px] text-slate-400 font-mono">(≥99.9%)</span>
            </div>
            <div className="w-full h-1 rounded-full bg-[#132138] overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hud.systemHealth < 60 ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, hud.systemHealth)}%` }}
              />
            </div>
          </div>

          {/* Latency vs SLA + Mini Progress Bar */}
          <div className="flex flex-col gap-0.5 min-w-[116px]">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 text-[10px] font-mono">TRỄ</span>
              <strong
                className={`font-mono ${
                  hud.avgLatencyMs <= effectiveConfig.targetSlaMs ? 'text-cyan-300' : 'text-amber-300'
                }`}
              >
                {hud.avgLatencyMs}ms
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">/{effectiveConfig.targetSlaMs}ms SLA</span>
            </div>
            <div className="w-full h-1 rounded-full bg-[#132138] overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hud.avgLatencyMs <= effectiveConfig.targetSlaMs ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
                style={{
                  width: `${Math.min(100, Math.round((hud.avgLatencyMs / Math.max(1, effectiveConfig.targetSlaMs * 1.4)) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Combo & Drop & Wave */}
          <div className="flex items-center gap-3 whitespace-nowrap font-mono">
            <div>
              <span className="text-slate-400 text-[10px] mr-1">COMBO</span>
              <strong className={activeCombosEarned > 0 ? 'text-emerald-300' : 'text-slate-300'}>
                {activeCombosEarned}/4
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] mr-1">DROP</span>
              <strong className={hud.dropRatePct > 0 ? 'text-rose-400' : 'text-emerald-300'}>
                {hud.dropRatePct}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] mr-1">ĐỢT</span>
              <strong className="text-white">
                {hud.simStage === 'DESIGNING'
                  ? `0/${effectiveConfig.waves.length}`
                  : `${Math.min(hud.waveIndex + (hud.simStage === 'WAVE_BREAK' ? 0 : 1), effectiveConfig.waves.length)}/${effectiveConfig.waves.length}`}
              </strong>
            </div>
          </div>
        </div>

        {/* Spaced Top-Right Operations Control Cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSpeedMult((s) => (s === 1 ? 2 : s === 2 ? 3 : 1))}
            className="min-h-[40px] min-w-[44px] px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 font-mono text-xs font-semibold cursor-pointer whitespace-nowrap"
            title="Chuyển tốc độ chạy giả lập (1× / 2× / 3×)"
            aria-label={`Tốc độ chạy giả lập ${speedMult}x`}
          >
            {speedMult}×
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            title={muted ? 'Bật âm thanh cảnh báo & thao tác' : 'Tắt âm thanh'}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="min-w-[40px] min-h-[40px] p-2 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            disabled={hud.simStage !== 'SIMULATING'}
            title={paused ? 'Tiếp tục giả lập [P]' : 'Tạm dừng giả lập [P]'}
            aria-label={paused ? 'Tiếp tục giả lập' : 'Tạm dừng giả lập'}
            className="min-w-[40px] min-h-[40px] p-2 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 disabled:opacity-40 flex items-center justify-center cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => startScenario(levelIdx)}
            title="Chạy lại màn chơi từ đầu"
            aria-label="Chạy lại từ đầu"
            className="min-w-[40px] min-h-[40px] p-2 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Thu gọn màn hình' : 'Mở toàn màn hình'}
              title={isFullscreen ? 'Thu gọn (Esc)' : 'Mở toàn màn hình'}
              className="min-w-[40px] min-h-[40px] p-2 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 flex items-center justify-center cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-sky-400" />
              ) : (
                <Maximize2 className="w-4 h-4 text-sky-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Bar */}
      <div className="mt-2.5 flex flex-nowrap overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 items-center gap-1.5 text-xs">
        <span className="text-[11px] font-mono text-slate-400 mr-1 shrink-0">CHẾ ĐỘ:</span>
        {ARCH_MODES.map((m) => {
          const active = m.id === modeId;
          return (
            <button
              key={m.id}
              type="button"
              disabled={!canEditTopology}
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
          {currentLevel.code} · {activeMode.ruleSummary}
        </span>
      </div>

      {/* Main Split Workspace: Canvas + Right Inspector */}
      <div className="mt-3 mobile-ls:mt-1.5 grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_270px] xl:grid-cols-12 gap-4 mobile-ls:gap-2.5 items-start">
        {/* Left/Center 8 Cols: Canvas + Telemetry + 20-Service Dock */}
        <div className="mobile-ls:min-w-0 xl:col-span-8 space-y-2.5 mobile-ls:space-y-2">
          <div className="relative flex justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerMove={handleCanvasPointerMove}
              onPointerLeave={() => {
                simRef.current.hoverPos = null;
              }}
              onPointerDown={handleCanvasPointerDown}
              data-testid="architecture-canvas"
              className="w-full mobile-ls:max-w-[min(100%,calc((100dvh-145px)*1.84))] mobile-ls:mx-auto block aspect-[920/500] h-auto rounded-xl border border-[#1E2E4A] cursor-crosshair touch-none"
              aria-label="Sơ đồ thiết kế kiến trúc hệ thống"
            />
          </div>

          {/* Packet Legend + Telemetry Sparklines + Live Event Console */}
          <div className="rounded-xl border border-[#1E2E4A] bg-[#0F192B] p-2.5 space-y-2">
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
              <div className="flex items-center gap-2">
                {hud.telemetry.hottestNode && hud.simStage === 'SIMULATING' && (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      Nóng nhất: {hud.telemetry.hottestNode.label} ({hud.telemetry.hottestNode.heatPct}%)
                    </span>
                  </span>
                )}
                {hud.simStage === 'DESIGNING' && (
                  <button
                    type="button"
                    onClick={() => setShowGhostPath((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] cursor-pointer ${
                      showGhostPath
                        ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                        : 'bg-[#0B1320] border-[#1E2E4A] text-slate-400'
                    }`}
                    title="Bật/tắt đường nối gợi ý mờ trên sơ đồ"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Luồng gợi ý</span>
                  </button>
                )}
              </div>
            </div>

            {hud.simStage === 'SIMULATING' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
                  <span>
                    Đợt {Math.min(hud.waveIndex + 1, effectiveConfig.waves.length)}/{effectiveConfig.waves.length}:{' '}
                    <strong className="text-white">
                      {effectiveConfig.waves[Math.min(hud.waveIndex, effectiveConfig.waves.length - 1)]?.label}
                    </strong>
                    {hud.queuedTotal > 0 && (
                      <span className="ml-2 text-amber-300">· Hàng đợi Async: {hud.queuedTotal}</span>
                    )}
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

                {/* SRE War-Room Operations */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SRE_ACTIONS.map((act) => {
                    const cd = hud.sreCooldowns[act.id] ?? 0;
                    const activeLeft = hud.sreActiveTimers[act.id] ?? 0;
                    const isActive = activeLeft > 0;
                    const isReady = cd <= 0;
                    const isRecommended = hud.activeIncident?.recommendedAction === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        data-testid={`sre-action-${act.id}`}
                        disabled={!isReady || paused}
                        onClick={() => triggerSreAction(act.id)}
                        title={act.description}
                        className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
                          isActive
                            ? 'bg-emerald-500/20 border-emerald-400 text-white'
                            : isRecommended && isReady
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : isReady
                                ? 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-400 text-slate-100'
                                : 'bg-[#0B1320] border-[#1E2E4A] text-slate-500 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                          <span style={{ color: isActive ? '#34D399' : act.color }}>
                            [{act.hotkey}] {act.shortName}
                          </span>
                          <span className="font-mono tabular-nums text-[10px]">
                            {isActive
                              ? `HIỆU LỰC ${Math.ceil(activeLeft)}s`
                              : isReady
                                ? isRecommended
                                  ? 'KHUYÊN DÙNG'
                                  : 'SẴN SÀNG'
                                : `CD ${Math.ceil(cd)}s`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">{act.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <TelemetrySparkline
                    values={hud.cpuHistory}
                    maxVal={100}
                    thresholdVal={85}
                    stroke={hud.dbCpu >= 85 ? '#FB7185' : '#FBBF24'}
                    label={`CPU CỤM DB (${hud.activeDbCount} DB)`}
                    currentDisplay={`TB ${hud.avgDbCpu}% · Đỉnh ${hud.peakDbCpu}%`}
                  />
                  <TelemetrySparkline
                    values={hud.latencyHistory}
                    maxVal={Math.max(120, effectiveConfig.targetSlaMs * 1.8)}
                    thresholdVal={effectiveConfig.targetSlaMs}
                    stroke={hud.avgLatencyMs <= effectiveConfig.targetSlaMs ? '#22D3EE' : '#F59E0B'}
                    label={`ĐỘ TRỄ P95 (SLA ≤ ${effectiveConfig.targetSlaMs}ms)`}
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
                    <span className="text-slate-400">DROP / LỌT DB</span>
                    <strong className={hud.droppedPackets + hud.breachedAttacks > 0 ? 'text-rose-400' : 'text-emerald-300'}>
                      {hud.droppedPackets} / {hud.breachedAttacks}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Live SRE Event Console (3-4 latest auto-scrolling lines) */}
            <div className="rounded-lg bg-[#080E1A] border border-[#1E2E4A] px-2.5 py-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span className="inline-flex items-center gap-1 text-sky-400 font-semibold">
                  <Terminal className="w-3 h-3" />
                  <span>LIVE EVENT / SYSTEM LOG</span>
                </span>
                <span>{hud.logs.length} sự kiện</span>
              </div>
              <div
                ref={logContainerRef}
                data-testid="sre-event-log"
                className="max-h-[68px] overflow-y-auto space-y-0.5 font-mono text-[11px] leading-snug pr-1"
              >
                {hud.logs.slice(-12).map((entry) => (
                  <div
                    key={entry.id}
                    className={
                      entry.level === 'crit'
                        ? 'text-rose-300'
                        : entry.level === 'warn'
                          ? 'text-amber-300'
                          : entry.level === 'ok'
                            ? 'text-emerald-300'
                            : 'text-slate-300'
                    }
                  >
                    <span className="text-slate-500 mr-1.5">{entry.timeTag}</span>
                    <span>{entry.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rich Spec Tooltip Panel Right Above Dock (shows hovered/selected service details) */}
          {focusedCatalogEntry && (() => {
            const spec = getNodeCapabilityDetails(focusedCatalogEntry.type);
            return (
              <div
                data-testid="dock-hover-tooltip"
                className="rounded-xl border border-[#1E2E4A] bg-[#0F192B] px-3 py-2 text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[#132138] border border-[#1E2E4A]"
                      style={{ color: focusedCatalogEntry.color }}
                    >
                      [{focusedCatalogEntry.hotkey}] {focusedCatalogEntry.layerHint}
                    </span>
                    <strong className="text-white">{focusedCatalogEntry.name}</strong>
                    {focusedCatalogEntry.isDbSink && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[10px]">
                        Multi-DB Sink
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                    {(['read', 'write', 'media', 'ddos', 'sqli'] as const).map((pk) => {
                      const eff = focusedCatalogEntry.strengthsByPacket[pk];
                      return (
                        <span
                          key={pk}
                          className={`px-1.5 py-0.5 rounded border ${
                            eff === 'strong'
                              ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                              : eff === 'weak'
                                ? 'bg-slate-900 border-[#1E2E4A] text-slate-500'
                                : 'bg-[#132138] border-[#1E2E4A] text-slate-300'
                          }`}
                        >
                          {PACKET_META[pk].short}
                          {eff === 'strong' ? '++' : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                  <div className="text-slate-200">
                    <span className="text-cyan-300 font-mono">Lv.1→3:</span> {spec.lv1Value} → {spec.lv3Value} ({spec.latencyLv1Ms}ms→{spec.latencyLv3Ms}ms)
                  </div>
                  <div className="text-emerald-300">+ {focusedCatalogEntry.pros}</div>
                  <div className="text-amber-200">Combo: {focusedCatalogEntry.comboHint}</div>
                </div>
              </div>
            );
          })()}

          {/* Infrastructure Service Palette (20 Services, Zero Truncation) + Separated Wire Manipulation Tools */}
          <div className="rounded-xl border border-[#1E2E4A] bg-[#0F192B] p-2.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {(
                  [
                    { id: 'all' as const, label: 'Tất cả (20)' },
                    { id: 'edge' as const, label: 'Edge & Bảo vệ (4)' },
                    { id: 'routing_cache' as const, label: 'Gateway & Cache (4)' },
                    { id: 'compute_async' as const, label: 'Compute & Async (7)' },
                    { id: 'data_db' as const, label: 'Storage & Đa DB (5)' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDockCategory(cat.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      dockCategory === cat.id
                        ? 'bg-sky-500 text-slate-950'
                        : 'bg-[#111C33] text-slate-300 border border-[#1E2E4A] hover:border-sky-400'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Rê/chạm để xem chi tiết · Đặt tự do không giới hạn tiền
              </span>
            </div>

            {/* 20 Infrastructure Nodes Grid (crisp untruncated 1-line summary) */}
            <div className="flex flex-nowrap overflow-x-auto pb-1 sm:grid sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 sm:overflow-visible sm:pb-0 gap-1.5">
              {filteredCatalog.map((item) => {
                const active = tool === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    data-testid={`dock-node-${item.type}`}
                    onMouseEnter={() => setHoveredCatalogType(item.type)}
                    onMouseLeave={() => setHoveredCatalogType((prev) => (prev === item.type ? null : prev))}
                    onFocus={() => setHoveredCatalogType(item.type)}
                    onBlur={() => setHoveredCatalogType((prev) => (prev === item.type ? null : prev))}
                    onClick={() => {
                      setTool(item.type);
                      simRef.current.wireSourceId = null;
                    }}
                    title={`${item.name} — ${item.pros}`}
                    className={`shrink-0 min-w-[152px] sm:min-w-0 min-h-[46px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-sky-500/20 border-sky-400 text-white'
                        : 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-500/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                      <span className="whitespace-nowrap" style={{ color: active ? '#FFFFFF' : item.color }}>
                        [{item.hotkey}] {item.shortName}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {item.isDbSink ? 'DB' : `T.${item.recommendedCols[0] + 1}`}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-tight whitespace-normal">
                      {item.roleSummary}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Visually Separated Network Wiring Tools */}
            <div className="pt-2 border-t border-dashed border-[#273B5E] flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 shrink-0">
                CÔNG CỤ MẠNG &amp; DÂY:
              </span>
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                <button
                  type="button"
                  data-testid="traffic-wire-tool-btn"
                  onClick={() => {
                    setTool('wire');
                    simRef.current.wireSourceId = null;
                  }}
                  className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    tool === 'wire'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white'
                      : 'bg-[#0B1320] border-[#263C61] hover:border-cyan-400 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <Cable className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>[W] Nối Dây</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Chạm Nguồn → Đích</p>
                </button>

                <button
                  type="button"
                  data-testid="traffic-route-tool-btn"
                  onClick={() => {
                    setTool('route');
                    simRef.current.wireSourceId = null;
                  }}
                  className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    tool === 'route'
                      ? 'bg-amber-500/20 border-amber-400 text-white'
                      : 'bg-[#0B1320] border-[#263C61] hover:border-amber-400 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <Route className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>[R] Luật Dây</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Lọc GET / POST / MEDIA</p>
                </button>

                <button
                  type="button"
                  data-testid="traffic-cut-tool-btn"
                  onClick={() => {
                    setTool('cut');
                    simRef.current.wireSourceId = null;
                  }}
                  className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    tool === 'cut'
                      ? 'bg-rose-500/20 border-rose-400 text-white'
                      : 'bg-[#0B1320] border-[#263C61] hover:border-rose-400 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>[X] Tháo Dây</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Chạm vào đường nối</p>
                </button>
              </div>
            </div>
          </div>

          {/* Selected Node Inspector (Lv.1 -> Lv.2 -> Lv.3 + Quick-Tune + Route Rules) */}
          {selectedNode && (
            <div className="rounded-xl border border-amber-400/45 bg-[#0F192B] p-3 space-y-2.5 text-xs">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-white">
                      {selectedEntry
                        ? `${selectedEntry.name} (v.${selectedNode.level})`
                        : selectedNode.type === 'ingress'
                          ? 'Cổng Người Dùng (Users Ingress)'
                          : `Cụm Cơ Sở Dữ Liệu Chính (v.${selectedNode.level})`}
                    </strong>
                    {selectedEntry && (() => {
                      const spec = getNodeCapabilityDetails(selectedEntry.type);
                      const lvText =
                        selectedNode.level === 3
                          ? spec.lv3Value
                          : selectedNode.level === 2
                            ? spec.lv2Value
                            : spec.lv1Value;
                      return (
                        <span className="font-mono text-[11px] text-cyan-300">
                          {lvText} · {spec.bestAgainst}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400 tabular-nums">
                    <span>Đã xử lý: {selectedNode.processedCount}</span>
                    <span>Cache Hit: {selectedNode.cacheHitCount}</span>
                    <span>Đã chặn: {selectedNode.blockedCount}</span>
                    <span>Drop: {selectedNode.droppedCount ?? 0}</span>
                    {isDatabaseSinkType(selectedNode.type) && (
                      <span className="text-amber-300">
                        CPU: {Math.round(selectedNode.localDbCpu ?? hud.dbCpu)}%
                      </span>
                    )}
                    {selectedEntry && selectedNode.level < 3 && (
                      <span className="text-emerald-300">
                        Scale v.{selectedNode.level + 1} mở rộng công suất &amp; giảm trễ
                      </span>
                    )}
                  </div>
                </div>

                {selectedNode.type !== 'ingress' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-testid="node-upgrade-btn"
                      onClick={upgradeSelectedNode}
                      disabled={selectedNode.level >= 3 || !canEditTopology}
                      className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 disabled:opacity-45 border border-emerald-400/50 text-emerald-200 font-semibold text-xs cursor-pointer whitespace-nowrap"
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>
                        {selectedNode.level >= 3
                          ? 'Max v.3 ★'
                          : `Scale lên v.${selectedNode.level + 1}`}
                      </span>
                    </button>
                    {!selectedNode.fixed && (
                      <button
                        type="button"
                        onClick={sellSelectedNode}
                        disabled={!canEditTopology}
                        className="min-h-[42px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-rose-400 disabled:opacity-45 text-rose-300 text-xs font-medium cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Tháo node</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Parameter Tuning Controls */}
              {canEditTopology && selectedNode.type !== 'ingress' && (
                <div className="pt-2 border-t border-[#1E2E4A] flex flex-wrap items-center gap-2 text-[11px]">
                  {(selectedNode.type === 'rate_limiter' ||
                    selectedNode.type === 'ddos_scrubber' ||
                    selectedNode.type === 'waf') && (
                    <>
                      <span className="font-mono text-slate-400">CHẾ ĐỘ LỌC:</span>
                      {(
                        [
                          { id: 'lenient' as const, label: 'Thoáng (-2ms, ít false-positive)' },
                          { id: 'standard' as const, label: 'Chuẩn' },
                          { id: 'strict' as const, label: 'Siết chặt (+chặn DDoS)' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSelectedNodeTune({ limiterMode: opt.id })}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                            (selectedNode.limiterMode ?? 'standard') === opt.id
                              ? 'bg-sky-500/20 border-sky-400 text-white'
                              : 'bg-[#111C33] border-[#1E2E4A] text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </>
                  )}

                  {(selectedNode.type === 'redis' ||
                    selectedNode.type === 'varnish' ||
                    selectedNode.type === 'cdn') && (
                    <>
                      <span className="font-mono text-slate-400">CHIẾN LƯỢC TTL:</span>
                      {(
                        [
                          { id: 'short' as const, label: 'TTL Ngắn (ít stale)' },
                          { id: 'long' as const, label: 'TTL Dài (+6% Hit rate)' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSelectedNodeTune({ cacheTtl: opt.id })}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                            (selectedNode.cacheTtl ?? 'short') === opt.id
                              ? 'bg-cyan-500/20 border-cyan-400 text-white'
                              : 'bg-[#111C33] border-[#1E2E4A] text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </>
                  )}

                  {(selectedNode.type === 'queue' || selectedNode.type === 'stream_processor') && (
                    <>
                      <span className="font-mono text-slate-400">HÀNG ĐỢI:</span>
                      {(
                        [
                          { id: 'small' as const, label: 'Nhỏ (trễ thấp)' },
                          { id: 'large' as const, label: 'Lớn (+60% buffer chịu spike)' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSelectedNodeTune({ queueCapacityMode: opt.id })}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                            (selectedNode.queueCapacityMode ?? 'small') === opt.id
                              ? 'bg-orange-500/20 border-orange-400 text-white'
                              : 'bg-[#111C33] border-[#1E2E4A] text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </>
                  )}

                  {(isDatabaseSinkType(selectedNode.type) || selectedNode.type === 'read_replica') && (
                    <>
                      <span className="font-mono text-slate-400">CONNECTION POOL:</span>
                      {(
                        [
                          { id: 'balanced' as const, label: 'Chuẩn (120 conn)' },
                          { id: 'high_pool' as const, label: 'Pool Lớn (240 conn · +tản nhiệt)' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateSelectedNodeTune({ dbPoolMode: opt.id })}
                          className={`min-h-[34px] px-2.5 py-1 rounded-lg border font-medium cursor-pointer ${
                            (selectedNode.dbPoolMode ?? 'balanced') === opt.id
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-[#111C33] border-[#1E2E4A] text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Outgoing Smart Routing Rules */}
              {canEditTopology && hud.selectedOutgoingEdges.length > 0 && (
                <div className="pt-2 border-t border-[#1E2E4A] flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 mr-1">
                    PHÂN LUỒNG DÂY RA ({hud.selectedOutgoingEdges.length}):
                  </span>
                  {hud.selectedOutgoingEdges.map((ed) => {
                    const dst = simRef.current.nodes.find((n) => n.id === ed.toId);
                    const dstLabel = dst ? getNodeVisualMeta(dst.type).label : ed.toId;
                    const ruleMeta = getEdgeRouteMeta(ed.routeRule);
                    return (
                      <button
                        key={ed.id}
                        type="button"
                        data-testid={`edge-rule-btn-${ed.id}`}
                        onClick={() => cycleEdgeRuleById(ed.id)}
                        title="Nhấn để chuyển luật tuyến: ALL → GET → POST → MEDIA"
                        className="min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-amber-400 text-[11px] font-mono cursor-pointer whitespace-nowrap"
                      >
                        <span className="text-slate-300">→ {dstLabel}:</span>
                        <strong style={{ color: ruleMeta.color }}>{ruleMeta.shortLabel}</strong>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Notice Bar + Action Triggers */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-[#1E2E4A]">
            <p className="text-xs text-slate-300 leading-snug min-w-0 flex-1">{hud.notice}</p>

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
            ) : hud.simStage === 'WAVE_BREAK' ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {hud.waveSummary && (
                  <button
                    type="button"
                    onClick={() => {
                      simRef.current.showWaveSummaryModal = true;
                      syncHud();
                    }}
                    className="min-h-[44px] px-3 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-sky-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Xem Tổng Kết Đợt {hud.waveSummary.waveNumber}
                  </button>
                )}
                <button
                  type="button"
                  data-testid="wave-continue-btn"
                  onClick={startSimulationRun}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-4 h-4" />
                  <span>Tiếp tục Đợt {hud.waveIndex + 1}/{effectiveConfig.waves.length} →</span>
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
                  onClick={() => stopAndEditDesign()}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-sky-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Dừng &amp; Sửa Thiết Kế
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Cols: Live Architecture Diagnosis, Checklist, Combos & Approaches */}
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
              <span>Sơ Bộ ({liveAnalysis.diagnostics.length === 0 ? 'Đạt' : `${liveAnalysis.diagnostics.length} rủi ro`})</span>
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
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A] space-y-1">
                <span className="text-[11px] font-mono text-sky-400">ĐỀ BÀI &amp; HOÀN CẢNH</span>
                <p className="font-semibold text-white">{currentLevel.domain}</p>
                <p className="text-slate-300 leading-relaxed">{currentLevel.contextDescription}</p>
              </div>

              {/* Pre-sim status + Live Checklist */}
              <div className="p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-emerald-400">KIẾN TRÚC ĐANG LẮP</span>
                  <span className="font-mono text-[10px] text-sky-300">
                    {hud.simStage === 'DESIGNING'
                      ? 'Sẵn sàng giả lập — Chưa có điểm'
                      : hud.simStage === 'WAVE_BREAK'
                        ? `Nghỉ sau Đợt ${hud.waveSummary?.waveNumber ?? hud.waveIndex}`
                        : 'Đang kiểm chứng...'}
                  </span>
                </div>
                <p className="text-sm font-bold text-white">{liveAnalysis.detectedPatternLabel}</p>

                <div className="space-y-1 pt-1 border-t border-[#1E2E4A]">
                  {checklistItems.map((chk, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-1.5 text-[11px] ${
                        chk.ok ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      <span className="font-mono shrink-0">{chk.ok ? '✓' : '⚠'}</span>
                      <span>{chk.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture Combos */}
              <div className="p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-cyan-300 font-bold">COMBO KIẾN TRÚC ({activeCombosEarned}/4)</span>
                  <span className="text-slate-400">Cộng hưởng</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {hud.activeCombos.map((cb) => (
                    <div
                      key={cb.id}
                      className={`px-2 py-1 rounded-lg border text-[10px] flex items-center justify-between gap-1 ${
                        cb.active
                          ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-200'
                          : 'bg-[#0B1320] border-[#1E2E4A] text-slate-400'
                      }`}
                    >
                      <span className="font-semibold">{cb.active ? '★ ' : ''}{cb.name}</span>
                      <span className="font-mono">{cb.bonusText}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-semibold text-slate-200">
                  {liveAnalysis.diagnostics.length === 0
                    ? 'Review kiến trúc sơ bộ: Đã ổn định!'
                    : `Rủi ro sơ bộ phát hiện (${liveAnalysis.diagnostics.length}):`}
                </p>
                {liveAnalysis.diagnostics.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 leading-relaxed">
                    Cấu trúc đã thông tuyến &amp; cân bằng các tầng. Bấm <strong>Sẵn Sàng — Chạy Giả Lập</strong> để kiểm thử tải thực tế!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {liveAnalysis.diagnostics.map((diag, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-100 leading-relaxed"
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
                Nạp miễn phí một trong các mô hình tham khảo lên sơ đồ để quan sát cách chia tải, sau đó tùy biến thêm Đa DB hoặc nâng cấp:
              </p>
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {currentLevel.approaches.map((ap) => {
                  const isMatched = liveAnalysis.matchedApproaches.some((m) => m.id === ap.id);
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
                        disabled={!canEditTopology}
                        onClick={() => applyArchitectureBlueprint(ap)}
                        className="min-h-[38px] w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/35 disabled:opacity-45 border border-sky-400/50 text-sky-200 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        {!canEditTopology
                          ? 'Đang giả lập (dừng để đổi mẫu)'
                          : 'Nạp mẫu này lên sơ đồ'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Inter-Wave Summary Card / Modal (between Đợt 1..N-1) */}
      {hud.simStage === 'WAVE_BREAK' && hud.showWaveSummaryModal && hud.waveSummary && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="wave-summary-modal"
          aria-label={`Tổng kết Đợt ${hud.waveSummary.waveNumber}`}
          className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-5 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#1E2E4A]">
              <div>
                <p className="text-[11px] font-mono text-emerald-400">
                  HOÀN TẤT ĐỢT {hud.waveSummary.waveNumber}/{effectiveConfig.waves.length} · KỲ NGHỈ TINH CHỈNH
                </p>
                <h3 className="text-lg font-bold text-white">{hud.waveSummary.waveLabel}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#132138] border border-[#1E2E4A] font-mono text-xs text-sky-300">
                Đợt tiếp: {hud.waveIndex + 1}/{effectiveConfig.waves.length}
              </span>
            </div>

            {/* 4 Core Wave Telemetry Numbers */}
            <div className="grid grid-cols-2 gap-2.5 text-xs tabular-nums">
              <div className="p-3 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                <span className="text-[10px] font-mono text-slate-400 block">1. PHỤC VỤ THÀNH CÔNG</span>
                <strong className="text-base font-mono text-emerald-300">
                  {hud.waveSummary.successRatePct}%
                </strong>
                <span className="block text-[11px] text-slate-300 mt-0.5">
                  Lỗi/Drop: {hud.waveSummary.droppedCount} gói
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                <span className="text-[10px] font-mono text-slate-400 block">2. UPTIME &amp; TRỄ ĐỈNH</span>
                <strong className="text-base font-mono text-cyan-300">
                  {hud.waveSummary.uptimePct}% · {hud.waveSummary.peakLatencyMs}ms
                </strong>
                <span className="block text-[11px] text-slate-300 mt-0.5">
                  Mục tiêu SLA ≤ {hud.waveSummary.targetSlaMs}ms
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                <span className="text-[10px] font-mono text-slate-400 block">3. QUY MÔ HẠ TẦNG</span>
                <strong className="text-base font-mono text-white">
                  {hud.waveSummary.activeNodeCount} Node · {hud.waveSummary.activeDbCount} DB
                </strong>
                <span className="block text-[11px] text-amber-300 mt-0.5">
                  Đỉnh CPU DB: {hud.waveSummary.peakDbCpu}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                <span className="text-[10px] font-mono text-slate-400 block">4. COMBO HIỆN TẠI</span>
                <strong className="text-base font-mono text-emerald-300">
                  {activeCombosEarned}/4 Combo
                </strong>
                <span className="block text-[11px] text-slate-300 mt-0.5">
                  Đợt tiếp sẽ tải nặng hơn
                </span>
              </div>
            </div>

            {/* 1-Line Root Cause Diagnosis */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/35 text-xs text-amber-100 leading-relaxed">
              <strong className="text-amber-300">Chẩn đoán 1 dòng:</strong> {hud.waveSummary.diagnosisLine}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  simRef.current.showWaveSummaryModal = false;
                  syncHud();
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-sky-400/60 bg-sky-500/20 hover:bg-sky-500/30 text-xs font-bold text-sky-200 cursor-pointer"
              >
                Chỉnh Sửa Sơ Đồ (Thêm DB / Scale v.1→3)
              </button>
              <button
                type="button"
                data-testid="modal-wave-continue-btn"
                onClick={startSimulationRun}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Tiếp tục Đợt {hud.waveIndex + 1}/{effectiveConfig.waves.length} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Simulation Optimization Report / Victory / 502 Bad Gateway Modal */}
      {showReportModal && endEvaluation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={endEvaluation.verdictTitle}
          className="fixed inset-0 z-40 bg-slate-950/80 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
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
                      ? '502 BAD GATEWAY · CỤM DATABASE QUÁ TẢI 100% CPU'
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
                { label: 'Độ Tinh Gọn', val: endEvaluation.pillars.costEfficiency, color: 'bg-amber-400' },
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
                <span className="text-slate-400">Drop / Lọt DB</span>
                <strong className={hud.droppedPackets + hud.breachedAttacks > 0 ? 'text-rose-400' : 'text-emerald-300'}>
                  {hud.droppedPackets} / {hud.breachedAttacks}
                </strong>
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
                      {crit.highlightNodeIds && crit.highlightNodeIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => stopAndEditDesign(crit.highlightNodeIds)}
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/20 hover:bg-amber-400/35 border border-amber-400/50 text-amber-200 font-semibold text-[11px] cursor-pointer"
                        >
                          Chỉ điểm nghẽn trên sơ đồ →
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 leading-relaxed">
                    Không phát hiện điểm nghẽn nào! Kiến trúc của bạn đạt điểm S tối ưu cho bối cảnh {currentLevel.domain}.
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs text-slate-200 leading-relaxed">
              <strong className="text-sky-300">Bài học kiến trúc ({currentLevel.code}):</strong>{' '}
              {currentLevel.learningLesson}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPhase('TITLE')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer"
              >
                Danh Sách {TRAFFIC_LEVELS.length} Màn
              </button>
              <button
                type="button"
                data-testid="arch-back-to-design-btn"
                onClick={() => stopAndEditDesign()}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-sky-400/60 bg-sky-500/20 hover:bg-sky-500/30 text-xs sm:text-sm font-bold text-sky-200 cursor-pointer"
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
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-purple-400/60 bg-purple-500/20 hover:bg-purple-500/30 text-xs sm:text-sm font-bold text-purple-200 cursor-pointer"
                >
                  Thử Chế Độ Khó Hơn →
                </button>
              )}
              <button
                type="button"
                onClick={() => startScenario(levelIdx)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs sm:text-sm font-semibold text-white cursor-pointer"
              >
                Làm Lại Từ Đầu
              </button>
              {phase === 'VICTORY' && levelIdx + 1 < TRAFFIC_LEVELS.length && (
                <button
                  type="button"
                  data-testid="arch-next-level-btn"
                  onClick={() => startScenario(levelIdx + 1)}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-bold cursor-pointer"
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
