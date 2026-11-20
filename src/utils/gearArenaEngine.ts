export type GearCategory = 'weapon' | 'core' | 'conductor' | 'defense' | 'accessory';

export type GearItemId =
  // 12 Weapons
  | 'pulse_laser'
  | 'twin_smg'
  | 'frost_rifle'
  | 'chain_saw'
  | 'shotgun_blaster'
  | 'flamethrower'
  | 'grenade_launcher'
  | 'homing_missile'
  | 'tesla_coil'
  | 'railgun'
  | 'gatling_vulcan'
  | 'nova_cannon'
  // 5 Cores & Conductors
  | 'overclock_core'
  | 'nuclear_battery'
  | 'conductor_wire'
  | 'gear_haste'
  | 'plasma_crit'
  // 5 Tactical Accessories
  | 'laser_sight'
  | 'extended_mag'
  | 'vampire_module'
  | 'cryo_cell'
  | 'stun_capacitor'
  // 4 Defense Modules
  | 'armor_plate'
  | 'nano_repair'
  | 'reflector_shield'
  | 'reactive_armor';

export type GearRotation = 0 | 90;

export type GearArenaModeId = 'classic' | 'blitz' | 'boss_rush' | 'endless';

export interface GearArenaModeConfig {
  id: GearArenaModeId;
  name: string;
  tagline: string;
  description: string;
  maxRounds: number | null; // null = endless
  startingGold: number;
  startingHearts: number;
  battleDurationSec: number;
  goldMultiplier: number;
  enemyHpMultiplier: number;
  fireRateScale: number;
  hasBossEveryRound: boolean;
  shopSlots: number;
}

export const GEAR_ARENA_MODES: readonly GearArenaModeConfig[] = [
  {
    id: 'classic',
    name: 'Đấu Trường Cổ Điển',
    tagline: '10 Vòng · 48s/Trận · Chuẩn Chiến Thuật',
    description:
      'Lộ trình 10 vòng đấu đối kháng Bóng Ma PvP & 3 đợt bầy quái cơ khí (48 giây/trận). Cân bằng vàng, tim sinh tồn và cộng hưởng ba lô 5×5.',
    maxRounds: 10,
    startingGold: 16,
    startingHearts: 3,
    battleDurationSec: 48,
    goldMultiplier: 1,
    enemyHpMultiplier: 1,
    fireRateScale: 1,
    hasBossEveryRound: false,
    shopSlots: 6,
  },
  {
    id: 'blitz',
    name: 'Siêu Tốc Blitz ×2',
    tagline: '8 Vòng · 39s/Trận · Giàu Vàng',
    description:
      'Khởi đầu 28G, thưởng vàng ×1.55 và toàn bộ vũ khí bắn nhanh hơn 25% — dễ dàng ghép combo siêu phẩm trong 8 vòng rực lửa (39 giây/trận)!',
    maxRounds: 8,
    startingGold: 28,
    startingHearts: 3,
    battleDurationSec: 39,
    goldMultiplier: 1.55,
    enemyHpMultiplier: 1.15,
    fireRateScale: 1.25,
    hasBossEveryRound: false,
    shopSlots: 6,
  },
  {
    id: 'boss_rush',
    name: 'Săn Siêu Boss',
    tagline: '6 Vòng · 60s/Trận · Boss Mỗi Trận',
    description:
      'Mỗi vòng xuất hiện Siêu Boss Cơ Khí khổng lồ với đòn bắn vòng tròn & hồi đệ trong suốt 60 giây đại chiến. Vàng thưởng cực cao (+80%)!',
    maxRounds: 6,
    startingGold: 24,
    startingHearts: 4,
    battleDurationSec: 60,
    goldMultiplier: 1.8,
    enemyHpMultiplier: 1.35,
    fireRateScale: 1.1,
    hasBossEveryRound: true,
    shopSlots: 6,
  },
  {
    id: 'endless',
    name: 'Sinh Tồn Vô Tận',
    tagline: 'Không Giới Hạn Vòng · 48s/Trận',
    description:
      'Vượt qua Vòng 10 để bước vào kỷ nguyên Vô Tận (48 giây/trận)! Độ khó quái & Bóng Ma tăng theo cấp số nhân — thử sức đội hình bất bại của bạn.',
    maxRounds: null,
    startingGold: 20,
    startingHearts: 4,
    battleDurationSec: 48,
    goldMultiplier: 1.25,
    enemyHpMultiplier: 1.05,
    fireRateScale: 1.05,
    hasBossEveryRound: false,
    shopSlots: 6,
  },
];

export function getGearArenaModeConfig(modeId: GearArenaModeId): GearArenaModeConfig {
  return GEAR_ARENA_MODES.find((m) => m.id === modeId) ?? GEAR_ARENA_MODES[0];
}

export interface GearCatalogEntry {
  id: GearItemId;
  name: string;
  shortName: string;
  category: GearCategory;
  width: number;
  height: number;
  cost: number;
  tier: 1 | 2 | 3;
  color: string;
  accent: string;
  description: string;
  // Base weapon attributes (for weapons)
  baseDamage?: number;
  baseFireRate?: number; // shots per sec
  baseCritChance?: number; // 0..1
  baseCritMult?: number;
  aoeRadius?: number;
  projectileSpeed?: number;
  projectileColor?: string;
  pelletCount?: number;
  spreadRad?: number;
  knockback?: number;
  slowFactor?: number; // 0..0.75
  burnDps?: number;
  // Defense / support attributes
  bonusHp?: number;
  bonusArmor?: number;
  hpRegenPerSec?: number;
  reflectPct?: number;
}

export interface PlacedGear {
  uid: string;
  itemId: GearItemId;
  col: number;
  row: number;
  rotation: GearRotation;
}

export interface GridCoord {
  col: number;
  row: number;
}

export interface SynergyLink {
  fromUid: string;
  toUid: string;
  kind: 'overclock' | 'lightning' | 'haste' | 'crit' | 'accessory';
  color: string;
}

export interface ComputedWeaponSpec {
  uid: string;
  itemId: GearItemId;
  name: string;
  damage: number;
  fireRate: number;
  fireRateMult: number;
  critChance: number;
  critMult: number;
  chainLightning: boolean;
  overclocked: boolean;
  dps: number;
  aoeRadius: number;
  projectileSpeed: number;
  color: string;
  pelletCount: number;
  spreadRad: number;
  knockback: number;
  slowFactor: number;
  burnDps: number;
  lifestealPct: number;
}

