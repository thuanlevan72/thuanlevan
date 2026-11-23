import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceEnemyAlongPath,
  applyCoreDamageWithShield,
  applyDamageToEnemy,
  BIOME_PALETTES,
  boostEnemyKillReward,
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  clampEnemyToTrackCorridor,
  computeAegisCoreShieldSpec,
  computeBeaconBuffAtTile,
  computeChronoFieldRecord,
  computeElectricWetSynergy,
  computeOverdriveChargeGain,
  computeOverdriveTimeChargeGain,
  computeQuantumEchoTargets,
  computeSingularitySwallowGrowth,
  computeTeamSupportBuffAtTile,
  createEnemyForWave,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  ENEMY_KILL_COIN_BOOST,
  GAME_MODE_CONFIGS,
  GAME_MODE_ORDER,
  getAstralMaxRifts,
  getAvailableGunsForMap,
  getChronosMaxFields,
  getEffectiveMapSetup,
  getExclusiveGunForMap,
  getGunCatalogItem,
  getGunCategory,
  getGunCombatProfile,
  getGunProgressionRoadmap,
  getGunSellRefund,
  getGunTotalInvested,
  getGunUpgradeCost,
  getMapPathTileSet,
  getMapScalingCurve,
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

test('PRISM_MAPS define 19 valid maps with unique bosses, 26 guns (19 Attack, 3 Electric, 4 Support), 6 difficulties, and 9 modes', () => {
  assert.equal(PRISM_MAPS.length, 19);
  assert.equal(GRID_COLS, 16);
  assert.equal(GRID_ROWS, 10);
  assert.equal(TILE_SIZE, 56);
  assert.equal(CANVAS_WIDTH, 896);
  assert.equal(CANVAS_HEIGHT, 560);

  assert.equal(GUN_CATALOG.length, 26);
  const attackGuns = GUN_CATALOG.filter((g) => g.category === 'attack');
  const electricGuns = GUN_CATALOG.filter((g) => g.category === 'electric');
  const supportGuns = GUN_CATALOG.filter((g) => g.category === 'support');
  assert.equal(attackGuns.length, 19);
  assert.equal(electricGuns.length, 3);
  assert.equal(supportGuns.length, 4);

  assert.equal(isElectricGunType('tesla'), true);
  assert.equal(isElectricGunType('tempest'), true);
  assert.equal(isElectricGunType('aurora_spire'), true);
  assert.equal(isElectricGunType('gatling'), false);

  assert.equal(isSupportGunType('beacon'), true);
  assert.equal(isSupportGunType('cryo'), true);
  assert.equal(isSupportGunType('radar'), true);
  assert.equal(isSupportGunType('quantum_prism'), true);
  assert.equal(isSupportGunType('astral_ark'), false);
  assert.equal(isSupportGunType('tesla'), false);
  assert.equal(isSupportGunType('chronos'), false);

  assert.equal(MAX_GUN_LEVEL, 7);
  assert.deepEqual(DIFFICULTY_ORDER, ['easy', 'normal', 'hard', 'hell', 'super_hell', 'nightmare']);
  assert.deepEqual(GAME_MODE_ORDER, [
    'campaign',
    'blitz',
    'boss_rush',
    'boss_apocalypse',
    'endless',
    'overheat_fury',
    'iron_fortress',
    'tactical_tycoon',
    'chaos_swarm',
  ]);

  assert.equal(DIFFICULTY_CONFIGS.easy.hpMult, 1.28);
  assert.equal(DIFFICULTY_CONFIGS.normal.hpMult, 1.92);
  assert.equal(DIFFICULTY_CONFIGS.hard.hpMult, 2.86);
  assert.equal(DIFFICULTY_CONFIGS.hell.hpMult, 4.18);
  assert.equal(DIFFICULTY_CONFIGS.super_hell.hpMult, 6.15);
  assert.equal(DIFFICULTY_CONFIGS.super_hell.extraWaves, 4);
  assert.equal(DIFFICULTY_CONFIGS.nightmare.hpMult, DIFFICULTY_CONFIGS.super_hell.hpMult * 2);
  assert.equal(DIFFICULTY_CONFIGS.nightmare.shieldMult, DIFFICULTY_CONFIGS.super_hell.shieldMult * 2);
  assert.equal(DIFFICULTY_CONFIGS.nightmare.extraWaves, 6);

  assert.ok(GAME_MODE_CONFIGS.blitz.speedMult > 1);
  assert.ok(GAME_MODE_CONFIGS.boss_rush.startEnergyMult >= 2);
  assert.ok(GAME_MODE_CONFIGS.boss_apocalypse.startEnergyMult >= 2.8);
  assert.equal(GAME_MODE_CONFIGS.overheat_fury.heatMult, 2.2);
  assert.equal(GAME_MODE_CONFIGS.iron_fortress.coreHpMult, 1.5);
  assert.equal(GAME_MODE_CONFIGS.tactical_tycoon.startEnergyMult, 1.85);
  assert.equal(GAME_MODE_CONFIGS.chaos_swarm.swarmCountMult, 1.45);

  const bossIds = new Set<string>();
  let prevScaleHp = 0;

  for (const map of PRISM_MAPS) {
    if (map.id === 'sector-19') {
      assert.equal(map.cols, 24);
      assert.equal(map.rows, 14);
      assert.equal(map.biome, 'astral_abyss');
      assert.ok(map.wetZones.length >= 6);
      assert.equal(map.bossSpec.emblemKind, 'void_star');
    } else {
      assert.equal(map.cols, 16);
      assert.equal(map.rows, 10);
      assert.ok(map.wetZones.length >= 2, `${map.id} must define >= 2 conductive wetZones`);
    }
    assert.ok(map.bossSpec.id.length > 0 && !bossIds.has(map.bossSpec.id), `${map.id} must have a unique bossSpec`);
    bossIds.add(map.bossSpec.id);
    const scale = getMapScalingCurve(map.id);
    assert.ok(scale.hpMult >= prevScaleHp, `${map.id} progressive scaling must be non-decreasing`);
    prevScaleHp = scale.hpMult;

    assert.ok(BIOME_PALETTES[map.biome]);
    assert.ok(DIFFICULTY_CONFIGS[map.recommendedDifficulty]);
    assert.ok(map.totalWaves >= 16 && map.totalWaves <= 42, `${map.id} waves should be 16..42`);
    assert.ok(map.tacticalHint.length > 10, `${map.id} must define a tacticalHint`);
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
    const exclusive = getExclusiveGunForMap(map.id);
    if (map.id === 'sector-17' || map.id === 'sector-18' || map.id === 'sector-19') {
      assert.ok(exclusive, `${map.id} must have an exclusive weapon`);
      assert.equal(available.length, 24, `${map.id} should expose 23 base + 1 map-exclusive gun`);
      assert.ok(available.some((g) => g.type === exclusive.type));
    } else {
      assert.equal(exclusive, null);
      assert.equal(available.length, 23, `${map.id} should expose 23 standard guns`);
    }
  }
  assert.equal(bossIds.size, 19);
});

