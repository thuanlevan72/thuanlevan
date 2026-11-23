import { getGunCategory, GunCatalogItem, GunType, TileKind } from './prismTdEngine.ts';

export type GunArsenalFilter = 'all' | 'attack' | 'electric' | 'support';

export type TactileFeedbackKind = 'place' | 'upgrade' | 'sell' | 'select' | 'error' | 'overdrive';

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

/**
 * Crisp unclipped labels sized for 2-column mobile landscape gun cards
 * so names never truncate awkwardly (no "Shotg..." or "Phun L...").
 */
export const GUN_MOBILE_SHORT_NAMES: Record<GunType, string> = {
  gatling: 'Vulcan',
  shotgun: 'Shotgun',
  flamer: 'Phun Lửa',
  saw: 'Lưỡi Cưa',
  mortar: 'Pháo Cối',
  missile: 'Tên Lửa',
  railgun: 'Railgun',
  prism_refract: 'Khúc Xạ',
  orbital: 'Thiên Phạt',
  hyperion: 'Hyperion',
  singularity: 'Hố Đen',
  mothership: 'Mẫu Hạm',
  supernova: 'Tân Tinh',
  chronos: 'Thời Không',
  aegis_bastion: 'Khiên Aegis',
  astral_ark: 'Pháo Hư Vô',
  aurelia_cannon: 'Hoàng Kim ★',
  paradox_scythe: 'Nghịch Lý ✦',
  nebula_core: 'Tinh Vân ✦',
  tesla: 'Tesla',
  tempest: 'Bão Từ',
  aurora_spire: 'Cực Quang ⚡',
  beacon: 'Ánh Sáng',
  cryo: 'Đóng Băng',
  radar: 'Rađa',
  quantum_prism: 'Lăng Kính',
};

export function getGunMobileShortName(type: GunType): string {
  return GUN_MOBILE_SHORT_NAMES[type];
}

/**
 * Maps a pointer coordinate onto the tactical grid, optionally shifting Y upward
 * when dragging with a finger so the turret preview sits cleanly above the fingertip.
 */
export function computeTouchGhostTile(params: {
  clientX: number;
  clientY: number;
  rect: { left: number; top: number; width: number; height: number };
  cols: number;
  rows: number;
  applyFingerOffset: boolean;
  fingerOffsetCssPx?: number;
}): { col: number; row: number } | null {
  const { clientX, clientY, rect, cols, rows, applyFingerOffset } = params;
  if (rect.width <= 0 || rect.height <= 0 || cols <= 0 || rows <= 0) return null;

  const offsetPx = applyFingerOffset ? (params.fingerOffsetCssPx ?? 34) : 0;
  const targetX = clientX;
  const targetY = clientY - offsetPx;

  if (
    targetX < rect.left ||
    targetX > rect.left + rect.width ||
    clientY < rect.top - 12 ||
    clientY > rect.top + rect.height + 12
  ) {
    return null;
  }

  const normX = Math.max(0, Math.min(0.9999, (targetX - rect.left) / rect.width));
  const normY = Math.max(0, Math.min(0.9999, (targetY - rect.top) / rect.height));
  return {
    col: Math.floor(normX * cols),
    row: Math.floor(normY * rows),
  };
}

export type TouchCanvasTapDecision =
  | { action: 'select_existing'; gunId: string }
  | { action: 'set_preview'; col: number; row: number }
  | { action: 'confirm_place'; col: number; row: number }
  | { action: 'invalid_tile'; col: number; row: number };

/**
 * Two-step touch placement:
 * 1) First tap on empty tile shows ghost turret + range ring + Confirm/Cancel bar.
 * 2) Tapping the exact same tile again (or pressing Confirm) places the tower immediately.
 */
export function resolveTouchCanvasTapAction(params: {
  tile: { col: number; row: number };
  tileKind: TileKind;
  existingGunId: string | null;
  pendingTile: { col: number; row: number } | null;
  isTouchPointer: boolean;
}): TouchCanvasTapDecision {
  const { tile, tileKind, existingGunId, pendingTile, isTouchPointer } = params;
  if (existingGunId) {
    return { action: 'select_existing', gunId: existingGunId };
  }
  if (tileKind !== 'empty') {
    return { action: 'invalid_tile', col: tile.col, row: tile.row };
  }
  if (!isTouchPointer) {
    return { action: 'confirm_place', col: tile.col, row: tile.row };
  }
  if (pendingTile && pendingTile.col === tile.col && pendingTile.row === tile.row) {
    return { action: 'confirm_place', col: tile.col, row: tile.row };
  }
  return { action: 'set_preview', col: tile.col, row: tile.row };
}

