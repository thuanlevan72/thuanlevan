import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAT_COMBO_WINDOW_MS,
  CAT_MAX_ZOOM,
  CAT_MIN_ZOOM,
  CAT_STAGES,
  clampCatPanZoom,
  computeCatStageStars,
  countCollectedSecretCats,
  getMainStages,
  getRegularItems,
  getSecretCatItem,
  isCatItemAccessible,
  isStageUnlocked,
  parseCatFinderSave,
  pickCatHintTarget,
  updateComboOnFind,
} from './catFinderEngine';

test('CAT_STAGES includes 4 main pastel stages + 1 hidden fireworks stage with unique items and secret golden cats', () => {
  const main = getMainStages();
  assert.equal(main.length, 4);
  assert.equal(CAT_STAGES.length, 5);
  assert.equal(CAT_STAGES[4].isSecretStage, true);

  for (const stage of CAT_STAGES) {
    const regular = getRegularItems(stage);
    const secret = getSecretCatItem(stage);
    assert.ok(regular.length >= 10 && regular.length <= 12, `${stage.id} regular count=${regular.length}`);
    assert.ok(secret, `${stage.id} must have a hidden golden cat`);
    assert.ok(stage.covers.length >= 2, `${stage.id} must have >=2 tap-to-reveal spots`);

    const ids = stage.items.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('Tap-to-reveal accessibility and smart hint guide player cleanly', () => {
  const bakery = CAT_STAGES[0];
  const hiddenMacaron = bakery.items.find((i) => i.id === 'bk-macaron');
  assert.ok(hiddenMacaron);
  assert.equal(isCatItemAccessible(hiddenMacaron, []), false);
  assert.equal(isCatItemAccessible(hiddenMacaron, ['bk-cover-tin']), true);

  // When only hidden items remain unfound, hint targets the cover prop first
  const allExceptHidden = getRegularItems(bakery)
    .filter((i) => !i.hiddenUnderCoverId)
    .map((i) => i.id);

  const coverHint = pickCatHintTarget(bakery, allExceptHidden, []);
  assert.ok(coverHint);
  assert.equal(coverHint.needsCoverId, 'bk-cover-tin');

  // After opening the cover prop, hint points straight to the revealed item
  const itemHint = pickCatHintTarget(bakery, allExceptHidden, ['bk-cover-tin']);
  assert.ok(itemHint);
  assert.equal(itemHint.needsCoverId, null);
});

test('Combo streak increments within window and resets when interval expires', () => {
  const first = updateComboOnFind(0, null, 1000);
  assert.equal(first.nextStreak, 1);
  assert.equal(first.isComboBoost, false);

  const second = updateComboOnFind(first.nextStreak, first.nextLastFindAtMs, 1000 + 2100);
  assert.equal(second.nextStreak, 2);
  assert.equal(second.isComboBoost, true);

  const third = updateComboOnFind(second.nextStreak, second.nextLastFindAtMs, 3100 + 1800);
  assert.equal(third.nextStreak, 3);
  assert.equal(third.isComboBoost, true);

  const expired = updateComboOnFind(third.nextStreak, third.nextLastFindAtMs, 4900 + CAT_COMBO_WINDOW_MS + 100);
  assert.equal(expired.nextStreak, 1);
  assert.equal(expired.isComboBoost, false);
});

test('Town map unlocks stages sequentially and unlocks Fireworks festival only after 4 secret golden cats', () => {
  const save = parseCatFinderSave(null);
  assert.equal(isStageUnlocked('morning-bakery', save), true);
  assert.equal(isStageUnlocked('flower-alley', save), false);
  assert.equal(isStageUnlocked('fireworks-festival', save), false);

  save.stages['morning-bakery'].cleared = true;
  assert.equal(isStageUnlocked('flower-alley', save), true);
  assert.equal(isStageUnlocked('pet-cafe', save), false);

  for (const st of getMainStages()) {
    save.stages[st.id].cleared = true;
    save.stages[st.id].foundSecretCat = true;
  }
  assert.equal(countCollectedSecretCats(save), 4);
  assert.equal(isStageUnlocked('fireworks-festival', save), true);
});

test('Star rating, pan/zoom clamping, and localStorage save sanitization behave cleanly', () => {
  assert.equal(computeCatStageStars(0, 95, true), 3);
  assert.equal(computeCatStageStars(2, 240, true), 3);
  assert.equal(computeCatStageStars(3, 240, false), 2);
  assert.equal(computeCatStageStars(5, 300, false), 1);

  const pzLow = clampCatPanZoom(0.2, 9999, -9999, 800, 440);
  assert.equal(pzLow.scale, CAT_MIN_ZOOM);

  const pzHigh = clampCatPanZoom(5, 9999, -9999, 800, 440);
  assert.equal(pzHigh.scale, CAT_MAX_ZOOM);

  const sanitized = parseCatFinderSave(
    JSON.stringify({
      activeStageId: 'invalid-stage',
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
  assert.deepEqual(sanitized.stages['morning-bakery'].foundItemIds, ['bk-croissant']);
  assert.equal(sanitized.stages['morning-bakery'].bestStars, 3);
  assert.equal(sanitized.stages['morning-bakery'].bestTimeSec, 72);
  assert.equal(sanitized.stages['morning-bakery'].bestCombo, 4);
});
