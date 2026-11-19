import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { HERO_METRICS, PORTFOLIO_PROFILE } from '../data/portfolioData.ts';

interface HeroSectionProps {
  onOpenGalleryScreen: () => void;
}

export function HeroSection({ onOpenGalleryScreen }: HeroSectionProps) {
  return (
    <section id="overview" className="pt-8 sm:pt-12 pb-6 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        {/* Left Typographic Engineering Profile Column */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8 py-2">
          <div className="space-y-6">
            <p className="text-xs sm:text-sm font-medium text-[#9F1239] dark:text-[#FB7185] tracking-wide">
              Lê Văn Thuận · Nhâm Ngọ 2002 · Hoài Đức, Hà Nội
            </p>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] tracking-tight text-[#181615] dark:text-[#F4F1EC] max-w-2xl text-balance">
              Kỹ Sư Hệ Thống .NET &amp; Kiến Trúc Doanh Nghiệp.
            </h1>

            <p className="text-base sm:text-lg text-[#5E5852] dark:text-[#A8A29E] leading-relaxed max-w-xl text-pretty">
              Tôi là{' '}
              <strong className="text-[#181615] dark:text-[#F4F1EC] font-semibold">
                {PORTFOLIO_PROFILE.fullName}
              </strong>{' '}
              — kỹ sư Backend C# .NET với gần 4 năm trực tiếp xây dựng và vận hành các hệ thống tải
              cao trong lĩnh vực ngân hàng (Agribank), y tế thông minh (Phenikaa MEC) và nền tảng AI
              (MISA OneAI).
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#systems"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#181615] hover:bg-[#2E2A28] dark:bg-[#F4F1EC] dark:hover:bg-[#E5E0D8] text-[#FAF8F5] dark:text-[#0B0B0E] font-semibold text-sm transition-colors whitespace-nowrap"
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
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#D8D0C5] dark:border-[#2E2D33] hover:border-[#9F1239] dark:hover:border-[#FB7185] text-[#181615] dark:text-[#F4F1EC] font-medium text-sm transition-colors whitespace-nowrap"
              >
                <span>Mở Triển Lãm Ảnh AI</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5E5852] dark:text-[#A8A29E]">
              <span>C# .NET 8 &amp; Clean Architecture</span>
              <span aria-hidden="true">·</span>
              <span>Oracle, PostgreSQL &amp; Kafka</span>
              <span aria-hidden="true">·</span>
              <span>AI Media &amp; LLM Pipelines</span>
            </div>
          </div>
        </div>

        {/* Right Authentic Engineer Portrait Anchor */}
        <div className="lg:col-span-5 flex items-center">
          <figure className="relative w-full h-[420px] lg:h-[460px] rounded-2xl overflow-hidden border border-[#E6E0D6] dark:border-[#27262B] bg-[#181615]">
            <img
              src={PORTFOLIO_PROFILE.realPortraitSrc}
              alt={`Chân dung đời thực của kỹ sư ${PORTFOLIO_PROFILE.fullLegalName} tại Hà Nội`}
              width={810}
              height={1440}
              loading="eager"
              decoding="sync"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[50%_28%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />

            <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white space-y-1">
              <p className="text-xs font-mono text-amber-200/90">
                Senior .NET Engineer · 08/2022 – Nay
              </p>
              <p className="font-display text-xl sm:text-2xl font-semibold leading-snug text-white">
                {PORTFOLIO_PROFILE.fullLegalName}
              </p>
              <p className="text-xs text-stone-300">
                {PORTFOLIO_PROFILE.location} · {PORTFOLIO_PROFILE.phoneFormatted}
              </p>
            </figcaption>
          </figure>
        </div>
      </div>

      {/* Full-Width 4-Column Proof Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-[#E6E0D6] dark:border-[#27262B]">
        {HERO_METRICS.map((metric) => (
          <div key={metric.id} className="space-y-1">
            <div className="font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#181615] dark:text-[#F4F1EC]">
              {metric.value}
            </div>
            <p className="text-xs sm:text-sm text-[#5E5852] dark:text-[#A8A29E]">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
