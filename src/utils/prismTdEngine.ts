export type GunType =
  | 'gatling'
  | 'shotgun'
  | 'flamer'
  | 'saw'
  | 'mortar'
  | 'missile'
  | 'railgun'
  | 'prism_refract'
  | 'orbital'
  | 'hyperion'
  | 'singularity'
  | 'mothership'
  | 'supernova'
  | 'chronos'
  | 'aegis_bastion'
  | 'astral_ark'
  | 'aurelia_cannon'
  | 'paradox_scythe'
  | 'nebula_core'
  | 'tesla'
  | 'tempest'
  | 'aurora_spire'
  | 'beacon'
  | 'cryo'
  | 'radar'
  | 'quantum_prism';

export type GunCategory = 'attack' | 'electric' | 'support';

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
  | 'super_boss'
  | 'berserker'
  | 'juggernaut'
  | 'summoner'
  | 'leech';

export type BossWindupKind = 'shield_surge' | 'armor_bastion' | 'escort_deploy';

export type BossEmblemKind =
  | 'crown'
  | 'horns'
  | 'halo'
  | 'void_star'
  | 'frost_crest'
  | 'solar_wings'
  | 'chrono_dial';

export type MapBiome =
  | 'cyber_cyan'
  | 'emerald_matrix'
  | 'crimson_forge'
  | 'violet_void'
  | 'amber_desert'
  | 'arctic_core'
  | 'prismatic_nexus'
  | 'chrono_sanctum'
  | 'astral_abyss';

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
    pathBorder: 'rgba(56, 189, 248, 0.28)',
    trackGlow: 'rgba(56, 189, 248, 0.36)',
    wallFill: '#1E293B',
    wallStroke: '#64748B',
    accent: '#00E5FF',
  },
  emerald_matrix: {
    bg: '#04100C',
    gridLine: 'rgba(16, 185, 129, 0.14)',
    pathFill: '#0A221A',
    pathBorder: 'rgba(52, 211, 153, 0.28)',
    trackGlow: 'rgba(52, 211, 153, 0.36)',
    wallFill: '#132A23',
    wallStroke: '#10B981',
    accent: '#34D399',
  },
  crimson_forge: {
    bg: '#12060A',
    gridLine: 'rgba(244, 63, 94, 0.14)',
    pathFill: '#241018',
    pathBorder: 'rgba(251, 113, 133, 0.28)',
    trackGlow: 'rgba(251, 113, 133, 0.35)',
    wallFill: '#2B1720',
    wallStroke: '#FB7185',
    accent: '#FB7185',
  },
  violet_void: {
    bg: '#0B0616',
    gridLine: 'rgba(167, 139, 250, 0.14)',
    pathFill: '#18102E',
    pathBorder: 'rgba(196, 181, 253, 0.28)',
    trackGlow: 'rgba(192, 132, 252, 0.38)',
    wallFill: '#21183D',
    wallStroke: '#A78BFA',
    accent: '#C084FC',
  },
  amber_desert: {
    bg: '#120C04',
    gridLine: 'rgba(245, 158, 11, 0.14)',
    pathFill: '#24190B',
    pathBorder: 'rgba(251, 191, 36, 0.28)',
    trackGlow: 'rgba(251, 191, 36, 0.36)',
    wallFill: '#2C2012',
    wallStroke: '#F59E0B',
    accent: '#FBBF24',
  },
  arctic_core: {
    bg: '#050E17',
    gridLine: 'rgba(125, 211, 252, 0.16)',
    pathFill: '#0D2136',
    pathBorder: 'rgba(186, 230, 253, 0.3)',
    trackGlow: 'rgba(125, 211, 252, 0.42)',
    wallFill: '#162D45',
    wallStroke: '#7DD3FC',
    accent: '#BAE6FD',
  },
  prismatic_nexus: {
    bg: '#070512',
    gridLine: 'rgba(250, 204, 21, 0.16)',
    pathFill: '#17112B',
    pathBorder: 'rgba(56, 189, 248, 0.36)',
    trackGlow: 'rgba(250, 204, 21, 0.44)',
    wallFill: '#1F193B',
    wallStroke: '#FACC15',
    accent: '#FDE047',
  },
  chrono_sanctum: {
    bg: '#040611',
    gridLine: 'rgba(56, 189, 248, 0.16)',
    pathFill: '#12132E',
    pathBorder: 'rgba(167, 139, 250, 0.44)',
    trackGlow: 'rgba(34, 211, 238, 0.52)',
    wallFill: '#1B1C3E',
    wallStroke: '#38BDF8',
    accent: '#67E8F9',
  },
  astral_abyss: {
    bg: '#04030D',
    gridLine: 'rgba(232, 121, 249, 0.14)',
    pathFill: '#130D2B',
    pathBorder: 'rgba(240, 171, 252, 0.42)',
    trackGlow: 'rgba(232, 121, 249, 0.5)',
    wallFill: '#1E1540',
    wallStroke: '#E879F9',
    accent: '#F0ABFC',
  },
};

export interface GridPoint {
  readonly col: number;
  readonly row: number;
}

export type TileKind = 'empty' | 'path' | 'spawn' | 'core' | 'wall';

export type DifficultyId = 'easy' | 'normal' | 'hard' | 'hell' | 'super_hell' | 'nightmare';

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

export const DIFFICULTY_ORDER: readonly DifficultyId[] = [
  'easy',
  'normal',
  'hard',
  'hell',
  'super_hell',
  'nightmare',
];

export const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Dễ',
    shortLabel: 'DỄ',
    badgeColor: '#34D399',
    description: 'Khởi đầu vững +22% · Lõi +20% máu · Quái 1.28× HP, Khiên 1.26×',
    hpMult: 1.28,
    shieldMult: 1.26,
    speedMult: 1.02,
    armorBonus: 0.02,
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
    description: 'Cân bằng chiến thuật · Quái 1.92× HP, Khiên 1.60× · +1 Đợt',
    hpMult: 1.92,
    shieldMult: 1.6,
    speedMult: 1.07,
    armorBonus: 0.08,
    startEnergyMult: 1.04,
    coreHpMult: 1.05,
    rewardMult: 1.0,
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
    description: 'Áp lực cao · Quái 2.86× HP, Khiên 2.12×, +15% tốc độ · +2 Đợt',
    hpMult: 2.86,
    shieldMult: 2.12,
    speedMult: 1.15,
    armorBonus: 0.14,
    startEnergyMult: 0.96,
    coreHpMult: 0.9,
    rewardMult: 0.94,
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
    description: 'Cực hạn sinh tồn · Quái 4.18× HP, Khiên 2.82×, +22% tốc độ · +3 Đợt',
    hpMult: 4.18,
    shieldMult: 2.82,
    speedMult: 1.22,
    armorBonus: 0.21,
    startEnergyMult: 0.92,
    coreHpMult: 0.8,
    rewardMult: 0.9,
    scoreMult: 2.6,
    extraWaves: 3,
    waveCountBonus: 6,
    eliteChanceBoost: 0.25,
  },
  super_hell: {
    id: 'super_hell',
    label: 'Siêu Địa Ngục',
    shortLabel: 'SIÊU ĐỊA NGỤC',
    badgeColor: '#E879F9',
    description: 'Thử thách tột đỉnh · Quái 6.15× HP, Khiên 3.9×, +29% Tốc độ & +28% Giáp · +4 Đợt',
    hpMult: 6.15,
    shieldMult: 3.9,
    speedMult: 1.29,
    armorBonus: 0.28,
    startEnergyMult: 0.9,
    coreHpMult: 0.75,
    rewardMult: 0.95,
    scoreMult: 3.8,
    extraWaves: 4,
    waveCountBonus: 8,
    eliteChanceBoost: 0.36,
  },
  nightmare: {
    id: 'nightmare',
    label: 'Ác Mộng',
    shortLabel: 'ÁC MỘNG',
    badgeColor: '#EF4444',
    description: 'Độ khó gấp 2× Siêu Địa Ngục · Quái 12.3× HP, Khiên 7.8×, +38% Tốc độ & +36% Giáp · +6 Đợt',
    hpMult: 12.3,
    shieldMult: 7.8,
    speedMult: 1.38,
    armorBonus: 0.36,
    startEnergyMult: 0.9,
    coreHpMult: 0.65,
    rewardMult: 0.98,
    scoreMult: 6.5,
    extraWaves: 6,
    waveCountBonus: 12,
    eliteChanceBoost: 0.48,
  },
};

