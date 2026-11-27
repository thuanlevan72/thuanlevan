import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  Cat,
  ChevronDown,
  ChevronUp,
  Code2,
  Cpu,
  Crown,
  FileSearch,
  Gamepad2,
  Ghost,
  Gift,
  Grid3X3,
  Layers,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Network,
  Sparkles,
  Sprout,
  Zap,
} from 'lucide-react';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import { lazyWithRetry } from '../utils/lazyWithRetry.ts';
import { LazyLoadErrorBoundary } from './LazyLoadErrorBoundary.tsx';
import { PwaInstallButton } from './PwaInstallControls.tsx';

const AnomalyGameSection = lazyWithRetry(() =>
  import('./AnomalyGameSection.tsx').then((m) => ({ default: m.AnomalyGameSection }))
);
const AsmrOrganizerGameSection = lazyWithRetry(() =>
  import('./AsmrOrganizerGameSection.tsx').then((m) => ({ default: m.AsmrOrganizerGameSection }))
);
const BlindBoxMergeGameSection = lazyWithRetry(() =>
  import('./BlindBoxMergeGameSection.tsx').then((m) => ({ default: m.BlindBoxMergeGameSection }))
);
const CatFinderGameSection = lazyWithRetry(() =>
  import('./CatFinderGameSection.tsx').then((m) => ({ default: m.CatFinderGameSection }))
);
const FeAcademyGameSection = lazyWithRetry(() =>
  import('./FeAcademyGameSection.tsx').then((m) => ({ default: m.FeAcademyGameSection }))
);
const LinuxHackerGameSection = lazyWithRetry(() =>
  import('./LinuxHackerGameSection.tsx').then((m) => ({ default: m.LinuxHackerGameSection }))
);
const PrismTdGameSection = lazyWithRetry(() =>
  import('./PrismTdGameSection.tsx').then((m) => ({ default: m.PrismTdGameSection }))
);
const TrafficRouterGameSection = lazyWithRetry(() =>
  import('./TrafficRouterGameSection.tsx').then((m) => ({ default: m.TrafficRouterGameSection }))
);
const XiangqiGameSection = lazyWithRetry(() =>
  import('./XiangqiGameSection.tsx').then((m) => ({ default: m.XiangqiGameSection }))
);
const ChessGameSection = lazyWithRetry(() =>
  import('./ChessGameSection.tsx').then((m) => ({ default: m.ChessGameSection }))
);
const ThanhMinhGameSection = lazyWithRetry(() =>
  import('./ThanhMinhGameSection.tsx').then((m) => ({
    default: m.ThanhMinhGameSection,
  }))
);
const CloudValleyGameSection = lazyWithRetry(() =>
  import('./cloudValley/CloudValleyGameSection.tsx').then((m) => ({
    default: m.CloudValleyGameSection,
  }))
);

type GameId =
  | 'cloud_valley'
  | 'xiangqi'
  | 'chess'
  | 'anomaly'
  | 'thanh_minh'
  | 'asmr_organizer'
  | 'blind_box'
  | 'cat_finder'
  | 'prism_td'
  | 'linux_hacker'
  | 'traffic_router'
  | 'fe_academy';

export type GameHubCategoryId = 'all' | 'strategy' | 'casual' | 'tech' | 'arcade';

interface GameHubCategoryMeta {
  id: Exclude<GameHubCategoryId, 'all'>;
  label: string;
  shortLabel: string;
  accentClass: string;
}

export const GAME_CATEGORIES: readonly GameHubCategoryMeta[] = [
  {
    id: 'strategy',
    label: 'Chiến Thuật & Đấu Trường',
    shortLabel: 'Chiến Thuật',
    accentClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'casual',
    label: 'Thư Giãn & Suy Luận',
    shortLabel: 'Thư Giãn',
    accentClass: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'tech',
    label: 'Học Code & Kỹ Thuật',
    shortLabel: 'Học & Tech',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'arcade',
    label: 'Phản Xạ & Lộ Trình',
    shortLabel: 'Phản Xạ',
    accentClass: 'text-sky-600 dark:text-sky-400',
  },
];

interface GameCatalogItem {
  id: string;
  category: Exclude<GameHubCategoryId, 'all'>;
  title: string;
  shortTitle: string;
  subtitle: string;
  badge: string;
  playable: boolean;
  gameKey?: GameId;
}

