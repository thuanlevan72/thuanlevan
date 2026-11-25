export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherId = 'sunny' | 'drizzle' | 'heatwave' | 'breeze' | 'snow';

export type CropCategory = 'standard' | 'legume' | 'tropical' | 'fruit' | 'hybrid' | 'mushroom';

export type CropQuality = 'normal' | 'gold';

export type ToolId =
  | 'hoe'
  | 'water'
  | 'seed'
  | 'harvest'
  | 'compost'
  | 'mutagen'
  | 'build'
  | 'inspect';

export type ToolTier = 'wood' | 'copper' | 'iron';

export type AutomationId =
  | 'sprinkler'
  | 'scarecrow'
  | 'auto_feeder'
  | 'conveyor'
  | 'greenhouse';

export type MachineId =
  | 'windmill'
  | 'bakery'
  | 'dairy_vat'
  | 'press'
  | 'winery'
  | 'loom'
  | 'tailor'
  | 'composter'
  | 'kitchen';

export type LivestockType = 'cow' | 'sheep';

export type SpriteTask = 'sow' | 'harvest' | 'feed_machines';

export interface CropDef {
  id: string;
  name: string;
  category: CropCategory;
  seasons: readonly SeasonId[];
  seedPrice: number;
  sellPrice: number;
  /** Real seconds at 1x speed to reach maturity under baseline 100% speed (240s = 1 day) */
  growthSeconds: number;
  harvestYield: number;
  xp: number;
  fertilityDelta: number; // negative reduces fertility, positive (legumes) restores fertility
  selfHydrating?: boolean;
  auraGrowthBonus?: number; // +0.15 to 8 surrounding tiles
  description: string;
  colorPrimary: string;
  colorAccent: string;
  unlockLevel: number;
  isHybrid?: boolean;
  parents?: readonly [string, string];
  regrows?: boolean;
}

export interface HybridRecipeDef {
  id: string;
  parentA: string;
  parentB: string;
  resultCropId: string;
  name: string;
  traitSummary: string;
}

export interface ProductDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  sellPrice: number;
  category: 'crop' | 'animal' | 'artisan_t1' | 'artisan_t2' | 'food' | 'fertilizer';
  description: string;
  color: string;
  canAgeInCellar?: boolean;
  spriteEnergyValue?: number;
}

export interface ArtisanRecipeDef {
  id: string;
  machineId: MachineId;
  tier: 1 | 2 | 3;
  name: string;
  inputs: readonly { itemId: string; qty: number }[];
  outputItemId: string;
  outputQty: number;
  durationSeconds: number;
  xp: number;
  unlockLevel: number;
}

export interface AutomationBlueprintDef {
  id: AutomationId;
  name: string;
  goldCost: number;
  badgeCost: number;
  unlockLevel: number;
  description: string;
  shortEffect: string;
}

export interface TerraceDef {
  id: number;
  name: string;
  subtitle: string;
  costGold: number;
  minLevel: number;
  rowStart: number;
  rowEnd: number; // inclusive
  colStart: number;
  colEnd: number; // inclusive
  tileCount: number;
}

export const GRID_ROWS = 8;
export const GRID_COLS = 9;
export const DAY_DURATION_SECONDS = 240; // 4 real minutes = 1 in-game day
export const DAYS_PER_SEASON = 7;
export const MAX_OFFLINE_SECONDS = 43200; // 12 hours
export const OFFLINE_STEP_SECONDS = 60;

export const SEASON_ORDER: readonly SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_META: Record<
  SeasonId,
  {
    name: string;
    shortName: string;
    skyTop: string;
    skyBottom: string;
    grassLight: string;
    grassDark: string;
    cliffTop: string;
    cliffDeep: string;
    perkText: string;
  }