export interface BackpackEvaluation {
  totalDps: number;
  maxHp: number;
  armor: number;
  hpRegen: number;
  reflectPct: number;
  lifestealPct: number;
  empCount: number;
  reactiveArmorCount: number;
  weapons: ComputedWeaponSpec[];
  synergyLinks: SynergyLink[];
  energizedUids: string[];
  chainLightningActive: boolean;
  energizedWeaponCount: number;
  overclockedCount: number;
  hasBattery: boolean;
  synergyLabels: string[];
}

export interface GhostGridEntry {
  itemId: GearItemId;
  col: number;
  row: number;
  rotation: GearRotation;
}

export interface GhostBuildSnapshot {
  version: 1;
  name: string;
  title: string;
  round: number;
  grid: GhostGridEntry[];
}

export const GRID_SIZE = 5;
export const MAX_ROUNDS = 10;
export const STARTING_HEARTS = 3;
export const STARTING_GOLD = 15;
export const GHOST_STORAGE_KEY = 'thuanle-gear-arena-ghosts-v1';

export const GEAR_CATALOG: readonly GearCatalogEntry[] = [
  // =========================================================================
  // 12 WEAPONS
  // =========================================================================
  {
    id: 'pulse_laser',
    name: 'Súng Laser Xung',
    shortName: 'Laser',
    category: 'weapon',
    width: 1,
    height: 1,
    cost: 4,
    tier: 1,
    color: '#06B6D4',
    accent: '#67E8F9',
    description: 'Bắn tia laser tốc độ cao vào kẻ địch gần nhất.',
    baseDamage: 16,
    baseFireRate: 2.2,
    baseCritChance: 0.12,
    baseCritMult: 1.75,
    aoeRadius: 0,
    projectileSpeed: 640,
    projectileColor: '#22D3EE',
  },
  {
    id: 'twin_smg',
    name: 'Tiểu Liên Kép SMG',
    shortName: 'SMG Kép',
    category: 'weapon',
    width: 1,
    height: 1,
    cost: 5,
    tier: 1,
    color: '#EAB308',
    accent: '#FEF08A',
    description: 'Xả 2 viên đạn động năng mỗi loạt với tốc độ cực nhanh.',
    baseDamage: 10,
    baseFireRate: 3.1,
    baseCritChance: 0.15,
    baseCritMult: 1.8,
    aoeRadius: 0,
    projectileSpeed: 680,
    projectileColor: '#FDE047',
    pelletCount: 2,
    spreadRad: 0.11,
  },
  {
    id: 'frost_rifle',
    name: 'Súng Băng Cryo',
    shortName: 'Băng Cryo',
    category: 'weapon',
    width: 2,
    height: 1,
    cost: 6,
    tier: 1,
    color: '#38BDF8',
    accent: '#E0F2FE',
    description: 'Bắn mảnh băng xuyên làm chậm tốc độ di chuyển quái 40% trong 2.2s.',
    baseDamage: 24,
    baseFireRate: 1.45,
    baseCritChance: 0.14,
    baseCritMult: 1.8,
    aoeRadius: 22,
    projectileSpeed: 560,
    projectileColor: '#7DD3FC',
    slowFactor: 0.4,
  },
  {
    id: 'chain_saw',
    name: 'Cưa Máy Xoay',
    shortName: 'Cưa Máy',
    category: 'weapon',
    width: 1,
    height: 2,
    cost: 6,
    tier: 1,
    color: '#F59E0B',
    accent: '#FDE68A',
    description: 'Phóng đĩa cưa xoay xuyên mục tiêu và càn quét bầy quái.',
    baseDamage: 24,
    baseFireRate: 1.55,
    baseCritChance: 0.18,
    baseCritMult: 1.9,
    aoeRadius: 24,
    projectileSpeed: 420,
    projectileColor: '#FBBF24',
  },
  {
    id: 'shotgun_blaster',
    name: 'Shotgun Xung Kích',
    shortName: 'Shotgun',
    category: 'weapon',
    width: 2,
    height: 1,
    cost: 7,
    tier: 2,
    color: '#FB7185',
    accent: '#FECDD3',
    description: 'Nã chùm 5 viên đạn hình quạt đẩy lùi quái áp sát cực mạnh.',
    baseDamage: 15,
    baseFireRate: 1.25,
    baseCritChance: 0.16,
    baseCritMult: 1.9,
    aoeRadius: 0,
    projectileSpeed: 590,
    projectileColor: '#FDA4AF',
    pelletCount: 5,
    spreadRad: 0.42,
    knockback: 26,
  },
  {
    id: 'flamethrower',
    name: 'Súng Phun Lửa Plasma',
    shortName: 'Phun Lửa',
    category: 'weapon',
    width: 1,
    height: 2,
    cost: 7,
    tier: 2,
    color: '#EA580C',
    accent: '#FED7AA',
    description: 'Phóng cầu lửa thiêu đốt quái theo thời gian & lan nhiệt AoE.',
    baseDamage: 18,
    baseFireRate: 2.5,
    baseCritChance: 0.12,
    baseCritMult: 1.75,
    aoeRadius: 42,
    projectileSpeed: 370,
    projectileColor: '#F97316',
    burnDps: 18,
  },
  {
    id: 'grenade_launcher',
    name: 'Súng Phóng Lựu',
    shortName: 'Phóng Lựu',
    category: 'weapon',
    width: 1,
    height: 2,
    cost: 7,
    tier: 2,
    color: '#F97316',
    accent: '#FDBA74',
    description: 'Bắn đạn nổ diện rộng AoE. Đặt cạnh Lõi Quá Tải để ×2 tốc độ bắn!',
    baseDamage: 42,
    baseFireRate: 0.95,
    baseCritChance: 0.14,
    baseCritMult: 1.85,
    aoeRadius: 68,
    projectileSpeed: 390,
    projectileColor: '#FB923C',
  },
  {
    id: 'homing_missile',
    name: 'Giàn Tên Lửa',
    shortName: 'Tên Lửa',
    category: 'weapon',
    width: 2,
    height: 1,
    cost: 8,
    tier: 2,
    color: '#EC4899',
    accent: '#F9A8D4',
    description: 'Phóng tên lửa tự dẫn truy đuổi quái và Bóng Ma PvP.',
    baseDamage: 36,
    baseFireRate: 1.35,
    baseCritChance: 0.16,
    baseCritMult: 1.85,
    aoeRadius: 34,
    projectileSpeed: 460,
    projectileColor: '#F472B6',
  },
  {
    id: 'tesla_coil',
    name: 'Cuộn Sét Tesla',
    shortName: 'Sét Tesla',
    category: 'weapon',
    width: 1,
    height: 1,
    cost: 8,
    tier: 2,
    color: '#0EA5E9',
    accent: '#BAE6FD',
    description: 'Phóng tia sét tức thì giật thẳng mục tiêu, nối Pin để giật lan 6 quái!',
    baseDamage: 32,
    baseFireRate: 1.4,
    baseCritChance: 0.2,
    baseCritMult: 2.0,
    aoeRadius: 18,
    projectileSpeed: 980,
    projectileColor: '#38BDF8',
  },
  {
    id: 'railgun',
    name: 'Pháo Điện Từ',
    shortName: 'Railgun',
    category: 'weapon',
    width: 2,
    height: 1,
    cost: 10,
    tier: 3,
    color: '#6366F1',
    accent: '#A5B4FC',
    description: 'Siêu pháo tia laser điện từ xuyên thấu tức thì, sát thương chí mạng cực lớn.',
    baseDamage: 74,
    baseFireRate: 0.85,
    baseCritChance: 0.28,
    baseCritMult: 2.25,
    aoeRadius: 20,
    projectileSpeed: 840,
    projectileColor: '#818CF8',
  },
  {
    id: 'gatling_vulcan',
    name: 'Đại Liên Vulcan 6 Nòng',
    shortName: 'Vulcan',
    category: 'weapon',
    width: 2,
    height: 1,
    cost: 10,
    tier: 3,
    color: '#D97706',
    accent: '#FDE68A',
    description: 'Súng máy 6 nòng xả mưa đạn liên thanh 5.0 phát/giây đốt cháy đội hình địch!',
    baseDamage: 14,
    baseFireRate: 5.0,
    baseCritChance: 0.18,
    baseCritMult: 1.85,
    aoeRadius: 0,
    projectileSpeed: 760,
    projectileColor: '#FBBF24',
    spreadRad: 0.08,
  },
  {
    id: 'nova_cannon',
    name: 'Đại Bác Siêu Tân Tinh',
    shortName: 'Nova 2×2',
    category: 'weapon',
    width: 2,
    height: 2,
    cost: 12,
    tier: 3,
    color: '#9333EA',
    accent: '#E9D5FF',
    description: 'Siêu pháo 2×2 bắn cầu năng lượng hấp dẫn phát nổ sóng xung kích khổng lồ!',
    baseDamage: 118,
    baseFireRate: 0.72,
    baseCritChance: 0.26,
    baseCritMult: 2.35,
    aoeRadius: 96,
    projectileSpeed: 370,
    projectileColor: '#C084FC',
    knockback: 38,
  },

  // =========================================================================
  // 5 CORES & CONDUCTORS
  // =========================================================================
  {
    id: 'overclock_core',
    name: 'Lõi Quá Tải',
    shortName: 'Quá Tải',
    category: 'core',
    width: 1,
    height: 1,
    cost: 6,
    tier: 2,
    color: '#EF4444',
    accent: '#FCA5A5',
    description: 'Cộng hưởng liền kề: Nhân đôi (×2.0) tốc độ bắn cho mọi vũ khí giáp cạnh!',
  },
  {
    id: 'nuclear_battery',
    name: 'Pin Hạt Nhân',
    shortName: 'Pin Hạt Nhân',
    category: 'core',
    width: 1,
    height: 1,
    cost: 7,
    tier: 3,
    color: '#10B981',
    accent: '#6EE7B7',
    description: 'Nối mạch qua ≥3 vũ khí (cùng Dây Dẫn) biến đạn thường thành Chuỗi Sét Giật Lan!',
  },
  {
    id: 'conductor_wire',
    name: 'Dây Dẫn Siêu Cấp',
    shortName: 'Dây Dẫn',
    category: 'conductor',
    width: 1,
    height: 1,
    cost: 3,
    tier: 1,
    color: '#38BDF8',
    accent: '#BAE6FD',
    description: 'Dẫn nguồn Pin Hạt Nhân đi xa trong ba lô & tăng +15% sát thương vũ khí nối mạch.',
  },
  {
    id: 'gear_haste',
    name: 'Bánh Răng Tăng Tốc',
    shortName: 'Bánh Răng',
    category: 'core',
    width: 1,
    height: 1,
    cost: 4,
    tier: 1,
    color: '#3B82F6',
    accent: '#93C5FD',
    description: 'Tăng +45% tốc độ bắn cho mỗi vũ khí đặt cạnh.',
  },
  {
    id: 'plasma_crit',
    name: 'Lõi Chí Mạng',
    shortName: 'Lõi Crit',
    category: 'core',
    width: 1,
    height: 1,
    cost: 5,
    tier: 2,
    color: '#A855F7',
    accent: '#D8B4FE',
    description: 'Tăng +35% tỉ lệ chí mạng & +0.5× sát thương Crit cho vũ khí kề cạnh.',
  },

  // =========================================================================
  // 5 TACTICAL ACCESSORIES (PHỤ KIỆN CHIẾN THUẬT)
  // =========================================================================
  {
    id: 'laser_sight',
    name: 'Hồng Tâm Laser',
    shortName: 'Hồng Tâm',
    category: 'accessory',
    width: 1,
    height: 1,
    cost: 4,
    tier: 1,
    color: '#F43F5E',
    accent: '#FDA4AF',
    description: 'Phụ kiện ngắm chuẩn: +20% sát thương, +15% Crit & +25% vận tốc đạn cho vũ khí kề cạnh.',
  },
  {
    id: 'extended_mag',
    name: 'Băng Đạn Mở Rộng',
    shortName: 'Băng Đạn+',
    category: 'accessory',
    width: 1,
    height: 1,
    cost: 5,
    tier: 2,
    color: '#F59E0B',
    accent: '#FDE68A',
    description: 'Phụ kiện súng: Cộng thêm +1 viên đạn mỗi loạt bắn & +25% bán kính nổ AoE cho vũ khí giáp cạnh!',
  },
  {
    id: 'vampire_module',
    name: 'Mô-Đun Hút Máu',
    shortName: 'Hút Máu',
    category: 'accessory',
    width: 1,
    height: 1,
    cost: 6,
    tier: 2,
    color: '#BE123C',
    accent: '#FDA4AF',
    description: 'Phụ kiện sinh tồn: Vũ khí kề cạnh hồi +5% sát thương thành Máu (+40 HP tối đa).',
    bonusHp: 40,
  },
  {
    id: 'cryo_cell',
    name: 'Lõi Băng Đông Lạnh',
    shortName: 'Đá Băng',
    category: 'accessory',
    width: 1,
    height: 1,
    cost: 5,
    tier: 2,
    color: '#0284C7',
    accent: '#BAE6FD',
    description: 'Gắn kèm súng bất kỳ để đạn có hiệu ứng Làm Chậm 35% + tăng 18% sát thương!',
  },
  {
    id: 'stun_capacitor',
    name: 'Tụ Xung Choáng EMP',
    shortName: 'Tụ EMP',
    category: 'accessory',
    width: 1,
    height: 1,
    cost: 6,
    tier: 3,
    color: '#6366F1',
    accent: '#C7D2FE',
    description: 'Mỗi 4.5s kích hoạt Vòng Sóng EMP quanh cỗ máy làm choáng & đẩy lùi toàn bộ quái gần!',
    bonusHp: 25,
  },

  // =========================================================================
  // 4 DEFENSE MODULES
  // =========================================================================
  {
    id: 'armor_plate',
    name: 'Giáp Titan',
    shortName: 'Giáp Titan',
    category: 'defense',
    width: 1,
    height: 1,
    cost: 4,
    tier: 1,
    color: '#64748B',
    accent: '#CBD5E1',
    description: '+65 Máu tối đa & +4 Giáp giảm sát thương nhận.',
    bonusHp: 65,
    bonusArmor: 4,
  },
  {
    id: 'nano_repair',
    name: 'Lõi Hồi Phục Nano',
    shortName: 'Nano Hồi HP',
    category: 'defense',
    width: 1,
    height: 1,
    cost: 5,
    tier: 2,
    color: '#14B8A6',
    accent: '#5EEAD4',
    description: '+35 Máu tối đa & tự hồi +6 HP/giây trong trận.',
    bonusHp: 35,
    bonusArmor: 1,
    hpRegenPerSec: 6,
  },
  {
    id: 'reflector_shield',
    name: 'Lá Chắn Phản Đòn',
    shortName: 'Khiên Phản',
    category: 'defense',
    width: 1,
    height: 1,
    cost: 6,
    tier: 2,
    color: '#06B6D4',
    accent: '#A5F3FC',
    description: '+55 Máu, +5 Giáp & phản lại 35% sát thương vào kẻ địch tấn công!',
    bonusHp: 55,
    bonusArmor: 5,
    reflectPct: 0.35,
  },
  {
    id: 'reactive_armor',
    name: 'Giáp Phản Ứng Nổ',
    shortName: 'Giáp Nổ',
    category: 'defense',
    width: 2,
    height: 1,
    cost: 8,
    tier: 3,
    color: '#475569',
    accent: '#E2E8F0',
    description: 'Siêu giáp 2×1: +125 Máu, +8 Giáp & tự phát nổ sóng xung kích đẩy lùi khi trúng đòn!',
    bonusHp: 125,
    bonusArmor: 8,
    reflectPct: 0.25,
  },
];

