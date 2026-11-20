export type GunType =
  | 'gatling'
  | 'shotgun'
  | 'flamer'
  | 'cryo'
  | 'tesla'
  | 'missile'
  | 'railgun'
  | 'mortar'
  | 'sniper'
  | 'acid'
  | 'saw'
  | 'beacon'
  | 'cannon'
  | 'plasma'
  | 'cluster'
  | 'hunter';

export type TargetPriority = 'first' | 'strongest' | 'weakest';

export type EnemyKind =
  | 'scout'
  | 'armored'
  | 'splitter'
  | 'stealth'
  | 'healer'
  | 'teleporter'
  | 'shieldbearer'
  | 'boss'
  | 'berserker'
  | 'juggernaut'
  | 'summoner'
  | 'leech';

export type MapBiome =
  | 'cyber_cyan'
  | 'emerald_matrix'
  | 'crimson_forge'
  | 'violet_void'
  | 'amber_desert'
  | 'arctic_core';

export interface BiomePalette {
  readonly bg: string;
  readonly gridLine: string;
  readonly pathFill: string;
  readonly pathBorder: string;
  readonly trackGlow: string;
  readonly wallFill: string;
  readonly wallStroke: string;
  readonly accent: string;
}

export const BIOME_PALETTES: Record<MapBiome, BiomePalette> = {
  cyber_cyan: {
    bg: '#060A15',
    gridLine: 'rgba(56, 189, 248, 0.14)',
    pathFill: '#101B33',
    pathBorder: 'rgba(56, 189, 248, 0.24)',
    trackGlow: 'rgba(56, 189, 248, 0.36)',
    wallFill: '#1E293B',
    wallStroke: '#64748B',
    accent: '#00E5FF',
  },
  emerald_matrix: {
    bg: '#04100C',
    gridLine: 'rgba(16, 185, 129, 0.14)',
    pathFill: '#0A221A',
    pathBorder: 'rgba(52, 211, 153, 0.25)',
    trackGlow: 'rgba(52, 211, 153, 0.36)',
    wallFill: '#132A23',
    wallStroke: '#10B981',
    accent: '#34D399',
  },
  crimson_forge: {
    bg: '#12060A',
    gridLine: 'rgba(244, 63, 94, 0.14)',
    pathFill: '#241018',
    pathBorder: 'rgba(251, 113, 133, 0.25)',
    trackGlow: 'rgba(251, 113, 133, 0.35)',
    wallFill: '#2B1720',
    wallStroke: '#FB7185',
    accent: '#FB7185',
  },
  violet_void: {
    bg: '#0B0616',
    gridLine: 'rgba(167, 139, 250, 0.14)',
    pathFill: '#18102E',
    pathBorder: 'rgba(196, 181, 253, 0.25)',
    trackGlow: 'rgba(192, 132, 252, 0.38)',
    wallFill: '#21183D',
    wallStroke: '#A78BFA',
    accent: '#C084FC',
  },
  amber_desert: {
    bg: '#120C04',
    gridLine: 'rgba(245, 158, 11, 0.14)',
    pathFill: '#24190B',
    pathBorder: 'rgba(251, 191, 36, 0.25)',
    trackGlow: 'rgba(251, 191, 36, 0.36)',
    wallFill: '#2C2012',
    wallStroke: '#F59E0B',
    accent: '#FBBF24',
  },
  arctic_core: {
    bg: '#050E17',
    gridLine: 'rgba(125, 211, 252, 0.16)',
    pathFill: '#0D2136',
    pathBorder: 'rgba(186, 230, 253, 0.28)',
    trackGlow: 'rgba(125, 211, 252, 0.42)',
    wallFill: '#162D45',
    wallStroke: '#7DD3FC',
    accent: '#BAE6FD',
  },
};

export interface GridPoint {
  readonly col: number;
  readonly row: number;
}

export type TileKind = 'empty' | 'path' | 'spawn' | 'core' | 'wall';

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'hell';

export interface DifficultyConfig {
  readonly id: DifficultyId;
  readonly label: string;
  readonly shortLabel: string;
  readonly badgeColor: string;
  readonly description: string;
  readonly hpMult: number;
  readonly shieldMult: number;
  readonly speedMult: number;
  readonly armorBonus: number;
  readonly startEnergyMult: number;
  readonly coreHpMult: number;
  readonly rewardMult: number;
  readonly scoreMult: number;
  readonly extraWaves: number;
  readonly waveCountBonus: number;
  readonly eliteChanceBoost: number;
}

export const DIFFICULTY_ORDER: readonly DifficultyId[] = ['easy', 'normal', 'hard', 'hell'];

export const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Dễ',
    shortLabel: 'DỄ',
    badgeColor: '#34D399',
    description: 'Khởi đầu vững +20% · Lõi +15% máu · Quái 1.2× HP',
    hpMult: 1.2,
    shieldMult: 1.2,
    speedMult: 1.04,
    armorBonus: 0,
    startEnergyMult: 1.15,
    coreHpMult: 1.15,
    rewardMult: 1.05,
    scoreMult: 1.0,
    extraWaves: 0,
    waveCountBonus: 0,
    eliteChanceBoost: 0,
  },
  normal: {
    id: 'normal',
    label: 'Trung Bình',
    shortLabel: 'TRUNG BÌNH',
    badgeColor: '#38BDF8',
    description: 'Chiến trường gắt · Quái 1.8× HP & +10% tốc độ · +1 Đợt',
    hpMult: 1.8,
    shieldMult: 1.5,
    speedMult: 1.1,
    armorBonus: 0.06,
    startEnergyMult: 1.0,
    coreHpMult: 1.0,
    rewardMult: 0.96,
    scoreMult: 1.35,
    extraWaves: 1,
    waveCountBonus: 2,
    eliteChanceBoost: 0.06,
  },
  hard: {
    id: 'hard',
    label: 'Khó',
    shortLabel: 'KHÓ',
    badgeColor: '#F97316',
    description: 'Áp lực cao · Quái 2.64× HP, +18% tốc độ, +12% giáp · +2 Đợt',
    hpMult: 2.64,
    shieldMult: 1.98,
    speedMult: 1.18,
    armorBonus: 0.12,
    startEnergyMult: 0.92,
    coreHpMult: 0.85,
    rewardMult: 0.9,
    scoreMult: 1.85,
    extraWaves: 2,
    waveCountBonus: 4,
    eliteChanceBoost: 0.14,
  },
  hell: {
    id: 'hell',
    label: 'Địa Ngục',
    shortLabel: 'ĐỊA NGỤC',
    badgeColor: '#FB7185',
    description: 'Cực hạn sinh tồn · Quái 3.84× HP, +26% tốc độ, Bão Tinh Anh · +3 Đợt',
    hpMult: 3.84,
    shieldMult: 2.58,
    speedMult: 1.26,
    armorBonus: 0.19,
    startEnergyMult: 0.88,
    coreHpMult: 0.75,
    rewardMult: 0.86,
    scoreMult: 2.6,
    extraWaves: 3,
    waveCountBonus: 6,
    eliteChanceBoost: 0.24,
  },
};

export type GameModeId = 'campaign' | 'blitz' | 'boss_rush' | 'endless';

export interface GameModeConfig {
  readonly id: GameModeId;
  readonly label: string;
  readonly shortLabel: string;
  readonly badgeColor: string;
  readonly description: string;
  readonly waveCountMult: number;
  readonly spawnRateMult: number;
  readonly speedMult: number;
  readonly startEnergyMult: number;
  readonly rewardMult: number;
  readonly scoreMult: number;
  readonly waveDelaySec: number;
}

export const GAME_MODE_ORDER: readonly GameModeId[] = [
  'campaign',
  'blitz',
  'boss_rush',
  'endless',
];

export const GAME_MODE_CONFIGS: Record<GameModeId, GameModeConfig> = {
  campaign: {
    id: 'campaign',
    label: 'Chiến Dịch',
    shortLabel: 'CHIẾN DỊCH',
    badgeColor: '#38BDF8',
    description: '8–21 đợt tinh gọn · Mỗi đợt kéo dài x2 & độ khó leo thang cực gắt',
    waveCountMult: 1.0,
    spawnRateMult: 1.0,
    speedMult: 1.0,
    startEnergyMult: 1.0,
    rewardMult: 1.0,
    scoreMult: 1.0,
    waveDelaySec: 8,
  },
  blitz: {
    id: 'blitz',
    label: 'Bão Tốc Độ',
    shortLabel: 'BLITZ',
    badgeColor: '#F59E0B',
    description: 'Ít đợt hơn (-35%) nhưng quái ra dồn dập +18% tốc độ & +25% thưởng',
    waveCountMult: 0.65,
    spawnRateMult: 1.55,
    speedMult: 1.18,
    startEnergyMult: 1.25,
    rewardMult: 1.25,
    scoreMult: 1.3,
    waveDelaySec: 4,
  },
  boss_rush: {
    id: 'boss_rush',
    label: 'Săn Boss',
    shortLabel: 'BOSS RUSH',
    badgeColor: '#F43F5E',
    description: '+120% năng lượng khởi đầu · Boss & Tinh Anh xuất trận ngay từ Đợt 1',
    waveCountMult: 0.6,
    spawnRateMult: 0.9,
    speedMult: 0.95,
    startEnergyMult: 2.2,
    rewardMult: 1.35,
    scoreMult: 1.6,
    waveDelaySec: 9,
  },
  endless: {
    id: 'endless',
    label: 'Vô Tận',
    shortLabel: 'ENDLESS',
    badgeColor: '#A855F7',
    description: 'Không giới hạn số đợt · Quái mạnh dần vô cực sau mốc chiến thắng',
    waveCountMult: 1.0,
    spawnRateMult: 1.05,
    speedMult: 1.0,
    startEnergyMult: 1.1,
    rewardMult: 1.0,
    scoreMult: 1.25,
    waveDelaySec: 7,
  },
};

export interface TdMapDef {
  readonly id: string;
  readonly name: string;
  readonly recommendedDifficulty: DifficultyId;
  readonly difficultyLabel: string;
  readonly subtitle: string;
  readonly biome: MapBiome;
  readonly cols: number;
  readonly rows: number;
  readonly startEnergy: number;
  readonly startCoreHp: number;
  readonly path: readonly GridPoint[];
  readonly walls: readonly GridPoint[];
  readonly totalWaves: number;
}

