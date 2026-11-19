import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  Github,
  Globe,
  Images,
  Loader2,
  Mail,
  MapPin,
  Moon,
  Phone,
  Printer,
  Sun,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AI_AGENT_EXPERIENCE,
  HERO_METRICS,
  PORTFOLIO_PROFILE,
  PORTFOLIO_PROJECTS,
  SKILL_GROUPS,
} from '../data/portfolioData.ts';
import { downloadPortfolioCvPdf } from '../utils/cvPdfGenerator.ts';
import {
  AppRoute,
  buildCvPlainText,
  CvSourceData,
  ThemeMode,
} from '../utils/portfolioLogic.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface CvPdfSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

const CV_ID_PORTRAIT_SRC = '/assets/gallery/chan-dung-the-xanh.webp';

const CV_SUMMARY_PARAGRAPH =
  'Kỹ sư hệ thống Senior .NET với gần 4 năm kinh nghiệm thực chiến (từ 08/2022 đến nay) trong việc thiết kế và vận hành các nền tảng doanh nghiệp chịu tải cao: Ngân hàng số & Phòng chống rửa tiền (Smart Form Agribank), Y tế thông minh (Phenikaa MEC với đội ngũ 60 kỹ sư), Công nghệ giáo dục (Lotus & Nguyễn Siêu) và Hệ sinh thái AI Media Generation (MISA OneAI for Family). Thế mạnh cốt lõi về C# .NET Core 8, Clean Architecture, CQRS, tối ưu truy vấn SQL/Oracle/PostgreSQL dưới 50ms, Apache Kafka, Redis và ứng dụng thành thạo AI Agent (Claude, Gemini, Codex, Grok) vào quy trình phát triển phần mềm an toàn.';

