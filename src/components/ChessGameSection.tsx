import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowUpDown,
  Flag,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  Undo2,
  Users,
  Bot,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BOARD_SIZE,
  BoardCoord,
  CHESS_LEVELS,
  ChessDifficulty,
  ChessGameMode,
  ChessGameResult,
  ChessMove,
  ChessPiece,
  ChessPosition,
  ChessPromotionType,
  ChessSide,
  createInitialPosition,
  evaluateGameResult,
  executeMove,
  findBestChessMove,
  findKingPosition,
  getChessLevelConfig,
  getLegalMovesForPiece,
  getOppositeSide,
  getPositionRepetitionKey,
  isPromotionMove,
  isSideInCheck,
  PIECE_DISPLAY_INFO,
  PIECE_MATERIAL_VALUE,
} from '../utils/chessEngine.ts';
import {
  CHESS_BOARD_THEMES,
  ChessBoardMetrics,
  ChessBoardThemeId,
  ChessDragRenderState,
  ChessParticle,
  ChessShockwave,
  ChessSlideAnim,
  renderChessBoardCanvas,
} from '../utils/chessCanvasRenderer.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface ChessGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

interface SnapshotHistoryItem {
  position: ChessPosition;
  move: ChessMove | null;
  positionKey: string;
}

const PARTICLE_POOL_SIZE = 32;

const PROMOTION_OPTIONS: readonly { type: ChessPromotionType; label: string; symbolWhite: string; symbolBlack: string }[] = [
  { type: 'Q', label: 'Hậu', symbolWhite: '♕', symbolBlack: '♛' },
  { type: 'R', label: 'Xe', symbolWhite: '♖', symbolBlack: '♜' },
  { type: 'B', label: 'Tượng', symbolWhite: '♗', symbolBlack: '♝' },
  { type: 'N', label: 'Mã', symbolWhite: '♘', symbolBlack: '♞' },
];

