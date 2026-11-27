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

export class CloudValleySpriteAtlas {
  private grassPatterns = new Map<string, CanvasPattern>();
  private pasturePatterns = new Map<string, CanvasPattern>();
  private cobblePattern: CanvasPattern | null = null;
  private soilSprites = new Map<string, OffscreenSurface>();
  private treeSprites = new Map<string, OffscreenSurface>();
  private barnSprite: OffscreenSurface | null = null;
  private wellSprite: OffscreenSurface | null = null;
  private stallSprite: OffscreenSurface | null = null;
  private boardSprite: OffscreenSurface | null = null;

  public getGrassPattern(ctx: CanvasRenderingContext2D, season: SeasonId): CanvasPattern | null {
    if (this.grassPatterns.has(season)) return this.grassPatterns.get(season)!;
    const c = makeCanvas(96, 96);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    const basePalette: Record<SeasonId, [string, string, string, string]> = {
      spring: ['#79B85B', '#6BA94E', '#8FCC6B', '#FDE047'],
      summer: ['#67AF4D', '#589C41', '#7FC45F', '#F9A8D4'],
      autumn: ['#B5964C', '#9E813E', '#CCA95A', '#EA580C'],
      winter: ['#D5E3EE', '#C2D4E3', '#E8F1F8', '#93C5FD'],
    };
    const [base, shade, highlight, flower] = basePalette[season];

    g.fillStyle = base;
    g.fillRect(0, 0, 96, 96);

    // Subtle organic meadow mottling
    g.fillStyle = shade;
    const patches = [
      [10, 14, 18, 10],
      [58, 22, 22, 12],
      [28, 56, 24, 14],
      [70, 68, 18, 11],
    ];
    for (const [px, py, pw, ph] of patches) {
      g.beginPath();
      g.ellipse(px, py, pw * 0.5, ph * 0.5, 0.2, 0, Math.PI * 2);
      g.fill();
    }

    // Crisp grass blade clusters
    const blades = [
      [16, 20],
      [44, 12],
      [78, 30],
      [22, 72],
      [56, 52],
      [82, 80],
      [8, 48],
      [64, 88],
    ];
    g.strokeStyle = highlight;
    g.lineWidth = 1.5;
    g.lineCap = 'round';
    for (const [bx, by] of blades) {
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx - 2.5, by - 5);
      g.moveTo(bx + 2, by);
      g.lineTo(bx + 3.5, by - 4.5);
      g.stroke();
    }

    // Tiny seasonal clover blossoms / snow flecks
    const blossoms = [
      [34, 32],
      [74, 14],
      [18, 84],
      [60, 68],
    ];
    for (let i = 0; i < blossoms.length; i++) {
      const [fx, fy] = blossoms[i];
      g.fillStyle = i % 2 === 0 ? '#FFFDF7' : flower;
      g.beginPath();
      g.arc(fx, fy, 1.8, 0, Math.PI * 2);
      g.fill();
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

    g.fillStyle = season === 'winter' ? '#CFE0EE' : season === 'autumn' ? '#C0A661' : '#8DC96B';
    g.fillRect(0, 0, 64, 64);

    g.fillStyle = season === 'winter' ? '#B9CFE0' : season === 'autumn' ? '#AA8F4D' : '#7CB85B';
    g.beginPath();
    g.ellipse(18, 22, 11, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(48, 48, 12, 7, 0.3, 0, Math.PI * 2);
    g.fill();

    // Golden hay wisps scattered in pasture
    g.strokeStyle = season === 'winter' ? '#E2E8F0' : '#EAB308';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(12, 46);
    g.lineTo(19, 44);
    g.moveTo(40, 16);
    g.lineTo(47, 19);
    g.stroke();

    const pat = ctx.createPattern(c, 'repeat');
    if (pat) this.pasturePatterns.set(season, pat);
    return pat;
  }

  public getCobblePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
    if (this.cobblePattern) return this.cobblePattern;
    const c = makeCanvas(64, 64);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Warm sandy mortar base
    g.fillStyle = '#CBB38E';
    g.fillRect(0, 0, 64, 64);

    // Classic Avatar rounded cobblestone pavers
    const stones: [number, number, number, number, string][] = [
      [2, 2, 27, 17, '#EADAC0'],
      [33, 2, 29, 17, '#E2CFAF'],
      [0, 22, 17, 18, '#DFCA9E'],
      [20, 22, 26, 18, '#EFE1C9'],
      [49, 22, 15, 18, '#E3CFAF'],
      [4, 43, 28, 19, '#E5D3B5'],
      [35, 43, 27, 19, '#EDE0C7'],
    ];
    for (const [sx, sy, sw, sh, fill] of stones) {
      g.fillStyle = '#A88C67';
      rrect(g, sx, sy + 1.5, sw, sh, 5);
      g.fill();
      g.fillStyle = fill;
      rrect(g, sx, sy, sw, sh - 1.5, 5);
      g.fill();
      // Top-left sunlit highlight lip
      g.strokeStyle = 'rgba(255, 252, 245, 0.55)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(sx + 4, sy + 1.5);
      g.lineTo(sx + sw - 4, sy + 1.5);
      g.stroke();
    }

    this.cobblePattern = ctx.createPattern(c, 'repeat');
    return this.cobblePattern;
  }

