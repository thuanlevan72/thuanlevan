import {
  AI_AGENT_EXPERIENCE,
  AI_AGENT_PRINCIPLES,
  SKILL_GROUPS,
} from '../data/portfolioData.ts';
import { ProfileTemplateId } from '../utils/portfolioLogic.ts';

interface SkillsSectionProps {
  template: ProfileTemplateId;
}

export function SkillsSection({ template }: SkillsSectionProps) {
  const isQuiet = template === 'introvert';

  return (
    <section
      id="skills"
      data-template={template}
      className={`scroll-mt-24 space-y-12 pt-6 ${isQuiet ? 'max-w-3xl mx-auto' : ''}`}
    >
      <div className="space-y-8">
        <div className="border-b border-[#DCE6F2] dark:border-[#182740] pb-6 space-y-2 max-w-2xl">
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
              ? 'Tứ Trụ Binh Pháp Kỹ Nghệ & Đạo Cụ AI'
              : template === 'retro'
              ? 'BẢNG KÊ KỸ THUẬT LƯU TRỮ · SPECIFICATION INDEX'
              : 'Năng Lực Kỹ Thuật & Sáng Tạo'}
          </p>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-[-0.015em] text-[#070B14] dark:text-[#F1F5F9]">
            Công Nghệ Chuyên Sâu Đã Kiểm Chứng
          </h2>
          <p className="text-sm sm:text-base text-[#475569] dark:text-[#94A3B8] leading-relaxed text-pretty">
            Kết hợp giữa nền tảng Backend C# .NET chịu tải cao và tư duy điều phối AI Agent hiện đại.
          </p>
        </div>

        {/* 1. HIỆN ĐẠI — Modular Bento Grid */}
        {template === 'modern' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {SKILL_GROUPS.map((group, idx) => (
              <div
                key={group.id}
                className="soft-card p-6 rounded-2xl bg-white/95 dark:bg-[#0B1220]/95 border border-[#DCE6F2] dark:border-[#182740] flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display text-2xl font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                      {group.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                      {group.description}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] shrink-0">
                    0{idx + 1}
                  </span>
                </div>

                <p className="pt-3 border-t border-[#E9F0F8] dark:border-[#152339] font-mono text-xs sm:text-[13px] leading-relaxed text-[#0369A1] dark:text-[#93C5FD]">
                  {group.items.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 2. CỔ TRANG — Tứ Trụ Thủy Mặc */}
        {template === 'classical' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SKILL_GROUPS.map((group, idx) => (
              <div
                key={group.id}
                className="p-6 rounded-2xl bg-[#FBF6EC] dark:bg-[#120E0B] border-2 border-[#DFCDAE] dark:border-[#3F2F1D] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-1.5 border-b border-[#DFCDAE] dark:border-[#3A2B1B] pb-3">
                  <span className="font-mono text-xs font-bold text-[#9E2A2B] dark:text-[#F4B860]">
                    TRỤ 0{idx + 1}
                  </span>
                  <h3 className="font-display text-2xl font-semibold text-[#2A1B12] dark:text-[#F5E6D0]">
                    {group.title}
                  </h3>
                  <p className="text-xs text-[#5C4633] dark:text-[#C8B29A]">{group.description}</p>
                </div>
                <ul className="space-y-1.5 text-[13px] text-[#3B2618] dark:text-[#E8D5BC]">
                  {group.items.map((item) => (
                    <li key={item} className="leading-snug flex items-start gap-2">
                      <span className="text-[#B48332] dark:text-[#D4A359]" aria-hidden="true">
                        ·
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* 3. HƯỚNG NỘI — Chỉ Mục Đơn Sắc Tối Giản */}
        {template === 'introvert' && (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B] border-y border-[#E2E8F0] dark:border-[#1E293B]">
            {SKILL_GROUPS.map((group, idx) => (
              <div
                key={group.id}
                className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline"
              >
                <div className="sm:col-span-4">
                  <span className="font-mono text-xs text-[#64748B] mr-2">0{idx + 1}.</span>
                  <h3 className="inline font-display text-lg font-medium text-[#1E293B] dark:text-[#E2E8F0]">
                    {group.title}
                  </h3>
                </div>
                <p className="sm:col-span-8 font-mono text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                  {group.items.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 4. HƯỚNG NGOẠI — Thẻ Nổi Bật Tương Phản Mạnh */}
        {template === 'extrovert' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SKILL_GROUPS.map((group, idx) => (
              <div
                key={group.id}
                className="p-6 rounded-3xl bg-gradient-to-b from-white to-[#F0F7FF] dark:from-[#0C182E] dark:to-[#07101F] border border-[#BFDBFE] dark:border-[#1E3A5F] space-y-4"
              >
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-[#1D4ED8] dark:text-[#38BDF8]">
                    CORE 0{idx + 1}
                  </span>
                  <h3 className="font-display text-2xl font-bold text-[#070B14] dark:text-white">
                    {group.title}
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8]">{group.description}</p>
                </div>
                <ul className="space-y-1.5 pt-2 border-t border-[#DBEAFE] dark:border-[#1E3A5F] text-xs sm:text-[13px] font-medium text-[#0A192F] dark:text-[#E2E8F0]">
                  {group.items.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* 5. TRẺ TRUNG — Khối Lệch Nhịp 7+5 Mosaic */}
        {template === 'youthful' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {SKILL_GROUPS.map((group, idx) => {
              const spanClass =
                idx === 0 || idx === 3 ? 'md:col-span-7' : 'md:col-span-5';
              return (
                <div
                  key={group.id}
                  className={`${spanClass} p-6 rounded-2xl bg-white dark:bg-[#0B1220] border-2 border-[#0F172A] dark:border-[#38BDF8]/50 shadow-[5px_5px_0px_#0D9488] dark:shadow-[5px_5px_0px_#2563EB] space-y-3`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-2xl font-bold text-[#0F172A] dark:text-white">
                      {group.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#2DD4BF]">
                      #0{idx + 1}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                    {group.description}
                  </p>
                  <p className="font-mono text-xs sm:text-[13px] font-semibold text-[#0F172A] dark:text-[#E2E8F0] pt-2 border-t border-dashed border-[#CBD5E1] dark:border-[#1E293B]">
                    {group.items.join(' · ')}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. HOÀI CỔ — Sổ Tay Máy Chữ */}
        {template === 'retro' && (
          <div className="rounded-2xl border-2 border-dashed border-[#A67B5B] dark:border-[#785535] bg-[#F4ECD8]/90 dark:bg-[#16120E] p-6 sm:p-8 divide-y divide-dashed divide-[#A67B5B]/70 dark:divide-[#5C422B]">
            {SKILL_GROUPS.map((group, idx) => (
              <div
                key={group.id}
                className="py-4 first:pt-0 last:pb-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-baseline"
              >
                <div className="md:col-span-4 space-y-0.5">
                  <p className="font-mono text-[11px] font-bold text-[#92400E] dark:text-[#FBBF24]">
                    SPEC SHEET 0{idx + 1}
                  </p>
                  <h3 className="font-display text-xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">
                    {group.title}
                  </h3>
                </div>
                <p className="md:col-span-3 text-xs text-[#5C3D2E] dark:text-[#D6B89C]">
                  {group.description}
                </p>
                <p className="md:col-span-5 font-mono text-xs text-[#432818] dark:text-[#FDE68A] leading-relaxed">
                  {group.items.join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Practical AI Agent Workflow */}
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

        {/* Modern uses 12-Col Matrix Table; Introvert uses calm 1-Col list; Others use styled 2x2 Grids */}
        {template === 'modern' ? (
          <div className="rounded-2xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 overflow-hidden">
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-[#F5F8FC] dark:bg-[#080E1A] border-b border-[#DCE6F2] dark:border-[#182740] text-[11px] font-mono uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
              <div className="col-span-3">AI Agent</div>
              <div className="col-span-4">Chuyên Môn Chính</div>
              <div className="col-span-5">Ví Dụ Thực Tế &amp; Kết Quả</div>
            </div>
            <div className="divide-y divide-[#E9F0F8] dark:divide-[#152339]">
              {AI_AGENT_EXPERIENCE.map((agent, idx) => (
                <div
                  key={agent.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-5 sm:px-6 py-5 items-start"
                >
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs text-[#0284C7] dark:text-[#38BDF8]">
                        0{idx + 1}.
                      </span>
                      <h4 className="font-display text-2xl font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                        {agent.name}
                      </h4>
                    </div>
                    <p className="text-xs font-mono text-[#475569] dark:text-[#94A3B8]">
                      {agent.provider}
                    </p>
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <p className="text-sm font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                      {agent.roleSummary}
                    </p>
                    <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                      {agent.simpleUsage}
                    </p>
                  </div>

                  <div className="md:col-span-5 space-y-2">
                    <ul className="space-y-1.5 text-xs sm:text-[13px] text-[#0A192F] dark:text-[#E2E8F0]">
                      {agent.realTaskExamples.map((example) => (
                        <li key={example} className="flex items-start gap-2 leading-relaxed">
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
                    <p className="text-xs font-medium text-[#0369A1] dark:text-[#60A5FA]">
                      Kết quả: {agent.projectImpact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : template === 'introvert' ? (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B] border-y border-[#E2E8F0] dark:border-[#1E293B]">
            {AI_AGENT_EXPERIENCE.map((agent, idx) => (
              <article key={agent.id} className="py-5 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-display text-xl font-medium text-[#1E293B] dark:text-[#E2E8F0]">
                    0{idx + 1}. {agent.name} — {agent.roleSummary}
                  </h4>
                  <span className="font-mono text-xs text-[#64748B]">{agent.provider}</span>
                </div>
                <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-[1.8]">
                  {agent.simpleUsage}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {AI_AGENT_EXPERIENCE.map((agent, idx) => (
              <article
                key={agent.id}
                className={`p-6 sm:p-7 rounded-2xl flex flex-col justify-between space-y-5 ${
                  template === 'classical'
                    ? 'bg-[#FBF6EC] dark:bg-[#120E0B] border-2 border-[#DFCDAE] dark:border-[#3F2F1D]'
                    : template === 'retro'
                    ? 'bg-[#F4ECD8] dark:bg-[#16120E] border-2 border-dashed border-[#A67B5B] dark:border-[#785535]'
                    : template === 'youthful'
                    ? 'bg-white dark:bg-[#0B1220] border-2 border-[#0F172A] dark:border-[#2DD4BF]/50 shadow-[5px_5px_0px_#2563EB] dark:shadow-[5px_5px_0px_#0D9488]'
                    : 'soft-card bg-white/95 dark:bg-[#0B1220]/95 border border-[#BFDBFE] dark:border-[#1E3A5F]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-current/15 pb-3.5">
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

                <div className="pt-3.5 border-t border-current/15 text-xs font-medium text-[#0A192F] dark:text-[#CBD5E1]">
                  Kết quả thực tế: {agent.projectImpact}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 3 Clear Working Principles with AI */}
        <div
          className={`p-6 sm:p-7 rounded-2xl border ${
            template === 'classical'
              ? 'bg-[#FBF6EC] dark:bg-[#120E0B] border-2 border-[#DFCDAE] dark:border-[#3F2F1D]'
              : template === 'retro'
              ? 'bg-[#F4ECD8] dark:bg-[#16120E] border-2 border-dashed border-[#A67B5B] dark:border-[#785535]'
              : 'bg-[#EBF2FA]/75 dark:bg-[#091224]/90 border-[#D4E2F1] dark:border-[#182740]'
          }`}
        >
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
