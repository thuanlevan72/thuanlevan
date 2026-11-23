import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Flame,
  Gauge,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Timer,
  Unplug,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  calculateTaskScore,
  COCKPIT_DIFFICULTY_CONFIGS,
  COCKPIT_DIFFICULTY_ORDER,
  CockpitDifficulty,
  CockpitHardwareState,
  CockpitMode,
  CockpitModuleId,
  createInitialHardwareState,
  evaluateMicroTask,
  getPilotRank,
  getShortestDialDirection,
  getSpeedMultiplier,
  getSpeedTier,
  isOverdriveTrigger,
  normalizeDialAngle,
  OVERDRIVE_COMBO_STEP,
  OVERDRIVE_DURATION_SEC,
  PATCH_SYMBOL_MAP,
  PatchColor,
  pickNextMicroTask,
  stepHazardCycle,
  SwitchState,
  type ActiveMicroTask,
} from '../utils/fidgetCockpitEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface FidgetCockpitGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type CockpitPhase = 'ready' | 'playing' | 'overdrive' | 'failed' | 'finished';

interface FireworkParticle {
  id: number;
  xPct: number;
  yPct: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
}

interface ModuleStats {
  count: number;
  totalSec: number;
}

type ModuleTelemetryMap = Record<CockpitModuleId, ModuleStats>;

function createEmptyModuleTelemetry(): ModuleTelemetryMap {
  return {
    switches: { count: 0, totalSec: 0 },
    red_button: { count: 0, totalSec: 0 },
    rotary_dial: { count: 0, totalSec: 0 },
    wave_fader: { count: 0, totalSec: 0 },
    patch_bay: { count: 0, totalSec: 0 },
    hazard_hold: { count: 0, totalSec: 0 },
  };
}

const MODULE_SHORT_LABELS: Record<CockpitModuleId, string> = {
  switches: 'Công tắc',
  red_button: 'Nút đỏ',
  rotary_dial: 'Núm xoay',
  wave_fader: 'Sóng',
  patch_bay: 'Cắm dây',
  hazard_hold: 'Giữ vàng',
};

const SAVE_BEST_KEY = 'thuanle-fidget-cockpit-best-v1';

const PENTATONIC_HZ = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
const OVERDRIVE_CHORDS = [
  [261.63, 329.63, 392.0, 493.88],
  [293.66, 349.23, 440.0, 523.25],
  [329.63, 392.0, 493.88, 587.33],
  [349.23, 440.0, 523.25, 659.25],
  [392.0, 493.88, 587.33, 698.46],
];

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = Number(window.localStorage.getItem(SAVE_BEST_KEY) || 0);
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_BEST_KEY, String(Math.round(score)));
  } catch {
    // ignore storage errors
  }
}

const MODULE_ORDER_HOTKEY_TEXT: Record<CockpitModuleId, string> = {
  switches: 'Công tắc gạt · Phím 1 / 2 / 3',
  red_button: 'Nút đập khẩn · Phím Space / B',
  rotary_dial: 'Núm xoay góc · Kéo hoặc Q / E',
  wave_fader: 'Thanh trượt sóng · Kéo hoặc A / D',
  patch_bay: 'Bảng cắm dây · Chọn 2 đầu khớp',
  hazard_hold: 'Giữ né sét · Giữ chuột hoặc F',
};

const LEFT_PORT_COLORS: readonly PatchColor[] = ['gold', 'cyan', 'rose'];

