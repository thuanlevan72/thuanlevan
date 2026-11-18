import { Code2, Database, GitBranch, Sparkles, Terminal } from 'lucide-react';
import { SKILL_GROUPS, SkillGroup } from '../data/portfolioData.ts';

function GroupIcon({ icon }: { icon: SkillGroup['icon'] }) {
  switch (icon) {
    case 'code':
      return <Code2 className="w-5 h-5" aria-hidden="true" />;
    case 'database':
      return <Database className="w-5 h-5" aria-hidden="true" />;
    case 'tree':
      return <GitBranch className="w-5 h-5" aria-hidden="true" />;
    case 'sparkles':
      return <Sparkles className="w-5 h-5" aria-hidden="true" />;
  }
}

function getChipClass(
  surfaceTint: SkillGroup['surfaceTint'],
  tone: SkillGroup['items'][number]['tone']
) {
  const tintMap: Record<SkillGroup['surfaceTint'], string> = {
    emerald: 'bg-emerald-50 dark:bg-dark-surface border-emerald-300 dark:border-dark-outline',
    sky: 'bg-sky-50 dark:bg-dark-surface border-sky-300 dark:border-dark-outline',
    indigo: 'bg-indigo-50 dark:bg-dark-surface border-indigo-300 dark:border-dark-outline',
    amber: 'bg-amber-50 dark:bg-dark-surface border-amber-300 dark:border-dark-outline',
  };

  const toneMap: Record<SkillGroup['items'][number]['tone'], string> = {
    emerald: 'text-emerald-800 dark:text-dark-primary font-medium',
    cyan: 'text-cyan dark:text-sky-400 font-medium',
    surface: 'text-light-on-surface dark:text-dark-on-surface font-medium',
    indigo: 'text-indigo-900 dark:text-indigo-400 font-medium',
    red: 'text-red-700 dark:text-rose-400 font-medium',
    muted: 'text-light-on-surface-variant dark:text-dark-on-surface-variant',
  };

  return `${tintMap[surfaceTint]} ${toneMap[tone]}`;
}

export function SkillsSection() {
  return (
    <section id="skills" className="space-y-8">
      <div className="border-b border-light-outline/60 dark:border-dark-outline pb-4">
        <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-dark-primary font-mono text-label-sm mb-2 font-bold">
          <Terminal className="w-5 h-5" aria-hidden="true" />
          <span>ENGINEERING TOOLBELT</span>
        </div>
        <h2 className="font-headline font-bold text-headline-xl-mobile md:text-headline-xl text-light-on-surface dark:text-dark-on-surface">
          Vũ Khí Kỹ Thuật Đã Được Kiểm Chứng
        </h2>
        <p className="font-body text-body-md text-light-on-surface-variant dark:text-dark-on-surface-variant text-pretty">
          Không học vẹt framework. Mọi công nghệ đều được sử dụng trong các tình huống chịu tải và
          yêu cầu bảo mật cao.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {SKILL_GROUPS.map((group) => (
          <div
            key={group.id}
            className="p-6 rounded-2xl bg-light-surface-variant dark:bg-dark-surface-variant border border-light-outline/70 dark:border-dark-outline space-y-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`p-2.5 rounded-lg inline-flex items-center justify-center shrink-0 ${group.headerBadgeClass}`}
              >
                <GroupIcon icon={group.icon} />
              </span>
              <h3 className="font-headline font-bold text-headline-md text-light-on-surface dark:text-dark-on-surface truncate">
                {group.title}
              </h3>
            </div>
            <p className="text-body-sm text-light-on-surface-variant dark:text-dark-on-surface-variant">
              {group.description}
            </p>
            <div className="flex flex-wrap gap-2 font-mono text-label-sm">
              {group.items.map((item) => (
                <span
                  key={item.label}
                  className={`px-2.5 py-1 rounded-md border ${getChipClass(
                    group.surfaceTint,
                    item.tone
                  )}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
