import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  Bug,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Eye,
  KeyRound,
  Maximize2,
  MousePointerClick,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  X,
} from 'lucide-react';
import {
  BROWSER_BREAKER_STAGES,
  checkInvisibleSelectionMatch,
  computeRamTick,
  computeResizeGapPx,
  computeWaterLevelPercent,
  createVirusPopup,
  isResizePuzzleSolved,
  normalizePhraseInput,
  STAGE1_SECRET_CODE,
  STAGE6_UNLOCK_PHRASE,
  STAGE8_PIN_CODE,
  VirusPopupItem,
} from '../utils/browserBreakerEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type ScreenState = 'title' | 'playing' | 'paused' | 'gameover';

interface BrowserBreakerGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const SAVE_KEY = 'thuanle-browser-breaker-v1';

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_KEY, String(score));
  } catch {
    // Ignore storage errors
  }
}

function playDomFx(
  kind: 'click' | 'pop' | 'unlock' | 'victory' | 'fail' | 'water',
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
      gain.gain.linearRampToValueAtTime(gainVal, now + delay + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    };

    if (kind === 'click') {
      playTone(480, 260, 0.05, 0.12, 'triangle');
    } else if (kind === 'pop') {
      playTone(620, 380, 0.07, 0.1, 'square');
    } else if (kind === 'water') {
      playTone(320, 520, 0.08, 0.08, 'sine');
    } else if (kind === 'unlock') {
      playTone(523.25, 523.25, 0.11, 0.16, 'triangle', 0);
      playTone(659.25, 659.25, 0.11, 0.16, 'triangle', 0.09);
      playTone(783.99, 783.99, 0.18, 0.2, 'triangle', 0.18);
    } else if (kind === 'victory') {
      playTone(523.25, 523.25, 0.12, 0.16, 'triangle', 0);
      playTone(659.25, 659.25, 0.12, 0.16, 'triangle', 0.1);
      playTone(783.99, 783.99, 0.14, 0.18, 'triangle', 0.2);
      playTone(1046.5, 1046.5, 0.28, 0.2, 'triangle', 0.32);
    } else if (kind === 'fail') {
      playTone(220, 120, 0.24, 0.2, 'sawtooth');
    }
  } catch {
    // Ignore blocked audio context
  }
}

