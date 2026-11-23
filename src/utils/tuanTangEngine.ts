// Core game state & simulation engine for:
// TUẪN TÁNG: ĐỊA CUNG LY SƠN (殉葬) — 210 TCN Qin Shi Huang Mausoleum First-Person Sensory Horror

export type TuanTangDifficulty = 'explorer' | 'nightmare';

export type TuanTangScreenMode = 'title' | 'playing' | 'paused' | 'dying' | 'ending_cutscene' | 'gameover';

export type TuanTangEndingKind =
  | 'none'
  | 'caught_crawler'
  | 'caught_terracotta'
  | 'trap_crossbow'
  | 'mercury_fall'
  | 'suffocated'
  | 'desperate_slit';

export type TombZoneId = 'ossuary' | 'mercury_canal' | 'terracotta_hall' | 'dome_ascent';

export interface HidingSpotDef {
  id: string;
  kind: 'coffin' | 'niche';
  label: string;
  x: number;
  y: number;
  z: number;
  peekYaw: number;
  zone: TombZoneId;
}

export interface TrapDef {
  id: string;
  kind: 'crossbow' | 'mercury_pit';
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  triggered: boolean;
  label: string;
}

export interface MatchPickupDef {
  id: string;
  x: number;
  y: number;
  z: number;
  count: number;
  collected: boolean;
}

export interface CrawlerEntity {
  id: string;
  mode: 'patrol' | 'investigate' | 'hunt' | 'sniffing_slit' | 'ceiling_stalk';
  x: number;
  y: number;
  z: number;
  yaw: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  speed: number;
  alertness: number; // 0..100
  sniffTimer: number;
  sniffDuration: number;
  onCeiling: boolean;
  limbPhase: number;
}

export interface TerracottaStatueEntity {
  id: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  isMimic: boolean;
  awake: boolean;
  movedCount: number;
  stepSoundPending: boolean;
  scale: number;
}

export interface MercuryRiverZone {
  id: string;
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  hasBridge: boolean;
  bridgeXMin: number;
  bridgeXMax: number;
}

export interface WallBox {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
  yMax: number;
}

export interface TuanTangGameState {
  difficulty: TuanTangDifficulty;
  elapsedSec: number;
  zone: TombZoneId;

  // Player spatial coordinates (tomb spans Z: 0 -> -96, X: -14 -> +14, climbs Y: 0 -> 12 at north dome)
  playerX: number;
  playerY: number;
  playerZ: number;
  yaw: number;
  pitch: number;
  crouching: boolean;
  sprinting: boolean;
  stepPhase: number;

  // Survival vitals
  stamina: number; // 0..100
  oxygen: number; // 0..100
  mercuryToxicity: number; // 0..100
  madness: number; // 0..100
  blackoutWarning: number; // 0..1

  // Matchstick system (95% darkness)
  matchesRemaining: number;
  matchLit: boolean;
  matchTimer: number; // remaining seconds when lit
  matchMaxDuration: number;
  matchStrikeCooldown: number;
  dampStrikeFailsLeft: number;

  // Sensory & breath/mouth mechanics
  holdingMouth: boolean; // Left Mouse Button held to clamp hands over mouth/nose
  micNoiseLevel: number; // 0..100 live mic or fallback noise
  emittedNoise: number; // 0..100 effective acoustic loudness in tomb
  coughActive: boolean;
  coughTimer: number;
  nextCoughCooldown: number;

  // Hiding & Breath-Hold Encounter
  hidingSpotId: string | null;
  sniffEncounterActive: boolean;
  sniffDangerProgress: number; // 0..100, fills if player makes noise while monster sniffs slit
  sniffRemainingSec: number;

  // Climb & Final Dome Slit
  climbProgress: number; // 0..100 on the final ascent scaffolding (z <= -80)
  reachedVentSlit: boolean;

  // World entities
  hidingSpots: HidingSpotDef[];
  traps: TrapDef[];
  matchPickups: MatchPickupDef[];
  crawlers: CrawlerEntity[];
  statues: TerracottaStatueEntity[];
  mercuryRivers: MercuryRiverZone[];
  walls: WallBox[];

  // Audio/FX cues emitted this tick
  lastWhisperText: string | null;
  whisperFadeTimer: number;
  statusNote: string;
  ending: TuanTangEndingKind;
  deathTimer: number; // 0..3.8s uncut death animation
  endingTimer: number; // 0..6.5s desperate slit animation
}

export interface TuanTangInputFrame {
  dt: number;
  moveForward: number; // -1..1
  moveRight: number; // -1..1
  sprint: boolean;
  crouch: boolean;
  holdingMouth: boolean;
  micLevel: number; // 0..100
  micThreshold: number; // e.g. 22
  manualBreathHold: boolean; // keyboard fallback [B]
}

export interface TuanTangTickEvents {
  footstep: boolean;
  matchFizzle: boolean;
  coughBurst: boolean;
  coughSuppressed: boolean;
  clayScrapeBehind: boolean;
  binauralKnock: boolean;
  binauralWhisper: boolean;
  sniffStarted: boolean;
  sniffPassed: boolean;
  crawlerAlerted: boolean;
  crossbowTriggered: boolean;
  pickedMatch: boolean;
  enteredZone: TombZoneId | null;
  deathTriggered: TuanTangEndingKind | null;
}

export const HISTORICAL_EPITAPH =
  'Sử Ký — Tần Thủy Hoàng Bản Kỷ: "Táng ký, hoặc viết công tượng vi cơ, tri chi giả chúng, tận bế trung tiện môn, vô phục xuất giả." (Chôn cất xong, e thợ thủ công biết hết cơ quan, bèn đóng sập cửa hầm giữa. Không một ai thoát ra.)';

