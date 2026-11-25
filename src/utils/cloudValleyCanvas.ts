import {
  CROPS,
  DAY_DURATION_SECONDS,
  getToolAreaOffsets,
  GRID_COLS,
  GRID_ROWS,
  SEASON_META,
  TERRACES,
  type ToolId,
} from './cloudValleyData.ts';
import {
  getSeasonId,
  getTileAuraBonus,
  getTileIndex,
  getTileTerraceId,
  isCropMature,
  isTileInGreenhouse,
  isTileUnlocked,
  type CloudValleyGameState,
  type TileState,
} from './cloudValleyEngine.ts';

export interface IsoViewportMetrics {
  width: number;
  height: number;
  originX: number;
  originY: number;
  tileW: number;
  tileH: number;
}

export interface ActionParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface FloatingPopup {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
}

interface WeatherMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface BgCloud {
  x: number;
  y: number;
  scale: number;
  speed: number;
  alpha: number;
}

function getTerraceElevationOffset(terraceId: number, tileH: number): number {
  // Higher starter terrace (Tầng 1) steps gently downward toward southern/eastern terraces
  if (terraceId === 1) return 0;
  if (terraceId === 2) return tileH * 0.24;
  if (terraceId === 3) return tileH * 0.38;
  return tileH * 0.56;
}

export class CloudValleyCanvasController {
  private weatherPool: WeatherMote[] = [];
  private actionPool: ActionParticle[] = [];
  private popupPool: FloatingPopup[] = [];
  private clouds: BgCloud[] = [];
  private actionCursor = 0;
  private popupCursor = 0;
  private cachedSkyKey = '';
  private cachedSkyGrad: CanvasGradient | null = null;

