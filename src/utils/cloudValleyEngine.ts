import {
  ARTISAN_RECIPES,
  AUTOMATION_BLUEPRINTS,
  CROPS,
  DAY_DURATION_SECONDS,
  DAYS_PER_SEASON,
  getToolAreaOffsets,
  getXpForNextLevel,
  GRID_COLS,
  GRID_ROWS,
  HYBRID_RECIPES,
  ITEMS,
  MAX_OFFLINE_SECONDS,
  OFFLINE_STEP_SECONDS,
  SEASON_ORDER,
  TERRACES,
  TOOL_UPGRADE_COSTS,
  type AutomationId,
  type CropQuality,
  type FarmerHatId,
  type LivestockType,
  type MachineId,
  type SeasonId,
  type SpriteTask,
  type ToolId,
  type ToolTier,
  type WeatherId,
} from './cloudValleyData.ts';

export interface TileCropState {
  cropId: string;
  progressSeconds: number;
  quality: CropQuality;
  isHybridMutant?: boolean;
}

export interface TileState {
  row: number;
  col: number;
  terraceId: number;
  tilled: boolean;
  moisture: number; // 0..100
  fertility: number; // 0..100
  mutagenApplied: boolean;
  hasWeed: boolean;
  hasPest: boolean;
  birdPecked: boolean;
  crop: TileCropState | null;
  structure: AutomationId | null;
  wildMushroom: boolean;
}

export interface ArtisanSlot {
  uid: string;
  recipeId: string;
  machineId: MachineId;
  remainingSeconds: number;
  totalSeconds: number;
  outputItemId: string;
  outputQty: number;
  xp: number;
  ready: boolean;
}

export interface VillagerOrder {
  id: string;
  villagerName: string;
  title: string;
  itemId: string;
  qty: number;
  rewardGold: number;
  rewardXp: number;
  rewardBadges: number;
  daysLeft: number;
}

export interface LivestockAnimal {
  id: string;
  type: LivestockType;
  name: string;
  fedToday: boolean;
  productReady: boolean;
  happiness: number; // 0..100
}

export interface EarthSprite {
  id: string;
  name: string;
  task: SpriteTask;
  energy: number; // 0..100
  assignedSeedId: string;
  lastActionTick: number;
}

export interface WeekendFairDeal {
  itemId: string;
  multiplier: number;
  maxTrades: number;
  tradesDone: number;
}

export interface OfflineCatchupReport {
  elapsedSeconds: number;
  daysAdvanced: number;
  cropsMatured: number;
  spriteHarvests: number;
  artisanCompleted: number;
  hybridsDiscovered: string[];
  goldEarnedByConveyors: number;
}

export interface CloudValleyEventLog {
  id: string;
  text: string;
  tone: 'info' | 'good' | 'warn';
}

export interface CloudValleyGameState {
  version: number;
  gold: number;
  xp: number;
  level: number;
  badges: number;
  day: number; // 1..7 within season
  totalDays: number;
  seasonIndex: number; // 0..3
  timeInDaySeconds: number; // 0..DAY_DURATION_SECONDS
  weather: WeatherId;
  toolTier: ToolTier;
  unlockedTerraces: number[];
  tiles: TileState[];
  inventory: Record<string, number>;
  seedBags: Record<string, number>;
  farmerProfile: {
    name: string;
    hat: FarmerHatId;
    shirtColor: string;
  };
  wineAgedDays: number; // extra days of cellar aging on wine stock
  almanacUnlocked: string[];
  artisanQueue: ArtisanSlot[];
  orders: VillagerOrder[];
  weekendFair: WeekendFairDeal | null;
  livestock: LivestockAnimal[];
  sprites: EarthSprite[];
  autoFeederOwned: boolean;
  lastActiveTimestamp: number;
  mutationTickAccumulator: number;
  hazardTickAccumulator: number;
  spriteTickAccumulator: number;
  totalHarvested: number;
  totalEarnedGold: number;
  events: CloudValleyEventLog[];
}

export interface ToolActionFeedback {
  changed: boolean;
  message?: string;
  sound?: 'hoe' | 'water' | 'seed' | 'harvest' | 'compost' | 'build' | 'error';
  goldDelta?: number;
  xpDelta?: number;
  hybridUnlocked?: string;
  affectedTiles: { row: number; col: number }[];
}

const VILLAGER_NAMES = ['Bà Tư Tiệm Bánh', 'Chú Ba Thợ Mộc', 'Cô Lan Dệt Vải', 'Bác Sĩ An', 'Trưởng Làng Minh'];

export function getTileTerraceId(row: number, col: number): number {
  for (const t of TERRACES) {
    if (row >= t.rowStart && row <= t.rowEnd && col >= t.colStart && col <= t.colEnd) {
      return t.id;
    }
  }
  return 4;
}

export function getTileIndex(row: number, col: number): number {
  return row * GRID_COLS + col;
}

export function getSeasonId(state: Pick<CloudValleyGameState, 'seasonIndex'>): SeasonId {
  return SEASON_ORDER[((state.seasonIndex % SEASON_ORDER.length) + SEASON_ORDER.length) % SEASON_ORDER.length];
}

export function isTileUnlocked(state: Pick<CloudValleyGameState, 'unlockedTerraces'>, tile: TileState): boolean {
  return state.unlockedTerraces.includes(tile.terraceId);
}

export function isTileInGreenhouse(state: Pick<CloudValleyGameState, 'tiles'>, row: number, col: number): boolean {
  const dirs = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      const t = state.tiles[getTileIndex(r, c)];
      if (t?.structure === 'greenhouse') return true;
    }
  }
  return false;
}

export function isTileProtectedByScarecrow(state: Pick<CloudValleyGameState, 'tiles'>, row: number, col: number): boolean {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        if (state.tiles[getTileIndex(r, c)]?.structure === 'scarecrow') {
          return true;
        }
      }
    }
  }
  return false;
}

export function getTileAuraBonus(state: Pick<CloudValleyGameState, 'tiles'>, row: number, col: number): number {
  let bonus = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        const neighbor = state.tiles[getTileIndex(r, c)];
        if (neighbor?.crop) {
          const def = CROPS[neighbor.crop.cropId];
          if (def?.auraGrowthBonus && neighbor.crop.progressSeconds >= def.growthSeconds) {
            bonus = Math.max(bonus, def.auraGrowthBonus);
          }
        }
      }
    }
  }
  return bonus;
}

export function isCropMature(crop: TileCropState | null): boolean {
  if (!crop) return false;
  const def = CROPS[crop.cropId];
  if (!def) return false;
  return crop.progressSeconds >= def.growthSeconds;
}

export function getSellPrice(state: Pick<CloudValleyGameState, 'seasonIndex' | 'wineAgedDays'>, itemId: string): number {
  const item = ITEMS[itemId];
  if (!item) return 0;
  let price = item.sellPrice;
  if (item.canAgeInCellar && state.wineAgedDays > 0) {
    const agingBonus = Math.min(0.9, state.wineAgedDays * 0.15);
    price = Math.round(price * (1 + agingBonus));
  }
  const season = getSeasonId(state);
  if (season === 'autumn' && (item.category === 'crop' || item.category === 'animal')) {
    price = Math.round(price * 1.2);
  }
  return price;
}