export const TOMB_WALLS: WallBox[] = [
  // Outer tomb boundary walls (X: -12..12, Z: +8..-96)
  { xMin: -13, xMax: -11.5, zMin: -98, zMax: 10, yMax: 9 },
  { xMin: 11.5, xMax: 13, zMin: -98, zMax: 10, yMax: 9 },
  { xMin: -13, xMax: 13, zMin: 7.5, zMax: 9.5, yMax: 9 }, // Sealed thousand-ton stone gate behind player
  { xMin: -13, xMax: 13, zMin: -98, zMax: -95.5, yMax: 16 }, // North dome back wall

  // Gatehouse chokepoint pillars between Ossuary (Z > -18) and Mercury Canal (-18..-44)
  { xMin: -11.5, xMax: -3.2, zMin: -19, zMax: -17, yMax: 8 },
  { xMin: 3.2, xMax: 11.5, zMin: -19, zMax: -17, yMax: 8 },

  // Chokepoint between Mercury Canal and Terracotta Hall (-44..-74)
  { xMin: -11.5, xMax: -3.5, zMin: -45, zMax: -43, yMax: 8 },
  { xMin: 3.5, xMax: 11.5, zMin: -45, zMax: -43, yMax: 8 },

  // Pillars in Terracotta Hall
  { xMin: -6.5, xMax: -4.8, zMin: -58, zMax: -56.3, yMax: 8 },
  { xMin: 4.8, xMax: 6.5, zMin: -58, zMax: -56.3, yMax: 8 },
  { xMin: -6.5, xMax: -4.8, zMin: -68, zMax: -66.3, yMax: 8 },
  { xMin: 4.8, xMax: 6.5, zMin: -68, zMax: -66.3, yMax: 8 },

  // Dome Ascent gateway (-75)
  { xMin: -11.5, xMax: -2.8, zMin: -76, zMax: -74, yMax: 10 },
  { xMin: 2.8, xMax: 11.5, zMin: -76, zMax: -74, yMax: 10 },
];

export const MERCURY_RIVERS: MercuryRiverZone[] = [
  {
    id: 'river-1',
    xMin: -11.5,
    xMax: 11.5,
    zMin: -28.5,
    zMax: -24.5,
    hasBridge: true,
    bridgeXMin: 2.2,
    bridgeXMax: 5.2,
  },
  {
    id: 'river-2',
    xMin: -11.5,
    xMax: 11.5,
    zMin: -38.5,
    zMax: -35.0,
    hasBridge: true,
    bridgeXMin: -5.4,
    bridgeXMax: -2.4,
  },
];

export function getTombZoneForZ(z: number): TombZoneId {
  if (z > -18) return 'ossuary';
  if (z > -44) return 'mercury_canal';
  if (z > -75) return 'terracotta_hall';
  return 'dome_ascent';
}

export function getZoneLabel(zone: TombZoneId): string {
  switch (zone) {
    case 'ossuary':
      return 'Hố Tuẫn Táng · Cửa Đá Ngàn Cân';
    case 'mercury_canal':
      return 'Hành Lang Sông Thủy Ngân & Bẫy Nỏ';
    case 'terracotta_hall':
      return 'Đại Điện Binh Mã Dũng';
    case 'dome_ascent':
      return 'Vòm Đỉnh Địa Cung · Khe Thông Gió';
  }
}

