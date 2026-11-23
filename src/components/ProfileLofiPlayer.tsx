import {
  ChevronDown,
  ChevronUp,
  Disc3,
  Music2,
  Pause,
  Play,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
  getLiveAudioFrame,
  setMasterVolume,
  startGrooveLoop,
  stopGrooveLoop,
} from '../utils/lyricGrooveAudio.ts';
import {
  createStarterDrafts,
  type MelodyNote,
  type SketchpadDraft,
} from '../utils/lyricGrooveEngine.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';

interface ProfileLofiPlayerProps {
  theme: ThemeMode;
  onOpenStudio: () => void;
}

const SESSION_PAUSED_KEY = 'thuanle-profile-lofi-paused';

function buildMidnightCafeLofiTrack(): SketchpadDraft {
  const secId = 'sec-lofi-cafe-1';
  const melody: MelodyNote[] = [
    { id: 'lf-1', sectionId: secId, midi: 69, startBeat: 0.5, durationBeats: 1.5, velocity: 0.65 },
    { id: 'lf-2', sectionId: secId, midi: 72, startBeat: 2.5, durationBeats: 1.0, velocity: 0.62 },
    { id: 'lf-3', sectionId: secId, midi: 71, startBeat: 4.0, durationBeats: 2.0, velocity: 0.66 },
    { id: 'lf-4', sectionId: secId, midi: 67, startBeat: 6.5, durationBeats: 1.5, velocity: 0.6 },
    { id: 'lf-5', sectionId: secId, midi: 69, startBeat: 8.5, durationBeats: 1.5, velocity: 0.64 },
    { id: 'lf-6', sectionId: secId, midi: 64, startBeat: 10.5, durationBeats: 1.5, velocity: 0.58 },
    { id: 'lf-7', sectionId: secId, midi: 67, startBeat: 12.0, durationBeats: 2.5, velocity: 0.62 },
    { id: 'lf-8', sectionId: secId, midi: 62, startBeat: 14.5, durationBeats: 1.5, velocity: 0.56 },
  ];
  return {
    id: 'lofi-midnight-cafe',
    title: 'Cà Phê Đêm 2AM (Lo-fi Rhodes)',
    keyRoot: 'C',
    scaleMode: 'major',
    mood: 'lofi-chill',
    bpm: 74,
    backingInstrument: 'rhodes',
    backingPattern: 'rich-block',
    sustainPedal: true,
    metronomeEnabled: false,
    drumPattern: 'lofi',
    melodyInstrument: 'piano',
    scaleSnap: true,
    sections: [
      {
        id: secId,
        kind: 'Verse',
        label: 'Lo-fi Chill Loop',
        bars: 4,
        text: '[Fmaj9]Hơi ấm tách cà phê [Em7]đêm khuya\n[Dm9]Ánh đèn vàng nhẹ rơi [Cmaj9]bên hiên',
      },
    ],
    melodyNotes: melody,
    updatedAt: Date.now(),
  };
}

