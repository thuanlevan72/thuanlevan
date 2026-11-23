import { Piano, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Note } from 'tonal';
import {
  COMPUTER_KEY_TO_MIDI,
  getScaleNotes,
  midiToNoteName,
  resolvePianistVoicing,
} from '../utils/lyricGrooveEngine.ts';

interface GrandPianoKeyboardProps {
  keyRoot: string;
  scaleMode: 'major' | 'minor';
  highlightedChordSymbol: string | null;
  voicingShift?: number;
  sustainPedal: boolean;
  playMode: 'solo' | 'chord';
  onTogglePlayMode: (mode: 'solo' | 'chord') => void;
  recordToRoll: boolean;
  onToggleRecordToRoll: () => void;
  onNoteTrigger: (midi: number) => void;
  onAuditionActiveChord?: () => void;
  liveChordMidis?: number[];
  liveMelodyMidis?: number[];
  liveChordSymbol?: string | null;
}

interface PianoKeySpec {
  midi: number;
  name: string;
  isBlack: boolean;
  whiteIndex: number;
  shortcutLabel?: string;
}

const SHORTCUT_BY_MIDI: Record<number, string> = Object.entries(
  COMPUTER_KEY_TO_MIDI
).reduce<Record<number, string>>((acc, [key, midi]) => {
  acc[midi] = key.toUpperCase();
  return acc;
}, {});

const BLACK_CHROMAS = new Set([1, 3, 6, 8, 10]);

function buildPianoKeys(startMidi = 48, endMidi = 72): {
  whiteKeys: PianoKeySpec[];
  blackKeys: PianoKeySpec[];
} {
  const whiteKeys: PianoKeySpec[] = [];
  const blackKeys: PianoKeySpec[] = [];
  let whiteCounter = 0;

  for (let midi = startMidi; midi <= endMidi; midi++) {
    const chroma = ((midi % 12) + 12) % 12;
    const isBlack = BLACK_CHROMAS.has(chroma);
    const spec: PianoKeySpec = {
      midi,
      name: midiToNoteName(midi),
      isBlack,
      whiteIndex: isBlack ? whiteCounter - 1 : whiteCounter,
      shortcutLabel: SHORTCUT_BY_MIDI[midi],
    };
    if (isBlack) {
      blackKeys.push(spec);
    } else {
      whiteKeys.push(spec);
      whiteCounter += 1;
    }
  }

  return { whiteKeys, blackKeys };
}

function projectMidiToVisibleRange(midi: number): number {
  let mapped = midi;
  while (mapped < 48) mapped += 12;
  while (mapped > 72) mapped -= 12;
  return mapped;
}

