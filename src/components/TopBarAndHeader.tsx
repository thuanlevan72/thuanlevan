import { RefreshCw } from 'lucide-react';
import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { AppRoute } from '../utils/portfolioLogic.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface TopBarAndHeaderProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
  hasWebUpdate?: boolean;
  onOpenWebUpdate?: () => void;
}

export function TopBarAndHeader({
  activeRoute,
  onNavigate,
  hasWebUpdate = false,
  onOpenWebUpdate,
}: TopBarAndHeaderProps) {
  const navLinkClass = (isActive: boolean) =>
    `relative py-1.5 whitespace-nowrap shrink-0 transition-colors duration-200 ${
      isActive
        ? 'text-[#070B14] dark:text-[#F1F5F9] font-semibold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-[#0284C7] after:to-[#1D4ED8] dark:after:from-[#38BDF8] dark:after:to-[#60A5FA]'
        : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
    }`;

  return (
    <header
      className={`${
        activeRoute === 'game'
          ? 'sticky top-0 mobile-ls:hidden bg-[#F5F8FC]/97 dark:bg-[#05080F]/97'
          : 'sticky top-0 bg-[#F5F8FC]/88 dark:bg-[#05080F]/88 backdrop-blur-xl'
      } z-40 border-b border-[#DCE6F2]/80 dark:border-[#182740]/85 transition-colors duration-200`}
    >
      <div
        className={`max-w-7xl mx-auto px-2.5 sm:px-6 ${
          activeRoute === 'game' ? 'h-16 mobile-ls:h-11' : 'h-16'
        } flex items-center justify-between gap-1.5 sm:gap-6`}
      >
        {/* Zone 1: Brand monogram emblem + wordmark */}
        <a
          href="/"
          aria-label={`${PORTFOLIO_PROFILE.fullName} — Trang chủ`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('profile', 'overview');
          }}
          className="inline-flex items-center gap-1.5 sm:gap-2.5 font-display text-sm sm:text-2xl font-semibold tracking-tight text-[#070B14] dark:text-[#F1F5F9] whitespace-nowrap shrink-0 hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors group"
        >
          <BrandLogo
            size={30}
            className="w-5 h-5 sm:w-[30px] sm:h-[30px] shadow-[0_6px_16px_-6px_rgba(2,132,199,0.45)] rounded-md sm:rounded-lg transition-transform duration-200 group-hover:scale-105"
          />
          <span>{PORTFOLIO_PROFILE.fullName}</span>
        </a>

        {/* Zone 2: Clean 6-link single-line navigation */}
        <nav
          aria-label="Điều hướng chính"
          className="flex items-center gap-2 sm:gap-5 lg:gap-7 text-[11px] sm:text-sm font-medium"
        >
          <a
            href="/"
            aria-current={activeRoute === 'profile' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'overview');
            }}
            className={navLinkClass(activeRoute === 'profile')}
          >
            Hồ Sơ
          </a>

          <a
            href="/cv"
            aria-current={activeRoute === 'cv' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('cv');
            }}
            className={navLinkClass(activeRoute === 'cv')}
          >
            <span className="sm:hidden">CV</span>
            <span className="hidden sm:inline">CV PDF</span>
          </a>

          <a
            href="/trien-lam"
            aria-current={activeRoute === 'gallery' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('gallery');
            }}
            className={navLinkClass(activeRoute === 'gallery')}
          >
            <span className="sm:hidden">Ảnh</span>
            <span className="hidden sm:inline">Triển Lãm Ảnh</span>
          </a>

          <a
            href="/studio"
            aria-current={activeRoute === 'studio' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('studio');
            }}
            className={navLinkClass(activeRoute === 'studio')}
          >
            Sáng Tác
          </a>

          <a
            href="/chronos"
            aria-current={activeRoute === 'chronos' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('chronos');
            }}
            className={navLinkClass(activeRoute === 'chronos')}
          >
            <span className="sm:hidden">Chronos</span>
            <span className="hidden sm:inline">ChronosFlow</span>
          </a>

          <a
            href="/game"
            aria-current={activeRoute === 'game' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('game');
            }}
            className={navLinkClass(activeRoute === 'game')}
          >
            Game
          </a>
        </nav>

        {/* Zone 3: Web Update check + Contact action */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenWebUpdate && (
            <button
              type="button"
              data-testid="header-web-update-btn"
              onClick={onOpenWebUpdate}
              title="Kiểm tra và cập nhật phiên bản web mới nhất"
              aria-label={hasWebUpdate ? 'Cập Nhật Web — Đã có bản mới' : 'Cập Nhật Web'}
              className={`relative inline-flex items-center justify-center gap-1.5 h-7 w-7 sm:h-auto sm:w-auto sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-semibold transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                hasWebUpdate
                  ? 'border-[#0284C7] dark:border-[#38BDF8] bg-[#E0F2FE] dark:bg-[#0C2542] text-[#0369A1] dark:text-[#7DD3FC] shadow-xs'
                  : 'border-[#DCE6F2] dark:border-[#1E355A] bg-white/90 dark:bg-[#0B1222] text-[#334155] dark:text-[#CBD5E1] hover:border-[#0284C7] dark:hover:border-[#38BDF8] hover:text-[#0284C7] dark:hover:text-[#38BDF8]'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{hasWebUpdate ? 'Bản Mới' : 'Cập Nhật'}</span>
              {hasWebUpdate && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#0284C7] dark:bg-[#38BDF8] ring-2 ring-[#F5F8FC] dark:ring-[#05080F]"
                />
              )}
            </button>
          )}
          <a
            href="/#contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'contact');
            }}
            className="px-2 sm:px-4 py-1.5 sm:py-2 text-[10.5px] sm:text-sm font-semibold rounded-lg sm:rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap shrink-0"
          >
            Kết Nối
          </a>
        </div>
      </div>
    </header>
  );
}
