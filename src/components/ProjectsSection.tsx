import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Cpu,
  FileSignature,
  GraduationCap,
  Hospital,
  Landmark,
  Lock,
  Network,
  PenTool,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PORTFOLIO_PROJECTS } from '../data/portfolioData.ts';
import {
  filterProjects,
  getProjectCategoryCounts,
  PortfolioProject,
  ProjectCategory,
  ProjectTag,
} from '../utils/portfolioLogic.ts';

function OrgIcon({ icon }: { icon: PortfolioProject['orgIcon'] }) {
  switch (icon) {
    case 'psychology':
      return <BrainCircuit className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'bank':
      return <Landmark className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'hospital':
      return <Hospital className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'document':
      return <FileSignature className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'school':
      return <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'memory':
      return <Cpu className="w-3.5 h-3.5" aria-hidden="true" />;
  }
}

function StatusIcon({ icon }: { icon: PortfolioProject['statusIcon'] }) {
  switch (icon) {
    case 'check':
      return <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'security':
      return <Lock className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'verified':
      return <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'signature':
      return <PenTool className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'flash':
      return <Zap className="w-3.5 h-3.5" aria-hidden="true" />;
    case 'code':
      return <Code2 className="w-3.5 h-3.5" aria-hidden="true" />;
  }
}

function getTagColorClass(tone: ProjectTag['tone'], themeVariant: PortfolioProject['themeVariant']) {
  const baseBg =
    themeVariant === 'emerald'
      ? 'bg-emerald-50 dark:bg-dark-surface border-emerald-300 dark:border-dark-outline'
      : 'bg-sky-50 dark:bg-dark-surface border-sky-300 dark:border-dark-outline';

  switch (tone) {
    case 'cyan':
      return `${baseBg} text-cyan dark:text-sky-400 font-medium`;
    case 'emerald':
      return `${baseBg} text-emerald-800 dark:text-dark-primary font-medium`;
    case 'indigo':
      return `${baseBg} text-indigo-900 dark:text-indigo-400 font-medium`;
    case 'amber':
      return `${baseBg} text-amber-800 dark:text-amber-400 font-medium`;
    case 'surface':
      return `${baseBg} text-light-on-surface dark:text-dark-on-surface font-medium`;
    case 'muted':
      return `${baseBg} text-light-on-surface-variant dark:text-dark-on-surface-variant`;
  }
}

