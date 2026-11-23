import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  ArrowLeft,
  Cat,
  Check,
  Download,
  Eye,
  Flame,
  Heart,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Music,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Sun,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CAT_DIFFICULTIES,
  CAT_MAX_ZOOM,
  CAT_MIN_ZOOM,
  CAT_SCENE_H,
  CAT_SCENE_W,
  CAT_STAGES,
  advanceCoverTapState,
  applyCatMisclickPenalty,
  clampCatPanZoom,
  computeCatStageLayoutSignature,
  computeCatStageStars,
  countCollectedSecretCats,
  createInitialStageSave,
  getActiveCatTargetQueue,
  getCatDifficultyConfig,
  getEffectiveItemScale,
  getMainStages,
  getOpenedCoverIdsFromMap,
  getRegularItems,
  getSecretCatItem,
  isCatItemAccessible,
  isCoverFullyOpen,
  isItemAllowedByQueue,
  isStageUnlocked,
  parseCatFinderSave,
  pickCatHintTarget,
  randomizeCatStageLayout,
  updateComboOnFind,
  type CatDifficultyId,
  type CatFinderSaveData,
  type CatHintTarget,
  type CatItemDef,
  type CatPanZoom,
  type CatStageDef,
} from '../utils/catFinderEngine.ts';
import { catFinderAudio } from '../utils/catFinderAudio.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import {
  CatDecoyGraphic,
  CatItemGraphic,
  CatThumbnailIcon,
  CatTownMapSvg,
  CatWorldBackdrop,
  renderCatCoverProp,
} from './CatFinderArt.tsx';

interface CatFinderGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
}

type CatGameScreen = 'TITLE' | 'PLAYING' | 'VICTORY' | 'GAMEOVER';

interface PopBurstFx {
  id: number;
  xPct: number;
  yPct: number;
  isSecret: boolean;
  comboCount: number;
}

interface FloatingNoticeFx {
  id: number;
  xPct: number;
  yPct: number;
  text: string;
  tone: 'miss' | 'latch' | 'queue';
}

const STORAGE_KEY = 'thuanle-cat-finder-v2';

function loadCatSave(): CatFinderSaveData {
  if (typeof window === 'undefined') return parseCatFinderSave(null);
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem('thuanle-cat-finder-v1');
    return parseCatFinderSave(raw);
  } catch {
    return parseCatFinderSave(null);
  }
}

