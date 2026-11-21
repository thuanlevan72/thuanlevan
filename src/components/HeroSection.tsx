import { ArrowUpRight, ChevronDown, Moon, Sun } from 'lucide-react';
import { GALLERY_ARTWORKS, HERO_METRICS, PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import {
  PROFILE_TEMPLATE_OPTIONS,
  ProfileTemplateId,
  ThemeMode,
} from '../utils/portfolioLogic.ts';
import { TemplateSwitcherBar } from './TemplateSwitcherBar.tsx';

interface HeroSectionProps {
  theme: ThemeMode;
  template: ProfileTemplateId;
  onChangeTemplate: (nextTemplate: ProfileTemplateId) => void;
  onToggleTheme: () => void;
  onOpenGalleryScreen: () => void;
}

export function HeroSection({
  theme,
  template,
  onChangeTemplate,
  onToggleTheme,
  onOpenGalleryScreen,
}: HeroSectionProps) {
  return (
    <section
      id="overview"
      data-template={template}
      className="scroll-mt-24 pt-6 sm:pt-10 pb-6 space-y-10 sm:space-y-12"
    >
      {/* Top Utility Strip: Identity Note + Multi-Template Switcher + Theme Switch */}
      <div className="space-y-4 border-b border-[#DCE6F2]/75 dark:border-[#182740]/80 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            {PORTFOLIO_PROFILE.fullLegalName} · {PORTFOLIO_PROFILE.birthInfo} ·{' '}
            {PORTFOLIO_PROFILE.location}
          </p>

          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label="Chuyển đổi giao diện Sáng / Tối"
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-xl border border-[#DCE6F2] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 text-xs font-medium text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
            )}
            <span id="theme-text">{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>
        </div>

        <TemplateSwitcherBar
          id="profile-template-switcher"
          label="Phong Cách Hồ Sơ"
          ariaLabel="Chọn phong cách bố cục trang Hồ Sơ"
          options={PROFILE_TEMPLATE_OPTIONS}
          activeId={template}
          onChange={onChangeTemplate}
        />
      </div>

      {/* 1. HIỆN ĐẠI — Bento Kỹ Thuật Sắc Nét */}
      {template === 'modern' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            <div className="lg:col-span-8 rounded-3xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-6 sm:p-9 lg:p-10 flex flex-col justify-between gap-8 soft-card">
              <div className="space-y-4">
                <p className="text-xs font-mono uppercase tracking-wider text-[#0369A1] dark:text-[#38BDF8]">
                  Kiến Trúc Hệ Thống &amp; Tích Hợp AI · MISA SJC
                </p>
                <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.08] tracking-[-0.02em] text-[#070B14] dark:text-[#F1F5F9] text-balance">
                  Xây Dựng Nền Tảng .NET Chịu Tải Cao &amp; Luồng AI Thực Chiến.
                </h1>
                <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-2xl text-pretty">
                  Gần 4 năm làm chủ C# .NET Core 8, Clean Architecture, Oracle/PostgreSQL dưới
                  50ms và điều phối hệ sinh thái AI Agent (Claude, Gemini, Codex, Grok) trong môi
                  trường ngân hàng, bệnh viện thông minh và AI Media.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-[#E9F0F8] dark:border-[#152339]">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                    Trọng Tâm Backend
                  </p>
                  <p className="text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] mt-0.5">
                    C# .NET 8 · CQRS · Kafka
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                    Cơ Sở Dữ Liệu
                  </p>
                  <p className="text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] mt-0.5">
                    Oracle · PostgreSQL · Redis
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                    Điều Phối AI Agent
                  </p>
                  <p className="text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] mt-0.5">
                    Claude · Gemini · Codex · Grok
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#systems"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  <span>Khám Phá Hệ Thống</span>
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href="/trien-lam"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenGalleryScreen();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#CBD8E6] dark:border-[#1E3250] bg-[#F5F8FC] dark:bg-[#0E1729] hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[#070B14] dark:text-[#F1F5F9] font-medium text-sm transition-colors whitespace-nowrap"
                >
                  <span>Triển Lãm Ảnh ({GALLERY_ARTWORKS.length})</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <figure className="lg:col-span-4 relative rounded-3xl overflow-hidden border border-[#DCE6F2] dark:border-[#1B2B44] bg-[#060B14] min-h-[340px] lg:min-h-0">
              <img
                src={PORTFOLIO_PROFILE.realPortraitSrc}
                alt={`Chân dung kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                width={675}
                height={1200}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-[50%_18%]"
              />
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#030712]/95 via-[#061224]/65 to-transparent pointer-events-none" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white space-y-1">
                <p className="text-xs font-mono text-[#38BDF8]">Hà Nội · 0352 988 596</p>
                <p className="font-display text-2xl font-semibold text-white">
                  {PORTFOLIO_PROFILE.fullLegalName}
                </p>
                <p className="text-xs text-slate-300">{PORTFOLIO_PROFILE.role}</p>
              </figcaption>
            </figure>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
        </div>
      )}

      {/* 2. CỔ TRANG — Quyển Sách Thủy Mặc, Ấn Triện Đỏ & Vàng Cổ */}
      {template === 'classical' && (
        <div className="rounded-3xl border-2 border-[#CBB58D] dark:border-[#4F3B24] bg-[#FBF6EC] dark:bg-[#120E0B] p-2 sm:p-3 shadow-[0_24px_60px_-24px_rgba(92,61,32,0.22)]">
          <div className="rounded-2xl border border-[#DFCDAE] dark:border-[#3A2B1B] p-6 sm:p-10 lg:p-12 space-y-9 text-center">
            {/* Symmetrical Red Seal Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-3">
                <span aria-hidden="true" className="h-px w-10 bg-[#B48332] dark:bg-[#D4A359]" />
                <span className="px-3 py-1 border-2 border-[#9E2A2B] dark:border-[#E05252] text-[#9E2A2B] dark:text-[#F4B860] font-mono text-[11px] font-bold tracking-[0.2em] uppercase">
                  ẤN TRIỆN · NHÂM NGỌ 2002
                </span>
                <span aria-hidden="true" className="h-px w-10 bg-[#B48332] dark:bg-[#D4A359]" />
              </div>

              <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-[56px] leading-[1.12] text-[#2A1B12] dark:text-[#F5E6D0] max-w-3xl text-balance">
                Thư Phòng Kỹ Nghệ .NET &amp; Đạo Nghệ Thị Giác AI
              </h1>

              <p className="text-sm sm:text-base text-[#5C4633] dark:text-[#C8B29A] max-w-2xl leading-[1.8] text-pretty">
                Tại hạ là{' '}
                <strong className="text-[#8B2324] dark:text-[#F4B860] font-semibold">
                  {PORTFOLIO_PROFILE.fullLegalName}
                </strong>{' '}
                — gần bốn mùa rèn giũa C# .NET Core 8 giữa ngân hàng Agribank, bệnh viện Phenikaa
                MEC và AI Media tại MISA; nay gửi gắm đôi nét cổ phong hòa cùng kỹ thuật đương đại.
              </p>
            </div>

            {/* Framed Ceremonial Portrait + flanking motto */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
              <div className="lg:col-span-4 text-left lg:text-right space-y-4 order-2 lg:order-1">
                <div className="p-4 border border-[#DFCDAE] dark:border-[#3A2B1B] bg-[#F5ECDA]/75 dark:bg-[#19130F] rounded-xl space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#E05252]">
                    Tâm Pháp Hệ Thống
                  </p>
                  <p className="font-display text-lg font-semibold text-[#2A1B12] dark:text-[#F5E6D0]">
                    Clean Architecture &amp; Truy Vấn &lt; 50ms
                  </p>
                </div>
                <div className="p-4 border border-[#DFCDAE] dark:border-[#3A2B1B] bg-[#F5ECDA]/75 dark:bg-[#19130F] rounded-xl space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#E05252]">
                    Trận Pháp Dữ Liệu
                  </p>
                  <p className="font-display text-lg font-semibold text-[#2A1B12] dark:text-[#F5E6D0]">
                    Oracle · PostgreSQL · Apache Kafka
                  </p>
                </div>
              </div>

              <figure className="lg:col-span-4 mx-auto order-1 lg:order-2">
                <div className="p-2 border-2 border-[#B48332] dark:border-[#9E7538] rounded-t-full rounded-b-2xl bg-white dark:bg-[#1A140F] shadow-md">
                  <div className="w-56 h-72 sm:w-64 sm:h-80 rounded-t-full rounded-b-xl overflow-hidden border border-[#DFCDAE] dark:border-[#4F3B24] relative">
                    <img
                      src={PORTFOLIO_PROFILE.realPortraitSrc}
                      alt={`Chân dung cổ phong kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                      width={675}
                      height={1200}
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-[50%_18%]"
                    />
                  </div>
                </div>
                <figcaption className="mt-3 font-display text-sm italic text-[#6E533B] dark:text-[#D4BC9E]">
                  “Cố Phán Di Quang Thái — Lập Trình &amp; Thi Ca”
                </figcaption>
              </figure>

              <div className="lg:col-span-4 text-left space-y-4 order-3">
                <div className="p-4 border border-[#DFCDAE] dark:border-[#3A2B1B] bg-[#F5ECDA]/75 dark:bg-[#19130F] rounded-xl space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#E05252]">
                    Tứ Đại Trợ Thủ AI
                  </p>
                  <p className="font-display text-lg font-semibold text-[#2A1B12] dark:text-[#F5E6D0]">
                    Claude · Gemini · Codex · Grok
                  </p>
                </div>
                <div className="p-4 border border-[#DFCDAE] dark:border-[#3A2B1B] bg-[#F5ECDA]/75 dark:bg-[#19130F] rounded-xl space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#9E2A2B] dark:text-[#E05252]">
                    Lạc Khoản Thư Phòng
                  </p>
                  <p className="font-display text-lg font-semibold text-[#2A1B12] dark:text-[#F5E6D0]">
                    Hoài Đức · Hà Nội (2022 – 2026)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <a
                href="#systems"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#8B2324] hover:bg-[#721B1C] dark:bg-[#B48332] dark:hover:bg-[#996E28] text-white font-semibold text-sm transition-colors whitespace-nowrap"
              >
                <span>Mở Cuốn Dự Án</span>
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="/trien-lam"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenGalleryScreen();
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#B48332] dark:border-[#9E7538] text-[#6E471B] dark:text-[#F4B860] hover:bg-[#F5ECDA] dark:hover:bg-[#1F1711] font-medium text-sm transition-colors whitespace-nowrap"
              >
                <span>Thưởng Lãm Họa Đường ({GALLERY_ARTWORKS.length})</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            {/* 4 Classical Plaque Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-[#DFCDAE] dark:border-[#3A2B1B]">
              {HERO_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  className="p-4 rounded-xl border border-[#DFCDAE] dark:border-[#3A2B1B] bg-white/75 dark:bg-[#19130F] space-y-1"
                >
                  <div className="font-display text-2xl sm:text-3xl font-bold text-[#8B2324] dark:text-[#F4B860]">
                    {metric.value}
                  </div>
                  <p className="text-xs text-[#5C4633] dark:text-[#C8B29A] leading-snug">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. HƯỚNG NỘI — Tĩnh Lặng, Thư Thái Một Cột */}
      {template === 'introvert' && (
        <div className="max-w-3xl mx-auto py-4 sm:py-8 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#CBD5E1] dark:border-[#243041] bg-[#0B1220] shrink-0">
                <img
                  src={PORTFOLIO_PROFILE.realPortraitSrc}
                  alt={`Chân dung tĩnh lặng của ${PORTFOLIO_PROFILE.fullLegalName}`}
                  width={675}
                  height={1200}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[50%_16%] opacity-95"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                  Nhật Ký Tĩnh Lặng · {PORTFOLIO_PROFILE.fullLegalName}
                </p>
                <p className="text-sm font-medium text-[#334155] dark:text-[#CBD5E1]">
                  {PORTFOLIO_PROFILE.role}
                </p>
              </div>
            </div>

            <h1 className="font-display font-medium text-3xl sm:text-5xl leading-[1.18] tracking-[-0.015em] text-[#1E293B] dark:text-[#E2E8F0] text-balance">
              Viết những dòng code sạch, ít ồn ào và bền bỉ theo năm tháng.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] dark:text-[#94A3B8] leading-[1.85] text-pretty">
              Tôi thích sự tĩnh lặng khi đào sâu vào một truy vấn Oracle hay kiến trúc CQRS — nơi
              mọi vấn đề phức tạp đều được tách nhỏ gọn ghẽ. Từ Agribank, Phenikaa MEC đến MISA
              OneAI, sự tập trung thầm lặng luôn tạo nên hệ thống đáng tin cậy nhất.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#systems"
                className="text-sm font-semibold text-[#0F172A] dark:text-[#F1F5F9] underline underline-offset-8 decoration-[#94A3B8] hover:decoration-[#0284C7] transition-colors whitespace-nowrap"
              >
                Đọc ghi chép 06 hệ thống ↓
              </a>
              <span aria-hidden="true" className="text-[#CBD5E1] dark:text-[#334155]">
                ·
              </span>
              <a
                href="/trien-lam"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenGalleryScreen();
                }}
                className="text-sm font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors whitespace-nowrap"
              >
                Ghé phòng tranh yên tĩnh ({GALLERY_ARTWORKS.length}) →
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-y border-[#E2E8F0] dark:border-[#1E293B]">
            {HERO_METRICS.map((metric) => (
              <div key={metric.id} className="space-y-1">
                <div className="font-mono text-xl sm:text-2xl font-medium text-[#0F172A] dark:text-[#E2E8F0]">
                  {metric.value}
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-snug">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. HƯỚNG NGOẠI — Sân Khấu Đậm Nét & Kết Nối Mạnh Mẽ */}
      {template === 'extrovert' && (
        <div className="space-y-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#061124] via-[#0B234A] to-[#0369A1] text-white p-6 sm:p-10 lg:p-12 shadow-[0_28px_64px_-22px_rgba(2,132,199,0.55)]">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#38BDF8]/15 blur-3xl pointer-events-none"
            />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-[#7DD3FC]">
                  OPEN TO COLLABORATE · TEAM SCALE UP TO 60 ENGINEERS
                </p>
                <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[60px] leading-[1.04] tracking-[-0.025em] text-white text-balance">
                  Kết Nối Đội Ngũ, Dẫn Nhịp Sản Phẩm &amp; Bứt Tốc Với AI!
                </h1>
                <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl text-pretty">
                  Từ bàn tiệc hackathon cùng đồng đội MISA đến những sprint 60 nhân sự tại Phenikaa
                  MEC — tôi luôn tràn đầy năng lượng khi đồng hành cùng team giải quyết những bài
                  toán nghiệp vụ khó nhất.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <a
                    href="#systems"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0A192F] hover:bg-[#E0F2FE] font-bold text-sm shadow-lg transition-all whitespace-nowrap"
                  >
                    <span>Xem Thành Tích Dự Án</span>
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white border border-white/25 font-semibold text-sm transition-all whitespace-nowrap"
                  >
                    <span>Kết Nối &amp; Trò Chuyện Ngay</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                  <a
                    href="/trien-lam"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenGalleryScreen();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 text-white font-medium text-sm transition-colors whitespace-nowrap"
                  >
                    <span>Album Đồng Đội ({GALLERY_ARTWORKS.length})</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5">
                <figure className="relative rounded-2xl overflow-hidden border-2 border-[#38BDF8]/45 bg-[#050C18] aspect-[4/4] sm:aspect-[5/4] lg:aspect-[4/5] max-w-sm mx-auto shadow-2xl">
                  <img
                    src={PORTFOLIO_PROFILE.realPortraitSrc}
                    alt={`Chân dung năng lượng của ${PORTFOLIO_PROFILE.fullLegalName}`}
                    width={675}
                    height={1200}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-[50%_18%]"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#030712]/95 via-[#071426]/65 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="font-mono text-xs text-[#38BDF8]">LEVEL UP WITH AI · HẠ LONG</p>
                    <p className="font-display text-2xl font-bold">{PORTFOLIO_PROFILE.fullLegalName}</p>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white to-[#F0F7FF] dark:from-[#0D192E] dark:to-[#091221] border border-[#BFDBFE] dark:border-[#1E3A5F] space-y-1.5"
              >
                <div className="font-mono tabular-nums text-3xl font-bold text-[#1D4ED8] dark:text-[#38BDF8]">
                  {metric.value}
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#334155] dark:text-[#CBD5E1]">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TRẺ TRUNG — Năng Động, Phá Cách & Bất Đối Xứng */}
      {template === 'youthful' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#2DD4BF]">
              <span>GEN-Z ARCHITECT · NHÂM NGỌ 2002</span>
              <span aria-hidden="true">//</span>
              <span className="text-[#2563EB] dark:text-[#60A5FA]">BUILD FAST &amp; SHIP CLEAN</span>
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[58px] leading-[1.06] tracking-[-0.025em] text-[#0F172A] dark:text-white text-balance">
              Code Chắc Tay, Bắt Nhịp Công Nghệ Nhanh &amp; Không Ngại Thử Thách!
            </h1>

            <p className="text-base sm:text-[17px] text-[#334155] dark:text-[#CBD5E1] leading-relaxed max-w-2xl text-pretty">
              Sinh năm 2002 nhưng đã chinh chiến qua Agribank, Phenikaa MEC 60 devs và MISA OneAI
              — kết hợp tốc độ của thế hệ trẻ cùng tư duy hệ thống bài bản, biến ý tưởng phức tạp
              thành sản phẩm chạy thật cực mượt.
            </p>

            {/* Compact 2x2 Vibrant KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {HERO_METRICS.map((metric, idx) => (
                <div
                  key={metric.id}
                  className={`p-3.5 rounded-2xl border-2 bg-white dark:bg-[#0B1220] space-y-0.5 ${
                    idx % 2 === 0
                      ? 'border-[#2563EB]/40 dark:border-[#3B82F6]/50'
                      : 'border-[#0D9488]/40 dark:border-[#2DD4BF]/50'
                  }`}
                >
                  <p
                    className={`font-mono font-bold text-xl sm:text-2xl ${
                      idx % 2 === 0
                        ? 'text-[#2563EB] dark:text-[#60A5FA]'
                        : 'text-[#0D9488] dark:text-[#2DD4BF]'
                    }`}
                  >
                    {metric.value}
                  </p>
                  <p className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] leading-tight">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#systems"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] dark:bg-[#0D9488] dark:hover:bg-[#0F766E] text-white font-bold text-sm shadow-[4px_4px_0px_#0F172A] dark:shadow-[4px_4px_0px_#38BDF8] hover:translate-x-[1px] hover:translate-y-[1px] transition-all whitespace-nowrap"
              >
                <span>Khám Phá Dự Án Chất</span>
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href="/trien-lam"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenGalleryScreen();
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-[#0F172A] dark:border-[#38BDF8] bg-white dark:bg-[#0B1220] text-[#0F172A] dark:text-white font-bold text-sm transition-colors whitespace-nowrap"
              >
                <span>Check Album {GALLERY_ARTWORKS.length} Ảnh</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Offset Layered Neo-Studio Portrait Frame (contained cleanly in padding) */}
          <div className="lg:col-span-5 px-3 py-2">
            <div className="relative max-w-[370px] mx-auto">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl bg-gradient-to-br from-[#2563EB] to-[#0D9488]"
              />
              <figure className="relative rounded-3xl overflow-hidden border-2 border-[#0F172A] dark:border-white bg-[#060B14] aspect-[4/5]">
                <img
                  src={PORTFOLIO_PROFILE.realPortraitSrc}
                  alt={`Chân dung năng động kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                  width={675}
                  height={1200}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-[50%_18%]"
                />
                <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#040914]/95 via-[#071426]/55 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white space-y-1">
                  <p className="font-mono text-xs text-[#2DD4BF]">MISA SJC · NINJA 400 · GUITAR</p>
                  <p className="font-display text-2xl font-bold">{PORTFOLIO_PROFILE.fullLegalName}</p>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      )}

      {/* 6. HOÀI CỔ — Tạp Chí Giấy Cũ, Máy Chữ & Khung Ảnh Polaroid 35mm */}
      {template === 'retro' && (
        <div className="rounded-2xl border-2 border-dashed border-[#A67B5B] dark:border-[#785535] bg-[#F4ECD8] dark:bg-[#16120E] p-6 sm:p-9 lg:p-10 space-y-8 shadow-inner">
          {/* Newspaper / Archival Masthead */}
          <div className="border-y-2 border-[#432818] dark:border-[#D6B89C] py-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#5C3D2E] dark:text-[#D6B89C]">
            <span className="font-bold tracking-wider uppercase">
              ẤN BẢN LƯU TRỮ SỐ 04 · HÀ NỘI (2022 – 2026)
            </span>
            <span>MÃ CUỘN PHIM: 35MM-ISO400 · ĐÃ LƯU KHO</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5">
              <p className="font-mono text-xs uppercase tracking-widest text-[#B45309] dark:text-[#F59E0B] font-semibold">
                NHẬT KÝ KỸ SƯ HỆ THỐNG · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}
              </p>
              <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.1] text-[#2C1810] dark:text-[#F5E6D3] text-balance">
                Những Dòng Code Bền Bỉ Từ Ngày Đầu Chập Chững Đến Senior .NET.
              </h1>
              <p className="text-sm sm:text-base text-[#5C3D2E] dark:text-[#D6B89C] leading-[1.8] text-pretty">
                Từ những đêm trắng 02:38 sáng bên ly mì nóng ở cửa hàng tiện lợi, hàng trăm giờ tối
                ưu từng câu SQL legacy xuống mili-giây, đến hôm nay đồng hành cùng đồng đội tại MISA
                — mỗi hệ thống đều là một cuốn nhật ký đáng trân trọng.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#systems"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#432818] hover:bg-[#2C1810] dark:bg-[#B45309] dark:hover:bg-[#92400E] text-[#FDF8EF] font-mono text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>LẬT TRANG DỰ ÁN ↓</span>
                </a>
                <a
                  href="/trien-lam"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenGalleryScreen();
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-dashed border-[#6B4226] dark:border-[#D6B89C] text-[#432818] dark:text-[#F5E6D3] font-mono text-xs sm:text-sm font-semibold hover:bg-[#EADBC2]/60 dark:hover:bg-[#241C14] transition-colors whitespace-nowrap"
                >
                  <span>XEM CUỘN PHIM {GALLERY_ARTWORKS.length} KHOẢNH KHẮC →</span>
                </a>
              </div>
            </div>

            {/* Polaroid Printed Portrait Card */}
            <div className="lg:col-span-5 flex justify-center">
              <figure className="p-3.5 pb-7 bg-white dark:bg-[#231C15] border border-[#D4C3A3] dark:border-[#4A3B2C] shadow-[0_18px_36px_-16px_rgba(67,40,24,0.35)] max-w-[300px] w-full rounded-sm">
                <div className="aspect-[4/4.6] overflow-hidden bg-[#16120E] border border-[#E5D7BF] dark:border-[#3A2D20]">
                  <img
                    src={PORTFOLIO_PROFILE.realPortraitSrc}
                    alt={`Ảnh Polaroid hoài cổ của ${PORTFOLIO_PROFILE.fullLegalName}`}
                    width={675}
                    height={1200}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-[50%_18%] sepia-[.28] contrast-[1.04]"
                  />
                </div>
                <figcaption className="pt-4 font-mono text-xs text-[#432818] dark:text-[#F3E5D0] flex items-center justify-between gap-2">
                  <span className="font-bold">LÊ VĂN THUẬN</span>
                  <span className="text-[#92400E] dark:text-[#FBBF24]">HÀ NỘI ’22–’26</span>
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-dashed border-[#A67B5B] dark:border-[#634832]">
            {HERO_METRICS.map((metric, idx) => (
              <div key={metric.id} className="space-y-1">
                <p className="font-mono text-[11px] text-[#92400E] dark:text-[#FBBF24]">
                  ARCHIVE #0{idx + 1}
                </p>
                <p className="font-mono text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                  {metric.value}
                </p>
                <p className="text-xs text-[#5C3D2E] dark:text-[#D6B89C] leading-snug">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
