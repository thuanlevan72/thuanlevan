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
  getXiangqiLevelConfig,
  isSideInCheck,
  PIECE_DISPLAY_INFO,
  PIECE_MATERIAL_VALUE,
  XIANGQI_LEVELS,
  XiangqiBoard,
  XiangqiDifficulty,
  XiangqiGameResult,
  XiangqiMove,
  XiangqiPiece,
  XiangqiSide,
} from '../utils/xiangqiEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import {
  renderXiangqiBoardCanvas,
  XIANGQI_BOARD_THEMES,
  XiangqiBoardMetrics,
  XiangqiBoardThemeId,
  XiangqiDragRenderState,
  XiangqiParticle,
  XiangqiShockwave,
  XiangqiSlideAnim,
} from '../utils/xiangqiCanvasRenderer.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface XiangqiGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
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

  const [difficulty, setDifficulty] = useState<XiangqiDifficulty>(5);
  const [playerSide, setPlayerSide] = useState<XiangqiSide>('red');
  const [boardTheme, setBoardTheme] = useState<XiangqiBoardThemeId>('wood');
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
  const metricsRef = useRef<XiangqiBoardMetrics>({
    width: 540,
    height: 600,
    padX: 34,
    padY: 36,
    cellSize: 58,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const matchTokenRef = useRef<number>(1);
  const aiTimerRef = useRef<number | null>(null);

  const slideAnimRef = useRef<XiangqiSlideAnim | null>(null);
  const dragStateRef = useRef<
    XiangqiDragRenderState & { startClientX: number; startClientY: number }
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

  const particlesRef = useRef<XiangqiParticle[]>(
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
  const shockwavesRef = useRef<XiangqiShockwave[]>([]);
  const animTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const aiSide: XiangqiSide = getOppositeSide(playerSide);
  const isFlipped = playerSide === 'black';
  const palette = XIANGQI_BOARD_THEMES[boardTheme];
  const activeLevelInfo = getXiangqiLevelConfig(difficulty);

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
    renderXiangqiBoardCanvas({
      canvas,
      board,
      metrics: metricsRef.current,
      palette,
      isFlipped,
      selectedSquare,
      legalTargets,
      lastMove,
      hintMove,
      inCheckSide,
      slideAnim: slideAnimRef.current,
      dragState: dragStateRef.current,
      particles: particlesRef.current,
      shockwaves: shockwavesRef.current,
      animTime: animTimeRef.current,
    });
  }, [
    board,
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
      animTimeRef.current += dt;

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
        const alive: XiangqiShockwave[] = [];
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
        const burstColor = move.captured.side === 'red' ? '#EF4444' : '#F59E0B';
        spawnBurstParticles(to, burstColor, 20);
        spawnShockwave(to, burstColor);
      }
      if (move.isCheck) {
        const kingCoord = findKingPosition(nextBoard, nextSide);
        if (kingCoord) {
          spawnBurstParticles(kingCoord, '#DC2626', 24);
          spawnShockwave(kingCoord, '#EF4444');
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
    [playerSide, scheduleAnimationLoop, soundEnabled, spawnBurstParticles, spawnShockwave]
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
    }, 150);

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
    const best = findBestXiangqiMove(board, playerSide, 8);
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
      className="pt-1 sm:pt-2 pb-6 space-y-3 sm:space-y-3.5 mobile-ls:py-1 mobile-ls:pb-2 mobile-ls:space-y-2"
    >
      {/* Top Game Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#DCE6F2] dark:border-[#1E2E4A] pb-3 mobile-ls:pb-1.5 mobile-ls:gap-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#0284C7] dark:text-[#38BDF8] mobile-ls:hidden">
            Khu Giải Trí Chiến Thuật · 2D Canvas Engine
          </p>
          <h1 className="font-display text-xl sm:text-3xl mobile-ls:text-lg font-bold text-[#070B14] dark:text-[#F1F5F9]">
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
            {(Object.keys(XIANGQI_BOARD_THEMES) as XiangqiBoardThemeId[]).map((tid) => (
              <button
                key={tid}
                type="button"
                onClick={() => setBoardTheme(tid)}
                className={`min-h-[38px] px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  boardTheme === tid
                    ? 'bg-[#0A192F] text-white dark:bg-[#0284C7]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white'
                }`}
              >
                {XIANGQI_BOARD_THEMES[tid].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            aria-label={soundEnabled ? 'Tắt âm thanh bàn cờ' : 'Bật âm thanh bàn cờ'}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#0284C7]" /> : <VolumeX className="w-4 h-4 text-[#64748B]" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Âm Bật' : 'Tắt Tiếng'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[40px] px-3 py-2 text-xs font-semibold rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}
          </button>
        </div>
      </div>

      {/* Main 2-Column Game Shell (Desktop: Board Left/Center + HUD Dock Right; Mobile Landscape: 2-col dual-thumb) */}
      <div className="grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_270px] lg:grid-cols-12 gap-4 mobile-ls:gap-2.5 lg:gap-6 items-start">
        {/* Board Column */}
        <div className="mobile-ls:min-w-0 lg:col-span-7 xl:col-span-7 flex flex-col items-center gap-2.5 mobile-ls:gap-1.5">
          {/* Top Compact Opponent Strip (Mobile & Desktop) */}
          <div className="w-full max-w-[500px] xl:max-w-[520px] mobile-ls:max-w-[min(100%,calc((100dvh-106px)*0.9))] flex items-center justify-between gap-2 px-3 py-2 mobile-ls:px-2 mobile-ls:py-1 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]">
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
                  Máy AI · {activeLevelInfo.badge} ({activeLevelInfo.name})
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                  {isAiThinking
                    ? `Đang tính nước đi (${activeLevelInfo.badge})...`
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
            className="relative w-full max-w-[500px] xl:max-w-[520px] mobile-ls:max-w-[min(100%,calc((100dvh-106px)*0.9))] aspect-[9/10] mx-auto rounded-2xl overflow-hidden shadow-[0_20px_50px_-18px_rgba(7,11,20,0.38)] border-2 border-[#3E2718] dark:border-[#2B3E5E] select-none touch-none"
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
                className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center mobile-ls:justify-center p-3 sm:p-7 mobile-ls:p-2 text-center overflow-y-auto"
                style={{ backgroundColor: 'rgba(10, 15, 28, 0.85)' }}
              >
                <div className="w-full max-w-md space-y-2.5 sm:space-y-4 mobile-ls:space-y-1.5 text-white">
                  {/* Sculpted Lacquer Token Emblem */}
                  <div className="flex flex-col items-center gap-1.5 sm:gap-2 mobile-ls:gap-0">
                    <svg
                      viewBox="0 0 144 66"
                      className="w-24 h-11 sm:w-32 sm:h-14 mobile-ls:hidden"
                      aria-hidden="true"
                    >
                      <defs>
                        <radialGradient id="xqRedToken" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FFFDF7" />
                          <stop offset="75%" stopColor="#FFF4DC" />
                          <stop offset="100%" stopColor="#DFC69E" />
                        </radialGradient>
                        <radialGradient id="xqBlackToken" cx="35%" cy="30%" r="70%">
                          <stop offset="0%" stopColor="#FAFAF7" />
                          <stop offset="75%" stopColor="#EFECE3" />
                          <stop offset="100%" stopColor="#CEC7B7" />
                        </radialGradient>
                      </defs>
                      {/* Red General */}
                      <circle cx="48" cy="36" r="24" fill="#8C4B38" />
                      <circle cx="48" cy="32" r="24" fill="url(#xqRedToken)" stroke="#B91C1C" strokeWidth="2.6" />
                      <circle cx="48" cy="32" r="19" fill="none" stroke="#B91C1C" strokeWidth="1.2" opacity="0.72" />
                      <circle cx="48" cy="32" r="16.5" fill="none" stroke="#B91C1C" strokeWidth="0.6" opacity="0.35" />
                      <text
                        x="48"
                        y="39"
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="700"
                        fill="#B91C1C"
                        fontFamily='"Noto Serif", "Plus Jakarta Sans", serif'
                      >
                        帥
                      </text>
                      {/* Black General */}
                      <circle cx="96" cy="36" r="24" fill="#334155" />
                      <circle cx="96" cy="32" r="24" fill="url(#xqBlackToken)" stroke="#0F172A" strokeWidth="2.6" />
                      <circle cx="96" cy="32" r="19" fill="none" stroke="#1E293B" strokeWidth="1.2" opacity="0.72" />
                      <circle cx="96" cy="32" r="16.5" fill="none" stroke="#1E293B" strokeWidth="0.6" opacity="0.35" />
                      <text
                        x="96"
                        y="39"
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="700"
                        fill="#0F172A"
                        fontFamily='"Noto Serif", "Plus Jakarta Sans", serif'
                      >
                        將
                      </text>
                    </svg>
                    <h2 className="font-display text-2xl sm:text-4xl mobile-ls:text-base font-bold tracking-tight text-white">
                      Sở Hà · Hán Giới
                    </h2>
                    <p className="hidden sm:block mobile-ls:hidden text-sm text-slate-300">
                      Đấu trí Cờ Tướng 2D cùng trí tuệ nhân tạo Alpha-Beta trên mọi thiết bị
                    </p>
                  </div>

                  {/* Difficulty Selection (10 Levels) */}
                  <div className="space-y-1.5 mobile-ls:space-y-1 text-left">
                    <div className="flex items-center justify-between gap-1.5">
                      <p className="text-[10px] sm:text-[11px] mobile-ls:text-[9px] font-mono uppercase tracking-wider text-amber-300 truncate">
                        1. Chọn Cấp AI
                      </p>
                      <span className="text-[10px] sm:text-xs mobile-ls:text-[9px] font-semibold text-amber-200 whitespace-nowrap">
                        {activeLevelInfo.badge} · {activeLevelInfo.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mobile-ls:gap-1">
                      {XIANGQI_LEVELS.map((cfg) => (
                        <button
                          key={cfg.level}
                          type="button"
                          aria-label={`Chọn ${cfg.badge} ${cfg.name}`}
                          onClick={() => setDifficulty(cfg.level)}
                          className={`min-h-[38px] mobile-ls:min-h-[28px] py-1.5 sm:py-2 mobile-ls:py-1 rounded-lg border text-center transition-all cursor-pointer ${
                            difficulty === cfg.level
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold shadow-sm'
                              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-[11px] sm:text-xs mobile-ls:text-[10px] font-mono leading-tight whitespace-nowrap">
                            <span className="mobile-ls:hidden">Cấp </span>
                            <span className="hidden mobile-ls:inline">C</span>
                            {cfg.level}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="mobile-ls:hidden text-[10px] sm:text-[11px] text-slate-300 bg-slate-900/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 leading-snug">
                      <strong className="text-amber-300">{activeLevelInfo.name}:</strong>{' '}
                      {activeLevelInfo.summary}
                    </p>
                  </div>

                  {/* Side Selection */}
                  <div className="space-y-1 text-left">
                    <p className="text-[10px] sm:text-[11px] mobile-ls:text-[9px] font-mono uppercase tracking-wider text-amber-300">
                      2. Chọn Phe Thi Đấu
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mobile-ls:gap-1">
                      <button
                        type="button"
                        onClick={() => setPlayerSide('red')}
                        className={`min-h-[42px] mobile-ls:min-h-[32px] px-2 py-2 sm:px-3 sm:py-2.5 mobile-ls:py-1 rounded-xl border text-[11px] sm:text-sm mobile-ls:text-[10px] font-semibold transition-all cursor-pointer ${
                          playerIsRed
                            ? 'bg-red-700 text-white border-red-400'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        Quân Đỏ <span className="mobile-ls:hidden">(Đi Trước)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerSide('black')}
                        className={`min-h-[42px] mobile-ls:min-h-[32px] px-2 py-2 sm:px-3 sm:py-2.5 mobile-ls:py-1 rounded-xl border text-[11px] sm:text-sm mobile-ls:text-[10px] font-semibold transition-all cursor-pointer ${
                          !playerIsRed
                            ? 'bg-slate-100 text-slate-950 border-white'
                            : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        Quân Đen <span className="mobile-ls:hidden">(Đi Sau)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    data-start="true"
                    onClick={() => startNewGame()}
                    className="w-full py-2.5 sm:py-3.5 mobile-ls:py-2 px-5 mobile-ls:px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base mobile-ls:text-xs inline-flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    Bắt Đầu Ván Đấu
                  </button>

                  <p className="mobile-ls:hidden text-[10px] sm:text-[11px] text-slate-300/90">
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
          <div className="w-full max-w-[500px] xl:max-w-[520px] mobile-ls:max-w-[min(100%,calc((100dvh-132px)*0.9))] flex items-center justify-between gap-2 px-3 py-2 mobile-ls:px-2 mobile-ls:py-1 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222]">
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

        {/* Right Side Control Dock & Live Match Log (Stacks cleanly below board on Mobile/Tablet, scrollable dock in Mobile Landscape) */}
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
                disabled={gameState !== 'playing' || sideToMove !== playerSide || isAiThinking}
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
                  Trình độ AI: <span className="text-[#0284C7] dark:text-[#38BDF8]">{activeLevelInfo.badge} · {activeLevelInfo.name}</span>
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
              <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Điều chỉnh nhanh cấp độ AI từ 1 đến 10">
                {XIANGQI_LEVELS.map((cfg) => (
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
            </div>
          </div>

          {/* Captured Pieces & Move Notation History */}
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

            {/* Captured Tactile Mini Tokens */}
            {(capturedStats.byPlayer.length > 0 || capturedStats.byAi.length > 0) && (
              <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#111C33]">
                <div>
                  <div className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                    Bạn đã ăn ({capturedStats.byPlayer.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-display font-bold text-xs">
                    {capturedStats.byPlayer.length > 0 ? (
                      capturedStats.byPlayer.map((p, idx) => (
                        <span
                          key={`${p.id}-${idx}`}
                          title={PIECE_DISPLAY_INFO[p.side][p.type].viName}
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center border shadow-xs ${
                            p.side === 'red'
                              ? 'bg-[#FFF8EC] text-[#B91C1C] border-[#B91C1C]/80'
                              : 'bg-[#F4F1EA] text-[#0F172A] border-[#1E293B]/80'
                          }`}
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
                  <div className="text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                    Máy đã ăn ({capturedStats.byAi.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-display font-bold text-xs">
                    {capturedStats.byAi.length > 0 ? (
                      capturedStats.byAi.map((p, idx) => (
                        <span
                          key={`${p.id}-${idx}`}
                          title={PIECE_DISPLAY_INFO[p.side][p.type].viName}
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center border shadow-xs ${
                            p.side === 'red'
                              ? 'bg-[#FFF8EC] text-[#B91C1C] border-[#B91C1C]/80'
                              : 'bg-[#F4F1EA] text-[#0F172A] border-[#1E293B]/80'
                          }`}
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
            <div className="max-h-56 mobile-ls:max-h-28 overflow-y-auto pr-1 space-y-1 text-xs">
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
