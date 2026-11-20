export type GunType =
  | 'gatling'
  | 'shotgun'
  | 'flamer'
  | 'cryo'
  | 'tesla'
  | 'missile'
  | 'railgun'
  | 'mortar';

export type TargetPriority = 'first' | 'strongest' | 'weakest';

export type EnemyKind =
  | 'scout'
  | 'armored'
  | 'splitter'
  | 'stealth'
  | 'healer'
  | 'teleporter'
  | 'shieldbearer'
  | 'boss';

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
    description: 'Khởi đầu vững vàng · Lõi +20% máu · Quái tiêu chuẩn',
    hpMult: 1.0,
    shieldMult: 1.0,
    speedMult: 1.0,
    armorBonus: 0,
    startEnergyMult: 1.15,
    coreHpMult: 1.2,
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
    description: 'Chiến trường chuẩn · Quái +55% HP & +8% tốc độ · +2 Đợt',
    hpMult: 1.55,
    shieldMult: 1.3,
    speedMult: 1.08,
    armorBonus: 0.06,
    startEnergyMult: 1.0,
    coreHpMult: 1.0,
    rewardMult: 0.95,
    scoreMult: 1.35,
    extraWaves: 2,
    waveCountBonus: 3,
    eliteChanceBoost: 0.06,
  },
  hard: {
    id: 'hard',
    label: 'Khó',
    shortLabel: 'KHÓ',
    badgeColor: '#F97316',
    description: 'Áp lực cao · Quái +135% HP, +18% tốc độ, +12% giáp · +4 Đợt',
    hpMult: 2.35,
    shieldMult: 1.75,
    speedMult: 1.18,
    armorBonus: 0.12,
    startEnergyMult: 0.9,
    coreHpMult: 0.85,
    rewardMult: 0.88,
    scoreMult: 1.85,
    extraWaves: 4,
    waveCountBonus: 6,
    eliteChanceBoost: 0.14,
  },
  hell: {
    id: 'hell',
    label: 'Địa Ngục',
    shortLabel: 'ĐỊA NGỤC',
    badgeColor: '#FB7185',
    description: 'Cực hạn sinh tồn · Quái +265% HP, +30% tốc độ, Bão Tinh Anh · +6 Đợt',
    hpMult: 3.65,
    shieldMult: 2.35,
    speedMult: 1.3,
    armorBonus: 0.2,
    startEnergyMult: 0.82,
    coreHpMult: 0.7,
    rewardMult: 0.8,
    scoreMult: 2.6,
    extraWaves: 6,
    waveCountBonus: 10,
    eliteChanceBoost: 0.24,
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

export function getEffectiveMapSetup(map: TdMapDef, difficulty: DifficultyId): EffectiveMapSetup {
  const cfg = DIFFICULTY_CONFIGS[difficulty];
  return {
    totalWaves: map.totalWaves + cfg.extraWaves,
    startEnergy: Math.round((map.startEnergy * cfg.startEnergyMult) / 5) * 5,
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
}

export interface ProjectileItem {
  id: number;
  kind: 'bullet' | 'pellet' | 'missile' | 'mortar' | 'bomblet';
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
  hitIds?: number[];
  life: number;
  maxLife: number;
  speed: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
  spawnCluster?: boolean;
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
];

export const PRISM_MAPS: readonly TdMapDef[] = [
  {
    id: 'sector-01',
    name: 'Màn 01 · Thung Lũng Khởi Đầu',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 15 Đợt',
    subtitle: 'Tuyến zic-zắc kéo dài — khởi đầu chiến dịch dài hơi và nâng cấp súng lên Lv10.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 170,
    startCoreHp: 20,
    totalWaves: 15,
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
    difficultyLabel: 'Dễ · 16 Đợt',
    subtitle: 'Hai khúc cua sâu đối xứng — đặt Phun Lửa + Băng Cryo ngay trọng tâm để khóa chặt quái.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 180,
    startCoreHp: 20,
    totalWaves: 16,
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
    difficultyLabel: 'Dễ · 17 Đợt',
    subtitle: 'Bức tường thép chắn giữa bản đồ — tận dụng Tên Lửa & Hố Đen bắn vượt tường.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 190,
    startCoreHp: 20,
    totalWaves: 17,
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
    difficultyLabel: 'Dễ · 18 Đợt',
    subtitle: 'Đường thẳng dài hai tầng — thiên đường của Pháo Railgun xuyên cả hàng Thiết Giáp.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 200,
    startCoreHp: 20,
    totalWaves: 18,
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
    difficultyLabel: 'Trung Bình · 20 Đợt',
    subtitle: 'Bốn khúc cua răng cưa liên hoàn — dùng Tesla ngắt chiêu Kẻ Nhảy Pha và Tàu Yểm Trợ.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 210,
    startCoreHp: 20,
    totalWaves: 20,
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
    difficultyLabel: 'Trung Bình · 21 Đợt',
    subtitle: 'Đường xoắn ốc hội tụ vào Lõi giữa bản đồ — giữ nhịp sát thương xuyên suốt 21+ đợt.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 220,
    startCoreHp: 20,
    totalWaves: 21,
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
    difficultyLabel: 'Trung Bình · 22 Đợt',
    subtitle: 'Quái đi qua trung tâm 2 lần — nâng cấp Pháo Phun Lửa & Hố Đen để hủy diệt hàng loạt.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 230,
    startCoreHp: 22,
    totalWaves: 22,
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
    difficultyLabel: 'Trung Bình · 23 Đợt',
    subtitle: 'Tuyến hào chữ U kép bọc thép đối đầu liên quân Thiết Giáp & Khiên Aegis.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 240,
    startCoreHp: 22,
    totalWaves: 23,
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
    difficultyLabel: 'Khó · 25 Đợt',
    subtitle: 'Ba bậc thang hỏa lực — kết hợp Cryo Giòn Vỡ Lv5+ cùng Vulcan & Railgun.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 250,
    startCoreHp: 22,
    totalWaves: 25,
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
    difficultyLabel: 'Khó · 26 Đợt',
    subtitle: 'Đá chắn chia đôi sườn núi — bố trí pháo tầm xa ở hai đầu và Shrapnel ở các khúc gắt.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 265,
    startCoreHp: 22,
    totalWaves: 26,
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
    difficultyLabel: 'Khó · 27 Đợt',
    subtitle: 'Hành lang hẹp băng giá — quái chạy cực nhanh, buộc phải nâng Cryo & Tesla lên Lv7+.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 275,
    startCoreHp: 24,
    totalWaves: 27,
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
    difficultyLabel: 'Khó · 28 Đợt',
    subtitle: 'Đường chữ M ngược cắt chéo — dồn sát thương nổ chùm tên lửa ở 3 đỉnh tam giác.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 285,
    startCoreHp: 24,
    totalWaves: 28,
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
    difficultyLabel: 'Địa Ngục · 30 Đợt',
    subtitle: 'Nhiều cụm vách chắn chia ô — chọn lọc vị trí vàng cho Pháo Cối Hố Đen Lv10.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 300,
    startCoreHp: 24,
    totalWaves: 30,
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
    difficultyLabel: 'Địa Ngục · 32 Đợt',
    subtitle: 'Hành lang tấn công trực diện dồn dập — cân bằng hoàn hảo giữa công đơn thể & AoE.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 315,
    startCoreHp: 24,
    totalWaves: 32,
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
    difficultyLabel: 'Địa Ngục · 33 Đợt',
    subtitle: 'Đoàn quân Boss & Khiên Aegis hành quân liên tục — cần tối thiểu 3–4 súng đạt Lv10!',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 330,
    startCoreHp: 25,
    totalWaves: 33,
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
    difficultyLabel: 'Địa Ngục · 35 Đợt',
    subtitle: 'Chiến dịch trường kỳ 35+ đợt tối thượng — thử thách giới hạn pháo đài Mythic Lv10!',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 350,
    startCoreHp: 26,
    totalWaves: 35,
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
      : type === 'tesla'
        ? Math.min(3.5, 1 + (chainCount - 1) * 0.35)
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

export interface WaveSpawnItem {
  readonly kind: EnemyKind;
  readonly delaySec: number;
  readonly isElite?: boolean;
}

/**
 * Extended, punishing wave composition supporting 15..41 waves & 4 Difficulty Tiers.
 */
export function buildWaveSpawns(
  waveNumber: number,
  totalWaves = 25,
  difficulty: DifficultyId = 'normal'
): WaveSpawnItem[] {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];
  const items: WaveSpawnItem[] = [];
  const count =
    14 +
    Math.round(waveNumber * 3.1) +
    (waveNumber >= 10 ? (waveNumber - 9) * 2 : 0) +
    diffCfg.waveCountBonus;
  let elapsed = 0.2;

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
    if (waveNumber >= 2 && i % 4 === 2) kind = 'armored';
    if (waveNumber >= 3 && i % 4 === 1) kind = 'splitter';
    if (waveNumber >= 3 && i % 5 === 3) kind = 'stealth';
    if (waveNumber >= 4 && i % 6 === 4) kind = 'healer';
    if (waveNumber >= 4 && i % 6 === 5) kind = 'teleporter';
    if (waveNumber >= 5 && i % 5 === 0 && i > 0) kind = 'shieldbearer';

    // Boss & Mini-boss intervals throughout long 15-41 wave campaigns
    const isMiniBossWave = waveNumber >= 6 && waveNumber % 3 === 1 && i === Math.floor(count / 2);
    const isMajorBossWave =
      waveNumber === totalWaves ||
      waveNumber % 5 === 0 ||
      (waveNumber >= 18 && waveNumber % 2 === 0);

    if ((isMajorBossWave && i === count - 1) || isMiniBossWave) {
      kind = 'boss';
    }
    if (waveNumber >= 12 && isMajorBossWave && i >= count - 2) {
      kind = 'boss';
    }
    if (waveNumber >= 22 && i >= count - (difficulty === 'hell' ? 4 : 3)) {
      kind = 'boss';
    }

    const eliteModulo = Math.max(3, Math.round(7 - diffCfg.eliteChanceBoost * 15));
    const isElite =
      kind !== 'boss' &&
      ((waveNumber >= 5 && i % eliteModulo === eliteModulo - 1) ||
        (difficulty === 'hell' && waveNumber >= 3 && i % 5 === 4));
    items.push({ kind, delaySec: elapsed, isElite });

    const baseGap = Math.max(0.2, 0.78 - waveNumber * 0.022 - (difficulty === 'hell' ? 0.08 : difficulty === 'hard' ? 0.04 : 0));
    elapsed +=
      kind === 'splitter'
        ? baseGap * 0.72
        : kind === 'stealth' || kind === 'teleporter'
          ? baseGap * 0.8
          : kind === 'boss'
            ? 1.05
            : baseGap;
  }
  return items;
}

/**
 * Compound enemy scaling across waves 1..41 and 4 Difficulty Tiers (Dễ -> Địa Ngục).
 */
export function createEnemyForWave(
  id: number,
  kind: EnemyKind,
  waveNumber: number,
  map: TdMapDef,
  isElite = false,
  difficulty: DifficultyId = 'normal'
): TdEnemy {
  const diffCfg = DIFFICULTY_CONFIGS[difficulty];
  const spawnPt = gridToWorldCenter(map.path[0].col, map.path[0].row);
  const nextPt = gridToWorldCenter(map.path[1].col, map.path[1].row);
  const initialHeading = Math.atan2(nextPt.y - spawnPt.y, nextPt.x - spawnPt.x);

  const baseScale =
    1.25 + (waveNumber - 1) * 0.46 + Math.pow(Math.max(0, waveNumber - 2), 1.58) * 0.3;
  const eliteMult = isElite ? 1.55 : 1;
  const hpScale = baseScale * eliteMult * diffCfg.hpMult;
  const shieldScale = baseScale * eliteMult * diffCfg.shieldMult;
  const speedBonus = Math.min(46, waveNumber * 1.9);
  const rewardScale = diffCfg.rewardMult * (isElite ? 1.35 : 1);
  const armorAdd = diffCfg.armorBonus;

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
      speed: (49 + speedBonus * 0.7) * diffCfg.speedMult,
      radius: 17,
      reward: Math.max(6, Math.round((14 + Math.floor(waveNumber * 0.65)) * rewardScale)),
      scoreValue: Math.round(60 * diffCfg.scoreMult),
      armorRatio: Math.min(0.78, 0.54 + armorAdd),
    };
  }

  if (kind === 'splitter') {
    const hp = Math.round(115 * hpScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield: difficulty === 'hell' && waveNumber >= 6 ? Math.round(25 * shieldScale) : 0,
      maxShield: difficulty === 'hell' && waveNumber >= 6 ? Math.round(25 * shieldScale) : 0,
      speed: (84 + speedBonus) * diffCfg.speedMult,
      radius: 14,
      reward: Math.max(5, Math.round((10 + Math.floor(waveNumber * 0.45)) * rewardScale)),
      scoreValue: Math.round(42 * diffCfg.scoreMult),
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
      speed: (100 + speedBonus) * diffCfg.speedMult,
      radius: 14,
      reward: Math.max(6, Math.round((13 + Math.floor(waveNumber * 0.6)) * rewardScale)),
      scoreValue: Math.round(54 * diffCfg.scoreMult),
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
      speed: (56 + speedBonus * 0.75) * diffCfg.speedMult,
      radius: 16,
      reward: Math.max(8, Math.round((18 + Math.floor(waveNumber * 0.75)) * rewardScale)),
      scoreValue: Math.round(72 * diffCfg.scoreMult),
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
      speed: (80 + speedBonus * 0.9) * diffCfg.speedMult,
      radius: 15,
      reward: Math.max(7, Math.round((16 + Math.floor(waveNumber * 0.65)) * rewardScale)),
      scoreValue: Math.round(68 * diffCfg.scoreMult),
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
      speed: (46 + speedBonus * 0.65) * diffCfg.speedMult,
      radius: 18,
      reward: Math.max(9, Math.round((20 + Math.floor(waveNumber * 0.85)) * rewardScale)),
      scoreValue: Math.round(84 * diffCfg.scoreMult),
      armorRatio: Math.min(0.75, 0.48 + armorAdd),
      abilityCooldown: 2.9,
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
      speed: (39 + speedBonus * 0.55) * diffCfg.speedMult,
      radius: 25,
      reward: Math.max(25, Math.round((68 + waveNumber * 3) * rewardScale)),
      scoreValue: Math.round(320 * diffCfg.scoreMult),
      armorRatio: Math.min(0.76, 0.48 + armorAdd),
      abilityCooldown: 3.1,
    };
  }

  // 'scout'
  const hp = Math.round(126 * hpScale);
  return {
    ...base,
    hp,
    maxHp: hp,
    shield: waveNumber >= 5 || difficulty === 'hard' || difficulty === 'hell' ? Math.round(28 * shieldScale) : 0,
    maxShield: waveNumber >= 5 || difficulty === 'hard' || difficulty === 'hell' ? Math.round(28 * shieldScale) : 0,
    speed: (70 + speedBonus * 0.9) * diffCfg.speedMult,
    radius: 14,
    reward: Math.max(5, Math.round((11 + Math.floor(waveNumber * 0.48)) * rewardScale)),
    scoreValue: Math.round(40 * diffCfg.scoreMult),
    armorRatio: Math.min(0.45, (waveNumber >= 4 ? 0.16 : 0) + armorAdd),
  };
}