> = {
  spring: {
    name: 'Mùa Xuân',
    shortName: 'Xuân',
    skyTop: '#CBE9F7',
    skyBottom: '#F7EFE2',
    grassLight: '#8CC475',
    grassDark: '#6EA858',
    cliffTop: '#A47B5B',
    cliffDeep: '#7A563E',
    perkText: 'Mưa phùn tự tưới 100% · Cây ăn quả +25% sản lượng',
  },
  summer: {
    name: 'Mùa Hạ',
    shortName: 'Hạ',
    skyTop: '#AEE1F9',
    skyBottom: '#FFF3D1',
    grassLight: '#76BA59',
    grassDark: '#5A9B43',
    cliffTop: '#B28458',
    cliffDeep: '#845B3A',
    perkText: 'Nắng gắt khô đất ×2 · Mở khóa cây nhiệt đới giá cao',
  },
  autumn: {
    name: 'Mùa Thu',
    shortName: 'Thu',
    skyTop: '#F3D2B3',
    skyBottom: '#FCEAD5',
    grassLight: '#C99F52',
    grassDark: '#AE813B',
    cliffTop: '#9A6949',
    cliffDeep: '#6E4731',
    perkText: 'Giá bán nông sản +20% · Nấm rừng quý mọc ven rừng',
  },
  winter: {
    name: 'Mùa Đông',
    shortName: 'Đông',
    skyTop: '#C5D8EA',
    skyBottom: '#EDF3F8',
    grassLight: '#DCE8F2',
    grassDark: '#BFCFDF',
    cliffTop: '#7D8B9B',
    cliffDeep: '#596676',
    perkText: 'Ngoài trời đóng băng · Trồng trong Nhà Kính & chế biến kho',
  },
};

export const WEATHER_LABELS: Record<WeatherId, string> = {
  sunny: 'Nắng Ấm',
  drizzle: 'Mưa Phùn',
  heatwave: 'Nắng Gắt',
  breeze: 'Gió Mây Mát',
  snow: 'Tuyết Rơi',
};

export const TERRACES: readonly TerraceDef[] = [
  {
    id: 1,
    name: 'Tầng 1 · Thềm Mây Khởi Đầu',
    subtitle: '20 ô đất màu mỡ bên hiên nhà gỗ',
    costGold: 0,
    minLevel: 1,
    rowStart: 0,
    rowEnd: 3,
    colStart: 0,
    colEnd: 4,
    tileCount: 20,
  },
  {
    id: 2,
    name: 'Tầng 2 · Bậc Thang Gió Lộng',
    subtitle: 'Mở thêm 16 ô đất phía Đông',
    costGold: 380,
    minLevel: 3,
    rowStart: 0,
    rowEnd: 3,
    colStart: 5,
    colEnd: 8,
    tileCount: 16,
  },
  {
    id: 3,
    name: 'Tầng 3 · Vườn Sương & Ven Rừng',
    subtitle: 'Mở thêm 20 ô phía Nam sát rừng thông (mọc Nấm Thu)',
    costGold: 850,
    minLevel: 6,
    rowStart: 4,
    rowEnd: 7,
    colStart: 0,
    colEnd: 4,
    tileCount: 20,
  },
  {
    id: 4,
    name: 'Tầng 4 · Đỉnh Mây Huyền Thoại',
    subtitle: 'Mở toàn bộ 16 ô cao nguyên cuối cùng (Tổng 72 ô)',
    costGold: 1600,
    minLevel: 10,
    rowStart: 4,
    rowEnd: 7,
    colStart: 5,
    colEnd: 8,
    tileCount: 16,
  },
];

