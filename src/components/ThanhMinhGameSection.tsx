import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Compass,
  Eye,
  Flame,
  Ghost,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import { ThanhMinhAudioEngine } from '../utils/thanhMinhAudio.ts';
import { ThanhMinhCanvasRenderer } from '../utils/thanhMinhCanvas.ts';
import {
  answerInterrogationStep,
  createInitialThanhMinhState,
  EndingId,
  findNearbyHotspot,
  getCurrentObjectiveHint,
  interactWithHotspot,
  INVENTORY_ITEMS,
  SCENE_META,
  setRadioFrequency,
  STORY_LORE_ENTRIES,
  submitWuxingElement,
  swapPuppetSlots,
  type ThanhMinhScreenMode,
  type ThanhMinhState,
  tickThanhMinhSimulation,
  toggleRealmShift,
  TRUTH_KEEPSAKES,
} from '../utils/thanhMinhEngine.ts';

interface ThanhMinhGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
}

const CHARACTER_DOSSIER = [
  {
    name: 'Lâm Tĩnh (17 tuổi)',
    role: 'Học sinh nội trú',
    desc: 'Xuất thân từ gia đình trí thức bị quy là thành phần xấu. Vì sợ hãi, tự ti và ghen tị trong âm thầm mà trượt dài vào đêm phản bội năm 1967.',
  },
  {
    name: 'Thầy Trần Mặc (34 tuổi)',
    role: 'Giáo viên dạy Văn',
    desc: 'Lén lập nhóm đọc thơ cổ & văn học bị cấm, lặng lẽ che chở Lâm Tĩnh nhưng lại bị học trò nghi kỵ. Trước cơn cuồng nộ của sân trường vẫn giữ trọn lòng bao dung.',
  },
  {
    name: 'Tô Dao (17 tuổi)',
    role: 'Bạn thân nhất',
    desc: 'Thẳng thắn, nhân hậu. Đan dở chiếc khăn hoa mai cho sinh nhật bạn và âm thầm đốt trang sổ có tên Lâm Tĩnh trong phòng biệt giam để cứu cô.',
  },
  {
    name: 'Trương Vệ Quốc (18 tuổi)',
    role: 'Đội trưởng tự vệ',
    desc: 'Cuồng tín và tàn nhẫn. Dùng lệnh bắt cha mẹ giả để bẫy Lâm Tĩnh phản bội thầy bạn, trước khi trở thành oan hồn bị treo ngược nơi cột cờ.',
  },
  {
    name: 'Tô Viễn (1986)',
    role: 'Em trai Tô Dao',
    desc: 'Hai mươi năm sau biến cố, anh vẫn lên đỉnh Cô Sơn dâng hoa cúc trắng mỗi tiết Thanh Minh, tìm trang sự thật cuối cùng minh oan cho chị và Thầy Trần.',
  },
] as const;

const PUPPET_SCENES: readonly { id: number; roman: string; title: string; detail: string }[] = [
  {
    id: 0,
    roman: 'I',
    title: 'Lời Thì Thầm Ngoài Khe Cửa',
    detail: 'Lâm Tĩnh nghe lén Thầy Trần chuẩn bị giấy trốn cho Tô Dao, rồi giao danh sách cho Trương Vệ Quốc.',
  },
  {
    id: 1,
    roman: 'II',
    title: 'Quỳ Trên Thủy Tinh Vỡ',
    detail: 'Thầy Trần Mặc bị lôi ra giữa sân trường đấu tố, máu nhuộm đỏ nền gạch mưa bão.',
  },
  {
    id: 2,
    roman: 'III',
    title: 'Ngọn Lửa Trong Biệt Giam',
    detail: 'Tô Dao bị bắt giam nhưng vẫn kịp đốt trang sổ có tên Lâm Tĩnh để cứu bạn.',
  },
  {
    id: 3,
    roman: 'IV',
    title: 'Cái Tát Trong Cơn Ám Ảnh',
    detail: 'Để che giấu sự hèn nhát của mình, Lâm Tĩnh hoảng loạn tát Thầy Trần trước đám đông.',
  },
];

const INTERROGATION_PROMPTS = [
  {
    step: 0,
    echo: 'Thầy Trần Mặc khẽ đặt cây bút máy xuống bàn: “Thầy biết em sợ hãi...”',
    question: 'Hồi I — Vì sao danh sách nhóm đọc sách bị cấm lại rơi vào tay đội tự vệ Trương Vệ Quốc?',
    honestLabel: 'Chính tôi đã lén giao nộp danh sách ấy vì sợ hãi và ghen tuông.',
    denialLabel: 'Tôi bị ép buộc! Hoàn cảnh lúc đó ai cũng làm vậy, không phải lỗi của tôi!',
  },
  {
    step: 1,
    echo: 'Tô Dao siết nhẹ chiếc khăn len hoa mai chưa đan xong: “Tĩnh, tớ chưa từng trách cậu...”',
    question: 'Hồi II — Khi Thầy Trần Mặc bị ép quỳ trên mảnh thủy tinh và Tô Dao bị tra tấn, ngươi đã đứng ở đâu?',
    honestLabel: 'Tôi đứng nhìn trong im lặng, tự dối lòng để trốn chạy khỏi tội lỗi.',
    denialLabel: 'Tôi cũng là nạn nhân của gia đình bị bắt bớ! Tôi vô can!',
  },
  {
    step: 2,
    echo: 'Tô Viễn (1986) lặng lẽ mở cuốn sổ còn thiếu trang cuối dưới ánh bình minh xa xăm...',
    question: 'Hồi III — Đêm Tiết Thanh Minh trên tầng thượng năm 1967, sự thật cuối cùng ngươi chọn đối diện là gì?',
    honestLabel: 'Tôi thừa nhận tội phản bội thầy và bạn. Xin đừng xóa nhòa nỗi oan của họ thêm nữa.',
    denialLabel: 'Hãy cho tôi quên hết đêm mưa này và quay lại Lớp 12B như chưa từng có gì xảy ra.',
  },
] as const;