export function FidgetCockpitGameSection({ theme: _theme }: FidgetCockpitGameSectionProps) {
  const [phase, setPhase] = useState<CockpitPhase>('ready');
  const [mode, setMode] = useState<CockpitMode>('endless_survival');
  const [difficulty, setDifficulty] = useState<CockpitDifficulty>('easy');
  const [muted, setMuted] = useState(false);

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => loadBestScore());
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [shieldsLeft, setShieldsLeft] = useState<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.shields);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);
  const [rushTimeLeft, setRushTimeLeft] = useState<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.rushStartSec);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.blitzStartSec);
  const [overdriveLeft, setOverdriveLeft] = useState(0);
  const [moduleTelemetry, setModuleTelemetry] = useState<ModuleTelemetryMap>(() =>
    createEmptyModuleTelemetry()
  );

  const [hw, setHw] = useState<CockpitHardwareState>(() => createInitialHardwareState());
  const [activeTask, setActiveTask] = useState<ActiveMicroTask>(() => {
    const first = pickNextMicroTask(0, null, 'endless_survival', 'easy');
    return first.task;
  });
  const [taskElapsedSec, setTaskElapsedSec] = useState(0);
  const [hazardCycle, setHazardCycle] = useState<{
    warning: boolean;
    active: boolean;
    progressRatio: number;
    phaseLabel: 'safe' | 'warning' | 'active';
  }>({
    warning: false,
    active: false,
    progressRatio: 0,
    phaseLabel: 'safe',
  });
  const [failReason, setFailReason] = useState<string | null>(null);
  const [fireworks, setFireworks] = useState<FireworkParticle[]>([]);
  const [redPressedVisual, setRedPressedVisual] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const dialSvgRef = useRef<SVGSVGElement | null>(null);
  const dialDraggingRef = useRef(false);
  const chordStepRef = useRef(0);
  const particleIdRef = useRef(1);
  const failedAtMsRef = useRef(0);
  const shieldNoticeTimerRef = useRef<number | null>(null);
  const autoStartedRef = useRef(false);

  // Live simulation refs synced for 60Hz loop without stale closures
  const phaseRef = useRef<CockpitPhase>('ready');
  const modeRef = useRef<CockpitMode>('endless_survival');
  const difficultyRef = useRef<CockpitDifficulty>('easy');
  const hwRef = useRef<CockpitHardwareState>(hw);
  const taskRef = useRef<ActiveMicroTask>(activeTask);
  const taskElapsedRef = useRef(0);
  const rushLeftRef = useRef<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.rushStartSec);
  const blitzLeftRef = useRef<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.blitzStartSec);
  const overdriveLeftRef = useRef(0);
  const shieldsLeftRef = useRef<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.shields);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const completedRef = useRef(0);
  const scoreRef = useRef(0);
  const bestRef = useRef(bestScore);
  const mutedRef = useRef(muted);
  const telemetryRef = useRef<ModuleTelemetryMap>(createEmptyModuleTelemetry());

  useEffect(() => {
    phaseRef.current = phase;
    const mappedState =
      phase === 'ready'
        ? 'title'
        : phase === 'failed' || phase === 'finished'
          ? 'gameover'
          : 'playing';
    document.body.dataset.state = mappedState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [phase]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    return () => {
      if (shieldNoticeTimerRef.current !== null) {
        window.clearTimeout(shieldNoticeTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Web Audio API Tactile Synth Engine
  // ---------------------------------------------------------------------------
  const ensureAudio = useCallback((): AudioContext | null => {
    if (mutedRef.current || typeof window === 'undefined') return null;
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtor();
    }
    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSwitchSfx = useCallback(
    (nextState: SwitchState) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const freq = nextState === 'green' ? 760 : nextState === 'amber' ? 520 : 280;
      osc.frequency.setValueAtTime(freq * 1.35, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    },
    [ensureAudio]
  );

  const playRedButtonSfx = useCallback(
    (count: number) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const pitch = 210 + Math.min(12, count) * 32;
      osc.frequency.setValueAtTime(pitch * 1.4, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.075);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    },
    [ensureAudio]
  );

  const playDialDetentSfx = useCallback(
    (angle: number) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const f = 820 + (angle / 30) * 45;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, now + 0.025);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    },
    [ensureAudio]
  );

  const playPatchSnapSfx = useCallback(
    (valid: boolean) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = valid ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(valid ? 440 : 210, now);
      osc.frequency.exponentialRampToValueAtTime(valid ? 980 : 140, now + 0.07);
      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    },
    [ensureAudio]
  );

  const playComboSuccessSfx = useCallback(
    (nextCombo: number) => {
      const ctx = ensureAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const note = PENTATONIC_HZ[(nextCombo - 1) % PENTATONIC_HZ.length];
      [note, note * 1.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const t = now + idx * 0.045;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    },
    [ensureAudio]
  );

  const playCrisisWarningSfx = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    [520, 740].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = now + idx * 0.065;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.045, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.065);
    });
  }, [ensureAudio]);

  const playOverdriveChordSfx = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = OVERDRIVE_CHORDS[chordStepRef.current % OVERDRIVE_CHORDS.length];
    chordStepRef.current += 1;
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
      const t = now + idx * 0.014;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.038, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }, [ensureAudio]);

  const playFailBuzzSfx = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.22);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }, [ensureAudio]);

  const showTransientNotice = useCallback((msg: string) => {
    if (shieldNoticeTimerRef.current !== null) {
      window.clearTimeout(shieldNoticeTimerRef.current);
    }
    setShieldNotice(msg);
    shieldNoticeTimerRef.current = window.setTimeout(() => {
      setShieldNotice(null);
      shieldNoticeTimerRef.current = null;
    }, 2400);
  }, []);

  // ---------------------------------------------------------------------------
  // Fireworks & Tactile Visual Bursts (Zero Screen Shake)
  // ---------------------------------------------------------------------------
  const spawnFireworksAtModule = useCallback((mod: CockpitModuleId, burstCount = 12) => {
    const centerMap: Record<CockpitModuleId, { x: number; y: number }> = {
      switches: { x: 18, y: 26 },
      red_button: { x: 50, y: 26 },
      rotary_dial: { x: 82, y: 26 },
      wave_fader: { x: 18, y: 74 },
      patch_bay: { x: 50, y: 74 },
      hazard_hold: { x: 82, y: 74 },
    };
    const origin = centerMap[mod];
    const palette = ['#FACC15', '#38BDF8', '#FB7185', '#34D399', '#F97316', '#E879F9'];
    const created: FireworkParticle[] = [];
    for (let i = 0; i < burstCount; i++) {
      const ang = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.35;
      const dist = 42 + Math.random() * 88;
      created.push({
        id: particleIdRef.current++,
        xPct: origin.x,
        yPct: origin.y,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist - 18,
        color: palette[i % palette.length],
        size: 5 + Math.random() * 5,
      });
    }
    setFireworks((prev) => [...prev.slice(-40), ...created]);
    window.setTimeout(() => {
      const ids = new Set(created.map((c) => c.id));
      setFireworks((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 700);
  }, []);

  // ---------------------------------------------------------------------------
  // Game State Transitions (0.1s Instant Reset & WarioWare Task Advancement)
  // ---------------------------------------------------------------------------
  const spawnTaskState = useCallback(
    (
      nextCompleted: number,
      prevModule: CockpitModuleId | null,
      targetMode: CockpitMode,
      targetDifficulty: CockpitDifficulty
    ) => {
      const nextPick = pickNextMicroTask(nextCompleted, prevModule, targetMode, targetDifficulty);
      const patchedHw: CockpitHardwareState = {
        ...createInitialHardwareState(),
        ...nextPick.hardwarePatch,
      };
      taskRef.current = nextPick.task;
      taskElapsedRef.current = 0;
      hwRef.current = patchedHw;
      setActiveTask(nextPick.task);
      setTaskElapsedSec(0);
      setHw(patchedHw);
      setHazardCycle({ warning: false, active: false, progressRatio: 0, phaseLabel: 'safe' });
      if (nextPick.task.isCrisis && phaseRef.current === 'playing') {
        playCrisisWarningSfx();
      }
    },
    [playCrisisWarningSfx]
  );

  const startImmediateRun = useCallback(
    (overrideMode?: CockpitMode, overrideDifficulty?: CockpitDifficulty) => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const activeMode = overrideMode ?? modeRef.current;
      const activeDiff = overrideDifficulty ?? difficultyRef.current;
      const diffCfg = COCKPIT_DIFFICULTY_CONFIGS[activeDiff];

      if (shieldNoticeTimerRef.current !== null) {
        window.clearTimeout(shieldNoticeTimerRef.current);
        shieldNoticeTimerRef.current = null;
      }

      const freshTelemetry = createEmptyModuleTelemetry();
      telemetryRef.current = freshTelemetry;
      scoreRef.current = 0;
      comboRef.current = 0;
      maxComboRef.current = 0;
      completedRef.current = 0;
      rushLeftRef.current = diffCfg.rushStartSec;
      blitzLeftRef.current = diffCfg.blitzStartSec;
      overdriveLeftRef.current = 0;
      shieldsLeftRef.current = diffCfg.shields;

      setModuleTelemetry(freshTelemetry);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setCompletedTasks(0);
      setRushTimeLeft(diffCfg.rushStartSec);
      setBlitzTimeLeft(diffCfg.blitzStartSec);
      setOverdriveLeft(0);
      setShieldsLeft(diffCfg.shields);
      setShieldNotice(null);
      setFailReason(null);
      phaseRef.current = 'playing';
      setPhase('playing');

      spawnTaskState(0, null, activeMode, activeDiff);
      ensureAudio();
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          playComboSuccessSfx(1);
        });
      }
    },
    [ensureAudio, playComboSuccessSfx, spawnTaskState]
  );

  // Honor ?autostart=1 if present
  useEffect(() => {
    if (autoStartedRef.current || typeof window === 'undefined') return;
    const auto = new URLSearchParams(window.location.search).get('autostart');
    if (auto === '1') {
      autoStartedRef.current = true;
      startImmediateRun();
    }
  }, [startImmediateRun]);

  const selectDifficulty = useCallback(
    (nextDiff: CockpitDifficulty) => {
      setDifficulty(nextDiff);
      difficultyRef.current = nextDiff;
      if (shieldNoticeTimerRef.current !== null) {
        window.clearTimeout(shieldNoticeTimerRef.current);
        shieldNoticeTimerRef.current = null;
      }
      setShieldNotice(null);

      if (phaseRef.current === 'ready') {
        const diffCfg = COCKPIT_DIFFICULTY_CONFIGS[nextDiff];
        shieldsLeftRef.current = diffCfg.shields;
        rushLeftRef.current = diffCfg.rushStartSec;
        blitzLeftRef.current = diffCfg.blitzStartSec;
        setShieldsLeft(diffCfg.shields);
        setRushTimeLeft(diffCfg.rushStartSec);
        setBlitzTimeLeft(diffCfg.blitzStartSec);
        spawnTaskState(0, null, modeRef.current, nextDiff);
      } else {
        startImmediateRun(modeRef.current, nextDiff);
      }
    },
    [spawnTaskState, startImmediateRun]
  );

  const handleTaskSucceeded = useCallback(() => {
    const activeDiff = difficultyRef.current;
    const diffCfg = COCKPIT_DIFFICULTY_CONFIGS[activeDiff];
    const nextCombo = comboRef.current + 1;
    const nextMaxCombo = Math.max(maxComboRef.current, nextCombo);
    const nextCompleted = completedRef.current + 1;
    const tier = getSpeedTier(completedRef.current);
    const curTask = taskRef.current;
    const elapsed = taskElapsedRef.current;
    const remainingRatio = Math.max(0, 1 - elapsed / Math.max(0.1, curTask.timeLimitSec));
    const pts = calculateTaskScore(nextCombo, tier, remainingRatio, false, activeDiff, Boolean(curTask.isCrisis));
    const nextScore = scoreRef.current + pts;

    // Record per-module reaction telemetry
    const prevModStat = telemetryRef.current[curTask.module];
    const updatedTelemetry: ModuleTelemetryMap = {
      ...telemetryRef.current,
      [curTask.module]: {
        count: prevModStat.count + 1,
        totalSec: prevModStat.totalSec + elapsed,
      },
    };
    telemetryRef.current = updatedTelemetry;
    setModuleTelemetry(updatedTelemetry);

    comboRef.current = nextCombo;
    maxComboRef.current = nextMaxCombo;
    completedRef.current = nextCompleted;
    scoreRef.current = nextScore;

    setCombo(nextCombo);
    setMaxCombo(nextMaxCombo);
    setCompletedTasks(nextCompleted);
    setScore(nextScore);

    if (nextScore > bestRef.current) {
      bestRef.current = nextScore;
      setBestScore(nextScore);
      saveBestScore(nextScore);
    }

    // Crisis bonus: recover 1 lost shield if below max!
    if (curTask.isCrisis && shieldsLeftRef.current < diffCfg.shields) {
      const recovered = shieldsLeftRef.current + 1;
      shieldsLeftRef.current = recovered;
      setShieldsLeft(recovered);
      showTransientNotice(`Vượt Khẩn Cấp ×1.5 điểm & hồi +1 Giáp (${recovered}/${diffCfg.shields})`);
    }

    if (modeRef.current === 'rush_15s') {
      const cap = Math.max(20, diffCfg.rushStartSec + 4);
      const nextRush = Math.min(cap, rushLeftRef.current + diffCfg.rushBonusSec);
      rushLeftRef.current = nextRush;
      setRushTimeLeft(nextRush);
    }

    spawnFireworksAtModule(curTask.module, curTask.isCrisis ? 16 : 10);

    if (isOverdriveTrigger(nextCombo)) {
      overdriveLeftRef.current = OVERDRIVE_DURATION_SEC;
      setOverdriveLeft(OVERDRIVE_DURATION_SEC);
      setPhase('overdrive');
      phaseRef.current = 'overdrive';
      playOverdriveChordSfx();
      spawnFireworksAtModule('red_button', 14);
      spawnFireworksAtModule('rotary_dial', 14);
    } else {
      playComboSuccessSfx(nextCombo);
      spawnTaskState(nextCompleted, curTask.module, modeRef.current, activeDiff);
    }
  }, [playComboSuccessSfx, playOverdriveChordSfx, showTransientNotice, spawnFireworksAtModule, spawnTaskState]);

  const handleTaskFailed = useCallback(
    (reason: string, isFinished60s = false) => {
      if (phaseRef.current === 'failed' || phaseRef.current === 'finished') return;
      failedAtMsRef.current = performance.now();
      const targetPhase: CockpitPhase = isFinished60s ? 'finished' : 'failed';
      phaseRef.current = targetPhase;
      setPhase(targetPhase);
      setFailReason(reason);
      setShieldNotice(null);
      if (isFinished60s) {
        playOverdriveChordSfx();
      } else {
        playFailBuzzSfx();
      }
    },
    [playFailBuzzSfx, playOverdriveChordSfx]
  );

  const handleShieldAbsorb = useCallback(
    (reason: string) => {
      const diffCfg = COCKPIT_DIFFICULTY_CONFIGS[difficultyRef.current];

      // In 60s Blitz mode: mistakes break combo and subtract penalty seconds instead of ending the run
      if (modeRef.current === 'blitz_60s') {
        comboRef.current = 0;
        setCombo(0);
        const nextBlitz = Math.max(0.1, blitzLeftRef.current - diffCfg.blitzPenaltySec);
        blitzLeftRef.current = nextBlitz;
        setBlitzTimeLeft(nextBlitz);
        playFailBuzzSfx();
        showTransientNotice(`${reason} · Trừ ${diffCfg.blitzPenaltySec.toFixed(1)}s đồng hồ 60s!`);
        spawnTaskState(completedRef.current, taskRef.current.module, modeRef.current, difficultyRef.current);
        return;
      }

      const nextShields = Math.max(0, shieldsLeftRef.current - 1);
      shieldsLeftRef.current = nextShields;
      setShieldsLeft(nextShields);

      comboRef.current = 0;
      setCombo(0);
      playFailBuzzSfx();

      showTransientNotice(`${reason} · Dùng 1 Giáp (Còn ${nextShields} Giáp) — Tiếp tục!`);
      spawnTaskState(completedRef.current, taskRef.current.module, modeRef.current, difficultyRef.current);
    },
    [playFailBuzzSfx, showTransientNotice, spawnTaskState]
  );

  // Overdrive bonus input reward: every fidget action fires fireworks & polyphonic chord + 2x bonus pts
  const triggerOverdriveStimulus = useCallback(
    (mod: CockpitModuleId) => {
      if (phaseRef.current !== 'overdrive') return;
      const bonus = 100;
      const nextScore = scoreRef.current + bonus;
      scoreRef.current = nextScore;
      setScore(nextScore);
      if (nextScore > bestRef.current) {
        bestRef.current = nextScore;
        setBestScore(nextScore);
        saveBestScore(nextScore);
      }
      playOverdriveChordSfx();
      spawnFireworksAtModule(mod, 12);
    },
    [playOverdriveChordSfx, spawnFireworksAtModule]
  );

  // ---------------------------------------------------------------------------
  // 60Hz Precision Real-Time Evaluation Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let uiSyncAccum = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const curPhase = phaseRef.current;

      if (curPhase === 'overdrive') {
        const nextOd = Math.max(0, overdriveLeftRef.current - dt);
        overdriveLeftRef.current = nextOd;
        uiSyncAccum += dt;
        if (uiSyncAccum >= 0.04 || nextOd <= 0) {
          uiSyncAccum = 0;
          setOverdriveLeft(nextOd);
        }
        if (nextOd <= 0) {
          phaseRef.current = 'playing';
          setPhase('playing');
          spawnTaskState(
            completedRef.current,
            taskRef.current.module,
            modeRef.current,
            difficultyRef.current
          );
        }
      } else if (curPhase === 'playing') {
        const curTask = taskRef.current;
        const curHw = hwRef.current;
        const nextElapsed = taskElapsedRef.current + dt;
        taskElapsedRef.current = nextElapsed;

        if (curTask.module === 'wave_fader') {
          const target = curTask.goal.targetFader ?? 50;
          const tol = curTask.goal.faderTolerance ?? 12;
          const isMatched = Math.abs(curHw.faderValue - target) <= tol;
          curHw.faderMatchedSec = isMatched ? curHw.faderMatchedSec + dt : 0;
        }

        const tier = getSpeedTier(completedRef.current);
        const haz =
          curTask.module === 'hazard_hold'
            ? stepHazardCycle(nextElapsed, tier, difficultyRef.current)
            : { warning: false, active: false, progressRatio: 0, phaseLabel: 'safe' as const };

        if (curTask.module === 'hazard_hold' && curHw.yellowHolding && !haz.active) {
          curHw.yellowHoldChargeSec += dt;
        }

        if (modeRef.current === 'rush_15s') {
          const nextRush = Math.max(0, rushLeftRef.current - dt);
          rushLeftRef.current = nextRush;
          if (nextRush <= 0) {
            setRushTimeLeft(0);
            handleTaskFailed('HẾT GIỜ NƯỚC RÚT!');
            rafId = window.requestAnimationFrame(tick);
            return;
          }
        } else if (modeRef.current === 'blitz_60s') {
          const nextBlitz = Math.max(0, blitzLeftRef.current - dt);
          blitzLeftRef.current = nextBlitz;
          if (nextBlitz <= 0) {
            setBlitzTimeLeft(0);
            handleTaskFailed('HOÀN THÀNH PHIÊN 60 GIÂY!', true);
            rafId = window.requestAnimationFrame(tick);
            return;
          }
        }

        const evalStatus = evaluateMicroTask(curTask, curHw, nextElapsed, haz.active);
        if (evalStatus === 'success') {
          handleTaskSucceeded();
        } else if (evalStatus === 'failed') {
          const reason =
            curTask.module === 'hazard_hold' && curHw.yellowHolding && haz.active
              ? 'BỊ TIA SÉT GIẬT TRÚNG!'
              : curTask.module === 'red_button' &&
                  curTask.goal.exactClicks &&
                  curHw.redPressCount > (curTask.goal.targetClicks ?? 0)
                ? 'BẤM THỪA SỐ LẦN!'
                : 'HẾT GIỜ PHẢN XẠ!';
          if (shieldsLeftRef.current > 0 || modeRef.current === 'blitz_60s') {
            handleShieldAbsorb(reason);
          } else {
            handleTaskFailed(reason);
          }
        } else {
          uiSyncAccum += dt;
          if (uiSyncAccum >= 0.032) {
            uiSyncAccum = 0;
            setTaskElapsedSec(nextElapsed);
            setHazardCycle(haz);
            if (curTask.module === 'hazard_hold' || curTask.module === 'wave_fader') {
              setHw({ ...curHw });
            }
            if (modeRef.current === 'rush_15s') {
              setRushTimeLeft(rushLeftRef.current);
            } else if (modeRef.current === 'blitz_60s') {
              setBlitzTimeLeft(blitzLeftRef.current);
            }
          }
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [handleShieldAbsorb, handleTaskFailed, handleTaskSucceeded, spawnTaskState]);

  // ---------------------------------------------------------------------------
  // Physical Module Mutators (Work Both During Live Fidget Sandbox & Active Run)
  // ---------------------------------------------------------------------------
  const updateHardware = useCallback((updater: (prev: CockpitHardwareState) => CockpitHardwareState) => {
    const next = updater(hwRef.current);
    hwRef.current = next;
    setHw(next);
  }, []);

  const cycleSwitch = useCallback(
    (index: 0 | 1 | 2) => {
      const order: readonly SwitchState[] = ['off', 'amber', 'green'];
      let nextVal: SwitchState = 'off';
      updateHardware((prev) => {
        const cur = prev.switches[index];
        nextVal = order[(order.indexOf(cur) + 1) % order.length];
        const nextSwitches: [SwitchState, SwitchState, SwitchState] = [...prev.switches];
        nextSwitches[index] = nextVal;
        return { ...prev, switches: nextSwitches };
      });
      playSwitchSfx(nextVal);
      triggerOverdriveStimulus('switches');
    },
    [playSwitchSfx, triggerOverdriveStimulus, updateHardware]
  );

  const pressRedButton = useCallback(() => {
    setRedPressedVisual(true);
    window.setTimeout(() => setRedPressedVisual(false), 110);
    let nextCount = 0;
    updateHardware((prev) => {
      nextCount = prev.redPressCount + 1;
      return { ...prev, redPressCount: nextCount };
    });
    playRedButtonSfx(nextCount);
    if (phaseRef.current === 'overdrive') {
      triggerOverdriveStimulus('red_button');
    }
  }, [playRedButtonSfx, triggerOverdriveStimulus, updateHardware]);

  const setDialToAngle = useCallback(
    (rawDeg: number) => {
      const snapped = normalizeDialAngle(rawDeg);
      if (snapped === hwRef.current.dialAngle) return;
      updateHardware((prev) => ({ ...prev, dialAngle: snapped }));
      playDialDetentSfx(snapped);
      triggerOverdriveStimulus('rotary_dial');
    },
    [playDialDetentSfx, triggerOverdriveStimulus, updateHardware]
  );

  const nudgeDial = useCallback(
    (deltaDeg: number) => {
      setDialToAngle(hwRef.current.dialAngle + deltaDeg);
    },
    [setDialToAngle]
  );

  const handleDialPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialSvgRef.current) return;
      const rect = dialSvgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rad = Math.atan2(clientX - cx, -(clientY - cy));
      const deg = (rad * 180) / Math.PI;
      setDialToAngle(deg);
    },
    [setDialToAngle]
  );

  const setFaderValue = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      const prevMatched =
        Math.abs(hwRef.current.faderValue - (taskRef.current.goal.targetFader ?? 50)) <=
        (taskRef.current.goal.faderTolerance ?? 9);
      updateHardware((prev) => ({ ...prev, faderValue: clamped }));
      const nowMatched =
        Math.abs(clamped - (taskRef.current.goal.targetFader ?? 50)) <=
        (taskRef.current.goal.faderTolerance ?? 9);
      if (!prevMatched && nowMatched) {
        playSwitchSfx('green');
      }
      if (Math.abs(clamped - hwRef.current.faderValue) >= 8 || phaseRef.current === 'overdrive') {
        triggerOverdriveStimulus('wave_fader');
      }
    },
    [playSwitchSfx, triggerOverdriveStimulus, updateHardware]
  );

  const clickLeftPatchPort = useCallback(
    (leftIdx: number) => {
      updateHardware((prev) => ({
        ...prev,
        selectedLeftPort: prev.selectedLeftPort === leftIdx ? null : leftIdx,
      }));
      playDialDetentSfx(leftIdx * 90);
      triggerOverdriveStimulus('patch_bay');
    },
    [playDialDetentSfx, triggerOverdriveStimulus, updateHardware]
  );

  const clickRightPatchPort = useCallback(
    (rightIdx: number) => {
      const cur = hwRef.current;
      const selectedLeft = cur.selectedLeftPort;
      if (selectedLeft === null) {
        const colorAtRight = cur.rightPortOrder[rightIdx];
        const matchingLeft = LEFT_PORT_COLORS.indexOf(colorAtRight);
        if (matchingLeft >= 0) {
          updateHardware((prev) => {
            const filtered = prev.patchConnections.filter(
              (c) => c.fromIndex !== matchingLeft && c.toIndex !== rightIdx
            );
            return {
              ...prev,
              patchConnections: [...filtered, { fromIndex: matchingLeft, toIndex: rightIdx }],
              selectedLeftPort: null,
            };
          });
          playPatchSnapSfx(true);
          triggerOverdriveStimulus('patch_bay');
        }
        return;
      }

      const valid = LEFT_PORT_COLORS[selectedLeft] === cur.rightPortOrder[rightIdx];
      updateHardware((prev) => {
        const filtered = prev.patchConnections.filter(
          (c) => c.fromIndex !== selectedLeft && c.toIndex !== rightIdx
        );
        return {
          ...prev,
          patchConnections: [...filtered, { fromIndex: selectedLeft, toIndex: rightIdx }],
          selectedLeftPort: null,
        };
      });
      playPatchSnapSfx(valid);
      triggerOverdriveStimulus('patch_bay');
    },
    [playPatchSnapSfx, triggerOverdriveStimulus, updateHardware]
  );

  const clearPatchConnections = useCallback(() => {
    updateHardware((prev) => ({
      ...prev,
      patchConnections: [],
      selectedLeftPort: null,
    }));
    playSwitchSfx('off');
  }, [playSwitchSfx, updateHardware]);

  const setYellowHolding = useCallback(
    (holding: boolean) => {
      if (hwRef.current.yellowHolding === holding) return;
      updateHardware((prev) => ({ ...prev, yellowHolding: holding }));
      if (holding) {
        playSwitchSfx('amber');
        triggerOverdriveStimulus('hazard_hold');
      }
    },
    [playSwitchSfx, triggerOverdriveStimulus, updateHardware]
  );

  // ---------------------------------------------------------------------------
  // Keyboard Shortcuts + Focus Loss Hygiene
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return;
      if (e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      if (key === 'enter' && (phaseRef.current === 'ready' || phaseRef.current === 'failed' || phaseRef.current === 'finished')) {
        e.preventDefault();
        startImmediateRun();
        return;
      }

      if (key === ' ') {
        e.preventDefault();
        if (e.repeat) return;
        if (phaseRef.current === 'ready') {
          startImmediateRun();
          return;
        }
        if (phaseRef.current === 'failed' || phaseRef.current === 'finished') {
          if (performance.now() - failedAtMsRef.current > 180) {
            startImmediateRun();
          }
          return;
        }
        pressRedButton();
        return;
      }

      if (e.repeat && key !== 'a' && key !== 'd' && key !== 'q' && key !== 'e') return;

      if (key === '1') cycleSwitch(0);
      else if (key === '2') cycleSwitch(1);
      else if (key === '3') cycleSwitch(2);
      else if (key === 'b') pressRedButton();
      else if (key === 'q') nudgeDial(-30);
      else if (key === 'e') nudgeDial(30);
      else if (key === 'a') setFaderValue(hwRef.current.faderValue - 10);
      else if (key === 'd') setFaderValue(hwRef.current.faderValue + 10);
      else if (key === 'f') setYellowHolding(true);
      else if (key === 'j') clickLeftPatchPort(0);
      else if (key === 'k') clickLeftPatchPort(1);
      else if (key === 'l') clickLeftPatchPort(2);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        setYellowHolding(false);
      }
    };

    const clearHeld = () => {
      setYellowHolding(false);
      dialDraggingRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
    };
  }, [
    clickLeftPatchPort,
    cycleSwitch,
    nudgeDial,
    pressRedButton,
    setFaderValue,
    setYellowHolding,
    startImmediateRun,
  ]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (dialDraggingRef.current) {
        handleDialPointerMove(e.clientX, e.clientY);
      }
    };
    const onPointerUp = () => {
      dialDraggingRef.current = false;
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [handleDialPointerMove]);

  // Derived HUD indicators
  const speedTier = getSpeedTier(completedTasks);
  const speedMult = getSpeedMultiplier(speedTier);
  const comboInCycle = combo % OVERDRIVE_COMBO_STEP;
  const overdriveProgressCount =
    phase === 'overdrive' ? OVERDRIVE_COMBO_STEP : combo > 0 && comboInCycle === 0 ? OVERDRIVE_COMBO_STEP : comboInCycle;

  const taskTimeRatio =
    phase === 'playing'
      ? Math.max(0, 1 - taskElapsedSec / Math.max(0.1, activeTask.timeLimitSec))
      : phase === 'overdrive'
        ? Math.max(0, overdriveLeft / OVERDRIVE_DURATION_SEC)
        : 1;

  const taskRemainSec =
    phase === 'playing'
      ? Math.max(0, activeTask.timeLimitSec - taskElapsedSec)
      : phase === 'overdrive'
        ? overdriveLeft
        : activeTask.timeLimitSec;

  const isModuleTargeted = (mod: CockpitModuleId) =>
    phase === 'playing' && activeTask.module === mod;

  // Dual-trace SVG waveform paths for Module 4 (Wave Fader)
  const { playerWavePath, targetWavePath, faderMatched, faderTargetVal, faderTol } = useMemo(() => {
    const buildSine = (ampVal: number) => {
      const amp = 4 + (ampVal / 100) * 19;
      const pts: string[] = [];
      for (let x = 0; x <= 200; x += 8) {
        const y = 26 + Math.sin((x / 200) * Math.PI * 4) * amp;
        pts.push(`${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    };
    const targetVal = activeTask.goal.targetFader ?? 68;
    const tol = activeTask.goal.faderTolerance ?? 9;
    return {
      playerWavePath: buildSine(hw.faderValue),
      targetWavePath: buildSine(targetVal),
      faderMatched: Math.abs(hw.faderValue - targetVal) <= tol,
      faderTargetVal: targetVal,
      faderTol: tol,
    };
  }, [activeTask.goal.faderTolerance, activeTask.goal.targetFader, hw.faderValue]);

  const maxShields = COCKPIT_DIFFICULTY_CONFIGS[difficulty].shields;
  const activeDifficultyCfg = COCKPIT_DIFFICULTY_CONFIGS[difficulty];

  const dialDirection =
    isModuleTargeted('rotary_dial') && activeTask.goal.targetDialAngle !== undefined
      ? getShortestDialDirection(hw.dialAngle, activeTask.goal.targetDialAngle)
      : null;

  const validPatchCount = hw.patchConnections.filter(
    (c) => LEFT_PORT_COLORS[c.fromIndex] === hw.rightPortOrder[c.toIndex]
  ).length;
  const wrongPatchCount = hw.patchConnections.length - validPatchCount;

  const pilotRankInfo = useMemo(() => getPilotRank(score, completedTasks), [completedTasks, score]);

  const avgReactionMs = useMemo(() => {
    const vals = Object.values(moduleTelemetry);
    const totalCount = vals.reduce((sum, v) => sum + v.count, 0);
    const totalSec = vals.reduce((sum, v) => sum + v.totalSec, 0);
    return totalCount > 0 ? Math.round((totalSec / totalCount) * 1000) : 0;
  }, [moduleTelemetry]);

  const selectedLeftColor: PatchColor | null =
    hw.selectedLeftPort !== null ? LEFT_PORT_COLORS[hw.selectedLeftPort] : null;

  return (
    <section
      aria-label="Buồng Lái Hỗn Loạn 15 Giây"
      className={`relative overflow-hidden rounded-2xl border transition-colors ${
        phase === 'overdrive'
          ? 'border-amber-400 bg-[#141008] shadow-[0_0_45px_-10px_rgba(251,191,36,0.45)]'
          : phase === 'failed'
            ? 'border-rose-500/80 bg-[#140B10]'
            : phase === 'finished'
              ? 'border-emerald-400/80 bg-[#0A1614]'
              : 'border-slate-700/90 bg-[#0D131D]'
      } text-slate-100 p-4 sm:p-5 mobile-ls:p-2`}
    >
      {/* Subtle Anodized Corner Bolts */}
      <svg aria-hidden="true" className="pointer-events-none absolute top-2.5 left-2.5 w-3 h-3 text-slate-700" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="currentColor" />
        <line x1="3" y1="6" x2="9" y2="6" stroke="#0B1018" strokeWidth="1.4" />
      </svg>
      <svg aria-hidden="true" className="pointer-events-none absolute top-2.5 right-2.5 w-3 h-3 text-slate-700" viewBox="0 0 12 12">
        <circle cx="6" cy="6" r="5" fill="currentColor" />
        <line x1="6" y1="3" x2="6" y2="9" stroke="#0B1018" strokeWidth="1.4" />
      </svg>

      {/* OVERDRIVE & COMPLETION FIREWORKS LAYER */}
      {fireworks.length > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
        >
          {fireworks.map((p) => (
            <span
              key={p.id}
              className="animate-dom-shard absolute rounded-full"
              style={
                {
                  left: `${p.xPct}%`,
                  top: `${p.yPct}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 10px ${p.color}`,
                  '--dx': `${p.dx}px`,
                  '--dy': `${p.dy}px`,
                  '--rot': '180deg',
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* TOP ANODIZED HARDWARE BEZEL: Mode & Difficulty Switch + LCD Telemetry + Mute/Reset */}
      <div className="flex flex-col gap-3 mobile-ls:gap-1.5 pb-3 mobile-ls:pb-1.5 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mobile-ls:gap-1.5">
          <div className="flex flex-wrap items-center gap-3 mobile-ls:gap-2">
            <div>
              <h1 className="font-sans text-lg sm:text-xl mobile-ls:text-sm font-bold tracking-tight text-white">
                Buồng Lái Hỗn Loạn 15 Giây
              </h1>
              <p className="text-xs text-slate-400 mobile-ls:hidden">
                15 phản xạ cơ khí · Sự cố Khẩn Cấp ×1.5 điểm · Overdrive pháo hoa
              </p>
            </div>

            <div
              role="group"
              aria-label="Chế độ buồng lái"
              className="inline-flex flex-wrap items-center rounded-lg bg-[#080C13] border border-slate-800 p-1 gap-0.5"
            >
              <button
                type="button"
                data-testid="fidget-mode-endless"
                onClick={() => {
                  setMode('endless_survival');
                  if (phase !== 'ready') startImmediateRun('endless_survival');
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  mode === 'endless_survival'
                    ? 'bg-sky-500 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Liên Hoàn
              </button>
              <button
                type="button"
                data-testid="fidget-mode-rush"
                onClick={() => {
                  setMode('rush_15s');
                  if (phase !== 'ready') startImmediateRun('rush_15s');
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  mode === 'rush_15s'
                    ? 'bg-amber-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Nước Rút {activeDifficultyCfg.rushStartSec.toFixed(0)}s
              </button>
              <button
                type="button"
                data-testid="fidget-mode-blitz"
                onClick={() => {
                  setMode('blitz_60s');
                  if (phase !== 'ready') startImmediateRun('blitz_60s');
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  mode === 'blitz_60s'
                    ? 'bg-emerald-400 text-slate-950 font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Đua 60s
              </button>
            </div>
          </div>

          {/* Clean Tabular LCD Readouts + Mute/Reset Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mobile-ls:gap-2">
            <div className="flex flex-wrap items-center gap-3 mobile-ls:gap-2 rounded-xl bg-[#070A10] border border-slate-800 px-3.5 py-2 mobile-ls:px-2 mobile-ls:py-1 font-mono tabular-nums text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ĐIỂM</span>
                <span data-testid="fidget-score" className="text-sm sm:text-base font-bold text-white">
                  {score}
                </span>
              </div>
              <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
              {mode === 'blitz_60s' ? (
                <div>
                  <span className="text-slate-400 block text-[10px]">ĐỒNG HỒ</span>
                  <span
                    data-testid="fidget-blitz-clock"
                    className={`text-sm sm:text-base font-bold ${
                      blitzTimeLeft <= 10 ? 'text-rose-400' : 'text-emerald-300'
                    }`}
                  >
                    {blitzTimeLeft.toFixed(1)}s
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-slate-400 block text-[10px]">GIÁP</span>
                  <span
                    data-testid="fidget-shields"
                    className={`text-sm sm:text-base font-bold ${
                      shieldsLeft > 1
                        ? 'text-emerald-300'
                        : shieldsLeft === 1
                          ? 'text-amber-300'
                          : 'text-rose-400'
                    }`}
                  >
                    {shieldsLeft}/{maxShields}
                  </span>
                </div>
              )}
              <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
              <div>
                <span className="text-slate-400 block text-[10px]">CHUỖI</span>
                <span data-testid="fidget-combo" className="text-sm sm:text-base font-bold text-amber-300">
                  {combo}
                </span>
              </div>
              <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
              <div>
                <span className="text-slate-400 block text-[10px]">TỐC ĐỘ</span>
                <span className="text-sm sm:text-base font-bold text-sky-300">
                  ×{speedMult.toFixed(2)}
                </span>
              </div>
              {mode === 'rush_15s' && (
                <>
                  <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">NƯỚC RÚT</span>
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        rushTimeLeft <= 4 ? 'text-rose-400' : 'text-emerald-300'
                      }`}
                    >
                      {rushTimeLeft.toFixed(1)}s
                    </span>
                  </div>
                </>
              )}
              <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
              <div>
                <span className="text-slate-400 block text-[10px]">KỶ LỤC</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400">{bestScore}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setMuted((m) => !m);
                }}
                aria-label={muted ? 'Bật âm thanh cơ khí' : 'Tắt âm thanh cơ khí'}
                className="min-h-[40px] min-w-[40px] px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 text-slate-200 inline-flex items-center justify-center cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-300" />}
              </button>
              <button
                type="button"
                data-testid="fidget-reset-btn"
                onClick={() => startImmediateRun()}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {phase === 'ready' ? <Play className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                <span>{phase === 'ready' ? 'Bắt Đầu [Space]' : 'Đặt Lại'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4-TIER DIFFICULTY SELECTOR BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div
            role="group"
            aria-label="Cấp độ thử thách"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-[#080C13] border border-slate-800 p-1"
          >
            {COCKPIT_DIFFICULTY_ORDER.map((diffKey) => {
              const cfg = COCKPIT_DIFFICULTY_CONFIGS[diffKey];
              const active = difficulty === diffKey;
              const activeStyle =
                diffKey === 'easy'
                  ? 'bg-emerald-400 text-slate-950 font-semibold'
                  : diffKey === 'normal'
                    ? 'bg-sky-400 text-slate-950 font-semibold'
                    : diffKey === 'hard'
                      ? 'bg-orange-400 text-slate-950 font-semibold'
                      : 'bg-rose-500 text-white font-semibold';
              return (
                <button
                  key={diffKey}
                  type="button"
                  data-testid={`fidget-diff-${diffKey}`}
                  aria-pressed={active}
                  onClick={() => selectDifficulty(diffKey)}
                  className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active ? activeStyle : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-300 font-mono" data-testid="fidget-diff-desc">
            {activeDifficultyCfg.description}
          </p>
        </div>
      </div>

      {/* COMMAND DISPLAY + PILOT DEBRIEF + OVERDRIVE CAPACITOR */}
      <div className="mt-3 mb-4 mobile-ls:mt-1.5 mobile-ls:mb-2 space-y-2.5 mobile-ls:space-y-1.5">
        {phase === 'failed' || phase === 'finished' ? (
          <div
            data-testid="fidget-debrief-card"
            className={`rounded-xl border p-4 space-y-3 ${
              phase === 'finished'
                ? 'border-emerald-400/80 bg-emerald-950/45'
                : 'border-rose-400/80 bg-rose-950/60'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-mono font-bold shrink-0"
                  style={{ borderColor: pilotRankInfo.colorHex, color: pilotRankInfo.colorHex }}
                >
                  <span className="text-[10px] text-slate-400 leading-none">HẠNG</span>
                  <span className="text-xl leading-tight">{pilotRankInfo.rank}</span>
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    {phase === 'finished' ? (
                      <Award className="w-5 h-5 text-emerald-300 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />
                    )}
                    <span>{failReason || 'MẤT NHỊP BUỒNG LÁI!'}</span>
                  </p>
                  <p className="text-xs text-slate-200 font-mono tabular-nums">
                    {pilotRankInfo.title} · {score} điểm · {completedTasks} lệnh · Chuỗi max {maxCombo}
                    {avgReactionMs > 0 ? ` · TB ${avgReactionMs}ms/lệnh` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="fidget-instant-retry"
                data-start="true"
                onClick={() => startImmediateRun()}
                className="min-h-[42px] px-5 py-2 rounded-lg bg-white hover:bg-amber-200 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
              >
                Chơi Lại Ngay [Space]
              </button>
            </div>

            {completedTasks > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-white/10">
                {(Object.keys(MODULE_SHORT_LABELS) as CockpitModuleId[]).map((modId) => {
                  const stat = moduleTelemetry[modId];
                  const avgMs = stat.count > 0 ? Math.round((stat.totalSec / stat.count) * 1000) : null;
                  return (
                    <div key={modId} className="rounded-lg bg-black/30 px-2.5 py-1.5 font-mono tabular-nums">
                      <span className="block text-[10px] text-slate-400 truncate">
                        {MODULE_SHORT_LABELS[modId]}
                      </span>
                      <span className="text-xs font-bold text-slate-100">
                        {avgMs !== null ? `${avgMs}ms` : '—'}
                        {stat.count > 0 ? ` (${stat.count})` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : phase === 'overdrive' ? (
          <div
            data-testid="fidget-overdrive-banner"
            className="rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-500/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
              <div>
                <p className="text-sm sm:text-base font-bold text-amber-200">
                  CHẾ ĐỘ XẢ STRESS OVERDRIVE · NHÂN ĐÔI ×2 ĐIỂM!
                </p>
                <p className="text-xs text-amber-100/90">
                  Click, gạt công tắc hoặc gõ phím liên hoàn để bắn pháo hoa & tích điểm cực đại!
                </p>
              </div>
            </div>
            <span className="font-mono tabular-nums text-lg font-bold text-amber-200">
              {overdriveLeft.toFixed(1)}s
            </span>
          </div>
        ) : phase === 'ready' ? (
          <div className="rounded-xl border border-slate-700 bg-[#121A28] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-sky-300 shrink-0" />
              <div>
                <p className="text-sm sm:text-base font-bold text-white">
                  Buồng lái sẵn sàng — Thử tự do 6 cụm phím cơ khí bên dưới hoặc nhấn Chơi Ngay!
                </p>
                <p className="text-xs text-slate-300">
                  Chuỗi 5 lệnh kích hoạt Khẩn Cấp (×1.5 điểm + hồi 1 Giáp) · Chuỗi 10 lệnh mở Overdrive pháo hoa!
                </p>
              </div>
            </div>
            <button
              type="button"
              data-start="true"
              onClick={() => startImmediateRun()}
              className="min-h-[42px] px-5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              Chơi Ngay [Space]
            </button>
          </div>
        ) : (
          <div
            data-testid="fidget-active-command"
            className={`sticky top-1 z-20 mobile-ls:static md:static shadow-lg md:shadow-none rounded-xl border px-3 sm:px-4 mobile-ls:px-2.5 py-2 sm:py-2.5 mobile-ls:py-1.5 space-y-1.5 sm:space-y-2 mobile-ls:space-y-1 ${
              activeTask.isCrisis
                ? 'border-rose-400 bg-[#24111B]'
                : 'border-amber-400/70 bg-[#121B2B]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
                {activeTask.isCrisis ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-300 shrink-0 mt-0.5 sm:mt-0" />
                )}
                <p className="text-sm sm:text-lg font-bold text-white line-clamp-2 sm:truncate">
                  {activeTask.title}
                </p>
                <span
                  className={`text-xs font-mono font-semibold shrink-0 ${
                    activeTask.isCrisis ? 'text-rose-300' : 'text-amber-300'
                  }`}
                >
                  · {activeTask.badgeLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono tabular-nums text-xs shrink-0">
                <span className="text-slate-300 hidden sm:inline">
                  {MODULE_ORDER_HOTKEY_TEXT[activeTask.module]}
                </span>
                <span
                  className={`text-sm sm:text-base font-bold ${
                    taskRemainSec <= 1.2 ? 'text-rose-400' : 'text-amber-300'
                  }`}
                >
                  {taskRemainSec.toFixed(1)}s
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
              <div className="w-full sm:flex-1 h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className={`h-full transition-transform duration-75 origin-left ${
                    taskRemainSec <= 1.2
                      ? 'bg-rose-500'
                      : activeTask.isCrisis
                        ? 'bg-orange-400'
                        : 'bg-amber-400'
                  }`}
                  style={{ transform: `scaleX(${taskTimeRatio})` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-300 leading-snug sm:shrink-0">
                {activeTask.hint}
              </span>
            </div>
          </div>
        )}

        {shieldNotice && phase === 'playing' && (
          <div
            data-testid="fidget-shield-notice"
            role="status"
            className="rounded-lg border border-amber-400/70 bg-amber-950/50 px-3 py-1.5 text-xs font-medium text-amber-200 flex items-center gap-2"
          >
            <Timer className="w-3.5 h-3.5 shrink-0" />
            <span>{shieldNotice}</span>
          </div>
        )}

        {/* 10-Step Overdrive Capacitor Bar */}
        <div className="flex items-center justify-between gap-3 text-xs text-slate-400 font-mono tabular-nums">
          <span>Tụ Overdrive ({overdriveProgressCount}/{OVERDRIVE_COMBO_STEP})</span>
          <div className="flex-1 grid grid-cols-10 gap-1" aria-label={`Tiến độ Overdrive ${overdriveProgressCount} trên 10`}>
            {Array.from({ length: OVERDRIVE_COMBO_STEP }).map((_, idx) => {
              const filled = idx < overdriveProgressCount;
              return (
                <div
                  key={idx}
                  className={`h-2 rounded-sm transition-colors ${
                    phase === 'overdrive'
                      ? 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.7)]'
                      : filled
                        ? 'bg-emerald-400'
                        : 'bg-slate-800'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 6-MODULE ELECTROMECHANICAL COCKPIT GRID (2x3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 mobile-ls:grid-cols-3 lg:grid-cols-3 gap-2.5 sm:gap-3.5 mobile-ls:gap-2">
        {/* MODULE 1: 3x TACTILE TOGGLE SWITCHES */}
        <div
          data-testid="module-switches"
          className={`rounded-xl border p-3 sm:p-4 mobile-ls:p-2 bg-[#111824] flex flex-col justify-between gap-3 mobile-ls:gap-1.5 transition-all ${
            isModuleTargeted('switches')
              ? 'border-emerald-400 ring-2 ring-emerald-400/40 bg-[#13202B]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">01. Công Tắc Gạt [1-2-3]</span>
            {isModuleTargeted('switches') && activeTask.goal.targetSwitches && (
              <span className="text-xs font-mono font-bold text-emerald-300 tabular-nums">
                Mẫu:{' '}
                {activeTask.goal.targetSwitches
                  .map((s) => (s === 'green' ? 'X' : s === 'amber' ? 'V' : '0'))
                  .join('·')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5 my-auto">
            {([0, 1, 2] as const).map((idx) => {
              const st = hw.switches[idx];
              const targetSt = isModuleTargeted('switches')
                ? activeTask.goal.targetSwitches?.[idx]
                : undefined;
              const isMatched = targetSt !== undefined && st === targetSt;
              const tiltClass =
                st === 'green'
                  ? '-translate-y-2.5 bg-emerald-400 border-emerald-200'
                  : st === 'amber'
                    ? 'translate-y-0 bg-amber-400 border-amber-200'
                    : 'translate-y-2.5 bg-slate-500 border-slate-300';
              const textLabel = st === 'green' ? 'XANH' : st === 'amber' ? 'VÀNG' : 'TẮT';
              const targetShort =
                targetSt === 'green' ? '→ XANH' : targetSt === 'amber' ? '→ VÀNG' : '→ TẮT';
              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`cockpit-switch-${idx}`}
                  onClick={() => cycleSwitch(idx)}
                  aria-label={`Công tắc ${idx + 1}: ${textLabel}`}
                  className={`min-h-[112px] mobile-ls:min-h-[70px] rounded-xl border p-2 mobile-ls:p-1.5 flex flex-col items-center justify-between gap-1 cursor-pointer select-none transition-colors ${
                    isMatched
                      ? 'border-emerald-400 bg-emerald-950/35'
                      : 'border-slate-700 bg-[#0A0E16] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-slate-400">SW-{idx + 1}</span>
                    <span
                      aria-hidden="true"
                      className={`w-2 h-2 rounded-full ${
                        st === 'green'
                          ? 'bg-emerald-400 shadow-[0_0_6px_#34D399]'
                          : st === 'amber'
                            ? 'bg-amber-400 shadow-[0_0_6px_#FBBF24]'
                            : 'bg-slate-700'
                      }`}
                    />
                  </div>
                  <div className="relative w-10 h-14 mobile-ls:h-8 rounded-lg bg-[#05070B] border border-slate-800 flex items-center justify-center shadow-inner">
                    <div
                      className={`w-7 h-5 rounded border shadow-md transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${tiltClass}`}
                    />
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      st === 'green'
                        ? 'text-emerald-300'
                        : st === 'amber'
                          ? 'text-amber-300'
                          : 'text-slate-400'
                    }`}
                  >
                    {targetSt !== undefined && !isMatched ? targetShort : textLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODULE 2: BIG RED EMERGENCY SMASH BUTTON */}
        <div
          data-testid="module-red_button"
          className={`rounded-xl border p-3 sm:p-4 mobile-ls:p-2 bg-[#111824] flex flex-col justify-between gap-3 mobile-ls:gap-1.5 transition-all ${
            isModuleTargeted('red_button')
              ? 'border-rose-400 ring-2 ring-rose-400/45 bg-[#1F131B]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">02. Nút Đập Khẩn [Space / B]</span>
            <span className="text-xs font-mono font-bold text-rose-300 tabular-nums">
              {isModuleTargeted('red_button')
                ? `${hw.redPressCount} / ${activeTask.goal.targetClicks ?? 0}${
                    activeTask.goal.exactClicks ? ' (ĐÚNG SỐ)' : ''
                  }`
                : `${hw.redPressCount} lần`}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-2 mobile-ls:py-0.5">
            <button
              type="button"
              data-testid="cockpit-red-btn"
              onClick={pressRedButton}
              aria-label="Nút bấm đỏ khẩn cấp"
              className={`relative w-28 h-28 mobile-ls:w-20 mobile-ls:h-20 rounded-full p-2.5 mobile-ls:p-1.5 border-2 shadow-lg cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-amber-300 ${
                activeTask.goal.exactClicks &&
                isModuleTargeted('red_button') &&
                hw.redPressCount === activeTask.goal.targetClicks
                  ? 'bg-emerald-950 border-emerald-400'
                  : 'bg-gradient-to-b from-slate-700 to-slate-900 border-amber-400/60'
              }`}
            >
              <div
                className={`w-full h-full rounded-full border-2 border-rose-300/70 bg-gradient-to-b from-rose-400 via-rose-600 to-rose-800 flex flex-col items-center justify-center shadow-[0_6px_0_#881337,0_10px_20px_rgba(244,63,94,0.35)] transition-transform duration-75 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  redPressedVisual ? 'translate-y-1.5 scale-95 shadow-[0_1px_0_#881337]' : ''
                }`}
              >
                <span className="font-mono font-bold text-sm text-white tracking-wide">
                  {activeTask.goal.exactClicks && isModuleTargeted('red_button')
                    ? hw.redPressCount === activeTask.goal.targetClicks
                      ? 'DỪNG!'
                      : `${hw.redPressCount}/${activeTask.goal.targetClicks}`
                    : 'ĐẬP!'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* MODULE 3: PRECISION ROTARY ENCODER DIAL */}
        <div
          data-testid="module-rotary_dial"
          className={`rounded-xl border p-3 sm:p-4 mobile-ls:p-2 bg-[#111824] flex flex-col justify-between gap-2 mobile-ls:gap-1.5 transition-all ${
            isModuleTargeted('rotary_dial')
              ? 'border-sky-400 ring-2 ring-sky-400/45 bg-[#101D2D]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">03. Núm Xoay [Q / E]</span>
            <span className="text-xs font-mono font-bold text-sky-300 tabular-nums">
              {hw.dialAngle}°
              {isModuleTargeted('rotary_dial') && activeTask.goal.targetDialAngle !== undefined
                ? ` → ${activeTask.goal.targetDialAngle}° (${
                    dialDirection === 'cw' ? 'Phải ↻' : dialDirection === 'ccw' ? 'Trái ↺' : 'Chuẩn!'
                  })`
                : ''}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 mobile-ls:gap-1.5">
            <button
              type="button"
              data-testid="cockpit-dial-ccw"
              onClick={() => nudgeDial(-30)}
              aria-label="Xoay trái 30 độ"
              className="min-h-[44px] min-w-[44px] mobile-ls:min-h-[36px] mobile-ls:min-w-[36px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-sky-400 text-slate-200 font-mono text-xs font-bold cursor-pointer"
            >
              -30°
            </button>

            <svg
              ref={dialSvgRef}
              viewBox="0 0 120 120"
              role="slider"
              aria-label="Núm xoay tần số"
              aria-valuemin={0}
              aria-valuemax={330}
              aria-valuenow={hw.dialAngle}
              onPointerDown={(e) => {
                dialDraggingRef.current = true;
                handleDialPointerMove(e.clientX, e.clientY);
              }}
              onWheel={(e) => {
                e.preventDefault();
                nudgeDial(e.deltaY > 0 ? 30 : -30);
              }}
              className="w-28 h-28 mobile-ls:w-20 mobile-ls:h-20 cursor-grab active:cursor-grabbing touch-none select-none"
            >
              {Array.from({ length: 12 }).map((_, idx) => {
                const ang = idx * 30;
                const rad = ((ang - 90) * Math.PI) / 180;
                const x1 = 60 + Math.cos(rad) * 46;
                const y1 = 60 + Math.sin(rad) * 46;
                const x2 = 60 + Math.cos(rad) * 54;
                const y2 = 60 + Math.sin(rad) * 54;
                const isTarget =
                  isModuleTargeted('rotary_dial') && activeTask.goal.targetDialAngle === ang;
                return (
                  <line
                    key={idx}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isTarget ? '#34D399' : '#475569'}
                    strokeWidth={isTarget ? 4 : 2}
                    strokeLinecap="round"
                  />
                );
              })}

              {isModuleTargeted('rotary_dial') && activeTask.goal.targetDialAngle !== undefined && (
                <circle
                  cx={60 + Math.cos(((activeTask.goal.targetDialAngle - 90) * Math.PI) / 180) * 50}
                  cy={60 + Math.sin(((activeTask.goal.targetDialAngle - 90) * Math.PI) / 180) * 50}
                  r={6}
                  fill="#34D399"
                />
              )}

              <g
                style={{
                  transform: `rotate(${hw.dialAngle}deg)`,
                  transformOrigin: '60px 60px',
                  transition: 'transform 110ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <circle cx={60} cy={60} r={37} fill="#1E293B" stroke="#64748B" strokeWidth={2.5} />
                <circle cx={60} cy={60} r={28} fill="#0F172A" stroke="#334155" strokeWidth={1.5} />
                <rect x={57.5} y={25} width={5} height={17} rx={2.5} fill="#38BDF8" />
              </g>
            </svg>

            <button
              type="button"
              data-testid="cockpit-dial-cw"
              onClick={() => nudgeDial(30)}
              aria-label="Xoay phải 30 độ"
              className="min-h-[44px] min-w-[44px] mobile-ls:min-h-[36px] mobile-ls:min-w-[36px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-sky-400 text-slate-200 font-mono text-xs font-bold cursor-pointer"
            >
              +30°
            </button>
          </div>
        </div>

        {/* MODULE 4: PRECISION WAVE FADER + LIVE OSCILLOSCOPE */}
        <div
          data-testid="module-wave_fader"
          className={`rounded-xl border p-3 sm:p-4 mobile-ls:p-2 bg-[#111824] flex flex-col justify-between gap-3 mobile-ls:gap-1.5 transition-all ${
            isModuleTargeted('wave_fader')
              ? 'border-cyan-400 ring-2 ring-cyan-400/45 bg-[#0F202C]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">04. Thanh Trượt Sóng [A / D]</span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                faderMatched && isModuleTargeted('wave_fader') ? 'text-emerald-300' : 'text-cyan-300'
              }`}
            >
              {hw.faderValue}%
              {isModuleTargeted('wave_fader') && activeTask.goal.targetFader !== undefined
                ? ` → ${activeTask.goal.targetFader}% (±${faderTol})`
                : ''}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#06090F] p-2 mobile-ls:p-1">
            <svg viewBox="0 0 200 52" className="w-full h-14 mobile-ls:h-9 overflow-visible" aria-hidden="true">
              <line x1={50} y1={4} x2={50} y2={48} stroke="#131C2B" strokeWidth={1} />
              <line x1={100} y1={4} x2={100} y2={48} stroke="#131C2B" strokeWidth={1} />
              <line x1={150} y1={4} x2={150} y2={48} stroke="#131C2B" strokeWidth={1} />
              <line x1={0} y1={26} x2={200} y2={26} stroke="#1E293B" strokeWidth={1} />
              <path
                d={targetWavePath}
                fill="none"
                stroke="#34D399"
                strokeWidth={2}
                strokeDasharray="5 4"
                opacity={isModuleTargeted('wave_fader') ? 0.92 : 0.3}
              />
              <path
                d={playerWavePath}
                fill="none"
                stroke={faderMatched ? '#34D399' : '#38BDF8'}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative flex items-center gap-2 mobile-ls:gap-1">
            <button
              type="button"
              onClick={() => setFaderValue(hw.faderValue - 10)}
              aria-label="Giảm thanh trượt"
              className="min-h-[44px] min-w-[44px] mobile-ls:min-h-[36px] mobile-ls:min-w-[36px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-cyan-400 text-slate-200 font-mono text-xs cursor-pointer"
            >
              -10
            </button>
            <div className="relative flex-1 flex items-center">
              {isModuleTargeted('wave_fader') && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 h-3 rounded bg-emerald-400/25 border border-emerald-400/60"
                  style={{
                    left: `${Math.max(0, faderTargetVal - faderTol)}%`,
                    width: `${Math.min(100, faderTargetVal + faderTol) - Math.max(0, faderTargetVal - faderTol)}%`,
                  }}
                />
              )}
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={hw.faderValue}
                data-testid="cockpit-wave-slider"
                aria-label="Thanh trượt đồng bộ sóng"
                onChange={(e) => setFaderValue(Number(e.target.value))}
                className="relative z-10 w-full h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() => setFaderValue(hw.faderValue + 10)}
              aria-label="Tăng thanh trượt"
              className="min-h-[44px] min-w-[44px] mobile-ls:min-h-[36px] mobile-ls:min-w-[36px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-cyan-400 text-slate-200 font-mono text-xs cursor-pointer"
            >
              +10
            </button>
          </div>
        </div>

        {/* MODULE 5: COLOR + SYMBOL CODED PATCH BAY */}
        <div
          data-testid="module-patch_bay"
          className={`rounded-xl border p-3 sm:p-4 mobile-ls:p-2 bg-[#111824] flex flex-col justify-between gap-2.5 mobile-ls:gap-1.5 transition-all ${
            isModuleTargeted('patch_bay')
              ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/45 bg-[#1C1429]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">05. Bảng Cắm Dây [J/K/L]</span>
            <div className="flex items-center gap-2">
              {hw.patchConnections.length > 0 && (
                <button
                  type="button"
                  data-testid="patch-clear-btn"
                  onClick={clearPatchConnections}
                  title="Rút toàn bộ dây"
                  aria-label="Rút toàn bộ dây"
                  className="min-h-[34px] px-2.5 py-1 rounded border border-slate-700 bg-[#0A0E16] hover:border-rose-400 text-[11px] font-mono text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Unplug className="w-3 h-3" />
                  <span>{wrongPatchCount > 0 ? 'Rút dây nhiễu' : 'Rút'}</span>
                </button>
              )}
              <span className="text-xs font-mono font-bold text-fuchsia-300 tabular-nums">
                {validPatchCount}/
                {isModuleTargeted('patch_bay') ? activeTask.goal.requiredPatchCount ?? 2 : 3} dây
              </span>
            </div>
          </div>

          <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-2">
            {/* Left Output Ports */}
            <div className="flex flex-col gap-2 mobile-ls:gap-1 z-10">
              {LEFT_PORT_COLORS.map((clr, idx) => {
                const meta = PATCH_SYMBOL_MAP[clr];
                const isSelected = hw.selectedLeftPort === idx;
                const isPlugged = hw.patchConnections.some((c) => c.fromIndex === idx);
                return (
                  <button
                    key={clr}
                    type="button"
                    data-testid={`patch-left-${idx}`}
                    onClick={() => clickLeftPatchPort(idx)}
                    aria-label={`Cổng nguồn trái ${meta.symbol} ${meta.label}`}
                    className={`min-h-[42px] mobile-ls:min-h-[30px] px-2.5 mobile-ls:px-1.5 rounded-lg border font-mono text-xs mobile-ls:text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-transform ${
                      isSelected ? 'scale-105 ring-2 ring-white' : ''
                    }`}
                    style={{
                      borderColor: meta.hex,
                      backgroundColor: isPlugged ? `${meta.hex}33` : '#0A0E16',
                      color: '#F8FAFC',
                    }}
                  >
                    <span style={{ color: meta.hex }}>{meta.symbol}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SVG Braided Patch Cables */}
            <svg viewBox="0 0 100 120" className="w-full h-[126px] mobile-ls:h-[96px]" aria-hidden="true">
              {hw.patchConnections.map((conn) => {
                const y1 = 20 + conn.fromIndex * 40;
                const y2 = 20 + conn.toIndex * 40;
                const clr = PATCH_SYMBOL_MAP[LEFT_PORT_COLORS[conn.fromIndex]].hex;
                const valid = LEFT_PORT_COLORS[conn.fromIndex] === hw.rightPortOrder[conn.toIndex];
                return (
                  <g key={`${conn.fromIndex}-${conn.toIndex}`}>
                    <path
                      d={`M 0,${y1} C 42,${y1 + 16} 58,${y2 + 16} 100,${y2}`}
                      fill="none"
                      stroke={valid ? clr : '#EF4444'}
                      strokeWidth={4.5}
                      strokeLinecap="round"
                      strokeDasharray={valid ? undefined : '5 4'}
                    />
                    <circle cx={4} cy={y1} r={3.5} fill={valid ? clr : '#EF4444'} />
                    <circle cx={96} cy={y2} r={3.5} fill={valid ? clr : '#EF4444'} />
                  </g>
                );
              })}
            </svg>

            {/* Right Input Ports (shuffled each task) */}
            <div className="flex flex-col gap-2 mobile-ls:gap-1 z-10">
              {hw.rightPortOrder.map((clr, idx) => {
                const meta = PATCH_SYMBOL_MAP[clr];
                const isPlugged = hw.patchConnections.some((c) => c.toIndex === idx);
                const matchesSelected = selectedLeftColor === clr;
                return (
                  <button
                    key={`${clr}-${idx}`}
                    type="button"
                    data-testid={`patch-right-${idx}`}
                    onClick={() => clickRightPatchPort(idx)}
                    aria-label={`Cổng đích phải ${meta.symbol} ${meta.label}`}
                    className={`min-h-[42px] mobile-ls:min-h-[30px] px-2.5 mobile-ls:px-1.5 rounded-lg border font-mono text-xs mobile-ls:text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-transform ${
                      matchesSelected ? 'scale-105 ring-2 ring-white' : ''
                    }`}
                    style={{
                      borderColor: meta.hex,
                      backgroundColor: isPlugged ? `${meta.hex}33` : '#0A0E16',
                      color: '#F8FAFC',
                    }}
                  >
                    <span style={{ color: meta.hex }}>{meta.symbol}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODULE 6: YELLOW HOLD PAD + SWEEPING LIGHTNING HAZARD */}
        <div
          data-testid="module-hazard_hold"
          className={`rounded-xl border p-3 sm:p-4 mobile-ls:p-2 bg-[#111824] flex flex-col justify-between gap-2.5 mobile-ls:gap-1.5 transition-all ${
            hazardCycle.active
              ? 'border-rose-500 ring-2 ring-rose-500/70 bg-[#271019]'
              : isModuleTargeted('hazard_hold')
                ? 'border-amber-400 ring-2 ring-amber-400/50 bg-[#1E1A0E]'
                : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">06. Giữ Nút Vàng [F]</span>
            <span
              className={`text-xs font-mono font-bold tabular-nums ${
                hazardCycle.active
                  ? 'text-rose-300'
                  : hazardCycle.warning
                    ? 'text-amber-300'
                    : 'text-emerald-300'
              }`}
            >
              {hazardCycle.active
                ? 'SÉT ĐÁNH — NHẢ!'
                : hazardCycle.warning
                  ? 'SẮP SÉT!'
                  : `${Math.min(
                      100,
                      Math.round(
                        (hw.yellowHoldChargeSec / (activeTask.goal.targetHoldSec ?? activeDifficultyCfg.holdSec)) * 100
                      )
                    )}%`}
            </span>
          </div>

          {/* Live Hazard Sweep Indicator Bar (An Toàn -> Cảnh Báo -> Tia Sét) */}
          <div className="relative h-2 w-full rounded-full bg-slate-900 overflow-hidden" aria-hidden="true">
            <div className="absolute inset-y-0 left-0 w-[44%] bg-emerald-500/25" />
            <div className="absolute inset-y-0 left-[44%] w-[24%] bg-amber-400/35" />
            <div className="absolute inset-y-0 left-[68%] right-0 bg-rose-500/45" />
            <div
              className="absolute inset-y-0 w-1.5 bg-white shadow-[0_0_6px_#fff]"
              style={{ left: `calc(${Math.round(hazardCycle.progressRatio * 100)}% - 3px)` }}
            />
          </div>

          <button
            type="button"
            data-testid="cockpit-yellow-hold"
            onPointerDown={() => setYellowHolding(true)}
            onPointerUp={() => setYellowHolding(false)}
            onPointerLeave={() => setYellowHolding(false)}
            onPointerCancel={() => setYellowHolding(false)}
            aria-label="Nút giữ vàng né tia sét"
            className={`relative min-h-[96px] mobile-ls:min-h-[64px] rounded-xl border-2 p-3 mobile-ls:p-2 flex flex-col items-center justify-center gap-1.5 select-none touch-none cursor-pointer transition-transform ${
              hazardCycle.active
                ? 'border-rose-400 bg-rose-950/70 text-rose-100'
                : hw.yellowHolding
                  ? 'border-amber-200 bg-amber-400 text-slate-950 translate-y-1'
                  : 'border-amber-400/70 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200'
            }`}
          >
            {hazardCycle.active ? (
              <>
                <Zap className="w-7 h-7 text-rose-300" />
                <span className="font-mono text-xs font-bold">NGUY HIỂM! THẢ TAY NGAY!</span>
              </>
            ) : (
              <>
                <Flame className={`w-6 h-6 ${hw.yellowHolding ? 'text-slate-950' : 'text-amber-300'}`} />
                <span className="font-mono text-xs font-bold">
                  {hw.yellowHolding ? 'ĐANG NẠP TỤ...' : 'NHẤN GIỮ ĐỂ NẠP'}
                </span>
              </>
            )}

            <div className="w-full h-2 rounded-full bg-black/35 overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-75 ${
                  hw.yellowHolding ? 'bg-slate-950' : 'bg-amber-300'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (hw.yellowHoldChargeSec / (activeTask.goal.targetHoldSec ?? activeDifficultyCfg.holdSec)) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
