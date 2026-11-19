import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { AppRoute } from '../utils/portfolioLogic.ts';

interface TopBarAndHeaderProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

export function TopBarAndHeader({ activeRoute, onNavigate }: TopBarAndHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#D7E2EE] dark:border-[#1B2B44] bg-[#F4F7FB]/95 dark:bg-[#05080F]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('profile', 'overview');
          }}
          className="font-display text-2xl font-bold tracking-tight text-[#070B14] dark:text-[#F1F5F9] whitespace-nowrap shrink-0 hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors"
        >
          {PORTFOLIO_PROFILE.fullName}
        </a>

        {/* Zone 2: Clean route & section links (supports both mobile screen switch & desktop links) */}
        <nav
          aria-label="Điều hướng chính"
          className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-[#475569] dark:text-[#94A3B8]"
        >
          <a
            href="/"
            aria-current={activeRoute === 'profile' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'overview');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#070B14] dark:hover:text-[#F1F5F9] ${
              activeRoute === 'profile'
                ? 'text-[#070B14] dark:text-[#F1F5F9] font-semibold underline underline-offset-4 decoration-[#0284C7] dark:decoration-[#38BDF8]'
                : ''
            }`}
          >
            Hồ Sơ
          </a>

          <a
            href="/#systems"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'systems');
            }}
            className="hidden md:inline-block hover:text-[#070B14] dark:hover:text-[#F1F5F9] hover:underline underline-offset-4 decoration-[#0284C7] dark:decoration-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
          >
            Dự Án
          </a>

          <a
            href="/#skills"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'skills');
            }}
            className="hidden md:inline-block hover:text-[#070B14] dark:hover:text-[#F1F5F9] hover:underline underline-offset-4 decoration-[#0284C7] dark:decoration-[#38BDF8] transition-colors whitespace-nowrap shrink-0"
          >
            Kỹ Thuật
          </a>

          <a
            href="/trien-lam"
            aria-current={activeRoute === 'gallery' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('gallery');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#0369A1] dark:hover:text-[#38BDF8] ${
              activeRoute === 'gallery'
                ? 'text-[#0369A1] dark:text-[#38BDF8] font-semibold underline underline-offset-4'
                : ''
            }`}
          >
            Triển Lãm Ảnh
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
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white transition-colors whitespace-nowrap shrink-0"
          >
            Kết Nối
          </a>
        </div>
      </div>
    </header>
  );
}
