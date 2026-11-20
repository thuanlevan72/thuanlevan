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
  CV_TEMPLATE_OPTIONS,
  CvSourceData,
  CvTemplateId,
  resolveTemplateSelection,
  SHOWCASE_TEMPLATE_IDS,
  ThemeMode,
} from '../utils/portfolioLogic.ts';
import { BrandLogo } from './BrandLogo.tsx';
import { TemplateSwitcherBar } from './TemplateSwitcherBar.tsx';

interface CvPdfSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onNavigate: (route: AppRoute, sectionId?: string) => void;
}

const CV_ID_PORTRAIT_SRC = '/assets/gallery/chan-dung-the-xanh.webp';
const CV_TEMPLATE_STORAGE_KEY = 'thuanle-cv-template';

const CV_SUMMARY_PARAGRAPH =
  'Kỹ sư hệ thống Senior .NET với gần 4 năm kinh nghiệm thực chiến (từ 08/2022 đến nay) trong việc thiết kế và vận hành các nền tảng doanh nghiệp chịu tải cao: Ngân hàng số & Phòng chống rửa tiền (Smart Form Agribank), Y tế thông minh (Phenikaa MEC với đội ngũ 60 kỹ sư), Công nghệ giáo dục (Lotus & Nguyễn Siêu) và Hệ sinh thái AI Media Generation (MISA OneAI for Family). Thế mạnh cốt lõi về C# .NET Core 8, Clean Architecture, CQRS, tối ưu truy vấn SQL/Oracle/PostgreSQL dưới 50ms, Apache Kafka, Redis và ứng dụng thành thạo AI Agent (Claude, Gemini, Codex, Grok) vào quy trình phát triển phần mềm an toàn.';