/**
 * Clamps map zoom [1, 2.2] and pan offsets within scaled map bounds so pinch/button zoom
 * never pushes the arena off-screen.
 */
export function clampMapZoomAndPan(params: {
  zoom: number;
  panX: number;
  panY: number;
  viewportW: number;
  viewportH: number;
}): { zoom: number; panX: number; panY: number } {
  const zoom = Number(Math.max(1, Math.min(2.2, params.zoom)).toFixed(2));
  if (zoom <= 1.01) {
    return { zoom: 1, panX: 0, panY: 0 };
  }
  const maxPanX = Math.max(0, ((zoom - 1) * Math.max(0, params.viewportW)) / 2);
  const maxPanY = Math.max(0, ((zoom - 1) * Math.max(0, params.viewportH)) / 2);
  return {
    zoom,
    panX: Math.max(-maxPanX, Math.min(maxPanX, params.panX)),
    panY: Math.max(-maxPanY, Math.min(maxPanY, params.panY)),
  };
}

export const TACTILE_VIBRATION_PATTERNS: Record<TactileFeedbackKind, number | number[]> = {
  select: 8,
  place: 14,
  upgrade: [12, 22, 18],
  sell: 16,
  error: [26, 30, 26],
  overdrive: [20, 24, 30],
};

export function triggerDeviceHaptic(kind: TactileFeedbackKind): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(TACTILE_VIBRATION_PATTERNS[kind]);
  } catch {
    // Ignore restricted haptic environments
  }
}

export interface VfxClutterBudget {
  readonly maxOrbitalBeams: number;
  readonly maxOrbitalZones: number;
  readonly maxBlackHoles: number;
  readonly maxChronoFields: number;
  readonly maxVoidRifts: number;
  readonly maxOverheatEffects: number;
  readonly maxRailBeams: number;
  readonly maxLightningArcs: number;
  readonly maxShockwaves: number;
  readonly maxGroundCraters: number;
  readonly areaWashAlphaScale: number;
}

/**
 * Deterministic VFX clutter regulator for stacked skills & Overheat surges.
 * Keeps simultaneous ultimates crisp, layered, and readable without blinding washout.
 */
export function computeVfxClutterBudget(params: {
  activeEffectsCount: number;
  activeBeams: number;
  speedMult: 1 | 2 | 3;
  isCompactViewport: boolean;
  overdriveActive: boolean;
}): VfxClutterBudget {
  const pressure =
    params.activeEffectsCount * 1.4 +
    params.activeBeams * 1.6 +
    (params.speedMult === 3 ? 8 : params.speedMult === 2 ? 3 : 0) +
    (params.isCompactViewport ? 5 : 0) +
    (params.overdriveActive ? 4 : 0);

  const saturation = Math.max(0, Math.min(1, (pressure - 6) / 28));
  const areaWashAlphaScale = Number(Math.max(0.28, 1 - saturation * 0.68).toFixed(2));
  const scale = 1 - saturation * 0.4;

  return {
    maxOrbitalBeams: Math.max(4, Math.round(8 * scale)),
    maxOrbitalZones: Math.max(5, Math.round(10 * scale)),
    maxBlackHoles: Math.max(4, Math.round(8 * scale)),
    maxChronoFields: Math.max(3, Math.round(6 * scale)),
    maxVoidRifts: Math.max(4, Math.round(7 * scale)),
    maxOverheatEffects: Math.max(6, Math.round(14 * scale)),
    maxRailBeams: Math.max(6, Math.round(14 * scale)),
    maxLightningArcs: Math.max(8, Math.round(20 * scale)),
    maxShockwaves: Math.max(8, Math.round(18 * scale)),
    maxGroundCraters: Math.max(6, Math.round(14 * scale)),
    areaWashAlphaScale,
  };
}
