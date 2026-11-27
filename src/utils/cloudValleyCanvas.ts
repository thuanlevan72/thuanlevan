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
import { CloudValleySpriteAtlas, type FruitTreeKind } from './cloudValleySprites.ts';
import {
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
  isoW: number;
  isoH: number;
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

export type PopupIconKind = 'coin' | 'xp' | 'crop' | 'milk' | 'egg' | 'wool' | 'water' | 'hybrid' | 'none';

export interface FloatingPopup {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
  text: string;
  color: string;
  icon: PopupIconKind;
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
    for (let i = 0; i < 40; i++) {
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
        vy: -1.3,
        life: 0,
        maxLife: 1.45,
        text: '',
        color: '#FFFFFF',
        icon: 'none',
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
    const baseTilePx = safeW < 640 ? 40 : Math.min(54, Math.max(42, Math.min(safeW / 24, safeH / 16)));
    const tilePx = Math.max(32, Math.min(72, baseTilePx * zoom));
    const isoW = tilePx * 0.72;
    const isoH = tilePx * 0.37;

    // Subtle camera tracking centered nicely around Avatar & isometric homestead
    const camX = Math.max(4.5, Math.min(WORLD_COLS - 4.5, avatar.x * 0.72 + 2.4));
    const camY = Math.max(3.5, Math.min(WORLD_ROWS - 3.5, avatar.y * 0.72 + 2.1));

    return { width: safeW, height: safeH, tilePx, isoW, isoH, camX, camY };
  }

  public worldToScreen(wx: number, wy: number, m: FarmViewportMetrics): { x: number; y: number } {
    const dx = wx - m.camX;
    const dy = wy - m.camY;
    return {
      x: m.width * 0.5 + (dx - dy) * m.isoW,
      y: m.height * 0.5 + (dx + dy) * m.isoH,
    };
  }

  public screenToWorld(px: number, py: number, m: FarmViewportMetrics): { wx: number; wy: number } {
    const a = (px - m.width * 0.5) / m.isoW;
    const b = (py - m.height * 0.5) / m.isoH;
    return {
      wx: m.camX + (a + b) * 0.5,
      wy: m.camY + (b - a) * 0.5,
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
      const speed = 0.7 + Math.random() * 1.3;
      p.active = true;
      p.x = wx;
      p.y = wy - 0.15;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed * 0.7 - 0.85;
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.22;
      p.size = 2.8 + Math.random() * 2.2;
      p.color = color;
    }
  }

  public spawnPopupWorld(
    wx: number,
    wy: number,
    text: string,
    color = '#FFFBEB',
    icon: PopupIconKind = 'none'
  ): void {
    const pop = this.popupPool[this.popupCursor];
    this.popupCursor = (this.popupCursor + 1) % this.popupPool.length;
    pop.active = true;
    pop.x = wx;
    pop.y = wy - 0.9;
    pop.vy = -1.25;
    pop.life = 0;
    pop.maxLife = 1.45;
    pop.text = text;
    pop.color = color;
    pop.icon = icon;
  }

  public stepEffects(dt: number, state: CloudValleyGameState): void {
    const season = getSeasonId(state);
    for (const w of this.weatherPool) {
      const speedMult = state.weather === 'drizzle' ? 2.2 : season === 'winter' ? 0.85 : 0.62;
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

    // 1. Sky Valley Backdrop & Drifting Clouds ("Thung Lũng Mây")
    const duskMix = dayRatio > 0.72 ? Math.min(1, (dayRatio - 0.72) / 0.25) : 0;
    const topColor = duskMix > 0.25 ? '#485A84' : '#7BC7F2';
    const botColor = duskMix > 0.25 ? '#E69F74' : '#D9F1FC';
    const skyKey = `${topColor}_${botColor}_${m.height}`;
    if (this.cachedSkyKey !== skyKey || !this.cachedSkyGrad) {
      const grad = ctx.createLinearGradient(0, 0, 0, m.height);
      grad.addColorStop(0, topColor);
      grad.addColorStop(0.55, botColor);
      grad.addColorStop(1, '#BDE5FA');
      this.cachedSkyGrad = grad;
      this.cachedSkyKey = skyKey;
    }
    ctx.fillStyle = this.cachedSkyGrad;
    ctx.fillRect(0, 0, m.width, m.height);

    // Fluffy floating valley clouds around the island
    this.drawSkyClouds(ctx, m, nowSec);

    // 2. Isometric Floating Homestead Plateau, Vivid Grass, Packed-Earth Footpaths, Pond & Garden Fences
    this.drawIsometricWorldBase(ctx, state, m, meta, season, nowSec);

    // 3. Seamless Rounded Isometric Soil Mounds & Crops (72 tiles)
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

    // Draw soil pads in isometric painter order (increasing row + col)
    const tilesOrdered: TileState[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const tile = state.tiles[getTileIndex(row, col)];
        if (tile) tilesOrdered.push(tile);
      }
    }
    tilesOrdered.sort((a, b) => a.row + a.col - (b.row + b.col));

    for (const tile of tilesOrdered) {
      const unlocked = isTileUnlocked(state, tile);
      const isHighlighted = highlightedSet.has(`${tile.row},${tile.col}`);
      const isTargetTile =
        interactTarget?.kind === 'tile' && interactTarget.row === tile.row && interactTarget.col === tile.col;
      this.drawSoilMoundBase(ctx, state, tile, m, nowSec, unlocked, isHighlighted, isTargetTile);
    }

    // 4. Locked Zone Wooden Signposts
    for (const t of TERRACES) {
      if (state.unlockedTerraces.includes(t.id)) continue;
      const midRow = (t.rowStart + t.rowEnd) * 0.5;
      const midCol = (t.colStart + t.colEnd) * 0.5;
      const wb = tileToWorldBounds(midRow, midCol);
      const sp = this.worldToScreen(wb.cx, wb.cy, m);
      ctx.save();
      const signW = Math.min(118, Math.max(88, m.tilePx * 2.1));
      const signH = 26;
      const signX = Math.min(m.width - signW * 0.5 - 8, Math.max(signW * 0.5 + 8, sp.x));
      ctx.fillStyle = '#5C3A21';
      ctx.fillRect(signX - 4, sp.y + 8, 8, 16);
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(signX - 4, sp.y + 8, 8, 16);
      ctx.fillStyle = '#5C3418';
      this.roundRect(ctx, signX - signW * 0.5, sp.y - signH * 0.5, signW, signH, 6);
      ctx.fill();
      ctx.strokeStyle = '#F6D38C';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#FEF3C7';
      ctx.font = `800 ${m.tilePx < 42 ? 10 : 11}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Khu ${t.id} · ${t.costGold} Xu`, signX, sp.y + 4);
      ctx.restore();
    }

    // 5. True Isometric Depth-Sorted World Entities (sortKey = wx + wy)
    const drawList: { depth: number; draw: () => void }[] = [];

    // Crops & tile structures sorted with characters/buildings so tall Avatar walks cleanly behind/in front!
    for (const tile of tilesOrdered) {
      if (!isTileUnlocked(state, tile)) continue;
      if (!tile.structure && !tile.hasWeed && !tile.wildMushroom && !tile.crop) continue;
      const wb = tileToWorldBounds(tile.row, tile.col);
      drawList.push({
        depth: wb.cx + wb.cy,
        draw: () => {
          const center = this.worldToScreen(wb.cx, wb.cy, m);
          const sSize = m.tilePx * 0.92;
          if (tile.structure) {
            this.drawStructure(ctx, tile.structure, center.x, center.y, sSize, nowSec);
          }
          if (tile.hasWeed) {
            this.drawWeed(ctx, center.x, center.y, sSize);
          } else if (tile.wildMushroom) {
            this.drawMushroom(ctx, center.x, center.y, sSize, nowSec);
          } else if (tile.crop) {
            this.drawCrop(ctx, tile, center.x, center.y, sSize, nowSec);
          }
        },
      });
    }

    // Farmhouse (Wooden Tile-Roof Vietnamese Farmhouse)
    drawList.push({
      depth: 4.0 + 2.8,
      draw: () =>
        this.drawFarmhouse(
          ctx,
          state,
          m,
          nowSec,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'barn'
        ),
    });

    // Stone Wishing Well
    drawList.push({
      depth: 7.8 + 2.9,
      draw: () =>
        this.drawStoneWell(
          ctx,
          m,
          nowSec,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'well'
        ),
    });

    // Merchant Stall & Bác Lái Buôn
    drawList.push({
      depth: 11.6 + 2.75,
      draw: () =>
        this.drawMerchantStall(
          ctx,
          state,
          m,
          nowSec,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'merchant'
        ),
    });

    // Almanac Notice Board
    drawList.push({
      depth: 15.0 + 2.9,
      draw: () =>
        this.drawNoticeBoard(
          ctx,
          m,
          interactTarget?.kind === 'building' && interactTarget.buildingId === 'board'
        ),
    });

    // Wooden Doghouse beside entrance gate
    drawList.push({
      depth: 1.9 + 4.35,
      draw: () => this.drawDoghouse(ctx, 1.9, 4.35, m),
    });

    // Livestock Pen Fences & Feed Trough
    drawList.push({
      depth: 16.0 + 5.75,
      draw: () => this.drawPenNorthWestFence(ctx, m),
    });
    drawList.push({
      depth: 18.2 + 6.3,
      draw: () => this.drawFeedTrough(ctx, m),
    });
    drawList.push({
      depth: 20.4 + 10.2,
      draw: () => this.drawPenSouthEastFence(ctx, m),
    });

    // Livestock animals
    state.livestock.forEach((an, idx) => {
      const pos = getAnimalWorldPos(idx, nowSec);
      const isFocused = interactTarget?.kind === 'animal' && interactTarget.animalId === an.id;
      drawList.push({
        depth: pos.x + pos.y,
        draw: () => this.drawLivestockAnimal(ctx, an, pos.x, pos.y, m, nowSec, isFocused),
      });
    });

    // Loyal Guard Puppy trotting near the doghouse & yard entrance
    const pupX = 2.65 + Math.sin(nowSec * 0.8) * 0.55;
    const pupY = 4.72 + Math.cos(nowSec * 1.1) * 0.22;
    drawList.push({
      depth: pupX + pupY,
      draw: () => this.drawPuppy(ctx, pupX, pupY, Math.cos(nowSec * 0.8) >= 0, m, nowSec),
    });

    // Earth Sprites hopping across garden beds
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
        depth: sx + sy,
        draw: () => this.drawEarthSprite(ctx, sx, sy, m, sprite.energy > 5, nowSec, idx),
      });
    });

    // Fruit Trees along the farm fence perimeter (Khế, Táo, Đào) — kept clear of plot signs
    const fruitTreeSpecs: [number, number, FruitTreeKind][] = [
      [1.3, 2.5, 'starfruit'],
      [1.2, 7.6, 'apple'],
      [1.3, 12.8, 'peach'],
      [3.5, 16.05, 'starfruit'],
      [16.9, 2.7, 'peach'],
      [19.9, 4.1, 'apple'],
      [20.85, 6.9, 'starfruit'],
      [9.4, 16.05, 'apple'],
    ];
    for (const [tx, ty, kind] of fruitTreeSpecs) {
      drawList.push({
        depth: tx + ty,
        draw: () => this.drawFruitTreeProp(ctx, tx, ty, m, season, kind),
      });
    }

    // 2x-2.5x Chibi Farmer Avatar
    drawList.push({
      depth: avatar.x + avatar.y,
      draw: () => this.drawFarmerAvatar(ctx, state, avatar, m, nowSec),
    });

    drawList.sort((a, b) => a.depth - b.depth);
    for (const item of drawList) {
      item.draw();
    }

    // 6. Weather Overlay
    this.drawWeatherOverlay(ctx, state, m, nowSec);

    // 7. World Action Particles & Floating Avatar Feedback (Icon + +EXP +Xu)
    for (const p of this.actionPool) {
      if (!p.active) continue;
      const sp = this.worldToScreen(p.x, p.y, m);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const pop of this.popupPool) {
      if (!pop.active) continue;
      const sp = this.worldToScreen(pop.x, pop.y, m);
      const liftPx = pop.life * 32;
      const py = sp.y - liftPx;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - Math.pow(pop.life / pop.maxLife, 1.8));
      ctx.font = '800 13.5px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(pop.text).width;
      const hasIcon = pop.icon !== 'none';
      const startX = sp.x - (hasIcon ? (tw + 18) * 0.5 : tw * 0.5);

      if (hasIcon) {
        this.drawPopupIcon(ctx, pop.icon, startX + 7, py - 4);
      }

      ctx.textAlign = 'left';
      ctx.lineWidth = 3.8;
      ctx.strokeStyle = '#1A1008';
      const textX = hasIcon ? startX + 18 : startX;
      ctx.strokeText(pop.text, textX, py);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, textX, py);
      ctx.restore();
    }
  }

  private drawPopupIcon(ctx: CanvasRenderingContext2D, icon: PopupIconKind, x: number, y: number): void {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#1A1008';
    if (icon === 'coin') {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#854D0E';
      ctx.fillRect(x - 1, y - 3, 2, 6);
    } else if (icon === 'crop' || icon === 'hybrid') {
      ctx.fillStyle = icon === 'hybrid' ? '#C084FC' : '#EF4444';
      ctx.beginPath();
      ctx.arc(x, y + 1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.ellipse(x + 2, y - 5, 3.5, 1.8, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (icon === 'milk') {
      ctx.fillStyle = '#FFFFFF';
      this.roundRect(ctx, x - 4, y - 6, 8, 12, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(x - 3, y - 2, 6, 4);
    } else if (icon === 'egg') {
      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.ellipse(x, y, 4.8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (icon === 'wool') {
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (icon === 'water') {
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(x, y + 1, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.arc(x, y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawSkyClouds(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics, nowSec: number): void {
    ctx.save();
    for (let i = 0; i < 7; i++) {
      const cx = ((nowSec * 7 + i * 240) % (m.width + 260)) - 130;
      const cy = 36 + (i % 4) * (m.height * 0.16);
      ctx.fillStyle = 'rgba(255, 253, 249, 0.78)';
      for (const [ox, oy, r] of [
        [0, 0, 22],
        [-18, 6, 15],
        [18, 6, 16],
        [34, 9, 11],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawIsometricWorldBase(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
    meta: (typeof SEASON_META)['spring'],
    season: ReturnType<typeof getSeasonId>,
    nowSec: number
  ): void {
    // Isometric Island Bounds: wx [0.3..21.4], wy [0.6..16.5]
    const pN = this.worldToScreen(0.3, 0.6, m);
    const pE = this.worldToScreen(21.4, 0.6, m);
    const pS = this.worldToScreen(21.4, 16.5, m);
    const pW = this.worldToScreen(0.3, 16.5, m);
    const cliffH = m.tilePx * 0.58;

    // 1. Extruded 2.5D Earthen Cliff Rim along bottom edges of floating valley island
    ctx.save();
    // Bottom-left cliff face (W -> S)
    ctx.fillStyle = '#6B4226';
    ctx.beginPath();
    ctx.moveTo(pW.x, pW.y);
    ctx.lineTo(pS.x, pS.y);
    ctx.lineTo(pS.x, pS.y + cliffH);
    ctx.lineTo(pW.x, pW.y + cliffH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bottom-right cliff face (S -> E)
    ctx.fillStyle = '#54321B';
    ctx.beginPath();
    ctx.moveTo(pS.x, pS.y);
    ctx.lineTo(pE.x, pE.y);
    ctx.lineTo(pE.x, pE.y + cliffH);
    ctx.lineTo(pS.x, pS.y + cliffH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Meadow Grass Island Top Face (clipped cleanly)
    ctx.beginPath();
    ctx.moveTo(pN.x, pN.y);
    ctx.lineTo(pE.x, pE.y);
    ctx.lineTo(pS.x, pS.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.closePath();
    const grassPat = this.atlas.getGrassPattern(ctx, season);
    ctx.fillStyle = grassPat ?? meta.grassLight;
    ctx.fill();
    ctx.strokeStyle = '#2B6E1C';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.clip();

    // 3. Narrow Natural Packed-Earth Footpaths with Grassy Soft Edges
    const dirtPat = this.atlas.getDirtPathPattern(ctx);
    const drawIsoPath = (x1: number, y1: number, x2: number, y2: number) => {
      const c1 = this.worldToScreen(x1, y1, m);
      const c2 = this.worldToScreen(x2, y1, m);
      const c3 = this.worldToScreen(x2, y2, m);
      const c4 = this.worldToScreen(x1, y2, m);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.lineTo(c3.x, c3.y);
      ctx.lineTo(c4.x, c4.y);
      ctx.closePath();
      // Soft grassy dirt rim
      ctx.strokeStyle = '#8F6230';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.fillStyle = dirtPat ?? '#D9AA6C';
      ctx.fill();
      ctx.restore();
    };

    // Narrow front yard footpath
    drawIsoPath(2.2, 4.15, 16.0, 5.15);
    // Narrow center footpath between garden plots
    drawIsoPath(8.55, 5.1, 9.45, 15.4);
    // Narrow horizontal garden cross-path
    drawIsoPath(3.0, 10.35, 14.0, 11.05);
    // Short path to livestock pen gate
    drawIsoPath(14.0, 7.55, 16.0, 8.45);

    // 4. Livestock Pasture Turf
    const penA = this.worldToScreen(16.0, 5.8, m);
    const penB = this.worldToScreen(20.4, 5.8, m);
    const penC = this.worldToScreen(20.4, 10.2, m);
    const penD = this.worldToScreen(16.0, 10.2, m);
    const pasturePat = this.atlas.getPasturePattern(ctx, season);
    ctx.beginPath();
    ctx.moveTo(penA.x, penA.y);
    ctx.lineTo(penB.x, penB.y);
    ctx.lineTo(penC.x, penC.y);
    ctx.lineTo(penD.x, penD.y);
    ctx.closePath();
    ctx.fillStyle = pasturePat ?? '#7AD449';
    ctx.fill();

    // 5. Oval Stone-Edged Fish Pond in Garden Corner (wx=17.0, wy=12.6)
    this.drawFishPond(ctx, 17.0, 12.6, m, nowSec);

    // 6. Low Wooden Garden Fences around the 4 Garden Beds (with open garden gates facing paths)
    const zoneFrames = [
      { id: 1, x1: 2.9, y1: 5.9, x2: 8.1, y2: 10.1, gateSide: 'right' as const },
      { id: 2, x1: 9.9, y1: 5.9, x2: 14.1, y2: 10.1, gateSide: 'left' as const },
      { id: 3, x1: 2.9, y1: 11.3, x2: 8.1, y2: 15.5, gateSide: 'right' as const },
      { id: 4, x1: 9.9, y1: 11.3, x2: 14.1, y2: 15.5, gateSide: 'left' as const },
    ];
    for (const zf of zoneFrames) {
      const unlocked = state.unlockedTerraces.includes(zf.id);
      this.drawIsoFenceBox(ctx, zf.x1, zf.y1, zf.x2, zf.y2, m, unlocked, zf.gateSide);
    }

    ctx.restore();
  }

  private drawIsoFenceSegment(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    m: FarmViewportMetrics,
    unlocked = true
  ): void {
    const a = this.worldToScreen(x1, y1, m);
    const b = this.worldToScreen(x2, y2, m);
    const postH = 11;
    ctx.save();
    ctx.lineCap = 'round';
    // Dark outline pass
    ctx.strokeStyle = unlocked ? '#1E120A' : 'rgba(100, 116, 139, 0.7)';
    ctx.lineWidth = unlocked ? 6 : 3.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 5);
    ctx.lineTo(b.x, b.y - 5);
    ctx.stroke();
    // Warm timber rail
    ctx.strokeStyle = unlocked ? '#C4824E' : 'rgba(203, 213, 225, 0.8)';
    ctx.lineWidth = unlocked ? 3.2 : 1.8;
    ctx.stroke();

    if (unlocked) {
      const dist = Math.hypot(x2 - x1, y2 - y1);
      const count = Math.max(2, Math.round(dist / 1.1));
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        ctx.fillStyle = '#8C5225';
        ctx.strokeStyle = '#1E120A';
        ctx.lineWidth = 1.6;
        ctx.fillRect(px - 2.6, py - postH, 5.2, postH + 1);
        ctx.strokeRect(px - 2.6, py - postH, 5.2, postH + 1);
      }
    }
    ctx.restore();
  }

  private drawIsoFenceBox(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    m: FarmViewportMetrics,
    unlocked: boolean,
    gateSide: 'left' | 'right' = 'right'
  ): void {
    const midY = (y1 + y2) * 0.5;
    this.drawIsoFenceSegment(ctx, x1, y1, x2, y1, m, unlocked);
    this.drawIsoFenceSegment(ctx, x1, y2, x2, y2, m, unlocked);
    if (gateSide === 'right') {
      this.drawIsoFenceSegment(ctx, x1, y1, x1, y2, m, unlocked);
      this.drawIsoFenceSegment(ctx, x2, y1, x2, midY - 0.7, m, unlocked);
      this.drawIsoFenceSegment(ctx, x2, midY + 0.7, x2, y2, m, unlocked);
    } else {
      this.drawIsoFenceSegment(ctx, x2, y1, x2, y2, m, unlocked);
      this.drawIsoFenceSegment(ctx, x1, y1, x1, midY - 0.7, m, unlocked);
      this.drawIsoFenceSegment(ctx, x1, midY + 0.7, x1, y2, m, unlocked);
    }
  }

  private drawFishPond(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    m: FarmViewportMetrics,
    nowSec: number
  ): void {
    const c = this.worldToScreen(wx, wy, m);
    const rx = m.isoW * 2.05;
    const ry = m.isoH * 2.05;

    ctx.save();
    // Outer drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 4, rx + 6, ry + 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smooth Overlapping Cobblestone Border along pond bank
    const stoneCount = 22;
    for (let i = 0; i < stoneCount; i++) {
      const ang = (i / stoneCount) * Math.PI * 2;
      const sx = c.x + Math.cos(ang) * (rx - 1);
      const sy = c.y + Math.sin(ang) * (ry - 1);
      ctx.fillStyle = i % 3 === 0 ? '#94A3B8' : i % 3 === 1 ? '#CBD5E1' : '#A8B3C4';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 6.8, 4.6, ang + Math.PI * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Sparkling Cerulean Water
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx - 4, ry - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.ellipse(c.x - 4, c.y - 2, rx * 0.72, ry * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gentle expanding water ripple rings
    const rPhase = (nowSec * 0.55) % 1;
    ctx.strokeStyle = `rgba(224, 242, 254, ${0.65 * (1 - rPhase)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(c.x - 8, c.y + 2, 6 + rPhase * 18, 3 + rPhase * 9, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Animated Koi Fish swimming
    for (let f = 0; f < 2; f++) {
      const ang = nowSec * (0.9 + f * 0.35) + f * Math.PI;
      const fx = c.x + Math.cos(ang) * rx * 0.44;
      const fy = c.y + Math.sin(ang) * ry * 0.42;
      ctx.fillStyle = f === 0 ? '#F97316' : '#FFFFFF';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 5.2, 2.5, ang + Math.PI * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Green Lily Pad + Pink Lotus Blossom
    ctx.fillStyle = '#22C55E';
    ctx.strokeStyle = '#14532D';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(c.x + rx * 0.36, c.y + ry * 0.12, 9, 5.5, 0.2, 0.2, Math.PI * 1.9);
    ctx.lineTo(c.x + rx * 0.36, c.y + ry * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(c.x + rx * 0.36, c.y + ry * 0.12 - 2, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawSoilMoundBase(
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
    const center = this.worldToScreen(wb.cx, wb.cy, m);
    const sw = m.isoW * 2.02;
    const sh = m.isoH * 2.22;
    const season = getSeasonId(state);
    const inGreenhouse = isTileInGreenhouse(state, tile.row, tile.col);

    ctx.save();
    if (!unlocked) {
      ctx.beginPath();
      ctx.moveTo(center.x, center.y - m.isoH * 0.85);
      ctx.lineTo(center.x + m.isoW * 0.85, center.y);
      ctx.lineTo(center.x, center.y + m.isoH * 0.85);
      ctx.lineTo(center.x - m.isoW * 0.85, center.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(254, 243, 199, 0.16)';
      ctx.fill();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(92, 52, 20, 0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
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
      ctx.drawImage(sprite, center.x - sw * 0.5, center.y - sh * 0.5, sw, sh);
    }

    const drawIsoHighlight = (strokeColor: string, width: number, fillCol?: string) => {
      ctx.beginPath();
      ctx.moveTo(center.x, center.y - m.isoH * 0.9);
      ctx.lineTo(center.x + m.isoW * 0.9, center.y);
      ctx.lineTo(center.x, center.y + m.isoH * 0.9);
      ctx.lineTo(center.x - m.isoW * 0.9, center.y);
      ctx.closePath();
      if (fillCol) {
        ctx.fillStyle = fillCol;
        ctx.fill();
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    if (tile.tilled && tile.fertility <= 10) {
      drawIsoHighlight('#F59E0B', 2);
    }

    if (getTileAuraBonus(state, tile.row, tile.col) > 0) {
      drawIsoHighlight(`rgba(168, 85, 247, ${0.5 + Math.sin(nowSec * 3) * 0.16})`, 2.2);
    }

    if (tile.mutagenApplied && !tile.crop) {
      ctx.fillStyle = '#C084FC';
      ctx.beginPath();
      ctx.arc(center.x - 6, center.y - 3 + Math.sin(nowSec * 4) * 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(center.x + 6, center.y + 2 + Math.cos(nowSec * 4) * 2, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (inGreenhouse && tile.structure !== 'greenhouse') {
      drawIsoHighlight('rgba(125, 211, 252, 0.85)', 2);
    }

    if (highlighted) {
      drawIsoHighlight('#FACC15', 2.4, 'rgba(254, 240, 138, 0.25)');
    }

    if (isTargetTile) {
      drawIsoHighlight('#FEF08A', 2.6);
    }

    ctx.restore();
  }

  private drawFarmhouse(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const c = this.worldToScreen(4.0, 2.75, m);
    const w = m.tilePx * 3.5;
    const h = m.tilePx * 2.9;
    const x = c.x - w * 0.5;
    const y = c.y - h * 0.84;

    ctx.save();
    const sprite = this.atlas.getFarmhouseSprite();
    if (sprite) {
      ctx.drawImage(sprite, x, y, w, h);
    }

    // Spinning wooden windmill sails on right mill tower
    const hubX = x + w * (222 / 268);
    const hubY = y + h * (72 / 224);
    const sailLen = w * 0.2;
    ctx.save();
    ctx.translate(hubX, hubY);
    ctx.rotate(nowSec * 1.1);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#FFFDF5';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.fillRect(2, -sailLen, sailLen * 0.26, sailLen * 0.78);
      ctx.strokeRect(2, -sailLen, sailLen * 0.26, sailLen * 0.78);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -sailLen);
      ctx.stroke();
    }
    ctx.fillStyle = '#D93829';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.stroke();
    ctx.restore();

    // Gentle chimney smoke
    if (state.artisanQueue.length > 0 || Math.sin(nowSec) > -0.8) {
      const chX = x + w * (58 / 268);
      const chY = y + h * (26 / 224);
      for (let i = 0; i < 3; i++) {
        const t = (nowSec * 0.45 + i * 0.33) % 1;
        ctx.fillStyle = `rgba(255, 251, 240, ${0.72 * (1 - t)})`;
        ctx.beginPath();
        ctx.arc(chX + Math.sin(nowSec * 2 + i) * 4, chY - t * 22, 3.5 + t * 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.6;
      this.roundRect(ctx, x + 6, y + 6, w - 12, h - 12, 10);
      ctx.stroke();
    }

    this.drawWorldPlaque(ctx, c.x, c.y + 12, 'Nhà Kho & Xưởng', focused);
    ctx.restore();
  }

  private drawStoneWell(
    ctx: CanvasRenderingContext2D,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const c = this.worldToScreen(7.8, 2.95, m);
    const w = m.tilePx * 1.85;
    const h = m.tilePx * 2.15;
    const x = c.x - w * 0.5;
    const y = c.y - h * 0.82;

    ctx.save();
    const sprite = this.atlas.getWellSprite();
    if (sprite) {
      ctx.drawImage(sprite, x, y, w, h);
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(c.x + Math.sin(nowSec * 2.4) * 5, y + h * (88 / 152), 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y - h * 0.25, w * 0.44, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.drawWorldPlaque(ctx, c.x, c.y + 10, 'Giếng Nước', focused);
    ctx.restore();
  }

  private drawMerchantStall(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    m: FarmViewportMetrics,
    nowSec: number,
    focused: boolean
  ): void {
    const c = this.worldToScreen(11.6, 2.75, m);
    const w = m.tilePx * 3.1;
    const h = m.tilePx * 2.45;
    const x = c.x - w * 0.5;
    const y = c.y - h * 0.84;

    ctx.save();
    const sprite = this.atlas.getMerchantStallSprite();
    if (sprite) {
      ctx.drawImage(sprite, x, y, w, h);
    }

    // Animated Bác Lái Buôn behind counter & under awning
    const bob = Math.sin(nowSec * 2.8) * 1.4;
    const faceX = c.x;
    const faceY = y + h * (81 / 178) + bob;
    const headR = Math.max(9.5, w * 0.085);

    ctx.fillStyle = '#0369A1';
    ctx.beginPath();
    ctx.ellipse(faceX, faceY + headR * 1.32, headR * 1.32, headR * 1.0, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(faceX - headR * 0.55, faceY + headR * 0.65, headR * 1.1, headR * 0.65);

    ctx.fillStyle = '#FDE2C4';
    ctx.beginPath();
    ctx.arc(faceX, faceY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Cap & visor
    ctx.fillStyle = '#92400E';
    ctx.beginPath();
    ctx.arc(faceX, faceY - headR * 0.2, headR * 1.04, Math.PI * 1.02, Math.PI * 1.98);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(faceX, faceY - headR * 0.22, headR * 1.18, headR * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = faceX + side * headR * 0.36;
      const ey = faceY + headR * 0.06;
      ctx.fillStyle = '#1E120A';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 0.7, ey - 0.8, 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

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

    const readyOrders = state.orders.filter((o) => (state.inventory[o.itemId] ?? 0) >= o.qty).length;
    if (readyOrders > 0) {
      const by = y + 12 + Math.sin(nowSec * 5) * 2;
      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(x + w - 12, by, 8.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x + w - 12, by + 4);
    }

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.6;
      this.roundRect(ctx, x + 6, y + 6, w - 12, h - 10, 10);
      ctx.stroke();
    }

    this.drawWorldPlaque(ctx, c.x, c.y + 12, 'Lái Buôn & Chợ', focused);
    ctx.restore();
  }

  private drawNoticeBoard(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics, focused: boolean): void {
    const c = this.worldToScreen(15.0, 2.95, m);
    const w = m.tilePx * 1.55;
    const h = m.tilePx * 1.72;
    const x = c.x - w * 0.5;
    const y = c.y - h * 0.82;

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
    this.drawWorldPlaque(ctx, c.x, c.y + 10, 'Sổ Tay', focused);
    ctx.restore();
  }

  private drawDoghouse(ctx: CanvasRenderingContext2D, wx: number, wy: number, m: FarmViewportMetrics): void {
    const c = this.worldToScreen(wx, wy, m);
    const w = m.tilePx * 1.32;
    const h = m.tilePx * 1.32;
    const sprite = this.atlas.getDoghouseSprite();
    if (sprite) {
      ctx.drawImage(sprite, c.x - w * 0.5, c.y - h * 0.82, w, h);
    }
  }

  private drawFeedTrough(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics): void {
    const sp = this.worldToScreen(18.2, 6.22, m);
    const tw = m.tilePx * 1.3;
    const th = m.tilePx * 0.42;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.roundRect(ctx, sp.x - tw * 0.5, sp.y + 3, tw, th, 4);
    ctx.fill();
    ctx.fillStyle = '#8C5225';
    this.roundRect(ctx, sp.x - tw * 0.5, sp.y, tw, th, 4);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    this.roundRect(ctx, sp.x - tw * 0.42, sp.y + 3, tw * 0.84, th * 0.55, 3);
    ctx.fill();
    ctx.restore();
  }

  private drawPenNorthWestFence(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics): void {
    this.drawIsoFenceSegment(ctx, 15.85, 5.75, 20.5, 5.75, m, true);
    this.drawIsoFenceSegment(ctx, 15.85, 5.75, 15.85, 7.1, m, true);
  }

  private drawPenSouthEastFence(ctx: CanvasRenderingContext2D, m: FarmViewportMetrics): void {
    this.drawIsoFenceSegment(ctx, 15.85, 8.9, 15.85, 10.2, m, true);
    this.drawIsoFenceSegment(ctx, 15.85, 10.2, 20.5, 10.2, m, true);
    this.drawIsoFenceSegment(ctx, 20.5, 5.75, 20.5, 10.2, m, true);
    const mid = this.worldToScreen(18.2, 10.2, m);
    this.drawWorldPlaque(ctx, mid.x, mid.y + 14, 'Chuồng Trại', false);
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
    const s = m.tilePx * 0.45;
    ctx.save();
    // Elliptical Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + s * 0.48, s * 0.82, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    if (focused) {
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, s * 1.25, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (an.type === 'chicken') {
      const peck = Math.sin(nowSec * 3.5) * 1.5;
      ctx.fillStyle = '#EA580C';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sp.x - s * 0.45, sp.y - s * 0.1);
      ctx.lineTo(sp.x - s * 0.85, sp.y - s * 0.45);
      ctx.lineTo(sp.x - s * 0.6, sp.y + s * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y + peck * 0.3, s * 0.58, s * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(sp.x - s * 0.08, sp.y + s * 0.08 + peck * 0.3, s * 0.3, s * 0.18, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.22, sp.y - s * 0.46 + peck, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1E120A';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.34, sp.y - s * 0.14 + peck, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(sp.x + s * 0.52, sp.y - s * 0.12 + peck);
      ctx.lineTo(sp.x + s * 0.84, sp.y + peck);
      ctx.lineTo(sp.x + s * 0.52, sp.y + s * 0.12 + peck);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (an.type === 'cow') {
      ctx.fillStyle = '#4A3426';
      ctx.fillRect(sp.x - s * 0.52, sp.y + s * 0.25, 4.5, s * 0.38);
      ctx.fillRect(sp.x - s * 0.18, sp.y + s * 0.28, 4.5, s * 0.35);
      ctx.fillRect(sp.x + s * 0.24, sp.y + s * 0.25, 4.5, s * 0.38);

      ctx.fillStyle = '#FFFDF9';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sp.x - s * 0.08, sp.y, s * 0.84, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3B281B';
      ctx.beginPath();
      ctx.arc(sp.x - s * 0.34, sp.y - s * 0.12, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.06, sp.y + s * 0.14, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.45, sp.y + s * 0.15, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const hx = sp.x + s * 0.62;
      const hy = sp.y - s * 0.18;
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(hx - s * 0.18, hy - s * 0.3, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx + s * 0.18, hy - s * 0.3, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFDF9';
      ctx.beginPath();
      ctx.arc(hx, hy, s * 0.39, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.ellipse(hx, hy + s * 0.16, s * 0.28, s * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E120A';
      ctx.beginPath();
      ctx.arc(hx - s * 0.13, hy - s * 0.06, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + s * 0.13, hy - s * 0.06, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#475569';
      ctx.fillRect(sp.x - s * 0.35, sp.y + s * 0.25, 4, s * 0.32);
      ctx.fillRect(sp.x + s * 0.2, sp.y + s * 0.25, 4, s * 0.32);
      const puffs: [number, number, number][] = [
        [sp.x, sp.y, s * 0.6],
        [sp.x - s * 0.34, sp.y + s * 0.06, s * 0.42],
        [sp.x + s * 0.3, sp.y + s * 0.06, s * 0.42],
      ];
      ctx.fillStyle = '#1E120A';
      for (const [wx2, wy2, wr] of puffs) {
        ctx.beginPath();
        ctx.arc(wx2, wy2, wr + 1.8, 0, Math.PI * 2);
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
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(sp.x + s * 0.56, sp.y - s * 0.12, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (an.productReady) {
      const bob = Math.sin(nowSec * 4.5) * 2.5;
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y - s * 1.15 + bob, 7.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    } else if (!an.fedToday) {
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y - s * 1.1, 5.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.4;
      ctx.stroke();
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + 7, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sp.x - dir * 8, sp.y - 1 - hop);
    ctx.lineTo(sp.x - dir * 15, sp.y - 8 - hop + Math.sin(nowSec * 14) * 3.5);
    ctx.stroke();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y - hop, 10.5, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.fillRect(sp.x + dir * 3, sp.y - 5.5 - hop, 3.6, 6.5);

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sp.x + dir * 9, sp.y - 5.8 - hop, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1E120A';
    ctx.beginPath();
    ctx.arc(sp.x + dir * 11.5, sp.y - 7 - hop, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + dir * 14.8, sp.y - 4.4 - hop, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(sp.x + dir * 6, sp.y - 5 - hop, 2.8, 5, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 2x-2.5x Scale Classic TeaMobi Avatar Chibi Character (~1.8 tiles tall, 1:1.5 head-to-body ratio)
   * Thick 2px dark outlines, glossy anime eyes, cloud wings, overalls, hat & elliptical drop shadow!
   */
  private drawFarmerAvatar(
    ctx: CanvasRenderingContext2D,
    state: CloudValleyGameState,
    avatar: FarmerAvatarState,
    m: FarmViewportMetrics,
    nowSec: number
  ): void {
    const sp = this.worldToScreen(avatar.x, avatar.y, m);
    const s = m.tilePx * 0.86; // ~2x larger classic TeaMobi Chibi presence!
    const isMoving = Math.hypot(avatar.vx, avatar.vy) > 0.2;
    const stride = isMoving ? Math.sin(avatar.walkPhase) : 0;
    const bob = isMoving ? Math.abs(Math.cos(avatar.walkPhase)) * 3.5 : Math.sin(nowSec * 2.2) * 1.2;

    ctx.save();
    // 1. Crisp Elliptical Ground Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + 4, s * 0.5, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    const footY = sp.y;
    const yBody = footY - s * 0.34 - bob;
    const shirtColor = state.farmerProfile?.shirtColor ?? '#2E7D32';

    // 2. Decorative Shimmering Cloud Wings (behind shoulders, Avatar style accessory!)
    const wingFlap = Math.sin(nowSec * 3.5) * 0.08;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(sp.x + side * s * 0.24, yBody - s * 0.05);
      ctx.rotate(side * (-0.28 + wingFlap));
      ctx.fillStyle = '#FFFDF9';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(side * s * 0.22, 0, s * 0.24, s * 0.12, side * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 3. Stepping Boots
    ctx.fillStyle = '#4A2B13';
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(sp.x - s * 0.15 + stride * 4.5, footY - s * 0.04, s * 0.14, s * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(sp.x + s * 0.15 - stride * 4.5, footY - s * 0.04, s * 0.14, s * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4. Swinging Arms + Hands
    ctx.fillStyle = shirtColor;
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(sp.x - s * 0.33, yBody + stride * 3.2, s * 0.1, s * 0.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(sp.x + s * 0.33, yBody - stride * 3.2, s * 0.1, s * 0.2, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE2C4';
    ctx.beginPath();
    ctx.arc(sp.x - s * 0.35, yBody + s * 0.15 + stride * 3.2, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sp.x + s * 0.35, yBody + s * 0.15 - stride * 3.2, s * 0.075, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. Compact Chibi Body (Shirt + Blue Denim Overalls)
    ctx.fillStyle = shirtColor;
    this.roundRect(ctx, sp.x - s * 0.28, yBody - s * 0.24, s * 0.56, s * 0.48, 7);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#2563EB';
    this.roundRect(ctx, sp.x - s * 0.22, yBody - s * 0.04, s * 0.44, s * 0.27, 4);
    ctx.fill();
    ctx.fillRect(sp.x - s * 0.2, yBody - s * 0.22, s * 0.09, s * 0.2);
    ctx.fillRect(sp.x + s * 0.11, yBody - s * 0.22, s * 0.09, s * 0.2);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(sp.x - s * 0.155, yBody - s * 0.02, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + s * 0.155, yBody - s * 0.02, 2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Big Classic 1:1.5 TeaMobi Chibi Head (nearly half character height!)
    const headR = s * 0.44;
    const headY = yBody - s * 0.62;
    ctx.fillStyle = '#FDE2C4';
    ctx.beginPath();
    ctx.arc(sp.x, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Ears
    ctx.fillStyle = '#FBD5AC';
    ctx.beginPath();
    ctx.arc(sp.x - headR * 0.96, headY + s * 0.04, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sp.x + headR * 0.96, headY + s * 0.04, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (avatar.facing !== 'up') {
      const lookX = avatar.facing === 'left' ? -s * 0.11 : avatar.facing === 'right' ? s * 0.11 : 0;
      // Chestnut Hair Bangs
      ctx.fillStyle = '#4A2E1A';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.03, headR, Math.PI * 1.05, Math.PI * 1.95);
      ctx.lineTo(sp.x + s * 0.18, headY - s * 0.12);
      ctx.lineTo(sp.x, headY - s * 0.06);
      ctx.lineTo(sp.x - s * 0.18, headY - s * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Big Expressive TeaMobi Glossy Eyes with Catchlights
      const blink = Math.sin(nowSec * 1.4) > 0.96;
      const eyeY = headY + s * 0.05;
      if (blink) {
        ctx.strokeStyle = '#1E120A';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sp.x - s * 0.21 + lookX, eyeY);
        ctx.lineTo(sp.x - s * 0.07 + lookX, eyeY);
        ctx.moveTo(sp.x + s * 0.07 + lookX, eyeY);
        ctx.lineTo(sp.x + s * 0.21 + lookX, eyeY);
        ctx.stroke();
      } else {
        for (const side of [-1, 1]) {
          const ex = sp.x + side * s * 0.16 + lookX;
          ctx.fillStyle = '#1E1B18';
          ctx.beginPath();
          ctx.ellipse(ex, eyeY, s * 0.09, s * 0.12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(ex, eyeY + s * 0.03, s * 0.055, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(ex - s * 0.028, eyeY - s * 0.04, s * 0.036, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex + s * 0.025, eyeY + s * 0.04, s * 0.018, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Rosy cheeks & cheerful smile
      ctx.fillStyle = 'rgba(244, 114, 182, 0.48)';
      ctx.beginPath();
      ctx.ellipse(sp.x - s * 0.26 + lookX, headY + s * 0.18, s * 0.085, s * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sp.x + s * 0.26 + lookX, headY + s * 0.18, s * 0.085, s * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#9A3412';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(sp.x + lookX, headY + s * 0.21, s * 0.075, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#4A2E1A';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.02, headR, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      ctx.stroke();
    }

    // 7. Customizable Hat
    const hat = state.farmerProfile?.hat ?? 'straw';
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    if (hat === 'straw') {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(sp.x, headY - s * 0.32, s * 0.68, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.37, s * 0.36, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(sp.x - s * 0.35, headY - s * 0.41, s * 0.7, s * 0.08);
    } else if (hat === 'bandana') {
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(sp.x, headY - s * 0.12, headR * 1.03, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(sp.x + s * 0.42, headY - s * 0.2);
      ctx.lineTo(sp.x + s * 0.62, headY - s * 0.06);
      ctx.lineTo(sp.x + s * 0.44, headY - s * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#FFFDF9';
        ctx.strokeStyle = '#1E120A';
        ctx.beginPath();
        ctx.ellipse(sp.x + side * s * 0.18, headY - s * 0.64, s * 0.12, s * 0.32, side * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#FBCFE8';
        ctx.beginPath();
        ctx.ellipse(sp.x + side * s * 0.18, headY - s * 0.63, s * 0.055, s * 0.2, side * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 8. Active Tool Swing
    if (avatar.actionTimer > 0) {
      const swing = Math.sin((1 - avatar.actionTimer / 0.28) * Math.PI);
      const dirX = avatar.facing === 'left' ? -1 : avatar.facing === 'right' ? 1 : 0.7;
      const tipX = sp.x + dirX * (s * 0.72 + swing * 12);
      const tipY = yBody + swing * 12 - s * 0.18;
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(sp.x + dirX * s * 0.22, yBody - s * 0.05);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.strokeStyle = '#8C5225';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.fillStyle = avatar.actionTool === 'water' ? '#38BDF8' : avatar.actionTool === 'hoe' ? '#CBD5E1' : '#FACC15';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // 9. Crisp Farmer Name Tag below boots
    ctx.font = '800 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const farmerName = state.farmerProfile?.name || 'Nông Dân Mây';
    const nw = Math.min(136, ctx.measureText(farmerName).width + 14);
    const ny = footY + 7;
    ctx.fillStyle = 'rgba(28, 18, 10, 0.84)';
    this.roundRect(ctx, sp.x - nw * 0.5, ny, nw, 17, 5);
    ctx.fill();
    ctx.strokeStyle = '#F6D38C';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.fillText(farmerName, sp.x, ny + 12.2, nw - 8);

    // 10. Avatar Speech Bubble
    if (avatar.speechText && avatar.speechTimer > 0) {
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      const tw = Math.min(210, ctx.measureText(avatar.speechText).width + 18);
      const bx = sp.x - tw * 0.5;
      const by = headY - headR - 32;
      ctx.fillStyle = 'rgba(255, 253, 248, 0.97)';
      this.roundRect(ctx, bx, by, tw, 22, 8);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#2D1E12';
      ctx.fillText(avatar.speechText, sp.x, by + 14.5, tw - 10);
    }

    ctx.restore();
  }

  private drawFruitTreeProp(
    ctx: CanvasRenderingContext2D,
    wx: number,
    wy: number,
    m: FarmViewportMetrics,
    season: ReturnType<typeof getSeasonId>,
    kind: FruitTreeKind
  ): void {
    const sp = this.worldToScreen(wx, wy, m);
    const sprite = this.atlas.getFruitTreeSprite(kind, season);
    const w = m.tilePx * 2.15;
    const h = m.tilePx * 2.6;
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
    const s = size * 0.36;
    ctx.save();
    if (id === 'sprinkler') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.4;
      ctx.fillRect(cx - 3, cy - s * 0.85, 6, s * 0.9);
      ctx.strokeRect(cx - 3, cy - s * 0.85, 6, s * 0.9);
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 0.9, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const ang = nowSec * 3.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 9, cy - s * 0.9 + Math.sin(ang) * 4.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - Math.cos(ang) * 9, cy - s * 0.9 - Math.sin(ang) * 4.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'scarecrow') {
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 4);
      ctx.lineTo(cx, cy - s * 1.45);
      ctx.moveTo(cx - s * 0.7, cy - s * 0.9);
      ctx.lineTo(cx + s * 0.7, cy - s * 0.9);
      ctx.stroke();
      ctx.strokeStyle = '#8C5225';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(cx, cy - s * 1.32, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.ellipse(cx, cy - s * 1.56, 9, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (id === 'conveyor') {
      ctx.fillStyle = '#334155';
      this.roundRect(ctx, cx - s * 0.95, cy - 5, s * 1.9, 10, 3);
      ctx.fill();
      ctx.strokeStyle = '#1E120A';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#FACC15';
      const beltX = ((nowSec * 18) % (s * 1.4)) - s * 0.7;
      ctx.fillRect(cx + beltX, cy - 3.5, 5, 7);
    } else if (id === 'greenhouse') {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
      ctx.strokeStyle = '#1E120A';
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
    const s = size * 0.25;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, s * 0.7, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4D7C0F';
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.4;
    for (const ang of [-0.55, 0, 0.55]) {
      ctx.beginPath();
      ctx.ellipse(cx + Math.sin(ang) * s * 0.6, cy - s * 0.35, s * 0.34, s * 0.74, ang, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.95, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawMushroom(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, nowSec: number): void {
    const s = size * 0.3;
    const bob = Math.sin(nowSec * 3) * 1.5;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, s * 0.65, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F5E6D3';
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx - 3.2, cy - s * 0.55 + bob, 6.4, s * 0.75);
    ctx.strokeRect(cx - 3.2, cy - s * 0.55 + bob, 6.4, s * 0.75);
    ctx.fillStyle = '#D93829';
    ctx.beginPath();
    ctx.arc(cx, cy - s * 0.55 + bob, s * 0.75, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
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
    const s = size * 0.4;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.28, s * 0.65, s * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.5;

    if (ratio < 0.3) {
      ctx.fillStyle = '#65A30D';
      ctx.beginPath();
      ctx.ellipse(cx - 4.5 + sway * 0.3, cy - 2, 5, 2.8, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 4.5 + sway * 0.3, cy - 2, 5, 2.8, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (ratio < 0.75) {
      ctx.fillStyle = '#2E7D32';
      for (const [ox, oy, or] of [
        [0, -s * 0.3, s * 0.54],
        [-s * 0.34, -s * 0.1, s * 0.38],
        [s * 0.34, -s * 0.1, s * 0.38],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + ox + sway * 0.4, cy + oy, or, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.arc(cx - s * 0.1 + sway * 0.4, cy - s * 0.42, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const baseY = cy + s * 0.22 - bounce;
      if (def.id === 'lua_mi' || def.id === 'lua_mach_tim') {
        const earCol = def.id === 'lua_mach_tim' ? '#A855F7' : '#FACC15';
        for (let i = -2; i <= 2; i++) {
          const tx = cx + i * 4.2 + sway * 1.3;
          const ty = baseY - s * 1.35;
          ctx.strokeStyle = '#65A30D';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx + i * 3.2, baseY);
          ctx.quadraticCurveTo(cx + i * 3.6 + sway, baseY - s * 0.75, tx, ty);
          ctx.stroke();
          ctx.fillStyle = earCol;
          ctx.strokeStyle = '#1E120A';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(tx, ty, 2.8, 5.2, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else if (def.id === 'bi_ngo' || def.id === 'bi_khong_lo') {
        const pScale = def.id === 'bi_khong_lo' ? 1.3 : 0.96;
        ctx.fillStyle = '#EA580C';
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
        ctx.stroke();
        const petalCol = def.id === 'hoa_hong' ? '#E11D48' : '#8B5CF6';
        const centerCol = def.id === 'hoa_hong' ? '#FDA4AF' : '#DDD6FE';
        for (const [ox, oy] of [
          [-5, -s * 0.75],
          [5, -s * 0.55],
          [0, -s * 0.3],
        ]) {
          ctx.fillStyle = petalCol;
          ctx.beginPath();
          ctx.arc(cx + ox + sway * 0.6, baseY + oy, 4.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = centerCol;
          ctx.beginPath();
          ctx.arc(cx + ox - 1 + sway * 0.6, baseY + oy - 1, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#1E7A2D';
        ctx.beginPath();
        ctx.arc(cx + sway * 0.45, baseY - s * 0.48, s * 0.64, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#38A849';
        ctx.beginPath();
        ctx.arc(cx - 2 + sway * 0.5, baseY - s * 0.62, s * 0.42, 0, Math.PI * 2);
        ctx.fill();

        for (const [fx, fy] of [
          [-5.5, -s * 0.76],
          [5.5, -s * 0.48],
          [-0.5, -s * 0.26],
        ]) {
          ctx.fillStyle = def.colorPrimary;
          ctx.beginPath();
          ctx.arc(cx + fx + sway * 0.6, baseY + fy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cx + fx - 1.3 + sway * 0.6, baseY + fy - 1.3, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (mature) {
        ctx.fillStyle = crop.quality === 'gold' ? '#FDE047' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(cx + s * 0.65, baseY - s * 1.18, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (tile.hasPest) {
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(cx + Math.sin(nowSec * 9) * 5, cy - s * 0.75, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (tile.moisture < 20 && !def.selfHydrating) {
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(cx - s * 0.65, cy - s * 0.65, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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
    const r = m.tilePx * 0.24;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y + 4, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = active ? '#86EFAC' : '#94A3B8';
    ctx.beginPath();
    ctx.arc(sp.x, sp.y - hop, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E120A';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.ellipse(sp.x + 2, sp.y - r - hop, r * 0.75, r * 0.38, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1E120A';
    ctx.beginPath();
    ctx.arc(sp.x - 2.8, sp.y - 1 - hop, 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sp.x + 2.8, sp.y - 1 - hop, 1.7, 0, Math.PI * 2);
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
    ctx.font = '800 10.5px "Plus Jakarta Sans", sans-serif';
    const pw = ctx.measureText(text).width + 14;
    ctx.fillStyle = focused ? '#166534' : '#5C3418';
    this.roundRect(ctx, cx - pw * 0.5, cy - 9, pw, 18, 5);
    ctx.fill();
    ctx.strokeStyle = focused ? '#FEF08A' : '#F6D38C';
    ctx.lineWidth = focused ? 2 : 1.4;
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
        ctx.lineWidth = 1.4;
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
