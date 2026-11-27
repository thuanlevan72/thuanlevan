import {
  BOARD_SIZE,
  BoardCoord,
  ChessBoard,
  ChessMove,
  ChessPiece,
  ChessPieceType,
  ChessSide,
  FILE_LABELS,
} from './chessEngine.ts';

export type ChessBoardThemeId = 'wood' | 'marble' | 'emerald';

export interface ChessBoardThemePalette {
  id: ChessBoardThemeId;
  label: string;
  outerFrame: string;
  outerFrameLight: string;
  frameInlay: string;
  coordText: string;
  lightSquare: string;
  lightSquareAccent: string;
  darkSquare: string;
  darkSquareAccent: string;
  highlightSelected: string;
  highlightLastMove: string;
  highlightHint: string;
  legalDot: string;
  captureRing: string;
  checkGlow: string;
}

export const CHESS_BOARD_THEMES: Record<ChessBoardThemeId, ChessBoardThemePalette> = {
  wood: {
    id: 'wood',
    label: 'Gỗ Sồi',
    outerFrame: '#382012',
    outerFrameLight: '#5C351E',
    frameInlay: '#D9AE62',
    coordText: '#EAD9B9',
    lightSquare: '#F2DCBA',
    lightSquareAccent: '#E7CCA2',
    darkSquare: '#B4845A',
    darkSquareAccent: '#9F7049',
    highlightSelected: '#D97706',
    highlightLastMove: 'rgba(245, 158, 11, 0.34)',
    highlightHint: '#0284C7',
    legalDot: 'rgba(15, 23, 42, 0.36)',
    captureRing: 'rgba(220, 38, 38, 0.85)',
    checkGlow: '#DC2626',
  },
  marble: {
    id: 'marble',
    label: 'Cẩm Thạch',
    outerFrame: '#161E2B',
    outerFrameLight: '#2B3A4F',
    frameInlay: '#94A3B8',
    coordText: '#CBD5E1',
    lightSquare: '#EAF0F6',
    lightSquareAccent: '#D8E2EC',
    darkSquare: '#5C6F88',
    darkSquareAccent: '#485A72',
    highlightSelected: '#0284C7',
    highlightLastMove: 'rgba(56, 189, 248, 0.3)',
    highlightHint: '#D97706',
    legalDot: 'rgba(15, 23, 42, 0.36)',
    captureRing: 'rgba(239, 68, 68, 0.88)',
    checkGlow: '#EF4444',
  },
  emerald: {
    id: 'emerald',
    label: 'Ngọc Lục Bảo',
    outerFrame: '#0A251B',
    outerFrameLight: '#174937',
    frameInlay: '#DFC173',
    coordText: '#DCEBE1',
    lightSquare: '#F0F1DA',
    lightSquareAccent: '#E2E4C4',
    darkSquare: '#467856',
    darkSquareAccent: '#366144',
    highlightSelected: '#EAB308',
    highlightLastMove: 'rgba(250, 204, 21, 0.34)',
    highlightHint: '#0EA5E9',
    legalDot: 'rgba(15, 23, 42, 0.34)',
    captureRing: 'rgba(220, 38, 38, 0.85)',
    checkGlow: '#EF4444',
  },
};

