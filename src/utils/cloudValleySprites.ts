import { type SeasonId } from './cloudValleyData.ts';

type OffscreenSurface = HTMLCanvasElement;

function makeCanvas(w: number, h: number): OffscreenSurface | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function roundedDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  cornerRatio = 0.24
): void {
  const pts: [number, number][] = [
    [cx, cy - hh],
    [cx + hw, cy],
    [cx, cy + hh],
    [cx - hw, cy],
  ];
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const pPrev = pts[(i + 3) % 4];
    const pCurr = pts[i];
    const pNext = pts[(i + 1) % 4];
    const startX = pCurr[0] + (pPrev[0] - pCurr[0]) * cornerRatio;
    const startY = pCurr[1] + (pPrev[1] - pCurr[1]) * cornerRatio;
    const endX = pCurr[0] + (pNext[0] - pCurr[0]) * cornerRatio;
    const endY = pCurr[1] + (pNext[1] - pCurr[1]) * cornerRatio;
    if (i === 0) {
      ctx.moveTo(startX, startY);
    } else {
      ctx.lineTo(startX, startY);
    }
    ctx.quadraticCurveTo(pCurr[0], pCurr[1], endX, endY);
  }
  ctx.closePath();
}

export type FruitTreeKind = 'starfruit' | 'apple' | 'peach';

export class CloudValleySpriteAtlas {
  private grassPatterns = new Map<string, CanvasPattern>();
  private pasturePatterns = new Map<string, CanvasPattern>();
  private dirtPathPattern: CanvasPattern | null = null;
  private soilSprites = new Map<string, OffscreenSurface>();
  private fruitTreeSprites = new Map<string, OffscreenSurface>();
  private farmhouseSprite: OffscreenSurface | null = null;
  private wellSprite: OffscreenSurface | null = null;
  private stallSprite: OffscreenSurface | null = null;
  private boardSprite: OffscreenSurface | null = null;
  private doghouseSprite: OffscreenSurface | null = null;
  private chickenCoopSprite: OffscreenSurface | null = null;
  private cowShedSprite: OffscreenSurface | null = null;

  public getGrassPattern(ctx: CanvasRenderingContext2D, season: SeasonId): CanvasPattern | null {
    if (this.grassPatterns.has(season)) return this.grassPatterns.get(season)!;
    const c = makeCanvas(96, 96);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Vivid classic TeaMobi Avatar palette: bright young-rice green, rich autumn amber, crisp winter snow
    const basePalette: Record<SeasonId, [string, string, string, string, string]> = {
      spring: ['#68CA3D', '#58B630', '#8AE859', '#FDE047', '#F9A8D4'],
      summer: ['#56BE37', '#48A82B', '#7CE052', '#FACC15', '#FB7185'],
      autumn: ['#C89A3F', '#B2842E', '#E3B758', '#EA580C', '#FDE047'],
      winter: ['#D7E8F5', '#C2D8EB', '#EEF7FD', '#93C5FD', '#FFFFFF'],
    };
    const [base, shade, highlight, flowerA, flowerB] = basePalette[season];

    g.fillStyle = base;
    g.fillRect(0, 0, 96, 96);

    // Pixel-crisp organic grass tufts
    g.fillStyle = shade;
    for (const [px, py] of [
      [10, 14],
      [58, 22],
      [28, 56],
      [70, 68],
      [42, 84],
    ]) {
      g.fillRect(px, py, 10, 4);
      g.fillRect(px + 2, py - 2, 6, 2);
    }

    // Pixel grass blade V-sprouts
    g.fillStyle = highlight;
    for (const [bx, by] of [
      [16, 22],
      [46, 12],
      [78, 30],
      [22, 72],
      [56, 52],
      [82, 80],
      [8, 48],
      [64, 88],
    ]) {
      g.fillRect(bx - 2, by - 3, 2, 3);
      g.fillRect(bx + 1, by - 4, 2, 4);
      g.fillRect(bx, by, 2, 2);
    }

    // 4-leaf clover pixel clusters & tiny wildflowers
    const clovers = [
      [34, 34],
      [74, 14],
      [18, 86],
      [62, 68],
    ];
    for (let i = 0; i < clovers.length; i++) {
      const [fx, fy] = clovers[i];
      g.fillStyle = season === 'winter' ? '#BAE6FD' : '#3E9A20';
      g.fillRect(fx - 3, fy, 2, 2);
      g.fillRect(fx + 1, fy, 2, 2);
      g.fillRect(fx - 1, fy - 2, 2, 2);
      g.fillStyle = i % 2 === 0 ? flowerA : flowerB;
      g.fillRect(fx - 1, fy - 1, 3, 3);
    }

    const pat = ctx.createPattern(c, 'repeat');
    if (pat) this.grassPatterns.set(season, pat);
    return pat;
  }

