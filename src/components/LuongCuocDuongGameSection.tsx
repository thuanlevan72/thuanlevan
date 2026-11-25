import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BookOpen,
  Check,
  Eye,
  Flame,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Scale,
  Stamp,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import { CellarAudioEngine } from '../utils/luongCuocDuongAudio.ts';
import {
  AbacusState,
  addScaleWeight,
  advanceToNextDay,
  CellarGameState,
  clearScaleWeights,
  computeAbacusValue,
  computeRodValue,
  computeScaleWeightsTotal,
  COUNTERWEIGHTS,
  createInitialGameState,
  decomposeToAbacus,
  dipSealInInk,
  getDayScript,
  getDiscoveredKeepsakes,
  getGuidedNextStep,
  getPhaseTitle,
  HISTORICAL_CHRONICLE_QUOTE,
  inspectPulleyParcel,
  isAbacusMatched,
  isScaleBalanced,
  lowerPulleyParcel,
  placeParcelOnScale,
  refillAndLightLamp,
  removeScaleWeightAt,
  resolveVentChoice,
  ScreenMode,
  setAbacusEarth,
  stampDailyRequisition,
  tickLampAndAtmosphere,
  toggleAbacusHeaven,
  washFaceAtBasin,
} from '../utils/luongCuocDuongEngine.ts';
import {
  CellarPropId,
  CellarSceneController,
  mountCellarScene,
} from '../utils/luongCuocDuongScene.ts';

interface LuongCuocDuongGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
}

type ActiveDrawer = 'none' | 'ledger' | 'vent' | 'keepsake';

interface HallucinationAnchor {
  id: string;
  xPct: number;
  yPct: number;
  char: string;
  whisper: string;
}

const HALLUCINATION_ANCHORS: readonly HallucinationAnchor[] = [
  { id: 'h-tl', xPct: 8, yPct: 18, char: '兩', whisper: 'Đói...' },
  { id: 'h-tr', xPct: 91, yPct: 22, char: '腳', whisper: 'Nhìn sau lưng...' },
  { id: 'h-bl', xPct: 7, yPct: 72, char: '羊', whisper: 'Tên ta là...' },
  { id: 'h-br', xPct: 92, yPct: 68, char: '飢', whisper: 'Mở cửa...' },
  { id: 'h-mid-r', xPct: 88, yPct: 45, char: '骨', whisper: 'Thịt...' },
];

const PROP_LABELS: Record<CellarPropId, { title: string; hint: string }> = {
  lamp: { title: 'Ngọn Đèn Dầu', hint: 'Bấm để khêu tim & châm dầu lạc [L]' },
  pulley: { title: 'Ròng Rọc Trần Hầm', hint: 'Hạ & kiểm tra khẩu phần từ trại lính' },
  scale: { title: 'Cân Tiểu Ly', hint: 'Đặt hàng lên đĩa trái & thêm quả cân' },
  abacus: { title: 'Bàn Tính Gảy', hint: 'Đối chiếu tổng trọng lượng xuất kho' },
  inkpad: { title: 'Hộp Mực Chu Sa', hint: 'Chấm mực son trước khi đóng dấu' },
  seal: { title: 'Con Dấu Quan Nhu', hint: 'Đóng dấu duyệt hoặc từ chối phiếu' },
  ledger: { title: 'Sổ Kiểm Kê', hint: 'Mở bảng cân & sổ đối chiếu [Space]' },
  washbasin: { title: 'Chậu Nước Rửa Tay', hint: 'Vục nước lạnh giữ tỉnh táo (1 lần/ngày)' },
  vent: { title: 'Lỗ Thông Hơi', hint: 'Nghe ngóng & trò chuyện với dân thành' },
  door: { title: 'Cửa Sắt Hầm Ngầm', hint: 'Binh lính đang chờ khẩu phần bên ngoài' },
};

const STORAGE_UNLOCK_KEY = 'luong-cuoc-duong-max-day-v1';

function loadMaxUnlockedDay(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = window.localStorage.getItem(STORAGE_UNLOCK_KEY);
    const num = raw ? Number(raw) : 1;
    return Number.isFinite(num) ? Math.max(1, Math.min(30, Math.floor(num))) : 1;
  } catch {
    return 1;
  }
}

function saveMaxUnlockedDay(day: number): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = loadMaxUnlockedDay();
    if (day > prev) {
      window.localStorage.setItem(STORAGE_UNLOCK_KEY, String(Math.min(30, day)));
    }
  } catch {
    // Ignore storage errors
  }
}

function getQueryStartOptions(): { autostart: boolean; startDay: number } {
  if (typeof window === 'undefined') return { autostart: false, startDay: 1 };
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const rawDay = Number(params.get('day'));
  const startDay =
    Number.isFinite(rawDay) && rawDay >= 1 && rawDay <= 30 ? Math.floor(rawDay) : 1;
  return { autostart, startDay };
}

