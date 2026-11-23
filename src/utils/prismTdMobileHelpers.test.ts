import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableGunsForMap, GUN_CATALOG, PRISM_MAPS } from './prismTdEngine.ts';
import {
  clampMapZoomAndPan,
  computeCombatVisualDamping,
  computeMobileLandscapeSidebarPx,
  computeTouchGhostTile,
  computeVfxClutterBudget,
  filterArsenalGuns,
  getGunMobileShortName,
  resolveTouchCanvasTapAction,
  TACTILE_VIBRATION_PATTERNS,
} from './prismTdMobileHelpers.ts';

test('computeCombatVisualDamping stays crisp in calm combat and damps glare + minor popups in dense combat', () => {
  const calm = computeCombatVisualDamping({
    activeBeams: 0,
    activeProjectiles: 2,
    activeFlashes: 0,
    speedMult: 1,
    isCompactViewport: false,
  });
  assert.equal(calm.beamAlphaScale, 1);
  assert.equal(calm.flashAlphaScale, 1);
  assert.equal(calm.allowMinorPopups, true);
  assert.equal(calm.maxFloatingTexts, 16);

  const heavyMobile3x = computeCombatVisualDamping({
    activeBeams: 7,
    activeProjectiles: 30,
    activeFlashes: 12,
    speedMult: 3,
    isCompactViewport: true,
  });
  assert.ok(heavyMobile3x.beamAlphaScale <= 0.65, `Expected damped beam alpha, got ${heavyMobile3x.beamAlphaScale}`);
  assert.ok(heavyMobile3x.flashAlphaScale <= 0.5, `Expected damped flash alpha, got ${heavyMobile3x.flashAlphaScale}`);
  assert.ok(heavyMobile3x.effectAlphaScale <= 0.6, `Expected damped effect alpha, got ${heavyMobile3x.effectAlphaScale}`);
  assert.ok(heavyMobile3x.particleSpawnScale <= 0.5, `Expected damped particles, got ${heavyMobile3x.particleSpawnScale}`);
  assert.equal(heavyMobile3x.allowMinorPopups, false);
  assert.ok(heavyMobile3x.maxFloatingTexts <= 8);
});

test('computeVfxClutterBudget caps stacked ultimates and reduces area wash alpha under heavy Overdrive pressure', () => {
  const calmBudget = computeVfxClutterBudget({
    activeEffectsCount: 2,
    activeBeams: 1,
    speedMult: 1,
    isCompactViewport: false,
    overdriveActive: false,
  });
  assert.equal(calmBudget.areaWashAlphaScale, 1);
  assert.equal(calmBudget.maxOrbitalBeams, 8);
  assert.equal(calmBudget.maxVoidRifts, 7);

  const saturatedBudget = computeVfxClutterBudget({
    activeEffectsCount: 16,
    activeBeams: 12,
    speedMult: 3,
    isCompactViewport: true,
    overdriveActive: true,
  });
  assert.ok(saturatedBudget.areaWashAlphaScale >= 0.28 && saturatedBudget.areaWashAlphaScale <= 0.4);
  assert.ok(saturatedBudget.maxOrbitalBeams <= 5);
  assert.ok(saturatedBudget.maxChronoFields <= 4);
  assert.ok(saturatedBudget.maxOverheatEffects <= 9);
});

test('filterArsenalGuns cleanly partitions all, attack, electric, and support guns across standard and exclusive maps', () => {
  const guns = getAvailableGunsForMap(PRISM_MAPS[0].id);
  const all = filterArsenalGuns(guns, 'all');
  const attack = filterArsenalGuns(guns, 'attack');
  const electric = filterArsenalGuns(guns, 'electric');
  const support = filterArsenalGuns(guns, 'support');

  assert.equal(all.length, 23);
  assert.equal(guns.length, 23);
  assert.equal(attack.length, 16);
  assert.equal(electric.length, 3);
  assert.equal(support.length, 4);
  assert.equal(attack.length + electric.length + support.length, all.length);

  for (const mapId of ['sector-17', 'sector-18', 'sector-19'] as const) {
    assert.equal(getAvailableGunsForMap(mapId).length, 24);
  }
});

