import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertTriangle,
  Flame,
  Hand,
  Headphones,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Skull,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import { MicStatus, TuanTangAudioEngine } from '../utils/tuanTangAudio.ts';
import {
  createInitialTuanTangState,
  findNearestInteractable,
  getZoneLabel,
  HISTORICAL_EPITAPH,
  strikeMatch,
  tickTuanTangSimulation,
  toggleHideOrInteract,
  TuanTangDifficulty,
  TuanTangEndingKind,
  TuanTangGameState,
  TuanTangScreenMode,
} from '../utils/tuanTangEngine.ts';
import {
  mountTuanTangScene,
  TuanTangSceneController,
} from '../utils/tuanTangScene.ts';

interface TuanTangGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
}

function getEndingNarrative(ending: TuanTangEndingKind): {
  title: string;
  subtitle: string;
  body: string;
} {
  switch (ending) {
    case 'desperate_slit':
      return {
        title: 'Khe Đá Quá Hẹp',
        subtitle: 'Cái Kết Tuyệt Vọng · Đỉnh Vòm Địa Cung',
        body: 'Ánh nắng mặt trời rọi chói lòa qua khe thông gió trên đỉnh vòm. Bạn vươn cánh tay bê bết bùn đất ra ngoài cầu cứu — nhưng khe đá chỉ rộng bằng một bàn tay. Phía dưới bóng tối đặc quánh, hàng trăm tiếng thở khò khè đang đồng loạt bò lên.',
      };
    case 'caught_crawler':
      return {
        title: 'Bị Kéo Vào Bóng Tối',
        subtitle: 'Thợ Thủ Công Nhiễm Độc Thủy Ngân',
        body: 'Que diêm lăn lóc tắt lịm trên nền đá lạnh. Những bàn tay gầy guộc đầy vảy trắng cấu xé trong bóng tối cho đến khi tiếng kêu bị bóp nghẹt hoàn toàn.',
      };
    case 'caught_terracotta':
      return {
        title: 'Bức Tượng Mở Mắt',
        subtitle: 'Kẻ Ngụy Trang Trong Lớp Đất Sét',
        body: 'Ngay khi bạn quay lưng đi, tiếng đất sét cọ xát vang lên sau gáy. Đôi mắt người thật mở trừng trừng giữa lớp bùn nung khô — hai bàn tay lạnh ngắt siết chặt cổ họng.',
      };
    case 'trap_crossbow':
      return {
        title: 'Cơ Quan Nỏ Đồng Tần Lăng',
        subtitle: 'Bẫy Chết Người Của Công Tượng',
        body: 'Sợi dây đồng căng ngang mắt cá chân vừa đứt phựt. Hàng loạt mũi tên nỏ ngàn cân phóng ra từ vách đá xuyên thủng bóng tối.',
      };
    case 'mercury_fall':
      return {
        title: 'Chìm Xuống Sông Thủy Ngân',
        subtitle: 'Thủy Ngân Nhân Tạo Địa Cung',
        body: 'Một bước hụt trong bóng tối tuyệt đối đẩy bạn rơi thẳng xuống dòng sông thủy ngân đặc nặng lạnh buốt — thứ kim loại lỏng nuốt chửng hơi thở cuối cùng.',
      };
    case 'suffocated':
      return {
        title: 'Ngạt Thở Trong Tĩnh Lặng',
        subtitle: 'Tự Bịt Miệng Quá Lâu',
        body: 'Để nén cơn ho sặc sụa do ngộ độc thủy ngân, bạn siết chặt hai bàn tay bùn đất lên mũi miệng quá giới hạn — cơ thể gục xuống ngay trước mặt bầy săn mồi.',
      };
    default:
      return {
        title: 'Địa Cung Ly Sơn',
        subtitle: '210 TCN',
        body: HISTORICAL_EPITAPH,
      };
  }
}

