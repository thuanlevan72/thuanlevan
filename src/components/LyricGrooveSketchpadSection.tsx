import {
  ArrowLeft,
  ArrowRight,
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
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  auditionChord,
  type MicPitchSession,
  startGrooveLoop,
  startMicPitchCapture,
  stopGrooveLoop,
} from '../utils/lyricGrooveAudio.ts';
import {
  deleteSketchpadDraft,
  loadAllSketchpadDrafts,
  saveSketchpadDraft,
} from '../utils/lyricGrooveDb.ts';
import {
  analyzeSectionLyrics,
  type BackingInstrumentId,
  createBlankDraft,
  createStarterDrafts,
  type DrumPatternId,
  getDiatonicChordsForKey,
  KEY_ROOT_OPTIONS,
  type MelodyInstrumentId,
  type MelodyNote,
  midiToNoteName,
  MOOD_STYLE_OPTIONS,
  type MoodStyleId,
  type PitchFrame,
  quantizePitchFramesToNotes,
  reorderSongSections,
  SECTION_KIND_OPTIONS,
  type SectionKind,
  type SketchpadDraft,
  snapFrequencyToScaleMidi,
  type SongSection,
  suggestNextChords,
} from '../utils/lyricGrooveEngine.ts';
import {
  exportLeadSheetPdf,
  exportLeadSheetPng,
  exportMidiFile,
  exportWavAudioDemo,
} from '../utils/lyricGrooveExport.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';
import { PianoRollCanvas } from './PianoRollCanvas.tsx';

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
    bg: 'bg-sky-500/12 dark:bg-sky-400/16 text-sky-900 dark:text-sky-100',
    tag: 'text-sky-700 dark:text-sky-300',
  },
  2: {
    underline: 'decoration-emerald-500 dark:decoration-emerald-400',
    bg: 'bg-emerald-500/12 dark:bg-emerald-400/16 text-emerald-900 dark:text-emerald-100',
    tag: 'text-emerald-700 dark:text-emerald-300',
  },
  3: {
    underline: 'decoration-amber-500 dark:decoration-amber-400',
    bg: 'bg-amber-500/14 dark:bg-amber-400/18 text-amber-950 dark:text-amber-100',
    tag: 'text-amber-700 dark:text-amber-300',
  },
  4: {
    underline: 'decoration-rose-500 dark:decoration-rose-400',
    bg: 'bg-rose-500/12 dark:bg-rose-400/16 text-rose-950 dark:text-rose-100',
    tag: 'text-rose-700 dark:text-rose-300',
  },
  5: {
    underline: 'decoration-indigo-500 dark:decoration-indigo-400',
    bg: 'bg-indigo-500/12 dark:bg-indigo-400/16 text-indigo-950 dark:text-indigo-100',
    tag: 'text-indigo-700 dark:text-indigo-300',
  },
  6: {
    underline: 'decoration-teal-500 dark:decoration-teal-400',
    bg: 'bg-teal-500/12 dark:bg-teal-400/16 text-teal-950 dark:text-teal-100',
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
    () => createStarterDrafts()[0].sections[2]?.id ?? createStarterDrafts()[0].sections[0].id
  );
  const [loopScope, setLoopScope] = useState<'section' | 'song'>('section');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSectionId, setPlayingSectionId] = useState<string | null>(null);

  const [selectedAnchorChord, setSelectedAnchorChord] = useState<string>('Am7');
  const [chordVoicings, setChordVoicings] = useState<Record<string, number>>({});
  const [showToneMarkers, setShowToneMarkers] = useState(true);
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [newSectionKind, setNewSectionKind] = useState<SectionKind>('Bridge');

  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [livePitchLabel, setLivePitchLabel] = useState<string>('Sẵn sàng thu giọng');
  const [liveRmsPercent, setLiveRmsPercent] = useState<number>(0);

  const [saveNotice, setSaveNotice] = useState<string>('Tự động lưu IndexedDB');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [isExportingWav, setIsExportingWav] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cursorPosRef = useRef<number>(0);
  const playheadBeatRef = useRef<number>(0);
  const liveWaveformRef = useRef<Float32Array | null>(null);
  const liveDetectedMidiRef = useRef<number | null>(null);
  const micSessionRef = useRef<MicPitchSession | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // Load persisted drafts from Dexie IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    loadAllSketchpadDrafts().then((loaded) => {
      if (!mounted || loaded.length === 0) return;
      setDrafts(loaded);
      const first = loaded[0];
      setActiveDraftId(first.id);
      const defaultSec =
        first.sections.find((s) => s.kind === 'Chorus') ?? first.sections[0];
      if (defaultSec) {
        setActiveSectionId(defaultSec.id);
      }
    });
    return () => {
      mounted = false;
      stopGrooveLoop();
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

  // Sync activeSectionId whenever switching drafts
  useEffect(() => {
    if (!activeDraft.sections.some((s) => s.id === activeSectionId)) {
      const preferred =
        activeDraft.sections.find((s) => s.kind === 'Chorus') ??
        activeDraft.sections[0];
      if (preferred) setActiveSectionId(preferred.id);
    }
  }, [activeDraft, activeSectionId]);

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
              setSaveNotice('Đã lưu tự động · IndexedDB');
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
    const rawLines = activeSection.text
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0);
    const totalBeats = activeSection.bars * 4;
    const beatsPerLine = totalBeats / Math.max(1, rawLines.length);
    const markers: Array<{ symbol: string; beatOffset: number }> = [];
    sectionAnalysis.lines.forEach((line, idx) => {
      if (!line.rawLine.trim()) return;
      line.chords.forEach((ch) => {
        markers.push({
          symbol: ch.symbol,
          beatOffset: idx * beatsPerLine + ch.beatOffset,
        });
      });
    });
    return markers;
  }, [activeSection.bars, activeSection.text, sectionAnalysis.lines]);

  // Playback control
  const handleTogglePlayback = useCallback(async () => {
    if (isPlaying) {
      stopGrooveLoop();
      setIsPlaying(false);
      setPlayingSectionId(null);
      playheadBeatRef.current = 0;
      return;
    }

    const scopeSections =
      loopScope === 'section' ? [activeSection] : activeDraft.sections;

    setIsPlaying(true);
    playheadBeatRef.current = 0;

    await startGrooveLoop({
      sections: scopeSections,
      melodyNotes: activeDraft.melodyNotes,
      bpm: activeDraft.bpm,
      backingInstrument: activeDraft.backingInstrument,
      drumPattern: activeDraft.drumPattern,
      melodyInstrument: activeDraft.melodyInstrument,
      onProgressBeat: (beatInLoop, _totalBeats, curSecId) => {
        playheadBeatRef.current = beatInLoop;
        setPlayingSectionId((prev) => (prev === curSecId ? prev : curSecId));
      },
    });
  }, [
    isPlaying,
    loopScope,
    activeSection,
    activeDraft.sections,
    activeDraft.melodyNotes,
    activeDraft.bpm,
    activeDraft.backingInstrument,
    activeDraft.drumPattern,
    activeDraft.melodyInstrument,
  ]);

  // Restart loop seamlessly when BPM / instruments / sections change while playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setTimeout(() => {
      const scopeSections =
        loopScope === 'section' ? [activeSection] : activeDraft.sections;
      void startGrooveLoop({
        sections: scopeSections,
        melodyNotes: activeDraft.melodyNotes,
        bpm: activeDraft.bpm,
        backingInstrument: activeDraft.backingInstrument,
        drumPattern: activeDraft.drumPattern,
        melodyInstrument: activeDraft.melodyInstrument,
        onProgressBeat: (beatInLoop, _totalBeats, curSecId) => {
          playheadBeatRef.current = beatInLoop;
          setPlayingSectionId((prev) => (prev === curSecId ? prev : curSecId));
        },
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [
    isPlaying,
    loopScope,
    activeSection,
    activeDraft.sections,
    activeDraft.melodyNotes,
    activeDraft.bpm,
    activeDraft.backingInstrument,
    activeDraft.drumPattern,
    activeDraft.melodyInstrument,
  ]);

  // Smart Spacebar shortcut (Space outside text fields OR Ctrl/Cmd+Space anywhere)
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

  // Insert chord tag cleanly at cursor inside lyric textarea
  const handleInsertChordAtCursor = (symbol: string) => {
    setSelectedAnchorChord(symbol);
    void auditionChord(symbol, activeDraft.backingInstrument, 0);

    const ta = textareaRef.current;
    const tag = `[${symbol}]`;
    const pos = ta ? ta.selectionStart ?? cursorPosRef.current : activeSection.text.length;
    const end = ta ? ta.selectionEnd ?? pos : pos;
    const currentText = activeSection.text;
    const nextText = currentText.slice(0, pos) + tag + currentText.slice(end);

    updateActiveDraft((d) => ({
      ...d,
      sections: d.sections.map((sec) =>
        sec.id === activeSection.id ? { ...sec, text: nextText } : sec
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
    setSelectedAnchorChord(symbol);
    void auditionChord(symbol, activeDraft.backingInstrument, nextShift);
  };

  // Section management (add, duplicate, delete, reorder, change bars)
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
      // Start backing groove automatically if not yet playing
      if (!isPlaying) {
        void handleTogglePlayback();
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Không truy cập được micro trên thiết bị này.';
      setMicError(
        `${msg} Bạn vẫn có thể bấm "Ngân nga mẫu" hoặc vẽ nốt trực tiếp trên Piano Roll.`
      );
      setIsRecording(false);
    }
  };

  // Simulated hum-to-MIDI phrase through exact Pitchy-to-Scale quantizer
  const handleSimulateHumPhrase = () => {
    setMicError(null);
    const secPerBeat = 60 / activeDraft.bpm;
    const baseHz = activeDraft.keyRoot === 'F' ? 349.23 : 261.63;
    // Slight realistic human pitch wobble (sharp/flat) that Scale Snap corrects cleanly!
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

  return (
    <section
      id="lyric-groove-sketchpad"
      className="pt-8 pb-10 space-y-5"
      data-playing={isPlaying ? 'true' : 'false'}
    >
      {/* Header & Workspace Title */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#DCE6F2] dark:border-[#182740] pb-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
            <span className="font-semibold text-[#0369A1] dark:text-[#38BDF8]">
              Bàn Nháp Sáng Tác Tức Thì
            </span>
            <span aria-hidden="true">·</span>
            <span>Xử lý 100% trên trình duyệt</span>
            <span aria-hidden="true">·</span>
            <span data-testid="autosave-status">{saveNotice}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[#070B14] dark:text-[#F1F5F9]">
            Lyric &amp; Groove Sketchpad
          </h1>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] max-w-2xl">
            Gõ lời gắn hợp âm <span className="font-mono text-[#0369A1] dark:text-[#38BDF8]">[Am7]</span>,
            đếm âm tiết &amp; tô màu vần Bằng/Trắc, ghép vòng lặp ban nhạc và ngân nga ra nốt MIDI ngay tức thì.
          </p>
        </div>

        {/* Export & Theme Quick Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              exportLeadSheetPdf(activeDraft);
              setExportStatus('Đã xuất bản nhạc PDF Lead Sheet');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            <span>Xuất PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exportLeadSheetPng(activeDraft);
              setExportStatus('Đã xuất ảnh PNG Lead Sheet');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            <span>Xuất PNG</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exportMidiFile(activeDraft);
              setExportStatus('Đã xuất file MIDI (.mid)');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] dark:hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            <span>Xuất MIDI</span>
          </button>

          <button
            type="button"
            disabled={isExportingWav}
            onClick={() => void handleExportWav()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <FileAudio className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isExportingWav ? 'Đang tạo WAV...' : 'Xuất Audio .WAV'}</span>
          </button>

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

      {/* Studio Transport & Song Settings Bar */}
      <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-3.5 sm:p-4 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Draft Switcher + Title */}
          <div className="md:col-span-5 flex flex-wrap sm:flex-nowrap items-center gap-2">
            <label htmlFor="draft-selector" className="sr-only">
              Chọn bản nháp
            </label>
            <select
              id="draft-selector"
              value={activeDraft.id}
              onChange={(e) => setActiveDraftId(e.target.value)}
              className="max-w-[190px] truncate rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2.5 py-2 text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0]"
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
              className="flex-1 min-w-[140px] rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-white dark:bg-[#08101E] px-3 py-2 text-xs sm:text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9]"
            />

            <button
              type="button"
              onClick={handleCreateNewDraft}
              title="Tạo bản nháp mới"
              aria-label="Tạo bản nháp mới"
              className="p-2 rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] hover:border-[#0284C7] text-[#0F172A] dark:text-[#E2E8F0] transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>

            {drafts.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteCurrentDraft}
                title="Xóa bản nháp này"
                aria-label="Xóa bản nháp này"
                className="p-2 rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] hover:border-rose-500 text-[#475569] hover:text-rose-600 dark:text-[#94A3B8] transition-colors shrink-0 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Key, Scale & Mood Style */}
          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
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
                className="rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1.5 text-xs font-mono font-semibold text-[#0F172A] dark:text-[#F1F5F9]"
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
                className="rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2 py-1.5 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
              >
                <option value="major">Trưởng</option>
                <option value="minor">Thứ</option>
              </select>
            </div>

            <div className="flex items-center gap-1 flex-1 min-w-[145px]">
              <label htmlFor="mood-style-select" className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] whitespace-nowrap">
                Màu nhạc
              </label>
              <select
                id="mood-style-select"
                value={activeDraft.mood}
                onChange={(e) =>
                  handleMoodChange(e.target.value as MoodStyleId)
                }
                className="w-full rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] px-2.5 py-1.5 text-xs font-medium text-[#0F172A] dark:text-[#F1F5F9]"
              >
                {MOOD_STYLE_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Play Loop Control */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
              <button
                type="button"
                onClick={() => setLoopScope('section')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  loopScope === 'section'
                    ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Lặp đoạn này
              </button>
              <button
                type="button"
                onClick={() => setLoopScope('song')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  loopScope === 'song'
                    ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Toàn bài
              </button>
            </div>

            <button
              type="button"
              data-testid="play-loop-btn"
              onClick={() => void handleTogglePlayback()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#0284C7] hover:bg-[#0369A1]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Dừng (Space)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  <span>Phát Loop</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Backing Instrument, Drums, BPM */}
        <div className="pt-2.5 border-t border-[#E9F0F8] dark:border-[#152339] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                Đệm chính:
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
                {(
                  [
                    { id: 'rhodes', label: 'Rhodes EP' },
                    { id: 'guitar-strum', label: 'Guitar Rải' },
                    { id: 'piano-ballad', label: 'Piano Ballad' },
                  ] as const
                ).map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() =>
                      updateActiveDraft((d) => ({
                        ...d,
                        backingInstrument: inst.id as BackingInstrumentId,
                      }))
                    }
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeDraft.backingInstrument === inst.id
                        ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                        : 'text-[#475569] dark:text-[#94A3B8]'
                    }`}
                  >
                    {inst.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                Trống:
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
                {(
                  [
                    { id: 'none', label: 'Không trống' },
                    { id: 'lofi', label: 'Lo-fi' },
                    { id: 'boombap', label: 'Boom-bap' },
                  ] as const
                ).map((drum) => (
                  <button
                    key={drum.id}
                    type="button"
                    onClick={() =>
                      updateActiveDraft((d) => ({
                        ...d,
                        drumPattern: drum.id as DrumPatternId,
                      }))
                    }
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeDraft.drumPattern === drum.id
                        ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                        : 'text-[#475569] dark:text-[#94A3B8]'
                    }`}
                  >
                    {drum.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BPM Control */}
          <div className="flex items-center gap-2.5">
            <label
              htmlFor="bpm-slider"
              className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8] whitespace-nowrap"
            >
              Tốc độ:
            </label>
            <input
              id="bpm-slider"
              type="range"
              min={55}
              max={155}
              value={activeDraft.bpm}
              onChange={(e) =>
                updateActiveDraft((d) => ({ ...d, bpm: Number(e.target.value) }))
              }
              className="w-28 accent-[#0284C7] cursor-pointer"
            />
            <span className="font-mono text-xs font-semibold tabular-nums text-[#070B14] dark:text-[#F1F5F9] min-w-[60px] text-right">
              {activeDraft.bpm} BPM
            </span>
          </div>
        </div>
      </div>

      {/* Song Structure Rail (Drag & Drop + Reorder) */}
      <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            <h2 className="font-sans text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9]">
              Bố cục bài hát (Kéo thả để sắp xếp)
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EFF4FA] dark:bg-[#132238] text-[#0369A1] dark:text-[#38BDF8] hover:bg-[#DCE6F2] dark:hover:bg-[#1C3152] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Thêm đoạn</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeDraft.sections.map((sec, idx) => {
            const isSelected = sec.id === activeSection.id;
            const isCurrentlyPlaying = isPlaying && playingSectionId === sec.id;
            return (
              <div
                key={sec.id}
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
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
                  isSelected
                    ? 'border-[#0284C7] dark:border-[#38BDF8] bg-sky-50/75 dark:bg-sky-950/45'
                    : 'border-[#DCE6F2] dark:border-[#1B2B46] bg-[#F8FAFC] dark:bg-[#08101E]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSectionId(sec.id)}
                  className="text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] whitespace-nowrap">
                      {idx + 1}. {sec.kind}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-[#475569] dark:text-[#94A3B8]">
                      {sec.bars} ô
                    </span>
                    {isCurrentlyPlaying && (
                      <span className="text-[10px] font-semibold text-[#0284C7] dark:text-[#38BDF8]">
                        (Đang phát)
                      </span>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-0.5 pl-1 border-l border-[#DCE6F2] dark:border-[#1B2B46]">
                  <button
                    type="button"
                    disabled={idx === 0}
                    aria-label={`Đẩy ${sec.label} sang trái`}
                    onClick={() => handleMoveSection(idx, -1)}
                    className="p-1 text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === activeDraft.sections.length - 1}
                    aria-label={`Đẩy ${sec.label} sang phải`}
                    onClick={() => handleMoveSection(idx, 1)}
                    className="p-1 text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Nhân đôi ${sec.label}`}
                    onClick={() => handleDuplicateSection(sec)}
                    className="p-1 text-[#475569] dark:text-[#94A3B8] hover:text-[#0284C7] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                  </button>
                  {activeDraft.sections.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Xóa ${sec.label}`}
                      onClick={() => handleDeleteSection(sec.id)}
                      className="p-1 text-[#475569] dark:text-[#94A3B8] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Workbench: Left Lyric/Chord/Rhyme Studio, Right Hum-to-MIDI Piano Roll */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols): Smart Lyric & Rhyme Editor + Mood Chord Suggester */}
        <div className="lg:col-span-7 space-y-5">
          {/* Smart Lyric & Anchored Chord Workspace */}
          <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-4 sm:p-5 space-y-4">
            <div className="space-y-2.5 border-b border-[#E9F0F8] dark:border-[#152339] pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                  className="font-sans text-base font-semibold bg-transparent text-[#070B14] dark:text-[#F1F5F9] border-b border-transparent focus:border-[#0284C7] outline-none flex-1 min-w-[200px]"
                />
                <span className="text-xs text-[#475569] dark:text-[#94A3B8] tabular-nums whitespace-nowrap shrink-0">
                  {sectionAnalysis.totalSyllables} tiếng · {sectionAnalysis.totalChords} hợp âm
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                    Số ô nhịp:
                  </label>
                  <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
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
                        className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                          activeSection.bars === barOpt
                            ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white font-semibold'
                            : 'text-[#475569] dark:text-[#94A3B8]'
                        }`}
                      >
                        {barOpt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowToneMarkers((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showToneMarkers
                      ? 'border-[#0284C7] bg-sky-50 dark:bg-sky-950/60 text-[#0369A1] dark:text-[#38BDF8]'
                      : 'border-[#DCE6F2] dark:border-[#1B2B46] text-[#475569] dark:text-[#94A3B8]'
                  }`}
                >
                  {showToneMarkers ? 'Đang hiện Bằng/Trắc' : 'Hiện Bằng/Trắc'}
                </button>
              </div>
            </div>

            {/* Lyric & Inline Chord Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="smart-lyric-textarea"
                className="text-xs font-medium text-[#475569] dark:text-[#94A3B8] flex items-center justify-between"
              >
                <span>Soạn lời trực tiếp (gõ [Am7], [Fmaj7], [Dm9] tại phách cần đổi)</span>
                <span className="font-mono text-[11px]">Ctrl+Space để nghe loop</span>
              </label>
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
                      s.id === activeSection.id ? { ...s, text: val } : s
                    ),
                  }));
                }}
                placeholder="[Am7]Gõ lời bài hát tại đây..."
                className="w-full rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#070D19] px-3.5 py-2.5 font-mono text-sm leading-relaxed text-[#070B14] dark:text-[#F1F5F9] focus:border-[#0284C7] dark:focus:border-[#38BDF8] outline-none resize-y"
              />
            </div>

            {/* Live Anchored Chords + Rhyme & Syllable Breakdown */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#070B14] dark:text-[#F1F5F9]">
                  Phân tích hợp âm, số tiếng &amp; vần điệu theo thời gian thực
                </span>
                <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  Bấm tên hợp âm để nghe thử &amp; đổi thế bấm (Voicing)
                </span>
              </div>

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
                      {/* Anchored Chords Row */}
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
                                title="Bấm để nghe thử và đổi thế bấm (Gốc / Đảo 1 / Đảo 2 / Mở rộng)"
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

                      {/* Lyric Words with Real-time Rhyme Highlight & Tone Tag */}
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

                    {/* Line Syllable Counter */}
                    <div
                      data-testid={`line-syllables-${line.lineIndex}`}
                      className="shrink-0 font-mono text-xs tabular-nums text-[#475569] dark:text-[#94A3B8] whitespace-nowrap"
                    >
                      {line.syllableCount} tiếng
                    </div>
                  </div>
                ))}
              </div>

              {/* Detected Rhyme Families Summary */}
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
          </div>

          {/* Mood-Based Chord Suggester Dock */}
          <div className="rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5">
                <h2 className="font-sans text-sm font-semibold text-[#070B14] dark:text-[#F1F5F9] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                  <span>Gợi ý hợp âm tiếp theo theo màu nhạc</span>
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  Chọn hợp âm mở đầu trong thang âm {activeDraft.keyRoot}{' '}
                  {activeDraft.scaleMode === 'major' ? 'Trưởng' : 'Thứ'}, sau đó bấm nghe thử hoặc chèn 1 chạm.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                Đang nối từ: {selectedAnchorChord}
              </span>
            </div>

            {/* Diatonic Opening Chord Palette */}
            <div className="flex flex-wrap items-center gap-1.5">
              {diatonicPalette.map((chordName) => (
                <button
                  key={chordName}
                  type="button"
                  onClick={() => {
                    setSelectedAnchorChord(chordName);
                    void auditionChord(chordName, activeDraft.backingInstrument, 0);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedAnchorChord === chordName
                      ? 'border-[#0284C7] bg-[#0284C7] text-white'
                      : 'border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7]'
                  }`}
                >
                  {chordName}
                </button>
              ))}
            </div>

            {/* 5 Recommended Next Chords */}
            <div
              data-testid="chord-suggestions-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
            >
              {chordSuggestions.map((s) => (
                <div
                  key={s.symbol}
                  className="rounded-lg border border-[#DCE6F2] dark:border-[#1B2B46] bg-[#FAFBFD] dark:bg-[#070D19] p-3 flex flex-col justify-between gap-2.5"
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
                      onClick={() => {
                        setSelectedAnchorChord(s.symbol);
                        void auditionChord(s.symbol, activeDraft.backingInstrument, 0);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded border border-[#CBD8E6] dark:border-[#1F3557] text-xs font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Nghe</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Chèn hợp âm ${s.symbol}`}
                      onClick={() => handleInsertChordAtCursor(s.symbol)}
                      className="flex-1 inline-flex items-center justify-center gap-0.5 py-1.5 rounded bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1] text-white text-xs font-semibold cursor-pointer"
                    >
                      <span>+ Chèn</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Hum-to-MIDI Sketcher & 60fps Canvas Piano Roll */}
        <div className="lg:col-span-5 lg:sticky lg:top-20 rounded-xl border border-[#DCE6F2] dark:border-[#182740] bg-white/95 dark:bg-[#0B1220]/95 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9F0F8] dark:border-[#152339] pb-3">
            <div className="space-y-0.5">
              <h2 className="font-sans text-base font-semibold text-[#070B14] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <Music2 className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                <span>Ngân nga ra nốt MIDI (Piano Roll 60fps)</span>
              </h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                Thu giọng qua micro hoặc vẽ trực tiếp — tự nắn chuẩn theo thang âm {activeDraft.keyRoot}.
              </p>
            </div>
          </div>

          {/* Mic Recording + Demo Hum + Scale Snap */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="mic-record-btn"
                onClick={() => void handleToggleMicRecord()}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#0A192F] hover:bg-[#13294B] dark:bg-[#0284C7] dark:hover:bg-[#0369A1]'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Dừng thu &amp; Nắn nốt</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ghi âm ngân nga</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulateHumPhrase}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border border-[#CBD8E6] dark:border-[#1F3557] bg-[#F8FAFC] dark:bg-[#08101E] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Ngân nga mẫu</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  updateActiveDraft((d) => ({ ...d, scaleSnap: !d.scaleSnap }))
                }
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDraft.scaleSnap
                    ? 'border-emerald-500/70 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : 'border-[#CBD8E6] dark:border-[#1F3557] text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Nắn đúng tông: {activeDraft.scaleSnap ? 'BẬT' : 'TẮT'}
              </button>
            </div>

            {/* Live Pitch & Input Meter */}
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#F8FAFC] dark:bg-[#070D19] border border-[#E9F0F8] dark:border-[#152339] text-xs">
              <span className="font-mono text-[#0F172A] dark:text-[#E2E8F0] tabular-nums truncate">
                {livePitchLabel}
              </span>
              <div className="w-24 h-2 rounded-full bg-[#DCE6F2] dark:bg-[#16243B] overflow-hidden shrink-0">
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
          </div>

          {/* Melody Playback Sound Selector & Clear */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                Tiếng giai điệu:
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#08101E] border border-[#DCE6F2] dark:border-[#1B2B46]">
                {(
                  [
                    { id: 'piano', label: 'Piano' },
                    { id: 'synth', label: 'Synth' },
                    { id: 'guitar', label: 'Guitar' },
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
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      activeDraft.melodyInstrument === timbre.id
                        ? 'bg-white dark:bg-[#162640] text-[#070B14] dark:text-white shadow-xs'
                        : 'text-[#475569] dark:text-[#94A3B8]'
                    }`}
                  >
                    {timbre.label}
                  </button>
                ))}
              </div>
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
                Xóa {sectionMelodyNotes.length} nốt đoạn này
              </button>
            )}
          </div>

          {/* 60fps Interactive Piano Roll Canvas */}
          <PianoRollCanvas
            theme={theme}
            sectionId={activeSection.id}
            bars={activeSection.bars}
            keyRoot={activeDraft.keyRoot}
            scaleMode={activeDraft.scaleMode}
            scaleSnap={activeDraft.scaleSnap}
            melodyInstrument={activeDraft.melodyInstrument}
            notes={sectionMelodyNotes}
            chordMarkers={sectionChordMarkers}
            playheadBeatRef={playheadBeatRef}
            isPlaying={isPlaying}
            isRecording={isRecording}
            liveWaveformRef={liveWaveformRef}
            liveDetectedMidiRef={liveDetectedMidiRef}
            onAddNote={addMelodyNote}
            onRemoveNote={removeMelodyNote}
            onResizeNoteDuration={resizeMelodyNoteDuration}
          />
        </div>
      </div>
    </section>
  );
}
