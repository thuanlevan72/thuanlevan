import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcSelectorSpecificity,
  calculateMissionScore,
  DOM_SNIPER_MISSIONS,
  evaluateEventLoopDispatch,
  evaluateLayoutCoordinates,
  evaluateSniperShot,
  EVENT_LOOP_LEVELS,
  FE_STATIONS,
  getFeRank,
  isBugExposedAtWidth,
  LAYOUT_HEIST_LEVELS,
  parseLayoutCssInput,
  RESPONSIVE_BUG_LEVELS,
  simulateTreePulse,
  TREE_DEFENSE_LEVELS,
} from './feAcademyEngine.ts';

test('Unified FE Academy exposes all 5 stations with beginner analogies, ranks, and mission score scaling', () => {
  assert.equal(FE_STATIONS.length, 5);
  assert.equal(TREE_DEFENSE_LEVELS.length, 3);
  for (const st of FE_STATIONS) {
    assert.ok(st.beginnerAnalogy.length > 20);
    assert.ok(st.visualLegend.length >= 3);
  }
  assert.equal(getFeRank(0).rankTitle, 'Intern Frontend Cadet');
  assert.equal(getFeRank(2500).rankTitle, 'Staff Frontend Architect');
  assert.ok(calculateMissionScore(120, 3, 0.8, true) > calculateMissionScore(120, 0, 0.2, false));
  assert.ok(
    calculateMissionScore(120, 0, 0.5, true, 'pro_challenge') >
      calculateMissionScore(120, 0, 0.5, true, 'visual_guide')
  );
});

test('Station 1 (DOM Sniper): Specificity calculation and enemy/hostage shot evaluation', () => {
  const specSimple = calcSelectorSpecificity('.feed .ad-banner');
  assert.equal(specSimple.classesAttrsPseudos, 2);
  assert.equal(specSimple.score, 20);

  const specHeavy = calcSelectorSpecificity('#app #main .feed > article.card');
  assert.ok(specHeavy.score > 200);

  const m1 = DOM_SNIPER_MISSIONS[0];
  const winShot = evaluateSniperShot(m1, '.feed .ad-banner', m1.expectedEnemyDomIds);
  assert.equal(winShot.won, true);
  assert.equal(winShot.hitHostageIds.length, 0);

  const hostageShot = evaluateSniperShot(m1, 'button, .ad-banner', ['pay-btn-1', 'ad-1', 'ad-2']);
  assert.equal(hostageShot.won, false);
  assert.equal(hostageShot.hitHostageIds.length, 1);

  const bloatedShot = evaluateSniperShot(
    m1,
    '#root #wrapper .feed > aside.ad-banner.popup',
    m1.expectedEnemyDomIds
  );
  assert.equal(bloatedShot.won, false);
  assert.match(bloatedShot.penaltyReason ?? '', /Specificity/i);
});

test('Station 2 (Layout Heist): Whitelisted CSS parsing and goal/trap coordinate evaluation', () => {
  const parsed = parseLayoutCssInput('justify-content: flex-end;\nalign-items: flex-end;');
  assert.equal(parsed.declarationCount, 2);
  assert.equal(parsed.styles.justifyContent, 'flex-end');
  assert.equal(parsed.styles.alignItems, 'flex-end');

  const lvl1 = LAYOUT_HEIST_LEVELS[0];
  const winEval = evaluateLayoutCoordinates(lvl1, lvl1.goalNormalizedPoints, 2);
  assert.equal(winEval.won, true);
  assert.equal(winEval.matchedCount, 3);

  const trapEval = evaluateLayoutCoordinates(
    lvl1,
    [
      { x: 25, y: 20 },
      { x: 78, y: 84 },
      { x: 92, y: 84 },
    ],
    2
  );
  assert.equal(trapEval.won, false);
  assert.ok(trapEval.hitTrap);
});

test('Station 3 (Event Loop): Strictly enforces Sync -> Microtask -> Macrotask order', () => {
  const lvl1 = EVENT_LOOP_LEVELS[0]; // Sync(A, D) -> Micro(C) -> Macro(B)
  const wrongMacroFirst = evaluateEventLoopDispatch(lvl1, [], 't2');
  assert.equal(wrongMacroFirst.accepted, false);
  assert.match(wrongMacroFirst.errorReason ?? '', /Macrotask/);

  const step1 = evaluateEventLoopDispatch(lvl1, [], 't1'); // A
  assert.equal(step1.accepted, true);
  const step2 = evaluateEventLoopDispatch(lvl1, ['t1'], 't4'); // D
  assert.equal(step2.accepted, true);
  const step3 = evaluateEventLoopDispatch(lvl1, ['t1', 't4'], 't3'); // C (Promise)
  assert.equal(step3.accepted, true);
  const step4 = evaluateEventLoopDispatch(lvl1, ['t1', 't4', 't3'], 't2'); // B (setTimeout)
  assert.equal(step4.accepted, true);
  assert.equal(step4.completed, true);
});

test('Station 4 (DevTools Detective): Breakpoint visibility and patch accuracy across all 3 cases', () => {
  for (const bugLevel of RESPONSIVE_BUG_LEVELS) {
    assert.equal(isBugExposedAtWidth(bugLevel, 375), true);
    assert.equal(isBugExposedAtWidth(bugLevel, 1440), false);
    const correctPatches = bugLevel.patchOptions.filter((p) => p.isCorrect);
    assert.equal(correctPatches.length, 1);
  }
});

test('Station 5 (Component Tree Defense): Shields reduce cascade render count, lower CPU heat, and restore 60 FPS', () => {
  const unshielded = simulateTreePulse([], 3);
  assert.equal(unshielded.renderedNodeIds.length, 6);
  assert.ok(unshielded.resultingFps < 30);
  assert.ok(unshielded.cpuHeatDelta > 0);

  const fullyShielded = simulateTreePulse(['debounce', 'split_state', 'memo_grid', 'virtual_list'], 3);
  assert.equal(fullyShielded.renderedNodeIds.length, 1);
  assert.equal(fullyShielded.resultingFps, 60);
  assert.ok(fullyShielded.cpuHeatDelta < 0);
});
