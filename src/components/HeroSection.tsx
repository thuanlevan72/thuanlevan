import { BrainCircuit, Leaf, Network, Terminal, Trees } from 'lucide-react';
import { PORTFOLIO_PROFILE } from '../data/portfolioData.ts';

export function HeroSection() {
  const scrollToTerminal = () => {
    const el = document.getElementById('terminal-box');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="overview" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
      <div className="lg:col-span-7 space-y-6">
        <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 dark:bg-dark-surface-variant border border-emerald-300 dark:border-dark-outline text-label-sm font-mono shadow-sm">
          <span className="text-cyan dark:text-sky-400 font-bold">NHÂM NGỌ 2002</span>
          <span className="text-light-on-surface-variant dark:text-dark-on-surface-variant">•</span>
          <span className="text-emerald-900 dark:text-dark-primary font-bold">Dương Liễu Mộc</span>
          <span className="text-light-on-surface-variant dark:text-dark-on-surface-variant">•</span>
          <span className="text-indigo-900 dark:text-indigo-400 font-bold">Thủy Dưỡng Mộc</span>
        </div>

        <h1 className="font-headline font-bold text-display-lg-mobile md:text-display-lg text-light-on-surface dark:text-dark-on-surface tracking-tight leading-tight text-balance">
          Sinh Khí{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 via-teal-700 to-sky-800 dark:from-dark-primary dark:via-sky-400 dark:to-indigo-400">
            Tươi Sáng &amp; <span className="whitespace-nowrap">Bền Bỉ</span>
          </span>
          , Vận Hành Triệu Giao Dịch.
        </h1>

        <p className="font-body text-body-lg text-light-on-surface-variant dark:text-dark-on-surface-variant leading-relaxed max-w-2xl text-pretty">
          Tôi là{' '}
          <strong className="text-light-on-surface dark:text-dark-on-surface font-semibold">
            {PORTFOLIO_PROFILE.fullName}
          </strong>
          , sinh năm 2002 (Nhâm Ngọ). Đúng với tinh thần{' '}
          <em className="text-emerald-800 dark:text-dark-primary font-bold">
            &ldquo;Dương Liễu Mộc&rdquo;
          </em>{' '}
          — dẻo dai đón gió trước mọi biến động công nghệ, nhưng bộ rễ backend lại cắm sâu kiên cố:
          gần{' '}
          <strong className="text-emerald-800 dark:text-dark-primary font-bold">
            4 năm thực chiến
          </strong>{' '}
          tôi luyện qua các hệ thống tài chính ngân hàng (Agribank), bệnh viện thông minh (Phenikaa)
          và nền tảng AI thế hệ mới (MISA).
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <a
            href="#architecture"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-light-surface-variant dark:bg-dark-surface-variant border border-light-outline dark:border-dark-outline hover:border-emerald-600 dark:hover:border-dark-primary/60 text-light-on-surface dark:text-dark-on-surface font-body font-semibold text-label-lg transition group shadow-sm hover:shadow-md"
          >
            <Trees
              className="w-5 h-5 text-emerald-700 dark:text-dark-primary group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
            <span>Khám Phá Các Hệ Thống Đã Vận Hành</span>
          </a>

          <button
            type="button"
            onClick={scrollToTerminal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-50 dark:bg-dark-surface-variant/40 hover:bg-emerald-100 dark:hover:bg-dark-surface-variant border border-emerald-300 dark:border-dark-outline text-light-on-surface dark:text-dark-on-surface font-mono text-label-sm font-semibold transition cursor-pointer"
          >
            <Terminal className="w-5 h-5 text-cyan dark:text-sky-400" aria-hidden="true" />
            <span>Mở Terminal Tương Tác</span>
          </button>
        </div>

        {/* Highlight Core Badges: Ngũ Hành Hài Hòa */}
        <div className="pt-4 flex flex-wrap gap-2 text-label-sm font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-light-surface-variant dark:bg-dark-surface-variant border border-light-outline/70 dark:border-dark-outline text-light-on-surface-variant dark:text-dark-on-surface-variant shadow-sm">
            🌊 Năng Lượng Thủy (Dòng Nước):{' '}
            <span className="text-cyan dark:text-sky-400 font-bold">
              Kafka, Event Streams, Sub-ms SQL
            </span>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-light-surface-variant dark:bg-dark-surface-variant border border-light-outline/70 dark:border-dark-outline text-light-on-surface-variant dark:text-dark-on-surface-variant shadow-sm">
            🌿 Năng Lượng Mộc (Sinh Trưởng):{' '}
            <span className="text-emerald-800 dark:text-dark-primary font-bold">
              C# .NET 8, Clean Architecture, CQRS
            </span>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-light-surface-variant dark:bg-dark-surface-variant border border-light-outline/70 dark:border-dark-outline text-light-on-surface-variant dark:text-dark-on-surface-variant shadow-sm">
            ✨ Khai Phóng Trí Tuệ:{' '}
            <span className="text-indigo-900 dark:text-indigo-400 font-bold">
              MISA OneAI, LLM Integration
            </span>
          </span>
        </div>
      </div>

      {/* Avatar & Phong Thủy Visual Card */}
      <div className="lg:col-span-5 relative">
        <div className="relative mx-auto max-w-[408px] rounded-2xl p-1 bg-gradient-to-b from-emerald-400/50 via-cyan-400/35 to-light-outline dark:from-dark-primary/40 dark:via-sky-400/25 dark:to-dark-outline border border-emerald-300 dark:border-dark-primary/30 shadow-[0_12px_40px_-5px_rgba(4,120,87,0.18)] dark:shadow-[0_0_50px_-10px_rgba(16,185,129,0.25)]">
          <div className="rounded-xl bg-light-surface-variant dark:bg-dark-surface-variant p-6 space-y-6 leaf-glass transition-colors">
            {/* Profile Header inside card */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={PORTFOLIO_PROFILE.avatarSrc}
                  alt={PORTFOLIO_PROFILE.fullName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-emerald-500 dark:border-dark-primary/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-light-surface dark:bg-dark-surface flex items-center justify-center border border-emerald-400 dark:border-dark-primary/40">
                  <span className="w-3 h-3 rounded-full bg-light-primary dark:bg-dark-primary animate-pulse" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-headline-md text-light-on-surface dark:text-dark-on-surface">
                    {PORTFOLIO_PROFILE.fullName}
                  </h3>
                  <Leaf
                    className="w-5 h-5 text-emerald-700 dark:text-dark-primary shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-mono text-label-sm text-cyan dark:text-sky-400 font-bold">
                  {PORTFOLIO_PROFILE.role}
                </p>
                <p className="text-body-sm text-light-on-surface-variant dark:text-dark-on-surface-variant">
                  {PORTFOLIO_PROFILE.location}
                </p>
              </div>
            </div>

            {/* Phong Thủy Mệnh Mộc Matrix Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-dark-surface/90 border border-emerald-300 dark:border-dark-primary/30 space-y-1.5 font-mono text-label-sm">
              <div className="flex items-center justify-between gap-2 text-emerald-900 dark:text-dark-primary font-bold">
                <span className="flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>BẢN MỆNH NGŨ HÀNH</span>
                </span>
                <span>DƯƠNG LIỄU MỘC</span>
              </div>
              <div className="text-body-sm text-light-on-surface dark:text-dark-on-surface font-body">
                Hợp Thủy (Xanh Dương, Nước Trong, Cyan) &amp; Hợp Mộc (Xanh Lục, Ngọc Bích). Mang
                lại sinh khí dồi dào, trí tuệ sáng sủa và sự phát triển thăng tiến vượt bậc.
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-outline/80 dark:border-dark-outline shadow-sm">
                <div className="text-label-sm font-mono text-light-on-surface-variant dark:text-dark-on-surface-variant">
                  THỜI GIAN THỰC CHIẾN
                </div>
                <div className="text-headline-lg font-headline font-bold text-emerald-700 dark:text-dark-primary">
                  ~4{' '}
                  <span className="text-body-sm font-normal text-light-on-surface-variant dark:text-dark-on-surface-variant">
                    Năm
                  </span>
                </div>
                <div className="text-label-sm text-light-on-surface-variant dark:text-dark-on-surface-variant font-mono">
                  08/2022 - Hiện tại
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-light-surface dark:bg-dark-surface border border-light-outline/80 dark:border-dark-outline shadow-sm">
                <div className="text-label-sm font-mono text-light-on-surface-variant dark:text-dark-on-surface-variant">
                  QUY MÔ DỰ ÁN
                </div>
                <div className="text-headline-lg font-headline font-bold text-cyan dark:text-sky-400">
                  60{' '}
                  <span className="text-body-sm font-normal text-light-on-surface-variant dark:text-dark-on-surface-variant">
                    Devs
                  </span>
                </div>
                <div className="text-label-sm text-light-on-surface-variant dark:text-dark-on-surface-variant font-mono">
                  Enterprise Level
                </div>
              </div>
            </div>

            {/* Quick Spec Rows */}
            <div className="space-y-2 font-mono text-[11px] sm:text-label-sm pt-2 border-t border-light-outline/60 dark:border-dark-outline text-light-on-surface-variant dark:text-dark-on-surface-variant">
              <div className="flex justify-between gap-3">
                <span className="shrink-0">Triết Lý Kiến Trúc:</span>
                <span className="text-light-on-surface dark:text-dark-on-surface font-semibold text-right">
                  Clean Architecture &amp; CQRS
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="shrink-0">Tốc Độ Xử Lý:</span>
                <span className="text-emerald-800 dark:text-dark-primary font-bold text-right">
                  Sub-ms Query Indexing
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="shrink-0">Dòng Chảy Dữ Liệu:</span>
                <span className="text-cyan dark:text-sky-400 font-bold text-right">
                  Kafka &amp; Event-Driven Pub/Sub
                </span>
              </div>
            </div>

            {/* Direct Action in Card */}
            <div className="pt-2">
              <a
                href={PORTFOLIO_PROFILE.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-light-surface-variant dark:hover:bg-dark-outline/70 border border-light-outline dark:border-dark-outline text-light-on-surface dark:text-dark-on-surface font-body text-label-lg transition shadow-sm font-medium"
              >
                <Network className="w-5 h-5" aria-hidden="true" />
                <span>Khám Phá GitHub Repositories</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
