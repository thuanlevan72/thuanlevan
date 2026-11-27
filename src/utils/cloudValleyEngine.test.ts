import assert from 'node:assert/strict';
import test from 'node:test';
import { CROPS, DAY_DURATION_SECONDS, MAX_OFFLINE_SECONDS } from './cloudValleyData.ts';
import {
  advanceToNextDay,
  applyToolAction,
  buyLivestock,
  buySeedPack,
  createInitialCloudValleyState,
  drawWellWater,
  fulfillVillagerOrder,
  getSellPrice,
  getTileIndex,
  isCropMature,
  parseSaveState,
  processOfflineCatchUp,
  serializeSaveState,
  startArtisanRecipe,
  summonEarthSprite,
  tendLivestock,
  tickCloudValleySimulation,
  tradeWeekendFair,
  tryCrossBreedTick,
  unlockTerrace,
  upgradeToolTier,
} from './cloudValleyEngine.ts';
import {
  createInitialAvatarState,
  detectInteractTarget,
  getAnimalWorldPos,
  resolveSmartToolForTile,
  stepAvatarMovement,
  tileToWorldBounds,
} from './cloudValleyWorld.ts';

test('Soil moisture <20% halts growth and 60-90% grants +20% speed', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  s.weather = 'sunny';
  const tDry = s.tiles[getTileIndex(0, 0)];
  tDry.tilled = true;
  tDry.moisture = 10;
  tDry.crop = { cropId: 'lua_mi', progressSeconds: 0, quality: 'gold' };

  const tOptimal = s.tiles[getTileIndex(0, 1)];
  tOptimal.tilled = true;
  tOptimal.moisture = 75;
  tOptimal.crop = { cropId: 'lua_mi', progressSeconds: 0, quality: 'gold' };

  tickCloudValleySimulation(s, 10, () => 0.99);

  assert.equal(tDry.crop.progressSeconds, 0, 'Crop below 20% moisture must halt growth');
  assert.ok(
    Math.abs(tOptimal.crop.progressSeconds - 12) < 0.01,
    `Optimal moisture should advance at +20% (12s for 10s dt), got ${tOptimal.crop.progressSeconds}`
  );
});

test('Fertility decreases -15% on harvest, halves yield at 0%, and recovers via legumes/compost', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  const t = s.tiles[getTileIndex(0, 0)];
  t.tilled = true;
  t.fertility = 15;
  t.crop = { cropId: 'lua_mi', progressSeconds: CROPS.lua_mi.growthSeconds, quality: 'normal' };

  const res1 = applyToolAction(s, 'harvest', 0, 0);
  assert.equal(res1.changed, true);
  assert.equal(t.fertility, 0, 'Fertility should drop from 15 to 0');

  // Re-plant mature crop on 0% fertility -> halved yield (2 -> 1)
  t.crop = { cropId: 'lua_mi', progressSeconds: CROPS.lua_mi.growthSeconds, quality: 'normal' };
  const beforeWheat = s.inventory.lua_mi ?? 0;
  applyToolAction(s, 'harvest', 0, 0);
  assert.equal((s.inventory.lua_mi ?? 0) - beforeWheat, 1, '0% fertility must halve harvest yield');

  // Apply organic compost (+35%) and harvest legume Dau Ha Lan (+22%)
  applyToolAction(s, 'compost', 0, 0);
  assert.equal(t.fertility, 35);
  t.crop = { cropId: 'dau_ha_lan', progressSeconds: CROPS.dau_ha_lan.growthSeconds, quality: 'normal' };
  applyToolAction(s, 'harvest', 0, 0);
  assert.equal(t.fertility, 57, 'Legume harvest should restore +22% fertility');
});

