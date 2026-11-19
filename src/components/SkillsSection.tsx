import {
  AI_AGENT_EXPERIENCE,
  AI_AGENT_PRINCIPLES,
  SKILL_GROUPS,
} from '../data/portfolioData.ts';

export function SkillsSection() {
  return (
    <section id="skills" className="scroll-mt-24 space-y-12 pt-6">
      <div className="space-y-8">
        <div className="border-b border-[#DCE6F2] dark:border-[#182740] pb-6 space-y-2 max-w-2xl">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            Năng Lực Kỹ Thuật &amp; Sáng Tạo
          </p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            Công Nghệ Chuyên Sâu Đã Kiểm Chứng
          </h2>
          <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
            Kết hợp giữa nền tảng Backend C# .NET chịu tải cao và tư duy điều phối AI Agent hiện đại.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {SKILL_GROUPS.map((group, idx) => (
            <div
              key={group.id}
              className="soft-card p-6 rounded-2xl bg-white/90 dark:bg-[#0B1220]/90 border border-[#DCE6F2] dark:border-[#182740] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="font-mono tabular-nums text-xs font-medium text-[#0284C7] dark:text-[#38BDF8]">
                  0{idx + 1}.
                </span>
                <h3 className="font-display text-2xl font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                  {group.title}
                </h3>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {group.description}
                </p>
              </div>

              <ul className="space-y-1 text-sm text-[#0A192F] dark:text-[#E2E8F0] pt-2 border-t border-[#E9F0F8] dark:border-[#152339]">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="py-1.5 border-b border-[#F1F5F9] dark:border-[#121F33] last:border-b-0 text-[13px] font-medium"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Plain-Language Practical AI Agent Workflow */}
      <div
        id="ai-agents"
        className="scroll-mt-24 pt-4 space-y-8 border-t border-[#DCE6F2]/80 dark:border-[#182740]/80"
      >
        <div className="space-y-2 max-w-3xl pt-4">
          <p className="text-xs font-medium text-[#0369A1] dark:text-[#38BDF8] tracking-wide">
            Trợ Lý Công Việc Thực Chiến · Claude · Gemini · Codex · Grok
          </p>
          <h3 className="font-display font-semibold text-2xl sm:text-3xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            Kinh Nghiệm Sử Dụng AI Agent Hàng Ngày
          </h3>
          <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
            Thay vì dùng AI theo cảm tính, tôi chia rõ công việc cho từng AI Agent theo đúng điểm
            mạnh — giúp đọc hiểu hệ thống nhanh hơn, giảm lỗi vặt và vẫn giữ quyền kiểm soát hoàn
            toàn ở từng dòng code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {AI_AGENT_EXPERIENCE.map((agent, idx) => (
            <article
              key={agent.id}
              className="soft-card p-6 sm:p-7 rounded-2xl bg-white/92 dark:bg-[#0B1220]/92 border border-[#DCE6F2] dark:border-[#182740] flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#E9F0F8] dark:border-[#152339] pb-3.5">
                  <div>
                    <span className="font-mono text-xs text-[#0284C7] dark:text-[#38BDF8] mr-2">
                      0{idx + 1}.
                    </span>
                    <h4 className="inline font-display text-2xl font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                      {agent.name}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-[#475569] dark:text-[#94A3B8]">
                    {agent.provider}
                  </span>
                </div>

                <p className="text-sm font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                  {agent.roleSummary}
                </p>

                <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {agent.simpleUsage}
                </p>

                <ul className="space-y-2 pt-1 text-[13px] text-[#0A192F] dark:text-[#E2E8F0]">
                  {agent.realTaskExamples.map((example) => (
                    <li key={example} className="flex items-start gap-2.5 leading-relaxed">
                      <span
                        aria-hidden="true"
                        className="text-[#0284C7] dark:text-[#38BDF8] shrink-0"
                      >
                        —
                      </span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3.5 border-t border-[#E9F0F8] dark:border-[#152339] text-xs font-medium text-[#0A192F] dark:text-[#CBD5E1]">
                Kết quả thực tế: {agent.projectImpact}
              </div>
            </article>
          ))}
        </div>

        {/* 3 Clear Working Principles with AI */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#EBF2FA]/75 dark:bg-[#091224]/90 border border-[#D4E2F1] dark:border-[#182740]">
          <p className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0369A1] dark:text-[#38BDF8] mb-4">
            3 Nguyên Tắc Dùng AI An Toàn Trong Dự Án Thật
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {AI_AGENT_PRINCIPLES.map((principle) => (
              <div key={principle.id} className="space-y-1.5">
                <h4 className="text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                  {principle.title}
                </h4>
                <p className="text-xs sm:text-[13px] text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {principle.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
