import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  Lock,
  RotateCcw,
  Sparkles,
  Sun,
  Unlock,
  Upload,
} from 'lucide-react';
import type { ChronosDatabase } from '../../utils/chronosTypes.ts';
import {
  formatMinToHHMM,
  getTodayISO,
  rollOverUnfinishedBlocksToTomorrow,
} from '../../utils/chronosEngine.ts';

interface RitualsRoadmapViewProps {
  db: ChronosDatabase;
  userId: string;
  mode: 'rituals' | 'roadmap';
  onUpdateDb: (updater: (prev: ChronosDatabase) => ChronosDatabase) => void;
  onResetSampleDb: () => void;
}

export const RitualsRoadmapView: React.FC<RitualsRoadmapViewProps> = ({
  db,
  userId,
  mode,
  onUpdateDb,
  onResetSampleDb,
}) => {
  const [reflection, setReflection] = useState(db.rituals.todayReflection || '');
  const [dbFeedback, setDbFeedback] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const openTasks = db.tasks.filter((t) => t.status !== 'done');
  const todayBlocks = db.blocks.filter((b) => b.dayOffset === 0);
  const completedToday = todayBlocks.filter((b) => b.completed).length;
  const unfinishedSoftToday = todayBlocks.filter((b) => b.flexType === 'soft' && !b.completed).length;

  const toggleMit = (taskId: string) => {
    onUpdateDb((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      if (!target) return prev;
      const nextIsMit = !target.isMit;
      const currentMitCount = prev.tasks.filter((t) => t.isMit && t.status !== 'done').length;
      if (nextIsMit && currentMitCount >= 3) {
        return prev;
      }
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, isMit: nextIsMit } : t)),
      };
    });
  };

  const handleImportJsonDb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as ChronosDatabase;
      if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.blocks)) {
        setDbFeedback('File JSON không đúng định dạng ChronosDatabase.');
        return;
      }
      onUpdateDb(() => parsed);
      setDbFeedback('Đã khôi phục và lưu toàn bộ dữ liệu từ file JSON cục bộ.');
    } catch {
      setDbFeedback('Không thể đọc file JSON.');
    } finally {
      e.target.value = '';
    }
  };

  if (mode === 'rituals') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Energy Curve Configurator */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div>
              <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <span>Cấu hình Nhịp Năng Lượng Sinh Học (Energy-Aware)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Thuật toán Auto-Rescheduler tự động đưa việc trí lực cao vào giờ Đỉnh cao và gom họp/email vào giờ Trũng
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'early_bird', label: 'Chim sớm', peak: [8 * 60 + 30, 11 * 60 + 30], trough: [13 * 60 + 30, 15 * 60 + 30] },
                  { id: 'balanced', label: 'Cân bằng', peak: [9 * 60 + 30, 12 * 60], trough: [14 * 60, 16 * 60] },
                  { id: 'night_owl', label: 'Khởi động muộn', peak: [10 * 60, 12 * 60 + 30], trough: [14 * 60 + 30, 16 * 60 + 30] },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      energyProfile: {
                        ...prev.energyProfile,
                        chronotype: preset.id,
                        peakStartMin: preset.peak[0],
                        peakEndMin: preset.peak[1],
                        troughStartMin: preset.trough[0],
                        troughEndMin: preset.trough[1],
                      },
                    }))
                  }
                  className={`rounded-lg border p-2.5 text-left text-xs ${
                    db.energyProfile.chronotype === preset.id
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/15'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="font-semibold">{preset.label}</div>
                  <div className="font-mono text-[11px] text-slate-500">
                    Đỉnh {formatMinToHHMM(preset.peak[0])}–{formatMinToHHMM(preset.peak[1])}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Đỉnh cao trí tuệ (Bắt đầu)</label>
                <select
                  value={db.energyProfile.peakStartMin}
                  onChange={(e) =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      energyProfile: { ...prev.energyProfile, peakStartMin: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono"
                >
                  {[7, 8, 8.5, 9, 9.5, 10].map((h) => (
                    <option key={h} value={h * 60}>{formatMinToHHMM(h * 60)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Đỉnh cao trí tuệ (Kết thúc)</label>
                <select
                  value={db.energyProfile.peakEndMin}
                  onChange={(e) =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      energyProfile: { ...prev.energyProfile, peakEndMin: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono"
                >
                  {[11, 11.5, 12, 12.5, 13].map((h) => (
                    <option key={h} value={h * 60}>{formatMinToHHMM(h * 60)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Trũng năng lượng (Họp/Email)</label>
                <select
                  value={db.energyProfile.troughStartMin}
                  onChange={(e) =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      energyProfile: { ...prev.energyProfile, troughStartMin: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono"
                >
                  {[13, 13.5, 14, 14.5].map((h) => (
                    <option key={h} value={h * 60}>{formatMinToHHMM(h * 60)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Giờ đóng máy Shutdown</label>
                <select
                  value={db.energyProfile.shutdownMin}
                  onChange={(e) =>
                    onUpdateDb((prev) => ({
                      ...prev,
                      energyProfile: { ...prev.energyProfile, shutdownMin: Number(e.target.value) },
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono"
                >
                  {[17, 17.5, 18, 18.5, 19].map((h) => (
                    <option key={h} value={h * 60}>{formatMinToHHMM(h * 60)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Morning Briefing: Pick Top 3 MITs */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>Morning Briefing · Chọn tối đa 3 MIT hôm nay</span>
                </h2>
                <p className="text-xs text-slate-500">
                  MIT (Most Important Tasks) giúp chống kiệt sức và giữ tiêu điểm ngày
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateDb((prev) => ({
                    ...prev,
                    rituals: { ...prev.rituals, morningBriefingCompletedDate: getTodayISO() },
                  }))
                }
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                {db.rituals.morningBriefingCompletedDate === getTodayISO() ? 'Đã chốt MIT' : 'Chốt 3 MIT'}
              </button>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {openTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-3 text-center text-xs text-slate-500">
                  Chưa có đầu việc mở nào. Hãy thêm đầu việc ở Lịch hoặc Mục tiêu để chọn Top 3 MIT.
                </p>
              ) : (
                openTasks.map((task) => (
                  <label
                    key={task.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs cursor-pointer ${
                      task.isMit
                        ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-500/15'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={Boolean(task.isMit)}
                        onChange={() => toggleMit(task.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span className="truncate font-medium">{task.title}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{task.estimatedMinutes}p</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Evening Shutdown Ritual */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {db.rituals.isShutdownLocked ? (
                  <Lock className="h-4 w-4 text-indigo-500" />
                ) : (
                  <Unlock className="h-4 w-4 text-slate-500" />
                )}
                <span>Nghi Thức Cuối Ngày (Shutdown Ritual)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Tổng kết ngày ({completedToday}/{todayBlocks.length} khối hoàn thành), tự động đẩy {unfinishedSoftToday} khối mềm còn dang dở sang ngày mai và khóa không gian làm việc
              </p>
            </div>

            {db.rituals.isShutdownLocked ? (
              <button
                type="button"
                onClick={() =>
                  onUpdateDb((prev) => ({
                    ...prev,
                    rituals: { ...prev.rituals, isShutdownLocked: false },
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 px-3.5 py-2 text-xs font-medium text-indigo-700 dark:text-indigo-300"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Mở khóa lại Workspace</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onUpdateDb((prev) => rollOverUnfinishedBlocksToTomorrow(prev, reflection))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Hoàn tất ngày &amp; Đẩy việc sang ngày mai</span>
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Ghi chú ngắn cuối ngày: Điều gì hôm nay trôi chảy nhất, điều gì cần giữ vững ngày mai?"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
          />
        </div>
      </div>
    );
  }

  // Roadmap, Pricing & Persistent Local JSON DB Manager
  return (
    <div className="space-y-4">
      {/* Local JSON Persistence Management */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              <span>Cơ sở dữ liệu JSON Cục Bộ Bền Vững (Local Disk Persistence)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dữ liệu của người dùng <strong>{db.userName}</strong> được ghi tách biệt tại{' '}
              <code className="font-mono text-slate-700 dark:text-slate-300">
                data/users/{userId}.json
              </code>{' '}
              trên ổ đĩa — mỗi người dùng là một hồ sơ và bộ dữ liệu riêng hoàn toàn.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/export/json?userId=${encodeURIComponent(userId)}`}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Sao lưu JSON</span>
            </a>

            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJsonDb}
            />
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Khôi phục từ JSON</span>
            </button>

            {!confirmReset ? (
              <button
                type="button"
                data-testid="chronos-reset-blank-btn"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Xóa &amp; Đặt lại dữ liệu trắng</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="chronos-reset-blank-confirm-btn"
                  onClick={() => {
                    onResetSampleDb();
                    setConfirmReset(false);
                    setDbFeedback('Đã xóa toàn bộ và đặt lại dữ liệu trắng hoàn toàn.');
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
                >
                  Xác nhận xóa trắng
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
        {dbFeedback && <p className="text-xs text-emerald-600 dark:text-emerald-400">{dbFeedback}</p>}
      </div>

      {/* Product Roadmap Phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            phase: 'Giai đoạn 1 · MVP (Hoàn chỉnh)',
            title: 'Cá nhân & Năng lượng',
            items: [
              'Quản lý công việc 4 tầng OKR → Sub-task & Quick Capture',
              'Smart Time-Blocking kéo-thả hai chiều ngày/tuần',
              'Deep Work Studio (25/5, 50/10, 90/20) & Soundscapes WebAudio',
              'Lưu trữ JSON cục bộ bền vững & Nghi thức Shutdown',
            ],
          },
          {
            phase: 'Giai đoạn 2 · Mở rộng',
            title: 'Đội nhóm & Đồng bộ Lịch',
            items: [
              'Đồng bộ đa nền tảng Google, Outlook, Apple (.ics)',
              'Team Workload Heatmap cảnh báo quá tải >85%',
              'Smart Meeting Finder theo trũng năng lượng buổi chiều',
              'Báo cáo Estimation Accuracy & Timesheet CSV',
            ],
          },
          {
            phase: 'Giai đoạn 3 · Chuyên sâu',
            title: 'Hệ sinh thái & AI Workflow',
            items: [
              'AI Auto-Rescheduler phản ứng biến cố + Gemini AI Coach',
              'API Webhook kết nối Slack / Teams / Zalo DND tự động',
              'Phòng Focus Kiến Tạo RPG & Streak Freeze lành mạnh',
              'Dự báo điểm nghẽn tài nguyên & phân quyền Enterprise',
            ],
          },
        ].map((card) => (
          <div
            key={card.phase}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2.5"
          >
            <div className="font-mono text-[11px] font-medium text-blue-600 dark:text-blue-400">
              {card.phase}
            </div>
            <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
              {card.title}
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
              {card.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Monetization Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            tier: 'Miễn phí (Free)',
            price: '0đ / tháng',
            desc: 'Dành cho cá nhân bắt đầu làm chủ Time-blocking',
            features: ['Quản lý Task & OKRs cơ bản', 'Time-blocking 1 lịch đơn', 'Bộ đếm Pomodoro 25/5 & White noise'],
          },
          {
            tier: 'Pro ($8–$12/tháng)',
            price: '~$10 / tháng',
            desc: 'Trọn bộ Năng lượng Sinh học & AI Auto-Rescheduler',
            features: [
              'Không giới hạn Đồng bộ Google/Apple/Outlook',
              'AI Auto-Rescheduler & Cố vấn năng lượng',
              'Focus Shield + 40Hz Binaural + Báo cáo Timesheet',
            ],
            highlight: true,
          },
          {
            tier: 'Team / Enterprise ($18/user)',
            price: '$18 / thành viên',
            desc: 'Quản trị công suất đội nhóm & bảo vệ giờ Deep Work',
            features: [
              'Team Workload Heatmap & Điều phối tải',
              'Smart Meeting Finder theo nhịp sinh học chung',
              'Đồng bộ DND Slack/Teams/Zalo & Xuất CSV hàng loạt',
            ],
          },
        ].map((p) => (
          <div
            key={p.tier}
            className={`rounded-xl border p-4 space-y-3 ${
              p.highlight
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.tier}</div>
              <div className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{p.price}</div>
            </div>
            <p className="text-xs text-slate-500">{p.desc}</p>
            <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
