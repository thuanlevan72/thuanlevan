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
    empCount?: number;
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
  // Deep armored forge hangar gradient with subtle center turbine illumination
  const bg = ctx.createRadialGradient(width * 0.5, height * 0.48, 30, width * 0.5, height * 0.5, width * 0.72);
  bg.addColorStop(0, '#13213A');
  bg.addColorStop(0.45, '#0B1324');
  bg.addColorStop(0.85, '#060A15');
  bg.addColorStop(1, '#03050A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Heavy industrial steel floor plates (92px panels) with alternating brushed metallic shade
  const tile = 92;
  for (let gx = 0; gx < width; gx += tile) {
    for (let gy = 0; gy < height; gy += tile) {
      const checker = ((gx / tile + gy / tile) | 0) % 2 === 0;
      ctx.fillStyle = checker ? 'rgba(148, 163, 184, 0.025)' : 'rgba(15, 23, 42, 0.16)';
      ctx.fillRect(gx + 2, gy + 2, tile - 4, tile - 4);
      // Top-edge metallic specular hairline per deck plate
      ctx.fillStyle = 'rgba(226, 232, 240, 0.05)';
      ctx.fillRect(gx + 3, gy + 2, tile - 6, 1);
    }
  }

  // Machined bevel seam lines + steel floor rivets
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.16)';
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

  ctx.fillStyle = 'rgba(203, 213, 225, 0.2)';
  for (let x = tile; x < width; x += tile) {
    for (let y = tile; y < height; y += tile) {
      ctx.beginPath();
      ctx.arc(x - 5, y - 5, 1.3, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 5, 1.3, 0, Math.PI * 2);
      ctx.arc(x - 5, y + 5, 1.3, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Central Recessed Reactor Turbine Ring (rotating gears + degree ticks)
  const cx = width / 2;
  const cy = height / 2;
  ctx.save();
  ctx.translate(cx, cy);

  const pitGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 155);
  pitGrad.addColorStop(0, 'rgba(14, 165, 233, 0.12)');
  pitGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.22)');
  pitGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = pitGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 155, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 150, 0, Math.PI * 2);
  ctx.stroke();

  // Outer rotating gear ring
  ctx.save();
  ctx.rotate(now * 0.00022);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, 134, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner counter-rotating turbine blades
  ctx.save();
  ctx.rotate(-now * 0.00045);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
  ctx.lineWidth = 2;
  for (let b = 0; b < 8; b += 1) {
    const ba = (b * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ba) * 32, Math.sin(ba) * 32);
    ctx.lineTo(Math.cos(ba) * 116, Math.sin(ba) * 116);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();

  // Corner Industrial Hazard Brackets & Perimeter Rail
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.strokeStyle = 'rgba(250, 204, 21, 0.36)';
  ctx.lineWidth = 2.5;
  const cLen = 28;
  const corners: [number, number, number, number][] = [
    [10, 10, 1, 1],
    [width - 10, 10, -1, 1],
    [10, height - 10, 1, -1],
    [width - 10, height - 10, -1, -1],
  ];
  for (const [bx, by, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(bx, by + sy * cLen);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + sx * cLen, by);
    ctx.stroke();
  }
}

