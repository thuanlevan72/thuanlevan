import { useMemo, useState } from 'react';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData.ts';
import {
  filterProjects,
  getProjectCategoryCounts,
  ProfileTemplateId,
  ProjectCategory,
} from '../utils/portfolioLogic.ts';

interface ProjectsSectionProps {
  template: ProfileTemplateId;
}

export function ProjectsSection({ template }: ProjectsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');

  const counts = useMemo(() => getProjectCategoryCounts(PORTFOLIO_PROJECTS), []);
  const visibleProjects = useMemo(
    () => filterProjects(PORTFOLIO_PROJECTS, selectedCategory),
    [selectedCategory]
  );

  const filterTabs: { id: ProjectCategory; label: string }[] = [
    { id: 'all', label: `Tất Cả (${counts.all})` },
    { id: 'ai', label: `AI & Media (${counts.ai})` },
    { id: 'fintech', label: `Ngân Hàng (${counts.fintech})` },
    { id: 'healthcare', label: `Y Tế & Giáo Dục (${counts.healthcare})` },
  ];

  const isQuiet = template === 'introvert';

  return (
    <section
      id="systems"
      data-template={template}
      className={`scroll-mt-24 space-y-8 pt-6 ${isQuiet ? 'max-w-3xl mx-auto' : ''}`}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[#DCE6F2] dark:border-[#182740] pb-6">
        <div className="space-y-2 max-w-2xl">
          <p
            className={`text-xs font-medium tracking-wide ${
              template === 'classical'
                ? 'font-mono uppercase text-[#9E2A2B] dark:text-[#E05252]'
                : template === 'retro'
                ? 'font-mono uppercase text-[#B45309] dark:text-[#F59E0B]'
                : template === 'youthful'
                ? 'font-mono uppercase text-[#0D9488] dark:text-[#2DD4BF]'
                : 'text-[#0369A1] dark:text-[#38BDF8]'
            }`}
          >
            {template === 'classical'
              ? 'Bản Ký Sự Công Trình · Sáu Đại Hệ Thống'
              : template === 'retro'
              ? 'HỒ SƠ LƯU TRỮ DỰ ÁN · 2022 – 2026'
              : 'Kiến Trúc Phần Mềm · Hệ Thống Vận Hành Thực Tế'}
          </p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            {template === 'classical'
              ? 'Kinh Thành Hệ Thống & Nền Tảng AI'
              : 'Dự Án Doanh Nghiệp & Nền Tảng AI'}
          </h2>
          <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
            Không dừng lại ở mỹ thuật thị giác, nền tảng cốt lõi của tôi là các hệ thống C# .NET
            chịu tải cao phục vụ hàng triệu người dùng ngân hàng, y tế và giáo dục.
          </p>
        </div>

        <div
          id="project-filters"
          role="tablist"
          aria-label="Lọc dự án kỹ thuật theo lĩnh vực"
          className="flex items-center gap-1 p-1.5 rounded-xl bg-[#E8F0F9] dark:bg-[#0B1426] border border-[#DCE6F2] dark:border-[#182740] overflow-x-auto max-w-full shrink-0"
        >
          {filterTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#14233E] text-[#070B14] dark:text-[#F1F5F9] shadow-[0_2px_8px_-2px_rgba(10,25,47,0.12)]'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-[#F1F5F9]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. HIỆN ĐẠI — Flagship Bento + 3-Col Modular Grid */}
      {template === 'modern' && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
          id="projects-grid"
        >
          {visibleProjects.map((project, index) => {
            const isLead = index === 0 && visibleProjects.length > 1;
            return (
              <article
                key={project.id}
                data-category={project.category}
                className={`project-card soft-card p-6 sm:p-7 rounded-2xl bg-white/95 dark:bg-[#0B1220]/95 border border-[#DCE6F2] dark:border-[#182740] hover:border-[#0284C7]/55 dark:hover:border-[#38BDF8]/55 flex flex-col justify-between gap-5 ${
                  isLead ? 'md:col-span-2 lg:col-span-3' : ''
                }`}
              >
                <div className={isLead ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start' : 'space-y-4'}>
                  <div className={isLead ? 'lg:col-span-5 space-y-3' : 'space-y-3'}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-semibold text-[#1D4ED8] dark:text-[#38BDF8]">
                        {project.orgBadge} · {project.domainLabel}
                      </span>
                      <span className="font-mono tabular-nums">{project.meta}</span>
                    </div>
                    <h3 className="font-display text-2xl sm:text-[26px] font-semibold tracking-[-0.01em] text-[#070B14] dark:text-[#F1F5F9]">
                      {project.title}
                    </h3>
                    <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      {project.summary}
                    </p>
                  </div>

                  <ul
                    className={`${
                      isLead
                        ? 'lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 lg:pt-0'
                        : 'space-y-2 pt-3 border-t border-[#E9F0F8] dark:border-[#152339]'
                    } text-xs sm:text-[13px] text-[#475569] dark:text-[#94A3B8]`}
                  >
                    {project.highlights.map((item) => (
                      <li
                        key={item.title}
                        className={
                          isLead
                            ? 'p-4 rounded-xl bg-[#F5F8FC] dark:bg-[#080E1A] border border-[#E2EAF4] dark:border-[#152339] leading-relaxed space-y-1'
                            : 'leading-relaxed flex items-start gap-2'
                        }
                      >
                        {!isLead && (
                          <span
                            aria-hidden="true"
                            className="text-[#0284C7] dark:text-[#38BDF8] font-mono select-none mt-0.5"
                          >
                            —
                          </span>
                        )}
                        <div className={isLead ? 'space-y-1' : ''}>
                          <strong className="block text-[#0A192F] dark:text-[#F1F5F9] font-semibold">
                            {item.title}
                          </strong>
                          <span>{item.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#E9F0F8] dark:border-[#152339] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <p className="font-mono text-[#475569] dark:text-[#94A3B8]">
                    {project.tags.join(' · ')}
                  </p>
                  <span className="font-medium text-[#0369A1] dark:text-[#60A5FA] shrink-0">
                    {project.statusLabel}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 2. CỔ TRANG — Quyển Sách Khung Kép Thủy Mặc */}
      {template === 'classical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="projects-grid">
          {visibleProjects.map((project, idx) => (
            <article
              key={project.id}
              data-category={project.category}
              className="project-card p-6 sm:p-8 rounded-2xl bg-[#FBF6EC] dark:bg-[#120E0B] border-2 border-[#DFCDAE] dark:border-[#3F2F1D] flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#DFCDAE] dark:border-[#3A2B1B]">
                  <span className="px-2.5 py-0.5 border border-[#9E2A2B] dark:border-[#E05252] text-[#9E2A2B] dark:text-[#F4B860] font-mono text-[11px] font-bold">
                    CHƯƠNG 0{idx + 1} · {project.orgBadge}
                  </span>
                  <span className="font-mono text-xs text-[#6E533B] dark:text-[#C8B29A]">
                    {project.meta}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl sm:text-[26px] font-semibold text-[#2A1B12] dark:text-[#F5E6D0]">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[#5C4633] dark:text-[#C8B29A] leading-relaxed italic">
                    {project.summary}
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs sm:text-sm text-[#4A3625] dark:text-[#D6C2AA]">
                  {project.highlights.map((item) => (
                    <li key={item.title} className="leading-relaxed flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="text-[#9E2A2B] dark:text-[#F4B860] font-serif font-bold mt-0.5"
                      >
                        ◆
                      </span>
                      <span>
                        <strong className="text-[#2A1B12] dark:text-[#F5E6D0] font-semibold">
                          {item.title}
                        </strong>{' '}
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-[#DFCDAE] dark:border-[#3A2B1B] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-[#6E533B] dark:text-[#C8B29A]">
                  {project.tags.join(' · ')}
                </span>
                <span className="font-semibold text-[#8B2324] dark:text-[#F4B860]">
                  {project.statusLabel}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 3. HƯỚNG NỘI — Nhật Ký Tĩnh Lặng Một Cột */}
      {template === 'introvert' && (
        <div
          id="projects-grid"
          className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B] border-y border-[#E2E8F0] dark:border-[#1E293B]"
        >
          {visibleProjects.map((project, idx) => (
            <article key={project.id} data-category={project.category} className="py-7 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                <span>
                  0{idx + 1}. {project.orgBadge} · {project.domainLabel}
                </span>
                <span>{project.meta}</span>
              </div>

              <h3 className="font-display text-2xl font-medium text-[#1E293B] dark:text-[#E2E8F0]">
                {project.title}
              </h3>
              <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-[1.8]">
                {project.summary}
              </p>

              <ul className="space-y-1.5 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] pt-1">
                {project.highlights.map((item) => (
                  <li key={item.title} className="leading-relaxed">
                    <span className="text-[#0F172A] dark:text-[#CBD5E1] font-medium">
                      {item.title}:
                    </span>{' '}
                    {item.description}
                  </li>
                ))}
              </ul>

              <p className="font-mono text-xs text-[#64748B] dark:text-[#94A3B8] pt-1">
                {project.tags.join(' · ')}
              </p>
            </article>
          ))}
        </div>
      )}

      {/* 4. HƯỚNG NGOẠI — Thẻ Trưng Bày Nổi Bật Đậm Nét */}
      {template === 'extrovert' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="projects-grid">
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              data-category={project.category}
              className="project-card rounded-3xl overflow-hidden bg-white dark:bg-[#0B1220] border border-[#BFDBFE] dark:border-[#1E3A5F] shadow-[0_18px_42px_-22px_rgba(29,78,216,0.28)] flex flex-col justify-between"
            >
              <div className="px-6 sm:px-7 py-4 bg-gradient-to-r from-[#0A192F] to-[#1D4ED8] text-white flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#7DD3FC]">
                  {project.orgBadge} · {project.domainLabel}
                </span>
                <span className="font-mono text-xs text-slate-200">{project.meta}</span>
              </div>

              <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-display text-2xl sm:text-[26px] font-bold text-[#070B14] dark:text-white">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                    {project.summary}
                  </p>
                  <ul className="space-y-2 pt-2 text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                    {project.highlights.map((item) => (
                      <li key={item.title} className="leading-relaxed flex items-start gap-2.5">
                        <span aria-hidden="true" className="text-[#0284C7] font-bold">
                          →
                        </span>
                        <span>
                          <strong className="text-[#0A192F] dark:text-white">{item.title}</strong>{' '}
                          {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#DCE6F2] dark:border-[#182740] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <p className="font-mono font-medium text-[#1D4ED8] dark:text-[#38BDF8]">
                    {project.tags.join(' · ')}
                  </p>
                  <span className="font-semibold text-[#0A192F] dark:text-white">
                    {project.statusLabel}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 5. TRẺ TRUNG — Bất Đối Xứng Năng Động & Khung Nổi */}
      {template === 'youthful' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="projects-grid">
          {visibleProjects.map((project, idx) => (
            <article
              key={project.id}
              data-category={project.category}
              className="project-card p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0B1220] border-2 border-[#0F172A] dark:border-[#2DD4BF]/60 shadow-[6px_6px_0px_#2563EB] dark:shadow-[6px_6px_0px_#0D9488] flex flex-col justify-between gap-5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#2563EB] dark:bg-[#0D9488] text-white">
                    #0{idx + 1} · {project.orgBadge}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#0D9488] dark:text-[#2DD4BF]">
                    {project.meta}
                  </span>
                </div>

                <h3 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                  {project.title}
                </h3>
                <p className="text-sm text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                  {project.summary}
                </p>

                <ul className="space-y-2 text-xs sm:text-[13px] text-[#475569] dark:text-[#94A3B8]">
                  {project.highlights.map((item) => (
                    <li key={item.title} className="leading-relaxed flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="text-[#0D9488] dark:text-[#2DD4BF] font-bold"
                      >
                        ✦
                      </span>
                      <span>
                        <strong className="text-[#0F172A] dark:text-white">{item.title}</strong>{' '}
                        {item.description}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-[#CBD5E1] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-[#2563EB] dark:text-[#60A5FA] font-semibold">
                  {project.tags.join(' / ')}
                </span>
                <span className="text-[#0D9488] dark:text-[#2DD4BF] font-bold">
                  {project.statusLabel}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 6. HOÀI CỔ — Trang Báo Cũ 2 Cột Kẻ Chỉ Đứt */}
      {template === 'retro' && (
        <div
          id="projects-grid"
          className="rounded-2xl border-2 border-dashed border-[#A67B5B] dark:border-[#785535] bg-[#F4ECD8]/85 dark:bg-[#16120E]/90 p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {visibleProjects.map((project, idx) => (
            <article
              key={project.id}
              data-category={project.category}
              className="project-card pb-6 border-b border-dashed border-[#A67B5B]/70 dark:border-[#5C422B] last:border-b-0 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[#92400E] dark:text-[#FBBF24]">
                <span className="font-bold">
                  TẬP HỒ SƠ #0{idx + 1} · {project.orgBadge.toUpperCase()}
                </span>
                <span>{project.meta}</span>
              </div>

              <h3 className="font-display text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                {project.title}
              </h3>
              <p className="text-sm text-[#5C3D2E] dark:text-[#D6B89C] leading-relaxed">
                {project.summary}
              </p>

              <ul className="space-y-1.5 text-xs sm:text-[13px] text-[#432818] dark:text-[#E5D3B3]">
                {project.highlights.map((item) => (
                  <li key={item.title} className="leading-relaxed">
                    <span className="font-mono text-[#B45309] dark:text-[#F59E0B] mr-1.5">[*]</span>
                    <strong>{item.title}:</strong> {item.description}
                  </li>
                ))}
              </ul>

              <p className="font-mono text-[11px] text-[#78350F] dark:text-[#FCD34D] pt-1">
                STACK: {project.tags.join(' · ')}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