function rollWeatherForSeason(season: SeasonId, rng: () => number): WeatherId {
  const r = rng();
  if (season === 'spring') return r < 0.48 ? 'drizzle' : r < 0.85 ? 'sunny' : 'breeze';
  if (season === 'summer') return r < 0.5 ? 'heatwave' : r < 0.88 ? 'sunny' : 'breeze';
  if (season === 'autumn') return r < 0.5 ? 'breeze' : r < 0.85 ? 'sunny' : 'drizzle';
  return r < 0.65 ? 'snow' : 'breeze';
}

function generateOrders(level: number, season: SeasonId, existingCount: number, rng: () => number): VillagerOrder[] {
  const targetCount = 3;
  const created: VillagerOrder[] = [];
  const candidateItems = Object.values(ITEMS).filter((it) => {
    if (it.category === 'fertilizer') return false;
    const cropDef = CROPS[it.id];
    if (cropDef) {
      if (cropDef.isHybrid) return level >= 4;
      if (cropDef.unlockLevel > level + 1) return false;
      if (cropDef.seasons.includes(season) || season === 'winter') return true;
      return false;
    }
    if (it.tier === 3) return level >= 3;
    if (it.tier === 2) return level >= 2;
    return true;
  });

  const pool = candidateItems.length > 0 ? candidateItems : [ITEMS.lua_mi, ITEMS.ca_chua];

  for (let i = 0; i < Math.max(0, targetCount - existingCount); i++) {
    const item = pool[Math.floor(rng() * pool.length) % pool.length];
    const qty = item.tier === 3 ? 1 + (rng() > 0.65 ? 1 : 0) : item.tier === 2 ? 2 : 2 + Math.floor(rng() * 3);
    const villagerName = VILLAGER_NAMES[Math.floor(rng() * VILLAGER_NAMES.length) % VILLAGER_NAMES.length];
    const baseVal = item.sellPrice * qty;
    created.push({
      id: `ord_${Date.now().toString(36)}_${Math.floor(rng() * 99999)}_${i}`,
      villagerName,
      title: `Cần gấp ${qty} ${item.name}`,
      itemId: item.id,
      qty,
      rewardGold: Math.round(baseVal * 1.45 + 25),
      rewardXp: Math.round(18 + qty * 10 + item.tier * 14),
      rewardBadges: item.tier >= 2 || qty >= 3 ? 2 : 1,
      daysLeft: 3 + Math.floor(rng() * 2),
    });
  }
  return created;
}

export function createInitialCloudValleyState(nowMs = Date.now(), rng: () => number = Math.random): CloudValleyGameState {
  const tiles: TileState[] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const terraceId = getTileTerraceId(row, col);
      // Pre-till a friendly starter 4 plots and pre-plant 2 wheat & 1 tomato so player sees growth right away
      const isStarterTilled = terraceId === 1 && row >= 1 && row <= 2 && col >= 1 && col <= 3;
      let crop: TileCropState | null = null;
      if (row === 1 && col === 1) {
        crop = { cropId: 'lua_mi', progressSeconds: 65, quality: 'gold' };
      } else if (row === 1 && col === 2) {
        crop = { cropId: 'ca_chua', progressSeconds: 50, quality: 'gold' };
      } else if (row === 2 && col === 2) {
        crop = { cropId: 'dau_ha_lan', progressSeconds: 70, quality: 'gold' };
      }
      tiles.push({
        row,
        col,
        terraceId,
        tilled: isStarterTilled,
        moisture: isStarterTilled ? 78 : 55,
        fertility: 95,
        mutagenApplied: false,
        hasWeed: terraceId === 1 && row === 3 && col === 4,
        hasPest: false,
        birdPecked: false,
        crop,
        structure: null,
        wildMushroom: false,
      });
    }
  }

  return {
    version: 1,
    gold: 160,
    xp: 0,
    level: 1,
    badges: 1,
    day: 1,
    totalDays: 1,
    seasonIndex: 0,
    timeInDaySeconds: 0,
    weather: 'drizzle',
    toolTier: 'wood',
    unlockedTerraces: [1],
    tiles,
    inventory: {
      lua_mi: 2,
      ca_chua: 1,
      co_dai: 3,
      phan_huu_co: 2,
      phan_dot_bien: 1,
      co_kho: 6,
    },
    seedBags: {
      lua_mi: 4,
      ca_chua: 2,
      dau_ha_lan: 2,
    },
    farmerProfile: {
      name: 'Nông Dân Mây',
      hat: 'straw',
      shirtColor: '#2E7D32',
    },
    wineAgedDays: 0,
    almanacUnlocked: ['lua_mi', 'ca_chua', 'dau_ha_lan'],
    artisanQueue: [],
    orders: generateOrders(1, 'spring', 0, rng),
    weekendFair: null,
    livestock: [
      {
        id: 'chicken_1',
        type: 'chicken',
        name: 'Gà Mái Mơ',
        fedToday: true,
        productReady: true,
        happiness: 95,
      },
      {
        id: 'cow_1',
        type: 'cow',
        name: 'Bò Sữa Bông',
        fedToday: true,
        productReady: true,
        happiness: 90,
      },
    ],
    sprites: [],
    autoFeederOwned: false,
    lastActiveTimestamp: nowMs,
    mutationTickAccumulator: 0,
    hazardTickAccumulator: 0,
    spriteTickAccumulator: 0,
    totalHarvested: 0,
    totalEarnedGold: 0,
    events: [
      {
        id: 'welcome',
        text: 'Chào mừng tới Nông Trại Thung Lũng Mây! Dùng WASD / Phím Mũi Tên đi quanh vườn & Space để thao tác.',
        tone: 'good',
      },
    ],
  };
}

