export type NavSection =
  | 'planner'
  | 'kanban'
  | 'goals'
  | 'studio'
  | 'analytics'
  | 'team'
  | 'rituals'
  | 'roadmap';

export type KanbanColumnId = 'todo' | 'in_progress' | 'done';

export type CognitiveLoad = 'high' | 'medium' | 'low';
export type EisenhowerQuadrant = 'q1_do' | 'q2_plan' | 'q3_delegate' | 'q4_eliminate';
export type BlockFlexType = 'soft' | 'hard' | 'meeting' | 'external';
export type FocusPresetId = 'pomodoro' | 'deep50' | 'ultradian90';
export type SoundscapeId = 'none' | 'white' | 'brown' | 'rain' | 'binaural40';
export type CalendarProvider = 'google' | 'apple' | 'outlook' | 'chronos';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface OKR {
  id: string;
  title: string;
  quarter: string;
  owner: string;
  targetMetric: string;
  progressPct: number;
}

export interface Project {
  id: string;
  okrId: string;
  name: string;
  category: string;
  color: string;
}

export interface ChronosTask {
  id: string;
  projectId: string;
  title: string;
  notes?: string;
  urgent: boolean;
  important: boolean;
  cognitiveLoad: CognitiveLoad;
  estimatedMinutes: number;
  actualMinutes: number;
  deadlineTime?: string; // e.g. "2026-11-23T17:00" or "17:00" on target day
  deadlineDayOffset?: number; // 0 = today, 1 = tomorrow, etc.
  status: 'inbox' | 'scheduled' | 'in_progress' | 'done';
  boardOrder?: number;
  isMit?: boolean;
  assigneeId: string;
  subtasks: SubTask[];
  createdAt: string;
  completedAt?: string;
}

export interface TimeBlock {
  id: string;
  taskId?: string;
  title: string;
  dayOffset: number; // 0 = Mon/Today, 1 = +1 day ... 4 = +4 days (Mon-Fri 5-day view or relative 5 days)
  startMin: number; // Minutes from 00:00, e.g., 510 = 08:30
  durationMin: number;
  flexType: BlockFlexType;
  cognitiveLoad: CognitiveLoad;
  provider: CalendarProvider;
  accountEmail?: string;
  projectId?: string;
  hardDeadlineMin?: number; // Optional hard cutoff minute on that day
  completed?: boolean;
}

export interface ExternalCalendarAccount {
  id: string;
  provider: CalendarProvider;
  label: string;
  email: string;
  enabled: boolean;
  lastSyncedAt: string;
}

export interface EnergyProfile {
  chronotype: 'early_bird' | 'balanced' | 'night_owl';
  peakStartMin: number; // e.g., 510 (08:30)
  peakEndMin: number;   // e.g., 690 (11:30)
  troughStartMin: number; // e.g., 810 (13:30)
  troughEndMin: number;   // e.g., 930 (15:30)
  workdayStartMin: number; // 480 (08:00)
  workdayEndMin: number;   // 1080 (18:00)
  shutdownMin: number;     // 1080 (18:00)
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  peakStartMin: number;
  peakEndMin: number;
  troughStartMin: number;
  troughEndMin: number;
  dailyCapacityMin: number; // e.g., 480 (8h)
  /** Weekly dayOffset 0..4 busy blocks (startMin, durationMin, title) */
  busySlots: Array<{
    dayOffset: number;
    startMin: number;
    durationMin: number;
    title: string;
    isDeepWork?: boolean;
  }>;
}

export interface FocusSessionLog {
  id: string;
  taskId?: string;
  taskTitle: string;
  preset: FocusPresetId;
  plannedMinutes: number;
  actualMinutes: number;
  idleSubtractedMinutes: number;
  crystalsEarned: number;
  completedAt: string;
}

export interface FocusShieldConfig {
  enabled: boolean;
  blockedSites: string[];
  autoDndApps: {
    slack: boolean;
    teams: boolean;
    zalo: boolean;
  };
  activeDndMessage: string;
}

export interface RpgUpgradeLevels {
  desk: number;       // 1..3
  lamp: number;       // 1..3
  bookshelf: number;  // 1..3
  windowView: number; // 1..3
  bonsai: number;     // 1..3
}

export interface RpgState {
  level: number;
  xp: number;
  crystals: number;
  totalDeepMinutes: number;
  streakDays: number;
  streakFreezeTokens: number;
  streakFreezeActiveToday: boolean;
  upgrades: RpgUpgradeLevels;
}

export interface RitualState {
  morningBriefingCompletedDate: string | null;
  shutdownCompletedDate: string | null;
  isShutdownLocked: boolean;
  todayReflection: string;
  mitTaskIds: string[];
}

export interface ChronosDatabase {
  version: number;
  userId?: string;
  workspaceName: string;
  userName: string;
  userRole: string;
  baseDateISO: string; // Anchor date for dayOffset = 0 (YYYY-MM-DD)
  lastSavedAt: string;
  okrs: OKR[];
  projects: Project[];
  tasks: ChronosTask[];
  blocks: TimeBlock[];
  calendarAccounts: ExternalCalendarAccount[];
  energyProfile: EnergyProfile;
  teamMembers: TeamMember[];
  focusShield: FocusShieldConfig;
  focusLogs: FocusSessionLog[];
  rpg: RpgState;
  rituals: RitualState;
}

export interface ChronosUserSummary {
  userId: string;
  userName: string;
  userRole: string;
  workspaceName: string;
  lastSavedAt: string;
}

export interface RescheduleConflict {
  blockId: string;
  title: string;
  reason: string;
  proposedStartMin: number;
  hardDeadlineMin?: number;
}

export interface RescheduleChange {
  blockId: string;
  title: string;
  oldStartMin: number;
  newStartMin: number;
  reason: string;
}

export interface RescheduleResult {
  updatedBlocks: TimeBlock[];
  changes: RescheduleChange[];
  conflicts: RescheduleConflict[];
  summary: string;
}

export interface SmartMeetingSuggestion {
  dayOffset: number;
  startMin: number;
  endMin: number;
  score: number;
  inSharedTroughCount: number;
  totalAttendees: number;
  reason: string;
}
