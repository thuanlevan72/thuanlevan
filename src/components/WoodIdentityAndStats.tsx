import { Gauge, ShieldCheck, Timer, Trees, Users } from 'lucide-react';
import { ENGINEERING_STATS, WOOD_PILLARS } from '../data/portfolioData.ts';

function StatIcon({ icon }: { icon: (typeof ENGINEERING_STATS)[number]['icon'] }) {
  switch (icon) {
    case 'timer':
      return <Timer className="w-5 h-5" aria-hidden="true" />;
    case 'groups':
      return <Users className="w-5 h-5" aria-hidden="true" />;
    case 'speed':
      return <Gauge className="w-5 h-5" aria-hidden="true" />;
    case 'verified':
      return <ShieldCheck className="w-5 h-5" aria-hidden="true" />;
  }
}

export function WoodIdentityAndStats() {
  return (
    <>
      {/* BẢN SẮC MỆNH MỘC & TRIẾT LÝ NGHỀ NGHIỆP */}
      <section
        id="wood-identity"
        className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-dark-surface-variant dark:via-dark-surface-variant/80 dark:to-dark-surface-variant border border-emerald-300 dark:border-dark-primary/30 relative overflow-hidden shadow-sm"
      >
        <div className="max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-2 text-emerald-800 dark:text-dark-primary font-mono text-label-sm font-bold">
            <Trees className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>NGŨ HÀNH TƯƠNG SINH TRONG KỸ THUẬT PHẦN MỀM</span>
          </div>

          <h2 className="font-headline font-bold text-headline-xl-mobile md:text-headline-xl text-light-on-surface dark:text-dark-on-surface">
            Tại Sao Mệnh Mộc (Dương Liễu Mộc 2002) Là Phẩm Chất Vàng Cho Backend Engineer?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {WOOD_PILLARS.map((pillar) => (
              <div
                key={pillar.number}
                className="p-5 rounded-xl bg-light-surface-variant dark:bg-dark-surface/80 border border-light-outline/70 dark:border-dark-outline space-y-2 shadow-sm"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-headline-md font-bold ${pillar.badgeClass}`}
                >
                  {pillar.number}
                </div>
                <h3 className="font-headline font-bold text-headline-md text-light-on-surface dark:text-dark-on-surface">
                  {pillar.title}
                </h3>
                <p className="text-body-sm text-light-on-surface-variant dark:text-dark-on-surface-variant font-body">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BANNER: Key Engineering Numbers */}
      <section
        id="stats"
        className="p-6 sm:p-8 rounded-2xl bg-light-surface-variant dark:bg-dark-surface-variant/60 border border-light-outline/80 dark:border-dark-outline relative overflow-hidden shadow-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
          {ENGINEERING_STATS.map((stat) => (
            <div key={stat.id} className="space-y-1">
              <span
                className={`text-label-sm font-mono flex items-center gap-1.5 font-bold ${stat.colorClass}`}
              >
                <StatIcon icon={stat.icon} />
                <span>{stat.label}</span>
              </span>
              <div className="text-headline-xl font-headline font-bold text-light-on-surface dark:text-dark-on-surface">
                {stat.value}
              </div>
              <p className="text-body-sm text-light-on-surface-variant dark:text-dark-on-surface-variant">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
