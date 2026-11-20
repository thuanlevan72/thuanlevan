export type OpticType =
  | 'mirror'
  | 'prism'
  | 'amp'
  | 'gatling'
  | 'tesla'
  | 'missile'
  | 'railgun'
  | 'flamer'
  | 'cryo'
  | 'mortar';

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
    pathBorder: 'rgba(56, 189, 248, 0.22)',
    trackGlow: 'rgba(56, 189, 248, 0.34)',
    wallFill: '#1E293B',
    wallStroke: '#64748B',
    accent: '#00E5FF',
  },
  emerald_matrix: {
    bg: '#04100C',
    gridLine: 'rgba(16, 185, 129, 0.14)',
    pathFill: '#0A221A',
    pathBorder: 'rgba(52, 211, 153, 0.24)',
    trackGlow: 'rgba(52, 211, 153, 0.35)',
    wallFill: '#132A23',
    wallStroke: '#10B981',
    accent: '#34D399',
  },
  crimson_forge: {
    bg: '#12060A',
    gridLine: 'rgba(244, 63, 94, 0.14)',
    pathFill: '#241018',
    pathBorder: 'rgba(251, 113, 133, 0.24)',
    trackGlow: 'rgba(251, 113, 133, 0.34)',
    wallFill: '#2B1720',
    wallStroke: '#FB7185',
    accent: '#FB7185',
  },
  violet_void: {
    bg: '#0B0616',
    gridLine: 'rgba(167, 139, 250, 0.14)',
    pathFill: '#18102E',
    pathBorder: 'rgba(196, 181, 253, 0.24)',
    trackGlow: 'rgba(192, 132, 252, 0.36)',
    wallFill: '#21183D',
    wallStroke: '#A78BFA',
    accent: '#C084FC',
  },
  amber_desert: {
    bg: '#120C04',
    gridLine: 'rgba(245, 158, 11, 0.14)',
    pathFill: '#24190B',
    pathBorder: 'rgba(251, 191, 36, 0.24)',
    trackGlow: 'rgba(251, 191, 36, 0.35)',
    wallFill: '#2C2012',
    wallStroke: '#F59E0B',
    accent: '#FBBF24',
  },
  arctic_core: {
    bg: '#050E17',
    gridLine: 'rgba(125, 211, 252, 0.16)',
    pathFill: '#0D2136',
    pathBorder: 'rgba(186, 230, 253, 0.28)',
    trackGlow: 'rgba(125, 211, 252, 0.4)',
    wallFill: '#162D45',
    wallStroke: '#7DD3FC',
    accent: '#BAE6FD',
  },
};

export interface GridPoint {
  readonly col: number;
  readonly row: number;
}

export type TileKind = 'empty' | 'path' | 'spawn' | 'core' | 'wall' | 'emitter';

export interface EmitterDef {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly dir: number; // 0..7 (0=E,1=SE,2=S,3=SW,4=W,5=NW,6=N,7=NE)
  readonly basePower: number;
}

export interface PrismMapDef {
  readonly id: string;
  readonly name: string;
  readonly difficultyLabel: string;
  readonly subtitle: string;
  readonly biome: MapBiome;
  readonly cols: number;
  readonly rows: number;
  readonly startEnergy: number;
  readonly startCoreHp: number;
  readonly path: readonly GridPoint[];
  readonly emitters: readonly EmitterDef[];
  readonly walls: readonly GridPoint[];
  readonly starterOptics: readonly {
    col: number;
    row: number;
    type: OpticType;
    rot: number;
  }[];
  readonly totalWaves: number;
}

export interface OpticCatalogItem {
  readonly type: OpticType;
  readonly category: 'optic' | 'gun';
  readonly hotkey: string;
  readonly name: string;
  readonly roleClue: string;
  readonly cost: number;
  readonly upgradeCosts: readonly [number, number]; // Lv1->2, Lv2->3
  readonly rangeTiles: number;
}

export interface PlacedOptic {
  id: string;
  col: number;
  row: number;
  type: OpticType;
  rot: number; // 0..7 (used by mirror & prism)
  level: 1 | 2 | 3;
  chargeTimer: number;
  hitCount: number; // How many laser beams hit/energize this node
  aimAngle: number; // Smooth visual turret barrel angle (radians)
  recoil: number; // Barrel kickback animation 0..1
}

export interface LaserSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly power: number;
  readonly bounceDepth: number;
  readonly tier: 1 | 2 | 3;
  readonly overdriven: boolean;
}

