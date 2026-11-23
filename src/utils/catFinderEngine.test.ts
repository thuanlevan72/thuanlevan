import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAT_COMBO_WINDOW_MS,
  CAT_DIFFICULTIES,
  CAT_MAX_ZOOM,
  CAT_MIN_ZOOM,
  CAT_SCENE_H,
  CAT_SCENE_W,
  CAT_STAGES,
  advanceCoverTapState,
  applyCatMisclickPenalty,
  clampCatPanZoom,
  computeCatStageStars,
  countCollectedSecretCats,
  getActiveCatTargetQueue,
  getCatDifficultyConfig,
  getEffectiveItemScale,
  getMainStages,
  getOpenedCoverIdsFromMap,
  getRegularItems,
  getSecretCatItem,
  isCatItemAccessible,
  isItemAllowedByQueue,
  isStageUnlocked,
  parseCatFinderSave,
  pickCatHintTarget,
  updateComboOnFind,
} from './catFinderEngine';

test('CAT_STAGES includes 5 stages with dense 24-28 items, >=40 decoys, latched/decoy covers, and valid inside-bounds hidden items', () => {
  const main = getMainStages();
  assert.equal(main.length, 4);
  assert.equal(CAT_STAGES.length, 5);
  assert.equal(CAT_STAGES[4].isSecretStage, true);

  for (const stage of CAT_STAGES) {
    const regular = getRegularItems(stage);
    const secret = getSecretCatItem(stage);
    assert.ok(regular.length >= 24 && regular.length <= 28, `${stage.id} regular count=${regular.length}`);
    assert.ok(secret, `${stage.id} must have a hidden golden cat`);
    assert.ok(stage.covers.length >= 7, `${stage.id} must have >=7 covers, got ${stage.covers.length}`);
    assert.ok(stage.covers.some((c) => (c.tapsRequired ?? 1) >= 2), `${stage.id} needs 2-tap latched cover`);
    assert.ok(stage.covers.some((c) => c.isDecoy), `${stage.id} needs decoy cover`);
    assert.ok(stage.decoys.length >= 40, `${stage.id} needs dense decoys, got ${stage.decoys.length}`);

    const ids = stage.items.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const item of stage.items) {
      assert.ok(item.x >= 45 && item.x <= CAT_SCENE_W - 45, `${item.id} x=${item.x}`);
      assert.ok(item.y >= 45 && item.y <= CAT_SCENE_H - 45, `${item.id} y=${item.y}`);
      if (item.hiddenUnderCoverId) {
        const cov = stage.covers.find((c) => c.id === item.hiddenUnderCoverId);
        assert.ok(cov, `${item.id} references valid cover ${item.hiddenUnderCoverId}`);
        assert.ok(
          item.x >= cov.x && item.x <= cov.x + cov.w && item.y >= cov.y && item.y <= cov.y + cov.h,
          `${item.id} (${item.x},${item.y}) must sit inside ${cov.id} (${cov.x}..${cov.x + cov.w}, ${cov.y}..${cov.y + cov.h})`
        );
      }
    }
  }
});

test('Difficulty configs scale 5x -> 8x -> 10x challenge strictly across time, hearts, scale, hints, and queue caps', () => {
  const d5 = getCatDifficultyConfig('hard_5x');
  const d8 = getCatDifficultyConfig('nightmare_8x');
  const d10 = getCatDifficultyConfig('eagle_10x');

  assert.equal(CAT_DIFFICULTIES.hard_5x.multiplierBadge, '×5');
  assert.ok(d5.timeLimitSec > d8.timeLimitSec && d8.timeLimitSec > d10.timeLimitSec);
  assert.ok(d5.maxHearts > d8.maxHearts && d8.maxHearts > d10.maxHearts);
  assert.ok(d5.itemScaleMult > d8.itemScaleMult && d8.itemScaleMult > d10.itemScaleMult);
  assert.ok(d5.misclickPenaltySec < d8.misclickPenaltySec && d8.misclickPenaltySec < d10.misclickPenaltySec);
  assert.equal(d5.activeQueueLimit, null);
  assert.equal(d8.activeQueueLimit, 5);
  assert.equal(d10.activeQueueLimit, 3);
  assert.equal(d10.maxHints, 0);
  assert.ok(d10.spotlightRadius !== null && d10.spotlightRadius < (d8.spotlightRadius ?? 999));

  const sampleItem = CAT_STAGES[0].items[0];
  assert.ok(getEffectiveItemScale(sampleItem, d10) < getEffectiveItemScale(sampleItem, d5));
});

