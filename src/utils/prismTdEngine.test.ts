import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDamageToEnemy,
  BIOME_PALETTES,
  buildWaveSpawns,
  createEnemyForWave,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  getEffectiveMapSetup,
  getGunCombatProfile,
  getGunSellRefund,
  getGunTotalInvested,
  getGunUpgradeCost,
  getMapPathTileSet,
  getTileKind,
  GUN_CATALOG,
  MAX_GUN_LEVEL,
  PRISM_MAPS,
  stepEnemies,
} from './prismTdEngine.ts';

test('PRISM_MAPS define 16 valid 12x8 tactical pure-gun maps with long 15-35 wave campaigns', () => {
  assert.equal(PRISM_MAPS.length, 16);
  assert.equal(GUN_CATALOG.length, 8);
  assert.equal(MAX_GUN_LEVEL, 10);
  assert.deepEqual(DIFFICULTY_ORDER, ['easy', 'normal', 'hard', 'hell']);

  for (const map of PRISM_MAPS) {
    assert.equal(map.cols, 12);
    assert.equal(map.rows, 8);
    assert.ok(BIOME_PALETTES[map.biome]);
    assert.ok(DIFFICULTY_CONFIGS[map.recommendedDifficulty]);
    assert.ok(map.totalWaves >= 15 && map.totalWaves <= 35, `${map.id} waves should be 15..35`);
    const pathSet = getMapPathTileSet(map);
    assert.ok(pathSet.size >= 14);
    assert.equal(getTileKind(map, map.path[0].col, map.path[0].row), 'spawn');
    assert.equal(
      getTileKind(map, map.path[map.path.length - 1].col, map.path[map.path.length - 1].row),
      'core'
    );
    for (const w of map.walls) {
      assert.equal(pathSet.has(`${w.col},${w.row}`), false);
    }
  }
});

test('4 difficulty tiers scale wave counts, core HP, energy, and enemy stats monotonically', () => {
  const map = PRISM_MAPS[0];
  const setupEasy = getEffectiveMapSetup(map, 'easy');
  const setupNormal = getEffectiveMapSetup(map, 'normal');
  const setupHard = getEffectiveMapSetup(map, 'hard');
  const setupHell = getEffectiveMapSetup(map, 'hell');

  assert.equal(setupEasy.totalWaves, 15);
  assert.equal(setupNormal.totalWaves, 17);
  assert.equal(setupHard.totalWaves, 19);
  assert.equal(setupHell.totalWaves, 21);

  assert.ok(setupEasy.startCoreHp > setupNormal.startCoreHp);
  assert.ok(setupNormal.startCoreHp > setupHard.startCoreHp);
  assert.ok(setupHard.startCoreHp > setupHell.startCoreHp);

  assert.ok(setupEasy.startEnergy > setupNormal.startEnergy);
  assert.ok(setupNormal.startEnergy > setupHard.startEnergy);
  assert.ok(setupHard.startEnergy > setupHell.startEnergy);

  const bossEasy = createEnemyForWave(1, 'boss', 10, map, false, 'easy');
  const bossNormal = createEnemyForWave(2, 'boss', 10, map, false, 'normal');
  const bossHard = createEnemyForWave(3, 'boss', 10, map, false, 'hard');
  const bossHell = createEnemyForWave(4, 'boss', 10, map, false, 'hell');

  assert.ok(bossNormal.maxHp > bossEasy.maxHp);
  assert.ok(bossHard.maxHp > bossNormal.maxHp);
  assert.ok(bossHell.maxHp > bossHard.maxHp);
  assert.ok(bossHell.speed > bossHard.speed);
  assert.ok(bossHell.armorRatio > bossEasy.armorRatio);
  assert.ok(bossHell.scoreValue > bossEasy.scoreValue * 2);

  const hellMap16 = getEffectiveMapSetup(PRISM_MAPS[15], 'hell');
  assert.equal(hellMap16.totalWaves, 41);

  const w5Easy = buildWaveSpawns(5, setupEasy.totalWaves, 'easy');
  const w5Hell = buildWaveSpawns(5, setupHell.totalWaves, 'hell');
  assert.ok(w5Hell.length > w5Easy.length);
  assert.ok(w5Hell.some((s) => s.kind === 'boss'));
});