export function TuanTangGameSection({
  isFullscreen = false,
  onToggleFullscreen,
}: TuanTangGameSectionProps) {
  const [difficulty, setDifficulty] = useState<TuanTangDifficulty>('explorer');
  const [screenMode, setScreenMode] = useState<TuanTangScreenMode>('title');
  const [gameState, setGameState] = useState<TuanTangGameState>(() =>
    createInitialTuanTangState('explorer')
  );
  const [muted, setMuted] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<MicStatus>('uninitialized');
  const [micThreshold, setMicThreshold] = useState<number>(22);
  const [micGain, setMicGain] = useState<number>(1.15);
  const [micPreviewLevel, setMicPreviewLevel] = useState<number>(0);
  const [pointerLocked, setPointerLocked] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [touchHoldMouth, setTouchHoldMouth] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneCtrlRef = useRef<TuanTangSceneController | null>(null);
  const audioRef = useRef<TuanTangAudioEngine | null>(null);

  const gameStateRef = useRef<TuanTangGameState>(gameState);
  const screenModeRef = useRef<TuanTangScreenMode>(screenMode);
  const micThresholdRef = useRef<number>(micThreshold);
  const micGainRef = useRef<number>(micGain);
  const touchHoldMouthRef = useRef<boolean>(touchHoldMouth);

  gameStateRef.current = gameState;
  screenModeRef.current = screenMode;
  micThresholdRef.current = micThreshold;
  micGainRef.current = micGain;
  touchHoldMouthRef.current = touchHoldMouth;

  // Real-time input ref (never triggers re-renders inside RAF)
  const keysRef = useRef<Set<string>>(new Set());
  const mouseDownLeftRef = useRef<boolean>(false);
  const dragLookRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const touchMoveRef = useRef<{ forward: number; right: number }>({ forward: 0, right: 0 });

  // Initialize audio engine once
  useEffect(() => {
    const audio = new TuanTangAudioEngine();
    audioRef.current = audio;
    return () => {
      audio.dispose();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioRef.current?.setMuted(muted);
  }, [muted]);

  // Mount Three.js scene once
  useEffect(() => {
    if (!canvasMountRef.current) return;
    const ctrl = mountTuanTangScene(canvasMountRef.current, {
      onWebglError: (msg) => setWebglError(msg),
    });
    sceneCtrlRef.current = ctrl;
    ctrl.syncState(gameStateRef.current, false);
    return () => {
      ctrl.dispose();
      sceneCtrlRef.current = null;
    };
  }, []);

  // Sync Three.js scene when React state updates
  useEffect(() => {
    sceneCtrlRef.current?.syncState(gameState, screenMode === 'playing');
  }, [gameState, screenMode]);

  // Mic preview sampler while on title screen
  useEffect(() => {
    if (screenMode !== 'title' || micStatus !== 'active') return;
    const id = window.setInterval(() => {
      const lvl = audioRef.current?.sampleMicLevel(micGainRef.current) ?? 0;
      setMicPreviewLevel(Math.round(lvl));
    }, 65);
    return () => window.clearInterval(id);
  }, [screenMode, micStatus]);

  // Request Microphone permission
  const handleEnableMic = useCallback(async () => {
    const status = await (audioRef.current?.requestMicrophone() ?? Promise.resolve('unsupported' as MicStatus));
    setMicStatus(status);
  }, []);

  const startNewRun = useCallback(
    async (chosenDiff: TuanTangDifficulty, tryMic: boolean) => {
      audioRef.current?.unlock();
      if (tryMic && micStatus !== 'active') {
        const st = await (audioRef.current?.requestMicrophone() ?? Promise.resolve('unsupported' as MicStatus));
        setMicStatus(st);
      }
      const fresh = createInitialTuanTangState(chosenDiff);
      setGameState(fresh);
      gameStateRef.current = fresh;
      setScreenMode('playing');
      screenModeRef.current = 'playing';
      sceneCtrlRef.current?.syncState(fresh, true);
    },
    [micStatus]
  );

  const handleTriggerMatch = useCallback(() => {
    if (screenModeRef.current !== 'playing') return;
    audioRef.current?.unlock();
    setGameState((prev) => {
      const res = strikeMatch(prev);
      if (res.outcome === 'lit' || res.outcome === 'damp_fail' || res.outcome === 'extinguished') {
        audioRef.current?.playMatchStrike(res.outcome);
      }
      return res.next;
    });
  }, []);

  const handleInteract = useCallback(() => {
    if (screenModeRef.current !== 'playing') return;
    audioRef.current?.unlock();
    setGameState((prev) => {
      const res = toggleHideOrInteract(prev);
      if (res.next.ending !== 'none' && prev.ending === 'none') {
        audioRef.current?.playUncutDeathFoley();
        setScreenMode('dying');
      } else if (res.next.sniffEncounterActive && !prev.sniffEncounterActive) {
        const spot = res.next.hidingSpots.find((s) => s.id === res.next.hidingSpotId);
        if (spot) audioRef.current?.playSniffSlit3D(spot.x, 1.0, spot.z);
      }
      return res.next;
    });
  }, []);

  // Pointer Lock tracking
  useEffect(() => {
    const onLockChange = () => {
      const locked = Boolean(
        document.pointerLockElement &&
          canvasMountRef.current &&
          (document.pointerLockElement === canvasMountRef.current ||
            canvasMountRef.current.contains(document.pointerLockElement))
      );
      setPointerLocked(locked);
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  // Keyboard & Mouse controls for First-Person Survival
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      keysRef.current.add(code);

      if (screenModeRef.current === 'playing') {
        if (code === 'KeyF') {
          e.preventDefault();
          handleTriggerMatch();
        } else if (code === 'KeyE') {
          e.preventDefault();
          handleInteract();
        } else if (code === 'KeyP') {
          e.preventDefault();
          if (document.pointerLockElement) document.exitPointerLock?.();
          setScreenMode('paused');
        }
      } else if (screenModeRef.current === 'paused' && code === 'KeyP') {
        e.preventDefault();
        setScreenMode('playing');
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (screenModeRef.current !== 'playing') return;
      const st = gameStateRef.current;
      if (st.ending !== 'none') return;

      let dx = 0;
      let dy = 0;
      if (document.pointerLockElement && canvasMountRef.current?.contains(document.pointerLockElement)) {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      } else if (dragLookRef.current.active) {
        dx = e.clientX - dragLookRef.current.lastX;
        dy = e.clientY - dragLookRef.current.lastY;
        dragLookRef.current.lastX = e.clientX;
        dragLookRef.current.lastY = e.clientY;
      } else {
        return;
      }

      const sens = 0.0024;
      setGameState((prev) => ({
        ...prev,
        yaw: prev.yaw - dx * sens,
        pitch: Math.max(-1.15, Math.min(1.15, prev.pitch - dy * sens)),
      }));
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mouseDownLeftRef.current = false;
        dragLookRef.current.active = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleInteract, handleTriggerMatch]);

  // Main 20Hz Simulation & Spatial Audio Update Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let acc = 0;
    let sniffSoundCooldown = 0;
    let crawlerSoundCooldown = 0;

    const loop = (now: number) => {
      const rawDt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const mode = screenModeRef.current;
      if (mode === 'playing' || mode === 'dying' || mode === 'ending_cutscene') {
        acc += rawDt;
        if (acc >= 0.045) {
          const dt = acc;
          acc = 0;
          sniffSoundCooldown = Math.max(0, sniffSoundCooldown - dt);
          crawlerSoundCooldown = Math.max(0, crawlerSoundCooldown - dt);

          const keys = keysRef.current;
          let moveForward = touchMoveRef.current.forward;
          let moveRight = touchMoveRef.current.right;
          if (keys.has('KeyW') || keys.has('ArrowUp')) moveForward += 1;
          if (keys.has('KeyS') || keys.has('ArrowDown')) moveForward -= 1;
          if (keys.has('KeyD') || keys.has('ArrowRight')) moveRight += 1;
          if (keys.has('KeyA') || keys.has('ArrowLeft')) moveRight -= 1;

          const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
          const crouch = keys.has('KeyC') || keys.has('ControlLeft');
          const manualBreathHold = keys.has('KeyB');
          const holdingMouth = mouseDownLeftRef.current || touchHoldMouthRef.current;
          const micLevel = audioRef.current?.sampleMicLevel(micGainRef.current) ?? 0;

          const cur = gameStateRef.current;
          const { next, events } = tickTuanTangSimulation(cur, {
            dt,
            moveForward: Math.max(-1, Math.min(1, moveForward)),
            moveRight: Math.max(-1, Math.min(1, moveRight)),
            sprint,
            crouch,
            holdingMouth,
            micLevel,
            micThreshold: micThresholdRef.current,
            manualBreathHold,
          });

          // Sync 3D HRTF Audio listener & spatial cues
          const audio = audioRef.current;
          if (audio) {
            audio.setListenerPose(next.playerX, next.playerY + 1.6, next.playerZ, next.yaw, next.pitch);
            const nearMercury = next.zone === 'mercury_canal';
            audio.updateAtmosphere(
              mode === 'playing',
              next.matchLit,
              next.mercuryToxicity,
              next.sniffDangerProgress,
              nearMercury,
              dt
            );

            if (events.footstep) audio.playFootstep(next.crouching, next.sprinting);
            if (events.matchFizzle) audio.playMatchStrike('extinguished');
            if (events.coughBurst) audio.playCough(events.coughSuppressed);
            if (events.coughSuppressed && Math.random() < 0.15) audio.playCough(true);
            if (events.binauralKnock) audio.playBinauralRoomKnock();
            if (events.binauralWhisper) audio.playBinauralWhisper();
            if (events.crossbowTriggered) audio.playCrossbowSnap();

            if (events.clayScrapeBehind) {
              const awakeMimic = next.statues.find((s) => s.isMimic && s.awake);
              if (awakeMimic) audio.playClayScrapeBehind(awakeMimic.x, awakeMimic.z);
            }

            if (next.sniffEncounterActive && sniffSoundCooldown <= 0) {
              const cr = next.crawlers[0];
              if (cr) audio.playSniffSlit3D(cr.x, 1.0, cr.z);
              sniffSoundCooldown = 1.15;
            } else if (!next.sniffEncounterActive && crawlerSoundCooldown <= 0) {
              // Emit 3D spatial crawling foley from closest crawler
              let closest = next.crawlers[0];
              let bestD = 999;
              for (const c of next.crawlers) {
                const d = Math.hypot(c.x - next.playerX, c.z - next.playerZ);
                if (d < bestD) {
                  bestD = d;
                  closest = c;
                }
              }
              if (closest && bestD < 32) {
                audio.playCrawlerScuttle3D(
                  closest.x,
                  closest.y,
                  closest.z,
                  closest.mode === 'hunt' ? 1.0 : 0.6
                );
              }
              crawlerSoundCooldown = closest && closest.mode === 'hunt' ? 0.34 : 0.95;
            }

            // Transition to Uncut Death or Desperate Ending Cutscene
            if (next.ending === 'desperate_slit' && cur.ending === 'none') {
              if (document.pointerLockElement) document.exitPointerLock?.();
              audio.playDesperateEndingSwarm();
              setScreenMode('ending_cutscene');
            } else if (next.ending !== 'none' && cur.ending === 'none') {
              if (document.pointerLockElement) document.exitPointerLock?.();
              audio.playUncutDeathFoley();
              setScreenMode('dying');
            }
          }

          // Finish uncut death / ending cutscenes -> Game Over screen
          if (next.ending === 'desperate_slit' && next.endingTimer >= 6.0) {
            setScreenMode('gameover');
          } else if (next.ending !== 'none' && next.ending !== 'desperate_slit' && next.deathTimer >= 3.6) {
            setScreenMode('gameover');
          }

          setGameState(next);
        }
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const nearestInteract = useMemo(() => findNearestInteractable(gameState), [gameState]);
  const endingCopy = useMemo(() => getEndingNarrative(gameState.ending), [gameState.ending]);

  const handleViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (screenMode !== 'playing') return;
    audioRef.current?.unlock();
    if (e.button === 0) {
      mouseDownLeftRef.current = true;
      dragLookRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      if (!document.pointerLockElement && canvasMountRef.current?.requestPointerLock) {
        try {
          const res = canvasMountRef.current.requestPointerLock() as unknown as Promise<void> | undefined;
          if (res && typeof res.catch === 'function') res.catch(() => {});
        } catch {
          // Ignore pointer lock blocks in restricted iframes; drag-look handles look smoothly
        }
      }
    }
  };

  return (
    <section
      ref={viewportRef}
      id="tuan-tang-section"
      aria-label="Tuẫn Táng: Địa Cung Ly Sơn — Kinh Dị Sinh Tồn Cảm Biến Âm Thanh"
      className={`relative w-full overflow-hidden rounded-2xl border border-[#241b1b] bg-[#040304] text-[#ebe3d8] select-none ${
        isFullscreen ? 'flex-1 min-h-[100dvh] rounded-none border-none' : 'min-h-[600px] h-[78vh] max-h-[820px]'
      }`}
    >
      {/* Dedicated WebGL Mount Container (never unmounted on HUD state updates) */}
      <div
        ref={canvasMountRef}
        onMouseDown={handleViewportMouseDown}
        onTouchStart={(e) => {
          if (screenMode !== 'playing' || e.touches.length === 0) return;
          audioRef.current?.unlock();
          const t = e.touches[0];
          dragLookRef.current = { active: true, lastX: t.clientX, lastY: t.clientY };
        }}
        onTouchMove={(e) => {
          if (screenMode !== 'playing' || !dragLookRef.current.active || e.touches.length === 0) return;
          const t = e.touches[0];
          const dx = t.clientX - dragLookRef.current.lastX;
          const dy = t.clientY - dragLookRef.current.lastY;
          dragLookRef.current.lastX = t.clientX;
          dragLookRef.current.lastY = t.clientY;
          setGameState((prev) => ({
            ...prev,
            yaw: prev.yaw - dx * 0.0055,
            pitch: Math.max(-1.15, Math.min(1.15, prev.pitch - dy * 0.0045)),
          }));
        }}
        onTouchEnd={() => {
          dragLookRef.current.active = false;
        }}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />

      {webglError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#080608] p-6 text-center">
          <Skull className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-sm font-semibold text-red-200">Không thể khởi tạo WebGL 3D</p>
          <p className="text-xs text-stone-400 mt-1 max-w-md">{webglError}</p>
        </div>
      )}

      {/* Blackout / Oxygen Loss Vignette when holding mouth shut too long */}
      {gameState.blackoutWarning > 0 && screenMode === 'playing' && (
        <div
          aria-hidden="true"
          style={{ opacity: Math.min(0.92, gameState.blackoutWarning * 0.9) }}
          className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle,transparent_25%,#000000_85%)]"
        />
      )}

      {/* Uncut First-Person Death Red/Black Vignette */}
      {screenMode === 'dying' && (
        <div
          aria-hidden="true"
          style={{ opacity: Math.min(1, 0.35 + (gameState.deathTimer / 3.6) * 0.65) }}
          className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle,rgba(105,12,12,0.28)_15%,rgba(2,1,2,0.96)_88%)]"
        />
      )}

      {/* Desperate Ending Blinding Sunlight Flash */}
      {screenMode === 'ending_cutscene' && (
        <div
          aria-hidden="true"
          style={{
            opacity: Math.max(0.18, 0.72 - gameState.endingTimer * 0.08),
          }}
          className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_top,rgba(255,244,210,0.85)_0%,rgba(255,220,160,0.18)_45%,transparent_80%)]"
        />
      )}

      {/* TopMinimal Utility Bar (No backdrop-blur over WebGL) */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-[#0b090b]/90 border border-[#2d2323] px-3 py-1.5">
          <span className="font-display text-sm sm:text-base font-bold tracking-wide text-amber-100 whitespace-nowrap">
            TUẪN TÁNG: ĐỊA CUNG LY SƠN
          </span>
          <span className="hidden md:inline text-xs text-stone-400">·</span>
          <span className="hidden md:inline text-xs text-stone-300 truncate max-w-[260px]">
            {getZoneLabel(gameState.zone)}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Bật âm thanh 3D' : 'Tắt âm thanh'}
            className="min-h-[38px] px-2.5 rounded-lg bg-[#0b090b]/90 border border-[#2d2323] hover:border-amber-600/60 text-stone-200 flex items-center gap-1.5 text-xs cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            <span className="hidden sm:inline whitespace-nowrap">{muted ? 'Đang tắt tiếng' : '3D Audio'}</span>
          </button>

          {screenMode === 'playing' && (
            <button
              type="button"
              onClick={() => {
                if (document.pointerLockElement) document.exitPointerLock?.();
                setScreenMode('paused');
              }}
              aria-label="Tạm dừng"
              className="min-h-[38px] px-2.5 rounded-lg bg-[#0b090b]/90 border border-[#2d2323] hover:border-amber-600/60 text-stone-200 flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Tạm dừng [P]</span>
            </button>
          )}

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              className="min-h-[38px] px-2.5 rounded-lg bg-[#0b090b]/90 border border-[#2d2323] hover:border-amber-600/60 text-stone-200 flex items-center gap-1.5 text-xs cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* PLAYING HUD */}
      {screenMode === 'playing' && (
        <>
          {/* Center Crosshair & Contextual Prompt */}
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-200/70" />

            {/* Whisper Hallucination Caption */}
            {gameState.lastWhisperText && (
              <p className="mt-6 font-display italic text-lg sm:text-xl text-red-200/90 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                "{gameState.lastWhisperText}"
              </p>
            )}

            {/* Hiding Sniff Encounter Alert */}
            {gameState.hidingSpotId && gameState.sniffEncounterActive && (
              <div className="mt-5 w-[min(90vw,400px)] rounded-xl bg-[#160707]/95 border border-red-700/80 px-4 py-3 text-center">
                <p className="text-xs font-bold tracking-wider uppercase text-red-300">
                  Sinh vật đang ghé mặt sát khe hở
                </p>
                <p className="text-sm font-semibold text-white mt-1">
                  {micStatus === 'active'
                    ? 'NÍM THỞ NGOÀI ĐỜI THẬT! Không phát ra bất kỳ tiếng động nào!'
                    : 'GIỮ PHÍM [B] HOẶC CHUỘT TRÁI ĐỂ NÍN THỞ!'}
                </p>
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono tabular-nums text-stone-300">
                    <span>Âm thanh Mic: {Math.round(gameState.micNoiseLevel)} / {micThreshold} dB</span>
                    <span>Còn {gameState.sniffRemainingSec.toFixed(1)}s</span>
                  </div>
                  <div className="h-2 w-full rounded bg-stone-900 overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-75"
                      style={{ width: `${Math.min(100, gameState.sniffDangerProgress)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Coughing Emergency Alert */}
            {gameState.coughActive && !gameState.holdingMouth && (
              <div className="mt-4 rounded-lg bg-[#240a08]/95 border border-amber-500/80 px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cơn ho thủy ngân! GIỮ CHUỘT TRÁI để bịt miệng ngay!</span>
              </div>
            )}

            {/* Nearby Interaction Prompt */}
            {!gameState.sniffEncounterActive && nearestInteract && (
              <div className="mt-10 rounded-lg bg-[#0b090b]/92 border border-amber-700/60 px-3.5 py-1.5 text-xs font-medium text-amber-100">
                {nearestInteract.kind === 'hiding_spot'
                  ? gameState.hidingSpotId
                    ? `[E] Bước ra khỏi ${nearestInteract.spot.label}`
                    : `[E] Chui vào trốn trong ${nearestInteract.spot.label}`
                  : nearestInteract.kind === 'match_pickup'
                    ? `[E] Nhặt +${nearestInteract.pickup.count} que diêm khô`
                    : `[E] Leo vách đá lên khe thông gió (${Math.round(gameState.climbProgress)}%)`}
              </div>
            )}
          </div>

          {/* Bottom-Left Compact Vitals & Live Microphone Gauge */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 flex flex-col gap-2 max-w-[290px]">
            <div className="rounded-xl bg-[#0b090b]/92 border border-[#2d2323] p-3 space-y-2 text-xs">
              {/* Matches & Flame Fuse */}
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-amber-200 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Diêm ẩm:</span>
                  <span className="font-mono tabular-nums text-white">{gameState.matchesRemaining}</span>
                </span>
                {gameState.matchLit ? (
                  <span className="font-mono tabular-nums text-[11px] text-amber-300">
                    Cháy {gameState.matchTimer.toFixed(1)}s
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">[F] Quẹt diêm</span>
                )}
              </div>

              {/* Mercury Toxicity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-stone-300">
                  <span>Nhiễm độc thủy ngân</span>
                  <span className="font-mono tabular-nums">{Math.round(gameState.mercuryToxicity)}%</span>
                </div>
                <div className="h-1.5 w-full rounded bg-stone-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-400 transition-all duration-150"
                    style={{ width: `${gameState.mercuryToxicity}%` }}
                  />
                </div>
              </div>

              {/* Oxygen (when clamping hands over mouth) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-stone-300">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3 text-sky-400" />
                    <span>{gameState.holdingMouth ? 'Đang bịt miệng (Giữ LMB)' : 'Dưỡng khí'}</span>
                  </span>
                  <span className="font-mono tabular-nums">{Math.round(gameState.oxygen)}%</span>
                </div>
                <div className="h-1.5 w-full rounded bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      gameState.oxygen < 30 ? 'bg-red-500' : 'bg-sky-400'
                    }`}
                    style={{ width: `${gameState.oxygen}%` }}
                  />
                </div>
              </div>

              {/* Live Microphone / Acoustic Noise Meter */}
              <div className="space-y-1 pt-0.5 border-t border-stone-800/80">
                <div className="flex justify-between items-center text-[11px] text-stone-300">
                  <span className="flex items-center gap-1">
                    {micStatus === 'active' ? (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-stone-500" />
                    )}
                    <span>{micStatus === 'active' ? 'Mic trực tiếp' : 'Tiếng động'}</span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {Math.round(micStatus === 'active' ? gameState.micNoiseLevel : gameState.emittedNoise)} / {micThreshold}
                  </span>
                </div>
                <div className="relative h-1.5 w-full rounded bg-stone-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      gameState.micNoiseLevel > micThreshold ? 'bg-red-500' : 'bg-amber-300'
                    }`}
                    style={{
                      width: `${Math.min(100, micStatus === 'active' ? gameState.micNoiseLevel : gameState.emittedNoise)}%`,
                    }}
                  />
                  {/* Threshold marker */}
                  <div
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 w-0.5 bg-white/80"
                    style={{ left: `${micThreshold}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quiet Status Log */}
            <p className="rounded-lg bg-[#0b090b]/88 border border-[#241c1c] px-2.5 py-1.5 text-[11px] text-stone-300 leading-snug">
              {gameState.statusNote}
            </p>
          </div>

          {/* Bottom-Right Touch & Quick Action Bar (also aids mouse/mobile players) */}
          <div className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2">
            {/* Compact Desktop Key Guide + Clickable Action Buttons */}
            <div className="flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                onClick={handleTriggerMatch}
                className="min-h-[42px] px-3 rounded-lg bg-[#1c1109]/95 border border-amber-700/70 hover:border-amber-500 text-amber-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{gameState.matchLit ? 'Thổi diêm [F]' : 'Quẹt diêm [F]'}</span>
              </button>

              <button
                type="button"
                onPointerDown={() => setTouchHoldMouth(true)}
                onPointerUp={() => setTouchHoldMouth(false)}
                onPointerLeave={() => setTouchHoldMouth(false)}
                className={`min-h-[42px] px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                  gameState.holdingMouth
                    ? 'bg-red-950/95 border-red-500 text-red-100'
                    : 'bg-[#120d0d]/95 border-[#382828] hover:border-amber-600 text-stone-200'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Bịt miệng [Giữ LMB]</span>
              </button>

              {nearestInteract && (
                <button
                  type="button"
                  onClick={handleInteract}
                  className="min-h-[42px] px-3 rounded-lg bg-[#142018]/95 border border-emerald-600/70 text-emerald-100 text-xs font-semibold cursor-pointer"
                >
                  {gameState.hidingSpotId ? 'Ra ngoài [E]' : 'Tương tác [E]'}
                </button>
              )}
            </div>

            {/* Compact Mobile Touch Movement Pad */}
            <div className="flex sm:hidden items-center gap-1.5 bg-[#0b090b]/90 border border-[#2d2323] rounded-xl p-1.5">
              <button
                type="button"
                aria-label="Lùi"
                onPointerDown={() => { touchMoveRef.current.forward = -1; }}
                onPointerUp={() => { touchMoveRef.current.forward = 0; }}
                onPointerLeave={() => { touchMoveRef.current.forward = 0; }}
                className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-700 text-xs font-bold"
              >
                ↓
              </button>
              <button
                type="button"
                aria-label="Tiến"
                onPointerDown={() => { touchMoveRef.current.forward = 1; }}
                onPointerUp={() => { touchMoveRef.current.forward = 0; }}
                onPointerLeave={() => { touchMoveRef.current.forward = 0; }}
                className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-700 text-xs font-bold"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Sang trái"
                onPointerDown={() => { touchMoveRef.current.right = -1; }}
                onPointerUp={() => { touchMoveRef.current.right = 0; }}
                onPointerLeave={() => { touchMoveRef.current.right = 0; }}
                className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-700 text-xs font-bold"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Sang phải"
                onPointerDown={() => { touchMoveRef.current.right = 1; }}
                onPointerUp={() => { touchMoveRef.current.right = 0; }}
                onPointerLeave={() => { touchMoveRef.current.right = 0; }}
                className="w-11 h-11 rounded-lg bg-stone-900 border border-stone-700 text-xs font-bold"
              >
                →
              </button>
            </div>

            <p className="hidden sm:block text-[11px] text-stone-400 bg-[#0b090b]/85 px-2.5 py-1 rounded border border-[#241c1c]">
              {pointerLocked
                ? 'WASD Di chuyển · Shift Chạy · C Cúi tránh nỏ · F Diêm · E Trốn/Leo · Giữ Chuột Trái Bịt Miệng'
                : 'Nhấp màn hình để khóa chuột xoay góc nhìn · WASD · C Cúi · F Diêm · E Trốn · Giữ LMB Bịt Miệng'}
            </p>
          </div>
        </>
      )}

      {/* UNCUT FIRST-PERSON DEATH SUBTITLE */}
      {screenMode === 'dying' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center px-4">
          <p className="rounded-lg bg-[#0d0404]/90 border border-red-900/60 px-4 py-2 text-sm text-red-200 font-medium text-center max-w-lg">
            {gameState.statusNote}
          </p>
        </div>
      )}

      {/* DESPERATE ENDING SUBTITLE */}
      {screenMode === 'ending_cutscene' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center px-4">
          <div className="rounded-xl bg-[#090807]/92 border border-amber-600/50 px-5 py-3 text-center max-w-xl">
            <p className="font-display text-lg text-amber-100 font-semibold">
              Khe đá trên đỉnh vòm quá hẹp không thể chui lọt...
            </p>
            <p className="text-xs text-stone-300 mt-1">
              Phía dưới bóng tối, hàng trăm tiếng thở khò khè đang đồng loạt bò lên.
            </p>
          </div>
        </div>
      )}

      {/* TITLE / SENSORY CALIBRATION OVERLAY */}
      {screenMode === 'title' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#060405]/92 p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[#3a2522] bg-[#0e0a0b] p-5 sm:p-7 space-y-5 shadow-2xl">
            <div className="space-y-2 border-b border-[#291b19] pb-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-400/90 font-medium">
                <span>Năm 210 TCN</span>
                <span aria-hidden="true">·</span>
                <span>Lăng Mộ Tần Thủy Hoàng</span>
                <span aria-hidden="true">·</span>
                <span>Kinh Dị Giác Quan WebGL</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-amber-50 tracking-tight">
                TUẪN TÁNG: ĐỊA CUNG LY SƠN <span className="text-red-500/90 font-normal">(殉葬)</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Cánh cửa đá ngàn cân vừa sập xuống. Dưới những dòng sông thủy ngân chảy ngầm, đám thợ thủ công bị chôn sống đã hóa điên, mù lòa và săn mồi theo tiếng thở. Leo lên đỉnh vòm khe thông gió trước khi bóng tối nuốt chửng bạn.
              </p>
            </div>

            {/* Hardware Sensory Setup: Headphones + Microphone Breath-Hold Calibration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#2d2120] bg-[#140e0f] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-100">
                    <Mic className="w-4 h-4 text-red-400" />
                    <span>Cảm biến Microphone (Nín thở thật)</span>
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">
                    {micStatus === 'active'
                      ? 'Đã bật'
                      : micStatus === 'denied'
                        ? 'Đã từ chối'
                        : 'Chưa bật'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Khi trốn trong quan tài đá, chỉ cần tiếng thở hắt hay nuốt nước bọt qua Mic vượt ngưỡng, quái vật sẽ lôi cổ bạn ra.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEnableMic}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-900/70 hover:bg-red-800 border border-red-600/60 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                  >
                    {micStatus === 'active' ? 'Mic đang hoạt động' : 'Cấp quyền Microphone'}
                  </button>
                  <div className="flex-1 h-2 rounded bg-stone-900 overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-75 ${
                        micPreviewLevel > micThreshold ? 'bg-red-500' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, micPreviewLevel)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white"
                      style={{ left: `${micThreshold}%` }}
                    />
                  </div>
                </div>

                <label className="block space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Ngưỡng nhạy phát hiện tiếng thở</span>
                    <span className="font-mono tabular-nums">{micThreshold} dB</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={60}
                    value={micThreshold}
                    onChange={(e) => setMicThreshold(Number(e.target.value))}
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </label>

                <label className="block space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-400">
                    <span>Khuếch đại Mic đầu vào</span>
                    <span className="font-mono tabular-nums">×{micGain.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.05}
                    value={micGain}
                    onChange={(e) => setMicGain(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-[#2d2120] bg-[#140e0f] p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-100">
                  <Headphones className="w-4 h-4 text-amber-400" />
                  <span>Cơ chế sinh tồn 95% Bóng Tối</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-stone-300 leading-relaxed">
                  <li>· <strong>[F] Que diêm ẩm:</strong> Chỉ sáng 6.5s để soi bẫy nỏ &amp; sông thủy ngân, nhưng tiếng quẹt gọi quái vật trong 50m lao tới.</li>
                  <li>· <strong>[Giữ Chuột Trái] Tự bịt miệng:</strong> Nén cơn ho do ngộ độc thủy ngân nhưng cẩn thận ngạt thở.</li>
                  <li>· <strong>Binh Mã Dũng sống:</strong> Không được quay lưng quá lâu trong bóng tối — tượng sẽ dịch sát sau gáy bạn.</li>
                  <li>· <strong>Tai nghe Binaural 3D:</strong> Đeo tai nghe để phân biệt tiếng bò trên trần và ảo giác gõ cửa sau lưng.</li>
                </ul>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDifficulty('explorer')}
                    className={`flex-1 min-h-[38px] px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      difficulty === 'explorer'
                        ? 'bg-amber-900/60 border-amber-500 text-amber-100'
                        : 'bg-stone-900 border-stone-700 text-stone-400'
                    }`}
                  >
                    Chuẩn (9 Diêm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDifficulty('nightmare')}
                    className={`flex-1 min-h-[38px] px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      difficulty === 'nightmare'
                        ? 'bg-red-950 border-red-500 text-red-100'
                        : 'bg-stone-900 border-stone-700 text-stone-400'
                    }`}
                  >
                    Tuyệt Vọng (6 Diêm)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-[11px] italic text-stone-400 max-w-md">
                "Không một ai thoát ra." — Sử Ký Tư Mã Thiên
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void startNewRun(difficulty, false)}
                  className="min-h-[42px] px-4 rounded-xl border border-stone-700 bg-stone-900 hover:border-stone-500 text-xs font-semibold text-stone-200 cursor-pointer"
                >
                  Chơi không Mic ([B] nín thở)
                </button>
                <button
                  type="button"
                  onClick={() => void startNewRun(difficulty, true)}
                  className="min-h-[42px] px-5 rounded-xl bg-red-800 hover:bg-red-700 border border-red-500 text-sm font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Bước Vào Địa Cung</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED OVERLAY */}
      {screenMode === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#060405]/88 p-6">
          <div className="w-full max-w-sm rounded-2xl border border-[#3a2522] bg-[#0e0a0b] p-6 text-center space-y-4">
            <h3 className="font-display text-2xl font-bold text-amber-100">Tạm Ngừng Trong Bóng Tối</h3>
            <p className="text-xs text-stone-400">
              Vị trí hiện tại: {getZoneLabel(gameState.zone)} · Còn {gameState.matchesRemaining} que diêm
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setScreenMode('playing')}
                className="min-h-[42px] rounded-xl bg-amber-800 hover:bg-amber-700 text-sm font-bold text-white cursor-pointer"
              >
                Tiếp tục sinh tồn [P]
              </button>
              <button
                type="button"
                onClick={() => setScreenMode('title')}
                className="min-h-[40px] rounded-xl border border-stone-700 bg-stone-900 hover:border-stone-500 text-xs font-semibold text-stone-300 cursor-pointer"
              >
                Quay lại màn hình chính
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER / HISTORICAL CHRONICLE OVERLAY (ONLY AFTER UNCUT 3D SEQUENCE) */}
      {screenMode === 'gameover' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#030203]/96 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-[#422220] bg-[#0c0809] p-6 sm:p-8 text-center space-y-4">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-red-400">
              {endingCopy.subtitle}
            </p>
            <h3 className="font-display text-3xl sm:text-4xl font-bold text-amber-50">
              {endingCopy.title}
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed">{endingCopy.body}</p>
            <p className="text-[11px] italic text-stone-500 border-t border-[#281a19] pt-3">
              {HISTORICAL_EPITAPH}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => void startNewRun(difficulty, micStatus === 'active')}
                className="min-h-[42px] px-5 rounded-xl bg-red-800 hover:bg-red-700 border border-red-500 text-sm font-bold text-white flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử Lại Địa Cung</span>
              </button>
              <button
                type="button"
                onClick={() => setScreenMode('title')}
                className="min-h-[42px] px-4 rounded-xl border border-stone-700 bg-stone-900 hover:border-stone-500 text-xs font-semibold text-stone-200 cursor-pointer"
              >
                Cấu hình Mic &amp; Độ khó
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