export interface EffectiveMapSetup {
  readonly totalWaves: number;
  readonly startEnergy: number;
  readonly startCoreHp: number;
}

export function getEffectiveMapSetup(
  map: TdMapDef,
  difficulty: DifficultyId,
  mode: GameModeId = 'campaign'
): EffectiveMapSetup {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  const modeCfg = GAME_MODE_CONFIGS[mode];
  const baseWaves = map.totalWaves + cfg.extraWaves;
  return {
    totalWaves: Math.max(5, Math.round(baseWaves * modeCfg.waveCountMult)),
    startEnergy: Math.round((map.startEnergy * cfg.startEnergyMult * modeCfg.startEnergyMult) / 5) * 5,
    startCoreHp: Math.max(8, Math.round(map.startCoreHp * cfg.coreHpMult)),
  };
}

export interface GunSkillMilestone {
  readonly level: 3 | 5 | 7 | 10;
  readonly name: string;
  readonly summary: string;
}

export interface GunCatalogItem {
  readonly type: GunType;
  readonly hotkey: string;
  readonly name: string;
  readonly shortName: string;
  readonly roleClue: string;
  readonly accentColor: string;
  readonly cost: number;
  readonly baseDamage: number;
  readonly baseCooldown: number;
  readonly rangeTiles: number;
  readonly milestones: readonly GunSkillMilestone[];
}

export interface PlacedGun {
  id: string;
  col: number;
  row: number;
  type: GunType;
  level: number; // 1..10
  priority: TargetPriority;
  chargeTimer: number;
  aimAngle: number;
  recoil: number;
  totalDamageDealt: number;
  kills: number;
}

export interface GunCombatProfile {
  readonly level: number;
  readonly damage: number;
  readonly cooldownSec: number;
  readonly rangeTiles: number;
  readonly rangePx: number;
  readonly dpsEstimate: number;
  readonly armorPierce: number; // 0..1 fraction of armor ignored
  readonly shieldMult: number; // multiplier against shields
  readonly splashRadius: number;
  readonly projectilesPerShot: number;
  readonly chainCount: number;
  readonly slowPct: number;
  readonly brittleBonus: number; // extra incoming damage on slowed targets (Cryo Lv5+)
  readonly burnDps: number;
  readonly pullForce: number;
  readonly visualTier: 1 | 2 | 3 | 4; // 1: Lv1-3, 2: Lv4-6, 3: Lv7-9, 4: Lv10 Mythic
  readonly tierLabel: string;
  readonly unlockedSkills: readonly GunSkillMilestone[];
  readonly nextSkill: GunSkillMilestone | null;
}

export interface TdEnemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  heading: number;
  waypointIndex: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  radius: number;
  reward: number;
  scoreValue: number;
  armorRatio: number; // 0..0.75 physical/kinetic armor
  slowTimer: number;
  slowFactor: number; // 0.3..0.65 (lower = slower)
  brittleBonus: number; // 0..0.45 extra incoming dmg taken
  burnTimer: number;
  burnDps: number;
  armorShred: number; // 0..0.55 permanent armor stripped
  stunTimer: number;
  abilityCooldown: number;
  hitFlash: number;
  koTimer: number;
  isElite?: boolean;
  enraged?: boolean;
}

export interface ProjectileItem {
  id: number;
  kind: 'bullet' | 'pellet' | 'missile' | 'mortar' | 'bomblet' | 'acid' | 'sawblade' | 'cannon' | 'plasma' | 'cluster' | 'hunter';
  sourceGunId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: number;
  damage: number;
  armorPierce: number;
  shieldMult: number;
  splashRadius: number;
  pullForce: number;
  burnDps: number;
  burnDuration: number;
  slowAmount: number;
  pierceLeft: number;
  bounceLeft?: number;
  acidShred?: number;
  hitIds?: number[];
  life: number;
  maxLife: number;
  speed: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
  spawnCluster?: boolean;
}

export interface AcidPoolFx {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  dps: number;
  shred: number;
  slowPct: number;
  tickAccum: number;
  sourceGunId: string;
  visualTier: 1 | 2 | 3 | 4;
}

export interface LightningArc {
  points: { x: number; y: number }[];
  alpha: number;
  color: string;
  width: number;
}

export interface RailBeamFx {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
}

