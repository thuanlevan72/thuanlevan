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
  | 'hunter'
  | 'prism_laser'
  | 'tempest'
  | 'sonic'
  | 'gravity_lance'
  | 'amp_spire'
  | 'radar'
  | 'aegis_field'
  | 'map01_cyber_smg'
  | 'map02_matrix_spire'
  | 'map03_forge_magma'
  | 'map04_void_katana'
  | 'map05_dune_needler'
  | 'map06_aurora_beam'
  | 'map07_cyclone_rotary'
  | 'map08_titan_flak'
  | 'map09_venom_hydra'
  | 'map10_meteor_rail'
  | 'map11_cryo_shatter'
  | 'map12_hellfire_organ'
  | 'map13_shadow_hive'
  | 'map14_omega_disruptor'
  | 'map15_emerald_reaper'
  | 'map16_void_sovereign';

export type GunVariant = 'alpha' | 'omega';

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
    description: 'Khởi đầu vững +22% · Lõi +20% máu · Quái 1.11× HP (-7.5%)',
    hpMult: 1.11,
    shieldMult: 1.1,
    speedMult: 0.98,
    armorBonus: 0,
    startEnergyMult: 1.22,
    coreHpMult: 1.2,
    rewardMult: 1.08,
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
    description: 'Cân bằng chiến thuật · Quái 1.66× HP (-7.8%) · +1 Đợt',
    hpMult: 1.66,
    shieldMult: 1.38,
    speedMult: 1.03,
    armorBonus: 0.05,
    startEnergyMult: 1.04,
    coreHpMult: 1.05,
    rewardMult: 1.0,
    scoreMult: 1.35,
    extraWaves: 1,
    waveCountBonus: 2,
    eliteChanceBoost: 0.05,
  },
  hard: {
    id: 'hard',
    label: 'Khó',
    shortLabel: 'KHÓ',
    badgeColor: '#F97316',
    description: 'Áp lực cao · Quái 2.44× HP (-7.6%), +11% tốc độ · +2 Đợt',
    hpMult: 2.44,
    shieldMult: 1.82,
    speedMult: 1.11,
    armorBonus: 0.1,
    startEnergyMult: 0.96,
    coreHpMult: 0.9,
    rewardMult: 0.94,
    scoreMult: 1.85,
    extraWaves: 2,
    waveCountBonus: 4,
    eliteChanceBoost: 0.12,
  },
  hell: {
    id: 'hell',
    label: 'Địa Ngục',
    shortLabel: 'ĐỊA NGỤC',
    badgeColor: '#FB7185',
    description: 'Cực hạn sinh tồn · Quái 3.55× HP (-7.6%), +18% tốc độ · +3 Đợt',
    hpMult: 3.55,
    shieldMult: 2.38,
    speedMult: 1.18,
    armorBonus: 0.17,
    startEnergyMult: 0.92,
    coreHpMult: 0.8,
    rewardMult: 0.9,
    scoreMult: 2.6,
    extraWaves: 3,
    waveCountBonus: 6,
    eliteChanceBoost: 0.22,
  },
};

export type GameModeId =
  | 'campaign'
  | 'blitz'
  | 'boss_rush'
  | 'endless'
  | 'overheat_fury'
  | 'iron_fortress'
  | 'tactical_tycoon'
  | 'chaos_swarm';

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
  readonly coreHpMult?: number;
  readonly hpMult?: number;
  readonly shieldMult?: number;
  readonly swarmCountMult?: number;
  readonly heatMult?: number;
  readonly rewardMult: number;
  readonly scoreMult: number;
  readonly waveDelaySec: number;
}

export const GAME_MODE_ORDER: readonly GameModeId[] = [
  'campaign',
  'blitz',
  'boss_rush',
  'endless',
  'overheat_fury',
  'iron_fortress',
  'tactical_tycoon',
  'chaos_swarm',
];

