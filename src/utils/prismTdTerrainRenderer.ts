import {
  BiomePalette,
  getTileKind,
  gridToWorldCenter,
  TdMapDef,
  TILE_SIZE,
} from './prismTdEngine.ts';

function isRoadKind(kind: string): boolean {
  return kind === 'path' || kind === 'spawn' || kind === 'core';
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  sides: number,
  radius: number,
  rot = 0
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rot + (i * Math.PI * 2) / sides;
    const px = cx + Math.cos(a) * radius;
    const py = cy + Math.sin(a) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/**
 * Pre-bakes ultra-crisp, high-craft Bastion Citadel static terrain onto an offscreen canvas:
 * - Atmospheric multi-stop biome depth gradient & blueprint contour rings
 * - Beveled brushed-alloy tactical build pads with titanium rivets & corner reticles
 * - 3D armored barricade monoliths with chamfered plating & crystal cores
 * - Seamless neighbor-aware armored trench highway with raised curbs & directional chevrons
 * - Crystalline conductive energy pools with recessed containment rims & caustics
 */
export function bakePrismTdStaticTerrain(
  ctx: CanvasRenderingContext2D,
  map: TdMapDef,
  palette: BiomePalette
): void {
  const mapW = map.cols * TILE_SIZE;
  const mapH = map.rows * TILE_SIZE;

  // 1. Deep Atmospheric Citadel Backdrop
  const bgGrad = ctx.createRadialGradient(
    mapW * 0.5,
    mapH * 0.45,
    Math.min(mapW, mapH) * 0.08,
    mapW * 0.5,
    mapH * 0.5,
    Math.max(mapW, mapH) * 0.78
  );
  bgGrad.addColorStop(0, palette.pathFill);
  bgGrad.addColorStop(0.58, palette.bg);
  bgGrad.addColorStop(1, '#02040A');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, mapW, mapH);

  // Subtle architectural radar contour arcs & micro-grid depth
  ctx.save();
  ctx.strokeStyle = palette.gridLine;
  ctx.globalAlpha = 0.36;
  ctx.lineWidth = 1;
  const cx = mapW * 0.5;
  const cy = mapH * 0.5;
  for (const rFrac of [0.22, 0.38, 0.56]) {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(mapW, mapH) * rFrac, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Compute exact direction angle along map path for subtle embossed chevrons
  const pathDirMap = new Map<string, number>();
  for (let i = 0; i < map.path.length - 1; i++) {
    const a = map.path[i];
    const b = map.path[i + 1];
    pathDirMap.set(`${a.col},${a.row}`, Math.atan2(b.row - a.row, b.col - a.col));
  }

  // 2. Render Tiles (Empty Tactical Pads, Armored Walls, Seamless Trench Road)
  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;
      const kind = getTileKind(map, c, r);

      if (isRoadKind(kind)) {
        // Recessed Armored Trench Roadbed
        const roadGrad = ctx.createLinearGradient(x, y, x + TILE_SIZE, y + TILE_SIZE);
        roadGrad.addColorStop(0, palette.pathFill);
        roadGrad.addColorStop(0.5, 'rgba(6, 12, 26, 0.72)');
        roadGrad.addColorStop(1, palette.pathFill);
        ctx.fillStyle = palette.pathFill;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = roadGrad;
        ctx.globalAlpha = 0.42;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.globalAlpha = 1;

        // Subtle steel floor deck plate & expansion joint seam
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);

        // Embossed directional chevron along path
        const dirAngle = pathDirMap.get(`${c},${r}`);
        if (dirAngle !== undefined && kind === 'path') {
          ctx.save();
          ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
          ctx.rotate(dirAngle);
          ctx.strokeStyle = palette.pathBorder;
          ctx.globalAlpha = 0.52;
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-6, -7);
          ctx.lineTo(3, 0);
          ctx.lineTo(-6, 7);
          ctx.moveTo(2, -7);
          ctx.lineTo(11, 0);
          ctx.lineTo(2, 7);
          ctx.stroke();
          ctx.restore();
        }

        // Neighbor-aware outer armored curbs (no boxy grid seams between road tiles)
        const topRoad = r > 0 && isRoadKind(getTileKind(map, c, r - 1));
        const bottomRoad = r < map.rows - 1 && isRoadKind(getTileKind(map, c, r + 1));
        const leftRoad = c > 0 && isRoadKind(getTileKind(map, c - 1, r));
        const rightRoad = c < map.cols - 1 && isRoadKind(getTileKind(map, c + 1, r));

        ctx.save();
        if (!topRoad) {
          ctx.fillStyle = 'rgba(2, 6, 16, 0.72)';
          ctx.fillRect(x, y, TILE_SIZE, 5);
          ctx.fillStyle = palette.pathBorder;
          ctx.fillRect(x, y + 1, TILE_SIZE, 2);
        }
        if (!bottomRoad) {
          ctx.fillStyle = 'rgba(2, 6, 16, 0.76)';
          ctx.fillRect(x, y + TILE_SIZE - 5, TILE_SIZE, 5);
          ctx.fillStyle = palette.pathBorder;
          ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 2);
        }
        if (!leftRoad) {
          ctx.fillStyle = 'rgba(2, 6, 16, 0.72)';
          ctx.fillRect(x, y, 5, TILE_SIZE);
          ctx.fillStyle = palette.pathBorder;
          ctx.fillRect(x + 1, y, 2, TILE_SIZE);
        }
        if (!rightRoad) {
          ctx.fillStyle = 'rgba(2, 6, 16, 0.76)';
          ctx.fillRect(x + TILE_SIZE - 5, y, 5, TILE_SIZE);
          ctx.fillStyle = palette.pathBorder;
          ctx.fillRect(x + TILE_SIZE - 3, y, 2, TILE_SIZE);
        }
        ctx.restore();
      } else if (kind === 'wall') {
        // 3D Armored Bastion Blockade Monolith
        const pad = 4;
        const bw = TILE_SIZE - pad * 2;
        const bh = TILE_SIZE - pad * 2;

        // Ambient ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.56)';
        ctx.beginPath();
        ctx.roundRect(x + pad + 2, y + pad + 3, bw, bh, 8);
        ctx.fill();

        // Outer metallic hull with directional top-left lighting
        const wallGrad = ctx.createLinearGradient(x + pad, y + pad, x + pad + bw, y + pad + bh);
        wallGrad.addColorStop(0, palette.wallStroke);
        wallGrad.addColorStop(0.26, palette.wallFill);
        wallGrad.addColorStop(1, '#060A14');
        ctx.fillStyle = wallGrad;
        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, bw, bh, 8);
        ctx.fill();

        ctx.strokeStyle = palette.wallStroke;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Raised inner armor plate
        ctx.fillStyle = 'rgba(9, 14, 26, 0.85)';
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, TILE_SIZE - 20, TILE_SIZE - 20, 5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Recessed Biome Crystal / Barrier Emblem in Center
        const wcx = x + TILE_SIZE / 2;
        const wcy = y + TILE_SIZE / 2;
        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = 0.28;
        drawPolygon(ctx, wcx, wcy, 4, 10.5, 0);
        ctx.fill();
        ctx.globalAlpha = 0.85;
        ctx.strokeStyle = palette.accent;
        ctx.lineWidth = 1.5;
        drawPolygon(ctx, wcx, wcy, 4, 8, 0);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.65;
        drawPolygon(ctx, wcx, wcy, 4, 3, 0);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 4 Corner Steel Bolts
        ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
        for (const [bx, by] of [
          [x + 8, y + 8],
          [x + TILE_SIZE - 8, y + 8],
          [x + 8, y + TILE_SIZE - 8],
          [x + TILE_SIZE - 8, y + TILE_SIZE - 8],
        ]) {
          ctx.beginPath();
          ctx.arc(bx, by, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Beveled Brushed-Alloy Tactical Build Pad
        const pad = 3.5;
        const pw = TILE_SIZE - pad * 2;
        const ph = TILE_SIZE - pad * 2;

        const padGrad = ctx.createLinearGradient(x + pad, y + pad, x + pad + pw, y + pad + ph);
        padGrad.addColorStop(0, 'rgba(255, 255, 255, 0.045)');
        padGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.34)');
        padGrad.addColorStop(1, 'rgba(2, 6, 16, 0.56)');
        ctx.fillStyle = padGrad;
        ctx.beginPath();
        ctx.roundRect(x + pad, y + pad, pw, ph, 6);
        ctx.fill();

        // Outer hairline bevel
        ctx.strokeStyle = palette.gridLine;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top-left crisp highlight edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + pad + 0.5);
        ctx.lineTo(x + TILE_SIZE - 8, y + pad + 0.5);
        ctx.stroke();

        // Subtle precision targeting socket ring at center
        const cxTile = x + TILE_SIZE / 2;
        const cyTile = y + TILE_SIZE / 2;
        ctx.strokeStyle = palette.gridLine;
        ctx.globalAlpha = 0.65;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cxTile, cyTile, 9.5, 0, Math.PI * 2);
        ctx.stroke();

        // Fine center cross-ticks + glowing biome micro-center
        ctx.beginPath();
        ctx.moveTo(cxTile - 13, cyTile);
        ctx.lineTo(cxTile - 6, cyTile);
        ctx.moveTo(cxTile + 6, cyTile);
        ctx.lineTo(cxTile + 13, cyTile);
        ctx.moveTo(cxTile, cyTile - 13);
        ctx.lineTo(cxTile, cyTile - 6);
        ctx.moveTo(cxTile, cyTile + 6);
        ctx.lineTo(cxTile, cyTile + 13);
        ctx.stroke();

        ctx.fillStyle = palette.accent;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(cxTile, cyTile, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // 4 subtle corner rivets on empty build pads
        ctx.fillStyle = palette.gridLine;
        for (const [rx, ry] of [
          [x + 7.5, y + 7.5],
          [x + TILE_SIZE - 7.5, y + 7.5],
          [x + 7.5, y + TILE_SIZE - 7.5],
          [x + TILE_SIZE - 7.5, y + TILE_SIZE - 7.5],
        ]) {
          ctx.fillRect(rx - 0.8, ry - 0.8, 1.6, 1.6);
        }
      }
    }
  }

  // 3. Crystalline Conductive Water Basins (Pre-Baked Depth + Caustic Rim)
  for (const wz of map.wetZones) {
    const wPt = gridToWorldCenter(wz.col, wz.row);
    const basinR = TILE_SIZE * 0.43;

    // Recessed containment bezel
    ctx.fillStyle = 'rgba(2, 16, 30, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(wPt.x, wPt.y, basinR + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rich radial aqua pool depth gradient
    const poolGrad = ctx.createRadialGradient(wPt.x - 3, wPt.y - 3, 3, wPt.x, wPt.y, basinR);
    poolGrad.addColorStop(0, 'rgba(125, 211, 252, 0.56)');
    poolGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.38)');
    poolGrad.addColorStop(0.85, 'rgba(6, 95, 130, 0.34)');
    poolGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.arc(wPt.x, wPt.y, basinR, 0, Math.PI * 2);
    ctx.fill();

    // Submerged conductive circuit rune lines
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.32)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(wPt.x, wPt.y, basinR * 0.56, 0.4, 2.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wPt.x, wPt.y, basinR * 0.56, 3.5, 5.4);
    ctx.stroke();
  }

  // 4. Outer Citadel Perimeter Vignette & Beveled Frame
  const edgeGrad = ctx.createRadialGradient(
    mapW * 0.5,
    mapH * 0.5,
    Math.min(mapW, mapH) * 0.42,
    mapW * 0.5,
    mapH * 0.5,
    Math.max(mapW, mapH) * 0.72
  );
  edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeGrad.addColorStop(1, 'rgba(2, 4, 10, 0.42)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, mapW, mapH);

  ctx.strokeStyle = palette.pathBorder;
  ctx.lineWidth = 2.4;
  ctx.strokeRect(1.5, 1.5, mapW - 3, mapH - 3);
}

