import {
  CROPS,
  GRID_COLS,
  GRID_ROWS,
  ITEMS,
  TERRACES,
  type ToolId,
} from './cloudValleyData.ts';
import {
  getTileIndex,
  isCropMature,
  isTileUnlocked,
  type CloudValleyGameState,
  type TileState,
} from './cloudValleyEngine.ts';

export const WORLD_COLS = 22;
export const WORLD_ROWS = 17;
export const AVATAR_RADIUS = 0.28;
export const AVATAR_SPEED = 4.6; // tiles per second

export type AvatarFacing = 'down' | 'up' | 'left' | 'right';
export type BuildingId = 'barn' | 'well' | 'merchant' | 'board' | 'pen';

export interface BuildingZone {
  id: BuildingId;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  interactX: number;
  interactY: number;
  solid: boolean;
}

export interface FarmerAvatarState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: AvatarFacing;
  walkPhase: number;
  actionTimer: number;
  actionTool: ToolId | 'well' | 'animal' | null;
  speechText: string | null;
  speechTimer: number;
}

export type InteractTarget =
  | { kind: 'building'; buildingId: BuildingId; label: string; worldX: number; worldY: number }
  | { kind: 'animal'; animalId: string; label: string; worldX: number; worldY: number }
  | { kind: 'locked_terrace'; terraceId: number; label: string; worldX: number; worldY: number }
  | { kind: 'tile'; row: number; col: number; smartTool: ToolId; label: string; worldX: number; worldY: number };

export const FARM_BUILDINGS: readonly BuildingZone[] = [
  {
    id: 'barn',
    name: 'Xưởng & Nhà Kho',
    x1: 2.3,
    y1: 1.0,
    x2: 5.7,
    y2: 3.6,
    interactX: 4.0,
    interactY: 4.15,
    solid: true,
  },
  {
    id: 'well',
    name: 'Giếng Nước Mây',
    x1: 7.0,
    y1: 2.1,
    x2: 8.6,
    y2: 3.55,
    interactX: 7.8,
    interactY: 4.15,
    solid: true,
  },
  {
    id: 'merchant',
    name: 'Lái Buôn & Hạt Giống',
    x1: 10.0,
    y1: 1.2,
    x2: 13.2,
    y2: 3.55,
    interactX: 11.6,
    interactY: 4.15,
    solid: true,
  },
  {
    id: 'board',
    name: 'Sổ Tay Thực Vật',
    x1: 14.3,
    y1: 2.1,
    x2: 15.7,
    y2: 3.55,
    interactX: 15.0,
    interactY: 4.15,
    solid: true,
  },
  {
    id: 'pen',
    name: 'Chuồng Trại & Tự Động',
    x1: 16.0,
    y1: 5.7,
    x2: 20.5,
    y2: 10.3,
    interactX: 15.3,
    interactY: 8.0,
    solid: false,
  },
];

// Fence collision segments around the livestock pen (gate open at x=15.8..16.15, y=7.1..8.9)
const SOLID_RECTS: readonly { x1: number; y1: number; x2: number; y2: number }[] = [
  ...FARM_BUILDINGS.filter((b) => b.solid),
  { x1: 15.85, y1: 5.65, x2: 20.55, y2: 5.95 }, // pen north
  { x1: 15.85, y1: 10.05, x2: 20.55, y2: 10.35 }, // pen south
  { x1: 20.25, y1: 5.65, x2: 20.55, y2: 10.35 }, // pen east
  { x1: 15.85, y1: 5.65, x2: 16.15, y2: 7.1 }, // pen west-top
  { x1: 15.85, y1: 8.9, x2: 16.15, y2: 10.35 }, // pen west-bottom
];

export function createInitialAvatarState(): FarmerAvatarState {
  return {
    x: 8.9,
    y: 5.75,
    vx: 0,
    vy: 0,
    facing: 'down',
    walkPhase: 0,
    actionTimer: 0,
    actionTool: null,
    speechText: 'Chào mừng về Nông Trại Avatar!',
    speechTimer: 2.6,
  };
}

/**
 * Maps a farm tile (row 0..7, col 0..8) to world coordinates (top-left and center)
 * Split cleanly into 4 fenced garden plots with cobblestone paths between them.
 */
export function tileToWorldBounds(row: number, col: number): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
} {
  const x1 = col < 5 ? 3.0 + col : 10.0 + (col - 5);
  const y1 = row < 4 ? 6.0 + row : 11.4 + (row - 4);
  return {
    x1,
    y1,
    x2: x1 + 1,
    y2: y1 + 1,
    cx: x1 + 0.5,
    cy: y1 + 0.5,
  };
}