export const CROPS: Record<string, CropDef> = {
  lua_mi: {
    id: 'lua_mi',
    name: 'Lúa Mì Vàng',
    category: 'standard',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 12,
    sellPrice: 28,
    growthSeconds: 95,
    harvestYield: 2,
    xp: 12,
    fertilityDelta: -15,
    description: 'Cây lương thực nền tảng, xay thành bột mì tại Cối Xay Gió.',
    colorPrimary: '#E6B44B',
    colorAccent: '#F8D878',
    unlockLevel: 1,
  },
  ca_chua: {
    id: 'ca_chua',
    name: 'Cà Chua Đỏ',
    category: 'standard',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 18,
    sellPrice: 40,
    growthSeconds: 115,
    harvestYield: 2,
    xp: 16,
    fertilityDelta: -15,
    description: 'Mọng nước và dễ lai tạo cùng Ớt để ra Cà Chua Lửa.',
    colorPrimary: '#D94B3D',
    colorAccent: '#F27D65',
    unlockLevel: 1,
  },
  ot_chuong: {
    id: 'ot_chuong',
    name: 'Ớt Đỏ Cay',
    category: 'standard',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 20,
    sellPrice: 44,
    growthSeconds: 120,
    harvestYield: 2,
    xp: 18,
    fertilityDelta: -15,
    description: 'Mang nhiệt năng mạnh, nguyên liệu lai tạo Cà Chua Lửa.',
    colorPrimary: '#C83228',
    colorAccent: '#FF784F',
    unlockLevel: 1,
  },
  dau_ha_lan: {
    id: 'dau_ha_lan',
    name: 'Đậu Hà Lan',
    category: 'legume',
    seasons: ['spring', 'autumn'],
    seedPrice: 14,
    sellPrice: 26,
    growthSeconds: 90,
    harvestYield: 2,
    xp: 14,
    fertilityDelta: 22,
    description: 'Cây họ đậu luân canh giúp hồi phục +22% Độ màu mỡ đất sau khi thu hoạch!',
    colorPrimary: '#5FA648',
    colorAccent: '#9EE07A',
    unlockLevel: 1,
  },
  khoai_tay: {
    id: 'khoai_tay',
    name: 'Khoai Tây Bùi',
    category: 'standard',
    seasons: ['spring', 'autumn'],
    seedPrice: 22,
    sellPrice: 48,
    growthSeconds: 135,
    harvestYield: 2,
    xp: 20,
    fertilityDelta: -15,
    description: 'Củ chắc nặng, kết hợp Bí Ngô tạo giống Bí Khổng Lồ.',
    colorPrimary: '#C6975E',
    colorAccent: '#E7C18E',
    unlockLevel: 2,
  },
  bi_ngo: {
    id: 'bi_ngo',
    name: 'Bí Ngô Tròn',
    category: 'standard',
    seasons: ['autumn', 'spring'],
    seedPrice: 30,
    sellPrice: 72,
    growthSeconds: 170,
    harvestYield: 1,
    xp: 28,
    fertilityDelta: -15,
    description: 'Quả thu vàng đậm, nguyên liệu lai tạo Bí Khổng Lồ 10 quả.',
    colorPrimary: '#E37B27',
    colorAccent: '#F8A94D',
    unlockLevel: 2,
  },
  dau_tay: {
    id: 'dau_tay',
    name: 'Dâu Tây Mây',
    category: 'fruit',
    seasons: ['spring', 'summer'],
    seedPrice: 36,
    sellPrice: 64,
    growthSeconds: 140,
    harvestYield: 2,
    xp: 24,
    fertilityDelta: -15,
    regrows: true,
    description: 'Cây ăn quả thơm ngọt (+25% sản lượng Mùa Xuân). Làm Bánh Phô Mai Dâu Tây.',
    colorPrimary: '#E23E57',
    colorAccent: '#FF8599',
    unlockLevel: 3,
  },
  hoa_oai_huong: {
    id: 'hoa_oai_huong',
    name: 'Hoa Oải Hương',
    category: 'standard',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 28,
    sellPrice: 58,
    growthSeconds: 130,
    harvestYield: 2,
    xp: 22,
    fertilityDelta: -12,
    description: 'Tỏa hương dịu, lai cùng Lúa Mì để tạo Lúa Mạch Tím.',
    colorPrimary: '#8C6BB1',
    colorAccent: '#C5A9E6',
    unlockLevel: 3,
  },
  nho_tim: {
    id: 'nho_tim',
    name: 'Nho Tím Thung Lũng',
    category: 'fruit',
    seasons: ['summer', 'autumn'],
    seedPrice: 44,
    sellPrice: 78,
    growthSeconds: 165,
    harvestYield: 2,
    xp: 30,
    fertilityDelta: -15,
    regrows: true,
    description: 'Ép lấy nước cốt và ủ lâu năm trong Hầm Rượu (+25% sản lượng Mùa Xuân nếu trồng Nhà Kính).',
    colorPrimary: '#6D3E8E',
    colorAccent: '#A56CD0',
    unlockLevel: 4,
  },
  thanh_long: {
    id: 'thanh_long',
    name: 'Thanh Long Nhiệt Đới',
    category: 'tropical',
    seasons: ['summer'],
    seedPrice: 60,
    sellPrice: 145,
    growthSeconds: 185,
    harvestYield: 2,
    xp: 42,
    fertilityDelta: -15,
    description: 'Đặc sản Mùa Hạ (hoặc Nhà Kính), bán giá rất cao.',
    colorPrimary: '#D92E7F',
    colorAccent: '#9EE668',
    unlockLevel: 5,
  },
  bong_vai: {
    id: 'bong_vai',
    name: 'Bông Vải Trắng',
    category: 'standard',
    seasons: ['summer', 'autumn'],
    seedPrice: 26,
    sellPrice: 54,
    growthSeconds: 140,
    harvestYield: 2,
    xp: 22,
    fertilityDelta: -15,
    description: 'Dệt thành Vải Thô tại Khung Cửi để may Thảm & Áo cao cấp.',
    colorPrimary: '#F2EFE9',
    colorAccent: '#D8CFC2',
    unlockLevel: 4,
  },

  // --- HYBRIDS (Lai tạo & đột biến gen) ---
  ca_chua_lua: {
    id: 'ca_chua_lua',
    name: 'Cà Chua Lửa',
    category: 'hybrid',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    seedPrice: 0,
    sellPrice: 145,
    growthSeconds: 135,
    harvestYield: 2,
    xp: 55,
    fertilityDelta: -10,
    selfHydrating: true,
    isHybrid: true,
    parents: ['ca_chua', 'ot_chuong'],
    description: 'Giống lai hiếm: Tự giữ ẩm 100%, không bao giờ cần tưới nước!',
    colorPrimary: '#FF5328',
    colorAccent: '#FFD25A',
    unlockLevel: 1,
  },
  lua_mach_tim: {
    id: 'lua_mach_tim',
    name: 'Lúa Mạch Tím',
    category: 'hybrid',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 0,
    sellPrice: 165,
    growthSeconds: 150,
    harvestYield: 2,
    xp: 65,
    fertilityDelta: -10,
    auraGrowthBonus: 0.15,
    isHybrid: true,
    parents: ['lua_mi', 'hoa_oai_huong'],
    description: 'Giống lai hiếm: Tỏa hào quang tăng +15% tốc độ lớn cho 8 ô xung quanh!',
    colorPrimary: '#7C4DFF',
    colorAccent: '#D1B3FF',
    unlockLevel: 1,
  },
  bi_khong_lo: {
    id: 'bi_khong_lo',
    name: 'Bí Khổng Lồ',
    category: 'hybrid',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 0,
    sellPrice: 95,
    growthSeconds: 720, // 3 in-game days
    harvestYield: 10,
    xp: 120,
    fertilityDelta: -15,
    isHybrid: true,
    parents: ['bi_ngo', 'khoai_tay'],
    description: 'Giống lai đột biến: Mất 3 ngày để lớn, thu hoạch 10 quả khổng lồ cùng lúc!',
    colorPrimary: '#EA6817',
    colorAccent: '#FFE082',
    unlockLevel: 1,
  },
  nho_ruby: {
    id: 'nho_ruby',
    name: 'Nho Ruby Pha Lê',
    category: 'hybrid',
    seasons: ['spring', 'summer', 'autumn'],
    seedPrice: 0,
    sellPrice: 210,
    growthSeconds: 180,
    harvestYield: 2,
    xp: 80,
    fertilityDelta: -12,
    isHybrid: true,
    parents: ['dau_tay', 'nho_tim'],
    description: 'Giống lai quý: Vị ngọt thanh khiết, ép rượu vang giá trị cực cao.',
    colorPrimary: '#B81D5B',
    colorAccent: '#FF9EBA',
    unlockLevel: 1,
  },
  dau_phep: {
    id: 'dau_phep',
    name: 'Đậu Pha Lê Xanh',
    category: 'hybrid',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    seedPrice: 0,
    sellPrice: 130,
    growthSeconds: 120,
    harvestYield: 3,
    xp: 60,
    fertilityDelta: 40,
    isHybrid: true,
    parents: ['dau_ha_lan', 'ca_chua'],
    description: 'Giống lai thần kỳ: Hồi phục +40% Độ màu mỡ cho ô đất khi thu hoạch!',
    colorPrimary: '#20B2AA',
    colorAccent: '#9EF7ED',
    unlockLevel: 1,
  },

  // --- AUTUMN WILD MUSHROOM ---
  nam_rung_quy: {
    id: 'nam_rung_quy',
    name: 'Nấm Rừng Quý',
    category: 'mushroom',
    seasons: ['autumn'],
    seedPrice: 0,
    sellPrice: 190,
    growthSeconds: 60,
    harvestYield: 1,
    xp: 45,
    fertilityDelta: 5,
    description: 'Tự mọc ven rừng vào Mùa Thu, hương vị thượng hạng cho Bếp Bánh & Chợ Phiên.',
    colorPrimary: '#A45A3F',
    colorAccent: '#F3CFA4',
    unlockLevel: 1,
  },
};

