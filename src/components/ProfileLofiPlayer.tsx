import {
  ChevronDown,
  ChevronUp,
  Disc3,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
  getLiveAudioFrame,
  setMasterVolume,
  startGrooveLoop,
  stopGrooveLoop,
} from '../utils/lyricGrooveAudio.ts';
import { loadAllSketchpadDrafts } from '../utils/lyricGrooveDb.ts';
import {
  buildProfilePlaylist,
  createStarterDrafts,
  getDraftStyleLabel,
  type SketchpadDraft,
} from '../utils/lyricGrooveEngine.ts';
import { type ThemeMode } from '../utils/portfolioLogic.ts';

interface ProfileLofiPlayerProps {
  theme: ThemeMode;
  onOpenStudio: () => void;
}

const SESSION_PAUSED_KEY = 'thuanle-profile-lofi-paused';

export function ProfileLofiPlayer({ theme, onOpenStudio }: ProfileLofiPlayerProps) {
  const [playlist, setPlaylist] = useState<SketchpadDraft[]>(() =>
    buildProfilePlaylist(createStarterDrafts())
  );
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [volume, setVolume] = useState(0.42);
  const [activeChord, setActiveChord] = useState<string | null>(null);
  const [awaitingGesture, setAwaitingGesture] = useState(false);

  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const userPausedRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);
  const playlistRef = useRef<SketchpadDraft[]>(playlist);

  playlistRef.current = playlist;
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    try {
      userPausedRef.current = sessionStorage.getItem(SESSION_PAUSED_KEY) === '1';
    } catch {
      userPausedRef.current = false;
    }
  }, []);

  // Sync playlist with the latest drafts from Studio / IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    void loadAllSketchpadDrafts().then((loaded) => {
      if (cancelled || !Array.isArray(loaded) || loaded.length === 0) return;
      const nextPlaylist = buildProfilePlaylist(loaded);
      setPlaylist(nextPlaylist);
      setTrackIndex((prevIdx) => {
        if (!isPlayingRef.current) return 0;
        const current = playlistRef.current[prevIdx % Math.max(1, playlistRef.current.length)];
        if (!current) return 0;
        const matchIdx = nextPlaylist.findIndex((item) => item.id === current.id);
        return matchIdx >= 0 ? matchIdx : 0;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const safeIdx = playlist.length > 0 ? trackIndex % playlist.length : 0;
  const currentTrack = playlist[safeIdx];

  const startTrack = useCallback(
    async (track: SketchpadDraft, targetVol: number) => {
      setIsPlaying(true);
      setAwaitingGesture(false);
      await startGrooveLoop({
        sections: track.sections,
        melodyNotes: track.melodyNotes,
        bpm: track.bpm,
        backingInstrument: track.backingInstrument,
        backingPattern:
          track.backingPattern ??
          (track.backingInstrument === 'piano-ballad' ? 'auto-song' : 'rich-block'),
        chordArpStyles: track.chordArpStyles,
        songMood: track.mood,
        sustainPedal: track.sustainPedal ?? true,
        metronomeEnabled: false,
        drumPattern: track.drumPattern,
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

  // Smart auto-arm background music on Profile tab
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
    // Only re-arm on track index changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIdx]);

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

  const selectAndPlayIndex = async (targetIdx: number) => {
    if (playlist.length === 0) return;
    const normalizedIdx = ((targetIdx % playlist.length) + playlist.length) % playlist.length;
    setTrackIndex(normalizedIdx);
    userPausedRef.current = false;
    try {
      sessionStorage.removeItem(SESSION_PAUSED_KEY);
    } catch {
      // Ignore
    }
    const nextTrack = playlist[normalizedIdx];
    if (nextTrack) {
      await startTrack(nextTrack, volume);
    }
  };

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

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    setMasterVolume(nextVol);
  };

  if (!currentTrack) return null;

  const styleLabel = getDraftStyleLabel(currentTrack);

  return (
    <aside
      data-testid="profile-lofi-player"
      aria-label="Trình phát nhạc trên Hồ sơ"
      className="fixed bottom-4 right-4 z-40 w-[300px] sm:w-[332px] rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-white/95 dark:bg-[#0B1220]/95 shadow-xl backdrop-blur-md overflow-hidden transition-all"
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
            <div
              data-testid="profile-track-meta"
              className="text-[10px] font-mono uppercase tracking-wider text-[#0369A1] dark:text-[#38BDF8] font-semibold"
            >
              {styleLabel} · {currentTrack.bpm} BPM · {safeIdx + 1}/{playlist.length}
            </div>
            <div
              data-testid="profile-track-title"
              className="text-xs font-semibold text-[#070B14] dark:text-[#F1F5F9] truncate"
            >
              {currentTrack.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            data-testid="lofi-toggle-btn"
            onClick={() => void handleTogglePlay()}
            aria-label={isPlaying ? 'Tạm dừng nhạc nền' : 'Phát nhạc nền'}
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
            aria-label={isCollapsed ? 'Mở rộng trình phát nhạc' : 'Thu gọn trình phát nhạc'}
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
        <div className="px-3.5 py-2.5 space-y-2">
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
                    ? 'Chạm vào trang hoặc bấm Phát để bật nhạc'
                    : 'Đang tạm dừng'}
                </span>
              )}
            </div>
          </div>

          {/* Playlist Track Selector */}
          <div>
            <label htmlFor="profile-track-select" className="sr-only">
              Chọn bài nhạc phát trên hồ sơ
            </label>
            <select
              id="profile-track-select"
              data-testid="profile-track-select"
              value={currentTrack.id}
              onChange={(e) => {
                const nextIdx = playlist.findIndex((item) => item.id === e.target.value);
                if (nextIdx >= 0) {
                  void selectAndPlayIndex(nextIdx);
                }
              }}
              className="w-full px-2 py-1 rounded-md border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0C1628] text-[11px] font-medium text-[#0F172A] dark:text-[#E2E8F0] focus:outline-none focus:border-[#0284C7] cursor-pointer truncate"
            >
              {playlist.map((track, idx) => (
                <option key={track.id} value={track.id}>
                  {idx + 1}. {track.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
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
                aria-label="Âm lượng nhạc nền"
                min={0}
                max={0.85}
                step={0.02}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20 accent-[#0284C7] cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                data-testid="lofi-prev-btn"
                onClick={() => void selectAndPlayIndex(safeIdx - 1)}
                title="Bài trước"
                aria-label="Bài trước"
                className="p-1.5 rounded-md border border-[#DCE6F2] dark:border-[#1E314E] text-[#0F172A] dark:text-[#E2E8F0] hover:border-[#0284C7] cursor-pointer"
              >
                <SkipBack className="w-3 h-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-testid="lofi-next-btn"
                onClick={() => void selectAndPlayIndex(safeIdx + 1)}
                title="Đổi bài tiếp theo"
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
