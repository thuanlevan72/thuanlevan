import type {
  ChronosDatabase,
  ChronosTask,
  CognitiveLoad,
  EisenhowerQuadrant,
  EnergyProfile,
  FocusPresetId,
  OKR,
  Project,
  RescheduleChange,
  RescheduleConflict,
  RescheduleResult,
  RpgState,
  RpgUpgradeLevels,
  SmartMeetingSuggestion,
  TeamMember,
  TimeBlock,
} from './chronosTypes.ts';

export const FOCUS_PRESETS: Record<
  FocusPresetId,
  { id: FocusPresetId; label: string; focusMin: number; breakMin: number; subtitle: string }
> = {
  pomodoro: {
    id: 'pomodoro',
    label: 'Pomodoro Cổ điển',
    focusMin: 25,
    breakMin: 5,
    subtitle: '25p tập trung / 5p nghỉ — Khởi động nhanh, giảm trì hoãn',
  },
  deep50: {
    id: 'deep50',
    label: 'Deep Focus 50/10',
    focusMin: 50,
    breakMin: 10,
    subtitle: '50p tập trung / 10p nghỉ — Cân bằng phân tích & lập trình',
  },
  ultradian90: {
    id: 'ultradian90',
    label: 'Ultradian Rhythm',
    focusMin: 90,
    breakMin: 20,
    subtitle: '90p tập trung / 20p phục hồi — Chu kỳ sinh học sâu tối đa',
  },
};

export const RPG_UPGRADE_COSTS: Record<keyof RpgUpgradeLevels, { label: string; costs: [number, number] }> = {
  desk: { label: 'Bàn làm việc gỗ sồi', costs: [40, 90] },
  lamp: { label: 'Đèn kiến trúc ánh sáng ấm', costs: [35, 80] },
  bookshelf: { label: 'Tủ sách & Tri thức', costs: [45, 95] },
  windowView: { label: 'Cửa sổ tầm nhìn núi cao', costs: [55, 110] },
  bonsai: { label: 'Cây Bonsai & Trà đạo', costs: [30, 70] },
};