export interface FlameConeFx {
  x: number;
  y: number;
  angle: number;
  range: number;
  halfArc: number;
  alpha: number;
  visualTier: 1 | 2 | 3 | 4;
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

export interface FloatingCombatText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const TILE_SIZE = 64;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 768
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 512
export const MAX_GUN_LEVEL = 10;

export const GUN_CATALOG: readonly GunCatalogItem[] = [
  {
    type: 'gatling',
    hotkey: '1',
    name: 'Súng Máy Vulcan',
    shortName: 'Vulcan',
    roleClue: 'Liên thanh xuyên giáp',
    accentColor: '#38BDF8',
    cost: 55,
    baseDamage: 15,
    baseCooldown: 0.21,
    rangeTiles: 2.85,
    milestones: [
      { level: 3, name: 'Đạn Xuyên Giáp AP', summary: 'Xuyên 45% giáp Thiết Giáp' },
      { level: 5, name: 'Nòng Kép Song Song', summary: 'Bắn đồng thời 2 luồng đạn liên hoàn' },
      { level: 7, name: 'Đầu Đạn Nổ Mảnh', summary: 'Mỗi phát bắn nổ lan vùng nhỏ 28px' },
      { level: 10, name: 'Bão Đạn Huyền Thoại', summary: '5 nòng Hyper-Plasma + 100% xuyên giáp' },
    ],
  },
  {
    type: 'shotgun',
    hotkey: '2',
    name: 'Pháo Chùm Shrapnel',
    shortName: 'Shrapnel',
    roleClue: 'Đạn chùm cận chiến',
    accentColor: '#FB923C',
    cost: 70,
    baseDamage: 14,
    baseCooldown: 0.85,
    rangeTiles: 2.25,
    milestones: [
      { level: 3, name: 'Băng Đạn Mở Rộng', summary: 'Tăng lên 7 mảnh đạn mỗi loạt' },
      { level: 5, name: 'Mảnh Đạn Tungsten Cháy', summary: 'Đốt cháy mục tiêu + phá 25% giáp' },
      { level: 7, name: 'Xuyên Phá Quần Địch', summary: 'Mảnh đạn xuyên tối đa 2 mục tiêu' },
      { level: 10, name: 'Pháo Bão Thép Tối Thượng', summary: '11 mảnh đạn xuyên 3 lớp + đốt rực' },
    ],
  },
  {
    type: 'flamer',
    hotkey: '3',
    name: 'Pháo Phun Lửa',
    shortName: 'Phun Lửa',
    roleClue: 'Thiêu đốt & tan giáp',
    accentColor: '#F97316',
    cost: 75,
    baseDamage: 18,
    baseCooldown: 0.34,
    rangeTiles: 2.4,
    milestones: [
      { level: 3, name: 'Xăng Đặc Cháy Lâu', summary: 'Tăng 60% sát thương cháy DoT theo giây' },
      { level: 5, name: 'Axit Nhiệt Tan Giáp', summary: 'Bào mòn 35% giáp kẻ địch trúng lửa' },
      { level: 7, name: 'Ngọn Lửa Plasma Xanh', summary: 'Tầm phun rộng hơn + làm chậm nhẹ' },
      { level: 10, name: 'Vòng Lửa Hủy Diệt 360°', summary: 'Phóng vòng lửa thiêu rụi toàn vùng quanh tháp' },
    ],
  },
  {
    type: 'cryo',
    hotkey: '4',
    name: 'Tháp Băng Cryo',
    shortName: 'Băng Cryo',
    roleClue: 'Đóng băng + tăng sát thương',
    accentColor: '#67E8F9',
    cost: 70,
    baseDamage: 20,
    baseCooldown: 1.2,
    rangeTiles: 2.75,
    milestones: [
      { level: 3, name: 'Sương Giá Thấu Xương', summary: 'Làm chậm -55% tốc độ & xóa tàng hình' },
      { level: 5, name: 'Hiệu Ứng Giòn Vỡ', summary: 'Quái bị đóng băng chịu thêm +25% mọi sát thương' },
      { level: 7, name: 'Xung Nhịp Tê Liệt', summary: 'Đóng băng cứng 0.45s khi tung sóng băng' },
      { level: 10, name: 'Tuyệt Đối Không Độ', summary: 'Sóng băng kép + +42% Giòn Vỡ toàn bản đồ vùng' },
    ],
  },
  {
    type: 'tesla',
    hotkey: '5',
    name: 'Tháp Sét Tesla',
    shortName: 'Sét Tesla',
    roleClue: 'Sét chuỗi phá khiên',
    accentColor: '#60A5FA',
    cost: 85,
    baseDamage: 32,
    baseCooldown: 0.92,
    rangeTiles: 2.7,
    milestones: [
      { level: 3, name: 'Cao Thế Dây Chuyền', summary: 'Sét giật lan tới 5 mục tiêu liên tiếp' },
      { level: 5, name: 'Xung EMP Phá Khiên', summary: 'Gây 185% sát thương lên Khiên Năng Lượng' },
      { level: 7, name: 'Đoản Mạch Tê Liệt', summary: 'Làm choáng 0.35s & ngắt chiêu Dịch Chuyển' },
      { level: 10, name: 'Bão Sấm Thiên Lôi', summary: 'Giật 9 mục tiêu + Thiên Lôi nổ vùng AoE' },
    ],
  },
  {
    type: 'missile',
    hotkey: '6',
    name: 'Tên Lửa Hành Trình',
    shortName: 'Tên Lửa',
    roleClue: 'Đuổi mục tiêu nổ chùm',
    accentColor: '#FB7185',
    cost: 100,
    baseDamage: 62,
    baseCooldown: 1.32,
    rangeTiles: 4.15,
    milestones: [
      { level: 3, name: 'Đầu Đạn Nổ Rộng', summary: 'Bán kính nổ tăng lên 96px' },
      { level: 5, name: 'Bệ Phóng Kép', summary: 'Phóng 2 tên lửa dẫn đường cùng lúc' },
      { level: 7, name: 'Bom Chùm Cluster', summary: 'Mỗi tên lửa nổ tách thêm 3 đầu đạn phụ' },
      { level: 10, name: 'Bão Tên Lửa 4 Nòng', summary: 'Bắn loạt 4 tên lửa + bom chùm hủy diệt' },
    ],
  },
  {
    type: 'railgun',
    hotkey: '7',
    name: 'Pháo Railgun Từ Trường',
    shortName: 'Railgun',
    roleClue: 'Tia xuyên thẳng săn Boss',
    accentColor: '#C084FC',
    cost: 125,
    baseDamage: 125,
    baseCooldown: 1.88,
    rangeTiles: 5.8,
    milestones: [
      { level: 3, name: 'Đạn Siêu Thanh AP', summary: '100% xuyên giáp + tăng tốc độ nạp' },
      { level: 5, name: 'Tia Xung Kích Kép', summary: 'Bắn tia đôi siêu dày phá 200% khiên' },
      { level: 7, name: 'Kích Nổ Quỹ Đạo', summary: 'Mỗi quái bị xuyên qua phát nổ sóng chấn động' },
      { level: 10, name: 'Pháo Quỹ Đạo Thiên Thạch', summary: '3 tia hủy diệt + nổ lớn + chí mạng Boss' },
    ],
  },
  {
    type: 'mortar',
    hotkey: '8',
    name: 'Pháo Cối Hố Đen',
    shortName: 'Hố Đen',
    roleClue: 'Hút gom quái & nổ cực đại',
    accentColor: '#A855F7',
    cost: 115,
    baseDamage: 105,
    baseCooldown: 2.05,
    rangeTiles: 4.85,
    milestones: [
      { level: 3, name: 'Lực Hút Trọng Lực', summary: 'Hút gom toàn bộ quái vào tâm vụ nổ' },
      { level: 5, name: 'Chấn Động Kép', summary: 'Làm chậm -45% & đốt cháy giáp quanh tâm' },
      { level: 7, name: 'Dư Chấn Hư Không', summary: 'Bán kính nổ cực đại 140px + lực hút mạnh' },
      { level: 10, name: 'Siêu Tân Tinh Hư Không', summary: 'Phóng 2 quả cầu hố đen + kéo sập đội hình' },
    ],
  },
  {
    type: 'sniper',
    hotkey: '9',
    name: 'Pháo Bắn Tỉa Chí Mạng',
    shortName: 'Bắn Tỉa',
    roleClue: 'Tầm cực xa · Chí mạng săn Boss',
    accentColor: '#34D399',
    cost: 95,
    baseDamage: 88,
    baseCooldown: 1.55,
    rangeTiles: 6.4,
    milestones: [
      { level: 3, name: 'Đạn Xuyên Giáp 85%', summary: 'Xuyên 85% giáp & phá 145% khiên' },
      { level: 5, name: 'Chí Mạng Tử Thần', summary: 'Tỉ lệ chí mạng cao ×2.1 sát thương' },
      { level: 7, name: 'Ám Sát Chỉ Huy', summary: '+45% sát thương lên Boss, Healer & Tinh Anh' },
      { level: 10, name: 'Họng Súng Thần Chết', summary: 'Bắn 2 phát liên hoàn · Chí mạng ×2.6 & 100% xuyên giáp' },
    ],
  },
  {
    type: 'acid',
    hotkey: '0',
    name: 'Súng Phóng Axit',
    shortName: 'Axit',
    roleClue: 'Vũng axit bào giáp & làm chậm',
    accentColor: '#A3E635',
    cost: 80,
    baseDamage: 26,
    baseCooldown: 1.05,
    rangeTiles: 3.0,
    milestones: [
      { level: 3, name: 'Vũng Axit Đậm Đặc', summary: 'Bào mòn 45% giáp vĩnh viễn khi dẫm vũng' },
      { level: 5, name: 'Dung Dịch Kéo Dài', summary: 'Vũng axit rộng 72px, tồn tại 4.8s & làm chậm -34%' },
      { level: 7, name: 'Phản Ứng Dây Chuyền', summary: 'Bắn 2 quả cầu axit cùng lúc bao phủ khúc cua' },
      { level: 10, name: 'Biển Axit Hủy Diệt', summary: 'Bào mòn 75% giáp + làm chậm -45% & đốt DoT cực gắt' },
    ],
  },
  {
    type: 'saw',
    hotkey: 'q',
    name: 'Máy Cưa Đĩa Nảy',
    shortName: 'Cưa Đĩa',
    roleClue: 'Đĩa cưa nảy bầy + rỉa máu',
    accentColor: '#F43F5E',
    cost: 85,
    baseDamage: 38,
    baseCooldown: 1.12,
    rangeTiles: 3.2,
    milestones: [
      { level: 3, name: 'Lưỡi Thép Hợp Kim', summary: 'Lưỡi cưa nảy qua tối đa 5 kẻ địch liên tiếp' },
      { level: 5, name: 'Răng Cưa Gây Xuất Huyết', summary: 'Gây hiệu ứng chảy máu & xuyên 55% giáp' },
      { level: 7, name: 'Song Đĩa Hủy Diệt', summary: 'Phóng 2 đĩa cưa cùng lúc, nảy tối đa 7 mục tiêu' },
      { level: 10, name: 'Bão Cưa Plasma Đỏ', summary: '3 đĩa cưa siêu tốc nảy 11 mục tiêu không hụt nhịp' },
    ],
  },
  {
    type: 'beacon',
    hotkey: 'e',
    name: 'Tháp Cộng Hưởng',
    shortName: 'Cộng Hưởng',
    roleClue: 'Buff tốc bắn & sát thương cho súng lân cận',
    accentColor: '#FACC15',
    cost: 90,
    baseDamage: 24,
    baseCooldown: 1.38,
    rangeTiles: 2.85,
    milestones: [
      { level: 3, name: 'Trường Tăng Tốc +20%', summary: 'Súng trong tầm nhận +20% tốc bắn & +12% sát thương' },
      { level: 5, name: 'Xung Sóng Cộng Hưởng', summary: 'Sóng xung kích gây sát thương diện rộng + lộ tàng hình' },
      { level: 7, name: 'Trường Overclock +32%', summary: 'Tăng +32% tốc bắn & +24% sát thương đồng minh' },
      { level: 10, name: 'Lõi Thái Dương Tối Thượng', summary: '+45% tốc bắn & +38% sát thương quanh tháp + sóng vàng' },
    ],
  },
  {
    type: 'cannon',
    hotkey: 'z',
    name: 'Pháo Nặng Titan',
    shortName: 'Pháo Nặng',
    roleClue: 'Đạn xuyên phá & làm choáng nặng',
    accentColor: '#F59E0B',
    cost: 110,
    baseDamage: 96,
    baseCooldown: 1.72,
    rangeTiles: 3.85,
    milestones: [
      { level: 3, name: 'Đạn Phá Thành 75%', summary: 'Xuyên 75% giáp & nổ sóng xung kích 55px' },
      { level: 5, name: 'Chấn Động Làm Choáng', summary: 'Làm choáng mục tiêu 0.55s & nổ lan 75px' },
      { level: 7, name: 'Pháo Hạm Nòng Kép', summary: 'Bắn 2 quả đại bác xuyên giáp liên tiếp' },
      { level: 10, name: 'Đại Bác Titan Hủy Diệt', summary: '3 quả đại bác 100% xuyên giáp + choáng 0.8s + nổ 105px' },
    ],
  },
  {
    type: 'plasma',
    hotkey: 'x',
    name: 'Súng Plasma Xoáy',
    shortName: 'Plasma',
    roleClue: 'Cầu plasma phá khiên & thiêu đốt',
    accentColor: '#EC4899',
    cost: 95,
    baseDamage: 34,
    baseCooldown: 0.62,
    rangeTiles: 3.15,
    milestones: [
      { level: 3, name: 'Lõi Plasma Phá Khiên', summary: '185% sát thương lên khiên + đốt cháy kẻ địch' },
      { level: 5, name: 'Quả Cầu Nổ Xoáy', summary: 'Nổ plasma 64px & hút nhẹ mục tiêu vào tâm' },
      { level: 7, name: 'Bão Plasma Kép', summary: 'Phóng 2 cầu plasma hồng tốc độ cao cùng lúc' },
      { level: 10, name: 'Hạch Nhân Plasma Hồng', summary: '3 cầu plasma + 240% phá khiên + nổ 92px' },
    ],
  },
  {
    type: 'cluster',
    hotkey: 'c',
    name: 'Pháo Cối Bom Bi',
    shortName: 'Bom Bi',
    roleClue: 'Rải bom bi phủ kín đường đi',
    accentColor: '#10B981',
    cost: 105,
    baseDamage: 58,
    baseCooldown: 1.45,
    rangeTiles: 4.4,
    milestones: [
      { level: 3, name: 'Mưa Bom Bi 5 Mảnh', summary: 'Phát nổ rải bom bi thứ cấp phủ vùng 85px' },
      { level: 5, name: 'Bom Napalm Diện Rộng', summary: 'Thiêu đốt DoT cực gắt mọi quái trong bán kính' },
      { level: 7, name: 'Bệ Phóng Cối Đôi', summary: 'Bắn 2 quả cối rải thảm bom bi mỗi lượt' },
      { level: 10, name: 'Oanh Tạc Thảm Xanh', summary: '3 quả cối + nổ 128px + phá 50% giáp vùng' },
    ],
  },
  {
    type: 'hunter',
    hotkey: 'v',
    name: 'Súng Săn Drone Tự Hành',
    shortName: 'Săn Drone',
    roleClue: 'Tên lửa mini tầm xa khắc chế Tàng Hình & Nhảy Pha',
    accentColor: '#22D3EE',
    cost: 90,
    baseDamage: 30,
    baseCooldown: 0.72,
    rangeTiles: 5.1,
    milestones: [
      { level: 3, name: 'Radar Phá Tàng Hình', summary: 'Bắn 2 tên lửa mini dẫn đường + 160% phá khiên' },
      { level: 5, name: 'Đạn Đuổi Chí Mạng', summary: '+35% sát thương lên Tàng Hình, Nhảy Pha & Tàu Mẹ' },
      { level: 7, name: 'Bầy Ong 3 Nòng', summary: 'Phóng 3 tên lửa truy đuổi mục tiêu liên hoàn' },
      { level: 10, name: 'Quần Đàn Hunter V10', summary: '5 tên lửa truy đuổi + 100% xuyên giáp' },
    ],
  },
];

export const PRISM_MAPS: readonly TdMapDef[] = [
  {
    id: 'sector-01',
    name: 'Màn 01 · Thung Lũng Khởi Đầu',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 8 Đợt',
    subtitle: 'Tuyến zic-zắc tinh gọn — mỗi đợt kéo dài x2 để nâng cấp súng lên Lv10.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 170,
    startCoreHp: 20,
    totalWaves: 8,
    path: [
      { col: 0, row: 2 },
      { col: 3, row: 2 },
      { col: 3, row: 6 },
      { col: 6, row: 6 },
      { col: 6, row: 1 },
      { col: 9, row: 1 },
      { col: 9, row: 5 },
      { col: 11, row: 5 },
    ],
    walls: [
      { col: 1, row: 4 },
      { col: 4, row: 4 },
      { col: 8, row: 3 },
    ],
  },
  {
    id: 'sector-02',
    name: 'Màn 02 · Giao Lộ Ma Trận',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 8 Đợt',
    subtitle: 'Hai khúc cua sâu đối xứng — đặt Phun Lửa + Băng Cryo ngay trọng tâm để khóa chặt quái.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 180,
    startCoreHp: 20,
    totalWaves: 8,
    path: [
      { col: 0, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 6 },
      { col: 8, row: 6 },
      { col: 8, row: 1 },
      { col: 11, row: 1 },
    ],
    walls: [
      { col: 5, row: 3 },
      { col: 6, row: 3 },
    ],
  },
  {
    id: 'sector-03',
    name: 'Màn 03 · Lò Rèn Huyết Thép',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 9 Đợt',
    subtitle: 'Bức tường thép chắn giữa bản đồ — tận dụng Tên Lửa & Hố Đen bắn vượt tường.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 190,
    startCoreHp: 20,
    totalWaves: 9,
    path: [
      { col: 0, row: 6 },
      { col: 2, row: 6 },
      { col: 2, row: 1 },
      { col: 9, row: 1 },
      { col: 9, row: 6 },
      { col: 11, row: 6 },
    ],
    walls: [
      { col: 4, row: 3 },
      { col: 5, row: 3 },
      { col: 6, row: 3 },
      { col: 7, row: 3 },
    ],
  },
  {
    id: 'sector-04',
    name: 'Màn 04 · Đại Lộ Hư Không',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 9 Đợt',
    subtitle: 'Đường thẳng dài hai tầng — thiên đường của Pháo Railgun xuyên cả hàng Thiết Giáp.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 200,
    startCoreHp: 20,
    totalWaves: 9,
    path: [
      { col: 0, row: 1 },
      { col: 10, row: 1 },
      { col: 10, row: 4 },
      { col: 2, row: 4 },
      { col: 2, row: 6 },
      { col: 11, row: 6 },
    ],
    walls: [
      { col: 5, row: 2 },
      { col: 6, row: 2 },
    ],
  },
  {
    id: 'sector-05',
    name: 'Màn 05 · Sa Mạc Răng Cưa',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 10 Đợt',
    subtitle: 'Bốn khúc cua răng cưa liên hoàn — dùng Tesla ngắt chiêu Kẻ Nhảy Pha và Tàu Yểm Trợ.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 210,
    startCoreHp: 20,
    totalWaves: 10,
    path: [
      { col: 0, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 5 },
      { col: 6, row: 5 },
      { col: 6, row: 1 },
      { col: 9, row: 1 },
      { col: 9, row: 6 },
      { col: 11, row: 6 },
    ],
    walls: [
      { col: 4, row: 3 },
      { col: 7, row: 3 },
    ],
  },
  {
    id: 'sector-06',
    name: 'Màn 06 · Lõi Băng Cực Quang',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 11 Đợt',
    subtitle: 'Đường xoắn ốc hội tụ vào Lõi giữa bản đồ — giữ nhịp sát thương xuyên suốt 11+ đợt dài.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 220,
    startCoreHp: 20,
    totalWaves: 11,
    path: [
      { col: 0, row: 6 },
      { col: 10, row: 6 },
      { col: 10, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 4 },
      { col: 7, row: 4 },
    ],
    walls: [
      { col: 4, row: 2 },
      { col: 8, row: 2 },
    ],
  },
  {
    id: 'sector-07',
    name: 'Màn 07 · Xoáy Lốc Bào Mòn',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 11 Đợt',
    subtitle: 'Quái đi qua trung tâm 2 lần — nâng cấp Pháo Phun Lửa & Hố Đen để hủy diệt hàng loạt.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 230,
    startCoreHp: 22,
    totalWaves: 11,
    path: [
      { col: 0, row: 3 },
      { col: 9, row: 3 },
      { col: 9, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 6 },
      { col: 10, row: 6 },
      { col: 10, row: 4 },
      { col: 11, row: 4 },
    ],
    walls: [
      { col: 5, row: 4 },
      { col: 7, row: 4 },
    ],
  },
  {
    id: 'sector-08',
    name: 'Màn 08 · Pháo Đài Kép Titan',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 12 Đợt',
    subtitle: 'Tuyến hào chữ U kép bọc thép đối đầu liên quân Thiết Giáp & Khiên Aegis.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 240,
    startCoreHp: 22,
    totalWaves: 12,
    path: [
      { col: 0, row: 1 },
      { col: 5, row: 1 },
      { col: 5, row: 6 },
      { col: 1, row: 6 },
      { col: 1, row: 4 },
      { col: 8, row: 4 },
      { col: 8, row: 2 },
      { col: 11, row: 2 },
    ],
    walls: [
      { col: 3, row: 2 },
      { col: 7, row: 6 },
    ],
  },
  {
    id: 'sector-09',
    name: 'Màn 09 · Ma Trận Tam Giáp',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 13 Đợt',
    subtitle: 'Ba bậc thang hỏa lực — kết hợp Cryo Giòn Vỡ Lv5+ cùng Vulcan & Railgun.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 250,
    startCoreHp: 22,
    totalWaves: 13,
    path: [
      { col: 0, row: 5 },
      { col: 3, row: 5 },
      { col: 3, row: 2 },
      { col: 6, row: 2 },
      { col: 6, row: 6 },
      { col: 9, row: 6 },
      { col: 9, row: 1 },
      { col: 11, row: 1 },
    ],
    walls: [
      { col: 4, row: 4 },
      { col: 8, row: 3 },
    ],
  },
  {
    id: 'sector-10',
    name: 'Màn 10 · Hẻm Núi Thiên Thạch',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 13 Đợt',
    subtitle: 'Đá chắn chia đôi sườn núi — bố trí pháo tầm xa ở hai đầu và Shrapnel ở các khúc gắt.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 265,
    startCoreHp: 22,
    totalWaves: 13,
    path: [
      { col: 0, row: 2 },
      { col: 2, row: 2 },
      { col: 2, row: 6 },
      { col: 5, row: 6 },
      { col: 5, row: 1 },
      { col: 8, row: 1 },
      { col: 8, row: 6 },
      { col: 10, row: 6 },
      { col: 10, row: 3 },
      { col: 11, row: 3 },
    ],
    walls: [
      { col: 3, row: 4 },
      { col: 7, row: 4 },
    ],
  },
  {
    id: 'sector-11',
    name: 'Màn 11 · Cầu Băng Vỡ Vụn',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 14 Đợt',
    subtitle: 'Hành lang hẹp băng giá — quái chạy cực nhanh, buộc phải nâng Cryo & Tesla lên Lv7+.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 275,
    startCoreHp: 24,
    totalWaves: 14,
    path: [
      { col: 0, row: 0 },
      { col: 10, row: 0 },
      { col: 10, row: 3 },
      { col: 1, row: 3 },
      { col: 1, row: 7 },
      { col: 11, row: 7 },
    ],
    walls: [
      { col: 4, row: 1 },
      { col: 7, row: 1 },
      { col: 5, row: 5 },
    ],
  },
  {
    id: 'sector-12',
    name: 'Màn 12 · Lò Luyện Ngục Hỏa',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 14 Đợt',
    subtitle: 'Đường chữ M ngược cắt chéo — dồn sát thương nổ chùm tên lửa ở 3 đỉnh tam giác.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 285,
    startCoreHp: 24,
    totalWaves: 14,
    path: [
      { col: 0, row: 7 },
      { col: 2, row: 7 },
      { col: 2, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 5 },
      { col: 8, row: 5 },
      { col: 8, row: 1 },
      { col: 11, row: 1 },
    ],
    walls: [
      { col: 3, row: 4 },
      { col: 6, row: 3 },
      { col: 9, row: 4 },
    ],
  },
  {
    id: 'sector-13',
    name: 'Màn 13 · Tổ Ong Bóng Đêm',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 15 Đợt',
    subtitle: 'Nhiều cụm vách chắn chia ô — chọn lọc vị trí vàng cho Pháo Cối Hố Đen Lv10.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 300,
    startCoreHp: 24,
    totalWaves: 15,
    path: [
      { col: 1, row: 0 },
      { col: 1, row: 5 },
      { col: 4, row: 5 },
      { col: 4, row: 1 },
      { col: 7, row: 1 },
      { col: 7, row: 6 },
      { col: 10, row: 6 },
      { col: 10, row: 2 },
      { col: 11, row: 2 },
    ],
    walls: [
      { col: 2, row: 3 },
      { col: 5, row: 3 },
      { col: 8, row: 4 },
    ],
  },
  {
    id: 'sector-14',
    name: 'Màn 14 · Tuyến Phòng Thủ Omega',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 16 Đợt',
    subtitle: 'Hành lang tấn công trực diện dồn dập — cân bằng hoàn hảo giữa công đơn thể & AoE.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 315,
    startCoreHp: 24,
    totalWaves: 16,
    path: [
      { col: 0, row: 4 },
      { col: 3, row: 4 },
      { col: 3, row: 1 },
      { col: 7, row: 1 },
      { col: 7, row: 6 },
      { col: 11, row: 6 },
    ],
    walls: [
      { col: 5, row: 3 },
      { col: 5, row: 4 },
      { col: 9, row: 4 },
    ],
  },
  {
    id: 'sector-15',
    name: 'Màn 15 · Vành Đai Sinh Tử',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 17 Đợt',
    subtitle: 'Đoàn quân Boss & Khiên Aegis hành quân liên tục — cần tối thiểu 3–4 súng đạt Lv10!',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 330,
    startCoreHp: 25,
    totalWaves: 17,
    path: [
      { col: 0, row: 1 },
      { col: 10, row: 1 },
      { col: 10, row: 6 },
      { col: 2, row: 6 },
      { col: 2, row: 3 },
      { col: 8, row: 3 },
      { col: 8, row: 4 },
      { col: 11, row: 4 },
    ],
    walls: [
      { col: 4, row: 4 },
      { col: 6, row: 4 },
    ],
  },
  {
    id: 'sector-16',
    name: 'Màn 16 · Đế Chế Hư Không',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 18 Đợt',
    subtitle: 'Chiến dịch 18–21 đợt tối thượng — mỗi đợt dài gấp đôi & độ khó cực đại cho pháo đài Lv10!',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 350,
    startCoreHp: 26,
    totalWaves: 18,
    path: [
      { col: 0, row: 6 },
      { col: 4, row: 6 },
      { col: 4, row: 1 },
      { col: 1, row: 1 },
      { col: 1, row: 3 },
      { col: 9, row: 3 },
      { col: 9, row: 6 },
      { col: 11, row: 6 },
    ],
    walls: [
      { col: 6, row: 1 },
      { col: 6, row: 5 },
      { col: 2, row: 4 },
    ],
  },
];

export function gridToWorldCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function getMapPathTileSet(map: TdMapDef): Set<string> {
  const occupied = new Set<string>();
  for (let i = 0; i < map.path.length - 1; i++) {
    const a = map.path[i];
    const b = map.path[i + 1];
    const dc = Math.sign(b.col - a.col);
    const dr = Math.sign(b.row - a.row);
    let c = a.col;
    let r = a.row;
    occupied.add(`${c},${r}`);
    while (c !== b.col || r !== b.row) {
      c += dc;
      r += dr;
      occupied.add(`${c},${r}`);
    }
  }
  return occupied;
}

export function getTileKind(map: TdMapDef, col: number, row: number): TileKind {
  if (col < 0 || col >= map.cols || row < 0 || row >= map.rows) return 'wall';
  const start = map.path[0];
  const end = map.path[map.path.length - 1];
  if (col === start.col && row === start.row) return 'spawn';
  if (col === end.col && row === end.row) return 'core';
  if (map.walls.some((w) => w.col === col && w.row === row)) return 'wall';
  const pathSet = getMapPathTileSet(map);
  if (pathSet.has(`${col},${row}`)) return 'path';
  return 'empty';
}

export function getGunCatalogItem(type: GunType): GunCatalogItem {
  return GUN_CATALOG.find((g) => g.type === type) ?? GUN_CATALOG[0];
}

/**
 * Upgrade cost from `level` to `level + 1` (supports levels 1..9 -> 10, null at MAX Lv10).
 */
export function getGunUpgradeCost(type: GunType, level: number): number | null {
  if (level >= MAX_GUN_LEVEL || level < 1) return null;
  const item = getGunCatalogItem(type);
  const stepFactors = [0.58, 0.72, 0.9, 1.12, 1.38, 1.72, 2.15, 2.65, 3.25];
  const factor = stepFactors[level - 1] ?? 3.25;
  return Math.round((item.cost * factor) / 5) * 5;
}

export function getGunTotalInvested(type: GunType, level: number): number {
  const item = getGunCatalogItem(type);
  let total = item.cost;
  for (let lv = 1; lv < Math.min(MAX_GUN_LEVEL, level); lv++) {
    const up = getGunUpgradeCost(type, lv);
    if (up) total += up;
  }
  return total;
}

export function getGunSellRefund(gun: Pick<PlacedGun, 'type' | 'level'>): number {
  return Math.round(getGunTotalInvested(gun.type, gun.level) * 0.72);
}

/**
 * Computes deterministic combat stats, visual tier, and unlocked milestone skills for Lv1..10.
 */
export function getGunCombatProfile(type: GunType, rawLevel: number): GunCombatProfile {
  const level = Math.max(1, Math.min(MAX_GUN_LEVEL, Math.round(rawLevel)));
  const item = getGunCatalogItem(type);

  // Escalating damage multiplier across Lv1 -> Lv10 (~8.2x raw damage at Lv10 + ROF + multishot = truly godlike!)
  const lvOffset = level - 1;
  const dmgMult = 1 + lvOffset * 0.34 + Math.pow(lvOffset, 1.55) * 0.16;
  const rofMult = 1 + lvOffset * 0.085 + (level === 10 ? 0.18 : 0);
  const rangeBonusTiles = lvOffset * 0.12 + (level >= 7 ? 0.18 : 0) + (level === 10 ? 0.25 : 0);

  const damage = Math.round(item.baseDamage * dmgMult);
  const cooldownSec = Number((item.baseCooldown / rofMult).toFixed(3));
  const rangeTiles = Number((item.rangeTiles + rangeBonusTiles).toFixed(2));
  const rangePx = Math.round(rangeTiles * TILE_SIZE);

  let armorPierce = 0.1 + lvOffset * 0.03;
  let shieldMult = 1;
  let splashRadius = 0;
  let projectilesPerShot = 1;
  let chainCount = 1;
  let slowPct = 0;
  let brittleBonus = 0;
  let burnDps = 0;
  let pullForce = 0;

  if (type === 'gatling') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.45 + (level - 3) * 0.06 : 0.12;
    projectilesPerShot = level >= 10 ? 5 : level >= 7 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = level >= 7 ? 28 + (level - 7) * 5 : 0;
    shieldMult = level >= 7 ? 1.25 : 1;
  } else if (type === 'shotgun') {
    projectilesPerShot = level >= 10 ? 11 : level >= 7 ? 8 : level >= 3 ? 7 : 5;
    armorPierce = level >= 5 ? 0.4 + (level - 5) * 0.08 : 0.15;
    burnDps = level >= 5 ? Math.round(damage * 0.65) : 0;
    shieldMult = 1.15;
  } else if (type === 'flamer') {
    armorPierce = level >= 5 ? 0.85 : 0.55;
    burnDps = Math.round(damage * (level >= 3 ? 0.95 : 0.65));
    slowPct = level >= 7 ? 0.25 : 0;
    shieldMult = level >= 5 ? 1.25 : 1;
  } else if (type === 'cryo') {
    armorPierce = 0.7;
    slowPct = level >= 10 ? 0.65 : level >= 3 ? 0.55 : 0.42;
    brittleBonus = level >= 10 ? 0.42 : level >= 5 ? 0.25 + (level - 5) * 0.03 : 0;
    shieldMult = 1.2;
  } else if (type === 'tesla') {
    armorPierce = 0.8;
    chainCount = level >= 10 ? 9 : level >= 3 ? 4 + Math.floor((level - 2) * 0.6) : 3;
    shieldMult = level >= 5 ? 1.85 + (level - 5) * 0.08 : 1.3;
    slowPct = 0.32 + lvOffset * 0.025;
    splashRadius = level >= 10 ? 48 : 0;
  } else if (type === 'missile') {
    armorPierce = 0.5 + lvOffset * 0.04;
    projectilesPerShot = level >= 10 ? 4 : level >= 5 ? 2 : 1;
    splashRadius = 74 + lvOffset * 6 + (level >= 3 ? 16 : 0);
    shieldMult = 1.2;
  } else if (type === 'railgun') {
    armorPierce = level >= 3 ? 1 : 0.65;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    shieldMult = level >= 5 ? 2.0 : 1.4;
    splashRadius = level >= 7 ? 46 + (level - 7) * 8 : 0;
  } else if (type === 'mortar') {
    armorPierce = 0.7 + lvOffset * 0.03;
    projectilesPerShot = level >= 10 ? 2 : 1;
    splashRadius = 92 + lvOffset * 6 + (level >= 7 ? 16 : 0);
    pullForce = level >= 3 ? 16 + (level - 2) * 3 : 8;
    slowPct = level >= 5 ? 0.45 : 0.2;
    burnDps = level >= 5 ? Math.round(damage * 0.22) : 0;
  } else if (type === 'sniper') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.85 : 0.55;
    projectilesPerShot = level >= 10 ? 2 : 1;
    shieldMult = level >= 3 ? 1.45 : 1.15;
    splashRadius = 0;
  } else if (type === 'acid') {
    armorPierce = 0.9;
    projectilesPerShot = level >= 7 ? 2 : 1;
    splashRadius = level >= 5 ? 74 : 56 + lvOffset * 3;
    slowPct = level >= 10 ? 0.45 : level >= 5 ? 0.34 : 0.24;
    burnDps = Math.round(damage * (level >= 10 ? 0.88 : 0.62));
    shieldMult = 1.1;
  } else if (type === 'saw') {
    armorPierce = level >= 5 ? 0.68 : 0.38;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    chainCount = level >= 10 ? 11 : level >= 7 ? 7 : level >= 3 ? 5 : 3;
    burnDps = level >= 5 ? Math.round(damage * 0.45) : 0;
    shieldMult = 1.15;
  } else if (type === 'beacon') {
    armorPierce = 0.75;
    splashRadius = Math.round((item.rangeTiles + rangeBonusTiles) * TILE_SIZE);
    slowPct = level >= 5 ? 0.22 : 0;
    shieldMult = 1.35;
  } else if (type === 'cannon') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.75 : 0.45;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 105 : level >= 5 ? 75 : level >= 3 ? 55 : 36;
    shieldMult = 1.25;
  } else if (type === 'plasma') {
    armorPierce = 0.55 + lvOffset * 0.04;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 92 : level >= 5 ? 64 : 38;
    shieldMult = level >= 10 ? 2.4 : level >= 3 ? 1.85 : 1.45;
    burnDps = level >= 3 ? Math.round(damage * 0.55) : Math.round(damage * 0.25);
    pullForce = level >= 5 ? 10 : 0;
  } else if (type === 'cluster') {
    armorPierce = level >= 10 ? 0.65 : 0.38;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 128 : level >= 3 ? 88 + (level - 3) * 6 : 68;
    burnDps = level >= 5 ? Math.round(damage * 0.68) : 0;
    shieldMult = 1.15;
  } else if (type === 'hunter') {
    armorPierce = level >= 10 ? 1 : 0.45 + lvOffset * 0.05;
    projectilesPerShot = level >= 10 ? 5 : level >= 7 ? 3 : level >= 3 ? 2 : 1;
    shieldMult = level >= 3 ? 1.6 : 1.25;
    splashRadius = 24;
  }

  const visualTier: 1 | 2 | 3 | 4 =
    level >= 10 ? 4 : level >= 7 ? 3 : level >= 4 ? 2 : 1;
  const tierLabel =
    visualTier === 4
      ? 'MYTHIC LV10'
      : visualTier === 3
        ? `HYPER LV${level}`
        : visualTier === 2
          ? `EVOLVED LV${level}`
          : `BASE LV${level}`;

  const effectiveShots =
    type === 'shotgun'
      ? projectilesPerShot * 0.65
      : type === 'tesla' || type === 'saw'
        ? projectilesPerShot * Math.min(3.4, 1 + (chainCount - 1) * 0.32)
        : type === 'sniper'
          ? projectilesPerShot * (level >= 10 ? 1.85 : level >= 5 ? 1.55 : 1.2)
          : projectilesPerShot;
  const dpsEstimate = Math.round((damage * effectiveShots) / cooldownSec);

  const unlockedSkills = item.milestones.filter((m) => level >= m.level);
  const nextSkill = item.milestones.find((m) => m.level > level) ?? null;

  return {
    level,
    damage,
    cooldownSec,
    rangeTiles,
    rangePx,
    dpsEstimate,
    armorPierce,
    shieldMult,
    splashRadius,
    projectilesPerShot,
    chainCount,
    slowPct,
    brittleBonus,
    burnDps,
    pullForce,
    visualTier,
    tierLabel,
    unlockedSkills,
    nextSkill,
  };
}

