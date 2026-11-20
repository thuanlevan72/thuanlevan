import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import {
  AlertOctagon,
  ArrowRight,
  Bomb,
  Bug,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Eye,
  Flame,
  Hammer,
  Maximize2,
  MousePointerClick,
  Pause,
  Play,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import {
  BROWSER_BREAKER_STAGES,
  checkInvisibleSelectionMatch,
  computeMazeTargetDistance,
  computeRamTick,
  computeResizeGapPx,
  computeWaterLevelPercent,
  createDomExplosionShards,
  createVirusPopup,
  DomExplosionShard,
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

const DODGE_TAUNTS = [
  'HỤT RỒI LÊU LÊU!',
  'CHẬM QUÁ BẠN ƠI!',
  'ĐỐ BẮT ĐƯỢC TÔI!',
  'DÙNG PHÍM TAB ĐI!',
] as const;

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

function playDestructionFx(
  kind: 'click' | 'smash' | 'boom' | 'shatter' | 'emp' | 'victory' | 'fail',
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
      osc.frequency.exponentialRampToValueAtTime(Math.max(28, endFreq), now + delay + duration);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(gainVal, now + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.03);
    };

    const playNoiseBurst = (duration: number, filterFreq: number, gainVal: number, delay = 0) => {
      const sampleRate = ctx.sampleRate;
      const frameCount = Math.max(1, Math.floor(sampleRate * duration));
      const buffer = ctx.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now + delay);
    };

    if (kind === 'click') {
      playTone(460, 220, 0.05, 0.12, 'triangle');
    } else if (kind === 'smash') {
      playTone(210, 58, 0.14, 0.22, 'sawtooth');
      playNoiseBurst(0.11, 1100, 0.18);
    } else if (kind === 'shatter') {
      playTone(980, 320, 0.08, 0.14, 'square', 0);
      playTone(1340, 480, 0.1, 0.12, 'square', 0.03);
      playNoiseBurst(0.18, 2800, 0.22, 0);
    } else if (kind === 'boom') {
      playTone(155, 32, 0.34, 0.28, 'sawtooth', 0);
      playNoiseBurst(0.32, 420, 0.28, 0);
      playTone(580, 240, 0.14, 0.15, 'square', 0.06);
    } else if (kind === 'emp') {
      playTone(920, 65, 0.36, 0.24, 'sawtooth', 0);
      playNoiseBurst(0.24, 1600, 0.2, 0.04);
    } else if (kind === 'victory') {
      playTone(150, 34, 0.35, 0.26, 'sawtooth', 0);
      playNoiseBurst(0.26, 700, 0.22, 0);
      playTone(523.25, 523.25, 0.12, 0.16, 'triangle', 0.14);
      playTone(659.25, 659.25, 0.12, 0.16, 'triangle', 0.24);
      playTone(1046.5, 1046.5, 0.28, 0.22, 'triangle', 0.36);
    } else if (kind === 'fail') {
      playTone(210, 95, 0.24, 0.2, 'sawtooth');
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

  // Destructive FX States (Shards, Shake, Hammer Mode, Chaos Combo)
  const [shards, setShards] = useState<DomExplosionShard[]>([]);
  const [shakeMode, setShakeMode] = useState<'none' | 'light' | 'heavy'>('none');
  const [shakeTick, setShakeTick] = useState<number>(0);
  const [chaosLevel, setChaosLevel] = useState<number>(0); // 0..100 overall wreckage
  const [brokenWidgetsCount, setBrokenWidgetsCount] = useState<number>(0);
  const [hammerActive, setHammerActive] = useState<boolean>(false);
  const [crackedWidgets, setCrackedWidgets] = useState<Record<string, boolean>>({});
  const [titleCracked, setTitleCracked] = useState<boolean>(false);

  // Stage 1 states
  const [s1SelectionDetected, setS1SelectionDetected] = useState<boolean>(false);
  const [s1Input, setS1Input] = useState<string>('');
  const [s1Error, setS1Error] = useState<string>('');

  // Stage 2 states (Hydraulic Resize Crusher)
  const s2ArenaRef = useRef<HTMLDivElement | null>(null);
  const s2DraggingRef = useRef<boolean>(false);
  const [s2CustomFrameWidth, setS2CustomFrameWidth] = useState<number | null>(null);
  const [s2GapPx, setS2GapPx] = useState<number>(280);

  // Stage 3 states (Flood Pressure Tank)
  const [s3WaterPercent, setS3WaterPercent] = useState<number>(0);

  // Stage 4 states (Virus Swarm + Combo + EMP Nuke)
  const [s4Popups, setS4Popups] = useState<VirusPopupItem[]>([]);
  const [s4ClosedCount, setS4ClosedCount] = useState<number>(0);
  const [s4Combo, setS4Combo] = useState<number>(0);
  const [s4RamPercent, setS4RamPercent] = useState<number>(28);
  const [s4RamCrashed, setS4RamCrashed] = useState<boolean>(false);
  const s4SeedRef = useRef<number>(1);

  // Stage 5 states (Taunting Escaping Button)
  const [s5DodgeEnabled, setS5DodgeEnabled] = useState<boolean>(true);
  const [s5ButtonPos, setS5ButtonPos] = useState<{ x: number; y: number }>({ x: 35, y: 38 });
  const [s5DodgeCount, setS5DodgeCount] = useState<number>(0);
  const [s5Taunt, setS5Taunt] = useState<string>('Bắt được tôi đi rồi tính!');

  // Stage 6 states (Scam Curtain Troll + Opacity/readOnly Hack)
  const [s6GlassOpacity, setS6GlassOpacity] = useState<number>(92);
  const [s6InputReadOnly, setS6InputReadOnly] = useState<boolean>(true);
  const [s6Input, setS6Input] = useState<string>('');
  const [s6Error, setS6Error] = useState<string>('');
  const [s6TrollNote, setS6TrollNote] = useState<string>('');

  // Stage 7 states (2D Scroll Maze + Sonar)
  const [s7ScrollPos, setS7ScrollPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Stage 8 states (DOM Apocalypse Boss)
  const [s8SelectionDetected, setS8SelectionDetected] = useState<boolean>(false);
  const [s8Popups, setS8Popups] = useState<VirusPopupItem[]>([]);
  const [s8RamPercent, setS8RamPercent] = useState<number>(42);
  const [s8PinInput, setS8PinInput] = useState<string>('');
  const [s8Error, setS8Error] = useState<string>('');
  const [s8ApocalypseActive, setS8ApocalypseActive] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeStage = BROWSER_BREAKER_STAGES[stageIndex] ?? BROWSER_BREAKER_STAGES[0];

  const triggerExplosion = useCallback(
    (
      count = 14,
      originX = 50,
      originY = 48,
      intensity: 'light' | 'heavy' = 'light',
      fxKind: 'smash' | 'boom' | 'shatter' | 'emp' | 'fail' = 'smash'
    ) => {
      const burst = createDomExplosionShards(count, originX, originY);
      setShards((prev) => [...prev.slice(-16), ...burst]);
      setShakeMode(intensity);
      setShakeTick((t) => t + 1);
      setBrokenWidgetsCount((c) => c + count);
      setChaosLevel((prev) => Math.min(100, prev + (intensity === 'heavy' ? 14 : 5)));
      playDestructionFx(fxKind, soundEnabled, audioCtxRef);

      window.setTimeout(() => {
        setShards((prev) => prev.filter((item) => !burst.some((b) => b.id === item.id)));
      }, 780);
    },
    [soundEnabled]
  );

  const smashWidgetWithHammer = useCallback(
    (widgetKey: string, xPct = 50, yPct = 45) => {
      if (!hammerActive) return;
      setCrackedWidgets((prev) => ({ ...prev, [widgetKey]: true }));
      setScore((s) => s + 15);
      triggerExplosion(12, xPct, yPct, 'light', 'shatter');
    },
    [hammerActive, triggerExplosion]
  );

  useEffect(() => {
    document.body.dataset.state = screenState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [screenState]);

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
    setCrackedWidgets({});

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
      setS4Combo(0);
      setS4RamPercent(30);
      setS4RamCrashed(false);
    } else if (targetStageNum === 5) {
      setS5DodgeEnabled(true);
      setS5ButtonPos({ x: 35, y: 38 });
      setS5DodgeCount(0);
      setS5Taunt('Bắt được tôi đi rồi tính!');
    } else if (targetStageNum === 6) {
      setS6GlassOpacity(92);
      setS6InputReadOnly(true);
      setS6Input('');
      setS6Error('');
      setS6TrollNote('');
    } else if (targetStageNum === 7) {
      setS7ScrollPos({ x: 0, y: 0 });
    } else if (targetStageNum === 8) {
      s4SeedRef.current = 12;
      setS8SelectionDetected(false);
      setS8Popups([createVirusPopup(5), createVirusPopup(6)]);
      setS8RamPercent(45);
      setS8PinInput('');
      setS8Error('');
      setS8ApocalypseActive(false);
    }
  }, []);

  const completeCurrentStage = useCallback(
    (bonusPoints = 0, isFinalBoss = false) => {
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
      setStageClearedBanner(`ĐẬP TAN ${activeStage.code}: +${earned}đ!`);
      triggerExplosion(
        isFinalBoss ? 26 : 18,
        50,
        45,
        'heavy',
        isFinalBoss ? 'boom' : 'shatter'
      );
    },
    [activeStage, stageClearedBanner, triggerExplosion]
  );

  const handleGoToNextStage = useCallback(() => {
    if (stageIndex + 1 >= BROWSER_BREAKER_STAGES.length) {
      setScreenState('gameover');
      playDestructionFx('victory', soundEnabled, audioCtxRef);
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
      setChaosLevel(startIdx * 10);
      setBrokenWidgetsCount(0);
      setHammerActive(false);
      resetStageLocalStates(BROWSER_BREAKER_STAGES[startIdx].id);
      setScreenState('playing');
      triggerExplosion(12, 50, 50, 'light', 'smash');
    },
    [resetStageLocalStates, triggerExplosion]
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
          setShakeMode('heavy');
          setShakeTick((t) => t + 1);
          playDestructionFx('fail', soundEnabled, audioCtxRef);
        }
        return nextRam;
      });
    }, 1000);

    const spawnTimer = window.setInterval(() => {
      setS4Popups((prev) => {
        if (prev.length >= 6) return prev;
        s4SeedRef.current += 1;
        playDestructionFx('click', soundEnabled, audioCtxRef);
        return [...prev, createVirusPopup(s4SeedRef.current)];
      });
    }, 1750);

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
    }, 2400);

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

  const mazeSonarDistance = useMemo(
    () => computeMazeTargetDistance(s7ScrollPos.x, s7ScrollPos.y, 720, 520),
    [s7ScrollPos]
  );

  const containerShakeClass =
    shakeMode === 'heavy'
      ? 'animate-dom-heavy-shake'
      : shakeMode === 'light'
        ? 'animate-dom-shake'
        : '';

  return (
    <section
      key={`shake-${shakeTick}-${screenState}`}
      id="browser-breaker-section"
      aria-label="Phá Vỡ Trình Duyệt — Browser-Breaking Meta-UI Puzzle"
      data-theme={theme}
      className={`relative rounded-2xl border-2 border-[#0F172A] dark:border-rose-500/60 bg-white dark:bg-[#0B1222] text-[#0F172A] dark:text-[#E2E8F0] shadow-[0_18px_48px_-20px_rgba(225,29,72,0.28)] overflow-hidden ${containerShakeClass} ${
        s8ApocalypseActive ? 'ring-4 ring-rose-500/70' : ''
      }`}
    >
      {/* GLOBAL FLYING SHARDS OVERLAY */}
      {shards.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
        >
          {shards.map((shard) => {
            const styleObj = {
              left: `${shard.xPercent}%`,
              top: `${shard.yPercent}%`,
              '--dx': `${shard.dxPx}px`,
              '--dy': `${shard.dyPx}px`,
              '--rot': `${shard.rotDeg}deg`,
            } as CSSProperties;
            const toneClass =
              shard.tone === 'rose'
                ? 'bg-rose-600 text-white border-rose-800'
                : shard.tone === 'amber'
                  ? 'bg-amber-400 text-[#0A192F] border-amber-600'
                  : shard.tone === 'emerald'
                    ? 'bg-emerald-500 text-white border-emerald-700'
                    : 'bg-[#0284C7] text-white border-sky-800';
            return (
              <span
                key={shard.id}
                style={styleObj}
                className={`animate-dom-shard absolute px-1.5 py-0.5 rounded border font-mono text-[11px] font-black shadow-md ${toneClass}`}
              >
                {shard.label}
              </span>
            );
          })}
        </div>
      )}

      {/* TITLE SCREEN */}
      {screenState === 'title' && (
        <div className="p-4 sm:p-7 lg:p-8 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.12em] text-rose-600 dark:text-rose-400 font-bold">
                <span>BROWSER WRECKAGE · PHÁ HOẠI DOM</span>
                <span>·</span>
                <span>{BROWSER_BREAKER_STAGES.length} MÀN BÙNG NỔ</span>
                {bestScore > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      KỶ LỤC: {bestScore}đ
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.2rem] font-bold tracking-tight text-[#0A192F] dark:text-white leading-tight">
                Phá Vỡ Trình Duyệt
              </h1>

              <p className="text-sm sm:text-[15px] text-[#334155] dark:text-[#CBD5E1] leading-relaxed max-w-2xl">
                Chính giao diện HTML/CSS là mục tiêu đập phá! Hãy{' '}
                <strong className="text-rose-600 dark:text-rose-400">ép nát hai khối thủy lực</strong>{' '}
                bằng khung trình duyệt,{' '}
                <strong>bơm vỡ bể nước thanh cuộn</strong>,{' '}
                <strong>cào lớp chữ tàng hình</strong>,{' '}
                <strong>bắt nút chạy trốn</strong> và{' '}
                <strong>dùng búa tạ / EMP thổi bay bầy pop-up tràn RAM</strong>!
              </p>

              {/* Stage Quick Preview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BROWSER_BREAKER_STAGES.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => startNewGame(idx)}
                    className="px-2.5 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] hover:border-rose-500 hover:-translate-y-0.5 text-left transition-all cursor-pointer"
                  >
                    <div className="text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400">
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
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/25 transition-colors cursor-pointer"
                >
                  <Bomb className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Bắt Đầu Phá Hoại (Màn 1)</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Interactive Wreckage Preview Box */}
            <div className="lg:col-span-5">
              <button
                type="button"
                onClick={() => {
                  setTitleCracked(true);
                  triggerExplosion(14, 72, 48, 'light', 'shatter');
                }}
                className={`w-full text-left rounded-2xl border-2 p-4 sm:p-5 space-y-3 transition-all cursor-pointer ${
                  titleCracked
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/25 rotate-1'
                    : 'border-[#CBD8E6] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#0F172A] hover:border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#DCE6F2] dark:border-[#1E2E4A] pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {titleCracked ? '⚠ DOM CRACKED!' : `chrome://wreck (${viewportInfo.w}×${viewportInfo.h})`}
                  </span>
                </div>

                <div className="relative h-36 flex items-center justify-center">
                  <svg
                    viewBox="0 0 280 145"
                    className="w-full h-36 text-[#0A192F] dark:text-sky-300"
                    role="img"
                    aria-label="Minh họa đập phá DOM Phá Vỡ Trình Duyệt"
                  >
                    <rect
                      x="14"
                      y="12"
                      width="252"
                      height="120"
                      rx="10"
                      fill="none"
                      stroke={titleCracked ? '#E11D48' : 'currentColor'}
                      strokeWidth="2.5"
                      strokeDasharray={titleCracked ? '10 4' : '6 4'}
                    />
                    <rect x="28" y="38" width="66" height="66" rx="8" fill="#0284C7" fillOpacity="0.22" stroke="#0284C7" strokeWidth="2.5" />
                    <rect x="186" y="38" width="66" height="66" rx="8" fill="#E11D48" fillOpacity="0.22" stroke="#E11D48" strokeWidth="2.5" />
                    <polygon points="140,42 154,66 138,66 150,94 126,68 140,68" fill="#F59E0B" />
                    {titleCracked && (
                      <path
                        d="M140 12 L130 48 L158 72 L122 104 L145 132"
                        fill="none"
                        stroke="#E11D48"
                        strokeWidth="3"
                      />
                    )}
                    <text x="140" y="122" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="currentColor">
                      {titleCracked ? '💥 BẤM TIẾP ĐỂ ĐẬP NÁT!' : 'NHẤN VÀO KHUNG NÀY ĐỂ ĐẬP THỬ!'}
                    </text>
                  </svg>
                </div>

                <p className="text-xs text-center text-[#475569] dark:text-[#94A3B8]">
                  Có chế độ <strong>Búa Tạ Đập Vỡ DOM</strong> & hiệu ứng nổ tung từng thẻ HTML!
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAYING / PAUSED */}
      {(screenState === 'playing' || screenState === 'paused') && (
        <div className="relative">
          {/* Hijacked Browser Chrome HUD */}
          <div className="border-b-2 border-[#0F172A] dark:border-rose-500/40 bg-[#0F172A] text-white px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black animate-pulse">
                {activeStage.code}
              </span>
              <strong className="text-sm font-sans text-white">
                {activeStage.title}
              </strong>
              <span className="hidden sm:inline text-rose-300">
                chrome://breach/{activeStage.domEventTag}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-mono tabular-nums">
              <span className="text-slate-300">
                Màn <strong className="text-white">{stageIndex + 1}/{BROWSER_BREAKER_STAGES.length}</strong>
              </span>
              <span className="text-amber-300 font-bold">
                {score}đ
              </span>
              <span className="hidden md:inline text-rose-300">
                Mảnh vỡ: <strong>{brokenWidgetsCount}</strong>
              </span>
              <span className="hidden sm:inline text-sky-300">
                Phá hủy: <strong>{chaosLevel}%</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHammerActive((prev) => !prev)}
                  aria-pressed={hammerActive}
                  title="Bật Búa Tạ: Bấm vào các khung trang trí để đập nát kiếm điểm!"
                  className={`px-2.5 h-9 rounded-lg border text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    hammerActive
                      ? 'bg-amber-400 text-[#0A192F] border-amber-300'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-400'
                  }`}
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Búa Tạ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  className="px-2.5 h-9 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs font-medium hover:border-sky-400 cursor-pointer"
                >
                  {showHint ? 'Ẩn mẹo' : 'Mẹo'}
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 flex items-center justify-center hover:border-sky-400 cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setScreenState((prev) => (prev === 'paused' ? 'playing' : 'paused'))}
                  aria-label={screenState === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                  className="w-9 h-9 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 flex items-center justify-center hover:border-sky-400 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stage Objective Strip (Smashable with Hammer!) */}
          <div className="px-3 sm:px-5 pt-3.5 pb-2 space-y-2">
            <div
              onClick={() => smashWidgetWithHammer(`obj-${activeStage.id}`, 35, 22)}
              className={`rounded-xl border p-3 text-xs sm:text-sm leading-relaxed transition-all ${
                crackedWidgets[`obj-${activeStage.id}`]
                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 -rotate-1'
                  : 'border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33]'
              } ${hammerActive ? 'cursor-crosshair ring-2 ring-amber-400/60' : ''}`}
            >
              <strong className="text-rose-600 dark:text-rose-400 font-mono uppercase">
                [Lệnh Phá Hoại]
              </strong>{' '}
              <span className="text-[#1E293B] dark:text-[#E2E8F0]">{activeStage.objective}</span>
              {hammerActive && (
                <span className="ml-2 text-[11px] font-mono text-amber-600 dark:text-amber-300">
                  (Bấm để đập nứt khung!)
                </span>
              )}
            </div>

            {showHint && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-900 dark:text-amber-200">
                <strong>Mẹo kỹ thuật:</strong> {activeStage.hint}
              </div>
            )}
          </div>

          {/* STAGE SANDBOX ARENA */}
          <div className="px-3 sm:px-5 pb-5 space-y-4">
            {/* STAGE 1: ARMORED VAULT + INVISIBLE INK SELECTIONCHANGE */}
            {activeStage.id === 1 && (
              <div
                className={`rounded-xl border-2 p-4 sm:p-6 space-y-4 transition-all ${
                  stageClearedBanner
                    ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/30 rotate-1'
                    : 'border-[#0F172A] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>KÉT SẮT BẢO MẬT DOM #01</span>
                  </span>
                  <span className={s1SelectionDetected ? 'text-emerald-600 font-bold' : 'text-[#64748B]'}>
                    {s1SelectionDetected ? '✓ ĐÃ LỘ MỰC TÀNG HÌNH!' : 'ĐANG KHÓA NIÊM PHONG'}
                  </span>
                </div>

                {/* White-on-White Hidden Ink Container */}
                <div className="rounded-lg border-2 border-dashed border-rose-400/70 bg-white dark:bg-[#0B1222] p-4">
                  <p className="text-xs text-[#64748B] mb-1">
                    Quét bôi đen vùng trắng bên dưới để cào lớp sơn che mật mã:
                  </p>
                  <p className="select-text text-white dark:text-[#0B1222] selection:bg-rose-600 selection:text-white font-mono text-base sm:text-lg font-black tracking-widest">
                    MÃ PHÁ KHÓA: {STAGE1_SECRET_CODE}
                  </p>
                </div>

                {s1SelectionDetected && (
                  <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                    <Eye className="w-4 h-4" />
                    <span>selectionchange đã bóc trần mật mã! Nhập ngay để kích nổ két sắt!</span>
                  </p>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (normalizePhraseInput(s1Input) === STAGE1_SECRET_CODE) {
                      completeCurrentStage(s1SelectionDetected ? 30 : 0);
                    } else {
                      setS1Error('Sai mã! Hãy bôi đen khung trắng ở trên để lộ mật mã.');
                      setShakeMode('light');
                      setShakeTick((t) => t + 1);
                      playDestructionFx('fail', soundEnabled, audioCtxRef);
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
                    placeholder="Nhập mật mã để thổi bay két sắt..."
                    className="flex-1 min-h-[44px] px-3.5 rounded-xl border-2 border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] font-mono text-sm uppercase"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Bomb className="w-4 h-4" />
                    <span>Mở Khóa Màn 1</span>
                  </button>
                </form>
                {s1Error && <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{s1Error}</p>}
              </div>
            )}

            {/* STAGE 2: HYDRAULIC RESIZE CRUSHER */}
            {activeStage.id === 2 && (
              <div className="rounded-xl border-2 border-[#0F172A] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <Maximize2 className="w-4 h-4" />
                    <span>
                      BÀN ÉP THỦY LỰC · CÒN {s2GapPx}px {s2GapPx < 90 && !stageClearedBanner ? '⚡ SẮP NGHIỀN NÁT!' : ''}
                    </span>
                  </span>
                  {s2CustomFrameWidth !== null && (
                    <button
                      type="button"
                      onClick={() => setS2CustomFrameWidth(null)}
                      className="underline text-[#0284C7] cursor-pointer"
                    >
                      Đặt lại chiều rộng
                    </button>
                  )}
                </div>

                <div className="w-full overflow-hidden">
                  <div
                    ref={s2ArenaRef}
                    style={
                      s2CustomFrameWidth !== null ? { width: `${s2CustomFrameWidth}px` } : undefined
                    }
                    className={`relative h-48 rounded-xl border-2 border-dashed bg-[#0F172A] px-3 flex items-center justify-between transition-colors ${
                      s2GapPx < 90 ? 'border-rose-500' : 'border-amber-400'
                    }`}
                  >
                    {/* Left Spiked Hydraulic Wall */}
                    <div className="w-24 h-28 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 border-2 border-amber-300 text-white flex flex-col items-center justify-center text-center shadow-lg shrink-0 select-none">
                      <span className="text-xs font-mono font-black">ÉP TRÁI ►</span>
                      <span className="text-[10px] opacity-90">Thủy Lực 50T</span>
                    </div>

                    {/* Central Trapped Core Chip */}
                    <div className="flex flex-col items-center justify-center px-1 text-center">
                      <div
                        className={`px-2 py-1 rounded border font-mono text-[10px] font-black ${
                          stageClearedBanner
                            ? 'bg-rose-600 text-white border-rose-300 rotate-12 scale-110'
                            : s2GapPx < 90
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                              : 'bg-sky-500/15 text-sky-300 border-sky-500'
                        }`}
                      >
                        {stageClearedBanner ? '💥 NÁT VỤN!' : 'CHIP LÕI'}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1">
                        {s2GapPx <= 4 ? '0px' : `${s2GapPx}px`}
                      </span>
                    </div>

                    {/* Right Spiked Hydraulic Wall */}
                    <div className="w-24 h-28 rounded-xl bg-gradient-to-l from-amber-500 to-rose-600 border-2 border-amber-300 text-white flex flex-col items-center justify-center text-center shadow-lg shrink-0 select-none">
                      <span className="text-xs font-mono font-black">◄ ÉP PHẢI</span>
                      <span className="text-[10px] opacity-90">Thủy Lực 50T</span>
                    </div>

                    {/* Interactive Draggable Right Edge */}
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      aria-label="Kéo viền phải để thu hẹp cửa sổ mô phỏng"
                      onPointerDown={handleStage2PointerDown}
                      onPointerMove={handleStage2PointerMove}
                      onPointerUp={handleStage2PointerUp}
                      className="absolute top-0 right-0 bottom-0 w-5 bg-amber-400/25 hover:bg-amber-400/45 border-l-2 border-amber-400 cursor-ew-resize flex items-center justify-center touch-none"
                      title="Nắm kéo mạnh sang trái để ép nát Chip Lõi!"
                    >
                      <div className="w-1 h-10 rounded-full bg-amber-300" />
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  <strong>Kéo nhỏ cửa sổ trình duyệt</strong> hoặc <strong>nắm thanh màu vàng ở mép phải kéo mạnh sang trái</strong> để nghiền nát Chip Lõi ở giữa!
                </p>
              </div>
            )}

            {/* STAGE 3: PRESSURIZED FLOOD TANK SCROLL */}
            {activeStage.id === 3 && (
              <div className="rounded-xl border-2 border-[#0F172A] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span
                    className={`flex items-center gap-1.5 font-bold ${
                      s3WaterPercent >= 70 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-[#0284C7] dark:text-sky-400'
                    }`}
                  >
                    <Waves className="w-4 h-4" />
                    <span>
                      ÁP SUẤT BỂ DOM: {s3WaterPercent}% / 92% {s3WaterPercent >= 70 && !stageClearedBanner ? '· SẮP VỠ KÍNH!' : ''}
                    </span>
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
                      completeCurrentStage(25);
                    }
                  }}
                  className={`relative h-64 overflow-y-auto rounded-xl border-2 border-[#0284C7] bg-[#0B1222] ${
                    s3WaterPercent >= 75 && !stageClearedBanner ? 'ring-4 ring-rose-500/40' : ''
                  }`}
                >
                  <div className="sticky top-0 left-0 right-0 h-64 pointer-events-none overflow-hidden flex flex-col justify-between p-3">
                    <div className="z-10 border-b-2 border-dashed border-rose-400 pb-1 flex items-center justify-between text-[11px] font-mono text-rose-300 font-bold">
                      <span>▲ CỬA KÍNH CHỊU LỰC (VỠ Ở 92%)</span>
                      <span>{s3WaterPercent}%</span>
                    </div>

                    <div
                      style={{ height: `${s3WaterPercent}%` }}
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600/90 via-sky-500/75 to-emerald-300/65 border-t-4 border-white/80 transition-[height] duration-75 flex justify-center"
                    >
                      <div className="-mt-5 px-3 py-1 rounded-full bg-amber-400 text-[#0A192F] font-mono text-xs font-black shadow-lg flex items-center gap-1 h-8">
                        <Bomb className="w-3.5 h-3.5" />
                        <span>PHAO KÍCH NỔ</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[980px] flex flex-col justify-between items-center py-6 text-xs font-mono text-slate-400 pointer-events-none select-none">
                    <span>↓ Cuộn thật nhanh xuống đáy để bơm ngập trình duyệt ↓</span>
                    <span>Áp suất đang tăng vọt...</span>
                    <span>Kính bắt đầu nứt rồi...</span>
                    <span>PHÁ VỠ ĐẬP!</span>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: VIRUS SWARM + EXPLODING POPUPS + EMP NUKE */}
            {activeStage.id === 4 && (
              <div className="rounded-xl border-2 border-rose-600 bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 font-black text-rose-600 dark:text-rose-400">
                      <Bug className="w-4 h-4" />
                      <span>ĐÃ PHÁ: {s4ClosedCount}/10</span>
                    </span>
                    {s4Combo >= 2 && (
                      <span className="px-2 py-0.5 rounded bg-amber-400 text-[#0A192F] font-black">
                        COMBO ×{s4Combo}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {s4Combo >= 4 && !stageClearedBanner && !s4RamCrashed && (
                      <button
                        type="button"
                        onClick={() => {
                          const wiped = Math.max(1, s4Popups.length);
                          setS4Popups([]);
                          setS4RamPercent(20);
                          setS4Combo(0);
                          triggerExplosion(22, 50, 50, 'heavy', 'emp');
                          setS4ClosedCount((prev) => {
                            const next = prev + wiped;
                            if (next >= 10) completeCurrentStage(70);
                            return next;
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0A192F] font-black text-[11px] flex items-center gap-1 animate-bounce cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>KÍCH NỔ EMP!</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2 min-w-[160px]">
                      <Cpu className="w-4 h-4 text-rose-500" />
                      <span>RAM:</span>
                      <div className="w-20 h-2.5 rounded-full bg-[#CBD5E1] dark:bg-[#1E293B] overflow-hidden">
                        <div
                          style={{ width: `${s4RamPercent}%` }}
                          className={`h-full transition-all ${
                            s4RamPercent >= 80
                              ? 'bg-rose-600 animate-pulse'
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
                </div>

                {/* Desktop Pop-up Chaos Arena */}
                <div className="relative h-72 rounded-xl border-2 border-rose-500/40 bg-[#0B1222] overflow-hidden">
                  {s4Popups.map((popup, idx) => (
                    <div
                      key={popup.id}
                      style={{ left: `${popup.xPercent}%`, top: `${popup.yPercent}%` }}
                      className={`absolute w-52 sm:w-60 rounded-lg border-2 border-rose-500 bg-white dark:bg-[#111C33] shadow-2xl overflow-hidden z-10 ${
                        idx % 2 === 0 ? 'rotate-1' : '-rotate-1'
                      }`}
                    >
                      <div className="bg-rose-600 text-white px-2.5 py-1 flex items-center justify-between gap-1 text-[11px] font-mono font-black">
                        <span className="truncate">{popup.title}</span>
                        <button
                          type="button"
                          aria-label={`Đóng pop-up ${popup.title}`}
                          onClick={() => {
                            if (s4RamCrashed || stageClearedBanner) return;
                            setS4Popups((prev) => prev.filter((p) => p.id !== popup.id));
                            setS4RamPercent((prev) => Math.max(15, prev - 7));
                            setS4Combo((c) => c + 1);
                            triggerExplosion(10, popup.xPercent + 15, popup.yPercent + 15, 'light', 'smash');
                            setS4ClosedCount((prev) => {
                              const next = prev + 1;
                              if (next >= 10) {
                                completeCurrentStage(50);
                              }
                              return next;
                            });
                          }}
                          className="w-6 h-6 rounded bg-black/30 hover:bg-amber-400 hover:text-black flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="p-2.5 text-xs text-[#334155] dark:text-[#CBD5E1] leading-snug">
                        {popup.body}
                      </p>
                    </div>
                  ))}

                  {s4RamCrashed && (
                    <div className="absolute inset-0 z-20 bg-rose-950/95 text-white flex flex-col items-center justify-center p-4 text-center space-y-3">
                      <AlertOctagon className="w-10 h-10 text-rose-400 animate-bounce" />
                      <h3 className="font-mono font-black text-base">
                        BÙM!! TRÀN BỘ NHỚ RAM (100%)!
                      </h3>
                      <p className="text-xs text-rose-100 max-w-xs">
                        Đạt Combo ×4 để kích hoạt nút KÍCH NỔ EMP quét sạch cả ổ virus!
                      </p>
                      <button
                        type="button"
                        onClick={() => resetStageLocalStates(4)}
                        className="px-4 py-2 rounded-xl bg-amber-400 text-[#0A192F] font-black text-xs cursor-pointer"
                      >
                        Khởi Động Lại Màn 4
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 5: SHY TAUNTING BUTTON + TAB SNIPER */}
            {activeStage.id === 5 && (
              <div className="rounded-xl border-2 border-[#0F172A] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="relative h-56 rounded-xl border-2 border-dashed border-amber-500 bg-[#0B1222] overflow-hidden">
                  <div className="p-3 text-xs font-mono text-amber-300">
                    &gt; Nút mục tiêu đang gáy: &ldquo;{s5Taunt}&rdquo;
                  </div>
                  <button
                    type="button"
                    style={{ left: `${s5ButtonPos.x}%`, top: `${s5ButtonPos.y}%` }}
                    onMouseEnter={() => {
                      if (!s5DodgeEnabled || stageClearedBanner) return;
                      const nx = 8 + Math.floor(Math.random() * 58);
                      const ny = 18 + Math.floor(Math.random() * 56);
                      setS5ButtonPos({ x: nx, y: ny });
                      setS5DodgeCount((c) => {
                        const next = c + 1;
                        setS5Taunt(DODGE_TAUNTS[next % DODGE_TAUNTS.length]);
                        return next;
                      });
                      playDestructionFx('click', soundEnabled, audioCtxRef);
                    }}
                    onClick={() => completeCurrentStage(s5DodgeEnabled ? 60 : 0)}
                    className="absolute px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 focus:ring-4 focus:ring-amber-400 text-white font-black text-xs sm:text-sm shadow-lg transition-all duration-100 cursor-pointer flex items-center gap-1.5"
                  >
                    <MousePointerClick className="w-4 h-4" />
                    <span>ĐẬP VỠ NÚT NÀY</span>
                  </button>
                </div>

                <div className="rounded-lg border border-[#243454] bg-[#0F172A] text-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Code2 className="w-4 h-4" />
                    <span>Số cú hụt: {s5DodgeCount}</span>
                  </span>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={s5DodgeEnabled}
                      onChange={(e) => setS5DodgeEnabled(e.target.checked)}
                      className="w-4 h-4 accent-rose-600"
                    />
                    <span>CSS Dodge (Chạy trốn con trỏ)</span>
                  </label>
                </div>
              </div>
            )}

            {/* STAGE 6: SCAM CURTAIN TROLL + OPACITY / READONLY HACK */}
            {activeStage.id === 6 && (
              <div className="rounded-xl border-2 border-[#0F172A] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-3">
                <div className="relative rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#0B1222] p-5 space-y-3 overflow-hidden">
                  <p className="text-xs font-mono text-[#64748B]">
                    Nhập <strong className="text-rose-600">PHA VO</strong> để đánh sập cửa sổ:
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
                        s6InputReadOnly ? '[Bị khóa readOnly!]' : 'Gõ PHA VO...'
                      }
                      className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#111C33] font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (normalizePhraseInput(s6Input) === STAGE6_UNLOCK_PHRASE) {
                          completeCurrentStage(20);
                        } else {
                          setS6Error('Gỡ readOnly và nhập chính xác PHA VO!');
                          playDestructionFx('fail', soundEnabled, audioCtxRef);
                        }
                      }}
                      className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer"
                    >
                      Kích Nổ
                    </button>
                  </div>
                  {s6Error && <p className="text-xs text-rose-600 font-semibold">{s6Error}</p>}

                  {/* Obnoxious Scam Curtain */}
                  {s6GlassOpacity > 0 && (
                    <div
                      style={{
                        opacity: s6GlassOpacity / 100,
                        pointerEvents: s6GlassOpacity > 20 ? 'auto' : 'none',
                      }}
                      className="absolute inset-0 z-10 bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center space-y-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setS6TrollNote('HA HA! NÚT X GIẢ ĐẤY! KÉO CSS OPACITY XUỐNG!');
                          triggerExplosion(8, 82, 20, 'light', 'fail');
                        }}
                        className="absolute top-2 right-2 px-2 py-1 rounded bg-rose-600 text-white font-mono text-[10px] font-bold cursor-pointer"
                      >
                        × TẮT QUẢNG CÁO
                      </button>
                      <ShieldAlert className="w-8 h-8 text-amber-400" />
                      <p className="font-black text-sm text-amber-300">
                        QUẢNG CÁO CHẮN DOM (Opacity: {s6GlassOpacity}%)
                      </p>
                      <p className="text-xs text-rose-300 font-mono">
                        {s6TrollNote || 'Hạ CSS Opacity <= 20% để thiêu rụi tấm kính chắn!'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-[#243454] bg-[#0F172A] text-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <label className="flex items-center gap-2">
                    <span>CSS Opacity: {s6GlassOpacity}%</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={s6GlassOpacity}
                      onChange={(e) => setS6GlassOpacity(Number(e.target.value))}
                      className="accent-rose-500 cursor-pointer"
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

            {/* STAGE 7: 2D SCROLL MAZE + LIVE SONAR */}
            {activeStage.id === 7 && (
              <div className="rounded-xl border-2 border-[#0F172A] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0F172A] p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="flex items-center gap-1.5 font-bold text-[#0284C7] dark:text-sky-400">
                    <Compass className="w-4 h-4" />
                    <span>X={s7ScrollPos.x}px · Y={s7ScrollPos.y}px</span>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      mazeSonarDistance < 220
                        ? 'bg-rose-600 text-white animate-pulse'
                        : mazeSonarDistance < 450
                          ? 'bg-amber-400 text-[#0A192F]'
                          : 'bg-slate-200 dark:bg-slate-800 text-[#334155] dark:text-slate-300'
                    }`}
                  >
                    SONAR CÁCH MỤC TIÊU: {mazeSonarDistance}px
                  </span>
                </div>

                <div
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    setS7ScrollPos({ x: Math.round(el.scrollLeft), y: Math.round(el.scrollTop) });
                  }}
                  className="h-64 overflow-auto rounded-xl border-2 border-rose-500 bg-[#0B1222]"
                >
                  <div className="relative w-[1080px] h-[780px] bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px]">
                    <div className="p-4 text-xs font-mono text-sky-300">
                      (0, 0) · Lần theo tiếng Sonar để tìm Công Tắc Hủy Diệt...
                    </div>
                    <div className="absolute left-[420px] top-[280px] text-xs font-mono text-amber-300">
                      ⚡ Tín hiệu mạnh ở hướng Đông Nam ↘
                    </div>
                    <button
                      type="button"
                      onClick={() => completeCurrentStage(30)}
                      className="absolute left-[780px] top-[580px] px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-xs shadow-lg cursor-pointer flex items-center gap-1.5 animate-pulse"
                    >
                      <ScrollText className="w-4 h-4" />
                      <span>[ĐIỂM MÙ DOM · KÍCH NỔ NGAY!]</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 8: DOM APOCALYPSE BOSS */}
            {activeStage.id === 8 && (
              <div className="rounded-xl border-2 border-rose-600 bg-[#0F172A] text-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-black text-rose-400">
                    RAM HỆ THỐNG: {s8RamPercent}% (GIỮ &lt; 85%)
                  </span>
                  <span className={s8SelectionDetected ? 'text-emerald-400 font-bold' : 'text-amber-300'}>
                    {s8SelectionDetected ? '✓ ĐÃ BÓC MÃ PIN 9999' : '⚠ BÔI ĐEN TÌM PIN ẨN'}
                  </span>
                </div>

                {/* Invisible PIN Hint Zone */}
                <div className="rounded-lg border border-dashed border-rose-500/60 bg-[#070B14] p-3">
                  <p className="text-xs text-slate-400 mb-1">
                    Bôi đen vùng tối bên dưới để làm hiện PIN phá hủy Boss:
                  </p>
                  <p className="select-text text-[#070B14] selection:bg-rose-600 selection:text-white font-mono font-black text-sm">
                    PIN KÍCH NỔ TRÌNH DUYỆT: {STAGE8_PIN_CODE}
                  </p>
                </div>

                {/* Active Boss Virus Pop-ups */}
                <div className="relative h-44 rounded-xl border border-rose-500/40 bg-[#05080F] overflow-hidden">
                  {s8Popups.map((popup) => (
                    <div
                      key={popup.id}
                      style={{ left: `${popup.xPercent}%`, top: `${Math.min(48, popup.yPercent)}%` }}
                      className="absolute w-48 rounded-lg border-2 border-rose-500 bg-[#111C33] shadow-xl overflow-hidden z-10"
                    >
                      <div className="bg-rose-600 text-white px-2 py-1 flex items-center justify-between text-[10px] font-mono font-black">
                        <span className="truncate">{popup.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setS8Popups((prev) => prev.filter((p) => p.id !== popup.id));
                            setS8RamPercent((prev) => Math.max(20, prev - 10));
                            triggerExplosion(8, popup.xPercent + 15, popup.yPercent + 15, 'light', 'smash');
                          }}
                          className="w-5 h-5 rounded bg-black/30 flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="p-2 text-[11px] text-slate-300">
                        {popup.body}
                      </p>
                    </div>
                  ))}
                  {s8Popups.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-emerald-400">
                      TƯỜNG LỬA ĐÃ MỞ! NHẬP PIN & KÍCH NỔ TRÌNH DUYỆT!
                    </div>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (s8RamPercent >= 85) {
                      setS8Error('RAM quá tải >= 85%, đập bớt pop-up trước!');
                      setShakeMode('light');
                      setShakeTick((t) => t + 1);
                      playDestructionFx('fail', soundEnabled, audioCtxRef);
                      return;
                    }
                    if (normalizePhraseInput(s8PinInput) !== STAGE8_PIN_CODE) {
                      setS8Error('Sai PIN! Bôi đen khung tối phía trên để đọc PIN.');
                      setShakeMode('light');
                      setShakeTick((t) => t + 1);
                      playDestructionFx('fail', soundEnabled, audioCtxRef);
                      return;
                    }
                    setS8ApocalypseActive(true);
                    completeCurrentStage(100, true);
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
                    className="flex-1 min-h-[44px] px-3 rounded-xl border-2 border-rose-500/60 bg-[#111C33] text-white font-mono text-sm"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Bomb className="w-4 h-4" />
                    <span>KÍCH NỔ TOÀN BỘ DOM</span>
                  </button>
                </form>
                {s8Error && <p className="text-xs text-rose-400 font-semibold">{s8Error}</p>}
              </div>
            )}

            {/* STAGE CLEARED BANNER */}
            {stageClearedBanner && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-[#0F172A] dark:text-white">
                      {stageClearedBanner}
                    </h3>
                    <p className="text-xs text-[#334155] dark:text-[#CBD5E1]">
                      Bấm nút bên cạnh (hoặc Enter) để tiếp tục tàn phá màn kế tiếp!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoToNextStage}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>
                    {stageIndex + 1 >= BROWSER_BREAKER_STAGES.length
                      ? 'Xem Chiến Tích Hủy Diệt'
                      : `Sang Màn ${stageIndex + 2}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* PAUSED OVERLAY */}
          {screenState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#0A192F]/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border-2 border-rose-500 bg-white dark:bg-[#0F172A] p-6 text-center space-y-4 shadow-2xl">
                <h2 className="font-serif text-xl font-bold text-[#0A192F] dark:text-white">
                  Tạm Dừng Phá Hoại DOM
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Màn {stageIndex + 1}/{BROWSER_BREAKER_STAGES.length} · Điểm: {score}đ · Phá hủy: {chaosLevel}%
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setScreenState('playing')}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Tiếp Tục Phá Hoại</span>
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
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>KẺ HỦY DIỆT TRÌNH DUYỆT</span>
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A192F] dark:text-white">
              Đập Tan Hoàn Toàn {BROWSER_BREAKER_STAGES.length} Màn Bảo Mật DOM!
            </h2>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
              Không một bức tường thủy lực, pop-up virus hay rèm scam nào chịu nổi sức tàn phá của bạn.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] p-4 font-mono tabular-nums">
            <div>
              <p className="text-[11px] text-[#64748B]">Tổng Điểm</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{score}đ</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B]">Mảnh Vỡ DOM</p>
              <p className="text-lg font-bold text-[#0284C7] dark:text-sky-400">{brokenWidgetsCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B]">Kỷ Lục</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{bestScore}đ</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={() => startNewGame(0)}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Phá Lại Từ Đầu</span>
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
