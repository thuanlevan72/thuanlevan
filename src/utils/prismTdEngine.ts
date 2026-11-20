export type OpticType = 'mirror' | 'prism' | 'amp' | 'capacitor';

export type EnemyKind = 'scout' | 'armored' | 'splitter' | 'boss';

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
  readonly hotkey: string;
  readonly name: string;
  readonly roleClue: string;
  readonly cost: number;
  readonly upgradeCosts: readonly [number, number]; // Lv1->2, Lv2->3
}

export interface PlacedOptic {
  id: string;
  col: number;
  row: number;
  type: OpticType;
  rot: number; // 0..7
  level: 1 | 2 | 3;
  chargeTimer: number; // Used by capacitor pulse visual/cooldown
  hitCount: number; // How many beams hit this optic this tick
}

export interface LaserSegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly power: number;
  readonly bounceDepth: number;
  readonly tier: 1 | 2 | 3; // 1=cyan, 2=amber-gold, 3=crimson-plasma
  readonly overdriven: boolean;
}

export interface TdEnemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  waypointIndex: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  reward: number;
  scoreValue: number;
  armorRatio: number; // 0..1 reduction against low-tier raw beams
  slowTimer: number;
  hitFlash: number;
  beamsTouching: number;
  koTimer: number; // >0 while dissolving after hp<=0
}

export interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const TILE_SIZE = 64;
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 768
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 512

// 8 discrete grid directions (45° steps)
export const DIR_VECTORS: readonly { readonly dx: number; readonly dy: number }[] = [
  { dx: 1, dy: 0 },   // 0: East
  { dx: 1, dy: 1 },   // 1: South-East
  { dx: 0, dy: 1 },   // 2: South
  { dx: -1, dy: 1 },  // 3: South-West
  { dx: -1, dy: 0 },  // 4: West
  { dx: -1, dy: -1 }, // 5: North-West
  { dx: 0, dy: -1 },  // 6: North
  { dx: 1, dy: -1 },  // 7: North-East
];

export const OPTIC_CATALOG: readonly OpticCatalogItem[] = [
  {
    type: 'mirror',
    hotkey: '1',
    name: 'Gương Phản Xạ',
    roleClue: 'Bẻ tia 8 hướng (22.5°/bước)',
    cost: 35,
    upgradeCosts: [30, 45],
  },
  {
    type: 'prism',
    hotkey: '2',
    name: 'Lăng Kính 1→3',
    roleClue: 'Tách 1 tia thành 3 chùm quét',
    cost: 65,
    upgradeCosts: [50, 75],
  },
  {
    type: 'amp',
    hotkey: '3',
    name: 'Khuếch Đại',
    roleClue: 'Tăng 65% sát thương xuyên giáp',
    cost: 55,
    upgradeCosts: [45, 70],
  },
  {
    type: 'capacitor',
    hotkey: '4',
    name: 'Tụ Xung Điện',
    roleClue: 'Làm chậm 35% + nổ xung quanh',
    cost: 50,
    upgradeCosts: [40, 65],
  },
];

