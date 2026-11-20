import { useState } from 'react';
import { Code2, FileSearch, Gamepad2, Grid3X3, Layers, LayoutGrid, Sparkles, Zap } from 'lucide-react';
import { ThemeMode } from '../utils/portfolioLogic.ts';
import { AnomalyGameSection } from './AnomalyGameSection.tsx';
import { AsmrOrganizerGameSection } from './AsmrOrganizerGameSection.tsx';
import { LinuxHackerGameSection } from './LinuxHackerGameSection.tsx';
import { PrismTdGameSection } from './PrismTdGameSection.tsx';
import { XiangqiGameSection } from './XiangqiGameSection.tsx';

type GameId = 'xiangqi' | 'anomaly' | 'asmr_organizer' | 'prism_td' | 'linux_hacker';

interface GameCatalogItem {
  id: string;
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
    title: 'Cờ Tướng AI',
    shortTitle: 'Cờ Tướng',
    subtitle: '2D Canvas · 10 Cấp Độ (Tân Binh → Kỳ Vương)',
    badge: '10 Cấp',
    playable: true,
    gameKey: 'xiangqi',
  },
  {
    id: 'anomaly',
    title: 'Kiểm Duyệt Hồ Sơ',
    shortTitle: 'Hồ Sơ Dị Biệt',
    subtitle: 'Minimalist Document Inspection · 12 Ngày · 60 Hồ Sơ Dị Biệt',
    badge: '12 Ngày',
    playable: true,
    gameKey: 'anomaly',
  },
  {
    id: 'asmr-organizer',
    title: 'Sắp Xếp Góc Nhỏ',
    shortTitle: 'Chuẩn OCD',
    subtitle: 'ASMR Aesthetic Organizer · Kéo xoay xếp góc pastel chuẩn OCD',
    badge: '6 Góc ASMR',
    playable: true,
    gameKey: 'asmr_organizer',
  },
  {
    id: 'prism-td',
    title: 'Thủ Thành Laser',
    shortTitle: 'Mạch Laser',
    subtitle: 'Prism & Mirror Circuit TD · 10 Bản đồ · 10 Vũ khí nâng cấp Lv3 · Tự động gọi đợt 10s',
    badge: '10 Bản đồ',
    playable: true,
    gameKey: 'prism_td',
  },
  {
    id: 'linux-hacker',
    title: 'Hacker Ubuntu CLI',
    shortTitle: 'Ubuntu CLI',
    subtitle: 'Học Như Chơi · 8 Lĩnh Vực Linux → Docker → Cloud DevOps (16 Màn)',
    badge: '16 Màn · 8 Lĩnh Vực',
    playable: true,
    gameKey: 'linux_hacker',
  },
  {
    id: 'gomoku-planned',
    title: 'Cờ Caro 5 Ô',
    shortTitle: 'Cờ Caro',
    subtitle: 'Trò chơi trí tuệ bàn 15×15 · Dự kiến mở rộng',
    badge: 'Lộ trình',
    playable: false,
  },
  {
    id: '2048-planned',
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

export function GameHubSection({ theme, onToggleTheme }: GameHubSectionProps) {
  const [activeGame, setActiveGame] = useState<GameId>(() => {
    if (typeof window !== 'undefined') {
      const playParam = new URLSearchParams(window.location.search).get('play');
      if (playParam === 'anomaly') return 'anomaly';
      if (playParam === 'asmr' || playParam === 'ocd' || playParam === 'organizer') {
        return 'asmr_organizer';
      }
      if (playParam === 'prism' || playParam === 'prism-td' || playParam === 'laser') return 'prism_td';
      if (playParam === 'linux' || playParam === 'ubuntu' || playParam === 'cli' || playParam === 'hacker') {
        return 'linux_hacker';
      }
    }
    return 'xiangqi';
  });

  return (
    <div id="game-hub" className="pt-3 sm:pt-4 pb-8 space-y-2.5 sm:space-y-3">
      {/* Compact Multi-Game Hub Switcher inside the unified "Game" tab */}
      <div
        role="region"
        aria-label="Kho Trò Chơi 2D Đa Tựa Game"
        className="rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-white/95 dark:bg-[#0B1222]/95 px-3 py-2 sm:px-4 sm:py-2.5 shadow-[0_8px_24px_-16px_rgba(10,25,47,0.12)]"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div
              aria-hidden="true"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0A192F] dark:bg-[#0284C7] text-white flex items-center justify-center shrink-0"
            >
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#0284C7] dark:text-[#38BDF8] leading-tight">
                Tab Game · Kho Trò Chơi 2D
              </p>
              <p className="text-[11px] sm:text-xs text-[#475569] dark:text-[#94A3B8] leading-tight">
                Nền tảng tích hợp nhiều game giải trí trên một tab
              </p>
            </div>
          </div>

          {/* Single-line wrapped Game Catalog Switcher */}
          <div
            className="flex flex-wrap items-center gap-1.5 sm:gap-2"
            role="tablist"
            aria-label="Danh sách trò chơi trong tab Game"
          >
            {GAME_CATALOG.map((item) => {
              if (item.playable && item.gameKey) {
                const isSelected = activeGame === item.gameKey;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveGame(item.gameKey!)}
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0A192F] dark:bg-[#0284C7] text-white border-[#0A192F] dark:border-[#38BDF8] shadow-sm'
                        : 'bg-[#F8FAFC] dark:bg-[#111C33] text-[#070B14] dark:text-[#E2E8F0] border-[#DCE6F2] dark:border-[#1E2E4A] hover:border-[#0284C7]'
                    }`}
                  >
                    {item.gameKey === 'anomaly' ? (
                      <FileSearch
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-amber-300' : 'text-rose-600 dark:text-rose-400'
                        }`}
                        aria-hidden="true"
                      />
                    ) : item.gameKey === 'asmr_organizer' ? (
                      <LayoutGrid
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                        aria-hidden="true"
                      />
                    ) : item.gameKey === 'prism_td' ? (
                      <Zap
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-cyan-300' : 'text-cyan-600 dark:text-cyan-400'
                        }`}
                        aria-hidden="true"
                      />
                    ) : item.gameKey === 'linux_hacker' ? (
                      <Code2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                        aria-hidden="true"
                      />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                    )}
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
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-dashed border-[#CBD8E6] dark:border-[#1E2E4A] bg-[#F8FAFC]/70 dark:bg-[#080F1D] text-[#64748B] dark:text-[#94A3B8]"
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
      </div>

      {/* Active Game Viewport */}
      {activeGame === 'xiangqi' && (
        <XiangqiGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'anomaly' && (
        <AnomalyGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'asmr_organizer' && (
        <AsmrOrganizerGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'prism_td' && (
        <PrismTdGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
      {activeGame === 'linux_hacker' && (
        <LinuxHackerGameSection theme={theme} onToggleTheme={onToggleTheme} />
      )}
    </div>
  );
}
