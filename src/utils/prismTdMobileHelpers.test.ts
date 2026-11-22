import test from 'node:test';
import assert from 'node:assert/strict';
import { getAvailableGunsForMap, PRISM_MAPS } from './prismTdEngine.ts';
import {
  computeCombatVisualDamping,
  computeMobileLandscapeSidebarPx,
  filterArsenalGuns,
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

test('filterArsenalGuns cleanly partitions all, attack, electric, and support guns across the 12-gun roster', () => {
  const guns = getAvailableGunsForMap(PRISM_MAPS[0].id);
  const all = filterArsenalGuns(guns, 'all');
  const attack = filterArsenalGuns(guns, 'attack');
  const electric = filterArsenalGuns(guns, 'electric');
  const support = filterArsenalGuns(guns, 'support');

  assert.equal(all.length, 12);
  assert.equal(guns.length, 12);
  assert.equal(attack.length, 7);
  assert.equal(electric.length, 2);
  assert.equal(support.length, 3);
  assert.equal(attack.length + electric.length + support.length, all.length);
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
