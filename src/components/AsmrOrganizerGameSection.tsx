import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lightbulb,
  RotateCcw,
  RotateCw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  evaluateBoardProgress,
  getSmartHint,
  isItemPlacementCorrect,
  nextRotation,
  ORGANIZER_LEVELS,
  resolveItemDrop,
  scrambleLevelItems,
  SNAP_RADIUS_PX,
  type OrganizerHint,
  type OrganizerItemDef,
  type OrganizerItemState,
  type OrganizerLevelDef,
  type OrganizerSlotDef,
} from '../utils/asmrOrganizerEngine.ts';
import { ThemeMode } from '../utils/portfolioLogic.ts';

interface AsmrOrganizerGameSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

type GamePhase = 'TITLE' | 'PLAYING' | 'LEVEL_CLEAR';

const STORAGE_KEY = 'thuanle-asmr-organizer-v1';

interface SavedOrganizerProgress {
  completedLevelIds: number[];
}

function loadSavedProgress(): SavedOrganizerProgress {
  if (typeof window === 'undefined') return { completedLevelIds: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedLevelIds: [] };
    const parsed = JSON.parse(raw) as Partial<SavedOrganizerProgress>;
    return {
      completedLevelIds: Array.isArray(parsed.completedLevelIds)
        ? parsed.completedLevelIds.filter((n): n is number => typeof n === 'number')
        : [],
    };
  } catch {
    return { completedLevelIds: [] };
  }
}

function saveOrganizerProgress(progress: SavedOrganizerProgress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota errors
  }
}

// ---------------------------------------------------------------------------
// Synthesized ASMR Audio Feedback (Web Audio API)
// ---------------------------------------------------------------------------
type AsmrSoundKind = 'pickup' | 'rotate' | 'soft-tap' | 'perfect-snap' | 'clear';

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  try {
    return new AudioCtor();
  } catch {
    return null;
  }
}

function playAsmrSound(ctx: AudioContext | null, kind: AsmrSoundKind, muted: boolean) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;

  if (kind === 'pickup') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.045);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
    return;
  }

  if (kind === 'rotate') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.028);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.036);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
    return;
  }

  if (kind === 'soft-tap') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.055);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
    return;
  }

  if (kind === 'perfect-snap') {
    // Crisp wooden/ceramic "tách" click + soft harmonic kalimba chime
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1180, now);
    clickOsc.frequency.exponentialRampToValueAtTime(420, now + 0.032);
    clickGain.gain.setValueAtTime(0.12, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);
    clickOsc.connect(clickGain).connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.042);

    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(880, now + 0.015);
    chimeOsc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.16);
    chimeGain.gain.setValueAtTime(0.07, now + 0.015);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    chimeOsc.connect(chimeGain).connect(ctx.destination);
    chimeOsc.start(now + 0.015);
    chimeOsc.stop(now + 0.23);
    return;
  }

  if (kind === 'clear') {
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }
}

