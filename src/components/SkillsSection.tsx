import { SKILL_GROUPS } from '../data/portfolioData.ts';

export function SkillsSection() {
  return (
    <section id="skills" className="space-y-8 pt-6">
      <div className="border-b border-[#E6E0D6] dark:border-[#27262B] pb-6 space-y-2 max-w-2xl">
        <p className="text-xs font-medium text-[#9F1239] dark:text-[#FB7185]">
          Năng Lực Kỹ Thuật &amp; Sáng Tạo
        </p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#181615] dark:text-[#F4F1EC]">
          Công Nghệ Chuyên Sâu Đã Kiểm Chứng
        </h2>
        <p className="text-sm sm:text-base text-[#5E5852] dark:text-[#A8A29E] text-pretty">
          Kết hợp giữa nền tảng Backend C# .NET chịu tải cao và tư duy điều phối mỹ thuật AI hiện
          đại.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {SKILL_GROUPS.map((group, idx) => (
          <div
            key={group.id}
            className="space-y-4 pt-4 border-t border-[#D8D0C5] dark:border-[#2E2D33]"
          >
            <div className="space-y-1">
              <span className="font-mono tabular-nums text-xs text-[#9F1239] dark:text-[#FB7185]">
                0{idx + 1}.
              </span>
              <h3 className="font-display text-xl font-bold text-[#181615] dark:text-[#F4F1EC]">
                {group.title}
              </h3>
              <p className="text-xs text-[#5E5852] dark:text-[#A8A29E] leading-relaxed">
                {group.description}
              </p>
            </div>

            <ul className="space-y-1.5 text-sm text-[#181615] dark:text-[#E5E0D8]">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="py-1 border-b border-[#EFEAE2] dark:border-[#1E1D22] last:border-b-0"
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