export function worldToTile(wx: number, wy: number): { row: number; col: number } | null {
  let col = -1;
  if (wx >= 3.0 && wx < 8.0) col = Math.floor(wx - 3.0);
  else if (wx >= 10.0 && wx < 14.0) col = 5 + Math.floor(wx - 10.0);
  if (col < 0 || col >= GRID_COLS) return null;

  let row = -1;
  if (wy >= 6.0 && wy < 10.0) row = Math.floor(wy - 6.0);
  else if (wy >= 11.4 && wy < 15.4) row = 4 + Math.floor(wy - 11.4);
  if (row < 0 || row >= GRID_ROWS) return null;

  return { row, col };
}

export function getAnimalWorldPos(idx: number, nowSec: number): { x: number; y: number } {
  const baseCol = idx % 3;
  const baseRow = Math.floor(idx / 3);
  const bx = 16.9 + baseCol * 1.25;
  const by = 6.8 + baseRow * 1.7;
  const swayX = Math.sin(nowSec * 0.9 + idx * 1.7) * 0.35;
  const swayY = Math.cos(nowSec * 0.7 + idx * 2.3) * 0.28;
  return { x: bx + swayX, y: by + swayY };
}

export function isWalkablePoint(wx: number, wy: number, radius = AVATAR_RADIUS): boolean {
  if (wx < 1.35 + radius || wx > 20.15 - radius) return false;
  if (wy < 3.6 + radius || wy > 15.9 - radius) return false;

  for (const r of SOLID_RECTS) {
    if (
      wx + radius > r.x1 &&
      wx - radius < r.x2 &&
      wy + radius > r.y1 &&
      wy - radius < r.y2
    ) {
      return false;
    }
  }
  return true;
}

export function stepAvatarMovement(
  avatar: FarmerAvatarState,
  inputX: number,
  inputY: number,
  dt: number
): boolean {
  if (avatar.actionTimer > 0) {
    avatar.actionTimer = Math.max(0, avatar.actionTimer - dt);
    if (avatar.actionTimer === 0) avatar.actionTool = null;
  }
  if (avatar.speechTimer > 0) {
    avatar.speechTimer = Math.max(0, avatar.speechTimer - dt);
    if (avatar.speechTimer === 0) avatar.speechText = null;
  }

  const len = Math.hypot(inputX, inputY);
  if (len < 0.05) {
    avatar.vx = 0;
    avatar.vy = 0;
    return false;
  }

  const nx = inputX / len;
  const ny = inputY / len;

  if (Math.abs(nx) > Math.abs(ny)) {
    avatar.facing = nx < 0 ? 'left' : 'right';
  } else {
    avatar.facing = ny < 0 ? 'up' : 'down';
  }

  const stepDist = AVATAR_SPEED * dt;
  const dx = nx * stepDist;
  const dy = ny * stepDist;
  let moved = false;

  if (isWalkablePoint(avatar.x + dx, avatar.y)) {
    avatar.x += dx;
    moved = true;
  }
  if (isWalkablePoint(avatar.x, avatar.y + dy)) {
    avatar.y += dy;
    moved = true;
  }

  avatar.vx = moved ? nx * AVATAR_SPEED : 0;
  avatar.vy = moved ? ny * AVATAR_SPEED : 0;
  if (moved) {
    avatar.walkPhase += stepDist * 4.2;
  }
  return moved;
}

export function resolveSmartToolForTile(tile: TileState): ToolId {
  if (tile.wildMushroom || isCropMature(tile.crop) || tile.hasWeed || tile.hasPest) {
    return 'harvest';
  }
  if (!tile.tilled && !tile.structure) {
    return 'hoe';
  }
  if (tile.tilled && !tile.crop && !tile.structure) {
    return tile.moisture < 65 ? 'water' : 'seed';
  }
  if (tile.crop && tile.moisture < 55 && !CROPS[tile.crop.cropId]?.selfHydrating) {
    return 'water';
  }
  return 'inspect';
}

export function getSmartActionLabel(tool: ToolId, tile: TileState, selectedSeedId: string): string {
  if (tool === 'harvest') {
    if (tile.wildMushroom) return 'Hái Nấm Rừng';
    if (tile.hasWeed) return 'Nhổ Cỏ Dại';
    if (tile.hasPest) return 'Bắt Sâu Bọ';
    return 'Thu Hoạch';
  }
  if (tool === 'hoe') return 'Cuốc Đất';
  if (tool === 'water') return 'Tưới Nước';
  if (tool === 'seed') return `Gieo ${CROPS[selectedSeedId]?.name ?? 'Hạt'}`;
  if (tool === 'compost') return 'Bón Phân';
  if (tool === 'mutagen') return 'Rắc Đột Biến';
  if (tool === 'build') return 'Lắp Thiết Bị';
  return 'Soi Ô Đất';
}

