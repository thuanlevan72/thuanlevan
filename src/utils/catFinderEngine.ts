export const CAT_SCENE_W = 1360;
export const CAT_SCENE_H = 680;
export const CAT_MIN_ZOOM = 1;
export const CAT_MAX_ZOOM = 3.6;
export const CAT_COMBO_WINDOW_MS = 3800;

export type CatSoundCategory = 'cat' | 'dog' | 'drink' | 'pastry' | 'charm' | 'secret';

export type CatWorldTheme =
  | 'bakery'
  | 'flower_alley'
  | 'pet_cafe'
  | 'night_market'
  | 'fireworks';

export type CatDifficultyId = 'hard_5x' | 'nightmare_8x' | 'eagle_10x' | 'god_ray_20x';

export interface CatDifficultyConfig {
  id: CatDifficultyId;
  label: string;
  multiplierBadge: string;
  tagline: string;
  itemScaleMult: number;
  hitboxScale: number;
  maxHearts: number;
  maxHints: number;
  hintRadius: number;
  activeQueueLimit: number | null;
  coverAutoCloseSec: number | null;
  spotlightRadius: number | null;
  spotlightOpacity: number;
  camoOpacity: number;
  decoyDensityMult: number;
}

export const CAT_DIFFICULTIES: Record<CatDifficultyId, CatDifficultyConfig> = {
  hard_5x: {
    id: 'hard_5x',
    label: 'Khó ×5',
    multiplierBadge: '×5',
    tagline: '24–27 đồ xinh · +44 đồ giả · Không giới hạn giờ · 7 Tim · 2 Gợi ý',
    itemScaleMult: 0.74,
    hitboxScale: 0.82,
    maxHearts: 7,
    maxHints: 2,
    hintRadius: 118,
    activeQueueLimit: null,
    coverAutoCloseSec: null,
    spotlightRadius: null,
    spotlightOpacity: 0,
    camoOpacity: 0.92,
    decoyDensityMult: 1,
  },
  nightmare_8x: {
    id: 'nightmare_8x',
    label: 'Ác Mộng ×8',
    multiplierBadge: '×8',
    tagline: 'Thu nhỏ + ngụy trang · 5 món/lượt · Không giới hạn giờ · 5 Tim · 1 Gợi ý',
    itemScaleMult: 0.62,
    hitboxScale: 0.7,
    maxHearts: 5,
    maxHints: 1,
    hintRadius: 155,
    activeQueueLimit: 5,
    coverAutoCloseSec: 13,
    spotlightRadius: 295,
    spotlightOpacity: 0.42,
    camoOpacity: 0.84,
    decoyDensityMult: 1,
  },
  eagle_10x: {
    id: 'eagle_10x',
    label: 'Mắt Đại Bàng ×10',
    multiplierBadge: '×10',
    tagline: 'Siêu nhỏ · Đèn soi 215px · 3 món/lượt · Nắp tự đóng 8.5s · 3 Tim',
    itemScaleMult: 0.52,
    hitboxScale: 0.6,
    maxHearts: 3,
    maxHints: 0,
    hintRadius: 185,
    activeQueueLimit: 3,
    coverAutoCloseSec: 8.5,
    spotlightRadius: 215,
    spotlightOpacity: 0.72,
    camoOpacity: 0.76,
    decoyDensityMult: 1,
  },
  god_ray_20x: {
    id: 'god_ray_20x',
    label: 'Siêu Thần Ánh Xạ ×20',
    multiplierBadge: '×20',
    tagline: 'Thần Nhãn 165px · 1 món/lượt · Nắp đóng 5.5s · 2 Tim · 0 Gợi ý',
    itemScaleMult: 0.44,
    hitboxScale: 0.52,
    maxHearts: 2,
    maxHints: 0,
    hintRadius: 205,
    activeQueueLimit: 1,
    coverAutoCloseSec: 5.5,
    spotlightRadius: 165,
    spotlightOpacity: 0.84,
    camoOpacity: 0.68,
    decoyDensityMult: 1,
  },
};

export interface CatCoverDef {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind:
    | 'tin_lid'
    | 'curtain'
    | 'bush'
    | 'glass_door'
    | 'pet_tent'
    | 'pastry_door'
    | 'tarp'
    | 'noren'
    | 'festival_curtain'
    | 'stall_box';
  openOffsetX: number;
  openOffsetY: number;
  openRotateDeg: number;
  tapsRequired?: number;
  isDecoy?: boolean;
}

export interface CatDecoyDef {
  id: string;
  artKey: string;
  x: number;
  y: number;
  scale?: number;
  rotateDeg?: number;
  opacity?: number;
  mutedTint?: boolean;
}

export interface CatItemDef {
  id: string;
  label: string;
  artKey: string;
  soundCategory: CatSoundCategory;
  x: number;
  y: number;
  hitW: number;
  hitH: number;
  scale?: number;
  rotateDeg?: number;
  hiddenUnderCoverId?: string;
  isSecretGoldenCat?: boolean;
  camoBlend?: boolean;
}

export interface CatStageDef {
  id: string;
  order: number;
  title: string;
  theme: CatWorldTheme;
  isSecretStage?: boolean;
  mapX: number;
  mapY: number;
  palette: {
    skyTop: string;
    skyBottom: string;
    ground: string;
    accent: string;
    ink: string;
  };
  covers: CatCoverDef[];
  decoys: CatDecoyDef[];
  items: CatItemDef[];
}

export interface CatStageSave {
  foundItemIds: string[];
  foundSecretCat: boolean;
  cleared: boolean;
  bestStars: number;
  bestTimeSec: number | null;
  bestCombo: number;
}

export interface CatFinderSaveData {
  activeStageId: string;
  difficultyId: CatDifficultyId;
  stages: Record<string, CatStageSave>;
}

export interface CatPanZoom {
  scale: number;
  panX: number;
  panY: number;
}

export interface CatComboResult {
  nextStreak: number;
  isComboBoost: boolean;
  nextLastFindAtMs: number;
}

export interface CatHintTarget {
  item: CatItemDef;
  needsCoverId: string | null;
  x: number;
  y: number;
}

const DECOY_ROTATIONS = [-28, -14, 0, 12, 26, -38, 34, -8, 18];

function buildStageDecoys(
  prefix: string,
  artPool: readonly string[],
  coords: readonly [number, number][]
): CatDecoyDef[] {
  return coords.map(([x, y], idx) => ({
    id: `${prefix}-decoy-${idx + 1}`,
    artKey: artPool[idx % artPool.length],
    x,
    y,
    scale: Number((0.52 + (idx % 4) * 0.08).toFixed(2)),
    rotateDeg: DECOY_ROTATIONS[idx % DECOY_ROTATIONS.length],
    opacity: idx % 3 === 0 ? 0.72 : 0.88,
    mutedTint: idx % 2 === 0,
  }));
}

const BAKERY_DECOY_COORDS: readonly [number, number][] = [
  [82, 118], [135, 195], [160, 290], [218, 360], [285, 132], [355, 222], [410, 118],
  [470, 310], [515, 145], [608, 195], [642, 322], [730, 138], [805, 215], [848, 308],
  [930, 145], [978, 268], [1055, 145], [1095, 320], [1165, 152], [1235, 325], [1295, 240],
  [95, 425], [158, 468], [212, 590], [295, 595], [372, 468], [462, 575], [538, 520],
  [615, 568], [678, 498], [768, 575], [835, 495], [918, 562], [992, 488], [1072, 575],
  [1148, 465], [1215, 592], [1285, 495], [1302, 588], [348, 345], [585, 295], [790, 442],
  [962, 388], [1135, 248],
];

const FLOWER_DECOY_COORDS: readonly [number, number][] = [
  [88, 198], [148, 295], [202, 135], [275, 242], [342, 155], [402, 345], [472, 175],
  [548, 285], [612, 148], [675, 265], [748, 315], [818, 225], [872, 138], [945, 165],
  [1018, 285], [1085, 212], [1162, 195], [1228, 245], [1285, 165], [92, 458], [168, 398],
  [218, 585], [312, 395], [388, 565], [462, 502], [538, 585], [615, 472], [685, 588],
  [758, 442], [825, 568], [902, 485], [978, 582], [1052, 442], [1128, 575], [1198, 485],
  [1278, 568], [155, 615], [492, 378], [662, 405], [838, 368], [1028, 382], [1195, 322],
  [335, 608], [865, 605],
];

const PET_CAFE_DECOY_COORDS: readonly [number, number][] = [
  [92, 125], [158, 245], [225, 165], [295, 298], [365, 178], [435, 295], [505, 132],
  [585, 315], [648, 212], [728, 288], [798, 148], [868, 212], [938, 138], [1018, 245],
  [1092, 298], [1168, 178], [1248, 248], [1295, 142], [95, 438], [155, 562], [232, 368],
  [318, 598], [392, 468], [468, 592], [542, 432], [625, 578], [698, 465], [778, 585],
  [855, 505], [932, 575], [1005, 452], [1082, 588], [1162, 448], [1238, 582], [1298, 472],
  [285, 215], [478, 218], [652, 362], [818, 365], [1025, 362], [1195, 295], [348, 520],
  [735, 535], [1065, 515],
];

const NIGHT_MARKET_DECOY_COORDS: readonly [number, number][] = [
  [85, 135], [148, 255], [222, 212], [292, 148], [368, 285], [432, 155], [512, 215],
  [588, 158], [658, 285], [735, 185], [802, 265], [878, 145], [955, 325], [1028, 155],
  [1105, 148], [1185, 265], [1258, 185], [1302, 312], [88, 435], [152, 565], [242, 365],
  [312, 582], [395, 478], [478, 592], [548, 535], [632, 585], [705, 445], [785, 582],
  [862, 495], [938, 578], [1015, 448], [1095, 578], [1168, 465], [1248, 582], [1295, 435],
  [272, 315], [488, 355], [688, 368], [892, 398], [1068, 378], [1192, 355], [385, 565],
  [602, 355], [818, 495],
];