export interface ChessParticle {
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

export interface ChessShockwave {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  color: string;
}

export interface ChessSlideAnim {
  piece: ChessPiece;
  from: BoardCoord;
  to: BoardCoord;
  progress: number;
}

export interface ChessDragRenderState {
  active: boolean;
  hasMoved: boolean;
  from: BoardCoord | null;
  piece: ChessPiece | null;
  canvasX: number;
  canvasY: number;
}

export interface ChessBoardMetrics {
  width: number;
  height: number;
  pad: number;
  cellSize: number;
}

export function drawStauntonPiece(
  ctx: CanvasRenderingContext2D,
  type: ChessPieceType,
  side: ChessSide,
  cx: number,
  cy: number,
  size: number,
  options?: { isLifted?: boolean }
): void {
  const isWhite = side === 'white';
  const stroke = isWhite ? '#1E293B' : '#090D14';
  const detailStroke = isWhite ? '#475569' : '#CBD5E1';
  const s = size; // Normalized unit width/height (~cellSize * 0.84)
  const lw = Math.max(1.3, s * 0.042);

  ctx.save();
  ctx.translate(cx, cy);

  // Ground contact shadow beneath pedestal
  if (!options?.isLifted) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.4, s * 0.28, s * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sculptural ivory / obsidian directional gradient
  const bodyGrad = ctx.createLinearGradient(-s * 0.32, -s * 0.36, s * 0.32, s * 0.4);
  if (isWhite) {
    bodyGrad.addColorStop(0, '#FFFDF7');
    bodyGrad.addColorStop(0.55, '#F5EBDA');
    bodyGrad.addColorStop(1, '#D8C29F');
  } else {
    bodyGrad.addColorStop(0, '#445063');
    bodyGrad.addColorStop(0.45, '#1E2532');
    bodyGrad.addColorStop(1, '#0C1018');
  }

  if (options?.isLifted) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 8;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
  }

  const drawBody = () => {
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Inner specular rim highlight for sculptural depth on both ivory and obsidian pieces
    ctx.save();
    ctx.strokeStyle = isWhite ? 'rgba(255, 255, 255, 0.8)' : 'rgba(226, 232, 240, 0.34)';
    ctx.lineWidth = Math.max(0.85, lw * 0.52);
    ctx.stroke();
    ctx.restore();
  };

