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
  BookOpen,
  Check,
  Coffee,
  Eye,
  Lightbulb,
  Music,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ANTIQUE_LEVELS,
  clampPanAndZoom,
  collectTotalShowcaseStats,
  computeLevelRating,
  createInitialProgressForLevel,
  getActiveClueItems,
  isItemAccessible,
  MAX_ZOOM,
  MIN_ZOOM,
  parseShopSave,
  pickSmartHint,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type AntiqueEndingBranch,
  type AntiqueItemDef,
  type AntiqueLevelDef,
  type AntiqueShopSaveData,
  type HintTargetResult,
  type PanZoomState,
} from '../utils/antiqueShopEngine.ts';
import { antiqueShopAudio } from '../utils/antiqueShopAudio.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import {
  AntiqueShopEmblem,
  MemoCoverArtwork,
  MemoItemArtwork,
  MemoSceneBackdrop,
  renderTeaDecorArtwork,
} from './AntiqueShopArt.tsx';

interface AntiqueShopGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type ScreenPhase = 'TITLE' | 'PLAYING' | 'ENDING';

const STORAGE_KEY = 'thuanle-antique-shop-v1';

function loadShopSave(): AntiqueShopSaveData {
  if (typeof window === 'undefined') {
    return parseShopSave(null);
  }
  try {
    return parseShopSave(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return parseShopSave(null);
  }
}

function persistShopSave(save: AntiqueShopSaveData) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Ignore storage quota errors
  }
}