const FIREWORKS_DECOY_COORDS: readonly [number, number][] = [
  [92, 145], [158, 245], [228, 178], [302, 135], [375, 218], [448, 285], [528, 188],
  [605, 142], [685, 265], [762, 198], [838, 145], [912, 268], [985, 225], [1062, 148],
  [1138, 198], [1218, 145], [1288, 295], [85, 422], [148, 545], [238, 495], [318, 585],
  [392, 538], [468, 582], [542, 412], [618, 582], [692, 455], [768, 578], [848, 475],
  [925, 585], [1002, 392], [1078, 582], [1152, 458], [1235, 582], [1292, 438], [248, 378],
  [442, 372], [635, 365], [842, 392], [1052, 325], [1195, 318], [348, 475], [732, 432],
  [885, 535], [1108, 488],
];

export const CAT_STAGES: readonly CatStageDef[] = [
  {
    id: 'morning-bakery',
    order: 1,
    title: 'Tiệm Bánh Buổi Sáng',
    theme: 'bakery',
    mapX: 115,
    mapY: 165,
    palette: {
      skyTop: '#FFF7E8',
      skyBottom: '#FDE8D7',
      ground: '#F7DEC8',
      accent: '#E88B73',
      ink: '#4A362C',
    },
    covers: [
      {
        id: 'bk-cover-tin',
        label: 'Hộp bánh thiếc khóa chốt',
        x: 682,
        y: 350,
        w: 114,
        h: 92,
        kind: 'tin_lid',
        openOffsetX: 34,
        openOffsetY: -68,
        openRotateDeg: -22,
        tapsRequired: 2,
      },
      {
        id: 'bk-cover-curtain',
        label: 'Rèm cửa sổ buộc nơ',
        x: 198,
        y: 160,
        w: 126,
        h: 148,
        kind: 'curtain',
        openOffsetX: -76,
        openOffsetY: 0,
        openRotateDeg: -6,
        tapsRequired: 2,
      },
      {
        id: 'bk-cover-pastry-door',
        label: 'Tủ kính bánh ngọt',
        x: 472,
        y: 185,
        w: 112,
        h: 110,
        kind: 'pastry_door',
        openOffsetX: 74,
        openOffsetY: 0,
        openRotateDeg: 0,
      },
      {
        id: 'bk-cover-crate-right',
        label: 'Thùng bột góc phải',
        x: 1148,
        y: 422,
        w: 120,
        h: 94,
        kind: 'stall_box',
        openOffsetX: -32,
        openOffsetY: -64,
        openRotateDeg: 18,
        tapsRequired: 2,
      },
      {
        id: 'bk-cover-tarp-left',
        label: 'Khăn phủ giỏ bánh',
        x: 148,
        y: 440,
        w: 118,
        h: 92,
        kind: 'tarp',
        openOffsetX: -54,
        openOffsetY: -24,
        openRotateDeg: -14,
      },
      {
        id: 'bk-cover-decoy-tin',
        label: 'Hộp trà rỗng',
        x: 848,
        y: 186,
        w: 102,
        h: 82,
        kind: 'tin_lid',
        openOffsetX: 22,
        openOffsetY: -54,
        openRotateDeg: 14,
        isDecoy: true,
      },
      {
        id: 'bk-cover-decoy-curtain',
        label: 'Rèm góc bếp phụ',
        x: 992,
        y: 162,
        w: 106,
        h: 118,
        kind: 'curtain',
        openOffsetX: 62,
        openOffsetY: 0,
        openRotateDeg: 8,
        isDecoy: true,
      },
    ],
    decoys: buildStageDecoys(
      'bk',
      [
        'decoy_croissant',
        'decoy_plate',
        'decoy_cup',
        'decoy_jar',
        'decoy_cat_silhouette',
        'decoy_leaf',
        'decoy_whisk',
      ],
      BAKERY_DECOY_COORDS
    ),
    items: [
      { id: 'bk-croissant', label: 'Bánh Sừng Bò', artKey: 'croissant', soundCategory: 'pastry', x: 426, y: 414, hitW: 54, hitH: 44, scale: 0.84, rotateDeg: -12 },
      { id: 'bk-flour-cat', label: 'Mèo Mướp Bao Bột', artKey: 'tabby_flour_cat', soundCategory: 'cat', x: 116, y: 532, hitW: 64, hitH: 60, scale: 0.85 },
      { id: 'bk-latte', label: 'Ly Latte Art', artKey: 'latte_cup', soundCategory: 'drink', x: 562, y: 422, hitW: 50, hitH: 50, scale: 0.82 },
      { id: 'bk-chef-hat', label: 'Mũ Đầu Bếp', artKey: 'chef_hat', soundCategory: 'charm', x: 526, y: 238, hitW: 54, hitH: 52, scale: 0.84, rotateDeg: 10, hiddenUnderCoverId: 'bk-cover-pastry-door' },
      { id: 'bk-strawberry', label: 'Dâu Tây Mọng', artKey: 'strawberry', soundCategory: 'pastry', x: 886, y: 432, hitW: 46, hitH: 46, scale: 0.82 },
      { id: 'bk-scale', label: 'Cân Cổ Đồng', artKey: 'vintage_scale', soundCategory: 'charm', x: 1032, y: 406, hitW: 60, hitH: 62, scale: 0.85 },
      { id: 'bk-rolling-pin', label: 'Cây Cán Bột', artKey: 'rolling_pin', soundCategory: 'charm', x: 316, y: 496, hitW: 66, hitH: 42, scale: 0.84, rotateDeg: -16 },
      { id: 'bk-macaron', label: 'Bánh Macaron Hồng', artKey: 'pink_macaron', soundCategory: 'pastry', x: 740, y: 398, hitW: 52, hitH: 46, scale: 0.82, hiddenUnderCoverId: 'bk-cover-tin' },
      { id: 'bk-basil-pot', label: 'Chậu Thảo Mộc', artKey: 'basil_pot', soundCategory: 'charm', x: 262, y: 235, hitW: 52, hitH: 58, scale: 0.82, hiddenUnderCoverId: 'bk-cover-curtain' },
      { id: 'bk-jam-jar', label: 'Hũ Mứt Cam', artKey: 'orange_jam', soundCategory: 'drink', x: 1188, y: 268, hitW: 48, hitH: 52, scale: 0.82 },
      { id: 'bk-ginger-loaf', label: 'Mèo Cam Bánh Mì', artKey: 'ginger_loaf_cat', soundCategory: 'cat', x: 642, y: 222, hitW: 56, hitH: 52, scale: 0.8, rotateDeg: -6 },
      { id: 'bk-cinnamon-roll', label: 'Bánh Cuộn Quế', artKey: 'cinnamon_roll', soundCategory: 'pastry', x: 356, y: 262, hitW: 48, hitH: 48, scale: 0.8, rotateDeg: 22 },
      { id: 'bk-honey-dipper', label: 'Que Mật Ong', artKey: 'honey_dipper', soundCategory: 'charm', x: 786, y: 274, hitW: 48, hitH: 52, scale: 0.78, rotateDeg: -26 },
      { id: 'bk-berry-tart', label: 'Bánh Tart Việt Quất', artKey: 'berry_tart', soundCategory: 'pastry', x: 205, y: 486, hitW: 50, hitH: 46, scale: 0.8, hiddenUnderCoverId: 'bk-cover-tarp-left' },
      { id: 'bk-butter-dish', label: 'Đĩa Bơ Vàng', artKey: 'butter_dish', soundCategory: 'pastry', x: 938, y: 528, hitW: 54, hitH: 42, scale: 0.78 },
      { id: 'bk-tuxedo-cup', label: 'Mèo Tuxedo Trong Tách', artKey: 'tuxedo_cup_cat', soundCategory: 'cat', x: 1122, y: 206, hitW: 54, hitH: 54, scale: 0.8, camoBlend: true },
      { id: 'bk-milk-carton', label: 'Hộp Sữa Tươi Dâu', artKey: 'milk_carton', soundCategory: 'drink', x: 678, y: 542, hitW: 46, hitH: 54, scale: 0.78, rotateDeg: 8 },
      { id: 'bk-star-cookie', label: 'Bánh Quy Ngôi Sao', artKey: 'star_cookie', soundCategory: 'pastry', x: 482, y: 538, hitW: 46, hitH: 46, scale: 0.76, rotateDeg: 32, camoBlend: true },
      { id: 'bk-postcard', label: 'Bưu Thiếp Tiệm Bánh', artKey: 'vintage_postcard', soundCategory: 'charm', x: 1264, y: 186, hitW: 50, hitH: 44, scale: 0.78, rotateDeg: -15 },
      { id: 'bk-cream-puff', label: 'Su Kem Vani', artKey: 'cream_puff', soundCategory: 'pastry', x: 822, y: 562, hitW: 46, hitH: 46, scale: 0.76 },
      { id: 'bk-matchbox', label: 'Hộp Diêm Mèo Nhỏ', artKey: 'cat_matchbox', soundCategory: 'charm', x: 288, y: 548, hitW: 48, hitH: 40, scale: 0.76, rotateDeg: 18, camoBlend: true },
      { id: 'bk-yarn-basket', label: 'Giỏ Len Cuộn', artKey: 'yarn_basket', soundCategory: 'charm', x: 1198, y: 470, hitW: 54, hitH: 48, scale: 0.8, hiddenUnderCoverId: 'bk-cover-crate-right' },
      { id: 'bk-bell-collar', label: 'Vòng Chuông Cổ Mèo', artKey: 'bell_collar', soundCategory: 'charm', x: 64, y: 348, hitW: 46, hitH: 46, scale: 0.74, rotateDeg: -20, camoBlend: true },
      { id: 'bk-paw-cushion', label: 'Đệm Chân Mèo Hồng', artKey: 'paw_cushion', soundCategory: 'cat', x: 1022, y: 584, hitW: 52, hitH: 48, scale: 0.78 },
      { id: 'bk-golden-cat', label: 'Mèo Vàng Bí Mật', artKey: 'golden_secret_cat', soundCategory: 'secret', x: 1255, y: 124, hitW: 52, hitH: 52, scale: 0.76, isSecretGoldenCat: true, camoBlend: true },
    ],
  },
  {
    id: 'flower-alley',
    order: 2,
    title: 'Phố Hoa & Tiệm Cây',
    theme: 'flower_alley',
    mapX: 300,
    mapY: 115,
    palette: {
      skyTop: '#EEF9F3',
      skyBottom: '#FBF6E6',
      ground: '#E7EFE1',
      accent: '#76A984',
      ink: '#35453A',
    },
    covers: [
      { id: 'fl-cover-bush', label: 'Bụi hoa cẩm tú cầu', x: 230, y: 445, w: 146, h: 110, kind: 'bush', openOffsetX: -72, openOffsetY: 14, openRotateDeg: -10, tapsRequired: 2 },
      { id: 'fl-cover-door', label: 'Cửa kính nhà cây', x: 895, y: 235, w: 115, h: 170, kind: 'glass_door', openOffsetX: 78, openOffsetY: 0, openRotateDeg: 0, tapsRequired: 2 },
      { id: 'fl-cover-bush-right', label: 'Bụi dương xỉ góc phố', x: 1086, y: 446, w: 138, h: 104, kind: 'bush', openOffsetX: 66, openOffsetY: 12, openRotateDeg: 10 },
      { id: 'fl-cover-curtain-shop', label: 'Mành tre tiệm hoa', x: 486, y: 204, w: 114, h: 124, kind: 'curtain', openOffsetX: -68, openOffsetY: 0, openRotateDeg: -8 },
      { id: 'fl-cover-crate-seeds', label: 'Thùng hạt giống gỗ', x: 742, y: 468, w: 120, h: 92, kind: 'stall_box', openOffsetX: 28, openOffsetY: -64, openRotateDeg: 14, tapsRequired: 2 },
      { id: 'fl-cover-decoy-bush', label: 'Bụi cỏ ven tường', x: 562, y: 482, w: 120, h: 92, kind: 'bush', openOffsetX: -58, openOffsetY: 16, openRotateDeg: -10, isDecoy: true },
      { id: 'fl-cover-decoy-tarp', label: 'Bạt che xe hoa', x: 104, y: 232, w: 112, h: 90, kind: 'tarp', openOffsetX: -54, openOffsetY: -18, openRotateDeg: -12, isDecoy: true },
    ],
    decoys: buildStageDecoys(
      'fl',
      [
        'decoy_leaf',
        'decoy_pot',
        'decoy_flower',
        'decoy_cat_silhouette',
        'decoy_jar',
        'decoy_cup',
        'decoy_bird',
      ],
      FLOWER_DECOY_COORDS
    ),
    items: [
      { id: 'fl-sunflower', label: 'Bó Hướng Dương', artKey: 'sunflower_bouquet', soundCategory: 'charm', x: 525, y: 448, hitW: 56, hitH: 64, scale: 0.82 },
      { id: 'fl-watering-can', label: 'Bình Tưới Cây', artKey: 'watering_can', soundCategory: 'drink', x: 132, y: 545, hitW: 58, hitH: 52, scale: 0.8 },
      { id: 'fl-calico-cat', label: 'Mèo Tam Thể Bụi Hoa', artKey: 'calico_bush_cat', soundCategory: 'cat', x: 302, y: 500, hitW: 58, hitH: 58, scale: 0.82, hiddenUnderCoverId: 'fl-cover-bush' },
      { id: 'fl-bike', label: 'Xe Đạp Giỏ Hoa', artKey: 'flower_bicycle', soundCategory: 'charm', x: 720, y: 505, hitW: 86, hitH: 66, scale: 0.82 },
      { id: 'fl-straw-hat', label: 'Mũ Cói Ruy Băng', artKey: 'straw_hat', soundCategory: 'charm', x: 418, y: 256, hitW: 56, hitH: 46, scale: 0.8, rotateDeg: -12 },
      { id: 'fl-shears', label: 'Kéo Tỉa Cành', artKey: 'garden_shears', soundCategory: 'charm', x: 615, y: 356, hitW: 50, hitH: 48, scale: 0.78, rotateDeg: 24 },
      { id: 'fl-cactus', label: 'Chậu Xương Rồng', artKey: 'cactus_pot', soundCategory: 'charm', x: 952, y: 326, hitW: 52, hitH: 60, scale: 0.8, hiddenUnderCoverId: 'fl-cover-door' },
      { id: 'fl-windchime', label: 'Chuông Gió Thủy Tinh', artKey: 'glass_windchime', soundCategory: 'drink', x: 790, y: 162, hitW: 48, hitH: 62, scale: 0.8 },
      { id: 'fl-seeds', label: 'Gói Hạt Giống', artKey: 'seed_packet', soundCategory: 'pastry', x: 1152, y: 498, hitW: 48, hitH: 52, scale: 0.78, hiddenUnderCoverId: 'fl-cover-bush-right' },
      { id: 'fl-daisy-vase', label: 'Bình Hoa Cúc', artKey: 'daisy_vase', soundCategory: 'charm', x: 1230, y: 365, hitW: 50, hitH: 60, scale: 0.8 },
      { id: 'fl-bonsai', label: 'Chậu Bonsai Tí Hon', artKey: 'bonsai_tree', soundCategory: 'charm', x: 544, y: 266, hitW: 54, hitH: 56, scale: 0.8, hiddenUnderCoverId: 'fl-cover-curtain-shop' },
      { id: 'fl-terracotta-frog', label: 'Chú Ếch Đất Nung', artKey: 'terracotta_frog', soundCategory: 'charm', x: 432, y: 582, hitW: 48, hitH: 46, scale: 0.76, camoBlend: true },
      { id: 'fl-lavender', label: 'Bó Oải Hương Khô', artKey: 'lavender_bundle', soundCategory: 'charm', x: 256, y: 342, hitW: 46, hitH: 58, scale: 0.78, rotateDeg: -18 },
      { id: 'fl-snail-shell', label: 'Ốc Sên Vỏ Hoa', artKey: 'snail_shell', soundCategory: 'charm', x: 874, y: 584, hitW: 48, hitH: 44, scale: 0.74, camoBlend: true },
      { id: 'fl-butterfly-pin', label: 'Kẹp Bướm Pastel', artKey: 'butterfly_pin', soundCategory: 'charm', x: 646, y: 126, hitW: 46, hitH: 44, scale: 0.74, rotateDeg: 20 },
      { id: 'fl-ginger-cat', label: 'Mèo Mướp Ngủ Chậu', artKey: 'ginger_loaf_cat', soundCategory: 'cat', x: 1028, y: 356, hitW: 54, hitH: 50, scale: 0.78 },
      { id: 'fl-paper-crane', label: 'Hạc Giấy Xanh', artKey: 'paper_crane', soundCategory: 'charm', x: 1272, y: 242, hitW: 48, hitH: 46, scale: 0.74, rotateDeg: -15, camoBlend: true },
      { id: 'fl-orange-jam', label: 'Lọ Hoa Trà Cam', artKey: 'orange_jam', soundCategory: 'drink', x: 358, y: 215, hitW: 46, hitH: 50, scale: 0.76 },
      { id: 'fl-cat-mug', label: 'Cốc Sứ Tưới Hoa', artKey: 'cat_ear_mug', soundCategory: 'drink', x: 1245, y: 515, hitW: 46, hitH: 48, scale: 0.76, camoBlend: true },
      { id: 'fl-honey-dipper', label: 'Que Khuấy Mật Hoa', artKey: 'honey_dipper', soundCategory: 'charm', x: 186, y: 404, hitW: 44, hitH: 50, scale: 0.74, rotateDeg: 28 },
      { id: 'fl-strawberry', label: 'Dâu Rừng Chín Mọng', artKey: 'strawberry', soundCategory: 'pastry', x: 642, y: 548, hitW: 44, hitH: 46, scale: 0.74, camoBlend: true },
      { id: 'fl-postcard', label: 'Thiệp Ép Hoa Khô', artKey: 'vintage_postcard', soundCategory: 'charm', x: 966, y: 525, hitW: 48, hitH: 42, scale: 0.76, rotateDeg: -10 },
      { id: 'fl-siamese-cat', label: 'Mèo Xiêm Rình Bướm', artKey: 'siamese_cat', soundCategory: 'cat', x: 112, y: 175, hitW: 54, hitH: 54, scale: 0.78, camoBlend: true },
      { id: 'fl-paw-cushion', label: 'Gối Lá Cây Mềm', artKey: 'paw_cushion', soundCategory: 'charm', x: 800, y: 512, hitW: 50, hitH: 46, scale: 0.78, hiddenUnderCoverId: 'fl-cover-crate-seeds' },
      { id: 'fl-golden-cat', label: 'Mèo Vàng Bí Mật', artKey: 'golden_secret_cat', soundCategory: 'secret', x: 1098, y: 138, hitW: 52, hitH: 52, scale: 0.74, isSecretGoldenCat: true, camoBlend: true },
    ],
  },
  {
    id: 'pet-cafe',
    order: 3,
    title: 'Quán Cà Phê Thú Cưng',
    theme: 'pet_cafe',
    mapX: 495,
    mapY: 175,
    palette: {
      skyTop: '#FDF4F5',
      skyBottom: '#F8EAE0',
      ground: '#EFE0D3',
      accent: '#D88392',
      ink: '#473438',
    },
    covers: [
      { id: 'pc-cover-tent', label: 'Lều vải thú cưng', x: 185, y: 410, w: 150, h: 135, kind: 'pet_tent', openOffsetX: -72, openOffsetY: -22, openRotateDeg: -14, tapsRequired: 2 },
      { id: 'pc-cover-cabinet', label: 'Cửa tủ trà bánh', x: 885, y: 292, w: 120, h: 120, kind: 'pastry_door', openOffsetX: 78, openOffsetY: 0, openRotateDeg: 0, tapsRequired: 2 },
      { id: 'pc-cover-tent-right', label: 'Lều mèo góc sofa', x: 1032, y: 422, w: 138, h: 122, kind: 'pet_tent', openOffsetX: 66, openOffsetY: -18, openRotateDeg: 14 },
      { id: 'pc-cover-curtain-window', label: 'Rèm cửa sổ vòm', x: 256, y: 168, w: 118, h: 138, kind: 'curtain', openOffsetX: -72, openOffsetY: 0, openRotateDeg: -6 },
      { id: 'pc-cover-box-counter', label: 'Hộp bánh quy quầy bar', x: 642, y: 332, w: 112, h: 88, kind: 'tin_lid', openOffsetX: 28, openOffsetY: -58, openRotateDeg: -18, tapsRequired: 2 },
      { id: 'pc-cover-decoy-tent', label: 'Ổ đệm trống', x: 522, y: 472, w: 122, h: 98, kind: 'tarp', openOffsetX: -54, openOffsetY: -20, openRotateDeg: -12, isDecoy: true },
      { id: 'pc-cover-decoy-cabinet', label: 'Ngăn kéo ly sứ', x: 1142, y: 215, w: 108, h: 102, kind: 'glass_door', openOffsetX: -66, openOffsetY: 0, openRotateDeg: 0, isDecoy: true },
    ],
    decoys: buildStageDecoys(
      'pc',
      [
        'decoy_cup',
        'decoy_plate',
        'decoy_cat_silhouette',
        'decoy_jar',
        'decoy_croissant',
        'decoy_whisk',
        'decoy_pot',
      ],
      PET_CAFE_DECOY_COORDS
    ),
    items: [
      { id: 'pc-corgi', label: 'Corgi Ngủ Gật', artKey: 'sleeping_corgi', soundCategory: 'dog', x: 262, y: 492, hitW: 64, hitH: 56, scale: 0.8, hiddenUnderCoverId: 'pc-cover-tent' },
      { id: 'pc-yarn', label: 'Cuộn Len Hồng', artKey: 'pink_yarn', soundCategory: 'charm', x: 425, y: 552, hitW: 50, hitH: 48, scale: 0.78 },
      { id: 'pc-boba', label: 'Trà Sữa Trân Châu', artKey: 'boba_tea', soundCategory: 'drink', x: 942, y: 356, hitW: 48, hitH: 58, scale: 0.8, hiddenUnderCoverId: 'pc-cover-cabinet' },
      { id: 'pc-bread-pillow', label: 'Gối Ôm Bánh Mì', artKey: 'bread_pillow', soundCategory: 'pastry', x: 612, y: 486, hitW: 62, hitH: 50, scale: 0.8 },
      { id: 'pc-doorbell', label: 'Chuông Cửa Gỗ', artKey: 'wood_doorbell', soundCategory: 'charm', x: 145, y: 162, hitW: 46, hitH: 50, scale: 0.78 },
      { id: 'pc-bone-cookie', label: 'Bánh Quy Xương', artKey: 'bone_cookie', soundCategory: 'pastry', x: 782, y: 452, hitW: 52, hitH: 42, scale: 0.78, rotateDeg: 18 },
      { id: 'pc-siamese-cat', label: 'Mèo Xiêm Trên Kệ', artKey: 'siamese_cat', soundCategory: 'cat', x: 540, y: 215, hitW: 58, hitH: 58, scale: 0.8 },
      { id: 'pc-vinyl', label: 'Đĩa Nhạc Than', artKey: 'vinyl_record', soundCategory: 'charm', x: 705, y: 176, hitW: 54, hitH: 54, scale: 0.78 },
      { id: 'pc-cat-mug', label: 'Cốc Sứ Tai Mèo', artKey: 'cat_ear_mug', soundCategory: 'drink', x: 472, y: 378, hitW: 48, hitH: 48, scale: 0.76 },
      { id: 'pc-bowtie', label: 'Nơ Cổ Chấm Bi', artKey: 'polka_bowtie', soundCategory: 'charm', x: 1138, y: 522, hitW: 50, hitH: 42, scale: 0.76 },
      { id: 'pc-claw-toy', label: 'Cá Bông Catnip', artKey: 'catnip_fish', soundCategory: 'cat', x: 1218, y: 342, hitW: 58, hitH: 44, scale: 0.78, rotateDeg: -14 },
      { id: 'pc-tuxedo-cat', label: 'Mèo Tuxedo Ly Cà Phê', artKey: 'tuxedo_cup_cat', soundCategory: 'cat', x: 314, y: 236, hitW: 52, hitH: 52, scale: 0.78, hiddenUnderCoverId: 'pc-cover-curtain-window' },
      { id: 'pc-matcha-parfait', label: 'Ly Parfait Matcha', artKey: 'matcha_parfait', soundCategory: 'drink', x: 698, y: 376, hitW: 46, hitH: 56, scale: 0.78, hiddenUnderCoverId: 'pc-cover-box-counter' },
      { id: 'pc-yarn-basket', label: 'Giỏ Len Cuộn Tròn', artKey: 'yarn_basket', soundCategory: 'charm', x: 1100, y: 486, hitW: 54, hitH: 48, scale: 0.78, hiddenUnderCoverId: 'pc-cover-tent-right' },
      { id: 'pc-bell-collar', label: 'Vòng Chuông Bạc', artKey: 'bell_collar', soundCategory: 'charm', x: 86, y: 522, hitW: 44, hitH: 44, scale: 0.72, camoBlend: true },
      { id: 'pc-milk-carton', label: 'Hộp Sữa Mèo Nhỏ', artKey: 'milk_carton', soundCategory: 'drink', x: 836, y: 266, hitW: 44, hitH: 52, scale: 0.74, rotateDeg: -10 },
      { id: 'pc-paw-cushion', label: 'Đệm Chân Mèo Kem', artKey: 'paw_cushion', soundCategory: 'cat', x: 368, y: 604, hitW: 50, hitH: 46, scale: 0.76, camoBlend: true },
      { id: 'pc-macaron', label: 'Bánh Macaron Mèo', artKey: 'pink_macaron', soundCategory: 'pastry', x: 1284, y: 544, hitW: 46, hitH: 42, scale: 0.74 },
      { id: 'pc-calico-cat', label: 'Mèo Tam Thể Góc Quầy', artKey: 'calico_bush_cat', soundCategory: 'cat', x: 1022, y: 175, hitW: 52, hitH: 52, scale: 0.76, camoBlend: true },
      { id: 'pc-star-cookie', label: 'Bánh Quy Mè Sao', artKey: 'star_cookie', soundCategory: 'pastry', x: 758, y: 582, hitW: 44, hitH: 44, scale: 0.72, rotateDeg: 24, camoBlend: true },
      { id: 'pc-cream-puff', label: 'Su Kem Phủ Đường', artKey: 'cream_puff', soundCategory: 'pastry', x: 588, y: 312, hitW: 44, hitH: 44, scale: 0.74 },
      { id: 'pc-cinnamon', label: 'Cuộn Quế Bơ Sữa', artKey: 'cinnamon_roll', soundCategory: 'pastry', x: 966, y: 562, hitW: 46, hitH: 44, scale: 0.74, rotateDeg: -20, camoBlend: true },
      { id: 'pc-matchbox', label: 'Hộp Diêm Quán Cà Phê', artKey: 'cat_matchbox', soundCategory: 'charm', x: 176, y: 328, hitW: 44, hitH: 38, scale: 0.72, rotateDeg: 14 },
      { id: 'pc-butterfly', label: 'Ghim Cài Bướm Nhỏ', artKey: 'butterfly_pin', soundCategory: 'charm', x: 1266, y: 198, hitW: 44, hitH: 42, scale: 0.72, camoBlend: true },
      { id: 'pc-tart', label: 'Tart Dâu Sô-cô-la', artKey: 'berry_tart', soundCategory: 'pastry', x: 504, y: 554, hitW: 46, hitH: 44, scale: 0.74 },
      { id: 'pc-golden-cat', label: 'Mèo Vàng Bí Mật', artKey: 'golden_secret_cat', soundCategory: 'secret', x: 1035, y: 152, hitW: 50, hitH: 50, scale: 0.72, isSecretGoldenCat: true, camoBlend: true },
    ],
  },
  {
    id: 'night-market',
    order: 4,
    title: 'Khu Chợ Đêm Cuối Tuần',
    theme: 'night_market',
    mapX: 685,
    mapY: 120,
    palette: {
      skyTop: '#2E2D4D',
      skyBottom: '#574E78',
      ground: '#473D5A',
      accent: '#F4A261',
      ink: '#31263E',
    },
    covers: [
      { id: 'nm-cover-tarp', label: 'Khăn phủ quầy đồ chơi', x: 545, y: 410, w: 132, h: 98, kind: 'tarp', openOffsetX: -70, openOffsetY: -20, openRotateDeg: -12, tapsRequired: 2 },
      { id: 'nm-cover-noren', label: 'Rèm vải noren', x: 1035, y: 235, w: 145, h: 120, kind: 'noren', openOffsetX: 74, openOffsetY: -28, openRotateDeg: 10, tapsRequired: 2 },
      { id: 'nm-cover-stall-left', label: 'Thùng gỗ quầy xiên nướng', x: 248, y: 432, w: 122, h: 92, kind: 'stall_box', openOffsetX: -32, openOffsetY: -62, openRotateDeg: -16 },
      { id: 'nm-cover-curtain-mid', label: 'Rèm đỏ quầy gắp thú', x: 752, y: 235, w: 124, h: 116, kind: 'festival_curtain', openOffsetX: 68, openOffsetY: 0, openRotateDeg: 8, tapsRequired: 2 },
      { id: 'nm-cover-crate-right', label: 'Hộp đèn lồng chợ đêm', x: 1185, y: 465, w: 118, h: 94, kind: 'tin_lid', openOffsetX: 28, openOffsetY: -62, openRotateDeg: 18, tapsRequired: 2 },
      { id: 'nm-cover-decoy-noren', label: 'Rèm phụ hàng chè', x: 138, y: 256, w: 118, h: 104, kind: 'noren', openOffsetX: -62, openOffsetY: -20, openRotateDeg: -10, isDecoy: true },
      { id: 'nm-cover-decoy-tarp', label: 'Bạt che xe đẩy', x: 896, y: 452, w: 122, h: 92, kind: 'tarp', openOffsetX: 58, openOffsetY: -18, openRotateDeg: 10, isDecoy: true },
    ],
    decoys: buildStageDecoys(
      'nm',
      [
        'decoy_lantern',
        'decoy_cup',
        'decoy_plate',
        'decoy_cat_silhouette',
        'decoy_jar',
        'decoy_fan',
        'decoy_leaf',
      ],
      NIGHT_MARKET_DECOY_COORDS
    ),
    items: [
      { id: 'nm-carp-lantern', label: 'Đèn Lồng Cá Chép', artKey: 'carp_lantern', soundCategory: 'charm', x: 185, y: 162, hitW: 56, hitH: 60, scale: 0.8 },
      { id: 'nm-fishball', label: 'Xiên Cá Viên', artKey: 'fishball_skewer', soundCategory: 'pastry', x: 312, y: 478, hitW: 48, hitH: 60, scale: 0.78, rotateDeg: 12, hiddenUnderCoverId: 'nm-cover-stall-left' },
      { id: 'nm-sakura-fan', label: 'Quạt Giấy Hoa Đào', artKey: 'sakura_fan', soundCategory: 'charm', x: 472, y: 295, hitW: 58, hitH: 48, scale: 0.78 },
      { id: 'nm-claw-machine', label: 'Máy Gắp Thú Mini', artKey: 'mini_claw_machine', soundCategory: 'charm', x: 814, y: 296, hitW: 62, hitH: 76, scale: 0.78, hiddenUnderCoverId: 'nm-cover-curtain-mid' },
      { id: 'nm-musicbox', label: 'Hộp Nhạc Dây Cót', artKey: 'windup_musicbox', soundCategory: 'charm', x: 612, y: 462, hitW: 52, hitH: 50, scale: 0.78, hiddenUnderCoverId: 'nm-cover-tarp' },
      { id: 'nm-ribbon-cat', label: 'Mèo Trắng Đeo Nơ', artKey: 'white_ribbon_cat', soundCategory: 'cat', x: 1105, y: 298, hitW: 56, hitH: 56, scale: 0.78, hiddenUnderCoverId: 'nm-cover-noren' },
      { id: 'nm-egg-waffle', label: 'Bánh Trứng Gà Non', artKey: 'egg_waffle', soundCategory: 'pastry', x: 215, y: 486, hitW: 52, hitH: 52, scale: 0.76 },
      { id: 'nm-bell-bracelet', label: 'Vòng Tay Chuông', artKey: 'bell_bracelet', soundCategory: 'charm', x: 728, y: 536, hitW: 48, hitH: 46, scale: 0.76 },
      { id: 'nm-cat-mask', label: 'Mặt Nạ Mèo', artKey: 'festival_cat_mask', soundCategory: 'cat', x: 942, y: 215, hitW: 52, hitH: 50, scale: 0.76 },
      { id: 'nm-shaved-ice', label: 'Ly Đá Bào Dâu', artKey: 'strawberry_shaved_ice', soundCategory: 'drink', x: 446, y: 536, hitW: 48, hitH: 58, scale: 0.76 },
      { id: 'nm-garland', label: 'Cờ Dây Ngôi Sao', artKey: 'star_garland', soundCategory: 'charm', x: 660, y: 122, hitW: 68, hitH: 44, scale: 0.78 },
      { id: 'nm-taiyaki', label: 'Bánh Cá Taiyaki Đậu Đỏ', artKey: 'taiyaki_snack', soundCategory: 'pastry', x: 356, y: 228, hitW: 52, hitH: 44, scale: 0.76, rotateDeg: -16 },
      { id: 'nm-daruma', label: 'Lật Đật Daruma Nhỏ', artKey: 'daruma_doll', soundCategory: 'charm', x: 526, y: 312, hitW: 46, hitH: 48, scale: 0.74, camoBlend: true },
      { id: 'nm-lucky-coin', label: 'Đồng Xu May Mắn', artKey: 'lucky_coin', soundCategory: 'charm', x: 868, y: 576, hitW: 44, hitH: 44, scale: 0.72, camoBlend: true },
      { id: 'nm-sparkler', label: 'Bó Pháo Bông Cầm Tay', artKey: 'sparkler_bundle', soundCategory: 'charm', x: 684, y: 392, hitW: 46, hitH: 56, scale: 0.74, rotateDeg: 22 },
      { id: 'nm-dango', label: 'Que Dango Đêm Phố', artKey: 'tricolor_dango', soundCategory: 'pastry', x: 102, y: 522, hitW: 44, hitH: 56, scale: 0.74, rotateDeg: -14 },
      { id: 'nm-pinwheel', label: 'Chong Chóng Đêm Sao', artKey: 'paper_pinwheel', soundCategory: 'charm', x: 1266, y: 138, hitW: 48, hitH: 56, scale: 0.74 },
      { id: 'nm-ramune', label: 'Soda Bi Lạnh', artKey: 'ramune_soda', soundCategory: 'drink', x: 628, y: 215, hitW: 42, hitH: 56, scale: 0.74, camoBlend: true },
      { id: 'nm-ginger-cat', label: 'Mèo Cam Chợ Đêm', artKey: 'ginger_loaf_cat', soundCategory: 'cat', x: 1218, y: 312, hitW: 52, hitH: 48, scale: 0.76, camoBlend: true },
      { id: 'nm-paper-crane', label: 'Hạc Giấy Ánh Trăng', artKey: 'paper_crane', soundCategory: 'charm', x: 768, y: 124, hitW: 46, hitH: 44, scale: 0.72, rotateDeg: 18 },
      { id: 'nm-tuxedo-cat', label: 'Mèo Tuxedo Trong Tách', artKey: 'tuxedo_cup_cat', soundCategory: 'cat', x: 1038, y: 552, hitW: 48, hitH: 48, scale: 0.74, camoBlend: true },
      { id: 'nm-boba', label: 'Trà Sữa Đường Đen', artKey: 'boba_tea', soundCategory: 'drink', x: 356, y: 598, hitW: 44, hitH: 54, scale: 0.74 },
      { id: 'nm-catnip-fish', label: 'Cá Bông Ánh Trăng', artKey: 'catnip_fish', soundCategory: 'cat', x: 152, y: 392, hitW: 54, hitH: 42, scale: 0.74, rotateDeg: -22, camoBlend: true },
      { id: 'nm-fox-mask', label: 'Mặt Nạ Cáo Chợ Đêm', artKey: 'white_fox_mask', soundCategory: 'cat', x: 1138, y: 128, hitW: 48, hitH: 48, scale: 0.74 },
      { id: 'nm-bell-collar', label: 'Chuông Đeo Cổ Mèo', artKey: 'bell_collar', soundCategory: 'charm', x: 582, y: 604, hitW: 44, hitH: 44, scale: 0.72, camoBlend: true },
      { id: 'nm-golden-cat', label: 'Mèo Vàng Bí Mật', artKey: 'golden_secret_cat', soundCategory: 'secret', x: 1244, y: 512, hitW: 50, hitH: 50, scale: 0.72, hiddenUnderCoverId: 'nm-cover-crate-right', isSecretGoldenCat: true },
    ],
  },
  {
    id: 'fireworks-festival',
    order: 5,
    title: 'Lễ Hội Pháo Hoa Ban Đêm',
    theme: 'fireworks',
    isSecretStage: true,
    mapX: 870,
    mapY: 160,
    palette: {
      skyTop: '#24294A',
      skyBottom: '#4C3D6E',
      ground: '#3E3656',
      accent: '#F6BD60',
      ink: '#29223B',
    },
    covers: [
      { id: 'fw-cover-curtain', label: 'Rèm lồng đèn đỏ', x: 280, y: 265, w: 132, h: 130, kind: 'festival_curtain', openOffsetX: -76, openOffsetY: 0, openRotateDeg: -8, tapsRequired: 2 },
      { id: 'fw-cover-stall', label: 'Nắp thùng gỗ lễ hội', x: 925, y: 448, w: 138, h: 96, kind: 'stall_box', openOffsetX: 38, openOffsetY: -62, openRotateDeg: 16, tapsRequired: 2 },
      { id: 'fw-cover-noren-right', label: 'Rèm noren quầy mặt nạ', x: 1035, y: 235, w: 136, h: 118, kind: 'noren', openOffsetX: 70, openOffsetY: -22, openRotateDeg: 12, tapsRequired: 2 },
      { id: 'fw-cover-tin-secret', label: 'Hộp gấm Hoàng Gia khóa đôi', x: 668, y: 84, w: 116, h: 92, kind: 'tin_lid', openOffsetX: 34, openOffsetY: -58, openRotateDeg: 18, tapsRequired: 2 },
      { id: 'fw-cover-tarp-bridge', label: 'Khăn phủ bàn dango', x: 525, y: 432, w: 126, h: 94, kind: 'tarp', openOffsetX: -62, openOffsetY: -24, openRotateDeg: -14 },
      { id: 'fw-cover-decoy-stall', label: 'Hộp pháo lép cũ', x: 155, y: 468, w: 118, h: 92, kind: 'stall_box', openOffsetX: -28, openOffsetY: -54, openRotateDeg: -14, isDecoy: true },
      { id: 'fw-cover-decoy-curtain', label: 'Rèm góc cầu gỗ', x: 758, y: 235, w: 122, h: 112, kind: 'festival_curtain', openOffsetX: 64, openOffsetY: 0, openRotateDeg: 8, isDecoy: true },
      { id: 'fw-cover-decoy-tin', label: 'Hộp chuông trống', x: 1168, y: 492, w: 112, h: 86, kind: 'tin_lid', openOffsetX: 24, openOffsetY: -52, openRotateDeg: 16, isDecoy: true },
    ],
    decoys: buildStageDecoys(
      'fw',
      [
        'decoy_lantern',
        'decoy_fan',
        'decoy_plate',
        'decoy_cat_silhouette',
        'decoy_cup',
        'decoy_jar',
        'decoy_leaf',
      ],
      FIREWORKS_DECOY_COORDS
    ),
    items: [
      { id: 'fw-rose-firework', label: 'Pháo Hoa Bông Hồng', artKey: 'rose_firework', soundCategory: 'charm', x: 485, y: 128, hitW: 60, hitH: 60, scale: 0.78 },
      { id: 'fw-moon-fan', label: 'Quạt Tròn Trăng Rằm', artKey: 'moon_uchiwa', soundCategory: 'charm', x: 175, y: 445, hitW: 52, hitH: 58, scale: 0.78 },
      { id: 'fw-dango', label: 'Bánh Dango 3 Màu', artKey: 'tricolor_dango', soundCategory: 'pastry', x: 588, y: 480, hitW: 48, hitH: 58, scale: 0.78, hiddenUnderCoverId: 'fw-cover-tarp-bridge' },
      { id: 'fw-stargaze-cat', label: 'Mèo Mướp Ngắm Trăng', artKey: 'stargaze_cat', soundCategory: 'cat', x: 785, y: 356, hitW: 58, hitH: 60, scale: 0.78 },
      { id: 'fw-sky-lantern', label: 'Đèn Trời Bay', artKey: 'sky_lantern', soundCategory: 'charm', x: 960, y: 145, hitW: 52, hitH: 60, scale: 0.76 },
      { id: 'fw-cotton-candy', label: 'Kẹo Bông Gòn', artKey: 'cotton_candy', soundCategory: 'pastry', x: 422, y: 468, hitW: 52, hitH: 60, scale: 0.78 },
      { id: 'fw-taiko', label: 'Trống Taiko Tí Hon', artKey: 'mini_taiko', soundCategory: 'charm', x: 685, y: 525, hitW: 58, hitH: 54, scale: 0.78 },
      { id: 'fw-goldfish', label: 'Cá Vàng Vợt Giấy', artKey: 'goldfish_scoop', soundCategory: 'drink', x: 992, y: 496, hitW: 60, hitH: 54, scale: 0.78, hiddenUnderCoverId: 'fw-cover-stall' },
      { id: 'fw-fox-mask', label: 'Mặt Nạ Cáo Trắng', artKey: 'white_fox_mask', soundCategory: 'cat', x: 345, y: 332, hitW: 54, hitH: 54, scale: 0.78, hiddenUnderCoverId: 'fw-cover-curtain' },
      { id: 'fw-pinwheel', label: 'Chong Chóng Giấy', artKey: 'paper_pinwheel', soundCategory: 'charm', x: 1165, y: 382, hitW: 52, hitH: 58, scale: 0.76 },
      { id: 'fw-ramune', label: 'Chai Soda Bi', artKey: 'ramune_soda', soundCategory: 'drink', x: 1125, y: 535, hitW: 44, hitH: 58, scale: 0.76 },
      { id: 'fw-star-bell', label: 'Chuông Vàng Lễ Hội', artKey: 'festival_gold_bell', soundCategory: 'charm', x: 1228, y: 235, hitW: 52, hitH: 54, scale: 0.76 },
      { id: 'fw-ribbon-cat', label: 'Mèo Trắng Đeo Nơ', artKey: 'white_ribbon_cat', soundCategory: 'cat', x: 1102, y: 294, hitW: 54, hitH: 54, scale: 0.76, hiddenUnderCoverId: 'fw-cover-noren-right' },
      { id: 'fw-daruma', label: 'Lật Đật Daruma Lễ Hội', artKey: 'daruma_doll', soundCategory: 'charm', x: 472, y: 356, hitW: 46, hitH: 48, scale: 0.74, camoBlend: true },
      { id: 'fw-taiyaki', label: 'Bánh Cá Nướng Giòn', artKey: 'taiyaki_snack', soundCategory: 'pastry', x: 266, y: 546, hitW: 50, hitH: 44, scale: 0.74, rotateDeg: 18 },
      { id: 'fw-sparkler', label: 'Pháo Bông Tia Vàng', artKey: 'sparkler_bundle', soundCategory: 'charm', x: 642, y: 262, hitW: 44, hitH: 54, scale: 0.74, rotateDeg: -20 },
      { id: 'fw-lucky-coin', label: 'Đồng Xu Ngũ Đế', artKey: 'lucky_coin', soundCategory: 'charm', x: 862, y: 562, hitW: 44, hitH: 44, scale: 0.72, camoBlend: true },
      { id: 'fw-matchbox', label: 'Hộp Diêm Lễ Hội', artKey: 'cat_matchbox', soundCategory: 'charm', x: 356, y: 602, hitW: 44, hitH: 38, scale: 0.72, rotateDeg: -12 },
      { id: 'fw-cat-mask', label: 'Mặt Nạ Mèo Đêm Hội', artKey: 'festival_cat_mask', soundCategory: 'cat', x: 118, y: 212, hitW: 50, hitH: 48, scale: 0.74, camoBlend: true },
      { id: 'fw-carp-lantern', label: 'Đèn Lồng Cá Chép', artKey: 'carp_lantern', soundCategory: 'charm', x: 892, y: 256, hitW: 48, hitH: 54, scale: 0.74 },
      { id: 'fw-sakura-fan', label: 'Quạt Hoa Anh Đào', artKey: 'sakura_fan', soundCategory: 'charm', x: 1272, y: 128, hitW: 52, hitH: 44, scale: 0.74, rotateDeg: 24 },
      { id: 'fw-shaved-ice', label: 'Đá Bào Siro Dâu', artKey: 'strawberry_shaved_ice', soundCategory: 'drink', x: 518, y: 568, hitW: 46, hitH: 54, scale: 0.74, camoBlend: true },
      { id: 'fw-paper-crane', label: 'Hạc Giấy Ước Nguyện', artKey: 'paper_crane', soundCategory: 'charm', x: 1168, y: 124, hitW: 46, hitH: 44, scale: 0.72, rotateDeg: -16 },
      { id: 'fw-matcha', label: 'Trà Sữa Matcha Đêm', artKey: 'matcha_parfait', soundCategory: 'drink', x: 1068, y: 404, hitW: 44, hitH: 54, scale: 0.74, camoBlend: true },
      { id: 'fw-siamese', label: 'Mèo Xiêm Ngắm Pháo Hoa', artKey: 'siamese_cat', soundCategory: 'cat', x: 114, y: 344, hitW: 50, hitH: 52, scale: 0.74, camoBlend: true },
      { id: 'fw-tuxedo', label: 'Mèo Tuxedo Trong Tách', artKey: 'tuxedo_cup_cat', soundCategory: 'cat', x: 806, y: 486, hitW: 48, hitH: 48, scale: 0.72, camoBlend: true },
      { id: 'fw-golden-cat', label: 'Mèo Vàng Hoàng Gia', artKey: 'golden_secret_cat', soundCategory: 'secret', x: 726, y: 130, hitW: 52, hitH: 52, scale: 0.72, hiddenUnderCoverId: 'fw-cover-tin-secret', isSecretGoldenCat: true },
    ],
  },
];