  if (type === 'P') {
    // Pawn: spherical crown + dual collar + waist + stepped pedestal
    ctx.beginPath();
    ctx.moveTo(-s * 0.27, s * 0.38);
    ctx.lineTo(s * 0.27, s * 0.38);
    ctx.quadraticCurveTo(s * 0.28, s * 0.28, s * 0.16, s * 0.24);
    ctx.quadraticCurveTo(s * 0.1, s * 0.05, s * 0.08, -s * 0.04);
    ctx.lineTo(s * 0.15, -s * 0.08);
    ctx.lineTo(s * 0.09, -s * 0.13);
    ctx.arc(0, -s * 0.24, s * 0.135, 0.42, Math.PI - 0.42, true);
    ctx.lineTo(-s * 0.15, -s * 0.08);
    ctx.lineTo(-s * 0.08, -s * 0.04);
    ctx.quadraticCurveTo(-s * 0.1, s * 0.05, -s * 0.16, s * 0.24);
    ctx.quadraticCurveTo(-s * 0.28, s * 0.28, -s * 0.27, s * 0.38);
    ctx.closePath();
    drawBody();

    // Specular highlight dot on Pawn sphere
    ctx.fillStyle = isWhite ? 'rgba(255,255,255,0.9)' : 'rgba(226,232,240,0.42)';
    ctx.beginPath();
    ctx.arc(-s * 0.045, -s * 0.28, s * 0.036, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1, lw * 0.72);
    ctx.beginPath();
    ctx.moveTo(-s * 0.21, s * 0.29);
    ctx.lineTo(s * 0.21, s * 0.29);
    ctx.moveTo(-s * 0.12, -s * 0.07);
    ctx.lineTo(s * 0.12, -s * 0.07);
    ctx.stroke();
  } else if (type === 'R') {
    // Rook: crenellated battlements + masonry ring + tapered tower + wide pedestal
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.38);
    ctx.lineTo(s * 0.3, s * 0.38);
    ctx.lineTo(s * 0.27, s * 0.25);
    ctx.lineTo(s * 0.2, s * 0.2);
    ctx.lineTo(s * 0.18, -s * 0.13);
    ctx.lineTo(s * 0.25, -s * 0.2);
    ctx.lineTo(s * 0.25, -s * 0.36);
    ctx.lineTo(s * 0.14, -s * 0.36);
    ctx.lineTo(s * 0.14, -s * 0.27);
    ctx.lineTo(s * 0.055, -s * 0.27);
    ctx.lineTo(s * 0.055, -s * 0.36);
    ctx.lineTo(-s * 0.055, -s * 0.36);
    ctx.lineTo(-s * 0.055, -s * 0.27);
    ctx.lineTo(-s * 0.14, -s * 0.27);
    ctx.lineTo(-s * 0.14, -s * 0.36);
    ctx.lineTo(-s * 0.25, -s * 0.36);
    ctx.lineTo(-s * 0.25, -s * 0.2);
    ctx.lineTo(-s * 0.18, -s * 0.13);
    ctx.lineTo(-s * 0.2, s * 0.2);
    ctx.lineTo(-s * 0.27, s * 0.25);
    ctx.closePath();
    drawBody();

    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1, lw * 0.72);
    ctx.beginPath();
    ctx.moveTo(-s * 0.18, -s * 0.13);
    ctx.lineTo(s * 0.18, -s * 0.13);
    ctx.moveTo(-s * 0.16, s * 0.03);
    ctx.lineTo(s * 0.16, s * 0.03);
    ctx.moveTo(-s * 0.21, s * 0.21);
    ctx.lineTo(s * 0.21, s * 0.21);
    ctx.moveTo(-s * 0.25, s * 0.29);
    ctx.lineTo(s * 0.25, s * 0.29);
    ctx.stroke();
  } else if (type === 'N') {
    // Knight: sculpted stallion head + arched mane + nostril + double pedestal
    ctx.beginPath();
    ctx.moveTo(-s * 0.29, s * 0.38);
    ctx.lineTo(s * 0.29, s * 0.38);
    ctx.quadraticCurveTo(s * 0.3, s * 0.25, s * 0.22, s * 0.21);
    ctx.quadraticCurveTo(s * 0.28, -s * 0.08, s * 0.14, -s * 0.27);
    ctx.lineTo(s * 0.08, -s * 0.39);
    ctx.lineTo(-s * 0.01, -s * 0.31);
    ctx.lineTo(-s * 0.08, -s * 0.38);
    ctx.lineTo(-s * 0.12, -s * 0.26);
    ctx.quadraticCurveTo(-s * 0.24, -s * 0.16, -s * 0.31, -s * 0.01);
    ctx.quadraticCurveTo(-s * 0.33, s * 0.07, -s * 0.22, s * 0.1);
    ctx.quadraticCurveTo(-s * 0.14, s * 0.08, -s * 0.06, s * 0.01);
    ctx.quadraticCurveTo(-s * 0.02, s * 0.12, -s * 0.18, s * 0.22);
    ctx.quadraticCurveTo(-s * 0.29, s * 0.26, -s * 0.29, s * 0.38);
    ctx.closePath();
    drawBody();

    // Eye & nostril
    ctx.fillStyle = detailStroke;
    ctx.beginPath();
    ctx.arc(-s * 0.13, -s * 0.14, Math.max(1.4, s * 0.032), 0, Math.PI * 2);
    ctx.arc(-s * 0.25, s * 0.02, Math.max(1.1, s * 0.022), 0, Math.PI * 2);
    ctx.fill();

    // Mane ridge & base ring
    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1, lw * 0.7);
    ctx.beginPath();
    ctx.moveTo(s * 0.12, -s * 0.2);
    ctx.quadraticCurveTo(s * 0.2, -s * 0.02, s * 0.15, s * 0.18);
    ctx.moveTo(-s * 0.22, s * 0.28);
    ctx.lineTo(s * 0.22, s * 0.28);
    ctx.stroke();
  } else if (type === 'B') {
    // Bishop: finial orb + pointed mitre with diagonal cleft + collar + base
    ctx.beginPath();
    ctx.moveTo(-s * 0.29, s * 0.38);
    ctx.lineTo(s * 0.29, s * 0.38);
    ctx.quadraticCurveTo(s * 0.29, s * 0.27, s * 0.17, s * 0.23);
    ctx.lineTo(s * 0.12, s * 0.14);
    ctx.quadraticCurveTo(s * 0.22, -s * 0.03, s * 0.11, -s * 0.23);
    ctx.quadraticCurveTo(0, -s * 0.34, 0, -s * 0.34);
    ctx.quadraticCurveTo(-s * 0.11, -s * 0.23, -s * 0.11, -s * 0.23);
    ctx.quadraticCurveTo(-s * 0.22, -s * 0.03, -s * 0.12, s * 0.14);
    ctx.lineTo(-s * 0.17, s * 0.23);
    ctx.quadraticCurveTo(-s * 0.29, s * 0.27, -s * 0.29, s * 0.38);
    ctx.closePath();
    drawBody();

    // Top finial orb
    ctx.beginPath();
    ctx.arc(0, -s * 0.38, s * 0.055, 0, Math.PI * 2);
    drawBody();

    // Mitre cross + collar detail
    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1.1, lw * 0.78);
    ctx.beginPath();
    ctx.moveTo(-s * 0.07, -s * 0.13);
    ctx.lineTo(s * 0.07, -s * 0.13);
    ctx.moveTo(0, -s * 0.2);
    ctx.lineTo(0, -s * 0.05);
    ctx.moveTo(-s * 0.15, s * 0.22);
    ctx.lineTo(s * 0.15, s * 0.22);
    ctx.moveTo(-s * 0.22, s * 0.3);
    ctx.lineTo(s * 0.22, s * 0.3);
    ctx.stroke();
  } else if (type === 'Q') {
    // Queen: 5-point radial coronet + gleaming pearls + fluted gown + base
    ctx.beginPath();
    ctx.moveTo(-s * 0.31, s * 0.38);
    ctx.lineTo(s * 0.31, s * 0.38);
    ctx.lineTo(s * 0.25, s * 0.23);
    ctx.lineTo(s * 0.34, -s * 0.17);
    ctx.lineTo(s * 0.16, -s * 0.01);
    ctx.lineTo(s * 0.18, -s * 0.27);
    ctx.lineTo(s * 0.07, -s * 0.04);
    ctx.lineTo(0, -s * 0.32);
    ctx.lineTo(-s * 0.07, -s * 0.04);
    ctx.lineTo(-s * 0.18, -s * 0.27);
    ctx.lineTo(-s * 0.16, -s * 0.01);
    ctx.lineTo(-s * 0.34, -s * 0.17);
    ctx.lineTo(-s * 0.25, s * 0.23);
    ctx.closePath();
    drawBody();

    const tipCoords: [number, number][] = [
      [-s * 0.34, -s * 0.2],
      [-s * 0.18, -s * 0.3],
      [0, -s * 0.35],
      [s * 0.18, -s * 0.3],
      [s * 0.34, -s * 0.2],
    ];
    for (const [px, py] of tipCoords) {
      ctx.beginPath();
      ctx.arc(px, py, s * 0.043, 0, Math.PI * 2);
      drawBody();
    }

    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1, lw * 0.72);
    ctx.beginPath();
    ctx.moveTo(-s * 0.24, s * 0.22);
    ctx.lineTo(s * 0.24, s * 0.22);
    ctx.moveTo(-s * 0.26, s * 0.3);
    ctx.lineTo(s * 0.26, s * 0.3);
    ctx.stroke();
  } else {
    // King: sovereign cross + wide royal crown lobes + central crest + base
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(2.1, lw * 1.48);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.43);
    ctx.lineTo(0, -s * 0.2);
    ctx.moveTo(-s * 0.1, -s * 0.34);
    ctx.lineTo(s * 0.1, -s * 0.34);
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = isWhite ? '#F5EBDA' : '#E2E8F0';
    ctx.lineWidth = Math.max(1, lw * 0.65);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.lineTo(0, -s * 0.22);
    ctx.moveTo(-s * 0.09, -s * 0.34);
    ctx.lineTo(s * 0.09, -s * 0.34);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(-s * 0.31, s * 0.38);
    ctx.lineTo(s * 0.31, s * 0.38);
    ctx.lineTo(s * 0.25, s * 0.21);
    ctx.quadraticCurveTo(s * 0.38, -s * 0.03, s * 0.22, -s * 0.17);
    ctx.quadraticCurveTo(s * 0.09, -s * 0.25, 0, -s * 0.14);
    ctx.quadraticCurveTo(-s * 0.09, -s * 0.25, -s * 0.22, -s * 0.17);
    ctx.quadraticCurveTo(-s * 0.38, -s * 0.03, -s * 0.25, s * 0.21);
    ctx.closePath();
    drawBody();

    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1, lw * 0.72);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.14);
    ctx.lineTo(0, s * 0.14);
    ctx.moveTo(-s * 0.24, s * 0.2);
    ctx.lineTo(s * 0.24, s * 0.2);
    ctx.moveTo(-s * 0.27, s * 0.29);
    ctx.lineTo(s * 0.27, s * 0.29);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSquareTexture(
  ctx: CanvasRenderingContext2D,
  themeId: ChessBoardThemeId,
  x: number,
  y: number,
  cellSize: number,
  isLight: boolean,
  boardRow: number,
  boardCol: number,
  palette: ChessBoardThemePalette
): void {
  const grad = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
  grad.addColorStop(0, isLight ? palette.lightSquare : palette.darkSquare);
  grad.addColorStop(1, isLight ? palette.lightSquareAccent : palette.darkSquareAccent);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, cellSize + 0.35, cellSize + 0.35);

  if (themeId === 'wood') {
    // Parquet directional wood grain lines alternating across square parity
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(130, 82, 42, 0.075)' : 'rgba(42, 22, 8, 0.12)';
    ctx.lineWidth = 0.85;
    const horizontal = (boardRow + boardCol) % 2 === 0;
    for (let k = 1; k <= 3; k++) {
      const offset = (cellSize * k) / 4;
      ctx.beginPath();
      if (horizontal) {
        ctx.moveTo(x + 2, y + offset);
        ctx.quadraticCurveTo(x + cellSize * 0.5, y + offset + (k % 2 === 0 ? 1.5 : -1.5), x + cellSize - 2, y + offset);
      } else {
        ctx.moveTo(x + offset, y + 2);
        ctx.quadraticCurveTo(x + offset + (k % 2 === 0 ? 1.5 : -1.5), y + cellSize * 0.5, x + offset, y + cellSize - 2);
      }
      ctx.stroke();
    }
    ctx.restore();
  } else if (themeId === 'marble') {
    // Diagonal mineral veining
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.12)' : 'rgba(226, 232, 240, 0.1)';
    ctx.lineWidth = 0.9;
    const shift = ((boardRow * 3 + boardCol * 5) % 4) * (cellSize * 0.14);
    ctx.beginPath();
    ctx.moveTo(x, y + shift * 0.4 + cellSize * 0.15);
    ctx.bezierCurveTo(
      x + cellSize * 0.38,
      y + cellSize * 0.35,
      x + cellSize * 0.65,
      y + cellSize * 0.68,
      x + cellSize,
      y + cellSize * 0.82 - shift * 0.3
    );
    ctx.stroke();
    ctx.restore();
  }
}

