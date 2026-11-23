import { ChevronLeft, ChevronRight, Piano, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Note } from 'tonal';
import {
  getScaleNotes,
  getShortcutLabelsForOctave,
  midiToNoteName,
  PIANO_MAX_MIDI,
  PIANO_MIN_MIDI,
  resolveComputerKeyToMidi,
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
}

const BLACK_CHROMAS = new Set([1, 3, 6, 8, 10]);

const OCTAVE_SHIFT_META: Array<{
  offset: -1 | 0 | 1;
  label: string;
  rangeLabel: string;
}> = [
  { offset: -1, label: 'Trầm', rangeLabel: 'C2–E4' },
  { offset: 0, label: 'Chuẩn', rangeLabel: 'C3–E5' },
  { offset: 1, label: 'Cao', rangeLabel: 'C4–C6' },
];

function buildPianoKeys(
  startMidi = PIANO_MIN_MIDI,
  endMidi = PIANO_MAX_MIDI
): {
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
  while (mapped < PIANO_MIN_MIDI) mapped += 12;
  while (mapped > PIANO_MAX_MIDI) mapped -= 12;
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
  const [octaveOffset, setOctaveOffset] = useState<-1 | 0 | 1>(0);
  const pressTimersRef = useRef<Map<number, number>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { whiteKeys, blackKeys } = useMemo(
    () => buildPianoKeys(PIANO_MIN_MIDI, PIANO_MAX_MIDI),
    []
  );

  const shortcutByMidi = useMemo(
    () => getShortcutLabelsForOctave(octaveOffset),
    [octaveOffset]
  );

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

  // Map chord notes directly onto C2–C6 keys (bass C2..B2 + right hand C3..C6)
  const { chordBassVisibleMidis, chordRightMidis } = useMemo(() => {
    const bassSet = new Set<number>();
    const rhSet = new Set<number>();
    if (!activeVoicing) {
      return { chordBassVisibleMidis: bassSet, chordRightMidis: rhSet };
    }
    activeVoicing.bassMidis.forEach((m) => {
      bassSet.add(projectMidiToVisibleRange(m));
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

  const handleShiftOctave = useCallback((nextOffset: -1 | 0 | 1) => {
    setOctaveOffset(nextOffset);
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const maxScroll = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
    if (maxScroll <= 0) return;
    const ratio = nextOffset === -1 ? 0 : nextOffset === 0 ? 0.38 : 1;
    scroller.scrollTo({ left: Math.round(maxScroll * ratio), behavior: 'smooth' });
  }, []);

  // Computer keyboard piano input (Z–M / Q–P, shiftable from C2 to C6 via [ and ] or UI buttons)
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

      if (e.key === '[') {
        e.preventDefault();
        setOctaveOffset((prev) => (prev === 1 ? 0 : -1));
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        setOctaveOffset((prev) => (prev === -1 ? 0 : 1));
        return;
      }

      const mapped = resolveComputerKeyToMidi(e.key, octaveOffset);
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
  }, [octaveOffset, triggerVisualAndAudio]);

  const totalWhite = whiteKeys.length; // 29 white keys (C2..C6)
  const activeOctaveMeta =
    OCTAVE_SHIFT_META.find((m) => m.offset === octaveOffset) ?? OCTAVE_SHIFT_META[1];

  return (
    <div
      data-testid="grand-piano-keyboard"
      data-range="C2-C6"
      className="w-full max-w-full min-w-0 rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-3.5 sm:p-4 space-y-3"
    >
      {/* Keyboard Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0 max-w-full">
        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          <span
            title={sustainPedal ? 'Sustain Pedal đang ngân âm' : 'Sustain Pedal đang tắt'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] max-w-full"
          >
            <Piano className="w-4 h-4 shrink-0 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            <span>Grand Piano 4 Quãng Tám (C2–C6)</span>
          </span>

          {activeVoicing ? (
            <button
              type="button"
              onClick={onAuditionActiveChord}
              title={`Nghe lại thế bấm hợp âm Grand Piano (${sustainPedal ? 'Pedal Ngân' : 'Pedal Khô'})`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#0C1628] text-[11px] font-mono text-[#0369A1] dark:text-[#38BDF8] hover:border-[#0284C7] transition-colors cursor-pointer max-w-full overflow-x-auto"
            >
              <Volume2 className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="font-bold">{activeVoicing.normalizedSymbol}</span>
              <span className="text-[#475569] dark:text-[#94A3B8] truncate">
                ({activeVoicing.bassNote} + {activeVoicing.notes.join(' ')})
              </span>
            </button>
          ) : (
            <span className="text-[11px] font-mono text-[#475569] dark:text-[#94A3B8]">
              Bấm phím đàn hoặc gõ Z–M / Q–P (Đổi quãng: [ / ])
            </span>
          )}

          {liveMelodyNoteLabels.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/12 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
              ♪ {liveMelodyNoteLabels.join(' ')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto max-w-full min-w-0">
          {/* Keyboard Octave Selector (-1 C2..E4 | 0 C3..E5 | +1 C4..C6) */}
          <div
            role="group"
            aria-label="Chọn quãng phím máy tính"
            className="inline-flex max-w-full items-center p-0.5 rounded-md bg-[#EFF4FA] dark:bg-[#0C1628] border border-[#CBD8E6] dark:border-[#1F3557]"
          >
            <button
              type="button"
              aria-label="Giảm quãng phím máy tính"
              disabled={octaveOffset === -1}
              onClick={() => handleShiftOctave(octaveOffset === 1 ? 0 : -1)}
              className="p-1 rounded text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white disabled:opacity-35 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {OCTAVE_SHIFT_META.map((item) => (
              <button
                key={item.offset}
                type="button"
                data-testid={`piano-octave-${item.offset}`}
                onClick={() => handleShiftOctave(item.offset)}
                title={`Gán phím Z–M / Q–P vào quãng ${item.rangeLabel}`}
                className={`px-2 py-0.5 text-[11px] font-mono font-semibold rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  octaveOffset === item.offset
                    ? 'bg-white dark:bg-[#162640] text-[#0369A1] dark:text-[#38BDF8] shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white'
                }`}
              >
                {item.rangeLabel}
              </button>
            ))}
            <button
              type="button"
              aria-label="Tăng quãng phím máy tính"
              disabled={octaveOffset === 1}
              onClick={() => handleShiftOctave(octaveOffset === -1 ? 0 : 1)}
              className="p-1 rounded text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white disabled:opacity-35 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

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
                : 'border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#0C1628] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
            }`}
          >
            {recordToRoll ? 'Đang ghi Roll' : 'Ghi vào Roll'}
          </button>
        </div>
      </div>

      {/* Responsive Piano Keybed (49 keys C2..B5..C6 — fits full-width on desktop, smooth scroll on mobile) */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto rounded-lg border border-[#1E293B]/25 dark:border-[#1F3557] bg-[#141923] pt-1.5 px-1 pb-1.5 select-none"
      >
        <div className="min-w-[780px] lg:min-w-0 lg:w-full">
          {/* Mahogany/felt top rail accent */}
          <div
            aria-hidden="true"
            className="h-1 w-full bg-gradient-to-r from-[#581C1C] via-[#7F1D1D] to-[#581C1C] rounded-xs mb-1"
          />

          <div className="relative h-32 sm:h-36 w-full flex">
            {/* White Ivory Keys (29 keys: C2 .. C6) */}
            {whiteKeys.map((k) => {
              const isPressed = pressedMidis.includes(k.midi);
              const isLiveMel = liveMelodyVisibleSet.has(k.midi);
              const isLiveChd = liveChordVisibleSet.has(k.midi);
              const isChordRh = chordRightMidis.has(k.midi);
              const isChordBass = chordBassVisibleMidis.has(k.midi);
              const chroma = ((k.midi % 12) + 12) % 12;
              const inScale = scaleChromas.has(chroma);
              const shortcut = shortcutByMidi[k.midi];
              const isAnchorNote = chroma === 0 || k.midi === 83; // C2, C3, C4, C5, B5, C6

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
                  <span
                    className={`font-mono leading-none ${
                      isAnchorNote
                        ? 'text-[9.5px] font-bold text-[#0369A1]'
                        : 'text-[9px] font-semibold'
                    }`}
                  >
                    {isAnchorNote ? k.name : k.name.replace(/\d/, '')}
                  </span>
                  {shortcut && (
                    <span className="hidden sm:inline font-mono text-[8px] opacity-60 mt-0.5 leading-none">
                      {shortcut}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Black Ebony Keys Overlay (20 keys: C#2 .. A#5) */}
            {blackKeys.map((k) => {
              const isPressed = pressedMidis.includes(k.midi);
              const isLiveMel = liveMelodyVisibleSet.has(k.midi);
              const isLiveChd = liveChordVisibleSet.has(k.midi);
              const isChordRh = chordRightMidis.has(k.midi);
              const isChordBass = chordBassVisibleMidis.has(k.midi);
              const shortcut = shortcutByMidi[k.midi];
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
                  {shortcut && (
                    <span className="hidden sm:inline font-mono text-[8px] opacity-75 leading-none">
                      {shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Subtle footer helper showing active computer-key octave & range */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569] dark:text-[#94A3B8]">
        <span>
          Bàn phím máy tính đang gán quãng{' '}
          <strong className="font-mono text-[#070B14] dark:text-[#F1F5F9]">
            {activeOctaveMeta.rangeLabel}
          </strong>{' '}
          ({activeOctaveMeta.label}) · 49 phím đầy đủ từ C2 đến B5 / C6
        </span>
        <span className="lg:hidden font-mono text-[10px] text-[#0369A1] dark:text-[#38BDF8]">
          Vuốt ngang bàn phím để chơi C2–C6
        </span>
      </div>
    </div>
  );
}
