import { SKILL_GROUPS } from '../data/portfolioData.ts';

export function SkillsSection() {
  return (
    <section id="skills" className="space-y-8 pt-6">
      <div className="border-b border-[#D7E2EE] dark:border-[#1B2B44] pb-6 space-y-2 max-w-2xl">
        <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8]">
          Năng Lực Kỹ Thuật &amp; Sáng Tạo
        </p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#070B14] dark:text-[#F1F5F9]">
          Công Nghệ Chuyên Sâu Đã Kiểm Chứng
        </h2>
        <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] text-pretty">
          Kết hợp giữa nền tảng Backend C# .NET chịu tải cao và tư duy điều phối mỹ thuật AI hiện
          đại.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {SKILL_GROUPS.map((group, idx) => (
          <div
            key={group.id}
            className="space-y-4 pt-4 border-t border-[#CBD8E6] dark:border-[#1B2B44]"
          >
            <div className="space-y-1">
              <span className="font-mono tabular-nums text-xs text-[#1D4ED8] dark:text-[#38BDF8]">
                0{idx + 1}.
              </span>
              <h3 className="font-display text-xl font-bold text-[#070B14] dark:text-[#F1F5F9]">
                {group.title}
              </h3>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                {group.description}
              </p>
            </div>

            <ul className="space-y-1.5 text-sm text-[#0A192F] dark:text-[#E2E8F0]">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="py-1 border-b border-[#E6EEF7] dark:border-[#132036] last:border-b-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