test('Cross-breeding spawns Ca Chua Lua (10% base, 35% with mutagen) and Lua Mach Tim aura boosts neighbors', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  s.weather = 'sunny';
  // Setup mature Ca Chua at (0,0) and mature Ot Chuong at (0,2), empty tilled tile at (0,1)
  const left = s.tiles[getTileIndex(0, 0)];
  const mid = s.tiles[getTileIndex(0, 1)];
  const right = s.tiles[getTileIndex(0, 2)];
  left.tilled = true;
  mid.tilled = true;
  right.tilled = true;
  left.crop = { cropId: 'ca_chua', progressSeconds: CROPS.ca_chua.growthSeconds, quality: 'gold' };
  right.crop = { cropId: 'ot_chuong', progressSeconds: CROPS.ot_chuong.growthSeconds, quality: 'gold' };
  mid.crop = null;

  // At rng=0.25 without mutagen (10%), should NOT spawn
  const none = tryCrossBreedTick(s, () => 0.25);
  assert.equal(none.length, 0);

  // With mutagen (35%), rng=0.25 SHOULD spawn Ca Chua Lua
  mid.mutagenApplied = true;
  const spawned = tryCrossBreedTick(s, () => 0.25);
  assert.equal(spawned.length, 1);
  assert.equal(spawned[0].spawnedCropId, 'ca_chua_lua');
  const updatedMid = s.tiles[getTileIndex(0, 1)];
  assert.equal(updatedMid.crop?.cropId, 'ca_chua_lua');
  assert.ok(s.almanacUnlocked.includes('ca_chua_lua'));

  // Ca Chua Lua stays at 100% moisture even after tick
  mid.moisture = 20;
  tickCloudValleySimulation(s, 20, () => 0.99);
  assert.equal(mid.moisture, 100, 'Fire Tomato must self-hydrate to 100%');

  // Lua Mach Tim aura (+15%) around (2,2) boosts neighbor (2,3)
  const auraCenter = s.tiles[getTileIndex(2, 2)];
  auraCenter.tilled = true;
  auraCenter.crop = { cropId: 'lua_mach_tim', progressSeconds: CROPS.lua_mach_tim.growthSeconds, quality: 'gold' };
  const neighbor = s.tiles[getTileIndex(2, 3)];
  neighbor.tilled = true;
  neighbor.moisture = 50; // outside 60-90 bonus so only aura (+15%) applies
  neighbor.crop = { cropId: 'lua_mi', progressSeconds: 0, quality: 'gold' };

  tickCloudValleySimulation(s, 10, () => 0.99);
  assert.ok(
    Math.abs(neighbor.crop.progressSeconds - 11.5) < 0.01,
    `Lua Mach Tim aura should give +15% (11.5s), got ${neighbor.crop.progressSeconds}`
  );
});

test('3-tier artisan chain + wine cellar aging + Weekend Fair 2.5x + Villager Orders', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  s.level = 5;
  s.inventory.sua_bo = 2;
  s.inventory.lua_mi = 4;

  assert.equal(startArtisanRecipe(s, 'rec_bot_mi').ok, true);
  assert.equal(startArtisanRecipe(s, 'rec_bo_tuoi').ok, true);

  tickCloudValleySimulation(s, 60, () => 0.99);
  assert.equal(s.artisanQueue.every((slot) => slot.ready), true);

  // Collect flour + butter -> bake Garlic Butter Bread (Tier 3)
  s.artisanQueue.forEach((slot) => {
    if (slot.ready) {
      s.inventory[slot.outputItemId] = (s.inventory[slot.outputItemId] ?? 0) + slot.outputQty;
    }
  });
  s.artisanQueue = [];
  const breadStart = startArtisanRecipe(s, 'rec_banh_mi_bo_toi');
  assert.equal(breadStart.ok, true);

  // Wine aging increases sell price over days
  s.inventory.ruou_vang = 1;
  const baseWine = getSellPrice(s, 'ruou_vang');
  advanceToNextDay(s, () => 0.5);
  const agedWine = getSellPrice(s, 'ruou_vang');
  assert.ok(agedWine > baseWine, 'Wine aged in cellar must increase in value');

  // Day 7 Weekend Fair buys at 2.5x
  s.day = 6;
  advanceToNextDay(s, () => 0.1);
  assert.equal(s.day, 7);
  assert.ok(s.weekendFair !== null);
  const fairItem = s.weekendFair!.itemId;
  s.inventory[fairItem] = 2;
  const goldBefore = s.gold;
  const fairRes = tradeWeekendFair(s, 1);
  assert.equal(fairRes.ok, true);
  assert.equal(s.gold - goldBefore, Math.round(getSellPrice(s, fairItem) * 2.5));

  // Order fulfillment awards Gold + Badges
  const ord = s.orders[0];
  s.inventory[ord.itemId] = ord.qty;
  const badgesBefore = s.badges;
  assert.equal(fulfillVillagerOrder(s, ord.id).ok, true);
  assert.equal(s.badges, badgesBefore + ord.rewardBadges);
});

