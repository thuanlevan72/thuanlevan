import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { AppRoute } from '../utils/portfolioLogic.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface TopBarAndHeaderProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

export function TopBarAndHeader({ activeRoute, onNavigate }: TopBarAndHeaderProps) {
  const navLinkClass = (isActive: boolean) =>
    `relative py-1.5 whitespace-nowrap shrink-0 transition-colors duration-200 ${
      isActive
        ? 'text-[#070B14] dark:text-[#F1F5F9] font-semibold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-[#0284C7] after:to-[#1D4ED8] dark:after:from-[#38BDF8] dark:after:to-[#60A5FA]'
        : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#DCE6F2]/80 dark:border-[#182740]/85 bg-[#F5F8FC]/88 dark:bg-[#05080F]/88 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand monogram emblem + wordmark */}
        <a
          href="/"
          aria-label={`${PORTFOLIO_PROFILE.fullName} — Trang chủ`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate('profile', 'overview');
          }}
          className="inline-flex items-center gap-1.5 sm:gap-2.5 font-display text-lg sm:text-2xl font-semibold tracking-tight text-[#070B14] dark:text-[#F1F5F9] whitespace-nowrap shrink-0 hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors group"
        >
          <BrandLogo
            size={30}
            className="w-6 h-6 sm:w-[30px] sm:h-[30px] shadow-[0_6px_16px_-6px_rgba(2,132,199,0.45)] rounded-md sm:rounded-lg transition-transform duration-200 group-hover:scale-105"
          />
          <span>{PORTFOLIO_PROFILE.fullName}</span>
        </a>

        {/* Zone 2: Clean route & section links */}
        <nav
          aria-label="Điều hướng chính"
          className="flex items-center gap-2 sm:gap-6 lg:gap-7 text-[11px] sm:text-sm font-medium"
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
            href="/#systems"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'systems');
            }}
            className="hidden lg:inline-block py-1.5 text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9] transition-colors whitespace-nowrap shrink-0"
          >
            Dự Án
          </a>

          <a
            href="/#skills"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'skills');
            }}
            className="hidden lg:inline-block py-1.5 text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9] transition-colors whitespace-nowrap shrink-0"
          >
            Kỹ Thuật
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
            CV PDF
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
            <span className="sm:hidden">Triển Lãm</span>
            <span className="hidden sm:inline">Triển Lãm Ảnh</span>
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

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <a
            href="/#contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'contact');
            }}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-semibold rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap shrink-0"
          >
            Kết Nối
          </a>
        </div>
      </div>
    </header>
  );
}
