import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerInterrogationStep,
  createInitialThanhMinhState,
  evaluateFinalEnding,
  interactWithHotspot,
  LEGACY_MOVEMENT_SPEEDS,
  MOVEMENT_SPEEDS,
  pressPianoKey,
  SCENE_META,
  setCipherDigit,
  setInfirmaryClock,
  setRadioFrequency,
  SPEED_SCALE_FACTOR,
  STORY_LORE_ENTRIES,
  submitWuxingElement,
  swapBookshelfSlots,
  swapPuppetSlots,
  type SceneId,
  type ThanhMinhState,
  tickThanhMinhSimulation,
  toggleRealmShift,
  TRUTH_KEEPSAKES,
} from './thanhMinhEngine.ts';

test('thanhMinh: initial state starts in Hồi 1 Lớp 12B with full sanity, breath & run stamina', () => {
  const s = createInitialThanhMinhState();
  assert.equal(s.act, 1);
  assert.equal(s.scene, 'classroom_12b');
  assert.equal(s.realm, 'yang');
  assert.equal(s.sanity, 100);
  assert.equal(s.breathStamina, 100);
  assert.equal(s.runStamina, 100);
  assert.equal(s.isRunning, false);
  assert.equal(s.exhausted, false);
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

test('thanhMinh: sprinting consumes runStamina, locks running on exhaustion (forces slow walk), and recovers above 35%', () => {
  // 1. Sprinting is significantly faster than normal walking (using dt: 0.05 within physics clamp)
  const walkStep = tickThanhMinhSimulation(createInitialThanhMinhState(), {
    dt: 0.05,
    moveDir: 1,
    holdingBreath: false,
    sprinting: false,
  });
  const sprintStep = tickThanhMinhSimulation(createInitialThanhMinhState(), {
    dt: 0.05,
    moveDir: 1,
    holdingBreath: false,
    sprinting: true,
  });
  assert.equal(sprintStep.next.isRunning, true);
  assert.ok(sprintStep.next.runStamina < 100);
  // -35% speeds: run = 161.2 px/s (8.06px/0.05s), walk = 100.1 px/s (5.005px/0.05s) -> diff = 3.055px
  assert.ok(sprintStep.next.playerX > walkStep.next.playerX + 2.5);

  // 2. Drain runStamina down to 0 -> triggers exhaustedNow and forces fatigued slow walk even while holding Shift
  let state: ThanhMinhState = {
    ...createInitialThanhMinhState(),
    scene: 'corridor_act1',
    playerX: 100,
  };
  let triggeredExhausted = false;
  for (let i = 0; i < 100; i += 1) {
    const res = tickThanhMinhSimulation(state, {
      dt: 0.05,
      moveDir: 1,
      holdingBreath: false,
      sprinting: true,
    });
    state = res.next;
    if (res.events.exhaustedNow) {
      triggeredExhausted = true;
      break;
    }
  }
  assert.equal(triggeredExhausted, true);
  assert.equal(state.exhausted, true);
  assert.equal(state.runStamina, 0);
  assert.equal(state.isRunning, false);

  // Moving 0.25s (5 ticks * 0.05s) while fatigued + sprinting=true locks out running and moves ~14.3px (57.2 px/s)
  const xBeforeFatigueWalk = state.playerX;
  let fatigueWalkState: ThanhMinhState = state;
  for (let i = 0; i < 5; i += 1) {
    const step = tickThanhMinhSimulation(fatigueWalkState, {
      dt: 0.05,
      moveDir: 1,
      holdingBreath: false,
      sprinting: true,
    });
    fatigueWalkState = step.next;
  }
  assert.equal(fatigueWalkState.exhausted, true);
  assert.equal(fatigueWalkState.isRunning, false);
  const dxFatigue = fatigueWalkState.playerX - xBeforeFatigueWalk;
  assert.ok(dxFatigue > 12 && dxFatigue < 17, `Expected ~14.3px fatigued walk, got ${dxFatigue}`);

  // 3. Standing still recovers runStamina; remains exhausted until >= 35%
  let recState: ThanhMinhState = fatigueWalkState;
  for (let i = 0; i < 60; i += 1) {
    recState = tickThanhMinhSimulation(recState, {
      dt: 0.05,
      moveDir: 0,
      holdingBreath: false,
      sprinting: false,
    }).next;
  }
  assert.ok(recState.runStamina >= 35);
  assert.equal(recState.exhausted, false);
});

test('thanhMinh: Ngũ Hành altar requires incense from 12B and Kim -> Thủy -> Hỏa sequence', () => {
  let s = createInitialThanhMinhState();
  // Move to incense cabinet at x=1120 in widened classroom_12b and pick it up
  s = { ...s, playerX: 1120 };
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

  // Ending 3: Confesses all, >= 50% keepsakes (5/10), missing Act 3 secret radio
  let s3 = {
    ...createInitialThanhMinhState(),
    confessionAnswers: [true, true],
    collectedKeepsakeIds: TRUTH_KEEPSAKES.slice(0, 5).map((k) => k.id),
    radioSecretAct3Solved: false,
  };
  assert.equal(evaluateFinalEnding(s3, true), 'ending_3_late_qingming');

  // Ending 4: True Ending (8/8 keepsakes + 109.2 MHz + 0 sanity collapse + 4 honest answers)
  let s4 = {
    ...createInitialThanhMinhState(),
    collectedKeepsakeIds: TRUTH_KEEPSAKES.map((k) => k.id),
    radioSecretAct3Solved: true,
    sanityBottomCount: 0,
  };
  s4 = answerInterrogationStep(s4, true);
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
  // Place Lâm Tĩnh in widened corridor_act1 directly beside Vong Hồn Mũ Giấy (starts at x=1220) with low sanity
  s = {
    ...s,
    scene: 'corridor_act1',
    playerX: 1200,
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

test('thanhMinh: expanded lore archive (18), keepsakes (10), darkroom_key unlock, and 1986 Qingming memorial tribute work properly', () => {
  assert.equal(STORY_LORE_ENTRIES.length, 18);
  assert.equal(TRUTH_KEEPSAKES.length, 10);

  // 1. Lore echo pickup in widened Classroom 12B (x=680)
  let s = { ...createInitialThanhMinhState(), playerX: 680 };
  s = interactWithHotspot(s);
  assert.equal(s.activeModal, 'memory_echo');
  assert.equal(s.activeLoreId, 'lore-1-blackboard');
  assert.ok(s.collectedLoreIds.includes('lore-1-blackboard'));

  // 2. Darkroom ledger secret unlocks when holding darkroom_key (x=560)
  s = {
    ...s,
    activeModal: 'none',
    scene: 'darkroom',
    playerX: 560,
    inventory: ['darkroom_key'],
  };
  s = interactWithHotspot(s);
  assert.equal(s.flags.darkroom_drawer_opened, true);
  assert.equal(s.activeLoreId, 'lore-7-darkroom-ledger');

  // 3. 1986 Wine Cup pickup (x=420) + Memorial tribute with Tô Viễn (x=1140) restores sanity
  s = {
    ...s,
    activeModal: 'none',
    scene: 'ruined_hall_1986',
    playerX: 420,
    sanity: 70,
  };
  s = interactWithHotspot(s);
  assert.ok(s.inventory.includes('wine_cup'));

  s = { ...s, playerX: 1140 };
  s = interactWithHotspot(s);
  assert.equal(s.flags.offered_qingming_tribute, true);
  assert.equal(s.sanity, 88);
  assert.equal(s.activeLoreId, 'lore-10-to-vien-1986');
});

test('thanhMinh: teachers_office requires teachers_key & cipher_box unlocks ks-7 at 4-0-5', () => {
  let s: ThanhMinhState = {
    ...createInitialThanhMinhState(),
    scene: 'corridor_act1',
    playerX: 1720,
  };
  const blocked = interactWithHotspot(s);
  assert.equal(blocked.scene, 'corridor_act1');

  // Pick up teachers_key at x=1040
  s = interactWithHotspot({ ...s, playerX: 1040 });
  assert.ok(s.inventory.includes('teachers_key'));

  // Open teachers_office door at x=1720
  s = interactWithHotspot({ ...s, playerX: 1720 });
  assert.equal(s.scene, 'teachers_office');

  // Interact with cipher_box at x=1260
  s = interactWithHotspot({ ...s, playerX: 1260 });
  assert.equal(s.activeModal, 'cipher_lock');

  // Dial 4-0-5
  s = setCipherDigit(s, 0, 4).next;
  s = setCipherDigit(s, 1, 0).next;
  const solved = setCipherDigit(s, 2, 5);
  assert.equal(solved.solved, true);
  assert.equal(solved.next.cipherSolved, true);
  assert.equal(solved.next.flags.teachers_cipher_solved, true);
  assert.ok(solved.next.collectedKeepsakeIds.includes('ks-7-tranmac-pass'));
});

test('thanhMinh: roof_belltower bronze bell requires bell_mallet and completes 3-ring ritual', () => {
  let s: ThanhMinhState = {
    ...createInitialThanhMinhState(),
    scene: 'roof_belltower',
    playerX: 1040,
    act: 3,
  };
  const blockedBell = interactWithHotspot(s);
  assert.equal(blockedBell.bellRings, 0);

  s = { ...s, inventory: ['bell_mallet'] };
  s = interactWithHotspot(s);
  assert.equal(s.bellRings, 1);
  s = interactWithHotspot(s);
  assert.equal(s.bellRings, 2);
  s = interactWithHotspot(s);
  assert.equal(s.bellRings, 3);
  assert.equal(s.flags.bell_ritual_done, true);
  assert.ok(s.collectedKeepsakeIds.includes('ks-8-rooftop-letter'));
  const roofGhost = s.ghosts.find((g) => g.scene === 'roof_belltower');
  assert.equal(roofGhost?.pacified, true);
});

test('thanhMinh: peripheral horror phantom spawns behind player and triggers sting when spotlighted', () => {
  let s: ThanhMinhState = {
    ...createInitialThanhMinhState(),
    scene: 'corridor_act1',
    playerX: 520,
    playerFacing: 1,
    horrorPulseTimer: 0.02,
  };
  let knockTriggered = false;
  for (let i = 0; i < 10; i += 1) {
    const res = tickThanhMinhSimulation(s, { dt: 0.05, moveDir: 0, holdingBreath: false });
    s = res.next;
    if (res.events.horrorEvent === 'knock') {
      knockTriggered = true;
      break;
    }
  }
  assert.equal(knockTriggered, true);
  assert.ok(s.activePhantomX !== null);
  assert.ok(s.activePhantomX! < s.playerX);

  // Turn toward the phantom behind -> triggers subtle 'sting' and vanishes phantom
  const turnRes = tickThanhMinhSimulation(s, { dt: 0.05, moveDir: -1, holdingBreath: false });
  assert.equal(turnRes.events.horrorEvent, 'sting');
  assert.equal(turnRes.next.activePhantomX, null);
});

test('thanhMinh: movement speeds are reduced by exact 35% and all 15 scenes are widened', () => {
  assert.equal(SPEED_SCALE_FACTOR, 0.65);
  assert.ok(Math.abs(MOVEMENT_SPEEDS.walk - LEGACY_MOVEMENT_SPEEDS.walk * 0.65) < 1e-6);
  assert.ok(Math.abs(MOVEMENT_SPEEDS.run - LEGACY_MOVEMENT_SPEEDS.run * 0.65) < 1e-6);
  assert.ok(Math.abs(MOVEMENT_SPEEDS.holdBreath - LEGACY_MOVEMENT_SPEEDS.holdBreath * 0.65) < 1e-6);
  assert.ok(Math.abs(MOVEMENT_SPEEDS.exhausted - LEGACY_MOVEMENT_SPEEDS.exhausted * 0.65) < 1e-6);

  const sceneKeys = Object.keys(SCENE_META) as SceneId[];
  assert.equal(sceneKeys.length, 15);
  for (const key of sceneKeys) {
    const span = SCENE_META[key].maxX - SCENE_META[key].minX;
    assert.ok(span >= 1475, `Expected widened scene ${key} span >= 1475, got ${span}`);
  }
});

test('thanhMinh: Infirmary Clock (02:15) unlocks lantern_oil, ks-9 & stair gate with wuxing_solved', () => {
  let s: ThanhMinhState = {
    ...createInitialThanhMinhState(),
    scene: 'infirmary_wing',
    playerX: 1020,
    sanity: 70,
  };
  s = interactWithHotspot(s);
  assert.equal(s.activeModal, 'clock_puzzle');

  const wrong = setInfirmaryClock(s, 3, 20);
  assert.equal(wrong.solved, false);

  const right = setInfirmaryClock(wrong.next, 2, 15);
  assert.equal(right.solved, true);
  assert.equal(right.next.clockSolved, true);
  assert.equal(right.next.flags.clock_solved, true);
  assert.ok(right.next.inventory.includes('lantern_oil'));
  assert.ok(right.next.collectedKeepsakeIds.includes('ks-9-medical-slip'));
  const infGhost = right.next.ghosts.find((g) => g.scene === 'infirmary_wing');
  assert.equal(infGhost?.pacified, true);

  // Stair gate in corridor_act1 at x=2230 requires both wuxing_solved AND lantern_oil
  let gateState: ThanhMinhState = {
    ...right.next,
    activeModal: 'none',
    scene: 'corridor_act1',
    playerX: 2230,
    flags: { ...right.next.flags, wuxing_solved: false },
  };
  gateState = interactWithHotspot(gateState);
  assert.equal(gateState.scene, 'corridor_act1');

  gateState = interactWithHotspot({
    ...gateState,
    flags: { ...gateState.flags, wuxing_solved: true },
  });
  assert.equal(gateState.scene, 'flooded_courtyard');
});

test('thanhMinh: Library bookshelf cipher [0,1,2] grants red_ribbon, ks-10 & pacifies librarian_wraith', () => {
  // Initial bookshelfOrder is [1, 2, 0]
  let s = createInitialThanhMinhState();
  s = swapBookshelfSlots(s, 0, 2); // [0, 2, 1]
  assert.equal(s.bookshelfSolved, false);
  s = swapBookshelfSlots(s, 1, 2); // [0, 1, 2]
  assert.equal(s.bookshelfSolved, true);
  assert.equal(s.flags.library_books_solved, true);
  assert.ok(s.inventory.includes('red_ribbon'));
  assert.ok(s.collectedKeepsakeIds.includes('ks-10-reading-club-seal'));
  const libGhost = s.ghosts.find((g) => g.variant === 'librarian_wraith');
  assert.equal(libGhost?.pacified, true);
});

test('thanhMinh: Music classroom piano puzzle solves on Do -> Mi -> Sol -> Re and resets on wrong note', () => {
  let s: ThanhMinhState = {
    ...createInitialThanhMinhState(),
    scene: 'music_classroom',
    act: 3,
    playerX: 1060,
  };
  s = interactWithHotspot(s);
  assert.equal(s.activeModal, 'piano_puzzle');

  const wrong = pressPianoKey(s, 'La');
  assert.equal(wrong.reset, true);
  assert.equal(wrong.next.pianoSequence.length, 0);

  s = pressPianoKey(wrong.next, 'Do').next;
  s = pressPianoKey(s, 'Mi').next;
  s = pressPianoKey(s, 'Sol').next;
  const done = pressPianoKey(s, 'Re');
  assert.equal(done.solved, true);
  assert.equal(done.next.pianoSolved, true);
  assert.equal(done.next.flags.piano_solved, true);
  assert.ok(done.next.collectedLoreIds.includes('lore-18-piano-duet'));
});


