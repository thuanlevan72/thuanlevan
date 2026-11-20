export type CockpitModuleId =
  | 'switches'
  | 'red_button'
  | 'rotary_dial'
  | 'wave_fader'
  | 'patch_bay'
  | 'hazard_hold';

export type CockpitMode = 'endless_survival' | 'rush_15s' | 'blitz_60s';

export type CockpitDifficulty = 'easy' | 'normal' | 'hard' | 'chaos';

export type PilotRank = 'S+' | 'S' | 'A' | 'B' | 'C';

export interface CockpitDifficultyConfig {
  readonly id: CockpitDifficulty;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly shields: number;
  readonly timeScale: number;
  readonly rushStartSec: number;
  readonly rushBonusSec: number;
  readonly blitzStartSec: number;
  readonly blitzPenaltySec: number;
  readonly clickDelta: number;
  readonly dialToleranceDeg: number;
  readonly faderTolerance: number;
  readonly faderHoldSec: number;
  readonly holdSec: number;
  readonly hazardSlowFactor: number;
  readonly maxPatchCount: 2 | 3;
  readonly scoreMult: number;
}

export const COCKPIT_DIFFICULTY_ORDER: readonly CockpitDifficulty[] = [
  'easy',
  'normal',
  'hard',
  'chaos',
];

export const COCKPIT_DIFFICULTY_CONFIGS: Record<CockpitDifficulty, CockpitDifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Dễ',
    shortLabel: 'DỄ',
    description: 'Thư giãn · +55% thời gian · 3 Giáp lỗi · Sai nhẹ vẫn chơi tiếp',
    shields: 3,
    timeScale: 1.55,
    rushStartSec: 18.0,
    rushBonusSec: 3.4,
    blitzStartSec: 60.0,
    blitzPenaltySec: 1.5,
    clickDelta: -2,
    dialToleranceDeg: 35,
    faderTolerance: 14,
    faderHoldSec: 0.12,
    holdSec: 1.15,
    hazardSlowFactor: 1.35,
    maxPatchCount: 2,
    scoreMult: 1.0,
  },
  normal: {
    id: 'normal',
    label: 'Trung Bình',
    shortLabel: 'TRUNG BÌNH',
    description: 'Cân bằng · +25% thời gian · 2 Giáp lỗi · Nhịp WarioWare vừa tay',
    shields: 2,
    timeScale: 1.25,
    rushStartSec: 15.0,
    rushBonusSec: 2.9,
    blitzStartSec: 60.0,
    blitzPenaltySec: 2.0,
    clickDelta: -1,
    dialToleranceDeg: 28,
    faderTolerance: 11,
    faderHoldSec: 0.18,
    holdSec: 1.35,
    hazardSlowFactor: 1.15,
    maxPatchCount: 2,
    scoreMult: 1.3,
  },
  hard: {
    id: 'hard',
    label: 'Khó',
    shortLabel: 'KHÓ',
    description: 'Phản xạ nhanh · 1 Giáp lỗi · Đủ 3 dây nguồn ở vòng cao (×1.75 điểm)',
    shields: 1,
    timeScale: 1.0,
    rushStartSec: 15.0,
    rushBonusSec: 2.5,
    blitzStartSec: 60.0,
    blitzPenaltySec: 2.5,
    clickDelta: 0,
    dialToleranceDeg: 22,
    faderTolerance: 9,
    faderHoldSec: 0.25,
    holdSec: 1.55,
    hazardSlowFactor: 1.0,
    maxPatchCount: 3,
    scoreMult: 1.75,
  },
  chaos: {
    id: 'chaos',
    label: 'Hỗn Loạn',
    shortLabel: 'HỖN LOẠN',
    description: 'Siêu tốc · 0 Giáp (1 sai = Thua ngay) · Thưởng ×2.4 điểm!',
    shields: 0,
    timeScale: 0.85,
    rushStartSec: 13.0,
    rushBonusSec: 2.2,
    blitzStartSec: 60.0,
    blitzPenaltySec: 3.5,
    clickDelta: 1,
    dialToleranceDeg: 18,
    faderTolerance: 7,
    faderHoldSec: 0.28,
    holdSec: 1.75,
    hazardSlowFactor: 0.88,
    maxPatchCount: 3,
    scoreMult: 2.4,
  },
};