export interface TdEnemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  heading: number; // Radians for directional ship/tank sprite rendering
  waypointIndex: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  radius: number;
  reward: number;
  scoreValue: number;
  armorRatio: number; // 0..1 reduction against low-tier raw beams
  slowTimer: number;
  burnTimer: number;
  burnDps: number;
  abilityCooldown: number; // Used by healer (heal pulse) & teleporter (phase blink)
  hitFlash: number;
  beamsTouching: number;
  koTimer: number;
}

export interface ProjectileItem {
  id: number;
  kind: 'bullet' | 'missile' | 'mortar';
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetId: number;
  targetX?: number;
  targetY?: number;
  damage: number;
  splashRadius: number;
  life: number;
  maxLife: number;
  speed: number;
  color: string;
  tier?: 1 | 2 | 3;
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
  tier?: 1 | 2 | 3;
}

export interface FlameConeFx {
  x: number;
  y: number;
  angle: number;
  range: number;
  alpha: number;
  tier?: 1 | 2 | 3;
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

export const DIR_VECTORS: readonly { readonly dx: number; readonly dy: number }[] = [
  { dx: 1, dy: 0 },   // 0: E
  { dx: 1, dy: 1 },   // 1: SE
  { dx: 0, dy: 1 },   // 2: S
  { dx: -1, dy: 1 },  // 3: SW
  { dx: -1, dy: 0 },  // 4: W
  { dx: -1, dy: -1 }, // 5: NW
  { dx: 0, dy: -1 },  // 6: N
  { dx: 1, dy: -1 },  // 7: NE
];

export const OPTIC_CATALOG: readonly OpticCatalogItem[] = [
  {
    type: 'mirror',
    category: 'optic',
    hotkey: '1',
    name: 'Gương Phản Xạ',
    roleClue: 'Bẻ tia 8 hướng',
    cost: 35,
    upgradeCosts: [30, 45],
    rangeTiles: 0,
  },
  {
    type: 'prism',
    category: 'optic',
    hotkey: '2',
    name: 'Lăng Kính 1→3',
    roleClue: 'Tách 1 tia thành 3',
    cost: 65,
    upgradeCosts: [50, 75],
    rangeTiles: 0,
  },
  {
    type: 'amp',
    category: 'optic',
    hotkey: '3',
    name: 'Khuếch Đại',
    roleClue: 'Tăng +70% sát thương',
    cost: 55,
    upgradeCosts: [45, 70],
    rangeTiles: 0,
  },
  {
    type: 'gatling',
    category: 'gun',
    hotkey: '4',
    name: 'Súng Máy Quang',
    roleClue: 'Liên thanh 2 nòng',
    cost: 50,
    upgradeCosts: [40, 65],
    rangeTiles: 2.9,
  },
  {
    type: 'tesla',
    category: 'gun',
    hotkey: '5',
    name: 'Tháp Sét Tesla',
    roleClue: 'Sét chuỗi + làm chậm',
    cost: 75,
    upgradeCosts: [60, 85],
    rangeTiles: 2.6,
  },
  {
    type: 'missile',
    category: 'gun',
    hotkey: '6',
    name: 'Tên Lửa Plasma',
    roleClue: 'Đạn đuổi nổ diện rộng',
    cost: 90,
    upgradeCosts: [70, 105],
    rangeTiles: 4.1,
  },
  {
    type: 'railgun',
    category: 'gun',
    hotkey: '7',
    name: 'Pháo Railgun',
    roleClue: 'Tia xuyên phá tầm xa',
    cost: 115,
    upgradeCosts: [85, 130],
    rangeTiles: 5.8,
  },
  {
    type: 'flamer',
    category: 'gun',
    hotkey: '8',
    name: 'Pháo Phun Lửa',
    roleClue: 'Đốt cháy hình nón (DoT)',
    cost: 70,
    upgradeCosts: [55, 80],
    rangeTiles: 2.35,
  },
  {
    type: 'cryo',
    category: 'gun',
    hotkey: '9',
    name: 'Tháp Băng Cryo',
    roleClue: 'Đóng băng diện rộng -45%',
    cost: 65,
    upgradeCosts: [50, 75],
    rangeTiles: 2.65,
  },
  {
    type: 'mortar',
    category: 'gun',
    hotkey: '0',
    name: 'Pháo Lỗ Đen',
    roleClue: 'Cối trọng lực hút + nổ lớn',
    cost: 105,
    upgradeCosts: [80, 120],
    rangeTiles: 4.8,
  },
];

export const PRISM_MAPS: readonly PrismMapDef[] = [
  {
    id: 'circuit-01',
    name: 'Mạch 01 · Thung Lũng Zic-Zắc',
    difficultyLabel: 'Tiêu chuẩn · 1 Nguồn',
    subtitle: 'Kết hợp Gương, Lăng Kính cùng Súng Máy, Phun Lửa & Cryo để khóa chặt các khúc cua.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 200,
    startCoreHp: 20,
    totalWaves: 8,
    path: [
      { col: 0, row: 2 },
      { col: 4, row: 2 },
      { col: 4, row: 5 },
      { col: 8, row: 5 },
      { col: 8, row: 2 },
      { col: 11, row: 2 },
    ],
    emitters: [
      { id: 'em-1', col: 1, row: 0, dir: 2, basePower: 40 },
    ],
    walls: [
      { col: 6, row: 3 },
      { col: 6, row: 4 },
    ],
    starterOptics: [
      { col: 1, row: 4, type: 'mirror', rot: 6 },
    ],
  },
  {
    id: 'circuit-02',
    name: 'Mạch 02 · Giao Lộ Ma Trận',
    difficultyLabel: 'Chiến thuật · 2 Nguồn',
    subtitle: 'Chiếu tia laser qua trụ súng (Tesla, Cryo, Railgun) để tăng +35% tốc bắn và +25% sát thương!',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 225,
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
    emitters: [
      { id: 'em-a', col: 0, row: 4, dir: 0, basePower: 38 },
      { id: 'em-b', col: 11, row: 4, dir: 4, basePower: 38 },
    ],
    walls: [
      { col: 5, row: 2 },
      { col: 6, row: 2 },
    ],
    starterOptics: [
      { col: 5, row: 4, type: 'prism', rot: 6 },
    ],
  },
  {
    id: 'circuit-03',
    name: 'Mạch 03 · Lò Rèn Huyết Thép',
    difficultyLabel: 'Thử thách · Vách Chắn',
    subtitle: 'Dùng Tên Lửa Plasma & Pháo Lỗ Đen bắn vượt tường thép trong khi bẻ tia ở hai cánh.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 245,
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
    emitters: [
      { id: 'em-c1', col: 5, row: 7, dir: 6, basePower: 40 },
      { id: 'em-c2', col: 0, row: 3, dir: 0, basePower: 36 },
    ],
    walls: [
      { col: 4, row: 3 },
      { col: 5, row: 3 },
      { col: 6, row: 3 },
      { col: 7, row: 3 },
    ],
    starterOptics: [
      { col: 5, row: 5, type: 'mirror', rot: 7 },
    ],
  },
  {
    id: 'circuit-04',
    name: 'Mạch 04 · Đại Lộ Hư Không',
    difficultyLabel: 'Cao cấp · 10 Đợt',
    subtitle: 'Hành lang hai tầng dài nhất — thiên đường combo Súng Phun Lửa + Cryo + Pháo Lỗ Đen.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 265,
    startCoreHp: 22,
    totalWaves: 10,
    path: [
      { col: 0, row: 1 },
      { col: 10, row: 1 },
      { col: 10, row: 4 },
      { col: 2, row: 4 },
      { col: 2, row: 6 },
      { col: 11, row: 6 },
    ],
    emitters: [
      { id: 'em-d1', col: 0, row: 2, dir: 0, basePower: 42 },
      { id: 'em-d2', col: 11, row: 5, dir: 4, basePower: 42 },
    ],
    walls: [
      { col: 5, row: 2 },
      { col: 6, row: 2 },
    ],
    starterOptics: [
      { col: 4, row: 2, type: 'amp', rot: 0 },
    ],
  },
  {
    id: 'circuit-05',
    name: 'Mạch 05 · Sa Mạc Răng Cưa',
    difficultyLabel: 'Cường độ cao · 4 Cua Gắt',
    subtitle: 'Bốn khúc cua răng cưa liên hoàn chặn đứng Kẻ Nhảy Pha và Tàu Yểm Trợ Sinh Học.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 280,
    startCoreHp: 22,
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
    emitters: [
      { id: 'em-e1', col: 1, row: 7, dir: 6, basePower: 42 },
      { id: 'em-e2', col: 11, row: 2, dir: 4, basePower: 42 },
    ],
    walls: [
      { col: 4, row: 3 },
      { col: 7, row: 3 },
    ],
    starterOptics: [
      { col: 1, row: 3, type: 'mirror', rot: 7 },
    ],
  },
  {
    id: 'circuit-06',
    name: 'Mạch 06 · Lõi Băng Cực Quang',
    difficultyLabel: 'Siêu Cấp · 3 Nguồn · 12 Đợt',
    subtitle: 'Ba nguồn phát Laser hội tụ quanh đường xoắn bảo vệ Lõi trước đội quân Boss liên hoàn.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 320,
    startCoreHp: 25,
    totalWaves: 12,
    path: [
      { col: 0, row: 6 },
      { col: 10, row: 6 },
      { col: 10, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 4 },
      { col: 7, row: 4 },
    ],
    emitters: [
      { id: 'em-f1', col: 0, row: 3, dir: 0, basePower: 44 },
      { id: 'em-f2', col: 5, row: 0, dir: 2, basePower: 44 },
      { id: 'em-f3', col: 11, row: 3, dir: 4, basePower: 44 },
    ],
    walls: [
      { col: 4, row: 2 },
      { col: 8, row: 2 },
    ],
    starterOptics: [
      { col: 5, row: 3, type: 'prism', rot: 2 },
    ],
  },
  {
    id: 'circuit-07',
    name: 'Mạch 07 · Xoáy Lốc Bào Mòn',
    difficultyLabel: 'Chiến Thuật · 2 Nguồn · 10 Đợt',
    subtitle: 'Đường xoáy lốc cắt ngang lõi bản đồ — lý tưởng để đặt Lăng Kính & Súng Phun Lửa quét hai chiều.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 270,
    startCoreHp: 22,
    totalWaves: 10,
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
    emitters: [
      { id: 'em-g1', col: 1, row: 0, dir: 2, basePower: 42 },
      { id: 'em-g2', col: 6, row: 7, dir: 6, basePower: 42 },
    ],
    walls: [
      { col: 5, row: 4 },
      { col: 7, row: 4 },
    ],
    starterOptics: [
      { col: 1, row: 5, type: 'mirror', rot: 7 },
    ],
  },
  {
    id: 'circuit-08',
    name: 'Mạch 08 · Pháo Đài Kép Titan',
    difficultyLabel: 'Thử Thách · 2 Nguồn · 11 Đợt',
    subtitle: 'Tuyến hào đôi chữ U bọc thép đón đầu các đợt Thiết Giáp Hạng Nặng và Khiên Aegis.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 295,
    startCoreHp: 24,
    totalWaves: 11,
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
    emitters: [
      { id: 'em-h1', col: 0, row: 7, dir: 7, basePower: 44 },
      { id: 'em-h2', col: 11, row: 6, dir: 4, basePower: 44 },
    ],
    walls: [
      { col: 3, row: 2 },
      { col: 7, row: 6 },
    ],
    starterOptics: [
      { col: 3, row: 3, type: 'prism', rot: 0 },
    ],
  },
  {
    id: 'circuit-09',
    name: 'Mạch 09 · Ma Trận Tam Quang',
    difficultyLabel: 'Cao Cấp · 3 Nguồn · 11 Đợt',
    subtitle: 'Ba nguồn phát Laser hội tụ vào thấu kính trung tâm — tách thành mạng lưới hỏa lực 9 tia.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 310,
    startCoreHp: 24,
    totalWaves: 11,
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
    emitters: [
      { id: 'em-i1', col: 1, row: 1, dir: 0, basePower: 44 },
      { id: 'em-i2', col: 5, row: 0, dir: 2, basePower: 44 },
      { id: 'em-i3', col: 11, row: 5, dir: 4, basePower: 44 },
    ],
    walls: [
      { col: 4, row: 4 },
      { col: 8, row: 3 },
    ],
    starterOptics: [
      { col: 5, row: 4, type: 'prism', rot: 2 },
      { col: 1, row: 3, type: 'mirror', rot: 1 },
    ],
  },
  {
    id: 'circuit-10',
    name: 'Mạch 10 · Tận Thế Hư Không',
    difficultyLabel: 'Huyền Thoại · 3 Nguồn · 14 Đợt',
    subtitle: 'Trận chiến tổng lực 14 đợt quân dài nhất — tung toàn bộ Railgun, Pháo Lỗ Đen & Overdrive!',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 360,
    startCoreHp: 28,
    totalWaves: 14,
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
    emitters: [
      { id: 'em-j1', col: 0, row: 0, dir: 1, basePower: 46 },
      { id: 'em-j2', col: 6, row: 7, dir: 6, basePower: 46 },
      { id: 'em-j3', col: 11, row: 0, dir: 3, basePower: 46 },
    ],
    walls: [
      { col: 3, row: 4 },
      { col: 7, row: 4 },
    ],
    starterOptics: [
      { col: 6, row: 3, type: 'prism', rot: 6 },
      { col: 4, row: 3, type: 'amp', rot: 0 },
    ],
  },
];

export function gridToWorldCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function getMapPathTileSet(map: PrismMapDef): Set<string> {
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

export function getTileKind(map: PrismMapDef, col: number, row: number): TileKind {
  if (col < 0 || col >= map.cols || row < 0 || row >= map.rows) return 'wall';
  const start = map.path[0];
  const end = map.path[map.path.length - 1];
  if (col === start.col && row === start.row) return 'spawn';
  if (col === end.col && row === end.row) return 'core';
  if (map.emitters.some((e) => e.col === col && e.row === row)) return 'emitter';
  if (map.walls.some((w) => w.col === col && w.row === row)) return 'wall';
  const pathSet = getMapPathTileSet(map);
  if (pathSet.has(`${col},${row}`)) return 'path';
  return 'empty';
}

export function computeMirrorReflectionDir(inDir: number, mirrorRot: number): number {
  const revIn = (inDir + 4) % 8;
  const outDir = (((mirrorRot - revIn) % 8) + 8) % 8;
  return outDir;
}

export function getOpticUpgradeCost(type: OpticType, level: 1 | 2 | 3): number | null {
  if (level >= 3) return null;
  const item = OPTIC_CATALOG.find((c) => c.type === type);
  if (!item) return null;
  return level === 1 ? item.upgradeCosts[0] : item.upgradeCosts[1];
}

export function getOpticSellRefund(optic: PlacedOptic): number {
  const item = OPTIC_CATALOG.find((c) => c.type === optic.type);
  if (!item) return 20;
  let invested = item.cost;
  if (optic.level >= 2) invested += item.upgradeCosts[0];
  if (optic.level >= 3) invested += item.upgradeCosts[1];
  return Math.round(invested * 0.7);
}

interface RayJob {
  col: number;
  row: number;
  dir: number;
  power: number;
  bounceDepth: number;
  tier: 1 | 2 | 3;
}

export interface LaserTraceResult {
  segments: LaserSegment[];
  hitCountsByOpticId: Record<string, number>;
  energizedGunIds: string[];
  totalNetworkDps: number;
}

const MAX_RAY_SEGMENTS = 84;
const MAX_BOUNCE_DEPTH = 14;

/**
 * Traces all emitters across the grid. Optical devices manipulate beams; gun turrets absorb a trickle
 * of passing beams (letting the beam continue through!) to become Laser-Energized (+35% attack speed).
 */
export function traceLaserNetwork(
  map: PrismMapDef,
  optics: readonly PlacedOptic[],
  overdriveActive = false
): LaserTraceResult {
  const opticMap = new Map<string, PlacedOptic>();
  const hitCountsByOpticId: Record<string, number> = {};
  const energizedSet = new Set<string>();

  for (const op of optics) {
    opticMap.set(`${op.col},${op.row}`, op);
    hitCountsByOpticId[op.id] = 0;
  }

  const wallSet = new Set(map.walls.map((w) => `${w.col},${w.row}`));
  const segments: LaserSegment[] = [];
  const visitedRays = new Set<string>();

  const queue: RayJob[] = map.emitters.map((em) => ({
    col: em.col,
    row: em.row,
    dir: ((em.dir % 8) + 8) % 8,
    power: em.basePower * (overdriveActive ? 2.2 : 1),
    bounceDepth: 0,
    tier: overdriveActive ? 3 : 1,
  }));

  while (queue.length > 0 && segments.length < MAX_RAY_SEGMENTS) {
    const job = queue.shift()!;
    if (job.bounceDepth > MAX_BOUNCE_DEPTH || job.power < 4) continue;

    const rayKey = `${job.col},${job.row},${job.dir},${job.tier}`;
    if (visitedRays.has(rayKey)) continue;
    visitedRays.add(rayKey);

    const vec = DIR_VECTORS[job.dir];
    let curCol = job.col;
    let curRow = job.row;
    let hitOptic: PlacedOptic | null = null;
    let hitWallOrEdge = false;

    for (let step = 0; step < 20; step++) {
      const nextCol = curCol + vec.dx;
      const nextRow = curRow + vec.dy;

      if (nextCol < 0 || nextCol >= map.cols || nextRow < 0 || nextRow >= map.rows) {
        const startPt = gridToWorldCenter(job.col, job.row);
        const edgeX = startPt.x + vec.dx * ((step + 0.5) * TILE_SIZE);
        const edgeY = startPt.y + vec.dy * ((step + 0.5) * TILE_SIZE);
        segments.push({
          x1: startPt.x,
          y1: startPt.y,
          x2: Math.max(0, Math.min(CANVAS_WIDTH, edgeX)),
          y2: Math.max(0, Math.min(CANVAS_HEIGHT, edgeY)),
          power: job.power,
          bounceDepth: job.bounceDepth,
          tier: job.tier,
          overdriven: overdriveActive,
        });
        hitWallOrEdge = true;
        break;
      }

      if (wallSet.has(`${nextCol},${nextRow}`)) {
        const startPt = gridToWorldCenter(job.col, job.row);
        const wallPt = gridToWorldCenter(nextCol, nextRow);
        segments.push({
          x1: startPt.x,
          y1: startPt.y,
          x2: wallPt.x - vec.dx * (TILE_SIZE * 0.36),
          y2: wallPt.y - vec.dy * (TILE_SIZE * 0.36),
          power: job.power,
          bounceDepth: job.bounceDepth,
          tier: job.tier,
          overdriven: overdriveActive,
        });
        hitWallOrEdge = true;
        break;
      }

      const found = opticMap.get(`${nextCol},${nextRow}`);
      if (found) {
        const startPt = gridToWorldCenter(job.col, job.row);
        const endPt = gridToWorldCenter(nextCol, nextRow);
        segments.push({
          x1: startPt.x,
          y1: startPt.y,
          x2: endPt.x,
          y2: endPt.y,
          power: job.power,
          bounceDepth: job.bounceDepth,
          tier: job.tier,
          overdriven: overdriveActive,
        });
        hitOptic = found;
        break;
      }

      curCol = nextCol;
      curRow = nextRow;
    }

    if (!hitWallOrEdge && hitOptic) {
      hitCountsByOpticId[hitOptic.id] = (hitCountsByOpticId[hitOptic.id] ?? 0) + 1;

      if (hitOptic.type === 'mirror') {
        const outDir = computeMirrorReflectionDir(job.dir, hitOptic.rot);
        const levelMult = hitOptic.level === 1 ? 1.05 : hitOptic.level === 2 ? 1.2 : 1.38;
        queue.push({
          col: hitOptic.col,
          row: hitOptic.row,
          dir: outDir,
          power: job.power * levelMult,
          bounceDepth: job.bounceDepth + 1,
          tier: job.tier,
        });
      } else if (hitOptic.type === 'prism') {
        const splitRetention = hitOptic.level === 1 ? 0.6 : hitOptic.level === 2 ? 0.72 : 0.84;
        const centerDir = ((hitOptic.rot % 8) + 8) % 8;
        const outDirs = [(centerDir + 7) % 8, centerDir, (centerDir + 1) % 8];
        for (const d of outDirs) {
          queue.push({
            col: hitOptic.col,
            row: hitOptic.row,
            dir: d,
            power: job.power * splitRetention,
            bounceDepth: job.bounceDepth + 1,
            tier: job.tier,
          });
        }
      } else if (hitOptic.type === 'amp') {
        const boost = hitOptic.level === 1 ? 1.7 : hitOptic.level === 2 ? 2.0 : 2.35;
        const nextTier: 1 | 2 | 3 = job.tier === 1 ? 2 : 3;
        queue.push({
          col: hitOptic.col,
          row: hitOptic.row,
          dir: job.dir,
          power: job.power * boost,
          bounceDepth: job.bounceDepth + 1,
          tier: nextTier,
        });
      } else {
        // Active gun turrets get Laser-Energized while letting beam continue!
        energizedSet.add(hitOptic.id);
        queue.push({
          col: hitOptic.col,
          row: hitOptic.row,
          dir: job.dir,
          power: job.power * 0.92,
          bounceDepth: job.bounceDepth + 1,
          tier: job.tier,
        });
      }
    }
  }

  const totalNetworkDps = segments.reduce((sum, s) => sum + s.power, 0);
  return {
    segments,
    hitCountsByOpticId,
    energizedGunIds: Array.from(energizedSet),
    totalNetworkDps: Math.round(totalNetworkDps),
  };
}

export function pointToSegmentDistSq(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) {
    const rx = px - x1;
    const ry = py - y1;
    return rx * rx + ry * ry;
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const distX = px - projX;
  const distY = py - projY;
  return distX * distX + distY * distY;
}

export interface WaveSpawnItem {
  readonly kind: EnemyKind;
  readonly delaySec: number;
}

export function buildWaveSpawns(waveNumber: number): WaveSpawnItem[] {
  const items: WaveSpawnItem[] = [];
  const count = 8 + waveNumber * 2;
  let elapsed = 0.2;

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
    if (waveNumber >= 2 && i % 5 === 2) kind = 'armored';
    if (waveNumber >= 3 && i % 5 === 1) kind = 'splitter';
    if (waveNumber >= 4 && i % 6 === 3) kind = 'stealth';
    if (waveNumber >= 4 && i % 7 === 4) kind = 'healer';
    if (waveNumber >= 5 && i % 7 === 5) kind = 'teleporter';
    if (waveNumber >= 6 && i % 6 === 0 && i > 0) kind = 'shieldbearer';
    if ((waveNumber === 5 || waveNumber === 8 || waveNumber === 10 || waveNumber === 12) && i === count - 1) {
      kind = 'boss';
    }
    items.push({ kind, delaySec: elapsed });
    elapsed +=
      kind === 'splitter'
        ? 0.45
        : kind === 'stealth' || kind === 'teleporter'
          ? 0.55
          : kind === 'boss'
            ? 1.25
            : Math.max(0.42, 1.0 - waveNumber * 0.045);
  }
  return items;
}

export function createEnemyForWave(
  id: number,
  kind: EnemyKind,
  waveNumber: number,
  map: PrismMapDef
): TdEnemy {
  const spawnPt = gridToWorldCenter(map.path[0].col, map.path[0].row);
  const nextPt = gridToWorldCenter(map.path[1].col, map.path[1].row);
  const initialHeading = Math.atan2(nextPt.y - spawnPt.y, nextPt.x - spawnPt.x);
  const scale = 1 + (waveNumber - 1) * 0.3;

  const base = {
    id,
    kind,
    x: spawnPt.x,
    y: spawnPt.y,
    heading: initialHeading,
    waypointIndex: 1,
    slowTimer: 0,
    burnTimer: 0,
    burnDps: 0,
    abilityCooldown: 2.8,
    hitFlash: 0,
    beamsTouching: 0,
    koTimer: 0,
  };

  if (kind === 'armored') {
    const hp = Math.round(145 * scale);
    const shield = Math.round(35 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: 44 + waveNumber * 1.5,
      radius: 17,
      reward: 19,
      scoreValue: 45,
      armorRatio: 0.4,
    };
  }

  if (kind === 'splitter') {
    const hp = Math.round(62 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield: 0,
      maxShield: 0,
      speed: 80 + waveNumber * 2.1,
      radius: 14,
      reward: 13,
      scoreValue: 30,
      armorRatio: 0,
    };
  }

  if (kind === 'stealth') {
    const hp = Math.round(86 * scale);
    const shield = Math.round(28 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: 94 + waveNumber * 2,
      radius: 14,
      reward: 16,
      scoreValue: 40,
      armorRatio: 0.15,
    };
  }

  if (kind === 'healer') {
    const hp = Math.round(115 * scale);
    const shield = Math.round(45 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: 52 + waveNumber * 1.4,
      radius: 16,
      reward: 22,
      scoreValue: 55,
      armorRatio: 0.1,
      abilityCooldown: 2.2,
    };
  }

  if (kind === 'teleporter') {
    const hp = Math.round(92 * scale);
    const shield = Math.round(40 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: 74 + waveNumber * 1.8,
      radius: 15,
      reward: 20,
      scoreValue: 52,
      armorRatio: 0.1,
      abilityCooldown: 3.4,
    };
  }

  if (kind === 'shieldbearer') {
    const hp = Math.round(160 * scale);
    const shield = Math.round(125 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: 40 + waveNumber * 1.3,
      radius: 18,
      reward: 24,
      scoreValue: 64,
      armorRatio: 0.45,
    };
  }

  if (kind === 'boss') {
    const hp = Math.round(560 * scale);
    const shield = Math.round(165 * scale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: 35 + waveNumber * 1.1,
      radius: 25,
      reward: 80,
      scoreValue: 240,
      armorRatio: 0.35,
    };
  }

  // 'scout'
  const hp = Math.round(74 * scale);
  return {
    ...base,
    hp,
    maxHp: hp,
    shield: 0,
    maxShield: 0,
    speed: 64 + waveNumber * 1.8,
    radius: 14,
    reward: 14,
    scoreValue: 32,
    armorRatio: 0,
  };
}

export function advanceEnemyAlongPath(
  enemy: TdEnemy,
  map: PrismMapDef,
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

export function applyDamageToEnemy(enemy: TdEnemy, rawDamage: number): boolean {
  if (enemy.hp <= 0 || enemy.koTimer > 0) return false;
  let dmg = rawDamage;
  if (enemy.shield > 0) {
    const absorbed = Math.min(enemy.shield, dmg);
    enemy.shield -= absorbed;
    dmg -= absorbed;
  }
  enemy.hp -= dmg;
  enemy.hitFlash = 0.1;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.koTimer = 0.3;
    return true;
  }
  return false;
}

export interface DamageTickOutcome {
  killedCount: number;
  energyGained: number;
  scoreGained: number;
  totalDamageDealt: number;
  crossfireHits: number;
  healedEvents: { fromX: number; fromY: number; toX: number; toY: number; amount: number }[];
  blinkEvents: { fromX: number; fromY: number; toX: number; toY: number }[];
}

export function stepEnemiesWithLasers(
  enemies: TdEnemy[],
  segments: readonly LaserSegment[],
  map: PrismMapDef,
  dt: number
): { coreDamageTaken: number; outcome: DamageTickOutcome } {
  let coreDamageTaken = 0;
  let killedCount = 0;
  let energyGained = 0;
  let scoreGained = 0;
  let totalDamageDealt = 0;
  let crossfireHits = 0;
  const healedEvents: { fromX: number; fromY: number; toX: number; toY: number; amount: number }[] = [];
  const blinkEvents: { fromX: number; fromY: number; toX: number; toY: number }[] = [];

  for (const enemy of enemies) {
    if (enemy.koTimer > 0) {
      enemy.koTimer = Math.max(0, enemy.koTimer - dt);
      continue;
    }
    if (enemy.hp <= 0) continue;

    let rawDps = 0;
    let touchingCount = 0;
    const hitRadius = enemy.radius + 7;
    const hitRadiusSq = hitRadius * hitRadius;

    for (const seg of segments) {
      const distSq = pointToSegmentDistSq(enemy.x, enemy.y, seg.x1, seg.y1, seg.x2, seg.y2);
      if (distSq <= hitRadiusSq) {
        touchingCount += 1;
        const armorFactor = seg.tier >= 2 ? 1 : 1 - enemy.armorRatio;
        rawDps += seg.power * armorFactor;
      }
    }

    enemy.beamsTouching = touchingCount;
    if (touchingCount > 0) {
      const resonanceMult = touchingCount >= 2 ? 1.25 : 1;
      if (touchingCount >= 2) crossfireHits += 1;
      const dmg = rawDps * resonanceMult * dt;
      totalDamageDealt += dmg;
      const killed = applyDamageToEnemy(enemy, dmg);
      if (killed) {
        killedCount += 1;
        energyGained += enemy.reward;
        scoreGained += enemy.scoreValue;
        continue;
      }
    } else {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 3);
    }

    // Apply Fire Burn DoT (from Flamer)
    if (enemy.burnTimer > 0 && enemy.burnDps > 0) {
      enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
      const burnDmg = enemy.burnDps * dt;
      totalDamageDealt += burnDmg;
      if (applyDamageToEnemy(enemy, burnDmg)) {
        killedCount += 1;
        energyGained += enemy.reward;
        scoreGained += enemy.scoreValue;
        continue;
      }
    }

    // Special Archetype Abilities: Healer pulse & Teleporter phase blink
    if (enemy.kind === 'healer') {
      enemy.abilityCooldown -= dt;
      if (enemy.abilityCooldown <= 0) {
        enemy.abilityCooldown = 2.4;
        for (const ally of enemies) {
          if (ally.id === enemy.id || ally.hp <= 0 || ally.koTimer > 0) continue;
          const dist = Math.hypot(ally.x - enemy.x, ally.y - enemy.y);
          if (dist <= 135 && ally.hp < ally.maxHp) {
            const healAmt = Math.min(ally.maxHp - ally.hp, Math.round(ally.maxHp * 0.14));
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
    } else if (enemy.kind === 'teleporter' && enemy.slowTimer <= 0) {
      enemy.abilityCooldown -= dt;
      if (enemy.abilityCooldown <= 0) {
        enemy.abilityCooldown = 3.8;
        const fromX = enemy.x;
        const fromY = enemy.y;
        const blinkedToEnd = advanceEnemyAlongPath(enemy, map, 58);
        blinkEvents.push({ fromX, fromY, toX: enemy.x, toY: enemy.y });
        if (blinkedToEnd) {
          enemy.hp = 0;
          enemy.koTimer = 0;
          coreDamageTaken += 1;
          continue;
        }
      }
    }

    if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    }
    const speedFactor = enemy.slowTimer > 0 ? 0.55 : 1;
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
      crossfireHits,
      healedEvents,
      blinkEvents,
    },
  };
}
