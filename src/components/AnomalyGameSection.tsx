import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  FileText,
  Flame,
  GitCompareArrows,
  Info,
  MessageSquareWarning,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stamp,
  Trophy,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import {
  ANOMALY_DAYS,
  AnomalyVerdict,
  DossierField,
} from '../data/anomalyCases.ts';
import {
  advanceAfterVerdict,
  advanceToNextDay,
  ANOMALY_DIFFICULTIES,
  AnomalyDifficultyId,
  AnomalyProgressState,
  applyVerdictToProgress,
  buildForensicDossier,
  createInitialAnomalyProgress,
  CrossCheckResult,
  evaluateCrossCheckPair,
  evaluateInspectionVerdict,
  evaluateTimeoutFailure,
  getActiveCase,
  getActiveDay,
  MAX_REPUTATION,
  PostVerdictTransition,
  VERDICT_LABELS,
  VerdictEvaluationResult,
} from '../utils/anomalyInspectorEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type AnomalyScreenState = 'title' | 'playing' | 'paused' | 'day_complete' | 'gameover';

interface AuditLogEntry {
  caseCode: string;
  applicantName: string;
  verdict: AnomalyVerdict;
  isCorrect: boolean;
  scoreDelta: number;
}

interface AnomalyGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

interface SavedAnomalyMeta {
  bestScore: number;
  highestUnlockedDay: number;
}

const STORAGE_KEY = 'thuanle-anomaly-save-v1';

function loadSavedAnomalyMeta(): SavedAnomalyMeta {
  if (typeof window === 'undefined') {
    return { bestScore: 0, highestUnlockedDay: 1 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { bestScore: 0, highestUnlockedDay: 1 };
    const parsed = JSON.parse(raw) as Partial<SavedAnomalyMeta>;
    return {
      bestScore: typeof parsed.bestScore === 'number' && parsed.bestScore > 0 ? parsed.bestScore : 0,
      highestUnlockedDay:
        typeof parsed.highestUnlockedDay === 'number'
          ? Math.max(1, Math.min(ANOMALY_DAYS.length, parsed.highestUnlockedDay))
          : 1,
    };
  } catch {
    return { bestScore: 0, highestUnlockedDay: 1 };
  }
}

function saveAnomalyMeta(meta: SavedAnomalyMeta) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Ignore storage quota errors
  }
}

function playAnomalyFx(
  kind: 'stamp' | 'alarm' | 'clue' | 'clear' | 'error' | 'gameover',
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

    if (kind === 'stamp') {
      playTone(170, 62, 0.09, 0.24, 'triangle');
      playTone(320, 140, 0.05, 0.12, 'sine', 0.02);
    } else if (kind === 'clue') {
      playTone(540, 660, 0.05, 0.08, 'sine');
    } else if (kind === 'alarm') {
      playTone(620, 440, 0.14, 0.18, 'sawtooth', 0);
      playTone(620, 440, 0.14, 0.18, 'sawtooth', 0.16);
    } else if (kind === 'clear') {
      playTone(523.25, 523.25, 0.12, 0.14, 'triangle', 0);
      playTone(659.25, 659.25, 0.12, 0.14, 'triangle', 0.1);
      playTone(783.99, 783.99, 0.22, 0.18, 'triangle', 0.2);
    } else if (kind === 'error') {
      playTone(210, 150, 0.16, 0.18, 'sawtooth');
    } else if (kind === 'gameover') {
      playTone(349.23, 293.66, 0.18, 0.16, 'triangle', 0);
      playTone(261.63, 196, 0.3, 0.16, 'triangle', 0.18);
    }
  } catch {
    // Ignore blocked audio context
  }
}