export function BrowserBreakerGameSection({ theme }: BrowserBreakerGameSectionProps) {
  const [screenState, setScreenState] = useState<ScreenState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [stageIndex, setStageIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [stageClearedBanner, setStageClearedBanner] = useState<string | null>(null);
  const [viewportInfo, setViewportInfo] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  // Stage 1 states
  const [s1SelectionDetected, setS1SelectionDetected] = useState<boolean>(false);
  const [s1Input, setS1Input] = useState<string>('');
  const [s1Error, setS1Error] = useState<string>('');

  // Stage 2 states (Real Resize + Draggable Frame Edge)
  const s2ArenaRef = useRef<HTMLDivElement | null>(null);
  const s2DraggingRef = useRef<boolean>(false);
  const [s2CustomFrameWidth, setS2CustomFrameWidth] = useState<number | null>(null);
  const [s2GapPx, setS2GapPx] = useState<number>(280);

  // Stage 3 states (Scroll Water Level)
  const [s3WaterPercent, setS3WaterPercent] = useState<number>(0);

  // Stage 4 states (Virus Pop-ups + RAM)
  const [s4Popups, setS4Popups] = useState<VirusPopupItem[]>([]);
  const [s4ClosedCount, setS4ClosedCount] = useState<number>(0);
  const [s4RamPercent, setS4RamPercent] = useState<number>(28);
  const [s4RamCrashed, setS4RamCrashed] = useState<boolean>(false);
  const s4SeedRef = useRef<number>(1);

  // Stage 5 states (Shy Button + Tab Focus / CSS Transform toggle)
  const [s5DodgeEnabled, setS5DodgeEnabled] = useState<boolean>(true);
  const [s5ButtonPos, setS5ButtonPos] = useState<{ x: number; y: number }>({ x: 35, y: 38 });
  const [s5DodgeCount, setS5DodgeCount] = useState<number>(0);

  // Stage 6 states (Opacity Overlay + readOnly Inspector)
  const [s6GlassOpacity, setS6GlassOpacity] = useState<number>(92);
  const [s6InputReadOnly, setS6InputReadOnly] = useState<boolean>(true);
  const [s6Input, setS6Input] = useState<string>('');
  const [s6Error, setS6Error] = useState<string>('');

  // Stage 7 states (2D Scroll Maze)
  const [s7ScrollPos, setS7ScrollPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stage 8 states (Finale Multi-Hack)
  const [s8SelectionDetected, setS8SelectionDetected] = useState<boolean>(false);
  const [s8Popups, setS8Popups] = useState<VirusPopupItem[]>([]);
  const [s8RamPercent, setS8RamPercent] = useState<number>(42);
  const [s8PinInput, setS8PinInput] = useState<string>('');
  const [s8Error, setS8Error] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);

  const activeStage = BROWSER_BREAKER_STAGES[stageIndex] ?? BROWSER_BREAKER_STAGES[0];

  // Sync document.body.dataset.state cleanly
  useEffect(() => {
    document.body.dataset.state = screenState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [screenState]);

  // Live window resize telemetry
  useEffect(() => {
    const updateViewport = () => {
      setViewportInfo({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const resetStageLocalStates = useCallback((targetStageNum: number) => {
    setShowHint(false);
    setStageClearedBanner(null);

    if (targetStageNum === 1) {
      setS1SelectionDetected(false);
      setS1Input('');
      setS1Error('');
    } else if (targetStageNum === 2) {
      setS2CustomFrameWidth(null);
      setS2GapPx(280);
    } else if (targetStageNum === 3) {
      setS3WaterPercent(0);
    } else if (targetStageNum === 4) {
      s4SeedRef.current = 4;
      setS4Popups([createVirusPopup(1), createVirusPopup(2), createVirusPopup(3)]);
      setS4ClosedCount(0);
      setS4RamPercent(30);
      setS4RamCrashed(false);
    } else if (targetStageNum === 5) {
      setS5DodgeEnabled(true);
      setS5ButtonPos({ x: 35, y: 38 });
      setS5DodgeCount(0);
    } else if (targetStageNum === 6) {
      setS6GlassOpacity(92);
      setS6InputReadOnly(true);
      setS6Input('');
      setS6Error('');
    } else if (targetStageNum === 7) {
      setS7ScrollPos({ x: 0, y: 0 });
    } else if (targetStageNum === 8) {
      s4SeedRef.current = 12;
      setS8SelectionDetected(false);
      setS8Popups([createVirusPopup(5), createVirusPopup(6)]);
      setS8RamPercent(45);
      setS8PinInput('');
      setS8Error('');
    }
  }, []);

  const completeCurrentStage = useCallback(
    (bonusPoints = 0) => {
      if (stageClearedBanner) return;
      const earned = activeStage.baseScore + bonusPoints;
      setScore((prev) => {
        const next = prev + earned;
        setBestScore((prevBest) => {
          const updatedBest = Math.max(prevBest, next);
          saveBestScore(updatedBest);
          return updatedBest;
        });
        return next;
      });
      setStageClearedBanner(`Đã phá vỡ ${activeStage.code}: +${earned}đ!`);
      playDomFx('unlock', soundEnabled, audioCtxRef);
    },
    [activeStage, stageClearedBanner, soundEnabled]
  );

  const handleGoToNextStage = useCallback(() => {
    if (stageIndex + 1 >= BROWSER_BREAKER_STAGES.length) {
      setScreenState('gameover');
      playDomFx('victory', soundEnabled, audioCtxRef);
      return;
    }
    const nextIdx = stageIndex + 1;
    setStageIndex(nextIdx);
    resetStageLocalStates(BROWSER_BREAKER_STAGES[nextIdx].id);
  }, [stageIndex, resetStageLocalStates, soundEnabled]);

  const startNewGame = useCallback(
    (startIdx = 0) => {
      setStageIndex(startIdx);
      setScore(0);
      resetStageLocalStates(BROWSER_BREAKER_STAGES[startIdx].id);
      setScreenState('playing');
      playDomFx('click', soundEnabled, audioCtxRef);
    },
    [resetStageLocalStates, soundEnabled]
  );

  // STAGE 1 & STAGE 8: Native selectionchange listener
  useEffect(() => {
    if (screenState !== 'playing' || stageClearedBanner) return;
    if (activeStage.id !== 1 && activeStage.id !== 8) return;

    const onSelectionChange = () => {
      const selText = window.getSelection()?.toString() ?? '';
      if (activeStage.id === 1 && checkInvisibleSelectionMatch(selText, STAGE1_SECRET_CODE)) {
        setS1SelectionDetected(true);
      }
      if (activeStage.id === 8 && checkInvisibleSelectionMatch(selText, STAGE8_PIN_CODE)) {
        setS8SelectionDetected(true);
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, [screenState, activeStage.id, stageClearedBanner]);

  // STAGE 2: Real window.resize + ResizeObserver collision check
  useEffect(() => {
    if (screenState !== 'playing' || activeStage.id !== 2 || stageClearedBanner) return;

    const measureGap = () => {
      const el = s2ArenaRef.current;
      if (!el) return;
      const width = el.getBoundingClientRect().width;
      const gap = computeResizeGapPx(width, 96, 96, 24);
      setS2GapPx(gap);
      if (isResizePuzzleSolved(gap)) {
        completeCurrentStage(40);
      }
    };

    measureGap();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureGap) : null;
    if (ro && s2ArenaRef.current) {
      ro.observe(s2ArenaRef.current);
    }
    window.addEventListener('resize', measureGap);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measureGap);
    };
  }, [screenState, activeStage.id, stageClearedBanner, s2CustomFrameWidth, completeCurrentStage]);

  // STAGE 4: Virus popup replication & RAM loop
  useEffect(() => {
    if (screenState !== 'playing' || activeStage.id !== 4 || stageClearedBanner || s4RamCrashed) {
      return;
    }

    const ramTimer = window.setInterval(() => {
      setS4RamPercent((prevRam) => {
        const nextRam = computeRamTick(prevRam, s4Popups.length, 1);
        if (nextRam >= 100) {
          setS4RamCrashed(true);
          playDomFx('fail', soundEnabled, audioCtxRef);
        }
        return nextRam;
      });
    }, 1000);

    const spawnTimer = window.setInterval(() => {
      setS4Popups((prev) => {
        if (prev.length >= 6) return prev;
        s4SeedRef.current += 1;
        playDomFx('pop', soundEnabled, audioCtxRef);
        return [...prev, createVirusPopup(s4SeedRef.current)];
      });
    }, 1900);

    return () => {
      window.clearInterval(ramTimer);
      window.clearInterval(spawnTimer);
    };
  }, [screenState, activeStage.id, stageClearedBanner, s4RamCrashed, s4Popups.length, soundEnabled]);

  // STAGE 8: Finale RAM & virus loop
  useEffect(() => {
    if (screenState !== 'playing' || activeStage.id !== 8 || stageClearedBanner) return;

    const ramTimer = window.setInterval(() => {
      setS8RamPercent((prevRam) => computeRamTick(prevRam, s8Popups.length, 1));
    }, 1100);

    const spawnTimer = window.setInterval(() => {
      setS8Popups((prev) => {
        if (prev.length >= 5) return prev;
        s4SeedRef.current += 1;
        return [...prev, createVirusPopup(s4SeedRef.current)];
      });
    }, 2600);

    return () => {
      window.clearInterval(ramTimer);
      window.clearInterval(spawnTimer);
    };
  }, [screenState, activeStage.id, stageClearedBanner, s8Popups.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
        return;
      }

      if (screenState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewGame(0);
        }
        return;
      }

      if (screenState === 'playing' || screenState === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setScreenState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
          return;
        }
      }

      if (screenState === 'playing' && stageClearedBanner) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleGoToNextStage();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screenState, stageClearedBanner, startNewGame, handleGoToNextStage]);

  // Stage 2 drag handle logic
  const handleStage2PointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    s2DraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleStage2PointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!s2DraggingRef.current || !s2ArenaRef.current) return;
    const parentRect = s2ArenaRef.current.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    const rawW = Math.round(e.clientX - parentRect.left);
    const clampedW = Math.max(198, Math.min(parentRect.width, rawW));
    setS2CustomFrameWidth(clampedW);
  };

  const handleStage2PointerUp = () => {
    s2DraggingRef.current = false;
  };

  return (
    <section
      id="browser-breaker-section"
      aria-label="Phá Vỡ Trình Duyệt — Browser-Breaking Meta-UI Puzzle"
      data-theme={theme}
      className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#0B1222] text-[#0F172A] dark:text-[#E2E8F0] shadow-[0_14px_40px_-20px_rgba(10,25,47,0.16)] overflow-hidden"
    >
      {/* TITLE SCREEN */}
      {screenState === 'title' && (
        <div className="p-4 sm:p-7 lg:p-8 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.12em] text-[#0284C7] dark:text-sky-400">
                <span>Meta-UI Puzzle · Không Dùng Canvas</span>
                <span>·</span>
                <span>{BROWSER_BREAKER_STAGES.length} Màn Phá Vỡ DOM</span>
                {bestScore > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      Kỷ lục: {bestScore}đ
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.1rem] font-bold tracking-tight text-[#0A192F] dark:text-white leading-tight">
                Phá Vỡ Trình Duyệt
              </h1>

              <p className="text-sm sm:text-[15px] text-[#334155] dark:text-[#CBD5E1] leading-relaxed max-w-2xl">
                Chính giao diện HTML/CSS của trang web là mê cung! Giải đố bằng cách{' '}
                <strong>bôi đen chữ tàng hình</strong>,{' '}
                <strong>kéo ép cửa sổ trình duyệt</strong>,{' '}
                <strong>cuộn thanh cuộn dâng nước</strong>,{' '}
                <strong>lách phím Tab</strong> và{' '}
                <strong>diệt pop-up virus trước khi tràn RAM</strong>.
              </p>

              {/* Stage Quick Preview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BROWSER_BREAKER_STAGES.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => startNewGame(idx)}
                    className="px-2.5 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-[#0284C7] text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] font-mono font-bold text-[#0284C7] dark:text-sky-400">
                      Màn {st.id} · {st.code}
                    </div>
                    <div className="text-xs font-semibold text-[#0F172A] dark:text-white truncate mt-0.5">
                      {st.title}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startNewGame(0)}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm sm:text-base shadow-md transition-colors cursor-pointer"
                >
                  <Terminal className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Bắt Đầu Phá Vỡ (Màn 1)</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Browser Window Graphic */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#CBD8E6] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 sm:p-5 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-[#DCE6F2] dark:border-[#1E2E4A] pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                    {viewportInfo.w} × {viewportInfo.h}px
                  </span>
                </div>

                <svg
                  viewBox="0 0 280 145"
                  className="w-full h-36 text-[#0A192F] dark:text-sky-300"
                  role="img"
                  aria-label="Minh họa cơ chế DOM Phá Vỡ Trình Duyệt"
                >
                  <rect
                    x="14"
                    y="12"
                    width="252"
                    height="120"
                    rx="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  <rect x="30" y="40" width="64" height="64" rx="8" fill="#0284C7" fillOpacity="0.18" stroke="#0284C7" strokeWidth="2.5" />
                  <rect x="186" y="40" width="64" height="64" rx="8" fill="#E11D48" fillOpacity="0.16" stroke="#E11D48" strokeWidth="2.5" />
                  <path d="M108 72 L172 72" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 4" />
                  <polygon points="104,72 114,66 114,78" fill="#0284C7" />
                  <polygon points="176,72 166,66 166,78" fill="#E11D48" />
                  <text x="140" y="122" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="currentColor">
                    &lt;div&gt; resize · scroll · selection
                  </text>
                </svg>

                <p className="text-xs text-center text-[#475569] dark:text-[#94A3B8]">
                  Tương tác thật với DOM Events của trình duyệt trên cả máy tính lẫn điện thoại.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING / PAUSED */}
      {(screenState === 'playing' || screenState === 'paused') && (
        <div className="relative">
          {/* Sandbox Top Browser HUD */}
          <div className="border-b border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F1F5F9] dark:bg-[#0F172A] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="font-bold px-2 py-0.5 rounded bg-[#0A192F] dark:bg-[#0284C7] text-white">
                {activeStage.code}
              </span>
              <strong className="text-sm font-sans text-[#0F172A] dark:text-white">
                {activeStage.title}
              </strong>
              <span className="text-[#64748B] dark:text-[#94A3B8]">
                ({activeStage.domEventTag})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              <span>
                Màn: <strong>{stageIndex + 1}/{BROWSER_BREAKER_STAGES.length}</strong>
              </span>
              <span>
                Điểm: <strong className="text-[#0284C7] dark:text-sky-400">{score}đ</strong>
              </span>
              <span className="hidden sm:inline text-[#64748B] dark:text-[#94A3B8]">
                Viewport: {viewportInfo.w}×{viewportInfo.h}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="px-2.5 h-9 rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] text-xs font-medium hover:border-[#0284C7] cursor-pointer"
                >
                  {showHint ? 'Ẩn gợi ý' : 'Gợi ý'}
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                  className="w-9 h-9 rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] flex items-center justify-center hover:border-[#0284C7] cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setScreenState((prev) => (prev === 'paused' ? 'playing' : 'paused'))}
                  aria-label={screenState === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                  className="w-9 h-9 rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] flex items-center justify-center hover:border-[#0284C7] cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stage Objective Strip */}
          <div className="px-3 sm:px-5 pt-3.5 pb-2 space-y-2">
            <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] p-3 text-xs sm:text-sm text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed">
              <strong className="text-[#0284C7] dark:text-sky-400">Nhiệm vụ: </strong>
              {activeStage.objective}
            </div>

            {showHint && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-900 dark:text-amber-200">
                <strong>Mẹo kỹ thuật:</strong> {activeStage.hint}
              </div>
            )}
          </div>

          {/* STAGE SANDBOX ARENA */}
          <div className="px-3 sm:px-5 pb-5 space-y-4">
            {/* STAGE 1: INVISIBLE INK SELECTIONCHANGE */}
            {activeStage.id === 1 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 sm:p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <p className="font-mono text-xs uppercase text-[#64748B] dark:text-[#94A3B8]">
                    Thông báo nội bộ trình duyệt #01
                  </p>
                  <p className="text-[#0F172A] dark:text-[#CBD5E1]">
                    Hệ thống đã niêm phong mật mã mở cửa ngay bên dưới dòng chữ này bằng màu mực
                    trùng tuyệt đối với màu nền. Hãy quét bôi đen khoảng trắng dưới đây để nhìn thấy:
                  </p>

                  {/* White-on-White Hidden Ink Container */}
                  <div className="rounded-lg border border-dashed border-[#CBD5E1] dark:border-[#2A3B5E] bg-white dark:bg-[#0B1222] p-4">
                    <p className="select-text text-white dark:text-[#0B1222] selection:bg-[#0284C7] selection:text-white font-mono text-base sm:text-lg font-bold tracking-wider">
                      MÃ BÍ MẬT LÀ: {STAGE1_SECRET_CODE}
                    </p>
                  </div>

                  {s1SelectionDetected && (
                    <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>DOM Event selectionchange đã kích hoạt! Bạn đã soi thấy mật mã.</span>
                    </p>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (normalizePhraseInput(s1Input) === STAGE1_SECRET_CODE) {
                      completeCurrentStage(s1SelectionDetected ? 30 : 0);
                    } else {
                      setS1Error('Mật mã chưa đúng — hãy bôi đen dòng trắng phía trên để đọc!');
                      playDomFx('fail', soundEnabled, audioCtxRef);
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={s1Input}
                    onChange={(e) => {
                      setS1Input(e.target.value);
                      setS1Error('');
                    }}
                    placeholder="Nhập mật mã vừa soi được..."
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] font-mono text-sm uppercase"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Mở Khóa Màn 1</span>
                  </button>
                </form>
                {s1Error && <p className="text-xs text-rose-600 dark:text-rose-400">{s1Error}</p>}
              </div>
            )}

            {/* STAGE 2: RESIZE WINDOW / COLLISION */}
            {activeStage.id === 2 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-[#0F172A] dark:text-white font-bold">
                    <Maximize2 className="w-4 h-4 text-[#0284C7]" />
                    <span>Khoảng cách giữa 2 khối DOM: {s2GapPx}px</span>
                  </span>
                  {s2CustomFrameWidth !== null && (
                    <button
                      type="button"
                      onClick={() => setS2CustomFrameWidth(null)}
                      className="underline text-[#0284C7] cursor-pointer"
                    >
                      Đặt lại chiều rộng khung
                    </button>
                  )}
                </div>

                {/* Elastic Resize Container */}
                <div className="w-full overflow-hidden">
                  <div
                    ref={s2ArenaRef}
                    style={
                      s2CustomFrameWidth !== null ? { width: `${s2CustomFrameWidth}px` } : undefined
                    }
                    className="relative h-44 rounded-xl border-2 border-dashed border-[#0284C7] bg-white dark:bg-[#0B1222] px-3 flex items-center justify-between transition-[border-color]"
                  >
                    <div className="w-24 h-24 rounded-xl bg-[#0284C7] text-white flex flex-col items-center justify-center text-center shadow-md shrink-0 select-none">
                      <span className="text-xs font-mono font-bold">KHỐI A</span>
                      <span className="text-[10px] opacity-85">Nam Châm +</span>
                    </div>

                    <div className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8] text-center px-1 truncate">
                      {s2GapPx <= 4 ? 'CHẠM NHAU!' : `← ${s2GapPx}px →`}
                    </div>

                    <div className="w-24 h-24 rounded-xl bg-rose-600 text-white flex flex-col items-center justify-center text-center shadow-md shrink-0 select-none">
                      <span className="text-xs font-mono font-bold">KHỐI B</span>
                      <span className="text-[10px] opacity-85">Nam Châm -</span>
                    </div>

                    {/* Interactive Draggable Right Edge Splitter */}
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Kéo viền phải để thu hẹp cửa sổ mô phỏng"
                      onPointerDown={handleStage2PointerDown}
                      onPointerMove={handleStage2PointerMove}
                      onPointerUp={handleStage2PointerUp}
                      className="absolute top-0 right-0 bottom-0 w-4 bg-[#0284C7]/15 hover:bg-[#0284C7]/35 border-l border-[#0284C7] cursor-ew-resize flex items-center justify-center touch-none"
                      title="Kéo sang trái để thu hẹp khung!"
                    >
                      <div className="w-1 h-8 rounded-full bg-[#0284C7]" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Bạn có thể tự <strong>kéo nhỏ cửa sổ trình duyệt</strong> hoặc <strong>kéo thanh màu xanh ở mép phải khung hộp sang trái</strong> cho đến khi Khối A chạm Khối B.
                </p>
              </div>
            )}

            {/* STAGE 3: SCROLL WATER LEVEL */}
            {activeStage.id === 3 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#0284C7] dark:text-sky-400">
                    <Waves className="w-4 h-4" />
                    <span>Mực nước hiện tại: {s3WaterPercent}% (Mục tiêu &gt;= 92%)</span>
                  </span>
                </div>

                <div
                  onScroll={(e) => {
                    if (stageClearedBanner) return;
                    const el = e.currentTarget;
                    const pct = computeWaterLevelPercent(
                      el.scrollTop,
                      el.scrollHeight,
                      el.clientHeight
                    );
                    setS3WaterPercent(pct);
                    if (pct >= 92) {
                      completeCurrentStage(20);
                    }
                  }}
                  className="relative h-64 overflow-y-auto rounded-xl border-2 border-[#0284C7] bg-white dark:bg-[#0B1222]"
                >
                  {/* Sticky Visual Tank inside the Scroll Container */}
                  <div className="sticky top-0 left-0 right-0 h-64 pointer-events-none overflow-hidden flex flex-col justify-between p-3">
                    {/* Top Target Sensor Bar */}
                    <div className="z-10 border-b-2 border-dashed border-emerald-500 pb-1 flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>▲ VẠCH CẢM BIẾN NỔI (92%)</span>
                      <span>scrollTop: {s3WaterPercent}%</span>
                    </div>

                    {/* Rising Water Column */}
                    <div
                      style={{ height: `${s3WaterPercent}%` }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-600/80 to-cyan-400/55 border-t-2 border-cyan-300 transition-[height] duration-75 flex justify-center"
                    >
                      <div className="-mt-5 px-3 py-1 rounded-full bg-amber-400 text-[#0A192F] font-mono text-xs font-bold shadow-md flex items-center gap-1 h-8">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>PHAO CHÌA KHÓA</span>
                      </div>
                    </div>
                  </div>

                  {/* Tall Invisible Scroll Track */}
                  <div className="h-[980px] flex flex-col justify-between items-center py-6 text-xs font-mono text-[#94A3B8] pointer-events-none select-none">
                    <span>↓ Cuộn xuống dưới để bơm nước dâng lên ↓</span>
                    <span>Đang bơm... 50%</span>
                    <span>Sắp chạm cảm biến...</span>
                    <span>Đáy bể chứa!</span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: VIRUS POPUPS + RAM */}
            {activeStage.id === 4 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <Bug className="w-4 h-4" />
                    <span>Đã diệt virus: {s4ClosedCount}/10</span>
                  </span>

                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Cpu className="w-4 h-4 text-[#0284C7]" />
                    <span>RAM:</span>
                    <div className="w-24 h-2.5 rounded-full bg-[#CBD5E1] dark:bg-[#1E293B] overflow-hidden">
                      <div
                        style={{ width: `${s4RamPercent}%` }}
                        className={`h-full transition-all ${
                          s4RamPercent >= 80
                            ? 'bg-rose-600'
                            : s4RamPercent >= 55
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <strong className={s4RamPercent >= 80 ? 'text-rose-600' : ''}>
                      {s4RamPercent}%
                    </strong>
                  </div>
                </div>

                {/* Desktop Pop-up Chaos Arena */}
                <div className="relative h-72 rounded-xl border border-[#CBD5E1] dark:border-[#1E2E4A] bg-[#E2E8F0]/70 dark:bg-[#080F1D] overflow-hidden">
                  {s4Popups.map((popup) => (
                    <div
                      key={popup.id}
                      style={{ left: `${popup.xPercent}%`, top: `${popup.yPercent}%` }}
                      className="absolute w-52 sm:w-60 rounded-lg border-2 border-rose-600 bg-white dark:bg-[#111C33] shadow-lg overflow-hidden z-10"
                    >
                      <div className="bg-rose-600 text-white px-2.5 py-1 flex items-center justify-between gap-1 text-[11px] font-mono font-bold">
                        <span className="truncate">{popup.title}</span>
                        <button
                          type="button"
                          aria-label={`Đóng pop-up ${popup.title}`}
                          onClick={() => {
                            if (s4RamCrashed || stageClearedBanner) return;
                            setS4Popups((prev) => prev.filter((p) => p.id !== popup.id));
                            setS4RamPercent((prev) => Math.max(15, prev - 6));
                            playDomFx('click', soundEnabled, audioCtxRef);
                            setS4ClosedCount((prev) => {
                              const next = prev + 1;
                              if (next >= 10) {
                                completeCurrentStage(50);
                              }
                              return next;
                            });
                          }}
                          className="w-6 h-6 rounded bg-black/25 hover:bg-black/45 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="p-2.5 text-xs text-[#334155] dark:text-[#CBD5E1] leading-snug">
                        {popup.body}
                      </p>
                    </div>
                  ))}

                  {s4Popups.length === 0 && !s4RamCrashed && !stageClearedBanner && (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-[#64748B]">
                      Đang quét gói tin virus tiếp theo...
                    </div>
                  )}

                  {s4RamCrashed && (
                    <div className="absolute inset-0 z-20 bg-rose-950/90 text-white flex flex-col items-center justify-center p-4 text-center space-y-3">
                      <AlertOctagon className="w-10 h-10 text-rose-400" />
                      <h3 className="font-mono font-bold text-base">
                        TRÀN BỘ NHỚ RAM (100%)!
                      </h3>
                      <p className="text-xs text-rose-100 max-w-xs">
                        Pop-up virus nhân bản quá nhanh! Hãy khởi động lại màn này và đóng nhanh tay hơn.
                      </p>
                      <button
                        type="button"
                        onClick={() => resetStageLocalStates(4)}
                        className="px-4 py-2 rounded-xl bg-white text-rose-900 font-bold text-xs cursor-pointer"
                      >
                        Thử Lại Màn 4
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 5: SHY DODGING BUTTON + TAB FOCUS HACK */}
            {activeStage.id === 5 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="relative h-56 rounded-xl border border-dashed border-[#94A3B8] bg-white dark:bg-[#0B1222] overflow-hidden">
                  <button
                    type="button"
                    style={{ left: `${s5ButtonPos.x}%`, top: `${s5ButtonPos.y}%` }}
                    onMouseEnter={() => {
                      if (!s5DodgeEnabled || stageClearedBanner) return;
                      const nx = 8 + Math.floor(Math.random() * 58);
                      const ny = 10 + Math.floor(Math.random() * 62);
                      setS5ButtonPos({ x: nx, y: ny });
                      setS5DodgeCount((c) => c + 1);
                      playDomFx('pop', soundEnabled, audioCtxRef);
                    }}
                    onClick={() => completeCurrentStage(s5DodgeEnabled ? 60 : 0)}
                    className="absolute px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] focus:ring-4 focus:ring-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg transition-all duration-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <MousePointerClick className="w-4 h-4" />
                    <span>HOÀN THÀNH MÀN 5</span>
                  </button>
                </div>

                {/* Fake DevTools Property Toggle */}
                <div className="rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-[#0F172A] text-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <Code2 className="w-4 h-4" />
                    <span>DevTools · Số lần nút né chuột: {s5DodgeCount}</span>
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={s5DodgeEnabled}
                      onChange={(e) => setS5DodgeEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#0284C7]"
                    />
                    <span>CSS Dodge (Né con trỏ chuột)</span>
                  </label>
                </div>
              </div>
            )}

            {/* STAGE 6: OPACITY GLASS BLOCKER + READONLY BYPASS */}
            {activeStage.id === 6 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="relative rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#0B1222] p-5 space-y-3 overflow-hidden">
                  <p className="text-xs font-mono text-[#64748B]">
                    Nhập cụm từ <strong className="text-[#0284C7]">PHA VO</strong> vào ô bên dưới rồi nhấn xác nhận:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readOnly={s6InputReadOnly}
                      value={s6Input}
                      onChange={(e) => {
                        setS6Input(e.target.value);
                        setS6Error('');
                      }}
                      placeholder={
                        s6InputReadOnly ? '[Đang bị khóa readOnly!]' : 'Gõ PHA VO...'
                      }
                      className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#111C33] font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (normalizePhraseInput(s6Input) === STAGE6_UNLOCK_PHRASE) {
                          completeCurrentStage(20);
                        } else {
                          setS6Error('Hãy gỡ khóa readOnly và nhập chính xác chữ PHA VO!');
                          playDomFx('fail', soundEnabled, audioCtxRef);
                        }
                      }}
                      className="min-h-[44px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm cursor-pointer"
                    >
                      Mở Khóa
                    </button>
                  </div>
                  {s6Error && <p className="text-xs text-rose-600">{s6Error}</p>}

                  {/* Obstructing Overlay controlled by Slider */}
                  {s6GlassOpacity > 0 && (
                    <div
                      style={{
                        opacity: s6GlassOpacity / 100,
                        pointerEvents: s6GlassOpacity > 20 ? 'auto' : 'none',
                      }}
                      className="absolute inset-0 z-10 bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center"
                    >
                      <ShieldAlert className="w-8 h-8 text-amber-400 mb-1" />
                      <p className="font-bold text-sm">TẤM KÍNH CHẮN DOM (Opacity: {s6GlassOpacity}%)</p>
                      <p className="text-xs text-slate-300">
                        Không thể bấm xuyên qua khi opacity &gt; 20%!
                      </p>
                    </div>
                  )}
                </div>

                {/* Live CSS/HTML Inspector Controls */}
                <div className="rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-[#0F172A] text-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <label className="flex items-center gap-2">
                    <span>CSS Opacity: {s6GlassOpacity}%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={s6GlassOpacity}
                      onChange={(e) => setS6GlassOpacity(Number(e.target.value))}
                      className="accent-[#0284C7] cursor-pointer"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={s6InputReadOnly}
                      onChange={(e) => setS6InputReadOnly(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <span>Thuộc tính readOnly</span>
                  </label>
                </div>
              </div>
            )}

            {/* STAGE 7: 2D SCROLL MAZE */}
            {activeStage.id === 7 && (
              <div className="rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#0284C7] dark:text-sky-400">
                    <Compass className="w-4 h-4" />
                    <span>Tọa độ cuộn: X = {s7ScrollPos.x}px · Y = {s7ScrollPos.y}px</span>
                  </span>
                  <span className="text-[#64748B] dark:text-[#94A3B8]">
                    Mục tiêu ẩn ở vùng (X ~ 760px, Y ~ 560px)
                  </span>
                </div>

                <div
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    setS7ScrollPos({ x: Math.round(el.scrollLeft), y: Math.round(el.scrollTop) });
                  }}
                  className="h-64 overflow-auto rounded-xl border-2 border-[#0284C7] bg-white dark:bg-[#0B1222]"
                >
                  <div className="relative w-[1080px] h-[780px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]">
                    <div className="p-4 text-xs font-mono text-[#64748B]">
                      (0, 0) · Hãy cuộn ngang sang phải và cuộn dọc xuống dưới...
                    </div>
                    <div className="absolute left-[420px] top-[280px] text-xs font-mono text-[#94A3B8]">
                      Đi tiếp về hướng Đông Nam ↘
                    </div>
                    <button
                      type="button"
                      onClick={() => completeCurrentStage(30)}
                      className="absolute left-[780px] top-[580px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shadow-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <ScrollText className="w-4 h-4" />
                      <span>[ĐIỂM MÙ DOM · NHẤN ĐỂ QUA MÀN]</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 8: FINALE MULTI-HACK */}
            {activeStage.id === 8 && (
              <div className="rounded-xl border-2 border-rose-500/70 bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    RAM Hệ Thống: {s8RamPercent}% (Phải &lt; 85%)
                  </span>
                  <span className="text-[#64748B]">
                    {s8SelectionDetected ? '✓ Đã soi thấy PIN ẩn' : 'Chưa soi PIN ẩn'}
                  </span>
                </div>

                {/* Invisible PIN Hint Zone */}
                <div className="rounded-lg border border-dashed border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#0B1222] p-3">
                  <p className="text-xs text-[#64748B] mb-1">
                    Bôi đen vùng trống bên dưới để tìm mã PIN 4 số:
                  </p>
                  <p className="select-text text-white dark:text-[#0B1222] selection:bg-rose-600 selection:text-white font-mono font-bold text-sm">
                    PIN REBOOT TRÌNH DUYỆT: {STAGE8_PIN_CODE}
                  </p>
                </div>

                {/* Active Virus Pop-ups Area */}
                <div className="relative h-44 rounded-xl border border-[#CBD5E1] dark:border-[#1E2E4A] bg-[#E2E8F0]/70 dark:bg-[#080F1D] overflow-hidden">
                  {s8Popups.map((popup) => (
                    <div
                      key={popup.id}
                      style={{ left: `${popup.xPercent}%`, top: `${Math.min(48, popup.yPercent)}%` }}
                      className="absolute w-48 rounded-lg border border-rose-600 bg-white dark:bg-[#111C33] shadow-md overflow-hidden z-10"
                    >
                      <div className="bg-rose-600 text-white px-2 py-1 flex items-center justify-between text-[10px] font-mono font-bold">
                        <span className="truncate">{popup.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setS8Popups((prev) => prev.filter((p) => p.id !== popup.id));
                            setS8RamPercent((prev) => Math.max(20, prev - 10));
                            playDomFx('click', soundEnabled, audioCtxRef);
                          }}
                          className="w-5 h-5 rounded bg-black/25 flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="p-2 text-[11px] text-[#334155] dark:text-[#CBD5E1]">
                        {popup.body}
                      </p>
                    </div>
                  ))}
                  {s8Popups.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      RAM đã ổn định! Hãy nhập PIN để khởi động lại DOM.
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (s8RamPercent >= 85) {
                      setS8Error('RAM đang >= 85%, hãy tắt bớt pop-up trước khi Reboot!');
                      playDomFx('fail', soundEnabled, audioCtxRef);
                      return;
                    }
                    if (normalizePhraseInput(s8PinInput) !== STAGE8_PIN_CODE) {
                      setS8Error('Sai mã PIN! Bôi đen khung chữ trắng phía trên để lấy PIN.');
                      playDomFx('fail', soundEnabled, audioCtxRef);
                      return;
                    }
                    completeCurrentStage(80);
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    value={s8PinInput}
                    onChange={(e) => {
                      setS8PinInput(e.target.value);
                      setS8Error('');
                    }}
                    placeholder="Nhập PIN 4 số..."
                    className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] font-mono text-sm"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>KHỞI ĐỘNG LẠI DOM</span>
                  </button>
                </form>
                {s8Error && <p className="text-xs text-rose-600">{s8Error}</p>}
              </div>
            )}

            {/* STAGE CLEARED BANNER */}
            {stageClearedBanner && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-950/45 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white">
                      {stageClearedBanner}
                    </h3>
                    <p className="text-xs text-[#334155] dark:text-[#CBD5E1]">
                      Bấm nút bên cạnh (hoặc Enter) để chuyển sang thử thách tiếp theo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoToNextStage}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>
                    {stageIndex + 1 >= BROWSER_BREAKER_STAGES.length
                      ? 'Xem Kết Quả Chung Cuộc'
                      : `Sang Màn ${stageIndex + 2}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* PAUSED OVERLAY */}
          {screenState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#0A192F]/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border border-[#243454] bg-white dark:bg-[#0F172A] p-6 text-center space-y-4 shadow-2xl">
                <h2 className="font-serif text-xl font-bold text-[#0A192F] dark:text-white">
                  Tạm Dừng Phá Vỡ DOM
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Màn {stageIndex + 1}/{BROWSER_BREAKER_STAGES.length} · Điểm: {score}đ
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setScreenState('playing')}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-[#0284C7] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Tiếp Tục Chơi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreenState('title')}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#243454] text-sm font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer"
                  >
                    Về Màn Hình Chọn Màn
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VICTORY / GAMEOVER SCREEN */}
      {screenState === 'gameover' && (
        <div className="p-6 sm:p-10 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#0284C7] dark:text-sky-400 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bậc Thầy Kiểm Soát DOM</span>
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A192F] dark:text-white">
              Bạn Đã Phá Vỡ Thành Công Tất Cả {BROWSER_BREAKER_STAGES.length} Màn!
            </h2>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
              Không một cửa sổ pop-up hay lớp CSS ẩn nào có thể làm khó được bạn.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] p-4 font-mono tabular-nums">
            <div>
              <p className="text-[11px] text-[#64748B]">Tổng Điểm Lần Này</p>
              <p className="text-lg font-bold text-[#0284C7] dark:text-sky-400">{score}đ</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B]">Điểm Kỷ Lục</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{bestScore}đ</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={() => startNewGame(0)}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Từ Màn 1</span>
            </button>
            <button
              type="button"
              onClick={() => setScreenState('title')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] text-sm font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer"
            >
              Chọn Màn Khác
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
