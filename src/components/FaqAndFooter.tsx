import { ChevronDown, Mail, Moon, Phone, Sun } from 'lucide-react';
import { useState } from 'react';
import { FAQ_ITEMS, PORTFOLIO_PROFILE } from '../data/portfolioData.ts';
import { AppRoute, ThemeMode } from '../utils/portfolioLogic.ts';

export function FaqAndCta() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <>
      {/* FAQ Section matching Schema.org FAQPage JSON-LD */}
      <section id="faq" className="space-y-8 pt-6">
        <div className="border-b border-[#D7E2EE] dark:border-[#1B2B44] pb-6 space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8]">
            Câu Hỏi Thường Gặp
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#070B14] dark:text-[#F1F5F9]">
            Thông Tin Hợp Tác &amp; Quy Trình Làm Việc
          </h2>
        </div>

        <div className="divide-y divide-[#D7E2EE] dark:divide-[#1B2B44] border-y border-[#D7E2EE] dark:border-[#1B2B44]">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={item.question} className="py-5">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                >
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#070B14] dark:text-[#F1F5F9] group-hover:text-[#1D4ED8] dark:group-hover:text-[#38BDF8] transition-colors">
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
                  <p className="mt-3 text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-3xl">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Editorial Contact Call-To-Action */}
      <section
        id="contact"
        className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-[#05080F] via-[#0A192F] to-[#0F274A] text-[#F1F5F9] border border-[#1B3358]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-medium text-[#38BDF8]">
              Sẵn Sàng Cho Dự Án Mới · Hà Nội &amp; Remote
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight text-balance">
              Kết Nối Cho Dự Án Phần Mềm .NET Hoặc Sáng Tạo Thị Giác AI
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Dù bạn đang tìm kiếm kỹ sư backend xây dựng hệ thống chịu tải cao hay giải pháp tạo
              nội dung hình ảnh – video AI mang đậm bản sắc thẩm mỹ Á Đông, hãy liên hệ trực tiếp
              với tôi.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={PORTFOLIO_PROFILE.phoneHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-sm transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span>Gọi Điện: {PORTFOLIO_PROFILE.phoneFormatted}</span>
              </a>

              <a
                href={PORTFOLIO_PROFILE.emailHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1E3A5F]/50 hover:bg-[#1E3A5F]/80 border border-[#38BDF8]/30 text-white font-medium text-sm transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{PORTFOLIO_PROFILE.email}</span>
              </a>

              <a
                href={PORTFOLIO_PROFILE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-white/20 hover:border-[#38BDF8] text-slate-200 hover:text-white text-sm transition-colors whitespace-nowrap"
              >
                <span>Facebook</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 flex lg:justify-end">
            <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-xl overflow-hidden border border-[#38BDF8]/25 bg-[#05080F] shrink-0">
              <img
                src={PORTFOLIO_PROFILE.realPortraitSrc}
                alt={`Chân dung đời thực kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                width={810}
                height={1440}
                loading="eager"
                decoding="sync"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
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
    <footer className="border-t border-[#D7E2EE] dark:border-[#1B2B44] py-8 mt-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#475569] dark:text-[#94A3B8]">
        <div>
          © 2026{' '}
          <strong className="text-[#070B14] dark:text-[#F1F5F9] font-semibold">
            {PORTFOLIO_PROFILE.fullLegalName}
          </strong>{' '}
          ({PORTFOLIO_PROFILE.birthInfo}) · {PORTFOLIO_PROFILE.location}
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