function addEventLog(state: CloudValleyGameState, text: string, tone: 'info' | 'good' | 'warn' = 'info'): void {
  state.events = [{ id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`, text, tone }, ...state.events].slice(0, 8);
}

export function grantXpAndGold(state: CloudValleyGameState, xpGain: number, goldGain: number): boolean {
  if (goldGain > 0) {
    state.gold += goldGain;
    state.totalEarnedGold += goldGain;
  }
  if (xpGain > 0) {
    state.xp += xpGain;
    let leveledUp = false;
    while (state.xp >= getXpForNextLevel(state.level)) {
      state.xp -= getXpForNextLevel(state.level);
      state.level += 1;
      state.badges += 1;
      leveledUp = true;
      addEventLog(state, `Lên Cấp ${state.level}! Nhận +1 Huy Hiệu Làng.`, 'good');
    }
    return leveledUp;
  }
  return false;
}

function addInventory(state: CloudValleyGameState, itemId: string, qty: number): void {
  if (qty <= 0) return;
  state.inventory[itemId] = (state.inventory[itemId] ?? 0) + qty;
}

function consumeInventory(state: CloudValleyGameState, itemId: string, qty: number): boolean {
  const cur = state.inventory[itemId] ?? 0;
  if (cur < qty) return false;
  state.inventory[itemId] = cur - qty;
  return true;
}

function unlockAlmanacEntry(state: CloudValleyGameState, cropId: string): boolean {
  if (!state.almanacUnlocked.includes(cropId)) {
    state.almanacUnlocked = [...state.almanacUnlocked, cropId];
    return true;
  }
  return false;
}

export function harvestSingleTile(
  state: CloudValleyGameState,
  tile: TileState
): { harvested: boolean; itemId?: string; qty?: number; xp?: number; hybridBonus?: boolean } {
  if (tile.wildMushroom) {
    tile.wildMushroom = false;
    addInventory(state, 'nam_rung_quy', 1);
    unlockAlmanacEntry(state, 'nam_rung_quy');
    grantXpAndGold(state, CROPS.nam_rung_quy.xp, 0);
    state.totalHarvested += 1;
    return { harvested: true, itemId: 'nam_rung_quy', qty: 1, xp: CROPS.nam_rung_quy.xp };
  }

  if (!tile.crop || !isCropMature(tile.crop)) {
    return { harvested: false };
  }

  const def = CROPS[tile.crop.cropId];
  if (!def) return { harvested: false };

  let yieldQty = def.harvestYield;
  const season = getSeasonId(state);

  // Spring perk: fruit crops yield +25% (minimum +1 extra)
  if (season === 'spring' && def.category === 'fruit') {
    yieldQty = Math.max(yieldQty + 1, Math.round(yieldQty * 1.25));
  }

  // Fertility 0% halves yield
  if (tile.fertility <= 0) {
    yieldQty = Math.max(1, Math.floor(yieldQty * 0.5));
  }

  // Quality bonus: Sao Vàng grants +1 bonus unit on multi-yield or extra XP
  if (tile.crop.quality === 'gold' && yieldQty >= 2) {
    yieldQty += 1;
  }

  addInventory(state, def.id, yieldQty);
  unlockAlmanacEntry(state, def.id);

  // Update fertility: legumes restore, regular crops consume -15%
  tile.fertility = Math.max(0, Math.min(100, tile.fertility + def.fertilityDelta));
  tile.hasPest = false;

  const xp = def.xp + (tile.crop.quality === 'gold' ? 6 : 0);
  grantXpAndGold(state, xp, 0);
  state.totalHarvested += yieldQty;

  const wasHybrid = Boolean(def.isHybrid);

  if (def.regrows) {
    tile.crop = {
      cropId: def.id,
      progressSeconds: Math.round(def.growthSeconds * 0.45),
      quality: tile.hasPest ? 'normal' : 'gold',
    };
  } else {
    tile.crop = null;
  }

  return { harvested: true, itemId: def.id, qty: yieldQty, xp, hybridBonus: wasHybrid };
}

export function applyToolAction(
  state: CloudValleyGameState,
  tool: ToolId,
  centerRow: number,
  centerCol: number,
  options?: { seedId?: string; structureId?: AutomationId }
): ToolActionFeedback {
  const offsets = tool === 'build' || tool === 'inspect' ? ([[0, 0]] as const) : getToolAreaOffsets(state.toolTier);
  const affectedTiles: { row: number; col: number }[] = [];
  let changed = false;
  let totalXp = 0;
  let lastSound: ToolActionFeedback['sound'];
  let message: string | undefined;
  let hybridUnlocked: string | undefined;

  for (const [dr, dc] of offsets) {
    const r = centerRow + dr;
    const c = centerCol + dc;
    if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) continue;
    const tile = state.tiles[getTileIndex(r, c)];
    if (!tile || !isTileUnlocked(state, tile)) continue;

    if (tool === 'hoe') {
      if (tile.hasWeed) {
        tile.hasWeed = false;
        addInventory(state, 'co_dai', 1);
        totalXp += 4;
        changed = true;
        lastSound = 'hoe';
        affectedTiles.push({ row: r, col: c });
      } else if (!tile.tilled && !tile.structure) {
        tile.tilled = true;
        tile.birdPecked = false;
        totalXp += 3;
        changed = true;
        lastSound = 'hoe';
        affectedTiles.push({ row: r, col: c });
      }
      continue;
    }

    if (tool === 'water') {
      if (tile.tilled || tile.crop) {
        tile.moisture = 100;
        if (tile.hasPest) {
          tile.hasPest = false;
          message = 'Đã rửa trôi sâu bệnh trên luống!';
        }
        changed = true;
        lastSound = 'water';
        affectedTiles.push({ row: r, col: c });
      }
      continue;
    }

    if (tool === 'seed') {
      const seedId = options?.seedId ?? 'lua_mi';
      const def = CROPS[seedId];
      if (!def || def.seedPrice <= 0) {
        message = 'Giống này chỉ có thể tạo bằng cách lai tạo hoặc thu nhặt!';
        lastSound = 'error';
        continue;
      }
      if (state.level < def.unlockLevel) {
        message = `Cần Cấp ${def.unlockLevel} để trồng ${def.name}.`;
        lastSound = 'error';
        continue;
      }
      const season = getSeasonId(state);
      const inGreenhouse = isTileInGreenhouse(state, r, c);
      if (season === 'winter' && !inGreenhouse) {
        message = 'Ngoài trời Mùa Đông đóng băng! Hãy trồng trong Nhà Kính.';
        lastSound = 'error';
        continue;
      }
      if (!inGreenhouse && !def.seasons.includes(season)) {
        message = `${def.name} không hợp mùa ${season === 'spring' ? 'Xuân' : season === 'summer' ? 'Hạ' : 'Thu'} (trừ Nhà Kính).`;
        lastSound = 'error';
        continue;
      }
      if (tile.hasWeed) {
        message = 'Cần dọn cỏ dại trước khi gieo hạt.';
        continue;
      }
      if (!tile.tilled || tile.crop || tile.structure) continue;
      const inBag = state.seedBags?.[def.id] ?? 0;
      if (inBag > 0) {
        state.seedBags[def.id] = inBag - 1;
      } else {
        if (state.gold < def.seedPrice) {
          message = `Không đủ Vàng (cần ${def.seedPrice} Vàng/hạt).`;
          lastSound = 'error';
          break;
        }
        state.gold -= def.seedPrice;
      }
      tile.crop = {
        cropId: def.id,
        progressSeconds: 0,
        quality: 'gold',
      };
      tile.birdPecked = false;
      unlockAlmanacEntry(state, def.id);
      changed = true;
      lastSound = 'seed';
      affectedTiles.push({ row: r, col: c });
      continue;
    }

    if (tool === 'harvest') {
      if (tile.hasWeed) {
        tile.hasWeed = false;
        addInventory(state, 'co_dai', 1);
        totalXp += 4;
        changed = true;
        lastSound = 'hoe';
        affectedTiles.push({ row: r, col: c });
      }
      if (tile.hasPest && tile.crop && !isCropMature(tile.crop)) {
        tile.hasPest = false;
        totalXp += 5;
        changed = true;
        lastSound = 'compost';
        message = 'Đã bắt sạch sâu bọ hại cây!';
        affectedTiles.push({ row: r, col: c });
      }
      const res = harvestSingleTile(state, tile);
      if (res.harvested) {
        changed = true;
        lastSound = 'harvest';
        affectedTiles.push({ row: r, col: c });
        if (res.hybridBonus && res.itemId) {
          hybridUnlocked = CROPS[res.itemId]?.name;
        }
      }
      continue;
    }

    if (tool === 'compost') {
      if (!tile.tilled && !tile.crop) continue;
      if (!consumeInventory(state, 'phan_huu_co', 1)) {
        message = 'Hết Phân Hữu Cơ! Hãy ủ Cỏ Dại hoặc mua thêm ở Cửa Hàng.';
        lastSound = 'error';
        break;
      }
      tile.fertility = Math.min(100, tile.fertility + 35);
      tile.hasPest = false;
      totalXp += 5;
      changed = true;
      lastSound = 'compost';
      affectedTiles.push({ row: r, col: c });
      continue;
    }

    if (tool === 'mutagen') {
      if (!tile.tilled || tile.crop || tile.mutagenApplied) continue;
      if (!consumeInventory(state, 'phan_dot_bien', 1)) {
        message = 'Hết Phân Đột Biến! Ủ tại Thùng Ủ Phân hoặc mua ở Cửa Hàng.';
        lastSound = 'error';
        break;
      }
      tile.mutagenApplied = true;
      totalXp += 8;
      changed = true;
      lastSound = 'compost';
      message = 'Đã rắc Phân Đột Biến (+35% tỷ lệ sinh Mầm Lai)!';
      affectedTiles.push({ row: r, col: c });
      continue;
    }

    if (tool === 'build') {
      const structId = options?.structureId ?? 'sprinkler';
      const bp = AUTOMATION_BLUEPRINTS[structId];
      if (!bp) continue;
      if (state.level < bp.unlockLevel) {
        message = `Cần đạt Cấp ${bp.unlockLevel} để lắp ${bp.name}.`;
        lastSound = 'error';
        continue;
      }
      if (structId === 'auto_feeder') {
        if (state.autoFeederOwned) {
          message = 'Chuồng trại đã có Máng Ăn Tự Động rồi!';
          lastSound = 'error';
          continue;
        }
        if (state.gold < bp.goldCost || state.badges < bp.badgeCost) {
          message = `Cần ${bp.goldCost} Vàng & ${bp.badgeCost} Huy Hiệu.`;
          lastSound = 'error';
          continue;
        }
        state.gold -= bp.goldCost;
        state.badges -= bp.badgeCost;
        state.autoFeederOwned = true;
        changed = true;
        lastSound = 'build';
        addEventLog(state, 'Đã lắp Máng Ăn Tự Động cho toàn bộ Chuồng Trại!', 'good');
        affectedTiles.push({ row: r, col: c });
        continue;
      }
      if (tile.structure || tile.crop) {
        message = 'Hãy chọn ô đất trống chưa có cây hoặc máy.';
        lastSound = 'error';
        continue;
      }
      if (state.gold < bp.goldCost || state.badges < bp.badgeCost) {
        message = `Cần ${bp.goldCost} Vàng & ${bp.badgeCost} Huy Hiệu Làng.`;
        lastSound = 'error';
        continue;
      }
      state.gold -= bp.goldCost;
      state.badges -= bp.badgeCost;
      tile.structure = structId;
      tile.tilled = false;
      tile.hasWeed = false;
      totalXp += 20;
      changed = true;
      lastSound = 'build';
      addEventLog(state, `Đã lắp đặt ${bp.name} tại ô (${r + 1}, ${c + 1}).`, 'good');
      affectedTiles.push({ row: r, col: c });
    }
  }

  if (totalXp > 0) {
    grantXpAndGold(state, totalXp, 0);
  }

  return {
    changed,
    message,
    sound: lastSound,
    xpDelta: totalXp,
    hybridUnlocked,
    affectedTiles,
  };
}

export function tryCrossBreedTick(
  state: CloudValleyGameState,
  rng: () => number = Math.random
): { spawnedCropId: string; row: number; col: number; isNewAlmanac: boolean }[] {
  const results: { spawnedCropId: string; row: number; col: number; isNewAlmanac: boolean }[] = [];
  const season = getSeasonId(state);

  for (const tile of state.tiles) {
    if (!isTileUnlocked(state, tile)) continue;
    if (!tile.tilled || tile.crop || tile.structure || tile.hasWeed) continue;
    if (season === 'winter' && !isTileInGreenhouse(state, tile.row, tile.col)) continue;

    // Inspect horizontal and vertical pairs across this empty middle tile, plus 3x3 diagonal/adjacent mature crops
    const pairsToCheck: [TileState | undefined, TileState | undefined][] = [];
    const getNeighbor = (dr: number, dc: number) => {
      const nr = tile.row + dr;
      const nc = tile.col + dc;
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) return undefined;
      return state.tiles[getTileIndex(nr, nc)];
    };

    // Orthogonal opposing pairs across the empty tile: N-S, W-E
    pairsToCheck.push([getNeighbor(-1, 0), getNeighbor(1, 0)]);
    pairsToCheck.push([getNeighbor(0, -1), getNeighbor(0, 1)]);
    // Also L-shaped orthogonal neighbors touching the empty tile
    const ortho = [getNeighbor(-1, 0), getNeighbor(1, 0), getNeighbor(0, -1), getNeighbor(0, 1)];
    for (let i = 0; i < ortho.length; i++) {
      for (let j = i + 1; j < ortho.length; j++) {
        pairsToCheck.push([ortho[i], ortho[j]]);
      }
    }

    let matchedHybridId: string | null = null;
    for (const [a, b] of pairsToCheck) {
      if (!a?.crop || !b?.crop) continue;
      if (!isCropMature(a.crop) || !isCropMature(b.crop)) continue;
      if (a.crop.cropId === b.crop.cropId) continue;

      const recipe = HYBRID_RECIPES.find(
        (rec) =>
          (rec.parentA === a.crop!.cropId && rec.parentB === b.crop!.cropId) ||
          (rec.parentB === a.crop!.cropId && rec.parentA === b.crop!.cropId)
      );
      if (recipe) {
        matchedHybridId = recipe.resultCropId;
        break;
      }
    }

    if (!matchedHybridId) continue;

    const chance = tile.mutagenApplied ? 0.35 : 0.1;
    if (rng() < chance) {
      tile.crop = {
        cropId: matchedHybridId,
        progressSeconds: 0,
        quality: 'gold',
        isHybridMutant: true,
      };
      tile.mutagenApplied = false;
      const isNewAlmanac = unlockAlmanacEntry(state, matchedHybridId);
      const hybridDef = CROPS[matchedHybridId];
      addEventLog(
        state,
        `Đột biến thành công! Mầm Lai ${hybridDef?.name ?? matchedHybridId} vừa nảy mầm!`,
        'good'
      );
      results.push({
        spawnedCropId: matchedHybridId,
        row: tile.row,
        col: tile.col,
        isNewAlmanac,
      });
    }
  }

  return results;
}

function runHazardTick(state: CloudValleyGameState, rng: () => number): void {
  const season = getSeasonId(state);

  for (const tile of state.tiles) {
    if (!isTileUnlocked(state, tile)) continue;
    const protectedByScarecrow = isTileProtectedByScarecrow(state, tile.row, tile.col);

    // 1. Weed spread from existing weed onto empty adjacent tile
    if (tile.hasWeed && rng() < 0.08) {
      const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      const [dr, dc] = dirs[Math.floor(rng() * dirs.length)];
      const nr = tile.row + dr;
      const nc = tile.col + dc;
      if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
        const adj = state.tiles[getTileIndex(nr, nc)];
        if (adj && isTileUnlocked(state, adj) && !adj.crop && !adj.structure && !adj.hasWeed) {
          adj.hasWeed = true;
        }
      }
    }

    // 2. Spontaneous weed on neglected empty soil
    if (!tile.crop && !tile.structure && !tile.hasWeed && season !== 'winter' && rng() < 0.012) {
      tile.hasWeed = true;
    }

    // 3. Pests degrade quality from gold -> normal
    if (tile.crop && !isCropMature(tile.crop) && !tile.hasPest) {
      const pestChance = protectedByScarecrow ? 0.004 : 0.018;
      if (rng() < pestChance) {
        tile.hasPest = true;
        tile.crop.quality = 'normal';
      }
    }

    // 4. Birds peck fresh seeds (<25% grown) if no Scarecrow
    if (tile.crop && !protectedByScarecrow && !tile.crop.isHybridMutant) {
      const def = CROPS[tile.crop.cropId];
      if (def && tile.crop.progressSeconds < def.growthSeconds * 0.25 && rng() < 0.01) {
        tile.crop = null;
        tile.birdPecked = true;
        addEventLog(state, 'Chim sà xuống mổ mất hạt giống! Hãy đặt Bù Nhìn Cơ Khí.', 'warn');
      }
    }
  }
}

function runSpritesAndConveyors(state: CloudValleyGameState): { spriteHarvests: number; conveyorGold: number } {
  let spriteHarvests = 0;
  let conveyorGold = 0;

  // 1. Short Conveyors harvest adjacent mature crops straight to inventory
  for (const tile of state.tiles) {
    if (tile.structure !== 'conveyor' || !isTileUnlocked(state, tile)) continue;
    const adjDirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of adjDirs) {
      const nr = tile.row + dr;
      const nc = tile.col + dc;
      if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
      const target = state.tiles[getTileIndex(nr, nc)];
      if (target && (target.wildMushroom || isCropMature(target.crop))) {
        const res = harvestSingleTile(state, target);
        if (res.harvested) {
          spriteHarvests += res.qty ?? 1;
        }
      }
    }
  }

  // 2. Earth Sprites perform assigned work using cooked food energy
  for (const sprite of state.sprites) {
    if (sprite.energy < 5) {
      // Auto-snack from player's cooked food stock if available
      const mealOrder = ['banh_mi_bo_toi', 'banh_pho_mai_dau', 'sup_bi_nam'] as const;
      for (const mealId of mealOrder) {
        if (consumeInventory(state, mealId, 1)) {
          sprite.energy = Math.min(100, sprite.energy + (ITEMS[mealId]?.spriteEnergyValue ?? 50));
          break;
        }
      }
    }
    if (sprite.energy < 5) continue;

    if (sprite.task === 'harvest') {
      for (const tile of state.tiles) {
        if (!isTileUnlocked(state, tile)) continue;
        if (tile.wildMushroom || isCropMature(tile.crop)) {
          const res = harvestSingleTile(state, tile);
          if (res.harvested) {
            sprite.energy = Math.max(0, sprite.energy - 4);
            spriteHarvests += res.qty ?? 1;
            break;
          }
        }
      }
    } else if (sprite.task === 'sow') {
      const seedDef = CROPS[sprite.assignedSeedId] ?? CROPS.lua_mi;
      const season = getSeasonId(state);
      for (const tile of state.tiles) {
        if (!isTileUnlocked(state, tile)) continue;
        if (!tile.tilled || tile.crop || tile.structure || tile.hasWeed) continue;
        const inGreenhouse = isTileInGreenhouse(state, tile.row, tile.col);
        if (season === 'winter' && !inGreenhouse) continue;
        if (!inGreenhouse && !seedDef.seasons.includes(season)) continue;
        if (state.gold >= seedDef.seedPrice) {
          state.gold -= seedDef.seedPrice;
          tile.crop = { cropId: seedDef.id, progressSeconds: 0, quality: 'gold' };
          sprite.energy = Math.max(0, sprite.energy - 4);
          break;
        }
      }
    } else if (sprite.task === 'feed_machines') {
      // Collect ready artisan items automatically, or queue Windmill / Composter if idle
      let didWork = false;
      for (const slot of state.artisanQueue) {
        if (slot.ready) {
          addInventory(state, slot.outputItemId, slot.outputQty);
          grantXpAndGold(state, slot.xp, 0);
          didWork = true;
        }
      }
      if (didWork) {
        state.artisanQueue = state.artisanQueue.filter((s) => !s.ready);
        sprite.energy = Math.max(0, sprite.energy - 5);
      } else if (state.artisanQueue.length < 4) {
        const autoRec = ARTISAN_RECIPES.find((rec) =>
          rec.inputs.every((inp) => (state.inventory[inp.itemId] ?? 0) >= inp.qty)
        );
        if (autoRec) {
          startArtisanRecipe(state, autoRec.id);
          sprite.energy = Math.max(0, sprite.energy - 6);
        }
      }
    }
  }

  return { spriteHarvests, conveyorGold };
}

export function advanceToNextDay(
  state: CloudValleyGameState,
  rng: () => number = Math.random
): { newSeason: boolean; season: SeasonId } {
  state.timeInDaySeconds = 0;
  state.day += 1;
  state.totalDays += 1;

  let newSeason = false;
  if (state.day > DAYS_PER_SEASON) {
    state.day = 1;
    state.seasonIndex = (state.seasonIndex + 1) % SEASON_ORDER.length;
    newSeason = true;
  }

  const season = getSeasonId(state);
  state.weather = rollWeatherForSeason(season, rng);

  // Age wine in cellar/inventory
  if ((state.inventory.ruou_vang ?? 0) > 0) {
    state.wineAgedDays = Math.min(6, state.wineAgedDays + 1);
  }

  // Morning tile refresh: sprinklers, spring drizzle, winter freeze, fallow fertility recovery, autumn mushrooms
  for (const tile of state.tiles) {
    if (!isTileUnlocked(state, tile)) continue;
    const inGreenhouse = isTileInGreenhouse(state, tile.row, tile.col);

    // Fallow soil recovery (+8% fertility when tilled and empty)
    if (tile.tilled && !tile.crop && !tile.hasWeed) {
      tile.fertility = Math.min(100, tile.fertility + 8);
    }

    // Spring drizzle waters all outdoor plots
    if (state.weather === 'drizzle' && (tile.tilled || tile.crop)) {
      tile.moisture = 100;
    }

    // Winter freeze blocks unprotected outdoor crops
    if (season === 'winter' && !inGreenhouse && tile.crop && !CROPS[tile.crop.cropId]?.selfHydrating) {
      // Non-greenhouse crops wilt in winter freeze unless self-hydrating fire tomato
      tile.moisture = 0;
    }

    // Autumn wild mushrooms spawn along unlocked forest edge (col >= 4 or row >= 4)
    if (
      season === 'autumn' &&
      !tile.crop &&
      !tile.structure &&
      !tile.tilled &&
      !tile.wildMushroom &&
      (tile.row >= 3 || tile.col >= 4) &&
      rng() < 0.14
    ) {
      tile.wildMushroom = true;
    }
  }

  // Auto-Sprinklers water 8 surrounding tiles at dawn
  for (const tile of state.tiles) {
    if (tile.structure !== 'sprinkler' || !isTileUnlocked(state, tile)) continue;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = tile.row + dr;
        const nc = tile.col + dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          const adj = state.tiles[getTileIndex(nr, nc)];
          if (adj && isTileUnlocked(state, adj)) {
            adj.moisture = 100;
          }
        }
      }
    }
  }

  // Refresh livestock feeding & produce
  for (const animal of state.livestock) {
    if (animal.fedToday) {
      animal.productReady = true;
      animal.happiness = Math.min(100, animal.happiness + 5);
    } else {
      animal.happiness = Math.max(20, animal.happiness - 15);
    }
    if (state.autoFeederOwned && consumeInventory(state, 'co_kho', 1)) {
      animal.fedToday = true;
    } else {
      animal.fedToday = false;
    }
  }

  // Countdown Villager Orders and top up
  state.orders = state.orders
    .map((o) => ({ ...o, daysLeft: o.daysLeft - 1 }))
    .filter((o) => o.daysLeft > 0);
  if (state.orders.length < 3) {
    state.orders = [...state.orders, ...generateOrders(state.level, season, state.orders.length, rng)];
  }

  // Day 7 Weekend Fair (Chợ Phiên Cuối Tuần: 2.5x featured item)
  if (state.day === 7) {
    const fairPool = ['banh_mi_bo_toi', 'banh_pho_mai_dau', 'ruou_vang', 'ao_len_cao_cap', 'ca_chua', 'bi_ngo', 'dau_tay'];
    const picked = fairPool[Math.floor(rng() * fairPool.length) % fairPool.length];
    state.weekendFair = {
      itemId: picked,
      multiplier: 2.5,
      maxTrades: 10,
      tradesDone: 0,
    };
    addEventLog(state, `Chợ Phiên Cuối Tuần mở cửa! ${ITEMS[picked]?.name ?? picked} thu mua giá ×2.5!`, 'good');
  } else {
    state.weekendFair = null;
  }

  if (newSeason) {
    addEventLog(state, `Sang mùa mới: ${season === 'spring' ? 'Mùa Xuân' : season === 'summer' ? 'Mùa Hạ' : season === 'autumn' ? 'Mùa Thu' : 'Mùa Đông'}!`, 'info');
  }

  return { newSeason, season };
}

export function tickCloudValleySimulation(
  state: CloudValleyGameState,
  deltaSeconds: number,
  rng: () => number = Math.random
): {
  cropsMatured: number;
  artisanCompleted: number;
  spriteHarvests: number;
  conveyorGold: number;
  hybridsDiscovered: string[];
  daysAdvanced: number;
} {
  const dt = Math.max(0, deltaSeconds);
  let cropsMatured = 0;
  let artisanCompleted = 0;
  let spriteHarvests = 0;
  let conveyorGold = 0;
  const hybridsDiscovered: string[] = [];
  let daysAdvanced = 0;

  const season = getSeasonId(state);

  // 1. Advance tile moisture & crop growth
  for (const tile of state.tiles) {
    if (!isTileUnlocked(state, tile)) continue;
    const inGreenhouse = isTileInGreenhouse(state, tile.row, tile.col);

    // Moisture decay: Summer / heatwave drains 2x faster unless self-hydrating Fire Tomato or Drizzle
    if (tile.crop && CROPS[tile.crop.cropId]?.selfHydrating) {
      tile.moisture = 100;
    } else if (state.weather === 'drizzle') {
      tile.moisture = 100;
    } else if (tile.tilled || tile.crop) {
      const drainRate = season === 'summer' || state.weather === 'heatwave' ? 0.56 : 0.28;
      tile.moisture = Math.max(0, tile.moisture - drainRate * dt);
    }

    // Crop growth
    if (tile.crop) {
      const def = CROPS[tile.crop.cropId];
      if (def && tile.crop.progressSeconds < def.growthSeconds) {
        const frozen = season === 'winter' && !inGreenhouse && !def.selfHydrating;
        if (!frozen && tile.moisture >= 20) {
          let speedMult = 1;
          if (tile.moisture >= 60 && tile.moisture <= 90) {
            speedMult += 0.2; // optimal moisture +20%
          }
          speedMult += getTileAuraBonus(state, tile.row, tile.col);
          const beforeMature = isCropMature(tile.crop);
          tile.crop.progressSeconds = Math.min(def.growthSeconds, tile.crop.progressSeconds + dt * speedMult);
          if (!beforeMature && isCropMature(tile.crop)) {
            cropsMatured += 1;
          }
        }
      }
    }
  }

  // 2. Advance Artisan Machine Queues
  for (const slot of state.artisanQueue) {
    if (slot.ready) continue;
    slot.remainingSeconds = Math.max(0, slot.remainingSeconds - dt);
    if (slot.remainingSeconds <= 0) {
      slot.ready = true;
      artisanCompleted += 1;
    }
  }

  // 3. Cross-breeding mutation check every 15s of sim time
  state.mutationTickAccumulator += dt;
  while (state.mutationTickAccumulator >= 15) {
    state.mutationTickAccumulator -= 15;
    const spawned = tryCrossBreedTick(state, rng);
    for (const s of spawned) {
      if (s.isNewAlmanac) {
        hybridsDiscovered.push(s.spawnedCropId);
      }
    }
  }

  // 4. Random hazards check every 25s
  state.hazardTickAccumulator += dt;
  while (state.hazardTickAccumulator >= 25) {
    state.hazardTickAccumulator -= 25;
    runHazardTick(state, rng);
  }

  // 5. Conveyors & Earth Sprites work every 10s
  state.spriteTickAccumulator += dt;
  while (state.spriteTickAccumulator >= 10) {
    state.spriteTickAccumulator -= 10;
    const work = runSpritesAndConveyors(state);
    spriteHarvests += work.spriteHarvests;
    conveyorGold += work.conveyorGold;
  }

  // 6. Day/Night cycle (240s per day)
  state.timeInDaySeconds += dt;
  while (state.timeInDaySeconds >= DAY_DURATION_SECONDS) {
    state.timeInDaySeconds -= DAY_DURATION_SECONDS;
    advanceToNextDay(state, rng);
    daysAdvanced += 1;
  }

  return {
    cropsMatured,
    artisanCompleted,
    spriteHarvests,
    conveyorGold,
    hybridsDiscovered,
    daysAdvanced,
  };
}

export function processOfflineCatchUp(
  state: CloudValleyGameState,
  nowMs: number,
  rng: () => number = Math.random
): OfflineCatchupReport | null {
  const rawElapsed = Math.max(0, (nowMs - state.lastActiveTimestamp) / 1000);
  if (rawElapsed < 60) {
    state.lastActiveTimestamp = nowMs;
    return null;
  }
  const cappedElapsed = Math.min(rawElapsed, MAX_OFFLINE_SECONDS);
  const report: OfflineCatchupReport = {
    elapsedSeconds: Math.round(cappedElapsed),
    daysAdvanced: 0,
    cropsMatured: 0,
    spriteHarvests: 0,
    artisanCompleted: 0,
    hybridsDiscovered: [],
    goldEarnedByConveyors: 0,
  };

  let remaining = cappedElapsed;
  while (remaining > 0) {
    const step = Math.min(OFFLINE_STEP_SECONDS, remaining);
    const res = tickCloudValleySimulation(state, step, rng);
    report.cropsMatured += res.cropsMatured;
    report.artisanCompleted += res.artisanCompleted;
    report.spriteHarvests += res.spriteHarvests;
    report.goldEarnedByConveyors += res.conveyorGold;
    report.daysAdvanced += res.daysAdvanced;
    for (const h of res.hybridsDiscovered) {
      if (!report.hybridsDiscovered.includes(h)) report.hybridsDiscovered.push(h);
    }
    remaining -= step;
  }

  state.lastActiveTimestamp = nowMs;
  return report;
}

export function unlockTerrace(state: CloudValleyGameState, terraceId: number): { ok: boolean; message: string } {
  if (state.unlockedTerraces.includes(terraceId)) {
    return { ok: false, message: 'Tầng ruộng này đã mở khóa.' };
  }
  const def = TERRACES.find((t) => t.id === terraceId);
  if (!def) return { ok: false, message: 'Không tìm thấy tầng ruộng.' };
  if (state.level < def.minLevel) {
    return { ok: false, message: `Cần đạt Cấp ${def.minLevel} để mở ${def.name}.` };
  }
  if (state.gold < def.costGold) {
    return { ok: false, message: `Cần ${def.costGold} Vàng để mở rộng ruộng.` };
  }
  state.gold -= def.costGold;
  state.unlockedTerraces = [...state.unlockedTerraces, terraceId];
  grantXpAndGold(state, 45, 0);
  addEventLog(state, `Đã khai phá ${def.name}!`, 'good');
  return { ok: true, message: `Mở khóa ${def.name} thành công!` };
}

export function upgradeToolTier(state: CloudValleyGameState): { ok: boolean; message: string } {
  const nextTier: Exclude<ToolTier, 'wood'> | null =
    state.toolTier === 'wood' ? 'copper' : state.toolTier === 'copper' ? 'iron' : null;
  if (!nextTier) return { ok: false, message: 'Công cụ đã đạt cấp tối đa (Sắt 3×3).' };
  const cost = TOOL_UPGRADE_COSTS[nextTier];
  if (state.level < cost.minLevel) {
    return { ok: false, message: `Cần Cấp ${cost.minLevel} để rèn ${cost.label}.` };
  }
  if (state.gold < cost.gold) {
    return { ok: false, message: `Cần ${cost.gold} Vàng để nâng cấp ${cost.label}.` };
  }
  state.gold -= cost.gold;
  state.toolTier = nextTier;
  addEventLog(state, `Nâng cấp ${cost.label}: ${cost.areaText}!`, 'good');
  return { ok: true, message: `Đã nâng cấp lên ${cost.label}!` };
}

export function startArtisanRecipe(state: CloudValleyGameState, recipeId: string): { ok: boolean; message: string } {
  const recipe = ARTISAN_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { ok: false, message: 'Công thức không tồn tại.' };
  if (state.level < recipe.unlockLevel) {
    return { ok: false, message: `Cần Cấp ${recipe.unlockLevel} để chế biến ${recipe.name}.` };
  }
  if (state.artisanQueue.length >= 8) {
    return { ok: false, message: 'Xưởng chế biến đang đầy (tối đa 8 mẻ).' };
  }
  for (const inp of recipe.inputs) {
    if ((state.inventory[inp.itemId] ?? 0) < inp.qty) {
      return { ok: false, message: `Thiếu nguyên liệu: ${ITEMS[inp.itemId]?.name ?? inp.itemId}.` };
    }
  }
  for (const inp of recipe.inputs) {
    consumeInventory(state, inp.itemId, inp.qty);
  }
  state.artisanQueue.push({
    uid: `art_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    recipeId: recipe.id,
    machineId: recipe.machineId,
    remainingSeconds: recipe.durationSeconds,
    totalSeconds: recipe.durationSeconds,
    outputItemId: recipe.outputItemId,
    outputQty: recipe.outputQty,
    xp: recipe.xp,
    ready: false,
  });
  return { ok: true, message: `Đang chế biến ${recipe.name}...` };
}