export const GAME_MODE_CONFIGS: Record<GameModeId, GameModeConfig> = {
  campaign: {
    id: 'campaign',
    label: 'Chiến Dịch',
    shortLabel: 'CHIẾN DỊCH',
    badgeColor: '#38BDF8',
    description: '16–39 đợt chuẩn chiến thuật · Thời lượng x2 để phát triển đội hình Lv10 & súng đặc quyền',
    waveCountMult: 1.0,
    spawnRateMult: 0.94,
    speedMult: 0.95,
    startEnergyMult: 1.08,
    coreHpMult: 1.0,
    hpMult: 1.0,
    shieldMult: 1.0,
    swarmCountMult: 1.0,
    heatMult: 1.0,
    rewardMult: 1.05,
    scoreMult: 1.0,
    waveDelaySec: 8,
  },
  blitz: {
    id: 'blitz',
    label: 'Bão Tốc Độ',
    shortLabel: 'BLITZ',
    badgeColor: '#F59E0B',
    description: 'Ít đợt hơn (-35%) nhưng quái dồn dập +12% tốc độ & +28% thưởng năng lượng',
    waveCountMult: 0.65,
    spawnRateMult: 1.44,
    speedMult: 1.12,
    startEnergyMult: 1.35,
    coreHpMult: 1.0,
    hpMult: 0.96,
    shieldMult: 1.0,
    swarmCountMult: 1.16,
    heatMult: 1.1,
    rewardMult: 1.28,
    scoreMult: 1.35,
    waveDelaySec: 4,
  },
  boss_rush: {
    id: 'boss_rush',
    label: 'Săn Boss',
    shortLabel: 'BOSS RUSH',
    badgeColor: '#F43F5E',
    description: '+135% năng lượng khởi đầu · Boss & Tinh Anh xuất trận ngay từ Đợt 1',
    waveCountMult: 0.6,
    spawnRateMult: 0.85,
    speedMult: 0.9,
    startEnergyMult: 2.35,
    coreHpMult: 1.05,
    hpMult: 1.0,
    shieldMult: 1.0,
    swarmCountMult: 1.0,
    heatMult: 1.15,
    rewardMult: 1.4,
    scoreMult: 1.65,
    waveDelaySec: 9,
  },
  endless: {
    id: 'endless',
    label: 'Vô Tận',
    shortLabel: 'ENDLESS ∞',
    badgeColor: '#A855F7',
    description: 'Không giới hạn đợt · Leo tháp vô tận & cày kỷ lục sát thương',
    waveCountMult: 1.0,
    spawnRateMult: 0.98,
    speedMult: 0.96,
    startEnergyMult: 1.2,
    coreHpMult: 1.05,
    hpMult: 1.0,
    shieldMult: 1.0,
    swarmCountMult: 1.0,
    heatMult: 1.0,
    rewardMult: 1.06,
    scoreMult: 1.3,
    waveDelaySec: 7,
  },
  overheat_fury: {
    id: 'overheat_fury',
    label: 'Cuồng Nhiệt',
    shortLabel: 'QUÁ NHIỆT ×2',
    badgeColor: '#FB7185',
    description: 'Nhiệt súng tích tụ ×2.2 siêu nhanh · Kích nổ Kỹ Năng Quá Nhiệt liên hoàn, quái +15% HP',
    waveCountMult: 1.0,
    spawnRateMult: 1.06,
    speedMult: 0.98,
    startEnergyMult: 1.2,
    coreHpMult: 1.0,
    hpMult: 1.15,
    shieldMult: 1.1,
    swarmCountMult: 1.05,
    heatMult: 2.2,
    rewardMult: 1.1,
    scoreMult: 1.45,
    waveDelaySec: 7,
  },
  iron_fortress: {
    id: 'iron_fortress',
    label: 'Tử Thủ Lõi',
    shortLabel: 'PHÁO ĐÀI THÉP',
    badgeColor: '#10B981',
    description: '+50% máu Lõi Pháo Đài & +45% vốn khởi đầu · Đối đầu đội hình Giáp & Khiên +22%',
    waveCountMult: 1.1,
    spawnRateMult: 0.95,
    speedMult: 0.92,
    startEnergyMult: 1.45,
    coreHpMult: 1.5,
    hpMult: 1.12,
    shieldMult: 1.22,
    swarmCountMult: 1.0,
    heatMult: 1.0,
    rewardMult: 1.12,
    scoreMult: 1.4,
    waveDelaySec: 8,
  },
  tactical_tycoon: {
    id: 'tactical_tycoon',
    label: 'Đại Gia Vũ Khí',
    shortLabel: 'TYCOON ⚡',
    badgeColor: '#FACC15',
    description: '+85% vốn khởi đầu & +35% xu hạ quái để nâng dàn súng Lv10 sớm · Quái đông +25%',
    waveCountMult: 1.0,
    spawnRateMult: 1.15,
    speedMult: 1.0,
    startEnergyMult: 1.85,
    coreHpMult: 1.0,
    hpMult: 1.18,
    shieldMult: 1.12,
    swarmCountMult: 1.25,
    heatMult: 1.15,
    rewardMult: 1.35,
    scoreMult: 1.5,
    waveDelaySec: 7,
  },
  chaos_swarm: {
    id: 'chaos_swarm',
    label: 'Biển Quái',
    shortLabel: 'SWARM +45%',
    badgeColor: '#22D3EE',
    description: 'Quân số đông gấp +45% & tràn ra liên tục · Phần thưởng hạ quái & sóng +24%',
    waveCountMult: 0.95,
    spawnRateMult: 1.38,
    speedMult: 1.06,
    startEnergyMult: 1.3,
    coreHpMult: 1.1,
    hpMult: 0.94,
    shieldMult: 0.96,
    swarmCountMult: 1.45,
    heatMult: 1.25,
    rewardMult: 1.24,
    scoreMult: 1.55,
    waveDelaySec: 6,
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
  const baseWaves = map.totalWaves + cfg.extraWaves * 2;
  return {
    totalWaves: Math.max(8, Math.round(baseWaves * modeCfg.waveCountMult)),
    startEnergy: Math.round((map.startEnergy * cfg.startEnergyMult * modeCfg.startEnergyMult) / 5) * 5,
    startCoreHp: Math.max(10, Math.round(map.startCoreHp * cfg.coreHpMult * (modeCfg.coreHpMult ?? 1))),
  };
}

export interface GunSkillMilestone {
  readonly level: 3 | 5 | 7 | 10;
  readonly name: string;
  readonly summary: string;
}

export interface GunVariantSpec {
  readonly id: GunVariant;
  readonly name: string;
  readonly shortTag: string;
  readonly summary: string;
  readonly accentColor: string;
  readonly damageMult: number;
  readonly rofMult: number;
  readonly rangeBonus: number;
  readonly splashBonus: number;
  readonly armorPierceBonus: number;
  readonly shieldMultBonus: number;
  readonly extraProjectiles: number;
  readonly extraChain: number;
}

export interface OverheatSkillMeta {
  readonly key: string;
  readonly name: string;
  readonly color: string;
  readonly summary: string;
  readonly heatPerShot: number;
}

export interface GunCatalogItem {
  readonly type: GunType;
  readonly exclusiveMapId?: string;
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
  readonly variants: Record<GunVariant, GunVariantSpec>;
  readonly overheatSkill: OverheatSkillMeta;
}

export interface PlacedGun {
  id: string;
  col: number;
  row: number;
  type: GunType;
  level: number; // 1..10
  variant?: GunVariant;
  priority: TargetPriority;
  chargeTimer: number;
  heat?: number; // 0..100
  overheatTimer?: number; // active signature surge timer
  aimAngle: number;
  recoil: number;
  totalDamageDealt: number;
  kills: number;
}

export interface GunCombatProfile {
  readonly level: number;
  readonly variant: GunVariant;
  readonly variantSpec: GunVariantSpec;
  readonly overheatSkill: OverheatSkillMeta;
  readonly accentColor: string;
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
  kind:
    | 'bullet'
    | 'pellet'
    | 'missile'
    | 'mortar'
    | 'bomblet'
    | 'acid'
    | 'sawblade'
    | 'cannon'
    | 'plasma'
    | 'cluster'
    | 'hunter'
    | 'tempest_orb'
    | 'sonic_wave'
    | 'lance'
    | 'cyber_bolt'
    | 'magma_glob'
    | 'katana_blade'
    | 'dune_needle'
    | 'flak_shell'
    | 'hydra_fang'
    | 'cryo_spike'
    | 'hell_rocket'
    | 'shadow_drone'
    | 'omega_pulse'
    | 'reaper_disc'
    | 'sovereign_orb';
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
  age?: number;
  destX?: number;
  destY?: number;
  speed: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
  spawnCluster?: boolean;
  isClusterBomblet?: boolean;
  trail?: { x: number; y: number }[];
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
  variant?:
    | 'railgun'
    | 'sniper'
    | 'prism_laser'
    | 'gravity_lance'
    | 'aurora_beam'
    | 'meteor_rail'
    | 'omega_beam'
    | 'sovereign_beam';
}

export interface FlameConeFx {
  x: number;
  y: number;
  angle: number;
  range: number;
  halfArc: number;
  alpha: number;
  visualTier: 1 | 2 | 3 | 4;
  isNova360?: boolean;
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

export const GRID_COLS = 16;
export const GRID_ROWS = 10;
export const TILE_SIZE = 56;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 896
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 560
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
    baseDamage: 13,
    baseCooldown: 0.24,
    rangeTiles: 2.7,
    milestones: [
      { level: 3, name: 'Đạn Xuyên Giáp AP', summary: 'Xuyên 35% giáp Thiết Giáp' },
      { level: 5, name: 'Nòng Kép Song Song', summary: 'Bắn đồng thời 2 luồng đạn liên hoàn' },
      { level: 7, name: 'Đầu Đạn Nổ Mảnh', summary: '3 luồng đạn + nổ lan vùng nhỏ 22px' },
      { level: 10, name: 'Bão Đạn Huyền Thoại', summary: '4 nòng Hyper-Plasma + xuyên 75% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Siêu Thanh Xoay',
        shortTag: 'α Xoay',
        summary: 'Tốc độ bắn +18%, giữ nhịp ổn định tầm trung',
        accentColor: '#38BDF8',
        damageMult: 0.94,
        rofMult: 1.18,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hợp Kim Tungsten',
        shortTag: 'ω Tungsten',
        summary: 'Đầu đạn nặng +28% sát thương & +15% xuyên giáp',
        accentColor: '#F59E0B',
        damageMult: 1.28,
        rofMult: 0.88,
        rangeBonus: 0.25,
        splashBonus: 8,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'supersonic_fan',
      name: 'Mưa Đạn Siêu Thanh 7 Luồng',
      color: '#FDE047',
      heatPerShot: 6.5,
      summary: 'Quá nhiệt xả quạt 7 tia đạn xuyên phá + vỏ đồng văng rực lửa',
    },
  },
  {
    type: 'shotgun',
    hotkey: '2',
    name: 'Pháo Chùm Shrapnel',
    shortName: 'Shrapnel',
    roleClue: 'Đạn chùm cận chiến',
    accentColor: '#FB923C',
    cost: 70,
    baseDamage: 12,
    baseCooldown: 0.96,
    rangeTiles: 2.15,
    milestones: [
      { level: 3, name: 'Băng Đạn Mở Rộng', summary: 'Tăng lên 6 mảnh đạn mỗi loạt' },
      { level: 5, name: 'Mảnh Đạn Tungsten Cháy', summary: 'Đốt cháy mục tiêu + xuyên 32% giáp' },
      { level: 7, name: 'Xuyên Phá Quần Địch', summary: '7 mảnh đạn xuyên thêm 1 mục tiêu' },
      { level: 10, name: 'Pháo Bão Thép Tối Thượng', summary: '9 mảnh đạn xuyên phá + đốt cháy DoT' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bão Mảnh Rộng',
        shortTag: 'α Rộng',
        summary: '+2 mảnh đạn mỗi loạt, quét bầy đông cực tốt',
        accentColor: '#FB923C',
        damageMult: 0.96,
        rofMult: 1.06,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 2,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đạn Nhiệt Long Tức',
        shortTag: 'ω Nhiệt',
        summary: '+24% sát thương cận chiến & +0.35 tầm bắn',
        accentColor: '#EF4444',
        damageMult: 1.24,
        rofMult: 0.96,
        rangeBonus: 0.35,
        splashBonus: 0,
        armorPierceBonus: 0.14,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'thermal_buckshot_ring',
      name: 'Sóng Nhiệt Phân Mảnh 360°',
      color: '#FB7185',
      heatPerShot: 18,
      summary: 'Kích nổ vòng 16 mảnh nhiệt 360° đốt cháy toàn bộ địch cận chiến',
    },
  },
  {
    type: 'flamer',
    hotkey: '3',
    name: 'Pháo Phun Lửa',
    shortName: 'Phun Lửa',
    roleClue: 'Thiêu đốt & tan giáp',
    accentColor: '#F97316',
    cost: 75,
    baseDamage: 15,
    baseCooldown: 0.42,
    rangeTiles: 2.25,
    milestones: [
      { level: 3, name: 'Xăng Đặc Cháy Lâu', summary: 'Tăng sát thương cháy DoT theo giây' },
      { level: 5, name: 'Axit Nhiệt Tan Giáp', summary: 'Bào mòn 25% giáp kẻ địch trúng lửa' },
      { level: 7, name: 'Ngọn Lửa Plasma Xanh', summary: 'Tầm phun rộng hơn + làm chậm -18%' },
      { level: 10, name: 'Vòng Lửa Hủy Diệt 360°', summary: 'Phóng vòng lửa thiêu đốt toàn vùng quanh tháp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bão Lửa Napalm',
        shortTag: 'α Napalm',
        summary: 'Phun nhanh hơn +14% và tỏa lửa rộng',
        accentColor: '#F97316',
        damageMult: 0.95,
        rofMult: 1.14,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Plasma Xanh Lam',
        shortTag: 'ω Lam Nhiệt',
        summary: 'Ngọn lửa xanh +25% sát thương & +25% phá khiên',
        accentColor: '#38BDF8',
        damageMult: 1.25,
        rofMult: 0.92,
        rangeBonus: 0.3,
        splashBonus: 0,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'phoenix_cyclone',
      name: 'Vòi Rồng Phượng Hoàng',
      color: '#F97316',
      heatPerShot: 11,
      summary: 'Triệu hồi 2 xoáy lửa phượng hoàng quét xoắn ốc đốt tan giáp',
    },
  },
  {
    type: 'cryo',
    hotkey: '4',
    name: 'Tháp Băng Cryo',
    shortName: 'Băng Cryo',
    roleClue: 'Làm chậm + tăng sát thương',
    accentColor: '#67E8F9',
    cost: 70,
    baseDamage: 15,
    baseCooldown: 1.45,
    rangeTiles: 2.55,
    milestones: [
      { level: 3, name: 'Sương Giá Thấu Xương', summary: 'Làm chậm -32% tốc chạy & xóa tàng hình' },
      { level: 5, name: 'Hiệu Ứng Giòn Vỡ', summary: 'Quái nhiễm lạnh chịu thêm +15% mọi sát thương' },
      { level: 7, name: 'Bão Sương Giá Sâu', summary: 'Làm chậm -38% tốc chạy & tăng sát thương sương' },
      { level: 10, name: 'Tuyệt Đối Không Độ', summary: 'Làm chậm tối đa -44% & +24% Giòn Vỡ diện rộng' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Trường Sương Vô Cực',
        shortTag: 'α Trường Băng',
        summary: 'Mở rộng vùng sương +0.45 ô phủ nhiều đường',
        accentColor: '#67E8F9',
        damageMult: 0.92,
        rofMult: 1.05,
        rangeBonus: 0.45,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Búa Tinh Thể Nứt',
        shortTag: 'ω Tinh Thể',
        summary: '+34% sát thương băng & +20% phá khiên',
        accentColor: '#A5F3FC',
        damageMult: 1.34,
        rofMult: 0.94,
        rangeBonus: 0.1,
        splashBonus: 0,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'hex_frost_nova',
      name: 'Bão Tinh Thể Lục Giác',
      color: '#BAE6FD',
      heatPerShot: 25,
      summary: 'Bùng nổ mạng tinh thể băng lục giác khắc ấn Giòn Vỡ cực đại',
    },
  },
  {
    type: 'tesla',
    hotkey: '5',
    name: 'Tháp Sét Tesla',
    shortName: 'Sét Tesla',
    roleClue: 'Sét chuỗi phá khiên',
    accentColor: '#60A5FA',
    cost: 85,
    baseDamage: 26,
    baseCooldown: 1.05,
    rangeTiles: 2.6,
    milestones: [
      { level: 3, name: 'Cao Thế Dây Chuyền', summary: 'Sét giật lan tới 4 mục tiêu liên tiếp' },
      { level: 5, name: 'Xung EMP Phá Khiên', summary: 'Gây 165% sát thương lên Khiên Năng Lượng' },
      { level: 7, name: 'Đoản Mạch Ngắt Chiêu', summary: 'Ngắt chiêu đặc biệt & làm chậm nhịp 0.25s' },
      { level: 10, name: 'Bão Sấm Thiên Lôi', summary: 'Giật 7 mục tiêu + Thiên Lôi nổ vùng 38px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Dây Chuyền Cao Thế',
        shortTag: 'α Đa Mạch',
        summary: '+2 nhánh sét giật lan & tốc độ nạp +10%',
        accentColor: '#60A5FA',
        damageMult: 0.92,
        rofMult: 1.1,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Thiên Lôi Phá Khiên',
        shortTag: 'ω Thiên Lôi',
        summary: '+26% sát thương sét & +45% phá khiên EMP',
        accentColor: '#FDE047',
        damageMult: 1.26,
        rofMult: 0.94,
        rangeBonus: 0.15,
        splashBonus: 16,
        armorPierceBonus: 0.1,
        shieldMultBonus: 0.45,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'sky_thunder_web',
      name: 'Lưới Sét Thiên Lôi',
      color: '#38BDF8',
      heatPerShot: 20,
      summary: 'Giăng mạng lưới sét 6 điểm nối giật điện và làm choáng bầy địch',
    },
  },
  {
    type: 'missile',
    hotkey: '6',
    name: 'Tên Lửa Hành Trình',
    shortName: 'Tên Lửa',
    roleClue: 'Đuổi mục tiêu nổ chùm',
    accentColor: '#FB7185',
    cost: 100,
    baseDamage: 50,
    baseCooldown: 1.48,
    rangeTiles: 3.9,
    milestones: [
      { level: 3, name: 'Đầu Đạn Nổ Rộng', summary: 'Bán kính nổ tăng lên 84px' },
      { level: 5, name: 'Bệ Phóng Kép', summary: 'Phóng 2 tên lửa dẫn đường cùng lúc' },
      { level: 7, name: 'Bom Chùm Cluster', summary: 'Mỗi tên lửa nổ tách thêm 2 đầu đạn phụ' },
      { level: 10, name: 'Bão Tên Lửa 3 Nòng', summary: 'Bắn loạt 3 tên lửa + bom chùm 112px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bầy Tên Lửa',
        shortTag: 'α Bầy Đàn',
        summary: '+1 tên lửa mỗi loạt, truy đuổi đa mục tiêu',
        accentColor: '#FB7185',
        damageMult: 0.92,
        rofMult: 1.05,
        rangeBonus: 0.25,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đầu Đạn Nhiệt Hạch',
        shortTag: 'ω Nhiệt Hạch',
        summary: '+28% sát thương & +24px vùng nổ chấn động',
        accentColor: '#F43F5E',
        damageMult: 1.28,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 24,
        armorPierceBonus: 0.14,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'swarm_barrage',
      name: 'Oanh Tạc Bầy Đàn 6 Quả',
      color: '#FB7185',
      heatPerShot: 22,
      summary: 'Phóng 6 tên lửa dẫn đường vệt khói rực rỡ đánh chặn toàn tuyến',
    },
  },
  {
    type: 'railgun',
    hotkey: '7',
    name: 'Pháo Railgun Từ Trường',
    shortName: 'Railgun',
    roleClue: 'Tia xuyên thẳng săn Boss',
    accentColor: '#C084FC',
    cost: 125,
    baseDamage: 92,
    baseCooldown: 2.1,
    rangeTiles: 5.2,
    milestones: [
      { level: 3, name: 'Đạn Siêu Thanh AP', summary: 'Xuyên 85% giáp + tăng tốc độ nạp' },
      { level: 5, name: 'Tia Xung Kích Kép', summary: 'Bắn tia đôi phá 175% khiên năng lượng' },
      { level: 7, name: 'Kích Nổ Quỹ Đạo', summary: 'Mỗi quái bị xuyên qua phát nổ sóng chấn động' },
      { level: 10, name: 'Pháo Quỹ Đạo Thiên Thạch', summary: '3 tia xuyên 100% giáp + chí mạng Boss' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Tụ Điện Tốc Độ',
        shortTag: 'α Tốc Nạp',
        summary: 'Nạp tụ điện nhanh hơn +18% & +0.4 tầm bắn',
        accentColor: '#C084FC',
        damageMult: 0.96,
        rofMult: 1.18,
        rangeBonus: 0.4,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đại Pháo Vệ Tinh',
        shortTag: 'ω Quỹ Đạo',
        summary: '+26% sát thương xuyên thấu & +18px kích nổ',
        accentColor: '#FDE047',
        damageMult: 1.26,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 18,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'quantum_hyperbeam',
      name: 'Đại Hồng Thủy Lượng Tử',
      color: '#E879F9',
      heatPerShot: 25,
      summary: 'Bắn chùm siêu lượng tử 3 lõi kèm 5 vòng Mach xuyên toàn bản đồ',
    },
  },
  {
    type: 'mortar',
    hotkey: '8',
    name: 'Pháo Cối Hố Đen',
    shortName: 'Hố Đen',
    roleClue: 'Hút gom quái & nổ vùng',
    accentColor: '#A855F7',
    cost: 115,
    baseDamage: 78,
    baseCooldown: 2.35,
    rangeTiles: 4.5,
    milestones: [
      { level: 3, name: 'Lực Hút Trọng Lực', summary: 'Kéo gom quái thường vào tâm vụ nổ' },
      { level: 5, name: 'Chấn Động Kép', summary: 'Làm chậm -30% & đốt cháy giáp quanh tâm' },
      { level: 7, name: 'Dư Chấn Hư Không', summary: 'Bán kính nổ lớn 110px + lực hút ổn định' },
      { level: 10, name: 'Siêu Tân Tinh Hư Không', summary: 'Phóng 2 quả cầu hố đen + nổ vùng 122px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Dị Điểm Hút Gom',
        shortTag: 'α Hút Gom',
        summary: '+24px vùng ảnh hưởng & tốc bắn +12%',
        accentColor: '#A855F7',
        damageMult: 0.96,
        rofMult: 1.12,
        rangeBonus: 0.25,
        splashBonus: 24,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sụp Đổ Trọng Lực',
        shortTag: 'ω Hủy Diệt',
        summary: '+26% sát thương nổ tâm & +15% xuyên giáp',
        accentColor: '#C084FC',
        damageMult: 1.26,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 10,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'reverse_singularity',
      name: 'Hố Đen Đảo Ngược',
      color: '#9333EA',
      heatPerShot: 25,
      summary: 'Mở đĩa bồi tụ hút xoáy dồn quái rồi kích nổ sụp đổ trọng lực',
    },
  },
  {
    type: 'sniper',
    hotkey: '9',
    name: 'Pháo Bắn Tỉa Chí Mạng',
    shortName: 'Bắn Tỉa',
    roleClue: 'Tầm cực xa · Chí mạng săn Boss',
    accentColor: '#34D399',
    cost: 95,
    baseDamage: 70,
    baseCooldown: 1.78,
    rangeTiles: 5.6,
    milestones: [
      { level: 3, name: 'Đạn Xuyên Giáp 75%', summary: 'Xuyên 75% giáp & phá 135% khiên' },
      { level: 5, name: 'Chí Mạng Tử Thần', summary: '35% tỉ lệ chí mạng ×1.75 sát thương' },
      { level: 7, name: 'Ám Sát Chỉ Huy', summary: '+25% sát thương lên Boss, Healer & Tinh Anh' },
      { level: 10, name: 'Họng Súng Thần Chết', summary: 'Bắn 2 phát · Chí mạng ×2.0 & 100% xuyên giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Xạ Thủ Liên Hoàn',
        shortTag: 'α Cơ Động',
        summary: 'Tốc độ lên đạn +18% & +0.5 ô tầm ngắm',
        accentColor: '#34D399',
        damageMult: 0.94,
        rofMult: 1.18,
        rangeBonus: 0.5,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Ám Sát Phá Giáp',
        shortTag: 'ω Hành Quyết',
        summary: '+28% sát thương phát bắn & +20% xuyên giáp',
        accentColor: '#FDE047',
        damageMult: 1.28,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'crimson_execution',
      name: 'Tử Hình Xuyên Tâm 3 Tia',
      color: '#F43F5E',
      heatPerShot: 24,
      summary: 'Khóa laser đỏ vào 3 Boss/Tinh Anh mạnh nhất và chí mạng ×2.4',
    },
  },
  {
    type: 'acid',
    hotkey: '0',
    name: 'Súng Phóng Axit',
    shortName: 'Axit',
    roleClue: 'Vũng axit bào giáp & làm chậm',
    accentColor: '#A3E635',
    cost: 80,
    baseDamage: 22,
    baseCooldown: 1.2,
    rangeTiles: 2.85,
    milestones: [
      { level: 3, name: 'Vũng Axit Đậm Đặc', summary: 'Bào mòn 32% giáp vĩnh viễn khi dẫm vũng' },
      { level: 5, name: 'Dung Dịch Kéo Dài', summary: 'Vũng axit rộng 64px, tồn tại 3.8s & chậm -26%' },
      { level: 7, name: 'Phản Ứng Dây Chuyền', summary: 'Bắn 2 quả cầu axit cùng lúc bao phủ khúc cua' },
      { level: 10, name: 'Biển Axit Hủy Diệt', summary: 'Bào mòn 50% giáp + làm chậm -34% & đốt DoT' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Phủ Vũng Diện Rộng',
        shortTag: 'α Vũng Rộng',
        summary: 'Vũng axit +18px rộng hơn & tốc bắn +12%',
        accentColor: '#A3E635',
        damageMult: 0.95,
        rofMult: 1.12,
        rangeBonus: 0.25,
        splashBonus: 18,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Độc Tố Ăn Mòn Cực Mạnh',
        shortTag: 'ω Đậm Đặc',
        summary: '+28% sát thương ăn mòn & +15% xuyên giáp',
        accentColor: '#84CC16',
        damageMult: 1.28,
        rofMult: 0.93,
        rangeBonus: 0.15,
        splashBonus: 6,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'boiling_acid_rain',
      name: 'Mưa Axit Sôi Sục',
      color: '#BEF264',
      heatPerShot: 20,
      summary: 'Ném 3 bình hóa chất tạo biển axit sủi bọt bào mòn 55% giáp',
    },
  },
  {
    type: 'saw',
    hotkey: 'q',
    name: 'Máy Cưa Đĩa Nảy',
    shortName: 'Cưa Đĩa',
    roleClue: 'Đĩa cưa nảy bầy + rỉa máu',
    accentColor: '#F43F5E',
    cost: 85,
    baseDamage: 30,
    baseCooldown: 1.28,
    rangeTiles: 3.0,
    milestones: [
      { level: 3, name: 'Lưỡi Thép Hợp Kim', summary: 'Lưỡi cưa nảy qua tối đa 4 kẻ địch liên tiếp' },
      { level: 5, name: 'Răng Cưa Gây Xuất Huyết', summary: 'Gây hiệu ứng chảy máu & xuyên 52% giáp' },
      { level: 7, name: 'Song Đĩa Hủy Diệt', summary: 'Phóng 2 đĩa cưa cùng lúc, nảy tối đa 5 mục tiêu' },
      { level: 10, name: 'Bão Cưa Plasma Đỏ', summary: '3 đĩa cưa siêu tốc nảy 7 mục tiêu' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Cưa Nảy Liên Hoàn',
        shortTag: 'α Siêu Nảy',
        summary: '+2 lần nảy thêm giữa đám đông & +10% tốc bắn',
        accentColor: '#F43F5E',
        damageMult: 0.94,
        rofMult: 1.1,
        rangeBonus: 0.25,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lưỡi Cưa Plasma',
        shortTag: 'ω Plasma',
        summary: '+25% sát thương cắt sâu & +16% xuyên giáp',
        accentColor: '#FB7185',
        damageMult: 1.25,
        rofMult: 0.94,
        rangeBonus: 0.15,
        splashBonus: 0,
        armorPierceBonus: 0.16,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'ricochet_sawstorm',
      name: 'Lốc Đĩa Cưa Phản Xạ',
      color: '#FDA4AF',
      heatPerShot: 20,
      summary: 'Phóng 4 đại đĩa cưa vàng rực nảy điên cuồng tóe tia lửa',
    },
  },
  {
    type: 'beacon',
    hotkey: 'e',
    name: 'Tháp Cộng Hưởng',
    shortName: 'Cộng Hưởng',
    roleClue: 'Buff tốc bắn & sát thương cho súng lân cận',
    accentColor: '#FACC15',
    cost: 90,
    baseDamage: 18,
    baseCooldown: 1.65,
    rangeTiles: 2.6,
    milestones: [
      { level: 3, name: 'Trường Tăng Tốc +14%', summary: 'Súng trong tầm nhận +14% tốc bắn & +10% sát thương' },
      { level: 5, name: 'Xung Sóng Cộng Hưởng', summary: 'Sóng xung kích gây sát thương vùng + làm chậm nhẹ' },
      { level: 7, name: 'Trường Overclock +22%', summary: 'Tăng +22% tốc bắn & +16% sát thương đồng minh' },
      { level: 10, name: 'Lõi Thái Dương Tối Thượng', summary: '+30% tốc bắn & +24% sát thương quanh tháp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Vùng Phủ Đồng Minh',
        shortTag: 'α Hào Quang',
        summary: '+0.45 ô bán kính cộng hưởng cho nhiều trụ súng hơn',
        accentColor: '#FACC15',
        damageMult: 0.95,
        rofMult: 1.08,
        rangeBonus: 0.45,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Tia Thái Dương Đốt',
        shortTag: 'ω Thái Dương',
        summary: '+32% sát thương xung kích & +25% phá khiên',
        accentColor: '#FEF08A',
        damageMult: 1.32,
        rofMult: 1.04,
        rangeBonus: 0.1,
        splashBonus: 0,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'solar_flare_pulse',
      name: 'Xung Thái Dương Vàng',
      color: '#FDE047',
      heatPerShot: 25,
      summary: 'Bắn 12 tia hào quang vàng tản nhiệt cho đồng minh + tặng +8⚡',
    },
  },
  {
    type: 'cannon',
    hotkey: 'z',
    name: 'Pháo Nặng Titan',
    shortName: 'Pháo Nặng',
    roleClue: 'Đạn xuyên phá & ngắt chiêu nặng',
    accentColor: '#F59E0B',
    cost: 110,
    baseDamage: 74,
    baseCooldown: 1.95,
    rangeTiles: 3.6,
    milestones: [
      { level: 3, name: 'Đạn Phá Thành 65%', summary: 'Xuyên 65% giáp & nổ sóng xung kích 48px' },
      { level: 5, name: 'Chấn Động Ngắt Chiêu', summary: 'Ngắt chiêu + choáng chậm 0.35s & nổ lan 62px' },
      { level: 7, name: 'Pháo Hạm Nòng Kép', summary: 'Bắn 2 quả đại bác xuyên giáp liên tiếp' },
      { level: 10, name: 'Đại Bác Titan Hủy Diệt', summary: '3 quả đại bác xuyên 90% giáp + choáng chậm 0.45s & nổ 82px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Pháo Hạm Liên Hoàn',
        shortTag: 'α Nòng Đôi',
        summary: 'Nạp pháo nhanh hơn +16% & +0.3 ô tầm',
        accentColor: '#F59E0B',
        damageMult: 0.94,
        rofMult: 1.16,
        rangeBonus: 0.3,
        splashBonus: 6,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Công Thành Hố Nổ',
        shortTag: 'ω Địa Chấn',
        summary: '+26% sát thương & +22px nổ địa chấn ngắt chiêu',
        accentColor: '#FB923C',
        damageMult: 1.26,
        rofMult: 0.9,
        rangeBonus: 0.1,
        splashBonus: 22,
        armorPierceBonus: 0.14,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'titan_artillery_salvo',
      name: 'Loạt Đại Bác Titan',
      color: '#F59E0B',
      heatPerShot: 25,
      summary: 'Dội 4 phát đại bác địa chấn để lại hố bom cháy xém & ngắt chiêu',
    },
  },
  {
    type: 'plasma',
    hotkey: 'x',
    name: 'Súng Plasma Xoáy',
    shortName: 'Plasma',
    roleClue: 'Cầu plasma phá khiên & thiêu đốt',
    accentColor: '#EC4899',
    cost: 95,
    baseDamage: 28,
    baseCooldown: 0.74,
    rangeTiles: 3.0,
    milestones: [
      { level: 3, name: 'Lõi Plasma Phá Khiên', summary: '155% sát thương lên khiên + đốt cháy kẻ địch' },
      { level: 5, name: 'Quả Cầu Nổ Xoáy', summary: 'Nổ plasma 52px & hút nhẹ mục tiêu thường' },
      { level: 7, name: 'Bão Plasma Kép', summary: 'Phóng 2 cầu plasma hồng tốc độ cao cùng lúc' },
      { level: 10, name: 'Hạch Nhân Plasma Hồng', summary: '3 cầu plasma + 195% phá khiên + nổ 72px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Xung Plasma Liên Tục',
        shortTag: 'α Liên Xung',
        summary: 'Tốc phóng +16% & +0.25 tầm bắn',
        accentColor: '#EC4899',
        damageMult: 0.95,
        rofMult: 1.16,
        rangeBonus: 0.25,
        splashBonus: 4,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Tinh Vân Hủy Khiên',
        shortTag: 'ω Tinh Vân',
        summary: '+24% sát thương & +45% phá khiên năng lượng',
        accentColor: '#F472B6',
        damageMult: 1.24,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 16,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.45,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'plasma_supernova',
      name: 'Siêu Tân Tinh Plasma',
      color: '#F472B6',
      heatPerShot: 14,
      summary: 'Giải phóng 2 ngôi sao plasma đôi xóa sạch khiên & phát nổ dây chuyền',
    },
  },
  {
    type: 'cluster',
    hotkey: 'c',
    name: 'Pháo Cối Bom Bi',
    shortName: 'Bom Bi',
    roleClue: 'Rải bom bi phủ kín đường đi',
    accentColor: '#10B981',
    cost: 105,
    baseDamage: 46,
    baseCooldown: 1.65,
    rangeTiles: 4.1,
    milestones: [
      { level: 3, name: 'Mưa Bom Bi 4 Mảnh', summary: 'Phát nổ rải 4 bom bi thứ cấp phủ vùng 72px' },
      { level: 5, name: 'Bom Napalm Diện Rộng', summary: 'Thiêu đốt DoT các mục tiêu trong bán kính' },
      { level: 7, name: 'Bệ Phóng Cối Đôi', summary: 'Bắn 2 quả cối rải thảm bom bi mỗi lượt' },
      { level: 10, name: 'Oanh Tạc Thảm Xanh', summary: '3 quả cối + nổ 102px + bào 30% giáp vùng' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Mưa Bom Phủ Thảm',
        shortTag: 'α Phủ Rộng',
        summary: '+18px bán kính nổ thảm & +12% tốc bắn',
        accentColor: '#10B981',
        damageMult: 0.95,
        rofMult: 1.12,
        rangeBonus: 0.2,
        splashBonus: 18,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Napalm Phá Giáp',
        shortTag: 'ω Napalm',
        summary: '+26% sát thương bom & +18% xuyên giáp',
        accentColor: '#34D399',
        damageMult: 1.26,
        rofMult: 0.92,
        rangeBonus: 0.25,
        splashBonus: 8,
        armorPierceBonus: 0.18,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'tactical_carpet_bomb',
      name: 'Thảm Bom Chiến Thuật 10 Quả',
      color: '#34D399',
      heatPerShot: 22,
      summary: 'Rải thảm 10 trái bom bi lục bảo nổ liên hoàn khắp mặt đường',
    },
  },
  {
    type: 'hunter',
    hotkey: 'v',
    name: 'Súng Săn Drone Tự Hành',
    shortName: 'Săn Drone',
    roleClue: 'Tên lửa mini tầm xa khắc chế Tàng Hình & Nhảy Pha',
    accentColor: '#22D3EE',
    cost: 90,
    baseDamage: 25,
    baseCooldown: 0.84,
    rangeTiles: 4.6,
    milestones: [
      { level: 3, name: 'Radar Phá Tàng Hình', summary: 'Bắn 2 tên lửa mini dẫn đường + 145% phá khiên' },
      { level: 5, name: 'Đạn Đuổi Chí Mạng', summary: '+22% sát thương lên Tàng Hình, Nhảy Pha & Tàu Mẹ' },
      { level: 7, name: 'Bầy Ong 3 Nòng', summary: 'Phóng 3 tên lửa truy đuổi mục tiêu liên hoàn' },
      { level: 10, name: 'Quần Đàn Hunter V10', summary: '4 tên lửa truy đuổi + xuyên 85% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bầy Ong Truy Đuổi',
        shortTag: 'α Bầy Ong',
        summary: '+1 drone phóng mỗi đợt & +0.4 ô tầm radar',
        accentColor: '#22D3EE',
        damageMult: 0.92,
        rofMult: 1.06,
        rangeBonus: 0.4,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sát Thủ Lõi Đạn Đạo',
        shortTag: 'ω Sát Thủ',
        summary: '+26% sát thương mỗi drone & +15% xuyên giáp',
        accentColor: '#38BDF8',
        damageMult: 1.26,
        rofMult: 0.94,
        rangeBonus: 0.2,
        splashBonus: 10,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'interceptor_drone_pack',
      name: 'Bầy Drone Săn Mồi',
      color: '#22D3EE',
      heatPerShot: 14,
      summary: 'Triển khai 6 drone đánh chặn truy sát Tàng Hình, Hồi Máu & Nhảy Pha',
    },
  },
  {
    type: 'prism_laser',
    hotkey: 'b',
    name: 'Lăng Kính Hội Tụ',
    shortName: 'Lăng Kính',
    roleClue: 'Tia laser khúc xạ chia nhánh đa mục tiêu',
    accentColor: '#E879F9',
    cost: 115,
    baseDamage: 40,
    baseCooldown: 0.92,
    rangeTiles: 3.7,
    milestones: [
      { level: 3, name: 'Khúc Xạ 2 Nhánh', summary: 'Tia chính tách thêm 2 tia khúc xạ sang mục tiêu kế' },
      { level: 5, name: 'Lõi Pha Lê Cháy Giáp', summary: 'Đốt cháy mục tiêu + 150% phá khiên năng lượng' },
      { level: 7, name: 'Quang Phổ 4 Tia', summary: 'Khúc xạ tối đa 4 tia laser cầu vồng cùng lúc' },
      { level: 10, name: 'Hào Quang Kim Cương V10', summary: '6 tia khúc xạ xuyên 90% giáp & nổ quang học' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Phản Chiếu Đa Tầng',
        shortTag: 'α Đa Tia',
        summary: '+2 nhánh tia khúc xạ lan truyền liên hoàn',
        accentColor: '#E879F9',
        damageMult: 0.94,
        rofMult: 1.08,
        rangeBonus: 0.3,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hội Tụ Tia Hủy Diệt',
        shortTag: 'ω Hội Tụ',
        summary: '+28% sát thương tia chính & +20% xuyên giáp',
        accentColor: '#FDE047',
        damageMult: 1.28,
        rofMult: 0.94,
        rangeBonus: 0.25,
        splashBonus: 18,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'rainbow_refraction',
      name: 'Khúc Xạ Cầu Vồng 8 Tia',
      color: '#F472B6',
      heatPerShot: 18,
      summary: 'Bắn chùm laser cầu vồng 8 phổ màu khúc xạ chéo qua mọi quái trong tầm',
    },
  },
  {
    type: 'tempest',
    hotkey: 'n',
    name: 'Pháo Bão Ion',
    shortName: 'Bão Ion',
    roleClue: 'Cầu bão điện từ làm chậm + giật chuỗi',
    accentColor: '#818CF8',
    cost: 105,
    baseDamage: 34,
    baseCooldown: 1.08,
    rangeTiles: 3.4,
    milestones: [
      { level: 3, name: 'Cầu Ion Xoáy Kép', summary: 'Phóng 2 cầu bão điện từ làm chậm -26%' },
      { level: 5, name: 'Xung Phá Khiên Từ Trường', summary: 'Gây 165% sát thương lên khiên & ngắt chiêu 0.25s' },
      { level: 7, name: 'Xoáy Bão Lồng Ghép', summary: 'Cầu bão nổ lan 58px kèm sét giật phụ' },
      { level: 10, name: 'Cơn Thịnh Nộ Bão Từ', summary: '3 cầu ion nổ 78px + xuyên 75% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bão Tố Chớp Nhoáng',
        shortTag: 'α Nhanh',
        summary: 'Tốc phóng +16% & làm chậm lan rộng',
        accentColor: '#818CF8',
        damageMult: 0.94,
        rofMult: 1.16,
        rangeBonus: 0.3,
        splashBonus: 12,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sấm Bão Cực Đại',
        shortTag: 'ω Sấm Bão',
        summary: '+28% sát thương bão & +35% phá khiên',
        accentColor: '#38BDF8',
        damageMult: 1.28,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 18,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.35,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'electromagnetic_cyclone',
      name: 'Mắt Bão Điện Từ',
      color: '#818CF8',
      heatPerShot: 20,
      summary: 'Gọi xoáy bão điện từ xé toạc khiên năng lượng và đánh sét liên hoàn',
    },
  },
  // === 2 NEW GLOBAL GUNS (Total 20 Global) ===
  {
    type: 'sonic',
    hotkey: 'f',
    name: 'Pháo Sóng Âm Sonic',
    shortName: 'Sóng Âm',
    roleClue: 'Sóng xung kích 360° phá giáp & đẩy lùi nhẹ',
    accentColor: '#2DD4BF',
    cost: 110,
    baseDamage: 30,
    baseCooldown: 1.15,
    rangeTiles: 3.1,
    milestones: [
      { level: 3, name: 'Cộng Hưởng Siêu Âm', summary: 'Bào mòn 22% giáp trong vùng sóng âm' },
      { level: 5, name: 'Xung Đẩy Sóng Kép', summary: 'Phát 2 đợt sóng liên tiếp & làm chậm -25%' },
      { level: 7, name: 'Vỡ Màng Khiên', summary: 'Gây 155% sát thương lên khiên năng lượng' },
      { level: 10, name: 'Địa Chấn Thanh Âm', summary: '3 vòng sóng âm 110px bào 42% giáp toàn bầy' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Tần Số Cao',
        shortTag: 'α Tần Cao',
        summary: 'Tốc xung +18% & tầm sóng +0.35ô',
        accentColor: '#2DD4BF',
        damageMult: 0.94,
        rofMult: 1.18,
        rangeBonus: 0.35,
        splashBonus: 12,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sóng Hạ Âm',
        shortTag: 'ω Hạ Âm',
        summary: '+30% sát thương chấn động & +15% xuyên giáp',
        accentColor: '#FDE047',
        damageMult: 1.3,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 18,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'sonic_resonance_nova',
      name: 'Cộng Hưởng Vỡ Giáp',
      color: '#2DD4BF',
      heatPerShot: 20,
      summary: 'Kích nổ 3 vòng siêu âm liên hoàn bào 50% giáp và làm chậm toàn bộ mục tiêu trong tầm',
    },
  },
  {
    type: 'gravity_lance',
    hotkey: 'g',
    name: 'Thương Trọng Lực',
    shortName: 'Trọng Lực',
    roleClue: 'Tia trọng trường xuyên hàng & hút nhẹ đồng trục',
    accentColor: '#A855F7',
    cost: 130,
    baseDamage: 62,
    baseCooldown: 1.55,
    rangeTiles: 4.5,
    milestones: [
      { level: 3, name: 'Trường Hấp Dẫn', summary: 'Tia bắn kèm xung hút nhẹ quái thường về tâm' },
      { level: 5, name: 'Nén Khối Lượng', summary: 'Xuyên 78% giáp & +35% sát thương lên khiên' },
      { level: 7, name: 'Tia Kép Đứt Gãy', summary: 'Bắn 2 chùm thương trọng lực song song' },
      { level: 10, name: 'Chân Trời Sự Kiện', summary: '3 chùm thương xuyên 95% giáp + nổ chân không 52px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Xung Nhịp Trường',
        shortTag: 'α Trường Lực',
        summary: 'Tầm +0.45ô & +18% tốc nạp tia',
        accentColor: '#C084FC',
        damageMult: 0.94,
        rofMult: 1.18,
        rangeBonus: 0.45,
        splashBonus: 8,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sụp Đổ Hấp Dẫn',
        shortTag: 'ω Hấp Dẫn',
        summary: '+32% sát thương nén & +15% xuyên giáp',
        accentColor: '#F43F5E',
        damageMult: 1.32,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 16,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'gravity_singularity_lance',
      name: 'Trường Sụp Đổ Chân Không',
      color: '#A855F7',
      heatPerShot: 25,
      summary: 'Khai hỏa đại thương trọng lực tạo hố hút trên tuyến hành quân & nổ xuyên 100% giáp',
    },
  },
  // === 3 NEW TEAM SUPPORT GUNS (Total 23 Global) ===
  {
    type: 'amp_spire',
    hotkey: 'k',
    name: 'Trạm Tiếp Năng Đội Hình',
    shortName: 'Tiếp Năng',
    roleClue: 'Hồi năng lượng⚡ · Hạ nhiệt & +Xuyên Giáp cho đồng đội',
    accentColor: '#34D399',
    cost: 95,
    baseDamage: 18,
    baseCooldown: 1.55,
    rangeTiles: 2.8,
    milestones: [
      { level: 3, name: 'Pin Tản Nhiệt Đội', summary: '+18% tốc độ hạ nhiệt đồng minh & sinh +3⚡ mỗi nhịp' },
      { level: 5, name: 'Mạng Nạp Đạn Phụ', summary: '+6% tốc bắn & +10% xuyên giáp cho súng lân cận' },
      { level: 7, name: 'Sạc Lõi Toàn Năng', summary: 'Rút 0.25s hồi chiêu đồng đội mỗi nhịp & sinh +4⚡' },
      { level: 10, name: 'Lò Phản Ứng Tiếp Tế V10', summary: '+5⚡/nhịp, hạ nhiệt +30%, +12% tốc & +18% xuyên giáp đội' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Trạm Tiếp Năng Tốc Độ',
        shortTag: 'α Tiếp Tế',
        summary: 'Tầm +0.35ô · Tốc nhịp +18% & hạ nhiệt sâu hơn',
        accentColor: '#34D399',
        damageMult: 0.92,
        rofMult: 1.18,
        rangeBonus: 0.35,
        splashBonus: 0,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lõi Xuyên Giáp Đội',
        shortTag: 'ω Xuyên Giáp',
        summary: '+24% uy lực xung & tăng thêm xuyên giáp đồng minh',
        accentColor: '#A7F3D0',
        damageMult: 1.24,
        rofMult: 0.94,
        rangeBonus: 0.25,
        splashBonus: 20,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'supply_drop_surge',
      name: 'Cơn Mưa Tiếp Tế Lõi',
      color: '#34D399',
      heatPerShot: 24,
      summary: 'Nạp ngay +18⚡, hạ -40% nhiệt toàn súng đồng đội trong tầm & hồi +1 HP Lõi (Lv7+)',
    },
  },
  {
    type: 'radar',
    hotkey: 'l',
    name: 'Trạm Radar Trinh Sát',
    shortName: 'Radar',
    roleClue: '+Tầm bắn · Phá tàng hình & +Sát thương cả đội',
    accentColor: '#22D3EE',
    cost: 95,
    baseDamage: 16,
    baseCooldown: 1.45,
    rangeTiles: 3.2,
    milestones: [
      { level: 3, name: 'Khắc Tinh Tàng Hình', summary: 'Bóc trần tàng hình, +0.4ô tầm & +8% xuyên giáp đội' },
      { level: 5, name: 'Định Vị Giáp Yếu', summary: 'Đánh dấu mục tiêu nhận thêm +20% sát thương từ cả đội' },
      { level: 7, name: 'Mạng Quét Xuyên Phá', summary: '+0.65ô tầm bắn & +16% xuyên giáp cho súng đồng minh' },
      { level: 10, name: 'Thiên Nhãn Chiến Trường V10', summary: '+0.85ô tầm, +24% xuyên giáp & dấu +30% sát thương' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Ăng-ten Quét Xa',
        shortTag: 'α Quét Xa',
        summary: 'Tầm +0.45ô · Quét rộng & chia sẻ thêm tầm bắn',
        accentColor: '#22D3EE',
        damageMult: 0.94,
        rofMult: 1.14,
        rangeBonus: 0.45,
        splashBonus: 0,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lộ Điểm Yếu Chí Mạng',
        shortTag: 'ω Điểm Yếu',
        summary: '+26% sát thương xung & bóc giáp nặng hơn',
        accentColor: '#FDE047',
        damageMult: 1.26,
        rofMult: 0.94,
        rangeBonus: 0.25,
        splashBonus: 18,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'orbital_target_lock',
      name: 'Định Vị Hủy Diệt Toàn Đội',
      color: '#22D3EE',
      heatPerShot: 22,
      summary: 'Khóa hồng tâm 4 quái nguy hiểm nhất, tước 35% giáp & tăng +35% sát thương cả đội lên chúng',
    },
  },
  {
    type: 'aegis_field',
    hotkey: 'h',
    name: 'Tháp Trường Khiên Aegis',
    shortName: 'Khiên Aegis',
    roleClue: 'EMP đẩy lùi · +Phá Khiên & +Tốc Bắn đội hình',
    accentColor: '#60A5FA',
    cost: 105,
    baseDamage: 22,
    baseCooldown: 1.6,
    rangeTiles: 2.8,
    milestones: [
      { level: 3, name: 'Vòng Xung Phá Khiên', summary: '+25% phá khiên cho cả đội trong tầm & làm chậm -24%' },
      { level: 5, name: 'Xung Đẩy Đứt Nhịp', summary: 'Đẩy lùi nhẹ quái thường trên đường & +10% tốc bắn đội' },
      { level: 7, name: 'Pháo Đài Nạp Nhanh', summary: '+40% phá khiên đội & hỗ trợ nạp nhịp bắn đồng đội' },
      { level: 10, name: 'Trường Khiên Bất Tử V10', summary: '+55% phá khiên đội, +16% tốc bắn & choáng 0.3s' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Xung Đẩy Nhịp Nhanh',
        shortTag: 'α Xung Đẩy',
        summary: 'Tốc phát EMP +16% & tầm +0.35ô',
        accentColor: '#60A5FA',
        damageMult: 0.94,
        rofMult: 1.16,
        rangeBonus: 0.35,
        splashBonus: 12,
        armorPierceBonus: 0,
        shieldMultBonus: 0.18,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Trường Phá Khiên Vệ Thần',
        shortTag: 'ω Hộ Thuẫn',
        summary: '+26% sát thương xung & +40% phá khiên đồng minh',
        accentColor: '#38BDF8',
        damageMult: 1.26,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 20,
        armorPierceBonus: 0.1,
        shieldMultBonus: 0.4,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'aegis_fortress_pulse',
      name: 'Pháo Đài Bất Khả Xâm Phạm',
      color: '#60A5FA',
      heatPerShot: 25,
      summary: 'Kích nổ EMP choáng 0.65s, đẩy lùi quái, hồi +1 HP Lõi & nạp ngay +0.5s nhịp bắn đồng minh',
    },
  },
  // === 16 MAP-EXCLUSIVE SIGNATURE GUNS (1 unique weapon per sector-01..sector-16) ===
  {
    type: 'map01_cyber_smg',
    exclusiveMapId: 'sector-01',
    hotkey: 'y',
    name: 'Tiểu Liên Xung Cyber',
    shortName: 'Cyber SMG ★',
    roleClue: '[Đặc Quyền Màn 01] Liên thanh nòng kép tốc độ cao + phá khiên',
    accentColor: '#00E5FF',
    cost: 80,
    baseDamage: 15,
    baseCooldown: 0.25,
    rangeTiles: 3.3,
    milestones: [
      { level: 3, name: 'Đạn Xung Quang Học', summary: 'Bắn chùm 2 tia xung & +25% sát thương khiên' },
      { level: 5, name: 'Quá Tải Tốc Xạ', summary: 'Đạn có khả năng xuyên qua mục tiêu đầu tiên' },
      { level: 7, name: 'Nòng Ba Quang Điện', summary: '3 tia xung liên thanh + làm chậm nhẹ -16%' },
      { level: 10, name: 'Bão Đạn Tân Binh', summary: '4 tia xung cực tốc xuyên 65% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bão Xung Siêu Tốc',
        shortTag: 'α Siêu Tốc',
        summary: '+20% tốc bắn & +1 tia xung phụ',
        accentColor: '#00E5FF',
        damageMult: 0.88,
        rofMult: 1.2,
        rangeBonus: 0.35,
        splashBonus: 0,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.2,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đạn Xuyên Điện Từ',
        shortTag: 'ω Xuyên Khiên',
        summary: '+28% sát thương & +35% phá khiên',
        accentColor: '#FDE047',
        damageMult: 1.28,
        rofMult: 0.94,
        rangeBonus: 0.25,
        splashBonus: 14,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.35,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'cyber_smg_hyper_barrage',
      name: 'Xả Băng Siêu Thanh',
      color: '#00E5FF',
      heatPerShot: 9,
      summary: 'Quét 10 tia đạn xung quang học hình quạt xuyên thủng tuyến đầu',
    },
  },
  {
    type: 'map02_matrix_spire',
    exclusiveMapId: 'sector-02',
    hotkey: 'y',
    name: 'Tháp Lục Giác Ma Trận',
    shortName: 'Ma Trận ★',
    roleClue: '[Đặc Quyền Màn 02] Khúc xạ chùm tia ma trận lục bảo đa mục tiêu',
    accentColor: '#34D399',
    cost: 100,
    baseDamage: 24,
    baseCooldown: 0.72,
    rangeTiles: 3.5,
    milestones: [
      { level: 3, name: 'Ma Trận 3 Tia', summary: 'Nảy tia năng lượng qua 3 quái liên tiếp' },
      { level: 5, name: 'Giải Mã Giáp Trụ', summary: 'Tia ma trận bào 22% giáp & gây cháy dữ liệu' },
      { level: 7, name: 'Lưới 5 Điểm', summary: 'Nhảy qua 5 mục tiêu & +40% sát thương khiên' },
      { level: 10, name: 'Hạch Tâm Ma Trận', summary: '7 mục tiêu liên hoàn + nổ dữ liệu 34px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Lưới Đa Nảy',
        shortTag: 'α Đa Nảy',
        summary: '+2 mục tiêu nảy & +12% tốc bắn',
        accentColor: '#34D399',
        damageMult: 0.92,
        rofMult: 1.12,
        rangeBonus: 0.3,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Xóa Sổ Lõi',
        shortTag: 'ω Xóa Lõi',
        summary: '+30% sát thương mỗi tia & +20% xuyên giáp',
        accentColor: '#FDE047',
        damageMult: 1.3,
        rofMult: 0.94,
        rangeBonus: 0.2,
        splashBonus: 16,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'matrix_code_overload',
      name: 'Tràn Bộ Nhớ Ma Trận',
      color: '#34D399',
      heatPerShot: 17,
      summary: 'Phát 8 tia laser ma trận đồng thời quét toàn bộ quái trong tầm',
    },
  },
  {
    type: 'map03_forge_magma',
    exclusiveMapId: 'sector-03',
    hotkey: 'y',
    name: 'Pháo Dung Nham Lò Rèn',
    shortName: 'Dung Nham ★',
    roleClue: '[Đặc Quyền Màn 03] Cầu dung nham vượt tường tạo vũng nham thạch thiêu đốt',
    accentColor: '#FB7185',
    cost: 115,
    baseDamage: 42,
    baseCooldown: 1.3,
    rangeTiles: 3.9,
    milestones: [
      { level: 3, name: 'Hồ Nham Thạch', summary: 'Để lại vũng dung nham đốt 3.5s & làm chậm -20%' },
      { level: 5, name: 'Nung Chảy Hợp Kim', summary: 'Bào 32% giáp của mọi đơn vị chạm dung nham' },
      { level: 7, name: 'Phun Trào Kép', summary: 'Phóng 2 cầu dung nham nổ lan 68px' },
      { level: 10, name: 'Núi Lửa Huyết Thép', summary: '3 cầu dung nham + xuyên 72% giáp & lửa vĩnh cửu' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Mưa Nham Thạch',
        shortTag: 'α Phun Trào',
        summary: '+1 cầu dung nham & tầm ném +0.4ô',
        accentColor: '#FB7185',
        damageMult: 0.84,
        rofMult: 1.08,
        rangeBonus: 0.4,
        splashBonus: 12,
        armorPierceBonus: 0,
        shieldMultBonus: 0.1,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lõi Lửa Trắng',
        shortTag: 'ω Lửa Trắng',
        summary: '+34% sát thương nổ & vùng cháy +22px',
        accentColor: '#FACC15',
        damageMult: 1.34,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 22,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'forge_volcanic_eruption',
      name: 'Siêu Phun Trào Lò Rèn',
      color: '#FB7185',
      heatPerShot: 22,
      summary: 'Mưa 6 khối dung nham rải thảm trên đường đi thiêu đốt diện rộng',
    },
  },
  {
    type: 'map04_void_katana',
    exclusiveMapId: 'sector-04',
    hotkey: 'y',
    name: 'Kiếm Khí Hư Không',
    shortName: 'Kiếm Khí ★',
    roleClue: '[Đặc Quyền Màn 04] Chém trăng lưỡi liềm xuyên cả hàng dài',
    accentColor: '#C084FC',
    cost: 110,
    baseDamage: 46,
    baseCooldown: 0.95,
    rangeTiles: 4.1,
    milestones: [
      { level: 3, name: 'Trảm Xuyên Tầng', summary: 'Kiếm khí xuyên tối đa 5 mục tiêu trên một đường thẳng' },
      { level: 5, name: 'Đứt Gãy Không Gian', summary: 'Xuyên 70% giáp & +35% sát thương lên khiên' },
      { level: 7, name: 'Song Kiếm Trảm', summary: 'Phóng 2 vầng kiếm khí chữ V' },
      { level: 10, name: 'Vô Cực Đao Pháp', summary: '3 vầng kiếm khí xuyên 90% giáp & rỉa cháy' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Tật Phong Trảm',
        shortTag: 'α Tật Phong',
        summary: '+18% tốc vung kiếm & tầm bay +0.4ô',
        accentColor: '#C084FC',
        damageMult: 0.93,
        rofMult: 1.18,
        rangeBonus: 0.4,
        splashBonus: 0,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hư Không Trảm',
        shortTag: 'ω Hư Không',
        summary: '+32% uy lực nhát chém & xuyên 100% giáp ở Lv10',
        accentColor: '#F472B6',
        damageMult: 1.32,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 14,
        armorPierceBonus: 0.18,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'void_crescent_tempest',
      name: 'Bát Quái Kiếm Trận',
      color: '#C084FC',
      heatPerShot: 18,
      summary: 'Chém tỏa 8 nhát kiếm khí hư không xoay tròn càn quét toàn mặt trận',
    },
  },
  {
    type: 'map05_dune_needler',
    exclusiveMapId: 'sector-05',
    hotkey: 'y',
    name: 'Nỏ Gai Bão Cát',
    shortName: 'Nỏ Gai Cát ★',
    roleClue: '[Đặc Quyền Màn 05] Bắn loạt gai pha lê cát ghim vào quái rồi phát nổ',
    accentColor: '#FBBF24',
    cost: 95,
    baseDamage: 18,
    baseCooldown: 0.48,
    rangeTiles: 3.6,
    milestones: [
      { level: 3, name: 'Gai Pha Lê Nổ', summary: 'Gai nổ lan 32px & bào mòn giáp nhẹ' },
      { level: 5, name: 'Bão Cát Mù Mịt', summary: 'Bắn 3 gai một loạt & làm chậm -22%' },
      { level: 7, name: 'Găm Độc Sa Mạc', summary: 'Gai gây cháy cát nóng & tăng 15% sát thương nhận vào' },
      { level: 10, name: 'Vạn Tiễn Sa Mạc', summary: '5 gai pha lê nổ 48px xuyên 75% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Liên Tiễn Sa Mạc',
        shortTag: 'α Liên Tiễn',
        summary: '+1 gai mỗi loạt & tốc bắn +16%',
        accentColor: '#FBBF24',
        damageMult: 0.88,
        rofMult: 1.16,
        rangeBonus: 0.3,
        splashBonus: 6,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Gai Hoàng Kim',
        shortTag: 'ω Hoàng Kim',
        summary: '+30% sát thương nổ gai & +15% xuyên giáp',
        accentColor: '#FB923C',
        damageMult: 1.3,
        rofMult: 0.94,
        rangeBonus: 0.2,
        splashBonus: 16,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'dune_crystal_storm',
      name: 'Bão Gai Pha Lê',
      color: '#FBBF24',
      heatPerShot: 14,
      summary: 'Phóng mưa 14 gai pha lê nổ lan khắp khúc cua sa mạc',
    },
  },
  {
    type: 'map06_aurora_beam',
    exclusiveMapId: 'sector-06',
    hotkey: 'y',
    name: 'Tia Cực Quang Bắc Cực',
    shortName: 'Cực Quang ★',
    roleClue: '[Đặc Quyền Màn 06] Tia sáng cực quang làm giòn giáp & quét vòng xoáy',
    accentColor: '#7DD3FC',
    cost: 125,
    baseDamage: 48,
    baseCooldown: 1.05,
    rangeTiles: 3.9,
    milestones: [
      { level: 3, name: 'Lăng Kính Cực Quang', summary: 'Làm chậm -30% & tăng +16% sát thương nhận vào' },
      { level: 5, name: 'Sóng Băng Quang Học', summary: 'Tia nhảy qua 3 mục tiêu & +45% phá khiên' },
      { level: 7, name: 'Khúc Xạ Băng Giá', summary: 'Tia nhảy qua 5 mục tiêu + xuyên 75% giáp' },
      { level: 10, name: 'Vũ Điệu Cực Quang', summary: '7 mục tiêu liên hoàn + nổ băng 44px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Dải Băng Lan',
        shortTag: 'α Băng Lan',
        summary: '+2 tia nhảy cực quang & tầm +0.35ô',
        accentColor: '#7DD3FC',
        damageMult: 0.92,
        rofMult: 1.12,
        rangeBonus: 0.35,
        splashBonus: 8,
        armorPierceBonus: 0,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Tia Hủy Diệt Bắc Cực',
        shortTag: 'ω Cực Quang',
        summary: '+32% sát thương & +25% phá khiên',
        accentColor: '#38BDF8',
        damageMult: 1.32,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 18,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'aurora_borealis_sweep',
      name: 'Bão Cực Quang Băng',
      color: '#7DD3FC',
      heatPerShot: 20,
      summary: 'Gọi 6 tia cực quang song song quét đóng băng giòn toàn bộ mục tiêu trong tầm',
    },
  },
  {
    type: 'map07_cyclone_rotary',
    exclusiveMapId: 'sector-07',
    hotkey: 'y',
    name: 'Đại Liên Lốc Xoáy',
    shortName: 'Lốc Xoáy ★',
    roleClue: '[Đặc Quyền Màn 07] 6 nòng xoay siêu tốc dội mưa đạn 360° giữa tâm',
    accentColor: '#38BDF8',
    cost: 120,
    baseDamage: 19,
    baseCooldown: 0.26,
    rangeTiles: 3.4,
    milestones: [
      { level: 3, name: 'Nòng Kép Lốc Xoáy', summary: 'Bắn 2 viên xuyên giáp nhẹ' },
      { level: 5, name: 'Đạn Xoắn Phá Giáp', summary: 'Xuyên 60% giáp & nảy sang 1 mục tiêu gần' },
      { level: 7, name: 'Ba Nòng Cuồng Phong', summary: 'Bắn 3 viên/phát & nổ vụn 26px' },
      { level: 10, name: 'Bão Đạn Trung Tâm', summary: '4 viên siêu tốc xuyên 80% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Nòng Siêu Xoay',
        shortTag: 'α Siêu Xoay',
        summary: '+22% tốc quay nòng & +1 viên/phát',
        accentColor: '#38BDF8',
        damageMult: 0.85,
        rofMult: 1.22,
        rangeBonus: 0.3,
        splashBonus: 0,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đạn Hợp Kim Nặng',
        shortTag: 'ω Hợp Kim',
        summary: '+32% sát thương viên & nổ lan 16px',
        accentColor: '#FDE047',
        damageMult: 1.32,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 16,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'cyclone_360_bullet_ring',
      name: 'Vòng Xoáy Đạn 360°',
      color: '#38BDF8',
      heatPerShot: 9,
      summary: 'Phóng vòng tròn 18 viên đạn xuyên giáp xoay tỏa 360° quanh trụ',
    },
  },
  {
    type: 'map08_titan_flak',
    exclusiveMapId: 'sector-08',
    hotkey: 'y',
    name: 'Pháo Phòng Không Titan',
    shortName: 'Titan Flak ★',
    roleClue: '[Đặc Quyền Màn 08] Đạn pháo nổ mảnh trên không diệt đội quân Thiết Giáp',
    accentColor: '#F97316',
    cost: 125,
    baseDamage: 66,
    baseCooldown: 1.28,
    rangeTiles: 3.7,
    milestones: [
      { level: 3, name: 'Đạn Mảnh Titan', summary: 'Phát nổ tách 4 mảnh đạn văng xung quanh' },
      { level: 5, name: 'Phá Giáp Hạng Nặng', summary: 'Xuyên 68% giáp & làm choáng 0.35s' },
      { level: 7, name: 'Song Nòng Flak', summary: 'Bắn 2 quả pháo nổ mảnh tầm rộng 74px' },
      { level: 10, name: 'Lưới Lửa Pháo Đài', summary: '3 quả pháo nổ 92px + 6 mảnh đạn xuyên 85% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Nạp Đạn Tự Động',
        shortTag: 'α Nạp Nhanh',
        summary: '+18% tốc bắn & +0.35ô tầm pháo',
        accentColor: '#FB923C',
        damageMult: 0.94,
        rofMult: 1.18,
        rangeBonus: 0.35,
        splashBonus: 10,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đầu Đạn Xuyên Titan',
        shortTag: 'ω Phá Titan',
        summary: '+34% công phá & +20% xuyên giáp',
        accentColor: '#FDE047',
        damageMult: 1.34,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 20,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'titan_flak_skyburst',
      name: 'Mưa Mảnh Pháo Titan',
      color: '#F97316',
      heatPerShot: 22,
      summary: 'Bắn 5 quả pháo phòng không nổ tung thành 20 mảnh thép xuyên giáp',
    },
  },
  {
    type: 'map09_venom_hydra',
    exclusiveMapId: 'sector-09',
    hotkey: 'y',
    name: 'Pháo Độc Tam Đầu Hydra',
    shortName: 'Độc Hydra ★',
    roleClue: '[Đặc Quyền Màn 09] Phóng 3 đầu đạn độc ăn mòn giáp & lây lan vũng độc',
    accentColor: '#4ADE80',
    cost: 115,
    baseDamage: 28,
    baseCooldown: 1.12,
    rangeTiles: 3.5,
    milestones: [
      { level: 3, name: 'Tam Đầu Phun Độc', summary: 'Phóng 2 cầu độc & bào 30% giáp' },
      { level: 5, name: 'Độc Tố Tê Liệt', summary: 'Vũng độc làm chậm -30% & rút máu chuẩn cực mạnh' },
      { level: 7, name: 'Hydra Ba Nọc', summary: 'Phóng 3 cầu độc tách biệt nhắm 3 mục tiêu' },
      { level: 10, name: 'Đại Dịch Lục Bảo', summary: '4 cầu độc phủ 75px + bào 52% giáp vĩnh viễn' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bầy Độc Tốc Độ',
        shortTag: 'α Bầy Độc',
        summary: '+1 cầu độc & tốc bắn +12%',
        accentColor: '#4ADE80',
        damageMult: 0.85,
        rofMult: 1.12,
        rangeBonus: 0.3,
        splashBonus: 10,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.1,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Axit Cô Đặc',
        shortTag: 'ω Độc Đặc',
        summary: '+32% sát thương độc & vũng rộng +20px',
        accentColor: '#BEF264',
        damageMult: 1.32,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 20,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'hydra_toxic_deluge',
      name: 'Hồng Thủy Độc Hydra',
      color: '#4ADE80',
      heatPerShot: 20,
      summary: 'Triệu hồi 5 vũng độc ăn mòn khổng lồ ngay dưới chân đội hình quái',
    },
  },
  {
    type: 'map10_meteor_rail',
    exclusiveMapId: 'sector-10',
    hotkey: 'y',
    name: 'Pháo Đường Ray Thiên Thạch',
    shortName: 'Ray Thiên Thạch ★',
    roleClue: '[Đặc Quyền Màn 10] Bắn tia xuyên toàn bản đồ + gọi thiên thạch rơi tại điểm trúng',
    accentColor: '#F59E0B',
    cost: 135,
    baseDamage: 88,
    baseCooldown: 1.85,
    rangeTiles: 5.2,
    milestones: [
      { level: 3, name: 'Đạn Xuyên Vượt Núi', summary: 'Xuyên 85% giáp mọi quái trên đường thẳng' },
      { level: 5, name: 'Sao Băng Kéo Theo', summary: 'Mục tiêu chính kích nổ thiên thạch 58px' },
      { level: 7, name: 'Song Tia Thiên Thạch', summary: 'Bắn 2 chùm đường ray song song' },
      { level: 10, name: 'Tận Thế Hẻm Núi', summary: '3 chùm xuyên 100% giáp + nổ thiên thạch 80px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Tụ Năng Nhanh',
        shortTag: 'α Nạp Nhanh',
        summary: '+18% tốc độ nạp tia & tầm +0.6ô',
        accentColor: '#FBBF24',
        damageMult: 0.93,
        rofMult: 1.18,
        rangeBonus: 0.6,
        splashBonus: 10,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Thiên Thạch Hủy Diệt',
        shortTag: 'ω Hủy Diệt',
        summary: '+34% công phá & nổ lan +24px',
        accentColor: '#F43F5E',
        damageMult: 1.34,
        rofMult: 0.9,
        rangeBonus: 0.25,
        splashBonus: 24,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'meteor_orbital_rain',
      name: 'Mưa Thiên Thạch Quỹ Đạo',
      color: '#F59E0B',
      heatPerShot: 25,
      summary: 'Gọi 6 thiên thạch rực lửa dội thẳng xuống những cụm quái đông nhất',
    },
  },
  {
    type: 'map11_cryo_shatter',
    exclusiveMapId: 'sector-11',
    hotkey: 'y',
    name: 'Pháo Băng Phá Giáp',
    shortName: 'Băng Phá Giáp ★',
    roleClue: '[Đặc Quyền Màn 11] Phóng gai băng sắc xuyên giáp + kích hoạt hiệu ứng Giòn Vỡ',
    accentColor: '#BAE6FD',
    cost: 120,
    baseDamage: 40,
    baseCooldown: 0.88,
    rangeTiles: 3.7,
    milestones: [
      { level: 3, name: 'Gai Băng Xuyên Thấu', summary: 'Làm chậm -32% & tăng +20% sát thương nhận vào' },
      { level: 5, name: 'Vỡ Vụn Pha Lê', summary: 'Gai băng nổ thành mảnh băng 48px khi trúng' },
      { level: 7, name: 'Loạt Gai Tam Giác', summary: 'Bắn 3 gai băng song song & xuyên 70% giáp' },
      { level: 10, name: 'Kỷ Băng Hà Tuyệt Đối', summary: '4 gai băng nổ 68px + +30% Giòn Vỡ & xuyên 90% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bão Gai Băng',
        shortTag: 'α Bão Gai',
        summary: '+1 gai băng & tốc bắn +15%',
        accentColor: '#7DD3FC',
        damageMult: 0.86,
        rofMult: 1.15,
        rangeBonus: 0.35,
        splashBonus: 8,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.15,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Búa Băng Khổng Lồ',
        shortTag: 'ω Phá Băng',
        summary: '+32% sát thương phá giáp & nổ băng +20px',
        accentColor: '#E0F2FE',
        damageMult: 1.32,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 20,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'cryo_shatter_nova',
      name: 'Nổ Vỡ Băng Tinh',
      color: '#BAE6FD',
      heatPerShot: 18,
      summary: 'Phóng 12 mũi lao băng vĩnh cửu xung quanh làm giòn vỡ mọi giáp trụ',
    },
  },
  {
    type: 'map12_hellfire_organ',
    exclusiveMapId: 'sector-12',
    hotkey: 'y',
    name: 'Đàn Tên Lửa Ngục Hỏa',
    shortName: 'Ngục Hỏa ★',
    roleClue: '[Đặc Quyền Màn 12] Bệ phóng đa ống rải thảm tên lửa cháy nổ theo khúc cua',
    accentColor: '#EF4444',
    cost: 130,
    baseDamage: 38,
    baseCooldown: 1.45,
    rangeTiles: 4.3,
    milestones: [
      { level: 3, name: 'Khởi Động 3 Ống', summary: 'Phóng loạt 3 tên lửa tầm nhiệt nổ 56px' },
      { level: 5, name: 'Đầu Đạn Napalm', summary: 'Thiêu đốt toàn vùng nổ & bào 28% giáp' },
      { level: 7, name: 'Đàn Tên Lửa 5 Ống', summary: '5 tên lửa đuổi mục tiêu độc lập' },
      { level: 10, name: 'Bản Giao Hưởng Hủy Diệt', summary: '6 tên lửa ngục hỏa nổ 84px + lửa rực' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Nạp Tên Lửa Kép',
        shortTag: 'α Nạp Kép',
        summary: '+1 tên lửa mỗi loạt & tốc nạp +14%',
        accentColor: '#FB7185',
        damageMult: 0.85,
        rofMult: 1.14,
        rangeBonus: 0.35,
        splashBonus: 8,
        armorPierceBonus: 0,
        shieldMultBonus: 0.1,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đầu Đạn Nhiệt Hạch',
        shortTag: 'ω Nhiệt Hạch',
        summary: '+34% công phá & bán kính nổ +22px',
        accentColor: '#FDE047',
        damageMult: 1.34,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 22,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'hellfire_organ_crescendo',
      name: 'Bản Giao Hưởng Ngục Lửa',
      color: '#EF4444',
      heatPerShot: 22,
      summary: 'Khai hỏa đồng loạt 10 tên lửa ngục hỏa đuổi toàn bộ Boss & Tinh Anh',
    },
  },
  {
    type: 'map13_shadow_hive',
    exclusiveMapId: 'sector-13',
    hotkey: 'y',
    name: 'Tổ Ong Bóng Đêm',
    shortName: 'Ong Bóng Đêm ★',
    roleClue: '[Đặc Quyền Màn 13] Thả bầy drone sát thủ tự hành bay vượt mọi vách đá',
    accentColor: '#A855F7',
    cost: 125,
    baseDamage: 29,
    baseCooldown: 0.88,
    rangeTiles: 4.5,
    milestones: [
      { level: 3, name: 'Đàn Drone Đôi', summary: 'Xuất kích 2 drone săn mồi tốc độ cao' },
      { level: 5, name: 'Mũi Khoan Phá Khiên', summary: '+55% sát thương lên khiên & xuyên 55% giáp' },
      { level: 7, name: 'Bầy Ong 3 Cánh', summary: '3 drone tự đổi mục tiêu & nổ 34px' },
      { level: 10, name: 'Nữ Hoàng Tổ Ong', summary: '4 drone tử thần xuyên 80% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bầy Ong Vô Tận',
        shortTag: 'α Bầy Drone',
        summary: '+1 drone xuất kích & tầm radar +0.5ô',
        accentColor: '#C084FC',
        damageMult: 0.86,
        rofMult: 1.14,
        rangeBonus: 0.5,
        splashBonus: 6,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.15,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sát Thủ Bóng Tối',
        shortTag: 'ω Sát Thủ',
        summary: '+32% sát thương drone & +25% phá khiên',
        accentColor: '#E879F9',
        damageMult: 1.32,
        rofMult: 0.92,
        rangeBonus: 0.25,
        splashBonus: 14,
        armorPierceBonus: 0.18,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'shadow_hive_swarm',
      name: 'Triệu Hồi Bầy Ong Tử Thần',
      color: '#A855F7',
      heatPerShot: 18,
      summary: 'Phóng 9 drone bóng đêm tự hành truy sát ưu tiên Boss & Pháp Sư',
    },
  },
  {
    type: 'map14_omega_disruptor',
    exclusiveMapId: 'sector-14',
    hotkey: 'y',
    name: 'Máy Phá Nhiễu Omega',
    shortName: 'Phá Nhiễu ω ★',
    roleClue: '[Đặc Quyền Màn 14] Bắn xung điện từ xóa sạch khiên & ngắt chiêu quân địch',
    accentColor: '#22D3EE',
    cost: 135,
    baseDamage: 54,
    baseCooldown: 1.08,
    rangeTiles: 3.9,
    milestones: [
      { level: 3, name: 'Xung Phá Khiên ×2', summary: 'Gây 200% sát thương lên khiên & ngắt chiêu 0.3s' },
      { level: 5, name: 'Sóng Nhiễu Đôi', summary: 'Bắn 2 cầu xung + làm chậm -28%' },
      { level: 7, name: 'Nổ Tĩnh Điện 64px', summary: 'Sát thương lan + giật tia phụ sang lân cận' },
      { level: 10, name: 'Đình Chỉ Toàn Bộ', summary: '3 cầu xung + xuyên 85% giáp & 230% phá khiên' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Tần Số Ngắt Chiêu',
        shortTag: 'α Tốc Xung',
        summary: '+18% tốc phát xung & tầm +0.4ô',
        accentColor: '#22D3EE',
        damageMult: 0.94,
        rofMult: 1.18,
        rangeBonus: 0.4,
        splashBonus: 12,
        armorPierceBonus: 0.05,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Xung Hủy Diệt Khiên',
        shortTag: 'ω Phá Khiên',
        summary: '+32% công phá & +45% phá khiên',
        accentColor: '#FDE047',
        damageMult: 1.32,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 18,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.45,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'omega_emp_blackout',
      name: 'Tắt Điện Toàn Tuyến',
      color: '#22D3EE',
      heatPerShot: 20,
      summary: 'Bùng nổ tia EMP quét sạch khiên & ngắt chiêu toàn bộ địch trong bán kính lớn',
    },
  },
  {
    type: 'map15_emerald_reaper',
    exclusiveMapId: 'sector-15',
    hotkey: 'y',
    name: 'Lưỡi Hái Ngọc Lục Bảo',
    shortName: 'Lưỡi Hái ★',
    roleClue: '[Đặc Quyền Màn 15] Phi tiêu lưỡi hái khổng lồ nảy 9 lần kèm chảy máu chuẩn',
    accentColor: '#10B981',
    cost: 130,
    baseDamage: 42,
    baseCooldown: 1.05,
    rangeTiles: 3.8,
    milestones: [
      { level: 3, name: 'Lưỡi Hái Bật 5 Lần', summary: 'Phi tiêu nảy 5 mục tiêu liên tiếp' },
      { level: 5, name: 'Vết Cắt Ngọc Lục Bảo', summary: 'Gây rút máu chuẩn & bào 35% giáp' },
      { level: 7, name: 'Song Lưỡi Hái', summary: 'Phóng 2 lưỡi hái nảy 7 lần' },
      { level: 10, name: 'Tử Thần Vành Đai', summary: '3 lưỡi hái nảy 9 lần xuyên 82% giáp' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Phi Tiêu Bật Vô Hạn',
        shortTag: 'α Bật Nảy',
        summary: '+3 lần nảy & +14% tốc phóng',
        accentColor: '#34D399',
        damageMult: 0.92,
        rofMult: 1.14,
        rangeBonus: 0.35,
        splashBonus: 0,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 3,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hái Hồn Trảm',
        shortTag: 'ω Hái Hồn',
        summary: '+34% sát thương chém & +20% xuyên giáp',
        accentColor: '#FDE047',
        damageMult: 1.34,
        rofMult: 0.92,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'emerald_reaper_maelstrom',
      name: 'Bão Lưỡi Hái Lục Bảo',
      color: '#10B981',
      heatPerShot: 20,
      summary: 'Tung 5 siêu lưỡi hái lục bảo nảy 10 lần xé nát cả đoàn Boss & Hộ Thuẫn',
    },
  },
  {
    type: 'map16_void_sovereign',
    exclusiveMapId: 'sector-16',
    hotkey: 'y',
    name: 'Pháo Hoàng Đế Hư Không',
    shortName: 'Hoàng Đế ★',
    roleClue: '[Đặc Quyền Màn 16] Tối thượng Đế Chế: tia chùm xuyên 100% giáp + cầu nổ hư vô',
    accentColor: '#E879F9',
    cost: 150,
    baseDamage: 84,
    baseCooldown: 1.35,
    rangeTiles: 4.7,
    milestones: [
      { level: 3, name: 'Sắc Lệnh Hoàng Đế', summary: 'Xuyên 80% giáp & +50% sát thương khiên' },
      { level: 5, name: 'Song Cầu Hư Vô', summary: 'Nổ lan 70px kèm hút nhẹ & đốt cháy' },
      { level: 7, name: 'Tam Chùm Quyền Năng', summary: 'Bắn 3 cầu hư vô + tia laser phụ trợ' },
      { level: 10, name: 'Chúa Tể Hư Không', summary: 'Xuyên 100% giáp, nổ 96px & +35% sát thương lên Boss' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Vũ Điệu Tinh Vân',
        shortTag: 'α Tinh Vân',
        summary: '+1 cầu hư vô & +16% tốc bắn',
        accentColor: '#E879F9',
        damageMult: 0.88,
        rofMult: 1.16,
        rangeBonus: 0.45,
        splashBonus: 12,
        armorPierceBonus: 0.1,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sấm Sét Hoàng Đế',
        shortTag: 'ω Tối Thượng',
        summary: '+36% uy lực tối cao & nổ +24px',
        accentColor: '#FDE047',
        damageMult: 1.36,
        rofMult: 0.9,
        rangeBonus: 0.25,
        splashBonus: 24,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.35,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'sovereign_void_eclipse',
      name: 'Nhật Thực Hoàng Đế',
      color: '#E879F9',
      heatPerShot: 22,
      summary: 'Khai mở Nhật Thực Hư Không quét tia hủy diệt xuyên 100% giáp toàn chiến trường',
    },
  },
];

export function getExclusiveGunForMap(mapId: string): GunCatalogItem | undefined {
  return GUN_CATALOG.find((g) => g.exclusiveMapId === mapId);
}

export function getAvailableGunsForMap(mapId: string): GunCatalogItem[] {
  const exclusive = GUN_CATALOG.filter((g) => g.exclusiveMapId === mapId);
  const globalGuns = GUN_CATALOG.filter((g) => !g.exclusiveMapId);
  return [...exclusive, ...globalGuns];
}

export const PRISM_MAPS: readonly TdMapDef[] = [
  {
    id: 'sector-01',
    name: 'Màn 01 · Thung Lũng Khởi Đầu',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 16 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Thời lượng x2 (16 đợt) · Đặc quyền riêng: Tiểu Liên Xung Cyber.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 185,
    startCoreHp: 22,
    totalWaves: 16,
    path: [
      { col: 0, row: 2 },
      { col: 4, row: 2 },
      { col: 4, row: 7 },
      { col: 8, row: 7 },
      { col: 8, row: 1 },
      { col: 12, row: 1 },
      { col: 12, row: 6 },
      { col: 15, row: 6 },
    ],
    walls: [
      { col: 2, row: 5 },
      { col: 6, row: 4 },
      { col: 10, row: 4 },
      { col: 14, row: 3 },
    ],
  },
  {
    id: 'sector-02',
    name: 'Màn 02 · Giao Lộ Ma Trận',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 16 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Hai khúc cua đối xứng · Đặc quyền riêng: Tháp Lục Giác Ma Trận.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 195,
    startCoreHp: 22,
    totalWaves: 16,
    path: [
      { col: 0, row: 1 },
      { col: 4, row: 1 },
      { col: 4, row: 8 },
      { col: 11, row: 8 },
      { col: 11, row: 2 },
      { col: 15, row: 2 },
    ],
    walls: [
      { col: 7, row: 4 },
      { col: 8, row: 4 },
      { col: 2, row: 5 },
      { col: 13, row: 6 },
    ],
  },
  {
    id: 'sector-03',
    name: 'Màn 03 · Lò Rèn Huyết Thép',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 18 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Vách thép trung tâm · Đặc quyền riêng: Pháo Dung Nham Lò Rèn.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 205,
    startCoreHp: 22,
    totalWaves: 18,
    path: [
      { col: 0, row: 8 },
      { col: 3, row: 8 },
      { col: 3, row: 1 },
      { col: 12, row: 1 },
      { col: 12, row: 7 },
      { col: 15, row: 7 },
    ],
    walls: [
      { col: 6, row: 4 },
      { col: 7, row: 4 },
      { col: 8, row: 4 },
      { col: 9, row: 4 },
    ],
  },
  {
    id: 'sector-04',
    name: 'Màn 04 · Đại Lộ Hư Không',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 18 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Đại lộ 3 tầng dài · Đặc quyền riêng: Kiếm Khí Hư Không.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 215,
    startCoreHp: 22,
    totalWaves: 18,
    path: [
      { col: 0, row: 1 },
      { col: 14, row: 1 },
      { col: 14, row: 5 },
      { col: 2, row: 5 },
      { col: 2, row: 8 },
      { col: 15, row: 8 },
    ],
    walls: [
      { col: 7, row: 3 },
      { col: 8, row: 3 },
      { col: 11, row: 6 },
    ],
  },
  {
    id: 'sector-05',
    name: 'Màn 05 · Sa Mạc Răng Cưa',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 20 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Năm khúc cua răng cưa · Đặc quyền riêng: Nỏ Gai Bão Cát.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 225,
    startCoreHp: 22,
    totalWaves: 20,
    path: [
      { col: 0, row: 1 },
      { col: 3, row: 1 },
      { col: 3, row: 7 },
      { col: 7, row: 7 },
      { col: 7, row: 1 },
      { col: 11, row: 1 },
      { col: 11, row: 8 },
      { col: 15, row: 8 },
    ],
    walls: [
      { col: 5, row: 4 },
      { col: 9, row: 4 },
      { col: 13, row: 4 },
    ],
  },
  {
    id: 'sector-06',
    name: 'Màn 06 · Lõi Băng Cực Quang',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 22 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Xoắn ốc hội tụ vào Lõi · Đặc quyền riêng: Tia Cực Quang Bắc Cực.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 235,
    startCoreHp: 22,
    totalWaves: 22,
    path: [
      { col: 0, row: 8 },
      { col: 14, row: 8 },
      { col: 14, row: 1 },
      { col: 2, row: 1 },
      { col: 2, row: 5 },
      { col: 10, row: 5 },
    ],
    walls: [
      { col: 5, row: 3 },
      { col: 11, row: 3 },
      { col: 6, row: 6 },
    ],
  },
  {
    id: 'sector-07',
    name: 'Màn 07 · Xoáy Lốc Bào Mòn',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 22 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Quái đi qua tâm 2 lượt · Đặc quyền riêng: Đại Liên Lốc Xoáy.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 245,
    startCoreHp: 24,
    totalWaves: 22,
    path: [
      { col: 0, row: 4 },
      { col: 12, row: 4 },
      { col: 12, row: 1 },
      { col: 4, row: 1 },
      { col: 4, row: 8 },
      { col: 13, row: 8 },
      { col: 13, row: 6 },
      { col: 15, row: 6 },
    ],
    walls: [
      { col: 7, row: 6 },
      { col: 9, row: 6 },
      { col: 2, row: 2 },
    ],
  },
  {
    id: 'sector-08',
    name: 'Màn 08 · Pháo Đài Kép Titan',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 24 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Tuyến chữ U bọc thép · Đặc quyền riêng: Pháo Phòng Không Titan.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 255,
    startCoreHp: 24,
    totalWaves: 24,
    path: [
      { col: 0, row: 1 },
      { col: 6, row: 1 },
      { col: 6, row: 8 },
      { col: 1, row: 8 },
      { col: 1, row: 5 },
      { col: 11, row: 5 },
      { col: 11, row: 2 },
      { col: 15, row: 2 },
    ],
    walls: [
      { col: 3, row: 3 },
      { col: 8, row: 7 },
      { col: 13, row: 6 },
    ],
  },
  {
    id: 'sector-09',
    name: 'Màn 09 · Ma Trận Tam Giáp',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 26 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Ba bậc hỏa lực chéo · Đặc quyền riêng: Pháo Độc Tam Đầu Hydra.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 265,
    startCoreHp: 24,
    totalWaves: 26,
    path: [
      { col: 0, row: 7 },
      { col: 4, row: 7 },
      { col: 4, row: 2 },
      { col: 8, row: 2 },
      { col: 8, row: 8 },
      { col: 12, row: 8 },
      { col: 12, row: 1 },
      { col: 15, row: 1 },
    ],
    walls: [
      { col: 6, row: 5 },
      { col: 10, row: 4 },
      { col: 2, row: 3 },
    ],
  },
  {
    id: 'sector-10',
    name: 'Màn 10 · Hẻm Núi Thiên Thạch',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 26 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Hẻm núi chia 4 sườn · Đặc quyền riêng: Pháo Đường Ray Thiên Thạch.',
    biome: 'amber_desert',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 280,
    startCoreHp: 24,
    totalWaves: 26,
    path: [
      { col: 0, row: 2 },
      { col: 3, row: 2 },
      { col: 3, row: 8 },
      { col: 7, row: 8 },
      { col: 7, row: 1 },
      { col: 11, row: 1 },
      { col: 11, row: 8 },
      { col: 14, row: 8 },
      { col: 14, row: 4 },
      { col: 15, row: 4 },
    ],
    walls: [
      { col: 5, row: 5 },
      { col: 9, row: 5 },
      { col: 12, row: 3 },
    ],
  },
  {
    id: 'sector-11',
    name: 'Màn 11 · Cầu Băng Vỡ Vụn',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 28 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Cầu băng 3 tầng tốc độ cao · Đặc quyền riêng: Pháo Băng Phá Giáp.',
    biome: 'arctic_core',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 290,
    startCoreHp: 25,
    totalWaves: 28,
    path: [
      { col: 0, row: 0 },
      { col: 14, row: 0 },
      { col: 14, row: 4 },
      { col: 1, row: 4 },
      { col: 1, row: 9 },
      { col: 15, row: 9 },
    ],
    walls: [
      { col: 5, row: 2 },
      { col: 10, row: 2 },
      { col: 6, row: 6 },
      { col: 11, row: 7 },
    ],
  },
  {
    id: 'sector-12',
    name: 'Màn 12 · Lò Luyện Ngục Hỏa',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 28 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Chữ M ngược cắt chéo · Đặc quyền riêng: Đàn Tên Lửa Ngục Hỏa.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 300,
    startCoreHp: 25,
    totalWaves: 28,
    path: [
      { col: 0, row: 9 },
      { col: 3, row: 9 },
      { col: 3, row: 2 },
      { col: 7, row: 2 },
      { col: 7, row: 7 },
      { col: 11, row: 7 },
      { col: 11, row: 1 },
      { col: 15, row: 1 },
    ],
    walls: [
      { col: 5, row: 5 },
      { col: 9, row: 4 },
      { col: 13, row: 5 },
    ],
  },
  {
    id: 'sector-13',
    name: 'Màn 13 · Tổ Ong Bóng Đêm',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 30 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Vách tổ ong chia ô · Đặc quyền riêng: Tổ Ong Bóng Đêm.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 315,
    startCoreHp: 25,
    totalWaves: 30,
    path: [
      { col: 1, row: 0 },
      { col: 1, row: 7 },
      { col: 5, row: 7 },
      { col: 5, row: 1 },
      { col: 9, row: 1 },
      { col: 9, row: 8 },
      { col: 13, row: 8 },
      { col: 13, row: 3 },
      { col: 15, row: 3 },
    ],
    walls: [
      { col: 3, row: 4 },
      { col: 7, row: 4 },
      { col: 11, row: 5 },
    ],
  },
  {
    id: 'sector-14',
    name: 'Màn 14 · Tuyến Phòng Thủ Omega',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 32 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Tuyến công trực diện · Đặc quyền riêng: Máy Phá Nhiễu Omega.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 330,
    startCoreHp: 26,
    totalWaves: 32,
    path: [
      { col: 0, row: 5 },
      { col: 4, row: 5 },
      { col: 4, row: 1 },
      { col: 10, row: 1 },
      { col: 10, row: 8 },
      { col: 15, row: 8 },
    ],
    walls: [
      { col: 7, row: 3 },
      { col: 7, row: 5 },
      { col: 12, row: 5 },
      { col: 2, row: 8 },
    ],
  },
  {
    id: 'sector-15',
    name: 'Màn 15 · Vành Đai Sinh Tử',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 34 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Vành đai kép 34 đợt · Đặc quyền riêng: Lưỡi Hái Ngọc Lục Bảo.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 345,
    startCoreHp: 26,
    totalWaves: 34,
    path: [
      { col: 0, row: 1 },
      { col: 14, row: 1 },
      { col: 14, row: 8 },
      { col: 2, row: 8 },
      { col: 2, row: 4 },
      { col: 11, row: 4 },
      { col: 11, row: 5 },
      { col: 15, row: 5 },
    ],
    walls: [
      { col: 5, row: 6 },
      { col: 8, row: 6 },
      { col: 6, row: 2 },
    ],
  },
  {
    id: 'sector-16',
    name: 'Màn 16 · Đế Chế Hư Không',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 36 Đợt',
    subtitle: 'Bản đồ rộng 16×10 · Đại chiến 36–42 đợt x2 · Đặc quyền riêng: Pháo Hoàng Đế Hư Không.',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 365,
    startCoreHp: 28,
    totalWaves: 36,
    path: [
      { col: 0, row: 8 },
      { col: 5, row: 8 },
      { col: 5, row: 1 },
      { col: 1, row: 1 },
      { col: 1, row: 4 },
      { col: 12, row: 4 },
      { col: 12, row: 8 },
      { col: 15, row: 8 },
    ],
    walls: [
      { col: 8, row: 2 },
      { col: 8, row: 6 },
      { col: 3, row: 6 },
      { col: 14, row: 2 },
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
export function getGunCombatProfile(
  type: GunType,
  rawLevel: number,
  variant: GunVariant = 'alpha'
): GunCombatProfile {
  const level = Math.max(1, Math.min(MAX_GUN_LEVEL, Math.round(rawLevel)));
  const item = getGunCatalogItem(type);
  const vSpec = item.variants[variant] ?? item.variants.alpha;

  // Calibrated Lv1 -> Lv10 progression (~5.22x dmg, ~1.58x ROF) + Variant branch tuning
  const lvOffset = level - 1;
  const dmgMult = (1 + lvOffset * 0.25 + Math.pow(lvOffset, 1.38) * 0.095) * vSpec.damageMult;
  const rofMult = (1 + lvOffset * 0.055 + (level === 10 ? 0.08 : 0)) * vSpec.rofMult;
  const rangeBonusTiles =
    lvOffset * 0.075 + (level >= 7 ? 0.1 : 0) + (level === 10 ? 0.15 : 0) + vSpec.rangeBonus;

  const damage = Math.round(item.baseDamage * dmgMult);
  const cooldownSec = Number((item.baseCooldown / rofMult).toFixed(3));
  const rangeTiles = Number((item.rangeTiles + rangeBonusTiles).toFixed(2));
  const rangePx = Math.round(rangeTiles * TILE_SIZE);

  let armorPierce = 0.1 + lvOffset * 0.025;
  let shieldMult = 1;
  let splashRadius = 0;
  let projectilesPerShot = 1;
  let chainCount = 1;
  let slowPct = 0;
  let brittleBonus = 0;
  let burnDps = 0;
  let pullForce = 0;

  if (type === 'gatling') {
    armorPierce = level >= 10 ? 0.75 : level >= 3 ? 0.35 + (level - 3) * 0.045 : 0.12;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = level >= 7 ? 22 + (level - 7) * 3 : 0;
    shieldMult = level >= 7 ? 1.15 : 1;
  } else if (type === 'shotgun') {
    projectilesPerShot = level >= 10 ? 9 : level >= 7 ? 7 : level >= 3 ? 6 : 5;
    armorPierce = level >= 5 ? 0.32 + (level - 5) * 0.05 : 0.12;
    burnDps = level >= 5 ? Math.round(damage * 0.45) : 0;
    shieldMult = 1.1;
  } else if (type === 'flamer') {
    armorPierce = level >= 5 ? 0.72 : 0.45;
    burnDps = Math.round(damage * (level >= 3 ? 0.68 : 0.48));
    slowPct = level >= 7 ? 0.18 : 0;
    shieldMult = level >= 5 ? 1.15 : 1;
  } else if (type === 'cryo') {
    armorPierce = 0.55;
    slowPct = level >= 10 ? 0.44 : level >= 7 ? 0.38 : level >= 3 ? 0.32 : 0.24;
    brittleBonus = level >= 10 ? 0.24 : level >= 5 ? 0.15 + (level - 5) * 0.02 : 0;
    shieldMult = 1.1;
  } else if (type === 'tesla') {
    armorPierce = 0.65;
    chainCount = level >= 10 ? 7 : level >= 7 ? 5 : level >= 3 ? 4 : 3;
    shieldMult = level >= 5 ? 1.65 + (level - 5) * 0.04 : 1.25;
    slowPct = 0.2 + lvOffset * 0.015;
    splashRadius = level >= 10 ? 38 : 0;
  } else if (type === 'missile') {
    armorPierce = 0.42 + lvOffset * 0.03;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = 64 + lvOffset * 4 + (level >= 3 ? 12 : 0);
    shieldMult = 1.15;
  } else if (type === 'railgun') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.85 : 0.55;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    shieldMult = level >= 5 ? 1.75 : 1.3;
    splashRadius = level >= 7 ? 36 + (level - 7) * 5 : 0;
  } else if (type === 'mortar') {
    armorPierce = 0.55 + lvOffset * 0.025;
    projectilesPerShot = level >= 10 ? 2 : 1;
    splashRadius = 76 + lvOffset * 4 + (level >= 7 ? 10 : 0);
    pullForce = level >= 3 ? 10 + (level - 3) * 1.5 : 4;
    slowPct = level >= 5 ? 0.3 : 0.18;
    burnDps = level >= 5 ? Math.round(damage * 0.16) : 0;
  } else if (type === 'sniper') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.75 : 0.48;
    projectilesPerShot = level >= 10 ? 2 : 1;
    shieldMult = level >= 3 ? 1.35 : 1.1;
    splashRadius = 0;
  } else if (type === 'acid') {
    armorPierce = 0.75;
    projectilesPerShot = level >= 7 ? 2 : 1;
    splashRadius = level >= 5 ? 64 : 50 + lvOffset * 2;
    slowPct = level >= 10 ? 0.34 : level >= 5 ? 0.26 : 0.18;
    burnDps = Math.round(damage * (level >= 10 ? 0.65 : 0.48));
    shieldMult = 1.05;
  } else if (type === 'saw') {
    armorPierce = level >= 5 ? 0.52 : 0.32;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    chainCount = level >= 10 ? 7 : level >= 7 ? 5 : level >= 3 ? 4 : 3;
    burnDps = level >= 5 ? Math.round(damage * 0.32) : 0;
    shieldMult = 1.1;
  } else if (type === 'beacon') {
    armorPierce = 0.6;
    splashRadius = Math.round((item.rangeTiles + rangeBonusTiles) * TILE_SIZE);
    slowPct = level >= 5 ? 0.16 : 0;
    shieldMult = 1.2;
  } else if (type === 'cannon') {
    armorPierce = level >= 10 ? 0.9 : level >= 3 ? 0.65 : 0.4;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 82 : level >= 5 ? 62 : level >= 3 ? 48 : 34;
    shieldMult = 1.15;
  } else if (type === 'plasma') {
    armorPierce = 0.45 + lvOffset * 0.03;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 72 : level >= 5 ? 52 : 34;
    shieldMult = level >= 10 ? 1.95 : level >= 3 ? 1.55 : 1.3;
    burnDps = level >= 3 ? Math.round(damage * 0.4) : Math.round(damage * 0.2);
    pullForce = level >= 5 ? 6 : 0;
  } else if (type === 'cluster') {
    armorPierce = level >= 10 ? 0.52 : 0.32;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 102 : level >= 3 ? 72 + (level - 3) * 4 : 58;
    burnDps = level >= 5 ? Math.round(damage * 0.45) : 0;
    shieldMult = 1.1;
  } else if (type === 'hunter') {
    armorPierce = level >= 10 ? 0.85 : 0.4 + lvOffset * 0.045;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : level >= 3 ? 2 : 1;
    shieldMult = level >= 3 ? 1.45 : 1.18;
    splashRadius = 20;
  } else if (type === 'prism_laser') {
    armorPierce = level >= 10 ? 0.9 : 0.45 + lvOffset * 0.04;
    chainCount = level >= 10 ? 6 : level >= 7 ? 4 : level >= 3 ? 3 : 1;
    shieldMult = level >= 5 ? 1.55 : 1.25;
    burnDps = level >= 5 ? Math.round(damage * 0.38) : 0;
    splashRadius = level >= 10 ? 28 : 0;
  } else if (type === 'tempest') {
    armorPierce = level >= 10 ? 0.75 : 0.36 + lvOffset * 0.035;
    projectilesPerShot = level >= 10 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 10 ? 78 : level >= 7 ? 58 : 36;
    shieldMult = level >= 5 ? 1.65 : 1.28;
    slowPct = level >= 10 ? 0.32 : level >= 3 ? 0.26 : 0.18;
  } else if (type === 'sonic') {
    armorPierce = level >= 10 ? 0.8 : 0.4 + lvOffset * 0.04;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = Math.round((item.rangeTiles + rangeBonusTiles) * TILE_SIZE);
    shieldMult = level >= 7 ? 1.55 : 1.15;
    slowPct = level >= 5 ? 0.25 : 0.12;
  } else if (type === 'gravity_lance') {
    armorPierce = level >= 10 ? 0.95 : level >= 5 ? 0.78 : 0.5;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 52 : level >= 3 ? 28 : 0;
    pullForce = level >= 3 ? 12 + (level - 3) * 1.1 : 0;
    shieldMult = level >= 5 ? 1.35 : 1.15;
  } else if (type === 'amp_spire') {
    armorPierce = level >= 10 ? 0.72 : 0.42 + lvOffset * 0.03;
    splashRadius = Math.round((item.rangeTiles + rangeBonusTiles) * TILE_SIZE);
    shieldMult = 1.25;
  } else if (type === 'radar') {
    armorPierce = level >= 10 ? 0.75 : 0.4 + lvOffset * 0.035;
    splashRadius = Math.round((item.rangeTiles + rangeBonusTiles) * TILE_SIZE);
    slowPct = level >= 3 ? 0.14 : 0.08;
    brittleBonus = level >= 10 ? 0.3 : level >= 5 ? 0.2 : 0.14;
    shieldMult = 1.2;
  } else if (type === 'aegis_field') {
    armorPierce = level >= 10 ? 0.68 : 0.38 + lvOffset * 0.03;
    splashRadius = Math.round((item.rangeTiles + rangeBonusTiles) * TILE_SIZE);
    slowPct = level >= 10 ? 0.32 : level >= 3 ? 0.24 : 0.16;
    pullForce = level >= 5 ? 12 + (level - 5) * 1.2 : 0;
    shieldMult = level >= 10 ? 2.45 : level >= 3 ? 2.05 : 1.75;
  } else if (type === 'map01_cyber_smg') {
    armorPierce = level >= 10 ? 0.65 : 0.25 + lvOffset * 0.04;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : level >= 3 ? 2 : 1;
    shieldMult = level >= 3 ? 1.3 : 1.1;
    slowPct = level >= 7 ? 0.16 : 0;
  } else if (type === 'map02_matrix_spire') {
    armorPierce = level >= 10 ? 0.82 : 0.42 + lvOffset * 0.04;
    chainCount = level >= 10 ? 7 : level >= 7 ? 5 : level >= 3 ? 3 : 1;
    shieldMult = level >= 7 ? 1.45 : 1.2;
    burnDps = level >= 5 ? Math.round(damage * 0.35) : 0;
    splashRadius = level >= 10 ? 34 : 0;
  } else if (type === 'map03_forge_magma') {
    armorPierce = level >= 10 ? 0.72 : 0.4 + lvOffset * 0.035;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 7 ? 68 : 52 + lvOffset * 2;
    burnDps = Math.round(damage * (level >= 3 ? 0.62 : 0.4));
    slowPct = level >= 3 ? 0.2 : 0;
    shieldMult = 1.1;
  } else if (type === 'map04_void_katana') {
    armorPierce = level >= 10 ? 0.9 : level >= 5 ? 0.7 : 0.42;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    shieldMult = level >= 5 ? 1.38 : 1.15;
    burnDps = level >= 10 ? Math.round(damage * 0.35) : 0;
  } else if (type === 'map05_dune_needler') {
    armorPierce = level >= 10 ? 0.75 : 0.32 + lvOffset * 0.045;
    projectilesPerShot = level >= 10 ? 5 : level >= 5 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 10 ? 48 : level >= 3 ? 32 : 0;
    slowPct = level >= 5 ? 0.22 : 0;
    burnDps = level >= 7 ? Math.round(damage * 0.35) : 0;
    brittleBonus = level >= 7 ? 0.15 : 0;
  } else if (type === 'map06_aurora_beam') {
    armorPierce = level >= 10 ? 0.85 : level >= 7 ? 0.75 : 0.45;
    chainCount = level >= 10 ? 7 : level >= 7 ? 5 : level >= 5 ? 3 : 1;
    slowPct = level >= 3 ? 0.3 : 0.2;
    brittleBonus = level >= 3 ? 0.16 : 0;
    shieldMult = level >= 5 ? 1.45 : 1.15;
    splashRadius = level >= 10 ? 44 : 0;
  } else if (type === 'map07_cyclone_rotary') {
    armorPierce = level >= 10 ? 0.8 : level >= 5 ? 0.6 : 0.3;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 7 ? 26 : 0;
    shieldMult = 1.12;
  } else if (type === 'map08_titan_flak') {
    armorPierce = level >= 10 ? 0.85 : level >= 5 ? 0.68 : 0.42;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 92 : level >= 7 ? 74 : 52;
    shieldMult = 1.2;
  } else if (type === 'map09_venom_hydra') {
    armorPierce = 0.78;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 10 ? 75 : 54 + lvOffset * 2;
    slowPct = level >= 5 ? 0.3 : 0.18;
    burnDps = Math.round(damage * (level >= 10 ? 0.65 : 0.48));
    shieldMult = 1.1;
  } else if (type === 'map10_meteor_rail') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.85 : 0.55;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    splashRadius = level >= 10 ? 80 : level >= 5 ? 58 : 0;
    shieldMult = 1.45;
  } else if (type === 'map11_cryo_shatter') {
    armorPierce = level >= 10 ? 0.9 : level >= 7 ? 0.7 : 0.42;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : 1;
    splashRadius = level >= 10 ? 68 : level >= 5 ? 48 : 0;
    slowPct = level >= 3 ? 0.32 : 0.24;
    brittleBonus = level >= 10 ? 0.3 : level >= 3 ? 0.2 : 0.12;
    shieldMult = 1.18;
  } else if (type === 'map12_hellfire_organ') {
    armorPierce = level >= 10 ? 0.65 : 0.36 + lvOffset * 0.03;
    projectilesPerShot = level >= 10 ? 6 : level >= 7 ? 5 : level >= 3 ? 3 : 2;
    splashRadius = level >= 10 ? 84 : 56 + lvOffset * 2;
    burnDps = level >= 5 ? Math.round(damage * 0.42) : 0;
    shieldMult = 1.15;
  } else if (type === 'map13_shadow_hive') {
    armorPierce = level >= 10 ? 0.8 : level >= 5 ? 0.55 : 0.32;
    projectilesPerShot = level >= 10 ? 4 : level >= 7 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 7 ? 34 : 18;
    shieldMult = level >= 5 ? 1.55 : 1.18;
  } else if (type === 'map14_omega_disruptor') {
    armorPierce = level >= 10 ? 0.85 : 0.42 + lvOffset * 0.04;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = level >= 7 ? 64 : 44;
    shieldMult = level >= 10 ? 2.3 : level >= 3 ? 2.0 : 1.45;
    slowPct = level >= 5 ? 0.28 : 0.16;
  } else if (type === 'map15_emerald_reaper') {
    armorPierce = level >= 10 ? 0.82 : 0.45 + lvOffset * 0.035;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    chainCount = level >= 10 ? 9 : level >= 7 ? 7 : level >= 3 ? 5 : 3;
    burnDps = level >= 5 ? Math.round(damage * 0.38) : 0;
    shieldMult = 1.25;
  } else if (type === 'map16_void_sovereign') {
    armorPierce = level >= 10 ? 1.0 : level >= 3 ? 0.8 : 0.52;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = level >= 10 ? 96 : level >= 5 ? 70 : 45;
    pullForce = level >= 5 ? 8 : 0;
    burnDps = level >= 5 ? Math.round(damage * 0.42) : 0;
    shieldMult = level >= 3 ? 1.55 : 1.25;
  }

  armorPierce = Math.min(1, Number((armorPierce + vSpec.armorPierceBonus).toFixed(3)));
  shieldMult = Number((shieldMult + vSpec.shieldMultBonus).toFixed(2));
  if (splashRadius > 0 || vSpec.splashBonus > 0) {
    splashRadius = Math.round(splashRadius + vSpec.splashBonus);
  }
  if (vSpec.extraProjectiles > 0) {
    projectilesPerShot += vSpec.extraProjectiles;
  }
  if (vSpec.extraChain > 0) {
    chainCount += vSpec.extraChain;
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

  let effectiveShots = 1;
  if (type === 'gatling' || type === 'map01_cyber_smg' || type === 'map07_cyclone_rotary') {
    effectiveShots = projectilesPerShot >= 5 ? 1.9 : projectilesPerShot === 4 ? 1.76 : projectilesPerShot === 3 ? 1.62 : projectilesPerShot === 2 ? 1.4 : 1;
  } else if (type === 'shotgun') {
    effectiveShots = Math.min(5.2, projectilesPerShot * (level >= 10 ? 0.5 : level >= 7 ? 0.52 : 0.56));
  } else if (
    type === 'tesla' ||
    type === 'saw' ||
    type === 'prism_laser' ||
    type === 'map02_matrix_spire' ||
    type === 'map06_aurora_beam' ||
    type === 'map15_emerald_reaper'
  ) {
    const sawMulti =
      type === 'saw' || type === 'map15_emerald_reaper'
        ? projectilesPerShot >= 3
          ? 1.5
          : projectilesPerShot === 2
            ? 1.36
            : 1
        : 1;
    effectiveShots = sawMulti * Math.min(2.45, 1 + (chainCount - 1) * 0.22);
  } else if (type === 'sniper') {
    const critFactor = level >= 10 ? 1.3 : level >= 5 ? 1.15 : 1;
    effectiveShots = projectilesPerShot * (projectilesPerShot === 2 ? 0.65 : 1) * critFactor;
  } else if (
    type === 'missile' ||
    type === 'acid' ||
    type === 'plasma' ||
    type === 'tempest' ||
    type === 'map03_forge_magma' ||
    type === 'map09_venom_hydra' ||
    type === 'map14_omega_disruptor' ||
    type === 'map16_void_sovereign'
  ) {
    effectiveShots = projectilesPerShot >= 4 ? 1.7 : projectilesPerShot === 3 ? 1.56 : projectilesPerShot === 2 ? 1.32 : 1;
  } else if (type === 'railgun' || type === 'gravity_lance' || type === 'map10_meteor_rail') {
    effectiveShots = projectilesPerShot >= 3 ? 1.35 : projectilesPerShot === 2 ? 1.24 : 1;
  } else if (type === 'mortar') {
    effectiveShots = projectilesPerShot === 2 ? 1.24 : 1;
  } else if (type === 'cannon' || type === 'cluster' || type === 'map08_titan_flak' || type === 'map04_void_katana') {
    effectiveShots = projectilesPerShot >= 3 ? 1.44 : projectilesPerShot === 2 ? 1.28 : 1;
  } else if (type === 'hunter' || type === 'map13_shadow_hive' || type === 'map11_cryo_shatter' || type === 'map05_dune_needler') {
    effectiveShots = projectilesPerShot >= 5 ? 1.96 : projectilesPerShot === 4 ? 1.84 : projectilesPerShot === 3 ? 1.68 : projectilesPerShot === 2 ? 1.44 : 1;
  } else if (type === 'sonic') {
    effectiveShots = projectilesPerShot === 3 ? 1.38 : projectilesPerShot === 2 ? 1.22 : 1;
  } else if (type === 'map12_hellfire_organ') {
    effectiveShots = Math.min(2.15, 1 + (projectilesPerShot - 1) * 0.21);
  }
  const dpsEstimate = Math.round((damage * effectiveShots) / cooldownSec);

  const unlockedSkills = item.milestones.filter((m) => level >= m.level);
  const nextSkill = item.milestones.find((m) => m.level > level) ?? null;

  return {
    level,
    variant: vSpec.id,
    variantSpec: vSpec,
    overheatSkill: item.overheatSkill,
    accentColor: vSpec.accentColor,
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

export function isSupportGunType(type: GunType): boolean {
  return type === 'beacon' || type === 'amp_spire' || type === 'radar' || type === 'aegis_field';
}

export interface TeamSupportBuff {
  readonly speedMult: number;
  readonly damageMult: number;
  readonly rangeBonusTiles: number;
  readonly armorPierceBonus: number;
  readonly shieldMultBonus: number;
  readonly heatCoolMult: number;
  readonly hasSupportLink: boolean;
  readonly linkColors: string[];
}

export function computeTeamSupportBuffAtTile(
  guns: readonly PlacedGun[],
  col: number,
  row: number
): TeamSupportBuff {
  let speedBonus = 0;
  let dmgBonus = 0;
  let rangeBonusTiles = 0;
  let armorPierceBonus = 0;
  let shieldMultBonus = 0;
  let heatCoolBonus = 0;
  const linkColors: string[] = [];
  const targetPt = gridToWorldCenter(col, row);

  for (const g of guns) {
    if (!isSupportGunType(g.type)) continue;
    if (g.col === col && g.row === row) continue;
    const variant = g.variant ?? 'alpha';
    const supportProfile = getGunCombatProfile(g.type, g.level, variant);
    const gPt = gridToWorldCenter(g.col, g.row);
    const dist = Math.hypot(gPt.x - targetPt.x, gPt.y - targetPt.y);
    if (dist > supportProfile.rangePx + 4) continue;

    if (g.type === 'beacon') {
      const sp = g.level >= 10 ? 0.3 : g.level >= 7 ? 0.22 : g.level >= 3 ? 0.14 : 0.08;
      const dm = g.level >= 10 ? 0.24 : g.level >= 7 ? 0.16 : g.level >= 3 ? 0.1 : 0.06;
      speedBonus += sp;
      dmgBonus += dm;
      if (!linkColors.includes('#FACC15')) linkColors.push('#FACC15');
    } else if (g.type === 'amp_spire') {
      const cool = (g.level >= 10 ? 0.3 : g.level >= 7 ? 0.24 : g.level >= 3 ? 0.18 : 0.12) + (variant === 'alpha' ? 0.06 : 0);
      const sp = g.level >= 10 ? 0.12 : g.level >= 5 ? 0.06 : 0;
      const ap = (g.level >= 10 ? 0.18 : g.level >= 5 ? 0.1 : 0.04) + (variant === 'omega' ? 0.06 : 0);
      heatCoolBonus += cool;
      speedBonus += sp;
      armorPierceBonus += ap;
      if (!linkColors.includes('#34D399')) linkColors.push('#34D399');
    } else if (g.type === 'radar') {
      const rb = (g.level >= 10 ? 0.85 : g.level >= 7 ? 0.65 : g.level >= 3 ? 0.4 : 0.25) + (variant === 'alpha' ? 0.15 : 0);
      const ap = (g.level >= 10 ? 0.24 : g.level >= 7 ? 0.16 : g.level >= 3 ? 0.08 : 0.05) + (variant === 'omega' ? 0.06 : 0);
      const dm = g.level >= 10 ? 0.06 : 0.03;
      rangeBonusTiles += rb;
      armorPierceBonus += ap;
      dmgBonus += dm;
      if (!linkColors.includes('#22D3EE')) linkColors.push('#22D3EE');
    } else if (g.type === 'aegis_field') {
      const sh = (g.level >= 10 ? 0.55 : g.level >= 7 ? 0.4 : g.level >= 3 ? 0.25 : 0.15) + (variant === 'omega' ? 0.15 : 0);
      const sp = g.level >= 10 ? 0.16 : g.level >= 5 ? 0.1 : 0.06;
      const dm = g.level >= 10 ? 0.06 : 0.03;
      shieldMultBonus += sh;
      speedBonus += sp;
      dmgBonus += dm;
      if (!linkColors.includes('#60A5FA')) linkColors.push('#60A5FA');
    }
  }

  return {
    speedMult: Number(Math.min(1.55, 1 + speedBonus).toFixed(2)),
    damageMult: Number(Math.min(1.45, 1 + dmgBonus).toFixed(2)),
    rangeBonusTiles: Number(Math.min(1.4, rangeBonusTiles).toFixed(2)),
    armorPierceBonus: Number(Math.min(0.45, armorPierceBonus).toFixed(3)),
    shieldMultBonus: Number(Math.min(0.95, shieldMultBonus).toFixed(2)),
    heatCoolMult: Number(Math.min(1.85, 1 + heatCoolBonus).toFixed(2)),
    hasSupportLink: linkColors.length > 0,
    linkColors,
  };
}

export function computeBeaconBuffAtTile(
  guns: readonly PlacedGun[],
  col: number,
  row: number
): { speedMult: number; damageMult: number } {
  const buff = computeTeamSupportBuffAtTile(guns, col, row);
  return {
    speedMult: buff.speedMult,
    damageMult: buff.damageMult,
  };
}

export interface WaveSpawnItem {
  readonly kind: EnemyKind;
  readonly delaySec: number;
  readonly isElite?: boolean;
}

/**
 * Extended tactical waves (3.5x–3.7x longer active play duration per wave) with squad bursts,
 * mid-wave mini-bosses, and accelerated archetype/boss escalation.
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
  // Ramp difficulty bonus quickly over waves 1..3
  const rampedBonus = Math.round(diffCfg.waveCountBonus * Math.min(1, Math.max(0, waveNumber - 1) / 2.5));
  // Escalating swarm size from Wave 2 onward so late waves unleash dense multi-squad hordes
  const lateSwarmBonus =
    waveNumber >= 2
      ? Math.round((waveNumber - 1) * 4.2 + Math.pow(Math.max(0, waveNumber - 3), 1.5) * 3.8)
      : 0;
  const baseRaw =
    20 +
    Math.round(waveNumber * 4.0) +
    (waveNumber >= 5 ? (waveNumber - 4) * 2 : 0) +
    rampedBonus +
    lateSwarmBonus;
  // ~2.65x squad composition (W1=64 enemies) scaling aggressively upward in W2+
  const rawCount = Math.round(baseRaw * 2.65);
  const count =
    mode === 'boss_rush'
      ? Math.max(22, Math.round(rawCount * 0.54))
      : Math.max(28, Math.round(rawCount * (modeCfg.swarmCountMult ?? 1)));
  let elapsed = 0.25;

  const swarmCompression = waveNumber >= 2 ? 1 / (1 + (waveNumber - 1) * 0.145) : 1;

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
    if (waveNumber >= 1 && waveNumber === 1 && i >= count - 6 && difficulty !== 'easy') kind = 'armored';
    if (waveNumber >= 2 && i % 4 === 2) kind = 'armored';
    if (waveNumber >= 2 && i % 5 === 1) kind = 'splitter';
    if (waveNumber >= 2 && i % 6 === 3) kind = 'stealth';
    if (waveNumber >= 3 && i % 6 === 4) kind = 'healer';
    if (waveNumber >= 3 && i % 6 === 5) kind = 'teleporter';
    if (waveNumber >= 3 && i % 5 === 0 && i > 0) kind = 'shieldbearer';
    if (waveNumber >= 2 && i % 7 === 6) kind = 'berserker';
    if (waveNumber >= 4 && i % 8 === 7) kind = 'leech';
    if (waveNumber >= 4 && i % 8 === 6) kind = 'juggernaut';
    if (waveNumber >= 5 && i % 9 === 8) kind = 'summoner';
    if (waveNumber >= 7 && i % 11 === 4) kind = 'juggernaut';

    if (mode === 'boss_rush') {
      if (i % 4 === 3 || i === count - 1) {
        kind = 'boss';
      } else if (i % 4 === 0) {
        kind = 'juggernaut';
      } else if (i % 4 === 1) {
        kind = 'summoner';
      } else {
        kind = 'berserker';
      }
    } else {
      const isVanguardBoss = waveNumber >= 6 && i === Math.floor(count * 0.32);
      const isSecondBoss = waveNumber >= 9 && i === Math.floor(count * 0.66);
      const isMidBossWave = waveNumber >= 3 && i === Math.floor(count * 0.55);
      const isMajorBossWave =
        waveNumber === totalWaves ||
        waveNumber % 3 === 0 ||
        waveNumber >= 8;

      if ((isMajorBossWave && i === count - 1) || isMidBossWave || isVanguardBoss || isSecondBoss) {
        kind = 'boss';
      }
      if (waveNumber >= 6 && isMajorBossWave && i >= count - 2) {
        kind = 'boss';
      }
      if (waveNumber >= 9 && i >= count - (difficulty === 'hell' ? 5 : 3)) {
        kind = 'boss';
      }
    }

    const eliteModulo = Math.max(
      2,
      Math.round(6 - diffCfg.eliteChanceBoost * 12 - Math.min(2.5, Math.max(0, waveNumber - 2) * 0.35))
    );
    const isElite =
      kind !== 'boss' &&
      ((mode === 'boss_rush' && i % 2 === 1) ||
        (waveNumber >= 3 && i % eliteModulo === eliteModulo - 1) ||
        (difficulty === 'hell' && waveNumber >= 2 && i % 4 === 3));
    items.push({ kind, delaySec: Number(elapsed.toFixed(3)), isElite });

    // Tighter spawn intervals in later waves pack more enemies on screen simultaneously
    const baseGapRaw = Math.max(
      0.46,
      1.56 - waveNumber * 0.032 - (difficulty === 'hell' ? 0.065 : difficulty === 'hard' ? 0.032 : 0)
    );
    const baseGap = Math.max(0.24, (baseGapRaw * swarmCompression) / modeCfg.spawnRateMult);
    const squadRhythm = i % 6 === 5 ? 1.48 : 0.92;
    const roleSpacing =
      kind === 'splitter' || kind === 'berserker'
        ? baseGap * 0.8
        : kind === 'stealth' || kind === 'teleporter'
          ? baseGap * 0.86
          : kind === 'boss' || kind === 'juggernaut'
            ? baseGap * 1.24
            : baseGap;
    elapsed += roleSpacing * squadRhythm;
  }
  return items;
}

/**
 * Escalating late-wave power surge (HP, shield, armor, and march speed scale aggressively from Wave 2+)
 * while keeping Wave 1 opening approachable.
 */
export const ENEMY_KILL_COIN_BOOST = 1.1;

export function boostEnemyKillReward(baseReward: number): number {
  return Math.max(baseReward + 1, Math.round(baseReward * ENEMY_KILL_COIN_BOOST));
}

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

  const effectiveWave =
    waveNumber <= 12
      ? 1 + (waveNumber - 1) * 1.95
      : 1 + 11 * 1.95 + (waveNumber - 12) * 0.85;
  const baseScale =
    1.15 + (effectiveWave - 1) * 0.44 + Math.pow(Math.max(0, effectiveWave - 2), 1.46) * 0.28;
  const latePowerSurge =
    waveNumber <= 12
      ? waveNumber >= 2
        ? 1 + Math.pow(waveNumber - 1, 1.32) * 0.16
        : 1
      : 1 + Math.pow(11, 1.32) * 0.16 + (waveNumber - 12) * 0.38;
  const openingGrace =
    difficulty === 'hell' && waveNumber <= 2
      ? waveNumber === 1
        ? 0.29
        : 0.62
      : difficulty === 'hard' && waveNumber === 1
        ? 0.56
        : 1.0;
  const bossRushEarlyDamper = mode === 'boss_rush' && waveNumber <= 2 ? 0.52 : 1.0;
  const eliteMult = isElite ? 1.65 : 1;
  const hpScale =
    baseScale *
    latePowerSurge *
    eliteMult *
    diffCfg.hpMult *
    (modeCfg.hpMult ?? 1) *
    openingGrace *
    bossRushEarlyDamper;
  const shieldWaveSurge = 1 + Math.max(0, waveNumber - 2) * 0.08;
  const shieldScale =
    baseScale *
    latePowerSurge *
    shieldWaveSurge *
    eliteMult *
    diffCfg.shieldMult *
    (modeCfg.shieldMult ?? 1) *
    openingGrace *
    bossRushEarlyDamper;
  const speedBonus = Math.min(78, effectiveWave * 2.2 + Math.max(0, waveNumber - 3) * 2.4);
  const totalSpeedMult = diffCfg.speedMult * modeCfg.speedMult;
  const swarmEconomyDamp = 1 / (1 + Math.max(0, waveNumber - 3) * 0.055);
  const rewardScale = diffCfg.rewardMult * modeCfg.rewardMult * (isElite ? 1.35 : 1) * 0.56 * swarmEconomyDamp;
  const scoreMultTotal = diffCfg.scoreMult * modeCfg.scoreMult;
  const lateArmorBoost = Math.min(0.14, Math.max(0, waveNumber - 4) * 0.015);
  const armorAdd = (waveNumber === 1 ? diffCfg.armorBonus * 0.3 : diffCfg.armorBonus) + lateArmorBoost;

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
      reward: boostEnemyKillReward(Math.max(8, Math.round((15 + Math.floor(effectiveWave * 0.55)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(6, Math.round((11 + Math.floor(effectiveWave * 0.4)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(7, Math.round((14 + Math.floor(effectiveWave * 0.5)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(9, Math.round((19 + Math.floor(effectiveWave * 0.65)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(8, Math.round((17 + Math.floor(effectiveWave * 0.55)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(10, Math.round((21 + Math.floor(effectiveWave * 0.75)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(8, Math.round((16 + Math.floor(effectiveWave * 0.52)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(14, Math.round((28 + Math.floor(effectiveWave * 0.95)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(12, Math.round((25 + Math.floor(effectiveWave * 0.85)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(10, Math.round((20 + Math.floor(effectiveWave * 0.7)) * rewardScale))),
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
      reward: boostEnemyKillReward(Math.max(30, Math.round((78 + effectiveWave * 3.2) * rewardScale))),
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
    reward: boostEnemyKillReward(Math.max(7, Math.round((13 + Math.floor(effectiveWave * 0.42)) * rewardScale))),
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
  if (pullForce <= 0 || enemy.kind === 'boss' || enemy.kind === 'juggernaut') return;
  const basis = getSegmentBasis(map, enemy.waypointIndex);
  if (!basis) return;
  const { a, segLen, tx, ty, nx, ny } = basis;
  const anchorProj = Math.max(0, Math.min(segLen, (anchorX - a.x) * tx + (anchorY - a.y) * ty));
  const enemyProj = Math.max(0, Math.min(segLen, (enemy.x - a.x) * tx + (enemy.y - a.y) * ty));
  const diffProj = anchorProj - enemyProj;
  if (Math.abs(diffProj) <= 2) return;

  const clampedForce = Math.min(18, pullForce);
  const step = Math.sign(diffProj) * Math.min(Math.abs(diffProj), clampedForce);
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

    let stunSpeedMult = 1;
    if (enemy.stunTimer > 0) {
      enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      stunSpeedMult = enemy.kind === 'boss' ? 0.78 : enemy.kind === 'juggernaut' ? 0.82 : 0.62;
    }

    if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (enemy.slowTimer <= 0) {
        enemy.slowFactor = 1;
        enemy.brittleBonus = 0;
      }
    }

    // Enemies never freeze completely still: enforce a strict minimum movement floor
    const rawSlowFactor = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    const resistedSlow =
      enemy.kind === 'juggernaut' && rawSlowFactor < 1
        ? 1 - (1 - rawSlowFactor) * 0.55
        : enemy.kind === 'boss' && rawSlowFactor < 1
          ? 1 - (1 - rawSlowFactor) * 0.72
          : rawSlowFactor;
    const minSpeedFloor =
      enemy.kind === 'boss' ? 0.55 : enemy.kind === 'juggernaut' ? 0.62 : 0.48;
    const speedFactor = Math.max(minSpeedFloor, resistedSlow * stunSpeedMult);
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
