import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDamageToEnemy,
  BIOME_PALETTES,
  computeMirrorReflectionDir,
  createEnemyForWave,
  getMapPathTileSet,
  getOpticSellRefund,
  getOpticUpgradeCost,
  getTileKind,
  gridToWorldCenter,
  OPTIC_CATALOG,
  PlacedOptic,
  pointToSegmentDistSq,
  PRISM_MAPS,
  stepEnemiesWithLasers,
  traceLaserNetwork,
} from './prismTdEngine.ts';

test('PRISM_MAPS define 10 valid 12x8 biome circuit maps and 10 optic/weapon tools', () => {
  assert.equal(PRISM_MAPS.length, 10);
  assert.equal(OPTIC_CATALOG.length, 10);
  for (const map of PRISM_MAPS) {
    assert.equal(map.cols, 12);
    assert.equal(map.rows, 8);
    assert.ok(BIOME_PALETTES[map.biome]);
    assert.ok(map.emitters.length >= 1 && map.emitters.length <= 3);
    const pathSet = getMapPathTileSet(map);
    assert.ok(pathSet.size >= 10);

    for (const em of map.emitters) {
      assert.ok(em.col >= 0 && em.col < map.cols);
      assert.ok(em.row >= 0 && em.row < map.rows);
      assert.equal(pathSet.has(`${em.col},${em.row}`), false);
    }
    for (const op of map.starterOptics) {
      assert.equal(getTileKind(map, op.col, op.row), 'empty');
    }
  }

  const starterTrace = traceLaserNetwork(
    PRISM_MAPS[0],
    PRISM_MAPS[0].starterOptics.map((s, idx) => ({
      id: `s-${idx}`,
      col: s.col,
      row: s.row,
      type: s.type,
      rot: s.rot,
      level: 1,
      chargeTimer: 0,
      hitCount: 0,
      aimAngle: 0,
      recoil: 0,
    }))
  );
  assert.ok(starterTrace.segments.length >= 2);
});

test('computeMirrorReflectionDir reflects cardinal and 45-deg beams accurately across 8 orientations', () => {
  assert.equal(computeMirrorReflectionDir(2, 6), 0); // South -> East!
  assert.equal(computeMirrorReflectionDir(2, 2), 4); // South -> West!
  assert.equal(computeMirrorReflectionDir(0, 2), 6); // East -> North!
  assert.equal(computeMirrorReflectionDir(0, 3), 7); // East -> North-East 45°!
});

test('traceLaserNetwork handles mirror bounces, 1->3 prism splitting, amplifier boost, energized gun passthrough, and loops', () => {
  const map = PRISM_MAPS[0];
  const optics: PlacedOptic[] = [
    { id: 'm1', col: 1, row: 4, type: 'mirror', rot: 6, level: 1, chargeTimer: 0, hitCount: 0, aimAngle: 0, recoil: 0 },
    { id: 'g1', col: 2, row: 4, type: 'flamer', rot: 0, level: 1, chargeTimer: 0, hitCount: 0, aimAngle: 0, recoil: 0 },
    { id: 'amp1', col: 3, row: 4, type: 'amp', rot: 0, level: 1, chargeTimer: 0, hitCount: 0, aimAngle: 0, recoil: 0 },
    { id: 'p1', col: 5, row: 4, type: 'prism', rot: 0, level: 1, chargeTimer: 0, hitCount: 0, aimAngle: 0, recoil: 0 },
  ];

  const trace = traceLaserNetwork(map, optics, false);
  assert.ok(trace.energizedGunIds.includes('g1'));
  assert.ok(trace.segments.length >= 6);
  const ampSeg = trace.segments.find((s) => s.tier === 2);
  assert.ok(ampSeg);
  assert.ok(ampSeg.power > 55);

  const eastFromPrism = trace.segments.find(
    (s) =>
      Math.abs(s.x1 - gridToWorldCenter(5, 4).x) < 1 &&
      Math.abs(s.y1 - gridToWorldCenter(5, 4).y) < 1 &&
      Math.abs(s.y2 - s.y1) < 1
  );
  assert.ok(eastFromPrism);
  assert.ok(eastFromPrism.x2 < gridToWorldCenter(6, 4).x);

  const loopOptics: PlacedOptic[] = [
    { id: 'lm1', col: 1, row: 4, type: 'mirror', rot: 2, level: 1, chargeTimer: 0, hitCount: 0, aimAngle: 0, recoil: 0 },
    { id: 'lm2', col: 1, row: 1, type: 'mirror', rot: 4, level: 1, chargeTimer: 0, hitCount: 0, aimAngle: 0, recoil: 0 },
  ];
  const loopTrace = traceLaserNetwork(map, loopOptics, false);
  assert.ok(loopTrace.segments.length <= 84);
});

test('pointToSegmentDistSq, shields, burn DoT, healer pulse, and teleporter phase blink work cleanly', () => {
  assert.equal(pointToSegmentDistSq(50, 10, 0, 0, 100, 0), 100);

  const map = PRISM_MAPS[0];
  const shieldbearer = createEnemyForWave(10, 'shieldbearer', 6, map);
  assert.ok(shieldbearer.shield > 100);
  assert.equal(applyDamageToEnemy(shieldbearer, 40), false);
  assert.ok(shieldbearer.shield < shieldbearer.maxShield);

  const healer = createEnemyForWave(11, 'healer', 4, map);
  const woundedAlly = createEnemyForWave(12, 'armored', 4, map);
  woundedAlly.hp = Math.round(woundedAlly.maxHp * 0.4);
  healer.x = 200;
  healer.y = 200;
  healer.abilityCooldown = 0.05;
  woundedAlly.x = 230;
  woundedAlly.y = 200;
  woundedAlly.burnTimer = 2;
  woundedAlly.burnDps = 20;

  const resHeal = stepEnemiesWithLasers([healer, woundedAlly], [], map, 0.2);
  assert.equal(resHeal.outcome.healedEvents.length, 1);
  assert.ok(resHeal.outcome.totalDamageDealt > 0);

  const blinker = createEnemyForWave(13, 'teleporter', 5, map);
  const startX = blinker.x;
  blinker.abilityCooldown = 0.05;
  const resBlink = stepEnemiesWithLasers([blinker], [], map, 0.1);
  assert.equal(resBlink.outcome.blinkEvents.length, 1);
  assert.ok(blinker.x > startX + 30);
});

test('upgrade cost and sell refund math stay consistent across levels 1..3 including new guns', () => {
  assert.equal(getOpticUpgradeCost('mirror', 1), 30);
  assert.equal(getOpticUpgradeCost('mortar', 2), 120);
  assert.equal(getOpticUpgradeCost('flamer', 3), null);
  const refundLv2 = getOpticSellRefund({
    id: 'x',
    col: 0,
    row: 0,
    type: 'cryo',
    rot: 0,
    level: 2,
    chargeTimer: 0,
    hitCount: 0,
    aimAngle: 0,
    recoil: 0,
  });
  assert.equal(refundLv2, Math.round((65 + 50) * 0.7));
});
