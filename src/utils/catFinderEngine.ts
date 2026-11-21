export const CAT_SCENE_W = 1360;
export const CAT_SCENE_H = 680;
export const CAT_MIN_ZOOM = 1;
export const CAT_MAX_ZOOM = 2.4;
export const CAT_COMBO_WINDOW_MS = 4800;

export type CatSoundCategory = 'cat' | 'dog' | 'drink' | 'pastry' | 'charm' | 'secret';

export type CatWorldTheme =
  | 'bakery'
  | 'flower_alley'
  | 'pet_cafe'
  | 'night_market'
  | 'fireworks';

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
        label: 'Hộp bánh thiếc',
        x: 690,
        y: 356,
        w: 112,
        h: 88,
        kind: 'tin_lid',
        openOffsetX: 28,
        openOffsetY: -66,
        openRotateDeg: -22,
      },
      {
        id: 'bk-cover-curtain',
        label: 'Rèm cửa sổ',
        x: 205,
        y: 165,
        w: 130,
        h: 150,
        kind: 'curtain',
        openOffsetX: -78,
        openOffsetY: 0,
        openRotateDeg: -6,
      },
    ],
    items: [
      {
        id: 'bk-croissant',
        label: 'Bánh Sừng Bò',
        artKey: 'croissant',
        soundCategory: 'pastry',
        x: 428,
        y: 412,
        hitW: 72,
        hitH: 56,
        rotateDeg: -8,
      },
      {
        id: 'bk-flour-cat',
        label: 'Mèo Mướp Bao Bột',
        artKey: 'tabby_flour_cat',
        soundCategory: 'cat',
        x: 118,
        y: 525,
        hitW: 88,
        hitH: 82,
      },
      {
        id: 'bk-latte',
        label: 'Ly Latte Art',
        artKey: 'latte_cup',
        soundCategory: 'drink',
        x: 560,
        y: 422,
        hitW: 68,
        hitH: 66,
      },
      {
        id: 'bk-chef-hat',
        label: 'Mũ Đầu Bếp',
        artKey: 'chef_hat',
        soundCategory: 'charm',
        x: 520,
        y: 230,
        hitW: 74,
        hitH: 72,
        rotateDeg: 10,
      },
      {
        id: 'bk-strawberry',
        label: 'Dâu Tây Mọng',
        artKey: 'strawberry',
        soundCategory: 'pastry',
        x: 885,
        y: 430,
        hitW: 60,
        hitH: 60,
      },
      {
        id: 'bk-scale',
        label: 'Cân Cổ Đồng',
        artKey: 'vintage_scale',
        soundCategory: 'charm',
        x: 1030,
        y: 405,
        hitW: 84,
        hitH: 88,
      },
      {
        id: 'bk-rolling-pin',
        label: 'Cây Cán Bột',
        artKey: 'rolling_pin',
        soundCategory: 'charm',
        x: 315,
        y: 495,
        hitW: 94,
        hitH: 54,
        rotateDeg: -14,
      },
      {
        id: 'bk-macaron',
        label: 'Bánh Macaron Hồng',
        artKey: 'pink_macaron',
        soundCategory: 'pastry',
        x: 744,
        y: 404,
        hitW: 66,
        hitH: 58,
        hiddenUnderCoverId: 'bk-cover-tin',
      },
      {
        id: 'bk-basil-pot',
        label: 'Chậu Thảo Mộc',
        artKey: 'basil_pot',
        soundCategory: 'charm',
        x: 270,
        y: 268,
        hitW: 68,
        hitH: 76,
        hiddenUnderCoverId: 'bk-cover-curtain',
      },
      {
        id: 'bk-jam-jar',
        label: 'Hũ Mứt Cam',
        artKey: 'orange_jam',
        soundCategory: 'drink',
        x: 1185,
        y: 268,
        hitW: 64,
        hitH: 70,
      },
      {
        id: 'bk-golden-cat',
        label: 'Mèo Vàng Bí Mật',
        artKey: 'golden_secret_cat',
        soundCategory: 'secret',
        x: 1245,
        y: 148,
        hitW: 72,
        hitH: 72,
        isSecretGoldenCat: true,
      },
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
      {
        id: 'fl-cover-bush',
        label: 'Bụi hoa cẩm tú cầu',
        x: 230,
        y: 445,
        w: 146,
        h: 110,
        kind: 'bush',
        openOffsetX: -72,
        openOffsetY: 14,
        openRotateDeg: -10,
      },
      {
        id: 'fl-cover-door',
        label: 'Cửa kính nhà cây',
        x: 895,
        y: 235,
        w: 115,
        h: 170,
        kind: 'glass_door',
        openOffsetX: 78,
        openOffsetY: 0,
        openRotateDeg: 0,
      },
    ],
    items: [
      {
        id: 'fl-sunflower',
        label: 'Bó Hướng Dương',
        artKey: 'sunflower_bouquet',
        soundCategory: 'charm',
        x: 525,
        y: 448,
        hitW: 78,
        hitH: 88,
      },
      {
        id: 'fl-watering-can',
        label: 'Bình Tưới Cây',
        artKey: 'watering_can',
        soundCategory: 'drink',
        x: 132,
        y: 545,
        hitW: 84,
        hitH: 72,
      },
      {
        id: 'fl-calico-cat',
        label: 'Mèo Tam Thể Bụi Hoa',
        artKey: 'calico_bush_cat',
        soundCategory: 'cat',
        x: 305,
        y: 505,
        hitW: 78,
        hitH: 78,
        hiddenUnderCoverId: 'fl-cover-bush',
      },
      {
        id: 'fl-bike',
        label: 'Xe Đạp Giỏ Hoa',
        artKey: 'flower_bicycle',
        soundCategory: 'charm',
        x: 720,
        y: 505,
        hitW: 122,
        hitH: 92,
      },
      {
        id: 'fl-straw-hat',
        label: 'Mũ Cói Ruy Băng',
        artKey: 'straw_hat',
        soundCategory: 'charm',
        x: 418,
        y: 256,
        hitW: 80,
        hitH: 60,
        rotateDeg: -12,
      },
      {
        id: 'fl-shears',
        label: 'Kéo Tỉa Cành',
        artKey: 'garden_shears',
        soundCategory: 'charm',
        x: 615,
        y: 356,
        hitW: 68,
        hitH: 64,
        rotateDeg: 18,
      },
      {
        id: 'fl-cactus',
        label: 'Chậu Xương Rồng',
        artKey: 'cactus_pot',
        soundCategory: 'charm',
        x: 952,
        y: 335,
        hitW: 68,
        hitH: 80,
        hiddenUnderCoverId: 'fl-cover-door',
      },
      {
        id: 'fl-windchime',
        label: 'Chuông Gió Thủy Tinh',
        artKey: 'glass_windchime',
        soundCategory: 'drink',
        x: 790,
        y: 162,
        hitW: 66,
        hitH: 88,
      },
      {
        id: 'fl-seeds',
        label: 'Gói Hạt Giống',
        artKey: 'seed_packet',
        soundCategory: 'pastry',
        x: 1135,
        y: 472,
        hitW: 64,
        hitH: 70,
      },
      {
        id: 'fl-daisy-vase',
        label: 'Bình Hoa Cúc',
        artKey: 'daisy_vase',
        soundCategory: 'charm',
        x: 1230,
        y: 365,
        hitW: 68,
        hitH: 84,
      },
      {
        id: 'fl-golden-cat',
        label: 'Mèo Vàng Bí Mật',
        artKey: 'golden_secret_cat',
        soundCategory: 'secret',
        x: 1098,
        y: 138,
        hitW: 72,
        hitH: 72,
        isSecretGoldenCat: true,
      },
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
      {
        id: 'pc-cover-tent',
        label: 'Lều vải thú cưng',
        x: 185,
        y: 410,
        w: 150,
        h: 135,
        kind: 'pet_tent',
        openOffsetX: -72,
        openOffsetY: -22,
        openRotateDeg: -14,
      },
      {
        id: 'pc-cover-cabinet',
        label: 'Cửa tủ trà bánh',
        x: 885,
        y: 292,
        w: 120,
        h: 120,
        kind: 'pastry_door',
        openOffsetX: 78,
        openOffsetY: 0,
        openRotateDeg: 0,
      },
    ],
    items: [
      {
        id: 'pc-corgi',
        label: 'Corgi Ngủ Gật',
        artKey: 'sleeping_corgi',
        soundCategory: 'dog',
        x: 262,
        y: 492,
        hitW: 92,
        hitH: 78,
        hiddenUnderCoverId: 'pc-cover-tent',
      },
      {
        id: 'pc-yarn',
        label: 'Cuộn Len Hồng',
        artKey: 'pink_yarn',
        soundCategory: 'charm',
        x: 425,
        y: 552,
        hitW: 70,
        hitH: 64,
      },
      {
        id: 'pc-boba',
        label: 'Trà Sữa Trân Châu',
        artKey: 'boba_tea',
        soundCategory: 'drink',
        x: 942,
        y: 356,
        hitW: 66,
        hitH: 80,
        hiddenUnderCoverId: 'pc-cover-cabinet',
      },
      {
        id: 'pc-bread-pillow',
        label: 'Gối Ôm Bánh Mì',
        artKey: 'bread_pillow',
        soundCategory: 'pastry',
        x: 612,
        y: 486,
        hitW: 88,
        hitH: 68,
      },
      {
        id: 'pc-doorbell',
        label: 'Chuông Cửa Gỗ',
        artKey: 'wood_doorbell',
        soundCategory: 'charm',
        x: 145,
        y: 162,
        hitW: 64,
        hitH: 68,
      },
      {
        id: 'pc-bone-cookie',
        label: 'Bánh Quy Xương',
        artKey: 'bone_cookie',
        soundCategory: 'pastry',
        x: 782,
        y: 452,
        hitW: 72,
        hitH: 52,
        rotateDeg: 14,
      },
      {
        id: 'pc-siamese-cat',
        label: 'Mèo Xiêm Trên Kệ',
        artKey: 'siamese_cat',
        soundCategory: 'cat',
        x: 540,
        y: 215,
        hitW: 82,
        hitH: 82,
      },
      {
        id: 'pc-vinyl',
        label: 'Đĩa Nhạc Than',
        artKey: 'vinyl_record',
        soundCategory: 'charm',
        x: 705,
        y: 176,
        hitW: 74,
        hitH: 74,
      },
      {
        id: 'pc-cat-mug',
        label: 'Cốc Sứ Tai Mèo',
        artKey: 'cat_ear_mug',
        soundCategory: 'drink',
        x: 472,
        y: 378,
        hitW: 64,
        hitH: 64,
      },
      {
        id: 'pc-bowtie',
        label: 'Nơ Cổ Chấm Bi',
        artKey: 'polka_bowtie',
        soundCategory: 'charm',
        x: 1138,
        y: 522,
        hitW: 68,
        hitH: 52,
      },
      {
        id: 'pc-claw-toy',
        label: 'Cá Bông Catnip',
        artKey: 'catnip_fish',
        soundCategory: 'cat',
        x: 1218,
        y: 342,
        hitW: 82,
        hitH: 56,
        rotateDeg: -10,
      },
      {
        id: 'pc-golden-cat',
        label: 'Mèo Vàng Bí Mật',
        artKey: 'golden_secret_cat',
        soundCategory: 'secret',
        x: 1035,
        y: 152,
        hitW: 72,
        hitH: 72,
        isSecretGoldenCat: true,
      },
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
      {
        id: 'nm-cover-tarp',
        label: 'Khăn phủ quầy đồ chơi',
        x: 545,
        y: 410,
        w: 132,
        h: 98,
        kind: 'tarp',
        openOffsetX: -70,
        openOffsetY: -20,
        openRotateDeg: -12,
      },
      {
        id: 'nm-cover-noren',
        label: 'Rèm vải noren',
        x: 1035,
        y: 235,
        w: 145,
        h: 120,
        kind: 'noren',
        openOffsetX: 74,
        openOffsetY: -28,
        openRotateDeg: 10,
      },
    ],
    items: [
      {
        id: 'nm-carp-lantern',
        label: 'Đèn Lồng Cá Chép',
        artKey: 'carp_lantern',
        soundCategory: 'charm',
        x: 185,
        y: 162,
        hitW: 82,
        hitH: 88,
      },
      {
        id: 'nm-fishball',
        label: 'Xiên Cá Viên',
        artKey: 'fishball_skewer',
        soundCategory: 'pastry',
        x: 342,
        y: 446,
        hitW: 66,
        hitH: 84,
        rotateDeg: 12,
      },
      {
        id: 'nm-sakura-fan',
        label: 'Quạt Giấy Hoa Đào',
        artKey: 'sakura_fan',
        soundCategory: 'charm',
        x: 472,
        y: 295,
        hitW: 84,
        hitH: 66,
      },
      {
        id: 'nm-claw-machine',
        label: 'Máy Gắp Thú Mini',
        artKey: 'mini_claw_machine',
        soundCategory: 'charm',
        x: 828,
        y: 378,
        hitW: 92,
        hitH: 112,
      },
      {
        id: 'nm-musicbox',
        label: 'Hộp Nhạc Dây Cót',
        artKey: 'windup_musicbox',
        soundCategory: 'charm',
        x: 612,
        y: 462,
        hitW: 72,
        hitH: 70,
        hiddenUnderCoverId: 'nm-cover-tarp',
      },
      {
        id: 'nm-ribbon-cat',
        label: 'Mèo Trắng Đeo Nơ',
        artKey: 'white_ribbon_cat',
        soundCategory: 'cat',
        x: 1105,
        y: 312,
        hitW: 80,
        hitH: 80,
        hiddenUnderCoverId: 'nm-cover-noren',
      },
      {
        id: 'nm-egg-waffle',
        label: 'Bánh Trứng Gà Non',
        artKey: 'egg_waffle',
        soundCategory: 'pastry',
        x: 215,
        y: 486,
        hitW: 74,
        hitH: 74,
      },
      {
        id: 'nm-bell-bracelet',
        label: 'Vòng Tay Chuông',
        artKey: 'bell_bracelet',
        soundCategory: 'charm',
        x: 728,
        y: 536,
        hitW: 68,
        hitH: 64,
      },
      {
        id: 'nm-cat-mask',
        label: 'Mặt Nạ Mèo',
        artKey: 'festival_cat_mask',
        soundCategory: 'cat',
        x: 942,
        y: 215,
        hitW: 74,
        hitH: 72,
      },
      {
        id: 'nm-shaved-ice',
        label: 'Ly Đá Bào Dâu',
        artKey: 'strawberry_shaved_ice',
        soundCategory: 'drink',
        x: 446,
        y: 536,
        hitW: 68,
        hitH: 82,
      },
      {
        id: 'nm-garland',
        label: 'Cờ Dây Ngôi Sao',
        artKey: 'star_garland',
        soundCategory: 'charm',
        x: 660,
        y: 122,
        hitW: 102,
        hitH: 56,
      },
      {
        id: 'nm-golden-cat',
        label: 'Mèo Vàng Bí Mật',
        artKey: 'golden_secret_cat',
        soundCategory: 'secret',
        x: 1245,
        y: 515,
        hitW: 72,
        hitH: 72,
        isSecretGoldenCat: true,
      },
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
      {
        id: 'fw-cover-curtain',
        label: 'Rèm lồng đèn đỏ',
        x: 280,
        y: 265,
        w: 132,
        h: 130,
        kind: 'festival_curtain',
        openOffsetX: -76,
        openOffsetY: 0,
        openRotateDeg: -8,
      },
      {
        id: 'fw-cover-stall',
        label: 'Nắp thùng gỗ lễ hội',
        x: 925,
        y: 448,
        w: 138,
        h: 96,
        kind: 'stall_box',
        openOffsetX: 38,
        openOffsetY: -62,
        openRotateDeg: 16,
      },
    ],
    items: [
      {
        id: 'fw-rose-firework',
        label: 'Pháo Hoa Bông Hồng',
        artKey: 'rose_firework',
        soundCategory: 'charm',
        x: 485,
        y: 128,
        hitW: 88,
        hitH: 88,
      },
      {
        id: 'fw-moon-fan',
        label: 'Quạt Tròn Trăng Rằm',
        artKey: 'moon_uchiwa',
        soundCategory: 'charm',
        x: 175,
        y: 445,
        hitW: 76,
        hitH: 84,
      },
      {
        id: 'fw-dango',
        label: 'Bánh Dango 3 Màu',
        artKey: 'tricolor_dango',
        soundCategory: 'pastry',
        x: 562,
        y: 472,
        hitW: 68,
        hitH: 80,
      },
      {
        id: 'fw-stargaze-cat',
        label: 'Mèo Mướp Ngắm Trăng',
        artKey: 'stargaze_cat',
        soundCategory: 'cat',
        x: 785,
        y: 356,
        hitW: 84,
        hitH: 86,
      },
      {
        id: 'fw-sky-lantern',
        label: 'Đèn Trời Bay',
        artKey: 'sky_lantern',
        soundCategory: 'charm',
        x: 960,
        y: 145,
        hitW: 74,
        hitH: 88,
      },
      {
        id: 'fw-cotton-candy',
        label: 'Kẹo Bông Gòn',
        artKey: 'cotton_candy',
        soundCategory: 'pastry',
        x: 422,
        y: 468,
        hitW: 74,
        hitH: 88,
      },
      {
        id: 'fw-taiko',
        label: 'Trống Taiko Tí Hon',
        artKey: 'mini_taiko',
        soundCategory: 'charm',
        x: 685,
        y: 525,
        hitW: 84,
        hitH: 76,
      },
      {
        id: 'fw-goldfish',
        label: 'Cá Vàng Vợt Giấy',
        artKey: 'goldfish_scoop',
        soundCategory: 'drink',
        x: 992,
        y: 496,
        hitW: 86,
        hitH: 76,
        hiddenUnderCoverId: 'fw-cover-stall',
      },
      {
        id: 'fw-fox-mask',
        label: 'Mặt Nạ Cáo Trắng',
        artKey: 'white_fox_mask',
        soundCategory: 'cat',
        x: 345,
        y: 332,
        hitW: 76,
        hitH: 76,
        hiddenUnderCoverId: 'fw-cover-curtain',
      },
      {
        id: 'fw-pinwheel',
        label: 'Chong Chóng Giấy',
        artKey: 'paper_pinwheel',
        soundCategory: 'charm',
        x: 1165,
        y: 382,
        hitW: 74,
        hitH: 86,
      },
      {
        id: 'fw-ramune',
        label: 'Chai Soda Bi',
        artKey: 'ramune_soda',
        soundCategory: 'drink',
        x: 1125,
        y: 535,
        hitW: 60,
        hitH: 82,
      },
      {
        id: 'fw-star-bell',
        label: 'Chuông Vàng Lễ Hội',
        artKey: 'festival_gold_bell',
        soundCategory: 'charm',
        x: 1228,
        y: 235,
        hitW: 74,
        hitH: 76,
      },
      {
        id: 'fw-golden-cat',
        label: 'Mèo Vàng Hoàng Gia',
        artKey: 'golden_secret_cat',
        soundCategory: 'secret',
        x: 725,
        y: 128,
        hitW: 74,
        hitH: 74,
        isSecretGoldenCat: true,
      },
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

export function isCatItemAccessible(
  item: CatItemDef,
  openedCoverIds: readonly string[]
): boolean {
  if (!item.hiddenUnderCoverId) return true;
  return openedCoverIds.includes(item.hiddenUnderCoverId);
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
  elapsedSec: number,
  foundSecretCat: boolean
): number {
  if (hintsUsed <= 1 && elapsedSec <= 180) return 3;
  if (hintsUsed <= 2 && foundSecretCat) return 3;
  if (hintsUsed <= 3) return 2;
  return 1;
}

export function pickCatHintTarget(
  stage: CatStageDef,
  foundItemIds: readonly string[],
  openedCoverIds: readonly string[]
): CatHintTarget | null {
  const foundSet = new Set(foundItemIds);
  const candidates = getRegularItems(stage).filter((it) => !foundSet.has(it.id));
  const pool =
    candidates.length > 0
      ? candidates
      : stage.items.filter((it) => !foundSet.has(it.id));
  if (pool.length === 0) return null;

  // Prefer already-accessible items first, else point to cover prop to tap open
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
  viewportH: number
): CatPanZoom {
  const clampedScale = Math.min(CAT_MAX_ZOOM, Math.max(CAT_MIN_ZOOM, Number(scale.toFixed(2))));
  const stageDisplayW = Math.max(viewportW, 1080);
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

    return {
      activeStageId: validActive,
      stages: stagesOut,
    };
  } catch {
    return fallback;
  }
}

export function formatCatTimer(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