export function getGearCatalogEntry(itemId: GearItemId): GearCatalogEntry {
  const found = GEAR_CATALOG.find((item) => item.id === itemId);
  if (!found) {
    throw new Error(`Unknown gear item: ${itemId}`);
  }
  return found;
}

export function getRotatedDimensions(
  itemId: GearItemId,
  rotation: GearRotation
): { width: number; height: number } {
  const entry = getGearCatalogEntry(itemId);
  if (rotation === 90) {
    return { width: entry.height, height: entry.width };
  }
  return { width: entry.width, height: entry.height };
}

export function getGearOccupiedCells(gear: Pick<PlacedGear, 'itemId' | 'col' | 'row' | 'rotation'>): GridCoord[] {
  const { width, height } = getRotatedDimensions(gear.itemId, gear.rotation);
  const cells: GridCoord[] = [];
  for (let dc = 0; dc < width; dc += 1) {
    for (let dr = 0; dr < height; dr += 1) {
      cells.push({ col: gear.col + dc, row: gear.row + dr });
    }
  }
  return cells;
}

export function canPlaceGearItem(
  grid: readonly PlacedGear[],
  itemId: GearItemId,
  col: number,
  row: number,
  rotation: GearRotation,
  ignoreUid?: string
): boolean {
  const { width, height } = getRotatedDimensions(itemId, rotation);
  if (col < 0 || row < 0 || col + width > GRID_SIZE || row + height > GRID_SIZE) {
    return false;
  }

  const occupied = new Set<string>();
  for (const existing of grid) {
    if (ignoreUid && existing.uid === ignoreUid) continue;
    for (const c of getGearOccupiedCells(existing)) {
      occupied.add(`${c.col},${c.row}`);
    }
  }

  for (let dc = 0; dc < width; dc += 1) {
    for (let dr = 0; dr < height; dr += 1) {
      if (occupied.has(`${col + dc},${row + dr}`)) {
        return false;
      }
    }
  }

  return true;
}

