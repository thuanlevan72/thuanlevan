import { ArrowUpRight, ChevronDown, Moon, Sun } from 'lucide-react';
import { HERO_METRICS, PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface HeroSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenGalleryScreen: () => void;
}

export function HeroSection({
  theme,
  onToggleTheme,
  onOpenGalleryScreen,
}: HeroSectionProps) {
  return (
    <section id="overview" className="scroll-mt-24 pt-6 sm:pt-10 pb-6 space-y-12">
      {/* Subtle Top Utility Strip matching /cv and /trien-lam */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE6F2]/75 dark:border-[#182740]/80 pb-4">
        <p className="text-xs sm:text-sm font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
          {PORTFOLIO_PROFILE.fullLegalName} · {PORTFOLIO_PROFILE.birthInfo} ·{' '}
          {PORTFOLIO_PROFILE.location}
        </p>

        <button
          id="theme-toggle-btn"
          type="button"
          onClick={onToggleTheme}
          aria-label="Chuyển đổi giao diện Sáng / Tối"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#DCE6F2] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 text-xs font-medium text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
          )}
          <span id="theme-text">{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Typographic Engineering Profile Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8 py-1">
          <div className="space-y-6">
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-[58px] leading-[1.08] tracking-[-0.02em] text-[#070B14] dark:text-[#F1F5F9] max-w-2xl text-balance">
              Kỹ Sư Hệ Thống .NET &amp; Kiến Trúc Doanh Nghiệp.
            </h1>

            <p className="text-base sm:text-[17px] text-[#475569] dark:text-[#94A3B8] leading-[1.72] max-w-xl text-pretty">
              Tôi là{' '}
              <strong className="text-[#070B14] dark:text-[#F1F5F9] font-semibold">
                {PORTFOLIO_PROFILE.fullName}
              </strong>{' '}
              — kỹ sư Backend C# .NET với gần 4 năm trực tiếp xây dựng và vận hành các hệ thống tải
              cao trong lĩnh vực ngân hàng (Agribank), y tế thông minh (Phenikaa MEC) và nền tảng AI
              (MISA OneAI).
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#systems"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-semibold text-sm shadow-[0_8px_20px_-8px_rgba(10,25,47,0.45)] dark:shadow-[0_8px_24px_-8px_rgba(2,132,199,0.55)] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                <span>Xem Dự Án Hệ Thống</span>
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </a>

              <a
                href="/trien-lam"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenGalleryScreen();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#CBD8E6] dark:border-[#1E3250] bg-white/85 dark:bg-[#0B1220]/85 hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[#0A192F] dark:text-[#F1F5F9] hover:text-[#0369A1] dark:hover:text-[#38BDF8] font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                <span>Mở Triển Lãm Ảnh AI</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-[13px] text-[#475569] dark:text-[#94A3B8]">
              <span>C# .NET 8 &amp; Clean Architecture</span>
              <span aria-hidden="true" className="text-[#0284C7]/60">
                ·
              </span>
              <span>Oracle, PostgreSQL &amp; Kafka</span>
              <span aria-hidden="true" className="text-[#0284C7]/60">
                ·
              </span>
              <span>AI Agents (Claude, Gemini, Codex, Grok)</span>
            </div>
          </div>
        </div>

        {/* Right Authentic Engineer Portrait Anchor (balanced vertical portrait ratio) */}
        <div className="lg:col-span-5 flex lg:justify-end">
          <figure className="relative w-full max-w-[390px] mx-auto lg:mx-0 aspect-[4/5] rounded-3xl overflow-hidden border border-[#DCE6F2] dark:border-[#1B2B44] bg-[#060B14] shadow-[0_24px_48px_-24px_rgba(10,25,47,0.35)] dark:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.85)]">
            <img
              src={PORTFOLIO_PROFILE.realPortraitSrc}
              alt={`Chân dung đời thực của kỹ sư ${PORTFOLIO_PROFILE.fullLegalName} tại Hà Nội`}
              width={810}
              height={1440}
              loading="eager"
              decoding="sync"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[50%_18%]"
            />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#040914]/94 via-[#071426]/60 to-transparent pointer-events-none" />

            <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-white space-y-1">
              <p className="text-xs font-mono text-[#38BDF8]">
                Senior .NET Engineer · 08/2022 – Nay
              </p>
              <p className="font-display text-2xl sm:text-[26px] font-semibold leading-snug text-white">
                {PORTFOLIO_PROFILE.fullLegalName}
              </p>
              <p className="text-xs text-slate-300">
                {PORTFOLIO_PROFILE.location} · {PORTFOLIO_PROFILE.phoneFormatted}
              </p>
            </figcaption>
          </figure>
        </div>
      </div>

      {/* Full-Width 4-Column Proof Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
        {HERO_METRICS.map((metric) => (
          <div
            key={metric.id}
            className="soft-card p-5 rounded-2xl bg-white/90 dark:bg-[#0B1220]/90 border border-[#DCE6F2] dark:border-[#182740] space-y-1.5"
          >
            <div className="font-mono tabular-nums text-2xl sm:text-[28px] font-medium text-[#0A192F] dark:text-[#F1F5F9]">
              {metric.value}
            </div>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-snug">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