export function computeBeaconBuffAtTile(
  guns: readonly PlacedGun[],
  col: number,
  row: number
): { speedMult: number; damageMult: number } {
  let speedBonus = 0;
  let dmgBonus = 0;
  const targetPt = gridToWorldCenter(col, row);

  for (const g of guns) {
    if (g.type !== 'beacon') continue;
    if (g.col === col && g.row === row) continue;
    const beaconProfile = getGunCombatProfile('beacon', g.level);
    const gPt = gridToWorldCenter(g.col, g.row);
    const dist = Math.hypot(gPt.x - targetPt.x, gPt.y - targetPt.y);
    if (dist <= beaconProfile.rangePx + 4) {
      const sp = g.level >= 10 ? 0.45 : g.level >= 7 ? 0.32 : g.level >= 3 ? 0.2 : 0.12;
      const dm = g.level >= 10 ? 0.38 : g.level >= 7 ? 0.24 : g.level >= 3 ? 0.12 : 0.08;
      speedBonus += sp;
      dmgBonus += dm;
    }
  }

  return {
    speedMult: Number(Math.min(1.55, 1 + speedBonus).toFixed(2)),
    damageMult: Number(Math.min(1.5, 1 + dmgBonus).toFixed(2)),
  };
}

export interface WaveSpawnItem {
  readonly kind: EnemyKind;
  readonly delaySec: number;
  readonly isElite?: boolean;
}

