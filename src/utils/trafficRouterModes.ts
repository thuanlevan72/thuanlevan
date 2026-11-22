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
      'Độ khó cân bằng Production với 4 đợt lưu lượng tăng tiến, yêu cầu chọn đúng mô hình kiến trúc và phân bổ Database cho hoàn cảnh.',
    ruleSummary: 'SLA 100% · Tải DB chuẩn · Tạm nghỉ giữa đợt để tinh chỉnh',
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
    badge: '5 Đợt · 1.4× Traffic',
    color: '#F59E0B',
    description:
      'Lưu lượng tăng vọt 1.4 lần kèm đợt thứ 5 bùng nổ POST/GET liên hoàn — luyện phân tải LB, Redis, Kafka và Đa Database Shard.',
    ruleSummary: 'Tốc độ gói ×1.4 · Thêm Đợt 5 Xung Tải · Thưởng điểm ×1.2',
    budgetMult: 1.05,
    spawnIntervalMult: 0.72,
    coolingMult: 0.94,
    slaMult: 0.95,
    cpuLoadMult: 1.05,
    heatPenaltyMult: 1.2,
    extraDdosWeight: 0.04,
    extraSqliWeight: 0,
    extraWriteWeight: 0.1,
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
      'Tiêm bão Bot DDoS và SQL Injection vào mọi đợt của màn chơi này. Để lọt gói độc hại xuống cụm DB sẽ bị trừ điểm bảo mật!',
    ruleSummary: 'Tiêm +18% DDoS & +10% SQLi · Luật 0 Lỗ Hổng · Thưởng ×1.25',
    budgetMult: 1.2,
    spawnIntervalMult: 0.85,
    coolingMult: 0.96,
    slaMult: 0.96,
    cpuLoadMult: 1.04,
    heatPenaltyMult: 1.12,
    extraDdosWeight: 0.18,
    extraSqliWeight: 0.1,
    extraWriteWeight: 0,
    extraWaveLabel: 'Tổng Công Kích Zero-Day & Botnet',
    scoreMult: 1.25,
    strictSecurity: true,
  },
  {
    id: 'tight_budget',
    name: 'Kiến Trúc Tinh Gọn (Lean Ops)',
    shortName: 'Tinh Gọn',
    badge: '4 Đợt · Tối Ưu Hop',
    color: '#10B981',
    description:
      'Thử thách thiết kế tinh gọn: áp lực tải +4%, đánh giá cao sơ đồ ít tầng dư thừa nhưng vẫn giữ CPU cụm DB mát và đạt SLA.',
    ruleSummary: 'Ưu tiên ít hop dư thừa · Áp lực tải +4% · Thưởng tối ưu ×1.3',
    budgetMult: 0.85,
    spawnIntervalMult: 0.94,
    coolingMult: 0.96,
    slaMult: 1,
    cpuLoadMult: 1.04,
    heatPenaltyMult: 1.05,
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
    badge: '5 Đợt · SLA -18%',
    color: '#A855F7',
    description:
      'Thử thách nâng cao: gói tin dồn dập hơn, SLA siết chặt -18%, DB tản nhiệt chậm và có đợt tấn công hỗn hợp — cần Multi-DB & Combo chuẩn.',
    ruleSummary: 'SLA -18% · DB Cooling 80% · Tải CPU ×1.14 · Thưởng ×1.5',
    budgetMult: 1.1,
    spawnIntervalMult: 0.68,
    coolingMult: 0.8,
    slaMult: 0.82,
    cpuLoadMult: 1.14,
    heatPenaltyMult: 1.35,
    extraDdosWeight: 0.1,
    extraSqliWeight: 0.06,
    extraWriteWeight: 0.06,
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
