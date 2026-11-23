import {
  AuroraPylonFx,
  CarrierDrone,
  ChronoField,
  ChronoSlashFx,
  GunType,
  GunVariant,
  LightningArc,
  MAX_GUN_LEVEL,
  OrbitalBeamFx,
  OrbitalRadiationZone,
  ProjectileItem,
  QuantumEchoArcFx,
  RailBeamFx,
  SingularityHole,
  TdEnemy,
  VoidRiftFx,
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
  kind: 'scorch' | 'frost' | 'plasma';
}

export interface OverheatFx {
  kind:
    | 'phoenix'
    | 'vortex'
    | 'cyclone'
    | 'hex_lattice'
    | 'target_lock'
    | 'solar_flare'
    | 'radar_sweep'
    | 'emp_ring'
    | 'supernova_nova'
    | 'chrono_collapse'
    | 'void_cataclysm'
    | 'quantum_singularity'
    | 'prism_web'
    | 'doomsday_blast'
    | 'aurora_storm'
    | 'solar_bounty'
    | 'paradox_rift'
    | 'nebula_swarm'
    | 'aegis_nova'
    | 'phase2_surge'
    | 'overdrive_apex';
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
    ctx.globalAlpha = fade * 0.52;
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

export function drawLightningArcEnhanced(
  ctx: CanvasRenderingContext2D,
  arc: LightningArc,
  animTime: number,
  alphaScale = 1
) {
  if (arc.points.length < 2) return;
  const safeScale = Math.max(0.38, Math.min(1, alphaScale));
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer electric bloom
  ctx.globalAlpha = arc.alpha * (arc.isWetOverdrive ? 0.52 : 0.36) * safeScale;
  ctx.strokeStyle = arc.isWetOverdrive ? '#22D3EE' : arc.color;
  ctx.lineWidth = arc.width * (arc.isWetOverdrive ? 3.4 : 2.6);
  ctx.beginPath();
  ctx.moveTo(arc.points[0].x, arc.points[0].y);
  for (let i = 1; i < arc.points.length; i++) {
    ctx.lineTo(arc.points[i].x, arc.points[i].y);
  }
  ctx.stroke();

  // Mid plasma filament
  ctx.globalAlpha = arc.alpha * 0.92 * safeScale;
  ctx.strokeStyle = arc.isWetOverdrive ? '#FDE047' : arc.color;
  ctx.lineWidth = arc.width * 1.25;
  ctx.beginPath();
  ctx.moveTo(arc.points[0].x, arc.points[0].y);
  for (let i = 1; i < arc.points.length; i++) {
    ctx.lineTo(arc.points[i].x, arc.points[i].y);
  }
  ctx.stroke();

  // Razor white inner arc core
  ctx.globalAlpha = arc.alpha * safeScale;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.1, arc.width * 0.55);
  ctx.beginPath();
  ctx.moveTo(arc.points[0].x, arc.points[0].y);
  for (let i = 1; i < arc.points.length; i++) {
    ctx.lineTo(arc.points[i].x, arc.points[i].y);
  }
  ctx.stroke();

  // Optional forked side tendrils & node corona flares
  if (arc.branches && arc.branches.length > 0) {
    ctx.globalAlpha = arc.alpha * 0.72 * safeScale;
    ctx.strokeStyle = arc.isWetOverdrive ? '#67E8F9' : '#BAE6FD';
    ctx.lineWidth = Math.max(1, arc.width * 0.48);
    for (const br of arc.branches) {
      ctx.beginPath();
      ctx.moveTo(br.x1, br.y1);
      ctx.lineTo(br.x2, br.y2);
      ctx.stroke();
    }
  }

