import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceEnemyAlongPath,
  applyDamageToEnemy,
  BIOME_PALETTES,
  boostEnemyKillReward,
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clampEnemyToTrackCorridor,
  computeBeaconBuffAtTile,
  computeChronoFieldRecord,
  computeElectricWetSynergy,
  computeOverdriveChargeGain,
  computeSingularitySwallowGrowth,
  computeTeamSupportBuffAtTile,
  createEnemyForWave,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  ENEMY_KILL_COIN_BOOST,
  GAME_MODE_CONFIGS,
  GAME_MODE_ORDER,
  getAvailableGunsForMap,
  getChronosMaxFields,
  getEffectiveMapSetup,
  getGunCatalogItem,
  getGunCategory,
  getGunCombatProfile,
  getGunSellRefund,
  getGunTotalInvested,
  getGunUpgradeCost,
  getMapPathTileSet,
  getMothershipMaxDrones,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  GUN_CATALOG,
  interruptEnemyWindup,
  isElectricGunType,
  isSupportGunType,
  isWetZoneTile,
  MAX_CORRIDOR_LATERAL_PX,
  MAX_GUN_LEVEL,
  OVERDRIVE_CONFIG,
  PlacedGun,
  PRISM_MAPS,
  pullEnemyAlongTrack,
  shouldDroneEvadeBossPulse,
  stepEnemies,
  TILE_SIZE,
  validateMapPathNonIntersecting,
} from './prismTdEngine.ts';
import { playOverheatSkillSfx, playPrismSfx } from './prismTdSound.ts';

test('PRISM_MAPS define 18 non-intersecting 16x10 maps with wetZones, tacticalHint, 17 consolidated guns, and 8 modes', () => {
  assert.equal(PRISM_MAPS.length, 18);
  assert.equal(GRID_COLS, 16);
  assert.equal(GRID_ROWS, 10);
  assert.equal(TILE_SIZE, 56);
  assert.equal(CANVAS_WIDTH, 896);
  assert.equal(CANVAS_HEIGHT, 560);

  assert.equal(GUN_CATALOG.length, 17);
  const attackGuns = GUN_CATALOG.filter((g) => g.category === 'attack');
  const electricGuns = GUN_CATALOG.filter((g) => g.category === 'electric');
  const supportGuns = GUN_CATALOG.filter((g) => g.category === 'support');
  assert.equal(attackGuns.length, 12);
  assert.equal(electricGuns.length, 2);
  assert.equal(supportGuns.length, 3);
  assert.equal(isElectricGunType('tesla'), true);
  assert.equal(isElectricGunType('tempest'), true);
  assert.equal(isElectricGunType('gatling'), false);
  assert.equal(isSupportGunType('beacon'), true);
  assert.equal(isSupportGunType('cryo'), true);
  assert.equal(isSupportGunType('radar'), true);
  assert.equal(isSupportGunType('tesla'), false);
  assert.equal(isSupportGunType('orbital'), false);
  assert.equal(isSupportGunType('singularity'), false);
  assert.equal(isSupportGunType('mothership'), false);
  assert.equal(isSupportGunType('supernova'), false);
  assert.equal(isSupportGunType('chronos'), false);

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

  for (const map of PRISM_MAPS) {
    assert.equal(map.cols, 16);
    assert.equal(map.rows, 10);
    assert.ok(BIOME_PALETTES[map.biome]);
    assert.ok(DIFFICULTY_CONFIGS[map.recommendedDifficulty]);
    assert.ok(map.totalWaves >= 16 && map.totalWaves <= 40, `${map.id} waves should be 16..40`);
    assert.ok(map.tacticalHint.length > 10, `${map.id} must define a tacticalHint`);
    assert.ok(map.wetZones.length >= 2, `${map.id} must define >= 2 conductive wetZones`);
    assert.equal(
      validateMapPathNonIntersecting(map),
      true,
      `${map.id} path/walls/wetZones must be non-intersecting and valid`
    );

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
    for (const wz of map.wetZones) {
      assert.equal(isWetZoneTile(map, wz.col, wz.row), true);
      assert.equal(pathSet.has(`${wz.col},${wz.row}`), true, `${map.id} wetZone must sit on track`);
    }

    const available = getAvailableGunsForMap(map.id);
    assert.equal(available.length, 17, `${map.id} should expose all 17 consolidated guns`);
  }
});