export const HYBRID_RECIPES: readonly HybridRecipeDef[] = [
  {
    id: 'hybrid_ca_chua_lua',
    parentA: 'ca_chua',
    parentB: 'ot_chuong',
    resultCropId: 'ca_chua_lua',
    name: 'Cà Chua Lửa',
    traitSummary: 'Tự giữ ẩm 100%, không cần tưới nước',
  },
  {
    id: 'hybrid_lua_mach_tim',
    parentA: 'lua_mi',
    parentB: 'hoa_oai_huong',
    resultCropId: 'lua_mach_tim',
    name: 'Lúa Mạch Tím',
    traitSummary: 'Hào quang +15% tốc độ lớn cho 8 ô xung quanh',
  },
  {
    id: 'hybrid_bi_khong_lo',
    parentA: 'bi_ngo',
    parentB: 'khoai_tay',
    resultCropId: 'bi_khong_lo',
    name: 'Bí Khổng Lồ',
    traitSummary: '3 ngày trưởng thành · Thu hoạch 10 quả cùng lúc',
  },
  {
    id: 'hybrid_nho_ruby',
    parentA: 'dau_tay',
    parentB: 'nho_tim',
    resultCropId: 'nho_ruby',
    name: 'Nho Ruby Pha Lê',
    traitSummary: 'Giống quả quý giá bán cực cao',
  },
  {
    id: 'hybrid_dau_phep',
    parentA: 'dau_ha_lan',
    parentB: 'ca_chua',
    resultCropId: 'dau_phep',
    name: 'Đậu Pha Lê Xanh',
    traitSummary: 'Hồi phục +40% Độ màu mỡ cho đất',
  },
];

