import { useMemo, useState } from 'react';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData.ts';
import {
  filterProjects,
  getProjectCategoryCounts,
  ProjectCategory,
} from '../utils/portfolioLogic.ts';

export function ProjectsSection() {
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

  return (
    <section id="systems" className="scroll-mt-24 space-y-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[#DCE6F2] dark:border-[#182740] pb-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            Kiến Trúc Phần Mềm · Hệ Thống Vận Hành Thực Tế
          </p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            Dự Án Doanh Nghiệp &amp; Nền Tảng AI
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
          className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-[#E8F0F9] dark:bg-[#0B1426] border border-[#DCE6F2] dark:border-[#182740]"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="projects-grid">
        {visibleProjects.map((project) => (
          <article
            key={project.id}
            data-category={project.category}
            className="project-card soft-card p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-[#0B1220]/95 border border-[#DCE6F2] dark:border-[#182740] hover:border-[#0284C7]/55 dark:hover:border-[#38BDF8]/55 flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              {/* Quiet unboxed metadata line */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                <span className="font-semibold text-[#1D4ED8] dark:text-[#38BDF8]">
                  {project.orgBadge} · {project.domainLabel}
                </span>
                <span className="font-mono tabular-nums">{project.meta}</span>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-2xl sm:text-[26px] font-semibold tracking-[-0.01em] text-[#070B14] dark:text-[#F1F5F9]">
                  {project.title}
                </h3>
                <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {project.summary}
                </p>
              </div>

              <ul className="space-y-2.5 pt-4 border-t border-[#E9F0F8] dark:border-[#152339] text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                {project.highlights.map((item) => (
                  <li key={item.title} className="leading-relaxed flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="text-[#0284C7] dark:text-[#38BDF8] font-mono select-none mt-0.5"
                    >
                      —
                    </span>
                    <span>
                      <strong className="text-[#0A192F] dark:text-[#F1F5F9] font-semibold">
                        {item.title}
                      </strong>{' '}
                      {item.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Metadata with subtle separator */}
            <div className="pt-4 border-t border-[#E9F0F8] dark:border-[#152339] flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="font-mono text-[#475569] dark:text-[#94A3B8]">
                {project.tags.join(' · ')}
              </p>
              <span className="font-medium text-[#0369A1] dark:text-[#60A5FA] shrink-0">
                {project.statusLabel}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
