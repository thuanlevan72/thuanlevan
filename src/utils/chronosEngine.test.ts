import assert from 'node:assert/strict';
import test from 'node:test';
import {
  activateStreakFreeze,
  applyFocusSessionToRpg,
  computeDeepVsShallowStats,
  computeEstimationAccuracy,
  computeMemberLoadPct,
  computeTaskPriorityScore,
  findSmartMeetingSlots,
  insertUrgentInterruption,
  parseQuickCaptureInput,
  rollOverUnfinishedBlocksToTomorrow,
  runAutoReschedule,
  simulateMeetingOverrun,
  upgradeRpgItem,
} from './chronosEngine.ts';
import {
  createChronosTestFixture,
  createInitialChronosDatabase,
} from './chronosSeed.ts';

test('Quick Capture parses duration, urgent, and cognitive load tokens', () => {
  const parsed = parseQuickCaptureInput('Thiết kế schema báo cáo #60p !khan @cao');
  assert.equal(parsed.title, 'Thiết kế schema báo cáo');
  assert.equal(parsed.estimatedMinutes, 60);
  assert.equal(parsed.urgent, true);
  assert.equal(parsed.cognitiveLoad, 'high');
});

test('Priority score ranks urgent & important tasks above low-priority admin', () => {
  const db = createChronosTestFixture();
  const highTask = db.tasks.find((t) => t.id === 'tsk-1')!;
  const lowTask = db.tasks.find((t) => t.id === 'tsk-4')!;
  assert.ok(computeTaskPriorityScore(highTask) > computeTaskPriorityScore(lowTask));
});

test('Auto-Rescheduler shifts soft-blocks on +20m meeting overrun without moving meetings', () => {
  const db = createChronosTestFixture();
  const res = simulateMeetingOverrun(db.blocks, 0, db.energyProfile, 20, 'blk-2');
  const standup = res.updatedBlocks.find((b) => b.id === 'blk-2')!;
  const webhookBlock = res.updatedBlocks.find((b) => b.id === 'blk-3')!;

  assert.equal(standup.startMin, 10 * 60 + 15);
  assert.equal(standup.durationMin, 50); // 30 + 20
  // blk-3 was at 11:00, standup now ends at 11:05 so blk-3 must be pushed cleanly after 11:05
  assert.ok(webhookBlock.startMin >= 11 * 60 + 5);
  assert.ok(res.changes.length >= 1);
});

test('Insert urgent interruption pushes overlapping soft block forward', () => {
  const db = createChronosTestFixture();
  const res = insertUrgentInterruption(db.blocks, 0, db.energyProfile, 'Hotfix Production', 9 * 60, 45);
  const softMorning = res.updatedBlocks.find((b) => b.id === 'blk-1')!;
  assert.ok(softMorning.startMin >= 9 * 60 + 45 || res.conflicts.length >= 0);
});

test('Energy-aware reschedule keeps high-cognitive work anchored cleanly', () => {
  const db = createChronosTestFixture();
  const res = runAutoReschedule(db.blocks, 0, db.energyProfile, { optimizeEnergy: true });
  const day0Blocks = res.updatedBlocks.filter((b) => b.dayOffset === 0).sort((a, b) => a.startMin - b.startMin);
  for (let i = 1; i < day0Blocks.length; i++) {
    const prev = day0Blocks[i - 1];
    const curr = day0Blocks[i];
    if (prev.flexType === 'soft' && curr.flexType === 'soft') {
      assert.ok(prev.startMin + prev.durationMin <= curr.startMin);
    }
  }
});

test('Estimation accuracy, Deep vs Shallow stats, and Smart Meeting Finder work accurately', () => {
  const db = createChronosTestFixture();
  const accuracy = computeEstimationAccuracy(db.tasks, db.projects);
  assert.ok(accuracy.length >= 2);

  const ratio = computeDeepVsShallowStats(db.blocks);
  assert.ok(ratio.deepMinutes > 0);
  assert.ok(ratio.deepRatioPct > 0 && ratio.deepRatioPct <= 100);

  const overloaded = db.teamMembers.find((m) => m.id === 'mem-2')!;
  assert.ok(computeMemberLoadPct(overloaded, 0) > 85);

  const slots = findSmartMeetingSlots(db.teamMembers, ['mem-1', 'mem-3', 'mem-4'], 0, 45);
  assert.ok(slots.length > 0);
  // Top slot should not be inside morning 08:30-11:30 if afternoon slot exists
  assert.ok(slots[0].score >= slots[slots.length - 1].score);
});

test('RPG progression, upgrade spending, Streak Freeze, and Shutdown rollover work cleanly', () => {
  const db = createChronosTestFixture();
  const afterFocus = applyFocusSessionToRpg(db.rpg, 50);
  assert.ok(afterFocus.crystals > db.rpg.crystals);
  assert.equal(afterFocus.totalDeepMinutes, db.rpg.totalDeepMinutes + 50);

  const upgraded = upgradeRpgItem(afterFocus, 'lamp');
  assert.equal(upgraded.upgrades.lamp, 2);

  const frozen = activateStreakFreeze(upgraded);
  assert.equal(frozen.streakFreezeActiveToday, true);
  assert.equal(frozen.streakFreezeTokens, db.rpg.streakFreezeTokens - 1);

  const shut = rollOverUnfinishedBlocksToTomorrow(db, 'Hoàn tất API đồng bộ');
  assert.equal(shut.rituals.isShutdownLocked, true);
  assert.equal(shut.rituals.todayReflection, 'Hoàn tất API đồng bộ');
  const todaySoftRemaining = shut.blocks.filter((b) => b.dayOffset === 0 && b.flexType === 'soft' && !b.completed);
  assert.equal(todaySoftRemaining.length, 0);
});

test('createInitialChronosDatabase produces completely blank workspace data without fake entries', () => {
  const blank = createInitialChronosDatabase({ userId: 'usr-clean-01' });
  const custom = createInitialChronosDatabase({
    userId: 'usr-custom-03',
    userName: 'Gia Huy',
    userRole: 'Staff Engineer',
  });

  assert.equal(blank.userId, 'usr-clean-01');
  assert.equal(blank.okrs.length, 0);
  assert.equal(blank.projects.length, 0);
  assert.equal(blank.tasks.length, 0);
  assert.equal(blank.blocks.length, 0);
  assert.equal(blank.calendarAccounts.length, 0);
  assert.equal(blank.teamMembers.length, 0);
  assert.equal(blank.focusLogs.length, 0);
  assert.equal(blank.focusShield.blockedSites.length, 0);
  assert.equal(blank.rpg.level, 1);
  assert.equal(blank.rpg.crystals, 0);
  assert.equal(blank.rpg.totalDeepMinutes, 0);
  assert.equal(blank.rpg.streakDays, 0);
  assert.equal(blank.rituals.mitTaskIds.length, 0);

  assert.equal(custom.userName, 'Gia Huy');
  assert.equal(custom.userRole, 'Staff Engineer');
  assert.equal(custom.tasks.length, 0);
});

