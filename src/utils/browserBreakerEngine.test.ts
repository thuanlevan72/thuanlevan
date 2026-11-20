import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BROWSER_BREAKER_STAGES,
  checkInvisibleSelectionMatch,
  computeMazeTargetDistance,
  computeRamTick,
  computeResizeGapPx,
  computeWaterLevelPercent,
  createDomExplosionShards,
  createVirusPopup,
  isResizePuzzleSolved,
  normalizePhraseInput,
  STAGE1_SECRET_CODE,
  STAGE8_PIN_CODE,
} from './browserBreakerEngine.ts';

test('BROWSER_BREAKER_STAGES exposes 8 distinct DOM-breaking stages', () => {
  assert.equal(BROWSER_BREAKER_STAGES.length, 8);
  const codes = new Set(BROWSER_BREAKER_STAGES.map((s) => s.code));
  assert.equal(codes.size, 8);
  for (const st of BROWSER_BREAKER_STAGES) {
    assert.ok(st.objective.length >= 20);
    assert.ok(st.baseScore >= 100);
  }
});

test('selectionchange and phrase normalization helpers verify hidden DOM codes cleanly', () => {
  assert.equal(checkInvisibleSelectionMatch(`mã bí mật là: ${STAGE1_SECRET_CODE}`, STAGE1_SECRET_CODE), true);
  assert.equal(checkInvisibleSelectionMatch('  dom-404 ', STAGE1_SECRET_CODE), true);
  assert.equal(checkInvisibleSelectionMatch('random text', STAGE1_SECRET_CODE), false);
  assert.equal(checkInvisibleSelectionMatch(`PIN: ${STAGE8_PIN_CODE}`, STAGE8_PIN_CODE), true);

  assert.equal(normalizePhraseInput('  Phá   Vỡ  '), 'PHA VO');
  assert.equal(normalizePhraseInput('pha vo'), 'PHA VO');
});

test('resize collision and scroll water-level math trigger accurately at boundary thresholds', () => {
  assert.equal(computeResizeGapPx(500, 96, 96, 24), 284);
  assert.equal(isResizePuzzleSolved(284), false);

  const tightGap = computeResizeGapPx(218, 96, 96, 24);
  assert.equal(tightGap, 2);
  assert.equal(isResizePuzzleSolved(tightGap), true);

  assert.equal(computeWaterLevelPercent(0, 980, 256), 0);
  assert.equal(computeWaterLevelPercent(362, 980, 256), 50);
  assert.equal(computeWaterLevelPercent(724, 980, 256), 100);
});

test('RAM pressure rises with active virus popups and cools down when cleared', () => {
  assert.ok(computeRamTick(30, 4, 1) > 30);
  assert.ok(computeRamTick(60, 0, 1) < 60);
  assert.equal(computeRamTick(98, 6, 2), 100);

  const popup = createVirusPopup(2);
  assert.ok(popup.xPercent >= 6 && popup.xPercent <= 65);
  assert.ok(popup.yPercent >= 6 && popup.yPercent <= 65);
  assert.ok(popup.title.length > 0);
});

test('createDomExplosionShards and computeMazeTargetDistance generate valid chaos feedback', () => {
  const shards = createDomExplosionShards(16, 50, 50);
  assert.equal(shards.length, 16);
  for (const s of shards) {
    assert.ok(s.label.length > 0);
    assert.ok(Math.abs(s.dxPx) + Math.abs(s.dyPx) > 10);
  }

  assert.equal(computeMazeTargetDistance(720, 520, 720, 520), 0);
  assert.equal(computeMazeTargetDistance(420, 120, 720, 520), 500);
});
