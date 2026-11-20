import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import {
  Crosshair,
  FastForward,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  applyDamageToEnemy,
  BIOME_PALETTES,
  buildWaveSpawns,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createEnemyForWave,
  DIFFICULTY_CONFIGS,
  DIFFICULTY_ORDER,
  DifficultyId,
  FlameConeFx,
  FloatingCombatText,
  getEffectiveMapSetup,
  getGunCatalogItem,
  getGunCombatProfile,
  getGunSellRefund,
  getGunUpgradeCost,
  getTileKind,
  GRID_COLS,
  GRID_ROWS,
  gridToWorldCenter,
  GUN_CATALOG,
  GunType,
  LightningArc,
  MAX_GUN_LEVEL,
  PlacedGun,
  PRISM_MAPS,
  ProjectileItem,
  RailBeamFx,
  ShockwaveRing,
  stepEnemies,
  TargetPriority,
  TdEnemy,
  TdMapDef,
  TILE_SIZE,
  WaveSpawnItem,
} from '../utils/prismTdEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

interface PrismTdGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

interface PooledParticle {
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

interface MuzzleFlashFx {
  x: number;
  y: number;
  angle: number;
  radius: number;
  alpha: number;
  color: string;
}

interface HudSnapshot {
  difficulty: DifficultyId;
  energy: number;
  coreHp: number;
  maxCoreHp: number;
  wave: number;
  totalWaves: number;
  score: number;
  bestScore: number;
  kills: number;
  totalDamage: number;
  totalDps: number;
  waveActive: boolean;
  nextWaveCountdown: number;
  overdrivePct: number;
  overdriveActive: boolean;
  speedMult: 1 | 2 | 3;
  outcome: 'victory' | 'defeat' | null;
  selectedGunVersion: number;
}

const SAVE_BEST_KEY = 'thuanle-gun-td-best-v2';
const PARTICLE_POOL_SIZE = 280;

function loadBestScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(SAVE_BEST_KEY);
    const num = raw ? Number(raw) : 0;
    return Number.isFinite(num) && num > 0 ? num : 0;
  } catch {
    return 0;
  }
}

function saveBestScore(score: number) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SAVE_BEST_KEY, String(score));
  } catch {
    // Ignore storage error
  }
}

function playSynthFx(
  kind:
    | 'place'
    | 'select'
    | 'upgrade'
    | 'sell'
    | 'gatling'
    | 'shotgun'
    | 'tesla'
    | 'missile'
    | 'railgun'
    | 'flamer'
    | 'cryo'
    | 'mortar'
    | 'explosion'
    | 'kill'
    | 'wave'
    | 'overdrive'
    | 'hurt'
    | 'victory'
    | 'defeat',
  enabled: boolean,
  audioCtxRef: { current: AudioContext | null }
) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    const tone = (
      f1: number,
      f2: number,
      dur: number,
      vol: number,
      type: OscillatorType = 'sine',
      delay = 0
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f1, now + delay);
      osc.frequency.exponentialRampToValueAtTime(Math.max(36, f2), now + delay + dur);
      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    if (kind === 'place') {
      tone(380, 660, 0.09, 0.12, 'triangle');
    } else if (kind === 'select') {
      tone(540, 720, 0.05, 0.08, 'sine');
    } else if (kind === 'upgrade') {
      tone(440, 880, 0.12, 0.14, 'triangle', 0);
      tone(660, 1240, 0.15, 0.12, 'sine', 0.05);
    } else if (kind === 'sell') {
      tone(480, 260, 0.1, 0.11, 'triangle');
    } else if (kind === 'gatling') {
      tone(680 + Math.random() * 140, 220, 0.045, 0.04, 'square');
    } else if (kind === 'shotgun') {
      tone(240, 75, 0.11, 0.11, 'sawtooth');
    } else if (kind === 'tesla') {
      tone(1120, 340, 0.09, 0.075, 'sawtooth');
    } else if (kind === 'missile') {
      tone(320, 640, 0.12, 0.08, 'triangle');
    } else if (kind === 'railgun') {
      tone(1260, 90, 0.22, 0.14, 'sawtooth', 0);
      tone(420, 140, 0.18, 0.1, 'square', 0.02);
    } else if (kind === 'flamer') {
      tone(240, 110, 0.12, 0.055, 'sawtooth');
    } else if (kind === 'cryo') {
      tone(980, 520, 0.16, 0.075, 'sine');
    } else if (kind === 'mortar') {
      tone(220, 75, 0.24, 0.12, 'triangle');
    } else if (kind === 'explosion') {
      tone(150, 42, 0.2, 0.13, 'sawtooth');
    } else if (kind === 'kill') {
      const jitter = 0.94 + Math.random() * 0.12;
      tone(540 * jitter, 180 * jitter, 0.08, 0.08, 'triangle');
    } else if (kind === 'wave') {
      tone(330, 540, 0.14, 0.13, 'triangle', 0);
      tone(540, 810, 0.18, 0.13, 'sine', 0.09);
    } else if (kind === 'overdrive') {
      tone(240, 960, 0.3, 0.19, 'sawtooth', 0);
      tone(480, 1280, 0.28, 0.14, 'triangle', 0.08);
    } else if (kind === 'hurt') {
      tone(190, 80, 0.2, 0.17, 'sawtooth');
    } else if (kind === 'victory') {
      tone(523.25, 523.25, 0.12, 0.14, 'triangle', 0);
      tone(659.25, 659.25, 0.12, 0.14, 'triangle', 0.12);
      tone(783.99, 1046.5, 0.28, 0.17, 'triangle', 0.24);
    } else if (kind === 'defeat') {
      tone(280, 140, 0.25, 0.17, 'sawtooth', 0);
      tone(180, 75, 0.35, 0.19, 'sawtooth', 0.18);
    }
  } catch {
    // Ignore blocked audio context
  }
}

const PRIORITY_LABELS: Record<TargetPriority, string> = {
  first: 'Gần Lõi',
  strongest: 'Máu Cao',
  weakest: 'Máu Thấp',
};

function nextPriority(cur: TargetPriority): TargetPriority {
  if (cur === 'first') return 'strongest';
  if (cur === 'strongest') return 'weakest';
  return 'first';
}