export function AntiqueShopGameSection({
  theme: _theme,
  onToggleTheme: _onToggleTheme,
}: AntiqueShopGameSectionProps) {
  const [saveData, setSaveData] = useState<AntiqueShopSaveData>(() => loadShopSave());
  const [screen, setScreen] = useState<ScreenPhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'PLAYING';
      }
    }
    return 'TITLE';
  });

  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [showcaseBoxFilter, setShowcaseBoxFilter] = useState<string>('all');
  const [soundMuted, setSoundMuted] = useState(false);
  const [musicOn, setMusicOn] = useState(false);

  const [panZoom, setPanZoom] = useState<PanZoomState>({ scale: 1, panX: 0, panY: 0 });
  const [activeHint, setActiveHint] = useState<HintTargetResult | null>(null);
  const [focusedClueId, setFocusedClueId] = useState<string | null>(null);
  const [lastFoundItem, setLastFoundItem] = useState<AntiqueItemDef | null>(null);
  const [wrongTapFx, setWrongTapFx] = useState<{ xPct: number; yPct: number; key: number } | null>(
    null
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originPanX: 0,
    originPanY: 0,
    moved: false,
  });

  const pinchRef = useRef<{
    pointers: Map<number, { x: number; y: number }>;
    initialDist: number;
    initialScale: number;
  }>({
    pointers: new Map(),
    initialDist: 0,
    initialScale: 1,
  });

  const activeLevel: AntiqueLevelDef = useMemo(
    () => ANTIQUE_LEVELS.find((l) => l.id === saveData.activeLevelId) ?? ANTIQUE_LEVELS[0],
    [saveData.activeLevelId]
  );

  const levelProgress = useMemo(
    () => saveData.levels[activeLevel.id] ?? createInitialProgressForLevel(),
    [saveData.levels, activeLevel.id]
  );

  const foundSet = useMemo(
    () => new Set(levelProgress.foundItemIds),
    [levelProgress.foundItemIds]
  );
  const openedCoverSet = useMemo(
    () => new Set(levelProgress.openedCoverIds),
    [levelProgress.openedCoverIds]
  );

  const activeClues = useMemo(
    () => getActiveClueItems(activeLevel, levelProgress.foundItemIds, 4),
    [activeLevel, levelProgress.foundItemIds]
  );

  const showcaseStats = useMemo(() => collectTotalShowcaseStats(saveData), [saveData]);

  const currentRating = useMemo(
    () =>
      computeLevelRating(
        activeLevel.items.length,
        levelProgress.foundItemIds.length,
        levelProgress.hintsUsed,
        levelProgress.misclicks
      ),
    [
      activeLevel.items.length,
      levelProgress.foundItemIds.length,
      levelProgress.hintsUsed,
      levelProgress.misclicks,
    ]
  );

  // Sync save state to localStorage whenever changed
  useEffect(() => {
    persistShopSave(saveData);
  }, [saveData]);

  // Sync game shell state to document.body.dataset.state
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.dataset.state =
      screen === 'TITLE' ? 'title' : screen === 'ENDING' ? 'gameover' : 'playing';
    return () => {
      delete document.body.dataset.state;
    };
  }, [screen]);

  // Manage optional ambient lo-fi music
  useEffect(() => {
    if (musicOn && !soundMuted && screen !== 'TITLE') {
      antiqueShopAudio.startLofiLoop();
    } else {
      antiqueShopAudio.stopLofiLoop();
    }
    return () => {
      antiqueShopAudio.stopLofiLoop();
    };
  }, [musicOn, soundMuted, screen]);

  const startLevel = useCallback((levelId?: string) => {
    antiqueShopAudio.unlock();
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        antiqueShopAudio.playSfx('paper', soundMuted);
      });
    }
    if (levelId) {
      setSaveData((prev) => ({ ...prev, activeLevelId: levelId }));
    }
    setPanZoom({ scale: 1, panX: 0, panY: 0 });
    setActiveHint(null);
    setFocusedClueId(null);
    setLastFoundItem(null);
    setScreen('PLAYING');
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [soundMuted]);

  // Enter / Space shortcut on Title Screen
  useEffect(() => {
    if (screen !== 'TITLE') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startLevel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, startLevel]);

  const applyZoom = useCallback((nextScale: number, nextPanX?: number, nextPanY?: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const vw = rect?.width ?? 900;
    const vh = rect?.height ?? 558;
    setPanZoom((prev) =>
      clampPanAndZoom(nextScale, nextPanX ?? prev.panX, nextPanY ?? prev.panY, vw, vh)
    );
  }, []);

  const handleToggleCover = useCallback(
    (coverId: string) => {
      antiqueShopAudio.unlock();
      const willOpen = !openedCoverSet.has(coverId);
      antiqueShopAudio.playSfx(willOpen ? 'cover_open' : 'paper', soundMuted);

      setSaveData((prev) => {
        const cur = prev.levels[activeLevel.id] ?? createInitialProgressForLevel();
        const nextOpened = willOpen
          ? Array.from(new Set([...cur.openedCoverIds, coverId]))
          : cur.openedCoverIds.filter((id) => id !== coverId);
        return {
          ...prev,
          levels: {
            ...prev.levels,
            [activeLevel.id]: {
              ...cur,
              openedCoverIds: nextOpened,
            },
          },
        };
      });

      if (activeHint && activeHint.needsCoverOpened) {
        setActiveHint((prevHint) =>
          prevHint
            ? {
                ...prevHint,
                needsCoverOpened: false,
                zoneX: prevHint.item.x,
                zoneY: prevHint.item.y,
                hintText: `Đã mở lớp che! Món "${prevHint.item.name}" đang nằm ngay tại vùng sáng.`,
              }
            : null
        );
      }
    },
    [openedCoverSet, soundMuted, activeLevel.id, activeHint]
  );

  const handleCollectItem = useCallback(
    (item: AntiqueItemDef) => {
      if (foundSet.has(item.id)) return;
      if (!isItemAccessible(item, levelProgress.openedCoverIds)) return;

      antiqueShopAudio.unlock();
      antiqueShopAudio.playSfx('pickup', soundMuted);

      const nextFoundIds = [...levelProgress.foundItemIds, item.id];
      const completedAll = nextFoundIds.length >= activeLevel.items.length;
      const ratingIfDone = computeLevelRating(
        activeLevel.items.length,
        nextFoundIds.length,
        levelProgress.hintsUsed,
        levelProgress.misclicks
      );

      setSaveData((prev) => {
        const cur = prev.levels[activeLevel.id] ?? createInitialProgressForLevel();
        return {
          ...prev,
          levels: {
            ...prev.levels,
            [activeLevel.id]: {
              ...cur,
              foundItemIds: nextFoundIds,
              bestStars: completedAll
                ? Math.max(cur.bestStars, ratingIfDone.stars)
                : cur.bestStars,
              bestScore: completedAll
                ? Math.max(cur.bestScore, ratingIfDone.score)
                : cur.bestScore,
            },
          },
          teaShelfOrder: prev.teaShelfOrder.includes(item.id)
            ? prev.teaShelfOrder
            : [...prev.teaShelfOrder, item.id],
        };
      });

      setLastFoundItem(item);
      if (activeHint?.item.id === item.id) {
        setActiveHint(null);
      }
      if (focusedClueId === item.id) {
        setFocusedClueId(null);
      }

      if (completedAll) {
        antiqueShopAudio.playSfx('ending', soundMuted);
        window.setTimeout(() => {
          setScreen('ENDING');
        }, 520);
      }
    },
    [
      foundSet,
      levelProgress.openedCoverIds,
      levelProgress.foundItemIds,
      levelProgress.hintsUsed,
      levelProgress.misclicks,
      activeLevel.items.length,
      activeLevel.id,
      soundMuted,
      activeHint,
      focusedClueId,
    ]
  );

  const handleTriggerHint = useCallback(() => {
    antiqueShopAudio.unlock();
    const target = pickSmartHint(
      activeLevel,
      levelProgress.foundItemIds,
      levelProgress.openedCoverIds,
      focusedClueId
    );
    if (!target) return;

    antiqueShopAudio.playSfx('hint', soundMuted);
    setActiveHint(target);

    // Smoothly pan toward hint area if zoomed in
    if (panZoom.scale > 1.05 && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const normX = target.zoneX / SCENE_WIDTH - 0.5;
      const normY = target.zoneY / SCENE_HEIGHT - 0.5;
      applyZoom(
        panZoom.scale,
        -normX * rect.width * panZoom.scale,
        -normY * rect.height * panZoom.scale
      );
    }

    setSaveData((prev) => {
      const cur = prev.levels[activeLevel.id] ?? createInitialProgressForLevel();
      return {
        ...prev,
        levels: {
          ...prev.levels,
          [activeLevel.id]: {
            ...cur,
            hintsUsed: cur.hintsUsed + 1,
          },
        },
      };
    });
  }, [
    activeLevel,
    levelProgress.foundItemIds,
    levelProgress.openedCoverIds,
    focusedClueId,
    soundMuted,
    panZoom.scale,
    applyZoom,
  ]);

  const handleChooseEnding = useCallback(
    (branch: AntiqueEndingBranch) => {
      antiqueShopAudio.unlock();
      antiqueShopAudio.playSfx('ending', soundMuted);
      setSaveData((prev) => {
        const cur = prev.levels[activeLevel.id] ?? createInitialProgressForLevel();
        return {
          ...prev,
          levels: {
            ...prev.levels,
            [activeLevel.id]: {
              ...cur,
              chosenEnding: branch,
            },
          },
        };
      });
    },
    [activeLevel.id, soundMuted]
  );

  const handleResetLevel = useCallback(() => {
    antiqueShopAudio.unlock();
    antiqueShopAudio.playSfx('paper', soundMuted);
    setSaveData((prev) => {
      const cur = prev.levels[activeLevel.id] ?? createInitialProgressForLevel();
      return {
        ...prev,
        levels: {
          ...prev.levels,
          [activeLevel.id]: {
            ...createInitialProgressForLevel(),
            bestStars: cur.bestStars,
            bestScore: cur.bestScore,
          },
        },
      };
    });
    setActiveHint(null);
    setLastFoundItem(null);
    setFocusedClueId(null);
    setPanZoom({ scale: 1, panX: 0, panY: 0 });
    setScreen('PLAYING');
  }, [activeLevel.id, soundMuted]);

  const handleBackdropMissClick = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragStateRef.current.moved) return;
      // Ignore clicks on buttons inside the stage
      if ((e.target as HTMLElement).closest('button')) return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;

      antiqueShopAudio.unlock();
      antiqueShopAudio.playSfx('wrong', soundMuted);
      setWrongTapFx({ xPct, yPct, key: Date.now() });
      setSaveData((prev) => {
        const cur = prev.levels[activeLevel.id] ?? createInitialProgressForLevel();
        return {
          ...prev,
          levels: {
            ...prev.levels,
            [activeLevel.id]: {
              ...cur,
              misclicks: cur.misclicks + 1,
            },
          },
        };
      });
    },
    [activeLevel.id, soundMuted]
  );

  // Smooth Zoom + Pan Pointer Handlers
  const handleStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinchRef.current.pointers.size === 2) {
      const pts = Array.from(pinchRef.current.pointers.values()) as Array<{
        x: number;
        y: number;
      }>;
      pinchRef.current.initialDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchRef.current.initialScale = panZoom.scale;
      dragStateRef.current.active = false;
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originPanX: panZoom.panX,
      originPanY: panZoom.panY,
      moved: false,
    };
  };

  const handleStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pinchRef.current.pointers.has(e.pointerId)) {
      pinchRef.current.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pinchRef.current.pointers.size === 2 && pinchRef.current.initialDist > 0) {
      const pts = Array.from(pinchRef.current.pointers.values()) as Array<{
        x: number;
        y: number;
      }>;
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const nextScale = pinchRef.current.initialScale * (dist / pinchRef.current.initialDist);
      applyZoom(nextScale);
      return;
    }

    if (!dragStateRef.current.active || dragStateRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    if (Math.hypot(dx, dy) > 7) {
      dragStateRef.current.moved = true;
    }
    if (dragStateRef.current.moved && panZoom.scale > 1.01) {
      applyZoom(
        panZoom.scale,
        dragStateRef.current.originPanX + dx,
        dragStateRef.current.originPanY + dy
      );
    }
  };

  const handleStagePointerUpOrCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    pinchRef.current.pointers.delete(e.pointerId);
    if (dragStateRef.current.pointerId === e.pointerId) {
      dragStateRef.current.active = false;
      window.setTimeout(() => {
        dragStateRef.current.moved = false;
      }, 40);
    }
  };

  const handleStageWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    if (screen !== 'PLAYING') return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.22 : -0.22;
    applyZoom(panZoom.scale + delta);
  };

  return (
    <section
      aria-label="Tiệm Đồ Cũ Giờ Đóng Cửa"
      className="rounded-2xl border border-[#3E3026] bg-[#14100E] text-[#F5EFE6] overflow-hidden shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]"
    >
      {/* TITLE SCREEN */}
      {screen === 'TITLE' && (
        <div
          data-testid="antique-title-screen"
          className="p-4 sm:p-8 lg:p-10 bg-gradient-to-b from-[#1A1411] via-[#14100E] to-[#100C0A] space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#342820] pb-6">
            <div className="flex items-start sm:items-center gap-4">
              <AntiqueShopEmblem />
              <div className="space-y-1.5 max-w-2xl">
                <p className="text-xs font-mono tracking-wide text-amber-300/90">
                  Ngăn Kéo Của Ai · Ký Ức Đêm Khuya
                </p>
                <h2 className="font-serif text-2xl sm:text-4xl font-semibold text-[#FFF8EE] tracking-tight text-balance">
                  Tiệm Đồ Cũ Giờ Đóng Cửa
                </h2>
                <p className="text-sm text-[#CBBBA8] leading-relaxed">
                  Mở những chiếc vali và ngăn kéo khách bỏ quên lúc nửa đêm. Lật từng lớp giấy cũ,
                  lắng nghe câu chuyện phía sau mỗi kỷ vật và thắp sáng góc bàn trà chủ tiệm.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                data-testid="antique-open-showcase-btn"
                onClick={() => setShowcaseOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#4B3A2E] bg-[#221A15] hover:border-amber-400/60 text-[#F5EFE6] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
              >
                <Coffee className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span>Góc Bàn Trà ({showcaseStats.totalFoundItems}/{showcaseStats.totalItems})</span>
              </button>
              <button
                type="button"
                data-start="true"
                data-testid="antique-start-btn"
                onClick={() => startLevel()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#18110B] text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Mở Hộp Kỷ Niệm</span>
              </button>
            </div>
          </div>

          {/* 3 Chapter Boxes Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ANTIQUE_LEVELS.map((lvl) => {
              const prog = saveData.levels[lvl.id] ?? createInitialProgressForLevel();
              const selected = saveData.activeLevelId === lvl.id;
              const isDone = prog.foundItemIds.length >= lvl.items.length;

              return (
                <button
                  key={lvl.id}
                  type="button"
                  data-testid={`antique-level-card-${lvl.id}`}
                  onClick={() => {
                    setSaveData((prev) => ({ ...prev, activeLevelId: lvl.id }));
                  }}
                  className={`text-left rounded-xl border p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selected
                      ? 'bg-[#251C16] border-amber-400/80 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]'
                      : 'bg-[#1B1511] border-[#342820] hover:border-[#6B5240]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#B6A491] font-mono">
                      <span>Hộp số 0{lvl.order}</span>
                      <span className="tabular-nums text-amber-300">
                        {prog.foundItemIds.length}/{lvl.items.length} món
                      </span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#FFF8EE] leading-snug">
                      {lvl.title}
                    </h3>
                    <p className="text-xs text-[#C4B4A2] leading-relaxed">{lvl.guestName}</p>
                  </div>

                  <div className="pt-2 border-t border-[#32261F] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1" aria-label={`${prog.bestStars} trên 3 sao`}>
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= prog.bestStars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-[#4B3B30]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-[11px] text-amber-200/85">
                      {isDone
                        ? prog.chosenEnding === 'secret'
                          ? 'Kết: Bí mật'
                          : prog.chosenEnding === 'healing'
                            ? 'Kết: Chữa lành'
                            : 'Chờ chọn kết'
                        : selected
                          ? 'Đang chọn · Mở ngay'
                          : 'Chạm để chọn'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-xs text-[#9C8B7A] pt-1">
            Chạm hoặc phóng to (lăn chuột / chụm tay) để ngắm đồ · Nhấn vào nắp hộp, tờ báo, khăn ren để lật lớp che · Nhấn Enter để bắt đầu
          </p>
        </div>
      )}

      {/* ACTIVE PLAY SCREEN */}
      {screen === 'PLAYING' && (
        <div className="flex flex-col">
          {/* Compact World-Matched Mahogany HUD Strip */}
          <div
            data-testid="antique-hud"
            className="px-3 sm:px-4 py-2.5 bg-[#1B1511] border-b border-[#342820] flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                data-testid="antique-back-title-btn"
                onClick={() => setScreen('TITLE')}
                aria-label="Quay về quầy tiệm"
                className="min-h-[40px] px-2.5 rounded-lg border border-[#44352B] bg-[#241C16] hover:border-amber-400/60 text-[#F5EFE6] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Quầy Tiệm</span>
              </button>

              <div className="min-w-0">
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#FFF8EE] truncate leading-tight">
                  {activeLevel.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] font-mono text-[#B6A491] tabular-nums">
                  <span className="text-amber-300 font-semibold" data-testid="antique-progress-count">
                    {levelProgress.foundItemIds.length}/{activeLevel.items.length} món
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Gợi ý đã dùng: {levelProgress.hintsUsed}</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Toolbar (all >= 40px touch targets) */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                data-testid="antique-hint-btn"
                onClick={handleTriggerHint}
                disabled={levelProgress.foundItemIds.length >= activeLevel.items.length}
                className="min-h-[40px] px-3 rounded-lg border border-amber-400/45 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-45"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                <span>Gợi Ý</span>
              </button>

              <div className="inline-flex items-center rounded-lg border border-[#44352B] bg-[#241C16] overflow-hidden">
                <button
                  type="button"
                  data-testid="antique-zoom-out-btn"
                  onClick={() => applyZoom(panZoom.scale - 0.35)}
                  disabled={panZoom.scale <= MIN_ZOOM}
                  aria-label="Thu nhỏ cảnh"
                  className="min-h-[40px] px-2.5 hover:bg-[#32271F] text-[#E6D9CA] disabled:opacity-35 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  data-testid="antique-zoom-reset-btn"
                  onClick={() => applyZoom(1, 0, 0)}
                  aria-label="Đưa mức thu phóng về 1x"
                  className="min-h-[40px] px-2 text-xs font-mono tabular-nums text-amber-200 hover:bg-[#32271F] cursor-pointer whitespace-nowrap"
                >
                  {panZoom.scale.toFixed(1)}×
                </button>
                <button
                  type="button"
                  data-testid="antique-zoom-in-btn"
                  onClick={() => applyZoom(panZoom.scale + 0.35)}
                  disabled={panZoom.scale >= MAX_ZOOM}
                  aria-label="Phóng to cảnh"
                  className="min-h-[40px] px-2.5 hover:bg-[#32271F] text-[#E6D9CA] disabled:opacity-35 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                data-testid="antique-music-btn"
                onClick={() => {
                  antiqueShopAudio.unlock();
                  setMusicOn((m) => !m);
                }}
                aria-label={musicOn ? 'Tắt nhạc piano lo-fi' : 'Bật nhạc piano lo-fi'}
                className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  musicOn && !soundMuted
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                    : 'border-[#44352B] bg-[#241C16] text-[#B6A491] hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden md:inline">Lo-Fi</span>
              </button>

              <button
                type="button"
                data-testid="antique-mute-btn"
                onClick={() => {
                  antiqueShopAudio.unlock();
                  setSoundMuted((s) => !s);
                }}
                aria-label={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                className="min-h-[40px] px-2.5 rounded-lg border border-[#44352B] bg-[#241C16] text-[#E6D9CA] hover:border-amber-400/50 cursor-pointer"
              >
                {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowcaseOpen(true)}
                aria-label="Mở Góc Bàn Trà"
                className="min-h-[40px] px-3 rounded-lg border border-[#44352B] bg-[#241C16] hover:border-amber-400/60 text-amber-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Coffee className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Bàn Trà</span>
              </button>

              {levelProgress.foundItemIds.length >= activeLevel.items.length && (
                <button
                  type="button"
                  data-testid="antique-view-ending-btn"
                  onClick={() => setScreen('ENDING')}
                  className="min-h-[40px] px-3 rounded-lg bg-amber-400 text-[#18110B] text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Đọc Cái Kết
                </button>
              )}
            </div>
          </div>

          {/* Interactive Zoom/Pan Diorama Viewport */}
          <div
            ref={viewportRef}
            data-testid="antique-scene-viewport"
            onWheel={handleStageWheel}
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUpOrCancel}
            onPointerCancel={handleStagePointerUpOrCancel}
            onPointerUpCapture={handleBackdropMissClick}
            className="relative w-full py-2 sm:py-3 flex items-center justify-center bg-[#0F0B09] overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
          >
            {/* Transformed Stage (Exact 1000:620 box so SVG + HTML hotspots align 1:1 at every screen size) */}
            <div
              className="relative origin-center rounded-lg overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.6)]"
              style={{
                width: 'min(100%, 940px, calc(60dvh * 1000 / 620))',
                aspectRatio: '1000 / 620',
                transform: `translate3d(${panZoom.panX}px, ${panZoom.panY}px, 0) scale(${panZoom.scale})`,
              }}
            >
              <svg
                viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
                className="w-full h-full block pointer-events-none"
                preserveAspectRatio="none"
              >
                <MemoSceneBackdrop theme={activeLevel.theme} />

                {/* Collectible Items Layer */}
                {activeLevel.items.map((item) => {
                  const isFound = foundSet.has(item.id);
                  const accessible = isItemAccessible(item, levelProgress.openedCoverIds);
                  if (isFound) return null;

                  return (
                    <g
                      key={item.id}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotateDeg ?? 0})`}
                      style={{
                        opacity: accessible ? 1 : 0.08,
                      }}
                    >
                      <MemoItemArtwork item={item} />
                    </g>
                  );
                })}

                {/* Interactive 2-Layer Covers Artwork (rotated around cover center) */}
                {activeLevel.covers.map((cover) => {
                  const isOpen = openedCoverSet.has(cover.id);
                  const tx = isOpen ? cover.x + cover.openOffsetX : cover.x;
                  const ty = isOpen ? cover.y + cover.openOffsetY : cover.y;
                  const rot = isOpen ? cover.openRotateDeg : 0;
                  return (
                    <g
                      key={cover.id}
                      transform={`translate(${tx}, ${ty}) rotate(${rot}, ${cover.w / 2}, ${cover.h / 2})`}
                      style={{
                        opacity: isOpen ? 0.58 : 0.98,
                        transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease',
                      }}
                    >
                      <MemoCoverArtwork cover={cover} isOpen={isOpen} />
                    </g>
                  );
                })}

                {/* Smart Hint Pulsing Lantern Zone */}
                {activeHint && (
                  <g transform={`translate(${activeHint.zoneX}, ${activeHint.zoneY})`}>
                    <circle
                      r="56"
                      fill="#FBBF24"
                      fillOpacity="0.14"
                      stroke="#FDE68A"
                      strokeWidth="2.5"
                      strokeDasharray="8 5"
                    />
                    <circle r="22" fill="#FDE68A" fillOpacity="0.18" />
                  </g>
                )}
              </svg>

              {/* Accessible Native <button> Hotspots for Accessible Items */}
              {activeLevel.items.map((item) => {
                const isFound = foundSet.has(item.id);
                const accessible = isItemAccessible(item, levelProgress.openedCoverIds);
                if (isFound || !accessible) return null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`antique-item-${item.id}`}
                    aria-label={`Nhặt kỷ vật: ${item.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStateRef.current.moved) return;
                      handleCollectItem(item);
                    }}
                    style={{
                      left: `${(item.x / SCENE_WIDTH) * 100}%`,
                      top: `${(item.y / SCENE_HEIGHT) * 100}%`,
                      width: `${Math.max(6, (item.hitW / SCENE_WIDTH) * 100)}%`,
                      height: `${Math.max(8.5, (item.hitH / SCENE_HEIGHT) * 100)}%`,
                    }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-transparent hover:bg-amber-300/15 focus-visible:outline-2 focus-visible:outline-amber-300 cursor-pointer transition-colors"
                  />
                );
              })}

              {/* Accessible Native <button> Hotspots for 2-Layer Interactive Covers */}
              {activeLevel.covers.map((cover) => {
                const isOpen = openedCoverSet.has(cover.id);
                const leftPct = (((isOpen ? cover.x + cover.openOffsetX : cover.x) + cover.w / 2) / SCENE_WIDTH) * 100;
                const topPct = (((isOpen ? cover.y + cover.openOffsetY : cover.y) + cover.h / 2) / SCENE_HEIGHT) * 100;
                const wPct = (cover.w / SCENE_WIDTH) * 100;
                const hPct = (cover.h / SCENE_HEIGHT) * 100;
                return (
                  <button
                    key={cover.id}
                    type="button"
                    data-testid={`antique-cover-${cover.id}`}
                    aria-label={isOpen ? `Đóng lại: ${cover.label}` : `Mở lớp che: ${cover.label}`}
                    title={cover.actionHint}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dragStateRef.current.moved) return;
                      handleToggleCover(cover.id);
                    }}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${isOpen ? wPct * 0.72 : wPct}%`,
                      height: `${isOpen ? hPct * 0.72 : hPct}%`,
                      transform: isOpen ? `translate(-50%, -50%) rotate(${cover.openRotateDeg}deg)` : 'translate(-50%, -50%)',
                    }}
                    className={`group absolute ${
                      isOpen ? 'z-10' : 'z-30'
                    } rounded-xl border cursor-pointer flex items-end justify-center pb-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-amber-300 ${
                      isOpen
                        ? 'border-transparent hover:border-amber-200/45 bg-transparent'
                        : 'border-amber-200/20 hover:border-amber-300/75 bg-transparent'
                    }`}
                  >
                    <span
                      className={`max-w-[94%] truncate px-1.5 sm:px-2 py-0.5 rounded bg-[#14100E]/82 text-[9px] sm:text-[10px] font-mono text-amber-200/95 pointer-events-none transition-opacity ${
                        isOpen
                          ? 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                          : 'opacity-85 group-hover:opacity-100'
                      }`}
                    >
                      {isOpen ? 'Đậy lại' : cover.actionHint}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Brief Subtle Wrong-Tap Ripple */}
            {wrongTapFx && (
              <div
                key={wrongTapFx.key}
                style={{ left: `${wrongTapFx.xPct}%`, top: `${wrongTapFx.yPct}%` }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-amber-200/50 animate-ping"
              />
            )}

            {/* Floating Story Fragment Toast when Finding an Item OR Active Hint Prompt */}
            {(lastFoundItem || activeHint) && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
                <div
                  data-testid="antique-story-toast"
                  className="pointer-events-auto max-w-xl w-full rounded-xl border border-amber-400/50 bg-[#1B1511]/95 px-4 py-2.5 shadow-xl flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-mono text-amber-300 font-semibold">
                      {activeHint
                        ? 'Đèn gợi ý tiệm đồ cũ'
                        : `Đã nhặt: ${lastFoundItem?.name}`}
                    </p>
                    <p className="text-xs sm:text-sm text-[#F5EFE6] leading-snug">
                      {activeHint ? activeHint.hintText : lastFoundItem?.storyNote}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Đóng thẻ ký ức"
                    onClick={() => {
                      setLastFoundItem(null);
                      setActiveHint(null);
                    }}
                    className="min-h-[34px] px-2 rounded-lg text-xs font-mono text-[#B6A491] hover:text-white cursor-pointer shrink-0"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Docked Emotional Clue Strip Below Scene (Never Covers Interactive Tiles) */}
          <div className="p-3 sm:p-4 bg-[#18120F] border-t border-[#342820] space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#B6A491]">
              <span>
                {activeClues.length > 0
                  ? 'Manh mối đang giải mã (chạm thẻ để ưu tiên Gợi Ý):'
                  : 'Tất cả kỷ vật trong hộp đã được tìm thấy trọn vẹn.'}
              </span>
              <button
                type="button"
                onClick={handleResetLevel}
                className="text-xs font-mono text-[#B6A491] hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Chơi lại hộp này</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {activeClues.map((clueItem) => {
                const isFocused = focusedClueId === clueItem.id;
                const needsCover = Boolean(
                  clueItem.hiddenUnderCoverId &&
                    !openedCoverSet.has(clueItem.hiddenUnderCoverId)
                );
                return (
                  <button
                    key={clueItem.id}
                    type="button"
                    data-testid={`antique-clue-${clueItem.id}`}
                    onClick={() => setFocusedClueId(isFocused ? null : clueItem.id)}
                    className={`text-left rounded-xl border px-3 py-2.5 transition-colors cursor-pointer space-y-1 ${
                      isFocused
                        ? 'bg-[#2B2018] border-amber-400/80'
                        : 'bg-[#211A15] border-[#382B22] hover:border-[#634C3D]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-200 truncate">
                        {clueItem.shortTag}
                      </span>
                      {needsCover && (
                        <span className="text-[10px] font-mono text-[#B6A491] shrink-0">
                          Dưới lớp che
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#DFD3C3] leading-relaxed line-clamp-3">
                      {clueItem.emotionalClue}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ENDING / BRANCH SELECTION SCREEN */}
      {screen === 'ENDING' && (
        <div
          data-testid="antique-ending-screen"
          className="p-5 sm:p-8 bg-gradient-to-b from-[#1D1612] to-[#120E0B] space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#342820] pb-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-amber-300">
                Hoàn thành 100% · {activeLevel.title}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FFF8EE]">
                Chọn Hướng Khép Lại Kỷ Niệm
              </h2>
            </div>
            <div className="flex items-center gap-4 font-mono tabular-nums">
              <div className="text-right">
                <div className="text-[11px] text-[#B6A491]">{currentRating.rankLabel}</div>
                <div className="text-lg font-bold text-amber-300">{currentRating.score} điểm</div>
              </div>
              <div className="flex items-center gap-1" aria-label={`Đạt ${currentRating.stars} trên 3 sao`}>
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= currentRating.stars
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-[#44352B]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-[#D6C7B6] italic leading-relaxed max-w-3xl">
            {activeLevel.openingWhisper}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['healing', 'secret'] as const).map((branchKey) => {
              const ending = activeLevel.endings[branchKey];
              const isChosen = levelProgress.chosenEnding === branchKey;
              return (
                <div
                  key={branchKey}
                  className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between gap-4 ${
                    isChosen
                      ? 'bg-[#261D17] border-amber-400'
                      : 'bg-[#1B1511] border-[#382B22]'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-amber-300">
                        {branchKey === 'healing' ? 'Nhánh Chữa Lành' : 'Nhánh Bí Mật'}
                      </span>
                      {isChosen && (
                        <span className="text-xs font-mono text-emerald-300 inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Đã chọn
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#FFF8EE]">
                      {ending.title}
                    </h3>
                    <p className="text-sm text-[#DED2C3] leading-relaxed">{ending.epilogue}</p>
                    <div className="pt-2 border-t border-[#32261F] text-xs text-amber-200/90">
                      Quà đặt bàn trà: <strong>{ending.teaDecorName}</strong> — {ending.teaDecorNote}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid={`antique-choose-ending-${branchKey}`}
                    onClick={() => handleChooseEnding(branchKey)}
                    className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isChosen
                        ? 'bg-amber-400 text-[#18110B]'
                        : 'border border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200'
                    }`}
                  >
                    {ending.buttonLabel}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#342820]">
            <button
              type="button"
              onClick={() => setShowcaseOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#4B3A2E] bg-[#221A15] hover:border-amber-400/60 text-amber-200 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Coffee className="w-4 h-4" />
              <span>Xem Góc Bàn Trà Chủ Tiệm</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetLevel}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#44352B] bg-[#221A15] text-[#DFD3C3] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tìm Lại Màn Này</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen('TITLE')}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#18110B] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Chọn Hộp Kỷ Niệm Khác</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEA TABLE SHOWCASE MODAL ("Góc Bàn Trà Của Chủ Tiệm") */}
      {showcaseOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Góc Bàn Trà Của Chủ Tiệm"
          data-testid="antique-showcase-modal"
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowcaseOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[88vh] rounded-2xl border border-[#4A392C] bg-[#19130F] text-[#F5EFE6] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="px-5 py-4 border-b border-[#342820] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#FFF8EE]">
                  Góc Bàn Trà Của Chủ Tiệm
                </h3>
                <p className="text-xs text-[#B6A491] font-mono tabular-nums mt-0.5">
                  {showcaseStats.totalFoundItems}/{showcaseStats.totalItems} kỷ vật ·{' '}
                  {showcaseStats.completedBoxes}/{showcaseStats.totalBoxes} câu chuyện trọn vẹn ·{' '}
                  {showcaseStats.totalStars}/{showcaseStats.maxStars} sao
                </p>
              </div>
              <button
                type="button"
                data-testid="antique-close-showcase-btn"
                onClick={() => setShowcaseOpen(false)}
                className="min-h-[40px] px-3.5 rounded-xl border border-[#4A392C] bg-[#241C16] hover:border-amber-400 text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Earned Tea Table Centerpieces */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-mono text-amber-300">
                  Kỷ vật đặt trên mặt bàn trà (mở khóa khi hoàn thành từng hộp)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ANTIQUE_LEVELS.map((lvl) => {
                    const prog = saveData.levels[lvl.id];
                    const ending =
                      prog?.chosenEnding && prog.foundItemIds.length >= lvl.items.length
                        ? lvl.endings[prog.chosenEnding]
                        : null;
                    return (
                      <div
                        key={lvl.id}
                        className={`rounded-xl border p-3.5 flex items-center gap-3 ${
                          ending
                            ? 'bg-[#261D17] border-amber-400/60'
                            : 'bg-[#14100D] border-[#2E241C] opacity-65'
                        }`}
                      >
                        <div className={ending ? '' : 'grayscale opacity-45'}>
                          {renderTeaDecorArtwork(lvl.teaRewardIcon)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#FFF8EE] truncate">
                            {ending ? ending.teaDecorName : 'Vị trí còn trống'}
                          </div>
                          <p className="text-[11px] text-[#B6A491] leading-snug mt-0.5 line-clamp-2">
                            {ending
                              ? ending.teaDecorNote
                              : `Hoàn tất "${lvl.title}" để nhận quà trưng bày.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filter by Box */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-mono text-amber-300">
                    Tủ kính ký ức đã sưu tầm
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowcaseBoxFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                        showcaseBoxFilter === 'all'
                          ? 'bg-amber-400 text-[#18110B] font-semibold'
                          : 'bg-[#241C16] text-[#CBBBA8]'
                      }`}
                    >
                      Tất cả
                    </button>
                    {ANTIQUE_LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setShowcaseBoxFilter(lvl.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          showcaseBoxFilter === lvl.id
                            ? 'bg-amber-400 text-[#18110B] font-semibold'
                            : 'bg-[#241C16] text-[#CBBBA8]'
                        }`}
                      >
                        Hộp 0{lvl.order}
                      </button>
                    ))}
                  </div>
                </div>

                {showcaseStats.totalFoundItems === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#3E3026] p-8 text-center space-y-2">
                    <Sparkles className="w-6 h-6 text-amber-300/60 mx-auto" />
                    <p className="text-sm text-[#CBBBA8]">
                      Tủ kính bàn trà chưa có món kỷ vật nào. Hãy mở một chiếc hộp và nhặt kỷ vật đầu tiên.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ANTIQUE_LEVELS.filter(
                      (l) => showcaseBoxFilter === 'all' || showcaseBoxFilter === l.id
                    ).flatMap((lvl) => {
                      const foundIds = new Set(saveData.levels[lvl.id]?.foundItemIds ?? []);
                      return lvl.items
                        .filter((item) => foundIds.has(item.id))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-[#382B22] bg-[#211A15] p-3 flex items-start gap-3"
                          >
                            <div className="w-12 h-12 rounded-lg bg-[#14100D] border border-[#342820] flex items-center justify-center shrink-0">
                              <svg viewBox="-45 -45 90 90" className="w-10 h-10" aria-hidden="true">
                                <MemoItemArtwork item={item} />
                              </svg>
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="text-xs font-semibold text-[#FFF8EE]">
                                {item.showcaseTitle}
                              </div>
                              <div className="text-[11px] font-mono text-amber-300/80">
                                Hộp 0{lvl.order} · {item.shortTag}
                              </div>
                              <p className="text-xs text-[#D6C7B6] leading-relaxed">
                                {item.storyNote}
                              </p>
                            </div>
                          </div>
                        ));
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