function drawChessHintArrow(
  ctx: CanvasRenderingContext2D,
  fromPt: { x: number; y: number },
  toPt: { x: number; y: number },
  color: string,
  cellSize: number
): void {
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;

  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(18, Math.max(11, cellSize * 0.34));
  const shaftEndX = toPt.x - Math.cos(angle) * (headLen * 0.65);
  const shaftEndY = toPt.y - Math.sin(angle) * (headLen * 0.65);

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3.5, cellSize * 0.085);

  ctx.beginPath();
  ctx.moveTo(fromPt.x, fromPt.y);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toPt.x, toPt.y);
  ctx.lineTo(
    toPt.x - Math.cos(angle - Math.PI / 6.5) * headLen,
    toPt.y - Math.sin(angle - Math.PI / 6.5) * headLen
  );
  ctx.lineTo(
    toPt.x - Math.cos(angle + Math.PI / 6.5) * headLen,
    toPt.y - Math.sin(angle + Math.PI / 6.5) * headLen
  );
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.24;
  ctx.beginPath();
  ctx.arc(toPt.x, toPt.y, cellSize * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderChessBoardCanvas(params: {
  canvas: HTMLCanvasElement;
  board: ChessBoard;
  metrics: ChessBoardMetrics;
  palette: ChessBoardThemePalette;
  isFlipped: boolean;
  selectedSquare: BoardCoord | null;
  legalTargets: BoardCoord[];
  lastMove: ChessMove | null;
  hintMove: ChessMove | null;
  checkedKingPos: BoardCoord | null;
  slideAnim: ChessSlideAnim | null;
  dragState: ChessDragRenderState;
  particles: ChessParticle[];
  shockwaves?: ChessShockwave[];
}): void {
  const {
    canvas,
    board,
    metrics,
    palette,
    isFlipped,
    selectedSquare,
    legalTargets,
    lastMove,
    hintMove,
    checkedKingPos,
    slideAnim,
    dragState,
    particles,
    shockwaves = [],
  } = params;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height, pad, cellSize } = metrics;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const toDisplay = (c: BoardCoord) =>
    isFlipped
      ? { dr: BOARD_SIZE - 1 - c.row, dc: BOARD_SIZE - 1 - c.col }
      : { dr: c.row, dc: c.col };

  const cellCenter = (c: BoardCoord) => {
    const { dr, dc } = toDisplay(c);
    return {
      x: pad + (dc + 0.5) * cellSize,
      y: pad + (dr + 0.5) * cellSize,
    };
  };

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Beveled Cabinet Outer Frame
  const frameGrad = ctx.createLinearGradient(0, 0, width, height);
  frameGrad.addColorStop(0, palette.outerFrameLight);
  frameGrad.addColorStop(0.55, palette.outerFrame);
  frameGrad.addColorStop(1, palette.outerFrame);
  ctx.fillStyle = frameGrad;
  ctx.fillRect(0, 0, width, height);

  // Fine brass/gold inlay border around playing field
  const boardSpan = cellSize * BOARD_SIZE;
  ctx.strokeStyle = palette.frameInlay;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.25;
  ctx.strokeRect(pad - 2.5, pad - 2.5, boardSpan + 5, boardSpan + 5);
  ctx.globalAlpha = 1;

  // 2. 8x8 Textured Squares
  for (let dr = 0; dr < BOARD_SIZE; dr++) {
    for (let dc = 0; dc < BOARD_SIZE; dc++) {
      const boardRow = isFlipped ? BOARD_SIZE - 1 - dr : dr;
      const boardCol = isFlipped ? BOARD_SIZE - 1 - dc : dc;
      const isLight = (boardRow + boardCol) % 2 === 0;
      const x = pad + dc * cellSize;
      const y = pad + dr * cellSize;

      drawSquareTexture(ctx, palette.id, x, y, cellSize, isLight, boardRow, boardCol, palette);
    }
  }

  // Subtle recessed inner shadow along board border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(pad, pad, boardSpan, boardSpan);

  // 3. Coordinate Labels (A-H, 1-8) in outer frame margin
  const coordFontSize = Math.max(9, Math.round(pad * 0.5));
  ctx.fillStyle = palette.coordText;
  ctx.globalAlpha = 0.88;
  ctx.font = `600 ${coordFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < BOARD_SIZE; i++) {
    const fileLabel = FILE_LABELS[isFlipped ? BOARD_SIZE - 1 - i : i].toUpperCase();
    const rankLabel = String(isFlipped ? i + 1 : BOARD_SIZE - i);
    const fx = pad + (i + 0.5) * cellSize;
    const ry = pad + (i + 0.5) * cellSize;
    ctx.fillText(fileLabel, fx, height - pad * 0.48);
    ctx.fillText(rankLabel, pad * 0.48, ry);
  }
  ctx.globalAlpha = 1;

  // 4. Last move highlight + crisp corner brackets on destination
  if (lastMove) {
    for (const sq of [lastMove.from, lastMove.to]) {
      const { dr, dc } = toDisplay(sq);
      ctx.fillStyle = palette.highlightLastMove;
      ctx.fillRect(pad + dc * cellSize, pad + dr * cellSize, cellSize, cellSize);
    }
    const { dr: toR, dc: toC } = toDisplay(lastMove.to);
    const tx = pad + toC * cellSize;
    const ty = pad + toR * cellSize;
    const bLen = Math.max(6, cellSize * 0.22);
    ctx.strokeStyle = palette.highlightSelected;
    ctx.lineWidth = 1.8;
    for (const [cx, cy, sx, sy] of [
      [tx + 2, ty + 2, 1, 1],
      [tx + cellSize - 2, ty + 2, -1, 1],
      [tx + 2, ty + cellSize - 2, 1, -1],
      [tx + cellSize - 2, ty + cellSize - 2, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + sy * bLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + sx * bLen, cy);
      ctx.stroke();
    }
  }

  // 5. Selected square highlight
  if (selectedSquare) {
    const { dr, dc } = toDisplay(selectedSquare);
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.fillRect(pad + dc * cellSize, pad + dr * cellSize, cellSize, cellSize);
    ctx.strokeStyle = palette.highlightSelected;
    ctx.lineWidth = 2.6;
    ctx.strokeRect(pad + dc * cellSize + 1.5, pad + dr * cellSize + 1.5, cellSize - 3, cellSize - 3);
    ctx.restore();
  }

  // 6. Check King Radial Danger Glow
  if (checkedKingPos) {
    const pt = cellCenter(checkedKingPos);
    const grad = ctx.createRadialGradient(pt.x, pt.y, cellSize * 0.08, pt.x, pt.y, cellSize * 0.56);
    grad.addColorStop(0, 'rgba(220, 38, 38, 0.78)');
    grad.addColorStop(0.65, 'rgba(220, 38, 38, 0.35)');
    grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = grad;
    const { dr, dc } = toDisplay(checkedKingPos);
    ctx.fillRect(pad + dc * cellSize, pad + dr * cellSize, cellSize, cellSize);
  }

  // 7. Legal Move Indicators
  for (const target of legalTargets) {
    const pt = cellCenter(target);
    const hasPiece = board[target.row][target.col] !== null;
    ctx.save();
    if (hasPiece) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, cellSize * 0.44, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2.6, cellSize * 0.075);
      ctx.strokeStyle = palette.captureRing;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(5.5, cellSize * 0.155), 0, Math.PI * 2);
      ctx.fillStyle = palette.legalDot;
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Static Pieces
  const pieceSize = cellSize * 0.84;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (slideAnim && slideAnim.to.row === r && slideAnim.to.col === c) continue;
      if (dragState.active && dragState.hasMoved && dragState.from?.row === r && dragState.from?.col === c) {
        continue;
      }
      const pt = cellCenter({ row: r, col: c });
      drawStauntonPiece(ctx, piece.type, piece.side, pt.x, pt.y, pieceSize);
    }
  }

  // 10. Sliding piece
  if (slideAnim) {
    const fromPt = cellCenter(slideAnim.from);
    const toPt = cellCenter(slideAnim.to);
    const t = 1 - Math.pow(1 - Math.min(1, slideAnim.progress), 3);
    const ix = fromPt.x + (toPt.x - fromPt.x) * t;
    const iy = fromPt.y + (toPt.y - fromPt.y) * t;
    drawStauntonPiece(ctx, slideAnim.piece.type, slideAnim.piece.side, ix, iy, pieceSize * 1.06, {
      isLifted: true,
    });
  }

  // 11. Dragged piece
  if (dragState.active && dragState.hasMoved && dragState.piece) {
    drawStauntonPiece(
      ctx,
      dragState.piece.type,
      dragState.piece.side,
      dragState.canvasX,
      dragState.canvasY,
      pieceSize * 1.14,
      { isLifted: true }
    );
  }

  // 12. Hint Arrow (rendered above static pieces so capture targets stay clear)
  if (hintMove) {
    ctx.save();
    ctx.globalAlpha = 0.86;
    drawChessHintArrow(
      ctx,
      cellCenter(hintMove.from),
      cellCenter(hintMove.to),
      palette.highlightHint,
      cellSize
    );
    ctx.restore();
  }

  // 13. Shockwave Rings
  for (let i = 0; i < shockwaves.length; i++) {
    const sw = shockwaves[i];
    const progress = Math.min(1, sw.life / sw.maxLife);
    const radius = sw.maxRadius * (0.35 + 0.65 * progress);
    const alpha = (1 - progress) * 0.72;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = sw.color;
    ctx.lineWidth = Math.max(1.2, (1 - progress) * 3.5);
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 13. Pooled particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.active) continue;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha + 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
