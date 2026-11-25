import { useEffect, useMemo, useRef } from 'react';
import { getLiveAudioFrame } from '../utils/lyricGrooveAudio.ts';
import {
  ARPEGGIO_PATTERN_META,
  type BackingPatternId,
  buildChordTimeline,
  buildSynchronizedLyricEvents,
  type ConcreteArpeggioPatternId,
  isSectionMelodyMuted,
  type MelodyNote,
  type MelodyPlaybackMode,
  midiToNoteName,
  type MoodStyleId,
  type SongSection,
} from '../utils/lyricGrooveEngine.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';

interface SongTimelinePlayerProps {
  theme: ThemeMode;
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  bpm: number;
  beatsPerBar?: number;
  backingPattern?: BackingPatternId;
  chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
  songMood?: MoodStyleId;
  melodyPlaybackMode?: MelodyPlaybackMode;
  mutedMelodySectionIds?: string[];
  loopScope: 'section' | 'song';
  activeSectionId: string;
  isPlaying: boolean;
  playheadBeatRef: React.MutableRefObject<number>;
  onSeekBeat: (songBeat: number, sectionId: string) => void;
  onPreviewMidi?: (midi: number) => void;
}

interface TimelineNoteItem {
  id: string;
  midi: number;
  noteName: string;
  absStart: number;
  absEnd: number;
  muted: boolean;
}

interface TimelineLyricItem {
  text: string;
  chordSymbol: string | null;
  absStart: number;
  absEnd: number;
}

interface TimelineSectionItem {
  id: string;
  index: number;
  kind: string;
  label: string;
  bars: number;
  startBeat: number;
  endBeat: number;
}

const GUTTER_W = 74;
const RULER_H = 30;
const CHORD_LANE_H = 42;
const MELODY_LANE_H = 118;
const LYRIC_LANE_H = 54;
const PIANO_LANE_H = 92;
const TIMELINE_SCROLL_H = RULER_H + CHORD_LANE_H + MELODY_LANE_H + LYRIC_LANE_H; // 244px
const TOTAL_CANVAS_H = TIMELINE_SCROLL_H + PIANO_LANE_H; // 336px
const VISIBLE_BEATS = 16; // 4 bars visible smoothly in scrolling window

const PIANO_MIDI_LOW = 36; // C2
const PIANO_MIDI_HIGH = 84; // C6
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

interface PianoKeyLayoutItem {
  midi: number;
  isBlack: boolean;
  whiteIndex: number;
  noteName: string;
}

const PIANO_KEY_LAYOUT: PianoKeyLayoutItem[] = (() => {
  const items: PianoKeyLayoutItem[] = [];
  let whiteIdx = -1;
  for (let midi = PIANO_MIDI_LOW; midi <= PIANO_MIDI_HIGH; midi++) {
    const isBlack = BLACK_PITCH_CLASSES.has(midi % 12);
    if (!isBlack) {
      whiteIdx += 1;
    }
    items.push({
      midi,
      isBlack,
      whiteIndex: whiteIdx,
      noteName: midiToNoteName(midi),
    });
  }
  return items;
})();
const TOTAL_WHITE_KEYS = PIANO_KEY_LAYOUT.filter((k) => !k.isBlack).length;

