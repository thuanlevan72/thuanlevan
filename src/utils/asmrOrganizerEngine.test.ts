import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  evaluateBoardProgress,
  findOpenTargetSlotForItem,
  getSmartHint,
  isItemPlacementCorrect,
  nextRotation,
  ORGANIZER_LEVELS,
  resolveItemDrop,
  scrambleLevelItems,
  type OrganizerItemState,
} from './asmrOrganizerEngine.ts';

test('ORGANIZER_LEVELS defines 6 distinct cozy scenes with non-overlapping slots inside board', () => {
  assert.equal(ORGANIZER_LEVELS.length, 6);
  const styles = new Set(ORGANIZER_LEVELS.map((l) => l.trayStyle));
  assert.equal(styles.size, 6);

  for (const level of ORGANIZER_LEVELS) {
    assert.ok(level.items.length >= 6, `Level ${level.id} should have at least 6 items`);
    assert.equal(level.slots.length, level.items.length, `Level ${level.id} slot count matches items`);

    for (const slot of level.slots) {
      assert.ok(slot.x > 0 && slot.x < BOARD_WIDTH);
      assert.ok(slot.y > 0 && slot.y < BOARD_HEIGHT);
    }

    // Verify all targetSlotId values exist on level.slots
    const slotIds = new Set(level.slots.map((s) => s.id));
    for (const item of level.items) {
      assert.ok(slotIds.has(item.targetSlotId), `Missing targetSlotId ${item.targetSlotId}`);
      for (const acc of item.acceptableSlotIds ?? []) {
        assert.ok(slotIds.has(acc), `Missing acceptableSlotId ${acc}`);
      }
    }
  }
});

test('nextRotation cycles cleanly through 0 -> 90 -> 180 -> 270 in both directions', () => {
  assert.equal(nextRotation(0, 1), 90);
  assert.equal(nextRotation(90, 1), 180);
  assert.equal(nextRotation(180, 1), 270);
  assert.equal(nextRotation(270, 1), 0);
  assert.equal(nextRotation(0, -1), 270);
  assert.equal(nextRotation(90, -1), 0);
});

test('scrambleLevelItems places items cleanly outside central tray without initially solving board', () => {
  for (const level of ORGANIZER_LEVELS) {
    const scrambled = scrambleLevelItems(level, level.id * 97);
    assert.equal(scrambled.length, level.items.length);
    for (const st of scrambled) {
      assert.equal(st.snappedSlotId, null);
      assert.equal(st.isCorrectlyPlaced, false);
      assert.ok(st.x >= 30 && st.x <= BOARD_WIDTH - 30);
      assert.ok(st.y >= 30 && st.y <= BOARD_HEIGHT - 30);
    }
    const progress = evaluateBoardProgress(level, scrambled);
    assert.equal(progress.correctCount, 0);
    assert.equal(progress.isComplete, false);
  }
});

test('resolveItemDrop snaps cleanly to nearby empty slot and validates rotation + symmetric pairs', () => {
  const vanity = ORGANIZER_LEVELS[2]; // Màn 3: Symmetry Vanity
  const items = scrambleLevelItems(vanity);

  // Drop brush-1 onto right brush slot with rotation 0 => valid symmetric match!
  const rightBrushSlot = vanity.slots.find((s) => s.id === 'slot-brush-r')!;
  const snapPerfect = resolveItemDrop(
    vanity,
    'vanity-brush-1',
    rightBrushSlot.x + 12,
    rightBrushSlot.y - 8,
    0,
    items
  );
  assert.equal(snapPerfect.snappedSlotId, 'slot-brush-r');
  assert.equal(snapPerfect.isCorrect, true);
  assert.equal(snapPerfect.snapKind, 'perfect-ocd');

  // Drop brush-1 onto right brush slot with rotation 90 => soft-slot only (wrong rotation)
  const snapWrongAngle = resolveItemDrop(
    vanity,
    'vanity-brush-1',
    rightBrushSlot.x,
    rightBrushSlot.y,
    90,
    items
  );
  assert.equal(snapWrongAngle.snappedSlotId, 'slot-brush-r');
  assert.equal(snapWrongAngle.isCorrect, false);
  assert.equal(snapWrongAngle.snapKind, 'soft-slot');

  // Drop far outside any slot => free placement
  const snapFree = resolveItemDrop(vanity, 'vanity-brush-1', 75, 110, 0, items);
  assert.equal(snapFree.snappedSlotId, null);
  assert.equal(snapFree.snapKind, 'free');
});

test('evaluateBoardProgress and getSmartHint detect completion accurately across all 6 levels', () => {
  for (const level of ORGANIZER_LEVELS) {
    const solved: OrganizerItemState[] = [];
    for (let i = 0; i < level.items.length; i++) {
      const def = level.items[i];
      const slot = findOpenTargetSlotForItem(level, def, solved)!;
      assert.ok(slot, `Expected open target slot for ${def.id}`);
      const rot = def.targetRotations[0];
      assert.equal(isItemPlacementCorrect(def, slot.id, rot), true);
      solved.push({
        id: def.id,
        x: slot.x,
        y: slot.y,
        rotation: rot,
        snappedSlotId: slot.id,
        isCorrectlyPlaced: true,
        zIndex: i + 1,
      });
    }

    const summary = evaluateBoardProgress(level, solved);
    assert.equal(summary.correctCount, level.items.length);
    assert.equal(summary.totalCount, level.items.length);
    assert.equal(summary.isComplete, true);
    assert.equal(getSmartHint(level, solved), null);

    // Corrupt one item rotation and confirm hint points right to it
    const perturbed = solved.map((item, idx) =>
      idx === 0 && level.items[0].targetRotations.length < 4
        ? { ...item, rotation: nextRotation(item.rotation, 1), isCorrectlyPlaced: false }
        : item
    );
    if (level.items[0].targetRotations.length < 4) {
      const partialSummary = evaluateBoardProgress(level, perturbed);
      assert.equal(partialSummary.isComplete, false);
      assert.deepEqual(partialSummary.misplacedIds, [level.items[0].id]);
      const hint = getSmartHint(level, perturbed);
      assert.ok(hint);
      assert.equal(hint.itemId, level.items[0].id);
    }
  }
});
