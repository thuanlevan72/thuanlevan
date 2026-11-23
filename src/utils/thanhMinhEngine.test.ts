import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerInterrogationStep,
  createInitialThanhMinhState,
  evaluateFinalEnding,
  interactWithHotspot,
  setRadioFrequency,
  STORY_LORE_ENTRIES,
  submitWuxingElement,
  swapPuppetSlots,
  tickThanhMinhSimulation,
  toggleRealmShift,
  TRUTH_KEEPSAKES,
} from './thanhMinhEngine.ts';

test('thanhMinh: initial state starts in Hồi 1 Lớp 12B with full sanity & breath', () => {
  const s = createInitialThanhMinhState();
  assert.equal(s.act, 1);
  assert.equal(s.scene, 'classroom_12b');
  assert.equal(s.realm, 'yang');
  assert.equal(s.sanity, 100);
  assert.equal(s.breathStamina, 100);
  assert.equal(s.collectedKeepsakeIds.length, 0);
  assert.equal(s.collectedLoreIds.length, 0);
});

test('thanhMinh: holding breath consumes stamina and triggers gasp when depleted', () => {
  let state = createInitialThanhMinhState();
  let gasped = false;
  for (let i = 0; i < 120; i += 1) {
    const res = tickThanhMinhSimulation(state, { dt: 0.05, moveDir: 0, holdingBreath: true });
    state = res.next;
    if (res.events.gasped) {
      gasped = true;
      break;
    }
  }
  assert.equal(gasped, true);
  assert.ok(state.gaspPenaltyTimer > 0);
});

test('thanhMinh: Ngũ Hành altar requires incense from 12B and Kim -> Thủy -> Hỏa sequence', () => {
  let s = createInitialThanhMinhState();
  // Move to incense cabinet at x=560 in classroom_12b and pick it up
  s = { ...s, playerX: 560 };
  s = interactWithHotspot(s);
  assert.ok(s.inventory.includes('incense_bundle'));

  // Wrong sequence resets
  const wrong = submitWuxingElement(s, 'Hỏa');
  assert.equal(wrong.reset, true);
  assert.equal(wrong.solved, false);

  // Correct sequence Kim -> Thủy -> Hỏa pacifies corridor ghost and unlocks stair gate
  const step1 = submitWuxingElement(s, 'Kim');
  const step2 = submitWuxingElement(step1.next, 'Thủy');
  const step3 = submitWuxingElement(step2.next, 'Hỏa');
  assert.equal(step3.solved, true);
  assert.equal(step3.next.flags.wuxing_solved, true);
});

test('thanhMinh: Radio unlocks Realm Shift at 104.7 MHz (Act 2) and secret 109.2 MHz (Act 3)', () => {
  let s = createInitialThanhMinhState();
  s = { ...s, act: 2 };
  const blockedShift = toggleRealmShift(s);
  assert.equal(blockedShift.shifted, false);

  s = setRadioFrequency(s, 104.7);
  assert.equal(s.radioTunedAct2, true);
  assert.equal(s.realm, 'yin');

  const toggledBack = toggleRealmShift(s);
  assert.equal(toggledBack.shifted, true);
  assert.equal(toggledBack.next.realm, 'yang');

  const s3 = setRadioFrequency({ ...s, act: 3 }, 109.2);
  assert.equal(s3.radioSecretAct3Solved, true);
});

test('thanhMinh: 4-slot Shadow Puppet puzzle solves when ordered [0, 1, 2, 3] and pacifies Act 3 specter', () => {
  // Initial puppetOrder is [2, 0, 3, 1]
  let s = createInitialThanhMinhState();
  s = swapPuppetSlots(s, 0, 1); // [0, 2, 3, 1]
  assert.equal(s.puppetsSolved, false);
  s = swapPuppetSlots(s, 1, 3); // [0, 1, 3, 2]
  s = swapPuppetSlots(s, 2, 3); // [0, 1, 2, 3]
  assert.equal(s.puppetsSolved, true);
  assert.equal(s.flags.puppets_solved, true);
  const act3Ghost = s.ghosts.find((g) => g.scene === 'auditorium');
  assert.equal(act3Ghost?.pacified, true);
});