export function ProfileLofiPlayer({ theme, onOpenStudio }: ProfileLofiPlayerProps) {
  const playlist = useMemo<SketchpadDraft[]>(() => {
    const starters = createStarterDrafts();
    const muaBanCong = starters.find((d) => d.id === 'draft-mua-ban-cong');
    const balladAm = starters.find((d) => d.id === 'draft-khoang-cach-hai-ta-am');
    const tracks: SketchpadDraft[] = [];
    if (muaBanCong) {
      tracks.push({ ...muaBanCong, title: 'Mưa Ban Công (Lo-fi Chill)' });
    }
    tracks.push(buildMidnightCafeLofiTrack());
    if (balladAm) {
      tracks.push({
        ...balladAm,
        title: 'Khoảng Cách Hai Ta (Ballad Chill)',
      });
    }
    return tracks;
  }, []);

  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [volume, setVolume] = useState(0.42);
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [awaitingGesture, setAwaitingGesture] = useState(false);

  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const userPausedRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      userPausedRef.current = sessionStorage.getItem(SESSION_PAUSED_KEY) === '1';
    } catch {
      userPausedRef.current = false;
    }
  }, []);

  const currentTrack = playlist[trackIndex % playlist.length];

  const startTrack = useCallback(
    async (track: SketchpadDraft, targetVol: number) => {
      setIsPlaying(true);
      setAwaitingGesture(false);
      await startGrooveLoop({
        sections: track.sections,
        melodyNotes: track.melodyNotes,
        bpm: track.bpm,
        backingInstrument: track.backingInstrument,
        backingPattern: track.backingPattern ?? 'rich-block',
        sustainPedal: track.sustainPedal ?? true,
        metronomeEnabled: false,
        drumPattern: track.drumPattern === 'none' ? 'lofi' : track.drumPattern,
        melodyInstrument: track.melodyInstrument,
        repeatLoop: true,
        volumeGain: targetVol,
        onChordTrigger: (ev) => {
          setActiveChord(ev ? ev.symbol : null);
        },
      });
    },
    []
  );

  // Smart auto-arm background Lo-fi music on Profile tab
  useEffect(() => {
    if (userPausedRef.current || !currentTrack) return;

    const rawCtx = Tone.getContext().rawContext;
    if (rawCtx.state === 'running') {
      void startTrack(currentTrack, volume);
      return;
    }

    setAwaitingGesture(true);
    let triggered = false;
    const handleFirstGesture = () => {
      if (triggered || userPausedRef.current) return;
      triggered = true;
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      void startTrack(currentTrack, volume);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    // Only run on mount / track change when armed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIndex]);

  // Stop audio cleanly when leaving Profile tab
  useEffect(() => {
    return () => {
      stopGrooveLoop();
      setMasterVolume(0.88);
    };
  }, []);

  // Mini spectrum visualizer
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const renderBars = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth || 72;
      const h = canvas.clientHeight || 22;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const frame = isPlaying ? getLiveAudioFrame() : null;
      const count = 12;
      const gap = 2;
      const bw = Math.max(2, (w - gap * (count - 1)) / count);
      for (let i = 0; i < count; i++) {
        let level = 0.14;
        if (frame && frame.spectrum.length > 0) {
          const bin = Math.min(
            frame.spectrum.length - 1,
            Math.floor((i / count) * (frame.spectrum.length * 0.45))
          );
          level = Math.max(0.14, frame.spectrum[bin] / 255);
        }
        const bh = Math.max(3, level * (h - 2));
        ctx.fillStyle = isPlaying
          ? theme === 'dark'
            ? '#34D399'
            : '#0284C7'
          : theme === 'dark'
          ? 'rgba(148, 163, 184, 0.3)'
          : 'rgba(100, 116, 139, 0.3)';
        ctx.beginPath();
        ctx.roundRect(i * (bw + gap), h - bh, bw, bh, 1.5);
        ctx.fill();
      }
      ctx.restore();
      if (isPlaying) {
        rafId = requestAnimationFrame(renderBars);
      }
    };

    renderBars();
    if (isPlaying) {
      rafId = requestAnimationFrame(renderBars);
    }
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, theme, isCollapsed]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopGrooveLoop();
      setIsPlaying(false);
      setActiveChord(null);
      userPausedRef.current = true;
      try {
        sessionStorage.setItem(SESSION_PAUSED_KEY, '1');
      } catch {
        // Ignore
      }
      return;
    }

    userPausedRef.current = false;
    try {
      sessionStorage.removeItem(SESSION_PAUSED_KEY);
    } catch {
      // Ignore
    }
    if (currentTrack) {
      await startTrack(currentTrack, volume);
    }
  };

  const handleNextTrack = async () => {
    const nextIdx = (trackIndex + 1) % playlist.length;
    setTrackIndex(nextIdx);
    userPausedRef.current = false;
    try {
      sessionStorage.removeItem(SESSION_PAUSED_KEY);
    } catch {
      // Ignore
    }
    const nextTrack = playlist[nextIdx];
    if (nextTrack) {
      await startTrack(nextTrack, volume);
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    setMasterVolume(nextVol);
  };

  if (!currentTrack) return null;

  return (
    <aside
      data-testid="profile-lofi-player"
      aria-label="Trình phát nhạc Lo-fi Chill trên Hồ sơ"
      className="fixed bottom-4 right-4 z-40 w-[300px] sm:w-[325px] rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-white/95 dark:bg-[#0B1220]/95 shadow-xl backdrop-blur-md overflow-hidden transition-all"
    >
      {/* Compact Header Bar */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-[#E9F0F8] dark:border-[#152339]">
        <div className="flex items-center gap-2 min-w-0">
          <Disc3
            className={`w-4 h-4 shrink-0 text-[#0284C7] dark:text-[#34D399] ${
              isPlaying ? 'animate-spin' : ''
            }`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#0369A1] dark:text-[#38BDF8] font-semibold">
              Lo-fi Chill · {currentTrack.bpm} BPM
            </div>
            <div className="text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] truncate">
              {currentTrack.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-testid="lofi-toggle-btn"
            onClick={() => void handleTogglePlay()}
            aria-label={isPlaying ? 'Tạm dừng nhạc Lo-fi' : 'Phát nhạc Lo-fi'}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#0284C7] hover:bg-[#0369A1]'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? 'Mở rộng trình phát Lo-fi' : 'Thu gọn trình phát Lo-fi'}
            className="p-1.5 rounded-lg text-[#475569] dark:text-[#94A3B8] hover:bg-[#EFF4FA] dark:hover:bg-[#162640] cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Player Body */}
      {!isCollapsed && (
        <div className="px-3.5 py-2.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <canvas
              ref={spectrumCanvasRef}
              aria-hidden="true"
              className="w-20 h-6 rounded bg-[#F8FAFC] dark:bg-[#070D19] border border-[#E9F0F8] dark:border-[#152339] px-1 py-0.5"
            />
            <div className="flex-1 min-w-0 text-right">
              {isPlaying ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <span>Hợp âm:</span>
                  <span>{activeChord ?? '…'}</span>
                </span>
              ) : (
                <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  {awaitingGesture
                    ? 'Chạm vào trang hoặc bấm Phát để bật nhạc nền'
                    : 'Đang tạm dừng'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 flex-1">
              <button
                type="button"
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 0.42)}
                aria-label={volume > 0 ? 'Tắt tiếng' : 'Bật âm lượng'}
                className="text-[#475569] dark:text-[#94A3B8] hover:text-[#070B14] dark:hover:text-white cursor-pointer"
              >
                {volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
              <input
                type="range"
                aria-label="Âm lượng nhạc nền Lo-fi"
                min={0}
                max={0.85}
                step={0.02}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 accent-[#0284C7] cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void handleNextTrack()}
                title="Đổi bài Lo-fi tiếp theo"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#DCE6F2] dark:border-[#1E314E] text-[11px] font-medium text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] cursor-pointer"
              >
                <SkipForward className="w-3 h-3" aria-hidden="true" />
                <span>Bài sau</span>
              </button>
              <button
                type="button"
                onClick={onOpenStudio}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 border border-[#0284C7]/35 text-[11px] font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:border-[#0284C7] cursor-pointer"
              >
                <Music2 className="w-3 h-3" aria-hidden="true" />
                <span>Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
