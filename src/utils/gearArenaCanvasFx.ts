import type { ComputedWeaponSpec, GearItemId } from './gearArenaEngine';

export interface RenderEnemy {
  id: number;
  kind: 'chaser' | 'bruiser' | 'kiter' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  hitFlash: number;
  slowTimer: number;
  stunTimer: number;
  burnTimer: number;
}

export interface RenderProjectile {
  fromPlayer: boolean;
  fromEnemy?: boolean;
  weaponId: GearItemId | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
}

export interface RenderLightningBolt {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: string;
}

export interface RenderLaserBeam {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
}

export interface RenderParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'ring';
}

export interface RenderExplosion {
  x: number;
  y: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  doubleRing?: boolean;
}

export interface RenderDmgFx {
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit: boolean;
  life: number;
  maxLife: number;
}

export interface RenderScorchDecal {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface ArenaRenderFrame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  now: number;
  shakeTrauma: number;
  scorchDecals: RenderScorchDecal[];
  explosions: RenderExplosion[];
  beams: RenderLaserBeam[];
  enemies: RenderEnemy[];
  particles: RenderParticle[];
  projectiles: RenderProjectile[];
  bolts: RenderLightningBolt[];
  dmgFxs: RenderDmgFx[];
  player: {
    x: number;
    y: number;
    aimAngle: number;
    hitFlash: number;
    muzzleFlash: number;
    muzzleColor: string;
    shieldGlow: number;
    chainLightningActive: boolean;
    weapons: ComputedWeaponSpec[];
  };
  ghost: {
    x: number;
    y: number;
    aimAngle: number;
    defeated: boolean;
    hitFlash: number;
    weapons: ComputedWeaponSpec[];
  };
}