export function createInitialStageSave(): CatStageSave {
  return {
    foundItemIds: [],
    foundSecretCat: false,
    cleared: false,
    bestStars: 0,
    bestTimeSec: null,
    bestCombo: 0,
  };
}

export function getCatDifficultyConfig(id: CatDifficultyId): CatDifficultyConfig {
  return CAT_DIFFICULTIES[id] ?? CAT_DIFFICULTIES.hard_5x;
}

export function getMainStages(): CatStageDef[] {
  return CAT_STAGES.filter((s) => !s.isSecretStage);
}

export function getRegularItems(stage: CatStageDef): CatItemDef[] {
  return stage.items.filter((i) => !i.isSecretGoldenCat);
}

export function getSecretCatItem(stage: CatStageDef): CatItemDef | undefined {
  return stage.items.find((i) => i.isSecretGoldenCat);
}

export function countCollectedSecretCats(save: CatFinderSaveData): number {
  return getMainStages().reduce((acc, st) => {
    return acc + (save.stages[st.id]?.foundSecretCat ? 1 : 0);
  }, 0);
}

export function isStageUnlocked(stageId: string, save: CatFinderSaveData): boolean {
  const stage = CAT_STAGES.find((s) => s.id === stageId);
  if (!stage) return false;
  if (stage.isSecretStage) {
    return countCollectedSecretCats(save) >= getMainStages().length;
  }
  if (stage.order <= 1) return true;
  const prev = CAT_STAGES.find((s) => !s.isSecretStage && s.order === stage.order - 1);
  if (!prev) return true;
  return Boolean(save.stages[prev.id]?.cleared);
}