export const PRISM_MAPS: readonly PrismMapDef[] = [
  {
    id: 'circuit-01',
    name: 'Mạch 01 · Thung Lũng Zic-Zắc',
    difficultyLabel: 'Tiêu chuẩn · 1 Nguồn',
    subtitle: 'Đặt gương ở các khúc cua dài để tia laser quét dọc cả hai hành lang.',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 155,
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
      { id: 'em-1', col: 1, row: 0, dir: 2, basePower: 38 }, // Fires South down col 1
    ],
    walls: [
      { col: 6, row: 3 },
      { col: 6, row: 4 },
    ],
    starterOptics: [
      { col: 1, row: 4, type: 'mirror', rot: 6 }, // Turns S->E across row 4!
    ],
  },
  {
    id: 'circuit-02',
    name: 'Mạch 02 · Giao Lộ Song Nguồn',
    difficultyLabel: 'Chiến thuật · 2 Nguồn',
    subtitle: 'Hai tia phát đối nghịch giao cắt tại trung tâm — tối ưu hóa điểm cộng hưởng ×1.25!',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 175,
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
      { id: 'em-a', col: 0, row: 4, dir: 0, basePower: 34 }, // Fires East along row 4
      { id: 'em-b', col: 11, row: 4, dir: 4, basePower: 34 }, // Fires West along row 4
    ],
    walls: [
      { col: 5, row: 2 },
      { col: 6, row: 2 },
    ],
    starterOptics: [
      { col: 5, row: 4, type: 'prism', rot: 6 }, // Splits North fan
    ],
  },
  {
    id: 'circuit-03',
    name: 'Mạch 03 · Pháo Đài Lăng Kính',
    difficultyLabel: 'Thử thách · Vách Chắn',
    subtitle: 'Vách đá chắn ngang vùng trung tâm — xoay gương vòng qua khe hở và đặt Khuếch Đại!',
    cols: GRID_COLS,
    rows: GRID_ROWS,
    startEnergy: 195,
    startCoreHp: 18,
    totalWaves: 8,
    path: [
      { col: 0, row: 6 },
      { col: 2, row: 6 },
      { col: 2, row: 1 },
      { col: 9, row: 1 },
      { col: 9, row: 6 },
      { col: 11, row: 6 },
    ],
    emitters: [
      { id: 'em-c1', col: 5, row: 7, dir: 6, basePower: 36 },
      { id: 'em-c2', col: 0, row: 3, dir: 0, basePower: 32 },
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

/**
 * Exact 8-way double-sided mirror reflection.
 * `rot` (0..7) rotates mirror normal by 22.5° steps, allowing ANY incoming 45°-step ray
 * to reflect cleanly along one of the 8 grid directions (cardinal or 45° diagonal).
 * Returns `null` if the ray strikes edge-on (parallel to mirror surface -> passes straight through).
 */
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
  capacitorActiveIds: string[];
  totalNetworkDps: number;
}

const MAX_RAY_SEGMENTS = 72;
const MAX_BOUNCE_DEPTH = 14;

/**
 * Traces all emitters across the 12x8 optical circuit grid, computing exact tile-center segments,
 * 8-way double-sided mirror reflections, 1->3 prism fans, amplifier power multipliers, and capacitors.
 */
export function traceLaserNetwork(
  map: PrismMapDef,
  optics: readonly PlacedOptic[],
  overdriveActive = false
): LaserTraceResult {
  const opticMap = new Map<string, PlacedOptic>();
  const hitCountsByOpticId: Record<string, number> = {};
  const capacitorSet = new Set<string>();

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

    // March tile-by-tile along the 8-direction lattice
    for (let step = 0; step < 20; step++) {
      const nextCol = curCol + vec.dx;
      const nextRow = curRow + vec.dy;

      // Out of board bounds -> extend slightly to arena border edge and terminate
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

      // Check opaque wall obstruction
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

      // Check placed optic device
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
        const levelMult = hitOptic.level === 1 ? 1.04 : hitOptic.level === 2 ? 1.18 : 1.35;
        queue.push({
          col: hitOptic.col,
          row: hitOptic.row,
          dir: outDir,
          power: job.power * levelMult,
          bounceDepth: job.bounceDepth + 1,
          tier: job.tier,
        });
      } else if (hitOptic.type === 'prism') {
        // 1 beam splits into 3 beams centered around the prism's aimed orientation!
        const splitRetention = hitOptic.level === 1 ? 0.58 : hitOptic.level === 2 ? 0.68 : 0.78;
        const centerDir = ((hitOptic.rot % 8) + 8) % 8;
        const outDirs = [
          (centerDir + 7) % 8, // -45°
          centerDir,           // 0°
          (centerDir + 1) % 8, // +45°
        ];
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
        const boost = hitOptic.level === 1 ? 1.65 : hitOptic.level === 2 ? 1.95 : 2.25;
        const nextTier: 1 | 2 | 3 = job.tier === 1 ? 2 : 3;
        queue.push({
          col: hitOptic.col,
          row: hitOptic.row,
          dir: job.dir,
          power: job.power * boost,
          bounceDepth: job.bounceDepth + 1,
          tier: nextTier,
        });
      } else if (hitOptic.type === 'capacitor') {
        capacitorSet.add(hitOptic.id);
        const capBonus = hitOptic.level === 1 ? 1.05 : hitOptic.level === 2 ? 1.15 : 1.25;
        queue.push({
          col: hitOptic.col,
          row: hitOptic.row,
          dir: job.dir,
          power: job.power * capBonus,
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
    capacitorActiveIds: Array.from(capacitorSet),
    totalNetworkDps: Math.round(totalNetworkDps),
  };
}

/**
 * Exact squared Euclidean distance from point (px, py) to segment (x1,y1)->(x2,y2).
 */
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
  const count = 6 + waveNumber * 2;
  let elapsed = 0.25;

  for (let i = 0; i < count; i++) {
    let kind: EnemyKind = 'scout';
    if (waveNumber >= 2 && i % 3 === 2) {
      kind = 'armored';
    }
    if (waveNumber >= 3 && i % 4 === 1) {
      kind = 'splitter';
    }
    if ((waveNumber === 5 || waveNumber === 8) && i === count - 1) {
      kind = 'boss';
    }
    items.push({ kind, delaySec: elapsed });
    elapsed += kind === 'splitter' ? 0.55 : kind === 'boss' ? 1.4 : Math.max(0.55, 1.15 - waveNumber * 0.05);
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
  const scale = 1 + (waveNumber - 1) * 0.28;

  if (kind === 'armored') {
    const hp = Math.round(135 * scale);
    return {
      id,
      kind,
      x: spawnPt.x,
      y: spawnPt.y,
      waypointIndex: 1,
      hp,
      maxHp: hp,
      speed: 44 + waveNumber * 1.5,
      radius: 17,
      reward: 18,
      scoreValue: 40,
      armorRatio: 0.42, // Resists weak cyan tier-1 beams unless amplified!
      slowTimer: 0,
      hitFlash: 0,
      beamsTouching: 0,
      koTimer: 0,
    };
  }

  if (kind === 'splitter') {
    const hp = Math.round(54 * scale);
    return {
      id,
      kind,
      x: spawnPt.x,
      y: spawnPt.y,
      waypointIndex: 1,
      hp,
      maxHp: hp,
      speed: 78 + waveNumber * 2,
      radius: 12,
      reward: 11,
      scoreValue: 25,
      armorRatio: 0,
      slowTimer: 0,
      hitFlash: 0,
      beamsTouching: 0,
      koTimer: 0,
    };
  }

  if (kind === 'boss') {
    const hp = Math.round(480 * scale);
    return {
      id,
      kind,
      x: spawnPt.x,
      y: spawnPt.y,
      waypointIndex: 1,
      hp,
      maxHp: hp,
      speed: 34 + waveNumber,
      radius: 23,
      reward: 65,
      scoreValue: 180,
      armorRatio: 0.35,
      slowTimer: 0,
      hitFlash: 0,
      beamsTouching: 0,
      koTimer: 0,
    };
  }

  // 'scout'
  const hp = Math.round(72 * scale);
  return {
    id,
    kind,
    x: spawnPt.x,
    y: spawnPt.y,
    waypointIndex: 1,
    hp,
    maxHp: hp,
    speed: 62 + waveNumber * 1.8,
    radius: 14,
    reward: 13,
    scoreValue: 30,
    armorRatio: 0,
    slowTimer: 0,
    hitFlash: 0,
    beamsTouching: 0,
    koTimer: 0,
  };
}

export interface DamageTickOutcome {
  killedCount: number;
  energyGained: number;
  scoreGained: number;
  totalDamageDealt: number;
  crossfireHits: number;
}

/**
 * Applies continuous laser beam damage and movement to active enemies for one clamped frame `dt`.
 */
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

  for (const enemy of enemies) {
    if (enemy.koTimer > 0) {
      enemy.koTimer = Math.max(0, enemy.koTimer - dt);
      continue;
    }
    if (enemy.hp <= 0) continue;

    // 1. Evaluate laser intersections
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
      // Crossfire resonance bonus when 2+ distinct beams overlap an enemy!
      const resonanceMult = touchingCount >= 2 ? 1.25 : 1;
      if (touchingCount >= 2) crossfireHits += 1;
      const dmg = rawDps * resonanceMult * dt;
      enemy.hp -= dmg;
      totalDamageDealt += dmg;
      enemy.hitFlash = Math.min(0.12, enemy.hitFlash + dt * 2.5);
    } else {
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 3);
    }

    if (enemy.hp <= 0) {
      enemy.hp = 0;
      enemy.koTimer = 0.28; // Smooth dissolve animation before removal
      killedCount += 1;
      energyGained += enemy.reward;
      scoreGained += enemy.scoreValue;
      continue;
    }

    // 2. Advance along path waypoints
    if (enemy.slowTimer > 0) {
      enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    }
    const speedFactor = enemy.slowTimer > 0 ? 0.65 : 1;
    let remainingMove = enemy.speed * speedFactor * dt;

    while (remainingMove > 0 && enemy.waypointIndex < map.path.length) {
      const wp = gridToWorldCenter(
        map.path[enemy.waypointIndex].col,
        map.path[enemy.waypointIndex].row
      );
      const dx = wp.x - enemy.x;
      const dy = wp.y - enemy.y;
      const dist = Math.hypot(dx, dy);
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

    // Reached Core Reactor
    if (enemy.waypointIndex >= map.path.length) {
      enemy.hp = 0;
      enemy.koTimer = 0;
      coreDamageTaken += enemy.kind === 'boss' ? 5 : enemy.kind === 'armored' ? 2 : 1;
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
    },
  };
}
