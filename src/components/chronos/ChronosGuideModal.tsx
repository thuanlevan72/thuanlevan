import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  Layers3,
  Plus,
  Shield,
  Sparkles,
  SunMoon,
  Target,
  X,
} from 'lucide-react';
import type { NavSection } from '../../utils/chronosTypes.ts';

interface ChronosGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection: (section: NavSection) => void;
  onOpenQuickCapture: () => void;
}

type ChronosGuideChapterId =
  | 'start-blank'
  | 'time-blocking'
  | 'okr-eisenhower'
  | 'deep-work'
  | 'profiles-backup';

const CHAPTERS: Array<{
  id: ChronosGuideChapterId;
  shortLabel: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'start-blank',
    shortLabel: '1. Bắt đầu từ trang trắng',
    title: 'Khởi Tạo Không Gian Làm Việc Thực Tế Của Bạn',
    subtitle: 'ChronosFlow bắt đầu hoàn toàn trống — mọi OKR, dự án và lịch trình đều do bạn tự tạo.',
  },
  {
    id: 'time-blocking',
    shortLabel: '2. Lịch & Time-Blocking',
    title: 'Kéo-Thả Khung Giờ, Khối Mềm/Cứng & Tự Động Dời Lịch',
    subtitle: 'Phân biệt Hard-block / Soft-block, xử lý biến cố +20p họp kéo dài và tối ưu theo năng lượng.',
  },
  {
    id: 'okr-eisenhower',
    shortLabel: '3. Mục tiêu OKR & Ma trận',
    title: 'Cây Phân Cấp 4 Tầng & Ma Trận Eisenhower Tự Động',
    subtitle: 'Liên kết OKR Quý → Dự án → Đầu việc → Việc nhỏ và lọc ưu tiên theo Q1–Q4.',
  },
  {
    id: 'deep-work',
    shortLabel: '4. Deep Work & Nhịp Sinh Học',
    title: 'Đồng Hồ Tập Trung, Focus Shield & Nghi Thức Ngày',
    subtitle: 'Tích lũy tinh thể thực từ phiên tập trung, chọn Top 3 MIT buổi sáng và khóa ngày Shutdown.',
  },
  {
    id: 'profiles-backup',
    shortLabel: '5. Hồ sơ & Sao lưu JSON',
    title: 'Tách Biệt Hồ Sơ Người Dùng, Xuất CSV/ICS & Đặt Lại',
    subtitle: 'Quản lý nhiều hồ sơ độc lập, sao lưu JSON/Timesheet và đưa dữ liệu về trắng bất kỳ lúc nào.',
  },
];

