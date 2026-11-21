import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANTIQUE_LEVELS,
  clampPanAndZoom,
  collectTotalShowcaseStats,
  computeLevelRating,
  createInitialShopSave,
  getActiveClueItems,
  isItemAccessible,
  parseShopSave,
  pickSmartHint,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from './antiqueShopEngine';

test('ANTIQUE_LEVELS provides 3 complete chapters with 11-12 items, 2-layer covers, and dual endings', () => {
  assert.equal(ANTIQUE_LEVELS.length, 3);
  for (const lvl of ANTIQUE_LEVELS) {
    assert.ok(lvl.items.length >= 11 && lvl.items.length <= 12, `${lvl.id} has 11-12 items`);
    assert.ok(lvl.covers.length >= 3, `${lvl.id} has >= 3 interactive covers`);
    assert.ok(lvl.endings.healing.epilogue.length > 40);
    assert.ok(lvl.endings.secret.epilogue.length > 40);

    const coverIds = new Set(lvl.covers.map((c) => c.id));
    const hiddenItems = lvl.items.filter((i) => i.hiddenUnderCoverId);
    assert.ok(hiddenItems.length >= 3, `${lvl.id} has >= 3 2-layer hidden items`);
    for (const item of lvl.items) {
      assert.ok(item.x > 40 && item.x < SCENE_WIDTH - 40, `${item.id} x inside scene`);
      assert.ok(item.y > 40 && item.y < SCENE_HEIGHT - 40, `${item.id} y inside scene`);
      assert.ok(item.emotionalClue.length > 15);
      assert.ok(item.storyNote.length > 15);
      if (item.hiddenUnderCoverId) {
        assert.ok(coverIds.has(item.hiddenUnderCoverId), `${item.id} references valid cover`);
      }
    }
  }
});

test('2-layer cover accessibility and smart hint nudge unopened covers accurately', () => {
  const lvl1 = ANTIQUE_LEVELS[0];
  const tornPhoto = lvl1.items.find((i) => i.id === 'ms-torn-photo')!;
  const ticket = lvl1.items.find((i) => i.id === 'ms-train-ticket')!;

  assert.equal(isItemAccessible(ticket, []), true);
  assert.equal(isItemAccessible(tornPhoto, []), false);
  assert.equal(isItemAccessible(tornPhoto, ['cover-newspaper']), true);

  // When preferred item is under an unopened cover, smart hint guides to open that cover
  const hintClosed = pickSmartHint(lvl1, [], [], 'ms-torn-photo')!;
  assert.equal(hintClosed.needsCoverOpened, true);
  assert.equal(hintClosed.coverLabel, 'Tờ báo ga tàu gấp đôi');

  // Once opened, hint targets the item directly
  const hintOpened = pickSmartHint(lvl1, [], ['cover-newspaper'], 'ms-torn-photo')!;
  assert.equal(hintOpened.needsCoverOpened, false);
  assert.equal(hintOpened.zoneX, tornPhoto.x);
  assert.equal(hintOpened.zoneY, tornPhoto.y);
});

test('getActiveClueItems streams up to 4 unfound clues and computeLevelRating deducts softly for hints', () => {
  const lvl2 = ANTIQUE_LEVELS[1];
  const initialClues = getActiveClueItems(lvl2, [], 4);
  assert.equal(initialClues.length, 4);

  const almostDoneIds = lvl2.items.slice(0, lvl2.items.length - 1).map((i) => i.id);
  const lastClues = getActiveClueItems(lvl2, almostDoneIds, 4);
  assert.equal(lastClues.length, 1);
  assert.equal(lastClues[0].id, lvl2.items[lvl2.items.length - 1].id);

  const perfect = computeLevelRating(lvl2.items.length, lvl2.items.length, 0, 1);
  assert.equal(perfect.stars, 3);
  assert.equal(perfect.score, 1000);

  const hinted = computeLevelRating(lvl2.items.length, lvl2.items.length, 2, 0);
  assert.equal(hinted.stars, 2);
  assert.ok(hinted.score < perfect.score);
});

test('clampPanAndZoom keeps zoom within 1x..2.6x and centers cleanly at 1x', () => {
  const atOne = clampPanAndZoom(0.7, 250, -180, 900, 558);
  assert.deepEqual(atOne, { scale: 1, panX: 0, panY: 0 });

  const zoomed = clampPanAndZoom(2.0, 9999, -9999, 900, 558);
  assert.equal(zoomed.scale, 2);
  assert.equal(zoomed.panX, 450);
  assert.equal(zoomed.panY, -279);
});

test('parseShopSave sanitizes invalid JSON/IDs and preserves valid progress + tea shelf stats', () => {
  const base = createInitialShopSave();
  base.activeLevelId = 'exam-study-desk';
  base.levels['midnight-suitcase'].foundItemIds = [
    ...ANTIQUE_LEVELS[0].items.map((i) => i.id),
    'invalid-id-999',
  ];
  base.levels['midnight-suitcase'].openedCoverIds = ['cover-newspaper'];
  base.levels['midnight-suitcase'].chosenEnding = 'healing';
  base.levels['midnight-suitcase'].bestStars = 3;
  base.levels['midnight-suitcase'].bestScore = 1000;

  const restored = parseShopSave(JSON.stringify(base));
  assert.equal(restored.activeLevelId, 'exam-study-desk');
  assert.equal(restored.levels['midnight-suitcase'].foundItemIds.length, ANTIQUE_LEVELS[0].items.length);
  assert.equal(restored.levels['midnight-suitcase'].chosenEnding, 'healing');

  const stats = collectTotalShowcaseStats(restored);
  assert.equal(stats.completedBoxes, 1);
  assert.equal(stats.totalStars, 3);
  assert.equal(stats.totalBoxes, 3);

  const corrupted = parseShopSave('{not valid json');
  assert.equal(corrupted.activeLevelId, ANTIQUE_LEVELS[0].id);
});