export const GAME_CATALOG: readonly GameCatalogItem[] = [
  {
    id: 'cloud-valley',
    category: 'casual',
    title: 'Thung Lũng Mây',
    shortTitle: 'Thung Lũng Mây',
    subtitle: '2.5D Cozy Farm Sim · Lai tạo thực vật, Xưởng 3 tầng, 4 mùa & Tự động hóa Tinh Linh Đất',
    badge: '2.5D Nông Trại',
    playable: true,
    gameKey: 'cloud_valley',
  },
  {
    id: 'xiangqi',
    category: 'strategy',
    title: 'Cờ Tướng AI',
    shortTitle: 'Cờ Tướng',
    subtitle: '2D Canvas · 10 Cấp Độ (Tân Binh → Kỳ Vương)',
    badge: '10 Cấp',
    playable: true,
    gameKey: 'xiangqi',
  },
  {
    id: 'chess',
    category: 'strategy',
    title: 'Cờ Vua AI',
    shortTitle: 'Cờ Vua',
    subtitle: '2D Canvas · Chuẩn FIDE · 10 Cấp AI (Tân Binh → Kỳ Vương) & 2 Người Chơi',
    badge: '10 Cấp · 2P',
    playable: true,
    gameKey: 'chess',
  },
  {
    id: 'prism-td',
    category: 'strategy',
    title: 'Thủ Thành Pháo Đài',
    shortTitle: 'Pháo Đài',
    subtitle: 'Pure Gun TD · 19 Màn · Siêu Boss · 26 Súng (19 Công · 3 Hệ Điện · 4 Hỗ Trợ)',
    badge: '26 Súng · 9 Chế Độ',
    playable: true,
    gameKey: 'prism_td',
  },
  {
    id: 'cat-finder',
    category: 'casual',
    title: 'Tìm Mèo & Đồ Xinh',
    shortTitle: 'Tìm Mèo',
    subtitle: '24–27 đồ ngụy trang · +44 đồ giả · 4 mức Khó ×5 → Siêu Thần Ánh Xạ ×20',
    badge: '5 Màn · Khó ×5–×20',
    playable: true,
    gameKey: 'cat_finder',
  },
  {
    id: 'anomaly',
    category: 'casual',
    title: 'Kiểm Duyệt Hồ Sơ',
    shortTitle: 'Hồ Sơ Dị Biệt',
    subtitle: 'Minimalist Document Inspection · 12 Ngày · 60 Hồ Sơ · 3 Chế Độ & Đèn UV Pháp Y',
    badge: '12 Ngày · 3 Chế Độ',
    playable: true,
    gameKey: 'anomaly',
  },
  {
    id: 'thanh-minh',
    category: 'casual',
    title: 'Thanh Minh: Học Viện Cô Sơn (清明)',
    shortTitle: 'Thanh Minh 2.5D',
    subtitle: '2.5D Psychological Horror · Cốt truyện 4 Hồi · 4 Kết Cục · Nín thở & Radio Âm–Dương',
    badge: '2.5D Kinh Dị · 4 Hồi',
    playable: true,
    gameKey: 'thanh_minh',
  },
  {
    id: 'asmr-organizer',
    category: 'casual',
    title: 'Sắp Xếp Góc Nhỏ',
    shortTitle: 'Chuẩn OCD',
    subtitle: 'ASMR Aesthetic Organizer · Kéo xoay xếp góc pastel chuẩn OCD',
    badge: '6 Góc ASMR',
    playable: true,
    gameKey: 'asmr_organizer',
  },
  {
    id: 'blind-box-merge',
    category: 'casual',
    title: 'Tiệm Xé Túi Mù',
    shortTitle: 'Túi Mù',
    subtitle: 'Blind-Box Squishy Merge · Hợp nhất thú bông ASMR · Vuốt xé túi mù · Decor Phòng Mini',
    badge: 'Mochi & Phòng',
    playable: true,
    gameKey: 'blind_box',
  },
  {
    id: 'fe-academy',
    category: 'tech',
    title: 'Học Viện FE 5-in-1',
    shortTitle: 'Học Viện FE',
    subtitle: 'DOM Sniper · Flex/Grid Heist · Event Loop · DevTools Bug · Component Tree Defense',
    badge: '5 Trạm FE',
    playable: true,
    gameKey: 'fe_academy',
  },
  {
    id: 'traffic-router',
    category: 'tech',
    title: 'Thiết Kế Kiến Trúc',
    shortTitle: 'Kiến Trúc',
    subtitle: '24 Hoàn Cảnh · 5 Chế Độ · CQRS Luật Dây · Kafka Buffer · SRE War-Room',
    badge: '24 Màn · 5 Chế Độ',
    playable: true,
    gameKey: 'traffic_router',
  },
  {
    id: 'linux-hacker',
    category: 'tech',
    title: 'Ubuntu CLI Production',
    shortTitle: 'Ubuntu CLI',
    subtitle: 'Incident Response · 8 Lĩnh Vực Linux → Docker → Cloud DevOps (16 Sự Cố Thực Chiến)',
    badge: '16 Sự Cố',
    playable: true,
    gameKey: 'linux_hacker',
  },
  {
    id: 'gomoku-planned',
    category: 'arcade',
    title: 'Cờ Caro 5 Ô',
    shortTitle: 'Cờ Caro',
    subtitle: 'Trò chơi trí tuệ bàn 15×15 · Dự kiến mở rộng',
    badge: 'Lộ trình',
    playable: false,
  },
  {
    id: '2048-planned',
    category: 'arcade',
    title: '2048 Logic',
    shortTitle: '2048',
    subtitle: 'Ghép số chiến thuật tối ưu cảm ứng · Dự kiến mở rộng',
    badge: 'Lộ trình',
    playable: false,
  },
];