function drawGunTurretSprite(
  ctx: CanvasRenderingContext2D,
  type: GunType,
  level: number,
  aimAngle: number,
  recoil: number,
  animTime: number
) {
  const tier: 1 | 2 | 3 | 4 = level >= 10 ? 4 : level >= 7 ? 3 : level >= 4 ? 2 : 1;
  const baseRadius = 19 + (tier - 1) * 1.4;

  // Tier 4 MYTHIC LV10 Aura Halo (Dual counter-rotating crown rings)
  if (tier === 4) {
    ctx.save();
    ctx.rotate(animTime * 2.5);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 27, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(-animTime * 3.2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (tier === 3) {
    ctx.save();
    ctx.rotate(animTime * 2.1);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Pedestal chassis (evolves across Tier 1..4)
  ctx.fillStyle =
    tier === 4 ? '#1E1B4B' : tier === 3 ? '#172554' : tier === 2 ? '#111D38' : '#0F172A';
  ctx.strokeStyle =
    tier === 4 ? '#FDE047' : tier === 3 ? '#FBBF24' : tier === 2 ? '#38BDF8' : '#475569';
  ctx.lineWidth = tier >= 3 ? 2.5 : 2;
  ctx.beginPath();
  if (tier >= 3) {
    // Armored octagonal mount
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      const px = Math.cos(a) * baseRadius;
      const py = Math.sin(a) * baseRadius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  if (tier >= 2) {
    ctx.fillStyle = tier === 4 ? '#FDE047' : tier === 3 ? '#F59E0B' : '#64748B';
    ctx.fillRect(-baseRadius - 2, -4, 4, 8);
    ctx.fillRect(baseRadius - 2, -4, 4, 8);
  }

  // Weapon Barrel / Emitter Head
  if (type === 'gatling') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 4.5;
    if (tier >= 2) {
      ctx.fillStyle = tier === 4 ? '#FDE047' : '#F59E0B';
      ctx.fillRect(-14 - kick, -10, 11, 20);
    }
    const len = 19 + tier * 2.2;
    ctx.fillStyle = tier === 4 ? '#FDE047' : tier === 3 ? '#FBBF24' : '#38BDF8';
    ctx.fillRect(4 - kick, -8, len, 3.8);
    ctx.fillRect(4 - kick, 4.2, len, 3.8);
    if (tier >= 3) {
      ctx.fillStyle = '#00E5FF';
      ctx.fillRect(5 - kick, -2, len + 3, 4);
    }
    if (tier === 4) {
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(4 - kick, -13, len - 3, 3);
      ctx.fillRect(4 - kick, 10, len - 3, 3);
    }
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = tier >= 3 ? '#FDE047' : '#38BDF8';
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
    ctx.fillStyle = tier >= 3 ? '#F59E0B' : '#EA580C';
    ctx.strokeStyle = tier >= 2 ? '#FDE047' : '#FDBA74';
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
    ctx.fillStyle = tier >= 3 ? '#0284C7' : '#EA580C';
    ctx.fillRect(4 - kick, -5 - tier * 0.6, 16 + tier * 2, 10 + tier * 1.2);
    ctx.fillStyle = tier >= 3 ? '#38BDF8' : '#FACC15';
    ctx.fillRect(18 + tier * 1.5 - kick, -5, 5, 10);
    if (tier === 4) {
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(10 - kick, -11, 10, 4);
      ctx.fillRect(10 - kick, 7, 10, 4);
    }
    ctx.fillStyle = tier >= 3 ? '#0C4A6E' : '#431407';
    ctx.strokeStyle = tier >= 3 ? '#7DD3FC' : '#FB923C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-2, 0, 11 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (type === 'cryo') {
    ctx.save();
    ctx.rotate(animTime * (1.4 + tier * 0.6));
    ctx.strokeStyle = tier >= 3 ? '#FFFFFF' : '#67E8F9';
    ctx.fillStyle = tier >= 3 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 2.2;
    const sides = tier >= 3 ? 8 : 6;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i * Math.PI * 2) / sides;
      const rad = i % 2 === 1 && tier >= 3 ? 19 : 14 + tier;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = tier === 4 ? '#FDE047' : '#ECFEFF';
    ctx.beginPath();
    ctx.arc(0, 0, 5 + tier * 0.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'tesla') {
    if (tier >= 2) {
      const pylons = tier === 4 ? 4 : 3;
      for (let k = 0; k < pylons; k++) {
        const ka = (k * Math.PI * 2) / pylons + animTime * 2.4;
        ctx.strokeStyle = tier === 4 ? '#FDE047' : '#38BDF8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ka) * 18, Math.sin(ka) * 18);
        ctx.stroke();
        ctx.fillStyle = tier === 4 ? '#FEF08A' : '#38BDF8';
        ctx.beginPath();
        ctx.arc(Math.cos(ka) * 18, Math.sin(ka) * 18, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = tier >= 3 ? '#FDE047' : '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 14 + tier * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = tier >= 3 ? '#FEF08A' : '#BAE6FD';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5 + tier + Math.sin(animTime * 9) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'missile') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 3;
    if (tier >= 3) {
      ctx.fillStyle = tier === 4 ? '#FDE047' : '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-4 - kick, -19);
      ctx.lineTo(6 - kick, -11);
      ctx.lineTo(6 - kick, 11);
      ctx.lineTo(-4 - kick, 19);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = tier >= 3 ? '#BE123C' : '#E11D48';
    ctx.strokeStyle = tier >= 2 ? '#FDE047' : '#FDA4AF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-12 - kick, -12 - tier * 0.6, 24 + tier * 2, 24 + tier * 1.2, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(10 - kick, -8, 5, 4.5);
    ctx.fillRect(10 - kick, 3.5, 5, 4.5);
    if (tier >= 2) {
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(10 - kick, -2, 6, 4);
    }
    ctx.restore();
  } else if (type === 'railgun') {
    ctx.save();
    ctx.rotate(aimAngle);
    const kick = recoil * 5;
    const len = 23 + tier * 3;
    ctx.fillStyle = tier >= 3 ? '#FDE047' : tier === 2 ? '#C084FC' : '#A78BFA';
    ctx.fillRect(2 - kick, -6.5, len, 3.2);
    ctx.fillRect(2 - kick, 3.3, len, 3.2);
    ctx.fillStyle = tier >= 3 ? '#38BDF8' : '#F43F5E';
    ctx.fillRect(4 - kick, -1.8, len - 3, 3.6);
    if (tier >= 3) {
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(len - 4 - kick, -9, 4, 18);
    }
    ctx.fillStyle = '#1E1B4B';
    ctx.strokeStyle = tier >= 3 ? '#FDE047' : '#C4B5FD';
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
    if (tier >= 3) {
      ctx.save();
      ctx.rotate(animTime * 6);
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 8.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = tier >= 3 ? '#3B0764' : '#581C87';
    ctx.strokeStyle = tier >= 2 ? '#FDE047' : '#E879F9';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(-kick, 0, 13.5 + tier * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = tier === 4 ? '#38BDF8' : '#FDE047';
    ctx.beginPath();
    ctx.arc(7 - kick, 0, 5 + tier * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Crisp Level Badge Pill at bottom of turret (Lv.1 .. Lv.10)
  ctx.fillStyle = tier === 4 ? '#FDE047' : tier === 3 ? '#FB923C' : tier === 2 ? '#38BDF8' : '#0F172A';
  ctx.strokeStyle = '#070B14';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-13, 13, 26, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tier >= 2 ? '#070B14' : '#E2E8F0';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(level === MAX_GUN_LEVEL ? 'MAX' : `L${level}`, 0, 19.3);
}

/**
 * High-detail multi-layered Canvas 2D enemy sprite renderer (Zero shadowBlur, crisp silhouettes).
 */
function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  en: TdEnemy,
  animTime: number
) {
  ctx.save();
  const isKo = en.koTimer > 0;
  const koAlpha = isKo ? Math.max(0, en.koTimer / 0.28) : 1;
  const koScale = isKo ? 1 + (1 - koAlpha) * 0.55 : 1;
  const stealthFade =
    en.kind === 'stealth' && en.slowTimer <= 0 && en.burnTimer <= 0
      ? 0.48 + Math.sin(animTime * 9 + en.id) * 0.22
      : 1;
  ctx.globalAlpha = koAlpha * stealthFade;
  ctx.translate(en.x, en.y);

  // Ambient ground shadow
  if (!isKo) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 7, en.radius * 0.96, en.radius * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Elite golden under-aura
  if (en.isElite && !isKo) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Cryo Frost Encasing & Brittle Warning
  if (en.slowTimer > 0 && !isKo) {
    ctx.strokeStyle = en.brittleBonus > 0 ? '#E0F2FE' : '#67E8F9';
    ctx.lineWidth = en.brittleBonus > 0 ? 2.4 : 1.8;
    for (let ic = 0; ic < 6; ic++) {
      const ia = (ic * Math.PI) / 3 + animTime * 1.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ia) * (en.radius - 1), Math.sin(ia) * (en.radius - 1));
      ctx.lineTo(Math.cos(ia) * (en.radius + 7.5), Math.sin(ia) * (en.radius + 7.5));
      ctx.stroke();
    }
  }

  // Stun Electric Spark Cross
  if (en.stunTimer > 0 && !isKo) {
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Shield Dome Ring
  if (en.shield > 0 && !isKo) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.88)';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.11)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.save();
  ctx.rotate(en.heading);
  ctx.scale(koScale, koScale);
  const flash = en.hitFlash > 0;
  const pulse = 0.85 + Math.sin(animTime * 18 + en.id) * 0.2;

  if (en.kind === 'scout') {
    // Twin Supersonic Thruster Plumes
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(-10, -6.5);
    ctx.lineTo(-20 * pulse, -4.5);
    ctx.lineTo(-10, -2.5);
    ctx.moveTo(-10, 2.5);
    ctx.lineTo(-20 * pulse, 4.5);
    ctx.lineTo(-10, 6.5);
    ctx.fill();

    // Swept Composite Wings + Beveled Nacelles
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

    // Wingtip Laser Strobe & Inner Armored Fuselage
    ctx.fillStyle = flash ? '#FFFFFF' : '#0284C7';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-7, -4.5);
    ctx.lineTo(-7, 4.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.ellipse(3.5, 0, 5.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FB7185';
    ctx.fillRect(-10, -14, 2.5, 2.5);
    ctx.fillRect(-10, 11.5, 2.5, 2.5);
  } else if (en.kind === 'armored') {
    // Heavy Siege Tank: Animated Caterpillar Tracks + Sloped Reactive Armor + Twin Turret
    const treadShift = (animTime * 24) % 6;
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-17, -17, 34, 6.5);
    ctx.fillRect(-17, 10.5, 34, 6.5);
    ctx.fillStyle = '#64748B';
    for (let tx = -15 + treadShift; tx < 15; tx += 6) {
      ctx.fillRect(tx, -17, 2.5, 6.5);
      ctx.fillRect(tx, 10.5, 2.5, 6.5);
    }

    // Sloped Hull
    ctx.fillStyle = flash ? '#FFFFFF' : '#78350F';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, -9.5);
    ctx.lineTo(19, 0);
    ctx.lineTo(16, 9.5);
    ctx.lineTo(-15, 11.5);
    ctx.lineTo(-17, -11.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Reactive Armor Chevron & Rivet Core
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(8, -7);
    ctx.lineTo(13, 0);
    ctx.lineTo(8, 7);
    ctx.stroke();

    // Dual Siege Barrels + Dome Turret
    ctx.fillStyle = flash ? '#FFFFFF' : '#FBBF24';
    ctx.fillRect(5, -5.5, 16, 3);
    ctx.fillRect(5, 2.5, 16, 3);
    ctx.fillStyle = '#451A03';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-1, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (en.kind === 'splitter') {
    const sScale = en.radius < 12 ? 0.72 : 1;
    ctx.scale(sScale, sScale);
    // 6-Legged Cyber-Arachnid Swarmer with Scuttling Blades & Volatile Abdomen
    const legWiggle = Math.sin(animTime * 18 + en.id) * 0.16;
    ctx.strokeStyle = '#E879F9';
    ctx.fillStyle = flash ? '#FFFFFF' : '#581C87';
    ctx.lineWidth = 1.6;
    for (let b = 0; b < 6; b++) {
      ctx.save();
      ctx.rotate((b * Math.PI) / 3 + (b % 2 === 0 ? legWiggle : -legWiggle));
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.lineTo(12, -6);
      ctx.lineTo(17, 0);
      ctx.lineTo(9, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#A855F7';
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'stealth') {
    // Faceted Diamond Ghost Bomber with Holographic Cloaking Scanlines
    ctx.fillStyle = flash ? '#FFFFFF' : '#064E3B';
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(19, 0);
    ctx.lineTo(-2, -15);
    ctx.lineTo(-15, -7);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-15, 7);
    ctx.lineTo(-2, 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#A7F3D0';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-8, 0);
    ctx.moveTo(3, -8);
    ctx.lineTo(-9, -3);
    ctx.moveTo(3, 8);
    ctx.lineTo(-9, 3);
    ctx.stroke();

    ctx.fillStyle = '#6EE7B7';
    ctx.beginPath();
    ctx.arc(4, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'healer') {
    // Twin-Nacelle Bio-Med Frigate + 3 Orbiting Repair Satellites
    ctx.fillStyle = flash ? '#FFFFFF' : '#065F46';
    ctx.strokeStyle = '#4ADE80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-13, -12, 26, 24, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.fillRect(-10, -15, 16, 4);
    ctx.fillRect(-10, 11, 16, 4);

    ctx.fillStyle = '#ECFDF5';
    ctx.fillRect(-5.5, -2, 11, 4);
    ctx.fillRect(-2, -5.5, 4, 11);

    for (let o = 0; o < 3; o++) {
      const oa = animTime * 4.2 + (o * Math.PI * 2) / 3;
      const ox = Math.cos(oa) * 17;
      const oy = Math.sin(oa) * 17;
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ox, oy);
      ctx.stroke();
      ctx.fillStyle = '#86EFAC';
      ctx.beginPath();
      ctx.arc(ox, oy, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (en.kind === 'teleporter') {
    // Chrono-Warp Strider with Levitating Resonance Wings & Spinning Warp Halo
    const wingSpread = 2.5 + Math.sin(animTime * 11) * 2;
    ctx.save();
    ctx.rotate(animTime * 5);
    ctx.strokeStyle = 'rgba(232, 121, 249, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = flash ? '#FFFFFF' : '#4C1D95';
    ctx.strokeStyle = '#E879F9';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(0, -6.5);
    ctx.lineTo(-15, 0);
    ctx.lineTo(0, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#C084FC';
    ctx.beginPath();
    ctx.moveTo(6, -8 - wingSpread);
    ctx.lineTo(-10, -15 - wingSpread);
    ctx.lineTo(-5, -7 - wingSpread);
    ctx.closePath();
    ctx.moveTo(6, 8 + wingSpread);
    ctx.lineTo(-10, 15 + wingSpread);
    ctx.lineTo(-5, 7 + wingSpread);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (en.kind === 'shieldbearer') {
    // Heavy Aegis Mech Walker with Pauldrons + Curved Hex Forcefield
    ctx.fillStyle = flash ? '#FFFFFF' : '#1E3A8A';
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -15, 24, 30, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(-11, -17, 13, 5.5);
    ctx.fillRect(-11, 11.5, 13, 5.5);

    ctx.fillStyle = '#E0F2FE';
    ctx.fillRect(0, -4, 6, 8);

    // Animated Curved Hex Energy Barrier
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(5, 0, 20, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();
    ctx.strokeStyle = '#E0F2FE';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(5, 0, 20, -Math.PI * 0.34, Math.PI * 0.34);
    ctx.stroke();
  } else if (en.kind === 'boss') {
    // OMEGA DREADNOUGHT TITAN: Heavy Battleship Hull + Twin Plasma Engines + Sponsons + Reactor Core
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.moveTo(-22, -12);
    ctx.lineTo(-37 * pulse, -8.5);
    ctx.lineTo(-22, -5);
    ctx.moveTo(-22, 5);
    ctx.lineTo(-37 * pulse, 8.5);
    ctx.lineTo(-22, 12);
    ctx.fill();

    // Outer Wing Bulkheads
    ctx.fillStyle = flash ? '#FFFFFF' : '#4C0519';
    ctx.strokeStyle = '#FDA4AF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(31, 0);
    ctx.lineTo(14, -16);
    ctx.lineTo(-6, -25);
    ctx.lineTo(-24, -20);
    ctx.lineTo(-20, -7);
    ctx.lineTo(-25, 0);
    ctx.lineTo(-20, 7);
    ctx.lineTo(-24, 20);
    ctx.lineTo(-6, 25);
    ctx.lineTo(14, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Broadside Sponson Cannons
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(2, -23, 12, 4);
    ctx.fillRect(2, 19, 12, 4);

    // Armored Bridge Deck
    ctx.fillStyle = flash ? '#FFFFFF' : '#9F1239';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(5, -11);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-14, 10);
    ctx.lineTo(5, 11);
    ctx.closePath();
    ctx.fill();

    // Spinning Omega Reactor Core
    ctx.save();
    ctx.rotate(animTime * 4.4);
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.8;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 11.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(2, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Burn ring
  if (en.burnTimer > 0 && !isKo) {
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.88)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, en.radius + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dual HP + Shield Bar
  if (!isKo && (en.hp < en.maxHp || en.shield < en.maxShield || en.kind === 'boss')) {
    const bw = en.radius * 2 + 12;
    const bh = en.kind === 'boss' ? 6 : 4.8;
    const hpRatio = Math.max(0, en.hp / en.maxHp);
    ctx.fillStyle = '#070B14';
    ctx.fillRect(-bw / 2 - 1, -en.radius - 14, bw + 2, bh + 2);
    ctx.fillStyle = hpRatio > 0.5 ? '#10B981' : hpRatio > 0.25 ? '#F59E0B' : '#F43F5E';
    ctx.fillRect(-bw / 2, -en.radius - 13, bw * hpRatio, bh);

    if (en.maxShield > 0 && en.shield > 0) {
      const shRatio = Math.max(0, en.shield / en.maxShield);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-bw / 2, -en.radius - 17.5, bw * shRatio, 2.5);
    }
  }
  ctx.restore();
}

export function PrismTdGameSection({ theme }: PrismTdGameSectionProps) {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const autostart = new URLSearchParams(window.location.search).get('autostart');
      if (autostart === '1') return 'playing';
    }
    return 'title';
  });

  const [selectedMapIndex, setSelectedMapIndex] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<DifficultyId>('normal');
  const activeMap = PRISM_MAPS[selectedMapIndex] ?? PRISM_MAPS[0];
  const effectiveSetup = useMemo(
    () => getEffectiveMapSetup(activeMap, difficulty),
    [activeMap, difficulty]
  );

  const [selectedTool, setSelectedTool] = useState<GunType>('gatling');
  const [selectedGunId, setSelectedGunId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [statusNotice, setStatusNotice] = useState<string>('');

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const initSetup = getEffectiveMapSetup(activeMap, 'normal');
    return {
      difficulty: 'normal',
      energy: initSetup.startEnergy,
      coreHp: initSetup.startCoreHp,
      maxCoreHp: initSetup.startCoreHp,
      wave: 0,
      totalWaves: initSetup.totalWaves,
      score: 0,
      bestScore: loadBestScore(),
      kills: 0,
      totalDamage: 0,
      totalDps: 0,
      waveActive: false,
      overdrivePct: 0,
      overdriveActive: false,
      speedMult: 1,
      nextWaveCountdown: 10,
      outcome: null,
      selectedGunVersion: 0,
    };
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const simRef = useRef<{
    map: TdMapDef;
    difficulty: DifficultyId;
    totalWaves: number;
    maxCoreHp: number;
    guns: PlacedGun[];
    totalDps: number;
    enemies: TdEnemy[];
    projectiles: ProjectileItem[];
    lightningArcs: LightningArc[];
    railBeams: RailBeamFx[];
    flameCones: FlameConeFx[];
    healBeams: { fromX: number; fromY: number; toX: number; toY: number; alpha: number }[];
    muzzleFlashes: MuzzleFlashFx[];
    floatingTexts: FloatingCombatText[];
    spawnQueue: WaveSpawnItem[];
    waveElapsed: number;
    nextWaveTimer: number;
    nextEnemyId: number;
    nextProjId: number;
    energy: number;
    coreHp: number;
    wave: number;
    waveActive: boolean;
    score: number;
    bestScore: number;
    kills: number;
    totalDamage: number;
    overdriveCharge: number;
    overdriveTimer: number;
    speedMult: 1 | 2 | 3;
    shakeTrauma: number;
    hoverTile: { col: number; row: number } | null;
    selectedGunId: string | null;
    selectedTool: GunType;
    selectedGunVersion: number;
    shockwaves: ShockwaveRing[];
    particles: PooledParticle[];
    particleCursor: number;
    animTime: number;
    outcome: 'victory' | 'defeat' | null;
  }>({
    map: activeMap,
    difficulty: 'normal',
    totalWaves: effectiveSetup.totalWaves,
    maxCoreHp: effectiveSetup.startCoreHp,
    guns: [],
    totalDps: 0,
    enemies: [],
    projectiles: [],
    lightningArcs: [],
    railBeams: [],
    flameCones: [],
    healBeams: [],
    muzzleFlashes: [],
    floatingTexts: [],
    spawnQueue: [],
    waveElapsed: 0,
    nextWaveTimer: 10,
    nextEnemyId: 1,
    nextProjId: 1,
    energy: effectiveSetup.startEnergy,
    coreHp: effectiveSetup.startCoreHp,
    wave: 0,
    waveActive: false,
    score: 0,
    bestScore: loadBestScore(),
    kills: 0,
    totalDamage: 0,
    overdriveCharge: 45,
    overdriveTimer: 0,
    speedMult: 1,
    shakeTrauma: 0,
    hoverTile: null,
    selectedGunId: null,
    selectedTool: 'gatling',
    selectedGunVersion: 0,
    shockwaves: [],
    particles: Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.4,
      size: 2,
      color: '#38BDF8',
    })),
    particleCursor: 0,
    animTime: 0,
    outcome: null,
  });

  useEffect(() => {
    simRef.current.selectedTool = selectedTool;
  }, [selectedTool]);

  const recomputeFirepower = useCallback(() => {
    const s = simRef.current;
    const overdriveMult = s.overdriveTimer > 0 ? 2.0 : 1;
    let total = 0;
    for (const g of s.guns) {
      total += getGunCombatProfile(g.type, g.level).dpsEstimate * overdriveMult;
    }
    s.totalDps = Math.round(total);
  }, []);

  const syncHudFromSim = useCallback(() => {
    const s = simRef.current;
    setHud({
      difficulty: s.difficulty,
      energy: Math.round(s.energy),
      coreHp: Math.max(0, Math.round(s.coreHp)),
      maxCoreHp: s.maxCoreHp,
      wave: s.wave,
      totalWaves: s.totalWaves,
      score: Math.round(s.score),
      bestScore: Math.round(s.bestScore),
      kills: s.kills,
      totalDamage: Math.round(s.totalDamage),
      totalDps: Math.round(s.totalDps),
      waveActive: s.waveActive,
      nextWaveCountdown: Math.max(0, Math.ceil(s.nextWaveTimer)),
      overdrivePct: Math.min(100, Math.round(s.overdriveCharge)),
      overdriveActive: s.overdriveTimer > 0,
      speedMult: s.speedMult,
      outcome: s.outcome,
      selectedGunVersion: s.selectedGunVersion,
    });
  }, []);

  const emitParticles = useCallback(
    (x: number, y: number, color: string, count: number, speed = 110, sizeScale = 1) => {
      const s = simRef.current;
      for (let i = 0; i < count; i++) {
        const slot = s.particles[s.particleCursor];
        s.particleCursor = (s.particleCursor + 1) % PARTICLE_POOL_SIZE;
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.85);
        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.vx = Math.cos(angle) * mag;
        slot.vy = Math.sin(angle) * mag;
        slot.life = 0.25 + Math.random() * 0.28;
        slot.maxLife = slot.life;
        slot.size = (1.6 + Math.random() * 2.4) * sizeScale;
        slot.color = color;
      }
    },
    []
  );

  const pushCombatText = useCallback(
    (x: number, y: number, text: string, color: string, scale = 1) => {
      const s = simRef.current;
      if (s.floatingTexts.length > 28) s.floatingTexts.shift();
      s.floatingTexts.push({
        x: x + (Math.random() * 14 - 7),
        y: y - 10,
        vy: -32,
        text,
        color,
        alpha: 1,
        scale,
      });
    },
    []
  );

  const startNewRun = useCallback(
    (mapIdx = selectedMapIndex, diff = difficulty) => {
      const targetMap = PRISM_MAPS[mapIdx] ?? PRISM_MAPS[0];
      const effective = getEffectiveMapSetup(targetMap, diff);
      const diffCfg = DIFFICULTY_CONFIGS[diff];
      const s = simRef.current;
      s.map = targetMap;
      s.difficulty = diff;
      s.totalWaves = effective.totalWaves;
      s.maxCoreHp = effective.startCoreHp;
      s.guns = [];
      s.enemies = [];
      s.projectiles = [];
      s.lightningArcs = [];
      s.railBeams = [];
      s.flameCones = [];
      s.healBeams = [];
      s.muzzleFlashes = [];
      s.floatingTexts = [];
      s.spawnQueue = [];
      s.waveElapsed = 0;
      s.nextWaveTimer = 10;
      s.nextEnemyId = 1;
      s.nextProjId = 1;
      s.energy = effective.startEnergy;
      s.coreHp = effective.startCoreHp;
      s.wave = 0;
      s.waveActive = false;
      s.score = 0;
      s.kills = 0;
      s.totalDamage = 0;
      s.overdriveCharge = 45;
      s.overdriveTimer = 0;
      s.speedMult = 1;
      s.shakeTrauma = 0;
      s.hoverTile = null;
      s.selectedGunId = null;
      s.selectedGunVersion = 0;
      s.shockwaves = [];
      s.outcome = null;
      for (const p of s.particles) p.active = false;

      setSelectedMapIndex(mapIdx);
      setDifficulty(diff);
      setSelectedGunId(null);
      setStatusNotice(
        `Chế độ ${diffCfg.label} (${effective.totalWaves} Đợt) · Đặt Súng [1-8] & nâng Lv10 mở khóa Tuyệt Kỹ!`
      );
      recomputeFirepower();
      syncHudFromSim();
      setGameState('playing');
      playSynthFx('wave', soundEnabled, audioCtxRef);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [selectedMapIndex, difficulty, recomputeFirepower, syncHudFromSim, soundEnabled]
  );

  useEffect(() => {
    document.body.dataset.state = gameState;
    return () => {
      delete document.body.dataset.state;
    };
  }, [gameState]);

  useEffect(() => {
    recomputeFirepower();
    syncHudFromSim();
  }, [recomputeFirepower, syncHudFromSim]);

  const launchNextWave = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.waveActive || s.outcome) return;
    if (s.wave >= s.totalWaves) return;

    const earlyBonus = s.nextWaveTimer > 0.5 ? (s.wave > 0 ? 12 : 8) : 0;
    s.energy += earlyBonus;
    const nextWave = s.wave + 1;
    s.wave = nextWave;
    s.waveActive = true;
    s.waveElapsed = 0;
    s.nextWaveTimer = 0;
    s.spawnQueue = buildWaveSpawns(nextWave, s.totalWaves, s.difficulty);
    setStatusNotice(
      earlyBonus > 0
        ? `Gọi sớm Đợt ${nextWave}/${s.totalWaves} (+${earlyBonus}⚡)! Nâng súng lên Lv5 / Lv7 / Lv10 để đột phá kỹ năng!`
        : `Đợt ${nextWave}/${s.totalWaves} (${DIFFICULTY_CONFIGS[s.difficulty].label}) tiến công!`
    );
    playSynthFx('wave', soundEnabled, audioCtxRef);
    syncHudFromSim();
  }, [gameState, soundEnabled, syncHudFromSim]);

  const activateOverdrive = useCallback(() => {
    const s = simRef.current;
    if (gameState !== 'playing' || s.overdriveCharge < 100 || s.overdriveTimer > 0) return;
    s.overdriveCharge = 0;
    s.overdriveTimer = 5.0;
    s.shakeTrauma = 0.65;

    for (const g of s.guns) {
      const pt = gridToWorldCenter(g.col, g.row);
      s.shockwaves.push({
        x: pt.x,
        y: pt.y,
        radius: 12,
        maxRadius: 110,
        alpha: 0.9,
        color: '#FB7185',
        lineWidth: 3.5,
      });
      emitParticles(pt.x, pt.y, '#FDE047', 14, 155, 1.25);
    }

    for (const en of s.enemies) {
      if (en.hp <= 0 || en.koTimer > 0) continue;
      const res = applyDamageToEnemy(en, 85 + s.wave * 18, { armorPierce: 1 });
      en.slowTimer = Math.max(en.slowTimer, 2.2);
      en.slowFactor = Math.min(en.slowFactor || 1, 0.55);
      if (res.killed) {
        s.kills += 1;
        s.energy += en.reward;
        s.score += en.scoreValue;
        emitParticles(en.x, en.y, '#FBBF24', 18, 150, 1.2);
      }
    }
    recomputeFirepower();
    syncHudFromSim();
    setStatusNotice('HỘI TỤ HỎA LỰC ×2.0 ĐÃ KÍCH HOẠT (5s)! Toàn bộ pháo đài xả đạn tốc độ tối đa!');
    playSynthFx('overdrive', soundEnabled, audioCtxRef);
  }, [gameState, recomputeFirepower, syncHudFromSim, soundEnabled, emitParticles]);

  const cycleSelectedPriority = useCallback(() => {
    if (!selectedGunId || gameState !== 'playing') return;
    const s = simRef.current;
    const target = s.guns.find((g) => g.id === selectedGunId);
    if (!target) return;
    target.priority = nextPriority(target.priority);
    s.selectedGunVersion += 1;
    syncHudFromSim();
    playSynthFx('select', soundEnabled, audioCtxRef);
    setStatusNotice(`Chế độ khóa mục tiêu: ${PRIORITY_LABELS[target.priority]}`);
  }, [selectedGunId, gameState, syncHudFromSim, soundEnabled]);

  const upgradeSelectedGun = useCallback(() => {
    if (!selectedGunId || gameState !== 'playing') return;
    const s = simRef.current;
    const target = s.guns.find((g) => g.id === selectedGunId);
    if (!target) return;
    const cost = getGunUpgradeCost(target.type, target.level);
    if (cost === null) {
      setStatusNotice('Khẩu súng này đã đạt cấp Tối Thượng MAX LV10!');
      return;
    }
    if (s.energy < cost) {
      setStatusNotice(`Cần thêm ${cost - Math.round(s.energy)}⚡ để nâng lên Lv${target.level + 1}!`);
      return;
    }
    s.energy -= cost;
    target.level += 1;
    s.selectedGunVersion += 1;
    recomputeFirepower();
    syncHudFromSim();

    const pt = gridToWorldCenter(target.col, target.row);
    const isMilestone = target.level === 3 || target.level === 5 || target.level === 7 || target.level === 10;
    s.shockwaves.push({
      x: pt.x,
      y: pt.y,
      radius: 10,
      maxRadius: isMilestone ? 92 : 62,
      alpha: 0.95,
      color: target.level === 10 ? '#FDE047' : isMilestone ? '#38BDF8' : '#FBBF24',
      lineWidth: isMilestone ? 3.8 : 2.6,
    });
    emitParticles(pt.x, pt.y, target.level === 10 ? '#FDE047' : '#FBBF24', isMilestone ? 26 : 16, 135, 1.25);
    playSynthFx('upgrade', soundEnabled, audioCtxRef);

    const spec = getGunCatalogItem(target.type);
    const unlocked = spec.milestones.find((m) => m.level === target.level);
    if (unlocked) {
      pushCombatText(pt.x, pt.y - 10, `★ ${unlocked.name}!`, '#FDE047', 1.15);
      setStatusNotice(`ĐỘT PHÁ LV${target.level}: Mở khóa "${unlocked.name}" — ${unlocked.summary}!`);
    } else {
      setStatusNotice(`Đã nâng ${spec.shortName} lên Lv${target.level}/${MAX_GUN_LEVEL}!`);
    }
  }, [selectedGunId, gameState, recomputeFirepower, syncHudFromSim, emitParticles, pushCombatText, soundEnabled]);

  const sellSelectedGun = useCallback(() => {
    if (!selectedGunId || gameState !== 'playing') return;
    const s = simRef.current;
    const idx = s.guns.findIndex((g) => g.id === selectedGunId);
    if (idx === -1) return;
    const target = s.guns[idx];
    const refund = getGunSellRefund(target);
    s.guns.splice(idx, 1);
    s.energy += refund;
    s.selectedGunId = null;
    s.selectedGunVersion += 1;
    setSelectedGunId(null);
    recomputeFirepower();
    syncHudFromSim();
    const pt = gridToWorldCenter(target.col, target.row);
    emitParticles(pt.x, pt.y, '#94A3B8', 12, 85);
    playSynthFx('sell', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã thu hồi trụ súng (+${refund}⚡).`);
  }, [selectedGunId, gameState, recomputeFirepower, syncHudFromSim, emitParticles, soundEnabled]);

  const screenToGrid = useCallback((clientX: number, clientY: number): { col: number; row: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = ((clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return { col, row };
  }, []);

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    simRef.current.hoverTile = screenToGrid(e.clientX, e.clientY);
  };

  const handleCanvasPointerLeave = () => {
    simRef.current.hoverTile = null;
  };

  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile) return;

    const s = simRef.current;
    const existing = s.guns.find((g) => g.col === tile.col && g.row === tile.row);

    if (existing) {
      s.selectedGunId = existing.id;
      s.selectedGunVersion += 1;
      setSelectedGunId(existing.id);
      syncHudFromSim();
      playSynthFx('select', soundEnabled, audioCtxRef);
      const spec = getGunCatalogItem(existing.type);
      setStatusNotice(`Đang chọn ${spec.name} Lv${existing.level}/${MAX_GUN_LEVEL} · Bấm [U] để nâng cấp!`);
      return;
    }

    const tileKind = getTileKind(s.map, tile.col, tile.row);
    if (tileKind !== 'empty') {
      setStatusNotice('Không thể đặt súng lên đường hành quân hoặc vách đá!');
      return;
    }

    const spec = getGunCatalogItem(selectedTool);
    if (s.energy < spec.cost) {
      setStatusNotice(`Không đủ Năng Lượng! Cần ${spec.cost}⚡ cho ${spec.name}.`);
      return;
    }

    const created: PlacedGun = {
      id: `gun-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      col: tile.col,
      row: tile.row,
      type: selectedTool,
      level: 1,
      priority: selectedTool === 'railgun' || selectedTool === 'missile' ? 'strongest' : 'first',
      chargeTimer: 0,
      aimAngle: -Math.PI / 2,
      recoil: 0,
      totalDamageDealt: 0,
      kills: 0,
    };

    s.energy -= spec.cost;
    s.guns.push(created);
    s.selectedGunId = created.id;
    s.selectedGunVersion += 1;
    setSelectedGunId(created.id);
    recomputeFirepower();
    syncHudFromSim();

    const pt = gridToWorldCenter(tile.col, tile.row);
    s.shockwaves.push({
      x: pt.x,
      y: pt.y,
      radius: 8,
      maxRadius: 48,
      alpha: 0.78,
      color: spec.accentColor,
      lineWidth: 2.2,
    });
    emitParticles(pt.x, pt.y, spec.accentColor, 14, 95);
    playSynthFx('place', soundEnabled, audioCtxRef);
    setStatusNotice(`Đã triển khai ${spec.name} Lv1! Bấm [U] để nâng cấp tới Lv10.`);
  };

  const handleCanvasContextMenu = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const tile = screenToGrid(e.clientX, e.clientY);
    if (!tile) return;
    const existing = simRef.current.guns.find((g) => g.col === tile.col && g.row === tile.row);
    if (existing) {
      simRef.current.selectedGunId = existing.id;
      setSelectedGunId(existing.id);
      simRef.current.selectedGunVersion += 1;
      syncHudFromSim();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setSoundEnabled((prev) => !prev);
        return;
      }

      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewRun(selectedMapIndex);
        }
        return;
      }

      if (gameState === 'playing' || gameState === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
          return;
        }
      }

      if (gameState !== 'playing') return;

      const gunByKey = GUN_CATALOG.find((g) => g.hotkey === e.key);
      if (gunByKey) {
        setSelectedTool(gunByKey.type);
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        upgradeSelectedGun();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        cycleSelectedPriority();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        sellSelectedGun();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (simRef.current.overdriveCharge >= 100 && simRef.current.overdriveTimer <= 0) {
          activateOverdrive();
        } else if (!simRef.current.waveActive) {
          launchNextWave();
        }
      } else if (e.key === 'Enter' && !simRef.current.waveActive) {
        e.preventDefault();
        launchNextWave();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    selectedMapIndex,
    startNewRun,
    upgradeSelectedGun,
    cycleSelectedPriority,
    sellSelectedGun,
    activateOverdrive,
    launchNextWave,
  ]);

  // Title Screen Animated Pure-Gun Showcase (Lv10 Mythic Turrets vs Upgraded Armada)
  useEffect(() => {
    if (gameState !== 'title') return;
    let rafId = 0;
    let lastTs = performance.now();
    let t = 0;

    const renderTitlePreview = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.05);
      lastTs = now;
      t += dt;

      const canvas = titleCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = 420;
          const h = 250;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          ctx.fillStyle = '#060A15';
          ctx.fillRect(0, 0, w, h);

          // Tactical grid
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
          ctx.lineWidth = 1;
          for (let gx = 24; gx < w; gx += 32) {
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, h);
            ctx.stroke();
          }
          for (let gy = 24; gy < h; gy += 32) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
          }

          // Road track at top/right
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.lineWidth = 28;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(30, 56);
          ctx.lineTo(350, 56);
          ctx.lineTo(350, 195);
          ctx.stroke();

          // Mock Showcase Enemies moving smoothly along lane
          const bossX = 210 + Math.sin(t * 0.9) * 75;
          const bossEnemy: TdEnemy = {
            id: 901,
            kind: 'boss',
            x: bossX,
            y: 56,
            heading: 0,
            waypointIndex: 1,
            hp: 820,
            maxHp: 1000,
            shield: 300,
            maxShield: 350,
            speed: 40,
            radius: 25,
            reward: 80,
            scoreValue: 200,
            armorRatio: 0.4,
            slowTimer: 0,
            slowFactor: 1,
            brittleBonus: 0,
            burnTimer: 0.5,
            burnDps: 0,
            armorShred: 0,
            stunTimer: 0,
            abilityCooldown: 2,
            hitFlash: Math.sin(t * 14) > 0.85 ? 0.1 : 0,
            koTimer: 0,
            isElite: true,
          };
          const escortTank: TdEnemy = {
            ...bossEnemy,
            id: 902,
            kind: 'shieldbearer',
            x: 350,
            y: 132 + Math.cos(t * 1.4) * 34,
            heading: Math.PI / 2,
            radius: 18,
            burnTimer: 0,
            slowTimer: 1,
            brittleBonus: 0.3,
            isElite: false,
          };

          drawEnemySprite(ctx, bossEnemy, t);
          drawEnemySprite(ctx, escortTank, t);

          // Showcase 3 Evolved Lv10 Mythic Turrets firing
          const vulcanAngle = Math.atan2(bossEnemy.y - 165, bossEnemy.x - 105);
          const railAngle = Math.atan2(bossEnemy.y - 165, bossEnemy.x - 215);
          const teslaPt = { x: 255, y: 175 };

          // Railgun cinematic beam pulsing
          const pulseA = Math.max(0.25, Math.sin(t * 4) * 0.5 + 0.5);
          ctx.save();
          ctx.globalAlpha = pulseA;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#C084FC';
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(215, 165);
          ctx.lineTo(bossEnemy.x, bossEnemy.y);
          ctx.stroke();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(215, 165);
          ctx.lineTo(bossEnemy.x, bossEnemy.y);
          ctx.stroke();
          ctx.restore();

          // Tesla jagged arc to shieldbearer
          ctx.save();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(teslaPt.x, teslaPt.y);
          ctx.lineTo(298, 152 + Math.sin(t * 20) * 6);
          ctx.lineTo(escortTank.x, escortTank.y);
          ctx.stroke();
          ctx.restore();

          // Vulcan tracers
          for (let b = 0; b < 3; b++) {
            const frac = ((t * 2.4 + b * 0.33) % 1);
            const bx = 105 + (bossEnemy.x - 105) * frac;
            const by = 165 + (bossEnemy.y - 165) * frac;
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.save();
          ctx.translate(105, 165);
          drawGunTurretSprite(ctx, 'gatling', 10, vulcanAngle, 0.25, t);
          ctx.restore();

          ctx.save();
          ctx.translate(215, 165);
          drawGunTurretSprite(ctx, 'railgun', 10, railAngle, 0.3, t);
          ctx.restore();

          ctx.save();
          ctx.translate(teslaPt.x, teslaPt.y);
          drawGunTurretSprite(ctx, 'tesla', 7, 0, 0, t);
          ctx.restore();
        }
      }
      rafId = window.requestAnimationFrame(renderTitlePreview);
    };

    rafId = window.requestAnimationFrame(renderTitlePreview);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState]);

  // Main 60Hz Canvas Simulation & Renderer
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'paused') return;
    let rafId = 0;
    let lastTs = performance.now();
    let hudSyncAccum = 0;

    const recordKill = (en: TdEnemy, killerGunId?: string) => {
      const s = simRef.current;
      s.kills += 1;
      s.energy += en.reward;
      s.score += en.scoreValue;
      if (killerGunId) {
        const gun = s.guns.find((g) => g.id === killerGunId);
        if (gun) gun.kills += 1;
      }

      const blastColor =
        en.kind === 'boss'
          ? '#FB7185'
          : en.kind === 'armored' || en.kind === 'shieldbearer'
            ? '#FBBF24'
            : en.kind === 'healer'
              ? '#4ADE80'
              : en.kind === 'teleporter'
                ? '#C084FC'
                : en.kind === 'stealth'
                  ? '#34D399'
                  : '#38BDF8';
      emitParticles(
        en.x,
        en.y,
        blastColor,
        en.kind === 'boss' ? 42 : 16,
        en.kind === 'boss' ? 200 : 135,
        en.kind === 'boss' ? 1.5 : 1.05
      );
      s.shockwaves.push({
        x: en.x,
        y: en.y,
        radius: 6,
        maxRadius: en.kind === 'boss' ? 98 : 42,
        alpha: 0.88,
        color: blastColor,
        lineWidth: en.kind === 'boss' ? 4.5 : 2.4,
      });

      // Splitter splits into 2-3 fast mini cyber-drones on death!
      if (en.kind === 'splitter' && en.radius >= 14) {
        const offsets = s.wave >= 9 ? [-12, 0, 12] : [-10, 10];
        for (const offset of offsets) {
          s.enemies.push({
            ...en,
            id: s.nextEnemyId++,
            x: en.x + Math.cos(en.heading + Math.PI / 2) * offset,
            y: en.y + Math.sin(en.heading + Math.PI / 2) * offset,
            hp: Math.max(28, Math.round(en.maxHp * 0.36)),
            maxHp: Math.max(28, Math.round(en.maxHp * 0.36)),
            shield: 0,
            maxShield: 0,
            speed: en.speed * 1.24,
            radius: 9,
            reward: 5,
            scoreValue: 16,
            koTimer: 0,
            hitFlash: 0.12,
            burnTimer: 0,
            slowTimer: 0,
            stunTimer: 0,
            isElite: false,
          });
        }
        emitParticles(en.x, en.y, '#E879F9', 14, 110, 0.9);
      }

      pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', en.kind === 'boss' ? 1.3 : 1);
      if (en.kind === 'boss') {
        s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.65);
        playSynthFx('explosion', soundEnabled, audioCtxRef);
      } else {
        playSynthFx('kill', soundEnabled, audioCtxRef);
      }
    };

    const tickAndDraw = (now: number) => {
      const rawDt = (now - lastTs) / 1000;
      lastTs = now;
      const dt = Math.min(rawDt, 0.05);
      const s = simRef.current;

      if (gameState === 'playing') {
        const simDt = dt * s.speedMult;
        s.animTime += simDt;

        if (s.overdriveTimer > 0) {
          s.overdriveTimer = Math.max(0, s.overdriveTimer - simDt);
          if (s.overdriveTimer === 0) {
            recomputeFirepower();
            syncHudFromSim();
          }
        }

        if (s.shakeTrauma > 0) {
          s.shakeTrauma = Math.max(0, s.shakeTrauma - dt * 1.6);
        }

        // 0. 10-second Auto-Wave Countdown
        if (!s.waveActive && !s.outcome && s.wave < s.totalWaves) {
          s.nextWaveTimer = Math.max(0, s.nextWaveTimer - dt);
          if (s.nextWaveTimer <= 0) {
            const autoWave = s.wave + 1;
            s.wave = autoWave;
            s.waveActive = true;
            s.waveElapsed = 0;
            s.spawnQueue = buildWaveSpawns(autoWave, s.totalWaves, s.difficulty);
            setStatusNotice(`Tự động gọi Đợt ${autoWave}/${s.totalWaves}! Nâng cấp súng để bùng nổ hỏa lực!`);
            playSynthFx('wave', soundEnabled, audioCtxRef);
            syncHudFromSim();
          }
        }

        // 1. Spawn queue
        if (s.waveActive && s.spawnQueue.length > 0) {
          s.waveElapsed += simDt;
          while (s.spawnQueue.length > 0 && s.spawnQueue[0].delaySec <= s.waveElapsed) {
            const item = s.spawnQueue.shift()!;
            s.enemies.push(createEnemyForWave(s.nextEnemyId++, item.kind, s.wave, s.map, item.isElite, s.difficulty));
          }
        }

        // 2. Pure Gun Turrets Combat Simulation (Lv1 -> Lv10 Skills & FX)
        const liveEnemies = s.enemies.filter((e) => e.hp > 0 && e.koTimer <= 0);
        const overdriveSpeedMult = s.overdriveTimer > 0 ? 1.7 : 1;
        const overdriveDmgMult = s.overdriveTimer > 0 ? 1.3 : 1;

        for (const gun of s.guns) {
          if (gun.recoil > 0) gun.recoil = Math.max(0, gun.recoil - simDt * 5);
          const profile = getGunCombatProfile(gun.type, gun.level);
          const origin = gridToWorldCenter(gun.col, gun.row);
          const rangeSq = profile.rangePx * profile.rangePx;

          // Target selection honoring TargetPriority
          let target: TdEnemy | null = null;
          let bestScore = -Infinity;
          for (const en of liveEnemies) {
            const dx = en.x - origin.x;
            const dy = en.y - origin.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= rangeSq) {
              let priorityVal = 0;
              if (gun.priority === 'strongest') {
                priorityVal = en.hp + en.shield + en.waypointIndex * 25;
              } else if (gun.priority === 'weakest') {
                priorityVal = -(en.hp + en.shield) + en.waypointIndex * 50;
              } else {
                priorityVal = en.waypointIndex * 250 - Math.hypot(dx, dy);
              }
              if (priorityVal > bestScore) {
                bestScore = priorityVal;
                target = en;
              }
            }
          }

          if (target) {
            gun.aimAngle = Math.atan2(target.y - origin.y, target.x - origin.x);
          }

          gun.chargeTimer += simDt * overdriveSpeedMult;
          if (!target || gun.chargeTimer < profile.cooldownSec) continue;

          gun.chargeTimer = 0;
          gun.recoil = 1;
          const shotDmg = Math.round(profile.damage * overdriveDmgMult);

          if (gun.type === 'gatling') {
            const count = profile.projectilesPerShot;
            const bColor = profile.visualTier === 4 ? '#FDE047' : profile.visualTier === 3 ? '#FB923C' : '#38BDF8';
            for (let b = 0; b < count; b++) {
              const offsetAngle = count === 1 ? 0 : (b - (count - 1) / 2) * 0.085;
              const shotAngle = gun.aimAngle + offsetAngle;
              const muzzleX = origin.x + Math.cos(shotAngle) * 22;
              const muzzleY = origin.y + Math.sin(shotAngle) * 22;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'bullet',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 580,
                vy: Math.sin(shotAngle) * 580,
                targetId: target.id,
                damage: count > 1 ? Math.round(shotDmg * (count === 5 ? 0.56 : count === 3 ? 0.68 : 0.78)) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 0.95,
                maxLife: 0.95,
                speed: 580,
                color: bColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: shotAngle, radius: 13 + profile.visualTier * 2, alpha: 0.95, color: bColor });
            }
            playSynthFx('gatling', soundEnabled, audioCtxRef);
          } else if (gun.type === 'shotgun') {
            const count = profile.projectilesPerShot;
            const spreadCone = 0.52;
            const pColor = profile.visualTier >= 3 ? '#FDE047' : '#FB923C';
            for (let b = 0; b < count; b++) {
              const frac = count > 1 ? b / (count - 1) - 0.5 : 0;
              const shotAngle = gun.aimAngle + frac * spreadCone;
              const muzzleX = origin.x + Math.cos(shotAngle) * 20;
              const muzzleY = origin.y + Math.sin(shotAngle) * 20;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'pellet',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(shotAngle) * 470,
                vy: Math.sin(shotAngle) * 470,
                targetId: target.id,
                damage: shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: 0,
                pullForce: 0,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.2 : 0,
                slowAmount: 0,
                pierceLeft: gun.level >= 10 ? 2 : gun.level >= 7 ? 1 : 0,
                hitIds: [],
                life: 0.42,
                maxLife: 0.42,
                speed: 470,
                color: pColor,
                visualTier: profile.visualTier,
              });
            }
            const mx = origin.x + Math.cos(gun.aimAngle) * 21;
            const my = origin.y + Math.sin(gun.aimAngle) * 21;
            s.muzzleFlashes.push({ x: mx, y: my, angle: gun.aimAngle, radius: 22 + profile.visualTier * 2, alpha: 1, color: pColor });
            emitParticles(mx, my, pColor, 8 + profile.visualTier * 2, 130, 1.05);
            playSynthFx('shotgun', soundEnabled, audioCtxRef);
          } else if (gun.type === 'flamer') {
            const coneRange = profile.rangePx * (1.06 + (gun.level - 1) * 0.03);
            const halfArc = 0.48 + (gun.level >= 7 ? 0.14 : 0);
            const muzzleX = origin.x + Math.cos(gun.aimAngle) * 18;
            const muzzleY = origin.y + Math.sin(gun.aimAngle) * 18;
            s.flameCones.push({
              x: muzzleX,
              y: muzzleY,
              angle: gun.aimAngle,
              range: coneRange,
              halfArc,
              alpha: 0.94,
              visualTier: profile.visualTier,
            });
            if (gun.level === MAX_GUN_LEVEL) {
              // Lv10 360 Inferno Nova!
              s.shockwaves.push({
                x: origin.x,
                y: origin.y,
                radius: 16,
                maxRadius: coneRange * 0.92,
                alpha: 0.85,
                color: '#38BDF8',
                lineWidth: 3.5,
              });
            }
            for (let k = 0; k < 5 + profile.visualTier * 2; k++) {
              const spreadAngle = gun.aimAngle + (Math.random() - 0.5) * halfArc * 2;
              const slot = s.particles[s.particleCursor];
              s.particleCursor = (s.particleCursor + 1) % PARTICLE_POOL_SIZE;
              slot.active = true;
              slot.x = muzzleX;
              slot.y = muzzleY;
              slot.vx = Math.cos(spreadAngle) * (160 + Math.random() * 105);
              slot.vy = Math.sin(spreadAngle) * (160 + Math.random() * 105);
              slot.life = 0.36;
              slot.maxLife = 0.36;
              slot.size = profile.visualTier >= 3 ? 3.8 : 3.2;
              slot.color =
                profile.visualTier >= 3
                  ? Math.random() < 0.5
                    ? '#38BDF8'
                    : '#E0F2FE'
                  : Math.random() < 0.5
                    ? '#F97316'
                    : '#FACC15';
            }

            for (const en of liveEnemies) {
              const dx = en.x - origin.x;
              const dy = en.y - origin.y;
              const dist = Math.hypot(dx, dy);
              if (dist <= coneRange + en.radius) {
                const diff = Math.abs(
                  Math.atan2(Math.sin(Math.atan2(dy, dx) - gun.aimAngle), Math.cos(Math.atan2(dy, dx) - gun.aimAngle))
                );
                if (diff <= halfArc || gun.level === MAX_GUN_LEVEL) {
                  en.burnTimer = Math.max(en.burnTimer, 2.8 + gun.level * 0.25);
                  en.burnDps = Math.max(en.burnDps, Math.round(profile.burnDps * overdriveDmgMult));
                  if (gun.level >= 5) {
                    en.armorShred = Math.max(en.armorShred, 0.35);
                  }
                  if (profile.slowPct > 0) {
                    en.slowTimer = Math.max(en.slowTimer, 1.0);
                    en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                  }
                  const res = applyDamageToEnemy(en, shotDmg, {
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
                  }
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
            playSynthFx('flamer', soundEnabled, audioCtxRef);
          } else if (gun.type === 'cryo') {
            s.shockwaves.push({
              x: origin.x,
              y: origin.y,
              radius: 14,
              maxRadius: profile.rangePx,
              alpha: 0.92,
              color: profile.visualTier >= 3 ? '#38BDF8' : '#67E8F9',
              lineWidth: 3.2 + profile.visualTier * 0.7,
            });
            if (profile.visualTier >= 3) {
              s.shockwaves.push({
                x: origin.x,
                y: origin.y,
                radius: 24,
                maxRadius: profile.rangePx * 0.76,
                alpha: 0.94,
                color: '#FFFFFF',
                lineWidth: 2.5,
              });
            }
            emitParticles(origin.x, origin.y, '#BAE6FD', 16 + profile.visualTier * 4, 140, 1.15);

            for (const en of liveEnemies) {
              if ((en.x - origin.x) ** 2 + (en.y - origin.y) ** 2 <= rangeSq) {
                const wasChilled = en.slowTimer > 0;
                const totalFrost = wasChilled && profile.visualTier >= 3 ? Math.round(shotDmg * 1.45) : shotDmg;
                en.slowTimer = Math.max(en.slowTimer, 3.0 + gun.level * 0.25);
                en.slowFactor = Math.min(en.slowFactor || 1, 1 - profile.slowPct);
                en.brittleBonus = Math.max(en.brittleBonus, profile.brittleBonus);
                if (gun.level >= 7) {
                  en.stunTimer = Math.max(en.stunTimer, gun.level === 10 ? 0.6 : 0.35);
                }
                const res = applyDamageToEnemy(en, totalFrost, {
                  armorPierce: profile.armorPierce,
                  shieldMult: profile.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                gun.totalDamageDealt += res.actualDamage;
                if (res.killed) recordKill(en, gun.id);
              }
            }
            playSynthFx('cryo', soundEnabled, audioCtxRef);
          } else if (gun.type === 'tesla') {
            const maxJumps = profile.chainCount;
            const hitIds = new Set<number>([target.id]);
            const chainPts: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            const chainPtsAlt: { x: number; y: number }[] = [{ x: origin.x, y: origin.y }];
            let cur: TdEnemy | null = target;

            for (let j = 0; j < maxJumps && cur; j++) {
              const prevPt = chainPts[chainPts.length - 1];
              const midX = (prevPt.x + cur.x) / 2 + (Math.random() * 24 - 12);
              const midY = (prevPt.y + cur.y) / 2 + (Math.random() * 24 - 12);
              chainPts.push({ x: midX, y: midY }, { x: cur.x, y: cur.y });
              chainPtsAlt.push(
                { x: (prevPt.x + cur.x) / 2 + (Math.random() * 30 - 15), y: (prevPt.y + cur.y) / 2 + (Math.random() * 30 - 15) },
                { x: cur.x, y: cur.y }
              );

              const falloff = Math.max(0.58, 1 - j * 0.06);
              const zapDmg = Math.round(shotDmg * falloff);
              cur.slowTimer = Math.max(cur.slowTimer, 1.5 + gun.level * 0.15);
              cur.slowFactor = Math.min(cur.slowFactor || 1, 1 - profile.slowPct);
              if (gun.level >= 7) {
                cur.stunTimer = Math.max(cur.stunTimer, 0.35);
              }
              s.shockwaves.push({
                x: cur.x,
                y: cur.y,
                radius: 4,
                maxRadius: profile.visualTier === 4 ? 48 : 26,
                alpha: 0.85,
                color: profile.visualTier >= 3 ? '#FDE047' : '#7DD3FC',
                lineWidth: profile.visualTier >= 3 ? 2.8 : 2,
              });
              emitParticles(cur.x, cur.y, profile.visualTier >= 3 ? '#FDE047' : '#7DD3FC', 8, 120, 1);

              const res = applyDamageToEnemy(cur, zapDmg, {
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
              });
              s.totalDamage += res.actualDamage;
              gun.totalDamageDealt += res.actualDamage;
              if (s.overdriveTimer <= 0) {
                s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
              }
              if (res.killed) recordKill(cur, gun.id);

              let nextTarget: TdEnemy | null = null;
              let minD = (150 + gun.level * 12) ** 2;
              for (const cand of liveEnemies) {
                if (hitIds.has(cand.id) || cand.hp <= 0) continue;
                const dSq = (cand.x - cur.x) ** 2 + (cand.y - cur.y) ** 2;
                if (dSq <= minD) {
                  minD = dSq;
                  nextTarget = cand;
                }
              }
              if (nextTarget) hitIds.add(nextTarget.id);
              cur = nextTarget;
            }

            s.lightningArcs.push({
              points: chainPts,
              alpha: 1,
              color: profile.visualTier === 4 ? '#FDE047' : '#38BDF8',
              width: 2.8 + profile.visualTier * 0.7,
            });
            s.lightningArcs.push({
              points: chainPtsAlt,
              alpha: 0.85,
              color: profile.visualTier >= 3 ? '#38BDF8' : '#BAE6FD',
              width: 1.8 + profile.visualTier * 0.35,
            });
            playSynthFx('tesla', soundEnabled, audioCtxRef);
          } else if (gun.type === 'missile') {
            const salvoCount = profile.projectilesPerShot;
            const sortedNearby = [...liveEnemies].sort(
              (a, b) => (a.x - origin.x) ** 2 + (a.y - origin.y) ** 2 - ((b.x - origin.x) ** 2 + (b.y - origin.y) ** 2)
            );
            for (let mIdx = 0; mIdx < salvoCount; mIdx++) {
              const lock = sortedNearby[mIdx % sortedNearby.length] ?? target;
              const spreadOffset = salvoCount === 1 ? 0 : (mIdx - (salvoCount - 1) / 2) * 0.24;
              const launchAngle = gun.aimAngle + spreadOffset;
              const muzzleX = origin.x + Math.cos(launchAngle) * 19;
              const muzzleY = origin.y + Math.sin(launchAngle) * 19;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'missile',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(launchAngle) * 285,
                vy: Math.sin(launchAngle) * 285,
                targetId: lock.id,
                damage: salvoCount === 4 ? Math.round(shotDmg * 0.56) : salvoCount === 2 ? Math.round(shotDmg * 0.72) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: 0,
                burnDps: 0,
                burnDuration: 0,
                slowAmount: 0,
                pierceLeft: 0,
                life: 2.5,
                maxLife: 2.5,
                speed: 295 + gun.level * 10,
                color: profile.visualTier >= 3 ? '#FDE047' : '#FB7185',
                visualTier: profile.visualTier,
                spawnCluster: gun.level >= 7,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: launchAngle, radius: 20, alpha: 0.95, color: '#FB923C' });
            }
            playSynthFx('missile', soundEnabled, audioCtxRef);
          } else if (gun.type === 'railgun') {
            const beamCount = profile.projectilesPerShot;
            const railColor = profile.visualTier === 4 ? '#FDE047' : profile.visualTier >= 3 ? '#F43F5E' : '#A78BFA';
            s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.3 + profile.visualTier * 0.08);

            for (let b = 0; b < beamCount; b++) {
              const offsetAngle = beamCount === 1 ? 0 : (b - (beamCount - 1) / 2) * 0.065;
              const bAngle = gun.aimAngle + offsetAngle;
              const muzzleX = origin.x + Math.cos(bAngle) * 24;
              const muzzleY = origin.y + Math.sin(bAngle) * 24;
              const endX = origin.x + Math.cos(bAngle) * 760;
              const endY = origin.y + Math.sin(bAngle) * 760;

              s.railBeams.push({
                x1: muzzleX,
                y1: muzzleY,
                x2: endX,
                y2: endY,
                alpha: 1,
                color: railColor,
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: bAngle, radius: 26 + profile.visualTier * 4, alpha: 1, color: railColor });

              const segLenSq = (endX - origin.x) ** 2 + (endY - origin.y) ** 2;
              const perBeamDmg = beamCount === 3 ? Math.round(shotDmg * 0.56) : beamCount === 2 ? Math.round(shotDmg * 0.68) : shotDmg;
              for (const en of liveEnemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const tProj = Math.max(
                  0,
                  Math.min(1, ((en.x - origin.x) * (endX - origin.x) + (en.y - origin.y) * (endY - origin.y)) / segLenSq)
                );
                const px = origin.x + tProj * (endX - origin.x);
                const py = origin.y + tProj * (endY - origin.y);
                const distSq = (en.x - px) ** 2 + (en.y - py) ** 2;
                if (distSq <= (en.radius + 14 + profile.visualTier * 2) ** 2) {
                  emitParticles(en.x, en.y, profile.visualTier >= 3 ? '#FDE047' : '#E879F9', 14, 175, 1.2);
                  if (profile.splashRadius > 0) {
                    s.shockwaves.push({
                      x: en.x,
                      y: en.y,
                      radius: 6,
                      maxRadius: profile.splashRadius,
                      alpha: 0.85,
                      color: '#FB7185',
                      lineWidth: 2.8,
                    });
                  }
                  const res = applyDamageToEnemy(en, perBeamDmg, {
                    armorPierce: profile.armorPierce,
                    shieldMult: profile.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  gun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.04);
                  }
                  if (res.killed) recordKill(en, gun.id);
                }
              }
            }
            playSynthFx('railgun', soundEnabled, audioCtxRef);
          } else if (gun.type === 'mortar') {
            const shellCount = profile.projectilesPerShot;
            for (let m = 0; m < shellCount; m++) {
              const offset = shellCount === 1 ? 0 : (m === 0 ? -0.18 : 0.18);
              const launchAngle = gun.aimAngle + offset;
              const muzzleX = origin.x + Math.cos(launchAngle) * 16;
              const muzzleY = origin.y + Math.sin(launchAngle) * 16;
              s.projectiles.push({
                id: s.nextProjId++,
                kind: 'mortar',
                sourceGunId: gun.id,
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(launchAngle) * 205,
                vy: Math.sin(launchAngle) * 205,
                targetId: target.id,
                damage: shellCount === 2 ? Math.round(shotDmg * 0.72) : shotDmg,
                armorPierce: profile.armorPierce,
                shieldMult: profile.shieldMult,
                splashRadius: profile.splashRadius,
                pullForce: profile.pullForce,
                burnDps: profile.burnDps,
                burnDuration: profile.burnDps > 0 ? 2.5 : 0,
                slowAmount: profile.slowPct,
                pierceLeft: 0,
                life: 2.3,
                maxLife: 2.3,
                speed: 205 + gun.level * 8,
                color: profile.visualTier === 4 ? '#FDE047' : '#C084FC',
                visualTier: profile.visualTier,
              });
              s.muzzleFlashes.push({ x: muzzleX, y: muzzleY, angle: launchAngle, radius: 22 + profile.visualTier * 3, alpha: 0.95, color: '#C084FC' });
            }
            playSynthFx('mortar', soundEnabled, audioCtxRef);
          }
        }

        // 3. Step Projectiles
        const survivingProjectiles: ProjectileItem[] = [];
        for (const pr of s.projectiles) {
          pr.life -= simDt;
          if (pr.life <= 0) continue;

          const tgt = s.enemies.find((e) => e.id === pr.targetId && e.hp > 0);
          if ((pr.kind === 'missile' || pr.kind === 'mortar') && tgt) {
            const angle = Math.atan2(tgt.y - pr.y, tgt.x - pr.x);
            pr.vx = Math.cos(angle) * pr.speed;
            pr.vy = Math.sin(angle) * pr.speed;
            if (Math.random() < 0.65) {
              emitParticles(pr.x, pr.y, pr.kind === 'mortar' ? '#C084FC' : '#FDBA74', 1, 30, 0.75);
            }
          }

          pr.x += pr.vx * simDt;
          pr.y += pr.vy * simDt;

          let hitEnemy: TdEnemy | null = null;
          for (const en of s.enemies) {
            if (en.hp <= 0 || en.koTimer > 0) continue;
            if (pr.hitIds && pr.hitIds.includes(en.id)) continue;
            const dSq = (en.x - pr.x) ** 2 + (en.y - pr.y) ** 2;
            if (dSq <= (en.radius + 9) ** 2) {
              hitEnemy = en;
              break;
            }
          }

          if (hitEnemy) {
            const sourceGun = s.guns.find((g) => g.id === pr.sourceGunId);
            if (pr.kind === 'mortar') {
              s.shockwaves.push({
                x: pr.x,
                y: pr.y,
                radius: pr.splashRadius,
                maxRadius: 12,
                alpha: 0.95,
                color: '#C084FC',
                lineWidth: 4 + pr.visualTier,
              });
              s.shockwaves.push({
                x: pr.x,
                y: pr.y,
                radius: 8,
                maxRadius: pr.splashRadius,
                alpha: 0.85,
                color: '#FDE047',
                lineWidth: 2.5 + pr.visualTier * 0.5,
              });
              s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.3 + pr.visualTier * 0.06);
              emitParticles(pr.x, pr.y, '#C084FC', 22 + pr.visualTier * 5, 185, 1.35);

              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dx = pr.x - en.x;
                const dy = pr.y - en.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= pr.splashRadius + en.radius) {
                  if (dist > 6 && en.kind !== 'boss') {
                    en.x += (dx / dist) * pr.pullForce;
                    en.y += (dy / dist) * pr.pullForce;
                  }
                  if (pr.slowAmount > 0) {
                    en.slowTimer = Math.max(en.slowTimer, 1.8);
                    en.slowFactor = Math.min(en.slowFactor || 1, 1 - pr.slowAmount);
                  }
                  if (pr.burnDps > 0) {
                    en.burnTimer = Math.max(en.burnTimer, pr.burnDuration);
                    en.burnDps = Math.max(en.burnDps, pr.burnDps);
                  }
                  const falloffDmg = Math.round(pr.damage * (dist < 42 ? 1 : 0.78));
                  const res = applyDamageToEnemy(en, falloffDmg, {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
              continue;
            } else if (pr.kind === 'missile' || pr.kind === 'bomblet') {
              s.shockwaves.push({
                x: pr.x,
                y: pr.y,
                radius: 8,
                maxRadius: pr.splashRadius,
                alpha: 0.9,
                color: pr.visualTier >= 3 ? '#FDE047' : '#FB7185',
                lineWidth: 3.2 + pr.visualTier * 0.5,
              });
              emitParticles(pr.x, pr.y, '#FB923C', pr.kind === 'bomblet' ? 8 : 16, 145, 1.15);
              for (const en of s.enemies) {
                if (en.hp <= 0 || en.koTimer > 0) continue;
                const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                if (dist <= pr.splashRadius + en.radius) {
                  const dmg = Math.round(pr.damage * (dist < 28 ? 1 : 0.74));
                  const res = applyDamageToEnemy(en, dmg, {
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                  });
                  s.totalDamage += res.actualDamage;
                  if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                  if (s.overdriveTimer <= 0) {
                    s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.045);
                  }
                  if (res.killed) recordKill(en, pr.sourceGunId);
                }
              }
              if (pr.kind === 'missile' && pr.spawnCluster) {
                for (let c = 0; c < 3; c++) {
                  const ca = (c * Math.PI * 2) / 3 + Math.random() * 0.5;
                  s.projectiles.push({
                    id: s.nextProjId++,
                    kind: 'bomblet',
                    sourceGunId: pr.sourceGunId,
                    x: pr.x,
                    y: pr.y,
                    vx: Math.cos(ca) * 210,
                    vy: Math.sin(ca) * 210,
                    targetId: -1,
                    damage: Math.round(pr.damage * 0.42),
                    armorPierce: pr.armorPierce,
                    shieldMult: pr.shieldMult,
                    splashRadius: 46,
                    pullForce: 0,
                    burnDps: 0,
                    burnDuration: 0,
                    slowAmount: 0,
                    pierceLeft: 0,
                    life: 0.25,
                    maxLife: 0.25,
                    speed: 210,
                    color: '#FDE047',
                    visualTier: pr.visualTier,
                  });
                }
              }
              playSynthFx('explosion', soundEnabled, audioCtxRef);
              continue;
            } else {
              // Bullet / Pellet
              if (pr.burnDps > 0) {
                hitEnemy.burnTimer = Math.max(hitEnemy.burnTimer, pr.burnDuration);
                hitEnemy.burnDps = Math.max(hitEnemy.burnDps, pr.burnDps);
                hitEnemy.armorShred = Math.max(hitEnemy.armorShred, 0.25);
              }
              if (pr.splashRadius > 0) {
                s.shockwaves.push({
                  x: pr.x,
                  y: pr.y,
                  radius: 4,
                  maxRadius: pr.splashRadius,
                  alpha: 0.75,
                  color: '#FDE047',
                  lineWidth: 2,
                });
                for (const en of s.enemies) {
                  if (en.hp <= 0 || en.koTimer > 0) continue;
                  const dist = Math.hypot(en.x - pr.x, en.y - pr.y);
                  if (dist <= pr.splashRadius + en.radius) {
                    const res = applyDamageToEnemy(en, Math.round(pr.damage * (en.id === hitEnemy.id ? 1 : 0.55)), {
                      armorPierce: pr.armorPierce,
                      shieldMult: pr.shieldMult,
                    });
                    s.totalDamage += res.actualDamage;
                    if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                    if (res.killed) recordKill(en, pr.sourceGunId);
                  }
                }
              } else {
                const res = applyDamageToEnemy(hitEnemy, pr.damage, {
                  armorPierce: pr.armorPierce,
                  shieldMult: pr.shieldMult,
                });
                s.totalDamage += res.actualDamage;
                if (sourceGun) sourceGun.totalDamageDealt += res.actualDamage;
                if (s.overdriveTimer <= 0) {
                  s.overdriveCharge = Math.min(100, s.overdriveCharge + res.actualDamage * 0.05);
                }
                emitParticles(pr.x, pr.y, pr.color, 5, 85, 0.8);
                if (res.killed) recordKill(hitEnemy, pr.sourceGunId);
              }

              if (pr.pierceLeft > 0) {
                pr.pierceLeft -= 1;
                if (!pr.hitIds) pr.hitIds = [];
                pr.hitIds.push(hitEnemy.id);
              } else {
                continue;
              }
            }
          }

          if (pr.x >= -20 && pr.x <= CANVAS_WIDTH + 20 && pr.y >= -20 && pr.y <= CANVAS_HEIGHT + 20) {
            survivingProjectiles.push(pr);
          }
        }
        s.projectiles = survivingProjectiles;

        // 4. Enemy Movement, Fire Burn DoT & Archetype Abilities
        if (s.enemies.length > 0) {
          const beforeIds = new Set(s.enemies.filter((e) => e.hp > 0).map((e) => e.id));
          const { coreDamageTaken, outcome } = stepEnemies(s.enemies, s.map, simDt);

          if (outcome.totalDamageDealt > 0 || outcome.killedCount > 0) {
            s.kills += outcome.killedCount;
            s.energy += outcome.energyGained;
            s.score += outcome.scoreGained;
            s.totalDamage += outcome.totalDamageDealt;
          }

          for (const hEv of outcome.healedEvents) {
            s.healBeams.push({ ...hEv, alpha: 0.95 });
            pushCombatText(hEv.toX, hEv.toY, `+${hEv.amount}`, '#4ADE80', 0.88);
          }
          for (const bEv of outcome.blinkEvents) {
            s.shockwaves.push({
              x: bEv.fromX,
              y: bEv.fromY,
              radius: 4,
              maxRadius: 34,
              alpha: 0.85,
              color: '#C084FC',
              lineWidth: 2.5,
            });
            s.shockwaves.push({
              x: bEv.toX,
              y: bEv.toY,
              radius: 24,
              maxRadius: 6,
              alpha: 0.9,
              color: '#E879F9',
              lineWidth: 2.5,
            });
            emitParticles(bEv.toX, bEv.toY, '#C084FC', 12, 110, 1);
          }
          for (const sr of outcome.shieldRegenEvents) {
            s.shockwaves.push({
              x: sr.x,
              y: sr.y,
              radius: 10,
              maxRadius: 32,
              alpha: 0.78,
              color: '#38BDF8',
              lineWidth: 2,
            });
          }

          for (const en of s.enemies) {
            if (en.koTimer >= 0.24 && beforeIds.has(en.id)) {
              emitParticles(en.x, en.y, '#FBBF24', 14, 130, 1.05);
              pushCombatText(en.x, en.y, `+${en.reward}⚡`, '#FBBF24', 1);
            } else if (en.burnTimer > 0 && Math.random() < 0.4) {
              emitParticles(en.x, en.y, '#F97316', 1, 40, 0.85);
            }
          }

          if (outcome.killedCount > 0) {
            playSynthFx('kill', soundEnabled, audioCtxRef);
          }

          if (coreDamageTaken > 0) {
            s.coreHp = Math.max(0, s.coreHp - coreDamageTaken);
            s.shakeTrauma = Math.min(1, s.shakeTrauma + 0.55);
            const corePt = gridToWorldCenter(
              s.map.path[s.map.path.length - 1].col,
              s.map.path[s.map.path.length - 1].row
            );
            emitParticles(corePt.x, corePt.y, '#F43F5E', 18, 145, 1.2);
            playSynthFx('hurt', soundEnabled, audioCtxRef);
          }

          s.enemies = s.enemies.filter((e) => e.hp > 0 || e.koTimer > 0);
        }

        // 5. Update transient FX
        for (const p of s.particles) {
          if (!p.active) continue;
          p.life -= dt;
          if (p.life <= 0) {
            p.active = false;
            continue;
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.92;
          p.vy *= 0.92;
        }
        s.shockwaves = s.shockwaves.filter((sw) => {
          sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 8.5) + (sw.maxRadius > sw.radius ? 45 : -45) * dt;
          sw.alpha -= dt * 2.4;
          return sw.alpha > 0.02;
        });
        s.lightningArcs = s.lightningArcs.filter((arc) => {
          arc.alpha -= dt * 5.2;
          return arc.alpha > 0.05;
        });
        s.railBeams = s.railBeams.filter((rb) => {
          rb.alpha -= dt * 3.8;
          return rb.alpha > 0.04;
        });
        s.flameCones = s.flameCones.filter((fc) => {
          fc.alpha -= dt * 4.5;
          return fc.alpha > 0.04;
        });
        s.healBeams = s.healBeams.filter((hb) => {
          hb.alpha -= dt * 2.2;
          return hb.alpha > 0.04;
        });
        s.muzzleFlashes = s.muzzleFlashes.filter((mf) => {
          mf.alpha -= dt * 8.5;
          return mf.alpha > 0.04;
        });
        s.floatingTexts = s.floatingTexts.filter((ft) => {
          ft.y += ft.vy * dt;
          ft.alpha -= dt * 1.45;
          return ft.alpha > 0.04;
        });

        // 6. Wave Clear / Victory / Defeat Check
        if (s.waveActive && s.spawnQueue.length === 0 && s.enemies.length === 0 && s.coreHp > 0) {
          s.waveActive = false;
          const diffCfg = DIFFICULTY_CONFIGS[s.difficulty];
          const waveBonus = Math.round((32 + s.wave * 9) * diffCfg.rewardMult);
          s.energy += waveBonus;
          s.score += Math.round(s.wave * 150 * diffCfg.scoreMult);

          if (s.wave >= s.totalWaves) {
            s.outcome = 'victory';
            s.score += Math.round(s.coreHp * 90 * diffCfg.scoreMult);
            if (s.score > s.bestScore) {
              s.bestScore = Math.round(s.score);
              saveBestScore(s.bestScore);
            }
            syncHudFromSim();
            setGameState('gameover');
            playSynthFx('victory', soundEnabled, audioCtxRef);
            return;
          } else {
            s.nextWaveTimer = 10;
            setStatusNotice(`Hoàn thành Đợt ${s.wave}/${s.totalWaves}! (+${waveBonus}⚡) · Tự gọi Đợt ${s.wave + 1} sau 10s.`);
            syncHudFromSim();
          }
        }

        if (s.coreHp <= 0 && !s.outcome) {
          s.outcome = 'defeat';
          if (s.score > s.bestScore) {
            s.bestScore = Math.round(s.score);
            saveBestScore(s.bestScore);
          }
          syncHudFromSim();
          setGameState('gameover');
          playSynthFx('defeat', soundEnabled, audioCtxRef);
          return;
        }

        hudSyncAccum += dt;
        if (hudSyncAccum >= 0.1) {
          hudSyncAccum = 0;
          syncHudFromSim();
        }
      }

      // === RENDER CANVAS ===
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
            canvas.width = CANVAS_WIDTH * dpr;
            canvas.height = CANVAS_HEIGHT * dpr;
          }
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          const shakeAmt = s.shakeTrauma * s.shakeTrauma * 10;
          const sx = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
          const sy = shakeAmt > 0.2 ? (Math.random() * 2 - 1) * shakeAmt : 0;
          ctx.translate(sx, sy);

          const palette = BIOME_PALETTES[s.map.biome];

          // 1. Tactical Biome Arena Floor
          ctx.fillStyle = palette.bg;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // 2. Grid + Walls + Track Tiles
          for (let r = 0; r < s.map.rows; r++) {
            for (let c = 0; c < s.map.cols; c++) {
              const x = c * TILE_SIZE;
              const y = r * TILE_SIZE;
              const kind = getTileKind(s.map, c, r);

              if (kind === 'path' || kind === 'spawn' || kind === 'core') {
                ctx.fillStyle = palette.pathFill;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = palette.pathBorder;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
              } else if (kind === 'wall') {
                ctx.fillStyle = palette.wallFill;
                ctx.fillRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                ctx.strokeStyle = palette.wallStroke;
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
                ctx.beginPath();
                ctx.moveTo(x + 12, y + 12);
                ctx.lineTo(x + TILE_SIZE - 12, y + TILE_SIZE - 12);
                ctx.moveTo(x + TILE_SIZE - 12, y + 12);
                ctx.lineTo(x + 12, y + TILE_SIZE - 12);
                ctx.stroke();
              } else {
                ctx.strokeStyle = palette.gridLine;
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
                ctx.fillStyle = palette.gridLine;
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // 3. Animated Path Track Glow
          ctx.save();
          ctx.strokeStyle = palette.trackGlow;
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 8]);
          ctx.lineDashOffset = -s.animTime * 34;
          ctx.beginPath();
          s.map.path.forEach((wp, i) => {
            const pt = gridToWorldCenter(wp.col, wp.row);
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.restore();

          // 4. Spawn Portal & Armored Core Reactor
          const spawnPt = gridToWorldCenter(s.map.path[0].col, s.map.path[0].row);
          const corePt = gridToWorldCenter(
            s.map.path[s.map.path.length - 1].col,
            s.map.path[s.map.path.length - 1].row
          );

          ctx.save();
          ctx.translate(spawnPt.x, spawnPt.y);
          ctx.rotate(s.animTime * 2);
          ctx.strokeStyle = '#FB7185';
          ctx.fillStyle = 'rgba(244, 63, 94, 0.24)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([8, 5]);
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = '#FECDD3';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('CỔNG', spawnPt.x, spawnPt.y);

          const corePulse = 1 + Math.sin(s.animTime * 4) * 0.08;
          ctx.save();
          ctx.translate(corePt.x, corePt.y);
          ctx.rotate(-s.animTime * 1.4);
          ctx.strokeStyle = '#10B981';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const px = Math.cos(a) * 22 * corePulse;
            const py = Math.sin(a) * 22 * corePulse;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          ctx.fillStyle = '#A7F3D0';
          ctx.fillText('LÕI', corePt.x, corePt.y);

          // 5. Hover Range Ring & Placement Preview
          if (s.hoverTile && gameState === 'playing') {
            const hx = s.hoverTile.col * TILE_SIZE;
            const hy = s.hoverTile.row * TILE_SIZE;
            const hKind = getTileKind(s.map, s.hoverTile.col, s.hoverTile.row);
            const hasGun = s.guns.some(
              (g) => g.col === s.hoverTile!.col && g.row === s.hoverTile!.row
            );
            const hoverProfile = getGunCombatProfile(s.selectedTool, 1);
            ctx.save();
            ctx.strokeStyle = hasGun ? '#FBBF24' : hKind === 'empty' ? '#38BDF8' : '#F43F5E';
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 3, hy + 3, TILE_SIZE - 6, TILE_SIZE - 6);
            if (!hasGun && hKind === 'empty') {
              ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
              ctx.setLineDash([5, 5]);
              ctx.beginPath();
              ctx.arc(hx + TILE_SIZE / 2, hy + TILE_SIZE / 2, hoverProfile.rangePx, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.restore();
          }

          // 6. Shockwaves
          for (const sw of s.shockwaves) {
            ctx.save();
            ctx.globalAlpha = sw.alpha;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.lineWidth;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 7. Railgun Mach-Ring Hyper-Beams + Volumetric Flame Cones + Healer Tethers
          for (const rb of s.railBeams) {
            ctx.save();
            const rTier = rb.visualTier;
            ctx.globalAlpha = rb.alpha;
            ctx.lineCap = 'round';
            ctx.strokeStyle = rb.color;
            ctx.lineWidth = (16 + rTier * 4) * rb.alpha;
            ctx.beginPath();
            ctx.moveTo(rb.x1, rb.y1);
            ctx.lineTo(rb.x2, rb.y2);
            ctx.stroke();

            ctx.strokeStyle = rTier >= 3 ? '#FDE047' : '#E879F9';
            ctx.lineWidth = (7 + rTier * 2) * rb.alpha;
            ctx.beginPath();
            ctx.moveTo(rb.x1, rb.y1);
            ctx.lineTo(rb.x2, rb.y2);
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = (2.8 + rTier * 0.9) * rb.alpha;
            ctx.beginPath();
            ctx.moveTo(rb.x1, rb.y1);
            ctx.lineTo(rb.x2, rb.y2);
            ctx.stroke();

            const beamAngle = Math.atan2(rb.y2 - rb.y1, rb.x2 - rb.x1);
            const ringCount = 2 + rTier;
            for (let m = 1; m <= ringCount; m++) {
              const frac = 0.07 + m * 0.12;
              const rx = rb.x1 + (rb.x2 - rb.x1) * frac;
              const ry = rb.y1 + (rb.y2 - rb.y1) * frac;
              ctx.save();
              ctx.translate(rx, ry);
              ctx.rotate(beamAngle);
              ctx.strokeStyle = rTier >= 3 ? '#38BDF8' : '#FEF08A';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 5, (15 + rTier * 3 - m * 2) * (1.25 - rb.alpha * 0.4), 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
            ctx.restore();
          }

          for (const fc of s.flameCones) {
            const fTier = fc.visualTier;
            ctx.save();
            ctx.translate(fc.x, fc.y);
            ctx.rotate(fc.angle);
            ctx.globalAlpha = fc.alpha * 0.56;
            const outerGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, fc.range);
            if (fTier >= 3) {
              outerGrad.addColorStop(0, '#E0F2FE');
              outerGrad.addColorStop(0.45, '#38BDF8');
              outerGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
            } else {
              outerGrad.addColorStop(0, '#FDBA74');
              outerGrad.addColorStop(0.5, '#EA580C');
              outerGrad.addColorStop(1, 'rgba(190, 18, 60, 0)');
            }
            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, fc.range, -fc.halfArc, fc.halfArc);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = fc.alpha * 0.85;
            const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, fc.range * 0.68);
            innerGrad.addColorStop(0, '#FFFFFF');
            innerGrad.addColorStop(0.45, fTier >= 3 ? '#7DD3FC' : '#FEF08A');
            innerGrad.addColorStop(1, fTier >= 3 ? 'rgba(56, 189, 248, 0)' : 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, fc.range * 0.68, -fc.halfArc * 0.5, fc.halfArc * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          for (const hb of s.healBeams) {
            ctx.save();
            ctx.globalAlpha = hb.alpha;
            ctx.strokeStyle = '#4ADE80';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(hb.fromX, hb.fromY);
            ctx.lineTo(hb.toX, hb.toY);
            ctx.stroke();
            ctx.restore();
          }

          // 8. Placed Guns (Lv1 .. Lv10 Evolving Sprites)
          for (const gun of s.guns) {
            const pt = gridToWorldCenter(gun.col, gun.row);
            const isSelected = gun.id === s.selectedGunId;
            const profile = getGunCombatProfile(gun.type, gun.level);

            ctx.save();
            ctx.translate(pt.x, pt.y);
            if (isSelected) {
              ctx.strokeStyle = '#FBBF24';
              ctx.lineWidth = 2.2;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.arc(0, 0, 29, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(0, 0, profile.rangePx, 0, Math.PI * 2);
              ctx.stroke();
            }

            if (s.overdriveTimer > 0) {
              ctx.strokeStyle = 'rgba(251, 113, 133, 0.78)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, 25 + Math.sin(s.animTime * 10) * 1.6, 0, Math.PI * 2);
              ctx.stroke();
            }

            drawGunTurretSprite(ctx, gun.type, gun.level, gun.aimAngle, gun.recoil, s.animTime);
            ctx.restore();
          }

          // 9. Upgraded High-Detail Enemies
          for (const en of s.enemies) {
            drawEnemySprite(ctx, en, s.animTime);
          }

          // 10. Projectiles (Tracer Bolts, Shrapnel Pellets, Missiles, Singularity Mortars)
          for (const pr of s.projectiles) {
            ctx.save();
            ctx.translate(pr.x, pr.y);
            ctx.rotate(Math.atan2(pr.vy, pr.vx));
            if (pr.kind === 'mortar') {
              ctx.save();
              ctx.rotate(s.animTime * 12);
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 2.2;
              ctx.beginPath();
              ctx.ellipse(0, 0, 12, 5.5, 0, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
              ctx.fillStyle = '#070312';
              ctx.strokeStyle = '#C084FC';
              ctx.lineWidth = 2.6;
              ctx.beginPath();
              ctx.arc(0, 0, 7, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (pr.kind === 'missile' || pr.kind === 'bomblet') {
              const sc = pr.kind === 'bomblet' ? 0.72 : 1;
              ctx.scale(sc, sc);
              ctx.fillStyle = '#F97316';
              ctx.beginPath();
              ctx.moveTo(-6, -3);
              ctx.lineTo(-17 - Math.random() * 5, 0);
              ctx.lineTo(-6, 3);
              ctx.closePath();
              ctx.fill();

              ctx.fillStyle = '#FB7185';
              ctx.strokeStyle = '#FDE047';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.moveTo(10, 0);
              ctx.lineTo(-7, -4.5);
              ctx.lineTo(-4, 0);
              ctx.lineTo(-7, 4.5);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else if (pr.kind === 'pellet') {
              ctx.fillStyle = pr.color;
              ctx.beginPath();
              ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath();
              ctx.arc(1, 0, 1.5, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillStyle = pr.color;
              ctx.globalAlpha = 0.45;
              ctx.fillRect(-16, -2.5, 16, 5);
              ctx.globalAlpha = 1;
              ctx.fillRect(-6, -2, 13, 4);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(-1, -1, 8, 2);
            }
            ctx.restore();
          }

          // 11. Muzzle Flashes
          for (const mf of s.muzzleFlashes) {
            ctx.save();
            ctx.globalAlpha = mf.alpha;
            ctx.translate(mf.x, mf.y);
            ctx.rotate(mf.angle);
            ctx.fillStyle = mf.color;
            ctx.beginPath();
            ctx.moveTo(mf.radius * 1.4, 0);
            ctx.lineTo(2, -mf.radius * 0.45);
            ctx.lineTo(0, -mf.radius * 0.9);
            ctx.lineTo(-3, 0);
            ctx.lineTo(0, mf.radius * 0.9);
            ctx.lineTo(2, mf.radius * 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(2, 0, mf.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 12. Chain Lightning
          for (const arc of s.lightningArcs) {
            if (arc.points.length < 2) continue;
            ctx.save();
            ctx.globalAlpha = arc.alpha;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = arc.color;
            ctx.lineWidth = arc.width * 2.4;
            ctx.beginPath();
            ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) {
              ctx.lineTo(arc.points[i].x, arc.points[i].y);
            }
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = arc.width * 0.7;
            ctx.beginPath();
            ctx.moveTo(arc.points[0].x, arc.points[0].y);
            for (let i = 1; i < arc.points.length; i++) {
              ctx.lineTo(arc.points[i].x, arc.points[i].y);
            }
            ctx.stroke();
            ctx.restore();
          }

          // 13. Particles
          for (const p of s.particles) {
            if (!p.active) continue;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // 14. Floating Combat Text
          for (const ft of s.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `bold ${Math.round(11 * ft.scale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#070B14';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }
        }
      }

      rafId = window.requestAnimationFrame(tickAndDraw);
    };

    rafId = window.requestAnimationFrame(tickAndDraw);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState, recomputeFirepower, syncHudFromSim, emitParticles, pushCombatText, soundEnabled]);

  const selectedGun = useMemo(() => {
    if (!selectedGunId) return null;
    return simRef.current.guns.find((g) => g.id === selectedGunId) ?? null;
  }, [selectedGunId, hud.selectedGunVersion, hud.energy, hud.wave]);

  const selectedProfile = selectedGun ? getGunCombatProfile(selectedGun.type, selectedGun.level) : null;
  const selectedSpec = selectedGun ? getGunCatalogItem(selectedGun.type) : null;
  const selectedUpgradeCost = selectedGun ? getGunUpgradeCost(selectedGun.type, selectedGun.level) : null;
  const selectedSellRefund = selectedGun ? getGunSellRefund(selectedGun) : 0;

  return (
    <section
      id="prism-td-section"
      aria-label="Thủ Thành Pháo Đài — Thuần Súng Nâng Cấp Lv10"
      data-theme={theme}
      className="relative rounded-2xl border border-[#DCE6F2] dark:border-[#1E2E4A] bg-[#070B14] text-[#F1F5F9] shadow-[0_20px_50px_-24px_rgba(56,189,248,0.22)] overflow-hidden"
    >
      {/* TITLE SCREEN */}
      {gameState === 'title' && (
        <div className="p-4 sm:p-6 lg:p-7 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center shrink-0">
                  <Crosshair className="w-6 h-6 text-amber-300" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-[2.15rem] font-bold tracking-tight text-white leading-tight">
                    Thủ Thành Pháo Đài Lv10
                  </h1>
                  <p className="text-xs sm:text-sm text-sky-300/90 font-mono">
                    4 Cấp Độ · 16 Màn Dài (15–41 Đợt) · 8 Súng Thuần Max Lv10
                    {hud.bestScore > 0 ? ` · Kỷ lục: ${hud.bestScore}đ` : ''}
                  </p>
                </div>
              </div>

              {/* 4 Difficulty Tiers Selector */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Cấp Độ Thử Thách (4 Cấp: Dễ → Địa Ngục)
                </p>
                <div
                  role="radiogroup"
                  aria-label="Chọn cấp độ thử thách"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                  {DIFFICULTY_ORDER.map((diffId) => {
                    const cfg = DIFFICULTY_CONFIGS[diffId];
                    const selected = difficulty === diffId;
                    return (
                      <button
                        key={diffId}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-testid={`td-diff-${diffId}`}
                        onClick={() => setDifficulty(diffId)}
                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                        style={
                          selected
                            ? { borderColor: cfg.badgeColor, boxShadow: `0 0 0 1px ${cfg.badgeColor}` }
                            : undefined
                        }
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-xs font-bold tracking-wide"
                            style={{ color: cfg.badgeColor }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ×{cfg.hpMult} HP
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                          +{cfg.extraWaves} Đợt · ×{cfg.scoreMult} Điểm
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-mono text-slate-300 bg-[#0B1222] border border-slate-800 rounded-lg px-2.5 py-1.5 tabular-nums">
                  <span style={{ color: DIFFICULTY_CONFIGS[difficulty].badgeColor }} className="font-bold">
                    {DIFFICULTY_CONFIGS[difficulty].label}:
                  </span>{' '}
                  {DIFFICULTY_CONFIGS[difficulty].description} · Thông số trận:{' '}
                  <strong className="text-cyan-300">{effectiveSetup.totalWaves} Đợt</strong> ·{' '}
                  <strong className="text-emerald-300">{effectiveSetup.startCoreHp} HP Lõi</strong> ·{' '}
                  <strong className="text-amber-300">{effectiveSetup.startEnergy}⚡</strong>
                </p>
              </div>

              {/* Map Selection (16 Biome Maps across 4 Tiers) */}
              <div className="space-y-2">
                <p className="text-xs font-mono uppercase tracking-[0.12em] text-slate-400">
                  Chọn Chiến Trường ({PRISM_MAPS.length} Màn · Dễ 1–4 · Trung Bình 5–8 · Khó 9–12 · Địa Ngục 13–16)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[212px] overflow-y-auto pr-1">
                  {PRISM_MAPS.map((m, idx) => {
                    const active = idx === selectedMapIndex;
                    const accent = BIOME_PALETTES[m.biome].accent;
                    const mapDiffCfg = DIFFICULTY_CONFIGS[m.recommendedDifficulty];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMapIndex(idx)}
                        className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'border-amber-400 bg-amber-950/35 text-white'
                            : 'border-slate-700/80 bg-[#0F172A] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className="text-[10px] font-mono font-semibold truncate"
                            style={{ color: mapDiffCfg.badgeColor }}
                          >
                            {m.difficultyLabel}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: accent }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="text-[11px] font-bold mt-0.5 truncate">{m.name}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  <strong className="text-slate-200">{activeMap.name}:</strong> {activeMap.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startNewRun(selectedMapIndex, difficulty)}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm sm:text-base transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    Vào Trận · {DIFFICULTY_CONFIGS[difficulty].label} ({effectiveSetup.totalWaves} Đợt)
                  </span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-700/80 bg-[#0B1222] p-3 space-y-2.5">
                <canvas
                  ref={titleCanvasRef}
                  aria-label="Mô phỏng pháo đài súng Lv10 giao tranh Boss"
                  className="w-full h-auto rounded-lg block border border-slate-800"
                />
                <p className="text-xs text-slate-400 text-center">
                  Mỗi khẩu súng tiến hóa hình dạng &amp; kỹ năng riêng từ <strong className="text-amber-300">Lv1 → Lv10 MAX</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3 text-center">
            Phím 1-8 chọn Súng · Nhấp ô trống để đặt · Nhấp súng chọn &amp; bấm U để nâng cấp tới Lv10 · T đổi mục tiêu · Space Quá Tải Hỏa Lực
          </p>
        </div>
      )}

      {/* PLAYING / PAUSED SHELL */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="relative">
          {/* Top Unified HUD Strip */}
          <div className="border-b border-slate-800 bg-[#0B1222] px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 tabular-nums">
              <div
                data-testid="td-hud-difficulty"
                className="px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold tracking-wider uppercase"
                style={{
                  color: DIFFICULTY_CONFIGS[hud.difficulty].badgeColor,
                  borderColor: DIFFICULTY_CONFIGS[hud.difficulty].badgeColor,
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                }}
              >
                {DIFFICULTY_CONFIGS[hud.difficulty].shortLabel}
              </div>

              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 leading-none">LÕI</div>
                  <div className="text-sm sm:text-base font-bold text-white leading-tight">
                    {hud.coreHp}/{hud.maxCoreHp}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <div>
                  <div className="text-[10px] font-mono text-slate-400 leading-none">NĂNG LƯỢNG</div>
                  <div className="text-sm sm:text-base font-bold text-amber-300 leading-tight">
                    {hud.energy}⚡
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono text-slate-400 leading-none">ĐỢT</div>
                <div className="text-sm sm:text-base font-bold text-cyan-300 leading-tight">
                  {hud.wave}/{hud.totalWaves}
                </div>
              </div>

              <div className="hidden sm:block">
                <div className="text-[10px] font-mono text-slate-400 leading-none">HỎA LỰC</div>
                <div className="text-sm sm:text-base font-bold text-sky-300 leading-tight">
                  {hud.totalDps} DPS
                </div>
              </div>

              <div className="hidden md:block">
                <div className="text-[10px] font-mono text-slate-400 leading-none">ĐIỂM</div>
                <div className="text-sm sm:text-base font-bold text-white leading-tight">
                  {hud.score}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={activateOverdrive}
                disabled={hud.overdrivePct < 100 || hud.overdriveActive}
                title="Kích hoạt Hội Tụ Hỏa Lực ×2.0 (Space)"
                className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                  hud.overdriveActive
                    ? 'bg-rose-600 border-rose-400 text-white'
                    : hud.overdrivePct >= 100
                      ? 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-[#070B14]'
                      : 'bg-slate-900 border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {hud.overdriveActive ? 'ĐANG QUÁ TẢI!' : `Hỏa Lực ${hud.overdrivePct}%`}
                </span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                data-testid="td-speed-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  simRef.current.speedMult =
                    simRef.current.speedMult === 1 ? 2 : simRef.current.speedMult === 2 ? 3 : 1;
                  syncHudFromSim();
                }}
                aria-label="Đổi tốc độ mô phỏng (1x, 2x, 3x)"
                className={`h-8 sm:h-9 px-2.5 rounded-lg border text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer ${
                  hud.speedMult === 3
                    ? 'bg-amber-400 text-[#070B14] border-amber-300'
                    : hud.speedMult === 2
                      ? 'bg-cyan-500 text-[#070B14] border-cyan-400'
                      : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{hud.speedMult}×</span>
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSoundEnabled((p) => !p);
                }}
                aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
                }}
                aria-label={gameState === 'paused' ? 'Đóng tạm dừng' : 'Tạm dừng'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
              </button>

              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  startNewRun(selectedMapIndex, difficulty);
                }}
                aria-label="Chơi lại ván này"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-slate-700 bg-slate-900 text-slate-200 flex items-center justify-center hover:border-cyan-400 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Arena Canvas */}
          <div className="p-1.5 sm:p-2 bg-[#050811]">
            <div className="max-w-[590px] mx-auto">
              <canvas
                ref={canvasRef}
                data-testid="prism-td-canvas"
                aria-label="Bản đồ Thủ Thành Pháo Đài 12x8"
                onPointerMove={handleCanvasPointerMove}
                onPointerLeave={handleCanvasPointerLeave}
                onClick={handleCanvasClick}
                onContextMenu={handleCanvasContextMenu}
                className="w-full h-auto aspect-[3/2] rounded-xl border border-slate-800 block cursor-crosshair select-none touch-manipulation"
              />
            </div>
          </div>

          {/* 8 Pure Gun Arsenal Dock + Lv1..10 Inspector */}
          <div className="border-t border-slate-800 bg-[#0B1222] px-3 sm:px-4 py-2 space-y-1.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {GUN_CATALOG.map((item) => {
                const isActive = selectedTool === item.type;
                const canAfford = hud.energy >= item.cost;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      setSelectedTool(item.type);
                    }}
                    className={`px-2 py-1 rounded-xl border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-amber-950/50 border-amber-400 text-white'
                        : 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                      <span className="truncate">
                        [{item.hotkey}] {item.shortName}
                      </span>
                      <span className={`font-mono shrink-0 ${canAfford ? 'text-amber-300' : 'text-rose-400'}`}>
                        {item.cost}⚡
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{item.roleClue}</p>
                  </button>
                );
              })}
            </div>

            {/* Selected Gun Lv1..10 Upgrade & Skill Panel */}
            {selectedGun && selectedProfile && selectedSpec && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/95 p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white">{selectedSpec.name}</span>
                    <span
                      data-testid="td-gun-level-badge"
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        selectedGun.level === MAX_GUN_LEVEL
                          ? 'bg-amber-400 text-[#070B14]'
                          : selectedGun.level >= 7
                            ? 'bg-rose-500/20 border border-rose-400/50 text-rose-200'
                            : selectedGun.level >= 4
                              ? 'bg-sky-500/20 border border-sky-400/50 text-sky-200'
                              : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Lv.{selectedGun.level}/{MAX_GUN_LEVEL} · {selectedProfile.tierLabel}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 tabular-nums">
                      DMG {selectedProfile.damage} · DPS {selectedProfile.dpsEstimate} · Tầm {selectedProfile.rangeTiles} · Hạ {selectedGun.kills}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {selectedSpec.milestones.map((ms) => {
                      const unlocked = selectedGun.level >= ms.level;
                      return (
                        <span
                          key={ms.level}
                          title={ms.summary}
                          className={`px-1.5 py-0.5 rounded border font-mono ${
                            unlocked
                              ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                              : 'border-slate-700 bg-slate-950/60 text-slate-500'
                          }`}
                        >
                          Lv{ms.level}: {ms.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      cycleSelectedPriority();
                    }}
                    title="Đổi ưu tiên mục tiêu [T]"
                    className="h-8 px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:border-cyan-400 text-cyan-200 text-xs font-mono cursor-pointer"
                  >
                    [T] {PRIORITY_LABELS[selectedGun.priority]}
                  </button>
                  <button
                    type="button"
                    data-testid="td-upgrade-btn"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      upgradeSelectedGun();
                    }}
                    disabled={selectedUpgradeCost === null || hud.energy < selectedUpgradeCost}
                    className={`h-8 px-3 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      selectedUpgradeCost === null
                        ? 'bg-amber-400/20 border border-amber-400 text-amber-300 cursor-default'
                        : hud.energy >= selectedUpgradeCost
                          ? 'bg-amber-400 text-[#070B14] hover:bg-amber-300'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {selectedUpgradeCost === null
                      ? 'MAX LV 10'
                      : `[U] Nâng Lv${selectedGun.level + 1} (${selectedUpgradeCost}⚡)`}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      sellSelectedGun();
                    }}
                    aria-label="Thu hồi trụ súng"
                    className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>+{selectedSellRefund}⚡</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-lg">
                {statusNotice || `${activeMap.name} · Bấm vào ô trống đặt súng hoặc bấm vào súng để nâng Lv1→Lv10.`}
              </p>

              <button
                type="button"
                data-testid="prism-wave-btn"
                onClick={launchNextWave}
                disabled={hud.waveActive || hud.wave >= hud.totalWaves}
                className={`min-h-[40px] px-4 py-1.5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  hud.waveActive
                    ? 'bg-slate-800 text-slate-300 border border-slate-700 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-[#070B14]'
                }`}
              >
                <Play className="w-4 h-4 shrink-0" />
                <span>
                  {hud.waveActive
                    ? `Đang giao tranh Đợt ${hud.wave}/${hud.totalWaves}...`
                    : `Gọi Đợt ${hud.wave + 1}/${hud.totalWaves} (Tự gọi: ${hud.nextWaveCountdown}s)`}
                </span>
              </button>
            </div>
          </div>

          {/* PAUSED MODAL */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-[#070B14]/90 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl border border-amber-500/50 bg-[#0F172A] p-6 text-center space-y-4">
                <h2 className="font-serif text-xl font-bold text-white">Tạm Dừng Pháo Đài</h2>
                <p className="text-xs font-mono text-slate-300 tabular-nums">
                  {activeMap.name} · {DIFFICULTY_CONFIGS[hud.difficulty].label} · Đợt {hud.wave}/{hud.totalWaves} · Điểm {hud.score}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setGameState('playing')}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm cursor-pointer"
                  >
                    Tiếp Tục Chiến Đấu
                  </button>
                  <button
                    type="button"
                    onClick={() => startNewRun(selectedMapIndex, difficulty)}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-slate-700 text-slate-200 text-sm font-medium hover:border-amber-400 cursor-pointer"
                  >
                    Chơi Lại Màn Này
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameState('title')}
                    className="min-h-[44px] w-full px-4 py-2 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:text-white cursor-pointer"
                  >
                    Chọn Màn Chơi Khác
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GAMEOVER / VICTORY MODAL */}
      {gameState === 'gameover' && (
        <div className="p-6 sm:p-10 text-center max-w-xl mx-auto space-y-5">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
              hud.outcome === 'victory'
                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-950/70 text-rose-400 border border-rose-500/40'
            }`}
          >
            {hud.outcome === 'victory' ? <Trophy className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-amber-300 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {hud.outcome === 'victory' ? 'BẢO VỆ LÕI THÀNH CÔNG' : 'LÕI PHÁO ĐÀI THẤT THỦ'} ·{' '}
                {DIFFICULTY_CONFIGS[hud.difficulty].shortLabel}
              </span>
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {hud.outcome === 'victory'
                ? `Chiến Thắng ${activeMap.name}!`
                : `Thất Thủ Tại Đợt ${hud.wave}/${hud.totalWaves}`}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-slate-800 bg-[#0F172A] p-4 font-mono tabular-nums">
            <div>
              <p className="text-[11px] text-slate-400">Đợt</p>
              <p className="text-base font-bold text-cyan-300">
                {hud.wave}/{hud.totalWaves}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Quái Hạ</p>
              <p className="text-base font-bold text-amber-300">{hud.kills}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Điểm</p>
              <p className="text-base font-bold text-white">{hud.score}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Kỷ Lục</p>
              <p className="text-base font-bold text-emerald-400">{hud.bestScore}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={() => startNewRun(selectedMapIndex, difficulty)}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#070B14] font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi Lại</span>
            </button>
            <button
              type="button"
              onClick={() => setGameState('title')}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-700 bg-[#0F172A] text-sm font-medium text-slate-200 hover:border-amber-400 cursor-pointer"
            >
              Chọn Màn Khác
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