test('Super Hell & Nightmare (2x Super Hell), Boss Apocalypse, and 24x14 Sector-19 Super Boss Phase 2', () => {
  const map = PRISM_MAPS[0];
  const setupEasy = getEffectiveMapSetup(map, 'easy', 'campaign');
  const setupNormal = getEffectiveMapSetup(map, 'normal', 'campaign');
  const setupHard = getEffectiveMapSetup(map, 'hard', 'campaign');
  const setupHell = getEffectiveMapSetup(map, 'hell', 'campaign');
  const setupSuperHell = getEffectiveMapSetup(map, 'super_hell', 'campaign');
  const setupNightmare = getEffectiveMapSetup(map, 'nightmare', 'campaign');

  assert.equal(setupEasy.totalWaves, 16);
  assert.equal(setupNormal.totalWaves, 18);
  assert.equal(setupHard.totalWaves, 20);
  assert.equal(setupHell.totalWaves, 22);
  assert.equal(setupSuperHell.totalWaves, 24);
  assert.equal(setupNightmare.totalWaves, 28);
  assert.ok(setupSuperHell.startCoreHp <= setupHell.startCoreHp);
  assert.ok(setupNightmare.startEnergy >= setupSuperHell.startEnergy);

  // Boss Apocalypse mode: spawns ONLY boss and super_boss (0 scouts or minions)
  const setupApoc = getEffectiveMapSetup(map, 'hard', 'boss_apocalypse');
  assert.ok(setupApoc.startEnergy >= 500, 'Boss Apocalypse needs boosted starting energy');
  for (let w = 1; w <= setupApoc.totalWaves; w++) {
    const wave = buildWaveSpawns(w, setupApoc.totalWaves, 'hard', 'boss_apocalypse');
    assert.ok(wave.length >= 2, `Wave ${w} in Boss Apocalypse must spawn bosses`);
    for (const item of wave) {
      assert.ok(
        item.kind === 'boss' || item.kind === 'super_boss',
        `Boss Apocalypse wave ${w} spawned non-boss: ${item.kind}`
      );
    }
  }
  const lateApoc = buildWaveSpawns(setupApoc.totalWaves, setupApoc.totalWaves, 'super_hell', 'boss_apocalypse');
  assert.ok(lateApoc.some((i) => i.kind === 'super_boss'));

  // Hell W1 boosted +15-20% over baseline while staying balanced
  const w1Hell = buildWaveSpawns(1, setupHell.totalWaves, 'hell', 'campaign');
  const w1TotalHp = w1Hell.reduce(
    (sum, item, idx) =>
      sum + createEnemyForWave(idx + 1, item.kind, 1, map, item.isElite, 'hell', 'campaign').maxHp,
    0
  );
  assert.ok(w1TotalHp > 9000 && w1TotalHp < 19000, `Hell W1 total HP=${w1TotalHp} should reflect +15-20% buff`);

  // Sector 17, 18, and 19 (24x14 super-wide)
  const map17 = PRISM_MAPS[16];
  const map18 = PRISM_MAPS[17];
  const map19 = PRISM_MAPS[18];
  assert.equal(map19.id, 'sector-19');
  assert.equal(map19.cols, 24);
  assert.equal(map19.rows, 14);
  assert.ok(getMapPathTileSet(map19).size >= 60);
  for (const diff of DIFFICULTY_ORDER) {
    assert.ok(getEffectiveMapSetup(map17, diff, 'campaign').startEnergy >= 500);
    assert.ok(getEffectiveMapSetup(map18, diff, 'campaign').startEnergy >= 700);
    assert.ok(
      getEffectiveMapSetup(map19, diff, 'campaign').startEnergy >= 1200,
      `sector-19 (${diff}) must allow W1 deployment of 1200⚡ astral_ark`
    );
  }

  // Sector-19 Super Boss Phase 2 triggers once at <= 50% HP
  const apexBoss = createEnemyForWave(99, 'super_boss', 18, map19, false, 'normal', 'campaign');
  assert.equal(apexBoss.bossTitle, map19.bossSpec.title);
  assert.equal(apexBoss.bossPhase, 1);
  apexBoss.hp = Math.round(apexBoss.maxHp * 0.48);
  const p2Step1 = stepEnemies([apexBoss], map19, 0.05);
  assert.equal(apexBoss.bossPhase, 2);
  assert.equal(p2Step1.outcome.phase2Events.length, 1);
  const p2Step2 = stepEnemies([apexBoss], map19, 0.05);
  assert.equal(p2Step2.outcome.phase2Events.length, 0);
});