export type GameModeId =
  | 'campaign'
  | 'blitz'
  | 'boss_rush'
  | 'boss_apocalypse'
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
  'boss_apocalypse',
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
    description: '16–48 đợt chuẩn chiến thuật · Phối hợp 26 súng & khắc chế Siêu Boss cuối trận',
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
    description: '+135% năng lượng khởi đầu · Boss & Siêu Boss xuất trận liên tiếp để thử lửa đội hình',
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
  boss_apocalypse: {
    id: 'boss_apocalypse',
    label: 'Khủng Khiếp · Chỉ Boss',
    shortLabel: 'CHỈ BOSS ☠',
    badgeColor: '#E11D48',
    description: '+180% vốn khởi đầu · CHỈ SPAWN BOSS & SIÊU BOSS dồn dập mọi đợt (0 quái thường)!',
    waveCountMult: 0.65,
    spawnRateMult: 0.9,
    speedMult: 0.92,
    startEnergyMult: 2.8,
    coreHpMult: 1.15,
    hpMult: 0.85,
    shieldMult: 0.88,
    swarmCountMult: 1.0,
    heatMult: 1.2,
    rewardMult: 1.55,
    scoreMult: 2.2,
    waveDelaySec: 9,
  },
  endless: {
    id: 'endless',
    label: 'Vô Tận',
    shortLabel: 'ENDLESS ∞',
    badgeColor: '#A855F7',
    description: 'Không giới hạn đợt · Siêu Boss Colossus xuất hiện mỗi 5 đợt',
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
    description: '+85% vốn khởi đầu & +35% xu hạ quái để nâng dàn súng Lv7 sớm · Quái đông +25%',
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

export interface MapBossSpec {
  readonly id: string;
  readonly name: string;
  readonly title: string;
  readonly color: string;
  readonly secondaryColor: string;
  readonly emblemKind: BossEmblemKind;
  readonly signatureSkill: BossWindupKind;
  readonly flavor: string;
}

export interface MapDifficultyScaling {
  readonly hpMult: number;
  readonly shieldMult: number;
  readonly speedMult: number;
  readonly armorBonus: number;
  readonly rewardMult: number;
}

export interface TdMapDef {
  readonly id: string;
  readonly name: string;
  readonly recommendedDifficulty: DifficultyId;
  readonly difficultyLabel: string;
  readonly subtitle: string;
  readonly tacticalHint: string;
  readonly biome: MapBiome;
  readonly cols: number;
  readonly rows: number;
  readonly startEnergy: number;
  readonly startCoreHp: number;
  readonly path: readonly GridPoint[];
  readonly walls: readonly GridPoint[];
  readonly wetZones: readonly GridPoint[];
  readonly totalWaves: number;
  readonly bossSpec: MapBossSpec;
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
  readonly level: 3 | 5 | 7;
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
  readonly category: GunCategory;
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
  shotsFired?: number;
  heat?: number; // 0..100
  overheatTimer?: number; // active signature surge timer
  aimAngle: number;
  recoil: number;
  totalDamageDealt: number;
  kills: number;
}

export interface GunCombatProfile {
  readonly level: number;
  readonly category: GunCategory;
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
  readonly brittleBonus: number; // extra incoming damage on slowed/soaked targets
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
  armorRatio: number; // 0..0.78 physical/kinetic armor
  slowTimer: number;
  slowFactor: number; // 0.3..0.68 (lower = slower)
  brittleBonus: number; // 0..0.45 extra incoming dmg taken
  wetTimer: number; // conductive water soak (wetZones or Cryo mist)
  shockTimer: number; // electric shock arc visual + stun cue
  markedTimer: number; // Radar weakpoint lock countdown
  markedBonus: number; // Radar / Supernova weakpoint damage amp (0..0.45)
  supernovaBrandDmg?: number; // Chain explosion damage released on enemy death
  burnTimer: number;
  burnDps: number;
  armorShred: number; // 0..0.55 permanent armor stripped
  stunTimer: number;
  silencedTimer: number; // suppresses enemy & boss special abilities
  quantumLinkTimer?: number; // links enemy to Quantum Prism Damage Echo web
  quantumEchoRatio?: number; // fraction of damage echoed to linked targets
  abilityCooldown: number;
  windupKind?: BossWindupKind | null;
  windupTimer: number;
  windupMax: number;
  fortifyTimer: number;
  hitFlash: number;
  koTimer: number;
  isElite?: boolean;
  enraged?: boolean;
  bossId?: string;
  bossTitle?: string;
  bossColor?: string;
  bossSecondary?: string;
  bossEmblem?: BossEmblemKind;
  bossPhase?: 1 | 2;
}

export interface ProjectileItem {
  id: number;
  kind:
    | 'bullet'
    | 'pellet'
    | 'missile'
    | 'mortar'
    | 'bomblet'
    | 'sawblade'
    | 'tempest_orb'
    | 'supernova_orb'
    | 'hyperion_shell'
    | 'golden_lance'
    | 'aegis_lance'
    | 'paradox_scythe'
    | 'nebula_meteor';
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
  hitIds?: number[];
  life: number;
  maxLife: number;
  age?: number;
  destX?: number;
  destY?: number;
  originX?: number;
  originY?: number;
  isReturning?: boolean;
  executeThreshold?: number;
  bountyGold?: number;
  speed: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
  spawnCluster?: boolean;
  isClusterBomblet?: boolean;
  isElectricStorm?: boolean;
  supernovaBrandAmp?: number;
  supernovaEchoDmg?: number;
  isCrit?: boolean;
  trail?: { x: number; y: number }[];
}

export interface LightningArc {
  points: { x: number; y: number }[];
  alpha: number;
  color: string;
  width: number;
  isWetOverdrive?: boolean;
  branches?: { x1: number; y1: number; x2: number; y2: number }[];
}

export interface RailBeamFx {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
  variant?: 'railgun' | 'supernova' | 'astral_ark' | 'prism_refract';
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

export interface OrbitalBeamFx {
  x: number;
  y: number;
  alpha: number;
  radius: number;
  color: string;
  visualTier: 1 | 2 | 3 | 4;
}

export interface OrbitalRadiationZone {
  id: number;
  sourceGunId: string;
  x: number;
  y: number;
  radius: number;
  dps: number;
  armorPierce: number;
  shieldMult: number;
  armorShred?: number;
  slowPct?: number;
  life: number;
  maxLife: number;
}

export interface SingularityHole {
  id: number;
  sourceGunId: string;
  x: number;
  y: number;
  baseRadius: number;
  currentRadius: number;
  pullStrength: number;
  trueDps: number;
  accumulatedDamage: number;
  killsAbsorbed: number;
  life: number;
  maxLife: number;
  maxScale: number;
  level: number;
  variant: GunVariant;
  isCrit?: boolean;
}

export interface CarrierDrone {
  id: number;
  sourceGunId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number;
  fireCooldown: number;
  shotCount?: number;
  life: number;
  maxLife: number;
  damage: number;
  armorPierce: number;
  shieldMult: number;
  bossMult: number;
  speed: number;
  variant: GunVariant;
  visualTier: 1 | 2 | 3 | 4;
  evadeTimer: number;
  trail: { x: number; y: number }[];
}

export interface ChronoField {
  id: number;
  sourceGunId: string;
  x: number;
  y: number;
  radius: number;
  recordedDamage: number;
  dps: number;
  echoRatio: number;
  slowPct: number;
  pullForce: number;
  armorPierce: number;
  shieldMult: number;
  life: number;
  maxLife: number;
  level: number;
  variant: GunVariant;
  isCrit?: boolean;
}

export interface ChronoSlashFx {
  x: number;
  y: number;
  angle: number;
  length: number;
  alpha: number;
  color: string;
  isCrit?: boolean;
}

export interface VoidRiftFx {
  id: number;
  sourceGunId: string;
  x: number;
  y: number;
  radius: number;
  dps: number;
  pctHpDps: number;
  armorPierce: number;
  shieldMult: number;
  slowPct: number;
  life: number;
  maxLife: number;
  variant: GunVariant;
  isOverdrive: boolean;
}

export interface QuantumEchoArcFx {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  color: string;
}

export interface AuroraPylonFx {
  id: number;
  sourceGunId: string;
  x: number;
  y: number;
  radius: number;
  dps: number;
  armorPierce: number;
  shieldMult: number;
  life: number;
  maxLife: number;
  pulseTimer: number;
  visualTier: 1 | 2 | 3 | 4;
  variant: GunVariant;
}

export const GRID_COLS = 16;
export const GRID_ROWS = 10;
export const TILE_SIZE = 56;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 896
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 560
export const MAX_GUN_LEVEL = 7;

export const GUN_CATALOG: readonly GunCatalogItem[] = [
  // === NHÓM TẤN CÔNG (13 SÚNG CHUYÊN BIỆT) ===
  {
    type: 'gatling',
    category: 'attack',
    hotkey: '1',
    name: 'Súng Máy Vulcan',
    shortName: 'Vulcan',
    roleClue: 'Liên thanh xuyên giáp',
    accentColor: '#38BDF8',
    cost: 55,
    baseDamage: 13,
    baseCooldown: 0.24,
    rangeTiles: 2.75,
    milestones: [
      { level: 3, name: 'Đạn Xuyên Giáp & Nòng Kép', summary: 'Bắn 2 luồng đạn liên hoàn + xuyên 45% giáp Thiết Giáp' },
      { level: 5, name: '3 Nòng Đạn Nổ Mảnh', summary: 'Bắn 3 luồng đạn + nổ lan vùng 24px & phá khiên +15%' },
      { level: 7, name: 'Vương Miện 4 Nòng Hyper-AP', summary: '4 nòng xuyên thấu mục tiêu (pierce) + xuyên 78% giáp & vỏ đạn hoàng kim' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Siêu Thanh Xoay',
        shortTag: 'α Xoay',
        summary: 'Tốc độ bắn +18%, vung vỏ đạn liên hồi',
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
        splashBonus: 0,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.12,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'gatling_hyper_barrage',
      name: 'Bão Đạn Hyper',
      color: '#38BDF8',
      summary: 'Mỗi phát đạn phóng 2 vòng xuyên giáp liên hoàn tốc độ gấp 2.1× trong 3.2s',
      heatPerShot: 5.5,
    },
  },
  {
    type: 'shotgun',
    category: 'attack',
    hotkey: '2',
    name: 'Shotgun Phân Mảnh',
    shortName: 'Shotgun',
    roleClue: 'Quạt đạn cự ly gần',
    accentColor: '#FB7185',
    cost: 70,
    baseDamage: 14,
    baseCooldown: 0.85,
    rangeTiles: 2.35,
    milestones: [
      { level: 3, name: 'Chùm 6 Viên Nhiệt Lửa', summary: 'Mở rộng chùm 6 viên + gây bỏng nhiệt 45% DMG/giây' },
      { level: 5, name: 'Quạt Thép 7 Viên Xuyên', summary: 'Tăng góc quét + 7 viên xuyên giáp nhẹ qua 2 mục tiêu' },
      { level: 7, name: 'Súng Hủy Diệt Đẩy Lùi', summary: '9 viên siêu đặc + đẩy lùi quái về cổng & kích nổ mảnh xỉ 26px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Chùm Tỏa Rộng',
        shortTag: 'α Chùm +2',
        summary: '+2 viên mỗi phát, quét sạch quái chia tách',
        accentColor: '#FB7185',
        damageMult: 0.9,
        rofMult: 1.12,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 2,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đạn Nổ Nhiệt',
        shortTag: 'ω Phá Giáp',
        summary: '+34% sát thương & +18% xuyên giáp cận chiến',
        accentColor: '#F97316',
        damageMult: 1.34,
        rofMult: 0.9,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0.18,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'shotgun_nova_blast',
      name: 'Nổ Chùm Quét Sạch',
      color: '#FB7185',
      summary: 'Bắn chùm 16 viên tỏa rộng đẩy lùi nhẹ và thiêu đốt mục tiêu',
      heatPerShot: 14,
    },
  },
  {
    type: 'flamer',
    category: 'attack',
    hotkey: '3',
    name: 'Phun Lửa Plasma',
    shortName: 'Phun Lửa',
    roleClue: 'Đốt nón & bào mòn giáp',
    accentColor: '#F97316',
    cost: 75,
    baseDamage: 18,
    baseCooldown: 0.42,
    rangeTiles: 2.4,
    milestones: [
      { level: 3, name: 'Nhiệt Lưu Huỳnh Bào Giáp', summary: 'Bào mòn 28% giáp Thiết Giáp, xuyên 72% giáp & tăng cháy DoT' },
      { level: 5, name: 'Ngọn Lửa Lam Ngưng Tụ', summary: 'Lửa plasma xanh làm chậm 18% & phá khiên +15%' },
      { level: 7, name: 'Bão Lửa Nova 360°', summary: 'Phóng vòng lửa Plasma Lam quét 360° & để lại hố lửa đốt mặt đường' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Nón Lửa Xoáy',
        shortTag: 'α Quét Rộng',
        summary: '+0.4ô tầm phun & tăng tốc nhịp thiêu đốt',
        accentColor: '#F97316',
        damageMult: 0.96,
        rofMult: 1.15,
        rangeBonus: 0.4,
        splashBonus: 12,
        armorPierceBonus: 0.06,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hồ Quang Chảy Giáp',
        shortTag: 'ω Bào Giáp',
        summary: '+32% sát thương nung chảy & +20% xuyên giáp',
        accentColor: '#EF4444',
        damageMult: 1.32,
        rofMult: 0.9,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'flamer_phoenix_ring',
      name: 'Vòng Lửa Phượng Hoàng',
      color: '#F97316',
      summary: 'Thiêu đốt 360° quanh tháp & để lại hố dung nham bào mòn giáp',
      heatPerShot: 10,
    },
  },
  {
    type: 'saw',
    category: 'attack',
    hotkey: '4',
    name: 'Pháo Đĩa Cưa',
    shortName: 'Đĩa Cưa',
    roleClue: 'Bật nảy chém xuyên hàng',
    accentColor: '#F43F5E',
    cost: 85,
    baseDamage: 30,
    baseCooldown: 0.78,
    rangeTiles: 3.1,
    milestones: [
      { level: 3, name: 'Lưỡi Titan 4 Nảy Chảy Máu', summary: 'Đĩa cưa nảy 4 mục tiêu + gây chảy máu DoT xuyên giáp' },
      { level: 5, name: 'Cặp Đĩa Song Sinh', summary: 'Phóng đồng thời 2 đĩa cưa xoắn nảy 5 mục tiêu' },
      { level: 7, name: 'Bão Đĩa 3 Lưỡi Vàng', summary: '3 đĩa cưa nảy 7 lượt xé toạc đội hình' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Đĩa Nảy Liên Hoàn',
        shortTag: 'α +2 Nảy',
        summary: '+2 lần nảy thêm giữa đám đông trên đường',
        accentColor: '#F43F5E',
        damageMult: 0.92,
        rofMult: 1.12,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lưỡi Cưa Hạng Nặng',
        shortTag: 'ω Xé Giáp',
        summary: '+32% sát thương nhát chém & +18% xuyên giáp',
        accentColor: '#E11D48',
        damageMult: 1.32,
        rofMult: 0.88,
        rangeBonus: 0.25,
        splashBonus: 0,
        armorPierceBonus: 0.18,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'saw_cyclone_wheel',
      name: 'Vòng Cưa Lốc Xoáy',
      color: '#F43F5E',
      summary: 'Phóng 6 đĩa cưa xoay vòng chém liên hoàn 360°',
      heatPerShot: 14,
    },
  },
  {
    type: 'mortar',
    category: 'attack',
    hotkey: '5',
    name: 'Pháo Cối Trọng Pháo',
    shortName: 'Pháo Cối',
    roleClue: 'Nổ hố sâu + xoáy kéo gom',
    accentColor: '#A855F7',
    cost: 115,
    baseDamage: 60,
    baseCooldown: 1.55,
    rangeTiles: 4.5,
    milestones: [
      { level: 3, name: 'Xoáy Trọng Trường & Cháy', summary: 'Kéo gom quái vào tâm nổ, làm chậm 30% & đốt hố cháy' },
      { level: 5, name: 'Đầu Đạn Phá Hủy', summary: 'Bán kính nổ lớn + xuyên 68% giáp' },
      { level: 7, name: 'Song Pháo Thiên Thạch', summary: 'Bắn cặp đạn cối kéo xoáy + đốt diện rộng' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Xoáy Lực Rộng',
        shortTag: 'α Nổ Rộng',
        summary: '+24px bán kính nổ & nhịp bắn +14%',
        accentColor: '#A855F7',
        damageMult: 0.94,
        rofMult: 1.14,
        rangeBonus: 0.25,
        splashBonus: 24,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Thiên Thạch Nặng',
        shortTag: 'ω Hủy Diệt',
        summary: '+36% sát thương tâm nổ & +20% xuyên giáp',
        accentColor: '#EC4899',
        damageMult: 1.36,
        rofMult: 0.88,
        rangeBonus: 0,
        splashBonus: 12,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'mortar_vortex_singularity',
      name: 'Hố Đen Hủy Diệt',
      color: '#C084FC',
      summary: 'Kéo mạnh mọi quái trên đường vào tâm nổ & tạo hố plasma đốt cháy',
      heatPerShot: 22,
    },
  },
  {
    type: 'missile',
    category: 'attack',
    hotkey: '6',
    name: 'Bệ Tên Lửa Săn Boss',
    shortName: 'Tên Lửa',
    roleClue: 'Dẫn đường ưu tiên quái nguy hiểm',
    accentColor: '#FACC15',
    cost: 100,
    baseDamage: 46,
    baseCooldown: 1.05,
    rangeTiles: 4.3,
    milestones: [
      { level: 3, name: 'Tầm Nhiệt & Bệ Phóng Kép', summary: 'Phóng 2 tên lửa dẫn đường, tự khóa Tàng Hình / Y Tá / Boss' },
      { level: 5, name: 'Bom Chùm Thứ Cấp', summary: 'Tách 3 bom con công phá quanh điểm rơi' },
      { level: 7, name: 'Loạt Tên Lửa Hạt Nhân', summary: '3 tên lửa hạng nặng + nổ chùm diện rộng' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bầy Tên Lửa +1',
        shortTag: 'α Bầy +1',
        summary: '+1 tên lửa mỗi loạt phóng & tăng tầm khóa mục tiêu',
        accentColor: '#FACC15',
        damageMult: 0.88,
        rofMult: 1.08,
        rangeBonus: 0.3,
        splashBonus: 8,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đầu Đạn Phá Hầm',
        shortTag: 'ω Phá Khiên',
        summary: '+34% sát thương & +30% phá khiên Boss',
        accentColor: '#F97316',
        damageMult: 1.34,
        rofMult: 0.9,
        rangeBonus: 0,
        splashBonus: 18,
        armorPierceBonus: 0.14,
        shieldMultBonus: 0.3,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'missile_swarm_carpet',
      name: 'Mưa Tên Lửa Thảm',
      color: '#FACC15',
      summary: 'Phóng loạt 6 tên lửa dẫn đường rải thảm + bom chùm thứ cấp',
      heatPerShot: 17,
    },
  },
  {
    type: 'railgun',
    category: 'attack',
    hotkey: '7',
    name: 'Pháo Đường Ray',
    shortName: 'Railgun',
    roleClue: 'Tia xuyên thẳng & khắc tinh Boss',
    accentColor: '#818CF8',
    cost: 125,
    baseDamage: 124,
    baseCooldown: 1.72,
    rangeTiles: 5.0,
    milestones: [
      { level: 3, name: 'Tia Siêu Thanh Phá Khiên', summary: 'Xuyên 85% giáp mọi quái trên đường, 175% lên Khiên & 165% chí mạng Boss' },
      { level: 5, name: 'Nổ Quỹ Đạo Cộng Hưởng', summary: 'Phát nổ sóng từ trường 40px dọc thân mục tiêu & bắn 2 tia' },
      { level: 7, name: 'Tia Hủy Diệt Omega', summary: 'Xuyên 100% giáp · 3 tia tụ năng quét sạch đường thẳng' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Nạp Tụ Siêu Tốc',
        shortTag: 'α Nạp Nhanh',
        summary: '+24% tốc nạp tụ năng & +0.5ô tầm bắn',
        accentColor: '#818CF8',
        damageMult: 0.92,
        rofMult: 1.24,
        rangeBonus: 0.5,
        splashBonus: 0,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sát Thủ Boss',
        shortTag: 'ω Khắc Boss',
        summary: '+42% sát thương đơn tia & xuyên 100% giáp',
        accentColor: '#F43F5E',
        damageMult: 1.42,
        rofMult: 0.86,
        rangeBonus: 0,
        splashBonus: 14,
        armorPierceBonus: 0.25,
        shieldMultBonus: 0.45,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'railgun_orbital_beam',
      name: 'Pháo Quỹ Đạo Hủy Diệt',
      color: '#F43F5E',
      summary: 'Bắn tia công phá cực đại +2.4× sát thương xuyên toàn bản đồ',
      heatPerShot: 24,
    },
  },
  {
    type: 'prism_refract',
    category: 'attack',
    hotkey: 'a',
    name: 'Lăng Kính Khúc Xạ',
    shortName: 'Khúc Xạ',
    roleClue: 'Tia lăng kính tách khúc xạ 2→6 nhánh & tăng sát thương nhận',
    accentColor: '#38BDF8',
    cost: 300,
    baseDamage: 168,
    baseCooldown: 0.72,
    rangeTiles: 4.5,
    milestones: [
      { level: 3, name: 'Khúc Xạ 3 Tia & Phản Ứng Giòn', summary: 'Tia chính tách 3 nhánh khúc xạ + gắn dấu Khúc Xạ (+20% DMG nhận vào)' },
      { level: 5, name: 'Quang Phổ Tứ Nhánh Xuyên Khiên', summary: 'Tách 4 tia khúc xạ, xuyên 85% giáp, 185% phá khiên & đánh dấu +26%' },
      { level: 7, name: 'Lăng Kính Vỡ Vụn Lục Tia', summary: 'Tách 6 tia khúc xạ liên hoàn + nổ vỡ quang phổ 58px khi trúng mục tiêu!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Đa Lăng Kính Nảy Xa',
        shortTag: 'α +2 Khúc Xạ',
        summary: '+2 nhánh khúc xạ thêm & +0.45ô tầm bắn tia sáng',
        accentColor: '#38BDF8',
        damageMult: 0.92,
        rofMult: 1.14,
        rangeBonus: 0.45,
        splashBonus: 8,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hội Tụ Cường Quang',
        shortTag: 'ω +38% Cường Quang',
        summary: '+38% sát thương tia chính & +24% xuyên giáp mục tiêu',
        accentColor: '#A855F7',
        damageMult: 1.38,
        rofMult: 0.92,
        rangeBonus: 0.1,
        splashBonus: 12,
        armorPierceBonus: 0.24,
        shieldMultBonus: 0.35,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'prism_nova_spectrum',
      name: 'Mạng Lưới Quang Phổ',
      color: '#38BDF8',
      summary: 'Phóng 10 tia khúc xạ 7 sắc xuyên phá & gắn dấu +35% sát thương nhận trong 4s',
      heatPerShot: 14,
    },
  },
  {
    type: 'orbital',
    category: 'attack',
    hotkey: 'z',
    name: 'Vệ Tinh Quỹ Đạo',
    shortName: 'Thiên Phạt',
    roleClue: 'Pháo 500⚡ gọi 2→4 cột sáng quỹ đạo toàn bản đồ',
    accentColor: '#F97316',
    cost: 500,
    baseDamage: 430,
    baseCooldown: 2.25,
    rangeTiles: 28,
    milestones: [
      { level: 3, name: 'Song Trụ Dung Nham Bào Giáp', summary: 'Gọi 2 cột Thiên Phạt, vùng dung nham đốt 48% DMG/s, chậm 24% & nung chảy 30% giáp' },
      { level: 5, name: 'Lưới Ion Thái Dương Phá Boss', summary: 'Xuyên 95% giáp + thiêu thêm 8% Máu tối đa Boss & sóng xung kích diện rộng' },
      { level: 7, name: 'Thiên Phạt Vĩnh Hằng · Tứ Trụ', summary: '4 cột Thiên Phạt đồng loạt + vụ nổ tâm 1.45× DMG, bào 45% giáp & ngắt chiêu Boss!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Thiên Phạt Tập Trung',
        shortTag: 'α Xuyên Boss',
        summary: '+34% sát thương cột sáng & +22% xuyên giáp mục tiêu',
        accentColor: '#FB923C',
        damageMult: 1.34,
        rofMult: 1.0,
        rangeBonus: 0,
        splashBonus: 12,
        armorPierceBonus: 0.22,
        shieldMultBonus: 0.4,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Bức Xạ Dung Nham',
        shortTag: 'ω Dung Nham',
        summary: '+45% bán kính & thời gian vùng dung nham đốt đường đi',
        accentColor: '#EF4444',
        damageMult: 0.98,
        rofMult: 1.14,
        rangeBonus: 0,
        splashBonus: 30,
        armorPierceBonus: 0.14,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'orbital_solar_judgment',
      name: 'Mưa Thiên Phạt Quỹ Đạo',
      color: '#F97316',
      summary: 'Giáng 4 cột sáng hủy diệt đồng loạt lên các mục tiêu máu cao nhất toàn bản đồ',
      heatPerShot: 24,
    },
  },
  {
    type: 'hyperion',
    category: 'attack',
    hotkey: 's',
    name: 'Pháo Tử Thần Hyperion',
    shortName: 'Hyperion',
    roleClue: 'Đại bác công phá 500⚡ · Nổ chấn động & Hành Quyết',
    accentColor: '#F43F5E',
    cost: 500,
    baseDamage: 395,
    baseCooldown: 1.55,
    rangeTiles: 5.0,
    milestones: [
      { level: 3, name: 'Đầu Đạn Plasma Phá Giáp', summary: 'Đạn công thành nổ 66px, gây 2.0× Khiên & bào 28% giáp vĩnh viễn' },
      { level: 5, name: 'Ấn Ký Hành Quyết <22% HP', summary: 'Kết liễu tức thì quái thường dưới 22% HP (+45% DMG hành quyết lên Boss)' },
      { level: 7, name: 'Song Pháo Tận Thế <28% HP', summary: 'Bắn cặp đại bác 95px, xuyên 96% giáp & hành quyết dưới 28% HP kèm sóng nổ!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Liên Xạ Công Thành',
        shortTag: 'α +1 Đạn & ROF',
        summary: '+1 đạn công thành phụ & +20% tốc độ nạp đạn',
        accentColor: '#FB7185',
        damageMult: 0.92,
        rofMult: 1.2,
        rangeBonus: 0.35,
        splashBonus: 10,
        armorPierceBonus: 0.1,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lõi Phá Hủy Tuyệt Đối',
        shortTag: 'ω Xuyên 100%',
        summary: '+42% sát thương nổ & xuyên 100% giáp hạng nặng',
        accentColor: '#E11D48',
        damageMult: 1.42,
        rofMult: 0.9,
        rangeBonus: 0.15,
        splashBonus: 20,
        armorPierceBonus: 0.28,
        shieldMultBonus: 0.55,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'hyperion_doomsday_salvo',
      name: 'Loạt Đại Bác Tận Thế',
      color: '#F43F5E',
      summary: 'Phóng 3 quả đạn Hyperion cực đại nổ rung bản đồ & hành quyết quái yếu',
      heatPerShot: 20,
    },
  },
  {
    type: 'singularity',
    category: 'attack',
    hotkey: 'x',
    name: 'Hố Đen Vĩnh Cửu',
    shortName: 'Hố Đen',
    roleClue: 'Nuốt chửng & nghiền nát không gian',
    accentColor: '#A855F7',
    cost: 330,
    baseDamage: 172,
    baseCooldown: 3.6,
    rangeTiles: 4.4,
    milestones: [
      { level: 3, name: 'Chân Trời Sát Thương Chuẩn', summary: 'Hút chặt quái vào tâm, 100% sát thương chuẩn & nuốt 55% máu xác' },
      { level: 5, name: 'Trường Hấp Dẫn Siêu Sâu', summary: 'Bán kính hút 124px + làm chậm 42% toàn bộ quái trong xoáy' },
      { level: 7, name: 'Vụ Nổ Sụp Đổ Vũ Trụ', summary: 'Tích 72% máu quái bị nuốt & giải phóng vụ nổ chuẩn hủy diệt cuối giờ' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Chân Trời Sự Kiện',
        shortTag: 'α Hút Rộng',
        summary: '+32% lực hút gom bầy & +26px bán kính hố đen',
        accentColor: '#C084FC',
        damageMult: 0.98,
        rofMult: 1.08,
        rangeBonus: 0.35,
        splashBonus: 26,
        armorPierceBonus: 0,
        shieldMultBonus: 0.25,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sụp Đổ Chuẩn',
        shortTag: 'ω Nổ Chuẩn',
        summary: '+45% sát thương chuẩn/giây & +45% nổ tích tụ khi hết giờ',
        accentColor: '#E879F9',
        damageMult: 1.45,
        rofMult: 0.96,
        rangeBonus: 0,
        splashBonus: 10,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.35,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'singularity_big_crunch',
      name: 'Siêu Hố Đen Hủy Diệt',
      color: '#C084FC',
      summary: 'Mở siêu hố đen khổng lồ hút chặt đường đi, nghiền chuẩn & phát nổ cuối giờ',
      heatPerShot: 22,
    },
  },
  {
    type: 'mothership',
    category: 'attack',
    hotkey: 'c',
    name: 'Mẫu Hạm Không Gian',
    shortName: 'Mẫu Hạm',
    roleClue: 'Triệu hồi hạm đội tự hành',
    accentColor: '#38BDF8',
    cost: 280,
    baseDamage: 43,
    baseCooldown: 0.56,
    rangeTiles: 28,
    milestones: [
      { level: 3, name: 'Phi Đội Săn Lọt Lưới', summary: '3 phi thuyền bay nhanh toàn bản đồ, bắn tỉa 215px quái gần Lõi' },
      { level: 5, name: 'Hạm Đội 4 & Tên Lửa Plasma', summary: 'Tăng lên 4 phi thuyền, tự né xung Boss & phóng Tên Lửa (+45% DMG lên Boss)' },
      { level: 7, name: 'Hạm Đội Độc Tôn', summary: 'Phi đội bay siêu thanh, xuyên 80% giáp & xuất xưởng tức thì' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Phi Đội +1',
        shortTag: 'α +1 Thuyền',
        summary: '+1 phi thuyền tự hành & +22% tốc độ bay truy đuổi cuối đường',
        accentColor: '#38BDF8',
        damageMult: 0.95,
        rofMult: 1.14,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.2,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Tuần Dương Hạng Nặng',
        shortTag: 'ω Tỉa Mạnh',
        summary: '+42% sát thương plasma tỉa & +35% phá khiên Boss',
        accentColor: '#FACC15',
        damageMult: 1.42,
        rofMult: 0.96,
        rangeBonus: 0,
        splashBonus: 0,
        armorPierceBonus: 0.24,
        shieldMultBonus: 0.35,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'mothership_fleet_scramble',
      name: 'Tổng Động Viên Hạm Đội',
      color: '#38BDF8',
      summary: 'Xuất kích thêm phi đội cường kích & tăng hỏa lực toàn phi thuyền',
      heatPerShot: 14,
    },
  },
  {
    type: 'supernova',
    category: 'attack',
    hotkey: 'v',
    name: 'Pháo Siêu Tân Tinh',
    shortName: 'Siêu Tân Tinh',
    roleClue: 'Nổ dây chuyền & tia phán quyết',
    accentColor: '#FDE047',
    cost: 500,
    baseDamage: 380,
    baseCooldown: 1.65,
    rangeTiles: 4.6,
    milestones: [
      { level: 3, name: 'Ấn Tích & Tia Phán Quyết', summary: 'Gắn ấn +35% DMG toàn đội, nổ dây chuyền 115px & phóng Tia Phán Quyết ngắt chiêu Boss' },
      { level: 5, name: 'Xuyên Giáp Tuyệt Đối', summary: 'Cầu sao xuyên 4 mục tiêu, xuyên 100% giáp & nhân 2.0× sát thương Khiên' },
      { level: 7, name: 'Thiên Hà Khởi Nguyên', summary: 'Nổ dây chuyền 140px (+12% HP tối đa), Tia Phán Quyết mỗi 3 phát & ấn +42%' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Liên Hoàn Sao',
        shortTag: 'α Dây Chuyền',
        summary: '+1 mục tiêu xuyên thấu, +26px bán kính nổ sao & tốc bắn +12%',
        accentColor: '#FDE047',
        damageMult: 0.96,
        rofMult: 1.12,
        rangeBonus: 0.35,
        splashBonus: 26,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 1,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Phán Quyết Boss',
        shortTag: 'ω Phán Quyết',
        summary: '+42% sát thương, xuyên 100% giáp, +55% phá khiên & Phán Quyết mỗi 3 phát',
        accentColor: '#F59E0B',
        damageMult: 1.42,
        rofMult: 0.94,
        rangeBonus: 0.15,
        splashBonus: 12,
        armorPierceBonus: 0.1,
        shieldMultBonus: 0.55,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'supernova_genesis_collapse',
      name: 'Đại Vụ Nổ Khởi Nguyên',
      color: '#FDE047',
      summary: 'Bùng nổ sóng sao 260px + 3 Tia Phán Quyết ngắt chiêu Boss & gắn ấn +45%',
      heatPerShot: 25,
    },
  },
  {
    type: 'chronos',
    category: 'attack',
    hotkey: 'b',
    name: 'Pháo Thời Không',
    shortName: 'Thời Không',
    roleClue: 'Ngưng đọng & tua ngược thời gian',
    accentColor: '#22D3EE',
    cost: 700,
    baseDamage: 620,
    baseCooldown: 1.45,
    rangeTiles: 5.8,
    milestones: [
      { level: 3, name: 'Nghịch Lý & Tua Ngược', summary: 'Vòng Thời Không ghi 46% DMG toàn đội, tua ngược quái về cổng & ngắt chiêu Boss' },
      { level: 5, name: 'Song Trường & Nhát Chém Thực Tại', summary: 'Duy trì 2–3 Vòng Thời Không & tung Nhát Chém Thực Tại lên Boss xa nhất' },
      { level: 7, name: 'Chúa Tể Thời Gian', summary: '6 Nhát Chém Thực Tại, ghi âm 56% sát thương toàn đội & 2.45× phá khiên' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Trường Nghịch Lý',
        shortTag: 'α Đa Trường',
        summary: '+1 Vòng Thời Không đồng thời, +30px bán kính & +18% tích lũy sát thương toàn đội',
        accentColor: '#22D3EE',
        damageMult: 0.94,
        rofMult: 1.12,
        rangeBonus: 0.4,
        splashBonus: 30,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Đoạn Mệnh Thần Kiếm',
        shortTag: 'ω Thần Kiếm',
        summary: '+45% sát thương Nhát Chém Thực Tại, xuyên 100% giáp & +2 mục tiêu trảm',
        accentColor: '#C084FC',
        damageMult: 1.45,
        rofMult: 0.95,
        rangeBonus: 0.2,
        splashBonus: 12,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.45,
        extraProjectiles: 0,
        extraChain: 2,
      },
    },
    overheatSkill: {
      key: 'chronos_time_collapse',
      name: 'Ngưng Đọng Vĩnh Hằng',
      color: '#67E8F9',
      summary: 'Đóng băng thời gian toàn bản đồ 2.4s, ngắt mọi chiêu Boss & tung 8 Nhát Chém Thực Tại',
      heatPerShot: 24,
    },
  },
  {
    type: 'aegis_bastion',
    category: 'attack',
    hotkey: 'k',
    name: 'Pháo Đài Khiên Aegis',
    shortName: 'Khiên Aegis',
    roleClue: '800⚡ Vừa Công Vừa Thủ · Tạo Khiên Lõi & Đẩy Lùi',
    accentColor: '#38BDF8',
    cost: 800,
    baseDamage: 340,
    baseCooldown: 0.95,
    rangeTiles: 4.5,
    milestones: [
      {
        level: 3,
        name: 'Mạng Lưới Phản Kích',
        summary: 'Tạo +4 Khiên Lõi chặn sát thương vào Lõi + 2 Thương phản chấn 88px đẩy lùi quái',
      },
      {
        level: 5,
        name: 'Thánh Thuẫn Chuyển Hóa',
        summary: 'Tự hồi Khiên Lõi mỗi 8s + Sóng 108px gây Yếu Giáp +24% & +35% DMG lên Boss',
      },
      {
        level: 7,
        name: 'Pháo Đài Bất Tử Aegis',
        summary: '+9 Khiên Lõi · 3 Thương xuyên 94% giáp · Sóng 128px ngắt kỹ năng Boss tức thì',
      },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Thuẫn Phản Công',
        shortTag: 'α +1 Thương & Đẩy',
        summary: '+1 Thương phản kích, nhịp bắn +15% & đẩy lùi đa mục tiêu trên diện rộng',
        accentColor: '#38BDF8',
        damageMult: 1.05,
        rofMult: 1.15,
        rangeBonus: 0.4,
        splashBonus: 18,
        armorPierceBonus: 0.06,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 1,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Thành Trì Bất Hoại',
        shortTag: 'ω +50% Khiên Lõi',
        summary: 'Tăng 1.5× giới hạn Khiên Lõi, hồi khiên nhanh hơn & Sóng phản kích +55% phá khiên Boss',
        accentColor: '#FDE047',
        damageMult: 1.28,
        rofMult: 0.96,
        rangeBonus: 0.2,
        splashBonus: 26,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.55,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'aegis_citadel_overcharge',
      name: 'Thành Trì Bất Hoại',
      color: '#38BDF8',
      summary: 'Nạp ngay +4 Khiên Lõi & hồi +1 HP Lõi · Nổ Sóng Aegis 190px làm choáng, ngắt Boss & đẩy lùi toàn tuyến',
      heatPerShot: 20,
    },
  },
  {
    type: 'astral_ark',
    category: 'attack',
    hotkey: 'n',
    name: 'Pháo Tối Thượng Hư Không',
    shortName: 'Tối Thượng',
    roleClue: 'Tia lăng kính + Vết Nứt %HP Boss',
    accentColor: '#E879F9',
    cost: 1200,
    baseDamage: 1040,
    baseCooldown: 1.5,
    rangeTiles: 6.4,
    milestones: [
      { level: 3, name: 'Chùm Tia & Vết Nứt Hư Không', summary: 'Bắn 3 tia Lăng Kính + mở Vết Nứt đốt chuẩn xé 2.5% Máu tối đa Boss/giây' },
      { level: 5, name: 'Song Vết Nứt Cộng Hưởng', summary: 'Duy trì 2–3 Vết Nứt song song, xuyên 100% giáp & 2.65× phá khiên' },
      { level: 7, name: 'Thánh Khí Tận Thế', summary: '4–5 tia Lăng Kính + Vết Nứt xé 4% Máu tối đa Boss/s & nổ sụp đổ cực đại' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Lăng Kính Đa Tia',
        shortTag: 'α +1 Tia & Nứt',
        summary: '+1 Tia Lăng Kính, +1 Vết Nứt Hư Không đồng thời & nhịp bắn +14%',
        accentColor: '#F0ABFC',
        damageMult: 0.96,
        rofMult: 1.14,
        rangeBonus: 0.4,
        splashBonus: 24,
        armorPierceBonus: 0,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 1,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Vực Thẳm Hủy Diệt',
        shortTag: 'ω Xé Boss 4%',
        summary: '+44% sát thương chuẩn, xuyên 100% giáp & +65% phá khiên Siêu Boss',
        accentColor: '#F43F5E',
        damageMult: 1.44,
        rofMult: 0.95,
        rangeBonus: 0.2,
        splashBonus: 14,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.65,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'void_cataclysm',
      name: 'Đại Hồng Thủy Hư Không',
      color: '#F0ABFC',
      summary: 'Mở 3 Vết Nứt Hư Không khổng lồ trên tuyến Boss & phóng 6 Tia Lăng Kính cực đại',
      heatPerShot: 24,
    },
  },

  // === VŨ KHÍ ĐỘC QUYỀN THEO TỪNG MÀN ĐẶC BIỆT (CHỈ XUẤT HIỆN TẠI MÀN ĐÓ) ===
  {
    type: 'aurelia_cannon',
    category: 'attack',
    exclusiveMapId: 'sector-17',
    hotkey: 'f',
    name: 'Thánh Pháo Hoàng Kim ★',
    shortName: 'Hoàng Kim ★',
    roleClue: 'Độc quyền Màn 17 · Thương Mặt Trời xuyên + thưởng ⚡',
    accentColor: '#FACC15',
    cost: 450,
    baseDamage: 325,
    baseCooldown: 1.15,
    rangeTiles: 4.8,
    milestones: [
      { level: 3, name: 'Thương Nhật Quang + Thưởng Vàng', summary: 'Thương Hoàng Kim xuyên 3 mục tiêu & thu +3⚡ mỗi phát trúng Tinh Anh/Boss' },
      { level: 5, name: 'Bùng Nổ Mặt Trời 4 Tia', summary: 'Xuyên 5 mục tiêu, đốt cháy 45% DMG/s & nổ hào quang 68px khi chạm Boss' },
      { level: 7, name: 'Hoàng Kim Thiên Vũ · Lục Thương', summary: 'Bắn loạt 3 Thương Hoàng Kim tối thượng + thu +6⚡ & phá 220% Khiên!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Mưa Thương Mặt Trời',
        shortTag: 'α +1 Thương',
        summary: '+1 Thương Hoàng Kim mỗi loạt & +15% tốc bắn',
        accentColor: '#FACC15',
        damageMult: 0.94,
        rofMult: 1.15,
        rangeBonus: 0.35,
        splashBonus: 10,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Ánh Dương Phán Xét',
        shortTag: 'ω +38% Thương',
        summary: '+38% sát thương Thương Hoàng Kim & +40% phá khiên',
        accentColor: '#F59E0B',
        damageMult: 1.38,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 18,
        armorPierceBonus: 0.25,
        shieldMultBonus: 0.4,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'aurelia_solar_judgement',
      name: 'Thiên Vũ Hoàng Kim ★',
      color: '#FACC15',
      summary: 'Phóng 6 Thương Hoàng Kim xuyên hàng & thu ngay +35⚡ năng lượng mặt trời',
      heatPerShot: 18,
    },
  },
  {
    type: 'paradox_scythe',
    category: 'attack',
    exclusiveMapId: 'sector-18',
    hotkey: 'g',
    name: 'Lưỡi Hái Nghịch Lý ✦',
    shortName: 'Nghịch Lý ✦',
    roleClue: 'Độc quyền Màn 18 · Boomerang chém 2 chiều & tua ngược',
    accentColor: '#67E8F9',
    cost: 600,
    baseDamage: 460,
    baseCooldown: 1.25,
    rangeTiles: 5.2,
    milestones: [
      { level: 3, name: 'Lưỡi Hái Boomerang Hai Chiều', summary: 'Chém xuyên cả lượt đi lẫn lượt quay về + đẩy lùi nhẹ quái thường' },
      { level: 5, name: 'Song Liềm Cắt Không Gian', summary: 'Phóng 2 Lưỡi Hái Nghịch Lý xuyên 100% giáp & tạo Vết Chém Thực Tại 62px' },
      { level: 7, name: 'Thiên Liềm Đoạn Thời Gian', summary: '3 Lưỡi Hái cực đại chém kép 2 lượt + tua ngược quái & cắt chiêu Boss!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Đa Liềm Không Gian',
        shortTag: 'α +1 Lưỡi Hái',
        summary: '+1 Lưỡi Hái Nghịch Lý mỗi lượt & +0.45ô tầm ném',
        accentColor: '#67E8F9',
        damageMult: 0.92,
        rofMult: 1.12,
        rangeBonus: 0.45,
        splashBonus: 14,
        armorPierceBonus: 0.1,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Trảm Hồn Tuyệt Đối',
        shortTag: 'ω +42% Chém',
        summary: '+42% sát thương nhát chém, xuyên 100% giáp & +50% phá khiên',
        accentColor: '#C084FC',
        damageMult: 1.42,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 18,
        armorPierceBonus: 0.22,
        shieldMultBonus: 0.5,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'paradox_chrono_reap',
      name: 'Bão Liềm Nghịch Lý ✦',
      color: '#67E8F9',
      summary: 'Phóng 5 Lưỡi Hái khổng lồ quét 2 chiều toàn thánh địa & tua ngược mục tiêu',
      heatPerShot: 18,
    },
  },
  {
    type: 'nebula_core',
    category: 'attack',
    exclusiveMapId: 'sector-19',
    hotkey: 'h',
    name: 'Lõi Tinh Vân Hủy Diệt ✦',
    shortName: 'Tinh Vân ✦',
    roleClue: 'Độc quyền Màn 19 · Mưa Sao Băng & Xé %HP Siêu Boss',
    accentColor: '#F0ABFC',
    cost: 850,
    baseDamage: 720,
    baseCooldown: 1.5,
    rangeTiles: 6.2,
    milestones: [
      { level: 3, name: 'Tam Tinh Thiên Thạch Hư Không', summary: 'Gọi 3 Sao Băng Tinh Vân nổ 105px & xé thêm 3% Máu tối đa Boss/Siêu Boss' },
      { level: 5, name: 'Mảnh Sao Tự Dẫn Cộng Hưởng', summary: 'Mỗi Sao Băng tách 2 mảnh sao tự dẫn + xuyên 100% giáp & 2.5× Khiên' },
      { level: 7, name: 'Tinh Vân Tận Thế · Ngũ Tinh', summary: '5 Sao Băng khổng lồ đồng loạt + xé 6% Máu tối đa Siêu Boss & nổ Hư Không!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bão Thiên Thạch',
        shortTag: 'α +1 Sao Băng',
        summary: '+1 Sao Băng mỗi loạt & +24px bán kính nổ Tinh Vân',
        accentColor: '#F0ABFC',
        damageMult: 0.95,
        rofMult: 1.14,
        rangeBonus: 0.4,
        splashBonus: 24,
        armorPierceBonus: 0,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sụp Đổ Siêu Boss',
        shortTag: 'ω +45% Xé Boss',
        summary: '+45% sát thương trực tiếp & +60% phá khiên Siêu Boss Hư Vô',
        accentColor: '#FB7185',
        damageMult: 1.45,
        rofMult: 0.94,
        rangeBonus: 0.2,
        splashBonus: 16,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.6,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'nebula_cosmic_collapse',
      name: 'Mưa Sao Băng Tận Thế ✦',
      color: '#F0ABFC',
      summary: 'Giáng 7 Thiên Thạch Tinh Vân xuống toàn bộ Boss & nổ tung đội hình Hư Không',
      heatPerShot: 22,
    },
  },

  // === NHÓM HỆ ĐIỆN / LIGHTNING (3 SÚNG CHUYÊN BIỆT) ===
  {
    type: 'tesla',
    category: 'electric',
    hotkey: '8',
    name: 'Trụ Sét Tesla',
    shortName: 'Tesla ⚡',
    roleClue: 'Sét giật lan + ngắt chiêu Boss',
    accentColor: '#38BDF8',
    cost: 85,
    baseDamage: 24,
    baseCooldown: 0.56,
    rangeTiles: 3.1,
    milestones: [
      { level: 3, name: 'Hồ Quang 4 Nhánh & Ngắt Chiêu', summary: 'Tia sét giật lan 4 mục tiêu, gây 165% Khiên & cắt chiêu Boss đang tụ' },
      { level: 5, name: 'Bão Ướt Cộng Hưởng', summary: '5 nhánh sét; đánh mục tiêu ướt/băng gây +40% DMG & +2 lần giật lan' },
      { level: 7, name: 'Bão Sét 7 Nhánh Vĩnh Cửu', summary: 'Giật 7 mục tiêu + phóng xung nổ điện từ 42px' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Chuỗi Sét Lan Xa',
        shortTag: 'α +2 Nhánh',
        summary: '+2 mục tiêu giật lan & tốc phóng sét +14%',
        accentColor: '#38BDF8',
        damageMult: 0.94,
        rofMult: 1.14,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.15,
        extraProjectiles: 0,
        extraChain: 2,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Sét Cao Áp Tê Liệt',
        shortTag: 'ω Cao Áp',
        summary: '+32% sát thương mỗi tia & +40% phá khiên',
        accentColor: '#0EA5E9',
        damageMult: 1.32,
        rofMult: 0.9,
        rangeBonus: 0,
        splashBonus: 10,
        armorPierceBonus: 0.15,
        shieldMultBonus: 0.4,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'tesla_chain_overcharge',
      name: 'Quá Tải Sét Liên Hoàn',
      color: '#38BDF8',
      summary: 'Giật sét 10 mục tiêu cùng lúc, làm tê liệt & ngắt mọi chiêu Boss trong tầm',
      heatPerShot: 12,
    },
  },
  {
    type: 'tempest',
    category: 'electric',
    hotkey: '9',
    name: 'Pháo Bão Ion EMP',
    shortName: 'Bão Ion ⚡',
    roleClue: 'Cầu sét AoE + hủy khiên + ngắt chiêu',
    accentColor: '#818CF8',
    cost: 105,
    baseDamage: 40,
    baseCooldown: 0.94,
    rangeTiles: 3.5,
    milestones: [
      { level: 3, name: 'Song Cầu EMP & Cắt Chiêu', summary: 'Phóng 2 cầu EMP, gây 175% Khiên, tê liệt 26% & ngắt chiêu Boss' },
      { level: 5, name: 'Cộng Hưởng Bão Ướt', summary: 'Trên mục tiêu ướt: nổ rộng +24px & phóng thêm sét lan' },
      { level: 7, name: 'Tam Cầu Bão Tối Thượng', summary: '3 cầu EMP + choáng ngắn 0.25s toàn vùng nổ' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Bầy Cầu Sét',
        shortTag: 'α +1 Cầu',
        summary: '+1 cầu sét dẫn đường mỗi loạt & tăng tầm nổ',
        accentColor: '#818CF8',
        damageMult: 0.88,
        rofMult: 1.1,
        rangeBonus: 0.25,
        splashBonus: 14,
        armorPierceBonus: 0,
        shieldMultBonus: 0.2,
        extraProjectiles: 1,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Lõi Siêu Phá Khiên',
        shortTag: 'ω Phá Khiên',
        summary: '+34% sát thương xung & +65% phá khiên Boss',
        accentColor: '#6366F1',
        damageMult: 1.34,
        rofMult: 0.9,
        rangeBonus: 0,
        splashBonus: 10,
        armorPierceBonus: 0.16,
        shieldMultBonus: 0.65,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'tempest_emp_storm',
      name: 'Bão Ion Hủy Khiên',
      color: '#818CF8',
      summary: 'Phát xung EMP diện rộng bóc giáp khiên, ngắt chiêu & giật tê liệt',
      heatPerShot: 15,
    },
  },
  {
    type: 'aurora_spire',
    category: 'electric',
    hotkey: 'd',
    name: 'Tháp Bão Từ Cực Quang ⚡',
    shortName: 'Cực Quang ⚡',
    roleClue: 'Pháo 500⚡ dựng Trụ Bão Từ giật sét liên tục & cắt chiêu',
    accentColor: '#2DD4BF',
    cost: 500,
    baseDamage: 245,
    baseCooldown: 1.05,
    rangeTiles: 4.4,
    milestones: [
      { level: 3, name: 'Song Trụ Bão Từ Cực Quang', summary: 'Duy trì 2 Cột Bão Từ trên đường đi giật sét 96px/0.42s, 2.2× Khiên & cắt chiêu Boss' },
      { level: 5, name: 'Cộng Hưởng Điện Từ Xuyên Giáp', summary: 'Xuyên 85% giáp, kích Cộng Hưởng Ướt +50% DMG & làm choáng 0.3s khi nổ xung' },
      { level: 7, name: 'Tam Trụ Vĩnh Hằng Cực Quang', summary: '3 Cột Bão Từ liên kết tia sét chéo giật 6 mục tiêu & tê liệt toàn khu vực!' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Mạng Trụ Đa Cực',
        shortTag: 'α +1 Trụ Bão',
        summary: '+1 Cột Bão Từ tối đa & +20px bán kính trường từ tính',
        accentColor: '#2DD4BF',
        damageMult: 0.94,
        rofMult: 1.12,
        rangeBonus: 0.35,
        splashBonus: 20,
        armorPierceBonus: 0.08,
        shieldMultBonus: 0.25,
        extraProjectiles: 1,
        extraChain: 1,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Hồ Quang Hủy Khiên',
        shortTag: 'ω +38% Phá Khiên',
        summary: '+38% sát thương điện từ & +55% công phá khiên Boss',
        accentColor: '#38BDF8',
        damageMult: 1.38,
        rofMult: 0.92,
        rangeBonus: 0.15,
        splashBonus: 12,
        armorPierceBonus: 0.2,
        shieldMultBonus: 0.55,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'aurora_magnetic_collapse',
      name: 'Bão Từ Hủy Diệt Cực Quang',
      color: '#2DD4BF',
      summary: 'Triệu hồi thêm Cột Bão Từ cực đại, giật sét nối mọi mục tiêu & cắt chiêu Boss',
      heatPerShot: 16,
    },
  },

  // === NHÓM HỖ TRỢ THUẦN TÚY (4 SÚNG: 0 SÁT THƯƠNG · 0 HỒI MÁU · 0 BUFF TỐC ĐÁNH) ===
  {
    type: 'beacon',
    category: 'support',
    hotkey: '0',
    name: 'Trạm Tụ Năng Chí Mạng',
    shortName: 'Tụ Năng ✦',
    roleClue: 'Buff +DMG & +Chí Mạng đội (0 sát thương)',
    accentColor: '#FACC15',
    cost: 85,
    baseDamage: 0,
    baseCooldown: 1.15,
    rangeTiles: 2.8,
    milestones: [
      { level: 3, name: 'Cộng Hưởng Chí Mạng 30%', summary: 'Đồng minh nhận +20% DMG & +30% Chí Mạng (×1.90)' },
      { level: 5, name: 'Trường Siêu Tụ 36%', summary: 'Mở rộng aura +0.35ô, đồng minh nhận +26% DMG & +36% Chí Mạng (×2.00)' },
      { level: 7, name: 'Lõi Thái Dương Chí Mạng', summary: '+34% DMG & +45% Chí Mạng (×2.15) quanh tháp (0 DMG)' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Tụ Điểm Yếu',
        shortTag: 'α +Chí Mạng',
        summary: '+10% tỉ lệ Chí Mạng & +0.25× hệ số Chí Mạng cho đồng minh',
        accentColor: '#FACC15',
        damageMult: 1,
        rofMult: 1,
        rangeBonus: 0.35,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Cường Hóa Sát Thương',
        shortTag: 'ω +DMG Đội',
        summary: '+12% Sát Thương cơ bản cộng thêm cho toàn bộ súng trong tầm',
        accentColor: '#F59E0B',
        damageMult: 1,
        rofMult: 1,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'beacon_solar_flare',
      name: 'Bùng Nổ Chí Mạng ✦',
      color: '#FACC15',
      summary: 'Cấp +35% Chí Mạng & +0.35× hệ số nổ cho đồng minh 3.6s + hồi +12⚡ năng lượng',
      heatPerShot: 14,
    },
  },
  {
    type: 'cryo',
    category: 'support',
    hotkey: 'q',
    name: 'Tháp Băng Sương Ẩm',
    shortName: 'Băng Ẩm ✦',
    roleClue: 'Làm chậm + Giòn Vỡ + Tỏa Ướt (0 sát thương)',
    accentColor: '#06B6D4',
    cost: 70,
    baseDamage: 0,
    baseCooldown: 0.85,
    rangeTiles: 2.95,
    milestones: [
      { level: 3, name: 'Sương Ẩm Giòn Vỡ', summary: 'Làm chậm 34%, giữ ẩm 2.6s giúp hệ Điện & khiến quái nhận +20% DMG' },
      { level: 5, name: 'Khí Lạnh Phủ Rộng', summary: 'Chậm 38%, Giòn +24% & hiện hình toàn bộ Tàng Hình' },
      { level: 7, name: 'Đông Kết Vĩnh Cửu', summary: 'Chậm 44%, Giòn +30% & ướt dẫn điện 3.4s (0 DMG)' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Sương Phủ Rộng',
        shortTag: 'α Phủ Rộng',
        summary: '+0.45ô bán kính tỏa sương & +1.0s giữ ẩm dẫn điện',
        accentColor: '#06B6D4',
        damageMult: 1,
        rofMult: 1.08,
        rangeBonus: 0.45,
        splashBonus: 18,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Tê Cóng Giòn Vỡ',
        shortTag: 'ω Giòn +12%',
        summary: '+12% sát thương Giòn Vỡ & +8% làm chậm quái trong vùng',
        accentColor: '#0EA5E9',
        damageMult: 1,
        rofMult: 0.95,
        rangeBonus: 0.15,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'cryo_absolute_zero',
      name: 'Bão Tuyết Ngưng Đọng ✦',
      color: '#67E8F9',
      summary: 'Phủ sương lạnh & làm ướt toàn vùng rộng, ép Giòn Vỡ +34% (0 sát thương)',
      heatPerShot: 14,
    },
  },
  {
    type: 'radar',
    category: 'support',
    hotkey: 'e',
    name: 'Trạm Radar Chỉ Thị',
    shortName: 'Radar ✦',
    roleClue: '+Tầm +Xuyên Giáp +Phá Khiên +Khóa Yếu (0 sát thương)',
    accentColor: '#22D3EE',
    cost: 85,
    baseDamage: 0,
    baseCooldown: 0.95,
    rangeTiles: 3.6,
    milestones: [
      { level: 3, name: 'Chỉ Thị & Quét Tàng Hình', summary: '+0.95ô Tầm, +24% Xuyên Giáp, +34% Phá Khiên, lộ Tàng Hình & khóa yếu +26%' },
      { level: 5, name: 'Chỉ Thị Bão Hòa', summary: '+1.25ô Tầm, +32% Xuyên Giáp, +42% Phá Khiên & bào mòn 24% giáp' },
      { level: 7, name: 'Mắt Thần Chỉ Huy', summary: '+1.60ô Tầm, +40% Xuyên Giáp, +55% Phá Khiên & khóa yếu +36% (0 DMG)' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Viễn Thám Toàn Dải',
        shortTag: 'α +Tầm & Khiên',
        summary: '+0.35ô tầm bắn thêm & +18% Phá Khiên cho đồng minh',
        accentColor: '#22D3EE',
        damageMult: 1,
        rofMult: 1.06,
        rangeBonus: 0.45,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0.18,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Khóa Điểm Yếu',
        shortTag: 'ω Khóa Yếu',
        summary: '+12% Xuyên Giáp đồng minh & +10% khuếch đại Điểm Yếu trên quái',
        accentColor: '#38BDF8',
        damageMult: 1,
        rofMult: 1,
        rangeBonus: 0.15,
        splashBonus: 0,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.08,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'radar_target_lock',
      name: 'Quét Toàn Phần · Tắt Chiêu ✦',
      color: '#22D3EE',
      summary: 'Lộ hình Tàng Hình, khóa điểm yếu +42% & ngắt chiêu Boss đang tụ (0 sát thương)',
      heatPerShot: 14,
    },
  },
  {
    type: 'quantum_prism',
    category: 'support',
    hotkey: 'w',
    name: 'Lăng Kính Cộng Hưởng Lượng Tử ✦',
    shortName: 'Lượng Tử ✦',
    roleClue: 'Câm Lặng + Cộng Hưởng + Đa Tia (0 DMG)',
    accentColor: '#34D399',
    cost: 500,
    baseDamage: 0,
    baseCooldown: 1.0,
    rangeTiles: 4.1,
    milestones: [
      { level: 3, name: 'Cộng Hưởng 24% & Câm Lặng', summary: 'Lan truyền 24% DMG sang 3–4 mục tiêu & Câm Lặng khóa hồi máu/khiên/triệu hồi Boss' },
      { level: 5, name: 'Liên Kết Đa Tia +1', summary: 'Đồng minh trong vùng bắn +1 đạn/nảy, lan truyền 30% DMG & thu +5⚡ mỗi hạ gục' },
      { level: 7, name: 'Ma Trận Vĩnh Hằng 38%', summary: 'Lan truyền 38% DMG sang 5 quái + Câm Lặng Boss & +6⚡ mỗi hạ gục (0 DMG)' },
    ],
    variants: {
      alpha: {
        id: 'alpha',
        name: 'Alpha · Liên Kết Đa Đạn',
        shortTag: 'α +Đa Tia & ⚡',
        summary: '+0.45ô tầm phủ, đồng minh +1 Tia/Nảy & tăng năng lượng thu hoạch',
        accentColor: '#34D399',
        damageMult: 1,
        rofMult: 1.08,
        rangeBonus: 0.45,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
      omega: {
        id: 'omega',
        name: 'Omega · Cộng Hưởng Câm Lặng',
        shortTag: 'ω +14% Lan & Khóa',
        summary: '+14% tỉ lệ lan truyền Cộng Hưởng & tăng thời gian Câm Lặng Boss',
        accentColor: '#2DD4BF',
        damageMult: 1,
        rofMult: 1,
        rangeBonus: 0.2,
        splashBonus: 0,
        armorPierceBonus: 0,
        shieldMultBonus: 0,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'quantum_singularity_protocol',
      name: 'Giao Thức Câm Lặng Lượng Tử ✦',
      color: '#34D399',
      summary: 'Câm lặng toàn vùng rộng, khuếch đại Cộng Hưởng lên 50% & thu ngay +35⚡ (0 sát thương)',
      heatPerShot: 14,
    },
  },
];

export function getGunCategory(type: GunType): GunCategory {
  return getGunCatalogItem(type).category;
}

export function isElectricGunType(type: GunType): boolean {
  return getGunCategory(type) === 'electric';
}

export function isSupportGunType(type: GunType): boolean {
  return getGunCategory(type) === 'support';
}

export function getAvailableGunsForMap(mapId?: string): GunCatalogItem[] {
  return GUN_CATALOG.filter((g) => !g.exclusiveMapId || (Boolean(mapId) && g.exclusiveMapId === mapId));
}

export function getExclusiveGunForMap(mapId: string): GunCatalogItem | null {
  return GUN_CATALOG.find((g) => g.exclusiveMapId === mapId) ?? null;
}

export function getMapScalingCurve(mapId: string): MapDifficultyScaling {
  const idx = Math.max(
    0,
    PRISM_MAPS.findIndex((m) => m.id === mapId)
  );
  const progress = PRISM_MAPS.length > 1 ? idx / (PRISM_MAPS.length - 1) : 0; // 0.0 -> 1.0
  const hpMult = Number((1 + progress * 0.68).toFixed(3));
  const shieldMult = Number((1 + progress * 0.5).toFixed(3));
  const speedMult = Number((1 + progress * 0.08).toFixed(3));
  const armorBonus = Number((progress * 0.08).toFixed(3));
  const rewardMult = Number((1 + progress * 0.34).toFixed(3));
  return { hpMult, shieldMult, speedMult, armorBonus, rewardMult };
}

export const PRISM_MAPS: readonly TdMapDef[] = [
  {
    id: 'sector-01',
    name: 'Màn 01 · Thung Lũng Khởi Đầu',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 16 Đợt',
    subtitle: 'Thung lũng đối xứng rộng 16×10 với 2 khúc cua giữ nhịp lý tưởng.',
    tacticalHint: 'Gợi ý: Đặt Tụ Năng (0) ở trung tâm (5,4) & Băng Ẩm (Q) kết hợp Tesla (8) tại hồ dẫn điện.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 195,
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
    wetZones: [
      { col: 4, row: 5 },
      { col: 10, row: 1 },
    ],
    bossSpec: {
      id: 'boss-01',
      name: 'Vanguard Prime',
      title: 'Thủ Lĩnh Thung Lũng · Vanguard Prime',
      color: '#38BDF8',
      secondaryColor: '#0EA5E9',
      emblemKind: 'crown',
      signatureSkill: 'shield_surge',
      flavor: 'Thiết giáp trinh sát đầu tiên kích hoạt lá chắn plasma tuần hoàn.',
    },
  },
  {
    id: 'sector-02',
    name: 'Màn 02 · Giao Lộ Ma Trận',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 16 Đợt',
    subtitle: 'Hai vòng chữ U lớn cho phép tháp tầm xa quét nhiều lần.',
    tacticalHint: 'Gợi ý: Đĩa Cưa (4) & Railgun (7) phát huy tối đa dọc hành lang thẳng dài hàng 8.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 200,
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
    wetZones: [
      { col: 4, row: 4 },
      { col: 8, row: 8 },
    ],
    bossSpec: {
      id: 'boss-02',
      name: 'Hex Matrix',
      title: 'Kỵ Sĩ Lục Giác · Hex Matrix',
      color: '#34D399',
      secondaryColor: '#10B981',
      emblemKind: 'halo',
      signatureSkill: 'armor_bastion',
      flavor: 'Thân vỏ ma trận có khả năng dựng Pháo Đài Giáp cứng trên hành lang thẳng.',
    },
  },
  {
    id: 'sector-03',
    name: 'Màn 03 · Lò Rèn Huyết Thép',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 18 Đợt',
    subtitle: 'Vách đá bazan chắn tâm buộc quái vòng qua hành lang trên.',
    tacticalHint: 'Gợi ý: Phun Lửa (3) bào giáp & Pháo Cối (5) kéo gom ngay khúc cua (3,1) và (12,1).',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 210,
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
    wetZones: [
      { col: 3, row: 4 },
      { col: 8, row: 1 },
    ],
    bossSpec: {
      id: 'boss-03',
      name: 'Ignis Vulcan',
      title: 'Chiến Tướng Lò Rèn · Ignis Vulcan',
      color: '#FB7185',
      secondaryColor: '#F97316',
      emblemKind: 'horns',
      signatureSkill: 'armor_bastion',
      flavor: 'Chiến xa bọc thép bazan nóng chảy chịu lực cao.',
    },
  },
  {
    id: 'sector-04',
    name: 'Màn 04 · Đại Lộ Hư Không',
    recommendedDifficulty: 'easy',
    difficultyLabel: 'Dễ · 18 Đợt',
    subtitle: 'Ba tầng đường song song — lý tưởng để chồng aura Tụ Năng & Radar.',
    tacticalHint: 'Gợi ý: Đặt Radar (E) ở tầng giữa để soi 2 tuyến đường cùng lúc.',
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
    wetZones: [
      { col: 8, row: 1 },
      { col: 8, row: 5 },
      { col: 8, row: 8 },
    ],
    bossSpec: {
      id: 'boss-04',
      name: 'Nyx Weaver',
      title: 'Bóng Ma Đại Lộ · Nyx Weaver',
      color: '#C084FC',
      secondaryColor: '#A855F7',
      emblemKind: 'void_star',
      signatureSkill: 'escort_deploy',
      flavor: 'Thủ lĩnh hư ảnh chuyên thả đội trinh sát bọc hậu.',
    },
  },
  {
    id: 'sector-05',
    name: 'Màn 05 · Sa Mạc Răng Cưa',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 20 Đợt',
    subtitle: 'Năm khúc cua dích dắc tạo nhiều hẻm hỏa lực chéo.',
    tacticalHint: 'Gợi ý: Đặt Shotgun (2) & Phun Lửa (3) ở các góc kẹp chữ U để ăn trọn sát thương.',
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
    wetZones: [
      { col: 3, row: 4 },
      { col: 7, row: 4 },
      { col: 11, row: 5 },
    ],
    bossSpec: {
      id: 'boss-05',
      name: 'Dune Goliath',
      title: 'Cự Thú Bão Cát · Dune Goliath',
      color: '#FBBF24',
      secondaryColor: '#F59E0B',
      emblemKind: 'horns',
      signatureSkill: 'armor_bastion',
      flavor: 'Thiết giáp hạng nặng nghiền nát tuyến chữ U bằng giáp cát dày.',
    },
  },
  {
    id: 'sector-06',
    name: 'Màn 06 · Lõi Băng Cực Quang',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 22 Đợt',
    subtitle: 'Đường xoắn ốc hội tụ vào Lõi giúp tháp trung tâm bắn trọn cả vòng.',
    tacticalHint: 'Gợi ý: Vùng nước tự nhiên quanh xoắn ốc giúp Tesla (8) & Bão Ion (9) giật lan cực mạnh.',
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
    wetZones: [
      { col: 7, row: 8 },
      { col: 8, row: 1 },
      { col: 6, row: 5 },
    ],
    bossSpec: {
      id: 'boss-06',
      name: 'Glacier Warden',
      title: 'Thần Thủ Lõi Băng · Glacier Warden',
      color: '#7DD3FC',
      secondaryColor: '#BAE6FD',
      emblemKind: 'frost_crest',
      signatureSkill: 'shield_surge',
      flavor: 'Pháo đài băng tinh liên tục tái tạo khiên năng lượng hàn băng.',
    },
  },
  {
    id: 'sector-07',
    name: 'Màn 07 · Xoáy Lốc Bào Mòn',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 22 Đợt',
    subtitle: 'Tuyến xoắn kép tách biệt hoàn toàn — không cắt chéo, tối ưu bẫy khu vực.',
    tacticalHint: 'Gợi ý: Cụm Băng Ẩm (Q) + Tesla (8) + Vulcan (1) đặt giữa đảo trung tâm khóa chặt quái.',
    biome: 'cyber_cyan',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 245,
    startCoreHp: 24,
    totalWaves: 22,
    path: [
      { col: 0, row: 4 },
      { col: 3, row: 4 },
      { col: 3, row: 1 },
      { col: 12, row: 1 },
      { col: 12, row: 4 },
      { col: 6, row: 4 },
      { col: 6, row: 8 },
      { col: 14, row: 8 },
      { col: 14, row: 6 },
      { col: 15, row: 6 },
    ],
    walls: [
      { col: 8, row: 2 },
      { col: 9, row: 6 },
      { col: 1, row: 7 },
    ],
    wetZones: [
      { col: 9, row: 1 },
      { col: 9, row: 4 },
      { col: 10, row: 8 },
    ],
    bossSpec: {
      id: 'boss-07',
      name: 'Tempest Vex',
      title: 'Chúa Xoáy Lốc · Tempest Vex',
      color: '#22D3EE',
      secondaryColor: '#38BDF8',
      emblemKind: 'halo',
      signatureSkill: 'escort_deploy',
      flavor: 'Tàu chỉ huy xoáy lốc dẫn theo bầy trinh sát cơ động cao.',
    },
  },
  {
    id: 'sector-08',
    name: 'Màn 08 · Pháo Đài Kép Titan',
    recommendedDifficulty: 'normal',
    difficultyLabel: 'Trung Bình · 24 Đợt',
    subtitle: 'Hai cánh chữ U đối đầu tách mạch — lý tưởng để dàn ụ Tên Lửa & Pháo Cối.',
    tacticalHint: 'Gợi ý: Dùng Bão Ion (9) bóc khiên Khiên Giáp và ngắt chiêu Siêu Boss cuối màn.',
    biome: 'crimson_forge',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 255,
    startCoreHp: 24,
    totalWaves: 24,
    path: [
      { col: 0, row: 1 },
      { col: 6, row: 1 },
      { col: 6, row: 3 },
      { col: 1, row: 3 },
      { col: 1, row: 8 },
      { col: 9, row: 8 },
      { col: 9, row: 5 },
      { col: 12, row: 5 },
      { col: 12, row: 2 },
      { col: 15, row: 2 },
    ],
    walls: [
      { col: 4, row: 5 },
      { col: 11, row: 7 },
      { col: 14, row: 6 },
    ],
    wetZones: [
      { col: 1, row: 6 },
      { col: 5, row: 8 },
      { col: 12, row: 3 },
    ],
    bossSpec: {
      id: 'boss-08',
      name: 'Titan Bastion',
      title: 'Pháo Đài Đôi · Titan Bastion',
      color: '#F43F5E',
      secondaryColor: '#FB7185',
      emblemKind: 'crown',
      signatureSkill: 'armor_bastion',
      flavor: 'Pháo đài di động hai nòng phòng thủ vững như bàn thạch.',
    },
  },
  {
    id: 'sector-09',
    name: 'Màn 09 · Ma Trận Tam Giáp',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 26 Đợt',
    subtitle: 'Ba bậc hỏa lực chéo tạo tuyến phòng thủ nhiều tầng lớp.',
    tacticalHint: 'Gợi ý: Đặt Radar (E) mở tầm & xuyên giáp cho cụm Railgun (7) bắn dọc hành lang.',
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
    wetZones: [
      { col: 4, row: 5 },
      { col: 8, row: 5 },
      { col: 12, row: 4 },
    ],
    bossSpec: {
      id: 'boss-09',
      name: 'Triad Sentinel',
      title: 'Vệ Thần Tam Giáp · Triad Sentinel',
      color: '#10B981',
      secondaryColor: '#6EE7B7',
      emblemKind: 'crown',
      signatureSkill: 'shield_surge',
      flavor: 'Hộ vệ ba lớp giáp khiên luân phiên phục hồi liên tục.',
    },
  },
  {
    id: 'sector-10',
    name: 'Màn 10 · Hẻm Núi Thiên Thạch',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 26 Đợt',
    subtitle: 'Hẻm núi chia 4 sườn dài, rất thích hợp phối hợp Tụ Năng + Pháo Cối.',
    tacticalHint: 'Gợi ý: Giữ tiền nâng 1 Railgun hoặc Pháo Cối lên Lv7+ trước đợt 14 để chống Boss.',
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
    wetZones: [
      { col: 3, row: 5 },
      { col: 7, row: 4 },
      { col: 11, row: 5 },
    ],
    bossSpec: {
      id: 'boss-10',
      name: 'Meteor Crusher',
      title: 'Kẻ Nghiền Thiên Thạch · Meteor Crusher',
      color: '#F97316',
      secondaryColor: '#FDE047',
      emblemKind: 'horns',
      signatureSkill: 'armor_bastion',
      flavor: 'Thiết giáp thiên thạch lao dọc 4 hẻm núi dài với giáp siêu dày.',
    },
  },
  {
    id: 'sector-11',
    name: 'Màn 11 · Cầu Băng Vỡ Vụn',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 28 Đợt',
    subtitle: 'Cầu băng 3 tầng tốc độ cao — vùng nước lạnh có sẵn dọc 3 nhịp cầu.',
    tacticalHint: 'Gợi ý: Tận dụng 3 hồ băng nước trên cầu cho hệ Điện (8, 9) giật cộng hưởng ướt.',
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
    wetZones: [
      { col: 7, row: 0 },
      { col: 7, row: 4 },
      { col: 8, row: 9 },
    ],
    bossSpec: {
      id: 'boss-11',
      name: 'Borealis Leviathan',
      title: 'Bắc Cực Thủy Quái · Borealis Leviathan',
      color: '#67E8F9',
      secondaryColor: '#38BDF8',
      emblemKind: 'frost_crest',
      signatureSkill: 'shield_surge',
      flavor: 'Cự thú băng giá sở hữu trường khiên cộng hưởng trên 3 nhịp cầu.',
    },
  },
  {
    id: 'sector-12',
    name: 'Màn 12 · Lò Luyện Ngục Hỏa',
    recommendedDifficulty: 'hard',
    difficultyLabel: 'Khó · 28 Đợt',
    subtitle: 'Chữ M ngược cắt chéo chia nhỏ lực lượng quái vật qua các hẻm.',
    tacticalHint: 'Gợi ý: Combo Phun Lửa (3) + Băng Ẩm (Q) + Tesla (8) xử lý tốt cả quái đông lẫn Boss.',
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
    wetZones: [
      { col: 3, row: 5 },
      { col: 7, row: 5 },
      { col: 11, row: 4 },
    ],
    bossSpec: {
      id: 'boss-12',
      name: 'Inferno Overlord',
      title: 'Bá Chủ Ngục Hỏa · Inferno Overlord',
      color: '#EF4444',
      secondaryColor: '#FB923C',
      emblemKind: 'horns',
      signatureSkill: 'armor_bastion',
      flavor: 'Ma vương luyện ngục rèn giáp thép nóng đỏ không sợ đạn thường.',
    },
  },
  {
    id: 'sector-13',
    name: 'Màn 13 · Tổ Ong Bóng Đêm',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 30 Đợt',
    subtitle: 'Vách tổ ong chia ô chiến thuật — quái Tàng Hình & Biến Ảnh dồn dập.',
    tacticalHint: 'Gợi ý: Đặt Radar (E) & Băng Ẩm (Q) sớm để vạch mặt Tàng Hình và khóa Biến Ảnh.',
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
    wetZones: [
      { col: 1, row: 4 },
      { col: 5, row: 4 },
      { col: 9, row: 5 },
    ],
    bossSpec: {
      id: 'boss-13',
      name: 'Shadow Monarch',
      title: 'Quân Vương Bóng Tối · Shadow Monarch',
      color: '#A855F7',
      secondaryColor: '#F472B6',
      emblemKind: 'void_star',
      signatureSkill: 'escort_deploy',
      flavor: 'Triệu hồi bầy trinh sát bóng đêm giữa mê cung tổ ong.',
    },
  },
  {
    id: 'sector-14',
    name: 'Màn 14 · Tuyến Phòng Thủ Omega',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 32 Đợt',
    subtitle: 'Tuyến công trực diện tốc độ cao — đòi hỏi phối hợp Hỗ Trợ & Hệ Điện.',
    tacticalHint: 'Gợi ý: Tụ Năng (0) đặt cạnh Railgun (7) + Tên Lửa (6) tối ưu chí mạng diệt Siêu Boss.',
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
    wetZones: [
      { col: 4, row: 3 },
      { col: 7, row: 1 },
      { col: 10, row: 5 },
    ],
    bossSpec: {
      id: 'boss-14',
      name: 'Omega Dreadcore',
      title: 'Hạt Nhân Omega · Dreadcore',
      color: '#38BDF8',
      secondaryColor: '#818CF8',
      emblemKind: 'crown',
      signatureSkill: 'shield_surge',
      flavor: 'Hạt nhân siêu giáp mang lõi năng lượng phản ứng cực đại.',
    },
  },
  {
    id: 'sector-15',
    name: 'Màn 15 · Vành Đai Sinh Tử',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 34 Đợt',
    subtitle: 'Vành đai kép 34 đợt — quái trâu giáp dày cùng hàng loạt Siêu Boss cuối trận.',
    tacticalHint: 'Gợi ý: Dùng Phun Lửa + Radar bào giáp, kết hợp Tesla/Bão Ion cắt chiêu Siêu Boss.',
    biome: 'emerald_matrix',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 345,
    startCoreHp: 26,
    totalWaves: 34,
    path: [
      { col: 0, row: 1 },
      { col: 14, row: 1 },
      { col: 14, row: 5 },
      { col: 10, row: 5 },
      { col: 10, row: 3 },
      { col: 2, row: 3 },
      { col: 2, row: 8 },
      { col: 15, row: 8 },
    ],
    walls: [
      { col: 6, row: 2 },
      { col: 6, row: 5 },
      { col: 12, row: 6 },
    ],
    wetZones: [
      { col: 7, row: 1 },
      { col: 6, row: 3 },
      { col: 9, row: 8 },
    ],
    bossSpec: {
      id: 'boss-15',
      name: 'Biohazard Colossus',
      title: 'Cự Nhân Sinh Tử · Biohazard Colossus',
      color: '#2DD4BF',
      secondaryColor: '#34D399',
      emblemKind: 'halo',
      signatureSkill: 'armor_bastion',
      flavor: 'Cỗ máy sinh học vành đai sinh tử với lớp vỏ tự cường hóa.',
    },
  },
  {
    id: 'sector-16',
    name: 'Màn 16 · Đế Chế Hư Không',
    recommendedDifficulty: 'hell',
    difficultyLabel: 'Địa Ngục · 36 Đợt',
    subtitle: 'Đại chiến chung kết 36+ đợt với lộ trình xoắn sạch sẽ, không giao cắt.',
    tacticalHint: 'Gợi ý: Đội hình chuẩn: Tụ Năng (0) + Radar (E) + Băng Ẩm (Q) hậu thuẫn Tesla (8) & Railgun (7).',
    biome: 'violet_void',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 365,
    startCoreHp: 28,
    totalWaves: 36,
    path: [
      { col: 0, row: 8 },
      { col: 5, row: 8 },
      { col: 5, row: 5 },
      { col: 1, row: 5 },
      { col: 1, row: 1 },
      { col: 9, row: 1 },
      { col: 9, row: 4 },
      { col: 12, row: 4 },
      { col: 12, row: 8 },
      { col: 15, row: 8 },
    ],
    walls: [
      { col: 7, row: 2 },
      { col: 7, row: 7 },
      { col: 3, row: 3 },
      { col: 14, row: 2 },
    ],
    wetZones: [
      { col: 1, row: 3 },
      { col: 5, row: 1 },
      { col: 12, row: 6 },
    ],
    bossSpec: {
      id: 'boss-16',
      name: 'Void Imperator',
      title: 'Hoàng Đế Hư Không · Void Imperator',
      color: '#E879F9',
      secondaryColor: '#C084FC',
      emblemKind: 'void_star',
      signatureSkill: 'escort_deploy',
      flavor: 'Đế vương chiến trường tiêu chuẩn thống lĩnh binh đoàn Hư Không.',
    },
  },
  {
    id: 'sector-17',
    name: 'Màn 17 · Đấu Trường Hoàng Kim',
    recommendedDifficulty: 'hell',
    difficultyLabel: '★ Đặc Biệt · 38 Đợt',
    subtitle: 'Đại lộ Hoàng Kim xoắn kép 56 ô — hai tuyến áp sát song song qua 4 hồ dẫn điện cổ đại.',
    tacticalHint: 'Gợi ý: Đặt vũ khí độc quyền Thánh Pháo Hoàng Kim (F · 450⚡) & Siêu Tân Tinh (V) tại (6,2) để bắn xuyên 2 đại lộ & thu thêm ⚡!',
    biome: 'prismatic_nexus',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 560,
    startCoreHp: 30,
    totalWaves: 38,
    path: [
      { col: 0, row: 1 },
      { col: 14, row: 1 },
      { col: 14, row: 4 },
      { col: 10, row: 4 },
      { col: 10, row: 3 },
      { col: 2, row: 3 },
      { col: 2, row: 8 },
      { col: 6, row: 8 },
      { col: 6, row: 5 },
      { col: 8, row: 5 },
      { col: 8, row: 8 },
      { col: 14, row: 8 },
      { col: 14, row: 6 },
      { col: 15, row: 6 },
    ],
    walls: [
      { col: 1, row: 5 },
      { col: 7, row: 4 },
      { col: 12, row: 2 },
      { col: 12, row: 5 },
    ],
    wetZones: [
      { col: 7, row: 1 },
      { col: 6, row: 3 },
      { col: 2, row: 6 },
      { col: 11, row: 8 },
    ],
    bossSpec: {
      id: 'boss-17',
      name: 'Aurelius Rex',
      title: 'Hộ Vệ Hoàng Kim · Aurelius Rex ★',
      color: '#FACC15',
      secondaryColor: '#F59E0B',
      emblemKind: 'solar_wings',
      signatureSkill: 'shield_surge',
      flavor: 'Thần hộ vệ giáp vàng sở hữu Đôi Cánh Thái Dương & khiên hoàng kim bất khuất.',
    },
  },
  {
    id: 'sector-18',
    name: 'Màn 18 · Thánh Địa Thời Không',
    recommendedDifficulty: 'hell',
    difficultyLabel: '✦ Siêu Đặc Biệt · 40 Đợt',
    subtitle: 'Thánh địa 57 ô quanh 2 pháo đài lõi thời gian & 5 mạch nước dẫn điện cổ đại.',
    tacticalHint: 'Gợi ý: Dùng vũ khí độc quyền Lưỡi Hái Nghịch Lý (G · 600⚡) kết hợp Thời Không (B) để chém 2 chiều & tua ngược Siêu Boss!',
    biome: 'chrono_sanctum',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 880,
    startCoreHp: 35,
    totalWaves: 40,
    path: [
      { col: 0, row: 1 },
      { col: 14, row: 1 },
      { col: 14, row: 4 },
      { col: 11, row: 4 },
      { col: 11, row: 3 },
      { col: 2, row: 3 },
      { col: 2, row: 8 },
      { col: 5, row: 8 },
      { col: 5, row: 5 },
      { col: 8, row: 5 },
      { col: 8, row: 8 },
      { col: 12, row: 8 },
      { col: 12, row: 6 },
      { col: 15, row: 6 },
    ],
    walls: [
      { col: 0, row: 4 },
      { col: 15, row: 2 },
      { col: 1, row: 9 },
      { col: 14, row: 8 },
    ],
    wetZones: [
      { col: 6, row: 1 },
      { col: 8, row: 3 },
      { col: 2, row: 6 },
      { col: 7, row: 5 },
      { col: 10, row: 8 },
    ],
    bossSpec: {
      id: 'boss-18',
      name: 'Aeon Chronos',
      title: 'Quân Chủ Thời Không · Aeon Chronos ✦',
      color: '#22D3EE',
      secondaryColor: '#C084FC',
      emblemKind: 'chrono_dial',
      signatureSkill: 'armor_bastion',
      flavor: 'Chủ nhân thánh địa mang đồng hồ thực tại khổng lồ bẻ cong đòn đánh.',
    },
  },
  {
    id: 'sector-19',
    name: 'Màn 19 · Đại Vực Hư Không (Siêu Rộng)',
    recommendedDifficulty: 'super_hell',
    difficultyLabel: '✦ Siêu Rộng 24×14 · 42 Đợt',
    subtitle: 'Bản đồ siêu rộng 24×14 với tuyến ngoằn ngoèo 73 ô & 6 hồ dẫn điện — chiến trường đỉnh cao cho Pháo 1200⚡ & Lăng Kính 500⚡!',
    tacticalHint: 'Gợi ý: Kết hợp vũ khí độc quyền Lõi Tinh Vân (H · 850⚡) + Pháo Tối Thượng (N · 1200⚡) để đối đầu Siêu Vực Chủ 2 Pha!',
    biome: 'astral_abyss',
    cols: 24,
    rows: 14,
    startEnergy: 1340,
    startCoreHp: 38,
    totalWaves: 42,
    path: [
      { col: 0, row: 2 },
      { col: 5, row: 2 },
      { col: 5, row: 11 },
      { col: 10, row: 11 },
      { col: 10, row: 1 },
      { col: 15, row: 1 },
      { col: 15, row: 12 },
      { col: 20, row: 12 },
      { col: 20, row: 3 },
      { col: 23, row: 3 },
    ],
    walls: [
      { col: 2, row: 6 },
      { col: 7, row: 6 },
      { col: 12, row: 6 },
      { col: 17, row: 7 },
      { col: 22, row: 8 },
    ],
    wetZones: [
      { col: 5, row: 6 },
      { col: 10, row: 6 },
      { col: 15, row: 6 },
      { col: 20, row: 7 },
      { col: 12, row: 1 },
      { col: 17, row: 12 },
    ],
    bossSpec: {
      id: 'boss-19',
      name: 'Omega Abyssar',
      title: 'Siêu Vực Chủ · Omega Abyssar ✦',
      color: '#F0ABFC',
      secondaryColor: '#F43F5E',
      emblemKind: 'void_star',
      signatureSkill: 'escort_deploy',
      flavor: 'Siêu Boss tối thượng 2 Pha vùng Đại Vực — hóa Cuồng Nộ & tái nạp khiên dưới 50% HP!',
    },
  },
];

export function gridToWorldCenter(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}

const mapPathTileSetCache = new WeakMap<TdMapDef, Set<string>>();

export function getMapPathTileSet(map: TdMapDef): Set<string> {
  const cached = mapPathTileSetCache.get(map);
  if (cached) return cached;
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
  mapPathTileSetCache.set(map, occupied);
  return occupied;
}

/**
 * Validates that a map's enemy path is strictly orthogonal, stays in bounds,
 * and NEVER self-intersects or visits any tile more than once, and that walls/wetZones are consistent.
 */
export function validateMapPathNonIntersecting(map: TdMapDef): boolean {
  if (map.path.length < 2) return false;
  const visited = new Set<string>();

  for (let i = 0; i < map.path.length; i++) {
    const pt = map.path[i];
    if (pt.col < 0 || pt.col >= map.cols || pt.row < 0 || pt.row >= map.rows) return false;
  }

  const startKey = `${map.path[0].col},${map.path[0].row}`;
  visited.add(startKey);

  for (let i = 0; i < map.path.length - 1; i++) {
    const a = map.path[i];
    const b = map.path[i + 1];
    const dc = b.col - a.col;
    const dr = b.row - a.row;
    if ((dc === 0 && dr === 0) || (dc !== 0 && dr !== 0)) return false;
    const stepC = Math.sign(dc);
    const stepR = Math.sign(dr);
    let c = a.col;
    let r = a.row;
    while (c !== b.col || r !== b.row) {
      c += stepC;
      r += stepR;
      const key = `${c},${r}`;
      if (visited.has(key)) return false;
      visited.add(key);
    }
  }

  for (const w of map.walls) {
    if (w.col < 0 || w.col >= map.cols || w.row < 0 || w.row >= map.rows) return false;
    if (visited.has(`${w.col},${w.row}`)) return false;
  }

  const endKey = `${map.path[map.path.length - 1].col},${map.path[map.path.length - 1].row}`;
  for (const wz of map.wetZones) {
    const key = `${wz.col},${wz.row}`;
    if (!visited.has(key) || key === startKey || key === endKey) return false;
  }

  return true;
}

export function isWetZoneTile(map: TdMapDef, col: number, row: number): boolean {
  return map.wetZones.some((z) => z.col === col && z.row === row);
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
 * Upgrade cost from `level` to `level + 1` (supports levels 1..6 -> MAX Lv7, null at MAX Lv7).
 * Each upgrade tier doubles cost: 2x -> 4x -> 8x -> 16x -> 32x -> 64x base cost.
 */
export function getGunUpgradeCost(type: GunType, level: number): number | null {
  if (level >= MAX_GUN_LEVEL || level < 1) return null;
  const item = getGunCatalogItem(type);
  return Math.round(item.cost * Math.pow(2, level));
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

const GUN_PROFILE_CACHE = new Map<string, GunCombatProfile>();

/**
 * Computes deterministic combat stats, visual tier, and unlocked milestone skills for Lv1..7.
 * Each upgrade doubles both cost AND base damage (`2^(level-1)`): 1x -> 2x -> 4x -> 8x -> 16x -> 32x -> 64x.
 * Pure support towers (`beacon`, `cryo`, `radar`, `quantum_prism`) ALWAYS output 0 damage, 0 dpsEstimate, 0 burnDps.
 */
export function getGunCombatProfile(
  type: GunType,
  rawLevel: number,
  variant: GunVariant = 'alpha'
): GunCombatProfile {
  const level = Math.max(1, Math.min(MAX_GUN_LEVEL, Math.round(rawLevel)));
  const cacheKey = `${type}:${level}:${variant}`;
  const cached = GUN_PROFILE_CACHE.get(cacheKey);
  if (cached) return cached;

  const item = getGunCatalogItem(type);
  const vSpec = item.variants[variant] ?? item.variants.alpha;
  const isSupport = item.category === 'support';

  const lvOffset = (level - 1) * 1.5;
  const dmgMult = Math.pow(2, level - 1) * vSpec.damageMult;
  const rofMult = (1 + lvOffset * 0.055 + (level >= MAX_GUN_LEVEL ? 0.08 : 0)) * vSpec.rofMult;
  const rangeBonusTiles =
    lvOffset * 0.075 + (level >= 5 ? 0.1 : 0) + (level >= MAX_GUN_LEVEL ? 0.15 : 0) + vSpec.rangeBonus;

  const damage = isSupport ? 0 : Math.round(item.baseDamage * dmgMult);
  const cooldownSec = Number((item.baseCooldown / rofMult).toFixed(3));
  const rangeTiles = Number((item.rangeTiles + rangeBonusTiles).toFixed(2));
  const rangePx = Math.round(rangeTiles * TILE_SIZE);

  let armorPierce = isSupport ? 0 : 0.1 + lvOffset * 0.025;
  let shieldMult = 1;
  let splashRadius = 0;
  let projectilesPerShot = 1;
  let chainCount = 1;
  let slowPct = 0;
  let brittleBonus = 0;
  let burnDps = 0;
  let pullForce = 0;

  if (type === 'gatling') {
    armorPierce = level >= 7 ? 0.78 : level >= 3 ? 0.45 + (level - 3) * 0.07 : 0.15;
    projectilesPerShot = level >= 7 ? 4 : level >= 5 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 5 ? 24 + (level - 5) * 4 : 0;
    shieldMult = level >= 5 ? 1.15 : 1;
  } else if (type === 'shotgun') {
    projectilesPerShot = level >= 7 ? 9 : level >= 5 ? 7 : level >= 3 ? 6 : 5;
    armorPierce = level >= 5 ? 0.42 + (level - 5) * 0.1 : level >= 3 ? 0.28 : 0.12;
    burnDps = level >= 3 ? Math.round(damage * 0.45) : 0;
    splashRadius = level >= 7 ? 26 : 0;
    pullForce = level >= 7 ? 14 : 0;
    shieldMult = 1.15;
  } else if (type === 'flamer') {
    armorPierce = level >= 3 ? 0.72 : 0.45;
    burnDps = Math.round(damage * (level >= 3 ? 0.68 : 0.48));
    slowPct = level >= 5 ? 0.18 : 0;
    shieldMult = level >= 5 ? 1.15 : 1;
  } else if (type === 'saw') {
    armorPierce = level >= 3 ? 0.54 : 0.34;
    projectilesPerShot = level >= 7 ? 3 : level >= 5 ? 2 : 1;
    chainCount = level >= 7 ? 7 : level >= 5 ? 5 : level >= 3 ? 4 : 3;
    splashRadius = level >= 7 ? 24 : 0;
    burnDps = level >= 3 ? Math.round(damage * 0.32) : 0;
    shieldMult = 1.15;
  } else if (type === 'mortar') {
    armorPierce = level >= 5 ? 0.68 : 0.52 + lvOffset * 0.025;
    projectilesPerShot = level >= 7 ? 2 : 1;
    splashRadius = 76 + lvOffset * 4 + (level >= 5 ? 10 : 0);
    pullForce = level >= 3 ? 12 + (level - 3) * 2.2 : 4;
    slowPct = level >= 3 ? 0.3 : 0.18;
    burnDps = level >= 3 ? Math.round(damage * 0.24) : 0;
  } else if (type === 'missile') {
    armorPierce = 0.42 + lvOffset * 0.03;
    projectilesPerShot = level >= 7 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = 64 + lvOffset * 4 + (level >= 3 ? 12 : 0);
    shieldMult = 1.2;
  } else if (type === 'railgun') {
    armorPierce = level >= 7 ? 1 : level >= 3 ? 0.85 : 0.55;
    projectilesPerShot = level >= 7 ? 3 : level >= 5 ? 2 : 1;
    shieldMult = level >= 3 ? 1.75 : 1.3;
    splashRadius = level >= 5 ? 40 + (level - 5) * 6 : 0;
  } else if (type === 'prism_refract') {
    armorPierce = level >= 7 ? 0.94 : level >= 5 ? 0.85 : level >= 3 ? 0.68 : 0.48;
    chainCount = level >= 7 ? 6 : level >= 5 ? 4 : level >= 3 ? 3 : 2;
    shieldMult = level >= 5 ? 1.85 : level >= 3 ? 1.55 : 1.3;
    splashRadius = level >= 7 ? 58 : level >= 5 ? 36 : 0;
    brittleBonus = level >= 7 ? 0.32 : level >= 5 ? 0.26 : level >= 3 ? 0.2 : 0.14;
  } else if (type === 'orbital') {
    armorPierce = level >= 7 ? 1 : level >= 5 ? 0.95 : level >= 3 ? 0.84 : 0.72;
    projectilesPerShot = level >= 7 ? 4 : level >= 3 ? 2 : 1;
    splashRadius = level >= 7 ? 88 : level >= 3 ? 66 + (level - 3) * 4 : 54;
    shieldMult = level >= 7 ? 2.0 : level >= 5 ? 1.8 : 1.45;
    burnDps = Math.round(damage * (level >= 3 ? 0.48 : 0.32));
    slowPct = level >= 3 ? 0.24 : 0.16;
  } else if (type === 'hyperion') {
    armorPierce = level >= 7 ? 0.96 : level >= 5 ? 0.86 : level >= 3 ? 0.74 : 0.58;
    projectilesPerShot = level >= 7 ? 2 : 1;
    splashRadius = level >= 7 ? 95 : level >= 5 ? 78 : level >= 3 ? 66 : 56;
    shieldMult = level >= 7 ? 2.25 : level >= 3 ? 2.0 : 1.6;
    brittleBonus = level >= 7 ? 0.28 : level >= 5 ? 0.22 : 0; // execute threshold
    pullForce = level >= 7 ? 14 : 6;
  } else if (type === 'singularity') {
    armorPierce = level >= 3 ? 1 : 0.92;
    splashRadius = level >= 5 ? 124 : level >= 3 ? 108 : 96;
    pullForce = level >= 5 ? 138 : level >= 3 ? 116 : 96;
    shieldMult = level >= 3 ? 1.55 : 1.3;
    slowPct = level >= 5 ? 0.42 : level >= 3 ? 0.34 : 0.28;
  } else if (type === 'mothership') {
    armorPierce = level >= 7 ? 0.8 : level >= 5 ? 0.68 : 0.52;
    projectilesPerShot = level >= 5 ? 4 : 3;
    shieldMult = level >= 5 ? 1.65 : 1.35;
    splashRadius = level >= 5 ? 38 : 28;
  } else if (type === 'supernova') {
    armorPierce = level >= 5 ? 1 : level >= 3 ? 0.94 : 0.9;
    chainCount = level >= 7 ? 5 : level >= 5 ? 4 : 3;
    projectilesPerShot = level >= 3 ? 2 : 1;
    splashRadius = level >= 7 ? 118 : level >= 5 ? 104 : 92;
    shieldMult = level >= 5 ? 2.0 : level >= 3 ? 1.8 : 1.65;
    slowPct = level >= 5 ? 0.38 : 0.28;
    brittleBonus = level >= 7 ? 0.42 : level >= 3 ? 0.35 : 0.28;
  } else if (type === 'chronos') {
    armorPierce = level >= 3 ? 1 : 0.94;
    chainCount = level >= 7 ? 6 : level >= 5 ? 5 : level >= 3 ? 4 : 3;
    projectilesPerShot = level >= 5 ? 2 : 1;
    splashRadius = level >= 7 ? 162 : level >= 3 ? 144 : 128;
    pullForce = level >= 5 ? 74 : level >= 3 ? 60 : 48;
    shieldMult = level >= 5 ? 2.45 : level >= 3 ? 2.25 : 2.1;
    slowPct = level >= 5 ? 0.44 : 0.36;
    brittleBonus = (level >= 7 ? 0.56 : level >= 3 ? 0.46 : 0.38) + (variant === 'alpha' ? 0.18 : 0);
  } else if (type === 'aegis_bastion') {
    armorPierce = level >= 7 ? 0.94 : level >= 5 ? 0.82 : level >= 3 ? 0.72 : 0.62;
    projectilesPerShot = level >= 7 ? 3 : level >= 3 ? 2 : 1;
    chainCount = level >= 5 ? 4 : 2;
    splashRadius = level >= 7 ? 128 : level >= 5 ? 108 : level >= 3 ? 88 : 68;
    pullForce = level >= 7 ? 56 : level >= 5 ? 42 : level >= 3 ? 32 : 22;
    shieldMult = level >= 7 ? 2.45 : level >= 5 ? 2.15 : level >= 3 ? 1.95 : 1.7;
    slowPct = level >= 7 ? 0.38 : level >= 5 ? 0.3 : 0.22;
    brittleBonus = level >= 5 ? 0.24 : 0.14;
  } else if (type === 'astral_ark') {
    armorPierce = level >= 5 ? 1 : 0.96;
    projectilesPerShot = level >= 7 ? 4 : level >= 3 ? 3 : 2; // Simultaneous Void Prism Beams
    chainCount = level >= 7 ? 5 : level >= 5 ? 4 : 3; // Void Rift targets / beam pierce emphasis
    splashRadius = level >= 7 ? 132 : level >= 3 ? 112 : 96; // Impact & Rift radius
    shieldMult = level >= 5 ? 2.65 : level >= 3 ? 2.35 : 2.15;
    slowPct = level >= 5 ? 0.46 : 0.34;
    brittleBonus = level >= 7 ? 0.04 : level >= 3 ? 0.025 : 0.015; // % Max HP/sec Void Rift rupture vs Boss/Super Boss
  } else if (type === 'aurelia_cannon') {
    armorPierce = level >= 7 ? 0.95 : level >= 5 ? 0.85 : level >= 3 ? 0.72 : 0.58;
    projectilesPerShot = level >= 7 ? 3 : level >= 5 ? 2 : 1;
    chainCount = level >= 7 ? 6 : level >= 5 ? 5 : level >= 3 ? 3 : 2; // Pierce hits per lance
    splashRadius = level >= 5 ? 68 : 42;
    shieldMult = level >= 7 ? 2.2 : level >= 3 ? 1.85 : 1.5;
    burnDps = level >= 5 ? Math.round(damage * 0.45) : 0;
  } else if (type === 'paradox_scythe') {
    armorPierce = level >= 5 ? 1 : level >= 3 ? 0.86 : 0.7;
    projectilesPerShot = level >= 7 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = level >= 5 ? 62 : 44;
    shieldMult = level >= 7 ? 2.3 : level >= 3 ? 1.9 : 1.6;
    pullForce = level >= 3 ? 18 : 10; // Rewind pushback on non-bosses
  } else if (type === 'nebula_core') {
    armorPierce = level >= 5 ? 1 : 0.92;
    projectilesPerShot = level >= 7 ? 5 : level >= 3 ? 3 : 2;
    splashRadius = level >= 7 ? 124 : level >= 3 ? 105 : 88;
    shieldMult = level >= 7 ? 2.75 : level >= 5 ? 2.5 : 2.1;
    brittleBonus = level >= 7 ? 0.06 : level >= 3 ? 0.03 : 0.015; // % Max HP rupture vs Boss/Super Boss
  } else if (type === 'tesla') {
    armorPierce = 0.65;
    chainCount = level >= 7 ? 7 : level >= 5 ? 5 : level >= 3 ? 4 : 3;
    shieldMult = level >= 3 ? 1.65 + (level - 3) * 0.06 : 1.25;
    slowPct = 0.22 + lvOffset * 0.015;
    splashRadius = level >= 7 ? 42 : 0;
  } else if (type === 'tempest') {
    armorPierce = level >= 7 ? 0.78 : 0.38 + lvOffset * 0.035;
    projectilesPerShot = level >= 7 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 7 ? 82 : level >= 5 ? 64 : 44;
    shieldMult = level >= 3 ? 1.75 : 1.35;
    slowPct = level >= 7 ? 0.34 : level >= 3 ? 0.26 : 0.18;
  } else if (type === 'aurora_spire') {
    armorPierce = level >= 7 ? 0.94 : level >= 5 ? 0.85 : level >= 3 ? 0.72 : 0.6;
    projectilesPerShot = level >= 7 ? 3 : level >= 3 ? 2 : 1; // Max concurrent storm pylons
    chainCount = level >= 7 ? 6 : level >= 5 ? 5 : 4; // Targets zapped per pulse
    splashRadius = level >= 7 ? 116 : level >= 3 ? 96 : 82;
    shieldMult = level >= 7 ? 2.5 : level >= 3 ? 2.2 : 1.8;
    slowPct = level >= 7 ? 0.36 : level >= 3 ? 0.28 : 0.22;
  } else if (type === 'beacon') {
    armorPierce = 0;
    splashRadius = rangePx;
    shieldMult = 1;
  } else if (type === 'cryo') {
    armorPierce = 0;
    splashRadius = rangePx;
    slowPct =
      (level >= 7 ? 0.44 : level >= 5 ? 0.38 : level >= 3 ? 0.34 : 0.24) +
      (variant === 'omega' ? 0.08 : 0);
    brittleBonus =
      (level >= 7 ? 0.3 : level >= 5 ? 0.24 : level >= 3 ? 0.2 : 0.12) +
      (variant === 'omega' ? 0.12 : 0);
    shieldMult = 1;
  } else if (type === 'radar') {
    armorPierce = 0;
    splashRadius = rangePx;
    brittleBonus =
      (level >= 7 ? 0.36 : level >= 5 ? 0.28 : level >= 3 ? 0.26 : 0.18) +
      (variant === 'omega' ? 0.1 : 0);
    shieldMult = 1;
  } else if (type === 'quantum_prism') {
    armorPierce = 0;
    splashRadius = rangePx;
    brittleBonus =
      (level >= 7 ? 0.38 : level >= 5 ? 0.3 : level >= 3 ? 0.24 : 0.16) +
      (variant === 'omega' ? 0.14 : 0);
    chainCount = level >= 7 ? 5 : level >= 5 ? 4 : 3;
    shieldMult = 1;
  }

  if (!isSupport) {
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
  } else if (type === 'cryo' && vSpec.splashBonus > 0) {
    splashRadius = Math.round(splashRadius + vSpec.splashBonus);
  }

  const visualTier: 1 | 2 | 3 | 4 =
    level >= MAX_GUN_LEVEL ? 4 : level >= 5 ? 3 : level >= 3 ? 2 : 1;
  const tierLabel =
    visualTier === 4
      ? 'MYTHIC LV7'
      : visualTier === 3
        ? `HYPER LV${level}`
        : visualTier === 2
          ? `EVOLVED LV${level}`
          : `BASE LV${level}`;

  let effectiveShots = 1;
  if (type === 'gatling') {
    effectiveShots =
      projectilesPerShot >= 4 ? 1.76 : projectilesPerShot === 3 ? 1.62 : projectilesPerShot === 2 ? 1.4 : 1;
  } else if (type === 'shotgun') {
    effectiveShots = Math.min(5.2, projectilesPerShot * (level >= 7 ? 0.5 : level >= 6 ? 0.52 : 0.56));
  } else if (type === 'tesla' || type === 'saw') {
    const sawMulti =
      type === 'saw' ? (projectilesPerShot >= 3 ? 1.5 : projectilesPerShot === 2 ? 1.36 : 1) : 1;
    effectiveShots = sawMulti * Math.min(2.45, 1 + (chainCount - 1) * 0.22);
  } else if (type === 'missile' || type === 'tempest') {
    effectiveShots =
      projectilesPerShot >= 4 ? 1.7 : projectilesPerShot === 3 ? 1.56 : projectilesPerShot === 2 ? 1.32 : 1;
  } else if (type === 'railgun') {
    effectiveShots = projectilesPerShot >= 3 ? 1.35 : projectilesPerShot === 2 ? 1.24 : 1;
  } else if (type === 'orbital') {
    effectiveShots = (projectilesPerShot >= 4 ? 2.1 : projectilesPerShot >= 2 ? 1.58 : 1) + (burnDps > 0 ? 0.42 : 0);
  } else if (type === 'prism_refract') {
    effectiveShots = Math.min(2.6, 1 + chainCount * 0.24);
  } else if (type === 'hyperion') {
    effectiveShots = (projectilesPerShot >= 2 ? 1.62 : 1.15) + (level >= 5 ? 0.18 : 0);
  } else if (type === 'aurora_spire') {
    effectiveShots = 1.15 + projectilesPerShot * 0.42;
  } else if (type === 'aurelia_cannon') {
    effectiveShots = projectilesPerShot * (1 + chainCount * 0.16);
  } else if (type === 'paradox_scythe') {
    effectiveShots = projectilesPerShot * 1.68; // hits outbound + returning
  } else if (type === 'nebula_core') {
    effectiveShots = 1.35 + projectilesPerShot * 0.38;
  } else if (type === 'singularity') {
    effectiveShots = cooldownSec * (level >= 7 ? 2.45 : level >= 4 ? 1.95 : 1.5);
  } else if (type === 'mothership') {
    effectiveShots = Math.max(1, projectilesPerShot * 0.72);
  } else if (type === 'supernova') {
    effectiveShots = level >= 7 ? 2.4 : level >= 4 ? 1.95 : 1.65;
  } else if (type === 'chronos') {
    effectiveShots = level >= 7 ? 2.65 : level >= 4 ? 2.3 : 1.95;
  } else if (type === 'aegis_bastion') {
    effectiveShots = projectilesPerShot * 1.18 + (level >= 5 ? 0.35 : 0.15);
  } else if (type === 'astral_ark') {
    effectiveShots = level >= 7 ? 2.8 : level >= 4 ? 2.35 : 1.95;
  } else if (type === 'mortar') {
    effectiveShots = projectilesPerShot === 2 ? 1.24 : 1;
  }

  const dpsEstimate = isSupport ? 0 : Math.round((damage * effectiveShots) / cooldownSec);

  const unlockedSkills = item.milestones.filter((m) => level >= m.level);
  const nextSkill = item.milestones.find((m) => m.level > level) ?? null;

  const result: GunCombatProfile = {
    level,
    category: item.category,
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
    burnDps: isSupport ? 0 : burnDps,
    pullForce,
    visualTier,
    tierLabel,
    unlockedSkills,
    nextSkill,
  };
  GUN_PROFILE_CACHE.set(cacheKey, result);
  return result;
}

export interface GunLevelProgressionStep {
  readonly level: number;
  readonly upgradeCostFromPrev: number | null;
  readonly damage: number;
  readonly dpsEstimate: number;
  readonly rangeTiles: number;
  readonly cooldownSec: number;
  readonly armorPiercePct: number;
  readonly powerMultiplierLabel: string;
  readonly milestone: GunSkillMilestone | null;
  readonly statChanges: readonly string[];
  readonly powerSummary: string;
}

const GUN_PROGRESSION_CACHE = new Map<string, readonly GunLevelProgressionStep[]>();

function formatSupportPowerAtLevel(type: GunType, profile: GunCombatProfile, variant: GunVariant): string {
  if (type === 'beacon') {
    const lv = profile.level;
    const dmgPct = Math.round((0.12 + lv * 0.03 + (variant === 'omega' ? 0.08 : 0)) * 100);
    const critPct = Math.round((0.1 + lv * 0.035 + (variant === 'alpha' ? 0.07 : 0)) * 100);
    const critMult = Number((1.45 + lv * 0.07 + (variant === 'omega' ? 0.14 : 0)).toFixed(2));
    return `+${dmgPct}% DMG · +${critPct}% Chí Mạng (×${critMult}) · Tầm ${profile.rangeTiles}ô`;
  }
  if (type === 'cryo') {
    return `Chậm ${Math.round(profile.slowPct * 100)}% · Giòn Giáp +${Math.round(profile.brittleBonus * 100)}% · Tầm ${profile.rangeTiles}ô`;
  }
  if (type === 'radar') {
    const lv = profile.level;
    const auraRange = Number((0.4 + Math.floor(lv / 2) * 0.18 + (variant === 'alpha' ? 0.2 : 0)).toFixed(2));
    const auraPierce = Math.round((0.08 + lv * 0.025 + (variant === 'omega' ? 0.07 : 0)) * 100);
    return `Khóa +${Math.round(profile.brittleBonus * 100)}% DMG · Đồng đội +${auraRange}ô Tầm & +${auraPierce}% Xuyên`;
  }
  if (type === 'quantum_prism') {
    const lv = profile.level;
    const harvest = 3 + Math.floor(lv / 2) + (variant === 'alpha' ? 1 : 0);
    const multishot = lv >= 5 || variant === 'alpha' ? 2 : 1;
    return `Vọng ${Math.round(profile.brittleBonus * 100)}% ST · +${multishot} Đa Tia · +${harvest}⚡/Hạ`;
  }
  return `Tầm ${profile.rangeTiles}ô`;
}

/**
 * Computes a complete, cached Lv1..Lv7 skill & power roadmap for any gun + variant.
 * Clearly shows exact DMG ×2 scaling, stat deltas, and Lv3/Lv5/Lv7 milestone skills.
 */
export function getGunProgressionRoadmap(
  type: GunType,
  variant: GunVariant = 'alpha'
): readonly GunLevelProgressionStep[] {
  const key = `${type}:${variant}`;
  const cached = GUN_PROGRESSION_CACHE.get(key);
  if (cached) return cached;

  const item = getGunCatalogItem(type);
  const isSupport = item.category === 'support';
  const steps: GunLevelProgressionStep[] = [];
  let prev: GunCombatProfile | null = null;

  for (let lv = 1; lv <= MAX_GUN_LEVEL; lv++) {
    const prof = getGunCombatProfile(type, lv, variant);
    const milestone = item.milestones.find((m) => m.level === lv) ?? null;
    const costFromPrev = lv === 1 ? null : getGunUpgradeCost(type, lv - 1);
    const multX = Math.pow(2, lv - 1);
    const statChanges: string[] = [];

    if (!prev) {
      if (isSupport) {
        statChanges.push(`Triển khai ${item.cost}⚡`, `0 DMG (Thuần Hỗ Trợ)`);
      } else {
        statChanges.push(`DMG ${prof.damage}`, `DPS ${prof.dpsEstimate}`, `Tầm ${prof.rangeTiles}ô`);
      }
    } else if (isSupport) {
      if (prof.rangeTiles > prev.rangeTiles) {
        statChanges.push(`Tầm ${prev.rangeTiles}→${prof.rangeTiles}ô`);
      }
      if (type === 'cryo') {
        if (prof.slowPct > prev.slowPct) {
          statChanges.push(`Chậm ${Math.round(prev.slowPct * 100)}%→${Math.round(prof.slowPct * 100)}%`);
        }
        if (prof.brittleBonus > prev.brittleBonus) {
          statChanges.push(`Yếu giáp +${Math.round(prev.brittleBonus * 100)}%→+${Math.round(prof.brittleBonus * 100)}%`);
        }
      } else if (type === 'radar' || type === 'quantum_prism') {
        if (prof.brittleBonus > prev.brittleBonus) {
          statChanges.push(
            `${type === 'quantum_prism' ? 'Vọng' : 'Khóa'} ${Math.round(prev.brittleBonus * 100)}%→${Math.round(prof.brittleBonus * 100)}%`
          );
        }
        if (type === 'quantum_prism' && lv === 5 && variant === 'omega') {
          statChanges.push('+1→+2 Đa Tia');
        }
      } else if (type === 'beacon') {
        const prevDmg = Math.round((0.12 + (lv - 1) * 0.03 + (variant === 'omega' ? 0.08 : 0)) * 100);
        const curDmg = Math.round((0.12 + lv * 0.03 + (variant === 'omega' ? 0.08 : 0)) * 100);
        statChanges.push(`Aura DMG +${prevDmg}%→+${curDmg}%`);
      }
      if (prof.cooldownSec < prev.cooldownSec) {
        statChanges.push(`Nhịp ${prev.cooldownSec.toFixed(2)}s→${prof.cooldownSec.toFixed(2)}s`);
      }
    } else {
      statChanges.push(`DMG ${prev.damage}→${prof.damage} (×2)`);
      if (prof.projectilesPerShot > prev.projectilesPerShot) {
        statChanges.push(`${prev.projectilesPerShot}→${prof.projectilesPerShot} tia`);
      }
      if (prof.chainCount > prev.chainCount) {
        statChanges.push(`Nảy ${prev.chainCount}→${prof.chainCount}`);
      }
      if (prof.armorPierce > prev.armorPierce) {
        statChanges.push(`Xuyên ${Math.round(prev.armorPierce * 100)}%→${Math.round(prof.armorPierce * 100)}%`);
      }
      if (prof.rangeTiles > prev.rangeTiles) {
        statChanges.push(`Tầm ${prev.rangeTiles}→${prof.rangeTiles}ô`);
      }
      if (prof.splashRadius > prev.splashRadius) {
        statChanges.push(`Nổ ${prev.splashRadius}→${prof.splashRadius}px`);
      }
    }

    const powerSummary = isSupport
      ? formatSupportPowerAtLevel(type, prof, variant)
      : `DMG ${prof.damage} · DPS ${prof.dpsEstimate} · Xuyên ${Math.round(prof.armorPierce * 100)}% · Tầm ${prof.rangeTiles}ô`;

    steps.push({
      level: lv,
      upgradeCostFromPrev: costFromPrev,
      damage: prof.damage,
      dpsEstimate: prof.dpsEstimate,
      rangeTiles: prof.rangeTiles,
      cooldownSec: prof.cooldownSec,
      armorPiercePct: Math.round(prof.armorPierce * 100),
      powerMultiplierLabel: isSupport ? `Cấp ${lv}/${MAX_GUN_LEVEL}` : `×${multX} DMG`,
      milestone,
      statChanges,
      powerSummary,
    });
    prev = prof;
  }

  GUN_PROGRESSION_CACHE.set(key, steps);
  return steps;
}

export interface TeamSupportBuff {
  readonly damageMult: number;
  readonly critChance: number; // 0..0.95 Critical Strike aura
  readonly critMult: number; // 1.0..2.85 critical damage multiplier
  readonly rangeBonusTiles: number;
  readonly armorPierceBonus: number;
  readonly shieldMultBonus: number;
  readonly bonusMultishot: number; // +1 extra projectile/chain hop from Quantum Prism (0 attack-speed buff)
  readonly energyHarvestBonus: number; // bonus energy per kill inside Quantum Prism aura
  readonly hasSupportLink: boolean;
  readonly linkColors: string[];
}

/**
 * Computes pure non-attack-speed allied support buffs at tile `(col, row)`:
 * - Beacon (`beacon`): +Damage% + Critical Strike Chance & Crit Multiplier (`critChance`, `critMult`)
 * - Radar (`radar`): +Range + Armor Pierce + Shield Damage Bonus
 * - Quantum Prism (`quantum_prism`): +Multishot Link & Kill Energy Siphon (plus field Silence & Damage Echo)
 * Note: Attack-speed / fire-rate buffs are strictly removed from ALL support guns.
 */
export function computeTeamSupportBuffAtTile(
  guns: readonly PlacedGun[],
  col: number,
  row: number,
  overdriveSupportMult = 1
): TeamSupportBuff {
  const odMult = Math.max(1, overdriveSupportMult);
  let dmgBonus = 0;
  let critChanceBonus = 0;
  let critMultMax = 1.0;
  let rangeBonusTiles = 0;
  let armorPierceBonus = 0;
  let shieldMultBonus = 0;
  let bonusMultishot = 0;
  let energyHarvestBonus = 0;
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
      const dm =
        ((g.level >= 7 ? 0.34 : g.level >= 5 ? 0.26 : g.level >= 3 ? 0.2 : 0.16) +
          (variant === 'omega' ? 0.12 : 0)) *
        odMult;
      const cc =
        ((g.level >= 7 ? 0.45 : g.level >= 5 ? 0.36 : g.level >= 3 ? 0.3 : 0.24) +
          (variant === 'alpha' ? 0.1 : 0) +
          ((g.overheatTimer ?? 0) > 0 ? 0.35 : 0)) *
        odMult;
      const cm =
        ((g.level >= 7 ? 2.15 : g.level >= 5 ? 2.0 : g.level >= 3 ? 1.9 : 1.85) +
          (variant === 'alpha' ? 0.25 : 0) +
          ((g.overheatTimer ?? 0) > 0 ? 0.35 : 0)) *
        (1 + (odMult - 1) * 0.4);
      dmgBonus += dm;
      critChanceBonus += cc;
      critMultMax = Math.max(critMultMax, cm);
      if (!linkColors.includes('#FACC15')) linkColors.push('#FACC15');
    } else if (g.type === 'radar') {
      const rb =
        ((g.level >= 7 ? 1.6 : g.level >= 5 ? 1.25 : g.level >= 3 ? 0.95 : 0.7) +
          (variant === 'alpha' ? 0.35 : 0)) *
        (1 + (odMult - 1) * 0.55);
      const ap =
        ((g.level >= 7 ? 0.4 : g.level >= 5 ? 0.32 : g.level >= 3 ? 0.24 : 0.18) +
          (variant === 'omega' ? 0.12 : 0)) *
        odMult;
      const sh =
        ((g.level >= 7 ? 0.55 : g.level >= 5 ? 0.42 : g.level >= 3 ? 0.34 : 0.25) +
          (variant === 'alpha' ? 0.18 : 0)) *
        odMult;
      rangeBonusTiles += rb;
      armorPierceBonus += ap;
      shieldMultBonus += sh;
      if (!linkColors.includes('#22D3EE')) linkColors.push('#22D3EE');
    } else if (g.type === 'quantum_prism') {
      const ms = (g.level >= 5 || variant === 'alpha' ? 1 : 0) + (odMult > 1.1 ? 1 : 0);
      const eh = Math.round(
        (3 + (g.level >= 7 ? 3 : g.level >= 5 ? 2 : g.level >= 3 ? 1 : 0) + (variant === 'alpha' ? 1 : 0)) * odMult
      );
      bonusMultishot = Math.max(bonusMultishot, ms);
      energyHarvestBonus += eh;
      if (!linkColors.includes('#34D399')) linkColors.push('#34D399');
    }
  }

  return {
    damageMult: Number(Math.min(odMult > 1 ? 2.15 : 1.65, 1 + dmgBonus).toFixed(2)),
    critChance: Number(Math.min(odMult > 1 ? 0.95 : 0.85, critChanceBonus).toFixed(2)),
    critMult: critChanceBonus > 0 ? Number(Math.min(odMult > 1 ? 2.9 : 2.5, critMultMax).toFixed(2)) : 1.0,
    rangeBonusTiles: Number(Math.min(odMult > 1 ? 2.8 : 2.1, rangeBonusTiles).toFixed(2)),
    armorPierceBonus: Number(Math.min(odMult > 1 ? 0.72 : 0.58, armorPierceBonus).toFixed(3)),
    shieldMultBonus: Number(Math.min(odMult > 1 ? 1.35 : 1.0, shieldMultBonus).toFixed(2)),
    bonusMultishot: Math.min(2, bonusMultishot),
    energyHarvestBonus: Math.min(18, energyHarvestBonus),
    hasSupportLink: linkColors.length > 0,
    linkColors,
  };
}

export function computeBeaconBuffAtTile(
  guns: readonly PlacedGun[],
  col: number,
  row: number
): { damageMult: number; critChance: number; critMult: number } {
  const buff = computeTeamSupportBuffAtTile(guns, col, row);
  return {
    damageMult: buff.damageMult,
    critChance: buff.critChance,
    critMult: buff.critMult,
  };
}

export interface QuantumEchoTargetResult {
  readonly target: TdEnemy;
  readonly echoDamage: number;
}

/**
 * Pure Quantum Damage Echo helper: propagates a percentage of hit damage
 * from a quantum-linked enemy to up to `maxTargets` other linked enemies in range.
 */
export function computeQuantumEchoTargets(
  source: TdEnemy,
  candidates: readonly TdEnemy[],
  rawHitDamage: number,
  rangePx: number,
  maxTargets: number
): QuantumEchoTargetResult[] {
  if (rawHitDamage <= 0 || maxTargets <= 0) return [];
  if ((source.quantumLinkTimer ?? 0) <= 0) return [];
  const ratio = source.quantumEchoRatio ?? 0;
  if (ratio <= 0) return [];

  const echoDamage = Math.round(rawHitDamage * ratio);
  if (echoDamage <= 0) return [];

  const results: QuantumEchoTargetResult[] = [];
  for (const cand of candidates) {
    if (cand.id === source.id || cand.hp <= 0 || cand.koTimer > 0) continue;
    if ((cand.quantumLinkTimer ?? 0) <= 0) continue;
    if (Math.hypot(cand.x - source.x, cand.y - source.y) <= rangePx) {
      results.push({ target: cand, echoDamage });
      if (results.length >= maxTargets) break;
    }
  }
  return results;
}

export interface ElectricWetSynergyResult {
  readonly isWetSynergy: boolean;
  readonly damageMult: number;
  readonly extraChains: number;
  readonly splashBonusPx: number;
  readonly shockSec: number;
  readonly shieldMultBonus: number;
}

/**
 * Environmental + Status Synergy for Electric towers (`tesla`, `tempest`):
 * Targets standing on wet terrain puddles (`wetTimer > 0`) or chilled/soaked by Cryo mist
 * suffer amplified arc voltage, extra chain hops, wider EMP splash, and longer stun/shock.
 */
export function computeElectricWetSynergy(
  enemy: Pick<TdEnemy, 'wetTimer' | 'slowTimer'>,
  gunLevel: number
): ElectricWetSynergyResult {
  const isSoaked = enemy.wetTimer > 0;
  const isChilled = enemy.slowTimer > 0;
  if (!isSoaked && !isChilled) {
    return {
      isWetSynergy: false,
      damageMult: 1,
      extraChains: 0,
      splashBonusPx: 0,
      shockSec: 0,
      shieldMultBonus: 0,
    };
  }
  if (isSoaked) {
    return {
      isWetSynergy: true,
      damageMult: gunLevel >= 6 ? 1.5 : 1.4,
      extraChains: gunLevel >= 6 ? 2 : 1,
      splashBonusPx: 24,
      shockSec: 1.15,
      shieldMultBonus: 0.35,
    };
  }
  // Cryo slow / light frost conductivity
  return {
    isWetSynergy: true,
    damageMult: 1.25,
    extraChains: 1,
    splashBonusPx: 14,
    shockSec: 0.85,
    shieldMultBonus: 0.2,
  };
}

/**
 * Interrupts an active Boss / Super Boss telegraphed skill windup (triggered by Electric strikes or Radar Overheat).
 */
export function interruptEnemyWindup(enemy: TdEnemy): boolean {
  if ((enemy.windupTimer ?? 0) <= 0) return false;
  enemy.windupTimer = 0;
  enemy.windupKind = null;
  enemy.abilityCooldown = Math.max(enemy.abilityCooldown, enemy.kind === 'super_boss' ? 4.8 : 4.0);
  enemy.stunTimer = Math.max(enemy.stunTimer, 0.38);
  return true;
}

export interface WaveSpawnItem {
  readonly kind: EnemyKind;
  readonly delaySec: number;
  readonly isElite?: boolean;
}

/**
 * Extended tactical waves with clear counterplay pacing and late-game Super Boss encounters.
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
  const rampedBonus = Math.round(diffCfg.waveCountBonus * Math.min(1, Math.max(0, waveNumber - 1) / 2.5));
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
  const rawCount = Math.round(baseRaw * 2.65);
  const count =
    mode === 'boss_apocalypse'
      ? Math.max(8, Math.round(6 + waveNumber * 1.45))
      : mode === 'boss_rush'
        ? Math.max(22, Math.round(rawCount * 0.54))
        : Math.max(28, Math.round(rawCount * (modeCfg.swarmCountMult ?? 1)));
  let elapsed = 0.25;

  const swarmCompression = waveNumber >= 2 ? 1 / (1 + (waveNumber - 1) * 0.145) : 1;
  const superBossStartWave = Math.max(8, totalWaves - 2);

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
    if (mode === 'boss_apocalypse') {
      const superRatioFreq = waveNumber <= 2 ? count : waveNumber <= 5 ? 3 : 2;
      kind =
        i === count - 1 || (waveNumber >= 2 && i % superRatioFreq === superRatioFreq - 1)
          ? 'super_boss'
          : 'boss';
    } else {
      if (waveNumber === 1 && i >= count - 6 && difficulty !== 'easy') kind = 'armored';
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
        const isLateBossRushSuper = waveNumber >= 4 && i === count - 1;
        if (isLateBossRushSuper) {
          kind = 'super_boss';
        } else if (i % 4 === 3 || i === count - 1) {
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
        const isMajorBossWave = waveNumber === totalWaves || waveNumber % 3 === 0 || waveNumber >= 8;

        if ((isMajorBossWave && i === count - 1) || isMidBossWave || isVanguardBoss || isSecondBoss) {
          kind = 'boss';
        }
        if (waveNumber >= 6 && isMajorBossWave && i >= count - 2) {
          kind = 'boss';
        }
        if (
          waveNumber >= 9 &&
          i >= count - (difficulty === 'nightmare' ? 7 : difficulty === 'hell' || difficulty === 'super_hell' ? 5 : 3)
        ) {
          kind = 'boss';
        }

        const isEndlessSuperWave = mode === 'endless' && waveNumber >= 5 && waveNumber % 5 === 0;
        const isCampaignSuperWave = mode !== 'endless' && waveNumber >= superBossStartWave;
        if ((isEndlessSuperWave || isCampaignSuperWave) && i === count - 1) {
          kind = 'super_boss';
        } else if (mode !== 'endless' && waveNumber === totalWaves && i === Math.floor(count * 0.72)) {
          kind = 'super_boss';
        }
      }
    }

    const eliteModulo = Math.max(
      2,
      Math.round(6 - diffCfg.eliteChanceBoost * 12 - Math.min(2.5, Math.max(0, waveNumber - 2) * 0.35))
    );
    const isElite =
      kind !== 'boss' &&
      kind !== 'super_boss' &&
      ((mode === 'boss_rush' && i % 2 === 1) ||
        (waveNumber >= 3 && i % eliteModulo === eliteModulo - 1) ||
        ((difficulty === 'hell' || difficulty === 'super_hell' || difficulty === 'nightmare') &&
          waveNumber >= 2 &&
          i % (difficulty === 'nightmare' ? 3 : 4) === (difficulty === 'nightmare' ? 2 : 3)));
    items.push({ kind, delaySec: Number(elapsed.toFixed(3)), isElite });

    const baseGapRaw = Math.max(
      0.42,
      1.56 -
        waveNumber * 0.032 -
        (difficulty === 'nightmare'
          ? 0.135
          : difficulty === 'super_hell'
            ? 0.095
            : difficulty === 'hell'
              ? 0.065
              : difficulty === 'hard'
                ? 0.032
                : 0)
    );
    const baseGap = Math.max(0.24, (baseGapRaw * swarmCompression) / modeCfg.spawnRateMult);
    const squadRhythm = mode === 'boss_apocalypse' ? 1.55 : i % 6 === 5 ? 1.48 : 0.92;
    const roleSpacing =
      kind === 'splitter' || kind === 'berserker'
        ? baseGap * 0.8
        : kind === 'stealth' || kind === 'teleporter'
          ? baseGap * 0.86
          : kind === 'super_boss'
            ? baseGap * (mode === 'boss_apocalypse' ? 2.15 : 1.45)
            : kind === 'boss' || kind === 'juggernaut'
              ? baseGap * (mode === 'boss_apocalypse' ? 1.75 : 1.24)
              : baseGap;
    elapsed += roleSpacing * squadRhythm;
  }
  return items;
}

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
    waveNumber <= 12 ? 1 + (waveNumber - 1) * 1.95 : 1 + 11 * 1.95 + (waveNumber - 12) * 0.85;
  const baseScale =
    1.15 + (effectiveWave - 1) * 0.44 + Math.pow(Math.max(0, effectiveWave - 2), 1.46) * 0.28;
  const latePowerSurge =
    waveNumber <= 12
      ? waveNumber >= 2
        ? 1 + Math.pow(waveNumber - 1, 1.32) * 0.16
        : 1
      : 1 + Math.pow(11, 1.32) * 0.16 + (waveNumber - 12) * 0.38;
  const openingGrace =
    difficulty === 'nightmare' && waveNumber <= 2
      ? waveNumber === 1
        ? 0.22
        : 0.52
      : difficulty === 'super_hell' && waveNumber <= 2
        ? waveNumber === 1
          ? 0.25
          : 0.56
        : difficulty === 'hell' && waveNumber <= 2
          ? waveNumber === 1
            ? 0.29
            : 0.62
          : difficulty === 'hard' && waveNumber === 1
            ? 0.56
            : 1.0;
  const bossRushEarlyDamper =
    mode === 'boss_apocalypse' && waveNumber <= 2
      ? waveNumber === 1
        ? 0.42
        : 0.65
      : mode === 'boss_rush' && waveNumber <= 2
        ? 0.52
        : 1.0;
  const mapScale = getMapScalingCurve(map.id);
  const eliteMult = isElite ? 1.65 : 1;
  const hpScale =
    baseScale *
    latePowerSurge *
    eliteMult *
    diffCfg.hpMult *
    (modeCfg.hpMult ?? 1) *
    mapScale.hpMult *
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
    mapScale.shieldMult *
    openingGrace *
    bossRushEarlyDamper;
  const speedBonus = Math.min(78, effectiveWave * 2.2 + Math.max(0, waveNumber - 3) * 2.4);
  const totalSpeedMult = diffCfg.speedMult * modeCfg.speedMult * mapScale.speedMult;
  const swarmEconomyDamp = 1 / (1 + Math.max(0, waveNumber - 3) * 0.055);
  const rewardScale =
    diffCfg.rewardMult * modeCfg.rewardMult * mapScale.rewardMult * (isElite ? 1.35 : 1) * 0.56 * swarmEconomyDamp;
  const scoreMultTotal = diffCfg.scoreMult * modeCfg.scoreMult;
  const lateArmorBoost = Math.min(0.14, Math.max(0, waveNumber - 4) * 0.015);
  const armorAdd =
    (waveNumber === 1 ? (diffCfg.armorBonus + mapScale.armorBonus) * 0.3 : diffCfg.armorBonus + mapScale.armorBonus) +
    lateArmorBoost;

  const isBossKind = kind === 'boss' || kind === 'super_boss';
  const mapBoss = map.bossSpec;

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
    wetTimer: 0,
    shockTimer: 0,
    markedTimer: 0,
    markedBonus: 0,
    supernovaBrandDmg: 0,
    burnTimer: 0,
    burnDps: 0,
    armorShred: 0,
    stunTimer: 0,
    silencedTimer: 0,
    quantumLinkTimer: 0,
    quantumEchoRatio: 0,
    abilityCooldown: 2.3,
    windupKind: null as BossWindupKind | null,
    windupTimer: 0,
    windupMax: 1.4,
    fortifyTimer: 0,
    hitFlash: 0,
    koTimer: 0,
    isElite,
    enraged: false,
    ...(isBossKind
      ? {
          bossId: mapBoss.id,
          bossTitle: kind === 'super_boss' ? mapBoss.title : mapBoss.name,
          bossColor: mapBoss.color,
          bossSecondary: mapBoss.secondaryColor,
          bossEmblem: mapBoss.emblemKind,
          bossPhase: 1 as const,
        }
      : {}),
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
      armorRatio: Math.min(0.76, 0.54 + armorAdd),
    };
  }

  if (kind === 'splitter') {
    const hp = Math.round(115 * hpScale);
    return {
      ...base,
      hp,
      maxHp: hp,
    shield:
      (difficulty === 'hell' || difficulty === 'super_hell' || difficulty === 'nightmare') && waveNumber >= 4
        ? Math.round(25 * shieldScale)
        : 0,
    maxShield:
      (difficulty === 'hell' || difficulty === 'super_hell' || difficulty === 'nightmare') && waveNumber >= 4
        ? Math.round(25 * shieldScale)
        : 0,
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
    abilityCooldown:
      difficulty === 'nightmare'
        ? 2.1
        : difficulty === 'hell' || difficulty === 'super_hell'
          ? 2.4
          : 2.9,
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
    armorRatio: Math.min(0.78, 0.62 + armorAdd),
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
  const hp = Math.round(1150 * hpScale);
  const shield = Math.round(410 * shieldScale);
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
    armorRatio: Math.min(0.74, 0.46 + armorAdd),
    abilityCooldown: 3.4,
  };
}

if (kind === 'super_boss') {
  const isFinalAbyssBoss = map.id === 'sector-19';
  const finalHpBoost = isFinalAbyssBoss ? 1.28 : 1;
  const finalShieldBoost = isFinalAbyssBoss ? 1.24 : 1;
  const hp = Math.round(2350 * hpScale * finalHpBoost);
  const shield = Math.round(860 * shieldScale * finalShieldBoost);
  return {
    ...base,
    hp,
    maxHp: hp,
    shield,
    maxShield: shield,
    speed: (33 + speedBonus * 0.4) * totalSpeedMult,
    radius: isFinalAbyssBoss ? 31 : 29,
    reward: boostEnemyKillReward(Math.max(70, Math.round((165 + effectiveWave * 5.2) * rewardScale))),
    scoreValue: Math.round((isFinalAbyssBoss ? 1400 : 920) * scoreMultTotal),
    armorRatio: Math.min(0.76, 0.54 + armorAdd),
    abilityCooldown: 4.2,
  };
}

// 'scout'
const hp = Math.round(126 * hpScale);
const hasScoutShield =
  waveNumber >= 3 ||
  (difficulty === 'hard' && waveNumber >= 2) ||
  ((difficulty === 'hell' || difficulty === 'super_hell' || difficulty === 'nightmare') && waveNumber >= 2);
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

export function pullEnemyAlongTrack(
  enemy: TdEnemy,
  map: TdMapDef,
  anchorX: number,
  anchorY: number,
  pullForce: number
): void {
  if (
    pullForce <= 0 ||
    enemy.kind === 'boss' ||
    enemy.kind === 'super_boss' ||
    enemy.kind === 'juggernaut'
  ) {
    return;
  }
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
  const markedMult = enemy.markedTimer > 0 ? 1 + enemy.markedBonus : 1;
  const fortifyMult = enemy.fortifyTimer > 0 ? 0.72 : 1;

  // Stealth evasion damper unless slowed, wet, marked, burning, or stunned
  const stealthDamp =
    enemy.kind === 'stealth' &&
    enemy.slowTimer <= 0 &&
    enemy.wetTimer <= 0 &&
    enemy.markedTimer <= 0 &&
    enemy.burnTimer <= 0 &&
    enemy.stunTimer <= 0
      ? 0.8
      : 1;

  let dmg = rawDamage * brittleMult * markedMult * fortifyMult * stealthDamp;
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
  windupEvents: { x: number; y: number; kind: BossWindupKind }[];
  fortifyEvents: { x: number; y: number }[];
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
  phase2Events: { x: number; y: number; title: string; color: string }[];
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
  const windupEvents: { x: number; y: number; kind: BossWindupKind }[] = [];
  const fortifyEvents: { x: number; y: number }[] = [];
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
  const phase2Events: { x: number; y: number; title: string; color: string }[] = [];

  for (const enemy of enemies) {
    if (enemy.koTimer > 0) {
      enemy.koTimer = Math.max(0, enemy.koTimer - dt);
      continue;
    }
    if (enemy.hp <= 0) continue;

    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 3.5);
    if (enemy.wetTimer > 0) enemy.wetTimer = Math.max(0, enemy.wetTimer - dt);
    if (enemy.shockTimer > 0) enemy.shockTimer = Math.max(0, enemy.shockTimer - dt);
    if (enemy.markedTimer > 0) {
      enemy.markedTimer = Math.max(0, enemy.markedTimer - dt);
      if (enemy.markedTimer <= 0) enemy.markedBonus = 0;
    }
    if (enemy.fortifyTimer > 0) enemy.fortifyTimer = Math.max(0, enemy.fortifyTimer - dt);
    if ((enemy.silencedTimer ?? 0) > 0) enemy.silencedTimer = Math.max(0, enemy.silencedTimer - dt);
    if ((enemy.quantumLinkTimer ?? 0) > 0) {
      enemy.quantumLinkTimer = Math.max(0, (enemy.quantumLinkTimer ?? 0) - dt);
      if (enemy.quantumLinkTimer <= 0) enemy.quantumEchoRatio = 0;
    }

    // Environmental puddle soak when traversing map wetZones
    const tileCol = Math.floor(enemy.x / TILE_SIZE);
    const tileRow = Math.floor(enemy.y / TILE_SIZE);
    if (isWetZoneTile(map, tileCol, tileRow)) {
      enemy.wetTimer = Math.max(enemy.wetTimer, 1.8);
    }

    // Fire Burn DoT (bypasses armor!)
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

    // Berserker Rage trigger
    if (enemy.kind === 'berserker' && !enemy.enraged && enemy.hp <= enemy.maxHp * 0.55) {
      enemy.enraged = true;
      enemy.speed = Math.round(enemy.speed * 1.55);
    }

    // Special Archetype & Telegraphed Boss/Super Boss Abilities (suppressed when Silenced)
    const isSilenced = (enemy.silencedTimer ?? 0) > 0;
    if (enemy.stunTimer <= 0) {
      if (enemy.kind === 'healer' && !isSilenced) {
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
      } else if (enemy.kind === 'shieldbearer' && !isSilenced) {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = 3.6;
          if (enemy.maxShield > 0 && enemy.shield < enemy.maxShield) {
            enemy.shield = Math.min(enemy.maxShield, enemy.shield + Math.round(enemy.maxShield * 0.25));
            shieldRegenEvents.push({ x: enemy.x, y: enemy.y });
          }
        }
      } else if (enemy.kind === 'boss' || enemy.kind === 'super_boss') {
        // Super Boss Multi-Phase Awakening at <= 50% HP (balanced Phase 2 surge)
        if (
          enemy.kind === 'super_boss' &&
          (enemy.bossPhase ?? 1) === 1 &&
          enemy.hp > 0 &&
          enemy.hp <= enemy.maxHp * 0.5
        ) {
          enemy.bossPhase = 2;
          enemy.speed = Math.round(enemy.speed * 1.14);
          if (enemy.maxShield > 0) {
            enemy.shield = Math.min(enemy.maxShield, enemy.shield + Math.round(enemy.maxShield * 0.24));
            shieldRegenEvents.push({ x: enemy.x, y: enemy.y });
          }
          enemy.fortifyTimer = Math.max(enemy.fortifyTimer, 1.8);
          phase2Events.push({
            x: enemy.x,
            y: enemy.y,
            title: enemy.bossTitle ?? map.bossSpec.title,
            color: enemy.bossColor ?? map.bossSpec.color,
          });
        }
        const bossAbilityDt = isSilenced ? dt * 0.45 : dt;
        if (enemy.windupTimer > 0 && enemy.windupKind) {
          enemy.windupTimer = Math.max(0, enemy.windupTimer - bossAbilityDt);
          if (enemy.windupTimer <= 0) {
            const castKind = enemy.windupKind;
            enemy.windupKind = null;
            enemy.abilityCooldown =
              enemy.kind === 'super_boss' ? ((enemy.bossPhase ?? 1) >= 2 ? 4.4 : 5.2) : 4.8;
            if (castKind === 'shield_surge') {
              const shieldBoost = Math.round(enemy.maxShield * (enemy.kind === 'super_boss' ? 0.34 : 0.28));
              enemy.shield = Math.min(enemy.maxShield, enemy.shield + shieldBoost);
              shieldRegenEvents.push({ x: enemy.x, y: enemy.y });
            } else if (castKind === 'armor_bastion') {
              enemy.fortifyTimer = enemy.kind === 'super_boss' ? 2.8 : 2.2;
              fortifyEvents.push({ x: enemy.x, y: enemy.y });
            } else if (castKind === 'escort_deploy') {
              const escortCount = enemy.kind === 'super_boss' ? 2 : 1;
              for (let s = 0; s < escortCount; s++) {
                spawnRequests.push({
                  kind: 'scout',
                  x: enemy.x,
                  y: enemy.y,
                  heading: enemy.heading,
                  waypointIndex: enemy.waypointIndex,
                  baseHp: Math.max(70, Math.round(enemy.maxHp * 0.08)),
                  speed: Math.round(enemy.speed * 1.9),
                });
              }
            }
          }
        } else {
          enemy.abilityCooldown -= bossAbilityDt;
          if (enemy.abilityCooldown <= 0) {
            const preferred = map.bossSpec.signatureSkill;
            const cycle: BossWindupKind =
              enemy.kind === 'super_boss'
                ? enemy.shield < enemy.maxShield * 0.65
                  ? 'shield_surge'
                  : enemy.fortifyTimer <= 0
                    ? 'armor_bastion'
                    : 'escort_deploy'
                : preferred === 'escort_deploy' && enemy.shield > enemy.maxShield * 0.45
                  ? 'escort_deploy'
                  : enemy.shield < enemy.maxShield * 0.72
                    ? 'shield_surge'
                    : 'armor_bastion';
            enemy.windupKind = cycle;
            enemy.windupMax = enemy.kind === 'super_boss' ? 1.55 : 1.35;
            enemy.windupTimer = enemy.windupMax;
            windupEvents.push({ x: enemy.x, y: enemy.y, kind: cycle });
          }
        }
      } else if (enemy.kind === 'teleporter' && enemy.slowTimer <= 0 && !isSilenced) {
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
      } else if (enemy.kind === 'summoner' && !isSilenced) {
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
      } else if (enemy.kind === 'leech' && !isSilenced) {
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
      stunSpeedMult =
        enemy.kind === 'super_boss'
          ? 0.84
          : enemy.kind === 'boss'
            ? 0.78
            : enemy.kind === 'juggernaut'
              ? 0.82
              : 0.62;
    }

    if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      if (enemy.slowTimer <= 0) {
        enemy.slowFactor = 1;
        enemy.brittleBonus = 0;
      }
    }

    const rawSlowFactor = enemy.slowTimer > 0 ? enemy.slowFactor : 1;
    const resistedSlow =
      enemy.kind === 'super_boss' && rawSlowFactor < 1
        ? 1 - (1 - rawSlowFactor) * 0.66
        : enemy.kind === 'juggernaut' && rawSlowFactor < 1
          ? 1 - (1 - rawSlowFactor) * 0.55
          : enemy.kind === 'boss' && rawSlowFactor < 1
            ? 1 - (1 - rawSlowFactor) * 0.72
            : rawSlowFactor;
    const minSpeedFloor =
      enemy.kind === 'super_boss'
        ? 0.62
        : enemy.kind === 'boss'
          ? 0.55
          : enemy.kind === 'juggernaut'
            ? 0.62
            : 0.48;
    const speedFactor = Math.max(minSpeedFloor, resistedSlow * stunSpeedMult);
    const remainingMove = enemy.speed * speedFactor * dt;

    const reachedEnd = advanceEnemyAlongPath(enemy, map, remainingMove);
    if (reachedEnd) {
      enemy.hp = 0;
      enemy.koTimer = 0;
      coreDamageTaken +=
        enemy.kind === 'super_boss'
          ? 8
          : enemy.kind === 'boss'
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
      windupEvents,
      fortifyEvents,
      spawnRequests,
      leechEvents,
      phase2Events,
    },
  };
}

/**
 * Pure Mothership Carrier drone cap (3–4 drones by upgrade level; Alpha variant adds +1).
 */
export function getMothershipMaxDrones(level: number, variant: GunVariant = 'alpha'): number {
  const base = level >= 5 ? 4 : 3;
  return variant === 'alpha' ? base + 1 : base;
}

/**
 * Pure Singularity swallow growth: kills inside the event horizon swell radius smoothly
 * up to `maxScale` and store true explosion damage for gravitational collapse.
 */
export function computeSingularitySwallowGrowth(
  hole: Pick<SingularityHole, 'baseRadius' | 'killsAbsorbed' | 'accumulatedDamage' | 'maxScale'>,
  victimMaxHp: number,
  level: number,
  variant: GunVariant = 'alpha'
): { killsAbsorbed: number; currentRadius: number; accumulatedDamage: number } {
  const killsAbsorbed = hole.killsAbsorbed + 1;
  const radiusScale = Math.min(hole.maxScale, 1 + killsAbsorbed * 0.055);
  const currentRadius = Number((hole.baseRadius * radiusScale).toFixed(2));
  const absorbFraction = (level >= 7 ? 0.72 : level >= 4 ? 0.55 : 0.45) * (variant === 'omega' ? 1.45 : 1);
  const addedDamage = Math.max(28, Math.round(victimMaxHp * absorbFraction));
  return {
    killsAbsorbed,
    currentRadius,
    accumulatedDamage: hole.accumulatedDamage + addedDamage,
  };
}

/**
 * Pure Boss-pulse evasion check so Mothership drones blink/dodge Boss disruption waves.
 */
export function shouldDroneEvadeBossPulse(
  droneX: number,
  droneY: number,
  pulseX: number,
  pulseY: number,
  pulseRadius: number
): boolean {
  return Math.hypot(droneX - pulseX, droneY - pulseY) <= pulseRadius + 16;
}

/**
 * Pure Chronos Sovereign active Chronosphere field cap (1-2 base; Alpha grants +1 simultaneous field).
 */
export function getChronosMaxFields(level: number, variant: GunVariant = 'alpha'): number {
  const base = level >= 5 ? 2 : 1;
  return variant === 'alpha' ? base + 1 : base;
}

/**
 * Pure Astral Ark active Void Rift cap (1-2 base; Alpha grants +1 simultaneous rift).
 */
export function getAstralMaxRifts(level: number, variant: GunVariant = 'alpha'): number {
  const base = level >= 5 ? 2 : 1;
  return variant === 'alpha' ? base + 1 : base;
}

/**
 * Accumulates team damage dealt inside a Chronosphere field (capped cleanly per collapse).
 */
export function computeChronoFieldRecord(
  recordedDamage: number,
  incomingDamage: number,
  echoRatio: number,
  maxCap: number
): number {
  if (incomingDamage <= 0 || echoRatio <= 0) return recordedDamage;
  return Math.min(maxCap, recordedDamage + Math.round(incomingDamage * echoRatio));
}

export const OVERDRIVE_CONFIG = {
  chargeDurationSec: 30, // Minimum 30s real active-battle time to fill 0 -> 100%
  chargePerSec: 100 / 30,
  initialCharge: 0,
  durationSec: 10.0,
  speedMult: 2.05,
  damageMult: 1.85,
  skillPowerMult: 1.65, // amplifies all Overheat skill power, radius, chains & durations
  supportAuraMult: 1.45, // amplifies all Support aura buffs & Quantum Echo/Harvest
  hudDpsMult: 3.8,
  droneRateMult: 2.1,
  globalJudgmentBase: 360,
  globalJudgmentPerWave: 55,
  secondWaveTriggerSec: 5.0,
} as const;

/**
 * Time-based Overdrive ("Hội Tụ Hỏa Lực") charge gain:
 * Fills 100% over `OVERDRIVE_CONFIG.chargeDurationSec` (>= 30s real active combat) strictly while an active wave is running.
 */
export function computeOverdriveTimeChargeGain(dtSec: number, isWaveActive: boolean): number {
  if (!isWaveActive || dtSec <= 0) return 0;
  return dtSec * OVERDRIVE_CONFIG.chargePerSec;
}

/**
 * @deprecated Damage-based Overdrive charging is disabled; returns 0 cleanly.
 */
export function computeOverdriveChargeGain(_actualDamage: number, _baseRate = 0.045): number {
  return 0;
}

export interface AegisCoreShieldSpec {
  readonly maxShield: number;
  readonly rechargeIntervalSec: number;
  readonly rechargeAmount: number;
  readonly bastionCount: number;
}

/**
 * Pure hybrid Offense+Defense Core Shield projection from deployed Aegis Bastion turrets.
 * No other turret generates blocking Core Shield HP for the Fortress Core.
 */
export function computeAegisCoreShieldSpec(
  guns: readonly Pick<PlacedGun, 'type' | 'level' | 'variant'>[],
  overdriveSkillMult = 1
): AegisCoreShieldSpec {
  let maxShield = 0;
  let bastionCount = 0;
  let bestLevel = 0;
  let hasOmega = false;

  for (const g of guns) {
    if (g.type !== 'aegis_bastion') continue;
    bastionCount += 1;
    bestLevel = Math.max(bestLevel, g.level);
    const isOmega = g.variant === 'omega';
    if (isOmega) hasOmega = true;
    const baseCap = g.level >= 7 ? 9 : g.level >= 5 ? 6 : g.level >= 3 ? 4 : 2;
    maxShield += isOmega ? Math.ceil(baseCap * 1.5) : baseCap;
  }

  if (bastionCount === 0) {
    return { maxShield: 0, rechargeIntervalSec: 12, rechargeAmount: 0, bastionCount: 0 };
  }

  const boostedCap = Math.min(36, Math.round(maxShield * Math.max(1, overdriveSkillMult >= 1.4 ? 1.25 : 1)));
  const rechargeIntervalSec = hasOmega ? (bestLevel >= 5 ? 6.5 : 8.5) : bestLevel >= 5 ? 8 : 10.5;
  const rechargeAmount = bestLevel >= 5 ? 2 : 1;
  return { maxShield: boostedCap, rechargeIntervalSec, rechargeAmount, bastionCount };
}

/**
 * Absorbs incoming Fortress Core leak damage using Aegis Core Shield before subtracting Core HP.
 */
export function applyCoreDamageWithShield(
  coreHp: number,
  coreShield: number,
  rawDamage: number
): { nextCoreHp: number; nextCoreShield: number; absorbed: number; coreLoss: number } {
  const safeHp = Math.max(0, coreHp);
  const safeShield = Math.max(0, coreShield);
  const dmg = Math.max(0, rawDamage);
  const absorbed = Math.min(safeShield, dmg);
  const coreLoss = dmg - absorbed;
  return {
    nextCoreHp: Math.max(0, safeHp - coreLoss),
    nextCoreShield: safeShield - absorbed,
    absorbed,
    coreLoss,
  };
}