export function areGearsAdjacent(a: PlacedGear, b: PlacedGear): boolean {
  if (a.uid === b.uid) return false;
  const cellsA = getGearOccupiedCells(a);
  const cellsB = getGearOccupiedCells(b);
  for (const ca of cellsA) {
    for (const cb of cellsB) {
      if (Math.abs(ca.col - cb.col) + Math.abs(ca.row - cb.row) === 1) {
        return true;
      }
    }
  }
  return false;
}

export function getGearSellRefund(itemId: GearItemId): number {
  const entry = getGearCatalogEntry(itemId);
  return Math.max(2, Math.floor(entry.cost * 0.75));
}

export function getRoundGoldReward(round: number): number {
  return 9 + round * 2;
}

export function getModeRoundReward(round: number, modeId: GearArenaModeId): number {
  const cfg = getGearArenaModeConfig(modeId);
  return Math.round(getRoundGoldReward(round) * cfg.goldMultiplier);
}

/**
 * Evaluates all orthogonal adjacency synergies, tactical accessories & conductor circuits inside the 5x5 grid:
 * - Overclock Core adjacent to weapon => x2.0 fire rate (up to x4 if flanked by 2 cores)
 * - Gear Haste adjacent to weapon => +45% fire rate each
 * - Plasma Crit adjacent to weapon => +35% crit chance & +0.5x crit mult
 * - Laser Sight => +20% dmg, +15% crit chance, +25% projectile speed
 * - Extended Mag => +1 projectile pellet per shot & +25% AoE radius
 * - Vampire Module => +5% lifesteal on adjacent weapons
 * - Cryo Cell => adds 35% slow + +18% dmg
 * - Nuclear Battery + Conductor Wire circuit touching >= 3 weapons => Chain Lightning active on those weapons!
 */