interface GameHubSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

function renderGameIcon(gameKey: GameId | undefined, isSelected: boolean) {
  if (gameKey === 'cloud_valley') {
    return (
      <Sprout
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'cat_finder') {
    return (
      <Cat
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-rose-200' : 'text-rose-500 dark:text-rose-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'anomaly') {
    return (
      <FileSearch
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-amber-300' : 'text-rose-600 dark:text-rose-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'chess') {
    return (
      <Crown
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'thanh_minh') {
    return (
      <Ghost
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-rose-200' : 'text-red-700 dark:text-rose-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'asmr_organizer') {
    return (
      <LayoutGrid
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'blind_box') {
    return (
      <Gift
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-pink-200' : 'text-pink-600 dark:text-pink-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'prism_td') {
    return (
      <Zap
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-cyan-300' : 'text-cyan-600 dark:text-cyan-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'linux_hacker') {
    return (
      <Code2
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'traffic_router') {
    return (
      <Network
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-sky-300' : 'text-sky-600 dark:text-sky-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'fe_academy') {
    return (
      <Cpu
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />;
}

export function GameHubSection({ theme, onToggleTheme }: GameHubSectionProps) {
  const [activeGame, setActiveGame] = useState<GameId>(() => {
    if (typeof window !== 'undefined') {
      const playParam = new URLSearchParams(window.location.search).get('play');
      if (
        playParam === 'cloudvalley' ||
        playParam === 'cloud-valley' ||
        playParam === 'cloud_valley' ||
        playParam === 'thunglungmay' ||
        playParam === 'thung-lung-may' ||
        playParam === 'farm'
      ) {
        return 'cloud_valley';
      }
      if (
        playParam === 'cat' ||
        playParam === 'timmeo' ||
        playParam === 'meo' ||
        playParam === 'taphoa' ||
        playParam === 'doxinh'
      ) {
        return 'cat_finder';
      }
      if (playParam === 'anomaly') return 'anomaly';
      if (
        playParam === 'chess' ||
        playParam === 'covua' ||
        playParam === 'co-vua' ||
        playParam === 'co_vua'
      ) {
        return 'chess';
      }
      if (
        playParam === 'thanhminh' ||
        playParam === 'thanh-minh' ||
        playParam === 'thanh_minh' ||
        playParam === 'coson'
      ) {
        return 'thanh_minh';
      }
      if (playParam === 'asmr' || playParam === 'ocd' || playParam === 'organizer') {
        return 'asmr_organizer';
      }
      if (playParam === 'blindbox' || playParam === 'squishy' || playParam === 'tuimu') {
        return 'blind_box';
      }
      if (
        playParam === 'prism' ||
        playParam === 'prism-td' ||
        playParam === 'prism_td' ||
        playParam === 'laser' ||
        playParam === 'gun' ||
        playParam === 'td' ||
        playParam === 'turret'
      ) {
        return 'prism_td';
      }
      if (playParam === 'linux' || playParam === 'ubuntu' || playParam === 'cli' || playParam === 'hacker') {
        return 'linux_hacker';
      }
      if (playParam === 'traffic' || playParam === 'ddos' || playParam === 'arch' || playParam === 'architecture') {
        return 'traffic_router';
      }
      if (
        playParam === 'fe' ||
        playParam === 'frontend' ||
        playParam === 'css' ||
        playParam === 'dom' ||
        playParam === 'hocfe'
      ) {
        return 'fe_academy';
      }
    }
    return 'xiangqi';
  });

  const [selectedCategory, setSelectedCategory] = useState<GameHubCategoryId>('all');
  const [hubExpanded, setHubExpanded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const gameViewportRef = useRef<HTMLDivElement | null>(null);

  const visibleCategories =
    selectedCategory === 'all'
      ? GAME_CATEGORIES
      : GAME_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  const playableGames = GAME_CATALOG.filter((g) => g.playable && g.gameKey);
  const activeGameMeta = GAME_CATALOG.find((g) => g.gameKey === activeGame);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    try {
      const orientation = screen.orientation as ScreenOrientation & { unlock?: () => void };
      orientation?.unlock?.();
    } catch {
      // Ignore unsupported orientation unlock
    }
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    const target = gameViewportRef.current;
    if (target && typeof target.requestFullscreen === 'function') {
      try {
        const res = target.requestFullscreen();
        if (res && typeof res.then === 'function') {
          void res
            .then(() => {
              try {
                const orientation = screen.orientation as ScreenOrientation & {
                  lock?: (mode: string) => Promise<void>;
                };
                if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
                  void orientation?.lock?.('landscape')?.catch(() => {});
                }
              } catch {
                // Ignore orientation lock failures on browsers that restrict it
              }
            })
            .catch(() => {});
        }
      } catch {
        // Fallback smoothly to fixed viewport overlay
      }
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen((prev) => (prev ? false : prev));
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen || typeof document === 'undefined') return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    const onKeyCapture = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        e.stopImmediatePropagation();
        toggleFullscreen();
        return;
      }
      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        e.stopImmediatePropagation();
        exitFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyCapture, { capture: true });
    return () => window.removeEventListener('keydown', onKeyCapture, { capture: true });
  }, [isFullscreen, toggleFullscreen, exitFullscreen]);

  return (
    <div id="game-hub" className="pt-2 sm:pt-3 mobile-ls:pt-0.5 pb-6 mobile-ls:pb-1 space-y-2 mobile-ls:space-y-1">
      {/* Compact Multi-Game Hub Switcher Bar */}
      <div
        role="region"
        aria-label="Kho Trò Chơi 2D Theo Danh Mục"
        className="rounded-xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white/95 dark:bg-[#0B1222]/95 px-2.5 py-2 sm:px-3.5 mobile-ls:px-1.5 mobile-ls:py-0.5 shadow-[0_8px_20px_-14px_rgba(10,25,47,0.14)] space-y-2 mobile-ls:space-y-1"
      >
        {/* Ultra-compact Single Row Bar */}
        <div className="flex items-center gap-2 mobile-ls:gap-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div
              aria-hidden="true"
              className="w-8 h-8 mobile-ls:w-6 mobile-ls:h-6 rounded-lg bg-[#0A192F] dark:bg-[#0284C7] text-white flex items-center justify-center shrink-0"
            >
              <Gamepad2 className="w-4 h-4 mobile-ls:w-3.5 mobile-ls:h-3.5" />
            </div>
            <div className="hidden sm:block mobile-ls:hidden min-w-0 max-w-[175px]">
              <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-[#0284C7] dark:text-[#38BDF8] leading-tight">
                Game Hub · {playableGames.length} Trò
              </p>
              <p className="text-xs font-semibold text-[#0A192F] dark:text-[#E2E8F0] leading-tight truncate">
                {activeGameMeta?.shortTitle ?? 'Kho Game'}
              </p>
            </div>
          </div>

          {/* 1-Row Horizontal Scrollable Quick Switcher */}
          <div
            role="tablist"
            aria-label="Chuyển nhanh trò chơi"
            className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
          >
            {playableGames.map((item) => {
              const isSelected = activeGame === item.gameKey;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  data-testid={`hub-quick-${item.id}`}
                  title={item.subtitle}
                  onClick={() => setActiveGame(item.gameKey!)}
                  className={`inline-flex items-center gap-1.5 min-h-[38px] mobile-ls:min-h-[30px] px-2.5 py-1 mobile-ls:px-2 mobile-ls:py-0.5 rounded-lg border text-xs mobile-ls:text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8] shadow-sm'
                      : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#334155] dark:text-[#CBD5E1] border-[#DCE6F2] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                  }`}
                >
                  {renderGameIcon(item.gameKey, isSelected)}
                  <span>{item.shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Controls: PWA Install + Catalog Drawer Toggle + Fullscreen F11 */}
          <div className="flex items-center gap-1.5 mobile-ls:gap-1 shrink-0">
            <div className="hidden sm:block">
              <PwaInstallButton compact className="min-h-[40px] mobile-ls:min-h-[30px] px-2.5 mobile-ls:px-2 text-[11px]" />
            </div>
            <button
              type="button"
              data-testid="hub-catalog-toggle"
              onClick={() => setHubExpanded((v) => !v)}
              aria-expanded={hubExpanded}
              title="Mở / Thu gọn danh mục phân loại"
              className="min-h-[40px] mobile-ls:min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 mobile-ls:px-2 mobile-ls:py-0.5 rounded-lg border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] text-[11px] font-semibold text-[#334155] dark:text-[#CBD5E1] hover:border-[#0284C7] cursor-pointer whitespace-nowrap"
            >
              <span className="hidden md:inline">{hubExpanded ? 'Thu gọn' : 'Danh mục'}</span>
              <span className="md:hidden">{hubExpanded ? 'Đóng' : 'Menu'}</span>
              {hubExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              data-testid="hub-fullscreen-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F11)'}
              title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F11)'}
              className="min-h-[40px] mobile-ls:min-h-[30px] inline-flex items-center gap-1 px-2.5 py-1 mobile-ls:px-2 mobile-ls:py-0.5 rounded-lg border border-sky-500/40 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] font-mono font-bold hover:border-sky-400 cursor-pointer whitespace-nowrap"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">{isFullscreen ? 'Esc' : 'F11'}</span>
              <span className="lg:hidden">{isFullscreen ? 'Thu nhỏ' : 'Toàn Màn'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Categorized Game Drawer */}
        {hubExpanded && (
          <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#1E2E4A] space-y-2.5">
            <div
              role="group"
              aria-label="Lọc theo danh mục game"
              className="flex flex-wrap items-center gap-1.5"
            >
              <button
                type="button"
                data-testid="hub-cat-all"
                onClick={() => setSelectedCategory('all')}
                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8]'
                    : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#475569] dark:text-[#CBD5E1] border-[#DCE6F2] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                }`}
              >
                Tất Cả ({playableGames.length})
              </button>
              {GAME_CATEGORIES.map((cat) => {
                const count = GAME_CATALOG.filter((g) => g.category === cat.id && g.playable).length;
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    data-testid={`hub-cat-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8]'
                        : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#475569] dark:text-[#CBD5E1] border-[#DCE6F2] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                    }`}
                  >
                    <span className="sm:hidden">{cat.shortLabel}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                    <span className="ml-1 opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            <div
              aria-label="Danh sách trò chơi phân theo danh mục"
              className={`grid gap-2.5 ${
                selectedCategory === 'all' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {visibleCategories.map((cat) => {
                const items = GAME_CATALOG.filter((g) => g.category === cat.id);
                return (
                  <div
                    key={cat.id}
                    data-testid={`hub-group-${cat.id}`}
                    className="rounded-xl border border-[#E2E8F0] dark:border-[#1E2E4A] bg-[#F8FAFC]/80 dark:bg-[#080F1D]/80 p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 px-0.5">
                      <span
                        className={`text-[11px] font-mono font-bold uppercase tracking-[0.08em] ${cat.accentClass}`}
                      >
                        {cat.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                        {items.filter((i) => i.playable).length} game
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {items.map((item) => {
                        if (item.playable && item.gameKey) {
                          const isSelected = activeGame === item.gameKey;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              title={item.subtitle}
                              onClick={() => {
                                setActiveGame(item.gameKey!);
                                setHubExpanded(false);
                              }}
                              className={`inline-flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8] shadow-sm'
                                  : 'bg-white dark:bg-[#111C33] text-[#070B14] dark:text-[#E2E8F0] border-[#DCE6F2] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                              }`}
                            >
                              {renderGameIcon(item.gameKey, isSelected)}
                              <span className="text-xs font-semibold whitespace-nowrap">{item.title}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap ${
                                  isSelected
                                    ? 'bg-white/15 text-amber-200'
                                    : 'bg-[#E2E8F0] dark:bg-[#1E2E4A] text-[#334155] dark:text-[#CBD5E1]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            </button>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            title={item.subtitle}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-[#CBD8E6] dark:border-[#1E2E4A] bg-white/60 dark:bg-[#080F1D] text-[#64748B] dark:text-[#94A3B8]"
                          >
                            {item.id.includes('gomoku') ? (
                              <Grid3X3 className="w-3 h-3 opacity-70 shrink-0" aria-hidden="true" />
                            ) : (
                              <Layers className="w-3 h-3 opacity-70 shrink-0" aria-hidden="true" />
                            )}
                            <span className="text-[11px] font-medium whitespace-nowrap">
                              <span className="sm:hidden">{item.shortTitle}</span>
                              <span className="hidden sm:inline">{item.title}</span>
                            </span>
                            <span className="text-[10px] font-mono opacity-75 whitespace-nowrap">
                              ({item.badge})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Game Viewport (supports native + CSS fallback Fullscreen via F11 / Esc) */}
      <div
        ref={gameViewportRef}
        data-testid="game-viewport"
        data-fullscreen={isFullscreen ? 'true' : 'false'}
        data-edge-to-edge={isFullscreen && activeGame === 'cat_finder' ? 'true' : undefined}
        className={
          isFullscreen
            ? activeGame === 'cat_finder'
              ? 'fixed inset-0 z-50 bg-[#FFF9F2] overflow-hidden overscroll-none p-0 flex flex-col'
              : 'fixed inset-0 z-50 w-full h-[100dvh] bg-[#050811] overflow-y-auto overscroll-none p-1 sm:p-2 flex flex-col'
            : 'relative overscroll-none'
        }
      >
        {isFullscreen &&
          activeGame !== 'prism_td' &&
          activeGame !== 'traffic_router' &&
          activeGame !== 'cat_finder' &&
          activeGame !== 'thanh_minh' &&
          activeGame !== 'cloud_valley' && (
          <button
            type="button"
            data-testid="hub-exit-fullscreen-btn"
            onClick={exitFullscreen}
            style={{
              top: 'max(0.5rem, env(safe-area-inset-top, 0px))',
              right: 'max(0.625rem, env(safe-area-inset-right, 0px))',
            }}
            className="fixed z-[60] min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900/95 hover:bg-slate-800 border border-sky-400/60 text-sky-200 text-xs font-mono font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Esc · Thoát Toàn Màn Hình</span>
            <span className="lg:hidden">Thoát</span>
          </button>
        )}

        <div className={isFullscreen ? 'game-fs-inner w-full flex-1 flex flex-col min-h-0' : undefined}>
          <LazyLoadErrorBoundary resetKey={activeGame} label={activeGameMeta?.title ?? 'trò chơi'}>
            <Suspense
              fallback={
                <div className="min-h-[340px] rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white/80 dark:bg-[#0B1222]/90 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Đang mở {activeGameMeta?.title ?? 'trò chơi'}...
                  </p>
                </div>
              }
            >
              {activeGame === 'cloud_valley' && (
                <CloudValleyGameSection
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              )}
              {activeGame === 'xiangqi' && <XiangqiGameSection theme={theme} onToggleTheme={onToggleTheme} />}
              {activeGame === 'chess' && <ChessGameSection theme={theme} onToggleTheme={onToggleTheme} />}
              {activeGame === 'cat_finder' && (
                <CatFinderGameSection
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  onExitFullscreen={exitFullscreen}
                />
              )}
              {activeGame === 'anomaly' && <AnomalyGameSection theme={theme} onToggleTheme={onToggleTheme} />}
              {activeGame === 'thanh_minh' && (
                <ThanhMinhGameSection
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  onExitFullscreen={exitFullscreen}
                />
              )}
              {activeGame === 'asmr_organizer' && (
                <AsmrOrganizerGameSection theme={theme} onToggleTheme={onToggleTheme} />
              )}
              {activeGame === 'blind_box' && (
                <BlindBoxMergeGameSection theme={theme} onToggleTheme={onToggleTheme} />
              )}
              {activeGame === 'prism_td' && (
                <PrismTdGameSection
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  onExitFullscreen={exitFullscreen}
                />
              )}
              {activeGame === 'linux_hacker' && (
                <LinuxHackerGameSection theme={theme} onToggleTheme={onToggleTheme} />
              )}
              {activeGame === 'traffic_router' && (
                <TrafficRouterGameSection
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              )}
              {activeGame === 'fe_academy' && (
                <FeAcademyGameSection theme={theme} onToggleTheme={onToggleTheme} />
              )}
            </Suspense>
          </LazyLoadErrorBoundary>
        </div>
      </div>
    </div>
  );
}
