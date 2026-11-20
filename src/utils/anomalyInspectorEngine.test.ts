import assert from 'node:assert/strict';
import test from 'node:test';
import { ANOMALY_DAYS, AnomalyVerdict } from '../data/anomalyCases.ts';
import {
  advanceAfterVerdict,
  advanceToNextDay,
  applyVerdictToProgress,
  createInitialAnomalyProgress,
  evaluateInspectionVerdict,
  getActiveCase,
  getActiveDay,
} from './anomalyInspectorEngine.ts';

test('ANOMALY_DAYS contains 12 escalating days, 60 valid cases, and authentic clue references', () => {
  assert.equal(ANOMALY_DAYS.length, 12);

  const verdictHistogram: Record<AnomalyVerdict, number> = {
    approve: 0,
    reject: 0,
    alarm: 0,
  };

  let totalCases = 0;
  for (let i = 0; i < ANOMALY_DAYS.length; i++) {
    const day = ANOMALY_DAYS[i];
    assert.equal(day.day, i + 1);
    assert.equal(day.rules.length, 3);
    assert.equal(day.cases.length, 5);

    for (const c of day.cases) {
      totalCases++;
      verdictHistogram[c.expectedVerdict]++;
      assert.ok(c.explanationVi.trim().length >= 20, `Case ${c.id} needs rich Vietnamese explanation`);
      assert.ok(c.documentFields.length >= 3);
      assert.ok(c.databaseFields.length >= 3);

      const allSuspectIds = new Set(
        [...c.documentFields, ...c.databaseFields]
          .map((f) => f.suspectId)
          .filter((id): id is string => Boolean(id))
      );

      for (const clueId of c.validClueIds) {
        assert.ok(
          allSuspectIds.has(clueId),
          `Case ${c.id} references unknown clueId "${clueId}"`
        );
      }

      if (c.expectedVerdict === 'approve') {
        assert.equal(c.validClueIds.length, 0);
      } else {
        assert.ok(
          c.validClueIds.length >= 1,
          `Case ${c.id} (${c.expectedVerdict}) must expose at least one clickable contradiction clue`
        );
      }
    }
  }

  assert.equal(totalCases, 60);
  assert.ok(verdictHistogram.approve >= 15);
  assert.ok(verdictHistogram.reject >= 15);
  assert.ok(verdictHistogram.alarm >= 12);
});

test('evaluateInspectionVerdict rewards accuracy, streak, and true clue spotting without gifting non-clues', () => {
  const rejectCase = ANOMALY_DAYS[0].cases[1]; // Trần Minh Khôi -> reject, validClueIds: ['d1c2-exp']
  const alarmCase = ANOMALY_DAYS[0].cases[2]; // Lê Thất Dạ -> alarm

  // Correct verdict with 1 valid clue + 1 irrelevant decoy field
  const eval1 = evaluateInspectionVerdict(rejectCase, 'reject', ['d1c2-exp', 'decoy-key'], 2);
  assert.equal(eval1.isCorrect, true);
  assert.equal(eval1.matchedCluesCount, 1);
  assert.equal(eval1.clueBonus, 25);
  // Base 100 + streak bonus (2*20=40) + clueBonus 25 = 165
  assert.equal(eval1.scoreDelta, 165);
  assert.equal(eval1.reputationDelta, 4);

  // Correct ALARM verdict with higher reward
  const evalAlarm = evaluateInspectionVerdict(alarmCase, 'alarm', ['d1c3-seal', 'd1c3-db'], 0);
  assert.equal(evalAlarm.isCorrect, true);
  assert.equal(evalAlarm.matchedCluesCount, 2);
  assert.equal(evalAlarm.scoreDelta, 140 + 50);
  assert.equal(evalAlarm.reputationDelta, 8);

  // Missing an ALARM case by pressing Approve triggers -45 reputation penalty
  const missedAlarm = evaluateInspectionVerdict(alarmCase, 'approve', [], 3);
  assert.equal(missedAlarm.isCorrect, false);
  assert.equal(missedAlarm.scoreDelta, 0);
  assert.equal(missedAlarm.reputationDelta, -45);
});

test('applyVerdictToProgress transitions cleanly across next_case, day_complete, victory, and fired', () => {
  let state = createInitialAnomalyProgress(1, 0, 1);
  assert.equal(getActiveDay(state).day, 1);
  assert.equal(getActiveCase(state)?.id, 'd1-c1');

  // Solve Day 1 Cases 1..5
  for (let cIdx = 0; cIdx < 5; cIdx++) {
    const activeCase = getActiveCase(state);
    assert.ok(activeCase);
    const ev = evaluateInspectionVerdict(
      activeCase,
      activeCase.expectedVerdict,
      activeCase.validClueIds,
      state.streak
    );
    const res = applyVerdictToProgress(state, ev);
    state = res.nextProgress;
    // Active case stays anchored while feedback banner is shown
    assert.equal(getActiveCase(state)?.id, activeCase.id);

    if (cIdx < 4) {
      assert.equal(res.transition, 'next_case');
      state = advanceAfterVerdict(state);
    } else {
      assert.equal(res.transition, 'day_complete');
      assert.equal(state.highestUnlockedDay, 2);
    }
  }

  // Advance to Day 2
  state = advanceToNextDay(state);
  assert.equal(getActiveDay(state).day, 2);
  assert.equal(state.currentCaseIndex, 0);

  // Test victory transition on Day 12 last case
  let day12State = createInitialAnomalyProgress(12, 500, 12);
  for (let cIdx = 0; cIdx < 5; cIdx++) {
    const activeCase = getActiveCase(day12State)!;
    const ev = evaluateInspectionVerdict(activeCase, activeCase.expectedVerdict, [], day12State.streak);
    const res = applyVerdictToProgress(day12State, ev);
    day12State = res.nextProgress;
    if (cIdx < 4) {
      day12State = advanceAfterVerdict(day12State);
    } else {
      assert.equal(res.transition, 'victory');
      assert.ok(day12State.bestScore >= 500);
    }
  }

  // Test fired transition when reputation drops to 0
  const fragileState = {
    ...createInitialAnomalyProgress(1, 0, 1),
    reputation: 30,
  };
  const alarmCase = ANOMALY_DAYS[0].cases[2];
  const fatalMiss = evaluateInspectionVerdict(alarmCase, 'approve', [], 0);
  const firedRes = applyVerdictToProgress(fragileState, fatalMiss);
  assert.equal(firedRes.transition, 'fired');
  assert.equal(firedRes.nextProgress.reputation, 0);
});
