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
  coordText: string;
  lightSquare: string;
  darkSquare: string;
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
    outerFrame: '#3E2414',
    coordText: '#E8D5B5',
    lightSquare: '#F0D9B5',
    darkSquare: '#B58863',
    highlightSelected: '#D97706',
    highlightLastMove: 'rgba(245, 158, 11, 0.38)',
    highlightHint: '#0284C7',
    legalDot: 'rgba(15, 23, 42, 0.28)',
    captureRing: 'rgba(220, 38, 38, 0.78)',
    checkGlow: '#DC2626',
  },
  marble: {
    id: 'marble',
    label: 'Cẩm Thạch',
    outerFrame: '#1E293B',
    coordText: '#CBD5E1',
    lightSquare: '#E2E8F0',
    darkSquare: '#64748B',
    highlightSelected: '#0284C7',
    highlightLastMove: 'rgba(56, 189, 248, 0.34)',
    highlightHint: '#D97706',
    legalDot: 'rgba(15, 23, 42, 0.3)',
    captureRing: 'rgba(239, 68, 68, 0.84)',
    checkGlow: '#EF4444',
  },
  emerald: {
    id: 'emerald',
    label: 'Ngọc Lục Bảo',
    outerFrame: '#0F2E22',
    coordText: '#D9E8DD',
    lightSquare: '#EEEED2',
    darkSquare: '#52805E',
    highlightSelected: '#EAB308',
    highlightLastMove: 'rgba(250, 204, 21, 0.36)',
    highlightHint: '#0EA5E9',
    legalDot: 'rgba(15, 23, 42, 0.28)',
    captureRing: 'rgba(220, 38, 38, 0.82)',
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
  const fill = isWhite ? '#FCF9F2' : '#1E2430';
  const stroke = isWhite ? '#1E293B' : '#0B0F17';
  const detailStroke = isWhite ? '#334155' : '#CBD5E1';
  const s = size; // Normalized unit width/height (~cellSize * 0.82)
  const lw = Math.max(1.3, s * 0.042);

  ctx.save();
  ctx.translate(cx, cy);

  if (options?.isLifted) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 7;
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
  }

  // Subtle rim highlight on dark pieces so they stay sharp on dark squares
  const drawBody = () => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    if (!isWhite) {
      ctx.save();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.28)';
      ctx.lineWidth = Math.max(0.8, lw * 0.55);
      ctx.stroke();
      ctx.restore();
    }
  };

  if (type === 'P') {
    // Pawn: circular head + collar + flared stem + base
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

    ctx.strokeStyle = detailStroke;
    ctx.lineWidth = Math.max(1, lw * 0.72);
    ctx.beginPath();
    ctx.moveTo(-s * 0.21, s * 0.29);
    ctx.lineTo(s * 0.21, s * 0.29);
    ctx.stroke();
  } else if (type === 'R') {
    // Rook: crenellated battlements + tapered tower + wide pedestal
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
    ctx.moveTo(-s * 0.21, s * 0.21);
    ctx.lineTo(s * 0.21, s * 0.21);
    ctx.moveTo(-s * 0.25, s * 0.29);
    ctx.lineTo(s * 0.25, s * 0.29);
    ctx.stroke();
  } else if (type === 'N') {
    // Knight: sculpted stallion head + arched mane + base
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

    // Eye & mane ridge detail
    ctx.fillStyle = detailStroke;
    ctx.beginPath();
    ctx.arc(-s * 0.13, -s * 0.14, Math.max(1.4, s * 0.032), 0, Math.PI * 2);
    ctx.fill();

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

    // Mitre diagonal cut & cross
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
    // Queen: 5-point radial coronet + pearls + flared gown + base
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
      ctx.arc(px, py, s * 0.042, 0, Math.PI * 2);
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
    // King: sovereign cross + wide royal crown lobes + base
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(2, lw * 1.45);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.43);
    ctx.lineTo(0, -s * 0.2);
    ctx.moveTo(-s * 0.1, -s * 0.34);
    ctx.lineTo(s * 0.1, -s * 0.34);
    ctx.stroke();
    if (!isWhite) {
      ctx.save();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = Math.max(1, lw * 0.65);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.42);
      ctx.lineTo(0, -s * 0.22);
      ctx.moveTo(-s * 0.09, -s * 0.34);
      ctx.lineTo(s * 0.09, -s * 0.34);
      ctx.stroke();
      ctx.restore();
    }

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

  // 1. Outer frame
  ctx.fillStyle = palette.outerFrame;
  ctx.fillRect(0, 0, width, height);

  // 2. 8x8 Squares
  for (let dr = 0; dr < BOARD_SIZE; dr++) {
    for (let dc = 0; dc < BOARD_SIZE; dc++) {
      const boardRow = isFlipped ? BOARD_SIZE - 1 - dr : dr;
      const boardCol = isFlipped ? BOARD_SIZE - 1 - dc : dc;
      const isLight = (boardRow + boardCol) % 2 === 0;
      const x = pad + dc * cellSize;
      const y = pad + dr * cellSize;

      ctx.fillStyle = isLight ? palette.lightSquare : palette.darkSquare;
      ctx.fillRect(x, y, cellSize + 0.35, cellSize + 0.35);
    }
  }

  // Subtle board inner border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad, pad, cellSize * BOARD_SIZE, cellSize * BOARD_SIZE);

  // 3. Coordinate Labels (a-h, 1-8) in outer frame margin
  const coordFontSize = Math.max(9, Math.round(pad * 0.54));
  ctx.fillStyle = palette.coordText;
  ctx.font = `600 ${coordFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < BOARD_SIZE; i++) {
    const fileLabel = FILE_LABELS[isFlipped ? BOARD_SIZE - 1 - i : i];
    const rankLabel = String(isFlipped ? i + 1 : BOARD_SIZE - i);
    const fx = pad + (i + 0.5) * cellSize;
    const ry = pad + (i + 0.5) * cellSize;
    ctx.fillText(fileLabel, fx, height - pad * 0.5);
    ctx.fillText(rankLabel, pad * 0.5, ry);
  }

  // 4. Last move highlight
  if (lastMove) {
    for (const sq of [lastMove.from, lastMove.to]) {
      const { dr, dc } = toDisplay(sq);
      ctx.fillStyle = palette.highlightLastMove;
      ctx.fillRect(pad + dc * cellSize, pad + dr * cellSize, cellSize, cellSize);
    }
  }

  // 5. Selected square highlight
  if (selectedSquare) {
    const { dr, dc } = toDisplay(selectedSquare);
    ctx.save();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.26)';
    ctx.fillRect(pad + dc * cellSize, pad + dr * cellSize, cellSize, cellSize);
    ctx.strokeStyle = palette.highlightSelected;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(pad + dc * cellSize + 1.5, pad + dr * cellSize + 1.5, cellSize - 3, cellSize - 3);
    ctx.restore();
  }

  // 6. Check King Radial Glow
  if (checkedKingPos) {
    const pt = cellCenter(checkedKingPos);
    const grad = ctx.createRadialGradient(pt.x, pt.y, cellSize * 0.1, pt.x, pt.y, cellSize * 0.52);
    grad.addColorStop(0, 'rgba(220, 38, 38, 0.72)');
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
      ctx.arc(pt.x, pt.y, cellSize * 0.43, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2.5, cellSize * 0.075);
      ctx.strokeStyle = palette.captureRing;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(5, cellSize * 0.145), 0, Math.PI * 2);
      ctx.fillStyle = palette.legalDot;
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Hint Arrow
  if (hintMove) {
    const fromPt = cellCenter(hintMove.from);
    const toPt = cellCenter(hintMove.to);
    ctx.save();
    ctx.strokeStyle = palette.highlightHint;
    ctx.fillStyle = palette.highlightHint;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(fromPt.x, fromPt.y);
    ctx.lineTo(toPt.x, toPt.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(toPt.x, toPt.y, cellSize * 0.24, 0, Math.PI * 2);
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.restore();
  }

  // 9. Static Pieces
  const pieceSize = cellSize * 0.82;
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
    drawStauntonPiece(ctx, slideAnim.piece.type, slideAnim.piece.side, ix, iy, pieceSize * 1.05, {
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
      pieceSize * 1.12,
      { isLifted: true }
    );
  }

  // 12. Pooled particles
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (!p.active) continue;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha + 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}