test('26-gun Lv1..Lv7 progression, 2x doubling upgrade cost, pure 0-damage support, and Quantum Prism mechanics', () => {
  const overheatKeys = new Set<string>();
  const hotkeys = new Set<string>();

  for (const gun of GUN_CATALOG) {
    assert.equal(gun.milestones.length, 3);
    assert.deepEqual(
      gun.milestones.map((m) => m.level),
      [3, 5, 7],
      `${gun.type} milestones must sit at 3, 5, 7`
    );
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
      const profileCached = getGunCombatProfile(gun.type, lv, 'alpha');
      assert.equal(profile, profileCached, `${gun.type} lv${lv} profile should be memoized`);
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
        const expectedAlphaDmg = Math.round(gun.baseDamage * Math.pow(2, lv - 1) * gun.variants.alpha.damageMult);
        assert.equal(profile.damage, expectedAlphaDmg, `${gun.type} lv${lv} damage must follow 2^(lv-1) scaling`);
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
        assert.equal(upCost, Math.round(gun.cost * Math.pow(2, lv)), `${gun.type} lv${lv}->${lv + 1} cost must double`);
      } else {
        assert.equal(getGunUpgradeCost(gun.type, lv), null);
        assert.equal(profile.visualTier, 4);
        assert.equal(profile.tierLabel, 'MYTHIC LV7');
        assert.equal(profile.unlockedSkills.length, 3);
        assert.equal(profile.nextSkill, null);
      }
    }

    const roadmap = getGunProgressionRoadmap(gun.type, 'alpha');
    assert.equal(roadmap.length, MAX_GUN_LEVEL, `${gun.type} roadmap must cover Lv1..7`);
    assert.deepEqual(
      roadmap.filter((s) => s.milestone !== null).map((s) => s.level),
      [3, 5, 7],
      `${gun.type} roadmap milestones must be at [3, 5, 7]`
    );
    for (let i = 0; i < roadmap.length; i++) {
      assert.equal(roadmap[i].level, i + 1);
      assert.ok(roadmap[i].statChanges.length >= 1, `${gun.type} lv${i + 1} statChanges must be non-empty`);
      if (isSupport) {
        assert.equal(roadmap[i].powerMultiplierLabel, `Cấp ${i + 1}/${MAX_GUN_LEVEL}`);
      } else {
        assert.equal(roadmap[i].powerMultiplierLabel, `×${Math.pow(2, i)} DMG`);
      }
    }
  }
  assert.equal(overheatKeys.size, 26);
  assert.equal(hotkeys.size, 26);

  // Beacon + Radar + Quantum Prism (500⚡) Pure Support Auras (NO attack-speed buff)
  const beaconGun: PlacedGun = {
    id: 'b1',
    col: 4,
    row: 4,
    type: 'beacon',
    level: MAX_GUN_LEVEL,
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

  const radarGun: PlacedGun = { ...beaconGun, id: 'rad1', col: 6, row: 4, type: 'radar', variant: 'omega' };
  const quantumGun: PlacedGun = { ...beaconGun, id: 'qp1', col: 5, row: 5, type: 'quantum_prism', variant: 'alpha' };
  const quantumMeta = getGunCatalogItem('quantum_prism');
  assert.equal(quantumMeta.cost, 500);
  assert.equal(quantumMeta.hotkey, 'w');

  const teamBuff = computeTeamSupportBuffAtTile([beaconGun, radarGun, quantumGun], 5, 4);
  assert.equal(teamBuff.hasSupportLink, true);
  assert.ok(teamBuff.damageMult >= 1.34);
  assert.ok(teamBuff.critChance >= 0.55);
  assert.ok(teamBuff.critMult >= 2.4);
  assert.ok(teamBuff.rangeBonusTiles >= 1.6);
  assert.ok(teamBuff.armorPierceBonus >= 0.5);
  assert.ok(teamBuff.shieldMultBonus >= 0.55);
  assert.equal(teamBuff.bonusMultishot, 1);
  assert.ok(teamBuff.energyHarvestBonus >= 6);
  assert.equal('speedMult' in teamBuff, false, 'Support buff must NOT contain speedMult');
  assert.equal('heatCoolMult' in teamBuff, false, 'Support buff must NOT contain heatCoolMult');

  // Overdrive amplifies Support Auras too
  const odTeamBuff = computeTeamSupportBuffAtTile([beaconGun, radarGun, quantumGun], 5, 4, OVERDRIVE_CONFIG.supportAuraMult);
  assert.ok(odTeamBuff.damageMult > teamBuff.damageMult);
  assert.ok(odTeamBuff.bonusMultishot >= 2);
  assert.ok(odTeamBuff.energyHarvestBonus > teamBuff.energyHarvestBonus);

  // Quantum Damage Echo propagation + Silence lock
  const map = PRISM_MAPS[0];
  const srcEn = createEnemyForWave(101, 'boss', 5, map, false, 'normal', 'campaign');
  const linkedEn = createEnemyForWave(102, 'armored', 5, map, false, 'normal', 'campaign');
  const unlinkedEn = createEnemyForWave(103, 'scout', 5, map, false, 'normal', 'campaign');
  const farLinkedEn = createEnemyForWave(104, 'armored', 5, map, false, 'normal', 'campaign');

  srcEn.x = 200;
  srcEn.y = 200;
  srcEn.quantumLinkTimer = 4.0;
  srcEn.quantumEchoRatio = 0.35;
  linkedEn.x = 280;
  linkedEn.y = 200;
  linkedEn.quantumLinkTimer = 4.0;
  unlinkedEn.x = 240;
  unlinkedEn.y = 200;
  unlinkedEn.quantumLinkTimer = 0;
  farLinkedEn.x = 600;
  farLinkedEn.y = 200;
  farLinkedEn.quantumLinkTimer = 4.0;

  const echoRes = computeQuantumEchoTargets(srcEn, [srcEn, linkedEn, unlinkedEn, farLinkedEn], 1000, 195, 3);
  assert.equal(echoRes.length, 1);
  assert.equal(echoRes[0].target.id, linkedEn.id);
  assert.equal(echoRes[0].echoDamage, 350);

  // Silence disables Summoner / Healer abilities and slows Boss windup
  const summoner = createEnemyForWave(105, 'summoner', 5, map, false, 'normal', 'campaign');
  summoner.silencedTimer = 3.0;
  summoner.abilityCooldown = 0.05;
  const silentRes = stepEnemies([summoner], map, 0.2);
  assert.equal(silentRes.outcome.spawnRequests.length, 0, 'Silenced summoner must not summon');
  assert.equal(silentRes.outcome.windupEvents.length, 0, 'Silenced enemy must not start windup');

  const cryoBase = getGunCatalogItem('cryo').cost;
  const investedLv3 = getGunTotalInvested('cryo', 3);
  assert.equal(investedLv3, cryoBase * (1 + 2 + 4));
  assert.equal(getGunSellRefund({ type: 'cryo', level: 3 }), Math.round(investedLv3 * 0.72));
});