export function LuongCuocDuongGameSection({
  isFullscreen = false,
  onToggleFullscreen,
}: LuongCuocDuongGameSectionProps) {
  const initialQuery = useMemo(() => getQueryStartOptions(), []);
  const [screenMode, setScreenMode] = useState<ScreenMode>(() =>
    initialQuery.autostart ? 'playing' : 'title'
  );
  const [selectedStartDay, setSelectedStartDay] = useState<number>(initialQuery.startDay);
  const [maxUnlockedDay, setMaxUnlockedDay] = useState<number>(() => loadMaxUnlockedDay());
  const [gameState, setGameState] = useState<CellarGameState>(() =>
    createInitialGameState(initialQuery.startDay)
  );
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawer>('none');
  const [ledgerTab, setLedgerTab] = useState<'work' | 'chronicle'>('work');
  const [hoveredProp, setHoveredProp] = useState<CellarPropId | null>(null);
  const [muted, setMuted] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [pointerPosPct, setPointerPosPct] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneCtrlRef = useRef<CellarSceneController | null>(null);
  const audioRef = useRef<CellarAudioEngine | null>(null);
  const gameStateRef = useRef<CellarGameState>(gameState);
  const screenModeRef = useRef<ScreenMode>(screenMode);

  gameStateRef.current = gameState;
  screenModeRef.current = screenMode;

  const dayScript = useMemo(() => getDayScript(gameState.day), [gameState.day]);
  const abacusVal = useMemo(() => computeAbacusValue(gameState.abacus), [gameState.abacus]);
  const scaleWeightsVal = useMemo(
    () => computeScaleWeightsTotal(gameState.scaleWeights),
    [gameState.scaleWeights]
  );
  const balanced = useMemo(() => isScaleBalanced(gameState), [gameState]);
  const abacusMatch = useMemo(() => isAbacusMatched(gameState), [gameState]);
  const guidedStep = useMemo(() => getGuidedNextStep(gameState), [gameState]);
  const discoveredKeepsakes = useMemo(() => getDiscoveredKeepsakes(gameState), [gameState]);
  const scaleDelta = scaleWeightsVal - dayScript.actualLiang;

  // Mirror screen state to document.body.dataset.state per game shell spec
  useEffect(() => {
    document.body.dataset.state = screenMode;
    return () => {
      delete document.body.dataset.state;
    };
  }, [screenMode]);

  // Persist highest day reached
  useEffect(() => {
    if (gameState.day > maxUnlockedDay) {
      setMaxUnlockedDay(gameState.day);
      saveMaxUnlockedDay(gameState.day);
    }
  }, [gameState.day, maxUnlockedDay]);

  // Initialize Audio Engine once
  useEffect(() => {
    const audio = new CellarAudioEngine();
    audioRef.current = audio;
    return () => {
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  // Sync audio atmosphere
  useEffect(() => {
    audioRef.current?.setMuted(muted);
    audioRef.current?.updateAtmosphere(
      gameState.phase,
      gameState.lampLit,
      gameState.sanity,
      screenMode === 'playing'
    );
  }, [muted, gameState.phase, gameState.lampLit, gameState.sanity, screenMode]);

  // Trigger Game Over when engine enters an ending state
  useEffect(() => {
    if (gameState.ending && screenMode === 'playing') {
      audioRef.current?.playEndingChime(gameState.ending === 'historical_liberation');
      const id = window.setTimeout(() => {
        setScreenMode('gameover');
        setActiveDrawer('none');
      }, gameState.ending === 'historical_liberation' ? 950 : 450);
      return () => window.clearTimeout(id);
    }
  }, [gameState.ending, screenMode]);

  const handlePropInteraction = useCallback((propId: CellarPropId) => {
    const st = gameStateRef.current;
    if (screenModeRef.current !== 'playing' || st.ending) return;
    audioRef.current?.unlock();

    if (propId === 'lamp') {
      audioRef.current?.playLampLight();
      setGameState((prev) => refillAndLightLamp(prev));
      return;
    }

    if (propId === 'pulley') {
      if (!st.pulleyLowered) {
        audioRef.current?.playPulleyCreak();
        sceneCtrlRef.current?.triggerFX('pulley_drop');
        setGameState((prev) => lowerPulleyParcel(prev));
      } else if (!st.parcelInspected) {
        if (getDayScript(st.day).keepsake) {
          audioRef.current?.playRattleSound();
        }
        setGameState((prev) => inspectPulleyParcel(prev));
        if (getDayScript(st.day).keepsake) {
          setActiveDrawer('keepsake');
        }
      } else if (!st.parcelOnScale) {
        audioRef.current?.playScaleClink(true);
        setGameState((prev) => placeParcelOnScale(prev));
        setActiveDrawer('ledger');
      } else {
        setActiveDrawer('ledger');
      }
      return;
    }

    if (propId === 'scale' || propId === 'abacus' || propId === 'ledger') {
      setActiveDrawer((curr) => (curr === 'ledger' ? 'none' : 'ledger'));
      return;
    }

    if (propId === 'inkpad') {
      audioRef.current?.playInkDip();
      sceneCtrlRef.current?.triggerFX('ink_dip');
      setGameState((prev) => dipSealInInk(prev));
      return;
    }

    if (propId === 'seal') {
      if (!st.sealInked) {
        audioRef.current?.playInkDip();
        sceneCtrlRef.current?.triggerFX('ink_dip');
        setGameState((prev) => dipSealInInk(prev));
      } else {
        setActiveDrawer('ledger');
      }
      return;
    }

    if (propId === 'washbasin') {
      audioRef.current?.playLampLight();
      sceneCtrlRef.current?.triggerFX('wash_ripple');
      setGameState((prev) => washFaceAtBasin(prev));
      return;
    }

    if (propId === 'vent') {
      const script = getDayScript(st.day);
      if (script.ventEncounter) {
        audioRef.current?.playWhisperAtVent();
        setActiveDrawer('vent');
      } else {
        audioRef.current?.playWhisperAtVent();
        setGameState((prev) => ({
          ...prev,
          lastEventMessage: 'Ngoài lỗ thông hơi chỉ còn gió lạnh rít qua mái ngói thành Tuy Dương.',
        }));
      }
      return;
    }

    if (propId === 'door') {
      audioRef.current?.playDoorPound(Math.max(1, getDayScript(st.day).doorKnockingLevel));
      sceneCtrlRef.current?.triggerFX('door_pound');
      setGameState((prev) => ({
        ...prev,
        lastEventMessage:
          prev.phase === 3
            ? 'Sau cánh cửa sắt dày, tiếng thở hồng hộc và tiếng cào cấu của lính đói không ngừng nghỉ.'
            : 'Cánh cửa sắt khóa trái từ bên ngoài. Nhiệm vụ của bạn là cân đong đủ khẩu phần cho trại lính.',
      }));
    }
  }, []);

  // Mount Three.js Scene ONCE
  useEffect(() => {
    const el = canvasMountRef.current;
    if (!el) return;
    setWebglError(null);
    const ctrl = mountCellarScene(el, {
      onPropClick: handlePropInteraction,
      onHoverPropChange: setHoveredProp,
      onWebglError: setWebglError,
    });
    sceneCtrlRef.current = ctrl;
    ctrl.syncState(gameStateRef.current, screenModeRef.current === 'playing');

    return () => {
      ctrl.dispose();
      sceneCtrlRef.current = null;
    };
  }, [handlePropInteraction]);

  // Sync gameState & playing status into Three.js controller
  useEffect(() => {
    sceneCtrlRef.current?.syncState(gameState, screenMode === 'playing');
  }, [gameState, screenMode]);

  // Lamp oil decay & periodic spatial horror audio loop while playing
  useEffect(() => {
    if (screenMode !== 'playing') return;
    const interval = window.setInterval(() => {
      setGameState((prev) => {
        if (prev.ending) return prev;
        return tickLampAndAtmosphere(prev, 0.5);
      });
    }, 500);
    return () => window.clearInterval(interval);
  }, [screenMode]);

  // Ambient spatialized horror sound triggers (door pounding, scratches, breathing in darkness)
  useEffect(() => {
    if (screenMode !== 'playing') return;
    const horrorTimer = window.setInterval(() => {
      const st = gameStateRef.current;
      if (st.ending) return;
      const script = getDayScript(st.day);

      if (!st.lampLit) {
        if (Math.random() < 0.65) {
          audioRef.current?.playBreathingBehindNeck();
        } else {
          audioRef.current?.playNailScratch(Math.random() > 0.5 ? -0.82 : 0.78);
        }
        return;
      }

      if (script.doorKnockingLevel > 0 && Math.random() < 0.25 + script.doorKnockingLevel * 0.14) {
        audioRef.current?.playDoorPound(script.doorKnockingLevel);
        sceneCtrlRef.current?.triggerFX('door_pound');
      } else if (st.phase >= 2 && Math.random() < 0.28) {
        audioRef.current?.playNailScratch(-0.8);
      } else if (st.sanity < 55 && Math.random() < 0.3) {
        audioRef.current?.playWhisperAtVent();
      }
    }, 5500);
    return () => window.clearInterval(horrorTimer);
  }, [screenMode]);

  const startGame = useCallback(
    (startDayArg?: number) => {
      const dayToUse = startDayArg ?? selectedStartDay;
      audioRef.current?.unlock();
      audioRef.current?.playLampLight();
      const fresh = createInitialGameState(dayToUse);
      setGameState(fresh);
      setActiveDrawer('none');
      setScreenMode('playing');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [selectedStartDay]
  );

  // Keyboard bindings (Title Enter/Space, Pause P/Esc, Mute M, Lamp L, Ledger Space)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenMode === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMuted((v) => !v);
        return;
      }

      if (screenMode === 'playing') {
        if (e.key === 'p' || e.key === 'P' || (e.key === 'Escape' && !isFullscreen)) {
          e.preventDefault();
          setScreenMode('paused');
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          handlePropInteraction('lamp');
          return;
        }
        if (e.key === ' ') {
          e.preventDefault();
          setActiveDrawer((curr) => (curr === 'ledger' ? 'none' : 'ledger'));
        }
      } else if (screenMode === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setScreenMode('playing');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [screenMode, isFullscreen, startGame, handlePropInteraction]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPointerPosPct({ x, y });
  }, []);

  const handleStamp = (decision: 'approved' | 'rejected') => {
    if (!gameState.sealInked || !gameState.pulleyLowered || gameState.stampedDecision !== null) return;
    audioRef.current?.playSealSlam(gameState.phase === 3);
    sceneCtrlRef.current?.triggerFX('seal_slam');
    setGameState((prev) => stampDailyRequisition(prev, decision));
  };

  const handleNextDay = () => {
    if (gameState.stampedDecision === null) return;
    audioRef.current?.playPulleyCreak();
    setActiveDrawer('none');
    setGameState((prev) => advanceToNextDay(prev));
  };

  const showHallucinations =
    screenMode === 'playing' && (gameState.sanity < 72 || gameState.phase >= 2);

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      aria-label="Lưỡng Cước Dương — Kinh dị tâm lý 3D"
      className={`relative w-full overflow-hidden select-none bg-[#060405] text-[#E6DEC8] ${
        isFullscreen
          ? 'h-[100dvh] rounded-none border-0'
          : 'h-[580px] sm:h-[640px] lg:h-[690px] rounded-2xl border border-[#3E271E] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]'
      }`}
    >
      {/* Dedicated WebGL Mount Layer */}
      <div
        ref={canvasMountRef}
        data-testid="luong-cuoc-duong-canvas"
        className="absolute inset-0 w-full h-full"
      />

      {webglError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#090607] p-6 text-center">
          <div className="max-w-md space-y-3 border border-[#6E2622] bg-[#140B0C] p-6">
            <h3 className="font-serif text-lg font-bold text-[#E6DEC8]">
              Không thể khởi tạo khung hình 3D WebGL
            </h3>
            <p className="text-xs text-[#B5A68C]">{webglError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-[#A63A32] bg-[#451412] hover:bg-[#5E1A16] text-xs font-mono text-[#FFE0DB] cursor-pointer"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )}

      {/* Subtle Vignette & Blackout Darkness Veil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: gameState.lampLit
            ? 'radial-gradient(circle at 46% 52%, transparent 38%, rgba(4,3,4,0.68) 100%)'
            : 'radial-gradient(circle at 50% 50%, rgba(12,6,6,0.78) 0%, rgba(2,2,3,0.97) 75%)',
          opacity: gameState.ending === 'historical_liberation' ? 0.1 : 1,
        }}
      />

      {/* Cursor-Tracking Peripheral Sanity Hallucinations */}
      {showHallucinations && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {HALLUCINATION_ANCHORS.map((anchor) => {
            const dx = pointerPosPct.x - anchor.xPct;
            const dy = pointerPosPct.y - anchor.yPct;
            const dist = Math.hypot(dx, dy);
            const snappedToInk = dist < 17;
            const intensity = Math.max(0.15, (100 - gameState.sanity) / 90);
            return (
              <div
                key={anchor.id}
                data-testid={`sanity-ghost-${anchor.id}`}
                data-snapped={snappedToInk ? 'true' : 'false'}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
                style={{
                  left: `${anchor.xPct}%`,
                  top: `${anchor.yPct}%`,
                  opacity: snappedToInk ? 0.12 : Math.min(0.75, intensity),
                  transform: snappedToInk
                    ? 'translate(-50%, -50%) scale(0.85)'
                    : 'translate(-50%, -50%) scale(1.12) skewX(-5deg)',
                }}
              >
                <div className="flex flex-col items-center gap-0.5 font-serif">
                  <span
                    className={
                      snappedToInk
                        ? 'text-xl text-[#3E352B]'
                        : 'text-3xl font-bold text-[#B8251E]'
                    }
                    style={{
                      textShadow: snappedToInk ? 'none' : '0 0 10px rgba(184,37,30,0.6)',
                    }}
                  >
                    {snappedToInk ? '·' : anchor.char}
                  </span>
                  {!snappedToInk && gameState.sanity < 50 && (
                    <span className="text-[10px] tracking-[0.14em] uppercase text-[#C94B42]">
                      {anchor.whisper}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TITLE SCREEN OVERLAY */}
      {screenMode === 'title' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 bg-gradient-to-r from-[#070506]/92 via-[#070506]/68 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B8986A]">
              Tuy Dương · Năm 757 SCN
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setMuted((m) => !m);
                }}
                className="w-9 h-9 flex items-center justify-center border border-[#543B2E] bg-[#140D0B]/90 text-[#D9C7A6] hover:border-[#C28E4E] cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              {onToggleFullscreen && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleFullscreen();
                  }}
                  className="w-9 h-9 flex items-center justify-center border border-[#543B2E] bg-[#140D0B]/90 text-[#D9C7A6] hover:border-[#C28E4E] cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <div className="max-w-lg space-y-5 my-auto">
            {/* Custom Inline SVG Tang Vermilion Seal & Title Emblem */}
            <div className="flex items-start gap-4">
              <svg
                viewBox="0 0 88 88"
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="4"
                  width="80"
                  height="80"
                  rx="4"
                  fill="#7A1313"
                  stroke="#B82B23"
                  strokeWidth="2.5"
                />
                <rect
                  x="10"
                  y="10"
                  width="68"
                  height="68"
                  fill="none"
                  stroke="#E6D2B5"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                />
                <text
                  x="44"
                  y="39"
                  textAnchor="middle"
                  fill="#F3E6D0"
                  fontSize="24"
                  fontFamily='"Noto Serif", "Plus Jakarta Sans", serif'
                  fontWeight="700"
                >
                  兩腳
                </text>
                <text
                  x="44"
                  y="68"
                  textAnchor="middle"
                  fill="#F3E6D0"
                  fontSize="24"
                  fontFamily='"Noto Serif", "Plus Jakarta Sans", serif'
                  fontWeight="700"
                >
                  羊簿
                </text>
              </svg>

              <div className="space-y-1.5">
                <h1
                  className="font-serif text-3xl sm:text-5xl font-bold tracking-[0.06em] text-[#F2E6CE] leading-none"
                  style={{ textShadow: '0 4px 18px rgba(0,0,0,0.9)' }}
                >
                  LƯỠNG CƯỚC DƯƠNG
                </h1>
                <p className="text-xs sm:text-sm font-serif italic text-[#C9A875]">
                  Sổ Kiểm Kê Hầm Ngầm · Quân Nhu Quan 30 Ngày Vây Thành
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed text-[#C7BBA4] max-w-[54ch]">
              Bị khóa dưới hầm lương thành Tuy Dương suốt 30 ngày vây hãm. Mỗi ngày hãy thực hiện đúng 4 bước:
              hạ ròng rọc kiểm bao, xếp quả cân cho thăng bằng, gảy bàn tính khớp số thực, rồi chấm mực son đóng dấu —
              cho tới khi trên ròng rọc thả xuống những bao tải rỉ máu mang theo kỷ vật của chính những người dân
              bạn từng trò chuyện qua lỗ thông hơi.
            </p>

            {/* Quick 4-step workflow primer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-w-lg text-[11px] font-mono">
              <div className="px-2.5 py-1.5 border border-[#453126] bg-[#120B09]/85 text-[#DFCEB2]">
                1. Hạ Ròng Rọc
              </div>
              <div className="px-2.5 py-1.5 border border-[#453126] bg-[#120B09]/85 text-[#DFCEB2]">
                2. Cân Tiểu Ly
              </div>
              <div className="px-2.5 py-1.5 border border-[#453126] bg-[#120B09]/85 text-[#DFCEB2]">
                3. Gảy Bàn Tính
              </div>
              <div className="px-2.5 py-1.5 border border-[#6E2A25] bg-[#1D0C0B]/85 text-[#F2CCC8]">
                4. Chấm Mực & Ký
              </div>
            </div>

            {/* Chapter / Phase Quick Selector */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-[#9A8970]">
                Chọn Khởi Điểm Hồ Sơ
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { day: 1, label: 'Ngày 1 · Cạn Kiệt' },
                  { day: 11, label: 'Ngày 11 · Biến Chất' },
                  { day: 21, label: 'Ngày 21 · Sổ Của Quỷ' },
                ].map((opt) => {
                  const locked = opt.day > maxUnlockedDay && opt.day !== initialQuery.startDay;
                  const active = selectedStartDay === opt.day;
                  return (
                    <button
                      key={opt.day}
                      type="button"
                      disabled={locked}
                      onClick={() => setSelectedStartDay(opt.day)}
                      className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                        locked
                          ? 'border-[#33241D] bg-[#110B0A]/60 text-[#5B4D41] cursor-not-allowed'
                          : active
                            ? 'border-[#C89A58] bg-[#2D1A12] text-[#F5E6C8] cursor-pointer'
                            : 'border-[#4D3428] bg-[#140D0B]/90 text-[#C4B297] hover:border-[#A67841] cursor-pointer'
                      }`}
                    >
                      {locked ? `${opt.label} (Khóa)` : opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-start="true"
                onClick={() => startGame()}
                className="px-6 py-3 bg-[#8C1915] hover:bg-[#A6211C] border border-[#D4554E] text-[#FAF0DC] font-serif font-bold text-sm tracking-[0.12em] uppercase shadow-[0_8px_24px_rgba(140,25,21,0.45)] cursor-pointer transition-colors"
              >
                Bắt Đầu Trực Ca
              </button>
              <span className="text-[11px] font-mono text-[#A6957B]">
                Âm thanh 3D · Khuyến nghị đeo tai nghe
              </span>
            </div>
          </div>

          <p className="text-[11px] font-mono text-[#B8A78B] tracking-wide">
            Click vật phẩm 3D · [L] Đèn dầu · [Space] Sổ kiểm kê · [M] Âm thanh · [P] Tạm dừng
          </p>
        </div>
      )}

      {/* ACTIVE PLAYING HUD (>= 85% Viewport Unobstructed) */}
      {screenMode === 'playing' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-4">
          {/* Top Bar: Left Diegetic Telemetry + Right Utility Buttons */}
          <div className="flex items-start justify-between gap-2">
            {/* Compact Lacquer & Brass Telemetry Strip */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-2 sm:gap-3 px-3 py-1.5 bg-[#120B09]/92 border border-[#4D3628] shadow-lg">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#B8925C]">
                  {getPhaseTitle(gameState.phase)}
                </div>
                <div
                  data-testid="lcd-day-readout"
                  className="font-serif text-base sm:text-lg font-bold text-[#F5EAD3] tabular-nums leading-tight"
                >
                  Ngày {gameState.day}/30
                </div>
              </div>

              <div className="h-7 w-px bg-[#3D291E]" />

              {/* Oil Lamp Meter */}
              <div className="min-w-[80px]">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#D6B178] whitespace-nowrap">
                  <span>ĐÈN DẦU</span>
                  <span className="tabular-nums">{Math.round(gameState.lampOil)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-[#241813] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      gameState.lampLit ? 'bg-[#E59B3E]' : 'bg-[#7A1B17]'
                    }`}
                    style={{ width: `${Math.round(gameState.lampOil)}%` }}
                  />
                </div>
              </div>

              {/* Sanity Meter */}
              <div className="min-w-[80px]">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#C7BCA6] whitespace-nowrap">
                  <span>TÂM TRÍ</span>
                  <span className="tabular-nums">{Math.round(gameState.sanity)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-[#241813] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      gameState.sanity < 35 ? 'bg-[#B82821]' : 'bg-[#A6B39A]'
                    }`}
                    style={{ width: `${Math.round(gameState.sanity)}%` }}
                  />
                </div>
              </div>

              {/* Garrison Compliance Meter */}
              <div className="min-w-[88px]">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-[#D48C84] whitespace-nowrap">
                  <span>TRẠI LÍNH</span>
                  <span className="tabular-nums">{Math.round(gameState.compliance)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-[#241813] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      gameState.compliance < 30 ? 'bg-[#D6362E]' : 'bg-[#9E3530]'
                    }`}
                    style={{ width: `${Math.round(gameState.compliance)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top-Right Compact Controls */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                tabIndex={-1}
                data-testid="lcd-toggle-ledger-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setActiveDrawer((curr) => (curr === 'ledger' ? 'none' : 'ledger'));
                }}
                className={`min-h-[36px] px-2.5 py-1 flex items-center gap-1.5 border text-xs font-mono cursor-pointer transition-colors ${
                  activeDrawer === 'ledger'
                    ? 'border-[#D9A760] bg-[#362116] text-[#FAF0DC]'
                    : 'border-[#4D3628] bg-[#120B09]/92 text-[#DFCEAF] hover:border-[#B8894B]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Sổ Kiểm Kê</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label={muted ? 'Bật âm thanh [M]' : 'Tắt âm thanh [M]'}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setMuted((m) => !m);
                }}
                className="w-9 h-9 flex items-center justify-center border border-[#4D3628] bg-[#120B09]/92 text-[#DFCEAF] hover:border-[#B8894B] cursor-pointer"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                tabIndex={-1}
                aria-label="Tạm dừng [P]"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setScreenMode('paused');
                }}
                className="w-9 h-9 flex items-center justify-center border border-[#4D3628] bg-[#120B09]/92 text-[#DFCEAF] hover:border-[#B8894B] cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>

              {onToggleFullscreen && (
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onToggleFullscreen();
                  }}
                  className="w-9 h-9 flex items-center justify-center border border-[#4D3628] bg-[#120B09]/92 text-[#DFCEAF] hover:border-[#B8894B] cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Center-Top Guided Workflow & Narrative Cue */}
          <div className="flex flex-col items-center gap-1.5 my-1">
            {!gameState.lampLit && (
              <button
                type="button"
                onClick={() => handlePropInteraction('lamp')}
                className="pointer-events-auto px-4 py-1.5 border border-[#C94B42] bg-[#240B0A]/95 text-[#FFD5CC] text-xs font-mono cursor-pointer hover:bg-[#3A110F]"
              >
                NGỌN ĐÈN ĐÃ TẮT — Bấm [L] hoặc click vào đây để thắp lại ngay!
              </button>
            )}

            {hoveredProp ? (
              <div className="px-3.5 py-1 bg-[#140C0A]/94 border border-[#8A6142] text-center shadow-lg">
                <span className="text-xs font-serif font-bold text-[#F2DFBA]">
                  {PROP_LABELS[hoveredProp].title}
                </span>
                <span className="mx-2 text-[#6B503C]">·</span>
                <span className="text-[11px] font-mono text-[#D6C3A3]">
                  {PROP_LABELS[hoveredProp].hint}
                </span>
              </div>
            ) : (
              <div
                data-testid="lcd-guided-banner"
                className="pointer-events-auto max-w-2xl px-3.5 py-1.5 bg-[#120B09]/90 border border-[#4D3628] text-center shadow-lg space-y-0.5"
              >
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
                  <span className="text-[#E8B25C] font-bold">{guidedStep.title}</span>
                  <span className="text-[#5E4535]">·</span>
                  <span className="text-[#C7B69B]">{guidedStep.hint}</span>
                </div>
                <p
                  data-testid="lcd-event-log"
                  className="text-xs font-serif text-[#DDD0B6] leading-snug"
                >
                  {gameState.lastEventMessage}
                </p>
              </div>
            )}
          </div>

          {/* Side Drawers: Ledger / Scale / Abacus / Stamp OR Vent NPC Dialogue OR Keepsake */}
          <div className="flex-1 flex items-center justify-end pointer-events-none min-h-0">
            {activeDrawer === 'ledger' && (
              <div
                data-testid="lcd-ledger-drawer"
                className="pointer-events-auto w-full max-w-[380px] max-h-full overflow-y-auto bg-[#1B130F]/96 border border-[#856143] p-3.5 shadow-2xl space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 border-b border-[#473325] pb-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#C89A58]">
                      {dayScript.dateLabel} · {dayScript.ledgerCode}
                    </div>
                    <h2 className="font-serif text-base font-bold text-[#F5E8CE]">
                      {dayScript.rationName}
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label="Đóng sổ kiểm kê"
                    onClick={() => setActiveDrawer('none')}
                    className="p-1 text-[#A8947A] hover:text-[#F5E8CE] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drawer Tabs: Workstation vs Story/Keepsake Chronicle */}
                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setLedgerTab('work')}
                    className={`py-1.5 border cursor-pointer transition-colors ${
                      ledgerTab === 'work'
                        ? 'border-[#C89A58] bg-[#332014] text-[#FAF0DC] font-bold'
                        : 'border-[#3D2B20] bg-[#140E0B] text-[#9E8B72] hover:text-[#E6D6BA]'
                    }`}
                  >
                    Kiểm Kho Hôm Nay
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerTab('chronicle')}
                    className={`py-1.5 border cursor-pointer transition-colors tabular-nums ${
                      ledgerTab === 'chronicle'
                        ? 'border-[#C89A58] bg-[#332014] text-[#FAF0DC] font-bold'
                        : 'border-[#3D2B20] bg-[#140E0B] text-[#9E8B72] hover:text-[#E6D6BA]'
                    }`}
                  >
                    Hồ Sơ & Kỷ Vật ({discoveredKeepsakes.length})
                  </button>
                </div>

                {ledgerTab === 'chronicle' ? (
                  <div className="space-y-2.5">
                    <div className="p-2.5 bg-[#140E0B] border border-[#3D2B20] space-y-1.5">
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#C89A58]">
                        Dân Thành Qua Lỗ Thông Hơi
                      </div>
                      <div className="space-y-1 text-xs font-serif text-[#DFCEB2]">
                        <div className="flex items-center justify-between">
                          <span>Lão Trương (Thợ bánh phố Đông)</span>
                          <span className="font-mono text-[10px] text-[#B89F7D] tabular-nums">
                            Gắn kết: {gameState.npcBonds.baker}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Thị Mai & Bé An (Ngõ Hòe)</span>
                          <span className="font-mono text-[10px] text-[#B89F7D] tabular-nums">
                            Gắn kết: {gameState.npcBonds.mother}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Thư Sinh Tống Văn</span>
                          <span className="font-mono text-[10px] text-[#B89F7D] tabular-nums">
                            Gắn kết: {gameState.npcBonds.scholar}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#140E0B] border border-[#3D2B20] space-y-2">
                      <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#D97A73]">
                        Kỷ Vật Đã Tìm Thấy Trong Bao Hàng
                      </div>
                      {discoveredKeepsakes.length === 0 ? (
                        <p className="text-xs font-serif italic text-[#8F7E68]">
                          Chưa phát hiện kỷ vật nào. Hãy luôn chọn "Mở Bao Kiểm Tra" sau khi hạ ròng rọc.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {discoveredKeepsakes.map((entry) => (
                            <div
                              key={entry.day}
                              className="p-2 border border-[#5C2420] bg-[#1F100F] space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                                <span className="text-[#E08A84]">
                                  Ngày {entry.day} · {entry.keepsake.hanTag}
                                </span>
                                <span
                                  className={
                                    entry.decision === 'rejected'
                                      ? 'text-[#9ED485]'
                                      : entry.decision === 'approved'
                                        ? 'text-[#E36C64]'
                                        : 'text-[#E8B25C]'
                                  }
                                >
                                  {entry.decision === 'rejected'
                                    ? 'Đã giữ lại'
                                    : entry.decision === 'approved'
                                      ? 'Đã đẩy ra cửa'
                                      : 'Đang chờ quyết định'}
                                </span>
                              </div>
                              <div className="text-xs font-serif font-bold text-[#F5DFDC]">
                                {entry.keepsake.title}
                              </div>
                              <p className="text-[11px] font-serif leading-relaxed text-[#D1B2AE]">
                                {entry.keepsake.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {gameState.history.length > 0 && (
                      <div className="p-2.5 bg-[#140E0B] border border-[#3D2B20] space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#9E8B72]">
                          Nhật Ký Đóng Dấu Gần Nhất
                        </div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {[...gameState.history]
                            .reverse()
                            .slice(0, 6)
                            .map((h) => (
                              <div
                                key={h.day}
                                className="flex items-center justify-between text-[11px] font-mono text-[#C7B497]"
                              >
                                <span className="tabular-nums">
                                  Ngày {h.day} · {h.ledgerCode}
                                </span>
                                <span
                                  className={
                                    h.decision === 'approved' ? 'text-[#E3A857]' : 'text-[#97B4D4]'
                                  }
                                >
                                  {h.decision === 'approved' ? 'Duyệt' : 'Từ chối'}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {dayScript.generalDecree && (
                      <div className="p-2 border border-[#A62822] bg-[#360E0D] text-[11px] font-serif text-[#FADAD6]">
                        {dayScript.generalDecree}
                      </div>
                    )}

                    {/* Phase Rule & Story Sensory Context */}
                    <div className="p-2 bg-[#140E0B] border border-[#3B291E] space-y-1">
                      <p className="text-[11px] font-serif italic text-[#C9BA9F] leading-snug">
                        {gameState.parcelInspected && dayScript.inspectDetail
                          ? dayScript.inspectDetail
                          : dayScript.atmosphereNote}
                      </p>
                      <p className="text-[10px] font-mono text-[#D9A760]">{guidedStep.ruleSummary}</p>
                    </div>

                    {/* Step 1: Pulley & Parcel */}
                    <div
                      className={`space-y-1.5 p-2.5 bg-[#140E0B] border ${
                        guidedStep.stepNumber === 1 ? 'border-[#C89A58]' : 'border-[#3D2B20]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#C7B497]">
                        <span>1. KIỂM TRA HÀNG RÒNG RỌC</span>
                        <span className="tabular-nums text-[#E8B872]">
                          Lệnh xuất: {dayScript.targetLiang} lượng
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {!gameState.pulleyLowered ? (
                          <button
                            type="button"
                            data-testid="lcd-lower-pulley-btn"
                            onClick={() => handlePropInteraction('pulley')}
                            className="w-full py-1.5 px-3 bg-[#362419] hover:bg-[#4A3223] border border-[#8A6546] text-xs font-mono text-[#F4E6CC] cursor-pointer"
                          >
                            Kéo Ròng Rọc Hạ Hàng
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              data-testid="lcd-inspect-btn"
                              onClick={() => {
                                if (!gameState.parcelInspected) {
                                  if (dayScript.keepsake) audioRef.current?.playRattleSound();
                                  setGameState((prev) => inspectPulleyParcel(prev));
                                }
                                if (dayScript.keepsake) setActiveDrawer('keepsake');
                              }}
                              className={`flex-1 py-1.5 px-2 border text-[11px] font-mono cursor-pointer ${
                                gameState.parcelInspected
                                  ? 'border-[#546B48] bg-[#1C2618] text-[#CFE0C5]'
                                  : 'border-[#C89A58] bg-[#2D1D14] text-[#F5E5C7] hover:bg-[#3E281C]'
                              }`}
                            >
                              {gameState.parcelInspected ? '✓ Đã Mở Bao' : 'Mở Bao Kiểm Tra'}
                            </button>
                            <button
                              type="button"
                              data-testid="lcd-place-scale-btn"
                              disabled={gameState.parcelOnScale}
                              onClick={() => {
                                audioRef.current?.playScaleClink(true);
                                setGameState((prev) => placeParcelOnScale(prev));
                              }}
                              className={`flex-1 py-1.5 px-2 border text-[11px] font-mono ${
                                gameState.parcelOnScale
                                  ? 'border-[#546B48] bg-[#1C2618] text-[#CFE0C5] cursor-default'
                                  : 'border-[#C89A58] bg-[#362317] text-[#F5E5C7] hover:bg-[#4B3120] cursor-pointer'
                              }`}
                            >
                              {gameState.parcelOnScale ? '✓ Đã Lên Cân' : 'Đặt Lên Cân'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Step 2: Balance Scale Counterweights */}
                    <div
                      className={`space-y-1.5 p-2.5 bg-[#140E0B] border ${
                        guidedStep.stepNumber === 2 ? 'border-[#C89A58]' : 'border-[#3D2B20]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#C7B497]">2. QUẢ CÂN TIỂU LY</span>
                        <span
                          className={`tabular-nums font-bold ${
                            balanced ? 'text-[#9ED485]' : 'text-[#E3A857]'
                          }`}
                        >
                          {!gameState.parcelOnScale
                            ? 'Chưa đặt hàng'
                            : balanced
                              ? `${scaleWeightsVal} lượng · CÂN BẰNG`
                              : scaleDelta < 0
                                ? `${scaleWeightsVal} lượng · Thiếu ${Math.abs(scaleDelta)}`
                                : `${scaleWeightsVal} lượng · Dư ${scaleDelta}`}
                        </span>
                      </div>

                      {balanced && dayScript.actualLiang < dayScript.targetLiang && (
                        <div className="px-2 py-1 border border-[#9E4E2E] bg-[#2D140D] text-[11px] font-mono text-[#FFD5B8] tabular-nums">
                          Phát hiện hao hụt {dayScript.targetLiang - dayScript.actualLiang} lượng ({dayScript.actualLiang}/{dayScript.targetLiang})!
                        </div>
                      )}

                      <div className="grid grid-cols-6 gap-1">
                        {COUNTERWEIGHTS.map((w) => (
                          <button
                            key={w}
                            type="button"
                            data-testid={`lcd-weight-${w}`}
                            onClick={() => {
                              audioRef.current?.playScaleClink(w >= 20);
                              setGameState((prev) => addScaleWeight(prev, w));
                            }}
                            className="py-1.5 border border-[#6E5038] bg-[#261912] hover:border-[#D4A259] text-[11px] font-mono text-[#F0DFBE] tabular-nums cursor-pointer"
                          >
                            +{w}
                          </button>
                        ))}
                      </div>
                      {gameState.scaleWeights.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {gameState.scaleWeights.map((w, idx) => (
                            <button
                              key={`${w}-${idx}`}
                              type="button"
                              onClick={() => {
                                audioRef.current?.playScaleClink(false);
                                setGameState((prev) => removeScaleWeightAt(prev, idx));
                              }}
                              className="px-1.5 py-0.5 bg-[#3B291C] border border-[#7A593C] text-[10px] font-mono text-[#EAD7B3] hover:bg-[#571F1B] cursor-pointer"
                            >
                              {w}×
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setGameState((prev) => clearScaleWeights(prev))}
                            className="ml-auto text-[10px] font-mono text-[#B89074] hover:text-[#F5E6C8] cursor-pointer"
                          >
                            Gỡ hết
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step 3: Interactive 3-Rod Suanpan Abacus */}
                    <div
                      className={`space-y-1.5 p-2.5 bg-[#140E0B] border ${
                        guidedStep.stepNumber === 3 ? 'border-[#C89A58]' : 'border-[#3D2B20]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="text-[#C7B497]">3. BÀN TÍNH GẢY</span>
                        <div className="flex items-center gap-2">
                          {balanced && !abacusMatch && (
                            <button
                              type="button"
                              data-testid="lcd-abacus-automatch-btn"
                              onClick={() => {
                                audioRef.current?.playAbacusClack(1.06);
                                setGameState((prev) => ({
                                  ...prev,
                                  abacus: decomposeToAbacus(dayScript.actualLiang),
                                }));
                              }}
                              className="px-1.5 py-0.5 border border-[#8E6A44] bg-[#2D1E13] hover:bg-[#422B1A] text-[10px] text-[#F2D9AA] cursor-pointer"
                            >
                              Khớp {dayScript.actualLiang}
                            </button>
                          )}
                          <span
                            data-testid="lcd-abacus-val"
                            className={`tabular-nums font-bold ${
                              abacusMatch ? 'text-[#9ED485]' : 'text-[#E3A857]'
                            }`}
                          >
                            {abacusVal} lượng {abacusMatch ? '· KHỚP SỐ' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Trăm', 'Chục', 'Đơn'] as const).map((label, rIdx) => {
                          const rodIdx = rIdx as 0 | 1 | 2;
                          const rod = gameState.abacus[rodIdx];
                          const rodDigit = computeRodValue(rod);
                          return (
                            <div
                              key={label}
                              className="p-1.5 bg-[#1D130E] border border-[#4D3626] flex flex-col items-center gap-1"
                            >
                              <div className="w-full flex items-center justify-between px-0.5 text-[10px] font-mono">
                                <span className="text-[#A69277]">{label}</span>
                                <span className="font-bold text-[#F2DFBA] tabular-nums">{rodDigit}</span>
                              </div>
                              <button
                                type="button"
                                data-testid={`lcd-abacus-heaven-${rodIdx}`}
                                onClick={() => {
                                  audioRef.current?.playAbacusClack(1.12);
                                  setGameState((prev) => ({
                                    ...prev,
                                    abacus: toggleAbacusHeaven(prev.abacus, rodIdx),
                                  }));
                                }}
                                className={`w-full py-1 text-[10px] font-mono border cursor-pointer ${
                                  rod.heaven
                                    ? 'border-[#D99F4E] bg-[#6E3B1D] text-[#FFF0D4]'
                                    : 'border-[#4D3626] bg-[#281B14] text-[#9E8B73]'
                                }`}
                              >
                                +5 {rod.heaven ? '▼' : '▲'}
                              </button>
                              <div className="w-full h-px bg-[#694B36]" />
                              <div className="grid grid-cols-4 gap-0.5 w-full">
                                {[1, 2, 3, 4].map((beadNum) => {
                                  const active = rod.earth >= beadNum;
                                  return (
                                    <button
                                      key={beadNum}
                                      type="button"
                                      data-testid={`lcd-abacus-earth-${rodIdx}-${beadNum}`}
                                      aria-label={`Cột ${label} ${beadNum} hạt dưới`}
                                      onClick={() => {
                                        audioRef.current?.playAbacusClack(0.95 + beadNum * 0.04);
                                        setGameState((prev) => ({
                                          ...prev,
                                          abacus: setAbacusEarth(prev.abacus, rodIdx, beadNum),
                                        }));
                                      }}
                                      className={`h-5 text-[10px] font-mono border cursor-pointer ${
                                        active
                                          ? 'border-[#C88D48] bg-[#6B3E21] text-[#FFF0D4]'
                                          : 'border-[#3D2B1F] bg-[#160F0B] text-[#7D6C58]'
                                      }`}
                                    >
                                      1
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 4: Ink Dip & Seal Stamp */}
                    <div
                      className={`space-y-1.5 p-2.5 bg-[#140E0B] border ${
                        guidedStep.stepNumber === 4 && gameState.stampedDecision === null
                          ? 'border-[#C89A58]'
                          : 'border-[#3D2B20]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#C7B497]">
                        <span>4. MỰC CHU SA & CON DẤU</span>
                        <span className={gameState.sealInked ? 'text-[#E3544B]' : 'text-[#8C7B65]'}>
                          {gameState.sealInked ? 'Đã Thấm Son' : 'Chưa Chấm Mực'}
                        </span>
                      </div>

                      {gameState.stampedDecision === null ? (
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            data-testid="lcd-dip-ink-btn"
                            disabled={gameState.sealInked}
                            onClick={() => handlePropInteraction('inkpad')}
                            className={`w-full py-1.5 px-3 border text-xs font-mono ${
                              gameState.sealInked
                                ? 'border-[#73231F] bg-[#2D100E] text-[#D48A84] cursor-default'
                                : 'border-[#B33930] bg-[#451310] hover:bg-[#5E1A16] text-[#FADAD6] cursor-pointer'
                            }`}
                          >
                            {gameState.sealInked ? '✓ Con Dấu Đã Thấm Đỏ' : 'Chấm Mực Chu Sa'}
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              data-testid="lcd-stamp-approve-btn"
                              disabled={!gameState.sealInked || !gameState.pulleyLowered}
                              onClick={() => handleStamp('approved')}
                              className={`py-2 px-2 border text-xs font-serif font-bold ${
                                gameState.sealInked && gameState.pulleyLowered
                                  ? 'border-[#D44840] bg-[#821512] hover:bg-[#9E1C18] text-[#FFF1EC] cursor-pointer'
                                  : 'border-[#3B2A22] bg-[#1A120E] text-[#6B5B4E] cursor-not-allowed'
                              }`}
                            >
                              Duyệt Xuất Kho
                            </button>
                            <button
                              type="button"
                              data-testid="lcd-stamp-reject-btn"
                              disabled={!gameState.sealInked || !gameState.pulleyLowered}
                              onClick={() => handleStamp('rejected')}
                              className={`py-2 px-2 border text-xs font-serif font-bold ${
                                gameState.sealInked && gameState.pulleyLowered
                                  ? 'border-[#6E6459] bg-[#2B2622] hover:bg-[#3B342E] text-[#EBE2D3] cursor-pointer'
                                  : 'border-[#3B2A22] bg-[#1A120E] text-[#6B5B4E] cursor-not-allowed'
                              }`}
                            >
                              Từ Chối / Giấu
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          data-testid="lcd-next-day-btn"
                          onClick={handleNextDay}
                          className="w-full py-2 px-3 bg-[#7D572D] hover:bg-[#996B38] border border-[#D4A460] text-[#FFF4DE] font-serif font-bold text-xs tracking-wider uppercase cursor-pointer"
                        >
                          {gameState.day >= 30 ? 'Kết Thúc Ca Trực Ngày 30 →' : `Kết Sổ · Sang Ngày ${gameState.day + 1} →`}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Vent Encounter Card */}
            {activeDrawer === 'vent' && dayScript.ventEncounter && (
              <div
                data-testid="lcd-vent-drawer"
                className="pointer-events-auto w-full max-w-[360px] bg-[#171210]/96 border border-[#735C49] p-4 shadow-2xl space-y-3"
              >
                <div className="flex items-start justify-between border-b border-[#3D3026] pb-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#97AFC9]">
                      Lỗ Thông Hơi Phố Trên
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#F2E6CE]">
                      {dayScript.ventEncounter.npcName}
                    </h3>
                    <p className="text-[11px] font-mono text-[#A89680]">
                      {dayScript.ventEncounter.npcRole}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Đóng cửa sổ lỗ thông hơi"
                    onClick={() => setActiveDrawer('none')}
                    className="p-1 text-[#A8947A] hover:text-[#F5E8CE] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#E3D6BE] italic">
                  "{dayScript.ventEncounter.dialogue}"
                </p>

                {!gameState.ventHandled ? (
                  <div className="space-y-2 pt-1">
                    {dayScript.ventEncounter.canShareCrumbs && (
                      <button
                        type="button"
                        data-testid="lcd-vent-share-btn"
                        onClick={() => {
                          setGameState((prev) => resolveVentChoice(prev, 'shared'));
                          setActiveDrawer('none');
                        }}
                        className="w-full py-2 px-3 bg-[#2B3D24] hover:bg-[#38522E] border border-[#6E965D] text-xs font-mono text-[#E3F2DA] cursor-pointer text-left"
                      >
                        {dayScript.ventEncounter.shareLabel}
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid="lcd-vent-withhold-btn"
                      onClick={() => {
                        setGameState((prev) => resolveVentChoice(prev, 'withheld'));
                        setActiveDrawer('none');
                      }}
                      className="w-full py-2 px-3 bg-[#261B16] hover:bg-[#382720] border border-[#6B4F3E] text-xs font-mono text-[#DFCEB2] cursor-pointer text-left"
                    >
                      {dayScript.ventEncounter.withholdLabel ?? 'Đóng khe gió'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-[#9AB38E]">
                    Đã trao đổi xong với {dayScript.ventEncounter.npcName} hôm nay.
                  </p>
                )}
              </div>
            )}

            {/* Phase 3 Keepsake Horror Inspection Card */}
            {activeDrawer === 'keepsake' && dayScript.keepsake && (
              <div
                data-testid="lcd-keepsake-drawer"
                className="pointer-events-auto w-full max-w-[360px] bg-[#1B0D0D]/96 border border-[#A32D26] p-4 shadow-2xl space-y-3"
              >
                <div className="flex items-start justify-between border-b border-[#541C19] pb-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E06C65]">
                      Kỷ Vật Trong Bao Máu · {dayScript.keepsake.hanTag}
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#FCE6E3]">
                      {dayScript.keepsake.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    aria-label="Đóng thẻ kỷ vật"
                    onClick={() => setActiveDrawer('ledger')}
                    className="p-1 text-[#C78F8B] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#E8C5C1]">
                  {dayScript.keepsake.description}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveDrawer('ledger')}
                  className="w-full py-2 px-3 bg-[#611512] hover:bg-[#7D1D19] border border-[#C94B42] text-xs font-mono text-[#FDEAE8] cursor-pointer"
                >
                  Đưa Lên Bàn Cân & Quyết Định →
                </button>
              </div>
            )}
          </div>

          {/* Bottom Tactile Desk Dock */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <button
              type="button"
              data-testid="dock-lamp-btn"
              onClick={() => handlePropInteraction('lamp')}
              className={`min-h-[36px] px-2.5 py-1.5 border text-[11px] font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                !gameState.lampLit || gameState.lampOil < 30 || guidedStep.focusProp === 'lamp'
                  ? 'border-[#D9534F] bg-[#451412] text-[#FFE0DB]'
                  : 'border-[#543B2C] bg-[#140D0A]/94 text-[#E6D2B2] hover:border-[#C28D4E]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#E59B3E]" aria-hidden="true" />
              <span>Đèn [L]</span>
            </button>

            <button
              type="button"
              data-testid="dock-pulley-btn"
              onClick={() => {
                setLedgerTab('work');
                handlePropInteraction('pulley');
              }}
              className={`min-h-[36px] px-2.5 py-1.5 border text-[11px] font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                guidedStep.focusProp === 'pulley' ||
                guidedStep.focusProp === 'scale' ||
                guidedStep.focusProp === 'abacus'
                  ? 'border-[#E8B25C] bg-[#362214] text-[#FFF0D1]'
                  : 'border-[#543B2C] bg-[#140D0A]/94 hover:border-[#C28D4E] text-[#E6D2B2]'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-[#C89A58]" aria-hidden="true" />
              <span>
                {!gameState.pulleyLowered
                  ? '1. Hạ Ròng Rọc'
                  : !gameState.parcelInspected
                    ? '2. Mở Bao'
                    : !gameState.parcelOnScale
                      ? '2. Đặt Lên Cân'
                      : '2–3. Cân & Bàn Tính'}
              </span>
            </button>

            <button
              type="button"
              data-testid="dock-seal-btn"
              onClick={() => {
                setLedgerTab('work');
                if (!gameState.sealInked) {
                  handlePropInteraction('inkpad');
                } else {
                  setActiveDrawer('ledger');
                }
              }}
              className={`min-h-[36px] px-2.5 py-1.5 border text-[11px] font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                guidedStep.focusProp === 'inkpad' || guidedStep.focusProp === 'seal'
                  ? 'border-[#E8665E] bg-[#4A1714] text-[#FFE8E6]'
                  : 'border-[#7D2822] bg-[#29100E]/94 hover:border-[#D44E46] text-[#F7D7D4]'
              }`}
            >
              <Stamp className="w-3.5 h-3.5 text-[#D94E45]" aria-hidden="true" />
              <span>{gameState.sealInked ? '4. Mở Sổ Ký' : '4. Chấm Mực Son'}</span>
            </button>

            <button
              type="button"
              data-testid="dock-washbasin-btn"
              disabled={gameState.washedFaceToday}
              onClick={() => handlePropInteraction('washbasin')}
              className={`min-h-[36px] px-2.5 py-1.5 border text-[11px] font-mono inline-flex items-center gap-1.5 ${
                gameState.washedFaceToday
                  ? 'border-[#2E241E] bg-[#100B09]/70 text-[#6E6050] cursor-not-allowed'
                  : 'border-[#3E4F59] bg-[#0F171C]/94 hover:border-[#769BB0] text-[#CBE0EB] cursor-pointer'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#78A1B5]" aria-hidden="true" />
              <span>{gameState.washedFaceToday ? 'Đã Rửa Mặt' : 'Chậu Nước (+Tâm Trí)'}</span>
            </button>

            {dayScript.ventEncounter && (
              <button
                type="button"
                data-testid="dock-vent-btn"
                onClick={() => handlePropInteraction('vent')}
                className={`min-h-[36px] px-2.5 py-1.5 border text-[11px] font-mono inline-flex items-center gap-1.5 cursor-pointer ${
                  !gameState.ventHandled
                    ? 'border-[#6F94B8] bg-[#14202B] text-[#E1EEFA]'
                    : 'border-[#453429] bg-[#140D0A]/94 text-[#B5A58C]'
                }`}
              >
                <Wind className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {!gameState.ventHandled ? `Khe Gió: ${dayScript.ventEncounter.npcName}` : 'Khe Gió'}
                </span>
              </button>
            )}

            {gameState.stampedDecision !== null && (
              <button
                type="button"
                data-testid="dock-next-day-btn"
                onClick={handleNextDay}
                className="min-h-[36px] px-3 py-1.5 border border-[#D4A460] bg-[#6E4A22] hover:bg-[#8A5D2C] text-[11px] font-serif font-bold text-[#FFF2D9] inline-flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{gameState.day >= 30 ? 'Kết Thúc Ngày 30' : `Sang Ngày ${gameState.day + 1}`}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAUSED MODAL */}
      {screenMode === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#050304]/85 p-4">
          <div className="w-full max-w-sm border border-[#6E503B] bg-[#140D0B] p-6 space-y-4 text-center shadow-2xl">
            <h2 className="font-serif text-2xl font-bold text-[#F2E5CA]">Tạm Ngừng Trực Ca</h2>
            <p className="text-xs font-mono text-[#B09E82]">
              Ngày {gameState.day}/30 · Tâm trí {Math.round(gameState.sanity)}% · Tuân thủ{' '}
              {Math.round(gameState.compliance)}%
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScreenMode('playing')}
                className="w-full py-2.5 bg-[#8C1915] hover:bg-[#A6211C] border border-[#D4554E] text-xs font-serif font-bold uppercase tracking-wider text-[#FAF0DC] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tiếp Tục Ca Trực</span>
              </button>
              <button
                type="button"
                onClick={() => startGame(gameState.day)}
                className="w-full py-2 bg-[#241813] hover:bg-[#33221B] border border-[#5C4131] text-xs font-mono text-[#DFCEB2] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Làm Lại Từ Ngày {gameState.day}</span>
              </button>
              <button
                type="button"
                onClick={() => setScreenMode('title')}
                className="w-full py-2 bg-transparent hover:bg-[#1C120E] border border-[#3E2B20] text-xs font-mono text-[#9E8B72] cursor-pointer"
              >
                Về Màn Hình Đầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / HISTORICAL ENDING MODAL */}
      {screenMode === 'gameover' && gameState.ending && (
        <div
          data-testid="lcd-ending-modal"
          className={`absolute inset-0 z-30 flex items-center justify-center p-5 ${
            gameState.ending === 'historical_liberation' ? 'bg-[#030203]/96' : 'bg-[#080303]/92'
          }`}
        >
          <div className="w-full max-w-xl border border-[#5E4232] bg-[#0D0807] p-6 sm:p-8 space-y-5 shadow-2xl">
            {gameState.ending === 'historical_liberation' ? (
              <>
                <div className="space-y-2 border-b border-[#3D2A20] pb-4">
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#C89A58]">
                    Kết Cục Lịch Sử · Ngày 30
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5E8CE]">
                    Cửa Hầm Mở Tung Dưới Ánh Nắng Chói Lòa
                  </h2>
                  <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#D8CBB4]">
                    Quân tiếp viện nhà Đường tiến vào thành Tuy Dương. Không có tiếng reo hò chiến thắng —
                    chỉ có vài trăm bóng người gầy trơ xương đứng lặng câm nhìn bạn bước lên từ hầm tối
                    bằng ánh mắt trống rỗng, dại đi vì đói.
                  </p>
                </div>

                <blockquote className="p-4 border border-[#6E231F] bg-[#160B0B] space-y-2">
                  <p className="text-xs sm:text-sm font-serif italic leading-relaxed text-[#EBD6D2]">
                    "{HISTORICAL_CHRONICLE_QUOTE.excerpt}"
                  </p>
                  <footer className="text-[11px] font-mono text-[#B8897E]">
                    — {HISTORICAL_CHRONICLE_QUOTE.source}
                  </footer>
                </blockquote>

                <p className="text-xs font-serif text-[#C9B79C] leading-relaxed">
                  {discoveredKeepsakes.filter((k) => k.decision === 'rejected').length > 0
                    ? `Trong túi áo bạn vẫn giữ lại ${discoveredKeepsakes.filter((k) => k.decision === 'rejected').length} kỷ vật của những người dân ngõ Hòe và phố Đông — chứng tích cuối cùng rằng họ từng tồn tại như những con người.`
                    : 'Sổ kiểm kê của bạn ngay ngắn không một vết tẩy xóa, nhưng trang giấy trắng tinh ấy lại là chứng từ lạnh lẽo nhất cho những ngày cuối cùng của thành Tuy Dương.'}
                </p>
              </>
            ) : (
              <div className="space-y-2 border-b border-[#4D1E1B] pb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D9534F]">
                  {gameState.ending === 'iron_door_breached'
                    ? 'Cửa Sắt Bị Phá Vỡ'
                    : gameState.ending === 'suffocated_darkness'
                      ? 'Chết Ngạt Trong Bóng Tối'
                      : 'Tâm Trí Tan Vỡ'}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FCE3DF]">
                  {gameState.ending === 'iron_door_breached'
                    ? 'Quân Lính Đói Đã Xông Vào Hầm'
                    : gameState.ending === 'suffocated_darkness'
                      ? 'Ngọn Đèn Tắt Vĩnh Viễn'
                      : 'Bạn Trở Thành Một Con Số Trên Sổ Sách'}
                </h2>
                <p className="text-xs sm:text-sm font-serif leading-relaxed text-[#D4B6B2]">
                  {gameState.ending === 'iron_door_breached'
                    ? 'Sự từ chối của bạn khiến những kẻ đói khát mất sạch lý trí. Thanh gỗ chắn cửa gãy đôi, và trại lính không phân biệt nổi đâu là người kiểm kho nữa.'
                    : gameState.ending === 'suffocated_darkness'
                      ? 'Trong bóng tối đặc quánh không ánh đèn, hơi thở sát sau gáy đã chạm vào cổ bạn.'
                      : 'Những nét chữ Hán bò khắp mặt bàn. Bạn tự cầm con dấu son đóng lên trán mình.'}
                </p>
              </div>
            )}

            {/* Run Summary Stat Tiles */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-2.5 border border-[#3B291F] bg-[#140D0B]">
                <div className="text-[10px] font-mono text-[#9E8B72]">NGÀY TRỤ ĐƯỢC</div>
                <div className="font-serif text-xl font-bold text-[#F5E8CE] tabular-nums">
                  {gameState.day}/30
                </div>
              </div>
              <div className="p-2.5 border border-[#3B291F] bg-[#140D0B]">
                <div className="text-[10px] font-mono text-[#9E8B72]">TÂM TRÍ</div>
                <div className="font-serif text-xl font-bold text-[#F5E8CE] tabular-nums">
                  {Math.round(gameState.sanity)}%
                </div>
              </div>
              <div className="p-2.5 border border-[#3B291F] bg-[#140D0B]">
                <div className="text-[10px] font-mono text-[#9E8B72]">PHIẾU ĐÃ KÝ</div>
                <div className="font-serif text-xl font-bold text-[#F5E8CE] tabular-nums">
                  {gameState.history.length}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScreenMode('title')}
                className="px-4 py-2 border border-[#4D3628] bg-transparent hover:bg-[#1C120E] text-xs font-mono text-[#C7B69B] cursor-pointer"
              >
                Về Màn Hình Đầu
              </button>
              <button
                type="button"
                data-start="true"
                onClick={() => startGame(1)}
                className="px-5 py-2.5 bg-[#8C1915] hover:bg-[#A6211C] border border-[#D4554E] text-xs font-serif font-bold uppercase tracking-wider text-[#FAF0DC] cursor-pointer"
              >
                Trực Ca Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
