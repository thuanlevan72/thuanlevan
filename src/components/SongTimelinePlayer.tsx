import { useEffect, useMemo, useRef } from 'react';
import { getLiveAudioFrame } from '../utils/lyricGrooveAudio.ts';
import {
  ARPEGGIO_PATTERN_META,
  type BackingPatternId,
  buildChordTimeline,
  type ConcreteArpeggioPatternId,
  type MelodyNote,
  midiToNoteName,
  type MoodStyleId,
  parseSectionKaraokeLines,
  type SongSection,
} from '../utils/lyricGrooveEngine.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';

interface SongTimelinePlayerProps {
  theme: ThemeMode;
  sections: SongSection[];
  melodyNotes: MelodyNote[];
  bpm: number;
  backingPattern?: BackingPatternId;
  chordArpStyles?: Record<string, ConcreteArpeggioPatternId>;
  songMood?: MoodStyleId;
  loopScope: 'section' | 'song';
  activeSectionId: string;
  isPlaying: boolean;
  playheadBeatRef: React.MutableRefObject<number>;
  onSeekBeat: (songBeat: number, sectionId: string) => void;
}

interface TimelineNoteItem {
  id: string;
  midi: number;
  noteName: string;
  absStart: number;
  absEnd: number;
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
const TOTAL_CANVAS_H = RULER_H + CHORD_LANE_H + MELODY_LANE_H + LYRIC_LANE_H; // 244px
const VISIBLE_BEATS = 16; // 4 bars visible smoothly in scrolling window

export function SongTimelinePlayer({
  theme,
  sections,
  melodyNotes,
  bpm,
  backingPattern,
  chordArpStyles,
  songMood,
  loopScope,
  activeSectionId,
  isPlaying,
  playheadBeatRef,
  onSeekBeat,
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
      const secDur = sec.bars * 4;
      const startBeat = cursor;
      const endBeat = cursor + secDur;
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
        });
      });

      const karaokeLines = parseSectionKaraokeLines(sec);
      karaokeLines.forEach((line) => {
        line.segments.forEach((seg) => {
          const cleanLyric = seg.lyricText.trim();
          if (!cleanLyric && !seg.chordSymbol) return;
          lyricItems.push({
            text: cleanLyric,
            chordSymbol: seg.chordSymbol,
            absStart: startBeat + seg.startBeat,
            absEnd: startBeat + Math.max(seg.startBeat + 0.5, seg.endBeat),
          });
        });
      });

      cursor = endBeat;
    });

    const { events: chordEvents, totalBeats } = buildChordTimeline(effectiveSections, {
      backingPattern,
      chordArpStyles,
      songMood,
      melodyNotes,
    });
    return {
      sectionItems,
      chordEvents,
      noteItems,
      lyricItems,
      totalBeats: Math.max(4, totalBeats),
      midiLow: Math.max(48, minMidi - 2),
      midiHigh: Math.min(84, maxMidi + 2),
    };
  }, [sections, melodyNotes, backingPattern, chordArpStyles, songMood, loopScope, activeSectionId]);

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

    ctx.fillStyle = isDark ? '#0B1325' : '#EFF6FF';
    ctx.fillRect(GUTTER_W, yRuler, laneW, RULER_H);

    ctx.fillStyle = isDark ? '#081020' : '#FFFFFF';
    ctx.fillRect(GUTTER_W, yChord, laneW, CHORD_LANE_H);

    ctx.fillStyle = isDark ? '#060D1B' : '#FAFBFD';
    ctx.fillRect(GUTTER_W, yMelody, laneW, MELODY_LANE_H);

    ctx.fillStyle = isDark ? '#0A1324' : '#F1F5F9';
    ctx.fillRect(GUTTER_W, yLyric, laneW, LYRIC_LANE_H);

    // Clip track lanes to right of gutter
    ctx.save();
    ctx.beginPath();
    ctx.rect(GUTTER_W, 0, laneW, cssHeight);
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
        ctx.lineTo(exactStart, cssHeight);
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
      const isBar = b % 4 === 0;
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
      ctx.lineTo(bx, cssHeight);
      ctx.stroke();

      if (isBar && b < timelineData.totalBeats) {
        ctx.fillStyle = isDark ? '#94A3B8' : '#475569';
        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.fillText(`Ô ${b / 4 + 1}`, bx + 4, RULER_H - 4);
      } else if (b < timelineData.totalBeats) {
        ctx.fillStyle = isDark ? 'rgba(148,163,184,0.45)' : 'rgba(100,116,139,0.55)';
        ctx.font = '500 8.5px "JetBrains Mono", monospace';
        ctx.fillText(String((b % 4) + 1), bx + 3, RULER_H - 4);
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
        ctx.font = '600 8.5px sans-serif';
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
        isPlaying && rawPlayhead >= n.absStart && rawPlayhead < n.absEnd;
      const alreadyPassed = (isPlaying || rawPlayhead > 0) && n.absEnd <= rawPlayhead;

      ctx.save();
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
      ctx.restore();

      if (w >= 20) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '700 9px "JetBrains Mono", monospace';
        ctx.fillText(n.noteName, x + 4, y + noteH - 2.5);
      }
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

    timelineData.lyricItems.forEach((item) => {
      if (item.absEnd < camStart || item.absStart > camEnd || !item.text) return;
      const x = beatToX(item.absStart) + 3;
      const isCurrent =
        isPlaying && rawPlayhead >= item.absStart && rawPlayhead < item.absEnd;
      const passed = (isPlaying || rawPlayhead > 0) && item.absEnd <= rawPlayhead;

      ctx.font = isCurrent ? '700 12.5px sans-serif' : '500 11.5px sans-serif';
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
      ctx.fillText(item.text, x, yLyric + 21);
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
        ctx.fillRect(Math.max(GUTTER_W, px - 26), RULER_H, 26, cssHeight - RULER_H);
      }

      ctx.strokeStyle = isDark ? '#34D399' : '#E11D48';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = isDark ? 'rgba(52, 211, 153, 0.8)' : 'rgba(225, 29, 72, 0.45)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, cssHeight);
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

    ctx.restore(); // End right-of-gutter clip

    // 7. Left Track Header Labels Gutter
    ctx.fillStyle = isDark ? '#0B1220' : '#F1F5F9';
    ctx.fillRect(0, 0, GUTTER_W, cssHeight);

    const tracks = [
      { label: 'Ô NHỊP', sub: `${bpm} BPM`, y: yRuler, h: RULER_H },
      { label: 'HỢP ÂM', sub: 'Tay trái/phải', y: yChord, h: CHORD_LANE_H },
      { label: 'GIAI ĐIỆU', sub: 'Piano Roll', y: yMelody, h: MELODY_LANE_H },
      { label: 'CA TỪ', sub: '& Sóng âm', y: yLyric, h: LYRIC_LANE_H },
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
        ctx.font = '500 9px sans-serif';
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
    if (x < GUTTER_W) return;

    const laneW = Math.max(200, rect.width - GUTTER_W);
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
          className="w-full h-[244px] block cursor-pointer touch-none select-none"
          aria-label="Khung timeline đa track hiển thị ô nhịp, hợp âm, nốt giai điệu và lời bài hát đang chạy"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#475569] dark:text-[#94A3B8]">
        <span>
          Bấm vào bất kỳ vị trí nào trên khung timeline để nhảy kim phát tới đúng phách đó
        </span>
        <span className="font-mono">
          {timelineData.noteItems.length} nốt giai điệu · {timelineData.chordEvents.length} hợp âm · {timelineData.totalBeats / 4} ô nhịp
        </span>
      </div>
    </div>
  );
}