  public getPasturePattern(ctx: CanvasRenderingContext2D, season: SeasonId): CanvasPattern | null {
    if (this.pasturePatterns.has(season)) return this.pasturePatterns.get(season)!;
    const c = makeCanvas(64, 64);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    g.fillStyle = season === 'winter' ? '#CEE2F2' : season === 'autumn' ? '#CFA44C' : '#7AD449';
    g.fillRect(0, 0, 64, 64);

    g.fillStyle = season === 'winter' ? '#B9D1E6' : season === 'autumn' ? '#BA8F39' : '#65BC36';
    g.fillRect(10, 16, 12, 5);
    g.fillRect(42, 44, 14, 5);

    // Golden straw wisps
    g.fillStyle = season === 'winter' ? '#FFFFFF' : '#FDE047';
    g.fillRect(12, 46, 6, 2);
    g.fillRect(40, 16, 6, 2);

    const pat = ctx.createPattern(c, 'repeat');
    if (pat) this.pasturePatterns.set(season, pat);
    return pat;
  }

  public getDirtPathPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.dirtPathPattern) return this.dirtPathPattern;
    const c = makeCanvas(64, 64);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Warm packed-earth footpath base
    g.fillStyle = '#D9AA6C';
    g.fillRect(0, 0, 64, 64);

    // Subtle earthen mottling & tiny path pebbles
    g.fillStyle = '#C99656';
    g.fillRect(6, 10, 14, 6);
    g.fillRect(36, 28, 16, 7);
    g.fillRect(14, 48, 12, 6);

    g.fillStyle = '#ECC488';
    g.fillRect(26, 8, 8, 4);
    g.fillRect(48, 50, 9, 4);

    g.fillStyle = '#9C7242';
    g.fillRect(18, 22, 3, 2);
    g.fillRect(48, 14, 3, 2);
    g.fillRect(30, 54, 4, 2);

    this.dirtPathPattern = ctx.createPattern(c, 'repeat');
    return this.dirtPathPattern;
  }

  /**
   * Seamless Rounded Isometric Soil Mound sitting directly on meadow grass (no black square checkerboard!)
   */
  public getSoilTileSprite(
    tilled: boolean,
    moistureBucket: 'wet' | 'normal' | 'dry' | 'frozen',
    season: SeasonId,
    even: boolean
  ): OffscreenSurface | null {
    const key = `iso_${tilled ? 't' : 'u'}_${moistureBucket}_${season}_${even ? 'e' : 'o'}`;
    if (this.soilSprites.has(key)) return this.soilSprites.get(key)!;
    const c = makeCanvas(96, 56);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    const cx = 48;
    const cy = 27;
    const hw = 43;
    const hh = 22.5;

    if (!tilled) {
      // Soft rounded meadow plot pad with tiny grass marks (no heavy dark grid lines)
      roundedDiamond(g, cx, cy, hw, hh, 0.25);
      g.fillStyle =
        season === 'winter'
          ? even
            ? 'rgba(226, 240, 250, 0.5)'
            : 'rgba(208, 226, 242, 0.5)'
          : even
          ? 'rgba(134, 226, 84, 0.45)'
          : 'rgba(116, 206, 68, 0.45)';
      g.fill();
      g.strokeStyle = season === 'winter' ? 'rgba(120, 160, 195, 0.45)' : 'rgba(54, 128, 28, 0.35)';
      g.lineWidth = 1.3;
      g.stroke();

      g.fillStyle = season === 'winter' ? 'rgba(255,255,255,0.6)' : 'rgba(220, 252, 168, 0.55)';
      g.fillRect(cx - 8, cy + 2, 2, 3);
      g.fillRect(cx + 6, cy - 4, 2, 3);
      this.soilSprites.set(key, c);
      return c;
    }

    // 2.5D Rounded Isometric Earthen Mound
    const sideRim =
      moistureBucket === 'frozen'
        ? '#8BAAC4'
        : moistureBucket === 'wet'
        ? '#361C0D'
        : moistureBucket === 'normal'
        ? '#6D3E1C'
        : '#936234';
    const topFill =
      moistureBucket === 'frozen'
        ? '#C2D9EB'
        : moistureBucket === 'wet'
        ? '#4F2A14'
        : moistureBucket === 'normal'
        ? '#9B5B2C'
        : '#C48E53';
    const ridgeHighlight =
      moistureBucket === 'frozen'
        ? '#E2EFF8'
        : moistureBucket === 'wet'
        ? '#6E3F22'
        : moistureBucket === 'normal'
        ? '#BA7440'
        : '#DCAA70';
    const ridgeShade =
      moistureBucket === 'frozen'
        ? '#9DB9D0'
        : moistureBucket === 'wet'
        ? '#341A0B'
        : moistureBucket === 'normal'
        ? '#7A421D'
        : '#A6723D';

    // Soft ambient shadow beneath earthen mound
    roundedDiamond(g, cx, cy + 3.5, hw + 1, hh + 1, 0.28);
    g.fillStyle = 'rgba(0, 0, 0, 0.22)';
    g.fill();

    // Extruded mound bevel side
    roundedDiamond(g, cx, cy + 2.5, hw, hh, 0.28);
    g.fillStyle = sideRim;
    g.fill();

    // Rounded soil mound top face
    roundedDiamond(g, cx, cy - 0.5, hw, hh - 0.5, 0.28);
    g.fillStyle = topFill;
    g.fill();
    g.strokeStyle = 'rgba(48, 25, 10, 0.45)';
    g.lineWidth = 1.4;
    g.stroke();

    // Sculpted isometric furrow lines
    g.lineCap = 'round';
    for (const offset of [-8, 0, 8]) {
      g.strokeStyle = ridgeShade;
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(cx - 19 + offset * 0.6, cy + offset * 0.55 - 7);
      g.lineTo(cx + 15 + offset * 0.6, cy + offset * 0.55 + 9);
      g.stroke();

      g.strokeStyle = ridgeHighlight;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(cx - 19 + offset * 0.6, cy + offset * 0.55 - 8.5);
      g.lineTo(cx + 15 + offset * 0.6, cy + offset * 0.55 + 7.5);
      g.stroke();
    }

    // Glossy moisture sheen droplets if wet
    if (moistureBucket === 'wet') {
      g.fillStyle = 'rgba(125, 211, 252, 0.72)';
      for (const [dx, dy] of [
        [cx - 14, cy - 3],
        [cx + 12, cy + 2],
        [cx - 2, cy + 8],
        [cx + 4, cy - 9],
      ]) {
        g.beginPath();
        g.arc(dx, dy, 1.8, 0, Math.PI * 2);
        g.fill();
      }
    }

    this.soilSprites.set(key, c);
    return c;
  }

  /**
   * Thick-outlined TeaMobi Fruit Trees (Starfruit / Apple / Peach) with drop shadow
   */
  public getFruitTreeSprite(kind: FruitTreeKind, season: SeasonId): OffscreenSurface | null {
    const key = `fruit_${kind}_${season}`;
    if (this.fruitTreeSprites.has(key)) return this.fruitTreeSprites.get(key)!;
    const c = makeCanvas(132, 160);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // 1. Crisp elliptical drop shadow
    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(66, 142, 36, 12, 0, 0, Math.PI * 2);
    g.fill();

    // 2. Thick-outlined bark trunk
    g.fillStyle = '#734424';
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.beginPath();
    g.moveTo(54, 140);
    g.quadraticCurveTo(58, 114, 58, 86);
    g.lineTo(74, 86);
    g.quadraticCurveTo(74, 114, 79, 140);
    g.closePath();
    g.fill();
    g.stroke();

    g.fillStyle = '#9C6238';
    g.fillRect(60, 92, 5, 42);

    // 3. Seasonal canopy palette
    let dark = '#247E28';
    let mid = '#3DB53C';
    let light = '#74E35B';
    if (season === 'autumn') {
      dark = '#B45309';
      mid = '#EA580C';
      light = '#FBBF24';
    } else if (season === 'winter') {
      dark = '#64748B';
      mid = '#94A3B8';
      light = '#E2EEF8';
    } else if (kind === 'peach' && season === 'spring') {
      dark = '#BE185D';
      mid = '#F472B6';
      light = '#FBCFE8';
    }

    const puffs: [number, number, number][] = [
      [42, 74, 24],
      [90, 74, 24],
      [66, 82, 26],
      [44, 50, 24],
      [88, 50, 24],
      [66, 38, 28],
    ];

    // Thick 2px outer outline pass
    g.fillStyle = '#1E120A';
    for (const [px, py, pr] of puffs) {
      g.beginPath();
      g.arc(px, py, pr + 2.4, 0, Math.PI * 2);
      g.fill();
    }
    // Shaded base
    g.fillStyle = dark;
    for (const [px, py, pr] of puffs) {
      g.beginPath();
      g.arc(px, py, pr, 0, Math.PI * 2);
      g.fill();
    }
    // Mid foliage
    g.fillStyle = mid;
    for (const [px, py, pr] of puffs) {
      g.beginPath();
      g.arc(px - 2, py - 4, pr * 0.82, 0, Math.PI * 2);
      g.fill();
    }
    // Sunlit crown highlights (separate subpaths)
    g.fillStyle = light;
    for (const [lx, ly, lr] of [
      [56, 32, 13],
      [40, 48, 10],
      [78, 46, 9],
    ]) {
      g.beginPath();
      g.arc(lx, ly, lr, 0, Math.PI * 2);
      g.fill();
    }

    // 4. Outlined Hanging Fruits (Starfruit / Apple / Peach)
    const fruitPositions: [number, number][] = [
      [42, 66],
      [68, 46],
      [86, 62],
      [56, 78],
      [78, 76],
    ];
    for (const [fx, fy] of fruitPositions) {
      if (kind === 'starfruit') {
        // Classic 5-pointed golden Starfruit (Quả Khế)
        g.fillStyle = '#FACC15';
        g.strokeStyle = '#422006';
        g.lineWidth = 1.6;
        g.beginPath();
        for (let k = 0; k < 10; k++) {
          const r = k % 2 === 0 ? 7.2 : 3.4;
          const ang = -Math.PI * 0.5 + (k * Math.PI) / 5;
          const sx = fx + Math.cos(ang) * r;
          const sy = fy + Math.sin(ang) * r;
          if (k === 0) g.moveTo(sx, sy);
          else g.lineTo(sx, sy);
        }
        g.closePath();
        g.fill();
        g.stroke();
        g.fillStyle = '#FEF9C3';
        g.beginPath();
        g.arc(fx - 1, fy - 1, 1.5, 0, Math.PI * 2);
        g.fill();
      } else if (kind === 'apple') {
        // Glossy Red Apple (Quả Táo Đỏ) + green leaf
        g.fillStyle = '#EF4444';
        g.strokeStyle = '#450A0A';
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(fx, fy, 5.8, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = '#4ADE80';
        g.beginPath();
        g.ellipse(fx + 2.4, fy - 5.5, 3, 1.6, -0.5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#FFFFFF';
        g.beginPath();
        g.arc(fx - 1.8, fy - 1.8, 1.6, 0, Math.PI * 2);
        g.fill();
      } else {
        g.fillStyle = '#FB7185';
        g.strokeStyle = '#4C0519';
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(fx, fy, 4.8, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = '#FEF08A';
        g.beginPath();
        g.arc(fx - 1.4, fy - 1.4, 1.5, 0, Math.PI * 2);
        g.fill();
      }
    }

    this.fruitTreeSprites.set(key, c);
    return c;
  }

  /**
   * Classic TeaMobi Wooden Tile-Roof Farmhouse (Nhà Gỗ Mái Ngói Đỏ/Vàng + Biển Hiệu Gỗ)
   */
  public getFarmhouseSprite(): OffscreenSurface | null {
    if (this.farmhouseSprite) return this.farmhouseSprite;
    const c = makeCanvas(268, 224);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // 1. Ground Drop Shadow
    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(134, 204, 114, 16, 0, 0, Math.PI * 2);
    g.fill();

    // 2. Small Stone Grain Mill / Windmill Tower on right
    g.fillStyle = '#C9B396';
    rrect(g, 198, 72, 48, 124, 6);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    // Golden conical roof on mill tower
    g.fillStyle = '#EAB308';
    g.beginPath();
    g.moveTo(190, 76);
    g.lineTo(222, 40);
    g.lineTo(254, 76);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.stroke();

    // 3. Stone Porch Foundation
    g.fillStyle = '#94A3B8';
    rrect(g, 24, 184, 180, 20, 5);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.stroke();

    // 4. Warm Timber Walls
    g.fillStyle = '#D99B58';
    rrect(g, 28, 92, 172, 96, 6);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.4;
    g.stroke();

    // Plank lines & darker wood columns
    g.strokeStyle = 'rgba(92, 48, 16, 0.35)';
    g.lineWidth = 1.4;
    for (let y = 108; y < 184; y += 16) {
      g.beginPath();
      g.moveTo(32, y);
      g.lineTo(196, y);
      g.stroke();
    }
    g.fillStyle = '#78441E';
    g.fillRect(28, 94, 12, 92);
    g.fillRect(188, 94, 12, 92);
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.8;
    g.strokeRect(28, 94, 12, 92);
    g.strokeRect(188, 94, 12, 92);

    // 5. Traditional Curved Brick-Red & Gold Vietnamese Tile Roof
    g.fillStyle = '#D93829';
    g.beginPath();
    g.moveTo(8, 102);
    g.quadraticCurveTo(60, 64, 114, 24);
    g.quadraticCurveTo(168, 64, 220, 102);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.5;
    g.stroke();

    // Golden-yellow ridge trim & scalloped eaves
    g.strokeStyle = '#FACC15';
    g.lineWidth = 4.5;
    g.beginPath();
    g.moveTo(11, 101);
    g.quadraticCurveTo(60, 64, 114, 25);
    g.quadraticCurveTo(168, 64, 217, 101);
    g.stroke();

    // Tile roof courses
    g.strokeStyle = 'rgba(69, 10, 10, 0.32)';
    g.lineWidth = 1.5;
    for (let row = 1; row <= 3; row++) {
      const y = 42 + row * 16;
      const span = row * 28 + 14;
      g.beginPath();
      g.moveTo(114 - span, y);
      g.lineTo(114 + span, y);
      g.stroke();
    }

    // Chimney on left
    g.fillStyle = '#B45309';
    g.fillRect(48, 28, 20, 38);
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.strokeRect(48, 28, 20, 38);

    // 6. Glowing Wooden Lattice Window
    g.fillStyle = '#FEF08A';
    rrect(g, 48, 122, 32, 30, 4);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.stroke();
    g.beginPath();
    g.moveTo(64, 122);
    g.lineTo(64, 152);
    g.moveTo(48, 137);
    g.lineTo(80, 137);
    g.stroke();

    // 7. Arched Timber Front Door + Porch Steps
    g.fillStyle = '#6B3B1A';
    rrect(g, 92, 124, 46, 62, 6);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();
    g.beginPath();
    g.moveTo(115, 124);
    g.lineTo(115, 186);
    g.stroke();
    // Brass door knobs
    g.fillStyle = '#FACC15';
    g.beginPath();
    g.arc(109, 156, 2.3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(121, 156, 2.3, 0, Math.PI * 2);
    g.fill();

    // 8. Hanging Wooden Signboard over the front door ("XƯỞNG KHO")
    g.fillStyle = '#4A2B13';
    g.fillRect(92, 92, 3, 10);
    g.fillRect(135, 92, 3, 10);
    g.fillStyle = '#F5DEB3';
    rrect(g, 76, 98, 78, 20, 4);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#451A03';
    g.font = '800 10px "Plus Jakarta Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText('XƯỞNG KHO', 115, 112);

    // Hay bundle beside porch
    g.fillStyle = '#FACC15';
    rrect(g, 152, 162, 32, 22, 4);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.8;
    g.stroke();

    this.farmhouseSprite = c;
    return c;
  }

  public getWellSprite(): OffscreenSurface | null {
    if (this.wellSprite) return this.wellSprite;
    const c = makeCanvas(132, 152);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(66, 132, 48, 16, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#64748B';
    g.beginPath();
    g.ellipse(66, 118, 42, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(24, 88, 84, 30);
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.strokeRect(24, 88, 84, 30);

    g.fillStyle = '#94A3B8';
    g.beginPath();
    g.ellipse(66, 88, 42, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.stroke();

    g.fillStyle = '#0284C7';
    g.beginPath();
    g.ellipse(66, 88, 30, 13.5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#38BDF8';
    g.beginPath();
    g.ellipse(64, 90, 21, 8.5, 0, 0, Math.PI * 2);
    g.fill();

    // Timber posts
    g.fillStyle = '#78441E';
    g.fillRect(28, 38, 9, 52);
    g.fillRect(95, 38, 9, 52);
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.strokeRect(28, 38, 9, 52);
    g.strokeRect(95, 38, 9, 52);

    // Windlass & wooden bucket
    g.fillStyle = '#9C6238';
    g.fillRect(26, 52, 80, 7);
    g.strokeRect(26, 52, 80, 7);
    g.strokeStyle = '#FEF3C7';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(66, 59);
    g.lineTo(66, 76);
    g.stroke();
    g.fillStyle = '#B45309';
    rrect(g, 59, 74, 14, 12, 2);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.6;
    g.stroke();

    // Bright brick-red roof
    g.fillStyle = '#D93829';
    g.beginPath();
    g.moveTo(14, 44);
    g.lineTo(66, 10);
    g.lineTo(118, 44);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.4;
    g.stroke();

    this.wellSprite = c;
    return c;
  }

  public getMerchantStallSprite(): OffscreenSurface | null {
    if (this.stallSprite) return this.stallSprite;
    const c = makeCanvas(230, 178);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(115, 164, 98, 13, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#6B3B1A';
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.fillRect(24, 40, 10, 114);
    g.strokeRect(24, 40, 10, 114);
    g.fillRect(196, 40, 10, 114);
    g.strokeRect(196, 40, 10, 114);

    // Merchant counter
    g.fillStyle = '#9C5E2E';
    rrect(g, 18, 106, 194, 52, 6);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    g.fillStyle = '#C4824E';
    rrect(g, 14, 100, 202, 14, 5);
    g.fill();
    g.stroke();

    const baskets: [number, string, string][] = [
      [42, '#EF4444', '#FCA5A5'],
      [172, '#FACC15', '#FEF08A'],
    ];
    for (const [bx, fCol, fHi] of baskets) {
      g.fillStyle = '#E5C392';
      rrect(g, bx, 88, 28, 14, 4);
      g.fill();
      g.strokeStyle = '#1E120A';
      g.lineWidth = 1.6;
      g.stroke();
      for (const [fx, fy, fr] of [
        [bx + 8, 88, 5],
        [bx + 16, 86, 5.5],
        [bx + 22, 89, 4.5],
      ]) {
        g.fillStyle = fCol;
        g.beginPath();
        g.arc(fx, fy, fr, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = fHi;
      g.beginPath();
      g.arc(bx + 15, 84, 1.8, 0, Math.PI * 2);
      g.fill();
    }

    // Striped red & cream scalloped awning
    const stripes = 6;
    const aw = 208;
    const sw = aw / stripes;
    for (let i = 0; i < stripes; i++) {
      const sx = 11 + i * sw;
      g.fillStyle = i % 2 === 0 ? '#D93829' : '#FFFDF5';
      g.beginPath();
      g.moveTo(sx, 14);
      g.lineTo(sx + sw, 14);
      g.lineTo(sx + sw, 52);
      g.arc(sx + sw * 0.5, 52, sw * 0.5, 0, Math.PI);
      g.closePath();
      g.fill();
      g.strokeStyle = '#1E120A';
      g.lineWidth = 1.8;
      g.stroke();
    }

    g.fillStyle = '#FACC15';
    rrect(g, 8, 10, 214, 8, 4);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.8;
    g.stroke();

    this.stallSprite = c;
    return c;
  }

  public getNoticeBoardSprite(): OffscreenSurface | null {
    if (this.boardSprite) return this.boardSprite;
    const c = makeCanvas(110, 120);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(55, 108, 34, 9, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#6B3B1A';
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.fillRect(26, 48, 9, 58);
    g.strokeRect(26, 48, 9, 58);
    g.fillRect(75, 48, 9, 58);
    g.strokeRect(75, 48, 9, 58);

    g.fillStyle = '#9C5E2E';
    rrect(g, 14, 24, 82, 56, 6);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    g.fillStyle = '#F5DEB3';
    rrect(g, 20, 30, 70, 44, 3);
    g.fill();

    g.fillStyle = '#FFFFFF';
    g.fillRect(25, 35, 24, 28);
    g.strokeStyle = '#94A3B8';
    g.lineWidth = 1;
    g.strokeRect(25, 35, 24, 28);

    g.fillStyle = '#DCFCE7';
    g.fillRect(55, 37, 28, 24);
    g.strokeStyle = '#4ADE80';
    g.strokeRect(55, 37, 28, 24);

    g.fillStyle = '#EF4444';
    g.beginPath();
    g.arc(37, 36, 2.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(69, 38, 2.5, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#D93829';
    g.beginPath();
    g.moveTo(8, 28);
    g.lineTo(55, 8);
    g.lineTo(102, 28);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    this.boardSprite = c;
    return c;
  }

  /**
   * Cute Guard Doghouse (Ổ Chó Gỗ) beside the farm gate
   */
  public getDoghouseSprite(): OffscreenSurface | null {
    if (this.doghouseSprite) return this.doghouseSprite;
    const c = makeCanvas(92, 92);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(46, 80, 32, 10, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = '#C4824E';
    rrect(g, 18, 38, 56, 40, 5);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    // Dark arched kennel doorway
    g.fillStyle = '#29170B';
    g.beginPath();
    g.arc(46, 62, 12, Math.PI, 0);
    g.lineTo(58, 78);
    g.lineTo(34, 78);
    g.closePath();
    g.fill();

    // Red-gold roof
    g.fillStyle = '#D93829';
    g.beginPath();
    g.moveTo(10, 42);
    g.lineTo(46, 14);
    g.lineTo(82, 42);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    // Little bone plaque
    g.fillStyle = '#FFFDF7';
    rrect(g, 37, 29, 18, 6, 3);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.2;
    g.stroke();

    this.doghouseSprite = c;
    return c;
  }

  /**
   * Cozy Wooden Chicken Coop (Chuồng Gà) with straw nest box & fresh eggs
   */
  public getChickenCoopSprite(): OffscreenSurface | null {
    if (this.chickenCoopSprite) return this.chickenCoopSprite;
    const c = makeCanvas(128, 114);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Ground drop shadow
    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(64, 98, 52, 13, 0, 0, Math.PI * 2);
    g.fill();

    // Wooden legs & stilts
    g.fillStyle = '#6B3B1A';
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2;
    g.fillRect(24, 78, 8, 18);
    g.strokeRect(24, 78, 8, 18);
    g.fillRect(88, 78, 8, 18);
    g.strokeRect(88, 78, 8, 18);

    // Timber coop body
    g.fillStyle = '#E09F5A';
    rrect(g, 18, 40, 84, 44, 6);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    // Straw nest box on right side with white eggs
    g.fillStyle = '#B45309';
    rrect(g, 82, 54, 34, 28, 4);
    g.fill();
    g.stroke();
    g.fillStyle = '#FACC15';
    rrect(g, 85, 56, 28, 10, 3);
    g.fill();
    for (const [ex, ey] of [
      [92, 57],
      [99, 55],
      [106, 58],
    ]) {
      g.fillStyle = '#FFFDF7';
      g.beginPath();
      g.ellipse(ex, ey, 4.2, 5.2, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#1E120A';
      g.lineWidth = 1.3;
      g.stroke();
    }

    // Little coop doorway + ramp
    g.fillStyle = '#29170B';
    rrect(g, 34, 52, 22, 30, 4);
    g.fill();
    g.fillStyle = '#C4824E';
    g.beginPath();
    g.moveTo(34, 82);
    g.lineTo(54, 82);
    g.lineTo(44, 100);
    g.lineTo(22, 100);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.8;
    g.stroke();

    // Golden-red pitched roof
    g.fillStyle = '#EA580C';
    g.beginPath();
    g.moveTo(8, 44);
    g.lineTo(60, 12);
    g.lineTo(114, 44);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.4;
    g.stroke();
    g.strokeStyle = '#FDE047';
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(10, 43);
    g.lineTo(60, 13);
    g.lineTo(112, 43);
    g.stroke();

    this.chickenCoopSprite = c;
    return c;
  }

  /**
   * Rustic Cow Barn Shelter & Shiny Milk Cans (Chuồng Bò)
   */
  public getCowShedSprite(): OffscreenSurface | null {
    if (this.cowShedSprite) return this.cowShedSprite;
    const c = makeCanvas(136, 114);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    g.fillStyle = 'rgba(0, 0, 0, 0.25)';
    g.beginPath();
    g.ellipse(68, 98, 56, 14, 0, 0, Math.PI * 2);
    g.fill();

    // Open-front timber cow shelter
    g.fillStyle = '#9C5E2E';
    rrect(g, 18, 42, 86, 50, 5);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.2;
    g.stroke();

    // Dark interior + golden hay stack
    g.fillStyle = '#3E2009';
    rrect(g, 28, 52, 66, 38, 4);
    g.fill();
    g.fillStyle = '#FACC15';
    rrect(g, 34, 68, 36, 20, 4);
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 1.6;
    g.stroke();

    // Brick-red roof
    g.fillStyle = '#D93829';
    g.beginPath();
    g.moveTo(8, 46);
    g.lineTo(61, 14);
    g.lineTo(114, 46);
    g.closePath();
    g.fill();
    g.strokeStyle = '#1E120A';
    g.lineWidth = 2.4;
    g.stroke();

    // Pair of shiny silver Milk Cans (Bình Sữa Bò) right beside shelter
    for (const [mx, my] of [
      [106, 70],
      [118, 76],
    ]) {
      g.fillStyle = '#E2E8F0';
      rrect(g, mx - 7, my, 14, 20, 3);
      g.fill();
      g.strokeStyle = '#1E120A';
      g.lineWidth = 1.8;
      g.stroke();
      g.fillStyle = '#38BDF8';
      g.fillRect(mx - 6, my + 7, 12, 5);
      g.fillStyle = '#CBD5E1';
      g.fillRect(mx - 4, my - 4, 8, 4);
      g.strokeRect(mx - 4, my - 4, 8, 4);
    }

    this.cowShedSprite = c;
    return c;
  }
}