function StauntonMiniIcon({ type, side, className = 'w-5 h-5' }: { type: 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'; side: ChessSide; className?: string }) {
  const isWhite = side === 'white';
  const fill = isWhite ? '#FCF8EE' : '#1E2532';
  const stroke = isWhite ? '#1E293B' : '#CBD5E1';
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      {type === 'P' && (
        <path
          d="M11 29h14c0-3-3-4-4-5l-1-6 2-1.5-2-1.5a4 4 0 1 0-4 0l-2 1.5 2 1.5-1 6c-1 1-4 2-4 5z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
      {type === 'R' && (
        <path
          d="M9 29h18l-1-3-2-1.5-.5-9.5L26 13V8h-3.2v2.8h-2.8V8h-4v2.8h-2.8V8H10v5l2.5 2-.5 9.5L10 26l-1 3z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
      {type === 'N' && (
        <path
          d="M9 29h18c0-3-2-4-4-5 1-6-1-12-4-15l-1.5-3-2.2 2-2-1.8-.8 3C10 11 8 15 7.5 18.5c-.3 1.8 1.5 2.5 3.5 1.8 1.5-.6 3-1.8 4-2.8.5 2.5-1 4.8-3.5 6.5C9.5 25.2 9 26.8 9 29z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
      {type === 'B' && (
        <>
          <circle cx="18" cy="7" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path
            d="M10 29h16c0-3-2.5-4-4-5l-1.2-2.5c2.5-3.5 2-8.5-2.8-12-4.8 3.5-5.3 8.5-2.8 12L14 24c-1.5 1-4 2-4 5z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M16 14h4M18 12v4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {type === 'Q' && (
        <>
          <path
            d="M9 29h18l-1.8-4.5L28 13l-5 4.5L22 10l-4 5.5L14 10l-1 7.5L8 13l2.8 11.5L9 29z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="11.5" r="1.4" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="14" cy="8.5" r="1.4" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="18" cy="7" r="1.5" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="22" cy="8.5" r="1.4" fill={fill} stroke={stroke} strokeWidth="1.2" />
          <circle cx="28" cy="11.5" r="1.4" fill={fill} stroke={stroke} strokeWidth="1.2" />
        </>
      )}
      {type === 'K' && (
        <>
          <path d="M18 4v6.5M15 7h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M9 29h18l-1.8-5c3-5.2 1.2-10-3.2-11.2-1.8-.5-3.2.8-4 2-.8-1.2-2.2-2.5-4-2-4.4 1.2-6.2 6-3.2 11.2L9 29z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function playChessSound(
  type: 'move' | 'capture' | 'castle' | 'check' | 'win' | 'lose',
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

    const jitter = 0.94 + Math.random() * 0.12;
    if (type === 'move') {
      playTone(280 * jitter, 120, 0.065, 0.15, 'triangle');
    } else if (type === 'castle') {
      playTone(260 * jitter, 115, 0.06, 0.14, 'triangle', 0);
      playTone(320 * jitter, 140, 0.065, 0.14, 'triangle', 0.07);
    } else if (type === 'capture') {
      playTone(360 * jitter, 90, 0.1, 0.23, 'triangle');
      playTone(640 * jitter, 240, 0.055, 0.1, 'sine');
    } else if (type === 'check') {
      playTone(523.25, 490, 0.2, 0.17, 'sine');
      playTone(784, 740, 0.26, 0.12, 'sine', 0.06);
    } else if (type === 'win') {
      playTone(523.25, 523.25, 0.15, 0.15, 'triangle', 0);
      playTone(659.25, 659.25, 0.15, 0.15, 'triangle', 0.11);
      playTone(783.99, 783.99, 0.25, 0.19, 'triangle', 0.22);
    } else if (type === 'lose') {
      playTone(392, 349.23, 0.18, 0.14, 'triangle', 0);
      playTone(293.66, 220, 0.28, 0.15, 'triangle', 0.15);
    }
  } catch {
    // Ignore audio blocks
  }
}

export function ChessGameSection({ theme, onToggleTheme }: ChessGameSectionProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [gameMode, setGameMode] = useState<ChessGameMode>('ai');
  const [difficulty, setDifficulty] = useState<ChessDifficulty>(5);
  const [playerSide, setPlayerSide] = useState<ChessSide>('white');
  const [manualFlip, setManualFlip] = useState<boolean>(false);
  const [boardTheme, setBoardTheme] = useState<ChessBoardThemeId>('wood');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const [position, setPosition] = useState<ChessPosition>(() => createInitialPosition());
  const [selectedSquare, setSelectedSquare] = useState<BoardCoord | null>(null);
  const [legalTargets, setLegalTargets] = useState<BoardCoord[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: BoardCoord;
    to: BoardCoord;
  } | null>(null);
  const [lastMove, setLastMove] = useState<ChessMove | null>(null);
  const [hintMove, setHintMove] = useState<ChessMove | null>(null);
  const [moveHistory, setMoveHistory] = useState<ChessMove[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotHistoryItem[]>(() => {
    const init = createInitialPosition();
    return [{ position: init, move: null, positionKey: getPositionRepetitionKey(init) }];
  });
  const [gameResult, setGameResult] = useState<ChessGameResult>({
    status: 'ongoing',
    reason: null,
    winner: null,
  });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<ChessBoardMetrics>({
    width: 520,
    height: 520,
    pad: 20,
    cellSize: 60,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const matchTokenRef = useRef<number>(1);
  const aiTimerRef = useRef<number | null>(null);
  const slideAnimRef = useRef<ChessSlideAnim | null>(null);

  const dragStateRef = useRef<
    ChessDragRenderState & { startClientX: number; startClientY: number }
  >({
    active: false,
    hasMoved: false,
    from: null,
    piece: null,
    startClientX: 0,
    startClientY: 0,
    canvasX: 0,
    canvasY: 0,
  });

  const particlesRef = useRef<ChessParticle[]>(
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
  const shockwavesRef = useRef<ChessShockwave[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const aiSide: ChessSide = getOppositeSide(playerSide);
  const isFlipped = gameMode === 'ai' ? (playerSide === 'black') !== manualFlip : manualFlip;
  const palette = CHESS_BOARD_THEMES[boardTheme];
  const activeLevelInfo = getChessLevelConfig(difficulty);
  const sideToMove = position.sideToMove;
  const board = position.board;

  const isHumanTurn =
    gameState === 'playing' &&
    gameResult.status === 'ongoing' &&
    pendingPromotion === null &&
    (gameMode === 'pvp' || (sideToMove === playerSide && !isAiThinking));

  const inCheckSide: ChessSide | null = useMemo(() => {
    if (isSideInCheck(board, 'white')) return 'white';
    if (isSideInCheck(board, 'black')) return 'black';
    return null;
  }, [board]);

  const capturedStats = useMemo(() => {
    const whiteCaptured: ChessPiece[] = [];
    const blackCaptured: ChessPiece[] = [];
    let whiteGain = 0;
    let blackGain = 0;
    for (const m of moveHistory) {
      if (m.captured) {
        if (m.piece.side === 'white') {
          whiteCaptured.push(m.captured);
          whiteGain += PIECE_MATERIAL_VALUE[m.captured.type];
        } else {
          blackCaptured.push(m.captured);
          blackGain += PIECE_MATERIAL_VALUE[m.captured.type];
        }
      }
    }
    const bottomSide: ChessSide = isFlipped ? 'black' : 'white';
    const bottomCaptured = bottomSide === 'white' ? whiteCaptured : blackCaptured;
    const topCaptured = bottomSide === 'white' ? blackCaptured : whiteCaptured;
    const rawDiff = bottomSide === 'white' ? whiteGain - blackGain : blackGain - whiteGain;
    return {
      whiteCaptured,
      blackCaptured,
      bottomCaptured,
      topCaptured,
      bottomDelta: Math.round(rawDiff / 100),
      topDelta: Math.round(-rawDiff / 100),
    };
  }, [isFlipped, moveHistory]);

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

  const boardToCanvasPoint = useCallback(
    (coord: BoardCoord): { x: number; y: number } => {
      const { pad, cellSize } = metricsRef.current;
      const dr = isFlipped ? BOARD_SIZE - 1 - coord.row : coord.row;
      const dc = isFlipped ? BOARD_SIZE - 1 - coord.col : coord.col;
      return {
        x: pad + (dc + 0.5) * cellSize,
        y: pad + (dr + 0.5) * cellSize,
      };
    },
    [isFlipped]
  );

  const screenToBoard = useCallback(
    (clientX: number, clientY: number): { coord: BoardCoord | null; cx: number; cy: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { coord: null, cx: 0, cy: 0 };
      const rect = canvas.getBoundingClientRect();
      const cx = clientX - rect.left;
      const cy = clientY - rect.top;
      const { pad, cellSize } = metricsRef.current;
      const dc = Math.floor((cx - pad) / cellSize);
      const dr = Math.floor((cy - pad) / cellSize);
      if (dc < 0 || dc >= BOARD_SIZE || dr < 0 || dr >= BOARD_SIZE) {
        return { coord: null, cx, cy };
      }
      const coord: BoardCoord = isFlipped
        ? { row: BOARD_SIZE - 1 - dr, col: BOARD_SIZE - 1 - dc }
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

  const spawnShockwave = useCallback(
    (coord: BoardCoord, color: string) => {
      const pt = boardToCanvasPoint(coord);
      shockwavesRef.current.push({
        x: pt.x,
        y: pt.y,
        life: 0,
        maxLife: 0.36,
        maxRadius: metricsRef.current.cellSize * 0.72,
        color,
      });
    },
    [boardToCanvasPoint]
  );

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const checkedKingPos = inCheckSide ? findKingPosition(board, inCheckSide) : null;
    renderChessBoardCanvas({
      canvas,
      board,
      metrics: metricsRef.current,
      palette,
      isFlipped,
      selectedSquare,
      legalTargets,
      lastMove,
      hintMove,
      checkedKingPos,
      slideAnim: slideAnimRef.current,
      dragState: dragStateRef.current,
      particles: particlesRef.current,
      shockwaves: shockwavesRef.current,
    });
  }, [board, hintMove, inCheckSide, isFlipped, lastMove, legalTargets, palette, selectedSquare]);

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

      if (shockwavesRef.current.length > 0) {
        const alive: ChessShockwave[] = [];
        for (const sw of shockwavesRef.current) {
          sw.life += dt;
          if (sw.life < sw.maxLife) {
            alive.push(sw);
            keepRunning = true;
          }
        }
        shockwavesRef.current = alive;
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

  // ResizeObserver for crisp responsive Canvas scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMetrics = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.max(280, Math.round(rect.width));
      const pad = Math.max(15, Math.round(size * 0.042));
      const cellSize = (size - pad * 2) / BOARD_SIZE;
      metricsRef.current = { width: size, height: size, pad, cellSize };
      renderCanvas();
    };

    updateMetrics();
    const observer = new ResizeObserver(updateMetrics);
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderCanvas]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, theme]);

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
      currentPos: ChessPosition,
      from: BoardCoord,
      to: BoardCoord,
      currentSnapshots: SnapshotHistoryItem[],
      animateSlide: boolean,
      promotion?: ChessPromotionType
    ) => {
      const executed = executeMove(currentPos, from, to, promotion);
      if (!executed) return false;

      const { nextPosition, move } = executed;
      const nextKey = getPositionRepetitionKey(nextPosition);
      const nextSnapshots: SnapshotHistoryItem[] = [
        ...currentSnapshots,
        { position: nextPosition, move, positionKey: nextKey },
      ];
      const nextResult = evaluateGameResult(
        nextPosition,
        nextSnapshots.map((s) => s.positionKey)
      );

      if (animateSlide && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        slideAnimRef.current = {
          piece: move.piece,
          from,
          to,
          progress: 0,
        };
      }

      if (move.captured) {
        const burstColor = move.captured.side === 'white' ? '#F8FAFC' : '#F59E0B';
        spawnBurstParticles(to, burstColor, 20);
        spawnShockwave(to, burstColor);
      }
      if (move.isCheck) {
        const kingCoord = findKingPosition(nextPosition.board, nextPosition.sideToMove);
        if (kingCoord) {
          spawnBurstParticles(kingCoord, '#DC2626', 24);
          spawnShockwave(kingCoord, '#EF4444');
        }
      }

      if (nextResult.status !== 'ongoing') {
        const soundType =
          gameMode === 'ai'
            ? nextResult.winner
              ? nextResult.winner === playerSide
                ? 'win'
                : 'lose'
              : 'check'
            : nextResult.winner
            ? 'win'
            : 'check';
        playChessSound(soundType, soundEnabled, audioCtxRef);
      } else if (move.isCheck) {
        playChessSound('check', soundEnabled, audioCtxRef);
      } else if (move.captured) {
        playChessSound('capture', soundEnabled, audioCtxRef);
      } else if (move.isCastle) {
        playChessSound('castle', soundEnabled, audioCtxRef);
      } else {
        playChessSound('move', soundEnabled, audioCtxRef);
      }

      setPosition(nextPosition);
      setLastMove(move);
      setHintMove(null);
      setSelectedSquare(null);
      setLegalTargets([]);
      setPendingPromotion(null);
      setMoveHistory((prev) => [...prev, move]);
      setSnapshots(nextSnapshots);
      setGameResult(nextResult);

      if (nextResult.status !== 'ongoing') {
        setGameState('gameover');
      }

      scheduleAnimationLoop();
      return true;
    },
    [gameMode, playerSide, scheduleAnimationLoop, soundEnabled, spawnBurstParticles, spawnShockwave]
  );

  const startNewGame = useCallback(
    (overrideSide?: ChessSide, overrideMode?: ChessGameMode) => {
      clearAiTimer();
      matchTokenRef.current += 1;
      const activeMode = overrideMode ?? gameMode;
      const activeSide = overrideSide ?? playerSide;
      const freshPos = createInitialPosition();

      setPosition(freshPos);
      setSelectedSquare(null);
      setLegalTargets([]);
      setPendingPromotion(null);
      setLastMove(null);
      setHintMove(null);
      setMoveHistory([]);
      setSnapshots([
        {
          position: freshPos,
          move: null,
          positionKey: getPositionRepetitionKey(freshPos),
        },
      ]);
      setGameResult({ status: 'ongoing', reason: null, winner: null });
      setElapsedSeconds(0);
      setIsAiThinking(activeMode === 'ai' && activeSide === 'black');
      setGameState('playing');
      slideAnimRef.current = null;
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [clearAiTimer, gameMode, playerSide]
  );

  // Trigger AI move automatically in AI mode
  useEffect(() => {
    if (gameMode !== 'ai' || gameState !== 'playing' || gameResult.status !== 'ongoing') {
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
      const aiMove = findBestChessMove(position, difficulty);
      setIsAiThinking(false);
      if (!aiMove || matchTokenRef.current !== activeToken) return;
      commitMove(position, aiMove.from, aiMove.to, snapshots, true, aiMove.promotion);
    }, 150);

    return () => clearAiTimer();
  }, [
    aiSide,
    clearAiTimer,
    commitMove,
    difficulty,
    gameMode,
    gameResult.status,
    gameState,
    position,
    sideToMove,
    snapshots,
  ]);

  const handleUndoMove = useCallback(() => {
    if (gameState !== 'playing' && gameState !== 'gameover') return;
    if (snapshots.length <= 1) return;

    clearAiTimer();
    matchTokenRef.current += 1;
    setIsAiThinking(false);
    setPendingPromotion(null);

    let targetIdx = snapshots.length - 1;
    if (gameMode === 'pvp') {
      targetIdx = Math.max(0, targetIdx - 1);
    } else {
      if (snapshots[targetIdx].position.sideToMove === playerSide && targetIdx >= 2) {
        targetIdx -= 2;
      } else if (snapshots[targetIdx].position.sideToMove !== playerSide) {
        targetIdx -= 1;
      } else {
        targetIdx = 0;
      }
      targetIdx = Math.max(0, targetIdx);
    }

    const restored = snapshots[targetIdx];
    const truncatedHistory = moveHistory.slice(0, targetIdx);
    const truncatedSnapshots = snapshots.slice(0, targetIdx + 1);

    setPosition(restored.position);
    setLastMove(restored.move);
    setMoveHistory(truncatedHistory);
    setSnapshots(truncatedSnapshots);
    setSelectedSquare(null);
    setLegalTargets([]);
    setHintMove(null);
    setGameResult({ status: 'ongoing', reason: null, winner: null });
    setGameState('playing');
  }, [clearAiTimer, gameMode, gameState, moveHistory, playerSide, snapshots]);

  const handleShowHint = useCallback(() => {
    if (!isHumanTurn) return;
    const best = findBestChessMove(position, 8);
    if (best) {
      setHintMove(best);
      setSelectedSquare(best.from);
      setLegalTargets(getLegalMovesForPiece(position, best.from.row, best.from.col));
    }
  }, [isHumanTurn, position]);

  const handleResign = useCallback(() => {
    if (gameState !== 'playing') return;
    clearAiTimer();
    matchTokenRef.current += 1;
    setIsAiThinking(false);
    setPendingPromotion(null);
    const winner = gameMode === 'ai' ? aiSide : getOppositeSide(sideToMove);
    setGameResult({
      status: winner === 'white' ? 'white_win' : 'black_win',
      reason: 'resign',
      winner,
    });
    playChessSound(gameMode === 'ai' ? 'lose' : 'win', soundEnabled, audioCtxRef);
    setGameState('gameover');
  }, [aiSide, clearAiTimer, gameMode, gameState, sideToMove, soundEnabled]);

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
        if (pendingPromotion) {
          e.preventDefault();
          setPendingPromotion(null);
          return;
        }
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
  }, [clearAiTimer, gameState, handleShowHint, handleUndoMove, pendingPromotion, startNewGame]);

  const trySubmitMoveOrPromptPromotion = useCallback(
    (from: BoardCoord, to: BoardCoord, animateSlide: boolean) => {
      if (isPromotionMove(position, from, to)) {
        setPendingPromotion({ from, to });
        setSelectedSquare(from);
        setLegalTargets([]);
        return;
      }
      commitMove(position, from, to, snapshots, animateSlide);
    },
    [commitMove, position, snapshots]
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isHumanTurn) return;
    const { coord, cx, cy } = screenToBoard(e.clientX, e.clientY);
    if (!coord) return;

    const clickedPiece = board[coord.row][coord.col];

    if (
      selectedSquare &&
      legalTargets.some((t) => t.row === coord.row && t.col === coord.col)
    ) {
      trySubmitMoveOrPromptPromotion(selectedSquare, coord, true);
      return;
    }

    if (clickedPiece && clickedPiece.side === sideToMove) {
      const moves = getLegalMovesForPiece(position, coord.row, coord.col);
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
        trySubmitMoveOrPromptPromotion(origin, coord, false);
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

  const topSide: ChessSide = isFlipped ? 'white' : 'black';
  const bottomSide: ChessSide = isFlipped ? 'black' : 'white';
  const playerIsWhite = playerSide === 'white';

  const getPlayerLabel = (side: ChessSide) => {
    if (gameMode === 'ai') {
      if (side === aiSide) {
        return `Máy AI · ${activeLevelInfo.badge} (${activeLevelInfo.name})`;
      }
      return `Bạn · Quân ${side === 'white' ? 'Trắng' : 'Đen'}`;
    }
    return side === 'white' ? 'Người Chơi 1 · Quân Trắng' : 'Người Chơi 2 · Quân Đen';
  };

  const resultHeadline =
    gameMode === 'ai'
      ? gameResult.winner === playerSide
        ? 'Chiến Thắng Tuyệt Đối!'
        : gameResult.winner === aiSide
        ? 'Máy AI Giành Phần Thắng'
        : 'Ván Cờ Hòa'
      : gameResult.winner === 'white'
      ? 'Quân Trắng Chiến Thắng!'
      : gameResult.winner === 'black'
      ? 'Quân Đen Chiến Thắng!'
      : 'Ván Cờ Hòa';

  const resultSubtext =
    gameResult.reason === 'checkmate'
      ? gameMode === 'ai'
        ? gameResult.winner === playerSide
          ? 'Bạn đã chiếu hết Vua đối phương với thế trận sắc bén.'
          : 'Vua của bạn đã bị chiếu hết.'
        : `Quân ${gameResult.winner === 'white' ? 'Trắng' : 'Đen'} đã chiếu hết Vua đối phương.`
      : gameResult.reason === 'resign'
      ? `${gameResult.winner === 'white' ? 'Quân Đen' : 'Quân Trắng'} đã xin thua.`
      : gameResult.reason === 'stalemate'
      ? 'Bên đến lượt không còn nước đi hợp lệ nhưng không bị chiếu (Hòa Pat).'
      : gameResult.reason === 'threefold_repetition'
      ? 'Thế cờ lặp lại 3 lần — xử hòa theo luật FIDE.'
      : gameResult.reason === 'fifty_move_rule'
      ? 'Đạt 50 nước liên tiếp không ăn quân hoặc đẩy Tốt — xử hòa.'
      : 'Hai bên không còn đủ lực lượng chiếu hết — xử hòa.';

  const movePairs = useMemo(() => {
    const pairs: Array<{ moveNumber: number; white?: ChessMove; black?: ChessMove }> = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1],
      });
    }
    return pairs;
  }, [moveHistory]);

  return (
    <section
      id="chess-game"
      aria-label="Trò chơi Cờ Vua 2D Chuẩn FIDE"
      data-game-state={gameState}
      data-game-mode={gameMode}
      data-turn={sideToMove}
      data-difficulty={difficulty}
      data-board-theme={boardTheme}
      data-move-count={moveHistory.length}
      data-last-move={lastMove?.notation ?? ''}
      className="pt-1 sm:pt-2 pb-6 space-y-3 sm:space-y-3.5 mobile-ls:py-1 mobile-ls:pb-2 mobile-ls:space-y-2"
    >
      {/* Top Game Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#DCE6F2] dark:border-[#1E2E4A] pb-3 mobile-ls:pb-1.5 mobile-ls:gap-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#0284C7] dark:text-[#38BDF8] mobile-ls:hidden">
            Khu Giải Trí Chiến Thuật · Chuẩn FIDE 8×8
          </p>
          <h1 className="font-display text-xl sm:text-3xl mobile-ls:text-lg font-bold text-[#070B14] dark:text-[#F1F5F9]">
            Cờ Vua Đối Kháng AI
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Board Material Selector */}
          <div
            role="group"
            aria-label="Chọn chất liệu bàn cờ vua"
            className="inline-flex items-center p-0.5 sm:p-1 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]"
          >
            {(Object.keys(CHESS_BOARD_THEMES) as ChessBoardThemeId[]).map((tid) => (
              <button
                key={tid}
                type="button"
                onClick={() => setBoardTheme(tid)}
                className={`min-h-[34px] sm:min-h-[38px] px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  boardTheme === tid
                    ? 'bg-[#0A192F] text-white dark:bg-[#0284C7]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white'
                }`}
              >
                {CHESS_BOARD_THEMES[tid].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setManualFlip((prev) => !prev)}
            aria-label="Xoay chiều bàn cờ vua"
            title="Xoay chiều bàn cờ"
            className="min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4 text-[#0284C7]" />
            <span className="hidden sm:inline">Xoay Bàn</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Tắt âm thanh bàn cờ' : 'Bật âm thanh bàn cờ'}
            className="min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#0284C7]" /> : <VolumeX className="w-4 h-4 text-[#64748B]" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Âm Bật' : 'Tắt Tiếng'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[36px] sm:min-h-[40px] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Game Shell */}
      <div className="grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_270px] lg:grid-cols-12 gap-4 mobile-ls:gap-2.5 lg:gap-6 items-start">
        {/* Board Column */}
        <div className="mobile-ls:min-w-0 lg:col-span-7 xl:col-span-7 flex flex-col items-center gap-2.5 mobile-ls:gap-1.5">
          {/* Top Compact Strip */}
          <div className="w-full max-w-[520px] mobile-ls:max-w-[min(100%,calc((100dvh-106px)*1))] flex items-center justify-between gap-2 px-3 py-2 mobile-ls:px-2 mobile-ls:py-1 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  topSide === 'black'
                    ? 'bg-[#1E2430] border-[#475569]'
                    : 'bg-[#FCF9F2] border-[#C9A86B]'
                }`}
              >
                <StauntonMiniIcon type="K" side={topSide} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] truncate">
                  {getPlayerLabel(topSide)}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {gameMode === 'ai' && isAiThinking && sideToMove === topSide
                    ? `Đang tính nước đi (${activeLevelInfo.badge})...`
                    : sideToMove === topSide && gameState === 'playing'
                    ? 'Đang đến lượt đi'
                    : `Đã ăn ${capturedStats.topCaptured.length} quân${
                        capturedStats.topDelta > 0 ? ` (+${capturedStats.topDelta})` : ''
                      }`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inCheckSide === topSide && (
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

          {/* Interactive 2D 8x8 Chessboard + Overlays */}
          <div
            ref={containerRef}
            className="relative w-full max-w-[520px] mobile-ls:max-w-[min(100%,calc((100dvh-116px)*1))] aspect-square mx-auto rounded-2xl overflow-hidden shadow-[0_20px_50px_-18px_rgba(7,11,20,0.38)] border-2 border-[#3E2414] dark:border-[#2B3E5E] select-none touch-none"
          >
            <canvas
              ref={canvasRef}
              data-testid="chess-board-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="Bàn cờ vua 2D tương tác 8x8"
              className="block w-full h-full cursor-pointer touch-none"
            />

            {/* Title Screen Modal Overlay */}
            {gameState === 'title' && (
              <div
                role="region"
                aria-label="Màn hình bắt đầu Cờ Vua"
                className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-5 mobile-ls:p-2 text-center overflow-y-auto"
                style={{ backgroundColor: 'rgba(10, 15, 28, 0.88)' }}
              >
                <div className="w-full max-w-md space-y-2 sm:space-y-2.5 mobile-ls:space-y-1.5 text-white">
                  {/* Sculpted Staunton King & Queen Crest */}
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 mobile-ls:gap-0">
                    <svg
                      viewBox="0 0 132 58"
                      className="hidden sm:block w-28 h-12 mobile-ls:hidden"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient id="chessIvoryCrest" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFFDF7" />
                          <stop offset="100%" stopColor="#DFCAA6" />
                        </linearGradient>
                        <linearGradient id="chessObsidianCrest" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#434E61" />
                          <stop offset="100%" stopColor="#0D121B" />
                        </linearGradient>
                      </defs>
                      {/* White King medallion */}
                      <circle cx="44" cy="29" r="23" fill="url(#chessIvoryCrest)" stroke="#D97706" strokeWidth="2.4" />
                      <g transform="translate(26,11)">
                        <path d="M18 4v6M15.2 6.8h5.6" stroke="#1E293B" strokeWidth="1.9" strokeLinecap="round" />
                        <path d="M9 29h18l-1.8-5c3-5.2 1.2-10-3.2-11.2-1.8-.5-3.2.8-4 2-.8-1.2-2.2-2.5-4-2-4.4 1.2-6.2 6-3.2 11.2L9 29z" fill="#FCF9F2" stroke="#1E293B" strokeWidth="1.7" strokeLinejoin="round" />
                      </g>
                      {/* Black Queen medallion */}
                      <circle cx="88" cy="29" r="23" fill="url(#chessObsidianCrest)" stroke="#94A3B8" strokeWidth="2.4" />
                      <g transform="translate(70,11)">
                        <path d="M9 29h18l-1.8-4.5L28 13l-5 4.5L22 10l-4 5.5L14 10l-1 7.5L8 13l2.8 11.5L9 29z" fill="#1E2532" stroke="#E2E8F0" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="8" cy="11.5" r="1.2" fill="#E2E8F0" />
                        <circle cx="14" cy="8.5" r="1.2" fill="#E2E8F0" />
                        <circle cx="18" cy="7" r="1.3" fill="#E2E8F0" />
                        <circle cx="22" cy="8.5" r="1.2" fill="#E2E8F0" />
                        <circle cx="28" cy="11.5" r="1.2" fill="#E2E8F0" />
                      </g>
                    </svg>
                    <h2 className="font-display text-xl sm:text-3xl mobile-ls:text-base font-bold tracking-tight text-white">
                      Kỳ Đài Cờ Vua
                    </h2>
                    <p className="hidden sm:block mobile-ls:hidden text-xs text-slate-300">
                      Luật chuẩn FIDE · Đấu AI 10 cấp độ hoặc 2 người chơi
                    </p>
                  </div>

                  {/* Mode Selection */}
                  <div className="space-y-1 text-left">
                    <p className="text-[10px] sm:text-[11px] mobile-ls:text-[9px] font-mono uppercase tracking-wider text-amber-300">
                      1. Chọn Chế Độ Chơi
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setGameMode('ai')}
                        className={`min-h-[34px] sm:min-h-[36px] px-2.5 py-1 rounded-xl border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          gameMode === 'ai'
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5 shrink-0" />
                        Đấu Với AI (10 Cấp)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGameMode('pvp')}
                        className={`min-h-[34px] sm:min-h-[36px] px-2.5 py-1 rounded-xl border text-[11px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          gameMode === 'pvp'
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        2 Người Chơi
                      </button>
                    </div>
                  </div>

                  {/* Difficulty Selection (10 Levels — shown in AI mode) */}
                  {gameMode === 'ai' && (
                    <div className="space-y-1 text-left">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-[10px] sm:text-[11px] mobile-ls:text-[9px] font-mono uppercase tracking-wider text-amber-300 truncate">
                          2. Chọn Cấp AI
                        </p>
                        <span className="text-[10px] sm:text-xs mobile-ls:text-[9px] font-semibold text-amber-200 whitespace-nowrap">
                          {activeLevelInfo.badge} · {activeLevelInfo.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                        {CHESS_LEVELS.map((cfg) => (
                          <button
                            key={cfg.level}
                            type="button"
                            aria-label={`Chọn ${cfg.badge} ${cfg.name}`}
                            onClick={() => setDifficulty(cfg.level)}
                            className={`min-h-[30px] sm:min-h-[32px] mobile-ls:min-h-[26px] py-1 rounded-lg border text-center transition-all cursor-pointer ${
                              difficulty === cfg.level
                                ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-sm'
                                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            <div className="text-[10px] sm:text-xs font-mono leading-tight whitespace-nowrap">
                              <span className="sm:inline hidden">Cấp </span>
                              <span className="sm:hidden">C</span>
                              {cfg.level}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="hidden sm:block mobile-ls:hidden text-[11px] text-slate-300 bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1 leading-snug truncate">
                        <strong className="text-amber-300">{activeLevelInfo.name}:</strong>{' '}
                        {activeLevelInfo.summary}
                      </p>
                    </div>
                  )}

                  {/* Side Selection (in AI mode) */}
                  {gameMode === 'ai' && (
                    <div className="space-y-1 text-left">
                      <p className="text-[10px] sm:text-[11px] mobile-ls:text-[9px] font-mono uppercase tracking-wider text-amber-300">
                        3. Chọn Phe Thi Đấu
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPlayerSide('white')}
                          className={`min-h-[34px] sm:min-h-[36px] mobile-ls:min-h-[28px] px-2 py-1 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                            playerIsWhite
                              ? 'bg-[#FCF9F2] text-slate-950 border-amber-400'
                              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          Quân Trắng <span className="hidden sm:inline">(Đi Trước)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlayerSide('black')}
                          className={`min-h-[34px] sm:min-h-[36px] mobile-ls:min-h-[28px] px-2 py-1 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                            !playerIsWhite
                              ? 'bg-[#1E2430] text-white border-amber-400'
                              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          Quân Đen <span className="hidden sm:inline">(Đi Sau)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    data-start="true"
                    onClick={() => startNewGame()}
                    className="w-full py-2 sm:py-2.5 mobile-ls:py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Bắt Đầu Ván Đấu
                  </button>

                  <p className="hidden sm:block mobile-ls:hidden text-[10px] sm:text-[11px] text-slate-300/90">
                    Chạm hoặc kéo thả quân · Enter Bắt đầu · Z Đi lại · H Gợi ý
                  </p>
                </div>
              </div>
            )}

            {/* Pawn Promotion Modal Overlay */}
            {pendingPromotion && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Chọn quân phong cấp"
                className="absolute inset-0 flex items-center justify-center p-5"
                style={{ backgroundColor: 'rgba(10, 15, 28, 0.82)' }}
              >
                <div className="w-full max-w-xs rounded-2xl bg-[#111827] border border-amber-500/50 p-5 text-center space-y-3 text-white shadow-2xl">
                  <p className="text-xs font-mono uppercase tracking-widest text-amber-400">
                    Phong Cấp Tốt
                  </p>
                  <h3 className="font-display text-xl font-bold">Chọn Quân Nâng Cấp</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PROMOTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() =>
                          commitMove(
                            position,
                            pendingPromotion.from,
                            pendingPromotion.to,
                            snapshots,
                            true,
                            opt.type
                          )
                        }
                        className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 border border-slate-700 font-semibold text-sm flex flex-col items-center gap-1 transition-colors cursor-pointer"
                      >
                        <StauntonMiniIcon
                          type={opt.type}
                          side={sideToMove}
                          className="w-8 h-8"
                        />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingPromotion(null)}
                    className="w-full py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Hủy (Esc)
                  </button>
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
                aria-label="Kết quả ván Cờ Vua"
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
                        {capturedStats.bottomCaptured.length}
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
                      Đổi Chế Độ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Compact Player Strip */}
          <div className="w-full max-w-[520px] mobile-ls:max-w-[min(100%,calc((100dvh-116px)*1))] flex items-center justify-between gap-2 px-3 py-2 mobile-ls:px-2 mobile-ls:py-1 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                aria-hidden="true"
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                  bottomSide === 'white'
                    ? 'bg-[#FCF9F2] border-[#C9A86B]'
                    : 'bg-[#1E2430] border-[#475569]'
                }`}
              >
                <StauntonMiniIcon type="K" side={bottomSide} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] truncate">
                  {getPlayerLabel(bottomSide)}
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {gameState === 'playing' && sideToMove === bottomSide
                    ? 'Đến lượt đi'
                    : `Đã ăn ${capturedStats.bottomCaptured.length} quân${
                        capturedStats.bottomDelta !== 0
                          ? ` (${capturedStats.bottomDelta > 0 ? `+${capturedStats.bottomDelta}` : capturedStats.bottomDelta}đ)`
                          : ''
                      }`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inCheckSide === bottomSide && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Chiếu Tướng!
                </span>
              )}
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                  sideToMove === bottomSide && gameState === 'playing'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#F1F5F9] dark:bg-[#13203A] text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                {gameState === 'title'
                  ? 'Chờ Bắt Đầu'
                  : sideToMove === bottomSide
                  ? gameMode === 'ai' && bottomSide === playerSide
                    ? 'Lượt Của Bạn'
                    : 'Lượt Đi'
                  : gameMode === 'ai'
                  ? 'Lượt Máy AI'
                  : 'Đợi Đối Thủ'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Control Dock & Live Match Log */}
        <aside className="lg:col-span-5 xl:col-span-5 space-y-4 mobile-ls:max-h-[calc(100dvh-64px)] mobile-ls:overflow-y-auto mobile-ls:pr-1 mobile-ls:space-y-2">
          {/* Action Toolbar */}
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] p-4 sm:p-5 mobile-ls:p-2.5 space-y-4 mobile-ls:space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#070B14] dark:text-[#F1F5F9]">
                Bảng Điều Khiển Ván Đấu
              </h2>
              <span className="font-mono text-xs tabular-nums text-[#64748B] dark:text-[#94A3B8]">
                Nước #{moveHistory.length}
              </span>
            </div>

            {/* Mode Quick Switch */}
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Chuyển chế độ chơi">
              <button
                type="button"
                onClick={() => {
                  if (gameMode !== 'ai') {
                    setGameMode('ai');
                    startNewGame(playerSide, 'ai');
                  }
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  gameMode === 'ai'
                    ? 'bg-[#0A192F] text-white border-[#0A192F] dark:bg-[#0284C7] dark:border-[#38BDF8]'
                    : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#475569] dark:text-[#CBD5E1] border-[#DCE6F2] dark:border-[#1E2E4A]'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Đấu Với AI
              </button>
              <button
                type="button"
                onClick={() => {
                  if (gameMode !== 'pvp') {
                    setGameMode('pvp');
                    startNewGame(playerSide, 'pvp');
                  }
                }}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  gameMode === 'pvp'
                    ? 'bg-[#0A192F] text-white border-[#0A192F] dark:bg-[#0284C7] dark:border-[#38BDF8]'
                    : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#475569] dark:text-[#CBD5E1] border-[#DCE6F2] dark:border-[#1E2E4A]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                2 Người Chơi
              </button>
            </div>

            {/* 44px+ Tactile Controls Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 mobile-ls:grid-cols-2 gap-2.5 mobile-ls:gap-1.5">
              <button
                type="button"
                onClick={handleUndoMove}
                disabled={snapshots.length <= 1 || gameState === 'title'}
                className="min-h-[44px] mobile-ls:min-h-[38px] px-3 mobile-ls:px-2 py-2 mobile-ls:py-1.5 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm mobile-ls:text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-2 mobile-ls:gap-1 transition-colors cursor-pointer"
              >
                <Undo2 className="w-4 h-4 text-[#0284C7]" />
                Đi Lại (Z)
              </button>

              <button
                type="button"
                onClick={handleShowHint}
                disabled={!isHumanTurn}
                className="min-h-[44px] mobile-ls:min-h-[38px] px-3 mobile-ls:px-2 py-2 mobile-ls:py-1.5 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm mobile-ls:text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-2 mobile-ls:gap-1 transition-colors cursor-pointer"
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
                className="min-h-[44px] mobile-ls:min-h-[38px] px-3 mobile-ls:px-2 py-2 mobile-ls:py-1.5 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] disabled:opacity-45 disabled:cursor-not-allowed text-xs sm:text-sm mobile-ls:text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-2 mobile-ls:gap-1 transition-colors cursor-pointer"
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
                className="min-h-[44px] mobile-ls:min-h-[38px] px-3 mobile-ls:px-2 py-2 mobile-ls:py-1.5 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs sm:text-sm mobile-ls:text-xs font-semibold inline-flex items-center justify-center gap-2 mobile-ls:gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Ván Mới (R)
              </button>
            </div>

            {/* Quick 10-Level AI Selector + Resign during play */}
            <div className="pt-2.5 border-t border-[#DCE6F2] dark:border-[#1E2E4A] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                  {gameMode === 'ai' ? (
                    <>
                      Trình độ AI:{' '}
                      <span className="text-[#0284C7] dark:text-[#38BDF8]">
                        {activeLevelInfo.badge} · {activeLevelInfo.name}
                      </span>
                    </>
                  ) : (
                    'Chế độ 2 Người Chơi (Pass & Play)'
                  )}
                </span>
                {gameState === 'playing' && (
                  <button
                    type="button"
                    onClick={handleResign}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Xin Thua
                  </button>
                )}
              </div>

              {gameMode === 'ai' && (
                <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Điều chỉnh nhanh cấp độ AI từ 1 đến 10">
                  {CHESS_LEVELS.map((cfg) => (
                    <button
                      key={cfg.level}
                      type="button"
                      title={`${cfg.badge} · ${cfg.name}`}
                      aria-label={`Đổi độ khó ${cfg.badge} ${cfg.name}`}
                      onClick={() => setDifficulty(cfg.level)}
                      className={`min-h-[40px] mobile-ls:min-h-[34px] py-1.5 mobile-ls:py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                        difficulty === cfg.level
                          ? 'bg-[#0284C7] text-white shadow-sm'
                          : 'bg-[#F1F5F9] dark:bg-[#13203A] text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white'
                      }`}
                    >
                      {cfg.level}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Captured Pieces & SAN Move History */}
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] p-4 sm:p-5 mobile-ls:p-2.5 space-y-3 mobile-ls:space-y-2">
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

            {(capturedStats.whiteCaptured.length > 0 || capturedStats.blackCaptured.length > 0) && (
              <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C33]">
                <div>
                  <div className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                    Trắng đã ăn ({capturedStats.whiteCaptured.length}):
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {capturedStats.whiteCaptured.length > 0 ? (
                      capturedStats.whiteCaptured.map((p, idx) => (
                        <span
                          key={`${p.id}-${idx}`}
                          title={PIECE_DISPLAY_INFO[p.side][p.type].viName}
                          className="w-6 h-6 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center"
                        >
                          <StauntonMiniIcon type={p.type} side={p.side} className="w-4 h-4" />
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-sans text-[#94A3B8]">Chưa có</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                    Đen đã ăn ({capturedStats.blackCaptured.length}):
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {capturedStats.blackCaptured.length > 0 ? (
                      capturedStats.blackCaptured.map((p, idx) => (
                        <span
                          key={`${p.id}-${idx}`}
                          title={PIECE_DISPLAY_INFO[p.side][p.type].viName}
                          className="w-6 h-6 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center"
                        >
                          <StauntonMiniIcon type={p.type} side={p.side} className="w-4 h-4" />
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-sans text-[#94A3B8]">Chưa có</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-56 mobile-ls:max-h-28 overflow-y-auto pr-1 space-y-1 text-xs">
              {movePairs.length === 0 ? (
                <p className="py-6 text-center text-[#64748B] dark:text-[#94A3B8]">
                  Chưa có nước đi nào. Quân Trắng luôn đi trước theo luật Cờ Vua.
                </p>
              ) : (
                <div className="space-y-1">
                  {movePairs.map((pair) => (
                    <div
                      key={pair.moveNumber}
                      className="grid grid-cols-[34px_1fr_1fr] items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#111C33]"
                    >
                      <span className="font-mono text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                        {pair.moveNumber}.
                      </span>
                      <span className="font-mono font-semibold text-[#070B14] dark:text-slate-100 truncate">
                        {pair.white?.notation ?? ''}
                      </span>
                      <span className="font-mono font-semibold text-[#334155] dark:text-sky-300 truncate">
                        {pair.black?.notation ?? ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Concise Rules Guide Card */}
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#0B1222] p-4 text-xs text-[#475569] dark:text-[#94A3B8] space-y-1.5">
            <p className="font-semibold text-[#070B14] dark:text-[#F1F5F9]">
              Luật Chuẩn FIDE &amp; Đa Chế Độ
            </p>
            <p>
              Hỗ trợ đầy đủ <strong>Nhập thành (O-O / O-O-O)</strong>,{' '}
              <strong>Bắt tốt qua đường (En Passant)</strong>,{' '}
              <strong>Phong cấp 4 quân (Hậu/Xe/Tượng/Mã)</strong>, hòa lặp 3 lần &amp; Pat. Chơi{' '}
              <strong>Đấu AI 10 cấp</strong> hoặc <strong>2 Người Chơi</strong> mượt mà trên mọi thiết bị.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
