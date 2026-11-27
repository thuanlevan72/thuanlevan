import {
  canAddEdge,
  CANVAS_H,
  CANVAS_W,
  computeBezierPointAndTangent,
  distToCubicBezier,
  getEdgeControlPoints,
  getEdgeRouteMeta,
  getNodeCatalogEntry,
  getNodeOperationalTelemetry,
  getQueueMaxBuffer,
  isDatabaseSinkType,
  PACKET_META,
  RACK_SLOTS,
  type InfraEdge,
  type InfraNode,
  type InfraNodeType,
  type PacketKind,
  type PlaceableNodeType,
  type SreActionId,
  type WaveIncidentEvent,
} from './trafficRouterEngine.ts';

export interface ActivePacketVisual {
  id: number;
  kind: PacketKind;
  edgeId: string;
  fromId: string;
  toId: string;
  t: number;
}

export interface FloatingFxVisual {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface CanvasShockwave {
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

export interface CanvasSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface RenderBlueprintOptions {
  nodes: readonly InfraNode[];
  edges: readonly InfraEdge[];
  packets: readonly ActivePacketVisual[];
  fxs: readonly FloatingFxVisual[];
  shockwaves: readonly CanvasShockwave[];
  sparks: readonly CanvasSpark[];
  simStage: 'DESIGNING' | 'SIMULATING';
  tool: PlaceableNodeType | 'wire' | 'cut' | 'route';
  selectedNodeId: string | null;
  wireSourceId: string | null;
  hoverPos: { x: number; y: number } | null;
  dashOffset: number;
  dbCpu: number;
  unusedNodeIds: ReadonlySet<string>;
  highlightNodeIds?: ReadonlySet<string>;
  activeSreEffects?: Partial<Record<SreActionId, number>>;
  activeIncident?: WaveIncidentEvent | null;
  showGhostPath?: boolean;
  elapsedSimSec?: number;
  timeSec: number;
}

function getNodeVisualMeta(type: InfraNodeType): { label: string; color: string } {
  if (type === 'ingress') return { label: 'USERS', color: '#38BDF8' };
  if (type === 'database') return { label: 'DB CLUSTER', color: '#F59E0B' };
  const entry = getNodeCatalogEntry(type);
  return { label: entry.shortName, color: entry.color };
}

function drawBlueprintBackground(
  ctx: CanvasRenderingContext2D,
  simStage: 'DESIGNING' | 'SIMULATING',
  dbCpu: number,
  timeSec: number,
  recommendedCols: readonly number[] | null,
  activeIncident: WaveIncidentEvent | null | undefined
) {
  // Deep layered NOC blueprint backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  bgGrad.addColorStop(0, '#040812');
  bgGrad.addColorStop(0.5, '#081122');
  bgGrad.addColorStop(1, '#050B16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle ambient telemetry blooms behind Edge & DB zones
  const edgeGlow = ctx.createRadialGradient(225, 250, 20, 225, 250, 240);
  edgeGlow.addColorStop(0, 'rgba(14, 165, 233, 0.08)');
  edgeGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = edgeGlow;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const dbHeatAlpha =
    dbCpu >= 85 ? 0.17 : dbCpu >= 65 ? 0.11 : 0.07;
  const dbGlow = ctx.createRadialGradient(844, 250, 15, 844, 250, 230);
  dbGlow.addColorStop(
    0,
    dbCpu >= 85
      ? `rgba(239, 68, 68, ${dbHeatAlpha})`
      : `rgba(245, 158, 11, ${dbHeatAlpha})`
  );
  dbGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = dbGlow;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const zones = [
    { col: -1, code: '01', x0: 14, x1: 144, cx: 79, label: 'USERS · INGRESS' },
    { col: 0, code: '02', x0: 152, x1: 298, cx: 225, label: 'EDGE · BẢO VỆ' },
    { col: 1, code: '03', x0: 306, x1: 464, cx: 385, label: 'CACHE · LB' },
    { col: 2, code: '04', x0: 472, x1: 618, cx: 545, label: 'COMPUTE · MQ' },
    { col: 3, code: '05', x0: 626, x1: 774, cx: 700, label: 'REPLICA · S3' },
    { col: 4, code: '06', x0: 782, x1: 906, cx: 844, label: 'DATABASE' },
  ];

  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const isRec = recommendedCols !== null && recommendedCols.includes(z.col);
    const isHotDb = z.col === 4 && dbCpu >= 80;

    const bayGrad = ctx.createLinearGradient(z.x0, 34, z.x0, CANVAS_H - 14);
    if (isHotDb) {
      bayGrad.addColorStop(0, 'rgba(127, 29, 29, 0.22)');
      bayGrad.addColorStop(1, 'rgba(69, 10, 10, 0.14)');
    } else if (isRec) {
      bayGrad.addColorStop(0, 'rgba(14, 165, 233, 0.13)');
      bayGrad.addColorStop(1, 'rgba(14, 165, 233, 0.04)');
    } else if (i % 2 === 0) {
      bayGrad.addColorStop(0, 'rgba(15, 28, 48, 0.42)');
      bayGrad.addColorStop(1, 'rgba(9, 18, 34, 0.22)');
    } else {
      bayGrad.addColorStop(0, 'rgba(11, 21, 38, 0.28)');
      bayGrad.addColorStop(1, 'rgba(7, 14, 26, 0.14)');
    }
    ctx.fillStyle = bayGrad;
    ctx.beginPath();
    ctx.roundRect(z.x0, 34, z.x1 - z.x0, CANVAS_H - 48, 10);
    ctx.fill();

    ctx.strokeStyle = isHotDb
      ? 'rgba(248, 113, 113, 0.42)'
      : isRec
        ? 'rgba(56, 189, 248, 0.42)'
        : 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = isRec || isHotDb ? 1.4 : 1;
    ctx.stroke();

    // Brushed server-rack side rail screw ticks inside each bay
    ctx.fillStyle = isRec ? 'rgba(56, 189, 248, 0.28)' : 'rgba(148, 163, 184, 0.12)';
    for (let ry = 48; ry <= CANVAS_H - 28; ry += 20) {
      ctx.fillRect(z.x0 + 4, ry, 2, 4);
      ctx.fillRect(z.x1 - 6, ry, 2, 4);
    }
  }

  // Minor & Major drafting grid (batched into 2 strokes)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.028)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = 20; gx < CANVAS_W; gx += 20) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CANVAS_H);
  }
  for (let gy = 20; gy < CANVAS_H; gy += 20) {
    ctx.moveTo(0, gy);
    ctx.lineTo(CANVAS_W, gy);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.065)';
  ctx.beginPath();
  for (let gx = 80; gx < CANVAS_W; gx += 80) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CANVAS_H);
  }
  for (let gy = 80; gy < CANVAS_H; gy += 80) {
    ctx.moveTo(0, gy);
    ctx.lineTo(CANVAS_W, gy);
  }
  ctx.stroke();

  // Sweeping NOC telemetry scan beam during active simulation
  if (simStage === 'SIMULATING') {
    const scanX = ((timeSec * 92) % (CANVAS_W + 180)) - 90;
    const scanGrad = ctx.createLinearGradient(scanX - 70, 0, scanX + 14, 0);
    scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    scanGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.045)');
    scanGrad.addColorStop(1, 'rgba(125, 211, 252, 0.12)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(Math.max(0, scanX - 70), 34, 84, CANVAS_H - 48);
  }

  // Drafting frame corner registration brackets
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(8, 20);
  ctx.lineTo(8, 8);
  ctx.lineTo(20, 8);
  ctx.moveTo(CANVAS_W - 20, 8);
  ctx.lineTo(CANVAS_W - 8, 8);
  ctx.lineTo(CANVAS_W - 8, 20);
  ctx.moveTo(8, CANVAS_H - 20);
  ctx.lineTo(8, CANVAS_H - 8);
  ctx.lineTo(20, CANVAS_H - 8);
  ctx.moveTo(CANVAS_W - 20, CANVAS_H - 8);
  ctx.lineTo(CANVAS_W - 8, CANVAS_H - 8);
  ctx.lineTo(CANVAS_W - 8, CANVAS_H - 20);
  ctx.stroke();

  // Zone headers with crisp bay codes
  ctx.textBaseline = 'middle';
  for (const z of zones) {
    const isRec = recommendedCols !== null && recommendedCols.includes(z.col);
    const isHotDb = z.col === 4 && dbCpu >= 85;
    const headerText = `${z.code} · ${z.label}`;
    ctx.font = '700 9.5px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isHotDb
      ? 'rgba(252, 165, 165, 0.96)'
      : isRec
        ? 'rgba(125, 211, 252, 0.98)'
        : 'rgba(148, 163, 184, 0.82)';
    ctx.fillText(headerText, z.cx, 19);
  }

  if (simStage === 'SIMULATING' && (dbCpu >= 86 || activeIncident)) {
    const pulse = 0.24 + Math.sin(timeSec * 8) * 0.14;
    ctx.save();
    ctx.strokeStyle =
      dbCpu >= 86
        ? `rgba(239, 68, 68, ${pulse})`
        : `rgba(245, 158, 11, ${pulse * 0.85})`;
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
    ctx.restore();
  }
}