export function createInitialTuanTangState(difficulty: TuanTangDifficulty = 'explorer'): TuanTangGameState {
  const isNightmare = difficulty === 'nightmare';

  const hidingSpots: HidingSpotDef[] = [
    { id: 'coffin-1', kind: 'coffin', label: 'Quan Tài Đá Vỡ', x: -7.6, y: 0, z: -8.5, peekYaw: -Math.PI * 0.5, zone: 'ossuary' },
    { id: 'coffin-2', kind: 'coffin', label: 'Quan Tài Cổ Mộc', x: 7.4, y: 0, z: -21.8, peekYaw: Math.PI * 0.5, zone: 'mercury_canal' },
    { id: 'niche-1', kind: 'niche', label: 'Hốc Tượng Đất Nung Tây', x: -8.8, y: 0, z: -32.2, peekYaw: -Math.PI * 0.5, zone: 'mercury_canal' },
    { id: 'coffin-3', kind: 'coffin', label: 'Quách Đá Tướng Quân', x: 8.6, y: 0, z: -51.0, peekYaw: Math.PI * 0.5, zone: 'terracotta_hall' },
    { id: 'niche-2', kind: 'niche', label: 'Hốc Tượng Binh Mã Dũng', x: -8.6, y: 0, z: -63.0, peekYaw: -Math.PI * 0.5, zone: 'terracotta_hall' },
  ];

  const traps: TrapDef[] = [
    { id: 'trap-1', kind: 'crossbow', x: 0.0, z: -13.5, halfWidth: 2.3, halfDepth: 0.75, triggered: false, label: 'Dây Căng Bẫy Nỏ Đồng' },
    { id: 'trap-2', kind: 'crossbow', x: -1.5, z: -31.8, halfWidth: 2.5, halfDepth: 0.75, triggered: false, label: 'Bẫy Nỏ Hành Lang Thủy Ngân' },
    { id: 'trap-3', kind: 'crossbow', x: 0.2, z: -54.5, halfWidth: 2.6, halfDepth: 0.75, triggered: false, label: 'Cơ Quan Nỏ Đại Điện' },
    { id: 'trap-4', kind: 'crossbow', x: 0.0, z: -70.5, halfWidth: 2.4, halfDepth: 0.75, triggered: false, label: 'Bẫy Nỏ Cửa Vòm Đỉnh' },
  ];

  const matchPickups: MatchPickupDef[] = [
    { id: 'm-1', x: 4.5, y: 0.6, z: -4.2, count: 3, collected: false },
    { id: 'm-2', x: -4.8, y: 0.6, z: -21.5, count: 4, collected: false },
    { id: 'm-3', x: 5.4, y: 0.6, z: -33.2, count: 3, collected: false },
    { id: 'm-4', x: -2.2, y: 0.6, z: -50.2, count: 4, collected: false },
    { id: 'm-5', x: 3.4, y: 0.6, z: -68.5, count: 3, collected: false },
  ];

  const crawlers: CrawlerEntity[] = [
    {
      id: 'crawler-1',
      mode: 'patrol',
      x: 5.5,
      y: 0,
      z: -14.5,
      yaw: Math.PI,
      targetX: -5.5,
      targetY: 0,
      targetZ: -11.5,
      speed: isNightmare ? 2.5 : 2.0,
      alertness: 12,
      sniffTimer: 0,
      sniffDuration: 4.6,
      onCeiling: false,
      limbPhase: 0,
    },
    {
      id: 'crawler-2',
      mode: 'ceiling_stalk',
      x: -4.0,
      y: 4.4,
      z: -33.0,
      yaw: 0,
      targetX: 4.5,
      targetY: 4.4,
      targetZ: -31.5,
      speed: isNightmare ? 2.75 : 2.25,
      alertness: 18,
      sniffTimer: 0,
      sniffDuration: 5.0,
      onCeiling: true,
      limbPhase: 1.7,
    },
    {
      id: 'crawler-3',
      mode: 'patrol',
      x: 0.0,
      y: 0,
      z: -60.5,
      yaw: 0,
      targetX: 6.0,
      targetY: 0,
      targetZ: -64.0,
      speed: isNightmare ? 2.85 : 2.35,
      alertness: 20,
      sniffTimer: 0,
      sniffDuration: 5.2,
      onCeiling: false,
      limbPhase: 3.1,
    },
  ];

  // Terracotta Hall grid + sentinel mimics
  const statues: TerracottaStatueEntity[] = [];
  const rowsZ = [-48, -53, -58, -63, -68];
  const colsX = [-7.8, -3.6, 3.6, 7.8];
  let idx = 0;
  for (let r = 0; r < rowsZ.length; r += 1) {
    for (let c = 0; c < colsX.length; c += 1) {
      idx += 1;
      // 4 camouflaged living clay mimics hidden among the motionless terracotta army
      const isMimic =
        (r === 1 && c === 1) ||
        (r === 2 && c === 2) ||
        (r === 3 && c === 1) ||
        (r === 4 && c === 2);
      statues.push({
        id: `terra-${idx}`,
        x: colsX[c],
        y: 0,
        z: rowsZ[r],
        yaw: colsX[c] < 0 ? Math.PI * 0.5 : -Math.PI * 0.5,
        isMimic,
        awake: false,
        movedCount: 0,
        stepSoundPending: false,
        scale: 0.96 + ((idx % 5) * 0.02),
      });
    }
  }

  return {
    difficulty,
    elapsedSec: 0,
    zone: 'ossuary',

    playerX: 0,
    playerY: 0,
    playerZ: 3.2,
    yaw: 0, // facing -Z (north into the deep tomb)
    pitch: 0,
    crouching: false,
    sprinting: false,
    stepPhase: 0,

    stamina: 100,
    oxygen: 100,
    mercuryToxicity: 8,
    madness: 5,
    blackoutWarning: 0,

    matchesRemaining: isNightmare ? 6 : 9,
    matchLit: false,
    matchTimer: 0,
    matchMaxDuration: 6.5,
    matchStrikeCooldown: 0,
    dampStrikeFailsLeft: 0,

    holdingMouth: false,
    micNoiseLevel: 0,
    emittedNoise: 0,
    coughActive: false,
    coughTimer: 0,
    nextCoughCooldown: 14,

    hidingSpotId: null,
    sniffEncounterActive: false,
    sniffDangerProgress: 0,
    sniffRemainingSec: 0,

    climbProgress: 0,
    reachedVentSlit: false,

    hidingSpots,
    traps,
    matchPickups,
    crawlers,
    statues,
    mercuryRivers: MERCURY_RIVERS,
    walls: TOMB_WALLS,

    lastWhisperText: null,
    whisperFadeTimer: 0,
    statusNote: 'Cánh cửa đá ngàn cân vừa sập xuống. Quẹt diêm [F] hoặc mò mẫm tìm đường lên khe thông gió phía Bắc.',
    ending: 'none',
    deathTimer: 0,
    endingTimer: 0,
  };
}

