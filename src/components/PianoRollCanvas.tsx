import { useEffect, useMemo, useRef, useState } from 'react';
import { Note } from 'tonal';
import {
  getScaleNotes,
  type MelodyInstrumentId,
  type MelodyNote,
  midiToNoteName,
  PIANO_MAX_MIDI,
  PIANO_MIN_MIDI,
  resolvePianistVoicing,
  snapMidiToScale,
} from '../utils/lyricGrooveEngine.ts';
import { auditionMidiNote, getLiveAudioFrame } from '../utils/lyricGrooveAudio.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';

interface PianoRollCanvasProps {
  theme: ThemeMode;
  sectionId: string;
  bars: 2 | 4 | 8;
  keyRoot: string;
  scaleMode: 'major' | 'minor';
  scaleSnap: boolean;
  sustainPedal?: boolean;
  melodyInstrument: MelodyInstrumentId;
  notes: MelodyNote[];
  chordMarkers: Array<{ symbol: string; beatOffset: number }>;
  playheadBeatRef: React.MutableRefObject<number>;
  sectionStartBeat?: number;
  activeChordSymbol?: string | null;
  isPlaying: boolean;
  isRecording: boolean;
  liveWaveformRef: React.MutableRefObject<Float32Array | null>;
  liveDetectedMidiRef: React.MutableRefObject<number | null>;
  onAddNote: (note: MelodyNote) => void;
  onRemoveNote: (noteId: string) => void;
  onResizeNoteDuration: (noteId: string, durationBeats: number) => void;
}

const MIN_MIDI = PIANO_MIN_MIDI; // C2 (36)
const MAX_MIDI = PIANO_MAX_MIDI; // C6 (84, includes B5 = 83)
const TOTAL_ROWS = MAX_MIDI - MIN_MIDI + 1; // 49 rows
const KEY_GUTTER_W = 46;
const HEADER_H = 44; // top bar: waveform + beat numbers

