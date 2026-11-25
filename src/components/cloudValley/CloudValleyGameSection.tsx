import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  Award,
  BookOpen,
  Coins,
  Factory,
  FastForward,
  Hammer,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Settings,
  ShoppingBag,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import titleBackdropUrl from '../../assets/images/cloud_valley_title_bg_1795602863469.jpg';
import { cloudValleyAudio } from '../../utils/cloudValleyAudio.ts';
import { CloudValleyCanvasController } from '../../utils/cloudValleyCanvas.ts';
import {
  AUTOMATION_BLUEPRINTS,
  CROPS,
  DAY_DURATION_SECONDS,
  getXpForNextLevel,
  SEASON_META,
  WEATHER_LABELS,
  type AutomationId,
  type ToolId,
} from '../../utils/cloudValleyData.ts';
import {
  clearCloudValleySave,
  loadCloudValleyState,
  saveCloudValleyState,
} from '../../utils/cloudValleyDb.ts';
import {
  advanceToNextDay,
  applyToolAction,
  buyItemFromMarket,
  buyLivestock,
  collectArtisanSlot,
  createInitialCloudValleyState,
  feedSprite,
  fulfillVillagerOrder,
  getSeasonId,
  getTileIndex,
  isCropMature,
  isTileInGreenhouse,
  isTileUnlocked,
  parseSaveState,
  processOfflineCatchUp,
  sellInventoryItem,
  serializeSaveState,
  startArtisanRecipe,
  summonEarthSprite,
  tendLivestock,
  tickCloudValleySimulation,
  tradeWeekendFair,
  unlockTerrace,
  upgradeToolTier,
  type CloudValleyGameState,
  type OfflineCatchupReport,
} from '../../utils/cloudValleyEngine.ts';
import { CloudValleyTitleLockup, ToolSvgIcon } from './CloudValleyIcons.tsx';
import { CloudValleyModals, type CloudValleyModalId } from './CloudValleyModals.tsx';

type GamePhase = 'title' | 'playing' | 'paused';

interface CloudValleyGameSectionProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  fullViewport?: boolean;
}

const TOOL_BUTTONS: readonly { id: ToolId; label: string; keyHint: string }[] = [
  { id: 'hoe', label: 'Cuốc Đất', keyHint: '1' },
  { id: 'water', label: 'Tưới Nước', keyHint: '2' },
  { id: 'seed', label: 'Gieo Hạt', keyHint: '3' },
  { id: 'harvest', label: 'Thu Hoạch', keyHint: '4' },
  { id: 'compost', label: 'Phân Hữu Cơ', keyHint: '5' },
  { id: 'mutagen', label: 'Phân Đột Biến', keyHint: '6' },
  { id: 'build', label: 'Lắp Máy', keyHint: '7' },
  { id: 'inspect', label: 'Soi Đất', keyHint: '8' },
];

