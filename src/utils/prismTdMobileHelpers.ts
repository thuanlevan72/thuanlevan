import { getGunCategory, GunCatalogItem } from './prismTdEngine.ts';

export type GunArsenalFilter = 'all' | 'attack' | 'electric' | 'support';

export interface CombatVisualDamping {
  /** Multiplier for beam alpha & glow glare (0.48 .. 1.0) */
  beamAlphaScale: number;
  /** Multiplier for muzzle & impact starburst flashes (0.35 .. 1.0) */
  flashAlphaScale: number;
  /** Multiplier for flame cone / overheat special FX opacity (0.45 .. 1.0) */
  effectAlphaScale: number;
  /** Ratio of particles spawned per hit (0.35 .. 1.0) */
  particleSpawnScale: number;
  /** Maximum concurrent floating combat text elements */
  maxFloatingTexts: number;
  /** Whether minor repeat popups (+energy, small ticks) are allowed */
  allowMinorPopups: boolean;
}

/**
 * Dynamically softens blinding VFX glare and caps floating combat numbers
 * during dense late-wave combat (especially on compact mobile screens and 2x/3x speed)
 * so the tactical grid and enemy paths stay razor-sharp.
 */
export function computeCombatVisualDamping(params: {
  activeBeams: number;
  activeProjectiles: number;
  activeFlashes: number;
  speedMult: 1 | 2 | 3;
  isCompactViewport: boolean;
}): CombatVisualDamping {
  const densityScore =
    params.activeBeams * 3.2 +
    params.activeProjectiles * 0.45 +
    params.activeFlashes * 1.1 +
    (params.speedMult === 3 ? 8 : params.speedMult === 2 ? 3.5 : 0) +
    (params.isCompactViewport ? 4 : 0);

  // Smooth stress factor from 0 (calm) to 1 (heavy multi-tower barrage)
  const stress = Math.max(0, Math.min(1, (densityScore - 6) / 28));

  const beamAlphaScale = Number((1 - stress * 0.46).toFixed(2));
  const flashAlphaScale = Number((1 - stress * 0.6).toFixed(2));
  const effectAlphaScale = Number((1 - stress * 0.48).toFixed(2));
  const particleSpawnScale = Number((1 - stress * 0.62).toFixed(2));

  const baseMaxTexts = params.isCompactViewport ? 10 : 16;
  const maxFloatingTexts = Math.max(5, Math.round(baseMaxTexts - stress * 5));
  const allowMinorPopups = stress < 0.45;

  return {
    beamAlphaScale,
    flashAlphaScale,
    effectAlphaScale,
    particleSpawnScale,
    maxFloatingTexts,
    allowMinorPopups,
  };
}

/**
 * Filters available guns for fast 1-tap browsing inside compact mobile sidebars.
 */
export function filterArsenalGuns(
  guns: readonly GunCatalogItem[],
  filter: GunArsenalFilter
): GunCatalogItem[] {
  if (filter === 'all') return [...guns];
  return guns.filter((g) => getGunCategory(g.type) === filter);
}

/**
 * Calculates mobile-landscape sidebar width so the map always keeps 70%–75%+ width
 * when the panel is open, and >92% width when collapsed.
 */
export function computeMobileLandscapeSidebarPx(
  viewportWidth: number,
  collapsed: boolean
): number {
  if (collapsed) return 44;
  // Target 27% width, clamped cleanly to [212px, 256px] so map gets 72%–75% on iPhone 14-18 Pro/Pro Max (844..956px)
  return Math.max(212, Math.min(256, Math.round(viewportWidth * 0.27)));
}