export function PianoRollCanvas({
  theme,
  sectionId,
  bars,
  keyRoot,
  scaleMode,
  scaleSnap,
  sustainPedal = true,
  melodyInstrument,
  notes,
  chordMarkers,
  playheadBeatRef,
  sectionStartBeat = 0,
  activeChordSymbol = null,
  isPlaying,
  isRecording,
  liveWaveformRef,
  liveDetectedMidiRef,
  onAddNote,
  onRemoveNote,
  onResizeNoteDuration,
}: PianoRollCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);
  const dragNoteRef = useRef<{ id: string; startBeat: number } | null>(null);

  const totalBeats = bars * 4;

  const scaleChromas = useMemo(() => {
    const pcs = getScaleNotes(keyRoot, scaleMode);
    return new Set(
      pcs.map((p) => Note.chroma(p)).filter((c): c is number => typeof c === 'number')
    );
  }, [keyRoot, scaleMode]);

  const chordToneSpans = useMemo(() => {
    const sorted = [...chordMarkers]
      .filter((c) => c.beatOffset < totalBeats)
      .sort((a, b) => a.beatOffset - b.beatOffset);
    return sorted.map((ch, idx) => {
      const startBeat = Math.max(0, ch.beatOffset);
      const endBeat =
        idx + 1 < sorted.length ? sorted[idx + 1].beatOffset : totalBeats;
      const voicing = resolvePianistVoicing(ch.symbol);
      const chromas = new Set<number>();
      voicing.rightHandMidis.forEach((m) => chromas.add(((m % 12) + 12) % 12));
      return { startBeat, endBeat, chromas };
    });
  }, [chordMarkers, totalBeats]);

  const drawRoll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.clientWidth || 620;
    const cssHeight = canvas.clientHeight || 340;
    if (
      canvas.width !== Math.round(cssWidth * dpr) ||
      canvas.height !== Math.round(cssHeight * dpr)
    ) {
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark = theme === 'dark';
    const bgCanvas = isDark ? '#070D19' : '#FFFFFF';
    const bgOutScale = isDark ? '#0B1324' : '#F4F7FB';
    const bgInScale = isDark ? '#0E192E' : '#FFFFFF';
    const gridLine = isDark ? 'rgba(148, 163, 184, 0.10)' : 'rgba(15, 23, 42, 0.08)';
    const barLine = isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.25)';
    const textMuted = isDark ? '#94A3B8' : '#64748B';
    const textPrimary = isDark ? '#E2E8F0' : '#0F172A';

    ctx.fillStyle = bgCanvas;
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    const gridW = Math.max(120, cssWidth - KEY_GUTTER_W);
    const gridH = Math.max(120, cssHeight - HEADER_H);
    const rowH = gridH / TOTAL_ROWS;
    const beatW = gridW / totalBeats;

    // 1. Header Waveform & Chord Strip
    ctx.fillStyle = isDark ? '#0A1322' : '#F8FAFC';
    ctx.fillRect(0, 0, cssWidth, HEADER_H);

    // Live audio waveform / studio playback audio analyser
    const micWave = liveWaveformRef.current;
    const synthWave = !isRecording && isPlaying ? getLiveAudioFrame()?.waveform ?? null : null;
    const wave = isRecording ? micWave : synthWave;
    ctx.strokeStyle = isRecording
      ? '#EF4444'
      : isPlaying
      ? isDark
        ? 'rgba(16, 185, 129, 0.85)'
        : 'rgba(2, 132, 199, 0.72)'
      : isDark
      ? 'rgba(56, 189, 248, 0.35)'
      : 'rgba(2, 132, 199, 0.25)';
    ctx.lineWidth = isRecording || isPlaying ? 1.8 : 1.1;
    ctx.beginPath();
    if (wave && wave.length > 0 && (isRecording || isPlaying)) {
      const sampleCount = Math.min(wave.length, 128);
      for (let i = 0; i < sampleCount; i++) {
        const wx = KEY_GUTTER_W + (i / Math.max(1, sampleCount - 1)) * gridW;
        const amp = Math.max(-1, Math.min(1, wave[i])) * (isRecording ? 18 : 22);
        const wy = HEADER_H * 0.45 + amp;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
    } else {
      ctx.moveTo(KEY_GUTTER_W, HEADER_H * 0.45);
      ctx.lineTo(cssWidth, HEADER_H * 0.45);
    }
    ctx.stroke();

    // Draw bar numbers & chord tags inside header bottom strip
    ctx.font = '600 10px "JetBrains Mono", monospace';
    for (let b = 0; b < totalBeats; b++) {
      const bx = KEY_GUTTER_W + b * beatW;
      if (b % 4 === 0) {
        ctx.fillStyle = textMuted;
        ctx.fillText(`Ô ${b / 4 + 1}`, bx + 4, HEADER_H - 6);
      }
    }

    const beatPos = playheadBeatRef.current;
    const rawLocalBeat = beatPos - sectionStartBeat;
    const isPlayheadInSection =
      (isPlaying || beatPos > 0) &&
      rawLocalBeat >= -0.05 &&
      rawLocalBeat <= totalBeats + 0.05;
    const localBeat = isPlayheadInSection
      ? Math.max(0, Math.min(totalBeats, rawLocalBeat))
      : -1;

    chordMarkers.forEach((ch, idx) => {
      if (ch.beatOffset >= totalBeats) return;
      const nextOffset =
        idx + 1 < chordMarkers.length ? chordMarkers[idx + 1].beatOffset : totalBeats;
      const isActiveChord =
        isPlayheadInSection &&
        ((localBeat >= ch.beatOffset && localBeat < nextOffset) ||
          (activeChordSymbol !== null &&
            ch.symbol === activeChordSymbol &&
            Math.abs(localBeat - ch.beatOffset) < 4));
      const cx = KEY_GUTTER_W + ch.beatOffset * beatW;
      ctx.font = '700 11px "JetBrains Mono", monospace';
      if (isActiveChord) {
        const labelW = ctx.measureText(ch.symbol).width + 10;
        ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(2, 132, 199, 0.14)';
        ctx.beginPath();
        ctx.roundRect(cx + 1, 3, labelW, 16, 4);
        ctx.fill();
        ctx.fillStyle = isDark ? '#34D399' : '#0284C7';
      } else {
        ctx.fillStyle = isDark ? '#38BDF8' : '#0369A1';
      }
      ctx.fillText(ch.symbol, cx + 5, 15);
    });

    // 2. Piano Key Gutter & Scale Rows
    for (let r = 0; r < TOTAL_ROWS; r++) {
      const midi = MAX_MIDI - r;
      const y = HEADER_H + r * rowH;
      const chroma = ((midi % 12) + 12) % 12;
      const inScale = scaleChromas.has(chroma);
      const isBlackKey = [1, 3, 6, 8, 10].includes(chroma);

      // Row background
      ctx.fillStyle = inScale ? bgInScale : bgOutScale;
      ctx.fillRect(KEY_GUTTER_W, y, gridW, rowH);

      // Subtle chord-tone guide shading per active chord span (1-3-5-7 target lanes)
      chordToneSpans.forEach((span) => {
        if (!span.chromas.has(chroma)) return;
        const sx = KEY_GUTTER_W + span.startBeat * beatW;
        const sw = Math.max(4, (span.endBeat - span.startBeat) * beatW);
        ctx.fillStyle = isDark
          ? 'rgba(56, 189, 248, 0.085)'
          : 'rgba(14, 165, 233, 0.08)';
        ctx.fillRect(sx, y, sw, rowH);
      });

      // Horizontal hairline
      ctx.strokeStyle = gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(KEY_GUTTER_W, y);
      ctx.lineTo(cssWidth, y);
      ctx.stroke();

      // Piano key on left gutter
      ctx.fillStyle = isBlackKey
        ? isDark
          ? '#1E293B'
          : '#334155'
        : isDark
        ? '#0F172A'
        : '#F1F5F9';
      ctx.fillRect(0, y, KEY_GUTTER_W - 1, Math.max(1, rowH - 0.5));

      if (chroma === 0 || midi === MAX_MIDI || midi === MIN_MIDI || midi === 83) {
        ctx.fillStyle = isBlackKey ? '#E2E8F0' : textPrimary;
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillText(midiToNoteName(midi), 6, y + rowH * 0.78);
      } else if (inScale && rowH >= 7) {
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.55)' : 'rgba(2, 132, 199, 0.5)';
        ctx.fillRect(KEY_GUTTER_W - 4, y + rowH * 0.25, 2.5, Math.max(2, rowH * 0.5));
      }
    }

    // 3. Vertical Beat & Bar Grid Lines
    for (let step = 0; step <= totalBeats * 2; step++) {
      const beat = step / 2;
      const x = KEY_GUTTER_W + beat * beatW;
      const isBar = step % 8 === 0;
      const isBeat = step % 2 === 0;
      ctx.strokeStyle = isBar
        ? barLine
        : isBeat
        ? gridLine
        : isDark
        ? 'rgba(148,163,184,0.04)'
        : 'rgba(15,23,42,0.035)';
      ctx.lineWidth = isBar ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(x, HEADER_H);
      ctx.lineTo(x, cssHeight);
      ctx.stroke();
    }

    // 4. MIDI Note Bars (glowing when playhead intersects)
    notes.forEach((n) => {
      if (n.midi < MIN_MIDI || n.midi > MAX_MIDI) return;
      const r = MAX_MIDI - n.midi;
      const x = KEY_GUTTER_W + n.startBeat * beatW + 1;
      const y = HEADER_H + r * rowH + 1;
      const w = Math.max(8, n.durationBeats * beatW - 2);
      const h = Math.max(5, rowH - 2);

      const chroma = ((n.midi % 12) + 12) % 12;
      const inScale = scaleChromas.has(chroma);
      const isNoteSounding =
        isPlaying &&
        isPlayheadInSection &&
        localBeat >= n.startBeat &&
        localBeat < n.startBeat + n.durationBeats;

      ctx.save();
      if (isNoteSounding) {
        ctx.shadowColor = isDark ? '#34D399' : '#0EA5E9';
        ctx.shadowBlur = 10;
        ctx.fillStyle = isDark ? '#34D399' : '#0EA5E9';
      } else {
        ctx.fillStyle = inScale
          ? isDark
            ? '#38BDF8'
            : '#0284C7'
          : isDark
          ? '#F59E0B'
          : '#D97706';
      }
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 3);
      ctx.fill();
      if (isNoteSounding) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();

      if (w > 22 && h >= 8) {
        ctx.fillStyle = isNoteSounding && isDark ? '#06281E' : '#FFFFFF';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillText(midiToNoteName(n.midi), x + 4, y + h - 2);
      }
    });

    // 5. Live Detected Vocal Pitch Indicator
    const liveMidi = liveDetectedMidiRef.current;
    if (isRecording && liveMidi !== null && liveMidi >= MIN_MIDI && liveMidi <= MAX_MIDI) {
      const r = MAX_MIDI - liveMidi;
      const y = HEADER_H + r * rowH + rowH / 2;
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(KEY_GUTTER_W, y);
      ctx.lineTo(cssWidth, y);
      ctx.stroke();
    }

    // 6. Live 60fps Playhead Line (section-local)
    if (isPlayheadInSection) {
      const px = KEY_GUTTER_W + localBeat * beatW;
      ctx.save();
      ctx.strokeStyle = isRecording ? '#EF4444' : isDark ? '#34D399' : '#0284C7';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = isDark ? 'rgba(52, 211, 153, 0.55)' : 'rgba(2, 132, 199, 0.35)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, cssHeight);
      ctx.stroke();
      ctx.restore();
    }

    // Divider between header & grid
    ctx.strokeStyle = isDark ? '#1E293B' : '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(cssWidth, HEADER_H);
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    let rafId = 0;
    const renderFrame = () => {
      drawRoll();
      if (isPlaying || isRecording) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };
    drawRoll();
    if (isPlaying || isRecording) {
      rafId = requestAnimationFrame(renderFrame);
    }
    const handleResize = () => drawRoll();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  });

  const coordsToGrid = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < KEY_GUTTER_W || y < HEADER_H) return null;

    const gridW = Math.max(120, rect.width - KEY_GUTTER_W);
    const gridH = Math.max(120, rect.height - HEADER_H);
    const rowH = gridH / TOTAL_ROWS;
    const beatW = gridW / totalBeats;

    const rawRow = Math.floor((y - HEADER_H) / rowH);
    const rawMidi = Math.max(MIN_MIDI, Math.min(MAX_MIDI, MAX_MIDI - rawRow));
    const snappedMidi = scaleSnap
      ? snapMidiToScale(rawMidi, keyRoot, scaleMode)
      : rawMidi;
    const beat = Math.floor(((x - KEY_GUTTER_W) / beatW) * 2) / 2;
    return {
      midi: snappedMidi,
      beat: Math.max(0, Math.min(totalBeats - 0.5, beat)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = coordsToGrid(e.clientX, e.clientY);
    if (!pos) return;

    const hit = notes.find(
      (n) =>
        n.midi === pos.midi &&
        pos.beat >= n.startBeat &&
        pos.beat < n.startBeat + n.durationBeats
    );

    if (hit) {
      onRemoveNote(hit.id);
      return;
    }

    const newNote: MelodyNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sectionId,
      midi: pos.midi,
      startBeat: pos.beat,
      durationBeats: 0.5,
      velocity: 0.88,
    };
    dragNoteRef.current = { id: newNote.id, startBeat: pos.beat };
    onAddNote(newNote);
    void auditionMidiNote(pos.midi, melodyInstrument, sustainPedal);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = coordsToGrid(e.clientX, e.clientY);
    if (!pos) {
      setHoverInfo(null);
      return;
    }
    setHoverInfo(`${midiToNoteName(pos.midi)} · Phách ${(pos.beat + 1).toFixed(1)}`);

    if (dragNoteRef.current) {
      const dur = Math.max(0.5, Math.min(4, pos.beat - dragNoteRef.current.startBeat + 0.5));
      onResizeNoteDuration(dragNoteRef.current.id, dur);
    }
  };

  const handlePointerUp = () => {
    dragNoteRef.current = null;
  };

  return (
    <div ref={containerRef} className="space-y-1.5">
      <div className="relative rounded-xl overflow-hidden border border-[#DCE6F2] dark:border-[#1B2B46] bg-white dark:bg-[#070D19]">
        <canvas
          ref={canvasRef}
          data-testid="piano-roll-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            handlePointerUp();
            setHoverInfo(null);
          }}
          className="w-full h-[380px] sm:h-[430px] block cursor-crosshair touch-none select-none"
          aria-label="Khung Piano Roll 2D vẽ và chỉnh sửa giai điệu từ C2 đến C6"
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#475569] dark:text-[#94A3B8] tabular-nums">
        <span>
          Bấm hoặc kéo trên lưới để vẽ nốt · Bấm lại vào nốt để xóa
        </span>
        <span className="font-mono font-medium text-[#0369A1] dark:text-[#38BDF8]">
          {hoverInfo ?? `${notes.length} nốt nhạc`}
        </span>
      </div>
    </div>
  );
}
