export type GunType =
  | 'gatling'
  | 'shotgun'
  | 'flamer'
  | 'saw'
  | 'mortar'
  | 'missile'
  | 'railgun'
  | 'orbital'
  | 'singularity'
  | 'mothership'
  | 'supernova'
  | 'chronos'
  | 'tesla'
  | 'tempest'
  | 'beacon'
  | 'cryo'
  | 'radar';

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

export type MapBiome =
  | 'cyber_cyan'
  | 'emerald_matrix'
  | 'crimson_forge'
  | 'violet_void'
  | 'amber_desert'
  | 'arctic_core'
  | 'prismatic_nexus'
  | 'chrono_sanctum';

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
    description: 'Khởi đầu vững +22% · Lõi +20% máu · Quái 1.11× HP',
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
    description: 'Cân bằng chiến thuật · Quái 1.66× HP · +1 Đợt',
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
    description: 'Áp lực cao · Quái 2.44× HP, +11% tốc độ · +2 Đợt',
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
    description: 'Cực hạn sinh tồn · Quái 3.55× HP, +18% tốc độ · +3 Đợt',
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
    description: '16–46 đợt chuẩn chiến thuật · Phối hợp 17 súng & khắc chế Siêu Boss cuối trận',
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
  readonly category: GunCategory;
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
  abilityCooldown: number;
  windupKind?: BossWindupKind | null;
  windupTimer: number;
  windupMax: number;
  fortifyTimer: number;
  hitFlash: number;
  koTimer: number;
  isElite?: boolean;
  enraged?: boolean;
}

