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
            <p className="text-xs sm:text-sm font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
              Lê Văn Thuận · Nhâm Ngọ 2002 · Hoài Đức, Hà Nội
            </p>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.08] tracking-tight text-[#070B14] dark:text-[#F1F5F9] max-w-2xl text-balance">
              Kỹ Sư Hệ Thống .NET &amp; Kiến Trúc Doanh Nghiệp.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-xl text-pretty">
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
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#systems"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors whitespace-nowrap"
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
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#CBD8E6] dark:border-[#1E3250] hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[#0A192F] dark:text-[#F1F5F9] hover:text-[#0369A1] dark:hover:text-[#38BDF8] font-medium text-sm transition-colors whitespace-nowrap"
              >
                <span>Mở Triển Lãm Ảnh AI</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569] dark:text-[#94A3B8]">
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
          <figure className="relative w-full h-[420px] lg:h-[460px] rounded-2xl overflow-hidden border border-[#CBD8E6] dark:border-[#1B2B44] bg-[#060B14]">
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#040914]/90 via-[#071426]/25 to-transparent pointer-events-none" />

            <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6 text-white space-y-1">
              <p className="text-xs font-mono text-[#38BDF8]">
                Senior .NET Engineer · 08/2022 – Nay
              </p>
              <p className="font-display text-xl sm:text-2xl font-semibold leading-snug text-white">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-[#D7E2EE] dark:border-[#1B2B44]">
        {HERO_METRICS.map((metric) => (
          <div key={metric.id} className="space-y-1">
            <div className="font-mono tabular-nums text-2xl sm:text-3xl font-medium text-[#0A192F] dark:text-[#F1F5F9]">
              {metric.value}
            </div>
            <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