export function collectArtisanSlot(state: CloudValleyGameState, uid: string): boolean {
  const slot = state.artisanQueue.find((s) => s.uid === uid && s.ready);
  if (!slot) return false;
  addInventory(state, slot.outputItemId, slot.outputQty);
  grantXpAndGold(state, slot.xp, 0);
  state.artisanQueue = state.artisanQueue.filter((s) => s.uid !== uid);
  return true;
}

export function sellInventoryItem(state: CloudValleyGameState, itemId: string, qty = 1): { ok: boolean; earned: number } {
  if (!consumeInventory(state, itemId, qty)) return { ok: false, earned: 0 };
  const unitPrice = getSellPrice(state, itemId);
  const earned = unitPrice * qty;
  grantXpAndGold(state, 0, earned);
  if (itemId === 'ruou_vang' && (state.inventory.ruou_vang ?? 0) === 0) {
    state.wineAgedDays = 0;
  }
  return { ok: true, earned };
}

export function buyItemFromMarket(state: CloudValleyGameState, itemId: string, qty = 1): { ok: boolean; message: string } {
  const item = ITEMS[itemId];
  if (!item) return { ok: false, message: 'Vật phẩm không tồn tại.' };
  const unitCost = Math.round(item.sellPrice * 1.4);
  const totalCost = unitCost * qty;
  if (state.gold < totalCost) {
    return { ok: false, message: `Cần ${totalCost} Vàng.` };
  }
  state.gold -= totalCost;
  addInventory(state, itemId, qty);
  return { ok: true, message: `Đã mua ${qty} ${item.name}.` };
}

