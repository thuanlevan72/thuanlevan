import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CalendarCheck2,
  Download,
  Sparkles,
  Users,
} from 'lucide-react';
import type { ChronosDatabase } from '../../utils/chronosTypes.ts';
import {
  computeDeepVsShallowStats,
  computeEstimationAccuracy,
  computeMemberLoadPct,
  computeMemberWeeklyLoadPct,
  findSmartMeetingSlots,
  formatDayHeader,
  formatDurationVi,
  formatMinToHHMM,
} from '../../utils/chronosEngine.ts';

interface AnalyticsTeamViewProps {
  db: ChronosDatabase;
  userId: string;
  mode: 'analytics' | 'team';
  onUpdateDb: (updater: (prev: ChronosDatabase) => ChronosDatabase) => void;
}

export const AnalyticsTeamView: React.FC<AnalyticsTeamViewProps> = ({
  db,
  userId,
  mode,
  onUpdateDb,
}) => {
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(() =>
    db.teamMembers.slice(0, 3).map((m) => m.id)
  );
  const [meetingDay, setMeetingDay] = useState(0);
  const [meetingDuration, setMeetingDuration] = useState(45);
  const [meetingTitle, setMeetingTitle] = useState('Họp rà soát Sprint & Kiến trúc');
  const [bookedNotice, setBookedNotice] = useState<string | null>(null);

  const accuracyStats = computeEstimationAccuracy(db.tasks, db.projects);
  const ratioStats = computeDeepVsShallowStats(db.blocks);
  const totalBlockMinutes =
    ratioStats.deepMinutes + ratioStats.shallowMinutes + ratioStats.meetingMinutes;

  const suggestions = findSmartMeetingSlots(
    db.teamMembers,
    selectedAttendees,
    meetingDay,
    meetingDuration
  );

  const overloadedMember = db.teamMembers.find(
    (m) => computeMemberLoadPct(m, 0) > 85 || computeMemberWeeklyLoadPct(m) > 85
  );
  const lightestMember = [...db.teamMembers].sort(
    (a, b) => computeMemberWeeklyLoadPct(a) - computeMemberWeeklyLoadPct(b)
  )[0];

  const handleReassignLoad = (fromMemberId: string, toMemberId: string) => {
    const source = db.teamMembers.find((m) => m.id === fromMemberId);
    if (!source || fromMemberId === toMemberId) return;
    const movableSlot = source.busySlots.find((s) => !s.isDeepWork) ?? source.busySlots[0];
    if (!movableSlot) return;

    onUpdateDb((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((m) => {
        if (m.id === fromMemberId) {
          return {
            ...m,
            busySlots: m.busySlots.filter((s) => s !== movableSlot),
          };
        }
        if (m.id === toMemberId) {
          return {
            ...m,
            busySlots: [...m.busySlots, movableSlot],
          };
        }
        return m;
      }),
      tasks: prev.tasks.map((t, idx) =>
        idx === 0 && t.assigneeId === fromMemberId ? { ...t, assigneeId: toMemberId } : t
      ),
    }));
  };

  const handleBookSmartMeeting = (dayOffset: number, startMin: number, durationMin: number) => {
    const newBlockId = `blk-meet-${Date.now()}`;
    onUpdateDb((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks,
        {
          id: newBlockId,
          title: meetingTitle.trim() || 'Cuộc họp đội nhóm',
          dayOffset,
          startMin,
          durationMin,
          flexType: 'meeting',
          cognitiveLoad: 'low',
          provider: 'chronos',
        },
      ],
      teamMembers: prev.teamMembers.map((m) =>
        selectedAttendees.includes(m.id)
          ? {
              ...m,
              busySlots: [
                ...m.busySlots,
                { dayOffset, startMin, durationMin, title: meetingTitle.trim() || 'Họp nhóm' },
              ],
            }
          : m
      ),
    }));
    setBookedNotice(
      `Đã đặt lịch "${meetingTitle}" lúc ${formatMinToHHMM(startMin)}–${formatMinToHHMM(
        startMin + durationMin
      )} vào lịch đội nhóm.`
    );
  };

  if (mode === 'analytics') {
    const maxMin = Math.max(
      120,
      ...accuracyStats.map((s) => Math.max(s.estimatedMinutes, s.actualMinutes))
    );

    return (
      <div className="space-y-4">
        {/* Top KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Tỷ lệ Deep Work</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {ratioStats.deepRatioPct}%
            </div>
            <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {formatDurationVi(ratioStats.deepMinutes)} / {formatDurationVi(totalBlockMinutes)} tổng lịch
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Shallow &amp; Admin</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {formatDurationVi(ratioStats.shallowMinutes)}
            </div>
            <div className="mt-1 text-xs text-slate-500">Đã gom vào trũng năng lượng</div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Họp &amp; Lịch ngoài</div>
            <div className="mt-1 font-mono text-2xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {formatDurationVi(ratioStats.meetingMinutes)}
            </div>
            <div className="mt-1 text-xs text-slate-500">Đồng bộ Google / Outlook / Apple</div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase">Xuất Timesheet</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Xuất bảng chấm công chi tiết chuẩn CSV
              </div>
            </div>
            <a
              href={`/api/export/csv?userId=${encodeURIComponent(userId)}`}
              download
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải Timesheet CSV</span>
            </a>
          </div>
        </div>

        {/* Estimation Accuracy Chart */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Độ Chính Xác Ước Lượng Thời Gian (Estimation Accuracy)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                So sánh thời gian dự kiến (xám) và thực tế hoàn thành (xanh/đỏ) để phát hiện nhóm việc hay ước lượng thiếu
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {accuracyStats.map((stat) => {
              const estPct = Math.round((stat.estimatedMinutes / maxMin) * 100);
              const actPct = Math.round((stat.actualMinutes / maxMin) * 100);
              const over = stat.variancePct > 15;
              return (
                <div key={stat.projectId} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {stat.projectName}
                      </span>{' '}
                      <span className="text-slate-500">· {stat.category}</span>
                    </div>
                    <div className="font-mono tabular-nums text-xs">
                      <span className="text-slate-500">DK {formatDurationVi(stat.estimatedMinutes)}</span>
                      <span className="mx-1.5 text-slate-300">/</span>
                      <span className={over ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
                        TT {formatDurationVi(stat.actualMinutes)} ({stat.variancePct >= 0 ? `+${stat.variancePct}%` : `${stat.variancePct}%`})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-slate-400 dark:bg-slate-500" style={{ width: `${estPct}%` }} />
                    </div>
                    <div className="h-2 w-full rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${over ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${actPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Focus Session Logs */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
          <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
            Lịch sử Phiên Deep Work Gần Đây
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Đầu việc</th>
                  <th className="py-2 pr-3 font-medium">Chu kỳ</th>
                  <th className="py-2 pr-3 font-medium text-right">Thực tế</th>
                  <th className="py-2 pr-3 font-medium text-right">Trừ Idle</th>
                  <th className="py-2 font-medium text-right">Tinh thể</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {db.focusLogs.slice(0, 8).map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3 font-medium text-slate-800 dark:text-slate-200">{log.taskTitle}</td>
                    <td className="py-2 pr-3 font-mono text-slate-500">{log.preset}</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums">{log.actualMinutes}p</td>
                    <td className="py-2 pr-3 text-right font-mono tabular-nums text-amber-600">{log.idleSubtractedMinutes}p</td>
                    <td className="py-2 text-right font-mono tabular-nums text-emerald-600">+{log.crystalsEarned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Team & Smart Meeting Finder mode
  return (
    <div className="space-y-4">
      {/* Overload Alert */}
      {overloadedMember && lightestMember && overloadedMember.id !== lightestMember.id && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/70 bg-red-50/70 dark:bg-red-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-red-900 dark:text-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>
              <strong>Cảnh báo quá tải (&gt;85%):</strong> {overloadedMember.name} đang chạm ngưỡng{' '}
              <span className="font-mono tabular-nums">{computeMemberLoadPct(overloadedMember, 0)}%</span> công suất.{' '}
              {lightestMember.name} hiện đang rảnh hơn (<span className="font-mono tabular-nums">{computeMemberWeeklyLoadPct(lightestMember)}%</span> tuần).
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleReassignLoad(overloadedMember.id, lightestMember.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Điều phối 1 việc sang {lightestMember.name}</span>
          </button>
        </div>
      )}

      {/* Team Workload Heatmap */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Team Workload Heatmap (Công suất tuần theo 8g/ngày)</span>
            </h2>
            <p className="text-xs text-slate-500">Hiển thị % thời gian đã bị chiếm dụng của từng thành viên để cân bằng tải kịp thời</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-3 text-left font-medium">Thành viên</th>
                {[0, 1, 2, 3, 4].map((d) => {
                  const info = formatDayHeader(db.baseDateISO, d);
                  return (
                    <th key={d} className="py-2 px-2 text-center font-medium">
                      {info.weekday} <span className="font-mono text-[10px]">{info.dateStr}</span>
                    </th>
                  );
                })}
                <th className="py-2 pl-2 text-right font-medium">TB Tuần</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {db.teamMembers.map((member) => {
                const weeklyPct = computeMemberWeeklyLoadPct(member);
                return (
                  <tr key={member.id}>
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</div>
                      <div className="text-[11px] text-slate-500">{member.role}</div>
                    </td>
                    {[0, 1, 2, 3, 4].map((d) => {
                      const pct = computeMemberLoadPct(member, d);
                      const cellTone =
                        pct >= 85
                          ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                          : pct >= 60
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                      return (
                        <td key={d} className="py-2 px-1.5 text-center">
                          <div className={`rounded border py-1.5 font-mono text-xs tabular-nums font-medium ${cellTone}`}>
                            {pct}%
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2 pl-2 text-right font-mono tabular-nums font-semibold">
                      {weeklyPct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Meeting Finder */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4">
        <div>
          <h3 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-emerald-600" />
            <span>Smart Meeting Finder (Tìm giờ họp trong vùng trũng năng lượng chung)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Quét lịch trống của các thành viên và ưu tiên đề xuất buổi chiều để bảo vệ giờ Deep Work buổi sáng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="block text-[11px] text-slate-500 mb-1">Chủ đề cuộc họp</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[11px] text-slate-500 mb-1">Ngày tìm kiếm</label>
            <select
              value={meetingDay}
              onChange={(e) => setMeetingDay(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
            >
              {[0, 1, 2, 3, 4].map((d) => {
                const info = formatDayHeader(db.baseDateISO, d);
                return (
                  <option key={d} value={d}>
                    {info.weekday} ({info.dateStr})
                  </option>
                );
              })}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Thời lượng</label>
            <select
              value={meetingDuration}
              onChange={(e) => setMeetingDuration(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
            >
              <option value={30}>30p</option>
              <option value={45}>45p</option>
              <option value={60}>60p</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {db.teamMembers.map((m) => {
            const checked = selectedAttendees.includes(m.id);
            return (
              <label
                key={m.id}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs cursor-pointer ${
                  checked
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-500/15 text-blue-800 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelectedAttendees((prev) =>
                      prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                    )
                  }
                  className="rounded border-slate-300 text-blue-600"
                />
                <span>{m.name}</span>
              </label>
            );
          })}
        </div>

        {bookedNotice && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
            {bookedNotice}
          </div>
        )}

        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <p className="text-xs text-slate-500">Không tìm thấy khung giờ trống chung trong ngày này. Thử ngày khác hoặc giảm thời lượng.</p>
          ) : (
            suggestions.map((slot, idx) => (
              <div
                key={`${slot.dayOffset}-${slot.startMin}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-3.5 py-2.5 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {formatMinToHHMM(slot.startMin)} – {formatMinToHHMM(slot.endMin)}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      Điểm phù hợp {slot.score}/100
                    </span>
                    {idx === 0 && (
                      <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Đề xuất #1
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{slot.reason}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleBookSmartMeeting(slot.dayOffset, slot.startMin, meetingDuration)}
                  className="rounded-lg border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/15"
                >
                  Đặt lịch khung này
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