export const ITEMS: Record<string, ProductDef> = {
  // Raw crops (auto-aligned with CROPS)
  ...Object.fromEntries(
    Object.values(CROPS).map((c) => [
      c.id,
      {
        id: c.id,
        name: c.name,
        tier: 1 as const,
        sellPrice: c.sellPrice,
        category: 'crop' as const,
        description: c.description,
        color: c.colorPrimary,
      },
    ])
  ),
  // Farm waste & organic inputs
  co_dai: {
    id: 'co_dai',
    name: 'Cỏ Dại & Lá Rụng',
    tier: 1,
    sellPrice: 3,
    category: 'fertilizer',
    description: 'Nhổ từ cỏ dại mọc trên ruộng. Dùng ủ Phân Hữu Cơ tại Thùng Ủ Phân.',
    color: '#6B8E4E',
  },
  phan_huu_co: {
    id: 'phan_huu_co',
    name: 'Phân Hữu Cơ',
    tier: 1,
    sellPrice: 18,
    category: 'fertilizer',
    description: 'Hồi phục +35% Độ màu mỡ cho ô đất.',
    color: '#6F4E37',
  },
  phan_dot_bien: {
    id: 'phan_dot_bien',
    name: 'Phân Đột Biến Gen',
    tier: 2,
    sellPrice: 42,
    category: 'fertilizer',
    description: 'Tăng tỷ lệ lai tạo Mầm Lai từ 10% lên 35% trên ô đất trống.',
    color: '#9B5DE5',
  },

  // Animal raw products
  sua_bo: {
    id: 'sua_bo',
    name: 'Sữa Bò Tươi',
    tier: 1,
    sellPrice: 52,
    category: 'animal',
    description: 'Vắt từ Bò Sữa mỗi ngày. Dùng ủ Bơ & Phô Mai.',
    color: '#FFFDF7',
  },
  long_cuu: {
    id: 'long_cuu',
    name: 'Lông Cừu Mềm',
    tier: 1,
    sellPrice: 58,
    category: 'animal',
    description: 'Xén từ Cừu Trắng. Dệt thành Vải Thô và Áo Len Cao Cấp.',
    color: '#F3EDE2',
  },
  co_kho: {
    id: 'co_kho',
    name: 'Cỏ Khô Thức Ăn',
    tier: 1,
    sellPrice: 12,
    category: 'fertilizer',
    description: 'Thức ăn hàng ngày cho Bò & Cừu.',
    color: '#C7A951',
  },

  // Artisan Tier 1 -> Tier 2 (intermediate)
  bot_mi: {
    id: 'bot_mi',
    name: 'Bột Mì Mịn',
    tier: 2,
    sellPrice: 68,
    category: 'artisan_t1',
    description: 'Xay từ Lúa Mì tại Cối Xay Gió.',
    color: '#F5E7C6',
  },
  bo_tuoi: {
    id: 'bo_tuoi',
    name: 'Bơ Thảo Mộc',
    tier: 2,
    sellPrice: 95,
    category: 'artisan_t1',
    description: 'Đánh từ Sữa Bò Tươi trong Thùng Ủ Sữa.',
    color: '#F7D26A',
  },
  pho_mai: {
    id: 'pho_mai',
    name: 'Phô Mai Vàng',
    tier: 2,
    sellPrice: 125,
    category: 'artisan_t1',
    description: 'Ủ từ Sữa Bò Tươi, béo ngậy cho Bếp Bánh.',
    color: '#F4B844',
  },
  nuoc_ep_nho: {
    id: 'nuoc_ep_nho',
    name: 'Nước Ép Trái Cây',
    tier: 2,
    sellPrice: 135,
    category: 'artisan_t1',
    description: 'Ép từ Nho / Dâu Tây tại Thùng Ép.',
    color: '#933B87',
  },
  vai_tho: {
    id: 'vai_tho',
    name: 'Vải Thô Mây',
    tier: 2,
    sellPrice: 118,
    category: 'artisan_t1',
    description: 'Dệt từ Bông Vải hoặc Lông Cừu tại Khung Cửi.',
    color: '#E5DCCB',
  },

  // Artisan Tier 3 (High-value crafted goods + Sprite Energy Meals)
  banh_mi_bo_toi: {
    id: 'banh_mi_bo_toi',
    name: 'Bánh Mì Bơ Tỏi',
    tier: 3,
    sellPrice: 240,
    category: 'food',
    description: 'Sản phẩm Cấp 3 từ Lò Nướng. Rất được chuộng ở Bảng Đơn Hàng & nạp +50 Năng Lượng Tinh Linh.',
    color: '#DF9742',
    spriteEnergyValue: 50,
  },
  banh_pho_mai_dau: {
    id: 'banh_pho_mai_dau',
    name: 'Bánh Phô Mai Dâu Tây',
    tier: 3,
    sellPrice: 340,
    category: 'food',
    description: 'Đặc sản Cấp 3 từ Bếp Bánh. Bán siêu lời & nạp +80 Năng Lượng Tinh Linh.',
    color: '#F26A8D',
    spriteEnergyValue: 80,
  },
  sup_bi_nam: {
    id: 'sup_bi_nam',
    name: 'Súp Bí Nấm Rừng',
    tier: 3,
    sellPrice: 380,
    category: 'food',
    description: 'Món nóng hổi từ Bếp Nấu Ăn. Nạp +100 Năng Lượng Tinh Linh.',
    color: '#E5802E',
    spriteEnergyValue: 100,
  },
  ruou_vang: {
    id: 'ruou_vang',
    name: 'Rượu Vang Lâu Năm',
    tier: 3,
    sellPrice: 410,
    category: 'artisan_t2',
    description: 'Ủ trong Hầm Rượu; để càng lâu ngày giá trị càng tăng (+15% mỗi ngày ủ thêm, tối đa +90%)!',
    color: '#6C1D45',
    canAgeInCellar: true,
  },
  ao_len_cao_cap: {
    id: 'ao_len_cao_cap',
    name: 'Áo Len Thêu Tay',
    tier: 3,
    sellPrice: 330,
    category: 'artisan_t2',
    description: 'Sản phẩm thủ công Cấp 3 từ Xưởng May.',
    color: '#4E79A7',
  },
};