function drawGhostRecommendedPath(
  ctx: CanvasRenderingContext2D,
  dashOffset: number
) {
  const pts: Array<[number, number]> = [
    [76, 250],
    [225, 250],
    [385, 250],
    [545, 250],
    [705, 250],
    [844, 250],
  ];
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([5, 7]);
  ctx.lineDashOffset = dashOffset * 0.6;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.stroke();

  // Subtle branch hints to Multi-DB Shard slots
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.beginPath();
  ctx.moveTo(705, 250);
  ctx.lineTo(844, 112);
  ctx.moveTo(705, 250);
  ctx.lineTo(844, 388);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawNodeGlyph(
  ctx: CanvasRenderingContext2D,
  type: InfraNodeType,
  cx: number,
  cy: number,
  color: string,
  timeSec = 0,
  animate = false
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.88, 0.88);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'ingress': {
      const wavePulse = animate ? Math.sin(timeSec * 4) * 1.2 : 0;
      ctx.beginPath();
      ctx.arc(-2, 0, 5.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0.5, 0, 9.2 + wavePulse * 0.5, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-2, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'waf': {
      ctx.beginPath();
      ctx.moveTo(0, -8.5);
      ctx.lineTo(7.5, -5.2);
      ctx.lineTo(6.5, 2.5);
      ctx.quadraticCurveTo(0, 8.8, 0, 8.8);
      ctx.quadraticCurveTo(0, 8.8, -6.5, 2.5);
      ctx.lineTo(-7.5, -5.2);
      ctx.closePath();
      ctx.save();
      ctx.globalAlpha = animate ? 0.18 + Math.sin(timeSec * 5) * 0.08 : 0.14;
      ctx.fill();
      ctx.restore();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3.2, 0);
      ctx.lineTo(3.2, 0);
      ctx.moveTo(0, -3.2);
      ctx.lineTo(0, 3.8);
      ctx.stroke();
      break;
    }
    case 'rate_limiter': {
      ctx.beginPath();
      ctx.arc(0, 2, 7.8, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      const needleAng = animate ? -0.55 + Math.sin(timeSec * 4.5) * 0.35 : -0.7;
      ctx.beginPath();
      ctx.moveTo(0, 3.5);
      ctx.lineTo(Math.sin(needleAng) * -6.5, 3.5 - Math.cos(needleAng) * 7.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 3.5, 2.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ddos_scrubber': {
      ctx.beginPath();
      ctx.arc(0, 0, 7.8, 0, Math.PI * 2);
      ctx.stroke();
      if (animate) {
        const sweep = timeSec * 3.8;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 7.2, sweep, sweep + 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.moveTo(-4.8, -4.8);
      ctx.lineTo(4.8, 4.8);
      ctx.moveTo(4.8, -4.8);
      ctx.lineTo(-4.8, 4.8);
      ctx.stroke();
      break;
    }
    case 'cdn': {
      const pts: Array<[number, number]> = [
        [0, -7.5],
        [7.5, 5],
        [-7.5, 5],
      ];
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      ctx.lineTo(pts[1][0], pts[1][1]);
      ctx.lineTo(pts[2][0], pts[2][1]);
      ctx.closePath();
      ctx.stroke();
      for (const [px, py] of pts) {
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'api_gateway': {
      ctx.strokeRect(-7.5, -7, 15, 14);
      ctx.beginPath();
      ctx.moveTo(-3.5, -2.5);
      ctx.lineTo(3.5, -2.5);
      ctx.moveTo(-3.5, 2.5);
      ctx.lineTo(3.5, 2.5);
      ctx.stroke();
      break;
    }
    case 'load_balancer': {
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-2, 0);
      ctx.lineTo(7, -6);
      ctx.moveTo(-2, 0);
      ctx.lineTo(7.5, 0);
      ctx.moveTo(-2, 0);
      ctx.lineTo(7, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-2, 0, 2.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'varnish': {
      ctx.beginPath();
      ctx.moveTo(-6, -6.5);
      ctx.lineTo(0, 6.5);
      ctx.lineTo(6, -6.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();
      break;
    }
    case 'redis': {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, -3.5);
      ctx.lineTo(0, 1);
      ctx.lineTo(-8, -3.5);
      ctx.closePath();
      ctx.save();
      ctx.globalAlpha = animate ? 0.25 + Math.sin(timeSec * 6) * 0.1 : 0.16;
      ctx.fill();
      ctx.restore();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-7.5, 2);
      ctx.lineTo(0, 6.2);
      ctx.lineTo(7.5, 2);
      ctx.stroke();
      break;
    }
    case 'app': {
      ctx.strokeRect(-7.5, -7, 15, 5.5);
      ctx.strokeRect(-7.5, 1.5, 15, 5.5);
      ctx.fillRect(-4.5, -5, 2.2, 1.8);
      ctx.fillRect(-4.5, 3.5, 2.2, 1.8);
      break;
    }
    case 'microservice_auth': {
      ctx.beginPath();
      ctx.arc(-2.5, -1, 4.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(1.7, -1);
      ctx.lineTo(8, -1);
      ctx.lineTo(8, 3);
      ctx.moveTo(5.5, -1);
      ctx.lineTo(5.5, 2.2);
      ctx.stroke();
      break;
    }
    case 'search_engine': {
      ctx.beginPath();
      ctx.arc(-2, -2, 5.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 2);
      ctx.lineTo(7.5, 7.5);
      ctx.stroke();
      break;
    }
    case 'queue': {
      ctx.beginPath();
      ctx.moveTo(-8.5, -5.5);
      ctx.lineTo(8.5, -5.5);
      ctx.moveTo(-8.5, 5.5);
      ctx.lineTo(8.5, 5.5);
      ctx.stroke();
      const shift = animate ? (timeSec * 8) % 5 : 0;
      ctx.fillRect(-6.5 + shift * 0.4, -2.5, 3.2, 5);
      ctx.fillRect(-1.5 + shift * 0.4, -2.5, 3.2, 5);
      ctx.fillRect(3.5, -2.5, 3.2, 5);
      break;
    }
    case 'stream_processor': {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.quadraticCurveTo(-2, -9, 2, -2);
      ctx.quadraticCurveTo(5, 3, 8, -2);
      ctx.moveTo(-8, 3);
      ctx.quadraticCurveTo(-2, -2, 2, 5);
      ctx.quadraticCurveTo(5, 9, 8, 4);
      ctx.stroke();
      break;
    }
    case 'worker': {
      const spin = animate ? timeSec * 2.2 : 0;
      ctx.rotate(spin);
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 4.8, Math.sin(a) * 4.8);
        ctx.lineTo(Math.cos(a) * 7.8, Math.sin(a) * 7.8);
        ctx.stroke();
      }
      break;
    }
    case 'batch_etl': {
      ctx.beginPath();
      ctx.moveTo(-7, -6);
      ctx.lineTo(7, -6);
      ctx.lineTo(2.5, 1);
      ctx.lineTo(2.5, 7);
      ctx.lineTo(-2.5, 7);
      ctx.lineTo(-2.5, 1);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'read_replica': {
      for (const ox of [-4.2, 4.2]) {
        ctx.beginPath();
        ctx.ellipse(ox, -4.5, 3.6, 1.8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ox - 3.6, -4.5);
        ctx.lineTo(ox - 3.6, 4.5);
        ctx.ellipse(ox, 4.5, 3.6, 1.8, 0, Math.PI, 0, true);
        ctx.lineTo(ox + 3.6, -4.5);
        ctx.stroke();
      }
      break;
    }
    case 'object_storage': {
      ctx.beginPath();
      ctx.moveTo(-7, -5.5);
      ctx.lineTo(7, -5.5);
      ctx.lineTo(5.5, 6.5);
      ctx.lineTo(-5.5, 6.5);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -5.5, 7, 2.2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'nosql_db': {
      ctx.beginPath();
      ctx.moveTo(-4, -7);
      ctx.quadraticCurveTo(-7, -7, -7, -2);
      ctx.lineTo(-7, 2);
      ctx.quadraticCurveTo(-7, 7, -4, 7);
      ctx.moveTo(4, -7);
      ctx.quadraticCurveTo(7, -7, 7, -2);
      ctx.lineTo(7, 2);
      ctx.quadraticCurveTo(7, 7, 4, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'timeseries_db': {
      ctx.strokeRect(-7.5, -7, 15, 14);
      ctx.beginPath();
      ctx.moveTo(-5.5, 3);
      ctx.lineTo(-2, -2);
      ctx.lineTo(1.5, 1);
      ctx.lineTo(5.5, -4);
      ctx.stroke();
      break;
    }
    case 'primary_db':
    case 'database': {
      ctx.beginPath();
      ctx.ellipse(0, -6, 7.5, 2.6, 0, 0, Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = animate ? 0.22 + Math.sin(timeSec * 5) * 0.1 : 0.14;
      ctx.fill();
      ctx.restore();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-7.5, -6);
      ctx.lineTo(-7.5, 5.5);
      ctx.ellipse(0, 5.5, 7.5, 2.6, 0, Math.PI, 0, true);
      ctx.lineTo(7.5, -6);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -0.5, 7.5, 2.2, 0, 0, Math.PI);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function renderArchitectureCanvas(
  ctx: CanvasRenderingContext2D,
  opts: RenderBlueprintOptions
) {
  const {
    nodes,
    edges,
    packets,
    fxs,
    shockwaves,
    sparks,
    simStage,
    tool,
    selectedNodeId,
    wireSourceId,
    hoverPos,
    dashOffset,
    dbCpu,
    unusedNodeIds,
    highlightNodeIds,
    activeSreEffects,
    activeIncident,
    showGhostPath = true,
    elapsedSimSec = 1,
    timeSec,
  } = opts;

  const activeCatalogEntry =
    tool !== 'wire' && tool !== 'cut' && tool !== 'route'
      ? getNodeCatalogEntry(tool)
      : null;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBlueprintBackground(
    ctx,
    simStage,
    dbCpu,
    timeSec,
    simStage === 'DESIGNING' && activeCatalogEntry ? activeCatalogEntry.recommendedCols : null,
    activeIncident
  );

  // Ghost Path guide during design mode
  if (simStage === 'DESIGNING' && showGhostPath) {
    drawGhostRecommendedPath(ctx, dashOffset);
  }

  // 1. Recessed Empty Rack Slots + Recommended Tier Highlights & Ghost Preview
  for (const slot of RACK_SLOTS) {
    const isOccupied = nodes.some((n) => n.slotId === slot.id);
    if (isOccupied) continue;
    const isHover =
      simStage === 'DESIGNING' &&
      hoverPos !== null &&
      Math.hypot(hoverPos.x - slot.x, hoverPos.y - slot.y) <= 40;
    const isRecommended =
      simStage === 'DESIGNING' &&
      activeCatalogEntry !== null &&
      activeCatalogEntry.recommendedCols.includes(slot.col);
    const isNonIdeal =
      simStage === 'DESIGNING' && activeCatalogEntry !== null && !isRecommended;

    const sw = 92;
    const sh = 56;
    const sx0 = slot.x - sw / 2;
    const sy0 = slot.y - sh / 2;

    ctx.save();
    const slotGrad = ctx.createLinearGradient(sx0, sy0, sx0, sy0 + sh);
    if (isHover) {
      slotGrad.addColorStop(
        0,
        isNonIdeal ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.22)'
      );
      slotGrad.addColorStop(1, 'rgba(9, 17, 32, 0.85)');
    } else if (isRecommended) {
      slotGrad.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
      slotGrad.addColorStop(1, 'rgba(8, 22, 30, 0.68)');
    } else {
      slotGrad.addColorStop(0, 'rgba(10, 18, 34, 0.72)');
      slotGrad.addColorStop(1, 'rgba(6, 12, 24, 0.56)');
    }
    ctx.fillStyle = slotGrad;
    ctx.strokeStyle = isHover
      ? isNonIdeal
        ? '#F59E0B'
        : '#38BDF8'
      : isRecommended
        ? 'rgba(52, 211, 153, 0.62)'
        : slot.col === 4
          ? 'rgba(245, 158, 11, 0.36)'
          : 'rgba(100, 116, 139, 0.28)';
    ctx.lineWidth = isHover ? 1.8 : isRecommended ? 1.4 : 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(sx0, sy0, sw, sh, 9);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Rack socket screw rivets
    ctx.fillStyle = isHover
      ? '#7DD3FC'
      : isRecommended
        ? 'rgba(52, 211, 153, 0.65)'
        : 'rgba(148, 163, 184, 0.24)';
    for (const [rx, ry] of [
      [sx0 + 5, sy0 + 5],
      [sx0 + sw - 5, sy0 + 5],
      [sx0 + 5, sy0 + sh - 5],
      [sx0 + sw - 5, sy0 + sh - 5],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Corner mount brackets
    ctx.strokeStyle = isHover
      ? isNonIdeal
        ? '#FBBF24'
        : '#7DD3FC'
      : isRecommended
        ? '#34D399'
        : 'rgba(148, 163, 184, 0.32)';
    ctx.lineWidth = 1.4;
    const tk = 6;
    ctx.beginPath();
    ctx.moveTo(sx0, sy0 + tk);
    ctx.lineTo(sx0, sy0);
    ctx.lineTo(sx0 + tk, sy0);
    ctx.moveTo(sx0 + sw - tk, sy0);
    ctx.lineTo(sx0 + sw, sy0);
    ctx.lineTo(sx0 + sw, sy0 + tk);
    ctx.moveTo(sx0, sy0 + sh - tk);
    ctx.lineTo(sx0, sy0 + sh);
    ctx.lineTo(sx0 + tk, sy0 + sh);
    ctx.moveTo(sx0 + sw - tk, sy0 + sh);
    ctx.lineTo(sx0 + sw, sy0 + sh);
    ctx.lineTo(sx0 + sw, sy0 + sh - tk);
    ctx.stroke();

    if (isHover && activeCatalogEntry) {
      ctx.globalAlpha = 0.92;
      drawNodeGlyph(
        ctx,
        activeCatalogEntry.type,
        slot.x,
        slot.y - 6,
        activeCatalogEntry.color,
        timeSec,
        true
      );
      ctx.font = '700 9px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isNonIdeal ? '#FBBF24' : activeCatalogEntry.color;
      ctx.fillText(
        isNonIdeal ? `${activeCatalogEntry.shortName} (Ngoài tầng)` : activeCatalogEntry.shortName,
        slot.x,
        slot.y + 15
      );
    } else {
      ctx.fillStyle = isRecommended
        ? 'rgba(52, 211, 153, 0.85)'
        : slot.col === 4
          ? 'rgba(251, 191, 36, 0.6)'
          : 'rgba(148, 163, 184, 0.42)';
      ctx.font = '600 9.5px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        slot.col === 4 ? '+ DB SHARD' : isRecommended ? '+ CHUẨN' : '+',
        slot.x,
        slot.y
      );
    }
    ctx.restore();
  }

  // Gather per-edge packet traffic mix for dynamic flow brightness + hover telemetry
  const edgePacketsMap = new Map<string, ActivePacketVisual[]>();
  for (const p of packets) {
    const arr = edgePacketsMap.get(p.edgeId);
    if (arr) arr.push(p);
    else edgePacketsMap.set(p.edgeId, [p]);
  }

  // Determine hovered edge in ANY stage when cursor passes close to a wire
  let hoveredEdgeId: string | null = null;
  if (hoverPos) {
    let bestD = 16;
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.fromId);
      const b = nodes.find((n) => n.id === edge.toId);
      if (!a || !b) continue;
      const d = distToCubicBezier(hoverPos.x, hoverPos.y, a.x, a.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        hoveredEdgeId = edge.id;
      }
    }
  }

  // 2. Fiber-Optic Bezier Cables + SFP Terminal Jacks + Hover Telemetry Pill
  for (const edge of edges) {
    const a = nodes.find((n) => n.id === edge.fromId);
    const b = nodes.find((n) => n.id === edge.toId);
    if (!a || !b) continue;

    const { cp1x, cp1y, cp2x, cp2y } = getEdgeControlPoints(a.x, a.y, b.x, b.y);
    const isHoveredEdge = edge.id === hoveredEdgeId;
    const isCutHover = tool === 'cut' && isHoveredEdge && simStage === 'DESIGNING';
    const isRouteHover = tool === 'route' && isHoveredEdge && simStage === 'DESIGNING';
    const isDeadBranch = unusedNodeIds.has(a.id) || unusedNodeIds.has(b.id);

    const edgePkts = edgePacketsMap.get(edge.id) ?? [];
    const load = edgePkts.length;
    const ddosOnWire = edgePkts.filter((p) => p.kind === 'ddos' || p.kind === 'sqli').length;
    const mediaOnWire = edgePkts.filter((p) => p.kind === 'media').length;
    const writeOnWire = edgePkts.filter((p) => p.kind === 'write').length;

    const ruleMeta = getEdgeRouteMeta(edge.routeRule);
    const hasCustomRule = Boolean(edge.routeRule && edge.routeRule !== 'all');

    let wireFlowColor = 'rgba(56, 189, 248, 0.52)';
    if (ddosOnWire > 0) wireFlowColor = '#FB7185';
    else if (mediaOnWire > 0 && mediaOnWire >= writeOnWire) wireFlowColor = '#F472B6';
    else if (writeOnWire > 0) wireFlowColor = '#F59E0B';
    else if (load > 0) wireFlowColor = '#38BDF8';

    ctx.save();
    if (isDeadBranch && !isCutHover && !isRouteHover && !isHoveredEdge) {
      ctx.globalAlpha = 0.42;
    }

    // Outer armored fiber conduit glow
    ctx.strokeStyle = isCutHover
      ? 'rgba(244, 63, 94, 0.5)'
      : isRouteHover || isHoveredEdge
        ? 'rgba(250, 204, 21, 0.36)'
        : ddosOnWire > 0
          ? 'rgba(251, 113, 133, 0.32)'
          : mediaOnWire > 0
            ? 'rgba(244, 114, 182, 0.28)'
            : load > 0
              ? 'rgba(56, 189, 248, 0.28)'
              : 'rgba(12, 22, 42, 0.92)';
    ctx.lineWidth = isHoveredEdge || load >= 3 ? 9 : 6.6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();

    // Inner optical core
    ctx.strokeStyle = isCutHover
      ? '#FB7185'
      : isRouteHover
        ? '#FACC15'
        : tool === 'cut' && simStage === 'DESIGNING'
          ? 'rgba(251, 113, 133, 0.65)'
          : hasCustomRule
            ? ruleMeta.color
            : wireFlowColor;
    ctx.lineWidth = isHoveredEdge ? 3.2 : hasCustomRule || load >= 2 ? 2.7 : 2.1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();

    // Animated laser pulse dashes
    ctx.strokeStyle = isCutHover
      ? '#FFE4E6'
      : hasCustomRule
        ? '#FFFFFF'
        : load > 0
          ? '#E0F2FE'
          : 'rgba(125, 211, 252, 0.72)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 12]);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // SFP / Optical Port Jacks at node boundaries
    const outX = a.x + (b.x >= a.x ? 52 : -52);
    const inX = b.x + (b.x >= a.x ? -52 : 52);
    const jackColor = hasCustomRule ? ruleMeta.color : wireFlowColor;
    for (const [jx, jy] of [
      [outX, a.y],
      [inX, b.y],
    ]) {
      ctx.fillStyle = '#0F1B33';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(jx - 3.5, jy - 5.5, 7, 11, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = jackColor;
      ctx.beginPath();
      ctx.arc(jx, jy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tangent-aligned directional arrowhead at midpoint
    const mid = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, 0.52);
    ctx.save();
    ctx.translate(mid.x, mid.y);
    if (isCutHover) {
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-3.5, -3.5);
      ctx.lineTo(3.5, 3.5);
      ctx.moveTo(3.5, -3.5);
      ctx.lineTo(-3.5, 3.5);
      ctx.stroke();
    } else {
      ctx.rotate(mid.angle);
      ctx.fillStyle = hasCustomRule ? ruleMeta.color : wireFlowColor;
      ctx.strokeStyle = 'rgba(4, 9, 20, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(7.4, 0);
      ctx.lineTo(-4.8, -4.4);
      ctx.lineTo(-2.4, 0);
      ctx.lineTo(-4.8, 4.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // Smart Route Rule label badge OR Hover Telemetry pill on wire
    if (hasCustomRule || isRouteHover || isHoveredEdge) {
      const badgePt = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, isHoveredEdge ? 0.5 : 0.34);
      let tagText = ruleMeta.shortLabel;
      if (isHoveredEdge) {
        if (simStage === 'SIMULATING') {
          const srcProcessed = Math.max(1, a.processedCount + b.processedCount);
          const estRps = Math.max(40, Math.round(load * 160 + (srcProcessed / Math.max(1, elapsedSimSec)) * 22));
          const bDrop = b.droppedCount ?? 0;
          const dropPct = bDrop > 0 ? Math.min(45, Math.round((bDrop / Math.max(1, b.processedCount + bDrop)) * 100)) : 0;
          tagText = `${hasCustomRule ? `${ruleMeta.shortLabel} · ` : ''}${estRps} req/s · ${dropPct}% drop`;
        } else {
          tagText = `Luật: ${ruleMeta.shortLabel}`;
        }
      }
      ctx.font = '700 8.5px ui-monospace, SFMono-Regular, monospace';
      const tw = ctx.measureText(tagText).width + 12;
      const byOffset = isHoveredEdge ? -20 : 0;
      ctx.fillStyle = 'rgba(7, 13, 26, 0.96)';
      ctx.strokeStyle = isRouteHover || isHoveredEdge ? '#FACC15' : ruleMeta.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(badgePt.x - tw / 2, badgePt.y - 8 + byOffset, tw, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isRouteHover || isHoveredEdge ? '#FDE047' : ruleMeta.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, badgePt.x, badgePt.y + 0.5 + byOffset);
    }

    ctx.restore();
  }

  // 3. Live Wire Preview + Valid DAG Target Highlights
  if (tool === 'wire' && wireSourceId && simStage === 'DESIGNING') {
    const src = nodes.find((n) => n.id === wireSourceId);
    if (src && hoverPos) {
      const { cp1x, cp1y, cp2x, cp2y } = getEdgeControlPoints(src.x, src.y, hoverPos.x, hoverPos.y);
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 5]);
      ctx.lineDashOffset = dashOffset;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, hoverPos.x, hoverPos.y);
      ctx.stroke();
      ctx.restore();
    }
    if (src) {
      for (const candidate of nodes) {
        if (candidate.id === src.id) continue;
        const ok = canAddEdge(nodes, edges, src.id, candidate.id).valid;
        if (!ok) continue;
        ctx.save();
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.roundRect(candidate.x - 56, candidate.y - 36, 112, 72, 13);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 4. Moving Traffic Packets along Bezier Curves with Curved Multi-Stop Comet Trails
  for (const p of packets) {
    const a = nodes.find((n) => n.id === p.fromId);
    const b = nodes.find((n) => n.id === p.toId);
    if (!a || !b) continue;
    const t0 = Math.max(0, p.t - 0.085);
    const t1 = Math.max(0, p.t - 0.055);
    const t2 = Math.max(0, p.t - 0.028);
    const p0 = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, t0);
    const p1 = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, t1);
    const p2 = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, t2);
    const pt = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, p.t);
    const meta = PACKET_META[p.kind];

    ctx.save();
    const wakeGrad = ctx.createLinearGradient(p0.x, p0.y, pt.x, pt.y);
    wakeGrad.addColorStop(0, 'rgba(255,255,255,0)');
    wakeGrad.addColorStop(0.6, `${meta.color}88`);
    wakeGrad.addColorStop(1, meta.color);
    ctx.strokeStyle = wakeGrad;
    ctx.lineWidth = p.kind === 'ddos' ? 3.5 : 2.9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    ctx.translate(pt.x, pt.y);
    const auraGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 11.5);
    auraGrad.addColorStop(0, `${meta.color}66`);
    auraGrad.addColorStop(1, `${meta.color}00`);
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = meta.color;
    if (p.kind === 'read') {
      ctx.beginPath();
      ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(-1, -1, 2.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'write') {
      ctx.beginPath();
      ctx.roundRect(-5.4, -5.4, 10.8, 10.8, 2.2);
      ctx.fill();
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(-2.4, -1.8, 4.8, 3.6);
    } else if (p.kind === 'media') {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 3) * k;
        const rx = Math.cos(ang) * 6.4;
        const ry = Math.sin(ang) * 6.4;
        if (k === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FCE7F3';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'ddos') {
      ctx.rotate(timeSec * 6.5);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const r = k % 2 === 0 ? 7.6 : 3;
        const ang = (Math.PI / 4) * k;
        if (k === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFE4E6';
      ctx.beginPath();
      ctx.arc(0, 0, 1.9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F3E8FF';
      ctx.fillRect(-1.2, -3.2, 2.4, 6.4);
    }
    ctx.restore();
  }

  // 5. 3D-Beveled Hardware Server Rack Chassis Modules (104×64)
  for (const node of nodes) {
    const meta = getNodeVisualMeta(node.type);
    const isSelected = selectedNodeId === node.id;
    const isWireSrc = wireSourceId === node.id;
    const isUnused = unusedNodeIds.has(node.id);
    const isDb = isDatabaseSinkType(node.type);
    const localCpu = isDb ? node.localDbCpu ?? dbCpu : 0;

    const tel = getNodeOperationalTelemetry(node, simStage, {
      elapsedSec: elapsedSimSec,
      globalDbCpu: dbCpu,
    });
    const isDegraded = tel.status === 'degraded';
    const isWarning = tel.status === 'warning';

    const w = 104;
    const h = 64;
    const x0 = node.x - w / 2;
    const y0 = node.y - h / 2;

    ctx.save();
    if (isUnused && !isSelected) {
      ctx.globalAlpha = 0.64;
    }

    // Overload / active thermal pulsing halo
    if (isDegraded || isWarning || node.heat > 0.14) {
      const haloAlpha = isDegraded
        ? 0.3 + Math.sin(timeSec * 10) * 0.14
        : isWarning
          ? 0.2
          : node.heat * 0.2;
      ctx.fillStyle = isDegraded
        ? `rgba(239, 68, 68, ${haloAlpha})`
        : isWarning
          ? `rgba(245, 158, 11, ${haloAlpha})`
          : `rgba(56, 189, 248, ${haloAlpha})`;
      ctx.beginPath();
      ctx.roundRect(x0 - 5, y0 - 5, w + 10, h + 10, 14);
      ctx.fill();
    }

    // Deep hardware chassis drop shadow
    ctx.fillStyle = 'rgba(1, 4, 12, 0.85)';
    ctx.beginPath();
    ctx.roundRect(x0 + 2, y0 + 4, w, h, 10);
    ctx.fill();

    // Left & right rack ear flanges
    ctx.fillStyle = '#0D172B';
    ctx.fillRect(x0 - 2.5, y0 + 10, 3, h - 20);
    ctx.fillRect(x0 + w - 0.5, y0 + 10, 3, h - 20);

    // Metallic brushed chassis gradient
    const cardGrad = ctx.createLinearGradient(x0, y0, x0, y0 + h);
    if (simStage === 'DESIGNING') {
      cardGrad.addColorStop(0, '#182744');
      cardGrad.addColorStop(0.55, '#101B32');
      cardGrad.addColorStop(1, '#091020');
    } else if (isDegraded) {
      cardGrad.addColorStop(0, '#361524');
      cardGrad.addColorStop(1, '#150A13');
    } else if (isWarning) {
      cardGrad.addColorStop(0, '#2F2313');
      cardGrad.addColorStop(1, '#121320');
    } else {
      cardGrad.addColorStop(0, '#182A4A');
      cardGrad.addColorStop(0.55, '#101D34');
      cardGrad.addColorStop(1, '#091121');
    }
    ctx.fillStyle = cardGrad;

    ctx.strokeStyle = isWireSrc
      ? '#38BDF8'
      : isSelected
        ? '#FACC15'
        : simStage === 'DESIGNING'
          ? 'rgba(100, 116, 139, 0.72)'
          : tel.borderColor;
    ctx.lineWidth = isSelected || isWireSrc || isDegraded ? 2.3 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // Top 1px specular bevel edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + 9, y0 + 4.5);
    ctx.lineTo(x0 + w - 9, y0 + 4.5);
    ctx.stroke();

    // Top Accent Color Header Strip
    ctx.fillStyle =
      simStage === 'DESIGNING'
        ? `${meta.color}CC`
        : isDegraded
          ? '#EF4444'
          : isWarning
            ? '#F59E0B'
            : meta.color;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, 4, [10, 10, 0, 0]);
    ctx.fill();

    // Corner chassis rivets
    ctx.fillStyle = 'rgba(148, 163, 184, 0.32)';
    ctx.fillRect(x0 + 3, y0 + 6.5, 1.8, 1.8);
    ctx.fillRect(x0 + w - 4.8, y0 + 6.5, 1.8, 1.8);
    ctx.fillRect(x0 + 3, y0 + h - 9.5, 1.8, 1.8);
    ctx.fillRect(x0 + w - 4.8, y0 + h - 9.5, 1.8, 1.8);

    // Subtle right-side ventilation louver bars
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    for (let v = 0; v < 4; v++) {
      ctx.fillRect(x0 + w - 10, y0 + 24 + v * 4, 5.5, 1.8);
    }

    // 3-LED Hardware Status Matrix (PWR, NET, IO) in top-right
    const ledBlink = simStage === 'SIMULATING' && Math.sin(timeSec * 12 + node.x) > 0;
    const ledColors =
      simStage === 'DESIGNING'
        ? ['#64748B', '#475569', '#334155']
        : isDegraded
          ? ['#EF4444', ledBlink ? '#FCA5A5' : '#7F1D1D', '#EF4444']
          : isWarning
            ? ['#10B981', '#F59E0B', ledBlink ? '#FDE68A' : '#78350F']
            : ['#10B981', '#38BDF8', ledBlink ? '#34D399' : '#065F46'];
    for (let li = 0; li < 3; li++) {
      ctx.fillStyle = ledColors[li];
      ctx.beginPath();
      ctx.arc(x0 + w - 17 + li * 4.8, y0 + 11.5, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hardware Tier Pips (v.1 / v.2 / v.3) below LEDs
    if (node.type !== 'ingress') {
      for (let lv = 1; lv <= 3; lv++) {
        const lit = lv <= node.level;
        ctx.fillStyle = lit
          ? node.level === 3
            ? '#FBBF24'
            : '#34D399'
          : 'rgba(148, 163, 184, 0.2)';
        ctx.fillRect(x0 + w - 19 + (lv - 1) * 4.5, y0 + 16.5, 3.2, 2.2);
      }
    }

    // Icon badge backplate + Vector Glyph
    ctx.fillStyle = `${meta.color}18`;
    ctx.beginPath();
    ctx.roundRect(x0 + 5, y0 + 7, 20, 17, 5);
    ctx.fill();
    drawNodeGlyph(
      ctx,
      node.type,
      x0 + 15,
      y0 + 15.5,
      meta.color,
      timeSec,
      simStage === 'SIMULATING'
    );

    // Node Short Name
    ctx.fillStyle = simStage === 'DESIGNING' ? '#E2E8F0' : '#F8FAFC';
    ctx.font = '700 9.5px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.label, x0 + 28, y0 + 15.5, w - 50);

    // Subtle divider line separating header from telemetry LCD screen
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0 + 6, y0 + 25.5);
    ctx.lineTo(x0 + w - 13, y0 + 25.5);
    ctx.stroke();

    // Operational Telemetry Line 1 & Line 2
    ctx.textAlign = 'center';
    ctx.font = '700 8.5px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle =
      simStage === 'DESIGNING'
        ? '#94A3B8'
        : isDegraded
          ? '#FCA5A5'
          : isWarning
            ? '#FDE68A'
            : '#E2E8F0';
    ctx.fillText(tel.line1, node.x - 2, node.y + 4.5, w - 16);

    ctx.font = '600 8px ui-monospace, SFMono-Regular, monospace';
    ctx.fillStyle =
      simStage === 'DESIGNING'
        ? '#64748B'
        : isDb && localCpu >= 85
          ? '#FCA5A5'
          : '#94A3B8';
    ctx.fillText(tel.line2, node.x - 2, node.y + 17.5, w - 16);

    // Bottom Segmented SLA Thermal Bar (10 discrete LED segments)
    const loadPct = isDb
      ? Math.min(1, localCpu / 100)
      : simStage === 'SIMULATING'
        ? Math.min(1, Math.max(0.06, node.heat))
        : 0;
    if (loadPct > 0.04) {
      const segCount = 10;
      const barW = w - 14;
      const segGap = 1.5;
      const segW = (barW - segGap * (segCount - 1)) / segCount;
      const activeSegs = Math.max(1, Math.round(loadPct * segCount));
      for (let sIdx = 0; sIdx < segCount; sIdx++) {
        const sx = x0 + 7 + sIdx * (segW + segGap);
        if (sIdx < activeSegs) {
          ctx.fillStyle =
            sIdx >= 8 ? '#EF4444' : sIdx >= 5 ? '#F59E0B' : '#10B981';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        }
        ctx.fillRect(sx, y0 + h - 5.5, segW, 2.8);
      }
    }

    // Live Alert / Health Pill Badge Above Node during Simulation
    if (simStage === 'SIMULATING' && tel.badgeText) {
      let badgeBg = 'rgba(15, 23, 42, 0.94)';
      let badgeBorder = 'rgba(52, 211, 153, 0.5)';
      let badgeFg = '#6EE7B7';

      if (tel.badgeLevel === 'danger') {
        badgeBg = 'rgba(127, 29, 29, 0.95)';
        badgeBorder = '#F87171';
        badgeFg = '#FEE2E2';
      } else if (tel.badgeLevel === 'warning') {
        badgeBg = 'rgba(120, 53, 15, 0.94)';
        badgeBorder = '#FBBF24';
        badgeFg = '#FEF3C7';
      } else if (node.blockedCount > 0) {
        badgeBg = 'rgba(88, 28, 135, 0.92)';
        badgeBorder = 'rgba(251, 113, 133, 0.65)';
        badgeFg = '#FDA4AF';
      } else if (node.cacheHitCount > 0) {
        badgeBg = 'rgba(8, 51, 68, 0.94)';
        badgeBorder = 'rgba(34, 211, 238, 0.55)';
        badgeFg = '#67E8F9';
      }

      ctx.font = '700 8.5px ui-monospace, SFMono-Regular, monospace';
      const tw = ctx.measureText(tel.badgeText).width + 10;
      const bx = node.x - tw / 2;
      const by = y0 - 15;
      ctx.fillStyle = badgeBg;
      ctx.strokeStyle = badgeBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, tw, 13.5, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = badgeFg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tel.badgeText, node.x, by + 7);
    }

    // SRE Boost Aura
    const sre = activeSreEffects;
    const hasAutoScaleBoost =
      (sre?.autoscale ?? 0) > 0 &&
      (node.type === 'app' || node.type === 'worker' || node.type === 'microservice_auth');
    const hasLockdownBoost =
      (sre?.lockdown ?? 0) > 0 &&
      (node.type === 'waf' || node.type === 'rate_limiter' || node.type === 'ddos_scrubber' || node.type === 'cdn');
    const hasCacheWarmBoost =
      (sre?.cache_warm ?? 0) > 0 &&
      (node.type === 'redis' || node.type === 'varnish' || node.type === 'cdn' || isDb);

    if (hasAutoScaleBoost || hasLockdownBoost || hasCacheWarmBoost) {
      const auraColor = hasAutoScaleBoost
        ? 'rgba(16, 185, 129, 0.62)'
        : hasLockdownBoost
          ? 'rgba(251, 113, 133, 0.62)'
          : 'rgba(34, 211, 238, 0.62)';
      ctx.save();
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.lineDashOffset = -timeSec * 18;
      ctx.beginPath();
      ctx.roundRect(x0 - 6, y0 - 6, w + 12, h + 12, 13);
      ctx.stroke();
      ctx.restore();
    }

    // Highlighted attention ring (Critique jump-to-node)
    if (highlightNodeIds?.has(node.id)) {
      const pulse = 0.55 + Math.sin(timeSec * 7) * 0.35;
      ctx.save();
      ctx.strokeStyle = `rgba(250, 204, 21, ${pulse})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.roundRect(x0 - 7, y0 - 7, w + 14, h + 14, 14);
      ctx.stroke();
      ctx.restore();
    }

    // Selected Node Corner Reticle Brackets
    if (isSelected) {
      const rx = x0 - 4;
      const ry = y0 - 4;
      const rw = w + 8;
      const rh = h + 8;
      const bt = 8;
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx, ry + bt);
      ctx.lineTo(rx, ry);
      ctx.lineTo(rx + bt, ry);
      ctx.moveTo(rx + rw - bt, ry);
      ctx.lineTo(rx + rw, ry);
      ctx.lineTo(rx + rw, ry + bt);
      ctx.moveTo(rx, ry + rh - bt);
      ctx.lineTo(rx, ry + rh);
      ctx.lineTo(rx + bt, ry + rh);
      ctx.moveTo(rx + rw - bt, ry + rh);
      ctx.lineTo(rx + rw, ry + rh);
      ctx.lineTo(rx + rw, ry + rh - bt);
      ctx.stroke();
    }

    // Kafka / Stream Buffer Gauge Bar below node when buffering writes
    if ((node.type === 'queue' || node.type === 'stream_processor') && simStage === 'SIMULATING') {
      const qCount = node.queueBuffer ?? 0;
      const qMax = getQueueMaxBuffer(node.level, node.queueCapacityMode);
      const qRatio = Math.min(1, qCount / qMax);
      ctx.save();
      ctx.fillStyle = 'rgba(11, 19, 32, 0.94)';
      ctx.strokeStyle = qCount >= qMax * 0.85 ? '#EF4444' : 'rgba(249, 115, 22, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x0 + 8, y0 + h + 4, w - 16, 12, 4);
      ctx.fill();
      ctx.stroke();
      if (qRatio > 0) {
        ctx.fillStyle = qCount >= qMax * 0.85 ? '#F87171' : '#F97316';
        ctx.fillRect(x0 + 10, y0 + h + 12.5, (w - 20) * qRatio, 2);
      }
      ctx.fillStyle = '#FED7AA';
      ctx.font = '700 8px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`BUF ${qCount}/${qMax}`, node.x, y0 + h + 9);
      ctx.restore();
    }

    ctx.restore();
  }

  // 6. Dual-Ring Impact Shockwaves
  for (const sw of shockwaves) {
    const progress = 1 - sw.life / Math.max(0.01, sw.maxLife);
    const r = 10 + (sw.maxRadius - 10) * progress;
    const baseAlpha = Math.max(0, (sw.life / sw.maxLife) * 0.78);
    ctx.save();
    ctx.globalAlpha = baseAlpha;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 2.4 * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
    ctx.stroke();
    if (progress > 0.12) {
      ctx.globalAlpha = baseAlpha * 0.48;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, Math.max(6, r * 0.64), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 7. Sparks with crisp specular highlight
  for (const sp of sparks) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, sp.life / Math.max(0.01, sp.maxLife));
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 8. Floating Telemetry Text FX
  for (const fx of fxs) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.life / Math.max(0.1, fx.maxLife * 0.45));
    ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(7, 14, 26, 0.94)';
    ctx.strokeText(fx.text, fx.x, fx.y);
    ctx.fillStyle = fx.color;
    ctx.fillText(fx.text, fx.x, fx.y);
    ctx.restore();
  }

  // 9. Active Production Incident Alert Strip
  if (simStage === 'SIMULATING' && activeIncident) {
    const inc = activeIncident;
    const msg = `CẢNH BÁO SỰ CỐ: ${inc.title} — ${inc.detail}`;
    ctx.save();
    ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
    const textW = Math.min(CANVAS_W - 60, ctx.measureText(msg).width + 24);
    const bx = CANVAS_W / 2 - textW / 2;
    const by = CANVAS_H - 26;
    ctx.fillStyle = 'rgba(127, 29, 29, 0.94)';
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(bx, by, textW, 20, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEE2E2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(msg, CANVAS_W / 2, by + 10, textW - 16);
    ctx.restore();
  }
}