export function getCoverTapsRequired(cover: CatCoverDef): number {
  return Math.max(1, cover.tapsRequired ?? 1);
}

export function isCoverFullyOpen(
  cover: CatCoverDef,
  coverTapCounts: Record<string, number>
): boolean {
  return (coverTapCounts[cover.id] ?? 0) >= getCoverTapsRequired(cover);
}

export function advanceCoverTapState(
  cover: CatCoverDef,
  currentTaps: number
): { nextTaps: number; nowOpen: boolean; unlockedLatchStep: boolean } {
  const req = getCoverTapsRequired(cover);
  if (currentTaps >= req) {
    return { nextTaps: 0, nowOpen: false, unlockedLatchStep: false };
  }
  const nextTaps = currentTaps + 1;
  const nowOpen = nextTaps >= req;
  return {
    nextTaps,
    nowOpen,
    unlockedLatchStep: !nowOpen && nextTaps > 0,
  };
}

export function getOpenedCoverIdsFromMap(
  stage: CatStageDef,
  coverTapCounts: Record<string, number>
): string[] {
  return stage.covers
    .filter((cov) => isCoverFullyOpen(cov, coverTapCounts))
    .map((cov) => cov.id);
}

export function isCatItemAccessible(
  item: CatItemDef,
  openedCoverIds: readonly string[]
): boolean {
  if (!item.hiddenUnderCoverId) return true;
  return openedCoverIds.includes(item.hiddenUnderCoverId);
}