test('computeMobileLandscapeSidebarPx preserves 70%–75%+ map width across iPhone 14–18 Pro/Pro Max landscape viewports', () => {
  for (const vw of [844, 852, 874, 926, 932, 956]) {
    const expandedSidebar = computeMobileLandscapeSidebarPx(vw, false);
    const mapRatio = (vw - expandedSidebar) / vw;
    assert.ok(
      mapRatio >= 0.7 && mapRatio <= 0.76,
      `Viewport ${vw}px map ratio ${(mapRatio * 100).toFixed(1)}% should stay in 70%–76%`
    );

    const collapsedSidebar = computeMobileLandscapeSidebarPx(vw, true);
    const collapsedMapRatio = (vw - collapsedSidebar) / vw;
    assert.ok(collapsedMapRatio >= 0.92, `Collapsed map ratio should exceed 92%`);
  }
});

test('getGunMobileShortName provides concise unclipped names for all 26 guns', () => {
  assert.equal(GUN_CATALOG.length, 26);
  for (const gun of GUN_CATALOG) {
    const short = getGunMobileShortName(gun.type);
    assert.ok(short.length >= 4 && short.length <= 12, `${gun.type} short name "${short}" should stay concise`);
  }
});

test('computeTouchGhostTile offsets Y upward during touch drag so preview stays visible above fingertip', () => {
  const rect = { left: 0, top: 0, width: 480, height: 300 };
  const exact = computeTouchGhostTile({
    clientX: 255,
    clientY: 165,
    rect,
    cols: 16,
    rows: 10,
    applyFingerOffset: false,
  });
  assert.deepEqual(exact, { col: 8, row: 5 });

  const shifted = computeTouchGhostTile({
    clientX: 255,
    clientY: 165,
    rect,
    cols: 16,
    rows: 10,
    applyFingerOffset: true,
    fingerOffsetCssPx: 34,
  });
  assert.deepEqual(shifted, { col: 8, row: 4 });
});

test('resolveTouchCanvasTapAction requires preview-then-confirm on touch and allows instant click on mouse', () => {
  const firstTouchTap = resolveTouchCanvasTapAction({
    tile: { col: 5, row: 4 },
    tileKind: 'empty',
    existingGunId: null,
    pendingTile: null,
    isTouchPointer: true,
  });
  assert.deepEqual(firstTouchTap, { action: 'set_preview', col: 5, row: 4 });

  const secondSameTileTap = resolveTouchCanvasTapAction({
    tile: { col: 5, row: 4 },
    tileKind: 'empty',
    existingGunId: null,
    pendingTile: { col: 5, row: 4 },
    isTouchPointer: true,
  });
  assert.deepEqual(secondSameTileTap, { action: 'confirm_place', col: 5, row: 4 });

  const mouseTap = resolveTouchCanvasTapAction({
    tile: { col: 5, row: 4 },
    tileKind: 'empty',
    existingGunId: null,
    pendingTile: null,
    isTouchPointer: false,
  });
  assert.deepEqual(mouseTap, { action: 'confirm_place', col: 5, row: 4 });

  const blockedTap = resolveTouchCanvasTapAction({
    tile: { col: 2, row: 2 },
    tileKind: 'path',
    existingGunId: null,
    pendingTile: null,
    isTouchPointer: true,
  });
  assert.deepEqual(blockedTap, { action: 'invalid_tile', col: 2, row: 2 });
});

test('clampMapZoomAndPan clamps zoom and pan cleanly inside container bounds and tactile patterns exist', () => {
  assert.deepEqual(
    clampMapZoomAndPan({ zoom: 0.8, panX: 120, panY: -90, viewportW: 600, viewportH: 340 }),
    { zoom: 1, panX: 0, panY: 0 }
  );
  const zoomed = clampMapZoomAndPan({
    zoom: 1.8,
    panX: 999,
    panY: -999,
    viewportW: 600,
    viewportH: 340,
  });
  assert.equal(zoomed.zoom, 1.8);
  assert.equal(zoomed.panX, 240);
  assert.equal(zoomed.panY, -136);
  assert.ok(Array.isArray(TACTILE_VIBRATION_PATTERNS.error));
});
