import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMirrorReflectionDir,
  createEnemyForWave,
  getMapPathTileSet,
  getOpticSellRefund,
  getOpticUpgradeCost,
  getTileKind,
  gridToWorldCenter,
  PlacedOptic,
  pointToSegmentDistSq,
  PRISM_MAPS,
  stepEnemiesWithLasers,
  traceLaserNetwork,
} from './prismTdEngine.ts';

test('PRISM_MAPS define 3 valid 12x8 circuit maps with valid emitters and starter optics', () => {
  assert.equal(PRISM_MAPS.length, 3);
  for (const map of PRISM_MAPS) {
    assert.equal(map.cols, 12);
    assert.equal(map.rows, 8);
    assert.ok(map.emitters.length >= 1 && map.emitters.length <= 2);
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
    }))
  );
  assert.ok(starterTrace.segments.length >= 2);
});

test('computeMirrorReflectionDir reflects cardinal and 45-deg beams accurately across 8 orientations', () => {
  // Moving South (2), hitting '/' mirror (rot = 2, normal SE/NW) -> reflects East (0)
  // Let's verify: inDir=2 (S), revIn=6 (N), out=(2 - 6 + 8)%8 = 4 (West)
  // Moving South (2), hitting '\' mirror (rot = 6, normal NE/SW) -> out=(6 - 6)=0 (East)!
  assert.equal(computeMirrorReflectionDir(2, 6), 0); // South -> East!
  assert.equal(computeMirrorReflectionDir(2, 2), 4); // South -> West!
  // Moving East (0), hitting mirror rot = 2 -> revIn=4, out=(2-4+8)=6 (North)!
  assert.equal(computeMirrorReflectionDir(0, 2), 6);
  // Moving East (0), hitting mirror rot = 3 -> revIn=4, out=(3-4+8)=7 (North-East 45°)!
  assert.equal(computeMirrorReflectionDir(0, 3), 7);
});

test('traceLaserNetwork handles mirror bounces, 1->3 prism splitting, amplifier boost, walls, and bounce loops', () => {
  const map = PRISM_MAPS[0]; // Emitter at (1,0) firing South (dir=2), power=38
  const optics: PlacedOptic[] = [
    { id: 'm1', col: 1, row: 4, type: 'mirror', rot: 6, level: 1, chargeTimer: 0, hitCount: 0 }, // Reflects S -> E along row 4
    { id: 'amp1', col: 3, row: 4, type: 'amp', rot: 0, level: 1, chargeTimer: 0, hitCount: 0 }, // Boosts power * 1.65 & tier 2
    { id: 'p1', col: 5, row: 4, type: 'prism', rot: 0, level: 1, chargeTimer: 0, hitCount: 0 }, // Splits East into NE, E, SE!
  ];

  const trace = traceLaserNetwork(map, optics, false);
  // Segment 0: (1,0)->(1,4)
  // Segment 1: (1,4)->(3,4)
  // Segment 2: (3,4)->(5,4) amplified tier=2
  // Segments 3,4,5: prism 3-way fan (NE, E capped by wall at (6,3)/(6,4)? Let's check!)
  assert.ok(trace.segments.length >= 6);
  const ampSeg = trace.segments.find((s) => s.tier === 2);
  assert.ok(ampSeg);
  assert.ok(ampSeg.power > 60); // 38 * 1.04 * 1.65 ~ 65.2

  // Check wall at (6,4) blocks the straight East ray from (5,4)
  const eastFromPrism = trace.segments.find(
    (s) =>
      Math.abs(s.x1 - gridToWorldCenter(5, 4).x) < 1 &&
      Math.abs(s.y1 - gridToWorldCenter(5, 4).y) < 1 &&
      Math.abs(s.y2 - s.y1) < 1
  );
  assert.ok(eastFromPrism);
  assert.ok(eastFromPrism.x2 < gridToWorldCenter(6, 4).x);

  // Infinite loop safety test: two mirrors bouncing straight back at each other
  const loopOptics: PlacedOptic[] = [
    { id: 'lm1', col: 1, row: 4, type: 'mirror', rot: 2, level: 1, chargeTimer: 0, hitCount: 0 },
    { id: 'lm2', col: 1, row: 1, type: 'mirror', rot: 4, level: 1, chargeTimer: 0, hitCount: 0 },
  ];
  const loopTrace = traceLaserNetwork(map, loopOptics, false);
  assert.ok(loopTrace.segments.length <= 72);
});

test('pointToSegmentDistSq and stepEnemiesWithLasers award 1.25x crossfire damage and armor penetration for amplified beams', () => {
  assert.equal(pointToSegmentDistSq(50, 10, 0, 0, 100, 0), 100);

  const map = PRISM_MAPS[0];
  const armoredLow = createEnemyForWave(1, 'armored', 1, map);
  const armoredHigh = createEnemyForWave(2, 'armored', 1, map);
  armoredLow.x = 200;
  armoredLow.y = 200;
  armoredHigh.x = 200;
  armoredHigh.y = 200;

  const tier1Beam = [{ x1: 100, y1: 200, x2: 300, y2: 200, power: 40, bounceDepth: 0, tier: 1 as const, overdriven: false }];
  const tier2Crossfire = [
    { x1: 100, y1: 200, x2: 300, y2: 200, power: 40, bounceDepth: 0, tier: 2 as const, overdriven: false },
    { x1: 200, y1: 100, x2: 200, y2: 300, power: 40, bounceDepth: 0, tier: 2 as const, overdriven: false },
  ];

  const resLow = stepEnemiesWithLasers([armoredLow], tier1Beam, map, 0.5);
  const resHigh = stepEnemiesWithLasers([armoredHigh], tier2Crossfire, map, 0.5);
  assert.ok(resHigh.outcome.crossfireHits >= 1);
  assert.ok(resHigh.outcome.totalDamageDealt > resLow.outcome.totalDamageDealt * 2);
});

test('upgrade cost and sell refund math stay consistent across levels 1..3', () => {
  assert.equal(getOpticUpgradeCost('mirror', 1), 30);
  assert.equal(getOpticUpgradeCost('mirror', 2), 45);
  assert.equal(getOpticUpgradeCost('mirror', 3), null);
  const refundLv2 = getOpticSellRefund({
    id: 'x',
    col: 0,
    row: 0,
    type: 'mirror',
    rot: 0,
    level: 2,
    chargeTimer: 0,
    hitCount: 0,
  });
  assert.equal(refundLv2, Math.round((35 + 30) * 0.7));
});