export const ChronosGuideModal: React.FC<ChronosGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateSection,
  onOpenQuickCapture,
}) => {
  const [activeChapter, setActiveChapter] = useState<ChronosGuideChapterId>('start-blank');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeMeta = CHAPTERS.find((c) => c.id === activeChapter) ?? CHAPTERS[0];

  const jumpToSection = (section: NavSection) => {
    onClose();
    onNavigateSection(section);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 sm:p-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chronos-guide-title"
      data-testid="chronos-guide-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1424] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090E1A]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="chronos-guide-title"
                className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate"
              >
                Sách Hướng Dẫn Sử Dụng ChronosFlow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Quy trình từ trang trắng tới làm chủ lịch Time-Blocking, OKR &amp; Deep Work thực tế
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="chronos-guide-close-btn"
            onClick={onClose}
            aria-label="Đóng sách hướng dẫn"
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Chapter Sidebar */}
          <nav
            aria-label="Mục lục Sách hướng dẫn ChronosFlow"
            className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0A101F] p-2.5 flex md:flex-col gap-1.5 overflow-x-auto"
          >
            {CHAPTERS.map((chap) => {
              const active = chap.id === activeChapter;
              return (
                <button
                  key={chap.id}
                  type="button"
                  data-testid={`chronos-guide-tab-${chap.id}`}
                  onClick={() => setActiveChapter(chap.id)}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap md:whitespace-normal shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{chap.shortLabel}</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 hidden md:block shrink-0 ${active ? 'opacity-90' : 'opacity-40'}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}

            <div className="hidden md:block mt-auto pt-3 border-t border-slate-200 dark:border-slate-800 px-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Mẹo nhanh: Nhấn <kbd className="font-mono font-semibold text-slate-700 dark:text-slate-200">Ctrl+K</kbd> hoặc{' '}
              <kbd className="font-mono font-semibold text-slate-700 dark:text-slate-200">⌘K</kbd> ở mọi màn hình để thêm công việc dưới 3 giây.
            </div>
          </nav>

          {/* Reading Pane */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-1">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {activeMeta.shortLabel}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{activeMeta.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{activeMeta.subtitle}</p>
            </div>

            {activeChapter === 'start-blank' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      step: '01',
                      icon: Target,
                      title: 'Tạo OKR Quý & Dự án đầu tiên',
                      desc: 'Vào mục Mục Tiêu & Công Việc để tạo mục tiêu lớn (OKR) — hệ thống sẽ tạo kèm dự án triển khai, hoặc bạn có thể thêm việc độc lập ngay.',
                    },
                    {
                      step: '02',
                      icon: Plus,
                      title: 'Thu thập nhanh bằng cú pháp ⌘K',
                      desc: 'Bấm Nhập nhanh hoặc Ctrl+K, gõ tên việc kèm #45p (thời lượng), !khan (khẩn cấp), @cao hoặc @thap (tải trí lực).',
                    },
                    {
                      step: '03',
                      icon: CalendarClock,
                      title: 'Xếp việc vào Lịch Sinh Học',
                      desc: 'Kéo đầu việc từ Kho Đầu Việc vào khung giờ mong muốn hoặc bấm "Xếp khe tối ưu" để ChronosFlow chọn đúng giờ đỉnh/trũng năng lượng.',
                    },
                    {
                      step: '04',
                      icon: Flame,
                      title: 'Chạy phiên Deep Work & Lưu tự động',
                      desc: 'Mọi thay đổi được ghi trực tiếp vào hồ sơ JSON riêng của bạn. Tinh thể RPG và phút tích lũy chỉ tăng khi bạn hoàn tất phiên thật.',
                    },
                  ].map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.step}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-1.5"
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <span className="font-mono">BƯỚC {card.step}</span>
                          <span>·</span>
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title}</div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{card.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Ví dụ cú pháp gõ nhanh trong Quick Capture (⌘K)
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-slate-800 dark:text-slate-200">
                    Viết tài liệu kiến trúc hệ thống #60p !khan @cao
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Tự động tách thành: Tiêu đề <strong className="text-slate-800 dark:text-slate-200">Viết tài liệu kiến trúc hệ thống</strong> · Thời lượng <span className="font-mono">60p</span> · Mức ưu tiên <span className="font-mono">Khẩn cấp</span> · Trí lực <span className="font-mono">Cao (Deep Work)</span>.
                  </div>
                </div>
              </div>
            )}

            {activeChapter === 'time-blocking' && (
              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2.5">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    1. Phân biệt Khối Mềm (Soft-block) và Khối Cứng (Hard-block)
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>
                      <strong className="text-blue-700 dark:text-blue-300">Khối Mềm (Xanh dương · Mở khóa):</strong> Linh hoạt. Khi bạn bấm <em>+20p Họp kéo dài</em>, <em>Chèn việc khẩn</em> hoặc <em>Tối ưu theo Năng lượng</em>, thuật toán tự dời các khối mềm sang khe trống kế tiếp.
                    </li>
                    <li>
                      <strong className="text-red-700 dark:text-red-300">Khối Cứng (Đỏ · Khóa):</strong> Cố định tuyệt đối (lịch gặp khách hàng, deadline cứng). Thuật toán không bao giờ tự ý dịch chuyển khối cứng.
                    </li>
                    <li>
                      <strong className="text-slate-800 dark:text-slate-200">Thao tác nhanh trên từng khối:</strong> Bấm dấu tích để hoàn thành, bấm ổ khóa để chuyển Mềm/Cứng, bấm <span className="font-mono">-15 / +15</span> để đổi thời lượng hoặc kéo-thả trực tiếp sang giờ/ngày khác.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2.5">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    2. Vùng năng lượng &amp; Đồng bộ lịch (.ics)
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>
                      <strong>Vùng xanh lá (Đỉnh cao trí tuệ):</strong> Mặc định <span className="font-mono">09:30–12:00</span>. Nên đặt các việc đòi hỏi tư duy sâu (High Cognitive Load).
                    </li>
                    <li>
                      <strong>Vùng vàng nhạt (Trũng năng lượng):</strong> Mặc định <span className="font-mono">14:00–16:00</span>. Phù hợp họp ngắn, trả lời email hoặc việc nhẹ.
                    </li>
                    <li>
                      <strong>Nhập/Xuất .ics &amp; Nguồn lịch ngoài:</strong> Bạn có thể tự thêm tên nguồn lịch (Google/Outlook/Apple) hoặc nhập file <span className="font-mono">.ics</span> thật từ lịch cá nhân của mình.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeChapter === 'okr-eisenhower' && (
              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers3 className="h-4 w-4 text-blue-600" />
                    <span>Bảng Kanban Kéo Thả &amp; Cấu trúc 4 tầng</span>
                  </h4>
                  <p>
                    Trong <strong className="text-slate-900 dark:text-slate-100">Bảng Kanban</strong>, bạn có thể kéo-thả trực tiếp thẻ công việc qua 3 cột:{' '}
                    <strong className="text-slate-900 dark:text-slate-100">Mới tạo → Đang làm → Hoàn thành</strong> (giống Jira / Trello), sắp xếp lại thứ tự ưu tiên hoặc bấm nút chuyển nhanh trên từng thẻ.
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-slate-100">OKR Quý</strong> (Mục tiêu lớn) →{' '}
                    <strong className="text-slate-900 dark:text-slate-100">Dự án</strong> (Nhóm triển khai) →{' '}
                    <strong className="text-slate-900 dark:text-slate-100">Đầu việc</strong> (Có ước lượng phút, tải trí lực) →{' '}
                    <strong className="text-slate-900 dark:text-slate-100">Việc nhỏ (Checklist)</strong>. Tiến độ OKR tự động cập nhật ngay khi bạn kéo thẻ qua cột Hoàn thành.
                  </p>
                  <p>
                    Nếu bạn chưa muốn tạo OKR, các đầu việc tạo bằng Quick Capture hoặc trực tiếp trên cột Mới tạo sẽ sẵn sàng để bạn kéo-thả và theo dõi ngay.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      q: 'Q1 · Làm Ngay',
                      rule: 'Khẩn cấp + Quan trọng',
                      desc: 'Ưu tiên xếp khe sớm nhất hoặc xử lý trực tiếp qua Chèn việc khẩn.',
                    },
                    {
                      q: 'Q2 · Lên Lịch Deep Work',
                      rule: 'Quan trọng + Không khẩn',
                      desc: 'Nhóm tạo giá trị dài hạn nhất — ưu tiên đặt vào giờ Đỉnh cao trí tuệ.',
                    },
                    {
                      q: 'Q3 · Ủy Quyền / Gom Nhóm',
                      rule: 'Khẩn + Ít quan trọng',
                      desc: 'Đưa vào trũng năng lượng buổi chiều hoặc điều phối sang thành viên rảnh.',
                    },
                    {
                      q: 'Q4 · Loại Bỏ / Giảm Tải',
                      rule: 'Không khẩn + Không quan trọng',
                      desc: 'Cân nhắc xóa hoặc chỉ làm khi các MIT chính đã hoàn tất.',
                    },
                  ].map((item) => (
                    <div
                      key={item.q}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3 space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.q}</div>
                      <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{item.rule}</div>
                      <p className="text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeChapter === 'deep-work' && (
              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span>Chu kỳ tập trung &amp; Âm thanh WebAudio</span>
                    </div>
                    <p>
                      Chọn 1 trong 3 nhịp khoa học: <strong>Pomodoro 25/5</strong>, <strong>Deep 50/10</strong> hoặc <strong>Ultradian 90/20</strong>. Gắn đúng đầu việc để phút thực tế cộng trực tiếp vào báo cáo sai số ước lượng.
                    </p>
                    <p>
                      Bật âm thanh nền tổng hợp trực tiếp trong trình duyệt (White/Brown Noise, Tiếng mưa hoặc Binaural 40Hz) để lọc tạp âm.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>Focus Shield, Idle Detection &amp; RPG</span>
                    </div>
                    <p>
                      Khi chuyển tab quá 2 phút trong lúc chạy đồng hồ, hệ thống hỏi có muốn trừ thời gian rỗi để số liệu chấm công luôn trung thực.
                    </p>
                    <p>
                      Hoàn tất phiên thật sẽ tích lũy <strong>Tinh thể</strong> để nâng cấp Bàn làm việc, Đèn, Giá sách và Cửa sổ trong Phòng Focus Kiến Tạo.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-1.5">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <SunMoon className="h-4 w-4 text-amber-500" />
                    <span>Nghi thức Đầu ngày (3 MIT) &amp; Cuối ngày (Shutdown)</span>
                  </div>
                  <p>
                    Mỗi sáng chọn tối đa <strong>3 đầu việc quan trọng nhất (MIT)</strong> để giữ tiêu điểm. Cuối ngày nhập vài dòng tổng kết và bấm <em>Hoàn tất ngày</em> — các khối mềm chưa xong sẽ tự động dời sang ngày mai để bạn nghỉ ngơi trọn vẹn.
                  </p>
                </div>
              </div>
            )}

            {activeChapter === 'profiles-backup' && (
              <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-blue-600" />
                    <span>Hồ sơ riêng &amp; Tệp dữ liệu độc lập</span>
                  </h4>
                  <ul className="space-y-1.5 list-disc pl-4">
                    <li>
                      Ở góc trên thanh bên trái, bạn có thể bấm nút <strong>Thêm người dùng (+)</strong> để tạo nhiều hồ sơ riêng (ví dụ: Cá nhân, Công ty, Học tập). Mỗi hồ sơ bắt đầu trắng hoàn toàn và lưu thành tệp JSON riêng biệt.
                    </li>
                    <li>
                      Trong mục <strong>Phân Tích &amp; Chấm Công</strong>, bấm <em>Tải Timesheet CSV</em> để xuất bảng giờ làm thực tế.
                    </li>
                    <li>
                      Trong mục <strong>Lộ Trình &amp; Gói Dịch Vụ</strong>, bạn có thể <em>Sao lưu JSON</em>, <em>Khôi phục từ JSON</em> hoặc bấm <em>Xóa &amp; Đặt lại dữ liệu trắng</em> để làm sạch toàn bộ lịch sử về trạng thái ban đầu.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/25 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">Sẵn sàng bắt đầu?</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        Hãy thêm đầu việc đầu tiên của bạn qua Quick Capture hoặc tạo một OKR Quý mới.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQuickCapture();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Mở Nhập nhanh (⌘K)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Navigation Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="guide-action-quick-capture"
                  onClick={() => {
                    onClose();
                    onOpenQuickCapture();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Mở Nhập nhanh (⌘K)</span>
                </button>
                <button
                  type="button"
                  data-testid="guide-action-kanban"
                  onClick={() => jumpToSection('kanban')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Layers3 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Đi tới Bảng Kanban</span>
                </button>
                <button
                  type="button"
                  data-testid="guide-action-goals"
                  onClick={() => jumpToSection('goals')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Target className="h-3.5 w-3.5 text-blue-600" />
                  <span>Đi tới Mục tiêu</span>
                </button>
                <button
                  type="button"
                  data-testid="guide-action-rituals"
                  onClick={() => jumpToSection('rituals')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <SunMoon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Đi tới Nghi thức</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 cursor-pointer"
              >
                Đã hiểu, đóng sách
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