/**
 * Halved wave count (8..21) with 2x longer active duration per wave and accelerated archetype/boss escalation.
 */
export function buildWaveSpawns(
  waveNumber: number,
  totalWaves = 12,
  difficulty: DifficultyId = 'normal',
  mode: GameModeId = 'campaign'
): WaveSpawnItem[] {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];
  const modeCfg = GAME_MODE_CONFIGS[mode];
  const items: WaveSpawnItem[] = [];
  // Ramp difficulty bonus quickly over waves 1..3 for halved wave campaigns
  const rampedBonus = Math.round(diffCfg.waveCountBonus * Math.min(1, Math.max(0, waveNumber - 1) / 2.5));
  const rawCount =
    20 +
    Math.round(waveNumber * 4.0) +
    (waveNumber >= 5 ? (waveNumber - 4) * 2 : 0) +
    rampedBonus;
  const count =
    mode === 'boss_rush'
      ? Math.max(10, Math.round(rawCount * 0.52))
      : mode === 'blitz'
        ? Math.max(24, Math.round(rawCount * 1.2))
        : rawCount;
  let elapsed = 0.2;

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
    if (waveNumber >= 1 && waveNumber === 1 && i >= count - 3 && difficulty !== 'easy') kind = 'armored';
    if (waveNumber >= 2 && i % 4 === 2) kind = 'armored';
    if (waveNumber >= 2 && i % 5 === 1) kind = 'splitter';
    if (waveNumber >= 2 && i % 6 === 3) kind = 'stealth';
    if (waveNumber >= 3 && i % 6 === 4) kind = 'healer';
    if (waveNumber >= 3 && i % 6 === 5) kind = 'teleporter';
    if (waveNumber >= 3 && i % 5 === 0 && i > 0) kind = 'shieldbearer';
    if (waveNumber >= 2 && i % 7 === 6) kind = 'berserker';
    if (waveNumber >= 4 && i % 8 === 7) kind = 'leech';
    if (waveNumber >= 4 && i % 9 === 8) kind = 'juggernaut';
    if (waveNumber >= 5 && i % 10 === 9) kind = 'summoner';

    if (mode === 'boss_rush') {
      if (i % 5 === 4 || i === count - 1) {
        kind = 'boss';
      } else if (i % 4 === 0) {
        kind = 'juggernaut';
      } else if (i % 4 === 1) {
        kind = 'summoner';
      } else if (i % 4 === 2) {
        kind = 'berserker';
      } else {
        kind = 'shieldbearer';
      }
    } else {
      // Halved campaign compresses Boss & Mini-boss intervals to every 2..3 waves + final wave
      const isMiniBossWave = waveNumber >= 4 && waveNumber % 2 === 0 && i === Math.floor(count / 2);
      const isMajorBossWave =
        waveNumber === totalWaves ||
        waveNumber % 3 === 0 ||
        waveNumber >= 10;

      if ((isMajorBossWave && i === count - 1) || isMiniBossWave) {
        kind = 'boss';
      }
      if (waveNumber >= 7 && isMajorBossWave && i >= count - 2) {
        kind = 'boss';
      }
      if (waveNumber >= 12 && i >= count - (difficulty === 'hell' ? 4 : 3)) {
        kind = 'boss';
      }
    }

    const eliteModulo = Math.max(3, Math.round(6 - diffCfg.eliteChanceBoost * 12));
    const isElite =
      kind !== 'boss' &&
      ((mode === 'boss_rush' && i % 3 === 1) ||
        (waveNumber >= 3 && i % eliteModulo === eliteModulo - 1) ||
        (difficulty === 'hell' && waveNumber >= 2 && i % 5 === 4));
    items.push({ kind, delaySec: Number(elapsed.toFixed(3)), isElite });

    // ~2.0x wave duration via wider controlled lane spacing + extended squad length
    const baseGap =
      Math.max(
        0.34,
        1.18 - waveNumber * 0.025 - (difficulty === 'hell' ? 0.05 : difficulty === 'hard' ? 0.025 : 0)
      ) / modeCfg.spawnRateMult;
    elapsed +=
      kind === 'splitter' || kind === 'berserker'
        ? baseGap * 0.78
        : kind === 'stealth' || kind === 'teleporter'
          ? baseGap * 0.85
          : kind === 'boss' || kind === 'juggernaut'
            ? baseGap * 1.35
            : baseGap;
  }
  return items;
}

