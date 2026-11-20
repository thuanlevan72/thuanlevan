import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLIND_BOX_PACKS,
  computeTearProgress,
  JAR_H,
  JAR_W,
  ROOM_COLLECTIBLES,
  rollBlindBoxDrop,
  SQUISHY_TIERS,
  stepSquishyPhysics,
  type SquishyBody,
} from './blindBoxMergeEngine.ts';

test('SQUISHY_TIERS and ROOM_COLLECTIBLES define complete progressive progression & blind boxes', () => {
  assert.equal(SQUISHY_TIERS.length, 10);
  for (let i = 1; i < SQUISHY_TIERS.length; i++) {
    assert.ok(
      SQUISHY_TIERS[i].radius > SQUISHY_TIERS[i - 1].radius,
      `Tier ${i} radius must strictly increase`
    );
    assert.ok(SQUISHY_TIERS[i].mergeCoins >= SQUISHY_TIERS[i - 1].mergeCoins);
  }

  assert.equal(ROOM_COLLECTIBLES.length, 12);
  const secrets = ROOM_COLLECTIBLES.filter((c) => c.rarity === 'secret');
  assert.equal(secrets.length, 2);

  assert.equal(BLIND_BOX_PACKS.length, 2);
  const collectibleIds = new Set(ROOM_COLLECTIBLES.map((c) => c.id));
  for (const pack of BLIND_BOX_PACKS) {
    assert.ok(pack.poolIds.length >= 6);
    for (const pid of pack.poolIds) {
      assert.ok(collectibleIds.has(pid), `Unknown collectible ${pid} in pack ${pack.id}`);
    }
  }
});

test('stepSquishyPhysics resolves floor bounce, wall clamping, and merges identical touching squishies', () => {
  const nextId = { current: 100 };
  const tier0 = SQUISHY_TIERS[0];

  // Two overlapping Tier-0 mochis should immediately merge into Tier-1 Chick
  const bodies: SquishyBody[] = [
    {
      id: 1,
      tier: 0,
      x: 170,
      y: 360,
      vx: 0,
      vy: 0,
      radius: tier0.radius,
      scaleX: 1,
      scaleY: 1,
      ageSec: 0.5,
      mergeFlash: 0,
    },
    {
      id: 2,
      tier: 0,
      x: 185,
      y: 360,
      vx: 0,
      vy: 0,
      radius: tier0.radius,
      scaleX: 1,
      scaleY: 1,
      ageSec: 0.5,
      mergeFlash: 0,
    },
  ];

  const out = stepSquishyPhysics(bodies, 0.016, nextId, JAR_W, JAR_H);
  assert.equal(out.merges.length, 1);
  assert.equal(out.merges[0].tier, 1);
  assert.equal(out.bodies.length, 1);
  assert.equal(out.bodies[0].tier, 1);
  assert.equal(out.scoreDelta, SQUISHY_TIERS[1].mergeScore);
  assert.equal(out.coinDelta, SQUISHY_TIERS[1].mergeCoins);
  assert.equal(out.overflowed, false);

  // Two Boss Capybara tier-9 squishies do NOT merge into a non-existent tier-10
  const maxTier = SQUISHY_TIERS[9];
  const bossOut = stepSquishyPhysics(
    [
      { id: 10, tier: 9, x: 140, y: 340, vx: 0, vy: 0, radius: maxTier.radius, scaleX: 1, scaleY: 1, ageSec: 1, mergeFlash: 0 },
      { id: 11, tier: 9, x: 220, y: 340, vx: 0, vy: 0, radius: maxTier.radius, scaleX: 1, scaleY: 1, ageSec: 1, mergeFlash: 0 },
    ],
    0.016,
    nextId
  );
  assert.equal(bossOut.merges.length, 0);
  assert.equal(bossOut.bodies.length, 2);
});

test('computeTearProgress and rollBlindBoxDrop handle foil tearing and duplicate coin refunds', () => {
  assert.equal(computeTearProgress(100, 80, 200), 0);
  assert.equal(computeTearProgress(100, 200, 200), 0.5);
  assert.equal(computeTearProgress(100, 380, 200), 1);

  const pack = BLIND_BOX_PACKS[0];
  // Low roll triggers Secret drop
  const secretDrop = rollBlindBoxDrop(pack, 0.01, 0, []);
  assert.equal(secretDrop.item.rarity, 'secret');
  assert.equal(secretDrop.isNew, true);
  assert.equal(secretDrop.duplicateRefundCoins, 0);

  // Duplicate secret drop grants +60 refund coins
  const dupSecret = rollBlindBoxDrop(pack, 0.01, 0, [secretDrop.item.id]);
  assert.equal(dupSecret.isNew, false);
  assert.equal(dupSecret.duplicateRefundCoins, 60);

  // Common drop
  const commonDrop = rollBlindBoxDrop(pack, 0.9, 0.2, []);
  assert.equal(commonDrop.item.rarity, 'common');
});
