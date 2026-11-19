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
    <section id="systems" className="space-y-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6E0D6] dark:border-[#27262B] pb-6">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#9F1239] dark:text-[#FB7185]">
            Kiến Trúc Phần Mềm · Hệ Thống Vận Hành Thực Tế
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#181615] dark:text-[#F4F1EC]">
            Dự Án Doanh Nghiệp &amp; Nền Tảng AI
          </h2>
          <p className="text-sm sm:text-base text-[#5E5852] dark:text-[#A8A29E] text-pretty">
            Không dừng lại ở mỹ thuật thị giác, nền tảng cốt lõi của tôi là các hệ thống C# .NET
            chịu tải cao phục vụ hàng triệu người dùng ngân hàng, y tế và giáo dục.
          </p>
        </div>

        <div
          id="project-filters"
          role="tablist"
          aria-label="Lọc dự án kỹ thuật theo lĩnh vực"
          className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#EFEAE2] dark:bg-[#17171C] border border-[#E6E0D6] dark:border-[#27262B]"
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
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#27262B] text-[#181615] dark:text-[#F4F1EC] shadow-sm'
                    : 'text-[#5E5852] dark:text-[#A8A29E] hover:text-[#181615] dark:hover:text-[#F4F1EC]'
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
            className="project-card p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#141418] border border-[#E6E0D6] dark:border-[#27262B] hover:border-[#9F1239]/50 dark:hover:border-[#FB7185]/50 transition-colors flex flex-col justify-between gap-5"
          >
            <div className="space-y-4">
              {/* Quiet unboxed metadata line */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E5852] dark:text-[#A8A29E]">
                <span className="font-medium text-[#9F1239] dark:text-[#FB7185]">
                  {project.orgBadge} · {project.domainLabel}
                </span>
                <span className="font-mono tabular-nums">{project.meta}</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-2xl font-bold text-[#181615] dark:text-[#F4F1EC]">
                  {project.title}
                </h3>
                <p className="text-sm text-[#5E5852] dark:text-[#A8A29E] leading-relaxed">
                  {project.summary}
                </p>
              </div>

              <ul className="space-y-2 pt-3 border-t border-[#EFEAE2] dark:border-[#232227] text-xs sm:text-sm text-[#5E5852] dark:text-[#A8A29E]">
                {project.highlights.map((item) => (
                  <li key={item.title} className="leading-relaxed">
                    <strong className="text-[#181615] dark:text-[#F4F1EC] font-medium">
                      {item.title}
                    </strong>{' '}
                    {item.description}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Metadata with subtle separator */}
            <div className="pt-4 border-t border-[#EFEAE2] dark:border-[#232227] flex flex-wrap items-center justify-between gap-3 text-xs">
              <p className="font-mono text-[#5E5852] dark:text-[#A8A29E]">
                {project.tags.join(' · ')}
              </p>
              <span className="font-medium text-[#181615] dark:text-[#F4F1EC] shrink-0">
                {project.statusLabel}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
