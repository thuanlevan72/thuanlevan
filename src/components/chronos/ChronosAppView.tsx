import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Lock, Plus, Sparkles, Unlock, Wand2 } from 'lucide-react';
import type {
  ChronosDatabase,
  ChronosTask,
  ChronosUserSummary,
  FocusPresetId,
  NavSection,
} from '../../utils/chronosTypes.ts';
import {
  FOCUS_PRESETS,
  applyFocusSessionToRpg,
  runAutoReschedule,
} from '../../utils/chronosEngine.ts';
import { createInitialChronosDatabase } from '../../utils/chronosSeed.ts';
import { chronosAudio } from '../../utils/chronosAudio.ts';
import { ChronosSidebar } from './ChronosSidebar.tsx';
import { QuickCapturePalette } from './QuickCapturePalette.tsx';
import { ChronosGuideModal } from './ChronosGuideModal.tsx';
import { PlannerTimelineView } from './PlannerTimelineView.tsx';
import { GoalsTasksView } from './GoalsTasksView.tsx';
import { DeepWorkStudioView } from './DeepWorkStudioView.tsx';
import { AnalyticsTeamView } from './AnalyticsTeamView.tsx';
import { RitualsRoadmapView } from './RitualsRoadmapView.tsx';

interface ChronosAppViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const USER_ID_STORAGE_KEY = 'chronosflow-user-id-v1';

