import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Box,
  CheckCircle2,
  Cloud,
  Cpu,
  EyeOff,
  HardDrive,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Snowflake,
  Terminal,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  computeMissionRank,
  computeTraceRatePerSec,
  createInitialMissionState,
  executeHackerCommand,
  getAutocompleteSuggestion,
  getMissionObjectives,
  getSmartNextHint,
  HackerMode,
  KNOWLEDGE_DOMAINS,
  KnowledgeDomainId,
  LINUX_MISSIONS,
  MissionRuntimeState,
  renderAsciiPatchDiagram,
  tickMissionTrace,
  toggleAsciiBridgeNode,
  UBUNTU_CODEX,
  useHackerPowerup,
} from '../utils/linuxHackerEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type ScreenState = 'title' | 'playing' | 'paused' | 'mission_clear' | 'gameover';
type SideTab = 'mission' | 'codex';

interface LinuxHackerGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const SAVE_BEST_KEY = 'thuanle-linux-hacker-best-v1';
const SAVE_STAGE_KEY = 'thuanle-linux-hacker-stage-v2';
const SAVE_CODEX_KEY = 'thuanle-linux-codex-v1';

function loadNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const val = raw ? Number(raw) : fallback;
    return Number.isFinite(val) ? val : fallback;
  } catch {
    return fallback;
  }
}

function saveNumber(key: string, val: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, String(val));
  } catch {
    // Ignore storage errors
  }
}

