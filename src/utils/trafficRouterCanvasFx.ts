import {
  canAddEdge,
  CANVAS_H,
  CANVAS_W,
  computeBezierPointAndTangent,
  distToCubicBezier,
  getEdgeControlPoints,
  getNodeCatalogEntry,
  PACKET_META,
  RACK_SLOTS,
  type InfraEdge,
  type InfraNode,
  type InfraNodeType,
  type PacketKind,
  type PlaceableNodeType,
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
  tool: PlaceableNodeType | 'wire' | 'cut';
  selectedNodeId: string | null;
  wireSourceId: string | null;
  hoverPos: { x: number; y: number } | null;
  dashOffset: number;
  dbCpu: number;
  unusedNodeIds: ReadonlySet<string>;
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
  timeSec: number
) {
  // Deep architectural slate backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  bgGrad.addColorStop(0, '#070E1A');
  bgGrad.addColorStop(0.55, '#0B1424');
  bgGrad.addColorStop(1, '#08101E');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 6 tier columns with subtle alternating architectural surface tint
  const zones = [
    { x0: 14, x1: 144, cx: 76, label: 'USERS · INGRESS' },
    { x0: 152, x1: 298, cx: 225, label: 'EDGE · BẢO VỆ' },
    { x0: 306, x1: 464, cx: 385, label: 'CACHE · LB' },
    { x0: 472, x1: 618, cx: 545, label: 'COMPUTE · MQ' },
    { x0: 626, x1: 774, cx: 705, label: 'REPLICA · S3' },
    { x0: 782, x1: 906, cx: 844, label: 'DATABASE' },
  ];

  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    ctx.fillStyle = i % 2 === 0 ? 'rgba(15, 28, 48, 0.34)' : 'rgba(12, 22, 39, 0.18)';
    ctx.beginPath();
    ctx.roundRect(z.x0, 34, z.x1 - z.x0, CANVAS_H - 48, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Minor & Major drafting grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
  ctx.lineWidth = 1;
  for (let gx = 20; gx < CANVAS_W; gx += 20) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CANVAS_H);
    ctx.stroke();
  }
  for (let gy = 20; gy < CANVAS_H; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CANVAS_W, gy);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.075)';
  for (let gx = 80; gx < CANVAS_W; gx += 80) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CANVAS_H);
    ctx.stroke();
  }
  for (let gy = 80; gy < CANVAS_H; gy += 80) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CANVAS_W, gy);
    ctx.stroke();
  }

  // Column tier titles
  ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const z of zones) {
    ctx.fillStyle =
      z.cx === 844 && dbCpu >= 85
        ? 'rgba(252, 165, 165, 0.95)'
        : 'rgba(148, 163, 184, 0.78)';
    ctx.fillText(z.label, z.cx, 20);
  }

  // Subtle thermal alarm border pulse if DB CPU >= 86% during simulation
  if (simStage === 'SIMULATING' && dbCpu >= 86) {
    const pulse = 0.28 + Math.sin(timeSec * 8) * 0.14;
    ctx.save();
    ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
    ctx.restore();
  }
}

