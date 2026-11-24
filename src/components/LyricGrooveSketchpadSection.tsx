import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Copy,
  Download,
  FileAudio,
  FileText,
  Image as ImageIcon,
  Layers,
  Mic,
  MicOff,
  Music2,
  Play,
  Plus,
  Repeat,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  auditionChord,
  auditionMidiNote,
  auditionProgression,
  getLiveAudioFrame,
  type MicPitchSession,
  startGrooveLoop,
  startMicPitchCapture,
  stopGrooveLoop,
  stopProgressionAudition,
  warmConcertGrandSamples,
} from '../utils/lyricGrooveAudio.ts';
import {
  deleteSketchpadDraft,
  loadAllSketchpadDrafts,
  saveSketchpadDraft,
} from '../utils/lyricGrooveDb.ts';
import {
  alignSectionLyricsToMelody,
  analyzeSectionLyrics,
  ARPEGGIO_PATTERN_META,
  type BackingInstrumentId,
  type BackingPatternId,
  buildChordTimeline,
  type ConcreteArpeggioPatternId,
  createBlankDraft,
  createStarterDrafts,
  type DrumPatternId,
  extractSectionBarSlots,
  generateHarmonicMelodyForSection,
  getDiatonicChordForPianoKey,
  getDiatonicChordsForKey,
  isSectionMelodyMuted,
  KEY_ROOT_OPTIONS,
  type MelodyInstrumentId,
  type MelodyNote,
  type MelodyPlaybackMode,
  midiToNoteName,
  MOOD_STYLE_OPTIONS,
  type MoodStyleId,
  parseSectionKaraokeLines,
  type PitchFrame,
  PROGRESSION_PRESETS,
  quantizePitchFramesToNotes,
  reorderSongSections,
  resolveMelodyPlaybackMode,
  SECTION_KIND_OPTIONS,
  type SectionKind,
  type SketchpadDraft,
  snapFrequencyToScaleMidi,
  SONG_IDEA_TEMPLATES,
  type SongIdeaTemplate,
  type SongSection,
  suggestNextChords,
  transposeChordSymbol,
  transposeDraftAll,
  updateBarChordInSectionText,
} from '../utils/lyricGrooveEngine.ts';
import {
  exportLeadSheetPdf,
  exportLeadSheetPng,
  exportMidiFile,
  exportWavAudioDemo,
} from '../utils/lyricGrooveExport.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';
import { GrandPianoKeyboard } from './GrandPianoKeyboard.tsx';
import { PianoRollCanvas } from './PianoRollCanvas.tsx';
import { SongTimelinePlayer } from './SongTimelinePlayer.tsx';

interface LyricGrooveSketchpadSectionProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
}

const RHYME_STYLES: Record<
  number,
  { underline: string; bg: string; tag: string }
> = {
  1: {
    underline: 'decoration-sky-500 dark:decoration-sky-400',
    bg: 'bg-sky-500/10 dark:bg-sky-400/14 text-sky-900 dark:text-sky-100',
    tag: 'text-sky-700 dark:text-sky-300',
  },
  2: {
    underline: 'decoration-emerald-500 dark:decoration-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-400/14 text-emerald-900 dark:text-emerald-100',
    tag: 'text-emerald-700 dark:text-emerald-300',
  },
  3: {
    underline: 'decoration-amber-500 dark:decoration-amber-400',
    bg: 'bg-amber-500/12 dark:bg-amber-400/16 text-amber-950 dark:text-amber-100',
    tag: 'text-amber-700 dark:text-amber-300',
  },
  4: {
    underline: 'decoration-rose-500 dark:decoration-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-400/14 text-rose-950 dark:text-rose-100',
    tag: 'text-rose-700 dark:text-rose-300',
  },
  5: {
    underline: 'decoration-indigo-500 dark:decoration-indigo-400',
    bg: 'bg-indigo-500/10 dark:bg-indigo-400/14 text-indigo-950 dark:text-indigo-100',
    tag: 'text-indigo-700 dark:text-indigo-300',
  },
  6: {
    underline: 'decoration-teal-500 dark:decoration-teal-400',
    bg: 'bg-teal-500/10 dark:bg-teal-400/14 text-teal-950 dark:text-teal-100',
    tag: 'text-teal-700 dark:text-teal-300',
  },
};

const VOICING_LABELS = ['Gốc', 'Đảo 1', 'Đảo 2', 'Mở rộng'];

