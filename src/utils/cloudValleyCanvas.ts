import {
  CROPS,
  DAY_DURATION_SECONDS,
  getToolAreaOffsets,
  GRID_COLS,
  GRID_ROWS,
  SEASON_META,
  TERRACES,
  type AvatarActionMode,
  type ToolId,
} from './cloudValleyData.ts';
import {
  getSeasonId,
  getTileAuraBonus,
  getTileIndex,
  isCropMature,
  isTileInGreenhouse,
  isTileUnlocked,
  type CloudValleyGameState,
  type TileState,
} from './cloudValleyEngine.ts';
import { CloudValleySpriteAtlas } from './cloudValleySprites.ts';
import {
  FARM_BUILDINGS,
  getAnimalWorldPos,
  tileToWorldBounds,
  WORLD_COLS,
  WORLD_ROWS,
  worldToTile,
  type FarmerAvatarState,
  type InteractTarget,
} from './cloudValleyWorld.ts';

export interface FarmViewportMetrics {
  width: number;
  height: number;
  tilePx: number;
  camX: number; // world X at screen center
  camY: number; // world Y at screen center
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

export class CloudValleyCanvasController {
  private atlas = new CloudValleySpriteAtlas();
  private weatherPool: WeatherMote[] = [];
  private actionPool: ActionParticle[] = [];
  private popupPool: FloatingPopup[] = [];
  private actionCursor = 0;
  private popupCursor = 0;
  private cachedSkyKey = '';
  private cachedSkyGrad: CanvasGradient | null = null;