function drawNodeGlyph(
  ctx: CanvasRenderingContext2D,
  type: InfraNodeType,
  cx: number,
  cy: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (type) {
    case 'ingress': {
      // Emitter ring + incoming globe/user arcs
      ctx.beginPath();
      ctx.arc(-2, 0, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(1, 0, 9.5, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-2, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'waf': {
      // Firewall shield with central check/lock slit
      ctx.beginPath();
      ctx.moveTo(0, -8.5);
      ctx.lineTo(7.5, -5.2);
      ctx.lineTo(6.5, 2.5);
      ctx.quadraticCurveTo(0, 8.8, 0, 8.8);
      ctx.quadraticCurveTo(0, 8.8, -6.5, 2.5);
      ctx.lineTo(-7.5, -5.2);
      ctx.closePath();
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
      // Throttle gauge dial + needle
      ctx.beginPath();
      ctx.arc(0, 2, 7.8, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 3.5);
      ctx.lineTo(5.2, -3.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 3.5, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cdn': {
      // Edge distribution triangle mesh
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
        ctx.arc(px, py, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'load_balancer': {
      // 1-to-3 fan-out splitter
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
      ctx.arc(-2, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'redis': {
      // In-memory fast layers + lightning accent
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, -3.5);
      ctx.lineTo(0, 1);
      ctx.lineTo(-8, -3.5);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-7.5, 2);
      ctx.lineTo(0, 6.2);
      ctx.lineTo(7.5, 2);
      ctx.stroke();
      break;
    }
    case 'app': {
      // Server rack chassis blades
      ctx.strokeRect(-7.5, -7, 15, 5.5);
      ctx.strokeRect(-7.5, 1.5, 15, 5.5);
      ctx.fillRect(-4.5, -5, 2, 1.8);
      ctx.fillRect(-4.5, 3.5, 2, 1.8);
      break;
    }
    case 'queue': {
      // Message stream slots
      ctx.beginPath();
      ctx.moveTo(-8.5, -5.5);
      ctx.lineTo(8.5, -5.5);
      ctx.moveTo(-8.5, 5.5);
      ctx.lineTo(8.5, 5.5);
      ctx.stroke();
      ctx.fillRect(-6.5, -2.5, 3.2, 5);
      ctx.fillRect(-1.5, -2.5, 3.2, 5);
      ctx.fillRect(3.5, -2.5, 3.2, 5);
      break;
    }
    case 'worker': {
      // Cog gear ring + center spindle
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
    case 'read_replica': {
      // Twin synced DB cylinders
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
      // Storage cube bucket
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
    case 'database': {
      // Master 3-platter cylinder
      ctx.beginPath();
      ctx.ellipse(0, -6, 7.5, 2.6, 0, 0, Math.PI * 2);
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
    timeSec,
  } = opts;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawBlueprintBackground(ctx, simStage, dbCpu, timeSec);

  // 1. Empty Rack Slots + Ghost Blueprint Preview
  for (const slot of RACK_SLOTS) {
    const isOccupied = nodes.some((n) => n.slotId === slot.id);
    if (isOccupied) continue;
    const isHover =
      simStage === 'DESIGNING' &&
      hoverPos !== null &&
      Math.hypot(hoverPos.x - slot.x, hoverPos.y - slot.y) <= 34;

    ctx.save();
    ctx.fillStyle = isHover ? 'rgba(56, 189, 248, 0.14)' : 'rgba(11, 20, 36, 0.62)';
    ctx.strokeStyle = isHover ? '#38BDF8' : 'rgba(100, 116, 139, 0.32)';
    ctx.lineWidth = isHover ? 1.8 : 1.1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.roundRect(slot.x - 31, slot.y - 25, 62, 50, 9);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner mount ticks
    ctx.strokeStyle = isHover ? '#7DD3FC' : 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.4;
    const x0 = slot.x - 31;
    const y0 = slot.y - 25;
    const w = 62;
    const h = 50;
    const tk = 6;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + tk);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + tk, y0);
    ctx.moveTo(x0 + w - tk, y0);
    ctx.lineTo(x0 + w, y0);
    ctx.lineTo(x0 + w, y0 + tk);
    ctx.moveTo(x0, y0 + h - tk);
    ctx.lineTo(x0, y0 + h);
    ctx.lineTo(x0 + tk, y0 + h);
    ctx.moveTo(x0 + w - tk, y0 + h);
    ctx.lineTo(x0 + w, y0 + h);
    ctx.lineTo(x0 + w, y0 + h - tk);
    ctx.stroke();

    if (isHover && tool !== 'wire' && tool !== 'cut') {
      const ghostMeta = getNodeVisualMeta(tool);
      ctx.globalAlpha = 0.72;
      drawNodeGlyph(ctx, tool, slot.x, slot.y - 4, ghostMeta.color);
      ctx.font = '700 9px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ghostMeta.color;
      ctx.fillText(ghostMeta.label, slot.x, slot.y + 15);
    } else {
      ctx.fillStyle = isHover ? '#38BDF8' : 'rgba(148, 163, 184, 0.42)';
      ctx.font = '600 13px ui-monospace, SFMono-Regular, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+', slot.x, slot.y);
    }
    ctx.restore();
  }

  // Count active packets per edge for dynamic cable brightness
  const edgeLoadCount = new Map<string, number>();
  for (const p of packets) {
    edgeLoadCount.set(p.edgeId, (edgeLoadCount.get(p.edgeId) ?? 0) + 1);
  }

  // Determine hovered edge in Cut mode
  let hoveredCutEdgeId: string | null = null;
  if (tool === 'cut' && simStage === 'DESIGNING' && hoverPos) {
    let bestD = 14;
    for (const edge of edges) {
      const a = nodes.find((n) => n.id === edge.fromId);
      const b = nodes.find((n) => n.id === edge.toId);
      if (!a || !b) continue;
      const d = distToCubicBezier(hoverPos.x, hoverPos.y, a.x, a.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        hoveredCutEdgeId = edge.id;
      }
    }
  }

  // 2. Cubic Bezier Network Cables
  for (const edge of edges) {
    const a = nodes.find((n) => n.id === edge.fromId);
    const b = nodes.find((n) => n.id === edge.toId);
    if (!a || !b) continue;

    const { cp1x, cp1y, cp2x, cp2y } = getEdgeControlPoints(a.x, a.y, b.x, b.y);
    const isCutHover = edge.id === hoveredCutEdgeId;
    const isDeadBranch = unusedNodeIds.has(a.id) || unusedNodeIds.has(b.id);
    const load = edgeLoadCount.get(edge.id) ?? 0;

    ctx.save();
    if (isDeadBranch && !isCutHover) {
      ctx.globalAlpha = 0.45;
    }

    // Outer cable sheath
    ctx.strokeStyle = isCutHover
      ? 'rgba(244, 63, 94, 0.42)'
      : load > 0
        ? 'rgba(56, 189, 248, 0.25)'
        : 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = isCutHover ? 8 : 6.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();

    // Inner cable core
    ctx.strokeStyle = isCutHover
      ? '#FB7185'
      : tool === 'cut'
        ? 'rgba(251, 113, 133, 0.65)'
        : load > 0
          ? 'rgba(56, 189, 248, 0.72)'
          : 'rgba(56, 189, 248, 0.36)';
    ctx.lineWidth = isCutHover ? 3 : 2.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();

    // Animated signal pulse dashes
    ctx.strokeStyle = isCutHover
      ? '#FFE4E6'
      : load > 0
        ? 'rgba(186, 230, 253, 0.95)'
        : 'rgba(125, 211, 252, 0.78)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([6, 12]);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tangent-aligned directional arrowhead at midpoint
    const mid = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, 0.52);
    ctx.translate(mid.x, mid.y);
    if (isCutHover) {
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
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
      ctx.fillStyle = load > 0 ? '#7DD3FC' : '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(6.5, 0);
      ctx.lineTo(-4.5, -4);
      ctx.lineTo(-2.5, 0);
      ctx.lineTo(-4.5, 4);
      ctx.closePath();
      ctx.fill();
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
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.78)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.roundRect(candidate.x - 40, candidate.y - 32, 80, 64, 13);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 4. Moving Traffic Packets along Bezier Curves with Wake Trails
  for (const p of packets) {
    const a = nodes.find((n) => n.id === p.fromId);
    const b = nodes.find((n) => n.id === p.toId);
    if (!a || !b) continue;
    const pt = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, p.t);
    const tail = computeBezierPointAndTangent(a.x, a.y, b.x, b.y, Math.max(0, p.t - 0.065));
    const meta = PACKET_META[p.kind];

    ctx.save();
    // Motion wake trail
    const wakeGrad = ctx.createLinearGradient(tail.x, tail.y, pt.x, pt.y);
    wakeGrad.addColorStop(0, 'rgba(255,255,255,0)');
    wakeGrad.addColorStop(1, meta.color);
    ctx.strokeStyle = wakeGrad;
    ctx.lineWidth = p.kind === 'ddos' ? 3.2 : 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    ctx.translate(pt.x, pt.y);

    // Outer halo
    ctx.fillStyle = meta.color;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    if (p.kind === 'read') {
      ctx.beginPath();
      ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'write') {
      ctx.fillRect(-5.5, -5.5, 11, 11);
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(-2.1, -2.1, 4.2, 4.2);
    } else if (p.kind === 'media') {
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
      ctx.fillStyle = '#FCE7F3';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'ddos') {
      ctx.rotate(timeSec * 6);
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const r = k % 2 === 0 ? 7.5 : 3.2;
        const ang = (Math.PI / 4) * k;
        if (k === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFE4E6';
      ctx.beginPath();
      ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // SQLi hazard diamond
      ctx.beginPath();
      ctx.moveTo(0, -7.2);
      ctx.lineTo(7.2, 0);
      ctx.lineTo(0, 7.2);
      ctx.lineTo(-7.2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#F3E8FF';
      ctx.fillRect(-1.2, -3.2, 2.4, 6.4);
    }
    ctx.restore();
  }

  // 5. Infrastructure Nodes (Brushed Metallic Chassis + Custom Schematic Vectors)
  for (const node of nodes) {
    const meta = getNodeVisualMeta(node.type);
    const isSelected = selectedNodeId === node.id;
    const isWireSrc = wireSourceId === node.id;
    const isUnused = unusedNodeIds.has(node.id);
    const isOverheated =
      node.type === 'database' ? dbCpu >= 82 : node.heat >= 0.72;

    const w = 72;
    const h = 56;
    const x0 = node.x - w / 2;
    const y0 = node.y - h / 2;

    ctx.save();
    if (isUnused && !isSelected) {
      ctx.globalAlpha = 0.68;
    }

    // Heat / Thermal Glow Halo
    if (isOverheated || node.heat > 0.12) {
      const haloAlpha = isOverheated
        ? 0.28 + Math.sin(timeSec * 9) * 0.12
        : node.heat * 0.22;
      ctx.fillStyle = isOverheated
        ? `rgba(239, 68, 68, ${haloAlpha})`
        : `rgba(56, 189, 248, ${haloAlpha})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 44, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chassis Shadow & Metallic Body
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.beginPath();
    ctx.roundRect(x0 + 2, y0 + 3, w, h, 10);
    ctx.fill();

    const cardGrad = ctx.createLinearGradient(x0, y0, x0, y0 + h);
    cardGrad.addColorStop(0, '#16243E');
    cardGrad.addColorStop(1, '#0C1526');
    ctx.fillStyle = cardGrad;
    ctx.strokeStyle = isWireSrc
      ? '#38BDF8'
      : isSelected
        ? '#FACC15'
        : isOverheated
          ? '#F87171'
          : meta.color;
    ctx.lineWidth = isSelected || isWireSrc ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, h, 10);
    ctx.fill();
    ctx.stroke();

    // Top Accent Header Strip
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.roundRect(x0, y0, w, 5, [10, 10, 0, 0]);
    ctx.fill();

    // Custom Vector Glyph (Upper Center)
    drawNodeGlyph(ctx, node.type, node.x, node.y - 9, meta.color);

    // Node Short Name
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.label, node.x, node.y + 9);

    // Sub-label / Live Status
    ctx.font = '700 8.5px ui-monospace, SFMono-Regular, monospace';
    if (node.type === 'database') {
      ctx.fillStyle = dbCpu >= 85 ? '#FCA5A5' : dbCpu >= 60 ? '#FDE68A' : '#FBBF24';
      ctx.fillText(`CPU ${Math.round(dbCpu)}%`, node.x, node.y + 20);
    } else if (!node.fixed) {
      ctx.fillStyle = node.level === 2 ? '#34D399' : '#94A3B8';
      ctx.fillText(node.level === 2 ? 'LV.2 ★' : 'LV.1', node.x, node.y + 20);
    } else {
      ctx.fillStyle = '#7DD3FC';
      ctx.fillText('INGRESS', node.x, node.y + 20);
    }

    // Thermal / Load progress bar along bottom edge
    const loadPct =
      node.type === 'database'
        ? Math.min(1, dbCpu / 100)
        : Math.min(1, node.heat);
    if (loadPct > 0.04) {
      const barW = w - 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(x0 + 6, y0 + h - 4, barW, 2.5);
      ctx.fillStyle =
        loadPct >= 0.78 ? '#EF4444' : loadPct >= 0.48 ? '#F59E0B' : '#38BDF8';
      ctx.fillRect(x0 + 6, y0 + h - 4, barW * loadPct, 2.5);
    }

    // Live micro-telemetry badge above node during simulation
    if (simStage === 'SIMULATING' && node.type !== 'ingress') {
      let badgeText = '';
      let badgeBg = 'rgba(15, 23, 42, 0.92)';
      let badgeFg = '#CBD5E1';

      if (node.blockedCount > 0) {
        badgeText = `BLK ${node.blockedCount}`;
        badgeBg = 'rgba(136, 19, 55, 0.9)';
        badgeFg = '#FDA4AF';
      } else if (node.cacheHitCount > 0) {
        badgeText = `HIT ${node.cacheHitCount}`;
        badgeBg = 'rgba(8, 51, 68, 0.92)';
        badgeFg = '#67E8F9';
      } else if (node.processedCount > 0) {
        badgeText = `${node.processedCount}`;
      }

      if (badgeText) {
        ctx.font = '700 8.5px ui-monospace, SFMono-Regular, monospace';
        const tw = ctx.measureText(badgeText).width + 10;
        const bx = node.x - tw / 2;
        const by = y0 - 15;
        ctx.fillStyle = badgeBg;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, 13, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = badgeFg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, node.x, by + 6.5);
      }
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

    ctx.restore();
  }

  // 6. Shockwave Rings
  for (const sw of shockwaves) {
    const progress = 1 - sw.life / Math.max(0.01, sw.maxLife);
    const r = 10 + (sw.maxRadius - 10) * progress;
    ctx.save();
    ctx.globalAlpha = Math.max(0, (sw.life / sw.maxLife) * 0.72);
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = 2.2 * (1 - progress * 0.5);
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 7. Sparks
  for (const sp of sparks) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, sp.life / Math.max(0.01, sp.maxLife));
    ctx.fillStyle = sp.color;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 8. Floating Combat / Telemetry Text FX (outlined for crisp legibility)
  for (const fx of fxs) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.life / Math.max(0.1, fx.maxLife * 0.45));
    ctx.font = '700 10px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(7, 14, 26, 0.92)';
    ctx.strokeText(fx.text, fx.x, fx.y);
    ctx.fillStyle = fx.color;
    ctx.fillText(fx.text, fx.x, fx.y);
    ctx.restore();
  }
}