function getOrCreateBrowserUserId(): string {
  try {
    const existing = localStorage.getItem(USER_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9_-]{3,48}$/.test(existing)) {
      return existing;
    }
    const fresh = `usr-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
    localStorage.setItem(USER_ID_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return `usr-${Math.random().toString(36).slice(2, 8)}`;
  }
}

const SECTION_TITLES: Record<NavSection, { title: string; subtitle: string }> = {
  planner: {
    title: 'Lịch & Smart Time-Blocking',
    subtitle: 'Kéo-thả công việc vào khung giờ sinh học và tự động tái cấu trúc khi có biến cố',
  },
  goals: {
    title: 'Mục Tiêu OKRs & Công Việc 4 Tầng',
    subtitle: 'Phân rã từ Mục tiêu quý đến Việc nhỏ kèm chấm điểm Eisenhower tự động',
  },
  studio: {
    title: 'Deep Work Studio & Focus RPG',
    subtitle: 'Chu kỳ tập trung sâu, Focus Shield, âm thanh WebAudio & góc làm việc kiến tạo',
  },
  analytics: {
    title: 'Đo Lường Thời Gian & Hiệu Suất',
    subtitle: 'Phân tích sai số ước lượng, tỷ lệ Deep Work / Shallow Work và xuất Timesheet CSV',
  },
  team: {
    title: 'Cộng Tác Đội Nhóm & Lịch Họp Thông Minh',
    subtitle: 'Theo dõi tải nhân sự >85% và tìm khung họp vào trũng năng lượng buổi chiều',
  },
  rituals: {
    title: 'Nghi Thức Ngày & Nhịp Năng Lượng',
    subtitle: 'Chọn Top 3 MIT buổi sáng, tinh chỉnh đường cong sinh học và khóa ngày Shutdown',
  },
  roadmap: {
    title: 'Lộ Trình, Gói Dịch Vụ & Dữ Liệu JSON Riêng',
    subtitle: 'Mỗi người dùng được tách biệt hoàn toàn một tệp dữ liệu riêng dưới data/users/',
  },
};

export const ChronosAppView: React.FC<ChronosAppViewProps> = ({ theme, onToggleTheme }) => {
  const [userId, setUserId] = useState<string>(() => getOrCreateBrowserUserId());
  const [usersList, setUsersList] = useState<ChronosUserSummary[]>([]);
  const [db, setDb] = useState<ChronosDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [activeSection, setActiveSection] = useState<NavSection>('planner');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // Focus Timer shared state across views
  const [activePreset, setActivePreset] = useState<FocusPresetId>('deep50');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_PRESETS.deep50.focusMin * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusTaskId, setFocusTaskId] = useState<string | undefined>(undefined);

  const persistTimerRef = useRef<number | null>(null);
  const latestDbRef = useRef<ChronosDatabase | null>(null);
  const activeUserIdRef = useRef<string>(userId);
  activeUserIdRef.current = userId;

  const refreshUsersList = useCallback(async () => {
    try {
      const resp = await fetch('/api/users');
      if (!resp.ok) return;
      const data = (await resp.json()) as { users?: ChronosUserSummary[] };
      if (Array.isArray(data.users)) {
        setUsersList(data.users);
      }
    } catch {
      // Ignore user list fetch errors in offline fallback
    }
  }, []);

  const persistToDisk = useCallback(
    async (nextDb: ChronosDatabase, targetUserId?: string) => {
      const ownerId = targetUserId ?? nextDb.userId ?? activeUserIdRef.current;
      setSaveStatus('saving');
      try {
        const resp = await fetch(`/api/db?userId=${encodeURIComponent(ownerId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-chronos-user': ownerId,
          },
          body: JSON.stringify({ ...nextDb, userId: ownerId }),
        });
        if (!resp.ok) throw new Error('Persist failed');
        const data = (await resp.json()) as { db: ChronosDatabase };
        if (data?.db && ownerId === activeUserIdRef.current) {
          setDb((curr) =>
            curr ? { ...curr, lastSavedAt: data.db.lastSavedAt } : data.db
          );
        }
        setSaveStatus('saved');
        void refreshUsersList();
      } catch {
        setSaveStatus('error');
      }
    },
    [refreshUsersList]
  );

  const loadUserWorkspace = useCallback(
    async (
      targetUserId: string,
      hints?: { userName?: string; userRole?: string }
    ) => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ userId: targetUserId });
        if (hints?.userName) params.set('userName', hints.userName);
        if (hints?.userRole) params.set('userRole', hints.userRole);
        const resp = await fetch(`/api/db?${params.toString()}`, {
          headers: { 'x-chronos-user': targetUserId },
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = (await resp.json()) as { db: ChronosDatabase };
        if (data.db) {
          setDb(data.db);
          latestDbRef.current = data.db;
          setLoadError(null);
        }
        await refreshUsersList();
      } catch {
        setLoadError(
          'Không kết nối được máy chủ JSON cục bộ (/api/db). Đang hiển thị không gian làm việc trắng cục bộ tạm thời.'
        );
        const fallback = createInitialChronosDatabase({
          userId: targetUserId,
          userName: hints?.userName,
          userRole: hints?.userRole,
        });
        setDb(fallback);
        latestDbRef.current = fallback;
      } finally {
        setLoading(false);
      }
    },
    [refreshUsersList]
  );

  useEffect(() => {
    void loadUserWorkspace(userId);
    return () => {
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
      chronosAudio.stop();
    };
    // Initial boot load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDb = useCallback(
    (updater: (prev: ChronosDatabase) => ChronosDatabase) => {
      setDb((prev) => {
        if (!prev) return prev;
        const ownerId = prev.userId ?? activeUserIdRef.current;
        const next = { ...updater(prev), userId: ownerId };
        latestDbRef.current = next;
        if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = window.setTimeout(() => {
          if (latestDbRef.current) {
            void persistToDisk(latestDbRef.current, ownerId);
          }
        }, 180);
        return next;
      });
    },
    [persistToDisk]
  );

  const handleSwitchUser = useCallback(
    async (nextUserId: string) => {
      if (!nextUserId || nextUserId === activeUserIdRef.current) return;
      if (persistTimerRef.current && latestDbRef.current) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        await persistToDisk(latestDbRef.current, activeUserIdRef.current);
      }
      setTimerRunning(false);
      setUserId(nextUserId);
      activeUserIdRef.current = nextUserId;
      try {
        localStorage.setItem(USER_ID_STORAGE_KEY, nextUserId);
      } catch {
        // Ignore storage error
      }
      await loadUserWorkspace(nextUserId);
    },
    [loadUserWorkspace, persistToDisk]
  );

  const handleCreateNewUser = useCallback(
    async (userName: string, userRole: string) => {
      if (persistTimerRef.current && latestDbRef.current) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
        await persistToDisk(latestDbRef.current, activeUserIdRef.current);
      }
      const slug = userName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 18);
      const nextUserId = `usr-${slug || 'user'}-${Date.now().toString(36).slice(-4)}`;
      setTimerRunning(false);
      setUserId(nextUserId);
      activeUserIdRef.current = nextUserId;
      try {
        localStorage.setItem(USER_ID_STORAGE_KEY, nextUserId);
      } catch {
        // Ignore storage error
      }
      await loadUserWorkspace(nextUserId, { userName, userRole });
    },
    [loadUserWorkspace, persistToDisk]
  );

  // Global Quick Capture shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickCaptureOpen((v) => !v);
      } else if (e.key === 'Escape' && quickCaptureOpen) {
        setQuickCaptureOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quickCaptureOpen]);

  const handleCompleteFocusSession = useCallback(
    (actualMinutes: number, idleSubtracted: number) => {
      setTimerRunning(false);
      const presetMin = FOCUS_PRESETS[activePreset].focusMin;
      setSecondsLeft(presetMin * 60);

      updateDb((prev) => {
        const matchedTask = prev.tasks.find((t) => t.id === focusTaskId);
        const crystals = Math.max(5, Math.round(actualMinutes * 0.6));
        return {
          ...prev,
          rpg: applyFocusSessionToRpg(prev.rpg, actualMinutes),
          tasks: prev.tasks.map((t) =>
            t.id === focusTaskId ? { ...t, actualMinutes: t.actualMinutes + actualMinutes } : t
          ),
          focusLogs: [
            {
              id: `log-${Date.now()}`,
              taskId: matchedTask?.id,
              taskTitle: matchedTask?.title ?? 'Phiên tập trung sâu',
              preset: activePreset,
              plannedMinutes: presetMin,
              actualMinutes,
              idleSubtractedMinutes: idleSubtracted,
              crystalsEarned: crystals,
              completedAt: new Date().toISOString(),
            },
            ...prev.focusLogs,
          ],
        };
      });
    },
    [activePreset, focusTaskId, updateDb]
  );

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          chronosAudio.playChime();
          handleCompleteFocusSession(FOCUS_PRESETS[activePreset].focusMin, 0);
          return FOCUS_PRESETS[activePreset].focusMin * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, activePreset, handleCompleteFocusSession]);

  const handleStartFocusTask = (taskId?: string, _customTitle?: string, suggestedMinutes?: number) => {
    setFocusTaskId(taskId);
    let nextPreset: FocusPresetId = 'deep50';
    if (suggestedMinutes && suggestedMinutes <= 30) nextPreset = 'pomodoro';
    else if (suggestedMinutes && suggestedMinutes >= 85) nextPreset = 'ultradian90';
    setActivePreset(nextPreset);
    setSecondsLeft(FOCUS_PRESETS[nextPreset].focusMin * 60);
    setTimerRunning(true);
    setActiveSection('studio');
  };

  const handleCreateTask = (task: ChronosTask, autoSchedule: boolean) => {
    updateDb((prev) => {
      const nextTasks = [task, ...prev.tasks];
      if (!autoSchedule) {
        return { ...prev, tasks: nextTasks };
      }
      const preferredStart =
        task.cognitiveLoad === 'high'
          ? prev.energyProfile.peakStartMin
          : task.cognitiveLoad === 'low'
          ? prev.energyProfile.troughStartMin
          : prev.energyProfile.workdayStartMin;
      const draftBlock = {
        id: `blk-${Date.now()}`,
        taskId: task.id,
        title: task.title,
        dayOffset: 0,
        startMin: preferredStart,
        durationMin: task.estimatedMinutes,
        flexType: 'soft' as const,
        cognitiveLoad: task.cognitiveLoad,
        provider: 'chronos' as const,
        projectId: task.projectId,
      };
      const res = runAutoReschedule([...prev.blocks, draftBlock], 0, prev.energyProfile, {
        optimizeEnergy: true,
      });
      return {
        ...prev,
        tasks: nextTasks,
        blocks: res.updatedBlocks,
      };
    });
  };

  const handleResetSampleDb = async () => {
    const ownerId = activeUserIdRef.current;
    try {
      const resp = await fetch(`/api/db/reset?userId=${encodeURIComponent(ownerId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chronos-user': ownerId,
        },
        body: JSON.stringify({
          userId: ownerId,
          userName: db?.userName,
          userRole: db?.userRole,
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { db: ChronosDatabase };
        setDb(data.db);
        latestDbRef.current = data.db;
        setSaveStatus('saved');
        void refreshUsersList();
        return;
      }
    } catch {
      // Fallback below
    }
    const fresh = createInitialChronosDatabase({
      userId: ownerId,
      userName: db?.userName,
      userRole: db?.userRole,
    });
    updateDb(() => fresh);
  };

  if (loading || !db) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-sm text-slate-500">
        Đang tải dữ liệu ChronosFlow riêng cho người dùng...
      </div>
    );
  }

  const headerMeta = SECTION_TITLES[activeSection];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex bg-[#F8FAFC] dark:bg-[#090E1A] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <ChronosSidebar
        db={db}
        userId={userId}
        users={usersList}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isDark={theme === 'dark'}
        onToggleTheme={onToggleTheme}
        saveStatus={saveStatus}
        activeTimerSecondsLeft={timerRunning ? secondsLeft : null}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((v) => !v)}
        onOpenMorningBriefing={() => setActiveSection('rituals')}
        onOpenShutdown={() => setActiveSection('rituals')}
        onSwitchUser={(nextId) => void handleSwitchUser(nextId)}
        onCreateNewUser={(name, role) => void handleCreateNewUser(name, role)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual Workspace Header (Clean 3-zone) */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1424] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-sans text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {headerMeta.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{headerMeta.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="chronos-guide-btn"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100/80 dark:hover:bg-blue-950/70 cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Sách hướng dẫn</span>
            </button>
            <button
              type="button"
              data-testid="chronos-quick-capture-btn"
              onClick={() => setQuickCaptureOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nhập nhanh</span>
              <span className="font-mono text-[10px] text-slate-400">⌘K</span>
            </button>
            <button
              type="button"
              onClick={() => {
                updateDb((prev) => ({
                  ...prev,
                  blocks: runAutoReschedule(prev.blocks, 0, prev.energyProfile, {
                    optimizeEnergy: true,
                  }).updatedBlocks,
                }));
                setActiveSection('planner');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Cân bằng lịch ngay</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto">
          {loadError && (
            <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-300">
              {loadError}
            </div>
          )}

          {/* Shutdown Lock Notice */}
          {db.rituals.isShutdownLocked && (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-indigo-950 dark:text-indigo-200">
                <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                <div>
                  <strong>Không gian làm việc đang ở chế độ Nghỉ ngơi (Shutdown).</strong> Các khối việc mềm còn dang dở đã được chuyển sang ngày mai để tránh kiệt sức.
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateDb((prev) => ({
                    ...prev,
                    rituals: { ...prev.rituals, isShutdownLocked: false },
                  }))
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Mở khóa lại</span>
              </button>
            </div>
          )}

          {/* MIT Strip when on Planner */}
          {activeSection === 'planner' && db.tasks.some((t) => t.isMit && t.status !== 'done') && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Top MIT hôm nay:</span>
                </span>
                {db.tasks
                  .filter((t) => t.isMit && t.status !== 'done')
                  .slice(0, 3)
                  .map((t) => (
                    <span
                      key={t.id}
                      className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 text-[11px] font-medium"
                    >
                      {t.title}
                    </span>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('rituals')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Điều chỉnh MIT
              </button>
            </div>
          )}

          {activeSection === 'planner' && (
            <PlannerTimelineView
              db={db}
              userId={userId}
              onUpdateDb={updateDb}
              onStartFocusTask={handleStartFocusTask}
              onOpenQuickCapture={() => setQuickCaptureOpen(true)}
              onOpenGuide={() => setGuideOpen(true)}
            />
          )}

          {activeSection === 'goals' && (
            <GoalsTasksView
              db={db}
              onUpdateDb={updateDb}
              onStartFocusTask={handleStartFocusTask}
            />
          )}

          {activeSection === 'studio' && (
            <DeepWorkStudioView
              db={db}
              onUpdateDb={updateDb}
              selectedTaskId={focusTaskId}
              timerRunning={timerRunning}
              secondsLeft={secondsLeft}
              activePreset={activePreset}
              onChangePreset={(preset) => {
                setTimerRunning(false);
                setActivePreset(preset);
                setSecondsLeft(FOCUS_PRESETS[preset].focusMin * 60);
              }}
              onToggleRunning={() => setTimerRunning((r) => !r)}
              onResetTimer={() => {
                setTimerRunning(false);
                setSecondsLeft(FOCUS_PRESETS[activePreset].focusMin * 60);
              }}
              onSelectTask={setFocusTaskId}
              onCompleteSession={handleCompleteFocusSession}
            />
          )}

          {(activeSection === 'analytics' || activeSection === 'team') && (
            <AnalyticsTeamView db={db} userId={userId} mode={activeSection} onUpdateDb={updateDb} />
          )}

          {(activeSection === 'rituals' || activeSection === 'roadmap') && (
            <RitualsRoadmapView
              db={db}
              userId={userId}
              mode={activeSection}
              onUpdateDb={updateDb}
              onResetSampleDb={handleResetSampleDb}
            />
          )}
        </div>
      </div>

      <QuickCapturePalette
        open={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
        projects={db.projects}
        defaultAssigneeId={db.teamMembers[0]?.id ?? ''}
        onCreateTask={handleCreateTask}
      />

      <ChronosGuideModal
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        onNavigateSection={setActiveSection}
        onOpenQuickCapture={() => setQuickCaptureOpen(true)}
      />
    </div>
  );
};
