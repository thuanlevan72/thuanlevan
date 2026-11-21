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
  Lock,
  Music,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CAT_MAX_ZOOM,
  CAT_MIN_ZOOM,
  CAT_SCENE_H,
  CAT_SCENE_W,
  CAT_STAGES,
  clampCatPanZoom,
  computeCatStageStars,
  countCollectedSecretCats,
  createInitialStageSave,
  formatCatTimer,
  getMainStages,
  getRegularItems,
  getSecretCatItem,
  isCatItemAccessible,
  isStageUnlocked,
  parseCatFinderSave,
  pickCatHintTarget,
  updateComboOnFind,
  type CatFinderSaveData,
  type CatHintTarget,
  type CatItemDef,
  type CatPanZoom,
  type CatStageDef,
} from '../utils/catFinderEngine.ts';
import { catFinderAudio } from '../utils/catFinderAudio.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import {
  CatItemGraphic,
  CatThumbnailIcon,
  CatTownMapSvg,
  renderCatCoverProp,
  renderCatWorldBackdrop,
} from './CatFinderArt.tsx';

interface CatFinderGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type CatGameScreen = 'TITLE' | 'PLAYING' | 'VICTORY';

interface PopBurstFx {
  id: number;
  xPct: number;
  yPct: number;
  isSecret: boolean;
  comboCount: number;
}

const STORAGE_KEY = 'thuanle-cat-finder-v1';

function loadCatSave(): CatFinderSaveData {
  if (typeof window === 'undefined') return parseCatFinderSave(null);
  try {
    return parseCatFinderSave(window.localStorage.getItem(STORAGE_KEY));
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

  // Pastel cream card backdrop
  ctx.fillStyle = '#FFF8EF';
  ctx.fillRect(0, 0, 960, 540);

  // Scalloped soft border
  ctx.strokeStyle = '#F2A7B3';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 912, 492);
  ctx.strokeStyle = '#43312B';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(36, 36, 888, 468);

  // Title & Stage
  ctx.fillStyle = '#E07082';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('TÌM MÈO & ĐỒ XINH · TIỆM TẠP HÓA TÍ HON', 68, 92);

  ctx.fillStyle = '#43312B';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText(opts.stageTitle, 68, 148);

  // Stars row
  ctx.font = '44px sans-serif';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < opts.stars ? '#FBBF24' : '#E5DDD5';
    ctx.fillText('★', 68 + i * 56, 212);
  }

  // Stats grid
  const boxes = [
    { label: 'ĐỒ XINH', value: `${opts.foundCount}/${opts.totalCount}` },
    { label: 'THỜI GIAN', value: formatCatTimer(opts.elapsedSec) },
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

  // Secret cat stamp
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

  // Cute Pastel Cat Emblem on Right
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

  // Ears
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

  // Eyes & cheeks
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

  // Cute w mouth & whiskers
  ctx.strokeStyle = '#43312B';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-6, -22, 6, 0, Math.PI);
  ctx.arc(6, -22, 6, 0, Math.PI);
  ctx.moveTo(-48, -32);
  ctx.lineTo(-68, -36);
  ctx.moveTo(-48, -22);
  ctx.lineTo(-68, -22);
  ctx.moveTo(48, -32);
  ctx.lineTo(68, -36);
  ctx.moveTo(48, -22);
  ctx.lineTo(68, -22);
  ctx.stroke();

  // Pink collar & golden bell
  ctx.strokeStyle = '#E87084';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-34, 14);
  ctx.lineTo(34, 14);
  ctx.stroke();
  ctx.fillStyle = '#FEF08A';
  ctx.strokeStyle = '#43312B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 24, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