/**
 * Steeper per-wave scaling (~1.95x wave slope) so halved 8..21 wave campaigns reach full late-game intensity.
 * Includes calibrated W1-W2 opening ramp on Hard/Hell so longer waves remain winnable.
 */
export function createEnemyForWave(
  id: number,
  kind: EnemyKind,
  waveNumber: number,
  map: TdMapDef,
  isElite = false,
  difficulty: DifficultyId = 'normal',
  mode: GameModeId = 'campaign'
): TdEnemy {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];
  const modeCfg = GAME_MODE_CONFIGS[mode];
  const spawnPt = gridToWorldCenter(map.path[0].col, map.path[0].row);
  const nextPt = gridToWorldCenter(map.path[1].col, map.path[1].row);
  const initialHeading = Math.atan2(nextPt.y - spawnPt.y, nextPt.x - spawnPt.x);

  const effectiveWave = 1 + (waveNumber - 1) * 1.95;
  const baseScale =
    1.15 + (effectiveWave - 1) * 0.44 + Math.pow(Math.max(0, effectiveWave - 2), 1.46) * 0.28;
  const openingGrace =
    difficulty === 'hell' && waveNumber <= 2
      ? waveNumber === 1
        ? 0.29
        : 0.58
      : difficulty === 'hard' && waveNumber === 1
        ? 0.56
        : 1.0;
  const bossRushEarlyDamper = mode === 'boss_rush' && waveNumber <= 2 ? 0.52 : 1.0;
  const eliteMult = isElite ? 1.55 : 1;
  const hpScale = baseScale * eliteMult * diffCfg.hpMult * openingGrace * bossRushEarlyDamper;
  const shieldScale = baseScale * eliteMult * diffCfg.shieldMult * openingGrace * bossRushEarlyDamper;
  const speedBonus = Math.min(52, effectiveWave * 1.95);
  const totalSpeedMult = diffCfg.speedMult * modeCfg.speedMult;
  const rewardScale = diffCfg.rewardMult * modeCfg.rewardMult * (isElite ? 1.35 : 1);
  const scoreMultTotal = diffCfg.scoreMult * modeCfg.scoreMult;
  const armorAdd = waveNumber === 1 ? diffCfg.armorBonus * 0.3 : diffCfg.armorBonus;

  const base = {
    id,
    kind,
    x: spawnPt.x,
    y: spawnPt.y,
    heading: initialHeading,
    waypointIndex: 1,
    slowTimer: 0,
    slowFactor: 1,
    brittleBonus: 0,
    burnTimer: 0,
    burnDps: 0,
    armorShred: 0,
    stunTimer: 0,
    abilityCooldown: 2.3,
    hitFlash: 0,
    koTimer: 0,
    isElite,
    enraged: false,
  };

  if (kind === 'armored') {
    const hp = Math.round(280 * hpScale);
    const shield = Math.round(75 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (49 + speedBonus * 0.7) * totalSpeedMult,
      radius: 17,
      reward: Math.max(8, Math.round((15 + Math.floor(effectiveWave * 0.55)) * rewardScale)),
      scoreValue: Math.round(65 * scoreMultTotal),
      armorRatio: Math.min(0.78, 0.54 + armorAdd),
    };
  }

  if (kind === 'splitter') {
    const hp = Math.round(115 * hpScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield: difficulty === 'hell' && waveNumber >= 4 ? Math.round(25 * shieldScale) : 0,
      maxShield: difficulty === 'hell' && waveNumber >= 4 ? Math.round(25 * shieldScale) : 0,
      speed: (84 + speedBonus) * totalSpeedMult,
      radius: 14,
      reward: Math.max(6, Math.round((11 + Math.floor(effectiveWave * 0.4)) * rewardScale)),
      scoreValue: Math.round(45 * scoreMultTotal),
      armorRatio: Math.min(0.45, 0.12 + armorAdd),
    };
  }

  if (kind === 'stealth') {
    const hp = Math.round(152 * hpScale);
    const shield = Math.round(72 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (100 + speedBonus) * totalSpeedMult,
      radius: 14,
      reward: Math.max(7, Math.round((14 + Math.floor(effectiveWave * 0.5)) * rewardScale)),
      scoreValue: Math.round(58 * scoreMultTotal),
      armorRatio: Math.min(0.55, 0.24 + armorAdd),
    };
  }

  if (kind === 'healer') {
    const hp = Math.round(215 * hpScale);
    const shield = Math.round(95 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (56 + speedBonus * 0.75) * totalSpeedMult,
      radius: 16,
      reward: Math.max(9, Math.round((19 + Math.floor(effectiveWave * 0.65)) * rewardScale)),
      scoreValue: Math.round(78 * scoreMultTotal),
      armorRatio: Math.min(0.55, 0.22 + armorAdd),
      abilityCooldown: 1.85,
    };
  }

  if (kind === 'teleporter') {
    const hp = Math.round(175 * hpScale);
    const shield = Math.round(90 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (80 + speedBonus * 0.9) * totalSpeedMult,
      radius: 15,
      reward: Math.max(8, Math.round((17 + Math.floor(effectiveWave * 0.55)) * rewardScale)),
      scoreValue: Math.round(72 * scoreMultTotal),
      armorRatio: Math.min(0.5, 0.2 + armorAdd),
      abilityCooldown: difficulty === 'hell' ? 2.4 : 2.9,
    };
  }

  if (kind === 'shieldbearer') {
    const hp = Math.round(300 * hpScale);
    const shield = Math.round(265 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (46 + speedBonus * 0.65) * totalSpeedMult,
      radius: 18,
      reward: Math.max(10, Math.round((21 + Math.floor(effectiveWave * 0.75)) * rewardScale)),
      scoreValue: Math.round(90 * scoreMultTotal),
      armorRatio: Math.min(0.75, 0.48 + armorAdd),
      abilityCooldown: 2.9,
    };
  }

  if (kind === 'berserker') {
    const hp = Math.round(210 * hpScale);
    const shield = Math.round(35 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (78 + speedBonus * 0.85) * totalSpeedMult,
      radius: 15,
      reward: Math.max(8, Math.round((16 + Math.floor(effectiveWave * 0.52)) * rewardScale)),
      scoreValue: Math.round(68 * scoreMultTotal),
      armorRatio: Math.min(0.5, 0.24 + armorAdd),
    };
  }

  if (kind === 'juggernaut') {
    const hp = Math.round(520 * hpScale);
    const shield = Math.round(150 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (36 + speedBonus * 0.45) * totalSpeedMult,
      radius: 21,
      reward: Math.max(14, Math.round((28 + Math.floor(effectiveWave * 0.95)) * rewardScale)),
      scoreValue: Math.round(125 * scoreMultTotal),
      armorRatio: Math.min(0.8, 0.64 + armorAdd),
    };
  }

  if (kind === 'summoner') {
    const hp = Math.round(265 * hpScale);
    const shield = Math.round(135 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (52 + speedBonus * 0.65) * totalSpeedMult,
      radius: 18,
      reward: Math.max(12, Math.round((25 + Math.floor(effectiveWave * 0.85)) * rewardScale)),
      scoreValue: Math.round(108 * scoreMultTotal),
      armorRatio: Math.min(0.55, 0.3 + armorAdd),
      abilityCooldown: 3.1,
    };
  }

  if (kind === 'leech') {
    const hp = Math.round(195 * hpScale);
    const shield = Math.round(165 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (74 + speedBonus * 0.85) * totalSpeedMult,
      radius: 16,
      reward: Math.max(10, Math.round((20 + Math.floor(effectiveWave * 0.7)) * rewardScale)),
      scoreValue: Math.round(92 * scoreMultTotal),
      armorRatio: Math.min(0.55, 0.28 + armorAdd),
      abilityCooldown: 2.6,
    };
  }

  if (kind === 'boss') {
    const hp = Math.round(1180 * hpScale);
    const shield = Math.round(420 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (39 + speedBonus * 0.55) * totalSpeedMult,
      radius: 25,
      reward: Math.max(30, Math.round((78 + effectiveWave * 3.2) * rewardScale)),
      scoreValue: Math.round(360 * scoreMultTotal),
      armorRatio: Math.min(0.76, 0.48 + armorAdd),
      abilityCooldown: 3.1,
    };
  }

  // 'scout'
  const hp = Math.round(126 * hpScale);
  const hasScoutShield =
    waveNumber >= 3 ||
    (difficulty === 'hard' && waveNumber >= 2) ||
    (difficulty === 'hell' && waveNumber >= 2);
  return {
    ...base,
    hp,
    maxHp: hp,
    shield: hasScoutShield ? Math.round(28 * shieldScale) : 0,
    maxShield: hasScoutShield ? Math.round(28 * shieldScale) : 0,
    speed: (70 + speedBonus * 0.9) * totalSpeedMult,
    radius: 14,
    reward: Math.max(7, Math.round((13 + Math.floor(effectiveWave * 0.42)) * rewardScale)),
    scoreValue: Math.round(44 * scoreMultTotal),
    armorRatio: Math.min(0.45, (waveNumber >= 3 ? 0.16 : 0) + armorAdd),
  };
}

