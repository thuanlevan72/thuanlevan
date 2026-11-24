import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Layers,
  Mic,
  Music,
  Play,
  Sliders,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { auditionChord, auditionProgression, stopProgressionAudition } from '../utils/lyricGrooveAudio.ts';
import type { BackingInstrumentId } from '../utils/lyricGrooveEngine.ts';

interface SongwritingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInstrument?: BackingInstrumentId;
  onQuickApplyTimeSig?: (timeSig: '2/4' | '3/4' | '4/4' | '6/8') => void;
}

type GuideChapterId = 'overview' | 'theory' | 'grooves' | 'lyrics-melody' | 'practice';

const CHAPTERS: Array<{
  id: GuideChapterId;
  shortLabel: string;
  title: string;
  subtitle: string;
}> = [
  {
    id: 'overview',
    shortLabel: '1. Tổng quan App',
    title: 'Làm Quen Bàn Nháp & Quy Trình 4 Bước',
    subtitle: 'Hiểu nhanh từng khu vực trên màn hình và cách bắt đầu viết nhạc ngay lập tức.',
  },
  {
    id: 'theory',
    shortLabel: '2. Nhạc lý cơ bản',
    title: 'Tông, Nhịp, BPM & Hợp Âm Dễ Hiểu',
    subtitle: 'Giải thích bằng hình ảnh trực quan + bấm nghe thử trực tiếp, không cần học thuật phức tạp.',
  },
  {
    id: 'grooves',
    shortLabel: '3. Kiểu Rải & Điệu',
    title: 'Phân Biệt 10 Kiểu Rải & 21 Điệu Đệm',
    subtitle: 'Biết khi nào chọn Ballad 2/4, 4/4, Bolero hay Valse 3/4 để bài hát ra đúng chất.',
  },
  {
    id: 'lyrics-melody',
    shortLabel: '4. Lời & Giai điệu',
    title: 'Viết Lời Có [Hợp Âm], Soi Vần & Tạo Giai Điệu',
    subtitle: 'Cách đồng bộ ca từ với ô nhịp, tận dụng Bằng/Trắc tiếng Việt và Piano Đang Đánh.',
  },
  {
    id: 'practice',
    shortLabel: '5. Thực hành 3 phút',
    title: 'Công Thức Tự Viết 1 Đoạn Điệp Khúc Hay',
    subtitle: 'Áp dụng từng bước từ con số 0 để ra ngay 8 ô nhịp hoàn chỉnh nghe mượt tai.',
  },
];

const CHORD_EXAMPLES: Array<{
  symbol: string;
  vibe: string;
  meaning: string;
  colorClass: string;
}> = [
  {
    symbol: 'C',
    vibe: 'Sáng · Vui · Vững',
    meaning: 'Hợp âm Trưởng (Major) mang cảm giác mở đầu hoặc kết bài tròn trịa, tươi sáng.',
    colorClass: 'border-sky-300 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40',
  },
  {
    symbol: 'Am',
    vibe: 'Trầm · Tự sự · Nhẹ',
    meaning: 'Hợp âm Thứ (Minor) — có chữ "m" nhỏ phía sau, tạo màu suy tư, sâu lắng.',
    colorClass: 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40',
  },
  {
    symbol: 'Fmaj7',
    vibe: 'Mơ màng · Chill · Rộng',
    meaning: 'Thêm nốt bậc 7 trưởng giúp câu hát nghe hiện đại, bay bổng hơn hợp âm F thường.',
    colorClass: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40',
  },
  {
    symbol: 'G/B',
    vibe: 'Nối mượt · Bass đi liền',
    meaning: 'Hợp âm G nhưng đánh nốt trầm B ở tay trái để bước từ C → G/B → Am nghe êm ru.',
    colorClass: 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40',
  },
];