export type SwitchState = 'off' | 'amber' | 'green';

export type PatchColor = 'gold' | 'cyan' | 'rose';

export interface PatchCableConnection {
  readonly fromIndex: number; // 0..2 left ports (▲, ●, ◆)
  readonly toIndex: number;   // 0..2 right ports (shuffled labels)
}

export interface CockpitHardwareState {
  switches: [SwitchState, SwitchState, SwitchState];
  redPressCount: number;
  dialAngle: number; // 0..330 in 30-deg increments (12 detents)
  faderValue: number; // 0..100
  faderMatchedSec: number; // dwell time inside target band
  rightPortOrder: [PatchColor, PatchColor, PatchColor]; // fixed per task shuffle
  patchConnections: PatchCableConnection[]; // connected left -> right pairs
  selectedLeftPort: number | null;
  yellowHolding: boolean;
  yellowHoldChargeSec: number;
}

export type TaskStatus = 'active' | 'success' | 'failed';

export interface TaskGoal {
  readonly targetSwitches?: [SwitchState, SwitchState, SwitchState];
  readonly targetClicks?: number;
  readonly exactClicks?: boolean;
  readonly targetDialAngle?: number;
  readonly dialToleranceDeg?: number;
  readonly targetFader?: number;
  readonly faderTolerance?: number;
  readonly faderHoldRequiredSec?: number;
  readonly requiredPatchColor?: PatchColor;
  readonly requiredPatchCount?: number;
  readonly targetHoldSec?: number;
}

export interface ActiveMicroTask {
  readonly pluginId: string;
  readonly module: CockpitModuleId;
  readonly title: string;
  readonly hint: string;
  readonly badgeLabel: string;
  readonly timeLimitSec: number;
  readonly goal: TaskGoal;
  readonly isCrisis?: boolean;
}

export interface TaskPlugin {
  readonly id: string;
  readonly module: CockpitModuleId;
  readonly baseTimeLimitSec: number;
  readonly init: (
    rng: () => number,
    speedTier: number,
    difficulty: CockpitDifficulty
  ) => {
    title: string;
    hint: string;
    badgeLabel: string;
    goal: TaskGoal;
    hardwarePatch: Partial<CockpitHardwareState>;
  };
  readonly evaluate: (
    task: ActiveMicroTask,
    hw: CockpitHardwareState,
    elapsedSec: number,
    hazardZapActive: boolean
  ) => TaskStatus;
}

export const OVERDRIVE_COMBO_STEP = 10;
export const OVERDRIVE_DURATION_SEC = 5.0;
export const CRISIS_TASK_INTERVAL = 5;
export const RUSH_15S_START_SEC = 15.0;
export const RUSH_15S_TIME_BONUS_SEC = 2.9;
export const BLITZ_60S_START_SEC = 60.0;

export const PATCH_SYMBOL_MAP: Record<PatchColor, { symbol: string; label: string; hex: string }> = {
  gold: { symbol: '▲', label: 'Vàng', hex: '#F59E0B' },
  cyan: { symbol: '●', label: 'Xanh', hex: '#0EA5E9' },
  rose: { symbol: '◆', label: 'Hồng', hex: '#F43F5E' },
};

export function createInitialHardwareState(): CockpitHardwareState {
  return {
    switches: ['off', 'off', 'off'],
    redPressCount: 0,
    dialAngle: 0,
    faderValue: 50,
    faderMatchedSec: 0,
    rightPortOrder: ['cyan', 'rose', 'gold'],
    patchConnections: [],
    selectedLeftPort: null,
    yellowHolding: false,
    yellowHoldChargeSec: 0,
  };
}

