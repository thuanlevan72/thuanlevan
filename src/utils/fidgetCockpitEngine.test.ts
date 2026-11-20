import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTaskScore,
  COCKPIT_DIFFICULTY_CONFIGS,
  COCKPIT_DIFFICULTY_ORDER,
  createInitialHardwareState,
  evaluateMicroTask,
  getSpeedMultiplier,
  getSpeedTier,
  getTaskTimeLimitSec,
  isOverdriveTrigger,
  normalizeDialAngle,
  OVERDRIVE_COMBO_STEP,
  pickNextMicroTask,
  stepHazardCycle,
  TASK_PLUGINS,
} from './fidgetCockpitEngine.ts';

test('Plugin registry defines all 6 cockpit modules with valid limits and anti-repeat selection', () => {
  assert.ok(TASK_PLUGINS.length >= 9);
  assert.deepEqual(COCKPIT_DIFFICULTY_ORDER, ['easy', 'normal', 'hard', 'chaos']);
  assert.equal(COCKPIT_DIFFICULTY_CONFIGS.easy.shields, 3);
  assert.equal(COCKPIT_DIFFICULTY_CONFIGS.normal.shields, 2);
  assert.equal(COCKPIT_DIFFICULTY_CONFIGS.hard.shields, 1);
  assert.equal(COCKPIT_DIFFICULTY_CONFIGS.chaos.shields, 0);

  const modules = new Set(TASK_PLUGINS.map((p) => p.module));
  assert.deepEqual(
    [...modules].sort(),
    ['hazard_hold', 'patch_bay', 'red_button', 'rotary_dial', 'switches', 'wave_fader']
  );

  let prevMod = null;
  for (let i = 0; i < 18; i++) {
    const { task, hardwarePatch } = pickNextMicroTask(i, prevMod, 'endless_survival', 'easy');
    assert.notEqual(task.module, prevMod, 'Must alternate module every command for ADHD zero-downtime variety');
    assert.ok(task.timeLimitSec >= 4.0 && task.timeLimitSec <= 8.2);
    const hw = { ...createInitialHardwareState(), ...hardwarePatch };
    assert.equal(
      evaluateMicroTask(task, hw, 0, false),
      'active',
      `Task ${task.pluginId} must not start pre-completed`
    );
    prevMod = task.module;
  }
});

test('Difficulty levels properly scale time limits, click quotas, shields, and score multipliers', () => {
  const easyTime = getTaskTimeLimitSec(4.0, 1, 'endless_survival', 'easy');
  const normalTime = getTaskTimeLimitSec(4.0, 1, 'endless_survival', 'normal');
  const hardTime = getTaskTimeLimitSec(4.0, 1, 'endless_survival', 'hard');
  const chaosTime = getTaskTimeLimitSec(4.0, 1, 'endless_survival', 'chaos');

  assert.ok(easyTime > normalTime && normalTime > hardTime && hardTime > chaosTime);

  const mashPlugin = TASK_PLUGINS.find((p) => p.id === 'red_button_mash')!;
  const easyMash = mashPlugin.init(() => 0.5, 1, 'easy');
  const chaosMash = mashPlugin.init(() => 0.5, 1, 'chaos');
  assert.ok((easyMash.goal.targetClicks ?? 0) < (chaosMash.goal.targetClicks ?? 0));

  const easyScore = calculateTaskScore(5, 1, 0.5, false, 'easy');
  const chaosScore = calculateTaskScore(5, 1, 0.5, false, 'chaos');
  assert.ok(chaosScore > easyScore * 2);
});