// ---------------------------------------------------------------------------
// Pastel Minimalist SVG Item Artwork
// ---------------------------------------------------------------------------
function renderPastelItemSvg(def: OrganizerItemDef) {
  const { width: w, height: h, color, accentColor, shape } = def;
  const hw = w / 2;
  const hh = h / 2;
  const stroke = '#4A4038';

  switch (shape) {
    case 'onigiri':
      return (
        <g>
          <path
            d={`M 0 ${-hh + 4} Q ${hw - 4} ${hh - 8} ${hw - 6} ${hh - 4} Q 0 ${hh} ${-hw + 6} ${hh - 4} Q ${-hw + 4} ${hh - 8} 0 ${-hh + 4} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <rect
            x={-16}
            y={hh - 26}
            width={32}
            height={23}
            rx={4}
            fill={accentColor}
            stroke={stroke}
            strokeWidth={1.4}
          />
          <circle cx={-8} cy={-8} r={2} fill="#6B6259" />
          <circle cx={8} cy={-4} r={1.8} fill="#6B6259" />
          <circle cx={2} cy={-16} r={1.8} fill="#6B6259" />
        </g>
      );

    case 'salmon':
      return (
        <g>
          <rect
            x={-hw + 2}
            y={-hh + 2}
            width={w - 4}
            height={h - 4}
            rx={14}
            fill={color}
            stroke={stroke}
            strokeWidth={1.8}
          />
          <path
            d={`M ${-hw + 16} ${-hh + 12} Q ${-hw + 28} 0 ${-hw + 14} ${hh - 12}`}
            fill="none"
            stroke="#FFF4EB"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.75}
          />
          <path
            d={`M -6 ${-hh + 10} Q 8 0 -4 ${hh - 10}`}
            fill="none"
            stroke="#FFF4EB"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.75}
          />
          <path
            d={`M ${hw - 26} ${-hh + 12} Q ${hw - 14} 0 ${hw - 26} ${hh - 12}`}
            fill="none"
            stroke={accentColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );

    case 'chopsticks':
      return (
        <g>
          <path
            d={`M ${-hw + 2} -6 L ${hw - 2} -3 L ${hw - 2} -1 L ${-hw + 2} -1 Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <path
            d={`M ${-hw + 2} 2 L ${hw - 2} 3 L ${hw - 2} 6 L ${-hw + 2} 7 Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
          <rect x={-hw + 10} y={-6} width={16} height={5} rx={1.5} fill={accentColor} />
          <rect x={-hw + 10} y={2} width={16} height={5} rx={1.5} fill={accentColor} />
        </g>
      );

    case 'tamago':
      return (
        <g>
          <rect
            x={-hw + 4}
            y={-hh + 4}
            width={w - 8}
            height={h / 2 - 4}
            rx={10}
            fill={color}
            stroke={stroke}
            strokeWidth={1.6}
          />
          <rect
            x={-hw + 4}
            y={2}
            width={w - 8}
            height={h / 2 - 4}
            rx={10}
            fill={color}
            stroke={stroke}
            strokeWidth={1.6}
          />
          <ellipse cx={-6} cy={-hh / 2 + 2} rx={12} ry={5} fill="none" stroke={accentColor} strokeWidth={1.6} />
          <ellipse cx={6} cy={hh / 2 - 2} rx={12} ry={5} fill="none" stroke={accentColor} strokeWidth={1.6} />
        </g>
      );

    case 'edamame':
      return (
        <g>
          <path
            d={`M ${-hw + 4} 2 Q ${-hw + 14} ${-hh + 6} 0 ${-hh + 8} Q ${hw - 12} ${-hh + 8} ${hw - 4} 2 Q ${hw - 14} ${hh - 6} 0 ${hh - 8} Q ${-hw + 14} ${hh - 8} ${-hw + 4} 2 Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.8}
          />
          <circle cx={-16} cy={0} r={9} fill={accentColor} opacity={0.85} />
          <circle cx={0} cy={-1} r={9.5} fill={accentColor} opacity={0.9} />
          <circle cx={16} cy={0} r={9} fill={accentColor} opacity={0.85} />
        </g>
      );

    case 'tomato':
      return (
        <g>
          <circle cx={0} cy={2} r={hw - 4} fill={color} stroke={stroke} strokeWidth={1.8} />
          <circle cx={-7} cy={-5} r={5} fill="#FFFDF9" opacity={0.45} />
          <path
            d="M 0 -16 L -5 -22 L 0 -19 L 6 -23 L 3 -17 L 9 -15 L 1 -14 Z"
            fill={accentColor}
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </g>
      );

    case 'book':
      return (
        <g>
          <rect
            x={-hw + 1}
            y={-hh + 2}
            width={w - 2}
            height={h - 4}
            rx={4}
            fill={color}
            stroke={stroke}
            strokeWidth={1.7}
          />
          <rect x={-hw + 4} y={-hh + 12} width={w - 8} height={6} rx={1.5} fill={accentColor} opacity={0.85} />
          <rect x={-hw + 4} y={hh - 20} width={w - 8} height={6} rx={1.5} fill={accentColor} opacity={0.85} />
          <line x1={-hw + 6} y1={-hh + 6} x2={-hw + 6} y2={hh - 6} stroke="#FFFDF9" strokeWidth={1.8} opacity={0.55} />
        </g>
      );

    case 'candle':
      return (
        <g>
          <path d="M 0 -29 Q 6 -21 0 -16 Q -6 -21 0 -29 Z" fill="#F5B041" stroke={stroke} strokeWidth={1.2} />
          <line x1={0} y1={-16} x2={0} y2={-11} stroke={stroke} strokeWidth={1.6} />
          <rect x={-hw + 4} y={-11} width={w - 8} height={hh + 7} rx={8} fill={color} stroke={stroke} strokeWidth={1.7} />
          <rect x={-hw + 10} y={2} width={w - 20} height={16} rx={3} fill={accentColor} opacity={0.45} />
        </g>
      );

    case 'vase':
      return (
        <g>
          <path
            d={`M -11 ${-hh + 6} L 11 ${-hh + 6} L 8 -14 Q ${hw - 2} -4 ${hw - 4} ${hh - 8} Q 0 ${hh} ${-hw + 4} ${hh - 8} Q ${-hw + 2} -4 -8 -14 Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.8}
            strokeLinejoin="round"
          />
          <ellipse cx={0} cy={-hh + 6} rx={11} ry={3.5} fill={accentColor} stroke={stroke} strokeWidth={1.4} />
          <path d={`M -14 14 Q 0 18 14 14`} fill="none" stroke={accentColor} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      );

    case 'frame':
      return (
        <g>
          <rect x={-hw + 2} y={-hh + 2} width={w - 4} height={h - 4} rx={5} fill={color} stroke={stroke} strokeWidth={1.8} />
          <rect x={-hw + 10} y={-hh + 10} width={w - 20} height={h - 20} rx={2} fill="#FAF7F2" stroke={stroke} strokeWidth={1.3} />
          <path d={`M ${-hw + 12} ${hh - 14} L -4 4 L 8 16 L 16 8 L ${hw - 12} ${hh - 14} Z`} fill={accentColor} opacity={0.8} />
          <circle cx={10} cy={-10} r={5} fill="#F5CBB1" />
        </g>
      );

    case 'perfume':
      return (
        <g>
          <rect x={-11} y={-hh + 2} width={22} height={18} rx={4} fill={accentColor} stroke={stroke} strokeWidth={1.6} />
          <rect x={-7} y={-hh + 20} width={14} height={8} fill="#E5D5C3" stroke={stroke} strokeWidth={1.4} />
          <rect x={-hw + 4} y={-hh + 28} width={w - 8} height={h - 32} rx={14} fill={color} stroke={stroke} strokeWidth={1.8} />
          <rect x={-16} y={-2} width={32} height={24} rx={4} fill="#FFFDF9" stroke={stroke} strokeWidth={1.2} />
          <line x1={-9} y1={8} x2={9} y2={8} stroke={accentColor} strokeWidth={2} strokeLinecap="round" />
          <line x1={-6} y1={14} x2={6} y2={14} stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      );

    case 'compact':
      return (
        <g>
          <circle cx={0} cy={0} r={hw - 3} fill={color} stroke={stroke} strokeWidth={1.8} />
          <circle cx={0} cy={0} r={hw - 12} fill={accentColor} opacity={0.4} stroke={stroke} strokeWidth={1.2} />
          <ellipse cx={-10} cy={-10} rx={8} ry={4} transform="rotate(-30 -10 -10)" fill="#FFFDF9" opacity={0.7} />
        </g>
      );

    case 'serum':
      return (
        <g>
          <rect x={-5} y={-hh + 2} width={10} height={14} rx={3} fill="#4A4038" />
          <rect x={-10} y={-hh + 15} width={20} height={9} rx={2} fill={accentColor} stroke={stroke} strokeWidth={1.4} />
          <rect x={-hw + 2} y={-hh + 24} width={w - 4} height={h - 27} rx={7} fill={color} stroke={stroke} strokeWidth={1.7} />
          <rect x={-hw + 6} y={-6} width={w - 12} height={28} rx={3} fill="#FFFDF9" opacity={0.85} />
        </g>
      );

    case 'brush':
      return (
        <g>
          <path
            d={`M -13 ${-hh + 26} Q -15 ${-hh + 2} 0 ${-hh + 2} Q 15 ${-hh + 2} 13 ${-hh + 26} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.6}
          />
          <rect x={-7} y={-hh + 26} width={14} height={18} rx={2} fill="#E5C89E" stroke={stroke} strokeWidth={1.4} />
          <rect x={-5} y={-hh + 44} width={10} height={h - 46} rx={5} fill={accentColor} stroke={stroke} strokeWidth={1.5} />
        </g>
      );

    case 'lipstick':
      return (
        <g>
          <path
            d={`M -8 ${-hh + 14} L -8 ${-hh + 4} L 8 ${-hh + 10} L 8 ${-hh + 14} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <rect x={-9} y={-hh + 14} width={18} height={16} fill="#E7CFA3" stroke={stroke} strokeWidth={1.4} />
          <rect x={-11} y={-hh + 30} width={22} height={h - 32} rx={4} fill={accentColor} stroke={stroke} strokeWidth={1.6} />
        </g>
      );

    case 'cleanser':
      return (
        <g>
          <rect x={-10} y={-hh + 2} width={20} height={14} rx={3} fill="#FFFDF9" stroke={stroke} strokeWidth={1.5} />
          <path
            d={`M ${-hw + 4} ${-hh + 16} L ${hw - 4} ${-hh + 16} L ${hw - 10} ${hh - 4} Q 0 ${hh} ${-hw + 10} ${hh - 4} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <circle cx={0} cy={4} r={12} fill="#FFFDF9" opacity={0.75} />
          <path d="M 0 -2 Q 6 6 0 10 Q -6 6 0 -2 Z" fill={accentColor} />
        </g>
      );

    case 'sunscreen':
      return (
        <g>
          <rect x={-11} y={-hh + 2} width={22} height={14} rx={3} fill={accentColor} stroke={stroke} strokeWidth={1.5} />
          <rect x={-hw + 3} y={-hh + 16} width={w - 6} height={h - 20} rx={9} fill={color} stroke={stroke} strokeWidth={1.7} />
          <circle cx={0} cy={-4} r={10} fill="#F5A65B" />
          <line x1={-12} y1={16} x2={12} y2={16} stroke={stroke} strokeWidth={1.4} opacity={0.6} />
        </g>
      );

    case 'mist':
      return (
        <g>
          <rect x={-8} y={-hh + 2} width={16} height={16} rx={3} fill="#FFFDF9" stroke={stroke} strokeWidth={1.5} />
          <rect x={-hw + 4} y={-hh + 18} width={w - 8} height={h - 20} rx={12} fill={color} stroke={stroke} strokeWidth={1.7} />
          <rect x={-hw + 8} y={-8} width={w - 16} height={36} rx={4} fill="#FFFDF9" opacity={0.8} />
          <circle cx={0} cy={10} r={7} fill={accentColor} opacity={0.7} />
        </g>
      );

    case 'cream_jar':
      return (
        <g>
          <circle cx={0} cy={0} r={hw - 4} fill={color} stroke={stroke} strokeWidth={1.8} />
          <circle cx={0} cy={0} r={hw - 12} fill="#FFFDF9" stroke={stroke} strokeWidth={1.3} />
          <circle cx={0} cy={0} r={10} fill={accentColor} opacity={0.65} />
        </g>
      );

    case 'cotton_box':
      return (
        <g>
          <rect x={-hw + 3} y={-hh + 3} width={w - 6} height={h - 6} rx={8} fill={color} stroke={stroke} strokeWidth={1.7} />
          <rect x={-hw + 11} y={-hh + 12} width={w - 22} height={h - 24} rx={5} fill="#FFFDF9" stroke={accentColor} strokeWidth={1.3} />
          <circle cx={0} cy={-10} r={11} fill="#FFFDF9" stroke={accentColor} strokeWidth={1.2} />
          <circle cx={0} cy={12} r={11} fill="#FFFDF9" stroke={accentColor} strokeWidth={1.2} />
        </g>
      );

    case 'comb':
      return (
        <g>
          <rect x={-hw + 3} y={-hh + 3} width={w - 6} height={12} rx={6} fill={color} stroke={stroke} strokeWidth={1.6} />
          {Array.from({ length: 14 }).map((_, idx) => {
            const tx = -hw + 14 + idx * ((w - 28) / 13);
            return (
              <line
                key={idx}
                x1={tx}
                y1={-hh + 15}
                x2={tx}
                y2={hh - 4}
                stroke={accentColor}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      );

    case 'marker':
      return (
        <g>
          <polygon points={`0,${-hh + 2} -6,${-hh + 16} 6,${-hh + 16}`} fill={accentColor} stroke={stroke} strokeWidth={1.4} />
          <rect x={-hw + 3} y={-hh + 16} width={w - 6} height={22} rx={3} fill={accentColor} stroke={stroke} strokeWidth={1.5} />
          <rect x={-hw + 2} y={-hh + 38} width={w - 4} height={h - 42} rx={5} fill={color} stroke={stroke} strokeWidth={1.6} />
          <rect x={-5} y={-4} width={10} height={36} rx={3} fill="#FFFDF9" opacity={0.75} />
        </g>
      );

    case 'eraser':
      return (
        <g>
          <rect x={-hw + 3} y={-hh + 3} width={w - 6} height={h - 6} rx={6} fill={accentColor} stroke={stroke} strokeWidth={1.7} />
          <rect x={-hw + 18} y={-hh + 3} width={w - 21} height={h - 6} rx={4} fill={color} stroke={stroke} strokeWidth={1.5} />
          <line x1={-hw + 28} y1={-4} x2={hw - 12} y2={-4} stroke="#FFFDF9" strokeWidth={2} strokeLinecap="round" />
        </g>
      );

    case 'washi_tape':
      return (
        <g>
          <circle cx={0} cy={0} r={hw - 3} fill={color} stroke={stroke} strokeWidth={1.8} />
          <circle cx={0} cy={0} r={13} fill="#FAF7F2" stroke={stroke} strokeWidth={1.5} />
          <circle cx={-15} cy={-8} r={2.5} fill={accentColor} />
          <circle cx={14} cy={10} r={2.5} fill={accentColor} />
          <circle cx={10} cy={-15} r={2.5} fill={accentColor} />
        </g>
      );

    case 'clip_box':
      return (
        <g>
          <rect x={-hw + 3} y={-hh + 3} width={w - 6} height={h - 6} rx={7} fill={color} stroke={stroke} strokeWidth={1.7} />
          <path d="M -14 0 L 10 0 Q 16 0 16 -5 Q 16 -10 10 -10 L -10 -10 Q -15 -10 -15 -6" fill="none" stroke={accentColor} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M -10 8 L 14 8 Q 20 8 20 3" fill="none" stroke={accentColor} strokeWidth={2} strokeLinecap="round" />
        </g>
      );

    case 'teapot':
      return (
        <g>
          <path d={`M ${-hw + 12} 4 Q ${-hw} -6 ${-hw + 6} -14`} fill="none" stroke={stroke} strokeWidth={4} strokeLinecap="round" />
          <path d={`M ${hw - 12} -8 Q ${hw + 2} -4 ${hw - 10} 10`} fill="none" stroke={stroke} strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={0} cy={6} rx={hw - 12} ry={hh - 12} fill={color} stroke={stroke} strokeWidth={1.8} />
          <ellipse cx={0} cy={-16} rx={16} ry={6} fill={accentColor} stroke={stroke} strokeWidth={1.5} />
          <circle cx={0} cy={-24} r={5} fill={color} stroke={stroke} strokeWidth={1.4} />
        </g>
      );

    case 'matcha_bowl':
      return (
        <g>
          <circle cx={0} cy={0} r={hw - 4} fill={color} stroke={stroke} strokeWidth={2} />
          <circle cx={0} cy={0} r={hw - 13} fill={accentColor} stroke={stroke} strokeWidth={1.3} />
          <ellipse cx={-8} cy={-8} rx={10} ry={5} transform="rotate(-25 -8 -8)" fill="#C6DFB7" opacity={0.65} />
        </g>
      );

    case 'whisk':
      return (
        <g>
          <path
            d={`M -16 ${-hh + 4} Q -18 8 -10 14 L 10 14 Q 18 8 16 ${-hh + 4} Z`}
            fill={color}
            stroke={stroke}
            strokeWidth={1.6}
          />
          <line x1={-7} y1={-hh + 6} x2={-5} y2={12} stroke={accentColor} strokeWidth={1.3} />
          <line x1={0} y1={-hh + 6} x2={0} y2={12} stroke={accentColor} strokeWidth={1.3} />
          <line x1={7} y1={-hh + 6} x2={5} y2={12} stroke={accentColor} strokeWidth={1.3} />
          <rect x={-10} y={14} width={20} height={hh - 16} rx={5} fill={accentColor} stroke={stroke} strokeWidth={1.6} />
        </g>
      );

    case 'teacup':
      return (
        <g>
          <circle cx={0} cy={0} r={hw - 4} fill="#F8F4EC" stroke={stroke} strokeWidth={1.6} />
          <circle cx={0} cy={0} r={hw - 10} fill={color} stroke={stroke} strokeWidth={1.4} />
          <circle cx={0} cy={0} r={hw - 15} fill={accentColor} opacity={0.75} />
        </g>
      );

    case 'succulent':
      return (
        <g>
          <path
            d={`M -18 8 L 18 8 L 14 ${hh - 3} L -14 ${hh - 3} Z`}
            fill={accentColor}
            stroke={stroke}
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <rect x={-21} y={3} width={42} height={7} rx={3} fill={accentColor} stroke={stroke} strokeWidth={1.5} />
          <ellipse cx={-12} cy={-6} rx={11} ry={7} transform="rotate(-25 -12 -6)" fill={color} stroke={stroke} strokeWidth={1.4} />
          <ellipse cx={12} cy={-6} rx={11} ry={7} transform="rotate(25 12 -6)" fill={color} stroke={stroke} strokeWidth={1.4} />
          <ellipse cx={0} cy={-14} rx={8} ry={12} fill="#BCE0BE" stroke={stroke} strokeWidth={1.4} />
        </g>
      );
  }
}

// ---------------------------------------------------------------------------
// Cozy Tray & Shelf Backdrop SVG
// ---------------------------------------------------------------------------
function renderTrayBackdrop(level: OrganizerLevelDef, isDark: boolean) {
  const { x, y, width, height } = level.trayRect;

  const trayFill =
    level.trayStyle === 'bento'
      ? isDark
        ? '#3A2E25'
        : '#E8D5BD'
      : level.trayStyle === 'bookshelf'
        ? isDark
          ? '#2D2724'
          : '#EFE6DA'
        : level.trayStyle === 'vanity'
          ? isDark
            ? '#2F2B30'
            : '#F5ECE8'
          : level.trayStyle === 'pouch'
            ? isDark
              ? '#24302C'
              : '#DCE8E2'
            : level.trayStyle === 'stationery'
              ? isDark
                ? '#2F2A22'
                : '#F2E8D5'
              : isDark
                ? '#262D27'
                : '#E6EBDF';

  const trayBorder = isDark ? '#5C5047' : '#C5B5A2';

  return (
    <g>
      {/* Outer Soft Shadow */}
      <rect
        x={x + 4}
        y={y + 8}
        width={width}
        height={height}
        rx={22}
        fill={isDark ? 'rgba(0,0,0,0.45)' : 'rgba(92,74,56,0.12)'}
      />
      {/* Main Tray Body */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={20}
        fill={trayFill}
        stroke={trayBorder}
        strokeWidth={2.5}
      />
      {/* Inner recessed rim */}
      <rect
        x={x + 10}
        y={y + 10}
        width={width - 20}
        height={height - 20}
        rx={14}
        fill={isDark ? '#1E1B18' : '#FAF6F0'}
        fillOpacity={level.trayStyle === 'pouch' ? 0.55 : 0.72}
        stroke={trayBorder}
        strokeWidth={1.2}
        strokeDasharray={level.trayStyle === 'pouch' ? '6 4' : undefined}
      />

      {/* Shelf horizontal planks for bookshelf / stationery */}
      {level.shelfLinesY?.map((sy) => (
        <g key={sy}>
          <rect
            x={x + 14}
            y={sy}
            width={width - 28}
            height={10}
            rx={4}
            fill={isDark ? '#4B3E33' : '#D4BEA3'}
            stroke={trayBorder}
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Subtle center symmetry guide line for symmetry puzzles */}
      {level.symmetryAxisX && (
        <line
          x1={level.symmetryAxisX}
          y1={y + 18}
          x2={level.symmetryAxisX}
          y2={y + height - 18}
          stroke={isDark ? '#78716C' : '#B8A99A'}
          strokeWidth={1.3}
          strokeDasharray="5 5"
          opacity={0.7}
        />
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function AsmrOrganizerGameSection({ theme }: AsmrOrganizerGameSectionProps) {
  const isDark = theme === 'dark';
  const [phase, setPhase] = useState<GamePhase>('TITLE');
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [items, setItems] = useState<OrganizerItemState[]>(() =>
    scrambleLevelItems(ORGANIZER_LEVELS[0])
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  const [showRuleClue, setShowRuleClue] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<OrganizerHint | null>(null);
  const [snapFeedback, setSnapFeedback] = useState<{
    text: string;
    x: number;
    y: number;
    id: number;
  } | null>(null);
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(
    () => loadSavedProgress().completedLevelIds
  );

  // Dragging ref state for zero-lag 60fps pointer dragging
  const svgRef = useRef<SVGSVGElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const dragRef = useRef<{
    itemId: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const topZRef = useRef<number>(40);

  const currentLevel = ORGANIZER_LEVELS[levelIdx];

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const progress = useMemo(
    () => evaluateBoardProgress(currentLevel, items),
    [currentLevel, items]
  );

  const startLevel = useCallback(
    (targetIdx: number) => {
      const clampedIdx = Math.max(0, Math.min(ORGANIZER_LEVELS.length - 1, targetIdx));
      const lvl = ORGANIZER_LEVELS[clampedIdx];
      setLevelIdx(clampedIdx);
      setItems(scrambleLevelItems(lvl, lvl.id * 1337 + Date.now() % 997));
      setSelectedId(null);
      setMoves(0);
      setActiveHint(null);
      setShowRuleClue(false);
      setSnapFeedback(null);
      setDraggingId(null);
      setHoveredSlotId(null);
      setPhase('PLAYING');
    },
    []
  );

  const triggerSnapPop = useCallback((text: string, x: number, y: number) => {
    setSnapFeedback({ text, x, y, id: Date.now() });
  }, []);

  const markLevelClearedIfNeeded = useCallback(
    (nextItems: OrganizerItemState[]) => {
      const evalRes = evaluateBoardProgress(currentLevel, nextItems);
      if (evalRes.isComplete) {
        playAsmrSound(ensureAudio(), 'clear', muted);
        setCompletedLevelIds((prev) => {
          const merged = prev.includes(currentLevel.id) ? prev : [...prev, currentLevel.id];
          saveOrganizerProgress({ completedLevelIds: merged });
          return merged;
        });
        window.setTimeout(() => {
          setPhase('LEVEL_CLEAR');
        }, 320);
      }
    },
    [currentLevel, ensureAudio, muted]
  );

  const rotateItemById = useCallback(
    (itemId: string, delta: 1 | -1 = 1) => {
      const def = currentLevel.items.find((i) => i.id === itemId);
      if (!def) return;

      setItems((prev) => {
        let feedbackText: { text: string; x: number; y: number } | null = null;
        let soundKind: AsmrSoundKind = 'rotate';

        const next = prev.map((it) => {
          if (it.id !== itemId) return it;
          const nextRot = nextRotation(it.rotation, delta);
          const nowCorrect = isItemPlacementCorrect(def, it.snappedSlotId, nextRot);
          if (nowCorrect && !it.isCorrectlyPlaced) {
            soundKind = 'perfect-snap';
            feedbackText = { text: 'Tách! Chuẩn OCD ✨', x: it.x, y: it.y - 34 };
          }
          return {
            ...it,
            rotation: nextRot,
            isCorrectlyPlaced: nowCorrect,
          };
        });

        playAsmrSound(ensureAudio(), soundKind, muted);
        if (feedbackText) {
          const fb = feedbackText as { text: string; x: number; y: number };
          triggerSnapPop(fb.text, fb.x, fb.y);
        }
        setMoves((m) => m + 1);
        setActiveHint(null);
        markLevelClearedIfNeeded(next);
        return next;
      });
    },
    [currentLevel, ensureAudio, markLevelClearedIfNeeded, muted, triggerSnapPop]
  );

  // Keyboard shortcuts (R / Space / E rotate clockwise, Q counter-clockwise)
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!selectedId) return;
      if (e.key === 'r' || e.key === 'R' || e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault();
        rotateItemById(selectedId, 1);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        rotateItemById(selectedId, -1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, rotateItemById, selectedId]);

  // Convert client pointer coordinates -> SVG 760x460 board coordinates accurately across any aspect ratio
  const clientToBoard = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * BOARD_WIDTH;
    const y = ((clientY - rect.top) / Math.max(1, rect.height)) * BOARD_HEIGHT;
    return { x, y };
  }, []);

  const handleItemPointerDown = (
    e: React.PointerEvent<SVGGElement>,
    item: OrganizerItemState
  ) => {
    if (phase !== 'PLAYING') return;
    e.stopPropagation();
    const pt = clientToBoard(e.clientX, e.clientY);
    topZRef.current += 1;

    setSelectedId(item.id);
    setDraggingId(item.id);
    setActiveHint(null);
    playAsmrSound(ensureAudio(), 'pickup', muted);

    dragRef.current = {
      itemId: item.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      offsetX: item.x - pt.x,
      offsetY: item.y - pt.y,
      moved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without capture
    }

    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id ? { ...it, zIndex: topZRef.current, snappedSlotId: null, isCorrectlyPlaced: false } : it
      )
    );
  };

  const handleBoardPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const distScreen = Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY);
    if (distScreen > 5) {
      drag.moved = true;
    }

    const pt = clientToBoard(e.clientX, e.clientY);
    const nx = Math.max(36, Math.min(BOARD_WIDTH - 36, pt.x + drag.offsetX));
    const ny = Math.max(36, Math.min(BOARD_HEIGHT - 36, pt.y + drag.offsetY));

    setItems((prev) =>
      prev.map((it) => (it.id === drag.itemId ? { ...it, x: nx, y: ny } : it))
    );

    // Highlight nearest free slot while hovering
    const occupied = new Set(
      items.filter((i) => i.id !== drag.itemId && i.snappedSlotId !== null).map((i) => i.snappedSlotId!)
    );
    let nearest: string | null = null;
    let bestD = SNAP_RADIUS_PX;
    for (const sl of currentLevel.slots) {
      if (occupied.has(sl.id)) continue;
      const d = Math.hypot(nx - sl.x, ny - sl.y);
      if (d <= bestD) {
        bestD = d;
        nearest = sl.id;
      }
    }
    setHoveredSlotId(nearest);
  };

  const finishDrag = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      setDraggingId(null);
      setHoveredSlotId(null);

      // Pure click without drag => select + rotate 90 deg smoothly if already snapped or tapped
      if (!drag.moved) {
        // Restore snap if it was tapped inside a slot, then rotate!
        const pt = clientToBoard(clientX, clientY);
        setItems((prev) => {
          const target = prev.find((i) => i.id === drag.itemId);
          if (!target) return prev;
          const res = resolveItemDrop(
            currentLevel,
            drag.itemId,
            pt.x + drag.offsetX,
            pt.y + drag.offsetY,
            target.rotation,
            prev
          );
          return prev.map((it) =>
            it.id === drag.itemId
              ? {
                  ...it,
                  x: res.x,
                  y: res.y,
                  snappedSlotId: res.snappedSlotId,
                  isCorrectlyPlaced: res.isCorrect,
                }
              : it
          );
        });
        return;
      }

      const pt = clientToBoard(clientX, clientY);
      const dropX = pt.x + drag.offsetX;
      const dropY = pt.y + drag.offsetY;

      setItems((prev) => {
        const current = prev.find((i) => i.id === drag.itemId);
        if (!current) return prev;
        const res = resolveItemDrop(
          currentLevel,
          drag.itemId,
          dropX,
          dropY,
          current.rotation,
          prev
        );

        const next = prev.map((it) =>
          it.id === drag.itemId
            ? {
                ...it,
                x: res.x,
                y: res.y,
                snappedSlotId: res.snappedSlotId,
                isCorrectlyPlaced: res.isCorrect,
              }
            : it
        );

        if (res.snapKind === 'perfect-ocd') {
          playAsmrSound(ensureAudio(), 'perfect-snap', muted);
          triggerSnapPop('Tách! ✨', res.x, res.y - 34);
        } else if (res.snapKind === 'soft-slot') {
          playAsmrSound(ensureAudio(), 'soft-tap', muted);
        }
        setMoves((m) => m + 1);
        markLevelClearedIfNeeded(next);
        return next;
      });
    },
    [clientToBoard, currentLevel, ensureAudio, markLevelClearedIfNeeded, muted, triggerSnapPop]
  );

  // Clicking an empty slot moves the currently selected item right into it (touch/keyboard friendly!)
  const handleSlotClick = (slot: OrganizerSlotDef) => {
    if (phase !== 'PLAYING' || !selectedId) return;
    const occupied = items.some((i) => i.id !== selectedId && i.snappedSlotId === slot.id);
    if (occupied) return;

    setItems((prev) => {
      const target = prev.find((i) => i.id === selectedId);
      if (!target) return prev;
      const def = currentLevel.items.find((d) => d.id === selectedId);
      if (!def) return prev;
      const perfect = isItemPlacementCorrect(def, slot.id, target.rotation);
      const next = prev.map((it) =>
        it.id === selectedId
          ? {
              ...it,
              x: slot.x,
              y: slot.y,
              snappedSlotId: slot.id,
              isCorrectlyPlaced: perfect,
            }
          : it
      );

      if (perfect) {
        playAsmrSound(ensureAudio(), 'perfect-snap', muted);
        triggerSnapPop('Tách! ✨', slot.x, slot.y - 34);
      } else {
        playAsmrSound(ensureAudio(), 'soft-tap', muted);
      }
      setMoves((m) => m + 1);
      setActiveHint(null);
      markLevelClearedIfNeeded(next);
      return next;
    });
  };

  const handleRequestHint = () => {
    const hint = getSmartHint(currentLevel, items);
    setActiveHint(hint);
    if (hint) {
      setSelectedId(hint.itemId);
      playAsmrSound(ensureAudio(), 'pickup', muted);
    }
  };

  // Sort items by zIndex for painter's order rendering
  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.zIndex - b.zIndex),
    [items]
  );

  const selectedDef = useMemo(
    () => currentLevel.items.find((d) => d.id === selectedId) ?? null,
    [currentLevel.items, selectedId]
  );

  const surfaceClass = isDark
    ? 'bg-[#1D1A18] text-[#F2EDE6] border-[#38322E]'
    : 'bg-[#FAF7F2] text-[#3F362E] border-[#E4DDD3]';
  const subSurfaceClass = isDark
    ? 'bg-[#26221F] border-[#3D3631]'
    : 'bg-[#F2ECE2] border-[#E0D7C9]';

  // -------------------------------------------------------------------------
  // Render Title Screen
  // -------------------------------------------------------------------------
  if (phase === 'TITLE') {
    return (
      <section
        id="asmr-organizer-section"
        aria-label="Sắp Xếp Góc Nhỏ Chuẩn OCD — ASMR Aesthetic Organizer"
        className={`rounded-2xl border p-5 sm:p-8 mobile-ls:p-3 shadow-sm transition-colors ${surfaceClass}`}
      >
        <div className="grid grid-cols-1 mobile-ls:grid-cols-12 lg:grid-cols-12 gap-6 mobile-ls:gap-3 lg:gap-8 items-center">
          {/* Left Column: Title, Rules & 6 Cozy Scenes */}
          <div className="mobile-ls:col-span-7 lg:col-span-7 space-y-5 mobile-ls:space-y-2.5">
            <div className="space-y-2 mobile-ls:space-y-1">
              <p className="text-xs font-medium tracking-wide text-[#6E8B74] dark:text-[#9FC0A5] mobile-ls:hidden">
                ASMR Aesthetic Organizer · 6 Góc Nhỏ Pastel · Hít Nhẹ Chuẩn OCD
              </p>
              <h1 className="text-3xl sm:text-4xl mobile-ls:text-xl font-bold tracking-tight [text-wrap:balance]">
                Sắp Xếp Góc Nhỏ &ldquo;Chuẩn OCD&rdquo;
              </h1>
              <p className="text-sm sm:text-base mobile-ls:text-xs text-[#6D635A] dark:text-[#BEB5AB] leading-relaxed mobile-ls:line-clamp-2">
                Kéo thả, xoay góc <strong className="font-semibold">90°</strong> và tìm quy luật ẩn
                tinh tế — từ hộp cơm bento, giá sách tăng dần chiều cao, khay mỹ phẩm đối xứng
                đến dải màu bút pastel. Đặt đúng khớp sẽ hít nhẹ kèm tiếng tách ASMR thư giãn.
              </p>
            </div>

            {/* 6 Cozy Scenes Grid */}
            <div className="space-y-2 mobile-ls:space-y-1">
              <p className="text-xs font-medium text-[#7A6F64] dark:text-[#A99F95]">
                Chọn góc nhỏ cần dọn dẹp ({completedLevelIds.length}/{ORGANIZER_LEVELS.length} đã hoàn thành)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mobile-ls:gap-1.5">
                {ORGANIZER_LEVELS.map((lvl, idx) => {
                  const isSelected = idx === levelIdx;
                  const isCleared = completedLevelIds.includes(lvl.id);
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setLevelIdx(idx)}
                      className={`text-left px-3.5 py-2.5 mobile-ls:px-2.5 mobile-ls:py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#6B8E78] text-white border-[#587964] shadow-sm'
                          : isDark
                            ? 'bg-[#26221F] border-[#3D3631] hover:border-[#6B8E78] text-[#EDE7DF]'
                            : 'bg-white border-[#E4DDD3] hover:border-[#6B8E78] text-[#3F362E]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs opacity-85">
                        <span>Màn {lvl.id} · {lvl.ruleTag}</span>
                        {isCleared && (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-label="Đã dọn xong" />
                        )}
                      </div>
                      <p className="text-sm mobile-ls:text-xs font-semibold mt-0.5 truncate">{lvl.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                data-testid="asmr-start-btn"
                onClick={() => startLevel(levelIdx)}
                className="inline-flex items-center gap-2 px-6 py-3 mobile-ls:py-2 rounded-xl bg-[#6B8E78] hover:bg-[#5B7D67] text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Bắt Đầu Dọn Góc {levelIdx + 1}</span>
              </button>
              <span className="text-xs text-[#7A6F64] dark:text-[#A99F95] mobile-ls:hidden">
                Kéo thả món đồ · Nhấp hoặc bấm R để xoay 90°
              </span>
            </div>
          </div>

          {/* Right Column: Minimalist Pastel Preview Card */}
          <div className="mobile-ls:col-span-5 lg:col-span-5">
            <div className={`rounded-2xl border p-5 mobile-ls:p-3 space-y-4 mobile-ls:space-y-2 ${subSurfaceClass}`}>
              <svg
                viewBox="0 0 360 230"
                className="w-full h-auto rounded-xl border border-[#DFD6C9] dark:border-[#3D3631]"
                role="img"
                aria-label="Minh họa hộp cơm bento và dải bút màu pastel"
              >
                <rect width="360" height="230" fill={isDark ? '#1D1A18' : '#FAF6EE'} />
                {/* Cedar Bento Outline */}
                <rect x="34" y="24" width="292" height="182" rx="18" fill={isDark ? '#3A2E25' : '#E7D3BA'} stroke="#B59F87" strokeWidth="2" />
                <rect x="44" y="34" width="272" height="162" rx="12" fill={isDark ? '#25201C' : '#FAF6F0'} />
                {/* Pastel Bento Elements */}
                <g transform="translate(105, 88)">
                  <path d="M 0 -30 Q 30 22 24 26 Q 0 30 -24 26 Q -30 22 0 -30 Z" fill="#FFFDF8" stroke="#4A4038" strokeWidth="1.6" />
                  <rect x="-12" y="8" width="24" height="18" rx="3" fill="#374151" />
                </g>
                <g transform="translate(225, 76)">
                  <rect x="-50" y="-22" width="100" height="44" rx="12" fill="#F4A28C" stroke="#4A4038" strokeWidth="1.6" />
                  <path d="M -20 -16 Q -10 0 -20 16 M 10 -16 Q 20 0 10 16" fill="none" stroke="#FFF4EB" strokeWidth="2.5" strokeLinecap="round" />
                </g>
                {/* Pastel Color Swatches / Markers */}
                {['#F2A3A8', '#F5C29B', '#F3DF99', '#B8DEC8', '#B1D6EA', '#D5BFE8'].map((hex, i) => (
                  <rect
                    key={hex}
                    x={168 + i * 21}
                    y={122}
                    width={15}
                    height={56}
                    rx={4}
                    fill={hex}
                    stroke="#4A4038"
                    strokeWidth={1.3}
                  />
                ))}
                {/* Tamago */}
                <rect x="65" y="132" width="76" height="42" rx="10" fill="#F6DC8C" stroke="#4A4038" strokeWidth="1.5" />
              </svg>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[#6E8B74] dark:text-[#9FC0A5]">
                  {currentLevel.code} · {currentLevel.ruleTag}
                </p>
                <h2 className="text-base font-bold">{currentLevel.title}</h2>
                <p className="text-xs text-[#6D635A] dark:text-[#BEB5AB] leading-relaxed">
                  {currentLevel.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------------------
  // Render Active Play & Completion Modal
  // -------------------------------------------------------------------------
  return (
    <section
      id="asmr-organizer-section"
      aria-label="Không gian sắp xếp ASMR Chuẩn OCD"
      className={`relative rounded-2xl border p-3.5 sm:p-5 mobile-ls:p-2 shadow-sm transition-colors ${surfaceClass}`}
    >
      {/* Top Unobtrusive HUD */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mobile-ls:flex-row mobile-ls:items-center mobile-ls:justify-between gap-2.5 mobile-ls:gap-1.5 pb-3 mobile-ls:pb-1.5 border-b border-[#E4DDD3] dark:border-[#38322E]">
        <div className="flex flex-wrap items-center gap-3 mobile-ls:gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setPhase('TITLE')}
            className={`min-h-[40px] mobile-ls:min-h-[34px] px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${subSurfaceClass} hover:border-[#6B8E78]`}
          >
            Chọn Màn ({levelIdx + 1}/{ORGANIZER_LEVELS.length})
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base mobile-ls:text-xs font-bold truncate">{currentLevel.title}</h2>
            <p className="text-xs text-[#6D635A] dark:text-[#BEB5AB] truncate mobile-ls:hidden">
              Quy luật: {currentLevel.ruleTag}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mobile-ls:gap-1.5">
          {/* Tabular Progress & Moves */}
          <div className={`min-h-[40px] mobile-ls:min-h-[34px] inline-flex items-center px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg border text-xs font-medium tabular-nums ${subSurfaceClass}`}>
            Khớp chuẩn:{' '}
            <strong className="text-[#567A63] dark:text-[#9FC0A5] ml-1">
              {progress.correctCount}/{progress.totalCount}
            </strong>
            <span className="mx-2 opacity-40" aria-hidden="true">·</span>
            Thao tác: <strong className="ml-1">{moves}</strong>
          </div>

          <button
            type="button"
            onClick={() => setShowRuleClue((v) => !v)}
            className={`min-h-[40px] mobile-ls:min-h-[34px] inline-flex items-center gap-1.5 px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              showRuleClue
                ? 'bg-[#6B8E78] text-white border-[#587964]'
                : `${subSurfaceClass} hover:border-[#6B8E78]`
            }`}
          >
            {showRuleClue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Quy luật ẩn</span>
          </button>

          <button
            type="button"
            data-testid="asmr-hint-btn"
            onClick={handleRequestHint}
            className={`min-h-[40px] mobile-ls:min-h-[34px] inline-flex items-center gap-1.5 px-3 mobile-ls:px-2 py-1.5 mobile-ls:py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${subSurfaceClass} hover:border-[#C59B6D]`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#C59B6D]" aria-hidden="true" />
            <span>Gợi ý 1 món</span>
          </button>

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Bật âm thanh ASMR' : 'Tắt âm thanh ASMR'}
            className={`min-w-[40px] min-h-[40px] mobile-ls:min-w-[34px] mobile-ls:min-h-[34px] p-2 mobile-ls:p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${subSurfaceClass} hover:border-[#6B8E78]`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#6B8E78]" />}
          </button>

          <button
            type="button"
            onClick={() => startLevel(levelIdx)}
            aria-label="Xáo trộn lại màn này"
            className={`min-w-[40px] min-h-[40px] mobile-ls:min-w-[34px] mobile-ls:min-h-[34px] p-2 mobile-ls:p-1.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${subSurfaceClass} hover:border-[#6B8E78]`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Optional Rule Clue / Smart Hint Banner */}
      {(showRuleClue || activeHint) && (
        <div className={`mt-2.5 px-3.5 py-2 rounded-xl border text-xs leading-relaxed ${subSurfaceClass}`}>
          {showRuleClue && (
            <p>
              <strong className="font-semibold text-[#567A63] dark:text-[#9FC0A5]">Quy luật màn {currentLevel.id}: </strong>
              {currentLevel.ruleClue}
            </p>
          )}
          {activeHint && (
            <p className={showRuleClue ? 'mt-1' : ''}>
              <strong className="font-semibold text-[#B8854C] dark:text-[#E5B883]">Gợi ý vị trí: </strong>
              {activeHint.message}
            </p>
          )}
        </div>
      )}

      {/* Main Cozy Organizer SVG Board */}
      <div className="mt-2.5 mobile-ls:mt-1.5 relative flex justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={(e) => finishDrag(e.clientX, e.clientY)}
          onPointerCancel={(e) => finishDrag(e.clientX, e.clientY)}
          onClick={() => setSelectedId(null)}
          className={`w-full max-w-[780px] mobile-ls:max-w-[min(100%,calc((100dvh-110px)*1.652))] aspect-[760/460] h-auto rounded-2xl border select-none touch-none ${
            isDark
              ? 'bg-[#171412] border-[#38322E]'
              : 'bg-[#F5EFE6] border-[#E0D6C7]'
          }`}
          role="application"
          aria-label={`Bảng sắp xếp ${currentLevel.title}`}
        >
          {/* Subtle Cozy Linen Dot Pattern */}
          <defs>
            <pattern id="cozy-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle
                cx="12"
                cy="12"
                r="1"
                fill={isDark ? '#322C27' : '#DDD2C3'}
              />
            </pattern>
          </defs>
          <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#cozy-dots)" />

          {/* Staging Side Margin Labels */}
          <text
            x={78}
            y={30}
            textAnchor="middle"
            fontSize="11"
            fill={isDark ? '#78716C' : '#9C8F80'}
          >
            Đồ đang chờ xếp
          </text>
          <text
            x={BOARD_WIDTH - 78}
            y={30}
            textAnchor="middle"
            fontSize="11"
            fill={isDark ? '#78716C' : '#9C8F80'}
          >
            Đồ đang chờ xếp
          </text>

          {/* Tray / Shelf / Pouch Backdrop */}
          {renderTrayBackdrop(currentLevel, isDark)}

          {/* Snap-to-grid Slots */}
          {currentLevel.slots.map((slot) => {
            const occupyingItem = items.find((i) => i.snappedSlotId === slot.id);
            const isHovered = hoveredSlotId === slot.id;
            const isHintTarget = activeHint?.targetSlotId === slot.id;
            const isPerfectOccupied = occupyingItem?.isCorrectlyPlaced ?? false;

            return (
              <g
                key={slot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSlotClick(slot);
                }}
                style={{ cursor: selectedId && !occupyingItem ? 'pointer' : 'default' }}
              >
                <rect
                  x={slot.x - slot.width / 2}
                  y={slot.y - slot.height / 2}
                  width={slot.width}
                  height={slot.height}
                  rx={10}
                  fill={
                    isPerfectOccupied
                      ? isDark
                        ? 'rgba(111, 156, 127, 0.14)'
                        : 'rgba(107, 142, 120, 0.12)'
                      : isHovered || isHintTarget
                        ? isDark
                          ? 'rgba(197, 155, 109, 0.2)'
                          : 'rgba(107, 142, 120, 0.18)'
                        : isDark
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(140, 120, 98, 0.06)'
                  }
                  stroke={
                    isPerfectOccupied
                      ? '#6B8E78'
                      : isHovered || isHintTarget
                        ? '#C59B6D'
                        : isDark
                          ? '#4D443D'
                          : '#CFC2B2'
                  }
                  strokeWidth={isHovered || isHintTarget || isPerfectOccupied ? 1.8 : 1.1}
                  strokeDasharray={isPerfectOccupied ? undefined : '4 4'}
                />
              </g>
            );
          })}

          {/* Interactive Draggable & Rotatable Pastel Items */}
          {orderedItems.map((itemState) => {
            const def = currentLevel.items.find((d) => d.id === itemState.id);
            if (!def) return null;

            const isDragging = draggingId === itemState.id;
            const isSelected = selectedId === itemState.id;
            const isHintItem = activeHint?.itemId === itemState.id;
            const scale = isDragging ? 1.07 : 1;

            return (
              <g
                key={itemState.id}
                data-item-id={itemState.id}
                transform={`translate(${itemState.x}, ${itemState.y}) scale(${scale})`}
                onPointerDown={(e) => handleItemPointerDown(e, itemState)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  rotateItemById(itemState.id, 1);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  rotateItemById(itemState.id, 1);
                }}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              >
                {/* Drop shadow when picked up */}
                {isDragging && (
                  <ellipse
                    cx={0}
                    cy={def.height / 2 + 6}
                    rx={def.width * 0.44}
                    ry={7}
                    fill="rgba(0,0,0,0.22)"
                  />
                )}

                {/* Selection / Hint / Perfect Glow Ring */}
                {(isSelected || isHintItem) && (
                  <rect
                    x={-def.width / 2 - 6}
                    y={-def.height / 2 - 6}
                    width={def.width + 12}
                    height={def.height + 12}
                    rx={12}
                    transform={`rotate(${itemState.rotation})`}
                    fill="none"
                    stroke={isHintItem ? '#D69F4E' : '#6B8E78'}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                  />
                )}

                {/* Item Vector Illustration rotated around its center */}
                <g transform={`rotate(${itemState.rotation})`}>
                  {renderPastelItemSvg(def)}
                </g>

                {/* Crisp OCD Check indicator on correctly snapped item */}
                {itemState.isCorrectlyPlaced && !isDragging && (
                  <g transform={`translate(${def.width / 2 - 4}, ${-def.height / 2 + 4})`}>
                    <circle r={7.5} fill="#6B8E78" stroke="#FAF7F2" strokeWidth={1.5} />
                    <path
                      d="M -3 0 L -1 2.5 L 3.5 -2.5"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
              </g>
            );
          })}

          {/* Ephemeral ASMR Snap Pop Toast inside SVG */}
          {snapFeedback && (
            <g key={snapFeedback.id} transform={`translate(${snapFeedback.x}, ${snapFeedback.y})`}>
              <rect
                x={-54}
                y={-13}
                width={108}
                height={24}
                rx={12}
                fill="#6B8E78"
              />
              <text
                x={0}
                y={3}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#FFFFFF"
              >
                {snapFeedback.text}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Item Controls & Rotate Bar */}
      <div className="sticky bottom-2 z-20 sm:static mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-2.5 sm:p-0 sm:pt-2.5 rounded-xl sm:rounded-none border sm:border-0 sm:border-t border-[#E4DDD3] dark:border-[#38322E] bg-[#FAF7F2]/95 dark:bg-[#221E1B]/95 sm:bg-transparent sm:dark:bg-transparent shadow-lg sm:shadow-none">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="asmr-rotate-left-btn"
            disabled={!selectedId}
            onClick={() => selectedId && rotateItemById(selectedId, -1)}
            className={`min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedId
                ? `${subSurfaceClass} hover:border-[#6B8E78] cursor-pointer`
                : 'opacity-45 cursor-not-allowed border-transparent'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Xoay -90° [Q]</span>
          </button>
          <button
            type="button"
            data-testid="asmr-rotate-right-btn"
            disabled={!selectedId}
            onClick={() => selectedId && rotateItemById(selectedId, 1)}
            className={`min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedId
                ? 'bg-[#6B8E78] hover:bg-[#5B7D67] text-white border-[#587964] cursor-pointer'
                : 'opacity-45 cursor-not-allowed border-transparent'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Xoay +90° [R]</span>
          </button>
          {selectedId && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className={`min-h-[44px] sm:hidden inline-flex items-center justify-center px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer whitespace-nowrap shrink-0 ${subSurfaceClass}`}
            >
              Bỏ chọn
            </button>
          )}

          <span className="text-xs text-[#6D635A] dark:text-[#BEB5AB] w-full sm:w-auto">
            {selectedDef
              ? `Đang chọn: ${selectedDef.name} (${items.find((i) => i.id === selectedDef.id)?.rotation ?? 0}°)`
              : 'Nhấp chọn đồ vật để xoay hoặc kéo thẳng vào khay'}
          </span>
        </div>

        {/* Subtle Progress Bar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#6D635A] dark:text-[#BEB5AB] tabular-nums">
            {Math.round(progress.progressRatio * 100)}%
          </span>
          <div className="w-28 h-2 rounded-full bg-[#E4DDD3] dark:bg-[#38322E] overflow-hidden">
            <div
              className="h-full bg-[#6B8E78] transition-all duration-200"
              style={{ width: `${Math.round(progress.progressRatio * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cozy Level Clear Modal */}
      {phase === 'LEVEL_CLEAR' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hoàn thành sắp xếp chuẩn OCD"
          className="absolute inset-0 z-20 rounded-2xl bg-[#1D1A18]/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-6 text-center space-y-4 shadow-xl ${surfaceClass}`}>
            <div className="mx-auto w-12 h-12 rounded-full bg-[#6B8E78]/15 text-[#6B8E78] flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#6E8B74] dark:text-[#9FC0A5]">
                Chuẩn OCD Tuyệt Đối · {currentLevel.code}
              </p>
              <h3 className="text-xl font-bold">{currentLevel.title} Gọn Gàng!</h3>
              <p className="text-xs sm:text-sm text-[#6D635A] dark:text-[#BEB5AB]">
                Bạn đã hoàn tất toàn bộ {progress.totalCount} món đồ trong {moves} thao tác.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => startLevel(levelIdx)}
                className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${subSurfaceClass} hover:border-[#6B8E78]`}
              >
                Chơi Lại Màn Này
              </button>
              {levelIdx + 1 < ORGANIZER_LEVELS.length ? (
                <button
                  type="button"
                  data-testid="asmr-next-level-btn"
                  onClick={() => startLevel(levelIdx + 1)}
                  className="px-5 py-2 rounded-xl bg-[#6B8E78] hover:bg-[#5B7D67] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Dọn Góc Tiếp ({levelIdx + 2}/{ORGANIZER_LEVELS.length}) →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPhase('TITLE')}
                  className="px-5 py-2 rounded-xl bg-[#6B8E78] hover:bg-[#5B7D67] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Về Danh Sách 6 Góc Nhỏ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