export function fulfillVillagerOrder(state: CloudValleyGameState, orderId: string): { ok: boolean; message: string } {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Đơn hàng đã hết hạn.' };
  if (!consumeInventory(state, order.itemId, order.qty)) {
    return { ok: false, message: `Chưa đủ ${order.qty} ${ITEMS[order.itemId]?.name ?? order.itemId}.` };
  }
  state.badges += order.rewardBadges;
  grantXpAndGold(state, order.rewardXp, order.rewardGold);
  state.orders = state.orders.filter((o) => o.id !== orderId);
  addEventLog(state, `Giao đơn ${order.villagerName}: +${order.rewardGold} Vàng & +${order.rewardBadges} Huy Hiệu!`, 'good');
  return { ok: true, message: `Hoàn thành đơn! +${order.rewardGold} Vàng` };
}

export function tradeWeekendFair(state: CloudValleyGameState, qty = 1): { ok: boolean; message: string; earned: number } {
  if (!state.weekendFair) return { ok: false, message: 'Chợ Phiên chỉ mở vào Ngày 7 mỗi tuần!', earned: 0 };
  if (state.weekendFair.tradesDone >= state.weekendFair.maxTrades) {
    return { ok: false, message: 'Thương nhân Chợ Phiên đã gom đủ số lượng hôm nay.', earned: 0 };
  }
  const canTradeQty = Math.min(qty, state.weekendFair.maxTrades - state.weekendFair.tradesDone);
  if (!consumeInventory(state, state.weekendFair.itemId, canTradeQty)) {
    return { ok: false, message: 'Kho không đủ mặt hàng đặc biệt Chợ Phiên.', earned: 0 };
  }
  const unitPrice = Math.round(getSellPrice(state, state.weekendFair.itemId) * state.weekendFair.multiplier);
  const earned = unitPrice * canTradeQty;
  state.weekendFair.tradesDone += canTradeQty;
  grantXpAndGold(state, canTradeQty * 12, earned);
  return { ok: true, message: `Bán Chợ Phiên ×2.5 thu về ${earned} Vàng!`, earned };
}