  constructor() {
    for (let i = 0; i < 52; i++) {
      this.weatherPool.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.05 + Math.random() * 0.14,
        size: 2 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 72; i++) {
      this.actionPool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.6,
        size: 3,
        color: '#FDE68A',
      });
    }
    for (let i = 0; i < 20; i++) {
      this.popupPool.push({
        active: false,
        x: 0,
        y: 0,
        vy: -36,
        life: 0,
        maxLife: 1.15,
        text: '',
        color: '#FFFFFF',
      });
    }
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: Math.random(),
        y: 0.1 + (i % 4) * 0.22 + Math.random() * 0.07,
        scale: 0.72 + (i % 3) * 0.42,
        speed: 0.004 + (i % 3) * 0.003,
        alpha: 0.48 + (i % 3) * 0.16,
      });
    }
  }

  public computeMetrics(width: number, height: number, zoom = 1, panX = 0, panY = 0): IsoViewportMetrics {
    const safeW = Math.max(320, width);
    const safeH = Math.max(260, height);
    const isNarrow = safeW < 640;
    const topReserve = isNarrow ? 136 : safeW < 1080 ? 112 : 98;
    const bottomReserve = 78;
    const availH = Math.max(180, safeH - topReserve - bottomReserve);

    const spanUnits = (GRID_ROWS + GRID_COLS) * 0.5; // 8.5
    const maxWFromWidth = (safeW * 0.91) / (spanUnits + 0.9);
    const maxWFromHeight = Math.max(36, (availH - 42) / 5.3);
    const baseTileW = Math.min(maxWFromWidth, maxWFromHeight);
    const tileW = Math.max(36, Math.min(94, baseTileW * zoom));
    const tileH = tileW * 0.52;

    const originX = safeW * 0.5 + ((GRID_ROWS - GRID_COLS) * tileW) * 0.2 + panX;
    const minOriginY = topReserve + 8 + tileH * 1.55;
    const maxOriginY = safeH - bottomReserve - 42 - spanUnits * tileH;
    const originY = (minOriginY + maxOriginY) * 0.5 + panY;
    return { width: safeW, height: safeH, originX, originY, tileW, tileH };
  }

  public tileToScreen(row: number, col: number, m: IsoViewportMetrics): { x: number; y: number } {
    const x = m.originX + (col - row) * (m.tileW * 0.5);
    const terraceId =
      row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS ? getTileTerraceId(row, col) : 1;
    const elev = getTerraceElevationOffset(terraceId, m.tileH);
    const y = m.originY + (col + row) * (m.tileH * 0.5) + elev;
    return { x, y };
  }

  public screenToTile(px: number, py: number, m: IsoViewportMetrics): { row: number; col: number } | null {
    // Test hit against stepped terrace elevations accurately
    let bestHit: { row: number; col: number; dist: number } | null = null;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const pos = this.tileToScreen(row, col, m);
        const dx = Math.abs(px - pos.x) / (m.tileW * 0.5);
        const dy = Math.abs(py - pos.y) / (m.tileH * 0.5);
        const manhattan = dx + dy;
        if (manhattan <= 1.05) {
          if (!bestHit || manhattan < bestHit.dist) {
            bestHit = { row, col, dist: manhattan };
          }
        }
      }
    }
    return bestHit ? { row: bestHit.row, col: bestHit.col } : null;
  }

  public spawnBurst(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const p = this.actionPool[this.actionCursor];
      this.actionCursor = (this.actionCursor + 1) % this.actionPool.length;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 28 + Math.random() * 54;
      p.active = true;
      p.x = x;
      p.y = y - 6;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed * 0.65 - 26;
      p.life = 0;
      p.maxLife = 0.48 + Math.random() * 0.25;
      p.size = 2.5 + Math.random() * 2.5;
      p.color = color;
    }
  }

  public spawnPopup(x: number, y: number, text: string, color = '#FFFBEB'): void {
    const pop = this.popupPool[this.popupCursor];
    this.popupCursor = (this.popupCursor + 1) % this.popupPool.length;
    pop.active = true;
    pop.x = x;
    pop.y = y - 18;
    pop.vy = -34;
    pop.life = 0;
    pop.maxLife = 1.25;
    pop.text = text;
    pop.color = color;
  }

  public stepEffects(dt: number, state: CloudValleyGameState): void {
    const season = getSeasonId(state);
    for (const c of this.clouds) {
      c.x += c.speed * dt;
      if (c.x > 1.25) c.x = -0.25;
    }
    for (const w of this.weatherPool) {
      const speedMult = state.weather === 'drizzle' ? 2.5 : season === 'winter' ? 0.85 : 0.62;
      w.x += (w.vx + (state.weather === 'drizzle' ? -0.05 : 0.015)) * dt * speedMult;
      w.y += w.vy * dt * speedMult;
      if (w.y > 1.05) {
        w.y = -0.05;
        w.x = Math.random();
      }
      if (w.x < -0.1) w.x = 1.08;
      if (w.x > 1.1) w.x = -0.08;
    }
    for (const p of this.actionPool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
    }
    for (const pop of this.popupPool) {
      if (!pop.active) continue;
      pop.life += dt;
      if (pop.life >= pop.maxLife) {
        pop.active = false;
        continue;
      }
      pop.y += pop.vy * dt;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: IsoViewportMetrics,
    nowSec: number,
    hoverTile: { row: number; col: number } | null,
    activeTool: ToolId
  ): void {
    const season = getSeasonId(state);
    const meta = SEASON_META[season];
    const dayRatio = state.timeInDaySeconds / DAY_DURATION_SECONDS;

    // 1. Cozy Sky Backdrop (cached gradient)
    const duskMix = dayRatio > 0.72 ? Math.min(1, (dayRatio - 0.72) / 0.25) : 0;
    const topColor = duskMix > 0.25 ? '#485A84' : meta.skyTop;
    const botColor = duskMix > 0.25 ? '#F1B38A' : meta.skyBottom;
    const skyKey = `${topColor}_${botColor}_${m.height}`;
    if (this.cachedSkyKey !== skyKey || !this.cachedSkyGrad) {
      const grad = ctx.createLinearGradient(0, 0, 0, m.height);
      grad.addColorStop(0, topColor);
      grad.addColorStop(1, botColor);
      this.cachedSkyGrad = grad;
      this.cachedSkyKey = skyKey;
    }
    ctx.fillStyle = this.cachedSkyGrad;
    ctx.fillRect(0, 0, m.width, m.height);

    // Lightweight Sun Halo
    const sunX = m.width * (0.18 + dayRatio * 0.62);
    const sunY = m.height * (0.16 + Math.sin(dayRatio * Math.PI) * -0.06);
    ctx.fillStyle = 'rgba(255, 224, 150, 0.24)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 248, 214, 0.92)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();

    // 2. Drifting valley clouds
    for (const c of this.clouds) {
      this.drawSoftCloud(ctx, c.x * m.width, c.y * m.height, 66 * c.scale, c.alpha);
    }

    // 3. Floating Island Cliff Skirt & Homestead Props
    this.drawIslandCliffAndProps(ctx, state, m, nowSec, meta);

    // 4. Painter's algorithm isometric tile pass (back to front)
    const hoverOffsets =
      hoverTile && activeTool !== 'build' && activeTool !== 'inspect'
        ? getToolAreaOffsets(state.toolTier)
        : ([[0, 0]] as const);

    const highlightedSet = new Set<string>();
    if (hoverTile) {
      for (const [dr, dc] of hoverOffsets) {
        const hr = hoverTile.row + dr;
        const hc = hoverTile.col + dc;
        if (hr >= 0 && hr < GRID_ROWS && hc >= 0 && hc < GRID_COLS) {
          highlightedSet.add(`${hr},${hc}`);
        }
      }
    }

    for (let sum = 0; sum <= GRID_ROWS + GRID_COLS - 2; sum++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        const col = sum - row;
        if (col < 0 || col >= GRID_COLS) continue;
        const tile = state.tiles[getTileIndex(row, col)];
        if (!tile) continue;
        const { x, y } = this.tileToScreen(row, col, m);
        const unlocked = isTileUnlocked(state, tile);
        const isHighlighted = highlightedSet.has(`${row},${col}`);
        this.drawTile(ctx, state, tile, x, y, m, nowSec, unlocked, isHighlighted);
      }
    }

    // 5. Locked terrace wooden signposts & gentle mist
    for (const t of TERRACES) {
      if (state.unlockedTerraces.includes(t.id)) continue;
      const midRow = (t.rowStart + t.rowEnd) * 0.5;
      const midCol = (t.colStart + t.colEnd) * 0.5;
      const pos = this.tileToScreen(midRow, midCol, m);
      this.drawSoftCloud(ctx, pos.x, pos.y + 6, m.tileW * 0.9, 0.55);
      ctx.save();
      const pillW = Math.min(120, Math.max(88, m.tileW * 1.9));
      const pillH = 24;
      ctx.fillStyle = 'rgba(62, 42, 26, 0.9)';
      this.roundRect(ctx, pos.x - pillW * 0.5, pos.y - pillH * 0.5, pillW, pillH, 7);
      ctx.fill();
      ctx.strokeStyle = '#F6D38C';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#FEF3C7';
      ctx.font = `700 ${m.tileW < 55 ? 9.5 : 11}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Tầng ${t.id} · ${t.costGold}g`, pos.x, pos.y + 3.5);
      ctx.restore();
    }

    // 6. Earth Sprites hopping across unlocked beds
    state.sprites.forEach((sprite, idx) => {
      const targetRow = 1 + ((idx * 2 + Math.floor(nowSec * 0.35)) % 3);
      const targetCol = 1 + ((idx * 3 + Math.floor(nowSec * 0.55)) % 4);
      const frac = (nowSec * 0.65 + idx * 0.37) % 1;
      const nextCol = 1 + ((targetCol + 1) % 4);
      const p1 = this.tileToScreen(targetRow, targetCol, m);
      const p2 = this.tileToScreen(targetRow, nextCol, m);
      const sx = p1.x + (p2.x - p1.x) * frac;
      const sy = p1.y + (p2.y - p1.y) * frac - Math.abs(Math.sin(nowSec * 4.5 + idx)) * 9;
      this.drawEarthSprite(ctx, sx, sy, m.tileW * 0.22, sprite.energy > 5);
    });

    // 7. Weather particles
    this.drawWeatherOverlay(ctx, state, m, nowSec);

    // 8. Action particles & popups
    for (const p of this.actionPool) {
      if (!p.active) continue;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const pop of this.popupPool) {
      if (!pop.active) continue;
      const alpha = Math.max(0, 1 - pop.life / pop.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(30, 22, 16, 0.85)';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }
  }

  private drawSoftCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFFDF9';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2);
    ctx.arc(cx - radius * 0.42, cy + radius * 0.12, radius * 0.36, 0, Math.PI * 2);
    ctx.arc(cx + radius * 0.44, cy + radius * 0.14, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawIslandCliffAndProps(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: IsoViewportMetrics,
    nowSec: number,
    meta: (typeof SEASON_META)['spring']
  ): void {
    // Extended scenic meadow border around grid (-1.05 .. +0.3)
    const rawPos = (r: number, c: number, extraY = 0) => ({
      x: m.originX + (c - r) * (m.tileW * 0.5),
      y: m.originY + (c + r) * (m.tileH * 0.5) + extraY,
    });
    const top = rawPos(-1.15, -0.85);
    const right = rawPos(-1.15, GRID_COLS - 0.15, m.tileH * 0.24);
    const bottom = rawPos(GRID_ROWS - 0.15, GRID_COLS - 0.15, m.tileH * 0.56);
    const left = rawPos(GRID_ROWS - 0.15, -0.85, m.tileH * 0.38);
    const depth = m.tileH * 2.15;

    ctx.save();
    // Cloud shadow
    ctx.fillStyle = 'rgba(42, 65, 92, 0.14)';
    ctx.beginPath();
    ctx.moveTo(left.x, left.y + depth + 16);
    ctx.lineTo(bottom.x, bottom.y + depth + 22);
    ctx.lineTo(right.x, right.y + depth + 16);
    ctx.lineTo(top.x, top.y + depth + 12);
    ctx.closePath();
    ctx.fill();

    // Left sunlit rock cliff
    ctx.fillStyle = meta.cliffTop;
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(bottom.x, bottom.y + depth);
    ctx.lineTo(left.x, left.y + depth * 0.85);
    ctx.closePath();
    ctx.fill();

    // Right shaded rock cliff
    ctx.fillStyle = meta.cliffDeep;
    ctx.beginPath();
    ctx.moveTo(bottom.x, bottom.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(right.x, right.y + depth * 0.85);
    ctx.lineTo(bottom.x, bottom.y + depth);
    ctx.closePath();
    ctx.fill();

    // Grass island apron
    ctx.fillStyle = meta.grassDark;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(right.x, right.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.lineTo(left.x, left.y);
    ctx.closePath();
    ctx.fill();

    // Rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Gentle waterfall off left cliff
    const wfX = (left.x + bottom.x) * 0.45;
    const wfY = (left.y + bottom.y) * 0.45 + m.tileH * 0.18;
    ctx.fillStyle = 'rgba(130, 214, 248, 0.88)';
    ctx.fillRect(wfX - 7, wfY, 14, depth * 0.86);
    const ripple = (nowSec * 24) % 14;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.fillRect(wfX - 4, wfY + 4 + ripple, 3, 9);
    ctx.fillRect(wfX + 2, wfY + 10 + ((ripple + 7) % 14), 3, 9);

    // Scenic pine trees along top-left & forest edge
    const treeSpots = [
      rawPos(-0.75, -0.35),
      rawPos(1.5, -0.68),
      rawPos(4.8, -0.68, m.tileH * 0.35),
      rawPos(6.6, -0.58, m.tileH * 0.38),
    ];
    for (const tp of treeSpots) {
      this.drawPineTree(ctx, tp.x, tp.y, m.tileW * 0.38, getSeasonId(state));
    }

    // Cozy Cottage, Windmill & Pasture cleanly seated inside the upper meadow strip
    const cottagePos = rawPos(-0.62, 1.35);
    this.drawCozyCottage(ctx, cottagePos.x, cottagePos.y, m.tileW * 0.88, state.artisanQueue.length > 0, nowSec);

    const millPos = rawPos(-0.68, 3.6);
    this.drawWindmill(ctx, millPos.x, millPos.y, m.tileW * 0.68, nowSec);

    const pasturePos = rawPos(-0.55, 6.45, m.tileH * 0.22);
    this.drawPasture(ctx, pasturePos.x, pasturePos.y, m.tileW * 0.92, state, nowSec);

    ctx.restore();
  }

  private drawPineTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, season: string): void {
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(x - s * 0.1, y - s * 0.4, s * 0.2, s * 0.45);
    const foliage =
      season === 'autumn' ? '#C96A2E' : season === 'winter' ? '#608B7B' : '#2E6F40';
    ctx.fillStyle = foliage;
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x - s * (0.6 - i * 0.12), y - s * (0.35 + i * 0.42));
      ctx.lineTo(x, y - s * (1.05 + i * 0.45));
      ctx.lineTo(x + s * (0.6 - i * 0.12), y - s * (0.35 + i * 0.42));
      ctx.closePath();
      ctx.fill();
    }
    if (season === 'winter') {
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(x - s * 0.22, y - s * 1.15);
      ctx.lineTo(x, y - s * 1.5);
      ctx.lineTo(x + s * 0.22, y - s * 1.15);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawCozyCottage(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
    cookingActive: boolean,
    nowSec: number
  ): void {
    const w = scale * 1.15;
    const h = scale * 0.78;
    // Chimney smoke
    if (cookingActive || Math.sin(nowSec) > -0.75) {
      for (let i = 0; i < 3; i++) {
        const t = (nowSec * 0.42 + i * 0.33) % 1;
        ctx.fillStyle = `rgba(255, 250, 240, ${0.58 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(x + w * 0.25 + Math.sin(nowSec * 2 + i) * 4, y - h - 10 - t * 24, 3.5 + t * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Cottage wall + foundation
    ctx.fillStyle = '#8C6239';
    ctx.fillRect(x - w * 0.5, y - 4, w, 5);
    ctx.fillStyle = '#F6E3C6';
    ctx.fillRect(x - w * 0.48, y - h * 0.66, w * 0.96, h * 0.64);
    // Warm roof
    ctx.fillStyle = '#C96A42';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.58, y - h * 0.6);
    ctx.lineTo(x, y - h * 1.16);
    ctx.lineTo(x + w * 0.58, y - h * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7C381D';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Door & glowing windows
    ctx.fillStyle = '#734429';
    ctx.fillRect(x - w * 0.1, y - h * 0.38, w * 0.2, h * 0.36);
    ctx.fillStyle = '#FCD34D';
    ctx.fillRect(x - w * 0.34, y - h * 0.42, w * 0.16, h * 0.18);
    ctx.fillRect(x + w * 0.18, y - h * 0.42, w * 0.16, h * 0.18);
  }

  private drawWindmill(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, nowSec: number): void {
    const h = scale * 1.15;
    ctx.fillStyle = '#D9B68C';
    ctx.beginPath();
    ctx.moveTo(x - scale * 0.28, y);
    ctx.lineTo(x - scale * 0.17, y - h);
    ctx.lineTo(x + scale * 0.17, y - h);
    ctx.lineTo(x + scale * 0.28, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8C4D2D';
    ctx.beginPath();
    ctx.arc(x, y - h, scale * 0.2, Math.PI, 0);
    ctx.fill();

    ctx.save();
    ctx.translate(x, y - h * 0.85);
    ctx.rotate(nowSec * 0.95);
    ctx.strokeStyle = '#5B341E';
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -scale * 0.72);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 250, 236, 0.92)';
      ctx.fillRect(2, -scale * 0.68, scale * 0.18, scale * 0.48);
    }
    ctx.restore();
  }

  private drawPasture(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tileW: number,
    state: CloudValleyGameState,
    nowSec: number
  ): void {
    // Cozy meadow fenced pen kept neatly inside the upper-right deck
    ctx.fillStyle = 'rgba(134, 200, 102, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y, tileW * 0.72, tileW * 0.34, 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8E5F3B';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    state.livestock.slice(0, 4).forEach((animal, idx) => {
      const ax = x - tileW * 0.28 + (idx % 2) * tileW * 0.42 + Math.sin(nowSec * 1.1 + idx) * 3;
      const ay = y - 4 + Math.floor(idx / 2) * 11;
      ctx.save();
      if (animal.type === 'cow') {
        ctx.fillStyle = '#FFFDF9';
        ctx.beginPath();
        ctx.ellipse(ax, ay, 9, 5.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4A3426';
        ctx.beginPath();
        ctx.arc(ax - 2.5, ay - 1, 2.2, 0, Math.PI * 2);
        ctx.arc(ax + 6, ay - 1.5, 3.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#F8F5EE';
        ctx.beginPath();
        ctx.arc(ax, ay, 6.8, 0, Math.PI * 2);
        ctx.arc(ax - 3.5, ay + 1, 4.5, 0, Math.PI * 2);
        ctx.arc(ax + 3.5, ay + 1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#53453B';
        ctx.beginPath();
        ctx.arc(ax + 5, ay - 1, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (animal.productReady) {
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(ax, ay - 11 + Math.sin(nowSec * 4) * 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    tile: TileState,
    cx: number,
    cy: number,
    m: IsoViewportMetrics,
    nowSec: number,
    unlocked: boolean,
    highlighted: boolean
  ): void {
    const hw = m.tileW * 0.48;
    const hh = m.tileH * 0.48;
    const season = getSeasonId(state);
    const meta = SEASON_META[season];
    const inGreenhouse = isTileInGreenhouse(state, tile.row, tile.col);

    // Subtle 2.5D tile lip for terraced depth
    const lipH = 4;
    ctx.fillStyle = tile.terraceId % 2 === 1 ? 'rgba(92, 62, 38, 0.25)' : 'rgba(65, 44, 28, 0.28)';
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx + hw, cy + lipH);
    ctx.lineTo(cx, cy + hh + lipH);
    ctx.lineTo(cx - hw, cy + lipH);
    ctx.closePath();
    ctx.fill();

    // Top diamond
    ctx.beginPath();
    ctx.moveTo(cx, cy - hh);
    ctx.lineTo(cx + hw, cy);
    ctx.lineTo(cx, cy + hh);
    ctx.lineTo(cx - hw, cy);
    ctx.closePath();

    if (!unlocked) {
      ctx.fillStyle = 'rgba(222, 232, 242, 0.42)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }

    if (tile.tilled) {
      if (season === 'winter' && !inGreenhouse) {
        ctx.fillStyle = '#C9D9E8';
      } else if (tile.moisture >= 60) {
        ctx.fillStyle = '#5C3A24';
      } else if (tile.moisture >= 20) {
        ctx.fillStyle = '#85583A';
      } else {
        ctx.fillStyle = '#B48862';
      }
    } else {
      ctx.fillStyle = (tile.row + tile.col) % 2 === 0 ? meta.grassLight : meta.grassDark;
    }
    ctx.fill();

    if (tile.tilled) {
      ctx.strokeStyle = tile.fertility <= 10 ? '#D97706' : '#472B19';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - hw * 0.45, cy - hh * 0.25);
      ctx.lineTo(cx + hw * 0.15, cy + hh * 0.35);
      ctx.moveTo(cx - hw * 0.15, cy - hh * 0.42);
      ctx.lineTo(cx + hw * 0.45, cy + hh * 0.18);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    if (getTileAuraBonus(state, tile.row, tile.col) > 0) {
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.38 + Math.sin(nowSec * 3) * 0.16})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (tile.mutagenApplied && !tile.crop) {
      ctx.fillStyle = '#C084FC';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 2 + Math.sin(nowSec * 4) * 2, 2.2, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 2 + Math.cos(nowSec * 4) * 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (inGreenhouse && tile.structure !== 'greenhouse') {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.78)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    if (highlighted) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (tile.structure) {
      this.drawStructure(ctx, tile.structure, cx, cy, m.tileW, nowSec);
    }

    if (tile.hasWeed) {
      this.drawWeed(ctx, cx, cy, m.tileW);
    } else if (tile.wildMushroom) {
      this.drawMushroom(ctx, cx, cy, m.tileW, nowSec);
    } else if (tile.crop) {
      this.drawCrop(ctx, tile, cx, cy, m.tileW, nowSec);
    }
  }

  private drawStructure(
    ctx: CanvasRenderingContext2D,
    id: NonNullable<TileState['structure']>,
    cx: number,
    cy: number,
    tileW: number,
    nowSec: number
  ): void {
    const s = tileW * 0.28;
    ctx.save();
    if (id === 'sprinkler') {
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(cx - 3, cy - s * 1.1, 6, s * 1.1);
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 1.15, 5, 0, Math.PI * 2);
      ctx.fill();
      const ang = nowSec * 3.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 9, cy - s * 1.15 + Math.sin(ang) * 4, 2, 0, Math.PI * 2);
      ctx.arc(cx - Math.cos(ang) * 9, cy - s * 1.15 - Math.sin(ang) * 4, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'scarecrow') {
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - s * 1.8);
      ctx.moveTo(cx - s * 0.7, cy - s * 1.15);
      ctx.lineTo(cx + s * 0.7, cy - s * 1.15);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 1.65, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#92400E';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - s * 1.8);
      ctx.lineTo(cx, cy - s * 2.4);
      ctx.lineTo(cx + 9, cy - s * 1.8);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'conveyor') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - s * 0.9, cy - 4, s * 1.8, 8);
      ctx.fillStyle = '#FACC15';
      const beltX = ((nowSec * 18) % (s * 1.4)) - s * 0.7;
      ctx.fillRect(cx + beltX, cy - 3, 5, 6);
    } else if (id === 'greenhouse') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - s * 1.1, cy);
      ctx.lineTo(cx - s * 1.1, cy - s * 0.9);
      ctx.quadraticCurveTo(cx, cy - s * 1.75, cx + s * 1.1, cy - s * 0.9);
      ctx.lineTo(cx + s * 1.1, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawWeed(ctx: CanvasRenderingContext2D, cx: number, cy: number, tileW: number): void {
    const s = tileW * 0.17;
    ctx.strokeStyle = '#3F6212';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx - s, cy - s * 1.1);
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx, cy - s * 1.4);
    ctx.moveTo(cx, cy + 2);
    ctx.lineTo(cx + s, cy - s * 1.0);
    ctx.stroke();
  }

  private drawMushroom(ctx: CanvasRenderingContext2D, cx: number, cy: number, tileW: number, nowSec: number): void {
    const s = tileW * 0.22;
    const bob = Math.sin(nowSec * 3) * 1.5;
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(cx - 2.5, cy - s * 0.7 + bob, 5, s * 0.75);
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.7 + bob, s * 0.65, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - s * 0.95 + bob, 1.8, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy - s * 0.85 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawCrop(
    ctx: CanvasRenderingContext2D,
    tile: TileState,
    cx: number,
    cy: number,
    tileW: number,
    nowSec: number
  ): void {
    const crop = tile.crop!;
    const def = CROPS[crop.cropId];
    if (!def) return;
    const ratio = Math.min(1, crop.progressSeconds / def.growthSeconds);
    const mature = isCropMature(crop);
    const sway = Math.sin(nowSec * 2.3 + tile.row * 0.7 + tile.col * 0.5) * (mature ? 2.2 : 1.1);
    const bounce = mature ? Math.abs(Math.sin(nowSec * 3.4 + tile.col)) * 2.5 : 0;
    const s = tileW * 0.26;

    ctx.save();
    if (ratio < 0.3) {
      ctx.fillStyle = '#65A30D';
      ctx.beginPath();
      ctx.ellipse(cx - 3 + sway * 0.3, cy - 4, 3.5, 2, -0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + 3 + sway * 0.3, cy - 4, 3.5, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (ratio < 0.75) {
      ctx.fillStyle = '#3F8E3B';
      ctx.beginPath();
      ctx.arc(cx + sway * 0.5, cy - s * 0.6, s * 0.55, 0, Math.PI * 2);
      ctx.arc(cx - s * 0.35 + sway * 0.5, cy - s * 0.35, s * 0.38, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.35 + sway * 0.5, cy - s * 0.35, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const baseY = cy - bounce;
      if (def.id === 'lua_mi' || def.id === 'lua_mach_tim') {
        ctx.strokeStyle = def.colorPrimary;
        ctx.lineWidth = 2.4;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 3.2, baseY);
          ctx.quadraticCurveTo(cx + i * 3.5 + sway, baseY - s * 0.8, cx + i * 4.2 + sway * 1.4, baseY - s * 1.5);
          ctx.stroke();
        }
      } else if (def.id === 'bi_ngo' || def.id === 'bi_khong_lo') {
        const pScale = def.id === 'bi_khong_lo' ? 1.45 : 0.95;
        ctx.fillStyle = def.colorPrimary;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - s * 0.45 * pScale, s * 0.78 * pScale, s * 0.55 * pScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3F6212';
        ctx.fillRect(cx - 2, baseY - s * 1.05 * pScale, 4, 5);
      } else {
        ctx.fillStyle = '#367E34';
        ctx.beginPath();
        ctx.arc(cx + sway * 0.5, baseY - s * 0.65, s * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = def.colorPrimary;
        ctx.beginPath();
        ctx.arc(cx - 4 + sway * 0.6, baseY - s * 0.85, 3.6, 0, Math.PI * 2);
        ctx.arc(cx + 4 + sway * 0.6, baseY - s * 0.55, 3.8, 0, Math.PI * 2);
        ctx.arc(cx + sway * 0.6, baseY - s * 0.35, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (mature) {
        ctx.fillStyle = crop.quality === 'gold' ? '#FDE047' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx + s * 0.65, baseY - s * 1.35, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (tile.hasPest) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(nowSec * 9) * 5, cy - s * 1.1, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile.moisture < 20 && !def.selfHydrating) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx - s * 0.7, cy - s * 1.0, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawEarthSprite(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, active: boolean): void {
    ctx.save();
    ctx.fillStyle = active ? '#86EFAC' : '#94A3B8';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(x + 2, y - r, r * 0.7, r * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(x - 2.5, y - 1, 1.3, 0, Math.PI * 2);
    ctx.arc(x + 2.5, y - 1, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawWeatherOverlay(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: IsoViewportMetrics,
    nowSec: number
  ): void {
    const season = getSeasonId(state);
    ctx.save();
    for (const w of this.weatherPool) {
      const px = w.x * m.width;
      const py = w.y * m.height;
      if (state.weather === 'drizzle') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 3, py + 11);
        ctx.stroke();
      } else if (season === 'spring') {
        ctx.fillStyle = 'rgba(251, 207, 232, 0.75)';
        ctx.beginPath();
        ctx.ellipse(px, py, w.size * 0.9, w.size * 0.45, nowSec + w.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (season === 'autumn') {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.55)';
        ctx.beginPath();
        ctx.ellipse(px, py, w.size, w.size * 0.5, nowSec + w.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (season === 'winter' || state.weather === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(px, py, w.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
        ctx.beginPath();
        ctx.arc(px, py, w.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