function saveCatProgress(data: CatFinderSaveData) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function drawShareCardDataUrl(opts: {
  stageTitle: string;
  difficultyLabel: string;
  stars: number;
  hearts: number;
  maxHearts: number;
  maxCombo: number;
  foundCount: number;
  totalCount: number;
  foundSecret: boolean;
}): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFF7FA';
  ctx.fillRect(0, 0, 960, 540);

  ctx.strokeStyle = '#FFA8BE';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 912, 492);
  ctx.strokeStyle = '#5A3E44';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(36, 36, 888, 468);

  ctx.fillStyle = '#DB527E';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`TÌM MÈO & ĐỒ XINH · ${opts.difficultyLabel.toUpperCase()}`, 68, 92);

  ctx.fillStyle = '#5A3E44';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(opts.stageTitle, 68, 148);

  ctx.font = '44px sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < opts.stars ? '#FBBF24' : '#F0DCE3';
    ctx.fillText('★', 68 + i * 56, 212);
  }

  const boxes = [
    { label: 'ĐỒ XINH', value: `${opts.foundCount}/${opts.totalCount}` },
    { label: 'TIM CÒN LẠI', value: `${opts.hearts}/${opts.maxHearts}` },
    { label: 'COMBO MAX', value: `×${opts.maxCombo}` },
  ];
  boxes.forEach((box, idx) => {
    const bx = 68 + idx * 195;
    const by = 250;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bx, by, 175, 118);
    ctx.strokeStyle = '#F3C8D8';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 175, 118);

    ctx.fillStyle = '#9D7782';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(box.label, bx + 18, by + 34);

    ctx.fillStyle = '#5A3E44';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(box.value, bx + 18, by + 88);
  });

  ctx.fillStyle = opts.foundSecret ? '#FEF3C7' : '#FFF0F5';
  ctx.fillRect(68, 396, 565, 66);
  ctx.strokeStyle = opts.foundSecret ? '#F59E0B' : '#F3C8D8';
  ctx.lineWidth = 2;
  ctx.strokeRect(68, 396, 565, 66);
  ctx.fillStyle = '#5A3E44';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(
    opts.foundSecret
      ? '★ Đã tìm thấy Bé Mèo Vàng Bí Mật!'
      : '☆ Bé Mèo Vàng Bí Mật đang chờ bạn quay lại tìm',
    90,
    436
  );

  // Kawaii Golden Cat Mascot
  ctx.save();
  ctx.translate(780, 290);
  ctx.fillStyle = '#FDE68A';
  ctx.strokeStyle = '#5A3E44';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 48, 66, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -34, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-46, -64);
  ctx.lineTo(-34, -108);
  ctx.lineTo(-8, -80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(46, -64);
  ctx.lineTo(34, -108);
  ctx.lineTo(8, -80);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Pink inner ears
  ctx.fillStyle = '#FFB3C6';
  ctx.beginPath();
  ctx.moveTo(-38, -68);
  ctx.lineTo(-31, -94);
  ctx.lineTo(-16, -78);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(38, -68);
  ctx.lineTo(31, -94);
  ctx.lineTo(16, -78);
  ctx.closePath();
  ctx.fill();
  // Eyes + white anime catchlights
  ctx.fillStyle = '#5A3E44';
  ctx.beginPath();
  ctx.arc(-18, -36, 5.5, 0, Math.PI * 2);
  ctx.arc(18, -36, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(-19.5, -38, 2, 0, Math.PI * 2);
  ctx.arc(16.5, -38, 2, 0, Math.PI * 2);
  ctx.fill();
  // Rosy cheek blushes
  ctx.fillStyle = '#FF97B5';
  ctx.beginPath();
  ctx.arc(-30, -22, 8.5, 0, Math.PI * 2);
  ctx.arc(30, -22, 8.5, 0, Math.PI * 2);
  ctx.fill();
  // Pink ribbon bow on collar
  ctx.fillStyle = '#F472B6';
  ctx.strokeStyle = '#5A3E44';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.lineTo(-18, 2);
  ctx.lineTo(-18, 22);
  ctx.closePath();
  ctx.moveTo(0, 12);
  ctx.lineTo(18, 2);
  ctx.lineTo(18, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export function CatFinderGameSection({
  theme: _theme,
  onToggleTheme: _onToggleTheme,
  isFullscreen = false,
  onToggleFullscreen,
  onExitFullscreen: _onExitFullscreen,
}: CatFinderGameSectionProps) {
  const [saveData, setSaveData] = useState<CatFinderSaveData>(() => {
    const initial = loadCatSave();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const d = params.get('difficulty');
      if (d === 'hard_5x' || d === 'nightmare_8x' || d === 'eagle_10x' || d === 'god_ray_20x') {
        return { ...initial, difficultyId: d };
      }
    }
    return initial;
  });

  const [screen, setScreen] = useState<CatGameScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'PLAYING';
    }
    return 'TITLE';
  });

  const diffConfig = useMemo(
    () => getCatDifficultyConfig(saveData.difficultyId),
    [saveData.difficultyId]
  );

  const [coverTapCounts, setCoverTapCounts] = useState<Record<string, number>>({});
  const [coverOpenedAtMs, setCoverOpenedAtMs] = useState<Record<string, number>>({});
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hearts, setHearts] = useState<number>(() => diffConfig.maxHearts);
  const heartsRef = useRef<number>(diffConfig.maxHearts);
  const [comboStreak, setComboStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1);
  const [lastFindAtMs, setLastFindAtMs] = useState<number | null>(null);
  const [activeHint, setActiveHint] = useState<CatHintTarget | null>(null);
  const [popBursts, setPopBursts] = useState<PopBurstFx[]>([]);
  const [floatingNotices, setFloatingNotices] = useState<FloatingNoticeFx[]>([]);
  const [shakeCount, setShakeCount] = useState(0);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [loadingStageTitle, setLoadingStageTitle] = useState<string | null>(null);

  const [muted, setMuted] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const [panZoom, setPanZoom] = useState<CatPanZoom>({ scale: 1, panX: 0, panY: 0 });
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 1080,
    height: 540,
  });

  const recentLayoutSigsRef = useRef<Record<string, string[]>>({});
  const [activeRunStage, setActiveRunStage] = useState<CatStageDef>(() => {
    const initialBase = CAT_STAGES.find((s) => s.id === saveData.activeStageId) ?? CAT_STAGES[0];
    return randomizeCatStageLayout(initialBase).stage;
  });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const spotlightOverlayRef = useRef<HTMLDivElement | null>(null);
  const godRayLensRef = useRef<HTMLDivElement | null>(null);
  const startRafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
    pointerType: string;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
    moved: false,
    pointerType: 'mouse',
  });

  const pinchRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    initDist: number;
    initScale: number;
    wasPinching: boolean;
  }>({
    pointers: new Map(),
    initDist: 0,
    initScale: 1,
    wasPinching: false,
  });

  const baseStage: CatStageDef = useMemo(
    () => CAT_STAGES.find((s) => s.id === saveData.activeStageId) ?? CAT_STAGES[0],
    [saveData.activeStageId]
  );

  const activeStage: CatStageDef = screen === 'TITLE' ? baseStage : activeRunStage;

  const stageSave = useMemo(
    () => saveData.stages[activeStage.id] ?? createInitialStageSave(),
    [saveData.stages, activeStage.id]
  );

  const regularItems = useMemo(() => getRegularItems(activeStage), [activeStage]);
  const secretCatItem = useMemo(() => getSecretCatItem(activeStage), [activeStage]);

  const foundSet = useMemo(() => new Set(stageSave.foundItemIds), [stageSave.foundItemIds]);
  const regularFoundCount = useMemo(
    () => regularItems.filter((it) => foundSet.has(it.id)).length,
    [regularItems, foundSet]
  );

  const openedCoverIds = useMemo(
    () => getOpenedCoverIdsFromMap(activeStage, coverTapCounts),
    [activeStage, coverTapCounts]
  );

  const activeQueue = useMemo(
    () => getActiveCatTargetQueue(activeStage, stageSave.foundItemIds, diffConfig.activeQueueLimit),
    [activeStage, stageSave.foundItemIds, diffConfig.activeQueueLimit]
  );

  const secretCatCollectedTotal = useMemo(
    () => countCollectedSecretCats(saveData),
    [saveData]
  );

  const unlockedSet = useMemo(() => {
    const s = new Set<string>();
    for (const st of CAT_STAGES) {
      if (isStageUnlocked(st.id, saveData)) s.add(st.id);
    }
    return s;
  }, [saveData]);

  const clearedSet = useMemo(() => {
    const s = new Set<string>();
    for (const st of CAT_STAGES) {
      if (saveData.stages[st.id]?.cleared) s.add(st.id);
    }
    return s;
  }, [saveData]);

  const secretMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const st of CAT_STAGES) {
      m[st.id] = Boolean(saveData.stages[st.id]?.foundSecretCat);
    }
    return m;
  }, [saveData]);

  const hintsRemaining = Math.max(0, diffConfig.maxHints - hintsUsed);

  const pushFloatingNotice = useCallback(
    (xPct: number, yPct: number, text: string, tone: FloatingNoticeFx['tone']) => {
      const id = Date.now() + Math.floor(Math.random() * 10000);
      setFloatingNotices((prev) => [...prev.slice(-4), { id, xPct, yPct, text, tone }]);
      window.setTimeout(() => {
        setFloatingNotices((prev) => prev.filter((n) => n.id !== id));
      }, 900);
    },
    []
  );

  // Record initial randomized run signature on mount so first replay never repeats
  useEffect(() => {
    const sig = computeCatStageLayoutSignature(activeRunStage);
    const list = recentLayoutSigsRef.current[activeRunStage.id] ?? [];
    if (!list.includes(sig)) {
      recentLayoutSigsRef.current[activeRunStage.id] = [...list.slice(-7), sig];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist save state
  useEffect(() => {
    saveCatProgress(saveData);
  }, [saveData]);

  // Sync game state to body dataset
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.state =
      screen === 'TITLE'
        ? 'title'
        : screen === 'GAMEOVER'
        ? 'gameover'
        : screen === 'VICTORY'
        ? 'victory'
        : 'playing';
    return () => {
      delete document.body.dataset.state;
    };
  }, [screen]);

  // Optional music-box BGM
  useEffect(() => {
    if (bgmOn && !muted && screen === 'PLAYING') {
      catFinderAudio.startBgm();
    } else {
      catFinderAudio.stopBgm();
    }
    return () => {
      catFinderAudio.stopBgm();
    };
  }, [bgmOn, muted, screen]);

  // Auto-closing covers in x8, x10, and x20 modes (no countdown timer pressure!)
  useEffect(() => {
    if (screen !== 'PLAYING' || diffConfig.coverAutoCloseSec === null) return;
    const ttlMs = diffConfig.coverAutoCloseSec * 1000;
    const t = window.setInterval(() => {
      const now = Date.now();
      setCoverOpenedAtMs((prevOpenedAt) => {
        const expiredIds = Object.entries(prevOpenedAt)
          .filter(([, openedAt]) => now - openedAt >= ttlMs)
          .map(([id]) => id);
        if (expiredIds.length === 0) return prevOpenedAt;
        const nextOpenedAt = { ...prevOpenedAt };
        for (const id of expiredIds) delete nextOpenedAt[id];
        setCoverTapCounts((prevTaps) => {
          const nextTaps = { ...prevTaps };
          for (const id of expiredIds) delete nextTaps[id];
          return nextTaps;
        });
        return nextOpenedAt;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [screen, diffConfig.coverAutoCloseSec]);

  useEffect(() => {
    return () => {
      if (startRafRef.current !== null) {
        window.cancelAnimationFrame(startRafRef.current);
      }
    };
  }, []);

  const commitStartStage = useCallback(
    (targetId: string, targetDiffId: CatDifficultyId, forceReset: boolean) => {
      const targetDiff = getCatDifficultyConfig(targetDiffId);
      const targetBaseStage = CAT_STAGES.find((s) => s.id === targetId) ?? CAT_STAGES[0];
      const recentSigs = recentLayoutSigsRef.current[targetId] ?? [];
      const { stage: randomizedStage, signature } = randomizeCatStageLayout(targetBaseStage, {
        recentSignatures: recentSigs,
      });
      recentLayoutSigsRef.current[targetId] = [...recentSigs.slice(-7), signature];
      setActiveRunStage(randomizedStage);

      catFinderAudio.playRevealSound(muted);

      setSaveData((prev) => ({
        ...prev,
        activeStageId: targetId,
        difficultyId: targetDiff.id,
        stages: {
          ...prev.stages,
          [targetId]: {
            ...(prev.stages[targetId] ?? createInitialStageSave()),
            foundItemIds: forceReset ? [] : prev.stages[targetId]?.foundItemIds ?? [],
          },
        },
      }));

      setCoverTapCounts({});
      setCoverOpenedAtMs({});
      setHintsUsed(0);
      heartsRef.current = targetDiff.maxHearts;
      setHearts(targetDiff.maxHearts);
      setComboStreak(0);
      setMaxCombo(1);
      setLastFindAtMs(null);
      setActiveHint(null);
      setPopBursts([]);
      setFloatingNotices([]);
      setSharePreviewUrl(null);
      setPanZoom({ scale: 1, panX: 0, panY: 0 });
      setScreen('PLAYING');
      if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [muted]
  );

  const startStage = useCallback(
    (stageId?: string, forceReset = true, overrideDiffId?: CatDifficultyId) => {
      if (isStarting) return;
      const targetId = stageId ?? activeStage.id;
      if (!isStageUnlocked(targetId, saveData)) return;
      const targetStageObj = CAT_STAGES.find((s) => s.id === targetId) ?? activeStage;
      const targetDiffId = overrideDiffId ?? saveData.difficultyId;

      // Unlock audio synchronously inside user gesture for iOS Safari
      catFinderAudio.unlock();

      // Immediately render responsive loading feedback on frame 0 before heavy SVG mount
      setIsStarting(true);
      setLoadingStageTitle(targetStageObj.title);

      if (startRafRef.current !== null) {
        window.cancelAnimationFrame(startRafRef.current);
      }
      startRafRef.current = window.requestAnimationFrame(() => {
        startRafRef.current = window.requestAnimationFrame(() => {
          commitStartStage(targetId, targetDiffId, forceReset);
          startRafRef.current = window.requestAnimationFrame(() => {
            setIsStarting(false);
            setLoadingStageTitle(null);
            startRafRef.current = null;
          });
        });
      });
    },
    [isStarting, activeStage, saveData, commitStartStage]
  );

  // Enter / Space starts from Title Screen
  useEffect(() => {
    if (screen !== 'TITLE') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startStage();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, startStage]);

  const stageDisplayW = useMemo(() => {
    const aspectW = Math.round(viewportSize.height * (CAT_SCENE_W / CAT_SCENE_H));
    return Math.max(200, Math.min(viewportSize.width, aspectW));
  }, [viewportSize.width, viewportSize.height]);

  // Track scene viewport bounds responsively (especially across F11 fullscreen & mobile resize)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || screen !== 'PLAYING') return;
    const syncSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };
    syncSize();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(syncSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [screen, isFullscreen]);

  // Keep pan/zoom cleanly clamped whenever viewport dimensions or fullscreen mode change
  useEffect(() => {
    setPanZoom((prev) =>
      clampCatPanZoom(
        prev.scale,
        prev.panX,
        prev.panY,
        viewportSize.width,
        viewportSize.height,
        stageDisplayW
      )
    );
  }, [viewportSize.width, viewportSize.height, stageDisplayW]);

  const applyZoom = useCallback(
    (nextScale: number, nextX?: number, nextY?: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      const vw = rect?.width ?? viewportSize.width;
      const vh = rect?.height ?? viewportSize.height;
      setPanZoom((prev) =>
        clampCatPanZoom(nextScale, nextX ?? prev.panX, nextY ?? prev.panY, vw, vh, stageDisplayW)
      );
    },
    [viewportSize.width, viewportSize.height, stageDisplayW]
  );

  const handleToggleCover = useCallback(
    (coverId: string) => {
      const cover = activeStage.covers.find((c) => c.id === coverId);
      if (!cover) return;
      catFinderAudio.unlock();

      const curTaps = coverTapCounts[coverId] ?? 0;
      const step = advanceCoverTapState(cover, curTaps);

      setCoverTapCounts((prev) => ({ ...prev, [coverId]: step.nextTaps }));
      if (step.nowOpen) {
        catFinderAudio.playRevealSound(muted);
        setCoverOpenedAtMs((prev) => ({ ...prev, [coverId]: Date.now() }));
        if (cover.isDecoy) {
          pushFloatingNotice(
            ((cover.x + cover.w / 2) / CAT_SCENE_W) * 100,
            ((cover.y + cover.h / 2) / CAT_SCENE_H) * 100,
            'Hộp rỗng!',
            'queue'
          );
        }
      } else if (step.unlockedLatchStep) {
        catFinderAudio.playUnlockLatchSound(muted);
        pushFloatingNotice(
          ((cover.x + cover.w / 2) / CAT_SCENE_W) * 100,
          ((cover.y + cover.h * 0.25) / CAT_SCENE_H) * 100,
          'Mở chốt! Chạm lần 2',
          'latch'
        );
      } else {
        catFinderAudio.playRevealSound(muted);
        setCoverOpenedAtMs((prev) => {
          const next = { ...prev };
          delete next[coverId];
          return next;
        });
      }

      if (step.nowOpen && activeHint?.needsCoverId === coverId) {
        setActiveHint((prev) =>
          prev
            ? {
                ...prev,
                needsCoverId: null,
                x: prev.item.x,
                y: prev.item.y,
              }
            : null
        );
      }
    },
    [activeStage.covers, coverTapCounts, muted, activeHint, pushFloatingNotice]
  );

  const handleMisclick = useCallback(
    (clientX: number, clientY: number) => {
      if (screen !== 'PLAYING') return;
      const rect = viewportRef.current?.getBoundingClientRect();
      const xPct = rect ? Math.max(8, Math.min(92, ((clientX - rect.left) / rect.width) * 100)) : 50;
      const yPct = rect ? Math.max(10, Math.min(90, ((clientY - rect.top) / rect.height) * 100)) : 50;

      catFinderAudio.unlock();
      catFinderAudio.playMissSound(muted);

      const res = applyCatMisclickPenalty(heartsRef.current);
      heartsRef.current = res.nextHearts;
      setHearts(res.nextHearts);
      setComboStreak(0);
      setShakeCount((c) => c + 1);

      pushFloatingNotice(xPct, yPct, '✖ -1❤️', 'miss');

      if (res.isGameOver) {
        catFinderAudio.playGameOverSound(muted);
        window.setTimeout(() => {
          setScreen('GAMEOVER');
        }, 220);
      }
    },
    [screen, muted, pushFloatingNotice]
  );

  const handleCollectItem = useCallback(
    (item: CatItemDef) => {
      if (foundSet.has(item.id)) return;
      if (!isCatItemAccessible(item, openedCoverIds)) return;

      if (!isItemAllowedByQueue(item, activeQueue)) {
        catFinderAudio.unlock();
        catFinderAudio.playUnlockLatchSound(muted);
        pushFloatingNotice(
          (item.x / CAT_SCENE_W) * 100,
          (item.y / CAT_SCENE_H) * 100,
          'Chưa tới lượt món này!',
          'queue'
        );
        return;
      }

      const now = Date.now();
      const combo = updateComboOnFind(comboStreak, lastFindAtMs, now);
      setComboStreak(combo.nextStreak);
      setLastFindAtMs(combo.nextLastFindAtMs);
      setMaxCombo((prev) => Math.max(prev, combo.nextStreak));

      catFinderAudio.unlock();
      catFinderAudio.playFindSound(item.soundCategory, muted, combo.nextStreak);

      const burstId = now + Math.floor(Math.random() * 1000);
      setPopBursts((prev) => [
        ...prev.slice(-4),
        {
          id: burstId,
          xPct: (item.x / CAT_SCENE_W) * 100,
          yPct: (item.y / CAT_SCENE_H) * 100,
          isSecret: Boolean(item.isSecretGoldenCat),
          comboCount: combo.nextStreak,
        },
      ]);
      window.setTimeout(() => {
        setPopBursts((prev) => prev.filter((b) => b.id !== burstId));
      }, 650);

      if (activeHint?.item.id === item.id) {
        setActiveHint(null);
      }

      const nextFound = [...stageSave.foundItemIds, item.id];
      const nextSecret = stageSave.foundSecretCat || Boolean(item.isSecretGoldenCat);
      const nextRegularDone = regularItems.every((r) => nextFound.includes(r.id));

      setSaveData((prev) => {
        const cur = prev.stages[activeStage.id] ?? createInitialStageSave();
        const starsNow = nextRegularDone
          ? computeCatStageStars(
              hintsUsed,
              nextSecret,
              hearts,
              diffConfig.maxHearts
            )
          : cur.bestStars;
        return {
          ...prev,
          stages: {
            ...prev.stages,
            [activeStage.id]: {
              foundItemIds: nextFound,
              foundSecretCat: nextSecret,
              cleared: cur.cleared || nextRegularDone,
              bestStars: Math.max(cur.bestStars, starsNow),
              bestTimeSec: cur.bestTimeSec,
              bestCombo: Math.max(cur.bestCombo, combo.nextStreak),
            },
          },
        };
      });

      if (nextRegularDone) {
        catFinderAudio.playVictorySound(muted);
        window.setTimeout(() => {
          setScreen('VICTORY');
        }, 420);
      }
    },
    [
      foundSet,
      openedCoverIds,
      activeQueue,
      comboStreak,
      lastFindAtMs,
      muted,
      activeHint,
      stageSave.foundItemIds,
      stageSave.foundSecretCat,
      regularItems,
      activeStage.id,
      hintsUsed,
      hearts,
      diffConfig.maxHearts,
      pushFloatingNotice,
    ]
  );

  const handleUseHint = useCallback(() => {
    if (hintsRemaining <= 0) return;
    const target = pickCatHintTarget(
      activeStage,
      stageSave.foundItemIds,
      openedCoverIds,
      diffConfig.activeQueueLimit
    );
    if (!target) return;
    catFinderAudio.unlock();
    catFinderAudio.playHintSound(muted);
    setHintsUsed((prev) => prev + 1);
    setActiveHint(target);

    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const targetPanX = ((CAT_SCENE_W / 2 - target.x) / CAT_SCENE_W) * rect.width * panZoom.scale;
      const targetPanY = ((CAT_SCENE_H / 2 - target.y) / CAT_SCENE_H) * rect.height * panZoom.scale;
      applyZoom(Math.max(1.35, panZoom.scale), targetPanX, targetPanY);
    }
  }, [
    hintsRemaining,
    activeStage,
    stageSave.foundItemIds,
    openedCoverIds,
    diffConfig.activeQueueLimit,
    muted,
    panZoom.scale,
    applyZoom,
  ]);

  const handleGenerateShareCard = useCallback(() => {
    const stars = computeCatStageStars(
      hintsUsed,
      stageSave.foundSecretCat,
      hearts,
      diffConfig.maxHearts
    );
    const dataUrl = drawShareCardDataUrl({
      stageTitle: activeStage.title,
      difficultyLabel: diffConfig.label,
      stars,
      hearts,
      maxHearts: diffConfig.maxHearts,
      maxCombo,
      foundCount: regularItems.length,
      totalCount: regularItems.length,
      foundSecret: stageSave.foundSecretCat,
    });
    if (!dataUrl) return;
    setSharePreviewUrl(dataUrl);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `tim-meo-${activeStage.id}-${saveData.difficultyId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [
    hintsUsed,
    stageSave.foundSecretCat,
    hearts,
    diffConfig.maxHearts,
    diffConfig.label,
    activeStage.title,
    activeStage.id,
    maxCombo,
    regularItems.length,
    saveData.difficultyId,
  ]);

  const updateSpotlightFromClient = (clientX: number, clientY: number, pointerType = 'mouse') => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const touchOffsetY = pointerType === 'touch' ? -34 : 0;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY + touchOffsetY - rect.top) / rect.height) * 100));
    const xStr = `${x.toFixed(2)}%`;
    const yStr = `${y.toFixed(2)}%`;
    if (spotlightOverlayRef.current) {
      spotlightOverlayRef.current.style.setProperty('--spot-x', xStr);
      spotlightOverlayRef.current.style.setProperty('--spot-y', yStr);
    }
    if (godRayLensRef.current) {
      godRayLensRef.current.style.left = xStr;
      godRayLensRef.current.style.top = yStr;
    }
  };

  // Pointer Pan & Pinch Handlers
  const handleStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    updateSpotlightFromClient(e.clientX, e.clientY, e.pointerType);
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current.pointers.size === 2) {
      const pts = Array.from(pinchRef.current.pointers.values());
      pinchRef.current.initDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current.initScale = panZoom.scale;
      pinchRef.current.wasPinching = true;
      dragRef.current.active = false;
      return;
    }
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: panZoom.panX,
      origPanY: panZoom.panY,
      moved: false,
      pointerType: e.pointerType || 'mouse',
    };
  };

  const handleStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (diffConfig.spotlightRadius !== null) {
      updateSpotlightFromClient(e.clientX, e.clientY, e.pointerType);
    }
    if (pinchRef.current.pointers.has(e.pointerId)) {
      pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pinchRef.current.pointers.size === 2 && pinchRef.current.initDist > 0) {
      const pts = Array.from(pinchRef.current.pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      applyZoom(pinchRef.current.initScale * (dist / pinchRef.current.initDist));
      return;
    }
    if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const dragThreshold = dragRef.current.pointerType === 'touch' ? 11 : 7;
    if (Math.hypot(dx, dy) > dragThreshold) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      applyZoom(panZoom.scale, dragRef.current.origPanX + dx, dragRef.current.origPanY + dy);
    }
  };

  const handleStagePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pinchRef.current.pointers.delete(e.pointerId);
    if (pinchRef.current.pointers.size === 0 && pinchRef.current.wasPinching) {
      window.setTimeout(() => {
        pinchRef.current.wasPinching = false;
      }, 150);
    }
    if (dragRef.current.pointerId === e.pointerId) {
      dragRef.current.active = false;
      window.setTimeout(() => {
        dragRef.current.moved = false;
      }, dragRef.current.pointerType === 'touch' ? 85 : 40);
    }
  };

  const handleWheelZoom = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    applyZoom(panZoom.scale + (e.deltaY < 0 ? 0.25 : -0.25));
  };

  const nextUnlockedStage = useMemo(() => {
    return CAT_STAGES.find(
      (s) => s.order === activeStage.order + 1 && unlockedSet.has(s.id)
    );
  }, [activeStage.order, unlockedSet]);

  const difficultyList = useMemo(
    () => [
      CAT_DIFFICULTIES.hard_5x,
      CAT_DIFFICULTIES.nightmare_8x,
      CAT_DIFFICULTIES.eagle_10x,
      CAT_DIFFICULTIES.god_ray_20x,
    ],
    []
  );

  const isGodRayMode = diffConfig.id === 'god_ray_20x';
  const isTouchViewport = viewportSize.width < 768;

  const renderedDecoys = useMemo(
    () =>
      activeStage.decoys.map((dec) => (
        <g
          key={dec.id}
          transform={`translate(${dec.x}, ${dec.y}) rotate(${dec.rotateDeg ?? 0}) scale(${dec.scale ?? 0.72})`}
          opacity={dec.opacity ?? 0.86}
        >
          <CatDecoyGraphic artKey={dec.artKey} mutedTint={dec.mutedTint} />
        </g>
      )),
    [activeStage]
  );

  return (
    <section
      aria-label="Tìm Mèo và Đồ Xinh"
      className={`relative bg-[#FFF9FC] text-[#5A3E44] overflow-hidden ${
        isFullscreen
          ? 'rounded-none border-0 shadow-none h-full flex-1 flex flex-col min-h-0'
          : 'rounded-2xl border border-[#F3C8D8] shadow-[0_14px_38px_-16px_rgba(219,82,126,0.22)]'
      }`}
    >
      {/* Non-blocking Pastel Loading Veil while preparing stage SVG */}
      {isStarting && (
        <div
          data-testid="cat-loading-overlay"
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-50 bg-[#FFF9FC]/96 flex flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFE4EE] border-2 border-[#5A3E44] flex items-center justify-center shadow-sm">
            <Loader2 className="w-7 h-7 text-[#DB527E] animate-spin" aria-hidden="true" />
          </div>
          <div>
            <p className="font-serif text-lg sm:text-xl font-bold text-[#5A3E44]">
              Đang mở {loadingStageTitle ?? activeStage.title}...
            </p>
            <p className="text-xs text-[#9D7782] mt-0.5">
              Đang giấu ngẫu nhiên mèo xinh &amp; bánh kẹo vào góc tranh mới
            </p>
          </div>
          <div className="w-48 h-2 rounded-full bg-[#FFEAF2] overflow-hidden border border-[#F3C8D8]">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#F06E96] to-[#FBBF24] animate-pulse" />
          </div>
        </div>
      )}
      {/* TITLE & TOWN MAP SCREEN */}
      {screen === 'TITLE' && (
        <div
          className={`p-4 sm:p-6 mobile-ls:p-3 space-y-5 mobile-ls:space-y-3 bg-gradient-to-b from-[#FFFDF9] via-[#FFF8FB] to-[#FFEFF5] ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto touch-pan-y safe-area-top safe-area-x safe-area-bottom' : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#F3D5E1] pb-4 mobile-ls:pb-2.5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFE4EE] to-[#FFD4E5] border-2 border-[#5A3E44] flex items-center justify-center shrink-0 shadow-[0_3px_0_#F3C8D8]">
                <Cat className="w-6 h-6 text-[#DB527E]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A3E44] leading-tight">
                  Tìm Mèo &amp; Đồ Xinh
                </h2>
                <p className="text-xs sm:text-sm text-[#8F6873] mt-0.5">
                  Vị trí đồ xinh ngẫu nhiên mỗi lượt · Không giới hạn thời gian · Sưu tầm Mèo Vàng {secretCatCollectedTotal}/{getMainStages().length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {onToggleFullscreen && (
                <button
                  type="button"
                  data-testid="cat-fullscreen-btn"
                  onClick={onToggleFullscreen}
                  aria-label={isFullscreen ? 'Thu nhỏ màn hình (Esc)' : 'Mở toàn màn hình (F11)'}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border-2 border-[#F0C8D6] bg-white hover:border-[#5A3E44] text-[#5A3E44] text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4" aria-hidden="true" />
                      <span>Thoát (Esc)</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" aria-hidden="true" />
                      <span>Toàn Màn</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                data-start="true"
                data-testid="cat-start-btn"
                disabled={isStarting}
                aria-busy={isStarting}
                onClick={() => startStage()}
                className="flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-b from-[#F47BA0] to-[#DB527E] hover:from-[#EC6B93] hover:to-[#C9446F] disabled:opacity-80 disabled:cursor-wait text-white border-2 border-[#5A3E44] shadow-[0_3px_0_#5A3E44] active:translate-y-[1px] active:shadow-[0_1px_0_#5A3E44] text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Đang tải màn...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Chơi Ngay ({diffConfig.multiplierBadge})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Difficulty Selector (5x / 8x / 10x / 20x Siêu Thần Ánh Xạ) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 mobile-ls:grid-cols-4 lg:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Chọn độ khó Tìm Mèo">
            {difficultyList.map((diff) => {
              const active = saveData.difficultyId === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-testid={`cat-diff-${diff.id}`}
                  onClick={() =>
                    setSaveData((prev) => ({ ...prev, difficultyId: diff.id }))
                  }
                  className={`text-left rounded-xl border-2 p-3 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                    active
                      ? diff.id === 'god_ray_20x'
                        ? 'bg-gradient-to-br from-[#FFF4DB] via-[#FFEBF2] to-[#FCE7F3] border-[#991B1B] shadow-xs'
                        : diff.id === 'eagle_10x'
                        ? 'bg-[#FFF0F5] border-[#BE123C] shadow-xs'
                        : diff.id === 'nightmare_8x'
                        ? 'bg-[#FFF7E6] border-[#D97706] shadow-xs'
                        : 'bg-[#FFF0F6] border-[#DB527E] shadow-xs'
                      : diff.id === 'god_ray_20x'
                      ? 'bg-[#FFFDF6] border-[#F3D2A2] hover:border-[#991B1B]'
                      : 'bg-white border-[#F0D3DF] hover:border-[#DB527E]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#5A3E44] flex items-center gap-1.5">
                      {diff.id === 'god_ray_20x' ? (
                        <Sun className="w-4 h-4 text-[#B45309]" />
                      ) : diff.id === 'eagle_10x' ? (
                        <Eye className="w-4 h-4 text-[#BE123C]" />
                      ) : diff.id === 'nightmare_8x' ? (
                        <Flame className="w-4 h-4 text-[#D97706]" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#DB527E]" />
                      )}
                      {diff.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-extrabold shrink-0 ${
                        diff.id === 'god_ray_20x'
                          ? 'bg-gradient-to-r from-[#991B1B] to-[#D97706] text-amber-100'
                          : diff.id === 'eagle_10x'
                          ? 'bg-[#BE123C] text-white'
                          : diff.id === 'nightmare_8x'
                          ? 'bg-[#D97706] text-white'
                          : 'bg-[#FFE4EE] text-[#C03E6B]'
                      }`}
                    >
                      {diff.multiplierBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A6470] leading-snug">{diff.tagline}</p>
                </button>
              );
            })}
          </div>

          {/* Interactive Pastel Town Map */}
          <div className="rounded-xl overflow-hidden border-2 border-[#F0C8D6] bg-[#FFFDFB]">
            <CatTownMapSvg
              stages={CAT_STAGES}
              unlockedIds={unlockedSet}
              clearedIds={clearedSet}
              secretCounts={secretMap}
              activeStageId={activeStage.id}
              onSelectStage={(id) =>
                setSaveData((prev) => ({ ...prev, activeStageId: id }))
              }
            />
          </div>

          {/* Stage Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {CAT_STAGES.map((st) => {
              const unlocked = unlockedSet.has(st.id);
              const prog = saveData.stages[st.id] ?? createInitialStageSave();
              const isSelected = activeStage.id === st.id;
              const regTotal = getRegularItems(st).length;

              return (
                <button
                  key={st.id}
                  type="button"
                  disabled={!unlocked}
                  data-testid={`cat-stage-card-${st.id}`}
                  onClick={() => {
                    if (isSelected) {
                      startStage(st.id);
                    } else {
                      setSaveData((prev) => ({ ...prev, activeStageId: st.id }));
                    }
                  }}
                  className={`text-left rounded-xl border-2 p-3 transition-colors flex flex-col justify-between gap-2 min-h-[104px] ${
                    !unlocked
                      ? 'bg-[#F8EEF3] border-[#E8D5DF] text-[#9B7F89] cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#FFF0F6] border-[#DB527E] cursor-pointer shadow-xs'
                      : 'bg-white border-[#F0D3DF] hover:border-[#F06E96] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 text-xs font-mono font-bold">
                    <span>{st.isSecretStage ? 'Màn Ẩn' : `Màn ${st.order}`}</span>
                    {!unlocked ? (
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <span className="tabular-nums text-[#C94772]">
                        {regTotal} món · {st.covers.length} hộp
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-sm leading-snug text-[#5A3E44]">
                    {st.title}
                  </div>

                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono">
                    <span className="inline-flex items-center gap-0.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= prog.bestStars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-[#EAD3DC]'
                          }`}
                        />
                      ))}
                    </span>
                    <span className={prog.foundSecretCat ? 'text-amber-600 font-bold' : 'text-[#9F7B87]'}>
                      {st.isSecretStage && !unlocked
                        ? `${secretCatCollectedTotal}/4 ★`
                        : prog.foundSecretCat
                        ? '★ Mèo Vàng'
                        : '☆ Bí mật'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-[#8F6873]">
            Phóng to (tới {CAT_MAX_ZOOM}×) &amp; kéo tranh soi đồ tí hon · Chạm 2 lần với hộp khóa vàng · Vị trí đồ xinh ngẫu nhiên không lặp lại mỗi lượt chơi!
          </p>
        </div>
      )}

      {/* ACTIVE PLAY SCREEN */}
      {screen === 'PLAYING' && (
        <div
          className={`flex flex-col bg-[#FFF6FA] ${
            isFullscreen ? 'flex-1 min-h-0 h-full overflow-hidden' : ''
          }`}
        >
          {/* Single-Row Slim Kawaii Pastel HUD */}
          <div
            data-testid="cat-hud-bar"
            className={`shrink-0 flex flex-nowrap items-center justify-between gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 bg-[#FFFDFB] border-b border-[#F3C8D8] overflow-x-auto no-scrollbar ${
              isFullscreen ? 'safe-area-top safe-area-x' : ''
            }`}
          >
            <div className="flex items-center gap-0.5 sm:gap-1.5 min-w-0 flex-nowrap shrink-0">
              <button
                type="button"
                aria-label="Quay về bản đồ thị trấn"
                onClick={() => setScreen('TITLE')}
                className="w-7 h-7 sm:w-auto sm:min-h-[34px] sm:px-2 rounded-lg border border-[#F0C8D6] bg-white hover:border-[#DB527E] inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#5A3E44] cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Thị Trấn</span>
              </button>

              <span className="hidden md:inline font-bold text-xs text-[#5A3E44] truncate max-w-[110px] lg:max-w-[170px]">
                {activeStage.title}
              </span>

              <span
                data-testid="cat-diff-badge"
                className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold leading-tight shrink-0 ${
                  isGodRayMode
                    ? 'bg-gradient-to-r from-[#991B1B] to-[#D97706] text-amber-100'
                    : diffConfig.id === 'eagle_10x'
                    ? 'bg-[#BE123C] text-white'
                    : diffConfig.id === 'nightmare_8x'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#FFE4EE] text-[#C03E6B]'
                }`}
              >
                {diffConfig.multiplierBadge}
              </span>

              <span
                data-testid="cat-progress-count"
                className="px-1 sm:px-1.5 py-0.5 rounded-md bg-[#FFE4EE] text-[#C03E6B] text-[10px] sm:text-[11px] font-mono font-bold leading-tight tabular-nums shrink-0"
              >
                {regularFoundCount}/{regularItems.length}
              </span>

              {/* Hearts Remaining */}
              <span
                data-testid="cat-hearts"
                aria-label={`Còn ${hearts} trên ${diffConfig.maxHearts} trái tim`}
                className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold leading-tight tabular-nums inline-flex items-center gap-0.5 sm:gap-1 shrink-0 ${
                  hearts <= 2
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-[#FFF0F6] text-[#DB527E]'
                }`}
              >
                <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                <span>
                  {hearts}
                  <span className="hidden min-[460px]:inline">/{diffConfig.maxHearts}</span>
                </span>
              </span>

              {/* Secret Golden Cat Bonus Objective Pill */}
              <span
                data-testid="cat-secret-pill"
                title={`Mục tiêu phụ: Bé Mèo Vàng Bí Mật (${stageSave.foundSecretCat ? '1/1' : '0/1'})`}
                aria-label={`Mục tiêu phụ Bé Mèo Vàng Bí Mật: ${stageSave.foundSecretCat ? '1 trên 1' : '0 trên 1'}`}
                className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold leading-tight tabular-nums inline-flex items-center gap-0.5 shrink-0 border ${
                  stageSave.foundSecretCat
                    ? 'bg-[#FDE68A] border-[#D97706] text-[#78350F]'
                    : 'bg-[#FEF7E6] border-[#E7C983] text-[#8A5A10]'
                }`}
              >
                <Star
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                    stageSave.foundSecretCat
                      ? 'fill-amber-500 text-amber-700'
                      : 'text-amber-600'
                  }`}
                  aria-hidden="true"
                />
                <span>{stageSave.foundSecretCat ? '1/1' : '0/1'}</span>
              </span>

              {comboStreak >= 2 && (
                <span
                  data-testid="cat-combo-badge"
                  className="px-1 sm:px-1.5 py-0.5 rounded-md bg-amber-300 text-[#5A3E44] text-[10px] sm:text-[11px] font-mono font-extrabold leading-tight tabular-nums shrink-0"
                >
                  ×{comboStreak}
                </span>
              )}
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1.5 font-mono flex-nowrap justify-end shrink-0">
              <button
                type="button"
                data-testid="cat-hint-btn"
                disabled={hintsRemaining <= 0}
                onClick={handleUseHint}
                aria-label={`Gợi ý vùng tìm (còn ${hintsRemaining})`}
                className="h-7 sm:min-h-[34px] px-1.5 sm:px-2.5 rounded-lg border-2 border-[#D98A14] bg-gradient-to-b from-[#FFE68E] to-[#F9CB50] hover:from-[#FFDF70] hover:to-[#F6BE2D] disabled:opacity-45 disabled:cursor-not-allowed text-[#432805] text-[11px] sm:text-xs font-extrabold inline-flex items-center gap-0.5 sm:gap-1 shadow-xs cursor-pointer shrink-0"
              >
                <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
                <span className="hidden lg:inline">Gợi Ý</span>
                <span className="tabular-nums">({hintsRemaining})</span>
              </button>

              <div className="flex items-center rounded-lg border border-[#F0C8D6] bg-white overflow-hidden shrink-0">
                <button
                  type="button"
                  data-testid="cat-zoom-out-btn"
                  aria-label="Thu nhỏ"
                  onClick={() => applyZoom(panZoom.scale - 0.45)}
                  disabled={panZoom.scale <= CAT_MIN_ZOOM}
                  className="h-[26px] sm:min-h-[32px] w-6 sm:w-8 flex items-center justify-center text-[#5A3E44] hover:bg-[#FFF0F6] disabled:text-[#A3818B] disabled:opacity-55 border-r border-[#F5DCE5] cursor-pointer"
                >
                  <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
                </button>
                <button
                  type="button"
                  data-testid="cat-zoom-reset-btn"
                  aria-label="Đưa về 1x"
                  onClick={() => setPanZoom({ scale: 1, panX: 0, panY: 0 })}
                  className="h-[26px] sm:min-h-[32px] px-1 sm:px-1.5 text-[10px] sm:text-[11px] font-bold text-[#5A3E44] tabular-nums cursor-pointer"
                >
                  {panZoom.scale.toFixed(1)}×
                </button>
                <button
                  type="button"
                  data-testid="cat-zoom-in-btn"
                  aria-label="Phóng to"
                  onClick={() => applyZoom(panZoom.scale + 0.45)}
                  disabled={panZoom.scale >= CAT_MAX_ZOOM}
                  className="h-[26px] sm:min-h-[32px] w-6 sm:w-8 flex items-center justify-center text-[#5A3E44] hover:bg-[#FFF0F6] disabled:text-[#A3818B] disabled:opacity-55 border-l border-[#F5DCE5] cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.4]" />
                </button>
              </div>

              <button
                type="button"
                aria-label={bgmOn ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
                onClick={() => {
                  catFinderAudio.unlock();
                  setBgmOn((v) => !v);
                }}
                className={`hidden min-[460px]:flex h-7 sm:min-h-[34px] w-7 sm:w-8 rounded-lg border items-center justify-center cursor-pointer shrink-0 ${
                  bgmOn
                    ? 'border-[#F06E96] bg-[#FFE4EE] text-[#C03E6B]'
                    : 'border-[#F0C8D6] bg-white text-[#7A5761] hover:bg-[#FFF5F8]'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                onClick={() => setMuted((v) => !v)}
                className="h-7 sm:min-h-[34px] w-7 sm:w-8 rounded-lg border border-[#F0C8D6] bg-white text-[#7A5761] hover:bg-[#FFF5F8] flex items-center justify-center cursor-pointer shrink-0"
              >
                {muted ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>

              {onToggleFullscreen && (
                <button
                  type="button"
                  data-testid="cat-fullscreen-btn"
                  onClick={onToggleFullscreen}
                  aria-label={isFullscreen ? 'Thu nhỏ màn hình (Esc)' : 'Mở toàn màn hình (F11)'}
                  title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F11)'}
                  className={`h-7 sm:min-h-[34px] w-7 sm:w-auto sm:px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
                    isFullscreen
                      ? 'border-[#ECCFD9] bg-[#FDF1F5] hover:bg-[#F7E2EA] text-[#7A5761]'
                      : 'border-[#F0C8D6] bg-white hover:bg-[#FFF5F8] text-[#5A3E44]'
                  }`}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="hidden lg:inline">Esc · Thoát</span>
                      <span className="hidden sm:inline lg:hidden">Thoát</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="hidden lg:inline">F11</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Responsive Stage + Target Dock (Column in Portrait/Desktop, Side-by-Side Row in Mobile Landscape) */}
          <div
            data-testid="cat-play-body"
            className={`flex flex-col mobile-ls:flex-row ${
              isFullscreen
                ? 'flex-1 min-h-0 overflow-hidden'
                : 'mobile-ls:flex-none mobile-ls:h-[calc(100dvh-108px)] mobile-ls:min-h-[220px] mobile-ls:max-h-[340px]'
            }`}
          >
            {/* Panoramic Cluttered Scene Viewport */}
            <div
              ref={viewportRef}
              key={shakeCount}
              data-testid="cat-scene-viewport"
              onWheel={handleWheelZoom}
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={handleStagePointerUp}
              onClick={(e) => {
                if (dragRef.current.moved || pinchRef.current.wasPinching) return;
                handleMisclick(e.clientX, e.clientY);
              }}
              style={{ containerType: 'size' }}
              className={`relative ${
                isFullscreen
                  ? 'flex-1 min-h-0 min-w-0 w-full h-full mobile-ls:w-auto'
                  : 'w-full h-[270px] sm:h-[440px] lg:h-[min(62dvh,500px)] mobile-ls:flex-1 mobile-ls:w-auto mobile-ls:h-full mobile-ls:max-h-none mobile-ls:min-h-0 mobile-ls:min-w-0'
              } bg-[#FBEBF0] overflow-hidden select-none touch-none cursor-crosshair flex items-center justify-center ${
                shakeCount > 0 ? 'animate-dom-shake' : ''
              }`}
            >
            <div
              data-testid="cat-stage-canvas-box"
              className="relative origin-center transition-transform duration-75 ease-out shrink-0 overflow-hidden shadow-[0_6px_24px_-12px_rgba(90,62,68,0.22)]"
              style={{
                width: 'min(100%, 200cqh)',
                height: 'min(50cqw, 100cqh)',
                transform: `translate3d(${panZoom.panX}px, ${panZoom.panY}px, 0) scale(${panZoom.scale})`,
              }}
            >
              <svg
                viewBox={`0 0 ${CAT_SCENE_W} ${CAT_SCENE_H}`}
                className="w-full h-full block pointer-events-none"
                preserveAspectRatio="none"
              >
                <CatWorldBackdrop theme={activeStage.theme} />

                {/* Visual Clutter / Lookalike Decoy Layer (Memoized per stage) */}
                {renderedDecoys}

                {/* Target Items & Secret Golden Cat Layer */}
                {activeStage.items.map((item) => {
                  const found = foundSet.has(item.id);
                  const accessible = isCatItemAccessible(item, openedCoverIds);
                  if (found) return null;
                  const finalScale = getEffectiveItemScale(item, diffConfig);
                  const camoOpacity = !accessible
                    ? 0.04
                    : item.camoBlend
                    ? diffConfig.camoOpacity
                    : Math.min(1, diffConfig.camoOpacity + 0.08);
                  return (
                    <g
                      key={item.id}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotateDeg ?? 0}) scale(${finalScale})`}
                      style={{
                        opacity: camoOpacity,
                        transition: 'opacity 180ms ease',
                      }}
                    >
                      <CatItemGraphic artKey={item.artKey} camoOpacity={camoOpacity} />
                    </g>
                  );
                })}

                {/* Multi-Tap Interactive & Decoy Covers */}
                {activeStage.covers.map((cov) => {
                  const tapCount = coverTapCounts[cov.id] ?? 0;
                  const isOpen = isCoverFullyOpen(cov, coverTapCounts);
                  const tx = isOpen ? cov.x + cov.openOffsetX : cov.x;
                  const ty = isOpen ? cov.y + cov.openOffsetY : cov.y;
                  const rot = isOpen ? cov.openRotateDeg : 0;
                  return (
                    <g
                      key={cov.id}
                      transform={`translate(${tx}, ${ty}) rotate(${rot}, ${cov.w / 2}, ${cov.h / 2})`}
                      style={{
                        opacity: isOpen ? 0.42 : 1,
                        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease',
                      }}
                    >
                      {renderCatCoverProp(cov, isOpen, tapCount)}
                    </g>
                  );
                })}

                {/* Broad Hint Search Zone Ring (intentionally fuzzy) */}
                {activeHint && (
                  <g transform={`translate(${activeHint.x}, ${activeHint.y})`}>
                    <circle
                      r={diffConfig.hintRadius}
                      fill="#FDE68A"
                      fillOpacity="0.16"
                      stroke="#E87084"
                      strokeWidth="3.2"
                      strokeDasharray="10 7"
                    />
                  </g>
                )}
              </svg>

              {/* Accessible Precision Hotspots for Target Items (z-20) */}
              {activeStage.items.map((item) => {
                const found = foundSet.has(item.id);
                const accessible = isCatItemAccessible(item, openedCoverIds);
                if (found || !accessible) return null;
                const baseW = (item.hitW * diffConfig.hitboxScale / CAT_SCENE_W) * 100;
                const baseH = (item.hitH * diffConfig.hitboxScale / CAT_SCENE_H) * 100;
                const wPct = Math.max(isTouchViewport ? 3.8 : 2.9, baseW);
                const hPct = Math.max(isTouchViewport ? 6.0 : 4.6, baseH);
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`cat-item-${item.id}`}
                    aria-label={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragRef.current.moved || pinchRef.current.wasPinching) return;
                      handleCollectItem(item);
                    }}
                    style={{
                      left: `${(item.x / CAT_SCENE_W) * 100}%`,
                      top: `${(item.y / CAT_SCENE_H) * 100}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                    }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent hover:bg-white/10 active:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#E87084] cursor-pointer transition-colors"
                  />
                );
              })}

              {/* Tap-to-Reveal Cover Hotspots (blended cleanly without giveaway dashed outlines) */}
              {activeStage.covers.map((cov) => {
                const isOpen = isCoverFullyOpen(cov, coverTapCounts);
                const leftPct =
                  (((isOpen ? cov.x + cov.openOffsetX : cov.x) + cov.w / 2) / CAT_SCENE_W) * 100;
                const topPct =
                  (((isOpen ? cov.y + cov.openOffsetY : cov.y) + cov.h / 2) / CAT_SCENE_H) * 100;
                const openedAt = coverOpenedAtMs[cov.id];
                const expiringSoon =
                  isOpen &&
                  diffConfig.coverAutoCloseSec !== null &&
                  openedAt !== undefined &&
                  Date.now() - openedAt >= (diffConfig.coverAutoCloseSec - 2.5) * 1000;
                return (
                  <button
                    key={cov.id}
                    type="button"
                    data-testid={`cat-cover-${cov.id}`}
                    aria-label={isOpen ? `Đóng ${cov.label}` : `Mở ${cov.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragRef.current.moved || pinchRef.current.wasPinching) return;
                      handleToggleCover(cov.id);
                    }}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${((isOpen ? cov.w * 0.72 : cov.w) / CAT_SCENE_W) * 100}%`,
                      height: `${((isOpen ? cov.h * 0.72 : cov.h) / CAT_SCENE_H) * 100}%`,
                    }}
                    className={`absolute ${
                      isOpen
                        ? `z-10 ${expiringSoon ? 'ring-2 ring-amber-400/70 animate-pulse' : ''}`
                        : 'z-30 hover:bg-white/10'
                    } -translate-x-1/2 -translate-y-1/2 rounded-xl cursor-pointer transition-colors`}
                  />
                );
              })}

              {/* Pop Sparkle & Combo Fireworks Bursts */}
              {popBursts.map((burst) => (
                <div
                  key={burst.id}
                  style={{ left: `${burst.xPct}%`, top: `${burst.yPct}%` }}
                  className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
                >
                  {[
                    { sx: '-28px', sy: '-30px', color: '#F472B6' },
                    { sx: '28px', sy: '-28px', color: '#FBBF24' },
                    { sx: '-24px', sy: '24px', color: '#6EE7B7' },
                    { sx: '26px', sy: '22px', color: '#93C5FD' },
                  ].map((sp, i) => (
                    <span
                      key={i}
                      style={
                        {
                          '--sx': sp.sx,
                          '--sy': sp.sy,
                          backgroundColor: sp.color,
                        } as Record<string, string>
                      }
                      className="absolute w-3 h-3 rounded-full animate-cozy-pop-spark"
                    />
                  ))}
                  {burst.comboCount >= 2 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#43312B] text-amber-200 text-xs font-mono font-bold shadow">
                      ×{burst.comboCount}!
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Flashlight / Thần Nhãn Ánh Xạ Overlay in x8, x10, and x20 (CSS var driven at 60fps) */}
            {diffConfig.spotlightRadius !== null && (
              <div
                ref={spotlightOverlayRef}
                aria-hidden="true"
                data-testid="cat-spotlight-overlay"
                className="pointer-events-none absolute inset-0 z-30"
                style={{
                  ['--spot-x' as string]: '50%',
                  ['--spot-y' as string]: '50%',
                  background: isGodRayMode
                    ? `radial-gradient(circle ${diffConfig.spotlightRadius}px at var(--spot-x) var(--spot-y), rgba(254, 243, 199, 0.05) 0%, rgba(25, 10, 18, 0) 42%, rgba(217, 119, 6, 0.24) 68%, rgba(16, 6, 14, ${diffConfig.spotlightOpacity}) 100%)`
                    : `radial-gradient(circle ${diffConfig.spotlightRadius}px at var(--spot-x) var(--spot-y), rgba(25, 16, 18, 0) 38%, rgba(25, 16, 18, ${diffConfig.spotlightOpacity}) 100%)`,
                }}
              >
                {isGodRayMode && (
                  <div
                    ref={godRayLensRef}
                    data-testid="cat-god-ray-lens"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${diffConfig.spotlightRadius * 1.48}px`,
                      height: `${diffConfig.spotlightRadius * 1.48}px`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/65 shadow-[0_0_24px_rgba(245,158,11,0.45),inset_0_0_16px_rgba(225,29,72,0.22)]"
                  />
                )}
              </div>
            )}

            {/* Misclick Penalty & Latch Floating Popups */}
            {floatingNotices.map((notice) => (
              <div
                key={notice.id}
                style={{ left: `${notice.xPct}%`, top: `${notice.yPct}%` }}
                className={`pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-xs font-mono font-extrabold shadow-md whitespace-nowrap ${
                  notice.tone === 'miss'
                    ? 'bg-rose-600 text-white border border-rose-200'
                    : notice.tone === 'latch'
                    ? 'bg-amber-300 text-[#43312B] border border-[#43312B]'
                    : 'bg-[#43312B] text-amber-200'
                }`}
              >
                {notice.text}
              </div>
            ))}
          </div>

          {/* Target Thumbnail Bar (Bottom Row in Portrait/Desktop, Vertical Right Dock in Mobile Landscape) */}
          <div
            aria-label="Thanh vật phẩm cần tìm"
            data-testid="cat-thumbnail-bar"
            className={`shrink-0 min-h-0 bg-[#FFFDFB] border-t-2 border-[#F3C8D8] px-2 sm:px-3 py-2 flex flex-row items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x snap-x snap-mandatory mobile-ls:w-[78px] mobile-ls:h-0 mobile-ls:min-h-full mobile-ls:max-h-full mobile-ls:flex-col mobile-ls:overflow-y-auto mobile-ls:overflow-x-hidden mobile-ls:touch-pan-y mobile-ls:snap-y mobile-ls:border-t-0 mobile-ls:border-l-2 mobile-ls:py-1.5 mobile-ls:px-1.5 mobile-ls:gap-1.5 ${
              isFullscreen
                ? 'safe-area-x pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] mobile-ls:pl-1.5 mobile-ls:pr-[max(0.375rem,env(safe-area-inset-right,0px))] mobile-ls:pb-[max(0.375rem,env(safe-area-inset-bottom,0px))]'
                : ''
            }`}
          >
            {diffConfig.activeQueueLimit !== null && (
              <div
                className={`shrink-0 snap-start px-2.5 py-1.5 mobile-ls:w-full mobile-ls:px-1 mobile-ls:py-1 mobile-ls:text-center rounded-xl text-[11px] mobile-ls:text-[10px] font-mono font-bold leading-tight ${
                  isGodRayMode
                    ? 'bg-gradient-to-br from-[#7F1D1D] to-[#5A3E44] text-amber-100 border border-amber-400/50'
                    : 'bg-[#5A3E44] text-[#FFF8FA]'
                }`}
              >
                <div>{isGodRayMode ? 'Ánh Xạ' : 'Đang tìm'}</div>
                <div className="text-amber-300">
                  {activeQueue.length} · +{Math.max(0, regularItems.length - regularFoundCount - activeQueue.length)} chờ
                </div>
              </div>
            )}

            {(diffConfig.activeQueueLimit === null ? regularItems : activeQueue).map((item) => {
              const found = foundSet.has(item.id);
              const isHinted = activeHint?.item.id === item.id;
              return (
                <div
                  key={item.id}
                  data-testid={`cat-thumb-${item.id}`}
                  data-found={found ? 'true' : 'false'}
                  title={item.label}
                  aria-label={`${item.label}: ${found ? 'Đã tìm thấy' : 'Chưa tìm thấy'}`}
                  className={`relative shrink-0 snap-start w-12 h-12 sm:w-16 sm:h-16 mobile-ls:w-13 mobile-ls:h-13 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-transform ${
                    found
                      ? 'bg-[#FFEFF5] border-[#F06E96] scale-100'
                      : isHinted
                      ? 'bg-[#FFF5D6] border-amber-400 animate-pulse'
                      : isGodRayMode
                      ? 'bg-[#FFF8E8] border-[#E59866]'
                      : 'bg-[#FFF5F8] border-[#F0D3DF]'
                  }`}
                >
                  <CatThumbnailIcon artKey={item.artKey} found={found} />
                  {found && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#6EC792] text-white flex items-center justify-center border border-[#5A3E44]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
              );
            })}

            {secretCatItem && (
              <div
                data-testid={`cat-thumb-${secretCatItem.id}`}
                data-found={stageSave.foundSecretCat ? 'true' : 'false'}
                title="Mèo Vàng Bí Mật (ẩn trong tranh)"
                aria-label={`Mèo Vàng Bí Mật: ${stageSave.foundSecretCat ? 'Đã tìm thấy' : 'Chưa tìm thấy'}`}
                className={`relative shrink-0 snap-start w-12 h-12 sm:w-16 sm:h-16 mobile-ls:w-13 mobile-ls:h-13 rounded-xl sm:rounded-2xl border-2 border-dashed flex items-center justify-center ml-auto mobile-ls:ml-0 mobile-ls:mt-auto ${
                  stageSave.foundSecretCat
                    ? 'bg-[#FEF3C7] border-amber-500'
                    : 'bg-[#FFF8EE] border-[#E7C697]'
                }`}
              >
                <CatThumbnailIcon
                  artKey={secretCatItem.artKey}
                  found={stageSave.foundSecretCat}
                />
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* DEFEAT / GAME OVER SCREEN */}
      {screen === 'GAMEOVER' && (
        <div
          data-testid="cat-gameover-screen"
          className={`p-5 sm:p-8 mobile-ls:p-3 bg-gradient-to-b from-[#FFF9FC] to-[#FFE7EF] flex flex-col items-center text-center space-y-5 mobile-ls:space-y-3 ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto touch-pan-y safe-area-top safe-area-x safe-area-bottom justify-start sm:justify-center' : ''
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#FFE0EC] border-2 border-[#5A3E44] flex items-center justify-center shadow-[0_3px_0_#F3C8D8]">
            <Cat className="w-8 h-8 text-[#DB527E]" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#5A3E44] text-pink-100 text-xs font-mono font-bold">
              {diffConfig.label}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A3E44] mt-2">
              Hết Trái Tim Mất Rồi!
            </h2>
            <p className="text-sm text-[#8F6873] mt-1">
              Bạn đã chạm nhầm vài món đồ giả rồi. Hãy hít thở sâu, phóng to tranh và mở nhẹ từng chiếc hộp nhé!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md font-mono tabular-nums">
            <div className="rounded-xl border-2 border-[#F0C8D6] bg-white p-3">
              <div className="text-[11px] text-[#9D7782]">ĐÃ TÌM</div>
              <div className="text-lg font-bold text-[#5A3E44]">
                {regularFoundCount}/{regularItems.length}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#F0C8D6] bg-white p-3">
              <div className="text-[11px] text-[#9D7782]">CÒN TIM</div>
              <div className="text-lg font-bold text-rose-600">
                {hearts}/{diffConfig.maxHearts}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#F0C8D6] bg-white p-3">
              <div className="text-[11px] text-[#9D7782]">COMBO MAX</div>
              <div className="text-lg font-bold text-[#DB527E]">×{maxCombo}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              data-testid="cat-retry-btn"
              onClick={() => startStage(activeStage.id, true)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-b from-[#F47BA0] to-[#DB527E] hover:from-[#EC6B93] hover:to-[#C9446F] text-white border-2 border-[#5A3E44] shadow-[0_3px_0_#5A3E44] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử Lại ({diffConfig.multiplierBadge})</span>
            </button>

            {saveData.difficultyId !== 'hard_5x' && (
              <button
                type="button"
                onClick={() => startStage(activeStage.id, true, 'hard_5x')}
                className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#5A3E44] bg-[#FFF4D6] hover:bg-[#FDE8B0] text-xs font-bold cursor-pointer"
              >
                Chuyển về Khó ×5
              </button>
            )}

            <button
              type="button"
              data-testid="cat-map-btn"
              onClick={() => setScreen('TITLE')}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#F0C8D6] bg-white hover:border-[#5A3E44] text-xs font-bold cursor-pointer"
            >
              Bản Đồ Thị Trấn
            </button>
          </div>
        </div>
      )}

      {/* VICTORY & SHARE ACHIEVEMENT SCREEN */}
      {screen === 'VICTORY' && (
        <div
          data-testid="cat-victory-screen"
          className={`p-5 sm:p-8 mobile-ls:p-3 bg-gradient-to-b from-[#FFFDFB] via-[#FFF4F8] to-[#FCEEF4] flex flex-col items-center text-center space-y-5 mobile-ls:space-y-3 ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto touch-pan-y safe-area-top safe-area-x safe-area-bottom justify-start sm:justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-1.5" aria-label="Sao đạt được">
            {[1, 2, 3].map((s) => {
              const stars = computeCatStageStars(
                hintsUsed,
                stageSave.foundSecretCat,
                hearts,
                diffConfig.maxHearts
              );
              return (
                <Star
                  key={s}
                  className={`w-9 h-9 ${
                    s <= stars
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-[#EAD3DC]'
                  }`}
                />
              );
            })}
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FFE4EE] text-[#C03E6B] text-xs font-mono font-bold">
              Chinh Phục {diffConfig.label}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#5A3E44] mt-1.5">
              Hoàn Thành · {activeStage.title}
            </h2>
            <p className="text-sm text-[#8F6873] mt-1">
              {stageSave.foundSecretCat
                ? 'Tuyệt vời! Bạn đã tìm trọn bộ đồ xinh lẫn Bé Mèo Vàng Bí Mật!'
                : 'Góc phố thị trấn đã lung linh sắc màu pastel mới rồi!'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md font-mono tabular-nums">
            <div className="rounded-xl border-2 border-[#F0C8D6] bg-white p-3">
              <div className="text-[11px] text-[#9D7782]">ĐỒ XINH</div>
              <div className="text-lg font-bold text-[#5A3E44]">
                {regularItems.length}/{regularItems.length}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#F0C8D6] bg-white p-3">
              <div className="text-[11px] text-[#9D7782]">TIM CÒN LẠI</div>
              <div className="text-lg font-bold text-[#DB527E]">
                {hearts}/{diffConfig.maxHearts}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#F0C8D6] bg-white p-3">
              <div className="text-[11px] text-[#9D7782]">COMBO MAX</div>
              <div className="text-lg font-bold text-[#DB527E]">×{maxCombo}</div>
            </div>
          </div>

          {sharePreviewUrl && (
            <div className="max-w-sm w-full rounded-xl overflow-hidden border-2 border-[#5A3E44] shadow-md">
              <img
                src={sharePreviewUrl}
                alt="Thẻ thành tích Tìm Mèo & Đồ Xinh"
                className="w-full h-auto block"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              data-testid="cat-share-btn"
              onClick={handleGenerateShareCard}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#5A3E44] bg-[#FDE68A] hover:bg-[#FCD34D] text-[#5A3E44] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Khoe Thành Tích (Tải Ảnh)</span>
            </button>

            <button
              type="button"
              onClick={() => startStage(activeStage.id, true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#F0C8D6] bg-white hover:border-[#5A3E44] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>

            <button
              type="button"
              data-testid="cat-map-btn"
              onClick={() => setScreen('TITLE')}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#F0C8D6] bg-white hover:border-[#5A3E44] text-xs font-bold cursor-pointer"
            >
              Bản Đồ Thị Trấn
            </button>

            {nextUnlockedStage && (
              <button
                type="button"
                data-start="true"
                data-testid="cat-next-stage-btn"
                onClick={() => startStage(nextUnlockedStage.id, true)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-b from-[#F47BA0] to-[#DB527E] hover:from-[#EC6B93] hover:to-[#C9446F] text-white border-2 border-[#5A3E44] shadow-[0_3px_0_#5A3E44] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sang {nextUnlockedStage.title}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