export const MACHINES: Record<MachineId, { id: MachineId; name: string; tier: 1 | 2 | 3; subtitle: string }> = {
  composter: { id: 'composter', name: 'Thùng Ủ Phân', tier: 1, subtitle: 'Ủ Cỏ Dại → Phân Hữu Cơ & Đột Biến' },
  windmill: { id: 'windmill', name: 'Cối Xay Gió', tier: 1, subtitle: 'Xay Lúa Mì / Lúa Mạch → Bột Mì' },
  dairy_vat: { id: 'dairy_vat', name: 'Thùng Ủ Sữa', tier: 2, subtitle: 'Sữa Bò → Bơ Thảo Mộc / Phô Mai' },
  press: { id: 'press', name: 'Thùng Ép Quả', tier: 2, subtitle: 'Nho / Dâu → Nước Ép Tươi' },
  loom: { id: 'loom', name: 'Khung Cửi', tier: 2, subtitle: 'Bông Vải / Lông Cừu → Vải Thô' },
  bakery: { id: 'bakery', name: 'Lò Nướng & Bếp Bánh', tier: 3, subtitle: 'Bột Mì + Bơ/Phô Mai → Bánh Thủ Công' },
  winery: { id: 'winery', name: 'Hầm Ủ Rượu', tier: 3, subtitle: 'Nước Ép → Rượu Vang (Tăng giá theo ngày ủ)' },
  tailor: { id: 'tailor', name: 'Xưởng May Ấm', tier: 3, subtitle: 'Vải Thô + Lông Cừu → Áo Len Thêu Tay' },
  kitchen: { id: 'kitchen', name: 'Bếp Nấu Ăn', tier: 3, subtitle: 'Nấu món nóng tiếp năng lượng Tinh Linh Đất' },
};