test('Switch, Red Button (mash & exact), Dial, Wave Fader, and Patch Bay plugins evaluate accurately', () => {
  const swPlugin = TASK_PLUGINS.find((p) => p.id === 'switches_all_green')!;
  const swInit = swPlugin.init(() => 0.2, 1, 'easy');
  const swTask = {
    pluginId: swPlugin.id,
    module: swPlugin.module,
    title: swInit.title,
    hint: swInit.hint,
    badgeLabel: swInit.badgeLabel,
    timeLimitSec: 5.5,
    goal: swInit.goal,
  };
  const hwSw = { ...createInitialHardwareState(), ...swInit.hardwarePatch };
  assert.equal(evaluateMicroTask(swTask, hwSw, 1.0, false), 'active');
  hwSw.switches = ['green', 'green', 'green'];
  assert.equal(evaluateMicroTask(swTask, hwSw, 1.2, false), 'success');
  assert.equal(evaluateMicroTask(swTask, createInitialHardwareState(), 5.6, false), 'failed');

  // Exact click failure on overshoot
  const exactPlugin = TASK_PLUGINS.find((p) => p.id === 'red_button_exact')!;
  const exactInit = exactPlugin.init(() => 0.4, 1, 'normal'); // targetClicks = 4
  const exactTask = {
    pluginId: exactPlugin.id,
    module: exactPlugin.module,
    title: exactInit.title,
    hint: exactInit.hint,
    badgeLabel: exactInit.badgeLabel,
    timeLimitSec: 4.5,
    goal: exactInit.goal,
  };
  const hwExact = { ...createInitialHardwareState(), redPressCount: 4 };
  assert.equal(evaluateMicroTask(exactTask, hwExact, 0.8, false), 'success');
  hwExact.redPressCount = 5;
  assert.equal(evaluateMicroTask(exactTask, hwExact, 0.9, false), 'failed');

  // Rotary dial wrapping around 0/330 deg
  const dialPlugin = TASK_PLUGINS.find((p) => p.id === 'rotary_dial_target')!;
  const dialTask = {
    pluginId: dialPlugin.id,
    module: dialPlugin.module,
    title: 'Dial',
    hint: 'Dial',
    badgeLabel: '0°',
    timeLimitSec: 4.8,
    goal: { targetDialAngle: 0, dialToleranceDeg: 35 },
  };
  const hwDial = { ...createInitialHardwareState(), dialAngle: normalizeDialAngle(360) };
  assert.equal(hwDial.dialAngle, 0);
  assert.equal(evaluateMicroTask(dialTask, hwDial, 1.1, false), 'success');

  // Patch bay matching
  const patchPlugin = TASK_PLUGINS.find((p) => p.id === 'patch_bay_connect')!;
  const patchInit = patchPlugin.init(() => 0.5, 1, 'easy');
  const patchTask = {
    pluginId: patchPlugin.id,
    module: patchPlugin.module,
    title: patchInit.title,
    hint: patchInit.hint,
    badgeLabel: patchInit.badgeLabel,
    timeLimitSec: 5.5,
    goal: patchInit.goal,
  };
  const hwPatch = { ...createInitialHardwareState(), ...patchInit.hardwarePatch };
  const leftColors = ['gold', 'cyan', 'rose'] as const;
  hwPatch.patchConnections = [
    { fromIndex: 0, toIndex: hwPatch.rightPortOrder.indexOf(leftColors[0]) },
    { fromIndex: 1, toIndex: hwPatch.rightPortOrder.indexOf(leftColors[1]) },
  ];
  assert.equal(evaluateMicroTask(patchTask, hwPatch, 2.0, false), 'success');
});

test('Yellow Hold Pad + Sweeping Lightning Hazard fails on zap hit and succeeds when dodged', () => {
  const holdPlugin = TASK_PLUGINS.find((p) => p.id === 'hazard_hold_dodge')!;
  const holdInit = holdPlugin.init(() => 0.5, 1, 'easy');
  const holdTask = {
    pluginId: holdPlugin.id,
    module: holdPlugin.module,
    title: holdInit.title,
    hint: holdInit.hint,
    badgeLabel: holdInit.badgeLabel,
    timeLimitSec: 6.0,
    goal: holdInit.goal,
  };

  let sawWarn = false;
  let sawActive = false;
  for (let t = 0; t <= 4.0; t += 0.05) {
    const cyc = stepHazardCycle(t, 1, 'easy');
    if (cyc.warning) sawWarn = true;
    if (cyc.active) sawActive = true;
  }
  assert.ok(sawWarn && sawActive, 'Hazard cycle must produce warning then lightning active phase');

  const hwHold = { ...createInitialHardwareState(), yellowHolding: true, yellowHoldChargeSec: 0.5 };
  assert.equal(evaluateMicroTask(holdTask, hwHold, 1.2, true), 'failed');

  hwHold.yellowHolding = false;
  assert.equal(evaluateMicroTask(holdTask, hwHold, 1.2, true), 'active');

  hwHold.yellowHolding = true;
  hwHold.yellowHoldChargeSec = 1.2;
  assert.equal(evaluateMicroTask(holdTask, hwHold, 2.5, false), 'success');
});

test('10-combo Overdrive trigger, speed escalation, and 2x Overdrive scoring', () => {
  assert.equal(isOverdriveTrigger(9), false);
  assert.equal(isOverdriveTrigger(OVERDRIVE_COMBO_STEP), true);
  assert.equal(isOverdriveTrigger(20), true);

  assert.equal(getSpeedTier(0), 1);
  assert.equal(getSpeedTier(10), 2);
  assert.ok(getSpeedMultiplier(2) > getSpeedMultiplier(1));
  assert.ok(
    getTaskTimeLimitSec(4.0, 3, 'endless_survival', 'normal') <
      getTaskTimeLimitSec(4.0, 1, 'endless_survival', 'normal')
  );

  const normalPts = calculateTaskScore(5, 1, 0.5, false, 'normal');
  const odPts = calculateTaskScore(5, 1, 0.5, true, 'normal');
  assert.equal(odPts, normalPts * 2);
});
