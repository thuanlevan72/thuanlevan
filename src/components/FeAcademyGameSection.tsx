import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bug,
  CheckCircle2,
  Compass,
  Cpu,
  Crosshair,
  Flame,
  Heart,
  HelpCircle,
  Layers,
  LayoutGrid,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Volume2,
  VolumeX,
  Workflow,
} from 'lucide-react';
import {
  calcSelectorSpecificity,
  calculateMissionScore,
  COMPONENT_TREE_NODES,
  DOM_SNIPER_MISSIONS,
  evaluateEventLoopDispatch,
  evaluateLayoutCoordinates,
  evaluateSniperShot,
  EVENT_LOOP_LEVELS,
  FE_STATIONS,
  FeAssistMode,
  FeStationId,
  getFeRank,
  isBugExposedAtWidth,
  LAYOUT_HEIST_LEVELS,
  parseLayoutCssInput,
  RESPONSIVE_BUG_LEVELS,
  simulateTreePulse,
  TREE_DEFENSE_LEVELS,
  TREE_DEFENSE_SHIELDS,
  TreeDefenseShieldId,
  type LayoutCoord,
} from '../utils/feAcademyEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface FeAcademyGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type AcademyPhase = 'ready' | 'playing' | 'gameover';

const SAVE_BEST_XP_KEY = 'thuanle-fe-academy-best-xp-v1';

function loadBestXp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = Number(window.localStorage.getItem(SAVE_BEST_XP_KEY) || 0);
    return Number.isFinite(val) && val > 0 ? val : 0;
  } catch {
    return 0;
  }
}

function saveBestXp(xp: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_BEST_XP_KEY, String(Math.round(xp)));
  } catch {
    // ignore storage errors
  }
}

