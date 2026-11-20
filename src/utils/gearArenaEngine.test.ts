import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_GHOST_BUILDS,
  canPlaceGearItem,
  createStarterBackpack,
  evaluateBackpackSynergies,
  getGearCatalogEntry,
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
  // Only 2 weapons connected => not yet chain lightning
  const twoWeaponGrid: PlacedGear[] = [
    { uid: 'bat', itemId: 'nuclear_battery', col: 0, row: 2, rotation: 0 },
    { uid: 'wire', itemId: 'conductor_wire', col: 1, row: 2, rotation: 0 },
    { uid: 'w1', itemId: 'pulse_laser', col: 1, row: 1, rotation: 0 },
    { uid: 'w2', itemId: 'pulse_laser', col: 2, row: 2, rotation: 0 },
  ];
  const partialEval = evaluateBackpackSynergies(twoWeaponGrid);
  assert.equal(partialEval.energizedWeaponCount, 2);
  assert.equal(partialEval.chainLightningActive, false);

  // Add 3rd weapon connected through conductor wire -> Chain Lightning activates!
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

  // Round-trip serialization test on player build
  const sample = createStarterBackpack();
  const snapshot = serializeGhostBuild('Thuận Lê Mech', 4, sample);
  const reParsed = parseGhostBuildJson(JSON.stringify(snapshot));
  assert.ok(reParsed !== null);
  assert.equal(reParsed.name, 'Thuận Lê Mech');
  assert.equal(reParsed.grid.length, sample.length);

  // Reject malformed / overlapping JSON
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