function getEndingInfo(ending: EndingId): {
  tag: string;
  title: string;
  summary: string;
  epilogue: string;
  accentClass: string;
} {
  switch (ending) {
    case 'ending_4_dawn_coson':
      return {
        tag: 'TRUE ENDING · BÌNH MINH CÔ SƠN (4/4)',
        title: 'Bình Minh Cô Sơn — Minh Oan Năm 1986',
        summary:
          'Bạn đã thu thập trọn vẹn 100% Kỷ vật Sự Thật, giải mã tần số bí mật 109.2 MHz, giữ vững tỉnh táo và thẳng thắn đối diện tội lỗi.',
        epilogue:
          'Trong ánh nắng sớm, linh hồn Thầy Trần Mặc và Tô Dao hiền hòa khoác lên vai Lâm Tĩnh chiếc áo đồng phục cũ. Năm 1986, em trai Tô Dao lên đống đổ nát Cô Sơn tìm thấy cuốn sổ ghi sự thật, minh oan cho thầy và chị.',
        accentClass: 'text-amber-300 border-amber-500/40 bg-amber-950/35',
      };
    case 'ending_3_late_qingming':
      return {
        tag: 'NORMAL ENDING · TIẾT THANH MINH MUỘN (3/4)',
        title: 'Tiết Thanh Minh Muộn',
        summary:
          'Bạn dám nhận tội trước phiên tòa linh hồn nhưng vẫn còn bỏ lỡ kỷ vật sự thật hoặc chưa giải mã tần số bí mật 109.2 MHz ở Hồi 3.',
        epilogue:
          'Sương mù dần tan lúc bình minh. Trước hai ngôi mộ đất vô danh trong rừng thông sau núi, Lâm Tĩnh đốt xấp vàng mã tạ lỗi rồi lặng lẽ tan biến vào nắng sớm.',
        accentClass: 'text-sky-300 border-sky-500/40 bg-sky-950/35',
      };
    case 'ending_2_ashes':
      return {
        tag: 'BAD ENDING · TRO TÀN HÈN NHÁT (2/4)',
        title: 'Tro Tàn Hèn Nhát',
        summary:
          'Bạn nhận tội nhưng mảnh ký ức quá rời rạc (<50% kỷ vật) hoặc tâm trí đã sụp đổ quá nhiều lần trước Vong hồn.',
        epilogue:
          'Không đủ can đảm sống tiếp với sự thật, linh hồn Lâm Tĩnh tự thiêu rụi cùng ngôi trường hoang tàn, để lại những tiếng khóc oán hận vọng mãi trong tro tàn.',
        accentClass: 'text-orange-300 border-orange-500/40 bg-orange-950/35',
      };
    default:
      return {
        tag: 'BAD ENDING · KẺ VÔ CAN (1/4)',
        title: 'Kẻ Vô Can — Vòng Lặp Vô Tận',
        summary:
          'Bạn đã chọn chối bỏ tội lỗi và đổ thừa cho hoàn cảnh trong Phòng Thẩm Vấn Cuối Cùng.',
        epilogue:
          'Bóng ma đối diện mỉm cười lạnh lẽo. Mọi cánh cửa biến mất, tiếng còi báo động hú vang... Vòng lặp đêm mưa bão 1967 lại khởi động từ Lớp học 12B.',
        accentClass: 'text-rose-300 border-rose-500/40 bg-rose-950/35',
      };
  }
}

