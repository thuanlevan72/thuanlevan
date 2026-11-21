import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceEnemyAlongPath,
  applyDamageToEnemy,
  BIOME_PALETTES,
  boostEnemyKillReward,
  buildWaveSpawns,
  clampEnemyToTrackCorridor,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  computeBeaconBuffAtTile,
  computeTeamSupportBuffAtTile,
  createEnemyForWave,
  ENEMY_KILL_COIN_BOOST,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  GAME_MODE_CONFIGS,
  GAME_MODE_ORDER,
  getAvailableGunsForMap,
  getEffectiveMapSetup,
  getExclusiveGunForMap,
  getGunCombatProfile,
  getGunSellRefund,
  getGunTotalInvested,
  getGunUpgradeCost,
  getMapPathTileSet,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  GUN_CATALOG,
  MAX_CORRIDOR_LATERAL_PX,
  MAX_GUN_LEVEL,
  PlacedGun,
  PRISM_MAPS,
  pullEnemyAlongTrack,
  stepEnemies,
  TILE_SIZE,
} from './prismTdEngine.ts';
import { playOverheatSkillSfx, playPrismSfx } from './prismTdSound.ts';

test('PRISM_MAPS define 16 valid 16x10 tactical maps with doubled waves (16..36), 39 guns Lv10 (23 global + 16 exclusive), and 8 modes', () => {
  assert.equal(PRISM_MAPS.length, 16);
  assert.equal(GRID_COLS, 16);
  assert.equal(GRID_ROWS, 10);
  assert.equal(TILE_SIZE, 56);
  assert.equal(CANVAS_WIDTH, 896);
  assert.equal(CANVAS_HEIGHT, 560);

  assert.equal(GUN_CATALOG.length, 39);
  const globalGuns = GUN_CATALOG.filter((g) => !g.exclusiveMapId);
  const exclusiveGuns = GUN_CATALOG.filter((g) => Boolean(g.exclusiveMapId));
  assert.equal(globalGuns.length, 23);
  assert.equal(exclusiveGuns.length, 16);

  assert.equal(MAX_GUN_LEVEL, 10);
  assert.deepEqual(DIFFICULTY_ORDER, ['easy', 'normal', 'hard', 'hell']);
  assert.deepEqual(GAME_MODE_ORDER, [
    'campaign',
    'blitz',
    'boss_rush',
    'endless',
    'overheat_fury',
    'iron_fortress',
    'tactical_tycoon',
    'chaos_swarm',
  ]);
  assert.ok(GAME_MODE_CONFIGS.blitz.speedMult > 1);
  assert.ok(GAME_MODE_CONFIGS.boss_rush.startEnergyMult >= 2);
  assert.equal(GAME_MODE_CONFIGS.overheat_fury.heatMult, 2.2);
  assert.equal(GAME_MODE_CONFIGS.iron_fortress.coreHpMult, 1.5);
  assert.equal(GAME_MODE_CONFIGS.tactical_tycoon.startEnergyMult, 1.85);
  assert.equal(GAME_MODE_CONFIGS.chaos_swarm.swarmCountMult, 1.45);

  assert.equal(DIFFICULTY_CONFIGS.easy.hpMult, 1.11);
  assert.equal(DIFFICULTY_CONFIGS.normal.hpMult, 1.66);
  assert.equal(DIFFICULTY_CONFIGS.hard.hpMult, 2.44);
  assert.equal(DIFFICULTY_CONFIGS.hell.hpMult, 3.55);

  const seenExclusiveTypes = new Set<string>();
  for (const map of PRISM_MAPS) {
    assert.equal(map.cols, 16);
    assert.equal(map.rows, 10);
    assert.ok(BIOME_PALETTES[map.biome]);
    assert.ok(DIFFICULTY_CONFIGS[map.recommendedDifficulty]);
    assert.ok(map.totalWaves >= 16 && map.totalWaves <= 36, `${map.id} waves should be 16..36 (2x duration)`);
    const pathSet = getMapPathTileSet(map);
    assert.ok(pathSet.size >= 18);
    assert.equal(getTileKind(map, map.path[0].col, map.path[0].row), 'spawn');
    assert.equal(
      getTileKind(map, map.path[map.path.length - 1].col, map.path[map.path.length - 1].row),
      'core'
    );
    for (const w of map.walls) {
      assert.equal(pathSet.has(`${w.col},${w.row}`), false);
    }

    // Verify orthogonal continuity across every path waypoint
    for (let i = 1; i < map.path.length; i++) {
      const a = map.path[i - 1];
      const b = map.path[i];
      assert.ok(
        a.col === b.col || a.row === b.row,
        `${map.id} segment ${i - 1}->${i} must be orthogonal`
      );
      assert.ok(b.col >= 0 && b.col < 16 && b.row >= 0 && b.row < 10);
    }

    // Verify exclusive map gun isolation (23 global + 1 map-exclusive = 24 total)
    const exGun = getExclusiveGunForMap(map.id);
    assert.ok(exGun, `${map.id} must have an exclusive gun`);
    assert.equal(seenExclusiveTypes.has(exGun.type), false, `Duplicate exclusive gun ${exGun.type}`);
    seenExclusiveTypes.add(exGun.type);

    const available = getAvailableGunsForMap(map.id);
    assert.equal(available.length, 24, `${map.id} should unlock 23 global + 1 exclusive gun`);
    assert.equal(available[0].type, exGun.type);
    const otherExclusiveCount = available.filter((g) => g.exclusiveMapId && g.exclusiveMapId !== map.id).length;
    assert.equal(otherExclusiveCount, 0, `${map.id} must NOT expose other maps' exclusive guns`);
  }
});

