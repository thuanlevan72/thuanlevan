import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Coins,
  FlipHorizontal,
  Gift,
  Home,
  PackageOpen,
  RotateCcw,
  Scissors,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BLIND_BOX_PACKS,
  computeTearProgress,
  DANGER_LINE_Y,
  JAR_H,
  JAR_W,
  ROOM_COLLECTIBLES,
  ROOM_H,
  ROOM_W,
  rollBlindBoxDrop,
  SQUISHY_TIERS,
  stepSquishyPhysics,
  type BlindBoxPackDef,
  type BlindBoxRollResult,
  type PlacedRoomDecor,
  type RoomCollectibleDef,
  type SquishyBody,
} from '../utils/blindBoxMergeEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface BlindBoxMergeGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type StudioSubTab = 'merge' | 'gacha' | 'room';

interface SavedBlindBoxProfile {
  coins: number;
  bestScore: number;
  unlockedIds: string[];
  placedRoom: PlacedRoomDecor[];
}

const STORAGE_KEY = 'thuanle-blindbox-merge-v1';

function loadProfile(): SavedBlindBoxProfile {
  if (typeof window === 'undefined') {
    return { coins: 120, bestScore: 0, unlockedIds: [], placedRoom: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { coins: 120, bestScore: 0, unlockedIds: [], placedRoom: [] };
    const p = JSON.parse(raw) as Partial<SavedBlindBoxProfile>;
    return {
      coins: typeof p.coins === 'number' ? p.coins : 120,
      bestScore: typeof p.bestScore === 'number' ? p.bestScore : 0,
      unlockedIds: Array.isArray(p.unlockedIds)
        ? p.unlockedIds.filter((s): s is string => typeof s === 'string')
        : [],
      placedRoom: Array.isArray(p.placedRoom) ? p.placedRoom : [],
    };
  } catch {
    return { coins: 120, bestScore: 0, unlockedIds: [], placedRoom: [] };
  }
}

function saveProfile(profile: SavedBlindBoxProfile) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

// ---------------------------------------------------------------------------
// Synthesized ASMR & Blind-Box Audio FX (Web Audio API)
// ---------------------------------------------------------------------------
type CuteSfx = 'drop' | 'merge' | 'crinkle' | 'reveal' | 'secret' | 'place';

const crinkleBufferCache = new WeakMap<AudioContext, AudioBuffer>();

function playCuteSfx(
  ctx: AudioContext | null,
  kind: CuteSfx,
  muted: boolean,
  comboLevel = 1
) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;

  if (kind === 'drop') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    return;
  }

  if (kind === 'merge') {
    // ASMR bubble "Bộp!" ascending by combo
    const base = 360 + Math.min(6, comboLevel) * 55;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(base * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.6, now + 0.075);
    g.gain.setValueAtTime(0.11, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    return;
  }

  if (kind === 'crinkle') {
    // Cached filtered noise burst like tearing holographic foil paper
    let buffer = crinkleBufferCache.get(ctx);
    if (!buffer || buffer.sampleRate !== ctx.sampleRate) {
      const bufSize = Math.floor(ctx.sampleRate * 0.045);
      buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      }
      crinkleBufferCache.set(ctx, buffer);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400 + Math.random() * 1200, now);
    filter.Q.setValueAtTime(1.8, now);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(now);
    return;
  }

  if (kind === 'reveal' || kind === 'secret') {
    const notes =
      kind === 'secret'
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
        : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      const t = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
    return;
  }

  if (kind === 'place') {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.05);
    g.gain.setValueAtTime(0.07, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

// ---------------------------------------------------------------------------
// Procedural Kawaii Squishy Renderer on Canvas 2D
// ---------------------------------------------------------------------------
function drawKawaiiSquishy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tierIdx: number,
  scaleX: number,
  scaleY: number,
  flash: number = 0
) {
  const def = SQUISHY_TIERS[tierIdx] ?? SQUISHY_TIERS[0];
  const r = def.radius;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, scaleY);

  // Outer ears / accessories behind body
  ctx.strokeStyle = '#52433B';
  ctx.lineWidth = Math.max(1.6, r * 0.055);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (def.face === 'bunny') {
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * r * 0.42, -r * 0.92);
      ctx.rotate(dir * 0.2);
      ctx.fillStyle = def.fillColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.24, r * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#F7C6D6';
      ctx.beginPath();
      ctx.ellipse(0, 2, r * 0.12, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (def.face === 'kitty' || def.face === 'fox' || def.face === 'shiba') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = def.fillColor;
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.3, -r * 0.85);
      ctx.lineTo(dir * r * 0.72, -r * 1.15);
      ctx.lineTo(dir * r * 0.82, -r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (def.face === 'panda' || def.face === 'capybara_king') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = def.face === 'panda' ? '#4A403A' : '#B98962';
      ctx.beginPath();
      ctx.arc(dir * r * 0.62, -r * 0.72, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (def.face === 'froggy') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = def.fillColor;
      ctx.beginPath();
      ctx.arc(dir * r * 0.45, -r * 0.78, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Main Chubby Circle Body
  const grad = ctx.createRadialGradient(-r * 0.28, -r * 0.3, r * 0.15, 0, 0, r);
  grad.addColorStop(0, def.highlightColor);
  grad.addColorStop(0.55, def.fillColor);
  grad.addColorStop(1, def.fillColor);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Merge Flash Glow
  if (flash > 0.02) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${flash * 0.9})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r + (1 - flash) * 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Jelly Gloss Highlight Arc
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, -Math.PI * 0.82, -Math.PI * 0.52);
  ctx.stroke();

  // Tangerine hat on Capybara King!
  if (def.face === 'capybara_king') {
    ctx.fillStyle = '#FB923C';
    ctx.beginPath();
    ctx.arc(0, -r * 1.05, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.ellipse(r * 0.08, -r * 1.28, r * 0.11, r * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(244, 114, 142, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.44, r * 0.12, r * 0.17, r * 0.1, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.44, r * 0.12, r * 0.17, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Kawaii Expressions
  ctx.fillStyle = '#4A3B34';
  ctx.strokeStyle = '#4A3B34';
  ctx.lineWidth = Math.max(1.5, r * 0.06);

  if (def.face === 'sleepy_uwu') {
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(dir * r * 0.3, -r * 0.05, r * 0.11, 0, Math.PI);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(-r * 0.07, r * 0.12, r * 0.07, 0, Math.PI);
    ctx.arc(r * 0.07, r * 0.12, r * 0.07, 0, Math.PI);
    ctx.stroke();
  } else if (def.face === 'capybara_king') {
    // Chill flat zen eyes
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * r * 0.2, -r * 0.12);
      ctx.lineTo(dir * r * 0.42, -r * 0.12);
      ctx.stroke();
    }
    ctx.fillStyle = '#B98962';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.14, r * 0.24, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, r * 0.04);
    ctx.lineTo(0, r * 0.18);
    ctx.stroke();
  } else if (def.face === 'froggy') {
    for (const dir of [-1, 1]) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(dir * r * 0.45, -r * 0.78, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4A3B34';
      ctx.beginPath();
      ctx.arc(dir * r * 0.45, -r * 0.78, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, r * 0.04, r * 0.26, 0.15, Math.PI - 0.15);
    ctx.stroke();
  } else {
    // Panda dark eye patches
    if (def.face === 'panda') {
      ctx.fillStyle = '#4A403A';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(dir * r * 0.3, -r * 0.08, r * 0.18, r * 0.22, dir * 0.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glossy eyes
    for (const dir of [-1, 1]) {
      const ex = dir * r * 0.3;
      const ey = -r * 0.08;
      if (def.face === 'fox' && dir === 1) {
        // Cheeky wink
        ctx.beginPath();
        ctx.arc(ex, ey + 2, r * 0.1, Math.PI, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = def.face === 'panda' ? '#FFFFFF' : '#4A3B34';
        ctx.beginPath();
        ctx.arc(ex, ey, r * 0.11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex - r * 0.03, ey - r * 0.03, r * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Mouth / Beak
    if (def.face === 'chirpy') {
      ctx.fillStyle = '#FB923C';
      ctx.beginPath();
      ctx.moveTo(0, r * 0.02);
      ctx.lineTo(r * 0.13, r * 0.12);
      ctx.lineTo(0, r * 0.22);
      ctx.lineTo(-r * 0.13, r * 0.12);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(-r * 0.07, r * 0.1, r * 0.07, 0, Math.PI);
      ctx.arc(r * 0.07, r * 0.1, r * 0.07, 0, Math.PI);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Collectible Room Furniture SVG Renderer
// ---------------------------------------------------------------------------
function renderRoomItemSvg(def: RoomCollectibleDef) {
  const { primaryColor: c1, secondaryColor: c2, width: w, height: h, shape } = def;
  const hw = w / 2;
  const hh = h / 2;
  const st = '#52433B';

  switch (shape) {
    case 'mushroom_lamp':
    case 'crystal_mushroom':
      return (
        <g>
          {shape === 'crystal_mushroom' && (
            <circle cx={0} cy={-8} r={hw + 4} fill="#FDE68A" opacity={0.28} />
          )}
          <rect x={-10} y={-2} width={20} height={hh} rx={8} fill={c2} stroke={st} strokeWidth={1.8} />
          <path
            d={`M ${-hw + 4} 4 Q 0 ${-hh - 8} ${hw - 4} 4 Z`}
            fill={c1}
            stroke={st}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <circle cx={-12} cy={-12} r={4.5} fill="#FFFFFF" opacity={0.8} />
          <circle cx={10} cy={-18} r={3.5} fill="#FFFFFF" opacity={0.8} />
          <circle cx={14} cy={-5} r={3} fill="#FFFFFF" opacity={0.8} />
        </g>
      );

    case 'fluffy_rug':
      return (
        <g>
          <ellipse cx={0} cy={0} rx={hw - 4} ry={hh - 4} fill={c1} stroke={st} strokeWidth={1.8} />
          <ellipse cx={0} cy={0} rx={hw - 18} ry={hh - 12} fill={c2} opacity={0.6} />
        </g>
      );

    case 'cactus_pot':
      return (
        <g>
          <path d={`M -16 8 L 16 8 L 12 ${hh - 3} L -12 ${hh - 3} Z`} fill={c2} stroke={st} strokeWidth={1.8} />
          <rect x={-19} y={3} width={38} height={7} rx={3} fill={c2} stroke={st} strokeWidth={1.6} />
          <rect x={-11} y={-hh + 10} width={22} height={hh - 4} rx={11} fill={c1} stroke={st} strokeWidth={1.8} />
          <circle cx={0} cy={-hh + 9} r={5} fill="#F48FB1" stroke={st} strokeWidth={1.4} />
        </g>
      );

    case 'oak_bookshelf':
      return (
        <g>
          <rect x={-hw + 2} y={-hh + 2} width={w - 4} height={h - 4} rx={8} fill={c1} stroke={st} strokeWidth={2} />
          <rect x={-hw + 10} y={-hh + 12} width={w - 20} height={46} rx={4} fill="#FFFDF9" stroke={st} strokeWidth={1.4} />
          <rect x={-hw + 10} y={4} width={w - 20} height={48} rx={4} fill="#FFFDF9" stroke={st} strokeWidth={1.4} />
          <rect x={-36} y={-hh + 22} width={12} height={34} rx={2} fill="#F4A28C" stroke={st} strokeWidth={1.2} />
          <rect x={-22} y={-hh + 18} width={12} height={38} rx={2} fill={c2} stroke={st} strokeWidth={1.2} />
          <rect x={-8} y={-hh + 25} width={12} height={31} rx={2} fill="#DCD0F7" stroke={st} strokeWidth={1.2} />
          <circle cx={18} cy={32} r={11} fill="#B9E2C6" stroke={st} strokeWidth={1.4} />
        </g>
      );

    case 'toast_pillow':
      return (
        <g>
          <rect x={-hw + 6} y={-hh + 10} width={w - 12} height={h - 14} rx={10} fill={c2} stroke={st} strokeWidth={1.8} />
          <circle cx={-12} cy={-hh + 14} r={15} fill={c2} stroke={st} strokeWidth={1.6} />
          <circle cx={12} cy={-hh + 14} r={15} fill={c2} stroke={st} strokeWidth={1.6} />
          <rect x={-hw + 11} y={-hh + 14} width={w - 22} height={h - 22} rx={7} fill={c1} />
          <circle cx={-9} cy={2} r={2.2} fill={st} />
          <circle cx={9} cy={2} r={2.2} fill={st} />
          <path d="M -4 6 Q 0 10 4 6" fill="none" stroke={st} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      );

    case 'cloud_frame':
      return (
        <g>
          <rect x={-hw + 2} y={-hh + 2} width={w - 4} height={h - 4} rx={8} fill="#E7D3BC" stroke={st} strokeWidth={1.8} />
          <rect x={-hw + 9} y={-hh + 9} width={w - 18} height={h - 18} rx={4} fill={c2} stroke={st} strokeWidth={1.3} />
          <circle cx={-8} cy={4} r={11} fill={c1} />
          <circle cx={6} cy={0} r={13} fill="#FFFFFF" />
          <circle cx={16} cy={6} r={9} fill={c1} />
        </g>
      );

    case 'beanbag_chair':
      return (
        <g>
          <path
            d={`M ${-hw + 12} ${hh - 6} Q ${-hw} 0 -18 ${-hh + 8} Q 0 ${-hh + 2} 18 ${-hh + 8} Q ${hw} 0 ${hw - 12} ${hh - 6} Q 0 ${hh} ${-hw + 12} ${hh - 6} Z`}
            fill={c1}
            stroke={st}
            strokeWidth={2}
          />
          <ellipse cx={0} cy={12} rx={hw - 18} ry={18} fill={c2} opacity={0.45} />
        </g>
      );

    case 'milk_table':
      return (
        <g>
          <line x1={-32} y1={4} x2={-38} y2={hh - 4} stroke={c2} strokeWidth={6} strokeLinecap="round" />
          <line x1={32} y1={4} x2={38} y2={hh - 4} stroke={c2} strokeWidth={6} strokeLinecap="round" />
          <ellipse cx={0} cy={-4} rx={hw - 4} ry={18} fill={c1} stroke={st} strokeWidth={1.8} />
          <rect x={-10} y={-20} width={16} height={14} rx={4} fill="#F8BBD0" stroke={st} strokeWidth={1.3} />
        </g>
      );

    case 'vinyl_player':
      return (
        <g>
          <rect x={-hw + 4} y={-hh + 4} width={w - 8} height={h - 8} rx={8} fill={c1} stroke={st} strokeWidth={1.8} />
          <circle cx={-10} cy={0} r={18} fill={c2} stroke={st} strokeWidth={1.4} />
          <circle cx={-10} cy={0} r={6} fill="#F8BBD0" />
          <line x1={22} y1={-14} x2={10} y2={4} stroke="#FFFDF9" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );

    case 'fairy_lights':
      return (
        <g>
          <path
            d={`M ${-hw + 6} -12 Q ${-hw / 2} 14 0 -8 Q ${hw / 2} 14 ${hw - 6} -12`}
            fill="none"
            stroke={c2}
            strokeWidth={2}
          />
          {[-90, -45, 0, 45, 90].map((lx, idx) => (
            <g key={lx} transform={`translate(${lx}, ${idx % 2 === 0 ? -4 : 6})`}>
              <circle r={9} fill={c1} opacity={0.35} />
              <circle r={4.5} fill={c1} stroke={st} strokeWidth={1.2} />
            </g>
          ))}
        </g>
      );

    case 'capybara_throne':
      return (
        <g>
          <circle cx={-34} cy={-26} r={12} fill="#B98962" stroke={st} strokeWidth={1.8} />
          <circle cx={34} cy={-26} r={12} fill="#B98962" stroke={st} strokeWidth={1.8} />
          <ellipse cx={0} cy={6} rx={hw - 10} ry={hh - 14} fill={c1} stroke={st} strokeWidth={2} />
          <circle cx={0} cy={-44} r={11} fill="#FB923C" stroke={st} strokeWidth={1.6} />
          <ellipse cx={0} cy={22} rx={hw - 22} ry={16} fill="#FFF3E0" stroke={st} strokeWidth={1.5} />
          <line x1={-22} y1={-8} x2={-10} y2={-8} stroke={st} strokeWidth={2} strokeLinecap="round" />
          <line x1={10} y1={-8} x2={22} y2={-8} stroke={st} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function BlindBoxMergeGameSection({ theme }: BlindBoxMergeGameSectionProps) {
  const isDark = theme === 'dark';
  const [subTab, setSubTab] = useState<StudioSubTab>('merge');
  const [profile, setProfile] = useState<SavedBlindBoxProfile>(() => loadProfile());
  const [muted, setMuted] = useState<boolean>(false);

  // Physics Jar State
  const [score, setScore] = useState<number>(0);
  const [comboText, setComboText] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [currentTier, setCurrentTier] = useState<number>(() => Math.floor(Math.random() * 3));
  const [nextTier, setNextTier] = useState<number>(() => Math.floor(Math.random() * 4));
  const [aimX, setAimX] = useState<number>(JAR_W / 2);

  // Interactive Blind Box Tear State
  const [activePack, setActivePack] = useState<BlindBoxPackDef | null>(null);
  const [tearProgress, setTearProgress] = useState<number>(0);
  const [revealedDrop, setRevealedDrop] = useState<BlindBoxRollResult | null>(null);
  const tearStartRef = useRef<number | null>(null);
  const lastCrinkleRef = useRef<number>(0);

  // Mini Room State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState<string>('');

  const jarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const roomSvgRef = useRef<SVGSVGElement | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  const bodiesRef = useRef<SquishyBody[]>([]);
  const nextBodyIdRef = useRef<number>(1);
  const dropCooldownRef = useRef<number>(0);
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; color: string; life: number }[]
  >([]);
  const roomDragRef = useRef<{
    id: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctor) {
        try {
          audioRef.current = new Ctor();
        } catch {
          // Ignore blocked audio context
        }
      }
    }
    return audioRef.current;
  }, []);

  const updateProfile = useCallback(
    (updater: (prev: SavedBlindBoxProfile) => SavedBlindBoxProfile) => {
      setProfile((prev) => {
        const next = updater(prev);
        saveProfile(next);
        return next;
      });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Jar Drop & Physics Loop
  // -------------------------------------------------------------------------
  const resetJar = useCallback(() => {
    bodiesRef.current = [];
    particlesRef.current = [];
    dropCooldownRef.current = 0;
    setScore(0);
    setComboText('');
    setGameOver(false);
    setCurrentTier(Math.floor(Math.random() * 3));
    setNextTier(Math.floor(Math.random() * 4));
  }, []);

  const dropSquishyAt = useCallback(
    (rawX: number) => {
      if (gameOver || dropCooldownRef.current > 0) return;
      const tierDef = SQUISHY_TIERS[currentTier];
      const clampedX = Math.max(
        tierDef.radius + 10,
        Math.min(JAR_W - tierDef.radius - 10, rawX)
      );
      bodiesRef.current.push({
        id: nextBodyIdRef.current++,
        tier: currentTier,
        x: clampedX,
        y: 40,
        vx: (Math.random() - 0.5) * 14,
        vy: 30,
        radius: tierDef.radius,
        scaleX: 0.92,
        scaleY: 1.08,
        ageSec: 0,
        mergeFlash: 0,
      });

      dropCooldownRef.current = 0.34;
      setCurrentTier(nextTier);
      setNextTier(Math.floor(Math.random() * 4));
      playCuteSfx(ensureAudio(), 'drop', muted);
    },
    [currentTier, ensureAudio, gameOver, muted, nextTier]
  );

  useEffect(() => {
    if (subTab !== 'merge') return;

    let rafId = 0;
    let lastTs = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      dropCooldownRef.current = Math.max(0, dropCooldownRef.current - dt);

      if (!gameOver) {
        const stepOut = stepSquishyPhysics(
          bodiesRef.current,
          dt,
          nextBodyIdRef,
          JAR_W,
          JAR_H
        );
        bodiesRef.current = stepOut.bodies;

        if (stepOut.merges.length > 0) {
          for (let mIdx = 0; mIdx < stepOut.merges.length; mIdx++) {
            const m = stepOut.merges[mIdx];
            const mDef = SQUISHY_TIERS[m.tier];
            for (let p = 0; p < 8; p++) {
              const ang = (Math.PI * 2 * p) / 8 + Math.random() * 0.4;
              const spd = 45 + Math.random() * 65;
              particlesRef.current.push({
                x: m.x,
                y: m.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                color: mDef.fillColor,
                life: 0.45,
              });
            }
          }
          playCuteSfx(ensureAudio(), 'merge', muted, stepOut.merges.length);
          const topMerge = stepOut.merges[stepOut.merges.length - 1];
          setComboText(
            `Bộp! Ghép ${SQUISHY_TIERS[topMerge.tier].name} (+${stepOut.coinDelta} Xu)`
          );
          setScore((prev) => {
            const nextScore = prev + stepOut.scoreDelta;
            updateProfile((prof) => ({
              ...prof,
              coins: prof.coins + stepOut.coinDelta,
              bestScore: Math.max(prof.bestScore, nextScore),
            }));
            return nextScore;
          });
        }

        if (stepOut.overflowed) {
          setGameOver(true);
        }
      }

      // Advance sparkle particles
      particlesRef.current = particlesRef.current
        .map((pt) => ({
          ...pt,
          x: pt.x + pt.vx * dt,
          y: pt.y + pt.vy * dt,
          life: pt.life - dt,
        }))
        .filter((pt) => pt.life > 0);

      // Draw Glass Jar Canvas
      const canvas = jarCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, JAR_W, JAR_H);

        // Soft Glass Interior
        ctx.fillStyle = isDark ? '#252024' : '#FFF9F4';
        ctx.beginPath();
        ctx.roundRect(4, 6, JAR_W - 8, JAR_H - 10, 22);
        ctx.fill();

        // Danger Overflow Line
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 114, 142, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(14, DANGER_LINE_Y);
        ctx.lineTo(JAR_W - 14, DANGER_LINE_Y);
        ctx.stroke();
        ctx.restore();

        // Aim Guide Line + Held Squishy Preview
        if (!gameOver && dropCooldownRef.current <= 0.05) {
          const curDef = SQUISHY_TIERS[currentTier];
          const clampedAim = Math.max(
            curDef.radius + 10,
            Math.min(JAR_W - curDef.radius - 10, aimX)
          );
          ctx.save();
          ctx.strokeStyle = isDark ? 'rgba(248, 187, 208, 0.25)' : 'rgba(219, 132, 160, 0.35)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(clampedAim, 48);
          ctx.lineTo(clampedAim, JAR_H - 16);
          ctx.stroke();
          ctx.restore();

          drawKawaiiSquishy(ctx, clampedAim, 40, currentTier, 1, 1);
        }

        // All Squishy Bodies
        for (const b of bodiesRef.current) {
          drawKawaiiSquishy(ctx, b.x, b.y, b.tier, b.scaleX, b.scaleY, b.mergeFlash);
        }

        // Pop Sparkles
        for (const pt of particlesRef.current) {
          ctx.save();
          ctx.globalAlpha = Math.min(1, pt.life * 2.2);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Outer Glass Jar Rim Highlight
        ctx.strokeStyle = isDark ? '#5C4D55' : '#E7D4DB';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(4, 6, JAR_W - 8, JAR_H - 10, 22);
        ctx.stroke();
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [aimX, currentTier, ensureAudio, gameOver, isDark, muted, subTab, updateProfile]);

  const mapPointerToJarX = (clientX: number) => {
    const canvas = jarCanvasRef.current;
    if (!canvas) return JAR_W / 2;
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / Math.max(1, rect.width)) * JAR_W;
  };

  // -------------------------------------------------------------------------
  // Interactive Swipe-to-Tear Blind Box Handlers
  // -------------------------------------------------------------------------
  const handleBuyPack = (pack: BlindBoxPackDef) => {
    if (profile.coins < pack.costCoins) return;
    updateProfile((prev) => ({ ...prev, coins: prev.coins - pack.costCoins }));
    setActivePack(pack);
    setTearProgress(0);
    setRevealedDrop(null);
    playCuteSfx(ensureAudio(), 'place', muted);
  };

  const completeTearOpen = useCallback(
    (pack: BlindBoxPackDef) => {
      const result = rollBlindBoxDrop(
        pack,
        Math.random(),
        Math.random(),
        profile.unlockedIds
      );
      setRevealedDrop(result);
      setActivePack(null);
      setTearProgress(1);

      updateProfile((prev) => {
        const nextUnlocked = prev.unlockedIds.includes(result.item.id)
          ? prev.unlockedIds
          : [...prev.unlockedIds, result.item.id];
        const nextPlaced =
          result.isNew && !prev.placedRoom.some((d) => d.id === result.item.id)
            ? [
                ...prev.placedRoom,
                {
                  id: result.item.id,
                  x: result.item.defaultX,
                  y: result.item.defaultY,
                  flipped: false,
                },
              ]
            : prev.placedRoom;
        return {
          ...prev,
          coins: prev.coins + result.duplicateRefundCoins,
          unlockedIds: nextUnlocked,
          placedRoom: nextPlaced,
        };
      });

      playCuteSfx(
        ensureAudio(),
        result.item.rarity === 'secret' ? 'secret' : 'reveal',
        muted
      );
    },
    [ensureAudio, muted, profile.unlockedIds, updateProfile]
  );

  // -------------------------------------------------------------------------
  // Cozy Mini-Room Drag & PNG Export
  // -------------------------------------------------------------------------
  const clientToRoomCoords = useCallback((clientX: number, clientY: number) => {
    const svg = roomSvgRef.current;
    if (!svg) return { x: ROOM_W / 2, y: ROOM_H / 2 };
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const out = pt.matrixTransform(ctm.inverse());
      return { x: out.x, y: out.y };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / Math.max(1, rect.width)) * ROOM_W,
      y: ((clientY - rect.top) / Math.max(1, rect.height)) * ROOM_H,
    };
  }, []);

  const toggleDecorInRoom = (def: RoomCollectibleDef) => {
    if (!profile.unlockedIds.includes(def.id)) return;
    const exists = profile.placedRoom.some((p) => p.id === def.id);
    if (exists) {
      updateProfile((prev) => ({
        ...prev,
        placedRoom: prev.placedRoom.filter((p) => p.id !== def.id),
      }));
      if (selectedRoomId === def.id) setSelectedRoomId(null);
    } else {
      updateProfile((prev) => ({
        ...prev,
        placedRoom: [
          ...prev.placedRoom,
          { id: def.id, x: def.defaultX, y: def.defaultY, flipped: false },
        ],
      }));
      setSelectedRoomId(def.id);
      playCuteSfx(ensureAudio(), 'place', muted);
    }
  };

  const handleSaveRoomSnapshot = () => {
    const svg = roomSvgRef.current;
    if (!svg) return;
    try {
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const outCanvas = document.createElement('canvas');
        outCanvas.width = ROOM_W * 2;
        outCanvas.height = ROOM_H * 2;
        const c = outCanvas.getContext('2d');
        if (c) {
          c.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);
          const pngUrl = outCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = 'goc-phong-tui-mu.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
        setSnapshotMessage('Đã lưu ảnh kỷ niệm góc phòng (.PNG)!');
        window.setTimeout(() => setSnapshotMessage(''), 3200);
      };
      img.src = url;
    } catch {
      setSnapshotMessage('Không thể xuất ảnh trên trình duyệt này.');
    }
  };

  const surfaceClass = isDark
    ? 'bg-[#201B1E] text-[#FAF2F5] border-[#3E3239]'
    : 'bg-[#FFF8FA] text-[#45353C] border-[#F0DCE3]';
  const cardClass = isDark
    ? 'bg-[#2B2328] border-[#44373E]'
    : 'bg-white border-[#F0DCE3]';

  const nextTierDef = SQUISHY_TIERS[nextTier];

  return (
    <section
      id="blind-box-merge-section"
      aria-label="Tiệm Xé Túi Mù & Hợp Nhất Thú Bông"
      className={`rounded-2xl border p-4 sm:p-6 mobile-ls:p-2.5 shadow-sm transition-colors ${surfaceClass}`}
    >
      {/* Top Studio Header & 3-Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mobile-ls:flex-row mobile-ls:items-center mobile-ls:justify-between gap-3 mobile-ls:gap-1.5 pb-4 mobile-ls:pb-1.5 border-b border-[#F0DCE3] dark:border-[#3E3239]">
        <div>
          <p className="text-xs font-medium text-[#D16B8F] dark:text-[#F4A8C3] mobile-ls:hidden">
            Blind-Box Squishy Merge · 10 Thú Bông Mochi · 12 Đồ Decor Phòng Mini
          </p>
          <h1 className="text-xl sm:text-2xl mobile-ls:text-base font-bold tracking-tight">
            Tiệm Xé Túi Mù &amp; Hợp Nhất Thú Bông
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 mobile-ls:gap-1.5">
          {/* Coins & Collection Counter */}
          <div className={`inline-flex items-center gap-2 px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-xl border text-xs font-semibold tabular-nums ${cardClass}`}>
            <Coins className="w-4 h-4 text-amber-500 shrink-0" />
            <span data-testid="blindbox-coins">{profile.coins} Xu</span>
            <span className="opacity-35 mobile-ls:hidden" aria-hidden="true">·</span>
            <span className="mobile-ls:hidden">Sưu tầm: {profile.unlockedIds.length}/{ROOM_COLLECTIBLES.length}</span>
          </div>

          {/* Sub-tab Switcher */}
          <div className={`flex flex-wrap sm:inline-flex items-center gap-1 p-1 rounded-xl border w-full sm:w-auto mobile-ls:w-auto ${cardClass}`}>
            <button
              type="button"
              data-testid="blindbox-tab-merge"
              onClick={() => setSubTab('merge')}
              className={`min-h-[42px] mobile-ls:min-h-[34px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                subTab === 'merge'
                  ? 'bg-[#E57399] text-white'
                  : 'hover:bg-[#FCEEF3] dark:hover:bg-[#3A2E35]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Hũ Hợp Nhất</span>
            </button>
            <button
              type="button"
              data-testid="blindbox-tab-gacha"
              onClick={() => setSubTab('gacha')}
              className={`min-h-[42px] mobile-ls:min-h-[34px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                subTab === 'gacha'
                  ? 'bg-[#E57399] text-white'
                  : 'hover:bg-[#FCEEF3] dark:hover:bg-[#3A2E35]'
              }`}
            >
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span>Kệ Xé Túi Mù</span>
            </button>
            <button
              type="button"
              data-testid="blindbox-tab-room"
              onClick={() => setSubTab('room')}
              className={`min-h-[42px] mobile-ls:min-h-[34px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 sm:px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                subTab === 'room'
                  ? 'bg-[#E57399] text-white'
                  : 'hover:bg-[#FCEEF3] dark:hover:bg-[#3A2E35]'
              }`}
            >
              <Home className="w-3.5 h-3.5 shrink-0" />
              <span>Phòng Mini</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Bật âm thanh ASMR' : 'Tắt âm thanh ASMR'}
            className={`min-w-[40px] min-h-[40px] mobile-ls:min-w-[34px] mobile-ls:min-h-[34px] p-2 mobile-ls:p-1.5 rounded-xl border flex items-center justify-center cursor-pointer ${cardClass}`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#E57399]" />}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: SQUISHY MERGE JAR                                          */}
      {/* ================================================================= */}
      {subTab === 'merge' && (
        <div className="mt-4 mobile-ls:mt-2 grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_290px] lg:grid-cols-12 gap-5 mobile-ls:gap-3 items-start">
          {/* Center Glass Jar Play Area */}
          <div className="mobile-ls:min-w-0 lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[380px] flex items-center justify-between gap-2 mb-2 mobile-ls:mb-1 text-xs tabular-nums">
              <div>
                Điểm: <strong data-testid="blindbox-score" className="text-sm text-[#D16B8F] dark:text-[#F4A8C3]">{score}</strong>
                <span className="mx-2 opacity-40">·</span>
                Kỷ lục: <strong>{profile.bestScore}</strong>
              </div>
              <div className="flex items-center gap-2">
                <span>Tiếp: <strong>{nextTierDef.name}</strong></span>
                <button
                  type="button"
                  onClick={resetJar}
                  aria-label="Chơi lại hũ mới"
                  className={`min-w-[40px] min-h-[40px] mobile-ls:min-w-[32px] mobile-ls:min-h-[32px] p-2 mobile-ls:p-1 rounded-lg border flex items-center justify-center cursor-pointer ${cardClass}`}
                >
                  <RotateCcw className="w-4 h-4 mobile-ls:w-3.5 mobile-ls:h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative w-full max-w-[360px] mobile-ls:max-w-[min(100%,calc((100dvh-98px)*0.818))]">
              <canvas
                ref={jarCanvasRef}
                data-testid="blindbox-jar-canvas"
                width={JAR_W}
                height={JAR_H}
                onPointerMove={(e) => setAimX(mapPointerToJarX(e.clientX))}
                onPointerDown={(e) => {
                  const x = mapPointerToJarX(e.clientX);
                  setAimX(x);
                  dropSquishyAt(x);
                }}
                className="w-full aspect-[360/440] h-auto rounded-3xl cursor-pointer touch-none shadow-inner"
                aria-label="Hũ thủy tinh thả hợp nhất Mochi và thú bông"
              />

              {gameOver && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Hũ đã đầy"
                  className="absolute inset-0 rounded-3xl bg-[#201B1E]/88 flex items-center justify-center p-4"
                >
                  <div className={`w-full rounded-2xl border p-5 text-center space-y-3 ${cardClass}`}>
                    <p className="text-xs font-semibold text-[#E57399]">HŨ ĐÃ ĐẦY Ú Ụ!</p>
                    <h3 className="text-lg font-bold">Điểm Ván Này: {score}</h3>
                    <p className="text-xs opacity-80">
                      Xu bạn kiếm được đã tự động cộng vào ví ({profile.coins} Xu). Ra kệ xé túi mù thôi!
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={resetJar}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E57399] hover:bg-[#D55E87] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Thả Lại Hũ Mới
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubTab('gacha')}
                        className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E57399] text-[#D16B8F] dark:text-[#F4A8C3] text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        Đi Xé Túi Mù →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-center opacity-80 min-h-[18px]">
              {comboText || 'Chạm hoặc nhấp vào hũ để thả Mochi. Hai bé giống nhau chạm nhau sẽ nổ bộp hợp nhất!'}
            </p>
          </div>

          {/* Right Column: Evolution Ladder + Quick Blind Box CTA */}
          <div className="lg:col-span-5 space-y-4 mobile-ls:max-h-[calc(100dvh-76px)] mobile-ls:overflow-y-auto mobile-ls:pr-1 mobile-ls:space-y-2.5">
            <div className={`rounded-2xl border p-4 mobile-ls:p-2.5 space-y-3 mobile-ls:space-y-2 ${cardClass}`}>
              <h2 className="text-sm font-bold">Vòng Tiến Hóa 10 Thú Bông (+Xu khi ghép)</h2>
              <div className="grid grid-cols-2 gap-2">
                {SQUISHY_TIERS.map((t) => (
                  <div
                    key={t.tier}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#FFF8FA] dark:bg-[#221B1F] border border-[#F0DCE3] dark:border-[#3E3239] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full border border-[#52433B] shrink-0"
                        style={{ backgroundColor: t.fillColor }}
                        aria-hidden="true"
                      />
                      <span className="truncate font-medium">
                        {t.tier + 1}. {t.name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-amber-600 dark:text-amber-300 shrink-0">
                      +{t.mergeCoins}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-4 space-y-2.5 ${cardClass}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Đổi Xu Lấy Túi Mù Decor</h3>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                  Ví: {profile.coins} Xu
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                Dùng Xu kiếm từ tiếng nổ &ldquo;bộp&rdquo; hợp nhất để lên Kệ Túi Mù, vuốt ngang xé toạc vỏ túi săn đồ <strong>Secret</strong> trang trí Phòng Mini!
              </p>
              <button
                type="button"
                onClick={() => setSubTab('gacha')}
                className="min-h-[44px] w-full py-2.5 rounded-xl bg-[#E57399] hover:bg-[#D55E87] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Mở Kệ Xé Túi Mù ({profile.coins} Xu) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SWIPE-TO-TEAR BLIND BOX SHELF                              */}
      {/* ================================================================= */}
      {subTab === 'gacha' && (
        <div className="mt-4 mobile-ls:mt-2 grid grid-cols-1 mobile-ls:grid-cols-12 lg:grid-cols-12 gap-5 mobile-ls:gap-3 items-start">
          {/* Left: Shelf Packs */}
          <div className="mobile-ls:col-span-5 lg:col-span-5 space-y-3 mobile-ls:max-h-[calc(100dvh-76px)] mobile-ls:overflow-y-auto mobile-ls:pr-1">
            <h2 className="text-sm font-bold">Kệ Túi Mù Hôm Nay</h2>
            {BLIND_BOX_PACKS.map((pack) => {
              const canAfford = profile.coins >= pack.costCoins;
              return (
                <div key={pack.id} className={`rounded-2xl border p-4 mobile-ls:p-2.5 space-y-3 mobile-ls:space-y-2 ${cardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base mobile-ls:text-sm font-bold">{pack.name}</h3>
                      <p className="text-xs opacity-80 mt-0.5">{pack.subtitle}</p>
                      <p className="text-[11px] text-[#D16B8F] dark:text-[#F4A8C3] mt-1">
                        Tỷ lệ Secret: {Math.round(pack.secretChance * 100)}% · Hiếm: {Math.round(pack.rareChance * 100)}%
                      </p>
                    </div>
                    <div
                      className="w-12 h-14 rounded-xl border-2 border-[#52433B] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: pack.foilColor }}
                      aria-hidden="true"
                    >
                      <PackageOpen className="w-5 h-5 text-[#52433B]" />
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid={`buy-${pack.id}`}
                    disabled={!canAfford || activePack !== null}
                    onClick={() => handleBuyPack(pack)}
                    className="min-h-[44px] mobile-ls:min-h-[38px] w-full py-2.5 mobile-ls:py-1.5 rounded-xl bg-[#E57399] hover:bg-[#D55E87] disabled:opacity-45 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    {activePack
                      ? 'Đang có túi chờ xé...'
                      : canAfford
                        ? `Mua Túi (${pack.costCoins} Xu)`
                        : `Thiếu Xu (Cần ${pack.costCoins} Xu)`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right: Interactive Foil Tear Stage */}
          <div className="mobile-ls:col-span-7 lg:col-span-7">
            <div className={`rounded-2xl border p-5 mobile-ls:p-3 min-h-[380px] mobile-ls:min-h-[250px] flex flex-col items-center justify-center text-center ${cardClass}`}>
              {activePack ? (
                <div className="w-full max-w-sm space-y-4 mobile-ls:space-y-2">
                  <p className="text-xs font-semibold text-[#D16B8F] dark:text-[#F4A8C3]">
                    VUỐT NGANG ĐƯỜNG RĂNG CƯA ĐỂ XÉ TÚI! ({Math.round(tearProgress * 100)}%)
                  </p>

                  {/* Interactive Tearing Blind Box Foil Pouch */}
                  <div
                    className="relative mx-auto w-60 h-72 mobile-ls:scale-[0.82] mobile-ls:-my-4 select-none touch-none"
                    style={{
                      transform:
                        tearProgress > 0.05
                          ? `rotate(${Math.sin(tearProgress * 28) * 2.5}deg)`
                          : undefined,
                    }}
                  >
                    {/* Torn-off top strip */}
                    <div
                      className="w-full h-14 rounded-t-2xl border-2 border-b-0 border-[#52433B] flex items-center justify-center text-[11px] font-bold text-[#52433B] transition-transform"
                      style={{
                        backgroundColor: activePack.foilColor,
                        transform: `translate(${tearProgress * 32}px, ${-tearProgress * 18}px) rotate(${tearProgress * 12}deg)`,
                      }}
                    >
                      ✂️ ĐƯỜNG XÉ RĂNG CƯA
                    </div>

                    {/* Interactive Swipe Strip */}
                    <div
                      data-testid="blindbox-tear-strip"
                      onPointerDown={(e) => {
                        tearStartRef.current = e.clientX;
                        try {
                          e.currentTarget.setPointerCapture(e.pointerId);
                        } catch {
                          // Ignore synthetic pointer capture failure
                        }
                      }}
                      onPointerMove={(e) => {
                        if (tearStartRef.current === null) return;
                        const pct = computeTearProgress(tearStartRef.current, e.clientX, 145);
                        setTearProgress(pct);
                        const now = Date.now();
                        if (pct > 0.08 && now - lastCrinkleRef.current > 85) {
                          lastCrinkleRef.current = now;
                          playCuteSfx(ensureAudio(), 'crinkle', muted);
                        }
                        if (pct >= 0.85) {
                          tearStartRef.current = null;
                          completeTearOpen(activePack);
                        }
                      }}
                      onPointerUp={() => {
                        tearStartRef.current = null;
                      }}
                      onPointerCancel={() => {
                        tearStartRef.current = null;
                      }}
                      className="relative h-9 bg-[#FFF8FA] border-x-2 border-dashed border-[#52433B] flex items-center justify-between px-3 cursor-ew-resize"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-[#E57399]/30 transition-all"
                        style={{ width: `${Math.round(tearProgress * 100)}%` }}
                      />
                      <span className="relative z-10 text-[11px] font-bold text-[#52433B] flex items-center gap-1">
                        <Scissors className="w-3.5 h-3.5" /> Kéo sang phải →
                      </span>
                      <span className="relative z-10 text-[11px] font-mono text-[#52433B]">
                        {Math.round(tearProgress * 100)}%
                      </span>
                    </div>

                    {/* Pouch Lower Body */}
                    <div
                      className="w-full h-44 rounded-b-2xl border-2 border-t-0 border-[#52433B] flex flex-col items-center justify-center p-4 space-y-2"
                      style={{ backgroundColor: activePack.foilColor }}
                    >
                      <Sparkles className="w-9 h-9 text-[#52433B]" />
                      <p className="text-sm font-bold text-[#52433B]">{activePack.name}</p>
                      <p className="text-[11px] text-[#52433B]/80">BLIND BOX SERIES</p>
                    </div>
                  </div>

                  {/* Accessible 1-Click Quick Tear Fallback */}
                  <button
                    type="button"
                    data-testid="blindbox-quick-tear-btn"
                    onClick={() => completeTearOpen(activePack)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E57399] text-[#D16B8F] dark:text-[#F4A8C3] text-xs sm:text-sm font-semibold cursor-pointer hover:bg-[#FCEEF3] dark:hover:bg-[#3A2E35]"
                  >
                    Xé Toạc Ngay (hoặc vuốt ngang vỏ túi)
                  </button>
                </div>
              ) : revealedDrop ? (
                <div className="space-y-4 max-w-sm">
                  <p
                    className={`text-xs font-bold tracking-wide ${
                      revealedDrop.item.rarity === 'secret'
                        ? 'text-amber-500'
                        : revealedDrop.item.rarity === 'rare'
                          ? 'text-purple-500'
                          : 'text-[#6B8E78]'
                    }`}
                  >
                    {revealedDrop.item.rarity === 'secret'
                      ? '🌟 CHÚC MỪNG! TRÚNG MÓN SECRET CỰC HIẾM!'
                      : revealedDrop.item.rarity === 'rare'
                        ? '✨ TRÚNG MÓN HIẾM (RARE)!'
                        : '🎀 MỞ TÚI THÀNH CÔNG!'}
                  </p>

                  <div className="mx-auto w-36 h-36 rounded-2xl border border-[#F0DCE3] dark:border-[#3E3239] bg-[#FFF8FA] dark:bg-[#201B1E] flex items-center justify-center p-3">
                    <svg viewBox="-75 -75 150 150" className="w-full h-full">
                      {renderRoomItemSvg(revealedDrop.item)}
                    </svg>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">{revealedDrop.item.name}</h3>
                    <p className="text-xs opacity-80">{revealedDrop.item.description}</p>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                      {revealedDrop.isNew
                        ? 'Đã thêm món mới vào Kho Phòng Mini!'
                        : `Món trùng lặp — hoàn lại +${revealedDrop.duplicateRefundCoins} Xu!`}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealedDrop(null)}
                      className="min-h-[44px] px-4 py-2 rounded-xl border border-[#F0DCE3] dark:border-[#3E3239] text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Chọn Túi Khác
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubTab('room')}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E57399] hover:bg-[#D55E87] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Bài Trí Phòng Mini →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-w-xs opacity-80">
                  <Gift className="w-10 h-10 mx-auto text-[#E57399]" />
                  <h3 className="text-base font-bold">Chưa có túi mù nào trên bàn</h3>
                  <p className="text-xs leading-relaxed">
                    Chọn một túi mù bên trái để đặt lên bàn, sau đó vuốt ngang qua đường răng cưa để xé túi!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: COZY MINI-ROOM DECORATOR & SNAPSHOT                        */}
      {/* ================================================================= */}
      {subTab === 'room' && (
        <div className="mt-4 mobile-ls:mt-2 grid grid-cols-1 mobile-ls:grid-cols-[minmax(0,1fr)_250px] lg:grid-cols-12 gap-5 mobile-ls:gap-3 items-start">
          {/* Left: Interactive SVG Bedroom Corner */}
          <div className="mobile-ls:min-w-0 lg:col-span-8 space-y-2.5 mobile-ls:space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs opacity-80">
                Kéo thả tự do mọi món đồ trong phòng · Nhấp món đồ để Lật hướng hoặc Cất
              </p>
              <button
                type="button"
                data-testid="room-save-png-btn"
                onClick={handleSaveRoomSnapshot}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E57399] hover:bg-[#D55E87] text-white text-xs font-semibold cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Lưu Ảnh Kỷ Niệm (.PNG)</span>
              </button>
            </div>

            {snapshotMessage && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {snapshotMessage}
              </p>
            )}

            <svg
              ref={roomSvgRef}
              xmlns="http://www.w3.org/2000/svg"
              viewBox={`0 0 ${ROOM_W} ${ROOM_H}`}
              onPointerMove={(e) => {
                const drag = roomDragRef.current;
                if (!drag || drag.pointerId !== e.pointerId) return;
                const pt = clientToRoomCoords(e.clientX, e.clientY);
                const nx = Math.max(40, Math.min(ROOM_W - 40, Math.round(pt.x + drag.offsetX)));
                const ny = Math.max(40, Math.min(ROOM_H - 36, Math.round(pt.y + drag.offsetY)));
                updateProfile((prev) => ({
                  ...prev,
                  placedRoom: prev.placedRoom.map((item) =>
                    item.id === drag.id ? { ...item, x: nx, y: ny } : item
                  ),
                }));
              }}
              onPointerUp={() => {
                roomDragRef.current = null;
              }}
              onPointerCancel={() => {
                roomDragRef.current = null;
              }}
              onClick={() => setSelectedRoomId(null)}
              className="w-full mobile-ls:max-w-[min(100%,calc((100dvh-130px)*1.619))] mobile-ls:mx-auto block aspect-[680/420] h-auto rounded-2xl border border-[#F0DCE3] dark:border-[#3E3239] select-none touch-none"
              role="application"
              aria-label="Góc phòng mini trang trí đồ sưu tầm"
            >
              {/* Pastel Bedroom Wall & Floor */}
              <rect width={ROOM_W} height={295} fill="#FFF7F2" />
              <rect y={295} width={ROOM_W} height={125} fill="#F2DEC9" />
              <line x1={0} y1={295} x2={ROOM_W} y2={295} stroke="#D9C1A7" strokeWidth={3} />

              {/* Arched Cozy Window */}
              <g transform="translate(215, 76)">
                <rect x={0} y={0} width={116} height={138} rx={58} fill="#D8EEFA" stroke="#D9C1A7" strokeWidth={5} />
                <line x1={58} y1={0} x2={58} y2={138} stroke="#FFFDF9" strokeWidth={3} />
                <line x1={0} y1={74} x2={116} y2={74} stroke="#FFFDF9" strokeWidth={3} />
              </g>

              {/* Placed Collectible Items */}
              {profile.placedRoom.map((placed) => {
                const def = ROOM_COLLECTIBLES.find((c) => c.id === placed.id);
                if (!def) return null;
                const isSel = selectedRoomId === placed.id;
                return (
                  <g
                    key={placed.id}
                    transform={`translate(${placed.x}, ${placed.y}) scale(${placed.flipped ? -1 : 1}, 1)`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      const pt = clientToRoomCoords(e.clientX, e.clientY);
                      setSelectedRoomId(placed.id);
                      roomDragRef.current = {
                        id: placed.id,
                        pointerId: e.pointerId,
                        offsetX: placed.x - pt.x,
                        offsetY: placed.y - pt.y,
                      };
                      try {
                        e.currentTarget.setPointerCapture(e.pointerId);
                      } catch {
                        // Ignore synthetic pointer events
                      }
                    }}
                    style={{ cursor: 'grab' }}
                  >
                    {isSel && (
                      <rect
                        x={-def.width / 2 - 6}
                        y={-def.height / 2 - 6}
                        width={def.width + 12}
                        height={def.height + 12}
                        rx={12}
                        fill="none"
                        stroke="#E57399"
                        strokeWidth={2}
                        strokeDasharray="4 3"
                      />
                    )}
                    {renderRoomItemSvg(def)}
                  </g>
                );
              })}
            </svg>

            {selectedRoomId && (
              <div className="sticky bottom-2 z-10 sm:static flex items-center gap-2 p-2 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-[#F0DCE3] dark:border-[#3E3239] bg-white/95 dark:bg-[#2A2227]/95 sm:bg-transparent sm:dark:bg-transparent shadow-lg sm:shadow-none">
                <button
                  type="button"
                  onClick={() =>
                    updateProfile((prev) => ({
                      ...prev,
                      placedRoom: prev.placedRoom.map((p) =>
                        p.id === selectedRoomId ? { ...p, flipped: !p.flipped } : p
                      ),
                    }))
                  }
                  className={`min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${cardClass}`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Lật Hướng</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateProfile((prev) => ({
                      ...prev,
                      placedRoom: prev.placedRoom.filter((p) => p.id !== selectedRoomId),
                    }));
                    setSelectedRoomId(null);
                  }}
                  className={`min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold text-rose-500 cursor-pointer ${cardClass}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Cất Vào Kho</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: 12-Item Collectible Shelf */}
          <div className="lg:col-span-4 space-y-2.5">
            <h2 className="text-sm font-bold">
              Kho Đồ Sưu Tầm ({profile.unlockedIds.length}/{ROOM_COLLECTIBLES.length})
            </h2>
            <div className="grid grid-cols-2 gap-2 max-h-[420px] mobile-ls:max-h-[240px] overflow-y-auto pr-1">
              {ROOM_COLLECTIBLES.map((item) => {
                const unlocked = profile.unlockedIds.includes(item.id);
                const placed = profile.placedRoom.some((p) => p.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => toggleDecorInRoom(item)}
                    className={`p-2.5 rounded-xl border text-left transition-colors ${
                      !unlocked
                        ? 'opacity-45 cursor-not-allowed bg-black/5 dark:bg-white/5 border-dashed border-[#D8C5CD] dark:border-[#3E3239]'
                        : placed
                          ? 'border-[#E57399] bg-[#FCEEF3] dark:bg-[#3A2832] cursor-pointer'
                          : `${cardClass} hover:border-[#E57399] cursor-pointer`
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-semibold">
                      <span
                        className={
                          item.rarity === 'secret'
                            ? 'text-amber-500'
                            : item.rarity === 'rare'
                              ? 'text-purple-500'
                              : 'opacity-70'
                        }
                      >
                        {item.rarity === 'secret'
                          ? 'SECRET'
                          : item.rarity === 'rare'
                            ? 'HIẾM'
                            : 'THƯỜNG'}
                      </span>
                      {placed && <CheckCircle2 className="w-3 h-3 text-[#E57399]" />}
                    </div>
                    <p className="text-xs font-semibold mt-1 truncate">
                      {unlocked ? item.name : '??? (Mở Túi Mù)'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
