import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTuanTangState,
  getTombZoneForZ,
  strikeMatch,
  tickTuanTangSimulation,
  toggleHideOrInteract,
  type TuanTangGameState,
  type TuanTangInputFrame,
} from './tuanTangEngine.ts';

function baseInput(overrides: Partial<TuanTangInputFrame> = {}): TuanTangInputFrame {
  return {
    dt: 0.05,
    moveForward: 0,
    moveRight: 0,
    sprint: false,
    crouch: false,
    holdingMouth: false,
    micLevel: 0,
    micThreshold: 22,
    manualBreathHold: false,
    ...overrides,
  };
}

test('createInitialTuanTangState initializes mausoleum zones, matches, and darkness', () => {
  const st = createInitialTuanTangState('explorer');
  assert.equal(st.zone, 'ossuary');
  assert.equal(st.matchLit, false);
  assert.equal(st.matchesRemaining, 9);
  assert.equal(st.ending, 'none');
  assert.equal(getTombZoneForZ(-25), 'mercury_canal');
  assert.equal(getTombZoneForZ(-55), 'terracotta_hall');
  assert.equal(getTombZoneForZ(-85), 'dome_ascent');
});

test('strikeMatch illuminates tomb, alerts crawlers within 50m, and extinguishes on second call', () => {
  let st = createInitialTuanTangState('explorer');
  // Avoid damp fail check by offsetting elapsedSec
  st = { ...st, elapsedSec: 1.1 };
  const litRes = strikeMatch(st);
  assert.equal(litRes.outcome, 'lit');
  assert.equal(litRes.next.matchLit, true);
  assert.equal(litRes.next.matchesRemaining, 8);
  assert.ok(litRes.next.crawlers[0].alertness > st.crawlers[0].alertness);

  const extRes = strikeMatch(litRes.next);
  assert.equal(extRes.outcome, 'extinguished');
  assert.equal(extRes.next.matchLit, false);
});

test('hiding sniff encounter kills player if Mic breath exceeds threshold, survives if quiet', () => {
  const base = createInitialTuanTangState('explorer');
  const coffin = base.hidingSpots[0];
  let st = {
    ...base,
    playerX: coffin.x + 1.0,
    playerZ: coffin.z,
  };
  // Place crawler near to trigger sniff encounter
  st.crawlers[0] = { ...st.crawlers[0], x: coffin.x + 3.0, z: coffin.z, alertness: 75 };

  const hideRes = toggleHideOrInteract(st);
  assert.equal(hideRes.action, 'entered_hide');
  assert.equal(hideRes.next.sniffEncounterActive, true);

  // Case A: Player stays completely silent -> survives
  let quietState = hideRes.next;
  for (let i = 0; i < 100; i += 1) {
    const tick = tickTuanTangSimulation(quietState, baseInput({ micLevel: 4, micThreshold: 22 }));
    quietState = tick.next;
    if (!quietState.sniffEncounterActive) break;
  }
  assert.equal(quietState.sniffEncounterActive, false);
  assert.equal(quietState.ending, 'none');

  // Case B: Player gasps/exhales loudly into Mic -> dragged out!
  let loudState = hideRes.next;
  for (let i = 0; i < 60; i += 1) {
    const tick = tickTuanTangSimulation(loudState, baseInput({ micLevel: 78, micThreshold: 22 }));
    loudState = tick.next;
    if (loudState.ending !== 'none') break;
  }
  assert.equal(loudState.ending, 'caught_crawler');
});

test('holding mouth suppresses mercury cough noise but suffocates at 0 oxygen', () => {
  let st = createInitialTuanTangState('explorer');
  st = { ...st, mercuryToxicity: 75, coughActive: true, coughTimer: 2.0, oxygen: 20 };

  const suppressed = tickTuanTangSimulation(st, baseInput({ holdingMouth: true, dt: 0.05 }));
  assert.equal(suppressed.events.coughSuppressed, true);
  assert.ok(suppressed.next.emittedNoise <= 15);
  assert.ok(suppressed.next.oxygen < 20);

  // Hold too long -> suffocation
  let curr = suppressed.next;
  for (let i = 0; i < 40; i += 1) {
    curr = tickTuanTangSimulation(curr, baseInput({ holdingMouth: true, dt: 0.05 })).next;
    if (curr.ending !== 'none') break;
  }
  assert.equal(curr.ending, 'suffocated');
});

test('living terracotta mimics freeze under matchlight gaze and creep when unseen', () => {
  const base = createInitialTuanTangState('explorer');
  const mimic = base.statues.find((s) => s.isMimic)!;
  // Place player facing directly at mimic with match lit
  let st: TuanTangGameState = {
    ...base,
    zone: 'terracotta_hall',
    playerX: mimic.x,
    playerZ: mimic.z + 6,
    yaw: 0, // looking -Z directly at mimic
    matchLit: true,
    matchTimer: 5,
  };
  const observedTick = tickTuanTangSimulation(st, baseInput({ dt: 0.05 }));
  const mimicAfterWatch = observedTick.next.statues.find((s) => s.id === mimic.id)!;
  assert.equal(mimicAfterWatch.x, mimic.x);
  assert.equal(mimicAfterWatch.z, mimic.z);

  // Turn back (yaw = PI) -> mimic creeps closer!
  st = { ...observedTick.next, yaw: Math.PI };
  const unseenTick = tickTuanTangSimulation(st, baseInput({ dt: 0.05 }));
  const mimicAfterUnseen = unseenTick.next.statues.find((s) => s.id === mimic.id)!;
  assert.ok(mimicAfterUnseen.z > mimic.z);
});

test('crossbow tripwire triggers upright and can be crouched under safely', () => {
  const base = createInitialTuanTangState('explorer');
  const trap = base.traps[0];
  const crouched = tickTuanTangSimulation(
    { ...base, playerX: trap.x, playerZ: trap.z },
    baseInput({ crouch: true })
  );
  assert.equal(crouched.next.ending, 'none');

  const upright = tickTuanTangSimulation(
    { ...base, playerX: trap.x, playerZ: trap.z },
    baseInput({ crouch: false })
  );
  assert.equal(upright.next.ending, 'trap_crossbow');
});

test('reaching north dome ventilation slit triggers desperate_slit ending', () => {
  const base = createInitialTuanTangState('explorer');
  const st = { ...base, zone: 'dome_ascent' as const, playerX: 0, playerZ: -93.1 };
  const tick = tickTuanTangSimulation(st, baseInput({ moveForward: 1, dt: 0.08 }));
  assert.equal(tick.next.ending, 'desperate_slit');
});