export function detectInteractTarget(
  state: CloudValleyGameState,
  avatar: FarmerAvatarState,
  selectedSeedId: string,
  nowSec = 0
): InteractTarget | null {
  // 1. Check nearby yard buildings & NPCs first when standing near the upper yard or pen gate
  for (const b of FARM_BUILDINGS) {
    const clampedX = Math.max(b.x1, Math.min(b.x2, avatar.x));
    const clampedY = Math.max(b.y1, Math.min(b.y2, avatar.y));
    const dist = Math.hypot(avatar.x - clampedX, avatar.y - clampedY);
    if (b.id !== 'pen' && dist <= 0.92) {
      const labelMap: Record<BuildingId, string> = {
        barn: 'Mở Xưởng & Kho',
        well: 'Múc Nước Giếng',
        merchant: 'Gặp Lái Buôn',
        board: 'Mở Sổ Tay',
        pen: 'Quản Lý Chuồng',
      };
      return {
        kind: 'building',
        buildingId: b.id,
        label: labelMap[b.id],
        worldX: (b.x1 + b.x2) * 0.5,
        worldY: (b.y1 + b.y2) * 0.5,
      };
    }
  }

  // 2. Check nearby livestock inside or just beside the pen
  let bestAnimal: { id: string; label: string; dist: number; x: number; y: number } | null = null;
  state.livestock.forEach((an, idx) => {
    const pos = getAnimalWorldPos(idx, nowSec);
    const dist = Math.hypot(avatar.x - pos.x, avatar.y - pos.y);
    if (dist <= 1.25 && (!bestAnimal || dist < bestAnimal.dist)) {
      const actionVerb = an.productReady
        ? an.type === 'chicken'
          ? 'Nhặt Trứng'
          : an.type === 'cow'
          ? 'Vắt Sữa'
          : 'Xén Lông'
        : !an.fedToday
        ? `Cho ${an.name} Ăn`
        : `Vuốt Ve ${an.name}`;
      bestAnimal = { id: an.id, label: actionVerb, dist, x: pos.x, y: pos.y };
    }
  });
  if (bestAnimal) {
    const picked = bestAnimal as { id: string; label: string; x: number; y: number };
    return {
      kind: 'animal',
      animalId: picked.id,
      label: picked.label,
      worldX: picked.x,
      worldY: picked.y,
    };
  }

  // Pen gate / sign fallback
  const pen = FARM_BUILDINGS.find((b) => b.id === 'pen')!;
  if (Math.hypot(avatar.x - pen.interactX, avatar.y - pen.interactY) <= 0.95) {
    return {
      kind: 'building',
      buildingId: 'pen',
      label: 'Quản Lý Chuồng & Tự Động',
      worldX: pen.interactX,
      worldY: pen.interactY,
    };
  }

  // 3. Check tile in front of the avatar first, then tile directly beneath the avatar
  const dirVec =
    avatar.facing === 'up'
      ? [0, -0.68]
      : avatar.facing === 'down'
      ? [0, 0.68]
      : avatar.facing === 'left'
      ? [-0.68, 0]
      : [0.68, 0];

  const probePoints: [number, number][] = [
    [avatar.x + dirVec[0], avatar.y + dirVec[1]],
    [avatar.x, avatar.y],
  ];

  for (const [px, py] of probePoints) {
    const hit = worldToTile(px, py);
    if (!hit) continue;
    const tile = state.tiles[getTileIndex(hit.row, hit.col)];
    if (!tile) continue;
    const bounds = tileToWorldBounds(hit.row, hit.col);

    if (!isTileUnlocked(state, tile)) {
      const tDef = TERRACES.find((t) => t.id === tile.terraceId);
      return {
        kind: 'locked_terrace',
        terraceId: tile.terraceId,
        label: `Mở Khu ${tile.terraceId} (${tDef?.costGold ?? 0}g)`,
        worldX: bounds.cx,
        worldY: bounds.cy,
      };
    }

    const smartTool = resolveSmartToolForTile(tile);
    return {
      kind: 'tile',
      row: hit.row,
      col: hit.col,
      smartTool,
      label: getSmartActionLabel(smartTool, tile, selectedSeedId),
      worldX: bounds.cx,
      worldY: bounds.cy,
    };
  }

  return null;
}

export function getSeedBagCount(state: CloudValleyGameState, seedId: string): number {
  return state.seedBags?.[seedId] ?? 0;
}

export function getHarvestItemLabel(itemId: string): string {
  return ITEMS[itemId]?.name ?? itemId;
}
