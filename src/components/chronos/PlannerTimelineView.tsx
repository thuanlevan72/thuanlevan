import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Undo2,
  Unlock,
  Upload,
  Wand2,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import type {
  ChronosDatabase,
  ChronosTask,
  RescheduleResult,
  TimeBlock,
} from '../../utils/chronosTypes.ts';
import {
  computeTaskPriorityScore,
  formatDayHeader,
  formatDurationVi,
  formatMinToHHMM,
  generateIcsFromBlocks,
  insertUrgentInterruption,
  parseIcsEvents,
  runAutoReschedule,
  simulateMeetingOverrun,
} from '../../utils/chronosEngine.ts';

interface PlannerTimelineViewProps {
  db: ChronosDatabase;
  userId: string;
  onUpdateDb: (updater: (prev: ChronosDatabase) => ChronosDatabase) => void;
  onStartFocusTask: (taskId?: string, customTitle?: string, suggestedMinutes?: number) => void;
  onOpenQuickCapture: () => void;
}

const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_HEIGHT_PX = 68;

interface DragPayload {
  kind: 'task' | 'block';
  id: string;
}

interface AiCoachResponse {
  headline: string;
  recommendations: string[];
  energyRiskLevel: string;
}

export const PlannerTimelineView: React.FC<PlannerTimelineViewProps> = ({
  db,
  userId,
  onUpdateDb,
  onStartFocusTask,
  onOpenQuickCapture,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedDay, setSelectedDay] = useState(0);
  const [trayFilter, setTrayFilter] = useState<'unscheduled' | 'mit' | 'all'>('unscheduled');
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [hoverSlot, setHoverSlot] = useState<{ dayOffset: number; startMin: number } | null>(null);

  const [lastReschedule, setLastReschedule] = useState<RescheduleResult | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<TimeBlock[] | null>(null);

  const [urgentOpen, setUrgentOpen] = useState(false);
  const [urgentTitle, setUrgentTitle] = useState('Khách hàng Enterprise báo lỗi kết nối');
  const [urgentStartHour, setUrgentStartHour] = useState('10:30');
  const [urgentDuration, setUrgentDuration] = useState(30);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoachResult, setAiCoachResult] = useState<AiCoachResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const icsInputRef = useRef<HTMLInputElement | null>(null);

  const enabledProviders = new Set(
    db.calendarAccounts.filter((acc) => acc.enabled).map((acc) => acc.provider)
  );

  const visibleBlocks = db.blocks.filter((b) => {
    if (b.provider === 'chronos') return true;
    return enabledProviders.has(b.provider);
  });

  const daysToRender = viewMode === 'day' ? [selectedDay] : [0, 1, 2, 3, 4];

  const scheduledTaskIds = new Set(db.blocks.map((b) => b.taskId).filter(Boolean));
  const trayTasks = db.tasks
    .filter((t) => {
      if (t.status === 'done') return false;
      if (trayFilter === 'mit') return Boolean(t.isMit);
      if (trayFilter === 'unscheduled') return !scheduledTaskIds.has(t.id);
      return true;
    })
    .sort((a, b) => computeTaskPriorityScore(b) - computeTaskPriorityScore(a));

  const projectMap = new Map(db.projects.map((p) => [p.id, p]));

  const commitReschedule = (result: RescheduleResult) => {
    setUndoSnapshot(db.blocks);
    setLastReschedule(result);
    onUpdateDb((prev) => ({
      ...prev,
      blocks: result.updatedBlocks,
    }));
  };

  const handleUndoReschedule = () => {
    if (!undoSnapshot) return;
    const snap = undoSnapshot;
    setUndoSnapshot(null);
    setLastReschedule(null);
    onUpdateDb((prev) => ({
      ...prev,
      blocks: snap,
    }));
  };

  const handleScheduleTaskAt = (task: ChronosTask, dayOffset: number, startMin: number) => {
    const newBlock: TimeBlock = {
      id: `blk-${Date.now()}`,
      taskId: task.id,
      title: task.title,
      dayOffset,
      startMin,
      durationMin: Math.max(15, Math.min(240, task.estimatedMinutes)),
      flexType: task.urgent && task.important ? 'hard' : 'soft',
      cognitiveLoad: task.cognitiveLoad,
      provider: 'chronos',
      projectId: task.projectId,
      hardDeadlineMin: task.deadlineDayOffset === dayOffset && task.deadlineTime
        ? Number(task.deadlineTime.split(':')[0]) * 60 + Number(task.deadlineTime.split(':')[1] || 0)
        : undefined,
    };

    onUpdateDb((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: 'scheduled' } : t)),
    }));
  };

  const handleAutoPlaceTask = (task: ChronosTask) => {
    const preferredStart =
      task.cognitiveLoad === 'high'
        ? db.energyProfile.peakStartMin
        : task.cognitiveLoad === 'low'
        ? db.energyProfile.troughStartMin
        : db.energyProfile.workdayStartMin;

    const draftBlock: TimeBlock = {
      id: `blk-${Date.now()}`,
      taskId: task.id,
      title: task.title,
      dayOffset: selectedDay,
      startMin: preferredStart,
      durationMin: task.estimatedMinutes,
      flexType: 'soft',
      cognitiveLoad: task.cognitiveLoad,
      provider: 'chronos',
      projectId: task.projectId,
    };

    const res = runAutoReschedule([...db.blocks, draftBlock], selectedDay, db.energyProfile, {
      optimizeEnergy: true,
    });
    setUndoSnapshot(db.blocks);
    setLastReschedule(res);
    onUpdateDb((prev) => ({
      ...prev,
      blocks: res.updatedBlocks,
      tasks: prev.tasks.map((t) => (t.id === task.id ? { ...t, status: 'scheduled' } : t)),
    }));
  };

  const handleDropOnSlot = (dayOffset: number, startMin: number, e: React.DragEvent) => {
    e.preventDefault();
    setHoverSlot(null);
    let payload = dragPayload;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) payload = JSON.parse(raw) as DragPayload;
      } catch {
        payload = null;
      }
    }
    if (!payload) return;

    if (payload.kind === 'task') {
      const task = db.tasks.find((t) => t.id === payload.id);
      if (task) handleScheduleTaskAt(task, dayOffset, startMin);
    } else if (payload.kind === 'block') {
      onUpdateDb((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) =>
          b.id === payload.id ? { ...b, dayOffset, startMin } : b
        ),
      }));
    }
    setDragPayload(null);
  };

  const handleResizeBlock = (blockId: string, deltaMin: number) => {
    onUpdateDb((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, durationMin: Math.max(15, Math.min(240, b.durationMin + deltaMin)) } : b
      ),
    }));
  };

  const handleToggleBlockLock = (blockId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => {
        if (b.id !== blockId) return b;
        return { ...b, flexType: b.flexType === 'soft' ? 'hard' : 'soft' };
      }),
    }));
  };

  const handleCompleteBlock = (block: TimeBlock) => {
    onUpdateDb((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === block.id ? { ...b, completed: !b.completed } : b)),
      tasks: block.taskId
        ? prev.tasks.map((t) =>
            t.id === block.taskId
              ? {
                  ...t,
                  status: !block.completed ? 'done' : 'scheduled',
                  actualMinutes: t.actualMinutes > 0 ? t.actualMinutes : block.durationMin,
                }
              : t
          )
        : prev.tasks,
    }));
  };

  const handleUnscheduleBlock = (block: TimeBlock) => {
    onUpdateDb((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== block.id),
      tasks: block.taskId
        ? prev.tasks.map((t) => (t.id === block.taskId ? { ...t, status: 'inbox' } : t))
        : prev.tasks,
    }));
  };

  const handleExportIcs = () => {
    const ics = generateIcsFromBlocks(db);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronosflow-${db.baseDateISO}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportIcs = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseIcsEvents(text, db.baseDateISO);
    if (parsed.length > 0) {
      onUpdateDb((prev) => ({
        ...prev,
        blocks: [...prev.blocks, ...parsed],
      }));
    }
    e.target.value = '';
  };

  const handleRunGeminiCoach = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const resp = await fetch(`/api/ai/coach?userId=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chronos-user': userId,
        },
        body: JSON.stringify({ dayOffset: selectedDay, userId }),
      });
      const data = (await resp.json()) as AiCoachResponse & { error?: string };
      if (!resp.ok) {
        setAiError(data.error || 'Không thể lấy phân tích Gemini AI.');
        setAiCoachResult(null);
      } else {
        setAiCoachResult(data);
      }
    } catch {
      setAiError('Không thể kết nối tới endpoint /api/ai/coach.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUrgentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const [hh, mm] = urgentStartHour.split(':').map(Number);
    const startMin = (Number.isFinite(hh) ? hh : 10) * 60 + (Number.isFinite(mm) ? mm : 30);
    const res = insertUrgentInterruption(
      db.blocks,
      selectedDay,
      db.energyProfile,
      urgentTitle,
      startMin,
      urgentDuration
    );
    commitReschedule(res);
    setUrgentOpen(false);
  };

  const totalHoursCount = END_HOUR - START_HOUR;
  const gridHeightPx = totalHoursCount * HOUR_HEIGHT_PX;

  const peakTopPx = ((db.energyProfile.peakStartMin - START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
  const peakHeightPx = ((db.energyProfile.peakEndMin - db.energyProfile.peakStartMin) / 60) * HOUR_HEIGHT_PX;
  const troughTopPx = ((db.energyProfile.troughStartMin - START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
  const troughHeightPx = ((db.energyProfile.troughEndMin - db.energyProfile.troughStartMin) / 60) * HOUR_HEIGHT_PX;

  return (
    <div className="space-y-4">
      {/* Auto-Rescheduler Control Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Day / Week toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Lịch Ngày
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Lịch Tuần (5 ngày)
              </button>
            </div>

            {viewMode === 'day' && (
              <div className="inline-flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((offset) => {
                  const info = formatDayHeader(db.baseDateISO, offset);
                  return (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => setSelectedDay(offset)}
                      className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                        selectedDay === offset
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {info.weekday} <span className="font-mono tabular-nums text-[11px]">{info.dateStr}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Auto-Rescheduler Triggers */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => commitReschedule(simulateMeetingOverrun(db.blocks, selectedDay, db.energyProfile, 20))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-700/70 bg-amber-50/70 dark:bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
              title="Giả lập cuộc họp kéo dài thêm 20 phút và tự động dời các khối mềm phía sau"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>+20p Họp kéo dài</span>
            </button>

            <button
              type="button"
              onClick={() => setUrgentOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              <span>Chèn việc khẩn</span>
            </button>

            <button
              type="button"
              onClick={() =>
                commitReschedule(
                  runAutoReschedule(db.blocks, selectedDay, db.energyProfile, { optimizeEnergy: true })
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Tối ưu theo Năng lượng</span>
            </button>

            <button
              type="button"
              onClick={handleRunGeminiCoach}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-500/10 px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{aiLoading ? 'Đang phân tích...' : 'Cố vấn Gemini AI'}</span>
            </button>

            {undoSnapshot && (
              <button
                type="button"
                onClick={handleUndoReschedule}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Hoàn tác</span>
              </button>
            )}
          </div>
        </div>

        {/* Urgent Interruption Mini-Form */}
        {urgentOpen && (
          <form
            onSubmit={handleUrgentSubmit}
            className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-end gap-3"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] text-slate-500 mb-1">Nội dung việc khẩn xen ngang</label>
              <input
                type="text"
                value={urgentTitle}
                onChange={(e) => setUrgentTitle(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                value={urgentStartHour}
                onChange={(e) => setUrgentStartHour(e.target.value)}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Thời lượng</label>
              <select
                value={urgentDuration}
                onChange={(e) => setUrgentDuration(Number(e.target.value))}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
              >
                <option value={15}>15p</option>
                <option value={30}>30p</option>
                <option value={45}>45p</option>
                <option value={60}>60p</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Chèn &amp; Tự động dời lịch
            </button>
          </form>
        )}

        {/* Auto-Reschedule Output Banner */}
        {lastReschedule && (
          <div className="mt-3 rounded-lg border border-blue-200 dark:border-blue-800/70 bg-blue-50/70 dark:bg-blue-950/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-blue-900 dark:text-blue-200">
                {lastReschedule.summary}
              </div>
              <button
                type="button"
                onClick={() => setLastReschedule(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Đóng thông báo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {lastReschedule.changes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {lastReschedule.changes.map((c) => (
                  <div
                    key={c.blockId}
                    className="flex items-center justify-between rounded bg-white/80 dark:bg-slate-900/70 px-2.5 py-1 border border-blue-100 dark:border-slate-800"
                  >
                    <span className="truncate font-medium text-slate-700 dark:text-slate-200 pr-2">{c.title}</span>
                    <span className="shrink-0 font-mono tabular-nums text-[11px] text-blue-700 dark:text-blue-300">
                      {formatMinToHHMM(c.oldStartMin)} → {formatMinToHHMM(c.newStartMin)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {lastReschedule.conflicts.map((conf) => (
              <div
                key={conf.blockId}
                className="flex items-center gap-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-2.5 py-1.5 text-red-700 dark:text-red-300"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{conf.title}:</strong> {conf.reason}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Gemini AI Coach Banner */}
        {(aiCoachResult || aiError) && (
          <div className="mt-3 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 p-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              {aiError ? (
                <p className="text-amber-700 dark:text-amber-300">{aiError}</p>
              ) : aiCoachResult ? (
                <div className="space-y-1.5">
                  <div className="font-semibold text-indigo-900 dark:text-indigo-200">
                    Gemini Coach · {aiCoachResult.headline} ({aiCoachResult.energyRiskLevel})
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                    {aiCoachResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setAiCoachResult(null);
                  setAiError(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Split: Left Task Tray + Right Time-Blocking Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Task Inbox & Sync Hub */}
        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-sans text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Kho Đầu Việc (Kéo vào Lịch)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Kéo-thả vào khung giờ hoặc bấm Xếp lịch tự động
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenQuickCapture}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm</span>
              </button>
            </div>

            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 pb-2">
              {(
                [
                  { id: 'unscheduled', label: 'Chưa lên lịch' },
                  { id: 'mit', label: 'Top 3 MIT' },
                  { id: 'all', label: 'Tất cả mở' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTrayFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    trayFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {trayTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-500">
                  Tất cả đầu việc trong bộ lọc đã được phân bổ khung giờ.
                </div>
              ) : (
                trayTasks.map((task) => {
                  const score = computeTaskPriorityScore(task);
                  const project = projectMap.get(task.projectId);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        const p: DragPayload = { kind: 'task', id: task.id };
                        setDragPayload(p);
                        e.dataTransfer.setData('application/json', JSON.stringify(p));
                      }}
                      className="group cursor-grab active:cursor-grabbing rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-2.5 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-snug">
                            {task.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {project && <span>{project.name}</span>}
                            <span className="font-mono tabular-nums">{formatDurationVi(task.estimatedMinutes)}</span>
                            <span className={task.cognitiveLoad === 'high' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                              {task.cognitiveLoad === 'high' ? 'Trí lực Cao' : task.cognitiveLoad === 'medium' ? 'TB' : 'Nhẹ'}
                            </span>
                          </div>
                        </div>
                        <span
                          className="shrink-0 font-mono text-[11px] tabular-nums font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 rounded"
                          title="Điểm ưu tiên tự động (Eisenhower + Trí lực)"
                        >
                          {score}đ
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/70 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleAutoPlaceTask(task)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ArrowLeftRight className="h-3 w-3" />
                          <span>Xếp khe tối ưu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onStartFocusTask(task.id, task.title, task.estimatedMinutes)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          <Play className="h-3 w-3" />
                          <span>Tập trung</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Multi-Calendar Sync Hub */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Đồng bộ Lịch Đa Nền Tảng
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={icsInputRef}
                  type="file"
                  accept=".ics"
                  className="hidden"
                  onChange={handleImportIcs}
                />
                <button
                  type="button"
                  onClick={() => icsInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Nhập sự kiện từ file .ics (Google/Apple/Outlook)"
                >
                  <Upload className="h-3 w-3" />
                  <span>Nhập .ics</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportIcs}
                  className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  title="Xuất lịch ChronosFlow ra chuẩn iCalendar (.ics)"
                >
                  <Download className="h-3 w-3" />
                  <span>.ics</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {db.calendarAccounts.map((acc) => (
                <label
                  key={acc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-2 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{acc.label}</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">{acc.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={acc.enabled}
                    onChange={() =>
                      onUpdateDb((prev) => ({
                        ...prev,
                        calendarAccounts: prev.calendarAccounts.map((c) =>
                          c.id === acc.id ? { ...c, enabled: !c.enabled, lastSyncedAt: new Date().toISOString() } : c
                        ),
                      }))
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Interactive Time-Blocking Calendar */}
        <div className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden">
          {/* Energy Zone Legend Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500/30 border border-emerald-500/60" />
                <span>Đỉnh cao trí tuệ ({formatMinToHHMM(db.energyProfile.peakStartMin)}–{formatMinToHHMM(db.energyProfile.peakEndMin)})</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-500/25 border border-amber-500/50" />
                <span>Trũng năng lượng ({formatMinToHHMM(db.energyProfile.troughStartMin)}–{formatMinToHHMM(db.energyProfile.troughEndMin)})</span>
              </span>
            </div>
            <span className="font-mono tabular-nums">
              Shutdown: {formatMinToHHMM(db.energyProfile.shutdownMin)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className={viewMode === 'week' ? 'min-w-[780px]' : 'min-w-full'}>
              {/* Column Day Headers */}
              <div
                className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50"
                style={{ gridTemplateColumns: `64px repeat(${daysToRender.length}, minmax(0, 1fr))` }}
              >
                <div className="px-2 py-2 text-[11px] font-mono text-slate-400 text-right">GMT+7</div>
                {daysToRender.map((dayOffset) => {
                  const info = formatDayHeader(db.baseDateISO, dayOffset);
                  const count = visibleBlocks.filter((b) => b.dayOffset === dayOffset).length;
                  return (
                    <div
                      key={dayOffset}
                      className="border-l border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between"
                    >
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {info.weekday}{' '}
                        <span className="font-mono tabular-nums font-normal text-slate-500">{info.dateStr}</span>
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-slate-400">{count} khối</span>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable Timeline Canvas */}
              <div className="relative max-h-[650px] overflow-y-auto">
                <div
                  className="grid relative"
                  style={{
                    gridTemplateColumns: `64px repeat(${daysToRender.length}, minmax(0, 1fr))`,
                    height: `${gridHeightPx}px`,
                  }}
                >
                  {/* Hour Labels Column */}
                  <div className="relative select-none bg-slate-50/40 dark:bg-slate-900/20">
                    {Array.from({ length: totalHoursCount }).map((_, idx) => {
                      const hour = START_HOUR + idx;
                      return (
                        <div
                          key={hour}
                          style={{ height: `${HOUR_HEIGHT_PX}px` }}
                          className="border-b border-slate-100 dark:border-slate-800/70 pr-2 pt-1 text-right font-mono text-[11px] tabular-nums text-slate-400"
                        >
                          {String(hour).padStart(2, '0')}:00
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Columns */}
                  {daysToRender.map((dayOffset) => {
                    const dayBlocks = visibleBlocks
                      .filter((b) => b.dayOffset === dayOffset)
                      .sort((a, b) => a.startMin - b.startMin);

                    return (
                      <div
                        key={dayOffset}
                        className="relative border-l border-slate-200 dark:border-slate-800"
                      >
                        {/* Biological Energy Zone Shading */}
                        <div
                          className="pointer-events-none absolute inset-x-0 bg-emerald-500/[0.06] dark:bg-emerald-400/[0.07] border-y border-emerald-500/20"
                          style={{ top: `${peakTopPx}px`, height: `${peakHeightPx}px` }}
                        />
                        <div
                          className="pointer-events-none absolute inset-x-0 bg-amber-500/[0.06] dark:bg-amber-400/[0.07] border-y border-amber-500/20"
                          style={{ top: `${troughTopPx}px`, height: `${troughHeightPx}px` }}
                        />

                        {/* 30-Minute Drop Targets */}
                        {Array.from({ length: totalHoursCount * 2 }).map((_, slotIdx) => {
                          const slotStartMin = START_HOUR * 60 + slotIdx * 30;
                          const isHovered =
                            hoverSlot?.dayOffset === dayOffset && hoverSlot?.startMin === slotStartMin;
                          return (
                            <div
                              key={slotStartMin}
                              style={{ height: `${HOUR_HEIGHT_PX / 2}px` }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                setHoverSlot({ dayOffset, startMin: slotStartMin });
                              }}
                              onDragLeave={() => {
                                if (hoverSlot?.dayOffset === dayOffset && hoverSlot?.startMin === slotStartMin) {
                                  setHoverSlot(null);
                                }
                              }}
                              onDrop={(e) => handleDropOnSlot(dayOffset, slotStartMin, e)}
                              className={`border-b ${
                                slotIdx % 2 === 1
                                  ? 'border-slate-200/80 dark:border-slate-800/80'
                                  : 'border-slate-100/70 dark:border-slate-800/40 border-dashed'
                              } transition-colors ${isHovered ? 'bg-blue-500/15' : ''}`}
                            />
                          );
                        })}

                        {/* Positioned Time Blocks */}
                        {dayBlocks.map((block) => {
                          const topPx = ((block.startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
                          const heightPx = Math.max(30, (block.durationMin / 60) * HOUR_HEIGHT_PX - 3);
                          const isSoft = block.flexType === 'soft';
                          const isMeeting = block.flexType === 'meeting' || block.flexType === 'external';

                          const cardStyle = block.completed
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 opacity-80'
                            : isMeeting
                            ? 'border-slate-300 dark:border-slate-700 bg-slate-100/95 dark:bg-slate-800/95 text-slate-900 dark:text-slate-100'
                            : isSoft
                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50/95 dark:bg-blue-950/75 text-slate-900 dark:text-slate-100'
                            : 'border-red-300 dark:border-red-700 bg-red-50/95 dark:bg-red-950/65 text-slate-900 dark:text-slate-100';

                          return (
                            <div
                              key={block.id}
                              draggable={block.provider === 'chronos'}
                              onDragStart={(e) => {
                                const p: DragPayload = { kind: 'block', id: block.id };
                                setDragPayload(p);
                                e.dataTransfer.setData('application/json', JSON.stringify(p));
                              }}
                              style={{ top: `${topPx + 1}px`, height: `${heightPx}px` }}
                              className={`group absolute inset-x-1.5 z-10 rounded-lg border px-2.5 py-1.5 flex flex-col justify-between overflow-hidden shadow-xs transition-shadow hover:z-20 hover:shadow-md ${cardStyle} ${
                                block.provider === 'chronos' ? 'cursor-grab active:cursor-grabbing' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                    <span>
                                      {formatMinToHHMM(block.startMin)}–{formatMinToHHMM(block.startMin + block.durationMin)}
                                    </span>
                                    <span>·</span>
                                    <span>
                                      {block.provider !== 'chronos'
                                        ? block.provider.toUpperCase()
                                        : isSoft
                                        ? 'Mềm'
                                        : block.flexType === 'hard'
                                        ? 'Cứng'
                                        : 'Họp'}
                                    </span>
                                  </div>
                                  <div
                                    className={`text-xs font-medium leading-tight truncate ${
                                      block.completed ? 'line-through' : ''
                                    }`}
                                  >
                                    {block.title}
                                  </div>
                                </div>

                                {block.hardDeadlineMin && (
                                  <span
                                    className="shrink-0 font-mono text-[10px] text-red-600 dark:text-red-400"
                                    title={`Deadline cứng ${formatMinToHHMM(block.hardDeadlineMin)}`}
                                  >
                                    DL {formatMinToHHMM(block.hardDeadlineMin)}
                                  </span>
                                )}
                              </div>

                              {/* Micro Controls */}
                              {heightPx >= 46 && (
                                <div className="flex items-center justify-between gap-1 pt-1 opacity-85 group-hover:opacity-100">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteBlock(block)}
                                      className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                                      title="Đánh dấu hoàn thành"
                                    >
                                      <CheckCircle2 className={`h-3.5 w-3.5 ${block.completed ? 'text-emerald-600' : 'text-slate-500'}`} />
                                    </button>
                                    {block.provider === 'chronos' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBlockLock(block.id)}
                                          className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                                          title={isSoft ? 'Khóa thành Hard-block' : 'Chuyển sang Soft-block linh hoạt'}
                                        >
                                          {isSoft ? (
                                            <Unlock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                          ) : (
                                            <Lock className="h-3 w-3 text-red-600 dark:text-red-400" />
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onStartFocusTask(block.taskId, block.title, block.durationMin)
                                          }
                                          className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                                          title="Vào Deep Work Studio"
                                        >
                                          <Play className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {block.provider === 'chronos' && (
                                    <div className="flex items-center gap-1 font-mono text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => handleResizeBlock(block.id, -15)}
                                        className="rounded px-1 hover:bg-black/10 dark:hover:bg-white/10"
                                        title="Giảm 15 phút"
                                      >
                                        -15
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleResizeBlock(block.id, 15)}
                                        className="rounded px-1 hover:bg-black/10 dark:hover:bg-white/10"
                                        title="Tăng 15 phút"
                                      >
                                        +15
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUnscheduleBlock(block)}
                                        className="rounded px-1 text-slate-500 hover:text-red-600"
                                        title="Trả về Inbox"
                                      >
                                        <Calendar className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
