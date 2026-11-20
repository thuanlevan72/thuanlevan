import type { PacketKind, TrafficLevelDef, TrafficWaveDef } from './trafficRouterEngine.ts';

export type ArchModeId =
  | 'standard'
  | 'flash_surge'
  | 'cyber_siege'
  | 'tight_budget'
  | 'chaos_hell';

export interface ArchModeDef {
  id: ArchModeId;
  name: string;
  shortName: string;
  badge: string;
  color: string;
  description: string;
  ruleSummary: string;
  budgetMult: number;
  spawnIntervalMult: number;
  coolingMult: number;
  slaMult: number;
  cpuLoadMult: number;
  heatPenaltyMult: number;
  extraDdosWeight: number;
  extraSqliWeight: number;
  extraWriteWeight: number;
  extraWaveLabel: string | null;
  scoreMult: number;
  strictSecurity: boolean;
}

export const ARCH_MODES: readonly ArchModeDef[] = [
  {
    id: 'standard',
    name: 'Chế Độ Chuẩn',
    shortName: 'Chuẩn',
    badge: '4 Đợt · SLA Gốc',
    color: '#38BDF8',
    description:
      'Độ khó cân bằng Production với 4 đợt lưu lượng tăng tiến, yêu cầu chọn đúng mô hình kiến trúc cho hoàn cảnh.',
    ruleSummary: 'Ngân sách 100% · SLA 100% · Tải DB chuẩn',
    budgetMult: 1,
    spawnIntervalMult: 1,
    coolingMult: 1,
    slaMult: 1,
    cpuLoadMult: 1,
    heatPenaltyMult: 1,
    extraDdosWeight: 0,
    extraSqliWeight: 0,
    extraWriteWeight: 0,
    extraWaveLabel: null,
    scoreMult: 1,
    strictSecurity: false,
  },
  {
    id: 'flash_surge',
    name: 'Bão Lưu Lượng',
    shortName: 'Bão Surge',
    badge: '5 Đợt · 1.6× Traffic',
    color: '#F59E0B',
    description:
      'Lưu lượng tăng vọt 1.6 lần kèm đợt thứ 5 bùng nổ POST/GET liên hoàn — buộc phải phân tải LB, Redis và Queue.',
    ruleSummary: 'Tốc độ gói ×1.6 · Thêm Đợt 5 Xung Tải · Thưởng điểm ×1.2',
    budgetMult: 1,
    spawnIntervalMult: 0.62,
    coolingMult: 0.86,
    slaMult: 0.92,
    cpuLoadMult: 1.15,
    heatPenaltyMult: 1.35,
    extraDdosWeight: 0.04,
    extraSqliWeight: 0,
    extraWriteWeight: 0.12,
    extraWaveLabel: 'Xung Tải Cực Đại (Flash Surge)',
    scoreMult: 1.2,
    strictSecurity: false,
  },
  {
    id: 'cyber_siege',
    name: 'Bao Vây DDoS & Hacker',
    shortName: 'Cyber Siege',
    badge: '5 Đợt · +DDoS/SQLi',
    color: '#FB7185',
    description:
      'Tiêm bão Bot DDoS và SQL Injection vào mọi đợt của màn chơi này. Để lọt bất kỳ gói độc hại nào đều bị phạt nặng!',
    ruleSummary: 'Tiêm +20% DDoS & +12% SQLi · Ngân sách +15% · Luật 0 Lỗ Hổng',
    budgetMult: 1.15,
    spawnIntervalMult: 0.78,
    coolingMult: 0.9,
    slaMult: 0.95,
    cpuLoadMult: 1.12,
    heatPenaltyMult: 1.2,
    extraDdosWeight: 0.2,
    extraSqliWeight: 0.12,
    extraWriteWeight: 0,
    extraWaveLabel: 'Tổng Công Kích Zero-Day & Botnet',
    scoreMult: 1.25,
    strictSecurity: true,
  },
  {
    id: 'tight_budget',
    name: 'Siết Ngân Sách FinOps',
    shortName: 'FinOps -28%',
    badge: '4 Đợt · -28% Tiền',
    color: '#10B981',
    description:
      'Cắt giảm 28% ngân sách đầu tư! Cấm lãng phí node thừa — thử thách xây kiến trúc tối giản đúng trọng tâm.',
    ruleSummary: 'Ngân sách 72% · Áp lực tải +10% · Thưởng tối ưu ×1.3',
    budgetMult: 0.72,
    spawnIntervalMult: 0.88,
    coolingMult: 0.9,
    slaMult: 1,
    cpuLoadMult: 1.08,
    heatPenaltyMult: 1.15,
    extraDdosWeight: 0,
    extraSqliWeight: 0,
    extraWriteWeight: 0,
    extraWaveLabel: null,
    scoreMult: 1.3,
    strictSecurity: false,
  },
  {
    id: 'chaos_hell',
    name: 'Địa Ngục SLA & Chaos',
    shortName: 'Chaos Hell',
    badge: '5 Đợt · SLA -24%',
    color: '#A855F7',
    description:
      'Thử thách khắc nghiệt nhất: gói tin dày gấp gần 2×, SLA siết chặt -24%, DB tản nhiệt chậm và có thêm đợt tấn công hỗn hợp.',
    ruleSummary: 'SLA -24% · DB Cooling 68% · Tải CPU ×1.28 · Thưởng ×1.5',
    budgetMult: 1,
    spawnIntervalMult: 0.56,
    coolingMult: 0.68,
    slaMult: 0.76,
    cpuLoadMult: 1.28,
    heatPenaltyMult: 1.6,
    extraDdosWeight: 0.12,
    extraSqliWeight: 0.08,
    extraWriteWeight: 0.08,
    extraWaveLabel: 'Thảm Họa Chaos Engineering',
    scoreMult: 1.5,
    strictSecurity: true,
  },
];

