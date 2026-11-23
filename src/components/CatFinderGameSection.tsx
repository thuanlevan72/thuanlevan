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
  Clock,
  Download,
  Eye,
  Flame,
  Heart,
  Lock,
  Maximize2,
  Minimize2,
  Music,
  RotateCcw,
  Search,
  Skull,
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
  computeCatStageStars,
  countCollectedSecretCats,
  createInitialStageSave,
  formatCatTimer,
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
  renderCatCoverProp,
  renderCatWorldBackdrop,
} from './CatFinderArt.tsx';

interface CatFinderGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
}

type CatGameScreen = 'TITLE' | 'PLAYING' | 'VICTORY' | 'GAMEOVER';
type DefeatReason = 'hearts' | 'time';

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
  elapsedSec: number;
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

  ctx.fillStyle = '#FFF8EF';
  ctx.fillRect(0, 0, 960, 540);

  ctx.strokeStyle = '#F2A7B3';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 912, 492);
  ctx.strokeStyle = '#43312B';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(36, 36, 888, 468);

  ctx.fillStyle = '#E07082';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`TÌM MÈO & ĐỒ XINH · ${opts.difficultyLabel.toUpperCase()}`, 68, 92);

  ctx.fillStyle = '#43312B';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.fillText(opts.stageTitle, 68, 148);

  ctx.font = '44px sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < opts.stars ? '#FBBF24' : '#E5DDD5';
    ctx.fillText('★', 68 + i * 56, 212);
  }

  const boxes = [
    { label: 'ĐỒ XINH', value: `${opts.foundCount}/${opts.totalCount}` },
    { label: 'HOÀN THÀNH', value: formatCatTimer(opts.elapsedSec) },
    { label: 'COMBO MAX', value: `×${opts.maxCombo}` },
  ];
  boxes.forEach((box, idx) => {
    const bx = 68 + idx * 195;
    const by = 250;
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(bx, by, 175, 118);
    ctx.strokeStyle = '#E7D5C6';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 175, 118);

    ctx.fillStyle = '#8C7466';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(box.label, bx + 18, by + 34);

    ctx.fillStyle = '#43312B';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(box.value, bx + 18, by + 88);
  });

  ctx.fillStyle = opts.foundSecret ? '#FEF3C7' : '#F3ECE5';
  ctx.fillRect(68, 396, 565, 66);
  ctx.strokeStyle = opts.foundSecret ? '#F59E0B' : '#D5C7BA';
  ctx.lineWidth = 2;
  ctx.strokeRect(68, 396, 565, 66);
  ctx.fillStyle = '#43312B';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(
    opts.foundSecret
      ? '★ Đã tìm thấy Bé Mèo Vàng Bí Mật!'
      : '☆ Bé Mèo Vàng Bí Mật đang chờ bạn quay lại tìm',
    90,
    436
  );

  ctx.save();
  ctx.translate(780, 290);
  ctx.fillStyle = '#FCD34D';
  ctx.strokeStyle = '#43312B';
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
  ctx.fillStyle = '#43312B';
  ctx.beginPath();
  ctx.arc(-18, -36, 5, 0, Math.PI * 2);
  ctx.arc(18, -36, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#F472B6';
  ctx.beginPath();
  ctx.arc(-30, -22, 8, 0, Math.PI * 2);
  ctx.arc(30, -22, 8, 0, Math.PI * 2);
  ctx.fill();
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
  const [remainingSec, setRemainingSec] = useState<number>(() => diffConfig.timeLimitSec);
  const [hearts, setHearts] = useState<number>(() => diffConfig.maxHearts);
  const [defeatReason, setDefeatReason] = useState<DefeatReason>('time');
  const [comboStreak, setComboStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1);
  const [lastFindAtMs, setLastFindAtMs] = useState<number | null>(null);
  const [activeHint, setActiveHint] = useState<CatHintTarget | null>(null);
  const [popBursts, setPopBursts] = useState<PopBurstFx[]>([]);
  const [floatingNotices, setFloatingNotices] = useState<FloatingNoticeFx[]>([]);
  const [shakeCount, setShakeCount] = useState(0);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const [spotlightPct, setSpotlightPct] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const [muted, setMuted] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const [panZoom, setPanZoom] = useState<CatPanZoom>({ scale: 1, panX: 0, panY: 0 });
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 1080,
    height: 540,
  });

  const viewportRef = useRef<HTMLDivElement | null>(null);
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
  }>({
    pointers: new Map(),
    initDist: 0,
    initScale: 1,
  });

  const activeStage: CatStageDef = useMemo(
    () => CAT_STAGES.find((s) => s.id === saveData.activeStageId) ?? CAT_STAGES[0],
    [saveData.activeStageId]
  );

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

  const elapsedSec = Math.max(0, diffConfig.timeLimitSec - remainingSec);
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

  // Countdown timer & auto-closing covers in NIGHTMARE / EAGLE modes
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const t = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setDefeatReason('time');
          catFinderAudio.playGameOverSound(muted);
          setScreen('GAMEOVER');
          return 0;
        }
        if (prev <= 13) {
          catFinderAudio.playWarningTickSound(muted);
        }
        return prev - 1;
      });

      if (diffConfig.coverAutoCloseSec !== null) {
        const now = Date.now();
        const ttlMs = diffConfig.coverAutoCloseSec * 1000;
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
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [screen, muted, diffConfig.coverAutoCloseSec]);

  const startStage = useCallback(
    (stageId?: string, forceReset = true, overrideDiffId?: CatDifficultyId) => {
      const targetId = stageId ?? activeStage.id;
      if (!isStageUnlocked(targetId, saveData)) return;
      const targetDiff = getCatDifficultyConfig(overrideDiffId ?? saveData.difficultyId);

      catFinderAudio.unlock();
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
      setRemainingSec(targetDiff.timeLimitSec);
      setHearts(targetDiff.maxHearts);
      setDefeatReason('time');
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
    [activeStage.id, muted, saveData]
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
    return Math.max(viewportSize.width, aspectW);
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

      const res = applyCatMisclickPenalty(hearts, remainingSec, diffConfig.misclickPenaltySec);
      setHearts(res.nextHearts);
      setRemainingSec(res.nextRemainingSec);
      setComboStreak(0);
      setShakeCount((c) => c + 1);

      pushFloatingNotice(
        xPct,
        yPct,
        `✖ -1❤️ · -${diffConfig.misclickPenaltySec}s`,
        'miss'
      );

      if (res.isGameOver) {
        setDefeatReason(res.nextHearts <= 0 ? 'hearts' : 'time');
        catFinderAudio.playGameOverSound(muted);
        window.setTimeout(() => {
          setScreen('GAMEOVER');
        }, 280);
      }
    },
    [screen, muted, hearts, remainingSec, diffConfig.misclickPenaltySec, pushFloatingNotice]
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
              elapsedSec,
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
              bestTimeSec:
                nextRegularDone
                  ? cur.bestTimeSec === null
                    ? elapsedSec
                    : Math.min(cur.bestTimeSec, elapsedSec)
                  : cur.bestTimeSec,
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
      elapsedSec,
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

    // Hint costs remaining time to raise tension!
    setRemainingSec((prev) => {
      const next = Math.max(1, prev - diffConfig.hintCostSec);
      return next;
    });

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
    diffConfig.hintCostSec,
    muted,
    panZoom.scale,
    applyZoom,
  ]);

  const handleGenerateShareCard = useCallback(() => {
    const stars = computeCatStageStars(
      hintsUsed,
      elapsedSec,
      stageSave.foundSecretCat,
      hearts,
      diffConfig.maxHearts
    );
    const dataUrl = drawShareCardDataUrl({
      stageTitle: activeStage.title,
      difficultyLabel: diffConfig.label,
      stars,
      elapsedSec,
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
    elapsedSec,
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
    setSpotlightPct({ x, y });
  };

  // Pointer Pan & Pinch Handlers
  const handleStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    updateSpotlightFromClient(e.clientX, e.clientY, e.pointerType);
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current.pointers.size === 2) {
      const pts = Array.from(pinchRef.current.pointers.values());
      pinchRef.current.initDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current.initScale = panZoom.scale;
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

  return (
    <section
      aria-label="Tìm Mèo và Đồ Xinh"
      className={`rounded-2xl border border-[#ECCFD5] bg-[#FFF9F2] text-[#43312B] overflow-hidden shadow-[0_14px_38px_-16px_rgba(120,76,65,0.2)] ${
        isFullscreen ? 'h-full flex-1 flex flex-col min-h-0' : ''
      }`}
    >
      {/* TITLE & TOWN MAP SCREEN */}
      {screen === 'TITLE' && (
        <div
          className={`p-4 sm:p-6 space-y-5 bg-gradient-to-b from-[#FFFDF8] to-[#FFF4EA] ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto' : ''
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#EFE0D2] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE2E6] border-2 border-[#43312B] flex items-center justify-center shrink-0">
                <Cat className="w-6 h-6 text-[#D95B72]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#43312B] leading-tight">
                  Tìm Mèo &amp; Đồ Xinh
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6258] mt-0.5">
                  24–27 mục tiêu ngụy trang · +44 đồ giả · Hộp khóa đôi · Phạt chạm hụt &amp; Đếm ngược · Mèo Vàng {secretCatCollectedTotal}/{getMainStages().length}
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
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border-2 border-[#E5D5C5] bg-white hover:border-[#43312B] text-[#43312B] text-xs font-mono font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
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
                onClick={() => startStage()}
                className="flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E87084] hover:bg-[#DF5C72] text-white border-2 border-[#43312B] text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Chơi Ngay ({diffConfig.multiplierBadge})</span>
              </button>
            </div>
          </div>

          {/* Difficulty Selector (5x / 8x / 10x / 20x Siêu Thần Ánh Xạ) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Chọn độ khó Tìm Mèo">
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
                        ? 'bg-gradient-to-br from-[#FFF4DB] via-[#FFE9E9] to-[#FCE7F3] border-[#991B1B]'
                        : diff.id === 'eagle_10x'
                        ? 'bg-[#FFF0F3] border-[#BE123C]'
                        : diff.id === 'nightmare_8x'
                        ? 'bg-[#FFF6E6] border-[#D97706]'
                        : 'bg-[#FFF0F2] border-[#D95B72]'
                      : diff.id === 'god_ray_20x'
                      ? 'bg-[#FFFBF2] border-[#F3D2A2] hover:border-[#991B1B]'
                      : 'bg-white border-[#E5D5C5] hover:border-[#D95B72]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-[#43312B] flex items-center gap-1.5">
                      {diff.id === 'god_ray_20x' ? (
                        <Sun className="w-4 h-4 text-[#B45309]" />
                      ) : diff.id === 'eagle_10x' ? (
                        <Eye className="w-4 h-4 text-[#BE123C]" />
                      ) : diff.id === 'nightmare_8x' ? (
                        <Flame className="w-4 h-4 text-[#D97706]" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-[#D95B72]" />
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
                          : 'bg-[#FCE7EA] text-[#B84158]'
                      }`}
                    >
                      {diff.multiplierBadge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7A6258] leading-snug">{diff.tagline}</p>
                </button>
              );
            })}
          </div>

          {/* Interactive Pastel Town Map */}
          <div className="rounded-xl overflow-hidden border-2 border-[#E6D4C4] bg-[#FFFDF8]">
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
                      ? 'bg-[#F4EDE6] border-[#DFD2C5] text-[#8E7B70] cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#FFF0F2] border-[#D95B72] cursor-pointer'
                      : 'bg-white border-[#E5D5C5] hover:border-[#E87084] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 text-xs font-mono font-bold">
                    <span>{st.isSecretStage ? 'Màn Ẩn' : `Màn ${st.order}`}</span>
                    {!unlocked ? (
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <span className="tabular-nums text-[#C45368]">
                        {regTotal} món · {st.covers.length} nắp
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-sm leading-snug text-[#43312B]">
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
                              : 'text-[#DECFC2]'
                          }`}
                        />
                      ))}
                    </span>
                    <span className={prog.foundSecretCat ? 'text-amber-600 font-bold' : 'text-[#9B8579]'}>
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

          <p className="text-center text-xs text-[#836C61]">
            Phóng to (tới {CAT_MAX_ZOOM}×) &amp; kéo tranh để soi đồ tí hon · Chạm 2 lần với nắp có khóa vàng · Tránh click nhầm đồ giả kẻo mất Tim &amp; Giờ!
          </p>
        </div>
      )}

      {/* ACTIVE PLAY SCREEN */}
      {screen === 'PLAYING' && (
        <div
          className={`flex flex-col bg-[#FFF7EE] ${
            isFullscreen ? 'flex-1 min-h-0' : ''
          }`}
        >
          {/* High-Tension Pastel HUD (Responsive on Mobile & Non-overlapping in Fullscreen) */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 mobile-ls:py-1 bg-[#FFFDF8] border-b-2 border-[#EEDFD2]">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <button
                type="button"
                aria-label="Quay về bản đồ thị trấn"
                onClick={() => setScreen('TITLE')}
                className="min-h-[38px] px-2.5 rounded-xl border-2 border-[#E6D4C4] bg-white hover:border-[#D95B72] inline-flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Thị Trấn</span>
              </button>

              <span className="hidden xs:inline sm:inline font-bold text-xs sm:text-sm truncate max-w-[110px] sm:max-w-[200px]">
                {activeStage.title}
              </span>

              <span
                data-testid="cat-diff-badge"
                className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono font-extrabold shrink-0 ${
                  isGodRayMode
                    ? 'bg-gradient-to-r from-[#991B1B] to-[#D97706] text-amber-100'
                    : diffConfig.id === 'eagle_10x'
                    ? 'bg-[#BE123C] text-white'
                    : diffConfig.id === 'nightmare_8x'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#FCE7EA] text-[#B84158]'
                }`}
              >
                {diffConfig.multiplierBadge}
              </span>

              <span
                data-testid="cat-progress-count"
                className="px-2 py-0.5 rounded-lg bg-[#FCE7EA] text-[#B84158] text-xs font-mono font-bold tabular-nums shrink-0"
              >
                {regularFoundCount}/{regularItems.length}
              </span>

              {/* Hearts Remaining */}
              <span
                data-testid="cat-hearts"
                aria-label={`Còn ${hearts} trên ${diffConfig.maxHearts} trái tim`}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold tabular-nums inline-flex items-center gap-1 shrink-0 ${
                  hearts <= 2
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-[#FFF0F2] text-[#C83E58]'
                }`}
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                {hearts}/{diffConfig.maxHearts}
              </span>

              {/* Countdown Timer */}
              <span
                data-testid="cat-timer"
                className={`px-2 py-0.5 rounded-lg text-xs font-mono font-extrabold tabular-nums inline-flex items-center gap-1 shrink-0 ${
                  remainingSec <= 20
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-[#F4EBE2] text-[#43312B]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatCatTimer(remainingSec)}
              </span>

              <span
                title="Bé Mèo Vàng Bí Mật"
                className={`text-xs font-mono font-bold shrink-0 ${
                  stageSave.foundSecretCat ? 'text-amber-500' : 'text-[#C2AFA3]'
                }`}
              >
                {stageSave.foundSecretCat ? '★' : '☆'}
              </span>

              {comboStreak >= 2 && (
                <span
                  data-testid="cat-combo-badge"
                  className="px-2 py-0.5 rounded-lg bg-amber-300 text-[#43312B] text-xs font-mono font-extrabold tabular-nums shrink-0"
                >
                  ×{comboStreak}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 font-mono flex-wrap justify-end ml-auto">
              <button
                type="button"
                data-testid="cat-hint-btn"
                disabled={hintsRemaining <= 0}
                onClick={handleUseHint}
                aria-label={`Gợi ý vùng tìm (còn ${hintsRemaining}, tốn ${diffConfig.hintCostSec} giây)`}
                className="min-h-[38px] px-2 sm:px-2.5 rounded-xl border-2 border-[#F4C46A] bg-[#FFF4D6] hover:bg-[#FDE8B0] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gợi Ý</span>
                <span className="tabular-nums">({hintsRemaining})</span>
              </button>

              <div className="flex items-center rounded-xl border-2 border-[#E6D4C4] bg-white overflow-hidden shrink-0">
                <button
                  type="button"
                  data-testid="cat-zoom-out-btn"
                  aria-label="Thu nhỏ"
                  onClick={() => applyZoom(panZoom.scale - 0.45)}
                  disabled={panZoom.scale <= CAT_MIN_ZOOM}
                  className="min-h-[36px] w-8 sm:w-8 flex items-center justify-center disabled:opacity-35 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid="cat-zoom-reset-btn"
                  aria-label="Đưa về 1x"
                  onClick={() => setPanZoom({ scale: 1, panX: 0, panY: 0 })}
                  className="min-h-[36px] px-1.5 text-[11px] font-bold tabular-nums cursor-pointer"
                >
                  {panZoom.scale.toFixed(1)}×
                </button>
                <button
                  type="button"
                  data-testid="cat-zoom-in-btn"
                  aria-label="Phóng to"
                  onClick={() => applyZoom(panZoom.scale + 0.45)}
                  disabled={panZoom.scale >= CAT_MAX_ZOOM}
                  className="min-h-[36px] w-8 sm:w-8 flex items-center justify-center disabled:opacity-35 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                aria-label={bgmOn ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
                onClick={() => {
                  catFinderAudio.unlock();
                  setBgmOn((v) => !v);
                }}
                className={`min-h-[38px] w-9 rounded-xl border-2 flex items-center justify-center cursor-pointer shrink-0 ${
                  bgmOn
                    ? 'border-[#E87084] bg-[#FCE7EA] text-[#B84158]'
                    : 'border-[#E6D4C4] bg-white text-[#7A6258]'
                }`}
              >
                <Music className="w-4 h-4" />
              </button>

              <button
                type="button"
                aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                onClick={() => setMuted((v) => !v)}
                className="min-h-[38px] w-9 rounded-xl border-2 border-[#E6D4C4] bg-white flex items-center justify-center cursor-pointer shrink-0"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {onToggleFullscreen && (
                <button
                  type="button"
                  data-testid="cat-fullscreen-btn"
                  onClick={onToggleFullscreen}
                  aria-label={isFullscreen ? 'Thu nhỏ màn hình (Esc)' : 'Mở toàn màn hình (F11)'}
                  title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F11)'}
                  className={`min-h-[38px] px-2.5 rounded-xl border-2 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 ${
                    isFullscreen
                      ? 'border-[#0284C7] bg-[#0F172A] text-sky-200 hover:bg-slate-800'
                      : 'border-[#E6D4C4] bg-white text-[#43312B] hover:border-[#D95B72]'
                  }`}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Esc · Thoát</span>
                      <span className="sm:hidden">Thu nhỏ</span>
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
              if (dragRef.current.moved) return;
              handleMisclick(e.clientX, e.clientY);
            }}
            style={{ containerType: 'size' }}
            className={`relative w-full ${
              isFullscreen
                ? 'flex-1 min-h-[240px]'
                : 'h-[52dvh] min-h-[300px] max-h-[520px] sm:h-[440px] lg:h-[500px] mobile-ls:h-[62dvh] mobile-ls:min-h-[210px]'
            } bg-[#F5E6D8] overflow-hidden select-none touch-none cursor-crosshair flex items-center justify-center ${
              shakeCount > 0 ? 'animate-dom-shake' : ''
            }`}
          >
            <div
              data-testid="cat-stage-canvas-box"
              className="relative origin-center transition-transform duration-75 ease-out shrink-0"
              style={{
                width: 'max(100%, 200cqh)',
                height: 'max(50cqw, 100cqh)',
                transform: `translate3d(${panZoom.panX}px, ${panZoom.panY}px, 0) scale(${panZoom.scale})`,
              }}
            >
              <svg
                viewBox={`0 0 ${CAT_SCENE_W} ${CAT_SCENE_H}`}
                className="w-full h-full block pointer-events-none"
                preserveAspectRatio="none"
              >
                {renderCatWorldBackdrop(activeStage.theme)}

                {/* Visual Clutter / Lookalike Decoy Layer */}
                {activeStage.decoys.map((dec) => (
                  <g
                    key={dec.id}
                    transform={`translate(${dec.x}, ${dec.y}) rotate(${dec.rotateDeg ?? 0}) scale(${dec.scale ?? 0.72})`}
                    style={{ opacity: dec.opacity ?? 0.86 }}
                  >
                    <CatDecoyGraphic artKey={dec.artKey} mutedTint={dec.mutedTint} />
                  </g>
                ))}

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
                      if (dragRef.current.moved) return;
                      handleCollectItem(item);
                    }}
                    style={{
                      left: `${(item.x / CAT_SCENE_W) * 100}%`,
                      top: `${(item.y / CAT_SCENE_H) * 100}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                    }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E87084] cursor-pointer transition-colors"
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
                      if (dragRef.current.moved) return;
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

            {/* Flashlight / Thần Nhãn Ánh Xạ Overlay in x8, x10, and x20 */}
            {diffConfig.spotlightRadius !== null && (
              <div
                aria-hidden="true"
                data-testid="cat-spotlight-overlay"
                className="pointer-events-none absolute inset-0 z-30 transition-[background] duration-75"
                style={{
                  background: isGodRayMode
                    ? `radial-gradient(circle ${diffConfig.spotlightRadius}px at ${spotlightPct.x}% ${spotlightPct.y}%, rgba(254, 243, 199, 0.05) 0%, rgba(25, 10, 18, 0) 42%, rgba(217, 119, 6, 0.24) 68%, rgba(16, 6, 14, ${diffConfig.spotlightOpacity}) 100%)`
                    : `radial-gradient(circle ${diffConfig.spotlightRadius}px at ${spotlightPct.x}% ${spotlightPct.y}%, rgba(25, 16, 18, 0) 38%, rgba(25, 16, 18, ${diffConfig.spotlightOpacity}) 100%)`,
                }}
              >
                {isGodRayMode && (
                  <div
                    data-testid="cat-god-ray-lens"
                    style={{
                      left: `${spotlightPct.x}%`,
                      top: `${spotlightPct.y}%`,
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

          {/* Target Thumbnail Bar (All Items in x5, Active Queue in x8 / x10 / x20) */}
          <div
            aria-label="Thanh vật phẩm cần tìm"
            data-testid="cat-thumbnail-bar"
            className="shrink-0 bg-[#FFFDF8] border-t-2 border-[#EEDFD2] px-2 sm:px-3 py-2 mobile-ls:py-1.5 flex items-center gap-1.5 sm:gap-2 overflow-x-auto touch-pan-x snap-x snap-mandatory"
          >
            {diffConfig.activeQueueLimit !== null && (
              <div
                className={`shrink-0 snap-start px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold leading-tight ${
                  isGodRayMode
                    ? 'bg-gradient-to-br from-[#7F1D1D] to-[#43312B] text-amber-100 border border-amber-400/50'
                    : 'bg-[#43312B] text-[#FFF8EF]'
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
                  className={`relative shrink-0 snap-start w-12 h-12 sm:w-16 sm:h-16 mobile-ls:w-11 mobile-ls:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-transform ${
                    found
                      ? 'bg-[#FFF0F3] border-[#E87084] scale-100'
                      : isHinted
                      ? 'bg-[#FFF5D6] border-amber-400 animate-pulse'
                      : isGodRayMode
                      ? 'bg-[#FFF8E8] border-[#E59866]'
                      : 'bg-[#F5EFEA] border-[#E2D4C8]'
                  }`}
                >
                  <CatThumbnailIcon artKey={item.artKey} found={found} />
                  {found && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#77B97E] text-white flex items-center justify-center border border-[#43312B]">
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
                className={`relative shrink-0 snap-start w-12 h-12 sm:w-16 sm:h-16 mobile-ls:w-11 mobile-ls:h-11 rounded-xl sm:rounded-2xl border-2 border-dashed flex items-center justify-center ml-auto ${
                  stageSave.foundSecretCat
                    ? 'bg-[#FEF3C7] border-amber-500'
                    : 'bg-[#FAF3E8] border-[#D8C4AD]'
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
      )}

      {/* DEFEAT / GAME OVER SCREEN */}
      {screen === 'GAMEOVER' && (
        <div
          data-testid="cat-gameover-screen"
          className={`p-5 sm:p-8 bg-gradient-to-b from-[#FFF8F6] to-[#FBE4E6] flex flex-col items-center text-center space-y-5 ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto justify-center' : ''
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-[#43312B] flex items-center justify-center">
            <Skull className="w-8 h-8 text-rose-600" />
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#43312B] text-amber-200 text-xs font-mono font-bold">
              {diffConfig.label}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#43312B] mt-2">
              {defeatReason === 'hearts' ? 'Hết Trái Tim Mất Rồi!' : 'Hết Giờ Tìm Kiếm!'}
            </h2>
            <p className="text-sm text-[#7A6258] mt-1">
              {defeatReason === 'hearts'
                ? 'Bạn đã chạm nhầm quá nhiều đồ giả và nền tranh. Hãy phóng to và quan sát kỹ chốt khóa!'
                : 'Đồng hồ đã điểm 0:00 trước khi gom đủ toàn bộ vật phẩm mục tiêu.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md font-mono tabular-nums">
            <div className="rounded-xl border-2 border-[#E6D4C4] bg-white p-3">
              <div className="text-[11px] text-[#8D766B]">ĐÃ TÌM</div>
              <div className="text-lg font-bold text-[#43312B]">
                {regularFoundCount}/{regularItems.length}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#E6D4C4] bg-white p-3">
              <div className="text-[11px] text-[#8D766B]">CÒN TIM</div>
              <div className="text-lg font-bold text-rose-600">
                {hearts}/{diffConfig.maxHearts}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#E6D4C4] bg-white p-3">
              <div className="text-[11px] text-[#8D766B]">COMBO MAX</div>
              <div className="text-lg font-bold text-[#D95B72]">×{maxCombo}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              data-testid="cat-retry-btn"
              onClick={() => startStage(activeStage.id, true)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E87084] hover:bg-[#DF5C72] text-white border-2 border-[#43312B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử Lại ({diffConfig.multiplierBadge})</span>
            </button>

            {saveData.difficultyId !== 'hard_5x' && (
              <button
                type="button"
                onClick={() => startStage(activeStage.id, true, 'hard_5x')}
                className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#43312B] bg-[#FFF4D6] hover:bg-[#FDE8B0] text-xs font-bold cursor-pointer"
              >
                Chuyển về Khó ×5
              </button>
            )}

            <button
              type="button"
              data-testid="cat-map-btn"
              onClick={() => setScreen('TITLE')}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#E6D4C4] bg-white hover:border-[#43312B] text-xs font-bold cursor-pointer"
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
          className={`p-5 sm:p-8 bg-gradient-to-b from-[#FFFDF8] to-[#FCEEEB] flex flex-col items-center text-center space-y-5 ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-1.5" aria-label="Sao đạt được">
            {[1, 2, 3].map((s) => {
              const stars = computeCatStageStars(
                hintsUsed,
                elapsedSec,
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
                      : 'text-[#DECFC2]'
                  }`}
                />
              );
            })}
          </div>

          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FCE7EA] text-[#B84158] text-xs font-mono font-bold">
              Chinh Phục {diffConfig.label}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#43312B] mt-1.5">
              Hoàn Thành · {activeStage.title}
            </h2>
            <p className="text-sm text-[#7A6258] mt-1">
              {stageSave.foundSecretCat
                ? 'Tuyệt vời! Bạn đã tìm trọn bộ đồ xinh lẫn Bé Mèo Vàng Bí Mật!'
                : 'Đường phố thị trấn đã được tô thêm sắc màu mới!'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full max-w-md font-mono tabular-nums">
            <div className="rounded-xl border-2 border-[#E6D4C4] bg-white p-3">
              <div className="text-[11px] text-[#8D766B]">ĐỒ XINH</div>
              <div className="text-lg font-bold text-[#43312B]">
                {regularItems.length}/{regularItems.length}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#E6D4C4] bg-white p-3">
              <div className="text-[11px] text-[#8D766B]">THỜI GIAN</div>
              <div className="text-lg font-bold text-[#43312B]">
                {formatCatTimer(elapsedSec)}
              </div>
            </div>
            <div className="rounded-xl border-2 border-[#E6D4C4] bg-white p-3">
              <div className="text-[11px] text-[#8D766B]">COMBO MAX</div>
              <div className="text-lg font-bold text-[#D95B72]">×{maxCombo}</div>
            </div>
          </div>

          {sharePreviewUrl && (
            <div className="max-w-sm w-full rounded-xl overflow-hidden border-2 border-[#43312B] shadow-md">
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
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#43312B] bg-[#FDE68A] hover:bg-[#FCD34D] text-[#43312B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Khoe Thành Tích (Tải Ảnh)</span>
            </button>

            <button
              type="button"
              onClick={() => startStage(activeStage.id, true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#E6D4C4] bg-white hover:border-[#43312B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>

            <button
              type="button"
              data-testid="cat-map-btn"
              onClick={() => setScreen('TITLE')}
              className="min-h-[44px] px-4 py-2 rounded-xl border-2 border-[#E6D4C4] bg-white hover:border-[#43312B] text-xs font-bold cursor-pointer"
            >
              Bản Đồ Thị Trấn
            </button>

            {nextUnlockedStage && (
              <button
                type="button"
                data-start="true"
                data-testid="cat-next-stage-btn"
                onClick={() => startStage(nextUnlockedStage.id, true)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#E87084] hover:bg-[#DF5C72] text-white border-2 border-[#43312B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
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