export function buySeedPack(state: CloudValleyGameState, seedId: string, qty = 1): { ok: boolean; message: string } {
  const def = CROPS[seedId];
  if (!def || def.seedPrice <= 0) return { ok: false, message: 'Loại hạt giống này không bán.' };
  if (state.level < def.unlockLevel) {
    return { ok: false, message: `Cần đạt Cấp ${def.unlockLevel} để mua hạt ${def.name}.` };
  }
  const cost = def.seedPrice * qty;
  if (state.gold < cost) {
    return { ok: false, message: `Cần ${cost} Vàng để mua ${qty} hạt ${def.name}.` };
  }
  state.gold -= cost;
  if (!state.seedBags) state.seedBags = {};
  state.seedBags[seedId] = (state.seedBags[seedId] ?? 0) + qty;
  return { ok: true, message: `Đã mua ${qty} hạt ${def.name} vào túi!` };
}

export function drawWellWater(state: CloudValleyGameState): { wateredCount: number; message: string } {
  let wateredCount = 0;
  for (const tile of state.tiles) {
    if (!isTileUnlocked(state, tile)) continue;
    if ((tile.tilled || tile.crop) && tile.moisture < 100) {
      tile.moisture = Math.min(100, tile.moisture + 30);
      wateredCount += 1;
    }
  }
  grantXpAndGold(state, 3, 0);
  return {
    wateredCount,
    message:
      wateredCount > 0
        ? `Múc nước Giếng Mây tưới mát ${wateredCount} luống đất (+30% ẩm)!`
        : 'Nước giếng trong vắt mát lành! Toàn bộ luống đang đủ ẩm.',
  };
}

