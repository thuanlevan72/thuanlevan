import { ChevronDown, Mail, Moon, Phone, Sun } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS, PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { AppRoute, ThemeMode } from '../utils/portfolioLogic.ts';
import { BrandLogo } from './BrandLogo.tsx';

export function FaqAndCta() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <>
      {/* FAQ Section matching Schema.org FAQPage JSON-LD */}
      <section id="faq" className="scroll-mt-24 space-y-8 pt-6">
        <div className="border-b border-[#DCE6F2] dark:border-[#182740] pb-6 space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            Câu Hỏi Thường Gặp
          </p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            Thông Tin Hợp Tác &amp; Quy Trình Làm Việc
          </h2>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={item.question}
                className={`rounded-2xl border transition-colors duration-200 ${
                  isOpen
                    ? 'bg-white/95 dark:bg-[#0B1220]/95 border-[#CBD8E6] dark:border-[#1F3557] shadow-[0_10px_28px_-18px_rgba(10,25,47,0.12)]'
                    : 'bg-white/60 dark:bg-[#080E1A]/75 border-[#DCE6F2] dark:border-[#16243B] hover:border-[#0284C7]/45 dark:hover:border-[#38BDF8]/45'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                >
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#070B14] dark:text-[#F1F5F9] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                    {item.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[#475569] dark:text-[#94A3B8] transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0284C7] dark:text-[#38BDF8]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-3xl border-t border-[#E9F0F8] dark:border-[#152339] pt-4">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Editorial Contact Call-To-Action */}
      <section
        id="contact"
        className="scroll-mt-24 relative overflow-hidden p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#05080F] via-[#0A192F] to-[#0F294D] text-[#F1F5F9] border border-[#1B3358] shadow-[0_28px_60px_-24px_rgba(5,8,15,0.55)]"
      >
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#0284C7]/15 blur-3xl pointer-events-none"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-medium text-[#38BDF8] tracking-wide">
              Sẵn Sàng Cho Dự Án Mới · Hà Nội &amp; Remote
            </p>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl lg:text-[42px] text-white leading-[1.15] text-balance">
              Kết Nối Cho Dự Án Phần Mềm .NET Hoặc Sáng Tạo Thị Giác AI
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Dù bạn đang tìm kiếm kỹ sư backend xây dựng hệ thống chịu tải cao hay giải pháp tạo
              nội dung hình ảnh – video AI mang đậm bản sắc thẩm mỹ Á Đông, hãy liên hệ trực tiếp
              với tôi.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <a
                href={PORTFOLIO_PROFILE.phoneHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm shadow-[0_10px_24px_-8px_rgba(2,132,199,0.55)] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span>Gọi Điện: {PORTFOLIO_PROFILE.phoneFormatted}</span>
              </a>

              <a
                href={PORTFOLIO_PROFILE.emailHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#14294A]/70 hover:bg-[#1B3660] border border-[#38BDF8]/30 text-white font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{PORTFOLIO_PROFILE.email}</span>
              </a>

              <a
                href={PORTFOLIO_PROFILE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/20 hover:border-[#38BDF8] text-slate-200 hover:text-white text-sm hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
              >
                <span>Facebook</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 flex lg:justify-end">
            <div className="w-40 h-52 sm:w-48 sm:h-60 rounded-2xl overflow-hidden border border-[#38BDF8]/25 bg-[#05080F] shadow-xl shrink-0">
              <img
                src={PORTFOLIO_PROFILE.realPortraitSrc}
                alt={`Chân dung đời thực kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                width={810}
                height={1440}
                loading="eager"
                decoding="sync"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-[50%_20%]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

interface GlobalFooterProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

export function GlobalFooter({ theme, onToggleTheme, onNavigate }: GlobalFooterProps) {
  return (
    <footer className="border-t border-[#DCE6F2] dark:border-[#182740] py-8 mt-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#475569] dark:text-[#94A3B8]">
        <div className="inline-flex items-center gap-2.5 text-center sm:text-left">
          <BrandLogo size={22} className="rounded-md shadow-xs" />
          <span>
            © 2026{' '}
            <strong className="text-[#070B14] dark:text-[#F1F5F9] font-semibold">
              {PORTFOLIO_PROFILE.fullLegalName}
            </strong>{' '}
            ({PORTFOLIO_PROFILE.birthInfo}) · {PORTFOLIO_PROFILE.location}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/cv"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('cv');
            }}
            className="hover:text-[#0369A1] dark:hover:text-[#38BDF8] hover:underline underline-offset-4 transition-colors"
          >
            CV PDF
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/trien-lam"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('gallery');
            }}
            className="hover:text-[#0369A1] dark:hover:text-[#38BDF8] hover:underline underline-offset-4 transition-colors"
          >
            Triển Lãm Ảnh
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/studio"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('studio');
            }}
            className="hover:text-[#0369A1] dark:hover:text-[#38BDF8] hover:underline underline-offset-4 transition-colors"
          >
            Sáng Tác Nhạc
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/game"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('game');
            }}
            className="hover:text-[#0369A1] dark:hover:text-[#38BDF8] hover:underline underline-offset-4 transition-colors"
          >
            Game
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={PORTFOLIO_PROFILE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#070B14] dark:hover:text-[#F1F5F9] hover:underline underline-offset-4 transition-colors"
          >
            GitHub Repositories
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/sitemap.xml"
            className="hover:text-[#070B14] dark:hover:text-[#F1F5F9] hover:underline underline-offset-4 transition-colors"
          >
            Sitemap XML
          </a>
          <span aria-hidden="true">·</span>
          <button
            id="footer-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 hover:text-[#070B14] dark:hover:text-[#F1F5F9] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
            )}
            <span>{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