export function evaluateBackpackSynergies(grid: readonly PlacedGear[]): BackpackEvaluation {
  const baseHp = 220;
  let bonusHp = 0;
  let armor = 0;
  let hpRegen = 0;
  let reflectPct = 0;
  let empCount = 0;
  let reactiveArmorCount = 0;

  const entryMap = new Map<string, GearCatalogEntry>();
  for (const g of grid) {
    const entry = getGearCatalogEntry(g.itemId);
    entryMap.set(g.uid, entry);
    if (entry.bonusHp) bonusHp += entry.bonusHp;
    if (entry.bonusArmor) armor += entry.bonusArmor;
    if (entry.hpRegenPerSec) hpRegen += entry.hpRegenPerSec;
    if (entry.reflectPct) reflectPct += entry.reflectPct;
    if (entry.id === 'stun_capacitor') empCount += 1;
    if (entry.id === 'reactive_armor') reactiveArmorCount += 1;
  }
  reflectPct = Math.min(0.8, reflectPct);

  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const g of grid) adj.set(g.uid, []);
  for (let i = 0; i < grid.length; i += 1) {
    for (let j = i + 1; j < grid.length; j += 1) {
      if (areGearsAdjacent(grid[i], grid[j])) {
        adj.get(grid[i].uid)!.push(grid[j].uid);
        adj.get(grid[j].uid)!.push(grid[i].uid);
      }
    }
  }

  // BFS from all Nuclear Batteries through Conductors and Weapons
  const batteries = grid.filter((g) => g.itemId === 'nuclear_battery');
  const energizedSet = new Set<string>();
  const conductorParent = new Map<string, string>();
  const queue: string[] = [];

  for (const bat of batteries) {
    energizedSet.add(bat.uid);
    queue.push(bat.uid);
  }

  while (queue.length > 0) {
    const currUid = queue.shift()!;
    for (const nextUid of adj.get(currUid) ?? []) {
      const nextEntry = entryMap.get(nextUid);
      if (!nextEntry) continue;
      const canConduct =
        nextEntry.category === 'conductor' ||
        nextEntry.category === 'weapon' ||
        nextEntry.id === 'nuclear_battery';
      if (canConduct && !energizedSet.has(nextUid)) {
        energizedSet.add(nextUid);
        conductorParent.set(nextUid, currUid);
        queue.push(nextUid);
      }
    }
  }

  const energizedWeapons = grid.filter(
    (g) => energizedSet.has(g.uid) && entryMap.get(g.uid)?.category === 'weapon'
  );
  const chainLightningActive = batteries.length > 0 && energizedWeapons.length >= 3;

  const synergyLinks: SynergyLink[] = [];
  if (batteries.length > 0) {
    for (const [childUid, parentUid] of conductorParent.entries()) {
      synergyLinks.push({
        fromUid: parentUid,
        toUid: childUid,
        kind: 'lightning',
        color: chainLightningActive ? '#22D3EE' : '#34D399',
      });
    }
  }

  const weapons: ComputedWeaponSpec[] = [];
  let overclockedCount = 0;
  let totalDps = 0;
  let totalLifestealSum = 0;

  for (const g of grid) {
    const entry = entryMap.get(g.uid)!;
    if (entry.category !== 'weapon') continue;

    const neighbors = adj.get(g.uid) ?? [];
    let overclockNeighbors = 0;
    let hasteNeighbors = 0;
    let critNeighbors = 0;
    let conductorNeighbors = 0;
    let laserSightNeighbors = 0;
    let magNeighbors = 0;
    let vampireNeighbors = 0;
    let cryoNeighbors = 0;

    for (const nUid of neighbors) {
      const nItem = entryMap.get(nUid);
      if (!nItem) continue;
      if (nItem.id === 'overclock_core') {
        overclockNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'overclock', color: '#EF4444' });
      } else if (nItem.id === 'gear_haste') {
        hasteNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'haste', color: '#3B82F6' });
      } else if (nItem.id === 'plasma_crit') {
        critNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'crit', color: '#A855F7' });
      } else if (nItem.id === 'conductor_wire') {
        conductorNeighbors += 1;
      } else if (nItem.id === 'laser_sight') {
        laserSightNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'accessory', color: '#F43F5E' });
      } else if (nItem.id === 'extended_mag') {
        magNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'accessory', color: '#F59E0B' });
      } else if (nItem.id === 'vampire_module') {
        vampireNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'accessory', color: '#E11D48' });
      } else if (nItem.id === 'cryo_cell') {
        cryoNeighbors += 1;
        synergyLinks.push({ fromUid: nUid, toUid: g.uid, kind: 'accessory', color: '#0EA5E9' });
      }
    }

    const overclockMult = overclockNeighbors > 0 ? Math.min(4, Math.pow(2, overclockNeighbors)) : 1;
    const hasteMult = 1 + hasteNeighbors * 0.45;
    const fireRateMult = Number((overclockMult * hasteMult).toFixed(2));
    const fireRate = Number(((entry.baseFireRate ?? 1) * fireRateMult).toFixed(2));

    const isEnergizedWeapon = energizedSet.has(g.uid);
    const hasLightning = chainLightningActive && isEnergizedWeapon;
    const dmgBonusMult =
      1 +
      Math.min(0.45, conductorNeighbors * 0.15) +
      laserSightNeighbors * 0.2 +
      cryoNeighbors * 0.18 +
      (hasLightning ? 0.28 : 0);
    const damage = Math.round((entry.baseDamage ?? 15) * dmgBonusMult);

    const critChance = Math.min(
      0.95,
      (entry.baseCritChance ?? 0.1) + critNeighbors * 0.35 + laserSightNeighbors * 0.15
    );
    const critMult = Number(((entry.baseCritMult ?? 1.75) + critNeighbors * 0.5).toFixed(2));

    const basePellets = entry.pelletCount ?? 1;
    const pelletCount = Math.min(9, basePellets + magNeighbors);
    const spreadRad = pelletCount > 1 ? Math.max(entry.spreadRad ?? 0, 0.14) : 0;
    const aoeRadius =
      (entry.aoeRadius ?? 0) > 0
        ? Math.round((entry.aoeRadius ?? 0) * (1 + magNeighbors * 0.25))
        : 0;
    const projectileSpeed = Math.round(
      (entry.projectileSpeed ?? 500) * (1 + laserSightNeighbors * 0.25)
    );
    const slowFactor = Math.min(0.75, (entry.slowFactor ?? 0) + cryoNeighbors * 0.35);
    const lifestealPct = Math.min(0.2, vampireNeighbors * 0.05);
    totalLifestealSum += lifestealPct;

    const expectedHit = damage * pelletCount * (1 - critChance + critChance * critMult);
    const lightningBounceFactor = hasLightning || entry.id === 'tesla_coil' ? 1.45 : 1;
    const dps = Math.round(expectedHit * fireRate * lightningBounceFactor);

    if (overclockNeighbors > 0) overclockedCount += 1;
    totalDps += dps;

    weapons.push({
      uid: g.uid,
      itemId: g.itemId,
      name: entry.name,
      damage,
      fireRate,
      fireRateMult,
      critChance,
      critMult,
      chainLightning: hasLightning || entry.id === 'tesla_coil',
      overclocked: overclockNeighbors > 0,
      dps,
      aoeRadius,
      projectileSpeed,
      color: hasLightning ? '#38BDF8' : (entry.projectileColor ?? entry.color),
      pelletCount,
      spreadRad,
      knockback: entry.knockback ?? 0,
      slowFactor,
      burnDps: entry.burnDps ?? 0,
      lifestealPct,
    });
  }

  const avgLifestealPct = weapons.length > 0 ? Number((totalLifestealSum / weapons.length).toFixed(3)) : 0;

  const synergyLabels: string[] = [];
  if (chainLightningActive) {
    synergyLabels.push(`⚡ Chuỗi Sét Toàn Màn Hình (${energizedWeapons.length} vũ khí nối mạch Pin Hạt Nhân)`);
  } else if (batteries.length > 0) {
    synergyLabels.push(
      `🔋 Pin Hạt Nhân đã nối ${energizedWeapons.length}/3 vũ khí (thêm ${Math.max(0, 3 - energizedWeapons.length)} để kích hoạt Sét Lan)`
    );
  }
  if (overclockedCount > 0) {
    synergyLabels.push(`🔥 Lõi Quá Tải ×2 Tốc Độ Bắn cho ${overclockedCount} vũ khí`);
  }
  if (empCount > 0) {
    synergyLabels.push(`🌀 Tụ Xung Choáng EMP ×${empCount} (Làm choáng định kỳ 4.5s)`);
  }
  if (avgLifestealSumBadge(weapons) > 0) {
    synergyLabels.push(`🩸 Hút Máu Liên Hoàn (${weapons.filter((w) => w.lifestealPct > 0).length} vũ khí)`);
  }
  if (reflectPct > 0) {
    synergyLabels.push(`🛡️ Phản Đòn ${Math.round(reflectPct * 100)}% & +${armor} Giáp`);
  } else if (armor > 0) {
    synergyLabels.push(`🛡️ Giáp +${armor} & +${bonusHp} Máu`);
  }

  return {
    totalDps,
    maxHp: baseHp + bonusHp,
    armor,
    hpRegen,
    reflectPct,
    lifestealPct: avgLifestealPct,
    empCount,
    reactiveArmorCount,
    weapons,
    synergyLinks,
    energizedUids: Array.from(energizedSet),
    chainLightningActive,
    energizedWeaponCount: energizedWeapons.length,
    overclockedCount,
    hasBattery: batteries.length > 0,
    synergyLabels,
  };
}