export const MAX_CORRIDOR_LATERAL_PX = 8;

export function getMaxLateralOffset(enemy: Pick<TdEnemy, 'radius'>): number {
  return Math.max(3, Math.min(MAX_CORRIDOR_LATERAL_PX, 24 - enemy.radius));
}

function getSegmentBasis(
  map: TdMapDef,
  waypointIndex: number
): {
  a: { x: number; y: number };
  b: { x: number; y: number };
  segLen: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
} | null {
  if (map.path.length < 2) return null;
  const idx = Math.max(1, Math.min(map.path.length - 1, waypointIndex));
  const a = gridToWorldCenter(map.path[idx - 1].col, map.path[idx - 1].row);
  const b = gridToWorldCenter(map.path[idx].col, map.path[idx].row);
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const segLen = Math.hypot(abx, aby);
  if (segLen < 0.001) return null;
  const tx = abx / segLen;
  const ty = aby / segLen;
  return { a, b, segLen, tx, ty, nx: -ty, ny: tx };
}

/**
 * Keeps any enemy strictly inside its orthogonal track corridor so crowds and AoE effects
 * never spill onto buildable tiles or walls, nor cut corners diagonally.
 */
export function clampEnemyToTrackCorridor(enemy: TdEnemy, map: TdMapDef): void {
  const basis = getSegmentBasis(map, enemy.waypointIndex);
  if (!basis) return;
  const { a, segLen, tx, ty, nx, ny } = basis;
  const relX = enemy.x - a.x;
  const relY = enemy.y - a.y;
  const proj = Math.max(0, Math.min(segLen, relX * tx + relY * ty));
  const maxLat = getMaxLateralOffset(enemy);
  const lat = Math.max(-maxLat, Math.min(maxLat, relX * nx + relY * ny));
  enemy.x = a.x + tx * proj + nx * lat;
  enemy.y = a.y + ty * proj + ny * lat;
}

/**
 * Applies vortex/black-hole pull strictly projected along the active track segment
 * while pulling lateral displacement back toward the lane centerline.
 */
export function pullEnemyAlongTrack(
  enemy: TdEnemy,
  map: TdMapDef,
  anchorX: number,
  anchorY: number,
  pullForce: number
): void {
  if (pullForce <= 0) return;
  const basis = getSegmentBasis(map, enemy.waypointIndex);
  if (!basis) return;
  const { a, segLen, tx, ty, nx, ny } = basis;
  const anchorProj = Math.max(0, Math.min(segLen, (anchorX - a.x) * tx + (anchorY - a.y) * ty));
  const enemyProj = Math.max(0, Math.min(segLen, (enemy.x - a.x) * tx + (enemy.y - a.y) * ty));
  const diffProj = anchorProj - enemyProj;
  if (Math.abs(diffProj) <= 2) return;

  const step = Math.sign(diffProj) * Math.min(Math.abs(diffProj), pullForce);
  const nextProj = Math.max(0, Math.min(segLen, enemyProj + step));
  const curLat = (enemy.x - a.x) * nx + (enemy.y - a.y) * ny;
  const nextLat = curLat * 0.5;
  enemy.x = a.x + tx * nextProj + nx * nextLat;
  enemy.y = a.y + ty * nextProj + ny * nextLat;
  clampEnemyToTrackCorridor(enemy, map);
}

