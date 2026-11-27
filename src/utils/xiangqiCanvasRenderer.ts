import {
  BOARD_COLS,
  BOARD_ROWS,
  BoardCoord,
  findKingPosition,
  PIECE_DISPLAY_INFO,
  XiangqiBoard,
  XiangqiMove,
  XiangqiPiece,
  XiangqiSide,
} from './xiangqiEngine.ts';

export type XiangqiBoardThemeId = 'wood' | 'ink' | 'jade';

export interface XiangqiBoardThemePalette {
  id: XiangqiBoardThemeId;
  label: string;
  outerFrame: string;
  outerFrameLight: string;
  frameInlay: string;
  boardSurface: string;
  boardEdge: string;
  gridLine: string;
  gridEmboss: string;
  riverBg: string;
  riverText: string;
  redDiscTop: string;
  redDiscEdge: string;
  redDiscSkirt: string;
  redDiscRing: string;
  redText: string;
  blackDiscTop: string;
  blackDiscEdge: string;
  blackDiscSkirt: string;
  blackDiscRing: string;
  blackText: string;
  highlightSelected: string;
  highlightLastMove: string;
  highlightHint: string;
  legalDot: string;
  captureRing: string;
}

export const XIANGQI_BOARD_THEMES: Record<XiangqiBoardThemeId, XiangqiBoardThemePalette> = {
  wood: {
    id: 'wood',
    label: 'Gỗ Hương',
    outerFrame: '#3A1F0E',
    outerFrameLight: '#5C341B',
    frameInlay: '#D4A857',
    boardSurface: '#E8C58E',
    boardEdge: '#C79B5E',
    gridLine: '#4E2D16',
    gridEmboss: 'rgba(255, 240, 212, 0.32)',
    riverBg: 'rgba(110, 65, 28, 0.08)',
    riverText: '#532F16',
    redDiscTop: '#FFF9EF',
    redDiscEdge: '#EAD6B5',
    redDiscSkirt: '#8C4B38',
    redDiscRing: '#B91C1C',
    redText: '#B91C1C',
    blackDiscTop: '#F8F5EE',
    blackDiscEdge: '#DFD7C8',
    blackDiscSkirt: '#374151',
    blackDiscRing: '#1E293B',
    blackText: '#0F172A',
    highlightSelected: '#D97706',
    highlightLastMove: 'rgba(217, 119, 6, 0.24)',
    highlightHint: '#0284C7',
    legalDot: '#16A34A',
    captureRing: '#DC2626',
  },
  ink: {
    id: 'ink',
    label: 'Thủy Mặc',
    outerFrame: '#161412',
    outerFrameLight: '#2E2A27',
    frameInlay: '#B89B6A',
    boardSurface: '#F3ECE0',
    boardEdge: '#DDD0BC',
    gridLine: '#38332E',
    gridEmboss: 'rgba(255, 255, 255, 0.5)',
    riverBg: 'rgba(41, 37, 36, 0.045)',
    riverText: '#44403C',
    redDiscTop: '#FCF8F0',
    redDiscEdge: '#E8DEC8',
    redDiscSkirt: '#7B3434',
    redDiscRing: '#9E2A2B',
    redText: '#9E2A2B',
    blackDiscTop: '#F5F3EE',
    blackDiscEdge: '#DBD6CC',
    blackDiscSkirt: '#292524',
    blackDiscRing: '#1C1917',
    blackText: '#1C1917',
    highlightSelected: '#B48332',
    highlightLastMove: 'rgba(180, 131, 50, 0.22)',
    highlightHint: '#0369A1',
    legalDot: '#15803D',
    captureRing: '#9E2A2B',
  },
  jade: {
    id: 'jade',
    label: 'Ngọc Bích',
    outerFrame: '#09221A',
    outerFrameLight: '#154334',
    frameInlay: '#E0C06C',
    boardSurface: '#18543F',
    boardEdge: '#0E392A',
    gridLine: '#DFC173',
    gridEmboss: 'rgba(8, 32, 23, 0.55)',
    riverBg: 'rgba(7, 30, 22, 0.42)',
    riverText: '#EED284',
    redDiscTop: '#FFF9EC',
    redDiscEdge: '#EADAB9',
    redDiscSkirt: '#8C3B32',
    redDiscRing: '#C81E1E',
    redText: '#B91C1C',
    blackDiscTop: '#EFF5F2',
    blackDiscEdge: '#D2DFD8',
    blackDiscSkirt: '#13241F',
    blackDiscRing: '#0F172A',
    blackText: '#0B1320',
    highlightSelected: '#FBBF24',
    highlightLastMove: 'rgba(251, 191, 36, 0.24)',
    highlightHint: '#38BDF8',
    legalDot: '#34D399',
    captureRing: '#F87171',
  },
};