export function strikeMatch(state: TuanTangGameState): {
  next: TuanTangGameState;
  outcome: 'lit' | 'damp_fail' | 'extinguished' | 'empty' | 'blocked';
} {
  if (state.ending !== 'none') {
    return { next: state, outcome: 'blocked' };
  }
  if (state.matchLit) {
    // Blow out / extinguish match early to stay hidden
    return {
      next: {
        ...state,
        matchLit: false,
        matchTimer: 0,
        statusNote: 'Bạn thổi tắt que diêm. Bóng tối đặc quánh nuốt chửng mọi thứ.',
      },
      outcome: 'extinguished',
    };
  }
  if (state.matchStrikeCooldown > 0) {
    return { next: state, outcome: 'blocked' };
  }
  if (state.matchesRemaining <= 0) {
    return {
      next: {
        ...state,
        statusNote: 'Hộp diêm đã cạn sạch. Bạn chỉ còn thính giác và đôi tay dò đá.',
      },
      outcome: 'empty',
    };
  }

  // Damp matches occasionally require a second strike (~32% chance on cold strike)
  const dampMiss = state.dampStrikeFailsLeft === 0 && ((Math.floor(state.elapsedSec * 10) + state.matchesRemaining) % 3 === 0);
  if (dampMiss) {
    // Damp scrape STILL makes noise and alerts nearby crawlers!
    const alertedCrawlers = state.crawlers.map((c) => {
      const dist = Math.hypot(c.x - state.playerX, c.z - state.playerZ);
      if (dist < 28) {
        return {
          ...c,
          mode: 'investigate' as const,
          targetX: state.playerX,
          targetY: 0,
          targetZ: state.playerZ,
          alertness: Math.min(100, c.alertness + 35),
          onCeiling: false,
        };
      }
      return c;
    });
    return {
      next: {
        ...state,
        matchStrikeCooldown: 0.45,
        dampStrikeFailsLeft: 1,
        emittedNoise: Math.max(state.emittedNoise, 46),
        crawlers: alertedCrawlers,
        statusNote: 'Que diêm bị ẩm! Tiếng quẹt xẹt vang vọng trong hầm — thử quẹt lại!',
      },
      outcome: 'damp_fail',
    };
  }

  // Match ignites! Bright flash + loud flare alerts crawlers within 50m
  const alertedCrawlers = state.crawlers.map((c) => {
    const dist = Math.hypot(c.x - state.playerX, c.z - state.playerZ);
    if (dist <= 50) {
      return {
        ...c,
        mode: c.mode === 'sniffing_slit' ? c.mode : ('investigate' as const),
        targetX: state.playerX,
        targetY: 0,
        targetZ: state.playerZ,
        alertness: Math.min(100, c.alertness + (dist < 22 ? 65 : 42)),
        onCeiling: dist < 18 ? false : c.onCeiling,
      };
    }
    return c;
  });

  return {
    next: {
      ...state,
      matchesRemaining: state.matchesRemaining - 1,
      matchLit: true,
      matchTimer: state.matchMaxDuration,
      matchStrikeCooldown: 0.5,
      dampStrikeFailsLeft: 0,
      emittedNoise: Math.max(state.emittedNoise, 72),
      crawlers: alertedCrawlers,
      statusNote: 'Que diêm bùng sáng! Quan sát bẫy nỏ, sông thủy ngân & hốc ẩn nấp ngay!',
    },
    outcome: 'lit',
  };
}

export function findNearestInteractable(state: TuanTangGameState):
  | { kind: 'hiding_spot'; spot: HidingSpotDef; dist: number }
  | { kind: 'match_pickup'; pickup: MatchPickupDef; dist: number }
  | { kind: 'vent_climb'; dist: number }
  | null {
  if (state.hidingSpotId) {
    const current = state.hidingSpots.find((s) => s.id === state.hidingSpotId);
    if (current) return { kind: 'hiding_spot', spot: current, dist: 0 };
  }

  // Check final ventilation shaft climb zone at far north dome
  if (state.playerZ <= -83.5) {
    const ventDist = Math.hypot(state.playerX - 0, state.playerZ - -92.5);
    if (ventDist < 6.5) {
      return { kind: 'vent_climb', dist: ventDist };
    }
  }

  let bestSpot: { spot: HidingSpotDef; dist: number } | null = null;
  for (const spot of state.hidingSpots) {
    const d = Math.hypot(spot.x - state.playerX, spot.z - state.playerZ);
    if (d < 2.8 && (!bestSpot || d < bestSpot.dist)) {
      bestSpot = { spot, dist: d };
    }
  }

  let bestPickup: { pickup: MatchPickupDef; dist: number } | null = null;
  for (const p of state.matchPickups) {
    if (p.collected) continue;
    const d = Math.hypot(p.x - state.playerX, p.z - state.playerZ);
    if (d < 2.4 && (!bestPickup || d < bestPickup.dist)) {
      bestPickup = { pickup: p, dist: d };
    }
  }

  if (bestPickup && (!bestSpot || bestPickup.dist <= bestSpot.dist)) {
    return { kind: 'match_pickup', pickup: bestPickup.pickup, dist: bestPickup.dist };
  }
  if (bestSpot) {
    return { kind: 'hiding_spot', spot: bestSpot.spot, dist: bestSpot.dist };
  }
  return null;
}

export function toggleHideOrInteract(state: TuanTangGameState): {
  next: TuanTangGameState;
  action: 'entered_hide' | 'exited_hide' | 'picked_matches' | 'climbed_step' | 'none';
} {
  if (state.ending !== 'none') return { next: state, action: 'none' };

  if (state.hidingSpotId) {
    const spot = state.hidingSpots.find((s) => s.id === state.hidingSpotId);
    if (state.sniffEncounterActive) {
      // Trying to bolt out while monster's face is pressed to the slit gets you caught!
      return {
        next: {
          ...state,
          hidingSpotId: null,
          sniffEncounterActive: false,
          ending: 'caught_crawler',
          deathTimer: 0,
          statusNote: 'Bạn tung nắp quan tài đúng lúc con quái vật đang kề mặt ngoài khe hở!',
        },
        action: 'exited_hide',
      };
    }
    const exitX = spot ? (spot.x < 0 ? spot.x + 1.8 : spot.x - 1.8) : state.playerX;
    return {
      next: {
        ...state,
        hidingSpotId: null,
        playerX: exitX,
        statusNote: 'Bạn khẽ đẩy nắp đá chui ra ngoài.',
      },
      action: 'exited_hide',
    };
  }

  const target = findNearestInteractable(state);
  if (!target) return { next: state, action: 'none' };

  if (target.kind === 'match_pickup') {
    return {
      next: {
        ...state,
        matchesRemaining: state.matchesRemaining + target.pickup.count,
        matchPickups: state.matchPickups.map((p) =>
          p.id === target.pickup.id ? { ...p, collected: true } : p
        ),
        statusNote: `Nhặt được +${target.pickup.count} que diêm khô trong hốc tường.`,
      },
      action: 'picked_matches',
    };
  }

  if (target.kind === 'hiding_spot') {
    // Extinguish match upon hiding so you don't broadcast your coffin
    const spot = target.spot;
    // Check if any crawler was already hunting close by — triggers terrifying slit sniff encounter!
    const nearCrawler = state.crawlers.some(
      (c) => Math.hypot(c.x - state.playerX, c.z - state.playerZ) < 16 || c.alertness > 45
    );
    const updatedCrawlers = state.crawlers.map((c, idx) => {
      if (nearCrawler && idx === 0) {
        return {
          ...c,
          mode: 'sniffing_slit' as const,
          x: spot.x + (spot.x < 0 ? 1.45 : -1.45),
          y: 0,
          z: spot.z,
          targetX: spot.x,
          targetZ: spot.z,
          sniffTimer: 0,
          sniffDuration: state.difficulty === 'nightmare' ? 5.6 : 4.4,
          onCeiling: false,
        };
      }
      return c;
    });

    return {
      next: {
        ...state,
        hidingSpotId: spot.id,
        playerX: spot.x,
        playerZ: spot.z,
        yaw: spot.peekYaw,
        matchLit: false,
        matchTimer: 0,
        sniffEncounterActive: nearCrawler,
        sniffDangerProgress: 0,
        sniffRemainingSec: nearCrawler ? (state.difficulty === 'nightmare' ? 5.6 : 4.4) : 0,
        crawlers: updatedCrawlers,
        statusNote: nearCrawler
          ? 'NÍN THỞ NGAY! Có thứ gì đó đang bò tới ghé sát mặt vào khe hở!'
          : `Đang ẩn mình trong ${spot.label}. Nhấn [E] để bước ra.`,
      },
      action: 'entered_hide',
    };
  }

  if (target.kind === 'vent_climb') {
    const nextProgress = Math.min(100, state.climbProgress + 34);
    const finished = nextProgress >= 100;
    return {
      next: {
        ...state,
        climbProgress: nextProgress,
        playerY: (nextProgress / 100) * 9.5,
        reachedVentSlit: finished,
        ending: finished ? 'desperate_slit' : 'none',
        endingTimer: 0,
        statusNote: finished
          ? 'Ánh nắng mặt trời rọi thẳng vào mắt! Bạn thò tay qua khe thông gió...'
          : `Đang bám vách đá leo lên đỉnh vòm (${Math.round(nextProgress)}%)...`,
      },
      action: 'climbed_step',
    };
  }

  return { next: state, action: 'none' };
}