export function getSpeedTier(completedTasks: number): number {
  return 1 + Math.floor(Math.max(0, completedTasks) / OVERDRIVE_COMBO_STEP);
}

export function getSpeedMultiplier(speedTier: number): number {
  return Number((1 + Math.max(0, speedTier - 1) * 0.12).toFixed(2));
}

export function getTaskTimeLimitSec(
  baseSec: number,
  speedTier: number,
  mode: CockpitMode,
  difficulty: CockpitDifficulty = 'easy'
): number {
  const mult = getSpeedMultiplier(speedTier);
  const diffScale = COCKPIT_DIFFICULTY_CONFIGS[difficulty].timeScale;
  const modeScale = mode === 'rush_15s' ? 0.96 : mode === 'blitz_60s' ? 0.94 : 1.0;
  return Number(Math.max(2.3, Math.min(8.2, (baseSec * diffScale * modeScale) / mult)).toFixed(2));
}

export function isOverdriveTrigger(nextCombo: number): boolean {
  return nextCombo > 0 && nextCombo % OVERDRIVE_COMBO_STEP === 0;
}

export function isCrisisRound(completedTasks: number): boolean {
  const nextNumber = completedTasks + 1;
  return nextNumber >= CRISIS_TASK_INTERVAL && nextNumber % CRISIS_TASK_INTERVAL === 0;
}

export function calculateTaskScore(
  combo: number,
  speedTier: number,
  remainingRatio: number,
  isOverdrive: boolean,
  difficulty: CockpitDifficulty = 'normal',
  isCrisis = false
): number {
  const base = 100 + Math.min(200, combo * 15);
  const speedBonus = Math.round(Math.max(0, Math.min(1, remainingRatio)) * 60);
  const diffMult = COCKPIT_DIFFICULTY_CONFIGS[difficulty].scoreMult;
  const crisisMult = isCrisis ? 1.5 : 1.0;
  const mult = (1 + (speedTier - 1) * 0.25) * diffMult * crisisMult;
  const single = Math.round((base + speedBonus) * mult);
  return isOverdrive ? single * 2 : single;
}

export function getPilotRank(score: number, completedTasks: number): {
  rank: PilotRank;
  title: string;
  colorHex: string;
} {
  if (score >= 9000 || completedTasks >= 28) {
    return { rank: 'S+', title: 'Cơ Trưởng Siêu Thanh', colorHex: '#FACC15' };
  }
  if (score >= 5200 || completedTasks >= 18) {
    return { rank: 'S', title: 'Phi Công Tinh Nhuệ', colorHex: '#34D399' };
  }
  if (score >= 2800 || completedTasks >= 11) {
    return { rank: 'A', title: 'Kỹ Thuật Viên Chuẩn Xác', colorHex: '#38BDF8' };
  }
  if (score >= 1200 || completedTasks >= 5) {
    return { rank: 'B', title: 'Học Viên Buồng Lái', colorHex: '#A78BFA' };
  }
  return { rank: 'C', title: 'Tập Sự Khởi Động', colorHex: '#94A3B8' };
}

/**
 * Deterministic sweeping high-voltage arc timing for the Yellow Hold Pad.
 * Scaled by difficulty so Easy/Normal give generous warning and shorter zaps.
 */