export function ThanhMinhGameSection({
  isFullscreen = false,
  onToggleFullscreen,
  onExitFullscreen,
}: ThanhMinhGameSectionProps) {
  const [screenMode, setScreenMode] = useState<ThanhMinhScreenMode>('title');
  const [hudState, setHudState] = useState<ThanhMinhState>(() => createInitialThanhMinhState(1));
  const [muted, setMuted] = useState(false);
  const [selectedPuppetSlot, setSelectedPuppetSlot] = useState<number | null>(null);
  const [showObjectiveHint, setShowObjectiveHint] = useState(false);
  const [journalTab, setJournalTab] = useState<'keepsakes' | 'lore'>('keepsakes');

  const stateRef = useRef<ThanhMinhState>(hudState);
  const lastHudSyncRef = useRef<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<ThanhMinhAudioEngine | null>(null);
  const rendererRef = useRef<ThanhMinhCanvasRenderer | null>(null);
  const keysRef = useRef<{ left: boolean; right: boolean; breath: boolean }>({
    left: false,
    right: false,
    breath: false,
  });

  if (!audioRef.current) audioRef.current = new ThanhMinhAudioEngine();
  if (!rendererRef.current) rendererRef.current = new ThanhMinhCanvasRenderer();

  const commitState = useCallback((next: ThanhMinhState) => {
    stateRef.current = next;
    setHudState(next);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const startGame = useCallback(
    (loopCount = 1) => {
      audioRef.current?.unlock();
      const fresh = createInitialThanhMinhState(loopCount);
      setSelectedPuppetSlot(null);
      setShowObjectiveHint(false);
      commitState(fresh);
      setScreenMode('playing');
    },
    [commitState]
  );

  const triggerInteract = useCallback(() => {
    audioRef.current?.unlock();
    const prev = stateRef.current;
    const next = interactWithHotspot(prev);
    if (next.flags.saw_20_years_ruin && !prev.flags.saw_20_years_ruin) {
      audioRef.current?.playMirrorCrack();
      rendererRef.current?.triggerShake(7);
    }
    commitState(next);
  }, [commitState]);

  const triggerRealmShift = useCallback(() => {
    audioRef.current?.unlock();
    const res = toggleRealmShift(stateRef.current);
    if (res.shifted) {
      audioRef.current?.playRealmShift(res.next.realm);
      rendererRef.current?.triggerShake(4.5);
    }
    commitState(res.next);
  }, [commitState]);

  const toggleJournal = useCallback(() => {
    const prev = stateRef.current;
    commitState({
      ...prev,
      activeModal: prev.activeModal === 'journal' ? 'none' : 'journal',
    });
  }, [commitState]);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenMode !== 'playing') return;
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        keysRef.current.left = true;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        keysRef.current.right = true;
      } else if (code === 'Space') {
        e.preventDefault();
        keysRef.current.breath = true;
      } else if (code === 'KeyE') {
        e.preventDefault();
        triggerInteract();
      } else if (code === 'KeyQ') {
        e.preventDefault();
        triggerRealmShift();
      } else if (code === 'KeyJ') {
        e.preventDefault();
        toggleJournal();
      } else if (code === 'Escape') {
        if (stateRef.current.activeModal !== 'none') {
          commitState({ ...stateRef.current, activeModal: 'none', activeHotspotId: null });
        } else if (!isFullscreen) {
          setScreenMode('paused');
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        keysRef.current.left = false;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        keysRef.current.right = false;
      } else if (code === 'Space') {
        keysRef.current.breath = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screenMode, isFullscreen, triggerInteract, triggerRealmShift, toggleJournal, commitState]);

  // Locked 60fps Canvas Loop with throttled (~12Hz) React HUD sync to eliminate React frame jitter
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let ghostWhisperCooldown = 0;

    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      ghostWhisperCooldown = Math.max(0, ghostWhisperCooldown - dt);

      const cur = stateRef.current;

      if (screenMode === 'playing' || screenMode === 'ending_cutscene') {
        const moveDir: -1 | 0 | 1 =
          keysRef.current.left && !keysRef.current.right
            ? -1
            : keysRef.current.right && !keysRef.current.left
              ? 1
              : 0;

        const { next, events } = tickThanhMinhSimulation(cur, {
          dt,
          moveDir,
          holdingBreath: keysRef.current.breath,
        });

        if (events.footstep) {
          audioRef.current?.playFootstep(next.holdingBreath, next.scene === 'flooded_courtyard');
        }
        if (events.gasped) {
          audioRef.current?.playGasp();
          rendererRef.current?.triggerShake(6);
        }
        if (events.ghostAlerted && ghostWhisperCooldown <= 0) {
          audioRef.current?.playGhostWhisper();
          rendererRef.current?.triggerShake(5);
          ghostWhisperCooldown = 1.6;
        }
        if (events.killedByGhostKind) {
          audioRef.current?.playKillAnimationAudio(events.killedByGhostKind);
          rendererRef.current?.triggerShake(14);
        } else if (events.sanityCollapsed) {
          audioRef.current?.playMirrorCrack();
          rendererRef.current?.triggerShake(10);
        }

        if (next.ending !== 'none' && screenMode === 'playing') {
          setScreenMode('ending_cutscene');
          if (next.ending === 'ending_1_loop') audioRef.current?.playSiren();
          else if (next.ending === 'ending_2_ashes') audioRef.current?.playFireCrackle();
          else audioRef.current?.playDawnChord();
        }

        if (next.ending !== 'none' && next.endingTimer >= 4.2 && screenMode === 'ending_cutscene') {
          setScreenMode('gameover');
        }

        stateRef.current = next;

        // Immediate React HUD sync on discrete state changes; throttled 85ms otherwise
        const discreteChange =
          next.scene !== cur.scene ||
          next.realm !== cur.realm ||
          next.holdingBreath !== cur.holdingBreath ||
          next.subtitleText !== cur.subtitleText ||
          next.ending !== cur.ending ||
          Boolean(next.deathCutscene?.active) !== Boolean(cur.deathCutscene?.active) ||
          next.sanityBottomCount !== cur.sanityBottomCount ||
          Math.abs(next.playerX - cur.playerX) > 22;

        if (discreteChange || now - lastHudSyncRef.current >= 85) {
          lastHudSyncRef.current = now;
          setHudState(next);
        }

        audioRef.current?.update(
          screenMode === 'playing',
          next.realm,
          next.holdingBreath,
          next.gazeExposure,
          next.radioTunedAct2,
          dt,
          next.scene === 'flooded_courtyard'
        );
      } else {
        audioRef.current?.update(false, cur.realm, false, 0, false, dt);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          rendererRef.current?.render(
            ctx,
            canvas.width,
            canvas.height,
            stateRef.current,
            now / 1000,
            dt
          );
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [screenMode]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.dispose();
    };
  }, []);

  const sceneMeta = SCENE_META[hudState.scene];
  const nearbyHotspot = useMemo(() => findNearbyHotspot(hudState), [hudState]);
  const keepsakePct = Math.round(
    (hudState.collectedKeepsakeIds.length / TRUTH_KEEPSAKES.length) * 100
  );
  const currentObjective = useMemo(() => getCurrentObjectiveHint(hudState), [hudState]);

  const handleWuxingPick = (el: 'Kim' | 'Thủy' | 'Hỏa') => {
    audioRef.current?.unlock();
    const res = submitWuxingElement(stateRef.current, el);
    if (res.solved) {
      audioRef.current?.playAltarChime();
      audioRef.current?.playFireCrackle();
    } else if (res.reset) {
      audioRef.current?.playGasp();
      rendererRef.current?.triggerShake(6);
    }
    commitState(res.next);
  };

  const handleRadioChange = (nextFreq: number) => {
    audioRef.current?.unlock();
    const cur = stateRef.current;
    const target = cur.act <= 2 ? 104.7 : 109.2;
    const closeness = Math.max(0, 1 - Math.abs(nextFreq - target) / 4);
    audioRef.current?.playRadioStaticStep(closeness);

    const updated = setRadioFrequency(cur, nextFreq);
    if (
      (updated.radioTunedAct2 && !cur.radioTunedAct2) ||
      (updated.radioSecretAct3Solved && !cur.radioSecretAct3Solved)
    ) {
      audioRef.current?.playRealmShift('yin');
      audioRef.current?.playAltarChime();
      rendererRef.current?.triggerShake(4);
    }
    commitState(updated);
  };

  const handlePuppetClick = (slotIdx: number) => {
    if (selectedPuppetSlot === null) {
      setSelectedPuppetSlot(slotIdx);
      return;
    }
    if (selectedPuppetSlot === slotIdx) {
      setSelectedPuppetSlot(null);
      return;
    }
    const cur = stateRef.current;
    const next = swapPuppetSlots(cur, selectedPuppetSlot, slotIdx);
    if (next.puppetsSolved && !cur.puppetsSolved) {
      audioRef.current?.playAltarChime();
    }
    commitState(next);
    setSelectedPuppetSlot(null);
  };

  // Click / touch left or right edge of canvas to move seamlessly
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (screenMode !== 'playing' || hudState.activeModal !== 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    keysRef.current.left = relX < 0.42;
    keysRef.current.right = relX > 0.58;
  };

  const stopCanvasPointer = () => {
    keysRef.current.left = false;
    keysRef.current.right = false;
  };

  const radioTarget = hudState.act <= 2 ? 104.7 : 109.2;
  const radioSignalStrength = Math.round(
    Math.max(8, (1 - Math.min(8, Math.abs(hudState.radioFrequency - radioTarget)) / 8) * 100)
  );
  const endingInfo = getEndingInfo(hudState.ending);

  return (
    <section
      aria-label="Thanh Minh: Học Viện Cô Sơn — Kinh Dị Tâm Lý 2.5D"
      className={`rounded-2xl border border-[#2b221c] bg-[#0a0908] text-stone-100 shadow-2xl overflow-hidden flex flex-col ${
        isFullscreen ? 'flex-1 min-h-0 h-full' : ''
      }`}
    >
      {/* Top Bar: Clean 3-Zone Editorial Horror Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 border-b border-[#251e19] bg-[#120e0c]">
        {/* Zone 1: Title & Act Metadata (Unboxed typographic separators) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-red-950/75 border border-red-800/45 flex items-center justify-center text-red-300 shrink-0">
            <Ghost className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400 whitespace-nowrap">
              <span className="text-amber-400">Hồi {hudState.act}/4</span>
              <span aria-hidden="true">·</span>
              <span className={hudState.realm === 'yin' ? 'text-rose-400 font-semibold' : 'text-stone-300'}>
                {hudState.realm === 'yin' ? 'Âm Giới' : 'Dương Giới'}
              </span>
              {hudState.loopCount > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-red-400">Vòng lặp #{hudState.loopCount}</span>
                </>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-editorial font-bold text-stone-100 leading-tight truncate">
              {sceneMeta.title}
            </h2>
          </div>
        </div>

        {/* Zone 2: Vital Gauges (Icon + Text + Bar for non-hue accessibility) */}
        {screenMode !== 'title' && (
          <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
            <div className="flex items-center gap-2" title="Độ Tỉnh Táo (Sanity)">
              <Eye className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
              <span className="text-stone-400 hidden sm:inline">Tỉnh táo</span>
              <div className="w-16 sm:w-20 h-2 rounded-sm bg-stone-800 overflow-hidden border border-stone-700">
                <div
                  className={`h-full transition-colors ${
                    hudState.sanity > 50 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.round(hudState.sanity)}%` }}
                />
              </div>
              <span className="font-mono text-[11px] text-stone-200">
                {Math.round(hudState.sanity)}%
              </span>
            </div>

            <div className="flex items-center gap-2" title="Hơi Thở Nín Nhịn [Space]">
              <Wind className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
              <span className="text-stone-400 hidden sm:inline">
                {hudState.gaspPenaltyTimer > 0 ? 'Hụt hơi' : 'Hơi thở'}
              </span>
              <div className="w-14 sm:w-16 h-2 rounded-sm bg-stone-800 overflow-hidden border border-stone-700">
                <div
                  className={`h-full transition-colors ${
                    hudState.gaspPenaltyTimer > 0 ? 'bg-red-500' : 'bg-sky-400'
                  }`}
                  style={{ width: `${Math.round(hudState.breathStamina)}%` }}
                />
              </div>
            </div>

            <div className="text-xs font-mono text-amber-300 whitespace-nowrap">
              Kỷ vật {hudState.collectedKeepsakeIds.length}/{TRUTH_KEEPSAKES.length} ({keepsakePct}%)
              <span className="mx-1.5 text-stone-600">·</span>
              <span className="text-stone-300">
                Tư liệu {hudState.collectedLoreIds.length}/{STORY_LORE_ENTRIES.length}
              </span>
            </div>
          </div>
        )}

        {/* Zone 3: Single-line Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {screenMode === 'playing' && (
            <>
              <button
                type="button"
                onClick={() => setShowObjectiveHint((v) => !v)}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                  showObjectiveHint
                    ? 'border-amber-500/60 bg-amber-950/50 text-amber-200'
                    : 'border-stone-700 bg-stone-900 hover:border-stone-500 text-stone-300'
                }`}
                title="Gợi ý mục tiêu hiện tại"
              >
                <span>Gợi ý</span>
              </button>

              <button
                type="button"
                onClick={toggleJournal}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-stone-700 bg-stone-900 hover:border-amber-500 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                title="Mở Sổ Kỷ Vật [J]"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span className="hidden md:inline">Nhật ký</span>
              </button>

              {hudState.radioTunedAct2 && (
                <button
                  type="button"
                  onClick={triggerRealmShift}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                    hudState.realm === 'yin'
                      ? 'border-rose-500 bg-rose-950/60 text-rose-200'
                      : 'border-stone-700 bg-stone-900 hover:border-rose-400 text-stone-200'
                  }`}
                  title="Chuyển Âm / Dương Giới [Q]"
                >
                  <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">Âm/Dương</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setScreenMode('paused')}
                className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-900 hover:border-stone-500 text-xs inline-flex items-center cursor-pointer"
                title="Tạm dừng"
                aria-label="Tạm dừng trò chơi"
              >
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-900 hover:border-stone-500 text-xs inline-flex items-center cursor-pointer"
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-stone-300" />
            )}
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={isFullscreen && onExitFullscreen ? onExitFullscreen : onToggleFullscreen}
              className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-900 hover:border-amber-500 text-xs inline-flex items-center cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
              aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main 2.5D Canvas Viewport */}
      <div className="relative flex-1 min-h-[380px] bg-black flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={stopCanvasPointer}
          onPointerLeave={stopCanvasPointer}
          className="w-full h-full max-h-[70vh] object-contain select-none cursor-crosshair"
        />

        {/* Quiet Objective Helper Drawer */}
        {screenMode === 'playing' && showObjectiveHint && (
          <div className="absolute top-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm rounded-xl border border-amber-700/40 bg-[#120e0c]/95 px-3.5 py-2.5 shadow-xl z-10 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[11px] font-mono text-amber-400">Mục tiêu hiện tại</div>
              <p className="text-xs text-stone-200 leading-relaxed">{currentObjective}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowObjectiveHint(false)}
              className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
              aria-label="Đóng gợi ý"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Narrative Subtitle Scrim (hidden during kill cutscene since canvas renders horror whisper) */}
        {screenMode === 'playing' && hudState.subtitleText && !hudState.deathCutscene?.active && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 max-w-2xl w-[92%] px-4 py-2.5 rounded-xl bg-gradient-to-t from-black/95 to-black/80 border border-stone-700/70 text-center shadow-2xl">
            <p className="text-xs sm:text-sm font-editorial text-amber-100 leading-relaxed">
              {hudState.subtitleText}
            </p>
          </div>
        )}

        {/* TITLE SCREEN */}
        {screenMode === 'title' && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#120b09]/92 to-black/95 overflow-y-auto p-5 sm:p-8 flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full space-y-6">
              <div className="text-center space-y-2.5">
                <div className="text-xs font-mono text-stone-400 tracking-wide">
                  Kinh Dị Tâm Lý Sinh Tồn 2.5D · Cốt Truyện 4 Hồi · 4 Kết Cục
                </div>
                <h1 className="text-3xl sm:text-5xl font-editorial font-bold tracking-tight text-stone-100">
                  Thanh Minh: Học Viện Cô Sơn <span className="text-red-400">清明</span>
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
                  Cuối thập niên 1960 trên đỉnh núi Cô Sơn cô lập bởi dòng lũ đỏ ngầu. Nữ sinh{' '}
                  <strong className="text-amber-200">Lâm Tĩnh</strong> tỉnh dậy giữa Lớp 12B trống
                  rỗng — nơi những tờ bùa trắng bay lả tả và sự thật đêm phản bội chỉ lộ diện khi
                  người chơi đủ can đảm đối diện tội lỗi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-left">
                {CHARACTER_DOSSIER.map((ch) => (
                  <div
                    key={ch.name}
                    className="rounded-xl border border-stone-800 bg-stone-950/80 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-amber-200">{ch.name}</span>
                      <span className="text-[11px] font-mono text-stone-400">{ch.role}</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">{ch.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-stone-300 py-2 border-y border-stone-800/80">
                <span>
                  <strong className="text-amber-300">A / D</strong> hoặc{' '}
                  <strong className="text-amber-300">Chạm màn hình</strong> Di chuyển
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-sky-300">Giữ Space</strong> Nín thở qua Vong hồn
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-amber-300">E</strong> Kiểm tra
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-rose-300">Q</strong> Chuyển Âm–Dương
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="text-stone-200">J</strong> Sổ Kỷ vật
                </span>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => startGame(1)}
                  className="min-h-[44px] px-7 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-stone-100 font-semibold text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                  <span>Bắt Đầu Đêm Mưa Cô Sơn</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAUSE OVERLAY */}
        {screenMode === 'paused' && (
          <div className="absolute inset-0 bg-black/82 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-sm w-full rounded-2xl border border-stone-700 bg-[#14110f] p-6 space-y-4 text-center">
              <h3 className="text-xl font-editorial font-bold text-amber-200">Tạm Dừng</h3>
              <p className="text-xs text-stone-400">
                {sceneMeta.subtitle} · Kỷ vật {hudState.collectedKeepsakeIds.length}/6
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setScreenMode('playing')}
                  className="min-h-[42px] rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Tiếp Tục
                </button>
                <button
                  type="button"
                  onClick={() => startGame(1)}
                  className="min-h-[42px] rounded-xl border border-stone-700 bg-stone-900 hover:border-stone-500 text-stone-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Chơi Lại Từ Đầu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INTERACTIVE STORY & PUZZLE MODALS */}
        {screenMode === 'playing' && hudState.activeModal !== 'none' && (
          <div className="absolute inset-0 bg-black/84 backdrop-blur-sm flex items-center justify-center p-4 z-20 overflow-y-auto">
            {/* 1. JOURNAL & TRUTH KEEPSAKES + LORE CODEX */}
            {hudState.activeModal === 'journal' && (
              <div className="max-w-2xl w-full max-h-[86vh] overflow-y-auto rounded-2xl border border-amber-700/40 bg-[#14110e] p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div>
                    <h3 className="text-lg font-editorial font-bold text-amber-200">
                      Hồ Sơ Cô Sơn · Kỷ Vật {hudState.collectedKeepsakeIds.length}/6 ({keepsakePct}%)
                    </h3>
                    <p className="text-xs text-stone-400">{currentObjective}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                    className="min-h-[38px] min-w-[38px] rounded-lg border border-stone-700 bg-stone-900 flex items-center justify-center cursor-pointer"
                    aria-label="Đóng nhật ký"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Codex Tabs */}
                <div className="flex items-center gap-2 border-b border-stone-800 pb-2.5">
                  <button
                    type="button"
                    onClick={() => setJournalTab('keepsakes')}
                    className={`min-h-[36px] px-3.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      journalTab === 'keepsakes'
                        ? 'border-amber-500/70 bg-amber-950/50 text-amber-200'
                        : 'border-stone-800 bg-stone-900/70 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Kỷ Vật Sự Thật ({hudState.collectedKeepsakeIds.length}/6)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJournalTab('lore')}
                    className={`min-h-[36px] px-3.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                      journalTab === 'lore'
                        ? 'border-amber-500/70 bg-amber-950/50 text-amber-200'
                        : 'border-stone-800 bg-stone-900/70 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Ký Ức & Tư Liệu ({hudState.collectedLoreIds.length}/{STORY_LORE_ENTRIES.length})
                  </button>
                </div>

                {journalTab === 'keepsakes' ? (
                  <div className="space-y-3">
                    {TRUTH_KEEPSAKES.map((ks) => {
                      const owned = hudState.collectedKeepsakeIds.includes(ks.id);
                      return (
                        <div
                          key={ks.id}
                          className={`rounded-xl border p-3.5 ${
                            owned
                              ? 'border-amber-600/40 bg-stone-900/90'
                              : 'border-stone-800 bg-stone-950/60 opacity-65'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-amber-200">
                              {owned ? ks.title : `Kỷ vật Hồi ${ks.act} — Chưa thu thập`}
                            </span>
                            <span className="text-[11px] font-mono text-stone-400">{ks.subtitle}</span>
                          </div>
                          {owned && (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-xs text-stone-300">{ks.description}</p>
                              <p className="text-sm font-editorial italic text-amber-100/95 rounded-lg border border-stone-800 bg-black/45 p-2.5 leading-relaxed">
                                {ks.diaryText}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {STORY_LORE_ENTRIES.map((lore) => {
                      const owned = hudState.collectedLoreIds.includes(lore.id);
                      const showSecret =
                        (lore.id === 'lore-7-darkroom-ledger' &&
                          hudState.flags.darkroom_drawer_opened) ||
                        (lore.id === 'lore-10-to-vien-1986' &&
                          hudState.flags.offered_qingming_tribute);
                      return (
                        <div
                          key={lore.id}
                          className={`rounded-xl border p-3.5 ${
                            owned
                              ? 'border-amber-600/40 bg-stone-900/90'
                              : 'border-stone-800 bg-stone-950/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-amber-200">
                              {owned ? lore.title : `Mảnh ký ức Hồi ${lore.act} — Chưa khám phá`}
                            </span>
                            <span className="text-[11px] font-mono text-stone-400">
                              {lore.location}
                            </span>
                          </div>
                          {owned && (
                            <div className="mt-2 space-y-1.5">
                              <p className="text-xs font-editorial italic text-amber-300">
                                {lore.quote}
                              </p>
                              <p className="text-xs text-stone-300 leading-relaxed">{lore.body}</p>
                              {showSecret && lore.secretBody && (
                                <p className="text-xs text-rose-200 rounded-lg border border-rose-900/60 bg-rose-950/30 p-2.5 leading-relaxed">
                                  {lore.secretBody}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {hudState.inventory.length > 0 && (
                  <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center gap-2 text-xs text-stone-300">
                    <span className="font-mono text-stone-400">Vật phẩm:</span>
                    {hudState.inventory.map((id, idx) => (
                      <span key={id}>
                        {idx > 0 && <span className="mx-1 text-stone-600">·</span>}
                        {INVENTORY_ITEMS[id].name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 1B. MEMORY ECHO MODAL (ENVIRONMENTAL STORYTELLING & 1986 TO VIEN) */}
            {hudState.activeModal === 'memory_echo' &&
              (() => {
                const entry = STORY_LORE_ENTRIES.find((l) => l.id === hudState.activeLoreId);
                if (!entry) return null;
                const showSecret =
                  (entry.id === 'lore-7-darkroom-ledger' &&
                    hudState.flags.darkroom_drawer_opened) ||
                  (entry.id === 'lore-10-to-vien-1986' &&
                    hudState.flags.offered_qingming_tribute);
                return (
                  <div className="max-w-lg w-full rounded-2xl border border-amber-700/50 bg-[#15110e] p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-mono text-amber-400">
                          {entry.location} · {entry.speaker}
                        </div>
                        <h3 className="text-lg font-editorial font-bold text-stone-100">
                          {entry.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          commitState({
                            ...stateRef.current,
                            activeModal: 'none',
                            activeLoreId: null,
                          })
                        }
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-stone-700 flex items-center justify-center cursor-pointer shrink-0"
                        aria-label="Đóng ký ức"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm font-editorial italic text-amber-200 bg-black/50 p-3.5 rounded-xl border border-stone-800 leading-relaxed">
                      {entry.quote}
                    </p>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                      {entry.body}
                    </p>

                    {entry.secretBody && (
                      <div
                        className={`rounded-xl border p-3 text-xs leading-relaxed ${
                          showSecret
                            ? 'border-amber-500/50 bg-amber-950/30 text-amber-100'
                            : 'border-stone-800 bg-stone-950/80 text-stone-400'
                        }`}
                      >
                        {showSecret
                          ? entry.secretBody
                          : entry.id === 'lore-7-darkroom-ledger'
                            ? 'Ngăn kéo dưới khóa chặt. Cần Chìa Khóa Phòng Rửa Ảnh (tìm trong Âm Giới của Phòng Phát Thanh).'
                            : 'Bạn có thể tìm Xấp Tiền Vàng Mã (Sân Trường) hoặc Chén Rượu Tế (Cô Sơn 1986) để dâng hương tại bia đá này.'}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        commitState({
                          ...stateRef.current,
                          activeModal: 'none',
                          activeLoreId: null,
                        })
                      }
                      className="w-full min-h-[42px] rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Lưu Vào Sổ Ký Ức
                    </button>
                  </div>
                );
              })()}

            {/* 2. NGŨ HÀNH SPIRIT TABLETS (ACT 1) */}
            {hudState.activeModal === 'wuxing_puzzle' && (
              <div className="max-w-md w-full rounded-2xl border border-red-800/50 bg-[#150f0d] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-editorial font-bold text-amber-200">
                    Bàn Thờ Ngũ Hành — Hóa Vàng & Thắp Nhang
                  </h3>
                  <button
                    type="button"
                    onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                    className="min-h-[36px] min-w-[36px] rounded-lg border border-stone-700 flex items-center justify-center cursor-pointer"
                    aria-label="Đóng bàn thờ"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Lá bùa trên cổng sắt ghi quy luật tương sinh cổ:{' '}
                  <strong className="text-amber-300">Kim sinh Thủy → Thủy khắc Hỏa</strong> (Thứ tự
                  đúng: <strong>Kim → Thủy → Hỏa</strong>).
                </p>
                <div className="flex items-center justify-between text-xs font-mono text-stone-300 bg-black/50 px-3 py-2.5 rounded-lg border border-stone-800">
                  <span>Thứ tự đã thắp</span>
                  <span className="text-amber-300 font-bold">
                    {hudState.wuxingSequence.length === 0
                      ? 'Chưa đặt'
                      : hudState.wuxingSequence.join(' → ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      { el: 'Kim', han: '金' },
                      { el: 'Thủy', han: '水' },
                      { el: 'Hỏa', han: '火' },
                    ] as const
                  ).map(({ el, han }) => (
                    <button
                      key={el}
                      type="button"
                      onClick={() => handleWuxingPick(el)}
                      className="min-h-[64px] rounded-xl border border-amber-700/50 bg-stone-900 hover:bg-amber-950/60 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors"
                    >
                      <span className="text-lg font-editorial text-amber-300">{han}</span>
                      <span className="text-xs font-semibold text-stone-100">{el}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. VINTAGE TRANSISTOR RADIO DIAL (ACT 2: 104.7 MHz & ACT 3 SECRET: 109.2 MHz) */}
            {hudState.activeModal === 'radio_tuner' && (
              <div className="max-w-md w-full rounded-2xl border border-amber-700/40 bg-[#14110f] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" aria-hidden="true" />
                    <h3 className="text-lg font-editorial font-bold text-amber-200">
                      Đài Bán Dẫn ({hudState.act <= 2 ? 'Hồi 2 · Âm Dương' : 'Hồi 3 · Sóng Bí Mật'})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                    className="min-h-[36px] min-w-[36px] rounded-lg border border-stone-700 flex items-center justify-center cursor-pointer"
                    aria-label="Đóng đài bán dẫn"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {hudState.act <= 2
                    ? 'Dò khớp tần số 104.7 MHz để xé toạc ranh giới Dương Giới và Âm Giới.'
                    : 'Dò tần số bí mật 109.2 MHz của Nhóm Đọc Sách — điều kiện mở True Ending.'}
                </p>

                <div className="rounded-xl border border-stone-700 bg-black p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-mono font-bold text-amber-300 tabular-nums">
                      {hudState.radioFrequency.toFixed(1)} MHz
                    </span>
                    <span className="text-[11px] font-mono text-stone-400 tabular-nums">
                      Tín hiệu {radioSignalStrength}%
                    </span>
                  </div>

                  {/* Signal Strength Bar */}
                  <div className="h-1.5 w-full rounded-sm bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        radioSignalStrength > 85 ? 'bg-amber-400' : 'bg-rose-500'
                      }`}
                      style={{ width: `${radioSignalStrength}%` }}
                    />
                  </div>

                  <input
                    type="range"
                    min={88.0}
                    max={112.0}
                    step={0.1}
                    value={hudState.radioFrequency}
                    onChange={(e) => handleRadioChange(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                    aria-label="Dò tần số radio"
                  />

                  <div className="flex items-center justify-center gap-2">
                    {[-1.0, -0.1, 0.1, 1.0].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => handleRadioChange(hudState.radioFrequency + delta)}
                        className="min-h-[36px] px-3 rounded-lg border border-stone-700 bg-stone-900 hover:border-amber-500 text-xs font-mono cursor-pointer transition-colors"
                      >
                        {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {(hudState.act <= 2 ? hudState.radioTunedAct2 : hudState.radioSecretAct3Solved) && (
                  <button
                    type="button"
                    onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                    className="w-full min-h-[42px] rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Đã Khớp Sóng · Tiếp Tục
                  </button>
                )}
              </div>
            )}

            {/* 4. DARKROOM 35MM NEGATIVE FILM REVEAL (ACT 2 CLIMAX) */}
            {hudState.activeModal === 'darkroom_reveal' && (
              <div className="max-w-lg w-full rounded-2xl border border-red-800/70 bg-[#1a0507] p-5 space-y-4">
                <h3 className="text-lg font-editorial font-bold text-red-200">
                  Khay Thuốc Hiện Hình — Ánh Đèn Đỏ
                </h3>
                {/* 35mm Film Strip Perforation Frame */}
                <div className="rounded-xl border border-red-900/70 bg-black/80 p-4 space-y-2.5 text-xs text-stone-200 leading-relaxed">
                  <div className="flex justify-between gap-1 opacity-40" aria-hidden="true">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span key={i} className="w-3 h-1.5 rounded-xs bg-red-300/60" />
                    ))}
                  </div>
                  <p className="pt-1">
                    Dưới ánh sáng đỏ quạch của phòng rửa ảnh, bức ảnh âm bản tự hiện lên bàn tay
                    nữ sinh run rẩy đưa tờ danh sách cho Trương Vệ Quốc.
                  </p>
                  <p className="font-editorial text-sm italic text-red-200">
                    “Không phải bàn tay bị cưỡng ép... Chính sự ghen tuông khi thấy Tô Dao được thầy
                    Trần ưu ái đã đẩy mình đến bước đường này.”
                  </p>
                  <div className="flex justify-between gap-1 pt-1 opacity-40" aria-hidden="true">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span key={i} className="w-3 h-1.5 rounded-xs bg-red-300/60" />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                  className="w-full min-h-[42px] rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  Đóng & Tiến Vào Hội Trường Lớn (Hồi 3)
                </button>
              </div>
            )}

            {/* 5. SHADOW PUPPET THEATRE (ACT 3) */}
            {hudState.activeModal === 'puppet_theatre' && (
              <div className="max-w-2xl w-full rounded-2xl border border-amber-700/50 bg-[#16110e] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-editorial font-bold text-amber-200">
                      Sân Khấu Bì Ảnh Hí — Tái Hiện Đêm Phản Bội
                    </h3>
                    <p className="text-xs text-stone-400">
                      Chọn lần lượt 2 màn rối để hoán đổi, sắp xếp đúng trình tự I → II → III → IV
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                    className="min-h-[36px] min-w-[36px] rounded-lg border border-stone-700 flex items-center justify-center cursor-pointer"
                    aria-label="Đóng sân khấu rối"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hudState.puppetOrder.map((sceneId, idx) => {
                    const card = PUPPET_SCENES[sceneId];
                    const isPicked = selectedPuppetSlot === idx;
                    return (
                      <button
                        key={`${idx}-${sceneId}`}
                        type="button"
                        onClick={() => handlePuppetClick(idx)}
                        className={`text-left rounded-xl border p-3.5 transition-colors cursor-pointer space-y-1 ${
                          isPicked
                            ? 'border-amber-400 bg-amber-950/50'
                            : hudState.puppetsSolved
                              ? 'border-emerald-600/50 bg-emerald-950/30'
                              : 'border-stone-700 bg-stone-900/80 hover:border-amber-600'
                        }`}
                      >
                        <div className="text-[11px] font-mono text-amber-400">
                          Ô #{idx + 1} · Màn {card.roman}
                        </div>
                        <div className="text-xs font-semibold text-stone-100">{card.title}</div>
                        <p className="text-xs text-stone-300 leading-relaxed">{card.detail}</p>
                      </button>
                    );
                  })}
                </div>

                {hudState.puppetsSolved && (
                  <button
                    type="button"
                    onClick={() => commitState({ ...stateRef.current, activeModal: 'none' })}
                    className="w-full min-h-[42px] rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Mở Lối Sang Khu Biệt Giam
                  </button>
                )}
              </div>
            )}

            {/* 6. FINAL INTERROGATION TRIAL (ACT 4 CLIMAX) */}
            {hudState.activeModal === 'interrogation_trial' && (
              <div className="max-w-xl w-full rounded-2xl border border-stone-600 bg-[#12100f] p-5 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-mono text-rose-400">
                    Hồi 4 · Phiên Tòa Của Linh Hồn ({hudState.interrogationStep + 1}/3)
                  </div>
                  <h3 className="text-lg font-editorial font-bold text-stone-100">
                    Bóng Ma Lâm Tĩnh đối diện qua bàn gỗ hỏi:
                  </h3>
                  <p className="text-xs font-editorial italic text-stone-400">
                    {INTERROGATION_PROMPTS[hudState.interrogationStep].echo}
                  </p>
                </div>

                <p className="text-sm sm:text-base font-editorial text-amber-100 leading-relaxed bg-black/55 p-4 rounded-xl border border-stone-800">
                  “{INTERROGATION_PROMPTS[hudState.interrogationStep].question}”
                </p>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => commitState(answerInterrogationStep(stateRef.current, true))}
                    className="w-full text-left min-h-[48px] px-4 py-3 rounded-xl border border-amber-700/50 bg-stone-900 hover:bg-amber-950/50 text-xs sm:text-sm text-amber-100 cursor-pointer transition-colors"
                  >
                    {INTERROGATION_PROMPTS[hudState.interrogationStep].honestLabel}
                  </button>

                  <button
                    type="button"
                    onClick={() => commitState(answerInterrogationStep(stateRef.current, false))}
                    className="w-full text-left min-h-[48px] px-4 py-3 rounded-xl border border-stone-700 bg-stone-950 hover:bg-rose-950/40 text-xs sm:text-sm text-stone-300 cursor-pointer transition-colors"
                  >
                    {INTERROGATION_PROMPTS[hudState.interrogationStep].denialLabel}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ENDING SUMMARY / GAMEOVER OVERLAY */}
        {screenMode === 'gameover' && (
          <div className="absolute inset-0 bg-black/88 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto z-30">
            <div className="max-w-xl w-full rounded-2xl border border-stone-700 bg-[#120f0e] p-6 space-y-4">
              <div className={`inline-block text-[11px] font-mono px-2.5 py-1 rounded border ${endingInfo.accentClass}`}>
                {endingInfo.tag}
              </div>

              <h3 className="text-2xl font-editorial font-bold text-stone-100">
                {endingInfo.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                {endingInfo.summary}
              </p>

              <div className="rounded-xl border border-stone-800 bg-black/60 p-4 text-sm font-editorial italic text-amber-100 leading-relaxed">
                {endingInfo.epilogue}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center text-xs tabular-nums">
                <div className="rounded-xl border border-stone-800 bg-stone-950 p-2.5">
                  <div className="text-stone-400 text-[11px]">Kỷ vật Sự thật</div>
                  <div className="font-mono font-bold text-amber-300">
                    {hudState.collectedKeepsakeIds.length}/6 ({keepsakePct}%)
                  </div>
                </div>
                <div className="rounded-xl border border-stone-800 bg-stone-950 p-2.5">
                  <div className="text-stone-400 text-[11px]">Tần số 109.2 MHz</div>
                  <div className="font-mono font-bold text-sky-300">
                    {hudState.radioSecretAct3Solved ? 'Đã giải mã' : 'Chưa mở'}
                  </div>
                </div>
                <div className="rounded-xl border border-stone-800 bg-stone-950 p-2.5">
                  <div className="text-stone-400 text-[11px]">Sụp đổ tâm trí</div>
                  <div className="font-mono font-bold text-rose-300">
                    {hudState.sanityBottomCount} lần
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  startGame(hudState.ending === 'ending_1_loop' ? hudState.loopCount + 1 : 1)
                }
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>
                  {hudState.ending === 'ending_1_loop'
                    ? `Tỉnh Dậy Trong Vòng Lặp Thứ ${hudState.loopCount + 1}`
                    : 'Chơi Lại Từ Đầu'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Interactive Dock */}
      {screenMode === 'playing' && !hudState.deathCutscene?.active && (
        <footer className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-[#251e19] bg-[#120e0c]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={() => {
                keysRef.current.left = true;
              }}
              onPointerUp={stopCanvasPointer}
              onPointerLeave={stopCanvasPointer}
              className="min-h-[40px] min-w-[44px] px-3 rounded-lg border border-stone-700 bg-stone-900 active:bg-stone-800 text-xs font-mono font-semibold cursor-pointer select-none whitespace-nowrap"
              aria-label="Đi sang trái"
            >
              ← Trái
            </button>
            <button
              type="button"
              onPointerDown={() => {
                keysRef.current.right = true;
              }}
              onPointerUp={stopCanvasPointer}
              onPointerLeave={stopCanvasPointer}
              className="min-h-[40px] min-w-[44px] px-3 rounded-lg border border-stone-700 bg-stone-900 active:bg-stone-800 text-xs font-mono font-semibold cursor-pointer select-none whitespace-nowrap"
              aria-label="Đi sang phải"
            >
              Phải →
            </button>
            <button
              type="button"
              onPointerDown={() => {
                keysRef.current.breath = true;
              }}
              onPointerUp={() => {
                keysRef.current.breath = false;
              }}
              onPointerLeave={() => {
                keysRef.current.breath = false;
              }}
              className={`min-h-[40px] px-3 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap transition-colors ${
                hudState.holdingBreath
                  ? 'border-sky-400 bg-sky-950/70 text-sky-200'
                  : 'border-stone-700 bg-stone-900 text-stone-200'
              }`}
            >
              <Wind className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Nín thở</span>
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            {nearbyHotspot ? (
              <button
                type="button"
                onClick={triggerInteract}
                className="min-h-[40px] px-4 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer max-w-full truncate transition-colors"
              >
                <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">[E] {nearbyHotspot.label}</span>
              </button>
            ) : (
              <span className="text-xs text-stone-400 hidden sm:inline truncate">
                {sceneMeta.subtitle}
              </span>
            )}
          </div>
        </footer>
      )}
    </section>
  );
}