export function getActiveCatTargetQueue(
  stage: CatStageDef,
  foundItemIds: readonly string[],
  limit: number | null
): CatItemDef[] {
  const foundSet = new Set(foundItemIds);
  const unfound = getRegularItems(stage).filter((it) => !foundSet.has(it.id));
  if (limit === null) return unfound;
  return unfound.slice(0, Math.max(1, limit));
}

export function isItemAllowedByQueue(
  item: CatItemDef,
  activeQueue: readonly CatItemDef[]
): boolean {
  if (item.isSecretGoldenCat) return true;
  return activeQueue.some((q) => q.id === item.id);
}

export function applyCatMisclickPenalty(
  hearts: number
): { nextHearts: number; isGameOver: boolean } {
  const nextHearts = Math.max(0, hearts - 1);
  return {
    nextHearts,
    isGameOver: nextHearts <= 0,
  };
}

export function getEffectiveItemScale(
  item: CatItemDef,
  diffConfig: CatDifficultyConfig
): number {
  return Number(((item.scale ?? 1) * diffConfig.itemScaleMult).toFixed(3));
}

export function updateComboOnFind(
  prevStreak: number,
  lastFindAtMs: number | null,
  nowMs: number
): CatComboResult {
  if (lastFindAtMs !== null && nowMs - lastFindAtMs <= CAT_COMBO_WINDOW_MS) {
    const nextStreak = prevStreak + 1;
    return {
      nextStreak,
      isComboBoost: nextStreak >= 2,
      nextLastFindAtMs: nowMs,
    };
  }
  return {
    nextStreak: 1,
    isComboBoost: false,
    nextLastFindAtMs: nowMs,
  };
}