export const ARCH_MODE_MAP: Record<ArchModeId, ArchModeDef> = {
  standard: ARCH_MODES[0],
  flash_surge: ARCH_MODES[1],
  cyber_siege: ARCH_MODES[2],
  tight_budget: ARCH_MODES[3],
  chaos_hell: ARCH_MODES[4],
};

export function getArchMode(modeId: ArchModeId): ArchModeDef {
  return ARCH_MODE_MAP[modeId] ?? ARCH_MODES[0];
}

function normalizeWeights(
  base: Record<PacketKind, number>,
  extraDdos: number,
  extraSqli: number,
  extraWrite: number
): Record<PacketKind, number> {
  const raw: Record<PacketKind, number> = {
    read: Math.max(0.05, base.read),
    write: Math.max(0.05, base.write + extraWrite),
    media: Math.max(0, base.media),
    ddos: Math.max(0, base.ddos + extraDdos),
    sqli: Math.max(0, base.sqli + extraSqli),
  };
  const sum = raw.read + raw.write + raw.media + raw.ddos + raw.sqli;
  const r = Number((raw.read / sum).toFixed(4));
  const w = Number((raw.write / sum).toFixed(4));
  const m = Number((raw.media / sum).toFixed(4));
  const d = Number((raw.ddos / sum).toFixed(4));
  const s = Number(Math.max(0, 1 - (r + w + m + d)).toFixed(4));
  return { read: r, write: w, media: m, ddos: d, sqli: s };
}

export interface EffectiveScenarioConfig {
  mode: ArchModeDef;
  startingBudget: number;
  targetSlaMs: number;
  dbCoolingPerSec: number;
  cpuLoadMult: number;
  heatPenaltyMult: number;
  waves: TrafficWaveDef[];
  effectiveLevel: TrafficLevelDef;
}

/**
 * Computes the effective difficulty parameters, wave stream, budget, and SLA
 * for any (level, modeId) pair so every stage is playable across all 5 modes.
 */
export function getEffectiveScenarioConfig(
  level: TrafficLevelDef,
  modeId: ArchModeId
): EffectiveScenarioConfig {
  const mode = getArchMode(modeId);
  const startingBudget = Math.max(180, Math.round((level.startingBudget * mode.budgetMult) / 5) * 5);
  const targetSlaMs = Math.max(36, Math.round(level.targetSlaMs * mode.slaMult));
  const dbCoolingPerSec = Number(Math.max(6.2, level.dbCoolingPerSec * mode.coolingMult).toFixed(2));

  const waves: TrafficWaveDef[] = level.waves.map((w) => ({
    ...w,
    spawnIntervalSec: Number(Math.max(0.11, w.spawnIntervalSec * mode.spawnIntervalMult).toFixed(3)),
    weights: normalizeWeights(
      w.weights,
      mode.extraDdosWeight,
      mode.extraSqliWeight,
      mode.extraWriteWeight
    ),
  }));

  if (mode.extraWaveLabel && waves.length > 0) {
    const last = waves[waves.length - 1];
    waves.push({
      waveNumber: waves.length + 1,
      label: mode.extraWaveLabel,
      durationSec: last.durationSec + 1,
      spawnIntervalSec: Number(Math.max(0.1, last.spawnIntervalSec * 0.86).toFixed(3)),
      weights: normalizeWeights(
        last.weights,
        mode.extraDdosWeight * 0.35,
        mode.extraSqliWeight * 0.35,
        mode.extraWriteWeight * 0.3
      ),
      rewardBudget: 0,
    });
  }

  const effectiveLevel: TrafficLevelDef = {
    ...level,
    startingBudget,
    targetSlaMs,
    dbCoolingPerSec,
    waves,
  };

  return {
    mode,
    startingBudget,
    targetSlaMs,
    dbCoolingPerSec,
    cpuLoadMult: mode.cpuLoadMult,
    heatPenaltyMult: mode.heatPenaltyMult,
    waves,
    effectiveLevel,
  };
}