export function CatFinderGameSection({
  theme: _theme,
  onToggleTheme: _onToggleTheme,
}: CatFinderGameSectionProps) {
  const [saveData, setSaveData] = useState<CatFinderSaveData>(() => loadCatSave());
  const [screen, setScreen] = useState<CatGameScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'PLAYING';
    }
    return 'TITLE';
  });

  const [openedCoverIds, setOpenedCoverIds] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(1);
  const [lastFindAtMs, setLastFindAtMs] = useState<number | null>(null);
  const [activeHint, setActiveHint] = useState<CatHintTarget | null>(null);
  const [popBursts, setPopBursts] = useState<PopBurstFx[]>([]);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);

  const [muted, setMuted] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const [panZoom, setPanZoom] = useState<CatPanZoom>({ scale: 1, panX: 0, panY: 0 });

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    origPanX: number;
    origPanY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
    moved: false,
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

  // Persist save state
  useEffect(() => {
    saveCatProgress(saveData);
  }, [saveData]);

  // Sync game state to body dataset
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.state =
      screen === 'TITLE' ? 'title' : screen === 'VICTORY' ? 'gameover' : 'playing';
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

  // Gentle timer in PLAYING
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const t = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [screen]);

  const startStage = useCallback(
    (stageId?: string, forceReset = false) => {
      const targetId = stageId ?? activeStage.id;
      if (!isStageUnlocked(targetId, saveData)) return;

      catFinderAudio.unlock();
      catFinderAudio.playRevealSound(muted);

      if (forceReset || saveData.stages[targetId]?.cleared) {
        setSaveData((prev) => ({
          ...prev,
          activeStageId: targetId,
          stages: {
            ...prev.stages,
            [targetId]: {
              ...(prev.stages[targetId] ?? createInitialStageSave()),
              foundItemIds: [],
            },
          },
        }));
      } else {
        setSaveData((prev) => ({
          ...prev,
          activeStageId: targetId,
        }));
      }

      setOpenedCoverIds([]);
      setHintsUsed(0);
      setElapsedSec(0);
      setComboStreak(0);
      setMaxCombo(1);
      setLastFindAtMs(null);
      setActiveHint(null);
      setPopBursts([]);
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

  const applyZoom = useCallback((nextScale: number, nextX?: number, nextY?: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? 900;
    const vh = rect?.height ?? 450;
    setPanZoom((prev) => clampCatPanZoom(nextScale, nextX ?? prev.panX, nextY ?? prev.panY, vw, vh));
  }, []);

  const handleToggleCover = useCallback(
    (coverId: string) => {
      catFinderAudio.unlock();
      catFinderAudio.playRevealSound(muted);
      setOpenedCoverIds((prev) =>
        prev.includes(coverId) ? prev.filter((id) => id !== coverId) : [...prev, coverId]
      );
      if (activeHint?.needsCoverId === coverId) {
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
    [muted, activeHint]
  );

  const handleCollectItem = useCallback(
    (item: CatItemDef) => {
      if (foundSet.has(item.id)) return;
      if (!isCatItemAccessible(item, openedCoverIds)) return;

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
          ? computeCatStageStars(hintsUsed, elapsedSec, nextSecret)
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
        }, 480);
      }
    },
    [
      foundSet,
      openedCoverIds,
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
    ]
  );

  const handleUseHint = useCallback(() => {
    const target = pickCatHintTarget(activeStage, stageSave.foundItemIds, openedCoverIds);
    if (!target) return;
    catFinderAudio.unlock();
    catFinderAudio.playHintSound(muted);
    setHintsUsed((prev) => prev + 1);
    setActiveHint(target);

    // Gently pan toward hint if zoomed in
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect) {
      const targetPanX = ((CAT_SCENE_W / 2 - target.x) / CAT_SCENE_W) * rect.width * panZoom.scale;
      const targetPanY = ((CAT_SCENE_H / 2 - target.y) / CAT_SCENE_H) * rect.height * panZoom.scale;
      applyZoom(Math.max(1.25, panZoom.scale), targetPanX, targetPanY);
    }
  }, [activeStage, stageSave.foundItemIds, openedCoverIds, muted, panZoom.scale, applyZoom]);

  const handleGenerateShareCard = useCallback(() => {
    const stars = computeCatStageStars(hintsUsed, elapsedSec, stageSave.foundSecretCat);
    const dataUrl = drawShareCardDataUrl({
      stageTitle: activeStage.title,
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
    link.download = `tim-meo-${activeStage.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [
    hintsUsed,
    elapsedSec,
    stageSave.foundSecretCat,
    activeStage.title,
    activeStage.id,
    maxCombo,
    regularItems.length,
  ]);

  // Pointer Pan & Pinch Handlers
  const handleStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
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
    };
  };

  const handleStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
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
    if (Math.hypot(dx, dy) > 7) {
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
      }, 40);
    }
  };

  const handleWheelZoom = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    applyZoom(panZoom.scale + (e.deltaY < 0 ? 0.2 : -0.2));
  };

  const nextUnlockedStage = useMemo(() => {
    return CAT_STAGES.find(
      (s) => s.order === activeStage.order + 1 && unlockedSet.has(s.id)
    );
  }, [activeStage.order, unlockedSet]);

  return (
    <section
      aria-label="Tìm Mèo và Đồ Xinh"
      className="rounded-2xl border border-[#ECCFD5] bg-[#FFF9F2] text-[#43312B] overflow-hidden shadow-[0_14px_38px_-16px_rgba(120,76,65,0.2)]"
    >
      {/* TITLE & TOWN MAP SCREEN */}
      {screen === 'TITLE' && (
        <div className="p-4 sm:p-6 space-y-5 bg-gradient-to-b from-[#FFFDF8] to-[#FFF4EA]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFE0D2] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#FCE2E6] border-2 border-[#43312B] flex items-center justify-center shrink-0">
                <Cat className="w-6 h-6 text-[#D95B72]" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#43312B] leading-tight">
                  Tìm Mèo &amp; Đồ Xinh
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6258] mt-0.5">
                  Tiệm Tạp Hóa Tí Hon · Tô màu thị trấn · Mèo Vàng {secretCatCollectedTotal}/{getMainStages().length}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-start="true"
              data-testid="cat-start-btn"
              onClick={() => startStage()}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#E87084] hover:bg-[#DF5C72] text-white border-2 border-[#43312B] text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Mở Tranh Chơi Ngay</span>
            </button>
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
                        {prog.cleared ? `${regTotal}/${regTotal}` : `${prog.foundItemIds.length}/${regTotal}`}
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
            Vuốt kéo ngắm tranh · Chạm đồ giống hình bên dưới · Chạm bụi cây, hộp bánh, rèm cửa để lật tìm · Enter để bắt đầu
          </p>
        </div>
      )}

      {/* ACTIVE PLAY SCREEN */}
      {screen === 'PLAYING' && (
        <div className="flex flex-col bg-[#FFF7EE]">
          {/* Compact Icon-First Pastel HUD */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#FFFDF8] border-b-2 border-[#EEDFD2]">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                aria-label="Quay về bản đồ thị trấn"
                onClick={() => setScreen('TITLE')}
                className="min-h-[40px] px-2.5 rounded-xl border-2 border-[#E6D4C4] bg-white hover:border-[#D95B72] inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Thị Trấn</span>
              </button>

              <div className="min-w-0 flex items-center gap-2.5">
                <span className="font-bold text-sm sm:text-base truncate max-w-[145px] sm:max-w-none">
                  {activeStage.title}
                </span>
                <span
                  data-testid="cat-progress-count"
                  className="px-2 py-0.5 rounded-lg bg-[#FCE7EA] text-[#B84158] text-xs font-mono font-bold tabular-nums shrink-0"
                >
                  {regularFoundCount}/{regularItems.length}
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
                    className="px-2 py-0.5 rounded-lg bg-amber-300 text-[#43312B] text-xs font-mono font-extrabold tabular-nums animate-bounce shrink-0"
                  >
                    Combo ×{comboStreak}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <span className="px-2 py-1 text-xs font-bold tabular-nums text-[#745B50]">
                {formatCatTimer(elapsedSec)}
              </span>

              <button
                type="button"
                data-testid="cat-hint-btn"
                onClick={handleUseHint}
                aria-label="Gợi ý vị trí"
                className="min-h-[40px] px-2.5 rounded-xl border-2 border-[#F4C46A] bg-[#FFF4D6] hover:bg-[#FDE8B0] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gợi Ý</span>
              </button>

              <div className="flex items-center rounded-xl border-2 border-[#E6D4C4] bg-white overflow-hidden">
                <button
                  type="button"
                  data-testid="cat-zoom-out-btn"
                  aria-label="Thu nhỏ"
                  onClick={() => applyZoom(panZoom.scale - 0.35)}
                  disabled={panZoom.scale <= CAT_MIN_ZOOM}
                  className="min-h-[38px] w-8 flex items-center justify-center disabled:opacity-35 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid="cat-zoom-reset-btn"
                  aria-label="Đưa về 1x"
                  onClick={() => setPanZoom({ scale: 1, panX: 0, panY: 0 })}
                  className="min-h-[38px] px-1.5 text-[11px] font-bold tabular-nums cursor-pointer"
                >
                  {panZoom.scale.toFixed(1)}×
                </button>
                <button
                  type="button"
                  data-testid="cat-zoom-in-btn"
                  aria-label="Phóng to"
                  onClick={() => applyZoom(panZoom.scale + 0.35)}
                  disabled={panZoom.scale >= CAT_MAX_ZOOM}
                  className="min-h-[38px] w-8 flex items-center justify-center disabled:opacity-35 cursor-pointer"
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
                className={`min-h-[40px] w-10 rounded-xl border-2 flex items-center justify-center cursor-pointer ${
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
                className="min-h-[40px] w-10 rounded-xl border-2 border-[#E6D4C4] bg-white flex items-center justify-center cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Panoramic Living Illustration Stage */}
          <div
            ref={viewportRef}
            data-testid="cat-scene-viewport"
            onWheel={handleWheelZoom}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerUp}
            className="relative w-full h-[320px] sm:h-[430px] lg:h-[490px] bg-[#F5E6D8] overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing flex items-center justify-center"
          >
            <div
              className="relative origin-center transition-transform duration-75 ease-out shrink-0"
              style={{
                width: 'max(100%, 1080px)',
                aspectRatio: `${CAT_SCENE_W} / ${CAT_SCENE_H}`,
                transform: `translate3d(${panZoom.panX}px, ${panZoom.panY}px, 0) scale(${panZoom.scale})`,
              }}
            >
              <svg
                viewBox={`0 0 ${CAT_SCENE_W} ${CAT_SCENE_H}`}
                className="w-full h-full block pointer-events-none"
                preserveAspectRatio="none"
              >
                {renderCatWorldBackdrop(activeStage.theme)}

                {/* Items & Cats Layer */}
                {activeStage.items.map((item) => {
                  const found = foundSet.has(item.id);
                  const accessible = isCatItemAccessible(item, openedCoverIds);
                  if (found) return null;
                  return (
                    <g
                      key={item.id}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotateDeg ?? 0}) scale(${item.scale ?? 1})`}
                      style={{
                        opacity: accessible ? 1 : 0.08,
                        transition: 'opacity 180ms ease',
                      }}
                    >
                      <CatItemGraphic artKey={item.artKey} />
                    </g>
                  );
                })}

                {/* Interactive Tap-to-Reveal Covers */}
                {activeStage.covers.map((cov) => {
                  const isOpen = openedCoverIds.includes(cov.id);
                  const tx = isOpen ? cov.x + cov.openOffsetX : cov.x;
                  const ty = isOpen ? cov.y + cov.openOffsetY : cov.y;
                  const rot = isOpen ? cov.openRotateDeg : 0;
                  return (
                    <g
                      key={cov.id}
                      transform={`translate(${tx}, ${ty}) rotate(${rot}, ${cov.w / 2}, ${cov.h / 2})`}
                      style={{
                        opacity: isOpen ? 0.45 : 1,
                        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease',
                      }}
                    >
                      {renderCatCoverProp(cov, isOpen)}
                    </g>
                  );
                })}

                {/* Visual Hint Ring */}
                {activeHint && (
                  <g transform={`translate(${activeHint.x}, ${activeHint.y})`}>
                    <circle
                      r="52"
                      fill="#FDE68A"
                      fillOpacity="0.22"
                      stroke="#E87084"
                      strokeWidth="3.5"
                      strokeDasharray="9 6"
                    />
                  </g>
                )}
              </svg>

              {/* Accessible Native Hotspots for Items & Secret Cat (z-20) */}
              {activeStage.items.map((item) => {
                const found = foundSet.has(item.id);
                const accessible = isCatItemAccessible(item, openedCoverIds);
                if (found || !accessible) return null;
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
                      width: `${Math.max(5.5, (item.hitW / CAT_SCENE_W) * 100)}%`,
                      height: `${Math.max(8, (item.hitH / CAT_SCENE_H) * 100)}%`,
                    }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-[#E87084] cursor-pointer transition-colors"
                  />
                );
              })}

              {/* Tap-to-Reveal Cover Hotspots (z-30 closed / z-10 open) */}
              {activeStage.covers.map((cov) => {
                const isOpen = openedCoverIds.includes(cov.id);
                const leftPct =
                  (((isOpen ? cov.x + cov.openOffsetX : cov.x) + cov.w / 2) / CAT_SCENE_W) * 100;
                const topPct =
                  (((isOpen ? cov.y + cov.openOffsetY : cov.y) + cov.h / 2) / CAT_SCENE_H) * 100;
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
                      isOpen ? 'z-10 border-transparent' : 'z-30 border-[#43312B]/15 hover:border-[#E87084]'
                    } -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-dashed cursor-pointer transition-colors`}
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
          </div>

          {/* 0%-Text Visual Thumbnail Bar (Lights Up Into Pastel Color When Found!) */}
          <div
            aria-label="Thanh vật phẩm cần tìm"
            data-testid="cat-thumbnail-bar"
            className="bg-[#FFFDF8] border-t-2 border-[#EEDFD2] px-3 py-2.5 flex items-center gap-2 overflow-x-auto"
          >
            {regularItems.map((item) => {
              const found = foundSet.has(item.id);
              const isHinted = activeHint?.item.id === item.id;
              return (
                <div
                  key={item.id}
                  data-testid={`cat-thumb-${item.id}`}
                  data-found={found ? 'true' : 'false'}
                  title={item.label}
                  aria-label={`${item.label}: ${found ? 'Đã tìm thấy' : 'Chưa tìm thấy'}`}
                  className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center transition-transform ${
                    found
                      ? 'bg-[#FFF0F3] border-[#E87084] scale-100'
                      : isHinted
                      ? 'bg-[#FFF5D6] border-amber-400 animate-pulse'
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

            {/* Secret Golden Cat Slot on Right of Bar */}
            {secretCatItem && (
              <div
                data-testid={`cat-thumb-${secretCatItem.id}`}
                data-found={stageSave.foundSecretCat ? 'true' : 'false'}
                title="Mèo Vàng Bí Mật (ẩn trong tranh)"
                aria-label={`Mèo Vàng Bí Mật: ${stageSave.foundSecretCat ? 'Đã tìm thấy' : 'Chưa tìm thấy'}`}
                className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-dashed flex items-center justify-center ml-auto ${
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

      {/* VICTORY & SHARE ACHIEVEMENT SCREEN */}
      {screen === 'VICTORY' && (
        <div
          data-testid="cat-victory-screen"
          className="p-5 sm:p-8 bg-gradient-to-b from-[#FFFDF8] to-[#FCEEEB] flex flex-col items-center text-center space-y-5"
        >
          <div className="flex items-center gap-1.5" aria-label="Sao đạt được">
            {[1, 2, 3].map((s) => {
              const stars = computeCatStageStars(
                hintsUsed,
                elapsedSec,
                stageSave.foundSecretCat
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
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#43312B]">
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
