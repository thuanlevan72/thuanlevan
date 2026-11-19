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
        <div className="border-b border-[#E6E0D6] dark:border-[#27262B] pb-6 space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#9F1239] dark:text-[#FB7185]">
            Câu Hỏi Thường Gặp
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#181615] dark:text-[#F4F1EC]">
            Thông Tin Hợp Tác &amp; Quy Trình Làm Việc
          </h2>
        </div>

        <div className="divide-y divide-[#E6E0D6] dark:divide-[#27262B] border-y border-[#E6E0D6] dark:border-[#27262B]">
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
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#181615] dark:text-[#F4F1EC] group-hover:text-[#9F1239] dark:group-hover:text-[#FB7185] transition-colors">
                    {item.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-[#5E5852] dark:text-[#A8A29E] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm sm:text-base text-[#5E5852] dark:text-[#A8A29E] leading-relaxed max-w-3xl">
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
        className="p-8 sm:p-12 rounded-2xl bg-[#181615] dark:bg-[#141418] text-[#FAF8F5] border border-[#2C2A30]"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-medium text-[#FB7185]">
              Sẵn Sàng Cho Dự Án Mới · Hà Nội &amp; Remote
            </p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight text-balance">
              Kết Nối Cho Dự Án Phần Mềm .NET Hoặc Sáng Tạo Thị Giác AI
            </h2>
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl leading-relaxed">
              Dù bạn đang tìm kiếm kỹ sư backend xây dựng hệ thống chịu tải cao hay giải pháp tạo
              nội dung hình ảnh – video AI mang đậm bản sắc thẩm mỹ Á Đông, hãy liên hệ trực tiếp
              với tôi.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={PORTFOLIO_PROFILE.phoneHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#9F1239] hover:bg-[#BE123C] text-white font-semibold text-sm transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4" aria-hidden="true" />
                <span>Gọi Điện: {PORTFOLIO_PROFILE.phoneFormatted}</span>
              </a>

              <a
                href={PORTFOLIO_PROFILE.emailHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-sm transition-colors whitespace-nowrap"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{PORTFOLIO_PROFILE.email}</span>
              </a>

              <a
                href={PORTFOLIO_PROFILE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-white/20 hover:border-white/50 text-stone-200 hover:text-white text-sm transition-colors whitespace-nowrap"
              >
                <span>Facebook</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 flex lg:justify-end">
            <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-xl overflow-hidden border border-white/15 bg-[#0B0B0E] shrink-0">
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
    <footer className="border-t border-[#E6E0D6] dark:border-[#27262B] py-8 mt-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5E5852] dark:text-[#A8A29E]">
        <div>
          © 2026{' '}
          <strong className="text-[#181615] dark:text-[#F4F1EC] font-semibold">
            {PORTFOLIO_PROFILE.fullLegalName}
          </strong>{' '}
          ({PORTFOLIO_PROFILE.birthInfo}) · {PORTFOLIO_PROFILE.location}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/trien-lam"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('gallery');
            }}
            className="hover:text-[#9F1239] dark:hover:text-[#FB7185] hover:underline underline-offset-4 transition-colors"
          >
            Triển Lãm Ảnh
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={PORTFOLIO_PROFILE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#181615] dark:hover:text-[#F4F1EC] hover:underline underline-offset-4 transition-colors"
          >
            GitHub Repositories
          </a>
          <span aria-hidden="true">·</span>
          <a
            href="/sitemap.xml"
            className="hover:text-[#181615] dark:hover:text-[#F4F1EC] hover:underline underline-offset-4 transition-colors"
          >
            Sitemap XML
          </a>
          <span aria-hidden="true">·</span>
          <button
            id="footer-theme-toggle"
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 hover:text-[#181615] dark:hover:text-[#F4F1EC] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#A16207]" aria-hidden="true" />
            )}
            <span>{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
