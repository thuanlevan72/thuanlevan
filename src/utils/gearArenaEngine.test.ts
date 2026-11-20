import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_GHOST_BUILDS,
  canPlaceGearItem,
  createStarterBackpack,
  evaluateBackpackSynergies,
  GEAR_ARENA_MODES,
  GEAR_CATALOG,
  getArenaWaveStage,
  getGearCatalogEntry,
  getModeRoundReward,
  getRotatedDimensions,
  ghostGridToPlacedGears,
  GRID_SIZE,
  parseGhostBuildJson,
  rollShopOffers,
  serializeGhostBuild,
  type PlacedGear,
} from './gearArenaEngine';

test('polyomino rotation swaps dimensions and placement checks bounds & overlap', () => {
  const baseDim = getRotatedDimensions('grenade_launcher', 0);
  const rotDim = getRotatedDimensions('grenade_launcher', 90);
  assert.deepEqual(baseDim, { width: 1, height: 2 });
  assert.deepEqual(rotDim, { width: 2, height: 1 });

  const starter = createStarterBackpack(); // (1,2) 1x1 and (2,1) 1x2
  assert.equal(canPlaceGearItem(starter, 'pulse_laser', 1, 2, 0), false); // overlaps laser
  assert.equal(canPlaceGearItem(starter, 'pulse_laser', 2, 2, 0), false); // overlaps bottom cell of chain_saw
  assert.equal(canPlaceGearItem(starter, 'homing_missile', 4, 0, 0), false); // out of 5x5 bounds (width 2 at col 4)
  assert.equal(canPlaceGearItem(starter, 'homing_missile', 0, 0, 0), true);
  assert.equal(canPlaceGearItem(starter, 'grenade_launcher', 0, 0, 0), true);
  assert.equal(canPlaceGearItem(starter, 'pulse_laser', GRID_SIZE - 1, GRID_SIZE - 1, 0), true);
});

test('Overclock Core doubles fire rate (x2.0) of adjacent Grenade Launcher', () => {
  const grenadeEntry = getGearCatalogEntry('grenade_launcher');
  const soloGrid: PlacedGear[] = [
    { uid: 'g1', itemId: 'grenade_launcher', col: 1, row: 1, rotation: 0 },
  ];
  const soloEval = evaluateBackpackSynergies(soloGrid);
  assert.equal(soloEval.weapons.length, 1);
  assert.equal(soloEval.weapons[0].fireRateMult, 1);
  assert.equal(soloEval.weapons[0].overclocked, false);

  const overclockedGrid: PlacedGear[] = [
    { uid: 'g1', itemId: 'grenade_launcher', col: 1, row: 1, rotation: 0 },
    { uid: 'oc1', itemId: 'overclock_core', col: 2, row: 1, rotation: 0 },
  ];
  const boostedEval = evaluateBackpackSynergies(overclockedGrid);
  assert.equal(boostedEval.overclockedCount, 1);
  assert.equal(boostedEval.weapons[0].overclocked, true);
  assert.equal(boostedEval.weapons[0].fireRateMult, 2);
  assert.equal(
    boostedEval.weapons[0].fireRate,
    Number(((grenadeEntry.baseFireRate ?? 1) * 2).toFixed(2))
  );
  assert.ok(boostedEval.totalDps >= soloEval.totalDps * 1.9);
});

test('Nuclear Battery + Conductor Wire circuit across >= 3 weapons activates Chain Lightning', () => {
  const twoWeaponGrid: PlacedGear[] = [
    { uid: 'bat', itemId: 'nuclear_battery', col: 0, row: 2, rotation: 0 },
    { uid: 'wire', itemId: 'conductor_wire', col: 1, row: 2, rotation: 0 },
    { uid: 'w1', itemId: 'pulse_laser', col: 1, row: 1, rotation: 0 },
    { uid: 'w2', itemId: 'pulse_laser', col: 2, row: 2, rotation: 0 },
  ];
  const partialEval = evaluateBackpackSynergies(twoWeaponGrid);
  assert.equal(partialEval.energizedWeaponCount, 2);
  assert.equal(partialEval.chainLightningActive, false);

  const threeWeaponGrid: PlacedGear[] = [
    ...twoWeaponGrid,
    { uid: 'w3', itemId: 'chain_saw', col: 1, row: 3, rotation: 90 },
  ];
  const fullEval = evaluateBackpackSynergies(threeWeaponGrid);
  assert.equal(fullEval.energizedWeaponCount, 3);
  assert.equal(fullEval.chainLightningActive, true);
  assert.ok(fullEval.weapons.every((w) => w.chainLightning));
});

