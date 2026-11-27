import React, { useState } from 'react';
import {
  CalendarClock,
  Layers3,
  Flame,
  BarChart3,
  Users,
  SunMoon,
  Compass,
  Sun,
  Moon,
  HardDrive,
  Sparkles,
  Lock,
  Menu,
  X,
  UserPlus,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';
import type {
  ChronosDatabase,
  ChronosUserSummary,
  NavSection,
} from '../../utils/chronosTypes.ts';
import { formatMinToHHMM } from '../../utils/chronosEngine.ts';

interface ChronosSidebarProps {
  db: ChronosDatabase;
  userId: string;
  users: ChronosUserSummary[];
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  saveStatus: 'saved' | 'saving' | 'error';
  activeTimerSecondsLeft: number | null;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onOpenMorningBriefing: () => void;
  onOpenShutdown: () => void;
  onSwitchUser: (nextUserId: string) => void;
  onCreateNewUser: (userName: string, userRole: string) => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'planner', label: 'Lịch & Time-Blocking', icon: CalendarClock },
  { id: 'kanban', label: 'Bảng Kanban (Kéo thả)', icon: FolderKanban },
  { id: 'goals', label: 'Mục Tiêu & Công Việc', icon: Layers3 },
  { id: 'studio', label: 'Deep Work Studio', icon: Flame },
  { id: 'analytics', label: 'Phân Tích & Chấm Công', icon: BarChart3 },
  { id: 'team', label: 'Đội Nhóm & Lịch Họp', icon: Users },
  { id: 'rituals', label: 'Nghi Thức & Năng Lượng', icon: SunMoon },
  { id: 'roadmap', label: 'Lộ Trình & Gói Dịch Vụ', icon: Compass },
];

export const ChronosSidebar: React.FC<ChronosSidebarProps> = ({
  db,
  userId,
  users,
  activeSection,
  onSelectSection,
  isDark,
  onToggleTheme,
  saveStatus,
  activeTimerSecondsLeft,
  mobileOpen,
  onToggleMobile,
  onOpenMorningBriefing,
  onOpenShutdown,
  onSwitchUser,
  onCreateNewUser,
}) => {
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('');

  const inboxCount = db.tasks.filter((t) => t.status === 'inbox').length;
  const inProgressCount = db.tasks.filter((t) => t.status === 'in_progress').length;
  const savedTimeStr = db.lastSavedAt
    ? new Date(db.lastSavedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--';

  const handleSubmitNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newUserName.trim();
    if (!cleaned) return;
    onCreateNewUser(cleaned, newUserRole.trim() || 'Thành viên');
    setNewUserName('');
    setShowNewUserForm(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0D1424] border-r border-slate-200 dark:border-slate-800 px-3.5 py-4 overflow-y-auto">
      <div className="space-y-4">
        {/* Brand */}
        <div className="flex items-center justify-between px-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-mono text-sm font-semibold">
              CF
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                ChronosFlow
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Time &amp; Energy OS
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleMobile}
            className="lg:hidden rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Đóng thanh điều hướng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Isolated Per-User Workspace Switcher */}
        <div
          data-testid="chronos-user-switcher"
          className="rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/25 p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-blue-700 dark:text-blue-300 font-semibold">
                Hồ sơ riêng · {userId.slice(0, 14)}
              </div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {db.userName} ({db.userRole})
              </div>
            </div>
            <button
              type="button"
              data-testid="toggle-new-user-btn"
              onClick={() => setShowNewUserForm((v) => !v)}
              title="Tạo người dùng mới với dữ liệu hoàn toàn riêng biệt"
              className="p-1.5 rounded-md border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </button>
          </div>

          {users.length > 0 && (
            <select
              aria-label="Chuyển đổi hồ sơ người dùng ChronosFlow"
              data-testid="chronos-user-select"
              value={userId}
              onChange={(e) => onSwitchUser(e.target.value)}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200"
            >
              {!users.some((u) => u.userId === userId) && (
                <option value={userId}>
                  {db.userName} ({userId.slice(0, 10)})
                </option>
              )}
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.userName} — {u.userRole}
                </option>
              ))}
            </select>
          )}

          {showNewUserForm && (
            <form onSubmit={handleSubmitNewUser} className="space-y-1.5 pt-1 border-t border-blue-200/70 dark:border-blue-900/60">
              <input
                type="text"
                data-testid="new-user-name-input"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Tên người dùng mới..."
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
              <input
                type="text"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                placeholder="Vai trò (VD: Tech Lead)..."
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
              <button
                type="submit"
                data-testid="create-new-user-submit"
                className="w-full inline-flex items-center justify-center gap-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold py-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Tạo dữ liệu riêng mới</span>
              </button>
            </form>
          )}
        </div>

        {/* Navigation */}
        <nav className="space-y-1" aria-label="Điều hướng chính">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  if (mobileOpen) onToggleMobile();
                }}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'kanban' && inProgressCount > 0 && (
                  <span className="font-mono text-[11px] tabular-nums text-blue-600 dark:text-blue-400">
                    {inProgressCount}
                  </span>
                )}
                {item.id === 'goals' && inboxCount > 0 && (
                  <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                    {inboxCount}
                  </span>
                )}
                {item.id === 'studio' && activeTimerSecondsLeft !== null && (
                  <span className="font-mono text-[11px] tabular-nums text-emerald-600 dark:text-emerald-400">
                    {Math.floor(activeTimerSecondsLeft / 60)}:{String(activeTimerSecondsLeft % 60).padStart(2, '0')}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Energy Curve & Ritual Shortcuts */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>NHỊP SINH HỌC</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMinToHHMM(db.energyProfile.peakStartMin)}–{formatMinToHHMM(db.energyProfile.peakEndMin)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onOpenMorningBriefing}
              className="flex items-center justify-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span>3 MIT Sáng</span>
            </button>
            <button
              type="button"
              onClick={onOpenShutdown}
              className="flex items-center justify-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-blue-400 transition-colors"
            >
              <Lock className="h-3 w-3 text-indigo-500" />
              <span>Shutdown</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: RPG Progress, Local JSON DB Status, Theme */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 px-3 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Studio Lv.<span className="font-mono tabular-nums">{db.rpg.level}</span>
            </span>
            <span className="font-mono text-[11px] tabular-nums text-amber-600 dark:text-amber-400">
              {db.rpg.crystals} tinh thể
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Chuỗi: <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{db.rpg.streakDays} ngày</strong></span>
            <span>Freeze: <strong className="font-mono tabular-nums">{db.rpg.streakFreezeTokens}</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 min-w-0" title={`Lưu tách biệt tại data/users/${userId}.json`}>
            <HardDrive className={`h-3.5 w-3.5 shrink-0 ${saveStatus === 'error' ? 'text-red-500' : saveStatus === 'saving' ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span className="truncate font-mono tabular-nums">
              {saveStatus === 'saving' ? 'Đang ghi...' : saveStatus === 'error' ? 'Lỗi lưu JSON' : `${db.userName} · ${savedTimeStr}`}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-md border border-slate-200 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
            aria-label="Đổi chế độ Sáng/Tối"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Button */}
      <button
        type="button"
        onClick={onToggleMobile}
        className="lg:hidden fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 shadow-lg"
      >
        <Menu className="h-4 w-4" />
        <span>Menu</span>
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] h-full">{sidebarContent}</div>
          <div className="flex-1 bg-slate-950/50 backdrop-blur-xs" onClick={onToggleMobile} />
        </div>
      )}
    </>
  );
};
