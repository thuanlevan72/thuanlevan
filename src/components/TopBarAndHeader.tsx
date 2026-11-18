import { Moon, Sprout, Sun } from 'lucide-react';
import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface TopBarAndHeaderProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const NAV_LINKS = [
  { href: '#overview', label: 'Giới Thiệu' },
  { href: '#wood-identity', label: 'Bản Sắc Mộc' },
  { href: '#stats', label: 'Chỉ Số' },
  { href: '#architecture', label: 'Hệ Thống Lớn' },
  { href: '#skills', label: 'Kỹ Thuật' },
  { href: '#terminal', label: 'Terminal Live' },
] as const;

export function TopBarAndHeader({ theme, onToggleTheme }: TopBarAndHeaderProps) {
  const isDark = theme === 'dark';

  return (
    <>
      {/* Live Telemetry Status Bar: Năng Lượng Mệnh Mộc & Theme Switcher */}
      <div className="border-b border-light-outline/60 dark:border-dark-outline bg-light-surface/90 dark:bg-dark-surface/90 leaf-glass sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3 font-mono text-label-sm">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-light-primary dark:bg-dark-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-light-primary dark:bg-dark-primary shadow-[0_0_10px_#10B981]" />
              </span>
              <span className="text-light-primary dark:text-dark-primary font-semibold truncate">
                MỆNH MỘC 2002 • DƯƠNG LIỄU MỘC
              </span>
            </div>
            <span className="hidden md:inline text-light-on-surface-variant dark:text-dark-on-surface-variant">
              /
            </span>
            <span className="hidden md:inline text-light-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">
              THỦY SINH MỘC:{' '}
              <span className="text-cyan dark:text-sky-400 font-bold">FLOW 0.42ms</span>
            </span>
            <span className="hidden xl:inline text-light-on-surface-variant dark:text-dark-on-surface-variant">
              /
            </span>
            <span className="hidden xl:inline text-light-on-surface-variant dark:text-dark-on-surface-variant whitespace-nowrap">
              CỐT CÁCH:{' '}
              <span className="text-light-on-surface dark:text-dark-on-surface font-semibold">
                C# .NET 8 / CLEAN ARCH
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              aria-label="Chuyển đổi giao diện Sáng / Tối"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-surface-variant dark:bg-dark-surface-variant border border-light-outline dark:border-dark-outline text-light-on-surface dark:text-dark-on-surface hover:border-light-primary dark:hover:border-dark-primary transition shadow-sm cursor-pointer"
            >
              {isDark ? (
                <Moon className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
              ) : (
                <Sun className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              )}
              <span id="theme-text" className="text-label-sm font-mono font-medium whitespace-nowrap">
                {isDark ? 'Chế độ Tối' : 'Chế độ Sáng'}
              </span>
            </button>

            <span className="hidden sm:inline text-light-on-surface-variant dark:text-dark-on-surface-variant">
              •
            </span>
            <a
              href={PORTFOLIO_PROFILE.phoneHref}
              className="hidden sm:inline text-light-primary dark:text-dark-primary font-bold hover:underline"
            >
              {PORTFOLIO_PROFILE.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="border-b border-light-outline/50 dark:border-dark-outline/70 bg-light-surface-variant/80 dark:bg-dark-surface-variant/40 leaf-glass transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-dark-primary/30 border border-emerald-400 dark:border-dark-primary/40 flex items-center justify-center font-mono font-bold text-light-primary dark:text-dark-primary shadow-[0_4px_15px_rgba(4,120,87,0.15)] shrink-0">
              TL
            </div>
            <div className="min-w-0">
              <div className="font-headline font-bold text-headline-md tracking-tight flex flex-wrap items-center gap-2">
                <span className="text-light-on-surface dark:text-dark-on-surface whitespace-nowrap">
                  {PORTFOLIO_PROFILE.fullName}
                </span>
                <span className="text-label-sm font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-dark-primary/10 text-emerald-900 dark:text-dark-primary border border-emerald-300 dark:border-dark-primary/30 font-semibold whitespace-nowrap">
                  {PORTFOLIO_PROFILE.birthInfo}
                </span>
              </div>
              <p className="text-body-sm text-light-on-surface-variant dark:text-dark-on-surface-variant truncate">
                {PORTFOLIO_PROFILE.subtitle}
              </p>
            </div>
          </div>

          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-0.5 bg-light-surface/80 dark:bg-dark-surface/70 p-1 rounded-lg border border-light-outline dark:border-dark-outline text-[13px] xl:text-label-lg font-body shadow-sm shrink-0"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-2.5 xl:px-3 py-1.5 rounded text-light-on-surface dark:text-dark-on-surface hover:text-light-primary dark:hover:text-dark-primary hover:bg-light-surface-variant dark:hover:bg-dark-surface-variant transition whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={PORTFOLIO_PROFILE.phoneHref}
              className="inline-flex items-center gap-2 px-4 xl:px-5 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-body font-semibold text-label-lg transition active:scale-95 shadow-[0_4px_16px_rgba(4,120,87,0.35)] whitespace-nowrap"
            >
              <Sprout className="w-5 h-5" aria-hidden="true" />
              <span>Kết Nối Ngay</span>
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