export function FeAcademyGameSection({ theme: _theme }: FeAcademyGameSectionProps) {
  const [phase, setPhase] = useState<AcademyPhase>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1') {
      return 'playing';
    }
    return 'ready';
  });
  const [assistMode, setAssistMode] = useState<FeAssistMode>('visual_guide');
  const [activeStation, setActiveStation] = useState<FeStationId>('dom_sniper');
  const [levelIdx, setLevelIdx] = useState<number>(0);

  const [xp, setXp] = useState<number>(0);
  const [bestXp, setBestXp] = useState<number>(() => loadBestXp());
  const [lives, setLives] = useState<number>(3);
  const [streak, setStreak] = useState<number>(0);
  const [clearedKeys, setClearedKeys] = useState<string[]>([]);
  const [muted, setMuted] = useState<boolean>(false);
  const [showBeginnerGuide, setShowBeginnerGuide] = useState<boolean>(true);

  const [missionElapsedSec, setMissionElapsedSec] = useState<number>(0);
  const [missionBanner, setMissionBanner] = useState<{
    tone: 'neutral' | 'success' | 'error';
    text: string;
    takeaway?: string;
  } | null>(null);
  const [stageCleared, setStageCleared] = useState<boolean>(false);

  // Station 1: DOM Sniper state
  const [sniperInput, setSniperInput] = useState<string>('');
  const [sniperDestroyedIds, setSniperDestroyedIds] = useState<string[]>([]);
  const sniperArenaRef = useRef<HTMLDivElement | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Station 2: Layout Heist state
  const [heistCssInput, setHeistCssInput] = useState<string>('');
  const [appliedHeistStyles, setAppliedHeistStyles] = useState<Record<string, string>>({});
  const [heistMatchedSlotsCount, setHeistMatchedSlotsCount] = useState<number>(0);
  const heistFloorRef = useRef<HTMLDivElement | null>(null);
  const heistContainerRef = useRef<HTMLDivElement | null>(null);

  // Station 3: Event Loop state
  const [dispatchedTaskIds, setDispatchedTaskIds] = useState<string[]>([]);
  const [mainThreadBlockedPct, setMainThreadBlockedPct] = useState<number>(12);
  const [loopHintText, setLoopHintText] = useState<string | null>(null);

  // Station 4: DevTools Detective state
  const [previewWidthPx, setPreviewWidthPx] = useState<number>(RESPONSIVE_BUG_LEVELS[0].initialWidthPx);
  const [inspectMode, setInspectMode] = useState<boolean>(true);
  const [inspectedStyles, setInspectedStyles] = useState<string>(
    RESPONSIVE_BUG_LEVELS[0].inspectorTargetLabel
  );
  const [bugSpotted, setBugSpotted] = useState<boolean>(false);
  const [appliedBugPatchId, setAppliedBugPatchId] = useState<string | null>(null);
  const miniPreviewRef = useRef<HTMLDivElement | null>(null);

  // Station 5: Component Tree Defense state (uses progressive TREE_DEFENSE_LEVELS[levelIdx])
  const activeTreeLevel = TREE_DEFENSE_LEVELS[levelIdx] ?? TREE_DEFENSE_LEVELS[0];
  const [treeBudget, setTreeBudget] = useState<number>(TREE_DEFENSE_LEVELS[0].budget);
  const [activeShields, setActiveShields] = useState<TreeDefenseShieldId[]>([]);
  const [renderCounts, setRenderCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(COMPONENT_TREE_NODES.map((n) => [n.id, 1]))
  );
  const [flashingNodeIds, setFlashingNodeIds] = useState<string[]>([]);
  const [treeFps, setTreeFps] = useState<number>(60);
  const [cpuHeat, setCpuHeat] = useState<number>(36);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stressActive, setStressActive] = useState<boolean>(false);
  const [stressLeftSec, setStressLeftSec] = useState<number>(TREE_DEFENSE_LEVELS[0].waveSeconds);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    document.body.dataset.state = phase;
    return () => {
      delete document.body.dataset.state;
    };
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Web Audio Synth Feedback
  // ---------------------------------------------------------------------------
  const playTone = useCallback((freq: number, dur = 0.09, type: OscillatorType = 'triangle', gainVal = 0.08) => {
    if (mutedRef.current || typeof window === 'undefined') return;
    const AudioCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtor();
    if (audioCtxRef.current.state === 'suspended') void audioCtxRef.current.resume();
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(70, freq * 0.65), now + dur);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }, []);

  const playWinFanfare = useCallback(() => {
    [523.25, 659.25, 783.99].forEach((f, idx) => {
      window.setTimeout(() => playTone(f, 0.14, 'triangle', 0.08), idx * 65);
    });
  }, [playTone]);

  // ---------------------------------------------------------------------------
  // Reset per-station / level local workspace
  // ---------------------------------------------------------------------------
  const resetStationWorkspace = useCallback(
    (station: FeStationId, idx: number) => {
      setStageCleared(false);
      setMissionBanner(null);
      setMissionElapsedSec(0);

      if (station === 'dom_sniper') {
        setSniperInput('');
        setSniperDestroyedIds([]);
        const cvs = laserCanvasRef.current;
        if (cvs) {
          const ctx = cvs.getContext('2d');
          ctx?.clearRect(0, 0, cvs.width, cvs.height);
        }
      } else if (station === 'layout_heist') {
        setHeistCssInput('');
        setAppliedHeistStyles({});
        setHeistMatchedSlotsCount(0);
      } else if (station === 'event_loop') {
        setDispatchedTaskIds([]);
        setMainThreadBlockedPct(12);
        setLoopHintText(null);
      } else if (station === 'devtools_detective') {
        const lvl = RESPONSIVE_BUG_LEVELS[idx] ?? RESPONSIVE_BUG_LEVELS[0];
        setPreviewWidthPx(lvl.initialWidthPx);
        setInspectMode(true);
        setInspectedStyles(lvl.inspectorTargetLabel);
        setBugSpotted(false);
        setAppliedBugPatchId(null);
      } else if (station === 'tree_defense') {
        const treeLvl = TREE_DEFENSE_LEVELS[idx] ?? TREE_DEFENSE_LEVELS[0];
        setTreeBudget(treeLvl.budget);
        setActiveShields([]);
        setRenderCounts(Object.fromEntries(COMPONENT_TREE_NODES.map((n) => [n.id, 1])));
        setFlashingNodeIds([]);
        setTreeFps(60);
        setCpuHeat(36);
        setSearchQuery('');
        setStressActive(false);
        setStressLeftSec(treeLvl.waveSeconds);
      }
    },
    []
  );

  const selectMission = useCallback(
    (station: FeStationId, idx: number) => {
      setActiveStation(station);
      setLevelIdx(idx);
      resetStationWorkspace(station, idx);
      if (phase === 'ready') setPhase('playing');
    },
    [phase, resetStationWorkspace]
  );

  const startFreshRun = useCallback(() => {
    setXp(0);
    setLives(3);
    setStreak(0);
    setClearedKeys([]);
    setActiveStation('dom_sniper');
    setLevelIdx(0);
    resetStationWorkspace('dom_sniper', 0);
    setPhase('playing');
    playTone(587.33, 0.11);
  }, [playTone, resetStationWorkspace]);

  const grantMissionClear = useCallback(
    (baseXp: number, timeLimit: number, takeaway: string) => {
      if (stageCleared) return;
      const ratio = Math.max(0.1, 1 - missionElapsedSec / Math.max(1, timeLimit));
      const earned = calculateMissionScore(baseXp, streak, ratio, true, assistMode);
      const nextXp = xp + earned;
      const key = `${activeStation}:${levelIdx}`;
      setXp(nextXp);
      if (nextXp > bestXp) {
        setBestXp(nextXp);
        saveBestXp(nextXp);
      }
      setStreak((s) => s + 1);
      setClearedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
      setStageCleared(true);
      setMissionBanner({
        tone: 'success',
        text: `Hoàn thành trạm! +${earned} XP${assistMode === 'pro_challenge' ? ' (Pro ×1.5)' : ''}`,
        takeaway,
      });
      playWinFanfare();
    },
    [activeStation, assistMode, bestXp, levelIdx, missionElapsedSec, playWinFanfare, stageCleared, streak, xp]
  );

  const applyMistake = useCallback(
    (reason: string) => {
      playTone(140, 0.22, 'sawtooth', 0.09);
      setStreak(0);
      setLives((prev) => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) {
          setPhase('gameover');
        }
        return next;
      });
      setMissionBanner({
        tone: 'error',
        text: reason,
      });
    },
    [playTone]
  );

  const goToNextMission = useCallback(() => {
    if (levelIdx < 2) {
      selectMission(activeStation, levelIdx + 1);
      return;
    }
    const stationIdx = FE_STATIONS.findIndex((s) => s.id === activeStation);
    if (stationIdx >= 0 && stationIdx < FE_STATIONS.length - 1) {
      selectMission(FE_STATIONS[stationIdx + 1].id, 0);
      return;
    }
    setPhase('gameover');
  }, [activeStation, levelIdx, selectMission]);

  // Keyboard Space/Enter start shortcut in ready/gameover
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((phase === 'ready' || phase === 'gameover') && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        startFreshRun();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, startFreshRun]);

  // Mission elapsed ticker + Event Loop Main Thread drift
  useEffect(() => {
    if (phase !== 'playing' || stageCleared) return;
    const timer = window.setInterval(() => {
      setMissionElapsedSec((s) => s + 1);
      if (activeStation === 'event_loop') {
        setMainThreadBlockedPct((prev) => {
          const next = Math.min(100, prev + 2.2);
          if (next >= 100) {
            applyMistake('Main Thread Blocked 100% gây treo tab! Thử lại nhịp Event Loop.');
            return 12;
          }
          return Number(next.toFixed(1));
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeStation, applyMistake, phase, stageCleared]);

  // ===========================================================================
  // STATION 1 HANDLER: DOM SNIPER (LIVE CROSSHAIR LOCK + querySelectorAll + LASER)
  // ===========================================================================
  const activeSniperMission = DOM_SNIPER_MISSIONS[levelIdx] ?? DOM_SNIPER_MISSIONS[0];

  const liveSniperPreview = useMemo(() => {
    const spec = calcSelectorSpecificity(sniperInput);
    if (!sniperInput.trim() || !sniperArenaRef.current) {
      return {
        valid: sniperInput.trim().length === 0,
        matchCount: 0,
        matchedIds: [] as string[],
        lockedEnemies: 0,
        lockedHostages: 0,
        spec,
      };
    }
    try {
      const matched = sniperArenaRef.current.querySelectorAll(sniperInput);
      const matchedIds = Array.from(matched)
        .map((el) => el.getAttribute('data-dom-id'))
        .filter((id): id is string => Boolean(id));
      const evalPreview = evaluateSniperShot(activeSniperMission, sniperInput, matchedIds);
      return {
        valid: true,
        matchCount: matched.length,
        matchedIds,
        lockedEnemies: evalPreview.hitEnemyIds.length,
        lockedHostages: evalPreview.hitHostageIds.length,
        spec,
      };
    } catch {
      return {
        valid: false,
        matchCount: 0,
        matchedIds: [] as string[],
        lockedEnemies: 0,
        lockedHostages: 0,
        spec,
      };
    }
  }, [activeSniperMission, sniperInput]);

  const fireDomLaser = useCallback(() => {
    if (!sniperArenaRef.current || !laserCanvasRef.current) return;
    const arena = sniperArenaRef.current;
    const canvas = laserCanvasRef.current;
    const rect = arena.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let matchedEls: NodeListOf<Element>;
    try {
      matchedEls = arena.querySelectorAll(sniperInput.trim());
    } catch {
      playTone(130, 0.18, 'sawtooth', 0.08);
      setMissionBanner({ tone: 'error', text: 'Cú pháp CSS Selector chưa đúng! Hãy thử ghép lại bằng các thẻ gợi ý bên dưới.' });
      return;
    }

    const matchedIds = Array.from(matchedEls)
      .map((el) => el.getAttribute('data-dom-id'))
      .filter((id): id is string => Boolean(id));

    const result = evaluateSniperShot(activeSniperMission, sniperInput, matchedIds);

    // Draw dual-core glowing laser beams + shockwave rings to every matched element
    const originX = canvas.width / 2;
    const originY = canvas.height - 6;

    matchedEls.forEach((el) => {
      const id = el.getAttribute('data-dom-id');
      if (!id) return;
      const b = el.getBoundingClientRect();
      const tx = b.left - rect.left + b.width / 2;
      const ty = b.top - rect.top + b.height / 2;
      const isHostage = result.hitHostageIds.includes(id);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = isHostage ? '#FB7185' : '#34D399';
      ctx.lineWidth = 4.5;
      ctx.shadowColor = isHostage ? '#F43F5E' : '#10B981';
      ctx.shadowBlur = 16;
      ctx.stroke();

      // White inner plasma beam
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Impact ring
      ctx.beginPath();
      ctx.arc(tx, ty, 15, 0, Math.PI * 2);
      ctx.strokeStyle = isHostage ? '#FDA4AF' : '#A7F3D0';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    });

    window.setTimeout(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 750);

    if (result.won) {
      setSniperDestroyedIds(result.hitEnemyIds);
      playTone(880, 0.12, 'triangle', 0.08);
      grantMissionClear(150, activeSniperMission.timeLimitSec, activeSniperMission.explanation);
    } else if (result.hitHostageIds.length > 0) {
      applyMistake(result.penaltyReason || 'Bắn nhầm con tin!');
    } else {
      playTone(220, 0.14, 'sawtooth', 0.07);
      setMissionBanner({
        tone: 'error',
        text: result.penaltyReason || 'Chưa trúng đủ mục tiêu.',
      });
    }
  }, [activeSniperMission, applyMistake, grantMissionClear, playTone, sniperInput]);

  // ===========================================================================
  // STATION 2 HANDLER: LAYOUT HEIST (STEERING PAD + REAL CSS + RECT MEASURE)
  // ===========================================================================
  const activeHeistLevel = LAYOUT_HEIST_LEVELS[levelIdx] ?? LAYOUT_HEIST_LEVELS[0];

  const applySteeringProperty = useCallback(
    (prop: string, val: string) => {
      const parsed = parseLayoutCssInput(heistCssInput);
      const existingEntries = Object.entries(parsed.styles).map(([k, v]) => {
        const kebab = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        return [kebab, v] as const;
      });
      const map = new Map<string, string>(existingEntries);
      map.set(prop, val);
      const nextCssText = Array.from(map.entries())
        .map(([k, v]) => `${k}: ${v};`)
        .join('\n');
      setHeistCssInput(nextCssText);

      const nextParsed = parseLayoutCssInput(nextCssText);
      setAppliedHeistStyles(nextParsed.styles);
      playTone(540, 0.06, 'sine', 0.05);

      // Update live slot alignment feedback after transition settles
      window.setTimeout(() => {
        if (!heistFloorRef.current || !heistContainerRef.current) return;
        const floorRect = heistFloorRef.current.getBoundingClientRect();
        if (floorRect.width <= 0 || floorRect.height <= 0) return;
        const coords: LayoutCoord[] = activeHeistLevel.agents.map((ag) => {
          const el = heistContainerRef.current?.querySelector(`[data-agent-id="${ag.id}"]`);
          if (!el) return { x: 0, y: 0 };
          const r = el.getBoundingClientRect();
          const cx = ((r.left - floorRect.left + r.width / 2) / floorRect.width) * 100;
          const cy = ((r.top - floorRect.top + r.height / 2) / floorRect.height) * 100;
          return { x: Number(cx.toFixed(1)), y: Number(cy.toFixed(1)) };
        });
        const check = evaluateLayoutCoordinates(activeHeistLevel, coords, nextParsed.declarationCount);
        setHeistMatchedSlotsCount(check.matchedCount);
      }, 420);
    },
    [activeHeistLevel, heistCssInput, playTone]
  );

  const runHeistCss = useCallback(() => {
    const parsed = parseLayoutCssInput(heistCssInput);
    if (parsed.rejectedProps.length > 0) {
      setMissionBanner({
        tone: 'error',
        text: `Thuộc tính không được phép: ${parsed.rejectedProps.join(', ')}. Chỉ dùng Flexbox / Grid!`,
      });
      return;
    }

    setAppliedHeistStyles(parsed.styles);
    playTone(540, 0.08, 'sine', 0.07);

    // Measure actual agent positions after CSS transition settles (430ms)
    window.setTimeout(() => {
      if (!heistFloorRef.current || !heistContainerRef.current) return;
      const floorRect = heistFloorRef.current.getBoundingClientRect();
      if (floorRect.width <= 0 || floorRect.height <= 0) return;

      const coords: LayoutCoord[] = activeHeistLevel.agents.map((ag) => {
        const el = heistContainerRef.current?.querySelector(`[data-agent-id="${ag.id}"]`);
        if (!el) return { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        const cx = ((r.left - floorRect.left + r.width / 2) / floorRect.width) * 100;
        const cy = ((r.top - floorRect.top + r.height / 2) / floorRect.height) * 100;
        return { x: Number(cx.toFixed(1)), y: Number(cy.toFixed(1)) };
      });

      const verdict = evaluateLayoutCoordinates(
        activeHeistLevel,
        coords,
        parsed.declarationCount
      );
      setHeistMatchedSlotsCount(verdict.matchedCount);

      if (verdict.won) {
        grantMissionClear(160, activeHeistLevel.timeLimitSec, activeHeistLevel.explanation);
      } else if (verdict.hitTrap) {
        applyMistake(verdict.reason || 'Chạm bẫy laser!');
      } else {
        setMissionBanner({
          tone: 'error',
          text: verdict.reason || 'Đội hình chưa khớp hoàn toàn vào ô kim cương.',
        });
      }
    }, 430);
  }, [activeHeistLevel, applyMistake, grantMissionClear, heistCssInput, playTone]);

  // ===========================================================================
  // STATION 3 HANDLER: EVENT LOOP TRAFFIC
  // ===========================================================================
  const activeLoopLevel = EVENT_LOOP_LEVELS[levelIdx] ?? EVENT_LOOP_LEVELS[0];

  const handleDispatchLoopTask = useCallback(
    (taskId: string) => {
      if (stageCleared) return;
      const res = evaluateEventLoopDispatch(activeLoopLevel, dispatchedTaskIds, taskId);
      if (res.accepted) {
        const nextList = [...dispatchedTaskIds, taskId];
        setDispatchedTaskIds(nextList);
        setMainThreadBlockedPct((p) => Math.max(8, Number((p - 9).toFixed(1))));
        setLoopHintText(null);
        playTone(480 + nextList.length * 70, 0.08, 'triangle', 0.08);
        setMissionBanner(null);

        if (res.completed) {
          grantMissionClear(170, 50, activeLoopLevel.explanation);
        }
      } else {
        setMainThreadBlockedPct((p) => Math.min(98, Number((p + 18).toFixed(1))));
        applyMistake(res.errorReason || 'Sai thứ tự Event Loop!');
      }
    },
    [activeLoopLevel, applyMistake, dispatchedTaskIds, grantMissionClear, playTone, stageCleared]
  );

  const showNextLoopHint = useCallback(() => {
    const nextToken = activeLoopLevel.expectedOutput[dispatchedTaskIds.length];
    const nextTask = activeLoopLevel.tasks.find((t) => t.outputToken === nextToken);
    if (!nextTask) return;
    const laneExplain =
      nextTask.lane === 'sync'
        ? 'vì đây là lệnh Đường Thẳng (Sync) đang đứng chờ chạy ngay!'
        : nextTask.lane === 'microtask'
          ? 'vì Đường Thẳng đã rỗng nên Cổng VIP (Microtask) được ưu tiên lên ngay!'
          : 'vì cả Đường Thẳng và Cổng VIP đã trống, giờ mới tới lượt Bãi Chờ Hẹn Giờ!';
    setLoopHintText(`Gợi ý bước ${dispatchedTaskIds.length + 1}: Hãy bấm "${nextTask.label}" ${laneExplain}`);
    playTone(620, 0.06, 'sine', 0.05);
  }, [activeLoopLevel, dispatchedTaskIds.length, playTone]);

  // ===========================================================================
  // STATION 4 HANDLER: DEVTOOLS DETECTIVE (RESIZABLE PREVIEW + COMPUTED STYLE)
  // ===========================================================================
  const activeBugLevel = RESPONSIVE_BUG_LEVELS[levelIdx] ?? RESPONSIVE_BUG_LEVELS[0];
  const isBugCurrentlyExposed = isBugExposedAtWidth(activeBugLevel, previewWidthPx);

  const inspectPreviewNode = useCallback(
    (el: HTMLElement, fallbackLabel: string) => {
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const overflowInfo = el.scrollWidth > el.clientWidth + 2 ? 'OVERFLOW X!' : 'fit';
      setInspectedStyles(
        `${fallbackLabel} · width:${Math.round(rect.width)}px · display:${cs.display} · flexWrap:${cs.flexWrap} · zIndex:${cs.zIndex} · ${overflowInfo}`
      );
      playTone(720, 0.05, 'sine', 0.05);
    },
    [playTone]
  );

  const handleFlagResponsiveBug = useCallback(() => {
    if (!isBugCurrentlyExposed) {
      setMissionBanner({
        tone: 'error',
        text: `Ở độ rộng ${previewWidthPx}px giao diện vẫn ổn! Hãy kéo xuống <= ${activeBugLevel.triggerBreakpointMaxPx}px (ví dụ 375px) để tái hiện lỗi.`,
      });
      playTone(210, 0.12, 'sawtooth', 0.06);
      return;
    }
    setBugSpotted(true);
    playTone(760, 0.1, 'triangle', 0.08);
    setMissionBanner({
      tone: 'neutral',
      text: `Đã bắt quả tang lỗi tại ${previewWidthPx}px! Hãy chọn miếng vá CSS bên dưới để sửa dứt điểm.`,
    });
  }, [activeBugLevel.triggerBreakpointMaxPx, isBugCurrentlyExposed, playTone, previewWidthPx]);

  const handleApplyBugPatch = useCallback(
    (patchId: string) => {
      if (stageCleared) return;
      const opt = activeBugLevel.patchOptions.find((p) => p.id === patchId);
      if (!opt) return;
      if (!bugSpotted && !isBugCurrentlyExposed) {
        setMissionBanner({
          tone: 'error',
          text: `Hãy kéo khung hình xuống <= ${activeBugLevel.triggerBreakpointMaxPx}px để xem trực tiếp lỗi trước khi vá!`,
        });
        return;
      }
      setBugSpotted(true);
      setAppliedBugPatchId(patchId);
      if (opt.isCorrect) {
        grantMissionClear(165, 55, activeBugLevel.explanation);
      } else {
        applyMistake(opt.feedback);
      }
    },
    [activeBugLevel, applyMistake, bugSpotted, grantMissionClear, isBugCurrentlyExposed, stageCleared]
  );

  // ===========================================================================
  // STATION 5 HANDLER: COMPONENT TREE DEFENSE (RE-RENDER CASCADE & OPTIMIZE)
  // ===========================================================================
  const triggerTreePulse = useCallback(
    (intensity: number) => {
      const sim = simulateTreePulse(activeShields, intensity);
      setRenderCounts((prev) => {
        const next = { ...prev };
        for (const id of sim.renderedNodeIds) {
          next[id] = (next[id] ?? 1) + 1;
        }
        return next;
      });
      setFlashingNodeIds(sim.renderedNodeIds);
      window.setTimeout(() => setFlashingNodeIds([]), 220);

      setTreeFps(sim.resultingFps);
      setCpuHeat((h) => Math.max(32, Math.min(100, Number((h + sim.cpuHeatDelta).toFixed(1)))));

      if (sim.resultingFps < 35) {
        playTone(170, 0.06, 'sawtooth', 0.04);
      }
    },
    [activeShields, playTone]
  );

  const toggleTreeShield = useCallback(
    (shieldId: TreeDefenseShieldId) => {
      const opt = TREE_DEFENSE_SHIELDS.find((s) => s.id === shieldId);
      if (!opt) return;
      if (activeShields.includes(shieldId)) {
        setActiveShields((prev) => prev.filter((id) => id !== shieldId));
        setTreeBudget((b) => b + opt.cost);
        playTone(420, 0.07, 'sine', 0.06);
      } else {
        if (treeBudget < opt.cost) {
          setMissionBanner({
            tone: 'error',
            text: `Không đủ ngân sách ($${treeBudget} < $${opt.cost}). Gỡ bớt module khác nếu muốn đổi chiến thuật.`,
          });
          return;
        }
        setActiveShields((prev) => [...prev, shieldId]);
        setTreeBudget((b) => b - opt.cost);
        setMissionBanner(null);
        playTone(680, 0.08, 'triangle', 0.07);
      }
    },
    [activeShields, playTone, treeBudget]
  );

  // Auto Stress Wave for Station 5 (progressive waveSeconds & targetFps per levelIdx)
  useEffect(() => {
    if (activeStation !== 'tree_defense' || !stressActive || phase !== 'playing' || stageCleared) {
      return;
    }
    const waveTick = window.setInterval(() => {
      triggerTreePulse(activeTreeLevel.typingIntensity);
      setStressLeftSec((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setStressActive(false);
          const check = simulateTreePulse(activeShields, activeTreeLevel.typingIntensity);
          if (check.resultingFps >= activeTreeLevel.targetFps) {
            grantMissionClear(190, 45, activeTreeLevel.takeaway);
          } else {
            applyMistake(
              `FPS tụt xuống ${check.resultingFps} FPS (cần >= ${activeTreeLevel.targetFps} FPS)! Hãy bật thêm lá chắn cô lập hoặc chống spam rồi thử lại.`
            );
          }
          return 0;
        }
        return next;
      });
    }, 850);
    return () => window.clearInterval(waveTick);
  }, [activeShields, activeStation, activeTreeLevel, applyMistake, grantMissionClear, phase, stageCleared, stressActive, triggerTreePulse]);

  const rankInfo = getFeRank(xp);
  const activeStationMeta = FE_STATIONS.find((s) => s.id === activeStation) ?? FE_STATIONS[0];
  const totalCleared = clearedKeys.length;

  return (
    <section
      aria-label="Học Viện Chiến Binh Frontend — 5 Trạm Thực Chiến"
      className="rounded-2xl border border-slate-700/90 bg-[#0B111D] text-slate-100 p-3.5 sm:p-5 space-y-4"
    >
      {/* TOP BAR: UNIFIED GAME IDENTITY + CLEAN TABULAR TELEMETRY */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="font-sans text-lg sm:text-xl font-bold tracking-tight text-white">
            Học Viện Chiến Binh Frontend (5 Trong 1)
          </h1>
          <p className="text-xs text-slate-400">
            Cấp bậc: <span className="text-sky-300 font-semibold">{rankInfo.rankTitle}</span> · Hoàn thành{' '}
            <span className="font-mono tabular-nums text-emerald-300">{totalCleared}/15</span> nhiệm vụ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#060911] border border-slate-800 px-3.5 py-2 font-mono tabular-nums text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">XP</span>
              <span data-testid="fe-xp" className="text-sm sm:text-base font-bold text-white">
                {xp}
              </span>
            </div>
            <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
            <div>
              <span className="text-slate-400 block text-[10px]">MẠNG</span>
              <span
                data-testid="fe-lives"
                className={`text-sm sm:text-base font-bold inline-flex items-center gap-1 ${
                  lives > 1 ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                {lives}/3
              </span>
            </div>
            <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
            <div>
              <span className="text-slate-400 block text-[10px]">CHUỖI</span>
              <span data-testid="fe-streak" className="text-sm sm:text-base font-bold text-amber-300">
                ×{streak}
              </span>
            </div>
            <span className="h-6 w-px bg-slate-800" aria-hidden="true" />
            <div>
              <span className="text-slate-400 block text-[10px]">KỶ LỤC</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">{bestXp}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Learning Mode Switch: Beginner Visual Guide vs Pro Challenge */}
            <div role="group" aria-label="Chế độ học" className="inline-flex rounded-lg bg-[#060911] border border-slate-800 p-1 gap-1">
              <button
                type="button"
                data-testid="fe-mode-visual"
                onClick={() => {
                  setAssistMode('visual_guide');
                  setShowBeginnerGuide(true);
                }}
                className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  assistMode === 'visual_guide'
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Học Vui Trực Quan
              </button>
              <button
                type="button"
                data-testid="fe-mode-pro"
                onClick={() => {
                  setAssistMode('pro_challenge');
                  setShowBeginnerGuide(false);
                }}
                className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  assistMode === 'pro_challenge'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Thực Chiến Pro (×1.5 XP)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              className="min-h-[40px] min-w-[40px] px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:border-slate-500 text-slate-200 inline-flex items-center justify-center cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-300" />}
            </button>
            <button
              type="button"
              data-testid="fe-restart-btn"
              onClick={startFreshRun}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {phase === 'ready' ? <Play className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
              <span>{phase === 'ready' ? 'Bắt Đầu' : 'Chơi Lại'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* UNIFIED 5-STATION MISSION NAVIGATOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div
          role="tablist"
          aria-label="5 Trạm Chiến Dịch Frontend"
          className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#060911] border border-slate-800 p-1.5"
        >
          {FE_STATIONS.map((st) => {
            const selected = activeStation === st.id;
            const icon =
              st.id === 'dom_sniper' ? (
                <Crosshair className="w-3.5 h-3.5 shrink-0" />
              ) : st.id === 'layout_heist' ? (
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              ) : st.id === 'event_loop' ? (
                <Workflow className="w-3.5 h-3.5 shrink-0" />
              ) : st.id === 'devtools_detective' ? (
                <Bug className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Cpu className="w-3.5 h-3.5 shrink-0" />
              );
            return (
              <button
                key={st.id}
                type="button"
                role="tab"
                data-testid={`fe-station-${st.id}`}
                aria-selected={selected}
                onClick={() => selectMission(st.id, 0)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selected
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                {icon}
                <span>{st.index}. {st.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* 3 Progressive Sub-Levels for Active Station */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Màn trạm này:</span>
          <div role="group" aria-label="Chọn cấp màn" className="inline-flex rounded-lg bg-[#060911] border border-slate-800 p-1 gap-1">
            {[0, 1, 2].map((idx) => {
              const cleared = clearedKeys.includes(`${activeStation}:${idx}`);
              const active = levelIdx === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  data-testid={`fe-level-${idx}`}
                  onClick={() => selectMission(activeStation, idx)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-md text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    active
                      ? 'bg-sky-400 text-slate-950'
                      : cleared
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Màn {idx + 1}{cleared ? ' ✓' : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* GAME OVER / READY BRIEFING BANNER OR ACTIVE STATION PLAYFIELD */}
      {phase === 'ready' ? (
        <div className="rounded-xl border border-slate-700 bg-[#10192A] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-base sm:text-lg font-bold text-white">
              Học Làm Web Qua 5 Trò Chơi Trực Quan — Không Cần Biết Code Trước!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Chơi như game, nhìn thấy kết quả ngay trước mắt: ngắm tia laser tự động sáng khung mục tiêu,
              kéo cần gạt xem nhân vật trượt theo lệnh CSS, điều phối làn xe VIP Event Loop, kéo màn hình điện thoại bắt bug vỡ khung và giải cứu Web khỏi giật lag 60 FPS.
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Phím Space / Enter để bắt đầu · Mặc định bật chế độ Học Vui Trực Quan
            </p>
          </div>
          <button
            type="button"
            data-start="true"
            onClick={startFreshRun}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            Vào Học & Chơi Ngay
          </button>
        </div>
      ) : phase === 'gameover' ? (
        <div
          data-testid="fe-gameover-panel"
          className="rounded-xl border border-amber-400/70 bg-[#18131A] p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">
              {lives <= 0 ? 'Hết Mạng Chiến Dịch!' : 'Hoàn Tất Toàn Bộ Chiến Dịch Frontend!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Tổng XP: <strong className="text-amber-300">{xp}</strong> · Cấp bậc:{' '}
              <strong className="text-sky-300">{rankInfo.rankTitle}</strong> · Đã hoàn thành{' '}
              <strong>{totalCleared}/15</strong> màn
            </p>
          </div>
          <button
            type="button"
            data-start="true"
            onClick={startFreshRun}
            className="min-h-[42px] px-5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            Chơi Lại Từ Đầu
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* STATION HEADER + VISUAL BEGINNER 10s ANALOGY */}
          <div className="rounded-xl border border-slate-800 bg-[#0E1625] p-3.5 sm:p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-sky-300">
                  {activeStationMeta.title} · {activeStationMeta.skillFocus}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{activeStationMeta.tagline}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBeginnerGuide((v) => !v)}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:border-emerald-400 text-[11px] font-medium text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{showBeginnerGuide ? 'Thu gọn giải thích dễ hiểu' : 'Xem giải thích cho người mới'}</span>
                </button>
                <div className="font-mono tabular-nums text-xs text-slate-300">
                  Thời gian: <strong className="text-white">{missionElapsedSec}s</strong>
                </div>
              </div>
            </div>

            {showBeginnerGuide && (
              <div
                data-testid="fe-beginner-guide"
                className="rounded-lg border border-emerald-500/35 bg-emerald-950/25 p-3 space-y-2"
              >
                <p className="text-xs text-emerald-100 leading-relaxed">
                  <strong className="text-emerald-300">Hiểu nhanh trong 10 giây:</strong>{' '}
                  {activeStationMeta.beginnerAnalogy}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {activeStationMeta.visualLegend.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-md border border-slate-700/80 bg-[#080E1A] px-2.5 py-1.5 text-[11px]"
                    >
                      <span className="font-mono font-bold text-sky-300">{item.label}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-slate-200">{item.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {missionBanner && (
            <div
              data-testid="fe-mission-banner"
              role="status"
              className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
                missionBanner.tone === 'success'
                  ? 'border-emerald-400/80 bg-emerald-950/60 text-emerald-100'
                  : missionBanner.tone === 'error'
                    ? 'border-rose-400/80 bg-rose-950/60 text-rose-100'
                    : 'border-sky-400/70 bg-sky-950/50 text-sky-100'
              }`}
            >
              <div className="space-y-1 max-w-3xl">
                <p className="text-sm font-bold">{missionBanner.text}</p>
                {missionBanner.takeaway && (
                  <p className="text-xs opacity-90">{missionBanner.takeaway}</p>
                )}
              </div>
              {stageCleared && (
                <button
                  type="button"
                  data-testid="fe-next-mission-btn"
                  onClick={goToNextMission}
                  className="min-h-[38px] px-4 py-2 rounded-lg bg-white text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {levelIdx < 2 || activeStation !== 'tree_defense' ? 'Trạm Tiếp Theo →' : 'Tổng Kết'}
                </button>
              )}
            </div>
          )}

          {/* ================================================================
              STATION 1: DOM SNIPER (LIVE CROSSHAIR LOCK + CANVAS LASER)
          ================================================================ */}
          {activeStation === 'dom_sniper' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Briefing + Visual Selector Builder */}
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0F1728] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-white">{activeSniperMission.title}</h2>
                    <span className="font-mono text-xs text-amber-300 tabular-nums">
                      Màn {levelIdx + 1}/3
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeSniperMission.briefing}
                  </p>

                  {/* Live Target Lock Radar Summary */}
                  <div className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 font-mono text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Ngắm thử trên màn hình:</span>
                      <span
                        data-testid="sniper-live-lock"
                        className={
                          !liveSniperPreview.valid
                            ? 'text-rose-400 font-bold'
                            : liveSniperPreview.lockedHostages > 0
                              ? 'text-rose-400 font-bold'
                              : liveSniperPreview.lockedEnemies > 0
                                ? 'text-emerald-300 font-bold'
                                : 'text-sky-300 font-bold'
                        }
                      >
                        {!liveSniperPreview.valid
                          ? 'Chờ hoàn thiện lệnh...'
                          : liveSniperPreview.lockedHostages > 0
                            ? `⚠ Nguy hiểm: Khóa trúng ${liveSniperPreview.lockedHostages} con tin!`
                            : `🎯 Đang khóa ${liveSniperPreview.lockedEnemies}/${activeSniperMission.expectedEnemyDomIds.length} mục tiêu địch`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Độ gọn của lệnh (Specificity):</span>
                      <span
                        className={
                          liveSniperPreview.spec.score > activeSniperMission.maxSpecificityScore
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-300 font-bold'
                        }
                      >
                        {liveSniperPreview.spec.score}/{activeSniperMission.maxSpecificityScore} (Càng nhỏ càng tốt)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="dom-sniper-input" className="text-xs font-medium text-slate-300">
                      Lệnh nhắm mục tiêu ({activeSniperMission.containerHint}):
                    </label>
                    {sniperInput && (
                      <button
                        type="button"
                        onClick={() => setSniperInput('')}
                        className="text-[11px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Xóa lệnh
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="dom-sniper-input"
                      data-testid="sniper-selector-input"
                      type="text"
                      value={sniperInput}
                      onChange={(e) => setSniperInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fireDomLaser();
                      }}
                      placeholder={assistMode === 'visual_guide' ? activeSniperMission.solutionExample : 'Nhập CSS selector...'}
                      className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-[#060911] px-3 py-2 font-mono text-xs sm:text-sm text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      data-testid="sniper-fire-btn"
                      onClick={fireDomLaser}
                      className="min-h-[40px] px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Bắn Laser
                    </button>
                  </div>

                  {/* Visual Friendly Chips */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400">
                      {assistMode === 'visual_guide'
                        ? 'Bấm ghép nhanh từng mảnh lệnh (ô sáng xanh bên phải là đang nhắm đúng địch!):'
                        : 'Ghép nhanh token:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeSniperMission.quickChips.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() =>
                            setSniperInput((prev) => {
                              const trimmed = prev.trim();
                              if (!trimmed) return chip;
                              if (chip === '>' || chip === ', ') return `${trimmed} ${chip}`.trimStart();
                              return `${trimmed} ${chip}`;
                            })
                          }
                          className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 hover:border-sky-400 font-mono text-[11px] text-slate-200 cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                      {assistMode === 'visual_guide' && (
                        <button
                          type="button"
                          data-testid="sniper-hint-btn"
                          onClick={() => setSniperInput(activeSniperMission.solutionExample)}
                          className="px-2.5 py-1 rounded border border-emerald-500/60 bg-emerald-950/50 hover:bg-emerald-900/60 text-[11px] font-semibold text-emerald-200 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          <span>Nạp Mẫu Chuẩn</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Live Semantic DOM Arena + Overlaid Laser Canvas */}
              <div className="lg:col-span-7 relative rounded-xl border border-slate-800 bg-[#070B14] p-4 overflow-hidden">
                <canvas
                  ref={laserCanvasRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-20 w-full h-full"
                />
                <div ref={sniperArenaRef} className="relative z-10 space-y-3">
                  {/* Structured DOM Tree Crowd matching Mission 1, 2, or 3 */}
                  {activeSniperMission.id === 'sniper-1' && (
                    <div className="space-y-3">
                      <header className="header rounded-lg border border-slate-800 bg-[#0D1424] p-2.5 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-slate-400">&lt;header class="header"&gt; (Đầu trang an toàn)</span>
                        <div className="flex flex-wrap gap-2">
                          <img
                            data-dom-id="avatar-1"
                            alt="Avatar Con Tin"
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='12' fill='%2338BDF8'/%3E%3C/svg%3E"
                            className={`avatar user-safe w-7 h-7 rounded-full border transition-all ${
                              liveSniperPreview.matchedIds.includes('avatar-1')
                                ? 'ring-2 ring-rose-500 border-rose-400 scale-110'
                                : 'border-sky-400'
                            }`}
                          />
                          <button
                            type="button"
                            data-dom-id="pay-btn-1"
                            className={`pay-btn primary px-2.5 py-1 rounded border text-xs font-mono transition-all ${
                              liveSniperPreview.matchedIds.includes('pay-btn-1')
                                ? 'bg-rose-500/40 border-rose-400 text-white ring-2 ring-rose-500'
                                : 'bg-sky-500/20 border-sky-400/50 text-sky-200'
                            }`}
                          >
                            &lt;button.pay-btn&gt; Thanh Toán (Con tin)
                          </button>
                        </div>
                      </header>

                      <div className="feed rounded-lg border border-slate-700 bg-[#0B1220] p-3 space-y-2">
                        <div className="font-mono text-[11px] text-emerald-300">&lt;div class="feed"&gt; (Vùng Bảng Tin)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <article
                            data-dom-id="post-1"
                            className={`post clean rounded-lg border p-2.5 text-xs transition-all ${
                              liveSniperPreview.matchedIds.includes('post-1')
                                ? 'border-amber-400 bg-amber-950/40 ring-2 ring-amber-400'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            <span className="font-mono text-[10px] text-slate-400 block">&lt;article.post&gt;</span>
                            <span className="text-slate-200 font-medium">Bài viết React (Thường)</span>
                          </article>
                          {activeSniperMission.nodes
                            .filter((n) => n.groupLabel === '.feed' && n.role === 'enemy')
                            .map((enemy) => {
                              const dead = sniperDestroyedIds.includes(enemy.domId);
                              const locked = liveSniperPreview.matchedIds.includes(enemy.domId);
                              return (
                                <aside
                                  key={enemy.domId}
                                  data-dom-id={enemy.domId}
                                  className={`ad-banner popup rounded-lg border p-2.5 text-xs transition-all ${
                                    dead
                                      ? 'border-emerald-400/50 bg-emerald-950/30 opacity-45 line-through'
                                      : locked
                                        ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-400'
                                        : 'border-rose-500/80 bg-rose-950/40'
                                  }`}
                                >
                                  <span className="font-mono text-[10px] text-rose-300 block">
                                    &lt;aside.ad-banner&gt; {locked && !dead ? '🎯 KHÓA' : ''}
                                  </span>
                                  <span className="text-white font-semibold">{enemy.label}</span>
                                </aside>
                              );
                            })}
                        </div>
                      </div>

                      <footer className="footer rounded-lg border border-slate-800 bg-[#0D1424] p-2.5">
                        <div
                          data-dom-id="footer-promo"
                          className={`promo-safe text-xs font-mono rounded px-2 py-1 ${
                            liveSniperPreview.matchedIds.includes('footer-promo')
                              ? 'bg-rose-500/30 text-rose-200 ring-2 ring-rose-500'
                              : 'text-sky-300'
                          }`}
                        >
                          &lt;div.promo-safe&gt; Thông báo an toàn (Con tin)
                        </div>
                      </footer>
                    </div>
                  )}

                  {activeSniperMission.id === 'sniper-2' && (
                    <div className="feed space-y-3">
                      <div className="font-mono text-[11px] text-emerald-300">&lt;div class="feed"&gt;</div>
                      <article className="pinned rounded-lg border border-sky-500/50 bg-[#0C1829] p-3">
                        <div className="font-mono text-[11px] text-sky-300 mb-2">
                          &lt;article class="pinned"&gt; (Bài Ghim An Toàn — KHÔNG BẮN)
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <li
                            data-dom-id="pinned-li-1"
                            className={`item safe rounded border p-2 text-xs font-mono transition-all ${
                              liveSniperPreview.matchedIds.includes('pinned-li-1')
                                ? 'border-rose-500 bg-rose-950/60 text-rose-200 ring-2 ring-rose-500'
                                : 'border-sky-500/40 bg-slate-900 text-sky-200'
                            }`}
                          >
                            &lt;li&gt; Ghi chú #1 (Con tin)
                          </li>
                          <li
                            data-dom-id="pinned-li-2"
                            className={`item safe rounded border p-2 text-xs font-mono transition-all ${
                              liveSniperPreview.matchedIds.includes('pinned-li-2')
                                ? 'border-rose-500 bg-rose-950/60 text-rose-200 ring-2 ring-rose-500'
                                : 'border-sky-500/40 bg-slate-900 text-sky-200'
                            }`}
                          >
                            &lt;li&gt; Thanh toán #2 (Con tin)
                          </li>
                        </ul>
                      </article>

                      <article className="stream rounded-lg border border-slate-700 bg-[#101827] p-3">
                        <div className="font-mono text-[11px] text-amber-300 mb-2">
                          &lt;article class="stream"&gt; (Không ghim — Mục tiêu nằm ở thẻ li số LẺ 1 & 3!)
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { id: 'track-odd-1', cls: 'tracker odd', text: '1. Tracker #1 (Địch · Lẻ)', enemy: true },
                            { id: 'safe-even-2', cls: 'comment safe', text: '2. Bình luận #2 (Con tin · Chẵn)', enemy: false },
                            { id: 'track-odd-3', cls: 'tracker odd', text: '3. Tracker #3 (Địch · Lẻ)', enemy: true },
                            { id: 'safe-even-4', cls: 'comment safe', text: '4. Avatar #4 (Con tin · Chẵn)', enemy: false },
                          ].map((row) => {
                            const dead = sniperDestroyedIds.includes(row.id);
                            const locked = liveSniperPreview.matchedIds.includes(row.id);
                            return (
                              <li
                                key={row.id}
                                data-dom-id={row.id}
                                className={`${row.cls} rounded border p-2 text-xs font-mono transition-all ${
                                  row.enemy
                                    ? dead
                                      ? 'border-emerald-400/50 opacity-45 line-through text-emerald-300'
                                      : locked
                                        ? 'border-emerald-400 bg-emerald-950/50 text-emerald-100 ring-2 ring-emerald-400'
                                        : 'border-rose-500/80 bg-rose-950/40 text-rose-200'
                                    : locked
                                      ? 'border-rose-500 bg-rose-950/60 text-rose-200 ring-2 ring-rose-500'
                                      : 'border-sky-500/40 bg-slate-900 text-sky-200'
                                }`}
                              >
                                &lt;li&gt; {row.text} {locked && !dead ? (row.enemy ? '🎯' : '⚠') : ''}
                              </li>
                            );
                          })}
                        </ul>
                      </article>
                    </div>
                  )}

                  {activeSniperMission.id === 'sniper-3' && (
                    <div className="space-y-2.5">
                      <div className="head rounded-lg border border-slate-800 bg-[#0D1424] p-2.5">
                        <div
                          data-dom-id="safe-analytics"
                          data-threat="none"
                          className={`telemetry-script font-mono text-xs rounded px-2 py-1 ${
                            liveSniperPreview.matchedIds.includes('safe-analytics')
                              ? 'bg-rose-500/30 text-rose-200 ring-2 ring-rose-500'
                              : 'text-sky-300'
                          }`}
                        >
                          &lt;div data-threat="none"&gt; SDK Thống kê Sạch (Con tin)
                        </div>
                      </div>

                      <div className="body rounded-lg border border-slate-700 bg-[#11192A] p-3 space-y-2">
                        <span
                          data-dom-id="xss-1"
                          data-threat="xss"
                          className={`injected block rounded border p-2 font-mono text-xs transition-all ${
                            sniperDestroyedIds.includes('xss-1')
                              ? 'border-emerald-400/50 opacity-45 line-through text-emerald-300'
                              : liveSniperPreview.matchedIds.includes('xss-1')
                                ? 'border-emerald-400 bg-emerald-950/50 text-emerald-100 ring-2 ring-emerald-400'
                                : 'border-rose-500/80 bg-rose-950/40 text-rose-200'
                          }`}
                        >
                          &lt;span data-threat="xss"&gt; Script Đánh cắp Cookie (Địch)
                        </span>
                        <div
                          data-dom-id="alert-trigger"
                          className="alert rounded border border-slate-600 bg-slate-900 p-2 font-mono text-xs text-slate-300"
                        >
                          &lt;div class="alert"&gt; Cảnh báo DOM (Trung lập — Mốc tham chiếu)
                        </div>
                        <div
                          data-dom-id="payload-1"
                          className={`payload rounded border p-2 font-mono text-xs transition-all ${
                            sniperDestroyedIds.includes('payload-1')
                              ? 'border-emerald-400/50 opacity-45 line-through text-emerald-300'
                              : liveSniperPreview.matchedIds.includes('payload-1')
                                ? 'border-emerald-400 bg-emerald-950/50 text-emerald-100 ring-2 ring-emerald-400'
                                : 'border-rose-500/80 bg-rose-950/40 text-rose-200'
                          }`}
                        >
                          &lt;div class="payload"&gt; Miner ngay sau .alert (Địch)
                        </div>
                      </div>

                      <div className="checkout rounded-lg border border-slate-800 bg-[#0D1424] p-2.5 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          data-dom-id="pay-safe-2"
                          className={`pay-btn px-3 py-1 rounded border font-mono text-xs ${
                            liveSniperPreview.matchedIds.includes('pay-safe-2')
                              ? 'border-rose-500 bg-rose-500/40 text-white ring-2 ring-rose-500'
                              : 'border-sky-400/50 bg-sky-500/20 text-sky-200'
                          }`}
                        >
                          &lt;button.pay-btn&gt; OTP An toàn (Con tin)
                        </button>
                        <div
                          data-dom-id="xss-2"
                          data-threat="xss"
                          className={`hidden-frame rounded border px-2.5 py-1 font-mono text-xs transition-all ${
                            sniperDestroyedIds.includes('xss-2')
                              ? 'border-emerald-400/50 opacity-45 line-through text-emerald-300'
                              : liveSniperPreview.matchedIds.includes('xss-2')
                                ? 'border-emerald-400 bg-emerald-950/50 text-emerald-100 ring-2 ring-emerald-400'
                                : 'border-rose-500/80 bg-rose-950/40 text-rose-200'
                          }`}
                        >
                          &lt;iframe data-threat="xss"&gt; Phishing (Địch)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              STATION 2: LAYOUT HEIST (STEERING PAD + AXIS COMPASS + REAL CSS)
          ================================================================ */}
          {activeStation === 'layout_heist' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0F1728] p-4 flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-white">{activeHeistLevel.title}</h2>
                    <span className="font-mono text-xs text-sky-300 uppercase">
                      display: {activeHeistLevel.mode}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeHeistLevel.briefing}
                  </p>
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-amber-300">Giới hạn: ≤ {activeHeistLevel.maxProperties} dòng CSS</span>
                    <span className="text-emerald-300 font-bold">
                      Đã khớp: {heistMatchedSlotsCount}/{activeHeistLevel.agents.length} ô ◆
                    </span>
                  </div>
                </div>

                {/* Visual Steering Controls for Zero-FE Beginners */}
                {assistMode === 'visual_guide' && (
                  <div className="rounded-lg border border-slate-700/80 bg-[#080E1A] p-2.5 space-y-2">
                    <p className="text-[11px] font-medium text-emerald-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Bảng Lái Trực Quan (Bấm là đội hình trượt + tự điền code CSS):</span>
                    </p>
                    {activeHeistLevel.mode === 'flex' ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-amber-300 font-mono w-[74px] shrink-0">Trục chính:</span>
                          {[
                            { label: 'Đầu', val: 'flex-start' },
                            { label: 'Giữa', val: 'center' },
                            { label: 'Cuối', val: 'flex-end' },
                            { label: 'Giãn đều', val: 'space-between' },
                          ].map((btn) => (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => applySteeringProperty('justify-content', btn.val)}
                              className={`px-2 py-1 rounded border cursor-pointer ${
                                appliedHeistStyles.justifyContent === btn.val
                                  ? 'border-amber-400 bg-amber-400/20 text-amber-200 font-bold'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-sky-300 font-mono w-[74px] shrink-0">Trục phụ:</span>
                          {[
                            { label: 'Đầu', val: 'flex-start' },
                            { label: 'Giữa', val: 'center' },
                            { label: 'Cuối', val: 'flex-end' },
                          ].map((btn) => (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => applySteeringProperty('align-items', btn.val)}
                              className={`px-2 py-1 rounded border cursor-pointer ${
                                appliedHeistStyles.alignItems === btn.val
                                  ? 'border-sky-400 bg-sky-400/20 text-sky-200 font-bold'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-sky-400'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-emerald-300 font-mono w-[74px] shrink-0">Hướng xếp:</span>
                          {[
                            { label: 'Ngang →', val: 'row' },
                            { label: 'Dọc ↓', val: 'column' },
                            { label: 'Dọc Đảo ↑', val: 'column-reverse' },
                          ].map((btn) => (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => applySteeringProperty('flex-direction', btn.val)}
                              className={`px-2 py-1 rounded border cursor-pointer ${
                                appliedHeistStyles.flexDirection === btn.val
                                  ? 'border-emerald-400 bg-emerald-400/20 text-emerald-200 font-bold'
                                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <button
                          type="button"
                          onClick={() => applySteeringProperty('grid-template-columns', 'repeat(2, 1fr)')}
                          className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 hover:border-sky-400 text-slate-200 cursor-pointer"
                        >
                          Chia Lưới 2 Cột Đều (repeat(2, 1fr))
                        </button>
                        <button
                          type="button"
                          onClick={() => applySteeringProperty('place-items', 'center')}
                          className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 hover:border-emerald-400 text-slate-200 cursor-pointer"
                        >
                          Căn Giữa Từng Ô (place-items: center)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="layout-heist-css" className="text-xs font-medium text-slate-300">
                      Code CSS đang áp dụng cho đội hình:
                    </label>
                    {heistCssInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setHeistCssInput('');
                          setAppliedHeistStyles({});
                          setHeistMatchedSlotsCount(0);
                        }}
                        className="text-[11px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Đặt lại
                      </button>
                    )}
                  </div>
                  <textarea
                    id="layout-heist-css"
                    data-testid="heist-css-input"
                    rows={3}
                    value={heistCssInput}
                    onChange={(e) => setHeistCssInput(e.target.value)}
                    placeholder={activeHeistLevel.solutionExample}
                    className="w-full rounded-lg border border-slate-700 bg-[#060911] p-2.5 font-mono text-xs text-sky-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-400"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {activeHeistLevel.quickSnippets.map((snip) => (
                      <button
                        key={snip}
                        type="button"
                        onClick={() =>
                          setHeistCssInput((prev) => (prev.trim() ? `${prev.trim()}\n${snip}` : snip))
                        }
                        className="px-2 py-1 rounded border border-slate-700 bg-slate-900 hover:border-sky-400 font-mono text-[11px] text-slate-200 cursor-pointer"
                      >
                        + {snip}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    data-testid="heist-run-btn"
                    onClick={runHeistCss}
                    className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Chạy CSS & Kiểm Tra Khớp Kim Cương
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#060911] p-4 space-y-2">
                {/* Live Axis Compass Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300 px-1">
                  {activeHeistLevel.mode === 'grid' ? (
                    <span className="text-sky-300">Chế độ Lưới Grid · Chia hàng & cột theo ô</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-amber-300">
                        {appliedHeistStyles.flexDirection === 'column-reverse' ? (
                          <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : appliedHeistStyles.flexDirection === 'column' ? (
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        Trục Chính (justify-content)
                      </span>
                      <span className="inline-flex items-center gap-1 text-sky-300">
                        {appliedHeistStyles.flexDirection?.startsWith('column') ? (
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        Trục Phụ (align-items)
                      </span>
                    </div>
                  )}
                  <span className="text-emerald-300">Đưa A, B, C vào đúng ô ◆</span>
                </div>

                <div
                  ref={heistFloorRef}
                  className="relative w-full h-[290px] rounded-xl border border-slate-800 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:28px_28px] overflow-hidden"
                >
                  {/* Goal Diamond Slots */}
                  {activeHeistLevel.goalNormalizedPoints.map((pt, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-xl border-2 border-dashed border-emerald-400/80 bg-emerald-500/10 flex items-center justify-center font-mono text-[10px] font-bold text-emerald-300"
                      style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                    >
                      ◆{activeHeistLevel.agents[i]?.label}
                    </div>
                  ))}

                  {/* Laser Spike Traps */}
                  {activeHeistLevel.traps.map((trap, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-500/80 bg-rose-500/20 flex items-center justify-center text-[10px] font-mono text-rose-300 text-center px-1"
                      style={{
                        left: `${trap.x}%`,
                        top: `${trap.y}%`,
                        width: `${trap.radiusPct * 2}%`,
                        height: `${trap.radiusPct * 2}%`,
                      }}
                    >
                      ✕ Laser
                    </div>
                  ))}

                  {/* Real DOM Flexbox / Grid Squad Container */}
                  <div
                    ref={heistContainerRef}
                    data-testid="heist-dom-container"
                    className="w-full h-full p-3"
                    style={{
                      display: activeHeistLevel.mode,
                      ...appliedHeistStyles,
                    }}
                  >
                    {activeHeistLevel.agents.map((ag) => (
                      <div
                        key={ag.id}
                        data-agent-id={ag.id}
                        className="w-10 h-10 rounded-lg border-2 border-white/80 font-mono font-bold text-sm text-slate-950 flex items-center justify-center shadow-md transition-all duration-400"
                        style={{ backgroundColor: ag.colorHex }}
                      >
                        {ag.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              STATION 3: EVENT LOOP TRAFFIC (PLAIN AIRPORT LANES + HINT)
          ================================================================ */}
          {activeStation === 'event_loop' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Zone 1: Code Source + Expected Console Output + Main Thread Meter */}
                <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0F1728] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">{activeLoopLevel.title}</h2>
                    <span className="font-mono text-xs text-amber-300">
                      {dispatchedTaskIds.length}/{activeLoopLevel.expectedOutput.length} bước
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeLoopLevel.briefing}</p>

                  <pre className="rounded-lg border border-slate-800 bg-[#05080F] p-3 font-mono text-xs text-sky-200 overflow-x-auto leading-relaxed">
                    {activeLoopLevel.codeSnippet.join('\n')}
                  </pre>

                  {assistMode === 'visual_guide' && !stageCleared && (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        data-testid="loop-hint-btn"
                        onClick={showNextLoopHint}
                        className="px-3 py-1.5 rounded-lg border border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-xs font-semibold text-emerald-200 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Gợi Ý Bước Tiếp Theo</span>
                      </button>
                      {loopHintText && (
                        <p data-testid="loop-hint-text" className="text-xs text-emerald-200 bg-[#07101A] border border-emerald-500/30 rounded-lg p-2">
                          {loopHintText}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Main Thread Blocked Gauge */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-xs tabular-nums">
                      <span className="text-slate-400">Độ nghẽn luồng chính (Main Thread)</span>
                      <span className={mainThreadBlockedPct >= 75 ? 'text-rose-400 font-bold' : 'text-emerald-300'}>
                        {mainThreadBlockedPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          mainThreadBlockedPct >= 75 ? 'bg-rose-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${mainThreadBlockedPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Console Output Strip */}
                  <div className="rounded-lg border border-slate-800 bg-[#05080F] p-2.5 font-mono text-xs space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Thứ tự chữ in ra màn hình (console.log):</span>
                    </div>
                    <div data-testid="event-loop-console" className="flex flex-wrap gap-1.5 min-h-[24px] items-center">
                      {dispatchedTaskIds.length === 0 ? (
                        <span className="text-slate-500">(Hãy bấm vào khối bên phải theo thứ tự ưu tiên 1 → 2 → 3)</span>
                      ) : (
                        dispatchedTaskIds.map((id, i) => {
                          const t = activeLoopLevel.tasks.find((x) => x.id === id);
                          return (
                            <span
                              key={id}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold"
                            >
                              {i + 1}. {t?.outputToken}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Zones 2, 3, 4: Call Stack | Microtask Queue | Web API -> Macrotask Queue */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        lane: 'sync',
                        title: '1. Đường Thẳng (Sync)',
                        desc: 'Chạy hết sạch ngay lập tức trước tiên',
                        border: 'border-sky-500/50',
                        btnStyle: 'border-sky-400/70 bg-sky-950/40 hover:bg-sky-900/60 text-sky-100',
                      },
                      {
                        lane: 'microtask',
                        title: '2. Cổng VIP (Microtask)',
                        desc: 'Promise.then / sau await · Chen sau Đường Thẳng',
                        border: 'border-emerald-500/50',
                        btnStyle: 'border-emerald-400/70 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-100',
                      },
                      {
                        lane: 'macrotask',
                        title: '3. Bãi Chờ (Macrotask)',
                        desc: 'setTimeout / fetch · Đợi 1 & 2 xong hết mới chạy',
                        border: 'border-amber-500/50',
                        btnStyle: 'border-amber-400/70 bg-amber-950/40 hover:bg-amber-900/60 text-amber-100',
                      },
                    ] as const
                  ).map((col) => {
                    const laneTasks = activeLoopLevel.tasks.filter((t) => t.lane === col.lane);
                    return (
                      <div
                        key={col.lane}
                        className={`rounded-xl border ${col.border} bg-[#080D17] p-3 flex flex-col gap-2.5`}
                      >
                        <div>
                          <h3 className="text-xs font-bold text-white">{col.title}</h3>
                          <p className="text-[11px] text-slate-400">{col.desc}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {laneTasks.map((task) => {
                            const done = dispatchedTaskIds.includes(task.id);
                            return (
                              <button
                                key={task.id}
                                type="button"
                                disabled={done || stageCleared}
                                data-testid={`loop-task-${task.id}`}
                                onClick={() => handleDispatchLoopTask(task.id)}
                                className={`min-h-[54px] rounded-lg border p-2.5 text-left font-mono transition-all cursor-pointer disabled:opacity-35 disabled:cursor-default ${col.btnStyle}`}
                              >
                                <div className="text-xs font-bold">{task.label}</div>
                                <div className="text-[10px] opacity-80 mt-0.5">
                                  {done ? '✓ Đã xuất bến' : `${task.delayLabel} → Bấm để chạy`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              STATION 4: DEVTOOLS DETECTIVE (RESIZABLE PREVIEW + INSPECT + PATCH)
          ================================================================ */}
          {activeStation === 'devtools_detective' && (
            <div className="space-y-4">
              {/* Mini DevTools Toolbar */}
              <div className="rounded-xl border border-slate-800 bg-[#0F1728] p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h2 className="text-sm sm:text-base font-bold text-white">
                    {activeBugLevel.title} · <span className="text-sky-300">{activeBugLevel.sceneName}</span>
                  </h2>
                  <p className="text-xs text-slate-300">{activeBugLevel.briefing}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Desktop 1440px', val: 920 },
                    { label: 'Tablet 768px', val: 620 },
                    { label: 'Mobile 375px', val: 350 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      data-testid={`devtools-preset-${preset.val}`}
                      onClick={() => setPreviewWidthPx(preset.val)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-md text-xs font-mono cursor-pointer border ${
                        Math.abs(previewWidthPx - preset.val) <= 30
                          ? 'border-sky-400 bg-sky-500/20 text-sky-200 font-bold'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setInspectMode((v) => !v)}
                    aria-pressed={inspectMode}
                    className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer border ${
                      inspectMode
                        ? 'border-amber-400 bg-amber-400 text-slate-950 font-bold'
                        : 'border-slate-700 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Kính Lúp Inspect</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Resizable Live Mini Webpage Frame */}
                <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#05080F] p-3 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                    <span className="text-slate-400">Viewport:</span>
                    <input
                      type="range"
                      min={320}
                      max={960}
                      step={5}
                      value={previewWidthPx}
                      data-testid="devtools-width-slider"
                      aria-label="Kéo thay đổi chiều rộng màn hình kiểm thử"
                      onChange={(e) => setPreviewWidthPx(Number(e.target.value))}
                      className="flex-1 min-w-[140px] accent-sky-400 cursor-pointer"
                    />
                    <span
                      data-testid="devtools-width-readout"
                      className={`font-bold tabular-nums ${
                        stageCleared
                          ? 'text-emerald-300'
                          : isBugCurrentlyExposed
                            ? 'text-rose-400'
                            : 'text-emerald-300'
                      }`}
                    >
                      {previewWidthPx}px{' '}
                      {stageCleared
                        ? '(Đã vá sạch!)'
                        : isBugCurrentlyExposed
                          ? '(Đang lộ lỗi!)'
                          : '(Bình thường)'}
                    </span>
                  </div>

                  {/* Resizable Live Sandbox */}
                  <div className="w-full overflow-x-auto flex justify-center py-2 bg-[#090E19] rounded-lg border border-slate-800">
                    <div
                      ref={miniPreviewRef}
                      data-testid="devtools-preview-frame"
                      style={{ width: `${previewWidthPx}px` }}
                      className="max-w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-slate-100 transition-all duration-150 overflow-hidden"
                    >
                      {activeBugLevel.id === 'bug-1' && (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Vé Hội Thảo Frontend 2026</span>
                            {isBugCurrentlyExposed && !stageCleared && (
                              <span className="text-[10px] font-mono text-rose-400 font-bold">
                                ⚠ LỖI: Nút bị đẩy đè lên chữ!
                              </span>
                            )}
                          </div>
                          <div
                            onClick={(e) => inspectMode && inspectPreviewNode(e.currentTarget, '.checkout-bar')}
                            className={`checkout-bar flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 p-2.5 ${
                              inspectMode ? 'cursor-crosshair hover:ring-2 hover:ring-amber-400' : ''
                            } ${stageCleared ? 'flex-wrap gap-3' : 'flex-nowrap'}`}
                          >
                            <div className="shrink-0 w-[210px] text-xs text-slate-200">
                              Gói VIP Workshop · 499.000đ
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (inspectMode) inspectPreviewNode(e.currentTarget, 'button.buy-ticket');
                              }}
                              className={`px-3 py-1.5 rounded bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap shrink-0 ${
                                isBugCurrentlyExposed && !stageCleared ? '-ml-14 opacity-85 ring-2 ring-rose-500' : ''
                              }`}
                            >
                              Đặt Vé Ngay
                            </button>
                          </div>
                        </div>
                      )}

                      {activeBugLevel.id === 'bug-2' && (
                        <div className="space-y-2.5">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Giỏ Hàng · Thanh Toán Nhanh</span>
                            {isBugCurrentlyExposed && !stageCleared && (
                              <span className="text-[10px] font-mono text-rose-400 font-bold">
                                ⚠ LỖI: Mã dài chọc tràn khung!
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-2.5">
                            <span className="text-xs text-slate-300 shrink-0">Mã đơn:</span>
                            <div
                              onClick={(e) => inspectMode && inspectPreviewNode(e.currentTarget, '.order-code-col')}
                              className={`order-code-col flex-1 font-mono text-xs text-amber-300 ${
                                inspectMode ? 'cursor-crosshair hover:ring-2 hover:ring-amber-400' : ''
                              } ${
                                stageCleared
                                  ? 'min-w-0 break-all'
                                  : isBugCurrentlyExposed
                                    ? 'whitespace-nowrap ring-2 ring-rose-500'
                                    : ''
                              }`}
                            >
                              ORD_VN_TECH_2026_FRONTEND_MASTER_SUPER_LONG_HASH_8849201928374
                            </div>
                          </div>
                        </div>
                      )}

                      {activeBugLevel.id === 'bug-3' && (
                        <div className="relative space-y-2 min-h-[128px]">
                          {isBugCurrentlyExposed && !stageCleared && (
                            <p className="text-[10px] font-mono text-rose-400 font-bold">
                              ⚠ LỖI: Menu (z-index 5) chìm dưới Banner (z-index 20)!
                            </p>
                          )}
                          <div
                            onClick={(e) => inspectMode && inspectPreviewNode(e.currentTarget, '.nav-dropdown')}
                            className={`nav-dropdown rounded-lg border border-sky-400/60 bg-sky-950 p-2 text-xs font-mono text-sky-200 ${
                              inspectMode ? 'cursor-crosshair hover:ring-2 hover:ring-amber-400' : ''
                            } ${stageCleared ? 'relative z-50' : 'relative z-[5]'}`}
                          >
                            ▼ Menu Sổ Xuống (Hồ sơ / Đăng xuất)
                          </div>
                          <div
                            onClick={(e) => inspectMode && inspectPreviewNode(e.currentTarget, '.promo-banner')}
                            className={`promo-banner relative z-20 rounded-lg border border-rose-500/80 bg-rose-950 p-3 text-xs font-bold text-rose-100 ${
                              isBugCurrentlyExposed && !stageCleared ? '-mt-7' : 'mt-1'
                            }`}
                          >
                            Banner Khuyến Mãi (z-index: 20) Đè Lên Menu!
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-mono text-amber-300 truncate max-w-md" data-testid="devtools-inspector-output">
                      Inspect: {inspectedStyles}
                    </div>
                    <button
                      type="button"
                      data-testid="devtools-flag-bug-btn"
                      onClick={handleFlagResponsiveBug}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
                    >
                      Bắt Lỗi Tại {previewWidthPx}px
                    </button>
                  </div>
                </div>

                {/* Patch Selector Column */}
                <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0F1728] p-4 space-y-3">
                  <h3 className="text-sm font-bold text-white">Chọn Miếng Vá CSS Chính Xác</h3>
                  <p className="text-xs text-slate-400">{activeBugLevel.brokenCssSummary}</p>

                  <div className="space-y-2">
                    {activeBugLevel.patchOptions.map((opt) => {
                      const picked = appliedBugPatchId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          data-testid={`bug-patch-${opt.id}`}
                          onClick={() => handleApplyBugPatch(opt.id)}
                          className={`w-full rounded-lg border p-3 text-left font-mono text-xs transition-colors cursor-pointer ${
                            picked && opt.isCorrect
                              ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200'
                              : picked && !opt.isCorrect
                                ? 'border-rose-400 bg-rose-950/60 text-rose-200'
                                : 'border-slate-700 bg-[#070B14] text-slate-200 hover:border-sky-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              STATION 5: COMPONENT TREE DEFENSE (3 PROGRESSIVE WAVES + MINI APP)
          ================================================================ */}
          {activeStation === 'tree_defense' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Defense Arsenal + Live Search Input + Wave Trigger */}
              <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0F1728] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white">{activeTreeLevel.title}</h2>
                    <p className="text-[11px] text-slate-400">
                      Mục tiêu giữ ≥ {activeTreeLevel.targetFps} FPS trong {activeTreeLevel.waveSeconds}s
                    </p>
                  </div>
                  <span data-testid="tree-budget" className="font-mono text-sm font-bold text-amber-300 tabular-nums">
                    Ngân sách: ${treeBudget}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{activeTreeLevel.briefing}</p>

                {/* Live FPS + CPU Thermal Meters */}
                <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-slate-800 bg-[#060911] p-3 font-mono tabular-nums text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">ĐỘ MƯỢT KHUNG HÌNH</span>
                    <span
                      data-testid="tree-fps"
                      className={`text-base font-bold inline-flex items-center gap-1 ${
                        treeFps >= activeTreeLevel.targetFps ? 'text-emerald-400' : treeFps >= 35 ? 'text-amber-300' : 'text-rose-400'
                      }`}
                    >
                      <Activity className="w-4 h-4" aria-hidden="true" />
                      {treeFps} FPS
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ĐỘ NÓNG CPU</span>
                    <span
                      className={`text-base font-bold inline-flex items-center gap-1 ${
                        cpuHeat >= 75 ? 'text-rose-400' : 'text-sky-300'
                      }`}
                    >
                      <Flame className="w-4 h-4" aria-hidden="true" />
                      {cpuHeat.toFixed(0)}°C
                    </span>
                  </div>
                </div>

                {/* Live Search Input Triggering Real Pulses */}
                <div className="space-y-1.5">
                  <label htmlFor="tree-search-input" className="block text-xs font-medium text-slate-300">
                    Gõ thử vào ô Tìm Kiếm (nhìn Web bên phải chớp đỏ vì lag!):
                  </label>
                  <input
                    id="tree-search-input"
                    data-testid="tree-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      triggerTreePulse(activeTreeLevel.typingIntensity);
                    }}
                    placeholder="Gõ liên tục để quan sát re-render..."
                    className="w-full rounded-lg border border-slate-700 bg-[#060911] px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Purchasable Optimization Shields with Beginner Analogy */}
                <div className="space-y-2">
                  <span className="block text-xs font-medium text-slate-300">
                    Bật lá chắn chống lag cho Web:
                  </span>
                  {TREE_DEFENSE_SHIELDS.map((sh) => {
                    const equipped = activeShields.includes(sh.id);
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        data-testid={`tree-shield-${sh.id}`}
                        onClick={() => toggleTreeShield(sh.id)}
                        className={`w-full rounded-lg border p-2.5 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                          equipped
                            ? 'border-emerald-400 bg-emerald-950/50 text-emerald-100'
                            : 'border-slate-700 bg-[#080D18] text-slate-200 hover:border-sky-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            {equipped ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            )}
                            <span>{assistMode === 'visual_guide' ? `${sh.plainName} (${sh.name})` : sh.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {assistMode === 'visual_guide' ? sh.beginnerAnalogy : sh.shortEffect}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-300 shrink-0">
                          {equipped ? 'ĐÃ BẬT' : `$${sh.cost}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  data-testid="tree-start-wave-btn"
                  disabled={stressActive || stageCleared}
                  onClick={() => {
                    setStressLeftSec(activeTreeLevel.waveSeconds);
                    setStressActive(true);
                    setMissionBanner(null);
                  }}
                  className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {stressActive
                    ? `Đang hứng bão gõ phím (${stressLeftSec}s)...`
                    : `Chạy Kiểm Thử Bão Gõ Phím (${activeTreeLevel.waveSeconds}s)`}
                </button>
              </div>

              {/* Right Interactive Visual Component Tree + Mini Simulated Shop Preview */}
              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#060911] p-4 flex flex-col justify-start gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono pb-2 border-b border-slate-800/80">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    Sơ Đồ Cây Vẽ Lại (Component Render Tree)
                  </span>
                  <span>Chớp Đỏ = Vẽ lại thừa gây lag · Xanh = Đã bảo vệ</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Root Node */}
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-[270px]">
                      <TreeNodeCard
                        label={assistMode === 'visual_guide' ? 'Khung Tổng (<AppRoot />)' : '<AppRoot />'}
                        renders={renderCounts.app_root ?? 1}
                        flashing={flashingNodeIds.includes('app_root')}
                        shieldLabel={activeShields.includes('split_state') ? 'State Split ✓' : undefined}
                      />
                    </div>
                    <div aria-hidden="true" className="h-4 w-px bg-slate-700" />
                    <div aria-hidden="true" className="hidden sm:block w-2/3 h-px bg-slate-700" />
                  </div>

                  {/* Level 2 Children */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <TreeNodeCard
                      label={assistMode === 'visual_guide' ? 'Ô Tìm Kiếm' : '<SearchHeader />'}
                      renders={renderCounts.search_input ?? 1}
                      flashing={flashingNodeIds.includes('search_input')}
                      shieldLabel={activeShields.includes('debounce') ? 'Debounce 300ms ✓' : undefined}
                    />
                    <TreeNodeCard
                      label={assistMode === 'visual_guide' ? 'Menu Trái' : '<SidebarNav />'}
                      renders={renderCounts.sidebar_nav ?? 1}
                      flashing={flashingNodeIds.includes('sidebar_nav')}
                      shieldLabel={activeShields.includes('split_state') ? 'Đã cô lập ✓' : undefined}
                    />
                    <TreeNodeCard
                      label={assistMode === 'visual_guide' ? 'Chân Trang' : '<StatusFooter />'}
                      renders={renderCounts.footer_bar ?? 1}
                      flashing={flashingNodeIds.includes('footer_bar')}
                      shieldLabel={activeShields.includes('split_state') ? 'Đã cô lập ✓' : undefined}
                    />
                  </div>

                  {/* Level 3 Heavy Children */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <TreeNodeCard
                      label={assistMode === 'visual_guide' ? 'Bảng 500 Món' : '<ProductGrid (500) />'}
                      renders={renderCounts.post_list ?? 1}
                      flashing={flashingNodeIds.includes('post_list')}
                      shieldLabel={activeShields.includes('memo_grid') ? 'React.memo ✓' : undefined}
                    />
                    <TreeNodeCard
                      label={assistMode === 'visual_guide' ? 'Biểu Đồ Nặng' : '<HeavyChart />'}
                      renders={renderCounts.heavy_chart ?? 1}
                      flashing={flashingNodeIds.includes('heavy_chart')}
                      shieldLabel={activeShields.includes('virtual_list') ? 'Virtualize ✓' : undefined}
                    />
                  </div>
                </div>

                {/* Real-Life Visual App Impact Strip */}
                <div className="rounded-lg border border-slate-800 bg-[#0A101C] p-3 text-xs space-y-1.5">
                  <p className="font-mono text-[11px] text-sky-300 font-bold">
                    Trạng thái thực tế trên màn hình người dùng:
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    {activeShields.length === 0
                      ? '⚠ Chưa có lá chắn: Mỗi phím gõ đang bắt cả Menu Trái, Bảng 500 Món và Biểu Đồ Nặng vẽ lại từ đầu!'
                      : treeFps >= activeTreeLevel.targetFps
                        ? `✓ Mượt mà (${treeFps} FPS): Người dùng gõ tìm kiếm tức thì, các phần nặng không bị vẽ lại vô ích!`
                        : `Cần thêm tối ưu (đang ${treeFps} FPS / mục tiêu ${activeTreeLevel.targetFps} FPS): Vẫn còn khối nặng đang bị vẽ lại theo nhịp gõ.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TreeNodeCard({
  label,
  renders,
  flashing,
  shieldLabel,
}: {
  label: string;
  renders: number;
  flashing: boolean;
  shieldLabel?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-3 font-mono transition-colors duration-150 ${
        flashing
          ? 'border-rose-400 bg-rose-950/60 ring-2 ring-rose-500/60'
          : shieldLabel
            ? 'border-emerald-400/70 bg-emerald-950/25'
            : 'border-slate-700 bg-[#0D1422]'
      }`}
    >
      <div className="text-xs font-bold text-white truncate">{label}</div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] tabular-nums">
        <span className={flashing ? 'text-rose-300 font-bold' : 'text-slate-400'}>
          số lần vẽ: {renders}
        </span>
        {shieldLabel && <span className="text-emerald-300 font-semibold">{shieldLabel}</span>}
      </div>
    </div>
  );
}
