import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame,
  Gauge,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
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

type CockpitPhase = 'ready' | 'playing' | 'overdrive' | 'failed';

interface FireworkParticle {
  id: number;
  xPct: number;
  yPct: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
}

const SAVE_BEST_KEY = 'thuanle-fidget-cockpit-best-v1';

const PENTATONIC_HZ = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
const OVERDRIVE_CHORDS = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7
  [293.66, 349.23, 440.0, 523.25], // Dm7
  [329.63, 392.0, 493.88, 587.33], // Em7
  [349.23, 440.0, 523.25, 659.25], // Fmaj7
  [392.0, 493.88, 587.33, 698.46], // G9sus
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
  const [completedTasks, setCompletedTasks] = useState(0);
  const [shieldsLeft, setShieldsLeft] = useState<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.shields);
  const [shieldNotice, setShieldNotice] = useState<string | null>(null);
  const [rushTimeLeft, setRushTimeLeft] = useState<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.rushStartSec);
  const [overdriveLeft, setOverdriveLeft] = useState(0);

  const [hw, setHw] = useState<CockpitHardwareState>(() => createInitialHardwareState());
  const [activeTask, setActiveTask] = useState<ActiveMicroTask>(() => {
    const first = pickNextMicroTask(0, null, 'endless_survival', 'easy');
    return first.task;
  });
  const [taskElapsedSec, setTaskElapsedSec] = useState(0);
  const [hazardCycle, setHazardCycle] = useState<{ warning: boolean; active: boolean }>({
    warning: false,
    active: false,
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

  // Live simulation refs synced for 60Hz loop without stale closures
  const phaseRef = useRef<CockpitPhase>('ready');
  const modeRef = useRef<CockpitMode>('endless_survival');
  const difficultyRef = useRef<CockpitDifficulty>('easy');
  const hwRef = useRef<CockpitHardwareState>(hw);
  const taskRef = useRef<ActiveMicroTask>(activeTask);
  const taskElapsedRef = useRef(0);
  const rushLeftRef = useRef<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.rushStartSec);
  const overdriveLeftRef = useRef(0);
  const shieldsLeftRef = useRef<number>(COCKPIT_DIFFICULTY_CONFIGS.easy.shields);
  const comboRef = useRef(0);
  const completedRef = useRef(0);
  const scoreRef = useRef(0);
  const bestRef = useRef(bestScore);
  const mutedRef = useRef(muted);

  useEffect(() => {
    phaseRef.current = phase;
    document.body.dataset.state = phase;
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
      setHazardCycle({ warning: false, active: false });
    },
    []
  );

  const startImmediateRun = useCallback(
    (overrideMode?: CockpitMode, overrideDifficulty?: CockpitDifficulty) => {
      const activeMode = overrideMode ?? modeRef.current;
      const activeDiff = overrideDifficulty ?? difficultyRef.current;
      const diffCfg = COCKPIT_DIFFICULTY_CONFIGS[activeDiff];

      if (shieldNoticeTimerRef.current !== null) {
        window.clearTimeout(shieldNoticeTimerRef.current);
        shieldNoticeTimerRef.current = null;
      }

      scoreRef.current = 0;
      comboRef.current = 0;
      completedRef.current = 0;
      rushLeftRef.current = diffCfg.rushStartSec;
      overdriveLeftRef.current = 0;
      shieldsLeftRef.current = diffCfg.shields;

      setScore(0);
      setCombo(0);
      setCompletedTasks(0);
      setRushTimeLeft(diffCfg.rushStartSec);
      setOverdriveLeft(0);
      setShieldsLeft(diffCfg.shields);
      setShieldNotice(null);
      setFailReason(null);
      setPhase('playing');
      phaseRef.current = 'playing';

      spawnTaskState(0, null, activeMode, activeDiff);
      playComboSuccessSfx(1);
    },
    [playComboSuccessSfx, spawnTaskState]
  );

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
        setShieldsLeft(diffCfg.shields);
        setRushTimeLeft(diffCfg.rushStartSec);
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
    const nextCompleted = completedRef.current + 1;
    const tier = getSpeedTier(completedRef.current);
    const remainingRatio = Math.max(
      0,
      1 - taskElapsedRef.current / Math.max(0.1, taskRef.current.timeLimitSec)
    );
    const pts = calculateTaskScore(nextCombo, tier, remainingRatio, false, activeDiff);
    const nextScore = scoreRef.current + pts;

    comboRef.current = nextCombo;
    completedRef.current = nextCompleted;
    scoreRef.current = nextScore;

    setCombo(nextCombo);
    setCompletedTasks(nextCompleted);
    setScore(nextScore);

    if (nextScore > bestRef.current) {
      bestRef.current = nextScore;
      setBestScore(nextScore);
      saveBestScore(nextScore);
    }

    if (modeRef.current === 'rush_15s') {
      const cap = Math.max(20, diffCfg.rushStartSec + 4);
      const nextRush = Math.min(cap, rushLeftRef.current + diffCfg.rushBonusSec);
      rushLeftRef.current = nextRush;
      setRushTimeLeft(nextRush);
    }

    spawnFireworksAtModule(taskRef.current.module, 10);

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
      spawnTaskState(nextCompleted, taskRef.current.module, modeRef.current, activeDiff);
    }
  }, [playComboSuccessSfx, playOverdriveChordSfx, spawnFireworksAtModule, spawnTaskState]);

  const handleTaskFailed = useCallback(
    (reason: string) => {
      if (phaseRef.current === 'failed') return;
      failedAtMsRef.current = performance.now();
      phaseRef.current = 'failed';
      setPhase('failed');
      setFailReason(reason);
      setShieldNotice(null);
      playFailBuzzSfx();
    },
    [playFailBuzzSfx]
  );

  const handleShieldAbsorb = useCallback(
    (reason: string) => {
      const nextShields = Math.max(0, shieldsLeftRef.current - 1);
      shieldsLeftRef.current = nextShields;
      setShieldsLeft(nextShields);

      // Reset streak on slip, keep score and keep playing smoothly
      comboRef.current = 0;
      setCombo(0);
      playFailBuzzSfx();

      if (shieldNoticeTimerRef.current !== null) {
        window.clearTimeout(shieldNoticeTimerRef.current);
      }
      setShieldNotice(`${reason} · Dùng 1 Giáp (Còn ${nextShields} Giáp) — Tiếp tục!`);
      shieldNoticeTimerRef.current = window.setTimeout(() => {
        setShieldNotice(null);
        shieldNoticeTimerRef.current = null;
      }, 2200);

      spawnTaskState(completedRef.current, taskRef.current.module, modeRef.current, difficultyRef.current);
    },
    [playFailBuzzSfx, spawnTaskState]
  );

  // Overdrive bonus input reward: every fidget action fires fireworks & polyphonic chord + 2x bonus pts
  const triggerOverdriveStimulus = useCallback(
    (mod: CockpitModuleId) => {
      if (phaseRef.current !== 'overdrive') return;
      const bonus = 100; // 50 base * 2x overdrive multiplier
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

        // Track wave fader dwell time inside target band
        if (curTask.module === 'wave_fader') {
          const target = curTask.goal.targetFader ?? 50;
          const tol = curTask.goal.faderTolerance ?? 12;
          const isMatched = Math.abs(curHw.faderValue - target) <= tol;
          curHw.faderMatchedSec = isMatched ? curHw.faderMatchedSec + dt : 0;
        }

        // Track yellow hold charge (safe vs hazard lightning)
        const tier = getSpeedTier(completedRef.current);
        const haz =
          curTask.module === 'hazard_hold'
            ? stepHazardCycle(nextElapsed, tier, difficultyRef.current)
            : { warning: false, active: false };

        if (curTask.module === 'hazard_hold' && curHw.yellowHolding && !haz.active) {
          curHw.yellowHoldChargeSec += dt;
        }

        // Track 15-Second Rush global clock
        if (modeRef.current === 'rush_15s') {
          const nextRush = Math.max(0, rushLeftRef.current - dt);
          rushLeftRef.current = nextRush;
          if (nextRush <= 0) {
            setRushTimeLeft(0);
            handleTaskFailed('HẾT GIỜ NƯỚC RÚT!');
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
          if (shieldsLeftRef.current > 0) {
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
      // 0 deg at top (12 o'clock), increasing clockwise
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
        // Convenience: if no left port selected, auto-select matching color left port if unplugged or first unplugged
        const colorAtRight = cur.rightPortOrder[rightIdx];
        const matchingLeft = LEFT_PORT_COLORS.indexOf(colorAtRight);
        if (matchingLeft >= 0) {
          const valid = true;
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
          playPatchSnapSfx(valid);
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
  // Keyboard Shortcuts (1/2/3 Switches, Space/B Red, Q/E Dial, A/D Fader, F Hold)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return;
      if (e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();

      if (key === ' ') {
        e.preventDefault();
        if (e.repeat) return;
        if (phaseRef.current === 'ready') {
          startImmediateRun();
          return;
        }
        if (phaseRef.current === 'failed') {
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

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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

  // Global pointer release for rotary dial dragging
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
  const { playerWavePath, targetWavePath, faderMatched } = useMemo(() => {
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
    };
  }, [activeTask.goal.faderTolerance, activeTask.goal.targetFader, hw.faderValue]);

  const maxShields = COCKPIT_DIFFICULTY_CONFIGS[difficulty].shields;
  const activeDifficultyCfg = COCKPIT_DIFFICULTY_CONFIGS[difficulty];

  return (
    <section
      aria-label="Buồng Lái Hỗn Loạn 15 Giây"
      className={`relative overflow-hidden rounded-2xl border transition-colors ${
        phase === 'overdrive'
          ? 'border-amber-400 bg-[#141008] shadow-[0_0_45px_-10px_rgba(251,191,36,0.45)]'
          : phase === 'failed'
            ? 'border-rose-500/80 bg-[#140B10]'
            : 'border-slate-700/90 bg-[#0D131D]'
      } text-slate-100 p-3 sm:p-5`}
    >
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
      <div className="flex flex-col gap-3 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-white">
                Buồng Lái Hỗn Loạn 15 Giây
              </h1>
              <p className="text-xs text-slate-400">
                WarioWare liên hoàn · Bảng mạch cơ khí phản xạ tức thì
              </p>
            </div>

            <div
              role="group"
              aria-label="Chế độ buồng lái"
              className="inline-flex items-center rounded-lg bg-[#080C13] border border-slate-800 p-1"
            >
              <button
                type="button"
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
            </div>
          </div>

          {/* Clean Unboxed Tabular LCD Readouts + Mute/Reset Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-3.5 rounded-xl bg-[#070A10] border border-slate-800 px-3.5 py-2 font-mono tabular-nums text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ĐIỂM</span>
                <span data-testid="fidget-score" className="text-sm sm:text-base font-bold text-white">
                  {score}
                </span>
              </div>
              <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
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
                onClick={() => setMuted((m) => !m)}
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
                <span>{phase === 'ready' ? 'Bắt Đầu [Space]' : 'Đặt Lại (0.1s)'}</span>
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

      {/* COMMAND DISPLAY + 10-COMBO OVERDRIVE METER (ZERO MODAL BLOCKING) */}
      <div className="mt-3 mb-4 space-y-2">
        {phase === 'failed' ? (
          <button
            type="button"
            data-testid="fidget-instant-retry"
            onClick={() => startImmediateRun()}
            className="w-full rounded-xl border border-rose-400/80 bg-rose-950/70 hover:bg-rose-900/80 px-4 py-3 text-left flex flex-wrap items-center justify-between gap-3 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-300 shrink-0" />
              <div>
                <p className="text-sm sm:text-base font-bold text-white">
                  {failReason || 'MẤT NHỊP BUỒNG LÁI!'} · Đạt {score} điểm ({combo} chuỗi)
                </p>
                <p className="text-xs text-rose-200">
                  Bấm [Space] hoặc chạm ngay vào đây để thử lại trong 0,1 giây
                </p>
              </div>
            </div>
            <span className="px-4 py-2 rounded-lg bg-white text-slate-950 font-bold text-xs whitespace-nowrap shrink-0">
              Thử Lại Ngay
            </span>
          </button>
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
                  Bảng mạch sẵn sàng — Bấm thử mọi công tắc bên dưới hoặc nhấn [Space] để vào nhịp!
                </p>
                <p className="text-xs text-slate-300">
                  Hoàn thành chuỗi 10 lệnh liên tiếp để kích hoạt 5 giây Overdrive pháo hoa ×2 điểm.
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
            className="rounded-xl border border-amber-400/70 bg-[#121B2B] px-4 py-2.5 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Zap className="w-5 h-5 text-amber-300 shrink-0" />
                <p className="text-sm sm:text-lg font-bold text-white truncate">
                  {activeTask.title}
                </p>
                <span className="text-xs font-mono font-semibold text-amber-300 shrink-0">
                  · {activeTask.badgeLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
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

            <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
              <div
                className={`h-full transition-transform duration-75 origin-left ${
                  taskRemainSec <= 1.2 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ transform: `scaleX(${taskTimeRatio})` }}
              />
            </div>
          </div>
        )}

        {shieldNotice && phase === 'playing' && (
          <div
            data-testid="fidget-shield-notice"
            role="status"
            className="rounded-lg border border-amber-400/70 bg-amber-950/50 px-3 py-1.5 text-xs font-medium text-amber-200"
          >
            {shieldNotice}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* MODULE 1: 3x TACTILE TOGGLE SWITCHES */}
        <div
          data-testid="module-switches"
          className={`rounded-xl border p-4 bg-[#111824] flex flex-col justify-between gap-3 transition-all ${
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
              const tiltClass =
                st === 'green'
                  ? '-translate-y-2.5 bg-emerald-400 border-emerald-200'
                  : st === 'amber'
                    ? 'translate-y-0 bg-amber-400 border-amber-200'
                    : 'translate-y-2.5 bg-slate-500 border-slate-300';
              const textLabel = st === 'green' ? 'XANH' : st === 'amber' ? 'VÀNG' : 'TẮT';
              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`cockpit-switch-${idx}`}
                  onClick={() => cycleSwitch(idx)}
                  aria-label={`Công tắc ${idx + 1}: ${textLabel}`}
                  className="min-h-[108px] rounded-xl border border-slate-700 bg-[#0A0E16] hover:border-slate-500 p-2 flex flex-col items-center justify-between gap-1.5 cursor-pointer select-none"
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
                  <div className="relative w-10 h-14 rounded-lg bg-[#05070B] border border-slate-800 flex items-center justify-center shadow-inner">
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
                    {textLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODULE 2: BIG RED EMERGENCY SMASH BUTTON */}
        <div
          data-testid="module-red_button"
          className={`rounded-xl border p-4 bg-[#111824] flex flex-col justify-between gap-3 transition-all ${
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

          <div className="flex flex-col items-center justify-center py-2">
            <button
              type="button"
              data-testid="cockpit-red-btn"
              onClick={pressRedButton}
              aria-label="Nút bấm đỏ khẩn cấp"
              className="relative w-28 h-28 rounded-full bg-gradient-to-b from-slate-700 to-slate-900 p-2.5 border-2 border-slate-600 shadow-lg cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-amber-300"
            >
              <div
                className={`w-full h-full rounded-full border-2 border-rose-300/70 bg-gradient-to-b from-rose-400 via-rose-600 to-rose-800 flex items-center justify-center shadow-[0_6px_0_#881337,0_10px_20px_rgba(244,63,94,0.35)] transition-transform duration-75 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  redPressedVisual ? 'translate-y-1.5 scale-95 shadow-[0_1px_0_#881337]' : ''
                }`}
              >
                <span className="font-mono font-bold text-sm text-white tracking-wide">
                  {activeTask.goal.exactClicks && isModuleTargeted('red_button')
                    ? `${hw.redPressCount}/${activeTask.goal.targetClicks}`
                    : 'ĐẬP!'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* MODULE 3: PRECISION ROTARY ENCODER DIAL */}
        <div
          data-testid="module-rotary_dial"
          className={`rounded-xl border p-4 bg-[#111824] flex flex-col justify-between gap-2 transition-all ${
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
                ? ` → ${activeTask.goal.targetDialAngle}°`
                : ''}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              data-testid="cockpit-dial-ccw"
              onClick={() => nudgeDial(-30)}
              aria-label="Xoay trái 30 độ"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-sky-400 text-slate-200 font-mono text-xs font-bold cursor-pointer"
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
              className="w-28 h-28 cursor-grab active:cursor-grabbing touch-none select-none"
            >
              {/* 12 radial detents */}
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

              {/* Target zone marker circle */}
              {isModuleTargeted('rotary_dial') && activeTask.goal.targetDialAngle !== undefined && (
                <circle
                  cx={60 + Math.cos(((activeTask.goal.targetDialAngle - 90) * Math.PI) / 180) * 50}
                  cy={60 + Math.sin(((activeTask.goal.targetDialAngle - 90) * Math.PI) / 180) * 50}
                  r={5.5}
                  fill="#34D399"
                />
              )}

              {/* Rotating aluminum encoder knob */}
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
              className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-sky-400 text-slate-200 font-mono text-xs font-bold cursor-pointer"
            >
              +30°
            </button>
          </div>
        </div>

        {/* MODULE 4: PRECISION WAVE FADER + LIVE OSCILLOSCOPE */}
        <div
          data-testid="module-wave_fader"
          className={`rounded-xl border p-4 bg-[#111824] flex flex-col justify-between gap-3 transition-all ${
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
                ? ` / Mục tiêu ${activeTask.goal.targetFader}%`
                : ''}
            </span>
          </div>

          <div className="rounded-lg border border-slate-800 bg-[#06090F] p-2">
            <svg viewBox="0 0 200 52" className="w-full h-14 overflow-visible" aria-hidden="true">
              <line x1={0} y1={26} x2={200} y2={26} stroke="#1E293B" strokeWidth={1} />
              <path
                d={targetWavePath}
                fill="none"
                stroke="#34D399"
                strokeWidth={2}
                strokeDasharray="5 4"
                opacity={isModuleTargeted('wave_fader') ? 0.9 : 0.3}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFaderValue(hw.faderValue - 10)}
              aria-label="Giảm thanh trượt"
              className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-cyan-400 text-slate-200 font-mono text-xs cursor-pointer"
            >
              -10
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={hw.faderValue}
              data-testid="cockpit-wave-slider"
              aria-label="Thanh trượt đồng bộ sóng"
              onChange={(e) => setFaderValue(Number(e.target.value))}
              className="w-full h-3 accent-cyan-400 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setFaderValue(hw.faderValue + 10)}
              aria-label="Tăng thanh trượt"
              className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-700 bg-[#0A0E16] hover:border-cyan-400 text-slate-200 font-mono text-xs cursor-pointer"
            >
              +10
            </button>
          </div>
        </div>

        {/* MODULE 5: COLOR + SYMBOL CODED PATCH BAY */}
        <div
          data-testid="module-patch_bay"
          className={`rounded-xl border p-4 bg-[#111824] flex flex-col justify-between gap-2.5 transition-all ${
            isModuleTargeted('patch_bay')
              ? 'border-fuchsia-400 ring-2 ring-fuchsia-400/45 bg-[#1C1429]'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200">05. Bảng Cắm Dây [J/K/L]</span>
            <span className="text-xs font-mono font-bold text-fuchsia-300 tabular-nums">
              {hw.patchConnections.filter((c) => LEFT_PORT_COLORS[c.fromIndex] === hw.rightPortOrder[c.toIndex]).length}/
              {isModuleTargeted('patch_bay') ? activeTask.goal.requiredPatchCount ?? 2 : 3} dây
            </span>
          </div>

          <div className="relative grid grid-cols-[auto_1fr_auto] items-center gap-2">
            {/* Left Output Ports */}
            <div className="flex flex-col gap-2 z-10">
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
                    className={`min-h-[38px] px-2.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform ${
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
            <svg viewBox="0 0 100 120" className="w-full h-[126px]" aria-hidden="true">
              {hw.patchConnections.map((conn) => {
                const y1 = 20 + conn.fromIndex * 40;
                const y2 = 20 + conn.toIndex * 40;
                const clr = PATCH_SYMBOL_MAP[LEFT_PORT_COLORS[conn.fromIndex]].hex;
                const valid = LEFT_PORT_COLORS[conn.fromIndex] === hw.rightPortOrder[conn.toIndex];
                return (
                  <path
                    key={`${conn.fromIndex}-${conn.toIndex}`}
                    d={`M 0,${y1} C 42,${y1 + 16} 58,${y2 + 16} 100,${y2}`}
                    fill="none"
                    stroke={valid ? clr : '#EF4444'}
                    strokeWidth={4.5}
                    strokeLinecap="round"
                    strokeDasharray={valid ? undefined : '5 4'}
                  />
                );
              })}
            </svg>

            {/* Right Input Ports (shuffled each task) */}
            <div className="flex flex-col gap-2 z-10">
              {hw.rightPortOrder.map((clr, idx) => {
                const meta = PATCH_SYMBOL_MAP[clr];
                const isPlugged = hw.patchConnections.some((c) => c.toIndex === idx);
                return (
                  <button
                    key={`${clr}-${idx}`}
                    type="button"
                    data-testid={`patch-right-${idx}`}
                    onClick={() => clickRightPatchPort(idx)}
                    aria-label={`Cổng đích phải ${meta.symbol} ${meta.label}`}
                    className="min-h-[38px] px-2.5 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer"
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
          className={`rounded-xl border p-4 bg-[#111824] flex flex-col justify-between gap-3 transition-all ${
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

          <button
            type="button"
            data-testid="cockpit-yellow-hold"
            onPointerDown={() => setYellowHolding(true)}
            onPointerUp={() => setYellowHolding(false)}
            onPointerLeave={() => setYellowHolding(false)}
            onPointerCancel={() => setYellowHolding(false)}
            aria-label="Nút giữ vàng né tia sét"
            className={`relative min-h-[104px] rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-1.5 select-none touch-none cursor-pointer transition-transform ${
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
