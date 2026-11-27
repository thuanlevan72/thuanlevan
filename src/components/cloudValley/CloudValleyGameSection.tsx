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
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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
  Sparkles,
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
  type AvatarActionMode,
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
  buySeedPack,
  collectArtisanSlot,
  createInitialCloudValleyState,
  drawWellWater,
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
import {
  createInitialAvatarState,
  detectInteractTarget,
  FARM_BUILDINGS,
  getAnimalWorldPos,
  resolveSmartToolForTile,
  stepAvatarMovement,
  tileToWorldBounds,
  type BuildingId,
  type FarmerAvatarState,
} from '../../utils/cloudValleyWorld.ts';
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
  { id: 'mutagen', label: 'Đột Biến', keyHint: '6' },
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
  const [activeMode, setActiveMode] = useState<AvatarActionMode>('auto');
  const [selectedSeedId, setSelectedSeedId] = useState<string>('lua_mi');
  const [selectedStructureId, setSelectedStructureId] = useState<AutomationId>('sprinkler');
  const [speedMultiplier, setSpeedMultiplier] = useState<1 | 2>(1);
  const [muted, setMuted] = useState(false);
  const [activeModal, setActiveModal] = useState<CloudValleyModalId>(null);
  const [offlineReport, setOfflineReport] = useState<OfflineCatchupReport | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [hoveredTileCoords, setHoveredTileCoords] = useState<{ row: number; col: number } | null>(null);

  const simRef = useRef<CloudValleyGameState>(createInitialCloudValleyState());
  const avatarRef = useRef<FarmerAvatarState>(createInitialAvatarState());
  const [, setHudTick] = useState(0);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CloudValleyCanvasController | null>(null);
  if (!rendererRef.current) {
    rendererRef.current = new CloudValleyCanvasController();
  }

  const cameraRef = useRef({ zoom: 1 });
  const viewportSizeRef = useRef({ width: 1024, height: 640, dpr: 1 });
  const hoverTileRef = useRef<{ row: number; col: number } | null>(null);
  const isPaintingRef = useRef(false);
  const lastPaintedKeyRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const keysPressedRef = useRef<Set<string>>(new Set());
  const dpadVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const walkGoalRef = useRef<{ wx: number; wy: number; onArrive?: () => void } | null>(null);
  const stepSoundCooldownRef = useRef(0);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const speedRef = useRef(speedMultiplier);
  speedRef.current = speedMultiplier;
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;
  const selectedSeedRef = useRef(selectedSeedId);
  selectedSeedRef.current = selectedSeedId;
  const selectedStructRef = useRef(selectedStructureId);
  selectedStructRef.current = selectedStructureId;
  const activeModalRef = useRef(activeModal);
  activeModalRef.current = activeModal;

  const showToast = useCallback((msg: string, speechBubble?: string) => {
    setToastText(msg);
    if (speechBubble) {
      avatarRef.current.speechText = speechBubble;
      avatarRef.current.speechTimer = 2.1;
    }
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
      toastTimerRef.current = null;
    }, 3000);
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
        if (
          report &&
          (report.daysAdvanced > 0 ||
            report.cropsMatured > 0 ||
            report.artisanCompleted > 0 ||
            report.spriteHarvests > 0)
        ) {
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

  const executeTileTool = useCallback(
    (row: number, col: number, tool: ToolId, silentToast = false) => {
      const sim = simRef.current;
      const renderer = rendererRef.current!;
      const avatar = avatarRef.current;
      const tile = sim.tiles[getTileIndex(row, col)];
      if (!tile) return;

      if (!isTileUnlocked(sim, tile)) {
        if (!silentToast) {
          if (tool === 'inspect') {
            setActiveModal('automation');
          } else {
            showToast(
              `Khu ${tile.terraceId} chưa khai phá — Mở trong "Chuồng & Tự Động"!`,
              `Khu ${tile.terraceId} đang khóa!`
            );
          }
        }
        return;
      }

      const wb = tileToWorldBounds(row, col);
      // Face toward the acted tile
      const dx = wb.cx - avatar.x;
      const dy = wb.cy - avatar.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        avatar.facing = dx < 0 ? 'left' : 'right';
      } else if (Math.abs(dy) > 0.05) {
        avatar.facing = dy < 0 ? 'up' : 'down';
      }

      if (tool === 'inspect') {
        if (!silentToast) {
          const cropInfo = tile.crop ? ` · ${CROPS[tile.crop.cropId]?.name}` : '';
          showToast(
            `Ô (${row + 1},${col + 1}): Ẩm ${Math.round(tile.moisture)}% · Màu mỡ ${Math.round(tile.fertility)}%${cropInfo}`
          );
        }
        return;
      }

      avatar.actionTimer = 0.28;
      avatar.actionTool = tool;

      const feedback = applyToolAction(sim, tool, row, col, {
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
          const posWb = tileToWorldBounds(pos.row, pos.col);
          renderer.spawnBurstWorld(posWb.cx, posWb.cy, burstColor, 7);
        }
        if (feedback.hybridUnlocked) {
          renderer.spawnPopupWorld(wb.cx, wb.cy, `Thu: ${feedback.hybridUnlocked}!`, '#E9D5FF');
          avatar.speechText = `Tuyệt vời! ${feedback.hybridUnlocked}!`;
          avatar.speechTimer = 2.2;
          cloudValleyAudio.play('hybrid');
        } else if (tool === 'harvest') {
          renderer.spawnPopupWorld(wb.cx, wb.cy, `+${feedback.affectedTiles.length} Thu hoạch!`, '#FEF08A');
          avatar.speechText = 'Thu hoạch đầy giỏ!';
          avatar.speechTimer = 1.6;
          cloudValleyAudio.play('harvest');
        } else {
          if (tool === 'hoe') {
            renderer.spawnPopupWorld(wb.cx, wb.cy, 'Xới đất!', '#FDE68A');
          } else if (tool === 'water') {
            renderer.spawnPopupWorld(wb.cx, wb.cy, 'Tưới mát!', '#BAE6FD');
          } else if (tool === 'seed') {
            renderer.spawnPopupWorld(wb.cx, wb.cy, 'Gieo hạt!', '#BBF7D0');
          }
          if (feedback.sound) cloudValleyAudio.play(feedback.sound);
        }
        void saveCloudValleyState(sim);
        syncHudNow();
      } else if (feedback.message && !silentToast) {
        showToast(feedback.message);
        cloudValleyAudio.play('error');
      }
    },
    [showToast, syncHudNow]
  );

  const interactWithBuilding = useCallback(
    (buildingId: BuildingId) => {
      const sim = simRef.current;
      const avatar = avatarRef.current;
      const renderer = rendererRef.current!;

      if (buildingId === 'barn') {
        setActiveModal('workshop');
      } else if (buildingId === 'merchant') {
        setActiveModal('orders');
      } else if (buildingId === 'board') {
        setActiveModal('almanac');
      } else if (buildingId === 'pen') {
        setActiveModal('automation');
      } else if (buildingId === 'well') {
        avatar.actionTimer = 0.28;
        avatar.actionTool = 'well';
        const res = drawWellWater(sim);
        renderer.spawnBurstWorld(7.8, 3.0, '#38BDF8', 10);
        renderer.spawnPopupWorld(7.8, 2.7, 'Nước Suối Mây!', '#BAE6FD');
        cloudValleyAudio.play('well');
        showToast(res.message, 'Nước giếng mát quá!');
        void saveCloudValleyState(sim);
        syncHudNow();
      }
    },
    [showToast, syncHudNow]
  );

  const interactWithAnimal = useCallback(
    (animalId: string, worldX?: number, worldY?: number) => {
      const sim = simRef.current;
      const avatar = avatarRef.current;
      const renderer = rendererRef.current!;
      avatar.actionTimer = 0.26;
      avatar.actionTool = 'animal';
      const res = tendLivestock(sim, animalId);
      if (worldX !== undefined && worldY !== undefined) {
        renderer.spawnBurstWorld(worldX, worldY, res.ok ? '#FDE047' : '#FCA5A5', 6);
        if (res.ok) {
          renderer.spawnPopupWorld(worldX, worldY, res.message, '#FEF08A');
        }
      }
      cloudValleyAudio.play(res.ok ? 'animal' : 'error');
      showToast(res.message, res.ok ? 'Dễ thương quá!' : undefined);
      void saveCloudValleyState(sim);
      syncHudNow();
    },
    [showToast, syncHudNow]
  );

  const triggerAvatarContextAction = useCallback(() => {
    const sim = simRef.current;
    const avatar = avatarRef.current;
    const nowSec = performance.now() / 1000;
    const target = detectInteractTarget(sim, avatar, selectedSeedRef.current, nowSec);
    const mode = activeModeRef.current;

    if (!target) {
      showToast('Hãy bước lại gần luống đất, vật nuôi hoặc công trình để thao tác!', 'Bước tới gần thêm chút nữa!');
      return;
    }

    if (target.kind === 'building') {
      interactWithBuilding(target.buildingId);
      return;
    }

    if (target.kind === 'animal') {
      interactWithAnimal(target.animalId, target.worldX, target.worldY);
      return;
    }

    if (target.kind === 'locked_terrace') {
      const res = unlockTerrace(sim, target.terraceId);
      if (res.ok) {
        cloudValleyAudio.play('levelup');
        showToast(res.message, `Mở Khu ${target.terraceId} rồi!`);
        void saveCloudValleyState(sim);
        syncHudNow();
      } else {
        setActiveModal('automation');
        showToast(res.message);
      }
      return;
    }

    const toolToUse: ToolId = mode === 'auto' ? target.smartTool : mode;
    executeTileTool(target.row, target.col, toolToUse, false);
  }, [executeTileTool, interactWithAnimal, interactWithBuilding, showToast, syncHudNow]);

  // ResizeObserver for crisp DPR Canvas scaling
  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return;

    const updateSize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(320, Math.round(rect.height));
      const dpr = Math.min(1.25, window.devicePixelRatio || 1);
      viewportSizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (phaseRef.current === 'playing' && rendererRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const nowSec = performance.now() / 1000;
          const metrics = rendererRef.current.computeMetrics(width, height, avatarRef.current, cameraRef.current.zoom);
          const target = detectInteractTarget(simRef.current, avatarRef.current, selectedSeedRef.current, nowSec);
          rendererRef.current.render(
            ctx,
            simRef.current,
            avatarRef.current,
            metrics,
            nowSec,
            hoverTileRef.current,
            activeModeRef.current,
            target
          );
        }
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(mount);
    return () => ro.disconnect();
  }, [phase]);

  // Main Canvas & Avatar Kinematics Loop decoupled from React state
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let lastPaintTs = 0;
    let nextPaintGapMs = 33;
    let hudAccum = 0;

    const frame = (now: number) => {
      rafId = window.requestAnimationFrame(frame);
      const rawDt = Math.max(0, (now - lastTs) / 1000);
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);

      if (phaseRef.current === 'title' || phaseRef.current === 'paused') return;

      const renderer = rendererRef.current!;
      const sim = simRef.current;
      const avatar = avatarRef.current;

      if (phaseRef.current === 'playing' && activeModalRef.current === null) {
        // 1. Resolve directional input (Keyboard + D-Pad OR Click-to-Walk)
        const keys = keysPressedRef.current;
        let ix = dpadVecRef.current.x;
        let iy = dpadVecRef.current.y;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) iy -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) iy += 1;

        if (Math.hypot(ix, iy) > 0.05) {
          walkGoalRef.current = null;
        } else if (walkGoalRef.current) {
          const g = walkGoalRef.current;
          const dx = g.wx - avatar.x;
          const dy = g.wy - avatar.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 0.28) {
            const cb = g.onArrive;
            walkGoalRef.current = null;
            if (cb) cb();
          } else {
            ix = dx;
            iy = dy;
          }
        }

        const moved = stepAvatarMovement(avatar, ix, iy, dt);
        stepSoundCooldownRef.current = Math.max(0, stepSoundCooldownRef.current - dt);
        if (moved && stepSoundCooldownRef.current <= 0) {
          cloudValleyAudio.play('step');
          stepSoundCooldownRef.current = 0.24;
        }

        // 2. Farm World Simulation Tick
        const simDt = dt * speedRef.current;
        const tickRes = tickCloudValleySimulation(sim, simDt);
        renderer.stepEffects(dt, sim);
        if (tickRes.hybridsDiscovered.length > 0) {
          cloudValleyAudio.play('hybrid');
          const names = tickRes.hybridsDiscovered.map((id) => CROPS[id]?.name ?? id).join(', ');
          showToast(`Đột biến giống mới: ${names}!`, `Có Mầm Lai ${names}!`);
        }
      }

      // Adaptive canvas rasterization (~30fps max, backs off if software raster takes >15ms)
      if (now - lastPaintTs >= nextPaintGapMs) {
        lastPaintTs = now;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const t0 = performance.now();
            const { width, height, dpr } = viewportSizeRef.current;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const metrics = renderer.computeMetrics(width, height, avatar, cameraRef.current.zoom);
            const target = detectInteractTarget(sim, avatar, selectedSeedRef.current, now / 1000);
            renderer.render(
              ctx,
              sim,
              avatar,
              metrics,
              now / 1000,
              hoverTileRef.current,
              activeModeRef.current,
              target
            );
            const renderCost = performance.now() - t0;
            nextPaintGapMs = Math.max(33, Math.min(90, renderCost * 2.5));
          }
        }
      }

      hudAccum += dt;
      if (hudAccum >= 0.16) {
        hudAccum = 0;
        if (phaseRef.current === 'playing') {
          setHudTick((v) => v + 1);
        }
      }
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [showToast]);

  // Unified Keyboard Shortcuts & Movement Keys
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

      if (phaseRef.current !== 'playing' || activeModalRef.current !== null) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        keysPressedRef.current.add(e.code);
        return;
      }

      if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
        e.preventDefault();
        triggerAvatarContextAction();
        return;
      }

      if (e.key === '0' || e.key === 'q' || e.key === 'Q') {
        setActiveMode('auto');
        return;
      }

      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < TOOL_BUTTONS.length) {
        setActiveMode(TOOL_BUTTONS[idx].id);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current.delete(e.code);
    };

    const clearHeld = () => {
      keysPressedRef.current.clear();
      dpadVecRef.current = { x: 0, y: 0 };
      isPaintingRef.current = false;
      lastPaintedKeyRef.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    document.addEventListener('visibilitychange', clearHeld);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
      document.removeEventListener('visibilitychange', clearHeld);
    };
  }, [handleStartGame, handleToggleMute, triggerAvatarContextAction]);

  const handleCanvasClickOrDrag = useCallback(
    (clientX: number, clientY: number, isDrag = false) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const avatar = avatarRef.current;
      const sim = simRef.current;
      const metrics = renderer.computeMetrics(rect.width, rect.height, avatar, cameraRef.current.zoom);
      const { wx, wy } = renderer.screenToWorld(px, py, metrics);

      // 1. Check click on Buildings or Animals (non-drag only)
      if (!isDrag) {
        const nowSec = performance.now() / 1000;
        for (let i = 0; i < sim.livestock.length; i++) {
          const an = sim.livestock[i];
          const apos = getAnimalWorldPos(i, nowSec);
          if (Math.hypot(wx - apos.x, wy - apos.y) <= 0.85) {
            if (Math.hypot(avatar.x - apos.x, avatar.y - apos.y) <= 1.65) {
              interactWithAnimal(an.id, apos.x, apos.y);
            } else {
              walkGoalRef.current = {
                wx: Math.max(16.2, apos.x - 0.5),
                wy: apos.y,
                onArrive: () => interactWithAnimal(an.id, apos.x, apos.y),
              };
            }
            return;
          }
        }

        for (const b of FARM_BUILDINGS) {
          if (wx >= b.x1 - 0.2 && wx <= b.x2 + 0.2 && wy >= b.y1 - 0.2 && wy <= b.y2 + 0.2) {
            if (Math.hypot(avatar.x - b.interactX, avatar.y - b.interactY) <= 1.45) {
              interactWithBuilding(b.id);
            } else {
              walkGoalRef.current = {
                wx: b.interactX,
                wy: b.interactY,
                onArrive: () => interactWithBuilding(b.id),
              };
            }
            return;
          }
        }
      }

      // 2. Check click/drag on a soil plot
      const hit = renderer.screenToTile(px, py, metrics);
      hoverTileRef.current = hit;
      setHoveredTileCoords(hit);

      if (!hit) {
        if (!isDrag) {
          walkGoalRef.current = { wx, wy };
        }
        return;
      }

      const key = `${hit.row},${hit.col}`;
      if (isDrag && lastPaintedKeyRef.current === key) return;
      lastPaintedKeyRef.current = key;

      const tile = sim.tiles[getTileIndex(hit.row, hit.col)];
      if (!tile) return;
      const wb = tileToWorldBounds(hit.row, hit.col);
      const mode = activeModeRef.current;
      const chosenTool: ToolId = mode === 'auto' ? resolveSmartToolForTile(tile) : mode;

      // If within reach (~2.1 tiles), act right away; otherwise walk Avatar over and act on arrival!
      const distToTile = Math.hypot(avatar.x - wb.cx, avatar.y - wb.cy);
      if (distToTile <= 2.15 || isDrag) {
        executeTileTool(hit.row, hit.col, chosenTool, isDrag);
        if (distToTile > 2.15 && isDrag) {
          walkGoalRef.current = { wx: wb.cx, wy: wb.cy };
        }
      } else {
        walkGoalRef.current = {
          wx: wb.cx,
          wy: wb.cy,
          onArrive: () => executeTileTool(hit.row, hit.col, chosenTool, false),
        };
      }
    },
    [executeTileTool, interactWithAnimal, interactWithBuilding]
  );

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing' || activeModal !== null) return;
    isPaintingRef.current = true;
    lastPaintedKeyRef.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleCanvasClickOrDrag(e.clientX, e.clientY, false);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) return;
    const rect = canvas.getBoundingClientRect();
    const metrics = renderer.computeMetrics(rect.width, rect.height, avatarRef.current, cameraRef.current.zoom);
    const hit = renderer.screenToTile(e.clientX - rect.left, e.clientY - rect.top, metrics);
    hoverTileRef.current = hit;
    setHoveredTileCoords((prev) => (prev?.row === hit?.row && prev?.col === hit?.col ? prev : hit));
    if (isPaintingRef.current && activeModal === null) {
      handleCanvasClickOrDrag(e.clientX, e.clientY, true);
    }
  };

  const handlePointerUp = () => {
    isPaintingRef.current = false;
    lastPaintedKeyRef.current = null;
  };

  const handleWheel = (e: ReactWheelEvent<HTMLCanvasElement>) => {
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    cameraRef.current.zoom = Math.max(0.82, Math.min(1.4, cameraRef.current.zoom + delta));
  };

  const handleSleepNextDay = () => {
    const res = advanceToNextDay(simRef.current);
    cloudValleyAudio.play('levelup');
    void saveCloudValleyState(simRef.current);
    syncHudNow();
    showToast(
      `Bình minh Ngày ${simRef.current.day}/7 · ${SEASON_META[res.season].name} (${WEATHER_LABELS[simRef.current.weather]})`,
      'Chào ngày mới!'
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

  const setDpadDir = (x: number, y: number) => {
    dpadVecRef.current = { x, y };
  };

  const sim = simRef.current;
  const avatar = avatarRef.current;
  const seasonId = getSeasonId(sim);
  const seasonMeta = SEASON_META[seasonId];
  const xpNeeded = getXpForNextLevel(sim.level);
  const readyArtisanCount = sim.artisanQueue.filter((s) => s.ready).length;
  const readyOrderCount = sim.orders.filter((o) => (sim.inventory[o.itemId] ?? 0) >= o.qty).length;

  const liveTarget = detectInteractTarget(sim, avatar, selectedSeedId, performance.now() / 1000);
  const actionButtonLabel =
    activeMode !== 'auto'
      ? TOOL_BUTTONS.find((t) => t.id === activeMode)?.label ?? 'Thao Tác'
      : liveTarget?.label ?? 'Thao Tác';

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
      aria-label="Thung Lũng Mây — Nông Trại Avatar"
      data-testid="cloud-valley-root"
      data-day={sim.day}
      data-season={seasonId}
      data-gold={sim.gold}
      data-level={sim.level}
      data-avatar-x={avatar.x.toFixed(2)}
      data-avatar-y={avatar.y.toFixed(2)}
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
          className="block w-full h-full touch-none cursor-pointer outline-none"
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

            <p className="text-sm sm:text-base font-medium text-[#4A311D] leading-relaxed max-w-[38ch]">
              Nhập vai nông dân dạo bước quanh nông trại, cuốc đất gieo hạt, chăm Gà Bò Cừu, gặp Bác Lái Buôn và lai tạo cây hiếm ngay trên tầng mây.
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
                <span>{hasExistingSave ? 'Vào Nông Trại' : 'Bắt Đầu Nông Trại'}</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-[#8C6239]/50 bg-[#FFFDF8]/95 hover:bg-[#F5E8D0] text-[#4A311D] text-xs font-bold cursor-pointer shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập File .JSON</span>
                <input type="file" accept=".json,application/json" onChange={handleImportOnTitle} className="hidden" />
              </label>
            </div>
          </div>

          <p className="relative z-10 text-xs font-semibold text-[#5C3A21] tracking-wide">
            WASD / Mũi Tên Di Chuyển · Space Tác Vụ · Click Ô Đất Chạy Tới Làm Việc · Enter Bắt Đầu
          </p>
        </div>
      )}

      {/* PLAYING HUD OVERLAY */}
      {phase !== 'title' && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2.5 sm:p-3.5">
          {/* TOP BAR: Left Farmer Stats + Right Menu Buttons */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            {/* Top-Left Farmer Status */}
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

            {/* Top-Right Menu & Utility Controls */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="cv-open-orders"
                onClick={() => setActiveModal('orders')}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 hover:bg-[#F3E6CE] text-[#2D1E12] text-xs font-bold shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#B45309]" />
                <span className="hidden md:inline">Lái Buôn & Hạt</span>
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
                title="Nhân Vật, Lưu File JSON & Hướng Dẫn"
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

          {/* CENTER TOAST */}
          {toastText && (
            <div className="self-center px-4 py-1.5 rounded-xl bg-[#2D1E12]/90 text-[#FEF3C7] text-xs font-bold shadow-lg border border-[#F6D38C]/50">
              {toastText}
            </div>
          )}

          {/* BOTTOM CONTROLS: D-PAD (Left) + TOOL BAR (Center) + AVATAR ACTION OK BUTTON (Right) */}
          <div className="flex flex-col gap-1.5">
            {/* Contextual Seed / Blueprint Picker OR Tile Hover Info */}
            <div className="flex justify-center">
              {(activeMode === 'seed' || activeMode === 'auto') && (
                <div className="pointer-events-auto max-w-[95vw] overflow-x-auto no-scrollbar flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#7C5230] bg-[#FDF7EC]/94 shadow-md">
                  <span className="text-[10px] font-bold text-[#7C5230] uppercase whitespace-nowrap shrink-0">Hạt:</span>
                  {Object.values(CROPS)
                    .filter(
                      (c) =>
                        c.seedPrice > 0 &&
                        (sim.level >= c.unlockLevel ||
                          (sim.seedBags?.[c.id] ?? 0) > 0 ||
                          c.unlockLevel <= sim.level + 1)
                    )
                    .map((crop) => {
                      const locked = sim.level < crop.unlockLevel;
                      const selected = selectedSeedId === crop.id;
                      const inBag = sim.seedBags?.[crop.id] ?? 0;
                      return (
                        <button
                          key={crop.id}
                          type="button"
                          disabled={locked}
                          onClick={() => setSelectedSeedId(crop.id)}
                          className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                            selected
                              ? 'bg-[#2E7D32] text-white border-[#14532D]'
                              : locked
                              ? 'bg-[#E5DCCB] text-[#78716C] border-[#D6BE96] opacity-55'
                              : 'bg-[#FFFDF8] text-[#2D1E12] border-[#D6BE96] hover:bg-[#F3E6CE]'
                          }`}
                        >
                          {crop.name} {inBag > 0 ? `(Túi ${inBag})` : locked ? `(Cấp ${crop.unlockLevel})` : `(${crop.seedPrice}g)`}
                        </button>
                      );
                    })}
                </div>
              )}

              {activeMode === 'build' && (
                <div className="pointer-events-auto max-w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[#7C5230] bg-[#FDF7EC]/92 shadow-md">
                  {Object.values(AUTOMATION_BLUEPRINTS).map((bp) => {
                    const selected = selectedStructureId === bp.id;
                    return (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => setSelectedStructureId(bp.id)}
                        className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
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
            </div>

            {hoveredTile && isTileUnlocked(sim, hoveredTile) && activeMode !== 'build' && (
              <div className="self-center px-3 py-0.5 rounded-lg bg-[#2D1E12]/85 text-[#FFFDF8] text-[11px] font-semibold tabular-nums shadow">
                Ô ({hoveredTile.row + 1},{hoveredTile.col + 1}) · Ẩm {Math.round(hoveredTile.moisture)}% · Màu mỡ{' '}
                {Math.round(hoveredTile.fertility)}%
                {isTileInGreenhouse(sim, hoveredTile.row, hoveredTile.col) ? ' · Nhà Kính' : ''}
                {hoveredTile.crop
                  ? ` · ${CROPS[hoveredTile.crop.cropId]?.name} (${
                      isCropMature(hoveredTile.crop)
                        ? 'Chín!'
                        : `${Math.round(
                            (hoveredTile.crop.progressSeconds / CROPS[hoveredTile.crop.cropId].growthSeconds) * 100
                          )}%`
                    })`
                  : hoveredTile.hasWeed
                  ? ' · Cỏ Dại'
                  : hoveredTile.wildMushroom
                  ? ' · Nấm Rừng'
                  : ''}
              </div>
            )}

            {/* Bottom Play Dock Row */}
            <div className="flex items-end justify-between gap-1.5 sm:gap-2">
              {/* Classic TeaMobi Virtual D-Pad (Bottom-Left) */}
              <div
                aria-label="Phím điều hướng"
                className="pointer-events-auto grid grid-cols-3 gap-0.5 p-0.5 sm:p-1 rounded-2xl border-2 border-[#7C5230] bg-[#FDF7EC]/92 shadow-lg shrink-0"
              >
                <div />
                <button
                  type="button"
                  aria-label="Đi lên"
                  onPointerDown={() => setDpadDir(0, -1)}
                  onPointerUp={() => setDpadDir(0, 0)}
                  onPointerLeave={() => setDpadDir(0, 0)}
                  onPointerCancel={() => setDpadDir(0, 0)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EFE2CB] active:bg-[#D97706] active:text-white flex items-center justify-center text-[#4A311D] cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div />
                <button
                  type="button"
                  aria-label="Sang trái"
                  onPointerDown={() => setDpadDir(-1, 0)}
                  onPointerUp={() => setDpadDir(0, 0)}
                  onPointerLeave={() => setDpadDir(0, 0)}
                  onPointerCancel={() => setDpadDir(0, 0)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EFE2CB] active:bg-[#D97706] active:text-white flex items-center justify-center text-[#4A311D] cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#E4D1B1]/60" />
                <button
                  type="button"
                  aria-label="Sang phải"
                  onPointerDown={() => setDpadDir(1, 0)}
                  onPointerUp={() => setDpadDir(0, 0)}
                  onPointerLeave={() => setDpadDir(0, 0)}
                  onPointerCancel={() => setDpadDir(0, 0)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EFE2CB] active:bg-[#D97706] active:text-white flex items-center justify-center text-[#4A311D] cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div />
                <button
                  type="button"
                  aria-label="Đi xuống"
                  onPointerDown={() => setDpadDir(0, 1)}
                  onPointerUp={() => setDpadDir(0, 0)}
                  onPointerLeave={() => setDpadDir(0, 0)}
                  onPointerCancel={() => setDpadDir(0, 0)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EFE2CB] active:bg-[#D97706] active:text-white flex items-center justify-center text-[#4A311D] cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div />
              </div>

              {/* Center Tool & Smart Mode Bar */}
              <div className="pointer-events-auto flex-1 sm:flex-initial min-w-0 max-w-full overflow-x-auto no-scrollbar flex items-center gap-1 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-2xl border-2 border-[#7C5230] bg-[#FDF7EC]/95 shadow-xl">
                <button
                  type="button"
                  data-testid="cv-tool-auto"
                  title="Chế độ Thông Minh tự chọn công cụ [Q / 0]"
                  onClick={() => setActiveMode('auto')}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
                    activeMode === 'auto'
                      ? 'bg-[#2E7D32] text-white border-[#14532D] shadow-sm'
                      : 'bg-[#FFFDF8] text-[#2D1E12] border-[#D6BE96] hover:bg-[#F3E6CE]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">Thông Minh</span>
                </button>

                {TOOL_BUTTONS.map((tb) => {
                  const active = activeMode === tb.id;
                  return (
                    <button
                      key={tb.id}
                      type="button"
                      data-testid={`cv-tool-${tb.id}`}
                      title={`${tb.label} [${tb.keyHint}]`}
                      onClick={() => setActiveMode(tb.id)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap cursor-pointer shrink-0 ${
                        active
                          ? 'bg-[#6E4726] text-white border-[#451A03] shadow-sm'
                          : 'bg-[#FFFDF8] text-[#2D1E12] border-[#D6BE96] hover:bg-[#F3E6CE]'
                      }`}
                    >
                      <ToolSvgIcon tool={tb.id} className="w-4 h-4 shrink-0" />
                      <span className="hidden lg:inline">{tb.label}</span>
                    </button>
                  );
                })}

                <div className="hidden sm:block pl-1.5 border-l border-[#D6BE96] text-[10px] font-bold text-[#7C5230] whitespace-nowrap">
                  {sim.toolTier === 'iron' ? 'Cọ 3×3' : sim.toolTier === 'copper' ? 'Cọ 1×3' : 'Cọ 1×1'}
                </div>
              </div>

              {/* TeaMobi Avatar Action OK Button (Bottom-Right) */}
              <button
                type="button"
                data-testid="cv-action-btn"
                onClick={triggerAvatarContextAction}
                className="pointer-events-auto shrink-0 flex flex-col items-center justify-center min-w-[68px] sm:min-w-[116px] px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-2xl border-2 border-[#14532D] bg-[#2E7D32] hover:bg-[#1B5E20] active:scale-95 text-white shadow-xl cursor-pointer transition-transform"
              >
                <span className="text-[11px] sm:text-xs font-extrabold leading-tight truncate max-w-[80px] sm:max-w-[110px]">{actionButtonLabel}</span>
                <span className="hidden sm:inline text-[10px] font-semibold text-emerald-100 mt-0.5">[Space]</span>
              </button>
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
                Tùy Chỉnh Nhân Vật / Lưu JSON
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
        onBuySeedPack={(seedId, qty) => {
          const res = buySeedPack(simRef.current, seedId, qty);
          cloudValleyAudio.play(res.ok ? 'coin' : 'error');
          if (res.ok) setSelectedSeedId(seedId);
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
          cloudValleyAudio.play(res.ok ? 'animal' : 'error');
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
          setActiveMode('build');
          showToast(`Chọn ô đất để đặt ${AUTOMATION_BLUEPRINTS[structId].name}`);
        }}
        onUpdateProfile={(patch) => {
          simRef.current.farmerProfile = {
            ...simRef.current.farmerProfile,
            ...patch,
          };
          void saveCloudValleyState(simRef.current);
          syncHudNow();
        }}
        onExportJson={handleExportJson}
        onImportJson={(f) => {
          void handleImportJson(f);
        }}
        onResetSave={() => {
          void clearCloudValleySave().then(() => {
            simRef.current = createInitialCloudValleyState();
            avatarRef.current = createInitialAvatarState();
            setHasExistingSave(false);
            setActiveModal(null);
            showToast('Đã khởi tạo Nông Trại mới!');
            syncHudNow();
          });
        }}
      />
    </section>
  );
}