test('Winter freezes outdoor crops while Greenhouse protects, and Copper/Iron upgrades expand tool area', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  s.seasonIndex = 3; // winter
  s.weather = 'snow';
  s.level = 7;
  s.gold = 2000;
  s.badges = 10;

  // Outdoor winter planting blocked
  applyToolAction(s, 'hoe', 0, 0);
  const outdoorFail = applyToolAction(s, 'seed', 0, 0, { seedId: 'lua_mi' });
  assert.equal(outdoorFail.changed, false);

  // Build greenhouse at (0,2), protecting (0,1), (0,2), (0,3), (1,2)
  const ghBuild = applyToolAction(s, 'build', 0, 2, { structureId: 'greenhouse' });
  assert.equal(ghBuild.changed, true);
  applyToolAction(s, 'hoe', 0, 1);
  const insideOk = applyToolAction(s, 'seed', 0, 1, { seedId: 'lua_mi' });
  assert.equal(insideOk.changed, true, 'Greenhouse must permit winter planting');

  // Giant Pumpkin matures in 3 days (720s) and yields 10
  s.seasonIndex = 2; // autumn
  const gpTile = s.tiles[getTileIndex(2, 1)];
  gpTile.crop = { cropId: 'bi_khong_lo', progressSeconds: CROPS.bi_khong_lo.growthSeconds, quality: 'normal' };
  assert.equal(isCropMature(gpTile.crop), true);
  const prevPumpkins = s.inventory.bi_khong_lo ?? 0;
  applyToolAction(s, 'harvest', 2, 1);
  assert.equal((s.inventory.bi_khong_lo ?? 0) - prevPumpkins, 10);

  // Upgrade tools to Copper (1x3) then Iron (3x3)
  assert.equal(upgradeToolTier(s).ok, true);
  assert.equal(s.toolTier, 'copper');
  assert.equal(upgradeToolTier(s).ok, true);
  assert.equal(s.toolTier, 'iron');

  // Iron hoe & water act on 3x3 tiles at once
  const tillRes = applyToolAction(s, 'hoe', 2, 0);
  assert.ok(tillRes.affectedTiles.length >= 4);
  const waterRes = applyToolAction(s, 'water', 2, 2);
  assert.ok(waterRes.affectedTiles.length >= 6);
});

test('Offline catch-up simulation caps at 12h, advances days/crops/sprites, and round-trips JSON save', () => {
  const now = 10_000_000;
  const s = createInitialCloudValleyState(now, () => 0.5);
  s.level = 8;
  s.gold = 2000;
  s.badges = 6;
  assert.equal(summonEarthSprite(s, 'harvest').ok, true);
  assert.equal(unlockTerrace(s, 2).ok, true);

  // Simulate 20 hours offline (should cap cleanly at 12h = 43200s)
  const twentyHoursMs = 20 * 3600 * 1000;
  const report = processOfflineCatchUp(s, now + twentyHoursMs, () => 0.5);
  assert.ok(report !== null);
  assert.equal(report!.elapsedSeconds, MAX_OFFLINE_SECONDS);
  assert.equal(report!.daysAdvanced, Math.floor(MAX_OFFLINE_SECONDS / DAY_DURATION_SECONDS));

  // Save serialization round-trip
  const json = serializeSaveState(s);
  const restored = parseSaveState(json);
  assert.ok(restored !== null);
  assert.equal(restored!.gold, s.gold);
  assert.equal(restored!.tiles.length, s.tiles.length);
  assert.deepEqual(restored!.unlockedTerraces, s.unlockedTerraces);
});