export function advanceEnemyAlongPath(
  enemy: TdEnemy,
  map: TdMapDef,
  distancePx: number
): boolean {
  let remainingMove = distancePx;
  while (remainingMove > 0 && enemy.waypointIndex < map.path.length) {
    const basis = getSegmentBasis(map, enemy.waypointIndex);
    if (!basis) {
      enemy.waypointIndex += 1;
      continue;
    }
    const { a, b, segLen, tx, ty, nx, ny } = basis;
    const relX = enemy.x - a.x;
    const relY = enemy.y - a.y;
    const proj = Math.max(0, Math.min(segLen, relX * tx + relY * ty));
    const maxLat = getMaxLateralOffset(enemy);
    const curLat = Math.max(-maxLat, Math.min(maxLat, relX * nx + relY * ny));
    const remSeg = segLen - proj;

    enemy.heading = Math.atan2(ty, tx);

    if (remSeg <= remainingMove) {
      enemy.x = b.x;
      enemy.y = b.y;
      remainingMove -= remSeg;
      enemy.waypointIndex += 1;
    } else {
      const nextProj = proj + remainingMove;
      const nextLat = curLat * Math.max(0, 1 - remainingMove / 22);
      enemy.x = a.x + tx * nextProj + nx * nextLat;
      enemy.y = a.y + ty * nextProj + ny * nextLat;
      remainingMove = 0;
    }
  }
  return enemy.waypointIndex >= map.path.length;
}

export interface DamageHitOptions {
  armorPierce?: number; // 0..1
  shieldMult?: number;
}

export function applyDamageToEnemy(
  enemy: TdEnemy,
  rawDamage: number,
  opts: DamageHitOptions = {}
): { killed: boolean; actualDamage: number } {
  if (enemy.hp <= 0 || enemy.koTimer > 0) return { killed: false, actualDamage: 0 };

  const armorPierce = Math.max(0, Math.min(1, opts.armorPierce ?? 0));
  const shieldMult = opts.shieldMult ?? 1;
  const brittleMult = enemy.slowTimer > 0 ? 1 + enemy.brittleBonus : 1;

  // Stealth evasion damper unless slowed, burning, or stunned
  const stealthDamp =
    enemy.kind === 'stealth' && enemy.slowTimer <= 0 && enemy.burnTimer <= 0 && enemy.stunTimer <= 0
      ? 0.8
      : 1;

  let dmg = rawDamage * brittleMult * stealthDamp;
  let totalDealt = 0;

  if (enemy.shield > 0) {
    const shieldDmg = dmg * shieldMult;
    const absorbed = Math.min(enemy.shield, shieldDmg);
    enemy.shield -= absorbed;
    totalDealt += absorbed;
    const overflowRatio = shieldDmg > 0 ? Math.max(0, 1 - absorbed / shieldDmg) : 0;
    dmg = dmg * overflowRatio;
  }

  if (dmg > 0) {
    const effectiveArmor = Math.max(0, enemy.armorRatio - enemy.armorShred) * (1 - armorPierce);
    const hpDmg = dmg * (1 - effectiveArmor);
    enemy.hp -= hpDmg;
    totalDealt += hpDmg;
  }

  enemy.hitFlash = 0.1;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.koTimer = 0.28;
    return { killed: true, actualDamage: totalDealt };
  }
  return { killed: false, actualDamage: totalDealt };
}

export interface StepEnemiesOutcome {
  killedCount: number;
  energyGained: number;
  scoreGained: number;
  totalDamageDealt: number;
  healedEvents: { fromX: number; fromY: number; toX: number; toY: number; amount: number }[];
  blinkEvents: { fromX: number; fromY: number; toX: number; toY: number }[];
  shieldRegenEvents: { x: number; y: number }[];
  spawnRequests: {
    kind: EnemyKind;
    x: number;
    y: number;
    heading: number;
    waypointIndex: number;
    baseHp: number;
    speed: number;
  }[];
  leechEvents: { x: number; y: number; radius: number }[];
}

export function stepEnemies(
  enemies: TdEnemy[],
  map: TdMapDef,
  dt: number
): { coreDamageTaken: number; outcome: StepEnemiesOutcome } {
  let coreDamageTaken = 0;
  let killedCount = 0;
  let energyGained = 0;
  let scoreGained = 0;
  let totalDamageDealt = 0;
  const healedEvents: { fromX: number; fromY: number; toX: number; toY: number; amount: number }[] = [];
  const blinkEvents: { fromX: number; fromY: number; toX: number; toY: number }[] = [];
  const shieldRegenEvents: { x: number; y: number }[] = [];
  const spawnRequests: {
    kind: EnemyKind;
    x: number;
    y: number;
    heading: number;
    waypointIndex: number;
    baseHp: number;
    speed: number;
  }[] = [];
  const leechEvents: { x: number; y: number; radius: number }[] = [];

  for (const enemy of enemies) {
    if (enemy.koTimer > 0) {
      enemy.koTimer = Math.max(0, enemy.koTimer - dt);
      continue;
    }
    if (enemy.hp <= 0) continue;

    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 3.5);

    // Apply Fire Burn DoT (bypasses armor!)
    if (enemy.burnTimer > 0 && enemy.burnDps > 0) {
      enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
      const burnDmg = enemy.burnDps * dt;
      const res = applyDamageToEnemy(enemy, burnDmg, { armorPierce: 1 });
      totalDamageDealt += res.actualDamage;
      if (res.killed) {
        killedCount += 1;
        energyGained += enemy.reward;
        scoreGained += enemy.scoreValue;
        continue;
      }
    }

    // Berserker Rage trigger (<55% HP surges speed +55%)
    if (enemy.kind === 'berserker' && !enemy.enraged && enemy.hp <= enemy.maxHp * 0.55) {
      enemy.enraged = true;
      enemy.speed = Math.round(enemy.speed * 1.55);
    }

    // Special Archetype Abilities
    if (enemy.stunTimer <= 0) {
      if (enemy.kind === 'healer') {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = 2.25;
          for (const ally of enemies) {
            if (ally.id === enemy.id || ally.hp <= 0 || ally.koTimer > 0) continue;
            const dist = Math.hypot(ally.x - enemy.x, ally.y - enemy.y);
            if (dist <= 145 && ally.hp < ally.maxHp) {
              const healAmt = Math.min(ally.maxHp - ally.hp, Math.round(ally.maxHp * 0.16));
              if (healAmt > 0) {
                ally.hp += healAmt;
                healedEvents.push({
                  fromX: enemy.x,
                  fromY: enemy.y,
                  toX: ally.x,
                  toY: ally.y,
                  amount: healAmt,
                });
              }
            }
          }
        }
      } else if (enemy.kind === 'shieldbearer' || enemy.kind === 'boss') {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = enemy.kind === 'boss' ? 4.2 : 3.6;
          if (enemy.maxShield > 0 && enemy.shield < enemy.maxShield) {
            enemy.shield = Math.min(enemy.maxShield, enemy.shield + Math.round(enemy.maxShield * 0.25));
            shieldRegenEvents.push({ x: enemy.x, y: enemy.y });
          }
        }
      } else if (enemy.kind === 'teleporter' && enemy.slowTimer <= 0) {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = 3.4;
          const fromX = enemy.x;
          const fromY = enemy.y;
          const blinkedToEnd = advanceEnemyAlongPath(enemy, map, 62);
          blinkEvents.push({ fromX, fromY, toX: enemy.x, toY: enemy.y });
          if (blinkedToEnd) {
            enemy.hp = 0;
            enemy.koTimer = 0;
            coreDamageTaken += 1;
            continue;
          }
        }
      } else if (enemy.kind === 'summoner') {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = 4.2;
          const basis = getSegmentBasis(map, enemy.waypointIndex);
          for (let s = 0; s < 2; s++) {
            let spawnX = enemy.x;
            let spawnY = enemy.y;
            if (basis) {
              const relX = enemy.x - basis.a.x;
              const relY = enemy.y - basis.a.y;
              const curProj = Math.max(
                0,
                Math.min(basis.segLen, relX * basis.tx + relY * basis.ty + (s === 0 ? -6 : 6))
              );
              const curLat = Math.max(-4, Math.min(4, relX * basis.nx + relY * basis.ny + (s === 0 ? -3 : 3)));
              spawnX = basis.a.x + basis.tx * curProj + basis.nx * curLat;
              spawnY = basis.a.y + basis.ty * curProj + basis.ny * curLat;
            }
            spawnRequests.push({
              kind: 'scout',
              x: spawnX,
              y: spawnY,
              heading: enemy.heading,
              waypointIndex: enemy.waypointIndex,
              baseHp: Math.max(45, Math.round(enemy.maxHp * 0.26)),
              speed: Math.round(enemy.speed * 1.45),
            });
          }
        }
      } else if (enemy.kind === 'leech') {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = 3.4;
          leechEvents.push({ x: enemy.x, y: enemy.y, radius: 135 });
        }
      }
    }

    if (enemy.stunTimer > 0) {
      enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      continue;
    }

    if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (enemy.slowTimer <= 0) {
        enemy.slowFactor = 1;
        enemy.brittleBonus = 0;
      }
    }

    // Juggernaut resists 40% of slow effect intensity
    const rawSlowFactor = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    const speedFactor =
      enemy.kind === 'juggernaut' && rawSlowFactor < 1
        ? 1 - (1 - rawSlowFactor) * 0.6
        : rawSlowFactor;
    const remainingMove = enemy.speed * speedFactor * dt;

    const reachedEnd = advanceEnemyAlongPath(enemy, map, remainingMove);
    if (reachedEnd) {
      enemy.hp = 0;
      enemy.koTimer = 0;
      coreDamageTaken +=
        enemy.kind === 'boss'
          ? 5
          : enemy.kind === 'juggernaut'
            ? 3
            : enemy.kind === 'armored' || enemy.kind === 'shieldbearer' || enemy.kind === 'summoner'
              ? 2
              : 1;
    }
  }

  return {
    coreDamageTaken,
    outcome: {
      killedCount,
      energyGained,
      scoreGained,
      totalDamageDealt,
      healedEvents,
      blinkEvents,
      shieldRegenEvents,
      spawnRequests,
      leechEvents,
    },
  };
}