test('Pure Gun Lv1..Lv10 progression scales monotonically and unlocks milestone skills cleanly', () => {
  for (const gun of GUN_CATALOG) {
    assert.equal(gun.milestones.length, 4);
    let prevDps = 0;
    let prevDmg = 0;

    for (let lv = 1; lv <= MAX_GUN_LEVEL; lv++) {
      const profile = getGunCombatProfile(gun.type, lv);
      assert.equal(profile.level, lv);
      assert.ok(profile.damage > prevDmg, `${gun.type} lv${lv} damage should increase`);
      assert.ok(profile.dpsEstimate > prevDps, `${gun.type} lv${lv} dps should increase`);
      prevDmg = profile.damage;
      prevDps = profile.dpsEstimate;

      if (lv < MAX_GUN_LEVEL) {
        const upCost = getGunUpgradeCost(gun.type, lv);
        assert.ok(upCost !== null && upCost > 0);
      } else {
        assert.equal(getGunUpgradeCost(gun.type, lv), null);
        assert.equal(profile.visualTier, 4);
        assert.equal(profile.unlockedSkills.length, 4);
        assert.equal(profile.nextSkill, null);
      }
    }
  }

  const lv1Cost = getGunUpgradeCost('gatling', 1)!;
  const lv9Cost = getGunUpgradeCost('gatling', 9)!;
  assert.ok(lv9Cost > lv1Cost * 3);
  const investedLv3 = getGunTotalInvested('cryo', 3);
  const refundLv3 = getGunSellRefund({ type: 'cryo', level: 3 });
  assert.equal(refundLv3, Math.round(investedLv3 * 0.72));
});

test('Rebalanced wave spawns and enemy scaling challenge late-game waves and support all enemy abilities', () => {
  const map = PRISM_MAPS[0];
  const wave1 = buildWaveSpawns(1, map.totalWaves, 'normal');
  const wave15 = buildWaveSpawns(15, 25, 'hard');
  assert.ok(wave1.length >= 16);
  assert.ok(wave15.length >= 60);
  assert.ok(wave15.some((s) => s.kind === 'boss'));

  const scoutW1 = createEnemyForWave(1, 'scout', 1, map, false, 'normal');
  const scoutW8 = createEnemyForWave(2, 'scout', 8, map, false, 'normal');
  const bossW15 = createEnemyForWave(3, 'boss', 15, map, false, 'hard');
  assert.ok(scoutW8.maxHp > scoutW1.maxHp * 4);
  assert.ok(bossW15.maxHp > 20000);
  assert.ok(bossW15.maxShield > 6000);

  // Armor pierce & brittle interaction
  const tank = createEnemyForWave(4, 'armored', 5, map, false, 'normal');
  tank.shield = 0;
  const startHp = tank.hp;
  const rawHit = applyDamageToEnemy(tank, 100, { armorPierce: 0 });
  const apHit = applyDamageToEnemy(tank, 100, { armorPierce: 1 });
  assert.ok(apHit.actualDamage > rawHit.actualDamage * 1.5);
  assert.ok(tank.hp < startHp);

  // Shield multiplier (Tesla EMP)
  const aegis = createEnemyForWave(5, 'shieldbearer', 6, map, false, 'normal');
  const initShield = aegis.shield;
  applyDamageToEnemy(aegis, 50, { shieldMult: 2 });
  assert.equal(initShield - aegis.shield, 100);

  // Healer pulse, burn DoT bypass, and teleporter phase blink
  const healer = createEnemyForWave(10, 'healer', 4, map, false, 'normal');
  const woundedAlly = createEnemyForWave(11, 'armored', 4, map, false, 'normal');
  woundedAlly.hp = Math.round(woundedAlly.maxHp * 0.4);
  healer.x = 200;
  healer.y = 200;
  healer.abilityCooldown = 0.05;
  woundedAlly.x = 230;
  woundedAlly.y = 200;
  woundedAlly.burnTimer = 2;
  woundedAlly.burnDps = 25;

  const resHeal = stepEnemies([healer, woundedAlly], map, 0.2);
  assert.equal(resHeal.outcome.healedEvents.length, 1);
  assert.ok(resHeal.outcome.totalDamageDealt > 0);

  const blinker = createEnemyForWave(12, 'teleporter', 5, map, false, 'normal');
  const startX = blinker.x;
  blinker.abilityCooldown = 0.05;
  const resBlink = stepEnemies([blinker], map, 0.1);
  assert.equal(resBlink.outcome.blinkEvents.length, 1);
  assert.ok(blinker.x > startX + 30);
});
