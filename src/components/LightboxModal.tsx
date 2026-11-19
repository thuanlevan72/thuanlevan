import {
  ChevronLeft,
  ChevronRight,
  Film,
  Info,
  X,
} from 'lucide-react';
import { TouchEvent, useEffect, useRef, useState } from 'react';
import { ArtworkItem } from '../utils/portfolioLogic.ts';

interface LightboxModalProps {
  artwork: ArtworkItem | null;
  artworks: ArtworkItem[];
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (index: number) => void;
}

export function LightboxModal({
  artwork,
  artworks,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onSelectIndex,
}: LightboxModalProps) {
  const [showInfo, setShowInfo] = useState(true);
  const touchStartXRef = useRef<number | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!artwork) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNext();
      if (event.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [artwork, onClose, onNext, onPrev]);

  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'auto',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  if (!artwork) return null;

  const isVideo = artwork.mediaType === 'video';

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (typeof endX !== 'number') return;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) < 48) return;
    if (deltaX < 0) {
      onNext();
    } else {
      onPrev();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết tác phẩm ${artwork.title}`}
      className="fixed inset-0 z-50 bg-[#02050B]/98 flex flex-col text-[#F1F5F9]"
      onClick={onClose}
    >
      {/* Top Studio Bar */}
      <div
        className="px-4 sm:px-6 h-14 border-b border-[#16243D] bg-[#040812]/90 flex items-center justify-between gap-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 text-xs sm:text-sm min-w-0">
          <span className="font-mono tabular-nums text-[#38BDF8] font-medium shrink-0">
            {String(currentIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-300 truncate">
            {isVideo && <Film className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />}
            <span className="truncate">{artwork.title}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowInfo((prev) => !prev)}
            aria-pressed={showInfo}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              showInfo
                ? 'bg-[#0E203C] border-[#38BDF8]/45 text-[#38BDF8]'
                : 'bg-[#070D19] border-[#1B2D4B] text-slate-300 hover:text-white'
            }`}
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{showInfo ? 'Ẩn Thông Tin' : 'Thông Tin'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình xem ảnh"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A162B] hover:bg-[#13294B] text-white border border-[#1E355A] text-xs font-medium transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Đóng</span>
          </button>
        </div>
      </div>

      {/* Main Media Stage + Optional Curatorial Drawer */}
      <div
        className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`${
            showInfo ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'
          } relative flex items-center justify-center bg-[#03060C] p-3 sm:p-6 min-h-0 overflow-hidden`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
            <video
              key={artwork.src}
              src={artwork.src}
              poster={artwork.posterSrc}
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="max-h-full max-w-full w-auto rounded-xl bg-black shadow-2xl"
            />
          ) : (
            <img
              src={artwork.src}
              alt={artwork.alt}
              width={artwork.width}
              height={artwork.height}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full w-auto object-contain rounded-xl shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)] select-none"
            />
          )}

          {totalCount > 1 && (
            <>
              <button
                type="button"
                onClick={onPrev}
                aria-label="Tác phẩm trước"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#05080F]/80 hover:bg-[#0284C7] text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onNext}
                aria-label="Tác phẩm tiếp theo"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#05080F]/80 hover:bg-[#0284C7] text-white border border-white/15 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {showInfo && (
          <aside className="lg:col-span-4 xl:col-span-3 bg-[#070E1B] border-t lg:border-t-0 lg:border-l border-[#16243D] p-5 sm:p-7 flex flex-col justify-between gap-5 overflow-y-auto max-h-[38vh] lg:max-h-none">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <span className="text-[#38BDF8] font-medium">{artwork.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{artwork.year}</span>
              </div>

              <div className="space-y-1">
                <h3 className="font-display text-2xl sm:text-[28px] font-semibold text-white leading-tight">
                  {artwork.title}
                </h3>
                <p className="text-xs text-[#94A3B8]">{artwork.subtitle}</p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{artwork.story}</p>
            </div>

            <dl className="space-y-2.5 pt-4 border-t border-[#16243D] text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8]">Định dạng</dt>
                <dd className="font-mono tabular-nums text-[#F1F5F9] text-right">
                  {artwork.specs.format}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8]">Tối ưu hóa</dt>
                <dd className="font-mono tabular-nums text-[#38BDF8] text-right">
                  {artwork.specs.fileSize}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8]">Tỷ lệ</dt>
                <dd className="font-mono tabular-nums text-[#F1F5F9] text-right">
                  {artwork.specs.aspect}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8]">Ánh sáng</dt>
                <dd className="text-[#F1F5F9] text-right">{artwork.specs.lighting}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#94A3B8]">Chủ đề</dt>
                <dd className="text-[#F1F5F9] text-right">{artwork.specs.concept}</dd>
              </div>
            </dl>
          </aside>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnail Rail */}
      {artworks.length > 1 && (
        <div
          className="px-4 py-2.5 border-t border-[#16243D] bg-[#040812]/95 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            {artworks.map((item, idx) => {
              const isCurrent = idx === currentIndex;
              const thumbSrc = item.posterSrc || item.src;
              return (
                <button
                  key={item.id}
                  ref={isCurrent ? activeThumbRef : undefined}
                  type="button"
                  onClick={() => onSelectIndex(idx)}
                  aria-label={`Chọn tác phẩm ${item.title}`}
                  aria-current={isCurrent ? 'true' : undefined}
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'border-[#38BDF8] ring-2 ring-[#38BDF8]/30 scale-105 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-90'
                  }`}
                >
                  <img
                    src={thumbSrc}
                    alt=""
                    loading="eager"
                    decoding="sync"
                    className="w-full h-full object-cover object-top"
                  />
                  {item.mediaType === 'video' && (
                    <span className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <Film className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