test('Doubled campaign wave counts (16..42), 8 game modes scaling, steeper per-wave difficulty, and winnable Hell W1', () => {
  const map = PRISM_MAPS[0];
  const setupEasy = getEffectiveMapSetup(map, 'easy', 'campaign');
  const setupNormal = getEffectiveMapSetup(map, 'normal', 'campaign');
  const setupHard = getEffectiveMapSetup(map, 'hard', 'campaign');
  const setupHell = getEffectiveMapSetup(map, 'hell', 'campaign');

  assert.equal(setupEasy.totalWaves, 16);
  assert.equal(setupNormal.totalWaves, 18);
  assert.equal(setupHard.totalWaves, 20);
  assert.equal(setupHell.totalWaves, 22);

  assert.ok(setupEasy.startCoreHp > setupNormal.startCoreHp);
  assert.ok(setupNormal.startCoreHp > setupHard.startCoreHp);
  assert.ok(setupHard.startCoreHp > setupHell.startCoreHp);

  assert.ok(setupEasy.startEnergy > setupNormal.startEnergy);
  assert.ok(setupNormal.startEnergy > setupHard.startEnergy);
  assert.ok(setupHard.startEnergy > setupHell.startEnergy);

  const setupBlitz = getEffectiveMapSetup(map, 'normal', 'blitz');
  const setupBossRush = getEffectiveMapSetup(map, 'normal', 'boss_rush');
  const setupIron = getEffectiveMapSetup(map, 'normal', 'iron_fortress');
  const setupTycoon = getEffectiveMapSetup(map, 'normal', 'tactical_tycoon');
  assert.ok(setupBlitz.totalWaves < setupNormal.totalWaves);
  assert.ok(setupBossRush.startEnergy > setupNormal.startEnergy * 2);
  assert.ok(setupIron.startCoreHp >= Math.round(setupNormal.startCoreHp * 1.45));
  assert.ok(setupTycoon.startEnergy >= Math.round(setupNormal.startEnergy * 1.65));

  // Verify wave spans and chaos_swarm density multiplier
  const w1Normal = buildWaveSpawns(1, setupNormal.totalWaves, 'normal', 'campaign');
  const w5Normal = buildWaveSpawns(5, setupNormal.totalWaves, 'normal', 'campaign');
  const w8Normal = buildWaveSpawns(8, setupNormal.totalWaves, 'normal', 'campaign');
  const w1Swarm = buildWaveSpawns(1, setupNormal.totalWaves, 'normal', 'chaos_swarm');
  assert.ok(
    w1Swarm.length > Math.round(w1Normal.length * 1.35),
    `chaos_swarm W1 count (${w1Swarm.length}) should greatly exceed campaign (${w1Normal.length})`
  );

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
  assert.equal(hellMap16.totalWaves, 42);

  const w4Easy = buildWaveSpawns(4, setupEasy.totalWaves, 'easy', 'campaign');
  const w4Hell = buildWaveSpawns(4, setupHell.totalWaves, 'hell', 'campaign');
  assert.ok(w4Hell.length > w4Easy.length);
  assert.ok(w4Hell.some((s) => s.kind === 'boss'));
});

