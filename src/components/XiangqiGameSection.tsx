import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  Flag,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BOARD_COLS,
  BOARD_ROWS,
  BoardCoord,
  createInitialBoard,
  evaluateGameResult,
  executeMove,
  findBestXiangqiMove,
  findKingPosition,
  getLegalMovesForPiece,
  getOppositeSide,
  isSideInCheck,
  PIECE_DISPLAY_INFO,
  PIECE_MATERIAL_VALUE,
  XiangqiBoard,
  XiangqiDifficulty,
  XiangqiGameResult,
  XiangqiMove,
  XiangqiPiece,
  XiangqiSide,
} from '../utils/xiangqiEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';
type BoardThemeId = 'wood' | 'ink' | 'jade';

interface XiangqiGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

interface BoardThemePalette {
  id: BoardThemeId;
  label: string;
  outerFrame: string;
  boardSurface: string;
  gridLine: string;
  riverBg: string;
  riverText: string;
  redDiscBg: string;
  redDiscRing: string;
  redText: string;
  blackDiscBg: string;
  blackDiscRing: string;
  blackText: string;
  highlightSelected: string;
  highlightLastMove: string;
  highlightHint: string;
  legalDot: string;
  captureRing: string;
}

const BOARD_THEMES: Record<BoardThemeId, BoardThemePalette> = {
  wood: {
    id: 'wood',
    label: 'Gỗ Hương',
    outerFrame: '#4A2B16',
    boardSurface: '#E5C493',
    gridLine: '#5A361C',
    riverBg: 'rgba(130, 82, 42, 0.08)',
    riverText: '#5A361C',
    redDiscBg: '#FFF8EC',
    redDiscRing: '#B91C1C',
    redText: '#B91C1C',
    blackDiscBg: '#F4F1EA',
    blackDiscRing: '#1E293B',
    blackText: '#0F172A',
    highlightSelected: '#D97706',
    highlightLastMove: 'rgba(217, 119, 6, 0.35)',
    highlightHint: '#0284C7',
    legalDot: 'rgba(22, 163, 74, 0.85)',
    captureRing: '#DC2626',
  },
  ink: {
    id: 'ink',
    label: 'Thủy Mặc',
    outerFrame: '#1C1917',
    boardSurface: '#F5EFE3',
    gridLine: '#3F3A36',
    riverBg: 'rgba(41, 37, 36, 0.05)',
    riverText: '#44403C',
    redDiscBg: '#FBF7EE',
    redDiscRing: '#9E2A2B',
    redText: '#9E2A2B',
    blackDiscBg: '#F4F2EE',
    blackDiscRing: '#1C1917',
    blackText: '#1C1917',
    highlightSelected: '#B48332',
    highlightLastMove: 'rgba(180, 131, 50, 0.3)',
    highlightHint: '#0369A1',
    legalDot: 'rgba(21, 128, 61, 0.85)',
    captureRing: '#9E2A2B',
  },
  jade: {
    id: 'jade',
    label: 'Ngọc Bích',
    outerFrame: '#0D2E23',
    boardSurface: '#18543F',
    gridLine: '#D4B46A',
    riverBg: 'rgba(13, 46, 35, 0.38)',
    riverText: '#E7CB83',
    redDiscBg: '#FEF7E7',
    redDiscRing: '#C81E1E',
    redText: '#B91C1C',
    blackDiscBg: '#EBF2EE',
    blackDiscRing: '#0F172A',
    blackText: '#0B1320',
    highlightSelected: '#FBBF24',
    highlightLastMove: 'rgba(251, 191, 36, 0.32)',
    highlightHint: '#38BDF8',
    legalDot: '#34D399',
    captureRing: '#F87171',
  },
};

const DIFFICULTY_LABELS: Record<XiangqiDifficulty, { name: string; sub: string }> = {
  easy: { name: 'Nhập Môn', sub: 'Thoải mái · Dễ' },
  medium: { name: 'Kỳ Thủ', sub: 'Cân bằng · Nhanh' },
  hard: { name: 'Đại Sư', sub: 'Sâu · Thử thách' },
};

interface Particle {
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

interface SlideAnimState {
  piece: XiangqiPiece;
  from: BoardCoord;
  to: BoardCoord;
  progress: number;
}

interface SnapshotHistoryItem {
  board: XiangqiBoard;
  sideToMove: XiangqiSide;
  move: XiangqiMove | null;
  pliesWithoutCapture: number;
}

const PARTICLE_POOL_SIZE = 32;

function playXiangqiSound(
  type: 'move' | 'capture' | 'check' | 'win' | 'lose',
  enabled: boolean,
  audioCtxRef: { current: AudioContext | null }
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const playTone = (
      freq: number,
      endFreq: number,
      duration: number,
      gainVal: number,
      wave: OscillatorType = 'triangle',
      delay = 0
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + delay + duration);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(gainVal, now + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    };

    const pitchJitter = 0.94 + Math.random() * 0.12;
    if (type === 'move') {
      playTone(260 * pitchJitter, 110, 0.075, 0.16, 'triangle');
    } else if (type === 'capture') {
      playTone(340 * pitchJitter, 95, 0.11, 0.24, 'triangle');
      playTone(620 * pitchJitter, 240, 0.06, 0.11, 'sine');
    } else if (type === 'check') {
      playTone(523.25, 490, 0.22, 0.18, 'sine');
      playTone(784, 740, 0.28, 0.12, 'sine', 0.06);
    } else if (type === 'win') {
      playTone(523.25, 523.25, 0.16, 0.16, 'triangle', 0);
      playTone(659.25, 659.25, 0.16, 0.16, 'triangle', 0.12);
      playTone(783.99, 783.99, 0.26, 0.2, 'triangle', 0.24);
    } else if (type === 'lose') {
      playTone(392, 349.23, 0.18, 0.15, 'triangle', 0);
      playTone(293.66, 220, 0.3, 0.16, 'triangle', 0.15);
    }
  } catch {
    // Ignore audio context blocks
  }
}

