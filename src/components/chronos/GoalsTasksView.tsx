import React, { useState } from 'react';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Play,
  Plus,
  Square,
  Target,
  Trash2,
} from 'lucide-react';
import type {
  ChronosDatabase,
  ChronosTask,
  CognitiveLoad,
  EisenhowerQuadrant,
} from '../../utils/chronosTypes.ts';
import {
  computeOkrComputedProgress,
  computeTaskPriorityScore,
  formatDurationVi,
  getEisenhowerQuadrant,
  getQuadrantMeta,
} from '../../utils/chronosEngine.ts';

interface GoalsTasksViewProps {
  db: ChronosDatabase;
  onUpdateDb: (updater: (prev: ChronosDatabase) => ChronosDatabase) => void;
  onStartFocusTask: (taskId?: string, customTitle?: string, suggestedMinutes?: number) => void;
}

export const GoalsTasksView: React.FC<GoalsTasksViewProps> = ({
  db,
  onUpdateDb,
  onStartFocusTask,
}) => {
  const [mode, setMode] = useState<'hierarchy' | 'eisenhower'>('hierarchy');
  const [expandedOkrs, setExpandedOkrs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(db.okrs.map((o) => [o.id, true]))
  );
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(db.projects.map((p) => [p.id, true]))
  );
  const [newSubtaskByTask, setNewSubtaskByTask] = useState<Record<string, string>>({});
  const [newTaskProject, setNewTaskProject] = useState<string>(db.projects[0]?.id ?? 'prj-core');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskLoad, setNewTaskLoad] = useState<CognitiveLoad>('high');
  const [newTaskMin, setNewTaskMin] = useState(60);
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskImportant, setNewTaskImportant] = useState(true);

  const [newOkrTitle, setNewOkrTitle] = useState('');
  const [addingOkr, setAddingOkr] = useState(false);

  const toggleSubtask = (taskId: string, subId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
            }
          : t
      ),
    }));
  };

  const addSubtask = (taskId: string) => {
    const title = (newSubtaskByTask[taskId] || '').trim();
    if (!title) return;
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [...t.subtasks, { id: `sub-${Date.now()}`, title, done: false }],
            }
          : t
      ),
    }));
    setNewSubtaskByTask((prev) => ({ ...prev, [taskId]: '' }));
  };

  const toggleTaskDone = (taskId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextDone = t.status !== 'done';
        return {
          ...t,
          status: nextDone ? 'done' : 'inbox',
          completedAt: nextDone ? new Date().toISOString() : undefined,
          actualMinutes: nextDone && t.actualMinutes === 0 ? t.estimatedMinutes : t.actualMinutes,
        };
      }),
    }));
  };

  const deleteTask = (taskId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      blocks: prev.blocks.filter((b) => b.taskId !== taskId),
    }));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const created: ChronosTask = {
      id: `tsk-${Date.now()}`,
      projectId: newTaskProject || db.projects[0]?.id || 'prj-core',
      title: newTaskTitle.trim(),
      urgent: newTaskUrgent,
      important: newTaskImportant,
      cognitiveLoad: newTaskLoad,
      estimatedMinutes: newTaskMin,
      actualMinutes: 0,
      status: 'inbox',
      assigneeId: db.teamMembers[0]?.id ?? 'mem-1',
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    onUpdateDb((prev) => ({ ...prev, tasks: [created, ...prev.tasks] }));
    setNewTaskTitle('');
  };

  const handleCreateOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOkrTitle.trim()) return;
    const okrId = `okr-${Date.now()}`;
    const prjId = `prj-${Date.now()}`;
    onUpdateDb((prev) => ({
      ...prev,
      okrs: [
        ...prev.okrs,
        {
          id: okrId,
          title: newOkrTitle.trim(),
          quarter: 'Q4 / 2026',
          owner: prev.userName,
          targetMetric: 'Mục tiêu định lượng mới',
          progressPct: 0,
        },
      ],
      projects: [
        ...prev.projects,
        {
          id: prjId,
          okrId,
          name: `Dự án triển khai: ${newOkrTitle.trim().slice(0, 28)}`,
          category: 'Chiến lược mới',
          color: '#2563EB',
        },
      ],
    }));
    setExpandedOkrs((prev) => ({ ...prev, [okrId]: true }));
    setExpandedProjects((prev) => ({ ...prev, [prjId]: true }));
    setNewOkrTitle('');
    setAddingOkr(false);
  };

  const quadrants: EisenhowerQuadrant[] = ['q1_do', 'q2_plan', 'q3_delegate', 'q4_eliminate'];

  return (
    <div className="space-y-4">
      {/* Header Controls & Quick Add Task Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setMode('hierarchy')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'hierarchy'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Cây phân cấp 4 tầng (OKR → Dự án → Việc → Việc nhỏ)
            </button>
            <button
              type="button"
              onClick={() => setMode('eisenhower')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'eisenhower'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Ma trận Eisenhower &amp; Tải trí lực
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAddingOkr((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Target className="h-3.5 w-3.5 text-blue-600" />
            <span>Thêm OKR Quý</span>
          </button>
        </div>

        {addingOkr && (
          <form onSubmit={handleCreateOkr} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={newOkrTitle}
              onChange={(e) => setNewOkrTitle(e.target.value)}
              placeholder="Tên Mục tiêu Quý mới (tự động tạo kèm Dự án triển khai)..."
              className="flex-1 min-w-[220px] rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
              Lưu OKR
            </button>
          </form>
        )}

        {/* Inline Task Creator */}
        <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Thêm đầu việc mới vào dự án..."
            className="md:col-span-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
          />
          <select
            value={newTaskProject}
            onChange={(e) => setNewTaskProject(e.target.value)}
            className="md:col-span-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
          >
            {db.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={newTaskLoad}
            onChange={(e) => setNewTaskLoad(e.target.value as CognitiveLoad)}
            className="md:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
          >
            <option value="high">Trí lực: Cao</option>
            <option value="medium">Trí lực: TB</option>
            <option value="low">Trí lực: Thấp</option>
          </select>
          <select
            value={newTaskMin}
            onChange={(e) => setNewTaskMin(Number(e.target.value))}
            className="md:col-span-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-mono"
          >
            <option value={30}>30p</option>
            <option value={45}>45p</option>
            <option value={60}>60p</option>
            <option value={90}>90p</option>
          </select>
          <div className="md:col-span-2 flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={newTaskUrgent}
                onChange={(e) => setNewTaskUrgent(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Khẩn</span>
            </label>
            <label className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={newTaskImportant}
                onChange={(e) => setNewTaskImportant(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Q.trọng</span>
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tạo</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mode 1: 4-Tier Hierarchy */}
      {mode === 'hierarchy' ? (
        <div className="space-y-3">
          {db.okrs.map((okr) => {
            const okrExpanded = expandedOkrs[okr.id] ?? true;
            const okrProjects = db.projects.filter((p) => p.okrId === okr.id);
            const progress = computeOkrComputedProgress(okr, db.projects, db.tasks);

            return (
              <div
                key={okr.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden"
              >
                {/* Tier 1: OKR */}
                <div
                  onClick={() => setExpandedOkrs((prev) => ({ ...prev, [okr.id]: !okrExpanded }))}
                  className="cursor-pointer flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {okrExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {okr.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {okr.quarter} · Phụ trách: {okr.owner} · {okr.targetMetric}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-28 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                      {progress}%
                    </span>
                  </div>
                </div>

                {/* Tier 2: Projects */}
                {okrExpanded && (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {okrProjects.map((project) => {
                      const prjExpanded = expandedProjects[project.id] ?? true;
                      const prjTasks = db.tasks
                        .filter((t) => t.projectId === project.id)
                        .sort((a, b) => computeTaskPriorityScore(b) - computeTaskPriorityScore(a));

                      return (
                        <div key={project.id} className="px-4 py-3 space-y-2.5">
                          <div
                            onClick={() =>
                              setExpandedProjects((prev) => ({ ...prev, [project.id]: !prjExpanded }))
                            }
                            className="cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              {prjExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                              )}
                              <FolderKanban className="h-3.5 w-3.5" style={{ color: project.color }} />
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {project.name}
                              </span>
                              <span className="text-[11px] text-slate-500">· {project.category}</span>
                            </div>
                            <span className="font-mono text-[11px] tabular-nums text-slate-500">
                              {prjTasks.filter((t) => t.status === 'done').length}/{prjTasks.length} hoàn thành
                            </span>
                          </div>

                          {/* Tier 3: Tasks */}
                          {prjExpanded && (
                            <div className="pl-5 space-y-2">
                              {prjTasks.map((task) => {
                                const score = computeTaskPriorityScore(task);
                                const isDone = task.status === 'done';
                                const qMeta = getQuadrantMeta(getEisenhowerQuadrant(task));

                                return (
                                  <div
                                    key={task.id}
                                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 space-y-2"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => toggleTaskDone(task.id)}
                                          className="text-slate-500 hover:text-emerald-600"
                                        >
                                          {isDone ? (
                                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                                          ) : (
                                            <Square className="h-4 w-4" />
                                          )}
                                        </button>
                                        <span
                                          className={`text-xs font-medium ${
                                            isDone
                                              ? 'line-through text-slate-400'
                                              : 'text-slate-900 dark:text-slate-100'
                                          }`}
                                        >
                                          {task.title}
                                        </span>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                        <span className="font-mono tabular-nums text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 px-1.5 py-0.5 rounded">
                                          {score}đ
                                        </span>
                                        <span className="text-slate-500">{qMeta.short}</span>
                                        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                          DK {formatDurationVi(task.estimatedMinutes)} / TT {formatDurationVi(task.actualMinutes)}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => onStartFocusTask(task.id, task.title, task.estimatedMinutes)}
                                          className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                        >
                                          <Play className="h-3 w-3" />
                                          <span>Focus</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteTask(task.id)}
                                          className="text-slate-400 hover:text-red-500"
                                          title="Xóa đầu việc"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Tier 4: Sub-tasks */}
                                    <div className="pl-6 space-y-1">
                                      {task.subtasks.map((sub) => (
                                        <label
                                          key={sub.id}
                                          className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={sub.done}
                                            onChange={() => toggleSubtask(task.id, sub.id)}
                                            className="rounded border-slate-300 text-blue-600"
                                          />
                                          <span className={sub.done ? 'line-through text-slate-400' : ''}>
                                            {sub.title}
                                          </span>
                                        </label>
                                      ))}
                                      <div className="flex items-center gap-1.5 pt-0.5">
                                        <input
                                          type="text"
                                          value={newSubtaskByTask[task.id] || ''}
                                          onChange={(e) =>
                                            setNewSubtaskByTask((prev) => ({
                                              ...prev,
                                              [task.id]: e.target.value,
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              addSubtask(task.id);
                                            }
                                          }}
                                          placeholder="+ Thêm việc nhỏ (Enter)..."
                                          className="w-56 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-0.5 text-[11px]"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Mode 2: Eisenhower 4 Quadrants */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quadrants.map((q) => {
            const meta = getQuadrantMeta(q);
            const qTasks = db.tasks
              .filter((t) => t.status !== 'done' && getEisenhowerQuadrant(t) === q)
              .sort((a, b) => computeTaskPriorityScore(b) - computeTaskPriorityScore(a));

            return (
              <div
                key={q}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 className="font-sans text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {meta.label}
                  </h3>
                  <span className="font-mono text-xs tabular-nums text-slate-500">{qTasks.length} việc</span>
                </div>

                <div className="space-y-2">
                  {qTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Không có đầu việc mở trong nhóm này.</p>
                  ) : (
                    qTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {formatDurationVi(task.estimatedMinutes)} · Trí lực{' '}
                            {task.cognitiveLoad === 'high' ? 'Cao' : task.cognitiveLoad === 'medium' ? 'TB' : 'Thấp'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                            {computeTaskPriorityScore(task)}đ
                          </span>
                          <button
                            type="button"
                            onClick={() => onStartFocusTask(task.id, task.title, task.estimatedMinutes)}
                            className="rounded border border-slate-200 dark:border-slate-700 p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Bắt đầu tập trung"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