function collidesWithWalls(x: number, z: number, walls: WallBox[], radius = 0.48): boolean {
  for (const w of walls) {
    if (
      x + radius > w.xMin &&
      x - radius < w.xMax &&
      z + radius > w.zMin &&
      z - radius < w.zMax
    ) {
      return true;
    }
  }
  return false;
}

function isInMercuryRiver(x: number, z: number, rivers: MercuryRiverZone[]): {
  inRiver: boolean;
  nearRiver: boolean;
} {
  for (const r of rivers) {
    const near = x >= r.xMin - 2 && x <= r.xMax + 2 && z >= r.zMin - 3.5 && z <= r.zMax + 3.5;
    if (x >= r.xMin && x <= r.xMax && z >= r.zMin && z <= r.zMax) {
      if (r.hasBridge && x >= r.bridgeXMin && x <= r.bridgeXMax) {
        return { inRiver: false, nearRiver: true };
      }
      return { inRiver: true, nearRiver: true };
    }
    if (near) {
      return { inRiver: false, nearRiver: true };
    }
  }
  return { inRiver: false, nearRiver: false };
}

function isStatueInPlayerView(
  playerX: number,
  playerZ: number,
  playerYaw: number,
  statue: TerracottaStatueEntity
): boolean {
  const dx = statue.x - playerX;
  const dz = statue.z - playerZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.1) return true;
  // Forward vector in Three.js with yaw=0 looking down -Z: (-sin(yaw), -cos(yaw))
  const fwdX = -Math.sin(playerYaw);
  const fwdZ = -Math.cos(playerYaw);
  const dot = (dx * fwdX + dz * fwdZ) / dist;
  return dot > 0.35; // within ~140 deg frontal cone
}

const HALLUCINATION_WHISPERS = [
  'Ai đang thở ngay sau gáy ngươi...',
  'Đừng quay lại... tượng đất đang mở mắt...',
  'Hai vạn người... không ai bước ra...',
  'Gõ cửa... có tiếng gõ ngay sau lưng ngươi...',
  'Nín thở đi... nó đang ngửi thấy hơi ấm...',
];