export function ProjectsSection() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>('all');

  const counts = useMemo(() => getProjectCategoryCounts(PORTFOLIO_PROJECTS), []);
  const visibleProjects = useMemo(
    () => filterProjects(PORTFOLIO_PROJECTS, selectedCategory),
    [selectedCategory]
  );

  const filterTabs: { id: ProjectCategory; label: string }[] = [
    { id: 'all', label: `Tất Cả (${counts.all})` },
    { id: 'ai', label: 'AI & LLM' },
    { id: 'fintech', label: 'Ngân Hàng' },
    { id: 'healthcare', label: 'Y Tế & EdTech' },
  ];

  return (
    <section id="architecture" className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-light-outline/60 dark:border-dark-outline pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-dark-primary font-mono text-label-sm mb-2 font-bold">
            <Network className="w-5 h-5" aria-hidden="true" />
            <span>PRODUCTION ARCHITECTURES</span>
          </div>
          <h2 className="font-headline font-bold text-headline-xl-mobile md:text-headline-xl text-light-on-surface dark:text-dark-on-surface">
            Hệ Thống &amp; Dự Án Trọng Yếu
          </h2>
          <p className="font-body text-body-md text-light-on-surface-variant dark:text-dark-on-surface-variant text-pretty">
            Không phải dự án mẫu bài tập. Đây là các hệ thống thực tế đã vận hành phục vụ hàng
            triệu người dùng.
          </p>
        </div>

        {/* Project Filter Tabs */}
        <div
          id="project-filters"
          role="tablist"
          aria-label="Lọc dự án theo lĩnh vực"
          className="flex flex-wrap items-center gap-1.5 p-1 bg-light-surface-variant dark:bg-dark-surface-variant rounded-lg border border-light-outline dark:border-dark-outline font-mono text-label-sm shadow-sm"
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
                className={`project-btn px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 dark:bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-light-on-surface-variant dark:text-dark-on-surface-variant hover:text-light-on-surface dark:hover:text-dark-on-surface'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="projects-grid">
        {visibleProjects.map((project) => {
          const isEmerald = project.themeVariant === 'emerald';
          const cardHoverBorder = isEmerald
            ? 'hover:border-emerald-500 dark:hover:border-dark-primary/60'
            : 'hover:border-sky-500 dark:hover:border-sky-400/60';
          const badgeClass = isEmerald
            ? 'bg-emerald-100 dark:bg-dark-primary/20 text-emerald-900 dark:text-dark-primary border border-emerald-300 dark:border-dark-primary/40'
            : 'bg-sky-100 dark:bg-cyan/10 text-sky-900 dark:text-sky-400 border border-sky-300 dark:border-sky-400/30';
          const titleHover = isEmerald
            ? 'group-hover:text-emerald-800 dark:group-hover:text-dark-primary'
            : 'group-hover:text-cyan dark:group-hover:text-sky-400';
          const bulletColor = isEmerald
            ? 'text-emerald-700 dark:text-dark-primary'
            : 'text-cyan dark:text-sky-400';
          const statusColor = isEmerald
            ? 'text-emerald-800 dark:text-dark-primary'
            : 'text-cyan dark:text-sky-400';

          return (
            <article
              key={project.id}
              data-category={project.category}
              className={`project-card group p-6 rounded-2xl bg-light-surface-variant dark:bg-dark-surface-variant/70 border border-light-outline/70 dark:border-dark-outline ${cardHoverBorder} transition-all duration-200 relative flex flex-col justify-between shadow-sm hover:shadow-md`}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-label-sm font-mono font-bold flex items-center gap-1.5 ${badgeClass}`}
                  >
                    <OrgIcon icon={project.orgIcon} />
                    <span>{project.orgBadge}</span>
                  </span>
                  <span className="font-mono text-label-sm text-light-on-surface-variant dark:text-dark-on-surface-variant font-medium">
                    {project.meta}
                  </span>
                </div>

                <div>
                  <h3
                    className={`font-headline font-bold text-headline-lg-mobile md:text-headline-lg text-light-on-surface dark:text-dark-on-surface ${titleHover} transition flex items-center justify-between gap-2`}
                  >
                    <span>{project.title}</span>
                    <ArrowRight
                      className="w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="font-body text-body-sm text-light-on-surface-variant dark:text-dark-on-surface-variant mt-1 text-pretty">
                    {project.summary}
                  </p>
                </div>

                <div className="space-y-2 text-body-sm font-body text-light-on-surface-variant dark:text-dark-on-surface-variant bg-light-surface dark:bg-dark-surface p-4 rounded-xl border border-light-outline/60 dark:border-dark-outline/70">
                  {project.highlights.map((item) => (
                    <p key={item.title} className="flex items-start gap-2">
                      <span className={`${bulletColor} mt-0.5`}>•</span>
                      <span>
                        <strong className="text-light-on-surface dark:text-dark-on-surface">
                          {item.title}
                        </strong>{' '}
                        {item.description}
                      </span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-light-outline/50 dark:border-dark-outline/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5 font-mono text-label-sm">
                  {project.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`px-2.5 py-0.5 rounded-md border ${getTagColorClass(
                        tag.tone,
                        project.themeVariant
                      )}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
                <span
                  className={`font-mono text-label-sm font-bold flex items-center gap-1 ${statusColor}`}
                >
                  <StatusIcon icon={project.statusIcon} />
                  <span>{project.statusLabel}</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