function avgLifestealSumBadge(weapons: readonly ComputedWeaponSpec[]): number {
  return weapons.reduce((acc, w) => acc + w.lifestealPct, 0);
}

export function rollShopOffers(
  round: number,
  rng: () => number = Math.random,
  count = 4,
  categoryFilter: 'all' | 'weapon' | 'accessory' | 'defense' = 'all'
): GearItemId[] {
  const tier1Pool: GearItemId[] = [
    'pulse_laser',
    'twin_smg',
    'frost_rifle',
    'chain_saw',
    'conductor_wire',
    'gear_haste',
    'laser_sight',
    'armor_plate',
  ];
  const tier2Pool: GearItemId[] = [
    'shotgun_blaster',
    'flamethrower',
    'grenade_launcher',
    'homing_missile',
    'tesla_coil',
    'overclock_core',
    'plasma_crit',
    'extended_mag',
    'vampire_module',
    'cryo_cell',
    'nano_repair',
    'reflector_shield',
  ];
  const tier3Pool: GearItemId[] = [
    'nuclear_battery',
    'railgun',
    'gatling_vulcan',
    'nova_cannon',
    'stun_capacitor',
    'reactive_armor',
  ];

  const filterMatches = (id: GearItemId) => {
    if (categoryFilter === 'all') return true;
    const cat = getGearCatalogEntry(id).category;
    if (categoryFilter === 'accessory') {
      return cat === 'accessory' || cat === 'core' || cat === 'conductor';
    }
    return cat === categoryFilter;
  };

  let weightedPool: GearItemId[] = [
    ...tier1Pool,
    ...tier1Pool,
    ...(round >= 1 ? tier2Pool : []),
    ...(round >= 3 ? tier2Pool : []),
    ...(round >= 2 ? tier3Pool : []),
    ...(round >= 5 ? tier3Pool : []),
  ].filter(filterMatches);

  if (weightedPool.length === 0) {
    weightedPool = [...tier1Pool, ...tier2Pool, ...tier3Pool];
  }

  const offers: GearItemId[] = [];
  let guard = 0;
  while (offers.length < count && guard < 120) {
    guard += 1;
    const idx = Math.floor(rng() * weightedPool.length) % weightedPool.length;
    const pick = weightedPool[idx];
    if (offers.includes(pick) && rng() < 0.78) continue;
    offers.push(pick);
  }
  return offers;
}