  public getSoilTileSprite(
    tilled: boolean,
    moistureBucket: 'wet' | 'normal' | 'dry' | 'frozen',
    season: SeasonId,
    even: boolean
  ): OffscreenSurface | null {
    const key = `${tilled ? 't' : 'u'}_${moistureBucket}_${season}_${even ? 'e' : 'o'}`;
    if (this.soilSprites.has(key)) return this.soilSprites.get(key)!;
    const c = makeCanvas(64, 64);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    if (!tilled) {
      // Soft framed grass plot square (TeaMobi style raised garden edge)
      g.fillStyle =
        season === 'winter'
          ? even
            ? 'rgba(226, 239, 248, 0.65)'
            : 'rgba(208, 224, 238, 0.65)'
          : even
          ? 'rgba(130, 192, 92, 0.55)'
          : 'rgba(114, 176, 78, 0.55)';
      rrect(g, 3, 3, 58, 58, 8);
      g.fill();
      g.strokeStyle = 'rgba(72, 114, 46, 0.35)';
      g.lineWidth = 1.5;
      g.stroke();
      // Subtle grass blades
      g.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      g.beginPath();
      g.moveTo(16, 46);
      g.lineTo(14, 41);
      g.moveTo(46, 22);
      g.lineTo(48, 17);
      g.stroke();
      this.soilSprites.set(key, c);
      return c;
    }

    // 2.5D Extruded Wooden-Rim Soil Bed
    // Drop shadow
    g.fillStyle = 'rgba(32, 20, 10, 0.3)';
    rrect(g, 3, 6, 58, 56, 8);
    g.fill();

    // Wooden box outer frame
    g.fillStyle = '#6D4322';
    rrect(g, 2, 2, 60, 58, 8);
    g.fill();
    g.strokeStyle = '#3E2411';
    g.lineWidth = 1.5;
    g.stroke();

    // Top-left bevel highlight on timber rim
    g.strokeStyle = 'rgba(244, 208, 158, 0.45)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(8, 3.5);
    g.lineTo(56, 3.5);
    g.stroke();

    // Soil fill color by moisture
    const soilColor =
      moistureBucket === 'frozen'
        ? '#B8CDE0'
        : moistureBucket === 'wet'
        ? '#4B2E1B'
        : moistureBucket === 'normal'
        ? '#73492D'
        : '#A67850';
    const furrowShade =
      moistureBucket === 'frozen'
        ? '#9AB5CE'
        : moistureBucket === 'wet'
        ? '#331E10'
        : moistureBucket === 'normal'
        ? '#58341D'
        : '#885D38';
    const furrowHighlight =
      moistureBucket === 'frozen'
        ? '#DCEAF5'
        : moistureBucket === 'wet'
        ? '#65412A'
        : moistureBucket === 'normal'
        ? '#8D5E3E'
        : '#BD8E64';

    g.fillStyle = soilColor;
    rrect(g, 6, 6, 52, 50, 5);
    g.fill();

    // 4 sculpted horizontal soil ridges
    for (let i = 0; i < 4; i++) {
      const fy = 12 + i * 11;
      g.fillStyle = furrowHighlight;
      rrect(g, 10, fy, 44, 4, 2);
      g.fill();
      g.fillStyle = furrowShade;
      rrect(g, 10, fy + 4, 44, 3.5, 2);
      g.fill();
    }

    // Wet shimmer droplets if moisture >= 60%
    if (moistureBucket === 'wet') {
      g.fillStyle = 'rgba(125, 211, 252, 0.72)';
      for (const [dx, dy, dr] of [
        [15, 17, 1.8],
        [47, 29, 1.6],
        [28, 44, 1.8],
        [43, 18, 1.4],
      ]) {
        g.beginPath();
        g.arc(dx, dy, dr, 0, Math.PI * 2);
        g.fill();
      }
    }

    this.soilSprites.set(key, c);
    return c;
  }

