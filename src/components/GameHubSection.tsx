import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Code2,
  Cpu,
  FileSearch,
  Gamepad2,
  Gauge,
  Gift,
  Grid3X3,
  Layers,
  LayoutGrid,
  Network,
  Sparkles,
  Swords,
  Zap,
} from 'lucide-react';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import { AnomalyGameSection } from './AnomalyGameSection.tsx';
import { AsmrOrganizerGameSection } from './AsmrOrganizerGameSection.tsx';
import { BlindBoxMergeGameSection } from './BlindBoxMergeGameSection.tsx';
import { FeAcademyGameSection } from './FeAcademyGameSection.tsx';
import { FidgetCockpitGameSection } from './FidgetCockpitGameSection.tsx';
import { GearArenaGameSection } from './GearArenaGameSection.tsx';
import { LinuxHackerGameSection } from './LinuxHackerGameSection.tsx';
import { PrismTdGameSection } from './PrismTdGameSection.tsx';
import { TrafficRouterGameSection } from './TrafficRouterGameSection.tsx';
import { XiangqiGameSection } from './XiangqiGameSection.tsx';

type GameId =
  | 'xiangqi'
  | 'anomaly'
  | 'asmr_organizer'
  | 'blind_box'
  | 'prism_td'
  | 'linux_hacker'
  | 'traffic_router'
  | 'gear_arena'
  | 'fidget_cockpit'
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
    id: 'prism-td',
    category: 'strategy',
    title: 'Thủ Thành Pháo Đài',
    shortTitle: 'Pháo Đài',
    subtitle: 'Pure Gun TD · 16 Màn · 4 Cấp (+20%) · 4 Chế Độ · 16 Súng Thuần Lv10 & 12 Quái',
    badge: '16 Súng · 4 Chế Độ',
    playable: true,
    gameKey: 'prism_td',
  },
  {
    id: 'gear-arena',
    category: 'strategy',
    title: 'Đấu Trường Ba Lô',
    shortTitle: 'Ba Lô Cơ Khí',
    subtitle: 'Gear-Grid Auto Arena · 12 Súng · 14 Phụ Kiện · 4 Chế Độ · Đấu Boss & Bóng Ma PvP',
    badge: '12 Súng · 4 Chế Độ',
    playable: true,
    gameKey: 'gear_arena',
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
    subtitle: 'System Architecture Designer · 24 Hoàn Cảnh · 5 Chế Độ Chơi · Đa giải pháp S/A/B/C',
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
    id: 'fidget-cockpit',
    category: 'arcade',
    title: 'Buồng Lái 15s',
    shortTitle: 'Buồng Lái 15s',
    subtitle: '15-Second Fidget Cockpit · WarioWare 3–5s liên hoàn + Overdrive pháo hoa',
    badge: 'Fidget · 15s',
    playable: true,
    gameKey: 'fidget_cockpit',
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
  if (gameKey === 'gear_arena') {
    return (
      <Swords
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-rose-300' : 'text-rose-600 dark:text-rose-400'
        }`}
        aria-hidden="true"
      />
    );
  }
  if (gameKey === 'fidget_cockpit') {
    return (
      <Gauge
        className={`w-3.5 h-3.5 shrink-0 ${
          isSelected ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'
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
      if (playParam === 'anomaly') return 'anomaly';
      if (playParam === 'asmr' || playParam === 'ocd' || playParam === 'organizer') {
        return 'asmr_organizer';
      }
      if (playParam === 'blindbox' || playParam === 'squishy' || playParam === 'tuimu') {
        return 'blind_box';
      }
      if (
        playParam === 'prism' ||
        playParam === 'prism-td' ||
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
      if (playParam === 'gear' || playParam === 'arena' || playParam === 'backpack' || playParam === 'balo') {
        return 'gear_arena';
      }
      if (playParam === 'cockpit' || playParam === 'fidget' || playParam === '15s' || playParam === 'buonglai') {
        return 'fidget_cockpit';
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
  const [hubExpanded, setHubExpanded] = useState<boolean>(true);

  const visibleCategories =
    selectedCategory === 'all'
      ? GAME_CATEGORIES
      : GAME_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  const activeGameMeta = GAME_CATALOG.find((g) => g.gameKey === activeGame);

  return (
    <div id="game-hub" className="pt-3 sm:pt-4 pb-8 space-y-2.5 sm:space-y-3">
      {/* Categorized Multi-Game Hub Switcher inside the unified "Game" tab */}
      <div
        role="region"
        aria-label="Kho Trò Chơi 2D Theo Danh Mục"
        className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white/95 dark:bg-[#0B1222]/95 px-3 py-2.5 sm:px-4 sm:py-3 shadow-[0_8px_24px_-16px_rgba(10,25,47,0.12)] space-y-2.5"
      >
        {/* Top Row: Hub Title + Category Filter Tabs + Collapse Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                aria-hidden="true"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0A192F] dark:bg-[#0284C7] text-white flex items-center justify-center shrink-0"
              >
                <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#0284C7] dark:text-[#38BDF8] leading-tight">
                  Tab Game · Danh Mục Trò Chơi
                </p>
                <p className="text-[11px] sm:text-xs text-[#475569] dark:text-[#94A3B8] leading-tight truncate">
                  {activeGameMeta
                    ? `Đang mở: ${activeGameMeta.title} (${activeGameMeta.badge})`
                    : 'Nền tảng tích hợp nhiều thể loại game giải trí'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setHubExpanded((v) => !v)}
              aria-expanded={hubExpanded}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#F8FAFC] dark:bg-[#111C33] text-[11px] font-medium text-[#334155] dark:text-[#CBD5E1] cursor-pointer shrink-0"
            >
              <span>{hubExpanded ? 'Thu gọn' : 'Mở danh mục'}</span>
              {hubExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Category Filter Buttons */}
          <div
            role="group"
            aria-label="Lọc theo danh mục game"
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              data-testid="hub-cat-all"
              onClick={() => {
                setSelectedCategory('all');
                setHubExpanded(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8]'
                  : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#475569] dark:text-[#CBD5E1] border-[#DCE6F2] dark:border-[#1E2E4A] hover:border-[#0284C7]'
              }`}
            >
              Tất Cả ({GAME_CATALOG.filter((g) => g.playable).length})
            </button>
            {GAME_CATEGORIES.map((cat) => {
              const count = GAME_CATALOG.filter((g) => g.category === cat.id && g.playable).length;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  data-testid={`hub-cat-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setHubExpanded(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
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
        </div>

        {/* Categorized Game Sections */}
        {hubExpanded && (
          <div
            role="tablist"
            aria-label="Danh sách trò chơi phân theo danh mục"
            className={`pt-2 border-t border-[#E2E8F0] dark:border-[#1E2E4A] grid gap-2.5 ${
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
                            role="tab"
                            aria-selected={isSelected}
                            title={item.subtitle}
                            onClick={() => setActiveGame(item.gameKey!)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
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
        )}
      </div>

      {/* Active Game Viewport */}
      {activeGame === 'xiangqi' && <XiangqiGameSection theme={theme} onToggleTheme={onToggleTheme} />}
      {activeGame === 'anomaly' && <AnomalyGameSection theme={theme} onToggleTheme={onToggleTheme} />}
      {activeGame === 'asmr_organizer' && (
        <AsmrOrganizerGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'blind_box' && (
        <BlindBoxMergeGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'prism_td' && <PrismTdGameSection theme={theme} onToggleTheme={onToggleTheme} />}
      {activeGame === 'linux_hacker' && (
        <LinuxHackerGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'traffic_router' && (
        <TrafficRouterGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'gear_arena' && (
        <GearArenaGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'fidget_cockpit' && (
        <FidgetCockpitGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'fe_academy' && (
        <FeAcademyGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
    </div>
  );
}