export function computeCatStageStars(
  hintsUsed: number,
  foundSecretCat: boolean,
  remainingHearts = 5,
  maxHearts = 7
): number {
  const ratioHearts = maxHearts > 0 ? remainingHearts / maxHearts : 1;
  if (hintsUsed === 0 && ratioHearts >= 0.5 && foundSecretCat) return 3;
  if (hintsUsed <= 1 && ratioHearts >= 0.6) return 3;
  if (hintsUsed <= 2 && (remainingHearts >= 2 || ratioHearts >= 0.45)) return 2;
  return 1;
}

export function pickCatHintTarget(
  stage: CatStageDef,
  foundItemIds: readonly string[],
  openedCoverIds: readonly string[],
  activeQueueLimit: number | null = null
): CatHintTarget | null {
  const foundSet = new Set(foundItemIds);
  const activeQueue = getActiveCatTargetQueue(stage, foundItemIds, activeQueueLimit);
  const pool =
    activeQueue.length > 0
      ? activeQueue
      : stage.items.filter((it) => !foundSet.has(it.id));
  if (pool.length === 0) return null;

  const accessible = pool.find((it) => isCatItemAccessible(it, openedCoverIds));
  const target = accessible ?? pool[0];

  if (target.hiddenUnderCoverId && !openedCoverIds.includes(target.hiddenUnderCoverId)) {
    const cover = stage.covers.find((c) => c.id === target.hiddenUnderCoverId);
    if (cover) {
      return {
        item: target,
        needsCoverId: cover.id,
        x: cover.x + cover.w / 2,
        y: cover.y + cover.h / 2,
      };
    }
  }

  return {
    item: target,
    needsCoverId: null,
    x: target.x,
    y: target.y,
  };
}