function drawMetallicPolygon(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  fill: string | CanvasGradient,
  stroke: string,
  lineWidth = 1.5
) {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i += 1) {
    if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
    else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawFloorDeck(ctx: CanvasRenderingContext2D, width: number, height: number, now: number) {
  // Deep armored deck atmospheric gradient
  const bg = ctx.createRadialGradient(width * 0.5, height * 0.48, 35, width * 0.5, height * 0.5, width * 0.68);
  bg.addColorStop(0, '#101B2E');
  bg.addColorStop(0.55, '#09101D');
  bg.addColorStop(1, '#04070E');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Machined steel floor plates (92px panels)
  const tile = 92;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  for (let x = tile; x < width; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = tile; y < height; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Subtle recessed micro-grid & panel rivets
  ctx.fillStyle = 'rgba(148, 163, 184, 0.14)';
  for (let x = tile; x < width; x += tile) {
    for (let y = tile; y < height; y += tile) {
      ctx.fillRect(x - 4, y - 4, 2, 2);
      ctx.fillRect(x + 2, y + 2, 2, 2);
    }
  }

  // Subtle tactical center ring with rotating degree markers
  const cx = width / 2;
  const cy = height / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 145, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(now * 0.00018);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
  ctx.setLineDash([12, 16]);
  ctx.beginPath();
  ctx.arc(0, 0, 128, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Perimeter hazard framing
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, width - 16, height - 16);
}

function drawPlayerMech(
  ctx: CanvasRenderingContext2D,
  p: ArenaRenderFrame['player'],
  now: number
) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Ground drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(2, 10, 21, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hex energy shield barrier
  if (p.shieldGlow > 0.05) {
    ctx.save();
    ctx.rotate(now * 0.0012);
    ctx.strokeStyle = `rgba(56, 189, 248, ${Math.min(0.85, p.shieldGlow)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < 6; k += 1) {
      const a = (Math.PI / 3) * k;
      const rx = Math.cos(a) * 32;
      const ry = Math.sin(a) * 32;
      if (k === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = `rgba(34, 211, 238, ${Math.min(0.12, p.shieldGlow * 0.14)})`;
    ctx.fill();
    ctx.restore();
  }

  // Orbiting tactical weapon pods (mini turrets)
  const podCount = Math.min(6, p.weapons.length);
  for (let wi = 0; wi < podCount; wi += 1) {
    const ang = now * 0.0018 + (wi * Math.PI * 2) / Math.max(1, podCount);
    const px = Math.cos(ang) * 28;
    const py = Math.sin(ang) * 28;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.aimAngle);
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = p.weapons[wi].color;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-4, -3, 8, 6);
    ctx.strokeRect(-4, -3, 8, 6);
    ctx.fillStyle = p.weapons[wi].color;
    ctx.fillRect(3, -1.2, 5, 2.4);
    ctx.restore();
  }

  // Rotate mech chassis toward aimAngle
  ctx.save();
  ctx.rotate(p.aimAngle);

  // Rear dual thruster flames
  const flicker = 0.8 + Math.sin(now * 0.045) * 0.25;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.beginPath();
  ctx.moveTo(-14, -7);
  ctx.lineTo(-14 - 10 * flicker, -5);
  ctx.lineTo(-14, -3);
  ctx.moveTo(-14, 3);
  ctx.lineTo(-14 - 10 * flicker, 5);
  ctx.lineTo(-14, 7);
  ctx.fill();

  // Muzzle star flare on fire
  if (p.muzzleFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = p.muzzleColor;
    ctx.globalAlpha = Math.min(0.95, p.muzzleFlash * 9);
    ctx.beginPath();
    ctx.arc(22, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(22, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Dual shoulder cannons
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1;
  ctx.fillRect(4, -14, 15, 4);
  ctx.strokeRect(4, -14, 15, 4);
  ctx.fillRect(4, 10, 15, 4);
  ctx.strokeRect(4, 10, 15, 4);

  // Armored wing hull (gunmetal -> steel gradient)
  const hullGrad = ctx.createLinearGradient(-16, -18, 18, 18);
  if (p.hitFlash > 0) {
    hullGrad.addColorStop(0, '#FFFFFF');
    hullGrad.addColorStop(1, '#BAE6FD');
  } else {
    hullGrad.addColorStop(0, '#334155');
    hullGrad.addColorStop(0.45, '#1E293B');
    hullGrad.addColorStop(1, '#0F172A');
  }
  drawMetallicPolygon(
    ctx,
    [
      [20, 0],
      [7, -11],
      [-11, -17],
      [-17, -9],
      [-13, 0],
      [-17, 9],
      [-11, 17],
      [7, 11],
    ],
    hullGrad,
    p.chainLightningActive ? '#38BDF8' : '#22D3EE',
    1.8
  );

  // Armored chest cockpit & glowing visor slit
  drawMetallicPolygon(
    ctx,
    [
      [11, 0],
      [3, -6],
      [-7, -5],
      [-7, 5],
      [3, 6],
    ],
    '#0E7490',
    '#67E8F9',
    1.2
  );
  ctx.fillStyle = '#E0F2FE';
  ctx.fillRect(4, -3, 4, 6);

  ctx.restore();

  // Crisp tactical label
  ctx.font = '700 9px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#04070E';
  ctx.strokeText('CHIẾN GIÁP', 0, -27);
  ctx.fillStyle = '#67E8F9';
  ctx.fillText('CHIẾN GIÁP', 0, -27);

  ctx.restore();
}

function drawGhostMech(
  ctx: CanvasRenderingContext2D,
  g: ArenaRenderFrame['ghost'],
  now: number
) {
  if (g.defeated) return;
  ctx.save();
  ctx.translate(g.x, g.y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(2, 10, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting Ghost pods
  const podCount = Math.min(5, g.weapons.length);
  for (let wi = 0; wi < podCount; wi += 1) {
    const ang = -now * 0.0018 + (wi * Math.PI * 2) / Math.max(1, podCount);
    ctx.fillStyle = '#F43F5E';
    ctx.strokeStyle = '#FDA4AF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * 27, Math.sin(ang) * 27, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(g.aimAngle);

  // Crimson plasma exhaust
  const flicker = 0.85 + Math.cos(now * 0.05) * 0.25;
  ctx.fillStyle = 'rgba(244, 63, 94, 0.78)';
  ctx.beginPath();
  ctx.moveTo(-15, -5);
  ctx.lineTo(-15 - 11 * flicker, 0);
  ctx.lineTo(-15, 5);
  ctx.fill();

  // Swept-forward obsidian & crimson stealth hull
  const ghostGrad = ctx.createLinearGradient(-16, -18, 18, 18);
  if (g.hitFlash > 0) {
    ghostGrad.addColorStop(0, '#FFFFFF');
    ghostGrad.addColorStop(1, '#FECDD3');
  } else {
    ghostGrad.addColorStop(0, '#4C0519');
    ghostGrad.addColorStop(0.5, '#271324');
    ghostGrad.addColorStop(1, '#110915');
  }
  drawMetallicPolygon(
    ctx,
    [
      [21, -7],
      [11, -16],
      [-14, -15],
      [-18, -5],
      [-11, 0],
      [-18, 5],
      [-14, 15],
      [11, 16],
      [21, 7],
      [10, 0],
    ],
    ghostGrad,
    '#FB7185',
    1.8
  );

  // Glowing reactor eye
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(1, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF1F2';
  ctx.beginPath();
  ctx.arc(2.5, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.font = '700 9px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#04070E';
  ctx.strokeText('BÓNG MA PvP', 0, -27);
  ctx.fillStyle = '#FDA4AF';
  ctx.fillText('BÓNG MA PvP', 0, -27);

  ctx.restore();
}

function drawEnemyUnit(
  ctx: CanvasRenderingContext2D,
  en: RenderEnemy,
  playerX: number,
  playerY: number,
  now: number
) {
  ctx.save();
  ctx.translate(en.x, en.y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(2, en.radius * 0.65, en.radius * 0.95, en.radius * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  const aimAng = Math.atan2(playerY - en.y, playerX - en.x);
  const flash = en.hitFlash > 0;
  const chilled = en.slowTimer > 0;

  if (en.kind === 'boss') {
    // Rotating armored shield ring
    ctx.save();
    ctx.rotate(now * 0.0014);
    ctx.strokeStyle = flash ? '#FFFFFF' : '#F59E0B';
    ctx.lineWidth = 3;
    for (let s = 0; s < 4; s += 1) {
      const a0 = (s * Math.PI) / 2 + 0.16;
      const a1 = ((s + 1) * Math.PI) / 2 - 0.16;
      ctx.beginPath();
      ctx.arc(0, 0, en.radius + 7, a0, a1);
      ctx.stroke();
    }
    ctx.restore();

    // Boss armored hull facing player
    ctx.save();
    ctx.rotate(aimAng);
    // Heavy twin shoulder cannons
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.fillRect(6, -en.radius * 0.82, 22, 6);
    ctx.strokeRect(6, -en.radius * 0.82, 22, 6);
    ctx.fillRect(6, en.radius * 0.82 - 6, 22, 6);
    ctx.strokeRect(6, en.radius * 0.82 - 6, 22, 6);

    const bossGrad = ctx.createRadialGradient(4, 0, 4, 0, 0, en.radius);
    if (flash) {
      bossGrad.addColorStop(0, '#FFFFFF');
      bossGrad.addColorStop(1, '#FDE68A');
    } else if (chilled) {
      bossGrad.addColorStop(0, '#38BDF8');
      bossGrad.addColorStop(1, '#1E3A8A');
    } else {
      bossGrad.addColorStop(0, '#9F1239');
      bossGrad.addColorStop(0.65, '#4C0519');
      bossGrad.addColorStop(1, '#18181B');
    }
    const r = en.radius;
    drawMetallicPolygon(
      ctx,
      [
        [r * 1.05, 0],
        [r * 0.65, -r * 0.72],
        [-r * 0.45, -r * 0.95],
        [-r * 0.95, -r * 0.45],
        [-r * 0.75, 0],
        [-r * 0.95, r * 0.45],
        [-r * 0.45, r * 0.95],
        [r * 0.65, r * 0.72],
      ],
      bossGrad,
      '#FACC15',
      2.2
    );

    // Reactor core
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(2, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Boss HP Bar
    const bw = 64;
    ctx.fillStyle = '#090D16';
    ctx.fillRect(-bw / 2 - 1, -en.radius - 17, bw + 2, 7);
    ctx.fillStyle = '#E11D48';
    ctx.fillRect(-bw / 2, -en.radius - 16, bw * Math.max(0, en.hp / en.maxHp), 5);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1;
    ctx.strokeRect(-bw / 2 - 1, -en.radius - 17, bw + 2, 7);
  } else if (en.kind === 'bruiser') {
    // Heavy armored hex tank
    ctx.save();
    ctx.rotate(aimAng);
    const g = ctx.createLinearGradient(-en.radius, -en.radius, en.radius, en.radius);
    if (flash) {
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, '#FDE68A');
    } else if (chilled) {
      g.addColorStop(0, '#7DD3FC');
      g.addColorStop(1, '#1E3A8A');
    } else {
      g.addColorStop(0, '#78350F');
      g.addColorStop(0.5, '#451A03');
      g.addColorStop(1, '#1C1917');
    }
    const r = en.radius;
    drawMetallicPolygon(
      ctx,
      [
        [r, -r * 0.45],
        [r, r * 0.45],
        [0, r * 0.95],
        [-r, r * 0.65],
        [-r, -r * 0.65],
        [0, -r * 0.95],
      ],
      g,
      chilled ? '#38BDF8' : '#F59E0B',
      1.6
    );
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, -2.5, r + 4, 5);
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(-2, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (en.kind === 'kiter') {
    // Stealth plasma gunship
    ctx.save();
    ctx.rotate(aimAng);
    const g = ctx.createLinearGradient(-en.radius, 0, en.radius, 0);
    if (flash) {
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, '#E9D5FF');
    } else if (chilled) {
      g.addColorStop(0, '#BAE6FD');
      g.addColorStop(1, '#0369A1');
    } else {
      g.addColorStop(0, '#581C87');
      g.addColorStop(1, '#1E1B4B');
    }
    const r = en.radius;
    drawMetallicPolygon(
      ctx,
      [
        [r * 1.15, 0],
        [-r * 0.65, -r * 0.95],
        [-r * 0.3, 0],
        [-r * 0.65, r * 0.95],
      ],
      g,
      chilled ? '#38BDF8' : '#C084FC',
      1.5
    );
    ctx.fillStyle = '#E879F9';
    ctx.beginPath();
    ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Swept interceptor chaser drone
    ctx.save();
    ctx.rotate(aimAng);
    const g = ctx.createLinearGradient(-en.radius, 0, en.radius, 0);
    if (flash) {
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, '#FECDD3');
    } else if (chilled) {
      g.addColorStop(0, '#BAE6FD');
      g.addColorStop(1, '#075985');
    } else {
      g.addColorStop(0, '#9F1239');
      g.addColorStop(1, '#27272A');
    }
    const r = en.radius;
    drawMetallicPolygon(
      ctx,
      [
        [r * 1.2, 0],
        [-r * 0.7, -r * 0.85],
        [-r * 0.4, 0],
        [-r * 0.7, r * 0.85],
      ],
      g,
      chilled ? '#38BDF8' : '#FB7185',
      1.4
    );
    ctx.fillStyle = '#FDA4AF';
    ctx.fillRect(-1, -1.5, 4, 3);
    ctx.restore();
  }

  // Cryo Frost crystal ring & Burn ember aura
  if (en.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (en.burnTimer > 0) {
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 3, now * 0.008, now * 0.008 + Math.PI);
    ctx.stroke();
  }
  if (en.stunTimer > 0) {
    ctx.fillStyle = '#FACC15';
    ctx.font = '700 11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡CHOÁNG', 0, -en.radius - 7);
  }

  ctx.restore();
}

export function renderGearArenaFrame(frame: ArenaRenderFrame): void {
  const { ctx, width, height, now } = frame;
  ctx.save();

  const shakePx = frame.shakeTrauma * frame.shakeTrauma * 9;
  if (shakePx > 0.3) {
    ctx.translate((Math.random() - 0.5) * shakePx, (Math.random() - 0.5) * shakePx);
  }

  // 1. Armored Hangar Floor
  drawFloorDeck(ctx, width, height, now);

  // 2. Ground Scorch Decals from explosions
  for (const sc of frame.scorchDecals) {
    const alpha = Math.max(0, (sc.life / sc.maxLife) * 0.42);
    ctx.save();
    const g = ctx.createRadialGradient(sc.x, sc.y, 2, sc.x, sc.y, sc.radius);
    g.addColorStop(0, `rgba(2, 6, 12, ${alpha})`);
    g.addColorStop(0.65, `rgba(15, 23, 42, ${alpha * 0.6})`);
    g.addColorStop(1, 'rgba(2, 6, 12, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Multi-layered Blast Shockwaves
  for (const ex of frame.explosions) {
    const p = 1 - ex.life / ex.maxLife;
    const curR = Math.max(4, ex.radius * (0.25 + p * 0.8));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(ex.x, ex.y, curR * 0.1, ex.x, ex.y, curR);
    grad.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0, (1 - p) * 0.55)})`);
    grad.addColorStop(0.45, ex.color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = Math.max(0, (1 - p) * 0.65);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, curR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ex.color;
    ctx.globalAlpha = 1 - p;
    ctx.lineWidth = ex.doubleRing ? 3.5 : 2.2;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, curR, 0, Math.PI * 2);
    ctx.stroke();

    if (ex.doubleRing) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = (1 - p) * 0.8;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, Math.max(2, curR * 0.55), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Instant Railgun Electromagnetic Beams
  for (const b of frame.beams) {
    const alpha = b.life / b.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = alpha * 0.42;
    ctx.lineWidth = b.width * 3.8;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.globalAlpha = alpha;
    ctx.lineWidth = b.width * 0.95;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Armored Enemies & Boss
  for (const en of frame.enemies) {
    drawEnemyUnit(ctx, en, frame.player.x, frame.player.y, now);
  }

  // 6. Glowing Particles & Sparks
  for (const pt of frame.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (pt.shape === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = Math.max(1.2, pt.size * 0.75);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x - pt.vx * 0.025, pt.y - pt.vy * 0.025);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. Weapon-Distinct Energy & Ballistic Projectiles
  for (const p of frame.projectiles) {
    ctx.save();
    const ang = Math.atan2(p.vy, p.vx);

    if (p.weaponId === 'chain_saw') {
      ctx.translate(p.x, p.y);
      ctx.rotate(now * 0.03);
      ctx.fillStyle = '#CBD5E1';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let t = 0; t < 12; t += 1) {
        const a = (Math.PI * 2 * t) / 12;
        const rad = t % 2 === 0 ? p.radius + 2 : p.radius * 0.55;
        if (t === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.weaponId === 'nova_cannon') {
      ctx.translate(p.x, p.y);
      ctx.globalCompositeOperation = 'lighter';
      const ng = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius + 8);
      ng.addColorStop(0, '#FFFFFF');
      ng.addColorStop(0.45, '#C084FC');
      ng.addColorStop(1, 'rgba(168, 85, 247, 0)');
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E9D5FF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 3, now * 0.015, now * 0.015 + Math.PI * 1.3);
      ctx.stroke();
    } else if (p.weaponId === 'homing_missile') {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-7, -2, 11, 4);
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(3, -2.5);
      ctx.lineTo(3, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(-8, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.weaponId === 'frost_rifle') {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-1, 0);
      ctx.lineTo(-4, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-1, -1, 7, 2);
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = Math.max(2, p.radius * 1.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.036, p.y - p.vy * 0.036);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, p.radius * 0.45), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Chain Lightning Jagged Arcs
  for (const b of frame.bolts) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 5;
    ctx.globalAlpha = (b.life / b.maxLife) * 0.45;
    ctx.beginPath();
    for (let idx = 0; idx < b.points.length; idx += 1) {
      const pt = b.points[idx];
      if (idx === 0) ctx.moveTo(pt.x, pt.y);
      else {
        const prev = b.points[idx - 1];
        const mx = (prev.x + pt.x) / 2 + (Math.random() - 0.5) * 20;
        const my = (prev.y + pt.y) / 2 + (Math.random() - 0.5) * 20;
        ctx.lineTo(mx, my);
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = b.life / b.maxLife;
    ctx.stroke();
    ctx.restore();
  }

  // 9. Player & Ghost Armored Mechs
  drawPlayerMech(ctx, frame.player, now);
  drawGhostMech(ctx, frame.ghost, now);

  // 10. Crisp Outlined Floating Damage Numbers
  for (const fx of frame.dmgFxs) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.life / (fx.maxLife * 0.6));
    ctx.font = fx.isCrit ? '800 13px ui-monospace, monospace' : '700 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#04070E';
    ctx.strokeText(fx.text, fx.x, fx.y);
    ctx.fillStyle = fx.color;
    ctx.fillText(fx.text, fx.x, fx.y);
    ctx.restore();
  }

  ctx.restore();
}