export interface ProjectileItem {
  id: number;
  kind: 'bullet' | 'pellet' | 'missile' | 'mortar' | 'bomblet' | 'sawblade' | 'tempest_orb' | 'supernova_orb';
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
  variant?: 'railgun' | 'supernova';
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

export const GRID_COLS = 16;
export const GRID_ROWS = 10;
export const TILE_SIZE = 56;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 896
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 560
export const MAX_GUN_LEVEL = 10;

export const GUN_CATALOG: readonly GunCatalogItem[] = [
  // === NHÓM TẤN CÔNG (11 SÚNG CHUYÊN BIỆT) ===
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
      { level: 3, name: 'Đạn Xuyên Giáp AP', summary: 'Xuyên 35% giáp Thiết Giáp' },
      { level: 5, name: 'Nòng Kép Song Song', summary: 'Bắn đồng thời 2 luồng đạn liên hoàn' },
      { level: 7, name: 'Đầu Đạn Nổ Mảnh', summary: '3 luồng đạn + nổ lan vùng nhỏ 22px' },
      { level: 10, name: 'Bão Đạn Huyền Thoại', summary: '4 nòng Hyper-AP + xuyên 75% giáp' },
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
      { level: 3, name: 'Nạp Nòng 6 Viên', summary: 'Mở rộng chùm 6 viên phá đám đông' },
      { level: 5, name: 'Đạn Cháy Nhiệt', summary: 'Gây bỏng nhiệt 45% sát thương/giây' },
      { level: 7, name: 'Quạt Thép 7 Viên', summary: 'Tăng góc quét + 7 viên xuyên nhẹ' },
      { level: 10, name: 'Lưới Đạn Hủy Diệt', summary: '9 viên siêu đặc + xuyên 62% giáp' },
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
      { level: 3, name: 'Nhiệt Lưu Huỳnh', summary: 'Tăng gấp rưỡi sát thương cháy DoT bỏ qua giáp' },
      { level: 5, name: 'Nung Chảy Giáp', summary: 'Bào mòn 28% giáp Thiết Giáp & xuyên 72% giáp' },
      { level: 7, name: 'Ngọn Lửa Lam', summary: 'Lửa plasma xanh làm chậm nhẹ 18%' },
      { level: 10, name: 'Bão Lửa Nova 360°', summary: 'Phóng vòng lửa Plasma quét toàn bộ 360°' },
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
      { level: 3, name: 'Lưỡi Titan 4 Nảy', summary: 'Đĩa cưa bật nảy qua tối đa 4 mục tiêu' },
      { level: 5, name: 'Răng Cưa Chảy Máu', summary: 'Gây chảy máu DoT xuyên giáp trên mỗi nhát cắt' },
      { level: 7, name: 'Cặp Đĩa Song Sinh', summary: 'Phóng đồng thời 2 đĩa cưa xoắn' },
      { level: 10, name: 'Bão Đĩa 3 Lưỡi Vàng', summary: '3 đĩa cưa nảy 7 lượt xé toạc đội hình' },
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
      { level: 3, name: 'Lực Hút Trọng Trường', summary: 'Kéo gom quái dọc đường vào tâm nổ' },
      { level: 5, name: 'Đạn Chùm Cháy', summary: 'Tạo hố cháy lan & làm chậm 30%' },
      { level: 7, name: 'Đầu Đạn Phá Hủy', summary: 'Bán kính nổ lớn + xuyên 68% giáp' },
      { level: 10, name: 'Song Pháo Thiên Thạch', summary: 'Bắn cặp đạn cối kéo xoáy + đốt diện rộng' },
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
      { level: 3, name: 'Đầu Đạn Tầm Nhiệt', summary: 'Nổ lan rộng + tự khóa Tàng Hình / Y Tá / Boss' },
      { level: 5, name: 'Bệ Phóng Kép', summary: 'Phóng 2 tên lửa dẫn đường mỗi loạt' },
      { level: 7, name: 'Bom Chùm Thứ Cấp', summary: 'Tách 3 bom con công phá quanh điểm rơi' },
      { level: 10, name: 'Loạt Tên Lửa Hạt Nhân', summary: '3 tên lửa hạng nặng + nổ chùm diện rộng' },
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
      { level: 3, name: 'Tia Siêu Thanh Xuyên Giáp', summary: 'Bỏ qua 85% giáp, xuyên thẳng mọi quái trên đường bắn' },
      { level: 5, name: 'Phá Khiên Cộng Hưởng', summary: 'Gây 175% lên Khiên & 165% chí mạng lên Boss/Siêu Boss' },
      { level: 7, name: 'Nổ Quỹ Đạo', summary: 'Phát nổ sóng từ trường 40px dọc thân mục tiêu' },
      { level: 10, name: 'Tia Hủy Diệt Omega', summary: 'Xuyên 100% giáp · 3 tia tụ năng quét sạch đường thẳng' },
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
    type: 'orbital',
    category: 'attack',
    hotkey: 'z',
    name: 'Vệ Tinh Quỹ Đạo',
    shortName: 'Thiên Phạt',
    roleClue: 'Gọi tia hủy diệt toàn bản đồ',
    accentColor: '#F97316',
    cost: 220,
    baseDamage: 295,
    baseCooldown: 2.35,
    rangeTiles: 22,
    milestones: [
      { level: 3, name: 'Vùng Dung Nham Bức Xạ', summary: 'Vùng dung nham đốt 42% DMG/s, làm chậm 20% & nung chảy 25% giáp' },
      { level: 5, name: 'Khóa Mục Tiêu Kép', summary: 'Gọi đồng thời 2 tia Thiên Phạt lên 2 quái nhiều máu nhất bản đồ' },
      { level: 7, name: 'Xuyên Giáp & Thiêu Máu Tối Đa', summary: 'Xuyên 90% giáp + thiêu đốt thêm 6% Máu tối đa Boss / Thiết Giáp' },
      { level: 10, name: 'Tam Trụ Thiên Phạt Vĩnh Hằng', summary: '3 cột sáng hủy diệt đồng loạt + vùng dung nham khổng lồ bào 35% giáp' },
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
        splashBonus: 8,
        armorPierceBonus: 0.22,
        shieldMultBonus: 0.35,
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
        rofMult: 1.12,
        rangeBonus: 0,
        splashBonus: 26,
        armorPierceBonus: 0.12,
        shieldMultBonus: 0.2,
        extraProjectiles: 0,
        extraChain: 0,
      },
    },
    overheatSkill: {
      key: 'orbital_solar_judgment',
      name: 'Mưa Thiên Phạt Quỹ Đạo',
      color: '#F97316',
      summary: 'Giáng 3 cột sáng hủy diệt đồng loạt lên 3 quái máu cao nhất toàn bản đồ',
      heatPerShot: 24,
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
    cost: 250,
    baseDamage: 148,
    baseCooldown: 3.6,
    rangeTiles: 4.4,
    milestones: [
      { level: 3, name: 'Chân Trời Nuốt Chửng', summary: 'Hút chặt bầy quái vào tâm, nuốt 45% máu xác & kéo dài thời gian tồn tại' },
      { level: 5, name: 'Nghiền Sát Thương Chuẩn', summary: '100% sát thương chuẩn xuyên mọi giáp · tâm hố đen nghiền ×1.5' },
      { level: 7, name: 'Trường Hấp Dẫn Siêu Sâu', summary: 'Bán kính hút 124px + làm chậm 42% toàn bộ quái trong xoáy' },
      { level: 10, name: 'Vụ Nổ Sụp Đổ Vũ Trụ', summary: 'Tích 70% máu quái bị nuốt & giải phóng vụ nổ chuẩn hủy diệt cuối giờ' },
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
    cost: 200,
    baseDamage: 36,
    baseCooldown: 0.56,
    rangeTiles: 20,
    milestones: [
      { level: 3, name: 'Phi Đội Săn Lọt Lưới', summary: '3 phi thuyền bay nhanh toàn bản đồ, bắn tỉa 215px quái gần Lõi' },
      { level: 5, name: 'Bến Đỗ Xuất Đội 4', summary: 'Tăng lên 4 phi thuyền chiến đấu, tự né xung Boss & bắn phản công' },
      { level: 7, name: 'Tên Lửa Plasma Săn Boss', summary: 'Mỗi phát thứ 3 phóng Tên Lửa nổ lan (+40% DMG lên Boss/Siêu Boss)' },
      { level: 10, name: 'Hạm Đội Độc Tôn', summary: 'Phi đội bay siêu thanh, xuyên 80% giáp & xuất xưởng tức thì' },
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
      { level: 3, name: 'Ấn Tích Siêu Tân Tinh', summary: 'Gắn ấn khiến toàn đội gây +32% DMG & hạ gục kích hoạt nổ dây chuyền 115px' },
      { level: 5, name: 'Tia Phán Quyết Ngắt Chiêu', summary: 'Mỗi 4 phát bắn Hyper-Beam xuyên tuyến, ngắt chiêu Boss & phóng +2 mảnh sao' },
      { level: 7, name: 'Xuyên Giáp Tuyệt Đối', summary: 'Cầu sao xuyên 4–5 mục tiêu, xuyên 100% giáp & nhân 2.0× sát thương Khiên' },
      { level: 10, name: 'Thiên Hà Khởi Nguyên', summary: 'Nổ dây chuyền 140px (+12% HP tối đa), Tia Phán Quyết mỗi 3 phát & ấn +42%' },
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
    cost: 800,
    baseDamage: 620,
    baseCooldown: 1.45,
    rangeTiles: 5.8,
    milestones: [
      { level: 3, name: 'Ghi Âm Nghịch Lý', summary: 'Vòng Thời Không ghi lại 38–46% sát thương toàn đội & nổ chuẩn khi sụp đổ' },
      { level: 5, name: 'Tua Ngược Không Gian', summary: 'Khi sụp đổ kéo lùi quái ngược về cổng + xuyên 100% giáp & ngắt chiêu Boss' },
      { level: 7, name: 'Trảm Toàn Bản Đồ', summary: 'Duy trì 2–3 Vòng Thời Không & bổ sung Nhát Chém Thực Tại lên Boss xa nhất' },
      { level: 10, name: 'Chúa Tể Thời Gian', summary: '6 Nhát Chém Thực Tại, ghi âm 56% sát thương toàn đội & 2.45× phá khiên' },
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

  // === NHÓM HỆ ĐIỆN / LIGHTNING (2 SÚNG CHUYÊN BIỆT) ===
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
      { level: 3, name: 'Hồ Quang 4 Mục Tiêu', summary: 'Tia sét giật lan 4 mục tiêu + làm chậm tê liệt 0.25s' },
      { level: 5, name: 'Sốc Phá Khiên & Ngắt Chiêu', summary: 'Gây 165% lên Khiên & cắt đứt chiêu Boss đang tụ' },
      { level: 7, name: 'Cộng Hưởng Ướt Overdrive', summary: 'Đánh mục tiêu ướt/băng gây +40% DMG & +2 lần giật lan' },
      { level: 10, name: 'Bão Sét 7 Nhánh Vĩnh Cửu', summary: 'Giật 7 mục tiêu + phóng xung nổ điện từ 42px' },
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
      { level: 3, name: 'Song Cầu Điện Từ', summary: 'Phóng 2 cầu bão EMP + tê liệt 26%' },
      { level: 5, name: 'Xung Phá Khiên & Cắt Chiêu', summary: 'Gây 175% lên Khiên + ngắt chiêu Boss khi phát nổ' },
      { level: 7, name: 'Cộng Hưởng Bão Ướt', summary: 'Trên mục tiêu ướt: nổ rộng +24px & phóng thêm sét lan' },
      { level: 10, name: 'Tam Cầu Bão Tối Thượng', summary: '3 cầu EMP + choáng ngắn 0.25s toàn vùng nổ' },
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

  // === NHÓM HỖ TRỢ THUẦN TÚY (3 SÚNG: 0 SÁT THƯƠNG · 0 HỒI MÁU · 0 BUFF TỐC ĐÁNH) ===
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
      { level: 5, name: 'Mạng Lưới Tụ Năng', summary: 'Mở rộng aura +0.35ô & khuếch đại Chí Mạng' },
      { level: 7, name: 'Trường Siêu Tụ 36%', summary: 'Đồng minh nhận +26% DMG & +36% Chí Mạng (×2.00)' },
      { level: 10, name: 'Lõi Thái Dương Chí Mạng', summary: '+34% DMG & +45% Chí Mạng (×2.15) quanh tháp' },
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
      { level: 3, name: 'Sương Ẩm Dẫn Điện', summary: 'Làm chậm 32% & giữ ẩm 2.6s giúp hệ Điện bùng nổ' },
      { level: 5, name: 'Giòn Vỡ Kết Tinh', summary: 'Quái bị làm chậm nhận +20% sát thương từ mọi tháp' },
      { level: 7, name: 'Khí Lạnh Phủ Rộng', summary: 'Chậm 38%, Giòn +24% & hiện hình toàn bộ Tàng Hình' },
      { level: 10, name: 'Đông Kết Vĩnh Cửu', summary: 'Chậm 44%, Giòn +30% & ướt dẫn điện 3.4s' },
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
      { level: 3, name: 'Tín Hiệu Mục Tiêu', summary: '+0.95ô Tầm, +22% Xuyên Giáp, +32% Phá Khiên & khóa yếu +22%' },
      { level: 5, name: 'Quét Tàng Hình & Giảm Giáp', summary: 'Lộ hình Tàng Hình, bào mòn 24% giáp & khóa yếu +28%' },
      { level: 7, name: 'Chỉ Thị Bão Hòa', summary: '+1.25ô Tầm, +32% Xuyên Giáp & +42% Phá Khiên đồng minh' },
      { level: 10, name: 'Mắt Thần Chỉ Huy', summary: '+1.60ô Tầm, +40% Xuyên Giáp, +55% Phá Khiên & khóa yếu +36%' },
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
];

export function getGunCategory(type: GunType): GunCategory {
  return getGunCatalogItem(type).category;
}

export function isElectricGunType(type: GunType): boolean {
  return getGunCategory(type) === 'electric';
}

export function isSupportGunType(type: GunType): boolean {
  return type === 'beacon' || type === 'cryo' || type === 'radar';
}

export function getAvailableGunsForMap(_mapId?: string): GunCatalogItem[] {
  return [...GUN_CATALOG];
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
  },
  {
    id: 'sector-17',
    name: 'Màn 17 · Đấu Trường Hoàng Kim',
    recommendedDifficulty: 'hell',
    difficultyLabel: '★ Đặc Biệt · 38 Đợt',
    subtitle: 'Đại lộ Hoàng Kim xoắn kép 56 ô — hai tuyến áp sát song song qua 4 hồ dẫn điện cổ đại.',
    tacticalHint: 'Gợi ý: Đặt Pháo Siêu Tân Tinh (V · 500⚡) tại (6,2) hoặc (4,2) để bắn xuyên 2 đại lộ & kích hoạt nổ dây chuyền!',
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
  },
  {
    id: 'sector-18',
    name: 'Màn 18 · Thánh Địa Thời Không',
    recommendedDifficulty: 'hell',
    difficultyLabel: '✦ Siêu Đặc Biệt · 40 Đợt',
    subtitle: 'Thánh địa 57 ô quanh 2 pháo đài lõi thời gian & 5 mạch nước dẫn điện cổ đại.',
    tacticalHint: 'Gợi ý: Đặt Pháo Thời Không (B · 800⚡) tại (6,7) hoặc (4,2) để bao trùm cả thánh địa & tua ngược đợt Siêu Boss!',
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
 * Pure support towers (`beacon`, `cryo`, `radar`) ALWAYS output 0 damage, 0 dpsEstimate, 0 burnDps.
 */
export function getGunCombatProfile(
  type: GunType,
  rawLevel: number,
  variant: GunVariant = 'alpha'
): GunCombatProfile {
  const level = Math.max(1, Math.min(MAX_GUN_LEVEL, Math.round(rawLevel)));
  const item = getGunCatalogItem(type);
  const vSpec = item.variants[variant] ?? item.variants.alpha;
  const isSupport = item.category === 'support';

  const lvOffset = level - 1;
  const dmgMult = (1 + lvOffset * 0.25 + Math.pow(lvOffset, 1.38) * 0.095) * vSpec.damageMult;
  const rofMult = (1 + lvOffset * 0.055 + (level === 10 ? 0.08 : 0)) * vSpec.rofMult;
  const rangeBonusTiles =
    lvOffset * 0.075 + (level >= 7 ? 0.1 : 0) + (level === 10 ? 0.15 : 0) + vSpec.rangeBonus;

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
  } else if (type === 'saw') {
    armorPierce = level >= 5 ? 0.54 : 0.34;
    projectilesPerShot = level >= 10 ? 3 : level >= 7 ? 2 : 1;
    chainCount = level >= 10 ? 7 : level >= 7 ? 5 : level >= 3 ? 4 : 3;
    burnDps = level >= 5 ? Math.round(damage * 0.32) : 0;
    shieldMult = 1.1;
  } else if (type === 'mortar') {
    armorPierce = 0.55 + lvOffset * 0.025;
    projectilesPerShot = level >= 10 ? 2 : 1;
    splashRadius = 76 + lvOffset * 4 + (level >= 7 ? 10 : 0);
    pullForce = level >= 3 ? 10 + (level - 3) * 1.5 : 4;
    slowPct = level >= 5 ? 0.3 : 0.18;
    burnDps = level >= 5 ? Math.round(damage * 0.18) : 0;
  } else if (type === 'missile') {
    armorPierce = 0.42 + lvOffset * 0.03;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    splashRadius = 64 + lvOffset * 4 + (level >= 3 ? 12 : 0);
    shieldMult = 1.2;
  } else if (type === 'railgun') {
    armorPierce = level >= 10 ? 1 : level >= 3 ? 0.85 : 0.55;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1;
    shieldMult = level >= 5 ? 1.75 : 1.3;
    splashRadius = level >= 7 ? 38 + (level - 7) * 5 : 0;
  } else if (type === 'orbital') {
    armorPierce = level >= 7 ? 0.92 : level >= 3 ? 0.78 : 0.65;
    projectilesPerShot = level >= 10 ? 3 : level >= 5 ? 2 : 1; // number of simultaneous orbital sky pillars
    splashRadius = level >= 10 ? 74 : level >= 3 ? 56 + (level - 3) * 2 : 48;
    shieldMult = level >= 7 ? 1.65 : 1.35;
    burnDps = Math.round(damage * (level >= 3 ? 0.42 : 0.28)); // magma/radiation ground burn dps
    slowPct = level >= 3 ? 0.2 : 0.14;
  } else if (type === 'singularity') {
    armorPierce = level >= 5 ? 1 : 0.92; // crushes with 100% true damage bypassing armor
    splashRadius = level >= 7 ? 124 : level >= 3 ? 106 : 96;
    pullForce = level >= 7 ? 138 : level >= 3 ? 114 : 96;
    shieldMult = level >= 5 ? 1.55 : 1.3;
    slowPct = level >= 7 ? 0.42 : level >= 3 ? 0.34 : 0.28;
  } else if (type === 'mothership') {
    armorPierce = level >= 10 ? 0.8 : level >= 7 ? 0.68 : 0.52;
    projectilesPerShot = level >= 5 ? 4 : 3; // autonomous drones maintained
    shieldMult = level >= 7 ? 1.65 : 1.35;
    splashRadius = level >= 7 ? 38 : 28;
  } else if (type === 'supernova') {
    armorPierce = level >= 7 ? 1 : level >= 3 ? 0.94 : 0.9;
    chainCount = level >= 10 ? 5 : level >= 5 ? 4 : 3; // targets pierced per Nova Orb
    projectilesPerShot = level >= 5 ? 2 : 1; // secondary homing star-shards on Hyper-Beam volley
    splashRadius = level >= 10 ? 118 : level >= 5 ? 104 : 92;
    shieldMult = level >= 7 ? 2.0 : level >= 3 ? 1.8 : 1.65;
    slowPct = level >= 7 ? 0.38 : 0.28;
    brittleBonus = level >= 10 ? 0.42 : level >= 5 ? 0.35 : 0.28; // Supernova Brand damage amp
  } else if (type === 'chronos') {
    armorPierce = level >= 5 ? 1 : 0.94;
    chainCount = level >= 10 ? 6 : level >= 7 ? 5 : level >= 3 ? 4 : 3; // Simultaneous Dimensional Cross-Slashes
    projectilesPerShot = level >= 7 ? 2 : 1; // Concurrent Chronosphere fields
    splashRadius = level >= 10 ? 162 : level >= 5 ? 144 : 128; // Chronosphere radius
    pullForce = level >= 7 ? 74 : level >= 3 ? 60 : 48; // Time-Rewind pull along track
    shieldMult = level >= 7 ? 2.45 : level >= 3 ? 2.25 : 2.1;
    slowPct = level >= 7 ? 0.44 : 0.36;
    brittleBonus = (level >= 10 ? 0.56 : level >= 5 ? 0.46 : 0.38) + (variant === 'alpha' ? 0.18 : 0); // Temporal Echo damage recording ratio
  } else if (type === 'tesla') {
    armorPierce = 0.65;
    chainCount = level >= 10 ? 7 : level >= 7 ? 5 : level >= 3 ? 4 : 3;
    shieldMult = level >= 5 ? 1.65 + (level - 5) * 0.04 : 1.25;
    slowPct = 0.22 + lvOffset * 0.015;
    splashRadius = level >= 10 ? 42 : 0;
  } else if (type === 'tempest') {
    armorPierce = level >= 10 ? 0.78 : 0.38 + lvOffset * 0.035;
    projectilesPerShot = level >= 10 ? 3 : level >= 3 ? 2 : 1;
    splashRadius = level >= 10 ? 82 : level >= 7 ? 64 : 44;
    shieldMult = level >= 5 ? 1.75 : 1.35;
    slowPct = level >= 10 ? 0.34 : level >= 3 ? 0.26 : 0.18;
  } else if (type === 'beacon') {
    armorPierce = 0;
    splashRadius = rangePx;
    shieldMult = 1;
  } else if (type === 'cryo') {
    armorPierce = 0;
    splashRadius = rangePx;
    slowPct =
      (level >= 10 ? 0.44 : level >= 7 ? 0.38 : level >= 3 ? 0.32 : 0.24) +
      (variant === 'omega' ? 0.08 : 0);
    brittleBonus =
      (level >= 10 ? 0.3 : level >= 5 ? 0.2 + (level - 5) * 0.02 : 0.12) +
      (variant === 'omega' ? 0.12 : 0);
    shieldMult = 1;
  } else if (type === 'radar') {
    armorPierce = 0;
    splashRadius = rangePx;
    brittleBonus =
      (level >= 10 ? 0.36 : level >= 5 ? 0.28 : level >= 3 ? 0.22 : 0.18) +
      (variant === 'omega' ? 0.1 : 0);
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
  if (type === 'gatling') {
    effectiveShots =
      projectilesPerShot >= 4 ? 1.76 : projectilesPerShot === 3 ? 1.62 : projectilesPerShot === 2 ? 1.4 : 1;
  } else if (type === 'shotgun') {
    effectiveShots = Math.min(5.2, projectilesPerShot * (level >= 10 ? 0.5 : level >= 7 ? 0.52 : 0.56));
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
    effectiveShots = (projectilesPerShot >= 3 ? 1.78 : projectilesPerShot >= 2 ? 1.5 : 1) + (burnDps > 0 ? 0.35 : 0);
  } else if (type === 'singularity') {
    // Persistent true-DPS gravity well (1..2.5 overlapping holes) + 1.5x core crush + collapse detonation
    effectiveShots = cooldownSec * (level >= 10 ? 2.45 : level >= 5 ? 1.95 : 1.5);
  } else if (type === 'mothership') {
    effectiveShots = Math.max(1, projectilesPerShot * 0.72);
  } else if (type === 'supernova') {
    effectiveShots = level >= 10 ? 2.4 : level >= 5 ? 1.95 : 1.65;
  } else if (type === 'chronos') {
    effectiveShots = level >= 10 ? 2.65 : level >= 5 ? 2.3 : 1.95;
  } else if (type === 'mortar') {
    effectiveShots = projectilesPerShot === 2 ? 1.24 : 1;
  }

  const dpsEstimate = isSupport ? 0 : Math.round((damage * effectiveShots) / cooldownSec);

  const unlockedSkills = item.milestones.filter((m) => level >= m.level);
  const nextSkill = item.milestones.find((m) => m.level > level) ?? null;

  return {
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
}

export interface TeamSupportBuff {
  readonly damageMult: number;
  readonly critChance: number; // 0..0.85 brand-new Critical Strike aura replacing attack-speed buff
  readonly critMult: number; // 1.0..2.5 critical damage multiplier
  readonly rangeBonusTiles: number;
  readonly armorPierceBonus: number;
  readonly shieldMultBonus: number;
  readonly hasSupportLink: boolean;
  readonly linkColors: string[];
}

/**
 * Computes pure non-attack-speed allied support buffs at tile `(col, row)`:
 * - Beacon (`beacon`): +Damage% + Critical Strike Chance & Crit Multiplier (`critChance`, `critMult`)
 * - Radar (`radar`): +Range + Armor Pierce + Shield Damage Bonus
 * Note: Attack-speed / fire-rate buffs are strictly removed from ALL support guns.
 */
export function computeTeamSupportBuffAtTile(
  guns: readonly PlacedGun[],
  col: number,
  row: number
): TeamSupportBuff {
  let dmgBonus = 0;
  let critChanceBonus = 0;
  let critMultMax = 1.0;
  let rangeBonusTiles = 0;
  let armorPierceBonus = 0;
  let shieldMultBonus = 0;
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
        (g.level >= 10 ? 0.34 : g.level >= 7 ? 0.26 : g.level >= 3 ? 0.2 : 0.16) +
        (variant === 'omega' ? 0.12 : 0);
      const cc =
        (g.level >= 10 ? 0.45 : g.level >= 7 ? 0.36 : g.level >= 3 ? 0.3 : 0.24) +
        (variant === 'alpha' ? 0.1 : 0) +
        ((g.overheatTimer ?? 0) > 0 ? 0.35 : 0);
      const cm =
        (g.level >= 10 ? 2.15 : g.level >= 7 ? 2.0 : g.level >= 3 ? 1.9 : 1.85) +
        (variant === 'alpha' ? 0.25 : 0) +
        ((g.overheatTimer ?? 0) > 0 ? 0.35 : 0);
      dmgBonus += dm;
      critChanceBonus += cc;
      critMultMax = Math.max(critMultMax, cm);
      if (!linkColors.includes('#FACC15')) linkColors.push('#FACC15');
    } else if (g.type === 'radar') {
      const rb =
        (g.level >= 10 ? 1.6 : g.level >= 7 ? 1.25 : g.level >= 3 ? 0.95 : 0.7) +
        (variant === 'alpha' ? 0.35 : 0);
      const ap =
        (g.level >= 10 ? 0.4 : g.level >= 7 ? 0.32 : g.level >= 3 ? 0.22 : 0.18) +
        (variant === 'omega' ? 0.12 : 0);
      const sh =
        (g.level >= 10 ? 0.55 : g.level >= 7 ? 0.42 : g.level >= 3 ? 0.32 : 0.25) +
        (variant === 'alpha' ? 0.18 : 0);
      rangeBonusTiles += rb;
      armorPierceBonus += ap;
      shieldMultBonus += sh;
      if (!linkColors.includes('#22D3EE')) linkColors.push('#22D3EE');
    }
  }

  return {
    damageMult: Number(Math.min(1.65, 1 + dmgBonus).toFixed(2)),
    critChance: Number(Math.min(0.85, critChanceBonus).toFixed(2)),
    critMult: critChanceBonus > 0 ? Number(Math.min(2.5, critMultMax).toFixed(2)) : 1.0,
    rangeBonusTiles: Number(Math.min(2.1, rangeBonusTiles).toFixed(2)),
    armorPierceBonus: Number(Math.min(0.58, armorPierceBonus).toFixed(3)),
    shieldMultBonus: Number(Math.min(1.0, shieldMultBonus).toFixed(2)),
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
      damageMult: gunLevel >= 7 ? 1.5 : 1.4,
      extraChains: gunLevel >= 7 ? 2 : 1,
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
    mode === 'boss_rush'
      ? Math.max(22, Math.round(rawCount * 0.54))
      : Math.max(28, Math.round(rawCount * (modeCfg.swarmCountMult ?? 1)));
  let elapsed = 0.25;

  const swarmCompression = waveNumber >= 2 ? 1 / (1 + (waveNumber - 1) * 0.145) : 1;
  const superBossStartWave = Math.max(8, totalWaves - 2);

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
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
      if (waveNumber >= 9 && i >= count - (difficulty === 'hell' ? 5 : 3)) {
        kind = 'boss';
      }

      // Late-game Super Boss climax (final campaign waves or Endless milestones)
      const isEndlessSuperWave = mode === 'endless' && waveNumber >= 5 && waveNumber % 5 === 0;
      const isCampaignSuperWave = mode !== 'endless' && waveNumber >= superBossStartWave;
      if ((isEndlessSuperWave || isCampaignSuperWave) && i === count - 1) {
        kind = 'super_boss';
      } else if (mode !== 'endless' && waveNumber === totalWaves && i === Math.floor(count * 0.72)) {
        kind = 'super_boss';
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
        (difficulty === 'hell' && waveNumber >= 2 && i % 4 === 3));
    items.push({ kind, delaySec: Number(elapsed.toFixed(3)), isElite });

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
          : kind === 'super_boss'
            ? baseGap * 1.45
            : kind === 'boss' || kind === 'juggernaut'
              ? baseGap * 1.24
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
    wetTimer: 0,
    shockTimer: 0,
    markedTimer: 0,
    markedBonus: 0,
    supernovaBrandDmg: 0,
    burnTimer: 0,
    burnDps: 0,
    armorShred: 0,
    stunTimer: 0,
    abilityCooldown: 2.3,
    windupKind: null as BossWindupKind | null,
    windupTimer: 0,
    windupMax: 1.4,
    fortifyTimer: 0,
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
      armorRatio: Math.min(0.76, 0.54 + armorAdd),
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
    const hp = Math.round(2350 * hpScale);
    const shield = Math.round(860 * shieldScale);
    return {
      ...base,
      hp,
      maxHp: hp,
      shield,
      maxShield: shield,
      speed: (33 + speedBonus * 0.4) * totalSpeedMult,
      radius: 29,
      reward: boostEnemyKillReward(Math.max(70, Math.round((165 + effectiveWave * 5.2) * rewardScale))),
      scoreValue: Math.round(920 * scoreMultTotal),
      armorRatio: Math.min(0.76, 0.54 + armorAdd),
      abilityCooldown: 4.2,
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

    // Special Archetype & Telegraphed Boss/Super Boss Abilities
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
      } else if (enemy.kind === 'shieldbearer') {
        enemy.abilityCooldown -= dt;
        if (enemy.abilityCooldown <= 0) {
          enemy.abilityCooldown = 3.6;
          if (enemy.maxShield > 0 && enemy.shield < enemy.maxShield) {
            enemy.shield = Math.min(enemy.maxShield, enemy.shield + Math.round(enemy.maxShield * 0.25));
            shieldRegenEvents.push({ x: enemy.x, y: enemy.y });
          }
        }
      } else if (enemy.kind === 'boss' || enemy.kind === 'super_boss') {
        if (enemy.windupTimer > 0 && enemy.windupKind) {
          enemy.windupTimer = Math.max(0, enemy.windupTimer - dt);
          if (enemy.windupTimer <= 0) {
            const castKind = enemy.windupKind;
            enemy.windupKind = null;
            enemy.abilityCooldown = enemy.kind === 'super_boss' ? 5.2 : 4.8;
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
          enemy.abilityCooldown -= dt;
          if (enemy.abilityCooldown <= 0) {
            const cycle: BossWindupKind =
              enemy.kind === 'super_boss'
                ? enemy.shield < enemy.maxShield * 0.65
                  ? 'shield_surge'
                  : enemy.fortifyTimer <= 0
                    ? 'armor_bastion'
                    : 'escort_deploy'
                : enemy.shield < enemy.maxShield * 0.75
                  ? 'shield_surge'
                  : 'armor_bastion';
            enemy.windupKind = cycle;
            enemy.windupMax = enemy.kind === 'super_boss' ? 1.55 : 1.35;
            enemy.windupTimer = enemy.windupMax;
            windupEvents.push({ x: enemy.x, y: enemy.y, kind: cycle });
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
  const absorbFraction = (level >= 10 ? 0.72 : level >= 5 ? 0.55 : 0.45) * (variant === 'omega' ? 1.45 : 1);
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
  const base = level >= 7 ? 2 : 1;
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
  chargeScale: 0.2, // 5x slower Overdrive charge compared to legacy 1.0 rate
  initialCharge: 10,
  durationSec: 8.0,
  speedMult: 1.75,
  damageMult: 1.55,
  hudDpsMult: 2.71, // ~1.75 * 1.55 effective firepower multiplier
  droneRateMult: 1.9,
  globalJudgmentBase: 260,
  globalJudgmentPerWave: 42,
  secondWaveTriggerSec: 4.0,
} as const;

/**
 * Computes Overdrive ("Hội Tụ Hỏa Lực") charge gained from actual damage dealt.
 * Scaled by 0.2 (5x slower accumulation) in exchange for overwhelming Overdrive burst power.
 */
export function computeOverdriveChargeGain(actualDamage: number, baseRate = 0.045): number {
  if (actualDamage <= 0 || baseRate <= 0) return 0;
  return actualDamage * baseRate * OVERDRIVE_CONFIG.chargeScale;
}

