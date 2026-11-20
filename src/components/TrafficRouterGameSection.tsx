import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpCircle,
  Cable,
  CheckCircle2,
  Cpu,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Shield,
  Trash2,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  canAddEdge,
  CANVAS_H,
  CANVAS_W,
  createInitialNodes,
  evaluatePacketAtNode,
  getNodeCatalogEntry,
  getSellRefund,
  hasPathToDatabase,
  INFRA_NODE_CATALOG,
  PACKET_META,
  pickWeightedPacketKind,
  RACK_SLOTS,
  selectOutgoingEdge,
  TRAFFIC_LEVELS,
  type InfraEdge,
  type InfraNode,
  type InfraNodeType,
  type PacketKind,
  type PlaceableNodeType,
  type RackSlot,
} from '../utils/trafficRouterEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface TrafficRouterGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type ToolMode = PlaceableNodeType | 'wire' | 'cut';
type GamePhase = 'TITLE' | 'PLAYING' | 'VICTORY' | 'GAME_OVER';

interface ActivePacket {
  id: number;
  kind: PacketKind;
  edgeId: string;
  fromId: string;
  toId: string;
  t: number; // 0..1 along edge
  speed: number;
  latencyMs: number;
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
  dbCpu: number;
  systemHealth: number;
  avgLatencyMs: number;
  waveIndex: number; // 0-based active or next wave
  waveActive: boolean;
  waveCountdown: number;
  waveTimeLeft: number;
  deliveredOk: number;
  cacheHits: number;
  blockedAttacks: number;
  breachedAttacks: number;
  hasValidRoute: boolean;
  selectedNode: InfraNode | null;
  notice: string;
}

const SAVE_KEY = 'thuanle-traffic-router-v1';