function loadCodex(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVE_CODEX_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveCodex(items: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_CODEX_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

function playTerminalFx(
  kind: 'key' | 'tick' | 'hit' | 'kill' | 'link' | 'error' | 'clear_mission' | 'gameover' | 'alarm',
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

    const tone = (
      startFreq: number,
      endFreq: number,
      duration: number,
      gainVal: number,
      wave: OscillatorType = 'square',
      delay = 0
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      const jitter = 0.96 + Math.random() * 0.08;
      osc.frequency.setValueAtTime(startFreq * jitter, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq * jitter), now + delay + duration);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(gainVal, now + delay + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    };

    if (kind === 'key') {
      tone(920, 480, 0.02, 0.032, 'triangle');
    } else if (kind === 'tick') {
      tone(640, 420, 0.04, 0.065, 'triangle');
    } else if (kind === 'hit') {
      tone(540, 880, 0.07, 0.085, 'square');
    } else if (kind === 'kill') {
      tone(420, 95, 0.16, 0.15, 'sawtooth');
      tone(880, 1200, 0.08, 0.1, 'square', 0.07);
    } else if (kind === 'link') {
      tone(587.33, 880, 0.1, 0.12, 'triangle', 0);
      tone(880, 1174.66, 0.12, 0.11, 'triangle', 0.08);
    } else if (kind === 'error') {
      tone(190, 125, 0.14, 0.12, 'sawtooth');
    } else if (kind === 'alarm') {
      tone(760, 760, 0.06, 0.055, 'square');
    } else if (kind === 'clear_mission') {
      tone(523.25, 523.25, 0.09, 0.12, 'triangle', 0);
      tone(659.25, 659.25, 0.09, 0.12, 'triangle', 0.09);
      tone(783.99, 783.99, 0.1, 0.13, 'triangle', 0.18);
      tone(1046.5, 1046.5, 0.24, 0.16, 'triangle', 0.28);
    } else if (kind === 'gameover') {
      tone(320, 72, 0.42, 0.18, 'sawtooth');
    }
  } catch {
    // Ignore blocked audio context
  }
}

export function LinuxHackerGameSection({ theme: _theme }: LinuxHackerGameSectionProps) {
  const [screenState, setScreenState] = useState<ScreenState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [hackerMode, setHackerMode] = useState<HackerMode>('speed');
  const [selectedStartMission, setSelectedStartMission] = useState<number>(0);
  const [activeDomainFilter, setActiveDomainFilter] = useState<KnowledgeDomainId | 0>(0);
  const [highestReachedMission, setHighestReachedMission] = useState<number>(() =>
    Math.min(LINUX_MISSIONS.length - 1, Math.max(0, loadNumber(SAVE_STAGE_KEY, 0)))
  );
  const [bestScore, setBestScore] = useState<number>(() => loadNumber(SAVE_BEST_KEY, 0));
  const [codexUnlocked, setCodexUnlocked] = useState<string[]>(() => loadCodex());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [sideTab, setSideTab] = useState<SideTab>('mission');
  const [revealedHintOnMission, setRevealedHintOnMission] = useState<boolean>(false);

  const [runtime, setRuntime] = useState<MissionRuntimeState>(() => createInitialMissionState(0));
  const [commandInput, setCommandInput] = useState<string>('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyCursor, setHistoryCursor] = useState<number>(-1);
  const [endResultKind, setEndResultKind] = useState<'victory' | 'traced'>('traced');
  const [runSnapshot, setRunSnapshot] = useState<{
    score: number;
    best: number;
    missionNum: number;
    learnedCount: number;
    traceAtEnd: number;
  }>({ score: 0, best: 0, missionNum: 1, learnedCount: 0, traceAtEnd: 0 });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const logViewportRef = useRef<HTMLDivElement | null>(null);
  const lastAlarmBucketRef = useRef<number>(0);

  const currentMission = LINUX_MISSIONS[runtime.missionIndex];
  const currentDomain = useMemo(
    () => KNOWLEDGE_DOMAINS.find((d) => d.id === currentMission.domainId) ?? KNOWLEDGE_DOMAINS[0],
    [currentMission.domainId]
  );
  const objectives = useMemo(() => getMissionObjectives(runtime), [runtime]);
  const traceRate = useMemo(() => computeTraceRatePerSec(runtime, hackerMode), [runtime, hackerMode]);
  const smartNextHint = useMemo(() => getSmartNextHint(runtime), [runtime]);
  const autocompleteHint = useMemo(
    () => getAutocompleteSuggestion(commandInput, runtime),
    [commandInput, runtime]
  );

  // Merge codex permanently
  useEffect(() => {
    if (runtime.learnedCommands.length === 0) return;
    setCodexUnlocked((prev) => {
      const merged = Array.from(new Set([...prev, ...runtime.learnedCommands]));
      if (merged.length !== prev.length) {
        saveCodex(merged);
        return merged;
      }
      return prev;
    });
  }, [runtime.learnedCommands]);

  // Sync game state machine to body dataset
  useEffect(() => {
    const mapped = screenState === 'mission_clear' ? 'playing' : screenState;
    document.body.dataset.state = mapped;
    return () => {
      if (document.body.dataset.state) {
        delete document.body.dataset.state;
      }
    };
  }, [screenState]);

  // Auto-scroll terminal log
  useEffect(() => {
    const el = logViewportRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [runtime.logs]);

  // Focus terminal input when entering playing
  useEffect(() => {
    if (screenState === 'playing') {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [screenState, runtime.missionIndex]);

  const triggerGameOver = useCallback(
    (kind: 'victory' | 'traced', finalState: MissionRuntimeState) => {
      const nextBest = Math.max(bestScore, finalState.score);
      if (nextBest > bestScore) {
        setBestScore(nextBest);
        saveNumber(SAVE_BEST_KEY, nextBest);
      }
      setRunSnapshot({
        score: finalState.score,
        best: nextBest,
        missionNum: finalState.missionIndex + 1,
        learnedCount: finalState.learnedCommands.length,
        traceAtEnd: Math.round(finalState.tracePercent),
      });
      setEndResultKind(kind);
      setScreenState('gameover');
      playTerminalFx(kind === 'victory' ? 'clear_mission' : 'gameover', soundEnabled, audioCtxRef);
    },
    [bestScore, soundEnabled]
  );

  // Real-time Trace ticking loop (10Hz)
  useEffect(() => {
    if (screenState !== 'playing') return;
    let lastTime = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, Math.max(0.01, (now - lastTime) / 1000));
      lastTime = now;

      setRuntime((prev) => {
        const next = tickMissionTrace(prev, dt, hackerMode);
        if (next.tracePercent >= 80) {
          const bucket = Math.floor(now / 1200);
          if (bucket !== lastAlarmBucketRef.current) {
            lastAlarmBucketRef.current = bucket;
            playTerminalFx('alarm', soundEnabled, audioCtxRef);
          }
        }
        if (next.tracePercent >= 100) {
          window.setTimeout(() => triggerGameOver('traced', next), 0);
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [hackerMode, screenState, soundEnabled, triggerGameOver]);

  const startMission = useCallback(
    (missionIdx: number, carryScore = 0, carryLearned: string[] = [], carryEp = 35) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const nextRuntime = createInitialMissionState(missionIdx, carryScore, carryLearned, carryEp);
      setRuntime(nextRuntime);
      setCommandInput('');
      setHistoryCursor(-1);
      setRevealedHintOnMission(false);
      setSideTab('mission');
      lastAlarmBucketRef.current = 0;
      setScreenState('playing');
      playTerminalFx('link', soundEnabled, audioCtxRef);
    },
    [soundEnabled]
  );

  const handleStartFromTitle = useCallback(() => {
    startMission(selectedStartMission, 0, codexUnlocked, 35);
  }, [codexUnlocked, selectedStartMission, startMission]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (screenState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartFromTitle();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setScreenState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        return;
      }

      const isTyping =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      if (isTyping) return;

      const lower = e.key.toLowerCase();
      if (lower === 'p' && (screenState === 'playing' || screenState === 'paused')) {
        e.preventDefault();
        setScreenState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
      } else if (lower === 'm') {
        e.preventDefault();
        setSoundEnabled((s) => !s);
      } else if (lower === 'r' && screenState !== 'gameover') {
        e.preventDefault();
        startMission(runtime.missionIndex, 0, codexUnlocked, 35);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [codexUnlocked, handleStartFromTitle, runtime.missionIndex, screenState, startMission]);

  const handleOutcome = useCallback(
    (outcome: ReturnType<typeof executeHackerCommand>) => {
      setRuntime(outcome.nextState);
      playTerminalFx(outcome.fx, soundEnabled, audioCtxRef);

      if (outcome.nextState.score > bestScore) {
        setBestScore(outcome.nextState.score);
        saveNumber(SAVE_BEST_KEY, outcome.nextState.score);
      }

      if (outcome.nextState.tracePercent >= 100) {
        triggerGameOver('traced', outcome.nextState);
        return;
      }

      if (outcome.missionCleared) {
        const nextStage = Math.min(LINUX_MISSIONS.length - 1, outcome.nextState.missionIndex + 1);
        if (nextStage > highestReachedMission) {
          setHighestReachedMission(nextStage);
          saveNumber(SAVE_STAGE_KEY, nextStage);
        }

        if (outcome.nextState.missionIndex >= LINUX_MISSIONS.length - 1) {
          triggerGameOver('victory', outcome.nextState);
        } else {
          setScreenState('mission_clear');
        }
      }
    },
    [bestScore, highestReachedMission, soundEnabled, triggerGameOver]
  );

  const runCommandString = useCallback(
    (rawCmd: string) => {
      if (screenState !== 'playing') return;
      const trimmed = rawCmd.trim();
      if (!trimmed) return;
      setCmdHistory((prev) => (prev[0] === trimmed ? prev : [trimmed, ...prev].slice(0, 30)));
      setHistoryCursor(-1);
      setCommandInput('');
      if (trimmed.toLowerCase() === 'hint') {
        setRevealedHintOnMission(true);
      }
      const outcome = executeHackerCommand(runtime, trimmed);
      handleOutcome(outcome);
    },
    [handleOutcome, runtime, screenState]
  );

  const triggerPowerup = useCallback(
    (kind: 'freeze' | 'cloak' | 'hint') => {
      if (screenState !== 'playing') return;
      if (kind === 'hint') setRevealedHintOnMission(true);
      const outcome = useHackerPowerup(runtime, kind, hackerMode);
      handleOutcome(outcome);
      inputRef.current?.focus();
    },
    [hackerMode, handleOutcome, runtime, screenState]
  );

  const handleSubmitForm = (e: FormEvent) => {
    e.preventDefault();
    runCommandString(commandInput);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (autocompleteHint) {
        setCommandInput(autocompleteHint);
        playTerminalFx('hit', soundEnabled, audioCtxRef);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = Math.min(cmdHistory.length - 1, historyCursor + 1);
        setHistoryCursor(nextIdx);
        setCommandInput(cmdHistory[nextIdx]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyCursor <= 0) {
        setHistoryCursor(-1);
        setCommandInput('');
      } else {
        const nextIdx = historyCursor - 1;
        setHistoryCursor(nextIdx);
        setCommandInput(cmdHistory[nextIdx]);
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      playTerminalFx('key', soundEnabled, audioCtxRef);
    }
  };

  const handleToggleAsciiBridge = (port: number) => {
    if (screenState !== 'playing') return;
    const outcome = toggleAsciiBridgeNode(runtime, port);
    handleOutcome(outcome);
    inputRef.current?.focus();
  };

  const traceTone =
    runtime.traceFreezeTimer > 0
      ? 'text-cyan-300 border-cyan-500/60'
      : runtime.tracePercent >= 75
        ? 'text-rose-400 border-rose-500/80'
        : runtime.tracePercent >= 45
          ? 'text-amber-300 border-amber-500/60'
          : 'text-emerald-300 border-emerald-500/50';

  const traceBarColor =
    runtime.traceFreezeTimer > 0
      ? 'bg-cyan-400'
      : runtime.tracePercent >= 75
        ? 'bg-rose-500'
        : runtime.tracePercent >= 45
          ? 'bg-amber-400'
          : 'bg-emerald-400';

  const asciiDiagram = useMemo(
    () => renderAsciiPatchDiagram(runtime.bridges, runtime.ports),
    [runtime.bridges, runtime.ports]
  );

  const missionRank = useMemo(
    () => computeMissionRank(runtime.tracePercent, runtime.mistakesCount),
    [runtime.tracePercent, runtime.mistakesCount]
  );

  const filteredMissions = useMemo(
    () =>
      activeDomainFilter === 0
        ? LINUX_MISSIONS
        : LINUX_MISSIONS.filter((m) => m.domainId === activeDomainFilter),
    [activeDomainFilter]
  );

  const selectedMissionDef = LINUX_MISSIONS[selectedStartMission] ?? LINUX_MISSIONS[0];
  const selectedMissionDomain =
    KNOWLEDGE_DOMAINS.find((d) => d.id === selectedMissionDef.domainId) ?? KNOWLEDGE_DOMAINS[0];
  const shouldHighlightHint = hackerMode === 'practice' || revealedHintOnMission;

  // ==================== TITLE SCREEN ====================
  if (screenState === 'title') {
    return (
      <section
        aria-label="Màn hình khởi đầu Hacker Dòng Lệnh Linux Ubuntu"
        className="relative rounded-2xl border border-emerald-500/40 bg-[#050A08] text-emerald-300 overflow-hidden shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]"
      >
        {/* Subtle CRT scanline overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(16,185,129,0.14) 0px, rgba(16,185,129,0.14) 1px, transparent 1px, transparent 3px)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 sm:p-7 lg:p-8 items-start">
          {/* Left Setup & 8-Domain Mission Selector */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-emerald-400/90">
              <span>UBUNTU 24.04 LTS</span>
              <span aria-hidden="true">·</span>
              <span>16 MÀN · 8 LĨNH VỰC</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-300">ĐÃ MỞ {codexUnlocked.length}/{UBUNTU_CODEX.length} LỆNH THỰC CHIẾN</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-100 leading-tight max-w-xl">
              Hacker Dòng Lệnh Thời Gian Thực
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/85 max-w-2xl leading-relaxed">
              Học như chơi, chơi mà như học trọn bộ <strong className="text-cyan-300">8 kỹ năng Linux → DevOps Cloud</strong>:{' '}
              <span className="text-amber-300">
                Linux Cơ Bản · Bash Scripting · SysAdmin · Networking · Docker · Web Nginx · Security UFW · Kubernetes &amp; Terraform
              </span>.
            </p>

            {/* Mode Selector */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHackerMode('speed')}
                className={`px-3.5 py-2 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                  hackerMode === 'speed'
                    ? 'bg-emerald-500 text-[#03120B] border-emerald-300 font-bold'
                    : 'bg-[#091510] text-emerald-200 border-emerald-800 hover:border-emerald-500'
                }`}
              >
                Tốc Độ Hacker (Trace thực · Săn Rank S)
              </button>
              <button
                type="button"
                onClick={() => setHackerMode('practice')}
                className={`px-3.5 py-2 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                  hackerMode === 'practice'
                    ? 'bg-cyan-400 text-[#03120B] border-cyan-200 font-bold'
                    : 'bg-[#091510] text-emerald-200 border-emerald-800 hover:border-cyan-500'
                }`}
              >
                Học Như Chơi (Trace chậm 4x · Gợi ý từng bước · Mở 16/16)
              </button>
            </div>

            {/* 8 Knowledge Domain Filter Tabs + Mission Picker */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/85">
                  Lộ trình 8 Lĩnh Vực ({hackerMode === 'practice' ? 'Mở toàn bộ 16 màn' : `Tiến độ: ${highestReachedMission + 1}/16`})
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveDomainFilter(0)}
                  className={`px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                    activeDomainFilter === 0
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 font-bold'
                      : 'bg-[#07110C] border-emerald-900/70 text-emerald-400/80 hover:border-emerald-500'
                  }`}
                >
                  Tất cả (16)
                </button>
                {KNOWLEDGE_DOMAINS.map((dom) => (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => {
                      setActiveDomainFilter(dom.id);
                      const firstInDom = LINUX_MISSIONS.find((m) => m.domainId === dom.id);
                      if (firstInDom) {
                        const idx = firstInDom.id - 1;
                        if (hackerMode === 'practice' || idx <= highestReachedMission) {
                          setSelectedStartMission(idx);
                        }
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
                      activeDomainFilter === dom.id
                        ? 'bg-emerald-500/20 border-emerald-300 text-white font-bold'
                        : 'bg-[#07110C] border-emerald-900/70 text-emerald-300/80 hover:border-emerald-500'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dom.color }}
                    />
                    <span>{dom.shortName}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {filteredMissions.map((m) => {
                  const idx = m.id - 1;
                  const locked = hackerMode === 'speed' && idx > highestReachedMission;
                  const active = selectedStartMission === idx;
                  const dom = KNOWLEDGE_DOMAINS.find((d) => d.id === m.domainId);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={locked}
                      onClick={() => setSelectedStartMission(idx)}
                      className={`px-2.5 py-2 rounded-lg border font-mono text-xs text-left transition-colors ${
                        locked
                          ? 'opacity-40 cursor-not-allowed bg-[#060D0A] border-emerald-950 text-emerald-700'
                          : active
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100 cursor-pointer'
                            : 'bg-[#08120E] border-emerald-900/70 text-emerald-300/85 hover:border-emerald-500 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 font-bold text-[11px]">
                        <span>Màn {m.id}</span>
                        <span
                          className="text-[9px] truncate"
                          style={{ color: dom?.color ?? '#38BDF8' }}
                        >
                          {dom?.shortName.replace(/^\d+\.\s*/, '')}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-90 truncate mt-0.5">
                        {m.title.replace(/^Màn \d+ · /, '')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="button"
                data-start="true"
                onClick={handleStartFromTitle}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#03120B] font-mono font-bold text-sm sm:text-base transition-colors cursor-pointer shadow-[0_0_24px_rgba(52,211,153,0.35)]"
              >
                <Terminal className="w-4 h-4" aria-hidden="true" />
                <span>Vào Màn {selectedMissionDef.id} &amp; Mở Terminal</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              {bestScore > 0 && (
                <div className="text-xs font-mono text-amber-300 tabular-nums">
                  Kỷ lục: {bestScore} điểm
                </div>
              )}
            </div>

            <p className="text-xs font-mono text-emerald-500/90">
              Enter Bắt đầu · Tab Tự điền lệnh · ↑/↓ Lịch sử · Gõ 3 lệnh đúng = Đóng băng Trace + EP Kỹ năng
            </p>
          </div>

          {/* Right Live Mission Preview & Terminal Emblem */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="rounded-xl border border-emerald-500/35 bg-[#030705] p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/70 pb-2 text-emerald-400/80">
                <span>tty1 :: ubuntu-kernel-shell</span>
                <span className="text-cyan-300">{selectedMissionDef.codeName}</span>
              </div>
              <svg
                viewBox="0 0 280 112"
                className="w-full h-auto"
                role="img"
                aria-label="Biểu tượng Terminal Hacker Ubuntu với mạch cổng ASCII"
              >
                <rect x="6" y="6" width="268" height="100" rx="10" fill="#06120D" stroke="#22C55E" strokeWidth="1.5" />
                <path d="M24 34 L46 52 L24 70" fill="none" stroke="#4ADE80" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="54" y1="70" x2="84" y2="70" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
                <text x="100" y="38" fill="#86EFAC" fontSize="13" fontFamily="monospace" fontWeight="700">
                  ubuntu@sec-node:~$
                </text>
                <text x="100" y="58" fill="#FBBF24" fontSize="11" fontFamily="monospace">
                  cat log | grep TOKEN
                </text>
                <text x="100" y="78" fill="#38BDF8" fontSize="11" fontFamily="monospace">
                  [ETH0]══╬[p80]══▶[CORE]
                </text>
                <rect x="100" y="88" width="146" height="6" rx="3" fill="#0F291E" />
                <rect x="100" y="88" width="76" height="6" rx="3" fill="#22C55E" />
              </svg>

              <div className="rounded-lg border border-emerald-900/80 bg-[#06100C] p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span style={{ color: selectedMissionDomain.color }}>
                    {selectedMissionDomain.title}
                  </span>
                  <span className="text-amber-300">Màn {selectedMissionDef.id}/16</span>
                </div>
                <div className="text-xs text-white font-bold">
                  {selectedMissionDef.title}
                </div>
                <div className="text-[11px] text-cyan-300">
                  Kỹ năng học: {selectedMissionDef.ubuntuTopic}
                </div>
                <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                  {selectedMissionDef.briefing}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==================== ACTIVE GAMEPLAY SHELL ====================
  return (
    <section
      aria-label="Cửa sổ Terminal Hacker Dòng Lệnh Linux Ubuntu"
      className={`relative rounded-2xl border ${
        runtime.tracePercent >= 75
          ? 'border-rose-500/80 shadow-[0_0_32px_rgba(244,63,94,0.22)]'
          : runtime.traceFreezeTimer > 0
            ? 'border-cyan-400/80 shadow-[0_0_28px_rgba(56,189,248,0.22)]'
            : 'border-emerald-500/40 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]'
      } bg-[#050A08] text-emerald-200 overflow-hidden transition-colors`}
    >
      {/* Top Game Shell HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-2.5 bg-[#08120E] border-b border-emerald-900/80">
        {/* Left: Mission + Domain */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">
                Màn {currentMission.id}/{LINUX_MISSIONS.length}
              </span>
              <span style={{ color: currentDomain.color }} className="font-bold">
                · {currentDomain.title}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-100 truncate">
              {currentMission.title}
            </div>
          </div>
        </div>

        {/* Center: Hero TRACE Meter */}
        <div className="flex-1 min-w-[200px] max-w-md space-y-1">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className={`font-bold uppercase tracking-wider ${traceTone.split(' ')[0]}`}>
              {runtime.traceFreezeTimer > 0
                ? `ĐÓNG BĂNG TRACE (${runtime.traceFreezeTimer.toFixed(1)}s)`
                : runtime.tracePercent >= 75
                  ? 'NGUY HIỂM · SẮP BỊ LỘ IP!'
                  : `TRUY VẾT (TRACE +${traceRate.toFixed(1)}%/s)`}
            </span>
            <span className="font-bold text-sm tabular-nums text-emerald-100">
              {Math.round(runtime.tracePercent)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Thanh truy vết Trace"
            aria-valuenow={Math.round(runtime.tracePercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`h-2.5 w-full rounded-full bg-[#020504] border ${traceTone.split(' ')[1]} overflow-hidden`}
          >
            <div
              className={`h-full transition-all duration-100 ${traceBarColor}`}
              style={{ width: `${Math.min(100, Math.max(0, runtime.tracePercent))}%` }}
            />
          </div>
        </div>

        {/* Right: Score, Combo, EP & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 font-mono">
          <div className="hidden sm:flex items-center gap-3 text-xs pr-2 border-r border-emerald-900/80 tabular-nums">
            <div>
              <span className="text-emerald-500 block text-[10px]">ĐIỂM</span>
              <span className="font-bold text-emerald-100">{runtime.score}</span>
            </div>
            <div>
              <span className="text-emerald-500 block text-[10px]">COMBO</span>
              <span className="font-bold text-amber-300">x{runtime.combo}</span>
            </div>
            <div>
              <span className="text-emerald-500 block text-[10px]">NĂNG LƯỢNG</span>
              <span className="font-bold text-cyan-300">{runtime.exploitPoints} EP</span>
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setSoundEnabled((s) => !s);
            }}
            aria-label={soundEnabled ? 'Tắt âm thanh [M]' : 'Bật âm thanh [M]'}
            title="Âm thanh [M]"
            className="w-9 h-9 rounded-lg border border-emerald-800 bg-[#0A1812] hover:border-emerald-400 text-emerald-300 flex items-center justify-center cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              setScreenState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
            }}
            aria-label={screenState === 'paused' ? 'Tiếp tục [P]' : 'Tạm dừng [P]'}
            title="Tạm dừng [P]"
            className="w-9 h-9 rounded-lg border border-emerald-800 bg-[#0A1812] hover:border-emerald-400 text-emerald-300 flex items-center justify-center cursor-pointer"
          >
            {screenState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.currentTarget.blur();
              startMission(runtime.missionIndex, 0, codexUnlocked, 35);
            }}
            aria-label="Chơi lại màn [R]"
            title="Chơi lại [R]"
            className="w-9 h-9 rounded-lg border border-emerald-800 bg-[#0A1812] hover:border-amber-400 text-emerald-300 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4">
        {/* LEFT: CRT Terminal + Power-ups + Guided Command Deck */}
        <div className="lg:col-span-8 flex flex-col rounded-xl border border-emerald-800/70 bg-[#030705] overflow-hidden">
          {/* Terminal Window Chrome & Exploit Powerup Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-[#07110C] border-b border-emerald-900/70 font-mono text-[11px]">
            <span className="text-emerald-400/90">
              bash :: ubuntu@sec-node:{runtime.cwd}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                disabled={runtime.exploitPoints < 30}
                onClick={() => triggerPowerup('freeze')}
                title="Đóng băng thanh Trace 6 giây (gõ 'freeze')"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                  runtime.exploitPoints >= 30
                    ? 'border-cyan-500/60 bg-cyan-950/50 text-cyan-200 hover:bg-cyan-500/20 cursor-pointer'
                    : 'border-emerald-950 bg-black/30 text-emerald-800 cursor-not-allowed'
                }`}
              >
                <Snowflake className="w-3 h-3" aria-hidden="true" />
                <span>Băng 6s (30EP)</span>
              </button>
              <button
                type="button"
                tabIndex={-1}
                disabled={runtime.exploitPoints < 40}
                onClick={() => triggerPowerup('cloak')}
                title="Đổi IP ẩn thân giảm -22% Trace (gõ 'cloak')"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                  runtime.exploitPoints >= 40
                    ? 'border-violet-500/60 bg-violet-950/50 text-violet-200 hover:bg-violet-500/20 cursor-pointer'
                    : 'border-emerald-950 bg-black/30 text-emerald-800 cursor-not-allowed'
                }`}
              >
                <EyeOff className="w-3 h-3" aria-hidden="true" />
                <span>Ẩn VPN -22% (40EP)</span>
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => triggerPowerup('hint')}
                title="Soi chính xác bước tiếp theo (gõ 'hint')"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-500/60 bg-amber-950/40 text-amber-200 hover:bg-amber-500/20 cursor-pointer"
              >
                <Lightbulb className="w-3 h-3" aria-hidden="true" />
                <span>Gợi ý {hackerMode === 'practice' ? '(Free)' : '(15EP)'}</span>
              </button>
            </div>
          </div>

          {/* Smart Live Step Mentor Bar */}
          <div className="px-3 py-1.5 bg-[#06130E] border-b border-emerald-900/60 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                BƯỚC TIẾP
              </span>
              <span className="text-sky-200 truncate">
                {shouldHighlightHint ? (
                  <>
                    Gõ <strong className="text-amber-300">{smartNextHint.command}</strong> — {smartNextHint.reason}
                  </>
                ) : (
                  <>{smartNextHint.reason}</>
                )}
              </span>
            </div>
            {shouldHighlightHint && (
              <button
                type="button"
                tabIndex={-1}
                onClick={() => {
                  runCommandString(smartNextHint.command);
                  inputRef.current?.focus();
                }}
                className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-[#03120B] font-bold shrink-0 cursor-pointer"
              >
                Chạy ngay →
              </button>
            )}
          </div>

          {/* Scrollable Terminal Log <pre> */}
          <div
            ref={logViewportRef}
            onClick={() => inputRef.current?.focus()}
            className="h-[290px] sm:h-[335px] overflow-y-auto p-3 sm:p-4 font-mono text-xs sm:text-[13px] leading-relaxed space-y-1.5 cursor-text"
          >
            {runtime.logs.map((line) => {
              const colorCls =
                line.kind === 'cmd'
                  ? 'text-emerald-100 font-semibold'
                  : line.kind === 'success'
                    ? 'text-emerald-300'
                    : line.kind === 'error'
                      ? 'text-rose-400'
                      : line.kind === 'warn'
                        ? 'text-amber-300'
                        : line.kind === 'ascii'
                          ? 'text-cyan-300 font-semibold'
                          : line.kind === 'hint'
                            ? 'text-sky-300'
                            : line.kind === 'noise'
                              ? 'text-emerald-400/90 bg-emerald-950/35 border border-emerald-800/50 rounded-lg px-2.5 py-2'
                              : 'text-emerald-300/90';

              return (
                <pre
                  key={line.id}
                  className={`whitespace-pre-wrap break-words font-mono ${colorCls}`}
                >
                  {line.text}
                </pre>
              );
            })}
          </div>

          {/* Quick Clickable Ubuntu Learning Command Deck */}
          <div className="px-3 py-2 bg-[#060F0B] border-t border-emerald-900/70 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/80">
              <span>Thẻ lệnh nhanh Ubuntu (nhấp để chạy hoặc gõ tay nhận thêm nhịp combo):</span>
              {autocompleteHint && (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    setCommandInput(autocompleteHint);
                    inputRef.current?.focus();
                  }}
                  className="text-cyan-300 hover:underline cursor-pointer"
                >
                  Tab → {autocompleteHint}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {currentMission.quickCommands.map((qCmd) => {
                const isSuggested = shouldHighlightHint && smartNextHint.command === qCmd;
                return (
                  <button
                    key={qCmd}
                    type="button"
                    tabIndex={-1}
                    onClick={() => {
                      runCommandString(qCmd);
                      inputRef.current?.focus();
                    }}
                    className={`px-2.5 py-1 rounded-md border font-mono text-xs transition-colors cursor-pointer ${
                      isSuggested
                        ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold ring-1 ring-amber-400/50'
                        : 'border-emerald-800/80 bg-[#0A1912] hover:bg-emerald-500/20 hover:border-emerald-400 text-emerald-200'
                    }`}
                  >
                    {qCmd}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Command Line Input */}
          <form
            onSubmit={handleSubmitForm}
            className="flex items-center gap-2 px-3 py-2.5 bg-[#020504] border-t border-emerald-700/60"
          >
            <label
              htmlFor="linux-hacker-cli-input"
              className="font-mono text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap shrink-0"
            >
              ubuntu@sec:{runtime.cwd}$
            </label>
            <input
              id="linux-hacker-cli-input"
              ref={inputRef}
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Gõ lệnh Ubuntu (ls -la, cat, grep, ps aux, kill -9, crack...) + Enter"
              className="flex-1 min-w-0 bg-transparent text-emerald-100 placeholder:text-emerald-700 font-mono text-xs sm:text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#03120B] font-mono font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              Thực thi
            </button>
          </form>
        </div>

        {/* RIGHT: Switchable Tactical Objectives + ASCII/Processes + Ubuntu Codex */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Sub-tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-emerald-800/70 bg-[#060E0A] font-mono text-xs">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setSideTab('mission')}
              className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                sideTab === 'mission'
                  ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-100 font-bold'
                  : 'text-emerald-400/75 hover:text-emerald-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mục Tiêu &amp; Mạch</span>
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setSideTab('codex')}
              className={`py-1.5 px-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                sideTab === 'codex'
                  ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-100 font-bold'
                  : 'text-emerald-400/75 hover:text-cyan-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Bộ Sưu Tập ({codexUnlocked.length}/{UBUNTU_CODEX.length})</span>
            </button>
          </div>

          {sideTab === 'mission' ? (
            <>
              {/* 1. Mission Checklist */}
              <div className="rounded-xl border border-emerald-800/70 bg-[#07110C] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                  <span>MỤC TIÊU PHÁ KHÓA</span>
                  <span className="text-amber-300 tabular-nums">
                    {objectives.steps.filter((s) => s.done).length}/{objectives.steps.length}
                  </span>
                </div>
                <ul className="space-y-1.5 font-mono text-xs">
                  {objectives.steps.map((step) => (
                    <li
                      key={step.id}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 border ${
                        step.done
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 line-through opacity-80'
                          : 'bg-[#040B08] border-emerald-900/70 text-emerald-100'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                          step.done ? 'text-emerald-400' : 'text-emerald-800'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{step.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 2. Disk Alert Widget when mission involves df -h / rm */}
              {currentMission.requireJunkClean && (
                <div className="rounded-xl border border-amber-600/60 bg-[#140E05] p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" aria-hidden="true" />
                      Ổ ĐĨA /dev/nvme0n1p1
                    </span>
                    <span className={runtime.diskUsagePct >= 90 ? 'text-rose-400' : 'text-emerald-300'}>
                      {runtime.diskUsagePct}% ĐẦY
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-black/60 overflow-hidden">
                    <div
                      className={`h-full transition-all ${runtime.diskUsagePct >= 90 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                      style={{ width: `${runtime.diskUsagePct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 3. Docker Containers Widget when mission involves Docker */}
              {runtime.containers.length > 0 && (
                <div className="rounded-xl border border-sky-700/60 bg-[#04101A] p-3 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-sky-300 font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5" aria-hidden="true" />
                      DOCKER CONTAINERS
                    </span>
                    <span className="text-[10px] text-sky-400/80">{runtime.containers.length} node</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {runtime.containers.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-sky-900/70 bg-[#030A11] p-2 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{c.name}</span>
                          <span className={c.restarted ? 'text-emerald-300' : 'text-amber-300'}>
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1 text-[10px] text-sky-300/80">
                          <span>{c.ports}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => runCommandString(`docker logs ${c.name}`)}
                              className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/50 text-sky-200 hover:bg-sky-500/35 cursor-pointer"
                            >
                              logs
                            </button>
                            <button
                              type="button"
                              onClick={() => runCommandString(`docker restart ${c.name}`)}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/35 cursor-pointer"
                            >
                              restart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Kubernetes Pods Widget when mission involves DevOps Cloud */}
              {runtime.k8sPods.length > 0 && (
                <div className="rounded-xl border border-orange-700/60 bg-[#140B04] p-3 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-orange-300 font-bold">
                    <span className="inline-flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
                      KUBERNETES PODS
                    </span>
                    <span className="text-[10px] text-orange-300/80">kubectl</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {runtime.k8sPods.map((pod) => (
                      <div
                        key={pod.name}
                        className="rounded-lg border border-orange-900/70 bg-[#0A0502] p-2 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{pod.name}</span>
                          <span
                            className={
                              pod.status === 'Running' ? 'text-emerald-300' : 'text-rose-400 font-bold'
                            }
                          >
                            {pod.status} ({pod.ready})
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-orange-200/80">
                          <span>Restarts: {pod.restarts}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => runCommandString(`kubectl logs ${pod.name}`)}
                              className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/50 text-orange-200 hover:bg-orange-500/35 cursor-pointer"
                            >
                              logs
                            </button>
                            <button
                              type="button"
                              onClick={() => runCommandString('kubectl scale --replicas=3')}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/35 cursor-pointer"
                            >
                              scale x3
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Interactive ASCII Network Bridge OR Active Processes */}
              {runtime.bridges.length > 0 ? (
                <div className="rounded-xl border border-cyan-700/60 bg-[#051014] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                      NỐI MẠCH CỔNG ASCII
                    </span>
                    <span className="text-[11px] text-cyan-400/80">Gõ link &lt;port&gt; hoặc bấm</span>
                  </div>
                  <pre className="p-2 rounded-lg bg-[#020709] border border-cyan-900/70 font-mono text-[11px] text-cyan-200 overflow-x-auto">
                    {asciiDiagram}
                  </pre>
                  <div className="flex flex-wrap gap-1.5">
                    {runtime.bridges.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleToggleAsciiBridge(b.port)}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs transition-colors cursor-pointer ${
                          b.connected
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                            : 'bg-[#081A20] border-cyan-700 hover:border-cyan-400 text-cyan-200'
                        }`}
                      >
                        {b.connected ? `══[p${b.port}:OK]` : `Nối [p${b.port}]`}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-800/70 bg-[#07110C] p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
                      TIẾN TRÌNH TRÊN NODE
                    </span>
                    <span className="tabular-nums">
                      {runtime.processes.filter((p) => !p.killed).length} chạy
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {runtime.processes
                      .filter((p) => !p.killed)
                      .map((p) => (
                        <div
                          key={p.pid}
                          className={`flex items-center justify-between px-2 py-1 rounded border ${
                            p.isThreat
                              ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                              : 'bg-[#040B08] border-emerald-900/60 text-emerald-300/80'
                          }`}
                        >
                          <span className="truncate">
                            PID {p.pid} · {p.command}
                          </span>
                          {p.isThreat && (
                            <button
                              type="button"
                              onClick={() => runCommandString(`kill -9 ${p.pid}`)}
                              className="ml-2 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400 text-rose-200 hover:bg-rose-500/40 shrink-0 cursor-pointer"
                            >
                              kill -9
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 6. Learn-As-You-Play Ubuntu Lesson Tips */}
              <div className="rounded-xl border border-emerald-800/70 bg-[#07110C] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-sky-300">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    SỔ TAY MÀN {currentMission.id}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {currentMission.lessonTips.map((tip) => (
                    <button
                      key={tip.cmd}
                      type="button"
                      onClick={() => {
                        setCommandInput(tip.cmd);
                        inputRef.current?.focus();
                      }}
                      className="w-full text-left rounded-lg border border-emerald-900/70 bg-[#040B08] hover:border-sky-500/70 px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      <div className="font-mono text-xs font-bold text-amber-300">{tip.syntax}</div>
                      <div className="text-[11px] text-emerald-200/80 leading-snug">{tip.meaning}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* 8-DOMAIN UBUNTU CODEX COLLECTIBLE VIEW */
            <div className="rounded-xl border border-cyan-700/60 bg-[#051014] p-3 space-y-2.5 max-h-[520px] overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-cyan-300">KHO 8 LĨNH VỰC ĐÃ MỞ</span>
                <span className="text-amber-300 tabular-nums font-bold">
                  {codexUnlocked.length}/{UBUNTU_CODEX.length}
                </span>
              </div>
              <div className="space-y-1.5 font-mono">
                {UBUNTU_CODEX.map((entry) => {
                  const unlocked = codexUnlocked.includes(entry.key);
                  const dom = KNOWLEDGE_DOMAINS.find((d) => d.id === entry.domainId);
                  return (
                    <div
                      key={entry.key}
                      className={`rounded-lg border px-2.5 py-2 transition-colors ${
                        unlocked
                          ? 'border-emerald-500/50 bg-[#071A13] text-emerald-100'
                          : 'border-slate-800 bg-[#030709] text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={unlocked ? 'font-bold text-amber-300' : 'font-semibold'}>
                          {entry.cmd}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: unlocked ? dom?.color ?? '#4ADE80' : '#475569' }}
                        >
                          {dom?.shortName} · {unlocked ? '✓' : 'Chưa mở'}
                        </span>
                      </div>
                      <div className="text-[11px] opacity-90 mt-0.5">
                        <strong>{entry.title}:</strong> {entry.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL OVERLAYS ==================== */}
      {screenState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tạm dừng Terminal"
          className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/60 bg-[#07120D] p-6 font-mono space-y-4 text-center">
            <h3 className="text-xl font-bold text-emerald-200">Tạm Dừng Xâm Nhập</h3>
            <p className="text-xs text-emerald-300/80">
              Thanh truy vết Trace đang giữ nguyên tại {Math.round(runtime.tracePercent)}%.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-[#030906] border border-emerald-900 p-2">
                <div className="text-emerald-500">MÀN</div>
                <div className="font-bold text-emerald-100 tabular-nums">
                  {currentMission.id}/{LINUX_MISSIONS.length}
                </div>
              </div>
              <div className="rounded-lg bg-[#030906] border border-emerald-900 p-2">
                <div className="text-emerald-500">ĐIỂM</div>
                <div className="font-bold text-emerald-100 tabular-nums">{runtime.score}</div>
              </div>
              <div className="rounded-lg bg-[#030906] border border-emerald-900 p-2">
                <div className="text-emerald-500">ĐÃ HỌC</div>
                <div className="font-bold text-cyan-300 tabular-nums">
                  {codexUnlocked.length}/{UBUNTU_CODEX.length}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScreenState('playing')}
                className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#03120B] font-bold text-sm cursor-pointer"
              >
                Tiếp Tục Trò Chơi
              </button>
              <button
                type="button"
                onClick={() => startMission(runtime.missionIndex, 0, codexUnlocked, 35)}
                className="w-full py-2 rounded-xl border border-emerald-700 hover:border-amber-400 text-emerald-200 text-xs cursor-pointer"
              >
                Chơi Lại Màn Này
              </button>
              <button
                type="button"
                onClick={() => setScreenState('title')}
                className="w-full py-2 rounded-xl border border-emerald-900 text-emerald-400 text-xs cursor-pointer"
              >
                Về Màn Hình Chính
              </button>
            </div>
          </div>
        </div>
      )}

      {screenState === 'mission_clear' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Phá khóa thành công"
          className="absolute inset-0 z-30 bg-black/85 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-emerald-400/70 bg-[#07120D] p-6 font-mono space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400 text-amber-300 font-bold text-xl">
                HẠNG {missionRank}
              </div>
            </div>
            <h3 className="text-xl font-bold text-emerald-200">
              Phá Khóa Màn {currentMission.id} Thành Công!
            </h3>
            <p className="text-xs text-emerald-300/85">
              Đã làm chủ: <strong className="text-cyan-300">{currentMission.ubuntuTopic}</strong>
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-[#030906] border border-emerald-900 p-2">
                <div className="text-emerald-500">ĐIỂM</div>
                <div className="font-bold text-emerald-100 tabular-nums">{runtime.score}</div>
              </div>
              <div className="rounded-lg bg-[#030906] border border-emerald-900 p-2">
                <div className="text-emerald-500">COMBO MAX</div>
                <div className="font-bold text-amber-300 tabular-nums">x{runtime.maxCombo}</div>
              </div>
              <div className="rounded-lg bg-[#030906] border border-emerald-900 p-2">
                <div className="text-emerald-500">BỘ SƯU TẬP</div>
                <div className="font-bold text-cyan-300 tabular-nums">
                  {codexUnlocked.length}/{UBUNTU_CODEX.length}
                </div>
              </div>
            </div>
            <button
              type="button"
              data-start="true"
              onClick={() =>
                startMission(
                  runtime.missionIndex + 1,
                  runtime.score,
                  runtime.learnedCommands,
                  Math.max(35, runtime.exploitPoints + 15)
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#03120B] font-bold text-sm cursor-pointer"
            >
              <span>Sang Màn {currentMission.id + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {screenState === 'gameover' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={endResultKind === 'victory' ? 'Chiến thắng toàn hệ thống' : 'Bị phát hiện truy vết'}
          className="absolute inset-0 z-30 bg-black/88 flex items-center justify-center p-4"
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-6 font-mono space-y-4 text-center ${
              endResultKind === 'victory'
                ? 'border-emerald-400 bg-[#07140E]'
                : 'border-rose-500 bg-[#14070B]'
            }`}
          >
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-full border mx-auto ${
                endResultKind === 'victory'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-400 text-rose-300'
              }`}
            >
              {endResultKind === 'victory' ? <Trophy className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>

            <h3
              className={`text-xl font-bold ${
                endResultKind === 'victory' ? 'text-emerald-200' : 'text-rose-200'
              }`}
            >
              {endResultKind === 'victory'
                ? 'Chiếm Quyền Root Thành Công!'
                : 'Bị Truy Vết 100% — Ngắt Kết Nối!'}
            </h3>

            <p className="text-xs text-slate-300">
              {endResultKind === 'victory'
                ? `Bạn đã chinh phục cả ${LINUX_MISSIONS.length} màn Hacker Dòng Lệnh Ubuntu và mở khóa ${codexUnlocked.length}/${UBUNTU_CODEX.length} lệnh!`
                : 'Hệ thống phòng thủ phát hiện lưu lượng bất thường. Hãy dùng nút Băng 6s / Ẩn VPN hoặc chuyển chế độ Học Như Chơi để luyện trước!'}
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-black/40 border border-white/10 p-2">
                <div className="text-slate-400">ĐIỂM</div>
                <div className="font-bold text-white tabular-nums">{runSnapshot.score}</div>
              </div>
              <div className="rounded-lg bg-black/40 border border-white/10 p-2">
                <div className="text-slate-400">KỶ LỤC</div>
                <div className="font-bold text-amber-300 tabular-nums">{runSnapshot.best}</div>
              </div>
              <div className="rounded-lg bg-black/40 border border-white/10 p-2">
                <div className="text-slate-400">ĐẠT MÀN</div>
                <div className="font-bold text-cyan-300 tabular-nums">
                  {runSnapshot.missionNum}/{LINUX_MISSIONS.length}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                data-start="true"
                onClick={() =>
                  startMission(
                    endResultKind === 'victory' ? 0 : runtime.missionIndex,
                    0,
                    codexUnlocked,
                    35
                  )
                }
                className="w-full py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#03120B] font-bold text-sm cursor-pointer"
              >
                {endResultKind === 'victory' ? 'Chơi Lại Từ Màn 1' : 'Thử Lại Màn Này'}
              </button>
              <button
                type="button"
                onClick={() => setScreenState('title')}
                className="w-full py-2 rounded-xl border border-white/15 text-slate-300 text-xs cursor-pointer"
              >
                Về Màn Hình Chính
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
