import {
  GunType,
  GunVariant,
  MAX_GUN_LEVEL,
  ProjectileItem,
  RailBeamFx,
  TdEnemy,
} from './prismTdEngine.ts';

export interface ShellCasingFx {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GroundCraterFx {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  kind: 'scorch' | 'frost' | 'plasma' | 'acid';
}

export interface OverheatFx {
  kind:
    | 'phoenix'
    | 'vortex'
    | 'cyclone'
    | 'hex_lattice'
    | 'target_lock'
    | 'solar_flare'
    | 'rainbow_star'
    | 'sonic_nova'
    | 'void_slash'
    | 'meteor_shower'
    | 'hydra_burst'
    | 'emerald_storm'
    | 'sovereign_eclipse'
    | 'supply_pulse'
    | 'radar_sweep'
    | 'aegis_dome';
  x: number;
  y: number;
  tx?: number;
  ty?: number;
  radius: number;
  angle: number;
  life: number;
  maxLife: number;
  color: string;
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

export function drawGroundCraters(ctx: CanvasRenderingContext2D, craters: readonly GroundCraterFx[]) {
  for (const cr of craters) {
    const fade = Math.max(0, Math.min(1, cr.life / cr.maxLife));
    ctx.save();
    ctx.globalAlpha = fade * 0.55;
    const grad = ctx.createRadialGradient(cr.x, cr.y, 1, cr.x, cr.y, cr.radius);
    if (cr.kind === 'frost') {
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.45)');
      grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.2)');
      grad.addColorStop(1, 'rgba(14, 116, 144, 0)');
    } else if (cr.kind === 'plasma') {
      grad.addColorStop(0, 'rgba(244, 114, 182, 0.45)');
      grad.addColorStop(0.55, 'rgba(139, 92, 246, 0.25)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else {
      grad.addColorStop(0, 'rgba(9, 9, 11, 0.85)');
      grad.addColorStop(0.55, 'rgba(69, 26, 3, 0.48)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cr.x, cr.y, cr.radius, 0, Math.PI * 2);
    ctx.fill();

    // Crisp scorch fracture lines
    ctx.strokeStyle =
      cr.kind === 'frost' ? 'rgba(224, 242, 254, 0.45)' : 'rgba(251, 146, 60, 0.32)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25 + (cr.x % 3);
      ctx.beginPath();
      ctx.moveTo(cr.x + Math.cos(a) * 3, cr.y + Math.sin(a) * 3);
      ctx.lineTo(cr.x + Math.cos(a) * cr.radius * 0.65, cr.y + Math.sin(a) * cr.radius * 0.65);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawShellCasings(ctx: CanvasRenderingContext2D, casings: readonly ShellCasingFx[]) {
  for (const sh of casings) {
    const fade = Math.max(0, Math.min(1, sh.life / sh.maxLife));
    ctx.save();
    ctx.globalAlpha = fade * 0.92;
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    ctx.fillStyle = sh.color;
    ctx.fillRect(-2.6, -1.1, 5.2, 2.2);
    ctx.fillStyle = '#FEF9C3';
    ctx.fillRect(-1.5, -0.7, 3, 0.7);
    ctx.restore();
  }
}

export function drawOverheatSpecialFx(
  ctx: CanvasRenderingContext2D,
  effects: readonly OverheatFx[],
  animTime: number,
  alphaScale = 1
) {
  const safeScale = Math.max(0.35, Math.min(1, alphaScale));
  for (const fx of effects) {
    const t = Math.max(0, Math.min(1, fx.life / fx.maxLife)) * safeScale;
    ctx.save();

    if (fx.kind === 'phoenix') {
      // Twin counter-rotating Phoenix Fire Wings
      ctx.translate(fx.x, fx.y);
      ctx.rotate(fx.angle + animTime * 7);
      ctx.globalAlpha = t * 0.85;
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, fx.radius);
      g.addColorStop(0, '#FFFFFF');
      g.addColorStop(0.35, '#FACC15');
      g.addColorStop(0.7, '#F97316');
      g.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = g;
      for (let w = 0; w < 4; w++) {
        const wa = (w * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(
          Math.cos(wa + 0.5) * fx.radius * 0.7,
          Math.sin(wa + 0.5) * fx.radius * 0.7,
          Math.cos(wa) * fx.radius,
          Math.sin(wa) * fx.radius
        );
        ctx.quadraticCurveTo(
          Math.cos(wa - 0.3) * fx.radius * 0.4,
          Math.sin(wa - 0.3) * fx.radius * 0.4,
          0,
          0
        );
        ctx.fill();
      }
    } else if (fx.kind === 'vortex') {
      // Spinning Black-Hole Accretion Disk
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.92;
      const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, fx.radius);
      halo.addColorStop(0, '#020617');
      halo.addColorStop(0.32, '#581C87');
      halo.addColorStop(0.65, 'rgba(192, 132, 252, 0.55)');
      halo.addColorStop(1, 'rgba(192, 132, 252, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#E879F9';
      ctx.lineWidth = 2.2;
      for (let arm = 0; arm < 3; arm++) {
        const baseA = animTime * 9 + (arm * Math.PI * 2) / 3;
        ctx.beginPath();
        ctx.arc(0, 0, fx.radius * 0.52, baseA, baseA + 1.5);
        ctx.stroke();
      }
      ctx.fillStyle = '#030014';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (fx.kind === 'cyclone') {
      // Electromagnetic Ion Storm Cyclone
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.88;
      const cg = ctx.createRadialGradient(0, 0, 4, 0, 0, fx.radius);
      cg.addColorStop(0, 'rgba(224, 231, 255, 0.5)');
      cg.addColorStop(0.5, 'rgba(129, 140, 248, 0.45)');
      cg.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.rotate(-animTime * 11);
      ctx.strokeStyle = '#A5B4FC';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(0, 0, fx.radius * (0.35 + i * 0.11), a, a + 2.1);
        ctx.stroke();
      }
    } else if (fx.kind === 'hex_lattice') {
      // Expanding Cryo Hexagon Crystal Lattice
      const grow = (1 - t * 0.72) * fx.radius;
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.9;
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 2.6;
      drawPolygon(ctx, 0, 0, 6, grow, animTime * 1.6);
      ctx.stroke();
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.6;
      drawPolygon(ctx, 0, 0, 6, grow * 0.62, -animTime * 2.2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = animTime * 1.6 + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * grow, Math.sin(a) * grow);
        ctx.stroke();
      }
    } else if (fx.kind === 'target_lock' && fx.tx !== undefined && fx.ty !== undefined) {
      // Crimson Sniper Target-Lock Laser Sight + Crosshair Reticle
      ctx.globalAlpha = t * 0.92;
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      ctx.lineTo(fx.tx, fx.ty);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(fx.tx, fx.ty, 14 * (0.6 + t * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.kind === 'solar_flare') {
      // 12-Ray Beacon Solar Burst
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.85;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12 + animTime * 2.2;
        ctx.strokeStyle = i % 2 === 0 ? '#FEF08A' : '#F59E0B';
        ctx.lineWidth = i % 2 === 0 ? 3.2 : 1.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
        ctx.lineTo(Math.cos(a) * fx.radius, Math.sin(a) * fx.radius);
        ctx.stroke();
      }
    } else if (fx.kind === 'rainbow_star') {
      // Prism Laser 8-Spectrum Refraction Starburst
      const spectrum = ['#FB7185', '#FB923C', '#FACC15', '#4ADE80', '#38BDF8', '#818CF8', '#E879F9', '#F472B6'];
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.92;
      for (let i = 0; i < spectrum.length; i++) {
        const a = (i * Math.PI * 2) / spectrum.length + animTime * 3.5;
        ctx.strokeStyle = spectrum[i];
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * fx.radius, Math.sin(a) * fx.radius);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 7 * t, 0, Math.PI * 2);
      ctx.fill();
    } else if (fx.kind === 'sonic_nova') {
      // Resonant Acoustic Shock Rings
      ctx.translate(fx.x, fx.y);
      const expand = 1 - t * 0.65;
      for (let r = 0; r < 3; r++) {
        ctx.globalAlpha = t * (0.85 - r * 0.22);
        ctx.strokeStyle = r === 0 ? '#FFFFFF' : fx.color || '#22D3EE';
        ctx.lineWidth = 3 - r * 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, fx.radius * expand * (0.5 + r * 0.25), 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (fx.kind === 'void_slash') {
      // Crossed Crimson/Violet Katana Slashes
      ctx.translate(fx.x, fx.y);
      ctx.rotate(fx.angle);
      ctx.globalAlpha = t * 0.94;
      for (let s = 0; s < 3; s++) {
        ctx.save();
        ctx.rotate((s - 1) * 0.72);
        ctx.strokeStyle = s === 1 ? '#FFFFFF' : fx.color || '#F43F5E';
        ctx.lineWidth = s === 1 ? 3.6 : 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, fx.radius * (0.85 - s * 0.1), -0.9, 0.9);
        ctx.stroke();
        ctx.restore();
      }
    } else if (fx.kind === 'meteor_shower') {
      // Blazing Orbital Impact Star & Shock Fractures
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.9;
      const mg = ctx.createRadialGradient(0, 0, 4, 0, 0, fx.radius);
      mg.addColorStop(0, '#FFFFFF');
      mg.addColorStop(0.35, '#FACC15');
      mg.addColorStop(0.72, '#F97316');
      mg.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + fx.angle;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * fx.radius * 0.95, Math.sin(a) * fx.radius * 0.95);
        ctx.stroke();
      }
    } else if (fx.kind === 'hydra_burst') {
      // Bioluminescent Toxic Mire Bloom
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.85;
      const hg = ctx.createRadialGradient(0, 0, 4, 0, 0, fx.radius);
      hg.addColorStop(0, '#ECFCCB');
      hg.addColorStop(0.45, '#84CC16');
      hg.addColorStop(0.85, 'rgba(22, 163, 74, 0.35)');
      hg.addColorStop(1, 'rgba(20, 83, 45, 0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D9F99D';
      for (let b = 0; b < 6; b++) {
        const a = (b * Math.PI) / 3 + animTime * 3.5;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * fx.radius * 0.55, Math.sin(a) * fx.radius * 0.55, 4 * t + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (fx.kind === 'emerald_storm') {
      // Emerald Reaper Whirlwind Glaive Orbit
      ctx.translate(fx.x, fx.y);
      ctx.rotate(animTime * 11);
      ctx.globalAlpha = t * 0.92;
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.6;
      for (let w = 0; w < 4; w++) {
        const wa = (w * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(0, 0, fx.radius * 0.65, wa, wa + 1.15);
        ctx.stroke();
      }
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.8;
      drawPolygon(ctx, 0, 0, 3, fx.radius * 0.42, 0);
      ctx.stroke();
    } else if (fx.kind === 'sovereign_eclipse') {
      // Void Sovereign Golden Eclipse Singularity
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.95;
      const sg = ctx.createRadialGradient(0, 0, 8, 0, 0, fx.radius);
      sg.addColorStop(0, '#020617');
      sg.addColorStop(0.32, '#4C1D95');
      sg.addColorStop(0.68, 'rgba(250, 204, 21, 0.55)');
      sg.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(animTime * 4.2);
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2.2;
      drawPolygon(ctx, 0, 0, 6, fx.radius * 0.58, 0);
      ctx.stroke();
      ctx.strokeStyle = '#C084FC';
      drawPolygon(ctx, 0, 0, 6, fx.radius * 0.4, Math.PI / 6);
      ctx.stroke();
    } else if (fx.kind === 'supply_pulse') {
      // Emerald Tactical Supply Drop Concentric Surge
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.9;
      const sg = ctx.createRadialGradient(0, 0, 6, 0, 0, fx.radius);
      sg.addColorStop(0, 'rgba(167, 243, 208, 0.55)');
      sg.addColorStop(0.55, 'rgba(52, 211, 153, 0.3)');
      sg.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(animTime * 3.2);
      ctx.strokeStyle = '#A7F3D0';
      ctx.lineWidth = 2.4;
      drawPolygon(ctx, 0, 0, 6, fx.radius * (0.45 + (1 - t) * 0.45), 0);
      ctx.stroke();
      ctx.fillStyle = '#ECFDF5';
      ctx.fillRect(-2, -10, 4, 20);
      ctx.fillRect(-10, -2, 20, 4);
    } else if (fx.kind === 'radar_sweep') {
      // Cyan Orbital Radar Wedge & Expanding Sonar Ring
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.88;
      const sweepAng = animTime * 6.5;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.24)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, fx.radius, sweepAng - 0.55, sweepAng + 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#67E8F9';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * (0.35 + (1 - t) * 0.65), 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweepAng) * fx.radius, Math.sin(sweepAng) * fx.radius);
      ctx.stroke();
    } else if (fx.kind === 'aegis_dome') {
      // Cobalt Hexagonal Aegis Fortress Barrier Dome
      ctx.translate(fx.x, fx.y);
      ctx.globalAlpha = t * 0.92;
      const dg = ctx.createRadialGradient(0, 0, 8, 0, 0, fx.radius);
      dg.addColorStop(0, 'rgba(147, 197, 253, 0.42)');
      dg.addColorStop(0.65, 'rgba(96, 165, 250, 0.25)');
      dg.addColorStop(1, 'rgba(37, 99, 235, 0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 2.6;
      drawPolygon(ctx, 0, 0, 8, fx.radius * (0.55 + (1 - t) * 0.35), animTime * 1.4);
      ctx.stroke();
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function drawRailBeamEnhanced(
  ctx: CanvasRenderingContext2D,
  rb: RailBeamFx,
  animTime: number,
  alphaScale = 1
) {
  ctx.save();
  const rTier = rb.visualTier;
  const effAlpha = rb.alpha * Math.max(0.4, Math.min(1, alphaScale));
  ctx.globalAlpha = effAlpha;
  ctx.lineCap = 'round';

  if (rb.variant === 'sniper') {
    ctx.strokeStyle = rb.color;
    ctx.lineWidth = (3.8 + rTier * 0.65) * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4 * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (rb.variant === 'prism_laser' || rb.variant === 'aurora_beam') {
    const isAurora = rb.variant === 'aurora_beam';
    const prismGrad = ctx.createLinearGradient(rb.x1, rb.y1, rb.x2, rb.y2);
    if (isAurora) {
      prismGrad.addColorStop(0, '#38BDF8');
      prismGrad.addColorStop(0.5, '#34D399');
      prismGrad.addColorStop(1, '#BAE6FD');
    } else {
      prismGrad.addColorStop(0, '#F472B6');
      prismGrad.addColorStop(0.35, '#FDE047');
      prismGrad.addColorStop(0.7, '#38BDF8');
      prismGrad.addColorStop(1, '#E879F9');
    }

    ctx.strokeStyle = prismGrad;
    ctx.lineWidth = (9 + rTier * 2.2) * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = (2.4 + rTier * 0.5) * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();

    // Crystal flare at hit endpoint
    ctx.translate(rb.x2, rb.y2);
    ctx.rotate(animTime * 8);
    ctx.fillStyle = isAurora ? '#E0F2FE' : '#FDF4FF';
    drawPolygon(ctx, 0, 0, isAurora ? 6 : 4, 7 + rTier, 0);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (rb.variant === 'gravity_lance' || rb.variant === 'sovereign_beam') {
    const isSov = rb.variant === 'sovereign_beam';
    ctx.strokeStyle = isSov ? '#FDE047' : '#818CF8';
    ctx.lineWidth = (isSov ? 16 : 12 + rTier * 2.6) * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();

    ctx.strokeStyle = isSov ? '#7C3AED' : '#22D3EE';
    ctx.lineWidth = (6.5 + rTier * 1.4) * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.6 * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (rb.variant === 'omega_beam') {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = (10 + rTier * 2) * rb.alpha;
    ctx.setLineDash([12, 5]);
    ctx.lineDashOffset = -animTime * 120;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.8 * rb.alpha;
    ctx.beginPath();
    ctx.moveTo(rb.x1, rb.y1);
    ctx.lineTo(rb.x2, rb.y2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Railgun Quantum Hyper-Beam + Mach Shock Rings
  ctx.strokeStyle = rb.color;
  ctx.lineWidth = (17 + rTier * 4.2) * rb.alpha;
  ctx.beginPath();
  ctx.moveTo(rb.x1, rb.y1);
  ctx.lineTo(rb.x2, rb.y2);
  ctx.stroke();

  ctx.strokeStyle = rTier >= 3 ? '#FDE047' : '#E879F9';
  ctx.lineWidth = (7.5 + rTier * 2) * rb.alpha;
  ctx.beginPath();
  ctx.moveTo(rb.x1, rb.y1);
  ctx.lineTo(rb.x2, rb.y2);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = (3 + rTier * 0.9) * rb.alpha;
  ctx.beginPath();
  ctx.moveTo(rb.x1, rb.y1);
  ctx.lineTo(rb.x2, rb.y2);
  ctx.stroke();

  const beamAngle = Math.atan2(rb.y2 - rb.y1, rb.x2 - rb.x1);
  const ringCount = 3 + rTier;
  for (let m = 1; m <= ringCount; m++) {
    const frac = 0.06 + m * 0.11;
    const rx = rb.x1 + (rb.x2 - rb.x1) * frac;
    const ry = rb.y1 + (rb.y2 - rb.y1) * frac;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(beamAngle);
    ctx.strokeStyle = rTier >= 3 ? '#38BDF8' : '#FEF08A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, (16 + rTier * 3 - m * 2) * (1.25 - rb.alpha * 0.4), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function drawProjectileEnhanced(
  ctx: CanvasRenderingContext2D,
  pr: ProjectileItem,
  animTime: number
) {
  // Motion ribbon trail (world space)
  if (pr.trail && pr.trail.length >= 2) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < pr.trail.length; i++) {
      const ratio = i / pr.trail.length;
      ctx.globalAlpha = ratio * 0.48;
      ctx.strokeStyle = pr.color;
      ctx.lineWidth = Math.max(1.2, ratio * (pr.kind === 'cannon' || pr.kind === 'missile' ? 5 : 3.2));
      ctx.beginPath();
      ctx.moveTo(pr.trail[i - 1].x, pr.trail[i - 1].y);
      ctx.lineTo(pr.trail[i].x, pr.trail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(pr.x, pr.y);

  if (pr.kind === 'sawblade') {
    ctx.rotate(animTime * 22);
    const bladeGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
    bladeGrad.addColorStop(0, '#FFFFFF');
    bladeGrad.addColorStop(0.45, pr.color);
    bladeGrad.addColorStop(1, '#881337');
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = pr.visualTier === 4 ? '#FDE047' : '#FECDD3';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let t = 0; t < 12; t++) {
      const a = (t * Math.PI * 2) / 12;
      const r = t % 2 === 0 ? (pr.visualTier === 4 ? 12.5 : 11) : 5.5;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (t === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (pr.kind === 'tempest_orb') {
    const spin = animTime * 15 + pr.id;
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 9.5 + pr.visualTier);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.4, '#818CF8');
    g.addColorStop(0.8, '#38BDF8');
    g.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5 + pr.visualTier, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#E0E7FF';
    ctx.lineWidth = 1.6;
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.rotate(Math.atan2(pr.vy, pr.vx));

  if (pr.kind === 'acid') {
    const ag = ctx.createRadialGradient(1, 0, 1, 0, 0, 8 + pr.visualTier * 0.5);
    ag.addColorStop(0, '#ECFCCB');
    ag.addColorStop(0.55, '#84CC16');
    ag.addColorStop(1, '#365314');
    ctx.fillStyle = ag;
    ctx.strokeStyle = '#D9F99D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 + pr.visualTier * 0.5, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'mortar') {
    ctx.save();
    ctx.rotate(animTime * 13);
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12.5 + pr.visualTier, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#C084FC';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, 12.5 + pr.visualTier, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#030014';
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 7.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'bomblet' && pr.isClusterBomblet) {
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(1.2, 0, 1.9, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'missile' || pr.kind === 'bomblet') {
    const sc = pr.kind === 'bomblet' ? 0.74 : pr.visualTier === 4 ? 1.18 : 1.04;
    ctx.scale(sc, sc);
    // Jet flame tail
    const flameG = ctx.createLinearGradient(-5, 0, -21, 0);
    flameG.addColorStop(0, '#FFFFFF');
    flameG.addColorStop(0.35, '#FDE047');
    flameG.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = flameG;
    ctx.beginPath();
    ctx.moveTo(-5, -3.5);
    ctx.lineTo(-20 - Math.random() * 5, 0);
    ctx.lineTo(-5, 3.5);
    ctx.closePath();
    ctx.fill();

    // Metallic warhead
    ctx.fillStyle = pr.visualTier === 4 ? '#E11D48' : '#FB7185';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-7, -4.5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-7, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(2, -1.2, 6, 2.4);
  } else if (pr.kind === 'pellet') {
    ctx.fillStyle = pr.color;
    ctx.beginPath();
    ctx.moveTo(7 + pr.visualTier * 0.8, 0);
    ctx.lineTo(-6, -2.6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(2, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'cannon') {
    const cg = ctx.createLinearGradient(-8, 0, 10, 0);
    cg.addColorStop(0, '#92400E');
    cg.addColorStop(0.55, pr.color);
    cg.addColorStop(1, '#FEF9C3');
    ctx.fillStyle = cg;
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(2, 0, 9.2 + pr.visualTier * 0.7, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(6, 0, 2.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'plasma') {
    const orbitA = animTime * 16 + pr.id;
    const pg = ctx.createRadialGradient(0, 0, 1, 0, 0, 7 + pr.visualTier * 0.7);
    pg.addColorStop(0, '#FFFFFF');
    pg.addColorStop(0.45, '#F472B6');
    pg.addColorStop(1, '#9D174D');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5 + pr.visualTier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F9A8D4';
    ctx.beginPath();
    ctx.arc(Math.cos(orbitA) * 8, Math.sin(orbitA) * 8, 2.2, 0, Math.PI * 2);
    ctx.arc(Math.cos(orbitA + Math.PI) * 8, Math.sin(orbitA + Math.PI) * 8, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'cluster') {
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = pr.visualTier === 4 ? '#FDE047' : '#A7F3D0';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 7.2 + pr.visualTier * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(-2, -4.5, 4, 9);
  } else if (pr.kind === 'hunter') {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(-4, -2.5);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-4, 2.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pr.color;
    ctx.strokeStyle = '#ECFEFF';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-5.5, -4.8);
    ctx.lineTo(-2.5, 0);
    ctx.lineTo(-5.5, 4.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'sonic_wave') {
    ctx.strokeStyle = pr.color;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 9 + pr.visualTier, -0.95, 0.95);
    ctx.stroke();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-3, 0, 6 + pr.visualTier * 0.6, -0.75, 0.75);
    ctx.stroke();
  } else if (pr.kind === 'lance') {
    ctx.fillStyle = pr.color;
    ctx.beginPath();
    ctx.moveTo(14 + pr.visualTier, 0);
    ctx.lineTo(-10, -3.6);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 3.6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-4, -1.1, 14, 2.2);
  } else if (pr.kind === 'cyber_bolt') {
    ctx.fillStyle = '#06B6D4';
    ctx.fillRect(-10, -3.2, 16, 2.2);
    ctx.fillRect(-10, 1.0, 16, 2.2);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(2, -2.5, 6, 5);
  } else if (pr.kind === 'magma_glob') {
    const mg = ctx.createRadialGradient(0, 0, 1, 0, 0, 8 + pr.visualTier * 0.6);
    mg.addColorStop(0, '#FEF08A');
    mg.addColorStop(0.55, '#F97316');
    mg.addColorStop(1, '#7C2D12');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5 + pr.visualTier * 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'katana_blade') {
    ctx.rotate(animTime * 18);
    ctx.fillStyle = pr.color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 11 + pr.visualTier * 0.8, -0.8, 0.8);
    ctx.arc(-3, 0, 7.5, 0.8, -0.8, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'dune_needle') {
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-9, -2.2);
    ctx.lineTo(-9, 2.2);
    ctx.closePath();
    ctx.fill();
  } else if (pr.kind === 'flak_shell') {
    ctx.fillStyle = '#D97706';
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(-8, -4.5, 16, 9, 3);
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'hydra_fang') {
    ctx.fillStyle = '#84CC16';
    ctx.strokeStyle = '#ECFCCB';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(-6, -4.5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'cryo_spike') {
    ctx.fillStyle = '#E0F2FE';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-2, -4);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'hell_rocket') {
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.moveTo(-4, -3);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-4, 3);
    ctx.fill();
    ctx.fillStyle = '#E11D48';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-5, -3.5);
    ctx.lineTo(-5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'shadow_drone') {
    ctx.fillStyle = '#312E81';
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-7, -6);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-7, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.arc(2, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'omega_pulse') {
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 6.5 + pr.visualTier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'reaper_disc') {
    ctx.rotate(animTime * 24);
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.6;
    drawPolygon(ctx, 0, 0, 3, 10 + pr.visualTier * 0.7, 0);
    ctx.fill();
    ctx.stroke();
  } else if (pr.kind === 'sovereign_orb') {
    const sg = ctx.createRadialGradient(0, 0, 1, 0, 0, 9 + pr.visualTier * 0.6);
    sg.addColorStop(0, '#020617');
    sg.addColorStop(0.55, '#9333EA');
    sg.addColorStop(1, '#FDE047');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(0, 0, 8.5 + pr.visualTier * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // High-energy Gatling AP tracer with tapered core
    const bg = ctx.createLinearGradient(-16, 0, 8, 0);
    bg.addColorStop(0, 'rgba(56, 189, 248, 0)');
    bg.addColorStop(0.45, pr.color);
    bg.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(8 + pr.visualTier, 0);
    ctx.lineTo(-16, -2.8);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-16, 2.8);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function drawGunTurretSprite(
  ctx: CanvasRenderingContext2D,
  type: GunType,
  level: number,
  aimAngle: number,
  recoil: number,
  animTime: number,
  variant: GunVariant = 'alpha',
  heatPct = 0,
  overheatActive = false
) {
  const tier: 1 | 2 | 3 | 4 = level >= 10 ? 4 : level >= 7 ? 3 : level >= 4 ? 2 : 1;
  const isOmega = variant === 'omega';
  const baseRadius = 19.5 + (tier - 1) * 1.4;

  // Overheat Active Blazing Halo
  if (overheatActive) {
    ctx.save();
    ctx.rotate(animTime * 6);
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius + 9.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Tier 3/4 Evolution Crown Rings
  if (tier === 4) {
    ctx.save();
    ctx.rotate(animTime * 2.5);
    ctx.strokeStyle = isOmega ? 'rgba(251, 146, 60, 0.9)' : 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 27.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-animTime * 3.2);
    ctx.strokeStyle = isOmega ? 'rgba(244, 63, 94, 0.78)' : 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (tier === 3) {
    ctx.save();
    ctx.rotate(animTime * 2.1);
    ctx.strokeStyle = isOmega ? 'rgba(251, 146, 60, 0.72)' : 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Metallic Beveled Pedestal Base
  const baseGrad = ctx.createLinearGradient(-baseRadius, -baseRadius, baseRadius, baseRadius);
  if (isOmega) {
    baseGrad.addColorStop(0, tier >= 3 ? '#4C0519' : '#271222');
    baseGrad.addColorStop(1, '#0F172A');
  } else {
    baseGrad.addColorStop(0, tier >= 3 ? '#1E3A8A' : '#1E293B');
    baseGrad.addColorStop(1, '#090D16');
  }
  ctx.fillStyle = baseGrad;
  ctx.strokeStyle = isOmega
    ? tier >= 3
      ? '#FB923C'
      : '#F43F5E'
    : tier === 4
      ? '#FDE047'
      : tier === 3
        ? '#FBBF24'
        : tier === 2
          ? '#38BDF8'
          : '#64748B';
  ctx.lineWidth = tier >= 3 ? 2.5 : 2;
  if (tier >= 3 || isOmega) {
    drawPolygon(ctx, 0, 0, 8, baseRadius, Math.PI / 8);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Metallic Inner Rim Highlight + Heat Gauge Arc
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius - 3.5, Math.PI * 0.9, Math.PI * 1.9);
  ctx.stroke();

  if (heatPct > 4) {
    const ratio = Math.min(1, heatPct / 100);
    ctx.strokeStyle = overheatActive ? '#FB7185' : ratio > 0.72 ? '#F97316' : '#FACC15';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius + 2.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
  }

  // Variant Wing Mounts (Omega gets heavy beveled shoulder plates, Alpha gets aerodynamic fins)
  if (isOmega) {
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.moveTo(-baseRadius - 2, -6);
    ctx.lineTo(-baseRadius + 3, -9);
    ctx.lineTo(-baseRadius + 3, 9);
    ctx.lineTo(-baseRadius - 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(baseRadius + 2, -6);
    ctx.lineTo(baseRadius - 3, -9);
    ctx.lineTo(baseRadius - 3, 9);
    ctx.lineTo(baseRadius + 2, 6);
    ctx.closePath();
    ctx.fill();
  } else if (tier >= 2) {
    ctx.fillStyle = tier === 4 ? '#FDE047' : '#38BDF8';
    ctx.fillRect(-baseRadius - 2, -4, 4, 8);
    ctx.fillRect(baseRadius - 2, -4, 4, 8);
  }

  const metalRim = isOmega ? '#FDBA74' : '#BAE6FD';

  // Weapon Head Geometry
  if (type === 'gatling') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4.5;
    if (tier >= 2) {
      ctx.fillStyle = isOmega ? '#F97316' : tier === 4 ? '#FDE047' : '#F59E0B';
      ctx.fillRect(-14 - kick, -10, 11, 20);
    }
    const len = 19 + tier * 2.2;
    ctx.fillStyle = isOmega ? '#FB923C' : tier === 4 ? '#FDE047' : '#38BDF8';
    ctx.fillRect(4 - kick, -8, len, 3.8);
    ctx.fillRect(4 - kick, 4.2, len, 3.8);
    if (tier >= 3 || isOmega) {
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(5 - kick, -2, len + 3, 4);
    }
    if (tier === 4) {
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(4 - kick, -13, len - 3, 3);
      ctx.fillRect(4 - kick, 10, len - 3, 3);
    }
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = metalRim;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 12 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'shotgun') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5;
    ctx.fillStyle = isOmega ? '#B91C1C' : '#EA580C';
    ctx.strokeStyle = isOmega ? '#FDE047' : '#FDBA74';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(4 - kick, -8);
    ctx.lineTo(20 + tier * 2 - kick, -12 - tier);
    ctx.lineTo(20 + tier * 2 - kick, 12 + tier);
    ctx.lineTo(4 - kick, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#431407';
    ctx.beginPath();
    ctx.arc(-2, 0, 11 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'flamer') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3;
    ctx.fillStyle = isOmega ? '#C2410C' : tier >= 3 ? '#0284C7' : '#EA580C';
    ctx.fillRect(4 - kick, -5 - tier * 0.6, 16 + tier * 2, 10 + tier * 1.2);
    ctx.fillStyle = tier >= 3 ? '#38BDF8' : '#FACC15';
    ctx.fillRect(18 + tier * 1.5 - kick, -5, 5, 10);
    ctx.fillStyle = tier >= 3 ? '#0C4A6E' : '#431407';
    ctx.strokeStyle = isOmega ? '#FB7185' : '#FB923C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-2, 0, 11 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'cryo') {
    ctx.save();
    ctx.rotate(animTime * (1.5 + tier * 0.6));
    ctx.strokeStyle = isOmega ? '#FDE047' : '#E0F2FE';
    ctx.fillStyle = isOmega ? 'rgba(14, 165, 233, 0.52)' : 'rgba(6, 182, 212, 0.38)';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, tier >= 3 ? 8 : 6, 15 + tier, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#ECFEFF';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5 + tier * 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'tesla') {
    const pylons = tier === 4 || isOmega ? 4 : 3;
    for (let k = 0; k < pylons; k++) {
      const ka = (k * Math.PI * 2) / pylons + animTime * 2.5;
      ctx.strokeStyle = isOmega ? '#F472B6' : '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ka) * 18, Math.sin(ka) * 18);
      ctx.stroke();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(Math.cos(ka) * 18, Math.sin(ka) * 18, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = tier >= 3 ? '#FDE047' : '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 14 + tier * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5 + tier + Math.sin(animTime * 9) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'missile') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3;
    ctx.fillStyle = isOmega ? '#9F1239' : '#E11D48';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-12 - kick, -12 - tier * 0.6, 24 + tier * 2, 24 + tier * 1.2, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(10 - kick, -8, 5, 4.5);
    ctx.fillRect(10 - kick, 3.5, 5, 4.5);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(10 - kick, -2, 6, 4);
    ctx.restore();
  } else if (type === 'railgun') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5;
    const len = 23 + tier * 3;
    ctx.fillStyle = isOmega ? '#FB7185' : tier >= 3 ? '#FDE047' : '#A78BFA';
    ctx.fillRect(2 - kick, -6.5, len, 3.2);
    ctx.fillRect(2 - kick, 3.3, len, 3.2);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(4 - kick, -1.8, len - 3, 3.6);
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#C4B5FD';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 12.5 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'mortar') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4;
    ctx.save();
    ctx.rotate(animTime * 5);
    ctx.strokeStyle = isOmega ? '#FDE047' : '#E879F9';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 8.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#3B0764';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-kick, 0, 13.5 + tier * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(7 - kick, 0, 5 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'sniper') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5.5;
    const len = 28 + tier * 3;
    ctx.fillStyle = isOmega ? '#FDE047' : '#34D399';
    ctx.fillRect(4 - kick, -2.5, len, 5);
    ctx.fillStyle = '#064E3B';
    ctx.fillRect(10 - kick, -4.5, 11, 9);
    ctx.fillStyle = '#065F46';
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-1, 0, 11.5 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F43F5E';
    ctx.beginPath();
    ctx.arc(4, -5.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'acid') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3.5;
    ctx.fillStyle = '#365314';
    ctx.strokeStyle = isOmega ? '#FDE047' : '#A3E635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2 - kick, -7 - tier * 0.4, 17 + tier * 2, 14 + tier * 0.8, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#BEF264';
    ctx.beginPath();
    ctx.arc(-7, -7, 4.5 + tier * 0.4, 0, Math.PI * 2);
    ctx.arc(-7, 7, 4.5 + tier * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1A2E05';
    ctx.beginPath();
    ctx.arc(-1, 0, 10 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'saw') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4;
    ctx.fillStyle = isOmega ? '#881337' : '#4C0519';
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 2;
    ctx.fillRect(-10 - kick, -8, 22, 16);
    ctx.strokeRect(-10 - kick, -8, 22, 16);
    ctx.save();
    ctx.translate(10 - kick, 0);
    ctx.rotate(animTime * 12);
    ctx.fillStyle = isOmega ? '#FDE047' : '#FDA4AF';
    ctx.beginPath();
    for (let t = 0; t < 12; t++) {
      const a = (t * Math.PI * 2) / 12;
      const r = t % 2 === 0 ? 11 + tier : 6.5;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (t === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
  } else if (type === 'beacon') {
    ctx.save();
    ctx.rotate(animTime * (1.8 + tier * 0.6));
    ctx.strokeStyle = isOmega ? '#FB923C' : '#FACC15';
    ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 4, 16 + tier * 1.1, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5 + tier * 0.7 + Math.sin(animTime * 7) * 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'amp_spire') {
    // Rotating Emerald Octagonal Capacitor Pylons + Cross Core
    ctx.save();
    ctx.rotate(-animTime * (1.5 + tier * 0.45));
    ctx.fillStyle = isOmega ? '#064E3B' : '#065F46';
    ctx.strokeStyle = isOmega ? '#A7F3D0' : '#34D399';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 6, 15 + tier * 1.1, 0);
    ctx.fill();
    ctx.stroke();
    const coils = tier >= 3 ? 4 : 3;
    for (let i = 0; i < coils; i++) {
      const a = (i * Math.PI * 2) / coils;
      ctx.fillStyle = '#6EE7B7';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (11 + tier * 0.8), Math.sin(a) * (11 + tier * 0.8), 2.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#ECFDF5';
    ctx.fillRect(-5, -1.8, 10, 3.6);
    ctx.fillRect(-1.8, -5, 3.6, 10);
  } else if (type === 'radar') {
    // Sweeping Cyan Parabolic Sensor Dish + Pulse Emitter
    ctx.fillStyle = '#083344';
    ctx.strokeStyle = isOmega ? '#FDE047' : '#22D3EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 12 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(animTime * (2.6 + tier * 0.5));
    ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 16 + tier, -0.5, 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = isOmega ? '#FDE047' : '#67E8F9';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(-2, 0, 11 + tier * 0.8, -1.1, 1.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(13 + tier, 0);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5 + tier * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'aegis_field') {
    // Rotating Cobalt Shield Projector + Defensive Bastion Plates
    ctx.save();
    ctx.rotate(animTime * (1.2 + tier * 0.35));
    ctx.fillStyle = isOmega ? '#1E3A8A' : '#172554';
    ctx.strokeStyle = isOmega ? '#38BDF8' : '#60A5FA';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 8, 15 + tier, 0);
    ctx.fill();
    ctx.stroke();
    for (let b = 0; b < 4; b++) {
      const a = (b * Math.PI) / 2;
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 18 + tier * 0.7, a - 0.32, a + 0.32);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#DBEAFE';
    drawPolygon(ctx, 0, 0, 4, 6.2 + tier * 0.5, Math.PI / 4);
    ctx.fill();
  } else if (type === 'cannon') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 6;
    const len = 21 + tier * 2.5;
    ctx.fillStyle = isOmega ? '#9A3412' : '#B45309';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.fillRect(2 - kick, -6, len, 12);
    ctx.strokeRect(2 - kick, -6, len, 12);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(len - 3 - kick, -8, 6, 16);
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(-2, 0, 12 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'plasma') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3.5;
    ctx.fillStyle = isOmega ? '#9D174D' : '#BE185D';
    ctx.strokeStyle = '#F9A8D4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-8 - kick, -9, 24 + tier * 2, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(14 + tier - kick, 0, 4.5 + tier * 0.6 + Math.sin(animTime * 12) * 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'cluster') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4;
    ctx.fillStyle = isOmega ? '#065F46' : '#047857';
    ctx.strokeStyle = '#6EE7B7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-11 - kick, -11, 22 + tier, 22, 5);
    ctx.fill();
    ctx.stroke();
    const pods = [
      [-4, -5],
      [4, -5],
      [0, 0],
      [-4, 5],
      [4, 5],
    ];
    ctx.fillStyle = '#FDE047';
    for (const [px, py] of pods) {
      ctx.beginPath();
      ctx.arc(px + 2 - kick, py, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (type === 'hunter') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3;
    ctx.fillStyle = '#083344';
    ctx.strokeStyle = isOmega ? '#FDE047' : '#22D3EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(19 + tier * 2 - kick, 0);
    ctx.lineTo(-10 - kick, -12 - tier * 0.5);
    ctx.lineTo(-5 - kick, 0);
    ctx.lineTo(-10 - kick, 12 + tier * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#22D3EE';
    ctx.beginPath();
    ctx.arc(3 - kick, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'prism_laser') {
    // Rotating Diamond Crystal Aperture
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3;
    ctx.fillStyle = isOmega ? '#701A75' : '#4C1D95';
    ctx.strokeStyle = isOmega ? '#FDE047' : '#E879F9';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(21 + tier * 2 - kick, 0);
    ctx.lineTo(3 - kick, -10);
    ctx.lineTo(-10 - kick, -7);
    ctx.lineTo(-10 - kick, 7);
    ctx.lineTo(3 - kick, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(animTime * 2.8);
    ctx.fillStyle = '#F5D0FE';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.6;
    drawPolygon(ctx, 0, 0, 4, 8.5 + tier * 0.8, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'tempest') {
    // Twin Spinning Ion Cyclotron Rings
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3.5;
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = isOmega ? '#38BDF8' : '#818CF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-8 - kick, -10, 26 + tier * 2, 20, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(animTime * 6);
    ctx.strokeStyle = '#C7D2FE';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5 + tier * 0.7, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.fillStyle = '#E0E7FF';
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'sonic') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3;
    ctx.strokeStyle = isOmega ? '#FDE047' : '#22D3EE';
    ctx.fillStyle = '#083344';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(2 - kick, 0, 14 + tier, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.fillStyle = '#67E8F9';
    ctx.fillRect(-6 - kick, -6, 10, 12);
    ctx.beginPath();
    ctx.arc(9 - kick, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'gravity_lance') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4.5;
    const len = 24 + tier * 2.5;
    ctx.fillStyle = isOmega ? '#C084FC' : '#38BDF8';
    ctx.fillRect(3 - kick, -8, len, 3.2);
    ctx.fillRect(3 - kick, 4.8, len, 3.2);
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#818CF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 11 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(10 - kick, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type.startsWith('map')) {
    // Signature Map-Exclusive Turret Designs (Golden Exclusive Halo + Custom Silhouette)
    ctx.save();
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.82)';
    ctx.lineWidth = 1.6;
    drawPolygon(ctx, 0, 0, 6, baseRadius + 4.5, animTime * 0.7);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4.2;
    if (type === 'map01_cyber_smg' || type === 'map07_cyclone_rotary' || type === 'map05_dune_needler') {
      const barrelColor = type === 'map05_dune_needler' ? '#FACC15' : type === 'map07_cyclone_rotary' ? '#38BDF8' : '#22D3EE';
      ctx.fillStyle = barrelColor;
      const len = 21 + tier * 2.2;
      ctx.fillRect(4 - kick, -7.5, len, 3.2);
      ctx.fillRect(4 - kick, -1.6, len + 3, 3.2);
      ctx.fillRect(4 - kick, 4.3, len, 3.2);
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-1, 0, 11.5 + tier * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (type === 'map02_matrix_spire' || type === 'map06_aurora_beam' || type === 'map14_omega_disruptor') {
      const crystalCol = type === 'map02_matrix_spire' ? '#34D399' : type === 'map06_aurora_beam' ? '#7DD3FC' : '#60A5FA';
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = crystalCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(22 + tier * 2 - kick, 0);
      ctx.lineTo(0, -11);
      ctx.lineTo(-10, 0);
      ctx.lineTo(0, 11);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(3 - kick * 0.5, 0, 4.2 + tier * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'map03_forge_magma' || type === 'map08_titan_flak' || type === 'map12_hellfire_organ') {
      const heavyCol = type === 'map12_hellfire_organ' ? '#FB7185' : type === 'map08_titan_flak' ? '#F59E0B' : '#F97316';
      ctx.fillStyle = '#29150E';
      ctx.strokeStyle = heavyCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-11 - kick, -12, 26 + tier * 2, 24, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FDE047';
      for (const py of [-7, -2.5, 2.5, 7]) {
        ctx.fillRect(10 - kick, py - 1.2, 10 + tier, 2.4);
      }
    } else if (type === 'map04_void_katana' || type === 'map15_emerald_reaper') {
      const bladeCol = type === 'map15_emerald_reaper' ? '#34D399' : '#FB7185';
      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = bladeCol;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(20 - kick, -10);
      ctx.lineTo(6 - kick, 0);
      ctx.lineTo(20 - kick, 10);
      ctx.lineTo(-10 - kick, 8);
      ctx.lineTo(-10 - kick, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'map09_venom_hydra' || type === 'map11_cryo_shatter' || type === 'map13_shadow_hive') {
      const podCol = type === 'map09_venom_hydra' ? '#A3E635' : type === 'map11_cryo_shatter' ? '#BAE6FD' : '#C084FC';
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = podCol;
      ctx.lineWidth = 2.2;
      drawPolygon(ctx, 0, 0, 5, 13.5 + tier * 0.7, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = podCol;
      ctx.fillRect(6 - kick, -5.5, 13 + tier, 3.5);
      ctx.fillRect(6 - kick, 2.0, 13 + tier, 3.5);
    } else {
      // map10_meteor_rail & map16_void_sovereign: Royal Twin-Rail Singularity Citadel
      const crownCol = type === 'map16_void_sovereign' ? '#E879F9' : '#FB923C';
      ctx.fillStyle = crownCol;
      ctx.fillRect(3 - kick, -8.5, 25 + tier * 2.5, 3.8);
      ctx.fillRect(3 - kick, 4.7, 25 + tier * 2.5, 3.8);
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(6 - kick, -2, 22 + tier * 2, 4);
      ctx.fillStyle = '#090D16';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2.2;
      drawPolygon(ctx, 0, 0, 8, 12.5 + tier * 0.6, 0);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // Variant Tag + Level Badge Pill
  ctx.fillStyle =
    tier === 4 ? '#FDE047' : tier === 3 ? '#FB923C' : tier === 2 ? '#38BDF8' : '#0F172A';
  ctx.strokeStyle = '#070B14';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-15, 13, 30, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tier >= 2 ? '#070B14' : '#E2E8F0';
  ctx.font = 'bold 8.5px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const vPrefix = isOmega ? 'ω' : 'α';
  ctx.fillText(level === MAX_GUN_LEVEL ? `${vPrefix}MAX` : `${vPrefix}L${level}`, 0, 19.3);
}

/**
 * High-contrast, multi-layered enemy & armored Dreadnought Boss renderer.
 * Clear hierarchy: light flankers ("lính ra lính") vs towering Dreadnought Boss ("Boss ra Boss").
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  en: TdEnemy,
  animTime: number
) {
  ctx.save();
  const isKo = en.koTimer > 0;
  const koAlpha = isKo ? Math.max(0, en.koTimer / 0.28) : 1;
  const stealthFade =
    en.kind === 'stealth' && en.slowTimer <= 0 && en.burnTimer <= 0
      ? 0.48 + Math.sin(animTime * 9 + en.id) * 0.2
      : 1;
  ctx.globalAlpha = koAlpha * stealthFade;
  ctx.translate(en.x, en.y);

  // Ground shadow
  if (!isKo) {
    ctx.fillStyle = en.kind === 'boss' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, en.kind === 'boss' ? 11 : 7, en.radius * 1.05, en.radius * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Boss Menacing Hazard Under-Aura
  if (en.kind === 'boss' && !isKo) {
    ctx.save();
    ctx.rotate(animTime * 1.8);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (en.isElite && !isKo) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Cryo Frost Rim
  if (en.slowTimer > 0 && !isKo) {
    ctx.strokeStyle = en.brittleBonus > 0 ? '#E0F2FE' : '#67E8F9';
    ctx.lineWidth = en.brittleBonus > 0 ? 2.2 : 1.7;
    for (let ic = 0; ic < 6; ic++) {
      const ia = (ic * Math.PI) / 3 + animTime * 1.2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ia) * (en.radius - 1), Math.sin(ia) * (en.radius - 1));
      ctx.lineTo(Math.cos(ia) * (en.radius + 7), Math.sin(ia) * (en.radius + 7));
      ctx.stroke();
    }
  }

  // Shield Dome
  if (en.shield > 0 && !isKo) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(en.heading);
  const flash = en.hitFlash > 0;
  const pulse = 0.85 + Math.sin(animTime * 18 + en.id) * 0.18;

  if (en.kind === 'boss') {
    // DREADNOUGHT WARSHIP TITAN: twin roaring plasma thrusters + broadside armored wings + twin deck turrets + glowing reactor
    ctx.fillStyle = '#F97316';
    for (const ty of [-11, 11]) {
      ctx.beginPath();
      ctx.moveTo(-20, ty - 4.5);
      ctx.lineTo(-34 - Math.sin(animTime * 28) * 4, ty);
      ctx.lineTo(-20, ty + 4.5);
      ctx.closePath();
      ctx.fill();
    }

    // Main Beveled Dreadnought Hull
    const hullGrad = ctx.createLinearGradient(-22, -22, 26, 22);
    hullGrad.addColorStop(0, flash ? '#FFFFFF' : '#4C0519');
    hullGrad.addColorStop(0.5, flash ? '#FFFFFF' : '#9F1239');
    hullGrad.addColorStop(1, flash ? '#FFFFFF' : '#1E293B');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.lineTo(15, -14);
    ctx.lineTo(4, -23);
    ctx.lineTo(-16, -21);
    ctx.lineTo(-24, -12);
    ctx.lineTo(-21, 0);
    ctx.lineTo(-24, 12);
    ctx.lineTo(-16, 21);
    ctx.lineTo(4, 23);
    ctx.lineTo(15, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Forward Ramming Horn Prows
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(28, -5);
    ctx.lineTo(18, -11);
    ctx.lineTo(20, -4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(28, 5);
    ctx.lineTo(18, 11);
    ctx.lineTo(20, 4);
    ctx.closePath();
    ctx.fill();

    // Twin Rotating Broadside Deck Turrets
    for (const ty of [-12, 12]) {
      ctx.save();
      ctx.translate(-3, ty);
      ctx.rotate(Math.sin(animTime * 2.4 + ty) * 0.45);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.4;
      ctx.fillRect(0, -2.5, 11, 5);
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Pulsing Furnace Reactor Core
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(3, 0, 6.2 + Math.sin(animTime * 11) * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'juggernaut') {
    // Heavy Siege Bulldozer Tank with animated Caterpillar Treads & Siege Ram
    const treadPhase = (animTime * 22) % 8;
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(-19, -20, 38, 7);
    ctx.fillRect(-19, 13, 38, 7);
    ctx.fillStyle = '#57534E';
    for (let tx = -16 + treadPhase; tx < 16; tx += 8) {
      ctx.fillRect(tx, -19.5, 3.5, 6);
      ctx.fillRect(tx, 13.5, 3.5, 6);
    }

    const jg = ctx.createLinearGradient(-16, -15, 18, 15);
    jg.addColorStop(0, flash ? '#FFFFFF' : '#78350F');
    jg.addColorStop(1, flash ? '#FFFFFF' : '#292524');
    ctx.fillStyle = jg;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-16, -15, 33, 30, 5);
    ctx.fill();
    ctx.stroke();

    // Heavy Bulldozer Plow Shield
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(22, -16);
    ctx.lineTo(15, -12);
    ctx.lineTo(15, 12);
    ctx.lineTo(22, 16);
    ctx.lineTo(25, 0);
    ctx.closePath();
    ctx.fill();
  } else if (en.kind === 'armored') {
    // Sloped Reactive Heavy Armor Crawler
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-15, -16, 30, 5);
    ctx.fillRect(-15, 11, 30, 5);

    const ag = ctx.createLinearGradient(-14, -12, 16, 12);
    ag.addColorStop(0, flash ? '#FFFFFF' : '#B45309');
    ag.addColorStop(1, flash ? '#FFFFFF' : '#334155');
    ctx.fillStyle = ag;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    drawPolygon(ctx, 0, 0, 6, 16, 0);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(4, -5, 6, 10);
  } else if (en.kind === 'shieldbearer') {
    // Aegis Hexagon Bulwark Cruiser
    ctx.fillStyle = flash ? '#FFFFFF' : '#0C4A6E';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 6, 17, 0);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(4, 0, 14, -0.95, 0.95);
    ctx.stroke();
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'berserker') {
    // Twin Spinning Saw-Axes Rage Striker
    ctx.fillStyle = flash ? '#FFFFFF' : '#7C2D12';
    ctx.strokeStyle = en.enraged ? '#EF4444' : '#F97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(-4, -14);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-10, 0);
    ctx.lineTo(-14, 6);
    ctx.lineTo(-4, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = en.enraged ? '#FEF08A' : '#FB923C';
    ctx.beginPath();
    ctx.arc(5, 0, 4.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'healer') {
    // Bio-Medic Support Drone with Rotating Plus Emblem
    ctx.fillStyle = flash ? '#FFFFFF' : '#064E3B';
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(-7, -2.5, 14, 5);
    ctx.fillRect(-2.5, -7, 5, 14);
  } else if (en.kind === 'teleporter') {
    // Chrono Phase Diamond with Orbiting Rings
    ctx.save();
    ctx.rotate(animTime * 4);
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = flash ? '#FFFFFF' : '#4C1D95';
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2;
    drawPolygon(ctx, 0, 0, 4, 14, 0);
    ctx.fill();
    ctx.stroke();
  } else if (en.kind === 'summoner') {
    // Mothership Hive Carrier with 3 Orbiting Hatchery Pods
    ctx.fillStyle = flash ? '#FFFFFF' : '#3B0764';
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 5, 17, 0);
    ctx.fill();
    ctx.stroke();
    for (let o = 0; o < 3; o++) {
      const oa = animTime * 3.5 + (o * Math.PI * 2) / 3;
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(Math.cos(oa) * 14, Math.sin(oa) * 14, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (en.kind === 'leech') {
    // EMP Siphoner Stingray
    ctx.fillStyle = flash ? '#FFFFFF' : '#164E63';
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.quadraticCurveTo(0, -17, -14, -9);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-14, 9);
    ctx.quadraticCurveTo(0, 17, 17, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#A855F7';
    ctx.beginPath();
    ctx.arc(2, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'splitter') {
    // Cyber Arachnid Swarm Unit
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 1.6;
    const legWiggle = Math.sin(animTime * 20 + en.id) * 3;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(4, sgn * 5);
      ctx.lineTo(7, sgn * (12 + legWiggle));
      ctx.moveTo(-4, sgn * 5);
      ctx.lineTo(-8, sgn * (12 - legWiggle));
      ctx.stroke();
    }
    ctx.fillStyle = flash ? '#FFFFFF' : '#701A75';
    ctx.strokeStyle = '#F472B6';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (en.kind === 'stealth') {
    // Razor Stealth Interceptor
    ctx.fillStyle = flash ? '#FFFFFF' : '#064E3B';
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-11, -13);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-11, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6EE7B7';
    ctx.fillRect(-2, -1.5, 11, 3);
  } else {
    // Scout: Sharp Swept Cyber-Jet Fighter + Twin Afterburner Plumes
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(-10, -6.5);
    ctx.lineTo(-19 * pulse, -4.5);
    ctx.lineTo(-10, -2.5);
    ctx.moveTo(-10, 2.5);
    ctx.lineTo(-19 * pulse, 4.5);
    ctx.lineTo(-10, 6.5);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : '#0F172A';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(1, -6);
    ctx.lineTo(-11, -15);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-8, 4);
    ctx.lineTo(-11, 15);
    ctx.lineTo(1, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = flash ? '#FFFFFF' : '#0284C7';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-6, -4.5);
    ctx.lineTo(-6, 4.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Crisp Segmented Health + Shield Bars (Boss gets wide nameplate + segmented HP bar!)
  if (!isKo) {
    if (en.kind === 'boss') {
      const bw = 54;
      const by = -en.radius - 17;
      ctx.fillStyle = 'rgba(7, 11, 20, 0.92)';
      ctx.fillRect(-bw / 2 - 2, by - 12, bw + 4, 20);
      ctx.fillStyle = '#FDA4AF';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS DREADNOUGHT', 0, by - 4);

      const hpRatio = Math.max(0, Math.min(1, en.hp / Math.max(1, en.maxHp)));
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(-bw / 2, by, bw, 5);
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(-bw / 2, by, bw * hpRatio, 5);
      // 4 HP segment ticks
      ctx.fillStyle = '#070B14';
      for (let t = 1; t < 4; t++) {
        ctx.fillRect(-bw / 2 + (bw * t) / 4, by, 1, 5);
      }
      if (en.maxShield > 0 && en.shield > 0) {
        const sRatio = Math.max(0, Math.min(1, en.shield / en.maxShield));
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-bw / 2, by - 3, bw * sRatio, 2.5);
      }
    } else if (en.hp < en.maxHp || en.shield > 0 || en.isElite) {
      const bw = Math.max(24, en.radius * 1.7);
      const by = -en.radius - 9;
      ctx.fillStyle = 'rgba(7, 11, 20, 0.86)';
      ctx.fillRect(-bw / 2 - 1, by - 1, bw + 2, 5);
      const hpRatio = Math.max(0, Math.min(1, en.hp / Math.max(1, en.maxHp)));
      ctx.fillStyle = en.isElite ? '#FBBF24' : '#34D399';
      ctx.fillRect(-bw / 2, by, bw * hpRatio, 3);
      if (en.maxShield > 0 && en.shield > 0) {
        const sRatio = Math.max(0, Math.min(1, en.shield / en.maxShield));
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-bw / 2, by - 3, bw * sRatio, 2);
      }
    }
  }

  ctx.restore();
}