export function buyLivestock(state: CloudValleyGameState, type: LivestockType): { ok: boolean; message: string } {
  if (state.livestock.length >= 6) return { ok: false, message: 'Chuồng trại đã đủ 6 vật nuôi.' };
  const cost = type === 'chicken' ? 140 : type === 'cow' ? 220 : 260;
  const minLevel = type === 'sheep' ? 3 : 1;
  if (state.level < minLevel) return { ok: false, message: `Cần Cấp ${minLevel} để nuôi Cừu.` };
  if (state.gold < cost) return { ok: false, message: `Cần ${cost} Vàng.` };
  state.gold -= cost;
  const label = type === 'chicken' ? 'Gà Mái' : type === 'cow' ? 'Bò Sữa' : 'Cừu Mây';
  state.livestock.push({
    id: `${type}_${Date.now().toString(36)}`,
    type,
    name: `${label} #${state.livestock.length + 1}`,
    fedToday: false,
    productReady: false,
    happiness: 85,
  });
  return { ok: true, message: `Đã đón ${label} về chuồng!` };
}

export function tendLivestock(state: CloudValleyGameState, animalId: string): { ok: boolean; message: string } {
  const animal = state.livestock.find((a) => a.id === animalId);
  if (!animal) return { ok: false, message: 'Không tìm thấy vật nuôi.' };
  if (animal.productReady) {
    animal.productReady = false;
    const prodId = animal.type === 'chicken' ? 'trung_ga' : animal.type === 'cow' ? 'sua_bo' : 'long_cuu';
    addInventory(state, prodId, 1);
    grantXpAndGold(state, 16, 0);
    return { ok: true, message: `Thu hoạch 1 ${ITEMS[prodId].name}!` };
  }
  if (!animal.fedToday) {
    if (!consumeInventory(state, 'co_kho', 1)) {
      return { ok: false, message: 'Hết Cỏ Khô! Hãy mua ở Quầy Lái Buôn.' };
    }
    animal.fedToday = true;
    animal.happiness = Math.min(100, animal.happiness + 10);
    return { ok: true, message: `Đã cho ${animal.name} ăn no!` };
  }
  return { ok: false, message: `${animal.name} đã ăn no hôm nay, ngày mai sẽ có sản phẩm.` };
}