export function LyricGrooveSketchpadSection({
  theme,
  onToggleTheme,
}: LyricGrooveSketchpadSectionProps) {
  const [drafts, setDrafts] = useState<SketchpadDraft[]>(() => createStarterDrafts());
  const [activeDraftId, setActiveDraftId] = useState<string>(
    () => createStarterDrafts()[0].id
  );
  const [activeSectionId, setActiveSectionId] = useState<string>(
    () => createStarterDrafts()[0].sections[0].id
  );
  const [loopScope, setLoopScope] = useState<'section' | 'song'>('song');
  const [repeatLoop, setRepeatLoop] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSectionId, setPlayingSectionId] = useState<string | null>(null);
  const [liveBeatIndicator, setLiveBeatIndicator] = useState<string>('Ô 1 · 1');
  const [sectionBeatLocal, setSectionBeatLocal] = useState<number>(0);
  const [songBeatPos, setSongBeatPos] = useState<number>(0);
  const [liveChordInfo, setLiveChordInfo] = useState<{
    symbol: string;
    nextSymbol: string | null;
    midis: number[];
  } | null>(null);
  const [liveMelodyInfo, setLiveMelodyInfo] = useState<{
    midi: number;
    noteName: string;
  } | null>(null);

  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(0);
  const [selectedAnchorChord, setSelectedAnchorChord] = useState<string>('Am9');
  const [liveHighlightChord, setLiveHighlightChord] = useState<{
    symbol: string;
    shift: number;
  } | null>(null);
  const [auditioningPresetId, setAuditioningPresetId] = useState<string | null>(null);

  const [pianoPlayMode, setPianoPlayMode] = useState<'solo' | 'chord'>('solo');
  const [recordKeysToRoll, setRecordKeysToRoll] = useState(false);
  const [melodySeed, setMelodySeed] = useState(0);

  const [leftSubTab, setLeftSubTab] = useState<'rhyme' | 'harmony'>('harmony');
  const [showToneMarkers, setShowToneMarkers] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showIdeaMenu, setShowIdeaMenu] = useState(false);

  const [chordVoicings, setChordVoicings] = useState<Record<string, number>>({});
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [newSectionKind, setNewSectionKind] = useState<SectionKind>('Bridge');

  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [livePitchLabel, setLivePitchLabel] = useState<string>('Sẵn sàng thu giọng');
  const [liveRmsPercent, setLiveRmsPercent] = useState<number>(0);

  const [saveNotice, setSaveNotice] = useState<string>('Tự động lưu');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExportingWav, setIsExportingWav] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorPosRef = useRef<number>(0);
  const playheadBeatRef = useRef<number>(0);
  const recordBeatCursorRef = useRef<number>(0);
  const liveWaveformRef = useRef<Float32Array | null>(null);
  const liveDetectedMidiRef = useRef<number | null>(null);
  const micSessionRef = useRef<MicPitchSession | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const headerMenusRef = useRef<HTMLDivElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chordClearTimerRef = useRef<number | null>(null);
  const melodyClearTimerRef = useRef<number | null>(null);
  const skipNextRestartRef = useRef<boolean>(false);

  useEffect(() => {
    void warmConcertGrandSamples();
  }, []);

  useEffect(() => {
    if (!showExportMenu && !showIdeaMenu) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (
        headerMenusRef.current &&
        !headerMenusRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
        setShowIdeaMenu(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExportMenu(false);
        setShowIdeaMenu(false);
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [showExportMenu, showIdeaMenu]);

  // Load persisted drafts from Dexie IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    loadAllSketchpadDrafts().then((loaded) => {
      if (!mounted || loaded.length === 0) return;
      setDrafts(loaded);
      const first = loaded[0];
      setActiveDraftId(first.id);
      const defaultSec = first.sections[0];
      if (defaultSec) {
        setActiveSectionId(defaultSec.id);
      }
    });
    return () => {
      mounted = false;
      stopGrooveLoop();
      if (chordClearTimerRef.current) {
        window.clearTimeout(chordClearTimerRef.current);
      }
      if (melodyClearTimerRef.current) {
        window.clearTimeout(melodyClearTimerRef.current);
      }
      if (micSessionRef.current) {
        micSessionRef.current.stop();
        micSessionRef.current = null;
      }
    };
  }, []);

  const activeDraft = useMemo(
    () => drafts.find((d) => d.id === activeDraftId) ?? drafts[0],
    [drafts, activeDraftId]
  );

  const activeSection = useMemo(
    () =>
      activeDraft.sections.find((s) => s.id === activeSectionId) ??
      activeDraft.sections[0],
    [activeDraft, activeSectionId]
  );

  const activeSectionIndex = useMemo(
    () => activeDraft.sections.findIndex((s) => s.id === activeSection.id),
    [activeDraft.sections, activeSection.id]
  );

  useEffect(() => {
    if (!activeDraft.sections.some((s) => s.id === activeSectionId)) {
      const preferred = activeDraft.sections[0];
      if (preferred) setActiveSectionId(preferred.id);
    }
    recordBeatCursorRef.current = 0;
    setSelectedBarIndex(0);
  }, [activeDraft, activeSectionId]);

  const activeBackingPattern: BackingPatternId =
    activeDraft.backingPattern ?? 'auto-song';
  const activeBackingSelectValue =
    activeBackingPattern === 'ballad-arpeggio' ? 'ballad-wave' : activeBackingPattern;
  const activeSustainPedal = activeDraft.sustainPedal ?? true;
  const activeMetronome = activeDraft.metronomeEnabled ?? false;
  const activeMelodyMode = resolveMelodyPlaybackMode(activeDraft);
  const isActiveSectionMuted = isSectionMelodyMuted(
    activeSection,
    activeMelodyMode,
    activeDraft.mutedMelodySectionIds
  );

  const updateActiveDraft = useCallback(
    (updater: (prev: SketchpadDraft) => SketchpadDraft) => {
      setDrafts((prevList) =>
        prevList.map((d) => {
          if (d.id !== activeDraft.id) return d;
          const updated = { ...updater(d), updatedAt: Date.now() };
          setSaveNotice('Đang lưu...');
          if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
          }
          saveTimerRef.current = window.setTimeout(() => {
            void saveSketchpadDraft(updated).then(() => {
              setSaveNotice('Đã lưu · IndexedDB');
            });
          }, 260);
          return updated;
        })
      );
    },
    [activeDraft.id]
  );

  const sectionAnalysis = useMemo(
    () => analyzeSectionLyrics(activeSection),
    [activeSection]
  );

  const diatonicPalette = useMemo(
    () =>
      getDiatonicChordsForKey(
        activeDraft.keyRoot,
        activeDraft.scaleMode,
        activeDraft.mood
      ),
    [activeDraft.keyRoot, activeDraft.scaleMode, activeDraft.mood]
  );

  const barSlots = useMemo(
    () =>
      extractSectionBarSlots(
        activeSection,
        diatonicPalette[0] ?? `${activeDraft.keyRoot}maj7`,
        {
          backingPattern: activeBackingPattern,
          chordArpStyles: activeDraft.chordArpStyles,
          songMood: activeDraft.mood,
        }
      ),
    [
      activeSection,
      diatonicPalette,
      activeDraft.keyRoot,
      activeBackingPattern,
      activeDraft.chordArpStyles,
      activeDraft.mood,
    ]
  );

  const chordSuggestions = useMemo(
    () =>
      suggestNextChords(
        selectedAnchorChord,
        activeDraft.keyRoot,
        activeDraft.scaleMode,
        activeDraft.mood
      ),
    [
      selectedAnchorChord,
      activeDraft.keyRoot,
      activeDraft.scaleMode,
      activeDraft.mood,
    ]
  );

  const sectionMelodyNotes = useMemo(
    () =>
      activeDraft.melodyNotes.filter((n) => n.sectionId === activeSection.id),
    [activeDraft.melodyNotes, activeSection.id]
  );

  const sectionChordMarkers = useMemo(() => {
    const { events } = buildChordTimeline([activeSection], {
      backingPattern: activeBackingPattern,
      chordArpStyles: activeDraft.chordArpStyles,
      songMood: activeDraft.mood,
      melodyNotes: sectionMelodyNotes,
    });
    return events.map((ev) => ({
      symbol: ev.symbol,
      beatOffset: ev.startBeat,
    }));
  }, [
    activeSection,
    activeBackingPattern,
    activeDraft.chordArpStyles,
    activeDraft.mood,
    sectionMelodyNotes,
  ]);

  const songTimelineSpans = useMemo(() => {
    const spans: Array<{
      id: string;
      label: string;
      kind: SectionKind;
      bars: number;
      start: number;
      end: number;
    }> = [];
    let cursor = 0;
    activeDraft.sections.forEach((sec) => {
      const dur = sec.bars * 4;
      spans.push({
        id: sec.id,
        label: sec.label,
        kind: sec.kind,
        bars: sec.bars,
        start: cursor,
        end: cursor + dur,
      });
      cursor += dur;
    });
    return { spans, totalBeats: Math.max(4, cursor) };
  }, [activeDraft.sections]);

  const activeSectionStartBeat = useMemo(() => {
    if (loopScope === 'section') return 0;
    return (
      songTimelineSpans.spans.find((s) => s.id === activeSection.id)?.start ?? 0
    );
  }, [loopScope, songTimelineSpans.spans, activeSection.id]);

  const activeKaraokeLines = useMemo(
    () => parseSectionKaraokeLines(activeSection),
    [activeSection]
  );

  const sectionSyncWords = useMemo(
    () => alignSectionLyricsToMelody(activeSection, sectionMelodyNotes, 0),
    [activeSection, sectionMelodyNotes]
  );

  const clearLivePlayState = useCallback(() => {
    if (chordClearTimerRef.current) {
      window.clearTimeout(chordClearTimerRef.current);
      chordClearTimerRef.current = null;
    }
    if (melodyClearTimerRef.current) {
      window.clearTimeout(melodyClearTimerRef.current);
      melodyClearTimerRef.current = null;
    }
    setLiveChordInfo(null);
    setLiveMelodyInfo(null);
    setSectionBeatLocal(0);
    setSongBeatPos(0);
    setPlayingSectionId(null);
    playheadBeatRef.current = 0;
    setLiveBeatIndicator('Ô 1 · 1');
  }, []);

  const launchLoopPlayback = useCallback(
    async (targetScope: 'section' | 'song', startBeat = 0) => {
      stopProgressionAudition();
      setAuditioningPresetId(null);
      setLiveHighlightChord(null);

      const scopeSections =
        targetScope === 'section' ? [activeSection] : activeDraft.sections;

      setIsPlaying(true);
      playheadBeatRef.current = startBeat;
      setSongBeatPos(startBeat);

      await startGrooveLoop({
        sections: scopeSections,
        melodyNotes: activeDraft.melodyNotes,
        bpm: activeDraft.bpm,
        backingInstrument: activeDraft.backingInstrument,
        backingPattern: activeBackingPattern,
        chordArpStyles: activeDraft.chordArpStyles,
        songMood: activeDraft.mood,
        sustainPedal: activeSustainPedal,
        metronomeEnabled: activeMetronome,
        drumPattern: activeDraft.drumPattern,
        melodyInstrument: activeDraft.melodyInstrument,
        melodyMuted: activeDraft.melodyMuted ?? false,
        melodyPlaybackMode: activeMelodyMode,
        mutedMelodySectionIds: activeDraft.mutedMelodySectionIds ?? [],
        repeatLoop,
        startBeatOffset: startBeat,
        volumeGain: 0.9,
        onChordTrigger: (ev) => {
          if (!ev) {
            setLiveChordInfo(null);
            return;
          }
          setLiveChordInfo({
            symbol: ev.symbol,
            nextSymbol: ev.nextSymbol,
            midis: [...ev.bassMidis, ...ev.rightHandMidis],
          });
          setLiveHighlightChord({ symbol: ev.symbol, shift: 0 });
          if (chordClearTimerRef.current) {
            window.clearTimeout(chordClearTimerRef.current);
          }
          const holdMs = Math.max(
            260,
            ev.durationBeats * (60 / Math.max(45, activeDraft.bpm)) * 1000
          );
          chordClearTimerRef.current = window.setTimeout(() => {
            setLiveChordInfo(null);
          }, holdMs);
        },
        onMelodyTrigger: (ev) => {
          if (!ev) {
            setLiveMelodyInfo(null);
            return;
          }
          setLiveMelodyInfo({ midi: ev.midi, noteName: ev.noteName });
          if (melodyClearTimerRef.current) {
            window.clearTimeout(melodyClearTimerRef.current);
          }
          const holdMs = Math.max(
            180,
            ev.durationBeats * (60 / Math.max(45, activeDraft.bpm)) * 920
          );
          melodyClearTimerRef.current = window.setTimeout(() => {
            setLiveMelodyInfo(null);
          }, holdMs);
        },
        onPlaybackEnded: () => {
          setIsPlaying(false);
          clearLivePlayState();
        },
        onProgressBeat: (beatInLoop, _totalBeats, curSecId, detail) => {
          playheadBeatRef.current = beatInLoop;
          const localBeat = detail ? detail.beatInSection : beatInLoop;
          const barNum = Math.floor(localBeat / 4) + 1;
          const beatNum = Math.floor(localBeat % 4) + 1;
          setLiveBeatIndicator(`Ô ${barNum} · ${beatNum}`);
          setSectionBeatLocal(localBeat);
          setSongBeatPos(beatInLoop);
          setPlayingSectionId((prev) => (prev === curSecId ? prev : curSecId));
          if (targetScope === 'song') {
            setActiveSectionId((prev) => (prev === curSecId ? prev : curSecId));
          }
          if (detail?.activeChordSymbol) {
            const sym = detail.activeChordSymbol;
            const nextSym = detail.nextChordSymbol;
            setLiveChordInfo((prev) =>
              prev && prev.symbol === sym && prev.nextSymbol === nextSym
                ? prev
                : { symbol: sym, nextSymbol: nextSym, midis: prev?.midis ?? [] }
            );
          }
        },
      });
    },
    [
      activeSection,
      activeDraft.sections,
      activeDraft.melodyNotes,
      activeDraft.bpm,
      activeDraft.backingInstrument,
      activeBackingPattern,
      activeDraft.chordArpStyles,
      activeDraft.mood,
      activeSustainPedal,
      activeMetronome,
      activeDraft.drumPattern,
      activeDraft.melodyInstrument,
      activeDraft.melodyMuted,
      activeMelodyMode,
      activeDraft.mutedMelodySectionIds,
      repeatLoop,
      clearLivePlayState,
    ]
  );

  // Playback toggle for active scope
  const handleTogglePlayback = useCallback(async () => {
    if (isPlaying) {
      stopGrooveLoop();
      setIsPlaying(false);
      clearLivePlayState();
      return;
    }
    skipNextRestartRef.current = true;
    await launchLoopPlayback(loopScope, 0);
  }, [isPlaying, clearLivePlayState, launchLoopPlayback, loopScope]);

  // Dedicated "Phát Cả Bài" trigger from beat 0 or stops if already playing full song
  const handlePlayFullSong = useCallback(async () => {
    if (isPlaying && loopScope === 'song') {
      stopGrooveLoop();
      setIsPlaying(false);
      clearLivePlayState();
      return;
    }
    skipNextRestartRef.current = true;
    setLoopScope('song');
    if (activeDraft.sections[0]) {
      setActiveSectionId(activeDraft.sections[0].id);
    }
    await launchLoopPlayback('song', 0);
  }, [isPlaying, loopScope, clearLivePlayState, activeDraft.sections, launchLoopPlayback]);

  const handleSeekTimelineBeat = useCallback(
    (targetBeat: number, targetSectionId?: string) => {
      const span = songTimelineSpans.spans.find(
        (s) =>
          (targetSectionId && s.id === targetSectionId) ||
          (targetBeat >= s.start && targetBeat < s.end)
      );
      const resolvedSectionId = targetSectionId ?? span?.id;
      const localBeat = span ? Math.max(0, targetBeat - span.start) : targetBeat;

      if (resolvedSectionId) {
        setActiveSectionId(resolvedSectionId);
        setPlayingSectionId(resolvedSectionId);
      }
      playheadBeatRef.current = targetBeat;
      setSongBeatPos(targetBeat);
      setSectionBeatLocal(localBeat);
      const barNum = Math.floor(localBeat / 4) + 1;
      const beatNum = Math.floor(localBeat % 4) + 1;
      setLiveBeatIndicator(`Ô ${barNum} · ${beatNum}`);

      skipNextRestartRef.current = true;
      setLoopScope('song');
      void launchLoopPlayback('song', targetBeat);
    },
    [launchLoopPlayback, songTimelineSpans.spans]
  );

  // Live 60fps audio spectrum visualizer inside Synchronized Song Stage
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const drawSpectrum = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 240;
      const h = canvas.clientHeight || 40;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const frame = isPlaying ? getLiveAudioFrame() : null;
      const barCount = 28;
      const gap = 3;
      const barW = Math.max(2, (w - gap * (barCount - 1)) / barCount);

      for (let i = 0; i < barCount; i++) {
        let norm = 0.08;
        if (frame && frame.spectrum.length > 0) {
          const binIdx = Math.min(
            frame.spectrum.length - 1,
            Math.floor((i / barCount) * (frame.spectrum.length * 0.55))
          );
          norm = Math.max(0.08, frame.spectrum[binIdx] / 255);
        }
        const barH = Math.max(3, norm * (h - 4));
        const x = i * (barW + gap);
        const y = h - barH;
        ctx.fillStyle = isPlaying
          ? i % 2 === 0
            ? '#10B981'
            : '#38BDF8'
          : theme === 'dark'
          ? 'rgba(148, 163, 184, 0.25)'
          : 'rgba(100, 116, 139, 0.25)';
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      }
      ctx.restore();
      if (isPlaying) {
        rafId = requestAnimationFrame(drawSpectrum);
      }
    };

    drawSpectrum();
    if (isPlaying) {
      rafId = requestAnimationFrame(drawSpectrum);
    }
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, theme]);

  // Restart loop seamlessly ONLY when musical sound/arrangement settings change while playing
  const activeSectionIdForEffect = loopScope === 'section' ? activeSection.id : 'song';
  const launchRef = useRef(launchLoopPlayback);
  launchRef.current = launchLoopPlayback;

  useEffect(() => {
    if (!isPlaying) return;
    if (skipNextRestartRef.current) {
      skipNextRestartRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      const resumeBeat = loopScope === 'song' ? playheadBeatRef.current : 0;
      void launchRef.current(loopScope, resumeBeat);
    }, 140);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loopScope,
    activeSectionIdForEffect,
    activeDraft.sections,
    activeDraft.melodyNotes,
    activeDraft.bpm,
    activeDraft.backingInstrument,
    activeBackingPattern,
    activeDraft.chordArpStyles,
    activeDraft.mood,
    activeSustainPedal,
    activeMetronome,
    activeDraft.drumPattern,
    activeDraft.melodyInstrument,
    activeDraft.melodyMuted,
    activeMelodyMode,
    activeDraft.mutedMelodySectionIds,
    repeatLoop,
  ]);

  // Smart Spacebar shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      const isTextControl =
        target &&
        (target.tagName === 'TEXTAREA' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (!isTextControl || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        void handleTogglePlayback();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTogglePlayback]);

  const auditionAndHighlightChord = useCallback(
    (symbol: string, shift = 0, overridePattern?: BackingPatternId) => {
      setSelectedAnchorChord(symbol);
      setLiveHighlightChord({ symbol, shift });
      void auditionChord(
        symbol,
        activeDraft.backingInstrument,
        shift,
        activeSustainPedal,
        overridePattern ?? activeBackingPattern
      );
    },
    [activeDraft.backingInstrument, activeSustainPedal, activeBackingPattern]
  );

  // Cycle individual bar/chord arpeggio pattern ("1 hợp âm có nhiều cách rải khác nhau")
  const handleCycleBarArpPattern = (
    eventIndex: number,
    chordSymbol: string,
    currentArp: ConcreteArpeggioPatternId
  ) => {
    const idx = ARPEGGIO_PATTERN_META.findIndex((m) => m.id === currentArp);
    const nextArp =
      ARPEGGIO_PATTERN_META[(idx + 1) % ARPEGGIO_PATTERN_META.length].id;
    const key = `${activeSection.id}:${eventIndex}`;
    updateActiveDraft((d) => ({
      ...d,
      chordArpStyles: {
        ...(d.chordArpStyles ?? {}),
        [key]: nextArp,
      },
    }));
    auditionAndHighlightChord(chordSymbol, 0, nextArp);
  };

  // Swap selected bar chord cleanly in 1 click without touching lyrics
  const handleSetBarChord = (barIndex: number, symbol: string) => {
    const nextText = updateBarChordInSectionText(activeSection, barIndex, symbol);
    updateActiveDraft((d) => ({
      ...d,
      sections: d.sections.map((sec) =>
        sec.id === activeSection.id
          ? { ...sec, text: nextText, chordSchedule: undefined }
          : sec
      ),
    }));
    const slotArp = barSlots[barIndex]?.arpPattern;
    auditionAndHighlightChord(symbol, 0, slotArp);
  };

  const handleInsertChordAtCursor = (symbol: string) => {
    auditionAndHighlightChord(symbol, 0);

    const ta = textareaRef.current;
    const tag = `[${symbol}]`;
    const pos = ta ? ta.selectionStart ?? cursorPosRef.current : activeSection.text.length;
    const end = ta ? ta.selectionEnd ?? pos : pos;
    const currentText = activeSection.text;
    const nextText = currentText.slice(0, pos) + tag + currentText.slice(end);

    updateActiveDraft((d) => ({
      ...d,
      sections: d.sections.map((sec) =>
        sec.id === activeSection.id
          ? { ...sec, text: nextText, chordSchedule: undefined }
          : sec
      ),
    }));

    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        const nextPos = pos + tag.length;
        ta.setSelectionRange(nextPos, nextPos);
        cursorPosRef.current = nextPos;
      }
    });
  };

  const handleCycleChordVoicing = (symbol: string, keyId: string) => {
    const nextShift = ((chordVoicings[keyId] ?? 0) + 1) % 4;
    setChordVoicings((prev) => ({ ...prev, [keyId]: nextShift }));
    auditionAndHighlightChord(symbol, nextShift);
  };

  const handleTransposeSemitones = (semitones: -1 | 1) => {
    updateActiveDraft((d) => transposeDraftAll(d, semitones));
    const nextAnchor = transposeChordSymbol(selectedAnchorChord, semitones);
    setSelectedAnchorChord(nextAnchor);
    setLiveHighlightChord({ symbol: nextAnchor, shift: 0 });
    void auditionChord(
      nextAnchor,
      activeDraft.backingInstrument,
      0,
      activeSustainPedal,
      activeBackingPattern
    );
  };

  const handleAuditionPreset = (presetId: string, chords: string[]) => {
    if (auditioningPresetId === presetId) {
      stopProgressionAudition();
      setAuditioningPresetId(null);
      setLiveHighlightChord(null);
      return;
    }
    if (isPlaying) {
      stopGrooveLoop();
      setIsPlaying(false);
      setPlayingSectionId(null);
    }
    setAuditioningPresetId(presetId);
    void auditionProgression(
      chords,
      activeDraft.backingInstrument,
      activeBackingPattern,
      activeDraft.bpm,
      activeSustainPedal,
      (step) => {
        if (!step) {
          setAuditioningPresetId(null);
          setLiveHighlightChord(null);
          return;
        }
        setSelectedAnchorChord(step.symbol);
        setLiveHighlightChord({ symbol: step.symbol, shift: 0 });
      }
    );
  };

  const handleInsertProgressionPreset = (chords: string[]) => {
    if (chords.length === 0) return;
    const lines: string[] = [];
    for (let i = 0; i < chords.length; i += 2) {
      const c1 = chords[i];
      const c2 = chords[i + 1];
      lines.push(
        c2 ? `[${c1}]Viết lời tại [${c2}]đây` : `[${c1}]Viết lời tại đây`
      );
    }
    const snippet = lines.join('\n');
    const prefix =
      activeSection.text.trim().length > 0 && !activeSection.text.endsWith('\n')
        ? '\n'
        : '';
    const nextText = `${activeSection.text}${prefix}${snippet}`;
    updateActiveDraft((d) => ({
      ...d,
      sections: d.sections.map((sec) =>
        sec.id === activeSection.id ? { ...sec, text: nextText } : sec
      ),
    }));
    auditionAndHighlightChord(chords[0], 0);
  };

  // 1-Click Auto Harmonic Melody Generator matched to active section's chords
  const handleGenerateHarmonicMelody = () => {
    const nextSeed = melodySeed + 1;
    setMelodySeed(nextSeed);
    const generated = generateHarmonicMelodyForSection(
      activeSection,
      activeDraft.keyRoot,
      activeDraft.scaleMode,
      nextSeed
    );
    updateActiveDraft((d) => ({
      ...d,
      melodyNotes: [
        ...d.melodyNotes.filter((n) => n.sectionId !== activeSection.id),
        ...generated,
      ],
    }));
    setLivePitchLabel(
      `Đã tạo ${generated.length} nốt giai điệu khớp hợp âm tông ${activeDraft.keyRoot}`
    );
    if (generated[0]) {
      void auditionMidiNote(
        generated[0].midi,
        activeDraft.melodyInstrument,
        activeSustainPedal
      );
    }
  };

  // Apply 1-Click Songwriting Idea Template cleanly
  const handleApplySongIdeaTemplate = (tpl: SongIdeaTemplate) => {
    setShowIdeaMenu(false);
    const updatedSection: SongSection = {
      ...activeSection,
      bars: 4,
      text: tpl.sectionText,
    };
    const autoNotes = generateHarmonicMelodyForSection(
      updatedSection,
      tpl.keyRoot,
      tpl.scaleMode,
      0
    );
    updateActiveDraft((d) => ({
      ...d,
      keyRoot: tpl.keyRoot,
      scaleMode: tpl.scaleMode,
      mood: tpl.mood,
      bpm: tpl.bpm,
      backingInstrument: tpl.backingInstrument,
      backingPattern: tpl.backingPattern,
      drumPattern: tpl.drumPattern,
      sustainPedal: true,
      sections: d.sections.map((s) =>
        s.id === activeSection.id ? updatedSection : s
      ),
      melodyNotes: [
        ...d.melodyNotes.filter((n) => n.sectionId !== activeSection.id),
        ...autoNotes,
      ],
    }));
    setLivePitchLabel(`Đã áp dụng mẫu "${tpl.label}" + giai điệu Grand Piano`);
    const firstBar = extractSectionBarSlots(updatedSection)[0]?.primaryChord;
    if (firstBar) {
      setSelectedAnchorChord(firstBar);
      setLiveHighlightChord({ symbol: firstBar, shift: 0 });
      void auditionChord(
        firstBar,
        tpl.backingInstrument,
        0,
        true,
        tpl.backingPattern
      );
    }
  };

  // Section management
  const handleAddSection = () => {
    const countSame = activeDraft.sections.filter(
      (s) => s.kind === newSectionKind
    ).length;
    const nextSec: SongSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      kind: newSectionKind,
      label: `${newSectionKind} ${countSame + 1}`,
      bars: 4,
      text: `[${diatonicPalette[0] ?? 'Cmaj7'}]Viết lời cho đoạn ${newSectionKind.toLowerCase()} tại [${diatonicPalette[3] ?? 'Fmaj7'}]đây`,
    };
    updateActiveDraft((d) => ({
      ...d,
      sections: [...d.sections, nextSec],
    }));
    setActiveSectionId(nextSec.id);
  };

  const handleDuplicateSection = (sec: SongSection) => {
    const copy: SongSection = {
      ...sec,
      id: `sec-copy-${Date.now()}`,
      label: `${sec.label} (Bản sao)`,
    };
    updateActiveDraft((d) => {
      const idx = d.sections.findIndex((s) => s.id === sec.id);
      const next = [...d.sections];
      next.splice(idx + 1, 0, copy);
      return { ...d, sections: next };
    });
    setActiveSectionId(copy.id);
  };

  const handleDeleteSection = (secId: string) => {
    if (activeDraft.sections.length <= 1) return;
    updateActiveDraft((d) => ({
      ...d,
      sections: d.sections.filter((s) => s.id !== secId),
      melodyNotes: d.melodyNotes.filter((n) => n.sectionId !== secId),
    }));
  };

  const handleMoveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= activeDraft.sections.length) return;
    updateActiveDraft((d) => ({
      ...d,
      sections: reorderSongSections(d.sections, index, target),
    }));
  };

  // Mic Pitch Capture (Pitchy)
  const handleToggleMicRecord = async () => {
    if (isRecording && micSessionRef.current) {
      const frames = micSessionRef.current.stop();
      micSessionRef.current = null;
      setIsRecording(false);
      liveDetectedMidiRef.current = null;
      setLiveRmsPercent(0);

      const newNotes = quantizePitchFramesToNotes(
        frames,
        activeDraft.bpm,
        activeSection.id,
        activeSection.bars * 4,
        activeDraft.keyRoot,
        activeDraft.scaleMode,
        activeDraft.scaleSnap
      );

      if (newNotes.length > 0) {
        updateActiveDraft((d) => ({
          ...d,
          melodyNotes: [
            ...d.melodyNotes.filter((n) => n.sectionId !== activeSection.id),
            ...newNotes,
          ],
        }));
        setLivePitchLabel(`Đã chuyển ${newNotes.length} nốt từ giọng ngân nga`);
      } else {
        setLivePitchLabel('Chưa bắt được nốt rõ — hãy thử ngân nga gần mic hơn');
      }
      return;
    }

    setMicError(null);
    try {
      const session = await startMicPitchCapture({
        onFrame: ({ freqHz, rms, waveform }) => {
          liveWaveformRef.current = waveform;
          setLiveRmsPercent(Math.min(100, Math.round(rms * 450)));
          if (freqHz > 0) {
            const snapped = snapFrequencyToScaleMidi(
              freqHz,
              activeDraft.keyRoot,
              activeDraft.scaleMode,
              activeDraft.scaleSnap
            );
            liveDetectedMidiRef.current = snapped;
            setLivePitchLabel(
              `${midiToNoteName(snapped)} · ${freqHz.toFixed(1)} Hz`
            );
          }
        },
      });
      micSessionRef.current = session;
      setIsRecording(true);
      setLivePitchLabel('Đang nghe micro — hãy ngân nga giai điệu...');
      if (!isPlaying) {
        void handleTogglePlayback();
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không truy cập được micro trên thiết bị này.';
      setMicError(
        `${msg} Bạn vẫn có thể bấm "Gợi ý giai điệu" hoặc chơi trực tiếp trên phím Grand Piano.`
      );
      setIsRecording(false);
    }
  };

  // Simulated hum-to-MIDI phrase
  const handleSimulateHumPhrase = () => {
    setMicError(null);
    const secPerBeat = 60 / activeDraft.bpm;
    const baseHz = activeDraft.keyRoot === 'F' ? 349.23 : 261.63;
    const ratios = [1, 1.12, 1.24, 1.35, 1.49, 1.33, 1.18, 1];
    const simulatedFrames: PitchFrame[] = [];
    ratios.forEach((ratio, i) => {
      const t = i * secPerBeat * 0.75;
      simulatedFrames.push({ timeSec: t, freqHz: baseHz * ratio, clarity: 0.92 });
      simulatedFrames.push({ timeSec: t + 0.14, freqHz: baseHz * ratio * 1.01, clarity: 0.9 });
    });

    const quantized = quantizePitchFramesToNotes(
      simulatedFrames,
      activeDraft.bpm,
      activeSection.id,
      activeSection.bars * 4,
      activeDraft.keyRoot,
      activeDraft.scaleMode,
      activeDraft.scaleSnap
    );

    updateActiveDraft((d) => ({
      ...d,
      melodyNotes: [
        ...d.melodyNotes.filter((n) => n.sectionId !== activeSection.id),
        ...quantized,
      ],
    }));
    setLivePitchLabel(
      `Đã nắn ${quantized.length} nốt ngân nga mẫu theo tông ${activeDraft.keyRoot}`
    );
  };

  // Draft Switching / Creating / Deleting
  const handleCreateNewDraft = () => {
    stopGrooveLoop();
    setIsPlaying(false);
    const fresh = createBlankDraft(drafts.length + 1);
    setDrafts((prev) => [fresh, ...prev]);
    setActiveDraftId(fresh.id);
    setActiveSectionId(fresh.sections[0].id);
    void saveSketchpadDraft(fresh);
  };

  const handleDeleteCurrentDraft = () => {
    if (drafts.length <= 1) return;
    stopGrooveLoop();
    setIsPlaying(false);
    const remaining = drafts.filter((d) => d.id !== activeDraft.id);
    void deleteSketchpadDraft(activeDraft.id);
    setDrafts(remaining);
    setActiveDraftId(remaining[0].id);
    setActiveSectionId(remaining[0].sections[0].id);
  };

  const handleExportWav = async () => {
    setShowExportMenu(false);
    setIsExportingWav(true);
    setExportStatus('Đang kết xuất bản Audio .WAV...');
    try {
      await exportWavAudioDemo(activeDraft);
      setExportStatus('Đã tải file Audio Demo (.WAV)');
    } catch {
      setExportStatus('Không thể kết xuất Audio trên trình duyệt này');
    } finally {
      setIsExportingWav(false);
    }
  };

  const handleMoodChange = (nextMood: MoodStyleId) => {
    const preset = MOOD_STYLE_OPTIONS.find((m) => m.id === nextMood);
    updateActiveDraft((d) => ({
      ...d,
      mood: nextMood,
      bpm: preset ? preset.defaultBpm : d.bpm,
      backingInstrument: preset ? preset.defaultBacking : d.backingInstrument,
      drumPattern: preset ? preset.defaultDrums : d.drumPattern,
    }));
  };

  const addMelodyNote = useCallback(
    (note: MelodyNote) => {
      updateActiveDraft((d) => ({
        ...d,
        melodyNotes: [...d.melodyNotes, note],
      }));
    },
    [updateActiveDraft]
  );

  const removeMelodyNote = useCallback(
    (noteId: string) => {
      updateActiveDraft((d) => ({
        ...d,
        melodyNotes: d.melodyNotes.filter((n) => n.id !== noteId),
      }));
    },
    [updateActiveDraft]
  );

  const resizeMelodyNoteDuration = useCallback(
    (noteId: string, durationBeats: number) => {
      updateActiveDraft((d) => ({
        ...d,
        melodyNotes: d.melodyNotes.map((n) =>
          n.id === noteId ? { ...n, durationBeats } : n
        ),
      }));
    },
    [updateActiveDraft]
  );

  const handlePianoKeyTrigger = useCallback(
    (midi: number) => {
      if (pianoPlayMode === 'chord') {
        const chordSym = getDiatonicChordForPianoKey(
          midi,
          activeDraft.keyRoot,
          activeDraft.scaleMode,
          activeDraft.mood
        );
        auditionAndHighlightChord(chordSym, 0);
        return;
      }

      void auditionMidiNote(midi, activeDraft.melodyInstrument, activeSustainPedal);
      if (!recordKeysToRoll) return;

      const totalSecBeats = activeSection.bars * 4;
      const startBeat = isPlaying
        ? Math.floor((playheadBeatRef.current % totalSecBeats) * 4) / 4
        : recordBeatCursorRef.current % totalSecBeats;
      if (!isPlaying) {
        recordBeatCursorRef.current = (startBeat + 0.5) % totalSecBeats;
      }

      addMelodyNote({
        id: `key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sectionId: activeSection.id,
        midi,
        startBeat: Math.max(0, Math.min(totalSecBeats - 0.5, startBeat)),
        durationBeats: 0.5,
        velocity: 0.86,
      });
    },
    [
      pianoPlayMode,
      activeDraft.keyRoot,
      activeDraft.scaleMode,
      activeDraft.mood,
      activeDraft.melodyInstrument,
      activeSustainPedal,
      recordKeysToRoll,
      activeSection.bars,
      activeSection.id,
      isPlaying,
      addMelodyNote,
      auditionAndHighlightChord,
    ]
  );

  return (
    <section
      id="lyric-groove-sketchpad"
      className="pt-6 pb-10 space-y-4"
      data-playing={isPlaying ? 'true' : 'false'}
    >
      {/* Compact Studio Masthead */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#DCE6F2] dark:border-[#182740] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
            <span className="font-semibold text-[#0369A1] dark:text-[#38BDF8]">
              Phòng Sáng Tác Acoustic Studio
            </span>
            <span aria-hidden="true">·</span>
            <span data-testid="autosave-status">{saveNotice}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#070B14] dark:text-[#F1F5F9]">
            Lyric &amp; Groove Sketchpad
          </h1>
        </div>

        {/* Clean Primary Header Actions: 1-Click Song Idea + Export Dropdown + Theme */}
        <div ref={headerMenusRef} className="flex flex-wrap items-center gap-2 shrink-0">
          {/* 1-Click Songwriting Idea Menu */}
          <div className="relative">
            <button
              type="button"
              data-testid="idea-templates-btn"
              onClick={() => {
                setShowIdeaMenu((v) => !v);
                setShowExportMenu(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-[#0284C7]/45 bg-sky-50/75 dark:bg-sky-950/45 text-[#0369A1] dark:text-[#38BDF8] hover:border-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ý tưởng 1 chạm</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-75" aria-hidden="true" />
            </button>

            {showIdeaMenu && (
              <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] shadow-xl p-2 z-40 space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                  Chọn phong cách để nạp hợp âm + giai điệu mẫu
                </div>
                {SONG_IDEA_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    data-testid={`idea-template-${tpl.id}`}
                    onClick={() => handleApplySongIdeaTemplate(tpl)}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-sky-50 dark:hover:bg-[#132238] transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                      {tpl.label}
                    </div>
                    <div className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      {tpl.subtitle}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              data-testid="export-menu-btn"
              onClick={() => {
                setShowExportMenu((v) => !v);
                setShowIdeaMenu(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isExportingWav ? 'Đang xuất WAV...' : 'Xuất bản'}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] shadow-xl p-1.5 z-40 space-y-1">
                <button
                  type="button"
                  disabled={isExportingWav}
                  onClick={() => void handleExportWav()}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#EFF4FA] dark:hover:bg-[#132238] cursor-pointer"
                >
                  <FileAudio className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                  <span>Audio Demo (.WAV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportMidiFile(activeDraft);
                    setExportStatus('Đã xuất file MIDI (.mid)');
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#EFF4FA] dark:hover:bg-[#132238] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                  <span>Track MIDI (.MID)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLeadSheetPdf(activeDraft);
                    setExportStatus('Đã xuất bản nhạc PDF Lead Sheet');
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#EFF4FA] dark:hover:bg-[#132238] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                  <span>Lead Sheet (.PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLeadSheetPng(activeDraft);
                    setExportStatus('Đã xuất ảnh PNG Lead Sheet');
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#EFF4FA] dark:hover:bg-[#132238] cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                  <span>Ảnh bản nhạc (.PNG)</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
            className="px-2.5 py-2 rounded-lg text-xs font-medium border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {theme === 'dark' ? 'Nền Sáng' : 'Nền Tối'}
          </button>
        </div>
      </div>

      {exportStatus && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-lg border border-sky-200 dark:border-sky-900 bg-sky-50/80 dark:bg-sky-950/50 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between"
        >
          <span>{exportStatus}</span>
          <button
            type="button"
            onClick={() => setExportStatus(null)}
            className="text-[11px] underline underline-offset-2 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Unified DAW Transport & Sound Bar */}
      <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-3.5 space-y-2.5">
        {/* Row 1: Song + Primary Transport Playhead */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 min-w-0">
            <label htmlFor="draft-selector" className="sr-only">
              Chọn bản nháp
            </label>
            <select
              id="draft-selector"
              value={activeDraft.id}
              onChange={(e) => {
                const nextId = e.target.value;
                stopGrooveLoop();
                setIsPlaying(false);
                clearLivePlayState();
                setActiveDraftId(nextId);
                const nextDraft = drafts.find((d) => d.id === nextId);
                if (nextDraft?.sections[0]) {
                  setActiveSectionId(nextDraft.sections[0].id);
                }
              }}
              className="max-w-[215px] truncate rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2.5 py-1.5 text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0]"
            >
              {drafts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>

            <label htmlFor="song-title-input" className="sr-only">
              Tên bài hát
            </label>
            <input
              id="song-title-input"
              type="text"
              value={activeDraft.title}
              onChange={(e) =>
                updateActiveDraft((d) => ({ ...d, title: e.target.value }))
              }
              placeholder="Tên bài hát..."
              className="flex-1 min-w-[180px] rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-white dark:bg-[#08101E] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9]"
            />

            <button
              type="button"
              onClick={handleCreateNewDraft}
              title="Tạo bản nháp mới"
              aria-label="Tạo bản nháp mới"
              className="p-1.5 rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] hover:border-[#0284C7] text-[#0F172A] dark:text-[#E2E8F0] transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>

            {drafts.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteCurrentDraft}
                title="Xóa bản nháp này"
                aria-label="Xóa bản nháp này"
                className="p-1.5 rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] hover:border-rose-500 text-[#475569] hover:text-rose-600 dark:text-[#94A3B8] transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Transport Play + Beat Readout + Full-Song Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-md border border-[#DCE6F2] dark:border-[#1B2B46] bg-[#F8FAFC] dark:bg-[#08101E] font-mono text-xs font-semibold tabular-nums text-[#0369A1] dark:text-[#38BDF8] whitespace-nowrap">
              {liveBeatIndicator}
            </span>

            <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
              <button
                type="button"
                onClick={() => setLoopScope('section')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  loopScope === 'section'
                    ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Đoạn này
              </button>
              <button
                type="button"
                onClick={() => setLoopScope('song')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  loopScope === 'song'
                    ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Cả bài
              </button>
            </div>

            <button
              type="button"
              onClick={() => setRepeatLoop((v) => !v)}
              title={repeatLoop ? 'Đang lặp vô hạn — bấm để phát 1 lượt' : 'Đang phát 1 lượt — bấm để lặp lại'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                repeatLoop
                  ? 'border-[#0284C7]/60 bg-sky-50 dark:bg-sky-950/50 text-[#0369A1] dark:text-[#38BDF8]'
                  : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{repeatLoop ? 'Lặp' : '1 lượt'}</span>
            </button>

            <button
              type="button"
              data-testid="play-full-song-btn"
              onClick={() => void handlePlayFullSong()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isPlaying && loopScope === 'song'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlaying && loopScope === 'song' ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Dừng Bài</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Phát Cả Bài</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="play-loop-btn"
              onClick={() => void handleTogglePlayback()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#0284C7] hover:bg-[#0369A1]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>{loopScope === 'song' ? 'Tiếp tục' : 'Phát Đoạn'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Compact Key/BPM + Sound & Pattern Controls */}
        <div className="pt-2.5 border-t border-[#E9F0F8] dark:border-[#152339] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Key + Transpose */}
            <div className="flex items-center gap-1">
              <label htmlFor="key-root-select" className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                Tông
              </label>
              <select
                id="key-root-select"
                value={activeDraft.keyRoot}
                onChange={(e) =>
                  updateActiveDraft((d) => ({ ...d, keyRoot: e.target.value }))
                }
                className="rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-1.5 py-1 text-xs font-mono font-semibold text-[#0F172A] dark:text-[#F1F5F9]"
              >
                {KEY_ROOT_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              <select
                aria-label="Âm giai Trưởng hoặc Thứ"
                value={activeDraft.scaleMode}
                onChange={(e) =>
                  updateActiveDraft((d) => ({
                    ...d,
                    scaleMode: e.target.value === 'minor' ? 'minor' : 'major',
                  }))
                }
                className="rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-1.5 py-1 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
              >
                <option value="major">Trưởng</option>
                <option value="minor">Thứ</option>
              </select>

              <div className="flex items-center rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] overflow-hidden">
                <button
                  type="button"
                  data-testid="transpose-down-btn"
                  title="Dịch tông toàn bài xuống 1/2 cung"
                  onClick={() => handleTransposeSemitones(-1)}
                  className="px-1.5 py-1 text-[11px] font-mono font-semibold text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#E2E8F0] dark:hover:bg-[#162640] cursor-pointer"
                >
                  -½
                </button>
                <button
                  type="button"
                  data-testid="transpose-up-btn"
                  title="Dịch tông toàn bài lên 1/2 cung"
                  onClick={() => handleTransposeSemitones(1)}
                  className="px-1.5 py-1 text-[11px] font-mono font-semibold text-[#0F172A] dark:text-[#E2E8F0] border-l border-[#CBD8E6] dark:border-[#1F3557] hover:bg-[#E2E8F0] dark:hover:bg-[#162640] cursor-pointer"
                >
                  +½
                </button>
              </div>
            </div>

            {/* Mood */}
            <select
              id="mood-style-select"
              aria-label="Màu nhạc"
              value={activeDraft.mood}
              onChange={(e) => handleMoodChange(e.target.value as MoodStyleId)}
              className="rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
            >
              {MOOD_STYLE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            {/* Backing Sound Select + Pattern + Drums */}
            <select
              aria-label="Nhạc cụ đệm"
              value={activeDraft.backingInstrument}
              onChange={(e) =>
                updateActiveDraft((d) => ({
                  ...d,
                  backingInstrument: e.target.value as BackingInstrumentId,
                }))
              }
              className="rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
            >
              <option value="piano-ballad">Đệm: Grand Piano</option>
              <option value="rhodes">Đệm: Rhodes EP</option>
              <option value="guitar-strum">Đệm: Guitar Acoustic</option>
            </select>

            <select
              aria-label="Kiểu rải hợp âm"
              value={activeBackingSelectValue}
              onChange={(e) =>
                updateActiveDraft((d) => ({
                  ...d,
                  backingPattern: e.target.value as BackingPatternId,
                }))
              }
              className="rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
            >
              <option value="auto-song">Rải: Theo bài (Đa kiểu)</option>
              {ARPEGGIO_PATTERN_META.map((pat) => (
                <option key={pat.id} value={pat.id}>
                  Rải: {pat.label}
                </option>
              ))}
            </select>

            <select
              aria-label="Kiểu trống"
              value={activeDraft.drumPattern}
              onChange={(e) =>
                updateActiveDraft((d) => ({
                  ...d,
                  drumPattern: e.target.value as DrumPatternId,
                }))
              }
              className="rounded-md border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
            >
              <option value="none">Trống: Tắt</option>
              <option value="ballad">Trống: Ballad (+ Strings)</option>
              <option value="lofi">Trống: Lo-fi</option>
              <option value="boombap">Trống: Boom-bap</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              data-testid="melody-mode-select"
              aria-label="Chế độ phát nốt nhạc"
              value={activeMelodyMode}
              onChange={(e) => {
                const nextMode = e.target.value as MelodyPlaybackMode;
                updateActiveDraft((d) => ({
                  ...d,
                  melodyPlaybackMode: nextMode,
                  melodyMuted: nextMode !== 'all',
                  mutedMelodySectionIds:
                    nextMode === 'all' ? [] : d.mutedMelodySectionIds ?? [],
                }));
              }}
              title="Chọn chế độ phát nốt giai điệu hoặc tắt hết để chỉ nghe hợp âm"
              className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                activeMelodyMode === 'off'
                  ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : activeMelodyMode === 'intro-only'
                  ? 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0F172A] dark:text-[#F1F5F9]'
              }`}
            >
              <option value="all">Nốt nhạc: Bật tất cả</option>
              <option value="intro-only">Nốt nhạc: Chỉ Intro (Beat)</option>
              <option value="off">Tắt hết nốt (Chỉ hợp âm)</option>
            </select>

            <button
              type="button"
              data-testid="sustain-pedal-toggle"
              onClick={() =>
                updateActiveDraft((d) => ({
                  ...d,
                  sustainPedal: !(d.sustainPedal ?? true),
                }))
              }
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSustainPedal
                  ? 'border-[#0284C7] bg-sky-50 dark:bg-sky-950/55 text-[#0369A1] dark:text-[#38BDF8]'
                  : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              Pedal: {activeSustainPedal ? 'Ngân' : 'Khô'}
            </button>

            <button
              type="button"
              data-testid="metronome-toggle"
              onClick={() =>
                updateActiveDraft((d) => ({
                  ...d,
                  metronomeEnabled: !(d.metronomeEnabled ?? false),
                }))
              }
              className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeMetronome
                  ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/45 text-amber-800 dark:text-amber-300'
                  : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#475569] dark:text-[#94A3B8]'
              }`}
            >
              Nhịp đếm: {activeMetronome ? 'BẬT' : 'TẮT'}
            </button>

            <div className="flex items-center gap-1.5 pl-1 border-l border-[#E2E8F0] dark:border-[#1E314E]">
              <input
                id="bpm-slider"
                aria-label="Tốc độ BPM"
                type="range"
                min={55}
                max={155}
                value={activeDraft.bpm}
                onChange={(e) =>
                  updateActiveDraft((d) => ({ ...d, bpm: Number(e.target.value) }))
                }
                className="w-20 sm:w-24 accent-[#0284C7] cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold tabular-nums text-[#070B14] dark:text-[#F1F5F9] min-w-[54px] text-right">
                {activeDraft.bpm} BPM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Synchronized Song Stage: Timeline + Active Chord/Note + Karaoke Teleprompter */}
      <div
        data-testid="live-song-stage"
        className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-gradient-to-br from-white via-[#F8FBFF] to-[#EFF6FF] dark:from-[#0B1220] dark:via-[#0D172B] dark:to-[#0A1324] p-4 space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {isPlaying ? 'Đang phát trực tiếp' : 'Sân khấu trình diễn'}
              </div>
              <div className="font-sans text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                {activeSection.label}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg border border-[#DCE6F2] dark:border-[#1E314E] bg-white/80 dark:bg-[#08101E]">
                <div className="text-[10px] font-medium text-[#475569] dark:text-[#94A3B8]">
                  Hợp âm đang vang
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    data-testid="stage-active-chord"
                    className="font-mono text-lg font-bold text-[#0284C7] dark:text-[#38BDF8]"
                  >
                    {liveChordInfo?.symbol ?? barSlots[0]?.primaryChord ?? '—'}
                  </span>
                  {liveChordInfo?.nextSymbol && (
                    <span className="font-mono text-xs text-[#475569] dark:text-[#94A3B8]">
                      → {liveChordInfo.nextSymbol}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg border border-[#DCE6F2] dark:border-[#1E314E] bg-white/80 dark:bg-[#08101E] min-w-[96px]">
                <div className="text-[10px] font-medium text-[#475569] dark:text-[#94A3B8]">
                  Nốt giai điệu
                </div>
                <div
                  data-testid="stage-active-note"
                  className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400"
                >
                  {liveMelodyInfo?.noteName ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Live Frequency Spectrum + Time Readout */}
          <div className="flex items-center gap-3">
            <canvas
              ref={spectrumCanvasRef}
              aria-label="Phổ tần âm thanh trực tiếp"
              className="w-44 sm:w-56 h-10 rounded-lg border border-[#DCE6F2] dark:border-[#1B2B46] bg-white/85 dark:bg-[#070D19] px-1.5 py-1"
            />
            <div className="text-right font-mono text-xs tabular-nums text-[#0F172A] dark:text-[#E2E8F0] whitespace-nowrap">
              <div className="font-bold">{liveBeatIndicator}</div>
              <div className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                {Math.floor(((loopScope === 'song' ? songBeatPos : sectionBeatLocal) * (60 / activeDraft.bpm)) / 60)}:
                {String(
                  Math.floor(((loopScope === 'song' ? songBeatPos : sectionBeatLocal) * (60 / activeDraft.bpm)) % 60)
                ).padStart(2, '0')}
                {' / '}
                {Math.floor((songTimelineSpans.totalBeats * (60 / activeDraft.bpm)) / 60)}:
                {String(
                  Math.floor((songTimelineSpans.totalBeats * (60 / activeDraft.bpm)) % 60)
                ).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Clickable Full-Song Section Progress Timeline */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 w-full">
            {songTimelineSpans.spans.map((span, idx) => {
              const widthPct = (span.bars * 4 * 100) / songTimelineSpans.totalBeats;
              const isActiveSec =
                (isPlaying && playingSectionId === span.id) ||
                (!isPlaying && activeSection.id === span.id);
              const progressInSpan =
                isPlaying && loopScope === 'song'
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        ((songBeatPos - span.start) / Math.max(1, span.end - span.start)) * 100
                      )
                    )
                  : isActiveSec && isPlaying
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        (sectionBeatLocal / Math.max(1, span.end - span.start)) * 100
                      )
                    )
                  : 0;
              return (
                <button
                  key={span.id}
                  type="button"
                  onClick={() => handleSeekTimelineBeat(span.start, span.id)}
                  style={{ width: `${widthPct}%` }}
                  title={`Nhảy tới ${span.label} (${span.bars} ô)`}
                  className={`relative h-7 rounded-md border text-left px-2 overflow-hidden transition-colors cursor-pointer ${
                    isActiveSec
                      ? 'border-[#0284C7] bg-sky-100/80 dark:bg-sky-950/60 text-[#0369A1] dark:text-[#38BDF8]'
                      : 'border-[#DCE6F2] dark:border-[#1B2B46] bg-white/80 dark:bg-[#08101E] text-[#475569] dark:text-[#94A3B8] hover:border-[#0284C7]'
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-emerald-500/20 dark:bg-emerald-400/20 transition-all duration-75"
                    style={{ width: `${progressInSpan}%` }}
                  />
                  <span className="relative z-10 block truncate font-mono text-[10px] font-semibold">
                    {idx + 1}. {span.kind}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrolling Multi-Track DAW Timeline (Ô nhịp · Hợp âm · Nốt giai điệu · Ca từ & Sóng âm) */}
        <SongTimelinePlayer
          theme={theme}
          sections={activeDraft.sections}
          melodyNotes={activeDraft.melodyNotes}
          bpm={activeDraft.bpm}
          backingPattern={activeBackingPattern}
          chordArpStyles={activeDraft.chordArpStyles}
          songMood={activeDraft.mood}
          melodyPlaybackMode={activeMelodyMode}
          mutedMelodySectionIds={activeDraft.mutedMelodySectionIds}
          loopScope={loopScope}
          activeSectionId={activeSection.id}
          isPlaying={isPlaying}
          playheadBeatRef={playheadBeatRef}
          onSeekBeat={handleSeekTimelineBeat}
        />

        {/* Synchronized Karaoke Chord & Lyric Teleprompter */}
        <div
          data-testid="karaoke-teleprompter"
          className="rounded-lg border border-[#E2E8F0] dark:border-[#1B2B46] bg-white/85 dark:bg-[#070D19]/90 px-3.5 py-2 space-y-1 max-h-28 overflow-y-auto"
        >
          {activeKaraokeLines.length === 0 ? (
            <div className="text-xs italic text-[#94A3B8]">
              (Đoạn nhạc không lời — theo dõi hợp âm &amp; giai điệu trực tiếp trên Piano Roll bên phải)
            </div>
          ) : (
            activeKaraokeLines.map((line) => {
              const lineWords = sectionSyncWords.filter(
                (w) => w.lineIndex === line.lineIndex
              );
              const lineStart =
                lineWords.length > 0 ? lineWords[0].startBeat : line.startBeat;
              const lineEnd =
                lineWords.length > 0
                  ? Math.max(line.endBeat, lineWords[lineWords.length - 1].endBeat)
                  : line.endBeat;
              const isCurrentLine =
                isPlaying &&
                sectionBeatLocal >= lineStart - 0.04 &&
                sectionBeatLocal < lineEnd + 0.04;
              return (
                <div
                  key={line.lineIndex}
                  className={`rounded-md px-2.5 py-1.5 transition-colors flex flex-wrap items-baseline gap-x-2 gap-y-1 ${
                    isCurrentLine
                      ? 'bg-emerald-500/12 dark:bg-emerald-500/15 border border-emerald-500/35'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {line.segments.map((seg, sIdx) => {
                    const segWords = lineWords.filter((w) => w.segIndex === sIdx);
                    const segStart =
                      segWords.length > 0 ? segWords[0].startBeat : seg.startBeat;
                    const segEnd =
                      segWords.length > 0
                        ? segWords[segWords.length - 1].endBeat
                        : seg.endBeat;
                    const isCurrentSeg =
                      isPlaying &&
                      sectionBeatLocal >= segStart - 0.04 &&
                      sectionBeatLocal < segEnd + 0.04;
                    return (
                      <span
                        key={`${line.lineIndex}-${sIdx}`}
                        className="inline-flex flex-col items-start leading-tight"
                      >
                        {seg.chordSymbol && (
                          <button
                            type="button"
                            onClick={() => auditionAndHighlightChord(seg.chordSymbol!, 0)}
                            className={`font-mono text-[11px] font-bold px-1 rounded transition-colors cursor-pointer ${
                              isCurrentSeg
                                ? 'bg-emerald-600 text-white'
                                : 'text-[#0284C7] dark:text-[#38BDF8] hover:bg-sky-100 dark:hover:bg-sky-900/50'
                            }`}
                          >
                            [{seg.chordSymbol}]
                          </button>
                        )}
                        {segWords.length > 0 ? (
                          <span className="inline-flex flex-wrap items-baseline gap-x-1 text-sm">
                            {segWords.map((w) => {
                              const isCurrentWord =
                                isPlaying &&
                                sectionBeatLocal >= w.startBeat - 0.04 &&
                                sectionBeatLocal < w.endBeat + 0.04;
                              return (
                                <span
                                  key={`${w.lineIndex}-${w.segIndex}-${w.wordIndex}`}
                                  className={`transition-colors ${
                                    isCurrentWord
                                      ? 'font-bold text-emerald-700 dark:text-emerald-300 underline decoration-emerald-500/70 underline-offset-4'
                                      : isCurrentLine
                                      ? 'font-semibold text-[#070B14] dark:text-[#F1F5F9]'
                                      : 'text-[#334155] dark:text-[#CBD5E1]'
                                  }`}
                                >
                                  {w.text}
                                </span>
                              );
                            })}
                          </span>
                        ) : (
                          seg.lyricText && (
                            <span
                              className={`text-sm ${
                                isCurrentSeg
                                  ? 'font-bold text-emerald-700 dark:text-emerald-300'
                                  : isCurrentLine
                                  ? 'font-semibold text-[#070B14] dark:text-[#F1F5F9]'
                                  : 'text-[#334155] dark:text-[#CBD5E1]'
                              }`}
                            >
                              {seg.lyricText}
                            </span>
                          )
                        )}
                      </span>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clean Song Structure Bar + Interactive 4-Bar Visual Chord Track */}
      <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-3.5 space-y-3">
        {/* Clean Section Tabs + Active Section Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8] mr-1" aria-hidden="true" />
            {activeDraft.sections.map((sec, idx) => {
              const isSelected = sec.id === activeSection.id;
              const isCurrentlyPlaying = isPlaying && playingSectionId === sec.id;
              const isSecMuted = isSectionMelodyMuted(
                sec,
                activeMelodyMode,
                activeDraft.mutedMelodySectionIds
              );
              return (
                <button
                  key={sec.id}
                  type="button"
                  draggable
                  onDragStart={() => setDraggedSectionIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedSectionIdx !== null && draggedSectionIdx !== idx) {
                      updateActiveDraft((d) => ({
                        ...d,
                        sections: reorderSongSections(d.sections, draggedSectionIdx, idx),
                      }));
                    }
                    setDraggedSectionIdx(null);
                  }}
                  onClick={() => {
                    setActiveSectionId(sec.id);
                    const span = songTimelineSpans.spans.find((s) => s.id === sec.id);
                    if (loopScope === 'song' && span) {
                      if (isPlaying) {
                        handleSeekTimelineBeat(span.start, sec.id);
                      } else {
                        playheadBeatRef.current = span.start;
                        setSongBeatPos(span.start);
                        setSectionBeatLocal(0);
                        setLiveBeatIndicator('Ô 1 · 1');
                      }
                    } else if (!isPlaying) {
                      playheadBeatRef.current = 0;
                      setSectionBeatLocal(0);
                      setLiveBeatIndicator('Ô 1 · 1');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'border-[#0284C7] bg-[#0284C7] text-white'
                      : 'border-[#DCE6F2] dark:border-[#1B2B46] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
                  }`}
                >
                  {idx + 1}. {sec.kind} · {sec.bars} ô
                  {isCurrentlyPlaying ? ' ♪' : ''}
                  {isSecMuted ? ' · Chỉ HÂ' : ''}
                </button>
              );
            })}

            <div className="flex items-center gap-1 ml-1">
              <select
                aria-label="Chọn loại đoạn mới"
                value={newSectionKind}
                onChange={(e) => setNewSectionKind(e.target.value as SectionKind)}
                className="rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1 text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0]"
              >
                {SECTION_KIND_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EFF4FA] dark:bg-[#132238] text-[#0369A1] dark:text-[#38BDF8] hover:bg-[#DCE6F2] dark:hover:bg-[#1C3152] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Focused Controls ONLY for Selected Section */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              disabled={activeSectionIndex <= 0}
              aria-label={`Đẩy ${activeSection.label} sang trái`}
              onClick={() => handleMoveSection(activeSectionIndex, -1)}
              className="p-1.5 rounded-md border border-[#DCE6F2] dark:border-[#1B2B46] text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={activeSectionIndex >= activeDraft.sections.length - 1}
              aria-label={`Đẩy ${activeSection.label} sang phải`}
              onClick={() => handleMoveSection(activeSectionIndex, 1)}
              className="p-1.5 rounded-md border border-[#DCE6F2] dark:border-[#1B2B46] text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Nhân đôi ${activeSection.label}`}
              onClick={() => handleDuplicateSection(activeSection)}
              className="p-1.5 rounded-md border border-[#DCE6F2] dark:border-[#1B2B46] text-[#475569] dark:text-[#94A3B8] hover:text-[#0284C7] cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            {activeDraft.sections.length > 1 && (
              <button
                type="button"
                aria-label={`Xóa ${activeSection.label}`}
                onClick={() => handleDeleteSection(activeSection.id)}
                className="p-1.5 rounded-md border border-[#DCE6F2] dark:border-[#1B2B46] text-[#475569] dark:text-[#94A3B8] hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Visual Bar-by-Bar Chord Track (Swap Any Bar's Chord in 1 Click!) */}
        <div
          data-testid="bar-chord-track"
          className="pt-2.5 border-t border-[#E9F0F8] dark:border-[#152339] space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#070B14] dark:text-[#F1F5F9]">
              Lưới Hợp Âm {activeSection.bars} Ô Nhịp (Bấm vào ô để nghe hoặc đổi hợp âm ngay)
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                Đổi nhanh cho Ô {selectedBarIndex + 1}:
              </span>
              {diatonicPalette.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleSetBarChord(selectedBarIndex, sym)}
                  className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    barSlots[selectedBarIndex]?.primaryChord === sym
                      ? 'border-[#0284C7] bg-[#0284C7] text-white'
                      : 'border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`grid gap-2 ${
              activeSection.bars === 2
                ? 'grid-cols-2'
                : activeSection.bars === 8
                ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
                : 'grid-cols-2 sm:grid-cols-4'
            }`}
          >
            {barSlots.map((slot) => {
              const isSelectedBar = selectedBarIndex === slot.barIndex;
              const arpMeta = ARPEGGIO_PATTERN_META.find(
                (m) => m.id === slot.arpPattern
              );
              return (
                <div
                  key={slot.barIndex}
                  role="button"
                  tabIndex={0}
                  data-testid={`bar-slot-${slot.barIndex}`}
                  onClick={() => {
                    setSelectedBarIndex(slot.barIndex);
                    auditionAndHighlightChord(slot.primaryChord, 0, slot.arpPattern);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedBarIndex(slot.barIndex);
                      auditionAndHighlightChord(slot.primaryChord, 0, slot.arpPattern);
                    }
                  }}
                  className={`rounded-lg border px-2.5 py-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelectedBar
                      ? 'border-[#0284C7] bg-sky-50/80 dark:bg-sky-950/45 shadow-xs'
                      : 'border-[#DCE6F2] dark:border-[#1B2B46] bg-[#FAFBFD] dark:bg-[#070D19] hover:border-[#0284C7]/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#475569] dark:text-[#94A3B8]">
                    <span>Ô {slot.barIndex + 1}</span>
                    {slot.secondaryChord && (
                      <span className="text-[#0369A1] dark:text-[#38BDF8]">
                        → {slot.secondaryChord}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-base font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    {slot.primaryChord}
                  </div>
                  <button
                    type="button"
                    data-testid={`bar-arp-cycle-${slot.barIndex}`}
                    title={arpMeta?.desc ?? 'Đổi kiểu rải riêng cho hợp âm này'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBarIndex(slot.barIndex);
                      handleCycleBarArpPattern(
                        slot.eventIndex,
                        slot.primaryChord,
                        slot.arpPattern
                      );
                    }}
                    className="w-full text-left px-1.5 py-0.5 rounded bg-[#EFF4FA] dark:bg-[#0D182D] hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[10px] font-medium text-[#0369A1] dark:text-[#7DD3FC] border border-[#DCE6F2] dark:border-[#1F3557] transition-colors truncate cursor-pointer"
                  >
                    Rải: {arpMeta?.shortLabel ?? slot.arpPattern}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Workbench: Left Focused Lyric + Harmony, Right Melody & Grand Piano */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Distraction-Free Lyric Writer + Tabbed Rhyme/Harmony Studio */}
        <div className="lg:col-span-7 space-y-4">
          {/* Clean Editorial Lyric Pad */}
          <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9F0F8] dark:border-[#152339] pb-2.5">
              <input
                type="text"
                aria-label="Tên đoạn nhạc đang soạn"
                value={activeSection.label}
                onChange={(e) =>
                  updateActiveDraft((d) => ({
                    ...d,
                    sections: d.sections.map((s) =>
                      s.id === activeSection.id
                        ? { ...s, label: e.target.value }
                        : s
                    ),
                  }))
                }
                className="font-sans text-base font-semibold bg-transparent text-[#070B14] dark:text-[#F1F5F9] border-b border-transparent focus:border-[#0284C7] outline-none flex-1 min-w-[180px]"
              />

              <div className="flex items-center gap-2.5">
                <span className="text-xs text-[#475569] dark:text-[#94A3B8] tabular-nums whitespace-nowrap">
                  {sectionAnalysis.totalSyllables} tiếng · {sectionAnalysis.totalChords} hợp âm
                </span>
                <div className="flex items-center p-0.5 rounded-md bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
                  {([2, 4, 8] as const).map((barOpt) => (
                    <button
                      key={barOpt}
                      type="button"
                      onClick={() =>
                        updateActiveDraft((d) => ({
                          ...d,
                          sections: d.sections.map((s) =>
                            s.id === activeSection.id
                              ? { ...s, bars: barOpt }
                              : s
                          ),
                        }))
                      }
                      className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                        activeSection.bars === barOpt
                          ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white font-semibold'
                          : 'text-[#475569] dark:text-[#94A3B8]'
                      }`}
                    >
                      {barOpt} ô
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 1-Click Chord Insert Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] mr-1">
                Chèn vào con trỏ:
              </span>
              {diatonicPalette.map((chordName) => (
                <button
                  key={chordName}
                  type="button"
                  onClick={() => handleInsertChordAtCursor(chordName)}
                  className="px-2 py-1 rounded-md font-mono text-[11px] font-semibold border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0369A1] dark:text-[#38BDF8] hover:border-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  +{chordName}
                </button>
              ))}
            </div>

            <textarea
              id="smart-lyric-textarea"
              ref={textareaRef}
              rows={5}
              value={activeSection.text}
              onSelect={(e) => {
                cursorPosRef.current = e.currentTarget.selectionStart ?? 0;
              }}
              onChange={(e) => {
                cursorPosRef.current = e.target.selectionStart ?? 0;
                const val = e.target.value;
                updateActiveDraft((d) => ({
                  ...d,
                  sections: d.sections.map((s) =>
                    s.id === activeSection.id
                      ? { ...s, text: val, chordSchedule: undefined }
                      : s
                  ),
                }));
              }}
              placeholder="Gõ lời tự do hoặc bấm +HợpÂm phía trên để chèn..."
              className="w-full rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#070D19] px-3.5 py-3 font-mono text-sm leading-relaxed text-[#070B14] dark:text-[#F1F5F9] focus:border-[#0284C7] dark:focus:border-[#38BDF8] outline-none resize-y"
            />
          </div>

          {/* Focused Lower Card: Switch Cleanly Between Harmony Explorer & Lyric Rhyme Sheet */}
          <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9F0F8] dark:border-[#152339] pb-3">
              <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
                <button
                  type="button"
                  data-testid="tab-harmony-btn"
                  onClick={() => setLeftSubTab('harmony')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    leftSubTab === 'harmony'
                      ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                      : 'text-[#475569] dark:text-[#94A3B8]'
                  }`}
                >
                  Hợp Âm &amp; Vòng Mẫu
                </button>
                <button
                  type="button"
                  data-testid="tab-rhyme-btn"
                  onClick={() => setLeftSubTab('rhyme')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    leftSubTab === 'rhyme'
                      ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                      : 'text-[#475569] dark:text-[#94A3B8]'
                  }`}
                >
                  Soi Vần &amp; Âm Tiết ({sectionAnalysis.lines.length} dòng)
                </button>
              </div>

              {leftSubTab === 'harmony' ? (
                <span className="font-mono text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                  Đang nối từ: {selectedAnchorChord}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowToneMarkers((v) => !v)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showToneMarkers
                      ? 'border-[#0284C7] bg-sky-50 dark:bg-sky-950/60 text-[#0369A1] dark:text-[#38BDF8]'
                      : 'border-[#DCE6F2] dark:border-[#1B2B46] text-[#475569] dark:text-[#94A3B8]'
                  }`}
                >
                  {showToneMarkers ? 'Ẩn ký hiệu Bằng/Trắc' : 'Hiện ký hiệu Bằng/Trắc'}
                </button>
              )}
            </div>

            {leftSubTab === 'harmony' ? (
              <div className="space-y-4">
                {/* 5 Recommended Next Chords */}
                <div
                  data-testid="chord-suggestions-grid"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
                >
                  {chordSuggestions.map((s) => (
                    <div
                      key={s.symbol}
                      className="rounded-lg border border-[#DCE6F2] dark:border-[#1B2B46] bg-[#FAFBFD] dark:bg-[#070D19] p-3 flex flex-col justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-1.5">
                          <span className="font-mono text-base font-bold text-[#070B14] dark:text-[#F1F5F9]">
                            {s.symbol}
                          </span>
                          <span className="text-[11px] font-medium text-[#0369A1] dark:text-[#38BDF8]">
                            {s.roleLabel}
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-snug">
                          {s.reason}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          aria-label={`Nghe thử ${s.symbol}`}
                          onClick={() => auditionAndHighlightChord(s.symbol, 0)}
                          className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded border border-[#CBD8E6] dark:border-[#1F3557] text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Nghe</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Đổi vào Ô ${selectedBarIndex + 1}: ${s.symbol}`}
                          onClick={() => handleSetBarChord(selectedBarIndex, s.symbol)}
                          className="flex-1 inline-flex items-center justify-center gap-0.5 py-1.5 rounded bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs font-semibold cursor-pointer"
                        >
                          <span>Đặt Ô {selectedBarIndex + 1}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 1-Click Grand Piano Chord Progression Presets */}
                <div
                  data-testid="progression-presets-dock"
                  className="pt-3 border-t border-[#E9F0F8] dark:border-[#152339] space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-sans text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                      Vòng Hòa Âm Mẫu ({activeDraft.keyRoot}{' '}
                      {activeDraft.scaleMode === 'major' ? 'Trưởng' : 'Thứ'})
                    </h3>
                    <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      Dẫn tiếng tay phải mượt tự động (Voice Leading)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROGRESSION_PRESETS.map((preset) => {
                      const chords = preset.buildChords(
                        activeDraft.keyRoot,
                        activeDraft.scaleMode
                      );
                      const isPreviewing = auditioningPresetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          className={`rounded-lg border p-2.5 flex flex-col justify-between gap-2 transition-colors ${
                            isPreviewing
                              ? 'border-[#0284C7] bg-sky-50/70 dark:bg-sky-950/35'
                              : 'border-[#DCE6F2] dark:border-[#1B2B46] bg-[#FAFBFD] dark:bg-[#070D19]'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                              {preset.label}
                            </div>
                            <div className="font-mono text-[11px] text-[#0369A1] dark:text-[#38BDF8] leading-snug break-words">
                              {chords.join(' → ')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAuditionPreset(preset.id, chords)}
                              className={`flex-1 inline-flex items-center justify-center gap-1 py-1 rounded border text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                isPreviewing
                                  ? 'border-rose-500 bg-rose-600 text-white'
                                  : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
                              }`}
                            >
                              <Volume2 className="w-3 h-3" aria-hidden="true" />
                              <span>{isPreviewing ? 'Dừng nghe' : 'Nghe vòng'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInsertProgressionPreset(chords)}
                              className="flex-1 inline-flex items-center justify-center gap-0.5 py-1 rounded bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span>+ Chèn vòng</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  data-testid="rhyme-analysis-view"
                  className="rounded-lg border border-[#E9F0F8] dark:border-[#152339] bg-[#FAFBFD] dark:bg-[#070D19]/80 divide-y divide-[#E9F0F8] dark:divide-[#152339]"
                >
                  {sectionAnalysis.lines.map((line) => (
                    <div
                      key={line.lineIndex}
                      className="px-3.5 py-2.5 flex items-end justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        {line.chords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {line.chords.map((ch, cIdx) => {
                              const keyId = `${activeSection.id}-${line.lineIndex}-${cIdx}`;
                              const shift = chordVoicings[keyId] ?? 0;
                              return (
                                <button
                                  key={keyId}
                                  type="button"
                                  onClick={() => handleCycleChordVoicing(ch.symbol, keyId)}
                                  title="Bấm để nghe thử và đổi thế bấm (Voicing)"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100/80 dark:bg-sky-900/50 text-[#0369A1] dark:text-[#38BDF8] font-mono text-xs font-bold hover:bg-sky-200 dark:hover:bg-sky-800/70 transition-colors cursor-pointer"
                                >
                                  <span>{ch.symbol}</span>
                                  {shift > 0 && (
                                    <span className="text-[10px] font-sans font-normal opacity-80">
                                      ({VOICING_LABELS[shift]})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm leading-relaxed">
                          {line.words.length === 0 ? (
                            <span className="text-xs italic text-[#94A3B8]">
                              (Dòng trống)
                            </span>
                          ) : (
                            line.words.map((w, wIdx) => {
                              const rStyle =
                                w.rhymeGroupId && RHYME_STYLES[w.rhymeGroupId];
                              return (
                                <span
                                  key={`${line.lineIndex}-${wIdx}`}
                                  title={`Thanh ${
                                    w.toneClass === 'bang' ? 'Bằng' : 'Trắc'
                                  } · Vần -${w.rhymeKey}`}
                                  className={`inline-flex items-baseline gap-0.5 rounded px-0.5 ${
                                    rStyle
                                      ? `${rStyle.bg} underline underline-offset-4 decoration-2 ${rStyle.underline} font-medium`
                                      : 'text-[#0F172A] dark:text-[#E2E8F0]'
                                  } ${w.isDoubleRhyme ? 'italic' : ''}`}
                                >
                                  <span>{w.raw}</span>
                                  {showToneMarkers && (
                                    <sup
                                      className={`text-[9px] font-mono leading-none ${
                                        w.toneClass === 'bang'
                                          ? 'text-sky-600 dark:text-sky-400'
                                          : 'text-amber-600 dark:text-amber-400'
                                      }`}
                                    >
                                      {w.toneClass === 'bang' ? 'B' : 'T'}
                                    </sup>
                                  )}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div
                        data-testid={`line-syllables-${line.lineIndex}`}
                        className="shrink-0 font-mono text-xs tabular-nums text-[#475569] dark:text-[#94A3B8] whitespace-nowrap"
                      >
                        {line.syllableCount} tiếng
                      </div>
                    </div>
                  ))}
                </div>

                {sectionAnalysis.rhymeFamilies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                    <span className="font-medium text-[#070B14] dark:text-[#E2E8F0]">
                      Nhóm vần bắt được:
                    </span>
                    {sectionAnalysis.rhymeFamilies.map((rf) => {
                      const style = RHYME_STYLES[rf.groupId];
                      return (
                        <span
                          key={rf.groupId}
                          className={`font-mono text-[11px] font-semibold ${
                            style?.tag ?? ''
                          }`}
                        >
                          -{rf.rhymeKey} ({rf.count} từ ·{' '}
                          {rf.toneClass === 'bang' ? 'Bằng' : 'Trắc'})
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Melody Studio + Piano Roll + Interactive Concert Grand Piano */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9F0F8] dark:border-[#152339] pb-2.5">
            <h2 className="font-sans text-base font-semibold text-[#070B14] dark:text-[#F1F5F9] flex items-center gap-1.5">
              <Music2 className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
              <span>Giai Điệu &amp; Đàn Grand Piano</span>
            </h2>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="section-melody-mute-btn"
                onClick={() =>
                  updateActiveDraft((d) => {
                    const mode = resolveMelodyPlaybackMode(d);
                    const currentMuted = d.mutedMelodySectionIds ?? [];
                    const secIsMuted = isSectionMelodyMuted(
                      activeSection,
                      mode,
                      currentMuted
                    );
                    if (secIsMuted) {
                      if (mode === 'off') {
                        const otherIds = d.sections
                          .filter((s) => s.id !== activeSection.id)
                          .map((s) => s.id);
                        return {
                          ...d,
                          melodyPlaybackMode: 'all',
                          melodyMuted: false,
                          mutedMelodySectionIds: otherIds,
                        };
                      }
                      if (
                        mode === 'intro-only' &&
                        activeSection.kind !== 'Intro' &&
                        activeSection.kind !== 'Interlude'
                      ) {
                        const otherNonHookIds = d.sections
                          .filter(
                            (s) =>
                              s.id !== activeSection.id &&
                              s.kind !== 'Intro' &&
                              s.kind !== 'Interlude'
                          )
                          .map((s) => s.id);
                        return {
                          ...d,
                          melodyPlaybackMode: 'all',
                          melodyMuted: false,
                          mutedMelodySectionIds: Array.from(
                            new Set([...currentMuted, ...otherNonHookIds])
                          ),
                        };
                      }
                      return {
                        ...d,
                        mutedMelodySectionIds: currentMuted.filter(
                          (id) => id !== activeSection.id
                        ),
                      };
                    }
                    return {
                      ...d,
                      mutedMelodySectionIds: currentMuted.includes(activeSection.id)
                        ? currentMuted
                        : [...currentMuted, activeSection.id],
                    };
                  })
                }
                title="Bật hoặc tắt riêng nốt nhạc ở đoạn đang chọn (chỉ giữ lại hợp âm)"
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActiveSectionMuted
                    ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                    : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#475569] dark:text-[#94A3B8] hover:border-[#0284C7]'
                }`}
              >
                {isActiveSectionMuted ? 'Đoạn này: Chỉ hợp âm' : 'Đoạn này: Bật nốt'}
              </button>

              <button
                type="button"
                onClick={() =>
                  updateActiveDraft((d) => ({ ...d, scaleSnap: !d.scaleSnap }))
                }
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDraft.scaleSnap
                    ? 'border-emerald-500/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Khóa tông: {activeDraft.scaleSnap ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          </div>

          {/* Primary Creative Melody Controls: Auto-Compose + Mic Hum */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="auto-melody-btn"
              onClick={handleGenerateHarmonicMelody}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gợi ý giai điệu</span>
            </button>

            <button
              type="button"
              data-testid="mic-record-btn"
              onClick={() => void handleToggleMicRecord()}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Dừng thu</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Thu ngân nga</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulateHumPhrase}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] text-[#475569] dark:text-[#94A3B8] hover:border-[#0284C7] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Câu mẫu
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#070D19] border border-[#E9F0F8] dark:border-[#152339] text-[11px]">
            <span className="font-mono text-[#0F172A] dark:text-[#E2E8F0] tabular-nums truncate">
              {livePitchLabel}
            </span>
            <div className="w-20 h-1.5 rounded-full bg-[#DCE6F2] dark:bg-[#16243B] overflow-hidden shrink-0">
              <div
                className="h-full bg-[#0284C7] dark:bg-[#38BDF8] transition-all duration-75"
                style={{ width: `${liveRmsPercent}%` }}
              />
            </div>
          </div>

          {micError && (
            <div
              role="alert"
              className="px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200"
            >
              {micError}
            </div>
          )}

          {/* Melody Sound & Clear */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
              {(
                [
                  { id: 'piano', label: 'Grand Piano' },
                  { id: 'synth', label: 'Synth Lead' },
                  { id: 'guitar', label: 'Guitar Mộc' },
                ] as const
              ).map((timbre) => (
                <button
                  key={timbre.id}
                  type="button"
                  onClick={() =>
                    updateActiveDraft((d) => ({
                      ...d,
                      melodyInstrument: timbre.id as MelodyInstrumentId,
                    }))
                  }
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeDraft.melodyInstrument === timbre.id
                      ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                      : 'text-[#475569] dark:text-[#94A3B8]'
                  }`}
                >
                  {timbre.label}
                </button>
              ))}
            </div>

            {sectionMelodyNotes.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  updateActiveDraft((d) => ({
                    ...d,
                    melodyNotes: d.melodyNotes.filter(
                      (n) => n.sectionId !== activeSection.id
                    ),
                  }))
                }
                className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Xóa {sectionMelodyNotes.length} nốt
              </button>
            )}
          </div>

          <PianoRollCanvas
            theme={theme}
            sectionId={activeSection.id}
            bars={activeSection.bars}
            keyRoot={activeDraft.keyRoot}
            scaleMode={activeDraft.scaleMode}
            scaleSnap={activeDraft.scaleSnap}
            sustainPedal={activeSustainPedal}
            melodyInstrument={activeDraft.melodyInstrument}
            notes={sectionMelodyNotes}
            chordMarkers={sectionChordMarkers}
            lyricWords={sectionSyncWords}
            playheadBeatRef={playheadBeatRef}
            sectionStartBeat={activeSectionStartBeat}
            activeChordSymbol={liveChordInfo?.symbol ?? null}
            isPlaying={isPlaying}
            isRecording={isRecording}
            isMelodyMuted={isActiveSectionMuted}
            liveWaveformRef={liveWaveformRef}
            liveDetectedMidiRef={liveDetectedMidiRef}
            onAddNote={addMelodyNote}
            onRemoveNote={removeMelodyNote}
            onResizeNoteDuration={resizeMelodyNoteDuration}
          />
        </div>
      </div>

      {/* Full-Width 4-Octave Grand Piano Console (C2–C6) */}
      <GrandPianoKeyboard
        keyRoot={activeDraft.keyRoot}
        scaleMode={activeDraft.scaleMode}
        highlightedChordSymbol={liveHighlightChord?.symbol ?? selectedAnchorChord}
        voicingShift={liveHighlightChord?.shift ?? 0}
        sustainPedal={activeSustainPedal}
        playMode={pianoPlayMode}
        onTogglePlayMode={setPianoPlayMode}
        recordToRoll={recordKeysToRoll}
        onToggleRecordToRoll={() => setRecordKeysToRoll((v) => !v)}
        onNoteTrigger={handlePianoKeyTrigger}
        liveChordMidis={liveChordInfo?.midis ?? []}
        liveMelodyMidis={liveMelodyInfo ? [liveMelodyInfo.midi] : []}
        liveChordSymbol={liveChordInfo?.symbol ?? null}
        onAuditionActiveChord={() =>
          auditionAndHighlightChord(
            liveHighlightChord?.symbol ?? selectedAnchorChord,
            liveHighlightChord?.shift ?? 0
          )
        }
      />
    </section>
  );
}