test('thanhMinh: evaluates all 4 endings based on honesty, keepsakes %, Act 3 radio & sanityBottomCount', () => {
  // Ending 1: Denies guilt in Hồi 4
  let s1 = { ...createInitialThanhMinhState(), confessionAnswers: [true, false] };
  assert.equal(evaluateFinalEnding(s1, true), 'ending_1_loop');

  // Ending 2: Confesses all, but < 50% keepsakes (2/6)
  let s2 = {
    ...createInitialThanhMinhState(),
    confessionAnswers: [true, true],
    collectedKeepsakeIds: [TRUTH_KEEPSAKES[0].id, TRUTH_KEEPSAKES[1].id],
  };
  assert.equal(evaluateFinalEnding(s2, true), 'ending_2_ashes');

  // Ending 3: Confesses all, 4/6 keepsakes, missing Act 3 secret radio
  let s3 = {
    ...createInitialThanhMinhState(),
    confessionAnswers: [true, true],
    collectedKeepsakeIds: TRUTH_KEEPSAKES.slice(0, 4).map((k) => k.id),
    radioSecretAct3Solved: false,
  };
  assert.equal(evaluateFinalEnding(s3, true), 'ending_3_late_qingming');

  // Ending 4: True Ending (6/6 keepsakes + 109.2 MHz + 0 sanity collapse + 3 honest answers)
  let s4 = {
    ...createInitialThanhMinhState(),
    collectedKeepsakeIds: TRUTH_KEEPSAKES.map((k) => k.id),
    radioSecretAct3Solved: true,
    sanityBottomCount: 0,
  };
  s4 = answerInterrogationStep(s4, true);
  s4 = answerInterrogationStep(s4, true);
  s4 = answerInterrogationStep(s4, true);
  assert.equal(s4.ending, 'ending_4_dawn_coson');
});

test('thanhMinh: getCurrentObjectiveHint tracks current Act and key flags', async () => {
  const { getCurrentObjectiveHint } = await import('./thanhMinhEngine.ts');
  const s1 = createInitialThanhMinhState();
  assert.match(getCurrentObjectiveHint(s1), /Lớp 12B/i);
  const s2 = { ...s1, act: 2 as const, radioTunedAct2: false };
  assert.match(getCurrentObjectiveHint(s2), /104\.7 MHz/);
  const s4 = { ...s1, act: 4 as const, flags: { saw_20_years_ruin: true } };
  assert.match(getCurrentObjectiveHint(s4), /Phòng Thẩm Vấn/);
});

test('thanhMinh: triggers 3.4s monster kill cutscene on sanity collapse and respawns cleanly', () => {
  let s = createInitialThanhMinhState();
  // Place Lâm Tĩnh in corridor_act1 directly beside Vong Hồn Mũ Giấy with low sanity
  s = {
    ...s,
    scene: 'corridor_act1',
    playerX: 760,
    sanity: 1,
    holdingBreath: false,
  };
  const caught = tickThanhMinhSimulation(s, { dt: 0.05, moveDir: 0, holdingBreath: false });
  assert.equal(caught.events.sanityCollapsed, true);
  assert.equal(caught.events.killedByGhostKind, 'paper_hat');
  assert.equal(caught.next.deathCutscene?.active, true);
  assert.equal(caught.next.sanityBottomCount, 1);

  // Advance simulation past 3.4s cutscene duration until respawn
  let cur = caught.next;
  for (let i = 0; i < 75; i += 1) {
    cur = tickThanhMinhSimulation(cur, { dt: 0.05, moveDir: 0, holdingBreath: false }).next;
    if (cur.deathCutscene === null) break;
  }
  assert.equal(cur.deathCutscene, null);
  assert.equal(cur.sanity, 52);
});

test('thanhMinh: expanded lore archive, darkroom_key unlock, and 1986 Qingming memorial tribute work properly', () => {
  assert.equal(STORY_LORE_ENTRIES.length, 10);

  // 1. Lore echo pickup in Classroom 12B
  let s = { ...createInitialThanhMinhState(), playerX: 405 };
  s = interactWithHotspot(s);
  assert.equal(s.activeModal, 'memory_echo');
  assert.equal(s.activeLoreId, 'lore-1-blackboard');
  assert.ok(s.collectedLoreIds.includes('lore-1-blackboard'));

  // 2. Darkroom ledger secret unlocks when holding darkroom_key
  s = {
    ...s,
    activeModal: 'none',
    scene: 'darkroom',
    playerX: 305,
    inventory: ['darkroom_key'],
  };
  s = interactWithHotspot(s);
  assert.equal(s.flags.darkroom_drawer_opened, true);
  assert.equal(s.activeLoreId, 'lore-7-darkroom-ledger');

  // 3. 1986 Wine Cup pickup + Memorial tribute with Tô Viễn restores sanity
  s = {
    ...s,
    activeModal: 'none',
    scene: 'ruined_hall_1986',
    playerX: 225,
    sanity: 70,
  };
  s = interactWithHotspot(s);
  assert.ok(s.inventory.includes('wine_cup'));

  s = { ...s, playerX: 555 };
  s = interactWithHotspot(s);
  assert.equal(s.flags.offered_qingming_tribute, true);
  assert.equal(s.sanity, 88);
  assert.equal(s.activeLoreId, 'lore-10-to-vien-1986');
});

