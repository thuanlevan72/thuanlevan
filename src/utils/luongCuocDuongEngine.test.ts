import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_DAYS,
  addScaleWeight,
  advanceToNextDay,
  clearScaleWeights,
  computeAbacusValue,
  computeScaleTiltNormalized,
  computeScaleWeightsTotal,
  createInitialAbacus,
  createInitialGameState,
  decomposeToAbacus,
  dipSealInInk,
  getDayScript,
  getPhaseForDay,
  inspectPulleyParcel,
  isAbacusMatched,
  isScaleBalanced,
  lowerPulleyParcel,
  placeParcelOnScale,
  refillAndLightLamp,
  removeScaleWeightAt,
  resolveVentChoice,
  setAbacusEarth,
  stampDailyRequisition,
  tickLampAndAtmosphere,
  toggleAbacusHeaven,
  washFaceAtBasin,
} from './luongCuocDuongEngine';

test('30-day script covers all 3 phases with exact day sequence and Phase 3 keepsakes', () => {
  assert.equal(ALL_DAYS.length, 30);
  for (let i = 0; i < 30; i += 1) {
    assert.equal(ALL_DAYS[i].day, i + 1);
    assert.equal(ALL_DAYS[i].phase, getPhaseForDay(i + 1));
  }
  assert.equal(getDayScript(1).phase, 1);
  assert.equal(getDayScript(10).phase, 1);
  assert.equal(getDayScript(11).phase, 2);
  assert.equal(getDayScript(20).phase, 2);
  assert.equal(getDayScript(21).phase, 3);
  assert.equal(getDayScript(30).phase, 3);

  const day21 = getDayScript(21);
  assert.ok(day21.generalDecree?.includes('THÀNH CÒN NGƯỜI'));
  assert.equal(day21.keepsake?.npcId, 'baker');
  assert.equal(getDayScript(23).keepsake?.npcId, 'mother');
  assert.equal(getDayScript(25).keepsake?.npcId, 'scholar');
});

test('Suanpan abacus computes base-10 hundreds/tens/ones accurately', () => {
  let abacus = createInitialAbacus();
  assert.equal(computeAbacusValue(abacus), 0);

  // Set 64: Tens heaven(5)+earth(1)=6, Ones earth(4)=4
  abacus = toggleAbacusHeaven(abacus, 1);
  abacus = setAbacusEarth(abacus, 1, 1);
  abacus = setAbacusEarth(abacus, 2, 4);
  assert.equal(computeAbacusValue(abacus), 64);

  // Clicking same active top earth bead reduces by 1
  abacus = setAbacusEarth(abacus, 2, 4);
  assert.equal(computeAbacusValue(abacus), 63);

  // Round-trip decompose
  assert.equal(computeAbacusValue(decomposeToAbacus(137)), 137);
  assert.equal(computeAbacusValue(decomposeToAbacus(0)), 0);
});

test('Scale weights balancing and tilt direction work properly', () => {
  let state = createInitialGameState(1); // Day 1 actualLiang = 25
  state = lowerPulleyParcel(state);
  state = placeParcelOnScale(state);
  assert.ok(computeScaleTiltNormalized(state) < 0); // left parcel heavier when no counterweights

  state = addScaleWeight(state, 20);
  state = addScaleWeight(state, 5);
  assert.equal(computeScaleWeightsTotal(state.scaleWeights), 25);
  assert.equal(isScaleBalanced(state), true);
  assert.equal(computeScaleTiltNormalized(state), 0);

  state = removeScaleWeightAt(state, 1);
  assert.equal(isScaleBalanced(state), false);
  state = clearScaleWeights(state);
  assert.equal(state.scaleWeights.length, 0);
});

test('Complete daily workflow advances cleanly across all 30 days to Historical Liberation ending', () => {
  let state = createInitialGameState(1);

  for (let day = 1; day <= 30; day += 1) {
    assert.equal(state.day, day);
    const script = getDayScript(day);

    // Keep lamp topped up and wash face when sanity dips
    if (state.lampOil < 50) {
      state = refillAndLightLamp(state);
    }
    if (state.sanity < 85 && !state.washedFaceToday) {
      state = washFaceAtBasin(state);
    }

    state = lowerPulleyParcel(state);
    state = inspectPulleyParcel(state);
    state = placeParcelOnScale(state);

    // Place exact weights
    let remaining = script.actualLiang;
    for (const w of [50, 20, 10, 5, 2, 1]) {
      while (remaining >= w) {
        state = addScaleWeight(state, w);
        remaining -= w;
      }
    }
    state = { ...state, abacus: decomposeToAbacus(script.actualLiang) };
    assert.equal(isScaleBalanced(state), true);
    assert.equal(isAbacusMatched(state), true);

    if (!state.ventHandled && script.ventEncounter) {
      state = resolveVentChoice(state, script.ventEncounter.canShareCrumbs ? 'shared' : 'withheld');
    }

    state = dipSealInInk(state);
    // Reject one keepsake sack in Phase 3 to preserve sanity without failing compliance
    const decision = day === 24 ? 'rejected' : 'approved';
    state = stampDailyRequisition(state, decision);
    assert.equal(state.ending, null, `Unexpected early ending on day ${day}: ${state.ending}`);

    state = advanceToNextDay(state);
  }

  assert.equal(state.ending, 'historical_liberation');
  assert.equal(state.history.length, 30);
});

test('Oil lamp depletion triggers darkness -> suffocation / sanity collapse if unrefilled', () => {
  let state = createInitialGameState(21);
  state = { ...state, lampOil: 1.5, lampLit: true };

  // Burn remaining oil
  state = tickLampAndAtmosphere(state, 2);
  assert.equal(state.lampLit, false);
  assert.equal(state.lampOil, 0);
  assert.equal(state.washbasinGhostActive, true);

  // Refill restores light
  const relit = refillAndLightLamp(state);
  assert.equal(relit.lampLit, true);
  assert.ok(relit.lampOil > 35);

  // Leaving in total darkness triggers suffocation ending
  let darkState = state;
  for (let i = 0; i < 15; i += 1) {
    darkState = tickLampAndAtmosphere(darkState, 2);
  }
  assert.ok(darkState.ending === 'suffocated_darkness' || darkState.ending === 'sanity_collapsed');
});

test('Repeatedly rejecting rations triggers iron door breach ending', () => {
  let state = createInitialGameState(21);
  state = { ...state, compliance: 20 };
  state = lowerPulleyParcel(state);
  state = dipSealInInk(state);
  state = stampDailyRequisition(state, 'rejected');
  assert.equal(state.ending, 'iron_door_breached');
});