export function clampCatPanZoom(
  scale: number,
  panX: number,
  panY: number,
  viewportW: number,
  viewportH: number,
  customStageDisplayW?: number
): CatPanZoom {
  const clampedScale = Math.min(CAT_MAX_ZOOM, Math.max(CAT_MIN_ZOOM, Number(scale.toFixed(2))));
  const stageDisplayW =
    customStageDisplayW !== undefined
      ? Math.max(200, customStageDisplayW)
      : Math.max(viewportW, 1080);
  const stageDisplayH = stageDisplayW * (CAT_SCENE_H / CAT_SCENE_W);
  const maxPanX = Math.max(0, (stageDisplayW * clampedScale - viewportW) / 2);
  const maxPanY = Math.max(0, (stageDisplayH * clampedScale - viewportH) / 2);

  return {
    scale: clampedScale,
    panX: Math.max(-maxPanX, Math.min(maxPanX, Math.round(panX))),
    panY: Math.max(-maxPanY, Math.min(maxPanY, Math.round(panY))),
  };
}

export function parseCatFinderSave(raw: string | null): CatFinderSaveData {
  const baseStages: Record<string, CatStageSave> = {};
  for (const st of CAT_STAGES) {
    baseStages[st.id] = createInitialStageSave();
  }
  const fallback: CatFinderSaveData = {
    activeStageId: CAT_STAGES[0].id,
    difficultyId: 'hard_5x',
    stages: baseStages,
  };

  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<CatFinderSaveData>;
    if (!parsed || typeof parsed !== 'object') return fallback;

    const stagesOut: Record<string, CatStageSave> = { ...baseStages };
    if (parsed.stages && typeof parsed.stages === 'object') {
      for (const st of CAT_STAGES) {
        const entry = parsed.stages[st.id];
        if (!entry || typeof entry !== 'object') continue;
        const validIds = new Set(st.items.map((i) => i.id));
        const foundItemIds = Array.isArray(entry.foundItemIds)
          ? Array.from(
              new Set(entry.foundItemIds.filter((id): id is string => typeof id === 'string' && validIds.has(id)))
            )
          : [];
        const secretItem = getSecretCatItem(st);
        const foundSecretCat =
          Boolean(entry.foundSecretCat) || (secretItem ? foundItemIds.includes(secretItem.id) : false);
        stagesOut[st.id] = {
          foundItemIds,
          foundSecretCat,
          cleared: Boolean(entry.cleared),
          bestStars:
            typeof entry.bestStars === 'number'
              ? Math.max(0, Math.min(3, Math.floor(entry.bestStars)))
              : 0,
          bestTimeSec:
            typeof entry.bestTimeSec === 'number' && entry.bestTimeSec >= 0
              ? Math.floor(entry.bestTimeSec)
              : null,
          bestCombo:
            typeof entry.bestCombo === 'number' && entry.bestCombo >= 0
              ? Math.floor(entry.bestCombo)
              : 0,
        };
      }
    }

    const validActive =
      typeof parsed.activeStageId === 'string' &&
      CAT_STAGES.some((s) => s.id === parsed.activeStageId)
        ? parsed.activeStageId
        : CAT_STAGES[0].id;

    const validDiff: CatDifficultyId =
      parsed.difficultyId === 'hard_5x' ||
      parsed.difficultyId === 'nightmare_8x' ||
      parsed.difficultyId === 'eagle_10x' ||
      parsed.difficultyId === 'god_ray_20x'
        ? parsed.difficultyId
        : 'hard_5x';

    return {
      activeStageId: validActive,
      difficultyId: validDiff,
      stages: stagesOut,
    };
  } catch {
    return fallback;
  }
}

export function computeCatStageLayoutSignature(stage: CatStageDef): string {
  const coverPart = stage.covers
    .map((c) => `${c.id}:${Math.round(c.x / 10)},${Math.round(c.y / 10)}`)
    .sort()
    .join('|');
  const itemPart = stage.items
    .map(
      (i) =>
        `${i.id}:${Math.round(i.x / 10)},${Math.round(i.y / 10)},${i.hiddenUnderCoverId ?? ''}`
    )
    .sort()
    .join('|');
  return `${coverPart}#${itemPart}`;
}

const EXTRA_COVER_ANCHORS: readonly [number, number][] = [
  [105, 138],
  [345, 132],
  [595, 126],
  [845, 138],
  [1105, 145],
  [115, 345],
  [370, 355],
  [615, 348],
  [865, 340],
  [1120, 352],
  [215, 515],
  [465, 512],
  [735, 518],
  [990, 512],
];

const EXTRA_OPEN_ITEM_ANCHORS: readonly [number, number][] = [
  [88, 118], [188, 124], [308, 118], [435, 114], [552, 118], [728, 116], [892, 118], [1028, 118], [1185, 118], [1282, 116],
  [92, 224], [218, 228], [398, 218], [568, 224], [732, 226], [908, 218], [1062, 224], [1222, 228],
  [118, 326], [282, 324], [448, 328], [612, 326], [774, 322], [946, 328], [1106, 324], [1268, 326],
  [96, 424], [254, 428], [412, 424], [574, 426], [748, 424], [912, 428], [1068, 424], [1246, 426],
  [124, 524], [298, 526], [468, 524], [634, 526], [802, 522], [964, 528], [1128, 524], [1274, 522],
  [172, 608], [344, 612], [516, 608], [692, 612], [866, 608], [1036, 612], [1198, 608],
];