export function GrandPianoKeyboard({
  keyRoot,
  scaleMode,
  highlightedChordSymbol,
  voicingShift = 0,
  sustainPedal,
  playMode,
  onTogglePlayMode,
  recordToRoll,
  onToggleRecordToRoll,
  onNoteTrigger,
  onAuditionActiveChord,
  liveChordMidis = [],
  liveMelodyMidis = [],
  liveChordSymbol = null,
}: GrandPianoKeyboardProps) {
  const [pressedMidis, setPressedMidis] = useState<number[]>([]);
  const pressTimersRef = useRef<Map<number, number>>(new Map());

  const { whiteKeys, blackKeys } = useMemo(() => buildPianoKeys(48, 72), []);

  const scaleChromas = useMemo(() => {
    const notes = getScaleNotes(keyRoot, scaleMode);
    return new Set(
      notes.map((n) => Note.chroma(n)).filter((c): c is number => typeof c === 'number')
    );
  }, [keyRoot, scaleMode]);

  const effectiveChordSymbol = liveChordSymbol ?? highlightedChordSymbol;

  const activeVoicing = useMemo(() => {
    if (!effectiveChordSymbol) return null;
    const resolved = resolvePianistVoicing(effectiveChordSymbol, voicingShift);
    return resolved.valid ? resolved : null;
  }, [effectiveChordSymbol, voicingShift]);

  const liveMelodyVisibleSet = useMemo(() => {
    const set = new Set<number>();
    liveMelodyMidis.forEach((m) => set.add(projectMidiToVisibleRange(m)));
    return set;
  }, [liveMelodyMidis]);

  const liveChordVisibleSet = useMemo(() => {
    const set = new Set<number>();
    liveChordMidis.forEach((m) => set.add(projectMidiToVisibleRange(m)));
    return set;
  }, [liveChordMidis]);

  const liveMelodyNoteLabels = useMemo(
    () => liveMelodyMidis.map((m) => midiToNoteName(m)),
    [liveMelodyMidis]
  );

  // Map chord notes onto visible C3..C5 keys (projecting C2 bass into C3 octave badge)
  const { chordBassVisibleMidis, chordRightMidis } = useMemo(() => {
    const bassSet = new Set<number>();
    const rhSet = new Set<number>();
    if (!activeVoicing) {
      return { chordBassVisibleMidis: bassSet, chordRightMidis: rhSet };
    }
    activeVoicing.bassMidis.forEach((m) => {
      let mapped = m;
      while (mapped < 48) mapped += 12;
      if (mapped <= 72) bassSet.add(mapped);
    });
    activeVoicing.rightHandMidis.forEach((m) => {
      rhSet.add(projectMidiToVisibleRange(m));
    });
    return { chordBassVisibleMidis: bassSet, chordRightMidis: rhSet };
  }, [activeVoicing]);

  const triggerVisualAndAudio = useCallback(
    (midi: number) => {
      onNoteTrigger(midi);
      setPressedMidis((prev) => (prev.includes(midi) ? prev : [...prev, midi]));
      const prevTimer = pressTimersRef.current.get(midi);
      if (prevTimer) window.clearTimeout(prevTimer);
      const nextTimer = window.setTimeout(() => {
        setPressedMidis((prev) => prev.filter((m) => m !== midi));
        pressTimersRef.current.delete(midi);
      }, 220);
      pressTimersRef.current.set(midi, nextTimer);
    },
    [onNoteTrigger]
  );

  // Computer keyboard piano input (Z..M = C3..B3, Q..I = C4..C5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const mapped = COMPUTER_KEY_TO_MIDI[e.key.toLowerCase()];
      if (typeof mapped === 'number') {
        e.preventDefault();
        triggerVisualAndAudio(mapped);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      pressTimersRef.current.forEach((tid) => window.clearTimeout(tid));
      pressTimersRef.current.clear();
    };
  }, [triggerVisualAndAudio]);

  const totalWhite = whiteKeys.length; // 15

  return (
    <div
      data-testid="grand-piano-keyboard"
      className="rounded-lg border border-[#DCE6F2] dark:border-[#1B2B46] bg-[#FAFBFD] dark:bg-[#070D19] p-3 space-y-2.5"
    >
      {/* Keyboard Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span
            title={sustainPedal ? 'Sustain Pedal đang ngân âm' : 'Sustain Pedal đang tắt'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] whitespace-nowrap"
          >
            <Piano className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            <span>Grand Piano 2 Quãng Tám (C3–C5)</span>
          </span>

          {activeVoicing ? (
            <button
              type="button"
              onClick={onAuditionActiveChord}
              title={`Nghe lại thế bấm hợp âm Grand Piano (${sustainPedal ? 'Pedal Ngân' : 'Pedal Khô'})`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#CBD8E6] dark:border-[#1F3557] bg-white dark:bg-[#0C1628] text-[11px] font-mono text-[#0369A1] dark:text-[#38BDF8] hover:border-[#0284C7] transition-colors cursor-pointer"
            >
              <Volume2 className="w-3 h-3" aria-hidden="true" />
              <span className="font-bold">{activeVoicing.normalizedSymbol}</span>
              <span className="text-[#475569] dark:text-[#94A3B8]">
                ({activeVoicing.bassNote} + {activeVoicing.notes.join(' ')})
              </span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#475569] dark:text-[#94A3B8]">
              Bấm phím đàn hoặc gõ Z–M / Q–I
            </span>
          )}

          {liveMelodyNoteLabels.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/12 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
              ♪ {liveMelodyNoteLabels.join(' ')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 rounded-md bg-[#EFF4FA] dark:bg-[#0C1628] border border-[#CBD8E6] dark:border-[#1F3557]">
            <button
              type="button"
              data-testid="piano-mode-solo"
              onClick={() => onTogglePlayMode('solo')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                playMode === 'solo'
                  ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                  : 'text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              Solo Nốt
            </button>
            <button
              type="button"
              data-testid="piano-mode-chord"
              onClick={() => onTogglePlayMode('chord')}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                playMode === 'chord'
                  ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                  : 'text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              Hợp Âm 1 Phím
            </button>
          </div>

          <button
            type="button"
            data-testid="piano-record-toggle"
            onClick={onToggleRecordToRoll}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              recordToRoll
                ? 'border-rose-500 bg-rose-600 text-white'
                : 'border-[#CBD8E6] dark:border-[#1F3557] bg-white dark:bg-[#0C1628] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
            }`}
          >
            {recordToRoll ? 'Đang ghi Roll' : 'Ghi vào Roll'}
          </button>
        </div>
      </div>

      {/* Piano Keybed */}
      <div className="relative rounded-md overflow-hidden border border-[#1E293B]/25 dark:border-[#1F3557] bg-[#141923] pt-1.5 px-1 pb-1 select-none">
        {/* Mahogany/felt top rail accent */}
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-[#581C1C] via-[#7F1D1D] to-[#581C1C] rounded-xs mb-1"
        />

        <div className="relative h-28 sm:h-32 w-full flex">
          {/* White Ivory Keys */}
          {whiteKeys.map((k) => {
            const isPressed = pressedMidis.includes(k.midi);
            const isLiveMel = liveMelodyVisibleSet.has(k.midi);
            const isLiveChd = liveChordVisibleSet.has(k.midi);
            const isChordRh = chordRightMidis.has(k.midi);
            const isChordBass = chordBassVisibleMidis.has(k.midi);
            const chroma = ((k.midi % 12) + 12) % 12;
            const inScale = scaleChromas.has(chroma);

            let bgClass =
              'bg-gradient-to-b from-[#FFFFFF] to-[#F1F5F9] hover:from-[#F8FAFC] hover:to-[#E2E8F0] text-[#334155]';
            if (isPressed || isLiveMel) {
              bgClass =
                'bg-gradient-to-b from-[#A7F3D0] to-[#34D399] text-[#064E3B] translate-y-[1.5px]';
            } else if (isLiveChd) {
              bgClass =
                'bg-gradient-to-b from-[#BAE6FD] to-[#38BDF8] text-[#082F49] translate-y-[1px]';
            } else if (isChordRh) {
              bgClass =
                'bg-gradient-to-b from-[#E0F2FE] to-[#BAE6FD] text-[#0369A1]';
            } else if (isChordBass) {
              bgClass =
                'bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A] text-[#92400E]';
            }

            return (
              <button
                key={k.midi}
                type="button"
                data-testid={`piano-key-${k.midi}`}
                aria-label={`Phím Piano ${k.name}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  triggerVisualAndAudio(k.midi);
                }}
                className={`relative flex-1 h-full border-r border-[#CBD5E1] last:border-r-0 rounded-b-[4px] flex flex-col items-center justify-end pb-1.5 transition-all cursor-pointer ${bgClass}`}
              >
                {/* Scale tone / live indicator dot */}
                {inScale && !isChordRh && !isChordBass && !isLiveMel && !isLiveChd && (
                  <span
                    aria-hidden="true"
                    className="w-1 h-1 rounded-full bg-[#0284C7]/45 mb-1"
                  />
                )}
                {(isChordRh || isChordBass || isLiveMel || isLiveChd) && (
                  <span
                    aria-hidden="true"
                    className={`w-1.5 h-1.5 rounded-full mb-1 ${
                      isLiveMel
                        ? 'bg-emerald-800'
                        : isChordBass
                        ? 'bg-amber-600'
                        : 'bg-[#0284C7]'
                    }`}
                  />
                )}
                <span className="font-mono text-[9px] font-semibold leading-none">
                  {k.name.startsWith('C') ? k.name : k.name.replace(/\d/, '')}
                </span>
                {k.shortcutLabel && (
                  <span className="hidden sm:inline font-mono text-[8px] opacity-55 mt-0.5 leading-none">
                    {k.shortcutLabel}
                  </span>
                )}
              </button>
            );
          })}

          {/* Black Ebony Keys Overlay */}
          {blackKeys.map((k) => {
            const isPressed = pressedMidis.includes(k.midi);
            const isLiveMel = liveMelodyVisibleSet.has(k.midi);
            const isLiveChd = liveChordVisibleSet.has(k.midi);
            const isChordRh = chordRightMidis.has(k.midi);
            const isChordBass = chordBassVisibleMidis.has(k.midi);
            const leftPercent = ((k.whiteIndex + 1) / totalWhite) * 100;
            const widthPercent = (0.62 / totalWhite) * 100;

            let bgClass =
              'bg-gradient-to-b from-[#334155] via-[#1E293B] to-[#0F172A] border-[#090D16] text-[#CBD5E1]';
            if (isPressed || isLiveMel) {
              bgClass =
                'bg-gradient-to-b from-[#10B981] to-[#047857] border-[#6EE7B7] text-white translate-y-[1.5px]';
            } else if (isLiveChd) {
              bgClass =
                'bg-gradient-to-b from-[#0284C7] to-[#0369A1] border-[#38BDF8] text-white translate-y-[1px]';
            } else if (isChordRh) {
              bgClass =
                'bg-gradient-to-b from-[#0369A1] to-[#075985] border-[#38BDF8] text-white';
            } else if (isChordBass) {
              bgClass =
                'bg-gradient-to-b from-[#B45309] to-[#78350F] border-[#FBBF24] text-amber-100';
            }

            return (
              <button
                key={k.midi}
                type="button"
                data-testid={`piano-key-${k.midi}`}
                aria-label={`Phím Piano ${k.name}`}
                style={{
                  left: `calc(${leftPercent.toFixed(4)}% - ${(widthPercent / 2).toFixed(4)}%)`,
                  width: `${widthPercent.toFixed(4)}%`,
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  triggerVisualAndAudio(k.midi);
                }}
                className={`absolute top-0 h-[62%] z-10 rounded-b-[3px] border border-t-0 shadow-md flex flex-col items-center justify-end pb-1 transition-all cursor-pointer ${bgClass}`}
              >
                {(isChordRh || isChordBass || isLiveMel || isLiveChd) && (
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-white/95 mb-0.5"
                  />
                )}
                {k.shortcutLabel && (
                  <span className="hidden sm:inline font-mono text-[8px] opacity-70 leading-none">
                    {k.shortcutLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