test('Campaign wave counts, 8 modes scaling, late-game Super Boss waves, and Hell W1 balance', () => {
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

  const setupBlitz = getEffectiveMapSetup(map, 'normal', 'blitz');
  const setupBossRush = getEffectiveMapSetup(map, 'normal', 'boss_rush');
  const setupIron = getEffectiveMapSetup(map, 'normal', 'iron_fortress');
  const setupTycoon = getEffectiveMapSetup(map, 'normal', 'tactical_tycoon');
  assert.ok(setupBlitz.totalWaves < setupNormal.totalWaves);
  assert.ok(setupBossRush.startEnergy > setupNormal.startEnergy * 2);
  assert.ok(setupIron.startCoreHp >= Math.round(setupNormal.startCoreHp * 1.45));
  assert.ok(setupTycoon.startEnergy >= Math.round(setupNormal.startEnergy * 1.65));

  const w1Normal = buildWaveSpawns(1, setupNormal.totalWaves, 'normal', 'campaign');
  const w1Swarm = buildWaveSpawns(1, setupNormal.totalWaves, 'normal', 'chaos_swarm');
  assert.ok(w1Swarm.length > Math.round(w1Normal.length * 1.35));

  const finalCampaignWave = buildWaveSpawns(setupNormal.totalWaves, setupNormal.totalWaves, 'normal', 'campaign');
  assert.ok(
    finalCampaignWave.some((s) => s.kind === 'super_boss'),
    'Final campaign wave must deploy Super Boss'
  );

  const endlessW5 = buildWaveSpawns(5, 999, 'normal', 'endless');
  assert.ok(endlessW5.some((s) => s.kind === 'super_boss'), 'Endless Wave 5 must deploy Super Boss');

  const w1BossRush = buildWaveSpawns(1, setupBossRush.totalWaves, 'normal', 'boss_rush');
  const w4BossRush = buildWaveSpawns(4, setupBossRush.totalWaves, 'normal', 'boss_rush');
  assert.ok(w1BossRush.some((s) => s.kind === 'boss'));
  assert.ok(w4BossRush.some((s) => s.kind === 'super_boss'));

  const w1Hell = buildWaveSpawns(1, setupHell.totalWaves, 'hell', 'campaign');
  const w1TotalHp = w1Hell.reduce(
    (sum, item, idx) =>
      sum + createEnemyForWave(idx + 1, item.kind, 1, map, item.isElite, 'hell', 'campaign').maxHp,
    0
  );
  assert.ok(w1TotalHp > 7500 && w1TotalHp < 15500, `Hell W1 total HP=${w1TotalHp} should stay balanced`);

  const hellMap16 = getEffectiveMapSetup(PRISM_MAPS[15], 'hell', 'campaign');
  assert.equal(hellMap16.totalWaves, 42);

  const map17 = PRISM_MAPS[16];
  assert.equal(map17.id, 'sector-17');
  assert.equal(map17.biome, 'prismatic_nexus');
  assert.equal(map17.wetZones.length, 4);
  for (const diff of DIFFICULTY_ORDER) {
    const setup17 = getEffectiveMapSetup(map17, diff, 'campaign');
    assert.ok(
      setup17.startEnergy >= 500,
      `sector-17 (${diff}) startEnergy=${setup17.startEnergy} must allow Wave 1 deployment of 500⚡ supernova`
    );
  }
  const hellMap17 = getEffectiveMapSetup(map17, 'hell', 'campaign');
  assert.equal(hellMap17.totalWaves, 44);

  const map18 = PRISM_MAPS[17];
  assert.equal(map18.id, 'sector-18');
  assert.equal(map18.biome, 'chrono_sanctum');
  assert.equal(map18.wetZones.length, 5);
  assert.ok(getMapPathTileSet(map18).size >= 55);
  for (const diff of DIFFICULTY_ORDER) {
    const setup18 = getEffectiveMapSetup(map18, diff, 'campaign');
    assert.ok(
      setup18.startEnergy >= 800,
      `sector-18 (${diff}) startEnergy=${setup18.startEnergy} must allow Wave 1 deployment of 800⚡ chronos`
    );
  }
  const hellMap18 = getEffectiveMapSetup(map18, 'hell', 'campaign');
  assert.equal(hellMap18.totalWaves, 46);
});