export function XiangqiGameSection({ theme, onToggleTheme }: XiangqiGameSectionProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [difficulty, setDifficulty] = useState<XiangqiDifficulty>('medium');
  const [playerSide, setPlayerSide] = useState<XiangqiSide>('red');
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>('wood');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [board, setBoard] = useState<XiangqiBoard>(() => createInitialBoard());
  const [sideToMove, setSideToMove] = useState<XiangqiSide>('red');
  const [selectedSquare, setSelectedSquare] = useState<BoardCoord | null>(null);
  const [legalTargets, setLegalTargets] = useState<BoardCoord[]>([]);
  const [lastMove, setLastMove] = useState<XiangqiMove | null>(null);
  const [hintMove, setHintMove] = useState<XiangqiMove | null>(null);
  const [moveHistory, setMoveHistory] = useState<XiangqiMove[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotHistoryItem[]>(() => [
    { board: createInitialBoard(), sideToMove: 'red', move: null, pliesWithoutCapture: 0 },
  ]);
  const [pliesWithoutCapture, setPliesWithoutCapture] = useState(0);
  const [gameResult, setGameResult] = useState<XiangqiGameResult>({
    status: 'ongoing',
    reason: null,
    winner: null,
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<{ width: number; height: number; padX: number; padY: number; cellSize: number }>({
    width: 540,
    height: 600,
    padX: 34,
    padY: 36,
    cellSize: 58,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const matchTokenRef = useRef<number>(1);
  const aiTimerRef = useRef<number | null>(null);

  const slideAnimRef = useRef<SlideAnimState | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    hasMoved: boolean;
    from: BoardCoord | null;
    piece: XiangqiPiece | null;
    startClientX: number;
    startClientY: number;
    canvasX: number;
    canvasY: number;
  }>({
    active: false,
    hasMoved: false,
    from: null,
    piece: null,
    startClientX: 0,
    startClientY: 0,
    canvasX: 0,
    canvasY: 0,
  });

  const particlesRef = useRef<Particle[]>(
    Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 3,
      color: '#D97706',
    }))
  );
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const aiSide: XiangqiSide = getOppositeSide(playerSide);
  const isFlipped = playerSide === 'black';
  const palette = BOARD_THEMES[boardTheme];

  const inCheckSide: XiangqiSide | null = useMemo(() => {
    if (isSideInCheck(board, 'red')) return 'red';
    if (isSideInCheck(board, 'black')) return 'black';
    return null;
  }, [board]);

  const capturedStats = useMemo(() => {
    const byPlayer: XiangqiPiece[] = [];
    const byAi: XiangqiPiece[] = [];
    let playerGain = 0;
    let aiGain = 0;
    for (const m of moveHistory) {
      if (m.captured) {
        if (m.piece.side === playerSide) {
          byPlayer.push(m.captured);
          playerGain += PIECE_MATERIAL_VALUE[m.captured.type];
        } else {
          byAi.push(m.captured);
          aiGain += PIECE_MATERIAL_VALUE[m.captured.type];
        }
      }
    }
    return {
      byPlayer,
      byAi,
      delta: Math.round((playerGain - aiGain) / 100),
    };
  }, [moveHistory, playerSide]);

  // Mirror state to document.body.dataset.state while mounted
  useEffect(() => {
    document.body.dataset.state = gameState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [gameState]);

  // Match timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameState]);

  const clearAiTimer = useCallback(() => {
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
  }, []);

  const toDisplayCoord = useCallback(
    (coord: BoardCoord): { dr: number; dc: number } => {
      return isFlipped
        ? { dr: BOARD_ROWS - 1 - coord.row, dc: BOARD_COLS - 1 - coord.col }
        : { dr: coord.row, dc: coord.col };
    },
    [isFlipped]
  );

  const boardToCanvasPoint = useCallback(
    (coord: BoardCoord): { x: number; y: number } => {
      const { padX, padY, cellSize } = metricsRef.current;
      const { dr, dc } = toDisplayCoord(coord);
      return {
        x: padX + dc * cellSize,
        y: padY + dr * cellSize,
      };
    },
    [toDisplayCoord]
  );

  const screenToBoard = useCallback(
    (clientX: number, clientY: number): { coord: BoardCoord | null; cx: number; cy: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { coord: null, cx: 0, cy: 0 };
      const rect = canvas.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      const { padX, padY, cellSize } = metricsRef.current;
      const dc = Math.round((cx - padX) / cellSize);
      const dr = Math.round((cy - padY) / cellSize);
      if (dc < 0 || dc >= BOARD_COLS || dr < 0 || dr >= BOARD_ROWS) {
        return { coord: null, cx, cy };
      }
      const px = padX + dc * cellSize;
      const py = padY + dr * cellSize;
      const dist = Math.hypot(cx - px, cy - py);
      if (dist > cellSize * 0.56) {
        return { coord: null, cx, cy };
      }
      const coord: BoardCoord = isFlipped
        ? { row: BOARD_ROWS - 1 - dr, col: BOARD_COLS - 1 - dc }
        : { row: dr, col: dc };
      return { coord, cx, cy };
    },
    [isFlipped]
  );

  const spawnBurstParticles = useCallback(
    (coord: BoardCoord, color: string, count: number) => {
      const pt = boardToCanvasPoint(coord);
      const pool = particlesRef.current;
      let spawned = 0;
      for (let i = 0; i < pool.length && spawned < count; i++) {
        if (!pool[i].active) {
          const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.4;
          const speed = 55 + Math.random() * 115;
          pool[i].active = true;
          pool[i].x = pt.x;
          pool[i].y = pt.y;
          pool[i].vx = Math.cos(angle) * speed;
          pool[i].vy = Math.sin(angle) * speed;
          pool[i].life = 0;
          pool[i].maxLife = 0.28 + Math.random() * 0.2;
          pool[i].size = 2.2 + Math.random() * 2.5;
          pool[i].color = color;
          spawned++;
        }
      }
    },
    [boardToCanvasPoint]
  );

  const drawPieceOnCanvas = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      piece: XiangqiPiece,
      x: number,
      y: number,
      radius: number,
      options?: { isSelected?: boolean; isCheckTarget?: boolean; isLifted?: boolean }
    ) => {
      const isRed = piece.side === 'red';
      const discBg = isRed ? palette.redDiscBg : palette.blackDiscBg;
      const discRing = isRed ? palette.redDiscRing : palette.blackDiscRing;
      const textCol = isRed ? palette.redText : palette.blackText;
      const info = PIECE_DISPLAY_INFO[piece.side][piece.type];

      ctx.save();
      if (options?.isLifted) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 8;
      } else {
        ctx.shadowColor = 'rgba(15, 10, 5, 0.34)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2.5;
      }

      // Base rim thickness
      ctx.beginPath();
      ctx.arc(x, y + 1.5, radius, 0, Math.PI * 2);
      ctx.fillStyle = isRed ? '#8C4D3E' : '#334155';
      ctx.fill();

      ctx.shadowColor = 'transparent';

      // Main piece disc
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = discBg;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, radius * 0.08);
      ctx.strokeStyle = options?.isSelected
        ? palette.highlightSelected
        : options?.isCheckTarget
        ? '#EF4444'
        : discRing;
      ctx.stroke();

      // Inner engraved ring
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.81, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, radius * 0.045);
      ctx.strokeStyle = discRing;
      ctx.globalAlpha = 0.72;
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (options?.isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 3.5, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = palette.highlightSelected;
        ctx.stroke();
      } else if (options?.isCheckTarget) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#EF4444';
        ctx.stroke();
      }

      // Hanzi calligraphy character + subtle small Vietnamese helper label for accessibility
      ctx.fillStyle = textCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(radius * 0.96)}px "Noto Serif Display", "Cormorant Garamond", Georgia, serif`;
      ctx.fillText(info.hanzi, x, y - radius * 0.08);

      ctx.font = `600 ${Math.max(8, Math.round(radius * 0.3))}px "Plus Jakarta Sans", sans-serif`;
      ctx.globalAlpha = 0.78;
      ctx.fillText(info.shortVi.toUpperCase(), x, y + radius * 0.56);
      ctx.globalAlpha = 1;

      ctx.restore();
    },
    [palette]
  );

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, padX, padY, cellSize } = metricsRef.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Outer frame + inner board surface
    ctx.fillStyle = palette.outerFrame;
    ctx.fillRect(0, 0, width, height);

    const inset = Math.max(6, Math.round(cellSize * 0.16));
    ctx.fillStyle = palette.boardSurface;
    ctx.fillRect(inset, inset, width - inset * 2, height - inset * 2);

    const gridLeft = padX;
    const gridTop = padY;
    const gridRight = padX + (BOARD_COLS - 1) * cellSize;
    const gridBottom = padY + (BOARD_ROWS - 1) * cellSize;

    // Subtle river band highlight
    const riverY1 = gridTop + 4 * cellSize;
    ctx.fillStyle = palette.riverBg;
    ctx.fillRect(gridLeft, riverY1, gridRight - gridLeft, cellSize);

    // Outer double border
    ctx.strokeStyle = palette.gridLine;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(gridLeft - 4, gridTop - 4, gridRight - gridLeft + 8, gridBottom - gridTop + 8);

    // Grid horizontal lines (10)
    ctx.lineWidth = 1.25;
    for (let r = 0; r < BOARD_ROWS; r++) {
      const y = gridTop + r * cellSize;
      ctx.beginPath();
      ctx.moveTo(gridLeft, y);
      ctx.lineTo(gridRight, y);
      ctx.stroke();
    }

    // Grid vertical lines (9) — split cleanly across the river (except edge files 0 and 8)
    for (let c = 0; c < BOARD_COLS; c++) {
      const x = gridLeft + c * cellSize;
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

    // Palace diagonal lines (top & bottom)
    const drawPalaceCross = (topRow: number) => {
      const x1 = gridLeft + 3 * cellSize;
      const x2 = gridLeft + 5 * cellSize;
      const y1 = gridTop + topRow * cellSize;
      const y2 = gridTop + (topRow + 2) * cellSize;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.moveTo(x2, y1);
      ctx.lineTo(x1, y2);
      ctx.stroke();
    };
    drawPalaceCross(0);
    drawPalaceCross(7);

    // Cannon & Pawn traditional corner crosshairs
    const drawMarker = (r: number, c: number, drawLeft: boolean, drawRight: boolean) => {
      const cx = gridLeft + c * cellSize;
      const cy = gridTop + r * cellSize;
      const gap = Math.max(3, cellSize * 0.08);
      const len = Math.max(5, cellSize * 0.14);
      ctx.lineWidth = 1.15;
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

    // River inscription ("SỞ HÀ" · "HÁN GIỚI")
    ctx.fillStyle = palette.riverText;
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const riverFontSize = Math.max(12, Math.round(cellSize * 0.34));
    ctx.font = `600 ${riverFontSize}px "Cormorant Garamond", Georgia, serif`;
    const riverCenterY = riverY1 + cellSize * 0.5;
    ctx.fillText(isFlipped ? '漢 界 · HÁN GIỚI' : '楚 河 · SỞ HÀ', gridLeft + cellSize * 2, riverCenterY);
    ctx.fillText(isFlipped ? '楚 河 · SỞ HÀ' : '漢 界 · HÁN GIỚI', gridLeft + cellSize * 6, riverCenterY);
    ctx.globalAlpha = 1;

    // 2. Last move squares highlight
    if (lastMove) {
      const fromPt = boardToCanvasPoint(lastMove.from);
      const toPt = boardToCanvasPoint(lastMove.to);
      const box = cellSize * 0.78;
      ctx.strokeStyle = palette.highlightSelected;
      ctx.fillStyle = palette.highlightLastMove;
      ctx.lineWidth = 1.6;
      ctx.fillRect(fromPt.x - box / 2, fromPt.y - box / 2, box, box);
      ctx.fillRect(toPt.x - box / 2, toPt.y - box / 2, box, box);
      ctx.strokeRect(toPt.x - box / 2, toPt.y - box / 2, box, box);
    }

    // 3. Hint arrow highlight
    if (hintMove) {
      const fromPt = boardToCanvasPoint(hintMove.from);
      const toPt = boardToCanvasPoint(hintMove.to);
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

    // 4. Legal move indicators
    const pieceRadius = Math.max(15, cellSize * 0.425);
    for (const target of legalTargets) {
      const pt = boardToCanvasPoint(target);
      const hasEnemy = board[target.row][target.col] !== null;
      ctx.save();
      if (hasEnemy) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pieceRadius + 3.5, 0, Math.PI * 2);
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = palette.captureRing;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(5, cellSize * 0.14), 0, Math.PI * 2);
        ctx.fillStyle = palette.legalDot;
        ctx.fill();
      }
      ctx.restore();
    }

    // 5. Render static board pieces (skip currently dragged or sliding piece)
    const activeSlide = slideAnimRef.current;
    const activeDrag = dragStateRef.current;
    const checkedKingPos = inCheckSide ? findKingPosition(board, inCheckSide) : null;

    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const piece = board[r][c];
        if (!piece) continue;
        if (activeSlide && activeSlide.to.row === r && activeSlide.to.col === c) {
          continue;
        }
        if (
          activeDrag.active &&
          activeDrag.hasMoved &&
          activeDrag.from?.row === r &&
          activeDrag.from?.col === c
        ) {
          continue;
        }
        const pt = boardToCanvasPoint({ row: r, col: c });
        const isSel = selectedSquare?.row === r && selectedSquare?.col === c;
        const isCheckTarget =
          checkedKingPos !== null && checkedKingPos.row === r && checkedKingPos.col === c;
        drawPieceOnCanvas(ctx, piece, pt.x, pt.y, pieceRadius, {
          isSelected: isSel,
          isCheckTarget,
        });
      }
    }

    // 6. Sliding animated piece
    if (activeSlide) {
      const fromPt = boardToCanvasPoint(activeSlide.from);
      const toPt = boardToCanvasPoint(activeSlide.to);
      const t = 1 - Math.pow(1 - Math.min(1, activeSlide.progress), 3);
      const ix = fromPt.x + (toPt.x - fromPt.x) * t;
      const iy = fromPt.y + (toPt.y - fromPt.y) * t;
      drawPieceOnCanvas(ctx, activeSlide.piece, ix, iy, pieceRadius * 1.04, {
        isLifted: true,
      });
    }

    // 7. Dragged piece under finger/cursor
    if (activeDrag.active && activeDrag.hasMoved && activeDrag.piece) {
      drawPieceOnCanvas(
        ctx,
        activeDrag.piece,
        activeDrag.canvasX,
        activeDrag.canvasY,
        pieceRadius * 1.1,
        { isSelected: true, isLifted: true }
      );
    }

    // 8. Pooled particles
    const pool = particlesRef.current;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
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
  }, [
    board,
    boardToCanvasPoint,
    drawPieceOnCanvas,
    hintMove,
    inCheckSide,
    isFlipped,
    lastMove,
    legalTargets,
    palette,
    selectedSquare,
  ]);

  const renderCanvasRef = useRef(renderCanvas);
  renderCanvasRef.current = renderCanvas;

  const scheduleAnimationLoop = useCallback(() => {
    if (rafRef.current !== null) return;
    lastFrameTimeRef.current = performance.now();

    const tick = (now: number) => {
      const rawDt = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      let keepRunning = false;

      if (slideAnimRef.current) {
        slideAnimRef.current.progress += dt / 0.16;
        if (slideAnimRef.current.progress >= 1) {
          slideAnimRef.current = null;
        } else {
          keepRunning = true;
        }
      }

      const pool = particlesRef.current;
      for (let i = 0; i < pool.length; i++) {
        const p = pool[i];
        if (!p.active) continue;
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
          keepRunning = true;
        }
      }

      if (dragStateRef.current.active && dragStateRef.current.hasMoved) {
        keepRunning = true;
      }

      renderCanvasRef.current();

      if (keepRunning) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ResizeObserver for crisp multi-device Canvas scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMetrics = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width));
      const height = Math.round((width * 10) / 9);
      const cellSize = (width * 0.86) / (BOARD_COLS - 1);
      const padX = (width - (BOARD_COLS - 1) * cellSize) / 2;
      const padY = (height - (BOARD_ROWS - 1) * cellSize) / 2;
      metricsRef.current = { width, height, padX, padY, cellSize };
      renderCanvas();
    };

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderCanvas]);

  // Render whenever React state affecting board changes
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, theme]);

  // Cleanup animation & timers on unmount
  useEffect(() => {
    return () => {
      clearAiTimer();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [clearAiTimer]);

  // Focus-loss drag release hygiene
  useEffect(() => {
    const releaseDrag = () => {
      if (dragStateRef.current.active) {
        dragStateRef.current.active = false;
        dragStateRef.current.hasMoved = false;
        dragStateRef.current.piece = null;
        renderCanvas();
      }
    };
    window.addEventListener('blur', releaseDrag);
    document.addEventListener('visibilitychange', releaseDrag);
    return () => {
      window.removeEventListener('blur', releaseDrag);
      document.removeEventListener('visibilitychange', releaseDrag);
    };
  }, [renderCanvas]);

  const commitMove = useCallback(
    (
      currentBoard: XiangqiBoard,
      from: BoardCoord,
      to: BoardCoord,
      currentPliesWithoutCap: number,
      currentSnapshots: SnapshotHistoryItem[],
      animateSlide: boolean
    ) => {
      const executed = executeMove(currentBoard, from, to);
      if (!executed) return false;

      const { nextBoard, move } = executed;
      const nextPlies = move.captured ? 0 : currentPliesWithoutCap + 1;
      const nextSide = getOppositeSide(move.piece.side);
      const nextResult = evaluateGameResult(nextBoard, nextSide, nextPlies);

      if (animateSlide && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        slideAnimRef.current = {
          piece: move.piece,
          from,
          to,
          progress: 0,
        };
      }

      if (move.captured) {
        spawnBurstParticles(to, move.captured.side === 'red' ? '#EF4444' : '#F59E0B', 20);
      }
      if (move.isCheck) {
        const kingCoord = findKingPosition(nextBoard, nextSide);
        if (kingCoord) {
          spawnBurstParticles(kingCoord, '#DC2626', 24);
        }
      }

      if (nextResult.status !== 'ongoing') {
        const playerWon = nextResult.winner === playerSide;
        playXiangqiSound(
          nextResult.winner ? (playerWon ? 'win' : 'lose') : 'check',
          soundEnabled,
          audioCtxRef
        );
      } else if (move.isCheck) {
        playXiangqiSound('check', soundEnabled, audioCtxRef);
      } else if (move.captured) {
        playXiangqiSound('capture', soundEnabled, audioCtxRef);
      } else {
        playXiangqiSound('move', soundEnabled, audioCtxRef);
      }

      setBoard(nextBoard);
      setSideToMove(nextSide);
      setLastMove(move);
      setHintMove(null);
      setSelectedSquare(null);
      setLegalTargets([]);
      setPliesWithoutCapture(nextPlies);
      setMoveHistory((prev) => [...prev, move]);
      setSnapshots([
        ...currentSnapshots,
        {
          board: nextBoard,
          sideToMove: nextSide,
          move,
          pliesWithoutCapture: nextPlies,
        },
      ]);
      setGameResult(nextResult);

      if (nextResult.status !== 'ongoing') {
        setGameState('gameover');
      }

      scheduleAnimationLoop();
      return true;
    },
    [playerSide, scheduleAnimationLoop, soundEnabled, spawnBurstParticles]
  );

  // Start / Restart fresh match
  const startNewGame = useCallback(
    (overrideSide?: XiangqiSide) => {
      clearAiTimer();
      matchTokenRef.current += 1;
      const activePlayerSide = overrideSide ?? playerSide;
      const freshBoard = createInitialBoard();

      setBoard(freshBoard);
      setSideToMove('red');
      setSelectedSquare(null);
      setLegalTargets([]);
      setLastMove(null);
      setHintMove(null);
      setMoveHistory([]);
      setSnapshots([
        { board: freshBoard, sideToMove: 'red', move: null, pliesWithoutCapture: 0 },
      ]);
      setPliesWithoutCapture(0);
      setGameResult({ status: 'ongoing', reason: null, winner: null });
      setElapsedSeconds(0);
      setIsAiThinking(activePlayerSide === 'black');
      setGameState('playing');
      slideAnimRef.current = null;
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [clearAiTimer, playerSide]
  );

  // Trigger AI move automatically whenever it's AI's turn in 'playing' state
  useEffect(() => {
    if (gameState !== 'playing' || gameResult.status !== 'ongoing') {
      setIsAiThinking(false);
      return;
    }
    if (sideToMove !== aiSide) {
      setIsAiThinking(false);
      return;
    }

    const activeToken = matchTokenRef.current;
    setIsAiThinking(true);
    clearAiTimer();

    aiTimerRef.current = window.setTimeout(() => {
      if (matchTokenRef.current !== activeToken) return;
      const aiMove = findBestXiangqiMove(board, aiSide, difficulty);
      setIsAiThinking(false);
      if (!aiMove || matchTokenRef.current !== activeToken) return;
      commitMove(board, aiMove.from, aiMove.to, pliesWithoutCapture, snapshots, true);
    }, 420);

    return () => clearAiTimer();
  }, [
    aiSide,
    board,
    clearAiTimer,
    commitMove,
    difficulty,
    gameResult.status,
    gameState,
    pliesWithoutCapture,
    sideToMove,
    snapshots,
  ]);

  const handleUndoMove = useCallback(() => {
    if (gameState !== 'playing' && gameState !== 'gameover') return;
    if (snapshots.length <= 1) return;

    clearAiTimer();
    matchTokenRef.current += 1;
    setIsAiThinking(false);

    // Step back until it's player's turn again (or initial state)
    let targetIdx = snapshots.length - 1;
    if (snapshots[targetIdx].sideToMove === playerSide && targetIdx >= 2) {
      targetIdx -= 2;
    } else if (snapshots[targetIdx].sideToMove !== playerSide) {
      targetIdx -= 1;
    } else {
      targetIdx = 0;
    }
    targetIdx = Math.max(0, targetIdx);

    const restored = snapshots[targetIdx];
    const truncatedHistory = moveHistory.slice(0, targetIdx);
    const truncatedSnapshots = snapshots.slice(0, targetIdx + 1);

    setBoard(restored.board);
    setSideToMove(restored.sideToMove);
    setLastMove(restored.move);
    setPliesWithoutCapture(restored.pliesWithoutCapture);
    setMoveHistory(truncatedHistory);
    setSnapshots(truncatedSnapshots);
    setSelectedSquare(null);
    setLegalTargets([]);
    setHintMove(null);
    setGameResult({ status: 'ongoing', reason: null, winner: null });
    setGameState('playing');
  }, [clearAiTimer, gameState, moveHistory, playerSide, snapshots]);

  const handleShowHint = useCallback(() => {
    if (gameState !== 'playing' || sideToMove !== playerSide || isAiThinking) return;
    const best = findBestXiangqiMove(board, playerSide, 'medium');
    if (best) {
      setHintMove(best);
      setSelectedSquare(best.from);
      setLegalTargets(getLegalMovesForPiece(board, best.from.row, best.from.col));
    }
  }, [board, gameState, isAiThinking, playerSide, sideToMove]);

  const handleResign = useCallback(() => {
    if (gameState !== 'playing') return;
    clearAiTimer();
    matchTokenRef.current += 1;
    setIsAiThinking(false);
    setGameResult({
      status: aiSide === 'red' ? 'red_win' : 'black_win',
      reason: 'checkmate',
      winner: aiSide,
    });
    playXiangqiSound('lose', soundEnabled, audioCtxRef);
    setGameState('gameover');
  }, [aiSide, clearAiTimer, gameState, soundEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (gameState === 'title' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        startNewGame();
        return;
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (gameState === 'playing') {
          e.preventDefault();
          clearAiTimer();
          setGameState('paused');
        } else if (gameState === 'paused') {
          e.preventDefault();
          setGameState('playing');
        }
        return;
      }
      if ((e.key === 'm' || e.key === 'M') && gameState !== 'title') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
      } else if ((e.key === 'z' || e.key === 'Z') && gameState === 'playing') {
        e.preventDefault();
        handleUndoMove();
      } else if ((e.key === 'h' || e.key === 'H') && gameState === 'playing') {
        e.preventDefault();
        handleShowHint();
      } else if ((e.key === 'r' || e.key === 'R') && (gameState === 'playing' || gameState === 'paused')) {
        e.preventDefault();
        startNewGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearAiTimer, gameState, handleShowHint, handleUndoMove, startNewGame]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || sideToMove !== playerSide || isAiThinking) return;
    const { coord, cx, cy } = screenToBoard(e.clientX, e.clientY);
    if (!coord) return;

    const clickedPiece = board[coord.row][coord.col];

    // If a piece is already selected and user taps a valid destination square
    if (
      selectedSquare &&
      legalTargets.some((t) => t.row === coord.row && t.col === coord.col)
    ) {
      commitMove(board, selectedSquare, coord, pliesWithoutCapture, snapshots, true);
      return;
    }

    // Select friendly piece and arm potential drag
    if (clickedPiece && clickedPiece.side === playerSide) {
      const moves = getLegalMovesForPiece(board, coord.row, coord.col);
      setSelectedSquare(coord);
      setLegalTargets(moves);
      setHintMove(null);

      dragStateRef.current = {
        active: true,
        hasMoved: false,
        from: coord,
        piece: clickedPiece,
        startClientX: e.clientX,
        startClientY: e.clientY,
        canvasX: cx,
        canvasY: cy,
      };
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } else {
      setSelectedSquare(null);
      setLegalTargets([]);
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    drag.canvasX = e.clientX - rect.left;
    drag.canvasY = e.clientY - rect.top;

    if (!drag.hasMoved) {
      const dist = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY);
      if (dist > 6) {
        drag.hasMoved = true;
        scheduleAnimationLoop();
      }
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (!drag.active) return;

    const wasDragged = drag.hasMoved;
    const origin = drag.from;

    drag.active = false;
    drag.hasMoved = false;
    drag.piece = null;
    drag.from = null;

    if (wasDragged && origin) {
      const { coord } = screenToBoard(e.clientX, e.clientY);
      if (coord && legalTargets.some((t) => t.row === coord.row && t.col === coord.col)) {
        commitMove(board, origin, coord, pliesWithoutCapture, snapshots, false);
        return;
      }
    }
    renderCanvas();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const playerIsRed = playerSide === 'red';
  const resultHeadline =
    gameResult.winner === playerSide
      ? 'Chiến Thắng Tuyệt Đối!'
      : gameResult.winner === aiSide
      ? 'Máy AI Giành Phần Thắng'
      : 'Ván Cờ Hòa';

  const resultSubtext =
    gameResult.reason === 'checkmate'
      ? gameResult.winner === playerSide
        ? 'Bạn đã chiếu bí Tướng đối phương với thế trận sắc bén.'
        : 'Tướng của bạn đã bị chiếu bí hoặc nhận thua.'
      : gameResult.reason === 'stalemate'
      ? 'Một bên đã hết toàn bộ nước đi hợp lệ (Luật Khốn Bí Cờ Tướng).'
      : gameResult.reason === 'fifty_move_rule'
      ? 'Đạt giới hạn 50 lượt không ăn quân — ván đấu xử hòa.'
      : 'Hai bên không còn quân tấn công để chiếu bí — xử hòa.';

  return (
    <section
      id="xiangqi-game"
      aria-label="Trò chơi Cờ Tướng 2D Đấu Với Máy AI"
      data-game-state={gameState}
      data-turn={sideToMove}
      data-difficulty={difficulty}
      data-board-theme={boardTheme}
      className="pt-3 sm:pt-4 pb-6 space-y-3.5 sm:space-y-4"
    >
      {/* Top Game Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#DCE6F2] dark:border-[#1E2E4A] pb-3">
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#0284C7] dark:text-[#38BDF8]">
            Khu Giải Trí Chiến Thuật · 2D Canvas Engine
          </p>
          <h1 className="font-display text-xl sm:text-3xl font-bold text-[#070B14] dark:text-[#F1F5F9]">
            Cờ Tướng Đối Kháng AI
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Board Material Selector */}
          <div
            role="group"
            aria-label="Chọn chất liệu bàn cờ"
            className="inline-flex items-center p-1 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]"
          >
            {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((tid) => (
              <button
                key={tid}
                type="button"
                onClick={() => setBoardTheme(tid)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  boardTheme === tid
                    ? 'bg-[#0A192F] text-white dark:bg-[#0284C7]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white'
                }`}
              >
                {BOARD_THEMES[tid].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Tắt âm thanh bàn cờ' : 'Bật âm thanh bàn cờ'}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#0284C7]" /> : <VolumeX className="w-4 h-4 text-[#64748B]" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Âm Bật' : 'Tắt Tiếng'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Game Shell (Desktop: Board Left/Center + HUD Dock Right; Mobile: Stacked) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Board Column */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center gap-2.5">
          {/* Top Compact Opponent Strip (Mobile & Desktop) */}
          <div className="w-full max-w-[500px] xl:max-w-[520px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-display font-bold text-xs sm:text-sm border-2 shrink-0 ${
                  aiSide === 'black'
                    ? 'bg-[#F4F2EE] text-[#0F172A] border-[#1E293B]'
                    : 'bg-[#FFF8EC] text-[#B91C1C] border-[#B91C1C]'
                }`}
              >
                {aiSide === 'black' ? '將' : '帥'}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] truncate">
                  Máy AI · {DIFFICULTY_LABELS[difficulty].name}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {isAiThinking
                    ? 'Đang tính nước đi...'
                    : sideToMove === aiSide && gameState === 'playing'
                    ? 'Đến lượt Máy'
                    : `Quân ${aiSide === 'black' ? 'Đen' : 'Đỏ'} · Ăn ${capturedStats.byAi.length} quân`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inCheckSide === aiSide && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Bị Chiếu
                </span>
              )}
              <span className="font-mono text-xs sm:text-sm font-semibold tabular-nums px-2.5 py-1 rounded-lg bg-[#F1F5F9] dark:bg-[#13203A] text-[#070B14] dark:text-[#E2E8F0]">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Interactive 2D Board Stage + Overlays */}
          <div
            ref={containerRef}
            className="relative w-full max-w-[500px] xl:max-w-[520px] aspect-[9/10] mx-auto rounded-2xl overflow-hidden shadow-[0_20px_50px_-18px_rgba(7,11,20,0.38)] border-2 border-[#3E2718] dark:border-[#2B3E5E] select-none touch-none"
          >
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="Bàn cờ tướng 2D tương tác 9x10"
              className="block w-full h-full cursor-pointer touch-none"
            />

            {/* Title Screen Modal Overlay (Solid rgba surface — NO backdrop-blur over Canvas) */}
            {gameState === 'title' && (
              <div
                role="region"
                aria-label="Màn hình bắt đầu Cờ Tướng"
                className="absolute inset-0 flex flex-col items-center justify-center p-3.5 sm:p-7 text-center overflow-y-auto"
                style={{ backgroundColor: 'rgba(10, 15, 28, 0.85)' }}
              >
                <div className="w-full max-w-md space-y-2.5 sm:space-y-4 text-white">
                  {/* Custom SVG Title Emblem */}
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <svg
                      viewBox="0 0 120 56"
                      className="w-20 h-10 sm:w-28 sm:h-13"
                      aria-hidden="true"
                    >
                      <circle cx="40" cy="28" r="22" fill="#FFF8EC" stroke="#B91C1C" strokeWidth="3" />
                      <circle cx="40" cy="28" r="17" fill="none" stroke="#B91C1C" strokeWidth="1" opacity="0.7" />
                      <text
                        x="40"
                        y="34"
                        textAnchor="middle"
                        fontSize="20"
                        fontWeight="700"
                        fill="#B91C1C"
                        fontFamily="serif"
                      >
                        帥
                      </text>
                      <circle cx="80" cy="28" r="22" fill="#F4F2EE" stroke="#0F172A" strokeWidth="3" />
                      <circle cx="80" cy="28" r="17" fill="none" stroke="#334155" strokeWidth="1" opacity="0.7" />
                      <text
                        x="80"
                        y="34"
                        textAnchor="middle"
                        fontSize="20"
                        fontWeight="700"
                        fill="#0F172A"
                        fontFamily="serif"
                      >
                        將
                      </text>
                    </svg>
                    <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
                      Sở Hà · Hán Giới
                    </h2>
                    <p className="hidden sm:block text-sm text-slate-300">
                      Đấu trí Cờ Tướng 2D cùng trí tuệ nhân tạo Alpha-Beta trên mọi thiết bị
                    </p>
                  </div>

                  {/* Difficulty Selection */}
                  <div className="space-y-1 text-left">
                    <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-amber-300">
                      1. Chọn Trình Độ Máy
                    </p>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {(['easy', 'medium', 'hard'] as XiangqiDifficulty[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`px-1.5 py-1.5 sm:px-2 sm:py-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            difficulty === lvl
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-[11px] sm:text-sm">{DIFFICULTY_LABELS[lvl].name}</div>
                          <div className="text-[9px] sm:text-[10px] opacity-80">{DIFFICULTY_LABELS[lvl].sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Side Selection */}
                  <div className="space-y-1 text-left">
                    <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-amber-300">
                      2. Chọn Phe Thi Đấu
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setPlayerSide('red')}
                        className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-[11px] sm:text-sm font-semibold transition-all cursor-pointer ${
                          playerIsRed
                            ? 'bg-red-700 text-white border-red-400'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        Quân Đỏ (Đi Trước)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerSide('black')}
                        className={`px-2 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-[11px] sm:text-sm font-semibold transition-all cursor-pointer ${
                          !playerIsRed
                            ? 'bg-slate-100 text-slate-950 border-white'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        Quân Đen (Đi Sau)
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-start="true"
                    onClick={() => startNewGame()}
                    className="w-full py-2.5 sm:py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base inline-flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    Bắt Đầu Ván Đấu
                  </button>

                  <p className="text-[10px] sm:text-[11px] text-slate-300/90">
                    Chạm hoặc kéo thả quân · Enter Bắt đầu · Z Đi lại · H Gợi ý
                  </p>
                </div>
              </div>
            )}

            {/* Pause Modal Overlay */}
            {gameState === 'paused' && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Trò chơi đang tạm dừng"
                className="absolute inset-0 flex items-center justify-center p-5"
                style={{ backgroundColor: 'rgba(10, 15, 28, 0.82)' }}
              >
                <div className="w-full max-w-xs rounded-2xl bg-[#111827] border border-slate-700 p-6 text-center space-y-4 text-white shadow-2xl">
                  <p className="text-xs font-mono uppercase tracking-widest text-amber-400">
                    Tạm Dừng Ván Cờ
                  </p>
                  <h3 className="font-display text-2xl font-bold">Đang Nghỉ Giữa Hiệp</h3>
                  <div className="grid grid-cols-2 gap-2 text-left bg-slate-900 rounded-xl p-3 border border-slate-800">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Tổng Nước</div>
                      <div className="font-mono text-base font-bold tabular-nums">
                        {moveHistory.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Thời Gian</div>
                      <div className="font-mono text-base font-bold tabular-nums">
                        {formatDuration(elapsedSeconds)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setGameState('playing')}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
                    >
                      Tiếp Tục Đánh (P)
                    </button>
                    <button
                      type="button"
                      onClick={() => startNewGame()}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
                    >
                      Chơi Lại Từ Đầu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAiTimer();
                        setGameState('title');
                      }}
                      className="w-full py-2 px-4 rounded-xl text-slate-300 hover:text-white text-xs cursor-pointer"
                    >
                      Về Màn Hình Cấu Hình
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Game Over / Victory Modal Overlay */}
            {gameState === 'gameover' && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Kết quả ván Cờ Tướng"
                className="absolute inset-0 flex items-center justify-center p-5"
                style={{ backgroundColor: 'rgba(10, 15, 28, 0.85)' }}
              >
                <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-amber-500/40 p-6 text-center space-y-4 text-white shadow-2xl">
                  <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                      {resultHeadline}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">{resultSubtext}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-900 rounded-xl p-3 border border-slate-800 text-center">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Số Nước</div>
                      <div className="font-mono text-base font-bold tabular-nums">
                        {moveHistory.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Thời Gian</div>
                      <div className="font-mono text-base font-bold tabular-nums">
                        {formatDuration(elapsedSeconds)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400">Quân Ăn</div>
                      <div className="font-mono text-base font-bold tabular-nums">
                        {capturedStats.byPlayer.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      data-start="true"
                      onClick={() => startNewGame()}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
                    >
                      Chơi Ván Mới
                    </button>
                    <button
                      type="button"
                      onClick={() => setGameState('title')}
                      className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm cursor-pointer"
                    >
                      Đổi Độ Khó
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Compact Player Strip */}
          <div className="w-full max-w-[500px] xl:max-w-[520px] flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-display font-bold text-xs sm:text-sm border-2 shrink-0 ${
                  playerIsRed
                    ? 'bg-[#FFF8EC] text-[#B91C1C] border-[#B91C1C]'
                    : 'bg-[#F4F2EE] text-[#0F172A] border-[#1E293B]'
                }`}
              >
                {playerIsRed ? '帥' : '將'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] truncate">
                  Bạn · Quân {playerIsRed ? 'Đỏ' : 'Đen'}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {gameState === 'playing' && sideToMove === playerSide
                    ? 'Đến lượt bạn đi'
                    : `Đã ăn ${capturedStats.byPlayer.length} quân${
                        capturedStats.delta !== 0
                          ? ` (${capturedStats.delta > 0 ? `+${capturedStats.delta}` : capturedStats.delta}đ)`
                          : ''
                      }`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inCheckSide === playerSide && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Chiếu Tướng!
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  sideToMove === playerSide && gameState === 'playing'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#F1F5F9] dark:bg-[#13203A] text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                {gameState === 'title'
                  ? 'Chờ Bắt Đầu'
                  : sideToMove === playerSide
                  ? 'Lượt Của Bạn'
                  : 'Lượt Máy AI'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Control Dock & Live Match Log (Stacks cleanly below board on Mobile/Tablet) */}
        <aside className="lg:col-span-5 xl:col-span-5 space-y-4">
          {/* Action Toolbar */}
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#070B14] dark:text-[#F1F5F9]">
                Bảng Điều Khiển Ván Đấu
              </h2>
              <span className="font-mono text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                Nước #{moveHistory.length}
              </span>
            </div>

            {/* 44px+ Tactile Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleUndoMove}
                disabled={snapshots.length <= 1 || gameState === 'title'}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Undo2 className="w-4 h-4 text-[#0284C7]" />
                Đi Lại (Z)
              </button>

              <button
                type="button"
                onClick={handleShowHint}
                disabled={gameState !== 'playing' || sideToMove !== playerSide || isAiThinking}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Gợi Ý (H)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (gameState === 'playing') {
                    clearAiTimer();
                    setGameState('paused');
                  } else if (gameState === 'paused') {
                    setGameState('playing');
                  }
                }}
                disabled={gameState !== 'playing' && gameState !== 'paused'}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {gameState === 'paused' ? (
                  <>
                    <Play className="w-4 h-4 text-emerald-500" />
                    Tiếp Tục
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-[#475569] dark:text-[#94A3B8]" />
                    Tạm Dừng
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => startNewGame()}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Ván Mới (R)
              </button>
            </div>

            {/* Quick Difficulty + Side Switcher during play */}
            <div className="pt-2 border-t border-[#DCE6F2] dark:border-[#1E2E4A] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {(['easy', 'medium', 'hard'] as XiangqiDifficulty[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-[#0284C7] text-white'
                        : 'bg-[#F1F5F9] dark:bg-[#13203A] text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white'
                    }`}
                  >
                    {DIFFICULTY_LABELS[lvl].name}
                  </button>
                ))}
              </div>

              {gameState === 'playing' && (
                <button
                  type="button"
                  onClick={handleResign}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  Xin Thua
                </button>
              )}
            </div>
          </div>

          {/* Captured Pieces & Move Notation History */}
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0284C7]" />
                Biên Bản Nước Đi
              </h3>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {selectedSquare && board[selectedSquare.row][selectedSquare.col]
                  ? `Đang chọn: ${
                      PIECE_DISPLAY_INFO[board[selectedSquare.row][selectedSquare.col]!.side][
                        board[selectedSquare.row][selectedSquare.col]!.type
                      ].viName
                    } (${legalTargets.length} ô đi)`
                  : 'Chọn quân để xem nước hợp lệ'}
              </span>
            </div>

            {/* Captured Badges */}
            {(capturedStats.byPlayer.length > 0 || capturedStats.byAi.length > 0) && (
              <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C33]">
                <div>
                  <div className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1">
                    Bạn đã ăn ({capturedStats.byPlayer.length}):
                  </div>
                  <div className="flex flex-wrap gap-1 font-display font-bold text-sm">
                    {capturedStats.byPlayer.length > 0 ? (
                      capturedStats.byPlayer.map((p, idx) => (
                        <span
                          key={`${p.id}-${idx}`}
                          className={
                            p.side === 'red'
                              ? 'text-[#B91C1C]'
                              : 'text-[#0F172A] dark:text-slate-200'
                          }
                        >
                          {PIECE_DISPLAY_INFO[p.side][p.type].hanzi}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-sans font-normal text-[#94A3B8]">Chưa có</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1">
                    Máy đã ăn ({capturedStats.byAi.length}):
                  </div>
                  <div className="flex flex-wrap gap-1 font-display font-bold text-sm">
                    {capturedStats.byAi.length > 0 ? (
                      capturedStats.byAi.map((p, idx) => (
                        <span
                          key={`${p.id}-${idx}`}
                          className={
                            p.side === 'red'
                              ? 'text-[#B91C1C]'
                              : 'text-[#0F172A] dark:text-slate-200'
                          }
                        >
                          {PIECE_DISPLAY_INFO[p.side][p.type].hanzi}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-sans font-normal text-[#94A3B8]">Chưa có</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Move List */}
            <div className="max-h-56 overflow-y-auto pr-1 space-y-1 text-xs">
              {moveHistory.length === 0 ? (
                <p className="py-6 text-center text-[#64748B] dark:text-[#94A3B8]">
                  Chưa có nước đi nào. Quân Đỏ luôn đi trước theo luật Cờ Tướng.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {moveHistory.map((m, idx) => (
                    <div
                      key={`${idx}-${m.notation}`}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${
                        idx === moveHistory.length - 1
                          ? 'border-[#0284C7] bg-[#EFF6FF] dark:bg-[#102341]'
                          : 'border-transparent bg-[#F8FAFC] dark:bg-[#111C33]'
                      }`}
                    >
                      <span className="font-mono text-[#64748B] dark:text-[#94A3B8] tabular-nums mr-1.5">
                        {Math.floor(idx / 2) + 1}
                        {idx % 2 === 0 ? '.' : '...'}
                      </span>
                      <span
                        className={`font-semibold truncate flex-1 ${
                          m.piece.side === 'red'
                            ? 'text-[#B91C1C] dark:text-rose-400'
                            : 'text-[#0F172A] dark:text-slate-200'
                        }`}
                      >
                        {m.notation}
                      </span>
                      {m.isCheck && (
                        <span className="ml-1 text-[10px] font-bold text-red-600 dark:text-rose-400 shrink-0">
                          Chiếu!
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Concise Rules Guide Card */}
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#0B1222] p-4 text-xs text-[#475569] dark:text-[#94A3B8] space-y-1.5">
            <p className="font-semibold text-[#070B14] dark:text-[#F1F5F9]">
              Luật Chuẩn & Tối Ưu Đa Thiết Bị
            </p>
            <p>
              Áp dụng đầy đủ luật Cờ Tướng: <strong>Chống lộ mặt Tướng</strong>,{' '}
              <strong>cản chân Mã</strong>, <strong>chắn mắt Tượng</strong>,{' '}
              <strong>Pháo nhảy 1 ngòi</strong> và <strong>Khốn bí xử thua</strong>. Bấm chọn quân
              hoặc kéo thả mượt mà bằng chuột lẫn cảm ứng điện thoại.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