/**
 * Renders animated tactical path conduits, gliding energy motes, conductive water ripples,
 * counter-rotating Warp Breach Spawn Portal ("CỔNG"), and Fusion Core Reactor ("LÕI").
 */
export function drawPrismTdDynamicPathAndLandmarks(
  ctx: CanvasRenderingContext2D,
  map: TdMapDef,
  palette: BiomePalette,
  visualTime: number,
  coreHpRatio: number,
  coreShield: number,
  speedMult: number
): void {
  // 1. Dual-Layer Animated Road Energy Conduit
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Soft under-glow beam
  ctx.strokeStyle = palette.trackGlow;
  ctx.globalAlpha = 0.24;
  ctx.lineWidth = 11;
  ctx.beginPath();
  map.path.forEach((wp, i) => {
    const pt = gridToWorldCenter(wp.col, wp.row);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Flowing segmented directional pulse
  ctx.globalAlpha = 0.88;
  ctx.strokeStyle = palette.trackGlow;
  ctx.lineWidth = 3.2;
  ctx.setLineDash([12, 10]);
  ctx.lineDashOffset = -visualTime * 42;
  ctx.stroke();
  ctx.restore();

  // Flowing energy motes drifting from spawn to core
  const segCount = Math.max(1, map.path.length - 1);
  const moteCount = Math.min(8, Math.max(3, Math.floor(segCount / 3)));
  ctx.save();
  for (let m = 0; m < moteCount; m++) {
    const progress = ((visualTime * 0.16 + m / moteCount) % 1) * segCount;
    const idx = Math.min(segCount - 1, Math.floor(progress));
    const localT = progress - idx;
    const a = gridToWorldCenter(map.path[idx].col, map.path[idx].row);
    const b = gridToWorldCenter(map.path[idx + 1].col, map.path[idx + 1].row);
    const mx = a.x + (b.x - a.x) * localT;
    const my = a.y + (b.y - a.y) * localT;
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(mx, my, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Dynamic Conductive Pool Ripples + Specular Ion Shimmers
  ctx.save();
  ctx.strokeStyle = '#67E8F9';
  ctx.lineWidth = 1.4;
  for (const wz of map.wetZones) {
    const wPt = gridToWorldCenter(wz.col, wz.row);
    const ripple = (((visualTime * 0.68 + (wz.col + wz.row) * 0.23) % 1) + 1) % 1;
    ctx.globalAlpha = Math.max(0, (1 - ripple) * 0.5);
    ctx.beginPath();
    ctx.arc(wPt.x, wPt.y, Math.max(2, 5 + ripple * (TILE_SIZE * 0.35)), 0, Math.PI * 2);
    ctx.stroke();

    const spAngle = visualTime * 2.1 + wz.col;
    ctx.fillStyle = '#E0F2FE';
    ctx.globalAlpha = 0.45 + Math.sin(visualTime * 4 + wz.row) * 0.25;
    ctx.beginPath();
    ctx.arc(wPt.x + Math.cos(spAngle) * 10, wPt.y + Math.sin(spAngle) * 10, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Warp Breach Spawn Portal ("CỔNG")
  const spawnPt = gridToWorldCenter(map.path[0].col, map.path[0].row);
  const nextSpawnPt = gridToWorldCenter(map.path[1].col, map.path[1].row);
  const spawnDir = Math.atan2(nextSpawnPt.y - spawnPt.y, nextSpawnPt.x - spawnPt.x);

  ctx.save();
  ctx.translate(spawnPt.x, spawnPt.y);

  // Abyssal portal bloom
  const warpGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 25);
  warpGrad.addColorStop(0, 'rgba(254, 205, 211, 0.92)');
  warpGrad.addColorStop(0.35, 'rgba(244, 63, 94, 0.56)');
  warpGrad.addColorStop(0.75, 'rgba(159, 18, 57, 0.28)');
  warpGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = warpGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fill();

  // Outer rotating segmented iris
  ctx.save();
  ctx.rotate(visualTime * 2.1);
  ctx.strokeStyle = '#FB7185';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([9, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner counter-rotating octagon frame
  ctx.save();
  ctx.rotate(-visualTime * 1.5);
  ctx.strokeStyle = '#FDA4AF';
  ctx.lineWidth = 1.6;
  drawPolygon(ctx, 0, 0, 8, 16.5, 0);
  ctx.stroke();
  ctx.restore();

  // Directional exit arrow
  ctx.save();
  ctx.rotate(spawnDir);
  ctx.fillStyle = '#FFE4E6';
  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(19, -4.5);
  ctx.lineTo(20.5, 0);
  ctx.lineTo(19, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Crisp callsign plate
  ctx.fillStyle = 'rgba(15, 6, 16, 0.84)';
  ctx.beginPath();
  ctx.roundRect(-16, -6.5, 32, 13, 3);
  ctx.fill();
  ctx.fillStyle = '#FFE4E6';
  ctx.font = 'bold 8.5px "JetBrains Mono", "Plus Jakarta Sans", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CỔNG', 0, 0.5);
  ctx.restore();

  // 4. Armored Fusion Fortress Core ("LÕI")
  const corePt = gridToWorldCenter(
    map.path[map.path.length - 1].col,
    map.path[map.path.length - 1].row
  );
  const corePulse = speedMult > 1 ? 1 : 1 + Math.sin(visualTime * 4.2) * 0.05;
  const safeHpRatio = Math.max(0, Math.min(1, coreHpRatio));
  const coreMainColor =
    safeHpRatio > 0.6 ? '#10B981' : safeHpRatio > 0.3 ? '#F59E0B' : '#EF4444';
  const coreBrightColor =
    safeHpRatio > 0.6 ? '#A7F3D0' : safeHpRatio > 0.3 ? '#FDE68A' : '#FECACA';

  ctx.save();
  ctx.translate(corePt.x, corePt.y);

  // Reactor plasma ambient glow
  const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26 * corePulse);
  coreGrad.addColorStop(0, coreBrightColor);
  coreGrad.addColorStop(0.45, coreMainColor);
  coreGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 26 * corePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Armored hexagonal containment turbine
  ctx.save();
  ctx.rotate(-visualTime * 1.35);
  ctx.fillStyle = 'rgba(6, 20, 24, 0.9)';
  ctx.strokeStyle = coreMainColor;
  ctx.lineWidth = 2.6;
  drawPolygon(ctx, 0, 0, 6, 22 * corePulse, 0);
  ctx.fill();
  ctx.stroke();

  // 6 outward stabilizer fins
  ctx.fillStyle = coreBrightColor;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 21.5 * corePulse, Math.sin(a) * 21.5 * corePulse, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Inner spinning containment ring
  ctx.save();
  ctx.rotate(visualTime * 2.4);
  ctx.strokeStyle = coreBrightColor;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Callsign plate
  ctx.fillStyle = 'rgba(4, 18, 16, 0.88)';
  ctx.beginPath();
  ctx.roundRect(-13, -6.5, 26, 13, 3);
  ctx.fill();
  ctx.fillStyle = coreBrightColor;
  ctx.font = 'bold 9px "JetBrains Mono", "Plus Jakarta Sans", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LÕI', 0, 0.5);
  ctx.restore();

  // Aegis Core Shield Hexagonal Energy Dome
  if (coreShield > 0) {
    ctx.save();
    ctx.translate(corePt.x, corePt.y);
    ctx.rotate(visualTime * 1.1);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.92)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 2.4;
    drawPolygon(ctx, 0, 0, 6, 28 * corePulse, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
    ctx.lineWidth = 1;
    drawPolygon(ctx, 0, 0, 6, 30.5 * corePulse, Math.PI / 6);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Renders the rich animated Citadel Diorama backdrop for the Title Screen showcase canvas.
 */
export function drawPrismTdTitleShowcaseBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  // Deep Citadel radial slate backdrop
  const bg = ctx.createRadialGradient(w * 0.45, h * 0.45, 24, w * 0.5, h * 0.5, w * 0.72);
  bg.addColorStop(0, '#0E1930');
  bg.addColorStop(0.65, '#070C1A');
  bg.addColorStop(1, '#03050B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Subtle radar arcs & fine blueprint lines
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let gx = 28; gx < w; gx += 42) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 28; gy < h; gy += 42) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }
  ctx.restore();

  // Seamless armored trench road (matching Boss & Escort waypoints: (30,86) -> (350,86) -> (350,212))
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#091122';
  ctx.lineWidth = 42;
  ctx.beginPath();
  ctx.moveTo(30, 86);
  ctx.lineTo(350, 86);
  ctx.lineTo(350, 212);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.34)';
  ctx.lineWidth = 36;
  ctx.stroke();

  ctx.strokeStyle = '#111C36';
  ctx.lineWidth = 31;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -t * 36;
  ctx.stroke();
  ctx.restore();

  // Conductive Wet Energy Basin along Boss path
  const poolX = 210;
  const poolY = 86;
  const poolGrad = ctx.createRadialGradient(poolX, poolY, 4, poolX, poolY, 34);
  poolGrad.addColorStop(0, 'rgba(125, 211, 252, 0.55)');
  poolGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.28)');
  poolGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.arc(poolX, poolY, 34, 0, Math.PI * 2);
  ctx.fill();
  const ripple = (t * 0.75) % 1;
  ctx.strokeStyle = `rgba(103, 232, 249, ${(1 - ripple) * 0.55})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(poolX, poolY, 10 + ripple * 22, 0, Math.PI * 2);
  ctx.stroke();

  // Beveled Turret Foundation Pads under the 3 showcase Lv7 turrets (x=88, 185, 268; y=186)
  for (const px of [88, 185, 268]) {
    const py = 186;
    const padG = ctx.createLinearGradient(px - 26, py - 26, px + 26, py + 26);
    padG.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
    padG.addColorStop(1, 'rgba(6, 10, 20, 0.85)');
    ctx.fillStyle = padG;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(px - 26, py - 26, 52, 52, 8);
    ctx.fill();
    ctx.stroke();
  }

  // Mini Spawn Portal at (30, 86) & Mini Fusion Core at (350, 212)
  ctx.save();
  ctx.translate(30, 86);
  ctx.rotate(t * 2);
  ctx.strokeStyle = '#FB7185';
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(350, 212);
  ctx.rotate(-t * 1.5);
  ctx.strokeStyle = '#10B981';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
  ctx.lineWidth = 2;
  drawPolygon(ctx, 0, 0, 6, 16, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
