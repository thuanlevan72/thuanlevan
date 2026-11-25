import type { ChronosDatabase } from './chronosTypes.ts';
import { getTodayISO } from './chronosEngine.ts';

export interface SeedUserOptions {
  userId?: string;
  userName?: string;
  userRole?: string;
  workspaceName?: string;
}

interface PersonaTemplate {
  userName: string;
  userRole: string;
  workspaceName: string;
  chronotype: 'early_bird' | 'balanced' | 'night_owl';
  peakStartMin: number;
  peakEndMin: number;
  troughStartMin: number;
  troughEndMin: number;
  okrTitle1: string;
  okrMetric1: string;
  okrTitle2: string;
  taskTitle1: string;
  taskTitle2: string;
  taskTitle3: string;
  inboxTask1: string;
  rpgLevel: number;
  rpgCrystals: number;
  rpgStreak: number;
}

const USER_PERSONA_TEMPLATES: PersonaTemplate[] = [
  {
    userName: 'Minh Anh',
    userRole: 'Product & Engineering Lead',
    workspaceName: 'ChronosFlow · Studio Sản Phẩm & Kỹ Thuật',
    chronotype: 'early_bird',
    peakStartMin: 8 * 60 + 30,
    peakEndMin: 11 * 60 + 30,
    troughStartMin: 13 * 60 + 30,
    troughEndMin: 15 * 60 + 30,
    okrTitle1: 'Ra mắt nền tảng đồng bộ lịch & AI Auto-Reschedule v2.0',
    okrMetric1: '99.5% lịch đồng bộ chính xác · Độ trễ < 120ms',
    okrTitle2: 'Nâng tỷ lệ Deep Work toàn đội từ 34% lên 55% mỗi tuần',
    taskTitle1: 'Thiết kế thuật toán dời khối mềm & bảo vệ Hard Deadline',
    taskTitle2: 'Rà soát webhook đồng bộ Google Calendar & Outlook hai chiều',
    taskTitle3: 'Phân bổ lại 2 đầu việc đang quá tải cho nhóm Backend',
    inboxTask1: 'Tối ưu bộ lọc ma trận Eisenhower & phím tắt Quick Capture',
    rpgLevel: 3,
    rpgCrystals: 145,
    rpgStreak: 6,
  },
  {
    userName: 'Khánh Linh',
    userRole: 'Growth & Data Strategist',
    workspaceName: 'ChronosFlow · Không Gian Chiến Lược & Dữ Liệu',
    chronotype: 'balanced',
    peakStartMin: 9 * 60 + 30,
    peakEndMin: 12 * 60,
    troughStartMin: 14 * 60,
    troughEndMin: 16 * 60,
    okrTitle1: 'Xây dựng phễu chuyển đổi tự động & phân tích Cohort Q4',
    okrMetric1: 'Tăng 28% giữ chân người dùng tuần 4',
    okrTitle2: 'Chuẩn hóa quy trình thử nghiệm A/B & báo cáo thời gian thực',
    taskTitle1: 'Phân tích hành vi người dùng theo nhịp sinh học buổi sáng',
    taskTitle2: 'Thiết lập dashboard đo ROI chiến dịch Product-Led Growth',
    taskTitle3: 'Điều phối sprint nội dung & nghiệm thu Landing Page mới',
    inboxTask1: 'Tổng hợp dữ liệu khảo sát khách hàng Enterprise tuần này',
    rpgLevel: 2,
    rpgCrystals: 95,
    rpgStreak: 4,
  },
  {
    userName: 'Hoàng Nam',
    userRole: 'Principal Full-stack Architect',
    workspaceName: 'ChronosFlow · Kiến Trúc Hệ Thống Phân Tán',
    chronotype: 'night_owl',
    peakStartMin: 10 * 60,
    peakEndMin: 12 * 60 + 30,
    troughStartMin: 14 * 60 + 30,
    troughEndMin: 16 * 60 + 30,
    okrTitle1: 'Giảm độ trễ truy vấn PostgreSQL & Redis xuống dưới 35ms',
    okrMetric1: 'P99 < 35ms dưới tải 15.000 req/s',
    okrTitle2: 'Tự động hóa CI/CD zero-downtime cho toàn bộ microservices',
    taskTitle1: 'Tối ưu hóa chiến lược sharding & connection pooling',
    taskTitle2: 'Kiểm tra chịu tải Distributed Lock trước đợt phát hành',
    taskTitle3: 'Rà soát kiến trúc Event Bus & dead-letter queue',
    inboxTask1: 'Viết RFC nâng cấp bảo mật OAuth2 PKCE cho cổng đối tác',
    rpgLevel: 4,
    rpgCrystals: 210,
    rpgStreak: 9,
  },
  {
    userName: 'Thùy Dương',
    userRole: 'Design Systems & UX Lead',
    workspaceName: 'ChronosFlow · Xưởng Thiết Kế Trải Nghiệm',
    chronotype: 'early_bird',
    peakStartMin: 8 * 60,
    peakEndMin: 11 * 60,
    troughStartMin: 13 * 60 + 30,
    troughEndMin: 15 * 60,
    okrTitle1: 'Hoàn thiện bộ Design Tokens Dark/Light chuẩn WCAG AA',
    okrMetric1: '100% component cốt lõi đạt chuẩn tương phản & bàn phím',
    okrTitle2: 'Rút ngắn thời gian bàn giao Figma sang mã nguồn xuống 40%',
    taskTitle1: 'Thiết kế luồng kéo-thả lịch tuần mượt ở 60fps',
    taskTitle2: 'Tinh chỉnh hệ thống typographic hierarchy & focus ring',
    taskTitle3: 'Họp review prototype cùng 5 người dùng thử nghiệm',
    inboxTask1: 'Chuẩn hóa icon & trạng thái trống cho chế độ Mobile',
    rpgLevel: 2,
    rpgCrystals: 120,
    rpgStreak: 5,
  },
];