test('Avatar movement collides with buildings, slides cleanly, and detects nearby targets', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  const avatar = createInitialAvatarState();
  const startY = avatar.y;

  // Spawn is unobstructed and moves down smoothly
  const movedDown = stepAvatarMovement(avatar, 0, 1, 0.25);
  assert.equal(movedDown, true);
  assert.equal(avatar.facing, 'down');
  assert.ok(avatar.y > startY);

  // Move right into the well wall (x: 7.0..8.6, y: 2.1..3.55)
  avatar.x = 7.8;
  avatar.y = 3.9;
  for (let i = 0; i < 10; i++) {
    stepAvatarMovement(avatar, 0, -1, 0.1);
  }
  assert.ok(avatar.y >= 3.55, `Avatar must stop outside solid well bounds, got y=${avatar.y}`);

  // Detect merchant building when standing in front of merchant stall
  avatar.x = 11.6;
  avatar.y = 4.1;
  const merchantTarget = detectInteractTarget(s, avatar, 'lua_mi', 0);
  assert.equal(merchantTarget?.kind, 'building');
  if (merchantTarget?.kind === 'building') {
    assert.equal(merchantTarget.buildingId, 'merchant');
  }

  // Detect smart tile action when standing above mature crop at (1,1)
  const t11 = s.tiles[getTileIndex(1, 1)];
  t11.crop = { cropId: 'lua_mi', progressSeconds: CROPS.lua_mi.growthSeconds, quality: 'gold' };
  const b11 = tileToWorldBounds(1, 1);
  avatar.x = b11.cx;
  avatar.y = b11.cy - 0.65;
  avatar.facing = 'down';
  const cropTarget = detectInteractTarget(s, avatar, 'lua_mi', 0);
  assert.equal(cropTarget?.kind, 'tile');
  if (cropTarget?.kind === 'tile') {
    assert.equal(cropTarget.smartTool, 'harvest');
  }

  // Detect smart tool resolution for untilled soil -> hoe
  assert.equal(resolveSmartToolForTile(s.tiles[getTileIndex(0, 3)]), 'hoe');

  // Detect livestock when standing next to starter animal
  const animalPos = getAnimalWorldPos(0, 0);
  avatar.x = animalPos.x - 0.4;
  avatar.y = animalPos.y;
  const animalTarget = detectInteractTarget(s, avatar, 'lua_mi', 0);
  assert.equal(animalTarget?.kind, 'animal');
});

test('Seed bags, chicken egg production, and well water splash behave accurately', () => {
  const s = createInitialCloudValleyState(1000, () => 0.5);
  s.gold = 500;
  const bagBefore = s.seedBags.lua_mi ?? 0;

  // Buy +5 lua_mi seeds into bag
  const buyPack = buySeedPack(s, 'lua_mi', 5);
  assert.equal(buyPack.ok, true);
  assert.equal(s.seedBags.lua_mi, bagBefore + 5);
  assert.equal(s.gold, 500 - CROPS.lua_mi.seedPrice * 5);

  // Planting consumes from seedBag before spending gold
  const goldAfterBuy = s.gold;
  const emptyTile = s.tiles[getTileIndex(1, 3)];
  emptyTile.tilled = true;
  const sowRes = applyToolAction(s, 'seed', 1, 3, { seedId: 'lua_mi' });
  assert.equal(sowRes.changed, true);
  assert.equal(s.seedBags.lua_mi, bagBefore + 4);
  assert.equal(s.gold, goldAfterBuy);

  // Chicken purchase & egg harvest after advancing a day
  const livestockCountBefore = s.livestock.length;
  const chickenRes = buyLivestock(s, 'chicken');
  assert.equal(chickenRes.ok, true);
  assert.equal(s.livestock.length, livestockCountBefore + 1);
  const newChicken = s.livestock[s.livestock.length - 1];
  assert.equal(newChicken.type, 'chicken');

  s.inventory.co_kho = 5;
  assert.equal(tendLivestock(s, newChicken.id).ok, true); // feed today
  advanceToNextDay(s, () => 0.5);
  assert.equal(newChicken.productReady, true);
  const eggsBefore = s.inventory.trung_ga ?? 0;
  assert.equal(tendLivestock(s, newChicken.id).ok, true);
  assert.equal((s.inventory.trung_ga ?? 0) - eggsBefore, 1);

  // Well water adds +30% moisture to unlocked tilled plots
  const dryTilled = s.tiles[getTileIndex(1, 3)];
  dryTilled.moisture = 20;
  const wellRes = drawWellWater(s);
  assert.ok(wellRes.wateredCount >= 1);
  assert.equal(dryTilled.moisture, 50);
});