export function AnomalyGameSection({ theme }: AnomalyGameSectionProps) {
  const initialMeta = useMemo(() => loadSavedAnomalyMeta(), []);

  const [screenState, setScreenState] = useState<AnomalyScreenState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [unlockAllDays, setUnlockAllDays] = useState<boolean>(false);
  const [selectedStartDay, setSelectedStartDay] = useState<number>(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState<AnomalyDifficultyId>('inspector');
  const [progress, setProgress] = useState<AnomalyProgressState>(() =>
    createInitialAnomalyProgress(1, initialMeta.bestScore, initialMeta.highestUnlockedDay, 'inspector')
  );
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [citedRuleCodes, setCitedRuleCodes] = useState<string[]>([]);
  const [uvScannedCaseIds, setUvScannedCaseIds] = useState<string[]>([]);
  const [interrogatedTurnIds, setInterrogatedTurnIds] = useState<string[]>([]);
  const [compareDocKey, setCompareDocKey] = useState<string | null>(null);
  const [compareDbKey, setCompareDbKey] = useState<string | null>(null);
  const [crossCheckOutput, setCrossCheckOutput] = useState<CrossCheckResult | null>(null);
  const [caseTimeLeftSec, setCaseTimeLeftSec] = useState<number | null>(
    ANOMALY_DIFFICULTIES.inspector.timeLimitPerCaseSec
  );
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);

  const [lastEvaluation, setLastEvaluation] = useState<VerdictEvaluationResult | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PostVerdictTransition | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const totalCasesCount = useMemo(
    () => ANOMALY_DAYS.reduce((acc, day) => acc + day.cases.length, 0),
    []
  );
  const effectiveUnlockedDay = unlockAllDays ? ANOMALY_DAYS.length : progress.highestUnlockedDay;
  const activeDay = useMemo(() => getActiveDay(progress), [progress]);
  const activeCase = useMemo(() => getActiveCase(progress), [progress]);
  const activeDifficultyCfg = ANOMALY_DIFFICULTIES[progress.difficulty];
  const forensicIntel = useMemo(
    () => (activeCase ? buildForensicDossier(activeCase, progress.difficulty) : null),
    [activeCase, progress.difficulty]
  );
  const isUvScanned = Boolean(activeCase && uvScannedCaseIds.includes(activeCase.id));

  const resetCaseDeductionTools = useCallback((diffId: AnomalyDifficultyId) => {
    setFlaggedIds([]);
    setCitedRuleCodes([]);
    setInterrogatedTurnIds([]);
    setCompareDocKey(null);
    setCompareDbKey(null);
    setCrossCheckOutput(null);
    setCaseTimeLeftSec(ANOMALY_DIFFICULTIES[diffId].timeLimitPerCaseSec);
  }, []);

  // Sync document.body.dataset.state cleanly
  useEffect(() => {
    const mappedState =
      screenState === 'day_complete'
        ? 'paused'
        : screenState;
    document.body.dataset.state = mappedState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [screenState]);

  const startShift = useCallback(
    (dayNumber: number, diffOverride?: AnomalyDifficultyId) => {
      const diffToUse = diffOverride ?? selectedDifficulty;
      const saved = loadSavedAnomalyMeta();
      const maxAllowed = unlockAllDays ? ANOMALY_DAYS.length : saved.highestUnlockedDay;
      const clampedDay = Math.max(1, Math.min(maxAllowed, dayNumber));
      setProgress(
        createInitialAnomalyProgress(clampedDay, saved.bestScore, maxAllowed, diffToUse)
      );
      setUvScannedCaseIds([]);
      setAuditLog([]);
      resetCaseDeductionTools(diffToUse);
      setLastEvaluation(null);
      setPendingTransition(null);
      setScreenState('playing');
      playAnomalyFx('stamp', soundEnabled, audioCtxRef);
    },
    [resetCaseDeductionTools, selectedDifficulty, soundEnabled, unlockAllDays]
  );

  const handleToggleFlag = useCallback(
    (field: DossierField) => {
      if (screenState !== 'playing' || lastEvaluation !== null) return;
      const clueId = field.suspectId ?? field.key;
      setFlaggedIds((prev) =>
        prev.includes(clueId) ? prev.filter((id) => id !== clueId) : [...prev, clueId]
      );
      playAnomalyFx('clue', soundEnabled, audioCtxRef);
    },
    [screenState, lastEvaluation, soundEnabled]
  );

  const handleToggleCiteRule = useCallback(
    (ruleCode: string) => {
      if (screenState !== 'playing' || lastEvaluation !== null) return;
      setCitedRuleCodes((prev) =>
        prev.includes(ruleCode) ? prev.filter((c) => c !== ruleCode) : [...prev, ruleCode]
      );
      playAnomalyFx('clue', soundEnabled, audioCtxRef);
    },
    [lastEvaluation, screenState, soundEnabled]
  );

  const handleRunUvScan = useCallback(() => {
    if (screenState !== 'playing' || !activeCase || lastEvaluation !== null || isUvScanned) return;
    if (progress.investigationTokens <= 0) {
      playAnomalyFx('error', soundEnabled, audioCtxRef);
      return;
    }
    setProgress((prev) => ({
      ...prev,
      investigationTokens: Math.max(0, prev.investigationTokens - 1),
    }));
    setUvScannedCaseIds((prev) => [...prev, activeCase.id]);
    playAnomalyFx('clue', soundEnabled, audioCtxRef);
  }, [activeCase, isUvScanned, lastEvaluation, progress.investigationTokens, screenState, soundEnabled]);

  const handleRunCrossCheck = useCallback(
    (docKeyOverride?: string, dbKeyOverride?: string) => {
      if (!activeCase || lastEvaluation !== null) return;
      const dKey = docKeyOverride ?? compareDocKey;
      const bKey = dbKeyOverride ?? compareDbKey;
      if (!dKey || !bKey) return;
      const docField = activeCase.documentFields.find((f) => f.key === dKey);
      const dbField = activeCase.databaseFields.find((f) => f.key === bKey);
      if (!docField || !dbField) return;
      const result = evaluateCrossCheckPair(activeCase, docField, dbField);
      setCrossCheckOutput(result);
      playAnomalyFx(result.hasMismatch ? 'alarm' : 'clue', soundEnabled, audioCtxRef);
    },
    [activeCase, compareDbKey, compareDocKey, lastEvaluation, soundEnabled]
  );

  const handleAskInterrogation = useCallback(
    (turnId: string) => {
      if (screenState !== 'playing' || lastEvaluation !== null) return;
      setInterrogatedTurnIds((prev) => (prev.includes(turnId) ? prev : [...prev, turnId]));
      playAnomalyFx('clue', soundEnabled, audioCtxRef);
    },
    [lastEvaluation, screenState, soundEnabled]
  );

  const finalizeEvaluation = useCallback(
    (evaluation: VerdictEvaluationResult, verdictForLog: AnomalyVerdict) => {
      if (!activeCase) return;
      const { nextProgress, transition } = applyVerdictToProgress(progress, evaluation);

      setProgress(nextProgress);
      setLastEvaluation(evaluation);
      setPendingTransition(transition);
      setAuditLog((prev) => [
        {
          caseCode: activeCase.dossierCode,
          applicantName: activeCase.applicantName,
          verdict: verdictForLog,
          isCorrect: evaluation.isCorrect,
          scoreDelta: evaluation.scoreDelta,
        },
        ...prev.slice(0, 7),
      ]);

      saveAnomalyMeta({
        bestScore: nextProgress.bestScore,
        highestUnlockedDay: nextProgress.highestUnlockedDay,
      });

      if (verdictForLog === 'alarm' && evaluation.isCorrect) {
        playAnomalyFx('alarm', soundEnabled, audioCtxRef);
      } else if (evaluation.isCorrect) {
        playAnomalyFx('stamp', soundEnabled, audioCtxRef);
      } else {
        playAnomalyFx('error', soundEnabled, audioCtxRef);
      }
    },
    [activeCase, progress, soundEnabled]
  );

  const handleSubmitVerdict = useCallback(
    (verdict: AnomalyVerdict) => {
      if (screenState !== 'playing' || !activeCase || lastEvaluation !== null) return;

      const evaluation = evaluateInspectionVerdict(
        activeCase,
        verdict,
        flaggedIds,
        progress.streak,
        {
          difficulty: progress.difficulty,
          citedRuleCodes,
          usedForensicAssist: isUvScanned || interrogatedTurnIds.length > 0,
        }
      );
      finalizeEvaluation(evaluation, verdict);
    },
    [
      activeCase,
      citedRuleCodes,
      finalizeEvaluation,
      flaggedIds,
      interrogatedTurnIds.length,
      isUvScanned,
      lastEvaluation,
      progress.difficulty,
      progress.streak,
      screenState,
    ]
  );

  // Per-case countdown timer for timed difficulty modes
  useEffect(() => {
    if (
      screenState !== 'playing' ||
      lastEvaluation !== null ||
      !activeCase ||
      activeDifficultyCfg.timeLimitPerCaseSec === null
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setCaseTimeLeftSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          const timeoutEval = evaluateTimeoutFailure(activeCase, progress.difficulty);
          finalizeEvaluation(timeoutEval, 'reject');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeCase, activeDifficultyCfg.timeLimitPerCaseSec, finalizeEvaluation, lastEvaluation, progress.difficulty, screenState]);

  const handleAdvanceAfterVerdict = useCallback(() => {
    if (!lastEvaluation || !pendingTransition) return;

    resetCaseDeductionTools(progress.difficulty);
    setLastEvaluation(null);

    if (pendingTransition === 'next_case') {
      setProgress((prev) => advanceAfterVerdict(prev));
      setPendingTransition(null);
      return;
    }

    if (pendingTransition === 'day_complete') {
      setPendingTransition(null);
      setScreenState('day_complete');
      playAnomalyFx('clear', soundEnabled, audioCtxRef);
      return;
    }

    if (pendingTransition === 'victory') {
      setPendingTransition('victory');
      setScreenState('gameover');
      playAnomalyFx('clear', soundEnabled, audioCtxRef);
      return;
    }

    if (pendingTransition === 'fired') {
      setPendingTransition('fired');
      setScreenState('gameover');
      playAnomalyFx('gameover', soundEnabled, audioCtxRef);
    }
  }, [lastEvaluation, pendingTransition, progress.difficulty, resetCaseDeductionTools, soundEnabled]);

  const handleContinueNextDay = useCallback(() => {
    setProgress((prev) => advanceToNextDay(prev));
    resetCaseDeductionTools(progress.difficulty);
    setLastEvaluation(null);
    setPendingTransition(null);
    setScreenState('playing');
    playAnomalyFx('stamp', soundEnabled, audioCtxRef);
  }, [progress.difficulty, resetCaseDeductionTools, soundEnabled]);

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
          startShift(selectedStartDay);
        }
        return;
      }

      if (screenState === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setScreenState('playing');
        }
        return;
      }

      if (screenState === 'day_complete') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContinueNextDay();
        }
        return;
      }

      if (screenState === 'playing') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setScreenState('paused');
          return;
        }

        if (lastEvaluation) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAdvanceAfterVerdict();
          }
          return;
        }

        if (e.key === '1') {
          e.preventDefault();
          handleSubmitVerdict('approve');
        } else if (e.key === '2') {
          e.preventDefault();
          handleSubmitVerdict('reject');
        } else if (e.key === '3') {
          e.preventDefault();
          handleSubmitVerdict('alarm');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screenState,
    selectedStartDay,
    lastEvaluation,
    startShift,
    handleContinueNextDay,
    handleAdvanceAfterVerdict,
    handleSubmitVerdict,
  ]);

  const jsonPreviewText = useMemo(
    () =>
      JSON.stringify(
        {
          day: activeDay.day,
          shiftTitle: activeDay.shiftTitle,
          rules: activeDay.rules.map((r) => ({ code: r.code, title: r.title, severity: r.severity })),
          sampleCase: activeDay.cases[0]
            ? {
                id: activeDay.cases[0].id,
                dossierCode: activeDay.cases[0].dossierCode,
                expectedVerdict: activeDay.cases[0].expectedVerdict,
                validClueIds: activeDay.cases[0].validClueIds,
              }
            : null,
        },
        null,
        2
      ),
    [activeDay]
  );

  const reputationPercent = Math.max(0, Math.min(100, Math.round((progress.reputation / MAX_REPUTATION) * 100)));
  const reputationToneClass =
    reputationPercent >= 65
      ? 'bg-emerald-600 dark:bg-emerald-500'
      : reputationPercent >= 35
        ? 'bg-amber-500'
        : 'bg-rose-600';

  const isVictory = pendingTransition === 'victory' || (screenState === 'gameover' && progress.reputation > 0);

  return (
    <section
      id="anomaly-inspector-section"
      aria-label="Kiểm Duyệt Hồ Sơ Dị Biệt — Minimalist Document Inspection"
      data-theme={theme}
      className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#FAF6ED] dark:bg-[#0B1222] text-[#0F172A] dark:text-[#E2E8F0] shadow-[0_14px_40px_-20px_rgba(10,25,47,0.16)] overflow-hidden"
    >
      {/* TITLE SCREEN */}
      {screenState === 'title' && (
        <div className="p-4 sm:p-6 lg:p-7 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
            <div className="lg:col-span-8 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.12em] text-[#B45309] dark:text-amber-400">
                <span>Sở Kiểm Duyệt Dị Biệt</span>
                <span>·</span>
                <span>
                  {ANOMALY_DAYS.length} Ca Trực · {totalCasesCount} Hồ Sơ
                </span>
                {progress.bestScore > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#0284C7] dark:text-sky-400 font-semibold">
                      Kỷ lục: {progress.bestScore}đ
                    </span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight text-[#0A192F] dark:text-white leading-tight">
                Kiểm Duyệt Hồ Sơ Dị Biệt
              </h1>

              <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed max-w-2xl">
                Ngồi bàn trực điều tra: soi đối chiếu chéo hồ sơ với CSDL, chạy đèn UV giải mã,
                thẩm vấn đương sự lộ sơ hở và trích dẫn đúng điều luật vi phạm trước khi đóng dấu{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">Duyệt</strong>,{' '}
                <strong className="text-amber-700 dark:text-amber-400">Từ Chối</strong> hoặc{' '}
                <strong className="text-rose-700 dark:text-rose-400">Báo Động</strong>.
              </p>

              {/* Difficulty Mode Selector (3 Modes) */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.08em] text-[#475569] dark:text-[#94A3B8]">
                  Chọn chế độ khó & áp lực suy luận
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(['trainee', 'inspector', 'nightmare'] as const).map((diffId) => {
                    const cfg = ANOMALY_DIFFICULTIES[diffId];
                    const active = selectedDifficulty === diffId;
                    return (
                      <button
                        key={diffId}
                        type="button"
                        data-testid={`anomaly-diff-${diffId}`}
                        onClick={() => setSelectedDifficulty(diffId)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? diffId === 'nightmare'
                              ? 'bg-[#991B1B] text-white border-[#7F1D1D] shadow-sm'
                              : diffId === 'trainee'
                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                                : 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8] shadow-sm'
                            : 'bg-white dark:bg-[#111C33] text-[#0F172A] dark:text-[#E2E8F0] border-[#D8CEBC] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-xs font-bold">
                          <span>{cfg.label}</span>
                        </div>
                        <p className={`text-[10px] font-mono mt-0.5 ${active ? 'text-white/90' : 'text-[#0284C7] dark:text-sky-400'}`}>
                          {cfg.badge}
                        </p>
                        <p className={`text-[11px] leading-snug mt-1 ${active ? 'text-white/85' : 'text-[#475569] dark:text-[#94A3B8]'}`}>
                          {cfg.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day / Shift Selector (12 Days) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-mono uppercase tracking-[0.08em] text-[#475569] dark:text-[#94A3B8]">
                    Chọn ngày trực (Mở khóa: Ngày 1–{effectiveUnlockedDay}/{ANOMALY_DAYS.length})
                  </p>
                  <button
                    type="button"
                    onClick={() => setUnlockAllDays((prev) => !prev)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      unlockAllDays
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-white dark:bg-[#111C33] text-[#0284C7] dark:text-sky-400 border-[#CBD5E1] dark:border-[#243454] hover:border-[#0284C7]'
                    }`}
                  >
                    {unlockAllDays ? '✓ Đang mở toàn bộ 12 ngày' : 'Mở khóa chơi thử cả 12 ngày'}
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 sm:gap-2">
                  {ANOMALY_DAYS.map((dayItem) => {
                    const isUnlocked = dayItem.day <= effectiveUnlockedDay;
                    const isSelected = selectedStartDay === dayItem.day;
                    const shortChannelLabels: Record<number, string> = {
                      1: 'Cổng Âm Ty',
                      2: 'Cấp Cứu 119',
                      3: 'MXH Ngoại Lai',
                      4: 'Luật Lồng',
                      5: 'Phiên Hỗn Hợp',
                      6: 'Chuyến Bay 13',
                      7: 'Tàu Điện M0',
                      8: 'Kho Ký Ức',
                      9: 'Thời Gian',
                      10: 'Tầng Âm 9',
                      11: 'Duyệt AI',
                      12: 'Đa Vũ Trụ',
                    };
                    return (
                      <button
                        key={dayItem.day}
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => setSelectedStartDay(dayItem.day)}
                        className={`min-h-[44px] px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border text-left transition-all ${
                          !isUnlocked
                            ? 'opacity-50 cursor-not-allowed bg-[#EDE6D8] dark:bg-[#0F172A] border-[#D6CCBA] dark:border-[#1E293B]'
                            : isSelected
                              ? 'cursor-pointer bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8] shadow-sm'
                              : 'cursor-pointer bg-white dark:bg-[#111C33] text-[#0F172A] dark:text-[#E2E8F0] border-[#D8CEBC] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold">
                          <span>Ngày {dayItem.day}</span>
                          {!isUnlocked && <span aria-hidden="true">🔒</span>}
                        </div>
                        <div
                          className={`text-[10px] leading-tight mt-0.5 truncate ${
                            isSelected ? 'text-sky-100' : 'text-[#475569] dark:text-[#94A3B8]'
                          }`}
                        >
                          {shortChannelLabels[dayItem.day] ?? dayItem.shiftTitle.replace(/^Ngày \d+ · /, '')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-0.5">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startShift(selectedStartDay)}
                  className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] dark:bg-[#DC2626] dark:hover:bg-[#B91C1C] text-white font-semibold text-sm sm:text-base shadow-md transition-colors cursor-pointer"
                >
                  <Stamp className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Bắt Đầu Ca Trực (Ngày {selectedStartDay})</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowJsonPreview((prev) => !prev)}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#CBD5E1] dark:border-[#2A3B5E] bg-white/85 dark:bg-[#111C33] text-xs font-mono text-[#334155] dark:text-[#CBD5E1] hover:border-[#0284C7] cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                  <span>{showJsonPreview ? 'Ẩn JSON mẫu' : 'Cấu trúc JSON'}</span>
                </button>
              </div>
            </div>

            {/* Right Visual Seal Emblem */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl border-2 border-[#D6CBB7] dark:border-[#1E2E4A] bg-[#F3ECDC] dark:bg-[#0F172A] p-5 sm:p-6 flex flex-col items-center text-center gap-4">
                <svg
                  viewBox="0 0 220 220"
                  className="w-36 h-36 sm:w-44 sm:h-44 text-[#991B1B] dark:text-[#F87171]"
                  role="img"
                  aria-label="Ấn triện Sở Kiểm Duyệt Hồ Sơ Dị Biệt"
                >
                  <circle
                    cx="110"
                    cy="110"
                    r="96"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="10 6"
                  />
                  <circle
                    cx="110"
                    cy="110"
                    r="82"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="48"
                    y="62"
                    width="124"
                    height="96"
                    rx="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  />
                  <line x1="64" y1="84" x2="156" y2="84" stroke="currentColor" strokeWidth="2" />
                  <line x1="64" y1="104" x2="138" y2="104" stroke="currentColor" strokeWidth="2" />
                  <line x1="64" y1="124" x2="122" y2="124" stroke="currentColor" strokeWidth="2" />
                  <g transform="rotate(-14 115 118)">
                    <rect
                      x="58"
                      y="102"
                      width="106"
                      height="30"
                      rx="3"
                      fill="#991B1B"
                      fillOpacity="0.14"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <text
                      x="111"
                      y="122"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="monospace"
                      fill="currentColor"
                    >
                      KIỂM DUYỆT
                    </text>
                  </g>
                </svg>

                <div className="space-y-1.5 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <p className="font-mono uppercase tracking-[0.1em] text-[#0A192F] dark:text-white font-semibold">
                    Phím tắt thao tác nhanh
                  </p>
                  <p>
                    <kbd className="px-1.5 py-0.5 rounded border border-current font-mono">1</kbd> Duyệt
                    {' · '}
                    <kbd className="px-1.5 py-0.5 rounded border border-current font-mono">2</kbd> Từ Chối
                    {' · '}
                    <kbd className="px-1.5 py-0.5 rounded border border-current font-mono">3</kbd> Báo Động
                  </p>
                  <p>Nhấn trực tiếp vào dòng nghi vấn để ghi +25đ thưởng soi mâu thuẫn.</p>
                </div>
              </div>
            </div>
          </div>

          {showJsonPreview && (
            <div className="rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-[#0F172A] text-slate-200 p-4 overflow-x-auto">
              <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono text-sky-300">
                <span>JSON Scenario Architecture · Mở rộng không giới hạn số màn chơi</span>
                <span>Ngày {activeDay.day}</span>
              </div>
              <pre className="text-[11px] leading-relaxed font-mono">{jsonPreviewText}</pre>
            </div>
          )}
        </div>
      )}

      {/* PLAYING / PAUSED / DAY COMPLETE */}
      {(screenState === 'playing' || screenState === 'paused' || screenState === 'day_complete') && (
        <div className="relative">
          {/* Compact Shift HUD */}
          <div className="border-b border-[#DED4C2] dark:border-[#1E2E4A] bg-[#F2EBD9] dark:bg-[#0F172A] px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-xs font-mono font-bold uppercase tracking-[0.08em] text-[#991B1B] dark:text-rose-400">
                  {activeDay.shiftTitle}
                </span>
                <span className="hidden sm:inline text-xs text-[#64748B]">·</span>
                <span className="text-xs text-[#475569] dark:text-[#94A3B8] truncate">
                  {activeDay.department}
                </span>
                <span className="hidden sm:inline text-xs text-[#64748B]">·</span>
                <span data-testid="anomaly-hud-difficulty" className="text-xs font-mono font-semibold text-[#0284C7] dark:text-sky-300">
                  {activeDifficultyCfg.label} (×{activeDifficultyCfg.scoreMultiplier})
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono tabular-nums">
              <div className="flex items-center gap-1.5">
                <span className="text-[#475569] dark:text-[#94A3B8]">Hồ sơ:</span>
                <strong className="text-[#0F172A] dark:text-white">
                  {progress.currentCaseIndex + 1}/{activeDay.cases.length}
                </strong>
              </div>

              {caseTimeLeftSec !== null && (
                <div className="flex items-center gap-1">
                  <Clock
                    className={`w-3.5 h-3.5 ${
                      caseTimeLeftSec <= 10 ? 'text-rose-600 dark:text-rose-400' : 'text-[#0284C7] dark:text-sky-400'
                    }`}
                    aria-hidden="true"
                  />
                  <strong
                    data-testid="anomaly-timer"
                    className={
                      caseTimeLeftSec <= 10
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-[#0F172A] dark:text-white'
                    }
                  >
                    {caseTimeLeftSec}s
                  </strong>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <ScanLine className="w-3.5 h-3.5 text-violet-700 dark:text-violet-400" aria-hidden="true" />
                <strong data-testid="anomaly-tokens" className="text-violet-800 dark:text-violet-300">
                  Soi: {progress.investigationTokens}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#475569] dark:text-[#94A3B8]">Điểm:</span>
                <strong data-testid="anomaly-score" className="text-[#0284C7] dark:text-sky-400">
                  {progress.score}đ
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <strong className="text-amber-700 dark:text-amber-300">×{progress.streak}</strong>
              </div>

              <div className="flex items-center gap-2 min-w-[120px]">
                <span className="text-[#475569] dark:text-[#94A3B8]">Uy tín:</span>
                <div className="w-14 h-2 rounded-full bg-[#D8CEBC] dark:bg-[#1E293B] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${reputationToneClass}`}
                    style={{ width: `${reputationPercent}%` }}
                  />
                </div>
                <strong className="text-[#0F172A] dark:text-white">{progress.reputation}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled((prev) => !prev)}
                  aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                  title={soundEnabled ? 'Tắt âm thanh (M)' : 'Bật âm thanh (M)'}
                  className="w-10 h-10 rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-white/80 dark:bg-[#111C33] flex items-center justify-center text-[#334155] dark:text-[#CBD5E1] hover:border-[#0284C7] cursor-pointer"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setScreenState((prev) => (prev === 'paused' ? 'playing' : 'paused'))}
                  aria-label={screenState === 'paused' ? 'Tiếp tục ca trực' : 'Tạm dừng'}
                  title="Tạm dừng (P)"
                  className="w-10 h-10 rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-white/80 dark:bg-[#111C33] flex items-center justify-center text-[#334155] dark:text-[#CBD5E1] hover:border-[#0284C7] cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Desk Grid */}
          {activeCase && (
            <div className="p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* LEFT COLUMN: Dossier + DB Comparison + Statement */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* Dossier Identity Header */}
                <div className="rounded-xl border border-[#D8CEBC] dark:border-[#1E2E4A] bg-white dark:bg-[#111C33] p-3.5 sm:p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-dashed border-[#D8CEBC] dark:border-[#243454]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.08em] text-[#475569] dark:text-[#94A3B8]">
                        <span className="font-bold text-[#991B1B] dark:text-rose-400">
                          #{activeCase.dossierCode}
                        </span>
                        <span>·</span>
                        <span>{activeCase.themeLabel}</span>
                        <span>·</span>
                        <span>{activeCase.submittedAt}</span>
                      </div>
                      <h2 className="font-serif text-lg sm:text-xl font-bold text-[#0A192F] dark:text-white mt-0.5">
                        {activeCase.applicantName}
                      </h2>
                      <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                        {activeCase.applicantRole} · Mã ấn: <span className="font-mono font-semibold">{activeCase.sealNumber}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#FEF3C7] dark:bg-amber-950/60 text-[#92400E] dark:text-amber-300 border border-[#F59E0B]/40">
                        <Search className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Đã soi: {flaggedIds.length}</span>
                      </span>
                      {flaggedIds.length > 0 && !lastEvaluation && (
                        <button
                          type="button"
                          onClick={() => setFlaggedIds([])}
                          className="text-[11px] underline text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white cursor-pointer"
                        >
                          Bỏ chọn
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Side-by-Side Fields (Document vs System DB) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                    {/* Document Submitted */}
                    <div className="rounded-lg border border-[#E2D9C8] dark:border-[#243454] bg-[#FCF9F2] dark:bg-[#0D1629] p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-[0.06em] text-[#0A192F] dark:text-sky-300">
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Hồ Sơ Đệ Trình</span>
                      </div>
                      <div className="space-y-1.5">
                        {activeCase.documentFields.map((field) => {
                          const clueId = field.suspectId ?? field.key;
                          const isFlagged = flaggedIds.includes(clueId);
                          const isCompareSelected = compareDocKey === field.key;
                          const isTrueClue =
                            lastEvaluation !== null &&
                            activeCase.validClueIds.includes(clueId);
                          return (
                            <div
                              key={field.key}
                              className={`rounded-lg border transition-all ${
                                isTrueClue
                                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
                                  : isFlagged
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400/50'
                                    : isCompareSelected
                                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                                      : 'border-[#E5DEC9] dark:border-[#1E2E4A] bg-white dark:bg-[#111C33]'
                              }`}
                            >
                              <button
                                type="button"
                                disabled={lastEvaluation !== null}
                                onClick={() => handleToggleFlag(field)}
                                className={`w-full text-left px-2.5 py-2 ${lastEvaluation === null ? 'cursor-pointer' : 'cursor-default'}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                                    {field.label}
                                  </span>
                                  {isFlagged && (
                                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                                      NGHI VẤN
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-[13px] font-semibold text-[#0F172A] dark:text-white mt-0.5 break-words">
                                  {field.value}
                                </div>
                              </button>
                              {lastEvaluation === null && (
                                <div className="px-2.5 pb-1.5 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCompareDocKey(field.key);
                                      if (compareDbKey) {
                                        handleRunCrossCheck(field.key, compareDbKey);
                                      }
                                    }}
                                    className={`min-h-[36px] text-xs font-mono px-2.5 py-1 rounded border cursor-pointer ${
                                      isCompareSelected
                                        ? 'border-sky-600 bg-sky-600 text-white'
                                        : 'border-[#CBD5E1] dark:border-[#243454] text-[#475569] dark:text-[#94A3B8] hover:border-sky-500'
                                    }`}
                                  >
                                    {isCompareSelected ? '✓ Đang so sánh' : 'Soi chéo'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* System Reference Database */}
                    <div className="rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0B1424] p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-[0.06em] text-[#0369A1] dark:text-cyan-300">
                        <Database className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>CSDL Đối Chiếu Hệ Thống</span>
                      </div>
                      <div className="space-y-1.5">
                        {activeCase.databaseFields.map((field) => {
                          const clueId = field.suspectId ?? field.key;
                          const isFlagged = flaggedIds.includes(clueId);
                          const isCompareSelected = compareDbKey === field.key;
                          const isRedacted =
                            Boolean(forensicIntel?.redactedDbKeys.includes(field.key)) &&
                            !isUvScanned &&
                            lastEvaluation === null;
                          const isTrueClue =
                            lastEvaluation !== null &&
                            activeCase.validClueIds.includes(clueId);
                          return (
                            <div
                              key={field.key}
                              className={`rounded-lg border transition-all ${
                                isTrueClue
                                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40'
                                  : isFlagged
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400/50'
                                    : isCompareSelected
                                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30'
                                      : 'border-[#DCE6F2] dark:border-[#1E2E4A] bg-white dark:bg-[#111C33]'
                              }`}
                            >
                              <button
                                type="button"
                                disabled={lastEvaluation !== null || isRedacted}
                                onClick={() => handleToggleFlag(field)}
                                className={`w-full text-left px-2.5 py-2 ${
                                  lastEvaluation === null && !isRedacted ? 'cursor-pointer' : 'cursor-default'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                                    {field.label}
                                  </span>
                                  {isFlagged && (
                                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                                      NGHI VẤN
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-xs sm:text-[13px] font-semibold mt-0.5 break-words ${
                                    isRedacted
                                      ? 'font-mono text-rose-700 dark:text-rose-400'
                                      : 'text-[#0F172A] dark:text-white'
                                  }`}
                                >
                                  {isRedacted ? '[DỮ LIỆU BỊ MÃ HÓA · DÙNG QUÉT UV ĐỂ MỞ]' : field.value}
                                </div>
                              </button>
                              {lastEvaluation === null && !isRedacted && (
                                <div className="px-2.5 pb-1.5 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCompareDbKey(field.key);
                                      if (compareDocKey) {
                                        handleRunCrossCheck(compareDocKey, field.key);
                                      }
                                    }}
                                    className={`min-h-[36px] text-xs font-mono px-2.5 py-1 rounded border cursor-pointer ${
                                      isCompareSelected
                                        ? 'border-sky-600 bg-sky-600 text-white'
                                        : 'border-[#CBD5E1] dark:border-[#243454] text-[#475569] dark:text-[#94A3B8] hover:border-sky-500'
                                    }`}
                                  >
                                    {isCompareSelected ? '✓ Đang so sánh' : 'Soi chéo'}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Statement / Transcript */}
                  <div className="mt-3 rounded-lg border border-[#E2D9C8] dark:border-[#243454] bg-[#FBF7EE] dark:bg-[#0D1629] p-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#64748B] dark:text-[#94A3B8] mb-1">
                      Lời Khai / Tín Hiệu Ghi Nhận
                    </p>
                    <blockquote className="text-sm text-[#0F172A] dark:text-[#E2E8F0] italic leading-relaxed">
                      “{activeCase.statement}”
                    </blockquote>
                  </div>

                  {/* FORENSIC DEDUCTION WORKBENCH: UV SCAN, CROSS-CHECK, INTERROGATION */}
                  {forensicIntel && (
                    <div className="mt-3 rounded-lg border border-[#CBD5E1] dark:border-[#243454] bg-[#F8FAFC] dark:bg-[#0B1424] p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#0A192F] dark:text-sky-300">
                          <GitCompareArrows className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                          <span>Bàn Điều Tra & Thẩm Vấn Pháp Y</span>
                        </div>
                        <button
                          type="button"
                          data-testid="anomaly-uv-scan-btn"
                          disabled={isUvScanned || progress.investigationTokens <= 0 || lastEvaluation !== null}
                          onClick={handleRunUvScan}
                          className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-700 hover:bg-violet-800 disabled:opacity-45 disabled:cursor-not-allowed text-white font-mono text-xs font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {isUvScanned
                              ? '✓ Đã Quét UV Hồ Sơ Này'
                              : `Quét Đèn UV & Sinh Trắc (-1 Điểm Soi · Còn ${progress.investigationTokens})`}
                          </span>
                        </button>
                      </div>

                      {crossCheckOutput && (
                        <div
                          data-testid="anomaly-crosscheck-result"
                          className={`rounded-lg border p-2.5 text-xs ${
                            crossCheckOutput.hasMismatch
                              ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                              : 'border-sky-300 bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200'
                          }`}
                        >
                          <p className="font-bold">{crossCheckOutput.title}</p>
                          <p className="mt-0.5 leading-relaxed">{crossCheckOutput.detail}</p>
                        </div>
                      )}

                      {isUvScanned && (
                        <div
                          data-testid="anomaly-uv-report"
                          className="rounded-lg border border-violet-300 dark:border-violet-800 bg-violet-50/90 dark:bg-violet-950/30 p-2.5 text-xs space-y-1 text-violet-950 dark:text-violet-100"
                        >
                          <p className="font-bold font-mono text-[11px] uppercase">Kết quả Pháp Y & Đèn UV</p>
                          <p>· {forensicIntel.uvScanFinding}</p>
                          <p>· Sinh trắc: {forensicIntel.biometricSummary}</p>
                          <p>· Phổ mực: {forensicIntel.inkAndSealAudit}</p>
                        </div>
                      )}

                      {/* Cross-Examination Questions */}
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
                          <MessageSquareWarning className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                          <span>Thẩm vấn đương sự (lấy thêm dữ kiện suy luận):</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {forensicIntel.interrogationTurns.map((turn, idx) => {
                            const asked = interrogatedTurnIds.includes(turn.id);
                            return (
                              <div key={turn.id} className="space-y-1">
                                <button
                                  type="button"
                                  data-testid={`anomaly-interrogate-${idx}`}
                                  disabled={asked || lastEvaluation !== null}
                                  onClick={() => handleAskInterrogation(turn.id)}
                                  className={`w-full text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                                    asked
                                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-[#0F172A] dark:text-amber-100'
                                      : 'border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] hover:border-amber-500 text-[#0F172A] dark:text-slate-200 cursor-pointer'
                                  }`}
                                >
                                  <span className="font-semibold block">{turn.question}</span>
                                </button>
                                {asked && (
                                  <div className="rounded-lg border border-amber-300/70 dark:border-amber-800/60 bg-white dark:bg-[#0D1629] p-2 text-[11px] space-y-1">
                                    <p className="italic text-[#0F172A] dark:text-slate-200">{turn.answer}</p>
                                    <p
                                      className={`font-mono font-semibold ${
                                        turn.exposesDeception
                                          ? 'text-rose-700 dark:text-rose-400'
                                          : 'text-emerald-700 dark:text-emerald-400'
                                      }`}
                                    >
                                      → Ghi chú tâm lý: {turn.suspicionCue}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* POST-VERDICT RESOLUTION BANNER */}
                {lastEvaluation && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`rounded-xl border-2 p-4 shadow-sm space-y-2.5 ${
                      lastEvaluation.isCorrect
                        ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-500'
                        : 'border-rose-600 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-500'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {lastEvaluation.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0" />
                        )}
                        <h3 className="font-bold text-sm sm:text-base text-[#0F172A] dark:text-white">
                          {lastEvaluation.feedbackTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs font-bold">
                        <span
                          className={`px-2 py-0.5 rounded border-2 -rotate-2 ${
                            lastEvaluation.chosenVerdict === 'approve'
                              ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300'
                              : lastEvaluation.chosenVerdict === 'reject'
                                ? 'border-amber-700 text-amber-800 dark:text-amber-300'
                                : 'border-rose-700 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {VERDICT_LABELS[lastEvaluation.chosenVerdict].stamp}
                        </span>
                        {lastEvaluation.scoreDelta > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            +{lastEvaluation.scoreDelta}đ
                          </span>
                        )}
                        <span
                          className={
                            lastEvaluation.reputationDelta >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }
                        >
                          {lastEvaluation.reputationDelta >= 0 ? '+' : ''}
                          {lastEvaluation.reputationDelta} Uy tín
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed">
                      {lastEvaluation.feedbackDetail}
                    </p>

                    {(lastEvaluation.matchedCluesCount > 0 || lastEvaluation.ruleCitationBonus > 0) &&
                      lastEvaluation.isCorrect && (
                        <div className="text-xs font-mono text-amber-800 dark:text-amber-300 space-y-0.5">
                          {lastEvaluation.matchedCluesCount > 0 && (
                            <p>
                              ★ Soi trúng {lastEvaluation.matchedCluesCount} dấu hiệu mâu thuẫn: +
                              {lastEvaluation.clueBonus}đ thưởng
                            </p>
                          )}
                          {lastEvaluation.ruleCitationBonus > 0 && (
                            <p>
                              ★ Trích dẫn chuẩn điều luật ({lastEvaluation.matchedRuleCodes.join(', ')}): +
                              {lastEvaluation.ruleCitationBonus}đ thưởng suy luận
                            </p>
                          )}
                        </div>
                      )}

                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAdvanceAfterVerdict}
                        className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0A192F] dark:bg-[#0284C7] hover:opacity-95 text-white font-semibold text-sm cursor-pointer"
                      >
                        <span>
                          {pendingTransition === 'next_case'
                            ? 'Hồ Sơ Tiếp Theo'
                            : pendingTransition === 'day_complete'
                              ? 'Tổng Kết Ca Trực'
                              : 'Xem Kết Quả Chung Cuộc'}
                        </span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Rulebook (Clickable Rule Citation) + Action Stamps + Audit Log */}
              <div className="lg:col-span-5 space-y-3.5">
                {/* Daily Rulebook */}
                <div className="rounded-xl border border-[#D8CEBC] dark:border-[#1E2E4A] bg-white dark:bg-[#111C33] p-3.5 sm:p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E8E0CF] dark:border-[#243454]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#991B1B] dark:text-rose-400" aria-hidden="true" />
                      <h3 className="font-serif font-bold text-base text-[#0A192F] dark:text-white">
                        Sổ Quy Tắc Ngày {activeDay.day}
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                      Bấm điều khoản vi phạm để trích dẫn (+35đ)
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] dark:text-[#CBD5E1] leading-relaxed">
                    {activeDay.briefing}
                  </p>

                  <div className="space-y-2">
                    {activeDay.rules.map((rule) => {
                      const isCited = citedRuleCodes.includes(rule.code);
                      return (
                        <button
                          key={rule.id}
                          type="button"
                          data-testid={`anomaly-rule-${rule.code}`}
                          disabled={lastEvaluation !== null}
                          onClick={() => handleToggleCiteRule(rule.code)}
                          className={`w-full text-left rounded-lg border p-2.5 space-y-1 transition-all ${
                            isCited
                              ? 'ring-2 ring-[#0284C7] border-[#0284C7] bg-sky-50/90 dark:bg-sky-950/50'
                              : rule.severity === 'critical'
                                ? 'border-rose-300 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/30'
                                : rule.severity === 'strict'
                                  ? 'border-amber-300 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/30'
                                  : 'border-[#E2D9C8] dark:border-[#243454] bg-[#FCF9F2] dark:bg-[#0D1629]'
                          } ${lastEvaluation === null ? 'cursor-pointer hover:border-[#0284C7]' : 'cursor-default'}`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-bold">
                            <span className="text-[#0F172A] dark:text-white">{rule.title}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCited && (
                                <span className="font-mono text-[10px] text-[#0284C7] dark:text-sky-300 font-bold">
                                  ✓ TRÍCH DẪN
                                </span>
                              )}
                              <span
                                className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                                  rule.severity === 'critical'
                                    ? 'bg-rose-700 text-white'
                                    : rule.severity === 'strict'
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-[#0A192F] dark:bg-[#1E2E4A] text-white'
                                }`}
                              >
                                {rule.code}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                            {rule.detail}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Stamp Panel */}
                <div className="sticky bottom-2 z-20 lg:static shadow-xl lg:shadow-none rounded-xl border border-[#D8CEBC] dark:border-[#1E2E4A] bg-[#F3ECDC] dark:bg-[#0F172A] p-2.5 sm:p-4 space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-mono text-[#475569] dark:text-[#94A3B8]">
                    <span>BÀN ĐÓNG DẤU PHÁN QUYẾT</span>
                    <span className="hidden sm:inline">Phím 1 · 2 · 3</span>
                  </div>

                  <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      disabled={lastEvaluation !== null || screenState !== 'playing'}
                      onClick={() => handleSubmitVerdict('approve')}
                      className="min-h-[48px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-emerald-700 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center lg:justify-between gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5 sm:gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Duyệt Hồ Sơ</span>
                      </span>
                      <kbd className="hidden sm:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/20">1</kbd>
                    </button>

                    <button
                      type="button"
                      disabled={lastEvaluation !== null || screenState !== 'playing'}
                      onClick={() => handleSubmitVerdict('reject')}
                      className="min-h-[48px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-amber-700 bg-amber-600 hover:bg-amber-700 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center lg:justify-between gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5 sm:gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Từ Chối</span>
                      </span>
                      <kbd className="hidden sm:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/20">2</kbd>
                    </button>

                    <button
                      type="button"
                      disabled={lastEvaluation !== null || screenState !== 'playing'}
                      onClick={() => handleSubmitVerdict('alarm')}
                      className="min-h-[48px] px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-rose-800 bg-rose-700 hover:bg-rose-800 disabled:opacity-45 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center lg:justify-between gap-1.5 sm:gap-2 transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5 sm:gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Báo Động Khẩn</span>
                      </span>
                      <kbd className="hidden sm:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/20">3</kbd>
                    </button>
                  </div>
                </div>

                {/* Shift Audit Log */}
                {auditLog.length > 0 && (
                  <div className="rounded-xl border border-[#D8CEBC] dark:border-[#1E2E4A] bg-white dark:bg-[#111C33] p-3 space-y-2">
                    <p className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#475569] dark:text-[#94A3B8]">
                      Nhật Ký Đóng Dấu Gần Đây ({auditLog.length})
                    </p>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                      {auditLog.map((entry, idx) => (
                        <div
                          key={`${entry.caseCode}-${idx}`}
                          className="flex items-center justify-between gap-2 text-xs py-1 border-b border-dashed border-[#E2D9C8] dark:border-[#1E2E4A] last:border-b-0"
                        >
                          <span className="truncate text-[#0F172A] dark:text-slate-200">
                            <strong className="font-mono text-[11px]">{entry.caseCode}</strong> · {entry.applicantName}
                          </span>
                          <span
                            className={`font-mono text-[11px] font-bold shrink-0 ${
                              entry.isCorrect
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-700 dark:text-rose-400'
                            }`}
                          >
                            {VERDICT_LABELS[entry.verdict].label} {entry.scoreDelta > 0 ? `+${entry.scoreDelta}đ` : '✗'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PAUSED OVERLAY */}
          {screenState === 'paused' && (
            <div className="absolute inset-0 z-20 bg-[#0A192F]/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-[#243454] bg-white dark:bg-[#0F172A] p-6 text-center space-y-4 shadow-2xl">
                <h2 className="font-serif text-xl font-bold text-[#0A192F] dark:text-white">
                  Ca Trực Đang Tạm Dừng
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Ngày {activeDay.day} · Điểm hiện tại: {progress.score}đ · Uy tín: {progress.reputation}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setScreenState('playing')}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-xl bg-[#0A192F] dark:bg-[#0284C7] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Tiếp Tục Ca Trực</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreenState('title')}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#243454] text-sm font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer"
                  >
                    Về Màn Hình Chọn Ngày
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DAY COMPLETE OVERLAY */}
          {screenState === 'day_complete' && (
            <div className="absolute inset-0 z-20 bg-[#0A192F]/85 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-500/40 bg-white dark:bg-[#0F172A] p-6 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                    Hoàn Thành Ca Trực
                  </p>
                  <h2 className="font-serif text-2xl font-bold text-[#0A192F] dark:text-white">
                    Đã Xong {activeDay.shiftTitle}
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F8FAFC] dark:bg-[#111C33] p-3 border border-[#E2E8F0] dark:border-[#1E2E4A] text-xs font-mono tabular-nums">
                  <div>
                    <p className="text-[#64748B]">Tổng Điểm</p>
                    <p className="text-sm font-bold text-[#0284C7] dark:text-sky-400">{progress.score}đ</p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Chính Xác</p>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      {progress.correctCount}/{progress.totalProcessed}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#64748B]">Uy Tín</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {progress.reputation}/{MAX_REPUTATION}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Ngày {activeDay.day + 1} sẽ bổ sung bộ quy tắc và kênh kiểm duyệt mới!
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleContinueNextDay}
                    className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sang Ngày {activeDay.day + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreenState('title')}
                    className="min-h-[46px] px-4 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#243454] text-sm font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer"
                  >
                    Chọn Ngày
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAME OVER / VICTORY SCREEN */}
      {screenState === 'gameover' && (
        <div className="p-6 sm:p-10 text-center max-w-xl mx-auto space-y-5">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              isVictory
                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400'
            }`}
          >
            {isVictory ? <Trophy className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-[#94A3B8]">
              {isVictory ? 'Tốt Nghiệp Tổng Cục Kiểm Duyệt' : 'Đình Chỉ Ca Trực Khẩn Cấp'}
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0A192F] dark:text-white">
              {isVictory
                ? `Hoàn Thành Xuất Sắc Toàn Bộ ${ANOMALY_DAYS.length} Ngày Trực!`
                : 'Uy Tín Về 0 — Mất Quyền Kiểm Duyệt'}
            </h2>
            <p className="text-sm text-[#475569] dark:text-[#CBD5E1]">
              {isVictory
                ? 'Bạn đã vượt qua mọi quy tắc lồng nhau và ngăn chặn thành công các thực thể dị biệt.'
                : 'Sai sót liên tiếp khiến an ninh trạm trực bị xâm nhập. Hãy đọc kỹ Sổ Quy Tắc và thử lại!'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-[#D8CEBC] dark:border-[#1E2E4A] bg-white dark:bg-[#111C33] p-4 font-mono tabular-nums">
            <div>
              <p className="text-[11px] text-[#64748B]">Điểm Ca Này</p>
              <p className="text-base font-bold text-[#0284C7] dark:text-sky-400">{progress.score}đ</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B]">Kỷ Lục</p>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">{progress.bestScore}đ</p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B]">Xử Lý Đúng</p>
              <p className="text-base font-bold text-[#0F172A] dark:text-white">
                {progress.correctCount}/{progress.totalProcessed}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#64748B]">Uy Tín Cuối</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {progress.reputation}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={() => startShift(1)}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại Từ Ngày 1</span>
            </button>
            <button
              type="button"
              onClick={() => setScreenState('title')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#243454] bg-white dark:bg-[#111C33] text-sm font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer"
            >
              Chọn Ngày Khác
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