export function SongwritingGuideModal({
  isOpen,
  onClose,
  currentInstrument = 'guitar-strum',
}: SongwritingGuideModalProps) {
  const [activeChapter, setActiveChapter] = useState<GuideChapterId>('overview');
  const [demoInstrument, setDemoInstrument] = useState<'guitar-strum' | 'piano-ballad'>(
    currentInstrument === 'piano-ballad' ? 'piano-ballad' : 'guitar-strum'
  );
  const [playingDemoLabel, setPlayingDemoLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDemoInstrument(currentInstrument === 'piano-ballad' ? 'piano-ballad' : 'guitar-strum');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopProgressionAudition();
        setPlayingDemoLabel(null);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentInstrument, onClose]);

  if (!isOpen) return null;

  const activeMeta = CHAPTERS.find((c) => c.id === activeChapter) ?? CHAPTERS[0];

  const handlePlaySingleChord = (symbol: string) => {
    stopProgressionAudition();
    setPlayingDemoLabel(symbol);
    void auditionChord(symbol, demoInstrument, 0, true, 'ballad-wave').finally(() => {
      window.setTimeout(() => {
        setPlayingDemoLabel((prev) => (prev === symbol ? null : prev));
      }, 900);
    });
  };

  const handlePlayChordSequence = (
    label: string,
    chords: string[],
    pattern: 'rising-arp' | 'ballad-wave' | 'falling-arp',
    bpm: number
  ) => {
    stopProgressionAudition();
    setPlayingDemoLabel(label);
    void auditionProgression(chords, demoInstrument, pattern, bpm, true, (step) => {
      if (!step) {
        setPlayingDemoLabel(null);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060C18]/75 p-2.5 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="songwriting-guide-title"
      data-testid="songwriting-guide-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopProgressionAudition();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-[#CBD8E6] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-[#E2ECF5] dark:border-[#182740] bg-[#F8FBFF] dark:bg-[#08101E]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="songwriting-guide-title"
                className="text-sm sm:text-base font-bold text-[#070B14] dark:text-[#F1F5F9] truncate"
              >
                Cẩm Nang Sáng Tác &amp; Hướng Dẫn Sử Dụng Studio
              </h2>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate">
                Hiểu rõ mọi nút bấm, khái niệm nhạc lý cơ bản &amp; bấm nghe ví dụ trực quan ngay trong sách
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick instrument switch for interactive audio examples inside handbook */}
            <div
              className="flex items-center p-0.5 rounded-lg bg-[#EFF4FA] dark:bg-[#0E192C] border border-[#DCE6F2] dark:border-[#1B2B46]"
              aria-label="Chọn nhạc cụ nghe thử trong sách"
            >
              <button
                type="button"
                onClick={() => setDemoInstrument('guitar-strum')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  demoInstrument === 'guitar-strum'
                    ? 'bg-white dark:bg-[#162640] text-[#0369A1] dark:text-[#38BDF8] shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Guitar
              </button>
              <button
                type="button"
                onClick={() => setDemoInstrument('piano-ballad')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  demoInstrument === 'piano-ballad'
                    ? 'bg-white dark:bg-[#162640] text-[#0369A1] dark:text-[#38BDF8] shadow-xs'
                    : 'text-[#475569] dark:text-[#94A3B8]'
                }`}
              >
                Piano
              </button>
            </div>

            <button
              type="button"
              data-testid="close-guide-modal-btn"
              onClick={() => {
                stopProgressionAudition();
                onClose();
              }}
              aria-label="Đóng sách hướng dẫn"
              className="p-2 rounded-lg border border-[#CBD8E6] dark:border-[#1E314E] bg-white dark:bg-[#0B1220] text-[#475569] hover:text-[#070B14] dark:text-[#94A3B8] dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body Layout: Sidebar chapters on desktop / horizontal tabs on mobile */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Chapter Navigation */}
          <nav
            aria-label="Mục lục sách hướng dẫn"
            className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-[#E2ECF5] dark:border-[#182740] bg-[#F8FAFC] dark:bg-[#08101E]/80 p-2.5 flex md:flex-col gap-1.5 overflow-x-auto"
          >
            {CHAPTERS.map((chap) => {
              const isActive = chap.id === activeChapter;
              return (
                <button
                  key={chap.id}
                  type="button"
                  data-testid={`guide-tab-${chap.id}`}
                  onClick={() => setActiveChapter(chap.id)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors whitespace-nowrap md:whitespace-normal shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0284C7] text-white shadow-xs'
                      : 'text-[#334155] dark:text-[#CBD5E1] hover:bg-[#E9F1FA] dark:hover:bg-[#122038]'
                  }`}
                >
                  <span>{chap.shortLabel}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 hidden md:block shrink-0 ${
                      isActive ? 'opacity-90' : 'opacity-40'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}

            <div className="hidden md:block mt-auto pt-3 border-t border-[#E2ECF5] dark:border-[#182740] px-2 text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Mẹo: Chọn bài mẫu có sẵn như <em>&ldquo;Tháng Tư Là Lời Nói Dối Của Em&rdquo;</em> để quan sát trực tiếp cách đặt hợp âm theo từng tiếng hát.
            </div>
          </nav>

          {/* Main Chapter Reading Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="space-y-1 border-b border-[#E2ECF5] dark:border-[#182740] pb-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8]">
                {activeMeta.shortLabel}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#070B14] dark:text-[#F1F5F9]">
                {activeMeta.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] dark:text-[#94A3B8]">
                {activeMeta.subtitle}
              </p>
            </div>

            {activeChapter === 'overview' && (
              <div className="space-y-5">
                {/* 4-Step Visual Workflow */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      step: 'Bước 1',
                      icon: Sliders,
                      title: 'Chọn Khung Bài Hát (Tông · Nhịp · BPM)',
                      desc: 'Chọn Tông (ví dụ C Trưởng), Nhịp (2/4, 3/4, 4/4 hoặc 6/8), Nhạc cụ (Guitar Acoustic / Grand Piano) và tốc độ BPM.',
                    },
                    {
                      step: 'Bước 2',
                      icon: Layers,
                      title: 'Viết Lời & Đóng Khung [Hợp Âm]',
                      desc: 'Gõ lời vào ô soạn thảo và chèn tên hợp âm trong ngoặc vuông [C], [G/B], [Am] ngay trước chữ đổi hợp âm.',
                    },
                    {
                      step: 'Bước 3',
                      icon: Music,
                      title: 'Tạo Giai Điệu & Xem Piano Đang Đánh',
                      desc: 'Bấm "Gợi ý giai điệu", thu ngân nga qua Mic, hoặc bấm trực tiếp phím đàn bên dưới để tạo nốt hát.',
                    },
                    {
                      step: 'Bước 4',
                      icon: Sparkles,
                      title: 'Chọn Kiểu Rải, Điệu Đệm & Xuất File',
                      desc: 'Mở thư viện 10 kiểu rải · 21 điệu để chọn cảm xúc nhạc nền, sau đó xuất bản audio .WAV, .MIDI hoặc bản nhạc .PDF.',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-[#0369A1] dark:text-[#38BDF8] text-[11px] font-bold">
                            {item.step}
                          </span>
                          <Icon className="w-4 h-4 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                          {item.title}
                        </div>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Screen Anatomy Cheat Sheet */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-white dark:bg-[#0D192B] p-4 space-y-3">
                  <div className="text-xs font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    Bản đồ nhanh các khu vực trong Studio
                  </div>
                  <div className="space-y-2 text-xs text-[#334155] dark:text-[#CBD5E1]">
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#08101E]">
                      <span className="font-mono font-bold text-[#0284C7] shrink-0">[1] Thanh Transport</span>
                      <span>Phát cả bài / Phát đoạn, chọn chế độ Lặp, chỉnh Tông, Nhịp, Nhạc cụ, Kiểu Rải, Điệu, Pedal Ngân và BPM.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#08101E]">
                      <span className="font-mono font-bold text-[#0284C7] shrink-0">[2] Lưới Ô Nhịp</span>
                      <span>Hiển thị từng Ô (Ô 1, Ô 2...). Bấm vào từng ô để nghe riêng hợp âm hoặc đổi nhanh hợp âm mới cho ô đó.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#08101E]">
                      <span className="font-mono font-bold text-[#0284C7] shrink-0">[3] Piano Roll &amp; Phím Đàn</span>
                      <span>Khung lưới thể hiện hợp âm, nốt giai điệu chạy theo vạch đỏ + dải <strong>PIANO ĐANG ĐÁNH</strong> phát sáng trực tiếp.</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#08101E]">
                      <span className="font-mono font-bold text-[#0284C7] shrink-0">[4] Gợi Ý Hòa Âm &amp; Soi Vần</span>
                      <span>Tự đề xuất hợp âm nối tiếp hợp lý (Kinh điển / Cảm xúc / Tạo kịch tính) và soi vần cuối câu tiếng Việt.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeChapter === 'theory' && (
              <div className="space-y-5">
                {/* Key & Scale */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                      1. Tông (Key) &amp; Nút &ldquo;Khóa tông: BẬT&rdquo; là gì?
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                      Rất quan trọng cho người mới
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    Hãy tưởng tượng <strong>Tông (ví dụ C Trưởng)</strong> giống như <strong>bảng 7 màu hòa hợp</strong> của một bức tranh. Nếu chọn đúng các nốt trong 7 màu đó, giai điệu chắc chắn êm tai, không bị &ldquo;chói / phô&rdquo;.
                  </p>

                  {/* Visual C Major Scale Strip */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                    {[
                      { note: 'C (Đô)', chord: 'C', role: 'Bậc I · Chủ' },
                      { note: 'D (Rê)', chord: 'Dm', role: 'Bậc II' },
                      { note: 'E (Mi)', chord: 'Em', role: 'Bậc III' },
                      { note: 'F (Fa)', chord: 'F', role: 'Bậc IV' },
                      { note: 'G (Sol)', chord: 'G', role: 'Bậc V · Hút' },
                      { note: 'A (La)', chord: 'Am', role: 'Bậc VI' },
                      { note: 'B (Si)', chord: 'Bdim', role: 'Bậc VII' },
                    ].map((s) => (
                      <button
                        key={s.note}
                        type="button"
                        onClick={() => handlePlaySingleChord(s.chord)}
                        className="rounded-lg border border-[#CBD8E6] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-2 text-center hover:border-[#0284C7] transition-colors cursor-pointer"
                      >
                        <div className="text-[11px] font-bold text-[#070B14] dark:text-[#F1F5F9]">
                          {s.note}
                        </div>
                        <div className="text-xs font-mono font-bold text-[#0284C7] dark:text-[#38BDF8]">
                          {s.chord}
                        </div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
                          {s.role}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] text-[#0369A1] dark:text-[#38BDF8]">
                    Bấm vào từng ô bên trên để nghe thử 7 hợp âm thuộc Tông Đô Trưởng (C Major). Khi bật <strong>Khóa tông: BẬT</strong>, mọi nốt bạn bấm hoặc thu mic đều tự nắn vào đúng 7 nốt này.
                  </div>
                </div>

                {/* Time Signature & BPM */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    2. Nhịp (2/4, 3/4, 4/4, 6/8) &amp; BPM (Tốc độ)
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#070B14] dark:text-white">Nhịp 2/4</span>
                        <span className="font-mono text-[#0284C7] font-semibold">MẠNH - nhẹ</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="flex-1 text-center py-1 rounded bg-sky-600 text-white font-bold">1 (Bùm)</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#0369A1] dark:text-[#38BDF8]">2 (Chát)</span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        Gọn, đều bước. Dùng cho <strong>Ballad 2/4</strong> (<em>Tháng Tư Là Lời Nói Dối Của Em</em>), Fox, Hành khúc.
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#070B14] dark:text-white">Nhịp 3/4</span>
                        <span className="font-mono text-[#0284C7] font-semibold">MẠNH - nhẹ - nhẹ</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="flex-1 text-center py-1 rounded bg-sky-600 text-white font-bold">1 (Bùm)</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#0369A1] dark:text-[#38BDF8]">2 (Chát)</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#0369A1] dark:text-[#38BDF8]">3 (Chát)</span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        Xoay tròn dập dìu như khiêu vũ. Dùng cho <strong>Valse, Boston</strong>, nhạc trữ tình êm dịu.
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#070B14] dark:text-white">Nhịp 4/4</span>
                        <span className="font-mono text-[#0284C7] font-semibold">MẠNH - nhẹ - vừa - nhẹ</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="flex-1 text-center py-1 rounded bg-sky-600 text-white font-bold">1</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#0369A1] dark:text-[#38BDF8]">2</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-200 dark:bg-sky-900 text-[#0369A1] dark:text-sky-200 font-semibold">3</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[#0369A1] dark:text-[#38BDF8]">4</span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        Phổ biến nhất (~80% nhạc trẻ V-Pop, US-UK, Bolero, Rumba, Lofi, Disco).
                      </p>
                    </div>

                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#070B14] dark:text-white">Nhịp 6/8 &amp; BPM</span>
                        <span className="font-mono text-[#0284C7] font-semibold">1-2-3 · 4-5-6</span>
                      </div>
                      <div className="flex gap-1">
                        <span className="flex-1 text-center py-1 rounded bg-sky-600 text-white font-bold">1</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[11px]">2</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[11px]">3</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-200 dark:bg-sky-900 font-semibold">4</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[11px]">5</span>
                        <span className="flex-1 text-center py-1 rounded bg-sky-100 dark:bg-sky-950 text-[11px]">6</span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        <strong>BPM</strong> là số nhịp/phút: <strong>65–80</strong> chậm sâu lắng · <strong>85–105</strong> vừa · <strong>115+</strong> sôi động.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chords Interactive Preview */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    3. Phân biệt nhanh các loại Hợp Âm (Bấm để nghe trực tiếp)
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {CHORD_EXAMPLES.map((ex) => (
                      <div
                        key={ex.symbol}
                        className={`rounded-xl border p-3 flex flex-col justify-between gap-2 ${ex.colorClass}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-base font-mono font-bold text-[#070B14] dark:text-white">
                              {ex.symbol}
                            </div>
                            <div className="text-[11px] font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                              {ex.vibe}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePlaySingleChord(ex.symbol)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#08101E] border border-[#CBD8E6] dark:border-[#1F3557] text-[11px] font-semibold text-[#070B14] dark:text-white hover:border-[#0284C7] cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                            <span>{playingDemoLabel === ex.symbol ? 'Đang vang' : 'Nghe'}</span>
                          </button>
                        </div>
                        <p className="text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                          {ex.meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeChapter === 'grooves' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    Khác nhau giữa &ldquo;Kiểu Rải&rdquo; và &ldquo;Điệu Đệm&rdquo; là gì?
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="font-bold text-[#0284C7] dark:text-[#38BDF8]">
                        1. Kiểu Rải (Arpeggio) = Cách ngón đàn gảy
                      </div>
                      <p className="text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                        Quy định thứ tự từng nốt trong hợp âm vang lên. Ký hiệu trong app: <strong>B</strong> = nốt trầm (dây Bass 4/5/6), còn <strong>3 - 2 - 1</strong> = 3 nốt cao của hợp âm.
                      </p>
                      <div className="p-2 rounded bg-[#F1F5F9] dark:bg-[#0D192B] font-mono text-[11px] text-[#0F172A] dark:text-sky-200">
                        Ballad 2 (Quốc dân): B - 3 - 2 - 3 - 1 - 3 - 2 - 3
                      </div>
                    </div>

                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="font-bold text-[#0284C7] dark:text-[#38BDF8]">
                        2. Điệu Đệm (21 Điệu) = Nhịp &amp; Trống nền
                      </div>
                      <p className="text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                        Quyết định &ldquo;tinh thần&rdquo; tiết tấu (ví dụ <strong>Pop Ballad 4/4</strong>, <strong>1B. Ballad 2/4</strong>, <strong>Bolero</strong>, <strong>Bossa Nova</strong>, <strong>Slow Rock 6/8</strong>). Bật nút <em>Nhịp đếm</em> nếu bạn muốn nghe tiếng trống gõ cùng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Playable Comparisons */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    Ví dụ nghe so sánh trực quan (Vòng hòa âm C → G/B → Am → F)
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'ballad-demo',
                        title: 'Pop Ballad / V-Pop',
                        tag: '4/4 · 76 BPM',
                        desc: 'Rải tiến lùi mềm mại — hợp hát tự sự, nhạc trẻ nhẹ nhàng.',
                        pattern: 'ballad-wave' as const,
                        bpm: 76,
                      },
                      {
                        id: 'arp-demo',
                        title: 'Rải Móc Nhanh / Đẩy Cao Trào',
                        tag: '2/4 · 92 BPM',
                        desc: 'Tiết tấu dồn đều, chuyển mượt vào điệp khúc.',
                        pattern: 'rising-arp' as const,
                        bpm: 92,
                      },
                      {
                        id: 'falling-demo',
                        title: 'Rải Xuống Lắng Đọng',
                        tag: '3/4 · 72 BPM',
                        desc: 'Dịu dàng cho đoạn Intro hoặc kết câu hát nhỏ lại.',
                        pattern: 'falling-arp' as const,
                        bpm: 72,
                      },
                    ].map((demo) => {
                      const active = playingDemoLabel === demo.id;
                      return (
                        <div
                          key={demo.id}
                          className="rounded-xl border border-[#CBD8E6] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 flex flex-col justify-between gap-2.5"
                        >
                          <div className="space-y-1">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-[10px] font-mono font-bold text-[#0369A1] dark:text-[#38BDF8]">
                              {demo.tag}
                            </span>
                            <div className="text-xs font-bold text-[#070B14] dark:text-white">
                              {demo.title}
                            </div>
                            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                              {demo.desc}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handlePlayChordSequence(
                                demo.id,
                                ['C', 'G/B', 'Am', 'F'],
                                demo.pattern,
                                demo.bpm
                              )
                            }
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              active
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#0284C7] hover:bg-[#0369A1] text-white'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                            <span>{active ? 'Đang phát...' : 'Nghe thử vòng'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeChapter === 'lyrics-melody' && (
              <div className="space-y-5">
                {/* Inline Chord Syntax */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    1. Cách viết lời &amp; đặt [Hợp Âm] chuẩn xác
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                    Đặt tên hợp âm trong ngoặc vuông <strong>ngay trước âm tiết</strong> mà bạn muốn đổi hợp âm. App sẽ tự tạo Lưới Ô Nhịp và đồng bộ từng chữ vào trục thời gian:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-sky-200 dark:border-sky-900 bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="font-bold text-[#0369A1] dark:text-[#38BDF8]">Bạn gõ vào khung lời:</div>
                      <pre className="font-mono text-[11px] text-[#070B14] dark:text-[#E2E8F0] whitespace-pre-wrap">
                        {'[F]Mùa xuân có [G7/F]em như chưa [Em]bắt [Am]đầu\n[Dm7]Và cơn gió [G]đang khẽ mon [Am]man'}
                      </pre>
                    </div>
                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-white dark:bg-[#08101E] p-3 space-y-1.5">
                      <div className="font-bold text-emerald-700 dark:text-emerald-300">App tự chia thành ô nhịp:</div>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                        <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">Ô 1: <strong>F</strong></span>
                        <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">Ô 2: <strong>G7/F</strong></span>
                        <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">Ô 3: <strong>Em</strong></span>
                        <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">Ô 4: <strong>Am</strong></span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        Bạn cũng có thể bấm nút <strong>+F / +Am</strong> phía trên khung viết lời để chèn nhanh tại vị trí con trỏ.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Melody Creation + Piano Đang Đánh */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    2. 3 cách tạo Giai Điệu &amp; đọc bảng &ldquo;PIANO ĐANG ĐÁNH&rdquo;
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#070B14] dark:text-white">
                        <Sparkles className="w-3.5 h-3.5 text-[#0284C7]" aria-hidden="true" />
                        <span>Gợi ý giai điệu</span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        App tự viết nét giai điệu dựa trên hợp âm bạn vừa đặt và số chữ trong câu lời.
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#070B14] dark:text-white">
                        <Mic className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                        <span>Thu ngân nga</span>
                      </div>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        Cứ ngân nga giai điệu trong đầu vào micro — app bắt cao độ và nắn vừa khít tông nhạc.
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#DCE6F2] dark:border-[#1F3557] bg-white dark:bg-[#08101E] p-3 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#070B14] dark:text-white">
                        <Music className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                        <span>Màu phím đang đánh</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5 text-[10px] font-semibold">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">Cam = Bass</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">Xanh dương = Hợp âm</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">Xanh lá = Giai điệu</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vietnamese Tones & Rhyming */}
                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-4 space-y-2">
                  <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                    3. Bí quyết viết lời tiếng Việt mượt (Bằng / Trắc &amp; Soi Vần)
                  </h4>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    Trong tab <strong>Soi Vần &amp; Âm Tiết</strong>, app tự đếm số tiếng và tô màu thanh <strong>Bằng</strong> (không dấu, huyền — hợp nốt trầm/giữ dài) và thanh <strong>Trắc</strong> (sắc, hỏi, ngã, nặng — hợp nốt đi lên, nhấn cao trào). Đặt hai câu có cùng vần cuối (ví dụ: <em>chiều — nhiều — phiêu</em>) giúp bài dễ thuộc ngay từ lần nghe đầu.
                  </p>
                </div>
              </div>
            )}

            {activeChapter === 'practice' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-sm font-bold text-[#070B14] dark:text-[#F1F5F9]">
                      Bài tập 3 phút: Tự tạo 1 đoạn Điệp Khúc 8 ô nhịp cực êm
                    </h4>
                    <button
                      type="button"
                      onClick={() =>
                        handlePlayChordSequence(
                          'practice-recipe',
                          ['Fmaj7', 'G', 'Em', 'Am', 'Dm7', 'G', 'C', 'C7'],
                          'ballad-wave',
                          76
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      <span>
                        {playingDemoLabel === 'practice-recipe'
                          ? 'Đang phát mẫu 8 ô...'
                          : 'Nghe trước 8 ô mẫu'}
                      </span>
                    </button>
                  </div>

                  <ol className="space-y-2.5 text-xs text-[#1E293B] dark:text-[#E2E8F0]">
                    {[
                      'Bấm nút "+" tạo bản nháp mới, chọn Tông C Trưởng, Nhịp 4/4, Điệu "1. Ballad (Pop Ballad)", tốc độ 76 BPM.',
                      'Chọn Nhạc cụ "Guitar Acoustic" (hoặc "Grand Piano") và Kiểu rải "2. Rải tiến - lùi (Ballad 2)".',
                      'Gõ 2 câu lời vào khung soạn thảo: "[Fmaj7]Có những chiều mưa [G]rơi thật khẽ / [Em]Giữ lại chút nắng [Am]nơi góc phố / [Dm7]Dẫu biết thời gian [G]không đứng đợi / [C]Vẫn mỉm cười nhớ [C7]tháng năm xưa".',
                      'Bấm nút "Gợi ý giai điệu" để app vẽ sẵn khung nốt hát hợp với 8 hợp âm trên, rồi nhấn "Phát Cả Bài" và chỉnh lại vài nốt theo ý thích!',
                    ].map((stepText, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{stepText}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-xl border border-[#DCE6F2] dark:border-[#1E314E] bg-[#F8FAFC] dark:bg-[#0D192B] p-3.5 text-xs text-[#475569] dark:text-[#94A3B8] flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Xong đoạn nháp? Vào menu <strong>Xuất bản → Audio Demo (.WAV)</strong> để tải ngay bản thu Guitar/Piano có trống đệm về máy!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      stopProgressionAudition();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold cursor-pointer"
                  >
                    Bắt đầu sáng tác ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