export const ARTISAN_RECIPES: readonly ArtisanRecipeDef[] = [
  {
    id: 'rec_phan_huu_co',
    machineId: 'composter',
    tier: 1,
    name: 'Phân Hữu Cơ',
    inputs: [{ itemId: 'co_dai', qty: 2 }],
    outputItemId: 'phan_huu_co',
    outputQty: 2,
    durationSeconds: 30,
    xp: 12,
    unlockLevel: 1,
  },
  {
    id: 'rec_phan_dot_bien',
    machineId: 'composter',
    tier: 2,
    name: 'Phân Đột Biến Gen',
    inputs: [
      { itemId: 'co_dai', qty: 2 },
      { itemId: 'hoa_oai_huong', qty: 1 },
    ],
    outputItemId: 'phan_dot_bien',
    outputQty: 2,
    durationSeconds: 45,
    xp: 26,
    unlockLevel: 2,
  },
  {
    id: 'rec_bot_mi',
    machineId: 'windmill',
    tier: 1,
    name: 'Xay Bột Mì Mịn',
    inputs: [{ itemId: 'lua_mi', qty: 2 }],
    outputItemId: 'bot_mi',
    outputQty: 2,
    durationSeconds: 35,
    xp: 16,
    unlockLevel: 1,
  },
  {
    id: 'rec_bot_mi_tim',
    machineId: 'windmill',
    tier: 2,
    name: 'Bột Mì Lúa Mạch Tím',
    inputs: [{ itemId: 'lua_mach_tim', qty: 1 }],
    outputItemId: 'bot_mi',
    outputQty: 3,
    durationSeconds: 30,
    xp: 28,
    unlockLevel: 1,
  },
  {
    id: 'rec_bo_tuoi',
    machineId: 'dairy_vat',
    tier: 2,
    name: 'Đánh Bơ Thảo Mộc',
    inputs: [{ itemId: 'sua_bo', qty: 1 }],
    outputItemId: 'bo_tuoi',
    outputQty: 1,
    durationSeconds: 45,
    xp: 22,
    unlockLevel: 2,
  },
  {
    id: 'rec_pho_mai',
    machineId: 'dairy_vat',
    tier: 2,
    name: 'Ủ Phô Mai Vàng',
    inputs: [{ itemId: 'sua_bo', qty: 2 }],
    outputItemId: 'pho_mai',
    outputQty: 2,
    durationSeconds: 60,
    xp: 32,
    unlockLevel: 2,
  },
  {
    id: 'rec_nuoc_ep',
    machineId: 'press',
    tier: 2,
    name: 'Ép Nước Nho Tươi',
    inputs: [{ itemId: 'nho_tim', qty: 2 }],
    outputItemId: 'nuoc_ep_nho',
    outputQty: 2,
    durationSeconds: 50,
    xp: 28,
    unlockLevel: 3,
  },
  {
    id: 'rec_nuoc_ep_ruby',
    machineId: 'press',
    tier: 2,
    name: 'Ép Nước Nho Ruby',
    inputs: [{ itemId: 'nho_ruby', qty: 1 }],
    outputItemId: 'nuoc_ep_nho',
    outputQty: 3,
    durationSeconds: 45,
    xp: 40,
    unlockLevel: 3,
  },
  {
    id: 'rec_vai_tho',
    machineId: 'loom',
    tier: 2,
    name: 'Dệt Vải Thô Mây',
    inputs: [{ itemId: 'bong_vai', qty: 2 }],
    outputItemId: 'vai_tho',
    outputQty: 2,
    durationSeconds: 50,
    xp: 26,
    unlockLevel: 3,
  },
  {
    id: 'rec_banh_mi_bo_toi',
    machineId: 'bakery',
    tier: 3,
    name: 'Nướng Bánh Mì Bơ Tỏi',
    inputs: [
      { itemId: 'bot_mi', qty: 1 },
      { itemId: 'bo_tuoi', qty: 1 },
    ],
    outputItemId: 'banh_mi_bo_toi',
    outputQty: 1,
    durationSeconds: 65,
    xp: 45,
    unlockLevel: 2,
  },
  {
    id: 'rec_banh_pho_mai_dau',
    machineId: 'bakery',
    tier: 3,
    name: 'Bánh Phô Mai Dâu Tây',
    inputs: [
      { itemId: 'pho_mai', qty: 1 },
      { itemId: 'dau_tay', qty: 2 },
    ],
    outputItemId: 'banh_pho_mai_dau',
    outputQty: 1,
    durationSeconds: 80,
    xp: 60,
    unlockLevel: 3,
  },
  {
    id: 'rec_ruou_vang',
    machineId: 'winery',
    tier: 3,
    name: 'Ủ Rượu Vang Lâu Năm',
    inputs: [{ itemId: 'nuoc_ep_nho', qty: 2 }],
    outputItemId: 'ruou_vang',
    outputQty: 1,
    durationSeconds: 95,
    xp: 75,
    unlockLevel: 4,
  },
  {
    id: 'rec_ao_len',
    machineId: 'tailor',
    tier: 3,
    name: 'May Áo Len Thêu Tay',
    inputs: [
      { itemId: 'vai_tho', qty: 1 },
      { itemId: 'long_cuu', qty: 1 },
    ],
    outputItemId: 'ao_len_cao_cap',
    outputQty: 1,
    durationSeconds: 75,
    xp: 58,
    unlockLevel: 4,
  },
  {
    id: 'rec_sup_bi_nam',
    machineId: 'kitchen',
    tier: 3,
    name: 'Nấu Súp Bí Nấm Rừng',
    inputs: [
      { itemId: 'bi_ngo', qty: 1 },
      { itemId: 'ca_chua', qty: 1 },
    ],
    outputItemId: 'sup_bi_nam',
    outputQty: 1,
    durationSeconds: 55,
    xp: 48,
    unlockLevel: 2,
  },
];