function loadClearedLevels(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is number => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

function saveClearedLevels(ids: number[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
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
    g.gain.setValueAtTime(0.06, now);
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
    g.gain.setValueAtTime(0.03, now);
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
    g.gain.setValueAtTime(0.03, now);
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
    g.gain.setValueAtTime(kind === 'down' ? 0.1 : 0.05, now);
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
      g.gain.setValueAtTime(0.06, t);
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function TrafficRouterGameSection({ theme }: TrafficRouterGameSectionProps) {
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [tool, setTool] = useState<ToolMode>('redis');
  const [speedMult, setSpeedMult] = useState<1 | 2>(1);
  const [paused, setPaused] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [clearedLevels, setClearedLevels] = useState<number[]>(() => loadClearedLevels());

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
    dbCpu: 12,
    systemHealth: 100,
    latencySum: 0,
    latencySamples: 0,
    waveIndex: 0,
    waveActive: false,
    waveTimer: 0,
    waveCountdown: 8,
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
    notice: TRAFFIC_LEVELS[0].tacticalTip,
    outcome: null as 'victory' | 'gameover' | null,
  });

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    budget: TRAFFIC_LEVELS[0].startingBudget,
    dbCpu: 12,
    systemHealth: 100,
    avgLatencyMs: 28,
    waveIndex: 0,
    waveActive: false,
    waveCountdown: 8,
    waveTimeLeft: 0,
    deliveredOk: 0,
    cacheHits: 0,
    blockedAttacks: 0,
    breachedAttacks: 0,
    hasValidRoute: true,
    selectedNode: null,
    notice: TRAFFIC_LEVELS[0].tacticalTip,
  }));

  const syncHud = useCallback(() => {
    const s = simRef.current;
    const avgLat = s.latencySamples > 0 ? Math.round(s.latencySum / s.latencySamples) : 24;
    const sel = s.selectedNodeId ? s.nodes.find((n) => n.id === s.selectedNodeId) ?? null : null;
    setHud({
      budget: Math.round(s.budget),
      dbCpu: Math.round(s.dbCpu),
      systemHealth: Math.max(0, Math.round(s.systemHealth)),
      avgLatencyMs: avgLat,
      waveIndex: s.waveIndex,
      waveActive: s.waveActive,
      waveCountdown: Math.ceil(s.waveCountdown),
      waveTimeLeft: Math.max(0, Math.ceil(s.waveTimer)),
      deliveredOk: s.deliveredOk,
      cacheHits: s.cacheHits,
      blockedAttacks: s.blockedAttacks,
      breachedAttacks: s.breachedAttacks,
      hasValidRoute: hasPathToDatabase(s.nodes, s.edges),
      selectedNode: sel ? { ...sel } : null,
      notice: s.notice,
    });
  }, []);

  const startScenario = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(TRAFFIC_LEVELS.length - 1, idx));
      const lvl = TRAFFIC_LEVELS[clamped];
      setLevelIdx(clamped);
      simRef.current = {
        level: lvl,
        nodes: createInitialNodes(lvl),
        edges: [...lvl.initialEdges],
        packets: [],
        fxs: [],
        budget: lvl.startingBudget,
        dbCpu: 10,
        systemHealth: 100,
        latencySum: 0,
        latencySamples: 0,
        waveIndex: 0,
        waveActive: false,
        waveTimer: 0,
        waveCountdown: 8,
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
        notice: lvl.tacticalTip,
        outcome: null,
      };
      setPaused(false);
      setPhase('PLAYING');
      syncHud();
    },
    [syncHud]
  );

  const launchNextWave = useCallback(() => {
    const s = simRef.current;
    if (s.waveActive || s.outcome || s.waveIndex >= s.level.waves.length) return;
    if (!hasPathToDatabase(s.nodes, s.edges)) {
      s.notice = 'Cảnh báo: Chưa có đường dây nối từ Users → Database! Dùng [W] Nối Dây trước.';
      syncHud();
      return;
    }
    const waveDef = s.level.waves[s.waveIndex];
    s.waveActive = true;
    s.waveTimer = waveDef.durationSec;
    s.spawnTimer = 0.2;
    s.notice = `Đợt ${waveDef.waveNumber}/${s.level.waves.length}: ${waveDef.label}`;
    playRouterSfx(ensureAudio(), 'wave', muted);
    syncHud();
  }, [ensureAudio, muted, syncHud]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') setTool('waf');
      else if (e.key === '2') setTool('rate_limiter');
      else if (e.key === '3') setTool('load_balancer');
      else if (e.key === '4') setTool('redis');
      else if (e.key === '5') setTool('app');
      else if (e.key === 'w' || e.key === 'W') {
        setTool('wire');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'x' || e.key === 'X') {
        setTool('cut');
        simRef.current.wireSourceId = null;
      } else if (e.key === 'p' || e.key === 'P') {
        setPaused((v) => !v);
      } else if (e.key === ' ') {
        e.preventDefault();
        launchNextWave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [launchNextWave, phase]);

  // Actions on selected node
  const upgradeSelectedNode = useCallback(() => {
    const s = simRef.current;
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
    if (!s.selectedNodeId) return;
    const node = s.nodes.find((n) => n.id === s.selectedNodeId);
    if (!node || node.fixed) return;
    const refund = getSellRefund(node);
    s.budget += refund;
    s.nodes = s.nodes.filter((n) => n.id !== node.id);
    s.edges = s.edges.filter((e) => e.fromId !== node.id && e.toId !== node.id);
    s.packets = s.packets.filter((p) => p.fromId !== node.id && p.toId !== node.id);
    s.selectedNodeId = null;
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
    const pt = canvasCoords(e);

    // 1. Check click on any existing InfraNode
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
      s.notice = 'Đã nối dây mạng mới thành công!';
      playRouterSfx(ensureAudio(), 'wire', muted);
      syncHud();
      return;
    }

    if (tool === 'cut') {
      // Find clicked edge
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
        s.notice = 'Đã cắt đứt đường dây.';
        playRouterSfx(ensureAudio(), 'block', muted);
        syncHud();
      }
      return;
    }

    // Clicked an existing node while holding a build tool -> select it for inspection/upgrade/sell
    if (clickedNode) {
      s.selectedNodeId = clickedNode.id;
      s.wireSourceId = null;
      syncHud();
      return;
    }

    // Check if clicked an empty Rack Slot to place selected node type
    const clickedSlot: RackSlot | undefined = RACK_SLOTS.find(
      (sl) => Math.hypot(pt.x - sl.x, pt.y - sl.y) <= 34
    );

    if (!clickedSlot) {
      // Also allow clicking directly on an edge while in build mode? Just clear selection cleanly
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

    // Smart Auto-Splice: if an existing wire passes right through this Rack Slot, splice the new node inline!
    let spliced = false;
    for (let i = 0; i < s.edges.length; i++) {
      const ed = s.edges[i];
      const a = s.nodes.find((n) => n.id === ed.fromId);
      const b = s.nodes.find((n) => n.id === ed.toId);
      if (!a || !b) continue;
      // Only splice if slot lies horizontally between a.x and b.x and within 22px of the segment
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
      const dt = paused ? 0 : rawDt * speedMult;
      const s = simRef.current;

      // 1. Auto-wave countdown when idle between waves
      if (!paused && !s.waveActive && !s.outcome && s.waveIndex < s.level.waves.length) {
        s.waveCountdown = Math.max(0, s.waveCountdown - rawDt);
        if (s.waveCountdown <= 0) {
          if (hasPathToDatabase(s.nodes, s.edges)) {
            const waveDef = s.level.waves[s.waveIndex];
            s.waveActive = true;
            s.waveTimer = waveDef.durationSec;
            s.spawnTimer = 0.15;
            s.notice = `Tự động phát Đợt ${waveDef.waveNumber}/${s.level.waves.length}: ${waveDef.label}`;
            playRouterSfx(ensureAudio(), 'wave', muted);
          } else {
            s.waveCountdown = 5;
            s.notice = 'Chưa có đường dây Users → DB! Nối dây để hệ thống tiếp nhận gói tin.';
          }
        }
      }

      // 2. Spawn & move packets during active wave
      if (dt > 0 && !s.outcome) {
        s.dashOffset = (s.dashOffset - dt * 28) % 24;

        // Node heat decay
        for (const node of s.nodes) {
          node.heat = Math.max(0, node.heat - dt * 0.45);
        }

        // DB CPU cooling
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
                  speed: kind === 'ddos' ? 1.15 : 0.85,
                  latencyMs: 8,
                });
              }
            }
          }

          // Wave completion check
          if (s.waveTimer <= 0 && s.packets.length === 0) {
            s.waveActive = false;
            s.budget += waveDef.rewardBudget;
            s.waveIndex += 1;
            if (s.waveIndex >= s.level.waves.length) {
              s.outcome = 'victory';
              playRouterSfx(ensureAudio(), 'win', muted);
              setClearedLevels((prev) => {
                const merged = prev.includes(s.level.id) ? prev : [...prev, s.level.id];
                saveClearedLevels(merged);
                return merged;
              });
              setPhase('VICTORY');
            } else {
              s.waveCountdown = 8;
              s.notice = `Hoàn tất Đợt ${waveDef.waveNumber}! (+$${waveDef.rewardBudget}) · Đợt tiếp sau 8s.`;
            }
          }
        }

        // Advance active packets along edges
        const nextPackets: ActivePacket[] = [];
        for (const p of s.packets) {
          p.t += p.speed * dt;
          if (p.t < 1) {
            nextPackets.push(p);
            continue;
          }

          // Reached target node
          const target = s.nodes.find((n) => n.id === p.toId);
          if (!target) continue;

          target.heat = Math.min(1, target.heat + (p.kind === 'ddos' ? 0.18 : 0.12));
          const outgoing = s.edges.filter((e) => e.fromId === target.id);
          const decision = evaluatePacketAtNode(target, p.kind, Math.random(), outgoing.length);
          const totalLatency = p.latencyMs + decision.addedLatencyMs;

          if (decision.outcome === 'blocked') {
            target.blockedCount += 1;
            s.blockedAttacks += 1;
            s.budget += p.kind === 'sqli' ? 4 : 2;
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
              s.budget += p.kind === 'write' ? 3 : 2;
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
              });
            }
          }
        }
        s.packets = nextPackets;

        // Check CPU saturation -> system health drain -> 502 Bad Gateway
        if (s.dbCpu >= 96) {
          s.systemHealth = Math.max(0, s.systemHealth - dt * 16);
        } else if (s.dbCpu < 75 && s.systemHealth < 100 && s.waveActive) {
          s.systemHealth = Math.min(100, s.systemHealth + dt * 1.4);
        }

        if (s.systemHealth <= 0) {
          s.outcome = 'gameover';
          playRouterSfx(ensureAudio(), 'down', muted);
          setPhase('GAME_OVER');
        }

        // Advance floating FX
        s.fxs = s.fxs
          .map((fx) => ({ ...fx, y: fx.y - dt * 18, life: fx.life - dt }))
          .filter((fx) => fx.life > 0);
      }

      // 3. Draw Canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // Dark architectural blueprint background
        ctx.fillStyle = '#0B1320';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Subtle grid
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

        // Architectural layer headers
        const layers = [
          { x: 84, label: 'NGƯỜI DÙNG' },
          { x: 250, label: 'BẢO VỆ (EDGE)' },
          { x: 440, label: 'CHIA TẢI & CACHE' },
          { x: 630, label: 'APP SERVERS' },
          { x: 796, label: 'DATABASE' },
        ];
        ctx.font = '600 10px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.72)';
        for (const l of layers) {
          ctx.fillText(l.label, l.x, 26);
        }

        // Empty Rack Slots
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

        // Wires (Edges)
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

          // Animated flow pulse
          ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.lineWidth = 1.6;
          ctx.setLineDash([6, 12]);
          ctx.lineDashOffset = s.dashOffset;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Midpoint directional arrow
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

        // Moving Packets
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
          ctx.shadowColor = meta.color;
          ctx.shadowBlur = 10;

          if (p.kind === 'read') {
            ctx.beginPath();
            ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.kind === 'write') {
            ctx.fillRect(-5.5, -5.5, 11, 11);
          } else if (p.kind === 'ddos') {
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(6.5, 5);
            ctx.lineTo(-6.5, 5);
            ctx.closePath();
            ctx.fill();
          } else {
            // SQLi diamond
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
          // Heat aura
          if (node.heat > 0.05) {
            ctx.fillStyle =
              node.type === 'database' && s.dbCpu > 85
                ? `rgba(239, 68, 68, ${node.heat * 0.38})`
                : `rgba(56, 189, 248, ${node.heat * 0.22})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 38, 0, Math.PI * 2);
            ctx.fill();
          }

          // Node Box
          ctx.fillStyle = '#0F1A2E';
          ctx.strokeStyle = isWireSrc ? '#38BDF8' : isSelected ? '#FACC15' : meta.color;
          ctx.lineWidth = isSelected || isWireSrc ? 2.6 : 1.8;
          ctx.beginPath();
          ctx.roundRect(node.x - 32, node.y - 26, 64, 52, 11);
          ctx.fill();
          ctx.stroke();

          // Top Accent Bar
          ctx.fillStyle = meta.color;
          ctx.beginPath();
          ctx.roundRect(node.x - 32, node.y - 26, 64, 6, [11, 11, 0, 0]);
          ctx.fill();

          // Node Label
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(meta.label, node.x, node.y + 1);

          // Level or DB CPU badge inside node
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

        // Floating FX popups
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

      hudAccum += rawDt;
      if (hudAccum >= 0.1) {
        hudAccum = 0;
        syncHud();
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [muted, paused, phase, speedMult, syncHud, tool]);

  // -------------------------------------------------------------------------
  // Title Screen
  // -------------------------------------------------------------------------
  if (phase === 'TITLE') {
    return (
      <section
        id="traffic-router-section"
        aria-label="Điều Phối Lưu Lượng & Chống DDoS — Traffic Router & Load Balancer"
        className="rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-5 sm:p-8 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-mono tracking-wide text-sky-400">
                System Architecture Game · 5 Kịch Bản Hạ Tầng · Chống DDoS &amp; SQLi
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight [text-wrap:balance]">
                Điều Phối Lưu Lượng &amp; Chống DDoS
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Vào vai kiến trúc sư hạ tầng trực tiếp nối dây giữa <strong className="text-sky-300">Users</strong> và{' '}
                <strong className="text-amber-300">Database Cluster</strong>. Phối hợp{' '}
                <strong className="text-purple-300">WAF</strong>,{' '}
                <strong className="text-rose-300">Rate Limiter</strong>,{' '}
                <strong className="text-blue-300">Load Balancer (Round-Robin)</strong> và{' '}
                <strong className="text-cyan-300">Redis Cache</strong> để giữ CPU DB dưới 100% và tránh lỗi{' '}
                <span className="font-mono text-rose-400">502 Bad Gateway</span>!
              </p>
            </div>

            {/* 5 Scenarios Grid */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400">
                Chọn kịch bản triển khai ({clearedLevels.length}/{TRAFFIC_LEVELS.length} đã vượt qua)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRAFFIC_LEVELS.map((lvl, idx) => {
                  const isSelected = idx === levelIdx;
                  const isCleared = clearedLevels.includes(lvl.id);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setLevelIdx(idx)}
                      className={`text-left px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 text-white'
                          : 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-500/60 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span>{lvl.code} · {lvl.difficulty} · {lvl.waves.length} Đợt</span>
                        {isCleared && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-label="Đã hoàn thành" />
                        )}
                      </div>
                      <p className="text-sm font-semibold mt-0.5 truncate">{lvl.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-testid="traffic-start-btn"
                onClick={() => startScenario(levelIdx)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm sm:text-base transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                <span>Triển Khai Màn {levelIdx + 1}</span>
              </button>
              <span className="text-xs text-slate-400">
                Phím 1–5 chọn node · W nối dây · X tháo dây · Space gọi đợt
              </span>
            </div>
          </div>

          {/* Right Column: Packet Legend & Pipeline Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-5 space-y-4">
              <p className="text-xs font-mono text-sky-400">PHÂN LOẠI GÓI TIN ĐẾN</p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                  <span className="font-semibold text-sky-300">● GET /read (Đọc)</span>
                  <span className="text-slate-300">Chặn bởi Redis Cache</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                  <span className="font-semibold text-amber-300">■ POST /write (Ghi nặng)</span>
                  <span className="text-slate-300">Chia tải Load Balancer + App</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                  <span className="font-semibold text-rose-400">▲ Bot DDoS Flood</span>
                  <span className="text-slate-300">Chặn bằng Rate Limiter</span>
                </div>
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#132138] border border-[#1E2E4A]">
                  <span className="font-semibold text-purple-400">◆ SQL Injection</span>
                  <span className="text-slate-300">Chặn 100% bằng WAF</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentLevel.tacticalTip}
              </p>
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

  return (
    <section
      id="traffic-router-section"
      aria-label="Không gian Điều Phối Lưu Lượng & Chống DDoS"
      className="relative rounded-2xl border border-[#1E2E4A] bg-[#0B1320] text-[#F1F5F9] p-3.5 sm:p-5 shadow-sm"
    >
      {/* Top Telemetry HUD */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 pb-3 border-b border-[#1E2E4A]">
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm tabular-nums">
          <button
            type="button"
            onClick={() => setPhase('TITLE')}
            className="px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            Menu ({levelIdx + 1}/5)
          </button>

          <div>
            <span className="text-slate-400 text-xs mr-1.5">NGÂN SÁCH</span>
            <strong className="font-mono text-amber-300">${hud.budget}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${hud.dbCpu >= 85 ? 'text-rose-400' : 'text-sky-400'}`} />
            <span className="text-slate-400 text-xs">CPU DB</span>
            <strong
              className={`font-mono ${
                hud.dbCpu >= 85 ? 'text-rose-400' : hud.dbCpu >= 60 ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              {hud.dbCpu}%
            </strong>
            <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  hud.dbCpu >= 85 ? 'bg-rose-500' : hud.dbCpu >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${hud.dbCpu}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Shield className={`w-4 h-4 ${hud.systemHealth < 40 ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400 text-xs">UPTIME</span>
            <strong className="font-mono text-emerald-300">{hud.systemHealth}%</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 text-xs">ĐỘ TRỄ</span>
            <strong className="font-mono text-cyan-300">{hud.avgLatencyMs}ms</strong>
          </div>

          <div>
            <span className="text-slate-400 text-xs mr-1.5">ĐỢT</span>
            <strong className="font-mono text-white">
              {Math.min(hud.waveIndex + (hud.waveActive ? 1 : 0), currentLevel.waves.length)}/
              {currentLevel.waves.length}
            </strong>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span>Cache Hit: <strong className="text-cyan-300">{hud.cacheHits}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Đã chặn: <strong className="text-rose-300">{hud.blockedAttacks}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSpeedMult((s) => (s === 1 ? 2 : 1))}
            className="px-2.5 py-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 font-mono text-xs font-semibold cursor-pointer whitespace-nowrap"
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
            aria-label={paused ? 'Tiếp tục' : 'Tạm dừng'}
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 cursor-pointer"
          >
            {paused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => startScenario(levelIdx)}
            aria-label="Chơi lại kịch bản này"
            className="p-1.5 rounded-lg border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Blueprint Canvas */}
      <div className="mt-3 relative flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerMove={handleCanvasPointerMove}
          onPointerDown={handleCanvasPointerDown}
          className="w-full max-w-[880px] aspect-[880/480] h-auto rounded-xl border border-[#1E2E4A] cursor-crosshair touch-none"
          aria-label="Sơ đồ mạng Điều Phối Lưu Lượng và Chống DDoS"
        />
      </div>

      {/* Bottom Infrastructure Tool Palette & Wire / Wave Controls */}
      <div className="mt-3 space-y-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
                className={`px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-sky-500/20 border-sky-400 text-white'
                    : 'bg-[#111C33] border-[#1E2E4A] hover:border-sky-500/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-semibold">
                  <span className="truncate">[{item.hotkey}] {item.shortName}</span>
                  <span className="font-mono text-amber-300 shrink-0">${item.cost}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.roleSummary}</p>
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
            className={`px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
              tool === 'wire'
                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                : 'bg-[#111C33] border-[#1E2E4A] hover:border-cyan-400 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Cable className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>[W] Nối Dây</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">Nhấp Nguồn → Đích</p>
          </button>

          <button
            type="button"
            data-testid="traffic-cut-tool-btn"
            onClick={() => {
              setTool('cut');
              simRef.current.wireSourceId = null;
            }}
            className={`px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
              tool === 'cut'
                ? 'bg-rose-500/20 border-rose-400 text-white'
                : 'bg-[#111C33] border-[#1E2E4A] hover:border-rose-400 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Scissors className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>[X] Tháo Dây</span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">Nhấp vào đường nối</p>
          </button>
        </div>

        {/* Selected Node Inspector + Wave Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-[#1E2E4A]">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {hud.selectedNode && selectedEntry && (
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

          <button
            type="button"
            data-testid="traffic-wave-btn"
            disabled={hud.waveActive || hud.waveIndex >= currentLevel.waves.length}
            onClick={launchNextWave}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Zap className="w-4 h-4" />
            <span>
              {hud.waveActive
                ? `Đang chịu tải Đợt ${hud.waveIndex + 1}/${currentLevel.waves.length} (${hud.waveTimeLeft}s)`
                : hud.waveIndex >= currentLevel.waves.length
                  ? 'Hoàn tất mọi đợt'
                  : `Gọi Đợt ${hud.waveIndex + 1}/${currentLevel.waves.length} (Tự gọi: ${hud.waveCountdown}s)`}
            </span>
          </button>
        </div>
      </div>

      {/* Victory / 502 Bad Gateway Modal */}
      {(phase === 'VICTORY' || phase === 'GAME_OVER') && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={phase === 'VICTORY' ? 'Hệ thống vận hành ổn định' : '502 Bad Gateway'}
          className="absolute inset-0 z-20 rounded-2xl bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#1E2E4A] bg-[#0F192B] p-6 text-center space-y-4 shadow-xl">
            <div
              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                phase === 'VICTORY'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {phase === 'VICTORY' ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <p
                className={`text-xs font-mono ${
                  phase === 'VICTORY' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {phase === 'VICTORY' ? '200 OK · UPTIME VỮNG VÀNG' : '502 BAD GATEWAY · SẬP CƠ SỞ DỮ LIỆU'}
              </p>
              <h3 className="text-xl font-bold text-white">
                {phase === 'VICTORY'
                  ? `Bảo Vệ Thành Công ${currentLevel.title}!`
                  : 'Database Quá Tải 100% CPU!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Xử lý: <strong>{hud.deliveredOk}</strong> · Cache Hit:{' '}
                <strong className="text-cyan-300">{hud.cacheHits}</strong> · Đã chặn:{' '}
                <strong className="text-rose-300">{hud.blockedAttacks}</strong> · Độ trễ TB:{' '}
                <strong>{hud.avgLatencyMs}ms</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => startScenario(levelIdx)}
                className="px-4 py-2 rounded-xl border border-[#1E2E4A] bg-[#111C33] hover:border-sky-400 text-xs sm:text-sm font-semibold text-white cursor-pointer"
              >
                Chơi Lại Màn Này
              </button>
              {phase === 'VICTORY' && levelIdx + 1 < TRAFFIC_LEVELS.length ? (
                <button
                  type="button"
                  onClick={() => startScenario(levelIdx + 1)}
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Sang Màn {levelIdx + 2}/{TRAFFIC_LEVELS.length} →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhase('TITLE')}
                  className="px-5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs sm:text-sm font-bold cursor-pointer"
                >
                  Về Danh Sách Màn
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