test('17-gun Lv1..Lv10 progression, pure 0-damage support contract, and Crit/Range/Pierce buffs (NO attack-speed buff)', () => {
  const overheatKeys = new Set<string>();
  const hotkeys = new Set<string>();

  for (const gun of GUN_CATALOG) {
    assert.equal(gun.milestones.length, 4);
    assert.ok(gun.overheatSkill.key.length > 0);
    assert.ok(gun.overheatSkill.heatPerShot > 0);
    assert.equal(overheatKeys.has(gun.overheatSkill.key), false, `Duplicate overheat key: ${gun.overheatSkill.key}`);
    assert.equal(hotkeys.has(gun.hotkey), false, `Duplicate hotkey: ${gun.hotkey}`);
    overheatKeys.add(gun.overheatSkill.key);
    hotkeys.add(gun.hotkey);

    const isSupport = gun.category === 'support';
    let prevDps = 0;
    let prevDmg = 0;

    for (let lv = 1; lv <= MAX_GUN_LEVEL; lv++) {
      const profile = getGunCombatProfile(gun.type, lv, 'alpha');
      const omegaProfile = getGunCombatProfile(gun.type, lv, 'omega');
      assert.equal(profile.level, lv);
      assert.equal(profile.category, getGunCategory(gun.type));

      if (isSupport) {
        // Strict Pure Support Contract: 0 direct damage, 0 DPS, 0 burn DoT
        assert.equal(profile.damage, 0, `${gun.type} lv${lv} alpha must have 0 damage`);
        assert.equal(profile.dpsEstimate, 0, `${gun.type} lv${lv} alpha must have 0 dpsEstimate`);
        assert.equal(profile.burnDps, 0, `${gun.type} lv${lv} alpha must have 0 burnDps`);
        assert.equal(omegaProfile.damage, 0, `${gun.type} lv${lv} omega must have 0 damage`);
        assert.equal(omegaProfile.dpsEstimate, 0, `${gun.type} lv${lv} omega must have 0 dpsEstimate`);
        assert.equal(omegaProfile.burnDps, 0, `${gun.type} lv${lv} omega must have 0 burnDps`);
      } else {
        assert.ok(profile.damage > prevDmg, `${gun.type} lv${lv} damage should increase`);
        assert.ok(profile.dpsEstimate > prevDps, `${gun.type} lv${lv} dps should increase`);
        assert.notEqual(
          `${profile.damage}:${profile.cooldownSec}:${profile.rangeTiles}`,
          `${omegaProfile.damage}:${omegaProfile.cooldownSec}:${omegaProfile.rangeTiles}`,
          `${gun.type} alpha vs omega stats must differ`
        );
        prevDmg = profile.damage;
        prevDps = profile.dpsEstimate;
      }

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
  assert.equal(overheatKeys.size, 17);
  assert.equal(hotkeys.size, 17);

  // Beacon grants +Damage% + Critical Strike Chance & Multiplier (NO attack-speed buff!)
  const beaconGun: PlacedGun = {
    id: 'b1',
    col: 4,
    row: 4,
    type: 'beacon',
    level: 10,
    variant: 'alpha',
    priority: 'first',
    chargeTimer: 0,
    aimAngle: 0,
    recoil: 0,
    totalDamageDealt: 0,
    kills: 0,
  };
  const allyBuff = computeBeaconBuffAtTile([beaconGun], 5, 4);
  assert.equal(allyBuff.damageMult, 1.34);
  assert.equal(allyBuff.critChance, 0.55);
  assert.equal(allyBuff.critMult, 2.4);

  const selfBuff = computeBeaconBuffAtTile([beaconGun], 4, 4);
  assert.equal(selfBuff.damageMult, 1);
  assert.equal(selfBuff.critChance, 0);
  assert.equal(selfBuff.critMult, 1);

  const farBuff = computeBeaconBuffAtTile([beaconGun], 11, 7);
  assert.equal(farBuff.critChance, 0);

  // Radar grants +Range, +ArmorPierce, +ShieldDamage
  const radarGun: PlacedGun = { ...beaconGun, id: 'rad1', col: 6, row: 4, type: 'radar', variant: 'omega' };
  const teamBuff = computeTeamSupportBuffAtTile([beaconGun, radarGun], 5, 4);
  assert.equal(teamBuff.hasSupportLink, true);
  assert.ok(teamBuff.damageMult >= 1.34);
  assert.ok(teamBuff.critChance >= 0.55);
  assert.ok(teamBuff.critMult >= 2.4);
  assert.ok(teamBuff.rangeBonusTiles >= 1.6);
  assert.ok(teamBuff.armorPierceBonus >= 0.5);
  assert.ok(teamBuff.shieldMultBonus >= 0.55);
  assert.equal('speedMult' in teamBuff, false, 'Support buff must NOT contain speedMult');
  assert.equal('heatCoolMult' in teamBuff, false, 'Support buff must NOT contain heatCoolMult');

  const investedLv3 = getGunTotalInvested('cryo', 3);
  const refundLv3 = getGunSellRefund({ type: 'cryo', level: 3 });
  assert.equal(refundLv3, Math.round(investedLv3 * 0.72));
});

test('Electric + Wet/Cryo environmental synergy & Super Boss windup/interrupt mechanics', () => {
  const map = PRISM_MAPS[0];
  const superBoss = createEnemyForWave(1, 'super_boss', 12, map, false, 'normal', 'campaign');

  // Dry enemy has baseline 1x synergy
  const drySyn = computeElectricWetSynergy(superBoss, 7);
  assert.equal(drySyn.isWetSynergy, false);
  assert.equal(drySyn.damageMult, 1);
  assert.equal(drySyn.extraChains, 0);

  // Cryo slow grants frost conductivity synergy
  superBoss.slowTimer = 2.0;
  const cryoSyn = computeElectricWetSynergy(superBoss, 7);
  assert.equal(cryoSyn.isWetSynergy, true);
  assert.equal(cryoSyn.damageMult, 1.25);
  assert.equal(cryoSyn.extraChains, 1);

  // Standing on map wetZones automatically soaks enemy -> maximum Electric Overdrive
  const wz = map.wetZones[0];
  const wzPt = gridToWorldCenter(wz.col, wz.row);
  superBoss.x = wzPt.x;
  superBoss.y = wzPt.y;
  superBoss.slowTimer = 0;
  superBoss.abilityCooldown = 0.05;
  const stepRes = stepEnemies([superBoss], map, 0.1);
  assert.ok(superBoss.wetTimer >= 1.6, 'Traversing wetZone tile must apply wetTimer');
  assert.equal(stepRes.outcome.windupEvents.length, 1, 'Super Boss must telegraph windup before casting skill');
  assert.ok(superBoss.windupTimer > 0);

  const wetSyn = computeElectricWetSynergy(superBoss, 7);
  assert.equal(wetSyn.isWetSynergy, true);
  assert.equal(wetSyn.damageMult, 1.5);
  assert.equal(wetSyn.extraChains, 2);
  assert.equal(wetSyn.splashBonusPx, 24);
  assert.ok(wetSyn.shockSec > 1);

  // Electric / Radar Overheat interrupts active Super Boss windup cleanly
  const interrupted = interruptEnemyWindup(superBoss);
  assert.equal(interrupted, true);
  assert.equal(superBoss.windupTimer, 0);
  assert.equal(superBoss.windupKind, null);
  assert.ok(superBoss.stunTimer >= 0.38);
  assert.equal(interruptEnemyWindup(superBoss), false);

  // Super Boss core damage check
  const endPt = map.path[map.path.length - 1];
  const endCenter = gridToWorldCenter(endPt.col, endPt.row);
  superBoss.waypointIndex = map.path.length - 1;
  superBoss.x = endCenter.x;
  superBoss.y = endCenter.y;
  superBoss.stunTimer = 0;
  const coreHit = stepEnemies([superBoss], map, 0.4);
  assert.equal(coreHit.coreDamageTaken, 8);
});

test('Track-corridor confinement keeps pulled, displaced, and summoned enemies strictly inside path bounds', () => {
  const map = PRISM_MAPS[0];
  const seg0Start = gridToWorldCenter(map.path[0].col, map.path[0].row);
  const seg0End = gridToWorldCenter(map.path[1].col, map.path[1].row);

  const en = createEnemyForWave(1, 'scout', 4, map, false, 'normal');
  en.x = seg0Start.x + 80;
  en.y = seg0Start.y + 4;
  for (let i = 0; i < 12; i++) {
    pullEnemyAlongTrack(en, map, en.x - 40, seg0Start.y + 180, 40);
    assert.ok(Math.abs(en.y - seg0Start.y) <= MAX_CORRIDOR_LATERAL_PX);
    assert.ok(en.x >= seg0Start.x && en.x <= seg0End.x);
  }

  const cornerEn = createEnemyForWave(2, 'armored', 4, map, false, 'normal');
  cornerEn.x = seg0End.x - 10;
  cornerEn.y = seg0Start.y + 65;
  clampEnemyToTrackCorridor(cornerEn, map);
  assert.ok(Math.abs(cornerEn.y - seg0Start.y) <= MAX_CORRIDOR_LATERAL_PX);

  advanceEnemyAlongPath(cornerEn, map, 40);
  assert.equal(cornerEn.waypointIndex, 2);
  assert.ok(Math.abs(cornerEn.x - seg0End.x) <= MAX_CORRIDOR_LATERAL_PX);

  const summoner = createEnemyForWave(3, 'summoner', 5, map, false, 'normal');
  summoner.x = seg0Start.x + 60;
  summoner.y = seg0Start.y;
  summoner.abilityCooldown = 0.05;
  const resSummon = stepEnemies([summoner], map, 0.1);
  assert.equal(resSummon.outcome.spawnRequests.length, 2);
  for (const req of resSummon.outcome.spawnRequests) {
    assert.ok(Math.abs(req.y - seg0Start.y) <= MAX_CORRIDOR_LATERAL_PX);
  }
});

test('Anti-permafreeze & combat balance across all 13 enemy archetypes + Lv10 attack/electric profiles', () => {
  const map = PRISM_MAPS[0];
  const cases: Array<{ kind: 'scout' | 'armored' | 'boss' | 'super_boss' | 'juggernaut'; floor: number }> = [
    { kind: 'scout', floor: 0.48 },
    { kind: 'armored', floor: 0.48 },
    { kind: 'boss', floor: 0.55 },
    { kind: 'super_boss', floor: 0.62 },
    { kind: 'juggernaut', floor: 0.62 },
  ];

  for (const c of cases) {
    const en = createEnemyForWave(1, c.kind, 5, map, false, 'normal');
    const startX = en.x;
    en.slowTimer = 5;
    en.slowFactor = 0.2;
    en.stunTimer = 2;
    stepEnemies([en], map, 0.25);
    const moved = en.x - startX;
    const minExpected = en.speed * c.floor * 0.25 - 0.05;
    assert.ok(moved >= minExpected, `${c.kind} moved ${moved.toFixed(2)}px, expected >= ${minExpected.toFixed(2)}px`);
  }

  for (const heavyKind of ['boss', 'super_boss', 'juggernaut'] as const) {
    const heavy = createEnemyForWave(2, heavyKind, 5, map, false, 'normal');
    heavy.x += 90;
    const beforeX = heavy.x;
    pullEnemyAlongTrack(heavy, map, heavy.x - 60, heavy.y, 40);
    assert.equal(heavy.x, beforeX, `${heavyKind} must resist vortex pull`);
  }

  // Distinct combat roles for Attack (10) and Electric (2) Lv10 guns
  assert.equal(getGunCombatProfile('gatling', 10).projectilesPerShot, 4);
  assert.ok(getGunCombatProfile('shotgun', 10).projectilesPerShot >= 9);
  assert.ok(getGunCombatProfile('flamer', 10).burnDps > 0);
  assert.ok(getGunCombatProfile('saw', 10).chainCount >= 7);
  assert.ok(getGunCombatProfile('mortar', 10).pullForce >= 18);
  assert.ok(getGunCombatProfile('missile', 10).splashRadius >= 110);
  assert.equal(getGunCombatProfile('railgun', 10).armorPierce, 1);
  assert.ok(getGunCombatProfile('tesla', 10).chainCount >= 7);
  assert.ok(getGunCombatProfile('tempest', 10, 'omega').shieldMult >= 1.9);

  // Orbital Laser (220), Singularity Core (250), Mothership Carrier (200)
  const orbitalMeta = getGunCatalogItem('orbital');
  const singularityMeta = getGunCatalogItem('singularity');
  const mothershipMeta = getGunCatalogItem('mothership');
  assert.equal(orbitalMeta.cost, 220);
  assert.equal(orbitalMeta.roleClue, 'Gọi tia hủy diệt toàn bản đồ');
  assert.ok(getGunCombatProfile('orbital', 5).rangeTiles >= 20);
  assert.equal(getGunCombatProfile('orbital', 5).projectilesPerShot, 2);
  assert.equal(getGunCombatProfile('orbital', 10).projectilesPerShot, 3);
  assert.ok(getGunCombatProfile('orbital', 5).burnDps >= 120);
  assert.ok(getGunCombatProfile('orbital', 1).dpsEstimate >= 180, 'Orbital 220⚡ Lv1 DPS must justify 220⚡ price');

  assert.equal(singularityMeta.cost, 250);
  assert.equal(singularityMeta.roleClue, 'Nuốt chửng & nghiền nát không gian');
  assert.equal(getGunCombatProfile('singularity', 5).armorPierce, 1);
  assert.ok(getGunCombatProfile('singularity', 1).pullForce >= 90, 'Singularity pullForce must trap normal swarms');
  assert.ok(getGunCombatProfile('singularity', 1).dpsEstimate >= 150, 'Singularity 250⚡ Lv1 DPS must justify 250⚡ price');
  const holeGrowth = computeSingularitySwallowGrowth(
    { baseRadius: 96, killsAbsorbed: 2, accumulatedDamage: 250, maxScale: 1.85 },
    400,
    7,
    'omega'
  );
  assert.equal(holeGrowth.killsAbsorbed, 3);
  assert.ok(holeGrowth.currentRadius > 96);
  assert.ok(holeGrowth.accumulatedDamage >= 550);

  assert.equal(mothershipMeta.cost, 200);
  assert.equal(mothershipMeta.roleClue, 'Triệu hồi hạm đội tự hành');
  assert.equal(getMothershipMaxDrones(1, 'omega'), 3);
  assert.equal(getMothershipMaxDrones(5, 'omega'), 4);
  assert.equal(getMothershipMaxDrones(5, 'alpha'), 5);
  assert.ok(getGunCombatProfile('mothership', 1).dpsEstimate >= 180, 'Mothership 200⚡ Lv1 DPS must justify 200⚡ price');
  assert.equal(shouldDroneEvadeBossPulse(210, 210, 200, 200, 80), true);
  assert.equal(shouldDroneEvadeBossPulse(400, 400, 200, 200, 80), false);

  // Supernova Supreme Cannon (500⚡)
  const supernovaMeta = getGunCatalogItem('supernova');
  assert.equal(supernovaMeta.cost, 500);
  assert.equal(supernovaMeta.hotkey, 'v');
  const superLv1Alpha = getGunCombatProfile('supernova', 1, 'alpha');
  const superLv1Omega = getGunCombatProfile('supernova', 1, 'omega');
  const superLv10Alpha = getGunCombatProfile('supernova', 10, 'alpha');
  assert.ok(superLv1Alpha.dpsEstimate >= 400, 'Supernova 500⚡ Lv1 DPS must justify 500⚡ supreme cost');
  assert.ok(superLv1Omega.damage > superLv1Alpha.damage);
  assert.ok(superLv1Alpha.rangeTiles >= 4.6);
  assert.ok(superLv1Alpha.chainCount >= 3);
  assert.ok(superLv1Alpha.brittleBonus >= 0.28);
  assert.equal(superLv10Alpha.armorPierce, 1);

  // Chronos Sovereign Transcendent Cannon (800⚡)
  const chronosMeta = getGunCatalogItem('chronos');
  assert.equal(chronosMeta.cost, 800);
  assert.equal(chronosMeta.hotkey, 'b');
  const chronosLv1Alpha = getGunCombatProfile('chronos', 1, 'alpha');
  const chronosLv1Omega = getGunCombatProfile('chronos', 1, 'omega');
  const chronosLv10Alpha = getGunCombatProfile('chronos', 10, 'alpha');
  assert.ok(chronosLv1Alpha.dpsEstimate >= 800, 'Chronos 800⚡ Lv1 DPS must justify 800⚡ cost');
  assert.ok(chronosLv1Omega.damage > chronosLv1Alpha.damage);
  assert.ok(chronosLv1Alpha.rangeTiles >= 5.5);
  assert.ok(chronosLv1Alpha.chainCount >= 3);
  assert.ok(chronosLv1Alpha.brittleBonus >= 0.48);
  assert.equal(chronosLv10Alpha.armorPierce, 1);
  assert.equal(getChronosMaxFields(1, 'omega'), 1);
  assert.equal(getChronosMaxFields(7, 'omega'), 2);
  assert.equal(getChronosMaxFields(7, 'alpha'), 3);
  assert.equal(computeChronoFieldRecord(500, 1000, 0.56, 30000), 1060);
  assert.equal(computeChronoFieldRecord(29800, 1000, 0.56, 30000), 30000);

  // Overdrive ("Hội Tụ Hỏa Lực"): 5x slower charge (0.2x scale), 10% start, 8s duration, 2-wave Overheat & 2.71x burst
  assert.equal(OVERDRIVE_CONFIG.chargeScale, 0.2);
  assert.equal(OVERDRIVE_CONFIG.initialCharge, 10);
  assert.equal(OVERDRIVE_CONFIG.durationSec, 8.0);
  assert.equal(OVERDRIVE_CONFIG.speedMult, 1.75);
  assert.equal(OVERDRIVE_CONFIG.damageMult, 1.55);
  assert.equal(OVERDRIVE_CONFIG.hudDpsMult, 2.71);
  assert.equal(OVERDRIVE_CONFIG.secondWaveTriggerSec, 4.0);
  assert.equal(computeOverdriveChargeGain(1000, 0.045), 9);
  assert.equal(computeOverdriveChargeGain(-50, 0.045), 0);

  for (const g of GUN_CATALOG) {
    const p10 = getGunCombatProfile(g.type, 10);
    if (g.cost >= 800) {
      assert.ok(
        p10.dpsEstimate >= 8000 && p10.dpsEstimate <= 14500,
        `Transcendent ${g.type} (${g.cost}⚡) Lv10 DPS=${p10.dpsEstimate} stays transcendent-tier & bounded`
      );
    } else if (g.cost >= 500) {
      assert.ok(
        p10.dpsEstimate >= 4000 && p10.dpsEstimate < 7000,
        `Supreme ${g.type} (${g.cost}⚡) Lv10 DPS=${p10.dpsEstimate} stays supreme-strong & bounded`
      );
    } else if (g.cost >= 200) {
      assert.ok(
        p10.dpsEstimate >= 1400 && p10.dpsEstimate < 3000,
        `Apex ${g.type} (${g.cost}⚡) Lv10 DPS=${p10.dpsEstimate} stays apex-strong & bounded`
      );
    } else {
      assert.ok(p10.dpsEstimate < 1600, `${g.type} Lv10 DPS=${p10.dpsEstimate} stays balanced (<1600)`);
    }
  }

  // Kill reward boost across all 13 enemy archetypes
  assert.equal(ENEMY_KILL_COIN_BOOST, 1.1);
  assert.equal(boostEnemyKillReward(10), 11);
  const kinds = [
    'scout',
    'armored',
    'splitter',
    'stealth',
    'healer',
    'teleporter',
    'shieldbearer',
    'boss',
    'super_boss',
    'berserker',
    'juggernaut',
    'summoner',
    'leech',
  ] as const;
  for (const kind of kinds) {
    const e1 = createEnemyForWave(1, kind, 1, map, false, 'normal', 'campaign');
    const e6 = createEnemyForWave(2, kind, 6, map, false, 'normal', 'campaign');
    assert.ok(e1.reward >= 7);
    assert.ok(e6.reward >= e1.reward);
  }
});

test('prismTdSound synthesizes compressor+shaper bus, guards suspended state, and covers all 16 guns + Overheat + interrupt', () => {
  let oscCount = 0;
  let noiseSrcCount = 0;
  let filterCount = 0;
  let compressorCount = 0;
  let shaperCount = 0;
  let bufferCount = 0;

  const makeParam = () => ({
    setValueAtTime: () => {},
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
        return { getChannelData: () => new Float32Array(length) };
      },
      createWaveShaper: () => {
        shaperCount++;
        return { curve: null, oversample: 'none', connect: () => {} };
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
      createGain: () => ({ gain: makeParam(), connect: () => {} }),
      createOscillator: () => {
        oscCount++;
        return {
          type: 'sine',
          frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
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
        return { type: 'lowpass', frequency: makeParam(), Q: makeParam(), connect: () => {} };
      },
    }) as unknown as AudioContext;

  const suspendedRef = { current: makeMockCtx('suspended') };
  playPrismSfx('gatling', true, suspendedRef);
  assert.equal(noiseSrcCount, 0);

  const burstRef = { current: makeMockCtx('running') };
  for (const gun of GUN_CATALOG) {
    playPrismSfx(gun.type, true, burstRef);
    playOverheatSkillSfx(gun.overheatSkill.key, gun.type, true, burstRef);
  }
  assert.equal(compressorCount, 1);
  assert.equal(shaperCount, 1);
  assert.equal(bufferCount, 8);
  assert.ok(noiseSrcCount <= 16);

  const origPerfNow = performance.now.bind(performance);
  let fakeNow = 10_000;
  (performance as { now: () => number }).now = () => {
    fakeNow += 400;
    return fakeNow;
  };
  try {
    const cleanRef = { current: makeMockCtx('running') };
    const beforeVoices = noiseSrcCount + oscCount;
    for (const gun of GUN_CATALOG) {
      const preVoices = noiseSrcCount + oscCount;
      playPrismSfx(gun.type, true, cleanRef);
      assert.ok(noiseSrcCount + oscCount > preVoices, `${gun.type} must emit audio`);

      const preSkillVoices = noiseSrcCount + oscCount;
      playOverheatSkillSfx(gun.overheatSkill.key, gun.type, true, cleanRef);
      assert.ok(noiseSrcCount + oscCount > preSkillVoices, `${gun.overheatSkill.key} must emit audio`);
    }
    for (const uiFx of [
      'place',
      'select',
      'upgrade',
      'variant',
      'sell',
      'explosion',
      'kill',
      'interrupt',
      'wave',
      'overdrive',
      'hurt',
      'victory',
      'defeat',
    ] as const) {
      playPrismSfx(uiFx, true, cleanRef);
    }
    assert.ok(noiseSrcCount + oscCount - beforeVoices >= 47);
    assert.ok(filterCount > 0);

    const preMuted = noiseSrcCount + oscCount;
    playPrismSfx('overdrive', false, cleanRef);
    assert.equal(noiseSrcCount + oscCount, preMuted);
  } finally {
    (performance as { now: () => number }).now = origPerfNow;
  }
});