function shuffleWithRng<T>(arr: readonly T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function clampSceneVal(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function rectsOverlapWithPad(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  pad: number
): boolean {
  return (
    ax < bx + bw + pad &&
    ax + aw + pad > bx &&
    ay < by + bh + pad &&
    ay + ah + pad > by
  );
}

function pointInsideAnyCover(
  x: number,
  y: number,
  covers: readonly CatCoverDef[],
  pad: number
): boolean {
  return covers.some(
    (c) =>
      x >= c.x - pad &&
      x <= c.x + c.w + pad &&
      y >= c.y - pad &&
      y <= c.y + c.h + pad
  );
}

function buildRandomizedAttempt(stage: CatStageDef, rng: () => number): CatStageDef {
  // 1. Randomize cover positions across scenic cover anchors without overlapping each other
  const coverAnchors = shuffleWithRng(
    [
      ...stage.covers.map((c) => [c.x, c.y] as [number, number]),
      ...EXTRA_COVER_ANCHORS,
    ],
    rng
  );

  const placedCovers: CatCoverDef[] = [];
  for (const cov of stage.covers) {
    const maxX = CAT_SCENE_W - cov.w - 48;
    const maxY = CAT_SCENE_H - cov.h - 48;
    let chosenX = clampSceneVal(cov.x, 48, maxX);
    let chosenY = clampSceneVal(cov.y, 72, maxY);

    let placed = false;
    for (const [ax, ay] of coverAnchors) {
      const candX = Math.round(clampSceneVal(ax + (rng() - 0.5) * 26, 48, maxX));
      const candY = Math.round(clampSceneVal(ay + (rng() - 0.5) * 22, 72, maxY));
      if (
        !placedCovers.some((p) =>
          rectsOverlapWithPad(candX, candY, cov.w, cov.h, p.x, p.y, p.w, p.h, 16)
        )
      ) {
        chosenX = candX;
        chosenY = candY;
        placed = true;
        break;
      }
    }

    // Fallback grid scan if random anchors collided
    if (!placed) {
      outer: for (let gy = 80; gy <= maxY; gy += 48) {
        for (let gx = 54; gx <= maxX; gx += 62) {
          if (
            !placedCovers.some((p) =>
              rectsOverlapWithPad(gx, gy, cov.w, cov.h, p.x, p.y, p.w, p.h, 12)
            )
          ) {
            chosenX = gx;
            chosenY = gy;
            break outer;
          }
        }
      }
    }

    placedCovers.push({
      ...cov,
      x: chosenX,
      y: chosenY,
    });
  }

  // 2. Permute which non-decoy covers hold covered items (so item-to-cover pairings vary every run)
  const nonDecoyCovers = placedCovers.filter((c) => !c.isDecoy);
  const shuffledNonDecoyCovers = shuffleWithRng(nonDecoyCovers, rng);

  const coveredSourceItems = stage.items.filter((it) => Boolean(it.hiddenUnderCoverId));
  const openSourceItems = stage.items.filter((it) => !it.hiddenUnderCoverId);

  // Shuffle which items from open pool vs covered pool sit under covers (keep secret golden cat movable!)
  const allShuffledItems = shuffleWithRng([...coveredSourceItems, ...openSourceItems], rng);
  const nextCoveredCount = Math.min(coveredSourceItems.length, shuffledNonDecoyCovers.length);
  const itemsToHide = allShuffledItems.slice(0, nextCoveredCount);
  const itemsToLeaveOpen = allShuffledItems.slice(nextCoveredCount);

  const placedItems: CatItemDef[] = [];

  // Place covered items strictly inside their newly assigned cover bounding rect
  itemsToHide.forEach((item, idx) => {
    const cov = shuffledNonDecoyCovers[idx];
    const padX = Math.min(24, Math.floor(cov.w * 0.25));
    const padY = Math.min(24, Math.floor(cov.h * 0.25));
    const x = Math.round(
      clampSceneVal(
        cov.x + padX + rng() * Math.max(1, cov.w - padX * 2),
        cov.x + 8,
        cov.x + cov.w - 8
      )
    );
    const y = Math.round(
      clampSceneVal(
        cov.y + padY + rng() * Math.max(1, cov.h - padY * 2),
        cov.y + 8,
        cov.y + cov.h - 8
      )
    );
    placedItems.push({
      ...item,
      x,
      y,
      hiddenUnderCoverId: cov.id,
      rotateDeg:
        item.soundCategory === 'cat' || item.soundCategory === 'dog'
          ? Math.round((rng() - 0.5) * 10)
          : Math.round((item.rotateDeg ?? 0) + (rng() - 0.5) * 28),
    });
  });

  // 3. Place open items across scenic open points with separation & outside covers
  const openCandidatePool = shuffleWithRng(
    [
      ...stage.items.filter((i) => !i.hiddenUnderCoverId).map((i) => [i.x, i.y] as [number, number]),
      ...EXTRA_OPEN_ITEM_ANCHORS,
    ],
    rng
  );

  const placedOpenPositions: Array<{ x: number; y: number }> = [];
  for (const item of itemsToLeaveOpen) {
    let chosenX = clampSceneVal(item.x, 56, CAT_SCENE_W - 56);
    let chosenY = clampSceneVal(item.y, 72, CAT_SCENE_H - 52);
    let foundSpot = false;

    for (const [ax, ay] of openCandidatePool) {
      const cx = Math.round(clampSceneVal(ax + (rng() - 0.5) * 28, 56, CAT_SCENE_W - 56));
      const cy = Math.round(clampSceneVal(ay + (rng() - 0.5) * 24, 72, CAT_SCENE_H - 52));
      if (pointInsideAnyCover(cx, cy, placedCovers, 18)) continue;
      if (placedOpenPositions.some((p) => Math.hypot(cx - p.x, cy - p.y) < 52)) continue;
      chosenX = cx;
      chosenY = cy;
      foundSpot = true;
      break;
    }

    if (!foundSpot) {
      // Deterministic safe grid search guaranteeing non-overlap & outside covers
      outerOpen: for (let gy = 76; gy <= CAT_SCENE_H - 52; gy += 46) {
        for (let gx = 58; gx <= CAT_SCENE_W - 58; gx += 54) {
          if (pointInsideAnyCover(gx, gy, placedCovers, 14)) continue;
          if (placedOpenPositions.some((p) => Math.hypot(gx - p.x, gy - p.y) < 46)) continue;
          chosenX = gx;
          chosenY = gy;
          foundSpot = true;
          break outerOpen;
        }
      }
    }

    placedOpenPositions.push({ x: chosenX, y: chosenY });
    placedItems.push({
      ...item,
      x: chosenX,
      y: chosenY,
      hiddenUnderCoverId: undefined,
      rotateDeg:
        item.soundCategory === 'cat' || item.soundCategory === 'dog'
          ? Math.round((rng() - 0.5) * 10)
          : Math.round((item.rotateDeg ?? 0) + (rng() - 0.5) * 32),
    });
  }

  // Restore canonical stage item ordering for consistent queue / thumbnail rendering,
  // or keep regular order slightly shuffled so queue order in 8x/10x/20x also feels fresh!
  const shuffledItemList = shuffleWithRng(placedItems, rng);

  // 4. Randomize decoy scatter without sitting directly on open target hitboxes
  const decoyPool = shuffleWithRng(
    [
      ...stage.decoys.map((d) => [d.x, d.y] as [number, number]),
      ...EXTRA_OPEN_ITEM_ANCHORS,
    ],
    rng
  );
  const shuffledArtKeys = shuffleWithRng(
    stage.decoys.map((d) => d.artKey),
    rng
  );

  const placedDecoys: CatDecoyDef[] = stage.decoys.map((dec, idx) => {
    const base = decoyPool[idx % decoyPool.length];
    let dx = Math.round(clampSceneVal(base[0] + (rng() - 0.5) * 34, 52, CAT_SCENE_W - 52));
    let dy = Math.round(clampSceneVal(base[1] + (rng() - 0.5) * 30, 68, CAT_SCENE_H - 48));
    if (placedOpenPositions.some((p) => Math.hypot(dx - p.x, dy - p.y) < 34)) {
      dx = Math.round(clampSceneVal(dx + (rng() > 0.5 ? 42 : -42), 52, CAT_SCENE_W - 52));
      dy = Math.round(clampSceneVal(dy + (rng() > 0.5 ? 36 : -36), 68, CAT_SCENE_H - 48));
    }
    return {
      ...dec,
      artKey: shuffledArtKeys[idx % shuffledArtKeys.length],
      x: dx,
      y: dy,
      rotateDeg: Math.round((rng() - 0.5) * 68),
      scale: Number((0.5 + rng() * 0.26).toFixed(2)),
    };
  });

  return {
    ...stage,
    covers: placedCovers,
    items: shuffledItemList,
    decoys: placedDecoys,
  };
}

export function randomizeCatStageLayout(
  stage: CatStageDef,
  options?: {
    rng?: () => number;
    recentSignatures?: readonly string[];
  }
): { stage: CatStageDef; signature: string } {
  const rng = options?.rng ?? Math.random;
  const recentSet = new Set(options?.recentSignatures ?? []);

  let candidate = buildRandomizedAttempt(stage, rng);
  let signature = computeCatStageLayoutSignature(candidate);

  for (let attempt = 0; attempt < 8 && recentSet.has(signature); attempt++) {
    candidate = buildRandomizedAttempt(stage, rng);
    signature = computeCatStageLayoutSignature(candidate);
  }

  return { stage: candidate, signature };
}