export function CvPdfSection({ theme, onToggleTheme, onNavigate }: CvPdfSectionProps) {
  const [cvTemplate, setCvTemplate] = useState<CvTemplateId>(() => {
    try {
      return resolveTemplateSelection(
        localStorage.getItem(CV_TEMPLATE_STORAGE_KEY),
        SHOWCASE_TEMPLATE_IDS,
        'modern'
      );
    } catch {
      return 'modern';
    }
  });
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

  const handleChangeTemplate = (nextTemplate: CvTemplateId) => {
    setCvTemplate(nextTemplate);
    try {
      localStorage.setItem(CV_TEMPLATE_STORAGE_KEY, nextTemplate);
    } catch {
      // Ignore storage errors
    }
  };

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatus(null);
    try {
      const filename = await downloadPortfolioCvPdf(cvSourceData, {
        portraitSrc: CV_ID_PORTRAIT_SRC,
        summaryParagraph: CV_SUMMARY_PARAGRAPH,
        template: cvTemplate,
      });
      setExportStatus({
        type: 'success',
        message: `Đã tạo và tải xuống file ${filename} theo đúng mẫu đang chọn.`,
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

  const sheetSurfaceClass =
    cvTemplate === 'classical'
      ? 'max-w-4xl mx-auto rounded-3xl border-2 border-[#CBB58D] dark:border-[#4F3B24] bg-[#FBF6EC] dark:bg-[#120E0B] shadow-[0_24px_64px_-24px_rgba(92,61,32,0.22)] overflow-hidden p-2 sm:p-3'
      : cvTemplate === 'retro'
      ? 'max-w-4xl mx-auto rounded-2xl border-2 border-dashed border-[#A67B5B] dark:border-[#785535] bg-[#F4ECD8] dark:bg-[#16120E] shadow-[0_24px_64px_-24px_rgba(67,40,24,0.28)] overflow-hidden'
      : cvTemplate === 'introvert'
      ? 'max-w-3xl mx-auto rounded-2xl border border-[#E2E8F0] dark:border-[#1E293B] bg-white dark:bg-[#0D1117] shadow-xs overflow-hidden'
      : cvTemplate === 'youthful'
      ? 'max-w-4xl mx-auto rounded-3xl border-2 border-[#0F172A] dark:border-[#2DD4BF]/50 bg-white dark:bg-[#0B1220] shadow-[8px_8px_0px_#2563EB] dark:shadow-[8px_8px_0px_#0D9488] overflow-hidden'
      : 'max-w-4xl mx-auto rounded-3xl border border-[#DCE6F2] dark:border-[#182740] bg-white dark:bg-[#0B1220] shadow-[0_24px_64px_-24px_rgba(10,25,47,0.18)] dark:shadow-[0_28px_64px_-20px_rgba(0,0,0,0.75)] overflow-hidden';

  const headingAccentClass =
    cvTemplate === 'classical'
      ? 'text-[#9E2A2B] dark:text-[#F4B860] border-[#DFCDAE] dark:border-[#3A2B1B]'
      : cvTemplate === 'retro'
      ? 'text-[#B45309] dark:text-[#FBBF24] border-dashed border-[#A67B5B]/60 dark:border-[#5C422B]'
      : cvTemplate === 'youthful'
      ? 'text-[#0D9488] dark:text-[#2DD4BF] border-[#CCFBF1] dark:border-[#134E4A]'
      : cvTemplate === 'introvert'
      ? 'text-[#475569] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#1E293B]'
      : 'text-[#0369A1] dark:text-[#38BDF8] border-[#E9F0F8] dark:border-[#152339]';

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
              Chọn 1 trong 6 phong cách CV đặc sắc bên dưới — từ Hiện Đại, Cổ Trang, Hướng Nội,
              Hướng Ngoại đến Trẻ Trung hay Hoài Cổ — rồi tải file PDF chuẩn A4 đồng bộ.
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

        <TemplateSwitcherBar
          id="cv-template-switcher"
          label="Phong Cách CV"
          ariaLabel="Chọn phong cách trình bày CV PDF"
          options={CV_TEMPLATE_OPTIONS}
          activeId={cvTemplate}
          onChange={handleChangeTemplate}
        />

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
        data-template={cvTemplate}
        aria-label="Hồ sơ CV điện tử của Lê Văn Thuận"
        className={sheetSurfaceClass}
      >
        {/* 1. HIỆN ĐẠI — 2 Cột Navy Studio */}
        {cvTemplate === 'modern' ? (
          <>
            <div className="h-2 bg-gradient-to-r from-[#05080F] via-[#0A192F] to-[#0284C7]" />
            <div className="grid grid-cols-1 md:grid-cols-12">
              <aside className="md:col-span-4 bg-[#0A192F] text-white p-6 sm:p-8 space-y-7 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex flex-col items-center sm:items-start gap-4">
                    <div className="w-28 h-36 rounded-2xl overflow-hidden border border-white/20 bg-[#05080F] shadow-md">
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
                  </div>

                  <div className="space-y-2.5 border-t border-white/15 pt-5">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] font-semibold">
                      Liên Hệ
                    </h3>
                    <div className="space-y-2 text-xs text-slate-200">
                      <a
                        href={PORTFOLIO_PROFILE.phoneHref}
                        className="flex items-center gap-2 hover:text-[#38BDF8] transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                        <span className="font-mono tabular-nums">
                          {PORTFOLIO_PROFILE.phoneFormatted}
                        </span>
                      </a>
                      <a
                        href={PORTFOLIO_PROFILE.emailHref}
                        className="flex items-center gap-2 hover:text-[#38BDF8] transition-colors break-all"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                        <span>{PORTFOLIO_PROFILE.email}</span>
                      </a>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                        <span>{PORTFOLIO_PROFILE.location}</span>
                      </div>
                      <a
                        href={PORTFOLIO_PROFILE.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-[#38BDF8] transition-colors break-all"
                      >
                        <Github className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                        <span>github.com/thuanlevan72</span>
                      </a>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-white/15 pt-5">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] font-semibold">
                      Chỉ Số Nổi Bật
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                      {HERO_METRICS.map((metric) => (
                        <div key={metric.id} className="space-y-0.5">
                          <p className="font-mono font-semibold text-base text-white tabular-nums">
                            {metric.value}
                          </p>
                          <p className="text-[11px] text-slate-300 leading-snug">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3.5 border-t border-white/15 pt-5">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8] font-semibold">
                      Kỹ Năng Cốt Lõi
                    </h3>
                    <div className="space-y-3">
                      {SKILL_GROUPS.map((group) => (
                        <div key={group.id} className="space-y-1">
                          <h4 className="text-xs font-semibold text-white">{group.title}</h4>
                          <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                            {group.items.join(' · ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-white/15 text-[11px] text-slate-300">
                  <div className="inline-flex items-center gap-2">
                    <BrandLogo size={18} className="rounded" />
                    <span className="font-mono">thuanlevan.vercel.app</span>
                  </div>
                </div>
              </aside>

              <div className="md:col-span-8 p-6 sm:p-9 space-y-7">
                <header className="space-y-1.5 border-b border-[#DCE6F2] dark:border-[#182740] pb-5">
                  <div className="inline-flex items-center gap-2 text-xs font-mono text-[#0369A1] dark:text-[#38BDF8]">
                    <span>HỒ SƠ ỨNG VIÊN · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}</span>
                  </div>
                  <h2 className="font-display font-semibold text-3xl sm:text-4xl text-[#070B14] dark:text-[#F1F5F9] leading-tight">
                    {PORTFOLIO_PROFILE.fullLegalName}
                  </h2>
                  <p className="text-sm sm:text-base font-semibold text-[#1D4ED8] dark:text-[#38BDF8]">
                    {PORTFOLIO_PROFILE.role}
                  </p>
                </header>

                <section className="space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
                    Tóm Tắt Chuyên Môn
                  </h3>
                  <p className="text-sm text-[#070B14] dark:text-[#CBD5E1] leading-relaxed text-pretty">
                    {CV_SUMMARY_PARAGRAPH}
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
                    Kinh Nghiệm &amp; Hệ Thống Production
                  </h3>

                  <div className="divide-y divide-[#E9F0F8] dark:divide-[#152339]">
                    {PORTFOLIO_PROJECTS.map((project) => (
                      <div key={project.id} className="py-3.5 first:pt-1 space-y-2 cv-avoid-break">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <h4 className="font-display font-semibold text-xl text-[#070B14] dark:text-[#F1F5F9]">
                            {project.title}
                          </h4>
                          <span className="text-xs font-mono text-[#0369A1] dark:text-[#38BDF8] shrink-0">
                            {project.orgBadge} · {project.meta}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#334155] dark:text-[#CBD5E1] font-medium">
                          {project.summary}
                        </p>
                        <ul className="space-y-1 pl-4 list-disc text-xs text-[#475569] dark:text-[#94A3B8]">
                          {project.highlights.map((item) => (
                            <li key={item.title} className="leading-relaxed">
                              <strong className="text-[#070B14] dark:text-[#F1F5F9] font-semibold">
                                {item.title}
                              </strong>{' '}
                              {item.description}
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] font-mono text-[#0A192F] dark:text-[#93C5FD]">
                          Công nghệ: {project.tags.join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3 cv-avoid-break">
                  <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] border-b border-[#E9F0F8] dark:border-[#152339] pb-1.5">
                    Kinh Nghiệm Sử Dụng AI Agent
                  </h3>
                  <div className="space-y-2.5">
                    {AI_AGENT_EXPERIENCE.map((agent) => (
                      <div key={agent.id} className="space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h4 className="font-semibold text-sm text-[#070B14] dark:text-[#F1F5F9]">
                            {agent.name}
                          </h4>
                          <span className="text-xs font-mono text-[#0369A1] dark:text-[#38BDF8]">
                            {agent.roleSummary}
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                          {agent.simpleUsage}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-4 border-t border-[#DCE6F2] dark:border-[#182740] flex flex-wrap items-center justify-between gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                    <span>Cập nhật 2026</span>
                  </span>
                  <a
                    href="/trien-lam"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('gallery');
                    }}
                    className="no-print inline-flex items-center gap-1.5 font-medium text-[#0369A1] dark:text-[#38BDF8] hover:underline underline-offset-4"
                  >
                    <Images className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Xem Triển Lãm Ảnh (28 tác phẩm)</span>
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 2. CỔ TRANG | 3. HƯỚNG NỘI | 4. HƯỚNG NGOẠI | 5. TRẺ TRUNG | 6. HOÀI CỔ */
          <div
            className={
              cvTemplate === 'classical'
                ? 'rounded-2xl border border-[#DFCDAE] dark:border-[#3A2B1B]'
                : ''
            }
          >
            {/* Optional Extrovert Bold Hero Banner */}
            {cvTemplate === 'extrovert' && (
              <header className="bg-gradient-to-r from-[#061124] via-[#0B234A] to-[#0284C7] text-white p-6 sm:p-10">
                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="inline-flex items-center gap-2 text-xs font-mono text-[#7DD3FC]">
                      <BrandLogo size={20} className="rounded-md" />
                      <span>HỒ SƠ ỨNG VIÊN · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}</span>
                    </div>
                    <h2 className="font-display font-bold text-3xl sm:text-5xl text-white leading-tight">
                      {PORTFOLIO_PROFILE.fullLegalName}
                    </h2>
                    <p className="text-sm sm:text-base font-semibold text-[#7DD3FC]">
                      {PORTFOLIO_PROFILE.role}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 pt-2 text-xs sm:text-sm text-slate-200">
                      <a href={PORTFOLIO_PROFILE.phoneHref} className="inline-flex items-center gap-2 hover:text-white">
                        <Phone className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                        <span className="font-mono">{PORTFOLIO_PROFILE.phoneFormatted}</span>
                      </a>
                      <a href={PORTFOLIO_PROFILE.emailHref} className="inline-flex items-center gap-2 hover:text-white truncate">
                        <Mail className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                        <span className="truncate">{PORTFOLIO_PROFILE.email}</span>
                      </a>
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                        <span>{PORTFOLIO_PROFILE.location}</span>
                      </div>
                      <a
                        href={PORTFOLIO_PROFILE.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:text-white truncate"
                      >
                        <Github className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
                        <span>github.com/thuanlevan72</span>
                      </a>
                    </div>
                  </div>
                  <div className="w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-[#38BDF8]/60 bg-[#05080F] shadow-xl shrink-0">
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
                </div>
              </header>
            )}

            {/* Main Single/Responsive Body for the remaining 5 distinct archetypes */}
            <div className="p-6 sm:p-11 space-y-8">
              {/* Top Accent Strip for Introvert / Youthful / Retro */}
              {cvTemplate === 'youthful' && (
                <div className="h-2 -mx-6 -mt-6 sm:-mx-11 sm:-mt-11 mb-6 bg-gradient-to-r from-[#2563EB] via-[#0284C7] to-[#0D9488]" />
              )}

              {/* Header for Classical, Introvert, Youthful, Retro */}
              {cvTemplate !== 'extrovert' && (
                <header
                  className={`flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-6 pb-7 border-b ${
                    cvTemplate === 'classical'
                      ? 'border-[#DFCDAE] dark:border-[#3A2B1B]'
                      : cvTemplate === 'retro'
                      ? 'border-dashed border-[#A67B5B] dark:border-[#634832]'
                      : 'border-[#DCE6F2] dark:border-[#1E293B]'
                  }`}
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="space-y-1.5">
                      {cvTemplate === 'classical' ? (
                        <span className="inline-block px-2.5 py-0.5 border border-[#9E2A2B] dark:border-[#E05252] font-mono text-[11px] font-bold text-[#9E2A2B] dark:text-[#F4B860] tracking-widest uppercase">
                          CÔNG DANH HỒ SƠ · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}
                        </span>
                      ) : cvTemplate === 'retro' ? (
                        <p className="font-mono text-[11px] font-bold tracking-widest uppercase text-[#B45309] dark:text-[#FBBF24]">
                          LƯU TRỮ HỒ SƠ SỐ 04 · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}
                        </p>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#0369A1] dark:text-[#38BDF8]">
                          <BrandLogo size={20} className="rounded-md" />
                          <span>HỒ SƠ ỨNG VIÊN · {PORTFOLIO_PROFILE.birthInfo.toUpperCase()}</span>
                        </div>
                      )}

                      <h2
                        className={`font-display font-semibold text-3xl sm:text-4xl leading-tight ${
                          cvTemplate === 'classical'
                            ? 'text-[#2A1B12] dark:text-[#F5E6D0]'
                            : cvTemplate === 'retro'
                            ? 'text-[#2C1810] dark:text-[#F5E6D3]'
                            : 'text-[#070B14] dark:text-[#F1F5F9]'
                        }`}
                      >
                        {PORTFOLIO_PROFILE.fullLegalName}
                      </h2>
                      <p
                        className={`text-sm sm:text-base font-semibold ${
                          cvTemplate === 'classical'
                            ? 'text-[#9E2A2B] dark:text-[#F4B860]'
                            : cvTemplate === 'retro'
                            ? 'text-[#B45309] dark:text-[#F59E0B]'
                            : cvTemplate === 'youthful'
                            ? 'text-[#0D9488] dark:text-[#2DD4BF]'
                            : cvTemplate === 'introvert'
                            ? 'text-[#475569] dark:text-[#94A3B8]'
                            : 'text-[#1D4ED8] dark:text-[#38BDF8]'
                        }`}
                      >
                        {PORTFOLIO_PROFILE.role}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 pt-2 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                      <a href={PORTFOLIO_PROFILE.phoneHref} className="inline-flex items-center gap-2 hover:underline">
                        <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="font-mono tabular-nums">
                          {PORTFOLIO_PROFILE.phoneFormatted}
                        </span>
                      </a>
                      <a href={PORTFOLIO_PROFILE.emailHref} className="inline-flex items-center gap-2 hover:underline truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{PORTFOLIO_PROFILE.email}</span>
                      </a>
                      <div className="inline-flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{PORTFOLIO_PROFILE.location}</span>
                      </div>
                      <a
                        href={PORTFOLIO_PROFILE.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:underline truncate"
                      >
                        <Github className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">github.com/thuanlevan72</span>
                      </a>
                    </div>
                  </div>

                  {/* Portrait styled authentically per template */}
                  {cvTemplate === 'retro' ? (
                    <figure className="p-2 pb-4 bg-white dark:bg-[#231C15] border border-[#D4C3A3] dark:border-[#4A3B2C] shadow-sm w-32 shrink-0">
                      <div className="aspect-[4/5] overflow-hidden bg-[#16120E]">
                        <img
                          src={CV_ID_PORTRAIT_SRC}
                          alt={`Ảnh thẻ lưu trữ ${PORTFOLIO_PROFILE.fullLegalName}`}
                          width={472}
                          height={709}
                          loading="eager"
                          decoding="sync"
                          className="w-full h-full object-cover object-top sepia-[.22]"
                        />
                      </div>
                      <figcaption className="pt-2 font-mono text-[9px] text-center font-bold text-[#5C3D2E] dark:text-[#D6B89C]">
                        PORTRAIT · 2026
                      </figcaption>
                    </figure>
                  ) : (
                    <div
                      className={`w-28 h-36 sm:w-32 sm:h-40 overflow-hidden bg-[#0A192F] shrink-0 ${
                        cvTemplate === 'classical'
                          ? 'rounded-t-full rounded-b-lg border-2 border-[#B48332] dark:border-[#9E7538] p-0.5 bg-white dark:bg-[#1A140F]'
                          : cvTemplate === 'youthful'
                          ? 'rounded-2xl border-2 border-[#0F172A] dark:border-[#2DD4BF] shadow-[4px_4px_0px_#0D9488]'
                          : 'rounded-2xl border border-[#CBD8E6] dark:border-[#1E3250]'
                      }`}
                    >
                      <img
                        src={CV_ID_PORTRAIT_SRC}
                        alt={`Ảnh thẻ chân dung kỹ sư ${PORTFOLIO_PROFILE.fullLegalName}`}
                        width={472}
                        height={709}
                        loading="eager"
                        decoding="sync"
                        className={`w-full h-full object-cover object-top ${
                          cvTemplate === 'classical' ? 'rounded-t-full rounded-b-md' : ''
                        }`}
                      />
                    </div>
                  )}
                </header>
              )}

              {/* Quantitative Metrics Row */}
              <div
                className={
                  cvTemplate === 'introvert'
                    ? 'grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[#E2E8F0] dark:border-[#1E293B] cv-avoid-break'
                    : 'grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 cv-avoid-break'
                }
              >
                {HERO_METRICS.map((metric, idx) => (
                  <div
                    key={metric.id}
                    className={
                      cvTemplate === 'introvert'
                        ? 'space-y-1'
                        : cvTemplate === 'classical'
                        ? 'p-4 rounded-xl bg-[#F5ECDA]/70 dark:bg-[#19130F] border border-[#DFCDAE] dark:border-[#3A2B1B] space-y-1'
                        : cvTemplate === 'retro'
                        ? 'p-3.5 rounded-lg bg-[#FAF4E6] dark:bg-[#1E1812] border border-dashed border-[#A67B5B] dark:border-[#5C422B] space-y-1'
                        : cvTemplate === 'youthful'
                        ? `p-4 rounded-2xl border-2 bg-white dark:bg-[#0D1626] space-y-1 ${
                            idx % 2 === 0
                              ? 'border-[#2563EB]/45 dark:border-[#3B82F6]/50'
                              : 'border-[#0D9488]/45 dark:border-[#2DD4BF]/50'
                          }`
                        : 'p-4 rounded-2xl bg-[#F0F7FF] dark:bg-[#081224] border border-[#BFDBFE] dark:border-[#1E3A5F] space-y-1'
                    }
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
                <h3
                  className={`text-xs font-mono uppercase tracking-wider font-semibold border-b pb-1.5 ${headingAccentClass}`}
                >
                  {cvTemplate === 'retro' ? '[ TÓM TẮT CHUYÊN MÔN ]' : 'Tóm Tắt Chuyên Môn'}
                </h3>
                <p className="text-sm text-[#070B14] dark:text-[#CBD5E1] leading-relaxed text-pretty">
                  {CV_SUMMARY_PARAGRAPH}
                </p>
              </section>

              {/* Production Experience & Systems */}
              <section className="space-y-4">
                <h3
                  className={`text-xs font-mono uppercase tracking-wider font-semibold border-b pb-1.5 ${headingAccentClass}`}
                >
                  {cvTemplate === 'retro'
                    ? '[ KINH NGHIỆM & HỆ THỐNG PRODUCTION ]'
                    : 'Kinh Nghiệm & Hệ Thống Production Trọng Điểm'}
                </h3>

                <div
                  className={`divide-y ${
                    cvTemplate === 'classical'
                      ? 'divide-[#DFCDAE] dark:divide-[#3A2B1B]'
                      : cvTemplate === 'retro'
                      ? 'divide-dashed divide-[#A67B5B]/60 dark:divide-[#5C422B]'
                      : 'divide-[#E9F0F8] dark:divide-[#152339]'
                  }`}
                >
                  {PORTFOLIO_PROJECTS.map((project, idx) => (
                    <div
                      key={project.id}
                      className="py-4 first:pt-1 last:pb-1 space-y-2.5 cv-avoid-break"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                        <h4 className="font-display font-semibold text-xl sm:text-[22px] text-[#070B14] dark:text-[#F1F5F9]">
                          {cvTemplate === 'youthful' && (
                            <span className="font-mono text-sm text-[#0D9488] dark:text-[#2DD4BF] mr-2">
                              #0{idx + 1}
                            </span>
                          )}
                          {cvTemplate === 'classical' && (
                            <span className="font-mono text-xs text-[#9E2A2B] dark:text-[#F4B860] mr-2">
                              CHƯƠNG 0{idx + 1} ·
                            </span>
                          )}
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
                <h3
                  className={`text-xs font-mono uppercase tracking-wider font-semibold border-b pb-1.5 ${headingAccentClass}`}
                >
                  {cvTemplate === 'retro'
                    ? '[ NĂNG LỰC KỸ THUẬT & CÔNG NGHỆ ]'
                    : 'Năng Lực Kỹ Thuật & Hệ Sinh Thái Công Nghệ'}
                </h3>

                {cvTemplate === 'introvert' ? (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                    {SKILL_GROUPS.map((group) => (
                      <div
                        key={group.id}
                        className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-baseline"
                      >
                        <h4 className="sm:col-span-4 font-display font-semibold text-base text-[#070B14] dark:text-[#F1F5F9]">
                          {group.title}
                        </h4>
                        <p className="sm:col-span-8 text-xs font-mono text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                          {group.items.join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SKILL_GROUPS.map((group) => (
                      <div
                        key={group.id}
                        className={`p-4 rounded-2xl border space-y-1.5 ${
                          cvTemplate === 'classical'
                            ? 'bg-[#F5ECDA]/70 dark:bg-[#19130F] border-[#DFCDAE] dark:border-[#3A2B1B]'
                            : cvTemplate === 'retro'
                            ? 'bg-[#FAF4E6] dark:bg-[#1E1812] border-dashed border-[#A67B5B] dark:border-[#5C422B]'
                            : 'bg-[#F5F8FC] dark:bg-[#080E1A] border-[#DCE6F2] dark:border-[#182740]'
                        }`}
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
                )}
              </section>

              {/* Practical AI Agent Experience */}
              <section className="space-y-3.5 cv-avoid-break">
                <h3
                  className={`text-xs font-mono uppercase tracking-wider font-semibold border-b pb-1.5 ${headingAccentClass}`}
                >
                  Kinh Nghiệm Sử Dụng AI Agent (Claude · Gemini · Codex · Grok)
                </h3>

                {cvTemplate === 'introvert' ? (
                  <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
                    {AI_AGENT_EXPERIENCE.map((agent) => (
                      <div
                        key={agent.id}
                        className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-baseline"
                      >
                        <div className="sm:col-span-4 space-y-0.5">
                          <h4 className="font-display font-semibold text-base text-[#070B14] dark:text-[#F1F5F9]">
                            {agent.name}
                          </h4>
                          <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                            {agent.roleSummary}
                          </p>
                        </div>
                        <p className="sm:col-span-8 text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                          {agent.simpleUsage}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {AI_AGENT_EXPERIENCE.map((agent) => (
                      <div
                        key={agent.id}
                        className={`p-4 rounded-2xl border space-y-1.5 ${
                          cvTemplate === 'classical'
                            ? 'bg-[#F5ECDA]/70 dark:bg-[#19130F] border-[#DFCDAE] dark:border-[#3A2B1B]'
                            : cvTemplate === 'retro'
                            ? 'bg-[#FAF4E6] dark:bg-[#1E1812] border-dashed border-[#A67B5B] dark:border-[#5C422B]'
                            : 'bg-[#F5F8FC] dark:bg-[#080E1A] border-[#DCE6F2] dark:border-[#182740]'
                        }`}
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
                )}
              </section>

              {/* Portfolio & Exhibition Cross-Reference Footer inside Sheet */}
              <div className="pt-4 border-t border-current/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
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
          </div>
        )}
      </article>
    </section>
  );
}