test('Electric + Wet/Cryo environmental synergy & Super Boss windup/interrupt mechanics', () => {
  const map = PRISM_MAPS[0];
  const superBoss = createEnemyForWave(1, 'super_boss', 12, map, false, 'normal', 'campaign');

  const drySyn = computeElectricWetSynergy(superBoss, 6);
  assert.equal(drySyn.isWetSynergy, false);
  assert.equal(drySyn.damageMult, 1);

  superBoss.slowTimer = 2.0;
  const cryoSyn = computeElectricWetSynergy(superBoss, 6);
  assert.equal(cryoSyn.isWetSynergy, true);
  assert.equal(cryoSyn.damageMult, 1.25);
  assert.equal(cryoSyn.extraChains, 1);

  const wz = map.wetZones[0];
  const wzPt = gridToWorldCenter(wz.col, wz.row);
  superBoss.x = wzPt.x;
  superBoss.y = wzPt.y;
  superBoss.slowTimer = 0;
  superBoss.abilityCooldown = 0.05;
  const stepRes = stepEnemies([superBoss], map, 0.1);
  assert.ok(superBoss.wetTimer >= 1.6);
  assert.equal(stepRes.outcome.windupEvents.length, 1);

  const wetSyn = computeElectricWetSynergy(superBoss, 6);
  assert.equal(wetSyn.isWetSynergy, true);
  assert.equal(wetSyn.damageMult, 1.5);
  assert.equal(wetSyn.extraChains, 2);
  assert.equal(wetSyn.splashBonusPx, 24);

  const interrupted = interruptEnemyWindup(superBoss);
  assert.equal(interrupted, true);
  assert.equal(superBoss.windupTimer, 0);
  assert.ok(superBoss.stunTimer >= 0.38);

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
});

