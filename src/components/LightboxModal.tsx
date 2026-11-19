import { Film, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { ArtworkItem } from '../utils/portfolioLogic.ts';

interface LightboxModalProps {
  artwork: ArtworkItem | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function LightboxModal({
  artwork,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
}: LightboxModalProps) {
  useEffect(() => {
    if (!artwork) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onNext();
      if (event.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [artwork, onClose, onNext, onPrev]);

  if (!artwork) return null;

  const isVideo = artwork.mediaType === 'video';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết tác phẩm ${artwork.title}`}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl max-h-[92vh] rounded-2xl bg-[#121113] text-[#F4F1EC] border border-[#2C2A30] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng trình xem ảnh"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white border border-white/25 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Artwork or Video Viewer */}
        <div className="lg:col-span-8 bg-[#09090B] relative flex items-center justify-center min-h-[300px] max-h-[55vh] lg:max-h-[92vh] p-4 sm:p-6">
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
              className="max-h-[50vh] lg:max-h-[82vh] w-auto rounded-lg bg-black"
            />
          ) : (
            <img
              src={artwork.src}
              alt={artwork.alt}
              width={artwork.width}
              height={artwork.height}
              referrerPolicy="no-referrer"
              className="max-h-[50vh] lg:max-h-[82vh] w-auto object-contain rounded-lg"
            />
          )}

          <button
            type="button"
            onClick={onPrev}
            aria-label="Tác phẩm trước"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-black text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Tác phẩm tiếp theo"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-black text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Curatorial Details Sidebar */}
        <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between gap-6 overflow-y-auto border-t lg:border-t-0 lg:border-l border-[#27262B]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#A8A29E] font-mono tabular-nums">
              <span className="text-[#FB7185] font-sans font-medium inline-flex items-center gap-1.5">
                {isVideo && <Film className="w-3.5 h-3.5" aria-hidden="true" />}
                {artwork.categoryLabel}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {currentIndex + 1} / {totalCount}
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F1EC] leading-tight">
                {artwork.title}
              </h3>
              <p className="text-xs text-[#A8A29E]">{artwork.subtitle}</p>
            </div>

            <p className="text-sm text-[#D6D1C9] leading-relaxed">{artwork.story}</p>
          </div>

          <dl className="space-y-3 pt-5 border-t border-[#27262B] text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-[#A8A29E]">Độ phân giải</dt>
              <dd className="font-mono tabular-nums text-[#F4F1EC] text-right">
                {artwork.specs.format}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#A8A29E]">Dung lượng tối ưu</dt>
              <dd className="font-mono tabular-nums text-emerald-400 text-right">
                {artwork.specs.fileSize}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#A8A29E]">Tỷ lệ khung hình</dt>
              <dd className="text-[#F4F1EC] text-right">{artwork.specs.aspect}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#A8A29E]">Ánh sáng</dt>
              <dd className="text-[#F4F1EC] text-right">{artwork.specs.lighting}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#A8A29E]">Chủ đề</dt>
              <dd className="text-[#F4F1EC] text-right">{artwork.specs.concept}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