export function SongTimelinePlayer({
  theme,
  sections,
  melodyNotes,
  bpm,
  beatsPerBar = 4,
  backingPattern,
  chordArpStyles,
  songMood,
  melodyPlaybackMode = 'all',
  mutedMelodySectionIds,
  loopScope,
  activeSectionId,
  isPlaying,
  playheadBeatRef,
  onSeekBeat,
  onPreviewMidi,
}: SongTimelinePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStartRef = useRef<number>(0);
  const lastPlayheadRef = useRef<number>(0);

  const timelineData = useMemo(() => {
    const scopeSections =
      loopScope === 'section'
        ? sections.filter((s) => s.id === activeSectionId)
        : sections;
    const effectiveSections = scopeSections.length > 0 ? scopeSections : sections;

    const sectionItems: TimelineSectionItem[] = [];
    const noteItems: TimelineNoteItem[] = [];
    const lyricItems: TimelineLyricItem[] = [];

    let cursor = 0;
    let minMidi = 60;
    let maxMidi = 76;

    effectiveSections.forEach((sec, idx) => {
      const secDur = sec.bars * beatsPerBar;
      const startBeat = cursor;
      const endBeat = cursor + secDur;
      const isSecMuted = isSectionMelodyMuted(
        sec,
        melodyPlaybackMode,
        mutedMelodySectionIds
      );
      sectionItems.push({
        id: sec.id,
        index: idx,
        kind: sec.kind,
        label: sec.label,
        bars: sec.bars,
        startBeat,
        endBeat,
      });

      const secNotes = melodyNotes.filter((n) => n.sectionId === sec.id);
      secNotes.forEach((n) => {
        if (n.midi < minMidi) minMidi = n.midi;
        if (n.midi > maxMidi) maxMidi = n.midi;
        noteItems.push({
          id: n.id,
          midi: n.midi,
          noteName: midiToNoteName(n.midi),
          absStart: startBeat + n.startBeat,
          absEnd: startBeat + n.startBeat + n.durationBeats,
          muted: isSecMuted,
        });
      });

      cursor = endBeat;
    });

    const syncWords = buildSynchronizedLyricEvents(effectiveSections, melodyNotes, beatsPerBar);
    syncWords.forEach((w) => {
      lyricItems.push({
        text: w.text,
        chordSymbol: w.chordSymbol,
        absStart: w.absStart,
        absEnd: w.absEnd,
      });
    });

    const { events: chordEvents, totalBeats } = buildChordTimeline(effectiveSections, {
      backingPattern,
      chordArpStyles,
      songMood,
      melodyNotes,
      beatsPerBar,
    });
    return {
      sectionItems,
      chordEvents,
      noteItems,
      lyricItems,
      totalBeats: Math.max(beatsPerBar, totalBeats),
      midiLow: Math.max(36, minMidi - 2),
      midiHigh: Math.min(84, maxMidi + 2),
    };
  }, [
    sections,
    melodyNotes,
    beatsPerBar,
    backingPattern,
    chordArpStyles,
    songMood,
    melodyPlaybackMode,
    mutedMelodySectionIds,
    loopScope,
    activeSectionId,
  ]);

  const drawTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssWidth = canvas.clientWidth || 820;
    const cssHeight = TOTAL_CANVAS_H;
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
    const laneW = Math.max(200, cssWidth - GUTTER_W);
    const windowBeats = Math.min(VISIBLE_BEATS, Math.max(8, timelineData.totalBeats));
    const beatW = laneW / windowBeats;

    const rawPlayhead = playheadBeatRef.current;
    const isManualJump = Math.abs(rawPlayhead - lastPlayheadRef.current) > 2;
    lastPlayheadRef.current = rawPlayhead;

    const anchorOffset = Math.min(4, windowBeats * 0.24);
    const maxCam = Math.max(0, timelineData.totalBeats - windowBeats);
    const targetCam = Math.max(0, Math.min(maxCam, rawPlayhead - anchorOffset));

    // Smooth camera tracking, snapping immediately on manual seek or loop wrap
    if (isManualJump || Math.abs(targetCam - cameraStartRef.current) > 6 || !isPlaying) {
      cameraStartRef.current = targetCam;
    } else {
      cameraStartRef.current += (targetCam - cameraStartRef.current) * 0.18;
    }

    const camStart = cameraStartRef.current;
    const camEnd = camStart + windowBeats;
    const beatToX = (b: number) => GUTTER_W + (b - camStart) * beatW;

    // Background
    ctx.fillStyle = isDark ? '#060C18' : '#F8FAFC';
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    // Lane backgrounds
    const yRuler = 0;
    const yChord = RULER_H;
    const yMelody = RULER_H + CHORD_LANE_H;
    const yLyric = RULER_H + CHORD_LANE_H + MELODY_LANE_H;
    const yPiano = TIMELINE_SCROLL_H;

    ctx.fillStyle = isDark ? '#0B1325' : '#EFF6FF';
    ctx.fillRect(GUTTER_W, yRuler, laneW, RULER_H);

    ctx.fillStyle = isDark ? '#081020' : '#FFFFFF';
    ctx.fillRect(GUTTER_W, yChord, laneW, CHORD_LANE_H);

    ctx.fillStyle = isDark ? '#060D1B' : '#FAFBFD';
    ctx.fillRect(GUTTER_W, yMelody, laneW, MELODY_LANE_H);

    ctx.fillStyle = isDark ? '#0A1324' : '#F1F5F9';
    ctx.fillRect(GUTTER_W, yLyric, laneW, LYRIC_LANE_H);

    ctx.fillStyle = isDark ? '#070E1C' : '#E2E8F0';
    ctx.fillRect(GUTTER_W, yPiano, laneW, PIANO_LANE_H);

    // Clip scrolling track lanes (lanes 1..4) to right of gutter
    ctx.save();
    ctx.beginPath();
    ctx.rect(GUTTER_W, 0, laneW, TIMELINE_SCROLL_H);
    ctx.clip();

    // 1. Section Color Bands & Labels in Ruler
    timelineData.sectionItems.forEach((sec) => {
      if (sec.endBeat < camStart || sec.startBeat > camEnd) return;
      const sx = Math.max(GUTTER_W, beatToX(sec.startBeat));
      const ex = Math.min(cssWidth, beatToX(sec.endBeat));
      const w = Math.max(1, ex - sx);

      const isCurrentSec = rawPlayhead >= sec.startBeat && rawPlayhead < sec.endBeat;
      ctx.fillStyle = isCurrentSec
        ? isDark
          ? 'rgba(16, 185, 129, 0.18)'
          : 'rgba(14, 165, 233, 0.14)'
        : sec.index % 2 === 0
        ? isDark
          ? 'rgba(56, 189, 248, 0.06)'
          : 'rgba(2, 132, 199, 0.05)'
        : 'transparent';
      ctx.fillRect(sx, yRuler, w, RULER_H);

      // Section boundary vertical line
      const exactStart = beatToX(sec.startBeat);
      if (exactStart >= GUTTER_W - 2) {
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(exactStart, 0);
        ctx.lineTo(exactStart, TIMELINE_SCROLL_H);
        ctx.stroke();

        ctx.fillStyle = isCurrentSec
          ? isDark
            ? '#34D399'
            : '#0284C7'
          : isDark
          ? '#93C5FD'
          : '#0369A1';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(`${sec.index + 1}. ${sec.kind.toUpperCase()}`, exactStart + 5, 12);
      }
    });

    // 2. Vertical Beat & Bar Grid Lines across all lanes
    const firstBeat = Math.max(0, Math.floor(camStart));
    const lastBeat = Math.min(timelineData.totalBeats, Math.ceil(camEnd));
    for (let b = firstBeat; b <= lastBeat; b++) {
      const bx = beatToX(b);
      const isBar = b % beatsPerBar === 0;
      ctx.strokeStyle = isBar
        ? isDark
          ? 'rgba(148, 163, 184, 0.26)'
          : 'rgba(15, 23, 42, 0.16)'
        : isDark
        ? 'rgba(148, 163, 184, 0.08)'
        : 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = isBar ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(bx, RULER_H - 12);
      ctx.lineTo(bx, TIMELINE_SCROLL_H);
      ctx.stroke();

      if (isBar && b < timelineData.totalBeats) {
        ctx.fillStyle = isDark ? '#94A3B8' : '#475569';
        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.fillText(`Ô ${b / beatsPerBar + 1}`, bx + 4, RULER_H - 4);
      } else if (b < timelineData.totalBeats) {
        ctx.fillStyle = isDark ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.55)';
        ctx.font = '500 8.5px "JetBrains Mono", monospace';
        ctx.fillText(String((b % beatsPerBar) + 1), bx + 3, RULER_H - 4);
      }
    }

    // Horizontal musical staff lines inside Melody Lane
    for (let i = 1; i <= 4; i++) {
      const ly = yMelody + (i / 5) * MELODY_LANE_H;
      ctx.strokeStyle = isDark
        ? 'rgba(148, 163, 184, 0.09)'
        : 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(GUTTER_W, ly);
      ctx.lineTo(cssWidth, ly);
      ctx.stroke();
    }

    // 3. Chord Blocks Lane
    timelineData.chordEvents.forEach((ev) => {
      const evEnd = ev.startBeat + ev.durationBeats;
      if (evEnd < camStart || ev.startBeat > camEnd) return;
      const x = beatToX(ev.startBeat) + 1.5;
      const w = Math.max(24, ev.durationBeats * beatW - 3);
      const y = yChord + 5;
      const h = CHORD_LANE_H - 10;

      const isActive =
        (isPlaying || rawPlayhead > 0) &&
        rawPlayhead >= ev.startBeat &&
        rawPlayhead < evEnd;

      ctx.save();
      if (isActive) {
        ctx.shadowColor = isDark ? '#10B981' : '#0284C7';
        ctx.shadowBlur = 12;
        ctx.fillStyle = isDark ? '#065F46' : '#0284C7';
        ctx.strokeStyle = isDark ? '#34D399' : '#38BDF8';
      } else {
        ctx.fillStyle = isDark ? '#13223D' : '#E0F2FE';
        ctx.strokeStyle = isDark ? '#1E3A63' : '#BAE6FD';
      }
      ctx.lineWidth = isActive ? 1.6 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Chord symbol + small note names + arpeggio shortLabel badge when wide enough
      ctx.fillStyle = isActive
        ? '#FFFFFF'
        : isDark
        ? '#E0F2FE'
        : '#0369A1';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(ev.symbol, x + 8, y + 19);
      const symW = ctx.measureText(ev.symbol).width;

      const arpMeta = ARPEGGIO_PATTERN_META.find((m) => m.id === ev.arpPattern);
      const arpTag = arpMeta?.shortLabel ?? '';
      let arpTagW = 0;
      if (w > 96 && arpTag) {
        ctx.font = '600 8.5px "Plus Jakarta Sans", "Noto Sans", sans-serif';
        arpTagW = ctx.measureText(arpTag).width + 10;
        const badgeX = x + w - arpTagW - 5;
        const badgeY = y + 7;
        ctx.fillStyle = isActive
          ? 'rgba(255,255,255,0.22)'
          : isDark
          ? 'rgba(56, 189, 248, 0.16)'
          : 'rgba(2, 132, 199, 0.12)';
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, arpTagW, 16, 4);
        ctx.fill();

        ctx.fillStyle = isActive
          ? '#FFFFFF'
          : isDark
          ? '#7DD3FC'
          : '#0369A1';
        ctx.fillText(arpTag, badgeX + 5, badgeY + 11.5);
      }

      if (w > 136 + arpTagW) {
        ctx.fillStyle = isActive
          ? 'rgba(255,255,255,0.85)'
          : isDark
          ? '#94A3B8'
          : '#475569';
        ctx.font = '500 9.5px "JetBrains Mono", monospace';
        const notePreview = ev.notes.map((n) => n.replace(/\d/, '')).slice(0, 4).join('-');
        ctx.fillText(notePreview, x + 8 + symW + 8, y + 18.5);
      }
    });

    // 4. Melody Piano-Roll Note Blocks across full song
    const midiSpan = Math.max(8, timelineData.midiHigh - timelineData.midiLow);
    const padY = 10;
    const usableH = MELODY_LANE_H - padY * 2;
    const noteH = Math.max(9, Math.min(16, usableH / Math.min(14, midiSpan)));

    timelineData.noteItems.forEach((n) => {
      if (n.absEnd < camStart || n.absStart > camEnd) return;
      const x = beatToX(n.absStart) + 1;
      const w = Math.max(10, (n.absEnd - n.absStart) * beatW - 2);
      const normPitch = (n.midi - timelineData.midiLow) / midiSpan;
      const y = yMelody + padY + (1 - normPitch) * (usableH - noteH);

      const isSounding =
        !n.muted &&
        isPlaying &&
        rawPlayhead >= n.absStart &&
        rawPlayhead < n.absEnd;
      const alreadyPassed = (isPlaying || rawPlayhead > 0) && n.absEnd <= rawPlayhead;

      ctx.save();
      if (n.muted) {
        ctx.globalAlpha = 0.24;
      }
      if (isSounding) {
        ctx.shadowColor = '#34D399';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#10B981';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.6;
      } else if (alreadyPassed) {
        ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.38)' : 'rgba(2, 132, 199, 0.42)';
        ctx.strokeStyle = isDark ? 'rgba(125, 211, 252, 0.5)' : 'rgba(2, 132, 199, 0.55)';
        ctx.lineWidth = 1;
      } else {
        ctx.fillStyle = isDark ? '#38BDF8' : '#0EA5E9';
        ctx.strokeStyle = isDark ? '#BAE6FD' : '#0369A1';
        ctx.lineWidth = 1;
      }
      ctx.beginPath();
      ctx.roundRect(x, y, w, noteH, 4);
      ctx.fill();
      ctx.stroke();

      if (w >= 20) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillText(n.noteName, x + 4, y + noteH - 2.5);
      }
      ctx.restore();
    });

    // 5. Lyric Phrases + Live Audio Waveform in Bottom Lane
    const audioFrame = isPlaying ? getLiveAudioFrame() : null;
    if (audioFrame && audioFrame.waveform.length > 0) {
      ctx.save();
      ctx.strokeStyle = isDark
        ? 'rgba(52, 211, 153, 0.48)'
        : 'rgba(2, 132, 199, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const waveLen = Math.min(audioFrame.waveform.length, 128);
      for (let i = 0; i < waveLen; i++) {
        const wx = GUTTER_W + (i / Math.max(1, waveLen - 1)) * laneW;
        const wy =
          yLyric + LYRIC_LANE_H - 14 + Math.max(-1, Math.min(1, audioFrame.waveform[i])) * 12;
        if (i === 0) ctx.moveTo(wx, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      ctx.restore();
    }

    let lastDrawnX = GUTTER_W - 2;
    timelineData.lyricItems.forEach((item) => {
      if (item.absEnd < camStart || item.absStart > camEnd || !item.text) return;
      const rawX = beatToX(item.absStart) + 2;
      const drawX = Math.max(rawX, lastDrawnX + 4);
      if (drawX > cssWidth - 8) return;

      const isCurrent =
        (isPlaying || rawPlayhead > 0) &&
        rawPlayhead >= item.absStart &&
        rawPlayhead < item.absEnd;
      const passed = (isPlaying || rawPlayhead > 0) && item.absEnd <= rawPlayhead;

      ctx.font = isCurrent ? '700 11.5px "Plus Jakarta Sans", "Noto Sans", sans-serif' : '500 10.5px "Plus Jakarta Sans", "Noto Sans", sans-serif';
      if (isCurrent) {
        const tw = ctx.measureText(item.text).width;
        ctx.fillStyle = isDark
          ? 'rgba(16, 185, 129, 0.22)'
          : 'rgba(2, 132, 199, 0.14)';
        ctx.beginPath();
        ctx.roundRect(drawX - 3, yLyric + 7, tw + 6, 17, 4);
        ctx.fill();
      }
      ctx.fillStyle = isCurrent
        ? isDark
          ? '#34D399'
          : '#0284C7'
        : passed
        ? isDark
          ? '#64748B'
          : '#94A3B8'
        : isDark
        ? '#E2E8F0'
        : '#1E293B';
      ctx.fillText(item.text, drawX, yLyric + 20);
      lastDrawnX = drawX + ctx.measureText(item.text).width;
    });

    // 6. Bright Vertical Sweeping Playhead Line + Top Needle Triangle
    const clampedPlayhead = Math.max(0, Math.min(timelineData.totalBeats, rawPlayhead));
    const px = beatToX(clampedPlayhead);
    if (px >= GUTTER_W - 2 && px <= cssWidth + 2) {
      ctx.save();
      // Soft illuminated trail just behind playhead when playing
      if (isPlaying) {
        const grad = ctx.createLinearGradient(px - 26, 0, px, 0);
        grad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        grad.addColorStop(1, isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 132, 199, 0.12)');
        ctx.fillStyle = grad;
        ctx.fillRect(Math.max(GUTTER_W, px - 26), RULER_H, 26, TIMELINE_SCROLL_H - RULER_H);
      }

      ctx.strokeStyle = isDark ? '#34D399' : '#E11D48';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = isDark ? 'rgba(52, 211, 153, 0.8)' : 'rgba(225, 29, 72, 0.45)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, TIMELINE_SCROLL_H);
      ctx.stroke();

      // Playhead cap needle
      ctx.fillStyle = isDark ? '#34D399' : '#E11D48';
      ctx.beginPath();
      ctx.moveTo(px - 6, 0);
      ctx.lineTo(px + 6, 0);
      ctx.lineTo(px, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // End right-of-gutter scrolling lanes clip

    // 7. Live 4-Octave Piano Keyboard Lane (PIANO ĐANG ĐÁNH)
    const clampedBeatForPiano = Math.max(0, Math.min(Math.max(0, timelineData.totalBeats - 0.01), rawPlayhead));
    const activeChordEvent =
      timelineData.chordEvents.find(
        (ev) => clampedBeatForPiano >= ev.startBeat && clampedBeatForPiano < ev.startBeat + ev.durationBeats
      ) ?? timelineData.chordEvents[0];

    const bassMidiSet = new Set<number>(activeChordEvent?.bassMidis ?? []);
    const rhMidiSet = new Set<number>(activeChordEvent?.rightHandMidis ?? []);
    const activeMelodyItems = timelineData.noteItems.filter(
      (n) =>
        !n.muted &&
        clampedBeatForPiano >= n.absStart - 0.02 &&
        clampedBeatForPiano < n.absEnd
    );
    const melodyMidiSet = new Set<number>(activeMelodyItems.map((n) => n.midi));

    // Top readout strip inside Piano Lane (24px)
    const statusH = 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(GUTTER_W, yPiano, laneW, PIANO_LANE_H);
    ctx.clip();

    ctx.fillStyle = isDark ? '#0B1528' : '#EFF6FF';
    ctx.fillRect(GUTTER_W, yPiano, laneW, statusH);
    ctx.strokeStyle = isDark ? '#1E293B' : '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GUTTER_W, yPiano + statusH);
    ctx.lineTo(cssWidth, yPiano + statusH);
    ctx.stroke();

    let readoutX = GUTTER_W + 10;
    const textY = yPiano + 15.5;
    if (activeChordEvent) {
      ctx.fillStyle = isDark ? '#38BDF8' : '#0369A1';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      const chordTag = `Hợp âm: ${activeChordEvent.symbol}`;
      ctx.fillText(chordTag, readoutX, textY);
      readoutX += ctx.measureText(chordTag).width + 14;
    }

    const drawRoleLegend = (color: string, label: string) => {
      if (readoutX > cssWidth - 56) return;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(readoutX + 4, yPiano + 12, 3.8, 0, Math.PI * 2);
      ctx.fill();
      readoutX += 11;
      ctx.fillStyle = isDark ? '#CBD5E1' : '#334155';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillText(label, readoutX, textY);
      readoutX += ctx.measureText(label).width + 12;
    };

    const bassNames = [...bassMidiSet].sort((a, b) => a - b).map((m) => midiToNoteName(m)).join('·') || '—';
    const rhNames = [...rhMidiSet].sort((a, b) => a - b).map((m) => midiToNoteName(m)).join('·') || '—';
    const melNames = [...melodyMidiSet].sort((a, b) => a - b).map((m) => midiToNoteName(m)).join('·') || 'Nghỉ';

    drawRoleLegend('#F59E0B', `Trái: ${bassNames}`);
    drawRoleLegend('#0EA5E9', `Phải: ${rhNames}`);
    drawRoleLegend('#10B981', `Giai điệu: ${melNames}`);

    // Piano Keys Area
    const kbPadX = 6;
    const kbPadY = 4;
    const kbX = GUTTER_W + kbPadX;
    const kbY = yPiano + statusH + kbPadY;
    const kbW = Math.max(120, laneW - kbPadX * 2);
    const kbH = PIANO_LANE_H - statusH - kbPadY * 2;
    const whiteW = kbW / TOTAL_WHITE_KEYS;
    const blackW = Math.max(5, whiteW * 0.6);
    const blackH = kbH * 0.61;

    // 7a. White keys
    PIANO_KEY_LAYOUT.forEach((k) => {
      if (k.isBlack) return;
      const x = kbX + k.whiteIndex * whiteW;
      const isBass = bassMidiSet.has(k.midi);
      const isRh = rhMidiSet.has(k.midi);
      const isMel = melodyMidiSet.has(k.midi);
      const isAnyActive = isBass || isRh || isMel;

      ctx.save();
      if (isMel) {
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.55)';
        ctx.shadowBlur = 8;
      } else if (isRh) {
        ctx.fillStyle = isDark ? '#0284C7' : '#38BDF8';
        ctx.shadowColor = 'rgba(14, 165, 233, 0.45)';
        ctx.shadowBlur = 6;
      } else if (isBass) {
        ctx.fillStyle = '#F59E0B';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.45)';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = isDark ? '#F1F5F9' : '#FFFFFF';
      }

      ctx.beginPath();
      ctx.roundRect(x + 0.5, kbY, Math.max(2, whiteW - 1), kbH, [0, 0, 3, 3]);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = isAnyActive
        ? isMel
          ? '#047857'
          : isRh
          ? '#0369A1'
          : '#B45309'
        : isDark
        ? '#334155'
        : '#CBD5E1';
      ctx.lineWidth = isAnyActive ? 1.3 : 1;
      ctx.stroke();

      // Dual role accent bar if melody overlaps bass/right-hand chord
      if (isMel && (isRh || isBass)) {
        ctx.fillStyle = isRh ? '#38BDF8' : '#F59E0B';
        ctx.fillRect(x + 1.5, kbY + 1, Math.max(1, whiteW - 3), 4);
      }

      if (isAnyActive && whiteW >= 14) {
        ctx.fillStyle = isMel || isBass || (isRh && isDark) ? '#FFFFFF' : '#0F172A';
        ctx.font = '700 8.5px "JetBrains Mono", monospace';
        const tw = ctx.measureText(k.noteName).width;
        ctx.fillText(k.noteName, x + Math.max(1, (whiteW - tw) / 2), kbY + kbH - 6);
      } else if (!isAnyActive && k.midi % 12 === 0 && whiteW >= 14) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 8px "JetBrains Mono", monospace';
        const tw = ctx.measureText(k.noteName).width;
        ctx.fillText(k.noteName, x + Math.max(1, (whiteW - tw) / 2), kbY + kbH - 5);
      }
      ctx.restore();
    });

    // 7b. Black keys
    PIANO_KEY_LAYOUT.forEach((k) => {
      if (!k.isBlack) return;
      const centerX = kbX + (k.whiteIndex + 1) * whiteW;
      const x = centerX - blackW / 2;
      const isBass = bassMidiSet.has(k.midi);
      const isRh = rhMidiSet.has(k.midi);
      const isMel = melodyMidiSet.has(k.midi);
      const isAnyActive = isBass || isRh || isMel;

      ctx.save();
      if (isMel) {
        ctx.fillStyle = '#10B981';
        ctx.shadowColor = 'rgba(16, 185, 129, 0.65)';
        ctx.shadowBlur = 8;
      } else if (isRh) {
        ctx.fillStyle = '#0284C7';
        ctx.shadowColor = 'rgba(2, 132, 199, 0.55)';
        ctx.shadowBlur = 6;
      } else if (isBass) {
        ctx.fillStyle = '#D97706';
        ctx.shadowColor = 'rgba(217, 119, 6, 0.55)';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = isDark ? '#0F172A' : '#1E293B';
      }

      ctx.beginPath();
      ctx.roundRect(x, kbY, blackW, blackH, [0, 0, 2.5, 2.5]);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = isAnyActive ? '#FFFFFF' : '#020617';
      ctx.lineWidth = isAnyActive ? 1.2 : 0.8;
      ctx.stroke();

      if (isAnyActive && blackW >= 12) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 7.5px "JetBrains Mono", monospace';
        const shortName = k.noteName.replace(/\d/, '');
        const tw = ctx.measureText(shortName).width;
        ctx.fillText(shortName, x + Math.max(0.5, (blackW - tw) / 2), kbY + blackH - 5);
      }
      ctx.restore();
    });

    ctx.restore(); // End Piano Lane clip

    // 8. Left Track Header Labels Gutter
    ctx.fillStyle = isDark ? '#0B1220' : '#F1F5F9';
    ctx.fillRect(0, 0, GUTTER_W, cssHeight);

    const tracks = [
      { label: 'Ô NHỊP', sub: `${bpm} BPM`, y: yRuler, h: RULER_H },
      { label: 'HỢP ÂM', sub: 'Tay trái/phải', y: yChord, h: CHORD_LANE_H },
      { label: 'GIAI ĐIỆU', sub: 'Piano Roll', y: yMelody, h: MELODY_LANE_H },
      { label: 'CA TỪ', sub: '& Sóng âm', y: yLyric, h: LYRIC_LANE_H },
      { label: 'PIANO', sub: 'Đang đánh', y: yPiano, h: PIANO_LANE_H },
    ];

    tracks.forEach((tr) => {
      ctx.strokeStyle = isDark ? '#1E293B' : '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, tr.y + tr.h);
      ctx.lineTo(cssWidth, tr.y + tr.h);
      ctx.stroke();

      ctx.fillStyle = isDark ? '#E2E8F0' : '#0F172A';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillText(tr.label, 8, tr.y + Math.min(18, tr.h * 0.48));

      if (tr.h >= 38) {
        ctx.fillStyle = isDark ? '#64748B' : '#64748B';
        ctx.font = '500 9px "Plus Jakarta Sans", "Noto Sans", sans-serif';
        ctx.fillText(tr.sub, 8, tr.y + 30);
      }
    });

    // Gutter right border
    ctx.strokeStyle = isDark ? '#1E314E' : '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(GUTTER_W, 0);
    ctx.lineTo(GUTTER_W, cssHeight);
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    let rafId = 0;
    const renderLoop = () => {
      drawTimeline();
      if (isPlaying) {
        rafId = requestAnimationFrame(renderLoop);
      }
    };
    drawTimeline();
    if (isPlaying) {
      rafId = requestAnimationFrame(renderLoop);
    }
    const handleResize = () => drawTimeline();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  });

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < GUTTER_W) return;

    const laneW = Math.max(200, rect.width - GUTTER_W);

    // Clicking inside the live Piano lane auditions the pressed piano key directly
    if (y >= TIMELINE_SCROLL_H) {
      const kbPadX = 6;
      const kbPadY = 4;
      const statusH = 24;
      const kbX = GUTTER_W + kbPadX;
      const kbY = TIMELINE_SCROLL_H + statusH + kbPadY;
      const kbW = Math.max(120, laneW - kbPadX * 2);
      const kbH = PIANO_LANE_H - statusH - kbPadY * 2;
      if (x >= kbX && x <= kbX + kbW && y >= kbY && y <= kbY + kbH) {
        const whiteW = kbW / TOTAL_WHITE_KEYS;
        const blackW = Math.max(5, whiteW * 0.6);
        const blackH = kbH * 0.61;
        if (y <= kbY + blackH) {
          const hitBlack = PIANO_KEY_LAYOUT.find((k) => {
            if (!k.isBlack) return false;
            const centerX = kbX + (k.whiteIndex + 1) * whiteW;
            return x >= centerX - blackW / 2 && x <= centerX + blackW / 2;
          });
          if (hitBlack) {
            onPreviewMidi?.(hitBlack.midi);
            return;
          }
        }
        const whiteIdx = Math.max(
          0,
          Math.min(TOTAL_WHITE_KEYS - 1, Math.floor((x - kbX) / whiteW))
        );
        const hitWhite = PIANO_KEY_LAYOUT.find(
          (k) => !k.isBlack && k.whiteIndex === whiteIdx
        );
        if (hitWhite) {
          onPreviewMidi?.(hitWhite.midi);
        }
      }
      return;
    }

    const windowBeats = Math.min(VISIBLE_BEATS, Math.max(8, timelineData.totalBeats));
    const beatW = laneW / windowBeats;
    const clickedBeat = Math.max(
      0,
      Math.min(
        timelineData.totalBeats - 0.5,
        cameraStartRef.current + (x - GUTTER_W) / beatW
      )
    );
    const snappedBeat = Math.floor(clickedBeat * 2) / 2;
    const targetSec =
      timelineData.sectionItems.find(
        (s) => snappedBeat >= s.startBeat && snappedBeat < s.endBeat
      ) ?? timelineData.sectionItems[0];

    if (targetSec) {
      onSeekBeat(snappedBeat, targetSec.id);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="relative rounded-xl overflow-hidden border border-[#CBD8E6] dark:border-[#1E314E] bg-[#060C18] shadow-xs">
        <canvas
          ref={canvasRef}
          data-testid="song-timeline-canvas"
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-[336px] block cursor-pointer touch-none select-none"
          aria-label="Khung timeline đa track hiển thị ô nhịp, hợp âm, nốt giai điệu, lời bài hát và phím piano đang đánh"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569] dark:text-[#94A3B8]">
        <span>
          Bấm lên timeline để nhảy tới đúng phách · Bấm phím Piano bên dưới để nghe thử nốt
        </span>
        <span className="font-mono">
          {timelineData.noteItems.length} nốt giai điệu · {timelineData.chordEvents.length} hợp âm · {Math.round(timelineData.totalBeats / beatsPerBar)} ô nhịp
        </span>
      </div>
    </div>
  );
}