export function formatMinToHHMM(totalMin: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(totalMin)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatDurationVi(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}g` : `${h}g ${rem}p`;
}

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysToISO(baseISO: string, offset: number): string {
  const parts = baseISO.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return baseISO;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAY_NAMES_VI = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function formatDayHeader(baseISO: string, dayOffset: number): { weekday: string; dateStr: string } {
  const iso = addDaysToISO(baseISO, dayOffset);
  const parts = iso.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return {
    weekday: dayOffset === 0 ? 'Hôm nay' : dayOffset === 1 ? 'Ngày mai' : WEEKDAY_NAMES_VI[d.getDay()],
    dateStr: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
  };
}

export function getEisenhowerQuadrant(task: Pick<ChronosTask, 'urgent' | 'important'>): EisenhowerQuadrant {
  if (task.urgent && task.important) return 'q1_do';
  if (!task.urgent && task.important) return 'q2_plan';
  if (task.urgent && !task.important) return 'q3_delegate';
  return 'q4_eliminate';
}

export function getQuadrantMeta(q: EisenhowerQuadrant): { label: string; short: string; tone: string } {
  switch (q) {
    case 'q1_do':
      return { label: 'Q1 · Làm ngay (Khẩn & Quan trọng)', short: 'Q1 · Làm ngay', tone: 'crimson' };
    case 'q2_plan':
      return { label: 'Q2 · Lên lịch sâu (Quan trọng)', short: 'Q2 · Chiến lược', tone: 'cobalt' };
    case 'q3_delegate':
      return { label: 'Q3 · Ủy quyền / Gộp xử lý', short: 'Q3 · Ủy quyền', tone: 'amber' };
    case 'q4_eliminate':
      return { label: 'Q4 · Hạn chế / Cắt giảm', short: 'Q4 · Nhẹ nhàng', tone: 'slate' };
  }
}

export function computeTaskPriorityScore(task: ChronosTask): number {
  let score = 20;
  if (task.important) score += 38;
  if (task.urgent) score += 26;
  if (task.isMit) score += 12;

  if (task.cognitiveLoad === 'high') score += 8;
  else if (task.cognitiveLoad === 'medium') score += 4;

  // Shorter crisp tasks under 45m get slight momentum boost if Q1, deep tasks > 60m valued in Q2
  if (task.estimatedMinutes >= 60 && task.important) score += 4;
  if (task.deadlineDayOffset === 0) score += 6;

  return Math.max(1, Math.min(100, score));
}

export function parseQuickCaptureInput(rawText: string): {
  title: string;
  estimatedMinutes: number;
  urgent: boolean;
  important: boolean;
  cognitiveLoad: CognitiveLoad;
} {
  let text = rawText.trim();
  let estimatedMinutes = 45;
  let urgent = false;
  let important = true;
  let cognitiveLoad: CognitiveLoad = 'medium';

  const durationMatch = text.match(/(?:#|@)(\d{1,3})\s*(p|m|phut|min)?\b/i);
  if (durationMatch) {
    const parsed = Number(durationMatch[1]);
    if (parsed >= 5 && parsed <= 360) {
      estimatedMinutes = parsed;
    }
    text = text.replace(durationMatch[0], ' ').trim();
  }

  if (/!(khan|urgent|gap)\b/i.test(text)) {
    urgent = true;
    text = text.replace(/!(khan|urgent|gap)\b/gi, ' ').trim();
  }

  if (/@(cao|deep|high)\b/i.test(text)) {
    cognitiveLoad = 'high';
    text = text.replace(/@(cao|deep|high)\b/gi, ' ').trim();
  } else if (/@(thap|nhe|low|shallow)\b/i.test(text)) {
    cognitiveLoad = 'low';
    important = false;
    text = text.replace(/@(thap|nhe|low|shallow)\b/gi, ' ').trim();
  }

  const cleanTitle = text.replace(/\s{2,}/g, ' ').trim() || rawText.trim();
  return { title: cleanTitle, estimatedMinutes, urgent, important, cognitiveLoad };
}

function intervalsOverlap(startA: number, durA: number, startB: number, durB: number): boolean {
  return startA < startB + durB && startB < startA + durA;
}

function findNextFreeSlot(
  occupied: Array<{ startMin: number; durationMin: number }>,
  earliestStartMin: number,
  durationMin: number,
  workdayEndMin: number,
  preferredZone?: { startMin: number; endMin: number }
): number {
  const step = 15;
  const maxScan = Math.max(workdayEndMin + 120, 22 * 60);

  // First try preferred biological energy window if provided
  if (preferredZone) {
    const zoneStart = Math.max(earliestStartMin, preferredZone.startMin);
    for (let t = zoneStart; t + durationMin <= preferredZone.endMin; t += step) {
      const collides = occupied.some((occ) => intervalsOverlap(t, durationMin, occ.startMin, occ.durationMin));
      if (!collides) return t;
    }
  }

  for (let t = earliestStartMin; t <= maxScan; t += step) {
    const collides = occupied.some((occ) => intervalsOverlap(t, durationMin, occ.startMin, occ.durationMin));
    if (!collides) return t;
  }

  return earliestStartMin;
}

/**
 * Core Constraint-Based Auto-Rescheduler:
 * Keeps Hard-blocks, Meetings, and External Calendar events anchored.
 * Automatically reflows overlapping or displaced Soft-blocks around anchors,
 * optimizes by energy curve when requested, and flags Hard Deadline collisions.
 */
export function runAutoReschedule(
  blocks: TimeBlock[],
  dayOffset: number,
  energyProfile: EnergyProfile,
  options?: {
    optimizeEnergy?: boolean;
    pushFromMin?: number;
  }
): RescheduleResult {
  const optimizeEnergy = options?.optimizeEnergy ?? false;
  const pushFromMin = options?.pushFromMin ?? energyProfile.workdayStartMin;

  const otherDays = blocks.filter((b) => b.dayOffset !== dayOffset);
  const dayBlocks = blocks
    .filter((b) => b.dayOffset === dayOffset)
    .map((b) => ({ ...b }));

  const anchored = dayBlocks.filter((b) => b.flexType !== 'soft');
  const softBlocks = dayBlocks.filter((b) => b.flexType === 'soft');

  // Sort soft blocks: if optimizing by energy, high cognitive load comes earlier; otherwise keep chronological order
  softBlocks.sort((a, b) => {
    if (optimizeEnergy) {
      const weight = { high: 3, medium: 2, low: 1 };
      if (weight[b.cognitiveLoad] !== weight[a.cognitiveLoad]) {
        return weight[b.cognitiveLoad] - weight[a.cognitiveLoad];
      }
    }
    return a.startMin - b.startMin;
  });

  const occupied: Array<{ startMin: number; durationMin: number }> = anchored.map((a) => ({
    startMin: a.startMin,
    durationMin: a.durationMin,
  }));

  const changes: RescheduleChange[] = [];
  const conflicts: RescheduleConflict[] = [];
  const placedSoft: TimeBlock[] = [];

  for (const sb of softBlocks) {
    // Keep soft blocks that finished strictly before pushFromMin unless optimizing whole day
    if (!optimizeEnergy && sb.startMin + sb.durationMin <= pushFromMin) {
      const collidesWithAnchor = occupied.some((occ) =>
        intervalsOverlap(sb.startMin, sb.durationMin, occ.startMin, occ.durationMin)
      );
      if (!collidesWithAnchor) {
        occupied.push({ startMin: sb.startMin, durationMin: sb.durationMin });
        placedSoft.push(sb);
        continue;
      }
    }

    const earliest = optimizeEnergy
      ? Math.max(energyProfile.workdayStartMin, pushFromMin)
      : Math.max(sb.startMin, pushFromMin);

    let preferredZone: { startMin: number; endMin: number } | undefined;
    if (optimizeEnergy) {
      if (sb.cognitiveLoad === 'high') {
        preferredZone = { startMin: energyProfile.peakStartMin, endMin: energyProfile.peakEndMin };
      } else if (sb.cognitiveLoad === 'low') {
        preferredZone = { startMin: energyProfile.troughStartMin, endMin: energyProfile.troughEndMin };
      }
    }

    const chosenStart = findNextFreeSlot(
      occupied,
      earliest,
      sb.durationMin,
      energyProfile.workdayEndMin,
      preferredZone
    );

    const moved = chosenStart !== sb.startMin;
    if (moved) {
      let reason = 'Tự động dời khỏi vùng xung đột';
      if (optimizeEnergy && sb.cognitiveLoad === 'high' && chosenStart >= energyProfile.peakStartMin && chosenStart + sb.durationMin <= energyProfile.peakEndMin) {
        reason = 'Đưa vào khung đỉnh cao trí tuệ';
      } else if (optimizeEnergy && sb.cognitiveLoad === 'low' && chosenStart >= energyProfile.troughStartMin && chosenStart + sb.durationMin <= energyProfile.troughEndMin) {
        reason = 'Gom vào vùng trũng năng lượng buổi chiều';
      }
      changes.push({
        blockId: sb.id,
        title: sb.title,
        oldStartMin: sb.startMin,
        newStartMin: chosenStart,
        reason,
      });
    }

    const endMin = chosenStart + sb.durationMin;
    if (sb.hardDeadlineMin !== undefined && endMin > sb.hardDeadlineMin) {
      conflicts.push({
        blockId: sb.id,
        title: sb.title,
        proposedStartMin: chosenStart,
        hardDeadlineMin: sb.hardDeadlineMin,
        reason: `Vượt mốc deadline cứng ${formatMinToHHMM(sb.hardDeadlineMin)} (kết thúc dự kiến ${formatMinToHHMM(endMin)})`,
      });
    } else if (endMin > energyProfile.shutdownMin) {
      conflicts.push({
        blockId: sb.id,
        title: sb.title,
        proposedStartMin: chosenStart,
        hardDeadlineMin: energyProfile.shutdownMin,
        reason: `Chạm ngưỡng Shutdown ${formatMinToHHMM(energyProfile.shutdownMin)} — cân nhắc dời sang ngày mai`,
      });
    }

    const updatedBlock: TimeBlock = { ...sb, startMin: chosenStart };
    occupied.push({ startMin: chosenStart, durationMin: sb.durationMin });
    placedSoft.push(updatedBlock);
  }

  const recombined = [...otherDays, ...anchored, ...placedSoft].sort((a, b) =>
    a.dayOffset !== b.dayOffset ? a.dayOffset - b.dayOffset : a.startMin - b.startMin
  );

  const summary =
    changes.length === 0
      ? 'Lịch trình đã cân bằng, không phát hiện xung đột cần dịch chuyển.'
      : `Đã tự động điều phối ${changes.length} khối linh hoạt${conflicts.length > 0 ? ` (${conflicts.length} cảnh báo deadline cứng)` : ' · An toàn tuyệt đối với mốc cứng'}.`;

  return {
    updatedBlocks: recombined,
    changes,
    conflicts,
    summary,
  };
}

/**
 * Simulates a meeting running late by +extraMinutes and runs Auto-Reschedule.
 */
export function simulateMeetingOverrun(
  blocks: TimeBlock[],
  dayOffset: number,
  energyProfile: EnergyProfile,
  extraMinutes = 20,
  targetBlockId?: string
): RescheduleResult {
  const dayMeetings = blocks
    .filter((b) => b.dayOffset === dayOffset && (b.flexType === 'meeting' || b.flexType === 'hard'))
    .sort((a, b) => a.startMin - b.startMin);

  const chosen = targetBlockId
    ? blocks.find((b) => b.id === targetBlockId)
    : dayMeetings[0] ?? blocks.find((b) => b.dayOffset === dayOffset);

  if (!chosen) {
    return runAutoReschedule(blocks, dayOffset, energyProfile);
  }

  const extended = blocks.map((b) =>
    b.id === chosen.id ? { ...b, durationMin: b.durationMin + extraMinutes } : b
  );

  const result = runAutoReschedule(extended, dayOffset, energyProfile, {
    optimizeEnergy: false,
    pushFromMin: chosen.startMin,
  });

  return {
    ...result,
    summary: `"${chosen.title}" kéo dài +${extraMinutes}p → ${result.summary}`,
  };
}

/**
 * Inserts an urgent hard interruption into the day and pushes soft blocks cleanly.
 */
export function insertUrgentInterruption(
  blocks: TimeBlock[],
  dayOffset: number,
  energyProfile: EnergyProfile,
  title: string,
  startMin: number,
  durationMin: number
): RescheduleResult {
  const newUrgent: TimeBlock = {
    id: `blk-urgent-${Date.now()}`,
    title: title.trim() || 'Sự cố khẩn cấp xen ngang',
    dayOffset,
    startMin,
    durationMin,
    flexType: 'hard',
    cognitiveLoad: 'high',
    provider: 'chronos',
  };

  const withUrgent = [...blocks, newUrgent];
  const result = runAutoReschedule(withUrgent, dayOffset, energyProfile, {
    optimizeEnergy: false,
    pushFromMin: startMin,
  });

  return {
    ...result,
    summary: `Chèn việc khẩn "${newUrgent.title}" (${formatMinToHHMM(startMin)}) → ${result.summary}`,
  };
}

export interface ProjectAccuracyStat {
  projectId: string;
  projectName: string;
  category: string;
  estimatedMinutes: number;
  actualMinutes: number;
  variancePct: number; // positive means took longer than estimated
}

export function computeEstimationAccuracy(
  tasks: ChronosTask[],
  projects: Project[]
): ProjectAccuracyStat[] {
  const byProject = new Map<string, { est: number; act: number }>();

  for (const t of tasks) {
    if (t.actualMinutes <= 0 && t.status !== 'done') continue;
    const prev = byProject.get(t.projectId) ?? { est: 0, act: 0 };
    byProject.set(t.projectId, {
      est: prev.est + t.estimatedMinutes,
      act: prev.act + (t.actualMinutes > 0 ? t.actualMinutes : t.estimatedMinutes),
    });
  }

  return projects
    .map((p) => {
      const agg = byProject.get(p.id);
      if (!agg || agg.est === 0) return null;
      const variancePct = Math.round(((agg.act - agg.est) / agg.est) * 100);
      return {
        projectId: p.id,
        projectName: p.name,
        category: p.category,
        estimatedMinutes: agg.est,
        actualMinutes: agg.act,
        variancePct,
      };
    })
    .filter((item): item is ProjectAccuracyStat => item !== null);
}

export function computeDeepVsShallowStats(blocks: TimeBlock[]): {
  deepMinutes: number;
  shallowMinutes: number;
  meetingMinutes: number;
  deepRatioPct: number;
} {
  let deepMinutes = 0;
  let shallowMinutes = 0;
  let meetingMinutes = 0;

  for (const b of blocks) {
    if (b.flexType === 'meeting' || b.flexType === 'external') {
      meetingMinutes += b.durationMin;
    } else if (b.cognitiveLoad === 'high' || (b.cognitiveLoad === 'medium' && b.durationMin >= 45)) {
      deepMinutes += b.durationMin;
    } else {
      shallowMinutes += b.durationMin;
    }
  }

  const total = deepMinutes + shallowMinutes + meetingMinutes;
  const deepRatioPct = total > 0 ? Math.round((deepMinutes / total) * 100) : 0;

  return { deepMinutes, shallowMinutes, meetingMinutes, deepRatioPct };
}

export function computeOkrComputedProgress(
  okr: OKR,
  projects: Project[],
  tasks: ChronosTask[]
): number {
  const projectIds = new Set(projects.filter((p) => p.okrId === okr.id).map((p) => p.id));
  const related = tasks.filter((t) => projectIds.has(t.projectId));
  if (related.length === 0) return okr.progressPct;
  const doneWeight = related.reduce((sum, t) => {
    if (t.status === 'done') return sum + 1;
    if (t.subtasks.length > 0) {
      const completedSubs = t.subtasks.filter((s) => s.done).length;
      return sum + (completedSubs / t.subtasks.length) * 0.8;
    }
    if (t.status === 'in_progress') return sum + 0.45;
    if (t.status === 'scheduled') return sum + 0.15;
    return sum;
  }, 0);
  return Math.round((doneWeight / related.length) * 100);
}

export function computeMemberLoadPct(member: TeamMember, dayOffset: number): number {
  const totalMin = member.busySlots
    .filter((s) => s.dayOffset === dayOffset)
    .reduce((acc, s) => acc + s.durationMin, 0);
  if (member.dailyCapacityMin <= 0) return 0;
  return Math.round((totalMin / member.dailyCapacityMin) * 100);
}

export function computeMemberWeeklyLoadPct(member: TeamMember): number {
  const totalMin = member.busySlots.reduce((acc, s) => acc + s.durationMin, 0);
  const weeklyCap = member.dailyCapacityMin * 5;
  return weeklyCap > 0 ? Math.round((totalMin / weeklyCap) * 100) : 0;
}

/**
 * Smart Meeting Finder:
 * Finds free slots for all chosen team members on dayOffset,
 * prioritizing afternoon low-energy troughs to protect morning Peak Deep Work.
 */
export function findSmartMeetingSlots(
  members: TeamMember[],
  selectedIds: string[],
  dayOffset: number,
  durationMin = 45
): SmartMeetingSuggestion[] {
  const attendees = members.filter((m) => selectedIds.includes(m.id));
  if (attendees.length === 0) return [];

  const suggestions: SmartMeetingSuggestion[] = [];
  for (let startMin = 8 * 60; startMin + durationMin <= 17 * 60 + 30; startMin += 30) {
    const endMin = startMin + durationMin;

    // Skip standard lunch window 12:00-13:00
    if (intervalsOverlap(startMin, durationMin, 12 * 60, 60)) continue;

    const hasConflict = attendees.some((member) =>
      member.busySlots.some(
        (slot) =>
          slot.dayOffset === dayOffset &&
          intervalsOverlap(startMin, durationMin, slot.startMin, slot.durationMin)
      )
    );
    if (hasConflict) continue;

    let inSharedTroughCount = 0;
    let cutsPeakCount = 0;
    for (const member of attendees) {
      if (startMin >= member.troughStartMin && endMin <= member.troughEndMin + 60) {
        inSharedTroughCount += 1;
      }
      if (intervalsOverlap(startMin, durationMin, member.peakStartMin, member.peakEndMin - member.peakStartMin)) {
        cutsPeakCount += 1;
      }
    }

    let score = 60 + inSharedTroughCount * 14 - cutsPeakCount * 22;
    if (startMin >= 13 * 60 + 30 && endMin <= 16 * 60 + 30) score += 12;
    score = Math.max(10, Math.min(100, score));

    let reason = 'Khung giờ trống cho cả nhóm';
    if (cutsPeakCount === 0 && inSharedTroughCount === attendees.length) {
      reason = 'Tối ưu nhất: Trũng năng lượng chung, bảo toàn 100% Deep Work buổi sáng';
    } else if (cutsPeakCount === 0) {
      reason = 'An toàn: Không cắt vào giờ đỉnh cao trí tuệ của thành viên';
    } else {
      reason = `Cảnh báo: Chạm giờ tập trung sâu của ${cutsPeakCount} thành viên`;
    }

    suggestions.push({
      dayOffset,
      startMin,
      endMin,
      score,
      inSharedTroughCount,
      totalAttendees: attendees.length,
      reason,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function applyFocusSessionToRpg(rpg: RpgState, focusMinutes: number): RpgState {
  const safeMin = Math.max(1, Math.round(focusMinutes));
  const crystalsEarned = Math.max(5, Math.round(safeMin * 0.6));
  const xpEarned = safeMin * 2;
  const newXp = rpg.xp + xpEarned;
  const newLevel = 1 + Math.floor(newXp / 180);

  return {
    ...rpg,
    xp: newXp,
    level: Math.max(rpg.level, newLevel),
    crystals: rpg.crystals + crystalsEarned,
    totalDeepMinutes: rpg.totalDeepMinutes + safeMin,
  };
}

export function upgradeRpgItem(rpg: RpgState, key: keyof RpgUpgradeLevels): RpgState {
  const currentLvl = rpg.upgrades[key];
  if (currentLvl >= 3) return rpg;
  const cost = RPG_UPGRADE_COSTS[key].costs[currentLvl - 1];
  if (rpg.crystals < cost) return rpg;

  return {
    ...rpg,
    crystals: rpg.crystals - cost,
    upgrades: {
      ...rpg.upgrades,
      [key]: currentLvl + 1,
    },
  };
}

export function activateStreakFreeze(rpg: RpgState): RpgState {
  if (rpg.streakFreezeActiveToday || rpg.streakFreezeTokens <= 0) return rpg;
  return {
    ...rpg,
    streakFreezeTokens: rpg.streakFreezeTokens - 1,
    streakFreezeActiveToday: true,
  };
}

export function rollOverUnfinishedBlocksToTomorrow(db: ChronosDatabase, reflection: string): ChronosDatabase {
  const todayISO = getTodayISO();
  const nextBlocks = db.blocks.map((b) => {
    if (b.dayOffset === 0 && b.flexType === 'soft' && !b.completed) {
      return { ...b, dayOffset: 1 };
    }
    return b;
  });

  const completedToday = db.blocks.filter((b) => b.dayOffset === 0 && b.completed).length;

  return {
    ...db,
    blocks: nextBlocks,
    rpg: {
      ...db.rpg,
      streakDays: completedToday > 0 || db.rpg.streakFreezeActiveToday ? db.rpg.streakDays + 1 : db.rpg.streakDays,
    },
    rituals: {
      ...db.rituals,
      shutdownCompletedDate: todayISO,
      isShutdownLocked: true,
      todayReflection: reflection,
    },
  };
}

export function generateIcsFromBlocks(db: ChronosDatabase): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronosFlow//Time-Energy OS//VI',
    'CALSCALE:GREGORIAN',
  ];

  for (const b of db.blocks) {
    const dateISO = addDaysToISO(db.baseDateISO, b.dayOffset).replace(/-/g, '');
    const startH = String(Math.floor(b.startMin / 60)).padStart(2, '0');
    const startM = String(b.startMin % 60).padStart(2, '0');
    const endTotal = b.startMin + b.durationMin;
    const endH = String(Math.floor(endTotal / 60)).padStart(2, '0');
    const endM = String(endTotal % 60).padStart(2, '0');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${b.id}@chronosflow.local`);
    lines.push(`DTSTART:${dateISO}T${startH}${startM}00`);
    lines.push(`DTEND:${dateISO}T${endH}${endM}00`);
    lines.push(`SUMMARY:${b.title.replace(/[\r\n]/g, ' ')}`);
    lines.push(`CATEGORIES:${b.flexType.toUpperCase()}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function parseIcsEvents(icsText: string, baseDateISO: string): TimeBlock[] {
  const events: TimeBlock[] = [];
  const chunks = icsText.split(/BEGIN:VEVENT/i).slice(1);
  const baseDate = new Date(baseDateISO + 'T00:00:00');

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const summaryMatch = chunk.match(/SUMMARY[^:]*:([^\r\n]+)/i);
    const startMatch = chunk.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/i);
    const endMatch = chunk.match(/DTEND[^:]*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/i);
    if (!summaryMatch || !startMatch) continue;

    const evDate = new Date(`${startMatch[1]}-${startMatch[2]}-${startMatch[3]}T00:00:00`);
    const dayOffset = Math.round((evDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const clampedDay = dayOffset >= 0 && dayOffset <= 4 ? dayOffset : 0;

    const startMin = Number(startMatch[4]) * 60 + Number(startMatch[5]);
    let durationMin = 45;
    if (endMatch) {
      const endMin = Number(endMatch[4]) * 60 + Number(endMatch[5]);
      if (endMin > startMin) durationMin = Math.min(240, endMin - startMin);
    }

    events.push({
      id: `blk-ics-${Date.now()}-${i}`,
      title: summaryMatch[1].trim(),
      dayOffset: clampedDay,
      startMin,
      durationMin,
      flexType: 'external',
      cognitiveLoad: 'low',
      provider: 'google',
      accountEmail: 'Imported (.ics)',
    });
  }

  return events;
}