export function stepHazardCycle(
  elapsedSec: number,
  speedTier: number,
  difficulty: CockpitDifficulty = 'normal'
): { warning: boolean; active: boolean; progressRatio: number; phaseLabel: 'safe' | 'warning' | 'active' } {
  const slowFactor = COCKPIT_DIFFICULTY_CONFIGS[difficulty].hazardSlowFactor;
  const cyclePeriod = Math.max(1.5, (2.25 - (speedTier - 1) * 0.1) * slowFactor);
  const phase = (elapsedSec + 0.35) % cyclePeriod;
  const warnStart = cyclePeriod * 0.44;
  const activeStart = cyclePeriod * 0.68;
  const zapDuration = difficulty === 'easy' ? 0.42 : difficulty === 'normal' ? 0.48 : 0.55;
  const activeEnd = Math.min(cyclePeriod * 0.94, activeStart + zapDuration);
  const progressRatio = Number((phase / cyclePeriod).toFixed(3));

  if (phase >= activeStart && phase < activeEnd) {
    return { warning: false, active: true, progressRatio, phaseLabel: 'active' };
  }
  if (phase >= warnStart && phase < activeStart) {
    return { warning: true, active: false, progressRatio, phaseLabel: 'warning' };
  }
  return { warning: false, active: false, progressRatio, phaseLabel: 'safe' };
}

function angularDeltaDeg(a: number, b: number): number {
  const diff = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return diff;
}

export function getShortestDialDirection(fromDeg: number, toDeg: number): 'cw' | 'ccw' | 'done' {
  const delta = (((toDeg - fromDeg) % 360) + 540) % 360 - 180;
  if (Math.abs(delta) < 15) return 'done';
  return delta > 0 ? 'cw' : 'ccw';
}

export function normalizeDialAngle(deg: number): number {
  const snapped = Math.round(deg / 30) * 30;
  return ((snapped % 360) + 360) % 360 === 360 ? 0 : Math.min(330, ((snapped % 360) + 360) % 360);
}

function shuffleColors(rng: () => number): [PatchColor, PatchColor, PatchColor] {
  const arr: PatchColor[] = ['gold', 'cyan', 'rose'];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return [arr[0], arr[1], arr[2]];
}

/**
 * Plugin Registry: 15 self-contained tactical cockpit micro-tasks across all 6 hardware modules.
 */