export function advanceEnemyAlongPath(
  enemy: TdEnemy,
  map: TdMapDef,
  distancePx: number
): boolean {
  let remainingMove = distancePx;
  while (remainingMove > 0 && enemy.waypointIndex < map.path.length) {
    const wp = gridToWorldCenter(
      map.path[enemy.waypointIndex].col,
      map.path[enemy.waypointIndex].row
    );
    const dx = wp.x - enemy.x;
    const dy = wp.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.001) {
      enemy.heading = Math.atan2(dy, dx);
    }
    if (dist <= remainingMove) {
      enemy.x = wp.x;
      enemy.y = wp.y;
      remainingMove -= dist;
      enemy.waypointIndex += 1;
    } else {
      enemy.x += (dx / dist) * remainingMove;
      enemy.y += (dy / dist) * remainingMove;
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

    const speedFactor = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    const remainingMove = enemy.speed * speedFactor * dt;

    const reachedEnd = advanceEnemyAlongPath(enemy, map, remainingMove);
    if (reachedEnd) {
      enemy.hp = 0;
      enemy.koTimer = 0;
      coreDamageTaken +=
        enemy.kind === 'boss'
          ? 5
          : enemy.kind === 'armored' || enemy.kind === 'shieldbearer'
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
    },
  };
}