function drawPlayerMech(
  ctx: CanvasRenderingContext2D,
  p: ArenaRenderFrame['player'],
  now: number
) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Soft volumetric floor spotlight shadow
  const shGrad = ctx.createRadialGradient(2, 11, 4, 2, 11, 28);
  shGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  shGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(2, 11, 27, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Multi-layer Hex Energy Shield Barrier
  if (p.shieldGlow > 0.05) {
    ctx.save();
    ctx.rotate(now * 0.0012);
    const shieldAlpha = Math.min(0.9, p.shieldGlow);
    ctx.strokeStyle = `rgba(103, 232, 249, ${shieldAlpha})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let k = 0; k < 6; k += 1) {
      const a = (Math.PI / 3) * k;
      const rx = Math.cos(a) * 35;
      const ry = Math.sin(a) * 35;
      if (k === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();

    const shieldGrad = ctx.createRadialGradient(0, 0, 16, 0, 0, 36);
    shieldGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
    shieldGrad.addColorStop(0.75, `rgba(56, 189, 248, ${Math.min(0.16, p.shieldGlow * 0.16)})`);
    shieldGrad.addColorStop(1, `rgba(186, 230, 253, ${Math.min(0.28, p.shieldGlow * 0.25)})`);
    ctx.fillStyle = shieldGrad;
    ctx.fill();
    ctx.restore();
  }

  // Orbiting Articulated Weapon Drones / Pods
  const podCount = Math.min(6, p.weapons.length);
  for (let wi = 0; wi < podCount; wi += 1) {
    const ang = now * 0.0019 + (wi * Math.PI * 2) / Math.max(1, podCount);
    const px = Math.cos(ang) * 31;
    const py = Math.sin(ang) * 31;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.aimAngle);
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = p.weapons[wi].color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(-5, -3.5, 10, 7, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.weapons[wi].color;
    ctx.fillRect(4, -1.3, 6, 2.6);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-2, -1.2, 2.4, 2.4);
    ctx.restore();
  }

  // Rotate Heavy Mech Chassis toward target
  const recoilPush = p.muzzleFlash > 0 ? -Math.min(3.5, p.muzzleFlash * 38) : 0;
  ctx.save();
  ctx.rotate(p.aimAngle);
  ctx.translate(recoilPush, 0);

  // Dual Ion Thruster Plumes
  const flicker = 0.8 + Math.sin(now * 0.05) * 0.25;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const thrGrad = ctx.createLinearGradient(-14, 0, -28 * flicker, 0);
  thrGrad.addColorStop(0, '#FFFFFF');
  thrGrad.addColorStop(0.35, '#38BDF8');
  thrGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = thrGrad;
  for (const ty of [-6, 6]) {
    ctx.beginPath();
    ctx.moveTo(-14, ty - 2.6);
    ctx.lineTo(-14 - 14 * flicker, ty);
    ctx.lineTo(-14, ty + 2.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Muzzle Shock Flare
  if (p.muzzleFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mfAlpha = Math.min(1, p.muzzleFlash * 11);
    ctx.globalAlpha = mfAlpha;
    const mg = ctx.createRadialGradient(24, 0, 1, 24, 0, 14);
    mg.addColorStop(0, '#FFFFFF');
    mg.addColorStop(0.38, p.muzzleColor);
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(24, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Heavy Rail-Mounted Shoulder Cannons with Brushed Steel & Cooling Fins
  for (const sy of [-15, 11]) {
    const gunGrad = ctx.createLinearGradient(2, sy, 21, sy + 5);
    gunGrad.addColorStop(0, '#64748B');
    gunGrad.addColorStop(0.5, '#334155');
    gunGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = gunGrad;
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.fillRect(3, sy, 18, 4.5);
    ctx.strokeRect(3, sy, 18, 4.5);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(18, sy + 1, 3, 2.5);
  }

  // Armored Machined Titanium Wing Hull
  const hullGrad = ctx.createLinearGradient(-18, -19, 20, 19);
  if (p.hitFlash > 0) {
    hullGrad.addColorStop(0, '#FFFFFF');
    hullGrad.addColorStop(1, '#BAE6FD');
  } else {
    hullGrad.addColorStop(0, '#64748B');
    hullGrad.addColorStop(0.35, '#334155');
    hullGrad.addColorStop(0.7, '#1E293B');
    hullGrad.addColorStop(1, '#0B1220');
  }
  drawMetallicPolygon(
    ctx,
    [
      [22, 0],
      [8, -12],
      [-11, -19],
      [-18, -10],
      [-13, 0],
      [-18, 10],
      [-11, 19],
      [8, 12],
    ],
    hullGrad,
    p.chainLightningActive ? '#38BDF8' : '#22D3EE',
    1.8
  );

  // Inner Armor Seam Lines + Specular Edge Highlight
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-10, -15);
  ctx.lineTo(14, -4);
  ctx.moveTo(-10, 15);
  ctx.lineTo(14, 4);
  ctx.stroke();

  // Armored Cockpit Canopy + Glowing Optics Visor + Arc Reactor Core
  const canopyGrad = ctx.createLinearGradient(-7, -7, 12, 7);
  canopyGrad.addColorStop(0, '#22D3EE');
  canopyGrad.addColorStop(0.5, '#0E7490');
  canopyGrad.addColorStop(1, '#083344');
  drawMetallicPolygon(
    ctx,
    [
      [13, 0],
      [4, -7],
      [-8, -5.5],
      [-8, 5.5],
      [4, 7],
    ],
    canopyGrad,
    '#67E8F9',
    1.3
  );
  ctx.fillStyle = '#ECFEFF';
  ctx.fillRect(5, -3.5, 4.2, 7);
  ctx.fillStyle = p.chainLightningActive ? '#FDE047' : '#38BDF8';
  ctx.beginPath();
  ctx.arc(-2, 0, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Tactile HUD Tag
  ctx.font = '700 9.5px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = '#03060C';
  ctx.strokeText('CHIẾN GIÁP', 0, -30);
  ctx.fillStyle = '#67E8F9';
  ctx.fillText('CHIẾN GIÁP', 0, -30);

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

  const shGrad = ctx.createRadialGradient(2, 11, 4, 2, 11, 28);
  shGrad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  shGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.ellipse(2, 11, 27, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting Obsidian-Crimson Drones
  const podCount = Math.min(5, g.weapons.length);
  for (let wi = 0; wi < podCount; wi += 1) {
    const ang = -now * 0.0019 + (wi * Math.PI * 2) / Math.max(1, podCount);
    ctx.fillStyle = '#4C0519';
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * 29, Math.sin(ang) * 29, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFF1F2';
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * 29, Math.sin(ang) * 29, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.rotate(g.aimAngle);

  // Crimson Ion Exhaust
  const flicker = 0.85 + Math.cos(now * 0.055) * 0.25;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const thr = ctx.createLinearGradient(-15, 0, -28 * flicker, 0);
  thr.addColorStop(0, '#FECDD3');
  thr.addColorStop(0.4, '#F43F5E');
  thr.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = thr;
  ctx.beginPath();
  ctx.moveTo(-15, -5.5);
  ctx.lineTo(-15 - 14 * flicker, 0);
  ctx.lineTo(-15, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Swept-Forward Stealth Blade Chassis
  const ghostGrad = ctx.createLinearGradient(-18, -19, 22, 19);
  if (g.hitFlash > 0) {
    ghostGrad.addColorStop(0, '#FFFFFF');
    ghostGrad.addColorStop(1, '#FECDD3');
  } else {
    ghostGrad.addColorStop(0, '#881337');
    ghostGrad.addColorStop(0.45, '#3B071E');
    ghostGrad.addColorStop(1, '#110915');
  }
  drawMetallicPolygon(
    ctx,
    [
      [23, -7],
      [11, -18],
      [-14, -16],
      [-19, -5],
      [-11, 0],
      [-19, 5],
      [-14, 16],
      [11, 18],
      [23, 7],
      [11, 0],
    ],
    ghostGrad,
    '#FB7185',
    1.8
  );

  // Glowing Reactor Eye
  const coreG = ctx.createRadialGradient(1, 0, 1, 1, 0, 6.5);
  coreG.addColorStop(0, '#FFFFFF');
  coreG.addColorStop(0.45, '#F43F5E');
  coreG.addColorStop(1, '#4C0519');
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(1, 0, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.font = '700 9.5px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = '#03060C';
  ctx.strokeText('BÓNG MA PvP', 0, -30);
  ctx.fillStyle = '#FDA4AF';
  ctx.fillText('BÓNG MA PvP', 0, -30);

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

  // Ground Ambient Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
  ctx.beginPath();
  ctx.ellipse(2, en.radius * 0.68, en.radius * 0.98, en.radius * 0.56, 0, 0, Math.PI * 2);
  ctx.fill();

  const aimAng = Math.atan2(playerY - en.y, playerX - en.x);
  const flash = en.hitFlash > 0;
  const chilled = en.slowTimer > 0;

  if (en.kind === 'boss') {
    // Rotating 6-Segment Imperial Aegis Shield Ring
    ctx.save();
    ctx.rotate(now * 0.0016);
    ctx.strokeStyle = flash ? '#FFFFFF' : '#FACC15';
    ctx.lineWidth = 3.2;
    for (let s = 0; s < 6; s += 1) {
      const a0 = (s * Math.PI * 2) / 6 + 0.14;
      const a1 = ((s + 1) * Math.PI * 2) / 6 - 0.14;
      ctx.beginPath();
      ctx.arc(0, 0, en.radius + 9, a0, a1);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(aimAng);
    // Heavy Dual Vulcan Sponsons with Muzzle Tips
    for (const sy of [-en.radius * 0.86, en.radius * 0.86 - 7]) {
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.fillRect(5, sy, 25, 7);
      ctx.strokeRect(5, sy, 25, 7);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(26, sy + 1.5, 4, 4);
    }

    const bossGrad = ctx.createRadialGradient(5, 0, 4, 0, 0, en.radius * 1.1);
    if (flash) {
      bossGrad.addColorStop(0, '#FFFFFF');
      bossGrad.addColorStop(1, '#FDE68A');
    } else if (chilled) {
      bossGrad.addColorStop(0, '#38BDF8');
      bossGrad.addColorStop(1, '#1E3A8A');
    } else {
      bossGrad.addColorStop(0, '#BE123C');
      bossGrad.addColorStop(0.55, '#4C0519');
      bossGrad.addColorStop(1, '#18181B');
    }
    const r = en.radius;
    drawMetallicPolygon(
      ctx,
      [
        [r * 1.12, 0],
        [r * 0.72, -r * 0.78],
        [-r * 0.45, -r],
        [-r, -r * 0.48],
        [-r * 0.78, 0],
        [-r, r * 0.48],
        [-r * 0.45, r],
        [r * 0.72, r * 0.78],
      ],
      bossGrad,
      '#FACC15',
      2.4
    );

    // Armored Plating Rib Lines
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.42)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.68);
    ctx.lineTo(r * 0.55, -r * 0.3);
    ctx.moveTo(-r * 0.55, r * 0.68);
    ctx.lineTo(r * 0.55, r * 0.3);
    ctx.stroke();

    // Pulsing Unstable Furnace Core
    const pulse = 1 + Math.sin(now * 0.014) * 0.14;
    const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 10 * pulse);
    coreGrad.addColorStop(0, '#FFFFFF');
    coreGrad.addColorStop(0.45, '#FDE047');
    coreGrad.addColorStop(1, '#E11D48');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Beveled Boss HP Bar
    const bw = 72;
    ctx.fillStyle = '#04070F';
    ctx.fillRect(-bw / 2 - 1.5, -en.radius - 20, bw + 3, 8);
    const hpGrad = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    hpGrad.addColorStop(0, '#F43F5E');
    hpGrad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(-bw / 2, -en.radius - 18.5, bw * Math.max(0, en.hp / en.maxHp), 5);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.1;
    ctx.strokeRect(-bw / 2 - 1.5, -en.radius - 20, bw + 3, 8);
  } else if (en.kind === 'bruiser') {
    // Caterpillar Armored Siege Tank
    ctx.save();
    ctx.rotate(aimAng);
    const r = en.radius;
    // Tank treads
    ctx.fillStyle = '#1C1917';
    ctx.strokeStyle = '#78716C';
    ctx.lineWidth = 1;
    ctx.fillRect(-r * 0.9, -r * 0.98, r * 1.8, 4.5);
    ctx.strokeRect(-r * 0.9, -r * 0.98, r * 1.8, 4.5);
    ctx.fillRect(-r * 0.9, r * 0.98 - 4.5, r * 1.8, 4.5);
    ctx.strokeRect(-r * 0.9, r * 0.98 - 4.5, r * 1.8, 4.5);

    const g = ctx.createLinearGradient(-r, -r, r, r);
    if (flash) {
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, '#FDE68A');
    } else if (chilled) {
      g.addColorStop(0, '#7DD3FC');
      g.addColorStop(1, '#1E3A8A');
    } else {
      g.addColorStop(0, '#92400E');
      g.addColorStop(0.55, '#451A03');
      g.addColorStop(1, '#1C1917');
    }
    drawMetallicPolygon(
      ctx,
      [
        [r, -r * 0.48],
        [r, r * 0.48],
        [0, r * 0.92],
        [-r, r * 0.65],
        [-r, -r * 0.65],
        [0, -r * 0.92],
      ],
      g,
      chilled ? '#38BDF8' : '#F59E0B',
      1.6
    );
    // Twin turret barrel
    ctx.fillStyle = '#D97706';
    ctx.fillRect(0, -3.5, r + 5, 2.5);
    ctx.fillRect(0, 1, r + 5, 2.5);
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath();
    ctx.arc(-2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (en.kind === 'kiter') {
    // Stealth Plasma Interceptor
    ctx.save();
    ctx.rotate(aimAng);
    const r = en.radius;
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    if (flash) {
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, '#E9D5FF');
    } else if (chilled) {
      g.addColorStop(0, '#BAE6FD');
      g.addColorStop(1, '#0369A1');
    } else {
      g.addColorStop(0, '#7E22CE');
      g.addColorStop(1, '#1E1B4B');
    }
    drawMetallicPolygon(
      ctx,
      [
        [r * 1.2, 0],
        [-r * 0.65, -r],
        [-r * 0.28, 0],
        [-r * 0.65, r],
      ],
      g,
      chilled ? '#38BDF8' : '#C084FC',
      1.5
    );
    ctx.fillStyle = '#F0ABFC';
    ctx.beginPath();
    ctx.arc(2.5, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Swept Serrated Chaser Saw-Drone
    ctx.save();
    ctx.rotate(aimAng);
    const r = en.radius;
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    if (flash) {
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(1, '#FECDD3');
    } else if (chilled) {
      g.addColorStop(0, '#BAE6FD');
      g.addColorStop(1, '#075985');
    } else {
      g.addColorStop(0, '#BE123C');
      g.addColorStop(1, '#27272A');
    }
    drawMetallicPolygon(
      ctx,
      [
        [r * 1.25, 0],
        [-r * 0.68, -r * 0.88],
        [-r * 0.36, 0],
        [-r * 0.68, r * 0.88],
      ],
      g,
      chilled ? '#38BDF8' : '#FB7185',
      1.4
    );
    ctx.fillStyle = '#FDA4AF';
    ctx.fillRect(0, -1.6, 4.5, 3.2);
    ctx.restore();
  }

  // Subdued health bar on damaged heavy/kiter enemies
  if (en.kind !== 'boss' && en.hp < en.maxHp) {
    const w = Math.max(18, en.radius * 1.9);
    ctx.fillStyle = 'rgba(4, 7, 15, 0.85)';
    ctx.fillRect(-w / 2, -en.radius - 9, w, 3.5);
    ctx.fillStyle = '#FB7185';
    ctx.fillRect(-w / 2, -en.radius - 9, w * Math.max(0, en.hp / en.maxHp), 3.5);
  }

  // Cryo Crystal Frost Ring & Burn Ember Arc
  if (en.slowTimer > 0) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (en.burnTimer > 0) {
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 3.5, now * 0.01, now * 0.01 + Math.PI * 1.2);
    ctx.stroke();
  }
  if (en.stunTimer > 0) {
    ctx.fillStyle = '#FACC15';
    ctx.font = '700 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡CHOÁNG', 0, -en.radius - 11);
  }

  ctx.restore();
}

export function renderGearArenaFrame(frame: ArenaRenderFrame): void {
  const { ctx, width, height, now } = frame;
  ctx.save();

  const shakePx = frame.shakeTrauma * frame.shakeTrauma * 10;
  if (shakePx > 0.3) {
    ctx.translate((Math.random() - 0.5) * shakePx, (Math.random() - 0.5) * shakePx);
  }

  // 1. Armored Forge Hangar Deck
  drawFloorDeck(ctx, width, height, now);

  // 2. Ground Scorch Decals from heavy blasts
  for (const sc of frame.scorchDecals) {
    const alpha = Math.max(0, (sc.life / sc.maxLife) * 0.48);
    ctx.save();
    const g = ctx.createRadialGradient(sc.x, sc.y, 2, sc.x, sc.y, sc.radius);
    g.addColorStop(0, `rgba(2, 6, 12, ${alpha})`);
    g.addColorStop(0.65, `rgba(30, 41, 59, ${alpha * 0.55})`);
    g.addColorStop(1, 'rgba(2, 6, 12, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Multi-Layered Shockwaves, EMP Pulses & Explosions
  for (const ex of frame.explosions) {
    const p = 1 - ex.life / ex.maxLife;
    const curR = Math.max(4, ex.radius * (0.22 + p * 0.82));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(ex.x, ex.y, curR * 0.08, ex.x, ex.y, curR);
    grad.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0, (1 - p) * 0.65)})`);
    grad.addColorStop(0.45, ex.color);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = Math.max(0, (1 - p) * 0.72);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, curR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ex.color;
    ctx.globalAlpha = 1 - p;
    ctx.lineWidth = ex.doubleRing ? 4 : 2.5;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, curR, 0, Math.PI * 2);
    ctx.stroke();

    if (ex.doubleRing) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = (1 - p) * 0.85;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, Math.max(2, curR * 0.6), 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = ex.color;
      ctx.globalAlpha = (1 - p) * 0.55;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, Math.max(2, curR * 0.85), p * 3, p * 3 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // 4. Mach-Ring Electromagnetic Railgun Beams
  for (const b of frame.beams) {
    const alpha = b.life / b.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    ctx.strokeStyle = b.color;
    ctx.globalAlpha = alpha * 0.48;
    ctx.lineWidth = b.width * 4.2;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.strokeStyle = '#E0E7FF';
    ctx.globalAlpha = alpha * 0.82;
    ctx.lineWidth = b.width * 1.8;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1.5, b.width * 0.85);
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();

    // Mach shockwave ellipses along beam
    const bAng = Math.atan2(b.y2 - b.y1, b.x2 - b.x1);
    for (let m = 1; m <= 4; m += 1) {
      const frac = m * 0.19;
      const mx = b.x1 + (b.x2 - b.x1) * frac;
      const my = b.y1 + (b.y2 - b.y1) * frac;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(bAng);
      ctx.globalAlpha = alpha * 0.72;
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, (13 - m * 1.5) * (1.25 - alpha * 0.35), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  // 5. Armored Enemies & Dreadnought Bosses
  for (const en of frame.enemies) {
    drawEnemyUnit(ctx, en, frame.player.x, frame.player.y, now);
  }

  // 6. Glowing Particles, Rings & High-Velocity Sparks
  for (const pt of frame.particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (pt.shape === 'spark') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = Math.max(1.3, pt.size * 0.85);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x - pt.vx * 0.032, pt.y - pt.vy * 0.032);
      ctx.stroke();
    } else if (pt.shape === 'ring') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = pt.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (2.4 - alpha), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 7. Weapon-Distinct Energy, Cryo, Buzzsaw & Missile Projectiles
  for (const p of frame.projectiles) {
    ctx.save();
    const ang = Math.atan2(p.vy, p.vx);

    if (p.weaponId === 'chain_saw') {
      ctx.translate(p.x, p.y);
      ctx.rotate(now * 0.035);
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let t = 0; t < 12; t += 1) {
        const a = (Math.PI * 2 * t) / 12;
        const rad = t % 2 === 0 ? p.radius + 2.5 : p.radius * 0.52;
        if (t === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.weaponId === 'nova_cannon') {
      ctx.translate(p.x, p.y);
      ctx.globalCompositeOperation = 'lighter';
      const ng = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius + 11);
      ng.addColorStop(0, '#FFFFFF');
      ng.addColorStop(0.35, '#D8B4FE');
      ng.addColorStop(0.68, '#9333EA');
      ng.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F5D0FE';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius + 5, now * 0.018, now * 0.018 + Math.PI * 1.4);
      ctx.stroke();
    } else if (p.weaponId === 'homing_missile') {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(-8, -2.2, 12, 4.4);
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(-9.5, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.weaponId === 'frost_rifle') {
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-4.5, 4.2);
      ctx.lineTo(-1.2, 0);
      ctx.lineTo(-4.5, -4.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-1.5, -1, 7.5, 2);
    } else {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 0.62;
      ctx.lineWidth = Math.max(2.2, p.radius * 1.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.6, p.radius * 0.48), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 8. Forked Multi-Pass Chain Lightning Arcs
  for (const b of frame.bolts) {
    const bAlpha = b.life / b.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const pathPts: { x: number; y: number }[] = [];
    for (let idx = 0; idx < b.points.length; idx += 1) {
      const pt = b.points[idx];
      if (idx > 0) {
        const prev = b.points[idx - 1];
        const mx = (prev.x + pt.x) / 2 + (Math.random() - 0.5) * 24;
        const my = (prev.y + pt.y) / 2 + (Math.random() - 0.5) * 24;
        pathPts.push({ x: mx, y: my });
      }
      pathPts.push(pt);
    }

    ctx.strokeStyle = b.color;
    ctx.lineWidth = 6.5;
    ctx.globalAlpha = bAlpha * 0.42;
    ctx.beginPath();
    pathPts.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.stroke();

    ctx.strokeStyle = '#7DD3FC';
    ctx.lineWidth = 3;
    ctx.globalAlpha = bAlpha * 0.85;
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = bAlpha;
    ctx.stroke();

    for (let i = 1; i < b.points.length; i += 1) {
      const node = b.points[i];
      ctx.fillStyle = '#E0F2FE';
      ctx.globalAlpha = bAlpha * 0.9;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 9. Player & Ghost Armored Mechs
  drawPlayerMech(ctx, frame.player, now);
  drawGhostMech(ctx, frame.ghost, now);

  // 10. Crisp Outlined Floating Damage & Crit Callouts
  for (const fx of frame.dmgFxs) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fx.life / (fx.maxLife * 0.6));
    ctx.font = fx.isCrit ? '800 13.5px ui-monospace, monospace' : '700 10.5px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#03060C';
    ctx.strokeText(fx.text, fx.x, fx.y);
    ctx.fillStyle = fx.color;
    ctx.fillText(fx.text, fx.x, fx.y);
    ctx.restore();
  }

  ctx.restore();
}