test('all 10 built-in Ghost PvP presets are valid non-overlapping 5x5 JSON builds and round-trip cleanly', () => {
  assert.equal(BUILTIN_GHOST_BUILDS.length, 10);
  for (const ghost of BUILTIN_GHOST_BUILDS) {
    const raw = JSON.stringify(ghost);
    const parsed = parseGhostBuildJson(raw);
    assert.ok(parsed !== null, `Built-in ghost for round ${ghost.round} failed validation`);
    assert.equal(parsed.round, ghost.round);

    const placed = ghostGridToPlacedGears(parsed);
    const evalRes = evaluateBackpackSynergies(placed);
    assert.ok(evalRes.weapons.length >= 2, `Round ${ghost.round} ghost must have weapons`);
    assert.ok(evalRes.totalDps > 40, `Round ${ghost.round} ghost DPS too low`);
  }

  const sample = createStarterBackpack();
  const snapshot = serializeGhostBuild('Thuận Lê Mech', 4, sample);
  const reParsed = parseGhostBuildJson(JSON.stringify(snapshot));
  assert.ok(reParsed !== null);
  assert.equal(reParsed.name, 'Thuận Lê Mech');
  assert.equal(reParsed.grid.length, sample.length);

  assert.equal(parseGhostBuildJson('not json'), null);
  assert.equal(
    parseGhostBuildJson(
      JSON.stringify({
        version: 1,
        name: 'Bad',
        round: 1,
        grid: [
          { itemId: 'pulse_laser', col: 0, row: 0, rotation: 0 },
          { itemId: 'pulse_laser', col: 0, row: 0, rotation: 0 },
        ],
      })
    ),
    null
  );
});

test('shop offer generator returns 4 valid items for every round', () => {
  for (let r = 1; r <= 10; r += 1) {
    const offers = rollShopOffers(r);
    assert.equal(offers.length, 4);
    for (const id of offers) {
      assert.ok(getGearCatalogEntry(id));
    }
  }
});

test('expanded arsenal (12 weapons, 14 accessories/support), 4 modes, and tactical accessory synergies work', () => {
  const weaponsCount = GEAR_CATALOG.filter((g) => g.category === 'weapon').length;
  const supportCount = GEAR_CATALOG.filter((g) => g.category !== 'weapon').length;
  assert.equal(weaponsCount, 12);
  assert.equal(supportCount, 14);
  assert.equal(GEAR_ARENA_MODES.length, 4);

  // Mode reward scaling
  assert.ok(getModeRoundReward(3, 'boss_rush') > getModeRoundReward(3, 'classic'));
  assert.ok(getModeRoundReward(3, 'blitz') > getModeRoundReward(3, 'classic'));

  // Accessories attached to 2x2 Nova Cannon
  const moddedGrid: PlacedGear[] = [
    { uid: 'nova', itemId: 'nova_cannon', col: 1, row: 1, rotation: 0 }, // 2x2: cols 1..2, rows 1..2
    { uid: 'mag', itemId: 'extended_mag', col: 0, row: 1, rotation: 0 },
    { uid: 'vamp', itemId: 'vampire_module', col: 0, row: 2, rotation: 0 },
    { uid: 'cryo', itemId: 'cryo_cell', col: 3, row: 1, rotation: 0 },
    { uid: 'sight', itemId: 'laser_sight', col: 3, row: 2, rotation: 0 },
    { uid: 'emp', itemId: 'stun_capacitor', col: 4, row: 0, rotation: 0 },
    { uid: 'shield', itemId: 'reflector_shield', col: 4, row: 1, rotation: 0 },
  ];
  const moddedEval = evaluateBackpackSynergies(moddedGrid);
  assert.equal(moddedEval.weapons.length, 1);
  const nova = moddedEval.weapons[0];
  assert.equal(nova.pelletCount, 2); // +1 from extended_mag
  assert.ok(nova.aoeRadius > 96); // +25% AoE
  assert.ok(nova.slowFactor >= 0.35); // cryo_cell
  assert.ok(nova.lifestealPct >= 0.05); // vampire_module
  assert.equal(moddedEval.empCount, 1);
  assert.ok(moddedEval.reflectPct >= 0.35);
  assert.ok(moddedEval.maxHp >= 220 + 40 + 25 + 55);
});

test('all 4 Gear Arena modes have 3x longer round durations (39s..60s) and 3-stage wave escalation', () => {
  const byId = Object.fromEntries(GEAR_ARENA_MODES.map((m) => [m.id, m]));
  assert.equal(byId.classic.battleDurationSec, 48);
  assert.equal(byId.blitz.battleDurationSec, 39);
  assert.equal(byId.boss_rush.battleDurationSec, 60);
  assert.equal(byId.endless.battleDurationSec, 48);

  const s1 = getArenaWaveStage(5, 48);
  const s2 = getArenaWaveStage(22, 48);
  const s3 = getArenaWaveStage(40, 48);
  assert.equal(s1.stage, 1);
  assert.equal(s2.stage, 2);
  assert.equal(s3.stage, 3);
  assert.ok(s3.spawnIntervalFactor < s2.spawnIntervalFactor && s2.spawnIntervalFactor < s1.spawnIntervalFactor);
});

