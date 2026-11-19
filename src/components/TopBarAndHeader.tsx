import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { AppRoute } from '../utils/portfolioLogic.ts';

interface TopBarAndHeaderProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

export function TopBarAndHeader({ activeRoute, onNavigate }: TopBarAndHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E0D6] dark:border-[#27262B] bg-[#FAF8F5]/95 dark:bg-[#0B0B0E]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('profile', 'overview');
          }}
          className="font-display text-2xl font-bold tracking-tight text-[#181615] dark:text-[#F4F1EC] whitespace-nowrap shrink-0 hover:text-[#9F1239] dark:hover:text-[#FB7185] transition-colors"
        >
          {PORTFOLIO_PROFILE.fullName}
        </a>

        {/* Zone 2: Clean route & section links (supports both mobile screen switch & desktop links) */}
        <nav
          aria-label="Điều hướng chính"
          className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-[#5E5852] dark:text-[#A8A29E]"
        >
          <a
            href="/"
            aria-current={activeRoute === 'profile' ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'overview');
            }}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#181615] dark:hover:text-[#F4F1EC] ${
              activeRoute === 'profile'
                ? 'text-[#181615] dark:text-[#F4F1EC] font-semibold underline underline-offset-4 decoration-[#9F1239] dark:decoration-[#FB7185]'
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
            className="hidden md:inline-block hover:text-[#181615] dark:hover:text-[#F4F1EC] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Dự Án
          </a>

          <a
            href="/#skills"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'skills');
            }}
            className="hidden md:inline-block hover:text-[#181615] dark:hover:text-[#F4F1EC] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
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
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#9F1239] dark:hover:text-[#FB7185] ${
              activeRoute === 'gallery'
                ? 'text-[#9F1239] dark:text-[#FB7185] font-semibold underline underline-offset-4'
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
            className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#9F1239] hover:bg-[#881337] dark:bg-[#E11D48] dark:hover:bg-[#BE123C] text-white transition-colors whitespace-nowrap shrink-0"
          >
            Kết Nối
          </a>
        </div>
      </div>
    </header>
  );
}