export function tickTuanTangSimulation(
  prev: TuanTangGameState,
  input: TuanTangInputFrame
): { next: TuanTangGameState; events: TuanTangTickEvents } {
  const dt = Math.min(0.08, Math.max(0.001, input.dt));
  const events: TuanTangTickEvents = {
    footstep: false,
    matchFizzle: false,
    coughBurst: false,
    coughSuppressed: false,
    clayScrapeBehind: false,
    binauralKnock: false,
    binauralWhisper: false,
    sniffStarted: false,
    sniffPassed: false,
    crawlerAlerted: false,
    crossbowTriggered: false,
    pickedMatch: false,
    enteredZone: null,
    deathTriggered: null,
  };

  // Advance uncut death sequence or desperate slit ending timer
  if (prev.ending === 'desperate_slit') {
    return {
      next: {
        ...prev,
        endingTimer: prev.endingTimer + dt,
      },
      events,
    };
  }
  if (prev.ending !== 'none') {
    return {
      next: {
        ...prev,
        deathTimer: prev.deathTimer + dt,
      },
      events,
    };
  }

  let {
    playerX,
    playerY,
    playerZ,
    crouching,
    sprinting,
    stepPhase,
    stamina,
    oxygen,
    mercuryToxicity,
    madness,
    blackoutWarning,
    matchLit,
    matchTimer,
    matchStrikeCooldown,
    coughActive,
    coughTimer,
    nextCoughCooldown,
    hidingSpotId,
    sniffEncounterActive,
    sniffDangerProgress,
    sniffRemainingSec,
    lastWhisperText,
    whisperFadeTimer,
    statusNote,
    zone,
    climbProgress,
  } = prev;

  const isNightmare = prev.difficulty === 'nightmare';
  const holdingMouth = input.holdingMouth || input.manualBreathHold;
  matchStrikeCooldown = Math.max(0, matchStrikeCooldown - dt);
  whisperFadeTimer = Math.max(0, whisperFadeTimer - dt);
  if (whisperFadeTimer <= 0) lastWhisperText = null;

  // 1. Match countdown
  if (matchLit) {
    matchTimer -= dt;
    if (matchTimer <= 0) {
      matchLit = false;
      matchTimer = 0;
      events.matchFizzle = true;
      statusNote = 'Que diêm tắt phụt! Tiếng bước chân trần dội lại từ bốn vách đá...';
    }
  }

  // 2. Player movement (unless hiding inside coffin/niche)
  crouching = input.crouch;
  const movingMag = Math.hypot(input.moveForward, input.moveRight);
  sprinting = !hidingSpotId && !crouching && input.sprint && movingMag > 0.2 && stamina > 5;

  let moveNoise = 0;
  if (!hidingSpotId && movingMag > 0.05) {
    const baseSpeed = crouching ? 1.85 : sprinting ? 5.1 : 3.25;
    const normForward = input.moveForward / Math.max(1, movingMag);
    const normRight = input.moveRight / Math.max(1, movingMag);

    // Three.js FPS basis: forward = (-sin(yaw), -cos(yaw)), right = (cos(yaw), -sin(yaw))
    const fwdX = -Math.sin(prev.yaw);
    const fwdZ = -Math.cos(prev.yaw);
    const rightX = Math.cos(prev.yaw);
    const rightZ = -Math.sin(prev.yaw);

    const vx = (fwdX * normForward + rightX * normRight) * baseSpeed * dt;
    const vz = (fwdZ * normForward + rightZ * normRight) * baseSpeed * dt;

    if (!collidesWithWalls(playerX + vx, playerZ, prev.walls)) {
      playerX += vx;
    }
    if (!collidesWithWalls(playerX, playerZ + vz, prev.walls)) {
      playerZ += vz;
    }

    // Clamp to tomb bounds
    playerX = Math.max(-11.0, Math.min(11.0, playerX));
    playerZ = Math.max(-94.8, Math.min(7.0, playerZ));

    const prevStepCycle = Math.floor(stepPhase);
    stepPhase += (sprinting ? 3.2 : crouching ? 1.45 : 2.15) * dt;
    if (Math.floor(stepPhase) > prevStepCycle) {
      events.footstep = true;
    }

    if (sprinting) {
      stamina = Math.max(0, stamina - 22 * dt);
      moveNoise = 62;
    } else if (crouching) {
      stamina = Math.min(100, stamina + 14 * dt);
      moveNoise = 8;
    } else {
      stamina = Math.min(100, stamina + 8 * dt);
      moveNoise = 28;
    }
  } else {
    stamina = Math.min(100, stamina + 18 * dt);
  }

  // Automatic climbing progress if walking onto scaffolding at the far north dome
  if (!hidingSpotId && playerZ <= -84.0) {
    const distCenter = Math.abs(playerX);
    if (distCenter < 4.5 && playerZ < -86.5) {
      const targetHeight = Math.min(9.5, ((-86.5 - playerZ) / 8.0) * 9.5);
      if (targetHeight > playerY) {
        playerY = targetHeight;
        climbProgress = Math.max(climbProgress, (playerY / 9.5) * 100);
      }
      if (playerZ <= -93.2) {
        return {
          next: {
            ...prev,
            playerX,
            playerY: 9.5,
            playerZ,
            climbProgress: 100,
            reachedVentSlit: true,
            ending: 'desperate_slit',
            endingTimer: 0,
            statusNote: 'Bạn chạm tới khe thông gió trên đỉnh vòm địa cung!',
          },
          events,
        };
      }
    } else {
      playerY = Math.max(0, playerY - 6 * dt);
    }
  } else {
    playerY = 0;
  }

  // Zone transitions
  const newZone = getTombZoneForZ(playerZ);
  if (newZone !== zone) {
    events.enteredZone = newZone;
    zone = newZone;
    if (zone === 'mercury_canal') {
      statusNote = 'Mùi kim loại tanh nồng xộc lên... Sông thủy ngân chảy ngầm và bẫy nỏ cổ đang chờ phía trước.';
    } else if (zone === 'terracotta_hall') {
      statusNote = 'Đại điện Binh Mã Dũng. Đừng bao giờ quay lưng lại quá lâu khi diêm vừa tắt.';
    } else if (zone === 'dome_ascent') {
      statusNote = 'Gió lạnh thổi từ khe hở trên đỉnh vòm! Hãy leo lên cầu đá phía Bắc!';
    }
  }

  // 3. Auto-pickup matches if walking right over them
  let matchPickups = prev.matchPickups;
  let matchesRemaining = prev.matchesRemaining;
  for (let i = 0; i < matchPickups.length; i += 1) {
    const p = matchPickups[i];
    if (!p.collected && Math.hypot(p.x - playerX, p.z - playerZ) < 1.35) {
      matchPickups = matchPickups.map((item, idx) => (idx === i ? { ...item, collected: true } : item));
      matchesRemaining += p.count;
      events.pickedMatch = true;
      statusNote = `Tìm thấy +${p.count} que diêm trong khe đá!`;
    }
  }

  // 4. Check Mercury Rivers & Crossbow Traps
  const riverCheck = isInMercuryRiver(playerX, playerZ, prev.mercuryRivers);
  if (riverCheck.inRiver && !hidingSpotId) {
    events.deathTriggered = 'mercury_fall';
    return {
      next: {
        ...prev,
        playerX,
        playerZ,
        ending: 'mercury_fall',
        deathTimer: 0,
        statusNote: 'Bước hụt vào dòng sông thủy ngân độc đặc quánh!',
      },
      events,
    };
  }

  let traps = prev.traps;
  if (!hidingSpotId && !crouching) {
    for (let i = 0; i < traps.length; i += 1) {
      const t = traps[i];
      if (
        !t.triggered &&
        Math.abs(playerX - t.x) <= t.halfWidth &&
        Math.abs(playerZ - t.z) <= t.halfDepth
      ) {
        traps = traps.map((item, idx) => (idx === i ? { ...item, triggered: true } : item));
        events.crossbowTriggered = true;
        events.deathTriggered = 'trap_crossbow';
        return {
          next: {
            ...prev,
            playerX,
            playerZ,
            traps,
            ending: 'trap_crossbow',
            deathTimer: 0,
            statusNote: 'Vướng dây cơ quan! Hàng loạt mũi nỏ đồng bắn thẳng ra từ vách đá!',
          },
          events,
        };
      }
    }
  }

  // 5. Mercury Toxicity, Madness & Self-Mouth-Cover Oxygen mechanic
  const toxGain = riverCheck.nearRiver
    ? (isNightmare ? 6.2 : 4.6)
    : zone === 'mercury_canal'
      ? 1.8
      : 0.45;
  mercuryToxicity = Math.min(100, mercuryToxicity + toxGain * dt);
  madness = Math.min(100, madness + (mercuryToxicity * 0.032 + (matchLit ? 0 : 0.65)) * dt);

  // Oxygen drains when holding hands tightly over mouth & nose
  if (holdingMouth) {
    oxygen = Math.max(0, oxygen - (isNightmare ? 19.5 : 15.5) * dt);
    blackoutWarning = oxygen < 30 ? (30 - oxygen) / 30 : 0;
    if (oxygen <= 0) {
      events.deathTriggered = 'suffocated';
      return {
        next: {
          ...prev,
          oxygen: 0,
          holdingMouth: true,
          ending: 'suffocated',
          deathTimer: 0,
          statusNote: 'Bạn tự bịt miệng ngạt thở ngất lịm ngay trong bóng tối!',
        },
        events,
      };
    }
  } else {
    oxygen = Math.min(100, oxygen + 24 * dt);
    blackoutWarning = Math.max(0, blackoutWarning - 1.5 * dt);
  }

  // Uncontrolled coughing fits triggered by Mercury Poisoning
  let coughNoise = 0;
  if (coughActive) {
    coughTimer -= dt;
    if (holdingMouth) {
      events.coughSuppressed = true;
      coughNoise = 10; // Muffled behind mud-covered hands
    } else {
      coughNoise = 82; // Loud coughing echoes through the tomb!
    }
    if (coughTimer <= 0) {
      coughActive = false;
      nextCoughCooldown = Math.max(5.5, 19 - mercuryToxicity * 0.13);
    }
  } else if (mercuryToxicity >= 30) {
    nextCoughCooldown -= dt;
    if (nextCoughCooldown <= 0) {
      coughActive = true;
      coughTimer = 2.6;
      events.coughBurst = true;
      if (!holdingMouth) {
        statusNote = 'Ngộ độc thủy ngân gây ho sặc sụa! GIỮ CHUỘT TRÁI để bịt miệng ngay!';
      }
    }
  }

  // Binaural Madness Illusions (door knocks behind your chair & whispers)
  const prevMadBucket = Math.floor(prev.elapsedSec / 11);
  const nextMadBucket = Math.floor((prev.elapsedSec + dt) / 11);
  if (nextMadBucket > prevMadBucket && madness > 24) {
    if (nextMadBucket % 2 === 0) {
      events.binauralKnock = true;
    } else {
      events.binauralWhisper = true;
      lastWhisperText = HALLUCINATION_WHISPERS[nextMadBucket % HALLUCINATION_WHISPERS.length];
      whisperFadeTimer = 3.2;
    }
  }

  // 6. Real Microphone + Emitted Acoustic Noise calculation
  const micOverThreshold = input.micLevel > input.micThreshold ? input.micLevel : 0;
  const rawNoise = Math.max(moveNoise, coughNoise, micOverThreshold, prev.emittedNoise * Math.exp(-3.4 * dt));
  const emittedNoise = Math.min(100, rawNoise);

  // 7. Hiding Breath-Hold Encounter vs Open-Room Blind Crawler AI
  let crawlers = prev.crawlers.map((c) => ({ ...c }));

  if (hidingSpotId && sniffEncounterActive) {
    sniffRemainingSec -= dt;
    // During sniff encounter, ANY real mic breath/swallow above threshold OR unmuffled cough spikes danger!
    const breathViolation =
      input.micLevel > input.micThreshold ||
      (coughActive && !holdingMouth);

    if (breathViolation) {
      sniffDangerProgress = Math.min(100, sniffDangerProgress + (isNightmare ? 72 : 54) * dt);
    } else {
      sniffDangerProgress = Math.max(0, sniffDangerProgress - 16 * dt);
    }

    if (sniffDangerProgress >= 100) {
      events.deathTriggered = 'caught_crawler';
      return {
        next: {
          ...prev,
          hidingSpotId: null,
          sniffEncounterActive: false,
          ending: 'caught_crawler',
          deathTimer: 0,
          statusNote: 'Tiếng thở lọt qua khe đá! Bàn tay đầy vảy thủy ngân thò vào lôi cổ bạn ra!',
        },
        events,
      };
    }

    if (sniffRemainingSec <= 0) {
      sniffEncounterActive = false;
      sniffDangerProgress = 0;
      events.sniffPassed = true;
      statusNote = 'Con quái vật khịt mũi rồi bò đi chỗ khác. Bạn vừa thoát chết trong gang tấc.';
      crawlers = crawlers.map((c, idx) =>
        idx === 0
          ? {
              ...c,
              mode: 'patrol',
              alertness: 15,
              targetX: -playerX * 0.6,
              targetZ: playerZ - 8,
            }
          : c
      );
    }
  } else {
    // Update each blind crawler
    for (let i = 0; i < crawlers.length; i += 1) {
      const c = crawlers[i];
      const distToPlayer = Math.hypot(c.x - playerX, c.z - playerZ);

      // Hear player noise or see match flare
      const hearingRange = (emittedNoise / 100) * 46 + (matchLit ? 32 : 0);
      if (!hidingSpotId && distToPlayer <= hearingRange && (emittedNoise > 24 || matchLit)) {
        if (c.mode !== 'hunt') events.crawlerAlerted = true;
        c.mode = emittedNoise > 52 || matchLit ? 'hunt' : 'investigate';
        c.targetX = playerX;
        c.targetY = playerY;
        c.targetZ = playerZ;
        c.alertness = Math.min(100, c.alertness + 55 * dt);
        c.onCeiling = distToPlayer > 14 ? c.onCeiling : false;
      } else {
        c.alertness = Math.max(8, c.alertness - 7.5 * dt);
        if (c.alertness < 18 && c.mode !== 'patrol' && c.mode !== 'ceiling_stalk') {
          c.mode = i === 1 ? 'ceiling_stalk' : 'patrol';
        }
      }

      // Move crawler toward target
      const dx = c.targetX - c.x;
      const dz = c.targetZ - c.z;
      const distTarget = Math.hypot(dx, dz);
      const activeSpeed =
        c.mode === 'hunt'
          ? c.speed * 1.62
          : c.mode === 'investigate'
            ? c.speed * 1.18
            : c.speed * 0.72;

      if (distTarget > 0.35) {
        const step = Math.min(distTarget, activeSpeed * dt);
        c.x += (dx / distTarget) * step;
        c.z += (dz / distTarget) * step;
        c.yaw = Math.atan2(dx, dz);
        c.limbPhase += activeSpeed * 4.5 * dt;
      } else {
        // Pick next patrol waypoint in its zone
        const baseZ = i === 0 ? -12 : i === 1 ? -34 : -60;
        const seed = Math.sin(prev.elapsedSec * 1.7 + i * 2.3);
        c.targetX = seed * 7.5;
        c.targetZ = baseZ + Math.cos(prev.elapsedSec * 1.1 + i) * 7.0;
      }

      // Vertical crawl (drop from ceiling when close to prey)
      const desiredY = c.onCeiling ? 4.3 : 0;
      c.y += (desiredY - c.y) * Math.min(1, 3.5 * dt);

      // Catch check if player is not hiding
      if (!hidingSpotId && distToPlayer < 1.35 && Math.abs(c.y - playerY) < 1.8) {
        events.deathTriggered = 'caught_crawler';
        return {
          next: {
            ...prev,
            playerX,
            playerY,
            playerZ,
            crawlers,
            ending: 'caught_crawler',
            deathTimer: 0,
            statusNote: 'Con quái vật mù lao từ bóng tối xuống vồ thẳng vào cổ bạn!',
          },
          events,
        };
      }
    }
  }

  // 8. Living Terracotta Warriors ("don't stand still" when unseen or in darkness!)
  let statues = prev.statues;
  if (!hidingSpotId && (zone === 'terracotta_hall' || playerZ < -42)) {
    let anyMoved = false;
    statues = prev.statues.map((s) => {
      if (!s.isMimic) return s;
      const dist = Math.hypot(s.x - playerX, s.z - playerZ);
      const observed = matchLit && isStatueInPlayerView(playerX, playerZ, prev.yaw, s);

      if (observed && dist < 24) {
        // Freezes dead still when you hold matchlight on it, staring with human eyes
        return { ...s, awake: true, stepSoundPending: false };
      }

      // If player is in Terracotta Hall and either looks away OR match is out -> creeps closer!
      if (dist < 22 && dist > 1.25 && (!observed || !matchLit)) {
        anyMoved = true;
        const moveRate = (!matchLit ? 1.55 : 2.15) * (isNightmare ? 1.25 : 1.0);
        const dx = playerX - s.x;
        const dz = playerZ - s.z;
        const nx = s.x + (dx / dist) * moveRate * dt;
        const nz = s.z + (dz / dist) * moveRate * dt;
        const faceYaw = Math.atan2(dx, dz);
        return {
          ...s,
          x: nx,
          z: nz,
          yaw: faceYaw,
          awake: true,
          movedCount: s.movedCount + 1,
          stepSoundPending: true,
        };
      }
      return s;
    });

    if (anyMoved && Math.floor(prev.elapsedSec * 1.4) !== Math.floor((prev.elapsedSec + dt) * 1.4)) {
      events.clayScrapeBehind = true;
    }

    // Check if a living terracotta mimic closed to lethal grab distance right behind you
    const killerStatue = statues.find(
      (s) => s.isMimic && s.awake && Math.hypot(s.x - playerX, s.z - playerZ) < 1.15
    );
    if (killerStatue) {
      events.deathTriggered = 'caught_terracotta';
      return {
        next: {
          ...prev,
          playerX,
          playerZ,
          statues,
          ending: 'caught_terracotta',
          deathTimer: 0,
          statusNote: 'Bức tượng đất nung ngay sau lưng bạn cử động — đôi tay bùn đất siết chặt cổ họng!',
        },
        events,
      };
    }
  }

  return {
    next: {
      ...prev,
      elapsedSec: prev.elapsedSec + dt,
      zone,
      playerX,
      playerY,
      playerZ,
      crouching,
      sprinting,
      stepPhase,
      stamina,
      oxygen,
      mercuryToxicity,
      madness,
      blackoutWarning,
      matchesRemaining,
      matchLit,
      matchTimer,
      matchStrikeCooldown,
      holdingMouth,
      micNoiseLevel: input.micLevel,
      emittedNoise,
      coughActive,
      coughTimer,
      nextCoughCooldown,
      hidingSpotId,
      sniffEncounterActive,
      sniffDangerProgress,
      sniffRemainingSec,
      climbProgress,
      matchPickups,
      traps,
      crawlers,
      statues,
      lastWhisperText,
      whisperFadeTimer,
      statusNote,
    },
    events,
  };
}