function hashUserIdToIndex(userId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % USER_PERSONA_TEMPLATES.length;
}

export function createInitialChronosDatabase(options?: SeedUserOptions): ChronosDatabase {
  const todayISO = getTodayISO();
  const nowISO = new Date().toISOString();
  const resolvedUserId = options?.userId?.trim() || 'guest-default';
  const finalUserName = options?.userName?.trim() || 'Người dùng mới';
  const finalUserRole = options?.userRole?.trim() || 'Cá nhân';
  const finalWorkspace =
    options?.workspaceName?.trim() ||
    (options?.userName?.trim()
      ? `ChronosFlow · Không gian của ${options.userName.trim()}`
      : 'ChronosFlow · Không gian làm việc');

  return {
    version: 1,
    userId: resolvedUserId,
    workspaceName: finalWorkspace,
    userName: finalUserName,
    userRole: finalUserRole,
    baseDateISO: todayISO,
    lastSavedAt: nowISO,
    okrs: [],
    projects: [],
    tasks: [],
    blocks: [],
    calendarAccounts: [],
    energyProfile: {
      chronotype: 'balanced',
      peakStartMin: 8 * 60 + 30,
      peakEndMin: 11 * 60 + 30,
      troughStartMin: 13 * 60 + 30,
      troughEndMin: 15 * 60 + 30,
      workdayStartMin: 8 * 60,
      workdayEndMin: 18 * 60,
      shutdownMin: 18 * 60,
    },
    teamMembers: [],
    focusShield: {
      enabled: false,
      blockedSites: [],
      autoDndApps: {
        slack: false,
        teams: false,
        zalo: false,
      },
      activeDndMessage: 'Đang tập trung sâu — Không làm phiền',
    },
    focusLogs: [],
    rpg: {
      level: 1,
      xp: 0,
      crystals: 0,
      totalDeepMinutes: 0,
      streakDays: 0,
      streakFreezeTokens: 0,
      streakFreezeActiveToday: false,
      upgrades: {
        desk: 1,
        lamp: 1,
        bookshelf: 1,
        windowView: 1,
        bonsai: 1,
      },
    },
    rituals: {
      morningBriefingCompletedDate: null,
      shutdownCompletedDate: null,
      isShutdownLocked: false,
      todayReflection: '',
      mitTaskIds: [],
    },
  };
}

/**
 * Fixture exclusively for unit-testing chronosEngine scheduling & analytics algorithms.
 * Never used to seed production workspaces.
 */