  for (let i = 1; i < arc.points.length; i++) {
    const pt = arc.points[i];
    if (i % 2 === 0 && i < arc.points.length - 1) continue;
    ctx.globalAlpha = arc.alpha * 0.85 * safeScale;
    ctx.fillStyle = arc.isWetOverdrive ? '#FDE047' : '#E0F2FE';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (arc.isWetOverdrive ? 4.4 : 3.2) + Math.sin(animTime * 28 + i) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
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
    } else if (fx.kind === 'emp_ring') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.28 + (1 - t) * 0.72;
      ctx.globalAlpha = t * 0.9;
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * expand, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#E0E7FF';
      ctx.lineWidth = 1.6;
      for (let b = 0; b < 8; b++) {
        const ba = (b * Math.PI) / 4 + animTime * 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ba) * fx.radius * expand * 0.55, Math.sin(ba) * fx.radius * expand * 0.55);
        ctx.lineTo(Math.cos(ba + 0.18) * fx.radius * expand, Math.sin(ba + 0.18) * fx.radius * expand);
        ctx.stroke();
      }
    } else if (fx.kind === 'hex_lattice') {
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
      ctx.globalAlpha = t * 0.92;
      ctx.strokeStyle = '#22D3EE';
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
    } else if (fx.kind === 'radar_sweep') {
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
    } else if (fx.kind === 'supernova_nova') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.22 + (1 - t) * 0.78;
      ctx.globalAlpha = t * 0.92;
      const ng = ctx.createRadialGradient(0, 0, 6, 0, 0, fx.radius * expand);
      ng.addColorStop(0, '#FFFFFF');
      ng.addColorStop(0.28, '#FEF08A');
      ng.addColorStop(0.65, 'rgba(250, 204, 21, 0.42)');
      ng.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * expand, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * expand, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      for (let r = 0; r < 10; r++) {
        const ra = (r * Math.PI * 2) / 10 + animTime * 3.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ra) * 14, Math.sin(ra) * 14);
        ctx.lineTo(Math.cos(ra) * fx.radius * expand, Math.sin(ra) * fx.radius * expand);
        ctx.stroke();
      }
    } else if (fx.kind === 'chrono_collapse') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.25 + (1 - t) * 0.75;
      ctx.globalAlpha = t * 0.92;
      const cg = ctx.createRadialGradient(0, 0, 8, 0, 0, fx.radius * expand);
      cg.addColorStop(0, '#FFFFFF');
      cg.addColorStop(0.25, '#67E8F9');
      cg.addColorStop(0.65, 'rgba(192, 132, 252, 0.35)');
      cg.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * expand, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#67E8F9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, fx.radius * expand, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#C084FC';
      ctx.lineWidth = 2;
      for (let h = 0; h < 12; h++) {
        const ha = (h * Math.PI * 2) / 12 - animTime * 2.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ha) * fx.radius * expand * 0.76, Math.sin(ha) * fx.radius * expand * 0.76);
        ctx.lineTo(Math.cos(ha) * fx.radius * expand, Math.sin(ha) * fx.radius * expand);
        ctx.stroke();
      }
    } else if (fx.kind === 'overdrive_apex') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.18 + (1 - t) * 0.85;
      const curR = fx.radius * expand;
      ctx.globalAlpha = Math.min(0.95, t * 1.15);
      const og = ctx.createRadialGradient(0, 0, 10, 0, 0, curR);
      og.addColorStop(0, '#FFFFFF');
      og.addColorStop(0.22, '#FDE047');
      og.addColorStop(0.55, 'rgba(244, 63, 94, 0.38)');
      og.addColorStop(0.82, 'rgba(56, 189, 248, 0.2)');
      og.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, curR * 0.72, animTime * 2.5, animTime * 2.5 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let ray = 0; ray < 12; ray++) {
        const ra = (ray * Math.PI * 2) / 12 + animTime * 1.8;
        ctx.strokeStyle = ray % 2 === 0 ? '#FEF08A' : '#67E8F9';
        ctx.lineWidth = ray % 2 === 0 ? 2.4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ra) * 18, Math.sin(ra) * 18);
        ctx.lineTo(Math.cos(ra) * curR * 1.05, Math.sin(ra) * curR * 1.05);
        ctx.stroke();
      }
    } else if (fx.kind === 'void_cataclysm') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.25 + (1 - t) * 0.75;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.88;
      const vg = ctx.createRadialGradient(0, 0, 8, 0, 0, curR);
      vg.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      vg.addColorStop(0.28, 'rgba(240, 171, 252, 0.45)');
      vg.addColorStop(0.68, 'rgba(168, 85, 247, 0.22)');
      vg.addColorStop(1, 'rgba(88, 28, 135, 0)');
      ctx.fillStyle = vg;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#F0ABFC';
      ctx.lineWidth = 2.6;
      drawPolygon(ctx, 0, 0, 6, curR * 0.92, animTime * 1.8);
      ctx.stroke();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.6;
      drawPolygon(ctx, 0, 0, 6, curR * 0.62, -animTime * 2.5);
      ctx.stroke();
    } else if (fx.kind === 'quantum_singularity') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.3 + (1 - t) * 0.7;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.86;
      ctx.strokeStyle = '#34D399';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([8, 5]);
      ctx.lineDashOffset = -animTime * 24;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#A7F3D0';
      ctx.lineWidth = 1.8;
      drawPolygon(ctx, 0, 0, 8, curR * 0.68, animTime * 1.4);
      ctx.stroke();
    } else if (fx.kind === 'prism_web') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.25 + (1 - t) * 0.75;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.9;
      const hues = ['#38BDF8', '#FDE047', '#E879F9', '#34D399', '#FB7185', '#67E8F9'];
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + animTime * 2.2;
        ctx.strokeStyle = hues[i % hues.length];
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * curR, Math.sin(a) * curR);
        ctx.stroke();
      }
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      drawPolygon(ctx, 0, 0, 3, curR * 0.55, animTime * 2);
      ctx.stroke();
    } else if (fx.kind === 'doomsday_blast' || fx.kind === 'phase2_surge') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.2 + (1 - t) * 0.85;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.92;
      const dg = ctx.createRadialGradient(0, 0, 6, 0, 0, curR);
      dg.addColorStop(0, '#FFFFFF');
      dg.addColorStop(0.28, fx.kind === 'phase2_surge' ? '#FDE047' : '#FB7185');
      dg.addColorStop(0.66, fx.kind === 'phase2_surge' ? 'rgba(239, 68, 68, 0.42)' : 'rgba(225, 29, 72, 0.36)');
      dg.addColorStop(1, 'rgba(225, 29, 72, 0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = fx.color || '#F43F5E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.kind === 'aegis_nova') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.24 + (1 - t) * 0.78;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.92;
      const ag = ctx.createRadialGradient(0, 0, 8, 0, 0, curR);
      ag.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      ag.addColorStop(0.28, 'rgba(56, 189, 248, 0.44)');
      ag.addColorStop(0.66, 'rgba(250, 204, 21, 0.22)');
      ag.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = ag;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 3;
      drawPolygon(ctx, 0, 0, 6, curR * 0.92, animTime * 1.3);
      ctx.stroke();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;
      drawPolygon(ctx, 0, 0, 6, curR * 0.68, -animTime * 1.6);
      ctx.stroke();
    } else if (fx.kind === 'aurora_storm') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.3 + (1 - t) * 0.7;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.88;
      ctx.strokeStyle = '#2DD4BF';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#67E8F9';
      ctx.lineWidth = 1.8;
      drawPolygon(ctx, 0, 0, 4, curR * 0.72, animTime * 3.4);
      ctx.stroke();
    } else if (fx.kind === 'solar_bounty') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.25 + (1 - t) * 0.75;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.9;
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 2.6;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4 + animTime * 2.8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
        ctx.lineTo(Math.cos(a) * curR, Math.sin(a) * curR);
        ctx.stroke();
      }
    } else if (fx.kind === 'paradox_rift') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.25 + (1 - t) * 0.75;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.9;
      ctx.strokeStyle = '#67E8F9';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, curR, animTime * 4, animTime * 4 + Math.PI * 1.45);
      ctx.stroke();
      ctx.strokeStyle = '#C084FC';
      ctx.beginPath();
      ctx.arc(0, 0, curR * 0.74, -animTime * 5, -animTime * 5 + Math.PI * 1.45);
      ctx.stroke();
    } else if (fx.kind === 'nebula_swarm') {
      ctx.translate(fx.x, fx.y);
      const expand = 0.22 + (1 - t) * 0.8;
      const curR = fx.radius * expand;
      ctx.globalAlpha = t * 0.9;
      const ng = ctx.createRadialGradient(0, 0, 6, 0, 0, curR);
      ng.addColorStop(0, '#FFFFFF');
      ng.addColorStop(0.32, '#F0ABFC');
      ng.addColorStop(0.7, 'rgba(56, 189, 248, 0.28)');
      ng.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F0ABFC';
      ctx.lineWidth = 2.4;
      drawPolygon(ctx, 0, 0, 5, curR * 0.84, animTime * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export function drawRailBeamEnhanced(
  ctx: CanvasRenderingContext2D,
  rb: RailBeamFx,
  _animTime: number,
  alphaScale = 1
) {
  ctx.save();
  const rTier = rb.visualTier;
  const effAlpha = rb.alpha * Math.max(0.4, Math.min(1, alphaScale));
  ctx.globalAlpha = effAlpha;
  ctx.lineCap = 'round';

  const isSupernovaBeam = rb.variant === 'supernova';
  const isAstralBeam = rb.variant === 'astral_ark';
  const isPrismBeam = rb.variant === 'prism_refract';
  const beamScale = isAstralBeam ? 1.62 : isSupernovaBeam ? 1.48 : isPrismBeam ? 1.18 : 1;

  ctx.strokeStyle = rb.color;
  ctx.lineWidth = (17 + rTier * 4.2) * beamScale * rb.alpha;
  ctx.beginPath();
  ctx.moveTo(rb.x1, rb.y1);
  ctx.lineTo(rb.x2, rb.y2);
  ctx.stroke();

  ctx.strokeStyle = isAstralBeam
    ? '#F0ABFC'
    : isSupernovaBeam
      ? '#FDE047'
      : isPrismBeam
        ? '#67E8F9'
        : rTier >= 3
          ? '#FDE047'
          : '#E879F9';
  ctx.lineWidth = (7.5 + rTier * 2) * beamScale * rb.alpha;
  ctx.beginPath();
  ctx.moveTo(rb.x1, rb.y1);
  ctx.lineTo(rb.x2, rb.y2);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = (3 + rTier * 0.9) * beamScale * rb.alpha;
  ctx.beginPath();
  ctx.moveTo(rb.x1, rb.y1);
  ctx.lineTo(rb.x2, rb.y2);
  ctx.stroke();

  const beamAngle = Math.atan2(rb.y2 - rb.y1, rb.x2 - rb.x1);
  const ringCount = (isAstralBeam ? 6 : isSupernovaBeam ? 5 : isPrismBeam ? 4 : 3) + rTier;
  for (let m = 1; m <= ringCount; m++) {
    const frac = 0.06 + m * 0.11;
    const rx = rb.x1 + (rb.x2 - rb.x1) * frac;
    const ry = rb.y1 + (rb.y2 - rb.y1) * frac;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(beamAngle);
    ctx.strokeStyle = isAstralBeam
      ? '#67E8F9'
      : isSupernovaBeam
        ? '#FEF08A'
        : isPrismBeam
          ? (m % 2 === 0 ? '#E879F9' : '#FDE047')
          : rTier >= 3
            ? '#38BDF8'
            : '#FEF08A';
    ctx.lineWidth = isAstralBeam || isSupernovaBeam || isPrismBeam ? 2.4 : 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, (16 + rTier * 3 - m * 1.6) * (1.25 - rb.alpha * 0.4), 0, 0, Math.PI * 2);
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
  if (pr.trail && pr.trail.length >= 2) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 1; i < pr.trail.length; i++) {
      const ratio = i / pr.trail.length;
      ctx.globalAlpha = ratio * (pr.isCrit ? 0.64 : 0.48);
      ctx.strokeStyle = pr.isCrit ? '#FDE047' : pr.color;
      ctx.lineWidth = Math.max(1.2, ratio * (pr.kind === 'mortar' || pr.kind === 'missile' ? 5 : 3.2));
      ctx.beginPath();
      ctx.moveTo(pr.trail[i - 1].x, pr.trail[i - 1].y);
      ctx.lineTo(pr.trail[i].x, pr.trail[i].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(pr.x, pr.y);

  if (pr.isCrit) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

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
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 10 + pr.visualTier);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.4, '#818CF8');
    g.addColorStop(0.8, '#38BDF8');
    g.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 10 + pr.visualTier, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#E0E7FF';
    ctx.lineWidth = 1.6;
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9.5, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9.5, 4.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (pr.kind === 'supernova_orb') {
    const spin = animTime * 16 + pr.id;
    const orbR = 13 + pr.visualTier * 1.4;
    const g = ctx.createRadialGradient(0, 0, 1.5, 0, 0, orbR);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.38, '#FEF08A');
    g.addColorStop(0.75, pr.color || '#F59E0B');
    g.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, orbR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    ctx.rotate(spin);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbR * 0.92, 4.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#FEF08A';
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, orbR * 0.92, 4.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (pr.kind === 'paradox_scythe') {
    ctx.rotate(animTime * 24 + pr.id);
    const scR = 13 + pr.visualTier * 1.3;
    ctx.strokeStyle = pr.isReturning ? '#C084FC' : '#67E8F9';
    ctx.fillStyle = 'rgba(103, 232, 249, 0.34)';
    ctx.lineWidth = 2.2;
    for (let b = 0; b < 2; b++) {
      ctx.save();
      ctx.rotate(b * Math.PI);
      ctx.beginPath();
      ctx.arc(0, 0, scR, -0.75, 1.35);
      ctx.arc(2.5, 0, scR * 0.62, 1.35, -0.75, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (pr.kind === 'nebula_meteor') {
    const mR = 12 + pr.visualTier * 1.4;
    const mg = ctx.createRadialGradient(0, 0, 1.5, 0, 0, mR);
    mg.addColorStop(0, '#FFFFFF');
    mg.addColorStop(0.35, '#F0ABFC');
    mg.addColorStop(0.78, pr.color || '#A855F7');
    mg.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(0, 0, mR, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(animTime * 14 + pr.id);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, mR * 1.05, 4.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.rotate(Math.atan2(pr.vy, pr.vx));

  if (pr.kind === 'hyperion_shell') {
    const s = 1 + pr.visualTier * 0.1;
    ctx.scale(s, s);
    const hg = ctx.createLinearGradient(-16, 0, 14, 0);
    hg.addColorStop(0, 'rgba(244, 63, 94, 0)');
    hg.addColorStop(0.45, '#F43F5E');
    hg.addColorStop(1, '#FEF08A');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -6.5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (pr.kind === 'golden_lance') {
    const s = 1 + pr.visualTier * 0.08;
    ctx.scale(s, s);
    ctx.fillStyle = '#FEF08A';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(17, 0);
    ctx.lineTo(-4, -4.5);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-4, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-5, -1.2, 16, 2.4);
    ctx.restore();
    return;
  }

  if (pr.kind === 'aegis_lance') {
    const s = 1 + pr.visualTier * 0.09;
    ctx.scale(s, s);
    ctx.fillStyle = pr.color === '#FDE047' ? '#FEF08A' : '#38BDF8';
    ctx.strokeStyle = pr.color === '#FDE047' ? '#F59E0B' : '#BAE6FD';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(3, -6.5);
    ctx.lineTo(-10, -4.5);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-10, 4.5);
    ctx.lineTo(3, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-5, -1.4, 17, 2.8);
    ctx.restore();
    return;
  }

  if (pr.kind === 'mortar') {
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
  } else {
    // High-energy Gatling AP tracer
    const bg = ctx.createLinearGradient(-16, 0, 8, 0);
    bg.addColorStop(0, 'rgba(56, 189, 248, 0)');
    bg.addColorStop(0.45, pr.isCrit ? '#FDE047' : pr.color);
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
  const tier: 1 | 2 | 3 | 4 = level >= MAX_GUN_LEVEL ? 4 : level >= 5 ? 3 : level >= 3 ? 2 : 1;
  const isOmega = variant === 'omega';
  const baseRadius = 19.5 + (tier - 1) * 1.4;

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

  if (tier === 4) {
    ctx.save();
    ctx.rotate(animTime * 2.5);
    ctx.strokeStyle = isOmega ? 'rgba(251, 146, 60, 0.92)' : 'rgba(250, 204, 21, 0.9)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    // 4 Orbiting Apex Lv7 Satellites so Lv7 towers stand out unmistakably
    ctx.setLineDash([]);
    for (let sat = 0; sat < 4; sat++) {
      const sa = (sat * Math.PI) / 2;
      const sx = Math.cos(sa) * 28.5;
      const sy = Math.sin(sa) * 28.5;
      ctx.fillStyle = isOmega ? '#FB7185' : '#FEF08A';
      ctx.strokeStyle = '#070B14';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
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

  const baseGrad = ctx.createLinearGradient(-baseRadius, -baseRadius, baseRadius, baseRadius);
  if (type === 'tesla' || type === 'tempest' || type === 'aurora_spire') {
    baseGrad.addColorStop(0, '#0C4A6E');
    baseGrad.addColorStop(1, '#090D16');
  } else if (type === 'beacon' || type === 'cryo' || type === 'radar' || type === 'quantum_prism') {
    baseGrad.addColorStop(0, '#064E3B');
    baseGrad.addColorStop(1, '#090D16');
  } else if (type === 'astral_ark' || type === 'nebula_core') {
    baseGrad.addColorStop(0, '#4A044E');
    baseGrad.addColorStop(1, '#090D16');
  } else if (type === 'aurelia_cannon') {
    baseGrad.addColorStop(0, '#422006');
    baseGrad.addColorStop(1, '#090D16');
  } else if (type === 'paradox_scythe') {
    baseGrad.addColorStop(0, '#083344');
    baseGrad.addColorStop(1, '#090D16');
  } else if (isOmega) {
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
  } else if (type === 'tempest') {
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
  } else if (type === 'orbital') {
    // Solar Uplink Satellite Dish + Sky-Beam Emitter Core
    ctx.save();
    ctx.rotate(aimAngle * 0.35 + animTime * 0.8);
    ctx.fillStyle = '#27130A';
    ctx.strokeStyle = isOmega ? '#EF4444' : '#F97316';
    ctx.lineWidth = 2.1;
    drawPolygon(ctx, 0, 0, 6, 15 + tier * 0.8, 0);
    ctx.fill();
    ctx.stroke();
    // Parabolic solar uplink fins
    for (let f = 0; f < 3; f++) {
      const fa = (f * Math.PI * 2) / 3;
      ctx.save();
      ctx.rotate(fa);
      ctx.fillStyle = isOmega ? '#FCA5A5' : '#FDBA74';
      ctx.fillRect(10, -2.5, 8 + tier, 5);
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 0, 6.2 + tier * 0.6 + Math.sin(animTime * 8) * 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'singularity') {
    // Gravitational Singularity Reactor Pad + Contained Event Horizon
    ctx.save();
    ctx.rotate(-animTime * (1.8 + tier * 0.4));
    ctx.strokeStyle = isOmega ? '#E879F9' : '#A855F7';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 + tier, 9, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 + tier, 9, -0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5 + tier * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'mothership') {
    // Sci-Fi Carrier Airfield Pad + Runway Chevrons
    ctx.save();
    ctx.rotate(aimAngle);
    ctx.fillStyle = '#082F49';
    ctx.strokeStyle = isOmega ? '#FACC15' : '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(19 + tier, 0);
    ctx.lineTo(-10, -14 - tier * 0.5);
    ctx.lineTo(-15, -6);
    ctx.lineTo(-15, 6);
    ctx.lineTo(-10, 14 + tier * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Illuminated flight deck runway strip
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = isOmega ? '#FDE047' : '#7DD3FC';
    ctx.beginPath();
    ctx.arc(-4, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'supernova') {
    // 500-Energy Apex Supernova Star-Cannon: counter-rotating celestial astrolabe rings + twin golden prism barrels
    ctx.save();
    ctx.rotate(animTime * 2.2);
    ctx.strokeStyle = isOmega ? '#F59E0B' : '#FDE047';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius + 4.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-animTime * 3.1);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    drawPolygon(ctx, 0, 0, 6, 15 + tier * 0.9, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5;
    const len = 21 + tier * 2.4;
    ctx.fillStyle = isOmega ? '#F59E0B' : '#FDE047';
    ctx.fillRect(2 - kick, -7.5, len, 4);
    ctx.fillRect(2 - kick, 3.5, len, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(6 - kick, -2, len - 2, 4);

    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 8, 12.5 + tier * 0.6, Math.PI / 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Pulsing white-gold stellar singularity core
    const starGlow = 5.2 + tier * 0.65 + Math.sin(animTime * 9) * 1.1;
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, 0, starGlow, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, starGlow * 0.52, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'chronos') {
    // 800-Energy Transcendent Chronos Sovereign: counter-rotating astral clock rings, prism hands & cyan-violet singularity
    ctx.save();
    ctx.rotate(animTime * 1.4);
    ctx.strokeStyle = isOmega ? '#C084FC' : '#22D3EE';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius + 5.5, 0, Math.PI * 2);
    ctx.stroke();
    for (let tick = 0; tick < 12; tick++) {
      const ta = (tick * Math.PI * 2) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ta) * (baseRadius + 2.5), Math.sin(ta) * (baseRadius + 2.5));
      ctx.lineTo(Math.cos(ta) * (baseRadius + 6.5), Math.sin(ta) * (baseRadius + 6.5));
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.rotate(-animTime * 2.8);
    ctx.strokeStyle = isOmega ? '#67E8F9' : '#C084FC';
    ctx.lineWidth = 2;
    drawPolygon(ctx, 0, 0, 4, 15.5 + tier * 0.8, 0);
    ctx.stroke();
    drawPolygon(ctx, 0, 0, 4, 15.5 + tier * 0.8, Math.PI / 4);
    ctx.stroke();
    ctx.restore();

    // Sweeping astral clock hands
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4.5;
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.moveTo(22 + tier * 2.2 - kick, 0);
    ctx.lineTo(2 - kick, -5);
    ctx.lineTo(-7 - kick, 0);
    ctx.lineTo(2 - kick, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#0B1120';
    ctx.strokeStyle = '#67E8F9';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 8, 11.5 + tier * 0.6, Math.PI / 8);
    ctx.fill();
    ctx.stroke();

    const chronoPulse = 5 + tier * 0.6 + Math.sin(animTime * 10) * 1.1;
    ctx.fillStyle = isOmega ? '#E879F9' : '#67E8F9';
    ctx.beginPath();
    ctx.arc(0, 0, chronoPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, chronoPulse * 0.52, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'astral_ark') {
    // 1000-Energy Apex Astral Void Ark: tri-prism orbital crown + twin void rail emitters + core singularity
    ctx.save();
    ctx.rotate(animTime * 1.9);
    ctx.strokeStyle = isOmega ? '#FB7185' : '#F0ABFC';
    ctx.lineWidth = 2.4;
    drawPolygon(ctx, 0, 0, 3, baseRadius + 5, 0);
    ctx.stroke();
    drawPolygon(ctx, 0, 0, 3, baseRadius + 5, Math.PI / 3);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5;
    const len = 24 + tier * 2.5;
    ctx.fillStyle = isOmega ? '#F43F5E' : '#E879F9';
    ctx.fillRect(3 - kick, -8.5, len, 3.6);
    ctx.fillRect(3 - kick, 4.9, len, 3.6);
    ctx.fillStyle = '#67E8F9';
    ctx.fillRect(6 - kick, -2.2, len - 2, 4.4);
    ctx.fillStyle = '#1E0B36';
    ctx.strokeStyle = '#F0ABFC';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 6, 13 + tier * 0.6, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const voidCore = 5.4 + tier * 0.6 + Math.sin(animTime * 10) * 1.1;
    ctx.fillStyle = isOmega ? '#FB7185' : '#E879F9';
    ctx.beginPath();
    ctx.arc(0, 0, voidCore, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, voidCore * 0.48, 0, Math.PI * 2);
    ctx.fill();
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
  } else if (type === 'radar') {
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
  } else if (type === 'quantum_prism') {
    // 500-Energy Pure Support Quantum Prism: nested harmonic emerald gyroscope + octahedral crystal
    ctx.save();
    ctx.rotate(animTime * 2.1);
    ctx.strokeStyle = isOmega ? '#2DD4BF' : '#34D399';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17 + tier, 8.5, 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#A7F3D0';
    ctx.beginPath();
    ctx.ellipse(0, 0, 17 + tier, 8.5, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-animTime * 2.6);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.strokeStyle = '#6EE7B7';
    ctx.lineWidth = 2;
    drawPolygon(ctx, 0, 0, 4, 11.5 + tier * 0.7, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ECFDF5';
    ctx.beginPath();
    ctx.arc(0, 0, 4.8 + tier * 0.45 + Math.sin(animTime * 8) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'prism_refract') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3.5;
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = isOmega ? '#C084FC' : '#38BDF8';
    ctx.lineWidth = 2.1;
    drawPolygon(ctx, -kick * 0.5, 0, 3, 15 + tier * 0.8, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(2 - kick * 0.5, 0, 4.5 + tier * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'hyperion') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5.5;
    const len = 21 + tier * 2.5;
    ctx.fillStyle = isOmega ? '#E11D48' : '#FB7185';
    ctx.fillRect(2 - kick, -8.5, len, 4.8);
    ctx.fillRect(2 - kick, 3.7, len, 4.8);
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(6 - kick, -2, len - 4, 4);
    ctx.fillStyle = '#2A0510';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 8, 12.5 + tier * 0.6, Math.PI / 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'aurora_spire') {
    ctx.save();
    ctx.rotate(animTime * 2.4);
    ctx.strokeStyle = isOmega ? '#38BDF8' : '#2DD4BF';
    ctx.lineWidth = 2.1;
    drawPolygon(ctx, 0, 0, 4, 16 + tier, 0);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#99F6E4';
    ctx.beginPath();
    ctx.arc(0, 0, 6 + tier * 0.6 + Math.sin(animTime * 10) * 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'aurelia_cannon') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4;
    ctx.fillStyle = '#422006';
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(22 + tier * 2 - kick, 0);
    ctx.lineTo(-4 - kick, -12);
    ctx.lineTo(-10 - kick, 0);
    ctx.lineTo(-4 - kick, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(2 - kick, 0, 5.2 + tier * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (type === 'paradox_scythe') {
    ctx.save();
    ctx.rotate(-animTime * 3.8);
    ctx.strokeStyle = isOmega ? '#C084FC' : '#67E8F9';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, 15 + tier * 0.8, 0, Math.PI * 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 15 + tier * 0.8, Math.PI, Math.PI * 2.2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5 + tier * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'aegis_bastion') {
    ctx.save();
    ctx.rotate(animTime * 0.85);
    ctx.strokeStyle = isOmega ? '#FDE047' : '#38BDF8';
    ctx.lineWidth = 2.4;
    drawPolygon(ctx, 0, 0, 6, 17 + tier * 1.1, 0);
    ctx.stroke();
    ctx.fillStyle = isOmega ? 'rgba(250, 204, 21, 0.14)' : 'rgba(56, 189, 248, 0.16)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.rotate(aimAngle);
    ctx.fillStyle = '#0B1222';
    ctx.strokeStyle = isOmega ? '#FDE047' : '#7DD3FC';
    ctx.lineWidth = 1.6;
    ctx.fillRect(-3, -6.5, 19 + tier, 13);
    ctx.strokeRect(-3, -6.5, 19 + tier, 13);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(6, -1.8, 12 + tier, 3.6);
    ctx.restore();

    ctx.fillStyle = isOmega ? '#FDE047' : '#38BDF8';
    ctx.beginPath();
    ctx.arc(0, 0, 6 + tier * 0.55, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'nebula_core') {
    ctx.save();
    ctx.rotate(animTime * 2.1);
    ctx.strokeStyle = isOmega ? '#FB7185' : '#F0ABFC';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 + tier, 7.5, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#38BDF8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 + tier, 7.5, -0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const nCore = 6 + tier * 0.65 + Math.sin(animTime * 11) * 1;
    ctx.fillStyle = '#F0ABFC';
    ctx.beginPath();
    ctx.arc(0, 0, nCore, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, nCore * 0.48, 0, Math.PI * 2);
    ctx.fill();
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
 * High-contrast, multi-layered enemy, Dreadnought Boss, and Colossus Super Boss renderer.
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
    en.kind === 'stealth' &&
    en.slowTimer <= 0 &&
    en.wetTimer <= 0 &&
    en.markedTimer <= 0 &&
    en.burnTimer <= 0
      ? 0.48 + Math.sin(animTime * 9 + en.id) * 0.2
      : 1;
  ctx.globalAlpha = koAlpha * stealthFade;
  ctx.translate(en.x, en.y);

  const isBossTier = en.kind === 'boss' || en.kind === 'super_boss';

  // Ground shadow
  if (!isKo) {
    ctx.fillStyle = isBossTier ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, isBossTier ? 12 : 7, en.radius * 1.05, en.radius * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wet conductive water ripple under enemy
  if (en.wetTimer > 0 && !isKo) {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.78)';
    ctx.lineWidth = 1.8;
    const ripple = (animTime * 10 + en.id) % 5;
    ctx.beginPath();
    ctx.ellipse(0, 4, en.radius + 4 + ripple, (en.radius + 3 + ripple) * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Boss & Super Boss Aura + Telegraphed Interruptible Skill Windup Halo
  const bossPrimary = en.bossColor || (en.kind === 'super_boss' ? '#FDE047' : '#FB7185');
  const bossSec = en.bossSecondary || (en.kind === 'super_boss' ? '#38BDF8' : '#F97316');
  const isPhase2 = (en.bossPhase ?? 1) >= 2;

  if (en.kind === 'super_boss' && !isKo) {
    ctx.save();
    ctx.rotate(animTime * (isPhase2 ? 4.2 : 2.4));
    ctx.strokeStyle = isPhase2 ? '#EF4444' : bossPrimary;
    ctx.lineWidth = isPhase2 ? 3.2 : 2.6;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + (isPhase2 ? 17 : 14), 0, Math.PI * 2);
    ctx.stroke();
    if (isPhase2) {
      ctx.strokeStyle = bossSec;
      ctx.lineWidth = 2;
      drawPolygon(ctx, 0, 0, 6, en.radius + 12, -animTime * 3.5);
      ctx.stroke();
    }
    ctx.restore();
  } else if (en.kind === 'boss' && !isKo) {
    ctx.save();
    ctx.rotate(animTime * 1.8);
    ctx.strokeStyle = bossPrimary;
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

  // Interruptible Windup Cast Telegraph Gauge
  if (en.windupTimer > 0 && en.windupKind && !isKo) {
    const prog = Math.max(0, Math.min(1, 1 - en.windupTimer / Math.max(0.2, en.windupMax)));
    const wColor =
      en.windupKind === 'shield_surge'
        ? '#38BDF8'
        : en.windupKind === 'armor_bastion'
          ? '#F59E0B'
          : '#C084FC';
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = wColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * prog);
    ctx.stroke();
    ctx.restore();
  }

  // Fortified Bastion Armor Rim
  if (en.fortifyTimer > 0 && !isKo) {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.6;
    drawPolygon(ctx, 0, 0, 6, en.radius + 9, animTime * 1.4);
    ctx.stroke();
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

  // Shield Dome with crisp hex energy facet overlay
  if (en.shield > 0 && !isKo) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.rotate(animTime * 1.4);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.38)';
    ctx.lineWidth = 1;
    drawPolygon(ctx, 0, 0, 6, en.radius + 5, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Quantum Silence Lock Ring (when suppressed by Quantum Prism)
  if ((en.silencedTimer ?? 0) > 0 && !isKo) {
    ctx.save();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 8.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Quantum Damage Echo Lattice Brackets
  if ((en.quantumLinkTimer ?? 0) > 0 && !isKo) {
    ctx.save();
    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 1.5;
    const qr = en.radius + 4;
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.14) * qr, Math.sin(a - 0.14) * qr);
      ctx.lineTo(Math.cos(a) * (qr + 3), Math.sin(a) * (qr + 3));
      ctx.lineTo(Math.cos(a + 0.14) * qr, Math.sin(a + 0.14) * qr);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Electric Shock Crackle around target
  if (en.shockTimer > 0 && !isKo) {
    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) {
      const a = animTime * 18 + k * 2.1 + en.id;
      const r1 = en.radius * 0.7;
      const r2 = en.radius + 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a + 0.25) * r2, Math.sin(a + 0.25) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Radar Target-Lock Crosshair
  if (en.markedTimer > 0 && !isKo) {
    ctx.save();
    ctx.rotate(-animTime * 2.5);
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.8;
    const mr = en.radius + 7.5;
    for (let c = 0; c < 4; c++) {
      const ca = (c * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(0, 0, mr, ca - 0.25, ca + 0.25);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.rotate(en.heading);
  const flash = en.hitFlash > 0;
  const pulse = 0.85 + Math.sin(animTime * 18 + en.id) * 0.18;

  if (en.kind === 'super_boss') {
    // COLOSSUS SUPER BOSS: Layered Dreadnought armor plating, per-map signature palette & Phase-2 rage
    ctx.fillStyle = isPhase2 ? '#EF4444' : bossSec;
    for (const ty of [-13, 0, 13]) {
      ctx.beginPath();
      ctx.moveTo(-24, ty - 4.5);
      ctx.lineTo(-42 - Math.sin(animTime * 30 + ty) * 6, ty);
      ctx.lineTo(-24, ty + 4.5);
      ctx.closePath();
      ctx.fill();
    }

    const colGrad = ctx.createLinearGradient(-28, -28, 32, 28);
    colGrad.addColorStop(0, flash ? '#FFFFFF' : '#1E0829');
    colGrad.addColorStop(0.5, flash ? '#FFFFFF' : isPhase2 ? '#9F1239' : '#581C87');
    colGrad.addColorStop(1, flash ? '#FFFFFF' : '#090D16');
    ctx.fillStyle = colGrad;
    ctx.strokeStyle = isPhase2 ? '#FDE047' : bossPrimary;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(19, -18);
    ctx.lineTo(6, -28);
    ctx.lineTo(-18, -26);
    ctx.lineTo(-29, -14);
    ctx.lineTo(-25, 0);
    ctx.lineTo(-29, 14);
    ctx.lineTo(-18, 26);
    ctx.lineTo(6, 28);
    ctx.lineTo(19, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(253, 224, 71, 0.42)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-21, 0);
    ctx.lineTo(27, 0);
    ctx.moveTo(-14, -18);
    ctx.lineTo(14, -12);
    ctx.moveTo(-14, 18);
    ctx.lineTo(14, 12);
    ctx.stroke();

    ctx.fillStyle = bossPrimary;
    for (const sgn of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(35, sgn * 6);
      ctx.lineTo(20, sgn * 14);
      ctx.lineTo(23, sgn * 5);
      ctx.closePath();
      ctx.fill();
    }

    for (const ty of [-16, 16]) {
      ctx.save();
      ctx.translate(-3, ty);
      ctx.rotate(Math.sin(animTime * 2.8 + ty) * 0.45);
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = bossSec;
      ctx.lineWidth = 1.6;
      ctx.fillRect(0, -3, 14, 6);
      ctx.beginPath();
      ctx.arc(0, 0, 5.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = isPhase2 ? '#FDE047' : bossSec;
    ctx.beginPath();
    ctx.arc(4, 0, 8.2 + Math.sin(animTime * 12) * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(4, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'boss') {
    ctx.fillStyle = bossSec;
    for (const ty of [-11, 11]) {
      ctx.beginPath();
      ctx.moveTo(-20, ty - 4.5);
      ctx.lineTo(-35 - Math.sin(animTime * 28) * 4, ty);
      ctx.lineTo(-20, ty + 4.5);
      ctx.closePath();
      ctx.fill();
    }

    const hullGrad = ctx.createLinearGradient(-22, -22, 26, 22);
    hullGrad.addColorStop(0, flash ? '#FFFFFF' : '#1E1B4B');
    hullGrad.addColorStop(0.5, flash ? '#FFFFFF' : bossPrimary);
    hullGrad.addColorStop(1, flash ? '#FFFFFF' : '#0F172A');
    ctx.fillStyle = hullGrad;
    ctx.strokeStyle = bossPrimary;
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

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.38)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(22, 0);
    ctx.moveTo(-10, -14);
    ctx.lineTo(11, -9);
    ctx.moveTo(-10, 14);
    ctx.lineTo(11, 9);
    ctx.stroke();

    ctx.fillStyle = bossSec;
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

    for (const ty of [-12, 12]) {
      ctx.save();
      ctx.translate(-3, ty);
      ctx.rotate(Math.sin(animTime * 2.4 + ty) * 0.45);
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = bossPrimary;
      ctx.lineWidth = 1.4;
      ctx.fillRect(0, -2.5, 11, 5);
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = bossSec;
    ctx.beginPath();
    ctx.arc(3, 0, 6.2 + Math.sin(animTime * 11) * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(3, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'juggernaut') {
    const treadPhase = (animTime * 22) % 8;
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(-19, -20, 38, 7);
    ctx.fillRect(-19, 13, 38, 7);
    ctx.fillStyle = '#78716C';
    for (let tx = -16 + treadPhase; tx < 16; tx += 8) {
      ctx.fillRect(tx, -19.5, 3.5, 6);
      ctx.fillRect(tx, 13.5, 3.5, 6);
    }
    const jg = ctx.createLinearGradient(-16, -15, 18, 15);
    jg.addColorStop(0, flash ? '#FFFFFF' : '#78350F');
    jg.addColorStop(1, flash ? '#FFFFFF' : '#1C1917');
    ctx.fillStyle = jg;
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-16, -15, 33, 30, 5);
    ctx.fill();
    ctx.stroke();

    // Inner riveted turret cupola + optical visor
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-10, -10, 18, 20);
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
    const treadPhase = (animTime * 18) % 6;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-15, -16, 30, 5);
    ctx.fillRect(-15, 11, 30, 5);
    ctx.fillStyle = '#64748B';
    for (let tx = -12 + treadPhase; tx < 13; tx += 6) {
      ctx.fillRect(tx, -15.5, 2.5, 4);
      ctx.fillRect(tx, 11.5, 2.5, 4);
    }

    const ag = ctx.createLinearGradient(-14, -12, 16, 12);
    ag.addColorStop(0, flash ? '#FFFFFF' : '#B45309');
    ag.addColorStop(1, flash ? '#FFFFFF' : '#1E293B');
    ctx.fillStyle = ag;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    drawPolygon(ctx, 0, 0, 6, 16, 0);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
    ctx.lineWidth = 1.2;
    drawPolygon(ctx, -1, 0, 6, 9, 0);
    ctx.stroke();
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(5, -5, 6, 10);
  } else if (en.kind === 'shieldbearer') {
    ctx.fillStyle = flash ? '#FFFFFF' : '#082F49';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 6, 17, 0);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(4, 0, 14, -0.95, 0.95);
    ctx.stroke();
    ctx.fillStyle = '#7DD3FC';
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(1, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'berserker') {
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(-12, -4);
    ctx.lineTo(-22 * pulse, 0);
    ctx.lineTo(-12, 4);
    ctx.fill();

    ctx.fillStyle = flash ? '#FFFFFF' : '#7C2D12';
    ctx.strokeStyle = en.enraged ? '#EF4444' : '#FB923C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
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
    ctx.fillStyle = flash ? '#FFFFFF' : '#064E3B';
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(134, 239, 172, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 10.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#86EFAC';
    ctx.fillRect(-7, -2.5, 14, 5);
    ctx.fillRect(-2.5, -7, 5, 14);
  } else if (en.kind === 'teleporter') {
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
    ctx.fillStyle = '#F0ABFC';
    ctx.beginPath();
    ctx.arc(2, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'summoner') {
    ctx.fillStyle = flash ? '#FFFFFF' : '#3B0764';
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 2.2;
    drawPolygon(ctx, 0, 0, 5, 17, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E879F9';
    drawPolygon(ctx, 0, 0, 5, 7, Math.PI / 5);
    ctx.fill();
    for (let o = 0; o < 3; o++) {
      const oa = animTime * 3.5 + (o * Math.PI * 2) / 3;
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(Math.cos(oa) * 14, Math.sin(oa) * 14, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (en.kind === 'leech') {
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
    ctx.fillStyle = '#F9A8D4';
    ctx.beginPath();
    ctx.arc(2.5, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'stealth') {
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

  // Unique Map Boss Emblem Badge (rendered upright above hull)
  if (!isKo && isBossTier && en.bossEmblem) {
    ctx.save();
    ctx.translate(0, -en.radius - 2);
    ctx.strokeStyle = bossPrimary;
    ctx.fillStyle = bossSec;
    ctx.lineWidth = 1.5;
    if (en.bossEmblem === 'crown') {
      ctx.beginPath();
      ctx.moveTo(-8, 2);
      ctx.lineTo(-9, -6);
      ctx.lineTo(-4, -2);
      ctx.lineTo(0, -8);
      ctx.lineTo(4, -2);
      ctx.lineTo(9, -6);
      ctx.lineTo(8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (en.bossEmblem === 'horns') {
      ctx.beginPath();
      ctx.moveTo(-6, 1);
      ctx.quadraticCurveTo(-12, -5, -8, -10);
      ctx.moveTo(6, 1);
      ctx.quadraticCurveTo(12, -5, 8, -10);
      ctx.stroke();
    } else if (en.bossEmblem === 'halo') {
      ctx.beginPath();
      ctx.ellipse(0, -5, 9, 3.2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (en.bossEmblem === 'void_star') {
      drawPolygon(ctx, 0, -5, 4, 6.5, animTime * 2);
      ctx.fill();
      ctx.stroke();
    } else if (en.bossEmblem === 'frost_crest') {
      drawPolygon(ctx, 0, -5, 6, 5.8, animTime);
      ctx.stroke();
    } else if (en.bossEmblem === 'solar_wings') {
      ctx.beginPath();
      ctx.moveTo(-11, -3);
      ctx.lineTo(-3, -7);
      ctx.lineTo(0, -4);
      ctx.lineTo(3, -7);
      ctx.lineTo(11, -3);
      ctx.stroke();
    } else if (en.bossEmblem === 'chrono_dial') {
      ctx.beginPath();
      ctx.arc(0, -5, 5.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Segmented Health + Shield Bars + Super Boss / Windup Nameplate
  if (!isKo) {
    if (en.kind === 'super_boss') {
      const labelTitle = en.bossTitle ? en.bossTitle.toUpperCase() : 'SIÊU BOSS COLOSSUS';
      const bw = Math.max(78, Math.min(130, labelTitle.length * 5.2));
      const by = -en.radius - 23;
      ctx.fillStyle = 'rgba(7, 11, 20, 0.94)';
      ctx.fillRect(-bw / 2 - 2, by - 13, bw + 4, 22);
      ctx.fillStyle = (en.silencedTimer ?? 0) > 0 ? '#34D399' : en.windupTimer > 0 ? '#38BDF8' : isPhase2 ? '#F43F5E' : bossPrimary;
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        en.windupTimer > 0
          ? '⚡ TỤ CHIÊU! (NGẮT)'
          : (en.silencedTimer ?? 0) > 0
            ? `✦ CÂM LẶNG · ${labelTitle}`
            : isPhase2
              ? `🔥 PHA 2 · ${labelTitle}`
              : labelTitle,
        0,
        by - 4.5
      );

      const hpRatio = Math.max(0, Math.min(1, en.hp / Math.max(1, en.maxHp)));
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(-bw / 2, by, bw, 5.5);
      ctx.fillStyle = isPhase2 ? '#EF4444' : '#F59E0B';
      ctx.fillRect(-bw / 2, by, bw * hpRatio, 5.5);
      ctx.fillStyle = '#070B14';
      for (let t = 1; t < 6; t++) {
        ctx.fillRect(-bw / 2 + (bw * t) / 6, by, 1, 5.5);
      }
      if (en.maxShield > 0 && en.shield > 0) {
        const sRatio = Math.max(0, Math.min(1, en.shield / en.maxShield));
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-bw / 2, by - 3, bw * sRatio, 2.5);
      }
    } else if (en.kind === 'boss') {
      const labelTitle = en.bossTitle ? en.bossTitle.toUpperCase() : 'BOSS DREADNOUGHT';
      const bw = Math.max(64, Math.min(116, labelTitle.length * 5));
      const by = -en.radius - 20;
      ctx.fillStyle = 'rgba(7, 11, 20, 0.92)';
      ctx.fillRect(-bw / 2 - 2, by - 12, bw + 4, 20);
      ctx.fillStyle = (en.silencedTimer ?? 0) > 0 ? '#34D399' : en.windupTimer > 0 ? '#38BDF8' : bossPrimary;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        en.windupTimer > 0
          ? '⚡ TỤ CHIÊU!'
          : (en.silencedTimer ?? 0) > 0
            ? `✦ CÂM LẶNG · ${labelTitle}`
            : labelTitle,
        0,
        by - 4
      );

      const hpRatio = Math.max(0, Math.min(1, en.hp / Math.max(1, en.maxHp)));
      ctx.fillStyle = '#450A0A';
      ctx.fillRect(-bw / 2, by, bw, 5);
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(-bw / 2, by, bw * hpRatio, 5);
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

/**
 * Renders lingering Orbital magma/radiation zones and towering sky-to-ground laser pillars.
 */
export function drawOrbitalBeamsAndZones(
  ctx: CanvasRenderingContext2D,
  zones: readonly OrbitalRadiationZone[],
  beams: readonly OrbitalBeamFx[],
  animTime: number,
  alphaScale = 1
) {
  const safeScale = Math.max(0.42, Math.min(1, alphaScale));
  for (const z of zones) {
    const fade = Math.max(0.12, Math.min(1, z.life / Math.max(0.4, z.maxLife)));
    ctx.save();
    ctx.globalAlpha = fade * 0.62 * safeScale;
    const grad = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.radius);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.58)');
    grad.addColorStop(0.45, 'rgba(249, 115, 22, 0.42)');
    grad.addColorStop(0.82, 'rgba(220, 38, 38, 0.22)');
    grad.addColorStop(1, 'rgba(127, 29, 29, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bubbling radiation crust perimeter
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.68)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -animTime * 18;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const bm of beams) {
    const t = Math.max(0, Math.min(1, bm.alpha)) * safeScale;
    ctx.save();
    const beamHalfW = (14 + bm.visualTier * 3) * (0.6 + t * 0.4);
    const skyTop = -40;

    // Outer solar column bloom
    ctx.globalAlpha = t * 0.38;
    const colGrad = ctx.createLinearGradient(bm.x - beamHalfW * 2.2, 0, bm.x + beamHalfW * 2.2, 0);
    colGrad.addColorStop(0, 'rgba(249, 115, 22, 0)');
    colGrad.addColorStop(0.5, bm.color);
    colGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(bm.x - beamHalfW * 2.2, skyTop, beamHalfW * 4.4, bm.y - skyTop);

    // Mid plasma sheath
    ctx.globalAlpha = t * 0.78;
    ctx.fillStyle = bm.color;
    ctx.fillRect(bm.x - beamHalfW * 0.55, skyTop, beamHalfW * 1.1, bm.y - skyTop);

    // Razor white-hot orbital laser core
    ctx.globalAlpha = Math.min(1, t * 1.05);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bm.x - beamHalfW * 0.24, skyTop, beamHalfW * 0.48, bm.y - skyTop);

    // Ground flare disc
    const hitGrad = ctx.createRadialGradient(bm.x, bm.y, 2, bm.x, bm.y, bm.radius * 1.05);
    hitGrad.addColorStop(0, '#FFFFFF');
    hitGrad.addColorStop(0.35, '#FDE047');
    hitGrad.addColorStop(0.7, bm.color);
    hitGrad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = hitGrad;
    ctx.beginPath();
    ctx.ellipse(bm.x, bm.y, bm.radius * 1.05, bm.radius * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * Renders active persistent Singularity Black Holes directly on the track, scaling cleanly with swallowed kills.
 */
export function drawSingularityHoles(
  ctx: CanvasRenderingContext2D,
  holes: readonly SingularityHole[],
  animTime: number,
  alphaScale = 1
) {
  const safeScale = Math.max(0.45, Math.min(1, alphaScale));
  for (const hole of holes) {
    const fadeIn = Math.min(1, (hole.maxLife - hole.life) * 5 + 0.25);
    const fadeOut = Math.min(1, hole.life * 2.2);
    const visAlpha = Math.min(fadeIn, fadeOut) * safeScale;
    const growthFactor = hole.currentRadius / Math.max(1, hole.baseRadius);
    const coreRadius = 11 * Math.min(1.85, 0.9 + (growthFactor - 1) * 1.4);

    ctx.save();
    ctx.translate(hole.x, hole.y);

    // Gravitational pull field boundary
    ctx.globalAlpha = visAlpha * 0.46;
    const wellGrad = ctx.createRadialGradient(0, 0, coreRadius, 0, 0, hole.currentRadius);
    wellGrad.addColorStop(0, 'rgba(2, 6, 23, 0.96)');
    wellGrad.addColorStop(0.32, 'rgba(88, 28, 135, 0.56)');
    wellGrad.addColorStop(0.72, 'rgba(168, 85, 247, 0.22)');
    wellGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = wellGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hole.currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Swirling accretion spiral arms
    ctx.globalAlpha = visAlpha * 0.85;
    ctx.strokeStyle = hole.variant === 'omega' ? '#F0ABFC' : '#C084FC';
    ctx.lineWidth = 2.1;
    for (let arm = 0; arm < 4; arm++) {
      const baseA = -animTime * (6.2 + (growthFactor - 1) * 3) + (arm * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(0, 0, hole.currentRadius * 0.45, baseA, baseA + 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, hole.currentRadius * 0.72, baseA + 0.45, baseA + 1.25);
      ctx.stroke();
    }

    // Glowing photon ring & pitch-black Event Horizon
    ctx.globalAlpha = visAlpha;
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = hole.killsAbsorbed >= 3 ? '#FDE047' : '#E879F9';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (hole.killsAbsorbed > 0) {
      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`×${hole.killsAbsorbed}`, 0, -coreRadius - 8);
    }
    ctx.restore();
  }
}

/**
 * Renders autonomous Mothership combat fighter drones patrolling across the map.
 */
export function drawCarrierDrones(
  ctx: CanvasRenderingContext2D,
  drones: readonly CarrierDrone[],
  animTime: number
) {
  for (const d of drones) {
    const isOmega = d.variant === 'omega';
    const isEvading = d.evadeTimer > 0;
    ctx.save();

    // Flight contrail
    if (d.trail.length >= 2) {
      ctx.strokeStyle = isEvading ? '#FDE047' : isOmega ? '#FACC15' : '#38BDF8';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let i = 1; i < d.trail.length; i++) {
        ctx.globalAlpha = (i / d.trail.length) * 0.48;
        ctx.beginPath();
        ctx.moveTo(d.trail[i - 1].x, d.trail[i - 1].y);
        ctx.lineTo(d.trail[i].x, d.trail[i].y);
        ctx.stroke();
      }
    }

    ctx.translate(d.x, d.y);
    ctx.rotate(d.heading);
    ctx.globalAlpha = isEvading ? 0.55 + Math.sin(animTime * 42) * 0.35 : 0.96;

    // Thruster flame
    ctx.fillStyle = isEvading ? '#FEF08A' : '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(-9, -3);
    ctx.lineTo(-16 - Math.sin(animTime * 36) * 3, 0);
    ctx.lineTo(-9, 3);
    ctx.closePath();
    ctx.fill();

    // Swept-wing heavy drone hull
    ctx.fillStyle = isOmega ? '#422006' : '#082F49';
    ctx.strokeStyle = isEvading ? '#FFFFFF' : isOmega ? '#FACC15' : '#7DD3FC';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nose laser emitter dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(7, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/**
 * Renders Chronos Sovereign Time-Dilation Spheres (with live Echo accumulation readout) & Dimensional Cross-Slashes.
 */
export function drawChronoFieldsAndSlashes(
  ctx: CanvasRenderingContext2D,
  fields: readonly ChronoField[],
  slashes: readonly ChronoSlashFx[],
  animTime: number,
  alphaScale = 1
) {
  const safeScale = Math.max(0.45, Math.min(1, alphaScale));
  for (const field of fields) {
    const fadeIn = Math.min(1, (field.maxLife - field.life) * 5 + 0.25);
    const fadeOut = Math.min(1, field.life * 2.2);
    const visAlpha = Math.min(fadeIn, fadeOut) * safeScale;
    const isOmega = field.variant === 'omega';

    ctx.save();
    ctx.translate(field.x, field.y);

    // Subtle translucent time-dilation dome (kept transparent so road & enemies remain crisp)
    ctx.globalAlpha = visAlpha * 0.42;
    const grad = ctx.createRadialGradient(0, 0, 12, 0, 0, field.radius);
    grad.addColorStop(0, isOmega ? 'rgba(192, 132, 252, 0.24)' : 'rgba(34, 211, 238, 0.22)');
    grad.addColorStop(0.68, 'rgba(56, 189, 248, 0.14)');
    grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, field.radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer astral dial ring + 12 clock ticks
    ctx.globalAlpha = visAlpha * 0.85;
    ctx.strokeStyle = isOmega ? '#C084FC' : '#22D3EE';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.lineDashOffset = -animTime * 22;
    ctx.beginPath();
    ctx.arc(0, 0, field.radius * 0.96, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    for (let h = 0; h < 12; h++) {
      const ha = (h * Math.PI * 2) / 12 + animTime * 0.45;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ha) * field.radius * 0.86, Math.sin(ha) * field.radius * 0.86);
      ctx.lineTo(Math.cos(ha) * field.radius * 0.96, Math.sin(ha) * field.radius * 0.96);
      ctx.stroke();
    }

    // Inner counter-rotating clock hands
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1.8;
    const fastHand = -animTime * 4.2;
    const slowHand = animTime * 1.1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(fastHand) * field.radius * 0.46, Math.sin(fastHand) * field.radius * 0.46);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(slowHand) * field.radius * 0.28, Math.sin(slowHand) * field.radius * 0.28);
    ctx.stroke();

    if (field.recordedDamage > 0) {
      ctx.fillStyle = '#E0F2FE';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⏳ ECHO ${Math.round(field.recordedDamage)}`, 0, -field.radius * 0.56);
    }

    ctx.restore();
  }

  for (const sl of slashes) {
    const t = Math.max(0, Math.min(1, sl.alpha)) * safeScale;
    ctx.save();
    ctx.translate(sl.x, sl.y);
    ctx.rotate(sl.angle);
    ctx.globalAlpha = t;

    for (const crossAngle of [0, Math.PI * 0.48]) {
      ctx.save();
      ctx.rotate(crossAngle);
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = (sl.isCrit ? 6.5 : 5) * t;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-sl.length * 0.5, 0);
      ctx.lineTo(sl.length * 0.5, 0);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = (sl.isCrit ? 2.6 : 2) * t;
      ctx.beginPath();
      ctx.moveTo(-sl.length * 0.42, 0);
      ctx.lineTo(sl.length * 0.42, 0);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

/**
 * Renders lingering Void Rifts spawned by the 1000-Energy Astral Ark cannon.
 */
export function drawVoidRifts(
  ctx: CanvasRenderingContext2D,
  rifts: readonly VoidRiftFx[],
  animTime: number,
  alphaScale = 1
) {
  const safeScale = Math.max(0.35, Math.min(1, alphaScale));
  for (const r of rifts) {
    const fadeIn = Math.min(1, (r.maxLife - r.life) * 5 + 0.25);
    const fadeOut = Math.min(1, r.life * 2.2);
    const visAlpha = Math.min(fadeIn, fadeOut) * safeScale;
    const isOmega = r.variant === 'omega';

    ctx.save();
    ctx.translate(r.x, r.y);

    // Subtle void fissure floor field so roads & enemies stay crisp
    ctx.globalAlpha = visAlpha * 0.34;
    const vg = ctx.createRadialGradient(0, 0, 8, 0, 0, r.radius);
    vg.addColorStop(0, isOmega ? 'rgba(244, 63, 94, 0.42)' : 'rgba(232, 121, 249, 0.36)');
    vg.addColorStop(0.65, 'rgba(139, 92, 246, 0.16)');
    vg.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(0, 0, r.radius, 0, Math.PI * 2);
    ctx.fill();

    // Crisp spinning tri-prism perimeter + fracture rays
    ctx.globalAlpha = visAlpha * 0.88;
    ctx.strokeStyle = isOmega ? '#FB7185' : '#F0ABFC';
    ctx.lineWidth = r.isOverdrive ? 2.4 : 1.9;
    drawPolygon(ctx, 0, 0, 6, r.radius * 0.9, animTime * 1.3);
    ctx.stroke();

    ctx.strokeStyle = '#67E8F9';
    ctx.lineWidth = 1.4;
    drawPolygon(ctx, 0, 0, 3, r.radius * 0.46, -animTime * 2.6);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Renders crisp Emerald Quantum Damage Echo transfer arcs between linked targets.
 */
export function drawQuantumEchoArcs(
  ctx: CanvasRenderingContext2D,
  arcs: readonly QuantumEchoArcFx[],
  alphaScale = 1
) {
  const safeScale = Math.max(0.35, Math.min(1, alphaScale));
  for (const arc of arcs) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, arc.alpha)) * safeScale;
    ctx.strokeStyle = arc.color;
    ctx.lineWidth = 2.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(arc.x1, arc.y1);
    ctx.lineTo(arc.x2, arc.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

/**
 * Renders deployed Aurora Magnetic Storm Pylons on the enemy path + Lv7 cross-pylon lightning arcs.
 */
export function drawAuroraPylons(
  ctx: CanvasRenderingContext2D,
  pylons: readonly AuroraPylonFx[],
  animTime: number,
  alphaScale = 1
) {
  const safeScale = Math.max(0.4, Math.min(1, alphaScale));
  for (let i = 0; i < pylons.length; i++) {
    const p = pylons[i];
    const fadeIn = Math.min(1, (p.maxLife - p.life) * 5 + 0.3);
    const fadeOut = Math.min(1, p.life * 2.2);
    const visAlpha = Math.min(fadeIn, fadeOut) * safeScale;
    const isOmega = p.variant === 'omega';

    ctx.save();
    ctx.translate(p.x, p.y);

    // Subtle electromagnetic storm aura
    ctx.globalAlpha = visAlpha * 0.34;
    const ag = ctx.createRadialGradient(0, 0, 6, 0, 0, p.radius);
    ag.addColorStop(0, isOmega ? 'rgba(56, 189, 248, 0.35)' : 'rgba(45, 212, 191, 0.32)');
    ag.addColorStop(0.68, 'rgba(34, 211, 238, 0.14)');
    ag.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing magnetic perimeter ring
    ctx.globalAlpha = visAlpha * 0.85;
    ctx.strokeStyle = isOmega ? '#38BDF8' : '#2DD4BF';
    ctx.lineWidth = 1.9;
    ctx.setLineDash([7, 5]);
    ctx.lineDashOffset = -animTime * 26;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central floating magnetic spire crystal
    ctx.fillStyle = '#042F2E';
    ctx.strokeStyle = '#99F6E4';
    ctx.lineWidth = 2;
    drawPolygon(ctx, 0, 0, 4, 9 + p.visualTier * 0.9, animTime * 2.2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lv7 cross-pylon tether link between nearby pylons from same tower
    if (p.visualTier >= 4) {
      for (let j = i + 1; j < pylons.length; j++) {
        const q = pylons[j];
        if (q.sourceGunId !== p.sourceGunId) continue;
        ctx.save();
        ctx.globalAlpha = visAlpha * 0.55;
        ctx.strokeStyle = '#67E8F9';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }
}