export function createStarterBackpack(): PlacedGear[] {
  return [
    { uid: 'start-laser-1', itemId: 'pulse_laser', col: 1, row: 2, rotation: 0 },
    { uid: 'start-saw-1', itemId: 'chain_saw', col: 2, row: 1, rotation: 0 },
  ];
}

// ---------------------------------------------------------------------------
// Ghost Build Serialization & Built-In Opponent Pool (Rounds 1..10+)
// ---------------------------------------------------------------------------
export const BUILTIN_GHOST_BUILDS: readonly GhostBuildSnapshot[] = [
  {
    version: 1,
    name: 'Tân Binh Cơ Khí',
    title: 'Vòng 1 · Cặp Đôi Laser & SMG',
    round: 1,
    grid: [
      { itemId: 'pulse_laser', col: 1, row: 2, rotation: 0 },
      { itemId: 'twin_smg', col: 2, row: 2, rotation: 0 },
      { itemId: 'armor_plate', col: 1, row: 3, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Thợ Rèn Quá Tải',
    title: 'Vòng 2 · Cưa Máy & Hồng Tâm',
    round: 2,
    grid: [
      { itemId: 'chain_saw', col: 1, row: 1, rotation: 0 },
      { itemId: 'gear_haste', col: 2, row: 1, rotation: 0 },
      { itemId: 'laser_sight', col: 2, row: 2, rotation: 0 },
      { itemId: 'pulse_laser', col: 3, row: 2, rotation: 0 },
      { itemId: 'armor_plate', col: 1, row: 3, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Kỹ Sư Pháo Kích',
    title: 'Vòng 3 · Shotgun & Lựu Đạn Quá Tải',
    round: 3,
    grid: [
      { itemId: 'grenade_launcher', col: 1, row: 1, rotation: 0 },
      { itemId: 'overclock_core', col: 2, row: 1, rotation: 0 },
      { itemId: 'shotgun_blaster', col: 2, row: 2, rotation: 0 },
      { itemId: 'armor_plate', col: 1, row: 3, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Đội Trưởng Băng Hỏa',
    title: 'Vòng 4 · Cryo & Phun Lửa',
    round: 4,
    grid: [
      { itemId: 'homing_missile', col: 1, row: 1, rotation: 0 },
      { itemId: 'overclock_core', col: 2, row: 2, rotation: 0 },
      { itemId: 'flamethrower', col: 1, row: 2, rotation: 0 },
      { itemId: 'frost_rifle', col: 3, row: 2, rotation: 90 },
      { itemId: 'nano_repair', col: 2, row: 3, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Thợ Săn Mạch Điện',
    title: 'Vòng 5 · Kích Hoạt Chuỗi Sét Tesla',
    round: 5,
    grid: [
      { itemId: 'nuclear_battery', col: 1, row: 2, rotation: 0 },
      { itemId: 'conductor_wire', col: 2, row: 2, rotation: 0 },
      { itemId: 'tesla_coil', col: 2, row: 1, rotation: 0 },
      { itemId: 'pulse_laser', col: 3, row: 2, rotation: 0 },
      { itemId: 'chain_saw', col: 2, row: 3, rotation: 90 },
      { itemId: 'reflector_shield', col: 0, row: 2, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Bóng Ma Chí Mạng',
    title: 'Vòng 6 · Railgun + Băng Đạn Mở Rộng',
    round: 6,
    grid: [
      { itemId: 'railgun', col: 1, row: 1, rotation: 0 },
      { itemId: 'plasma_crit', col: 1, row: 2, rotation: 0 },
      { itemId: 'overclock_core', col: 2, row: 2, rotation: 0 },
      { itemId: 'grenade_launcher', col: 3, row: 1, rotation: 0 },
      { itemId: 'extended_mag', col: 3, row: 3, rotation: 0 },
      { itemId: 'nano_repair', col: 2, row: 3, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Pháo Đài Bão Táp',
    title: 'Vòng 7 · Vulcan Hút Máu + Phóng Lựu',
    round: 7,
    grid: [
      { itemId: 'nuclear_battery', col: 0, row: 2, rotation: 0 },
      { itemId: 'conductor_wire', col: 1, row: 2, rotation: 0 },
      { itemId: 'gatling_vulcan', col: 2, row: 0, rotation: 0 },
      { itemId: 'grenade_launcher', col: 2, row: 1, rotation: 0 },
      { itemId: 'overclock_core', col: 3, row: 1, rotation: 0 },
      { itemId: 'homing_missile', col: 1, row: 3, rotation: 0 },
      { itemId: 'vampire_module', col: 3, row: 2, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Ác Quỷ Cơ Giới',
    title: 'Vòng 8 · Song Lõi Quá Tải + Giáp Phản Ứng',
    round: 8,
    grid: [
      { itemId: 'railgun', col: 1, row: 0, rotation: 0 },
      { itemId: 'overclock_core', col: 1, row: 1, rotation: 0 },
      { itemId: 'plasma_crit', col: 2, row: 1, rotation: 0 },
      { itemId: 'homing_missile', col: 1, row: 2, rotation: 0 },
      { itemId: 'overclock_core', col: 2, row: 3, rotation: 0 },
      { itemId: 'grenade_launcher', col: 3, row: 2, rotation: 0 },
      { itemId: 'reactive_armor', col: 3, row: 0, rotation: 0 },
      { itemId: 'stun_capacitor', col: 0, row: 2, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Thần Sấm Tesla',
    title: 'Vòng 9 · Mạng Sét 4 Vũ Khí + EMP',
    round: 9,
    grid: [
      { itemId: 'nuclear_battery', col: 1, row: 2, rotation: 0 },
      { itemId: 'conductor_wire', col: 2, row: 2, rotation: 0 },
      { itemId: 'railgun', col: 1, row: 0, rotation: 0 },
      { itemId: 'grenade_launcher', col: 3, row: 1, rotation: 0 },
      { itemId: 'homing_missile', col: 1, row: 3, rotation: 0 },
      { itemId: 'tesla_coil', col: 2, row: 1, rotation: 0 },
      { itemId: 'overclock_core', col: 1, row: 1, rotation: 0 },
      { itemId: 'stun_capacitor', col: 0, row: 2, rotation: 0 },
      { itemId: 'reflector_shield', col: 0, row: 3, rotation: 0 },
    ],
  },
  {
    version: 1,
    name: 'Hoàng Đế Siêu Tân Tinh',
    title: 'Vòng 10 · Pháo Nova 2×2 Tuyệt Đối',
    round: 10,
    grid: [
      { itemId: 'nova_cannon', col: 2, row: 1, rotation: 0 },
      { itemId: 'overclock_core', col: 1, row: 1, rotation: 0 },
      { itemId: 'extended_mag', col: 1, row: 2, rotation: 0 },
      { itemId: 'nuclear_battery', col: 0, row: 2, rotation: 0 },
      { itemId: 'conductor_wire', col: 1, row: 3, rotation: 0 },
      { itemId: 'gatling_vulcan', col: 2, row: 3, rotation: 0 },
      { itemId: 'tesla_coil', col: 4, row: 1, rotation: 0 },
      { itemId: 'plasma_crit', col: 4, row: 2, rotation: 0 },
      { itemId: 'vampire_module', col: 2, row: 0, rotation: 0 },
      { itemId: 'stun_capacitor', col: 0, row: 3, rotation: 0 },
      { itemId: 'reflector_shield', col: 4, row: 3, rotation: 0 },
    ],
  },
];

export function serializeGhostBuild(
  name: string,
  round: number,
  grid: readonly PlacedGear[]
): GhostBuildSnapshot {
  return {
    version: 1,
    name: name.trim() || 'Chiến Binh Ba Lô',
    title: `Bản Sao Vòng ${round}`,
    round,
    grid: grid.map((g) => ({
      itemId: g.itemId,
      col: g.col,
      row: g.row,
      rotation: g.rotation,
    })),
  };
}

export function ghostGridToPlacedGears(ghost: GhostBuildSnapshot, prefix = 'ghost'): PlacedGear[] {
  return ghost.grid.map((entry, idx) => ({
    uid: `${prefix}-${idx}-${entry.itemId}`,
    itemId: entry.itemId,
    col: entry.col,
    row: entry.row,
    rotation: entry.rotation,
  }));
}

export function parseGhostBuildJson(raw: string): GhostBuildSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as Partial<GhostBuildSnapshot>;
    if (!Array.isArray(obj.grid) || obj.grid.length === 0) return null;

    const validIds = new Set<string>(GEAR_CATALOG.map((g) => g.id));
    const placedCheck: PlacedGear[] = [];
    const cleanGrid: GhostGridEntry[] = [];

    for (let i = 0; i < obj.grid.length; i += 1) {
      const cell = obj.grid[i];
      if (!cell || typeof cell !== 'object') return null;
      if (typeof cell.itemId !== 'string' || !validIds.has(cell.itemId)) return null;
      const rot: GearRotation = cell.rotation === 90 ? 90 : 0;
      const col = Number(cell.col);
      const row = Number(cell.row);
      if (!Number.isInteger(col) || !Number.isInteger(row)) return null;
      if (!canPlaceGearItem(placedCheck, cell.itemId as GearItemId, col, row, rot)) {
        return null;
      }
      placedCheck.push({
        uid: `check-${i}`,
        itemId: cell.itemId as GearItemId,
        col,
        row,
        rotation: rot,
      });
      cleanGrid.push({ itemId: cell.itemId as GearItemId, col, row, rotation: rot });
    }

    return {
      version: 1,
      name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim().slice(0, 32) : 'Bóng Ma Tùy Chỉnh',
      title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim().slice(0, 48) : 'JSON Import',
      round: typeof obj.round === 'number' && obj.round >= 1 && obj.round <= 99 ? Math.round(obj.round) : 1,
      grid: cleanGrid,
    };
  } catch {
    return null;
  }
}

export function loadSavedGhostMap(): Record<string, GhostBuildSnapshot> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(GHOST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, GhostBuildSnapshot>;
  } catch {
    return {};
  }
}

export function saveGhostBuildForRound(snapshot: GhostBuildSnapshot): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadSavedGhostMap();
    existing[String(snapshot.round)] = snapshot;
    window.localStorage.setItem(GHOST_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }
}

export function getOpponentGhostForRound(round: number): GhostBuildSnapshot {
  const builtin = BUILTIN_GHOST_BUILDS[Math.max(0, Math.min(BUILTIN_GHOST_BUILDS.length - 1, round - 1))];
  return builtin;
}

export interface ArenaWaveStageInfo {
  stage: 1 | 2 | 3;
  label: string;
  spawnIntervalFactor: number;
}

export function getArenaWaveStage(elapsedSec: number, totalDurationSec: number): ArenaWaveStageInfo {
  const safeTotal = Math.max(1, totalDurationSec);
  const ratio = Math.max(0, Math.min(1, elapsedSec / safeTotal));
  if (ratio < 0.35) {
    return {
      stage: 1,
      label: 'GIAI ĐOẠN 1 · GIAO TRANH MỞ MÀN',
      spawnIntervalFactor: 1.0,
    };
  }
  if (ratio < 0.72) {
    return {
      stage: 2,
      label: '⚡ GIAI ĐOẠN 2 · ĐỢT QUÁI TĂNG VIỆN!',
      spawnIntervalFactor: 0.82,
    };
  }
  return {
    stage: 3,
    label: '🔥 GIAI ĐOẠN 3 · CAO TRÀO TỔNG LỰC!',
    spawnIntervalFactor: 0.68,
  };
}