export function CloudValleyGameSection({
  isFullscreen = false,
  onToggleFullscreen,
  fullViewport = false,
}: CloudValleyGameSectionProps) {
  const [phase, setPhase] = useState<GamePhase>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });
  const [hasExistingSave, setHasExistingSave] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId>('harvest');
  const [selectedSeedId, setSelectedSeedId] = useState<string>('lua_mi');
  const [selectedStructureId, setSelectedStructureId] = useState<AutomationId>('sprinkler');
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);
  const [muted, setMuted] = useState(false);
  const [activeModal, setActiveModal] = useState<CloudValleyModalId>(null);
  const [offlineReport, setOfflineReport] = useState<OfflineCatchupReport | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [hoveredTileCoords, setHoveredTileCoords] = useState<{ row: number; col: number } | null>(null);

  const simRef = useRef<CloudValleyGameState>(createInitialCloudValleyState());
  const [, setHudTick] = useState(0);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CloudValleyCanvasController | null>(null);
  if (!rendererRef.current) {
    rendererRef.current = new CloudValleyCanvasController();
  }

  const cameraRef = useRef({ zoom: 1, panX: 0, panY: 0 });
  const viewportSizeRef = useRef({ width: 1024, height: 640, dpr: 1 });
  const hoverTileRef = useRef<{ row: number; col: number } | null>(null);
  const isPaintingRef = useRef(false);
  const lastPaintedKeyRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  const selectedSeedRef = useRef(selectedSeedId);
  selectedSeedRef.current = selectedSeedId;
  const selectedStructRef = useRef(selectedStructureId);
  selectedStructRef.current = selectedStructureId;
  const activeModalRef = useRef(activeModal);
  activeModalRef.current = activeModal;

  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  const syncHudNow = useCallback(() => {
    setHudTick((v) => v + 1);
  }, []);

  // Load IndexedDB save & run Offline Catch-Up simulation
  useEffect(() => {
    let mounted = true;
    void loadCloudValleyState().then(({ state, hasExistingSave: found }) => {
      if (!mounted) return;
      if (found) {
        const report = processOfflineCatchUp(state, Date.now());
        simRef.current = state;
        setHasExistingSave(true);
        if (report && (report.daysAdvanced > 0 || report.cropsMatured > 0 || report.artisanCompleted > 0 || report.spriteHarvests > 0)) {
          setOfflineReport(report);
          if (phaseRef.current === 'playing') {
            setActiveModal('offline');
          }
        }
        syncHudNow();
      }
    });
    return () => {
      mounted = false;
    };
  }, [syncHudNow]);

  // Mirror state machine to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = phase;
    return () => {
      delete document.body.dataset.state;
    };
  }, [phase]);

  // Auto-save every 8 seconds and on pagehide/beforeunload
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (phaseRef.current === 'playing') {
        void saveCloudValleyState(simRef.current);
      }
    }, 8000);
    const onUnload = () => {
      void saveCloudValleyState(simRef.current);
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onUnload);
    };
  }, []);

  const handleStartGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setPhase('playing');
    document.body.dataset.state = 'playing';
    if (offlineReport) {
      setActiveModal('offline');
    }
    cloudValleyAudio.play('harvest');
    canvasRef.current?.focus();
  }, [offlineReport]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      cloudValleyAudio.setMuted(next);
      return next;
    });
  }, []);

  // ResizeObserver for crisp DPR Canvas scaling
  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    const updateSize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      viewportSizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(mount);
    return () => ro.disconnect();
  }, [phase]);

  // Main Canvas Loop decoupled from React state
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let lastPaintTs = 0;
    let hudAccum = 0;

    const frame = (now: number) => {
      rafId = window.requestAnimationFrame(frame);
      const rawDt = Math.max(0, (now - lastTs) / 1000);
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);

      if (phaseRef.current === 'title' || phaseRef.current === 'paused') return;

      const renderer = rendererRef.current!;
      const sim = simRef.current;

      if (phaseRef.current === 'playing' && activeModalRef.current === null) {
        const simDt = dt * speedRef.current;
        const tickRes = tickCloudValleySimulation(sim, simDt);
        renderer.stepEffects(dt, sim);
        if (tickRes.hybridsDiscovered.length > 0) {
          cloudValleyAudio.play('hybrid');
          const names = tickRes.hybridsDiscovered.map((id) => CROPS[id]?.name ?? id).join(', ');
          showToast(`Đột biến giống mới: ${names}!`);
        }
      }

      // Pace full-canvas rasterization cleanly (~40fps) so software compositors & laptops stay cool
      if (now - lastPaintTs >= 24) {
        lastPaintTs = now;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const { width, height, dpr } = viewportSizeRef.current;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const cam = cameraRef.current;
            const metrics = renderer.computeMetrics(width, height, cam.zoom, cam.panX, cam.panY);
            renderer.render(ctx, sim, metrics, now / 1000, hoverTileRef.current, activeToolRef.current);
          }
        }
      }

      hudAccum += dt;
      if (hudAccum >= 0.22) {
        hudAccum = 0;
        if (phaseRef.current === 'playing') {
          setHudTick((v) => v + 1);
        }
      }
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [showToast]);

  // Unified Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (phaseRef.current === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (activeModalRef.current) {
          setActiveModal(null);
        } else {
          setPhase((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        }
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
        return;
      }

      if (phaseRef.current !== 'playing') return;

      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < TOOL_BUTTONS.length) {
        setActiveTool(TOOL_BUTTONS[idx].id);
      }
    };

    const onBlur = () => {
      isPaintingRef.current = false;
      lastPaintedKeyRef.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleStartGame, handleToggleMute]);

  const applyAtScreenPoint = useCallback(
    (clientX: number, clientY: number, isDrag = false) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cam = cameraRef.current;
      const metrics = renderer.computeMetrics(rect.width, rect.height, cam.zoom, cam.panX, cam.panY);
      const hit = renderer.screenToTile(px, py, metrics);
      hoverTileRef.current = hit;
      setHoveredTileCoords(hit);

      if (!hit) return;
      const key = `${hit.row},${hit.col}`;
      if (isDrag && lastPaintedKeyRef.current === key) return;
      lastPaintedKeyRef.current = key;

      const sim = simRef.current;
      const tile = sim.tiles[getTileIndex(hit.row, hit.col)];
      if (!tile) return;

      // Clicking a locked terrace tile shows non-blocking hint (or opens expansion panel with Inspect tool)
      if (!isTileUnlocked(sim, tile)) {
        if (!isDrag) {
          if (activeToolRef.current === 'inspect') {
            setActiveModal('automation');
          } else {
            showToast(`Ô này thuộc Tầng ${tile.terraceId} (chưa mở) — Nhấn "Chuồng & Tự Động" để khai phá!`);
          }
        }
        return;
      }

      const tool = activeToolRef.current;
      if (tool === 'inspect') {
        if (!isDrag) {
          const cropInfo = tile.crop ? ` · ${CROPS[tile.crop.cropId]?.name}` : '';
          showToast(
            `Ô (${hit.row + 1},${hit.col + 1}): Độ ẩm ${Math.round(tile.moisture)}% · Màu mỡ ${Math.round(tile.fertility)}%${cropInfo}`
          );
        }
        return;
      }

      const feedback = applyToolAction(sim, tool, hit.row, hit.col, {
        seedId: selectedSeedRef.current,
        structureId: selectedStructRef.current,
      });

      if (feedback.changed) {
        const burstColor =
          tool === 'water'
            ? '#38BDF8'
            : tool === 'harvest'
            ? '#FDE047'
            : tool === 'mutagen'
            ? '#C084FC'
            : '#86EFAC';
        for (const pos of feedback.affectedTiles) {
          const sp = renderer.tileToScreen(pos.row, pos.col, metrics);
          renderer.spawnBurst(sp.x, sp.y, burstColor, 7);
        }
        const centerSp = renderer.tileToScreen(hit.row, hit.col, metrics);
        if (feedback.hybridUnlocked) {
          renderer.spawnPopup(centerSp.x, centerSp.y, `Thu: ${feedback.hybridUnlocked}!`, '#E9D5FF');
          cloudValleyAudio.play('hybrid');
        } else if (tool === 'harvest') {
          renderer.spawnPopup(centerSp.x, centerSp.y, `+${feedback.affectedTiles.length} Thu hoạch!`, '#FEF08A');
          cloudValleyAudio.play('harvest');
        } else if (feedback.sound) {
          cloudValleyAudio.play(feedback.sound);
        }
        void saveCloudValleyState(sim);
        syncHudNow();
      } else if (feedback.message && !isDrag) {
        showToast(feedback.message);
        cloudValleyAudio.play('error');
      }
    },
    [showToast, syncHudNow]
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing' || activeModal !== null) return;
    isPaintingRef.current = true;
    lastPaintedKeyRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    applyAtScreenPoint(e.clientX, e.clientY, false);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;
    const rect = canvas.getBoundingClientRect();
    const cam = cameraRef.current;
    const metrics = renderer.computeMetrics(rect.width, rect.height, cam.zoom, cam.panX, cam.panY);
    const hit = renderer.screenToTile(e.clientX - rect.left, e.clientY - rect.top, metrics);
    hoverTileRef.current = hit;
    setHoveredTileCoords((prev) =>
      prev?.row === hit?.row && prev?.col === hit?.col ? prev : hit
    );
    if (isPaintingRef.current && activeModal === null) {
      applyAtScreenPoint(e.clientX, e.clientY, true);
    }
  };

  const handlePointerUp = () => {
    isPaintingRef.current = false;
    lastPaintedKeyRef.current = null;
  };

  const handleWheel = (e: ReactWheelEvent<HTMLCanvasElement>) => {
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    cameraRef.current.zoom = Math.max(0.78, Math.min(1.42, cameraRef.current.zoom + delta));
  };

  const handleSleepNextDay = () => {
    const res = advanceToNextDay(simRef.current);
    cloudValleyAudio.play('levelup');
    void saveCloudValleyState(simRef.current);
    syncHudNow();
    showToast(
      `Bình minh Ngày ${simRef.current.day}/7 · ${SEASON_META[res.season].name} (${WEATHER_LABELS[simRef.current.weather]})`
    );
  };

  const handleExportJson = () => {
    const json = serializeSaveState(simRef.current);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thung-lung-may-ngay-${simRef.current.totalDays}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file lưu nông trại (.json)!');
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseSaveState(text);
      if (!parsed) {
        showToast('File JSON không hợp lệ hoặc bị hỏng.');
        cloudValleyAudio.play('error');
        return;
      }
      simRef.current = parsed;
      await saveCloudValleyState(parsed);
      setHasExistingSave(true);
      syncHudNow();
      setActiveModal(null);
      if (phase === 'title') setPhase('playing');
      showToast('Đã khôi phục nông trại từ file JSON!');
      cloudValleyAudio.play('levelup');
    } catch {
      showToast('Không thể đọc file JSON.');
    }
  };

  const handleImportOnTitle = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleImportJson(file);
    e.target.value = '';
  };

  const sim = simRef.current;
  const seasonId = getSeasonId(sim);
  const seasonMeta = SEASON_META[seasonId];
  const xpNeeded = getXpForNextLevel(sim.level);
  const readyArtisanCount = sim.artisanQueue.filter((s) => s.ready).length;
  const readyOrderCount = sim.orders.filter((o) => (sim.inventory[o.itemId] ?? 0) >= o.qty).length;

  const hoveredTile = hoveredTileCoords
    ? sim.tiles[getTileIndex(hoveredTileCoords.row, hoveredTileCoords.col)]
    : null;

  const containerHeightClass = fullViewport
    ? 'relative w-full h-[100dvh] overflow-hidden select-none bg-[#CBE9F7]'
    : isFullscreen
    ? 'relative w-full flex-1 min-h-[calc(100dvh-16px)] overflow-hidden select-none rounded-xl bg-[#CBE9F7]'
    : 'relative w-full h-[76dvh] min-h-[540px] max-h-[820px] rounded-2xl border border-[#C7AC82] overflow-hidden select-none bg-[#CBE9F7] shadow-xl';

  return (
    <section
      aria-label="Thung Lũng Mây — Cloud Valley Homestead"
      data-testid="cloud-valley-root"
      data-day={sim.day}
      data-season={seasonId}
      data-gold={sim.gold}
      data-level={sim.level}
      data-state={phase}
      className={containerHeightClass}
    >
      {/* Isolated Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          data-testid="cloud-valley-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          className="block w-full h-full touch-none cursor-crosshair outline-none"
        />
      </div>

      {/* TITLE SCREEN OVERLAY */}
      {phase === 'title' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-[#FBF4E6]">
          <img
            src={titleBackdropUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FBF4E6]/92 via-[#FBF4E6]/45 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-md pt-4 sm:pt-8 space-y-5">
            <CloudValleyTitleLockup />

            <p className="text-sm sm:text-base font-medium text-[#4A311D] leading-relaxed max-w-[36ch]">
              Canh tác ruộng bậc thang trên tầng mây, lai tạo thực vật hiếm, vận hành xưởng thủ công 3 tầng và triệu hồi Tinh Linh Đất.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                data-testid="cv-start-btn"
                onClick={handleStartGame}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-base shadow-[0_6px_18px_rgba(27,94,32,0.32)] transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{hasExistingSave ? 'Tiếp Tục Canh Tác' : 'Bắt Đầu Canh Tác'}</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[#8C6239]/50 bg-[#FFFDF8]/95 hover:bg-[#F5E8D0] text-[#4A311D] text-xs font-bold cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập File .JSON</span>
                <input type="file" accept=".json,application/json" onChange={handleImportOnTitle} className="hidden" />
              </label>
            </div>
          </div>

          <p className="relative z-10 text-xs font-semibold text-[#5C3A21] tracking-wide">
            Nhấp / Kéo Chuột Lên Ô Đất · Phím 1–8 Đổi Công Cụ · Enter / Space Bắt Đầu
          </p>
        </div>
      )}

      {/* PLAYING HUD OVERLAY */}
      {phase !== 'title' && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2.5 sm:p-3.5">
          {/* TOP BAR: Left Homestead Status + Right Utility Icons */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            {/* Top-Left Homestead Readouts */}
            <div className="pointer-events-auto w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-start gap-x-2.5 gap-y-1.5 px-3 py-2 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 shadow-md text-[#2D1E12]">
              <div className="flex items-center gap-1.5 pr-2 border-r border-[#D6BE96]">
                <Coins className="w-4 h-4 text-[#D97706]" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#7C5230]">Vàng</span>
                  <span data-testid="cv-gold-value" className="text-sm sm:text-base font-extrabold tabular-nums">
                    {Math.round(sim.gold)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pr-2 border-r border-[#D6BE96]">
                <Award className="w-4 h-4 text-[#0284C7]" />
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-[#7C5230]">Huy Hiệu</span>
                  <span className="text-sm sm:text-base font-extrabold tabular-nums">{sim.badges}</span>
                </div>
              </div>

              <div className="sm:pr-2 sm:border-r sm:border-[#D6BE96]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-[#2E7D32]">Cấp {sim.level}</span>
                  <span className="text-[10px] font-semibold text-[#7C5230] tabular-nums">
                    {Math.round(sim.xp)}/{xpNeeded}
                  </span>
                </div>
                <div className="w-20 h-1.5 rounded-full bg-[#E5D5B8] overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#2E7D32] transition-all duration-200"
                    style={{ width: `${Math.min(100, (sim.xp / xpNeeded) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <span className="block text-[10px] font-bold text-[#9A3412]">
                    {seasonMeta.shortName} · Ngày {sim.day}/7
                  </span>
                  <span className="block text-[11px] font-semibold text-[#5C3A21] tabular-nums">
                    {WEATHER_LABELS[sim.weather]} · {Math.round((sim.timeInDaySeconds / DAY_DURATION_SECONDS) * 100)}%
                  </span>
                </div>
                <button
                  type="button"
                  title="Tốc độ 1x / 2x"
                  onClick={() => setSpeedMultiplier((s) => (s === 1 ? 2 : 1))}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                    speedMultiplier === 2
                      ? 'bg-[#D97706] text-white border-[#B45309]'
                      : 'bg-[#F3E6CE] text-[#5C3A21] border-[#C7AC82]'
                  }`}
                >
                  <FastForward className="w-3 h-3 inline mr-0.5" />
                  {speedMultiplier}×
                </button>
                <button
                  type="button"
                  data-testid="cv-sleep-btn"
                  title="Đi ngủ sang sáng hôm sau"
                  onClick={handleSleepNextDay}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4A311D] hover:bg-[#2D1E12] text-[#FEF3C7] text-[11px] font-bold cursor-pointer"
                >
                  <Moon className="w-3 h-3" />
                  <span className="hidden sm:inline">Đi Ngủ</span>
                </button>
              </div>
            </div>

            {/* Top-Right Action Menus & Utility Controls */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="cv-open-orders"
                onClick={() => setActiveModal('orders')}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] text-xs font-bold shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#B45309]" />
                <span className="hidden md:inline">Đơn Hàng</span>
                {readyOrderCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#2E7D32] text-white text-[10px] font-bold tabular-nums">
                    {readyOrderCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                data-testid="cv-open-workshop"
                onClick={() => setActiveModal('workshop')}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] text-xs font-bold shadow-md cursor-pointer"
              >
                <Factory className="w-4 h-4 text-[#9A3412]" />
                <span className="hidden md:inline">Xưởng 3 Tầng</span>
                {readyArtisanCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#D97706] text-white text-[10px] font-bold tabular-nums">
                    {readyArtisanCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                data-testid="cv-open-almanac"
                onClick={() => setActiveModal('almanac')}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] text-xs font-bold shadow-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-[#2E7D32]" />
                <span className="hidden md:inline">Sổ Tay</span>
              </button>

              <button
                type="button"
                data-testid="cv-open-automation"
                onClick={() => setActiveModal('automation')}
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] text-xs font-bold shadow-md cursor-pointer"
              >
                <Hammer className="w-4 h-4 text-[#0284C7]" />
                <span className="hidden md:inline">Chuồng & Tự Động</span>
              </button>

              <button
                type="button"
                data-testid="cv-open-settings"
                title="Lưu File JSON & Hướng Dẫn"
                onClick={() => setActiveModal('settings')}
                className="w-9 h-9 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] flex items-center justify-center shadow-md cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Bật âm thanh (M)' : 'Tắt âm thanh (M)'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleToggleMute();
                }}
                className="w-9 h-9 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] flex items-center justify-center shadow-md cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4 text-rose-700" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Tạm dừng (P / Esc)"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setPhase((p) => (p === 'playing' ? 'paused' : 'playing'));
                }}
                className="w-9 h-9 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] flex items-center justify-center shadow-md cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>

              {onToggleFullscreen && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Toàn màn hình"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleFullscreen();
                  }}
                  className="w-9 h-9 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] flex items-center justify-center shadow-md cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* CENTER TOAST (Non-blocking) */}
          {toastText && (
            <div className="self-center px-4 py-1.5 rounded-xl bg-[#2D1E12]/90 text-[#FEF3C7] text-xs font-bold shadow-lg border border-[#F6D38C]/50">
              {toastText}
            </div>
          )}

          {/* BOTTOM TOOL & CONTEXTUAL SEED/BLUEPRINT DOCK */}
          <div className="flex flex-col items-center gap-1.5">
            {/* Tile Inspector Readout OR Contextual Seed / Structure Picker */}
            {activeTool === 'seed' && (
              <div className="pointer-events-auto max-w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#7C5230] bg-[#FDF7EC]/95 shadow-md">
                {Object.values(CROPS)
                  .filter((c) => c.seedPrice > 0)
                  .map((crop) => {
                    const locked = sim.level < crop.unlockLevel;
                    const selected = selectedSeedId === crop.id;
                    const seasonOk = crop.seasons.includes(seasonId);
                    return (
                      <button
                        key={crop.id}
                        type="button"
                        disabled={locked}
                        onClick={() => setSelectedSeedId(crop.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          selected
                            ? 'bg-[#2E7D32] text-white border-[#14532D]'
                            : locked
                            ? 'bg-[#E5DCCB] text-[#78716C] border-[#D6BE96] opacity-60'
                            : 'bg-[#FFFDF8] text-[#2D1E12] border-[#D6BE96] hover:bg-[#F3E6CE]'
                        }`}
                      >
                        {crop.name} · {locked ? `Cấp ${crop.unlockLevel}` : `${crop.seedPrice}g`}
                        {!seasonOk && !locked ? ' (Nhà Kính)' : ''}
                      </button>
                    );
                  })}
              </div>
            )}

            {activeTool === 'build' && (
              <div className="pointer-events-auto max-w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#7C5230] bg-[#FDF7EC]/95 shadow-md">
                {Object.values(AUTOMATION_BLUEPRINTS).map((bp) => {
                  const selected = selectedStructureId === bp.id;
                  return (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setSelectedStructureId(bp.id)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                        selected
                          ? 'bg-[#0284C7] text-white border-[#0369A1]'
                          : 'bg-[#FFFDF8] text-[#2D1E12] border-[#D6BE96]'
                      }`}
                    >
                      {bp.name} ({bp.goldCost}g · {bp.badgeCost}HH)
                    </button>
                  );
                })}
              </div>
            )}

            {hoveredTile && isTileUnlocked(sim, hoveredTile) && activeTool !== 'seed' && activeTool !== 'build' && (
              <div className="px-3 py-1 rounded-lg bg-[#2D1E12]/88 text-[#FFFDF8] text-[11px] font-semibold tabular-nums shadow">
                Ô ({hoveredTile.row + 1},{hoveredTile.col + 1}) · Ẩm {Math.round(hoveredTile.moisture)}% · Màu mỡ{' '}
                {Math.round(hoveredTile.fertility)}%
                {isTileInGreenhouse(sim, hoveredTile.row, hoveredTile.col) ? ' · Nhà Kính' : ''}
                {hoveredTile.crop
                  ? ` · ${CROPS[hoveredTile.crop.cropId]?.name} (${
                      isCropMature(hoveredTile.crop)
                        ? 'Sẵn sàng thu hoạch!'
                        : `${Math.round(
                            (hoveredTile.crop.progressSeconds / CROPS[hoveredTile.crop.cropId].growthSeconds) * 100
                          )}%`
                    })`
                  : hoveredTile.hasWeed
                  ? ' · Có Cỏ Dại'
                  : hoveredTile.wildMushroom
                  ? ' · Nấm Rừng Quý'
                  : ''}
              </div>
            )}

            {/* Main Tool Hotbar */}
            <div className="pointer-events-auto max-w-full overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-2xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 shadow-xl">
              {TOOL_BUTTONS.map((tb) => {
                const active = activeTool === tb.id;
                return (
                  <button
                    key={tb.id}
                    type="button"
                    data-testid={`cv-tool-${tb.id}`}
                    title={`${tb.label} [${tb.keyHint}]`}
                    onClick={() => setActiveTool(tb.id)}
                    className={`relative flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold whitespace-nowrap transition-transform cursor-pointer ${
                      active
                        ? 'bg-[#6E4726] text-white border-[#451A03] -translate-y-0.5 shadow-md'
                        : 'bg-[#FFFDF8] text-[#2D1E12] border-[#D6BE96] hover:bg-[#F3E6CE]'
                    }`}
                  >
                    <ToolSvgIcon tool={tb.id} className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">{tb.label}</span>
                    <span className="hidden lg:inline text-[10px] opacity-70 font-mono">[{tb.keyHint}]</span>
                  </button>
                );
              })}

              <div className="pl-1.5 sm:pl-2 border-l border-[#D6BE96] text-[10px] font-bold text-[#7C5230] whitespace-nowrap">
                {sim.toolTier === 'iron' ? 'Cọ 3×3' : sim.toolTier === 'copper' ? 'Cọ 1×3' : 'Cọ 1×1'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {phase === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B130B]/60">
          <div className="w-full max-w-sm rounded-2xl border-2 border-[#7C5230] bg-[#FDF7EC] p-5 text-[#2D1E12] shadow-2xl space-y-4">
            <h2 className="font-display text-2xl font-bold text-center">Tạm Dừng Nông Trại</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-[#F3E6CE]">
                <p className="text-base font-extrabold tabular-nums">{sim.totalDays}</p>
                <p className="text-[10px] font-bold text-[#7C5230]">Ngày</p>
              </div>
              <div className="p-2 rounded-xl bg-[#F3E6CE]">
                <p className="text-base font-extrabold tabular-nums">{Math.round(sim.gold)}</p>
                <p className="text-[10px] font-bold text-[#7C5230]">Vàng</p>
              </div>
              <div className="p-2 rounded-xl bg-[#F3E6CE]">
                <p className="text-base font-extrabold tabular-nums">{sim.almanacUnlocked.length}</p>
                <p className="text-[10px] font-bold text-[#7C5230]">Sổ Tay</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setPhase('playing')}
                className="w-full py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-sm cursor-pointer"
              >
                Tiếp Tục Canh Tác
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase('playing');
                  setActiveModal('settings');
                }}
                className="w-full py-2 rounded-xl border border-[#C7AC82] bg-[#FFFDF8] hover:bg-[#F3E6CE] text-[#2D1E12] font-bold text-sm cursor-pointer"
              >
                Lưu / Xuất File .JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  void saveCloudValleyState(simRef.current);
                  setPhase('title');
                }}
                className="w-full py-2 rounded-xl border border-[#C7AC82] bg-transparent hover:bg-[#F3E6CE] text-[#5C3A21] font-bold text-sm cursor-pointer"
              >
                Về Màn Hình Chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-WORLD FEATURE MODALS */}
      <CloudValleyModals
        modal={activeModal}
        state={sim}
        offlineReport={offlineReport}
        onClose={() => setActiveModal(null)}
        onFulfillOrder={(orderId) => {
          const res = fulfillVillagerOrder(simRef.current, orderId);
          cloudValleyAudio.play(res.ok ? 'coin' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onTradeFair={(qty) => {
          const res = tradeWeekendFair(simRef.current, qty);
          cloudValleyAudio.play(res.earned > 0 ? 'coin' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onSellItem={(itemId, qty) => {
          const res = sellInventoryItem(simRef.current, itemId, qty);
          if (res.ok) {
            cloudValleyAudio.play('coin');
            showToast(`Đã bán thu về +${res.earned} Vàng!`);
            void saveCloudValleyState(simRef.current);
            syncHudNow();
          }
        }}
        onBuyItem={(itemId, qty) => {
          const res = buyItemFromMarket(simRef.current, itemId, qty);
          cloudValleyAudio.play(res.ok ? 'coin' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onStartRecipe={(recipeId) => {
          const res = startArtisanRecipe(simRef.current, recipeId);
          cloudValleyAudio.play(res.ok ? 'build' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onCollectArtisan={(uid) => {
          if (collectArtisanSlot(simRef.current, uid)) {
            cloudValleyAudio.play('harvest');
            void saveCloudValleyState(simRef.current);
            syncHudNow();
          }
        }}
        onCollectAllArtisan={() => {
          const readyIds = simRef.current.artisanQueue.filter((s) => s.ready).map((s) => s.uid);
          readyIds.forEach((uid) => collectArtisanSlot(simRef.current, uid));
          if (readyIds.length > 0) {
            cloudValleyAudio.play('harvest');
            showToast(`Đã thu ${readyIds.length} mẻ thành phẩm!`);
            void saveCloudValleyState(simRef.current);
            syncHudNow();
          }
        }}
        onUnlockTerrace={(terraceId) => {
          const res = unlockTerrace(simRef.current, terraceId);
          cloudValleyAudio.play(res.ok ? 'levelup' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onUpgradeTools={() => {
          const res = upgradeToolTier(simRef.current);
          cloudValleyAudio.play(res.ok ? 'levelup' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onBuyLivestock={(type) => {
          const res = buyLivestock(simRef.current, type);
          cloudValleyAudio.play(res.ok ? 'coin' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onTendLivestock={(animalId) => {
          const res = tendLivestock(simRef.current, animalId);
          cloudValleyAudio.play(res.ok ? 'harvest' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onSummonSprite={(task) => {
          const res = summonEarthSprite(simRef.current, task);
          cloudValleyAudio.play(res.ok ? 'hybrid' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onChangeSpriteTask={(spriteId, task) => {
          const sp = simRef.current.sprites.find((s) => s.id === spriteId);
          if (sp) {
            sp.task = task;
            void saveCloudValleyState(simRef.current);
            syncHudNow();
          }
        }}
        onFeedSprite={(spriteId, mealId) => {
          const res = feedSprite(simRef.current, spriteId, mealId);
          cloudValleyAudio.play(res.ok ? 'harvest' : 'error');
          showToast(res.message);
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onSelectBuildStructure={(structId) => {
          setSelectedStructureId(structId);
          setActiveTool('build');
          showToast(`Chọn ô đất để đặt ${AUTOMATION_BLUEPRINTS[structId].name}`);
        }}
        onExportJson={handleExportJson}
        onImportJson={(f) => {
          void handleImportJson(f);
        }}
        onResetSave={() => {
          void clearCloudValleySave().then(() => {
            simRef.current = createInitialCloudValleyState();
            setHasExistingSave(false);
            setActiveModal(null);
            showToast('Đã khởi tạo Thung Lũng Mây mới!');
            syncHudNow();
          });
        }}
      />
    </section>
  );
}