test('1200-energy Astral Ark, Chronos 700, Orbital 300, Singularity 330, Mothership 280 & Overdrive balance', () => {
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
    assert.ok(moved >= en.speed * c.floor * 0.25 - 0.05);
  }

  // Distinct combat roles at MAX Lv7
  assert.equal(getGunCombatProfile('gatling', 7).projectilesPerShot, 4);
  assert.ok(getGunCombatProfile('shotgun', 7).projectilesPerShot >= 9);
  assert.ok(getGunCombatProfile('flamer', 7).burnDps > 0);
  assert.ok(getGunCombatProfile('saw', 7).chainCount >= 7);
  assert.ok(getGunCombatProfile('mortar', 7).pullForce >= 18);
  assert.ok(getGunCombatProfile('missile', 7).splashRadius >= 100);
  assert.equal(getGunCombatProfile('railgun', 7).armorPierce, 1);
  assert.ok(getGunCombatProfile('tesla', 7).chainCount >= 7);
  assert.ok(getGunCombatProfile('tempest', 7, 'omega').shieldMult >= 1.9);

  // Requested pricing checks (incl. reworked Orbital 500⚡, Aegis Bastion 800⚡, 3 new guns, and 3 map-exclusive guns)
  assert.equal(getGunCatalogItem('orbital').cost, 500);
  assert.equal(getGunCatalogItem('aegis_bastion').cost, 800);
  assert.equal(getGunCatalogItem('aegis_bastion').hotkey, 'k');
  assert.equal(getGunCatalogItem('prism_refract').cost, 300);
  assert.equal(getGunCatalogItem('hyperion').cost, 500);
  assert.equal(getGunCatalogItem('aurora_spire').cost, 500);
  assert.equal(getGunCatalogItem('aurelia_cannon').cost, 450);
  assert.equal(getGunCatalogItem('paradox_scythe').cost, 600);
  assert.equal(getGunCatalogItem('nebula_core').cost, 850);
  assert.equal(getGunCatalogItem('singularity').cost, 330);
  assert.equal(getGunCatalogItem('mothership').cost, 280);
  assert.equal(getGunCatalogItem('chronos').cost, 700);
  assert.equal(getGunCatalogItem('quantum_prism').cost, 500);

  // Hybrid Offense + Defense Aegis Bastion (800⚡) Core Shield generation + absorption
  const aegisNone = computeAegisCoreShieldSpec([]);
  assert.equal(aegisNone.maxShield, 0);
  assert.equal(aegisNone.bastionCount, 0);

  const aegisAlphaLv1 = computeAegisCoreShieldSpec([{ type: 'aegis_bastion', level: 1, variant: 'alpha' }]);
  assert.equal(aegisAlphaLv1.maxShield, 2);
  assert.equal(aegisAlphaLv1.rechargeAmount, 1);

  const aegisOmegaLv7 = computeAegisCoreShieldSpec([{ type: 'aegis_bastion', level: 7, variant: 'omega' }]);
  assert.equal(aegisOmegaLv7.maxShield, 14);
  assert.equal(aegisOmegaLv7.rechargeAmount, 2);
  assert.equal(aegisOmegaLv7.rechargeIntervalSec, 6.5);

  const fullBlock = applyCoreDamageWithShield(28, 5, 3);
  assert.deepEqual(fullBlock, { nextCoreHp: 28, nextCoreShield: 2, absorbed: 3, coreLoss: 0 });
  const partialBlock = applyCoreDamageWithShield(28, 2, 5);
  assert.deepEqual(partialBlock, { nextCoreHp: 25, nextCoreShield: 0, absorbed: 2, coreLoss: 3 });

  // Astral Ark (1200⚡)
  const astralMeta = getGunCatalogItem('astral_ark');
  assert.equal(astralMeta.cost, 1200);
  assert.equal(astralMeta.hotkey, 'n');
  const astralLv1Alpha = getGunCombatProfile('astral_ark', 1, 'alpha');
  const astralLv1Omega = getGunCombatProfile('astral_ark', 1, 'omega');
  const astralLv7Alpha = getGunCombatProfile('astral_ark', 7, 'alpha');
  assert.ok(astralLv1Alpha.dpsEstimate >= 1350, 'Astral Ark 1200⚡ Lv1 DPS must justify apex 1200⚡ cost');
  assert.ok(astralLv1Omega.damage > astralLv1Alpha.damage);
  assert.ok(astralLv7Alpha.dpsEstimate > getGunCombatProfile('chronos', 7, 'alpha').dpsEstimate);
  assert.equal(astralLv7Alpha.projectilesPerShot, 5);
  assert.equal(astralLv7Alpha.brittleBonus, 0.04);
  assert.equal(getAstralMaxRifts(1, 'omega'), 1);
  assert.equal(getAstralMaxRifts(3, 'omega'), 1);
  assert.equal(getAstralMaxRifts(5, 'omega'), 2);
  assert.equal(getAstralMaxRifts(5, 'alpha'), 3);

  // Chronos (700⚡)
  assert.equal(getChronosMaxFields(1, 'omega'), 1);
  assert.equal(getChronosMaxFields(3, 'omega'), 1);
  assert.equal(getChronosMaxFields(5, 'omega'), 2);
  assert.equal(getChronosMaxFields(5, 'alpha'), 3);
  assert.equal(computeChronoFieldRecord(500, 1000, 0.56, 30000), 1060);

  // Mothership & Singularity
  assert.equal(getMothershipMaxDrones(1, 'omega'), 3);
  assert.equal(getMothershipMaxDrones(6, 'omega'), 4);
  assert.equal(getMothershipMaxDrones(6, 'alpha'), 5);
  assert.equal(shouldDroneEvadeBossPulse(210, 210, 200, 200, 80), true);
  assert.equal(shouldDroneEvadeBossPulse(400, 400, 200, 200, 80), false);
  const holeGrowth = computeSingularitySwallowGrowth(
    { baseRadius: 96, killsAbsorbed: 2, accumulatedDamage: 250, maxScale: 1.85 },
    400,
    7,
    'omega'
  );
  assert.equal(holeGrowth.killsAbsorbed, 3);
  assert.ok(holeGrowth.currentRadius > 96);

  // Overdrive ("Hội Tụ Hỏa Lực"): minimum 30s real active combat time-based charge (damage charge === 0) + Global Skill/Support/Attack Empowerment
  assert.equal(OVERDRIVE_CONFIG.chargeDurationSec, 30);
  assert.equal(OVERDRIVE_CONFIG.initialCharge, 0);
  assert.equal(OVERDRIVE_CONFIG.durationSec, 10);
  assert.equal(OVERDRIVE_CONFIG.speedMult, 2.05);
  assert.equal(OVERDRIVE_CONFIG.damageMult, 1.85);
  assert.equal(OVERDRIVE_CONFIG.skillPowerMult, 1.65);
  assert.equal(OVERDRIVE_CONFIG.supportAuraMult, 1.45);
  assert.equal(OVERDRIVE_CONFIG.hudDpsMult, 3.8);
  assert.equal(computeOverdriveChargeGain(1000, 0.045), 0);
  assert.equal(computeOverdriveTimeChargeGain(30, false), 0);
  assert.ok(Math.abs(computeOverdriveTimeChargeGain(30, true) - 100) < 0.001);

  // Kill reward boost
  assert.equal(ENEMY_KILL_COIN_BOOST, 1.1);
  assert.equal(boostEnemyKillReward(10), 11);

  // Verify applyDamageToEnemy armor pierce + shield
  const boss = createEnemyForWave(2, 'boss', 4, map, false, 'hard', 'campaign');
  const hit = applyDamageToEnemy(boss, 500, { armorPierce: 1, shieldMult: 2 });
  assert.ok(hit.actualDamage >= 500);
});

test('prismTdSound synthesizes compressor+shaper bus, guards suspended state, and covers all 25 guns + Overheat + interrupt', () => {
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
    assert.equal(compressorCount, 1);
    assert.equal(shaperCount, 1);
    assert.equal(bufferCount, 8);
    assert.ok(noiseSrcCount + oscCount - beforeVoices >= 65);
    assert.ok(filterCount > 0);
  } finally {
    (performance as { now: () => number }).now = origPerfNow;
  }
});