  public getTreeSprite(variant: 'oak' | 'pine', season: SeasonId): OffscreenSurface | null {
    const key = `${variant}_${season}`;
    if (this.treeSprites.has(key)) return this.treeSprites.get(key)!;
    const c = makeCanvas(128, 156);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Ground shadow
    g.fillStyle = 'rgba(20, 32, 14, 0.24)';
    g.beginPath();
    g.ellipse(64, 138, 36, 12, 0, 0, Math.PI * 2);
    g.fill();

    // Textured bark trunk with root flare
    g.fillStyle = '#5D3A21';
    g.beginPath();
    g.moveTo(52, 136);
    g.quadraticCurveTo(56, 114, 56, 86);
    g.lineTo(72, 86);
    g.quadraticCurveTo(72, 114, 77, 136);
    g.closePath();
    g.fill();
    g.strokeStyle = '#382010';
    g.lineWidth = 2;
    g.stroke();

    // Trunk sunlit bark stripe
    g.fillStyle = '#7D5132';
    g.fillRect(58, 92, 5, 40);

    if (variant === 'pine') {
      const dark = season === 'autumn' ? '#9A3412' : season === 'winter' ? '#36584D' : '#1E5631';
      const mid = season === 'autumn' ? '#C2410C' : season === 'winter' ? '#4C7A6B' : '#2D7A47';
      const light = season === 'autumn' ? '#EA580C' : season === 'winter' ? '#E2EEF6' : '#4BA35C';

      const tiers = [
        { y: 102, w: 46, h: 42 },
        { y: 74, w: 38, h: 38 },
        { y: 48, w: 28, h: 34 },
      ];
      for (const t of tiers) {
        g.fillStyle = dark;
        g.beginPath();
        g.moveTo(64 - t.w, t.y);
        g.quadraticCurveTo(64, t.y + 8, 64 + t.w, t.y);
        g.lineTo(64, t.y - t.h);
        g.closePath();
        g.fill();
        g.strokeStyle = '#183621';
        g.lineWidth = 2;
        g.stroke();

        // Sunlit left side foliage highlight
        g.fillStyle = mid;
        g.beginPath();
        g.moveTo(64 - t.w + 4, t.y - 2);
        g.lineTo(64, t.y + 3);
        g.lineTo(64, t.y - t.h + 2);
        g.closePath();
        g.fill();

        g.fillStyle = light;
        g.beginPath();
        g.moveTo(64 - t.w * 0.65, t.y - 8);
        g.lineTo(64 - 4, t.y - 6);
        g.lineTo(64, t.y - t.h + 4);
        g.closePath();
        g.fill();
      }
    } else {
      const dark = season === 'autumn' ? '#B45309' : season === 'winter' ? '#64748B' : '#256D36';
      const mid = season === 'autumn' ? '#D97706' : season === 'winter' ? '#94A3B8' : '#3E9B4C';
      const light = season === 'autumn' ? '#FBBF24' : season === 'winter' ? '#E2E8F0' : '#6FD067';

      const puffs: [number, number, number][] = [
        [42, 74, 24],
        [86, 74, 24],
        [64, 82, 26],
        [44, 52, 24],
        [84, 52, 24],
        [64, 42, 28],
      ];
      // Outer crisp dark outline pass
      g.fillStyle = '#1C3E22';
      for (const [px, py, pr] of puffs) {
        g.beginPath();
        g.arc(px, py, pr + 2.2, 0, Math.PI * 2);
        g.fill();
      }
      // Shaded canopy base
      g.fillStyle = dark;
      for (const [px, py, pr] of puffs) {
        g.beginPath();
        g.arc(px, py, pr, 0, Math.PI * 2);
        g.fill();
      }
      // Mid foliage clusters
      g.fillStyle = mid;
      for (const [px, py, pr] of puffs) {
        g.beginPath();
        g.arc(px - 2, py - 4, pr * 0.82, 0, Math.PI * 2);
        g.fill();
      }
      // Sunlit top-left crowns (separate subpaths so no wedge artifact forms)
      g.fillStyle = light;
      for (const [lx, ly, lr] of [
        [54, 34, 14],
        [40, 48, 10.5],
        [76, 46, 9.5],
        [64, 58, 10],
      ]) {
        g.beginPath();
        g.arc(lx, ly, lr, 0, Math.PI * 2);
        g.fill();
      }
    }

    this.treeSprites.set(key, c);
    return c;
  }

