import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock,
  GripVertical,
  ListChecks,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  ChronosDatabase,
  ChronosTask,
  CognitiveLoad,
  KanbanColumnId,
} from '../../utils/chronosTypes.ts';
import {
  KANBAN_COLUMNS,
  computeTaskPriorityScore,
  formatDurationVi,
  getEisenhowerQuadrant,
  getQuadrantMeta,
  getTasksForKanbanColumn,
  moveKanbanTaskInDb,
} from '../../utils/chronosEngine.ts';

interface KanbanBoardViewProps {
  db: ChronosDatabase;
  onUpdateDb: (updater: (prev: ChronosDatabase) => ChronosDatabase) => void;
  onStartFocusTask: (taskId?: string, customTitle?: string, suggestedMinutes?: number) => void;
}

type FilterMode = 'all' | 'q1' | 'high_load' | 'mit';

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  db,
  onUpdateDb,
  onStartFocusTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<FilterMode>('all');

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ columnId: KanbanColumnId; index: number } | null>(
    null
  );
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [newSubtaskDrafts, setNewSubtaskDrafts] = useState<Record<string, string>>({});

  // Inline creation per column (default open in "Mới tạo" when workspace is empty)
  const [addingColumn, setAddingColumn] = useState<KanbanColumnId | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftProjectId, setDraftProjectId] = useState<string>('');
  const [draftMinutes, setDraftMinutes] = useState<number>(45);
  const [draftLoad, setDraftLoad] = useState<CognitiveLoad>('medium');
  const [draftUrgent, setDraftUrgent] = useState(false);
  const [draftImportant, setDraftImportant] = useState(true);

  const projectMap = useMemo(() => new Map(db.projects.map((p) => [p.id, p])), [db.projects]);

  const matchesFilters = (task: ChronosTask) => {
    const q = searchQuery.trim().toLowerCase();
    if (q && !task.title.toLowerCase().includes(q)) return false;

    if (projectFilter === 'inbox_only') {
      if (task.projectId && projectMap.has(task.projectId)) return false;
    } else if (projectFilter !== 'all') {
      if (task.projectId !== projectFilter) return false;
    }

    if (quickFilter === 'q1') {
      if (getEisenhowerQuadrant(task) !== 'q1_do') return false;
    } else if (quickFilter === 'high_load') {
      if (task.cognitiveLoad !== 'high') return false;
    } else if (quickFilter === 'mit') {
      if (!task.isMit) return false;
    }

    return true;
  };

  const hasActiveFilter =
    searchQuery.trim().length > 0 || projectFilter !== 'all' || quickFilter !== 'all';

  const handleMoveTask = (
    taskId: string,
    targetColumn: KanbanColumnId,
    targetIndex?: number
  ) => {
    onUpdateDb((prev) => moveKanbanTaskInDb(prev, taskId, targetColumn, targetIndex));
  };

  const handleCreateCardInColumn = (columnId: KanbanColumnId, e: React.FormEvent) => {
    e.preventDefault();
    const clean = draftTitle.trim();
    if (!clean) return;

    const status: ChronosTask['status'] =
      columnId === 'done' ? 'done' : columnId === 'in_progress' ? 'in_progress' : 'inbox';

    const existingColTasks = getTasksForKanbanColumn(db.tasks, columnId);
    const created: ChronosTask = {
      id: `tsk-${Date.now()}`,
      projectId: draftProjectId,
      title: clean,
      urgent: draftUrgent,
      important: draftImportant,
      cognitiveLoad: draftLoad,
      estimatedMinutes: draftMinutes,
      actualMinutes: status === 'done' ? draftMinutes : 0,
      status,
      boardOrder: 0,
      assigneeId: db.teamMembers[0]?.id ?? '',
      subtasks: [],
      createdAt: new Date().toISOString(),
      completedAt: status === 'done' ? new Date().toISOString() : undefined,
    };

    const reindexedOthers = new Map(
      existingColTasks.map((t, idx) => [t.id, { ...t, boardOrder: idx + 1 }])
    );

    onUpdateDb((prev) => ({
      ...prev,
      tasks: [created, ...prev.tasks.map((t) => reindexedOthers.get(t.id) ?? t)],
    }));

    setDraftTitle('');
    setAddingColumn(null);
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
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

  const handleAddSubtask = (taskId: string) => {
    const title = (newSubtaskDrafts[taskId] || '').trim();
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
    setNewSubtaskDrafts((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleToggleMit = (taskId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, isMit: !t.isMit } : t)),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      blocks: prev.blocks.filter((b) => b.taskId !== taskId),
    }));
  };

  const handleStartFocusFromCard = (task: ChronosTask) => {
    if (task.status === 'inbox' || task.status === 'scheduled') {
      onUpdateDb((prev) => moveKanbanTaskInDb(prev, task.id, 'in_progress'));
    }
    onStartFocusTask(task.id, task.title, task.estimatedMinutes);
  };

  const resolveDraggedTaskId = (e: React.DragEvent): string | null => {
    if (draggingTaskId) return draggingTaskId;
    const jsonRaw = e.dataTransfer.getData('application/json');
    if (jsonRaw) {
      try {
        const parsed = JSON.parse(jsonRaw) as { kind?: string; id?: string };
        if (parsed?.kind === 'kanban-task' && parsed.id) return parsed.id;
      } catch {
        // Fallback below
      }
    }
    const textId = e.dataTransfer.getData('text/plain');
    return textId || null;
  };

  const getColumnIcon = (colId: KanbanColumnId) => {
    if (colId === 'done') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />;
    }
    if (colId === 'in_progress') {
      return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />;
    }
    return <CircleDashed className="h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />;
  };

  const inProgressCount = getTasksForKanbanColumn(db.tasks, 'in_progress').length;

  return (
    <div className="space-y-4" data-testid="chronos-kanban-board">
      {/* Filter & Quick Actions Toolbar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search
              className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Tìm kiếm thẻ công việc"
              data-testid="kanban-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên công việc..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Lọc theo dự án"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">Tất cả dự án</option>
            <option value="inbox_only">Đầu việc độc lập</option>
            {db.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div
            className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5"
            role="group"
            aria-label="Bộ lọc nhanh công việc"
          >
            {(
              [
                { id: 'all', label: 'Tất cả' },
                { id: 'q1', label: 'Khẩn Q1' },
                { id: 'high_load', label: 'Trí lực cao' },
                { id: 'mit', label: 'MIT' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setQuickFilter(opt.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  quickFilter === opt.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {inProgressCount > 3 && (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Đang mở {inProgressCount} việc song song — cân nhắc hoàn tất bớt
            </span>
          )}
          <button
            type="button"
            data-testid="kanban-quick-add-btn"
            onClick={() => {
              setAddingColumn('todo');
              setDraftProjectId(db.projects[0]?.id ?? '');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Thêm thẻ mới</span>
          </button>
        </div>
      </div>

      {/* 3-Column Jira / Trello Kanban Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {KANBAN_COLUMNS.map((col, colIdx) => {
          const allColumnTasks = getTasksForKanbanColumn(db.tasks, col.id);
          const visibleTasks = allColumnTasks.filter(matchesFilters);
          const totalMin = visibleTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);
          const isDropZoneActive = dropTarget?.columnId === col.id;
          const prevCol = colIdx > 0 ? KANBAN_COLUMNS[colIdx - 1] : null;
          const nextCol = colIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIdx + 1] : null;

          return (
            <section
              key={col.id}
              data-testid={`kanban-column-${col.id}`}
              aria-label={`Cột ${col.title}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (!dropTarget || dropTarget.columnId !== col.id || dropTarget.index !== allColumnTasks.length) {
                  setDropTarget({ columnId: col.id, index: allColumnTasks.length });
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropTarget((curr) => (curr?.columnId === col.id ? null : curr));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = resolveDraggedTaskId(e);
                const idx = dropTarget?.columnId === col.id ? dropTarget.index : allColumnTasks.length;
                if (draggedId) {
                  handleMoveTask(draggedId, col.id, idx);
                }
                setDraggingTaskId(null);
                setDropTarget(null);
              }}
              className={`rounded-xl border p-3.5 space-y-3 min-h-[360px] transition-colors ${
                isDropZoneActive
                  ? 'border-blue-500 bg-blue-50/40 dark:border-blue-400 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0E1526]'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5">{getColumnIcon(col.id)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {col.title}
                      </h2>
                      <span
                        data-testid={`kanban-count-${col.id}`}
                        className="font-mono text-xs tabular-nums font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {visibleTasks.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {col.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {formatDurationVi(totalMin)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Thêm công việc vào cột ${col.title}`}
                    data-testid={`kanban-add-col-${col.id}`}
                    onClick={() => {
                      setAddingColumn((curr) => (curr === col.id ? null : col.id));
                      setDraftProjectId(db.projects[0]?.id ?? '');
                    }}
                    className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    title={`Thêm thẻ vào ${col.title}`}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Inline Card Creator (Trello/Jira-style) */}
              {addingColumn === col.id && (
                <form
                  onSubmit={(e) => handleCreateCardInColumn(col.id, e)}
                  data-testid={`kanban-create-form-${col.id}`}
                  className="rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-[#111827] p-3 space-y-2.5"
                >
                  <input
                    type="text"
                    autoFocus
                    data-testid={`kanban-create-input-${col.id}`}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder={`Nhập tên việc cho cột ${col.title}...`}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      aria-label="Dự án cho thẻ mới"
                      value={draftProjectId}
                      onChange={(e) => setDraftProjectId(e.target.value)}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Độc lập (Inbox)</option>
                      {db.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-1">
                      <select
                        aria-label="Thời lượng dự kiến"
                        value={draftMinutes}
                        onChange={(e) => setDraftMinutes(Number(e.target.value))}
                        className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-[11px] font-mono tabular-nums"
                      >
                        <option value={15}>15p</option>
                        <option value={30}>30p</option>
                        <option value={45}>45p</option>
                        <option value={60}>60p</option>
                        <option value={90}>90p</option>
                      </select>
                      <select
                        aria-label="Mức trí lực"
                        value={draftLoad}
                        onChange={(e) => setDraftLoad(e.target.value as CognitiveLoad)}
                        className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-1 text-[11px]"
                      >
                        <option value="high">Cao</option>
                        <option value="medium">TB</option>
                        <option value="low">Nhẹ</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftUrgent}
                          onChange={(e) => setDraftUrgent(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>Khẩn</span>
                      </label>
                      <label className="inline-flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftImportant}
                          onChange={(e) => setDraftImportant(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <span>Q.trọng</span>
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingColumn(null);
                          setDraftTitle('');
                        }}
                        className="rounded-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        data-testid={`kanban-create-submit-${col.id}`}
                        className="rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700 cursor-pointer"
                      >
                        Lưu thẻ
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Task Cards List */}
              <div className="space-y-2.5">
                {visibleTasks.length === 0 && addingColumn !== col.id ? (
                  <div
                    data-testid={`kanban-empty-${col.id}`}
                    className={`rounded-lg border border-dashed p-5 text-center space-y-2 ${
                      isDropZoneActive
                        ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300'
                        : 'border-slate-300/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs">
                      {isDropZoneActive
                        ? `Thả công việc vào cột ${col.title}`
                        : hasActiveFilter
                        ? 'Không có công việc khớp bộ lọc hiện tại.'
                        : col.id === 'todo'
                        ? 'Chưa có công việc mới tạo.'
                        : col.id === 'in_progress'
                        ? 'Kéo thẻ từ Mới tạo vào đây khi bắt đầu làm.'
                        : 'Kéo thẻ đã xong vào đây để hoàn thành.'}
                    </p>
                    {col.id === 'todo' && !hasActiveFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingColumn('todo');
                          setDraftProjectId(db.projects[0]?.id ?? '');
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        <span>Tạo công việc đầu tiên</span>
                      </button>
                    )}
                  </div>
                ) : (
                  visibleTasks.map((task) => {
                    const fullIndex = allColumnTasks.findIndex((t) => t.id === task.id);
                    const isDragging = draggingTaskId === task.id;
                    const showInsertBefore =
                      dropTarget?.columnId === col.id &&
                      dropTarget.index === fullIndex &&
                      draggingTaskId !== task.id;
                    const isExpanded = Boolean(expandedCardIds[task.id]);
                    const project = projectMap.get(task.projectId);
                    const score = computeTaskPriorityScore(task);
                    const qMeta = getQuadrantMeta(getEisenhowerQuadrant(task));
                    const doneSubtasks = task.subtasks.filter((s) => s.done).length;
                    const isDone = col.id === 'done';

                    return (
                      <div key={task.id} className="space-y-1">
                        {showInsertBefore && (
                          <div className="h-1 rounded-full bg-blue-500 transition-all" aria-hidden="true" />
                        )}
                        <article
                          data-testid={`kanban-card-${task.id}`}
                          draggable
                          onDragStart={(e) => {
                            setDraggingTaskId(task.id);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', task.id);
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({ kind: 'kanban-task', id: task.id })
                            );
                          }}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDropTarget(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = 'move';
                            if (
                              !dropTarget ||
                              dropTarget.columnId !== col.id ||
                              dropTarget.index !== fullIndex
                            ) {
                              setDropTarget({ columnId: col.id, index: fullIndex });
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const draggedId = resolveDraggedTaskId(e);
                            if (draggedId) {
                              handleMoveTask(draggedId, col.id, fullIndex);
                            }
                            setDraggingTaskId(null);
                            setDropTarget(null);
                          }}
                          className={`group rounded-lg border bg-white dark:bg-[#111827] p-3 space-y-2.5 cursor-grab active:cursor-grabbing transition-all ${
                            isDragging
                              ? 'opacity-50 border-blue-500 ring-2 ring-blue-500/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600'
                          }`}
                        >
                          {/* Top Row: Grip + Title + Priority Score */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <GripVertical
                                className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCardIds((prev) => ({
                                    ...prev,
                                    [task.id]: !isExpanded,
                                  }))
                                }
                                className="text-left min-w-0 cursor-pointer"
                              >
                                <span
                                  className={`text-xs sm:text-[13px] font-medium leading-snug block ${
                                    isDone
                                      ? 'line-through text-slate-500 dark:text-slate-400'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </button>
                            </div>

                            <span
                              className="shrink-0 font-mono text-[11px] tabular-nums font-semibold text-blue-700 dark:text-blue-300"
                              title="Điểm ưu tiên tự động"
                            >
                              {score}đ
                            </span>
                          </div>

                          {/* Clean Unboxed Metadata Line (Zero-Pill Rule) */}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{project ? project.name : 'Độc lập'}</span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                qMeta.tone === 'crimson'
                                  ? 'text-red-600 dark:text-red-400 font-medium'
                                  : qMeta.tone === 'cobalt'
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : ''
                              }
                            >
                              {qMeta.short}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              DK {formatDurationVi(task.estimatedMinutes)}
                            </span>
                            {task.status === 'scheduled' && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-blue-600 dark:text-blue-400">Đã xếp lịch</span>
                              </>
                            )}
                            {task.subtasks.length > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums">
                                  {doneSubtasks}/{task.subtasks.length} việc nhỏ
                                </span>
                              </>
                            )}
                          </div>

                          {/* Expandable Subtasks Checklist */}
                          {isExpanded && (
                            <div className="pl-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                              {task.subtasks.map((sub) => (
                                <label
                                  key={sub.id}
                                  className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={sub.done}
                                    onChange={() => handleToggleSubtask(task.id, sub.id)}
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
                                  value={newSubtaskDrafts[task.id] || ''}
                                  onChange={(e) =>
                                    setNewSubtaskDrafts((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubtask(task.id);
                                    }
                                  }}
                                  placeholder="+ Thêm việc nhỏ (Enter)..."
                                  className="flex-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-[11px]"
                                />
                              </div>
                            </div>
                          )}

                          {/* Action Footer: Quick Transition Arrows + Subtask Toggle + Focus + Delete */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1">
                              {prevCol && (
                                <button
                                  type="button"
                                  aria-label={`Chuyển "${task.title}" về ${prevCol.title}`}
                                  data-testid={`kanban-move-prev-${task.id}`}
                                  onClick={() => handleMoveTask(task.id, prevCol.id)}
                                  className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                                  title={`Chuyển về ${prevCol.title}`}
                                >
                                  <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                                  <span>{prevCol.title}</span>
                                </button>
                              )}
                              {nextCol && (
                                <button
                                  type="button"
                                  aria-label={`Chuyển "${task.title}" sang ${nextCol.title}`}
                                  data-testid={`kanban-move-next-${task.id}`}
                                  onClick={() => handleMoveTask(task.id, nextCol.id)}
                                  className="inline-flex items-center gap-1 rounded border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 whitespace-nowrap cursor-pointer"
                                  title={`Chuyển sang ${nextCol.title}`}
                                >
                                  <span>{nextCol.title}</span>
                                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                aria-label={isExpanded ? 'Thu gọn việc nhỏ' : 'Mở rộng việc nhỏ'}
                                onClick={() =>
                                  setExpandedCardIds((prev) => ({
                                    ...prev,
                                    [task.id]: !isExpanded,
                                  }))
                                }
                                className={`rounded p-1 cursor-pointer ${
                                  isExpanded
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                                title="Checklist việc nhỏ"
                              >
                                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={task.isMit ? 'Bỏ đánh dấu MIT' : 'Đánh dấu MIT hôm nay'}
                                onClick={() => handleToggleMit(task.id)}
                                className={`rounded p-1 cursor-pointer ${
                                  task.isMit
                                    ? 'text-amber-500'
                                    : 'text-slate-400 hover:text-amber-500'
                                }`}
                                title="Đánh dấu Top MIT"
                              >
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              {!isDone && (
                                <button
                                  type="button"
                                  aria-label={`Tập trung làm "${task.title}"`}
                                  onClick={() => handleStartFocusFromCard(task)}
                                  className="rounded p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                  title="Bắt đầu Deep Work Studio"
                                >
                                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                              )}
                              <button
                                type="button"
                                aria-label={`Xóa "${task.title}"`}
                                onClick={() => handleDeleteTask(task.id)}
                                className="rounded p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                title="Xóa công việc"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </article>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
