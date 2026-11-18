import { Mail, Phone } from 'lucide-react';
import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';

export function RecruiterCta() {
  return (
    <section className="p-8 md:p-12 rounded-2xl bg-emerald-900 text-white relative overflow-hidden shadow-2xl">
      <div className="max-w-3xl space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 font-mono text-label-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>SẴN SÀNG CHO CÁC THỬ THÁCH MỚI</span>
        </div>

        <h2 className="font-headline font-bold text-headline-xl-mobile md:text-headline-xl text-white leading-tight text-balance">
          Bạn Đang Cần Một Lập Trình Viên Backend C# .NET Đã Qua Thực Chiến?
        </h2>

        <p className="font-body text-body-lg text-emerald-100 text-pretty">
          Dù là dự án Microservices mới tinh, bài toán tối ưu truy vấn cơ sở dữ liệu ngàn req/s,
          hay tích hợp mô hình AI vào quy trình doanh nghiệp — tôi luôn sẵn sàng mang lại giá trị đo
          đếm được.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href={PORTFOLIO_PROFILE.phoneHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-emerald-900 font-body font-bold text-label-lg hover:bg-emerald-50 transition shadow-lg"
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            <span>Gọi Điện: {PORTFOLIO_PROFILE.phoneFormatted}</span>
          </a>

          <a
            href={PORTFOLIO_PROFILE.emailHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-950/80 border border-white/30 hover:bg-emerald-950 text-white font-body font-semibold text-label-lg transition"
          >
            <Mail className="w-5 h-5" aria-hidden="true" />
            <span>Gửi Email Trực Tiếp</span>
          </a>

          <a
            href={PORTFOLIO_PROFILE.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-950/60 border border-white/20 hover:border-white text-emerald-100 hover:text-white font-body text-label-lg transition"
          >
            <span>Facebook</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export function GlobalFooter() {
  return (
    <footer className="border-t border-light-outline/60 dark:border-dark-outline bg-light-surface-variant/40 dark:bg-dark-surface-variant/30 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-label-sm text-light-on-surface-variant dark:text-dark-on-surface-variant">
        <div className="text-center md:text-left">
          © 2026{' '}
          <strong className="text-light-on-surface dark:text-dark-on-surface">Lê Văn Thuận</strong>{' '}
          (Nhâm Ngọ 2002). Phong Thủy Thủy Sinh Mộc &amp; Kỹ Nghệ .NET.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <span>Hoài Đức - Hà Nội</span>
          <span>•</span>
          <a
            href={PORTFOLIO_PROFILE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan dark:text-sky-400 hover:underline font-bold"
          >
            GitHub Repos
          </a>
          <span>•</span>
          <a
            href="#overview"
            className="hover:text-light-primary dark:hover:text-dark-primary transition"
          >
            Về đầu trang ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