  public getBarnSprite(): OffscreenSurface | null {
    if (this.barnSprite) return this.barnSprite;
    const c = makeCanvas(260, 210);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Ground contact shadow
    g.fillStyle = 'rgba(28, 20, 12, 0.25)';
    g.beginPath();
    g.ellipse(122, 192, 104, 14, 0, 0, Math.PI * 2);
    g.fill();

    // Stone windmill silo on right
    g.fillStyle = '#B8A690';
    rrect(g, 186, 62, 54, 126, 8);
    g.fill();
    g.strokeStyle = '#524131';
    g.lineWidth = 2.2;
    g.stroke();
    // Silo stone bricks
    g.fillStyle = '#9F8E78';
    g.fillRect(194, 88, 14, 7);
    g.fillRect(214, 106, 16, 7);
    g.fillRect(192, 126, 18, 7);
    // Silo conical cap
    g.fillStyle = '#7C2D12';
    g.beginPath();
    g.moveTo(178, 66);
    g.lineTo(213, 30);
    g.lineTo(248, 66);
    g.closePath();
    g.fill();
    g.strokeStyle = '#431407';
    g.stroke();

    // Barn Chimney
    g.fillStyle = '#78350F';
    g.fillRect(52, 22, 22, 42);
    g.strokeStyle = '#3E1D0A';
    g.lineWidth = 2;
    g.strokeRect(52, 22, 22, 42);
    g.fillStyle = '#92400E';
    g.fillRect(49, 20, 28, 7);

    // Barn stone plinth
    g.fillStyle = '#8C7B6B';
    rrect(g, 24, 174, 174, 18, 4);
    g.fill();

    // Main Barn Timber Walls with vertical clapboard lines
    g.fillStyle = '#D14B36';
    rrect(g, 26, 82, 170, 96, 6);
    g.fill();
    g.strokeStyle = '#571D12';
    g.lineWidth = 2.4;
    g.stroke();

    g.strokeStyle = 'rgba(90, 26, 14, 0.25)';
    g.lineWidth = 1.5;
    for (let x = 38; x < 190; x += 14) {
      g.beginPath();
      g.moveTo(x, 86);
      g.lineTo(x, 176);
      g.stroke();
    }

    // Cream timber corner beams
    g.fillStyle = '#F5E7CE';
    g.fillRect(26, 84, 10, 92);
    g.fillRect(186, 84, 10, 92);

    // Pitched Shingled Roof with overhang & scalloped eaves
    g.fillStyle = '#9E2A1C';
    g.beginPath();
    g.moveTo(10, 92);
    g.lineTo(111, 16);
    g.lineTo(212, 92);
    g.closePath();
    g.fill();
    g.strokeStyle = '#4A140B';
    g.lineWidth = 2.5;
    g.stroke();

    // Shingle highlight courses
    g.strokeStyle = 'rgba(255, 224, 189, 0.24)';
    g.lineWidth = 1.6;
    for (let row = 1; row <= 4; row++) {
      const t = row / 5;
      const lx = 111 - t * 94;
      const rx = 111 + t * 94;
      const ry = 16 + t * 72;
      g.beginPath();
      g.moveTo(lx, ry);
      g.lineTo(rx, ry);
      g.stroke();
    }

    // Cream Gable Trim & Loft Window
    g.strokeStyle = '#FFF5E1';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(12, 92);
    g.lineTo(111, 18);
    g.lineTo(210, 92);
    g.stroke();

    // Loft circular window with warm glow
    g.fillStyle = '#FDE68A';
    g.beginPath();
    g.arc(111, 56, 13, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#5C3418';
    g.lineWidth = 2.4;
    g.stroke();
    g.beginPath();
    g.moveTo(98, 56);
    g.lineTo(124, 56);
    g.moveTo(111, 43);
    g.lineTo(111, 69);
    g.stroke();

    // Double Wooden Barn Doors with X-bracing
    g.fillStyle = '#7C4724';
    rrect(g, 82, 114, 58, 64, 4);
    g.fill();
    g.strokeStyle = '#FFF3D6';
    g.lineWidth = 2.4;
    g.stroke();
    g.beginPath();
    g.moveTo(111, 114);
    g.lineTo(111, 178);
    g.moveTo(84, 116);
    g.lineTo(110, 176);
    g.moveTo(110, 116);
    g.lineTo(84, 176);
    g.moveTo(112, 116);
    g.lineTo(138, 176);
    g.moveTo(138, 116);
    g.lineTo(112, 176);
    g.stroke();

    // Side warm window + golden hay bale + milk can
    g.fillStyle = '#FEF08A';
    g.fillRect(42, 122, 24, 24);
    g.strokeStyle = '#5C3418';
    g.lineWidth = 2;
    g.strokeRect(42, 122, 24, 24);
    g.beginPath();
    g.moveTo(54, 122);
    g.lineTo(54, 146);
    g.moveTo(42, 134);
    g.lineTo(66, 134);
    g.stroke();

    // Hay bale beside right corner
    g.fillStyle = '#EAB308';
    rrect(g, 152, 158, 32, 22, 4);
    g.fill();
    g.strokeStyle = '#854D0E';
    g.lineWidth = 1.6;
    g.stroke();
    g.strokeStyle = '#A16207';
    g.beginPath();
    g.moveTo(160, 158);
    g.lineTo(160, 180);
    g.moveTo(174, 158);
    g.lineTo(174, 180);
    g.stroke();

    this.barnSprite = c;
    return c;
  }

  public getWellSprite(): OffscreenSurface | null {
    if (this.wellSprite) return this.wellSprite;
    const c = makeCanvas(130, 150);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Shadow
    g.fillStyle = 'rgba(20, 28, 16, 0.24)';
    g.beginPath();
    g.ellipse(65, 130, 48, 16, 0, 0, Math.PI * 2);
    g.fill();

    // Stacked stone well wall (cylinder look)
    g.fillStyle = '#64748B';
    g.beginPath();
    g.ellipse(65, 116, 42, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(23, 86, 84, 30);
    g.fillStyle = '#94A3B8';
    g.beginPath();
    g.ellipse(65, 86, 42, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#334155';
    g.lineWidth = 2.2;
    g.stroke();

    // Stone brick courses on cylinder face
    g.strokeStyle = '#475569';
    g.lineWidth = 1.5;
    for (let x = 34; x <= 96; x += 18) {
      g.beginPath();
      g.moveTo(x, 102);
      g.lineTo(x, 126);
      g.stroke();
    }

    // Deep blue sparkling water inside
    g.fillStyle = '#0284C7';
    g.beginPath();
    g.ellipse(65, 86, 31, 14, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#38BDF8';
    g.beginPath();
    g.ellipse(63, 88, 22, 9, 0, 0, Math.PI * 2);
    g.fill();

    // Timber posts
    g.fillStyle = '#6B4226';
    g.fillRect(28, 38, 8, 50);
    g.fillRect(94, 38, 8, 50);
    g.strokeStyle = '#3E2411';
    g.lineWidth = 1.6;
    g.strokeRect(28, 38, 8, 50);
    g.strokeRect(94, 38, 8, 50);

    // Windlass crossbar & rope + bucket
    g.fillStyle = '#8C5832';
    g.fillRect(26, 52, 78, 7);
    g.strokeStyle = '#F5E7CE';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(65, 59);
    g.lineTo(65, 76);
    g.stroke();
    g.fillStyle = '#92400E';
    rrect(g, 58, 74, 14, 12, 2);
    g.fill();

    // Shingled wooden canopy roof
    g.fillStyle = '#B45309';
    g.beginPath();
    g.moveTo(14, 44);
    g.lineTo(65, 10);
    g.lineTo(116, 44);
    g.closePath();
    g.fill();
    g.strokeStyle = '#451A03';
    g.lineWidth = 2.4;
    g.stroke();
    g.fillStyle = '#D97706';
    g.beginPath();
    g.moveTo(22, 42);
    g.lineTo(65, 14);
    g.lineTo(65, 42);
    g.closePath();
    g.fill();

    this.wellSprite = c;
    return c;
  }

  public getMerchantStallSprite(): OffscreenSurface | null {
    if (this.stallSprite) return this.stallSprite;
    const c = makeCanvas(230, 176);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Ground shadow
    g.fillStyle = 'rgba(24, 18, 12, 0.24)';
    g.beginPath();
    g.ellipse(115, 162, 98, 12, 0, 0, Math.PI * 2);
    g.fill();

    // Wooden posts holding awning
    g.fillStyle = '#5C3A21';
    g.fillRect(24, 40, 10, 114);
    g.fillRect(196, 40, 10, 114);

    // Wooden merchant counter with horizontal plank bevels
    g.fillStyle = '#8B542E';
    rrect(g, 18, 106, 194, 52, 6);
    g.fill();
    g.strokeStyle = '#432512';
    g.lineWidth = 2.2;
    g.stroke();

    // Counter top plank
    g.fillStyle = '#B07243';
    rrect(g, 14, 100, 202, 14, 5);
    g.fill();
    g.strokeStyle = '#432512';
    g.stroke();

    // Produce baskets sitting on counter
    const baskets: [number, string, string][] = [
      [42, '#EF4444', '#FCA5A5'],
      [172, '#FACC15', '#FEF08A'],
    ];
    for (const [bx, fCol, fHi] of baskets) {
      g.fillStyle = '#D9B68C';
      rrect(g, bx, 88, 28, 14, 4);
      g.fill();
      g.strokeStyle = '#7C5230';
      g.lineWidth = 1.4;
      g.stroke();
      const items: [number, number, number][] = [
        [bx + 8, 88, 5],
        [bx + 16, 86, 5.5],
        [bx + 22, 89, 4.5],
      ];
      for (const [fx, fy, fr] of items) {
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

    // Striped scalloped awning roof
    const stripes = 6;
    const aw = 208;
    const sw = aw / stripes;
    for (let i = 0; i < stripes; i++) {
      const sx = 11 + i * sw;
      g.fillStyle = i % 2 === 0 ? '#DC2626' : '#FFFDF5';
      g.beginPath();
      g.moveTo(sx, 14);
      g.lineTo(sx + sw, 14);
      g.lineTo(sx + sw, 52);
      g.arc(sx + sw * 0.5, 52, sw * 0.5, 0, Math.PI);
      g.closePath();
      g.fill();
      g.strokeStyle = '#7C2D12';
      g.lineWidth = 1.5;
      g.stroke();
    }

    // Top beam ridge
    g.fillStyle = '#7C2D12';
    rrect(g, 8, 10, 214, 8, 4);
    g.fill();

    this.stallSprite = c;
    return c;
  }

  public getNoticeBoardSprite(): OffscreenSurface | null {
    if (this.boardSprite) return this.boardSprite;
    const c = makeCanvas(110, 120);
    if (!c) return null;
    const g = c.getContext('2d');
    if (!g) return null;

    // Shadow
    g.fillStyle = 'rgba(20, 28, 14, 0.22)';
    g.beginPath();
    g.ellipse(55, 108, 34, 9, 0, 0, Math.PI * 2);
    g.fill();

    // Posts
    g.fillStyle = '#5C3A21';
    g.fillRect(26, 48, 9, 58);
    g.fillRect(75, 48, 9, 58);

    // Corkboard frame
    g.fillStyle = '#8B542E';
    rrect(g, 14, 24, 82, 56, 6);
    g.fill();
    g.strokeStyle = '#432512';
    g.lineWidth = 2;
    g.stroke();

    // Cork surface
    g.fillStyle = '#DFBC8D';
    rrect(g, 20, 30, 70, 44, 3);
    g.fill();

    // Pinned parchment papers + red wax seal
    g.fillStyle = '#FFFDF8';
    g.fillRect(25, 35, 24, 28);
    g.strokeStyle = '#C7AC82';
    g.lineWidth = 1;
    g.strokeRect(25, 35, 24, 28);

    g.fillStyle = '#DCFCE7';
    g.fillRect(55, 37, 28, 24);
    g.strokeStyle = '#86EFAC';
    g.strokeRect(55, 37, 28, 24);

    // Pins
    g.fillStyle = '#DC2626';
    g.beginPath();
    g.arc(37, 36, 2.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(69, 38, 2.5, 0, Math.PI * 2);
    g.fill();

    // Little shingled roof cap
    g.fillStyle = '#A16207';
    g.beginPath();
    g.moveTo(8, 28);
    g.lineTo(55, 8);
    g.lineTo(102, 28);
    g.closePath();
    g.fill();
    g.strokeStyle = '#451A03';
    g.lineWidth = 2;
    g.stroke();

    this.boardSprite = c;
    return c;
  }
}