test('Multi-tap latched cover requires 2 taps, active queue limits eligible items, and misclick penalty triggers defeat', () => {
  const bakery = CAT_STAGES[0];
  const latchedCover = bakery.covers.find((c) => c.id === 'bk-cover-tin');
  assert.ok(latchedCover);
  assert.equal(latchedCover.tapsRequired, 2);

  const step1 = advanceCoverTapState(latchedCover, 0);
  assert.equal(step1.nextTaps, 1);
  assert.equal(step1.nowOpen, false);
  assert.equal(step1.unlockedLatchStep, true);
  assert.deepEqual(getOpenedCoverIdsFromMap(bakery, { [latchedCover.id]: step1.nextTaps }), []);

  const step2 = advanceCoverTapState(latchedCover, step1.nextTaps);
  assert.equal(step2.nextTaps, 2);
  assert.equal(step2.nowOpen, true);
  assert.ok(getOpenedCoverIdsFromMap(bakery, { [latchedCover.id]: step2.nextTaps }).includes(latchedCover.id));

  const hiddenMacaron = bakery.items.find((i) => i.id === 'bk-macaron');
  assert.ok(hiddenMacaron);
  assert.equal(isCatItemAccessible(hiddenMacaron, []), false);
  assert.equal(isCatItemAccessible(hiddenMacaron, ['bk-cover-tin']), true);

  // Active target queue caps to 3 items in Eagle 10x while secret golden cat remains collectible anytime
  const queue3 = getActiveCatTargetQueue(bakery, [], 3);
  assert.equal(queue3.length, 3);
  const laterItem = getRegularItems(bakery)[10];
  assert.equal(isItemAllowedByQueue(queue3[0], queue3), true);
  assert.equal(isItemAllowedByQueue(laterItem, queue3), false);
  const secretCat = getSecretCatItem(bakery);
  assert.ok(secretCat);
  assert.equal(isItemAllowedByQueue(secretCat, queue3), true);

  // Misclick penalties reduce hearts & time and trigger game over
  const miss1 = applyCatMisclickPenalty(3, 40, 12);
  assert.deepEqual(miss1, { nextHearts: 2, nextRemainingSec: 28, isGameOver: false });
  const missFatal = applyCatMisclickPenalty(1, 20, 12);
  assert.deepEqual(missFatal, { nextHearts: 0, nextRemainingSec: 8, isGameOver: true });
  const timeFatal = applyCatMisclickPenalty(3, 10, 12);
  assert.deepEqual(timeFatal, { nextHearts: 2, nextRemainingSec: 0, isGameOver: true });
});

test('Smart hint points to closed cover or active item and combo resets outside tighter 3.8s window', () => {
  const bakery = CAT_STAGES[0];
  const allExceptHidden = getRegularItems(bakery)
    .filter((i) => !i.hiddenUnderCoverId)
    .map((i) => i.id);

  const coverHint = pickCatHintTarget(bakery, allExceptHidden, []);
  assert.ok(coverHint);
  assert.ok(coverHint.needsCoverId !== null);

  const itemHint = pickCatHintTarget(bakery, allExceptHidden, bakery.covers.map((c) => c.id));
  assert.ok(itemHint);
  assert.equal(itemHint.needsCoverId, null);

  const first = updateComboOnFind(0, null, 1000);
  const second = updateComboOnFind(first.nextStreak, first.nextLastFindAtMs, 1000 + 2000);
  assert.equal(second.nextStreak, 2);
  assert.equal(second.isComboBoost, true);

  const expired = updateComboOnFind(second.nextStreak, second.nextLastFindAtMs, 3000 + CAT_COMBO_WINDOW_MS + 50);
  assert.equal(expired.nextStreak, 1);
  assert.equal(expired.isComboBoost, false);
});

test('Town map unlocks stages sequentially, computes stars under stricter thresholds, clamps zoom to 3.6x, and sanitizes saves', () => {
  const save = parseCatFinderSave(null);
  assert.equal(save.difficultyId, 'hard_5x');
  assert.equal(isStageUnlocked('morning-bakery', save), true);
  assert.equal(isStageUnlocked('flower-alley', save), false);
  assert.equal(isStageUnlocked('fireworks-festival', save), false);

  save.stages['morning-bakery'].cleared = true;
  assert.equal(isStageUnlocked('flower-alley', save), true);

  for (const st of getMainStages()) {
    save.stages[st.id].cleared = true;
    save.stages[st.id].foundSecretCat = true;
  }
  assert.equal(countCollectedSecretCats(save), 4);
  assert.equal(isStageUnlocked('fireworks-festival', save), true);

  assert.equal(computeCatStageStars(0, 80, true, 5, 7), 3);
  assert.equal(computeCatStageStars(1, 110, false, 4, 7), 3);
  assert.equal(computeCatStageStars(2, 130, false, 3, 7), 2);
  assert.equal(computeCatStageStars(3, 140, false, 1, 7), 1);

  const pzLow = clampCatPanZoom(0.2, 9999, -9999, 800, 440);
  assert.equal(pzLow.scale, CAT_MIN_ZOOM);

  const pzHigh = clampCatPanZoom(5, 9999, -9999, 800, 440);
  assert.equal(pzHigh.scale, CAT_MAX_ZOOM);
  assert.equal(CAT_MAX_ZOOM, 3.6);

  const sanitized = parseCatFinderSave(
    JSON.stringify({
      activeStageId: 'invalid-stage',
      difficultyId: 'eagle_10x',
      stages: {
        'morning-bakery': {
          foundItemIds: ['bk-croissant', 'fake-item', 'bk-croissant'],
          foundSecretCat: false,
          cleared: true,
          bestStars: 8,
          bestTimeSec: 72.9,
          bestCombo: 4,
        },
      },
    })
  );
  assert.equal(sanitized.activeStageId, 'morning-bakery');
  assert.equal(sanitized.difficultyId, 'eagle_10x');
  assert.deepEqual(sanitized.stages['morning-bakery'].foundItemIds, ['bk-croissant']);
  assert.equal(sanitized.stages['morning-bakery'].bestStars, 3);
  assert.equal(sanitized.stages['morning-bakery'].bestTimeSec, 72);
  assert.equal(sanitized.stages['morning-bakery'].bestCombo, 4);
});