export const AUTOMATION_BLUEPRINTS: Record<AutomationId, AutomationBlueprintDef> = {
  sprinkler: {
    id: 'sprinkler',
    name: 'Vòi Tưới Tự Động',
    goldCost: 140,
    badgeCost: 1,
    unlockLevel: 5,
    description: 'Tự động tưới đẫm 8 ô xung quanh mỗi sáng sớm bình minh.',
    shortEffect: 'Tưới 8 ô xung quanh',
  },
  scarecrow: {
    id: 'scarecrow',
    name: 'Bù Nhìn Cơ Khí',
    goldCost: 110,
    badgeCost: 1,
    unlockLevel: 4,
    description: 'Xua đuổi chim mổ hạt và giảm 70% nguy cơ sâu bệnh trong bán kính 2 ô.',
    shortEffect: 'Chống chim & sâu (bán kính 2)',
  },
  conveyor: {
    id: 'conveyor',
    name: 'Băng Chuyền Ngắn',
    goldCost: 180,
    badgeCost: 2,
    unlockLevel: 6,
    description: 'Tự động thu hoạch cây chín ở 4 ô liền kề và chuyển thẳng vào Kho Nông Sản.',
    shortEffect: 'Tự thu hoạch 4 ô kề',
  },
  auto_feeder: {
    id: 'auto_feeder',
    name: 'Máng Ăn Tự Động',
    goldCost: 220,
    badgeCost: 2,
    unlockLevel: 6,
    description: 'Tự động cho toàn bộ Bò & Cừu ăn cỏ khô mỗi ngày không lo quên.',
    shortEffect: 'Tự động nuôi chuồng trại',
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Mái Vòm Nhà Kính',
    goldCost: 260,
    badgeCost: 2,
    unlockLevel: 7,
    description: 'Bảo vệ ô đất & 4 ô kề khỏi đóng băng Mùa Đông và cho phép trồng cây mọi mùa.',
    shortEffect: 'Chống rét Đông (5 ô)',
  },
};

export const TOOL_UPGRADE_COSTS: Record<Exclude<ToolTier, 'wood'>, { gold: number; minLevel: number; label: string; areaText: string }> = {
  copper: {
    gold: 240,
    minLevel: 3,
    label: 'Bộ Công Cụ Đồng',
    areaText: 'Thao tác 3 ô ngang (1×3) cùng lúc',
  },
  iron: {
    gold: 620,
    minLevel: 5,
    label: 'Bộ Công Cụ Sắt Rèn',
    areaText: 'Thao tác toàn vùng 3×3 (9 ô) cùng lúc',
  },
};

export function getXpForNextLevel(level: number): number {
  return Math.round(90 + level * 45 + Math.pow(level, 1.35) * 18);
}

export function getToolAreaOffsets(tier: ToolTier): readonly [number, number][] {
  if (tier === 'wood') return [[0, 0]];
  if (tier === 'copper') {
    return [
      [0, -1],
      [0, 0],
      [0, 1],
    ];
  }
  const offsets: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      offsets.push([dr, dc]);
    }
  }
  return offsets;
}