  constructor() {
    for (let i = 0; i < 42; i++) {
      this.weatherPool.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.04,
        vy: 0.05 + Math.random() * 0.14,
        size: 2 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 64; i++) {
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
        vy: -1.1,
        life: 0,
        maxLife: 1.2,
        text: '',
        color: '#FFFFFF',
      });
    }
  }

  public computeMetrics(
    width: number,
    height: number,
    avatar: Pick<FarmerAvatarState, 'x' | 'y'>,
    zoom = 1
  ): FarmViewportMetrics {
    const safeW = Math.max(320, width);
    const safeH = Math.max(260, height);
    const baseTilePx = safeW < 640 ? 48 : Math.min(62, Math.max(48, Math.min(safeW / 21, safeH / 14.5)));
    const tilePx = Math.max(38, Math.min(80, baseTilePx * zoom));

    const halfViewW = (safeW / tilePx) * 0.5;
    const halfViewH = (safeH / tilePx) * 0.5;

    let camX = avatar.x;
    let camY = avatar.y + 0.35;

    if (halfViewW * 2 >= WORLD_COLS) {
      camX = WORLD_COLS * 0.5;
    } else {
      camX = Math.max(halfViewW, Math.min(WORLD_COLS - halfViewW, camX));
    }

    // Reserve sky headroom behind the top HUD so Barn & Merchant Stall aren't tucked underneath at spawn
    const topHudWorldPad = safeW < 640 ? 2.1 : 1.15;
    const minCamY = halfViewH - topHudWorldPad;
    const maxCamY = WORLD_ROWS - halfViewH + 1.2;
    if (minCamY >= maxCamY) {
      camY = WORLD_ROWS * 0.5;
    } else {
      camY = Math.max(minCamY, Math.min(maxCamY, camY));
    }

    return { width: safeW, height: safeH, tilePx, camX, camY };
  }

  public worldToScreen(wx: number, wy: number, m: FarmViewportMetrics): { x: number; y: number } {
    return {
      x: m.width * 0.5 + (wx - m.camX) * m.tilePx,
      y: m.height * 0.5 + (wy - m.camY) * m.tilePx,
    };
  }

  public screenToWorld(px: number, py: number, m: FarmViewportMetrics): { wx: number; wy: number } {
    return {
      wx: m.camX + (px - m.width * 0.5) / m.tilePx,
      wy: m.camY + (py - m.height * 0.5) / m.tilePx,
    };
  }

  public screenToTile(px: number, py: number, m: FarmViewportMetrics): { row: number; col: number } | null {
    const { wx, wy } = this.screenToWorld(px, py, m);
    return worldToTile(wx, wy);
  }

  public spawnBurstWorld(wx: number, wy: number, color: string, count = 7): void {
    for (let i = 0; i < count; i++) {
      const p = this.actionPool[this.actionCursor];
      this.actionCursor = (this.actionCursor + 1) % this.actionPool.length;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const speed = 0.8 + Math.random() * 1.4;
      p.active = true;
      p.x = wx;
      p.y = wy - 0.15;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed * 0.7 - 0.9;
      p.life = 0;
      p.maxLife = 0.48 + Math.random() * 0.22;
      p.size = 2.6 + Math.random() * 2.2;
      p.color = color;
    }
  }

  public spawnPopupWorld(wx: number, wy: number, text: string, color = '#FFFBEB'): void {
    const pop = this.popupPool[this.popupCursor];
    this.popupCursor = (this.popupCursor + 1) % this.popupPool.length;
    pop.active = true;
    pop.x = wx;
    pop.y = wy - 0.5;
    pop.vy = -1.05;
    pop.life = 0;
    pop.maxLife = 1.25;
    pop.text = text;
    pop.color = color;
  }

  public stepEffects(dt: number, state: CloudValleyGameState): void {
    const season = getSeasonId(state);
    for (const w of this.weatherPool) {
      const speedMult = state.weather === 'drizzle' ? 2.4 : season === 'winter' ? 0.85 : 0.62;
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
      p.vy += 2.6 * dt;
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
    avatar: FarmerAvatarState,
    m: FarmViewportMetrics,
    nowSec: number,
    hoverTile: { row: number; col: number } | null,
    activeMode: AvatarActionMode,
    interactTarget: InteractTarget | null
  ): void {
    const season = getSeasonId(state);
    const meta = SEASON_META[season];
    const dayRatio = state.timeInDaySeconds / DAY_DURATION_SECONDS;

    // 1. Sky / Valley Backdrop
    const duskMix = dayRatio > 0.72 ? Math.min(1, (dayRatio - 0.72) / 0.25) : 0;
    const topColor = duskMix > 0.25 ? '#485A84' : meta.skyTop;
    const botColor = duskMix > 0.25 ? '#E69F74' : meta.grassLight;
    const skyKey = `${topColor}_${botColor}_${m.height}`;
    if (this.cachedSkyKey !== skyKey || !this.cachedSkyGrad) {
      const grad = ctx.createLinearGradient(0, 0, 0, m.height);
      grad.addColorStop(0, topColor);
      grad.addColorStop(0.24, '#CFE8F7');
      grad.addColorStop(0.32, meta.grassLight);
      grad.addColorStop(1, meta.grassDark);
      this.cachedSkyGrad = grad;
      this.cachedSkyKey = skyKey;
    }
    ctx.fillStyle = this.cachedSkyGrad;
    ctx.fillRect(0, 0, m.width, m.height);

    // 2. Textured Meadow, Distant Hills, Cobblestone Plaza & Garden Fences
    this.drawWorldGround(ctx, state, m, meta, season, nowSec);

    // 3. Soil Beds & Crops (72 tiles across 4 fenced TeaMobi garden plots)
    const activeToolForArea: ToolId = activeMode === 'auto' ? 'harvest' : activeMode;
    const hoverOffsets =
      hoverTile && activeToolForArea !== 'build' && activeToolForArea !== 'inspect'
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

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const tile = state.tiles[getTileIndex(row, col)];
        if (!tile) continue;
        const unlocked = isTileUnlocked(state, tile);
        const isHighlighted = highlightedSet.has(`${row},${col}`);
        const isTargetTile =
          interactTarget?.kind === 'tile' && interactTarget.row === row && interactTarget.col === col;
        this.drawSoilTile(ctx, state, tile, m, nowSec, unlocked, isHighlighted, isTargetTile);
      }
    }

    // 4. Locked Zone Wooden Signposts
    for (const t of TERRACES) {
      if (state.unlockedTerraces.includes(t.id)) continue;
      const midRow = (t.rowStart + t.rowEnd) * 0.5;
      const midCol = (t.colStart + t.colEnd) * 0.5;
      const wb = tileToWorldBounds(midRow, midCol);
      const sp = this.worldToScreen(wb.cx, wb.cy, m);
      ctx.save();
      ctx.fillStyle = 'rgba(255, 253, 249, 0.30)';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + 4, m.tilePx * 1.38, m.tilePx * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      const signW = Math.min(126, Math.max(94, m.tilePx * 2.25));
      const signH = 26;
      const signX = Math.min(m.width - signW * 0.5 - 8, Math.max(signW * 0.5 + 8, sp.x));
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect(signX - 4, sp.y + 8, 8, 16);
      ctx.strokeStyle = '#331D0F';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(signX - 4, sp.y + 8, 8, 16);
      ctx.fillStyle = '#4A2E1A';
      this.roundRect(ctx, signX - signW * 0.5, sp.y - signH * 0.5, signW, signH, 6);
      ctx.fill();
      ctx.strokeStyle = '#F6D38C';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#FEF3C7';
      ctx.font = `700 ${m.tilePx < 45 ? 10 : 11.5}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Khu ${t.id} · ${t.costGold}g`, signX, sp.y + 4);
      ctx.restore();
    }

    // 5. Y-Sorted World Props, Buildings, Livestock, Puppy, Sprites, Trees & Farmer Avatar
    const drawList: { sortY: number; draw: () => void }[] = [];

    drawList.push({
      sortY: 3.55,
      draw: () =>
        this.drawBarnAndWindmill(
          ctx,
          state,
          m,
          nowSec,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'barn'
        ),
    });
    drawList.push({
      sortY: 3.55,
      draw: () =>
        this.drawStoneWell(
          ctx,
          m,
          nowSec,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'well'
        ),
    });
    drawList.push({
      sortY: 3.55,
      draw: () =>
        this.drawMerchantStall(
          ctx,
          state,
          m,
          nowSec,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'merchant'
        ),
    });
    drawList.push({
      sortY: 3.55,
      draw: () =>
        this.drawNoticeBoard(
          ctx,
          m,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'board'
        ),
    });

    // Pen picket fences & feed trough
    drawList.push({
      sortY: 5.75,
      draw: () => this.drawPenNorthFence(ctx, m),
    });
    drawList.push({
      sortY: 6.1,
      draw: () => this.drawFeedTrough(ctx, m),
    });
    drawList.push({
      sortY: 10.25,
      draw: () => this.drawPenSouthFence(ctx, m),
    });

    state.livestock.forEach((an, idx) => {
      const pos = getAnimalWorldPos(idx, nowSec);
      const isFocused = interactTarget?.kind === 'animal' && interactTarget.animalId === an.id;
      drawList.push({
        sortY: pos.y,
        draw: () => this.drawLivestockAnimal(ctx, an, pos.x, pos.y, m, nowSec, isFocused),
      });
    });

    // Loyal Farm Puppy
    const pupX = 6.2 + Math.sin(nowSec * 0.7) * 1.1;
    const pupY = 4.65 + Math.cos(nowSec * 1.1) * 0.3;
    drawList.push({
      sortY: pupY,
      draw: () => this.drawPuppy(ctx, pupX, pupY, Math.cos(nowSec * 0.7) >= 0, m, nowSec),
    });

    // Earth Sprites hopping across unlocked beds
    state.sprites.forEach((sprite, idx) => {
      const targetRow = 1 + ((idx * 2 + Math.floor(nowSec * 0.35)) % 3);
      const targetCol = 1 + ((idx * 3 + Math.floor(nowSec * 0.55)) % 4);
      const frac = (nowSec * 0.65 + idx * 0.37) % 1;
      const nextCol = 1 + ((targetCol + 1) % 4);
      const b1 = tileToWorldBounds(targetRow, targetCol);
      const b2 = tileToWorldBounds(targetRow, nextCol);
      const sx = b1.cx + (b2.cx - b1.cx) * frac;
      const sy = b1.cy + (b2.cy - b1.cy) * frac;
      drawList.push({
        sortY: sy,
        draw: () => this.drawEarthSprite(ctx, sx, sy, m, sprite.energy > 5, nowSec, idx),
      });
    });

    // Lush TeaMobi Trees framing the farmstead
    const treeSpecs: [number, number, 'oak' | 'pine'][] = [
      [0.85, 2.3, 'oak'],
      [0.75, 6.4, 'pine'],
      [0.85, 10.6, 'oak'],
      [0.75, 14.6, 'pine'],
      [17.8, 2.5, 'oak'],
      [20.2, 3.2, 'pine'],
      [21.0, 12.2, 'oak'],
      [20.9, 15.1, 'pine'],
      [16.8, 13.7, 'oak'],
      [18.8, 15.0, 'pine'],
    ];
    for (const [tx, ty, variant] of treeSpecs) {
      drawList.push({
        sortY: ty,
        draw: () => this.drawTreeProp(ctx, tx, ty, m, season, variant),
      });
    }

    // Farmer Avatar Character
    drawList.push({
      sortY: avatar.y,
      draw: () => this.drawFarmerAvatar(ctx, state, avatar, m, nowSec),
    });

    drawList.sort((a, b) => a.sortY - b.sortY);
    for (const item of drawList) {
      item.draw();
    }

    // 6. Weather Overlay
    this.drawWeatherOverlay(ctx, state, m, nowSec);

    // 7. World Action Particles & Floating Gold/XP Popups
    for (const p of this.actionPool) {
      if (!p.active) continue;
      const sp = this.worldToScreen(p.x, p.y, m);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const pop of this.popupPool) {
      if (!pop.active) continue;
      const sp = this.worldToScreen(pop.x, pop.y, m);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - pop.life / pop.maxLife);
      ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = 'rgba(30, 22, 16, 0.88)';
      ctx.strokeText(pop.text, sp.x, sp.y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, sp.x, sp.y);
      ctx.restore();
    }
  }

  private drawWorldGround(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
    meta: (typeof SEASON_META)['spring'],
    season: ReturnType<typeof getSeasonId>,
    nowSec: number
  ): void {
    // 1. Sky Horizon + Rolling Hills + Soft Multi-puff Clouds above y=1.55
    const skyBot = this.worldToScreen(0, 1.55, m);
    if (skyBot.y > 0) {
      ctx.fillStyle = meta.skyTop;
      ctx.fillRect(0, 0, m.width, skyBot.y);

      // Rolling distant green hills silhouette
      ctx.fillStyle = season === 'winter' ? '#B9D3E3' : season === 'autumn' ? '#95A45B' : '#7BC062';
      ctx.beginPath();
      ctx.moveTo(0, skyBot.y);
      for (let x = 0; x <= m.width + 60; x += 60) {
        const hy = skyBot.y - 12 - Math.sin(x * 0.012) * 10;
        ctx.lineTo(x, hy);
      }
      ctx.lineTo(m.width, skyBot.y);
      ctx.closePath();
      ctx.fill();

      // Sunlit drifting clouds
      for (let i = 0; i < 5; i++) {
        const cx = ((nowSec * 9 + i * 280) % (m.width + 200)) - 100;
        const cy = Math.max(22, skyBot.y * 0.42 + (i % 2) * 10);
        ctx.fillStyle = 'rgba(255, 253, 249, 0.84)';
        ctx.beginPath();
        ctx.arc(cx, cy, 17, 0, Math.PI * 2);
        ctx.arc(cx - 15, cy + 4, 12, 0, Math.PI * 2);
        ctx.arc(cx + 16, cy + 4, 13, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Textured Lush Meadow Ground across the entire lower viewport
    const meadowTop = Math.max(0, skyBot.y);
    const grassPat = this.atlas.getGrassPattern(ctx, season);
    ctx.fillStyle = grassPat ?? meta.grassLight;
    ctx.fillRect(0, meadowTop, m.width, m.height - meadowTop);

    // Subtle meadow edge hedge / border fence across top yard edge
    const hedgeL = this.worldToScreen(1.2, 1.55, m);
    const hedgeR = this.worldToScreen(20.6, 1.55, m);
    ctx.fillStyle = season === 'winter' ? '#64748B' : '#2C6E31';
    ctx.fillRect(hedgeL.x, hedgeL.y - 6, hedgeR.x - hedgeL.x, 12);

    // 3. Textured Cobblestone Avatar Plaza & Walkways
    const cobblePat = this.atlas.getCobblePattern(ctx);
    const drawCobbleRect = (x1: number, y1: number, x2: number, y2: number) => {
      const a = this.worldToScreen(x1, y1, m);
      const b = this.worldToScreen(x2, y2, m);
      ctx.save();
      // Drop bevel
      ctx.fillStyle = '#8C6E4B';
      this.roundRect(ctx, a.x - 2, a.y - 2, b.x - a.x + 4, b.y - a.y + 5, 10);
      ctx.fill();
      ctx.fillStyle = cobblePat ?? '#E7D7BE';
      this.roundRect(ctx, a.x, a.y, b.x - a.x, b.y - a.y, 8);
      ctx.fill();
      ctx.strokeStyle = '#9C7B53';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    };

    // Main horizontal promenade
    drawCobbleRect(2.1, 3.75, 16.2, 5.75);
    // Vertical center alley between Zone 1/3 and Zone 2/4
    drawCobbleRect(8.2, 5.5, 9.8, 15.5);
    // Horizontal alley between north and south plots
    drawCobbleRect(2.8, 10.15, 14.3, 11.25);
    // Walkway to livestock gate
    drawCobbleRect(14.1, 7.25, 16.2, 8.75);

    // 4. Textured Livestock Pasture Turf
    const penA = this.worldToScreen(16.0, 5.8, m);
    const penB = this.worldToScreen(20.4, 10.2, m);
    const pasturePat = this.atlas.getPasturePattern(ctx, season);
    ctx.fillStyle = pasturePat ?? '#96CC78';
    ctx.fillRect(penA.x, penA.y, penB.x - penA.x, penB.y - penA.y);

    // 5. Wooden Picket Fences around the 4 Garden Beds
    const zoneFrames = [
      { id: 1, x1: 2.88, y1: 5.88, x2: 8.12, y2: 10.12 },
      { id: 2, x1: 9.88, y1: 5.88, x2: 14.12, y2: 10.12 },
      { id: 3, x1: 2.88, y1: 11.28, x2: 8.12, y2: 15.52 },
      { id: 4, x1: 9.88, y1: 11.28, x2: 14.12, y2: 15.52 },
    ];
    for (const zf of zoneFrames) {
      const unlocked = state.unlockedTerraces.includes(zf.id);
      const a = this.worldToScreen(zf.x1, zf.y1, m);
      const b = this.worldToScreen(zf.x2, zf.y2, m);
      ctx.save();
      ctx.strokeStyle = unlocked ? '#6B4226' : 'rgba(148, 163, 184, 0.72)';
      ctx.lineWidth = unlocked ? 3.5 : 2;
      this.roundRect(ctx, a.x, a.y, b.x - a.x, b.y - a.y, 6);
      ctx.stroke();

      if (unlocked) {
        // Inner warm timber rail highlight + fence posts along sides
        ctx.strokeStyle = '#B88352';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        const postStep = Math.max(26, m.tilePx * 0.9);
        ctx.fillStyle = '#5C3418';
        for (let px = a.x; px <= b.x + 1; px += postStep) {
          ctx.fillRect(px - 3, a.y - 6, 6, 10);
          ctx.fillRect(px - 3, b.y - 5, 6, 10);
          ctx.fillStyle = '#B88352';
          ctx.fillRect(px - 2, a.y - 5, 4, 3);
          ctx.fillRect(px - 2, b.y - 4, 4, 3);
          ctx.fillStyle = '#5C3418';
        }
        for (let py = a.y; py <= b.y + 1; py += postStep) {
          ctx.fillRect(a.x - 3, py - 5, 6, 10);
          ctx.fillRect(b.x - 3, py - 5, 6, 10);
        }
      }
      ctx.restore();
    }
  }

  private drawSoilTile(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    tile: TileState,
    m: FarmViewportMetrics,
    nowSec: number,
    unlocked: boolean,
    highlighted: boolean,
    isTargetTile: boolean
  ): void {
    const wb = tileToWorldBounds(tile.row, tile.col);
    const tl = this.worldToScreen(wb.x1, wb.y1, m);
    const center = this.worldToScreen(wb.cx, wb.cy, m);
    const pad = Math.max(1.5, m.tilePx * 0.04);
    const size = m.tilePx - pad * 2;
    const season = getSeasonId(state);
    const inGreenhouse = isTileInGreenhouse(state, tile.row, tile.col);

    ctx.save();
    if (!unlocked) {
      this.roundRect(ctx, tl.x + pad, tl.y + pad, size, size, 6);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.42)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return;
    }

    const bucket: 'wet' | 'normal' | 'dry' | 'frozen' =
      season === 'winter' && !inGreenhouse
        ? 'frozen'
        : tile.moisture >= 60
        ? 'wet'
        : tile.moisture >= 20
        ? 'normal'
        : 'dry';

    const sprite = this.atlas.getSoilTileSprite(tile.tilled, bucket, season, (tile.row + tile.col) % 2 === 0);
    if (sprite) {
      ctx.drawImage(sprite, tl.x + pad, tl.y + pad, size, size);
    }

    if (tile.tilled && tile.fertility <= 10) {
      this.roundRect(ctx, tl.x + pad, tl.y + pad, size, size, 6);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (getTileAuraBonus(state, tile.row, tile.col) > 0) {
      this.roundRect(ctx, tl.x + pad, tl.y + pad, size, size, 6);
      ctx.strokeStyle = `rgba(168, 85, 247, ${0.46 + Math.sin(nowSec * 3) * 0.16})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    if (tile.mutagenApplied && !tile.crop) {
      ctx.fillStyle = '#C084FC';
      ctx.beginPath();
      ctx.arc(center.x - 6, center.y - 4 + Math.sin(nowSec * 4) * 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(center.x + 6, center.y + 3 + Math.cos(nowSec * 4) * 2, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (inGreenhouse && tile.structure !== 'greenhouse') {
      this.roundRect(ctx, tl.x + pad, tl.y + pad, size, size, 6);
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (highlighted) {
      this.roundRect(ctx, tl.x + pad, tl.y + pad, size, size, 6);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    if (tile.structure) {
      this.drawStructure(ctx, tile.structure, center.x, center.y, size, nowSec);
    }

    if (tile.hasWeed) {
      this.drawWeed(ctx, center.x, center.y, size);
    } else if (tile.wildMushroom) {
      this.drawMushroom(ctx, center.x, center.y, size, nowSec);
    } else if (tile.crop) {
      this.drawCrop(ctx, tile, center.x, center.y, size, nowSec);
    }

    // Classic Avatar pulsing corner brackets on active face-target tile
    if (isTargetTile) {
      const b = size * 0.52;
      const len = size * 0.22;
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(center.x - b, center.y - b + len);
      ctx.lineTo(center.x - b, center.y - b);
      ctx.lineTo(center.x - b + len, center.y - b);
      ctx.moveTo(center.x + b - len, center.y - b);
      ctx.lineTo(center.x + b, center.y - b);
      ctx.lineTo(center.x + b, center.y - b + len);
      ctx.moveTo(center.x + b, center.y + b - len);
      ctx.lineTo(center.x + b, center.y + b);
      ctx.lineTo(center.x + b - len, center.y + b);
      ctx.moveTo(center.x - b + len, center.y + b);
      ctx.lineTo(center.x - b, center.y + b);
      ctx.lineTo(center.x - b, center.y + b - len);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawBarnAndWindmill(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const tl = this.worldToScreen(2.15, 0.85, m);
    const br = this.worldToScreen(5.95, 3.68, m);
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const cx = tl.x + w * 0.44;

    ctx.save();
    const sprite = this.atlas.getBarnSprite();
    if (sprite) {
      ctx.drawImage(sprite, tl.x, tl.y, w, h);
    }

    // Spinning windmill sails mounted on silo hub
    const hubX = tl.x + w * (213 / 260);
    const hubY = tl.y + h * (56 / 210);
    const sailLen = w * 0.25;
    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(nowSec * 1.1);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#FFF9E8';
      ctx.strokeStyle = '#5C3418';
      ctx.lineWidth = 1.6;
      ctx.fillRect(2, -sailLen, sailLen * 0.26, sailLen * 0.78);
      ctx.strokeRect(2, -sailLen, sailLen * 0.26, sailLen * 0.78);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -sailLen);
      ctx.stroke();
    }
    ctx.fillStyle = '#7C2D12';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Gentle chimney smoke
    if (state.artisanQueue.length > 0 || Math.sin(nowSec) > -0.8) {
      const chX = tl.x + w * (63 / 260);
      const chY = tl.y + h * (20 / 210);
      for (let i = 0; i < 3; i++) {
        const t = (nowSec * 0.45 + i * 0.33) % 1;
        ctx.fillStyle = `rgba(255, 251, 240, ${0.68 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(chX + Math.sin(nowSec * 2 + i) * 4, chY - t * 24, 3.5 + t * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.6;
      this.roundRect(ctx, tl.x + 6, tl.y + 8, w - 12, h - 14, 10);
      ctx.stroke();
    }

    this.drawWorldPlaque(ctx, cx, br.y + 8, 'Xưởng & Kho', focused);
    ctx.restore();
  }

  private drawStoneWell(
    ctx: CanvasRenderingContext2D,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const c = this.worldToScreen(7.8, 2.95, m);
    const w = m.tilePx * 1.75;
    const h = m.tilePx * 2.0;
    const x = c.x - w * 0.5;
    const y = c.y - h * 0.62;

    ctx.save();
    const sprite = this.atlas.getWellSprite();
    if (sprite) {
      ctx.drawImage(sprite, x, y, w, h);
    }

    // Animated water glint inside well
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.arc(c.x + Math.sin(nowSec * 2.4) * 5, y + h * (86 / 150), 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y - 4, w * 0.46, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.drawWorldPlaque(ctx, c.x, c.y + m.tilePx * 0.58, 'Giếng Nước', focused);
    ctx.restore();
  }

  private drawMerchantStall(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const tl = this.worldToScreen(9.85, 1.1, m);
    const br = this.worldToScreen(13.35, 3.68, m);
    const w = br.x - tl.x;
    const h = br.y - tl.y;
    const cx = (tl.x + br.x) * 0.5;

    ctx.save();
    // Stall sprite (counter + produce baskets + striped awning)
    const sprite = this.atlas.getMerchantStallSprite();
    if (sprite) {
      ctx.drawImage(sprite, tl.x, tl.y, w, h);
    }

    // Draw animated Bác Lái Buôn cleanly behind counter & under awning
    const bob = Math.sin(nowSec * 2.8) * 1.4;
    const faceX = cx;
    const faceY = tl.y + h * (81 / 176) + bob;
    const headR = Math.max(9.5, w * 0.08);
    // Blue merchant tunic + cream apron
    ctx.fillStyle = '#0369A1';
    ctx.beginPath();
    ctx.ellipse(faceX, faceY + headR * 1.35, headR * 1.35, headR * 1.05, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(faceX - headR * 0.55, faceY + headR * 0.65, headR * 1.1, headR * 0.65);

    // Friendly round head + warm hair + TeaMobi merchant cap
    ctx.fillStyle = '#FDE2C4';
    ctx.beginPath();
    ctx.arc(faceX, faceY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4A311D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Brown cap & visor
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.arc(faceX, faceY - headR * 0.2, headR * 1.04, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.strokeStyle = '#451A03';
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(faceX, faceY - headR * 0.22, headR * 1.18, headR * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy eyes with catchlights
    for (const side of [-1, 1]) {
      const ex = faceX + side * headR * 0.36;
      const ey = faceY + headR * 0.06;
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 0.7, ey - 0.8, 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy cheeks + friendly mustache & smile
    ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(faceX + side * headR * 0.58, faceY + headR * 0.34, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5C3A21';
    ctx.beginPath();
    ctx.ellipse(faceX - 2.6, faceY + headR * 0.34, 2.8, 1.4, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(faceX + 2.6, faceY + headR * 0.34, 2.8, 1.4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9A3412';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(faceX, faceY + headR * 0.48, 2.6, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // Ready order alert badge
    const readyOrders = state.orders.filter((o) => (state.inventory[o.itemId] ?? 0) >= o.qty).length;
    if (readyOrders > 0) {
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(br.x - 10, tl.y + 10 + Math.sin(nowSec * 5) * 2, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', br.x - 10, tl.y + 14 + Math.sin(nowSec * 5) * 2);
    }

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.6;
      this.roundRect(ctx, tl.x + 6, tl.y + 6, w - 12, h - 10, 10);
      ctx.stroke();
    }

    this.drawWorldPlaque(ctx, cx, br.y + 8, 'Lái Buôn & Chợ', focused);
    ctx.restore();
  }

  private drawNoticeBoard(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics, focused: boolean): void {
    const c = this.worldToScreen(15.0, 2.95, m);
    const w = m.tilePx * 1.48;
    const h = m.tilePx * 1.62;
    const x = c.x - w * 0.5;
    const y = c.y - h * 0.58;

    ctx.save();
    const sprite = this.atlas.getNoticeBoardSprite();
    if (sprite) {
      ctx.drawImage(sprite, x, y, w, h);
    }
    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.4;
      this.roundRect(ctx, x + 4, y + 6, w - 8, h - 12, 8);
      ctx.stroke();
    }
    this.drawWorldPlaque(ctx, c.x, c.y + m.tilePx * 0.58, 'Sổ Tay', focused);
    ctx.restore();
  }

  private drawFeedTrough(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics): void {
    const sp = this.worldToScreen(18.2, 6.22, m);
    const tw = m.tilePx * 1.3;
    const th = m.tilePx * 0.42;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    this.roundRect(ctx, sp.x - tw * 0.5, sp.y + 3, tw, th, 4);
    ctx.fill();
    ctx.fillStyle = '#7C4A28';
    this.roundRect(ctx, sp.x - tw * 0.5, sp.y, tw, th, 4);
    ctx.fill();
    ctx.strokeStyle = '#432512';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    this.roundRect(ctx, sp.x - tw * 0.42, sp.y + 3, tw * 0.84, th * 0.55, 3);
    ctx.fill();
    ctx.restore();
  }

  private drawPenNorthFence(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics): void {
    const a = this.worldToScreen(15.85, 5.75, m);
    const b = this.worldToScreen(20.5, 10.2, m);
    const gateTop = this.worldToScreen(15.9, 7.1, m);
    ctx.save();
    ctx.strokeStyle = '#5C3418';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(a.x, gateTop.y);
    ctx.stroke();
    ctx.strokeStyle = '#B88352';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fence posts
    const step = Math.max(26, m.tilePx * 0.9);
    ctx.fillStyle = '#5C3418';
    for (let px = a.x; px <= b.x + 1; px += step) {
      ctx.fillRect(px - 3.5, a.y - 7, 7, 12);
    }
    for (let py = a.y; py <= b.y + 1; py += step) {
      ctx.fillRect(b.x - 3.5, py - 6, 7, 12);
    }
    ctx.restore();
  }

  private drawPenSouthFence(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics): void {
    const a = this.worldToScreen(15.85, 10.2, m);
    const b = this.worldToScreen(20.5, 10.2, m);
    const gateBot = this.worldToScreen(15.9, 8.9, m);
    ctx.save();
    ctx.strokeStyle = '#5C3418';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(a.x, gateBot.y);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.strokeStyle = '#B88352';
    ctx.lineWidth = 2;
    ctx.stroke();

    const step = Math.max(26, m.tilePx * 0.9);
    ctx.fillStyle = '#5C3418';
    for (let px = a.x; px <= b.x + 1; px += step) {
      ctx.fillRect(px - 3.5, a.y - 7, 7, 12);
    }
    this.drawWorldPlaque(ctx, (a.x + b.x) * 0.5, a.y + 16, 'Chuồng Trại', false);
    ctx.restore();
  }

  private drawLivestockAnimal(
    ctx: CanvasRenderingContext2D,
    an: CloudValleyGameState['livestock'][number],
    wx: number,
    wy: number,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const sp = this.worldToScreen(wx, wy, m);
    const s = m.tilePx * 0.36;
    ctx.save();
    // Contact shadow
    ctx.fillStyle = 'rgba(18, 28, 12, 0.22)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + s * 0.48, s * 0.78, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, s * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (an.type === 'chicken') {
      const peck = Math.sin(nowSec * 3.5) * 1.5;
      // Feathered tail
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(sp.x - s * 0.45, sp.y - s * 0.1);
      ctx.lineTo(sp.x - s * 0.85, sp.y - s * 0.45);
      ctx.lineTo(sp.x - s * 0.6, sp.y + s * 0.1);
      ctx.closePath();
      ctx.fill();
      // Body
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + peck * 0.3, s * 0.58, s * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Wing
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(sp.x - s * 0.08, sp.y + s * 0.08 + peck * 0.3, s * 0.3, s * 0.18, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // Red comb & wattle
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.22, sp.y - s * 0.46 + peck, s * 0.18, 0, Math.PI * 2);
      ctx.arc(sp.x + s * 0.38, sp.y - s * 0.4 + peck, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
      // Eye & beak
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.34, sp.y - s * 0.14 + peck, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(sp.x + s * 0.52, sp.y - s * 0.12 + peck);
      ctx.lineTo(sp.x + s * 0.84, sp.y + peck);
      ctx.lineTo(sp.x + s * 0.52, sp.y + s * 0.12 + peck);
      ctx.closePath();
      ctx.fill();
    } else if (an.type === 'cow') {
      // Shaded legs
      ctx.fillStyle = '#4A3426';
      ctx.fillRect(sp.x - s * 0.52, sp.y + s * 0.25, 4, s * 0.38);
      ctx.fillRect(sp.x - s * 0.18, sp.y + s * 0.28, 4, s * 0.35);
      ctx.fillRect(sp.x + s * 0.24, sp.y + s * 0.25, 4, s * 0.38);
      // Rounded body
      ctx.fillStyle = '#FFFDF9';
      ctx.beginPath();
      ctx.ellipse(sp.x - s * 0.08, sp.y, s * 0.82, s * 0.54, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3B281B';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      // Patches
      ctx.fillStyle = '#432D1F';
      ctx.beginPath();
      ctx.arc(sp.x - s * 0.34, sp.y - s * 0.12, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.06, sp.y + s * 0.14, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Gold bell collar
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.45, sp.y + s * 0.15, 3.2, 0, Math.PI * 2);
      ctx.fill();
      // Head + ears + horns + pink snout
      const hx = sp.x + s * 0.62;
      const hy = sp.y - s * 0.18;
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(hx - s * 0.18, hy - s * 0.3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + s * 0.18, hy - s * 0.3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFDF9';
      ctx.beginPath();
      ctx.arc(hx, hy, s * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3B281B';
      ctx.stroke();
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.ellipse(hx, hy + s * 0.16, s * 0.28, s * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(hx - s * 0.13, hy - s * 0.06, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + s * 0.13, hy - s * 0.06, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Fluffy Cloud Sheep
      ctx.fillStyle = '#475569';
      ctx.fillRect(sp.x - s * 0.35, sp.y + s * 0.25, 3.5, s * 0.32);
      ctx.fillRect(sp.x + s * 0.2, sp.y + s * 0.25, 3.5, s * 0.32);
      const puffs: [number, number, number][] = [
        [sp.x, sp.y, s * 0.6],
        [sp.x - s * 0.34, sp.y + s * 0.06, s * 0.42],
        [sp.x + s * 0.3, sp.y + s * 0.06, s * 0.42],
      ];
      ctx.fillStyle = '#78716C';
      for (const [wx2, wy2, wr] of puffs) {
        ctx.beginPath();
        ctx.arc(wx2, wy2, wr + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#F8F5EE';
      for (const [wx2, wy2, wr] of puffs) {
        ctx.beginPath();
        ctx.arc(wx2, wy2, wr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#53453B';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.5, sp.y - s * 0.08, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.56, sp.y - s * 0.12, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (an.productReady) {
      const bob = Math.sin(nowSec * 4.5) * 2.5;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y - s * 1.15 + bob, 6.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else if (!an.fedToday) {
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y - s * 1.1, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPuppy(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    facingRight: boolean,
    m: FarmViewportMetrics,
    nowSec: number
  ): void {
    const sp = this.worldToScreen(wx, wy, m);
    const dir = facingRight ? 1 : -1;
    const hop = Math.abs(Math.sin(nowSec * 6)) * 2.5;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + 6, 10, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(sp.x - dir * 7, sp.y - 1 - hop);
    ctx.lineTo(sp.x - dir * 13, sp.y - 7 - hop + Math.sin(nowSec * 14) * 3.5);
    ctx.stroke();

    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y - hop, 9, 5.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5C3418';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.fillRect(sp.x + dir * 2, sp.y - 4.5 - hop, 3.2, 5.5);

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sp.x + dir * 7.8, sp.y - 4.8 - hop, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(sp.x + dir * 10, sp.y - 6 - hop, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + dir * 12.8, sp.y - 3.6 - hop, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(sp.x + dir * 5.2, sp.y - 4.2 - hop, 2.4, 4.4, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Classic TeaMobi Avatar Chibi Character: crisp 1.5px dark silhouette outline,
   * shaded overalls, expressive large glossy eyes with white catchlights,
   * styled hair bangs, customizable hat & active tool swing!
   */
  private drawFarmerAvatar(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    avatar: FarmerAvatarState,
    m: FarmViewportMetrics,
    nowSec: number
  ): void {
    const sp = this.worldToScreen(avatar.x, avatar.y, m);
    const s = m.tilePx * 0.48;
    const isMoving = Math.hypot(avatar.vx, avatar.vy) > 0.2;
    const stride = isMoving ? Math.sin(avatar.walkPhase) : 0;
    const bob = isMoving ? Math.abs(Math.cos(avatar.walkPhase)) * 3 : Math.sin(nowSec * 2.2) * 1.1;

    ctx.save();
    // 1. Soft ground shadow
    ctx.fillStyle = 'rgba(18, 22, 12, 0.28)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + s * 0.42, s * 0.56, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stepping shoes & pant legs
    ctx.fillStyle = '#3E2716';
    ctx.strokeStyle = '#1C1109';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(sp.x - s * 0.19 + stride * 3.5, sp.y + s * 0.35, s * 0.17, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(sp.x + s * 0.19 - stride * 3.5, sp.y + s * 0.35, s * 0.17, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const yBody = sp.y - bob;
    const shirtColor = state.farmerProfile?.shirtColor ?? '#2E7D32';

    // 3. Swinging Arms
    ctx.fillStyle = shirtColor;
    ctx.strokeStyle = '#2C1D11';
    ctx.lineWidth = 1.5;
    // Left arm
    ctx.beginPath();
    ctx.ellipse(sp.x - s * 0.42, yBody + stride * 2.5, s * 0.12, s * 0.24, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.ellipse(sp.x + s * 0.42, yBody - stride * 2.5, s * 0.12, s * 0.24, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Hands
    ctx.fillStyle = '#FDE2C4';
    ctx.beginPath();
    ctx.arc(sp.x - s * 0.44, yBody + s * 0.18 + stride * 2.5, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + s * 0.44, yBody + s * 0.18 - stride * 2.5, s * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // 4. Shaded Shirt + Denim Overalls
    ctx.fillStyle = shirtColor;
    this.roundRect(ctx, sp.x - s * 0.35, yBody - s * 0.28, s * 0.7, s * 0.56, 7);
    ctx.fill();
    ctx.strokeStyle = '#2C1D11';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Blue denim overalls bib & straps
    ctx.fillStyle = '#2563EB';
    this.roundRect(ctx, sp.x - s * 0.28, yBody - s * 0.04, s * 0.56, s * 0.32, 4);
    ctx.fill();
    ctx.fillRect(sp.x - s * 0.24, yBody - s * 0.26, s * 0.11, s * 0.24);
    ctx.fillRect(sp.x + s * 0.13, yBody - s * 0.26, s * 0.11, s * 0.24);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(sp.x - s * 0.185, yBody - s * 0.02, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + s * 0.185, yBody - s * 0.02, 1.7, 0, Math.PI * 2);
    ctx.fill();

    // 5. Big TeaMobi Chibi Head
    const headY = yBody - s * 0.66;
    ctx.fillStyle = '#FDE2C4';
    ctx.beginPath();
    ctx.arc(sp.x, headY, s * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2C1D11';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Ears
    ctx.fillStyle = '#FBD5AC';
    ctx.beginPath();
    ctx.arc(sp.x - s * 0.45, headY + s * 0.04, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + s * 0.45, headY + s * 0.04, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    if (avatar.facing !== 'up') {
      const lookX = avatar.facing === 'left' ? -s * 0.14 : avatar.facing === 'right' ? s * 0.14 : 0;
      // Hair Bangs framing forehead
      ctx.fillStyle = '#4A2E1A';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.04, s * 0.46, Math.PI * 1.06, Math.PI * 1.94);
      ctx.lineTo(sp.x + s * 0.2, headY - s * 0.14);
      ctx.lineTo(sp.x, headY - s * 0.08);
      ctx.lineTo(sp.x - s * 0.2, headY - s * 0.14);
      ctx.closePath();
      ctx.fill();

      // Big Expressive TeaMobi Glossy Eyes with Catchlights
      const blink = Math.sin(nowSec * 1.4) > 0.96;
      const eyeY = headY + s * 0.04;
      if (blink) {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sp.x - s * 0.22 + lookX, eyeY);
        ctx.lineTo(sp.x - s * 0.08 + lookX, eyeY);
        ctx.moveTo(sp.x + s * 0.08 + lookX, eyeY);
        ctx.lineTo(sp.x + s * 0.22 + lookX, eyeY);
        ctx.stroke();
      } else {
        for (const side of [-1, 1]) {
          const ex = sp.x + side * s * 0.16 + lookX;
          ctx.fillStyle = '#1E1B18';
          ctx.beginPath();
          ctx.ellipse(ex, eyeY, s * 0.095, s * 0.125, 0, 0, Math.PI * 2);
          ctx.fill();
          // Warm amber/slate lower iris tint
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(ex, eyeY + s * 0.03, s * 0.06, 0, Math.PI * 2);
          ctx.fill();
          // Bright specular anime catchlight dot
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(ex - s * 0.03, eyeY - s * 0.04, s * 0.038, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rosy cheeks & gentle smile
      ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
      ctx.beginPath();
      ctx.ellipse(sp.x - s * 0.26 + lookX, headY + s * 0.18, s * 0.09, s * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sp.x + s * 0.26 + lookX, headY + s * 0.18, s * 0.09, s * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#9A3412';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sp.x + lookX, headY + s * 0.22, s * 0.08, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      // Back of head hair
      ctx.fillStyle = '#4A2E1A';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.02, s * 0.46, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
    }

    // 6. Detailed Customizable Hat
    const hat = state.farmerProfile?.hat ?? 'straw';
    if (hat === 'straw') {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(sp.x, headY - s * 0.34, s * 0.72, s * 0.21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.4, s * 0.38, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(sp.x - s * 0.37, headY - s * 0.44, s * 0.74, s * 0.09);
    } else if (hat === 'bandana') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.14, s * 0.48, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Trailing scarf tails
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(sp.x + s * 0.44, headY - s * 0.22);
      ctx.lineTo(sp.x + s * 0.65, headY - s * 0.08);
      ctx.lineTo(sp.x + s * 0.46, headY - s * 0.06);
      ctx.closePath();
      ctx.fill();
    } else {
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#FFFDF9';
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(sp.x + side * s * 0.2, headY - s * 0.66, s * 0.13, s * 0.34, side * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FBCFE8';
        ctx.beginPath();
        ctx.ellipse(sp.x + side * s * 0.2, headY - s * 0.65, s * 0.06, s * 0.22, side * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 7. Active Tool Swing Visual
    if (avatar.actionTimer > 0) {
      const swing = Math.sin((1 - avatar.actionTimer / 0.28) * Math.PI);
      const dirX = avatar.facing === 'left' ? -1 : avatar.facing === 'right' ? 1 : 0.6;
      const tipX = sp.x + dirX * (s * 0.86 + swing * 9);
      const tipY = yBody + swing * 10 - s * 0.24;
      ctx.strokeStyle = '#6B4226';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(sp.x + dirX * s * 0.25, yBody - s * 0.08);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.fillStyle = avatar.actionTool === 'water' ? '#38BDF8' : avatar.actionTool === 'hoe' ? '#94A3B8' : '#FACC15';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 8. Farmer Name Tag cleanly below boots
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const farmerName = state.farmerProfile?.name || 'Nông Dân Mây';
    const nw = Math.min(130, ctx.measureText(farmerName).width + 12);
    const ny = sp.y + s * 0.58;
    ctx.fillStyle = 'rgba(28, 20, 14, 0.76)';
    this.roundRect(ctx, sp.x - nw * 0.5, ny, nw, 15, 5);
    ctx.fill();
    ctx.fillStyle = '#FEF9C3';
    ctx.fillText(farmerName, sp.x, ny + 11, nw - 8);

    // 9. Avatar Chat Speech Bubble
    if (avatar.speechText && avatar.speechTimer > 0) {
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      const tw = Math.min(205, ctx.measureText(avatar.speechText).width + 18);
      const bx = sp.x - tw * 0.5;
      const by = headY - s * 1.38;
      ctx.fillStyle = 'rgba(255, 253, 248, 0.97)';
      this.roundRect(ctx, bx, by, tw, 22, 8);
      ctx.fill();
      ctx.strokeStyle = '#7C5230';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#2D1E12';
      ctx.fillText(avatar.speechText, sp.x, by + 14.5, tw - 10);
    }

    ctx.restore();
  }

  private drawTreeProp(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    m: FarmViewportMetrics,
    season: ReturnType<typeof getSeasonId>,
    variant: 'oak' | 'pine'
  ): void {
    const sp = this.worldToScreen(wx, wy, m);
    const sprite = this.atlas.getTreeSprite(variant, season);
    const w = m.tilePx * 2.1;
    const h = m.tilePx * 2.55;
    if (sprite) {
      ctx.drawImage(sprite, sp.x - w * 0.5, sp.y - h * 0.88, w, h);
    }
  }

  private drawStructure(
    ctx: CanvasRenderingContext2D,
    id: NonNullable<TileState['structure']>,
    cx: number,
    cy: number,
    size: number,
    nowSec: number
  ): void {
    const s = size * 0.34;
    ctx.save();
    if (id === 'sprinkler') {
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 3, cy - s * 0.85, 6, s * 0.9);
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.9, 5, 0, Math.PI * 2);
      ctx.fill();
      const ang = nowSec * 3.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 9, cy - s * 0.9 + Math.sin(ang) * 4.5, 2.2, 0, Math.PI * 2);
      ctx.arc(cx - Math.cos(ang) * 9, cy - s * 0.9 - Math.sin(ang) * 4.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'scarecrow') {
      ctx.strokeStyle = '#6B4226';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 5);
      ctx.lineTo(cx, cy - s * 1.45);
      ctx.moveTo(cx - s * 0.7, cy - s * 0.9);
      ctx.lineTo(cx + s * 0.7, cy - s * 0.9);
      ctx.stroke();
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 1.32, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 1.56, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'conveyor') {
      ctx.fillStyle = '#334155';
      this.roundRect(ctx, cx - s * 0.95, cy - 5, s * 1.9, 10, 3);
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      const beltX = ((nowSec * 18) % (s * 1.4)) - s * 0.7;
      ctx.fillRect(cx + beltX, cy - 3.5, 5, 7);
    } else if (id === 'greenhouse') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.5)';
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 1.15, cy + 4);
      ctx.lineTo(cx - s * 1.15, cy - s * 0.78);
      ctx.quadraticCurveTo(cx, cy - s * 1.55, cx + s * 1.15, cy - s * 0.78);
      ctx.lineTo(cx + s * 1.15, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawWeed(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
    const s = size * 0.24;
    ctx.save();
    // Leafy weed tuft
    ctx.fillStyle = '#4D7C0F';
    ctx.strokeStyle = '#2A4309';
    ctx.lineWidth = 1.2;
    for (const ang of [-0.55, 0, 0.55]) {
      ctx.beginPath();
      ctx.ellipse(cx + Math.sin(ang) * s * 0.6, cy - s * 0.35, s * 0.32, s * 0.72, ang, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.95, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawMushroom(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, nowSec: number): void {
    const s = size * 0.28;
    const bob = Math.sin(nowSec * 3) * 1.5;
    ctx.save();
    ctx.fillStyle = '#F5E6D3';
    ctx.fillRect(cx - 3, cy - s * 0.55 + bob, 6, s * 0.75);
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.55 + bob, s * 0.72, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(cx - 3, cy - s * 0.8 + bob, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy - s * 0.72 + bob, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawCrop(
    ctx: CanvasRenderingContext2D,
    tile: TileState,
    cx: number,
    cy: number,
    size: number,
    nowSec: number
  ): void {
    const crop = tile.crop!;
    const def = CROPS[crop.cropId];
    if (!def) return;
    const ratio = Math.min(1, crop.progressSeconds / def.growthSeconds);
    const mature = isCropMature(crop);
    const sway = Math.sin(nowSec * 2.4 + tile.row * 0.7 + tile.col * 0.5) * (mature ? 2.2 : 1.0);
    const bounce = mature ? Math.abs(Math.sin(nowSec * 3.4 + tile.col)) * 2.4 : 0;
    const s = size * 0.36;

    ctx.save();
    // Contact shadow on tilled bed
    ctx.fillStyle = 'rgba(22, 14, 6, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.42, s * 0.65, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    if (ratio < 0.3) {
      // Young sprout pair
      ctx.fillStyle = '#65A30D';
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx - 4 + sway * 0.3, cy, 4.5, 2.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 4 + sway * 0.3, cy, 4.5, 2.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (ratio < 0.75) {
      // Leafy growing bush with highlighted top crown
      ctx.fillStyle = '#2E7D32';
      ctx.beginPath();
      ctx.arc(cx + sway * 0.4, cy - s * 0.25, s * 0.58, 0, Math.PI * 2);
      ctx.arc(cx - s * 0.36 + sway * 0.4, cy - s * 0.05, s * 0.4, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.36 + sway * 0.4, cy - s * 0.05, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.arc(cx - s * 0.1 + sway * 0.4, cy - s * 0.38, s * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const baseY = cy + s * 0.36 - bounce;
      if (def.id === 'lua_mi' || def.id === 'lua_mach_tim') {
        const earCol = def.id === 'lua_mach_tim' ? '#A855F7' : '#FACC15';
        ctx.strokeStyle = '#65A30D';
        ctx.lineWidth = 2.2;
        for (let i = -2; i <= 2; i++) {
          const tx = cx + i * 4.2 + sway * 1.3;
          const ty = baseY - s * 1.45;
          ctx.beginPath();
          ctx.moveTo(cx + i * 3.2, baseY);
          ctx.quadraticCurveTo(cx + i * 3.6 + sway, baseY - s * 0.75, tx, ty);
          ctx.stroke();
          ctx.fillStyle = earCol;
          ctx.beginPath();
          ctx.ellipse(tx, ty, 2.5, 5, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (def.id === 'bi_ngo' || def.id === 'bi_khong_lo') {
        const pScale = def.id === 'bi_khong_lo' ? 1.32 : 0.96;
        ctx.fillStyle = '#EA580C';
        ctx.strokeStyle = '#7C2D12';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(cx, baseY - s * 0.42 * pScale, s * 0.8 * pScale, s * 0.56 * pScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FB923C';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - s * 0.45 * pScale, s * 0.36 * pScale, s * 0.52 * pScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3F6212';
        ctx.fillRect(cx - 2.5, baseY - s * 1.0 * pScale, 5, 6);
      } else if (def.id === 'hoa_hong' || def.id === 'hoa_oai_huong') {
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.arc(cx + sway * 0.4, baseY - s * 0.4, s * 0.56, 0, Math.PI * 2);
        ctx.fill();
        const petalCol = def.id === 'hoa_hong' ? '#E11D48' : '#8B5CF6';
        const centerCol = def.id === 'hoa_hong' ? '#FDA4AF' : '#DDD6FE';
        for (const [ox, oy] of [
          [-5, -s * 0.75],
          [5, -s * 0.55],
          [0, -s * 0.3],
        ]) {
          ctx.fillStyle = petalCol;
          ctx.beginPath();
          ctx.arc(cx + ox + sway * 0.6, baseY + oy, 4.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = centerCol;
          ctx.beginPath();
          ctx.arc(cx + ox - 1 + sway * 0.6, baseY + oy - 1, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Bushy staked vine with shaded glossy fruits (Tomato, Fire Tomato, Starfruit, Chili, Strawberry, Grape)
        ctx.fillStyle = '#1E6B2D';
        ctx.beginPath();
        ctx.arc(cx + sway * 0.45, baseY - s * 0.5, s * 0.66, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2E9141';
        ctx.beginPath();
        ctx.arc(cx - 2 + sway * 0.5, baseY - s * 0.65, s * 0.46, 0, Math.PI * 2);
        ctx.fill();

        const fruits: [number, number][] = [
          [-5.5, -s * 0.78],
          [5.5, -s * 0.5],
          [-0.5, -s * 0.28],
        ];
        for (const [fx, fy] of fruits) {
          ctx.fillStyle = def.colorPrimary;
          ctx.beginPath();
          ctx.arc(cx + fx + sway * 0.6, baseY + fy, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
          // Glossy fruit highlight dot
          ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
          ctx.beginPath();
          ctx.arc(cx + fx - 1.3 + sway * 0.6, baseY + fy - 1.3, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (mature) {
        // Harvest-ready shimmering star badge
        ctx.fillStyle = crop.quality === 'gold' ? '#FDE047' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx + s * 0.65, baseY - s * 1.22, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (tile.hasPest) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(nowSec * 9) * 5, cy - s * 0.75, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (tile.moisture < 20 && !def.selfHydrating) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx - s * 0.65, cy - s * 0.65, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawEarthSprite(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    m: FarmViewportMetrics,
    active: boolean,
    nowSec: number,
    idx: number
  ): void {
    const sp = this.worldToScreen(wx, wy, m);
    const hop = Math.abs(Math.sin(nowSec * 4.5 + idx)) * 6;
    const r = m.tilePx * 0.2;
    ctx.save();
    ctx.fillStyle = active ? '#86EFAC' : '#94A3B8';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y - hop, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(sp.x + 2, sp.y - r - hop, r * 0.75, r * 0.38, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(sp.x - 2.6, sp.y - 1 - hop, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + 2.6, sp.y - 1 - hop, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawWorldPlaque(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    text: string,
    focused: boolean
  ): void {
    ctx.save();
    ctx.font = '700 10.5px "Plus Jakarta Sans", sans-serif';
    const pw = ctx.measureText(text).width + 14;
    ctx.fillStyle = focused ? '#166534' : 'rgba(54, 34, 20, 0.9)';
    this.roundRect(ctx, cx - pw * 0.5, cy - 9, pw, 18, 5);
    ctx.fill();
    ctx.strokeStyle = focused ? '#FEF08A' : '#E5C691';
    ctx.lineWidth = focused ? 1.8 : 1.1;
    ctx.stroke();
    ctx.fillStyle = '#FFFDF9';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx, cy + 3.5);
    ctx.restore();
  }

  private drawWeatherOverlay(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
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
        ctx.fillStyle = 'rgba(251, 207, 232, 0.72)';
        ctx.beginPath();
        ctx.ellipse(px, py, w.size * 0.85, w.size * 0.45, nowSec + w.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (season === 'autumn') {
        ctx.fillStyle = 'rgba(234, 88, 12, 0.55)';
        ctx.beginPath();
        ctx.ellipse(px, py, w.size, w.size * 0.5, nowSec + w.phase, 0, Math.PI * 2);
        ctx.fill();
      } else if (season === 'winter' || state.weather === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.beginPath();
        ctx.arc(px, py, w.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.3)';
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