test('Pure Gun Lv1..Lv10 progression for all 39 guns scales monotonically + Alpha/Omega variants + 39 unique Overheat skills', () => {
  const overheatKeys = new Set<string>();
  for (const gun of GUN_CATALOG) {
    assert.equal(gun.milestones.length, 4);
    assert.ok(gun.overheatSkill.key.length > 0);
    assert.ok(gun.overheatSkill.heatPerShot > 0);
    assert.equal(overheatKeys.has(gun.overheatSkill.key), false, `Duplicate overheat key: ${gun.overheatSkill.key}`);
    overheatKeys.add(gun.overheatSkill.key);

    let prevDps = 0;
    let prevDmg = 0;

    for (let lv = 1; lv <= MAX_GUN_LEVEL; lv++) {
      const profile = getGunCombatProfile(gun.type, lv, 'alpha');
      const omegaProfile = getGunCombatProfile(gun.type, lv, 'omega');
      assert.equal(profile.level, lv);
      assert.equal(profile.variant, 'alpha');
      assert.equal(omegaProfile.variant, 'omega');
      assert.ok(profile.damage > prevDmg, `${gun.type} lv${lv} damage should increase`);
      assert.ok(profile.dpsEstimate > prevDps, `${gun.type} lv${lv} dps should increase`);
      assert.notEqual(
        `${profile.damage}:${profile.cooldownSec}:${profile.rangeTiles}`,
        `${omegaProfile.damage}:${omegaProfile.cooldownSec}:${omegaProfile.rangeTiles}`,
        `${gun.type} alpha vs omega variant stats must differ`
      );
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
  assert.equal(overheatKeys.size, 39);

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
  assert.equal(allyBuff.speedMult, 1.3);
  assert.equal(allyBuff.damageMult, 1.24);

  const selfBuff = computeBeaconBuffAtTile([beaconGun], 4, 4);
  assert.equal(selfBuff.speedMult, 1);
  assert.equal(selfBuff.damageMult, 1);

  const farBuff = computeBeaconBuffAtTile([beaconGun], 11, 7);
  assert.equal(farBuff.speedMult, 1);

  const ampGun: PlacedGun = { ...beaconGun, id: 'amp1', col: 5, row: 5, type: 'amp_spire', variant: 'omega' };
  const radarGun: PlacedGun = { ...beaconGun, id: 'rad1', col: 6, row: 4, type: 'radar', variant: 'alpha' };
  const aegisGun: PlacedGun = { ...beaconGun, id: 'aeg1', col: 4, row: 3, type: 'aegis_field', variant: 'omega' };
  const teamBuff = computeTeamSupportBuffAtTile([beaconGun, ampGun, radarGun, aegisGun], 5, 4);
  assert.equal(teamBuff.hasSupportLink, true);
  assert.ok(teamBuff.speedMult > 1.3 && teamBuff.speedMult <= 1.55);
  assert.ok(teamBuff.damageMult > 1.24 && teamBuff.damageMult <= 1.45);
  assert.ok(teamBuff.rangeBonusTiles >= 0.85);
  assert.ok(teamBuff.armorPierceBonus >= 0.4);
  assert.ok(teamBuff.shieldMultBonus >= 0.55);
  assert.ok(teamBuff.heatCoolMult >= 1.25);

  const lv1Cost = getGunUpgradeCost('gatling', 1)!;
  const lv9Cost = getGunUpgradeCost('gatling', 9)!;
  assert.ok(lv9Cost > lv1Cost * 3);
  const investedLv3 = getGunTotalInvested('cryo', 3);
  const refundLv3 = getGunSellRefund({ type: 'cryo', level: 3 });
  assert.equal(refundLv3, Math.round(investedLv3 * 0.72));
});

test('Track-corridor confinement keeps pulled, displaced, and summoned enemies strictly inside path bounds', () => {
  const map = PRISM_MAPS[0]; // Segment 1: (0,2)->(4,2) horizontal
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
  // After rounding corner to segment 2 (4,2)->(4,7), enemy x must stay within corridor of col 4
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
  const endCenter = gridToWorldCenter(endPt.col, endPt.row);
  jugg.waypointIndex = map.path.length - 1;
  jugg.x = endCenter.x;
  jugg.y = endCenter.y;
  const resJugg = stepEnemies([jugg], map, 0.2);
  assert.equal(resJugg.coreDamageTaken, 3);
});

test('All 23 global + 16 exclusive guns unlock distinct Lv3/Lv5/Lv7/Lv10 combat profile milestones', () => {
  const gat10 = getGunCombatProfile('gatling', 10);
  assert.equal(gat10.projectilesPerShot, 4);
  assert.ok(gat10.armorPierce >= 0.75);
  assert.ok(gat10.splashRadius > 0);

  const sg10 = getGunCombatProfile('shotgun', 10);
  assert.ok(sg10.projectilesPerShot >= 9);
  assert.ok(sg10.burnDps > 0);
  assert.ok(sg10.rangePx <= 275, `Shotgun Lv10 rangePx=${sg10.rangePx} stays reachable by pellets`);

  const fl10 = getGunCombatProfile('flamer', 10);
  assert.ok(fl10.burnDps > 0 && fl10.slowPct > 0);

  const cr10 = getGunCombatProfile('cryo', 10);
  assert.ok(cr10.slowPct >= 0.42 && cr10.slowPct <= 0.45);
  assert.ok(cr10.brittleBonus >= 0.22 && cr10.brittleBonus <= 0.25);

  const te10 = getGunCombatProfile('tesla', 10);
  assert.ok(te10.chainCount >= 7);
  assert.ok(te10.splashRadius >= 38);

  const mi10 = getGunCombatProfile('missile', 10);
  assert.ok(mi10.projectilesPerShot >= 3);
  assert.ok(mi10.splashRadius >= 110 && mi10.splashRadius <= 135);

  const rg7 = getGunCombatProfile('railgun', 7);
  const rg10 = getGunCombatProfile('railgun', 10);
  assert.ok(rg7.splashRadius >= 36);
  assert.ok(rg10.projectilesPerShot >= 3);
  assert.equal(rg10.armorPierce, 1);

  const mo10 = getGunCombatProfile('mortar', 10);
  assert.ok(mo10.projectilesPerShot >= 2);
  assert.ok(mo10.pullForce >= 18 && mo10.pullForce <= 22);

  const sn10 = getGunCombatProfile('sniper', 10);
  assert.ok(sn10.projectilesPerShot >= 2);
  assert.equal(sn10.armorPierce, 1);

  const ac10 = getGunCombatProfile('acid', 10);
  assert.ok(ac10.projectilesPerShot >= 2);
  assert.equal(ac10.slowPct, 0.34);

  const saw10 = getGunCombatProfile('saw', 10);
  assert.ok(saw10.projectilesPerShot >= 3);
  assert.ok(saw10.chainCount >= 7);

  const cn10 = getGunCombatProfile('cannon', 10);
  assert.ok(cn10.projectilesPerShot >= 3);
  assert.ok(cn10.splashRadius >= 82);

  const pl10 = getGunCombatProfile('plasma', 10);
  assert.ok(pl10.projectilesPerShot >= 3);
  assert.ok(pl10.shieldMult >= 1.95);

  const cl10 = getGunCombatProfile('cluster', 10);
  assert.ok(cl10.projectilesPerShot >= 3);
  assert.ok(cl10.splashRadius >= 102);

  const hu10 = getGunCombatProfile('hunter', 10);
  assert.ok(hu10.projectilesPerShot >= 4);
  assert.ok(hu10.armorPierce >= 0.85);
  assert.equal(hu10.splashRadius, 20);

  const pr10 = getGunCombatProfile('prism_laser', 10, 'alpha');
  const pr10Omega = getGunCombatProfile('prism_laser', 10, 'omega');
  assert.equal(pr10.chainCount, 8);
  assert.ok(pr10Omega.damage > pr10.damage);
  assert.equal(pr10Omega.armorPierce, 1);

  const tmp10 = getGunCombatProfile('tempest', 10, 'omega');
  assert.equal(tmp10.projectilesPerShot, 3);
  assert.ok(tmp10.shieldMult >= 1.9);
  assert.ok(tmp10.splashRadius >= 90);

  const sonic10 = getGunCombatProfile('sonic', 10, 'alpha');
  const grav10 = getGunCombatProfile('gravity_lance', 10, 'omega');
  const sov10 = getGunCombatProfile('map16_void_sovereign', 10, 'omega');
  assert.ok(sonic10.splashRadius > 50);
  assert.ok(grav10.armorPierce >= 0.9);
  assert.ok(sov10.damage > 100);
});

test('Anti-permafreeze & gun balance: stacked CC never halts enemies and Boss/Juggernaut resist pull', () => {
  const map = PRISM_MAPS[0]; // horizontal segment (0,2)->(3,2)
  const cases: Array<{ kind: 'scout' | 'armored' | 'boss' | 'juggernaut'; floor: number }> = [
    { kind: 'scout', floor: 0.48 },
    { kind: 'armored', floor: 0.48 },
    { kind: 'boss', floor: 0.55 },
    { kind: 'juggernaut', floor: 0.62 },
  ];

  for (const c of cases) {
    const en = createEnemyForWave(1, c.kind, 5, map, false, 'normal');
    const startX = en.x;
    en.slowTimer = 5;
    en.slowFactor = 0.2; // extreme slow attempt
    en.stunTimer = 2; // stagger interrupt attempt
    stepEnemies([en], map, 0.25);
    const moved = en.x - startX;
    const minExpected = en.speed * c.floor * 0.25 - 0.05;
    assert.ok(
      moved >= minExpected,
      `${c.kind} moved ${moved.toFixed(2)}px under stacked slow+stun, expected >= ${minExpected.toFixed(2)}px (never frozen)`
    );
  }

  // Pull clamping & heavy unit pull immunity
  const boss = createEnemyForWave(2, 'boss', 5, map, false, 'normal');
  boss.x += 90;
  const bossBeforeX = boss.x;
  pullEnemyAlongTrack(boss, map, boss.x - 60, boss.y, 40);
  assert.equal(boss.x, bossBeforeX, 'Boss must resist vortex pull');

  const jugg = createEnemyForWave(3, 'juggernaut', 5, map, false, 'normal');
  jugg.x += 90;
  const juggBeforeX = jugg.x;
  pullEnemyAlongTrack(jugg, map, jugg.x - 60, jugg.y, 40);
  assert.equal(jugg.x, juggBeforeX, 'Juggernaut must resist vortex pull');

  const scout = createEnemyForWave(4, 'scout', 5, map, false, 'normal');
  scout.x += 90;
  const scoutBeforeX = scout.x;
  pullEnemyAlongTrack(scout, map, scout.x - 80, scout.y, 40);
  assert.ok(scoutBeforeX - scout.x <= 18.01, 'Standard enemy pull displacement must stay capped at <= 18px');

  // Rebalanced DPS ceiling check
  for (const g of GUN_CATALOG) {
    const p10 = getGunCombatProfile(g.type, 10);
    assert.ok(p10.dpsEstimate < 1400, `${g.type} Lv10 DPS=${p10.dpsEstimate} stays balanced (<1400)`);
  }
});

test('Late-wave swarm and power surge: waves become dramatically denser and stronger from Wave 2 onward', () => {
  const map = PRISM_MAPS[0];
  const w1 = buildWaveSpawns(1, 10, 'normal', 'campaign');
  const w4 = buildWaveSpawns(4, 10, 'normal', 'campaign');
  const w8 = buildWaveSpawns(8, 10, 'normal', 'campaign');
  const w10 = buildWaveSpawns(10, 10, 'normal', 'campaign');

  assert.ok(w4.length >= 135, `W4 should have >= 135 enemies, got ${w4.length}`);
  assert.ok(w8.length >= 300, `W8 should swarm with >= 300 enemies, got ${w8.length}`);
  assert.ok(w10.length > w8.length, 'W10 must be denser than W8');

  const w8Bosses = w8.filter((s) => s.kind === 'boss').length;
  const w8Elites = w8.filter((s) => s.isElite).length;
  assert.ok(w8Bosses >= 4, `W8 should field >= 4 bosses, got ${w8Bosses}`);
  assert.ok(w8Elites >= 50, `W8 should field >= 50 elites, got ${w8Elites}`);

  const s1 = createEnemyForWave(1, 'scout', 1, map, false, 'normal');
  const s4 = createEnemyForWave(2, 'scout', 4, map, false, 'normal');
  const s8 = createEnemyForWave(3, 'scout', 8, map, false, 'normal');
  const boss8 = createEnemyForWave(4, 'boss', 8, map, false, 'normal');

  assert.ok(s4.maxHp > s1.maxHp * 3.5);
  assert.ok(s8.maxHp > s4.maxHp * 3.0);
  assert.ok(s8.speed > s1.speed + 20);
  assert.ok(boss8.maxHp > 65000, `W8 Boss HP=${boss8.maxHp} should threaten Lv10 defenses`);
});

test('Enemy kill coin rewards increase by 10% across all 12 enemy archetypes', () => {
  const map = PRISM_MAPS[0];
  assert.equal(ENEMY_KILL_COIN_BOOST, 1.1);
  assert.equal(boostEnemyKillReward(10), 11);
  assert.equal(boostEnemyKillReward(30), 33);
  assert.equal(boostEnemyKillReward(7), 8);

  const kinds = [
    'scout',
    'armored',
    'splitter',
    'stealth',
    'healer',
    'teleporter',
    'shieldbearer',
    'boss',
    'berserker',
    'juggernaut',
    'summoner',
    'leech',
  ] as const;

  for (const kind of kinds) {
    const e1 = createEnemyForWave(1, kind, 1, map, false, 'normal', 'campaign');
    const e6 = createEnemyForWave(2, kind, 6, map, false, 'normal', 'campaign');
    assert.ok(e1.reward >= 7, `${kind} W1 boosted reward (${e1.reward}) >= 7`);
    assert.ok(e6.reward >= e1.reward, `${kind} W6 reward (${e6.reward}) >= W1 (${e1.reward})`);
  }

  const bossW1 = createEnemyForWave(3, 'boss', 1, map, false, 'normal', 'campaign');
  assert.ok(bossW1.reward >= 33, `Boss W1 reward (${bossW1.reward}) includes +10% floor (>= 33)`);
});

test('prismTdSound synthesizes compressor+shaper bus, enforces polyphony budget, guards suspended state, and covers 39 guns + 39 Overheat skills', () => {
  let oscCount = 0;
  let noiseSrcCount = 0;
  let filterCount = 0;
  let compressorCount = 0;
  let shaperCount = 0;
  let bufferCount = 0;
  const maxSubOscFreqs: number[] = [];

  const makeParam = () => ({
    setValueAtTime: (v: number) => {
      maxSubOscFreqs.push(v);
    },
    setTargetAtTime: () => {},
    linearRampToValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
  });

  const makeMockCtx = (state: 'running' | 'suspended' = 'running') =>
    ({
      sampleRate: 44100,
      currentTime: 0,
      state,
      destination: {},
      resume: async () => {},
      createBuffer: (_c: number, length: number) => {
        bufferCount++;
        return {
          getChannelData: () => new Float32Array(length),
        };
      },
      createWaveShaper: () => {
        shaperCount++;
        return {
          curve: null,
          oversample: 'none',
          connect: () => {},
        };
      },
      createDynamicsCompressor: () => {
        compressorCount++;
        return {
          threshold: makeParam(),
          knee: makeParam(),
          ratio: makeParam(),
          attack: makeParam(),
          release: makeParam(),
          connect: () => {},
        };
      },
      createGain: () => ({
        gain: makeParam(),
        connect: () => {},
      }),
      createOscillator: () => {
        oscCount++;
        return {
          type: 'sine',
          frequency: {
            setValueAtTime: (v: number) => {
              maxSubOscFreqs.push(v);
            },
            exponentialRampToValueAtTime: () => {},
          },
          connect: () => {},
          start: () => {},
          stop: () => {},
        };
      },
      createBufferSource: () => {
        noiseSrcCount++;
        return {
          buffer: null,
          playbackRate: makeParam(),
          connect: () => {},
          start: () => {},
          stop: () => {},
        };
      },
      createBiquadFilter: () => {
        filterCount++;
        return {
          type: 'lowpass',
          frequency: makeParam(),
          Q: makeParam(),
          connect: () => {},
        };
      },
    }) as unknown as AudioContext;

  // 1. Suspended context guard: passive gunfire must NOT pile up backlog while AudioContext is suspended
  const suspendedRef = { current: makeMockCtx('suspended') };
  playPrismSfx('gatling', true, suspendedRef);
  assert.equal(noiseSrcCount, 0, 'Suspended AudioContext must not buffer/backlog combat gunfire');

  // 2. Polyphony burst protection when all 36 guns + Overheat ultimates fire in same 0ms frame
  const burstRef = { current: makeMockCtx('running') };
  for (const gun of GUN_CATALOG) {
    playPrismSfx(gun.type, true, burstRef);
    playOverheatSkillSfx(gun.overheatSkill.key, gun.type, true, burstRef);
  }
  assert.equal(compressorCount, 1, 'Exactly one master DynamicsCompressor per AudioContext');
  assert.equal(shaperCount, 1, 'Exactly one soft-clipper WaveShaper per AudioContext');
  assert.equal(bufferCount, 8, 'Pre-bakes 8 normalized acoustic Foley/noise buffers once');
  assert.ok(
    noiseSrcCount <= 16,
    `Global polyphony budget must cap simultaneous 0ms gunfire/overheat voices, got ${noiseSrcCount}`
  );

  // 3. Full spaced verification across every one of 36 guns & 36 Overheat skill keys + UI cues
  const origPerfNow = performance.now.bind(performance);
  let fakeNow = 10_000;
  (performance as { now: () => number }).now = () => {
    fakeNow += 400;
    return fakeNow;
  };
  try {
    const cleanRef = { current: makeMockCtx('running') };
    const beforeNoise = noiseSrcCount;
    for (const gun of GUN_CATALOG) {
      const preN = noiseSrcCount;
      const preO = oscCount;
      playPrismSfx(gun.type, true, cleanRef);
      assert.ok(
        noiseSrcCount > preN || oscCount > preO,
        `Weapon ${gun.type} must emit acoustic Foley or tone`
      );
      const preSkillN = noiseSrcCount;
      const preSkillO = oscCount;
      playOverheatSkillSfx(gun.overheatSkill.key, gun.type, true, cleanRef);
      assert.ok(
        noiseSrcCount > preSkillN || oscCount > preSkillO,
        `Overheat skill ${gun.overheatSkill.key} must emit audio`
      );
    }
    for (const uiFx of ['place', 'select', 'upgrade', 'variant', 'sell', 'explosion', 'kill', 'wave', 'overdrive', 'hurt', 'victory', 'defeat'] as const) {
      playPrismSfx(uiFx, true, cleanRef);
    }
    assert.ok(noiseSrcCount - beforeNoise >= 74, 'All 39 guns + 39 Overheat skills + UI cues produce clean Foley layers');
    assert.ok(filterCount >= noiseSrcCount - 10);

    // Muted flag check
    const preMutedOsc = oscCount;
    const preMutedNoise = noiseSrcCount;
    playPrismSfx('overdrive', false, cleanRef);
    assert.equal(oscCount, preMutedOsc);
    assert.equal(noiseSrcCount, preMutedNoise);
  } finally {
    (performance as { now: () => number }).now = origPerfNow;
  }
});
