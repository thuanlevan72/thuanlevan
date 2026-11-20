import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceEnemyAlongPath,
  applyDamageToEnemy,
  BIOME_PALETTES,
  buildWaveSpawns,
  clampEnemyToTrackCorridor,
  computeBeaconBuffAtTile,
  createEnemyForWave,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  GAME_MODE_CONFIGS,
  GAME_MODE_ORDER,
  getEffectiveMapSetup,
  getGunCombatProfile,
  getGunSellRefund,
  getGunTotalInvested,
  getGunUpgradeCost,
  getMapPathTileSet,
  getTileKind,
  gridToWorldCenter,
  GUN_CATALOG,
  MAX_CORRIDOR_LATERAL_PX,
  MAX_GUN_LEVEL,
  PlacedGun,
  PRISM_MAPS,
  pullEnemyAlongTrack,
  stepEnemies,
} from './prismTdEngine.ts';

test('PRISM_MAPS define 16 valid 12x8 tactical pure-gun maps with halved waves (8..18), 16 guns Lv10, and 4 modes', () => {
  assert.equal(PRISM_MAPS.length, 16);
  assert.equal(GUN_CATALOG.length, 16);
  assert.equal(MAX_GUN_LEVEL, 10);
  assert.deepEqual(DIFFICULTY_ORDER, ['easy', 'normal', 'hard', 'hell']);
  assert.deepEqual(GAME_MODE_ORDER, ['campaign', 'blitz', 'boss_rush', 'endless']);
  assert.ok(GAME_MODE_CONFIGS.blitz.speedMult > 1);
  assert.ok(GAME_MODE_CONFIGS.boss_rush.startEnergyMult >= 2);

  assert.equal(DIFFICULTY_CONFIGS.easy.hpMult, 1.2);
  assert.equal(DIFFICULTY_CONFIGS.normal.hpMult, 1.8);
  assert.equal(DIFFICULTY_CONFIGS.hard.hpMult, 2.64);
  assert.equal(DIFFICULTY_CONFIGS.hell.hpMult, 3.84);

  for (const map of PRISM_MAPS) {
    assert.equal(map.cols, 12);
    assert.equal(map.rows, 8);
    assert.ok(BIOME_PALETTES[map.biome]);
    assert.ok(DIFFICULTY_CONFIGS[map.recommendedDifficulty]);
    assert.ok(map.totalWaves >= 8 && map.totalWaves <= 18, `${map.id} waves should be 8..18 (halved)`);
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

test('Halved wave counts, 2x wave durations, steeper per-wave difficulty, and winnable Hell W1', () => {
  const map = PRISM_MAPS[0];
  const setupEasy = getEffectiveMapSetup(map, 'easy', 'campaign');
  const setupNormal = getEffectiveMapSetup(map, 'normal', 'campaign');
  const setupHard = getEffectiveMapSetup(map, 'hard', 'campaign');
  const setupHell = getEffectiveMapSetup(map, 'hell', 'campaign');

  assert.equal(setupEasy.totalWaves, 8);
  assert.equal(setupNormal.totalWaves, 9);
  assert.equal(setupHard.totalWaves, 10);
  assert.equal(setupHell.totalWaves, 11);

  assert.ok(setupEasy.startCoreHp > setupNormal.startCoreHp);
  assert.ok(setupNormal.startCoreHp > setupHard.startCoreHp);
  assert.ok(setupHard.startCoreHp > setupHell.startCoreHp);

  assert.ok(setupEasy.startEnergy > setupNormal.startEnergy);
  assert.ok(setupNormal.startEnergy > setupHard.startEnergy);
  assert.ok(setupHard.startEnergy > setupHell.startEnergy);

  const setupBlitz = getEffectiveMapSetup(map, 'normal', 'blitz');
  const setupBossRush = getEffectiveMapSetup(map, 'normal', 'boss_rush');
  assert.ok(setupBlitz.totalWaves < setupNormal.totalWaves);
  assert.ok(setupBossRush.startEnergy > setupNormal.startEnergy * 2);

  // Verify 3.5x–3.8x longer active duration per wave across Early / Mid / Late waves (vs prior 26.5s / 45.2s / 59.8s)
  const w1Normal = buildWaveSpawns(1, setupNormal.totalWaves, 'normal', 'campaign');
  const w5Normal = buildWaveSpawns(5, setupNormal.totalWaves, 'normal', 'campaign');
  const w8Normal = buildWaveSpawns(8, setupNormal.totalWaves, 'normal', 'campaign');
  const w1Span = w1Normal[w1Normal.length - 1].delaySec;
  const w5Span = w5Normal[w5Normal.length - 1].delaySec;
  const w8Span = w8Normal[w8Normal.length - 1].delaySec;
  assert.ok(w1Span >= 85 && w1Span <= 115, `W1 span=${w1Span}s should be ~3.5x longer (85..115s)`);
  assert.ok(w5Span >= 145 && w5Span <= 190, `W5 span=${w5Span}s should be ~3.5x longer (145..190s)`);
  assert.ok(w8Span >= 195 && w8Span <= 255, `W8 span=${w8Span}s should be ~3.5x longer (195..255s)`);

  const w1BossRush = buildWaveSpawns(1, setupBossRush.totalWaves, 'normal', 'boss_rush');
  assert.ok(w1BossRush.some((s) => s.kind === 'boss'));

  const bossEasy = createEnemyForWave(1, 'boss', 6, map, false, 'easy');
  const bossNormal = createEnemyForWave(2, 'boss', 6, map, false, 'normal');
  const bossHard = createEnemyForWave(3, 'boss', 6, map, false, 'hard');
  const bossHell = createEnemyForWave(4, 'boss', 6, map, false, 'hell');

  assert.ok(bossNormal.maxHp > bossEasy.maxHp);
  assert.ok(bossHard.maxHp > bossNormal.maxHp);
  assert.ok(bossHell.maxHp > bossHard.maxHp);
  assert.ok(bossHell.speed > bossHard.speed);
  assert.ok(bossHell.armorRatio > bossEasy.armorRatio);
  assert.ok(bossHell.scoreValue > bossEasy.scoreValue * 2);

  // Verify Hell W1 total HP stays balanced across 3.5x wave length (~93s span)
  const w1Hell = buildWaveSpawns(1, setupHell.totalWaves, 'hell', 'campaign');
  assert.equal(w1Hell.length, 64);
  const w1TotalHp = w1Hell.reduce(
    (sum, item, idx) =>
      sum + createEnemyForWave(idx + 1, item.kind, 1, map, item.isElite, 'hell', 'campaign').maxHp,
    0
  );
  assert.ok(w1TotalHp > 7500 && w1TotalHp < 15500, `Hell W1 total HP=${w1TotalHp} across ~93s should stay balanced`);

  const hellMap16 = getEffectiveMapSetup(PRISM_MAPS[15], 'hell', 'campaign');
  assert.equal(hellMap16.totalWaves, 21);

  const w4Easy = buildWaveSpawns(4, setupEasy.totalWaves, 'easy', 'campaign');
  const w4Hell = buildWaveSpawns(4, setupHell.totalWaves, 'hell', 'campaign');
  assert.ok(w4Hell.length > w4Easy.length);
  assert.ok(w4Hell.some((s) => s.kind === 'boss'));
});

test('Pure Gun Lv1..Lv10 progression for all 16 guns scales monotonically + Beacon aura buff', () => {
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

  const beaconGun: PlacedGun = {
    id: 'b1',
    col: 4,
    row: 4,
    type: 'beacon',
    level: 10,
    priority: 'first',
    chargeTimer: 0,
    aimAngle: 0,
    recoil: 0,
    totalDamageDealt: 0,
    kills: 0,
  };
  const allyBuff = computeBeaconBuffAtTile([beaconGun], 5, 4);
  assert.equal(allyBuff.speedMult, 1.45);
  assert.equal(allyBuff.damageMult, 1.38);

  const selfBuff = computeBeaconBuffAtTile([beaconGun], 4, 4);
  assert.equal(selfBuff.speedMult, 1);
  assert.equal(selfBuff.damageMult, 1);

  const farBuff = computeBeaconBuffAtTile([beaconGun], 11, 7);
  assert.equal(farBuff.speedMult, 1);

  const lv1Cost = getGunUpgradeCost('gatling', 1)!;
  const lv9Cost = getGunUpgradeCost('gatling', 9)!;
  assert.ok(lv9Cost > lv1Cost * 3);
  const investedLv3 = getGunTotalInvested('cryo', 3);
  const refundLv3 = getGunSellRefund({ type: 'cryo', level: 3 });
  assert.equal(refundLv3, Math.round(investedLv3 * 0.72));
});

test('Track-corridor confinement keeps pulled, displaced, and summoned enemies strictly inside path bounds', () => {
  const map = PRISM_MAPS[0]; // Segment 1: (0,2)->(3,2) horizontal at y = 160
  const seg0Start = gridToWorldCenter(map.path[0].col, map.path[0].row);
  const seg0End = gridToWorldCenter(map.path[1].col, map.path[1].row);

  // Repeated strong Lv10 Mortar pull (pullForce=40) from far BELOW the corridor must never pull enemy off-path
  const en = createEnemyForWave(1, 'scout', 4, map, false, 'normal');
  en.x = seg0Start.x + 80;
  en.y = seg0Start.y + 4;
  for (let i = 0; i < 12; i++) {
    pullEnemyAlongTrack(en, map, en.x - 40, seg0Start.y + 180, 40);
    assert.ok(
      Math.abs(en.y - seg0Start.y) <= MAX_CORRIDOR_LATERAL_PX,
      `Enemy drifted laterally off track y=${en.y} vs lane center ${seg0Start.y}`
    );
    assert.ok(en.x >= seg0Start.x && en.x <= seg0End.x, 'Enemy must remain clamped within segment longitudinal bounds');
  }

  // Displaced enemy near a corner must snap/steer cleanly inside corridor rather than cutting diagonally
  const cornerEn = createEnemyForWave(2, 'armored', 4, map, false, 'normal');
  cornerEn.x = seg0End.x - 10;
  cornerEn.y = seg0Start.y + 65; // simulate external displacement off track
  clampEnemyToTrackCorridor(cornerEn, map);
  assert.ok(Math.abs(cornerEn.y - seg0Start.y) <= MAX_CORRIDOR_LATERAL_PX);

  advanceEnemyAlongPath(cornerEn, map, 40);
  // After rounding corner to segment 2 (3,2)->(3,6), enemy x must stay within corridor of col 3
  assert.equal(cornerEn.waypointIndex, 2);
  assert.ok(
    Math.abs(cornerEn.x - seg0End.x) <= MAX_CORRIDOR_LATERAL_PX,
    `After turn, enemy x=${cornerEn.x} must follow vertical lane center ${seg0End.x}`
  );

  // Summoner spawn requests stay tightly inside track lane even on vertical/horizontal segments
  const summoner = createEnemyForWave(3, 'summoner', 5, map, false, 'normal');
  summoner.x = seg0Start.x + 60;
  summoner.y = seg0Start.y;
  summoner.abilityCooldown = 0.05;
  const resSummon = stepEnemies([summoner], map, 0.1);
  assert.equal(resSummon.outcome.spawnRequests.length, 2);
  for (const req of resSummon.outcome.spawnRequests) {
    assert.ok(
      Math.abs(req.y - seg0Start.y) <= MAX_CORRIDOR_LATERAL_PX,
      `Summoned scout y=${req.y} must stay inside lane center ${seg0Start.y}`
    );
  }
});

test('Rebalanced steeper wave spawns and all 12 enemy archetypes & abilities work cleanly', () => {
  const map = PRISM_MAPS[0];
  const wave1 = buildWaveSpawns(1, map.totalWaves, 'normal');
  const wave8 = buildWaveSpawns(8, 12, 'hard');
  assert.ok(wave1.length >= 20);
  assert.ok(wave8.length >= 52);
  assert.ok(wave8.some((s) => s.kind === 'boss'));
  assert.ok(wave8.some((s) => s.kind === 'berserker'));
  assert.ok(wave8.some((s) => s.kind === 'juggernaut'));
  assert.ok(wave8.some((s) => s.kind === 'summoner'));
  assert.ok(wave8.some((s) => s.kind === 'leech'));

  const scoutW1 = createEnemyForWave(1, 'scout', 1, map, false, 'normal');
  const scoutW5 = createEnemyForWave(2, 'scout', 5, map, false, 'normal');
  const bossW8 = createEnemyForWave(3, 'boss', 8, map, false, 'hard');
  assert.ok(scoutW5.maxHp > scoutW1.maxHp * 4, `Steeper per-wave scaling W5(${scoutW5.maxHp}) >> W1(${scoutW1.maxHp})`);
  assert.ok(bossW8.maxHp > 22000, `W8 Boss HP (${bossW8.maxHp}) should match intense mid-late difficulty`);
  assert.ok(bossW8.maxShield > 6500);

  // Armor pierce & brittle interaction
  const tank = createEnemyForWave(4, 'armored', 5, map, false, 'normal');
  tank.shield = 0;
  const startHp = tank.hp;
  const rawHit = applyDamageToEnemy(tank, 100, { armorPierce: 0 });
  const apHit = applyDamageToEnemy(tank, 100, { armorPierce: 1 });
  assert.ok(apHit.actualDamage > rawHit.actualDamage * 1.5);
  assert.ok(tank.hp < startHp);

  // Shield multiplier (Tesla/Plasma EMP)
  const aegis = createEnemyForWave(5, 'shieldbearer', 5, map, false, 'normal');
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

  // Berserker rage, Summoner spawnRequests, Leech EMP, Juggernaut core damage 3
  const berserker = createEnemyForWave(13, 'berserker', 5, map, false, 'normal');
  const origSpeed = berserker.speed;
  berserker.hp = Math.round(berserker.maxHp * 0.4);
  stepEnemies([berserker], map, 0.05);
  assert.equal(berserker.enraged, true);
  assert.ok(berserker.speed > origSpeed * 1.4);

  const leech = createEnemyForWave(15, 'leech', 5, map, false, 'normal');
  leech.abilityCooldown = 0.05;
  const resLeech = stepEnemies([leech], map, 0.1);
  assert.equal(resLeech.outcome.leechEvents.length, 1);

  const jugg = createEnemyForWave(16, 'juggernaut', 5, map, false, 'normal');
  const endPt = map.path[map.path.length - 1];
  jugg.waypointIndex = map.path.length - 1;
  jugg.x = endPt.col * 64 + 32;
  jugg.y = endPt.row * 64 + 32;
  const resJugg = stepEnemies([jugg], map, 0.2);
  assert.equal(resJugg.coreDamageTaken, 3);
});

test('All 16 guns unlock distinct Lv3/Lv5/Lv7/Lv10 combat profile milestones without broken ranges', () => {
  const gat10 = getGunCombatProfile('gatling', 10);
  assert.equal(gat10.projectilesPerShot, 5);
  assert.equal(gat10.armorPierce, 1);
  assert.ok(gat10.splashRadius > 0);

  const sg10 = getGunCombatProfile('shotgun', 10);
  assert.equal(sg10.projectilesPerShot, 11);
  assert.ok(sg10.burnDps > 0);
  assert.ok(sg10.rangePx <= 260, `Shotgun Lv10 rangePx=${sg10.rangePx} stays reachable by pellets`);

  const fl10 = getGunCombatProfile('flamer', 10);
  assert.ok(fl10.burnDps > 0 && fl10.slowPct > 0);

  const cr10 = getGunCombatProfile('cryo', 10);
  assert.ok(cr10.slowPct >= 0.65 && cr10.brittleBonus >= 0.42);

  const te10 = getGunCombatProfile('tesla', 10);
  assert.equal(te10.chainCount, 9);
  assert.equal(te10.splashRadius, 48);

  const mi10 = getGunCombatProfile('missile', 10);
  assert.equal(mi10.projectilesPerShot, 4);
  assert.ok(mi10.splashRadius >= 140);

  const rg7 = getGunCombatProfile('railgun', 7);
  const rg10 = getGunCombatProfile('railgun', 10);
  assert.ok(rg7.splashRadius >= 46);
  assert.equal(rg10.projectilesPerShot, 3);
  assert.equal(rg10.armorPierce, 1);

  const mo10 = getGunCombatProfile('mortar', 10);
  assert.equal(mo10.projectilesPerShot, 2);
  assert.ok(mo10.pullForce > 20);

  const sn10 = getGunCombatProfile('sniper', 10);
  assert.equal(sn10.projectilesPerShot, 2);
  assert.equal(sn10.armorPierce, 1);

  const ac10 = getGunCombatProfile('acid', 10);
  assert.equal(ac10.projectilesPerShot, 2);
  assert.equal(ac10.slowPct, 0.45);

  const saw10 = getGunCombatProfile('saw', 10);
  assert.equal(saw10.projectilesPerShot, 3);
  assert.equal(saw10.chainCount, 11);

  const cn10 = getGunCombatProfile('cannon', 10);
  assert.equal(cn10.projectilesPerShot, 3);
  assert.equal(cn10.splashRadius, 105);

  const pl10 = getGunCombatProfile('plasma', 10);
  assert.equal(pl10.projectilesPerShot, 3);
  assert.equal(pl10.shieldMult, 2.4);

  const cl10 = getGunCombatProfile('cluster', 10);
  assert.equal(cl10.projectilesPerShot, 3);
  assert.equal(cl10.splashRadius, 128);

  const hu10 = getGunCombatProfile('hunter', 10);
  assert.equal(hu10.projectilesPerShot, 5);
  assert.equal(hu10.armorPierce, 1);
  assert.equal(hu10.splashRadius, 24);
});