export const TASK_PLUGINS: readonly TaskPlugin[] = [
  {
    id: 'switches_all_green',
    module: 'switches',
    baseTimeLimitSec: 4.1,
    init: (rng) => {
      const start: [SwitchState, SwitchState, SwitchState] = [
        rng() > 0.5 ? 'off' : 'amber',
        rng() > 0.5 ? 'amber' : 'off',
        'off',
      ];
      return {
        title: 'Gạt 3 công tắc XANH',
        hint: 'Đẩy cả 3 cần gạt lên vị trí XANH [1][2][3]',
        badgeLabel: '3× XANH',
        goal: { targetSwitches: ['green', 'green', 'green'] },
        hardwarePatch: { switches: start },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const target = task.goal.targetSwitches ?? ['green', 'green', 'green'];
      if (hw.switches.every((s, i) => s === target[i])) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'switches_pattern',
    module: 'switches',
    baseTimeLimitSec: 4.7,
    init: (rng, _tier, difficulty) => {
      const states: SwitchState[] = difficulty === 'easy' ? ['off', 'green'] : ['off', 'amber', 'green'];
      const target: [SwitchState, SwitchState, SwitchState] = [
        states[Math.floor(rng() * states.length)],
        states[Math.floor(rng() * states.length)],
        states[Math.floor(rng() * states.length)],
      ];
      const start: [SwitchState, SwitchState, SwitchState] = [
        target[0] === 'green' ? 'off' : 'green',
        target[1] === 'amber' ? 'off' : 'amber',
        target[2] === 'off' ? 'green' : 'off',
      ];
      const label = target.map((s) => (s === 'green' ? 'X' : s === 'amber' ? 'V' : '0')).join('·');
      return {
        title: `Khớp mã công tắc [${label}]`,
        hint: 'Gạt từng công tắc khớp đèn mẫu (X=Xanh, V=Vàng, 0=Tắt)',
        badgeLabel: `MÃ ${label}`,
        goal: { targetSwitches: target },
        hardwarePatch: { switches: start },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const target = task.goal.targetSwitches!;
      if (hw.switches.every((s, i) => s === target[i])) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'switches_kill_all',
    module: 'switches',
    baseTimeLimitSec: 3.8,
    init: () => ({
      title: 'Ngắt nguồn tất cả công tắc!',
      hint: 'Gạt toàn bộ 3 công tắc về TẮT (OFF)',
      badgeLabel: 'NGẮT NGUỒN',
      goal: { targetSwitches: ['off', 'off', 'off'] },
      hardwarePatch: { switches: ['green', 'amber', 'green'] },
    }),
    evaluate: (task, hw, elapsedSec) => {
      if (hw.switches.every((s) => s === 'off')) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'switches_amber_lock',
    module: 'switches',
    baseTimeLimitSec: 4.3,
    init: (rng) => {
      const midTarget: SwitchState = rng() > 0.5 ? 'green' : 'off';
      const target: [SwitchState, SwitchState, SwitchState] = ['amber', midTarget, 'amber'];
      const start: [SwitchState, SwitchState, SwitchState] = [
        'off',
        midTarget === 'green' ? 'amber' : 'green',
        'green',
      ];
      const midCode = midTarget === 'green' ? 'X' : '0';
      return {
        title: `Khóa chế độ dự phòng [V·${midCode}·V]`,
        hint: 'Gạt 2 công tắc ngoài về VÀNG, công tắc giữa theo đèn mẫu',
        badgeLabel: `V·${midCode}·V`,
        goal: { targetSwitches: target },
        hardwarePatch: { switches: start },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const target = task.goal.targetSwitches!;
      if (hw.switches.every((s, i) => s === target[i])) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'red_button_mash',
    module: 'red_button',
    baseTimeLimitSec: 3.9,
    init: (_rng, speedTier, difficulty) => {
      const delta = COCKPIT_DIFFICULTY_CONFIGS[difficulty].clickDelta;
      const targetClicks = Math.max(4, Math.min(12, 7 + delta + Math.floor((speedTier - 1) * 1.1)));
      return {
        title: `Đập nút ĐỎ ${targetClicks} lần!`,
        hint: 'Bấm liên hoàn nút ĐỎ hoặc phím [Space] / [B]',
        badgeLabel: `×${targetClicks} LẦN`,
        goal: { targetClicks, exactClicks: false },
        hardwarePatch: { redPressCount: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      if (hw.redPressCount >= (task.goal.targetClicks ?? 6)) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'red_button_exact',
    module: 'red_button',
    baseTimeLimitSec: 4.3,
    init: (rng, _tier, difficulty) => {
      const minClicks = difficulty === 'easy' ? 2 : 3;
      const targetClicks = minClicks + Math.floor(rng() * 3); // 2..4 on easy, 3..5 otherwise
      return {
        title: `Bấm ĐÚNG ${targetClicks} phát nút ĐỎ`,
        hint: `Đúng ${targetClicks} lần rồi DỪNG! Bấm thừa sẽ quá tải`,
        badgeLabel: `CHUẨN ${targetClicks}×`,
        goal: { targetClicks, exactClicks: true },
        hardwarePatch: { redPressCount: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const target = task.goal.targetClicks ?? 4;
      if (hw.redPressCount > target) return 'failed';
      if (hw.redPressCount === target && elapsedSec >= 0.35) return 'success';
      return elapsedSec >= task.timeLimitSec ? (hw.redPressCount === target ? 'success' : 'failed') : 'active';
    },
  },
  {
    id: 'red_button_turbo',
    module: 'red_button',
    baseTimeLimitSec: 4.2,
    init: (_rng, speedTier, difficulty) => {
      const bonus = difficulty === 'chaos' ? 3 : difficulty === 'hard' ? 2 : 0;
      const targetClicks = Math.max(6, Math.min(15, 9 + bonus + Math.floor((speedTier - 1) * 1.2)));
      return {
        title: `Xả áp khẩn cấp ${targetClicks} nhịp!`,
        hint: 'Đập nút ĐỎ siêu tốc đạt ngưỡng xả áp an toàn',
        badgeLabel: `XẢ ${targetClicks}×`,
        goal: { targetClicks, exactClicks: false },
        hardwarePatch: { redPressCount: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      if (hw.redPressCount >= (task.goal.targetClicks ?? 9)) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'rotary_dial_target',
    module: 'rotary_dial',
    baseTimeLimitSec: 4.4,
    init: (rng, _tier, difficulty) => {
      const startIdx = Math.floor(rng() * 12);
      const offset = 3 + Math.floor(rng() * 6);
      const targetIdx = (startIdx + offset) % 12;
      const startAngle = startIdx * 30;
      const targetAngle = targetIdx * 30;
      const tol = COCKPIT_DIFFICULTY_CONFIGS[difficulty].dialToleranceDeg;
      return {
        title: `Xoay núm về vạch ${targetAngle}°`,
        hint: 'Kéo núm xoay hoặc bấm [Q] / [E] vào vùng xanh',
        badgeLabel: `GÓC ${targetAngle}°`,
        goal: { targetDialAngle: targetAngle, dialToleranceDeg: tol },
        hardwarePatch: { dialAngle: startAngle },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const target = task.goal.targetDialAngle ?? 0;
      const tol = task.goal.dialToleranceDeg ?? 28;
      if (angularDeltaDeg(hw.dialAngle, target) <= tol) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'rotary_dial_opposite',
    module: 'rotary_dial',
    baseTimeLimitSec: 4.5,
    init: (rng, _tier, difficulty) => {
      const startIdx = Math.floor(rng() * 12);
      const targetIdx = (startIdx + 6) % 12;
      const startAngle = startIdx * 30;
      const targetAngle = targetIdx * 30;
      const tol = Math.max(15, COCKPIT_DIFFICULTY_CONFIGS[difficulty].dialToleranceDeg - 3);
      return {
        title: `Đảo pha 180° tới ${targetAngle}°!`,
        hint: 'Xoay nhanh sang góc đối diện 180° theo mũi tên chỉ dẫn',
        badgeLabel: `ĐẢO ${targetAngle}°`,
        goal: { targetDialAngle: targetAngle, dialToleranceDeg: tol },
        hardwarePatch: { dialAngle: startAngle },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const target = task.goal.targetDialAngle ?? 180;
      const tol = task.goal.dialToleranceDeg ?? 24;
      if (angularDeltaDeg(hw.dialAngle, target) <= tol) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'wave_fader_match',
    module: 'wave_fader',
    baseTimeLimitSec: 4.5,
    init: (rng, _tier, difficulty) => {
      const cfg = COCKPIT_DIFFICULTY_CONFIGS[difficulty];
      const start = rng() > 0.5 ? 15 : 85;
      const target = start < 50 ? 60 + Math.round(rng() * 28) : 12 + Math.round(rng() * 28);
      return {
        title: `Kéo thanh sóng về ${target}%`,
        hint: 'Trượt cần gạt hoặc nhấn [A]/[D] trùng vạch sóng xanh',
        badgeLabel: `SÓNG ${target}%`,
        goal: {
          targetFader: target,
          faderTolerance: cfg.faderTolerance,
          faderHoldRequiredSec: cfg.faderHoldSec,
        },
        hardwarePatch: { faderValue: start, faderMatchedSec: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const reqHold = task.goal.faderHoldRequiredSec ?? 0.18;
      if (hw.faderMatchedSec >= reqHold) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'wave_fader_extreme',
    module: 'wave_fader',
    baseTimeLimitSec: 4.0,
    init: (rng, _tier, difficulty) => {
      const cfg = COCKPIT_DIFFICULTY_CONFIGS[difficulty];
      const goHigh = rng() > 0.5;
      const start = goHigh ? 14 : 86;
      const target = goHigh ? 92 : 8;
      return {
        title: goHigh ? 'Đẩy công suất sóng ĐỈNH 92%!' : 'Hạ biên độ sóng ĐÁY 8%!',
        hint: 'Gạt mạnh thanh sóng về sát ngưỡng mục tiêu và giữ nhịp',
        badgeLabel: goHigh ? 'MAX 92%' : 'MIN 8%',
        goal: {
          targetFader: target,
          faderTolerance: Math.max(9, cfg.faderTolerance + 1),
          faderHoldRequiredSec: Math.max(0.1, cfg.faderHoldSec - 0.04),
        },
        hardwarePatch: { faderValue: start, faderMatchedSec: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const reqHold = task.goal.faderHoldRequiredSec ?? 0.14;
      if (hw.faderMatchedSec >= reqHold) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'patch_bay_connect',
    module: 'patch_bay',
    baseTimeLimitSec: 4.7,
    init: (rng, speedTier, difficulty) => {
      const order = shuffleColors(rng);
      const maxPatch = COCKPIT_DIFFICULTY_CONFIGS[difficulty].maxPatchCount;
      const count = speedTier >= 2 && maxPatch === 3 ? 3 : 2;
      return {
        title: count === 3 ? 'Cắm đủ 3 dây khớp màu!' : 'Cắm 2 dây nguồn khớp màu!',
        hint: 'Bấm cổng trái rồi bấm cổng phải cùng ký hiệu & màu',
        badgeLabel: `${count} DÂY`,
        goal: { requiredPatchCount: count },
        hardwarePatch: {
          rightPortOrder: order,
          patchConnections: [],
          selectedLeftPort: null,
        },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const req = task.goal.requiredPatchCount ?? 2;
      const leftOrder: readonly PatchColor[] = ['gold', 'cyan', 'rose'];
      const validMatches = hw.patchConnections.filter(
        (c) => leftOrder[c.fromIndex] === hw.rightPortOrder[c.toIndex]
      ).length;
      if (validMatches >= req) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'patch_bay_rewire',
    module: 'patch_bay',
    baseTimeLimitSec: 4.8,
    init: (rng) => {
      const order = shuffleColors(rng);
      // Pre-plug 1 wrong/crossed cable so the player must rewire cleanly to reach 2 valid pairs
      const wrongToIdx = (order.indexOf('gold') + 1) % 3;
      const targetColors: readonly PatchColor[] = ['gold', 'cyan', 'rose'];
      const chosenColor = targetColors[Math.floor(rng() * targetColors.length)];
      const meta = PATCH_SYMBOL_MAP[chosenColor];
      return {
        title: `Sửa dây nhiễu · Nối [${meta.symbol} ${meta.label}] + 1 dây`,
        hint: `Rút dây sai & cắm đúng cổng [${meta.symbol} ${meta.label}] cùng ít nhất 1 dây khác`,
        badgeLabel: `ƯU TIÊN ${meta.symbol}`,
        goal: { requiredPatchColor: chosenColor, requiredPatchCount: 2 },
        hardwarePatch: {
          rightPortOrder: order,
          patchConnections: [{ fromIndex: 0, toIndex: wrongToIdx }],
          selectedLeftPort: null,
        },
      };
    },
    evaluate: (task, hw, elapsedSec) => {
      const reqCount = task.goal.requiredPatchCount ?? 2;
      const reqColor = task.goal.requiredPatchColor;
      const leftOrder: readonly PatchColor[] = ['gold', 'cyan', 'rose'];
      const validConns = hw.patchConnections.filter(
        (c) => leftOrder[c.fromIndex] === hw.rightPortOrder[c.toIndex]
      );
      const hasColor = !reqColor || validConns.some((c) => leftOrder[c.fromIndex] === reqColor);
      if (validConns.length >= reqCount && hasColor) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'hazard_hold_dodge',
    module: 'hazard_hold',
    baseTimeLimitSec: 4.9,
    init: (_rng, _tier, difficulty) => {
      const holdSec = COCKPIT_DIFFICULTY_CONFIGS[difficulty].holdSec;
      return {
        title: 'Giữ nút VÀNG · Thả khi sét!',
        hint: 'Giữ chuột hoặc phím [F] nạp 100%, NHẢ TAY khi tia sét đánh!',
        badgeLabel: 'GIỮ + NÉ SÉT',
        goal: { targetHoldSec: holdSec },
        hardwarePatch: { yellowHolding: false, yellowHoldChargeSec: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec, hazardZapActive) => {
      if (hw.yellowHolding && hazardZapActive) return 'failed';
      if (hw.yellowHoldChargeSec >= (task.goal.targetHoldSec ?? 1.35)) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
  {
    id: 'hazard_hold_burst',
    module: 'hazard_hold',
    baseTimeLimitSec: 4.5,
    init: (_rng, _tier, difficulty) => {
      const holdSec = Number(Math.max(0.75, COCKPIT_DIFFICULTY_CONFIGS[difficulty].holdSec * 0.72).toFixed(2));
      return {
        title: 'Nạp tụ nhanh giữa nhịp sét!',
        hint: 'Canh nhịp an toàn để giữ [F] đủ 100% thật nhanh',
        badgeLabel: 'NẠP NHANH',
        goal: { targetHoldSec: holdSec },
        hardwarePatch: { yellowHolding: false, yellowHoldChargeSec: 0 },
      };
    },
    evaluate: (task, hw, elapsedSec, hazardZapActive) => {
      if (hw.yellowHolding && hazardZapActive) return 'failed';
      if (hw.yellowHoldChargeSec >= (task.goal.targetHoldSec ?? 0.95)) return 'success';
      return elapsedSec >= task.timeLimitSec ? 'failed' : 'active';
    },
  },
];

export function pickNextMicroTask(
  completedTasks: number,
  prevModule: CockpitModuleId | null,
  mode: CockpitMode,
  difficulty: CockpitDifficulty = 'easy',
  rng: () => number = Math.random
): { task: ActiveMicroTask; hardwarePatch: Partial<CockpitHardwareState> } {
  const speedTier = getSpeedTier(completedTasks);
  const candidates = prevModule
    ? TASK_PLUGINS.filter((p) => p.module !== prevModule)
    : [...TASK_PLUGINS];
  const pool = candidates.length > 0 ? candidates : TASK_PLUGINS;
  const plugin = pool[Math.floor(rng() * pool.length)];
  const setup = plugin.init(rng, speedTier, difficulty);
  const crisis = isCrisisRound(completedTasks);
  const adjustedTime = getTaskTimeLimitSec(
    crisis ? Math.max(3.6, plugin.baseTimeLimitSec * 0.94) : plugin.baseTimeLimitSec,
    speedTier,
    mode,
    difficulty
  );

  return {
    task: {
      pluginId: plugin.id,
      module: plugin.module,
      title: crisis ? `KHẨN CẤP · ${setup.title}` : setup.title,
      hint: setup.hint,
      badgeLabel: crisis ? `${setup.badgeLabel} ×1.5` : setup.badgeLabel,
      timeLimitSec: adjustedTime,
      goal: setup.goal,
      isCrisis: crisis,
    },
    hardwarePatch: setup.hardwarePatch,
  };
}

export function evaluateMicroTask(
  task: ActiveMicroTask,
  hw: CockpitHardwareState,
  elapsedSec: number,
  hazardZapActive: boolean
): TaskStatus {
  const plugin = TASK_PLUGINS.find((p) => p.id === task.pluginId);
  if (!plugin) return 'failed';
  return plugin.evaluate(task, hw, elapsedSec, hazardZapActive);
}