export function summonEarthSprite(state: CloudValleyGameState, task: SpriteTask = 'harvest'): { ok: boolean; message: string } {
  if (state.sprites.length >= 4) return { ok: false, message: 'Tối đa 4 Tinh Linh Đất trên thung lũng.' };
  const costGold = 240 + state.sprites.length * 140;
  const costBadges = 2;
  if (state.level < 4 && state.sprites.length > 0) {
    return { ok: false, message: 'Cần Cấp 4 để triệu hồi thêm Tinh Linh.' };
  }
  if (state.gold < costGold || state.badges < costBadges) {
    return { ok: false, message: `Cần ${costGold} Vàng & ${costBadges} Huy Hiệu Làng.` };
  }
  state.gold -= costGold;
  state.badges -= costBadges;
  const spriteNames = ['Mầm Non', 'Sương Mai', 'Gió Nhẹ', 'Hạt Dẻ'];
  state.sprites.push({
    id: `sprite_${Date.now().toString(36)}_${state.sprites.length}`,
    name: spriteNames[state.sprites.length % spriteNames.length],
    task,
    energy: 100,
    assignedSeedId: 'lua_mi',
    lastActionTick: 0,
  });
  addEventLog(state, 'Triệu hồi Tinh Linh Đất thành công!', 'good');
  return { ok: true, message: 'Đã triệu hồi Tinh Linh Đất!' };
}

export function feedSprite(state: CloudValleyGameState, spriteId: string, mealId: string): { ok: boolean; message: string } {
  const sprite = state.sprites.find((s) => s.id === spriteId);
  const meal = ITEMS[mealId];
  if (!sprite || !meal?.spriteEnergyValue) return { ok: false, message: 'Món ăn không hợp lệ.' };
  if (!consumeInventory(state, mealId, 1)) {
    return { ok: false, message: `Không có ${meal.name} trong kho.` };
  }
  sprite.energy = Math.min(100, sprite.energy + meal.spriteEnergyValue);
  return { ok: true, message: `Đã tiếp +${meal.spriteEnergyValue} năng lượng cho ${sprite.name}!` };
}

export function serializeSaveState(state: CloudValleyGameState): string {
  return JSON.stringify(state, null, 2);
}

export function parseSaveState(rawJson: string): CloudValleyGameState | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<CloudValleyGameState>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tiles) || parsed.tiles.length !== GRID_ROWS * GRID_COLS) {
      return null;
    }
    if (typeof parsed.gold !== 'number' || typeof parsed.level !== 'number' || typeof parsed.day !== 'number') {
      return null;
    }
    const base = createInitialCloudValleyState();
    return {
      ...base,
      ...parsed,
      tiles: parsed.tiles.map((t, idx) => ({
        ...base.tiles[idx],
        ...t,
      })),
      inventory: { ...parsed.inventory },
      seedBags: parsed.seedBags && typeof parsed.seedBags === 'object' ? { ...parsed.seedBags } : { ...base.seedBags },
      farmerProfile:
        parsed.farmerProfile && typeof parsed.farmerProfile === 'object'
          ? { ...base.farmerProfile, ...parsed.farmerProfile }
          : { ...base.farmerProfile },
      almanacUnlocked: Array.isArray(parsed.almanacUnlocked) ? parsed.almanacUnlocked : base.almanacUnlocked,
      artisanQueue: Array.isArray(parsed.artisanQueue) ? parsed.artisanQueue : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      livestock: Array.isArray(parsed.livestock) ? parsed.livestock : [],
      sprites: Array.isArray(parsed.sprites) ? parsed.sprites : [],
      unlockedTerraces: Array.isArray(parsed.unlockedTerraces) ? parsed.unlockedTerraces : [1],
      events: Array.isArray(parsed.events) ? parsed.events : base.events,
    };
  } catch {
    return null;
  }
}