export function CvPdfSection({ theme, onToggleTheme, onNavigate }: CvPdfSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const cvSourceData: CvSourceData = useMemo(
    () => ({
      profile: PORTFOLIO_PROFILE,
      metrics: HERO_METRICS,
      projects: PORTFOLIO_PROJECTS,
      skillGroups: SKILL_GROUPS,
      aiAgents: AI_AGENT_EXPERIENCE,
    }),
    []
  );

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatus(null);
    try {
      const filename = await downloadPortfolioCvPdf(cvSourceData, {
        portraitSrc: CV_ID_PORTRAIT_SRC,
        summaryParagraph: CV_SUMMARY_PARAGRAPH,
      });
      setExportStatus({
        type: 'success',
        message: `Đã tạo và tải xuống file ${filename} chuẩn A4 (Unicode tiếng Việt).`,
      });
    } catch (err) {
      setExportStatus({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể tạo file PDF. Vui lòng thử chức năng In / Lưu PDF.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCopyPlainText = async () => {
    const plainText = buildCvPlainText(cvSourceData);
    let success = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(plainText);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = plainText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      setExportStatus({
        type: 'success',
        message: 'Đã sao chép toàn bộ nội dung CV vào bộ nhớ tạm.',
      });
      setTimeout(() => setCopied(false), 2500);
    } else {
      setExportStatus({
        type: 'error',
        message: 'Trình duyệt hạn chế quyền sao chép tự động. Vui lòng dùng nút Tải CV (.PDF).',
      });
    }
  };

  return (
    <section id="cv-section" className="pt-8 sm:pt-12 pb-6 space-y-10">
      {/* Top utility bar & Action toolbar (hidden when printing) */}
      <div className="no-print space-y-6 border-b border-[#DCE6F2] dark:border-[#182740] pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('profile', 'overview');
            }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#475569] dark:text-[#94A3B8] hover:text-[#0369A1] dark:hover:text-[#38BDF8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Quay Lại Hồ Sơ Kỹ Sư</span>
          </a>

          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label="Chuyển đổi giao diện Sáng / Tối"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCE6F2] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 text-xs font-medium text-[#070B14] dark:text-[#F1F5F9] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
            )}
            <span id="theme-text">{theme === 'dark' ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>Bản CV Chuẩn A4 · Đồng Bộ Từ Dữ Liệu Website</span>
            </p>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl tracking-[-0.02em] text-[#070B14] dark:text-[#F1F5F9] leading-[1.1] text-balance">
              CV Kỹ Sư Senior .NET &amp; Kiến Trúc Hệ Thống
            </h1>
            <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
              Toàn bộ thông tin kinh nghiệm, chỉ số dự án và kỹ năng bên dưới được trích xuất trực
              tiếp từ dữ liệu chính thức trên website. Bạn có thể tải xuống ngay file PDF chuẩn A4
              hoặc in trực tiếp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="download-cv-pdf-btn"
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] disabled:opacity-60 text-white font-semibold text-sm shadow-[0_10px_24px_-8px_rgba(10,25,47,0.4)] dark:shadow-[0_10px_24px_-8px_rgba(2,132,199,0.5)] hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{isExporting ? 'Đang Tạo File PDF...' : 'Tải CV (.PDF)'}</span>
            </button>

            <button
              id="print-cv-btn"
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD8E6] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[#070B14] dark:text-[#F1F5F9] font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
              <span>In / Lưu PDF</span>
            </button>

            <button
              id="copy-cv-text-btn"
              type="button"
              onClick={handleCopyPlainText}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD8E6] dark:border-[#1E3250] bg-white/90 dark:bg-[#0B1220]/90 hover:border-[#0284C7] dark:hover:border-[#38BDF8] text-[#070B14] dark:text-[#F1F5F9] font-medium text-sm hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4 text-[#475569] dark:text-[#94A3B8]" aria-hidden="true" />
              )}
              <span>{copied ? 'Đã Sao Chép CV' : 'Sao Chép Nội Dung'}</span>
            </button>
          </div>
        </div>

        {exportStatus && (
          <div
            role="status"
            aria-live="polite"
            className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium ${
              exportStatus.type === 'success'
                ? 'bg-[#E6EEF7]/85 dark:bg-[#0E1B31] border-[#0284C7]/40 text-[#0A192F] dark:text-[#38BDF8]'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {exportStatus.message}
          </div>
        )}
      </div>

      {/* Printable A4 CV Sheet */}
      <article
        id="cv-printable-sheet"
        aria-label="Hồ sơ CV điện tử của Lê Văn Thuận"
        className="max-w-4xl mx-auto rounded-3xl border border-[#DCE6F2] dark:border-[#182740] bg-white dark:bg-[#0B1220] shadow-[0_24px_64px_-24px_rgba(10,25,47,0.18)] dark:shadow-[0_28px_64px_-20px_rgba(0,0,0,0.75)] overflow-hidden"
      >
        {/* Top Navy & Ocean Blue accent strip */}
        <div className="h-2 bg-gradient-to-r from-[#05080F] via-[#0A192F] to-[#0284C7]" />

        <div className="p-6 sm:p-11 space-y-8">
          {/* Candidate Header + ID Portrait */}
          <header className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-6 border-b border-[#DCE6F2] dark:border-[#182740] pb-7">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-[#0369A1] dark:text-[#38BDF8]">
                  <BrandLogo size={20} className="rounded-md" />
                  <span>HỒ SƠ ỨNG VIÊN · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}</span>
                </div>
                <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#070B14] dark:text-[#F1F5F9] leading-tight">
                  {PORTFOLIO_PROFILE.fullLegalName}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-[#1D4ED8] dark:text-[#38BDF8]">
                  {PORTFOLIO_PROFILE.role}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 pt-2 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                <a
                  href={PORTFOLIO_PROFILE.phoneHref}
                  className="inline-flex items-center gap-2 hover:text-[#0369A1] dark:hover:text-[#38BDF8] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
                  <span className="font-mono tabular-nums">{PORTFOLIO_PROFILE.phoneFormatted}</span>
                </a>

                <a
                  href={PORTFOLIO_PROFILE.emailHref}
                  className="inline-flex items-center gap-2 hover:text-[#0369A1] dark:hover:text-[#38BDF8] transition-colors truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
                  <span className="truncate">{PORTFOLIO_PROFILE.email}</span>
                </a>

                <div className="inline-flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
                  <span>{PORTFOLIO_PROFILE.location}</span>
                </div>

                <a
                  href={PORTFOLIO_PROFILE.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#0369A1] dark:hover:text-[#38BDF8] transition-colors truncate"
                >
                  <Github className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
                  <span className="truncate">github.com/thuanlevan72</span>
                </a>
              </div>
            </div>

            <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border border-[#CBD8E6] dark:border-[#1E3250] bg-[#0A192F] shadow-sm shrink-0">
              <img
                src={CV_ID_PORTRAIT_SRC}
                alt={`Ảnh thẻ chân dung kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                width={472}
                height={709}
                loading="eager"
                decoding="sync"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </header>

          {/* Key Quantitative Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 cv-avoid-break">
            {HERO_METRICS.map((metric) => (
              <div
                key={metric.id}
                className="p-4 rounded-2xl bg-[#F5F8FC] dark:bg-[#080E1A] border border-[#DCE6F2] dark:border-[#182740] space-y-1"
              >
                <p className="font-mono font-semibold text-lg sm:text-[21px] text-[#070B14] dark:text-[#F1F5F9] tabular-nums whitespace-nowrap">
                  {metric.value}
                </p>
                <p className="text-[11px] sm:text-xs text-[#475569] dark:text-[#94A3B8] leading-snug">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <section className="space-y-2.5 cv-avoid-break">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
              Tóm Tắt Chuyên Môn
            </h3>
            <p className="text-sm text-[#070B14] dark:text-[#CBD5E1] leading-relaxed text-pretty">
              {CV_SUMMARY_PARAGRAPH}
            </p>
          </section>

          {/* Production Experience & Systems */}
          <section className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
              Kinh Nghiệm &amp; Hệ Thống Production Trọng Điểm
            </h3>

            <div className="divide-y divide-[#E9F0F8] dark:divide-[#152339]">
              {PORTFOLIO_PROJECTS.map((project) => (
                <div key={project.id} className="py-4 first:pt-1 last:pb-1 space-y-2.5 cv-avoid-break">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <h4 className="font-display font-semibold text-xl sm:text-[22px] text-[#070B14] dark:text-[#F1F5F9]">
                      {project.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0369A1] dark:text-[#38BDF8] shrink-0">
                      <span className="font-semibold">{project.orgBadge}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums text-[#475569] dark:text-[#94A3B8]">
                        {project.meta}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] font-medium">
                    {project.summary}
                  </p>

                  <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                    {project.highlights.map((item) => (
                      <li key={item.title} className="leading-relaxed">
                        <strong className="text-[#070B14] dark:text-[#F1F5F9] font-semibold">
                          {item.title}
                        </strong>{' '}
                        {item.description}
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs font-mono text-[#0A192F] dark:text-[#93C5FD] pt-0.5">
                    Công nghệ: {project.tags.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Skills Matrix */}
          <section className="space-y-4 cv-avoid-break">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
              Năng Lực Kỹ Thuật &amp; Hệ Sinh Thái Công Nghệ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SKILL_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl bg-[#F5F8FC] dark:bg-[#080E1A] border border-[#DCE6F2] dark:border-[#182740] space-y-1.5"
                >
                  <h4 className="font-display font-semibold text-lg text-[#070B14] dark:text-[#F1F5F9]">
                    {group.title}
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                    {group.description}
                  </p>
                  <p className="text-xs font-mono text-[#0369A1] dark:text-[#38BDF8] leading-relaxed pt-1">
                    {group.items.join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Practical AI Agent Experience */}
          <section className="space-y-3.5 cv-avoid-break">
            <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
              Kinh Nghiệm Sử Dụng AI Agent (Claude · Gemini · Codex · Grok)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {AI_AGENT_EXPERIENCE.map((agent) => (
                <div
                  key={agent.id}
                  className="p-4 rounded-2xl bg-[#F5F8FC] dark:bg-[#080E1A] border border-[#DCE6F2] dark:border-[#182740] space-y-1.5"
                >
                  <div className="space-y-0.5">
                    <h4 className="font-display font-semibold text-lg text-[#070B14] dark:text-[#F1F5F9]">
                      {agent.name}
                    </h4>
                    <p className="text-[11px] font-mono text-[#0369A1] dark:text-[#38BDF8]">
                      {agent.roleSummary}
                    </p>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed pt-0.5">
                    {agent.simpleUsage}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Portfolio & Exhibition Cross-Reference Footer inside Sheet */}
          <div className="pt-4 border-t border-[#DCE6F2] dark:border-[#182740] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
            <div className="inline-flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#0284C7] shrink-0" aria-hidden="true" />
              <span>
                Hồ sơ trực tuyến &amp; minh chứng năng lực sáng tạo hình ảnh AI · Cập nhật 2026
              </span>
            </div>
            <a
              href="/trien-lam"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('gallery');
              }}
              className="no-print inline-flex items-center gap-1.5 font-medium text-[#0369A1] dark:text-[#38BDF8] hover:underline underline-offset-4"
            >
              <Images className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Xem Triển Lãm Ảnh &amp; Video (28 tác phẩm)</span>
            </a>
          </div>
        </div>
      </article>
    </section>
  );
}