export function createChronosTestFixture(options?: SeedUserOptions): ChronosDatabase {
  const todayISO = getTodayISO();
  const nowISO = new Date().toISOString();
  const resolvedUserId = options?.userId?.trim() || 'guest-default';
  const personaIdx =
    resolvedUserId === 'guest-default' ? 0 : hashUserIdToIndex(resolvedUserId);
  const tpl = USER_PERSONA_TEMPLATES[personaIdx];
  const finalUserName = options?.userName?.trim() || tpl.userName;
  const finalUserRole = options?.userRole?.trim() || tpl.userRole;
  const finalWorkspace =
    options?.workspaceName?.trim() ||
    (options?.userName?.trim()
      ? `ChronosFlow · Không gian của ${options.userName.trim()}`
      : tpl.workspaceName);

  return {
    version: 1,
    userId: resolvedUserId,
    workspaceName: finalWorkspace,
    userName: finalUserName,
    userRole: finalUserRole,
    baseDateISO: todayISO,
    lastSavedAt: nowISO,
    okrs: [
      {
        id: 'okr-1',
        title: tpl.okrTitle1,
        quarter: 'Q4 / 2026',
        owner: finalUserName,
        targetMetric: tpl.okrMetric1,
        progressPct: 62 + personaIdx * 6,
      },
      {
        id: 'okr-2',
        title: tpl.okrTitle2,
        quarter: 'Q4 / 2026',
        owner: finalUserName,
        targetMetric: 'Giảm 30% họp hành cắt ngang giờ đỉnh cao sáng',
        progressPct: 50 + personaIdx * 7,
      },
      {
        id: 'okr-3',
        title: 'Chuẩn hóa báo cáo hiệu suất & quy trình bàn giao tự động',
        quarter: 'Q4 / 2026',
        owner: 'Thanh Thảo',
        targetMetric: '100% dự án đo sai số ước lượng < 15%',
        progressPct: 72,
      },
    ],
    projects: [
      {
        id: 'prj-core',
        okrId: 'okr-1',
        name: 'Kiến trúc Time-Blocking & Engine',
        category: 'Phát triển lõi',
        color: '#2563EB',
      },
      {
        id: 'prj-sync',
        okrId: 'okr-1',
        name: 'Multi-Calendar Sync Hub',
        category: 'Tích hợp hệ thống',
        color: '#059669',
      },
      {
        id: 'prj-team',
        okrId: 'okr-2',
        name: 'Cân bằng tải & Deep Work Đội ngũ',
        category: 'Vận hành & Chiến lược',
        color: '#D97706',
      },
      {
        id: 'prj-ops',
        okrId: 'okr-3',
        name: 'Báo cáo & Kiểm thử Định kỳ',
        category: 'Báo cáo & QA',
        color: '#7C3AED',
      },
    ],
    tasks: [
      {
        id: 'tsk-1',
        projectId: 'prj-core',
        title: tpl.taskTitle1,
        notes: 'Ưu tiên đặt vào khung đỉnh cao trí tuệ buổi sáng.',
        urgent: true,
        important: true,
        cognitiveLoad: 'high',
        estimatedMinutes: 90,
        actualMinutes: 105,
        deadlineDayOffset: 0,
        deadlineTime: '17:00',
        status: 'scheduled',
        isMit: true,
        assigneeId: 'mem-1',
        createdAt: nowISO,
        subtasks: [
          { id: 'sub-1a', title: 'Xác định danh sách Hard-block & cuộc họp cố định', done: true },
          { id: 'sub-1b', title: 'Viết hàm tìm khe trống quanh vùng trũng năng lượng', done: true },
          { id: 'sub-1c', title: 'Kiểm thử kịch bản cuộc họp kéo dài +20 phút', done: false },
        ],
      },
      {
        id: 'tsk-2',
        projectId: 'prj-sync',
        title: tpl.taskTitle2,
        notes: 'Đảm bảo tránh lặp sự kiện khi đổi múi giờ GMT+7.',
        urgent: false,
        important: true,
        cognitiveLoad: 'high',
        estimatedMinutes: 60,
        actualMinutes: 75,
        deadlineDayOffset: 0,
        deadlineTime: '16:30',
        status: 'scheduled',
        isMit: true,
        assigneeId: 'mem-1',
        createdAt: nowISO,
        subtasks: [
          { id: 'sub-2a', title: 'Đối chiếu payload ICS với múi giờ châu Á', done: true },
          { id: 'sub-2b', title: 'Xử lý xung đột ETag khi cập nhật song song', done: false },
        ],
      },
      {
        id: 'tsk-3',
        projectId: 'prj-team',
        title: tpl.taskTitle3,
        urgent: true,
        important: true,
        cognitiveLoad: 'medium',
        estimatedMinutes: 45,
        actualMinutes: 0,
        deadlineDayOffset: 0,
        deadlineTime: '16:00',
        status: 'scheduled',
        isMit: true,
        assigneeId: 'mem-2',
        createdAt: nowISO,
        subtasks: [
          { id: 'sub-3a', title: 'Kiểm tra biểu đồ tải nhân sự tuần này', done: true },
          { id: 'sub-3b', title: 'Chuyển task audit API sang Đức Huy', done: false },
        ],
      },
      {
        id: 'tsk-4',
        projectId: 'prj-ops',
        title: 'Xử lý hộp thư đối tác & duyệt đề xuất nghỉ phép tuần',
        urgent: false,
        important: false,
        cognitiveLoad: 'low',
        estimatedMinutes: 30,
        actualMinutes: 25,
        status: 'scheduled',
        assigneeId: 'mem-1',
        createdAt: nowISO,
        subtasks: [],
      },
      {
        id: 'tsk-5',
        projectId: 'prj-core',
        title: tpl.inboxTask1,
        urgent: false,
        important: true,
        cognitiveLoad: 'high',
        estimatedMinutes: 60,
        actualMinutes: 0,
        status: 'inbox',
        assigneeId: 'mem-1',
        createdAt: nowISO,
        subtasks: [
          { id: 'sub-5a', title: 'Hỗ trợ cú pháp nhập nhanh #30p !khan', done: false },
          { id: 'sub-5b', title: 'Bổ sung nhận diện giọng nói tiếng Việt', done: false },
        ],
      },
      {
        id: 'tsk-6',
        projectId: 'prj-ops',
        title: 'Tổng hợp báo cáo sai số ước lượng tuần trước cho Ban giám đốc',
        urgent: true,
        important: false,
        cognitiveLoad: 'low',
        estimatedMinutes: 45,
        actualMinutes: 65,
        deadlineDayOffset: 1,
        deadlineTime: '15:00',
        status: 'inbox',
        assigneeId: 'mem-3',
        createdAt: nowISO,
        subtasks: [],
      },
      {
        id: 'tsk-7',
        projectId: 'prj-sync',
        title: 'Viết tài liệu hướng dẫn nhập file .ics từ Apple Calendar',
        urgent: false,
        important: true,
        cognitiveLoad: 'medium',
        estimatedMinutes: 45,
        actualMinutes: 40,
        status: 'inbox',
        assigneeId: 'mem-4',
        createdAt: nowISO,
        subtasks: [],
      },
      {
        id: 'tsk-8',
        projectId: 'prj-core',
        title: 'Kiểm tra hồi quy hiệu năng render lịch tuần 60fps',
        urgent: false,
        important: true,
        cognitiveLoad: 'high',
        estimatedMinutes: 60,
        actualMinutes: 85,
        status: 'done',
        assigneeId: 'mem-2',
        createdAt: nowISO,
        completedAt: nowISO,
        subtasks: [
          { id: 'sub-8a', title: 'Đo thời gian kéo-thả 40 time-block liên tục', done: true },
        ],
      },
      {
        id: 'tsk-9',
        projectId: 'prj-team',
        title: 'Thiết lập khung giờ "Không họp buổi sáng" toàn công ty',
        urgent: false,
        important: true,
        cognitiveLoad: 'medium',
        estimatedMinutes: 30,
        actualMinutes: 30,
        status: 'done',
        assigneeId: 'mem-1',
        createdAt: nowISO,
        completedAt: nowISO,
        subtasks: [],
      },
      {
        id: 'tsk-10',
        projectId: 'prj-ops',
        title: 'Debug lỗi lưu phiên tập trung khi chuyển tab trình duyệt',
        urgent: true,
        important: true,
        cognitiveLoad: 'high',
        estimatedMinutes: 45,
        actualMinutes: 72,
        status: 'done',
        assigneeId: 'mem-2',
        createdAt: nowISO,
        completedAt: nowISO,
        subtasks: [],
      },
    ],
    blocks: [
      {
        id: 'blk-1',
        taskId: 'tsk-1',
        title: 'Thiết kế thuật toán dời khối mềm & bảo vệ Hard Deadline',
        dayOffset: 0,
        startMin: 8 * 60 + 30, // 08:30
        durationMin: 90,
        flexType: 'soft',
        cognitiveLoad: 'high',
        provider: 'chronos',
        projectId: 'prj-core',
        hardDeadlineMin: 17 * 60,
      },
      {
        id: 'blk-2',
        title: 'Daily Standup Kỹ thuật & Sản phẩm',
        dayOffset: 0,
        startMin: 10 * 60 + 15, // 10:15
        durationMin: 30,
        flexType: 'meeting',
        cognitiveLoad: 'low',
        provider: 'google',
        accountEmail: 'minhanh@chronos.vn',
      },
      {
        id: 'blk-3',
        taskId: 'tsk-2',
        title: 'Rà soát webhook đồng bộ Google Calendar & Outlook',
        dayOffset: 0,
        startMin: 11 * 60, // 11:00
        durationMin: 60,
        flexType: 'soft',
        cognitiveLoad: 'high',
        provider: 'chronos',
        projectId: 'prj-sync',
        hardDeadlineMin: 16 * 60 + 30,
      },
      {
        id: 'blk-4',
        taskId: 'tsk-4',
        title: 'Xử lý hộp thư đối tác & duyệt đề xuất',
        dayOffset: 0,
        startMin: 13 * 60 + 30, // 13:30 (Trough!)
        durationMin: 30,
        flexType: 'soft',
        cognitiveLoad: 'low',
        provider: 'chronos',
        projectId: 'prj-ops',
      },
      {
        id: 'blk-5',
        title: 'Họp đồng bộ Khách hàng Enterprise (Outlook)',
        dayOffset: 0,
        startMin: 14 * 60 + 15, // 14:15
        durationMin: 45,
        flexType: 'external',
        cognitiveLoad: 'low',
        provider: 'outlook',
        accountEmail: 'anh.le@partner.com',
      },
      {
        id: 'blk-6',
        taskId: 'tsk-3',
        title: 'Phân bổ lại 2 đầu việc quá tải nhóm Backend',
        dayOffset: 0,
        startMin: 15 * 60 + 15, // 15:15
        durationMin: 45,
        flexType: 'hard',
        cognitiveLoad: 'medium',
        provider: 'chronos',
        projectId: 'prj-team',
        hardDeadlineMin: 16 * 60 + 30,
      },
      {
        id: 'blk-7',
        title: 'Lịch cá nhân: Kiểm tra sức khỏe định kỳ (Apple)',
        dayOffset: 0,
        startMin: 17 * 60, // 17:00
        durationMin: 45,
        flexType: 'external',
        cognitiveLoad: 'low',
        provider: 'apple',
        accountEmail: 'minhanh@icloud.com',
      },
      {
        id: 'blk-8',
        taskId: 'tsk-5',
        title: 'Deep Work: Kiến trúc phân tích Quick Capture',
        dayOffset: 1,
        startMin: 8 * 60 + 30,
        durationMin: 90,
        flexType: 'soft',
        cognitiveLoad: 'high',
        provider: 'chronos',
        projectId: 'prj-core',
      },
      {
        id: 'blk-9',
        title: 'Sprint Review Tuần 47',
        dayOffset: 1,
        startMin: 14 * 60,
        durationMin: 60,
        flexType: 'meeting',
        cognitiveLoad: 'medium',
        provider: 'google',
        accountEmail: 'minhanh@chronos.vn',
      },
      {
        id: 'blk-10',
        title: 'Thiết kế hệ thống Telemetry & Cảnh báo Deadline',
        dayOffset: 2,
        startMin: 9 * 60,
        durationMin: 120,
        flexType: 'soft',
        cognitiveLoad: 'high',
        provider: 'chronos',
        projectId: 'prj-core',
      },
      {
        id: 'blk-11',
        title: '1-on-1 Coaching Đội ngũ',
        dayOffset: 3,
        startMin: 14 * 60,
        durationMin: 60,
        flexType: 'meeting',
        cognitiveLoad: 'low',
        provider: 'google',
        accountEmail: 'minhanh@chronos.vn',
      },
    ],
    calendarAccounts: [
      {
        id: 'cal-google',
        provider: 'google',
        label: 'Google Workspace (Công việc)',
        email: 'minhanh@chronos.vn',
        enabled: true,
        lastSyncedAt: nowISO,
      },
      {
        id: 'cal-outlook',
        provider: 'outlook',
        label: 'Microsoft Outlook (Khách hàng)',
        email: 'anh.le@partner.com',
        enabled: true,
        lastSyncedAt: nowISO,
      },
      {
        id: 'cal-apple',
        provider: 'apple',
        label: 'Apple iCloud (Cá nhân)',
        email: 'minhanh@icloud.com',
        enabled: true,
        lastSyncedAt: nowISO,
      },
    ],
    energyProfile: {
      chronotype: tpl.chronotype,
      peakStartMin: tpl.peakStartMin,
      peakEndMin: tpl.peakEndMin,
      troughStartMin: tpl.troughStartMin,
      troughEndMin: tpl.troughEndMin,
      workdayStartMin: 8 * 60,
      workdayEndMin: 18 * 60,
      shutdownMin: 18 * 60,
    },
    teamMembers: [
      {
        id: 'mem-1',
        name: finalUserName,
        role: finalUserRole,
        avatarInitials: finalUserName
          .split(/\s+/)
          .filter(Boolean)
          .slice(-2)
          .map((w) => w[0]?.toUpperCase() ?? '')
          .join('') || 'CF',
        peakStartMin: tpl.peakStartMin,
        peakEndMin: tpl.peakEndMin,
        troughStartMin: tpl.troughStartMin,
        troughEndMin: tpl.troughEndMin,
        dailyCapacityMin: 480,
        busySlots: [
          { dayOffset: 0, startMin: 510, durationMin: 90, title: tpl.taskTitle1, isDeepWork: true },
          { dayOffset: 0, startMin: 615, durationMin: 30, title: 'Daily Standup' },
          { dayOffset: 0, startMin: 660, durationMin: 60, title: tpl.taskTitle2, isDeepWork: true },
          { dayOffset: 0, startMin: 855, durationMin: 45, title: 'Enterprise Sync' },
          { dayOffset: 0, startMin: 915, durationMin: 45, title: tpl.taskTitle3 },
          { dayOffset: 1, startMin: 510, durationMin: 120, title: 'Architecture Spec', isDeepWork: true },
          { dayOffset: 1, startMin: 840, durationMin: 60, title: 'Sprint Review' },
          { dayOffset: 2, startMin: 540, durationMin: 150, title: 'Deep Work Core', isDeepWork: true },
          { dayOffset: 3, startMin: 540, durationMin: 90, title: 'Roadmap Q1', isDeepWork: true },
          { dayOffset: 4, startMin: 540, durationMin: 120, title: 'Code Review', isDeepWork: true },
        ],
      },
      {
        id: 'mem-2',
        name: 'Minh Khoa',
        role: 'Senior Backend Engineer',
        avatarInitials: 'MK',
        peakStartMin: 8 * 60 + 30,
        peakEndMin: 11 * 60 + 30,
        troughStartMin: 13 * 60 + 30,
        troughEndMin: 15 * 60 + 30,
        dailyCapacityMin: 480,
        busySlots: [
          { dayOffset: 0, startMin: 480, durationMin: 150, title: 'DB Migration Cluster', isDeepWork: true },
          { dayOffset: 0, startMin: 645, durationMin: 90, title: 'OAuth Token Queue', isDeepWork: true },
          { dayOffset: 0, startMin: 780, durationMin: 120, title: 'Hotfix Latency Spike', isDeepWork: true },
          { dayOffset: 0, startMin: 915, durationMin: 90, title: 'Security Audit Prep' },
          { dayOffset: 1, startMin: 480, durationMin: 180, title: 'API Gateway V2', isDeepWork: true },
          { dayOffset: 1, startMin: 780, durationMin: 180, title: 'Load Testing 10k RPS' },
          { dayOffset: 2, startMin: 510, durationMin: 210, title: 'Distributed Lock Fix', isDeepWork: true },
          { dayOffset: 3, startMin: 510, durationMin: 180, title: 'Webhook Retry Service', isDeepWork: true },
          { dayOffset: 4, startMin: 540, durationMin: 150, title: 'Release Check' },
        ],
      },
      {
        id: 'mem-3',
        name: 'Thanh Thảo',
        role: 'Product Designer',
        avatarInitials: 'TT',
        peakStartMin: 9 * 60,
        peakEndMin: 12 * 60,
        troughStartMin: 14 * 60,
        troughEndMin: 16 * 60,
        dailyCapacityMin: 480,
        busySlots: [
          { dayOffset: 0, startMin: 540, durationMin: 120, title: 'Design System Audit', isDeepWork: true },
          { dayOffset: 0, startMin: 810, durationMin: 30, title: 'UX Copy Review' },
          { dayOffset: 1, startMin: 540, durationMin: 120, title: 'Timeline Prototype', isDeepWork: true },
          { dayOffset: 2, startMin: 600, durationMin: 90, title: 'Usability Interview' },
          { dayOffset: 3, startMin: 540, durationMin: 120, title: 'Mobile Responsive Kit', isDeepWork: true },
          { dayOffset: 4, startMin: 600, durationMin: 90, title: 'Design Critique' },
        ],
      },
      {
        id: 'mem-4',
        name: 'Đức Huy',
        role: 'Full-stack Engineer',
        avatarInitials: 'ĐH',
        peakStartMin: 8 * 60 + 30,
        peakEndMin: 11 * 60 + 30,
        troughStartMin: 13 * 60 + 30,
        troughEndMin: 15 * 60 + 30,
        dailyCapacityMin: 480,
        busySlots: [
          { dayOffset: 0, startMin: 510, durationMin: 90, title: 'Audio WebAPI Synth', isDeepWork: true },
          { dayOffset: 0, startMin: 615, durationMin: 30, title: 'Daily Standup' },
          { dayOffset: 0, startMin: 930, durationMin: 45, title: 'Unit Test Coverage' },
          { dayOffset: 1, startMin: 540, durationMin: 90, title: 'Drag-Drop Interaction', isDeepWork: true },
          { dayOffset: 2, startMin: 540, durationMin: 120, title: 'CSV Export Pipeline' },
          { dayOffset: 3, startMin: 570, durationMin: 90, title: 'E2E Verification' },
          { dayOffset: 4, startMin: 600, durationMin: 60, title: 'Docs Cleanup' },
        ],
      },
    ],
    focusShield: {
      enabled: true,
      blockedSites: ['facebook.com', 'youtube.com', 'tiktok.com', 'shopee.vn', 'reddit.com'],
      autoDndApps: {
        slack: true,
        teams: true,
        zalo: true,
      },
      activeDndMessage: 'Đang tập trung sâu — Không làm phiền (ChronosFlow)',
    },
    focusLogs: [
      {
        id: 'log-1',
        taskId: 'tsk-8',
        taskTitle: 'Kiểm tra hồi quy hiệu năng render lịch tuần 60fps',
        preset: 'deep50',
        plannedMinutes: 50,
        actualMinutes: 50,
        idleSubtractedMinutes: 0,
        crystalsEarned: 30,
        completedAt: nowISO,
      },
      {
        id: 'log-2',
        taskId: 'tsk-10',
        taskTitle: 'Debug lỗi lưu phiên tập trung khi chuyển tab trình duyệt',
        preset: 'ultradian90',
        plannedMinutes: 90,
        actualMinutes: 72,
        idleSubtractedMinutes: 18,
        crystalsEarned: 43,
        completedAt: nowISO,
      },
    ],
    rpg: {
      level: tpl.rpgLevel,
      xp: 320 + personaIdx * 90,
      crystals: tpl.rpgCrystals,
      totalDeepMinutes: 260 + personaIdx * 85,
      streakDays: tpl.rpgStreak,
      streakFreezeTokens: 2,
      streakFreezeActiveToday: false,
      upgrades: {
        desk: 1 + (personaIdx % 2),
        lamp: 1,
        bookshelf: 1,
        windowView: 1 + ((personaIdx + 1) % 2),
        bonsai: 1,
      },
    },
    rituals: {
      morningBriefingCompletedDate: null,
      shutdownCompletedDate: null,
      isShutdownLocked: false,
      todayReflection: '',
      mitTaskIds: ['tsk-1', 'tsk-2', 'tsk-3'],
    },
  };
}