export interface XiangqiParticle {
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

export interface XiangqiShockwave {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  color: string;
}

export interface XiangqiSlideAnim {
  piece: XiangqiPiece;
  from: BoardCoord;
  to: BoardCoord;
  progress: number;
}

export interface XiangqiDragRenderState {
  active: boolean;
  hasMoved: boolean;
  from: BoardCoord | null;
  piece: XiangqiPiece | null;
  canvasX: number;
  canvasY: number;
}

export interface XiangqiBoardMetrics {
  width: number;
  height: number;
  padX: number;
  padY: number;
  cellSize: number;
}

function drawWoodOrStoneTexture(
  ctx: CanvasRenderingContext2D,
  themeId: XiangqiBoardThemeId,
  inset: number,
  boardW: number,
  boardH: number,
  palette: XiangqiBoardThemePalette
): void {
  const grad = ctx.createRadialGradient(
    inset + boardW * 0.5,
    inset + boardH * 0.45,
    Math.min(boardW, boardH) * 0.1,
    inset + boardW * 0.5,
    inset + boardH * 0.5,
    Math.max(boardW, boardH) * 0.72
  );
  grad.addColorStop(0, palette.boardSurface);
  grad.addColorStop(1, palette.boardEdge);
  ctx.fillStyle = grad;
  ctx.fillRect(inset, inset, boardW, boardH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(inset, inset, boardW, boardH);
  ctx.clip();

  if (themeId === 'wood') {
    // Fine rosewood woodgrain lines across board surface
    ctx.strokeStyle = 'rgba(92, 46, 18, 0.055)';
    ctx.lineWidth = 1;
    const step = 11;
    for (let i = -2; i < boardH / step + 2; i++) {
      const baseY = inset + i * step;
      ctx.beginPath();
      ctx.moveTo(inset, baseY);
      const amp = 4 + (i % 3) * 2.5;
      ctx.bezierCurveTo(
        inset + boardW * 0.33,
        baseY + ((i % 2 === 0 ? 1 : -1) * amp),
        inset + boardW * 0.67,
        baseY + ((i % 2 === 0 ? -1 : 1) * amp * 0.8),
        inset + boardW,
        baseY + ((i % 3) - 1) * 2
      );
      ctx.stroke();
    }
  } else if (themeId === 'ink') {
    // Aged Xuan paper washes and subtle ink mist curves
    ctx.fillStyle = 'rgba(120, 106, 86, 0.04)';
    ctx.beginPath();
    ctx.ellipse(inset + boardW * 0.18, inset + boardH * 0.22, boardW * 0.24, boardH * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(inset + boardW * 0.82, inset + boardH * 0.78, boardW * 0.26, boardH * 0.14, 0.25, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Polished nephrite jade mineral veins
    ctx.strokeStyle = 'rgba(218, 245, 228, 0.06)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 6; i++) {
      const y0 = inset + (boardH * (i + 0.5)) / 6;
      ctx.beginPath();
      ctx.moveTo(inset, y0 + (i % 2 === 0 ? -18 : 16));
      ctx.bezierCurveTo(
        inset + boardW * 0.35,
        y0 + (i % 2 === 0 ? 22 : -24),
        inset + boardW * 0.65,
        y0 - 14,
        inset + boardW,
        y0 + 10
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTactileXiangqiPiece(
  ctx: CanvasRenderingContext2D,
  piece: XiangqiPiece,
  x: number,
  y: number,
  radius: number,
  palette: XiangqiBoardThemePalette,
  options?: { isSelected?: boolean; isCheckTarget?: boolean; isLifted?: boolean; pulsePhase?: number }
): void {
  const isRed = piece.side === 'red';
  const topCol = isRed ? palette.redDiscTop : palette.blackDiscTop;
  const edgeCol = isRed ? palette.redDiscEdge : palette.blackDiscEdge;
  const skirtCol = isRed ? palette.redDiscSkirt : palette.blackDiscSkirt;
  const discRing = isRed ? palette.redDiscRing : palette.blackDiscRing;
  const textCol = isRed ? palette.redText : palette.blackText;
  const info = PIECE_DISPLAY_INFO[piece.side][piece.type];

  ctx.save();

  // Pulsing target aura when checked or selected
  const pulse = 0.5 + 0.5 * Math.sin(options?.pulsePhase ?? 0);
  if (options?.isCheckTarget) {
    const aura = ctx.createRadialGradient(x, y, radius * 0.6, x, y, radius * 1.48);
    aura.addColorStop(0, `rgba(220, 38, 38, ${0.42 + pulse * 0.22})`);
    aura.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.48, 0, Math.PI * 2);
    ctx.fill();
  } else if (options?.isSelected) {
    const aura = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius * 1.38);
    aura.addColorStop(0, 'rgba(245, 158, 11, 0.38)');
    aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.38, 0, Math.PI * 2);
    ctx.fill();
  }

  // Contact / lift drop shadow
  if (options?.isLifted) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 9;
  } else {
    ctx.shadowColor = 'rgba(15, 10, 5, 0.42)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3.2;
  }

  // 3D beveled wooden skirt beneath disc
  const skirtOffset = Math.max(2, radius * 0.11);
  ctx.beginPath();
  ctx.arc(x, y + skirtOffset, radius, 0, Math.PI * 2);
  ctx.fillStyle = skirtCol;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Domed top face with radial ivory/boxwood specular highlight
  const faceGrad = ctx.createRadialGradient(
    x - radius * 0.28,
    y - radius * 0.3,
    radius * 0.08,
    x,
    y,
    radius
  );
  faceGrad.addColorStop(0, topCol);
  faceGrad.addColorStop(0.75, topCol);
  faceGrad.addColorStop(1, edgeCol);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = faceGrad;
  ctx.fill();

  // Outer carved bevel edge + top specular arc
  ctx.lineWidth = Math.max(1.5, radius * 0.082);
  ctx.strokeStyle = options?.isSelected
    ? palette.highlightSelected
    : options?.isCheckTarget
    ? '#EF4444'
    : discRing;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.92, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = Math.max(1, radius * 0.04);
  ctx.stroke();

  // Double concentric recessed inner groove
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.82, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.1, radius * 0.048);
  ctx.strokeStyle = discRing;
  ctx.globalAlpha = 0.78;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, radius * 0.73, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(0.7, radius * 0.025);
  ctx.globalAlpha = 0.32;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (options?.isSelected) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 3.5, 0, Math.PI * 2);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = palette.highlightSelected;
    ctx.stroke();
  } else if (options?.isCheckTarget) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#EF4444';
    ctx.stroke();
  }

  // Carved calligraphic glyph with subtle emboss drop
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const hanziSize = Math.round(radius * 0.94);
  ctx.font = `700 ${hanziSize}px "Noto Serif Display", "Noto Serif", "Plus Jakarta Sans", serif`;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  ctx.fillText(info.hanzi, x, y - radius * 0.08 + 1);

  ctx.fillStyle = textCol;
  ctx.fillText(info.hanzi, x, y - radius * 0.08);

  // Subtle Vietnamese micro-tag at bottom inside the inner groove
  ctx.font = `700 ${Math.max(7.5, Math.round(radius * 0.27))}px "Plus Jakarta Sans", sans-serif`;
  ctx.globalAlpha = 0.8;
  ctx.fillText(info.shortVi.toUpperCase(), x, y + radius * 0.56);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawGlowHintArrow(
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

  // Geometric arrowhead
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

  // Target halo
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.24;
  ctx.beginPath();
  ctx.arc(toPt.x, toPt.y, cellSize * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function renderXiangqiBoardCanvas(params: {
  canvas: HTMLCanvasElement;
  board: XiangqiBoard;
  metrics: XiangqiBoardMetrics;
  palette: XiangqiBoardThemePalette;
  isFlipped: boolean;
  selectedSquare: BoardCoord | null;
  legalTargets: BoardCoord[];
  lastMove: XiangqiMove | null;
  hintMove: XiangqiMove | null;
  inCheckSide: XiangqiSide | null;
  slideAnim: XiangqiSlideAnim | null;
  dragState: XiangqiDragRenderState;
  particles: XiangqiParticle[];
  shockwaves: XiangqiShockwave[];
  animTime: number;
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
    inCheckSide,
    slideAnim,
    dragState,
    particles,
    shockwaves,
    animTime,
  } = params;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height, padX, padY, cellSize } = metrics;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.round(width * dpr);
  const targetH = Math.round(height * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const toDisplayCoord = (coord: BoardCoord) =>
    isFlipped
      ? { dr: BOARD_ROWS - 1 - coord.row, dc: BOARD_COLS - 1 - coord.col }
      : { dr: coord.row, dc: coord.col };

  const boardToCanvasPoint = (coord: BoardCoord) => {
    const { dr, dc } = toDisplayCoord(coord);
    return {
      x: padX + dc * cellSize,
      y: padY + dr * cellSize,
    };
  };

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Beveled Lacquered Outer Frame + Metallic Inlay
  const frameGrad = ctx.createLinearGradient(0, 0, width, height);
  frameGrad.addColorStop(0, palette.outerFrameLight);
  frameGrad.addColorStop(0.5, palette.outerFrame);
  frameGrad.addColorStop(1, palette.outerFrame);
  ctx.fillStyle = frameGrad;
  ctx.fillRect(0, 0, width, height);

  const inset = Math.max(7, Math.round(cellSize * 0.16));
  const boardW = width - inset * 2;
  const boardH = height - inset * 2;

  // Inner brass/gold trim border around tabletop surface
  ctx.strokeStyle = palette.frameInlay;
  ctx.globalAlpha = 0.52;
  ctx.lineWidth = 1.25;
  ctx.strokeRect(inset - 2.5, inset - 2.5, boardW + 5, boardH + 5);
  ctx.globalAlpha = 1;

  // 2. Crafted Board Surface Texture
  drawWoodOrStoneTexture(ctx, palette.id, inset, boardW, boardH, palette);

  // Subtle recessed inner shadow along board perimeter
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(inset, inset, boardW, boardH);

  const gridLeft = padX;
  const gridTop = padY;
  const gridRight = padX + (BOARD_COLS - 1) * cellSize;
  const gridBottom = padY + (BOARD_ROWS - 1) * cellSize;

  // 3. River band & engraved banks
  const riverY1 = gridTop + 4 * cellSize;
  ctx.fillStyle = palette.riverBg;
  ctx.fillRect(gridLeft, riverY1, gridRight - gridLeft, cellSize);

  // Outer carved double border + subtle corner brass brackets
  ctx.strokeStyle = palette.gridEmboss;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(gridLeft - 4, gridTop - 3, gridRight - gridLeft + 8, gridBottom - gridTop + 8);

  ctx.strokeStyle = palette.gridLine;
  ctx.lineWidth = 2.2;
  ctx.strokeRect(gridLeft - 4, gridTop - 4, gridRight - gridLeft + 8, gridBottom - gridTop + 8);

  const cornerSize = Math.max(7, cellSize * 0.16);
  const frameCorners: [number, number, number, number][] = [
    [gridLeft - 7, gridTop - 7, 1, 1],
    [gridRight + 7, gridTop - 7, -1, 1],
    [gridLeft - 7, gridBottom + 7, 1, -1],
    [gridRight + 7, gridBottom + 7, -1, -1],
  ];
  ctx.lineWidth = 1.6;
  for (const [cx, cy, sx, sy] of frameCorners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * cornerSize);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * cornerSize, cy);
    ctx.stroke();
  }

  // Grid horizontal lines (10)
  ctx.lineWidth = 1.25;
  for (let r = 0; r < BOARD_ROWS; r++) {
    const y = gridTop + r * cellSize;
    ctx.strokeStyle = palette.gridEmboss;
    ctx.beginPath();
    ctx.moveTo(gridLeft, y + 0.8);
    ctx.lineTo(gridRight, y + 0.8);
    ctx.stroke();

    ctx.strokeStyle = palette.gridLine;
    ctx.beginPath();
    ctx.moveTo(gridLeft, y);
    ctx.lineTo(gridRight, y);
    ctx.stroke();
  }

  // Grid vertical lines (9) — split across the river
  for (let c = 0; c < BOARD_COLS; c++) {
    const x = gridLeft + c * cellSize;
    ctx.strokeStyle = palette.gridLine;
    if (c === 0 || c === BOARD_COLS - 1) {
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridBottom);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x, gridTop);
      ctx.lineTo(x, gridTop + 4 * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, gridTop + 5 * cellSize);
      ctx.lineTo(x, gridBottom);
      ctx.stroke();
    }
  }

  // Palace diagonal lines
  const drawPalaceCross = (topRow: number) => {
    const x1 = gridLeft + 3 * cellSize;
    const x2 = gridLeft + 5 * cellSize;
    const y1 = gridTop + topRow * cellSize;
    const y2 = gridTop + (topRow + 2) * cellSize;
    ctx.strokeStyle = palette.gridLine;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(x2, y1);
    ctx.lineTo(x1, y2);
    ctx.stroke();
  };
  drawPalaceCross(0);
  drawPalaceCross(7);

  // Cannon & Soldier traditional intersection crosshairs
  const drawMarker = (r: number, c: number, drawLeft: boolean, drawRight: boolean) => {
    const cx = gridLeft + c * cellSize;
    const cy = gridTop + r * cellSize;
    const gap = Math.max(3, cellSize * 0.085);
    const len = Math.max(5, cellSize * 0.145);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = palette.gridLine;
    const corners = [
      drawLeft ? [-1, -1] : null,
      drawRight ? [1, -1] : null,
      drawLeft ? [-1, 1] : null,
      drawRight ? [1, 1] : null,
    ];
    for (const pair of corners) {
      if (!pair) continue;
      const [sx, sy] = pair;
      ctx.beginPath();
      ctx.moveTo(cx + sx * gap, cy + sy * (gap + len));
      ctx.lineTo(cx + sx * gap, cy + sy * gap);
      ctx.lineTo(cx + sx * (gap + len), cy + sy * gap);
      ctx.stroke();
    }
  };

  const markerCoords: [number, number][] = [
    [2, 1],
    [2, 7],
    [7, 1],
    [7, 7],
    [3, 0],
    [3, 2],
    [3, 4],
    [3, 6],
    [3, 8],
    [6, 0],
    [6, 2],
    [6, 4],
    [6, 6],
    [6, 8],
  ];
  for (const [r, c] of markerCoords) {
    drawMarker(r, c, c > 0, c < 8);
  }

  // River inscription with engraved seal divider
  const riverCenterY = riverY1 + cellSize * 0.5;
  const riverCenterX = gridLeft + cellSize * 4;
  ctx.fillStyle = palette.riverText;
  ctx.globalAlpha = 0.88;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const riverFontSize = Math.max(12, Math.round(cellSize * 0.34));
  ctx.font = `700 ${riverFontSize}px "Noto Serif Display", "Noto Serif", "Plus Jakarta Sans", serif`;
  ctx.fillText(isFlipped ? '漢 界 · HÁN GIỚI' : '楚 河 · SỞ HÀ', gridLeft + cellSize * 2, riverCenterY);
  ctx.fillText(isFlipped ? '楚 河 · SỞ HÀ' : '漢 界 · HÁN GIỚI', gridLeft + cellSize * 6, riverCenterY);

  // Subtle central diamond seal ornament on river
  ctx.strokeStyle = palette.riverText;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.36;
  const dR = Math.max(5, cellSize * 0.13);
  ctx.beginPath();
  ctx.moveTo(riverCenterX, riverCenterY - dR);
  ctx.lineTo(riverCenterX + dR, riverCenterY);
  ctx.lineTo(riverCenterX, riverCenterY + dR);
  ctx.lineTo(riverCenterX - dR, riverCenterY);
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;

  // 4. Last move square tint + corner brackets
  if (lastMove) {
    const fromPt = boardToCanvasPoint(lastMove.from);
    const toPt = boardToCanvasPoint(lastMove.to);
    const box = cellSize * 0.84;
    const half = box / 2;
    const bLen = Math.max(7, box * 0.26);

    ctx.fillStyle = palette.highlightLastMove;
    ctx.fillRect(fromPt.x - half, fromPt.y - half, box, box);
    ctx.fillRect(toPt.x - half, toPt.y - half, box, box);

    ctx.strokeStyle = palette.highlightSelected;
    ctx.lineWidth = 2;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const cx = toPt.x + sx * half;
      const cy = toPt.y + sy * half;
      ctx.beginPath();
      ctx.moveTo(cx, cy - sy * bLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx - sx * bLen, cy);
      ctx.stroke();
    }
  }

  // 5. Legal move indicators
  const pieceRadius = Math.max(15, cellSize * 0.425);
  for (const target of legalTargets) {
    const pt = boardToCanvasPoint(target);
    const hasEnemy = board[target.row][target.col] !== null;
    ctx.save();
    if (hasEnemy) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pieceRadius + 4, 0, Math.PI * 2);
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = palette.captureRing;
      ctx.setLineDash([7, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(6.5, cellSize * 0.165), 0, Math.PI * 2);
      ctx.fillStyle = palette.legalDot;
      ctx.globalAlpha = 0.24;
      ctx.fill();
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(4, cellSize * 0.095), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. Static Pieces
  const checkedKingPos = inCheckSide ? findKingPosition(board, inCheckSide) : null;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (slideAnim && slideAnim.to.row === r && slideAnim.to.col === c) continue;
      if (dragState.active && dragState.hasMoved && dragState.from?.row === r && dragState.from?.col === c) {
        continue;
      }
      const pt = boardToCanvasPoint({ row: r, col: c });
      const isSel = selectedSquare?.row === r && selectedSquare?.col === c;
      const isCheckTarget =
        checkedKingPos !== null && checkedKingPos.row === r && checkedKingPos.col === c;
      drawTactileXiangqiPiece(ctx, piece, pt.x, pt.y, pieceRadius, palette, {
        isSelected: isSel,
        isCheckTarget,
        pulsePhase: animTime * 5,
      });
    }
  }

  // 8. Sliding piece
  if (slideAnim) {
    const fromPt = boardToCanvasPoint(slideAnim.from);
    const toPt = boardToCanvasPoint(slideAnim.to);
    const t = 1 - Math.pow(1 - Math.min(1, slideAnim.progress), 3);
    const ix = fromPt.x + (toPt.x - fromPt.x) * t;
    const iy = fromPt.y + (toPt.y - fromPt.y) * t;
    drawTactileXiangqiPiece(ctx, slideAnim.piece, ix, iy, pieceRadius * 1.05, palette, {
      isLifted: true,
    });
  }

  // 9. Dragged piece
  if (dragState.active && dragState.hasMoved && dragState.piece) {
    drawTactileXiangqiPiece(
      ctx,
      dragState.piece,
      dragState.canvasX,
      dragState.canvasY,
      pieceRadius * 1.12,
      palette,
      { isSelected: true, isLifted: true }
    );
  }

  // 10. Hint arrow (rendered above static pieces so capture arrowheads remain crisp)
  if (hintMove) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    drawGlowHintArrow(
      ctx,
      boardToCanvasPoint(hintMove.from),
      boardToCanvasPoint(hintMove.to),
      palette.highlightHint,
      cellSize
    );
    ctx.restore();
  }

  // 11. Shockwave Rings (captures / check)
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

  // 11. Pooled particles
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
